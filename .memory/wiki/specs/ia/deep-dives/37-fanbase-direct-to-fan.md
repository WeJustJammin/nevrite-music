# Deep Dive 37 — Fanbase and direct-to-fan

**Status:** Complete
**Parent:** [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
**Surface:** Responsive web/PWA

## Overview

This deep dive fixes the implementation-level state, concurrency and privacy rules for Shard 37. The dominant invariant is that commercial usefulness never outranks fan-authored consent: observations may enrich a private relationship, but only an affirmative, current and purpose-specific instruction makes a fan contactable. The second invariant is financial containment: consumer launch supports one known payee, while split settlement, escrow, campaign custody and three-party commerce remain mechanically disabled.

### Convergence Findings

| Pass | Finding | Resolution |
|---|---|---|
| Cross-section | Import, follow, purchase and attendance all create relationship evidence but have different communication authority | Normalize as observations; none mutate consent |
| What-if | Campaign snapshot and withdrawal can race | Re-evaluate consent at transport handoff; fan instruction wins while still suppressible |
| What-if | Account closure conflicts with permanent downloads and receipts | Sever identity, retain scoped transactional/entitlement evidence and offer recovery through verified ownership |
| Adversarial | Artist probes imports to discover whether an address is already a platform user | Import responses are row-status invariant and never disclose cross-entity/account matches |
| Adversarial | Paid tip used to bypass block | Block check occurs before payment capture and message storage |
| Adversarial | Scarcity and affinity used as discriminatory hidden ranking | Affinity is explainable, confidence-gated and cannot be the sole denial predicate |
| Operations | Bulk delivery threatens shared sender reputation | Capability flag is fail-closed and requires approved sender/runbook/threshold policy version |
| Operations | Crowdfunding specification implies custody that B3 forbids | Keep non-monetary interest/update shell only; payment commands do not exist while gated |

## Interactions

### Relationship Resolution

1. Producer authenticates, validates its source event and submits an opaque fan key plus artist entity.
2. Intake stores `fan_observation` before resolution and acknowledges by observation ID.
3. Resolver compares only allowlisted strong identifiers: authenticated account ID or independently verified normalized email.
4. One strong match links the observation to the existing relationship; no match creates a new private relationship.
5. Conflicting strong matches or weak-only evidence creates `identity_resolution_case`; observations remain queryable only through source-scoped projections.
6. Resolution emits an opaque relationship event. It never changes consent, follow durability or marketing eligibility.
7. Later erasure/deidentification detaches direct identifiers while preserving source facts required for orders, disputes and permanent entitlements.

### Consent and Dispatch Race

1. Fan submits grant/withdrawal through authenticated session, verified channel challenge or single-purpose signed token.
2. Consent service verifies fan authorship, assigns trusted provenance and appends `consent_event` with server receive time and client-authored time.
3. Effective contactability folds events by `(fan, entity, channel, purpose)`; latest valid fan-authored event wins, with withdrawal winning equal-time ambiguity.
4. Campaign creation stores audience predicate and immutable recipient snapshot but does not store an `allowed=true` promise.
5. Scheduler filters frequency, suppression and channel preference when a timezone bucket becomes due.
6. Delivery gateway re-queries contactability immediately before transport acceptance and writes a one-use dispatch lease.
7. Withdrawal before lease consumption cancels it. Withdrawal after provider acceptance records `accepted_before_withdrawal` and suppresses all future messages.
8. Consent outage, stale ledger replica or missing purpose mapping produces `suppressed_policy_unknown`; operators cannot override.

### Import and Controller Change

1. Entity actor with audience-import mandate declares source, collection date and claimed legal basis.
2. Import normalizes rows inside a quarantined PII workspace and validates formatting, duplication and suppression.
3. Strong matches attach import observations; weak rows remain quarantined; every row remains unmarketable without independent effective consent.
4. Export returns row-local reasons such as `accepted_uncontactable`, `invalid`, `duplicate_in_file` or `suppressed`; it never returns `existing_platform_user`.
5. Controller change starts a dual-controlled case with old/new entity authority evidence.
6. Transactional obligations reparent only after approval; marketing contactability becomes `controller_review_required` and fails closed.
7. Fans receive a transactional controller-change notice with preference/re-permission path before marketing can resume.

### Campaign Lifecycle

`draft → reviewed → scheduled → dispatching → completed`

Alternate terminal states are `cancelled`, `blocked_policy` and `halted_reputation`. Every content edit creates a new revision; only `draft` revisions are mutable. Schedule binds one revision and recipient snapshot. Cancellation stops unleased buckets. Circuit breaker revokes pending leases, leaves accepted provider messages intact and records the exact threshold/policy version. Object-derived urgent notices belong to transactional messaging and cannot be asserted by an artist flag.

### Store and Membership Lifecycle

1. Entity actor publishes versioned listing referencing a canonical release/merch source and exactly one approved payee.
2. Fan cart accepts products from one seller and fulfillment group; ticket and marketplace goods never join this cart.
3. Inventory reservation and price hold use separate expiries. Payment attempt binds both versions and one idempotency key.
4. Provider uncertainty enters `payment_reconciling`; no second capture starts until reconciliation resolves.
5. Settlement creates order observation, receipt and permanent digital entitlement in one outbox-backed transaction.
6. Physical fulfillment progresses independently through `unfulfilled → accepted → dispatched → delivered`, with explicit `provider_unknown` and refund states.
7. Membership progresses `pending → active → grace → cancelled/ended`; cancellation disables renewal immediately, not current paid period.
8. Benefit publication snapshots eligible members. Permanent/download grants survive later lapse; ongoing vault access follows membership/grace state.
9. Entity termination stops renewal, closes new sales and preserves existing receipts, orders and permanent grants.

### Campaign Interest and Virtual Events

1. Artist may publish a non-monetary campaign goal, timeline and updates while paid-campaign gate is closed.
2. Fan may record private interest; no amount, pledge, charge authorization, custody account, milestone or tranche record exists.
3. Membership virtual event binds qualifying tier and provider-neutral transport metadata before publication.
4. Admission creates a bounded access lease after membership/grace verification; a newly joined member receives one immediately.
5. Membership lapse after admission does not revoke the active lease. Trust-and-safety moderation may revoke for a separately recorded case.
6. V1 exposes no live chat, donation overlay or public attendance leaderboard.

### Follow, Alert and Demand

1. Anonymous browser stores local follow by random device key; server receives no alert subscription.
2. Upgrade flow verifies email, asks explicit gig-alert consent and captures coarse location/radius.
3. Durable follow links to fan relationship without disclosing identity to artist.
4. Announced first-party show emits an on-sale candidate; alert service joins durable follows and location policy.
5. Candidate deduplicates by event, aggregates followed acts and explains why the fan received it.
6. Unfollow/consent withdrawal before dispatch invalidates candidate.
7. Follow, purchase, attendance and explicit request may create private demand facts. No artist/operator aggregate projection exists while B2 is closed.

## Contracts

### Command Results

| Command | Success | Stable refusal / recovery |
|---|---|---|
| `RecordFanObservation` | `{observationId, resolutionState}` | `invalid_source`, `rate_limited`; never reports match existence |
| `AppendConsentInstruction` | `{eventId, effectiveState, ledgerVersion}` | `verification_required`, `token_invalid`; ledger outage returns unavailable, never queued grant |
| `ImportAudienceBatch` | `{importId, rowCounts}` | `mandate_denied`, `provenance_required`, `capability_disabled` |
| `SaveSegmentDefinition` | `{segmentId, version, estimatedRange}` | `predicate_invalid`, `revision_conflict`, `sparse_disclosure_denied` |
| `ScheduleCampaign` | `{campaignId, revision, scheduleState}` | `delivery_gate_closed`, `audience_invalid`, `compliance_block_missing` |
| `CancelCampaign` | `{cancelledBuckets, acceptedCount}` | `terminal_campaign`; accepted transport is not falsely recalled |
| `ReserveCommerceLines` | `{reservationId, stockExpiresAt, priceExpiresAt}` | `stock_unavailable`, `listing_changed`, `mixed_scope_cart` |
| `ConfirmSinglePayeePayment` | `{orderId, paymentState}` | `multi_payee_disabled`, `payment_reconciling`, `terms_changed` |
| `ChangeMembershipState` | `{membershipId, state, effectiveAt}` | `tier_full`, `billing_uncertain`, `already_terminal` |
| `PublishVaultItem` | `{itemId, grantCount}` | `empty_tier`, `release_authority_missing`, `asset_unavailable` |
| `PublishInterestCampaign` | `{campaignId, state}` | `paid_action_forbidden`, `timeline_invalid`, `mandate_denied` |
| `GrantVirtualEventAccess` | `{eventId, accessLeaseId, expiresAt}` | `membership_required`, `event_closed`, `moderation_denied` |
| `CreateDurableFollow` | `{followId, consentState}` | `email_unverified`, `alert_consent_required`, `location_partial` |
| `RequestLibraryDownload` | `{jobId, queuePosition, formats}` | unknown/non-owned item is `not_found`; legal hold is explicit after ownership proof |
| `CreateDemandRequest` | `{requestId, visibility:'private'}` | `location_required`, `artist_unavailable`; no public count |

### Capability Gates

| Gate | Closed behavior | Required activation evidence |
|---|---|---|
| `broadcast_delivery` | Composer may save/test locally; all audience dispatch refuses | Managed sender, domain policy, complaint/bounce thresholds, ramp curve, circuit breaker and incident runbook |
| `sms_marketing` | No SMS candidate or cost-incurring provider call | Broadcast gate plus jurisdiction matrix, quiet hours, TCPA/equivalent counsel approval and opt-in wording |
| `multi_payee_commerce` | Listing/payment schema accepts one payee only | B3 counsel, provider, tax, reserve, dispute and insolvency controls |
| `paid_campaigns` | No pledge/capture/custody/release command | Funds-protection model and B3 activation approval |
| `sparse_audience_analytics` | No map, low-count export or cross-account audience view | B2 privacy/security approval with numeric floor and query-wide enforcement |

Capability evaluation is server-side, versioned and default-deny. UI feature flags cannot activate a closed capability. Migration order adds enforcement before any surface or provider credential.

### Cross-Shard Contracts

- [[specs/ia/01-identity-authority|Shard 01]] supplies fan/artist party identity, mandate and controller-change evidence; Shard 37 never invents authority from collaboration.
- [[specs/ia/06-trust-safety|Shard 06]] receives moderation cases/evidence and returns scoped block/moderation decisions; it does not gain general audience access.
- [[specs/ia/11-community-graph|Shard 11]] may supply collaborator relations only as context; no collaborator relation grants audience or store control.
- [[specs/ia/22-release-distribution|Shard 22]] owns release/asset/credit facts and availability; Shard 37 owns commercial listing and fan entitlement.
- [[specs/ia/35-ticket-products-sales|Shard 35]] owns ticket inventory and on-sale truth; Shard 37 owns durable follow and alert resolution.
- [[specs/ia/00-infrastructure|Shard 00]] owns outbox, delivery, rate-limit, observability and provider health primitives; Shard 37 owns domain policy and dedupe keys.

## Data Models

### State Invariants

| Model | Invariant |
|---|---|
| `fan_relationship` | At most one active record per fan/entity after strong-key resolution; merges are additive and reversible by evidence case |
| `consent_event` | Immutable; actor is fan or verified fan-controlled channel; owner/admin actor type rejected by constraint |
| `effective_contactability` | Derived projection only; key includes entity, channel and purpose; unknown/stale is denied |
| `suppression` | Fan withdrawal, hard bounce and abuse suppression are distinct reasons; artist cannot clear any |
| `recipient_snapshot` | Immutable membership in intended audience; not evidence that delivery was lawful or occurred |
| `delivery_attempt` | Unique `(campaign_id, fan_relationship_id)` successful/accepted result across channels |
| `product_listing` | Exactly one seller entity and one payee route while B3 closed; source object kind validated |
| `reservation` | Quantity conservation by variant; release/consume transition occurs once under row lock |
| `order` | Payment, fulfillment, refund and entitlement states are independent projections over immutable line snapshots |
| `membership` | One current membership per fan/tier relationship; history append-only; hard tier capacity never oversubscribes |
| `benefit_grant` | Unique `(fan, vault_item)`; permanence captured at grant and never lowered |
| `interest_campaign` | Contains no money/pledge/custody fields while paid-campaign capability is closed |
| `event_access_lease` | Admission is immutable for its event window except explicit moderation revocation |
| `follow` | Browser-local and durable identities cannot both dispatch; durable merge tombstones local subscription candidate |
| `fan_entitlement` | Permanent state cannot transition to revoked; legal hold affects delivery availability, not ownership fact |
| `demand_signal` | Exact fan and location restricted to fan-private schema; no aggregate table while B2 closed |

### Deletion, Retention and Recovery

- Fan erasure removes/replaces direct contact identifiers and reusable import material, revokes signed tokens and deletes non-required listening-import source files.
- Consent evidence retains minimal channel hash, instruction, policy version and timestamp for the approved statutory period without retaining message content.
- Orders, refunds, tax evidence and permanent entitlements follow financial/legal retention; artist-facing exports use deidentified fan IDs after severance.
- Campaign content, recipient reason and provider outcome retain enough evidence to answer complaints; raw audience snapshots expire by policy and are not reusable lists.
- Browser-local follows expire after configurable inactivity; durable follows persist until fan withdrawal but must carry their original justification.
- Download source assets remain available for sold entitlements or move to explicit legal-hold recovery; delisting never cascades deletion.

## Access Control

### Permission Predicates

| Action | Predicate |
|---|---|
| Manage entity audience | active entity mandate includes `audience.manage`; relationship PII remains hidden unless separately necessary |
| Export import report | same import owner + `audience.import`; output contains row-local status only |
| View segment factors | entity mandate includes `audience.analytics`; values are entity-scoped and sparsity-filtered |
| Compose campaign | `campaign.compose`; scheduling also requires `campaign.send`, step-up auth and open capability gate |
| Manage store/tier | active mandate includes matching commerce capability; one-payee policy enforced independently |
| Publish collaborator asset | entity publication mandate plus source-shard release authority from every required party |
| Support order | purpose-bound case grant names order and expires automatically |
| Moderate tip/message | trust case scope names content; payment amount is hidden unless case reason requires it |
| Download entitlement | authenticated fan owns entitlement or presents single-use recovery proof |
| Evaluate demand aggregate | impossible while B2 closed; no administrator bypass predicate exists |

No artist-facing query may accept raw email as a lookup key. Staff break-glass access requires incident/case ID, step-up authentication, bounded duration and immutable audit. Bulk data exports are asynchronous, encrypted, expiring and owner-notified. Service roles cannot bypass RLS with general database ownership; privileged functions expose narrow reviewed arguments and row-limited results.

## Accessibility

- Signed unsubscribe/preference links land directly on the relevant entity/channel/purpose, announce the current state and offer a one-action withdrawal without authentication puzzle.
- Consent history is summarized in plain language while machine timestamps remain available; conflicting state never relies on visual chronology alone.
- Segment builder uses labeled form controls and a keyboard-operable expression sequence; generated predicate summary is readable before save.
- Campaign review exposes each channel as a distinct semantic region and lists omitted/altered blocks; screen readers are not forced through every preview by default.
- Stock, cart and payment uncertainty use persistent status text; timeout recovery never traps focus or asks users to pay again blindly.
- Membership cancellation and renewal state show exact effective date and retained benefits; cancellation uses the same interaction effort as joining.
- Vault locks identify required tier in text; access loss and permanent ownership are distinguishable without color or icon alone.
- Fan library download queue announces position changes politely and supports pause/resume; bulk export manifest is accessible HTML/CSV in addition to machine JSON.
- Alert radius supports units by locale and manual text entry; map is supplementary to a list and no precise-pointer interaction is required.
- Virtual-event media requires captions and keyboard-operable player controls; if provider accessibility cannot meet the policy, the event cannot be represented as platform-hosted accessible delivery.

## Event Schemas

### Ordering and Idempotency

| Stream key | Ordering guarantee | Consumer rule |
|---|---|---|
| Fan/entity consent | Per-key monotonic ledger version | Reject older projection writes; withdrawal wins equal timestamp |
| Campaign/fan delivery | One dispatch lease per key | Provider retry reuses transport idempotency key |
| Listing/variant inventory | Transactional revision and quantity lock | Late events cannot reduce stock twice |
| Order/payment | Provider event time plus platform reconciliation sequence | Never infer capture from timeout; terminal provider fact wins |
| Membership | Per-membership sequence | Benefit consumer applies each state/grant once |
| Follow/event alert | Event-keyed candidate sequence | New bill revision updates candidate; accepted alert never duplicates |
| Entitlement | Per fan/artifact grant sequence | Permanent grant is monotonic; availability is separate |

Every event envelope includes `event_id`, `event_type`, `schema_version`, `aggregate_id`, `aggregate_version`, `occurred_at`, `recorded_at`, `correlation_id`, `causation_id` and producer. Outbox commit is atomic with canonical mutation. Dead-letter replay preserves IDs. Consumers expose lag/freshness; they do not silently substitute stale permission projections.

### Privacy Classification

- `restricted_pii`: email, import row, signed token, exact location; never event-bus payload.
- `entity_confidential`: relationship ID, segment, campaign outcome, commerce/order relation; entity and purpose scoped.
- `fan_private`: library, follows, affinity inputs and demand requests; visible only to fan except approved aggregates.
- `public`: published listing, tier, product availability and artist-authored campaign content after send; no audience membership.

## Edge Cases

| Scenario | Required outcome |
|---|---|
| Same fan uses two verified emails | Relationships remain separate until explicit account link/strong identity proof; no artist-assisted merge |
| Verified email reassigned | New verification does not inherit old consent, follows, orders or library without account recovery proof |
| Fan closes account with active membership | Renewal stops unless a verified billing recovery path is explicitly retained; paid-period access and permanent grants remain recoverable |
| Consent events have equal authored time | Withdrawal takes precedence; server order breaks same-action ties deterministically |
| Campaign revision changes after approval | New revision returns to review; existing schedule remains bound to old immutable revision or is cancelled |
| Reputation degrades mid-bucket | Pending leases halt immediately; accepted sends record provider outcome and are not retried elsewhere |
| Artist attempts transactional label for promotion | Purpose classifier/policy rejects mixed content; no urgency or transactional override is artist-authored |
| Import file contains another artist's suppression | Row remains uncontactable without revealing platform/global suppression source |
| Product sells out during payment | Valid reservation honors stock; expired reservation plus late successful capture opens fulfillment/refund exception |
| POD provider changes cost after purchase | Buyer terms remain fixed; seller/platform absorbs or refunds according to disclosed policy, never surprise-charges |
| Duplicate digital purchase | Warn and offer gift before capture; intentional duplicate creates separate gift entitlement, not duplicate ownership |
| Tier raised after vault grant | Existing permanent grant remains; future ongoing access follows new tier only after explicit version effective date |
| Last membership slot and two captures | Capacity lock selects one; losing authorization is voided/refunded automatically |
| Artist dies or entity dissolves | New billing/sales stop; steward case handles public/archive state; permanent grants and receipts survive |
| Fan tips blocked artist | Block policy may prevent message/contact while allowing silent payment only if explicitly configured; v1 refuses both before capture |
| Local browser storage cleared | Local follow is lost by design; UI never claimed durability or alerts before verification |
| DST changes between schedule and send | Store IANA timezone and recompute local dispatch; never cache fixed offset |
| Festival has multiple followed artists | One event-keyed alert lists matching acts and uses one frequency-budget unit |
| No fan location | Follow persists; durable alert state is visibly partial and no demand geo is inferred from IP |
| Listening import source revokes access | Imported suggestions remain as provenance facts; ongoing sync is not assumed and source token is deleted |
| Legal takedown conflicts with purchase | Entitlement remains recorded; delivery becomes withheld with named reason, support route and refund/credit policy state |
| B2/B3 gate accidentally enabled in UI | Server capability and schema constraints still refuse; security alert records attempted unsupported path |

## Verification

- **Two-implementer check:** canonical keys, states, command refusals, race winners and gate behavior are explicit enough to produce equivalent implementations.
- **Devil's-advocate check:** artist/admin consent bypass, import enumeration, paid-message block bypass, duplicate send/capture, sparse analytics and hidden multi-payee routes are mechanically denied.
- **Bidirectional dependency check:** every consumed identity, moderation, catalog, ticket and infrastructure fact names its owner; parent shard names this deep dive.
- **Complexity check:** document remains below the 400-line pass threshold; no split required.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [37-fanbase-direct-to-fan § Contracts](../37-fanbase-direct-to-fan.md#contracts) defines commands/queries and [37-fanbase-direct-to-fan § Event Schemas](../37-fanbase-direct-to-fan.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Locked relationship, consent, commerce, messaging and discovery state machines | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
