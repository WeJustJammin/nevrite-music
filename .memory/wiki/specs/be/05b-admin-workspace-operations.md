# Admin workspace, capability grants, bulk operations and diagnostics — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]  
**Deep Dive:** [[specs/ia/deep-dives/05-platform-configuration-admin|Configuration deep dive]]  
**Authority:** [[specs/be/01c-relationships-authority-governance|Party authority and mandates]]

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

- **Shard split:** 2 of 3; CFG-08 through CFG-12.
- **Boundary:** truthful task projections, capability-filtered search/counts, frozen-manifest bulk jobs, temporary scoped admin grants, linked audit projections and registered diagnostics.
- **Approval:** Recommended split accepted under standing autonomy.

## Admin Invariants

- No universal tenant administrator. Every operation rechecks human, acting context, named capability, exact actions/resources/scope, assignment, term, MFA freshness, target/version and RLS/RPC at commit.
- Task/search/diagnostic projections are not business truth. Unknown/stale/partial remains labelled and source domain is re-read before action.
- Search allowlists entity/fields/filters/sort/snippets and applies authorization to each result, aggregate, facet and count before response.
- Bulk dry-run freezes exact ordered target IDs/versions and command version in a protected manifest. Execution never reruns the broad query or adds targets and calls ordinary guarded commands per item.
- Capability grants contain no wildcard action/resource, cannot exceed grantor authority and revoke immediately. Break-glass is bounded, MFA/reason/evidence/notified and auto-expires.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `GET /api/v1/admin/tasks` | cursor/limit/class/severity/due/source; current capabilities | truthful page with source version/freshness/unknown/partial | `401`, `403`, `422`, `429`, `503 TASK_PROJECTION_UNAVAILABLE`, `500` |
| `GET /api/v1/admin/search` | registered entity/filter/sort/query <=200; cursor/limit | capability-filtered results/counts/snippets | `403`, `422 SEARCH_FIELD_NOT_ALLOWED|QUERY_TOO_BROAD`, `429`, `503`, `500` |
| `POST /api/v1/admin/bulk-operations` | `{ commandKey,commandVersion,querySpec }`; key | `201` draft operation | `403 BULK_FORBIDDEN`, `409 IDEMPOTENCY`, `422 COMMAND_NOT_REGISTERED|QUERY_INVALID`, `429` |
| `POST /api/v1/admin/bulk-operations/{id}/dry-run-jobs` | ETag/key | `202 JobStatus`; exact target manifest/hash/count + per-class impact | `409 STATE|VERSION`, `428`, `429`, `503` |
| `POST /api/v1/admin/bulk-operations/{id}/approve` | exact manifest/report hash; risk-required MFA/review, ETag/key | approved frozen operation | `403 STEP_UP_REQUIRED|SELF_APPROVAL`, `409 MANIFEST_CHANGED|APPROVAL_INVALID|VERSION`, `428`, `429` |
| `POST /api/v1/admin/bulk-operations/{id}/run-jobs` | approved ETag/key | `202 JobStatus`; resumable per-target results | `409 NOT_APPROVED|MANIFEST_MISSING|VERSION`, `428`, `429`, `503` |
| `POST /api/v1/admin/bulk-operations/{id}/cancel` | ETag/key | stops future leases; completed effects remain | `409 STATE|VERSION`, `428`, `429` |
| `GET /api/v1/admin/bulk-operations/{id}/items` | cursor/state/error; operation capability | safe per-target status/version/error code | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/admin/capability-grants` | subject/capability/resource/scope/actions/term/reason; grantor ETag/key, MFA; protected needs distinct approval | pending/active grant | `403 GRANT_EXCEEDS_AUTHORITY|STEP_UP_REQUIRED`, `409 OVERLAP|VERSION`, `422 WILDCARD_FORBIDDEN|TERM_INVALID`, `428`, `429` |
| `DELETE /api/v1/admin/capability-grants/{id}` | reason, ETag/key | `204` immediate revoke + session/task invalidation/event | `403`, `404`, `409 STATE|VERSION`, `428`, `429` |
| `GET /api/v1/admin/audit-links` | target/change/request filters; minimum named capability | linked editable-history and safe immutable event references, no copied payload | `403`, `422`, `429`, `503` |
| `GET /api/v1/admin/diagnostics` | definition/target/freshness filters | registered diagnostic state and evidence-safe codes | `403`, `422`, `429`, `503` |
| `POST /api/v1/admin/diagnostic-runs` | definition/version/target/input; capability/key | `202 JobStatus` bounded timeout/freshness/evidence schema | `403`, `409 RUN_EXISTS|DEFINITION_STALE`, `422 INPUT_INVALID`, `429` |

All responses are private/no-store and inherit Shard 00 errors/idempotency/ETag/rate headers. Search/tasks 120/min; bulk/admin mutations 10/min; grant and protected diagnostics 5/min with 100% audit/trace.

## Persistence, Execution and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Capability grant | `pending_approval → active|rejected`; `active → revoked|expired|superseded` | Distinct approval/grantor revoke/term triggers. Grant beyond source authority, wildcard or overlap blocks active; non-active stops new leases immediately. |
| Bulk operation | `draft → dry_running → review_ready|failed`; `review_ready → approved|rejected|stale`; `approved → running → completed|partial|failed|cancelled` | Dry-run/reviewer/worker/cancel triggers. Manifest/hash/grant change invalidates approval; cancellation stops future leases but never reverses completed effects. |
| Bulk item | `pending → leased → succeeded|failed|skipped_version|cancelled` | Exact ordinal lease/ordinary command result triggers. Stale target skips only item; terminal result unique and immutable. |
| Task projection | `open → assigned|resolved|stale|suppressed` | Source-domain event/assignment/freshness triggers. Stale/unknown never reports resolved and cannot authorize action. |
| Diagnostic run | `queued → running → healthy|degraded|unknown|failed|stale` | Registered bounded runner/current evidence triggers. Timeout/unavailable is unknown, never healthy; terminal result cannot auto-repair source state. |
| Search/diagnostic definition | `draft → active → deprecated|retired` | Signed code release triggers. Unknown fields/operators or stale version blocks use; retired definition cannot reactivate. |

Every unlisted transition returns the typed state/version conflict and preserves canonical domain truth.

| Table | Invariants |
|---|---|
| `admin.capability_grants` | subject/capability/resource/scope/actions/term/grantor/approval/evidence/state/version; no wildcard |
| `admin.task_projection` | source type/ID/version/class/required capability/assignee/due/severity/freshness/state; derived |
| `admin.search_definition_versions` | code-owned entity/field/filter/sort/snippet/count policy/lifecycle/hash |
| `admin.bulk_operations` | command/query/target manifest object+hash+count/dry-run/state/cursor/counts/actor/version |
| `admin.bulk_item_results` | operation/target/expected version/state/attempt/result/error/time; unique target |
| `admin.audit_links` | editable change IDs linked to immutable event IDs; no protected payload copy |
| `admin.diagnostic_definition_versions` | code-owned input/timeout/freshness/evidence/severity/runbook/lifecycle/hash |
| `admin.diagnostic_runs` | definition/target/state/times/evidence/result/freshness/actor/job/version |

Task/search views enforce per-row/count authorization. Bulk manifest object is encrypted/private; worker leases exact ordinal, rechecks grant and target version, calls registered ordinary command with operation correlation/idempotency, then records result. Version mismatch skips/fails only that target. Grant revocation prevents new leases; cancellation never reverses completed effects without an explicit compensating command.

Diagnostics never auto-repair high-risk state or become a second truth. Timeout/unavailable/stale dependency yields unknown/stale, never healthy. Audit projections expose request IDs/actions/decisions/times and purpose-approved references only.

Events: `admin.capability.changed.v1`, `admin.bulk.changed.v1`, `quality.diagnostic.changed.v1`. Sessions/task/search caches invalidate immediately on grant change.

## Failure, Deepening and Ambiguity Gate

- Tests cover search result/snippet/facet/count inference, task freshness/unknown, exact bulk manifest equality/query drift, duplicate/resume/cancel/version mismatch, ordinary-command reuse, grant subset/wildcard/expiry/revoke/break-glass, stale diagnostic false-health and RLS/BOLA for every operator class.
- Logs/metrics include capability/command/target class/count/cursor/result/freshness/duration only; no query text, snippets, evidence or bodies. Seven deepening passes and micro/macro/devil's-advocate checks converge. Two implementers receive identical task/search/bulk/grant/diagnostic behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Admin operations contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
- [[specs/ia/deep-dives/05-platform-configuration-admin|Deep Dive 05 — Platform configuration, admin and quality]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
