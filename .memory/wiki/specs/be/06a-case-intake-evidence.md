# Trust and safety case intake, routing and evidence — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]  
**Deep Dive:** [[specs/ia/deep-dives/06-trust-safety|Safety deep dive]]  
**Media Boundary:** [[specs/be/04b-governed-media-renditions|Governed media]]

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

- **Shard split:** 1 of 3; TSE-01, TSE-03, TSE-04, TSE-08, TSE-16 and TSE-17. DMCA/legal intake fields are owned by 06c but reuse this case/evidence substrate.
- **Boundary:** object-level intake, weighted-fair routing, reviewer leases/safe projections, private restrictions, immutable evidence capture/chain of custody and legal holds.
- **Approval:** Recommended split accepted under standing autonomy.

## Launch and Safety Invariants

- Consumer launch enables user-visible report creation, authorized removal/suspension, identified DMCA intake, repeat-infringer ledger and moderation audit. Full queue/evidence UI is Phase 2; counsel-gated automation remains unreachable.
- Report target/reason/acting context/policy versions and minimal snapshot commit atomically. Anonymous receipt is non-enumerable; reporter identity/narrative are protected. Target volume never rejects intake or establishes guilt/priority.
- Excess per-reporter volume is admitted then deprioritized/flagged. Severity plus remaining deadline drives weighted-fair lanes; S0 is isolated and safety capacity floor cannot be configured away.
- Reviewer lease is compare-and-set, exclusive/expiring, preserves original clocks and requires capability/exposure budget/no party-target-mandate conflict.
- Evidence is append-only hash chained. Restricted preservation has no party/ordinary-reviewer derivative. Active hold is unbounded retention and release only re-evaluates remaining clocks.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/safety/reports` | target type/ID/version, reason registry version, encrypted narrative<=10KiB, reporter mode; key | `201` non-enumerable receipt/case safe ID; case/target/intake/route/capture intent/audit atomic | `409 IDEMPOTENCY_MISMATCH`, `422 TARGET_OR_REASON_INVALID`, `429` admits valid report with lower weight, `503`, `500` |
| `GET /api/v1/safety/cases/{id}/status` | receipt or current case-party auth | safe state/deadline/next-action projection only | concealment-safe `404`, `403`, `429`, `503` |
| `GET /api/v1/admin/safety/cases` | queue/severity/deadline/kind cursor; moderator capability | assignment-safe page with freshness/clock | `403`, `422`, `429`, `503` |
| `POST /api/v1/admin/safety/cases/{id}/route` | policy/reason/object/jurisdiction versions; router key | queued lane/route evidence without clock reset | `409 POLICY_VERSION_INVALID|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/admin/safety/cases/{id}/leases` | reviewer/exposure context; case ETag/key | exclusive expiring lease | `403 REVIEWER_INELIGIBLE|CONFLICT_OF_INTEREST`, `409 CASE_LEASE_LOST|VERSION`, `428`, `429` |
| `GET /api/v1/admin/safety/cases/{id}` | active lease/case-purpose capability | minimum safe mutable target + immutable intake snapshot, blurred/muted media | `403`, `404`, `409 CASE_LEASE_LOST`, `429`, `503` |
| `POST /api/v1/safety/cases/{id}/materials` | typed party response/supplement/evidence refs; ETag/key | append-only sequenced material | `403`, `409 MATERIAL_WINDOW_CLOSED|VERSION`, `422`, `428`, `429` |
| `PUT /api/v1/me/restrictions/{subjectPersonId}` | `{ scope }`; self key | immediate private deny-first restriction edge/version | `404 SUBJECT_NOT_FOUND`, `409 VERSION`, `422 SCOPE_INVALID`, `429` |
| `DELETE /api/v1/me/restrictions/{subjectPersonId}` | ETag/key | `204` revoked edge; history retained | `404`, `409`, `428`, `429` |
| `POST /internal/v1/safety/capture-intents` | source event/ID/version, case, field/blob manifests; same source transaction/key | canonical intent ID | `403`, `409 SOURCE_VERSION_CONFLICT`, `422` |
| `GET /api/v1/admin/safety/cases/{id}/evidence` | active lease + exact evidence-purpose capability | disclosure-class filtered inventory; restricted entries sealed-only | `403 DISCLOSURE_PROHIBITED`, `404`, `429`, `503` |
| `POST /api/v1/admin/safety/legal-holds` | basis/authority/object manifest/release condition; counsel MFA/key | active hold/version + lifecycle event | `403 STEP_UP_REQUIRED|COUNSEL_GATE_DISABLED`, `409 HOLD_EXISTS`, `422`, `429` |
| `POST /api/v1/admin/safety/legal-holds/{id}/release` | release evidence/reason; counsel MFA, ETag/key | released hold and retention recalculation job | `403`, `409 RELEASE_CONDITION_UNMET|VERSION`, `428`, `429` |

All private/admin responses are no-store and use Shard 00 errors/idempotency/version/rate headers. Reports 20/day/reporter route with valid excess admitted; case reads 120/min; leases/materials 60/min; evidence/holds 10/min and 100% read/write audit.

## Persistence, RLS and Workers

| Table | Invariants |
|---|---|
| `safety.cases` | kind/state/severity/queue/jurisdictions/confidentiality/immutable clock start+original due/current due/owner/version |
| `safety.case_targets` / `case_parties` | target/actor/context/intake hash and party role/mandate/disclosure; protected identity nullable in projection |
| `safety.report_intakes` | reporter ref/pseudonym/reason/narrative ciphertext/channel/idempotency hash; unique actor/channel/hash |
| `safety.case_routes` / `case_leases` | versioned priority inputs and one active reviewer lease |
| `safety.restriction_edges` | private actor/subject/scope/state/version; non-discoverable |
| `safety.evidence_bundles` / `entries` | class/state/retention/holds/chain head and immutable sequenced snapshots/blob hashes/prior hash |
| `safety.capture_intents` | source event/version/case/manifests/state/attempts/terminal reason/key |
| `safety.legal_holds` / `retention_clocks` | basis/authority/manifest/release/audit and effective delete constraints |

RLS is assignment/case-role/purpose bound; staff search cannot enumerate celebrity/private cases. Capture worker canonicalizes allowlisted fields, hashes immutable media, appends prior-hash entry, retries idempotently and writes explicit `capture_failed` on exhaustion without closing the case. Purged media leaves tombstone/hash and degradation marker; locator is never reused.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Case intake | `received → routed → queued → leased → reviewing`; `reviewing ↔ awaiting_party`; `reviewing → decision_ready`; downstream decision may produce `resolved|appeal_pending|closed` | Intake/router/lease/reviewer/Shard 06b triggers. Volume never rejects intake; lost lease blocks mutation; closed response window blocks material. |
| Reviewer lease | `active → released|expired|revoked` | Reviewer release/timer/capability or conflict change triggers. Non-active lease cannot read mutable evidence or commit route/review work. |
| Case material window | `open → closed`; accepted material is append-only | Policy deadline/decision trigger closes. Closed window rejects new material while retaining prior sequence/hash. |
| Restriction edge | `active → revoked` | Self create/revoke triggers. Active deny-first edge affects only named scope; revoked history remains private and cannot reactivate in place. |
| Capture/evidence | `intent_recorded → capturing → sealed|capture_failed`; sealed may become `degraded` after lawful purge | Source transaction/worker triggers. Restricted class cannot create ordinary derivative; terminal failure never closes case or fabricates evidence. |
| Legal hold | `proposed → active → released` | Counsel command/release-condition evidence triggers. Active hold blocks destruction without widening access; unmet condition blocks release. |

Every unlisted transition returns the named state/lease/version conflict. Events: case received/routed, restriction changed, evidence sealed.

## Failure, Deepening and Ambiguity Gate

Tests cover target-volume suppression attempts, duplicate/idempotency mismatch, anonymous non-enumeration, S0 isolation, fair queue/deadline preservation, lease races/conflicts/exposure, mutable-vs-snapshot display, restriction deny-first propagation, capture crash/retry/hash chain, restricted evidence denial, hold/erasure priority and access audit. Logs/events omit narrative, reporter identity, evidence and PII. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical intake, routing, evidence and hold behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Case intake and evidence contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/deep-dives/06-trust-safety|Deep Dive 06 — Trust, safety, disputes and evidence]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
