# AI Training Consent, Corpus & Compensation — Backend Specification

**Status:** Complete
**IA source:** [Shard 21](../ia/21-specialized-licensing.md)
**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 21c: share-level AI-training consent, corpus assembly/shipping, withdrawal, shipped-model use register, manifest-rule compensation accrual |
| Included interactions | SPL-11 through SPL-14 |
| Included feature | 11.07 AI Training Licensing |
| Canonical contracts | `SetAITrainingConsent`, `ShipCorpus`, `AllocateTrainingProceeds` |
| Canonical models | `ai_training_consent`, `corpus_manifest`, `corpus_manifest_item`, `shipped_model_use`, `training_compensation_allocation` |
| Boundary | Silence/refailure/transfer defaults to refusal; Shard 20 owns clearance instruments; shipped manifests/model uses are immutable; allocation asserts no model influence and payout stays B3-disabled. |

## Referenced Material Inventory

| Material | Trace | Use |
|---|---|---|
| Shard 21 AI decisions | `../ia/21-specialized-licensing.md`, Overview/Specialized Decisions, lines 7–35 | Share opt-in, immutable shipped truth, exact non-forfeiting allocation, provider boundary |
| Feature/acceptance | same file, Features/Acceptance Criteria, lines 37–62 | Feature 11.07 and AC-SPL-11–AC-SPL-14 |
| Interactions/rules | same file, Interactions/Global Interaction Rules, lines 64–90 | SPL-11–SPL-14, transfer reset, freeze/withdrawal race, B3 behavior |
| Contracts/models | same file, Contracts/Data Models, lines 92–161 | `AIConsentState`, `CorpusState`, exact names/invariants |
| Access/events | same file, Access Control/Event Schemas, lines 163–208 | Owner/buyer/service boundaries and three safe event types |
| Licensing core | `../ia/20-licensing-core.md`, lines 97–183 | Policy/consent gate, instruments, scope, issued clearance |
| BE00 | `00-infrastructure.md`, lines 67–501 | API/Zod/database/middleware/idempotency/event/error/testing inheritance |
| Architecture/standards | `../2026-08-02-architecture-design.md`, lines 359–999; `../ENGINEERING-STANDARDS.md`, lines 96–166 | Security, privacy, PostgreSQL, observability, SLOs |

## IA Source Map

| Interaction | Backend responsibility | Canonical artifacts |
|---|---|---|
| SPL-11 | Verify current exact share owner and append explicit refused/opted-in decision for exact work/data-use/corpus purpose | `SetAITrainingConsent`; `ai_training_consent` |
| SPL-12 | Freeze proposed items, verify current full clearance/current opt-in and pre-notice for every item, then atomically mark immutable shipped manifest | `ShipCorpus`; `corpus_manifest`; `corpus_manifest_item`; `shipped_model_use` |
| SPL-13 | Append withdrawn consent after irreversible-use disclosure; exclude unshipped items while preserving shipped manifest/model-use history | `SetAITrainingConsent`; `ai_training_consent`; `shipped_model_use` |
| SPL-14 | Apply disclosed manifest rule to recorded proceeds, retain exact small entitlements, accrue while B3 payout is disabled, assert no influence | `AllocateTrainingProceeds`; `training_compensation_allocation` |

### Canonical identifier registry

- Contracts: `SetAITrainingConsent`, `ShipCorpus`, `AllocateTrainingProceeds`.
- Models: `ai_training_consent`, `corpus_manifest`, `corpus_manifest_item`, `shipped_model_use`, `training_compensation_allocation`.
- Events: `licensing.ai-consent.changed.v1`, `licensing.corpus.changed.v1`, `licensing.training-allocation.changed.v1`.
- `AIConsentState`: `refused`, `opted_in`, `withdrawn`, `superseded`; `CorpusState`: `draft`, `clearance_blocked`, `ready`, `shipped`, `withdrawn_pre_ship`.

## Endpoint Completeness Reconciliation

Four source interactions map one-to-one to four command operations. Corpus/item projections are returned only to authorized owners/buyers through results or safe query services owned elsewhere; no raw-refusal or generic CRUD endpoint is added. BE00 owns shared infrastructure, Shard 20 owns instruments, the rights registry owns share transfers, and finance owns recorded deal proceeds/payout execution.

## Shared Contract Inheritance

BE00 supplies base path, request ID, auth, CORS/CSRF, strict body limits, `If-Match`, rate headers, canonical idempotency, transactions/outbox, event envelope, error validation, logging and provider-native diagnostics redaction. Every failure uses `ApiError { code, message, requestId, details }`; details exclude raw refusals, buyer dataset contents, media, owner contact data, exact compensation, model-influence claims, tokens, and delivery evidence. Same key/hash replays; a changed hash returns `409 IDEMPOTENCY_KEY_REUSED`.

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| SPL-11 | POST /api/v1/licensing/ai-consents | Verified current share owner | first-party-write | Strict decision + exact scope + conditional `If-Match` | 20/min/share | Required 30d | 201 |
| SPL-12 | POST /api/v1/licensing/corpus-shipments | Authorized dataset buyer with recent step-up | first-party-write | Strict frozen manifest + owner notices + `If-Match` | 4/hour/corpus | Required 90d | 201/409 blocked |
| SPL-13 | POST /api/v1/licensing/ai-consent-withdrawals | Verified current share owner | first-party-write | Exact share/version + disclosure acknowledgment | 12/hour/share | Required 30d | 201 |
| SPL-14 | POST /api/v1/licensing/training-allocations | Exact corpus allocation service job | service-no-origin | Strict manifest/rule/proceeds/job assertion | 4/hour/manifest | Required 365d | 201 |

Browser CORS is credentialed exact-origin with POST, Content-Type, X-CSRF-Token, Idempotency-Key, If-Match. SPL-14 rejects any Origin and requires a single scoped service assertion. BE00 owns OPTIONS.

### Operation Contract Matrix

| Op | Request schema | Success schema | Error schema |
|---|---|---|---|
| SPL-11 | `SetAITrainingConsentRequest` | `SetAITrainingConsentResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-12 | `ShipCorpusRequest` | `ShipCorpusResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-13 | `WithdrawAITrainingConsentRequest` | `WithdrawAITrainingConsentResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-14 | `AllocateTrainingProceedsRequest` | `AllocateTrainingProceedsResult` | BE00 `ApiError { code, message, requestId, details }` |

## Request and Success Contracts — Zod 4

~~~ts
import { z } from "zod";
const Uuid=z.uuid(), Instant=z.iso.datetime({offset:true}), Version=z.int().positive(), Sha256=z.string().regex(/^[a-f0-9]{64}$/), Currency=z.string().regex(/^[A-Z]{3}$/), Money=z.int().nonnegative();
const AIConsentState=z.enum(["refused","opted_in","withdrawn","superseded"]);
const CorpusState=z.enum(["draft","clearance_blocked","ready","shipped","withdrawn_pre_ship"]);
const DataUse=z.enum(["training","fine_tuning","evaluation","embedding_index"]);
const CorpusPurpose=z.string().min(3).max(120);

export const SetAITrainingConsentRequest=z.object({workId:Uuid,shareId:Uuid,ownerPartyId:Uuid,dataUse:DataUse,corpusPurpose:CorpusPurpose,decision:z.enum(["refused","opted_in"]),policyVersion:z.string().min(1).max(80),consentGateDigest:Sha256,expectedConsentVersion:Version.nullable(),effectiveAt:Instant}).strict();
export const AITrainingConsentSchema=z.object({consentId:Uuid,workId:Uuid,shareId:Uuid,ownerPartyId:Uuid,dataUse:DataUse,corpusPurpose:CorpusPurpose,state:AIConsentState,policyVersion:z.string().min(1).max(80),supersedesConsentId:Uuid.nullable(),effectiveAt:Instant,version:Version,createdAt:Instant}).strict();
export const SetAITrainingConsentResult=z.object({consent:AITrainingConsentSchema,defaultBeforeDecision:z.literal("refused"),replayed:z.boolean()}).strict();

const ProposedItem=z.object({itemId:Uuid,workId:Uuid,shareId:Uuid,datasetObjectRef:Uuid,instrumentId:Uuid,instrumentVersion:Version,consentId:Uuid,consentVersion:Version,clearanceDigest:Sha256,ownerNoticeReceiptRef:Uuid,entitledPartyId:Uuid,allocationWeight:z.string().regex(/^\d+(\.\d{1,12})?$/)}).strict();
export const ShipCorpusRequest=z.object({corpusId:Uuid,datasetId:Uuid,dealId:Uuid,manifestVersion:Version,expectedCorpusVersion:Version,allocationRuleVersion:z.string().min(1).max(80),allocationRuleDigest:Sha256,items:z.array(ProposedItem).min(1).max(100_000),freezeAt:Instant,ownerNoticeCutoffAt:Instant,deliveryTargetRef:Uuid}).strict().superRefine((v,ctx)=>{if(v.ownerNoticeCutoffAt>v.freezeAt)ctx.addIssue({code:"custom",path:["ownerNoticeCutoffAt"],message:"notice_before_freeze"});const ids=v.items.map(x=>x.itemId);if(new Set(ids).size!==ids.length)ctx.addIssue({code:"custom",path:["items"],message:"item_ids_unique"});});
export const ShipCorpusResult=z.discriminatedUnion("outcome",[
 z.object({outcome:z.literal("shipped"),corpusId:Uuid,manifestId:Uuid,state:z.literal("shipped"),itemCount:z.int().positive(),manifestDigest:Sha256,deliveryReceiptRef:Uuid,immutable:z.literal(true),version:Version,replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("blocked"),corpusId:Uuid,state:z.literal("clearance_blocked"),excludedItemCount:z.int().positive(),reasonCounts:z.object({missingOptIn:z.int().nonnegative(),incompleteClearance:z.int().nonnegative(),withdrawalRace:z.int().nonnegative(),missingNotice:z.int().nonnegative()}).strict(),shipped:z.literal(false),version:Version,replayed:z.boolean()}).strict()
]);

export const WithdrawAITrainingConsentRequest=z.object({consentId:Uuid,shareId:Uuid,ownerPartyId:Uuid,expectedConsentVersion:Version,acknowledgeShippedUseIrreversible:z.literal(true),disclosureVersion:z.string().min(1).max(80),effectiveAt:Instant}).strict();
export const WithdrawAITrainingConsentResult=z.object({consent:AITrainingConsentSchema.refine(v=>v.state==="withdrawn",{message:"withdrawal_result_state"}),excludedUnshippedItemCount:z.int().nonnegative(),shippedManifestCountPreserved:z.int().nonnegative(),shippedModelUseCountPreserved:z.int().nonnegative(),replayed:z.boolean()}).strict();

const AllocationItem=z.object({manifestItemId:Uuid,entitledPartyId:Uuid,weight:z.string().regex(/^\d+(\.\d{1,12})?$/),entitlementMinor:Money}).strict();
export const AllocateTrainingProceedsRequest=z.object({jobId:Uuid,dealId:Uuid,manifestId:Uuid,manifestVersion:Version,allocationRuleVersion:z.string().min(1).max(80),allocationRuleDigest:Sha256,proceedsMinor:Money,currency:Currency,items:z.array(AllocationItem).min(1).max(100_000)}).strict().superRefine((v,ctx)=>{if(v.items.reduce((n,x)=>n+x.entitlementMinor,0)!==v.proceedsMinor)ctx.addIssue({code:"custom",path:["items"],message:"entitlements_must_equal_proceeds"});if(new Set(v.items.map(x=>x.manifestItemId)).size!==v.items.length)ctx.addIssue({code:"custom",path:["items"],message:"manifest_items_unique"});});
export const AllocateTrainingProceedsResult=z.object({allocationBatchId:Uuid,manifestId:Uuid,allocatedMinor:Money,currency:Currency,allocationCount:z.int().positive(),smallestEntitlementMinor:Money,payoutState:z.literal("accrued_b3_disabled"),platformWalletCreated:z.literal(false),influenceAssertion:z.literal(false),version:Version,replayed:z.boolean()}).strict();
~~~

`opted_in` exists only after explicit current-owner action and current Shard 20 gate success. SPL-12 recomputes ownership, clearance, consent, and notice inside the freeze transaction; supplied item assertions are not trusted. A withdrawal that commits before item lock excludes that item; a ship that commits first remains immutable and visible. Zero-minor entitlements may be mathematically valid, but positive small entitlements are never rounded to zero or forfeited.

## Authorization, Ownership, and Disclosure

| Principal | Allowed | Denied |
|---|---|---|
| Current share owner | Decide/withdraw exact share and view own consent/shipped-use history | Decide transferred/other share; erase shipped truth |
| Dataset buyer | Draft/freeze authorized corpus and view its safe manifest/instruments | Raw refusals, undeclared works, owner contact data, influence attribution |
| Corpus service | One asserted ship/allocation/delivery job | Interactive authority, wildcard corpus/deal/store access, consent mutation |
| Rights operator | Assigned manifest validation and safe reconciliation | Grant consent, change issued clearance, infer opt-in |
| Entitled party | Own allocation projection and disclosed rule | Other party exact entitlement or buyer dataset contents |
| Support/counsel | Expiring purpose grant for mechanical/legal evidence | Role override of consent/ownership/privacy hard gates |

Unknown/undiscoverable corpus, share, consent, manifest, deal, or allocation returns 404. A visible object with wrong authority returns 403; invalid step-up/job/purpose is 403. Buyer projections show eligible/excluded counts and codes, never raw owner refusal. Owners see their own shipped-use provenance, not buyer corpus internals. Allocation totals may be visible by deal mandate; exact party amounts are party/finance scoped.

## Database Schema

Server-only `licensing_private`; party FKs target `platform_private.party(id)`.

| Logical fields | Target/meaning | Enforcement |
|---|---|---|
| `work_id`, `share_id` | Shard 10 registry work/share UUID | Current-owner/version seam; transfer listener appends refused successor |
| `instrument_id` | Shard 20 full-clearance instrument UUID | Current instrument/gate validated at freeze |
| `corpus_id` | Corpus aggregate business UUID, not a foreign key | Unique with manifest version and exact buyer authorization |
| `dataset_id`, `dataset_object_ref`, `delivery_target_ref` | Dataset/corpus adapter opaque UUIDs | Buyer/job capability and digest-bound delivery request |
| `deal_id`, `proceeds_entry_ref` | Finance deal and recorded proceeds ledger UUID | Exact manifest/deal/currency/rule reconciliation |
| `owner_notice_receipt_ref`, `delivery_receipt_ref` | BE00 notice/delivery receipt UUIDs | Accepted response digest, owner/corpus binding, and purpose scope |
| `model_ref`, `ship_receipt_ref` | Governed model-register and immutable ship-receipt UUIDs | Exact manifest/model/version registration response |
| `platform_wallet_ref` | Forbidden platform-wallet reference sentinel, deliberately always NULL | SQL CHECK and result literal prevent wallet/escrow creation |

~~~sql
CREATE TABLE licensing_private.ai_training_consent (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), work_id uuid NOT NULL, share_id uuid NOT NULL,
 data_use text NOT NULL CHECK(data_use IN ('training','fine_tuning','evaluation','embedding_index')), corpus_purpose text NOT NULL CHECK(length(corpus_purpose) BETWEEN 3 AND 120),
 state text NOT NULL CHECK(state IN ('refused','opted_in','withdrawn','superseded')), policy_version text NOT NULL CHECK(length(policy_version) BETWEEN 1 AND 80),
 consent_gate_digest text NOT NULL CHECK(consent_gate_digest ~ '^[a-f0-9]{64}$'), supersedes_consent_id uuid NULL REFERENCES licensing_private.ai_training_consent(id),
 effective_at timestamptz NOT NULL, version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(share_id,data_use,corpus_purpose,version)
);
CREATE TABLE licensing_private.corpus_manifest (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), corpus_id uuid NOT NULL, dataset_id uuid NOT NULL, deal_id uuid NOT NULL,
 manifest_version bigint NOT NULL CHECK(manifest_version>0), allocation_rule_version text NOT NULL CHECK(length(allocation_rule_version) BETWEEN 1 AND 80),
 allocation_rule_digest text NOT NULL CHECK(allocation_rule_digest ~ '^[a-f0-9]{64}$'), state text NOT NULL CHECK(state IN ('draft','clearance_blocked','ready','shipped','withdrawn_pre_ship')),
 item_count integer NOT NULL CHECK(item_count>=0), manifest_digest text NULL CHECK(manifest_digest ~ '^[a-f0-9]{64}$'), delivery_target_ref uuid NOT NULL, delivery_receipt_ref uuid NULL,
 frozen_at timestamptz NULL, shipped_at timestamptz NULL, version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='shipped')=(manifest_digest IS NOT NULL AND delivery_receipt_ref IS NOT NULL AND frozen_at IS NOT NULL AND shipped_at IS NOT NULL)), UNIQUE(corpus_id,manifest_version)
);
CREATE TABLE licensing_private.corpus_manifest_item (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), manifest_id uuid NOT NULL REFERENCES licensing_private.corpus_manifest(id),
 work_id uuid NOT NULL, share_id uuid NOT NULL, dataset_object_ref uuid NOT NULL, instrument_id uuid NOT NULL, instrument_version bigint NOT NULL CHECK(instrument_version>0),
 consent_id uuid NOT NULL REFERENCES licensing_private.ai_training_consent(id), consent_version bigint NOT NULL CHECK(consent_version>0), clearance_digest text NOT NULL CHECK(clearance_digest ~ '^[a-f0-9]{64}$'),
 owner_notice_receipt_ref uuid NOT NULL, entitled_party_id uuid NOT NULL REFERENCES platform_private.party(id), allocation_weight numeric(30,12) NOT NULL CHECK(allocation_weight>=0),
 state text NOT NULL CHECK(state IN ('proposed','eligible','excluded','shipped')), exclusion_code text NULL CHECK(exclusion_code IN ('missing_opt_in','incomplete_clearance','withdrawal_race','missing_notice')),
 created_at timestamptz NOT NULL DEFAULT now(), CHECK((state='excluded')=(exclusion_code IS NOT NULL)), UNIQUE(manifest_id,id)
);
CREATE TABLE licensing_private.shipped_model_use (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), manifest_id uuid NOT NULL REFERENCES licensing_private.corpus_manifest(id),
 model_ref uuid NOT NULL, model_version text NOT NULL CHECK(length(model_version) BETWEEN 1 AND 100), ship_receipt_ref uuid NOT NULL,
 use_class text NOT NULL CHECK(use_class IN ('training','fine_tuning','evaluation','embedding_index')), immutable boolean NOT NULL DEFAULT true CHECK(immutable),
 shipped_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(manifest_id,model_ref,model_version,use_class)
);
CREATE TABLE licensing_private.training_compensation_allocation (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), deal_id uuid NOT NULL, manifest_id uuid NOT NULL REFERENCES licensing_private.corpus_manifest(id),
 manifest_item_id uuid NOT NULL REFERENCES licensing_private.corpus_manifest_item(id), entitled_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 allocation_rule_version text NOT NULL CHECK(length(allocation_rule_version) BETWEEN 1 AND 80), allocation_rule_digest text NOT NULL CHECK(allocation_rule_digest ~ '^[a-f0-9]{64}$'),
 proceeds_entry_ref uuid NOT NULL, entitlement_minor bigint NOT NULL CHECK(entitlement_minor>=0), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 state text NOT NULL CHECK(state='accrued_b3_disabled'), influence_asserted boolean NOT NULL DEFAULT false CHECK(NOT influence_asserted), platform_wallet_ref uuid NULL CHECK(platform_wallet_ref IS NULL),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(deal_id,manifest_item_id,allocation_rule_version)
);
~~~

Canonical `ai_training_consent`, `corpus_manifest`, `corpus_manifest_item`, `shipped_model_use`, and `training_compensation_allocation` map literally. Shipped manifests/items/model uses and allocations are append-only; consent changes append successors. Shipped rows reject UPDATE/DELETE through triggers and grants.

### Indexes, RLS, and grants

| Table | Query indexes | RLS | Grants |
|---|---|---|---|
| ai_training_consent | `(share_id,data_use,corpus_purpose,version DESC)`; owner/state; opted-in partial | current/recorded owner own; gate worker exact share | consent command; transfer-reset worker append only |
| corpus_manifest | `(corpus_id,manifest_version DESC)`; buyer/state; deal; shipped time | authorized buyer; item owner safe provenance; operator purpose | corpus command/delivery worker functions |
| corpus_manifest_item | `(manifest_id,state)`; share/consent; instrument; entitled party | buyer safe eligible rows; owner own item; no raw other refusal | freeze function; no direct client DML |
| shipped_model_use | `(manifest_id,shipped_at)`; model/version; owner provenance | affected owner own provenance; buyer corpus mandate | ship/model-register append functions only |
| training_compensation_allocation | `(entitled_party_id,created_at DESC)`; deal/manifest; state | entitled party own; finance exact deal mandate | allocation job append; payout worker denied while B3 off |

All tables ENABLE/FORCE RLS using party/share/corpus/deal/manifest/mandate/purpose/job/service context. `migration_role` owns; no direct client DML and no public DML. Functions pin `search_path`, retain `row_security=on`, validate logical refs, and revoke PUBLIC.

### Retention and deletion

Consent and withdrawals persist for consent/legal history. Unshipped excluded items and transient delivery payloads expire after 90 days unless held. Shipped manifests, item evidence, model-use register, allocation rule/proceeds links and accruals persist for licence/accounting/dispute retention and cannot be erased in a way that falsifies use. Optional identity metadata deidentifies where lawful; exact amounts remain finance/private.

## State, Middleware, Concurrency, and Data Flow

| Aggregate | State machine | Invariant/recovery |
|---|---|---|
| Consent | default refused → refused/opted_in; opted_in → withdrawn/superseded; transfer appends refused successor | Silence/refailure never opts in |
| Corpus | draft → clearance_blocked ↔ ready → shipped terminal; draft/ready → withdrawn_pre_ship | Shipped immutable; partial delivery never marks shipped |
| Item | proposed → eligible/excluded → shipped terminal | Withdrawal before lock excludes; ship-before-withdraw remains |
| Allocation | absent → accrued_b3_disabled terminal successor by rule version | Exact accrual, no forfeiture/wallet/influence assertion |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| SPL-11 | first-party-write | current share owner | 20/min/share | 64 KiB strict exact-scope decision, conditional If-Match, 30d idempotency |
| SPL-12 | first-party-write | buyer + recent step-up | 4/hour/corpus | 8 MiB/100k items, If-Match, 90d idempotency |
| SPL-13 | first-party-write | current share owner | 12/hour/share | 32 KiB exact version/disclosure, 30d idempotency |
| SPL-14 | service-no-origin | exact corpus job | 4/hour/manifest | 8 MiB/100k allocations, job assertion, 365d idempotency |

### Operation flows

| Op | Transactional flow and lock order |
|---|---|
| SPL-11 | Resolve current share owner → lock consent scope → Shard20 gate → append explicit decision/outbox/idempotency |
| SPL-12 | Step-up → lock corpus/version → resolve and lock sorted shares/consents/instruments/notices → exclude race/missing items → deliver → only confirmed delivery marks immutable shipped |
| SPL-13 | Present disclosure before command → lock share/current consent then unshipped items → append withdrawal and exclusions; shipped rows untouched |
| SPL-14 | Assert job → lock shipped manifest/deal proceeds → recompute disclosed rule → insert all allocations/outbox atomically; no payout call |

Lock order corpus → sorted share/consent → instrument/notice → manifest/item → deal/proceeds → allocation → idempotency. Serializable retry is twice with 25/75 ms backoff. Consent version, manifest version, unique items and allocation keys make freeze/withdrawal/allocation races deterministic.

### External seams

| Seam | Exact request → response | Timeout/retry/backoff/circuit behavior |
|---|---|---|
| Rights share registry | `{workId,shareId,partyId,asOf,version}` → `{currentOwnerPartyId,shareVersion,transferredAt,digest}` | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 failures; consent/ship blocks |
| Shard20 consent/clearance | `{shareId,dataUse,purpose,instrumentId,versions}` → `{policyAllowed,fullClearance,current,gateDigest}` | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens 60,000 ms after 5 failures; item excludes |
| Owner notice | `{noticeId,ownerPartyId,corpusPurpose,cutoffAt,digest}` → `{accepted,receiptRef,acceptedAt}` | Timeout 5,000 ms; 3 retries with 5,000/30,000/180,000 ms backoff; circuit opens 120,000 ms after 5 failures; missing receipt blocks item |
| Corpus delivery | `{manifestId,manifestDigest,targetCapability,itemCount}` → `{state,deliveryReceiptRef,deliveredAt}` | Timeout 30,000 ms; query before 2 retries with 1,000/5,000 ms backoff; circuit opens 120,000 ms after 5 failures; uncertainty never marks shipped |
| Model-use register | `{manifestId,modelRef,modelVersion,useClass,shipReceipt}` → `{registered,useRef,digest}` | Timeout 3,000 ms; 2 retries with 250/1,000 ms backoff; circuit opens 60,000 ms after 5 failures; reconciliation preserves shipped truth |
| Finance proceeds | `{dealId,manifestId,proceedsEntryRef,currency}` → `{recorded,amountMinor,ledgerVersion,digest}` | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens 60,000 ms after 5 failures; allocation blocks on uncertainty |

Dataset/delivery adapters remain disabled until reviewed Phase-2 evolution. Disabled means corpus cannot ship through that adapter; it never implies delivery or owner notice.

## Event Contracts

~~~ts
const EventBase=z.object({eventId:Uuid,aggregateId:Uuid,aggregateVersion:Version,occurredAt:Instant,requestId:Uuid,actorPartyId:Uuid.nullable(),payloadDigest:Sha256}).strict();
export const AIConsentChanged=EventBase.extend({type:z.literal("licensing.ai-consent.changed.v1"),payload:z.object({consentId:Uuid,shareId:Uuid,purposeClass:z.string().min(3).max(120),state:AIConsentState,version:Version}).strict()}).strict();
export const CorpusChanged=EventBase.extend({type:z.literal("licensing.corpus.changed.v1"),payload:z.object({corpusId:Uuid,manifestId:Uuid.nullable(),state:CorpusState,itemCount:z.int().nonnegative(),version:Version}).strict()}).strict();
export const TrainingAllocationChanged=EventBase.extend({type:z.literal("licensing.training-allocation.changed.v1"),payload:z.object({allocationBatchId:Uuid,manifestId:Uuid,state:z.literal("accrued_b3_disabled"),allocationCount:z.int().positive(),version:Version}).strict()}).strict();
~~~

Events use BE00 outbox/dedupe and exclude raw refusals, media/dataset items, owner contact, buyer terms, delivery evidence, exact compensation, influence data, and tokens. Consumers detecting version gaps replay or DLQ; they never infer opt-in from event absence.

## Errors, Failure Recovery, and Observability

| Op | BE00 `ApiError { code, message, requestId, details }` codes | Recovery |
|---|---|---|
| SPL-11 | AI_SCOPE_INVALID; CONSENT_GATE_FAILED; SHARE_OWNER_CHANGED; VERSION_CONFLICT; FORBIDDEN | Refresh owner/version; state stays refused/prior explicit state |
| SPL-12 | AI_OPT_IN_REQUIRED; CORPUS_CLEARANCE_INCOMPLETE; OWNER_NOTICE_REQUIRED; CORPUS_VERSION_CHANGED; DELIVERY_UNCERTAIN; FORBIDDEN | Exclude item or restore draft/blocked; never partial ship |
| SPL-13 | SHARE_OWNER_CHANGED; CONSENT_NOT_OPTED_IN; VERSION_CONFLICT; DISCLOSURE_REQUIRED; FORBIDDEN | Refresh/reconfirm; failed withdrawal leaves opted-in state |
| SPL-14 | CORPUS_CLEARANCE_INCOMPLETE; ALLOCATION_RULE_INVALID; PROCEEDS_UNRECORDED; MULTIPAYEE_DISABLED_B3; JOB_SCOPE_INVALID | Correct rule/proceeds; accrual allowed but payout rejected |

Failure recovery matrix:

| Failure | Durable behavior |
|---|---|
| Transfer/withdrawal races freeze | Sorted row locks decide; loser refreshes; no stale opted-in item ships |
| Delivery uncertain | Query manifest digest/receipt; corpus remains ready/draft until confirmed |
| Withdrawal after ship | Append withdrawal/future exclusions; shipped manifest/model-use remains visible |
| Allocation job replay | Unique deal/item/rule keys return identical batch; no duplicate accrual |
| B3 payout attempt | Reject payout, retain exact accrual; create no platform wallet/escrow |

Per-operation observability matrix:

| Op | Safe fields/metrics | SLO/test |
|---|---|---|
| SPL-11 | opId,dataUse,state,policyVersion; `ai_consent_total` | p95 1 s; transfer/default/refailure tests |
| SPL-12 | opId,state,itemCount,excludedCounts,manifestVersion; `corpus_ship_total` | p95 45 s; stale-consent/notice/delivery invariant alerts |
| SPL-13 | opId,state,excludedCount,preservedUseCount; `ai_withdrawal_total` | p95 2 s; freeze/ship ordering tests |
| SPL-14 | opId,allocationCount,payoutState,ruleVersion; `training_allocation_total` | p95 15 s/100k; sum/precision/B3 tests |

Logs/provider-native diagnostics contain no owner decision, dataset object, media, exact amount, buyer identity, evidence, token, or influence field. Alerts cover consent-transfer lag, blocked corpus age, delivery uncertainty, manifest immutability violations, allocation imbalance, B3 payout attempts, and outbox lag.

## Release and Testing

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/recovery |
|---|---|---|---|
| SPL-11 | Exact scope and explicit refused/opted-in states | current owner, other-share 404, strict CORS | transfer/decision race; replay one successor |
| SPL-12 | shipped/blocked union and every item gate | buyer step-up, raw-refusal concealment | withdrawal/freeze/delivery races, no partial ship |
| SPL-13 | disclosure acknowledgment and preserved shipped counts | current owner only | concurrent ship/transfer; failed write preserves opted-in |
| SPL-14 | exact sum/precision and accrued_b3_disabled result | service-no-origin exact job | duplicate job, changed proceeds/rule, payout rejected |

Property tests cover all Zod refinements and arbitrary decimal weights/large manifests. Handler/OpenAPI tests cover exact status/schema/errors. PostgreSQL tests cover constraints, append-only triggers, RLS/grants, lock ordering, rollback, outbox and idempotency. Security tests cover IDOR, CORS/CSRF, job scope, raw refusal/amount redaction, vault capability, and egress allowlists.

Release order is schema/RLS/functions → contracts/handlers → transfer listener/workers → consumers → flags. Delivery integration defaults off. Rollback disables new ship/allocation work but preserves consent, shipped truth and accruals. Recovery scans transfer resets, pending delivery, model-register gaps, blocked corpora, allocation/outbox discrepancies.

## Deepening Passes

- Integrity: current owner, clearance, consent, notice and manifest version are revalidated at freeze; shipped rows reject mutation.
- Privacy/security: buyer cannot read refusals/undeclared works; owners see only own consent/use; exact accrual is party/finance scoped.
- Concurrency: share/consent ordering deterministically resolves transfer, withdrawal and freeze.
- Recovery: disabled/uncertain delivery, late withdrawal, allocation replay and B3 payout have explicit durable outcomes.
- Operations: each operation is keyed through contracts, policy, errors, telemetry, tests, migration and reconciliation.

## Ambiguity Gate

**PASS.** Macro ownership is explicit among rights registry, Shard 20 instruments, this consent/corpus ledger, delivery providers, finance proceeds and B3 payout. Micro behavior is explicit for all four operations: routes, principals, CORS, validation, rates, idempotency, response/error variants, 403/404, locks, persistence, events, SLOs and recovery. Silence/refailure/transfer cannot imply consent; withdrawal cannot rewrite shipped truth; allocation cannot imply influence, forfeit small value, create a wallet, or bypass B3.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for Shard 21c; source split validated and ambiguity gate passed. |

## Dependency References

- [BE00 infrastructure](00-infrastructure.md)
- [Shard 21 IA](../ia/21-specialized-licensing.md)
- [Shard 20 licensing core](../ia/20-licensing-core.md)
- [Shard 10 rights ownership](../ia/10-rights-ownership.md)


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
