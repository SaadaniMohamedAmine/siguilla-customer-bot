import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { apiKey } from "@better-auth/api-key";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { prisma } from "@/lib/db";
import { prepareAccountDeletion } from "@/lib/account";
import { MEMBERS_LIMIT_CODE, hasFreeSeat } from "@/lib/billing/seats";
import { authRateRules } from "@/lib/auth-rate-limit";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/public/cors";
import {
  DEMO_READ_ONLY_MESSAGE,
  PASSWORD_RESET_REQUEST_PATHS,
  isDemoAllowedPath,
  isDemoEmail,
} from "@/lib/demo-guard";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 40);
}

// Rôles d’organisation : par défaut seul le propriétaire peut créer des clés d’API (le plugin refuse l’administrateur avec une
// erreur), alors que Sigilla réserve la gestion des clés aux propriétaires ET administrateurs ; les membres n’y ont pas accès.
const API_KEY_ACTIONS = ["create", "read", "update", "delete"] as const;
const ac = createAccessControl({ ...defaultStatements, apiKey: API_KEY_ACTIONS });
const orgRoles = {
  owner: ac.newRole({ ...ownerAc.statements, apiKey: [...API_KEY_ACTIONS] }),
  admin: ac.newRole({ ...adminAc.statements, apiKey: [...API_KEY_ACTIONS] }),
  member: ac.newRole({ ...memberAc.statements }),
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Pas de fournisseur email (zéro service supplémentaire) : le lien est journalisé côté serveur,
    // et en dev il est aussi affiché sur la page de confirmation.
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] password reset for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  hooks: {
    // La démo publique est en lecture seule : requireOrgApi({ write: true }) ne couvre que les routes
    // Sigilla, ce hook couvre les endpoints Better Auth (allowlist, deny-by-default).
    before: createAuthMiddleware(async (ctx) => {
      const demoEmail = process.env.DEMO_USER_EMAIL;

      // Anti brute-force / spam : seulement les vraies requêtes HTTP (pas les appels serveur comme /demo).
      if (ctx.request) {
        const email = (ctx.body as { email?: unknown } | undefined)?.email;
        for (const rule of authRateRules(ctx.path, clientIp(ctx.request), email)) {
          const rl = await rateLimit(rule.key, rule.limit, rule.windowMs);
          if (!rl.ok) throw new APIError("TOO_MANY_REQUESTS", { message: "rate_limited" });
        }
      }

      // Pas de réinitialisation de mot de passe visant le compte démo (requête sans session).
      if (PASSWORD_RESET_REQUEST_PATHS.includes(ctx.path)) {
        if (isDemoEmail((ctx.body as { email?: unknown } | undefined)?.email, demoEmail)) {
          throw new APIError("FORBIDDEN", { message: DEMO_READ_ONLY_MESSAGE });
        }
        return;
      }

      // Chemins sûrs : on sort avant toute requête en base.
      if (isDemoAllowedPath(ctx.path)) return;

      const session = await getSessionFromCtx(ctx);
      if (!session) return;

      let isDemo = isDemoEmail(session.user.email, demoEmail);
      if (!isDemo && session.session.activeOrganizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: session.session.activeOrganizationId },
          select: { isDemo: true },
        });
        isDemo = org?.isDemo === true;
      }
      if (isDemo) throw new APIError("FORBIDDEN", { message: DEMO_READ_ONLY_MESSAGE });
    }),
  },
  user: {
    deleteUser: {
      enabled: true,
      // Transfère/supprime les organisations avant que Better Auth ne supprime l'utilisateur
      // (sinon le cascade Prisma retirerait juste les memberships, sans gérer l'ownership).
      beforeDelete: async (user) => {
        await prepareAccountDeletion(user.id);
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Chaque nouvel utilisateur reçoit une organisation personnelle (owner).
        after: async (user) => {
          const base = slugify(user.name || user.email.split("@")[0]) || "maison";
          await auth.api.createOrganization({
            body: {
              name: `${user.name || "My"}'s Org`,
              slug: `${base}-${user.id.slice(-6)}`,
              userId: user.id,
            },
          });
        },
      },
    },
    session: {
      create: {
        // Active automatiquement la première organisation de l'utilisateur.
        before: async (session) => {
          const membership = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });
          return { data: { ...session, activeOrganizationId: membership?.organizationId ?? null } };
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles: orgRoles,
      creatorRole: "owner",
      // Pas d'email : l'invitation est partagée par lien copiable (UI Phase 6).
      sendInvitationEmail: async () => {},
      organizationHooks: {
        // La limite de membres du plan est appliquée côté serveur (l'UI seule se contourne avec un appel API).
        // Un siège = un membre ou une invitation en attente.
        beforeCreateInvitation: async ({ organization }) => {
          const [org, members, pending] = await Promise.all([
            prisma.organization.findUnique({ where: { id: organization.id }, select: { plan: true } }),
            prisma.member.count({ where: { organizationId: organization.id } }),
            prisma.invitation.count({ where: { organizationId: organization.id, status: "pending" } }),
          ]);
          if (!hasFreeSeat(members + pending, org?.plan ?? "free")) {
            throw new APIError("FORBIDDEN", { message: MEMBERS_LIMIT_CODE });
          }
        },
        // Une invitation créée avant une rétrogradation ne doit pas dépasser la limite du plan actuel.
        beforeAcceptInvitation: async ({ organization }) => {
          const [org, members] = await Promise.all([
            prisma.organization.findUnique({ where: { id: organization.id }, select: { plan: true } }),
            prisma.member.count({ where: { organizationId: organization.id } }),
          ]);
          if (!hasFreeSeat(members, org?.plan ?? "free")) {
            throw new APIError("FORBIDDEN", { message: MEMBERS_LIMIT_CODE });
          }
        },
      },
    }),
    // Notre propre limiteur (lib/api-auth.ts : 60 requêtes/min/clé) fait foi ; celui du plugin vaut 10 requêtes par 24 h par défaut
    // et répondait « clé invalide » dès la 11e requête de la journée.
    apiKey({ references: "organization", rateLimit: { enabled: false } }),
    nextCookies(), // toujours en dernier
  ],
});

export type Session = typeof auth.$Infer.Session;
