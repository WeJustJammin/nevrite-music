# Door replicas, scans, reversals and age checks — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]  
**Deep Dive:** [[specs/ia/deep-dives/36-box-office-risk|Box-office risk deep dive]]

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

- **Shard split:** 1 of 5; 36.01, 36.02, 36.03, 36.04 and 36.05.
- **Boundary:** encrypted event-only scanner replicas, online/offline admission events, causal duplicate reconciliation, additive reversals and no-retention human age checks.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 36 IA/deep dive | replica readiness, scan verdict, peer conflicts, reversal and age policy |
| Shards 33 and 35 | door credentials, ticket identity and admission epochs |

## Door Access Invariants

- Scanner provisioning requires recognized device/operator, box-office lead and complete event-only encrypted replica at manifest epoch. Incomplete replica blocks ready.
- Local scan ID is globally unique/idempotent. Verdict appends immediately from token or accessible name/code fallback with device/server times and replica age.
- Unknown token leaks no cross-event/account information. Stale replica warns and follows configured offline posture.
- Peer/server reconciliation detects duplicate/conflict with causal/order confidence. Isolated duplicate accepts are never rewritten; final admitted interpretation appends.
- Refusal or reversal is linked additive event with authorized actor/reason and adjusts gate-observed count. Original scan never deletes.
- Age/ID verification records only pass/refusal class under current ticket/venue policy; no ID image, number or identity data is retained.
- Door role scans/lookups/ordinary overrides only and cannot sell, refund or export.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/door-replicas` | event/device/operator/manifest epoch/projection/key; provisioning service | `201 DoorReplicaResponse`; encrypted replica/expiry/readiness | `403 DEVICE_UNRECOGNIZED`, `409 EPOCH_STALE`, `422 REPLICA_INCOMPLETE|PII_POLICY_FAILED`, `429` |
| `POST /api/v1/door-scans` | event/device/gate/token-or-name/local ID/local time/replica epoch/key; door role | `201 DoorScanResponse`; accept/refuse/override/warnings | `403`, `409 ALREADY_USED`, `422 TOKEN_UNKNOWN|WRONG_TIME|AGE_CHECK_REQUIRED`, `429` |
| `POST /internal/v1/door-scans/reconciliations` | device scan sets/server epoch/event key; sync worker | `DoorScanReconciliationResponse`; conflicts/final interpretations | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/door-scans/{id}/reversals` | refuse-or-reverse/reason/expected version/key; authorized door actor | `201 DoorScanResponse`; linked reversal/count delta | `403`, `409 VERSION_CONFLICT`, `422 REASON_REQUIRED`, `428`, `429` |
| `POST /api/v1/door-scans/{id}/age-checks` | pass-or-refusal class/policy version/key; human verifier | `AgeCheckResponse`; minimal outcome | `403`, `409 POLICY_STALE`, `422 ID_DATA_FORBIDDEN`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Door replica | `building -> ready|blocked`; `ready -> stale|expired|revoked`; `stale -> ready|expired|revoked`; `blocked -> building` | Complete event-only encrypted projection at the current manifest epoch permits ready; missing data/PII-policy failure blocks it. Refresh may replace stale content, while expired/revoked replicas cannot scan until reprovisioned. |
| Door scan | `recorded -> reconciled|conflicted`; `conflicted -> interpreted`; `reconciled -> interpreted` | Device append records the immediate verdict once; peer/server sync appends causal conflict or final interpretation. Original evidence and isolated duplicate accepts never mutate or disappear. |
| Admission interpretation | `accepted -> refused|reversed`; `refused -> accepted`; `reversed -> accepted|refused` | Authorized additive reversal/refusal with reason adjusts gate-observed count and creates a successor interpretation. Stale expected version returns `409 VERSION_CONFLICT`; history remains intact. |
| Age check | `required -> passed|refused`; `passed|refused -> superseded` | Human verifier records only the policy-version outcome class; a policy correction creates a successor. ID image, number or identity payload blocks the write with `422 ID_DATA_FORBIDDEN`. |
| Scan reconciliation | `pending -> reconciled|conflicted`; `conflicted -> resolved` | Idempotent sync compares device sets and server epoch; a permitted final interpretation resolves conflict without rewriting scans. Reused event keys return `409 EVENT_REUSED`. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; deletion or overwrite of scan, reversal or age-check evidence returns `409 IMMUTABLE_DOOR_EVIDENCE`.

## Persistence, RLS and Workers

- Device/operator/replica epochs, additive scan/reversal/age-check and reconciliation/conflict rows pin ticket, gate, local ID and source versions.
- RLS exposes event-only replica/door data to recognized devices/operators and aggregate count downstream; ID data and unrelated event/customer records are absent.
- Replica expiry, sync and conflict workers are idempotent; disconnected events preserve original evidence.

## Failure, Deepening and Ambiguity Gate

Tests cover incomplete ready replica, cross-event replica, duplicate local ID, unknown-token leak, silent stale scan, overwritten duplicate accept, deleted original scan, retained ID image and door sale/refund authority. Seven passes converge; two implementers receive identical door replica and scan behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Door replica and scan contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Box-office risk]]
- [[specs/be/33b-run-of-show-crew-credentials|Run of show, crew calls and credentials — Backend Specification]]
- [[specs/be/35e-ticket-delivery-transfer-claim|Ticket delivery, pass projection and transfer claim — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/33b-run-of-show-crew-credentials|Run of show, crew calls and credentials — Backend Specification]]
- [[specs/be/35e-ticket-delivery-transfer-claim|Ticket delivery, pass projection and transfer claim — Backend Specification]]
