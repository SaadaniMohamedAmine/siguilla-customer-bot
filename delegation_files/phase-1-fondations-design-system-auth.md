# Sigilla — Phase 1 : Fondations, design system & auth

> **Fichier de délégation 1/8.** Spec complète, checklist et code de référence. Aucun aller-retour attendu : toutes les décisions sont tranchées ici ou dans les documents de référence. Si un point n'est pas couvert, choisis l'option la plus simple compatible avec le PRD, note-la dans `DECISIONS.md` et continue.

---

## 0. À lire avant de commencer (obligatoire)

| Document | Chemin | Usage |
|---|---|---|
| PRD | `./SIGILLA-PRD.md` | Source de vérité produit (stack, modèle de données, plans, branding) |
| Audit design | `./project-07-sigilla-design-audit-recommendations.md` | Corrections à appliquer aux écrans Stitch (tokens, icônes, copy) |
| Écrans Stitch | `./stitch_sigilla_luxury_ai_platform/<écran>/screen.png` | **Référence de mise en page uniquement** |
| Repo de référence | `../excerpta-chatbot-document/` | Conventions et code réutilisé (même machine, dossier voisin) |
| Suivi | `./PROGRESS.md` | À cocher à la fin de la phase |

### Règles non négociables (valables pour TOUTES les phases)
1. **0 $ et zéro maintenance** : aucun service payant, aucun cron, aucun service qui se met en pause. Services autorisés : Vercel, Neon, Groq, Gemini, Stripe (mode test), Notion API.
2. **Dernières versions stables** : avant chaque `npm install`, vérifie avec `npm view <pkg> version`. N'installe jamais de version `beta`/`canary`.
3. **Stitch = référence visuelle seulement.** Ne copie **jamais** leur `tailwind.config`, les classes MD3 (`bg-surface-container-*`, `text-on-surface`, `bg-primary`…), ni les **Material Symbols**. Utilise uniquement les tokens Sigilla (§3.4) et Hugeicons (§3.6).
4. **Bordeaux = fond uniquement** (`bg-accent`). Jamais `text-accent` sur fond sombre.
5. **Wordmark texte seul** « Sigilla », jamais d'icône à côté.
6. **Copy** : ton « maître d'hôtel » (posé, précis, chaleureux, bref), pas de point d'exclamation, pas d'emoji. Tout texte UI passe par `messages/en.json` + `messages/fr.json`.
7. **Pas de Material, pas de bleu, pas de glassmorphism**, pas de `filter: blur` coûteux.
8. **Commits** : conventionnels (`feat:`, `fix:`, `chore:`), un commit par tâche cochée ou groupe cohérent.
9. **Si une API d'un package diffère de ce fichier** (version plus récente) : lis la doc / les types dans `node_modules`, adapte en gardant le même comportement, note l'écart dans `DECISIONS.md`.

---

## 1. Spec de la phase

**Objectif :** un projet Next.js déployé sur Vercel dès le jour 1, avec le design system Sigilla complet (tokens, polices, icônes, composants), l'i18n EN/FR, l'app shell, et l'authentification multi-tenant (Better Auth + organisations). À la fin : on peut créer un compte, atterrir dans une organisation personnelle, voir l'app shell vide, changer de thème et de langue, et une page `/design-system` montre tous les composants.

**Dépendances :** aucune.

**Hors scope de cette phase :** modèles métier (Chatbot, DataSource… → Phase 2), RAG (Phase 3), widget (Phase 4), Stripe (Phase 6), landing (Phase 7).

**Écrans Stitch de référence pour cette phase :**
- `sigilla_sign_in_screen_5`, `sigilla_sign_up_screen_6`, `sigilla_password_recovery_reset_screen_7`
- `sigilla_agents_list_empty_state_screen_10` (app shell + état vide)
- `sigilla_brand_assets_visual_identity_sheet` (wordmark, favicon, loaders)
- `sigilla_system_states_sheet_screen_20` (404, erreur, toasts, skeletons)

---

## 2. Checklist

### 2.1 Comptes & environnement (à faire par l'humain si l'agent n'a pas accès — l'agent prépare `.env.example` et la checklist)
- [ ] Repo GitHub `sigilla-customer-bot` (privé ou public)
- [ ] Projet Vercel relié au repo (Hobby)
- [ ] Projet Neon (free) → `DATABASE_URL` (connexion **pooled**)
- [ ] Clé Groq → `GROQ_API_KEY`
- [ ] Clé Google AI Studio → `GEMINI_API_KEY`
- [ ] OAuth Google (Cloud Console) → `GOOGLE_CLIENT_ID/SECRET`, redirect `http://localhost:3000/api/auth/callback/google` + URL prod
- [ ] OAuth GitHub (Developer settings) → `GITHUB_CLIENT_ID/SECRET`, callback `/api/auth/callback/github`
- [ ] Stripe compte en **mode test** (clés utilisées en Phase 6)
- [ ] Notion « public integration » (utilisée en Phase 2)

### 2.2 Tâches de build
- [ ] Init Next.js 16 + React 19 + TS strict + npm (conventions Excerpta)
- [ ] `AGENTS.md`, `CLAUDE.md`, ESLint flat config, Prettier, `.gitignore`, `.editorconfig`
- [ ] Repo GitHub + premier commit
- [ ] **Déploiement Vercel précoce** — URL live dès le jour 1
- [ ] Tailwind CSS v4 + tokens Noir Bordeaux (dark-first + light)
- [ ] `next/font` : Instrument Serif, Instrument Sans, JetBrains Mono
- [ ] Hugeicons Free (Stroke Rounded, 1.5px) + composant `Icon`
- [ ] Composants UI de base (liste §3.7)
- [ ] Composant `CitationSeal`
- [ ] Wordmark, favicon « S », apple-touch-icon, `manifest.webmanifest`
- [ ] Theme toggle (next-themes) dans le menu utilisateur
- [ ] i18n next-intl EN + FR
- [ ] App shell (sidebar, switcher d'organisation, breadcrumb, menu utilisateur, plan chip)
- [ ] Prisma 7 + Neon + `prisma.config.ts` + `lib/db.ts`
- [ ] Better Auth (email/mot de passe + Google + GitHub)
- [ ] Plugin `organization` (org perso auto, switcher, rôles, invitations par lien)
- [ ] Pages sign-in, sign-up, forgot, reset
- [ ] `proxy.ts` + vérification serveur de session
- [ ] 404, `error.tsx`, `loading.tsx`
- [ ] Micro-interactions (transitions, hover, focus visibles, reduced motion)

---

## 3. Implémentation

### 3.1 Scaffold

Le dossier courant (`sigilla-customer-bot/`) contient déjà des docs et le dossier Stitch. Scaffolde **à côté** puis déplace :

```bash
cd ..
npx create-next-app@latest sigilla-scaffold --typescript --eslint --app --no-src-dir --import-alias "@/*" --use-npm --tailwind --yes
# Copie tout le contenu de sigilla-scaffold/ dans sigilla-customer-bot/ (sans écraser les .md existants), puis supprime sigilla-scaffold/
cd sigilla-customer-bot
```

Vérifie ensuite dans `package.json` : `next` 16.x, `react` 19.x, `tailwindcss` 4.x. Supprime `app/globals.css` généré (on utilise `styles/globals.css`, convention Excerpta).

Dépendances :

```bash
npm install better-auth @better-auth/api-key @prisma/client @prisma/adapter-pg next-intl next-themes \
  @hugeicons/react @hugeicons/core-free-icons \
  @radix-ui/react-slot @radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-tabs \
  @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-avatar \
  class-variance-authority clsx tailwind-merge react-toastify zod @tanstack/react-query
npm install -D prisma dotenv tsx prettier prettier-plugin-tailwindcss eslint-config-prettier
```

### 3.2 Fichiers de config

`package.json` → scripts (calqués sur Excerpta + ajouts) :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

`eslint.config.mjs` (copie Excerpta + ignores) :

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**", "out/**", "build/**", "next-env.d.ts",
    "public/widget/**",
    "stitch_sigilla_luxury_ai_platform/**",
    ".remember/**",
  ]),
]);
```

`.prettierrc` :

```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 110, "plugins": ["prettier-plugin-tailwindcss"] }
```

`.editorconfig` :

```
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
charset = utf-8
```

`.gitignore` : reprends celui d'Excerpta (`../excerpta-chatbot-document/.gitignore`) tel quel.

`AGENTS.md` : laisse le bloc généré par `next dev`, puis ajoute en dessous :

```md
## Sigilla — règles projet
- Source de vérité : SIGILLA-PRD.md + project-07-sigilla-design-audit-recommendations.md.
- Écrans Stitch = mise en page uniquement ; jamais de classes MD3 ni de Material Symbols.
- Tokens : bg, surface, surface-raised, border, text, text-muted, accent (fond uniquement), accent-hover, on-accent, link, focus, tint, success, warning, error.
- Icônes : Hugeicons via components/ui/icon.tsx.
- Tout texte UI dans messages/en.json + messages/fr.json.
- 0 $, zéro maintenance : pas de cron, pas de nouveau service externe.
```

`CLAUDE.md` : `@AGENTS.md`

`tsconfig.json` : identique à Excerpta (`strict: true`, `paths: {"@/*": ["./*"]}`), ajoute `"exclude": ["node_modules", "stitch_sigilla_luxury_ai_platform", "widget"]` (le widget a son propre tsconfig en Phase 4).

`next.config.ts` (base Excerpta, les externals PDF arrivent en Phase 2) :

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  devIndicators: { position: "top-right" },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin()(nextConfig);
```

`postcss.config.mjs` :

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

### 3.3 Variables d'environnement — `.env.example` (complet pour tout le projet)

```bash
# .env.example — copier en .env.local (jamais commité)

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- Database (Neon Postgres, connexion pooled, sslmode=require) ---
DATABASE_URL=

# --- Better Auth ---
# openssl rand -base64 32
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# --- OAuth ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# --- IA (gratuit) — noms de modèles en variables : en cas de retrait d'un modèle, on change la variable, pas le code ---
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=
GEMINI_CHAT_MODEL=gemini-3.7-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2

# --- Stockage (Vercel Blob) ---
BLOB_READ_WRITE_TOKEN=

# --- Notion (public integration) ---
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# --- Sécurité interne ---
# openssl rand -base64 32  (AES-256-GCM pour les tokens Notion)
ENCRYPTION_KEY=
# openssl rand -hex 32  (signature des auto-invocations d'ingestion)
INGESTION_HMAC_SECRET=

# --- Stripe (MODE TEST uniquement) ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_TEAM=

# --- Garde-fous free tier ---
MAX_TOTAL_CHUNKS=60000
MAX_PDF_MB=10

# --- Démo ---
DEMO_USER_EMAIL=demo@sigilla.app
DEMO_USER_PASSWORD=
DEMO_ORG_SLUG=maison-demo
# Clé publique de l'agent de démo affiché sur la landing (rempli après le seed, Phase 7)
NEXT_PUBLIC_LANDING_BOT_KEY=
# Affiche le lien « Explore the live demo » (true une fois le seed exécuté, Phase 7)
NEXT_PUBLIC_DEMO_ENABLED=false

# --- Marketing (optionnel) ---
NEXT_PUBLIC_AUTHOR_URL=
NEXT_PUBLIC_CONTACT_EMAIL=
```

### 3.4 Tokens — `styles/globals.css` (Tailwind v4)

```css
/* styles/globals.css */
@import "tailwindcss";

/* Ne jamais scanner les exports Stitch (classes MD3 / valeurs arbitraires) */
@source not "../stitch_sigilla_luxury_ai_platform";
@source not "../widget";

@custom-variant dark (&:where(.dark, .dark *));

/* Light */
:root {
  --bg: #faf6f2;
  --surface: #ffffff;
  --surface-raised: #f4ede8;
  --border: #e8ded8;
  --text: #1a1214;
  --text-muted: #6b5a5d;
  --accent: #8a2438;
  --accent-hover: #741d2f;
  --on-accent: #ffffff;
  --link: #8a2438;
  --focus: #8a2438;
  --tint: #f3dde1;
  --success: #2f7a4d;
  --warning: #85590c;
  --error: #b3261e;
  --shadow-lift: 0 16px 40px -12px rgb(26 18 20 / 0.18);
}

/* Dark (thème par défaut) */
.dark {
  --bg: #0e0a0b;
  --surface: #171113;
  --surface-raised: #201719;
  --border: #2e2225;
  --text: #f3ece6;
  --text-muted: #a8999a;
  --accent: #9e2f45;
  --accent-hover: #872538;
  --on-accent: #f3ece6;
  --link: #e3b3ba;
  --focus: #e3b3ba;
  --tint: rgb(227 179 186 / 0.08);
  --success: #6fbf8e;
  --warning: #e0b05c;
  --error: #e5675f;
  --shadow-lift: 0 16px 40px -12px rgb(0 0 0 / 0.6);
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-on-accent: var(--on-accent);
  --color-link: var(--link);
  --color-focus: var(--focus);
  --color-tint: var(--tint);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);

  --font-serif: var(--font-instrument-serif), Georgia, serif;
  --font-sans: var(--font-instrument-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  --radius-sm: 0.25rem;  /* contrôles */
  --radius-md: 0.5rem;   /* cartes */
  --radius-lg: 0.75rem;  /* drawers, modales */

  --shadow-lift: var(--shadow-lift);

  /* Échelle typographique (DESIGN.md Stitch, validée par l'audit) */
  --text-display: 3.5rem;   --text-display--line-height: 4rem;     --text-display--letter-spacing: -0.02em;
  --text-h1: 2.5rem;        --text-h1--line-height: 3rem;          --text-h1--letter-spacing: -0.015em;
  --text-h2: 1.75rem;       --text-h2--line-height: 2.25rem;
  --text-h3: 1.375rem;      --text-h3--line-height: 1.75rem;
  --text-kpi: 3rem;         --text-kpi--line-height: 3rem;         --text-kpi--letter-spacing: -0.03em;
  --text-body-lg: 1.0625rem; --text-body-lg--line-height: 1.625rem;
  --text-body: 0.875rem;    --text-body--line-height: 1.375rem;
  --text-small: 0.75rem;    --text-small--line-height: 1.125rem;
  --text-label: 0.6875rem;  --text-label--line-height: 0.875rem;   --text-label--letter-spacing: 0.08em;

  --ease-lux: cubic-bezier(0.16, 1, 0.3, 1);
}

@layer base {
  * { border-color: var(--border); }
  html { color-scheme: dark; }
  html:not(.dark) { color-scheme: light; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  ::selection { background: var(--tint); color: var(--text); }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: var(--radius-sm); }
  html { scrollbar-color: var(--border) transparent; scrollbar-width: thin; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
}

@utility label-caps {
  font-family: var(--font-sans);
  font-size: var(--text-label);
  line-height: var(--text-label--line-height);
  letter-spacing: var(--text-label--letter-spacing);
  text-transform: uppercase;
  font-weight: 600;
  color: var(--text-muted);
}

@utility hairline { border-width: 1px; border-color: var(--border); }
```

> Usage : `bg-bg`, `bg-surface`, `bg-surface-raised`, `border-border`, `text-text`, `text-text-muted`, `bg-accent hover:bg-accent-hover text-on-accent`, `text-link`, `bg-tint`, `font-serif text-h1`, `label-caps`. **Interdit : `text-accent`.**

### 3.5 Polices — `lib/fonts.ts`

```ts
import { Instrument_Serif, Instrument_Sans, JetBrains_Mono } from "next/font/google";

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"], weight: ["400"], style: ["normal", "italic"],
  variable: "--font-instrument-serif", display: "swap",
});
export const instrumentSans = Instrument_Sans({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-instrument-sans", display: "swap",
});
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"], weight: ["400", "500"],
  variable: "--font-jetbrains-mono", display: "swap",
});
```

### 3.6 Icônes — `components/ui/icon.tsx`

```tsx
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type IconProps = Omit<HugeiconsIconProps, "strokeWidth" | "color"> & { className?: string; label?: string };

/** Seul point d'entrée pour les icônes. Stroke Rounded, trait 1.5px, couleur héritée. */
export function Icon({ size = 18, className, label, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      size={size}
      strokeWidth={1.5}
      color="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    />
  );
}
```

`lib/icons.ts` — **registre unique** (importer les icônes ici, jamais ailleurs). Noms tirés de l'audit §2 ; **vérifie chaque nom** avec `grep -o "export declare const <Nom>" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts` (ou l'index du package) et remplace par l'équivalent le plus proche s'il n'existe pas :

```ts
export {
  Tick02Icon as CheckIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  UserIcon,
  UserAdd01Icon as UserAddIcon,
  SlidersHorizontalIcon as TuneIcon,
  CheckmarkBadge01Icon as SealIcon,
  Shield01Icon as ShieldIcon,
  ArrowRight01Icon as ChevronRightIcon,
  ArrowDown01Icon as ChevronDownIcon,
  ArrowUpDownIcon as UnfoldIcon,
  ArrowRight02Icon as ArrowRightIcon,
  ArrowUp02Icon as ArrowUpIcon,
  ArrowLeft02Icon as ArrowLeftIcon,
  RefreshIcon,
  AiChat02Icon as AgentIcon,
  CustomerSupportIcon as HumanIcon,
  BubbleChatIcon as ConversationIcon,
  Delete02Icon as DeleteIcon,
  Cancel01Icon as CloseIcon,
  Pdf01Icon as PdfIcon,
  File01Icon as FileIcon,
  Link01Icon as LinkIcon,
  Globe02Icon as GlobeIcon,
  LockIcon,
  Key01Icon as KeyIcon,
  Copy01Icon as CopyIcon,
  Add01Icon as AddIcon,
  Search01Icon as SearchIcon,
  Analytics01Icon as AnalyticsIcon,
  Book02Icon as DocsIcon,
  Download01Icon as DownloadIcon,
  Upload01Icon as UploadIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  Sun03Icon as SunIcon,
  Moon02Icon as MoonIcon,
  Alert02Icon as WarningIcon,
  AlertCircleIcon as ErrorIcon,
  InformationCircleIcon as InfoIcon,
  Settings02Icon as SettingsIcon,
  Logout01Icon as LogoutIcon,
  MoreVerticalIcon as KebabIcon,
  ViewIcon as EyeIcon,
  ViewOffIcon as EyeOffIcon,
  GoogleIcon,
  GithubIcon,
  NotionIcon,
  Mail01Icon as MailIcon,
  SentIcon as SendIcon,
} from "@hugeicons/core-free-icons";
```

### 3.7 Composants UI (`components/ui/`)

Tous en TypeScript, `cn()` (copie `lib/utils.ts` d'Excerpta), CVA pour les variantes, Radix pour l'accessibilité. **Aucune couleur en dur** : uniquement les tokens §3.4.

`button.tsx` (code complet) :

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-sans text-body font-medium transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ease-lux)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-hover",
        ghost: "border border-border bg-transparent text-text hover:bg-surface hover:border-focus",
        subtle: "bg-surface-raised text-text hover:bg-surface",
        link: "h-auto px-0 text-link underline-offset-4 hover:underline",
        destructive: "border border-error/40 bg-transparent text-error hover:bg-error/10",
      },
      size: {
        sm: "h-8 px-3 text-small",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-body-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
```

`citation-seal.tsx` (spec unique de l'audit §3 — utilisé partout : widget, playground, conversations, landing) :

```tsx
"use client";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export type CitationSource = { index: number; title: string; locator?: string | null; url?: string | null };

export function CitationSeal({ source, className }: { source: CitationSource; className?: string }) {
  const label = `${source.title}${source.locator ? ` — ${source.locator}` : ""}`;
  const seal = (
    <span
      className={cn(
        "mx-[2px] inline-flex h-4 min-w-4 translate-y-[-1px] items-center justify-center rounded-full bg-accent px-[3px] align-middle font-mono text-[10px] leading-none font-medium text-on-accent outline-none focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
      tabIndex={0}
      aria-label={`Source ${source.index}: ${label}`}
    >
      {source.index}
    </span>
  );
  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>{seal}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-sm border border-border bg-surface-raised px-3 py-2 text-small text-text shadow-[var(--shadow-lift)]"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Ligne « Sealed by N sources — … » sous une réponse. */
export function SealedBy({ sources, label }: { sources: CitationSource[]; label: string }) {
  if (sources.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-small text-text-muted">
      <span>{label}</span>
      {sources.map((s, i) => (
        <span key={s.index} className="inline-flex items-center gap-1">
          <span className="font-mono text-[10px]">{s.index}</span>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="text-link underline-offset-4 hover:underline">
              {s.title}
              {s.locator ? ` — ${s.locator}` : ""}
            </a>
          ) : (
            <span className="text-link">{s.title}{s.locator ? ` — ${s.locator}` : ""}</span>
          )}
          {i < sources.length - 1 ? <span aria-hidden>·</span> : null}
        </span>
      ))}
    </p>
  );
}
```

`wordmark.tsx` :

```tsx
import { cn } from "@/lib/utils";
export function Wordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "text-[20px]", md: "text-[26px]", lg: "text-[40px]", xl: "text-[72px]" } as const;
  return (
    <span className={cn("font-serif leading-none tracking-[0.01em] text-text select-none", sizes[size], className)}>
      Sigilla
    </span>
  );
}
```

`avatar.tsx` (correction C1 de l'audit — **jamais de fond rose**) :

```tsx
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export function Avatar({ src, name, size = 32, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <AvatarPrimitive.Root
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised", className)}
      style={{ width: size, height: size }}
    >
      {src ? <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" /> : null}
      <AvatarPrimitive.Fallback className="font-sans text-small font-medium text-text" delayMs={src ? 300 : 0}>
        {initials || "·"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
```

`status-pill.tsx` :

```tsx
import { cn } from "@/lib/utils";
type Tone = "neutral" | "success" | "warning" | "error" | "accent";
const dot: Record<Tone, string> = { neutral: "bg-text-muted", success: "bg-success", warning: "bg-warning", error: "bg-error", accent: "bg-link" };
export function StatusPill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-text", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} aria-hidden />
      {children}
    </span>
  );
}
```

**Autres composants à créer** (même conventions, Radix quand interactif) :

| Fichier | Spécification |
|---|---|
| `input.tsx` / `textarea.tsx` | `h-10 rounded-sm border border-border bg-surface px-3 text-body text-text placeholder:text-text-muted focus-visible:border-focus`, label au-dessus en `label-caps`, message d'erreur `text-small text-error` + `aria-invalid`/`aria-describedby` |
| `password-input.tsx` | Input + bouton œil (`EyeIcon`/`EyeOffIcon`), `aria-pressed` |
| `select.tsx` | Radix Select, contenu `bg-surface-raised border-border`, item actif `bg-tint` |
| `card.tsx` | `rounded-md border border-border bg-surface p-6` ; sous-composants `CardHeader` (titre `font-serif text-h3`), `CardContent`, `CardFooter` |
| `badge.tsx` | `rounded-full bg-surface-raised border border-border px-2 py-0.5 text-small` ; variante `accent` = `bg-accent text-on-accent` |
| `dropdown-menu.tsx` | Radix, `bg-surface-raised border-border shadow-[var(--shadow-lift)]`, items `hover:bg-tint` |
| `dialog.tsx` | Radix Dialog, overlay `bg-black/60`, contenu `rounded-lg bg-surface-raised border-border`, animation fade+scale 200ms `--ease-lux` |
| `drawer.tsx` | Radix Dialog en panneau droit `w-[480px]`, slide-in 250ms |
| `tabs.tsx` | Radix Tabs, onglet actif = texte `text-text` + soulignement 1px `bg-link`, inactif `text-text-muted` |
| `tooltip.tsx` | `TooltipProvider` exporté (à monter dans le layout racine) |
| `switch.tsx` | Radix Switch, piste `bg-surface-raised`, active `bg-accent` |
| `toast.tsx` | Wrapper `react-toastify` stylé : fond `surface-raised`, bordure `border`, liseré gauche 2px couleur sémantique, icône Hugeicons, pas de barre de progression |
| `skeleton.tsx` | `animate-pulse rounded-sm bg-surface-raised` |
| `empty-state.tsx` | Icône 28px `text-text-muted`, titre `font-serif text-h3`, texte `text-text-muted`, CTA optionnel |
| `kbd.tsx` | `font-mono text-[11px] border border-border rounded-sm px-1.5` |

### 3.8 Thème, i18n, layout racine

`components/theme-provider.tsx` : copie Excerpta.

`i18n/locales.ts`, `i18n/request.ts`, `lib/actions/locale.ts` : **copie à l'identique** depuis Excerpta (locale par cookie, pas de routing par locale). `global.d.ts` : copie Excerpta.

`app/layout.tsx` :

```tsx
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { instrumentSerif, instrumentSans, jetbrainsMono } from "@/lib/fonts";
import "@/styles/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const DESCRIPTION = "No-code AI support agents, trained on your docs and embedded anywhere in one line.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Sigilla — Every answer, sealed by its source.", template: "%s — Sigilla" },
  description: DESCRIPTION,
  applicationName: "Sigilla",
  openGraph: { title: "Sigilla", description: DESCRIPTION, url: SITE_URL, siteName: "Sigilla", type: "website" },
  twitter: { card: "summary_large_image", title: "Sigilla", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0E0A0B" },
    { media: "(prefers-color-scheme: light)", color: "#FAF6F2" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning
      className={`${instrumentSerif.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <QueryProvider>
              <TooltipProvider>
                {children}
                <ToastContainer position="bottom-right" hideProgressBar closeButton={false} theme="dark" />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`components/query-provider.tsx` : `"use client"`, `QueryClient` créé avec `useState`, `defaultOptions.queries = { staleTime: 15_000, refetchOnWindowFocus: false }`.

**Messages** — structure de départ (`messages/en.json`, traduire tout en FR dans `fr.json`) :

```json
{
  "Common": { "save": "Save", "cancel": "Cancel", "continue": "Continue", "back": "Back", "delete": "Delete", "copy": "Copy", "copied": "Copied", "retry": "Try again", "loading": "Loading…", "learnMore": "Learn more" },
  "Nav": { "agents": "Agents", "conversations": "Conversations", "analytics": "Analytics", "settings": "Settings", "docs": "Docs", "signOut": "Sign out", "theme": "Theme", "dark": "Dark", "light": "Light", "language": "Language" },
  "Auth": {
    "signInTitle": "Welcome back", "signInSubtitle": "Sign in to your agents and conversations.",
    "signUpTitle": "Create your account", "signUpSubtitle": "Your first agent is a few minutes away.",
    "name": "Full name", "email": "Work email", "password": "Password", "forgot": "Forgot password?",
    "signIn": "Sign in", "signUp": "Create account", "or": "or", "google": "Continue with Google", "github": "Continue with GitHub",
    "noAccount": "New to Sigilla?", "createAccount": "Create an account", "haveAccount": "Already have an account?",
    "exploreDemo": "Explore the live demo",
    "quote": "Every answer, sealed by its source.",
    "forgotTitle": "Reset your password", "forgotSubtitle": "We'll send a reset link to your email.", "sendLink": "Send reset link",
    "forgotSent": "If an account exists, a reset link is on its way.",
    "resetTitle": "Choose a new password", "resetSubmit": "Update password", "resetDone": "Your password has been updated.",
    "legal": "By creating an account, you agree to our {terms} and {privacy}.", "terms": "Terms", "privacy": "Privacy",
    "strength": { "weak": "Weak", "fair": "Fair", "strong": "Strong" },
    "errors": { "invalid": "Email or password is incorrect.", "exists": "An account with this email already exists.", "generic": "Something went wrong on our side. Please try again." }
  },
  "Errors": { "notFoundTitle": "This page has left the house.", "notFoundCta": "Return home", "genericTitle": "Something went wrong on our side.", "genericBody": "Please try again in a moment." },
  "Empty": { "agentsTitle": "Your first agent awaits.", "agentsBody": "Create an agent, add your documentation, and embed it in one line.", "agentsCta": "Create an agent" }
}
```

### 3.9 Base de données & Prisma

Copie depuis Excerpta : `prisma.config.ts` et `lib/db.ts` **à l'identique**.

`prisma/schema.prisma` (Phase 1 = tables auth + organisation uniquement ; la Phase 2 ajoute le reste) :

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
```

Puis génère les modèles Better Auth (avec les plugins `organization` et `apiKey` déjà déclarés dans `lib/auth.ts`, §3.10) :

```bash
npx @better-auth/cli@latest generate --config lib/auth.ts --output prisma/schema.prisma
```

> Si la CLI a changé de nom dans la version installée (ex. `npx auth generate`), utilise la commande indiquée par la doc Better Auth. Résultat attendu : modèles `User`, `Session` (avec `activeOrganizationId`), `Account`, `Verification`, `Organization`, `Member`, `Invitation`, `Apikey`.

Ajoute ensuite **à la main** dans `model Organization` (Better Auth ignore les colonnes supplémentaires) :

```prisma
  // --- Billing (Stripe, test mode) — Phase 6 ---
  plan                     String    @default("free") // free | pro | team
  stripeCustomerId         String?   @unique
  stripeSubscriptionId     String?   @unique
  stripeSubscriptionStatus String?
  messageCount             Int       @default(0)
  usagePeriodStart         DateTime  @default(now())
  isDemo                   Boolean   @default(false)
```

```bash
npm run db:push
```

### 3.10 Better Auth — `lib/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { prisma } from "@/lib/db";

function slugify(input: string) {
  return input.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 40);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Pas de fournisseur email (zéro service supplémentaire) : le lien est journalisé côté serveur,
    // et en dev il est aussi affiché sur la page de confirmation (voir §3.12).
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] password reset for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: { clientId: process.env.GOOGLE_CLIENT_ID as string, clientSecret: process.env.GOOGLE_CLIENT_SECRET as string },
    github: { clientId: process.env.GITHUB_CLIENT_ID as string, clientSecret: process.env.GITHUB_CLIENT_SECRET as string },
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  databaseHooks: {
    user: {
      create: {
        // Chaque nouvel utilisateur reçoit une organisation personnelle (owner).
        after: async (user) => {
          const base = slugify(user.name || user.email.split("@")[0]) || "maison";
          await auth.api.createOrganization({
            body: { name: `${user.name?.split(" ")[0] || "My"}'s Maison`, slug: `${base}-${user.id.slice(-6)}`, userId: user.id },
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
```

> ⚠️ Vérifie dans les types installés que `apiKey` accepte `references: "organization"`. Sinon, utilise `apiKey()` et stocke `organizationId` dans `metadata` à la création (Phase 6) — note-le dans `DECISIONS.md`.
> ⚠️ Si le hook `user.create.after` s'exécute avant que la session soit créée, la création d'org via `userId` (server-only) est le comportement prévu par la doc.

`lib/auth-client.ts` :

```ts
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient(), apiKeyClient()],
});
export const { useSession, signIn, signOut, signUp, useActiveOrganization, useListOrganizations } = authClient;
```

`app/api/auth/[...all]/route.ts` : copie Excerpta.

`lib/session.ts` — **helper serveur unique** utilisé par toutes les routes et pages :

```ts
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Pages : redirige vers /sign-in si non connecté. Retourne user + organisation active. */
export async function requireOrgPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect("/sign-in");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const member = await prisma.member.findFirstOrThrow({ where: { organizationId: orgId, userId: session.user.id } });
  return { user: session.user, org, role: member.role as "owner" | "admin" | "member" };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Routes API : lève HttpError 401/403. Chaque requête métier DOIT filtrer par org.id. */
export async function requireOrgApi(opts?: { write?: boolean }) {
  const session = await getSession();
  if (!session?.user) throw new HttpError(401, "Unauthorized");
  const orgId = session.session.activeOrganizationId;
  if (!orgId) throw new HttpError(403, "No active organization");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const member = await prisma.member.findFirst({ where: { organizationId: orgId, userId: session.user.id } });
  if (!member) throw new HttpError(403, "Forbidden");
  if (opts?.write && org.isDemo) throw new HttpError(403, "The demo is read-only.");
  return { user: session.user, org, role: member.role as "owner" | "admin" | "member" };
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error("[api]", error);
  return Response.json({ error: "Internal error" }, { status: 500 });
}
```

### 3.11 `proxy.ts`

Base Excerpta, routes Sigilla :

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
const DEFAULT_APP_ROUTE = "/agents";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (!sessionCookie && !isAuthRoute) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  if (sessionCookie && isAuthRoute && !pathname.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL(DEFAULT_APP_ROUTE, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/agents/:path*", "/conversations/:path*", "/analytics/:path*", "/settings/:path*", "/design-system",
    "/sign-in", "/sign-up", "/forgot-password", "/reset-password"],
};
```

### 3.12 Routes & pages

```
app/
  (auth)/layout.tsx              # split 55/45 (écran 5)
  (auth)/sign-in/page.tsx
  (auth)/sign-up/page.tsx
  (auth)/forgot-password/page.tsx
  (auth)/reset-password/page.tsx # lit ?token=
  (app)/layout.tsx               # AppShell, appelle requireOrgPage()
  (app)/agents/page.tsx          # état vide pour l'instant (EmptyState « Your first agent awaits. »)
  (app)/conversations/page.tsx   # placeholder EmptyState
  (app)/analytics/page.tsx       # placeholder EmptyState
  (app)/settings/page.tsx        # placeholder (Phase 6)
  (app)/design-system/page.tsx   # vitrine de tous les composants (dark + light)
  invite/[id]/page.tsx           # accepte l'invitation (authClient.organization.acceptInvitation) puis /agents
  not-found.tsx, error.tsx, loading.tsx
  icon.tsx, apple-icon.tsx, manifest.ts
  page.tsx                       # redirection temporaire vers /sign-in (la landing arrive en Phase 7)
```

**Layout auth (écran 5 Stitch, corrigé selon l'audit) :**
- Gauche 55 % : panneau `bg-surface` avec wordmark (`Wordmark size="md"`), citation `font-serif text-[64px] leading-[1.05]` « “Every answer, sealed by its source.” », en dessous **une seule** phrase `text-text-muted` : « No-code AI support agents, trained on your docs. ». **Supprimer** les stats inventées (« 99.8 % », « 14 Maison »), « Epistemic provenance », « Secure realm », « Cryptographic Protocol », « PROV-V4.12 ». Le cercle décoratif « sceau » en SVG fin (stroke `border`, opacité 0.6) est conservé.
- Droite 45 % : carte formulaire `bg-surface-raised border-border rounded-md p-10 max-w-[420px]`.
- Mobile (< 1024px) : panneau gauche masqué, wordmark au-dessus du formulaire.

**Sign-in :** boutons Google / GitHub (`variant="ghost"`, icônes `GoogleIcon`/`GithubIcon` monochromes) → `signIn.social({ provider, callbackURL: "/agents" })`. Séparateur « or ». Email + mot de passe (`PasswordInput`), lien « Forgot password? » (`text-link`), bouton primaire pleine largeur « Sign in ». Sous la carte : « New to Sigilla? Create an account » et lien « Explore the live demo » → `/demo` (la route `/demo` est livrée en Phase 7 ; d'ici là, lien masqué derrière `process.env.NEXT_PUBLIC_DEMO_ENABLED === "true"`).
Erreurs : Better Auth renvoie `error.code` → mappe vers `Auth.errors.*`.

**Sign-up :** nom, email, mot de passe + **jauge 3 segments** (faible < 8 car. ou 1 classe ; moyen = 8+ et 2 classes ; fort = 12+ et 3 classes parmi minuscule/majuscule/chiffre/symbole), microcopy légale avec liens `/terms` et `/privacy` (pages livrées en Phase 7). `signUp.email({ name, email, password, callbackURL: "/agents" })`.

**Forgot :** `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })` (ou `forgetPassword` selon la version). Toujours afficher `Auth.forgotSent` (pas d'énumération de comptes). En `NODE_ENV=development`, afficher en plus une note discrète « Dev: the reset link is printed in the server console. »
**Reset :** lit `token`, `authClient.resetPassword({ newPassword, token })`, puis toast `Auth.resetDone` et redirection `/sign-in`.

Validation des formulaires : Zod (`lib/validation/auth.ts`) côté client, messages traduits.

### 3.13 App shell (`components/layout/app-shell.tsx`)

Référence : `sigilla_agents_list_empty_state_screen_10` + audit C1, C4, C5.

- **Sidebar** 248px, `bg-bg border-r border-border`, sticky pleine hauteur :
  - En haut : `Wordmark size="md"` (lien `/agents`), padding 24px.
  - **Switcher d'organisation** : bloc `label-caps` « MAISON » + nom de l'org + `UnfoldIcon` ; Radix DropdownMenu listant `useListOrganizations()`, item actif coché, action `authClient.organization.setActive({ organizationId })` puis `router.refresh()`.
  - Nav : Agents (`AgentIcon`), Conversations (`ConversationIcon` + badge numérique des handoffs en attente — branché en Phase 5, ici `0` masqué), Analytics (`AnalyticsIcon`), Settings (`SettingsIcon`). Item actif = `bg-accent text-on-accent rounded-sm` ; inactif `text-text-muted hover:text-text hover:bg-surface`. **Pas de point rose décoratif.**
  - En bas : `Avatar` + nom + email (`text-small text-text-muted`) + chip plan (`Badge` « FREE/PRO/TEAM », `font-mono`) ; menu utilisateur (DropdownMenu) : Theme (Dark/Light via `useTheme`), Language (EN/FR via `changeLocale`), Docs, Sign out.
- **Top bar** 64px : breadcrumb (`text-text-muted` > `text-text`), slot d'actions à droite. **Pas de toggle de thème ici.**
- **Contenu** : `max-w-[1200px] mx-auto px-10 py-10`.
- **Mobile** (< 1024px) : sidebar en Drawer ouvert par un bouton menu dans la top bar.
- Transition de page : fade 150ms (`motion-safe:animate-in`) — pas de librairie d'animation.

### 3.14 Icônes de marque & manifest

- `app/icon.tsx` (32×32) et `app/apple-icon.tsx` (180×180) avec `ImageResponse` (modèle Excerpta) : fond `#9E2F45`, `borderRadius` 22 %, lettre « S » couleur `#F3ECE6`. Charger Instrument Serif pour l'image : `fetch` du fichier TTF depuis Google Fonts au build est interdit en zéro-maintenance → **embarque** `public/fonts/InstrumentSerif-Regular.ttf` (licence OFL, téléchargée une fois) et lis-le avec `fs.readFile` dans la route.
- `app/manifest.ts` : `name: "Sigilla"`, `short_name: "Sigilla"`, `background_color: "#0E0A0B"`, `theme_color: "#0E0A0B"`, `display: "standalone"`, icônes `/icon` et `/apple-icon`.
- `components/ui/page-loader.tsx` : wordmark + ligne bordeaux 1px qui se dessine (LOT 5 « loaders »), affiché uniquement pendant le premier chargement (même logique que `page-loader` d'Excerpta).

### 3.15 Pages système
- `not-found.tsx` : `font-serif text-h1` « This page has left the house. » + bouton ghost « Return home ».
- `error.tsx` : « Something went wrong on our side. » + bouton « Try again » (`reset()`).
- `loading.tsx` dans `(app)` : skeletons de la grille (3 cartes).

### 3.16 Page `/design-system`
Grille de toutes les briques : palette (pastilles + hex + nom du token), échelle typo, Buttons (toutes variantes/tailles/loading/disabled), Inputs (normal/erreur/disabled), Select, Tabs, Badge, StatusPill (5 tons), Avatar (image/initiales), Card, Dialog, Drawer, Tooltip, Toast (4 types), Skeleton, EmptyState, `CitationSeal` dans une phrase + `SealedBy`, Wordmark (4 tailles). Bouton pour basculer dark/light. **Cette page sert de QA visuelle** pour toutes les phases suivantes.

### 3.17 Déploiement précoce
1. `git init`, premier commit, push sur GitHub.
2. Importer dans Vercel, renseigner les variables disponibles (au minimum `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, OAuth).
3. Ajouter l'URL Vercel aux redirections OAuth Google/GitHub.
4. Vérifier : inscription → org perso créée → `/agents` affiche l'état vide.

---

## 4. Critères d'acceptation

- [ ] `npm run lint`, `npm run typecheck`, `npm run build` passent sans erreur ni warning bloquant.
- [ ] URL Vercel live ; inscription email + Google + GitHub fonctionnelles en prod.
- [ ] Chaque nouvel utilisateur a **une organisation personnelle active** (vérifiable dans Prisma Studio : `Organization`, `Member` role `owner`, `Session.activeOrganizationId`).
- [ ] Le switcher liste les organisations et change l'organisation active.
- [ ] Une invitation par lien `/invite/<id>` ajoute un membre.
- [ ] Les routes `(app)` redirigent vers `/sign-in` sans session ; `/sign-in` redirige vers `/agents` avec session.
- [ ] `/design-system` affiche tous les composants, correctement en dark **et** light, sans aucune couleur hors tokens.
- [ ] `grep -R "material-symbols\|Material Symbols" app components lib` → **0 résultat**.
- [ ] `grep -R "text-accent" app components` → **0 résultat**.
- [ ] Changement de langue EN ↔ FR effectif sur toutes les pages livrées ; aucune chaîne en dur dans les composants.
- [ ] Contraste AA vérifié (DevTools) sur sign-in et app shell en dark et light.
- [ ] Favicon « S » visible dans l'onglet ; manifest valide.

## 5. Fin de phase
1. Coche dans `PROGRESS.md` les 2 tâches de « Phase 1 — Préparation » qui te concernent (« Checklist de création des comptes gratuits » et « `.env.example` complet et commenté ») et les 20 tâches « Phase 2 (P1) ». Ne touche pas aux 8 lignes « Fichier de délégation … » (déjà gérées).
2. Recalcule le tableau d'avancement en tête de `PROGRESS.md` (faites/total et %).
3. Crée/complète `DECISIONS.md` (date, décision, raison) pour tout écart à ce fichier.
4. Commit `chore: complete phase 1 (foundations, design system, auth)`.
