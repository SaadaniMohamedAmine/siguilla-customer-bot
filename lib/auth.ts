import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { apiKey } from "@better-auth/api-key";
import { prisma } from "@/lib/db";
import { prepareAccountDeletion } from "@/lib/account";
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
      creatorRole: "owner",
      // Pas d'email : l'invitation est partagée par lien copiable (UI Phase 6).
      sendInvitationEmail: async () => {},
    }),
    apiKey({ references: "organization" }),
    nextCookies(), // toujours en dernier
  ],
});

export type Session = typeof auth.$Infer.Session;
