# CMS entries, revisions, review, scheduling and publication — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]  
**Deep Dive:** [[specs/ia/deep-dives/03-cms-content-modeling|CMS content modeling deep dive]]  
**Schema Boundary:** [[specs/be/03a-content-schema-registry|CMS schema registry]]

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

- **Shard split:** 2 of 3; CMS-05 through CMS-09 plus canonical publication transaction from CMS-13.
- **Boundary:** schema-driven entry drafts, advisory presence, immutable revisions/merge/restore, frozen reviews, approvals, schedules and atomic publication versions.
- **Approval:** Recommended split accepted under standing autonomy.

## Editorial Invariants

- Autosave default is 3 seconds idle and hard maximum 30 seconds dirty; explicit save/submit always exists. Presence leases last two minutes and renew every 30 seconds, are advisory and never grant/block writes.
- Revisions are immutable snapshots with schema/template/taxonomy/settings versions, human/acting party, parent revisions, normalized hash, validation and time. Autosave never publishes.
- Non-overlapping changed paths may merge; same-path divergence returns base/theirs/yours safe values and requires explicit resolution. Restore migrates an old revision into a new current-schema draft.
- Submit freezes revision hash and dependency manifest. Protected policy/legal/security/financial disclosure needs two distinct humans/capabilities, named specialist and recent MFA. Any content/dependency/authority change invalidates affected approval.
- Schedule stores local wall time, IANA zone, resolved UTC and tzdb version. DST ambiguity requires explicit earlier/later selection; approved UTC does not silently change.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/cms/entries` | `{ typeId,ownerPartyId?,locale,initialValues }`; author capability/key | `201` entry + immutable revision 1 | `403`, `404 TYPE_NOT_FOUND`, `409 IDEMPOTENCY`, `422 ENTRY_INVALID`, `429` |
| `GET /api/v1/cms/entries/{id}` | editor/reviewer capability | private entry/current draft/publication/task state, ETag | `404 ENTRY_NOT_FOUND`, `403`, `429`, `503` |
| `PUT /api/v1/cms/entries/{id}/presence` | `{ currentFieldId? }` | `200` two-minute lease; no authority | `403`, `404`, `422`, `429` |
| `POST /api/v1/cms/entries/{id}/revisions` | `{ baseRevisionId,changedPaths,values,clientSaveId }`; ETag/key | `201` new revision or auto-merge revision with both parents | `409 SAME_FIELD_CONFLICT|VERSION_CONFLICT|SCHEMA_STALE`, `422`, `428`, `429` |
| `POST /api/v1/cms/entries/{id}/merge-revisions` | `{ baseId,theirsId,yoursId,resolutions[] }`; ETag/key | `201` explicit two-parent resolved revision | `409 MERGE_INPUT_STALE|UNRESOLVED_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/cms/entries/{id}/revision-diff` | `from`, `to` UUID query | schema-aware field/block/relation linear diff | `404`, `422 INCOMPATIBLE_REVISION`, `429`, `503` |
| `POST /api/v1/cms/entries/{id}/restore-revisions` | `{ revisionId }`; ETag/key | `201` migrated new draft; old unchanged | `409 MIGRATION_PATH_MISSING|VERSION_CONFLICT`, `422`, `428`, `429`, `503` |
| `POST /api/v1/cms/editorial-reviews` | `{ revisionId,riskClass,reviewerCapabilities }`; key | `201` open review with frozen hash/dependencies | `403`, `409 REVIEW_EXISTS|PREFLIGHT_FAILED`, `422`, `429`, `503` |
| `POST /api/v1/cms/editorial-reviews/{id}/decisions` | `{ decision,reasonCode,comment? }`; reviewer ETag/key; MFA protected | `200` review approved/rejected/open | `403 SELF_APPROVAL|STEP_UP_REQUIRED`, `409 HASH_CHANGED|DEPENDENCY_CHANGED|REVIEW_STATE`, `422`, `428`, `429` |
| `POST /api/v1/cms/publication-schedules` | `{ entryId,revisionId,action,localDatetime,timezone,dstChoice?,expiresAction? }`; approved revision ETag/key | `201` pending schedule + resolved instant/tzdb | `409 APPROVAL_INVALID|SCHEDULE_CONFLICT`, `422 TIME_AMBIGUOUS|TIMEZONE_INVALID`, `428`, `429` |
| `DELETE /api/v1/cms/publication-schedules/{id}` | ETag/key | `204` cancelled unless executing/completed | `404`, `409 SCHEDULE_STATE`, `428`, `429` |
| `POST /api/v1/cms/entries/{id}/publish` | `{ revisionId,audience,locales }`; publisher MFA, ETag/key | `200 PublicationVersion` or `202 JobStatus`; exact approved set | `403 STEP_UP_REQUIRED|PUBLISH_FORBIDDEN`, `409 APPROVAL_INVALID|DEPENDENCY_CHANGED|PREFLIGHT_FAILED|VERSION`, `428`, `429`, `503` |
| `POST /api/v1/cms/entries/{id}/unpublish` | `{ audience,locales,reasonCode }`; MFA, ETag/key | `200` revoked publication version/outbox | `403`, `404`, `409`, `428`, `429` |
| archive/delete commands | `/archive`, `/delete` with reason/retention manifest, ETag/key | distinct lifecycle/job; no conflation with unpublish/expiry/hold | `409 LEGAL_HOLD|REFERENCES_EXIST|STATE`, plus common protected errors |

All endpoints inherit strict JSON, no-store, Shard 00 errors/idempotency/ETag/rate headers. Reads 120/min/admin; autosaves 120/min/editor with byte/path caps; reviews 30/hour/reviewer; publish/unpublish 10/min and 100% traced/audited.

## Persistence, Publication and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Entry | `draft → active`; `active → archived`; `archived → active|deletion_pending`; `deletion_pending → deleted|blocked` | First publication/archive/restore/retention job triggers. Legal hold/references block deletion; deleted is terminal and distinct from unpublish. |
| Entry revision | `draft → frozen_review → approved|rejected|stale`; approved may become `published`; restore creates a new draft | Submission freezes hash/dependencies; decision/source change triggers. Frozen/approved/published immutable; self-approval/risk rule blocks decision. |
| Editorial review | `open → approved|rejected|stale|withdrawn` | Authorized decision, dependency/hash change or submitter withdrawal triggers. Non-open review rejects decisions. |
| Publication schedule | `pending → executing → completed|failed_retryable|blocked|cancelled` | Resolved instant scheduler/current approval triggers. DST ambiguity, stale approval or conflict blocks execution; terminal rejects replay. |
| Publication version | `active → revoked|expired|superseded` | Publish atomically supersedes tuple; unpublish/expiry triggers. Non-active version never serves and cannot reactivate. |

Every unlisted transition returns `*_STATE_CONFLICT`; canonical revision/publication history remains append-only.

| Table | Invariants |
|---|---|
| `cms.content_entries` | type/owner/lifecycle/current draft/version; immutable identity |
| `cms.entry_revisions` | entry/revision/schema/template/taxonomy/parents/locales/hash/authors/state/time; immutable |
| `cms.entry_relations` | revision/field/target/version/position; unique; target fields/authority absent |
| `cms.edit_presence` | entry/person/party/lease/field; advisory |
| `cms.editorial_reviews` | revision/frozen hash/dependency manifest/risk/state/due/version |
| `cms.editorial_decisions` | review/reviewer/context/capability/decision/reason/comment/hash/time; unique reviewer/review |
| `cms.publication_schedules` | exact revision/action/local/zone/UTC/tzdb/state/job/version |
| `cms.publication_versions` | exact entry/revision/full version set/locale/audience/hash/state/time; one active per tuple |

Draft/control tables have no public grants. Author, reviewer, specialist, publisher and service roles receive separate projections/RPCs; self-approval and stale reviewer authority fail. Public consumers can select only Shard 04 publication projections, never control tables.

Publish algorithm freezes and rechecks contract, relation, privacy, security, accessibility, rights/media, route/SEO, locale, migration and domain bindings; transaction creates publication version, supersedes prior, audits/idempotency and outbox atomically. Shard 04 converges route/render/search/sitemap/cache by publication ID. Last-known-good remains unless privacy/security/rights/takedown requires fail-closed removal.

Events: `cms.entry.revision-created.v1`, `cms.entry.review-changed.v1`, `cms.publication.changed.v1`. Scheduler transitions `pending→executing→completed|failed_retryable|blocked|cancelled`; duplicate/late execution is idempotent and evidenced.

## Failure and Test Gate

- Database commit/client disconnect replays the same revision/publication.
- Relation target becomes private/deleted or dependency/checker changes: approval invalidates and publish blocks.
- Downstream projection failure leaves canonical pending/degraded; retries by exact publication ID; unsafe revocation bypasses stale last-known-good.
- Tests cover autosave timing, advisory presence, path merges/conflicts, restore migration, immutable history, self/two-person review, stale hashes/dependencies, DST ambiguity, duplicate scheduler, atomic publication, public draft leakage, relation BOLA, RLS and telemetry scrubbing.

Seven deepening passes converge across endpoint consistency, edit/review/schedule races, dependency cascades, roles, telemetry, abuse and partial-state hygiene. Two implementers receive identical revision, approval and publication behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Editorial workflow and publication contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/deep-dives/03-cms-content-modeling|Deep Dive 03 — CMS content modeling and authoring]]
- [[specs/be/03a-content-schema-registry|CMS content types, schema registry and migrations — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
