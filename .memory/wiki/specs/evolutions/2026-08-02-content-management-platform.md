# Evolution — Content Management & Settings-First Platform

## Change Request

Treat WeJammin as a content-management platform with WordPress-like backend breadth: editable structured content/post types, pages and posts, menu and navigation management, controlled templates, media, taxonomies, publishing operations, and a full admin dashboard. Content management is mission-critical. Product-operable variables should be settings rather than hard-coded values. Plugins and themes are excluded.

## Classification

| Dimension | Result |
|---|---|
| Change type | New feature plus new product requirement |
| Entry layer | Ideation |
| Node classification | New top-level product domain: `25 Content Management & Platform Configuration` |
| Cross-cut classification | Settings-first operability policy affecting all domains |
| Primary surface | Existing responsive web platform; admin routes are a protected workspace on the same surface |
| Architecture notes | First-party CMS control plane, schema/version strategy, delivery/cache invalidation, and settings evaluation belong in `/create-prd` |
| Explicit exclusions | Plugins, themes, arbitrary executable templates, arbitrary admin code, generic transactional-domain storage |
| Approval | Owner-directed; accepted under the active autonomy delegation |

## Node-Gate Findings

| Concept | Existing-domain fit | Interacting capabilities | Classification | Reason |
|---|---|---|---|---|
| Structured content and custom content types | No single owner | Schemas, fields, relations, lifecycle, migration | Domain 25 sub-domain | Shared operating capability across public and editorial surfaces |
| Templates and page composition | Partially overlaps `01.06.01` | Blocks, layouts, bindings, preview, versions | Domain 25 sub-domain with CX to 01 | Existing profile spine remains a locked consumer and constraint |
| Menus, navigation, routes | No owner | Trees, locations, visibility, slugs, redirects | Domain 25 sub-domain | Explicit owner requirement and cross-surface public dependency |
| Media library | Existing media cross-cut lacks editorial operations | Upload, metadata, renditions, reuse, rights | Domain 25 sub-domain with media cross-cut | Reuses object infrastructure without redefining project/digital-goods assets |
| Settings-first operation | Previously routed only as architecture | Definitions, scopes, inheritance, approval, rollback | Domain 25 sub-domain plus global policy | Operator-facing product behavior makes this more than implementation machinery |
| Admin dashboard | Internal operator was previously unresolved | Work queues, search, bulk actions, capabilities, diagnostics | Domain 25 sub-domain | Daily operating surface with multiple interacting workflows |
| Plugins and themes | Explicitly rejected | N/A | Won't have | Avoids executable extension and arbitrary presentation attack surfaces |

## Locked Boundary

Use the CMS for editorial content, presentation composition, navigation, metadata, and product-operable configuration. Canonical transactional records—identity, credits, rights, money, authority, disputes, and entitlements—retain explicit domain schemas and state machines. CMS entries may reference and render those records but never own or redefine them.

## Cascade Scope

1. Add and deepen domain 25 plus global cross-cuts.
2. Update ideation index, domain map, constraints, MoSCoW/feature ledgers, and vision.
3. Update architecture draft, relevance index, persistence map, security/data boundaries, and phase assumptions.
4. Record consistency and conflict checks.
5. Resume `/create-prd-stack` at CI/CD only after the cascade is complete.

## Conflict Check

- Compatible with `01.06.01 D-06/D-10`: platform-controlled composition and reserved provenance styling remain fixed constraints; no user themes.
- Refines the former “Feature Flags, Experiments & Configuration” architecture-only routing: settings now has operator-facing product behavior, while runtime evaluation remains architecture work.
- Changes D-31 release sequencing by adding the CMS/settings foundation to v1; detailed slice order remains `/plan-phase` work.
- Does not replace the canonical-data, media, audit, permissions, localization, public-SEO, or integration cross-cuts; domain 25 consumes and coordinates them.

## Completed Cascade

- Added domain 25 with 10 sub-domains, 42 `[DEEP]` feature specifications, 42 Role Lenses, 10 sub-domain CX files, and one domain CX contract.
- Added 35 Must and 7 Should features; project totals are now 25 domains, 776 features, 230 Must, 292 Should, 201 Could, and 53 Won't.
- Added all 24 domain-25 seams; global interaction coverage is now 230 of 300 possible domain pairs.
- Updated vision, constraints, domain map, MoSCoW ledger, feature ledger, architecture draft, stack relevance index, persistence query map, and release sequencing.
- Added launch content types: page, post, announcement, policy, help, and landing.
- Added the configuration classification matrix, zero-unclassified-product-literals release gate, missing/fallback semantics, and numeric CMS operability metrics.

## Bootstrap and Dependency Check

- No external CMS, plugin system, theme engine, language, database, object store, queue, or paid service was introduced.
- Existing confirmed Supabase PostgreSQL/Storage/Auth, Cloudflare Workers/Queues, and TypeScript boundaries remain sufficient at this decision layer.
- No bootstrap map cell changed; a bootstrap invocation was not required.

## Ambiguity and Consistency

- Initial delta audit found five gaps and remediated all five.
- Fresh rerun processed 75/75 affected documents and passed at 0% delta ambiguity.
- Reports: `.memory/wiki/specs/audits/2026-08-02-cms-evolution-initial.md` and `.memory/wiki/specs/audits/2026-08-02-cms-evolution-rerun.md`.
- No callable `memory_compile` tool is available in this runtime; source documents and cross-reference ledgers are updated directly.

## Status

**COMPLETE.** Resume `/create-prd-stack` at CI/CD source synthesis.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-31|D-31]]
