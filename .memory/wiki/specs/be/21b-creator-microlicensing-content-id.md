# Creator Micro-Licensing & Content ID — Backend Specification

**Status:** Complete
**IA source:** [Shard 21](../ia/21-specialized-licensing.md)
**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 21b: fixed creator listings, channel proof, micro-licence purchase, provider whitelist, Content ID claim release, subscription cancellation |
| Included interactions | SPL-07 through SPL-10 |
| Included feature | 11.06 Creator Micro-Licensing |
| Canonical contracts | `PurchaseCreatorLicence`, `ReleaseContentClaim` |
| Canonical models | `creator_licence_listing`, `channel_proof`, `whitelist_operation`, `content_claim_case`, `subscription_grant_history` |
| Boundary | Shard 20 owns clearance/instruments; subscription enables future purchase only; provider confirmation is required for purchase completion and issued rights are never revoked by cancellation. |

## Referenced Material Inventory

| Material | Trace | Use |
|---|---|---|
| Shard 21 locked creator decisions | `../ia/21-specialized-licensing.md`, Overview/Specialized Decisions, lines 7–35 | Flat non-negotiable listing, whitelist completion, grant persistence, provider-disabled boundary |
| Feature and acceptance source | same file, Features/Acceptance Criteria, lines 37–62 | Feature 11.06 and AC-SPL-07–AC-SPL-10 |
| Interaction truth | same file, Interactions/Global Interaction Rules, lines 64–90 | SPL-07–SPL-10 and recovery semantics |
| Contracts/models/events | same file, Contracts/Data Models/Event Schemas, lines 92–161 and 193–208 | Exact canonical identifiers, whitelist state, safe events |
| Access control | same file, Access Control/Access Escalation, lines 163–183 | Owner, licensee, reviewer, operator, service-principal boundaries |
| Licensing core | `../ia/20-licensing-core.md`, Contracts/Data Models/Access, lines 97–207 | Scope, quote, instrument, policy and payee gate ownership |
| BE00 | `00-infrastructure.md`, API/Zod/Database/Middleware/Event/Error/Testing, lines 67–501 | Global envelopes, idempotency, RLS, outbox, observability |
| Architecture/standards | `../2026-08-02-architecture-design.md`, lines 359–999; `../ENGINEERING-STANDARDS.md`, lines 96–166 | REST/Zod/PostgreSQL/security/SLO requirements |

## IA Source Map

| Interaction | Backend responsibility | Canonical artifacts |
|---|---|---|
| SPL-07 | Validate owner standing, fixed template containment, flat price, channel/use scale, and B3 single-payee path before activating listing | `creator_licence_listing` |
| SPL-08 | Verify licensee/channel OAuth, scope/price/subscription/clearance; issue one instrument; persist and reconcile whitelist; complete only on confirmation | `PurchaseCreatorLicence`; `channel_proof`; `whitelist_operation` |
| SPL-09 | Bind claim/content/channel/instrument, explain covered-vs-uncovered use, submit provider release, and escalate a relanded claim with receipts | `ReleaseContentClaim`; `content_claim_case` |
| SPL-10 | Disable future-purchase capability while preserving all issued instruments, whitelist entries, and claim cases | `subscription_grant_history` |

### Canonical identifier registry

- Contracts: `PurchaseCreatorLicence`, `ReleaseContentClaim`.
- Models: `creator_licence_listing`, `channel_proof`, `whitelist_operation`, `content_claim_case`, `subscription_grant_history`.
- Events: `licensing.creator-listing.changed.v1`, `licensing.whitelist.changed.v1`, `licensing.content-claim.changed.v1`.
- `WhitelistState`: `not_requested`, `pending`, `confirmed`, `failed`, `revoked_in_error`, `reconciling`.

## Endpoint Completeness Reconciliation

Each of SPL-07–SPL-10 changes durable state or coordinates an external provider, so each receives one command operation. Channel proof, issued instruments, payment/refund, subscription truth, idempotency, and provider webhook ingress remain with their owning platform/shards; this companion stores scoped references and reconciled projections. No BE00 endpoint is duplicated.

## Shared Contract Inheritance

BE00 supplies `/api/v1`, request IDs, authentication, CSRF/CORS, body limits, `If-Match`, rate headers, canonical idempotency, transaction/outbox, event envelope, structured logging, and the exact `ApiError { code, message, requestId, details }`. Details never include OAuth/provider tokens, channel identity, claim evidence, licence documents, owner policy, or payment data. Same-key/same-hash replay returns the original response; different hash returns `409 IDEMPOTENCY_KEY_REUSED`.

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| SPL-07 | POST /api/v1/licensing/creator-listings | Work/master owner/admin with share standing | first-party-write | Strict listing action + conditional `If-Match` | 20/min/work | Required 30d | 201/200 |
| SPL-08 | POST /api/v1/licensing/creator-purchases | Authenticated creator licensee | first-party-write | Strict purchase + channel proof + listing version | 10/min/licensee | Required 30d | 201/202 |
| SPL-09 | POST /api/v1/licensing/content-claim-releases | Instrument-holding creator licensee | first-party-write | Strict claim binding/action + `If-Match` | 20/min/licensee | Required 30d | 201/202 |
| SPL-10 | POST /api/v1/licensing/subscription-cancellations | Owning subscriber | first-party-write | Strict cancellation + subscription version | 6/hour/subscriber | Required 30d | 200 |

All browser operations use exact-origin credentialed CORS; allowed methods/headers are POST, Content-Type, X-CSRF-Token, Idempotency-Key, and If-Match where applicable. Wildcard/null origin is rejected and BE00 owns OPTIONS.

### Operation Contract Matrix

| Op | Request schema | Success schema | Error schema |
|---|---|---|---|
| SPL-07 | `CreatorListingRequest` | `CreatorListingResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-08 | `PurchaseCreatorLicenceRequest` | `PurchaseCreatorLicenceResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-09 | `ReleaseContentClaimRequest` | `ReleaseContentClaimResult` | BE00 `ApiError { code, message, requestId, details }` |
| SPL-10 | `CancelSubscriptionGrantRequest` | `CancelSubscriptionGrantResult` | BE00 `ApiError { code, message, requestId, details }` |

## Request and Success Contracts — Zod 4

~~~ts
import { z } from "zod";
const Uuid=z.uuid(), Instant=z.iso.datetime({offset:true}), Version=z.int().positive(), Sha256=z.string().regex(/^[a-f0-9]{64}$/), Currency=z.string().regex(/^[A-Z]{3}$/), Money=z.int().nonnegative();
const UseScale=z.enum(["single_video","channel_series","single_stream","social_campaign"]);
const ListingState=z.enum(["draft","active","inactive","superseded"]);
const WhitelistState=z.enum(["not_requested","pending","confirmed","failed","revoked_in_error","reconciling"]);
const FixedTemplate=z.object({templateId:Uuid,templateVersion:z.string().min(1).max(80),channelProvider:z.string().regex(/^[a-z0-9_]{2,64}$/),useScale:UseScale,territories:z.array(z.string().min(2).max(3)).min(1).max(250),termDays:z.int().min(1).max(3650),negotiable:z.literal(false)}).strict();

export const CreatorListingRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("create"),workId:Uuid,ownerShareId:Uuid,template:FixedTemplate,priceMinor:Money,currency:Currency,clearanceGateDigest:Sha256,singlePayeePartyId:Uuid}).strict(),
 z.object({action:z.literal("update"),listingId:Uuid,expectedVersion:Version,template:FixedTemplate,priceMinor:Money,currency:Currency,clearanceGateDigest:Sha256,singlePayeePartyId:Uuid}).strict(),
 z.object({action:z.literal("deactivate"),listingId:Uuid,expectedVersion:Version,reasonCode:z.enum(["owner_choice","authority_changed","clearance_changed"])}).strict()
]);
export const CreatorListingSchema=z.object({listingId:Uuid,workId:Uuid,ownerShareId:Uuid,template:FixedTemplate,priceMinor:Money,currency:Currency,singlePayeePartyId:Uuid,state:ListingState,version:Version,createdAt:Instant,updatedAt:Instant}).strict();
export const CreatorListingResult=z.object({listing:CreatorListingSchema,fallback:z.enum(["none","human_clearance"]),replayed:z.boolean()}).strict().refine(v=>(v.listing.state==="active")===(v.fallback==="none"),{message:"inactive_routes_human_clearance"});

const ChannelProof=z.object({channelProofId:Uuid,providerKey:z.string().regex(/^[a-z0-9_]{2,64}$/),channelOpaqueRef:Uuid,oauthGrantRef:Uuid,proofVersion:Version,verifiedAt:Instant,expiresAt:Instant}).strict().refine(v=>v.expiresAt>v.verifiedAt,{message:"proof_expiry_after_verification"});
export const PurchaseCreatorLicenceRequest=z.object({listingId:Uuid,expectedListingVersion:Version,licenseePartyId:Uuid,channelProof:ChannelProof,requestedTemplate:FixedTemplate,expectedPriceMinor:Money,currency:Currency,subscriptionGrantVersion:Version,paymentAuthorizationRef:Uuid}).strict();
export const PurchaseCreatorLicenceResult=z.discriminatedUnion("state",[
 z.object({state:z.literal("complete"),purchaseId:Uuid,instrumentId:Uuid,whitelistOperationId:Uuid,whitelistState:z.literal("confirmed"),providerReceiptRef:Uuid,replayed:z.boolean()}).strict(),
 z.object({state:z.enum(["instrument_issued_whitelist_pending","unfulfilled_recovery"]),purchaseId:Uuid,instrumentId:Uuid.nullable(),whitelistOperationId:Uuid.nullable(),whitelistState:z.enum(["pending","failed","reconciling"]),paymentRecovery:z.enum(["none","void_pending","refund_pending"]),replayed:z.boolean()}).strict()
]);

export const ReleaseContentClaimRequest=z.object({claimCaseId:Uuid.nullable(),instrumentId:Uuid,channelProofId:Uuid,contentRef:Uuid,claimProviderRef:z.string().min(1).max(200),claimEvidenceDigest:Sha256,action:z.enum(["evaluate_and_release","reconcile_relanded"]),expectedCaseVersion:Version.nullable()}).strict();
export const ReleaseContentClaimResult=z.discriminatedUnion("outcome",[
 z.object({outcome:z.literal("release_submitted"),claimCaseId:Uuid,providerAttempt:Version,state:z.enum(["pending","released"]),providerReceiptRef:Uuid.nullable(),replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("correct_claim"),claimCaseId:Uuid,state:z.literal("explained_uncovered_use"),releaseSubmitted:z.literal(false),replayed:z.boolean()}).strict(),
 z.object({outcome:z.literal("escalated"),claimCaseId:Uuid,state:z.literal("relanded_escalated"),reviewCaseId:Uuid,priorReceiptCount:z.int().positive(),replayed:z.boolean()}).strict()
]);

export const CancelSubscriptionGrantRequest=z.object({subscriptionId:Uuid,subscriberPartyId:Uuid,expectedSubscriptionVersion:Version,acknowledgeIssuedRightsPersist:z.literal(true)}).strict();
export const CancelSubscriptionGrantResult=z.object({subscriptionId:Uuid,futurePurchaseCapability:z.literal("disabled"),issuedInstrumentCountPreserved:z.int().nonnegative(),confirmedWhitelistCountPreserved:z.int().nonnegative(),claimCaseCountPreserved:z.int().nonnegative(),reconciliationQueued:z.boolean(),version:Version,replayed:z.boolean()}).strict();
~~~

The SPL-08 complete variant requires both a committed Shard 20 instrument and a confirmed provider receipt. Local timeout cannot manufacture confirmation. Cancellation has no field capable of revoking an instrument, whitelist, or claim case. Listing requests cannot encode negotiation or a variable price.

## Authorization, Ownership, and Disclosure

| Principal | Allowed | Denied |
|---|---|---|
| Work/master owner/admin | Configure listing within exact share standing and fixed template | List another share, negotiate through this surface, override B3 payee gate |
| Creator licensee | Buy for self/proved channel; manage own claim case | Access owner policy/evidence, another channel, claim, purchase, or token |
| Subscriber | Cancel own future-purchase grant | Revoke already issued rights or cancel another subscriber |
| Rights operator | Assigned whitelist/purchase reconciliation safe fields | Issue licence, confirm provider without receipt, change listing terms |
| Claim/dispute reviewer | Assigned relanded case and prior safe receipts | General catalogue/channel/media access |
| Provider worker | One asserted whitelist/claim job | Wildcard provider, channel, instrument, or interactive authority |

Unknown or undiscoverable listing/purchase/channel/claim/subscription IDs return `404 NOT_FOUND`. A visible object with insufficient action authority returns `403 FORBIDDEN`; invalid job/mandate/step-up is 403. Provider receipts and claim evidence are purpose-restricted. Buyers see template/price/whitelist state, never owner policy internals; owners receive aggregate sales outcomes, never buyer OAuth/channel identity.

## Database Schema

Server-only `licensing_private`; party FKs target `platform_private.party(id)`.

| Logical fields | Target/meaning | Enforcement |
|---|---|---|
| `work_id`, `owner_share_id` | Shard 10 registry work/share UUID | Authority/version seam before listing lock |
| `template_id` | Shard 20 governed fixed-template UUID | Template/version containment validation; never negotiable |
| `instrument_id` | Shard 20 issued instrument UUID | Idempotent instrument response; immutable once stored |
| `subscription_id` | Subscription/billing aggregate UUID | Own-subscriber/version seam; future capability only |
| `oauth_grant_ref` | BE00 vault capability UUID | Server resolves scoped token; never returns/stores raw token |
| `channel_opaque_ref`, `content_ref` | Provider-scoped opaque identifiers | Proof/instrument/licensee binding; no cross-provider reuse |
| `payment_authorization_ref` | Payment-provider authorization UUID | Amount/currency/purchase-key query-before-retry validation |
| `provider_receipt_ref`, `provider_receipt_refs` | Provider whitelist/claim receipt UUID or UUID elements | Exact provider response; array elements validated and immutable |
| `claim_provider_ref` | Provider-owned opaque claim identifier, deliberately text/non-FK | Unique provider binding to content/channel/instrument and provider namespace |
| `review_case_id` | Scoped claim/dispute review-case UUID | Assigned purpose grant and prior-receipt handoff |

~~~sql
CREATE TABLE licensing_private.creator_licence_listing (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), work_id uuid NOT NULL, owner_share_id uuid NOT NULL,
 template_id uuid NOT NULL, template_version text NOT NULL CHECK(length(template_version) BETWEEN 1 AND 80), template jsonb NOT NULL CHECK(jsonb_typeof(template)='object'),
 price_minor bigint NOT NULL CHECK(price_minor>=0), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), single_payee_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 clearance_gate_digest text NOT NULL CHECK(clearance_gate_digest ~ '^[a-f0-9]{64}$'), state text NOT NULL CHECK(state IN ('draft','active','inactive','superseded')),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(work_id,owner_share_id,version)
);
CREATE TABLE licensing_private.channel_proof (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), licensee_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 provider_key text NOT NULL CHECK(provider_key ~ '^[a-z0-9_]{2,64}$'), channel_opaque_ref uuid NOT NULL, oauth_grant_ref uuid NOT NULL,
 proof_version bigint NOT NULL CHECK(proof_version>0), state text NOT NULL CHECK(state IN ('verified','expired','revoked')),
 verified_at timestamptz NOT NULL, expires_at timestamptz NOT NULL CHECK(expires_at>verified_at), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider_key,channel_opaque_ref,proof_version)
);
CREATE TABLE licensing_private.creator_licence_purchase (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), listing_id uuid NOT NULL REFERENCES licensing_private.creator_licence_listing(id),
 licensee_party_id uuid NOT NULL REFERENCES platform_private.party(id), channel_proof_id uuid NOT NULL REFERENCES licensing_private.channel_proof(id), instrument_id uuid NULL,
 subscription_id uuid NOT NULL, subscription_grant_version bigint NOT NULL CHECK(subscription_grant_version>0), payment_authorization_ref uuid NOT NULL,
 price_minor bigint NOT NULL CHECK(price_minor>=0), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 state text NOT NULL CHECK(state IN ('authorizing','instrument_issued_whitelist_pending','complete','unfulfilled_recovery','voided','refunded')),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(state NOT IN ('instrument_issued_whitelist_pending','complete') OR instrument_id IS NOT NULL),
 CHECK(state<>'authorizing' OR instrument_id IS NULL), UNIQUE(listing_id,licensee_party_id,channel_proof_id,version)
);
CREATE TABLE licensing_private.whitelist_operation (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), purchase_id uuid NOT NULL REFERENCES licensing_private.creator_licence_purchase(id),
 instrument_id uuid NOT NULL, channel_proof_id uuid NOT NULL REFERENCES licensing_private.channel_proof(id), provider_key text NOT NULL CHECK(provider_key ~ '^[a-z0-9_]{2,64}$'),
 provider_request_key text NOT NULL CHECK(length(provider_request_key) BETWEEN 16 AND 200), provider_receipt_ref uuid NULL,
 state text NOT NULL CHECK(state IN ('not_requested','pending','confirmed','failed','revoked_in_error','reconciling')),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 20), last_error_code text NULL CHECK(last_error_code IS NULL OR length(last_error_code)<=80),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='confirmed')=(provider_receipt_ref IS NOT NULL)), UNIQUE(provider_key,provider_request_key)
);
CREATE TABLE licensing_private.content_claim_case (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), licensee_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 instrument_id uuid NOT NULL, channel_proof_id uuid NOT NULL REFERENCES licensing_private.channel_proof(id), content_ref uuid NOT NULL,
 claim_provider_ref text NOT NULL CHECK(length(claim_provider_ref) BETWEEN 1 AND 200), claim_evidence_digest text NOT NULL CHECK(claim_evidence_digest ~ '^[a-f0-9]{64}$'),
 state text NOT NULL CHECK(state IN ('evaluating','explained_uncovered_use','release_pending','released','relanded_escalated')),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 20), provider_receipt_refs uuid[] NOT NULL DEFAULT '{}', review_case_id uuid NULL,
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(claim_provider_ref,instrument_id)
);
CREATE TABLE licensing_private.subscription_grant_history (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id), subscriber_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 subscription_id uuid NOT NULL, period_start_at timestamptz NOT NULL, period_end_at timestamptz NULL,
 future_purchase_capability text NOT NULL CHECK(future_purchase_capability IN ('enabled','disabled')),
 cancellation_reason_code text NULL CHECK(cancellation_reason_code IS NULL OR length(cancellation_reason_code)<=80),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), CHECK(period_end_at IS NULL OR period_end_at>period_start_at), UNIQUE(subscription_id,version)
);
~~~

Canonical models `creator_licence_listing`, `channel_proof`, `whitelist_operation`, `content_claim_case`, and `subscription_grant_history` map literally; `creator_licence_purchase` is the required atomic support aggregate. State changes use versioned functions and immutable audit/outbox successors; direct token/provider payload storage is prohibited.

### Indexes, RLS, and grants

| Table | Query indexes | RLS | Grants |
|---|---|---|---|
| creator_licence_listing | `(work_id,state)`; `(owner_share_id,version DESC)`; active template/provider partial | standing owner; public buyer gets safe active projection only | listing command; safe catalogue function |
| channel_proof | `(licensee_party_id,state,expires_at)`; provider/channel unique | exact licensee and provider job purpose | proof verifier command; no direct client DML |
| creator_licence_purchase | `(licensee_party_id,created_at DESC)`; listing/state; recovery partial | licensee own; listing owner aggregate-only; recovery mandate | purchase command; payment/recovery workers safe functions |
| whitelist_operation | purchase unique active; `(state,updated_at)` recovery; provider request unique | licensee safe state; exact provider/reconciliation job | whitelist worker state function only |
| content_claim_case | `(licensee_party_id,updated_at DESC)`; state; review case; provider claim unique | licensee own; assigned reviewer/purpose worker | claim command/reviewer function only |
| subscription_grant_history | `(subscription_id,version DESC)`; subscriber/current capability | subscriber own; subscription worker exact aggregate | cancellation command; no UPDATE/DELETE |

All tables ENABLE/FORCE RLS with party/work/share/channel/instrument/mandate/purpose/job/service context. `migration_role` owns; no direct client DML and no public DML. Security-definer functions pin `search_path`, preserve `row_security=on`, validate logical references, and revoke PUBLIC.

### Retention and deletion

Listings and expired proofs follow commerce/account retention; vault tokens follow BE00 deletion. Issued-instrument/whitelist/purchase/claim/cancellation evidence persists for licence, accounting, chargeback, and dispute retention. Erasure deidentifies optional display metadata but cannot revoke or falsify rights. Raw provider payloads expire within 30 days; safe receipts/digests remain.

## State, Middleware, Concurrency, and Data Flow

| Aggregate | State machine | Invariant/recovery |
|---|---|---|
| Listing | draft → active/inactive → superseded | Active only when fixed template and single payee remain valid |
| Purchase | authorizing → instrument_issued_whitelist_pending → complete; any provider/payment failure → unfulfilled_recovery → voided/refunded | Complete iff instrument and confirmed whitelist |
| Whitelist | not_requested → pending → confirmed/failed/reconciling; erroneous revocation → revoked_in_error → reconciling/confirmed | Late confirmation reconciles same operation |
| Claim | evaluating → explained_uncovered_use or release_pending → released; reland → relanded_escalated | No dishonest release; reland does not loop indefinitely |
| Subscription grant | enabled → disabled successor | Issued instruments, whitelists, claim cases unchanged |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| SPL-07 | first-party-write | exact share standing | 20/min/work | 128 KiB strict action, conditional If-Match, 30d idempotency |
| SPL-08 | first-party-write | licensee + channel proof | 10/min/licensee | 128 KiB strict purchase/listing version, 30d idempotency |
| SPL-09 | first-party-write | instrument holder + channel proof | 20/min/licensee | 128 KiB binding/action, conditional If-Match, 30d idempotency |
| SPL-10 | first-party-write | own subscriber | 6/hour/subscriber | 32 KiB strict cancellation/version, 30d idempotency |

### Operation flows

| Op | Transactional flow and lock order |
|---|---|
| SPL-07 | Authorize share → lock current listing → validate fixed template/price and Shard20 B3 gate → append active or return human fallback |
| SPL-08 | Lock listing/proof/subscription → validate price/scope → authorize payment → request one Shard20 instrument → insert whitelist job → complete only on confirmed receipt |
| SPL-09 | Lock instrument/proof/claim → validate content/claim binding → classify covered use → submit release or explanation; reland appends review escalation |
| SPL-10 | Lock subscription/grant version → append disabled successor/audit/idempotency → queue reconciliation that explicitly excludes issued rights |

Lock order share/listing → channel proof → subscription grant → purchase/instrument → whitelist/claim → idempotency. Serializable conflicts retry twice with 25/75 ms backoff. Unique provider request/claim keys and canonical idempotency prevent duplicate instrument, payment, whitelist, or release.

### External seams

| Seam | Exact request → response | Timeout/retry/backoff/circuit behavior |
|---|---|---|
| Shard10/20 standing and gate | `{partyId,workId,shareId,template,scope,payeePath,versions}` → `{authorized,eligible,singlePayeePartyId,gateDigest}` | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens 60,000 ms after 5 failures; listing/purchase blocks |
| Shard20 instrument | `{listingId,licensee,scope,price,channelProofDigest,idempotencyKey}` → `{instrumentId,state,version,digest}` | Timeout 3,000 ms; 2 retries with 250/1,000 ms backoff; circuit opens 60,000 ms after 5 failures; query before retry |
| Channel OAuth/vault | `{oauthGrantRef,providerKey,channelOpaqueRef,purpose}` → `{verified,subjectDigest,expiresAt}` | Timeout 3,000 ms; 1 retry with 250 ms backoff; circuit opens 60,000 ms after 5 failures; expired/mismatch denies |
| Whitelist provider | `{requestKey,instrumentRef,channelCapability,contentPolicy}` → `{state,receiptRef,providerVersion}` | Timeout 10,000 ms; 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens 120,000 ms after 5 failures; pending/failed never complete |
| Claim provider | `{claimRef,contentRef,channelCapability,instrumentDigest,requestKey}` → `{state,receiptRef,reasonClass}` | Timeout 10,000 ms; 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens 120,000 ms after 5 failures; reland escalates after 2 confirmed releases |
| Subscription service | `{subscriptionId,subscriber,expectedVersion,action=cancel}` → `{state,version,effectiveAt}` | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens 60,000 ms after 5 failures; issued rights untouched |
| Payment rail | `{authorizationRef,amountMinor,currency,purchaseKey}` → `{state,receiptRef}` | Timeout 10,000 ms; query before 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens 120,000 ms after 5 failures; uncertainty prevents duplicate |

Provider adapters are disabled until reviewed Phase-2 evolution. A disabled whitelist keeps purchase unfulfilled/pending and drives void/refund recovery; it never reports completion.

## Event Contracts

~~~ts
const EventBase=z.object({eventId:Uuid,aggregateId:Uuid,aggregateVersion:Version,occurredAt:Instant,requestId:Uuid,actorPartyId:Uuid.nullable(),payloadDigest:Sha256}).strict();
export const CreatorListingChanged=EventBase.extend({type:z.literal("licensing.creator-listing.changed.v1"),payload:z.object({listingId:Uuid,templateId:Uuid,state:ListingState,version:Version}).strict()}).strict();
export const WhitelistChanged=EventBase.extend({type:z.literal("licensing.whitelist.changed.v1"),payload:z.object({whitelistOperationId:Uuid,instrumentId:Uuid,providerKey:z.string().min(2).max(64),state:WhitelistState,version:Version}).strict()}).strict();
export const ContentClaimChanged=EventBase.extend({type:z.literal("licensing.content-claim.changed.v1"),payload:z.object({claimCaseId:Uuid,instrumentId:Uuid,state:z.enum(["evaluating","explained_uncovered_use","release_pending","released","relanded_escalated"]),attempt:Version,version:Version}).strict()}).strict();
~~~

Events inherit BE00 at-least-once outbox delivery and dedupe by aggregate/version. They exclude provider tokens, channel identity, claim evidence, owner policy, buyer data, licence documents, exact price/payment, and provider refusal text.

## Errors, Failure Recovery, and Observability

| Op | BE00 `ApiError { code, message, requestId, details }` codes | Recovery |
|---|---|---|
| SPL-07 | TEMPLATE_SCOPE_MISMATCH; MULTIPAYEE_DISABLED_B3; SHARE_AUTHORITY_CHANGED; VERSION_CONFLICT; FORBIDDEN | Human-clearance fallback; current listing unchanged |
| SPL-08 | CHANNEL_PROOF_REQUIRED; TEMPLATE_SCOPE_MISMATCH; CLEARANCE_REQUIRED; MULTIPAYEE_DISABLED_B3; WHITELIST_UNCONFIRMED; PAYMENT_UNCERTAIN | Refresh proof/listing; reconcile, void, or refund without duplicate instrument |
| SPL-09 | CLAIM_REFERENCE_INVALID; WHITELIST_UNCONFIRMED; CLAIM_SCOPE_UNCOVERED; PROVIDER_UNAVAILABLE; FORBIDDEN | Explain correct claim or retry/reconcile; reland escalates with receipts |
| SPL-10 | SUBSCRIPTION_VERSION_CHANGED; FORBIDDEN; VALIDATION_FAILED | Refresh/cancel; issued rights always preserved |

Failure recovery matrix:

| Failure | Durable behavior |
|---|---|
| Instrument committed, whitelist unknown | Query provider/request key; purchase remains pending, never complete |
| Payment committed, whitelist failed | Mark unfulfilled recovery; idempotent void/refund workflow |
| Late provider confirmation | Same whitelist/purchase transitions once; no duplicate instrument |
| Claim relands | Preserve receipts and append assigned review case; stop automatic loop |
| Cancellation cascade outage | Future capability disabled locally; rights persist; reconciliation retries |

Per-operation observability matrix:

| Op | Safe fields/metrics | SLO/test |
|---|---|---|
| SPL-07 | opId,templateVersion,useScale,state,fallback; `creator_listing_total` | p95 1 s; multi-payee/template/version tests |
| SPL-08 | opId,listingVersion,providerKey,state,recoveryClass; `creator_purchase_total` | p95 15 s provider; completion-without-confirmation pages |
| SPL-09 | opId,state,attempt,reasonClass; `content_claim_release_total` | p95 15 s; binding/reland/provider circuit tests |
| SPL-10 | opId,priorCapability,newCapability,preservedCounts; `subscription_cancel_total` | p95 2 s; any rights-revocation invariant pages |

Structured logs/Sentry omit channel, claim, token, evidence, price, payment, licence and owner-policy data. Alerts cover pending whitelist age, unfulfilled recovery, provider circuits, reland rate, outbox lag, and any cancellation-linked rights mutation.

## Release and Testing

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/recovery |
|---|---|---|---|
| SPL-07 | Fixed template/price and fallback variants | share standing, other-owner 404, strict CORS | competing listing edit one winner; B3 changes block activation |
| SPL-08 | complete only confirmed; pending/recovery exact | own proof, token isolation, exact ApiError | listing/proof/payment/provider races; replay one instrument |
| SPL-09 | release/explanation/escalation variants | instrument/channel/claim IDOR and redaction | late receipt/reland/replay stable |
| SPL-10 | future capability off and preserved counts | own subscriber, acknowledgment required | concurrent cancellation stable; provider outage preserves rights |

Zod property tests cover strictness and cross-field invariants. Handler/OpenAPI tests cover every status/schema/error. PostgreSQL tests cover constraints, indexes, RLS/grants, rollback, outbox, unique provider keys, and idempotency. Security tests cover CSRF/CORS, IDOR, vault/egress, service job scope, and event/log redaction.

Release schema/RLS/functions before contracts/handlers/workers/consumers. Provider feature flags default off. Rollback disables new commands/jobs without deleting listings, instruments, whitelists, claims, or grant history. Recovery scans pending whitelist/claim work, payment uncertainty, subscription reconciliation, and outbox gaps.

## Deepening Passes

- Integrity: purchase completion is mechanically equivalent to instrument plus confirmed whitelist; cancellation cannot reference a revocation action.
- Security: channel proof is separate from login; OAuth/provider references remain vault-scoped and purpose-limited.
- Concurrency: listing, proof, payment, instrument and provider keys have stable locks and replay semantics.
- Recovery: late confirmations, failed whitelist after payment, relanded claims, and cancellation outages have durable states.
- Operations: every route has contract, policy, error, telemetry, test, migration, and rollback coverage.

## Ambiguity Gate

**PASS.** Macro boundaries are explicit: Shard 20 owns instruments/clearance, providers own external state, subscription owns future capability, and this companion owns listing/purchase/provider reconciliation/claim history. Micro ambiguity is closed for all four operations across principal, CORS, validation, rate, idempotency, status/schema, 403/404, locks, persistence, event, SLO, and recovery. Provider disabled/late/failed states cannot become confirmation, and cancellation cannot revoke issued rights.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for Shard 21b; source split validated and ambiguity gate passed. |

## Dependency References

- [BE00 infrastructure](00-infrastructure.md)
- [Shard 21 IA](../ia/21-specialized-licensing.md)
- [Shard 20 licensing core](../ia/20-licensing-core.md)
- [Shard 10 rights ownership](../ia/10-rights-ownership.md)
