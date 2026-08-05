# Shard 25 — Gear catalog, listings and market data

**Status:** Complete
**Surface:** Web/PWA, public catalog/listings and protected seller evidence
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 25 owns canonical gear models, catalog contribution/moderation, listing-to-model resolution, condition/originality disclosure, listing creation/lifecycle/inventory, seller storefront policy and confidence-gated market data. It consumes identity, theft and provenance from [[specs/ia/23-gear-provenance-registry|Shard 23]], operational custody from [[specs/ia/24-gear-holdings-operations|Shard 24]], and hands authoritative claims/orders to [[specs/ia/26-gear-commerce-fulfilment|Shard 26]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 29 |
| Child capabilities | 21 |
| Catalog | Models, category schemas, contributions, serial hypotheses, matching and compatibility warnings |
| Listing truth | Condition, flaws, originality, media and custody-boundary evidence |
| Supply | Listing lifecycle, unit/count inventory, bundles, B-stock and bounded bulk/channel operations |
| Market data | Settled comps, confidence, price ranges and opt-in repricing |
| Deferred enterprise | Authorized-dealer/MAP program and external channel adapters wait until consumer launch is ready |

### Catalog and Listing Decisions

| Area | Locked decision |
|---|---|
| Catalog bootstrap | Hybrid: licensed/manufacturer-authorized factual imports plus attributed community contribution. Competitor scraping is prohibited without explicit data rights. |
| Catalog gaps | Unmatched is a legal, publishable state. Matching is continuous, reversible and high-margin; description is never treated as authoritative identity. |
| Schema authority | One versioned per-category schema owns attributes, flaw checklists, component sets and flaw-to-grade projection. Catalog moderators hold category-scoped standing. |
| Serial decoding | Decode is a confidence-labelled hypothesis stored separately from user assertions and never blocks listing or registration. |
| Condition | Eight versioned grades are required with no default. Flaws cap grade; only functional failure sets `non_functioning`. |
| Originality | Component facts are separate from condition and derive a nominal aggregate; `unknown` is first-class and never penalized into a claim. |
| Contradictions | Platform-held records prefill but never auto-assert. Unresolved material conflicts render neutrally to buyers; only missing evidence for a declared material flaw blocks publish. |
| Evidence | Listing, purchase, dispatch and arrival facts append into a custody-boundary pack; media/evidence changes weight, not eligibility. |
| Listing history | Published listings never delete. Sold records and buyer-pinned versions are immutable; erasure de-identifies eligible seller data. |
| Inventory | Qty-one and counted stock are separate regimes. Claim arbitration is atomic; cart presence is not a claim. |
| Theft screening | A positive hit holds without accusation. Publish outage yields pending/no badge; checkout/transfer outage blocks per Shard 23. |
| Market data | Launch uses eligible WeJammin settled sales only. External data requires licensed provenance and compatibility review before admission. |
| Price output | Confidence gates output. Below threshold show examples or silence, never an ungated median/suggestion. |
| Dealer/MAP | No dealer persona, authorized-dealer program or MAP workflow at consumer launch. MAP is never platform-enforced. |

## Features

- **13.01 Canonical Gear Catalog** — [ideation source](../ideation/13-gear-marketplace/13.01-canonical-gear-catalog/13.01-canonical-gear-catalog-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.02 Condition, Originality & Disclosure** — [ideation source](../ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02-condition-originality-disclosure-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.03 Listings & Inventory** — [ideation source](../ideation/13-gear-marketplace/13.03-listings-inventory/13.03-listings-inventory-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.04 Price Discovery & Market Data** — [ideation source](../ideation/13-gear-marketplace/13.04-price-discovery-market-data/13.04-price-discovery-market-data-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.12 Gear Seller Storefront & Commerce Policies** — [ideation source](../ideation/13-gear-marketplace/13.12-gear-seller-storefront-policies.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.13 Authorized Dealer Program & MAP Pricing** — [ideation source](../ideation/13-gear-marketplace/13.13-authorized-dealer-map-pricing.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-25.01 — Search/browse catalog:** Given Public request with bounded filters, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Search/browse catalog, and (6) return Versioned models, aliases and active facets render; if the flow cannot complete, Search failure offers exact retry; no fabricated matches.
- **AC-25.02 — Create provisional model inline:** Given Seller has a real listing/record context, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create provisional model inline, and (6) return Provisional model publishes with assertion provenance; if the flow cannot complete, Duplicate candidate routes to reversible resolution; listing may remain unmatched.
- **AC-25.03 — Contribute catalog fact:** Given Authenticated contributor; category schema permits field, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contribute catalog fact, and (6) return Attributed assertion appends and may corroborate current value; if the flow cannot complete, Unsupported/safety claim remains unverified and cannot suppress warnings.
- **AC-25.04 — Moderate catalog change:** Given Category standing, no commercial conflict, blast-radius quorum met, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Moderate catalog change, and (6) return Versioned accept/reject/merge/split with reversible history; if the flow cannot complete, Recusal or quorum failure leaves contribution pending.
- **AC-25.05 — Match listing to model:** Given Draft/live listing and candidate graph exist, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Match listing to model, and (6) return Human-confirmed or high-confidence/high-margin reversible bind; if the flow cannot complete, Ambiguity/unavailability degrades to unmatched; publication continues.
- **AC-25.06 — Decode serial/date:** Given Supported versioned decoder available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Decode serial/date, and (6) return Hypotheses render with source, confidence and alternatives; if the flow cannot complete, Unsupported/ambiguous returns unknown; no identity mutation.
- **AC-25.07 — Evaluate fitment/voltage:** Given Model/unit/region facts available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate fitment/voltage, and (6) return Advisory warning cites facts and unknown coverage; if the flow cannot complete, Fitment no-result suppresses a warning; voltage no-result says it could not verify; neither blocks.
- **AC-25.08 — Grade and disclose flaws:** Given Seller controls unit/listing and schema version loads, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Grade and disclose flaws, and (6) return Required grade, structured flaws and evidence form consistent version; if the flow cannot complete, Contradiction blocks the edit; validator outage publishes flagged for async review.
- **AC-25.09 — Declare originality:** Given Category component schema loads, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Declare originality, and (6) return Original/replaced/unknown vector and deterministic nominal aggregate persist; if the flow cannot complete, Schema outage uses explicit partial/unknown fallback; no false original claim.
- **AC-25.10 — Create listing/media:** Given Seller facet activates; payout support checked at draft start, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create listing/media, and (6) return Idempotent draft stores versioned unit media, demo and seller assertions; if the flow cannot complete, Unsupported payout region blocks publish, not drafting/export.
- **AC-25.11 — Publish listing:** Given Payout ready; material flaws evidenced; policy snapshot valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish listing, and (6) return Listing activates, emits unit hint, starts matching/screening and public projection; if the flow cannot complete, Registry/matcher outage degrades; missing material evidence blocks and a confirmed theft hit holds.
- **AC-25.12 — Amend live listing:** Given Seller controls active listing; no incompatible claim state, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Amend live listing, and (6) return New version publishes; offer/claim consequences apply by field type; if the flow cannot complete, Price edit with live offer rejects; material post-claim change routes to order amendment.
- **AC-25.13 — End/pause/relist:** Given Seller controls listing and transition is valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) End/pause/relist, and (6) return Append-only lifecycle event; relist inherits unit history; if the flow cannot complete, Published listing never deletes; reserved listing exits only through order cancellation.
- **AC-25.14 — Claim inventory:** Given Buyer eligible; price/listing version current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Claim inventory, and (6) return One qty-one claimant wins or counted stock decrements atomically; if the flow cannot complete, Loser gets designed alternatives; stale price rejects, never silently reprices.
- **AC-25.15 — Create bundle/parts/B-stock:** Given Seller owns each constituent or counted line, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create bundle/parts/B-stock, and (6) return Atomic bundle references constituents; each used unit keeps its own grade; if the flow cannot complete, One unavailable constituent fails whole claim; no automatic split.
- **AC-25.16 — Bulk import/list:** Given Authorized organisation listing role, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Bulk import/list, and (6) return Reviewable partial-success batch preserves per-unit obligations; if the flow cannot complete, Invalid rows isolate; bulk defaults remain flagged and comp-weighted down.
- **AC-25.17 — Sync external availability:** Given Post-consumer adapter is admitted and connected, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Sync external availability, and (6) return Best-effort per-channel state with explicit freshness/error; if the flow cannot complete, Failures surface per channel/unit; policies and disclosures never sync implicitly.
- **AC-25.18 — Display provenance/theft status:** Given Current owner consents; source visibility/status permits, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Display provenance/theft status, and (6) return Verified session links and scoped screening facts render without hidden counts; if the flow cannot complete, Ownership transfer resets owner-end publication consent; absent history renders nothing.
- **AC-25.19 — View price guide/comps:** Given Public request resolves a model/condition/originality bucket, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View price guide/comps, and (6) return Distribution/sample/period or raw examples render according to confidence; if the flow cannot complete, Confidence failure returns no number; unpriceable unit declines with reason.
- **AC-25.20 — Request price suggestion/repricing:** Given Seller controls listing; guide confidence passes, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request price suggestion/repricing, and (6) return Evidence-backed range; optional bounded repricing policy may propose/act; if the flow cannot complete, No confidence means no suggestion; seller deviation carries no penalty.
- **AC-25.21 — Manage storefront policies:** Given Seller/principal has field authority, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Manage storefront policies, and (6) return Versioned structured defaults inherit to future listings; order pins claim-time terms; if the flow cannot complete, Statutory-invalid terms do not render/apply; existing obligations survive away mode.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 25.01 | Search/browse catalog | Public request with bounded filters | Versioned models, aliases and active facets render | Search failure offers exact retry; no fabricated matches |
| 25.02 | Create provisional model inline | Seller has a real listing/record context | Provisional model publishes with assertion provenance | Duplicate candidate routes to reversible resolution; listing may remain unmatched |
| 25.03 | Contribute catalog fact | Authenticated contributor; category schema permits field | Attributed assertion appends and may corroborate current value | Unsupported/safety claim remains unverified and cannot suppress warnings |
| 25.04 | Moderate catalog change | Category standing, no commercial conflict, blast-radius quorum met | Versioned accept/reject/merge/split with reversible history | Recusal or quorum failure leaves contribution pending |
| 25.05 | Match listing to model | Draft/live listing and candidate graph exist | Human-confirmed or high-confidence/high-margin reversible bind | Ambiguity/unavailability degrades to unmatched; publication continues |
| 25.06 | Decode serial/date | Supported versioned decoder available | Hypotheses render with source, confidence and alternatives | Unsupported/ambiguous returns unknown; no identity mutation |
| 25.07 | Evaluate fitment/voltage | Model/unit/region facts available | Advisory warning cites facts and unknown coverage | Fitment no-result suppresses a warning; voltage no-result says it could not verify; neither blocks |
| 25.08 | Grade and disclose flaws | Seller controls unit/listing and schema version loads | Required grade, structured flaws and evidence form consistent version | Contradiction blocks the edit; validator outage publishes flagged for async review |
| 25.09 | Declare originality | Category component schema loads | Original/replaced/unknown vector and deterministic nominal aggregate persist | Schema outage uses explicit partial/unknown fallback; no false original claim |
| 25.10 | Create listing/media | Seller facet activates; payout support checked at draft start | Idempotent draft stores versioned unit media, demo and seller assertions | Unsupported payout region blocks publish, not drafting/export |
| 25.11 | Publish listing | Payout ready; material flaws evidenced; policy snapshot valid | Listing activates, emits unit hint, starts matching/screening and public projection | Registry/matcher outage degrades; missing material evidence blocks and a confirmed theft hit holds |
| 25.12 | Amend live listing | Seller controls active listing; no incompatible claim state | New version publishes; offer/claim consequences apply by field type | Price edit with live offer rejects; material post-claim change routes to order amendment |
| 25.13 | End/pause/relist | Seller controls listing and transition is valid | Append-only lifecycle event; relist inherits unit history | Published listing never deletes; reserved listing exits only through order cancellation |
| 25.14 | Claim inventory | Buyer eligible; price/listing version current | One qty-one claimant wins or counted stock decrements atomically | Loser gets designed alternatives; stale price rejects, never silently reprices |
| 25.15 | Create bundle/parts/B-stock | Seller owns each constituent or counted line | Atomic bundle references constituents; each used unit keeps its own grade | One unavailable constituent fails whole claim; no automatic split |
| 25.16 | Bulk import/list | Authorized organisation listing role | Reviewable partial-success batch preserves per-unit obligations | Invalid rows isolate; bulk defaults remain flagged and comp-weighted down |
| 25.17 | Sync external availability | Post-consumer adapter is admitted and connected | Best-effort per-channel state with explicit freshness/error | Failures surface per channel/unit; policies and disclosures never sync implicitly |
| 25.18 | Display provenance/theft status | Current owner consents; source visibility/status permits | Verified session links and scoped screening facts render without hidden counts | Ownership transfer resets owner-end publication consent; absent history renders nothing |
| 25.19 | View price guide/comps | Public request resolves a model/condition/originality bucket | Distribution/sample/period or raw examples render according to confidence | Confidence failure returns no number; unpriceable unit declines with reason |
| 25.20 | Request price suggestion/repricing | Seller controls listing; guide confidence passes | Evidence-backed range; optional bounded repricing policy may propose/act | No confidence means no suggestion; seller deviation carries no penalty |
| 25.21 | Manage storefront policies | Seller/principal has field authority | Versioned structured defaults inherit to future listings; order pins claim-time terms | Statutory-invalid terms do not render/apply; existing obligations survive away mode |

## Contracts

### Command Contracts

| Command | Required input | Invariants |
|---|---|---|
| `SubmitCatalogAssertion` | model/category context, field/value, source/evidence, idempotency key | Assertion append-only; safety/compliance cannot become trusted by unmoderated overwrite |
| `ResolveCatalogContribution` | contribution, action, reason, expected versions, moderator context | Commercial recusal; high-blast merge requires two eligible moderators; reversible |
| `BindListingModel` | listing, candidate model, actor/matcher, confidence/margin, expected version | Bind attributed and reversible; order snapshots bind at claim time |
| `SaveDisclosureVersion` | listing/unit, grade, definition version, flaw vector, originality vector, media refs | Grade/flaws consistent; material flaws have unit-specific evidence |
| `PublishListing` | draft/version, seller/storefront/policy versions, payout state, idempotency key | No published deletion; stock imagery labelled; privacy metadata stripped |
| `TransitionListing` | listing, from/to, reason, expected version | State machine enforced; sold seller-content immutable; terminal URL remains resolvable |
| `ClaimInventory` | listing/price/unit or stock version, claim type, buyer, idempotency key | Exactly one unit winner or bounded count decrement; self-dealing blocked |
| `CreateBundle` | constituent unit/stock refs and quantities, terms, expected versions | Atomic claim; no constituent double-allocation; bundle has no synthetic condition grade |
| `ComputeMarketGuide` | normalized bucket, as-of, confidence-policy version | Only eligible settled comps; output class gates median/suggestion |
| `SaveStorefrontPolicy` | seller, policy fields, authority class, effective version | Rights terms principal-only; statutory policy overrides seller preference |

### Cross-Domain Contracts

- Shard 23 owns canonical unit identity, theft records, service/modification evidence and producer-attested provenance.
- Shard 24 supplies confirmed custody and selling/disclosure grants; possession alone never authorizes listing.
- Shard 26 owns offer/bid legal posture, checkout, payment, order amendments, delivery, returns and settlement.
- Catalog, grade, originality, disclosure, policy and price versions are pinned onto the claim/order boundary.
- Every externally visible change writes audit and transactional outbox state with acting-party attribution.

## Data Models

| Model | Required fields | Rules |
|---|---|---|
| `GearMake` / `GearModel` / `ModelPeriod` | stable ID, names/aliases, category, maker-at-manufacture, periods, lifecycle/version | Model is unit sold new; seller-assembled sets are bundles; market-price separability governs model split |
| `CategorySchemaVersion` | category, attributes, flaw items/options, component set, consequence classes, status/version | Exactly one schema-bearing category; browse aliases carry no schema authority |
| `CatalogAssertion` | subject/field/value, source, contributor, confidence/status, supersession | Historical assertion chain retained; automation proposes only |
| `CatalogResolution` | merge/split/alias graph, effective time, reason, moderator quorum | Orders/registry snapshot old resolution; display may follow current graph |
| `SerialDecodeHypothesis` | decoder/version, input digest, candidates, confidence, evidence | Separate from user assertion and canonical identity |
| `ListingModelBind` | listing, model, source, confidence/margin, state, version | States `unmatched`, `suggested`, `confirmed`, `auto_bound`, `disputed`, `unbound` |
| `DisclosureVersion` | grade/version, flaw selections/evidence, originality vector/aggregate, seller attestation | Immutable once pinned by claim; corrections create new version |
| `EvidenceFrame` / `EvidencePack` | unit/custody boundary, media, capturer/role, capture/receipt times, interest flag, phase | Append-only; dispatch seal freezes prior half; late/arrival evidence appends |
| `Listing` / `ListingVersion` | seller/storefront, type, unit/stock/bundle, model bind, disclosure/media/policy/price versions, state | Published seller content retained; system bind may resolve later |
| `MarketplaceUnit` | seller-scoped unit ID, optional gear record, custody grant, active listing refs | Required for qty-one listing; cross-seller/title facts still require Shard 23 |
| `StockLine` | SKU, quantity available/reserved, version | Fungible count regime; never mixed with qty-one identity semantics |
| `InventoryClaim` | subject, type, buyer, pinned price/listing version, hold/expiry/state | Cart excluded; provider outage may pause clock |
| `CompObservation` | settled order/unit, normalized bucket, net item price, currency/region/date, eligibility flags | De-identified evidence; self-dealing/wash-risk and unmatched baseline excluded |
| `GuideResult` | bucket, policy version, sample/period/dispersion/integrity, output class, distribution/range | Output classes `full`, `examples_only`, `declined`; no bare number |
| `StorefrontPolicyVersion` | seller/domain, structured fields, authority class, effective window | Defaults forward only; claim pins version; statutory rules take precedence |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`GearMake`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: stable ID, names/aliases, category, maker-at-manufacture, periods, lifecycle/version | Model is unit sold new; seller-assembled sets are bundles; market-price separability governs model split.
- **`GearModel`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: stable ID, names/aliases, category, maker-at-manufacture, periods, lifecycle/version | Model is unit sold new; seller-assembled sets are bundles; market-price separability governs model split.
- **`ModelPeriod`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: stable ID, names/aliases, category, maker-at-manufacture, periods, lifecycle/version | Model is unit sold new; seller-assembled sets are bundles; market-price separability governs model split.
- **`CategorySchemaVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: category, attributes, flaw items/options, component set, consequence classes, status/version | Exactly one schema-bearing category; browse aliases carry no schema authority.
- **`CatalogAssertion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: subject/field/value, source, contributor, confidence/status, supersession | Historical assertion chain retained; automation proposes only.
- **`CatalogResolution`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: merge/split/alias graph, effective time, reason, moderator quorum | Orders/registry snapshot old resolution; display may follow current graph.
- **`SerialDecodeHypothesis`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: decoder/version, input digest, candidates, confidence, evidence | Separate from user assertion and canonical identity.
- **`ListingModelBind`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: listing, model, source, confidence/margin, state, version | States `unmatched`, `suggested`, `confirmed`, `auto_bound`, `disputed`, `unbound`.
- **`DisclosureVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: grade/version, flaw selections/evidence, originality vector/aggregate, seller attestation | Immutable once pinned by claim; corrections create new version.
- **`EvidenceFrame`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: unit/custody boundary, media, capturer/role, capture/receipt times, interest flag, phase | Append-only; dispatch seal freezes prior half; late/arrival evidence appends.
- **`EvidencePack`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: unit/custody boundary, media, capturer/role, capture/receipt times, interest flag, phase | Append-only; dispatch seal freezes prior half; late/arrival evidence appends.
- **`Listing`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: seller/storefront, type, unit/stock/bundle, model bind, disclosure/media/policy/price versions, state | Published seller content retained; system bind may resolve later.
- **`ListingVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: seller/storefront, type, unit/stock/bundle, model bind, disclosure/media/policy/price versions, state | Published seller content retained; system bind may resolve later.
- **`MarketplaceUnit`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: seller-scoped unit ID, optional gear record, custody grant, active listing refs | Required for qty-one listing; cross-seller/title facts still require Shard 23.
- **`StockLine`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: SKU, quantity available/reserved, version | Fungible count regime; never mixed with qty-one identity semantics.
- **`InventoryClaim`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: subject, type, buyer, pinned price/listing version, hold/expiry/state | Cart excluded; provider outage may pause clock.
- **`CompObservation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: settled order/unit, normalized bucket, net item price, currency/region/date, eligibility flags | De-identified evidence; self-dealing/wash-risk and unmatched baseline excluded.
- **`GuideResult`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: bucket, policy version, sample/period/dispersion/integrity, output class, distribution/range | Output classes `full`, `examples_only`, `declined`; no bare number.
- **`StorefrontPolicyVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: seller/domain, structured fields, authority class, effective window | Defaults forward only; claim pins version; statutory rules take precedence.

## Access Control

| Capability | Public/Fan | Seller | Org listing staff | Catalog moderator | Platform risk |
|---|---:|---:|---:|---:|---:|
| Read catalog/listing/eligible guide | yes | yes | yes | yes | yes |
| Create personal listing | activation at act | yes | delegated | no | no |
| Bulk import/channel operations | no | no | role-gated | no | support read |
| Author seller disclosure | no | yes | delegated for inventory; attestation policy applies | no | no |
| Contribute catalog facts | report only when unauthenticated | yes | yes | yes | no |
| Moderate category schema/assertions | no | no when commercially interested | no when interested | category standing + recusal | emergency freeze only |
| View protected evidence pack | no | relevant side | relevant order role | no | purpose-bound case access |
| Manage rights-affecting policy | no | owning principal | no | no | statutory override, audited |

- Public listing projections omit private serial/location, evidence originals, payout state and internal risk signals.
- Moderation standing is category-scoped, survival-weighted, revocable and separated from seller reputation.
- Public price evidence is k-anonymized/bucketed where transaction detail could identify a party; raw order access remains authorized only.
- Media ingest strips EXIF GPS/camera serial and preserves unenhanced evidence originals.

### Access Escalation

- **Read catalog/listing/eligible guide:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Create personal listing:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Bulk import/channel operations:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Author seller disclosure:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Contribute catalog facts:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderate category schema/assertions:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **View protected evidence pack:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Manage rights-affecting policy:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Catalog facets expose labels, counts, active filters and inclusive-grade semantics to assistive technology.
- Grade definitions, ceilings and contradiction messages appear inline at the decision point and never rely on color.
- Structured flaw/originality controls use grouped fieldsets, explicit `unknown`, error summaries and preserved progress.
- Media requires meaningful alt text or an explicit decorative/evidence-only classification; audio/video demos include text description and accessible controls.
- Listing state, hold countdown and price freshness are announced without continuous noisy updates; expiry remains visible in text.
- Comparison/guide charts provide equivalent tables, sample size, date range and confidence outcome.
- Bulk row errors are navigable by keyboard and exportable in an accessible correction file.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `gear_catalog.assertion_submitted.v1` | assertion/model/field/source/status, actor, version | moderation, assertion graph |
| `gear_catalog.resolution_changed.v1` | affected IDs, action, prior/new graph versions, quorum | matching, seller notifications, guide rebuild |
| `gear_listing.model_bind_changed.v1` | listing, prior/new model/state, source, version | search, disclosure baseline, comps |
| `gear_listing.disclosure_changed.v1` | listing/unit, prior/new version, materiality, actor | offers/orders, search, evidence pack |
| `gear_listing.published.v1` | listing/unit/stock, pinned versions, seller, occurredAt | search, Shard 23 hint, screening |
| `gear_listing.state_changed.v1` | listing, prior/new state, reason, version | search, watchers, reputation |
| `gear_inventory.claim_resolved.v1` | claim, subject, outcome, pinned price/listing, expiry | checkout, loss surface, all linked listings |
| `gear_inventory.stock_changed.v1` | stock line, delta/reason, version | listing availability, channel adapters |
| `gear_listing.screening_changed.v1` | listing/unit, screening state, registry version/time | checkout gate, badge projection |
| `gear_market.comp_admitted.v1` | comp, bucket/version, eligibility basis | guide projection, confidence recompute |
| `gear_market.guide_recomputed.v1` | bucket, policy, output class, sample/period | public guide, seller suggestion |
| `gear_storefront.policy_changed.v1` | storefront, prior/new policy version, actor | future listing defaults, checkout policy projection |

Events use the platform envelope, contain no evidence bytes or private serials, and require idempotent canonical refetch.

## Edge Cases

| Case | Required outcome |
|---|---|
| Catalog model absent at listing | Publish unmatched; create provisional model inline if seller chooses |
| Two plausible sibling models | No auto-bind; show discriminating fields and preserve unmatched |
| Model merge after sale | Display may resolve to current model; order and historical comp retain bind-time identity/version |
| Safety assertion is unverified | May add/promote warning, never remove or weaken one |
| Grade validator unavailable | Publish with async review marker; known grade/flaw contradiction still cannot commit |
| Platform history contradicts seller | Prefill and show neutral conflict to seller/buyer if unresolved; seller remains author |
| Used listing has only stock photos | Label stock imagery, exclude evidence/trust benefits and flaw-free facets |
| Demo contains commercial recording | Reject clip after fingerprint match; listing continues |
| Demo performance uses composition | Attributed seller affirmation and notice/takedown; no blanket licence assumed |
| Registry screening unavailable | Publish may remain pending without checked badge; checkout/transfer blocks until a full-composite-key check succeeds |
| Ownership transfer occurs | Current-owner provenance publication consent resets; underlying verified link remains protected |
| Bundle has mixed conditions | Each used unit keeps its own grade/disclosure; bundle receives no synthetic grade |
| Qty-one unit appears in multiple listings | One claim atomically reserves all references; losing bundle/listing becomes unavailable |
| Seller asks outside confidence range | Permit without friction; suggestions are evidence, not market control |
| Thin/provenanced/one-off market | Show examples or decline; never force widened comps into a median |
| Seller changes rights term after claim | Existing order keeps pinned policy; future claims use new valid version |

## Dependency References

- Consumes identity/theft/service/provenance evidence from Shard 23 and custody/grants from Shard 24.
- Supplies pinned catalog, listing, disclosure, evidence, inventory and policy versions to Shard 26.
- Uses platform taxonomy/versioning, media governance, moderation, search, notifications, audit/outbox and configurable policy values.
- Authorized-dealer, MAP and external channel integrations remain deferred behind consumer-launch and provider/legal admission gates.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 25.01 Search/browse catalog | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.02 Create provisional model inline | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.03 Contribute catalog fact | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.04 Moderate catalog change | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.05 Match listing to model | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.06 Decode serial/date | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.07 Evaluate fitment/voltage | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.08 Grade and disclose flaws | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.09 Declare originality | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.10 Create listing/media | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.11 Publish listing | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.12 Amend live listing | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.13 End/pause/relist | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.14 Claim inventory | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.15 Create bundle/parts/B-stock | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.16 Bulk import/list | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.17 Sync external availability | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.18 Display provenance/theft status | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.19 View price guide/comps | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.20 Request price suggestion/repricing | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 25.21 Manage storefront policies | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 23:** consume [Shard 23 Contracts](23-gear-provenance-registry.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 23 Event Schemas](23-gear-provenance-registry.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 24:** consume [Shard 24 Contracts](24-gear-holdings-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 24 Event Schemas](24-gear-holdings-operations.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 26:** consume [Shard 26 Contracts](26-gear-commerce-fulfilment.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 26 Event Schemas](26-gear-commerce-fulfilment.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

- 2026-08-02: Initial complete interaction architecture authored from 29 source documents and 21 child capabilities.
- 2026-08-02: Locked legal hybrid catalog seeding, unmatched publication, versioned disclosure, atomic inventory, screening outage behavior and confidence-gated market data.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
