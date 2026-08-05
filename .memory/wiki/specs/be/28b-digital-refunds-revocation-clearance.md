# Digital delivery waiver, refunds, revocation and past clearance — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]  
**Deep Dive:** [[specs/ia/deep-dives/28-digital-licensing-commerce|Digital licensing commerce deep dive]]

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

- **Shard split:** 2 of 4; 28.06, 28.07, 28.08, 28.09, 28.10 and 28.11.
- **Boundary:** consent-before-delivery waiver, pre-delivery cancellation, evidence-first refunds, independent clawback/revocation and preservation of prior lawful release use.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 28 IA/deep dive | waiver causality, refund adjudication, buyer protection and clearance disposition |
| Shards 06, 10 and 27 | appeals/evidence, rights authority and delivery enforcement |

## Refund and Revocation Invariants

- First delivery requires frozen localized withdrawal wording/version and an unticked affirmative buyer act as causal predecessor to any grant or bytes. Decline preserves purchase and states withdrawal-window date without issuing a URL.
- Before completed first delivery or operative waiver, cancellation returns original charged currency/instrument immediately without a case; entitlement becomes inactive while evidence remains.
- Refund is evidence first, policy second. Decision records outcome, reason, cause, cited snapshot, SLA and appeal; statutory floor is never suspended by fraud suspicion.
- Approved buyer refund commits independently from vendor clawback. Recovery failure never becomes buyer debt; finance exception requires immutable reason and configured dual control.
- `refund`, `chargeback` and `blacklist` remain distinct triggers even when future entitlement delivery converges. First authoritative revocation trigger wins deterministically.
- Revocation stops future platform delivery and tombstones library row with reason/appeal while preserving annotations. Local-machine/file recovery is best-effort and never reported complete.
- Prior lawful released-work use remains evidenced after refund; future placement/use is disallowed. Ambiguous clearance routes Shard 10/counsel dispute, never silent un-clearance.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-entitlements/{id}/delivery-waivers` | wording/version/locale/eligibility/affirmative act/key; holder controller | `201 DeliveryWaiverResponse`; captured/effective evidence | `403`, `409 WORDING_STALE|WAIVER_EXISTS`, `422 AFFIRMATIVE_ACT_REQUIRED`, `429` |
| `POST /api/v1/digital-orders/{id}/pre-delivery-cancellations` | order/entitlement/delivery state/key; holder controller | `DigitalRefundResponse`; immediate refund/inactive entitlement | `403`, `409 FIRST_DELIVERY_COMPLETED`, `422`, `429` |
| `POST /api/v1/digital-refund-requests` | order/entitlement/reason/evidence/policy snapshot/key; holder controller | `201 DigitalRefundCaseResponse`; automatic/review path/SLA | `403`, `409 CASE_EXISTS`, `422`, `429` |
| `POST /api/v1/digital-refund-requests/{id}/decisions` | outcome/reason/cause/evidence/policy/expected version/key; adjudicator | `DigitalRefundDecisionResponse`; final/appealable decision | `403`, `409 VERSION_CONFLICT`, `422 STATUTORY_FLOOR_VIOLATION`, `428`, `429` |
| `POST /internal/v1/digital-refunds/{id}/applications` | approved decision/payment/refund/revocation refs/event key; refund worker | `DigitalRefundApplicationResponse`; money result/revocation requested/clawback state | `403`, `409 EVENT_REUSED|DECISION_NOT_FINAL`, `429`, `503` |
| `POST /internal/v1/digital-entitlements/{id}/revocations` | authoritative trigger/case/effective time/version/key; entitlement worker | `DigitalEntitlementResponse`; future-use tombstone/appeal | `403`, `409 TRIGGER_SUPERSEDED|EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/digital-entitlements/{id}/clearance-dispositions` | affected released works/past-future disposition/evidence/expected version/key; rights-authorized actor | `DigitalClearanceDispositionResponse`; preserved past/future denied/disputed | `403`, `409 VERSION_CONFLICT`, `422 RIGHTS_REVIEW_REQUIRED`, `428`, `429` |

## Persistence, RLS and Workers

- Waiver evidence, cancellation, refund case/decision/application, clawback journal, revocation trigger/tombstone and clearance disposition rows pin actor, evidence, policy, rights and provider versions.
- RLS exposes cases to holder controllers and adjudicators; vendors receive structured cause/financial effect without buyer identity or narrative; clearance evidence follows Shard 10 authority.
- Refund, clawback, revocation and notice workers are idempotent. Payment/provider ambiguity never delays approved buyer protection beyond governed reconciliation state.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Delivery waiver | `offered → captured|declined|expired|stale`; captured `→ effective` only as causal predecessor to first grant/bytes | Unticked affirmative buyer act/current localized wording triggers. Decline preserves purchase and issues no URL. |
| Refund case | `open → automatic|reviewing → approved|denied|evidence_requested`; denied/approved `→ appeal_pending → upheld|reversed|remanded` | Holder evidence/policy/statutory floor and adjudicator trigger. Fraud suspicion never suspends statutory floor. |
| Refund application | `approved → refund_pending → refunded|failed|unknown`; vendor clawback independently `pending → recovered|failed|unknown` | Final decision/stable provider evidence trigger. Buyer refund never waits for clawback and recovery failure never becomes buyer debt. |
| Entitlement revocation | `active → revocation_pending → revoked`; competing triggers `refund|chargeback|blacklist` resolve first authoritative event and later events become superseded history | Exact authoritative trigger/version triggers. Revocation stops future platform delivery but never claims local-file recovery complete. |
| Clearance disposition | `current → past_use_preserved_future_denied|disputed|superseded` | Rights-authorized evidence/Shard 10 review triggers. Ambiguity routes dispute, never silently un-clears prior lawful use. |

Every unlisted transition returns the typed state/version/trigger conflict. Vendors receive structured cause/effect only, never buyer narrative/identity.

## Failure, Deepening and Ambiguity Gate

Tests cover prechecked waiver, grant-before-waiver, declined-waiver access loss, case-required pre-delivery cancel, policy-before-evidence, fraud statutory suspension, clawback-gated refund, local recovery claim, trigger race and prior-use un-clearance. Seven passes converge; two implementers receive identical refund, revocation and clearance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Refund, revocation and clearance contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing commerce]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Title control, conflicts and freezes — Backend Specification]]
- [[specs/be/27e-digital-enforcement-retirement-portability|Digital enforcement, withdrawal, retirement and portability — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
- [[specs/be/27e-digital-enforcement-retirement-portability|Digital enforcement, withdrawal, retirement and portability — Backend Specification]]
