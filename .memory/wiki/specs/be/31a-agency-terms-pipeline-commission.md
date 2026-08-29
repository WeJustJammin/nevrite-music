# Agency Terms, Pipeline and Commission — Backend Specification

## Split Group

- IA source: ../ia/31-live-settlement-intelligence.md.
- Assigned interactions: 31.01 Configure representation terms; 31.02 Project agency pipeline; 31.03 Accrue commission.
- Owned canonical aggregates: RepresentationTermVersion and CommissionAccrual.
- Owned event: live.commission.changed. Consumed seams: Shard 01 representation edge/version, Shard 30 booking/deal/expression facts, Shard 31 settlement.finalized and Shard 00 invoice/audit primitives.
- Launch gate: at-source commission deduction/fan-out is B3-disabled. Agency receives an accrual/invoice-ready record only; no platform escrow, netting, clawback or multi-recipient payment occurs.

## Classification and Source Inventory

| Source | Locked requirement |
|---|---|
| ../ia/31-live-settlement-intelligence.md | 31.01–31.03, representation scope, represented-party basis, projection/access, commission state and event |
| 00-infrastructure.md | ApiError, auth/mandates, idempotency, CORS, outbox, audit, jobs and observability |
| 01c-relationships-authority-governance.md | representation edge authority and scope seam |
| 30a-booking-avails-commercial-positions.md | accepted booking/deal source seam; no Shard 30 mutation |

## Endpoint Completeness Reconciliation

| IA ID | Operation | Method | Path | Result |
|---|---|---|---|---|
| 31.01 | Configure representation terms | POST | /api/v1/live/representation-terms | 201 RepresentationTermVersionV1 |
| 31.02 | Project agency pipeline | GET | /api/v1/live/agency-pipeline | 200 AgencyPipelineV1 |
| 31.03 | Accrue commission | POST | /api/v1/internal/live/commission-accruals | 201/200 CommissionAccrualV1 |

## Shared Contract Inheritance

- Every failure uses the exact BE00/global `ApiError { code, message, requestId, details }` envelope. `code` is the registered application-code enum, `message` is the safe stable message, `requestId` is the request UUID, and `details` is either `null` or a strict bounded JSON allowlist for the declared error code. Details may expose a current safe revision, policy identifier, or field error, never roster existence, another party's split, confidential deal terms, or an invoice destination.
- Browser writes require credentialled allowlisted CORS, CSRF and actor/entity mandate. Internal accrual requires service JWT, mTLS, registered settlement producer and deny CORS.
- Mutations require Idempotency-Key with 24-hour request-digest replay. Revisioned terms require If-Match when a prior version exists; mismatch is 412 REVISION_MISMATCH.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 31](../ia/31-live-settlement-intelligence.md) | Interactions lines 82–109; Contracts lines 110–136; Data Models lines 137–198; Access Control lines 199–226; Event Schemas and Edge Cases lines 238–285 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 17.08 Agency Representation & Commission | 31.01–31.03 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 31.01 | POST | /api/v1/live/representation-terms | both bound parties or governance rule approvals; active scoped Shard01 edge | key; edge/scope/work-type/territory next-version CAS; approvals immutable | 20/hour edge; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, edge/scope/approval policy |
| 31.02 | GET | /api/v1/live/agency-pipeline | agency actor within active roster and commercial scope | safe read; source watermark and term versions pin projection | 120/min actor; private max-age=30; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, roster/territory RLS |
| 31.03 | POST | /api/v1/internal/live/commission-accruals | registered settlement-finality/restatement consumer only | event ID key; settlement/represented party/terms version unique; amount CAS | 600/min worker; no-store; 2s | BE00-CORS-DENY, service auth, producer allowlist, settlement/term binding |

## Request and Response Contracts — Zod 4

Unknown keys fail. UUIDs are lowercase canonical, rates are decimal strings with maximum six fractional digits and range 0–1, money is bigint minor units plus ISO-4217 currency, timestamps RFC 3339 UTC, territories ISO-3166 or registered market groups, and work/commercial domains are shared closed enums.

| ID | Strict request/query | Success contract |
|---|---|---|
| 31.01 | VersionRepresentationTermsRequest { representationEdgeId, edgeRevision, commercialDomain, territories 1–100, workTypes 1–50, basisLine gross_guarantee/artist_share/settled_receipts/custom_registered, customBasisDefinitionId nullable, rate, effectiveAt, sunsetAt nullable, approvalIds } | RepresentationTermVersionV1 { termsVersionId, edgeId, scope, basisLine, rate, effectiveAt, sunsetAt, approvalPolicyVersion, version, state active/superseded/sunset } |
| 31.02 | AgencyPipelineQuery { agencyEntityId, rosterPartyIds nullable max 100, stageFilter nullable, dateRange max 2 years, territories nullable, cursor nullable, limit default 50 and range 1–100 } | AgencyPipelineV1 { rows, nextCursor, sourceWatermark, projectionComputedAt } where each row has bookingId, representedPartyId, stage, confidence, grossMinor nullable, commissionMinor nullable, representedNetMinor nullable, currency, termsVersionId, lagState |
| 31.03 | CommissionAccrualCommand { settlementId, settlementVersion, representedPartyId, representedPartyShareMinor, currency, representationTermsVersionId, basisEvidence, settlementState provisional/final/restated, sourceEventId } | CommissionAccrualV1 { accrualId, basisMinor, rate, amountMinor, currency, state projected/accrued_provisional/accrued_final/invoiced/eligible_for_future_disbursement/reversed, derivation, invoiceRef nullable, version } |

#### Exact typed success schemas

The operation comments are normative route mappings. Every successful body is parsed by the cited strict Zod 4 object; fields not declared here are rejected.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Instant = z.iso.datetime({ offset: true });
const Version = z.int().positive();
const Minor = z.bigint();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Rate = z.string().regex(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/);
const Scope = z.object({
  commercialDomain: z.enum(["booking", "live", "merch", "sponsorship", "registered"]),
  territories: z.array(z.string().min(2).max(32)).min(1).max(100),
  workTypes: z.array(z.string().min(1).max(64)).min(1).max(50),
}).strict();
const PipelineRow = z.object({
  bookingId: Uuid, representedPartyId: Uuid,
  stage: z.enum(["lead", "hold", "offer", "contracting", "confirmed", "cancelled"]),
  confidence: Rate, grossMinor: Minor.nullable(), commissionMinor: Minor.nullable(),
  representedNetMinor: Minor.nullable(), currency: Currency, termsVersionId: Uuid,
  lagState: z.enum(["current", "source_lag", "terms_missing", "not_evaluable"]),
}).strict();
// 31.01
export const RepresentationTermVersionV1 = z.object({
  termsVersionId: Uuid, edgeId: Uuid, scope: Scope,
  basisLine: z.enum(["gross_guarantee", "artist_share", "settled_receipts", "custom_registered"]),
  rate: Rate, effectiveAt: Instant, sunsetAt: Instant.nullable(), approvalPolicyVersion: Version,
  version: Version, state: z.enum(["active", "superseded", "sunset"]),
}).strict();
// 31.02
export const AgencyPipelineV1 = z.object({
  rows: z.array(PipelineRow).max(100), nextCursor: z.string().min(1).max(512).nullable(),
  sourceWatermark: Digest, projectionComputedAt: Instant,
}).strict();
// 31.03
export const CommissionAccrualV1 = z.object({
  accrualId: Uuid, basisMinor: Minor, rate: Rate, amountMinor: Minor, currency: Currency,
  state: z.enum(["projected", "accrued_provisional", "accrued_final", "invoiced", "eligible_for_future_disbursement", "reversed"]),
  derivation: z.object({ settlementId: Uuid, settlementVersion: Version, termsVersionId: Uuid, sourceEventId: Uuid }).strict(),
  invoiceRef: Uuid.nullable(), version: Version,
}).strict();
~~~

### Validation and invariant matrix

| Rule | Deterministic enforcement |
|---|---|
| Edge authority | Shard01 edge must be active for the effective interval and bind the represented party to the agency; the request cannot widen edge parties |
| Scope | Commercial domain, territory and work type must be supported by the edge; empty/global wildcard scope is rejected |
| Basis | net is not a valid basis label; custom basis requires a registered deterministic expression/version |
| Approval | Required parties/governance approvals must be current, bind the exact digest and be distinct actors where dual control applies |
| Rate/sunset | Rate must be nonnegative and no greater than 1; sunset follows effectiveAt; overlapping active versions for identical edge/scope are excluded |
| Pipeline | Projection is derived only from authorized Shard30 bookings; missing values stay null with lagState, never estimated |
| Commission | Basis is the represented party's share, not whole settlement unless those are provably equal; currency must match |
| B3 | at-source deduction, fan-out, escrow, auto-netting and automatic clawback fields are forbidden |

## Pagination and Limits

| Operation | Cursor, default/max page | Stable sort | Filter options |
|---|---|---|---|
| 31.02 | Opaque HMAC cursor binds actor, source watermark, filter hash, and last `(bookingDate,bookingId)`; omitted cursor starts page one; default 50, maximum 100 | `bookingDate ASC, bookingId ASC`; immutable source watermark prevents duplicates/skips | `rosterPartyIds`, `stageFilter`, inclusive `dateRange` up to two years, and `territories`; no unrestricted roster scan |

Malformed, expired, actor-mismatched, or filter-mismatched cursors return `400 QUERY_INVALID`; a changed source watermark returns `409 PROJECTION_LAGGING` with restart guidance.

## Database Schema

| Model | Typed fields, constraints, keys and indexes | RLS and grants |
|---|---|---|
| RepresentationTermVersion | id uuid PK; representation_edge_id uuid; edge_revision bigint; agency_entity_id uuid; represented_party_id uuid; commercial_domain enum; territories text array; work_types text array; basis_line enum; custom_basis_definition_id uuid nullable; rate numeric(9,6); effective_at timestamptz; sunset_at nullable; approval_ids uuid array; approval_policy_version bigint; state enum; version bigint; created_by uuid; created_at timestamptz | exclusion edge/domain/territory/work-type effective range for active overlap; FK party/entity/approval refs restrict; indexes edge,scope,effective range and represented party; append-only. Bound parties see exact versions; agency sees active roster scope; service accrual role read; support requires purpose grant |
| CommissionAccrual | id uuid PK; settlement_id uuid; settlement_version bigint; represented_party_id uuid; agency_entity_id uuid; representation_terms_version_id uuid; basis_minor bigint; rate numeric(9,6); amount_minor bigint; currency char(3); derivation_json jsonb; state enum; source_event_id uuid; invoice_ref uuid nullable; future_disbursement_ref uuid nullable; reversal_of uuid nullable; version bigint; created_at/updated_at timestamptz | unique settlement/version/represented party/terms/source event; FK terms/accrual reversal; indexes agency,state and represented party,settlement; check amount equals deterministic rounded basis times rate and B3 refs null unless gate version active. Agency sees own accrual derivation, represented party sees own, worker transition grant only |

AgencyPipelineV1 is a disposable security-invoker projection over authorized Shard30 source facts plus these two tables. It has no base table and no cached row containing another roster's confidential deal. Projection cache key includes actor, agency, roster scope, filters, source watermark and policy version; TTL is 30 seconds.

Every table has RLS enabled; PUBLIC/anon/authenticated have no base grants. Named RPCs execute as invoker. Terms are append-only; correction appends a superseding version. Accrual transitions use a constrained procedure and retain reversal/invoice evidence according to statutory/audit policy.

### D4 SQL Nullability and Relationship Closure

In the schema table above, every column not explicitly marked nullable is `NOT NULL`; `enum` means `text` with the closed values from the Zod contract enforced by `CHECK`; every UUID rejects the nil UUID. Shorthand expands normatively as follows:

| Table | Exact shorthand expansion | Relationships and query indexes |
|---|---|---|
| `representation_term_versions` | `sunset_at timestamptz NULL`; `approval_ids uuid[] NOT NULL CHECK (cardinality(approval_ids)>0)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL`; all other fields retain the explicit types above and are `NOT NULL` | `representation_edge_id/edge_revision` target the revision-pinned Shard01 edge; agency/represented IDs target Shard00 parties; `custom_basis_definition_id` targets the approved formula registry. `UNIQUE(representation_edge_id,commercial_domain,version)`; GiST active-scope exclusion; `INDEX(represented_party_id,commercial_domain,effective_at DESC)`; `INDEX(agency_entity_id,state,effective_at DESC)`. |
| `commission_accruals` | `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; `invoice_ref uuid NULL`; `future_disbursement_ref uuid NULL`; `reversal_of uuid NULL`; all other explicitly typed fields are `NOT NULL`; `derivation_json jsonb NOT NULL CHECK (jsonb_typeof(derivation_json)='object')` | FK `representation_terms_version_id -> representation_term_versions.id`; self-FK `reversal_of -> commission_accruals.id`; settlement/party/invoice/disbursement IDs are revision-pinned Shard31/00 seams. `UNIQUE(settlement_id,settlement_version,represented_party_id,representation_terms_version_id,source_event_id)`; `INDEX(agency_entity_id,state,created_at DESC)`; `INDEX(represented_party_id,settlement_id,settlement_version)`. |

Both tables FORCE RLS. Bound parties receive SELECT through scoped invoker views; the terms RPC receives INSERT only; the accrual consumer receives SELECT/INSERT and constrained state-transition EXECUTE only. PUBLIC, anon, authenticated, and generic service roles receive no base-table UPDATE/DELETE. Migration tests assert every check, relationship validator, exclusion/index plan, policy, and grant.

## State Machines and Transactions

- RepresentationTermVersion: active → superseded/sunset/revoked_by_edge. A later version never rewrites the rate used by an earlier settlement.
- CommissionAccrual: projected → accrued_provisional → accrued_final → invoiced or eligible_for_future_disbursement → reversed. Restatement appends/revises the accrual through a new source version; it never silently overwrites derivation.
- 31.01 locks the representation edge/scope key, validates approvals and inserts version plus outbox/audit atomically. Competing expected revisions produce one winner and 412 for the loser.
- 31.03 locks the settlement/party accrual key; reads pinned terms; computes integer minor amount with banker-independent half-away-from-zero policy registered in terms; writes accrual and live.commission.changed outbox atomically.
- A finality/restatement event received before the terms version is visible retries; a revoked edge after the settlement interval removes future pipeline access but preserves pinned evidence.

## Access Control, Middleware and Security

| Actor | Allowed | Explicitly denied |
|---|---|---|
| represented party | approve/view own terms and own accrual derivation | other roster/deal, agency-wide pipeline |
| agent/agency | approved scope versions, scoped roster pipeline, own accrual/invoice evidence | non-roster dates, artist internal split beyond required basis, at-source deduction |
| Shard31 accrual worker | pinned terms and represented share for one verified settlement event | browse roster, alter terms, create payments |
| support | purpose-bound case metadata through expiring grant | raw roster/deal access, approval fabrication, B3 activation |

Middleware order is request ID → CORS → session/service auth → CSRF → strict header/body/query parse → rate → edge/roster/producer policy → RLS → idempotency/If-Match → handler → response validation → redacted audit/log. Logs contain IDs, scope codes, policy/terms versions, safe state, status and duration; they exclude deal amounts except bucket-free authorized audit records, party names, approval evidence and invoice destinations.

## Events and External Seams

| Event/seam | Contract | Delivery, timeout and recovery |
|---|---|---|
| live.commission.changed | eventId, literal type, schemaVersion=1, accrualId/version, representationVersion, settlement/version, represented party, basis/amount/currency, old/new state, occurredAt, producer, traceId | at-least-once; accrual-version dedupe; stale no-op; equal-version digest conflict quarantines |
| Shard01 edge lookup | edge ID/revision/effective interval → parties/scope/state | 2s; 2 retries 100ms/500ms; circuit 5 failures/30s for 30s; 503 EDGE_AUTHORITY_UNAVAILABLE |
| Shard30 pipeline projection | actor/scope/watermark → authorized booking rows | 3s; 2 retries 100ms/500ms; circuit 5 failures/30s for 30s; disclose lag, never estimate |
| settlement.finalized/restated consumer | verified event → accrual command | 30,000 ms/attempt; 8 total attempts with full-jitter caps 1s/5s/30s/2m/10m/15m/15m; retry timeout, transient dependency/DB, serialization/deadlock, retryable 5xx; terminal signature/schema/digest/version/auth/invariant conflicts quarantine; circuit opens after 20 retryable failures/60s for 60s, admits one half-open event probe, closes after two successes, and reopens on failure; open retains the durable event, attempt 8 DLQs and alerts, accrual remains unchanged/pending; receipt/event dedupe |
| invoice evidence service | finalized accrual → invoice-ready reference | 3s; 2 retries 1s/10s; circuit 5 failures/min for 2m; accrual remains accrued_final |

### Exact retryability and circuit closure

Attempt totals include the initial attempt. Every listed backoff is full jitter uniformly chosen from zero through the stated cap. A half-open circuit admits one probe at a time, closes after two consecutive successful probes, and reopens for the full open interval on a retryable probe failure.

| Seam | Deadline and exact attempt schedule | Retryable versus terminal outcomes | Circuit open, half-open, and fallback |
|---|---|---|---|
| Shard01 edge lookup | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429 honoring bounded Retry-After, and 5xx. Schema/auth failures, non-429 4xx, invalid revision, and authority denial are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open lookup probe. Open/exhausted returns 503 EDGE_AUTHORITY_UNAVAILABLE; no stale authority is accepted. |
| Shard30 pipeline projection | 3,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection failure, 408, 429, and 5xx only. Invalid scope/watermark, auth denial, non-429 4xx, and response-schema failure are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open projection probe. Fallback discloses projection lag/unavailable and never estimates bookings. |
| settlement.finalized/restated consumer | 30,000 ms handler deadline; 8 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min. | Retry transient dependency/DB availability, serialization/deadlock, handler timeout, and retryable 5xx. Invalid signature/schema/digest, unsupported version, authority denial, business-invariant failure, and equal-version digest conflict are terminal and quarantined. | Open the consumer event-type partition after 20 retryable failures in 60 s for 60 s; one half-open event probe. Open retains the durable message; attempt 8 moves it to DLQ with alert and leaves the accrual unchanged/pending. |
| Invoice evidence service | 3,000 ms per attempt; 3 attempts total; retry caps 1 s then 10 s. | Retry only known-no-effect timeout/connection failure, 408, 429, and 5xx. Invalid accrual, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 60 s for 2 min; one half-open evidence probe. Fallback preserves accrued_final, records evidence unavailable, and never fabricates an invoice reference. |

## Error Handling

| ID | Status and exact ApiError codes | Recovery |
|---|---|---|
| 31.01 | 400 SCOPE_INVALID/BASIS_UNDEFINED/RATE_INVALID; 403 AUTHORITY_REQUIRED/APPROVAL_INCOMPLETE; 409 IDEMPOTENCY_CONFLICT/TERM_SCOPE_OVERLAP; 412 REVISION_MISMATCH; 422 EDGE_INACTIVE | no version/outbox on failure; current safe revision may be returned |
| 31.02 | 400 QUERY_INVALID; 403 ROSTER_SCOPE_REQUIRED; 404 AGENCY_CONTEXT_NOT_FOUND; 409 PROJECTION_LAGGING; 429 RATE_LIMITED; 503 PIPELINE_SOURCE_UNAVAILABLE | lag response identifies watermark/affected columns without leaking rows |
| 31.03 | 400 BASIS_INVALID/CURRENCY_MISMATCH; 401 SERVICE_AUTH_REQUIRED; 409 SOURCE_EVENT_CONFLICT/ACCRUAL_STATE_CONFLICT; 422 TERM_NOT_EFFECTIVE/B3_DISABLED/SETTLEMENT_NOT_ELIGIBLE; 503 EDGE_AUTHORITY_UNAVAILABLE | retry exact event; B3 returns invoice-ready accrual without payment fan-out |

Unknown failures map to 500 INTERNAL_ERROR; dependency deadlines to 503 DEPENDENCY_TIMEOUT; admission budgets to 429 with Retry-After. Raw SQL/provider/event bodies never escape.

## Verification and Test Strategy

| ID | Required tests |
|---|---|
| 31.01 | valid scoped dual approval; inactive edge, unsupported scope, ambiguous net basis and incomplete approvals; overlap exclusion; idempotent replay; stale CAS |
| 31.02 | roster-only rows and source watermark; projected gross/commission/net exact; missing source yields null/lag; non-roster and internal split concealed |
| 31.03 | provisional/final/restated transitions; pinned historical terms; represented-share basis; exact minor rounding; event replay/conflict; B3 prevents fan-out |

Database tests exercise anon, represented party, agency, non-roster agency, support purpose grant and accrual worker. They prove RLS/grants, append-only terms, constrained accrual states, atomic outbox, scope exclusion and no projection cache cross-actor leakage. Event tests cover stale/equal/future schema behavior and poison quarantine.

## Deepening Passes

- Micro: scope, basis, rate, sunset, approval, rounding, lag and commission states are explicit.
- Macro: Shard01 owns representation authority, Shard30 owns booking truth, Shard31 owns terms consumption/accrual, Shard00 owns invoice/payment primitives.
- Security: roster and internal split information cannot leak through errors, projections, logs or cache keys.
- Devil's-advocate: no path can treat agency access as party ownership, calculate on gross when basis is represented share, rewrite historical terms, or activate B3 behavior.
- Two-implementer check: PASS. Routes, schemas, errors, tables, indexes, RLS/grants, transitions, timeouts, events and tests are deterministic.
- Ambiguity gate: PASS. Open decisions: none.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 31.01 | `be_http_requests_total{operation_id="31.01",outcome,code}`, `be_http_latency_seconds{operation_id="31.01"}`, and `be_operation_recovery_total{operation_id="31.01",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.02 | `be_http_requests_total{operation_id="31.02",outcome,code}`, `be_http_latency_seconds{operation_id="31.02"}`, and `be_operation_recovery_total{operation_id="31.02",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.03 | `be_http_requests_total{operation_id="31.03",outcome,code}`, `be_http_latency_seconds{operation_id="31.03"}`, and `be_operation_recovery_total{operation_id="31.03",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 31a production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 31](../ia/31-live-settlement-intelligence.md)
- [Representation and delegation](01c-relationships-authority-governance.md)
- Planned Shard 30a booking commercial positions backend contract.
