---
name: Haute Concierge
colors:
  surface: '#171213'
  surface-dim: '#171213'
  surface-bright: '#3d3839'
  surface-container-lowest: '#110d0e'
  surface-container-low: '#1f1a1b'
  surface-container: '#231e1f'
  surface-container-high: '#2e292a'
  surface-container-highest: '#393334'
  on-surface: '#eae0e1'
  on-surface-variant: '#ddbfc1'
  inverse-surface: '#eae0e1'
  inverse-on-surface: '#342f30'
  outline: '#a58a8c'
  outline-variant: '#564143'
  surface-tint: '#ffb2ba'
  primary: '#ffb2ba'
  on-primary: '#670020'
  primary-container: '#9e2f45'
  on-primary-container: '#ffbec4'
  inverse-primary: '#a6354b'
  secondary: '#ebbac1'
  on-secondary: '#47272d'
  secondary-container: '#633f45'
  on-secondary-container: '#dcacb3'
  tertiary: '#d3c2c5'
  on-tertiary: '#382e30'
  tertiary-container: '#615557'
  on-tertiary-container: '#dccacd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9dc'
  primary-fixed-dim: '#ffb2ba'
  on-primary-fixed: '#400011'
  on-primary-fixed-variant: '#871d35'
  secondary-fixed: '#ffd9de'
  secondary-fixed-dim: '#ebbac1'
  on-secondary-fixed: '#2f1319'
  on-secondary-fixed-variant: '#603d43'
  tertiary-fixed: '#f0dee1'
  tertiary-fixed-dim: '#d3c2c5'
  on-tertiary-fixed: '#22191b'
  on-tertiary-fixed-variant: '#4f4446'
  background: '#171213'
  on-background: '#eae0e1'
  surface-variant: '#393334'
typography:
  headline-xl:
    fontFamily: Instrument Serif
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Instrument Serif
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Instrument Serif
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Instrument Serif
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: Instrument Serif
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  headline-sm:
    fontFamily: Instrument Serif
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 28px
  kpi-metric:
    fontFamily: Instrument Serif
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Instrument Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Instrument Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Instrument Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Instrument Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Instrument Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
  code-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-tablet: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses the discipline and poise of a heritage high-jewellery atelier synthesized with the razor precision of top-tier software tooling. The audience comprises ultra-luxury maisons, bespoke service directors, and private client executives who demand high-fidelity automated intelligence without losing the nuance of white-glove hospitality.

The design movement combines **Minimalism** and **Tactile Architectural Restraint**:
- **Atmosphere:** Deep, velvety plum-blacks and warm alabasters reminiscent of parchment and display vitrines. 
- **Cadence:** Unhurried editorial composition, intentional empty space, razor-thin structural dividers, and zero visual clutter.
- **Tone:** Dispassionate, poised, discreet, and authoritative. Information is curated rather than densely plotted.

## Colors

Color is applied with severe discipline. The system operates primarily in dark mode, reflecting the hushed interior of a private salon, with a calibrated light mode for high-illumination environments.

### Dark Theme (Primary)
- **Background (`#0E0A0B`):** Deep blackened bordeaux canvas.
- **Surface (`#171113`):** Default card and panel base layer.
- **Raised Surface (`#201719`):** Modals, flyouts, and elevated workspace segments.
- **Hairline Border (`#2E2225`):** Architectural boundary line; applied at exactly 1px.
- **Primary Text (`#F3ECE6`):** Warm alabaster white.
- **Muted Text (`#A8999A`):** Veiled warm taupe for captions, timestamps, and secondary metadata.
- **Bordeaux Accent (`#9E2F45` | Hover `#872538`):** Restricted strictly to filled surfaces (primary CTA buttons, active state indicators, pill badges). It must **never** be rendered as body text against dark backgrounds.
- **Rose Quartz Accent (`#E3B3BA`):** Interactive text, inline highlights, focus ring accents, and fine glyph iconography.
- **Functional Semantics:** Success `#6FBF8E`, Warning `#E0B05C`, Error `#E5675F`.

### Light Theme
- **Background (`#FAF6F2`):** Unbleached warm stone.
- **Surface (`#FFFFFF`):** Pure vitrine panels.
- **Raised Surface (`#F4EDE8`):** Subtle tactile lifts.
- **Hairline Border (`#E8DED8`):** Muted limestone rule line.
- **Primary Text (`#1A1214`):** Crushed ink pigment.
- **Muted Text (`#6B5A5D`):** Dried rosewood tone.
- **Bordeaux Accent (`#8A2438` | Hover `#741D2F`):** Fill container anchor.
- **Soft Accent (`#F3DDE1`):** Subdued tint for hover selections and tag backdrops.
- **Functional Semantics:** Success `#2F7A4D`, Warning `#85590C`, Error `#B3261E`.

## Typography

The typography architecture balances historic editorial grandeur with technical telemetry:
- **Headlines, Wordmarks & Metric Callouts:** Rendered in **Instrument Serif** italic or roman. This provides instant luxury gravitas, evoking vintage auction catalogs and monogram hallmarks.
- **Interface & Prose Text:** Set in **Instrument Sans**, an understated grotesque with refined proportions that renders cleanly at compact sizes without distracting from conversational AI contexts.
- **Telemetric Tokens & Technical Metadata:** Set in **JetBrains Mono** for model parameters, confidence coefficients, response latencies, and token expenditures.

Typographic hierarchy relies heavily on proportional shifts and case treatment rather than heavy weights. Bold weights are reserved exclusively for microscopic labels.

## Layout & Spacing

The layout model is governed by an architectural grid that prioritizes breathing space and gallery-like pacing over high-density dashboard layouts.

- **Structure:** 12-column adaptive layout on desktop, transitioning to 8 columns on tablet and 4 columns on mobile.
- **Margins & Air:** Generous canvas borders framing the application frame like museum matting. Outer screen gutters are wide on desktop to prevent edge-to-edge fatigue.
- **Visual Segments:** Large sections are separated by structural margins (`space-xl`), while micro-relationships between data points rely on compact spacing (`space-sm`).
- **Reflow Logic:** Multi-column conversation-plus-telemetry inspector panels stack sequentially on screens narrower than 1024px, preserving full horizontal line measure for delicate typography.

## Elevation & Depth

This system intentionally rejects heavy drop shadows, blurred lighting cones, and neumorphic extrusions. Depth is established through **tonal layering and hairline structural boundaries**.

- **Level 0 (Canvas):** Pure `#0E0A0B` (Dark) / `#FAF6F2` (Light). Static backplanes.
- **Level 1 (Panels & Feed Vitrines):** Surfaces set to `#171113`, framed by a crisp, continuous 1px hairline border of `#2E2225`.
- **Level 2 (Active Inspections, Popovers & Context Sheets):** Raised surfaces set to `#201719` with a subtle top-lit accent rule: a 1px border using `#2E2225`, accompanied by a 1px inner ambient line (`rgba(227, 179, 186, 0.04)`) to simulate a chamfered jewel edge.
- **Shadowing:** Where elevation is mandatory over overlapping dynamic media, use a single diffused cast shadow: `0 16px 40px -12px rgba(0, 0, 0, 0.6)`. Shadows must never look muddy or grey; they maintain deep warm undertones.

## Shapes

The design system employs a **Soft (Level 1)** geometric language. 

- Sharp internal corners are softened just enough to remove harshness without turning into casual, toy-like pills.
- Standard interactive elements, panels, and input fields utilize `0.25rem` (4px).
- Larger layout vitrines, cards, and dialogue sheets utilize `0.5rem` (8px).
- Buttons and badges maintain structured rectangular discipline with subtle rounding, except for standalone numeric notification pips which may use full concentric radii.

## Components

### Buttons
- **Primary:** Filled strictly in Bordeaux (`#9E2F45`), text in `#F3ECE6` (`label-md`), hairline border in `transparent`. Hover transitions seamlessly to `#872538`.
- **Secondary / Ghost:** Transparent background with a 1px hairline border (`#2E2225`). Text is `#F3ECE6`. On hover, the surface shifts to `#171113` with a border highlight of `#E3B3BA`.
- **Link Buttons:** No border or background. Typography in Rose Quartz (`#E3B3BA`), accompanied by a subtle underline offset by 4px.

### Chips & Badges
- **Status Pills:** Background `#201719`, 1px border `#2E2225`, text in `code-xs`. A 4px glowing status indicator dot signifies AI or agent status (e.g., `#6FBF8E` for active concierge).
- **Active Filter Badges:** Filled with Bordeaux (`#9E2F45`), containing white text and an integrated hairline dismiss icon.

### Input Fields & Controls
- **Text Inputs:** Minimalist container filled with `#171113`, framed with 1px `#2E2225`. Label sits above in `label-sm` using `#A8999A`. Text input is `#F3ECE6`. Focused state shifts the border to Rose Quartz (`#E3B3BA`) with zero neon outer glow.
- **Checkboxes & Radios:** Minimalist geometry (4px radius for checkboxes, circle for radios) with a 1px `#2E2225` border. Checked state fills with Bordeaux (`#9E2F45`) and displays an off-white checkmark.

### Cards & Vitrines
- Surfaces set to `#171113` enveloped by `#2E2225` 1px hairlines. Header areas feature an `Instrument Serif` title accompanied by metadata in `JetBrains Mono`. Cards use generous internal padding (`space-lg`) to preserve an editorial gallery feel.

### Bespoke Domain Components
- **AI Tone/Temperament Gauge:** A discrete slider representing automated conversational temperature, using a 1px Rose Quartz needle against a Bordeaux-filled calibration bar.
- **Client Ledger Drawer:** A sliding inspection drawer featuring historical luxury orders, lifetime value rendered in `kpi-metric` (`Instrument Serif`), and sentiment telemetry tagged via micro-chips.