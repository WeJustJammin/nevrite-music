# Live splits, disbursement obligations and tax evidence — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]  
**Deep Dive:** [[specs/ia/deep-dives/31-live-settlement-intelligence|Live settlement intelligence deep dive]]

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

- **Shard split:** 4 of 5; 31.14, 31.15, 31.16 and 31.17.
- **Boundary:** show-specific live split consent, governance approval, launch-safe single-payee obligations and append-only payout/tax evidence.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 31 IA/deep dive | live split proposal/approval, disbursement gate and discharge evidence |
| Shards 10 and 18 | split governance, exact obligations and B3 payout controls |

## Split and Disbursement Invariants

- Live split proposal names performing entity/show, participants, flat/share ordering, pool scope and governance version. Prefilled values are inert until each required approval; no agreement means no applied split.
- Approval validates participant eligibility, exact totals and entity governance atomically. Split becomes eligible only at settlement finality and amendments apply forward.
- Launch disbursement is one eligible payee instruction or pending obligation. Multi-recipient instructions are unreachable until B3 counsel/provider gate passes.
- B3 or payee/tax-posture failure holds no platform-controlled money and never forfeits entitlement; exact pending obligation and claim path remain.
- Provider or authorized bilateral assertion appends discharge/status/withholding/VAT evidence. Platform records facts and documents but gives no tax determination/advice.
- Contributor/member sees own split/obligation/tax documents plus reconciliation totals, not other private shares or payout destinations.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/live-shows/{id}/split-proposals` | entity/participants/flat-share order/pool scope/governance/key; authorized entity actor | `201 LiveSplitResponse`; inert proposal/gaps | `403`, `409 PROPOSAL_EXISTS`, `422 TOTAL_INVALID|PARTICIPANT_INELIGIBLE`, `429` |
| `POST /api/v1/live-splits/{id}/approvals` | own row/governance decision/expected version/key; participant or entity approver | `LiveSplitResponse`; approved/pending/version | `403`, `409 VERSION_CONFLICT`, `422 APPROVAL_INCOMPLETE`, `428`, `429` |
| `POST /internal/v1/live-disbursement-instructions` | final settlement/split/payee eligibility/gate state/key; finance worker | `201 LiveDisbursementResponse`; one-payee instruction or pending obligations | `403`, `409 SOURCE_STALE`, `422 B3_DISABLED|PAYEE_INELIGIBLE|TAX_POSTURE_UNKNOWN`, `429` |
| `POST /api/v1/live-disbursements/{id}/evidence` | provider or bilateral assertion/discharge/withholding/VAT facts/documents/key; authorized source | `201 LiveDisbursementEvidenceResponse`; append-only status/totals | `403`, `409 AMOUNT_MISMATCH|ASSERTION_CONTESTED`, `422`, `429` |
| `GET /api/v1/live-payees/me/statements` | period/show/cursor; payee controller | `LivePayeeStatementResponse`; own split/obligation/discharge/tax refs | `403`, `429` |

## Persistence, RLS and Workers

- Split proposal/participant approvals, immutable split versions, disbursement instruction/pending obligations and payout/tax evidence rows pin settlement, governance, payee and provider versions with exact numeric storage.
- RLS exposes own rows/documents to payees, aggregate reconciliation to performing entity and full instructions to finance services; payout destinations and other private shares remain hidden.
- Split eligibility, instruction, reconciliation and statement workers are idempotent. B3 gate is rechecked at execution; disabled paths cannot enqueue provider effects.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Live split proposal | `inert → approval_pending → approved|refused|disputed|superseded`; approved `→ eligible` only at settlement finality | Named participants/exact totals/governance and each required approval trigger. Prefill/no agreement never applies split; amendments are forward-only. |
| Disbursement instruction | `pending → one_payee_instruction|held_obligation|blocked`; instruction `→ discharged|contested|failed|unknown` | Final settlement/split/payee/tax/B3 evidence trigger. Multi-recipient provider path is unreachable at launch. |
| Pending obligation | `active → claimed|discharged|contested|superseded`; never `forfeited|platform_revenue` | Ineligible payee/tax/B3 hold and claim evidence trigger. No platform-controlled-money claim is made. |
| Disbursement/tax evidence | immutable `asserted|confirmed|contested|superseded` | Provider or authorized bilateral discharge/withholding/VAT facts trigger. Platform records facts/documents and gives no tax determination/advice. |

Every unlisted transition returns the typed state/version/B3 conflict. Each payee sees own split/obligation/documents only.

## Failure, Deepening and Ambiguity Gate

Tests cover prefilled applied split, missing participant, invalid total, pre-finality instruction, B3 multi-payee bypass, platform-held ineligible money, forfeited obligation, tax advice and cross-payee share leak. Seven passes converge; two implementers receive identical live split and disbursement behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Live split and disbursement contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Live settlement intelligence]]
- [[specs/be/10b-splits-points-buyouts-amendments|Splits, points, buyouts and amendments — Backend Specification]]
- [[specs/be/18d-royalty-payout-b3-gate|Royalty payout and B3 gate — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Agency, settlement and live-market intelligence]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
- [[specs/be/18d-royalty-payout-b3-gate|Royalty payout and escrow B3 gate — Backend Specification]]
