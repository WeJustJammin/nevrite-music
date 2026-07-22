# Fanbase & Direct-to-Fan — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Fanbase & Direct-to-Fan](./fanbase-direct-to-fan-index.md)
> **Status**: [DEEP] — 7 children; 14 intra-domain pairs confirmed (13 High, 1 Medium), 5 rejected. All High pairs carry full 5-question synthesis.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [20.01 Fan Graph](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) | [20.02 Segmentation](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | The fan record is the **substrate** segmentation queries. Resolution quality caps segmentation quality: fragmented/aliased records under-score the best fans, and a score is only as good as the identity it is computed over. | Musician, Operator | High | [20.02.01](./20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md) reads observed facts; [20.02.02](./20.02-segmentation-superfan-intelligence/20.02.02-superfan-score.md) — identity-resolution quality caps score quality. |
| CX-02 | [20.01 Fan Graph](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) | [20.03 Broadcast](./20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md) | **Consent is a hard gate on every send**, resolved per fan, per channel, per purpose, **re-checked at dispatch not cached at compose** — and it fails closed. Broadcast never reads a list; it resolves contactability. Provenance strength + consent staleness drive send throttling. | Musician, Operator, Fan | High | [20.01.02](./20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md) is the only artist-side authority; hard gate on all sends, re-checked per recipient at dispatch, closing the compose-to-dispatch revoke window. |
| CX-03 | [20.02 Segmentation](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | [20.03 Broadcast](./20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md) | Every campaign targets a **live** segment. The segment answers "who"; broadcast resolves "who of those may be contacted, on what". Two different numbers, both shown. Revoked-consent fans leave saved audiences instantly. | Musician, Operator | High | [20.02.01](./20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md) — saved segments are the targeting input for every broadcast; segments stay live. Counting is not marketing. |
| CX-04 | [20.04 Storefront](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md) | [20.01 Fan Graph](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) | **A buyer is a fan record, not an order.** The store is simultaneously the domain's revenue engine and its highest-quality fan-acquisition surface. Guest checkout is a data-quality decision, not merely conversion. | Musician, Operator, Fan | High | [20.04.01](./20.04-direct-to-fan-storefront/20.04.01-storefront-product-catalog.md) — a buyer is a fan record; purchase writes a fan observation; guest-checkout (Q-02) affects observation quality. |
| CX-05 | [20.04 Storefront](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md) | [20.02 Segmentation](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | Purchases are the score's **money** signal — and, per D-08, deliberately **subordinate to attendance**. Spend-dominant scoring is a retail import that is wrong for music and structurally scalper-friendly. | Musician | High | [20.02.02](./20.02-segmentation-superfan-intelligence/20.02.02-superfan-score.md) D-01 — attendance outweighs spend; the score reads purchase observations but never lets them dominate. |
| CX-06 | [20.02 Segmentation](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | [20.04 Storefront](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md) | **Entitlements gate products**: members-only items, presale-gated drops, superfan discounts. Segmentation decides who may buy what; the catalogue only flags gating and resolves the entitlement against a segment. | Musician, Fan | High | [20.02.03](./20.02-segmentation-superfan-intelligence/20.02.03-perk-entitlements-presale-eligibility.md) + [20.04.01](./20.04-direct-to-fan-storefront/20.04.01-storefront-product-catalog.md) — members-item gate and presale price rule resolve entitlement in 20.02.03; catalogue flags only. |
| CX-07 | [20.05 Memberships](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) | [20.02 Segmentation](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | Membership tenure and active tier are strong score signals — and members are the most obvious presale segment there is. Perk redemption feeds back into the score (the ratchet). | Musician | High | [20.05.01](./20.05-memberships-patronage-campaigns/20.05.01-membership-tiers-benefits.md); [20.02.02](./20.02-segmentation-superfan-intelligence/20.02.02-superfan-score.md) CX-03 — perk redemption is itself a fan signal that feeds the score. |
| CX-08 | [20.06 Fan Experience](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) | [20.01 Fan Graph](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) | **A follow creates a fan record but NOT marketing consent** (D-07). The single most important boundary in the domain: the artist-side and fan-side halves meet here, and merging them destroys the fan-side product. | Musician, Fan, Operator | High | [20.06.01](./20.06-fan-experience-discovery/20.06.01-artist-tracking-follow.md) DT-02; a purchase auto-creates a follow but never auto-consents ([20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md)). |
| CX-09 | [20.06 Fan Experience](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) | [20.04 Storefront](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md) | The **library is the fan's half** of every store transaction; the store fills it. A purchase auto-follows (the fan acted) — never auto-consents (the fan did not). The library resolves the guest-checkout-with-no-account problem. | Fan, Musician | High | [20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md) — resolves guest checkout via claimable entitlements + signed email link; purchase bootstraps the library. |
| CX-10 | [20.07 Fan Demand](./20.07-fan-demand-show-requests.md) | [20.02 Segmentation](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | The demand map **is** a geo segment weighted by fan quality. Without the score it cannot distinguish 400 quiet ticket-buyers in Leeds from 40 loud requests in Bristol — the distinction that decides whether a tour loses money. | Musician, Operator | High | [20.07](./20.07-fan-demand-show-requests.md) DT-02; [20.02.01](./20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md) distance-from-venue conditions consume geo. |
| CX-11 | [20.07 Fan Demand](./20.07-fan-demand-show-requests.md) | [20.06 Fan Experience](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) | **The loop that closes the domain.** Demand informs the booking; the booking fires the alert; the alert produces attendance; attendance sharpens the next demand map. Inverse views of one graph. | Musician, Fan | High | [20.07](./20.07-fan-demand-show-requests.md) happy path steps 4–6. |
| CX-12 | [20.03 Broadcast](./20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md) | [20.05 Memberships](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) | Campaigns are how a crowdfunding drive reaches backers and how vault drops reach members — but the **artist-side health nudge** ("your members haven't had anything in 6 weeks") is the platform speaking to the artist (CX-M07), not broadcast. | Musician | Medium | [20.05.01](./20.05-memberships-patronage-campaigns/20.05.01-membership-tiers-benefits.md) DT-02; the direction of the message decides the owner. |
| CX-13 | [20.05 Memberships](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) | [20.04 Storefront](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md) | **Pre-order bundles are crowdfunding campaigns wearing a Buy button** — same money-now-object-later hazard, therefore the same fund-segregation policy. A boundary the sweep did not see. | Musician, Fan | High | [20.04.03](./20.04-direct-to-fan-storefront/20.04.03-digital-sales-name-your-price-bundles.md) DT-02; [20.05](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) D-03. |
| CX-14 | [20.05 Memberships](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) | [20.06 Fan Experience](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) | **The vault-lapse race.** Membership-gated vault items ([20.05.02](./20.05-memberships-patronage-campaigns/20.05.02-exclusive-content-vault.md)) lock the instant a membership lapses, and that transition is **felt in the fan's library** ([20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md)). The keep-vs-lose policy is owned by 20.05 but its lifecycle event must reach the library atomically. | Fan, Musician | Medium | [20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md) — membership-gated items lock on lapse; keep-vs-lose call shared with [20.05.02](./20.05-memberships-patronage-campaigns/20.05.02-exclusive-content-vault.md) Q-01. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Scope note**: this file connects children of domain 20 only. Cross-**domain** interactions (20↔19 scans,
> 20↔09 splits, 20↔14 delivery layer, 20↔17/18 routing, 20↔24 abuse) are reported to the orchestrator for
> `ideation-cx.md`; the detail of how they interact lives in each feature file's Cross-Cut Notes.

---

## Cross-Cut Details

### CX-01: Fan Graph ↔ Segmentation — resolution quality caps everything

**Relationship**: Segmentation ([20.02](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md))
reads the observed fan facts the Fan Graph holds — purchases, ticket scans, membership tenure, location,
consent flags — and filters/scores over them. It writes nothing back to identity. The dependency is
asymmetric and structural: a segment or a superfan score is only as trustworthy as the identity it is
computed over. A fan whose records are fragmented across three aliases under-scores and is invisible to the
segment that should include them — the domain's competitive claim (sharper segmentation than any standalone
email tool) fails silently at exactly the fans it most wants to find.

**Role scoping**:
- **Musician / Operator**: build audiences and read scores; never see the resolution machinery, only its quality.
- **Fan**: their consent flags compute the contactable subset; they never see the score at all (Role Matrix: 20.02 Fan = None).
- **Producer**: not affected — no fan list.

**Synthesis questions answered**:
1. **Shared state conflict**: [20.01.01](./20.01-fan-graph-owned-audience/20.01.01-unified-fan-record.md) owns the fan record; segmentation is a pure reader. No merge conflict — the write direction is one-way.
2. **Trigger chain**: A new observation (purchase, scan) → fan record update → segments re-resolve on next read (segments are live, not materialised). No rollback surface — reads are idempotent. When the score recompute fails, segments **resolve on last-good score, never null**, or a saved audience silently empties.
3. **Permission intersection**: A segment's *contactable* count is the intersection of its members with consent state (CX-02/CX-03); *counting/record-view* is unfloored, but individually-targeted send/export is floored by the k-anonymity rule escalated to domain 24.
4. **Notification fan-out**: None on this edge — segmentation is read-only over the graph.
5. **State transition conflict**: Identity resolution is write-then-resolve (D-05); a segment read during a pending merge sees the pre-merge fragments. Acceptable — segments are advisory snapshots, not transactional gates.

---

### CX-02: Fan Graph ↔ Broadcast — the consent gate

**Relationship**: No send resolves without the consent ledger. Broadcast does not receive a list; it receives
a **segment** and resolves contactability per (fan, entity, channel, purpose) **at dispatch, re-checked per
recipient — never cached at compose**. This is why an artist's segment count and their send count are always
different numbers, and why both are always shown. Provenance strength and consent staleness (≥24 months)
additionally drive send throttling and tiering in [20.03.04](./20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md).

**Role scoping**:
- **Musician / Operator**: see the gap between "1,847 fans in Manchester" and "1,203 contactable". The gap is consent and it is never hidden.
- **Fan**: their revocation takes effect mid-send, not next campaign — the fan write wins the dispatch race.
- **Producer**: not affected — no fan list.

**Synthesis questions answered**:
1. **Shared state conflict**: [20.01.02](./20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md) is authoritative. Broadcast holds no copy of consent state, ever. A cached consent is an unlawful send waiting for a race.
2. **Trigger chain**: Campaign → segment resolve → per-recipient consent + provenance + staleness resolve at dispatch → throttle tier → send. **Fails closed**: ledger unavailable ⇒ no send. Blocking a campaign for ten minutes is recoverable; a regulatory complaint is not. Synchronous per-recipient gate; the warm-up throttle is the async pacing layer on top.
3. **Permission intersection**: Marketing revocation must not suppress transactional messages. Each campaign carries a purpose-type (transactional / general / release / live-event-geo, defaulting to *general* when untagged); the gate resolves against the tier for that purpose. A fan who unsubscribes from a newsletter and stops receiving their ticket QR is a support catastrophe wearing a compliance costume.
4. **Notification fan-out**: Bulk fan-out is the entire point; the fan-side consequence (one message per fan per campaign, never three) is [20.03.02](./20.03-broadcast-fan-messaging/20.03.02-channel-routing-bulk-delivery.md) D-01. Imported-list complaints degrade the **shared** sending reputation for every artist — a platform-level, not per-artist, hazard.
5. **State transition conflict**: Revocation during an in-flight send must suppress the remainder. The fan's write always beats the artist's intent; the per-recipient re-check at dispatch is the mechanism that guarantees it.

---

### CX-03: Segmentation ↔ Broadcast — who vs who-may-be-contacted

**Relationship**: Every campaign targets a saved segment. The segment answers "who"; broadcast (through CX-02)
resolves "who of those may be contacted, on what channel". The two produce two different numbers and both are
always shown. Critically, **saved segments stay live**: a fan who revokes consent leaves the audience the
instant they revoke, not at the next rebuild — the segment is a query, not a frozen list. The campaign must
tag its purpose-type so the gate resolves against the correct tier (defaulting to *general* when untagged).

**Role scoping**:
- **Musician / Operator**: pick a segment as a campaign target; watch the audience shrink as consent resolves.
- **Fan**: never sees the segment; experiences only the resolved outcome (received or not).
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The segment definition is owned by [20.02.01](./20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md); the campaign that references it is owned by [20.03.01](./20.03-broadcast-fan-messaging/20.03.01-campaign-composer.md). Neither mutates the other — the campaign holds a reference, not a copy.
2. **Trigger chain**: Campaign compose → bind segment reference → at send, re-resolve segment membership → CX-02 consent gate → dispatch. If the segment resolves empty (all revoked), the send is a no-op, not an error.
3. **Permission intersection**: The delegate scope that lets a user *build/export* a segment is separate from the scope that lets them *send* to it (build-vs-export delegate scope, escalated to domain 24 as Q-02). A user may target a segment they cannot export as rows.
4. **Notification fan-out**: This is the fan-out edge — one campaign → N recipients — but every recipient still passes the per-fan CX-02 gate.
5. **State transition conflict**: Segment membership is re-resolved at send, not at compose; a fan added or removed between compose and send is correctly included/excluded. Counting is not marketing — showing the number never contacts anyone.

---

### CX-04: Storefront ↔ Fan Graph — the store captures the fan

**Relationship**: Every purchase is an observation on a fan record. This is the domain's own stated thesis
("the store captures the fan, segmentation identifies the superfan, the alert brings them back, the presale
rewards them") and it is why guest checkout is a **data-quality decision**, not merely a conversion one: a
guest checkout converts better and produces a weaker record, and the record is the strategic asset.

**Role scoping**:
- **Musician**: sees a buyer's full history — three shows attended, on the list since 2019 — not an order number.
- **Fan**: their purchase becomes part of a relationship they can see and control ([20.01.03](./20.01-fan-graph-owned-audience/20.01.03-fan-preference-centre.md)).
- **Operator**: same for venue merch.
- **Producer**: not affected here; their stake is [20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md).

**Synthesis questions answered**:
1. **Shared state conflict**: [20.01.01](./20.01-fan-graph-owned-audience/20.01.01-unified-fan-record.md) owns identity; the store contributes observations and never resolves identity itself. A **payee self-purchase is flagged and excluded** from audience/fan-count metrics so it cannot inflate the graph.
2. **Trigger chain**: Purchase → fan record (create or resolve) → transactional consent basis → **auto-follow** ([20.06](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-cx.md) CX-03) → **never** marketing consent. That last "never" is the line the whole domain depends on.
3. **Permission intersection**: Buying creates a transactional basis only. A store that harvests marketing consent from a checkout is the thing every fan has learned to fear, and doing it would poison CX-08.
4. **Notification fan-out**: Order confirmations are transactional (CX-M07), not broadcast. Different machine, different consent.
5. **State transition conflict**: A guest purchase later resolving to an account must merge with the **intersection** of permissions ([20.01](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-cx.md) CX-02), never the union.

---

### CX-05: Storefront ↔ Segmentation — spend is a signal, not the signal

**Relationship**: A purchase is the score's clearest **money** signal, and the temptation to build the whole
superfan model on it is exactly the retail RFM import D-08 rejects. Spend feeds the score but is deliberately
outweighed by attendance (door scans), because a rich casual is not a superfan and a devoted fan who bused to
nine shows is. The storefront supplies purchase observations; the score decides how little they are allowed to
dominate.

**Role scoping**:
- **Musician**: sees purchases weighted into the score but never able to buy the top of the ranking.
- **Fan**: never sees the score.
- **Operator / Producer**: not affected on this edge.

**Synthesis questions answered**:
1. **Shared state conflict**: The purchase observation is owned by the Fan Graph (via CX-04); the score is derived in [20.02.02](./20.02-segmentation-superfan-intelligence/20.02.02-superfan-score.md). The score never writes back to the purchase.
2. **Trigger chain**: Purchase → fan observation → score recompute (async) → segment membership shifts. A failed recompute holds the last-good score (CX-01), never nulls the signal.
3. **Permission intersection**: None new — purchase visibility follows CX-04; score visibility is Musician/Operator only.
4. **Notification fan-out**: None — this edge is analytical, not notifying.
5. **State transition conflict**: Attendance-dominant weighting is structurally scalper-resistant (a scalper's tickets are scanned by other people), so a burst of purchases cannot race a fan to the top of the ranking the way a spend-dominant model would allow. The weighting *is* the race-mitigation.

---

### CX-06: Segmentation ↔ Storefront — entitlements gate products

**Relationship**: The reverse edge of CX-05. Segmentation does not merely observe the store — it **gates** it.
Members-only items, presale-gated drops, and superfan discounts are all products whose eligibility is a
segment/entitlement resolved in [20.02.03](./20.02-segmentation-superfan-intelligence/20.02.03-perk-entitlements-presale-eligibility.md).
The catalogue flags that a product is gated; it does not decide who passes. Segmentation decides who may buy
what.

**Role scoping**:
- **Musician**: attaches a gate to a product by pointing at a segment or entitlement.
- **Fan**: sees a product as buyable, locked, or presale-eligible depending on their entitlement — resolved, not guessed.
- **Operator**: same for venue-scoped goods; **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The entitlement rule lives in 20.02.03; the product's gated-flag lives in [20.04.01](./20.04-direct-to-fan-storefront/20.04.01-storefront-product-catalog.md). The catalogue reads the entitlement at add-to-cart; it never caches "who is eligible".
2. **Trigger chain**: Add-to-cart on a gated item → resolve entitlement against the buyer's segment/score at that moment → allow or block. Synchronous; blocking is the safe default if resolution fails.
3. **Permission intersection**: This *is* a permission edge — the segment/entitlement is the permission that unlocks the purchase. A revoked membership (CX-07/CX-14) removes the entitlement and re-locks the item.
4. **Notification fan-out**: A presale opening can drive a broadcast to the eligible segment — but that runs through CX-03/CX-02 (segment → consent gate), never a privileged storefront path.
5. **State transition conflict**: Eligibility is resolved at cart time, not listing time; a fan who lapses between browsing and checkout is correctly blocked at checkout. The gate is evaluated as late as possible.

---

### CX-07: Memberships ↔ Segmentation — tenure is a score signal, the ratchet

**Relationship**: Membership tenure and active tier are among the strongest superfan-score signals, and members
are the single most obvious presale segment. The relationship is a **ratchet**: membership raises the score,
the score qualifies the fan for perks, and perk redemption is itself a fan signal that feeds back into the
score. Each turn compounds.

**Role scoping**:
- **Musician**: sees members surface at the top of scored segments and as a ready-made presale audience.
- **Fan**: their membership quietly improves their standing and their access; **Operator / Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Membership state is owned by [20.05.01](./20.05-memberships-patronage-campaigns/20.05.01-membership-tiers-benefits.md) (billing engine is CX-M24); the score reads it. The score never writes membership.
2. **Trigger chain**: Join/renew/lapse → membership state change → score recompute → segment/perk eligibility shifts. A lapse must *lower* the signal, not merely stop raising it — otherwise a lapsed member outranks a current one.
3. **Permission intersection**: Active tier is an entitlement input to CX-06; a lapse propagates through CX-14 to re-lock member-gated goods and vault items.
4. **Notification fan-out**: A presale to "members + top 5%" fans out through CX-03/CX-02, never directly.
5. **State transition conflict**: The ratchet must not let perk redemption inflate the score past what tenure/attendance justify — redemption is *a* signal, weighted, not a multiplier. Same D-08 discipline as CX-05.

---

### CX-08: Fan Experience ↔ Fan Graph — follow is not consent

**Relationship**: **The most important boundary in the domain.** It is where the artist-side half (fans as
records to be segmented and sold to) meets the fan-side half (fans as users with their own product), and the
temptation to merge them is enormous and universal — every social platform has trained artists to believe a
follower is a marketing contact.

A follow creates a fan record and grants **gig-alert eligibility about that artist's shows**. It does not
grant permission to sell. Merge them and the follow button becomes a thing fans learn not to press; the alert
product ([20.06.02](./20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md)) — the fan-side value
proposition — dies with it.

**Role scoping**:
- **Fan**: presses Follow without fearing a marketing relationship. That fearlessness *is* the feature.
- **Musician**: will complain that their 4,000 followers are not contactable. The complaint is the boundary working.
- **Operator**: same.
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The follow is one object; consent is another. Both attach to the fan record; neither implies the other.
2. **Trigger chain**: Follow → record + alert eligibility. **No consent event is written.** The absence is the design.
3. **Permission intersection**: Alert eligibility ≠ marketing consent. Enforced at [20.01.02](./20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md), not by convention or documentation.
4. **Notification fan-out**: Gig alerts fire on the follow (CX-M07). Marketing fires on consent ([20.03](./20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md)). Two machines, deliberately.
5. **State transition conflict**: Unfollow removes alert eligibility and leaves consent untouched — a fan may want the newsletter and not the gig alerts. The two are genuinely orthogonal and fans hold both preferences.

---

### CX-09: Fan Experience ↔ Storefront — the library is the fan's half

**Relationship**: The library ([20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md))
is the fan's half of every store transaction — the *having* to the store's *selling*. The store fills it; the
library surfaces it. Two rules define the seam: a purchase **auto-follows** (the fan acted) but **never
auto-consents** (the fan did not); and the library is where a **guest checkout with no account** is redeemed
via claimable entitlements + a signed email link.

**Role scoping**:
- **Fan**: sees everything they bought in one place, and can claim a guest purchase into an account later.
- **Musician**: sees the sale as a fan observation (CX-04); does not own the library view.
- **Operator / Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The entitlement is owned by the store/payment settlement; the library renders it and never mutates the entitlement. Tickets are the exception — the library *surfaces* them but hands QR/wallet/transfer/refund to domain 19 (cross-domain, see rows).
2. **Trigger chain**: Purchase → entitlement created → library row appears → (if guest) claimable via signed link → account resolution merges the fan record (CX-04 intersection rule).
3. **Permission intersection**: A guest's claimable entitlement is bearer-protected by the signed link; claiming binds it to an authenticated fan record. No marketing consent is created by the claim.
4. **Notification fan-out**: "Your download is ready" / "claim your purchase" are transactional (CX-M07), not broadcast.
5. **State transition conflict**: A member-gated library item can be re-locked by a lapse — that race is CX-14. A purchased (owned) item never re-locks; ownership and access are different states and the library must not confuse them.

---

### CX-10: Fan Demand ↔ Segmentation — the demand map is a weighted geo segment

**Relationship**: [20.07](./20.07-fan-demand-show-requests.md)'s demand map is, mechanically, a geo segment
weighted by fan quality. Raw request counts lie: 40 loud requests in Bristol are worth less than 400 quiet
ticket-buyers in Leeds, and only the superfan score (via segmentation) can tell them apart. Without the score
the demand product degrades to a petition.

**Role scoping**:
- **Musician / Operator**: read the map as routing evidence; the weighting is the difference between routing on data and routing on noise.
- **Fan**: contributes a request/signal; never sees the weighting.
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The demand map reads the scored fan graph (CX-01) plus explicit requests; it owns the request object, segmentation owns the score.
2. **Trigger chain**: Requests + scored fans + geo → weighted map → (cross-domain) tour routing in 18. Read-only over the graph; no rollback surface.
3. **Permission intersection**: Individually-targeted reads inherit the k-anonymity floor (domain 24); aggregate geo-density is unfloored map data.
4. **Notification fan-out**: None on this edge — the map is analytical; the alert output is CX-11.
5. **State transition conflict**: A map read mid-routing is a live-graph snapshot. Acceptable — tours are not booked per-second.

---

### CX-11: Fan Demand ↔ Fan Experience — the loop that closes the domain

**Relationship**: [20.07](./20.07-fan-demand-show-requests.md) and
[20.06.02](./20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md) are inverse views of one graph:
one tells the artist where the fans are, the other tells the fans where the artist is. Chained, they compound
— demand informs routing (18) → booking (17) → announcement → alert → attendance scan (19) → the fan record
deepens → the next demand map is sharper.

**This is the only loop in domain 20 that gets better with use**, and it is the clearest illustration of the
consolidation thesis (D-18): every step happens on the platform, so every step feeds the next. Break any link
— no ticketing, no booking, no location — and it degrades to a static list.

**Role scoping**:
- **Musician**: routes on evidence instead of on which cities feel loud on Instagram.
- **Fan**: gets the show they asked for, and is told in time.
- **Operator**: sees whose audience is already in their catchment ([20.07](./20.07-fan-demand-show-requests.md) DT-03 — possibly the bigger product).
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Both read [20.01.01](./20.01-fan-graph-owned-audience/20.01.01-unified-fan-record.md). Neither writes the other.
2. **Trigger chain**: Long and cross-domain (20 → 18 → 17 → 19 → 20). **Every link is a dependency and the chain is only as good as its weakest** — which is why Q-09 on the index (does the alert product ship without 19?) is a sequencing question rather than a preference.
3. **Permission intersection**: A fan's location powers both. Absent for most fans, which is the shared weakness — the same missing field cripples both features.
4. **Notification fan-out**: The alert is the loop's output and its most fragile step ([20.06.02](./20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md) D-05 — an SLO, not a queue).
5. **State transition conflict**: A demand map read mid-routing is a snapshot of a live graph. Fine — nobody books a tour on a per-second basis.

---

### CX-12: Broadcast ↔ Memberships — direction decides the owner

**Relationship**: Campaigns are how a crowdfunding drive reaches backers and how a vault drop reaches members.
But the **artist-side health nudge** — "your members haven't had anything in six weeks" — is the platform
speaking *to the artist*, which is CX-M07 (notifications), not broadcast. The direction of the message decides
which machine owns it, and conflating them would either spam fans with artist-ops noise or route artist nudges
through the consent gate that governs fan sends.

**Role scoping**:
- **Musician**: receives the health nudge (platform → artist); composes the member drop (artist → fans, via CX-03/CX-02).
- **Fan / member**: receives only the fan-directed campaign, consent-gated like any other.
- **Operator / Producer**: not affected.

**Synthesis questions answered** *(Medium confidence — synthesis provisional)*:
1. **Shared state conflict**: Membership roster owned by 20.05; the campaign that targets it owned by 20.03. No shared mutable state — the roster is a segment source.
2. **Trigger chain**: Member drop → segment (members) → CX-02 consent gate → send. The health nudge is a separate, artist-directed CX-M07 trigger with no fan fan-out.
3. **Permission intersection**: Member drops still resolve consent per recipient; membership is not consent (same discipline as CX-08).
4. **Notification fan-out**: Fan-directed drops fan out through broadcast; artist-directed nudges reach one artist.
5. **State transition conflict**: A member who lapses mid-campaign is removed at send-time segment re-resolution (CX-03), same as any live segment.

---

### CX-13: Memberships ↔ Storefront — the pre-order is a campaign

**Relationship**: A vinyl pre-order bundle in
[20.04.03](./20.04-direct-to-fan-storefront/20.04.03-digital-sales-name-your-price-bundles.md) takes fan money
in November for a record pressed in March. That is
[20.05.04](./20.05-memberships-patronage-campaigns/20.05.04-crowdfunding-preorder-campaigns.md) with a Buy
button: same money-now-object-later gap, same supply chain, same PledgeMusic hazard.

Recorded here because it is a boundary the sweep did not see: pre-orders were filed as commerce and
crowdfunding as patronage, and nobody noticed they are the same instrument. If the fund-segregation policy
([20.05](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) D-02) applies
to one and not the other, artists will route around it by calling every campaign a pre-order.

**Role scoping**:
- **Musician**: gets cashflow to press the record — the actual point — under the same constraints either way.
- **Fan**: pays now, receives later, with the same protection whichever door they came through.
- **Producer**: payee on the funded work.
- **Operator**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Both create a delivery obligation against held funds. One policy must govern both, or the policy is optional.
2. **Trigger chain**: Pre-order → funds held (segregated) → pressing milestone → release → fulfil (CX-M14). Component notional values captured at listing drive deterministic partial-refund apportionment (D-06).
3. **Permission intersection**: None new.
4. **Notification fan-out**: Pre-order buyers need campaign-style updates — especially the bad ones. A pre-order that goes quiet for five months is the same betrayal as a silent campaign.
5. **State transition conflict**: Bundle refunds where the digital component was already delivered ([20.04](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-cx.md) CX-01) — apportionment against the locked component values; the physical component refunds, the delivered digital does not.

---

### CX-14: Memberships ↔ Fan Experience — the vault-lapse race

**Relationship**: Membership-gated vault items ([20.05.02](./20.05-memberships-patronage-campaigns/20.05.02-exclusive-content-vault.md))
**lock the instant a membership lapses**, and that lock is *felt in the fan's library*
([20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md)). The keep-vs-lose policy is
owned by 20.05 (its open Q-01: does a lapsed member keep what they downloaded?), but the *lifecycle event*
that flips a vault row from unlocked to locked must reach the library atomically, or a fan sees content they
can no longer legitimately open. This is the one genuine interaction at the 20.05↔20.06 join that R-02
conceded was real; it is promoted here from a rejected pair because it is a state-transition race, not a
passive render.

**Role scoping**:
- **Fan / member**: on lapse, member-only vault rows lock in the library; owned purchases never lock (CX-09).
- **Musician**: sets the keep-vs-lose policy (20.05.02 Q-01) that this edge enforces.
- **Operator / Producer**: not affected.

**Synthesis questions answered** *(Medium confidence — pending 20.05.02 Q-01 resolution)*:
1. **Shared state conflict**: The entitlement/tier state is owned by 20.05 (billing is CX-M24); the library is a reader that must reflect the lock. The library never decides the policy; it renders the current entitlement.
2. **Trigger chain**: Lapse (billing event, CX-M24) → membership state change (20.05.01) → vault entitlement re-evaluated (20.05.02) → library row locks (20.06.03). Must be atomic-enough that the library never shows a stale *unlocked* state after a lapse — fail-closed to locked on ambiguity.
3. **Permission intersection**: The vault entitlement is the permission; lapse revokes it. Distinguish member-*gated* vault content (re-locks) from *purchased* content (never re-locks) — conflating them either strands owned goods or leaks member goods.
4. **Notification fan-out**: A lapse may notify the fan ("your membership ended; N items are now locked") via CX-M07 — transactional, not broadcast.
5. **State transition conflict**: The core race — a lapse landing while the fan is mid-view. Resolution: fail closed to locked; the keep-vs-lose policy (whether *previously downloaded* copies survive) is the unresolved 20.05.02 Q-01 that must be answered before this edge is fully specifiable.

---

## Cross-Cut Mechanisms Absorbed Here

> Candidates and concerns routed **out** of this domain into platform mechanisms. Recorded so the orchestrator
> can absorb them into `ideation-cx.md` and so nobody re-adds them as children.

| Candidate / concern | Routed to | Why |
|---|---|---|
| **Artist Microsite & Custom Domain** (sweep candidate 12) | **CX-M23** Public SEO Surfaces & Embeds | Public page rendering, SEO, embeds and custom-domain mapping already serve 8 domains (artist profiles, venue pages, gear listings, credits). A D2F microsite is that mechanism pointed at a store. Consistent with the domain's own rationale ("embeds → the SEO cross-cut") and with the 6-capability core, which never listed a microsite. |
| Cart, checkout, payments, escrow, payouts | **CX-M01** Payments, Escrow & Payouts | The rails. What stays domain-owned is [20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md) — applying a rights record to a D2F sale, which exists nowhere else. |
| Marketplace facilitator tax, VAT/GST, 1099-K/W-8BEN | **CX-M02** Tax & Fiscal Compliance | Multi-party payouts and cross-border digital goods. Domain 20 is a **trigger** for these, not an owner. |
| Bulk email/SMS/push transport | **CX-M07** Notifications & Alerts | **Transport only.** [20.03](./20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md) D-01: transactional platform messages and artist→fan marketing share plumbing and nothing above it. |
| Recurring billing, dunning, proration, entitlement checks | **CX-M24** Subscriptions & Entitlements | The membership *billing engine*. What a music membership **is** stays here ([20.05.01](./20.05-memberships-patronage-campaigns/20.05.01-membership-tiers-benefits.md) DT-01). The lapse **event** it emits is what CX-14 consumes. |
| Shipping rates, labels, tracking, customs | **CX-M14** Shipping, Fulfilment & Logistics | Created by the domain rationale precisely so [20.04.02](./20.04-direct-to-fan-storefront/20.04.02-merch-variants-print-on-demand.md) would not reimplement it. |
| DSAR, erasure, portability, the consent ledger | **CX-M18** Privacy, Consent & Data Portability | The machinery. **Marketing** consent — which artist may sell to which fan on which channel — stays domain-owned ([20.01.02](./20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md) DT-01). |
| Follow/save/watchlist mechanism | **CX-M28** Follow, Save & Watchlist | The verb. What following an **artist** *means* — a fan record, alert eligibility, and pointedly *not* consent — stays here ([20.06](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) D-04). |
| CSV/ESP import machinery, streaming-service connectors | **CX-M29** Bulk Import, Sync & Migration Tooling | The mechanism. The consent-provenance interrogation ([20.01.04](./20.01-fan-graph-owned-audience/20.01.04-fan-list-import-hygiene.md)) and the never-auto-follow rule ([20.06.04](./20.06-fan-experience-discovery/20.06.04-listening-history-import-bootstrap.md)) are domain-owned. |
| Livestream/audio-video transport, rooms, presence | **CX-M11** Real-Time Rooms, Presence & Audio Transport | D-15 extracted this from domain 08 for exactly this reason. [20.05.06](./20.05-memberships-patronage-campaigns/20.05.06-virtual-fan-events.md) consumes it. |
| Entity resolution for fans and artist names | **CX-M17** Canonical Data, Taxonomy & Entity Resolution | The mechanism; the auto-merge *policy* (which keys are strong enough to merge a human) is domain-owned ([20.01.01](./20.01-fan-graph-owned-audience/20.01.01-unified-fan-record.md) D-02). |
| Age assurance / minor protection | **Safeguarding & Minor Protection** cross-cut | A consent event from a minor is not consent; age-assurance state overrides contactability to not-contactable, and holds payouts to minor session players ([20.01.02](./20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md), [20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md)). |
| Geo/map discovery + search infrastructure | **CX-M13** Geo / **CX-M16** Search | Distance-from-venue segment conditions and query resolution ([20.02.01](./20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md)) consume these; the segment logic is domain-owned. |
| Audit log / provenance ledger | **CX-M** Audit Log & Provenance Ledger | Merges, splits, consent changes, observation writes, payouts and denied claims are append-only — the tamper-evident chain that makes unmerge-restores-state and the single-fan evidence pack ([20.01.01](./20.01-fan-graph-owned-audience/20.01.01-unified-fan-record.md), [20.01.02](./20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md)) defensible. |
| **SPF/DKIM/DMARC, IP warming, ESP selection, blocklist remediation** | **`/create-prd-architecture`** — not product | Infrastructure wearing a product costume. The **product** surface — what the artist sees, what they cannot do, what happens when a send is stopped — stays in [20.03.04](./20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md). |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 20.03 Broadcast | 20.06 Fan Experience | The tempting pair — "broadcast reaches fans, fans are in 20.06" — and rejecting it is the point of D-07/CX-08. Broadcast reaches fans **through consent** ([20.01](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md)), never through the follow graph. Drawing this edge would legitimise the exact merge (follow ⇒ marketing) that kills the fan-side product. The only legitimate path is 20.06 → 20.01 (consent) → 20.03. |
| R-02 | 20.05 Memberships | 20.06 Fan Experience (render) | **Narrowed, not eliminated.** A membership *appearing* in the fan's library ([20.06.03](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md)) is the library rendering an entitlement, not two children interacting — no shared mutable state on the *display*. The one genuine interaction at this join, the vault **lapse lifecycle race**, is now modelled as **CX-14** (the render is passive; the lock transition is not). |
| R-03 | 20.07 Fan Demand | 20.03 Broadcast | Considered: an artist who sees demand in Leeds would surely email Leeds. True — and that path is 20.07 → 20.02 (segment) → 20.03, already modelled as CX-10 + CX-03. A direct edge would let a demand cluster become an audience without passing through consent, which is the same error as R-01. |
| R-04 | 20.01 Fan Graph | 20.05 Memberships | A member is a fan record — but every child of this domain writes fan observations; that is CX-04's generalisation, not a distinct pair. The membership-specific interaction runs through segmentation (CX-07, tenure as score signal) and the library (CX-14, lapse lock). No behaviour lives on the direct 20.01↔20.05 edge that is not already elsewhere. |
| R-05 | 20.04 Storefront | 20.03 Broadcast | Announcing a product is a campaign — but it is a campaign like any other: 20.04 supplies the *object* to [20.03.01](./20.03-broadcast-fan-messaging/20.03.01-campaign-composer.md)'s object-first composer, exactly as 17 supplies shows and 12 supplies releases. That is the composer's general pre-fill mechanism ([20.03.01](./20.03-broadcast-fan-messaging/20.03.01-campaign-composer.md) DT-01), not a domain-20-specific pair. Modelling it would imply the store has a privileged broadcast path it does not have. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-15|D-15]]
