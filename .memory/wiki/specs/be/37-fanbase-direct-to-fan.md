# Fanbase and Direct-to-Fan — Backend Specification

## Classification

- IA source: ../ia/37-fanbase-direct-to-fan.md
- Classification: backend required, single bounded domain.
- Runtime: Hono on Cloudflare Workers, TypeScript, Zod 4, Supabase PostgreSQL/Auth/Storage, Cloudflare Queues and Durable Objects where ordered dispatch is required.
- Trust boundary: Shard 37 owns fan-relationship facts, consent-derived contactability, campaign orchestration, direct-store commerce, memberships, vault benefits, follows, fan library, private demand, and provider-neutral virtual-event access. Shard 00 owns shared auth, idempotency, queue receipts, provider webhooks, audit, payment, storage, and global error contracts.

## Referenced Material Inventory

| Source | Locked material used |
|---|---|
| ../ia/37-fanbase-direct-to-fan.md | 37.01–37.24, canonical models, access rules, events, failure behavior, surface boundaries |
| 00-infrastructure.md | ApiError, auth context, mandate checks, CORS profiles, idempotency, queue/outbox, webhook receipts, audit and observability |
| ../ENGINEERING-STANDARDS.md | Zod-first contracts, deny-by-default authorization, structured logs, tests and migration rules |
| ../data-placement-strategy.md | PII isolation, Supabase placement, retention and disclosure constraints |

## IA Source Map

| IA range | Backend ownership |
|---|---|
| 37.01–37.05 | Observation, consent, preference, import and stewardship commands |
| 37.06–37.10 | Segment versioning and campaign compose/schedule/cancel |
| 37.11–37.17 | Storefront, checkout, fulfillment, membership, vault and tip |
| 37.18–37.24 | Interest pages, virtual events, follows, alerts, library, listening import and private show demand |

## Endpoint Completeness Reconciliation

Every IA interaction has one authoritative operation. Action enums cover reversible pairs such as grant/withdraw, join/cancel and follow/unfollow; no hidden mutation route exists.

| IA ID | Operation | Method | Path |
|---|---|---|---|
| 37.01 | Observe fan relationship | POST | /api/v1/internal/fanbase/observations |
| 37.02 | Grant or withdraw consent | POST | /api/v1/fanbase/entities/{entityId}/consents |
| 37.03 | Manage preferences | PUT | /api/v1/fanbase/entities/{entityId}/preferences |
| 37.04 | Import audience | POST | /api/v1/entities/{entityId}/audience-imports |
| 37.05 | Transfer entity stewardship | POST | /api/v1/entities/{entityId}/audience-stewardship-transfers |
| 37.06 | Define segment | POST | /api/v1/entities/{entityId}/fan-segments |
| 37.07 | Grant presale/benefit | POST | /api/v1/entities/{entityId}/fan-benefit-grants |
| 37.08 | Compose campaign | POST | /api/v1/entities/{entityId}/campaigns |
| 37.09 | Schedule/dispatch campaign | POST | /api/v1/entities/{entityId}/campaigns/{campaignId}/dispatches |
| 37.10 | Cancel campaign | POST | /api/v1/entities/{entityId}/campaigns/{campaignId}/cancellations |
| 37.11 | Browse storefront | GET | /api/v1/storefronts/{entitySlug} |
| 37.12 | Reserve and checkout | POST | /api/v1/storefronts/{entityId}/checkouts |
| 37.13 | Fulfill digital purchase | POST | /api/v1/internal/orders/{orderId}/digital-fulfillments |
| 37.14 | Fulfill physical/POD order | POST | /api/v1/internal/orders/{orderId}/physical-fulfillments |
| 37.15 | Join/cancel membership | POST | /api/v1/entities/{entityId}/memberships |
| 37.16 | Publish vault item | POST | /api/v1/entities/{entityId}/vault-items |
| 37.17 | Tip artist | POST | /api/v1/entities/{entityId}/tips |
| 37.18 | Publish campaign interest page | POST | /api/v1/entities/{entityId}/interest-campaigns |
| 37.19 | Join virtual fan event | POST | /api/v1/entities/{entityId}/virtual-events/{eventId}/joins |
| 37.20 | Follow/unfollow artist | PUT | /api/v1/follows/entities/{entityId} |
| 37.21 | Dispatch gig alert | POST | /api/v1/internal/fanbase/gig-alert-dispatches |
| 37.22 | Use fan library | GET | /api/v1/fan-library/entitlements/{entitlementId} |
| 37.23 | Import listening history | POST | /api/v1/fanbase/listening-imports |
| 37.24 | Request a show | POST | /api/v1/entities/{entityId}/show-requests |

## Shared Contract Inheritance

- All success responses include requestId; list-like embedded collections use opaque cursor and limit 1–100.
- All failures use the exact BE00/global `ApiError { code, message, requestId, details }` envelope. `code` is the registered application-code enum, `message` is the safe stable message, `requestId` is the request UUID, and `details` is either `null` or a strict bounded JSON allowlist for the declared error code. Provider bodies, contact coordinates, and identity candidates never enter details.
- Authenticated browser writes require SameSite session, Origin allowlist and CSRF double-submit. Anonymous browser-local follow uses an HttpOnly signed local key and cannot access fan PII.
- Mutation replay uses Idempotency-Key, 24-hour replay retention and request-hash conflict detection. Revisioned writes also require If-Match; mismatch is 412 REVISION_MISMATCH.
- Internal operations require service JWT audience, mTLS binding, producer allowlist and BE00 CORS deny.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 37](../ia/37-fanbase-direct-to-fan.md) | Interactions lines 89–117; Contracts lines 118–142; Data Models lines 143–213; Access Control lines 214–241; Event Schemas and Edge Cases lines 255–303 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 20.01 Fan Graph & Owned Audience | 37.01–37.05 |
| 20.02 Segmentation & Superfan Intelligence | 37.06–37.07 |
| 20.03 Broadcast & Fan Messaging | 37.08–37.10 and 37.21 |
| 20.04 Direct-to-Fan Storefront | 37.11–37.14 |
| 20.05 Memberships, Patronage & Campaigns | 37.15–37.18 |
| 20.06 Fan Experience & Discovery | 37.19–37.23 |
| 20.07 Fan Demand & Show Requests | 37.24 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Success | Auth and ownership | Idempotency / concurrency | Rate, cache, timeout, SLO | Middleware and CORS |
|---|---|---|---|---|---|---|---|
| 37.01 | POST | /api/v1/internal/fanbase/observations | 201/200 FanObservationV1 | registered producer; entity source binding | key required; source event unique; digest replay | 600/min producer; no-store; 2s; protected-command | BE00-CORS-DENY, service auth, strict body, producer policy |
| 37.02 | POST | /api/v1/fanbase/entities/{entityId}/consents | 201 ConsentStateV1 | verified fan controls channel; no admin grant | key; append-only authored-at ordering; withdrawal wins tie | 30/min fan/entity; no-store; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth/token, CSRF, channel proof |
| 37.03 | PUT | /api/v1/fanbase/entities/{entityId}/preferences | 200 FanPreferenceV1 | verified fan only | key plus If-Match; row CAS | 30/min; private max-age=0; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, strict body, owner RLS |
| 37.04 | POST | /api/v1/entities/{entityId}/audience-imports | 202 AudienceImportV1 | entity operator with fanbase.import mandate | key; file digest unique per entity; immutable row results | 5/hour entity; no-store; 500ms accept; async 15m | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, upload receipt |
| 37.05 | POST | /api/v1/entities/{entityId}/audience-stewardship-transfers | 202 StewardshipTransferV1 | current and incoming controllers; dual approval | key and entity version; serializable transfer lock | 2/day entity; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, mandate, dual-control |
| 37.06 | POST | /api/v1/entities/{entityId}/fan-segments | 201 SegmentDefinitionV1 | entity fanbase.segment.manage mandate | key; predicate checksum/version unique | 30/hour entity; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, typed-predicate validator |
| 37.07 | POST | /api/v1/entities/{entityId}/fan-benefit-grants | 202 BenefitGrantBatchV1 | entity benefit.manage; source authority | key; source/revision/fan unique; permanent grant never revoked by tier loss | 10/min entity; no-store; 500ms; async 5m | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, mandate, eligibility policy |
| 37.08 | POST | /api/v1/entities/{entityId}/campaigns | 201 CampaignRevisionV1 | entity campaign.manage | key plus If-Match on edit; immutable revision | 60/hour entity; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, content and link policy |
| 37.09 | POST | /api/v1/entities/{entityId}/campaigns/{campaignId}/dispatches | 202 CampaignDispatchV1 | campaign.manage plus approved revision | key and revision; recipient snapshot immutable; one attempt/channel | 20/hour entity; no-store; 500ms; async scheduled SLO | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, consent/suppression gate |
| 37.10 | POST | /api/v1/entities/{entityId}/campaigns/{campaignId}/cancellations | 200 CampaignV1 | campaign.manage | key plus If-Match; scheduled-to-cancelled CAS | 20/hour; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, entity ownership |
| 37.11 | GET | /api/v1/storefronts/{entitySlug} | 200 StorefrontV1 | public published projection only | safe read; projection revision ETag | 120/min IP bucket; public max-age=60; 1s; Tier 1 | BE00-CORS-PUBLIC-READ, strict path/query, bot budget |
| 37.12 | POST | /api/v1/storefronts/{entityId}/checkouts | 202 CheckoutV1 | fan session or verified guest channel; seller fixed by path | key; reservation serializable; payment intent unique | 20/min buyer; no-store; 1s accept; async 2m | BE00-CORS-WEB-CREDENTIALLED, auth/guest token, CSRF, inventory and price policy |
| 37.13 | POST | /api/v1/internal/orders/{orderId}/digital-fulfillments | 200 DigitalFulfillmentV1 | payment/outbox worker only | event ID key; paid transition and entitlement unique | 300/min worker; no-store; 5s; protected-command | BE00-CORS-DENY, service auth, payment receipt binding |
| 37.14 | POST | /api/v1/internal/orders/{orderId}/physical-fulfillments | 202 PhysicalFulfillmentV1 | fulfillment worker/provider receipt consumer | event ID key; shipment attempt unique | 300/min worker; no-store; 2s; async provider SLO | BE00-CORS-DENY, service auth/webhook receipt, address token scope |
| 37.15 | POST | /api/v1/entities/{entityId}/memberships | 201/200 MembershipV1 | verified fan; cancellation self-only | key; tier capacity serializable; state CAS | 20/min fan; no-store; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, capacity/payment policy |
| 37.16 | POST | /api/v1/entities/{entityId}/vault-items | 201 VaultItemV1 | entity vault.manage plus source/collaborator authority | key plus If-Match; asset version immutable | 30/hour entity; no-store; 5s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, rights scan, upload receipt |
| 37.17 | POST | /api/v1/entities/{entityId}/tips | 202 TipV1 | verified buyer; one seller/payee | key; payment intent unique; no entitlement write | 10/min buyer; no-store; 1s; async 2m | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, payment and message moderation |
| 37.18 | POST | /api/v1/entities/{entityId}/interest-campaigns | 201 InterestCampaignV1 | entity campaign.manage | key plus If-Match; non-monetary policy invariant | 20/hour entity; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, crowdfunding-language denylist |
| 37.19 | POST | /api/v1/entities/{entityId}/virtual-events/{eventId}/joins | 200 EventAccessLeaseV1 | eligible fan/membership; self only | key; qualifying revision snapshot; lease unique | 10/min fan; no-store; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, eligibility and provider policy |
| 37.20 | PUT | /api/v1/follows/entities/{entityId} | 200 FollowStateV1 | anonymous local key or verified fan | key; actor/entity unique; action revision CAS | 60/min actor; private no-store; 1s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth/local-key, CSRF, strict action |
| 37.21 | POST | /api/v1/internal/fanbase/gig-alert-dispatches | 202 GigAlertDispatchV1 | show-event consumer only | event ID key; subscription/event/channel unique | 600/min worker; no-store; 500ms; async 5m | BE00-CORS-DENY, service auth, producer allowlist, consent/geo gate |
| 37.22 | GET | /api/v1/fan-library/entitlements/{entitlementId} | 200 FanEntitlementV1 or 202 | owning fan only; all others 404 | safe read; entitlement version ETag; export job dedupe | 120/min fan; private max-age=30; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, owner RLS, signed-download policy |
| 37.23 | POST | /api/v1/fanbase/listening-imports | 202 ListeningImportV1 | verified fan and one-time source scope | key; source snapshot digest unique; no auto-follow | 3/day fan/source; no-store; 500ms; async 15m | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, source-token scope |
| 37.24 | POST | /api/v1/entities/{entityId}/show-requests | 201/200 DemandSignalV1 | fan/local key with coarse geo; self withdraw only | key; actor/entity/geo active signal unique | 10/day actor; no-store; 1s; privacy SLO | BE00-CORS-WEB-CREDENTIALLED, auth/local-key, CSRF, B2 disclosure deny |

## Request and Response Contracts — Zod 4

Unknown keys are rejected. UUIDs are canonical lowercase; timestamps are RFC 3339 UTC; money is integer minor units plus ISO-4217 currency; locale is BCP-47; coarse geo is approved market code and never precise coordinates.

| ID | Request schema and validation | Success schema |
|---|---|---|
| 37.01 | ObserveFanRequest { sourceEventId UUID, producer enum, entityId UUID, subjectEvidence discriminated union, occurredAt timestamp, sourceRevision uint } | FanObservationV1 { observationId, relationshipId nullable, resolutionState strong_linked/weak_quarantined/new, version } |
| 37.02 | ConsentCommand { action grant/withdraw, channel email/sms/push, purpose enum, channelProofId UUID, authoredAt timestamp } | ConsentStateV1 { eventId, effectiveAction, contactable boolean, ledgerVersion } |
| 37.03 | PreferencePut { frequency off/essential/weekly/all, channelOrder unique enum array max 3, locale, coarseGeo nullable } | FanPreferenceV1 { preferenceId, revision, effectiveAt } |
| 37.04 | AudienceImportCreate { uploadReceiptId UUID, format csv_v1/provider_v1, assertedProvenance enum, columnMap strict object } | AudienceImportV1 { importId, state queued, acceptedRows, quarantinedRows nullable } |
| 37.05 | StewardshipTransferCreate { incomingControllerId UUID, scope entity_only, reasonCode enum, currentApprovalId, incomingApprovalId } | StewardshipTransferV1 { transferId, state queued, effectiveRevision nullable } |
| 37.06 | SegmentCreate { name 1–120, predicate typed AST depth max 8/nodes max 100, explanation 1–500 } | SegmentDefinitionV1 { segmentId, version, predicateChecksum } |
| 37.07 | BenefitGrantCreate { benefitSourceId, sourceRevision, fanIds UUID array 1–1000, permanence permanent/while_eligible } | BenefitGrantBatchV1 { batchId, accepted, alreadyGranted, rejected } |
| 37.08 | CampaignCompose { campaignId nullable, content typed channel blocks, segmentVersionIds 1–20, localeFallbacks unique, sendPolicy strict } | CampaignRevisionV1 { campaignId, revisionId, revision, validationState } |
| 37.09 | CampaignDispatchCreate { revisionId, scheduledAt nullable, channelPriority unique, dryRun false } | CampaignDispatchV1 { dispatchId, state queued/scheduled, snapshotId } |
| 37.10 | CampaignCancel { reasonCode enum, requestedAt } | CampaignV1 { campaignId, state cancelled, revision } |
| 37.11 | StorefrontQuery { locale nullable, availability all/available/sold_out default all, cursor opaque nullable, limit default 24 and range 1–100 } | StorefrontV1 { store, listings, nextCursor, projectionVersion } |
| 37.12 | CheckoutCreate { variantLines 1–50 with positive quantity, buyerChannelToken, shippingToken nullable, acceptedTermsVersion } | CheckoutV1 { orderId, reservationExpiresAt, paymentClientSecret nullable, state } |
| 37.13 | DigitalFulfillmentCommand { paymentReceiptId, orderVersion, artifactManifestRevision } | DigitalFulfillmentV1 { orderId, entitlementIds, state fulfilled } |
| 37.14 | PhysicalFulfillmentCommand { providerReceiptId, orderVersion, shippingAddressToken, serviceLevel enum } | PhysicalFulfillmentV1 { orderId, fulfillmentId, state queued/provider_accepted } |
| 37.15 | MembershipCommand { action join/cancel, tierId, acceptedBenefitRevision nullable, cancellationEffectiveAt period_end/immediate nullable } | MembershipV1 { membershipId, state, effectiveAt, benefitRevision } |
| 37.16 | VaultItemPublish { sourceAssetId, assetRevision, title 1–160, tierRevisionIds 1–20, collaboratorAuthorityIds array } | VaultItemV1 { itemId, version, state published, grantJobId } |
| 37.17 | TipCreate { amountMinor positive bounded by currency policy, currency, paymentMethodToken, privateMessage nullable max 500 } | TipV1 { tipId, paymentState pending, messageState accepted/held } |
| 37.18 | InterestCampaignCreate { title, description, goalLabel, updatesEnabled, moneyFields forbidden } | InterestCampaignV1 { campaignId, version, state published } |
| 37.19 | VirtualEventJoin { membershipId nullable, accessCode nullable, deviceNonce 16–128 } | EventAccessLeaseV1 { leaseId, providerJoinToken, expiresAt, moderationState } |
| 37.20 | FollowPut { action follow/unfollow, durability browser_local/verified, alertOptIn boolean } | FollowStateV1 { followId nullable, following, durability, revision } |
| 37.21 | GigAlertDispatchCreate { showEventId, showRevision, artistEntityIds 1–20 } | GigAlertDispatchV1 { dispatchId, eligibleCount, suppressedCount, state queued } |
| 37.22 | FanLibraryQuery { format nullable, export boolean default false } | FanEntitlementV1 { entitlementId, artifact, formats, availability, manifest, exportJobId nullable } |
| 37.23 | ListeningImportCreate { source enum, oneTimeGrantId, dateRange max 5 years, artistScope nullable max 5000 } | ListeningImportV1 { importId, state queued, suggestionCount nullable } |
| 37.24 | ShowRequestCommand { action request/withdraw, coarseGeo, noteTag enum nullable } | DemandSignalV1 { signalId, active, recordedAt } |

### Cross-field and header rules

- 37.12 requires shippingToken only when any physical line exists; carts may contain one seller and one fulfillment currency. Name-your-price amount must meet the listing minimum captured in the immutable line snapshot.
- Bundle component notionals must be positive, sum to the captured bundle notional total, and remain immutable after the first settled order; partial refunds apportion by these values.
- 37.15 join requires current tier capacity and benefit revision; cancel never removes already permanent grants.
- 37.18 rejects amount, currency, pledge, reward-tranche, investment and ownership fields.
- 37.19 produces a short-lived single-event provider token; membership cancellation after admission does not revoke an already issued non-revoking lease.
- 37.20 anonymous follows cannot request durable alerts until channel verification and consent exist.
- 37.22 returns owned-but-unavailable when storage/CDN is impaired or a rendering is withdrawn; ownership is never inferred from listing visibility.

### Exact typed success schemas

Operation comments are the normative route mappings. Each response is a strict Zod 4 object; opaque credentials are bounded strings and private raw fan data is absent.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Cursor = z.string().min(1).max(512).nullable();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const OpaqueToken = z.string().min(32).max(2048);
const Artifact = z.object({ artifactId: Uuid, checksum: Digest, mediaType: z.string().min(1).max(128) }).strict();
// 37.01
export const FanObservationV1 = z.object({ observationId: Uuid, relationshipId: Uuid.nullable(), resolutionState: z.enum(["strong_linked", "weak_quarantined", "new"]), version: Version }).strict();
// 37.02
export const ConsentStateV1 = z.object({ eventId: Uuid, effectiveAction: z.enum(["grant", "withdraw"]), contactable: z.boolean(), ledgerVersion: Version }).strict();
// 37.03
export const FanPreferenceV1 = z.object({ preferenceId: Uuid, revision: Version, effectiveAt: Instant }).strict();
// 37.04
export const AudienceImportV1 = z.object({ importId: Uuid, state: z.literal("queued"), acceptedRows: z.int().nonnegative(), quarantinedRows: z.int().nonnegative().nullable() }).strict();
// 37.05
export const StewardshipTransferV1 = z.object({ transferId: Uuid, state: z.literal("queued"), effectiveRevision: Version.nullable() }).strict();
// 37.06
export const SegmentDefinitionV1 = z.object({ segmentId: Uuid, version: Version, predicateChecksum: Digest }).strict();
// 37.07
export const BenefitGrantBatchV1 = z.object({ batchId: Uuid, accepted: z.int().nonnegative(), alreadyGranted: z.int().nonnegative(), rejected: z.int().nonnegative() }).strict();
// 37.08
export const CampaignRevisionV1 = z.object({ campaignId: Uuid, revisionId: Uuid, revision: Version, validationState: z.enum(["valid", "warnings", "blocked"])}).strict();
// 37.09
export const CampaignDispatchV1 = z.object({ dispatchId: Uuid, state: z.enum(["queued", "scheduled"]), snapshotId: Uuid }).strict();
// 37.10
export const CampaignV1 = z.object({ campaignId: Uuid, state: z.literal("cancelled"), revision: Version }).strict();
const StorefrontListing = z.object({ listingId: Uuid, title: z.string().min(1).max(200), variantIds: z.array(Uuid).min(1).max(100), availability: z.enum(["available", "sold_out", "unavailable"]), price: z.object({ amountMinor: z.bigint(), currency: Currency }).strict() }).strict();
// 37.11
export const StorefrontV1 = z.object({ store: z.object({ entityId: Uuid, slug: z.string().regex(/^[a-z0-9-]{1,80}$/), displayName: z.string().min(1).max(160) }).strict(), listings: z.array(StorefrontListing).max(100), nextCursor: Cursor, projectionVersion: Version }).strict();
// 37.12
export const CheckoutV1 = z.object({ orderId: Uuid, reservationExpiresAt: Instant, paymentClientSecret: OpaqueToken.nullable(), state: z.literal("pending")}).strict();
// 37.13
export const DigitalFulfillmentV1 = z.object({ orderId: Uuid, entitlementIds: z.array(Uuid).min(1).max(1000), state: z.literal("fulfilled") }).strict();
// 37.14
export const PhysicalFulfillmentV1 = z.object({ orderId: Uuid, fulfillmentId: Uuid, state: z.enum(["queued", "provider_accepted"]) }).strict();
// 37.15
export const MembershipV1 = z.object({ membershipId: Uuid, state: z.enum(["active", "grace", "cancelled", "ended"]), effectiveAt: Instant, benefitRevision: Version }).strict();
// 37.16
export const VaultItemV1 = z.object({ itemId: Uuid, version: Version, state: z.literal("published"), grantJobId: Uuid }).strict();
// 37.17
export const TipV1 = z.object({ tipId: Uuid, paymentState: z.literal("pending"), messageState: z.enum(["accepted", "held"]) }).strict();
// 37.18
export const InterestCampaignV1 = z.object({ campaignId: Uuid, version: Version, state: z.literal("published") }).strict();
// 37.19
export const EventAccessLeaseV1 = z.object({ leaseId: Uuid, providerJoinToken: OpaqueToken, expiresAt: Instant, moderationState: z.enum(["standard", "restricted", "blocked"])}).strict();
// 37.20
export const FollowStateV1 = z.object({ followId: Uuid.nullable(), following: z.boolean(), durability: z.enum(["browser_local", "verified"]), revision: Version }).strict();
// 37.21
export const GigAlertDispatchV1 = z.object({ dispatchId: Uuid, eligibleCount: z.int().nonnegative(), suppressedCount: z.int().nonnegative(), state: z.literal("queued") }).strict();
// 37.22
export const FanEntitlementV1 = z.object({
  entitlementId: Uuid, artifact: Artifact, formats: z.array(z.enum(["stream", "download", "pdf", "archive"])).min(1).max(10),
  availability: z.enum(["available", "processing", "withdrawn", "expired"]),
  manifest: z.array(z.object({ artifactId: Uuid, checksum: Digest, bytes: z.int().nonnegative() }).strict()).max(1000), exportJobId: Uuid.nullable(),
}).strict();
// 37.23
export const ListeningImportV1 = z.object({ importId: Uuid, state: z.literal("queued"), suggestionCount: z.int().nonnegative().nullable() }).strict();
// 37.24
export const DemandSignalV1 = z.object({ signalId: Uuid, active: z.boolean(), recordedAt: Instant }).strict();
~~~

## Pagination and Limits

| Operation | Cursor, default/max page | Stable sort | Filter options |
|---|---|---|---|
| 37.11 | Opaque HMAC cursor binds public projection version, locale, availability filter, and last `(publishedAt,listingId)`; default 24, maximum 100 | `publishedAt DESC, listingId ASC` | `locale` and `availability=all|available|sold_out`; drafts, private variants, and retired listings are structurally excluded |

Changing locale/filter or projection version invalidates the cursor with `400 VALIDATION_FAILED`; callers restart from page one. The single-entitlement read 37.22 is not a list and has no pagination.

## Database Schema

All identifiers are uuid; created_at and updated_at are timestamptz UTC; money is bigint minor units. User-channel PII is referenced through Shard 00 opaque party/contact tokens and is absent from campaign, analytics and log tables.

### Canonical model registry

| Model | Typed fields, nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| fan_relationship | id PK; fan_party_id not null; artist_entity_id not null; lifecycle enum active/severed/deidentified; version bigint positive; severed_at nullable | unique fan_party_id,artist_entity_id; FK party/entity restrict; index entity,lifecycle | fan selects own; entity worker selects pseudonymous scoped rows; controller never receives cross-entity match |
| fan_observation | id PK; relationship_id nullable; source_event_id not null; producer not null; evidence_digest bytea not null; occurred_at not null; resolution_state enum; payload_ref encrypted token nullable | unique producer,source_event_id; FK relationship set null; index occurred_at and resolution_state | service insert; resolver select; no browser grant |
| identity_resolution_case | id PK; observation_id; evidence_strength enum; candidate_digest array; state quarantined/resolved/rejected; decided_at nullable; version | unique observation_id; FK observation cascade; index state,created_at | resolver and audited reviewer only; entity actors denied |
| consent_event | id PK; fan_party_id; artist_entity_id; channel enum; purpose enum; action grant/withdraw; authored_at; channel_proof_id; ledger_version | unique fan,entity,channel,purpose,authored_at,id; FK party/entity/proof; effective lookup index descending authored_at | fan inserts own verified instruction; workers read effective projection; entity admin cannot insert |
| fan_preference | id PK; fan_party_id; artist_entity_id; frequency enum; channel_order enum array; locale; coarse_geo nullable; provenance; revision | unique fan,entity; FK party/entity; index entity,coarse_geo using approved bucket | owner select/update; campaign reads policy projection only |
| audience_import | id PK; entity_id; upload_receipt_id; file_digest; provenance enum; state queued/processing/completed/completed_with_quarantine/failed; counts; version | unique entity,file_digest; FK entity/upload receipt; index entity,created_at | mandated operator metadata only; importer service rows; raw file denied after job |
| import_row | id PK; import_id; row_number positive; row_digest; resolution_state; quarantine_reason nullable; relationship_id nullable; suppression_checked_at | unique import_id,row_number; FK import cascade/relationship set null; index import,state | importer/reviewer only; no campaign or artist direct select |
| segment_definition | id PK; entity_id; name; version; predicate_json jsonb; predicate_checksum; explanation; created_by; superseded_at nullable | unique entity,id,version and entity,predicate_checksum,version; GIN predicate; FK entity/actor | mandated entity operator selects; evaluator reads active version |
| affinity_projection | fan_relationship_id; entity_id; rule_version; band enum; confidence numeric 0..1; factors_json; computed_at; expires_at | PK relationship,rule_version; FK relationship/entity; index entity,band; disposable TTL index | evaluator write; operators see aggregates only, never named cross-entity factors |
| campaign | id PK; entity_id; state draft/scheduled/dispatching/cancelled/completed; current_revision; version | unique entity,id; FK entity; index entity,state | campaign mandate CRUD; dispatch worker scoped read |
| campaign_revision | id PK; campaign_id; revision positive; content_json; audience_json; policy_json; checksum; created_by; immutable created_at | unique campaign,revision and checksum; FK campaign/actor | insert-only by mandate; worker reads referenced revision |
| recipient_snapshot | id PK; campaign_id; revision_id; fan_party_id; channel; consent_event_id; suppression_reason nullable; bucket_at; encrypted_destination_ref nullable | unique campaign,fan,channel; FK campaign/revision/consent; index campaign,suppression_reason | dispatch worker only; operator sees counts and sampled redacted reasons |
| delivery_attempt | id PK; snapshot_id; attempt_no positive; dedupe_key; provider_receipt nullable; outcome enum; error_class nullable; attempted_at | unique dedupe_key and snapshot_id,attempt_no; FK snapshot cascade; index outcome,attempted_at | service insert/read; aggregated operator projection |
| store | id PK; entity_id unique; slug case-insensitive unique; state draft/published/suspended; default_currency; version | FK entity; index slug,state | public published projection; mandate manages owned store |
| product_listing | id PK; store_id; kind enum; state draft/published/sold_out/retired; title; pricing_mode fixed/name_your_price; fixed_minor nullable; minimum_minor nullable; suggested_minor nullable; currency; terms_version; revision | FK store; constraints enforce pricing mode; index store,state | public published projection; seller mandate writes |
| product_variant | id PK; listing_id; sku; inventory_mode finite/unbounded/external; available_count nullable nonnegative; fulfillment_kind; revision | unique listing,sku; FK listing; index listing,available_count | public availability only; inventory worker/seller scoped write |
| bundle | id PK; listing_id unique; notional_total_minor positive; currency; locked_after_sale boolean | FK listing | follows listing policy; seller write before lock |
| bundle_component | id PK; bundle_id; ordinal positive; component_kind; source_id; notional_minor positive; immutable_after_sale | unique bundle,ordinal; FK bundle cascade; check sum enforced deferred trigger | follows bundle; no update after sold-order trigger |
| cart | id PK; buyer_party_id nullable; guest_session_hash nullable; store_id; currency; state open/converted/expired; expires_at; version | exactly one buyer identity; FK store/party; index expires_at | buyer/guest token only; seller denied buyer coordinates |
| reservation | id PK; cart_id; variant_id; quantity positive; unit_minor; terms_version; expires_at; state held/consumed/released | unique cart,variant; FK cart/variant; exclusion/locking inventory procedure | buyer metadata; inventory service writes |
| order | id PK; cart_id; buyer_party_id nullable; store_id; payment_owner_id; state pending/paid/partially_refunded/refunded/failed; fulfillment_state; currency; gross_minor; paid_net_terms_version; version | unique cart; FK cart/store/payment owner; index store,state | buyer sees own; seller sees redacted order; payment worker writes transitions |
| order_line | id PK; order_id; listing_id; variant_id; quantity; unit_minor; notional_minor; terms_snapshot jsonb; fulfillment_kind | FK order/listing/variant; index order | inherits order; immutable after payment |
| membership_tier | id PK; entity_id; revision; name; capacity nullable positive; benefits_json; price_minor; currency; state; terms_version | unique entity,id,revision; FK entity; index entity,state | published public projection; mandate writes immutable revisions |
| membership | id PK; fan_party_id; entity_id; tier_id; tier_revision; state active/grace/cancelled/ended; started_at; effective_end_at nullable; payment_subscription_ref nullable; version | unique active fan,entity,tier partial; FK party/entity/tier; index entity,state | fan sees own; entity sees redacted roster under mandate |
| vault_item | id PK; entity_id; source_asset_id; asset_revision; rights_digest; title; state draft/published/withdrawn; version | unique entity,source_asset_id,asset_revision; FK entity/asset seam; index entity,state | qualified fans through grant; mandate writes with rights proof |
| benefit_grant | id PK; fan_party_id; source_kind; source_id; source_revision; permanence permanent/while_eligible; granted_at; revoked_at nullable only while_eligible | unique fan,source_kind,source_id,source_revision; index fan,granted_at | fan sees own; grant worker insert; permanent update/delete denied |
| tip | id PK; fan_party_id; entity_id; payment_intent_id; amount_minor; currency; state pending/settled/refunded; encrypted_message_ref nullable; message_state | unique payment_intent_id; FK party/entity/payment seam; index entity,state | fan own; payee sees amount and moderated message only |
| interest_campaign | id PK; entity_id; title; description; goal_label; state draft/published/closed; version; policy_version | FK entity; JSON constraint forbids monetary keys; index entity,state | public published projection; mandate writes |
| campaign_interest | id PK; campaign_id; fan_party_id nullable; local_key_hash nullable; action interested/withdrawn; occurred_at | exactly one actor; unique current campaign,actor; FK campaign/party | actor own; entity aggregate only |
| virtual_event | id PK; entity_id; provider_key; external_event_ref encrypted; qualifying_tier_revision nullable; starts_at; ends_at; state | FK entity/tier; unique provider,event ref; index starts_at | published metadata public/member scoped; provider ref service only |
| event_access_lease | id PK; virtual_event_id; fan_party_id; membership_id nullable; qualifying_revision; token_digest; expires_at; moderation_state | unique event,fan; FK event/party/membership; index expires_at | fan own; provider gateway digest-only read |
| follow | id PK; entity_id; fan_party_id nullable; local_key_hash nullable; durability browser_local/verified; active; revision | exactly one actor; unique entity,actor; index entity,active | actor select/write; entity sees aggregate only |
| alert_subscription | id PK; follow_id; channel; consent_event_id; coarse_geo; active; revision | unique follow,channel; FK follow/consent; index coarse_geo,active | fan own; alert worker reads effective projection |
| fan_entitlement | id PK; fan_party_id; source_kind; source_id; artifact_id; grant_permanence; formats enum array; state owned/owned_unavailable/revoked_for_fraud; manifest_revision; version | unique fan,source_kind,source_id,artifact_id; index fan,state; FK party | fan own; fulfillment worker insert; listing/entity loss cannot delete |
| listening_import | id PK; fan_party_id; source; source_snapshot_digest; scope_json; state; imported_at nullable; expires_at; version | unique fan,source,digest; FK party; index state | fan and importer only; raw source deleted by retention job |
| follow_suggestion | id PK; import_id; artist_entity_id nullable; source_label_hash; confidence; state suggested/accepted/rejected/suppressed; reason | unique import,source_label_hash; FK import/entity; index import,state | fan own; never exposed to artist before accepted follow |
| demand_signal | id PK; fan_party_id nullable; local_key_hash nullable; entity_id; coarse_geo; active; note_tag nullable; created_at; withdrawn_at nullable | exactly one actor; unique active actor,entity,geo partial; index entity,geo only behind B2 gate | actor own; raw entity access denied; approved aggregate service only |

### Literal SQL type and nullability closure

This table is normative for migration generation and completes the field names in the registry above. Every omitted default is absent; every jsonb value is parsed with its named strict contract before insert. Relationships, query indexes, RLS policies, and grants remain exactly those in the adjacent canonical registry. Its compact constraint grammar is exact: `CHECK a/b/c` expands to `CHECK (column IN ('a','b','c'))`; `CHECK >0`, `CHECK >=0`, and `CHECK 0–1` expand against the immediately preceding column; `length n` expands to `CHECK (octet_length(column)=n)` for `bytea` and `CHECK (length(column)=n)` for text; `length a–b` is the inclusive text-length check; `object`, `array`, `nonempty`, `after X`, and `exactly one ...` expand to the corresponding `jsonb_typeof`, `cardinality`, comparison, and XOR `CHECK` expressions named by the row. These expansions are mandatory, not implementation suggestions.

| Model | Exact column declarations |
|---|---|
| fan_relationship | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; artist_entity_id uuid NOT NULL; lifecycle text NOT NULL CHECK lifecycle in active/severed/deidentified; version bigint NOT NULL CHECK >0; severed_at timestamptz NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL |
| fan_observation | id uuid PRIMARY KEY; relationship_id uuid NULL; source_event_id uuid NOT NULL; producer text NOT NULL length 1–80; evidence_digest bytea NOT NULL length 32; occurred_at timestamptz NOT NULL; resolution_state text NOT NULL CHECK strong_linked/weak_quarantined/new; payload_ref text NULL |
| identity_resolution_case | id uuid PRIMARY KEY; observation_id uuid NOT NULL; evidence_strength text NOT NULL CHECK strong/weak/insufficient; candidate_digest bytea[] NOT NULL DEFAULT empty; state text NOT NULL CHECK quarantined/resolved/rejected; decided_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL |
| consent_event | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; artist_entity_id uuid NOT NULL; channel text NOT NULL CHECK email/sms/push/in_app; purpose text NOT NULL CHECK marketing/gig_alerts/benefits/research; action text NOT NULL CHECK grant/withdraw; authored_at timestamptz NOT NULL; channel_proof_id uuid NOT NULL; ledger_version bigint NOT NULL CHECK >0 |
| fan_preference | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; artist_entity_id uuid NOT NULL; frequency text NOT NULL CHECK realtime/daily/weekly/none; channel_order text[] NOT NULL DEFAULT empty; locale text NOT NULL length 2–35; coarse_geo text NULL; provenance text NOT NULL CHECK fan_authored/import_confirmed/system_default; revision bigint NOT NULL CHECK >0 |
| audience_import | id uuid PRIMARY KEY; entity_id uuid NOT NULL; upload_receipt_id uuid NOT NULL; file_digest bytea NOT NULL length 32; provenance text NOT NULL CHECK first_party/licensed/consented_transfer; state text NOT NULL CHECK queued/processing/completed/completed_with_quarantine/failed; accepted_count integer NOT NULL DEFAULT 0 CHECK >=0; quarantined_count integer NOT NULL DEFAULT 0 CHECK >=0; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL |
| import_row | id uuid PRIMARY KEY; import_id uuid NOT NULL; row_number integer NOT NULL CHECK >0; row_digest bytea NOT NULL length 32; resolution_state text NOT NULL CHECK accepted/quarantined/suppressed; quarantine_reason text NULL; relationship_id uuid NULL; suppression_checked_at timestamptz NOT NULL |
| segment_definition | id uuid PRIMARY KEY; entity_id uuid NOT NULL; name text NOT NULL length 1–160; version bigint NOT NULL CHECK >0; predicate_json jsonb NOT NULL object; predicate_checksum bytea NOT NULL length 32; explanation text NOT NULL length 1–2000; created_by uuid NOT NULL; created_at timestamptz NOT NULL; superseded_at timestamptz NULL |
| affinity_projection | fan_relationship_id uuid NOT NULL; entity_id uuid NOT NULL; rule_version bigint NOT NULL CHECK >0; band text NOT NULL CHECK low/medium/high/unknown; confidence numeric(9,6) NOT NULL CHECK 0–1; factors_json jsonb NOT NULL array; computed_at timestamptz NOT NULL; expires_at timestamptz NOT NULL CHECK after computed_at; PRIMARY KEY fan_relationship_id,rule_version |
| campaign | id uuid PRIMARY KEY; entity_id uuid NOT NULL; state text NOT NULL CHECK draft/scheduled/dispatching/cancelled/completed; current_revision bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL |
| campaign_revision | id uuid PRIMARY KEY; campaign_id uuid NOT NULL; revision bigint NOT NULL CHECK >0; content_json jsonb NOT NULL object; audience_json jsonb NOT NULL object; policy_json jsonb NOT NULL object; checksum bytea NOT NULL length 32; created_by uuid NOT NULL; created_at timestamptz NOT NULL |
| recipient_snapshot | id uuid PRIMARY KEY; campaign_id uuid NOT NULL; revision_id uuid NOT NULL; fan_party_id uuid NOT NULL; channel text NOT NULL CHECK email/sms/push/in_app; consent_event_id uuid NOT NULL; suppression_reason text NULL; bucket_at timestamptz NOT NULL; encrypted_destination_ref text NULL |
| delivery_attempt | id uuid PRIMARY KEY; snapshot_id uuid NOT NULL; attempt_no integer NOT NULL CHECK >0; dedupe_key text NOT NULL; provider_receipt text NULL; outcome text NOT NULL CHECK accepted/confirmed/failed_retryable/failed_terminal/suppressed; error_class text NULL; attempted_at timestamptz NOT NULL |
| store | id uuid PRIMARY KEY; entity_id uuid NOT NULL; slug citext NOT NULL length 1–80; state text NOT NULL CHECK draft/published/suspended; default_currency char(3) NOT NULL ISO-4217; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL |
| product_listing | id uuid PRIMARY KEY; store_id uuid NOT NULL; kind text NOT NULL CHECK digital/physical/bundle/ticket/membership; state text NOT NULL CHECK draft/published/sold_out/retired; title text NOT NULL length 1–200; pricing_mode text NOT NULL CHECK fixed/name_your_price; fixed_minor bigint NULL CHECK >=0; minimum_minor bigint NULL CHECK >=0; suggested_minor bigint NULL CHECK >=0; currency char(3) NOT NULL; terms_version bigint NOT NULL CHECK >0; revision bigint NOT NULL CHECK >0 |
| product_variant | id uuid PRIMARY KEY; listing_id uuid NOT NULL; sku text NOT NULL length 1–100; inventory_mode text NOT NULL CHECK finite/unbounded/external; available_count integer NULL CHECK >=0; fulfillment_kind text NOT NULL CHECK digital/physical/none; revision bigint NOT NULL CHECK >0 |
| bundle | id uuid PRIMARY KEY; listing_id uuid NOT NULL UNIQUE; notional_total_minor bigint NOT NULL CHECK >0; currency char(3) NOT NULL; locked_after_sale boolean NOT NULL DEFAULT false |
| bundle_component | id uuid PRIMARY KEY; bundle_id uuid NOT NULL; ordinal integer NOT NULL CHECK >0; component_kind text NOT NULL CHECK listing/variant/artifact/benefit; source_id uuid NOT NULL; notional_minor bigint NOT NULL CHECK >0; immutable_after_sale boolean NOT NULL DEFAULT true |
| cart | id uuid PRIMARY KEY; buyer_party_id uuid NULL; guest_session_hash bytea NULL; store_id uuid NOT NULL; currency char(3) NOT NULL; state text NOT NULL CHECK open/converted/expired; expires_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; CHECK exactly one buyer identity |
| reservation | id uuid PRIMARY KEY; cart_id uuid NOT NULL; variant_id uuid NOT NULL; quantity integer NOT NULL CHECK >0; unit_minor bigint NOT NULL CHECK >=0; terms_version bigint NOT NULL CHECK >0; expires_at timestamptz NOT NULL; state text NOT NULL CHECK held/consumed/released |
| order | id uuid PRIMARY KEY; cart_id uuid NOT NULL; buyer_party_id uuid NULL; store_id uuid NOT NULL; payment_owner_id uuid NOT NULL; state text NOT NULL CHECK pending/paid/partially_refunded/refunded/failed; fulfillment_state text NOT NULL CHECK pending/partial/fulfilled/failed; currency char(3) NOT NULL; gross_minor bigint NOT NULL CHECK >=0; paid_net_terms_version bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL |
| order_line | id uuid PRIMARY KEY; order_id uuid NOT NULL; listing_id uuid NOT NULL; variant_id uuid NOT NULL; quantity integer NOT NULL CHECK >0; unit_minor bigint NOT NULL CHECK >=0; notional_minor bigint NOT NULL CHECK >=0; terms_snapshot jsonb NOT NULL object; fulfillment_kind text NOT NULL CHECK digital/physical/none |
| membership_tier | id uuid NOT NULL; entity_id uuid NOT NULL; revision bigint NOT NULL CHECK >0; name text NOT NULL length 1–160; capacity integer NULL CHECK >0; benefits_json jsonb NOT NULL array; price_minor bigint NOT NULL CHECK >=0; currency char(3) NOT NULL; state text NOT NULL CHECK draft/published/retired; terms_version bigint NOT NULL CHECK >0; PRIMARY KEY id,revision |
| membership | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; entity_id uuid NOT NULL; tier_id uuid NOT NULL; tier_revision bigint NOT NULL CHECK >0; state text NOT NULL CHECK active/grace/cancelled/ended; started_at timestamptz NOT NULL; effective_end_at timestamptz NULL; payment_subscription_ref text NULL; version bigint NOT NULL CHECK >0 |
| vault_item | id uuid PRIMARY KEY; entity_id uuid NOT NULL; source_asset_id uuid NOT NULL; asset_revision bigint NOT NULL CHECK >0; rights_digest bytea NOT NULL length 32; title text NOT NULL length 1–200; state text NOT NULL CHECK draft/published/withdrawn; version bigint NOT NULL CHECK >0 |
| benefit_grant | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; source_kind text NOT NULL CHECK membership/campaign/purchase/manual_governed; source_id uuid NOT NULL; source_revision bigint NOT NULL CHECK >0; permanence text NOT NULL CHECK permanent/while_eligible; granted_at timestamptz NOT NULL; revoked_at timestamptz NULL |
| tip | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; entity_id uuid NOT NULL; payment_intent_id uuid NOT NULL; amount_minor bigint NOT NULL CHECK >0; currency char(3) NOT NULL; state text NOT NULL CHECK pending/settled/refunded; encrypted_message_ref text NULL; message_state text NOT NULL CHECK accepted/held; created_at timestamptz NOT NULL |
| interest_campaign | id uuid PRIMARY KEY; entity_id uuid NOT NULL; title text NOT NULL length 1–200; description text NOT NULL length 1–4000; goal_label text NOT NULL length 1–160; state text NOT NULL CHECK draft/published/closed; version bigint NOT NULL CHECK >0; policy_version bigint NOT NULL CHECK >0 |
| campaign_interest | id uuid PRIMARY KEY; campaign_id uuid NOT NULL; fan_party_id uuid NULL; local_key_hash bytea NULL; action text NOT NULL CHECK interested/withdrawn; occurred_at timestamptz NOT NULL; CHECK exactly one actor |
| virtual_event | id uuid PRIMARY KEY; entity_id uuid NOT NULL; provider_key text NOT NULL; external_event_ref text NOT NULL; qualifying_tier_revision bigint NULL CHECK >0; starts_at timestamptz NOT NULL; ends_at timestamptz NOT NULL CHECK after starts_at; state text NOT NULL CHECK draft/published/live/ended/cancelled |
| event_access_lease | id uuid PRIMARY KEY; virtual_event_id uuid NOT NULL; fan_party_id uuid NOT NULL; membership_id uuid NULL; qualifying_revision bigint NOT NULL CHECK >0; token_digest bytea NOT NULL length 32; expires_at timestamptz NOT NULL; moderation_state text NOT NULL CHECK standard/restricted/blocked; created_at timestamptz NOT NULL |
| follow | id uuid PRIMARY KEY; entity_id uuid NOT NULL; fan_party_id uuid NULL; local_key_hash bytea NULL; durability text NOT NULL CHECK browser_local/verified; active boolean NOT NULL; revision bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; CHECK exactly one actor |
| alert_subscription | id uuid PRIMARY KEY; follow_id uuid NOT NULL; channel text NOT NULL CHECK email/sms/push/in_app; consent_event_id uuid NOT NULL; coarse_geo text NOT NULL; active boolean NOT NULL; revision bigint NOT NULL CHECK >0 |
| fan_entitlement | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; source_kind text NOT NULL; source_id uuid NOT NULL; artifact_id uuid NOT NULL; grant_permanence text NOT NULL CHECK permanent/while_eligible; formats text[] NOT NULL CHECK nonempty; state text NOT NULL CHECK owned/owned_unavailable/revoked_for_fraud; manifest_revision bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0 |
| listening_import | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; source text NOT NULL; source_snapshot_digest bytea NOT NULL length 32; scope_json jsonb NOT NULL object; state text NOT NULL CHECK queued/processing/completed/completed_with_quarantine/failed; imported_at timestamptz NULL; expires_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0 |
| follow_suggestion | id uuid PRIMARY KEY; import_id uuid NOT NULL; artist_entity_id uuid NULL; source_label_hash bytea NOT NULL length 32; confidence numeric(9,6) NOT NULL CHECK 0–1; state text NOT NULL CHECK suggested/accepted/rejected/suppressed; reason text NOT NULL length 1–500 |
| demand_signal | id uuid PRIMARY KEY; fan_party_id uuid NULL; local_key_hash bytea NULL; entity_id uuid NOT NULL; coarse_geo text NOT NULL; active boolean NOT NULL; note_tag text NULL; created_at timestamptz NOT NULL; withdrawn_at timestamptz NULL; CHECK exactly one actor and inactive iff withdrawn |

### Constraints, retention and deletion

- Append-only consent_event, campaign_revision, recipient_snapshot, delivery_attempt and permanent benefit_grant histories reject UPDATE and DELETE through database triggers; corrections append superseding facts.
- Imported raw audience and listening artifacts expire within 30 days; quarantined row evidence within 90 days unless a legal hold applies. Derived suppression hashes persist for compliance without retaining contact text.
- Payment, order, tax and grant records follow the longer statutory schedule from Shard 00. Fan deletion deidentifies relationship observations and demand while preserving legally required transaction facts.
- Every table enables RLS. PUBLIC, anon and authenticated receive no base-table grants except through security-invoker projections or RPCs named above. service_role is not used by request handlers; bounded Worker roles receive table-specific SELECT/INSERT/UPDATE grants.

## State Machines and Transaction Rules

| Aggregate | Allowed transitions | Rejected or recovery behavior |
|---|---|---|
| audience_import | queued → processing → completed/completed_with_quarantine/failed | retry resumes from row checkpoint; a digest replay returns original batch |
| campaign | draft → scheduled → dispatching → completed; draft/scheduled → cancelled | cancellation stops undispatched buckets; already accepted provider sends resolve normally |
| order/payment | pending → paid → partially_refunded/refunded; pending → failed | payment receipt commits order, entitlements and outbox atomically; reconciliation repairs receipt-after-timeout |
| membership | active → grace → active/ended; active/grace → cancelled → ended | capacity release and effective end share one serializable transaction |
| vault item | draft → published → withdrawn | withdrawal blocks new grants but preserves permanent grants and audit |
| interest campaign | draft → published → closed | any monetary-field attempt fails validation and writes nothing |
| listening import | queued → processing → completed/completed_with_quarantine/failed | no suggestion becomes a follow without 37.20 confirmation |
| relationship | active → severed → deidentified | severance fails contactability closed and never migrates fans across entity owners |

- Checkout locks variants in stable UUID order, creates reservations and captures price/terms snapshots in one serializable transaction. Expiry release is idempotent.
- Consent evaluation locks the fan/entity/channel/purpose key; later authored_at wins, and equal timestamps resolve withdrawal before grant, then UUID lexical order.
- Campaign scheduling creates the immutable recipient snapshot and outbox atomically. Workers never re-evaluate into a broader audience; late withdrawal suppresses at the final send gate.
- Stewardship transfer never copies relationships to a different entity. It changes authorized controller mappings after both approvals and creates an audit event under the same entity boundary.

## Middleware and Policies

Order is request ID → trusted proxy normalization → CORS/preflight → auth/service binding → CSRF for browser writes → body and header size → strict Zod parse → rate/abuse → mandate/ownership/RLS → idempotency/If-Match → handler → response schema → audit/log redaction.

| Operation group | Authentication | Authorization and concealment | CORS |
|---|---|---|---|
| 37.01, 37.13, 37.14, 37.21 | service JWT, mTLS and registered producer/receipt | source, audience and receipt must bind; browser receives 404 | BE00-CORS-DENY |
| 37.02, 37.03, 37.15, 37.17, 37.19, 37.22, 37.23 | verified fan session; recent step-up for source/payment changes | own subject only; other subject 404 | BE00-CORS-WEB-CREDENTIALLED |
| 37.04–37.10, 37.16, 37.18 | entity session plus named mandate; step-up on import/transfer/dispatch | entity mismatch 404; known resource without capability 403 | BE00-CORS-WEB-CREDENTIALLED |
| 37.11 | none | published projection only | BE00-CORS-PUBLIC-READ |
| 37.12, 37.20, 37.24 | session or signed scoped guest/local token | token-bound actor/entity only | BE00-CORS-WEB-CREDENTIALLED |

Abuse controls combine actor, entity, IP reputation and provider budgets without storing raw IP beyond the BE00 rotating abuse token. Campaign anti-spam, checkout inventory, tips, listening import, virtual-event joins and show requests have independent circuit budgets. Logs contain IDs, policy versions, outcome classes, durations and counts only.

## Data Flow, Concurrency and External Seams

| Seam | Request / response | Deadline, retry and circuit | Failure contract |
|---|---|---|---|
| email/SMS/push provider | normalized delivery request → provider receipt | connect 500ms, total 2s; 3 retries at 1s/5s/30s with jitter; circuit opens after 10 failures/30s for 60s | attempt becomes retryable or suppressed; campaign remains resumable; no destination in logs |
| payment owner | SinglePayeeSettlementV1 request → accepted receipt | 3s; 2 retries 2s/10s; circuit 5 failures/30s, half-open 60s | local pending order/tip persists; receipt reconciliation prevents double settlement |
| print/POD and carrier | order-line manifest plus opaque address token → fulfillment receipt | 5s; 4 retries 5s/30s/2m/10m; circuit by provider for 5m | order remains paid/fulfillment_delayed; digital bundle component remains available |
| storage/CDN | artifact manifest/sign request → short signed URL | 2s; 2 retries 100ms/500ms; circuit 10 failures/30s for 30s | library returns owned_unavailable or 202 export job; entitlement is preserved |
| virtual-event provider | event/fan lease claim → short join token | 3s; 2 retries 250ms/1s; circuit 5 failures/min for 2m | lease persists without raw provider token; client receives PROVIDER_UNAVAILABLE |
| listening source | one-time grant and scope → snapshot receipt | 10s; 3 retries 5s/30s/2m; circuit per source for 10m | import stays queued/failed_retryable; grant is revoked after terminal read |
| content/link/rights policy | typed content/assets → allow/hold/deny with policy version | 2,000 ms/attempt; 2 total attempts with one 200 ms full-jitter cap; retry timeout, connection reset, 408/429/5xx; terminal allow/hold/deny, invalid asset, policy-version mismatch, auth/schema, non-429 4xx; circuit opens after 5 retryable failures/30s for 30s, admits one half-open policy probe, closes after two successes, and reopens on failure | Fail closed: campaign/vault remains draft or held; no dispatch/publication and no stale-policy fallback |

Queue consumers use at-least-once delivery, receipt ID dedupe, lease expiry, exponential retry capped at 15 minutes and poison quarantine after 8 attempts. Every external side effect follows a committed local outbox; callbacks enter only through BE00 verified receipt handling.

### Exact retryability and circuit closure

Attempt totals include the initial attempt. Each delay is a full-jitter cap chosen uniformly from zero through that cap. Unless stated otherwise, half-open admits one probe at a time, closes after two consecutive successful probes, and reopens for the full interval after a retryable probe failure.

| Seam | Exact attempts and retry classification | Circuit open, half-open, and fallback |
|---|---|---|
| Email/SMS/push provider | Connect deadline 500 ms and total deadline 2,000 ms per attempt; 4 attempts total; retry caps 1 s, 5 s, and 30 s. Retry only known-no-effect timeout/connection failure, 408, 429, 5xx, or provider-declared retryable receipt; invalid destination/policy, auth/schema failure, non-429 4xx, suppression, and ambiguous acceptance are terminal for blind send. | Open after 10 retryable failures in 30 s for 60 s; half-open performs one receipt-status probe before one new delivery. Fallback keeps the campaign resumable and marks the attempt retryable or suppressed without logging a destination. |
| Payment owner | 3,000 ms per attempt; 3 attempts total; retry caps 2 s then 10 s using the same settlement idempotency key. Retry known-not-sent timeout/connection failure, 408, 429, 5xx, or provider-declared retryable state; ambiguous send, accepted/declined receipt, auth/schema failure, and non-429 4xx are terminal for blind settlement. | Open after 5 retryable failures in 30 s for 60 s; half-open performs one receipt reconciliation probe before one new settlement. Fallback preserves local pending order/tip and never double-settles. |
| Print/POD and carrier | 5,000 ms per attempt; 5 attempts total; retry caps 5 s, 30 s, 2 min, and 10 min with the same order-line idempotency key. Retry known-not-accepted timeout/connection failure, 408, 429, 5xx, and provider-declared retryable fulfillment state; invalid manifest/address token, auth/schema failure, non-429 4xx, and ambiguous acceptance are terminal for blind creation. | Provider circuit opens after 5 retryable failures in 60 s for 5 min; half-open performs one order-status probe before one create. Fallback leaves the order paid/fulfillment_delayed while digital bundle access remains available. |
| Storage/CDN | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. Retry timeout, connection reset, 408, 429, and 5xx; invalid manifest, ownership denial, digest/signature/schema failure, and non-429 4xx are terminal. | Open after 10 retryable failures in 30 s for 30 s; one half-open sign/status probe. Fallback returns owned_unavailable or a 202 export job and preserves entitlement. |
| Virtual-event provider | 3,000 ms per attempt; 3 attempts total; retry caps 250 ms then 1 s. Retry known-no-token timeout/connection failure, 408, 429, and 5xx; invalid lease/event/fan scope, auth/schema failure, non-429 4xx, and ambiguous token issuance are terminal for blind issuance. | Open after 5 retryable failures in 60 s for 2 min; half-open performs one lease/token-status probe. Fallback preserves the lease without raw provider token and returns PROVIDER_UNAVAILABLE. |
| Listening source | 10,000 ms per attempt; 4 attempts total; retry caps 5 s, 30 s, and 2 min. Retry timeout, connection reset, 408, 429, 5xx, or source-declared retryable cursor state; invalid/withdrawn grant, scope mismatch, auth/schema failure, and non-429 4xx are terminal. | Per-source circuit opens after 5 retryable failures in 60 s for 10 min; one half-open snapshot probe. Fallback leaves import queued/failed_retryable; terminal read revokes the one-time grant. |
| Content/link/rights policy | 2,000 ms per attempt; 2 attempts total; retry cap 200 ms. Retry timeout, connection reset, 408, 429, and 5xx; allow/hold/deny decision, invalid asset, policy-version mismatch, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open policy probe. Fallback fails writes closed, leaves campaign/vault draft or held, and performs no dispatch/publication. |
| Queue consumers | 30,000 ms handler deadline; 8 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min. Retry transient dependency/DB availability, serialization/deadlock, handler timeout, and retryable 5xx. Invalid signature/schema/digest, unsupported version, auth denial, invariant failure, and equal-version digest conflict are terminal and quarantined. | Open the consumer event-type partition after 20 retryable failures in 60 s for 60 s; one half-open event probe. Open retains the durable event; attempt 8 moves it to poison quarantine/DLQ with alert and preserves last verified local state. |

## Event and Consumer Contracts

All events carry eventId UUID, eventType literal, schemaVersion 1, aggregateId, aggregateVersion, occurredAt, producer, traceId and payload. Partition key is aggregateId; consumers reject future schemas, no-op equal versions, quarantine digest conflicts and ignore stale versions.

| Event | Producer | Required payload | Consumers, delivery and dedupe |
|---|---|---|---|
| fan.relationship.observed.v1 | 37.01 | observation ID, entity, source, occurred-at, resolution state | resolver/audit; at-least-once; producer plus source event |
| fan.consent.changed.v1 | 37.02 | fan, entity, channel, purpose, action, authored-at, ledger version | campaign/alert/suppression; fan-entity-purpose-version |
| fan.relationship.severed.v1 | relationship worker | relationship, reason class, effective-at | consent/dispatch/privacy; relationship-version |
| fan.segment.versioned.v1 | 37.06 | entity, segment, version, predicate checksum | evaluator/campaign; segment-version |
| campaign.scheduled.v1 | 37.09 | campaign, immutable revision, buckets, audience snapshot | dispatch worker/audit; campaign-revision |
| campaign.delivery.resolved.v1 | dispatch worker | campaign, fan, channel or suppression reason, dedupe key | operator aggregates/compliance; dedupe key |
| store.order.settled.v1 | payment receipt consumer | order, fan, entity, lines, paid-net terms version | fulfillment/library/finance; order-version |
| membership.state.changed.v1 | 37.15/payment worker | membership, old/new state, effective-at, reason | capacity/vault/event access; membership-version |
| vault.benefit.granted.v1 | grant worker | fan, item, membership/tier revision, permanence | library/notifications; fan-item-source revision |
| virtual_event.access.granted.v1 | 37.19 | event, fan, membership, lease expiry, moderation state | provider gateway/audit; event-fan-lease |
| fan.follow.changed.v1 | 37.20 | fan/local key, entity, durability, action | alert subscription/private demand; actor-entity-revision |
| show.onsale.announced.v1 | Shard 35/36 producer | event, artist entities, venue geo, on-sale-at | 37.21 resolver; event-revision |
| fan.entitlement.granted.v1 | 37.07/37.13 | fan, artifact, source, permanence, formats | library/download gateway; fan-source-artifact |

## Error Handling

| ID | Expected status and ApiError codes | Recovery and disclosure |
|---|---|---|
| 37.01 | 400 VALIDATION_FAILED; 401 SERVICE_AUTH_REQUIRED; 409 SOURCE_EVENT_CONFLICT; 422 EVIDENCE_UNRESOLVED | weak evidence returns successful quarantine; digest conflict alerts producer |
| 37.02 | 400 CHANNEL_PROOF_INVALID; 401 AUTH_REQUIRED; 409 IDEMPOTENCY_CONFLICT; 503 CONSENT_LEDGER_UNAVAILABLE | fail closed; withdrawal may retry safely |
| 37.03 | 400 VALIDATION_FAILED; 404 ENTITY_NOT_FOUND; 412 REVISION_MISMATCH | refetch current preference and resubmit |
| 37.04 | 400 IMPORT_MAPPING_INVALID; 403 CAPABILITY_REQUIRED; 409 IMPORT_DIGEST_EXISTS; 413 PAYLOAD_TOO_LARGE | row errors appear only in authorized quarantine report |
| 37.05 | 400 APPROVAL_INVALID; 403 STEP_UP_REQUIRED; 409 TRANSFER_IN_PROGRESS; 412 REVISION_MISMATCH | no controller mapping changes before atomic completion |
| 37.06 | 400 PREDICATE_INVALID; 403 CAPABILITY_REQUIRED; 409 SEGMENT_VERSION_CONFLICT | details identify safe AST path only |
| 37.07 | 400 ELIGIBILITY_INVALID; 403 SOURCE_AUTHORITY_REQUIRED; 409 GRANT_CONFLICT | already-granted is replay success; per-fan rejects are redacted |
| 37.08 | 400 CONTENT_INVALID; 403 CAPABILITY_REQUIRED; 409 IDEMPOTENCY_CONFLICT; 412 REVISION_MISMATCH; 422 RIGHTS_HELD | retain draft; policy version is returned |
| 37.09 | 400 REVISION_NOT_APPROVED; 403 STEP_UP_REQUIRED; 409 CAMPAIGN_STATE_CONFLICT; 412 REVISION_MISMATCH; 503 CONSENT_GATE_UNAVAILABLE | no snapshot/dispatch on gate failure |
| 37.10 | 404 CAMPAIGN_NOT_FOUND; 409 CAMPAIGN_ALREADY_TERMINAL; 412 REVISION_MISMATCH | repeated cancel returns current cancelled state |
| 37.11 | 404 STOREFRONT_NOT_FOUND; 429 RATE_LIMITED; 503 PROJECTION_UNAVAILABLE | no draft or owner detail disclosed |
| 37.12 | 400 CART_INVALID; 404 LISTING_NOT_FOUND; 409 INVENTORY_UNAVAILABLE/PRICE_CHANGED; 422 TERMS_NOT_ACCEPTED; 503 PAYMENT_UNAVAILABLE | release reservation on terminal failure; return current safe price revision |
| 37.13 | 401 SERVICE_AUTH_REQUIRED; 404 ORDER_NOT_FOUND; 409 ORDER_NOT_PAID/RECEIPT_CONFLICT; 503 STORAGE_UNAVAILABLE | paid order persists; outbox retry |
| 37.14 | 400 ADDRESS_TOKEN_INVALID; 409 ORDER_NOT_PAID/FULFILLMENT_CONFLICT; 503 PROVIDER_UNAVAILABLE | paid order becomes fulfillment_delayed; reconcile receipt |
| 37.15 | 400 MEMBERSHIP_ACTION_INVALID; 404 TIER_NOT_FOUND; 409 TIER_CAPACITY_FULL/STATE_CONFLICT; 503 PAYMENT_UNAVAILABLE | no capacity leak; cancellation replay succeeds |
| 37.16 | 400 ASSET_INVALID; 403 RIGHTS_AUTHORITY_REQUIRED; 409 VERSION_CONFLICT; 422 RIGHTS_HELD; 503 STORAGE_UNAVAILABLE | item stays draft; prior published version remains |
| 37.17 | 400 TIP_INVALID; 404 ENTITY_NOT_FOUND; 422 MESSAGE_HELD; 503 PAYMENT_UNAVAILABLE | message hold does not change settlement; payment replay safe |
| 37.18 | 400 MONETARY_FIELD_FORBIDDEN; 403 CAPABILITY_REQUIRED; 409 VERSION_CONFLICT | request writes nothing |
| 37.19 | 401 AUTH_REQUIRED; 403 NOT_ELIGIBLE; 404 EVENT_NOT_FOUND; 409 EVENT_NOT_JOINABLE; 503 PROVIDER_UNAVAILABLE | valid lease may be retried without duplicate admission |
| 37.20 | 400 ACTION_INVALID; 401 LOCAL_KEY_INVALID; 404 ENTITY_NOT_FOUND; 409 REVISION_CONFLICT | browser-local state never becomes durable implicitly |
| 37.21 | 401 SERVICE_AUTH_REQUIRED; 409 EVENT_DIGEST_CONFLICT; 422 NO_ELIGIBLE_RECIPIENTS; 503 CONSENT_GATE_UNAVAILABLE | zero eligible is successful no-op when policy suppression explains all |
| 37.22 | 401 AUTH_REQUIRED; 404 ENTITLEMENT_NOT_FOUND; 409 FORMAT_UNAVAILABLE; 429 RATE_LIMITED; 503 ARTIFACT_UNAVAILABLE | owned-but-unavailable response preserves ownership; export retries |
| 37.23 | 400 SOURCE_SCOPE_INVALID; 403 STEP_UP_REQUIRED; 409 SNAPSHOT_EXISTS; 429 IMPORT_LIMIT; 503 SOURCE_UNAVAILABLE | no auto-follow; terminal job revokes source grant |
| 37.24 | 400 GEO_INVALID; 401 LOCAL_KEY_INVALID; 404 ENTITY_NOT_FOUND; 409 SIGNAL_STATE_CONFLICT; 403 AGGREGATE_DISCLOSURE_GATED | repeated action returns current private signal; no public count |

No handler throws a raw provider or database error. Hono maps recognized domain errors to the exact envelope, unknown errors to 500 INTERNAL_ERROR, timeouts to 503 DEPENDENCY_TIMEOUT and admission budgets to 429 RATE_LIMITED with Retry-After.

## Failure Cascades and Recovery

- Consent ledger, suppression cache or identity resolution uncertainty fails campaign and alert dispatch closed; it never guesses contactability.
- Provider acceptance after client timeout is reconciled by local idempotency key and provider receipt; the local aggregate remains pending until verified.
- A mixed digital/physical bundle grants digital entitlement after paid settlement even when POD is delayed; refunds apportion independently using immutable component notionals.
- Rights loss or entity departure withdraws future vault access/public listing while permanent paid or explicitly permanent entitlements remain in the fan library.
- Queue poison payloads enter encrypted quarantine with error class and digest, not contact or message content. Replay requires an audited operator capability and original schema registration.

## Observability, Rate and Privacy

Metrics: request latency/status by operation, policy denials, CAS conflicts, import quarantine rate, consent-gate failures, recipient suppression categories, delivery retries, checkout reservation expiry, entitlement availability, membership capacity conflicts and provider circuit state. Alerts fire on consent bypass attempts, duplicate settlement digests, unexplained recipient growth, quarantine spikes, grant revocation attempts and event-version conflicts.

Logs include requestId, traceId, operation ID, aggregate ID, actor class, entity ID, policy/rule version, idempotency outcome, status, duration and safe error code. They exclude contact destinations, IP, user agent, identity evidence, private messages, predicate membership, listening history, precise location, provider tokens and signed URLs.

## Testing Strategy

| ID | Contract and happy path | Authorization / failure / concurrency oracle |
|---|---|---|
| 37.01 | valid producer appends and replays same observation | browser denied; weak evidence quarantines; conflicting digest 409 |
| 37.02 | grant then withdrawal computes withdrawal | admin cannot grant; equal-time withdrawal wins; ledger outage writes nothing |
| 37.03 | owner CAS updates preference | cross-fan 404; stale If-Match 412; invalid channel order 400 |
| 37.04 | accepted file processes valid/quarantined rows | mandate denied; suppression checked; digest replay same batch |
| 37.05 | dual approval transfers same-entity stewardship | one approval denied; concurrent transfer serializes; no relationship copy |
| 37.06 | typed predicate versions and evaluates | unknown field/deep AST rejected; prior version immutable |
| 37.07 | eligible permanent and conditional grants emitted | authority denied; duplicate replay; permanent revoke trigger fails |
| 37.08 | valid typed content creates immutable revision | rights hold leaves draft; stale revision 412; unsafe link denied |
| 37.09 | approved revision snapshots then dispatches once | late withdrawal suppresses; cancellation race leaves no unsent delivery |
| 37.10 | scheduled campaign cancels idempotently | unauthorized concealed; terminal completion cannot revert |
| 37.11 | public storefront paginates stable projection | drafts hidden; malformed cursor 400; ETag 304 |
| 37.12 | reservation captures immutable price and terms | oversell race yields one winner; price/terms change 409; expiry releases |
| 37.13 | paid order grants one permanent entitlement | unpaid denied; receipt replay; storage outage retains entitlement |
| 37.14 | physical order queues provider once | invalid address token denied; provider timeout reconciles without duplicate |
| 37.15 | capacity join and period-end cancellation | last-slot race one winner; permanent benefits survive end |
| 37.16 | authorized asset publishes and grants | collaborator authority denied; scan outage retains prior published item |
| 37.17 | one-payee tip settles without entitlement | message held safely; payment replay; amount/currency bounds |
| 37.18 | non-monetary interest page publishes | every monetary key rejected; state CAS; no Shard crowdfunding model |
| 37.19 | eligible fan receives short lease | cross-fan denied; provider circuit; post-admission cancellation non-revoking |
| 37.20 | anonymous and durable follow actions round-trip | forged local key denied; no implicit consent; revision race |
| 37.21 | on-sale event resolves consented coarse-geo subscribers | unregistered producer denied; event replay; consent outage closed |
| 37.22 | owner streams/downloads/exports manifest | cross-owner 404; delisted artifact remains owned; CDN outage 202/unavailable |
| 37.23 | one-time source produces private suggestions | no auto-follow; rejected suggestion suppressed; source token revoked |
| 37.24 | private request/withdraw is idempotent | no public count; coarse-geo validation; B2 aggregate route absent |

Database tests run with anon, authenticated fan, entity operator and every bounded Worker role. They prove RLS and grants deny base-table leakage, append-only triggers reject mutation, retention deletes source artifacts but not compliance hashes, serialization prevents oversell/capacity leaks, and outbox/event rows commit atomically.

## Deepening Passes

- Micro: consent precedence, browser-local versus verified follows, permanent versus conditional grants, paid ownership versus availability, bundle notional refund math and non-monetary interest language are explicit.
- Macro: identity, auth, payment, provider receipts, storage and shared queue controls remain BE00; Shards 35/36 own show/on-sale source facts; Shard 37 owns only fan-directed projections and reactions.
- Security: PII never enters audience predicates, events, logs or public projections; anti-differencing blocks private demand aggregation until the B2 policy gate is formally activated.
- Failure: every external seam has a deadline, finite retry, circuit state, local pending/recovery state and verified reconciliation path.
- Two-implementer: operation IDs, routes, schemas, status/error codes, table types, RLS/grants, transitions, middleware, CORS, delivery semantics and test oracles are deterministic.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 37.01 | `be_http_requests_total{operation_id="37.01",outcome,code}`, `be_http_latency_seconds{operation_id="37.01"}`, and `be_operation_recovery_total{operation_id="37.01",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.02 | `be_http_requests_total{operation_id="37.02",outcome,code}`, `be_http_latency_seconds{operation_id="37.02"}`, and `be_operation_recovery_total{operation_id="37.02",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.03 | `be_http_requests_total{operation_id="37.03",outcome,code}`, `be_http_latency_seconds{operation_id="37.03"}`, and `be_operation_recovery_total{operation_id="37.03",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.04 | `be_http_requests_total{operation_id="37.04",outcome,code}`, `be_http_latency_seconds{operation_id="37.04"}`, and `be_operation_recovery_total{operation_id="37.04",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.05 | `be_http_requests_total{operation_id="37.05",outcome,code}`, `be_http_latency_seconds{operation_id="37.05"}`, and `be_operation_recovery_total{operation_id="37.05",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.06 | `be_http_requests_total{operation_id="37.06",outcome,code}`, `be_http_latency_seconds{operation_id="37.06"}`, and `be_operation_recovery_total{operation_id="37.06",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.07 | `be_http_requests_total{operation_id="37.07",outcome,code}`, `be_http_latency_seconds{operation_id="37.07"}`, and `be_operation_recovery_total{operation_id="37.07",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.08 | `be_http_requests_total{operation_id="37.08",outcome,code}`, `be_http_latency_seconds{operation_id="37.08"}`, and `be_operation_recovery_total{operation_id="37.08",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.09 | `be_http_requests_total{operation_id="37.09",outcome,code}`, `be_http_latency_seconds{operation_id="37.09"}`, and `be_operation_recovery_total{operation_id="37.09",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.10 | `be_http_requests_total{operation_id="37.10",outcome,code}`, `be_http_latency_seconds{operation_id="37.10"}`, and `be_operation_recovery_total{operation_id="37.10",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.11 | `be_http_requests_total{operation_id="37.11",outcome,code}`, `be_http_latency_seconds{operation_id="37.11"}`, and `be_operation_recovery_total{operation_id="37.11",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.12 | `be_http_requests_total{operation_id="37.12",outcome,code}`, `be_http_latency_seconds{operation_id="37.12"}`, and `be_operation_recovery_total{operation_id="37.12",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.13 | `be_http_requests_total{operation_id="37.13",outcome,code}`, `be_http_latency_seconds{operation_id="37.13"}`, and `be_operation_recovery_total{operation_id="37.13",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.14 | `be_http_requests_total{operation_id="37.14",outcome,code}`, `be_http_latency_seconds{operation_id="37.14"}`, and `be_operation_recovery_total{operation_id="37.14",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.15 | `be_http_requests_total{operation_id="37.15",outcome,code}`, `be_http_latency_seconds{operation_id="37.15"}`, and `be_operation_recovery_total{operation_id="37.15",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.16 | `be_http_requests_total{operation_id="37.16",outcome,code}`, `be_http_latency_seconds{operation_id="37.16"}`, and `be_operation_recovery_total{operation_id="37.16",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.17 | `be_http_requests_total{operation_id="37.17",outcome,code}`, `be_http_latency_seconds{operation_id="37.17"}`, and `be_operation_recovery_total{operation_id="37.17",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.18 | `be_http_requests_total{operation_id="37.18",outcome,code}`, `be_http_latency_seconds{operation_id="37.18"}`, and `be_operation_recovery_total{operation_id="37.18",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.19 | `be_http_requests_total{operation_id="37.19",outcome,code}`, `be_http_latency_seconds{operation_id="37.19"}`, and `be_operation_recovery_total{operation_id="37.19",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.20 | `be_http_requests_total{operation_id="37.20",outcome,code}`, `be_http_latency_seconds{operation_id="37.20"}`, and `be_operation_recovery_total{operation_id="37.20",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.21 | `be_http_requests_total{operation_id="37.21",outcome,code}`, `be_http_latency_seconds{operation_id="37.21"}`, and `be_operation_recovery_total{operation_id="37.21",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.22 | `be_http_requests_total{operation_id="37.22",outcome,code}`, `be_http_latency_seconds{operation_id="37.22"}`, and `be_operation_recovery_total{operation_id="37.22",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.23 | `be_http_requests_total{operation_id="37.23",outcome,code}`, `be_http_latency_seconds{operation_id="37.23"}`, and `be_operation_recovery_total{operation_id="37.23",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 37.24 | `be_http_requests_total{operation_id="37.24",outcome,code}`, `be_http_latency_seconds{operation_id="37.24"}`, and `be_operation_recovery_total{operation_id="37.24",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

- Micro ambiguity: PASS — all 24 interactions have concrete contracts, errors, state rules and tests.
- Macro ambiguity: PASS — Shard 37 ownership and every upward/downward dependency seam are explicit.
- Devil's-advocate check: PASS — no path can grant consent administratively, reveal cross-artist identities, auto-follow from imports, expose show-demand counts, revoke permanent entitlements, oversell inventory or create crowdfunding semantics.
- Source contradiction check: PASS — local follows remain non-contactable until verified consent; paid ownership is independent of listing and delivery availability.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend specification for IA Shard 37 |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure contracts](00-infrastructure.md)
- [IA Shard 37](../ia/37-fanbase-direct-to-fan.md)
- [Engineering standards](../ENGINEERING-STANDARDS.md)
- [Data placement strategy](../data-placement-strategy.md)
