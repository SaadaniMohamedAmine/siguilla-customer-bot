# Sigilla — Audit design Stitch & recommandations de build

> Project 07 / 30 — Audit du 2026-10-13
> Source auditée : `stitch_sigilla_luxury_ai_platform/` (22 dossiers : 21 écrans `code.html` + `screen.png`, 1 `DESIGN.md`)
> Méthode : analyse automatisée du code des 22 écrans (tokens, classes, icônes, polices, copy) + revue visuelle de 8 écrans phares (landing, widget, conversation, analytics, widget designer, pricing, sign-in, brand assets).

---

## 0. Verdict

**Direction artistique : réussie (9/10).** Le rendu est réellement premium : noir chaud, bordeaux en aplat, hiérarchie Instrument Serif / Sans / JetBrains Mono, bordures hairline, beaucoup d'air. Le widget (LOT 2) et les brand assets (LOT 5) sont excellents et servent de **référence**.

**Code exporté : non réutilisable tel quel.** Comme sur les projets précédents, Stitch a injecté ses tokens Material 3 et Material Symbols. **Les écrans servent de référence visuelle et de structure ; les tokens et icônes sont réimplémentés au build** avec le vrai design system (PRD §13).

| Contrôle | Résultat |
|---|---|
| Wordmark texte seul | ✅ Conforme partout (aucune icône à côté) |
| Polices Instrument Serif / Sans / JetBrains Mono | ✅ Conformes (22/22) |
| Bordeaux en aplat (boutons, launcher, seals) | ✅ Conforme ; aucun texte bordeaux sur fond sombre détecté |
| Palette | ⚠️ Tokens MD3 injectés dans 21/22 fichiers (§1) |
| Icônes | ❌ **Material Symbols** dans 20/22 fichiers — 431 occurrences (§2) |
| Sceaux de citation | ⚠️ 3 rendus différents selon les écrans (§3) |
| Copy | ⚠️ Dérive « jargon luxe » + promesses hors scope (§4) |
| Light mode | ⚠️ Présent via toggle JS dans les écrans LOT 1, tokens light légèrement décalés (§1.3) |

---

## 1. Tokens couleur — dérive Material 3

### 1.1 Constat
- Le `DESIGN.md` (« Haute Concierge ») décrit **correctement** la palette en prose, mais son frontmatter et le `tailwind.config` de chaque écran contiennent une **palette MD3 générée** (`primary #ffb2ba`, `surface #171213`, `surface-container-high #2e292a`, `outline #a58a8c`…).
- Classes MD3 les plus utilisées : `text-on-surface` (693), `text-outline` (655), `bg-surface-container` (208), `text-on-surface-variant` (205), `text-primary` (195), `bg-surface-container-high` (174), `bg-primary-container` (98), `bg-primary` (59).
- Effet visible : certaines surfaces tirent vers le **gris-brun** (`#2e292a`) au lieu du noir chaud, et **`bg-primary` = rose `#ffb2ba`** produit des **avatars utilisateur rose bonbon** (top bar, sidebar, nav pricing) — hors charte.

### 1.2 Table de correspondance (à appliquer au build)

| Classe MD3 Stitch | Valeur Stitch | → Token Sigilla | Dark | Light |
|---|---|---|---|---|
| `bg-surface-container-lowest`, `background` | `#110d0e` / `#171213` | `--bg` | `#0E0A0B` | `#FAF6F2` |
| `bg-surface`, `bg-surface-container-low`, `bg-surface-container` | `#171213` / `#1f1a1b` / `#231e1f` | `--surface` | `#171113` | `#FFFFFF` |
| `bg-surface-container-high(est)` | `#2e292a` / `#393334` | `--surface-raised` | `#201719` | `#F4EDE8` |
| `border-outline-variant/*`, `divide-*` | `#564143` + opacité | `--border` (opaque, 1px) | `#2E2225` | `#E8DED8` |
| `text-on-surface` | `#eae0e1` | `--text` | `#F3ECE6` | `#1A1214` |
| `text-outline`, `text-on-surface-variant`, `text-tertiary` | `#a58a8c` / `#ddbfc1` / `#d3c2c5` | `--text-muted` | `#A8999A` | `#6B5A5D` |
| `bg-primary-container` | `#9e2f45` | `--accent` | `#9E2F45` | `#8A2438` |
| `text-on-primary-container`, `text-on-primary` | `#ffbec4` / `#670020` | **texte sur accent** = `--text` porcelaine | `#F3ECE6` | `#FFFFFF` |
| `text-primary`, `text-secondary`, `border-primary`, `ring-primary` | `#ffb2ba` / `#ebbac1` | `--accent-soft` (liens, focus) | `#E3B3BA` | `#8A2438`* |
| `bg-primary` (avatars, pastilles) | `#ffb2ba` rose | ❌ **interdit** → `--surface-raised` + initiales `--text` | — | — |
| `text-error`, `bg-error*` | `#ffb4ab` / `#93000a` | `--error` | `#E5675F` | `#B3261E` |

\* En light, les liens utilisent le bordeaux `#8A2438` (contraste 8,2:1 sur `#FAF6F2`) ; `#F3DDE1` reste réservé aux fonds de sélection / tags.

### 1.3 Light mode
Les écrans « dark_light » (landing, widget designer, conversation, analytics) embarquent un **toggle JS** avec leurs propres variables. Écarts relevés vs PRD : accent light `#9E2F45` (→ `#8A2438`), raised `#F4ECE7` (→ `#F4EDE8`), muted `#6B5B5E` (→ `#6B5A5D`), lien `#8C3748` (→ `#8A2438`). **Décision : le light mode est piloté uniquement par les tokens du PRD via `next-themes` ; ignorer les variables locales de Stitch.**

---

## 2. Icônes — Material Symbols → Hugeicons

- **431 icônes Material Symbols** dans 20 fichiers (seuls le widget LOT 2 et les brand assets en sont exempts).
- Règle build : `@hugeicons/react` + `@hugeicons/core-free-icons`, style **Stroke Rounded**, `strokeWidth={1.5}`, taille 16/18/20 px, couleur `currentColor`.
- Mapping des icônes les plus fréquentes (noms Hugeicons à confirmer dans le package au moment du build) :

| Material Symbol (occurrences) | Usage | Hugeicons (Stroke Rounded) |
|---|---|---|
| `check` (30), `check_circle` (10), `done_all` | Listes pricing, statuts | `Tick02Icon`, `CheckmarkCircle02Icon` |
| `person` (21), `person_add` | Avatars, membres | `UserIcon`, `UserAdd01Icon` |
| `tune` (17) | Settings, réglages | `SlidersHorizontalIcon` |
| `verified` (12), `verified_user`, `shield` | Sceau « Sealed by » | `CheckmarkBadge01Icon`, `Shield01Icon` |
| `chevron_right` (12), `expand_more` (11), `unfold_more` (9) | Navigation, selects | `ArrowRight01Icon`, `ArrowDown01Icon`, `ArrowUpDownIcon` |
| `arrow_forward` (11), `arrow_upward` (6), `arrow_back` (5) | CTA, envoi, retour | `ArrowRight02Icon`, `ArrowUp02Icon`, `ArrowLeft02Icon` |
| `sync` (10), `refresh` (9) | Resync sources | `RefreshIcon` |
| `smart_toy` (10), `psychology`, `support_agent` | Agents IA | `AiChat02Icon`, `CustomerSupportIcon` |
| `forum` (9), `chat_bubble` | Conversations | `BubbleChatIcon` |
| `delete` (9), `close` (9) | Actions | `Delete02Icon`, `Cancel01Icon` |
| `picture_as_pdf` (8), `description`, `link`, `language` | Types de source | `Pdf01Icon`, `File01Icon`, `Link01Icon`, `Globe02Icon` |
| `lock` (8), `vpn_key`, `key` | Sécurité, API keys | `LockIcon`, `Key01Icon` |
| `content_copy` (8) | Copier snippet / clé | `Copy01Icon` |
| `add` (8), `search` (7) | Actions | `Add01Icon`, `Search01Icon` |
| `monitoring` (7), `analytics`, `query_stats` | Analytics | `Analytics01Icon` |
| `menu_book` (7), `auto_stories` (6) | Docs, knowledge | `Book02Icon` |
| `download` (6), `upload_file`, `cloud_upload` | Export / upload | `Download01Icon`, `Upload01Icon` |
| `thumb_up`, `thumb_down` | Feedback | `ThumbsUpIcon`, `ThumbsDownIcon` |
| `light_mode`, `dark_mode`, `contrast` | Theme toggle | `Sun03Icon`, `Moon02Icon` |
| `warning`, `error`, `info` | États | `Alert02Icon`, `AlertCircleIcon`, `InformationCircleIcon` |

---

## 3. Sceau de citation — unifier sur le rendu du widget (LOT 2)

| Écran | Rendu actuel | Conforme ? |
|---|---|---|
| Widget LOT 2 (8 états) | Pastille **ronde bordeaux** avec chiffre porcelaine + « Sealed by N sources » | ✅ **Référence** |
| Landing (mockup widget) | Pastilles rondes | ✅ |
| Conversation detail | Exposant texte `[1]` | ❌ |
| Widget designer (preview) | Chips rectangulaires `[1] [2]` | ❌ |

**Spécification unique (composant `CitationSeal`) :**
- 16×16 px, `border-radius: 9999px`, fond `--accent`, chiffre JetBrains Mono 10px `--text` (porcelaine), aligné sur la ligne de base +1px, espacement 2px.
- Hover/focus : anneau 2px `--accent-soft`, tooltip avec titre de la source + page/URL.
- Ligne sous la réponse : icône `CheckmarkBadge01Icon` 14px + « Sealed by N sources — » + liens `--accent-soft`, Instrument Sans 12px.
- **Même composant** dans le widget, le playground, la conversation et la landing.

**Autre incohérence widget :** dans le widget designer, l'en-tête du widget est **plein bordeaux**, alors que le LOT 2 a un en-tête **sombre** avec avatar bordeaux. **Référence = LOT 2** (en-tête `--surface`, avatar bordeaux). L'en-tête plein bordeaux peut devenir une **option** du designer (« Header style : Subtle / Bold »), pas le défaut.

---

## 4. Copy — dérive jargon & promesses hors scope

Le ton « maître d'hôtel » est globalement respecté dans le produit, mais Stitch a ajouté un **jargon pseudo-luxe** peu lisible pour un recruteur et des **promesses fausses** vis-à-vis du PRD. À corriger au build (le copy final vit dans `messages/en.json` / `fr.json`).

### 4.1 Promesses hors scope / inexactes → à retirer ou corriger

| Où | Texte Stitch | Correction |
|---|---|---|
| Pricing — Pro | « Begin 14-day trial » | « Upgrade to Pro » (pas d'essai dans le PRD) |
| Pricing — Pro/Team, Docs, API keys, Integrations | « Public API & Webhooks », « Full API & Webhooks with SLA » | « API access » (pas de webhooks sortants ni de SLA) |
| Pricing — Team | « Dedicated Notion & SOP live sync » | « Notion connector » (re-sync **manuelle**, zéro cron) |
| Pricing — Team | « Priority concierge support », « Custom citation seal branding » | Retirer |
| Pricing — bas de page | « private isolated VPCs, on-premise embeddings, custom fine-tuned weights » | Retirer le bloc « bespoke enclave » |
| Pricing — bloc fidélité | « 98.4% confidence », « Zero Hallucination SLA » | Seuil réel : « Below a 0.75 similarity threshold, your agent declines and offers a human. » |
| Sign-in | « 99.8% citation accuracy », « 14 Maison active vitrines » | Retirer les stats inventées |
| Conversation, Playground | « Embedding: ada-002 » | « Embedding: Gemini · 768d » |
| Conversation | « Socket sync », « type / to pull private templates, lead cards, calendar links », « Lead #LD-4402 », adresse IP | Retirer (polling, pas de templates/lead cards/IP affichée) |
| Analytics | « Export Ledger », « Inspect Guardrails », « Audit v4.2 », « Telemetry sync » | Retirer (hors scope) |
| Widget designer | « Version 2.4.1 Active », « CSS Variable: --sig-chroma » | Retirer |
| Pricing — nav | Avatar utilisateur sur une page marketing déconnectée | Retirer |
| 17 écrans | « © 2025 » | « © 2026 » |

### 4.2 Jargon → copy clair (garder l'élégance, gagner en lisibilité)

| Texte Stitch | Proposition |
|---|---|
| « Engineered with archival fidelity. » | « How it works » |
| « Deploy Agent Now » / « Schedule Maison Consultation » | « Start free » / « Explore the live demo » |
| « Privacy Architecture · Security Seal · Terms » | « Privacy · Terms · Docs » |
| « Epistemic provenance », « Secure realm », « Cryptographic Protocol » | Retirer |
| « Widget Tailoring » / « Surface protocol » / « Client surface simulator » | « Widget » / « Appearance » / « Live preview » |
| « Concierge Moniker » / « Curatorial Domain » | « Display name » / « Subtitle » |
| « Analytics & Source Integrity » / « Cadence telemetry » | « Analytics » |
| « Trusted to answer for » + fausses maisons | « Built for houses like » + mention discrète « Illustrative brands » (honnêteté portfolio) |

### 4.3 i18n
Les écrans mélangent EN et FR (« Sombre / Clair », « Aujourd'hui »). **Règle :** UI 100 % dans la locale active (next-intl EN/FR). Le toggle de thème appartient au menu utilisateur / settings, **pas** à la barre de breadcrumb.

---

## 5. Composants & layout — corrections ponctuelles

| # | Écran | Problème | Correction |
|---|---|---|---|
| C1 | Tous (app shell) | Avatar utilisateur rose `#ffb2ba` | Cercle `--surface-raised` + border hairline + initiales Instrument Sans `--text` |
| C2 | Analytics — « Most cited sources » | Les libellés chevauchent les barres et sont tronqués (« Shipping Policy.pdf ») | Libellé au-dessus de la barre, troncature avec `title`, barre 4px pleine largeur |
| C3 | Analytics — graphique | 2e série « Citations verified » non définie dans le PRD | Une seule série (conversations/jour) ; tooltip : conversations + taux de résolution |
| C4 | App shell | Point rose « • » sur l'item Agents sans signification | Retirer ; badge numérique uniquement sur Conversations (handoffs en attente) |
| C5 | Conversation | Toggle Dark/Light dans la barre de breadcrumb | Déplacer dans le menu utilisateur |
| C6 | Conversation — liste | Titres serif tronqués (« Visitor #4... ») | Liste en Instrument Sans 14px ; serif réservé au titre du panneau central |
| C7 | Widget designer | Swatches incluant bleu/vert/violet/ambre | ✅ OK (couleurs **du client**) — mais garder bordeaux comme défaut et appliquer le contraste auto du texte (porcelaine/encre) selon la luminance |
| C8 | Pricing | Prix et limites | ✅ Conformes au PRD (0 / 12 / 39 $, limites §6) — corriger seulement les features hors scope (§4.1) |
| C9 | Landing | Halo bordeaux + `blur-[130px]` | ✅ OK (un seul halo autorisé) — vérifier le coût perf (Lighthouse ≥ 95) ; préférer un `radial-gradient` statique sans `filter: blur` |
| C10 | Tous | Labels `code-xs` 10px (JetBrains Mono) en muted | Minimum **11px** pour la lisibilité / WCAG ; 10px toléré uniquement pour les IDs décoratifs |
| C11 | Tous | `cdn.tailwindcss.com` + Google Fonts en `<link>` | Build : Tailwind v4 compilé + `next/font/google` (Instrument Serif, Instrument Sans, JetBrains Mono) |

---

## 6. Ce qu'on garde tel quel (références de build)

1. **Widget LOT 2** — les 8 états + variante light + mobile : référence pixel du composant widget.
2. **Brand assets LOT 5** — wordmark dark/light, favicon « S » (512/180/32/16), launcher (default/hover), OG image, bannières README, loaders.
3. **Structure de l'app shell** (sidebar : wordmark, switcher « Maison Démo », Agents / Conversations / Analytics / Settings, plan chip en bas).
4. **Mise en page** de chaque écran (grilles, hiérarchie, densité) — seuls tokens, icônes, copy et points §5 changent.
5. **Échelle typographique** du `DESIGN.md` (headline-xl 56/64 … code-xs) et **rayons** (4px contrôles, 8px cartes, full pour pastilles).

---

## 7. Conséquences pour les fichiers de délégation

- **P1 (design system)** : livrer `app/globals.css` Tailwind v4 avec les tokens du PRD §13 (dark + light), la table §1.2 comme référence de traduction, `next/font`, Hugeicons, composants `CitationSeal`, `Avatar`, `StatusPill`, `Button` (primary/ghost/link), `Input`, `Card`.
- **Toutes les phases** : consigne explicite à l'agent — « Use the Stitch screens for layout and hierarchy only. Never copy their `tailwind.config`, MD3 class names or Material Symbols. »
- **P7 (landing / pricing / docs)** : copy final selon §4.
- Les PNG `screen.png` sont référencés par chemin dans chaque fichier de délégation, écran par écran.

---

*Audit en lecture seule — aucun fichier Stitch n'a été modifié.*
