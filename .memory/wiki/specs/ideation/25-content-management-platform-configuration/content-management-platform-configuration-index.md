# Content Management & Platform Configuration — Index

> **Level**: domain
> **Parent**: [Ideation Index](../ideation-index.md)
> **Status**: [DEEP]
> **Last updated**: 2026-08-02T17:35:49.079Z
> **Owner priority**: Mission-critical; v1 foundation

## Overview

WeJammin's first-party content operating system: structured content types and entries, controlled templates and blocks, navigation, taxonomy/localization, media, typed settings, admin operations, preview/delivery, and governance. It gives a solo platform operator WordPress-like backend breadth without plugins, themes, arbitrary code, or a second identity/authorization plane.

This domain owns editorial/configuration data and workflows. It may reference and compose canonical domain records, but never turns identity, credits, rights, money, mandates, disputes, or entitlements into generic posts.

## Children

| # | Name | Type | Path | Status | Deep Think |
|---|---|---|---|---|---|
| 25.01 | Content Types & Schema Registry | sub-domain | [25.01](./25.01-content-types-schema-registry/) | [DEEP] | 16 hypotheses |
| 25.02 | Content Entries & Editorial Lifecycle | sub-domain | [25.02](./25.02-content-entries-editorial-lifecycle/) | [DEEP] | 16 hypotheses |
| 25.03 | Templates, Blocks & Page Composition | sub-domain | [25.03](./25.03-templates-blocks-page-composition/) | [DEEP] | 16 hypotheses |
| 25.04 | Navigation, Routes & Discovery Metadata | sub-domain | [25.04](./25.04-navigation-routes-discovery-metadata/) | [DEEP] | 16 hypotheses |
| 25.05 | Taxonomies, Localization & Relationships | sub-domain | [25.05](./25.05-taxonomies-localization-relationships/) | [DEEP] | 16 hypotheses |
| 25.06 | Media Library & Asset Governance | sub-domain | [25.06](./25.06-media-library-asset-governance/) | [DEEP] | 16 hypotheses |
| 25.07 | Settings, Flags & Configuration Governance | sub-domain | [25.07](./25.07-settings-flags-configuration-governance/) | [DEEP] | 20 hypotheses |
| 25.08 | Admin Workspace & Operations | sub-domain | [25.08](./25.08-admin-workspace-operations/) | [DEEP] | 20 hypotheses |
| 25.09 | Content Delivery, Preview & Cache Coherence | sub-domain | [25.09](./25.09-content-delivery-preview-cache/) | [DEEP] | 16 hypotheses |
| 25.10 | Portability, Governance & Quality | sub-domain | [25.10](./25.10-portability-governance-quality/) | [DEEP] | 16 hypotheses |

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|---|---|---|---|---|
| 25.01 Content types | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only |
| 25.02 Entries | ⚙️ Config | ⚙️ Config | ⚙️ Config | 👁️ Read-only |
| 25.03 Composition | ⚙️ Config | ⚙️ Config | ⚙️ Config | 👁️ Read-only |
| 25.04 Navigation/routes | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only |
| 25.05 Taxonomy/localization | ⚙️ Config | ⚙️ Config | ⚙️ Config | 👁️ Read-only |
| 25.06 Media | ⚙️ Config | ⚙️ Config | ⚙️ Config | 👁️ Read-only |
| 25.07 Settings | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only |
| 25.08 Admin workspace | ❌ None | ❌ None | ❌ None | ❌ None |
| 25.09 Delivery/preview | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only |
| 25.10 Portability/quality | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only |

> Self-service configuration is scoped to a persona's own/represented party through the owning domain. Internal platform staff are bounded account roles with explicit capabilities—not a fifth persona and not equivalent to the venue/studio Operator persona.

## WordPress Capability Coverage

| WordPress-like capability | WeJammin owner | Boundary |
|---|---|---|
| Pages, posts, custom post types and fields | 25.01–25.02 | Structured editorial types only; canonical domain entities stay explicit. |
| Revisions, draft, review, scheduling | 25.02 | Immutable history and risk-based approvals. |
| Templates, blocks, reusable patterns | 25.03 | Approved components only; no themes or arbitrary code. |
| Menus, permalinks, redirects | 25.04 | Versioned/previewed; protected namespaces reserved. |
| Categories, tags, custom taxonomies | 25.05 | Editorial vocabularies integrate with, never duplicate, canonical taxonomies. |
| Media library | 25.06 | Shared object bytes plus rights/provenance/accessibility governance. |
| General/writing/reading/media/privacy settings | 25.07 | Typed registry, explicit scopes, version/approval/rollback. |
| Users and roles | 25.08 consuming domain 01 | Supabase identity plus server/RLS capability grants; no CMS-local users. |
| Dashboard, tools, site health | 25.08 and 25.10 | Capability-filtered operations, import/export, diagnostics. |
| Public delivery and preview | 25.09 | Published projections, isolated preview, cache/version coherence. |
| Comments | Domains 03/20/24 | Existing social, fan, and moderation models; no duplicate CMS comments. |
| Plugins and themes | Won't Have | Explicitly excluded. |

## Decision Log

| # | Decision | Context | Source |
|---|---|---|---|
| D-01 | Content management is mission-critical and a v1 foundation. | Routine operation cannot depend on deployments. | Owner directive |
| D-02 | Build a first-party CMS control plane in the existing web platform. | One auth/RLS/audit/media boundary is safer than a separate control plane. | Owner directive + Deep Think |
| D-03 | Product-operable variables are typed/scoped/versioned settings; scattered literals are prohibited. | Settings need discoverability, safety, preview, and rollback. | Owner directive |
| D-04 | Security invariants, legal floors, ledger rules, authority semantics, migrations, secrets, and transaction guarantees are not ordinary settings. | Ordinary settings would create systemic compromise/error paths. | Deep Think, auto-confirmed |
| D-05 | CMS content may reference and compose canonical domain records but never own/redefine them. | Prevents generic post storage from erasing domain invariants. | Deep Think, auto-confirmed |
| D-06 | Templates use approved blocks and reserved regions; no plugins, themes, arbitrary code, CSS, expressions, or executable templates. | Owner exclusion plus provenance/security locks. | Owner directive |
| D-07 | Every content/config mutation is versioned, attributable, permissioned, previewable, and recoverable. | Trust/commercial surfaces require stronger safety than a blog CMS. | Deep Think, auto-confirmed |
| D-08 | Internal admin is a bounded account role, not a new persona or superuser bypass. | Preserves D-19/D-76 and server/RLS authorization. | Prior lock + Deep Think |
| D-09 | Comments remain in community/fan/moderation domains. | Avoids duplicate identity, consent, moderation, and reputation state. | Deep Think |
| D-10 | The profile fixed spine and reserved provenance treatment constrain CMS composition. | Maintains 01.06.01 D-06/D-10. | Conflict check |
| D-11 | Admin and public delivery are separate trust planes sharing contracts, not unrestricted tables/APIs. | Drafts, settings, and audit must not leak publicly. | Deep Think |
| D-12 | Must features are planned now; phase planning orders production-grade slices and may stage Should features later. | Phases control scope, not quality. | CFSA |

## Open Questions

| # | Question | Owner | Deferred To |
|---|---|---|---|
| Q-01 | PostgreSQL normalized/JSONB split, schema compiler, and migration execution model. | Agent | /create-prd-architecture |
| Q-02 | Block/rich-text editor libraries that meet accessibility, security, and bundle limits. | Agent | /create-prd-stack + design-system |
| Q-03 | Exact cache/tag invalidation and last-known-good delivery topology on Cloudflare. | Agent | /create-prd-architecture |
| Q-04 | Internal staff role names and support organization; capability boundaries are fixed. | Owner later | /write-architecture-spec |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-76|D-76]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-12|D-12]]
