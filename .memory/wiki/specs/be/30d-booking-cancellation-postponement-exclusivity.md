# BE Spec 30d — Booking Cancellation, Force Majeure, Postponement, and Exclusivity

> Source: [IA Shard 30](../ia/30-booking-contracts.md), interactions 30.20–30.25. This companion owns `CancellationInstrument`, `ForceMajeureDeclaration`, `Postponement`, `ExclusivityClause`, and `WaiverInstrument`. It never cancels from a preview, fabricates force majeure, rewrites the accepted deal, silently shifts payment/refund rights, or calls a radius/exclusivity interpretation legal advice.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Scope | Cancellation preview/commit and agreement, force-majeure evidence, postponement, exclusivity evaluation, and bounded waiver instruments | IA Shard 30 `Interactions` lines 118–123 and `Contracts` lines 153–156 |
| Canonical ownership | This companion owns `CancellationInstrument`, `ForceMajeureDeclaration`, `Postponement`, `ExclusivityClause`, and `WaiverInstrument`; deal/payment/venue truth remains referenced | IA `Data Models` lines 207–211; `Cross-Shard Dependencies` lines 439–449 |
| Explicit non-ownership | Accepted offer/payment evidence, physical dates, ticket refunds, legal adjudication, and downstream settlement remain in 30b/30c, Shard 29, or downstream owners | IA `Interactions` lines 104–117 and 118–132; approved BE index split |
| Split validity | PASS: 30.20–30.25 have one operation owner and this file is the sole registry for BE30D-20..25 | approved BE index and IA `Interactions` lines 118–123 |

## Referenced Material Inventory

| Source file | Section / lines | Material consumed |
|---|---|---|
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Acceptance Criteria` lines 82–87 | preview/commit, bilateral agreement, declaration, postponement, evaluation, and waiver obligations |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Interactions` lines 118–123 | exact 30.20–30.25 preconditions, success, failure, and recovery |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Contracts` lines 153–156 | command inputs, consequence digest, force-majeure boundary, and waiver vocabulary |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Data Models` lines 207–211, 272–287 | canonical models, typed fields, states, and clause/waiver relationships |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Event Schemas` lines 338–340 | cancellation, postponement, and exclusivity event payload/privacy |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Request/Response Contracts` lines 112–200; `Error Handling` lines 426–461 | Zod 4 wire conventions, global ApiError, and recovery |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Middleware & Policies` lines 253–308; `Database Schema` lines 202–251 | CORS, auth, rate/body limits, RPC-only writes, RLS, grants, audit, and outbox |

## IA Source Map

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| 30.20 | IA `Interactions` line 118; `AC-30.20` | BE30D-20 | signed consequence preview or atomic cancellation instrument commit |
| 30.21 | IA `Interactions` line 119; `AC-30.21` | BE30D-21 | exact bilateral `CancellationInstrument` agreement |
| 30.22 | IA `Interactions` line 120; `AC-30.22` | BE30D-22 | attributed `ForceMajeureDeclaration` with evidence and dispute route |
| 30.23 | IA `Interactions` line 121; `AC-30.23` | BE30D-23 | successor-linked `Postponement` with dependency migration state |
| 30.24 | IA `Interactions` line 122; `AC-30.24` | BE30D-24 | facts-only `ExclusivityClause` evaluation |
| 30.25 | IA `Interactions` line 123; `AC-30.25` | BE30D-25 | scoped `WaiverInstrument` request/grant/revoke |

### Canonical model and event coverage

| IA canonical identifier | Owned or consumed here | Trace |
|---|---|---|
| `CancellationInstrument` | owned by BE30D-20/21 | IA `Data Models` line 207 |
| `ForceMajeureDeclaration` | owned by BE30D-22 | IA `Data Models` line 208 |
| `Postponement` | owned by BE30D-23 | IA `Data Models` line 209 |
| `ExclusivityClause` | owned/consumed by BE30D-24/25 | IA `Data Models` line 210 |
| `WaiverInstrument` | owned by BE30D-25 | IA `Data Models` line 211 |
| `booking.deal.cancelled` | emitted by BE30D-20/21 | IA `Event Schemas` line 338 |
| `booking.deal.postponed` | emitted by BE30D-23 | IA `Event Schemas` line 339 |
| `booking.exclusivity.evaluated` | emitted by BE30D-24/25 | IA `Event Schemas` line 340 |

### Feature Ledger Coverage

| Ledger feature | Disposition | Operation or owning companion |
|---|---|---|
| `17.05.03` Cancellation Tiers & Forfeit Computation | represented | BE30D-20/21 |
| `17.05.04` Force Majeure Declaration & Resolution | represented as evidence/workflow only | BE30D-22 |
| `17.06` Radius Clause & Exclusivity Tracking | represented | BE30D-24/25 |
| `17.01.01`, `17.01.02`, `17.01.03`, `17.01.04` | deferred | 30a/30c |
| `17.02.01`, `17.02.02`, `17.02.03`, `17.02.04`, `17.03.01`, `17.03.02`, `17.03.03`, `17.04`, `17.05.01`, `17.05.02`, `17.07`, `17.14` | deferred | 30b/30c/30e |

## Endpoint Completeness Reconciliation

| IA interaction | HTTP operation | Request → typed success | Error / event |
|---|---|---|---|
| 30.20 | POST `/api/v1/booking/deals/{dealId}/cancellation-actions` | CancellationAction → CancellationResult (200 preview or 201 commit) | ApiError; booking.deal.cancelled on commit |
| 30.21 | POST `/api/v1/booking/cancellations/{cancellationId}/agreements` | CancellationAgreement → CancellationAgreementResult (201) | ApiError; booking.deal.cancelled when complete |
| 30.22 | POST `/api/v1/booking/deals/{dealId}/force-majeure-declarations` | ForceMajeureRequest → ForceMajeureResult (201) | ApiError; declaration audit/event |
| 30.23 | POST `/api/v1/booking/deals/{dealId}/postponements` | PostponementRequest → PostponementResult (201) | ApiError; booking.deal.postponed |
| 30.24 | POST `/api/v1/booking/deals/{dealId}/exclusivity-evaluations` | ExclusivityEvaluation → ExclusivityEvaluationResult (200) | ApiError; booking.exclusivity.evaluated |
| 30.25 | POST `/api/v1/booking/exclusivity-clauses/{clauseId}/waivers` | WaiverRequest → WaiverResult (201) | ApiError; booking.exclusivity.evaluated when effectful |

## API Endpoints

### Authoritative Route Registry

| ID | IA | Method | Path | Authorization | Idempotency/concurrency |
|---|---|---|---|---|---|
| BE30D-20 | 30.20 | POST | `/api/v1/booking/deals/{dealId}/cancellation-actions` | binding party mandate; `preview|commit` | key + deal/policy versions |
| BE30D-21 | 30.21 | POST | `/api/v1/booking/cancellations/{cancellationId}/agreements` | exact affected binding party | key + instrument version |
| BE30D-22 | 30.22 | POST | `/api/v1/booking/deals/{dealId}/force-majeure-declarations` | binding party with clause/source evidence | key + deal/clause digest |
| BE30D-23 | 30.23 | POST | `/api/v1/booking/deals/{dealId}/postponements` | all affected booking mandates | key + deal/date/approval versions |
| BE30D-24 | 30.24 | POST | `/api/v1/booking/deals/{dealId}/exclusivity-evaluations` | deal party or authorized booking evaluator | key + clause/event/routing versions |
| BE30D-25 | 30.25 | POST | `/api/v1/booking/exclusivity-clauses/{clauseId}/waivers` | clause beneficiary for grant; bound party for request | key + clause/request/mandate versions |

This is the sole authoritative route registry for 30d. BE30D-20..25 are stable operation IDs used as keys for every contract, error, authorization, idempotency, rate, observability, and test row; 30a–30c, 30e, and BE00 routes are inherited and never duplicated here.

Rates: preview/evaluation 60/hour/deal; commit/agreement/declaration/postponement/waiver 20/hour/deal. Private/no-store; p95 <800 ms and p99 <1.5 s. TLS, ULIDs, request ID, strict JSON, 128 KiB cap, authenticated acting context, exact-origin booking/legal-console CORS, and step-up for consequential commit/grant are required. Preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`.

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const Ref=z.object({id:Id,version:Ver}).strict();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:z.string().min(1),details:BE00ErrorDetails}).strict();
const CancellationAction=z.discriminatedUnion('action',[
  z.object({action:z.literal('preview'),expectedDealVersion:Ver,initiatorPartyId:Id,reasonCode:z.string().regex(/^[A-Z0-9_]{1,60}$/),effectiveAt:At,evidenceRefs:z.array(Id).max(30)}).strict(),
  z.object({action:z.literal('commit'),expectedDealVersion:Ver,previewToken:z.string().min(32).max(2048),previewDigest:z.string().regex(/^[a-f0-9]{64}$/),partyApprovalRefs:z.array(Id).min(1).max(20),stepUpProofRef:Id}).strict()
]);
const CancellationAgreement=z.object({expectedInstrumentVersion:Ver,partyId:Id,mandateRef:Id,outcome:z.enum(['agree','reject','counter']),acceptedConsequenceDigest:z.string().regex(/^[a-f0-9]{64}$/),reason:z.string().trim().max(1000)}).strict();
const ForceMajeureRequest=z.object({expectedDealVersion:Ver,clauseRef:Ref,declaringPartyId:Id,eventCode:z.string().regex(/^[A-Z0-9_]{1,80}$/),occurredAt:At,sourceEvidenceRefs:z.array(Id).min(1).max(50),claimedEffects:z.array(z.enum(['performance_impossible','unsafe','illegal','materially_prevented'])).min(1),noticeDeliveredAt:At.optional()}).strict();
const PostponementRequest=z.object({expectedDealVersion:Ver,originalDateRef:Id,newDateRef:Id,newDateVersion:Ver,partyApprovalRefs:z.array(Id).min(2).max(20),termTreatment:z.enum(['carry','amend']),paymentTreatment:z.enum(['carry','reschedule','dispute']),announcementTreatment:z.enum(['retain_block','reauthorize']),reason:z.string().trim().min(1).max(2000)}).strict().refine(v=>v.originalDateRef!==v.newDateRef,{path:['newDateRef'],message:'new date differs'});
const ExclusivityEvaluation=z.object({clauseRef:Ref,candidateEventRef:Id,candidateEventVersion:Ver,routingSnapshot:Ref,asOf:At,territoryFacts:z.array(Id).max(30)}).strict();
const WaiverRequest=z.object({action:z.enum(['request','grant','reject','revoke']),clauseRef:Ref,candidateEventRef:Id,requestRef:Id.optional(),beneficiaryPartyId:Id,mandateRef:Id,scope:z.object({territoryRefs:z.array(Id).max(30),startsAt:At,endsAt:At,eventRefs:z.array(Id).max(30)}).strict(),reason:z.string().trim().min(1).max(1000)}).strict().refine(v=>Date.parse(v.scope.startsAt)<Date.parse(v.scope.endsAt),{path:['scope','endsAt'],message:'must follow start'});
```

### Typed success and error schemas

Every route returns its named strict Zod 4 success object or the BE00 global ErrorResponse envelope ApiError { code, message, requestId, details }. Unknown keys are rejected and preview output is never treated as a commit.

~~~ts
const CancellationResult=z.object({id:Id,mode:z.enum(['preview','commit']),dealId:Id,dealVersion:Ver,consequenceDigest:z.string().regex(/^[a-f0-9]{64}$/),state:z.enum(['preview','proposed','pending_agreement','agreed','committed','rejected','superseded'])}).strict();
const CancellationAgreementResult=z.object({id:Id,cancellationId:Id,version:Ver,outcome:z.enum(['agree','reject','counter']),state:z.enum(['pending_agreement','agreed','rejected']),consequenceDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const ForceMajeureResult=z.object({id:Id,dealId:Id,version:Ver,state:z.enum(['declared','acknowledged','disputed','accepted','withdrawn']),eventCode:z.string().regex(/^[A-Z0-9_]{1,80}$/),evidenceCount:z.number().int().positive()}).strict();
const PostponementResult=z.object({id:Id,dealId:Id,version:Ver,originalDateRef:Id,newDateRef:Id,state:z.enum(['proposed','approved','committed','failed','superseded']),termTreatment:z.enum(['carry','amend']),paymentTreatment:z.enum(['carry','reschedule','dispute'])}).strict();
const ExclusivityEvaluationResult=z.object({id:Id,clauseId:Id,version:Ver,candidateEventRef:Id,result:z.enum(['outside','inside','ambiguous','excepted','waived']),confidence:z.enum(['authoritative','bounded','unknown']),evaluatedAt:At}).strict();
const WaiverResult=z.object({id:Id,clauseId:Id,version:Ver,action:z.enum(['request','grant','reject','revoke']),state:z.enum(['requested','granted','rejected','revoked','expired']),scopeDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const ErrorResponse=ApiError;
~~~

| Operation | Request schema | Success schema | Status | Error response |
|---|---|---|---|---|
| BE30D-20 | CancellationAction | CancellationResult | 200 or 201 | ErrorResponse |
| BE30D-21 | CancellationAgreement | CancellationAgreementResult | 201 | ErrorResponse |
| BE30D-22 | ForceMajeureRequest | ForceMajeureResult | 201 | ErrorResponse |
| BE30D-23 | PostponementRequest | PostponementResult | 201 | ErrorResponse |
| BE30D-24 | ExclusivityEvaluation | ExclusivityEvaluationResult | 200 | ErrorResponse |
| BE30D-25 | WaiverRequest | WaiverResult | 201 | ErrorResponse |

Unknown keys, stale/cancelled deal/clause/date/mandate, expired or body-mismatched preview token, consequence digest mismatch, missing affected approval, unsupported force-majeure event/effect/source, same postponement date, conflicting payment/announcement treatment, unavailable routing/event fact, overbroad waiver, self-grant without beneficiary authority, unsafe text, and contradictory active instrument fail before mutation. Preview derives financial, inventory, document, announcement, calendar, and downstream consequences from pinned versions and stores no state transition.

## Persistence and Access

```sql
create table cancellation_instruments (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  deal_id text not null, deal_version bigint not null, initiator_party_id text not null,
  reason_code text not null, effective_at timestamptz not null,
  consequence_snapshot jsonb not null, consequence_digest text not null,
  evidence_refs jsonb not null, state text not null
    check(state in ('proposed','pending_agreement','agreed','committed','rejected','superseded')),
  created_at timestamptz not null, primary key(id,version), unique(deal_id,consequence_digest,version)
);
create table cancellation_agreements (
  id text primary key, cancellation_id text not null, instrument_version bigint not null,
  party_id text not null, mandate_ref text not null,
  outcome text not null check(outcome in ('agree','reject','counter')),
  consequence_digest text not null, reason_ciphertext bytea,
  created_at timestamptz not null, unique(cancellation_id,party_id,instrument_version)
);
create table force_majeure_declarations (
  id text not null, version bigint not null check(version>0), deal_id text not null,
  deal_version bigint not null, clause_id text not null, clause_version bigint not null,
  declaring_party_id text not null, event_code text not null, occurred_at timestamptz not null,
  source_evidence_refs jsonb not null, claimed_effects jsonb not null,
  notice_delivered_at timestamptz, state text not null
    check(state in ('declared','acknowledged','disputed','accepted','withdrawn')),
  created_at timestamptz not null, primary key(id,version)
);
create table postponements (
  id text not null, version bigint not null check(version>0), deal_id text not null,
  original_date_ref text not null, new_date_ref text not null, new_date_version bigint not null,
  party_approval_refs jsonb not null, term_treatment text not null,
  payment_treatment text not null, announcement_treatment text not null,
  state text not null check(state in ('proposed','approved','committed','failed','superseded')),
  created_at timestamptz not null, primary key(id,version),
  check(original_date_ref<>new_date_ref)
);
create table exclusivity_clauses (
  id text not null, version bigint not null check(version>0), deal_id text not null,
  beneficiary_party_id text not null, bound_party_id text not null,
  radius_value numeric(12,3), radius_unit text,
  territory_refs jsonb not null, starts_at timestamptz not null, ends_at timestamptz not null,
  event_type_scope jsonb not null, exception_refs jsonb not null,
  source_term_digest text not null, state text not null check(state in ('active','expired','superseded','cancelled')),
  created_at timestamptz not null, primary key(id,version), check(starts_at<ends_at)
);
create table exclusivity_evaluations (
  id text primary key, clause_id text not null, clause_version bigint not null,
  candidate_event_ref text not null, candidate_event_version bigint not null,
  routing_snapshot_id text not null, routing_snapshot_version bigint not null,
  fact_json jsonb not null, result text not null check(result in ('outside','inside','ambiguous','excepted','waived')),
  confidence text not null check(confidence in ('authoritative','bounded','unknown')),
  evaluated_at timestamptz not null,
  unique(clause_id,clause_version,candidate_event_ref,candidate_event_version,routing_snapshot_id,routing_snapshot_version)
);
create table waiver_instruments (
  id text not null, version bigint not null check(version>0), clause_id text not null,
  clause_version bigint not null, candidate_event_ref text not null,
  request_ref text, beneficiary_party_id text not null, mandate_ref text not null,
  scope_json jsonb not null, state text not null check(state in ('requested','granted','rejected','revoked','expired')),
  reason_ciphertext bytea not null, created_at timestamptz not null,
  primary key(id,version)
);
```

Indexes cover cancellation deal/state, agreements instrument/party, force-majeure deal/state/event, postponement deal/state/date, active clause party/time/territory, evaluation candidate/result, and waiver clause/state/expiry. Every table forces RLS. Authenticated users execute scoped RPCs only; parties see their instruments and disclosed consequence projection, finance consequences require finance mandate, evidence/reasons are restricted, and counterpart identity is never enumerated outside deal membership. Evaluators get minimized clause/event/routing facts. Direct client update/delete is denied; downstream command workers receive leased instrument rows only.

### Constraint, index, RLS, and grant registry

This typed registry is authoritative for every persisted field, including SQL type, nullability, constraints, local FK or explicitly named opaque seam, query indexes, and grants. Immutable history is append-only.

| Table | Typed fields, nullability, and constraints | FK or opaque target | Query indexes | RLS and grants |
|---|---|---|---|---|
| cancellation_instruments | id text NOT NULL; version bigint NOT NULL CHECK >0; tenant_id text NOT NULL; deal_id text NOT NULL; deal_version bigint NOT NULL CHECK >0; initiator_party_id text NOT NULL; reason_code text NOT NULL; effective_at timestamptz NOT NULL; consequence_snapshot jsonb NOT NULL; consequence_digest text NOT NULL CHECK 64 lowercase hex; evidence_refs jsonb NOT NULL; state text NOT NULL CHECK proposed/pending_agreement/agreed/committed/rejected/superseded; created_at timestamptz NOT NULL; PK(id,version); UNIQUE(deal_id,consequence_digest,version) | deal_id FK accepted_deals.id; initiator/evidence refs opaque Identity/Evidence seams | (deal_id,state,version DESC); (deal_id,effective_at); (consequence_digest) | RLS deal-party and finance-purpose projection; INSERT via scoped RPC; no direct update/delete |
| cancellation_agreements | id text NOT NULL PK; cancellation_id text NOT NULL; instrument_version bigint NOT NULL CHECK >0; party_id text NOT NULL; mandate_ref text NOT NULL; outcome text NOT NULL CHECK agree/reject/counter; consequence_digest text NOT NULL CHECK 64 lowercase hex; reason_ciphertext bytea NULL; created_at timestamptz NOT NULL; UNIQUE(cancellation_id,party_id,instrument_version) | cancellation_id FK cancellation_instruments.id; party/mandate refs opaque Identity authority seam | (cancellation_id,instrument_version); (party_id,created_at DESC); (outcome) | RLS affected party only; ciphertext service-only; INSERT RPC only |
| force_majeure_declarations | id text NOT NULL; version bigint NOT NULL CHECK >0; deal_id text NOT NULL; deal_version bigint NOT NULL CHECK >0; clause_id text NOT NULL; clause_version bigint NOT NULL CHECK >0; declaring_party_id text NOT NULL; event_code text NOT NULL; occurred_at timestamptz NOT NULL; source_evidence_refs jsonb NOT NULL; claimed_effects jsonb NOT NULL; notice_delivered_at timestamptz NULL; state text NOT NULL CHECK declared/acknowledged/disputed/accepted/withdrawn; created_at timestamptz NOT NULL; PK(id,version) | deal_id FK accepted_deals.id; clause_id/version opaque accepted-term seam; party/evidence refs opaque | (deal_id,state,occurred_at DESC); (clause_id,clause_version); (event_code,occurred_at DESC) | RLS deal parties and Trust/Safety purpose; evidence service-only; INSERT RPC only |
| postponements | id text NOT NULL; version bigint NOT NULL CHECK >0; deal_id text NOT NULL; original_date_ref text NOT NULL; new_date_ref text NOT NULL; new_date_version bigint NOT NULL CHECK >0; party_approval_refs jsonb NOT NULL; term_treatment text NOT NULL CHECK carry/amend; payment_treatment text NOT NULL CHECK carry/reschedule/dispute; announcement_treatment text NOT NULL CHECK retain_block/reauthorize; state text NOT NULL CHECK proposed/approved/committed/failed/superseded; created_at timestamptz NOT NULL; PK(id,version); CHECK original_date_ref<>new_date_ref | deal_id FK accepted_deals.id; date refs and approvals opaque Shard 29/30b authority seams | (deal_id,state,version DESC); (deal_id,new_date_ref,new_date_version); (state,created_at DESC) | RLS affected deal parties; downstream worker lease via RPC; no direct mutation |
| exclusivity_clauses | id text NOT NULL; version bigint NOT NULL CHECK >0; deal_id text NOT NULL; beneficiary_party_id text NOT NULL; bound_party_id text NOT NULL; radius_value numeric(12,3) NULL CHECK >=0; radius_unit text NULL; territory_refs jsonb NOT NULL; starts_at timestamptz NOT NULL; ends_at timestamptz NOT NULL CHECK starts_at<ends_at; event_type_scope jsonb NOT NULL; exception_refs jsonb NOT NULL; source_term_digest text NOT NULL CHECK 64 lowercase hex; state text NOT NULL CHECK active/expired/superseded/cancelled; created_at timestamptz NOT NULL; PK(id,version) | deal_id FK accepted_deals.id; beneficiary/bound parties and source term opaque Identity/term seams | (deal_id,state,starts_at,ends_at); (beneficiary_party_id,state); GIN(territory_refs); (source_term_digest) | RLS deal beneficiaries and evaluator purpose; no public grant; version append only |
| exclusivity_evaluations | id text NOT NULL PK; clause_id text NOT NULL; clause_version bigint NOT NULL CHECK >0; candidate_event_ref text NOT NULL; candidate_event_version bigint NOT NULL CHECK >0; routing_snapshot_id text NOT NULL; routing_snapshot_version bigint NOT NULL CHECK >0; fact_json jsonb NOT NULL; result text NOT NULL CHECK outside/inside/ambiguous/excepted/waived; confidence text NOT NULL CHECK authoritative/bounded/unknown; evaluated_at timestamptz NOT NULL; UNIQUE(clause_id,clause_version,candidate_event_ref,candidate_event_version,routing_snapshot_id,routing_snapshot_version) | clause_id FK exclusivity_clauses.id; candidate/routing refs opaque Shard 29/event seams | (clause_id,clause_version,evaluated_at DESC); (candidate_event_ref,candidate_event_version); (result,confidence) | RLS evaluator and deal-party minimized projection; service INSERT RPC; fact details filtered |
| waiver_instruments | id text NOT NULL; version bigint NOT NULL CHECK >0; clause_id text NOT NULL; clause_version bigint NOT NULL CHECK >0; candidate_event_ref text NOT NULL; request_ref text NULL; beneficiary_party_id text NOT NULL; mandate_ref text NOT NULL; scope_json jsonb NOT NULL; state text NOT NULL CHECK requested/granted/rejected/revoked/expired; reason_ciphertext bytea NOT NULL; created_at timestamptz NOT NULL; PK(id,version) | clause_id FK exclusivity_clauses.id; candidate/request/mandate refs opaque event/authority seams | (clause_id,clause_version,state,created_at DESC); (candidate_event_ref,state); (beneficiary_party_id,state) | RLS beneficiary and bound party; ciphertext service-only; grant/revoke RPC only |

All tables enable and force RLS; anonymous/public grants and direct client INSERT/UPDATE/DELETE are denied. Security-definer RPCs recheck tenant, deal membership, binding mandate, finance purpose, evaluator scope, and step-up. Local FKs reject orphan instruments; opaque source refs require pinned version and digest or the transaction remains blocked.

## Transactions and State

- 30.20 preview reads a serializable pinned snapshot and returns a signed 15-minute token/digest without writing lifecycle state. Commit locks deal and every source version, verifies token/body/approvals, inserts `CancellationInstrument`, deal lifecycle version, compensating downstream commands, audit/outbox atomically; any command admission failure rolls back.
- 30.21 locks instrument/party mandate and appends agreement. Required agreement set derives from accepted deal/cancellation policy. Final commit occurs only when exact consequence digest approvals are complete.
- 30.22 appends declaration/evidence/notice and opens an evaluation/dispute workflow; declaration alone does not cancel, excuse, or establish legal force majeure.
- 30.23 locks deal/original/new date and all approvals, reserves new source date, appends `Postponement`, accepted-deal lifecycle, schedule/payment/announcement invalidations, audit/outbox atomically. Failed new-date reservation leaves original deal unchanged.
- 30.24 computes geographic/time/event-scope facts from pinned clause/event/routing versions, returning `ambiguous` when sources/profile cannot decide. It is a contractual fact projection, not legal advice.
- 30.25 request appends without effect; grant requires live beneficiary mandate and scope subset of clause, appends `WaiverInstrument`, and changes later evaluations. Revoke/expire never rewrites prior evaluation.

Idempotency binds tenant, actor, route, deal/instrument, and body hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; replay returns stored result. Database time controls intervals/expiry.

### Explicit state machine and blocked behavior

| Aggregate | States | Allowed transitions and trigger | Blocked behavior |
|---|---|---|---|
| CancellationInstrument | proposed, pending_agreement, agreed, committed, rejected, superseded | preview produces no transition; commit appends proposed; agreements move pending_agreement→agreed; commit moves agreed→committed | stale preview/digest or missing approval leaves deal and instrument unchanged |
| CancellationAgreement | pending, agreed, rejected, countered | append under instrument version; exact affected party set yields agreed | missing/unauthorized party cannot advance instrument; prior decision remains immutable |
| ForceMajeureDeclaration | declared, acknowledged, disputed, accepted, withdrawn | declaration→acknowledged/disputed by response workflow; no platform legal conclusion | missing evidence remains declared and opens dispute; never auto-cancels deal |
| Postponement | proposed, approved, committed, failed, superseded | proposed→approved after all affected approvals; approved→committed after new date reservation | date/source reservation or dependency failure leaves original deal active and visible |
| ExclusivityClause | active, expired, superseded, cancelled | active→expired by database time or →superseded/cancelled by versioned term | missing routing/geodata projects evaluation unknown; clause is never silently ignored |
| ExclusivityEvaluation | outside, inside, ambiguous, excepted, waived | evaluate pinned clause/event/routing facts; waiver may create later waived result | unknown source yields ambiguous/unknown confidence and requires human/counsel route |
| WaiverInstrument | requested, granted, rejected, revoked, expired | request→granted/rejected by beneficiary mandate; granted→revoked/expired by action/time | scope beyond clause or missing mandate remains requested; no prior evaluation rewrite |

## Events and External Seams

### External Seam Contract Registry

Every cross-service call has exact typed request/response, timeout, finite retry/backoff, circuit rule, and recovery. Consequential commit fails closed when a seam is unavailable.

| Seam | Exact request → response | Timeout | Retries and backoff | Circuit breaker | Recovery |
|---|---|---|---|---|---|
| Deal and accepted-term authority | {dealId,dealVersion,partyId,purpose,termDigest} → {exists,state,authorized,version} | 2000 ms total | 2 retries at 100 ms and 500 ms | open after 5 failures in 30 s; hold 60 s | retain preview/transaction blocked; return 503 and retry same key |
| Calendar/date reservation | {originalDateRef,newDateRef,newDateVersion,dealId,expectedVersion} → {available,reservationRef,sourceVersion} | 3000 ms total | 2 retries at 100 ms and 500 ms | open after 5 failures in 30 s; hold 60 s | no lifecycle mutation; release lease or retry admission |
| Routing/geodata/event facts | {candidateEventRef,eventVersion,routingSnapshotRef,clauseRef,asOf} → {factsDigest,resultInputs,confidence} | 3000 ms total | 2 retries at 100 ms and 500 ms | open after 5 failures in 30 s; hold 60 s | return ambiguous/unknown; no legal conclusion or waiver inference |
| Downstream compensating command | {instrumentId,instrumentVersion,dealId,commandType,consequenceDigest,idempotencyKey} → {accepted,commandId,status} | 3000 ms total | 2 retries at 250 ms and 750 ms; async 1/5/30 s | open after 5 failures in 30 s; hold 60 s | committed instrument remains visible; reconcile partial completion, never duplicate lifecycle |
| Audit/event outbox | {eventId,eventType,aggregateRef,aggregateVersion,payloadHash,occurredAt} → {accepted,sequence,dedupe} | 1000 ms per write | 3 retries at 100 ms, 500 ms, and 2000 ms | open after 5 failures in 60 s; hold 120 s | rollback before domain commit or dead-letter after 24 h; replay preserves order |

| Event | Trigger and payload |
|---|---|
| `booking.deal.cancelled` | committed cancellation: `{dealId,dealVersion,cancellationId,version,reasonCode,consequenceDigest,effectiveAt,occurredAt}` |
| `booking.deal.postponed` | committed postponement: `{dealId,dealVersion,postponementId,version,originalDateRef,newDateRef,treatmentCodes,occurredAt}` |
| `booking.exclusivity.evaluated` | evaluation/waiver transition: `{dealId,clauseId,clauseVersion,evaluationId,candidateEventRef,result,confidence,waiverRef,occurredAt}` |

Transactional outbox, per-deal/clause order, at-least-once, event-ID dedupe, retry/dead-letter. Events omit amounts, parties, evidence, reasons, clause terms, mandates, approvals, and private location facts.

Deal/calendar/payment/ticket/announcement/event/routing sources use a 2–3 s total timeout, retries at 100/500 ms, and a circuit opened after 5 failures in 30 s for 60 s; consequential commit fails closed. Downstream compensating-command admission uses a 3 s total timeout, retries at 250/750 ms only for idempotent admission, a circuit opened after 5 failures in 30 s for 60 s, and destination idempotency; asynchronous execution retries at 1/5/30 s. Partial downstream completion is reconciled visibly against the committed instrument; it never causes a second lifecycle commit.

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod/term schemas -> deal/party RLS -> mandate/evidence/source versions -> step-up for commit/grant -> idempotency/If-Match -> transaction -> minimized response -> audit. Errors use `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed instrument/scope/treatment |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | party/beneficiary mandate absent |
| 404 `NOT_FOUND` | absent/concealed deal/instrument/clause |
| 409 `VERSION_CONFLICT` | stale deal/source/instrument |
| 409 `APPROVAL_INCOMPLETE` | affected party agreement absent |
| 409 `PREVIEW_STALE_OR_MISMATCHED` | regenerate preview |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `PREVIEW_OR_WAIVER_EXPIRED` | deadline passed |
| 422 `FORCE_MAJEURE_EVIDENCE_INSUFFICIENT` | declaration retained, no conclusion |
| 422 `POSTPONEMENT_SOURCE_INVALID` | new date/approval/treatment invalid |
| 422 `EXCLUSIVITY_AMBIGUOUS` | facts-only result, human/counsel review |
| 422 `WAIVER_SCOPE_INVALID` | requested scope exceeds clause |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no consequential state inferred |

### Per-operation Error, Security, and Limits Matrix

Every row uses the BE00 global envelope ApiError { code, message, requestId, details }; app codes and messages are stable, and details contain only safe field names and opaque references.

| Operation | Success status/app code/message/retry | Error status/app code/message/retry | Ownership and 403/404 rule |
|---|---|---|---|
| BE30D-20 | 200 CANCELLATION_PREVIEW_READY “cancellation preview ready” or 201 CANCELLATION_COMMITTED “cancellation committed”; replay returns stored result | 409 PREVIEW_STALE_OR_MISMATCHED “preview is stale”; refresh then retry; 403 FORBIDDEN “binding mandate absent”; no retry | bound party owns deal; known deal without authority 403, concealed deal 404 |
| BE30D-21 | 201 CANCELLATION_AGREEMENT_RECORDED “cancellation agreement recorded”; replay returns result | 409 APPROVAL_INCOMPLETE “affected agreement is incomplete”; refresh then retry; 409 VERSION_CONFLICT “instrument is stale”; refresh then retry | exact affected binding party; known instrument without mandate 403, concealed instrument 404 |
| BE30D-22 | 201 FORCE_MAJEURE_RECORDED “force-majeure declaration recorded”; no retry after commit, replay returns result | 422 FORCE_MAJEURE_EVIDENCE_INSUFFICIENT “declaration needs evidence”; no retry; 403 FORBIDDEN “party cannot declare”; no retry | binding party with clause/evidence scope; known deal without authority 403, concealed deal 404 |
| BE30D-23 | 201 POSTPONEMENT_RECORDED “postponement recorded”; no retry after commit, replay returns result | 422 POSTPONEMENT_SOURCE_INVALID “new date or treatment is invalid”; no retry; 409 VERSION_CONFLICT “deal version is stale”; refresh then retry | all affected booking mandates; known deal without approval 403, concealed deal 404 |
| BE30D-24 | 200 EXCLUSIVITY_EVALUATED “exclusivity facts evaluated”; replay returns result | 422 EXCLUSIVITY_AMBIGUOUS “facts are inconclusive”; no retry; 503 DEPENDENCY_UNAVAILABLE “routing fact unavailable”; retry after Retry-After | deal party or scoped evaluator; known clause without scope 403, concealed deal/clause 404 |
| BE30D-25 | 201 WAIVER_INSTRUMENT_RECORDED “waiver instrument recorded”; replay returns result | 422 WAIVER_SCOPE_INVALID “waiver exceeds clause”; no retry; 403 FORBIDDEN “beneficiary mandate absent”; no retry | beneficiary grant or bound-party request; known clause without authority 403, concealed clause 404 |

### Per-operation middleware and output filtering

| Operation | Auth and ownership | Numeric rate limit | Validation locus | CORS policy | Output allowlist |
|---|---|---|---|---|---|
| BE30D-20 | session + binding party mandate; absent mandate 403, concealed deal 404 | 60/hour/deal | Zod CancellationAction then preview digest or commit approval validator | BE00-CORS-WEB-CREDENTIALLED exact origin | mode/deal version/consequence digest/state; no private payment or evidence |
| BE30D-21 | session + affected binding party mandate; absent mandate 403, concealed instrument 404 | 20/hour/deal | Zod CancellationAgreement then consequence digest/mandate validator | BE00-CORS-WEB-CREDENTIALLED exact origin | agreement id/outcome/state/digest; no reason ciphertext |
| BE30D-22 | session + clause-bound party/evidence scope; absent scope 403, concealed deal 404 | 20/hour/deal | Zod ForceMajeureRequest then clause/evidence validator | BE00-CORS-WEB-CREDENTIALLED exact origin | declaration id/state/event code/evidence count; no raw evidence |
| BE30D-23 | session + all affected booking mandates and step-up; absent mandate 403, concealed deal 404 | 20/hour/deal | Zod PostponementRequest then date reservation/approval validator | BE00-CORS-WEB-CREDENTIALLED exact origin | postponement id/version/state/date refs/treatments; no private approvals |
| BE30D-24 | session + deal party or authorized evaluator; absent scope 403, concealed clause 404 | 60/hour/deal | Zod ExclusivityEvaluation then pinned fact/geodata validator | BE00-CORS-WEB-CREDENTIALLED exact origin | evaluation id/result/confidence/facts digest; no private location facts |
| BE30D-25 | session + beneficiary/bound-party mandate and step-up for grant; absent mandate 403, concealed clause 404 | 20/hour/deal | Zod WaiverRequest then subset/interval/authority validator | BE00-CORS-WEB-CREDENTIALLED exact origin | waiver id/action/state/scope digest; no reason or mandate |

### Pagination and bounded command responses

All operations are bounded commands, not collection reads; no cursor is returned. Array caps are explicit in the request schemas.

| Operation | Pagination / limit rule |
|---|---|
| BE30D-20 | N/A preview/commit command; evidence refs max 30 and approvals max 20 |
| BE30D-21 | N/A single agreement; reason max 1000 and one agreement response |
| BE30D-22 | N/A single declaration; evidence refs max 50 and effects min 1 |
| BE30D-23 | N/A single postponement; approvals max 20 and one successor response |
| BE30D-24 | N/A single evaluation; territory facts max 30 and one facts response |
| BE30D-25 | N/A single waiver action; territory/event refs max 30 and one instrument response |

Logs include opaque request/deal/instrument/clause/evaluation/role IDs, versions/state/result/confidence/code, latency, downstream job/outbox age; exclude parties, terms, amounts, evidence, reason, mandate, approval and private route facts. Metrics cover previews/stale commits, cancellation agreement/commit/reconciliation, declarations/disputes, postponement failures, evaluation ambiguous rates, waiver lifecycle, latency/errors/circuits/outbox. Availability 99.9%; p99 writes <1.5 s; downstream convergence <5 min p99. Page on commit without matching preview/approval, duplicated lifecycle command, or five-minute 5xx >2%.

Tests cover schemas/cross-fields, preview signature/expiry/digest, consequence source pinning, exact approvals, declaration non-conclusion, postponement atomic reservation, boundary/radius/time/exception properties, waiver subset/revoke, all roles/tenants/mandates/revocations, RLS/field projection/grants, concurrent commit/agreement/declaration/postpone/grant, idempotency races, dependency retry/circuit/recovery, compensating-command convergence, event privacy/order/dedupe, log redaction, migrations/index plans, CORS, and alerts. CI fails on uncovered 30.20–30.25, missing five models/three events, route collision, preview side effect, unstated force-majeure/cancellation, overbroad waiver, direct write grant, malformed table/link, or unresolved question.

### Per-operation observability registry

| Operation ID | Structured logs and trace | Metrics and SLO | Audit, outbox, and alert |
|---|---|---|---|
| BE30D-20 | opaque deal/instrument IDs, preview digest, mode, version, latency; no terms/evidence | preview-stale/commit rate, p95 <1.5 s | preview/commit audit and outbox; page on commit without preview |
| BE30D-21 | opaque cancellation/agreement IDs, outcome, digest, version, latency; no reasons | agreement/conflict rate, p95 <1.5 s | agreement audit/outbox; page on incomplete agreement commit |
| BE30D-22 | opaque deal/declaration IDs, evidence count, event code, state; no evidence | declaration/insufficient-evidence rate, p95 <1.5 s | declaration audit/outbox; page on inferred conclusion |
| BE30D-23 | opaque deal/postponement IDs, date/treatment refs, version, latency; no approvals | postponement/reservation conflict rate, p95 <1.5 s | postponement audit/outbox; page on split reservation |
| BE30D-24 | opaque deal/evaluation IDs, confidence/result, fact digest; no location facts | evaluation/ambiguous/dependency rate, p95 <1.5 s | evaluation audit/outbox; page on unsupported automatic action |
| BE30D-25 | opaque clause/waiver IDs, scope digest, state, expiry; no mandate/reason | waiver/blocked/revocation rate, p95 <1.5 s | waiver audit/outbox; page on overbroad grant |

### Per-operation contract tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE30D-T20 | BE30D-20 | preview signature/expiry, commit CAS, mandate 403/404, ApiError, and no-side-effect tests pass |
| BE30D-T21 | BE30D-21 | affected-party agreement/quorum, instrument version race, ApiError, audit, and CORS tests pass |
| BE30D-T22 | BE30D-22 | evidence cap/insufficient outcome, clause scope, ApiError, privacy, and event tests pass |
| BE30D-T23 | BE30D-23 | date reservation atomicity, affected approvals, idempotency, ApiError, and recovery tests pass |
| BE30D-T24 | BE30D-24 | pinned facts/confidence, boundary rules, dependency circuit, ApiError, and output tests pass |
| BE30D-T25 | BE30D-25 | waiver subset/tier/expiry, beneficiary auth, ApiError, audit/outbox, and CORS tests pass |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| 1 cross-operation consistency | Can a preview, agreement, postponement, exclusivity evaluation, or waiver bypass the bound deal and clause versions? | BE30D-20 through BE30D-25 pin deal/instrument/clause/source versions and keep preview separate from commit; no command infers consent or force majeure. |
| 2 sequencing and concurrency | What wins when cancellation parties agree, a postponement reserves a slot, or a waiver is granted concurrently? | Expected-version/serializable reservation and unique active instrument rules elect one result; stale commands receive VERSION_CONFLICT and refetch. |
| 3 failure cascade | What happens when evidence, routing facts, approval, or source services fail? | No consequential state commits before local evidence and authority gates; dependency failure is queued or surfaced as named 503, with circuit recovery and no inferred conclusion. |
| 4 authorization completeness | Are bound parties, beneficiaries, evaluators, and step-up actors separated? | Each route has role/ownership and 403/404 behavior; known scope without mandate is 403, concealed deal/instrument/clause is 404, and grants require scoped step-up. |
| 5 observability completeness | Can lifecycle disputes be traced without leaking terms or evidence? | Opaque IDs, versions, state/result/confidence, latency, audit, outbox, metrics, and redaction rules are defined; private evidence and reason text stay out of telemetry. |
| 6 abuse and limit edges | Can previews, evidence, territory facts, or waiver refs be replayed or oversized? | Strict schemas, explicit evidence/approval/fact caps, per-deal numeric limits, idempotency body binding, digest expiry, and Retry-After controls apply per route. |
| 7 partial-state hygiene | Can an expired preview or failed postponement leave a cancellation or hold half-applied? | Preview signatures expire without mutation; serializable command and audit/outbox commit atomically, while compensating reconciliation is explicit and idempotent. |

## Open Questions

None.

## Ambiguity Gate

- Interactions 30.20–30.25, all five canonical models, and three events are fully specified.
- Preview versus commit, agreement, declaration evidence, postponement atomicity, exclusivity facts, waiver scope, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Dependency References

- [IA Shard 30](../ia/30-booking-contracts.md)
- Shards 01/11/14/29/30b/30c/31/34/35 identity, finance, engagement, event/date, accepted deal, payments/announcement, settlement, routing, and ticketing contracts.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-28 | Completed BE30D contracts, route matrices, typed persistence, state/recovery, seam, security, deepening, and ambiguity gates. |
