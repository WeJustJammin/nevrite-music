# Shard 03 — CMS content modeling and authoring

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/03-cms-content-modeling.md](deep-dives/03-cms-content-modeling.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 03 is the CMS authoring control plane. It owns bounded editorial type definitions, field schemas, content entries, revisions, review/approval, scheduling, code-approved blocks, templates, reusable patterns, previews, editorial taxonomies, locale variants, and related-content curation. It gives authorized staff WordPress-like operational breadth while prohibiting plugins, themes, arbitrary code, and conversion of identity, authority, money, rights, credits, disputes, or entitlements into generic content.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 4 |
| Child capabilities reconciled | 16 |
| Source documents loaded | 24 |
| Added or removed feature boundaries | 0 |
| Canonical-domain boundary | References only; no copied ownership/authority/transaction state |
| Split handling | Parent IA plus one approved deep dive |

## Features

- **25.01 Content Types & Schema Registry** — immutable type keys, typed field definitions, safe defaults, relation/domain bindings, immutable schema versions, compatibility checks, and explicit migrations.
- **25.02 Content Entries & Editorial Lifecycle** — schema-driven drafts, autosave/presence, immutable revisions, compare/restore, ownership/review, approvals, scheduling, expiry, and archive.
- **25.03 Templates, Blocks & Page Composition** — code-owned approved block registry, named template slots/bindings, reusable patterns, exact preview/diff, and safe atomic publication.
- **25.05 Taxonomies, Localization & Relationships** — editorial vocabularies/terms, governed assignment and merge aliases, locale variants/fallback, and manual-plus-derived related content.

## Acceptance Criteria

- **AC-CMS-01 — Create content type draft:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized schema designer selects immutable key, label, ownership, workflow, fields, relations, templates, and capabilities from approved registries, and (6) return Private version 1 draft with validation/impact state; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-02 — Change field schema:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add/deprecate/change one field definition; preview affected entries/templates/API projections and classify compatibility, and (6) return Compatible draft saves; breaking draft requires migration plan before review; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-03 — Bind domain record:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Define read-only typed relation to an allowlisted domain projection; target access/visibility is evaluated at preview/read/publish, and (6) return Binding stores canonical target kind/ID rules, never authority; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-04 — Activate schema version:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze candidate, run dry-run migration/preflight, collect approvals, then atomically mark version active and enqueue migration/projection work, and (6) return Prior active remains usable until switch; version cannot mutate; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-05 — Create/edit entry:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Open schema-driven draft, acquire renewable presence lease, edit structured fields/blocks/relations, and autosave with expected version, and (6) return New attributable revision; autosave never publishes; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-06 — Resolve concurrent edit:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Different fields merge; same-field/version divergence surfaces both values and requires explicit choice, and (6) return No silent overwrite; resolved revision references both parents; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-07 — Compare/restore revision:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compare field/block/relation changes across schema-aware versions; restore creates a new draft under current compatible schema, and (6) return History remains append-only; no past revision changes; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-08 — Submit/review/approve:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze candidate hash/version; assign eligible reviewers; comments/rejections are attributable; high-risk classes require separation, and (6) return Approved candidate remains invalid if content/dependency/authority changes; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-09 — Schedule publish/expire:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Choose local timezone/instant and optional expiry/archive action; preflight immediately and again at execution, and (6) return Idempotent job transitions exact approved version once; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-10 — Register block version:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Developer release registers typed props, allowed children/data sources, accessibility contract, renderer, compatibility, and retirement policy, and (6) return Admin may configure only registered version/options; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-11 — Define template:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compose named slots from approved block versions and bindings; preserve reserved regions and content-type compatibility, and (6) return Versioned template candidate with exact impact set; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-12 — Use reusable pattern:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Insert linked pattern, accept reviewed update diff, or detach to local copy, and (6) return Pattern never silently overwrites local content; recursive graph rejected; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-13 — Preview/diff/publish:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create short audience-bound preview over exact entry/schema/template/taxonomy/settings versions; compare to active projection; publish chosen set, and (6) return Canonical publication and outbox commit atomically; public convergence is versioned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-14 — Govern taxonomy term:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Curator proposes/create/rename/alias/deprecate/merge term after overlap and impact checks, and (6) return Stable term ID/key survives aliases/merge redirects; assignments converge; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CMS-15 — Author locale variant:** Given Translate allowed fields, track `untranslated, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Author locale variant, and (6) return draft; if the flow cannot complete, review.
- **AC-CMS-16 — Curate related content:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Pin/exclude eligible targets and review explainable derived candidates; target authorization and publication state recheck, and (6) return Manual pins lead, exclusions win, stale/unavailable targets disappear safely; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| CMS-01 | Create content type draft | Authorized schema designer selects immutable key, label, ownership, workflow, fields, relations, templates, and capabilities from approved registries. | Private version 1 draft with validation/impact state. |
| CMS-02 | Change field schema | Add/deprecate/change one field definition; preview affected entries/templates/API projections and classify compatibility. | Compatible draft saves; breaking draft requires migration plan before review. |
| CMS-03 | Bind domain record | Define read-only typed relation to an allowlisted domain projection; target access/visibility is evaluated at preview/read/publish. | Binding stores canonical target kind/ID rules, never authority. |
| CMS-04 | Activate schema version | Freeze candidate, run dry-run migration/preflight, collect approvals, then atomically mark version active and enqueue migration/projection work. | Prior active remains usable until switch; version cannot mutate. |
| CMS-05 | Create/edit entry | Open schema-driven draft, acquire renewable presence lease, edit structured fields/blocks/relations, and autosave with expected version. | New attributable revision; autosave never publishes. |
| CMS-06 | Resolve concurrent edit | Different fields merge; same-field/version divergence surfaces both values and requires explicit choice. | No silent overwrite; resolved revision references both parents. |
| CMS-07 | Compare/restore revision | Compare field/block/relation changes across schema-aware versions; restore creates a new draft under current compatible schema. | History remains append-only; no past revision changes. |
| CMS-08 | Submit/review/approve | Freeze candidate hash/version; assign eligible reviewers; comments/rejections are attributable; high-risk classes require separation. | Approved candidate remains invalid if content/dependency/authority changes. |
| CMS-09 | Schedule publish/expire | Choose local timezone/instant and optional expiry/archive action; preflight immediately and again at execution. | Idempotent job transitions exact approved version once. |
| CMS-10 | Register block version | Developer release registers typed props, allowed children/data sources, accessibility contract, renderer, compatibility, and retirement policy. | Admin may configure only registered version/options. |
| CMS-11 | Define template | Compose named slots from approved block versions and bindings; preserve reserved regions and content-type compatibility. | Versioned template candidate with exact impact set. |
| CMS-12 | Use reusable pattern | Insert linked pattern, accept reviewed update diff, or detach to local copy. | Pattern never silently overwrites local content; recursive graph rejected. |
| CMS-13 | Preview/diff/publish | Create short audience-bound preview over exact entry/schema/template/taxonomy/settings versions; compare to active projection; publish chosen set. | Canonical publication and outbox commit atomically; public convergence is versioned. |
| CMS-14 | Govern taxonomy term | Curator proposes/create/rename/alias/deprecate/merge term after overlap and impact checks. | Stable term ID/key survives aliases/merge redirects; assignments converge. |
| CMS-15 | Author locale variant | Translate allowed fields, track `untranslated|draft|review|approved|stale`, and preview explicit fallback chain. | Legal/safety/no-fallback fields block locale publish when absent/stale. |
| CMS-16 | Curate related content | Pin/exclude eligible targets and review explainable derived candidates; target authorization and publication state recheck. | Manual pins lead, exclusions win, stale/unavailable targets disappear safely. |

### Global Interaction Rules

- Every definition/value/change is typed, scoped, versioned, attributable, previewable, auditable, and reversible by a new version—not an in-place production edit.
- Product-operable variables use governed definitions/settings; security, authorization, legal floors, money/ledger, state-machine, migration, evidence, and secret invariants remain code/rule-pack contracts.
- Drafting may continue during non-critical dependency failure; activation/publish fails closed when validation, authority, privacy, accessibility, migration, or required dependency evidence is unavailable.

## Contracts

### Content Type and Field Registry

| Contract | Locked rule |
|---|---|
| Built-in types | `page, post, announcement, policy, help, landing`; keys immutable/never reused; labels may version. Additional editorial types use approved registries. |
| Reserved concepts | Users/parties, profiles, assets, menus, settings, comments, credits, rights, money, mandates, disputes, entitlements, and canonical domain entities cannot be CMS types. |
| Field kinds | `short_text, long_text, rich_text, boolean, integer, decimal, date, datetime, enum, taxonomy, relation, media, object, list`; each has kind-specific strict schema. |
| Field identity | Stable immutable field key and UUID. Label/help/editor UI may version. Removal is deprecation until migration/reference/retention checks permit retirement. |
| Value semantics | Missing, explicit null, empty, inherited/default, and localized fallback are distinct. Defaults apply only at draft creation/read resolution and never fabricate attested/transactional facts. |
| Storage | Control-plane definitions are normalized PostgreSQL rows; entry revision payload is validated structured JSONB keyed by stable field IDs plus normalized relation/term/block link tables. No general EAV or arbitrary columns. |

### Editorial Lifecycle

| Contract | Locked rule |
|---|---|
| Entry identity | One immutable entry UUID/type; mutable work is immutable revisions; one current draft candidate and one active publication per locale/audience where allowed. |
| Autosave | Protected configurable default: 3 seconds idle, hard maximum 30 seconds between dirty saves; explicit save/submit always available. |
| Presence | Advisory 2-minute lease renewed every 30 seconds; never blocks a second editor; same-field conflicts are explicit. |
| Revision | Snapshot stores schema/template/taxonomy versions, author human/acting party, parent revision(s), normalized content hash, validation result, and timestamp. |
| Risk review | Ordinary editorial requires author≠publisher where workflow says review. Policy/legal/security/financial disclosure requires two-person approval, named specialist capability, and recent MFA. |
| Schedule | Store requested local datetime, IANA timezone, resolved UTC instant, and timezone database version; later timezone-rule changes do not silently alter instant. |
| Archive/delete | Unpublish, expire, archive, delete/anonymize, legal hold, and revision retention are distinct commands and states. |

### Templates, Blocks, Taxonomy, and Locale

| Contract | Locked rule |
|---|---|
| Block registry | Code-owned immutable key/version, Zod props, renderer, children/slot rules, data-source permission, accessibility requirements, compatibility, and retirement. No uploaded JS/CSS/template/expression. |
| Template | Versioned slots, permitted/required block versions, bindings, content types, locale/audience, reserved regions. Shard 02 provenance treatment and fixed profile spine cannot be overridden. |
| Pattern | Immutable versions with linked or detached instances. Linked update requires explicit per-instance/eligible bulk acceptance after diff. |
| Preview | 15-minute default/max token, exact version set, audience/user/capability bound, revocable, `no-store`, `noindex`, excluded from public cache/search. |
| Taxonomy | Editorial vocabularies may reference canonical taxonomy IDs but cannot duplicate/override them. Stable term keys/IDs, curator, allowed types, hierarchy rule, lifecycle required. |
| Localization | BCP 47 locale IDs, one source locale, explicit ordered fallback per type/field, stale-on-source-change. Legal/safety/jurisdictional fields default `no_fallback`. |
| Related content | Manual pins ordered first, explicit exclusions always win, derived candidates carry reason/version, and no recommendation grants access. |

## Data Models

| Model | Purpose and core fields |
|---|---|
| `ContentType` | immutable key/UUID, owner capability, built-in flag, lifecycle. |
| `ContentTypeVersion` | type, version, labels, workflow, default locale/template, state/hash, supersedes. |
| `FieldDefinitionVersion` | type version, stable field ID/key, kind, strict constraints, required/default/localization/editor metadata, lifecycle. |
| `RelationDefinition` | field, target content/domain kind, cardinality, allowed projection, delete/unavailable behavior. |
| `SchemaMigrationPlan` | from/to versions, classification, transform registry key/version, dry-run result, cursor/progress/state. |
| `ContentEntry` | UUID, content type, owner party?, lifecycle, created actor/time, version. |
| `EntryRevision` | entry, revision number, schema/template/taxonomy versions, locale payload hash, author/context, parents, state. |
| `EntryFieldValue` | revision/locale, structured JSONB payload validated by compiled schema. |
| `EntryRelation` | revision, field ID, target kind/UUID/version expectation, position. |
| `EditorialReview` | revision, risk class, state, required capabilities/count, frozen hash/dependency set. |
| `EditorialDecision` | review, reviewer human/context, approve/reject, reason/comment, time. |
| `PublicationSchedule` | revision, local datetime/timezone/resolved instant, action, state/job/version. |
| `BlockDefinitionVersion` | block key/version, props schema, renderer, children/data/access/a11y/compatibility. |
| `TemplateVersion` | template key/version, compatible types, slots/bindings/reserved regions, state/hash. |
| `PatternVersion` | pattern key/version, block tree, owner/state/hash. |
| `CompositionInstance` | revision, slot/path, block/pattern version, linked/detached state, props/bindings. |
| `TaxonomyVersion` / `Term` | vocabulary key/version/owner/rules; stable term key, labels, parent, aliases, lifecycle/redirect. |
| `TermAssignment` | revision/field/term/version/position. |
| `LocaleVariant` | entry revision, locale, source revision, translation state, fallback evidence. |
| `RelatedContentRule` | source entry, pinned/excluded target, derived rule/reason/version, order/state. |

Field constraints, compatibility classes, migration/publish algorithms, and state machines are normative in the deep dive.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`ContentType`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: immutable key/UUID, owner capability, built-in flag, lifecycle..
- **`ContentTypeVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: type, version, labels, workflow, default locale/template, state/hash, supersedes..
- **`FieldDefinitionVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: type version, stable field ID/key, kind, strict constraints, required/default/localization/editor metadata, lifecycle..
- **`RelationDefinition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: field, target content/domain kind, cardinality, allowed projection, delete/unavailable behavior..
- **`SchemaMigrationPlan`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: from/to versions, classification, transform registry key/version, dry-run result, cursor/progress/state..
- **`ContentEntry`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: UUID, content type, owner party?, lifecycle, created actor/time, version..
- **`EntryRevision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: entry, revision number, schema/template/taxonomy versions, locale payload hash, author/context, parents, state..
- **`EntryFieldValue`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: revision/locale, structured JSONB payload validated by compiled schema..
- **`EntryRelation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: revision, field ID, target kind/UUID/version expectation, position..
- **`EditorialReview`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: revision, risk class, state, required capabilities/count, frozen hash/dependency set..
- **`EditorialDecision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: review, reviewer human/context, approve/reject, reason/comment, time..
- **`PublicationSchedule`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: revision, local datetime/timezone/resolved instant, action, state/job/version..
- **`BlockDefinitionVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: block key/version, props schema, renderer, children/data/access/a11y/compatibility..
- **`TemplateVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: template key/version, compatible types, slots/bindings/reserved regions, state/hash..
- **`PatternVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: pattern key/version, block tree, owner/state/hash..
- **`CompositionInstance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: revision, slot/path, block/pattern version, linked/detached state, props/bindings..
- **`TaxonomyVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: vocabulary key/version/owner/rules; stable term key, labels, parent, aliases, lifecycle/redirect..
- **`Term`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: vocabulary key/version/owner/rules; stable term key, labels, parent, aliases, lifecycle/redirect..
- **`TermAssignment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: revision/field/term/version/position..
- **`LocaleVariant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: entry revision, locale, source revision, translation state, fallback evidence..
- **`RelatedContentRule`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: source entry, pinned/excluded target, derived rule/reason/version, order/state..

## Access Control

| Capability | Allowed | Explicit denial |
|---|---|---|
| CMS author | Create/edit assigned entry drafts and eligible relations/media references. | Publish, schema/template/taxonomy changes, private domain access. |
| CMS editor | Review/edit eligible content and return/reject drafts. | Self-approve protected risk class, change platform contracts. |
| CMS publisher | Approve/schedule/publish eligible validated revisions after step-up where required. | Publish stale/unapproved hash or bypass blockers. |
| Schema designer | Draft type/field/relation/migration definitions. | Activate alone, reserve canonical concepts, arbitrary SQL/code. |
| Template designer | Draft approved-block templates/patterns and preview impact. | Upload code/CSS, alter reserved regions/provenance. |
| Taxonomy curator | Govern assigned editorial vocabulary/terms and impact. | Edit canonical domain taxonomy or unrelated vocabulary. |
| Legal/security reviewer | Review assigned protected content/rule metadata with MFA. | General tenant access or ordinary publishing authority by role alone. |
| Service principal | Run one migration/schedule/projection job from registered version. | Interactive editing, wildcard tables, inventing authority from event. |

Platform administration is a named bounded capability, not a persona or universal tenant. Every operation rechecks human, acting context, capability, assignment, risk, target, version, and RLS/RPC at commit.

### Access Escalation

- **CMS author:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **CMS editor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **CMS publisher:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Schema designer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Template designer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Taxonomy curator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Legal/security reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Schema/editor controls have programmatic labels, descriptions, constraints, errors, and keyboard ordering; conditional fields announce visibility/requirement changes.
- Autosave, connection, presence, conflict, validation, review, schedule, migration, and publish states use non-intrusive status messages and never rely on color.
- Field/block reordering supports keyboard move controls and announces source/destination; drag-only composition is prohibited.
- Compare views expose semantic field-level additions/removals/changes and an equivalent linear reading order.
- Preview preserves authoring focus/context and exposes viewport/locale/audience controls without simulating accessibility checks.
- Publishing gates required alt text, heading hierarchy, link purpose, language, accessible block choices, and zero Critical/Serious axe findings on governed templates.
- Time scheduling labels timezone and resolved instant; DST ambiguity requires explicit earlier/later choice.

## Event Schemas

All events use Shard 00 identifier-only envelopes.

| Event type | Payload | Consumer contract |
|---|---|---|
| `cms.schema.activated.v1` | `{ contentTypeId, schemaVersionId, migrationPlanId? }` | Migration, editor, projection consumers load exact version. |
| `cms.entry.revision-created.v1` | `{ entryId, revisionId }` | Review/search-draft/task consumers refetch under capability. |
| `cms.entry.review-changed.v1` | `{ reviewId, revisionId }` | Task inbox/notifications refetch frozen decision state. |
| `cms.publication.changed.v1` | `{ entryId, publicationVersionId }` | Shard 04 route/cache/search/sitemap and subscribers converge. |
| `cms.template.activated.v1` | `{ templateId, templateVersionId }` | Impacted entries/previews/publication preflight re-evaluate. |
| `cms.taxonomy.changed.v1` | `{ taxonomyId, taxonomyVersionId }` | Assignments/search/navigation projections refetch aliases/terms. |
| `cms.localization.changed.v1` | `{ entryId, locale, revisionId }` | Locale projection/fallback consumers rebuild exact variant. |

## Edge Cases

| Case | Required result |
|---|---|
| Type/field key collides with reserved/retired meaning | Reject activation; draft/history survive; key never reused. |
| Required field added to populated entries | Breaking migration required unless safe non-fabricating default and complete impact proof exist. |
| Relation target becomes private/embargoed/deleted | Viewer read rechecks; omit/block per relation contract; never leak existence or copy stale fields. |
| Migration partially succeeds | Resume from durable cursor/idempotency; old active version remains readable until switch. |
| Two editors change same field | Preserve both revisions and require explicit resolution; no silent last-write-wins. |
| Authority revoked during autosave/review | Reject commit, preserve local unsent value, remove active presence/assignment. |
| Draft changes after approval | Approval invalidates automatically because hash/dependency set differs. |
| Scheduler runs twice/late | Idempotent exact-version transition; record actual time/deviation; no duplicate publication. |
| DST time is ambiguous/nonexistent | Require explicit earlier/later valid instant or reject nonexistent time with alternatives. |
| Block version withdrawn | Existing publication uses last approved compatible renderer unless security/takedown requires fail closed; new publish blocked. |
| Template attempts reserved provenance/profile reorder | Validation rejects before review/publish. |
| Linked pattern updates with local overrides | Show three-way diff; require accept/detach; never overwrite silently. |
| Preview token forwarded/revoked | Audience/capability recheck denies; no public cache/search trace. |
| Publish races newer schema/template/taxonomy | Expected version-set conflict; candidate returns to preflight. |
| Taxonomy term merge races assignment | Lock terms/aliases; preserve old ID redirect; assignment converges once. |
| Canonical taxonomy overlap | Reject editorial vocabulary/term; reference canonical ID instead. |
| Source locale changes | Mark dependent translations stale; no-fallback fields block locale publication. |
| Related target becomes unavailable | Remove from public relation, retain editorial explanation/history, refill only from eligible candidates. |
| Control plane unavailable | Public delivery keeps validated last-known-good unless privacy/security/takedown requires immediate fail-closed removal. |

## Surface Applicability

- **Primary**: Responsive web/PWA CMS schema, authoring, review, composition, preview, taxonomy, localization, and relationship administration.
- **Server**: Hono admin APIs, PostgreSQL control-plane/RLS/RPC/migrations, Worker schedule/Queue jobs, Astro preview/render contracts.
- **Public output**: Shard 04 consumes immutable publication projections; public routes never query draft/control-plane tables.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| CMS-01 Create content type draft | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-02 Change field schema | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-03 Bind domain record | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-04 Activate schema version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-05 Create/edit entry | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-06 Resolve concurrent edit | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-07 Compare/restore revision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-08 Submit/review/approve | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-09 Schedule publish/expire | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-10 Register block version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-11 Define template | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-12 Use reusable pattern | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-13 Preview/diff/publish | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-14 Govern taxonomy term | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-15 Author locale variant | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CMS-16 Curate related content | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** Shard 00 platform contracts and Shard 01 staff identity/acting-context/capability.
- **Depended on by:** Shard 04 CMS delivery/media and Shard 05 platform configuration/admin.

## Deep Dives Needed

- [CMS content modeling and authoring deep dive](deep-dives/03-cms-content-modeling.md) — storage, compatibility, migrations, revision/approval, composition validation, publication and fallback algorithms.

### Cross-Shard Section Contract Map

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 04 — CMS navigation, media and delivery:** consume [Shard 04 — CMS navigation, media and delivery Contracts](04-cms-delivery-media.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 04 — CMS navigation, media and delivery Event Schemas](04-cms-delivery-media.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 05 — Platform configuration, admin and quality:** consume [Shard 05 — Platform configuration, admin and quality Contracts](05-platform-configuration-admin.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 05 — Platform configuration, admin and quality Event Schemas](05-platform-configuration-admin.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-02 | Authored complete CMS modeling/authoring IA from 24 source documents | /write-architecture-spec-design | All |
| 2026-08-02 | Resolved storage, migration, concurrency, preview, taxonomy, locale and publication variance | /write-architecture-spec-deepen | Contracts, Models, Access, Events, Edge Cases |

## Dependency References

- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/design-system|WeJammin — Design System]]
- [[specs/data-placement-strategy|WeJammin — Data Placement Strategy]]

### Constrains

- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/design-system|Design System]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
