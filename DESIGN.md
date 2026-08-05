---
name: WeJammin
description: The working record for music professionals.
colors:
  jam-magenta: "oklch(60% 0.25 350)"
  jam-magenta-deep: "oklch(50% 0.22 350)"
  paper: "oklch(96% 0.006 350)"
  surface: "oklch(98% 0.003 350)"
  graphite: "oklch(20% 0.012 350)"
  charcoal: "oklch(38% 0.010 350)"
  ash: "oklch(58% 0.008 350)"
  seam: "oklch(88% 0.008 350)"
  focus: "oklch(67% 0.20 350)"
  danger: "oklch(55% 0.20 25)"
  warning: "oklch(72% 0.15 80)"
  success: "oklch(58% 0.14 155)"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.75rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "0.01em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  control: "6px"
  surface: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  provenance-label:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.charcoal}"
    typography: "{typography.data}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
---

# Design System: WeJammin

## 1. Overview

**Creative North Star: "The Working Record"**

WeJammin should feel like a durable record that remains useful while work is still happening. Its reference world combines a recording-session track sheet, archival liner notes, and a museum provenance label: practical under pressure, human in presentation, and exact about where every material claim came from.

The default product register is restrained and light because users work across daylight, studios, venues, loading docks, and phones. Product controls use familiar forms and compact information density. Public identity surfaces may use limited editorial scale, but admin and workflow surfaces never become magazine layouts. Motion provides immediate feedback only, typically 150 to 220 milliseconds, and every transition respects reduced-motion preferences.

The system rejects generic SaaS dashboards, dark-by-default nightclub styling, streaming-service imitation, corporate networking theatre, and decorative trust signals. Provenance is not decoration. Its vocabulary must remain readable in text, semantics, iconography, and structure when color or motion is unavailable.

**Key Characteristics:**

- Warm paper-like light surfaces designed for mixed ambient light.
- One rare brand accent, with separate semantic colors reserved for status.
- Humanist sans typography for work, with serif display limited to public identity moments.
- Compact, predictable controls and purpose-built records instead of repeated card grids.
- Per-fact provenance treatments that survive monochrome, zoom, reflow, and assistive technology.
- Governed design tokens, with protected trust and accessibility treatments unavailable to CMS override.

## 2. Colors

The palette is restrained: warm near-neutrals carry the interface, Jam Magenta marks brand emphasis, and semantic colors appear only when they communicate a real state.

### Primary

- **Jam Magenta:** Primary brand emphasis, active navigation, selected state, and the rare high-value call to action. It must not imply verification by itself.
- **Jam Magenta Deep:** Hover and active treatment for Jam Magenta.

### Neutral

- **Paper:** Default page and application background.
- **Surface:** Inputs, menus, and deliberately separated working surfaces.
- **Graphite:** Primary text and high-contrast controls.
- **Charcoal:** Supporting text and secondary labels.
- **Ash:** Metadata and intentionally recessed information that still passes contrast requirements.
- **Seam:** Dividers and structural boundaries.

### Named Rules

**The One Voice Rule.** Jam Magenta is the only vibrant brand color and occupies no more than 10% of a screen. Functional danger, warning, and success colors are reserved for literal status and never become decorative accents.

**The Provenance Is Not a Color Rule.** Assertion and attestation states always combine text, semantics, iconography, and structural treatment. Color may reinforce meaning but never owns it.

**The Governed Token Rule.** All variable visual values resolve through typed design tokens. CMS settings may choose only approved values and can never override protected provenance, focus, contrast, or error treatments.

## 3. Typography

**Display Font:** Source Serif 4, with Georgia fallback

**Body Font:** Source Sans 3, with system UI fallback

**Label/Mono Font:** IBM Plex Mono, with system monospace fallback

**Character:** Source Sans 3 keeps dense professional workflows clear and familiar. Source Serif 4 adds a human, archival voice only where a public identity or editorial title benefits from it. IBM Plex Mono marks identifiers, timestamps, versions, and provenance metadata without turning the whole product into a technical interface.

### Hierarchy

- **Display** (500, fluid 2.5rem to 4.75rem, 1.0): Public profile names, major editorial titles, and campaign moments only.
- **Headline** (650, 2rem, 1.15): Product page titles and major section headings.
- **Title** (650, 1.25rem, 1.25): Panels, grouped records, and workflow steps.
- **Body** (400, 1rem, 1.55): Instructions, descriptions, and content, capped at 65 to 75 characters per line for sustained reading.
- **Label** (650, 0.875rem, 0.01em): Controls, field labels, tabs, and compact navigation.
- **Data** (500, 0.8125rem, 1.4): IDs, timestamps, versions, counts, and provenance metadata.

### Named Rules

**The Work Uses Sans Rule.** Forms, tables, settings, navigation, moderation, and admin tools use Source Sans 3. Serif typography is prohibited inside operational controls.

**The Record Uses Mono Rule.** Monospace identifies machine-stable facts, never whole paragraphs or decorative technical mood.

**The Fixed Product Scale Rule.** Product headings use fixed rem sizes. Fluid display sizing is limited to public identity and brand surfaces where the viewport owns the composition.

## 4. Elevation

Surfaces are flat by default and separated by spacing, tone, and hairline seams. Elevation appears only when an element temporarily moves above its context, such as a menu, popover, drag target, or focused editing layer. Shadows use low alpha and never substitute for hierarchy.

### Shadow Vocabulary

- **Raised Control:** A compact neutral shadow for menus and transient controls.
- **Editing Layer:** A wider low-alpha shadow for an active composition or preview layer.
- **Focus Ring:** A high-contrast outline, not a shadow-only effect, visible on every interactive control.

### Named Rules

**The Flat Record Rule.** Records, tables, facts, and sections remain flat at rest. Nested cards are prohibited.

**The State Owns Elevation Rule.** Elevation communicates layering or interaction state, never importance or marketing emphasis.

## 5. Components

### Buttons

Primary buttons use Graphite on Surface and reserve Jam Magenta for hover, active, selected, or singular high-emphasis actions. Secondary actions use a full Seam border. Destructive actions name the consequence and use Danger only when the action is genuinely destructive. Every button has a visible focus ring, a minimum 44 by 44 pixel target where context permits, and a stable loading state that preserves its label width.

### Chips

Chips represent filters, bounded states, or removable selections. They do not become miniature buttons for unrelated actions. Provenance labels may use pill geometry, but always include readable state text and an accessible name.

### Cards / Containers

Use containers only for objects that need independent selection, movement, or boundary. Prefer lists, tables, sections, and aligned fact rows for records. Public profiles follow the fixed Header, Now, Record, Detail spine; templates can reorder approved content within permitted slots but cannot replace that hierarchy or reserved provenance regions.

### Inputs / Fields

Fields use Surface, a one-pixel Seam border, persistent labels, and explicit help or error text. Placeholders never replace labels. Validation runs at the least disruptive useful moment, while submit-time validation remains authoritative. Rich text cannot imitate platform-owned badges, provenance marks, or system messages.

### Navigation

Navigation uses predictable placement, plain labels, and one clear current-location treatment. Public, professional, and administrative information architectures may differ, but each location is governed through named CMS menu locations rather than hard-coded page lists. Conditional items fail closed when authorization or configuration cannot be resolved.

### Provenance Fact

Every material fact can render source, state, timestamp, and allowed action without relying on its surrounding section. Asserted, counterparty-confirmed, verified, disputed, pending, unavailable, and failed states must be distinguishable in text and semantics. Disputed public facts follow their domain publication rules rather than acquiring a sensational visual warning by default.

## 6. Do's and Don'ts

### Do:

- Do make the next professional task obvious before exposing secondary controls.
- Do use predictable product patterns for forms, tables, settings, and admin workflows.
- Do distinguish absent, loading, unavailable, pending, blocked, and failed states.
- Do make provenance legible through text, structure, semantics, and iconography.
- Do use Jam Magenta sparingly and reserve semantic colors for literal status.
- Do keep variable values in governed design tokens or typed settings.
- Do use responsive feedback transitions between 150 and 220 milliseconds.
- Do respect `prefers-reduced-motion`, zoom, reflow, keyboard, and screen-reader operation.
- Do preserve the fixed profile spine and protected provenance regions across CMS templates.

### Don't:

- Don't build generic SaaS dashboards from interchangeable card grids, oversized metrics, and empty whitespace.
- Don't default to dark-by-default music products with neon gradients, glassmorphism, nightclub clichés, or waveform decoration unrelated to the task.
- Don't imitate streaming-service clones that reduce professional identity to popularity, followers, and passive consumption.
- Don't reproduce LinkedIn-style corporate blandness, performative networking, and status theatre.
- Don't use gamified profile-completion meters that treat missing third-party evidence as a personal failure.
- Don't use decorative verification badges or visual treatments that make asserted content look attested.
- Don't allow WordPress-like extensibility through arbitrary themes, plugins, scripts, CSS, or executable content.
- Don't use gradient text, colored side-stripe borders, nested cards, identical card grids, or the hero-metric template.
- Don't make color, motion, hover, audio, or pointer precision the only carrier of meaning.
- Don't let CMS configuration override accessibility, provenance, authorization, or transactional invariants.
