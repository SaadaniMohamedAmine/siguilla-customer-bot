<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Sigilla — règles projet
- Source de vérité : SIGILLA-PRD.md + project-07-sigilla-design-audit-recommendations.md.
- Écrans Stitch = mise en page uniquement ; jamais de classes MD3 ni de Material Symbols.
- Tokens : bg, surface, surface-raised, border, text, text-muted, accent (fond uniquement), accent-hover, on-accent, link, focus, tint, success, warning, error.
- Icônes : Hugeicons via components/ui/icon.tsx.
- Tout texte UI dans messages/en.json + messages/fr.json.
- 0 $, zéro maintenance : pas de cron, pas de nouveau service externe.
