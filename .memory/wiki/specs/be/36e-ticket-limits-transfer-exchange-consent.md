# Ticket Limits, Transfer, Exchange & Consent — Backend Specification

**Status:** Complete

**IA source:** [Shard 36](../ia/36-box-office-risk.md)

**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 36e: optional accumulated-acquisition limits, tracked transfer/claim/reversal, face-value waitlist-first exchange, and named party/purpose consent |
| Included interactions | 36.18–36.21 |
| Included features | 19.09 Ticketing Fraud, Bot & Resale Controls; 19.10 Attendee Data Capture & Event-Party Consent |
| Canonical contracts | TransferTicket; ListFaceValueTicket; RecordPartyConsent |
| Canonical models | PurchaseLimitPolicy; TicketTransfer; ExchangeListing; PartyConsent |
| Boundary | Suspicion routes to review, never hidden auto-block; transfer does not restore acquisition allowance; exchange takes no margin; marketing consent is independent of transaction |

## Referenced Material Inventory

| Material | Source | Use |
|---|---|---|
| Limit/transfer/resale/consent decisions | [IA36 lines 7–44](../ia/36-box-office-risk.md#overview) | Accumulation, epochs, access acknowledgment, waitlist/face value, named consent |
| Features/criteria | [IA36 lines 46–77](../ia/36-box-office-risk.md#features) | 19.09/19.10 and AC-36.18–36.21 |
| Interactions | [IA36 lines 79–103](../ia/36-box-office-risk.md#interactions) | Configure/enforce, transfer, list/buy, consent |
| Contracts/models | [IA36 lines 105–170](../ia/36-box-office-risk.md#contracts) | Three canonical commands and four models |
| Roles/events/edges | [IA36 lines 172–272](../ia/36-box-office-risk.md#access-control) | Fan/fraud/named party, three events, access transfer, unsold, withdrawal |
| Dependencies | [IA36 lines 274–285](../ia/36-box-office-risk.md#cross-shard-dependencies) | BE00, IA06, IA33, IA35 |
| Global contract/security | [BE00 lines 112–500](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | ApiError, Zod 4, auth/CORS/idempotency/events/recovery |

## IA Source Map

| Op | Interaction | Result |
|---|---|---|
| 36.18 | Configure/enforce purchase limit | Versioned optional policy and pre-selection accumulated acquisition decision |
| 36.19 | Transfer ticket | Same ticket, changed holder, invalidated old epoch; reversible until claimed |
| 36.20 | List/buy face-value exchange | Waitlist-first listing and atomic buyer transfer/seller refund with no markup/margin |
| 36.21 | Capture/withdraw consent | Named party/purpose/text version grant/expiry/withdrawal and suppression propagation |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Interactions | 36.18 Configure/enforce purchase limit; 36.19 Transfer ticket; 36.20 List/buy face-value exchange; 36.21 Capture/withdraw consent |
| Contracts | TransferTicket; ListFaceValueTicket; RecordPartyConsent |
| Models | PurchaseLimitPolicy; TicketTransfer; ExchangeListing; PartyConsent |
| Events | ticketing.transfer.changed; ticketing.exchange.changed; ticketing.party_consent.changed |

## Endpoint Completeness Reconciliation

| Op | Responsibility | Durable effect |
|---|---|---|
| 36.18 | Configure policy or evaluate account’s append-only acquired/refunded/exchanged ledger before selection | purchase_limit_policy, acquisition_ledger_entry |
| 36.19 | Initiate/claim/revoke tracked transfer, validate access posture, rotate Shard35 ticket epoch | ticket_transfer and event |
| 36.20 | List/withdraw/buy at allowed basis, honor waitlist posture, atomically transfer/refund seller | exchange_listing, exchange_settlement and event |
| 36.21 | Grant/withdraw per fan/named party/purpose/channel/text; queue suppression/export notification | party_consent and event/job |

Transactional event notices do not require marketing consent. Buyer is never treated as every attendee. Recipient may consent after claim/transfer. Mandatory per-attendee personalization is not introduced.

## Shared Contract Inheritance

BE00 owns identity/session, request IDs, CORS/CSRF, idempotency/ETags, capability tokens, event/outbox, audit, jobs, privacy export/suppression primitives, errors, logs, and recovery.

~~~ts
type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};
~~~

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| 36.18 | POST /api/v1/ticketing/purchase-limit-decisions | Operator policy role or purchasing account | BE00-CORS-WEB-CREDENTIALLED | Configure/evaluate/release union, If-Match conditional | 120/min/account | Required 30d | 200/201 |
| 36.19 | POST /api/v1/ticketing/transfers | Current holder or intended recipient | BE00-CORS-WEB-CREDENTIALLED | Initiate/claim/revoke union, If-Match | 30/min/account | Required 30d | 201 |
| 36.20 | POST /api/v1/ticketing/exchange-actions | Current holder or eligible buyer | BE00-CORS-WEB-CREDENTIALLED | List/withdraw/buy union, If-Match | 30/min/account | Required 30d | 200/201 |
| 36.21 | POST /api/v1/ticketing/party-consents | Named fan/data subject | BE00-CORS-WEB-CREDENTIALLED | Grant/withdraw union, If-Match conditional | 60/min/fan | Required 30d | 201 |

All use BE00-CORS-WEB-CREDENTIALLED exact-origin credentialed CORS with POST, Content-Type, X-CSRF-Token, Idempotency-Key, and If-Match only. Wildcard/null origins are rejected.

### Operation Contract Matrix

| Op | Request | Success | Failure |
|---|---|---|---|
| 36.18 | PurchaseLimitRequest plus ConditionalVersionHeaders | PurchaseLimitResult | BE00 ApiError { code, message, requestId, details } |
| 36.19 | TransferTicketRequest plus VersionedHeaders | TransferTicketResult | BE00 ApiError { code, message, requestId, details } |
| 36.20 | ExchangeActionRequest plus VersionedHeaders | ExchangeActionResult | BE00 ApiError { code, message, requestId, details } |
| 36.21 | PartyConsentRequest plus ConditionalVersionHeaders | PartyConsentResult | BE00 ApiError { code, message, requestId, details } |

## Zod 4 Contracts

~~~ts
import {z} from "zod";
const Uuid=z.uuid(),Instant=z.iso.datetime({offset:true}),Version=z.int().positive(),Sha256=z.string().regex(/^[a-f0-9]{64}$/);
const Currency=z.string().regex(/^[A-Z]{3}$/),NonNegativeMoney=z.int().min(0).max(9_000_000_000_000_000);
const VersionedHeaders=z.object({
 "idempotency-key":z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
 "x-csrf-token":z.string().min(32).max(512),
 "if-match":z.string().regex(/^"[1-9][0-9]*"$/)
}).strict();
const ConditionalVersionHeaders=z.object({
 "idempotency-key":z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
 "x-csrf-token":z.string().min(32).max(512),
 "if-match":z.string().regex(/^"[1-9][0-9]*"$/).optional()
}).strict();

const LimitScope=z.object({eventId:Uuid,accountPartyId:Uuid}).strict();
export const PurchaseLimitRequest=z.discriminatedUnion("action",[
 z.object({
  action:z.literal("configure"),eventId:Uuid,
  enabled:z.boolean(),capUnits:z.int().min(1).max(100),
  basis:z.literal("accumulated_acquired_units"),
  policyVersion:z.string().min(1).max(100),
  disclosedTextVersion:z.string().min(1).max(100),
 }).strict(),
 z.object({
  action:z.literal("evaluate"),scope:LimitScope,requestedUnits:z.int().min(1).max(100),
  expectedPolicyVersion:Version,selectionRef:Uuid,
 }).strict(),
 z.object({
  action:z.literal("release_after_discharge"),scope:LimitScope,ticketId:Uuid,
  dischargeKind:z.enum(["verified_refund","completed_exchange"]),
  dischargeEvidenceRef:Uuid,
 }).strict()
]);
export const PurchaseLimitPolicySchema=z.object({
 policyId:Uuid,eventId:Uuid,enabled:z.boolean(),capUnits:z.int().min(1).max(100),
 basis:z.literal("accumulated_acquired_units"),policyVersion:z.string().min(1).max(100),
 disclosedTextVersion:z.string().min(1).max(100),state:z.enum(["active","disabled","superseded"]),
 version:Version,effectiveAt:Instant
}).strict();
export const PurchaseLimitResult=z.discriminatedUnion("action",[
 z.object({action:z.literal("configure"),policy:PurchaseLimitPolicySchema,replayed:z.boolean()}).strict(),
 z.object({
  action:z.literal("evaluate"),eventId:Uuid,accountPartyId:Uuid,
  acquiredUnits:z.int().min(0),releasedUnits:z.int().min(0),effectiveAcquiredUnits:z.int().min(0),
  requestedUnits:z.int().min(1),capUnits:z.int().min(1),
  decision:z.enum(["allow","limit_exceeded","review_signal"]),
  autoBlockedForCircumvention:z.literal(false),reservationToken:Uuid.nullable(),policyVersion:Version,replayed:z.boolean(),
 }).strict().superRefine((v,ctx)=>{
  if(v.effectiveAcquiredUnits!==v.acquiredUnits-v.releasedUnits)
   ctx.addIssue({code:"custom",path:["effectiveAcquiredUnits"],message:"must_equal_acquired_minus_released"});
  if((v.decision==="allow")!==(v.reservationToken!==null))
   ctx.addIssue({code:"custom",path:["reservationToken"],message:"reservation_required_only_when_allowed"});
  if(v.decision==="allow"&&v.effectiveAcquiredUnits+v.requestedUnits>v.capUnits)
   ctx.addIssue({code:"custom",path:["decision"],message:"allow_cannot_exceed_cap"});
 }),
 z.object({action:z.literal("release_after_discharge"),ledgerEntryId:Uuid,releasedUnits:z.int().positive(),replayed:z.boolean()}).strict()
]);

const AccessPosture=z.object({
 accessibleRouteRequired:z.boolean(),companionUnitIncluded:z.boolean(),currentSuitabilityNoticeVersion:z.string().min(1).max(100).nullable(),
 recipientAcknowledged:z.boolean(),disabilityProofCollected:z.literal(false)
}).strict().refine(v=>!v.accessibleRouteRequired||v.recipientAcknowledged,{message:"access_ack_required"});
export const TransferTicket=z.object({
 ticketId:Uuid,expectedTicketEpoch:Version,currentHolderPartyId:Uuid,
 transferMode:z.enum(["tracked_claim","static_signed_fallback"]),
 recipientDeliveryRef:Uuid,
 accessPosture:AccessPosture,
 policyVersion:z.string().min(1).max(100),
}).strict();
export const TransferTicketRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("initiate"),transfer:TransferTicket}).strict(),
 z.object({
  action:z.literal("claim"),transferId:Uuid,claimToken:z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
  recipientPartyId:Uuid,acceptedPolicyVersion:z.string().min(1).max(100),accessPosture:AccessPosture
 }).strict(),
 z.object({action:z.literal("revoke"),transferId:Uuid,reasonCode:z.enum(["sender_cancelled","delivery_failed","security_concern"])}).strict()
]);
export const TicketTransferSchema=z.object({
 transferId:Uuid,ticketId:Uuid,oldTicketEpoch:Version,newTicketEpoch:Version.nullable(),
 senderPartyId:Uuid,recipientPartyId:Uuid.nullable(),recipientDeliveryRef:Uuid,
 transferMode:z.enum(["tracked_claim","static_signed_fallback"]),
 accessPosture:AccessPosture,state:z.enum(["pending_claim","claimed","revoked","expired"]),
 claimTokenDigest:Sha256,initiatedAt:Instant,claimedAt:Instant.nullable(),version:Version,
}).strict().superRefine((v,ctx)=>{
 if((v.state==="claimed")!==(v.claimedAt!==null&&v.recipientPartyId!==null&&v.newTicketEpoch!==null))
  ctx.addIssue({code:"custom",path:["claimedAt"],message:"claimed_fields_required"});
});
export const TransferTicketResult=z.object({
 transfer:TicketTransferSchema,oldCredentialInvalidated:z.boolean(),
 acquisitionAllowanceRestored:z.literal(false),logisticsRecipientPartyId:Uuid.nullable(),
 changeNoticePayerIncluded:z.literal(true),changeNoticeHolderIncluded:z.literal(true),
 replayed:z.boolean()
}).strict();

export const ListFaceValueTicket=z.object({
 ticketId:Uuid,expectedTicketEpoch:Version,sellerPartyId:Uuid,
 originalAllInBasisMinor:NonNegativeMoney,currency:Currency,
 unavoidableProviderCostMinor:NonNegativeMoney,
 listingPriceMinor:NonNegativeMoney,
 posture:z.enum(["waitlist_first","public_after_waitlist"]),
 sellerConfirmedCostDisclosure:z.literal(true),
 policyVersion:z.string().min(1).max(100),
}).strict().superRefine((v,ctx)=>{
 if(v.listingPriceMinor>v.originalAllInBasisMinor)
  ctx.addIssue({code:"custom",path:["listingPriceMinor"],message:"price_exceeds_original_all_in_basis"});
});
export const ExchangeActionRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("list"),listing:ListFaceValueTicket}).strict(),
 z.object({action:z.literal("withdraw"),listingId:Uuid,sellerPartyId:Uuid}).strict(),
 z.object({
  action:z.literal("buy"),listingId:Uuid,buyerPartyId:Uuid,
  acceptedListingVersion:Version,acceptedTicketPriceMinor:NonNegativeMoney,
  acceptedProviderCostMinor:NonNegativeMoney,currency:Currency,
  waitlistEligibilityRef:Uuid.nullable(),
  paymentAuthorizationRef:Uuid
 }).strict()
]);
export const ExchangeListingSchema=z.object({
 listingId:Uuid,ticketId:Uuid,ticketEpoch:Version,sellerPartyId:Uuid,
 originalAllInBasisMinor:NonNegativeMoney,listingPriceMinor:NonNegativeMoney,
 unavoidableProviderCostMinor:NonNegativeMoney,currency:Currency,
 posture:z.enum(["waitlist_first","public_after_waitlist"]),
 state:z.enum(["listed_waitlist","listed_public","reserved","sold","withdrawn","expired","unsold"]),
 buyerPartyId:Uuid.nullable(),outcomeRef:Uuid.nullable(),version:Version,listedAt:Instant,
}).strict().refine(v=>v.listingPriceMinor<=v.originalAllInBasisMinor,{message:"price_must_not_exceed_basis"});
export const ExchangeActionResult=z.discriminatedUnion("action",[
 z.object({action:z.literal("list"),listing:ExchangeListingSchema,replayed:z.boolean()}).strict(),
 z.object({action:z.literal("withdraw"),listing:ExchangeListingSchema,ticketStillValid:z.literal(true),replayed:z.boolean()}).strict(),
 z.object({
  action:z.literal("buy"),listing:ExchangeListingSchema,newHolderPartyId:Uuid,newTicketEpoch:Version,
  sellerRefundObligationId:Uuid,buyerPlatformMarkupMinor:z.literal(0),platformMarginMinor:z.literal(0),
  atomic:z.literal(true),replayed:z.boolean()
 }).strict().refine(v=>v.listing.state==="sold",{message:"buy_result_requires_sold_listing"})
]);

const ConsentScope=z.object({
 fanPartyId:Uuid,eventId:Uuid,namedEventPartyId:Uuid,
 purpose:z.enum(["event_updates","post_event_feedback","artist_marketing","venue_marketing"]),
 channel:z.enum(["email","sms","push","in_app"]),
}).strict();
export const RecordPartyConsent=z.object({
 scope:ConsentScope,textVersion:z.string().min(1).max(100),
 policyDigest:Sha256,expiresAt:Instant.nullable(),
}).strict();
export const PartyConsentRequest=z.discriminatedUnion("action",[
 z.object({action:z.literal("grant"),consent:RecordPartyConsent,affirmativeActionAt:Instant}).strict(),
 z.object({action:z.literal("withdraw"),consentId:Uuid,scope:ConsentScope,withdrawnAt:Instant,reasonCode:z.enum(["fan_request","expired","policy_changed"])}).strict()
]);
export const PartyConsentSchema=z.object({
 consentId:Uuid,fanPartyId:Uuid,eventId:Uuid,namedEventPartyId:Uuid,
 purpose:z.enum(["event_updates","post_event_feedback","artist_marketing","venue_marketing"]),
 channel:z.enum(["email","sms","push","in_app"]),
 textVersion:z.string().min(1).max(100),policyDigest:Sha256,
 state:z.enum(["granted","withdrawn","expired"]),grantedAt:Instant,
 expiresAt:Instant.nullable(),withdrawnAt:Instant.nullable(),
 exportRef:Uuid.nullable(),version:Version,
}).strict().refine(v=>(v.state==="withdrawn")===(v.withdrawnAt!==null),{message:"withdrawal_time_required"});
export const PartyConsentResult=z.object({
 consent:PartyConsentSchema,suppressionJobId:Uuid.nullable(),recipientNotificationJobId:Uuid.nullable(),
 transactionStateChanged:z.literal(false),offPlatformDeletionGuaranteed:z.literal(false),replayed:z.boolean()
}).strict().superRefine((v,ctx)=>{
 const withdrawn=v.consent.state==="withdrawn";
 if(withdrawn!==(v.suppressionJobId!==null))
  ctx.addIssue({code:"custom",path:["suppressionJobId"],message:"required_only_for_withdrawal"});
 if(withdrawn!==(v.recipientNotificationJobId!==null))
  ctx.addIssue({code:"custom",path:["recipientNotificationJobId"],message:"required_only_for_withdrawal"});
});
~~~

### Deterministic invariants

| Op | Rule |
|---|---|
| 36.18 | Accumulated acquired units are append-only per account/show; transfer is not a release; only verified refund/completed exchange releases; suspicion returns review_signal, not hidden refusal |
| 36.19 | Pending tracked transfer is reversible; claim rotates same ticket epoch and invalidates old credential; accessible transfer needs route/companion notice acknowledgment without proof |
| 36.20 | Waitlist is offered first; listingPrice cannot exceed original all-in basis; unavoidable provider cost is disclosed before seller confirmation; platform markup/margin are zero |
| 36.21 | Consent requires exact named party/purpose/channel/text; withdrawal stops future platform use/export and notifies recipient but cannot guarantee off-platform deletion; decline never changes transaction |

## Authorization, Ownership, Disclosure

| Actor | Allowed | Denied |
|---|---|---|
| Purchasing account | Evaluate own limit; configure only with operator policy role | See signals/other accounts; gain allowance from transfer |
| Current holder | Initiate/revoke pending transfer; list/withdraw eligible ticket | Change payer/refund recipient or transfer scanned/locked ticket |
| Intended recipient | Claim exact transfer and acknowledge access posture | Browse sender/ticket account or claim another token |
| Eligible buyer | Buy exact available listing after waitlist posture | Pay markup or bypass allocation posture |
| Fan/data subject | Grant/withdraw own named consent | Consent for another attendee or be forced to consent |
| Named event party | Receive consented export/use under exact purpose | Transactional data, other party consents, unconsented marketing |
| Fraud/moderation | Case-scoped limit/exchange evidence | Automatic hidden block or broad attendee export |
| Support/admin | Purpose-bound recovery | Forge consent, claim, price, discharge, or policy |

Invisible policy/ticket/transfer/listing/consent is cause-invariant 404; visible denied action 403; step-up 401 after base auth. Claim tokens are opaque 256-bit values stored only as keyed digest. Ticket/contact/access details and limit signals are absent from logs/events except opaque IDs and bounded classes.

## Database Schema

Restricted ticketing_private; party FKs to platform_private.party(id). Shard35 ticket/product/manifest/payment refs and BE00 delivery/export refs are logical.

| Logical reference fields | Target or non-FK meaning | Enforcement |
|---|---|---|
| `purchase_limit_policy.event_id`, `acquisition_ledger_entry.event_id`, `party_consent.event_id` | Shard33 event/show aggregate UUID | Event/version seam and event-scoped command/RLS context |
| `acquisition_ledger_entry.ticket_id`, `ticket_transfer.ticket_id`, `exchange_listing.ticket_id` | Shard35 ticket aggregate UUID | Ticket/epoch seam validates event, holder, scan state, and version under one command lock |
| `acquisition_ledger_entry.evidence_ref` | Immutable Shard35 acquisition or verified-release evidence UUID | Entry-kind discriminator verifies purchase, completed exchange, or 36c discharge before allowance changes |
| `ticket_transfer.recipient_delivery_ref` | BE00 delivery job UUID | Digest-bound delivery acceptance is required before a claimable transfer is returned |
| `exchange_listing.outcome_ref` | `ticketing_private.exchange_settlement(id)` logical successor reference | Required exactly for `sold`; atomic command inserts settlement and updates listing while both rows are locked |
| `exchange_settlement.payment_authorization_ref` | Payment-provider authorization receipt UUID, deliberately opaque | Query-before-retry verifies listing, amount, currency, and idempotency key |
| `exchange_settlement.seller_refund_obligation_id` | 36c `ticketing_private.refund_obligation(id)` logical cross-companion reference | 36c command returns and verifies the seller obligation before settlement commits |
| `party_consent.export_ref`, `suppression_job_id`, `recipient_notification_job_id` | BE00 export, suppression, and delivery job UUIDs | Grant/withdraw command stores only digest-matched accepted jobs; withdrawal requires suppression and recipient notification refs |

~~~sql
CREATE TABLE ticketing_private.purchase_limit_policy (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL,enabled boolean NOT NULL,cap_units integer NOT NULL CHECK(cap_units BETWEEN 1 AND 100),
 basis text NOT NULL CHECK(basis='accumulated_acquired_units'),
 policy_version text NOT NULL CHECK(length(policy_version) BETWEEN 1 AND 100),
 disclosed_text_version text NOT NULL CHECK(length(disclosed_text_version) BETWEEN 1 AND 100),
 state text NOT NULL CHECK(state IN ('active','disabled','superseded')),
 version bigint NOT NULL CHECK(version>0),effective_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_id,version)
);
CREATE TABLE ticketing_private.acquisition_ledger_entry (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL,account_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 ticket_id uuid NOT NULL,entry_kind text NOT NULL CHECK(entry_kind IN ('acquired','released_verified_refund','released_completed_exchange')),
 units integer NOT NULL CHECK(units>0),evidence_ref uuid NOT NULL,
 transfer_restores_allowance boolean NOT NULL DEFAULT false CHECK(NOT transfer_restores_allowance),
 occurred_at timestamptz NOT NULL,version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_id,account_party_id,ticket_id,entry_kind)
);
CREATE TABLE ticketing_private.ticket_transfer (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 ticket_id uuid NOT NULL,old_ticket_epoch bigint NOT NULL CHECK(old_ticket_epoch>0),
 new_ticket_epoch bigint NULL CHECK(new_ticket_epoch IS NULL OR new_ticket_epoch>old_ticket_epoch),
 sender_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 recipient_party_id uuid NULL REFERENCES platform_private.party(id),recipient_delivery_ref uuid NOT NULL,
 transfer_mode text NOT NULL CHECK(transfer_mode IN ('tracked_claim','static_signed_fallback')),
 access_posture jsonb NOT NULL CHECK(jsonb_typeof(access_posture)='object'),
 claim_token_digest text NOT NULL UNIQUE CHECK(claim_token_digest ~ '^[a-f0-9]{64}$'),
 state text NOT NULL CHECK(state IN ('pending_claim','claimed','revoked','expired')),
 policy_version text NOT NULL CHECK(length(policy_version) BETWEEN 1 AND 100),
 initiated_at timestamptz NOT NULL,claimed_at timestamptz NULL,
 version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='claimed')=(recipient_party_id IS NOT NULL AND new_ticket_epoch IS NOT NULL AND claimed_at IS NOT NULL)),
 UNIQUE(ticket_id,old_ticket_epoch)
);
CREATE TABLE ticketing_private.exchange_listing (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 ticket_id uuid NOT NULL,ticket_epoch bigint NOT NULL CHECK(ticket_epoch>0),
 seller_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 original_all_in_basis_minor bigint NOT NULL CHECK(original_all_in_basis_minor>=0),
 listing_price_minor bigint NOT NULL CHECK(listing_price_minor BETWEEN 0 AND original_all_in_basis_minor),
 unavoidable_provider_cost_minor bigint NOT NULL CHECK(unavoidable_provider_cost_minor>=0),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 posture text NOT NULL CHECK(posture IN ('waitlist_first','public_after_waitlist')),
 seller_confirmed_cost_disclosure boolean NOT NULL DEFAULT true CHECK(seller_confirmed_cost_disclosure),
 state text NOT NULL CHECK(state IN ('listed_waitlist','listed_public','reserved','sold','withdrawn','expired','unsold')),
 buyer_party_id uuid NULL REFERENCES platform_private.party(id),outcome_ref uuid NULL,
 policy_version text NOT NULL CHECK(length(policy_version) BETWEEN 1 AND 100),
 version bigint NOT NULL CHECK(version>0),listed_at timestamptz NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='sold')=(buyer_party_id IS NOT NULL AND outcome_ref IS NOT NULL)),
 UNIQUE(ticket_id,ticket_epoch)
);
CREATE TABLE ticketing_private.exchange_settlement (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 listing_id uuid NOT NULL UNIQUE REFERENCES ticketing_private.exchange_listing(id),
 buyer_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 seller_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 payment_authorization_ref uuid NOT NULL,seller_refund_obligation_id uuid NOT NULL,
 ticket_price_minor bigint NOT NULL CHECK(ticket_price_minor>=0),
 provider_cost_minor bigint NOT NULL CHECK(provider_cost_minor>=0),
 buyer_platform_markup_minor bigint NOT NULL DEFAULT 0 CHECK(buyer_platform_markup_minor=0),
 platform_margin_minor bigint NOT NULL DEFAULT 0 CHECK(platform_margin_minor=0),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 state text NOT NULL CHECK(state IN ('committed','payment_uncertain','reversed')),
 committed_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ticketing_private.party_consent (
 id uuid PRIMARY KEY,owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 fan_party_id uuid NOT NULL REFERENCES platform_private.party(id),event_id uuid NOT NULL,
 named_event_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 purpose text NOT NULL CHECK(purpose IN ('event_updates','post_event_feedback','artist_marketing','venue_marketing')),
 channel text NOT NULL CHECK(channel IN ('email','sms','push','in_app')),
 text_version text NOT NULL CHECK(length(text_version) BETWEEN 1 AND 100),
 policy_digest text NOT NULL CHECK(policy_digest ~ '^[a-f0-9]{64}$'),
 state text NOT NULL CHECK(state IN ('granted','withdrawn','expired')),
 granted_at timestamptz NOT NULL,expires_at timestamptz NULL,withdrawn_at timestamptz NULL,
 export_ref uuid NULL,suppression_job_id uuid NULL,recipient_notification_job_id uuid NULL,
 version bigint NOT NULL CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='withdrawn')=(withdrawn_at IS NOT NULL)),
 UNIQUE(fan_party_id,event_id,named_event_party_id,purpose,channel,version)
);
~~~

PurchaseLimitPolicy, TicketTransfer, ExchangeListing, PartyConsent map exactly; support ledger/settlement makes enforcement atomic/auditable. Policy/ledger/consent histories are append-only. Transfer/listing state uses version-checked commands with immutable audit successors.

### Indexes/RLS/grants

| Tables | Indexes | RLS | Grants |
|---|---|---|---|
| purchase_limit_policy | (event_id,version DESC); active partial | operator policy role; purchase evaluator safe read | policy command; purchase worker read |
| acquisition_ledger_entry | (event_id,account_party_id,occurred_at); ticket/evidence | own account safe aggregate; fraud case scoped rows | acquisition command INSERT; no UPDATE/DELETE |
| ticket_transfer | ticket/epoch unique; sender/state; recipient/state; token digest | sender, claimed recipient, exact delivery worker | transfer command; token claim function only |
| exchange_listing | ticket/epoch; state/posture/listed; seller/buyer | seller; eligible buyer safe listing; fraud case | exchange command; waitlist worker safe read |
| exchange_settlement | listing unique; buyer/seller; state | buyer/seller own; finance exact settlement | atomic exchange function only |
| party_consent | (fan,event,party,purpose,channel,version DESC); party/state; expiry | fan/data subject; named party only granted projection | consent command; export/suppression worker exact scope |

All tables ENABLE/FORCE RLS. Context includes party/event/account/ticket/mandate/purpose/case/service. No direct client DML and no public DML; functions pin search_path/row_security and revoke PUBLIC.

### Retention and Deletion

- Purchase policies/acquisition ledger retain only opaque account/ticket refs through sale/refund/fraud-dispute retention; reviewed signals follow Shard06 case holds.
- Claim tokens expire and their keyed digests are deleted after claim/revoke plus abuse window; transfer history retains epochs/parties as required for ticket disputes.
- Unsold/withdrawn listings and failed reservations expire after configured exchange/support windows; completed settlement evidence follows fiscal retention.
- Consent grants/withdrawals/text digests persist for accountability; contact/export payloads are purpose-limited and deleted on expiry/withdrawal where lawful.

## State, Middleware, Flow, and Seams

| Aggregate | State | Invariant |
|---|---|---|
| Limit | active/disabled/superseded; ledger acquired/released | Transfer never releases; refund/exchange evidence does |
| Transfer | pending_claim → claimed or revoked/expired | Same ticket; claimed terminal; old epoch invalid |
| Listing | listed_waitlist → listed_public/reserved → sold or withdrawn/expired/unsold | Unsold/withdrawn ticket stays valid |
| Consent | granted → withdrawn/expired successor | Transaction unaffected; future use suppressed |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| 36.18 | first-party-write | policy operator or own account | 120/min/account | 64 KiB, conditional If-Match, 30d |
| 36.19 | first-party-write | holder/claim recipient | 30/min/account | 64 KiB, If-Match, 30d |
| 36.20 | first-party-write | holder/eligible buyer | 30/min/account | 128 KiB, If-Match, 30d |
| 36.21 | first-party-write | fan/data subject | 60/min/fan | 64 KiB, conditional If-Match, 30d |

Lock order event/account acquisition → ticket epoch → transfer/listing → consent scope → idempotency. Serializable retry twice 25/75 ms.

### Flows

| Op | Flow |
|---|---|
| 36.18 | configure appends policy; evaluate locks policy+ledger, calculates effective acquisitions, returns reservation or explicit limit/review; release verifies 36c discharge then appends release |
| 36.19 | initiate validates current holder/epoch/policy/access and stores token digest; claim locks transfer/ticket then rotates Shard35 epoch and holder atomically; revoke only pending |
| 36.20 | list validates unscanned/holder/basis/waitlist/cost disclosure; buy locks listing/ticket, verifies amounts, commits payment+epoch transfer+seller refund obligation atomically |
| 36.21 | grant validates named party/text/purpose and appends version; withdraw appends state and transactional suppression/recipient notification jobs |

### External seams

| Seam | Request → response | Timeout/retry/circuit |
|---|---|---|
| Shard35 ticket/epoch | {ticketId,epoch,purpose} → {holder,payer,event,scanState,accessPosture,allIn,currency,version} | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; mutation blocks |
| Shard35 epoch rotation | {ticketId,expectedEpoch,newHolder,idempotencyKey} → {sameTicketId,newEpoch,oldInvalidated} | Timeout 3,000 ms; query before 2 retries with 250/1,000 ms backoff; circuit opens for 60,000 ms after 5 consecutive failures; unknown holds transfer/exchange |
| 36c discharge/refund | verify {ticketId,dischargeRef,kind} → {verified,units}; create seller obligation → {obligationId,state} | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens for 60,000 ms after 5 consecutive failures; allowance/settlement does not commit without response |
| Waitlist | {eventId,productId,listingId,price,expiresAt} → {posture,eligibleBuyerRef,reservation} | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens for 60,000 ms after 5 consecutive failures; listing stays waitlist/unsold |
| Payment rail | {authorizationRef,amount,currency,idempotencyKey} → {state,receiptRef} | Timeout 10,000 ms; query before 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; payment_uncertain prevents duplicate |
| Consent export/suppression | {consentId,party,purpose,channel,state,version} → {jobId,recipientReceipt} | Timeout 5,000 ms; 3 retries with 5,000/30,000/180,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; withdrawal remains durable and retries |
| Shard06 case | {account/ticket/listing signals,casePurpose} → {caseRef,reviewState} | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; suspicion never auto-blocks |

## Event Contracts

~~~ts
export const TransferChangedEvent=z.object({
 ticketId:Uuid,transferId:Uuid,oldTicketEpoch:Version,newTicketEpoch:Version.nullable(),
 oldHolderPartyId:Uuid,newHolderPartyId:Uuid.nullable(),
 claimState:z.enum(["pending_claim","claimed","revoked","expired"]),
 accessAcknowledged:z.boolean(),version:Version,occurredAt:Instant
}).strict(); // ticketing.transfer.changed
export const ExchangeChangedEvent=z.object({
 listingId:Uuid,ticketId:Uuid,ticketEpoch:Version,
 priceBasisMinor:NonNegativeMoney,listingPriceMinor:NonNegativeMoney,providerCostMinor:NonNegativeMoney,currency:Currency,
 state:z.enum(["listed_waitlist","listed_public","reserved","sold","withdrawn","expired","unsold"]),
 outcomeRef:Uuid.nullable(),platformMarkupMinor:z.literal(0),version:Version,occurredAt:Instant
}).strict(); // ticketing.exchange.changed
export const PartyConsentChangedEvent=z.object({
 consentId:Uuid,fanPartyId:Uuid,eventId:Uuid,namedEventPartyId:Uuid,
 purpose:z.enum(["event_updates","post_event_feedback","artist_marketing","venue_marketing"]),
 channel:z.enum(["email","sms","push","in_app"]),textVersion:z.string().min(1).max(100),
 state:z.enum(["granted","withdrawn","expired"]),expiresAt:Instant.nullable(),version:Version,occurredAt:Instant
}).strict(); // ticketing.party_consent.changed
~~~

Events exclude claim tokens, contact destinations, access/disability details, fraud signals, payment refs, and consent export contents.

## Errors, Failure Recovery, Observability, Tests

| Op | BE00 ApiError { code, message, requestId, details } | Recovery |
|---|---|---|
| 36.18 | LIMIT_POLICY_CHANGED; ACQUISITION_LIMIT_EXCEEDED; RELEASE_NOT_VERIFIED; RESERVATION_CONFLICT | Refresh policy/ledger; suspicion opens review, no hidden block |
| 36.19 | TRANSFER_LOCKED; CLAIMED; ACCESS_ACK_REQUIRED; TICKET_EPOCH_CHANGED; CLAIM_TOKEN_INVALID | Correct acknowledgment/refresh; revoke pending only |
| 36.20 | TICKET_INELIGIBLE; PRICE_EXCEEDS_BASIS; WAITLIST_REQUIRED; LISTING_CHANGED; PAYMENT_UNCERTAIN | Correct/refresh; unsold ticket remains valid |
| 36.21 | PARTY_UNNAMED; PURPOSE_INVALID; TEXT_STALE; CONSENT_SCOPE_MISMATCH; ALREADY_WITHDRAWN | Select named party/current text; withdrawal replay stable |

### Exact per-operation HTTP error, message, and retry contract

Every failure is the BE00 envelope ApiError { code, message, requestId, details }. The code determines the HTTP status and exact public message; handlers may add only safe structured details and may not rewrite message text.

| Shared HTTP/code | Exact message binding |
|---|---|
| 400 VALIDATION_FAILED | “Request validation failed.” |
| 401 UNAUTHENTICATED | “Authentication is required.” |
| 409 IDEMPOTENCY_CONFLICT | “The idempotency key conflicts with a different request.” |
| 409 REQUEST_IN_PROGRESS | “The request is already in progress.” |
| 429 RATE_LIMITED | “Rate limit exceeded.” |
| 500 INTERNAL_ERROR | “An internal error occurred.” |
| 503 DEPENDENCY_UNAVAILABLE | “A required dependency is unavailable.” |
| 504 DEADLINE_EXCEEDED | “The operation deadline was exceeded.” |

| Op | Complete allowed HTTP status/application-code set | Exact operation-specific message bindings | Exact retry guidance |
|---|---|---|---|
| 36.18 | Shared 400, 401, 409, 429, 500, 503, 504; 403 FORBIDDEN; 404 EVENT_OR_POLICY_NOT_FOUND; 409 LIMIT_POLICY_CHANGED; 409 RESERVATION_CONFLICT; 422 ACQUISITION_LIMIT_EXCEEDED; 422 RELEASE_NOT_VERIFIED | FORBIDDEN = “Purchase-limit action is not permitted.”; EVENT_OR_POLICY_NOT_FOUND = “Event or purchase-limit policy was not found.”; LIMIT_POLICY_CHANGED = “Purchase-limit policy version changed.”; RESERVATION_CONFLICT = “Purchase-limit reservation conflicts with current acquisition state.”; ACQUISITION_LIMIT_EXCEEDED = “Accumulated acquisition limit is exceeded.”; RELEASE_NOT_VERIFIED = “Acquisition release is not verified.” | Transaction: initial attempt plus 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Configure/evaluate has external retry N/A (0); release verification uses 3 attempts total with 200 ms and 800 ms full-jitter caps only for timeout/connection/408/429/5xx. Client: at most 2 same-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits 1 replay after Retry-After up to 60 s. Retry is N/A (0) for 400/401/403/404/409/422 until policy, ledger, evidence, version, authority, or input changes. |
| 36.19 | Shared 400, 401, 409, 429, 500, 503, 504; 403 TRANSFER_FORBIDDEN; 404 TICKET_OR_TRANSFER_NOT_FOUND; 409 TRANSFER_LOCKED; 409 CLAIMED; 409 TICKET_EPOCH_CHANGED; 422 ACCESS_ACK_REQUIRED; 422 CLAIM_TOKEN_INVALID | TRANSFER_FORBIDDEN = “Ticket transfer is not permitted.”; TICKET_OR_TRANSFER_NOT_FOUND = “Ticket or transfer was not found.”; TRANSFER_LOCKED = “Ticket transfer is locked.”; CLAIMED = “Ticket transfer is already claimed.”; TICKET_EPOCH_CHANGED = “Ticket credential epoch changed.”; ACCESS_ACK_REQUIRED = “Accessible-transfer notice acknowledgment is required.”; CLAIM_TOKEN_INVALID = “Transfer claim token is invalid.” | Transaction: initial attempt plus exactly 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Epoch rotation: status query first, then at most 3 mutation attempts total with 250 ms and 1,000 ms full-jitter caps using the same idempotency key; retry only known-not-applied timeout/connection/408/429/5xx, while an ambiguous result remains pending and is queried rather than blindly retried. Client: at most 2 same-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits 1 replay after Retry-After up to 60 s. Retry is N/A (0) for 400/401/403/404/409/422 until holder, token, acknowledgment, transfer state, or epoch changes. |
| 36.20 | Shared 400, 401, 409, 429, 500, 503, 504; 403 EXCHANGE_FORBIDDEN; 404 TICKET_OR_LISTING_NOT_FOUND; 409 LISTING_CHANGED; 409 PAYMENT_UNCERTAIN; 422 TICKET_INELIGIBLE; 422 PRICE_EXCEEDS_BASIS; 422 WAITLIST_REQUIRED | EXCHANGE_FORBIDDEN = “Face-value exchange action is not permitted.”; TICKET_OR_LISTING_NOT_FOUND = “Ticket or exchange listing was not found.”; LISTING_CHANGED = “Exchange listing version changed.”; PAYMENT_UNCERTAIN = “Buyer payment outcome is uncertain.”; TICKET_INELIGIBLE = “Ticket is not eligible for exchange.”; PRICE_EXCEEDS_BASIS = “Listing price exceeds the allowed all-in basis.”; WAITLIST_REQUIRED = “Waitlist-first routing is required.” | Transaction: initial attempt plus exactly 2 serialization/deadlock retries with 25 ms and 75 ms full-jitter caps. Waitlist/discharge calls use 3 attempts total with 200 ms and 800 ms full-jitter caps. Payment performs a status query before at most 4 authorization attempts total with 1 s, 5 s, and 30 s full-jitter caps under the same idempotency key; ambiguous payment is not blindly retried. Client: at most 2 same-key replays with 250 ms and 1,000 ms full-jitter caps after no response/503/504; 429 permits 1 replay after Retry-After up to 60 s. Retry is N/A (0) for 400/401/403/404/409/422 until ticket/listing/waitlist/payment state, authority, or input changes. |

Failure recovery matrix:

| Failure | Recovery |
|---|---|
| Epoch rotation timeout | Query Shard35 before retry; state remains pending/uncertain, old credential truth authoritative |
| Buyer payment uncertain | Reserve expires only after provider query; never sell twice |
| Seller refund rail fails | Exchange remains committed only with durable obligation; 36c continues discharge |
| Listing unsold | State explicit; ticket remains valid/unscanned |
| Withdrawal export outage | Consent withdrawn locally, suppression jobs retry, party notified; no deletion guarantee |
| Outbox lag | Domain/outbox atomic; retry idempotently |

Per-operation observability matrix:

| Op | Safe fields/metric | SLO/tests |
|---|---|---|
| 36.18 | opId,action,enabled,decision,unitsClass,reviewSignal; limit_total | p95 300 ms evaluate; accumulation/transfer/release/race/auth tests |
| 36.19 | opId,action,mode,state,accessAck; transfer_total | p95 2 s claim; token/epoch/claim race/privacy tests |
| 36.20 | opId,action,posture,state,providerCostPresent; exchange_total | p95 3 s buy; price/waitlist/payment/atomicity tests |
| 36.21 | opId,action,purpose,channel,state; consent_total | p95 500 ms; named scope/text/withdrawal/transaction-independence tests |

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/recovery |
|---|---|---|---|
| 36.18 | Configure/evaluate/release equations and decisions | policy/account isolation, CORS, exact ApiError | policy/ledger race and replay; transfer gives no release |
| 36.19 | Initiate/claim/revoke rotates same ticket epoch | holder/recipient/token/access acknowledgment | two claims one winner; rotation uncertainty queried |
| 36.20 | List/withdraw/buy enforces basis/waitlist/zero margin | seller/buyer isolation and concealed listing | two buyers one winner; payment uncertainty no duplicate |
| 36.21 | Grant/withdraw exact named scope/text | fan-only, named party projection, CORS | withdrawal/expiry race; suppression retry idempotent |

Additional suites cover strict Zod/OpenAPI, every SQL check/index/FORCE-RLS role, property acquisition/price equations, token entropy/timing, accessible transfer without proof, outbox/event privacy, payment/provider fault injection, consent expiry/suppression, and load.

## Release, Migration, and Recovery

- Deploy policies/ledger/transfer/listing/consent tables, RLS/functions, token keys, and event schemas before routes.
- Tenant/event flags gate limits, static fallback, exchange, and party exports independently; disabling never invalidates a valid ticket or withdrawal.
- Rollback drains epoch/payment/refund/suppression jobs and preserves additive histories/events for prior clients.
- Recovery audits acquisition sums, epoch uniqueness, token revocation, price/zero-margin equations, seller obligations, consent suppression/export, RLS, and outbox age.

## Deepening Passes

| Pass | Evidence |
|---|---|
| Structural fraud controls | Accumulated acquisition, no transfer reset, verified release, review-not-auto-block |
| Transfer/exchange integrity | Same-ticket epochs, claim/revoke, access acknowledgment, waitlist-first, zero markup/margin, atomic settlement |
| Consent privacy | Named party/purpose/channel/text, expiry/withdrawal, independent transaction, bounded off-platform promise |
| Operations | Four IDs key route/contracts/CORS/auth/rate/errors/observability/tests and complete SQL/RLS/seams |

## Ambiguity Gate

**PASS.** Interactions 36.18–36.21, TransferTicket, ListFaceValueTicket, RecordPartyConsent, PurchaseLimitPolicy, TicketTransfer, ExchangeListing, PartyConsent, features 19.09/19.10, and all three canonical events reconcile exactly. Unique routes, strict contracts, per-operation policy/error/test matrices, typed persistence, external seams, and recovery are complete. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 36e backend contract | /write-be-spec | All |
| 2026-08-29 | Bound operations 36.18–36.20 to exact HTTP/code/message and retry contracts | D3/D6 remediation | Errors, Failure Recovery, Observability, Tests |

## Dependency References

- [BE00](00-infrastructure.md)
- [IA06](../ia/06-trust-safety.md)
- [IA33](../ia/33-show-day-operations.md)
- [IA35](../ia/35-ticket-products-sales.md)
- [36a](36a-door-replicas-scans-age.md)
- [36b](36b-boxoffice-counts-drops-walkup-close.md)
- [36c](36c-ticket-refunds-event-changes.md)
- [36d](36d-external-counts-attestation-reconciliation.md)
