# Live Splits, Disbursement and Tax Evidence — Backend Specification

## Split Group

- IA source: ../ia/31-live-settlement-intelligence.md.
- Assigned interactions: 31.14 Propose live split, 31.15 Approve live split, 31.16 Build payout instruction and 31.17 Record payout/tax evidence.
- Owned aggregates: LiveSplitVersion, DisbursementInstruction and TaxEvidence.
- Owned events: live.split.changed and live.disbursement.changed.
- Launch boundary: one-payee settlement is supported. B3-disabled multi-recipient fan-out, escrow, contested-delta hold, at-source commission, auto-netting and clawback produce pending obligations only and never custody funds. Tax records are factual evidence, not advice/determination.

## Source Inventory and Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 31.14 | POST | /api/v1/live/splits | 201 LiveSplitVersionV1 with `proposal_inert` state |
| 31.15 | POST | /api/v1/live/splits/{splitId}/approvals | 201/200 LiveSplitVersionV1 |
| 31.16 | POST | /api/v1/internal/live/disbursement-instructions | 201/200 DisbursementInstructionV1 |
| 31.17 | POST | /api/v1/live/disbursement-instructions/{instructionId}/evidence | 201 TaxEvidenceV1/DisbursementEvidenceV1 |

Sources: ../ia/31-live-settlement-intelligence.md, 00-infrastructure.md, 31c-settlement-finality-restatement-export.md and Shard 18 canonical payout/accounting primitives.

## Shared Contract Inheritance

- ApiError { code, message, requestId, details } is exact; no bank/tax identifiers, document body or other participant allocation enters details/logs/events.
- Browser mutations require credentialled CORS, CSRF and exact entity/participant mandate; protected financial actions require recent step-up. Internal instruction build requires service JWT/mTLS/finality producer and deny CORS.
- Idempotency-Key and request digest are mandatory. Revisioned proposal/approval/evidence uses If-Match; finality events bind settlement/version/hash.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 31](../ia/31-live-settlement-intelligence.md) | Interactions lines 82–109; Contracts lines 110–136; Data Models lines 137–198; Access Control lines 199–226; Event Schemas and Edge Cases lines 238–285 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 17.10 Live Income Payout & Tax | 31.14–31.17 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 31.14 | POST | /api/v1/live/splits | performing-entity split.manage and eligible participant visibility | key; entity/show/pool/scope next-version CAS; proposal inert | 20/hour show; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, entity/participant/scope |
| 31.15 | POST | /api/v1/live/splits/{splitId}/approvals | participant self-approval plus entity governance | key plus If-Match; participant/version unique; approval set serializable | 60/hour split; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, participant/governance/total |
| 31.16 | POST | /api/v1/internal/live/disbursement-instructions | registered settlement.finalized/restated consumer | event key; settlement/split/payee/gate unique; obligation CAS | 600/min worker; no-store; 3s | BE00-CORS-DENY, service auth, producer allowlist, finality/split/payee/B3 |
| 31.17 | POST | /api/v1/live/disbursement-instructions/{instructionId}/evidence | payee/payer/provider receipt consumer with evidence scope | key plus If-Match/source event; append-only evidence | 60/hour instruction; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED or internal deny branch, auth/receipt, upload, tax-disclaimer |

## Request and Response Contracts — Zod 4

Money is bigint minor units plus ISO-4217; percentage shares are decimal strings scale 6; jurisdictions are registered country/subdivision codes; tax document types and evidence status are closed enums; all identifiers UUID and timestamps UTC.

| ID | Strict request | Success |
|---|---|---|
| 31.14 | LiveSplitProposal { performingEntityId, showId, poolScope gross_artist_share/net_artist_share/merch_pool/registered, flatParticipants ordered entries with partyId/amount/currency/priority, shareParticipants with partyId/share, governanceRuleVersion, effectiveSettlementPhase final_only } | LiveSplitVersionV1 { splitId, version, state proposal_inert, pools, flatParticipants, shareParticipants, totals, requiredApprovals, settlementPin nullable } |
| 31.15 | LiveSplitApproval { splitVersion, action approve/reject/withdraw_before_finality, participantPartyId, authorityRef, governanceEvidence, disclosedTotalsChecksum } | LiveSplitVersionV1 { approvalSet, state proposal_inert/approval_pending/approved/pinned/superseded, eligibleAtFinality boolean, version } |
| 31.16 | BuildDisbursementInstruction { settlementId/version/hash, obligationManifestRef, splitId/version nullable, canonicalPayeeId, payeeEligibilityRevision, gateState, currency } | DisbursementInstructionV1 { instructionId, obligationId, state not_enabled/pending_eligibility/instructed/provider_pending/discharged/failed/reversed, payee, amount, pendingObligations, providerRef nullable, version } |
| 31.17 | EvidenceAppend { evidenceKind provider_payment/bilateral_payment/withholding_fact/vat_fact/tax_form/status_assertion, sourceEventId, occurredAt, amountMinor nullable, currency nullable, jurisdiction nullable, expectedWithholdingMinor nullable, actualWithholdingMinor nullable, vatMinor nullable, documentUploadId nullable, assertionPartyId } | TaxEvidenceV1 or DisbursementEvidenceV1 { evidenceId, instructionId, factualState, dischargeTotal, documentRef nullable, recordedAt, version, adviceStatus none } |

#### Exact typed success schemas

Each operation comment maps one route to its strict Zod 4 success parser. The 31.17 union is discriminated by `evidenceClass`.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Minor = z.bigint();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Instant = z.iso.datetime({ offset: true });
const Rate = z.string().regex(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/);
const FlatParticipant = z.object({ partyId: Uuid, amountMinor: Minor, currency: Currency, priority: z.int().min(1).max(10_000) }).strict();
const ShareParticipant = z.object({ partyId: Uuid, share: Rate }).strict();
const Approval = z.object({ approvalId: Uuid, partyId: Uuid, state: z.enum(["approved", "rejected", "withdrawn"]), version: Version }).strict();
// 31.14
export const CreateLiveSplitSuccess = z.object({
  splitId: Uuid, version: Version, state: z.enum(["proposal_inert", "approval_pending", "approved", "pinned", "superseded"]),
  pools: z.array(z.enum(["gross_artist_share", "net_artist_share", "merch_pool", "registered"])).min(1).max(20),
  flatParticipants: z.array(FlatParticipant).max(500), shareParticipants: z.array(ShareParticipant).max(500),
  totals: z.object({ flatMinor: Minor, share: Rate }).strict(), requiredApprovals: z.array(Uuid).max(500),
  settlementPin: z.object({ settlementId: Uuid, version: Version, versionHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict().nullable(),
}).strict();
// 31.15
export const ApproveLiveSplitSuccess = z.object({
  approvalSet: z.array(Approval).max(500), state: z.enum(["proposal_inert", "approval_pending", "approved", "pinned", "superseded"]),
  eligibleAtFinality: z.boolean(), version: Version,
}).strict();
export const LiveSplitVersionV1 = z.union([CreateLiveSplitSuccess, ApproveLiveSplitSuccess]);
// 31.16
export const DisbursementInstructionV1 = z.object({
  instructionId: Uuid, obligationId: Uuid,
  state: z.enum(["not_enabled", "pending_eligibility", "instructed", "provider_pending", "discharged", "failed", "reversed"]),
  payee: z.object({ partyId: Uuid, eligibilityRevision: Version }).strict(),
  amount: z.object({ minor: Minor, currency: Currency }).strict(),
  pendingObligations: z.array(z.object({ obligationId: Uuid, reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/), amountMinor: Minor, currency: Currency }).strict()).max(500),
  providerRef: z.string().min(1).max(256).nullable(), version: Version,
}).strict();
const EvidenceBase = z.object({
  evidenceId: Uuid, instructionId: Uuid, factualState: z.enum(["recorded", "verified", "disputed", "superseded"]),
  dischargeTotal: z.object({ amountMinor: Minor, currency: Currency }).strict(), documentRef: Uuid.nullable(),
  recordedAt: Instant, version: Version, adviceStatus: z.literal("none"),
});
// 31.17
export const EvidenceAppendSuccess = z.discriminatedUnion("evidenceClass", [
  EvidenceBase.extend({ evidenceClass: z.literal("tax"), jurisdiction: z.string().min(2).max(64), expectedWithholdingMinor: Minor.nullable(), actualWithholdingMinor: Minor.nullable(), vatMinor: Minor.nullable() }).strict(),
  EvidenceBase.extend({ evidenceClass: z.literal("disbursement"), providerRef: z.string().min(1).max(256).nullable(), paidAt: Instant.nullable() }).strict(),
]);
~~~

### Validation and policy

- Split has one or more eligible participants, unique parties per pool, deterministic flat-priority order, nonnegative flats, share total exactly 1.000000 per share pool and explicit scope. Proposal never applies without approvals.
- Approval binds a fully disclosed version/checksum. Every required participant/governance approval must be current and distinct where dual control is required. Missing party/percentage/scope blocks.
- Split becomes eligible only when the exact approved version is pinned by settlement finality. Restatement creates/re-evaluates an instruction; it cannot mutate the approved split.
- At launch, one canonical payee is allowed. When more than one recipient would be instructed, return `state: not_enabled` plus a `future_multi_recipient_gated` pending-obligation reason and B3_DISABLED; do not call a provider or hold funds.
- Payee eligibility/tax posture unknown produces pending obligation, not platform tax advice or a guessed withholding.
- Evidence is factual: expected/actual withholding and VAT are separate; document type/status does not imply legal validity; status text cannot contain free-form advice.

## Database Schema

| Model | Typed fields, constraints, keys and indexes | RLS/grants |
|---|---|---|
| LiveSplitVersion | id uuid; performing_entity_id; show_id; version bigint; pool_scope enum; flat_rows jsonb validated; share_rows jsonb validated; governance_rule_version; required_approvals jsonb; approval_set jsonb; totals_checksum; state proposal_inert/approval_pending/approved/pinned/superseded; settlement_id/version nullable; created_by/at | PK id,version; unique entity/show/scope/version; exclusion one approved active scope; indexes show,state. Entity and participants see exact rows; split worker read; append-only |
| DisbursementInstruction | id uuid PK; obligation_id; settlement_id/version/hash; split_id/version nullable; canonical_payee_id; payee_eligibility_revision; gate_version; amount_minor; currency; state; provider_ref nullable; pending_obligations jsonb; submitted/discharged/reversed_at nullable; reversal_of nullable; version | unique obligation and settlement/payee/gate; FK split/instruction reversal; indexes payee,state and settlement; payee/payer safe projection, instruction worker transition grant |
| TaxEvidence | id uuid PK; instruction_id; evidence_kind; source_event_id; assertion_party_id; amount_minor/currency/jurisdiction nullable; expected_withholding_minor/actual_withholding_minor/vat_minor nullable; document_ref nullable; factual_state; advice_status fixed none; occurred_at/recorded_at; supersedes_id nullable | unique producer/source event; FK instruction/evidence; indexes instruction,kind/time; append-only. Relevant payee/payer sees safe fields; provider consumer insert |

Every base table enables RLS and denies PUBLIC/anon. Financial/tax document bodies are BE00 Storage refs with malware scan, encryption and purpose grants. Retention follows statutory policy/legal hold; correction appends. No request role has UPDATE/DELETE on approved split or evidence.

### D4 SQL Type, Nullability, Relationship, and Index Closure

Every field is `NOT NULL` unless explicitly marked `NULL`; enums are closed `text CHECK` domains, JSON values have object/array checks, UUIDs are non-nil, and local FKs use `ON DELETE RESTRICT`.

| Table | Exact SQL fields | Relationships and query-pattern indexes |
|---|---|---|
| `live_split_versions` (LiveSplitVersion) | `id uuid PRIMARY KEY`; `performing_entity_id uuid`; `show_id uuid`; `version bigint CHECK (version>0)`; `pool_scope text`; `flat_rows jsonb CHECK (jsonb_typeof(flat_rows)='array')`; `share_rows jsonb CHECK (jsonb_typeof(share_rows)='array')`; `governance_rule_version bigint CHECK (version>0)`; `required_approvals jsonb CHECK (jsonb_typeof(required_approvals)='array')`; `approval_set jsonb CHECK (jsonb_typeof(approval_set)='array')`; `totals_checksum bytea CHECK (octet_length(totals_checksum)=32)`; `state text CHECK (state IN ('proposal_inert','approval_pending','approved','pinned','superseded'))`; `settlement_id uuid NULL`; `settlement_version bigint NULL CHECK (settlement_version IS NULL OR settlement_version>0)`; `created_by uuid`; `created_at timestamptz`; settlement ID/version must be both NULL or both present | Entity/show/approvals/settlement are revision-pinned owner seams. `UNIQUE(performing_entity_id,show_id,pool_scope,version)`; partial active-scope exclusion; `INDEX(show_id,state,version DESC)`; `INDEX(performing_entity_id,state)`. |
| `disbursement_instructions` (DisbursementInstruction) | `id uuid PRIMARY KEY`; `obligation_id uuid`; `settlement_id uuid`; `settlement_version bigint CHECK (version>0)`; `settlement_hash bytea CHECK (octet_length(settlement_hash)=32)`; `split_id uuid NULL`; `split_version bigint NULL CHECK (split_version IS NULL OR split_version>0)`; `canonical_payee_id uuid`; `payee_eligibility_revision bigint CHECK (payee_eligibility_revision>0)`; `gate_version bigint CHECK (version>0)`; `amount_minor bigint CHECK (amount_minor>=0)`; `currency char(3)`; `state text CHECK (state IN ('not_enabled','pending_eligibility','instructed','provider_pending','discharged','failed','reversed'))`; `provider_ref text NULL`; `pending_obligations jsonb CHECK (jsonb_typeof(pending_obligations)='array')`; `submitted_at timestamptz NULL`; `discharged_at timestamptz NULL`; `reversed_at timestamptz NULL`; `reversal_of uuid NULL`; `version bigint CHECK (version>0)` | FK split when present and self-FK reversal; obligation/settlement/payee/provider are owner seams. `UNIQUE(obligation_id)`; `UNIQUE(settlement_id,settlement_version,canonical_payee_id,gate_version)`; `INDEX(canonical_payee_id,state)`; `INDEX(settlement_id,settlement_version)`; partial `INDEX(state) WHERE state IN ('pending_eligibility','instructed','provider_pending','failed')`. |
| `tax_evidence` (TaxEvidence) | `id uuid PRIMARY KEY`; `instruction_id uuid`; `evidence_kind text`; `source_event_id uuid`; `assertion_party_id uuid`; `amount_minor bigint NULL`; `currency char(3) NULL`; `jurisdiction text NULL`; `expected_withholding_minor bigint NULL`; `actual_withholding_minor bigint NULL`; `vat_minor bigint NULL`; `document_ref text NULL`; `factual_state text`; `advice_status text NOT NULL DEFAULT 'none' CHECK (advice_status='none')`; `occurred_at timestamptz`; `recorded_at timestamptz`; `supersedes_id uuid NULL` | FK `instruction_id -> disbursement_instructions.id`; self-FK supersession; party/document/source event are owner seams. `UNIQUE(source_event_id)`; `INDEX(instruction_id,evidence_kind,occurred_at DESC)`; `INDEX(assertion_party_id,recorded_at DESC)`. |

All tables FORCE RLS. Split participants, payer/payee, and evidence parties receive only their safe projections; split/instruction/evidence workers get bounded INSERT/transition EXECUTE. PUBLIC/anon/authenticated have no base grants and approved/evidence histories reject UPDATE/DELETE. Migration tests assert every constraint, relationship, index plan, policy, and grant.

## State and Transactions

- Live split: `proposal_inert → approval_pending → approved → pinned → superseded`. Reject/withdraw supersedes the proposal version; pinned versions never mutate.
- Instruction: `not_enabled|pending_eligibility → instructed → provider_pending → discharged|failed|reversed`. B3 `future_multi_recipient_gated` is the reason on a recorded `not_enabled` pending obligation; restatement can append a reversal from any nonterminal/provider-derived state.
- Evidence is append-only and may supersede a prior assertion without deleting it.
- 31.15 locks split/version and governance approval keys, appends approval, validates total set and transitions atomically with live.split.changed.
- 31.16 locks final obligation, split and payee eligibility; inserts/replays instruction and live.disbursement.changed outbox atomically. Provider invocation occurs only from committed outbox and only in `instructed` state.
- 31.17 locks instruction/evidence source key, appends factual evidence and recomputes discharge total/status. A provider receipt after timeout reconciles by sourceEventId/providerRef.

## Middleware, Access and Security

| Actor | Allowed | Denied |
|---|---|---|
| performing entity governance | propose and govern scoped live split | approve on behalf of participant without authority; change final pin |
| participant | view disclosed split and approve/reject/withdraw own approval | another participant's private tax/payment evidence |
| payee/payer | own instruction status and permitted factual evidence | another payee, provider operation, tax determination |
| instruction/provider worker | one verified obligation/receipt | browse parties, activate B3, alter split |
| support | purpose-bound case/status | financial document, approval fabrication, tax advice |

Middleware order: request ID → CORS → auth/service/receipt → CSRF → strict body/header → rate → entity/participant/payee RLS → idempotency/If-Match → governance/finality/payee/B3/evidence policy → transaction → response schema → redacted audit.

Logs contain IDs, actor class, gate/governance versions, currency, state, receipt digest and safe error; they exclude amounts except restricted audit metric, bank/tax identifiers, document contents and participant allocations.

## Events and Integrations

| Event/seam | Contract | Timeout/retry/recovery |
|---|---|---|
| live.split.changed | show/split version, scope, approval/pin state, totals checksum, occurredAt, producer, traceId | at-least-once; split-version dedupe; no participant private fields |
| live.disbursement.changed | instruction/obligation, gate/provider state, discharge total, version | instruction-version dedupe; stale no-op, digest conflict quarantine |
| settlement.finalized/restated | final hash/obligation manifest/split pin → instruction build/reversal | 30,000 ms/attempt; 8 total attempts with full-jitter caps 1s/5s/30s/2m/10m/15m/15m; retry timeout, transient dependency/DB, serialization/deadlock, retryable 5xx; terminal signature/schema/digest/version/auth/invariant conflicts quarantine; circuit opens after 20 retryable failures/60s for 60s, admits one half-open event probe, closes after two successes, and reopens on failure; open retains the event, attempt 8 DLQs and alerts, instructions remain unbuilt/unreversed; source-event dedupe |
| Shard18 payout provider seam | one-payee instruction → accepted/provider receipt/status | 5s; 3 retries 1s/10s/1m; provider circuit 5 failures/min 5m; local ready/unknown reconciles |
| eligibility/tax settings | payee/jurisdiction/revision → factual eligibility/posture | 3s; 2 retries 100ms/500ms; circuit 5 failures/30s 30s; pending, never guessed |
| document storage | upload receipt → encrypted evidence ref | 5s; 2 retries 250ms/1s; circuit 5 failures/min 2m; assertion may remain without document only if policy permits |

### Exact retryability and circuit closure

Attempt totals include the initial attempt; every delay uses full jitter from zero through its stated cap. Half-open circuits admit one probe at a time, close after two consecutive successes, and reopen for the full interval on a retryable probe failure.

| Seam | Deadline and exact attempt schedule | Retryable versus terminal outcomes | Circuit open, half-open, and fallback |
|---|---|---|---|
| settlement.finalized/restated consumer | 30,000 ms handler deadline; 8 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min. | Retry transient dependency/DB availability, serialization/deadlock, handler timeout, and retryable 5xx. Invalid signature/schema/digest, unsupported version, auth denial, invariant failure, and equal-version digest conflict are terminal and quarantined. | Open the consumer event-type partition after 20 retryable failures in 60 s for 60 s; one half-open event probe. Open retains the durable event; attempt 8 moves it to DLQ with alert and leaves instructions unbuilt or unreversed, never guessed. |
| Shard18 payout provider seam | 5,000 ms per attempt; 4 attempts total; retry caps 1 s, 10 s, and 1 min using the same provider idempotency key. | Retry only known-not-sent transport failure, 408, 429, 5xx, or a provider-declared retryable state. Ambiguous send, auth/schema failure, invalid payee/tax state, and non-429 4xx are terminal for dispatch; ambiguous state enters reconciliation without blind resend. | Open after 5 retryable failures in 60 s for 5 min; half-open permits one status/reconciliation probe before one new dispatch. Fallback keeps local state ready or unknown_reconciling; no discharge is asserted without a verified receipt. |
| Eligibility/tax settings | 3,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429, and 5xx. Ineligible/withheld result, auth denial, stale/invalid revision, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open settings probe. Fallback leaves eligibility/tax posture pending and blocks payout; it never guesses. |
| Document storage | 5,000 ms per attempt; 3 attempts total; retry caps 250 ms then 1 s. | Retry only known-no-effect timeout/connection failure, 408, 429, and 5xx. Malware/policy rejection, digest mismatch, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 60 s for 2 min; one half-open upload probe. Fallback records document unavailable and permits an assertion without a document only when the pinned policy explicitly allows it. |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 31.14 | 400 TOTAL_INVALID/SCOPE_INVALID/PARTICIPANT_INVALID; 403 ENTITY_AUTHORITY_REQUIRED; 409 SPLIT_SCOPE_CONFLICT/IDEMPOTENCY_CONFLICT; 422 PARTICIPANT_INELIGIBLE |
| 31.15 | 400 APPROVAL_INVALID/CHECKSUM_MISMATCH; 403 PARTICIPANT_AUTHORITY_REQUIRED/STEP_UP_REQUIRED; 409 APPROVAL_CONFLICT/SPLIT_ALREADY_PINNED; 412 REVISION_MISMATCH; 422 APPROVAL_INCOMPLETE |
| 31.16 | 400 OBLIGATION_INVALID; 401 SERVICE_AUTH_REQUIRED; 409 SOURCE_EVENT_CONFLICT/INSTRUCTION_CONFLICT; 422 B3_DISABLED/PAYEE_INELIGIBLE/TAX_POSTURE_UNKNOWN/SETTLEMENT_NOT_FINAL |
| 31.17 | 400 EVIDENCE_INVALID; 403 EVIDENCE_SCOPE_REQUIRED; 409 SOURCE_EVENT_CONFLICT; 412 REVISION_MISMATCH; 422 DOCUMENT_REQUIRED/ADVICE_CONTENT_FORBIDDEN; 503 STORAGE_UNAVAILABLE |

Unknown failures map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT, and rates 429 RATE_LIMITED with Retry-After. Unauthorized IDs are 404 concealed.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 31.14 | ordered flats/share total/scope, eligibility, inert proposal, concurrent scope exclusion |
| 31.15 | fully disclosed version, participant/governance approvals, withdrawal before finality, immutable pinned version |
| 31.16 | one-payee ready/submitted/replay; multi-recipient B3 creates pending obligation and zero provider calls; restatement reversal |
| 31.17 | provider/bilateral evidence, expected versus actual withholding/VAT, document policy, correction append and no advice |

RLS/grant tests cover entity governance, each participant, payee, payer, unrelated party, support and workers. Transaction tests prove approval/instruction/evidence/outbox atomicity, unique obligations, no custody before B3 and provider receipt reconciliation.

## Deepening Passes

- Micro: pool scope, flats, shares, approvals, final pin, gate state, payee eligibility, discharge and factual tax fields are explicit.
- Macro: 31c owns finality, 31d owns obligations/instruction evidence, Shard18 owns provider/accounting primitives; recording splits never govern live income.
- Devil's advocate: no implementation may apply an unapproved split, change a pinned version, fan out before B3, hold contested money, guess tax posture or present factual evidence as advice.
- Two-implementer and ambiguity gates: PASS. No open decision; transport, schemas, errors, SQL, RLS/grants, state, integration and tests are deterministic.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 31.14 | `be_http_requests_total{operation_id="31.14",outcome,code}`, `be_http_latency_seconds{operation_id="31.14"}`, and `be_operation_recovery_total{operation_id="31.14",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.15 | `be_http_requests_total{operation_id="31.15",outcome,code}`, `be_http_latency_seconds{operation_id="31.15"}`, and `be_operation_recovery_total{operation_id="31.15",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.16 | `be_http_requests_total{operation_id="31.16",outcome,code}`, `be_http_latency_seconds{operation_id="31.16"}`, and `be_operation_recovery_total{operation_id="31.16",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.17 | `be_http_requests_total{operation_id="31.17",outcome,code}`, `be_http_latency_seconds{operation_id="31.17"}`, and `be_operation_recovery_total{operation_id="31.17",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 31d production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 31](../ia/31-live-settlement-intelligence.md)
- [Finality companion](31c-settlement-finality-restatement-export.md)
- Shard 18 payout/accounting primitives and Shard 01 entity governance.
