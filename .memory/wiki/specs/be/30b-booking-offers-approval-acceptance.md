# BE Spec 30b — Booking Offers, Approvals, and Acceptance

> Source: [IA Shard 30](../ia/30-booking-contracts.md), interactions 30.06–30.13. This companion owns `OfferThread`, immutable `OfferVersion`, `Approval`, non-binding `DealExpression`, and binding `AcceptedDeal`. It never treats delivery, link access, a verbal note, partial approval, or silence as acceptance.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Scope | Offer composition, immutable version DAG, external receipt, counters, verbal evidence, approval, acceptance, and challenge confirmation | IA Shard 30 `Interactions` lines 104–111 and `Contracts` lines 142–146 |
| Canonical ownership | This companion owns `OfferThread`, `OfferVersion`, `Approval`, `DealExpression`, and `AcceptedDeal`; physical slots and commercial positions remain upstream | IA `Data Models` lines 185–189; `Cross-Shard Dependencies` lines 439–449 |
| Explicit non-ownership | Avails/positions, generated documents, payment schedules, cancellation, venue truth, and announce authorization are owned by 30a, 30c–30e, or their producer shards | IA `Interactions` lines 96–103 and 112–132; approved BE index split |
| Split validity | PASS: 30.06–30.13 have one operation owner and no duplicate BE00/platform route; this file is the sole registry for BE30B-06..13 | approved BE index and IA `Interactions` lines 104–111 |

## Referenced Material Inventory

| Source file | Section / lines | Material consumed |
|---|---|---|
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Acceptance Criteria` lines 63–81 | complete offer, versioning, receipt, counter, verbal, approval, acceptance, and challenge obligations |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Interactions` lines 104–111 | exact 30.06–30.13 preconditions, success, failure, and recovery |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Contracts` lines 142–146 | command inputs, closed term grammar, authority, and approval/acceptance errors |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Data Models` lines 185–189, 248–252 | canonical aggregates, immutable fields, and relationships |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Event Schemas` lines 324–326 | offer-sent, approval-changed, and deal-accepted event payload/privacy |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Request/Response Contracts` lines 112–200; `Error Handling` lines 426–461 | Zod 4 wire conventions, global ApiError, and failure recovery |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Middleware & Policies` lines 253–308; `Database Schema` lines 202–251 | CORS, auth, body/rate limits, RPC-only writes, RLS, grants, audit, and outbox |

## IA Source Map

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| 30.06 | IA `Interactions` line 104; `AC-30.06` | BE30B-06 | private typed `OfferThread` draft |
| 30.07 | IA `Interactions` line 105; `AC-30.07` | BE30B-07 | immutable complete `OfferVersion` sent with expiry and snapshots |
| 30.08 | IA `Interactions` line 106; `AC-30.08` | BE30B-08 | minimized external receipt with no authority implication |
| 30.09 | IA `Interactions` line 107; `AC-30.09` | BE30B-09 | complete counter version and deterministic diff |
| 30.10 | IA `Interactions` line 108; `AC-30.10` | BE30B-10 | attributed non-binding `DealExpression` |
| 30.11 | IA `Interactions` line 109; `AC-30.11` | BE30B-11 | version-hash `Approval` under side authority |
| 30.12 | IA `Interactions` line 110; `AC-30.12` | BE30B-12 | one `AcceptedDeal` from a sole live leaf |
| 30.13 | IA `Interactions` line 111; `AC-30.13` | BE30B-13 | challenge race resolves one terminal deal version |

### Canonical model and event coverage

| IA canonical identifier | Owned or consumed here | Trace |
|---|---|---|
| `OfferThread` | owned by BE30B-06/07/09/10/12/13 | IA `Data Models` line 185 |
| `OfferVersion` | owned by BE30B-06/07/09/11/12 | IA `Data Models` line 186 |
| `Approval` | owned by BE30B-11/12/13 | IA `Data Models` line 187 |
| `DealExpression` | owned by BE30B-10 and consumed by 07/09/12 | IA `Data Models` line 188 |
| `AcceptedDeal` | owned by BE30B-12/13 | IA `Data Models` line 189 |
| `booking.offer.version_sent` | emitted by BE30B-07/09 | IA `Event Schemas` line 324 |
| `booking.offer.approval_changed` | emitted by BE30B-11 | IA `Event Schemas` line 325 |
| `booking.deal.accepted` | emitted by BE30B-12/13 | IA `Event Schemas` line 326 |

### Feature Ledger Coverage

| Ledger feature | Disposition | Operation or owning companion |
|---|---|---|
| `17.02.01` Offer Sheet Composition | represented | BE30B-06/07 |
| `17.02.02` Counteroffer Thread & Version History | represented | BE30B-07/09 |
| `17.02.03` Offer Approval Chain & Entity Authority | represented | BE30B-11/12 |
| `17.02.04` Offer Expiry & Withdrawal | represented | BE30B-07/09/12 |
| `17.03.01` Deal Term Grammar & Deal Types | represented | BE30B-06/07/09/10 |
| `17.03.02` Breakeven & What-If Modelling | represented | BE30B-06/07 typed expression terms |
| `17.03.03` Multi-Show Deals & Cross-Collateralization | represented | BE30B-07/09 snapshot and expression references |
| `17.01.01`, `17.01.02`, `17.01.03`, `17.01.04`, `17.04`, `17.05.01`, `17.05.02`, `17.05.03`, `17.05.04`, `17.06`, `17.07`, `17.14` | deferred | 30a, 30c, 30d, or 30e |

## Endpoint Completeness Reconciliation

| IA interaction | HTTP operation | Request → typed success | Error / event |
|---|---|---|---|
| 30.06 | POST `/api/v1/booking/offer-threads` | `Compose` → `OfferThreadResult` (201) | `ApiError`; no event until send |
| 30.07 | POST `/api/v1/booking/offer-threads/{threadId}/versions` | `OfferAppend` → `OfferVersionResult` (201) | `ApiError`; `booking.offer.version_sent` |
| 30.08 | POST `/api/v1/booking/offer-links/{linkId}/receipts` | `LinkReceipt` → `OfferLinkReceiptResult` (201) | `ApiError`; receipt audit only |
| 30.09 | POST `/api/v1/booking/offer-threads/{threadId}/counters` | `OfferAppend` → `CounterOfferResult` (201) | `ApiError`; `booking.offer.version_sent` |
| 30.10 | POST `/api/v1/booking/offer-threads/{threadId}/verbal-expressions` | `VerbalExpression` → `VerbalExpressionResult` (201) | `ApiError`; no binding event |
| 30.11 | POST `/api/v1/booking/offers/{offerVersionId}/approvals` | `ApprovalRequest` → `ApprovalResult` (201) | `ApiError`; `booking.offer.approval_changed` |
| 30.12 | POST `/api/v1/booking/offers/{offerVersionId}/acceptances` | `Acceptance` → `AcceptedDealResult` (201) | `ApiError`; `booking.deal.accepted` |
| 30.13 | POST `/api/v1/booking/deals/{dealId}/challenge-confirmations` | `ChallengeConfirmation` → `ChallengeConfirmationResult` (200) | `ApiError`; `booking.deal.accepted` when terminal |

## API Endpoints

### Authoritative Route Registry

| ID | IA | Method | Path | Authorization | Idempotency/concurrency |
|---|---|---|---|---|---|
| BE30B-06 | 30.06 | POST | `/api/v1/booking/offer-threads` | buyer/artist booking mandate | key + position/source digest |
| BE30B-07 | 30.07 | POST | `/api/v1/booking/offer-threads/{threadId}/versions` | thread-side negotiator mandate | key + `If-Match`; immutable append |
| BE30B-08 | 30.08 | POST | `/api/v1/booking/offer-links/{linkId}/receipts` | signed external recipient token | key + token/delivery version |
| BE30B-09 | 30.09 | POST | `/api/v1/booking/offer-threads/{threadId}/counters` | opposite-side negotiator mandate | key + cited version |
| BE30B-10 | 30.10 | POST | `/api/v1/booking/offer-threads/{threadId}/verbal-expressions` | authorized participant/witness | key + event/source digest |
| BE30B-11 | 30.11 | POST | `/api/v1/booking/offers/{offerVersionId}/approvals` | required approval mandate, conflict-free | key + approval-policy version |
| BE30B-12 | 30.12 | POST | `/api/v1/booking/offers/{offerVersionId}/acceptances` | exact binding signatory mandate + step-up | key + offer/approval/mandate versions |
| BE30B-13 | 30.13 | POST | `/api/v1/booking/deals/{dealId}/challenge-confirmations` | binding parties under active position challenge | key + deal/challenge versions |

Rates: compose/send/counter 60/hour/thread; external receipts 30/min/link; verbal 20/hour/thread; approvals 60/hour/approver; acceptance/confirmation 10/hour/deal. Writes are private/no-store; p95 <700 ms and p99 <1.5 s. TLS, ULIDs, request ID, strict JSON, 128 KiB cap, exact-origin role-specific CORS, and authenticated context or signed one-time external token are mandatory. Preflight permits only route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`.

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:z.string().min(1),details:BE00ErrorDetails}).strict();
const TermScalar=z.union([z.string().trim().max(2000),z.number().finite(),z.boolean(),z.null()]);
const TermValue=z.union([TermScalar,z.array(TermScalar).max(50),z.record(z.string().regex(/^[A-Z0-9_]{1,80}$/),TermScalar).refine(v=>Object.keys(v).length<=50)]);
const Term=z.object({key:z.string().regex(/^[A-Z0-9_]{1,80}$/),value:TermValue,sourceRef:Id.optional()}).strict();
const Compose=z.object({positionId:Id,buyerPartyId:Id,artistPartyId:Id,eventDateRef:Id,terms:z.array(Term).min(1).max(200),approvalPolicyRef:Id,expiresAt:At}).strict();
const OfferAppend=z.object({expectedThreadVersion:Ver,citedOfferVersion:Ver.optional(),terms:z.array(Term).min(1).max(200),status:z.enum(['draft','sent','countered']),expiresAt:At,recipientIds:z.array(Id).min(1).max(30)}).strict();
const LinkReceipt=z.object({token:z.string().min(32).max(2048),action:z.enum(['opened','declined','forward_blocked']),recipientProofId:Id,observedAt:At}).strict();
const VerbalExpression=z.object({threadId:Id,citedOfferVersion:Ver,expression:z.enum(['interest','agreement_in_principle','decline']),speakerPartyId:Id,witnessPartyIds:z.array(Id).max(10),sourceEvidenceRefs:z.array(Id).min(1).max(20),observedAt:At}).strict();
const ApprovalRequest=z.object({offerVersionId:Id,approvalPolicyVersion:Ver,approverPartyId:Id,mandateRef:Id,outcome:z.enum(['approve','reject','revoke']),reason:z.string().trim().min(1).max(1000)}).strict();
const Acceptance=z.object({expectedOfferVersion:Ver,signatoryPartyId:Id,bindingMandateRef:Id,stepUpProofRef:Id,acceptedTermDigest:z.string().regex(/^[a-f0-9]{64}$/),acceptedAt:At}).strict();
const ChallengeConfirmation=z.object({expectedDealVersion:Ver,challengeId:Id,challengeVersion:Ver,outcome:z.enum(['confirm','release','supersede']),partyApprovalRefs:z.array(Id).min(1).max(10),reason:z.string().trim().min(1).max(1000)}).strict();
```

### Typed success and error schemas

Every operation has a declared Zod 4 success schema and the shared failure schema; no route returns an untyped JSON object. ErrorResponse is the BE00 global envelope ApiError { code, message, requestId, details }, with unknown keys rejected.

~~~ts
const OfferThreadResult=z.object({id:Id,version:Ver,state:z.enum(['draft','negotiating','approved','accepted','declined','expired','superseded']),positionId:Id,buyerPartyId:Id,artistPartyId:Id,expiresAt:At}).strict();
const OfferVersionResult=z.object({id:Id,threadId:Id,version:Ver,status:z.enum(['draft','sent','countered']),termDigest:z.string().regex(/^[a-f0-9]{64}$/),expiresAt:At,serverOrder:Ver}).strict();
const OfferLinkReceiptResult=z.object({id:Id,offerVersionId:Id,action:z.enum(['opened','declined','forward_blocked']),provenance:z.enum(['token_verified','token_rejected']),observedAt:At}).strict();
const CounterOfferResult=z.object({id:Id,threadId:Id,version:Ver,parentVersionIds:z.array(Ver).min(1).max(2),termDigest:z.string().regex(/^[a-f0-9]{64}$/),diff:z.array(z.object({key:z.string().min(1).max(80),before:TermValue,after:TermValue}).strict()).max(200)}).strict();
const VerbalExpressionResult=z.object({id:Id,threadId:Id,citedOfferVersion:Ver,expression:z.enum(['interest','agreement_in_principle','decline']),binding:z.literal(false),observedAt:At}).strict();
const ApprovalResult=z.object({id:Id,offerVersionId:Id,version:Ver,outcome:z.enum(['approve','reject','revoke']),approvalDigestState:z.enum(['incomplete','complete','revoked']),effectiveAt:At}).strict();
const AcceptedDealResult=z.object({id:Id,threadId:Id,acceptedOfferVersion:Ver,state:z.enum(['accepted','challenge_pending','confirmed','superseded','cancelled','postponed']),acceptedAt:At,termDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const ChallengeConfirmationResult=z.object({dealId:Id,version:Ver,state:z.enum(['challenge_pending','confirmed','superseded']),selectedPositionId:Id.nullable(),resolvedAt:At}).strict();
const ErrorResponse=ApiError;
~~~

| Operation | Request schema | Success schema | Status | Error response |
|---|---|---|---|---|
| BE30B-06 | Compose | OfferThreadResult | 201 | ErrorResponse |
| BE30B-07 | OfferAppend | OfferVersionResult | 201 | ErrorResponse |
| BE30B-08 | LinkReceipt | OfferLinkReceiptResult | 201 | ErrorResponse |
| BE30B-09 | OfferAppend | CounterOfferResult | 201 | ErrorResponse |
| BE30B-10 | VerbalExpression | VerbalExpressionResult | 201 | ErrorResponse |
| BE30B-11 | ApprovalRequest | ApprovalResult | 201 | ErrorResponse |
| BE30B-12 | Acceptance | AcceptedDealResult | 201 | ErrorResponse |
| BE30B-13 | ChallengeConfirmation | ChallengeConfirmationResult | 200 | ErrorResponse |

Unknown keys, stale position/event/offer/approval/mandate/challenge, incomplete required terms, invalid recipient, expired/replayed/forwarded token, verbal expression presented as binding, self/conflicted approval, missing quorum, changed term digest, unsafe text, and acceptance after expiry fail before mutation. Canonical term schemas validate money/currency, date/time, capacity, billing, cancellation, announcement, exclusivity, and rider references through their owning contracts.

## Persistence and RLS

```sql
create table offer_threads (
  id text primary key, tenant_id text not null, position_id text not null,
  buyer_party_id text not null, artist_party_id text not null, event_date_ref text not null,
  approval_policy_ref text not null, state text not null
    check(state in ('draft','negotiating','approved','accepted','declined','expired','superseded')),
  version bigint not null check(version>0), created_at timestamptz not null,
  check(buyer_party_id<>artist_party_id)
);
create table offer_versions (
  id text primary key, thread_id text not null references offer_threads(id),
  version bigint not null check(version>0), cited_offer_version bigint,
  term_json jsonb not null, term_digest text not null,
  status text not null check(status in ('draft','sent','countered')),
  author_party_id text not null, recipient_ids jsonb not null,
  expires_at timestamptz not null, created_at timestamptz not null,
  unique(thread_id,version), unique(thread_id,term_digest)
);
create table approvals (
  id text not null, version bigint not null check(version>0), offer_version_id text not null,
  approval_policy_version bigint not null, approver_party_id text not null,
  mandate_ref text not null, outcome text not null check(outcome in ('approve','reject','revoke')),
  reason_ciphertext bytea not null, effective_at timestamptz not null,
  primary key(id,version), unique(offer_version_id,approver_party_id,version)
);
create table deal_expressions (
  id text primary key, thread_id text not null, offer_version bigint not null,
  expression text not null check(expression in ('interest','agreement_in_principle','decline')),
  speaker_party_id text not null, witness_party_ids jsonb not null,
  source_evidence_refs jsonb not null, observed_at timestamptz not null,
  binding boolean not null default false check(binding=false),
  unique(thread_id,speaker_party_id,observed_at,expression)
);
create table accepted_deals (
  id text not null, version bigint not null check(version>0), thread_id text not null,
  accepted_offer_version bigint not null, accepted_term_digest text not null,
  signatory_party_id text not null, binding_mandate_ref text not null,
  approval_digest text not null, position_challenge_ref text,
  state text not null check(state in ('accepted','challenge_pending','confirmed','superseded','cancelled','postponed')),
  accepted_at timestamptz not null, created_at timestamptz not null,
  primary key(id,version), unique(thread_id,accepted_offer_version)
);
create table offer_link_receipts (
  id text primary key, offer_version_id text not null, recipient_id text not null,
  token_hash text not null unique, action text not null, observed_at timestamptz not null,
  created_at timestamptz not null, unique(offer_version_id,recipient_id,action)
);
```

Indexes cover thread party/state/position, offer current/status/expiry, approval offer/outcome, expression thread/time, accepted deal state, and link token/recipient. All tables force RLS. Authenticated clients use RPCs only; thread parties see versions allowed by their mandate, drafts stay author-side, external recipients see one minimized immutable version, approvers see required term projection, and signatory/step-up evidence is restricted. Token hashes, reasons, internal approvals, and competing recipient data are service/private. Direct update/delete is denied; expiry/delivery workers lease scoped rows.

### Constraint, index, RLS, and grant registry

The SQL registry below is authoritative for every persisted domain field; each field has SQL type, nullability, constraint, and either a local FK or an explicitly named opaque seam. Reads and writes use scoped RPCs only.

| Table | Typed fields and constraints | FK or opaque target | Query indexes | RLS and grants |
|---|---|---|---|---|
| offer_threads | id text NOT NULL PK; tenant_id text NOT NULL; position_id text NOT NULL; buyer_party_id text NOT NULL CHECK buyer_party_id<>artist_party_id; artist_party_id text NOT NULL; event_date_ref text NOT NULL; approval_policy_ref text NOT NULL; state text NOT NULL CHECK closed lifecycle; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL | position_id/event_date_ref/approval_policy_ref opaque refs to Shard 29/01/30 authority; party IDs opaque Identity seam | UNIQUE(tenant_id,id); (tenant_id,position_id,state); (tenant_id,buyer_party_id,artist_party_id) | RLS tenant and mandate policy; service role plus scoped RPC; no direct client grants |
| offer_versions | id text NOT NULL PK; thread_id text NOT NULL; version bigint NOT NULL CHECK >0; cited_offer_version bigint NULL CHECK >0; term_json jsonb NOT NULL; term_digest text NOT NULL CHECK 64 lowercase hex; status text NOT NULL CHECK draft/sent/countered; author_party_id text NOT NULL; recipient_ids jsonb NOT NULL; expires_at timestamptz NOT NULL; created_at timestamptz NOT NULL; UNIQUE(thread_id,version); UNIQUE(thread_id,term_digest) | thread_id FK offer_threads.id; author_party_id/recipient IDs and cited source are opaque Identity/mandate refs | (thread_id,version DESC); (thread_id,status,expires_at); (term_digest) | RLS thread-side mandate projection; service writer/RPC only; no direct update/delete |
| approvals | id text NOT NULL; version bigint NOT NULL CHECK >0; offer_version_id text NOT NULL; approval_policy_version bigint NOT NULL CHECK >0; approver_party_id text NOT NULL; mandate_ref text NOT NULL; outcome text NOT NULL CHECK approve/reject/revoke; reason_ciphertext bytea NOT NULL; effective_at timestamptz NOT NULL; PK(id,version); UNIQUE(offer_version_id,approver_party_id,version) | offer_version_id FK offer_versions.id; approver_party_id/mandate_ref opaque Identity/authority refs | (offer_version_id,approver_party_id,version DESC); (offer_version_id,outcome,effective_at) | RLS approver/party policy; ciphertext never client-readable; service writer/RPC only |
| deal_expressions | id text NOT NULL PK; thread_id text NOT NULL; offer_version bigint NOT NULL CHECK >0; expression text NOT NULL CHECK closed expression; speaker_party_id text NOT NULL; witness_party_ids jsonb NOT NULL; source_evidence_refs jsonb NOT NULL; observed_at timestamptz NOT NULL; binding boolean NOT NULL DEFAULT false CHECK binding=false; UNIQUE(thread_id,speaker_party_id,observed_at,expression) | thread_id FK offer_threads.id; offer_version is version value; party/evidence refs opaque Identity/Evidence seams | (thread_id,observed_at DESC); (thread_id,offer_version); (speaker_party_id,observed_at DESC) | RLS thread participant projection; evidence refs redacted by purpose; service writer/RPC only |
| accepted_deals | id text NOT NULL; version bigint NOT NULL CHECK >0; thread_id text NOT NULL; accepted_offer_version bigint NOT NULL CHECK >0; accepted_term_digest text NOT NULL CHECK 64 lowercase hex; signatory_party_id text NOT NULL; binding_mandate_ref text NOT NULL; approval_digest text NOT NULL; position_challenge_ref text NULL; state text NOT NULL CHECK accepted/challenge_pending/confirmed/superseded/cancelled/postponed; accepted_at timestamptz NOT NULL; created_at timestamptz NOT NULL; PK(id,version); UNIQUE(thread_id,accepted_offer_version) | thread_id FK offer_threads.id; accepted offer/position challenge/mandate are local version or opaque authority refs | (thread_id,version DESC); (state,accepted_at); (accepted_term_digest) | RLS binding parties and downstream scoped projections; no raw mandate/evidence; service writer/RPC only |
| offer_link_receipts | id text NOT NULL PK; offer_version_id text NOT NULL; recipient_id text NOT NULL; token_hash text NOT NULL UNIQUE; action text NOT NULL CHECK opened/declined/forward_blocked; observed_at timestamptz NOT NULL; created_at timestamptz NOT NULL; UNIQUE(offer_version_id,recipient_id,action) | offer_version_id FK offer_versions.id; recipient_id opaque Identity seam; token plaintext never stored | (offer_version_id,recipient_id); (token_hash); (observed_at DESC) | RLS exposes only minimized recipient/version projection; token hash service-only; no direct client grants |

All six tables force RLS; tenant and aggregate predicates are mandatory. Grants are SELECT only through role-scoped RPCs, INSERT through transaction procedures, and never UPDATE/DELETE for immutable versions, approvals, expressions, receipts, or accepted-deal history. Foreign keys reject orphan local records; opaque seams fail closed when the producer cannot resolve the pinned version.

## Transactions and Lifecycle

30.06 creates thread and draft offer snapshot atomically after pinning position/event/mandates. 30.07/30.09 lock thread, validate full terms (counter is a complete new version), append `OfferVersion`, delivery jobs, audit/outbox, and increment thread. 30.08 constant-time verifies recipient token and stores receipt; opening never changes offer/deal state. 30.10 appends non-binding `DealExpression`.

30.11 locks offer/policy/approver and appends approval; required approval digest becomes complete only when all current distinct approvals match the exact term digest. Revoke invalidates the digest before acceptance. 30.12 locks thread/offer/position/approvals/mandate, verifies expiry and exact digest, inserts one `AcceptedDeal`, freezes cited commercial position, and commits audit/outbox. No partial acceptance. 30.13 locks accepted deal/challenge and all approvals, then confirms/releases/supersedes by an appended deal version.

Idempotency binds tenant, actor/recipient, route, aggregate, and body hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; replay returns stored result. Locks order thread -> offer -> position -> approvals -> deal/challenge.

### Explicit state machine and blocked behavior

| Aggregate | States | Allowed transitions and trigger | Blocked behavior |
|---|---|---|---|
| OfferThread | draft, negotiating, approved, accepted, declined, expired, superseded | draft→negotiating on first sent version; negotiating→approved when required approvals complete; approved→accepted only BE30B-12; terminal states append only | stale thread version, non-sole leaf, or expired offer leaves state unchanged and returns VERSION_CONFLICT or OFFER_EXPIRED |
| OfferVersion | draft, sent, countered, withdrawn, expired, accepted | draft→sent after complete-term lint; sent→countered/withdrawn/expired/accepted by named operation; immutable after insert | If-Match/body digest mismatch rejects before insert; expired or non-live version cannot be accepted |
| Approval | pending, approved, rejected, revoked | pending→approved/rejected by BE30B-11; approved→revoked on authority loss or explicit revoke; digest recomputes under lock | self-dealing, stale policy, missing quorum, or changed term digest keeps pending/revoked and emits no acceptance |
| DealExpression | unconfirmed, confirmed, superseded | unconfirmed→confirmed only counterparty evidence operation; confirmed→superseded on newer complete version | verbal expression is permanently non-binding; it cannot advance Approval or AcceptedDeal |
| AcceptedDeal | accepted, challenge_pending, confirmed, superseded, cancelled, postponed | accepted→challenge_pending on active challenge; challenge_pending→confirmed or superseded by BE30B-13; terminal changes append version | challenge race, missing artist approval, or lock conflict preserves prior state and retries with same idempotency key |
| OfferLinkReceipt | opened, declined, forward_blocked | token verification appends one receipt; action is immutable and never changes offer/deal state | expired/replayed/forwarded token returns typed error; no recipient or acceptance authority is inferred |

## Events and External Boundaries

| Event | Trigger and payload |
|---|---|
| `booking.offer.version_sent` | sent/counter version commit: `{threadId,threadVersion,offerVersion,termDigest,recipientRefs,expiresAt,occurredAt}` |
| `booking.offer.approval_changed` | approval transition: `{threadId,offerVersion,approvalId,version,outcome,approvalDigestState,occurredAt}` |
| `booking.deal.accepted` | accepted/confirmed deal commit: `{dealId,version,threadId,offerVersion,termDigest,state,challengeRef,occurredAt}` |

Transactional outbox, per-thread/deal order, at-least-once, event-ID dedupe, retry/dead-letter. Events omit terms, amounts, parties for general consumers, mandates, approvals, reasons, tokens, and evidence.

Document delivery uses a 3 s total timeout, retries at 1/5/30 s, and a circuit opened after 5 failures in 1 min for 2 min; source offer remains sent with explicit delivery status. Identity/mandate/position/event/policy sources use a 2 s total timeout, retries at 100/500 ms, and a circuit opened after 5 failures in 30 s for 60 s; uncertainty fails closed. External links expire, bind recipient/version, and cannot be forwarded; delivery outage never implies receipt/acceptance.

## External Seam Contract Registry

Every cross-service call has a typed request and response, bounded timeout, finite retry/backoff, circuit rule, and deterministic recovery. A timeout or open circuit never creates an offer, approval, acceptance, receipt authority, or binding inference.

| Seam | Exact request → response | Timeout | Retries and backoff | Circuit breaker | Recovery |
|---|---|---|---|---|---|
| Identity and mandate authority | {tenantId, partyId, mandateRef, requiredScope, expectedVersion} → {authorized, mandateVersion, reasonCode} | 2000 ms total | 2 retries at 100 ms and 500 ms | open after 5 failures in 30 s; hold 60 s | fail closed with 503 DEPENDENCY_UNAVAILABLE; retry same idempotency key |
| Shard 29 room/slot and commercial-position source | {slotRef, positionRef, expectedVersion, tenantId} → {exists, state, sourceVersion, freshnessAt} | 2000 ms total | 2 retries at 100 ms and 500 ms | open after 5 failures in 30 s; hold 60 s | no mutation; return 409 VERSION_CONFLICT or 503 when source is uncertain |
| External document/link delivery | {offerVersionId, recipientRef, deliveryVersion, purpose, requestId} → {deliveryReceiptRef, status, observedAt} | 3000 ms total | 3 retries at 1 s, 5 s, and 30 s | open after 5 failures in 60 s; hold 120 s | keep version sent, mark delivery pending, enqueue durable retry; receipt/acceptance remains false |
| Audit/event outbox | {eventId, eventType, aggregateRef, aggregateVersion, payloadHash, occurredAt} → {accepted, sequence, dedupe} | 1000 ms per write | 3 retries at 100 ms, 500 ms, and 2000 ms | open after 5 failures in 60 s; hold 120 s | transaction rolls back before domain commit; replay outbox after recovery |

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/external-token -> tenant/context -> rate -> strict Zod/term schemas -> thread/party RLS -> mandate/approval/conflict -> step-up for accept -> idempotency/If-Match -> transaction -> response projection -> audit. Every failure is `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed/incomplete terms/action |
| 401 `UNAUTHENTICATED` | session/token invalid |
| 403 `FORBIDDEN` | party/recipient/approver/signatory mandate absent |
| 404 `NOT_FOUND` | absent/concealed thread/offer/deal |
| 409 `VERSION_CONFLICT` | stale aggregate/source |
| 409 `APPROVAL_INCOMPLETE_OR_REVOKED` | quorum/digest invalid |
| 409 `POSITION_CHALLENGE_PENDING` | acceptance requires explicit challenge state |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `OFFER_OR_LINK_EXPIRED` | deadline passed |
| 422 `TERM_OR_MANDATE_INVALID` | owner schema/authority failed |
| 422 `DIGEST_MISMATCH` | accepted terms differ |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no approval/acceptance inferred |

### Per-operation Error, Security, and Limits Matrix

All rows cite BE00 Error Handling / Error Architecture: ApiError { code, message, requestId, details }. Messages are stable, details contain only safe field names and opaque references.

| Operation | Success status/app code/message/retry | Error status/app code/message/retry | Ownership and 403/404 rule |
|---|---|---|---|
| BE30B-06 | 201 OFFER_THREAD_CREATED “offer draft created”; no retry after commit, replay returns stored result | 400 VALIDATION_FAILED “offer terms are invalid”; no retry; 409 IDEMPOTENCY_CONFLICT “idempotency key body differs”; no retry; 503 DEPENDENCY_UNAVAILABLE “position source unavailable”; retry after Retry-After | buyer/artist mandate owns thread; missing mandate is 403 FORBIDDEN, concealed position/thread is 404 NOT_FOUND |
| BE30B-07 | 201 OFFER_VERSION_SENT “offer version sent”; no retry after commit, replay returns stored result | 400 VALIDATION_FAILED “complete offer required”; no retry; 409 VERSION_CONFLICT “thread version is stale”; refresh then retry; 410 OFFER_OR_LINK_EXPIRED “offer expired”; no retry | thread-side negotiator only; absent mandate is 403, concealed thread is 404 |
| BE30B-08 | 201 OFFER_RECEIPT_RECORDED “recipient receipt recorded”; replay returns stored result | 401 UNAUTHENTICATED “link token invalid”; no retry; 410 OFFER_OR_LINK_EXPIRED “link expired”; no retry; 429 RATE_LIMITED “receipt rate exceeded”; retry after Retry-After | signed recipient token scopes access; invalid token is 404 NOT_FOUND when resource concealment applies, non-recipient authenticated actor is 403 |
| BE30B-09 | 201 COUNTER_VERSION_CREATED “counter version created”; no retry after commit, replay returns stored result | 400 VALIDATION_FAILED “complete counter required”; no retry; 409 VERSION_CONFLICT “live leaf changed”; refresh then retry; 409 IDEMPOTENCY_CONFLICT “idempotency key body differs”; no retry | opposite-side negotiator mandate; no mandate is 403, concealed thread is 404 |
| BE30B-10 | 201 VERBAL_EXPRESSION_RECORDED “non-binding expression recorded”; no retry after commit, replay returns stored result | 400 VALIDATION_FAILED “expression evidence is invalid”; no retry; 403 FORBIDDEN “witness scope is absent”; no retry; 409 VERSION_CONFLICT “cited version is stale”; refresh then retry | participant/witness mandate required; absent scope is 403, concealed thread is 404 |
| BE30B-11 | 201 APPROVAL_RECORDED “approval decision recorded”; no retry after commit, replay returns stored result | 400 VALIDATION_FAILED “approval input is invalid”; no retry; 403 FORBIDDEN “approval mandate is absent”; no retry; 409 APPROVAL_INCOMPLETE_OR_REVOKED “approval digest is incomplete or revoked”; no retry | side-specific approver ownership; concealed offer is 404, known offer without mandate is 403 |
| BE30B-12 | 201 DEAL_ACCEPTED “accepted deal created”; no retry after commit, replay returns stored result | 409 APPROVAL_INCOMPLETE_OR_REVOKED “required approvals are not current”; no retry; 409 POSITION_CHALLENGE_PENDING “challenge is unresolved”; refresh then retry; 422 DIGEST_MISMATCH “accepted terms differ”; no retry | exact binding signatory plus step-up; concealed offer is 404, known offer without authority is 403 |
| BE30B-13 | 200 CHALLENGE_CONFIRMED “challenge result recorded”; replay returns stored result | 403 FORBIDDEN “party is not bound to deal”; no retry; 404 NOT_FOUND “deal is concealed or absent”; no retry; 409 VERSION_CONFLICT “challenge version is stale”; refresh then retry | accepted-deal party and active challenge scope; 403 after resource visibility, 404 for concealed deal |

### Per-operation middleware and output filtering

| Operation | Auth and ownership | Numeric rate limit | Validation locus | CORS policy | Output allowlist |
|---|---|---|---|---|---|
| BE30B-06 | session + buyer/artist booking mandate; absent mandate 403, concealed position 404 | 60/hour/thread | route Zod Compose then owner term registry before transaction | BE00-CORS-WEB-CREDENTIALLED exact origin | thread id/version/state/party-safe refs/expiry; no private terms for other side |
| BE30B-07 | session + thread-side negotiator mandate; absent mandate 403, concealed thread 404 | 60/hour/thread | Zod OfferAppend plus complete-term/lint validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | version id/status/digest prefix/expiry; no private draft or competing recipients |
| BE30B-08 | signed one-time external recipient token; invalid token 404, known non-recipient 403 | 30/min/link | Zod LinkReceipt and constant-time token hash check before read/write | BE00-CORS-WEB-PUBLIC-SIGNED-LINK exact origin | receipt id/action/provenance/observedAt; no token or full terms |
| BE30B-09 | session + opposite-side negotiator mandate; absent mandate 403, concealed thread 404 | 60/hour/thread | Zod OfferAppend plus cited-leaf and deterministic-diff validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | child version/diff allowlist/digest/expiry; no hidden ladder or private terms |
| BE30B-10 | session + participant/witness role; absent role 403, concealed thread 404 | 20/hour/thread | Zod VerbalExpression plus evidence and binding=false invariant before insert | BE00-CORS-WEB-CREDENTIALLED exact origin | expression id/type/cited version/binding=false; no raw evidence/transcript beyond scope |
| BE30B-11 | session + current side approval mandate and conflict check; absent mandate 403, concealed offer 404 | 60/hour/approver | Zod ApprovalRequest plus policy/quorum/self-dealing validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | approval id/outcome/digest state/effectiveAt; no reason ciphertext or other approvals |
| BE30B-12 | session + exact signatory mandate + step-up; absent authority 403, concealed offer 404 | 10/hour/deal | Zod Acceptance plus sole-leaf/digest/expiry validator before serializable lock | BE00-CORS-WEB-CREDENTIALLED exact origin | deal id/version/state/term digest/acceptedAt; no raw mandate or private approvals |
| BE30B-13 | session + bound party active-challenge mandate; absent mandate 403, concealed deal 404 | 10/hour/deal | Zod ChallengeConfirmation plus challenge/approval/version validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | deal/version/state/selected position; no losing-party identity or private evidence |

### Pagination and bounded command responses

These are command endpoints, not collection reads. Each response is bounded and uses no page cursor; list-like inputs have explicit caps in the request schemas.

| Operation | Pagination / limit rule |
|---|---|
| BE30B-06 | N/A single draft command; terms max 200 and response has one thread |
| BE30B-07 | N/A single immutable version command; terms max 200 and recipients max 30 |
| BE30B-08 | N/A single receipt command; token max 2048 and one receipt response |
| BE30B-09 | N/A single counter command; terms max 200 and recipients max 30 |
| BE30B-10 | N/A single expression command; witnesses max 10 and evidence refs max 20 |
| BE30B-11 | N/A single approval command; reason max 1000 and one approval response |
| BE30B-12 | N/A single acceptance command; one signatory and one accepted deal response |
| BE30B-13 | N/A single challenge command; party approval refs max 10 and one result response |

Logs contain opaque request/thread/offer/approval/deal/role IDs, versions/digest prefixes/state/code, latency, delivery attempt, and outbox age; exclude terms, money, parties, mandates, reasons, tokens, and evidence. Metrics cover offer/counter/delivery, link receipt, verbal expressions, approval quorum/revocation, acceptance/challenge, expiry, latency/errors/circuits/outbox. Availability 99.9%; p99 write <1.5 s; delivery status <5 min p99 when healthy. Page on duplicate accepted deal, acceptance with invalid approval digest, or five-minute 5xx >2%.

Tests cover schemas/complete-term/digest/expiry properties, every role/tenant/mandate/conflict/revocation, RLS/field projection, concurrent counters/approvals/revocations/acceptances/challenge confirmations, verbal non-binding invariant, external token expiry/replay/forwarding, idempotency races, delivery/source retry/circuit/recovery, event privacy/order/dedupe, log redaction, migrations/index plans, CORS, and alerts. CI fails on uncovered 30.06–30.13, missing five canonical models/three events, route collision, unstated acceptance, mutated offer, direct write grant, malformed table/link, or unresolved question.

### Per-operation observability registry

| Operation ID | Structured logs and trace | Metrics and SLO | Audit, outbox, and alert |
|---|---|---|---|
| BE30B-06 | request/trace ID, opaque thread/position IDs, source digest, state, latency; no terms | thread-create/conflict/5xx rate, p95 <700 ms | thread audit and idempotency receipt; page on unbound thread |
| BE30B-07 | opaque thread/version IDs, digest prefix, expiry, delivery attempt, latency; no draft terms | version-send/delivery latency, p95 <700 ms | immutable version audit and delivery outbox; page on digest drift |
| BE30B-08 | opaque link/receipt IDs, token hash prefix, observed action, latency; no token | receipt replay/expiry/429 rate, p95 <700 ms | receipt audit only; page on repeated invalid-link burst |
| BE30B-09 | opaque thread/leaf IDs, cited version, diff class, state, latency; no private terms | counter/conflict rate, p95 <700 ms | immutable child-version audit/outbox; page on forked live leaf |
| BE30B-10 | opaque expression/thread IDs, witness role, binding flag, latency; no evidence | expression/invalid-scope rate, p95 <700 ms | non-binding expression audit; page on binding=true attempt |
| BE30B-11 | opaque offer/approval IDs, side, digest state, effective time, latency; no reason | approval/quorum/revocation rate, p95 <700 ms | approval audit/outbox; page on self-approval or stale digest |
| BE30B-12 | opaque offer/deal IDs, digest prefix, state, latency; no mandate or terms | acceptance/blocked/conflict rate, p95 <1.5 s | accepted-deal audit/outbox; page on duplicate accepted deal |
| BE30B-13 | opaque deal/challenge IDs, version, outcome, latency; no evidence | challenge confirmation/conflict rate, p95 <1.5 s | terminal deal audit/outbox; page on competing terminal outcome |

### Per-operation contract tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE30B-T06 | BE30B-06 | strict Compose terms, mandate/position pinning, idempotency replay, ApiError, and output allowlist tests pass |
| BE30B-T07 | BE30B-07 | immutable version/digest, expiry, counterparty auth, delivery outbox, ApiError, and CORS tests pass |
| BE30B-T08 | BE30B-08 | one-time token hash, receipt replay/expiry, 403/404 concealment, ApiError, and public CORS tests pass |
| BE30B-T09 | BE30B-09 | cited-leaf CAS, deterministic counter diff, idempotency race, ApiError, and private-term filtering tests pass |
| BE30B-T10 | BE30B-10 | non-binding expression invariant, witness role, evidence cap, ApiError, audit privacy, and CORS tests pass |
| BE30B-T11 | BE30B-11 | approval quorum/self-dealing, digest revocation, version race, ApiError, and output filtering tests pass |
| BE30B-T12 | BE30B-12 | sole-leaf acceptance, step-up, approval digest, duplicate race, ApiError, and accepted-deal tests pass |
| BE30B-T13 | BE30B-13 | active challenge confirmation, terminal CAS, party auth, ApiError, event dedupe, and CORS tests pass |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| 1 cross-operation consistency | Can a counter, approval, link receipt, or acceptance escape the immutable offer thread? | BE30B-06 through BE30B-13 pin thread/version/digest and bind every child to one live leaf; accepted terms cannot be reconstructed from stale input. |
| 2 sequencing and concurrency | What wins when counterparties counter, approve, revoke, or accept at the same time? | Serializable aggregate lock, expected version, approval digest, and unique accepted-deal invariant elect one winner; losers receive VERSION_CONFLICT or APPROVAL_INCOMPLETE_OR_REVOKED. |
| 3 failure cascade | What happens when identity, delivery, source, or receipt verification fails? | No binding state commits before the dependency gate; rollback leaves the outbox absent, while retryable delivery is queued with bounded attempts and circuit recovery. |
| 4 authorization completeness | Are recipient, negotiator, approver, witness, and signatory boundaries explicit? | Each route has an auth/ownership row; visible resources without mandate return 403 and concealed thread/deal resources return 404, including signed-link forwarding cases. |
| 5 observability completeness | Can acceptance be audited without leaking private terms or evidence? | Opaque IDs, versions, digest prefixes, state, latency, delivery attempt, audit, outbox, and redaction/metric rules are defined; raw terms, tokens, and evidence never enter logs. |
| 6 abuse and limit edges | Can link replay, counter spam, mass assignment, or duplicate acceptance amplify effects? | Per-thread/deal/link numeric limits, strict schemas, one-time token hashes, idempotency body binding, immutable versions, and Retry-After responses cover every route. |
| 7 partial-state hygiene | Can a failed acceptance leave approvals, challenges, or notifications inconsistent? | Approval/acceptance/outbox/audit commit atomically; external delivery is retryable and idempotent, and stale or expired commands remain non-binding until a fresh version succeeds. |

## Open Questions

None.

## Ambiguity Gate

- Interactions 30.06–30.13, all five canonical models, and three events are fully specified.
- Complete versions, external receipt, non-binding verbal expression, approvals, binding acceptance, challenge confirmation, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Dependency References

- [IA Shard 30](../ia/30-booking-contracts.md)
- Shards 01/11/14/29/30a identity, finance, engagement, venue/event, and position contracts.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-28 | Completed BE30B contracts, route matrices, typed persistence, state/recovery, seam, security, deepening, and ambiguity gates. |
