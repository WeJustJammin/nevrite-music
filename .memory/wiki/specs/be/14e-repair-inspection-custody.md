# Repair, inspection, custody and damage evidence — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/14-services-marketplace|Services marketplace deep dive]]  
**Case Boundary:** [[specs/be/06a-case-intake-evidence|Trust and safety case intake]]

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

- **Shard split:** 5 of 5; SRV-17, SRV-18 and SRV-19. This contract records custody/condition/estimate/report evidence and payment instructions; it never promises insurance or item-value coverage.
- **Boundary:** mutual intake/return handoffs, repair assessment/estimate approval, permitted change scope, independent inspection reports and Shard 06 damage disputes.
- **Approval:** Recommended split accepted under standing autonomy.

## Custody and Inspection Invariants

- Every custody handoff records item/version, from/to custodian, time and mutual structured condition/media. Declared value consequence and fee/item-value separation appear before confirmation.
- The platform never takes custody; it records peer-to-peer or provider-to-customer custody evidence only.
- Repair assessment creates estimate separating labour and parts. Payment authorization occurs on estimate approval—not booking. Approved estimate defines permitted changes; additional work requires change order.
- Every transfer appends mutual condition. Return compares estimate/condition chain and permitted change scope, not merely original appearance.
- Fee escrow/payment authorization covers service fee only and is never represented as item insurance, warranty or declared-value coverage.
- Independent inspection uses a versioned category template and conflict check. Inspector is paid for complete report delivery regardless finding, transaction outcome or party preference.
- Damage claim compares mutual handoff conditions, approved estimate and declared value, then opens exact Shard 06 evidence case when contested. Platform records evidence and no insurance promise/merits verdict.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/repair-jobs` | engagement/item/version/intake parties/declared value consequence; buyer/seller key | `201 RepairJobResponse`; awaiting intake/version | `403`, `409`, `422`, `429` |
| `POST /api/v1/repair-jobs/{id}/custody-handoffs` | from/to/time/structured condition/media hashes/mutual confirmations; both parties/key | `201 CustodyHandoffResponse`; custody chain/version | `403`, `409 CUSTODIAN_OR_VERSION_CONFLICT`, `422 CONDITION_INCOMPLETE`, `429` |
| `POST /api/v1/repair-jobs/{id}/assessments` | structured findings/labour/parts/estimate/scope; custodian/key | `201 RepairAssessmentResponse`; estimate/version | `403`, `409 CUSTODY_NOT_HELD`, `422`, `429` |
| `POST /api/v1/repair-assessments/{id}/approve` | exact estimate/scope/payment token; owner/key | `RepairAssessmentResponse`; approved/payment authorization/work state | `403`, `409 ESTIMATE_CHANGED`, `422`, `429`, `503 PAYMENT_AUTH_FAILED` |
| `POST /api/v1/repair-jobs/{id}/return` | mutual return condition/media/estimate comparison; both parties/key | `201 CustodyHandoffResponse`; returned/differences/version | `403`, `409 WORK_OR_CUSTODY_STATE_INVALID`, `422`, `429` |
| `POST /api/v1/inspection-jobs` | item/category/template/version/parties; buyer/key | `201 InspectionJobResponse`; assignment/version | `403`, `409 INSPECTOR_CONFLICT`, `422`, `429` |
| `POST /api/v1/inspection-jobs/{id}/reports` | complete template/results/evidence/conflict confirmation; inspector/key | `201 InspectionReportResponse`; immutable report/payment instruction | `403`, `409 REPORT_EXISTS`, `422 REPORT_INCOMPLETE`, `429`, `503` |
| `POST /api/v1/repair-jobs/{id}/damage-claims` | compared handoff IDs/estimate/value/evidence; party/key | `201 DamageClaimResponse`; claim/case link/state | `403`, `409 CLAIM_EXISTS`, `422`, `429` |
| `POST /api/v1/damage-claims/{id}/contest` | reason/evidence refs; counterparty/key | `201 CaseLinkResponse`; Shard 06 case/evidence state | `403`, `404`, `409 CASE_EXISTS`, `422`, `429` |

Reads/writes are 120/min and 30/hour/job; mutual handoffs use step-up and 100% audit; reports 10/hour/inspector; damage claims 10/day/job/party. Condition media/reports are private no-store and excluded from events/logs.

## Persistence, RLS and Workers

Tables: `service.repair_jobs`, `custody_handoffs`, `condition_records`, `repair_assessments`, `inspection_jobs`, `inspection_reports`, `damage_claims` and case links. Condition media uses protected storage and immutable hashes.

RLS is item owner/current custodian/assigned inspector/case purpose bound. Handoff RPC requires both current confirmations against exact condition hash. Payment adapter authorizes only approved service estimate/report fee. Workers never infer condition or insurance; disputed claims hand exact evidence refs to Shard 06.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Repair job | `awaiting_intake → in_custody → assessment_pending → estimate_pending → approved_work|declined`; approved-work `→ return_pending → returned|claim_open`; declined `→ return_pending` | Mutual custody, assessment, owner estimate decision, work and return handoff trigger. Booking never charges; absent custody/approval or out-of-scope change blocks work. |
| Custody handoff | `proposed → confirmed|rejected|expired`; confirmed is immutable evidence and advances current custodian | Both parties confirm exact condition/media hash. Unilateral, stale custodian/version or incomplete condition blocks; platform never becomes custodian. |
| Repair assessment | `draft → issued → approved|declined|superseded`; approved may require `change_order_pending → approved|declined` for added work | Custodian estimate and owner payment authorization trigger. Changed estimate or provider failure blocks approval; fee covers service only. |
| Inspection job/report | job `assigned → in_progress → report_delivered|failed|cancelled`; report is immutable once delivered | Conflict-free inspector and complete template/evidence trigger. Conflict/incomplete report blocks; payment instruction depends on complete delivery, never finding/outcome. |
| Damage claim | `open → uncontested|contested|withdrawn`; contested `→ case_linked → resolved|closed` under Shard 06 | Exact handoff/estimate/value evidence and counterparty contest trigger. Platform/staff cannot decide merits or promise insurance. |

Every unlisted transition returns the typed state/version/custody conflict. Events omit condition media, reports and private economics.

## Failure, Deepening and Ambiguity Gate

Tests cover unilateral handoff, custody race, incomplete condition, booking-time charge, out-of-estimate work, return comparison, fee-as-insurance wording, inspector conflict/outcome-based payment, damage claim without evidence and staff merits decision. Seven passes converge; two implementers receive identical custody, estimate, report and claim behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Repair, inspection and custody contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
