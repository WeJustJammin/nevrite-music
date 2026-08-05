# Design System Synthesis

## Navigation Paradigm

- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.08-admin-workspace-operations/25.08-admin-workspace-operations-index.md` requires deep admin navigation across task inboxes, global search, bulk actions, capability management, audit, and diagnostics; these destinations need visible persistent orientation on wide screens.
- `.memory/wiki/specs/ideation/meta/constraints.md` makes responsive web/PWA the only v1 surface and explicitly includes phone-shaped venue/studio workflows; the shell must adapt to thumb reach without pretending all 25 domains fit in five tabs.
- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.04-navigation-routes-discovery-metadata/25.04-navigation-routes-discovery-metadata-index.md` makes menu locations and visibility policy governed data, so navigation must expose named locations rather than hard-coded route lists.

## Layout Grid

- `.memory/wiki/specs/ideation/18-show-production-touring/18.07-show-day-schedule/18.07-show-day-schedule-index.md` contains timeline, conflict, and live schedule views that benefit from wide aligned columns and responsive horizontal prioritization.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.01-canonical-gear-catalog/13.01-canonical-gear-catalog-index.md` requires faceted catalog/search and attribute comparison, while public content still needs readable line lengths; one hybrid grid must support both dense and editorial widths.

## Page Archetypes

- `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.01-profile-page-composition.md` defines a fixed Header → Now → Record → Detail public profile spine and per-fact provenance, requiring a dedicated public-record archetype rather than a generic detail card.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md` combines project rooms, file review, approvals, contributors, and session capture, requiring collaboration/review and guided-workflow archetypes.
- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/content-management-platform-configuration-index.md` adds editor/preview, admin operations, settings registries, media, schema, and publication workflows that cannot fit one dashboard archetype.

## Global Component Inventory

- `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md` makes acting context a global write boundary, so the shell needs an attributable context switcher and authority indicator.
- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.03-templates-blocks-page-composition/25.03.01-approved-block-registry.md` requires shared block selection, validation, preview, version, and protected-region components rather than feature-local editor inventions.
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md` and the global provenance thesis require reusable state, evidence, audit, escalation, and recovery primitives across domains.

## Motion Language

- `DESIGN.md` locks responsive feedback at 150–220 ms, forbids layout animation and choreography in product UI, and requires reduced-motion support.
- `.memory/wiki/specs/ideation/meta/constraints.md` sets normal-web p95 below two seconds and mobile/PWA use; motion cannot delay task readiness or disguise latency.

## Data Density Philosophy

- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.08-admin-workspace-operations/25.08.02-global-search-filtering-bulk-actions.md` requires dense search, filtering, selection, and bulk operations, while `PRODUCT.md` rejects generic dashboards and requires one clear task.
- `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.01-profile-page-composition.md` requires stranger-readable public identity and provenance; public record/content routes need more breathing room than operational tables.

## Global State Design Language

- `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.01-profile-page-composition.md` explicitly forbids failed, timed-out, denied, or partial loads from rendering as absence and requires section skeletons only where existence is already known.
- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.09-content-delivery-preview-cache/25.09.04-degraded-delivery-recovery.md` requires last-known-good public output, explicit stale/degraded state, and fail-closed security/takedown overrides.
- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.10-portability-governance-quality/25.10.03-accessibility-content-quality-gates.md` requires accessible validation and failure communication; state cannot depend on color, animation, hover, or transient toast alone.
