# Deep Dive 25 — Gear catalog, listings and market data

**Status:** Complete
**Parent:** [[specs/ia/25-gear-market-catalog|Shard 25]]

## Overview

This deep dive closes catalog authority, model matching, disclosure derivation, listing immutability, inventory races, screening outages and thin-market outputs.

## Interactions

### Catalog Assertion and Resolution

1. A real listing/record context searches current model graph; standalone catalog growth is not a consumer destination.
2. No match may create provisional model/assertions with source and contributor identity; listing may instead remain unmatched.
3. Matching continuously ranks title, structured attributes, seller-SKU memory and sibling ambiguity. Description is tie-break only.
4. Auto-bind requires versioned high confidence and high margin and is disabled across known ambiguity siblings.
5. Moderator action checks category standing, commercial recusal and blast-radius quorum.
6. Merge/split/rename updates current resolution graph, never bind-time snapshots; unmerge remains possible without expiry.
7. Sellers receive deduplicated notification only when a catalog action changes something actionable.

### Listing Truth Assembly

1. Resolve model/category schema or explicit unmatched baseline.
2. Seller selects one of eight versioned grades with no default.
3. Flaw selections emit authored axis/severity tokens; lowest ceiling wins and functional failure forces `non_functioning`.
4. Seller declares each category component original/replaced/unknown; replacement detail is required where known.
5. Derive originality aggregate: `all_declared_original`, `original_parts_included`, `modified`, `unknown_present`, or `not_applicable`. It is nominal, never ranked.
6. Platform records prefill and highlight contradictions but do not sign for the seller. Unresolved material contradiction renders a neutral conflict marker.
7. Used listing requires unit-specific media; material flaw requires direct evidence. Originals remain unenhanced and privacy metadata is stripped.
8. Publish pins schema, grade, disclosure, media, policy and price versions and starts matching/screening asynchronously.

### Lifecycle and Inventory Arbitration

1. Draft may delete; published states transition `active|paused|reserved|ended|sold` under version precondition.
2. A buyer claim carries current listing, price and subject versions. Cart state carries no inventory authority.
3. Qty-one claim atomically reserves the marketplace unit and every listing/bundle reference; counted claim decrements available stock.
4. Exactly one claim wins. The loser gets elapsed-time truth, similar units, relist alert and wanted-list route.
5. Holds use configurable claim-type policies initialized from 15m Buy Now, 24h accepted offer, 48h auction, 72h freight and schedule-bound layaway.
6. Stolen hold outranks reservation. Declared payment outage pauses eligible clocks; expiry never clears a theft hold.
7. Settled sale alone becomes a comp. Reserved/abandoned/self-dealing outcomes never do.
8. Sold seller-authored version remains immutable and publicly resolvable; erasure de-identifies eligible actor data.

### Confidence-Gated Market Data

1. Normalize eligible settled observation to model × grade-definition/condition × originality aggregate, currency, region and date.
2. Exclude unmatched baseline, self-dealing, unresolved wash-risk, returns/voids and prices contaminated by bundled non-item value.
3. Compute sample count, recency, dispersion and bucket integrity under a versioned category policy.
4. `full` renders distribution/range/sample/period; `examples_only` renders raw comparable examples without median; `declined` renders reason only.
5. Widening is explicit and always lowers integrity/confidence.
6. Suggestions exist only for `full`; deviation is frictionless. Automated repricing is optional, floor-bounded, rate-limited and disabled at consumer launch by default.

## Contracts

### Grade Ceiling Function

- Each flaw option owns moderator-authored `(axis, severityToken, materiality, evidenceRequirement)`.
- Lowest ceiling across selections bounds seller grade; `functional:fails` sets non-functioning.
- Grade definitions are immutable/versioned; copy changes create a new definition version.
- A known contradiction rejects only the attempted disclosure edit, not the entire listing history.

### Originality Projection

| Inputs | Aggregate |
|---|---|
| all applicable components declared original | `all_declared_original` |
| replacement exists and original component accompanies unit | `original_parts_included` |
| any replacement/refinish without complete original set | `modified` |
| any applicable component unknown | `unknown_present` |
| category has no originality schema | `not_applicable` |

`unknown_present` takes precedence over other comp-bucketing aggregates because unknown history cannot be priced as known; full component facts still render.

### External Data Admission

- Source contract must grant storage, normalization, derived statistics, audit and deletion/correction rights.
- Provenance, collection time, coverage, field mapping and confidence are retained per import batch.
- External observations never silently mix with first-party settled sales; guide output discloses source classes.
- No competitor scraping, browser automation or terms circumvention is admitted.

## Data Models

### Listing State Machine

`draft → active|ended`

`active ↔ paused`, `active → reserved|ended`, `reserved → active|sold|paused`, and `ended → active` through a new relist version are valid. `sold` is terminal. Published versions are never deleted.

### Evidence Boundary

- Pack starts with listing disclosure/media, snapshots again at claim and seals seller-side evidence at dispatch.
- Arrival capture prompt precedes buyer access to dispatch evidence to reduce anchoring.
- Photos, video, audio, packed-state frames and carrier scans append with capturer role, interested-party flag, capture time and receipt time.
- Evidence survives listing removal and required claim windows in de-identified form; it attaches to unit/order/custody boundary, not mutable listing.

### Market Policy

Confidence thresholds, recency curves, widening penalties, minimum anonymity and repricing limits are versioned settings per category family. Product code contains safe absolute bounds, not market-tuning constants.

## Access Control

### Catalog Standing

- Contribution access does not imply moderation.
- Standing is earned by surviving contributions, scoped to categories, revocable and never based on raw count alone.
- Manufacturer assertions are weighted sources, not overrides.
- Commercially interested moderators recuse; high-blast model merges require two independent moderators.
- Automation can suggest candidates, duplicates and anomalies but cannot accept, merge, split or suppress.

### Listing Authority

- Seller must control the acting person/org and hold ownership or confirmed custody plus `sell` grant.
- Org listing staff may operate inventory and disclosure within delegated scope; rights-affecting storefront policy remains principal-only.
- Risk/support evidence access is case-bound, time-limited, logged and does not grant catalog moderation.
- Public users never receive private serial, payout, internal confidence/risk or unredacted evidence fields.

## Accessibility

- Model-match choices state discriminating attributes and confidence in text, with an explicit unmatched choice.
- Grade ceiling errors link directly to the conflicting flaw and preserve every other answer.
- Originality uses component fieldsets and always exposes `unknown`; aggregate labels never replace detailed facts.
- Inventory loss and hold expiry are announced once with a stable next action, not through flashing countdowns.
- Guide output remains understandable without charts and states why a number was withheld.

## Event Schemas

### Race and Version Resolution

| Race | Resolution |
|---|---|
| Catalog merge while buyer claims | Order pins pre-merge bind; display may later resolve through graph |
| Disclosure edit while offer exists | Price edit rejects; grade downgrade or any originality change releases offer and notifies |
| Material change after claim | Listing stays historical; Shard 26 order amendment pauses dispatch and requires buyer decision |
| Buy Now and offer acceptance | First atomic unit claim wins; loser receives designed loss outcome |
| Bundle and constituent claim | Bundle reserves all or none; constituent winner invalidates bundle availability |
| Screening outage and checkout | Checkout remains pending/blocked until current screen; reservation clock follows declared hold policy |
| Guide recompute during page load | Response pins guide version/as-of; realtime hint requests canonical refetch |

All outcomes append authoritative aggregate versions before outbox publication.

## Edge Cases

| Ambiguity | Locked resolution |
|---|---|
| Seeded or community catalog? | Licensed/manufacturer factual seed plus attributed contributions; no unauthorized scraping |
| Separate entity-resolution store? | Domain-owned catalog with shared platform assertion/resolution patterns and IDs |
| Which grade labels? | The eight source labels with WeJammin-owned immutable definitions; semantic/version portability matters more than copying a competitor |
| Public seller grade distribution? | Deferred; use private risk/quality signals until a consumer value and appeal model is proven |
| Unmatched listing in comps? | Excluded from computed guide/suggestion because grade lacks a confirmed as-shipped baseline |
| Buyer sees registry contradiction? | Yes, as neutral unresolved record conflict; no accusation and no auto-assertion |
| Is registration required to list? | No. Every qty-one listing gets a marketplace unit; Shard 23 registration enables cross-listing/title/theft benefits |
| Reaction-time allocation? | First valid atomic claim with bot/rate controls; no randomized consumer claim window at launch |
| Provenance after ownership transfer? | Verified link persists privately; current owner must re-consent to listing display |
| Bundle grade? | None; each used constituent carries its own grade and disclosure |
| Public price guide? | Public when privacy/confidence gates pass; acquisition value does not justify weak numbers |
| External comp data? | Deferred until licensed source and mapping/provenance contract passes |
| Auto-repricing paid/dealer feature? | Not at consumer launch; capability remains opt-in and policy-gated for later |
| MAP/dealer program? | Deferred with enterprise features; platform never enforces MAP |

## Dependency References

- [[specs/ia/23-gear-provenance-registry|Shard 23]] supplies canonical gear identity, screening and provenance evidence.
- [[specs/ia/24-gear-holdings-operations|Shard 24]] supplies custody and scoped sale/disclosure authority.
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26]] consumes claims/snapshots and owns transactional commerce outcomes.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [25-gear-market-catalog § Contracts](../25-gear-market-catalog.md#contracts) defines commands/queries and [25-gear-market-catalog § Event Schemas](../25-gear-market-catalog.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

- 2026-08-02: Deepened catalog authority, disclosure derivation, immutable listing versions, inventory races and evidence-gated market outputs.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
