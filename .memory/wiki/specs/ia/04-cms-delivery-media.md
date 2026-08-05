# Shard 04 — CMS navigation, media and delivery

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/04-cms-delivery-media.md](deep-dives/04-cms-delivery-media.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 04 converts Shard 03 publication versions into safe routes, menus, discovery metadata, governed media, public/authenticated read models, previews, caches, and degraded last-known-good delivery. PostgreSQL metadata remains authoritative, Supabase Storage remains private by default, and Cloudflare serves only immutable/versioned projections. Availability never outranks privacy, takedown, rights, or authorization revocation.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 3 |
| Child capabilities reconciled | 12 |
| Source documents loaded | 18 |
| Added or removed feature boundaries | 0 |
| Delivery boundary | Public projections only; no draft/control-plane table reads |
| Split handling | Parent IA plus one approved deep dive |

## Features

- **25.04 Navigation, Routes & Discovery Metadata** — named menu locations, bounded visibility conditions, stable slugs/permalinks/redirects, canonical/SEO/social/breadcrumb/sitemap metadata.
- **25.06 Media Library & Asset Governance** — private ingest, scanning/dedup/metadata, immutable originals/renditions, accessibility metadata, rights/consent/use restrictions, references, replacement, archive/takedown/hold.
- **25.09 Content Delivery, Preview & Cache Coherence** — render-ready read models, authenticated exact-version previews, atomic publication/invalidation, last-known-good delivery, and fail-closed recovery.

## Acceptance Criteria

- **AC-DLV-01 — Create/edit menu tree:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized editor selects named location, typed targets, labels, order, parent, and bounded visibility conditions; validate reachability, cycles, depth, and target eligibility, and (6) return Versioned draft tree; active navigation unchanged; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-02 — Publish menu version:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Preview responsive variants/audiences, approve exact tree hash/targets, and atomically activate complete location version, and (6) return One coherent tree/version; route/cache event emitted; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-03 — Create/change slug:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Normalize locale-aware path, reject reserved/colliding route, preserve canonical old-path redirect, and preview inbound impact, and (6) return Route manifest version maps one canonical path and permanent redirects; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-04 — Configure discovery metadata:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Author bounded title/description/card/breadcrumb/canonical/noindex/structured data; privacy/embargo/legal policy overrides editor values, and (6) return Valid projection or explicit blocker; no protected fact leakage; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-05 — Ingest media:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create pending object metadata and 15-minute upload intent, upload privately, detect type/checksum/metadata, scan/quarantine, and surface possible byte duplicate, and (6) return Asset reaches `ready` only after all required checks; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-06 — Add rights/consent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record claimant/source, basis, uses, territory, term, attribution, consent/evidence references, and owning-domain IDs, and (6) return Rights state is explicit; upload itself proves nothing; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-07 — Generate rendition:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Select registered transform profile, validate source/right/use/accessibility metadata, create deterministic rendition job/key, and (6) return Immutable rendition becomes ready or source remains unavailable for that use; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-08 — Replace/takedown asset:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Enumerate every reference/use, preview scope, and choose replace, revoke, archive, erase, or hold. Takedown/revocation removes delivery first, and (6) return References converge idempotently; retained evidence/audit survives; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-09 — Query published content:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Public/authenticated API selects active publication projection by route/type/locale/audience and hydrates only authorized domain bindings, and (6) return Contract-defined resource/page with immutable publication version/ETag; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-10 — Open preview:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Validate Shard 03 preview token, current user/context/capability, exact version set, audience, and revocation; bypass public cache only, and (6) return No-store/noindex preview or existence-safe denial; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-11 — Converge publication:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Consume publication event, build route/render/menu/media/search/sitemap/cache projections under one publication version, then mark each consumer status, and (6) return Public switch occurs only when required projection set is ready; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DLV-12 — Serve degraded/recover:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) On control-plane/consumer failure, serve eligible last-known-good version; compare versions after recovery and rebuild/purge, and (6) return Truthful degraded status; unsafe/revoked output never served stale; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| DLV-01 | Create/edit menu tree | Authorized editor selects named location, typed targets, labels, order, parent, and bounded visibility conditions; validate reachability, cycles, depth, and target eligibility. | Versioned draft tree; active navigation unchanged. |
| DLV-02 | Publish menu version | Preview responsive variants/audiences, approve exact tree hash/targets, and atomically activate complete location version. | One coherent tree/version; route/cache event emitted. |
| DLV-03 | Create/change slug | Normalize locale-aware path, reject reserved/colliding route, preserve canonical old-path redirect, and preview inbound impact. | Route manifest version maps one canonical path and permanent redirects. |
| DLV-04 | Configure discovery metadata | Author bounded title/description/card/breadcrumb/canonical/noindex/structured data; privacy/embargo/legal policy overrides editor values. | Valid projection or explicit blocker; no protected fact leakage. |
| DLV-05 | Ingest media | Create pending object metadata and 15-minute upload intent, upload privately, detect type/checksum/metadata, scan/quarantine, and surface possible byte duplicate. | Asset reaches `ready` only after all required checks. |
| DLV-06 | Add rights/consent | Record claimant/source, basis, uses, territory, term, attribution, consent/evidence references, and owning-domain IDs. | Rights state is explicit; upload itself proves nothing. |
| DLV-07 | Generate rendition | Select registered transform profile, validate source/right/use/accessibility metadata, create deterministic rendition job/key. | Immutable rendition becomes ready or source remains unavailable for that use. |
| DLV-08 | Replace/takedown asset | Enumerate every reference/use, preview scope, and choose replace, revoke, archive, erase, or hold. Takedown/revocation removes delivery first. | References converge idempotently; retained evidence/audit survives. |
| DLV-09 | Query published content | Public/authenticated API selects active publication projection by route/type/locale/audience and hydrates only authorized domain bindings. | Contract-defined resource/page with immutable publication version/ETag. |
| DLV-10 | Open preview | Validate Shard 03 preview token, current user/context/capability, exact version set, audience, and revocation; bypass public cache only. | No-store/noindex preview or existence-safe denial. |
| DLV-11 | Converge publication | Consume publication event, build route/render/menu/media/search/sitemap/cache projections under one publication version, then mark each consumer status. | Public switch occurs only when required projection set is ready. |
| DLV-12 | Serve degraded/recover | On control-plane/consumer failure, serve eligible last-known-good version; compare versions after recovery and rebuild/purge. | Truthful degraded status; unsafe/revoked output never served stale. |

### Global Interaction Rules

- Navigation visibility is presentation only. Every route/resource independently authenticates and authorizes.
- Menus, routes, metadata, assets, renditions, and projections are immutable versions. Activation replaces pointers, not historical rows.
- Public delivery reads only active render-ready projection tables/objects. Preview/admin reads are structurally separate and `no-store`.
- Security/privacy/takedown/rights revocation has an independent urgent purge path and overrides last-known-good availability.

## Contracts

### Navigation, Route, and Discovery

| Contract | Locked rule |
|---|---|
| Named locations | Launch locations: `primary, utility, footer, legal, account`; code/design system owns location contract; CMS binds one active version per locale/audience class. |
| Menu limits | Protected defaults: maximum depth 3, 200 items/tree, 50 siblings; complete-tree publish only; keyboard-equivalent ordering required. |
| Target kinds | Active content publication, approved internal route, or allowlisted HTTPS external URL. No `javascript:`, data URL, open redirect, preview/admin/private target. |
| Visibility vocabulary | `always, anonymous, authenticated, locale, capability, entitlement, feature_available` with AND over bounded predicates; no arbitrary expressions or sensitive client-derived conditions. |
| Reserved routes | `/api, /admin, /auth, /_astro, /.well-known, /health, /preview` and code-declared prefixes cannot be CMS slugs. |
| Slug/redirect | Unicode NFC, lowercase locale rules, slash-delimited safe segments; one canonical route; permanent redirect history; maximum five hops; cycles/collisions reject. |
| Discovery override | Privacy, unclaimed/suppressed party, embargo, legal/safety, authorization, archive/unpublish and noindex policy override all editorial SEO/social/sitemap settings. |

### Media and Rights

| Contract | Locked rule |
|---|---|
| Storage | Supabase Storage private buckets; PostgreSQL asset/object/reference/right metadata canonical; signed delivery is object/use/audience/version bound. |
| Admission | Declared+detected MIME, magic bytes, extension, bytes/quota, dimensions/duration/pages, checksum, decompression risk, metadata and scanner result must satisfy purpose profile. |
| Deduplication | Content hash may reuse physical bytes, but asset ownership, rights, consent, retention, alt/caption, use, and takedown records never collapse. |
| Original | Immutable byte identity. Correction/replacement creates new asset/version/reference decision; metadata correction is attributable version. |
| Rendition | Code-owned transform profile/version and source hash produce deterministic key; no arbitrary transform expression; output retains source/right lineage. |
| Accessibility | Informative image requires meaningful alt; decorative use explicitly records empty alt; audio/video requires captions/transcript according to use; publication fails required metadata. |
| Rights | `claimed|verified|restricted|expired|disputed|revoked|unknown`; use eligibility is intersection of basis, territory, term, purpose, audience, consent and domain-right state. |

### Delivery and Cache

| Contract | Locked rule |
|---|---|
| Projection | Exact publication ID/version set, route, locale, audience, render tree, discovery metadata and authorized domain-binding descriptors; draft/admin fields absent. |
| Public cache | Static hashed assets: immutable one year. Public HTML/read models default edge max-age 60s + stale-while-revalidate 300s, plus event-driven purge/version keys. Policy is protected/configurable by route class. |
| Private cache | Authenticated/admin/preview responses `no-store`; local caches key user, acting party, audience, contract and entity/publication version and purge on logout/context change. |
| Switch readiness | Required route/render/menu/media-reference projection must succeed before active pointer switches; optional search/sitemap/social consumers may be pending only when page correctness/disclosure is unchanged. |
| Degraded rule | Last-known-good serves only while still authorized, within protected staleness policy, and unaffected by urgent revocation. Unknown/unsafe is unavailable—not absent or healthy. |

## Data Models

| Model | Purpose and core fields |
|---|---|
| `Menu` / `MenuVersion` | stable key/location; locale/audience, complete tree hash, state/version. |
| `MenuItemVersion` | menu version, parent/position, label, target kind/ref, visibility predicates, accessibility metadata. |
| `RouteRecord` | canonical route key, locale, target publication, lifecycle/version. |
| `RedirectRecord` | source path, destination route/path, status 301/308, reason, active period/version. |
| `DiscoveryMetadataVersion` | publication, locale, title/description/canonical/noindex/card/breadcrumb/structured-data version. |
| `AssetRecord` | UUID, owner/party, purpose, classification, object/checksum/detected metadata, lifecycle/version. |
| `AssetRight` | asset, claimant/rightsholder/source, basis, use/territory/term/audience/consent/evidence, state/version. |
| `AssetAccessibility` | asset/use/locale, alt/caption/transcript/focal/decorative state, author/reviewer/version. |
| `TransformProfileVersion` | key/version, accepted source kinds, operations, output constraints, accessibility/rights rules. |
| `RenditionRecord` | asset/source hash, profile/version, output object/checksum/metadata, state/version. |
| `AssetReference` | source entity/revision/path, asset/rendition, use/purpose/audience, active period/version. |
| `TakedownCaseLink` | asset/reference/right, Shard 06/rights case, scope, hold, state/effective time. |
| `PublicationProjection` | publication ID, route/locale/audience, render payload/hash, required consumer states, lifecycle. |
| `ProjectionConsumerState` | publication, consumer, expected/version, state, attempts/error code/time. |
| `DeliveryPurgeRecord` | subject/version/scope, reason, requested/completed evidence, provider refs. |

Detailed states, route/media/publish algorithms, signing, and recovery contracts are normative in the deep dive.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Menu`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: stable key/location; locale/audience, complete tree hash, state/version..
- **`MenuVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: stable key/location; locale/audience, complete tree hash, state/version..
- **`MenuItemVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: menu version, parent/position, label, target kind/ref, visibility predicates, accessibility metadata..
- **`RouteRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: canonical route key, locale, target publication, lifecycle/version..
- **`RedirectRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: source path, destination route/path, status 301/308, reason, active period/version..
- **`DiscoveryMetadataVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: publication, locale, title/description/canonical/noindex/card/breadcrumb/structured-data version..
- **`AssetRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: UUID, owner/party, purpose, classification, object/checksum/detected metadata, lifecycle/version..
- **`AssetRight`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: asset, claimant/rightsholder/source, basis, use/territory/term/audience/consent/evidence, state/version..
- **`AssetAccessibility`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: asset/use/locale, alt/caption/transcript/focal/decorative state, author/reviewer/version..
- **`TransformProfileVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: key/version, accepted source kinds, operations, output constraints, accessibility/rights rules..
- **`RenditionRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: asset/source hash, profile/version, output object/checksum/metadata, state/version..
- **`AssetReference`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: source entity/revision/path, asset/rendition, use/purpose/audience, active period/version..
- **`TakedownCaseLink`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: asset/reference/right, Shard 06/rights case, scope, hold, state/effective time..
- **`PublicationProjection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: publication ID, route/locale/audience, render payload/hash, required consumer states, lifecycle..
- **`ProjectionConsumerState`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: publication, consumer, expected/version, state, attempts/error code/time..
- **`DeliveryPurgeRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: subject/version/scope, reason, requested/completed evidence, provider refs..

## Access Control

| Capability | Allowed | Explicit denial |
|---|---|---|
| Navigation editor | Draft assigned menu/route/discovery changes and preview. | Activate, target unauthorized/private records, create code route. |
| Media contributor | Upload into allowed purpose/owner scope, add metadata/rights claims. | Publish before checks/rights, inspect deduplicated owners, bypass quota/scanner. |
| Media curator | Review metadata/accessibility/renditions and eligible references. | Adjudicate rights, erase held evidence, grant domain authority. |
| CMS publisher | Activate approved route/menu/discovery/publication version after preflight. | Publish stale hash, bypass rights/privacy/a11y, serve draft. |
| Rights/safety operator | Apply assigned restricted/revoke/takedown/hold command after MFA/reason. | General media browsing, rewrite rights fact, delete immutable audit. |
| Preview user | View exact authorized version set for 15 minutes. | Share authority, broaden audience, enter public cache/search. |
| Public visitor | Read active public projection/media allowed for anonymous audience. | Draft, preview, protected objects/metadata, hidden target existence. |
| Delivery principal | Build/purge one registered projection/cache scope. | Read unrelated drafts/private records or choose business truth. |

### Access Escalation

- **Navigation editor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Media contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Media curator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **CMS publisher:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Rights/safety operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Preview user:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Public visitor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Delivery principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Menu editor/tree and public navigation support semantic lists/landmarks, keyboard move/expand, visible focus, current-page state, skip links, and mobile disclosure without hover dependence.
- Conditional navigation never leaves keyboard/screen-reader users without the equivalent reachable route; hidden navigation is not an access-denied explanation.
- Slug/redirect/SEO forms expose normalized preview, collision/loop target, canonical URL, language, and social image alternative.
- Upload and rendition progress are announced; failures identify item/recovery; media library grid has equivalent list/table view.
- Alt/caption/transcript/focal controls include previews and instructions; decorative-empty-alt is an explicit choice, not an empty validation bypass.
- Audio/video players meet keyboard, caption, transcript, focus, motion/autoplay and contrast requirements.
- Degraded/unavailable/takedown states are truthful status content and never render an empty slot that implies no content existed.

## Event Schemas

All events use Shard 00 identifier-only envelopes.

| Event type | Payload | Consumer contract |
|---|---|---|
| `delivery.menu.activated.v1` | `{ menuId, menuVersionId }` | Route/render/cache consumers load exact complete tree. |
| `delivery.route.changed.v1` | `{ routeId, routeManifestVersionId }` | Edge/router/sitemap/redirect consumers refetch manifest. |
| `delivery.asset.changed.v1` | `{ assetId }` | Reference/publication/rendition consumers re-evaluate eligibility. |
| `delivery.rendition.ready.v1` | `{ renditionId, assetId }` | Waiting publication/reference jobs load exact output. |
| `delivery.asset.revoked.v1` | `{ assetId, purgeId }` | Urgent public/private delivery purge and reference re-evaluation. |
| `delivery.projection.ready.v1` | `{ publicationId, projectionId }` | Active-pointer coordinator evaluates readiness. |
| `delivery.purge.completed.v1` | `{ purgeId, subjectType, subjectId }` | Takedown/recovery/admin status verifies provider scopes. |

## Edge Cases

| Case | Required result |
|---|---|
| Menu tree has cycle/orphan/depth overflow | Reject candidate; active complete tree remains. |
| Visibility requires sensitive/stale client data | Reject predicate; target still independently authorizes. |
| Target is removed/private after menu approval | Publish preflight blocks or projection omits according to contract; no existence leak. |
| Slug collides with reserved/locale/canonical route | Reject with exact safe conflict; never shadow code route. |
| Redirect loop/hop overflow | Reject activation; preserve old valid manifest. |
| SEO marks suppressed/unclaimed/private content indexable | Privacy override forces noindex/exclusion and records blocker. |
| Upload declared image but magic bytes differ | Quarantine/reject; no rendition/public object. |
| Scanner unavailable | Asset remains quarantined; draft may reference but publication blocks. |
| Same bytes, different rights/owner | Physical dedup optional; separate asset/right/reference records and access remain. |
| Required rendition fails | Publication/reference stays blocked or uses explicitly approved fallback profile; original not exposed accidentally. |
| Rights expire after publication | Revocation event/purge removes use immediately; source asset/evidence remains protected. |
| Replacement changes crop/meaning/rights | Per-reference preview/approval required; no global silent swap. |
| Preview URL forwarded | Current audience/capability mismatch denies; token reveals no draft existence. |
| Canonical publish commits but cache purge fails | New version-addressed routes remain correct; retry purge and report degraded consumer. |
| Control plane fails during traffic | Serve validated last-known-good within policy; no admin failure blanking public truth. |
| Takedown arrives during degraded mode | Independent urgent purge revokes unsafe output even if control plane is impaired. |
| No safe snapshot exists | Return explicit unavailable state/status and request ID; never fabricate empty/default content. |

## Surface Applicability

- **Primary**: Responsive web/PWA navigation/route/media/discovery administration, media library, preview, public/authenticated content delivery.
- **Server**: Hono query/preview/admin APIs, Supabase PostgreSQL/Storage, Cloudflare Pages/CDN/Workers/Queues, search/sitemap/cache projection consumers.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| DLV-01 Create/edit menu tree | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-02 Publish menu version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-03 Create/change slug | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-04 Configure discovery metadata | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-05 Ingest media | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-06 Add rights/consent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-07 Generate rendition | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-08 Replace/takedown asset | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-09 Query published content | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-10 Open preview | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-11 Converge publication | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DLV-12 Serve degraded/recover | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** Shard 00 platform contracts, Shard 01 authority, and Shard 03 CMS definition/publication control plane.
- **Depended on by:** Shard 05 platform configuration/admin.

## Deep Dives Needed

- [CMS navigation, media and delivery deep dive](deep-dives/04-cms-delivery-media.md) — manifests, storage/rights, projections, signing, purge, cache and recovery algorithms.

### Cross-Shard Section Contract Map

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 03 — CMS content modeling and authoring:** consume [Shard 03 — CMS content modeling and authoring Contracts](03-cms-content-modeling.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 03 — CMS content modeling and authoring Event Schemas](03-cms-content-modeling.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 05 — Platform configuration, admin and quality:** consume [Shard 05 — Platform configuration, admin and quality Contracts](05-platform-configuration-admin.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 05 — Platform configuration, admin and quality Event Schemas](05-platform-configuration-admin.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-02 | Authored complete navigation/media/delivery IA from 18 source documents | /write-architecture-spec-design | All |
| 2026-08-02 | Resolved route, rights, rendition, projection, cache, purge and recovery variance | /write-architecture-spec-deepen | Contracts, Models, Access, Events, Edge Cases |

## Dependency References

- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|WeJammin — Data Placement Strategy]]

### Constrains

- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
