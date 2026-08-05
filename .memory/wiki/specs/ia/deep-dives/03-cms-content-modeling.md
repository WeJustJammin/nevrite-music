# Deep Dive 03 — CMS content modeling and authoring

> **Parent IA Shard**: [../03-cms-content-modeling.md](../03-cms-content-modeling.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive makes Shard 03's dynamic-but-bounded CMS deterministic. Shard 04 owns menus, routes, SEO, media-library delivery, public query APIs, cache/search/sitemap convergence, and degraded delivery. Shard 05 owns settings, flags, admin shell/tasks/search, diagnostics, import/export, and retention operations.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Types, fields, entries, schemas, templates, blocks, terms, locales, reviews, schedules, and publications share immutable-version semantics. |
| What-if expansion | Populated schema changes, concurrent edits, stale approvals, DST, migration interruption, withdrawn blocks, preview forwarding, and locale staleness converge. |
| Adversarial pass | Canonical-domain smuggling, arbitrary code/CSS, permission-by-navigation, draft/cache leakage, provenance override, relation BOLA, and legal fallback fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field, or unresolved implementation choice. |

## Resolved Architecture Choices

| Question | Locked resolution |
|---|---|
| Dynamic schema storage | Normalized definition/version tables plus strictly validated entry-revision JSONB and normalized links; no general ORM/EAV or runtime DDL per type. |
| Schema compiler | Definition versions compile deterministically to Zod 4, OpenAPI/editor metadata, database validation metadata, and renderer binding manifest; artifact hash stored. |
| Admin-created fields/types | Allowed only from protected registries and quotas; no user-authored validator, query, code, renderer, HTML, CSS, expression, or SQL. |
| Autosave/locking | Optimistic revisions plus advisory presence lease; different fields merge, same-field conflicts require explicit choice. |
| Review invalidation | Approval binds exact revision hash, schema/template/taxonomy/settings versions, relation target visibility snapshots, and checker versions. |
| Schedule semantics | Local wall time + IANA zone + resolved UTC + tzdb version. Once approved, UTC instant is authoritative unless editor creates a new schedule version. |
| Breaking migration | Expand → dry-run → resumable backfill → compatibility verify → active switch → later contract. Old version remains readable through switch window. |
| Block execution | Code release owns implementation. CMS selects immutable registered version/props only; unsupported versions block new publish. |
| Pattern update | Explicit accept/detach per instance or bounded reviewed bulk operation; recursive/cyclic graph impossible. |
| Preview | Exact immutable version-set token, 15 minutes, audience/capability bound, no-store/noindex, reauthorized on every request. |
| Taxonomy merge | Survivor keeps ID; retired term becomes permanent alias/redirect; assignments migrate idempotently with impact audit. |
| Locale fallback | Field/type-specific ordered chain. Legal, policy acceptance, safety, jurisdiction and required accessibility content default no-fallback. |
| Related candidates | Explainable bounded deterministic rules only; no opaque model dependency at launch. Manual pins/exclusions are authoritative presentation choices. |

## Canonical Field Contracts

### Definitions and Schemas

| Model | Fields and constraints |
|---|---|
| `content_type` | `id uuid PK, key varchar(64) unique, built_in bool, owner_capability, lifecycle active|retired, created_at`; key lowercase `^[a-z][a-z0-9_]{1,63}$`, immutable. |
| `content_type_version` | `id, content_type_id, version_no integer>0, label, workflow_key/version, source_locale, default_template_id?, state, definition_hash, supersedes_id?, created_by/at, activated_at?`; unique type/version. |
| `field_definition_version` | `id, type_version_id, field_id uuid, key, kind, constraints jsonb, required, default_mode none|literal|inherited, default_value?, localization_mode, editor_config, lifecycle`; unique type-version/key and field ID. |
| `relation_definition` | `field_definition_id, target_kind content|domain, target_type, cardinality one|many, min/max, projection_key, on_unavailable omit|block|placeholder, ordered`; target/projection allowlisted. |
| `schema_artifact` | `type_version_id, compiler_version, zod_contract_ref, editor_manifest jsonb, renderer_manifest jsonb, artifact_hash, compiled_at`; immutable/reproducible. |
| `schema_migration_plan` | `id, type_id, from_version_id, to_version_id, compatibility additive|conditional|breaking, transform_key/version?, dry_run_report, state, cursor?, migrated_count, failed_count, version`. |

### Entries, Reviews, and Publication

| Model | Fields and constraints |
|---|---|
| `content_entry` | `id uuid PK, type_id, owner_party_id?, lifecycle active|archived|deletion_pending|held, current_draft_revision_id?, version, created_by/at`. |
| `entry_revision` | `id, entry_id, revision_no, schema_version_id, template_version_id?, taxonomy_version_ids[], parent_revision_ids[], locale_payloads jsonb, content_hash, author_person_id, acting_party_id, state, created_at`; immutable after save. |
| `entry_relation` | `revision_id, field_id, target_kind, target_id, expected_target_version?, position`; unique revision/field/target; never stores target fields/authority. |
| `edit_presence` | `entry_id, person_id, acting_party_id, lease_until, last_seen_at, current_field_id?`; advisory, no write authority. |
| `editorial_review` | `id, revision_id, frozen_hash, dependency_manifest jsonb, risk_class ordinary|protected, state, submitted_by/at, due_at?, version`. |
| `editorial_decision` | `review_id, reviewer_person_id, acting_party_id, capability, decision approve|reject, reason_code, comment?, decided_at, reviewed_hash`; unique reviewer/review. |
| `publication_schedule` | `id, entry_id, revision_id, action publish|unpublish|expire|archive, local_datetime, timezone, resolved_at_utc, tzdb_version, state, job_id?, version`. |
| `publication_version` | `id, entry_id, revision_id, schema/template/taxonomy/settings version set, locale/audience, publication_hash, state active|superseded|revoked, activated_at`; one active per entry/locale/audience. |

### Composition, Taxonomy, and Locale

| Model | Fields and constraints |
|---|---|
| `block_definition_version` | `block_key, version, props_schema_ref/hash, renderer_ref, allowed_children, data_sources, accessibility_contract, compatible_from/to, lifecycle`; code-release-owned. |
| `template_version` | `id, key, version, compatible_type_keys[], slots jsonb, reserved_regions[], binding_manifest, state, hash`; no arbitrary markup/code. |
| `pattern_version` | `id, key, version, block_tree jsonb, state, hash, owner_capability`; acyclic validated tree. |
| `composition_instance` | `revision_id, path, slot_key, block_key/version, pattern_id/version?, link_mode linked|detached, props jsonb, bindings jsonb`; unique revision/path. |
| `taxonomy_version` | `id, key, version, owner_capability, shape flat|hierarchical, allowed_type/field keys, state, hash`; key immutable. |
| `taxonomy_term` | `id, taxonomy_id, key, parent_id?, lifecycle active|deprecated|merged, successor_id?, created_at`; acyclic parent; stable ID. |
| `term_label` | `term_id, locale, label, description?, aliases[]`; normalized uniqueness within taxonomy/locale where configured. |
| `locale_variant_state` | `entry_id, revision_id, locale, source_locale/revision, state untranslated|draft|review|approved|stale, approved_by/at?`. |
| `related_content_rule` | `source_entry_id, target_entry_id?, rule_key/version?, mode pin|exclude|derived, reason_code, order?, state, version`; cycles allowed only where relation definition permits. |

## State Machines

| Aggregate | Allowed transitions |
|---|---|
| Type/schema/template/taxonomy/pattern version | `draft → review → approved → scheduled|active → superseded|retired`; blocked may return to draft; active content immutable. |
| Entry revision | `draft → submitted → approved|rejected → scheduled|published`; any changed draft creates a new revision and invalidates prior review. |
| Review | `open → approved|rejected|invalidated`; protected review requires required distinct capabilities/humans. |
| Schedule | `pending → executing → completed|failed_retryable|blocked|cancelled`; exact action idempotent. |
| Migration | `draft → dry_running → ready|blocked → running → verifying → completed|failed_retryable|failed_terminal`; resume from cursor. |
| Term | `active → deprecated → merged`; merged cannot reactivate and redirects permanently. |
| Locale | `untranslated → draft → review → approved`; source change makes approved `stale`; explicit revalidation returns approved. |
| Publication | `active → superseded|revoked`; unpublish creates a new state/version and does not delete prior publication evidence. |

## Schema Compilation and Compatibility

1. Validate definition rows against protected registry contracts and reserved-key list.
2. Resolve deterministic field order, defaults, conditional requirements, localization and relation schemas.
3. Compile strict Zod input/output schemas; unknown fields reject except preserved retired fields during migration window.
4. Compile editor manifest, render binding manifest, OpenAPI refs, migration diff, and compatibility class.
5. Hash canonical normalized definition and compiler version; repeated compile must produce the same hash.
6. Additive: new optional field/type label/editor metadata. Conditional: stricter constraint or required field with proven complete non-fabricating transform. Breaking: kind/key/semantic removal, incompatible required/default, relation/cardinality change, or reserved binding change.
7. Activation requires zero unresolved references, valid migration plan for conditional/breaking, impacted template/block compatibility, and dry-run counts/evidence.

## Entry Validation and Revision Merge

- Validate author capability and assignment before loading protected draft and again at save/submit.
- Server normalizes values by field kind; rich text is approved structured AST, never raw executable HTML.
- Defaults are recorded as provenance-bearing resolved values only when materialized; inherited/default display remains distinguishable from authored value.
- Autosave submits changed field paths plus base revision. Non-overlapping paths may create a merge revision with both parents.
- Same path changed from same base yields 409 with base/theirs/yours safe values and requires explicit resolution.
- Relations validate target kind/existence/projection/visibility but publication/read rechecks current target authority/lifecycle.
- Restore translates old revision through registered migration chain into a new draft; no direct activation of obsolete schema.

## Review and Publication Algorithm

1. Submit freezes revision hash and dependency manifest: schema, template, blocks, patterns, terms, locale sources, settings, relation targets/projections, checker/rule-pack versions.
2. Run contract, relation, privacy, security, accessibility, rights/media, route/SEO, locale, migration, and domain-binding preflights owned across Shards 00/01/04/05.
3. Collect workflow-required distinct reviewer decisions. Any revision/dependency/authority change invalidates affected approvals.
4. Schedule or immediate publish re-runs preflight against the frozen set/current revocation state.
5. PostgreSQL transaction creates `publication_version`, marks prior version superseded, records audit/idempotency, and writes one outbox event.
6. Shard 04 builds route/render/search/sitemap/cache projections from exact publication ID. Until convergence, last-known-good remains active unless revocation/takedown/privacy requires fail closed.
7. Failed downstream consumer retries idempotently; canonical control plane shows honest pending/degraded consumer status.

## Migration Algorithm

- Dry run scans every current/draft/revision/template/binding/locale relation affected and records deterministic counts/errors without mutation.
- Backfill uses registered code-owned pure transform over bounded batches, storing cursor, source/target versions, input/output hashes, and failures.
- Failed rows remain on old readable schema and block active switch unless policy explicitly permits a mixed-version compatibility period.
- Verification compares counts, required fields, relation integrity, renderability, accessibility, and sample/full hash rules.
- Switch changes active schema only after readiness evidence. Contract/removal occurs later after no supported app/publication reads old form.
- Rollback before switch stops migration. After switch, correction is forward-fix or active-version switch to a separately compatible version; completed business/editorial evidence is never erased.

## Composition and Preview Validation

- Block props validate against exact registered Zod schema; renderer/data-source references come from code manifest, never content.
- Template slot validates required/allowed blocks, max counts/depth, reserved regions, binding types, and compatible content/schema versions.
- Pattern graph and block tree have maximum protected depth/count settings and reject cycles before save/publish.
- Domain data binding reads only named projection contract and still enforces target/viewer authorization; preview cannot broaden it.
- Shard 02 fixed profile Header→Now→Record→Detail and reserved provenance components are code-owned template constraints.
- Preview token binds user, acting context, target revision, full version set, audience/locale/route, expiry and nonce; every open rechecks capability and revocation.

## Taxonomy, Localization, and Relationship Rules

- Editorial taxonomy creation checks canonical taxonomy registry. Overlap requires reference/mapping, not a duplicate vocabulary.
- Term key immutable; rename changes labels; merge picks survivor, creates alias/redirect, migrates assignments idempotently, and preserves old ID resolution.
- Free text is never silently coerced. Mapping proposal and curated acceptance are separate states.
- Source locale change marks translated fields stale by source field/hash. Unchanged fields may retain approved state.
- Fallback resolves per field through explicit ordered locales, recording chosen source. `no_fallback` returns missing/block state rather than wrong-language/jurisdiction text.
- Manual related pins remain first if target eligible; exclusions always remove; derived candidates declare rule/reason/version and are recomputed from authorized current projections.

## Abuse and Recovery Verification

| Threat/failure | Required proof |
|---|---|
| Canonical entity smuggling | Reserved-key/type/relation tests reject identity, rights, money, authority, dispute and entitlement ownership in CMS. |
| Arbitrary code/style | Schema/block/template inputs reject scripts, expressions, CSS, HTML handlers, dynamic imports, and unknown renderer/data sources. |
| Draft/control leak | Public APIs/caches/search/sitemaps cannot select draft/control tables; preview tokens deny forwarding/revocation/expiry. |
| Relation BOLA | Wrong user/party/target tests fail at authoring preview, publication, and public hydration. |
| Approval bypass | Self-approval, stale hash, revoked reviewer, missing second reviewer, and changed dependency block protected publish. |
| Migration corruption | Dry-run, resume, duplicate batch, partial failure, count/hash/relation/render checks prove convergence. |
| Provenance override | Templates/blocks cannot reorder/remove reserved Shard 02 provenance structure. |
| Locale legal leak | Missing no-fallback field blocks locale publication and never borrows another jurisdiction. |
| Scheduler duplication | Same schedule/job executes publication transition once and records late/duplicate evidence. |
| Control-plane outage | Last-known-good serves; revocation/takedown path can remove unsafe output independently. |

## Cross-Shard Contracts

| Consumer | Contract |
|---|---|
| Shard 04 | Exact publication version, route/render inputs, block/template manifests, media refs, locale/taxonomy/related projections, invalidation event. |
| Shard 05 | Protected registries/settings/risk/checker definitions, admin task/diagnostic status; cannot override Shard 03 invariants. |
| Shard 01 | Human/acting context/capability and optional owner-party refs; CMS references never grant authority. |
| Domain shards | Named read-only projection contracts and canonical IDs; no copied transactional state or table coupling. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [03-cms-content-modeling § Contracts](../03-cms-content-modeling.md#contracts) defines commands/queries and [03-cms-content-modeling § Event Schemas](../03-cms-content-modeling.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-02 | Authored schema, revision, migration, composition, publication, taxonomy, locale and abuse contracts | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
