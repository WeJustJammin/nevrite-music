---
name: brand-guidelines
description: "Apply WeJammin's confirmed product-first Working Record design direction to all visual surfaces, using PRODUCT.md and DESIGN.md as canonical context."
---

# WeJammin Brand Guidelines

> **Status**: Active — canonical context is root `PRODUCT.md` plus `DESIGN.md`.
>
> **Bridge mode**: This file now reads from the `impeccable` skill's context files. When `PRODUCT.md` and `DESIGN.md` exist at the project root (written by `/impeccable teach` and `/impeccable document`), values from those files take precedence over the placeholder slots below. Run `node .agents/skills/impeccable/scripts/load-context.mjs` to load the current design context.

## Design Direction

- **Confirmed direction**: Product-first restrained utility under **The Working Record**
- **Rationale**: Serious music work needs compact, familiar workflows and exact provenance treatment; limited editorial expression keeps public identity human without weakening operational clarity.
- **Primary audience**: Working musicians, producers, engineers, bands, and venue/studio operators; fans use a simpler consumer surface under the same brand.

> When `PRODUCT.md` exists, extract direction/audience from its Users and Product Purpose sections.

## Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Primary | Jam Magenta, `oklch(60% 0.25 350)` | Rare brand emphasis, active state, and singular high-value actions; never proof by itself |
| Secondary | Graphite, `oklch(20% 0.012 350)` | Primary controls and high-contrast structure |
| Accent | Semantic only: danger, warning, success | Literal status; never a second decorative brand accent |
| Background | Paper, `oklch(96% 0.006 350)` | Default mixed-light page and application background |
| Text | Graphite, `oklch(20% 0.012 350)` | Primary text and record values |

> When `DESIGN.md` exists, extract colors from its Colors section (OKLCH or hex).

## Typography

| Role | Font | Usage |
|------|------|-------|
| Heading | Source Sans 3; Source Serif 4 only for public display | Product titles and limited public identity/editorial display |
| Body | Source Sans 3 | Paragraphs, descriptions, controls, tables, and UI labels |
| Mono | IBM Plex Mono | Identifiers, timestamps, versions, and provenance metadata |

> When `DESIGN.md` exists, extract fonts from its Typography section.

## Motion Philosophy

Responsive feedback only, normally 150–220 ms with exponential ease-out. No layout animation, bounce, elastic easing, or orchestrated product page loads. Respect `prefers-reduced-motion` everywhere.

## Accessibility Baseline

WCAG 2.2 AA is the minimum release bar. Keyboard operation, visible focus, semantic structure, screen readers, zoom/reflow, target size, reduced motion, and non-color state cues are mandatory on every surface.

> When `DESIGN.md` exists, extract motion philosophy from its Motion section.

## Existing Brand Assets

- `PRODUCT.md`: strategic register, users, purpose, personality, anti-references, and accessibility doctrine.
- `DESIGN.md`: normative design tokens, component rules, and visual governance.
- `.impeccable/design.json`: tonal ramps, motion/elevation metadata, and representative component specimens.
- Logo and production illustration/icon assets remain unselected; do not invent them as implementation dependencies.

## What to Avoid

- Generic SaaS card grids, hero metrics, profile-completion gamification, and corporate networking theatre.
- Dark-by-default neon music styling, nightclub clichés, glassmorphism, gradient text, or decorative waveforms.
- Decorative verification or any treatment that lets asserted content imitate attested content.
- Arbitrary themes, plugins, scripts, CSS, expressions, or CMS overrides of protected trust/accessibility rules.

> The `impeccable` skill's anti-pattern rules (27 deterministic + 12 LLM critique) automatically apply. No need to duplicate them here.
