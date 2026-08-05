# Show setlists, file packages and performed-set evidence — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]  
**Deep Dive:** [[specs/ia/deep-dives/33-show-day-operations|Show-day operations deep dive]]

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

- **Shard split:** 1 of 4; 33.01, 33.02, 33.03 and 33.04.
- **Boundary:** planned setlist versions, stage-ready exports, checksum-bound show-file packages and separately attested performed sets.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 33 IA/deep dive | set ordering, print/device output, file manifests and performed-set capture |
| Shards 07 and 32 | work/credit references and production-event authority |

## Set and File Invariants

- Planned setlist is immutable ordered rows with work refs, structures, duration ranges and uncertainty. Concurrent same-row/order changes require explicit merge.
- Stage-ready output is print-first accessible artifact with secondary device view. Missing timing/work refs remain visible warnings.
- Show-file package pins event/date, selected setlist, ordered file refs, checksums and manifest. `current` pointer changes only after every checksum/order validation passes.
- Setlist/files default act-only; venue receives only explicitly shared stage-ready projection and never private source files by inference.
- Performed set is separate append-only order/deltas/personnel/attestations. It never rewrites plan; uncaptured fallback is plan labelled `unconfirmed`.
- Conflicting attestations remain visible and route review; no occurrence is promoted from one unsupported assertion.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/show-events/{id}/setlists` | parent/rows/order/durations/expected event version/key; act/TM | `201 ShowSetlistResponse`; immutable version/warnings | `403`, `409 ROW_CONFLICT|ORDER_CONFLICT|VERSION_CONFLICT`, `422 WORK_REF_INVALID`, `429` |
| `POST /api/v1/show-setlists/{id}/exports` | version/recipient projection/print-device formats/key; authorized act actor | `201 StageSetExportResponse`; accessible artifacts/warnings | `403`, `409 VERSION_STALE`, `422`, `429` |
| `POST /api/v1/show-events/{id}/file-packages` | setlist version/file refs/checksums/order/key; act actor | `201 ShowFilePackageResponse`; manifest/current eligibility | `403`, `409 ORDER_MISMATCH|CHECKSUM_MISMATCH`, `422 FILE_UNAVAILABLE`, `429` |
| `PUT /api/v1/show-events/{id}/current-file-package` | package/expected pointer version/key; act actor | `ShowFilePackageResponse`; current pointer/version | `403`, `409 CHECKSUM_MISMATCH|VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/show-events/{id}/performed-sets` | plan version/deltas/personnel/attestations/key; production party | `201 PerformedSetResponse`; performed/unconfirmed/conflicted state | `403`, `409 ATTESTATION_CONFLICT`, `422 OCCURRENCE_UNATTESTED|EVENT_INELIGIBLE`, `429` |

## Persistence, RLS and Workers

- Setlist/row/order versions, export artifacts, file package/manifest/checksum/current pointer and performed-set/attestation rows pin actor, work and event versions.
- RLS exposes source set/files to act scope, explicit stage-ready projections to recipients and performed evidence to production parties/credit consumers at approved minimum scope.
- Export, checksum, pointer and performed-set projection workers are idempotent; no failed package becomes current.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Planned setlist | immutable `active → superseded|retired`; row/order conflict remains `merge_required` until explicit successor | Act/TM versioned row/order edit triggers. Same-row/order concurrency never silently loses edits and timing/work uncertainty stays visible. |
| Stage-set export | `queued → rendered|failed`; rendered `→ stale|superseded` | Exact setlist/recipient/print-device formats trigger. Print-first accessible artifact is primary and warnings cannot hide. |
| Show-file package | `draft → validating → eligible_current|blocked|failed`; eligible `→ current|superseded`; current pointer changes atomically | Exact file refs/order/checksums/manifest trigger. Failed/unavailable/mismatched package never becomes current. |
| Performed set | `captured → attested|conflicted|unconfirmed`; attested/conflicted `→ superseded` by correction/review | Append-only order/deltas/personnel/attestations trigger. Plan fallback is labelled unconfirmed and one unsupported assertion never promotes occurrence. |

Every unlisted transition returns the typed state/version/checksum conflict. Venue receives only explicitly shared stage-ready projection, never source files by inference.

## Failure, Deepening and Ambiguity Gate

Tests cover lost row/order edit, hidden warning, device-only output, current pointer before checksum, venue private-file access, plan overwritten by actual, fallback marked performed and conflict collapsed. Seven passes converge; two implementers receive identical setlist, file and performance-evidence behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Setlist, files and performed-set contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day operations]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions and visibility — Backend Specification]]
- [[specs/be/32a-production-events-bill-rehearsal|Production events, bill projection and rehearsal linkage — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day execution and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/32a-production-events-bill-rehearsal|Production events, bill projection and rehearsal linkage — Backend Specification]]
