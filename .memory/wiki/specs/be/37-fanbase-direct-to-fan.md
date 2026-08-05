# Fanbase and direct-to-fan — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]  
**Deep Dive:** [[specs/ia/deep-dives/37-fanbase-direct-to-fan|Fanbase direct-to-fan deep dive]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** Single contract; 37.01, 37.02, 37.03, 37.04, 37.05, 37.06, 37.07, 37.08, 37.09, 37.10, 37.11, 37.12, 37.13, 37.14, 37.15, 37.16, 37.17, 37.18, 37.19, 37.20, 37.21, 37.22, 37.23 and 37.24. The IA complexity gate explicitly passes without decomposition.
- **Boundary:** fan relationship resolution, consent/preferences/imports, segmentation/campaigns, storefront commerce, memberships/vault/tips/events, follows/alerts/library and private demand.
- **Approval:** Single-document recommendation accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 37 IA/deep dive | all fan relationship, consent, campaign, commerce, membership and demand contracts |
| Shards 01, 06, 22, 27, 28, 35 and 36 | identity/authority, abuse, assets, entitlements, commerce, ticketing and consent sources |

## Relationship and Consent Invariants

- First-party observation is immutable, at-least-once and never dropped. Resolver creates/links artist-scoped relationship; weak identity is quarantined and never auto-merged.
- Consent ledger is fan-authored per artist entity, channel and purpose with provenance, policy and authored time. Unknown/stale denies; withdrawal wins dispatch race.
- Transactional purpose remains separate from marketing. Preference token is single-purpose and cannot enumerate other artists, purposes or relationship data.
- Audience import requires verified entity mandate, source/checksum and provenance declaration. Rows validate/quarantine independently, produce privacy-safe report and never mutate consent.
- Controller transfer reparents relationship atomically under Shard 01 workflow and notifies fans. Marketing stays suppressed until controller-change policy passes.
- Fan erasure removes direct identifiers/reusable import/listening source, revokes tokens and retains minimal lawful consent/financial/entitlement evidence using deidentified IDs.

## Campaign and Benefit Invariants

- Segment uses typed allowlisted predicate AST/version and returns count range/factor explanation. Sparse/unsupported predicate refuses disclosure; no cross-artist membership enumeration.
- Benefit eligibility is explicit criteria/entitlement snapshot and delegates mechanism to owner shard. Affinity alone cannot deny and oversubscribed grants block.
- Campaign revision is immutable after scheduling and contains typed source object/blocks/per-channel rendering/audience predicate. Required compliance/footer/delivery gates are server-enforced.
- Dispatch snapshots audience, chooses one fan-preferred eligible channel, and rechecks consent/contactability immediately before transport. Unknown/reputation throttles or suppresses; no unconsented fallback.
- Delivery dedupes `(campaign, fan)`. Cancellation stops undispatched timezone buckets; in-flight may finish but never retries duplicate.

## Commerce, Membership and Library Invariants

- Store listing pins entity, product/source revision, availability, lock/credit facts, exact all-in price/currency and fulfilment policy. Stale stock remains visible unavailable.
- Cart is single-entity, pins stock 15 minutes and price 30 minutes, and shows visible reprice after expiry. One-payee settlement only; split/escrow is disabled behind B3.
- Settled digital order issues permanent entitlement/library grant independent of CDN delivery. Physical/POD uses accepted provider/artist route without platform stock custody and preserves explicit uncertainty/refund path.
- Membership tier is published/non-empty and one-payee. Cancellation stops renewal immediately; current access survives paid term/grace and permanent benefits never revoke on lapse or tier raise.
- Vault item requires artist authority, collaborator release authority, eligible tier and valid asset. Grant snapshots active tiers; raised tier never revokes prior permanent grant.
- Tip is non-entitling patronage receipt with moderated private message; blocked parties cannot bypass block through payment.
- Campaign-interest page is non-monetary while B3 closed: no pledge, capture, custody or release controls.
- Virtual-event access lease requires active/grace or newly settled membership; mid-event join is immediate and lapse does not eject. Moderation remains enforceable and v1 has no chat.

## Follow, Alert and Demand Invariants

- Browser-local follow toggles without durable contact authority and expires by inactivity. Durable follow requires verified channel/consent and persists until withdrawal.
- Unfollow suppresses re-import and cancels pending marketing alerts. Gig alert requires durable follow, location, consent and first-party announced on-sale event and dedupes by event.
- Fan library serves only owned permanent/eligible artifacts with stream/download/export manifest. Unauthorized ownership lookup is `404`; capacity throttles queue rather than deny.
- Listening-history import is explicit upload or scoped one-time source read. Suggestions require confirmation and never auto-follow; unmatched artists remain private informational demand.
- Show request is private, non-binding, withdrawable and has no public count/commitment language. Raw signal remains fan-private; aggregate disclosure is unreachable until B2 plus threshold/consent policy.
- Artist/admin cannot bypass fan consent, block state, import isolation, one-payee or B2/B3 gates.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/fan-observations` | immutable source event/fan-key evidence/artist/occurred time/key; admitted producer | `201 FanObservationResponse`; linked/quarantined resolution | `403 SOURCE_FORBIDDEN`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/fan-consents` | entity/channel/purpose/action/policy/signed fan proof/key; fan | `201 FanConsentResponse`; ledger/effective contactability | `403`, `409 TEXT_STALE`, `422`, `429` |
| `PUT /api/v1/fan-preferences/{entityId}` | channel/purpose/frequency/location/single-purpose token/key; fan | `FanPreferenceResponse`; additive preferences | `403 TOKEN_SCOPE_FORBIDDEN`, `409 VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/entities/{id}/audience-imports` | mandate/source/provenance/checksum/object key; entity controller | `202 AudienceImportResponse`; batch/row quarantine report | `403 MANDATE_REQUIRED`, `409 IMPORT_REUSED`, `422`, `429` |
| `POST /internal/v1/fan-relationships/stewardship-transfers` | controller workflow/relationship set/policy version/key; authority worker | `201 StewardshipTransferResponse`; reparented/suppressed/notices | `403`, `409 POLICY_INCOMPLETE`, `422`, `429` |
| `POST /api/v1/entities/{id}/fan-segments` | predicate AST/schema/confidence-sparsity policy/key; entity analyst | `201 FanSegmentResponse`; version/count range/factors | `403`, `409 VERSION_CONFLICT`, `422 PREDICATE_UNSUPPORTED|SPARSE_DISCLOSURE_DENIED`, `429` |
| `POST /api/v1/entities/{id}/fan-benefit-grants` | criteria/entitlement definition/mechanism ref/audience snapshot/key; entity operator | `201 FanBenefitGrantResponse`; eligible snapshots/state | `403`, `409 OVERSUBSCRIBED`, `422 CRITERIA_INVALID`, `429` |
| `POST /api/v1/entities/{id}/campaigns` | source object/typed blocks/renderings/predicate/key; campaign actor | `201 CampaignResponse`; draft revision/compliance gaps | `403`, `409 SOURCE_STALE`, `422 REQUIRED_BLOCK_MISSING|LEGAL_FOOTER_MISSING`, `429` |
| `POST /api/v1/campaigns/{id}/schedules` | immutable revision/buckets/audience snapshot/delivery capability/key; campaign approver | `201 CampaignResponse`; scheduled/buckets/version | `403`, `409 REVISION_CHANGED`, `422 DELIVERY_GATE_FAILED`, `429` |
| `POST /api/v1/campaigns/{id}/cancellations` | undispatched buckets/reason/expected version/key; campaign actor | `CampaignResponse`; remaining cancelled | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /public/entity-stores/{id}` | query/facets/cursor | `EntityStorefrontResponse`; products/all-in prices/availability | `404`, `429`, `503` |
| `POST /api/v1/entity-store-carts` | entity/listing revision/variant/quantity/stock-price versions/key; fan | `201 StoreCartResponse`; holds/expiries/total | `403`, `409 STOCK_UNAVAILABLE|PRICE_STALE`, `422 CROSS_ENTITY_CART_FORBIDDEN`, `429` |
| `POST /api/v1/entity-store-carts/{id}/checkout` | cart/payment/payee/holder/key; fan; B3-safe one-payee route | `201 StoreOrderResponse`; settled/pending order | `403 B3_GATE_CLOSED`, `409 HOLD_EXPIRED|PAYMENT_AMBIGUOUS`, `422 MULTI_PAYEE_DISABLED`, `429` |
| `POST /internal/v1/store-orders/{id}/digital-fulfillment` | settled order/encoded asset/event key; fulfillment worker | `201 DigitalEntitlementResponse`; permanent grant/delivery state | `403`, `409 EVENT_REUSED`, `422 ASSET_UNAVAILABLE`, `429` |
| `POST /internal/v1/store-orders/{id}/physical-fulfillment` | settled order/provider route/lead time/event key; fulfillment worker | `PhysicalFulfillmentResponse`; tracking/pending/refund path | `403`, `409 EVENT_REUSED`, `422 PROVIDER_NOT_ADMITTED`, `429` |
| `POST /api/v1/entities/{id}/memberships` | tier/payment/payee/key; fan | `201 MembershipResponse`; active/pending/grace benefits | `403`, `409 PAYMENT_AMBIGUOUS`, `422 TIER_EMPTY|MULTI_PAYEE_DISABLED`, `429` |
| `DELETE /api/v1/memberships/{id}` | expected version/key; member | `204`; renewal stopped/effective date retained benefits | `403`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/membership-vault/items` | entity/asset/tier set/collaborator release refs/key; artist actor | `201 VaultItemResponse`; published/grants/blocked gaps | `403`, `409 SOURCE_STALE`, `422 CONSENT_REQUIRED|TIER_EMPTY`, `429` |
| `POST /api/v1/entities/{id}/tips` | amount/currency/payee/optional message/key; fan | `201 TipResponse`; non-entitling receipt/private message | `403 BLOCKED_PARTY`, `409 PAYMENT_AMBIGUOUS`, `422 MULTI_PAYEE_DISABLED`, `429` |
| `POST /api/v1/entities/{id}/interest-pages` | non-monetary goal/updates/key; artist actor | `201 InterestPageResponse`; published/signals | `403`, `422 MONETARY_CONTROL_DISABLED`, `429` |
| `POST /api/v1/virtual-fan-events/{id}/access-leases` | fan/membership/moderation state/key; fan | `201 VirtualEventAccessResponse`; lease/expiry | `403 BLOCKED_OR_MODERATED`, `409 MEMBERSHIP_INELIGIBLE`, `422 ACCESSIBILITY_POLICY_FAILED`, `429` |
| `PUT /api/v1/fan-follows/{entityId}` | local-or-durable action/verified channel/consent/geo/key; fan/browser | `FanFollowResponse`; local/durable state | `403`, `409 CONSENT_REQUIRED`, `422`, `429` |
| `POST /internal/v1/gig-alerts` | announced first-party event/artist/location/on-sale/fan follow/key; alert worker | `201 GigAlertResponse`; sent/suppressed/partial | `403`, `409 EVENT_REUSED|EVENT_STALE`, `422 LOCATION_MISSING`, `429` |
| `GET /api/v1/fan-library` | query/facets/cursor/export format; fan | `FanLibraryResponse`; owned artifacts/queue/manifest | `403`, `404`, `429`, `503` |
| `POST /api/v1/fan-listening-imports` | upload or one-time source grant/checksum/key; fan | `202 ListeningImportResponse`; suggestions/unmatched private signals | `403`, `409 IMPORT_REUSED`, `422 SOURCE_UNSUPPORTED`, `429` |
| `POST /api/v1/artists/{id}/show-requests` | coarse location/context/key; fan | `201 FanShowRequestResponse`; private non-binding signal | `403 B2_DISABLED`, `409 SIGNAL_DUPLICATE`, `422 LOCATION_REQUIRED`, `429` |
| `DELETE /api/v1/fan-show-requests/{id}` | expected version/key; fan | `204`; withdrawn | `403`, `409 VERSION_CONFLICT`, `428`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Artist-scoped relationship | `observed -> linked|quarantined`; `quarantined -> linked|discarded`; `linked -> transferred|erased` | Strong governed identity evidence links; weak/colliding identity quarantines for review; controller transfer reparents atomically. Erasure removes direct/reusable identifiers while retaining only lawful deidentified evidence. |
| Artist/channel/purpose consent | `unknown -> granted|declined`; `granted -> withdrawn|expired`; `declined|withdrawn|expired -> granted` only through a new authored record | Fan-authored current policy controls state; unknown/stale denies and withdrawal wins every dispatch race. Transactional purpose never becomes marketing consent. |
| Audience or listening import | `staged -> validating -> committed|quarantined|failed`; `quarantined -> committed|discarded` | Checksum/source/provenance validation classifies rows independently. Commit creates observations/suggestions only, never consent or verified provenance; reused import identity returns `409 IMPORT_REUSED`. |
| Campaign revision | `draft -> scheduled|cancelled`; `scheduled -> dispatching|cancelled`; `dispatching -> completed|cancelled` | Compliance, audience and channel gates must pass before scheduling; immutable revision and audience snapshot begin dispatch. Cancellation stops undispatched buckets while in-flight transport may finish once. |
| Campaign delivery | `pending -> sent|suppressed|failed`; `failed -> retrying|closed`; `retrying -> sent|suppressed|failed` | Immediate consent/contactability/reputation recheck selects one preferred eligible channel. `(campaign, fan)` dedupe prevents duplicate delivery and forbids unconsented fallback. |
| Store cart and order | Cart `active -> checkout_pending|expired|abandoned`; `checkout_pending -> converted|reconciliation_required|released`; order `pending -> settled|failed|reconciliation_required` | Exact stock/price holds expire independently; one-payee checkout commits once or reconciles ambiguity. Settlement issues permanent digital entitlement before delivery; B3-closed multi-payee paths reject. |
| Membership | `pending -> active|failed|reconciliation_required`; `active -> grace|cancelled`; `grace -> active|lapsed|cancelled`; `cancelled -> lapsed` at paid-term end | Settled one-payee payment activates; cancellation stops renewal immediately but preserves paid/grace access. Lapse never revokes permanent benefits. |
| Vault item | `blocked -> published`; `published -> withdrawn|superseded`; `withdrawn -> published` | Valid asset, artist authority, collaborator release and non-empty eligible tier set permit publication. Raised tiers affect future grants only; existing permanent grants remain. |
| Follow and alert | Follow `local -> durable|expired|withdrawn`; `durable -> withdrawn`; alert `queued -> sent|suppressed|cancelled` | Verified channel plus exact consent upgrades durable state; inactivity expires local state and unfollow suppresses re-import/cancels pending marketing alerts. Event dedupe prevents repeat alerts. |
| Fan show request | `active -> withdrawn`; `withdrawn -> active` only through a new request | B2 gate, coarse location and fan authority create a private non-binding signal. Withdrawal is version-checked and removes it from future aggregates without exposing identity. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; any consent synthesis, cross-artist identity merge or permanent-benefit revocation returns `409 DOMAIN_INVARIANT_VIOLATION`.

## Persistence, RLS and Workers

- Observation/resolution/quarantine, consent/preference ledger, import batches, stewardship, segment, campaign, listing/cart/order, membership/vault/tip, follow/alert, entitlement/library/import and demand rows pin actor/source/policy versions.
- RLS isolates every relationship/segment/campaign/order to artist entity and purpose, fan-private library/follow/demand to fan, and restricted PII (email/import row/token/exact location) from event payloads.
- Resolver, import, campaign, commerce, fulfillment, billing, vault, alert, library and demand workers are idempotent. Consent/contactability rechecks at effect time and gate revocation prevents queued effects.

## Failure, Deepening and Ambiguity Gate

Tests cover weak-key merge, dropped observation, artist consent bypass, token enumeration, import consent mutation/cross-artist match leak, sparse segment disclosure, duplicate send, unconsented fallback, cross-entity cart, hidden multipayee, entitlement lost on CDN failure, tier raise revocation, paid block bypass, monetary interest page, local-follow alerts, auto-follow import and public demand count. Seven passes converge; two implementers receive identical fanbase/direct-to-fan behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Fanbase and direct-to-fan contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/deep-dives/37-fanbase-direct-to-fan|Deep Dive 37 — Fanbase and direct-to-fan]]
- [[specs/be/01a-auth-account-linking|Authentication and account linking — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/27c-digital-entitlements-library-delivery|Digital entitlements, holder library and secure delivery — Backend Specification]]
- [[specs/be/35b-ticket-carts-orders-waitlists|Ticket carts, orders and returned-inventory waitlists — Backend Specification]]
- [[specs/be/36e-ticket-limits-transfer-exchange-consent|Ticket purchase limits, transfers, face-value exchange and consent — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/deep-dives/37-fanbase-direct-to-fan|Deep Dive 37 — Fanbase and direct-to-fan]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01a-auth-account-linking|Authentication, additive login methods and account merge — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/27c-digital-entitlements-library-delivery|Digital entitlements, holder library and secure delivery — Backend Specification]]
- [[specs/be/35b-ticket-carts-orders-waitlists|Ticket carts, orders and returned-inventory waitlists — Backend Specification]]
- [[specs/be/36e-ticket-limits-transfer-exchange-consent|Ticket purchase limits, transfers, face-value exchange and consent — Backend Specification]]
