# Promotion and Marketing — Backend Specification

## Classification

- IA source: ../ia/38-promotion-marketing.md.
- Backend required; single promotion boundary covering campaign planning, dated cascades, professional pitching, suppression, smart links, pre-save, advisory paid promotion, creator seeding, social publishing, coverage, event marketing, ticket attribution, EPKs and embargo/exclusives.
- Runtime: Hono/Cloudflare Workers, TypeScript, Zod 4, Supabase PostgreSQL/RLS/Storage, Cloudflare Queues, Durable Objects for atomic target-budget leases, and BE00 provider/webhook/audit services.
- Non-negotiable boundaries: no pay-for-airplay; uncertain promotion offers fail closed; private CRM never becomes a public directory; anchor changes require preview then commit; public clicks use short-retention first-party measurement; conversion type is labeled observed/correlated/modelled; B2 targeting remains disabled.

## Referenced Material Inventory

| Source | Locked material |
|---|---|
| ../ia/38-promotion-marketing.md | 38.01–38.28, models, events, readiness, pitch, link, attribution, disclosure and embargo rules |
| 00-infrastructure.md | ApiError, auth, CORS, idempotency, credential vault, jobs, verified receipts, audit and telemetry |
| ../ENGINEERING-STANDARDS.md | strict contracts, security, testing, migrations and logging |
| ../data-placement-strategy.md | protected contact, token, measurement and export boundaries |

## Endpoint Completeness Reconciliation

| IA ID | Operation | Method | Path |
|---|---|---|---|
| 38.01 | Create campaign | POST | /api/v1/promotion/campaigns |
| 38.02 | Inspect readiness | GET | /api/v1/promotion/campaigns/{campaignId}/readiness |
| 38.03 | Plan content beats | POST | /api/v1/promotion/campaigns/{campaignId}/beats |
| 38.04 | Preview date cascade | POST | /api/v1/promotion/campaigns/{campaignId}/anchor-previews |
| 38.05 | Commit anchor change | POST | /api/v1/promotion/campaigns/{campaignId}/anchor-changes |
| 38.06 | Assemble DSP pitch | POST | /api/v1/promotion/campaigns/{campaignId}/dsp-pitches |
| 38.07 | Compose direct pitch | POST | /api/v1/promotion/campaigns/{campaignId}/direct-pitches |
| 38.08 | Reserve pitch budget | POST | /api/v1/promotion/pitches/{pitchId}/budget-leases |
| 38.09 | Send or export pitch | POST | /api/v1/promotion/pitches/{pitchId}/dispatches |
| 38.10 | Record pitch outcome | POST | /api/v1/promotion/pitches/{pitchId}/outcomes |
| 38.11 | Manage target reference | PUT | /api/v1/promotion/directory-targets/{targetId} |
| 38.12 | Export private CRM | POST | /api/v1/promotion/private-contacts/exports |
| 38.13 | Build smart link | POST | /api/v1/promotion/smart-links |
| 38.14 | Follow smart-link destination | GET | /api/v1/promotion/smart-links/{slug}/resolve |
| 38.15 | Authorize pre-save | POST | /api/v1/promotion/presave-grants |
| 38.16 | Execute pre-save | POST | /api/v1/internal/promotion/presave-executions |
| 38.17 | Retire link | POST | /api/v1/promotion/smart-links/{linkId}/retirements |
| 38.18 | Build paid-promotion plan | POST | /api/v1/promotion/paid-plans |
| 38.19 | Create seeding brief | POST | /api/v1/promotion/seeding-campaigns |
| 38.20 | Classify promotion offer | POST | /api/v1/promotion/offer-classifications |
| 38.21 | Schedule social post | POST | /api/v1/promotion/social-publish-jobs |
| 38.22 | Reconcile social post | POST | /api/v1/internal/promotion/social-publish-jobs/{jobId}/reconciliations |
| 38.23 | Record coverage | POST | /api/v1/promotion/coverage-items |
| 38.24 | Plan tour/event announce | POST | /api/v1/promotion/event-announcement-plans |
| 38.25 | Diagnose soft date | GET | /api/v1/promotion/event-announcement-plans/{planId}/diagnosis |
| 38.26 | Attribute ticket sale | POST | /api/v1/internal/promotion/ticket-conversions |
| 38.27 | Publish/share EPK | POST | /api/v1/promotion/epks |
| 38.28 | Manage embargo/exclusive | POST | /api/v1/promotion/embargoes |

## Shared Contract Inheritance

- Errors use ApiError { code, message, requestId, details } with code/message/requestId strings and details a safe object or null. Provider payloads, protected contacts, tokens, pitch content, CRM data and recipient access secrets never appear.
- Browser mutations require allowlisted credentialled CORS, CSRF and actor/entity mandate. Internal consumers require service JWT, mTLS, receipt/producer binding and deny CORS.
- Mutations require Idempotency-Key; digest mismatch is 409 IDEMPOTENCY_CONFLICT. Revisioned commands require If-Match; mismatch is 412 REVISION_MISMATCH.
- Source release/tour/event/rights facts are referenced with owner shard and revision. Shard 38 stores only promotion decisions/projections and never mutates their canonical state.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 38](../ia/38-promotion-marketing.md) | Interactions lines 99–131; Contracts lines 132–156; Data Models lines 157–223; Access Control lines 224–253; Event Schemas and Edge Cases lines 269–317 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 21.01 Release Campaign Planner | 38.01–38.05 |
| 21.02 Pitching & Outreach | 38.06–38.10 |
| 21.03 Pitch Targets & Relationship CRM | 38.10–38.12 |
| 21.04 Smart Links, Pre-Save & Attribution | 38.13–38.17 and 38.26 |
| 21.05 Paid Promotion | 38.18 and 38.20 |
| 21.06 Social Publishing & Cross-Post | 38.21–38.22 |
| 21.07 Coverage & Clipping Log | 38.23 |
| 21.08 Event & Tour Marketing | 38.24–38.25 |
| 21.09 Campaign Press Kit (EPK) & Asset Pack | 38.27–38.28 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Success | Authorization | Concurrency/idempotency | Rate, cache, deadline | Middleware and CORS |
|---|---|---|---|---|---|---|---|
| 38.01 | POST | /api/v1/promotion/campaigns | 201 PromotionCampaignV1 | entity promotion.manage and anchor visibility | key; entity/kind/anchor uniqueness; anchor revision pinned | 30/hour entity; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, mandate, anchor/rule-pack |
| 38.02 | GET | /api/v1/promotion/campaigns/{campaignId}/readiness | 200 CampaignReadinessV1 | campaign viewer mandate | safe read; rule/source watermark ETag | 120/min; private max-age=30; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, strict path/query, RLS |
| 38.03 | POST | /api/v1/promotion/campaigns/{campaignId}/beats | 201 BeatRevisionV1 | promotion.manage plus source-object authority | key plus If-Match; immutable revision | 60/hour campaign; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, content/source policy |
| 38.04 | POST | /api/v1/promotion/campaigns/{campaignId}/anchor-previews | 201 CascadePreviewV1 | promotion.manage | key; source revision set/checksum unique | 30/hour; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, graph/deadline evaluator |
| 38.05 | POST | /api/v1/promotion/campaigns/{campaignId}/anchor-changes | 202 CampaignAnchorChangeV1 | promotion.manage plus step-up for escaped actions | key plus campaign/preview/source revisions; serializable commit | 10/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, preview CAS |
| 38.06 | POST | /api/v1/promotion/campaigns/{campaignId}/dsp-pitches | 201 PitchRevisionV1 | campaign pitch.manage; registered DSP route | key; immutable revision; release/readiness pinned | 30/hour campaign; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, DSP rules/readiness |
| 38.07 | POST | /api/v1/promotion/campaigns/{campaignId}/direct-pitches | 201 PitchRevisionV1 | pitch.manage and target/contact scope | key plus If-Match; merge-field resolution pinned | 60/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, contact/suppression/content |
| 38.08 | POST | /api/v1/promotion/pitches/{pitchId}/budget-leases | 201 PitchBudgetLeaseV1 | pitch.dispatch | key; target/channel/day quota atomic lease | 120/min entity; no-store; 1s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, suppression/quota DO |
| 38.09 | POST | /api/v1/promotion/pitches/{pitchId}/dispatches | 202 PitchDispatchV1 | pitch.dispatch; export step-up | key; revision/lease/suppression CAS; one dispatch | 60/hour entity/target policy; no-store; 500ms | BE00-CORS-WEB-CREDENTIALLED, auth, step-up as needed, provider/export policy |
| 38.10 | POST | /api/v1/promotion/pitches/{pitchId}/outcomes | 201 ContactOutcomeV1 | entity CRM writer; source evidence | key; pitch/outcome source event unique | 120/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, provenance/outcome schema |
| 38.11 | PUT | /api/v1/promotion/directory-targets/{targetId} | 200 DirectoryTargetV1 | directory steward or source adapter | key plus If-Match; aliases retained; facts append | 120/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, provenance/merge policy |
| 38.12 | POST | /api/v1/promotion/private-contacts/exports | 202 ContactExportV1 | entity CRM export and recent step-up | key; field-policy checksum and snapshot watermark | 5/day entity; no-store; 500ms/async 5m | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, purpose/export policy |
| 38.13 | POST | /api/v1/promotion/smart-links | 201 SmartLinkV1 | promotion.manage and source visibility | key; slug unique; destination revisions pinned | 60/hour entity; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, destination/slug policy |
| 38.14 | GET | /api/v1/promotion/smart-links/{slug}/resolve | 302 or 410 | public active link only | safe read; destination selection rule/version pinned | 300/min abuse bucket; no-store; 300ms | BE00-CORS-PUBLIC-READ, strict slug/context, bot/abuse/privacy |
| 38.15 | POST | /api/v1/promotion/presave-grants | 201 PresaveGrantV1 | fan session and provider OAuth receipt | key; fan/provider/release unique active grant | 10/hour fan/provider; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, OAuth scope/release policy |
| 38.16 | POST | /api/v1/internal/promotion/presave-executions | 200 PresaveAttemptV1 | release-state consumer/executor only | event ID key; grant/release/provider attempt unique | 600/min worker; no-store; 10s | BE00-CORS-DENY, service auth, producer/grant/terms binding |
| 38.17 | POST | /api/v1/promotion/smart-links/{linkId}/retirements | 200 SmartLinkV1 | promotion.manage | key plus If-Match; active-to-retired CAS | 30/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, ownership |
| 38.18 | POST | /api/v1/promotion/paid-plans | 201 PromotionPlanV1 | promotion.manage | key plus If-Match; assumptions versioned | 30/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, advisory/B2 guard |
| 38.19 | POST | /api/v1/promotion/seeding-campaigns | 201 SeedingCampaignV1 | promotion.manage and Shard14 engagement authority | key; engagement/disclosure/version unique | 20/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, engagement/disclosure/rights |
| 38.20 | POST | /api/v1/promotion/offer-classifications | 200 OfferVerdictV1 | promotion operator; no provider authority required | key by intent fingerprint/terms/classifier version | 60/hour; private max-age=300; 1s | BE00-CORS-WEB-CREDENTIALLED, auth, strict offer, legal/DSP terms |
| 38.21 | POST | /api/v1/promotion/social-publish-jobs | 202 PublishJobV1 | social.publish and connection scope | key; rendering/schedule/connection revision unique | 60/hour connection; no-store; 500ms | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, capability/content/schedule |
| 38.22 | POST | /api/v1/internal/promotion/social-publish-jobs/{jobId}/reconciliations | 200 PublishJobV1 | verified receipt consumer/reconciler | receipt ID key; job CAS; digest conflict quarantine | 600/min service; no-store; 3s | BE00-CORS-DENY, service auth, receipt binding, strict body |
| 38.23 | POST | /api/v1/promotion/coverage-items | 201 CoverageItemV1 | promotion/PR writer with artifact evidence | key; canonical artifact identity plus observation append | 120/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, URL/artifact/provenance |
| 38.24 | POST | /api/v1/promotion/event-announcement-plans | 201 EventMarketingProjectionV1 | event marketing mandate; source event visibility | key; event/date/source watermark unique | 30/hour; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, event/ticket/link source policy |
| 38.25 | GET | /api/v1/promotion/event-announcement-plans/{planId}/diagnosis | 200 SoftDateDiagnosisV1 | plan viewer | safe read; source watermark ETag | 120/min; private max-age=30; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, RLS |
| 38.26 | POST | /api/v1/internal/promotion/ticket-conversions | 201/200 ConversionObservationV1 | ticket/order settlement consumer | source event key; click/order/event unique by policy | 600/min worker; no-store; 2s | BE00-CORS-DENY, service auth, producer/privacy/attribution |
| 38.27 | POST | /api/v1/promotion/epks | 201 EpkVersionV1/ShareV1 | promotion.manage plus asset/credit authority | key plus If-Match; immutable version; share token unique | 30/hour; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up for share, rights/credit/access |
| 38.28 | POST | /api/v1/promotion/embargoes | 201 EmbargoConstraintV1 | promotion.manage plus counterpart authority evidence | key plus If-Match; exclusive overlap exclusion | 30/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, territory/time/exclusive |

## Request and Response Contracts — Zod 4

Unknown keys fail. UUIDs are lowercase, timestamps RFC 3339 UTC, dates include IANA timezone where wall-clock matters, currency is ISO-4217 with bigint minor values, URLs require HTTPS and provider allowlists, and professional target/contact IDs are opaque.

| ID | Strict request | Success contract |
|---|---|---|
| 38.01 | CampaignCreate { entityId, kind release/tour/event/evergreen, anchorRef typed, anchorRevision, rulePackVersion } | PromotionCampaignV1 { campaignId, kind, anchor, state draft, revision } |
| 38.02 | ReadinessQuery { asOf nullable, includeSoft boolean } | CampaignReadinessV1 { items, blockers, warnings, sourceWatermark, rulePackVersion } |
| 38.03 | BeatCreate { intent enum, sourceObjectRef, renderings typed array, offsetOrPinned union, scheduledAt, channelRules } | BeatRevisionV1 { beatId, revisionId, schedule, readinessState } |
| 38.04 | AnchorPreview { proposedAnchor, campaignRevision, includeEscapedActions true } | CascadePreviewV1 { previewId, sourceRevisions, movedItems, hardViolations, escapedActions, expiresAt } |
| 38.05 | AnchorCommit { previewId, previewRevision, escapedActionAcknowledgements, reasonCode } | CampaignAnchorChangeV1 { campaignId, newAnchor, revision, draftedTaskIds } |
| 38.06 | DspPitchCreate { releaseRef, askType, DSP, territories, assets, copy, submissionRoute } | PitchRevisionV1 { pitchId, revisionId, route, readiness } |
| 38.07 | DirectPitchCreate { targetId/privateContactId, channel, ask, content, mergeFields, attachments } | PitchRevisionV1 { pitchId, revisionId, targetOpaqueId, validationState } |
| 38.08 | BudgetLeaseCreate { pitchRevisionId, targetOpaqueId, channel, sendBucket } | PitchBudgetLeaseV1 { leaseId, expiresAt, quotaRemaining } |
| 38.09 | PitchDispatchCreate { revisionId, leaseId, mode provider_send/secure_export, scheduledAt nullable } | PitchDispatchV1 { dispatchId, state queued/export_ready, providerState nullable } |
| 38.10 | PitchOutcomeCreate { outcome enum, occurredAt, provenance typed, note nullable max 1000 } | ContactOutcomeV1 { outcomeId, pitchId, state, provenance } |
| 38.11 | DirectoryTargetPut { kind, displayName, channels, interests, sourceFacts, aliases, confidence } | DirectoryTargetV1 { targetId, revision, confidence, aliases } |
| 38.12 | ContactExportCreate { fieldSelection, purposeCode, format csv_v1, expiresInHours max 24 } | ContactExportV1 { jobId, state queued, snapshotWatermark } |
| 38.13 | SmartLinkCreate { slug nullable, sourceRef, destinations 1–20, selectionRule, measurementPolicy } | SmartLinkV1 { linkId, slug, state active, version } |
| 38.14 | LinkResolveQuery { coarseCountry nullable, platformHint nullable, firstPartySessionRef nullable } | 302 Location header or 410 ApiError; no destination list |
| 38.15 | PresaveAuthorize { provider, releaseRef, oauthReceiptId, scope presave, consentVersion } | PresaveGrantV1 { grantId, state authorized, provider, release, expiresAt } |
| 38.16 | PresaveExecute { releaseId, releaseRevision, availabilityState, grantId } | PresaveAttemptV1 { attemptId, state succeeded/failed_retryable/failed_terminal, reason } |
| 38.17 | LinkRetire { reasonCode, replacementLinkId nullable } | SmartLinkV1 { linkId, state retired, retiredAt, replacementSlug nullable } |
| 38.18 | PaidPlanCreate { objective, budgetMinor, currency, channels, assumptions, creativeRefs, audienceMode contextual/first_party } | PromotionPlanV1 { planId, revision, advisoryOnly true, risks } |
| 38.19 | SeedingCreate { engagementId, disclosureVersion, brief, amplificationRights, verificationSchedule } | SeedingCampaignV1 { campaignId, state planned, policyVersion } |
| 38.20 | OfferClassify { offerText, consideration, promisedOutcome, channel, counterpartyType, termsVersion } | OfferVerdictV1 { fingerprint, verdict allowed/blocked/review_required, reasonCodes, classifierVersion } |
| 38.21 | SocialPublishCreate { connectionId, channel, rendering, scheduledAt, capabilityVersion } | PublishJobV1 { jobId, state scheduled, renderingChecksum } |
| 38.22 | SocialReconcile { providerReceiptId, providerState, observedAt, payloadDigest } | PublishJobV1 { jobId, state accepted/confirmed/failed/unknown, revision } |
| 38.23 | CoverageCreate { artifactUrl, artifactClass, observedAt, retrievability, strength, pitchId nullable, provenance } | CoverageItemV1 { coverageId, canonicalArtifactId, observationId, state } |
| 38.24 | EventPlanCreate { eventId, eventRevision, announceAt, onsaleAt, linkId, salesSourceRevision } | EventMarketingProjectionV1 { planId, readiness, warnings, watermark } |
| 38.25 | SoftDateQuery { asOf nullable } | SoftDateDiagnosisV1 { diagnosis advisory, signals, missingSources, freshness, noAutomaticChange true } |
| 38.26 | TicketConversionCreate { eventId, clickId nullable, orderId, ticketId nullable, settlementState, refundState, observedAt } | ConversionObservationV1 { conversionId, attributionClass, state, policyVersion } |
| 38.27 | EpkCommand { action publish/share/revoke_share, campaignId, sourceRefs, accessPolicy, recipientId nullable, expiresAt nullable } | EpkVersionV1 or ShareV1 with immutable snapshot/access state |
| 38.28 | EmbargoCommand { action create/amend/lift, scope, counterparties, territory, channel, liftAt, exclusive boolean, assetId } | EmbargoConstraintV1 { constraintId, state, revision, conflicts } |

### Cross-field invariants

- A committed anchor change must quote an unexpired preview over identical source revisions and acknowledge every escaped external action. Hard-deadline violations block commit; soft violations remain explicit.
- Dispatch requires current suppression check and a live budget lease. Global target opt-out wins any entity preference and no alternate channel may bypass it.
- Smart-link resolution records at most first-party session reference, link/destination, coarse context and time; it stores no fingerprint, raw IP, cross-site ID or third-party pixel.
- Pre-save credentials remain vaulted and scoped to provider/release; release unavailability delays execution rather than broadening the grant.
- Paid plans are advisory and cannot contain provider spend credentials or unapproved uploaded audiences.
- Seeding requires the Shard 14 engagement and locked disclosure/amplification terms; classification blocks consideration-shaped pay-for-airplay or unclassifiable offers.
- EPK versions are immutable curated source/credit snapshots; recipient shares reveal only that version and can be revoked independently.
- Exclusive claims use an exclusion constraint on asset, territory, channel and wall-clock window; overlapping active promises cannot commit.

### Exact typed success schemas

The operation comments are the normative route mappings for these strict Zod 4 success contracts. Private contacts, provider secrets, and full destination sets are not response fields.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const OpaqueId = z.string().min(16).max(256);
const Anchor = z.object({ kind: z.enum(["release", "tour", "event", "evergreen"]), refId: Uuid, revision: Version }).strict();
const Warning = z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), severity: z.enum(["info", "warning", "hard"]), sourceRef: Uuid.nullable() }).strict();
const Provenance = z.object({ sourceKind: z.string().regex(/^[a-z0-9_]{1,64}$/), sourceRef: Uuid, observedAt: Instant }).strict();
// 38.01
export const PromotionCampaignV1 = z.object({ campaignId: Uuid, kind: z.enum(["release", "tour", "event", "evergreen"]), anchor: Anchor, state: z.literal("draft"), revision: Version }).strict();
// 38.02
export const CampaignReadinessV1 = z.object({
  items: z.array(z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), state: z.enum(["ready", "warning", "blocked", "unknown"]), sourceRef: Uuid.nullable() }).strict()).max(1000),
  blockers: z.array(Warning).max(1000), warnings: z.array(Warning).max(1000), sourceWatermark: Digest, rulePackVersion: Version,
}).strict();
// 38.03
export const BeatRevisionV1 = z.object({ beatId: Uuid, revisionId: Uuid, schedule: z.object({ mode: z.enum(["offset", "pinned"]), scheduledAt: Instant }).strict(), readinessState: z.enum(["ready", "warning", "blocked"])}).strict();
// 38.04
export const CascadePreviewV1 = z.object({
  previewId: Uuid, sourceRevisions: z.array(z.object({ sourceRef: Uuid, revision: Version }).strict()).max(1000),
  movedItems: z.array(z.object({ itemId: Uuid, from: Instant, to: Instant }).strict()).max(5000),
  hardViolations: z.array(Warning).max(1000), escapedActions: z.array(z.object({ actionId: Uuid, kind: z.string().regex(/^[a-z0-9_]{1,64}$/), acknowledgmentRequired: z.boolean() }).strict()).max(1000), expiresAt: Instant,
}).strict();
// 38.05
export const CampaignAnchorChangeV1 = z.object({ campaignId: Uuid, newAnchor: Anchor, revision: Version, draftedTaskIds: z.array(Uuid).max(5000) }).strict();
// 38.06
export const DspPitchRevisionV1 = z.object({ pitchId: Uuid, revisionId: Uuid, route: z.enum(["provider", "secure_export"]), readiness: z.enum(["ready", "warning", "blocked"])}).strict();
// 38.07
export const DirectPitchRevisionV1 = z.object({ pitchId: Uuid, revisionId: Uuid, targetOpaqueId: OpaqueId, validationState: z.enum(["valid", "warning", "blocked"])}).strict();
// 38.08
export const PitchBudgetLeaseV1 = z.object({ leaseId: Uuid, expiresAt: Instant, quotaRemaining: z.int().nonnegative() }).strict();
// 38.09
export const PitchDispatchV1 = z.object({ dispatchId: Uuid, state: z.enum(["queued", "export_ready"]), providerState: z.enum(["not_sent", "accepted", "confirmed", "failed", "unknown"]).nullable() }).strict();
// 38.10
export const ContactOutcomeV1 = z.object({ outcomeId: Uuid, pitchId: Uuid, state: z.enum(["recorded", "superseded", "disputed"]), provenance: Provenance }).strict();
// 38.11
export const DirectoryTargetV1 = z.object({ targetId: Uuid, revision: Version, confidence: z.number().min(0).max(1), aliases: z.array(z.string().min(1).max(200)).max(1000) }).strict();
// 38.12
export const ContactExportV1 = z.object({ jobId: Uuid, state: z.literal("queued"), snapshotWatermark: Digest }).strict();
// 38.13
export const SmartLinkV1 = z.object({ linkId: Uuid, slug: z.string().regex(/^[a-z0-9-]{1,100}$/), state: z.enum(["active", "retired"]), version: Version }).strict();
// 38.14 — success is a typed 302 response, not a JSON body.
export const LinkResolveSuccess = z.object({ status: z.literal(302), headers: z.object({ location: z.url(), cacheControl: z.literal("no-store") }).strict(), body: z.null() }).strict();
// 38.15
export const PresaveGrantV1 = z.object({ grantId: Uuid, state: z.literal("authorized"), provider: z.string().regex(/^[a-z0-9_]{1,64}$/), release: Uuid, expiresAt: Instant }).strict();
// 38.16
export const PresaveAttemptV1 = z.object({ attemptId: Uuid, state: z.enum(["succeeded", "failed_retryable", "failed_terminal"]), reason: z.string().regex(/^[a-z0-9_]{1,64}$/).nullable() }).strict();
// 38.17
export const RetiredSmartLinkV1 = z.object({ linkId: Uuid, state: z.literal("retired"), retiredAt: Instant, replacementSlug: z.string().regex(/^[a-z0-9-]{1,100}$/).nullable() }).strict();
// 38.18
export const PromotionPlanV1 = z.object({ planId: Uuid, revision: Version, advisoryOnly: z.literal(true), risks: z.array(Warning).max(1000) }).strict();
// 38.19
export const SeedingCampaignV1 = z.object({ campaignId: Uuid, state: z.literal("planned"), policyVersion: Version }).strict();
// 38.20
export const OfferVerdictV1 = z.object({ fingerprint: Digest, verdict: z.enum(["allowed", "blocked", "review_required"]), reasonCodes: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(100), classifierVersion: Version }).strict();
// 38.21
export const SocialPublishCreateSuccess = z.object({ jobId: Uuid, state: z.literal("scheduled"), renderingChecksum: Digest }).strict();
// 38.22
export const SocialPublishReconcileSuccess = z.object({ jobId: Uuid, state: z.enum(["accepted", "confirmed", "failed", "unknown"]), revision: Version }).strict();
// 38.23
export const CoverageItemV1 = z.object({ coverageId: Uuid, canonicalArtifactId: Uuid, observationId: Uuid, state: z.enum(["retrievable", "unavailable", "disputed"])}).strict();
// 38.24
export const EventMarketingProjectionV1 = z.object({ planId: Uuid, readiness: z.enum(["ready", "warning", "blocked", "unknown"]), warnings: z.array(Warning).max(1000), watermark: Digest }).strict();
// 38.25
export const SoftDateDiagnosisV1 = z.object({
  diagnosis: z.literal("advisory"), signals: z.array(z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), state: z.enum(["positive", "negative", "unknown"]) }).strict()).max(1000),
  missingSources: z.array(z.object({ sourceKind: z.string().regex(/^[a-z0-9_]{1,64}$/), reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(1000),
  freshness: z.enum(["current", "stale", "unknown"]), noAutomaticChange: z.literal(true),
}).strict();
// 38.26
export const ConversionObservationV1 = z.object({ conversionId: Uuid, attributionClass: z.enum(["observed", "correlated", "modelled"]), state: z.enum(["provisional", "settled", "refunded"]), policyVersion: Version }).strict();
const EpkVersionSuccess = z.object({ kind: z.literal("epk_version"), epkId: Uuid, version: Version, snapshotChecksum: Digest, accessState: z.enum(["private", "published"])}).strict();
const EpkShareSuccess = z.object({ kind: z.literal("share"), shareId: Uuid, epkId: Uuid, snapshotChecksum: Digest, accessState: z.enum(["active", "revoked", "expired"]), expiresAt: Instant.nullable() }).strict();
// 38.27
export const EpkCommandSuccess = z.discriminatedUnion("kind", [EpkVersionSuccess, EpkShareSuccess]);
// 38.28
export const EmbargoConstraintV1 = z.object({
  constraintId: Uuid, state: z.enum(["active", "lifted", "superseded"]), revision: Version,
  conflicts: z.array(z.object({ constraintId: Uuid, overlapKind: z.enum(["territory", "channel", "time", "exclusive"]), hard: z.boolean() }).strict()).max(1000),
}).strict();
~~~

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 38.02 | Pagination N/A: this GET returns one readiness projection; strict request parsing rejects cursor, offset, page, limit, and sort keys. | `items`, `blockers`, and `warnings` each contain at most 1,000 entries; their entry schemas contain no nested collections. |
| 38.14 | Pagination N/A: this GET resolves one slug to one typed 302 response (or one error); strict request parsing rejects pagination keys. | No returned collections: success is exactly `{ status: 302, headers: { location, cacheControl }, body: null }`. |
| 38.25 | Pagination N/A: this GET returns one soft-date diagnosis; strict request parsing rejects cursor, offset, page, limit, and sort keys. | `signals` and `missingSources` each contain at most 1,000 entries; their entry schemas contain no nested collections. |

## Database Schema

All primary keys are uuid, revisions positive bigint, timestamps timestamptz UTC, wall-clock commitments also store IANA timezone and original local time, money bigint minor units, and protected contacts/provider tokens opaque encrypted-vault references.

| Model | Typed fields and constraints | Keys/indexes | RLS/grants |
|---|---|---|---|
| promotion_campaign | id; entity_id; kind enum; anchor_kind/id/revision; state draft/active/completed/cancelled; rule_pack_version; revision | unique entity,kind,anchor where active; FK entity; index state | entity mandate; source owner read seam only |
| campaign_rule_pack | id; channel/provider; version; verified_at; expires_at; source_ref; state active/expired | unique channel,provider,version | policy service write; campaign users read active rules |
| rule_entry | id; rule_pack_id; key; value_json; deadline_class hard/soft; effective_range | unique pack,key; FK pack | follows pack |
| campaign_grid_item | id; campaign_id; source_type derived/manual; offset_or_pin; scheduled_at; deadline_class; provenance; readiness_dependency; revision | unique campaign,id,revision; index campaign,scheduled_at | campaign viewers/operators |
| campaign_beat | id; campaign_id; intent; source_object_ref; current_revision; state | FK campaign; index campaign,state | promotion mandate |
| beat_revision | id; beat_id; revision; renderings_json; schedule_json; checksum; published_at nullable | unique beat,revision; append-only | source-authorized campaign readers |
| cascade_preview | id; campaign_id; proposed_anchor; source_revisions; graph_checksum; hard_violations; expires_at; revision | unique campaign,graph_checksum,revision; TTL | creator/campaign operators only |
| escaped_action | id; preview_id; provider/action class; prior_receipt; drafted_task_id nullable; acknowledgement_required | unique preview,provider,action digest | follows preview; task worker scoped |
| embargo_constraint | id; entity_id; asset_id; scope_json; counterparties; territory; channel; lift_at; state; revision | GIST range; FK entity/asset seam; index lift_at | promotion and authorized counterpart projection |
| exclusive_claim | id; constraint_id; asset_id; territory; channel; active_range; state | exclusion asset,territory,channel,active_range when active | dual-controlled promotion write |
| pitch | id; entity_id; campaign_id; target_opaque_id; kind dsp/direct; state draft/ready/dispatched/closed; current_revision; version | FK campaign; index entity,state,target | entity CRM/pitch mandate |
| pitch_revision | id; pitch_id; revision; ask/content/assets; route; merge_snapshot; checksum; immutable created_at | unique pitch,revision | authorized entity; dispatcher exact revision |
| pitch_budget_lease | id; entity_id; target_key_hash; channel; send_bucket; quota_policy_version; expires_at; consumed_at nullable | unique target,channel,bucket,lease slot; TTL | quota service write; entity sees remaining count |
| target_suppression | target_key_hash; channel; scope global; verified_at; source_receipt; state active/revoked; version | PK target,channel; index state | suppression service only; dispatcher boolean projection |
| directory_target | id; kind; display_name; channels; interests; confidence; state; revision | search indexes on normalized name/interests; aliases unique | directory users; no private contact fields |
| target_source_fact | id; target_id; source; source_key; fact_json; confidence; observed_at; supersedes_id nullable | unique source,source_key; FK target | append-only steward/source adapter |
| private_contact | id; entity_id; protected_contact_ref; relationship_json; directory_suggestion_id nullable; state; revision | unique entity,protected ref; index entity,state | entity CRM mandate only; never directory/public |
| contact_outcome | id; entity_id; pitch_id; outcome; provenance; state recorded/superseded/disputed; occurred_at; note_ref nullable; source_event_id | unique entity,source_event_id; FK pitch | entity CRM; append-only |
| smart_link | id; entity_id; slug; source_ref; state active/retired; measurement_policy; version; replacement_id nullable | unique lower slug; index entity,state | public active resolver; entity manages |
| link_destination | id; link_id; provider; url; managed boolean; priority; territory/platform rules; revision | unique link,provider,url; FK link | resolver reads active only |
| presave_grant | id; fan_party_id; provider; release_id; token_ref; scope; consent_version; state; expires_at; version | unique active fan,provider,release; index expires_at | fan own; executor token-ref read |
| presave_attempt | id; grant_id; release_revision; provider_receipt nullable; state; reason; attempted_at | unique grant,release_revision,attempt key | append-only executor; fan status projection |
| campaign_click | id; link_id; destination_id; session_ref_hash nullable; coarse_context; occurred_at; expires_at | index link,occurred_at; TTL partition | measurement service; entity aggregate only |
| conversion_observation | id; event_id; click_id nullable; order_id; ticket_id nullable; attribution_class observed/correlated/modelled; settlement_state; refund_state; policy_version; observed_at | unique source event/order/ticket/policy; index event | attribution service; entity safe aggregate |
| promotion_plan | id; entity_id; campaign_id nullable; objective; budget_minor; currency; assumptions; channels; creative_refs; advisory_only true; revision | FK entity/campaign; check advisory_only | entity promotion mandate |
| seeding_campaign | id; entity_id; engagement_id; disclosure_version; brief; amplification_rights; verification_schedule; state; version | unique engagement,disclosure version; FK Shard14 seam | promotion and engagement parties by mandate |
| promotion_offer_verdict | id; intent_fingerprint; terms_version; classifier_version; verdict allowed/blocked/review_required; reason_codes; immutable created_at | unique fingerprint,terms,classifier | operator read; classifier/legal settings write |
| social_connection | id; entity_id; provider; token_ref; capability_version; state; revision | unique entity,provider,external account; index state | connection owner; publisher token-ref read |
| publish_job | id; connection_id; rendering_checksum; scheduled_at; state scheduled/accepted/confirmed/failed/unknown/cancelled; provider_receipt nullable; version | unique connection,rendering,schedule; index state,scheduled_at | entity status; publisher/receipt consumer writes |
| coverage_item | id; entity_id; canonical_artifact_id; artifact_class; url; current_strength; retrievability; pitch_id nullable; version | unique canonical artifact/entity; index entity,class | entity promotion/PR |
| coverage_observation | id; coverage_id; strength; observed_at; retrievable; provenance; source_event_id | unique coverage,source_event_id; append-only | authorized entity and crawler service |
| event_marketing_projection | id; entity_id; event_id; event_revision; announce_at; onsale_at; link_id; sales_source_revision; readiness; diagnosis_json; watermark; expires_at | unique event,event revision,watermark; TTL | event marketing mandate; disposable |
| epk | id; entity_id; campaign_id; state draft/published/retired; current_version; revision | FK entity/campaign | promotion mandate |
| epk_version | id; epk_id; version; source_snapshot; credit_snapshot; assets; access_policy; checksum; published_at | unique epk,version; append-only | authorized entity; share exact version |
| epk_share | id; epk_version_id; recipient_id nullable; token_digest; policy; state active/revoked/expired; expires_at; viewed_at nullable | unique token digest; index state,expires_at | owner manages; token sees narrowed version |

### Literal SQL type and nullability closure

This table is normative for migrations. JSON values must pass their named strict contract before insert; the registry above remains normative for relationships, query indexes, RLS, and grants. Its compact constraint grammar is exact: `CHECK a/b/c` expands to `CHECK (column IN ('a','b','c'))`; `CHECK >0`, `CHECK >=0`, and `CHECK 0–1` expand against the immediately preceding column; `length n` and `length a–b` expand to exact byte/text length checks; `object`, `array`, `nonempty`, `after X`, `overlaps`, and `exactly one ...` expand to the named `jsonb_typeof`, `cardinality`, comparison/range, and XOR `CHECK` expressions. These expansions are mandatory, not implementation suggestions.

| Model | Exact column declarations |
|---|---|
| promotion_campaign | id uuid PRIMARY KEY; entity_id uuid NOT NULL; kind text NOT NULL CHECK release/tour/event/evergreen; anchor_kind text NOT NULL CHECK release/tour/event/evergreen; anchor_id uuid NOT NULL; anchor_revision bigint NOT NULL CHECK >0; state text NOT NULL CHECK draft/active/completed/cancelled; rule_pack_version bigint NOT NULL CHECK >0; revision bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL |
| campaign_rule_pack | id uuid PRIMARY KEY; channel text NOT NULL; provider text NOT NULL; version bigint NOT NULL CHECK >0; verified_at timestamptz NOT NULL; expires_at timestamptz NOT NULL CHECK after verified_at; source_ref text NOT NULL; state text NOT NULL CHECK active/expired |
| rule_entry | id uuid PRIMARY KEY; rule_pack_id uuid NOT NULL; key text NOT NULL length 1–128; value_json jsonb NOT NULL; deadline_class text NOT NULL CHECK hard/soft; effective_range tstzrange NOT NULL CHECK nonempty |
| campaign_grid_item | id uuid PRIMARY KEY; campaign_id uuid NOT NULL; source_type text NOT NULL CHECK derived/manual; offset_or_pin jsonb NOT NULL object; scheduled_at timestamptz NOT NULL; deadline_class text NOT NULL CHECK hard/soft; provenance jsonb NOT NULL object; readiness_dependency text NOT NULL; revision bigint NOT NULL CHECK >0 |
| campaign_beat | id uuid PRIMARY KEY; campaign_id uuid NOT NULL; intent text NOT NULL length 1–500; source_object_ref text NOT NULL; current_revision bigint NOT NULL CHECK >0; state text NOT NULL CHECK draft/scheduled/published/cancelled |
| beat_revision | id uuid PRIMARY KEY; beat_id uuid NOT NULL; revision bigint NOT NULL CHECK >0; renderings_json jsonb NOT NULL array; schedule_json jsonb NOT NULL object; checksum bytea NOT NULL length 32; published_at timestamptz NULL; created_at timestamptz NOT NULL |
| cascade_preview | id uuid PRIMARY KEY; campaign_id uuid NOT NULL; proposed_anchor jsonb NOT NULL object; source_revisions jsonb NOT NULL object; graph_checksum bytea NOT NULL length 32; hard_violations jsonb NOT NULL array; expires_at timestamptz NOT NULL; revision bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL |
| escaped_action | id uuid PRIMARY KEY; preview_id uuid NOT NULL; provider text NOT NULL; action_class text NOT NULL; prior_receipt text NOT NULL; drafted_task_id uuid NULL; acknowledgement_required boolean NOT NULL |
| embargo_constraint | id uuid PRIMARY KEY; entity_id uuid NOT NULL; asset_id uuid NOT NULL; scope_json jsonb NOT NULL object; counterparties uuid[] NOT NULL DEFAULT empty; territory text NOT NULL; channel text NOT NULL; lift_at timestamptz NOT NULL; state text NOT NULL CHECK active/lifted/superseded; revision bigint NOT NULL CHECK >0 |
| exclusive_claim | id uuid PRIMARY KEY; constraint_id uuid NOT NULL; asset_id uuid NOT NULL; territory text NOT NULL; channel text NOT NULL; active_range tstzrange NOT NULL CHECK nonempty; state text NOT NULL CHECK active/lifted/superseded |
| pitch | id uuid PRIMARY KEY; entity_id uuid NOT NULL; campaign_id uuid NOT NULL; target_opaque_id text NOT NULL; kind text NOT NULL CHECK dsp/direct; state text NOT NULL CHECK draft/ready/dispatched/closed; current_revision bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL |
| pitch_revision | id uuid PRIMARY KEY; pitch_id uuid NOT NULL; revision bigint NOT NULL CHECK >0; ask jsonb NOT NULL object; content jsonb NOT NULL object; assets uuid[] NOT NULL DEFAULT empty; route text NOT NULL CHECK provider/secure_export; merge_snapshot jsonb NOT NULL object; checksum bytea NOT NULL length 32; created_at timestamptz NOT NULL |
| pitch_budget_lease | id uuid PRIMARY KEY; entity_id uuid NOT NULL; target_key_hash bytea NOT NULL length 32; channel text NOT NULL; send_bucket timestamptz NOT NULL; quota_policy_version bigint NOT NULL CHECK >0; expires_at timestamptz NOT NULL; consumed_at timestamptz NULL |
| target_suppression | target_key_hash bytea NOT NULL length 32; channel text NOT NULL; scope text NOT NULL CHECK scope='global'; verified_at timestamptz NOT NULL; source_receipt text NOT NULL; state text NOT NULL CHECK active/revoked; version bigint NOT NULL CHECK >0; PRIMARY KEY target_key_hash,channel |
| directory_target | id uuid PRIMARY KEY; kind text NOT NULL; display_name text NOT NULL length 1–200; channels text[] NOT NULL DEFAULT empty; interests text[] NOT NULL DEFAULT empty; confidence numeric(9,6) NOT NULL CHECK 0–1; state text NOT NULL CHECK active/merged/retired; revision bigint NOT NULL CHECK >0 |
| target_source_fact | id uuid PRIMARY KEY; target_id uuid NOT NULL; source text NOT NULL; source_key text NOT NULL; fact_json jsonb NOT NULL object; confidence numeric(9,6) NOT NULL CHECK 0–1; observed_at timestamptz NOT NULL; supersedes_id uuid NULL |
| private_contact | id uuid PRIMARY KEY; entity_id uuid NOT NULL; protected_contact_ref text NOT NULL; relationship_json jsonb NOT NULL object; directory_suggestion_id uuid NULL; state text NOT NULL CHECK active/suppressed/retired; revision bigint NOT NULL CHECK >0 |
| contact_outcome | id uuid PRIMARY KEY; entity_id uuid NOT NULL; pitch_id uuid NOT NULL; outcome text NOT NULL; provenance jsonb NOT NULL object; state text NOT NULL CHECK recorded/superseded/disputed; occurred_at timestamptz NOT NULL; note_ref text NULL; source_event_id uuid NOT NULL |
| smart_link | id uuid PRIMARY KEY; entity_id uuid NOT NULL; slug citext NOT NULL length 1–100; source_ref text NOT NULL; state text NOT NULL CHECK active/retired; measurement_policy bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0; replacement_id uuid NULL |
| link_destination | id uuid PRIMARY KEY; link_id uuid NOT NULL; provider text NOT NULL; url text NOT NULL; managed boolean NOT NULL; priority integer NOT NULL CHECK >=0; territory_rules jsonb NOT NULL object; platform_rules jsonb NOT NULL object; revision bigint NOT NULL CHECK >0 |
| presave_grant | id uuid PRIMARY KEY; fan_party_id uuid NOT NULL; provider text NOT NULL; release_id uuid NOT NULL; token_ref text NOT NULL; scope text[] NOT NULL CHECK nonempty; consent_version bigint NOT NULL CHECK >0; state text NOT NULL CHECK authorized/pending_release/executed/failed_terminal/revoked; expires_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0 |
| presave_attempt | id uuid PRIMARY KEY; grant_id uuid NOT NULL; release_revision bigint NOT NULL CHECK >0; provider_receipt text NULL; state text NOT NULL CHECK succeeded/failed_retryable/failed_terminal; reason text NULL; attempted_at timestamptz NOT NULL |
| campaign_click | id uuid PRIMARY KEY; link_id uuid NOT NULL; destination_id uuid NOT NULL; session_ref_hash bytea NULL; coarse_context jsonb NOT NULL object; occurred_at timestamptz NOT NULL; expires_at timestamptz NOT NULL |
| conversion_observation | id uuid PRIMARY KEY; event_id uuid NOT NULL; click_id uuid NULL; order_id uuid NOT NULL; ticket_id uuid NULL; attribution_class text NOT NULL CHECK observed/correlated/modelled; settlement_state text NOT NULL CHECK provisional/settled; refund_state text NOT NULL CHECK none/refunded; policy_version bigint NOT NULL CHECK >0; observed_at timestamptz NOT NULL |
| promotion_plan | id uuid PRIMARY KEY; entity_id uuid NOT NULL; campaign_id uuid NULL; objective text NOT NULL length 1–2000; budget_minor bigint NOT NULL CHECK >=0; currency char(3) NOT NULL; assumptions jsonb NOT NULL array; channels text[] NOT NULL DEFAULT empty; creative_refs uuid[] NOT NULL DEFAULT empty; advisory_only boolean NOT NULL CHECK true; revision bigint NOT NULL CHECK >0 |
| seeding_campaign | id uuid PRIMARY KEY; entity_id uuid NOT NULL; engagement_id uuid NOT NULL; disclosure_version bigint NOT NULL CHECK >0; brief text NOT NULL length 1–4000; amplification_rights jsonb NOT NULL object; verification_schedule jsonb NOT NULL object; state text NOT NULL CHECK planned/active/completed/cancelled; version bigint NOT NULL CHECK >0 |
| promotion_offer_verdict | id uuid PRIMARY KEY; intent_fingerprint bytea NOT NULL length 32; terms_version bigint NOT NULL CHECK >0; classifier_version bigint NOT NULL CHECK >0; verdict text NOT NULL CHECK allowed/blocked/review_required; reason_codes text[] NOT NULL DEFAULT empty; created_at timestamptz NOT NULL |
| social_connection | id uuid PRIMARY KEY; entity_id uuid NOT NULL; provider text NOT NULL; token_ref text NOT NULL; capability_version bigint NOT NULL CHECK >0; state text NOT NULL CHECK active/action_required/revoked; revision bigint NOT NULL CHECK >0 |
| publish_job | id uuid PRIMARY KEY; connection_id uuid NOT NULL; rendering_checksum bytea NOT NULL length 32; scheduled_at timestamptz NOT NULL; state text NOT NULL CHECK scheduled/accepted/confirmed/failed/unknown/cancelled; provider_receipt text NULL; version bigint NOT NULL CHECK >0 |
| coverage_item | id uuid PRIMARY KEY; entity_id uuid NOT NULL; canonical_artifact_id uuid NOT NULL; artifact_class text NOT NULL; url text NOT NULL; current_strength numeric(9,6) NOT NULL CHECK 0–1; retrievability text NOT NULL CHECK retrievable/unavailable/disputed; pitch_id uuid NULL; version bigint NOT NULL CHECK >0 |
| coverage_observation | id uuid PRIMARY KEY; coverage_id uuid NOT NULL; strength numeric(9,6) NOT NULL CHECK 0–1; observed_at timestamptz NOT NULL; retrievable boolean NOT NULL; provenance jsonb NOT NULL object; source_event_id uuid NOT NULL |
| event_marketing_projection | id uuid PRIMARY KEY; entity_id uuid NOT NULL; event_id uuid NOT NULL; event_revision bigint NOT NULL CHECK >0; announce_at timestamptz NOT NULL; onsale_at timestamptz NOT NULL; link_id uuid NOT NULL; sales_source_revision bigint NOT NULL CHECK >0; readiness text NOT NULL CHECK ready/warning/blocked/unknown; diagnosis_json jsonb NOT NULL object; watermark bytea NOT NULL length 32; expires_at timestamptz NOT NULL |
| epk | id uuid PRIMARY KEY; entity_id uuid NOT NULL; campaign_id uuid NOT NULL; state text NOT NULL CHECK draft/published/retired; current_version bigint NOT NULL CHECK >0; revision bigint NOT NULL CHECK >0 |
| epk_version | id uuid PRIMARY KEY; epk_id uuid NOT NULL; version bigint NOT NULL CHECK >0; source_snapshot jsonb NOT NULL object; credit_snapshot jsonb NOT NULL object; assets uuid[] NOT NULL DEFAULT empty; access_policy jsonb NOT NULL object; checksum bytea NOT NULL length 32; published_at timestamptz NULL |
| epk_share | id uuid PRIMARY KEY; epk_version_id uuid NOT NULL; recipient_id uuid NULL; token_digest bytea NOT NULL length 32; policy jsonb NOT NULL object; state text NOT NULL CHECK active/revoked/expired; expires_at timestamptz NOT NULL; viewed_at timestamptz NULL |

### Constraints, retention, RLS and grants

- beat_revision, pitch_revision, target_source_fact, contact_outcome, presave_attempt, coverage_observation and epk_version are append-only. Corrections create a later fact/revision.
- campaign_click expires within 30 days; raw IP, user agent and cross-site identifiers are never persisted. Private-contact exports expire within 24 hours and deletion receipts are audited.
- Every base table has RLS and no PUBLIC/anon grant. Public link/EPK reads use security-invoker projections constrained by active state and token policy. Worker roles are split into pitch dispatcher, resolver, pre-save executor, social publisher, receipt reconciler and attribution consumer.

## State Machines and Transaction Rules

| Aggregate | Allowed transitions | Recovery/invariant |
|---|---|---|
| campaign | draft → active → completed/cancelled | kind immutable after active; anchor commit requires exact preview |
| pitch | draft → ready → dispatched → closed | suppression and budget rechecked in dispatch transaction |
| smart link | active → retired | retired returns 410 or deterministic replacement; slug never reassigned |
| presave grant | authorized → pending_release → executed/failed_terminal/revoked | release delay preserves scope; token never reused across release |
| publish job | scheduled → accepted → confirmed; scheduled/accepted → failed/unknown/cancelled | unknown reconciles; no false confirmed state |
| embargo | draft → active → lifted/expired/revoked | exclusive overlap blocks activation |
| EPK share | active → revoked/expired | version remains immutable; token route stops immediately |

- Anchor commit locks campaign, preview and all current source revisions; it updates the anchor/grid and appends escaped-action tasks/outbox in one serializable transaction.
- Pitch dispatch locks suppression and target/channel/bucket lease, consumes quota, freezes revision and appends outbox atomically. Provider acceptance reconciles by provider receipt.
- Social reconciliation accepts state progression only; a later contradictory receipt quarantines and leaves job unknown until audited reconciliation.
- Ticket attribution never edits ticket/order facts. Refund/settlement changes append a new conversion observation and re-derive aggregate attribution.

## Middleware and Security Policies

Order: request ID → proxy normalization → CORS → auth/service receipt → CSRF → strict size/header/Zod → actor/entity/provider/query rate → mandate/ownership/RLS → idempotency/If-Match → readiness/suppression/rights/terms → handler → response validation → redacted audit/log.

| IDs | Policy | CORS |
|---|---|---|
| 38.01–38.13, 38.15, 38.17–38.21, 38.23–38.25, 38.27–38.28 | authenticated entity/fan plus exact mandate/ownership; cross-entity resource concealed as 404 | BE00-CORS-WEB-CREDENTIALLED |
| 38.14 | public active slug only; no administrative fields | BE00-CORS-PUBLIC-READ |
| 38.16, 38.22, 38.26 | registered producer/receipt consumer, service JWT and mTLS | BE00-CORS-DENY |

Target opt-out is global across entities/channels covered by the instruction. Support cannot reveal a protected target or bypass suppression. CRM exports require purpose, step-up, field allowlist, watermark, expiry and audit. Embargo/counterparty evidence, provider tokens and EPK recipient tokens are encrypted and excluded from logs.

## External Seams and Failure Recovery

| Seam | Request/response | Timeout, retry, circuit | Failure behavior |
|---|---|---|---|
| DSP submission/export | immutable pitch revision → accepted/export receipt | 5s; 2 retries 1s/5s; circuit 5 failures/min for 2m | pitch stays ready/dispatch_unknown; reconcile receipt, never double-send |
| email/CRM delivery | protected destination plus revision → provider receipt | 2s; 3 retries 1s/5s/30s; circuit 10 failures/30s for 60s | budget remains consumed only after accepted receipt; unknown reconciles |
| streaming pre-save | scoped vaulted grant/release → provider outcome | 10s; 4 retries 5s/30s/2m/10m; provider circuit 10 failures/5m for 15m | attempt retryable or terminal; grant scope unchanged |
| social provider | rendering/schedule → accepted and later observed status | 5s; 3 retries 1s/10s/1m; circuit 5 failures/min for 5m | state unknown until reconciliation; no automatic duplicate |
| storage/render/export | source snapshot → artifact/download receipt | 15s; 2 retries 1s/5s; circuit 5 failures/min for 2m | prior EPK/export persists; new version/job fails safely |
| source shards 10/14/22/34–36 | typed object/revision read → authoritative snapshot | 2s; 2 retries 100ms/500ms; circuit 5 failures/30s for 30s | readiness unknown/blocked; no invented source state |

All queues use at-least-once delivery, stable event/receipt keys, exponential retry capped at 15 minutes and poison quarantine after eight attempts. Provider signature/schema/version verification is BE00; stale versions no-op, equal-version digest conflicts quarantine.

## Event and Consumer Contracts

Events carry eventId, eventType literal, schemaVersion 1, aggregateId/version, occurredAt, producer and traceId.

| Event | Required payload | Consumers and dedupe |
|---|---|---|
| promotion.campaign.created.v1 | campaign, entity, kind, anchor, rule-pack version | readiness/grid/audit; campaign-version |
| promotion.campaign.anchor_changed.v1 | campaign, old/new anchor, preview revision, actor, escaped task IDs | scheduler/tasks/audit; campaign-version |
| promotion.embargo.changed.v1 | constraint, scope, counterparties, lift-at, state, revision | readiness/link/EPK; constraint-revision |
| promotion.readiness.changed.v1 | campaign item, state, verifier type, source revision | grid/alerts; item-source revision |
| promotion.pitch.dispatched.v1 | pitch/revision, entity, target opaque ID, channel, budget policy, provider state | CRM/audit/analytics; dispatch ID |
| promotion.target.opted_out.v1 | protected target key, channel, verified-at, global scope | suppression caches; target-channel-version |
| promotion.pitch.outcome_recorded.v1 | pitch, outcome, provenance, occurred-at | CRM/reporting; source event |
| promotion.link.clicked.v1 | link, destination, first-party session ref, coarse context, occurred-at | short-retention attribution; click ID |
| promotion.presave.state_changed.v1 | grant, provider, release, old/new state, reason | fan status/campaign readiness; grant-version |
| promotion.offer.classified.v1 | offer fingerprint, terms version, verdict, reasons | seeding/paid-plan gates; fingerprint-version |
| promotion.social_publish.resolved.v1 | job, provider, accepted/confirmed/failed/unknown, provider receipt | campaign grid/audit; receipt ID |
| promotion.coverage.observed.v1 | coverage, artifact class, strength, observed-at, retrievability | reporting/readiness; coverage observation |
| promotion.ticket_conversion.observed.v1 | event, click, order/ticket, settlement/refund state | event marketing/analytics; source event |
| promotion.epk.version_published.v1 | EPK/version, campaign, access policy, asset/credit snapshot | share/cache/audit; EPK-version |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 38.01 | 400 ANCHOR_INVALID; 403 CAPABILITY_REQUIRED; 409 CAMPAIGN_EXISTS; 422 RULE_PACK_EXPIRED |
| 38.02 | 404 CAMPAIGN_NOT_FOUND; 409 READINESS_UNKNOWN; 503 SOURCE_UNAVAILABLE |
| 38.03 | 400 BEAT_INVALID; 403 SOURCE_AUTHORITY_REQUIRED; 412 REVISION_MISMATCH; 422 CHANNEL_RULE_FAILED |
| 38.04 | 400 ANCHOR_INVALID; 409 SOURCE_REVISION_CONFLICT; 422 HARD_DEADLINE_VIOLATION |
| 38.05 | 400 PREVIEW_EXPIRED; 403 STEP_UP_REQUIRED; 409 SOURCE_CHANGED; 412 REVISION_MISMATCH; 422 ESCAPED_ACTION_UNACKNOWLEDGED |
| 38.06 | 400 DSP_PITCH_INVALID; 403 ROUTE_NOT_AUTHORIZED; 409 READINESS_BLOCKED; 422 DSP_RULE_FAILED |
| 38.07 | 400 DIRECT_PITCH_INVALID; 404 TARGET_NOT_FOUND; 409 TARGET_SUPPRESSED; 422 MERGE_FIELD_UNRESOLVED |
| 38.08 | 403 DISPATCH_CAPABILITY_REQUIRED; 409 TARGET_SUPPRESSED/QUOTA_EXHAUSTED; 429 TARGET_RATE_LIMITED |
| 38.09 | 400 REVISION_NOT_READY; 403 STEP_UP_REQUIRED; 409 LEASE_EXPIRED/TARGET_SUPPRESSED/DISPATCH_EXISTS; 503 PROVIDER_UNAVAILABLE |
| 38.10 | 400 OUTCOME_INVALID; 403 CRM_CAPABILITY_REQUIRED; 409 SOURCE_EVENT_CONFLICT |
| 38.11 | 400 TARGET_FACT_INVALID; 403 STEWARD_REQUIRED; 409 MERGE_CONFLICT; 412 REVISION_MISMATCH |
| 38.12 | 400 EXPORT_POLICY_INVALID; 403 STEP_UP_REQUIRED/PURPOSE_REQUIRED; 413 EXPORT_TOO_LARGE; 503 RENDER_UNAVAILABLE |
| 38.13 | 400 LINK_INVALID; 403 SOURCE_AUTHORITY_REQUIRED; 409 SLUG_TAKEN; 422 DESTINATION_POLICY_FAILED |
| 38.14 | 404 LINK_NOT_FOUND; 410 LINK_RETIRED; 429 RATE_LIMITED; 503 RESOLVER_UNAVAILABLE |
| 38.15 | 400 OAUTH_SCOPE_INVALID; 401 AUTH_REQUIRED; 409 GRANT_EXISTS; 422 RELEASE_NOT_ELIGIBLE; 503 PROVIDER_UNAVAILABLE |
| 38.16 | 401 SERVICE_AUTH_REQUIRED; 409 ATTEMPT_CONFLICT; 422 RELEASE_UNAVAILABLE/GRANT_REVOKED; 503 PROVIDER_UNAVAILABLE |
| 38.17 | 404 LINK_NOT_FOUND; 409 LINK_ALREADY_RETIRED; 412 REVISION_MISMATCH |
| 38.18 | 400 PLAN_INVALID; 403 CAPABILITY_REQUIRED; 422 B2_AUDIENCE_DISABLED/PROVIDER_SPEND_FORBIDDEN |
| 38.19 | 400 BRIEF_INVALID; 403 ENGAGEMENT_AUTHORITY_REQUIRED; 409 DISCLOSURE_VERSION_CONFLICT; 422 RIGHTS_INSUFFICIENT |
| 38.20 | 400 OFFER_INVALID; 409 TERMS_VERSION_STALE; 422 OFFER_BLOCKED/REVIEW_REQUIRED |
| 38.21 | 400 RENDERING_INVALID; 403 CONNECTION_CAPABILITY_REQUIRED; 409 SCHEDULE_CONFLICT; 503 PROVIDER_UNAVAILABLE |
| 38.22 | 401 SERVICE_AUTH_REQUIRED; 409 RECEIPT_DIGEST_CONFLICT/STATE_REGRESSION; 503 PROVIDER_UNAVAILABLE |
| 38.23 | 400 ARTIFACT_INVALID; 403 CAPABILITY_REQUIRED; 409 SOURCE_EVENT_CONFLICT; 422 ARTIFACT_UNRETRIEVABLE |
| 38.24 | 400 EVENT_PLAN_INVALID; 403 EVENT_AUTHORITY_REQUIRED; 409 SOURCE_REVISION_CONFLICT; 503 SOURCE_UNAVAILABLE |
| 38.25 | 404 PLAN_NOT_FOUND; 409 SOURCE_FRESHNESS_UNKNOWN; 503 SOURCE_UNAVAILABLE |
| 38.26 | 401 SERVICE_AUTH_REQUIRED; 400 ATTRIBUTION_INPUT_INVALID; 409 SOURCE_EVENT_CONFLICT; 422 SETTLEMENT_UNKNOWN |
| 38.27 | 400 EPK_INVALID; 403 ASSET_OR_CREDIT_AUTHORITY_REQUIRED; 409 VERSION_CONFLICT; 422 EMBARGO_OR_RIGHTS_BLOCK; 503 RENDER_UNAVAILABLE |
| 38.28 | 400 EMBARGO_INVALID; 403 COUNTERPART_AUTHORITY_REQUIRED; 409 EXCLUSIVE_OVERLAP; 412 REVISION_MISMATCH |

Recovery details are safe and actionable: current revision, violated rule code, retry class and policy version only. Unknown failures map to 500 INTERNAL_ERROR; dependency deadlines to 503 DEPENDENCY_TIMEOUT; admission budgets to 429 RATE_LIMITED with Retry-After.

## Testing Strategy

| ID | Deterministic acceptance and adversarial tests |
|---|---|
| 38.01 | valid source anchor creates one typed campaign; duplicate and cross-entity denied |
| 38.02 | hard/soft readiness and freshness explicit; source outage returns unknown, never ready |
| 38.03 | immutable rendering revision; rights/rule/stale CAS failures |
| 38.04 | pinned/offset graph, hard violations and escaped actions deterministic |
| 38.05 | exact preview commit; concurrent source change aborts all; tasks/outbox atomic |
| 38.06 | DSP route/rule/readiness gate; no false submission |
| 38.07 | merge fields and private target scope; suppression blocks before content disclosure |
| 38.08 | concurrent quota requests respect atomic target budget; opt-out wins |
| 38.09 | one provider acceptance/export; lease expiry and timeout reconciliation |
| 38.10 | append outcome with provenance; replay and conflicting source event |
| 38.11 | additive facts/alias merge; private-contact data cannot enter directory |
| 38.12 | purpose/step-up/field allowlist, expiry and deletion receipt |
| 38.13 | unique durable slug and validated destinations; source revision pin |
| 38.14 | deterministic destination/302; retired 410; schema/log scans prove minimal click |
| 38.15 | exact fan/provider/release scope; revoked/expired receipt denied |
| 38.16 | release delay retry, execution replay and no token leakage |
| 38.17 | retirement CAS and deterministic replacement without slug reuse |
| 38.18 | advisory-only plan; spend credentials and B2 payload rejected |
| 38.19 | Shard14 engagement/disclosure/rights pinned; post verification schedule |
| 38.20 | allowed, blocked and review-required intent fingerprints; terms invalidation |
| 38.21 | capability-aware immutable render/schedule; provider circuit |
| 38.22 | receipt progression, duplicate replay, digest conflict quarantine and unknown reconciliation |
| 38.23 | canonical artifact plus append observations; provenance and retrievability |
| 38.24 | event/ticket/link source versions and readiness; no source mutation |
| 38.25 | advisory soft-date diagnosis with freshness; no automatic date change |
| 38.26 | observed/correlated/modelled labels, settlement/refund restatement and no fan identity |
| 38.27 | immutable accessible EPK snapshot, embargo/rights/credit gate, recipient revoke |
| 38.28 | wall-clock timezone, counterparty evidence, overlap exclusion and lift event |

RLS/grant tests cover anon, fan, entity operator, directory steward, private CRM user, counterpart purpose grant and each service principal. Transaction tests prove anchor preview CAS, target lease atomicity, append-only revisions, suppression race safety, exclusive exclusion and outbox atomicity.

## Deepening Passes

- Micro: pin/offset semantics, hard/soft deadlines, escaped actions, global target suppression, managed/unmanaged destinations, pre-save scope, attribution labels and wall-clock embargoes are explicit.
- Macro: source facts remain in release/tour/event/rights/services/ticket shards; promotion owns only plans, communications, projections and evidence.
- Security: protected contacts, tokens, pitch content, CRM exports, click context and recipient shares are purpose-bound and absent from logs/events.
- Failure: all providers have finite timeout/retry/circuit behavior and local pending/unknown/reconciliation states.
- Two-implementer: 28 routes, strict schemas, exact errors, typed tables, RLS/grants, state rules, event delivery and tests are deterministic.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 38.01 | `be_http_requests_total{operation_id="38.01",outcome,code}`, `be_http_latency_seconds{operation_id="38.01"}`, and `be_operation_recovery_total{operation_id="38.01",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.02 | `be_http_requests_total{operation_id="38.02",outcome,code}`, `be_http_latency_seconds{operation_id="38.02"}`, and `be_operation_recovery_total{operation_id="38.02",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.03 | `be_http_requests_total{operation_id="38.03",outcome,code}`, `be_http_latency_seconds{operation_id="38.03"}`, and `be_operation_recovery_total{operation_id="38.03",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.04 | `be_http_requests_total{operation_id="38.04",outcome,code}`, `be_http_latency_seconds{operation_id="38.04"}`, and `be_operation_recovery_total{operation_id="38.04",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.05 | `be_http_requests_total{operation_id="38.05",outcome,code}`, `be_http_latency_seconds{operation_id="38.05"}`, and `be_operation_recovery_total{operation_id="38.05",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.06 | `be_http_requests_total{operation_id="38.06",outcome,code}`, `be_http_latency_seconds{operation_id="38.06"}`, and `be_operation_recovery_total{operation_id="38.06",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.07 | `be_http_requests_total{operation_id="38.07",outcome,code}`, `be_http_latency_seconds{operation_id="38.07"}`, and `be_operation_recovery_total{operation_id="38.07",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.08 | `be_http_requests_total{operation_id="38.08",outcome,code}`, `be_http_latency_seconds{operation_id="38.08"}`, and `be_operation_recovery_total{operation_id="38.08",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.09 | `be_http_requests_total{operation_id="38.09",outcome,code}`, `be_http_latency_seconds{operation_id="38.09"}`, and `be_operation_recovery_total{operation_id="38.09",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.10 | `be_http_requests_total{operation_id="38.10",outcome,code}`, `be_http_latency_seconds{operation_id="38.10"}`, and `be_operation_recovery_total{operation_id="38.10",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.11 | `be_http_requests_total{operation_id="38.11",outcome,code}`, `be_http_latency_seconds{operation_id="38.11"}`, and `be_operation_recovery_total{operation_id="38.11",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.12 | `be_http_requests_total{operation_id="38.12",outcome,code}`, `be_http_latency_seconds{operation_id="38.12"}`, and `be_operation_recovery_total{operation_id="38.12",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.13 | `be_http_requests_total{operation_id="38.13",outcome,code}`, `be_http_latency_seconds{operation_id="38.13"}`, and `be_operation_recovery_total{operation_id="38.13",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.14 | `be_http_requests_total{operation_id="38.14",outcome,code}`, `be_http_latency_seconds{operation_id="38.14"}`, and `be_operation_recovery_total{operation_id="38.14",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.15 | `be_http_requests_total{operation_id="38.15",outcome,code}`, `be_http_latency_seconds{operation_id="38.15"}`, and `be_operation_recovery_total{operation_id="38.15",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.16 | `be_http_requests_total{operation_id="38.16",outcome,code}`, `be_http_latency_seconds{operation_id="38.16"}`, and `be_operation_recovery_total{operation_id="38.16",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.17 | `be_http_requests_total{operation_id="38.17",outcome,code}`, `be_http_latency_seconds{operation_id="38.17"}`, and `be_operation_recovery_total{operation_id="38.17",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.18 | `be_http_requests_total{operation_id="38.18",outcome,code}`, `be_http_latency_seconds{operation_id="38.18"}`, and `be_operation_recovery_total{operation_id="38.18",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.19 | `be_http_requests_total{operation_id="38.19",outcome,code}`, `be_http_latency_seconds{operation_id="38.19"}`, and `be_operation_recovery_total{operation_id="38.19",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.20 | `be_http_requests_total{operation_id="38.20",outcome,code}`, `be_http_latency_seconds{operation_id="38.20"}`, and `be_operation_recovery_total{operation_id="38.20",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.21 | `be_http_requests_total{operation_id="38.21",outcome,code}`, `be_http_latency_seconds{operation_id="38.21"}`, and `be_operation_recovery_total{operation_id="38.21",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.22 | `be_http_requests_total{operation_id="38.22",outcome,code}`, `be_http_latency_seconds{operation_id="38.22"}`, and `be_operation_recovery_total{operation_id="38.22",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.23 | `be_http_requests_total{operation_id="38.23",outcome,code}`, `be_http_latency_seconds{operation_id="38.23"}`, and `be_operation_recovery_total{operation_id="38.23",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.24 | `be_http_requests_total{operation_id="38.24",outcome,code}`, `be_http_latency_seconds{operation_id="38.24"}`, and `be_operation_recovery_total{operation_id="38.24",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.25 | `be_http_requests_total{operation_id="38.25",outcome,code}`, `be_http_latency_seconds{operation_id="38.25"}`, and `be_operation_recovery_total{operation_id="38.25",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.26 | `be_http_requests_total{operation_id="38.26",outcome,code}`, `be_http_latency_seconds{operation_id="38.26"}`, and `be_operation_recovery_total{operation_id="38.26",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.27 | `be_http_requests_total{operation_id="38.27",outcome,code}`, `be_http_latency_seconds{operation_id="38.27"}`, and `be_operation_recovery_total{operation_id="38.27",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 38.28 | `be_http_requests_total{operation_id="38.28",outcome,code}`, `be_http_latency_seconds{operation_id="38.28"}`, and `be_operation_recovery_total{operation_id="38.28",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

- Micro ambiguity: PASS — 28/28 interactions have complete contracts, validation, errors, persistence, policy and tests.
- Macro ambiguity: PASS — external source owners, promotion ownership and cross-shard seams are explicit.
- Devil's-advocate check: PASS — no path bypasses suppression, promises pay-for-airplay, auto-commits a soft date, sends twice, fingerprints fans, leaks private CRM, overlaps exclusives or presents modelled attribution as observed.
- Source contradiction check: PASS — advisory diagnoses and plans never mutate canonical dates/spend; correlated/modelled conversions remain labeled.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend specification for IA Shard 38 |
| 2026-08-29 | Made fixed-read pagination N/A and exact nested response caps explicit for 38.02, 38.14, and 38.25. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure contracts](00-infrastructure.md)
- [IA Shard 38](../ia/38-promotion-marketing.md)
- [Engineering standards](../ENGINEERING-STANDARDS.md)
- [Data placement strategy](../data-placement-strategy.md)
