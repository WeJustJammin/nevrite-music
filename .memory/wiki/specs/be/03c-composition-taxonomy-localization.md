# CMS blocks, templates, preview, taxonomy, localization and related content — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]  
**Deep Dive:** [[specs/ia/deep-dives/03-cms-content-modeling|CMS content modeling deep dive]]  
**Editorial Boundary:** [[specs/be/03b-editorial-workflow-publication|CMS editorial workflow]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** 3 of 3; CMS-10 through CMS-16.
- **Boundary:** code-owned block registry, template/pattern composition, exact preview/diff, editorial taxonomies, locale variants/fallback and deterministic related-content curation.
- **Approval:** Recommended split accepted under standing autonomy.

## Composition Invariants

- Code release owns immutable block key/version, Zod props, renderer, child/slot/data-source rules, accessibility contract, compatibility and retirement. CMS selects registered versions/options only; no uploaded JS/CSS/HTML/expression/import.
- Template versions define typed slots, required/permitted blocks, bindings, compatible types/locales/audiences and reserved regions. Shard 02 fixed profile/provenance components cannot be removed/reordered.
- Pattern versions are immutable acyclic block trees. Linked updates require explicit per-instance or bounded reviewed bulk acceptance after diff; detach creates local copy.
- Preview token binds user, acting context, exact entry/schema/template/block/pattern/taxonomy/settings versions, audience/locale/route, nonce and maximum 15-minute expiry; every open reauthorizes; no-store/noindex/no public cache/search.
- Editorial taxonomy may reference but not duplicate canonical domain taxonomies. Term IDs/keys are stable; rename changes labels, merge creates permanent alias/redirect and idempotently migrates assignments.
- Locale fallback is field/type-specific ordered BCP-47 chain. Legal, policy acceptance, safety, jurisdiction and required accessibility fields default no-fallback and block publication if missing/stale.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /internal/v1/cms/block-registry/sync` | signed immutable release manifest/hash; deployment principal | `200` inserted/retired versions; implementation refs code-owned | `403`, `409 MANIFEST_CONFLICT`, `422`, `500` |
| `GET /api/v1/cms/block-registry` | designer filters compatible type/version/state | private registered metadata only | `403`, `422`, `429`, `503` |
| `POST /api/v1/cms/templates` | `{ key,compatibleTypeKeys }`; designer key | `201` template draft v1 | `403`, `409 KEY_EXISTS`, `422`, `429` |
| `POST /api/v1/cms/templates/{id}/versions` | strict slots/block versions/bindings/reserved regions; ETag/key | `201` candidate + impact set | `409 BLOCK_INCOMPATIBLE|RESERVED_REGION_INVALID|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/cms/template-versions/{id}/activate` | approved candidate, MFA, ETag/key | `200` active immutable version + event | `403`, `409 IMPACT_UNRESOLVED|APPROVAL_INVALID|VERSION`, `428`, `429` |
| `POST /api/v1/cms/patterns` and version command | typed acyclic block tree, protected depth/count, key/ETag | `201` immutable draft/version | `409 PATTERN_CYCLE|BLOCK_INCOMPATIBLE`, `422`, `428`, `429` |
| `POST /api/v1/cms/composition-instances/{id}/pattern-actions` | `{ action:"accept_update"|"detach",patternVersionId }`; ETag/key | `200` reviewed linked update or local copy | `409 LOCAL_CHANGES_CONFLICT|PATTERN_STALE|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/cms/previews` | `{ revisionId,audience,locale,route }`; author/reviewer key | `201 { previewUrl,expiresAt,versionSetHash }` | `403`, `409 REVISION_INVALID|DEPENDENCY_UNAVAILABLE`, `422`, `429` |
| `GET /preview/{token}` | opaque token | exact reauthorized render; no-store/noindex | `404 PREVIEW_NOT_FOUND`, `403 PREVIEW_FORBIDDEN`, `429`, `503` |
| `GET /api/v1/cms/previews/{id}/diff` | compare active publication | field/block/relation/version semantic diff | `404`, `409 BASE_PUBLICATION_CHANGED`, `429`, `503` |
| taxonomy create/version | `/api/v1/cms/taxonomies` and `/{id}/versions`; strict key/shape/type/field registry | draft/version + overlap impact | `409 TAXONOMY_OVERLAP|KEY_EXISTS`, `422`, `428`, `429` |
| term create/update/merge | `/taxonomies/{id}/terms`, `/terms/{id}`, `/terms/{id}/merge`; curator ETag/key | stable term, labels/aliases or survivor redirect/job | `409 TERM_KEY_EXISTS|TERM_CYCLE|MERGE_CONFLICT|VERSION`, `422`, `428`, `429` |
| `PUT /api/v1/cms/entries/{id}/locales/{locale}` | source revision, changed field payload; ETag/key | new locale revision/state draft/stale | `409 SOURCE_CHANGED|NO_FALLBACK_FIELD_MISSING|VERSION`, `422 LOCALE_INVALID`, `428`, `429` |
| locale review decision | `/entries/{id}/locales/{locale}/decisions`; translator/reviewer separation | approved or rejected locale state | `403 SELF_APPROVAL`, `409 SOURCE_CHANGED|STATE`, `422`, `428`, `429` |
| `PUT /api/v1/cms/entries/{id}/related-content` | `{ pins[],exclusions[],derivedRuleKeys[] }`; ETag/key | `200` current explainable curation | `409 TARGET_INELIGIBLE|VERSION`, `422 RULE_UNKNOWN`, `428`, `429` |

All admin APIs are no-store, strict, idempotent where mutating and inherit Shard 00 errors/rates. Composition/taxonomy mutations 60/min; previews 30/hour/user and five active/revision; merges/bulk pattern updates return jobs; activation and term merge trace/audit 100%.

## Persistence, RLS and Events

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Template/pattern version | `draft → approved → active`; prior `active → superseded`; draft may become `rejected` | Designer/reviewer/activation triggers. Cycle, incompatible block, unresolved impact or invalid approval blocks activation; active/superseded immutable. |
| Preview grant | `active → revoked|expired` | Owner revoke/timer/base-publication invalidation triggers. Non-active token returns invariant `404`, leaves no cache/search trace and cannot reactivate. |
| Taxonomy version | `draft → approved → active`; prior `active → superseded|retired` | Curator/reviewer activation triggers. Overlap, incompatible scope or invalid hierarchy blocks activation. |
| Taxonomy term | `active → deprecated → merged|retired` | Curator version activation triggers. Merge requires one successor and acyclic graph; terminal key remains reserved. |
| Locale variant | `draft|stale → in_review → approved|rejected`; approved `→ stale` on source-field hash change | Translator/reviewer/source change triggers. Self-approval/source mismatch blocks approval; stale/rejected never serves. |
| Related-content rule | `draft → active → revoked|superseded` | Authorized validation/activation triggers. Missing target, access violation or cycle blocks active; revoked rule cannot hydrate. |

Every unlisted transition returns the named state/version conflict and leaves prior active composition/publication unchanged.

| Table | Invariants |
|---|---|
| `cms.block_definition_versions` | code-owned key/version/schema/renderer/children/data/accessibility/compatibility/lifecycle/hash |
| `cms.template_versions` | key/version/types/slots/reserved/bindings/state/hash; active immutable |
| `cms.pattern_versions` | key/version/tree/state/hash/owner capability; acyclic |
| `cms.composition_instances` | revision/path/slot/block/version/pattern/link mode/props/bindings; unique path |
| `cms.preview_grants` | token hash/user/context/revision/full versions/audience/locale/route/expiry/revoked; no token logging |
| `cms.taxonomy_versions` | stable key/version/owner/shape/type-field scope/state/hash |
| `cms.taxonomy_terms` / `term_labels` | stable term key/parent/lifecycle/successor plus localized labels/aliases; acyclic |
| `cms.locale_variant_states` | entry/revision/locale/source revision/field hashes/state/approval |
| `cms.related_content_rules` | source/target or registered rule/mode pin-exclude-derived/reason/order/state/version |

Public rendering selects exact active publication projections only. Designers/curators/translators/reviewers receive separate RLS views/RPCs; preview grant never broadens target/domain authorization. Domain bindings recheck target existence, visibility and viewer policy at preview, publish and hydration.

Events: `cms.template.activated.v1`, `cms.taxonomy.changed.v1`, `cms.localization.changed.v1`; publication invalidation/rebuild consumes exact IDs/versions. Term assignment migration, pattern bulk acceptance and related recompute are idempotent jobs.

## Failure and Test Gate

- Unsupported/retired block blocks new publish but existing last-known-good renders until security/accessibility revocation requires removal.
- Forwarded/revoked/expired preview denies; no public cache/search/sitemap trace.
- Pattern recursion, depth/count overflow, arbitrary renderer/data source and reserved provenance override reject before save.
- Term merge races select one survivor/version; old IDs resolve permanently; failed assignment batch resumes.
- Source locale change marks only changed-field translations stale; no-fallback field blocks, never borrows another jurisdiction.
- Related pins lead only while eligible; exclusions always win; derived rules are bounded/explainable and disappear safely on unavailable targets.
- Tests cover manifest signatures, props/slots/bindings, accessibility contracts, preview audience/BOLA, pattern diff/detach/cycles, taxonomy overlap/hierarchy/merge, locale fallback/staleness, related ordering and telemetry redaction.

Seven deepening passes converge across consistency, concurrent version changes, rendering/target cascades, roles, observability, abuse and partial-state hygiene. Two implementers receive identical composition, preview, taxonomy, locale and relation semantics.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Composition, taxonomy and localization contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/deep-dives/03-cms-content-modeling|Deep Dive 03 — CMS content modeling and authoring]]
- [[specs/be/03b-editorial-workflow-publication|CMS entries, revisions, review, scheduling and publication — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
