# Fanbase & Direct-to-Fan — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `important`

## Overview

The artist's relationship with their audience and its monetization — owned fan lists and consent, segmentation and superfan scoring, direct-to-fan commerce, memberships and patronage.

**Why this is a top-level domain**: Renamed from 'Fan & Audience' to kill the name collision with the analytics domain that a verifier correctly identified. Absent from idea.md, whose B2B framing omits the largest population and the ultimate funding source. The defining lesson of the streaming era is that rented audiences get taken away; Bandcamp (~$1.5B paid to artists) and Patreon prove direct fan monetization now materially exceeds streaming for most independents. The thread is single and no sibling owns it: the store captures the fan, segmentation identifies the superfan, the alert brings them back, the presale rewards them. No other domain holds an identified first-party fan record — Community is peer-to-peer professional, Promotion is strangers, Analytics is aggregate. Segmentation here is sharper than any standalone email tool because the platform holds ticket, merch and attendance data. Shrunk hard in response to a verifier whose duplication findings were objectively correct and which I acted on in full: embeds → the SEO cross-cut, portability/DSAR → the Privacy cross-cut, presale mechanism → Ticketing, merch logistics → the new Shipping cross-cut, membership billing engine → the Subscriptions cross-cut. What remains is the ~6-child irreducible core the objection itself conceded, plus D2F commerce. The store stays here rather than in Gear Marketplace because a t-shirt has no serial, no condition grade and no place in a make/model catalog — forcing it there is a wrong-cut; the shared part was logistics, and logistics is now a cross-cut. The fan-side discovery children are flagged as gated on owner decision #3.

> **Gate superseded (2026-07-16)**: the sentence above about fan-side discovery being "gated on owner decision #3"
> is **stale and is overridden by D-11** — "Fans are first-class USERS, not CRM records… Domain 20's fan-side
> children are live product, not gated." [20.06 Fan Experience & Discovery](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md)
> is live product. The original rationale is preserved verbatim above as the historical record.

**Interacting capabilities** (what justifies domain status):

- owned fan data & consent
- segmentation & superfan scoring
- broadcast channels (email/SMS/push)
- direct-to-fan storefront & digital sales
- memberships, patronage & crowdfunding
- fan-side discovery (~~gated~~ — live per D-11)

## Children

> Classified through the Node Classification Gate during `/ideate-discover` Step 3 (breadth).
> 17 sweep candidates → **6 sub-domains + 1 domain-level feature**, containing **27 leaf features**.
> 5 candidates merged, 1 routed to a cross-cut, 1 routed to `/create-prd`. 6 Deep Think additions.
> All nodes `[SURFACE]` — depth is allocated by MoSCoW in Step 5.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Fan Graph & Owned Audience | sub-domain | [20.01-fan-graph-owned-audience/](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) | `[SURFACE]` | 24 hypotheses (5 features) |
| 02 | Segmentation & Superfan Intelligence | sub-domain | [20.02-segmentation-superfan-intelligence/](./20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md) | `[SURFACE]` | 11 hypotheses (3 features) |
| 03 | Broadcast & Fan Messaging | sub-domain | [20.03-broadcast-fan-messaging/](./20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md) | `[SURFACE]` | 14 hypotheses (4 features) |
| 04 | Direct-to-Fan Storefront | sub-domain | [20.04-direct-to-fan-storefront/](./20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md) | `[SURFACE]` | 21 hypotheses (4 features) |
| 05 | Memberships, Patronage & Campaigns | sub-domain | [20.05-memberships-patronage-campaigns/](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) | `[SURFACE]` | 18 hypotheses (6 features) |
| 06 | Fan Experience & Discovery | sub-domain | [20.06-fan-experience-discovery/](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) | `[SURFACE]` | 16 hypotheses (4 features) |
| 07 | Fan Demand & Show Requests | feature | [20.07-fan-demand-show-requests.md](./20.07-fan-demand-show-requests.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `domain` — a top-level grouping within a surface (folder with index + CX)
> - `sub-domain` — a grouping within a domain that has 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Candidate Disposition — all 17 sweep candidates accounted for

| Sweep candidate | Disposition |
|---|---|
| 01 Fan CRM & Owned Audience | → sub-domain **20.01**; the CRM framing rejected (D-11: fans are users) |
| 02 Fan Consent & Preference Capture | → split into features **20.01.02** (consent/legal basis) + **20.01.03** (preference centre) — the artist-side record and the fan-side control are different objects with opposite writers |
| 03 Fan Segmentation & Superfan Scoring | → split into **20.02.01** (builder) + **20.02.02** (score) — the score is derived and fallible, the builder queries observed fact |
| 04 Mailing List & Newsletter | → **merged** into 20.03 as **20.03.01** (composer) + **20.03.02** (routing). "Mailing list" is not a feature; it is a channel of the broadcast machine |
| 05 SMS, Push & Broadcast Channels | → **merged** with 04 into **20.03.02**. Channels are one routing problem, not two features |
| 06 Superfan Perks & Presale Eligibility Segments | → feature **20.02.03**. Presale *mechanism* stays in domain 19 (D-03 there) |
| 07 D2F Merch Storefront & Print-on-Demand | → **20.04.01** (catalog) + **20.04.02** (merch/POD) |
| 08 Memberships & Subscription Tiers | → feature **20.05.01**; billing engine consumes CX-M24 |
| 09 Tipping & Micro-Patronage | → feature **20.05.03** |
| 10 Exclusive Content Vault | → feature **20.05.02** |
| 11 Digital Music Sales, NYP & Bundles | → feature **20.04.03** (kept whole — bundling is inseparable from digital sales) |
| 12 Artist Microsite & Custom Domain | → **CROSS-CUT (CX-M23)**. Public page rendering, SEO, embeds and custom-domain mapping already serve 8 domains. Consistent with the domain's own rationale ("embeds → the SEO cross-cut") and with the 6-capability core, which never listed a microsite |
| 13 Crowdfunding & Preorder Campaigns (segregated funds) | → feature **20.05.04**; "(segregated funds)" promoted to its own node **20.05.05** — it is the feature, not a qualifier |
| 14 Ticketed Live Streams & Virtual Shows | → **merged** with 15 into **20.05.06** |
| 15 Ticketed Listening Parties | → **merged** with 14. One mechanic, two contents |
| 16 Fan Demand & Show Requests | → domain-level feature **20.07** |
| 17 Fan-Side Discovery, Artist Tracking & Gig Alerts (GATED) | → sub-domain **20.06**. **Ungated per D-11.** Split into follow / alerts / library / bootstrap |

### Deep Think Additions — nodes the sweep did not have

| Node | Why it must exist |
|---|---|
| [20.01.05 Fan List Ownership, Band Splits & Roster Transfer](./20.01-fan-graph-owned-audience/20.01.05-fan-list-ownership-transfer.md) | Who owns the list when the band splits. The platform's own thesis applied to the fan graph — a fact nobody records while everyone is friendly, litigated later when they are not. |
| [20.03.04 Deliverability, Sender Reputation & Suppression](./20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md) | The sweep enumerated channels and assumed delivery. Sender reputation is **shared across all artists** — one bad list degrades everyone's inbox placement. The domain's defining multi-tenant hazard. |
| [20.04.04 D2F Revenue Split & Collaborator Payout](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md) | **The most thesis-aligned feature in the domain.** The sweep specified the storefront and never asked who gets paid. This is the only place a fan's direct purchase resolves against a split captured at a session. |
| [20.05.05 Backer Funds, Escrow & Reward Fulfilment](./20.05-memberships-patronage-campaigns/20.05.05-backer-funds-fulfilment.md) | The sweep had "(segregated funds)" as a parenthetical. PledgeMusic died on exactly this. A policy buried inside the thing it constrains gets negotiated away. |
| [20.06.03 Fan Library & Purchase Collection](./20.06-fan-experience-discovery/20.06.03-fan-library-collection.md) | The sweep specified the artist's vault and never the fan's collection — the selling, never the having. The only screen in the domain built purely for the fan. |
| [20.06.04 Listening History Import & Follow Bootstrap](./20.06-fan-experience-discovery/20.06.04-listening-history-import-bootstrap.md) | **Step 1 of the Fan persona's stated workflow**, absent from the sweep. Without it a fan follows nobody and the alert product is dead on arrival. |

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md) — referenced, never redefined.
> Detailed per-role behaviour lives in each feature file's **Role Lens**.

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 20.01 Fan Graph & Owned Audience | ✅ Full | ❌ None | ✅ Full (own venue's list) | 👁️ Read-only + ✅ consent control |
| 20.02 Segmentation & Superfan Intelligence | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 20.03 Broadcast & Fan Messaging | ✅ Full | ❌ None | ✅ Full | 👁️ Read-only (channel choice) |
| 20.04 Direct-to-Fan Storefront | ✅ Full | 📊 Reports (payee on 20.04.04) | ✅ Full (venue merch only) | 👁️ Read-only (browses, buys) |
| 20.05 Memberships, Patronage & Campaigns | ✅ Full | 📊 Reports (payee) | ❌ None — see Q-04 | 👁️ Read-only (joins, backs, attends) |
| 20.06 Fan Experience & Discovery | 📊 Reports | ❌ None | 📊 Reports | ✅ **Full** |
| 20.07 Fan Demand & Show Requests | ✅ Full | ❌ None | 📊 Reports — see Q-05 | ✅ Full (requests) |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access

**Reading the matrix — three things it says:**

1. **The Producer is nearly absent, and where they appear is the point.** Their only non-`None` cells are as a *payee* ([20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md), [20.05](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md)). `meta/personas.md` calls them the provenance capture point; this domain is where that capture pays them, years later, for a split they filed on the day. A Producer with their own audience is exercising the Musician lens.
2. **20.06 inverts the domain.** The Fan is `Full` and nobody else is. That is the persona constraint made structural — "their surface must be a different product wearing the same brand".
3. **The Operator is a genuine, contested participant.** Venues run mailing lists, sell merch, and want to know whose audience is outside their door. This expands the domain's scope beyond "the artist's audience" and is flagged as Q-04/Q-05 rather than assumed.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Renamed from 'Fan & Audience' to kill the name collision with the analytics domain that a verifier correctly identified. Absent from idea.md, whose B2B framing omits the largest po... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **17 candidates → 6 sub-domains + 1 feature + 27 leaf features** | Node Classification Gate applied to every candidate. 5 merged, 1 → cross-cut (CX-M23), 1 → `/create-prd`. Full disposition table above. | `/ideate-discover` Step 3, 2026-07-16 |
| D-03 | **Fan-side discovery is UNGATED** | The sweep's "GATED on owner decision #3" is stale. D-11 ratified fans as first-class users and states plainly that domain 20's fan-side children are live product. [20.06](./20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md) is live. | D-11, ratified 2026-07-16 |
| D-04 | **The D2F sale must resolve against the rights record** | [20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md). The single most thesis-aligned decision in the domain: because the platform holds both the split captured at the session and the money from the sale, a D2F purchase pays the session drummer automatically. No storefront competitor can do this — they were not in the room (`meta/problem-statement.md`). A store that pays 100% to the uploader regardless of the split on file makes provenance decorative. | Deep Think, `/ideate-discover` Step 3 |
| D-05 | **Sender reputation is a platform asset, not an artist's** | [20.03.04](./20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md). On shared sending infrastructure one artist's complaint rate degrades every other artist's deliverability. Enforcement is therefore mechanical and non-overridable — and the platform's *commercial* interest in strict consent is a more durable motive than compliance. | Deep Think, `/ideate-discover` Step 3 |
| D-06 | **Backer funds are segregated and artist-inaccessible until milestones** | [20.05.05](./20.05-memberships-patronage-campaigns/20.05.05-backer-funds-fulfilment.md). PledgeMusic collapsed in 2019 owing artists millions by commingling fan money with operating funds. The common failure has no villain — an honest, optimistic, cash-pressed artist — which is why the policy must be structural rather than moral. | Deep Think, `/ideate-discover` Step 3 |
| D-07 | **A follow is not marketing consent** | [20.06.01](./20.06-fan-experience-discovery/20.06.01-artist-tracking-follow.md) DT-02. Follow grants gig alerts about that artist's shows; it does not grant permission to sell. Merging them turns the follow button into a thing fans learn not to press, which kills the fan-side product. Artists will complain that their 4,000 followers are not contactable; that complaint is the feature working. | `/ideate-discover` Step 3 |
| D-08 | **Attendance (door scans) outweighs spend in the superfan score** | [20.02.02](./20.02-segmentation-superfan-intelligence/20.02.02-superfan-score.md) D-01. An RFM model imported from retail ranks a rich casual above a devoted fan who came to nine shows on a bus — a category error in music. It is also structurally scalper-resistant (a scalper's tickets are scanned by other people). Musically honest and abuse-resistant converge, which is the best evidence available that it is right. | Deep Think, `/ideate-discover` Step 3 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | ~~`/ideate-discover`~~ **RESOLVED** — D-02, disposition table above |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | ~~`/ideate-discover`~~ **RESOLVED** — Artist Microsite → CX-M23. See `fanbase-direct-to-fan-cx.md` |
| Q-03 | ~~**Can an artist export their fan list in full?**~~ **RESOLVED — yes, for the owning entity; the control is scope + audit + notice, not prohibition.** [20.01.05](./20.01-fan-graph-owned-audience/20.01.05-fan-list-ownership-transfer.md) DT-03 (✅ CONFIRMED): "**The resolution is scope + audit + notice, not prohibition** — the owning entity may export, delegates may not, every export is logged and the owner is told." So the owned-audience promise is credible and the moat is behavioural, not custodial; the collision with ownership rules is closed by delegate scoping, whose enforcement model that same DT already raises to `/create-prd-security`. | User | ✅ Resolved — [20.01.05](./20.01-fan-graph-owned-audience/20.01.05-fan-list-ownership-transfer.md) DT-03 |
| Q-04 | **[OWNER]** **How far does the Operator's stake extend?** Venues demonstrably run mailing lists (20.01), broadcast (20.03) and sell merch (20.04). Memberships (20.05) are marked `None` but grassroots supporter schemes are real. Either domain 20 serves venues too, or domain 16 reimplements this domain. *The fan-list half is already settled — [20.01](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) D-03 makes the Operator "a first-class holder of a fan list" because "excluding them would force domain 16 to reimplement this sub-domain". What is still the owner's is the **extent**: memberships ([20.05](./20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md) Q-04) and whether the Role Matrix expansion is by design ([20.01](./20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md) Q-02).* | User | `/create-prd` |
| Q-05 | **[OWNER]** **Is the Operator-side demand product bigger than the artist-side one?** [20.07](./20.07-fan-demand-show-requests.md) DT-03 — "which artist's audience is already outside my door" has no incumbent and hits the Operator's stated core pain (a perishable calendar) directly. A scope/values call no later stage takes unaided; same question as [20.07](./20.07-fan-demand-show-requests.md) Q-03 — answer both together. | User | `/create-prd` |
| Q-06 | ~~**Does the fan-side product need a mobile surface?**~~ **RESOLVED — D-28 (2026-07-18): v1 is web + PWA with web push as the gig-alert channel; a native app is phase 2.** [ideation-index.md](../ideation-index.md) D-28: "**Mobile** = native app is **phase 2** (v1 = web + PWA; classification stays `single-surface`, native tracked as a future surface, backend must be API-first)". [meta/constraints.md](../meta/constraints.md) § Project Surfaces, Mobile (PWA): "**v1**: web is installable as a PWA (home-screen, web push for gig alerts…)"; Mobile (native): "**Phase 2** … primarily serving Live/Events (16–19) and Fanbase (20) — the phone-context domains". [20.06.02](./20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md) Q-01 already carries the identical resolution; DT-01's iOS objection survives as constraints.md's ⚠️ VERIFY item (iOS Safari web push needs the home-screen install), not as an open surface question. | User | ✅ Resolved — D-28 + [meta/constraints.md](../meta/constraints.md) § Project Surfaces |
| Q-07 | **[OWNER]** **No rights record on a D2F product: hard-block or 100%-to-lister?** [20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md) DT-02/Q-02. Hard-block is thesis-pure and empties the launch catalogue (every track predates the platform). 100%-with-acknowledgement fills it and makes splits optional. **The most consequential open question in the domain.** DT-02 there records 100%-to-lister as the *specified default* but explicitly as "my reading; owner may switch to hard-block" — the ratification is the owner's and nothing downstream takes it. | User | `/create-prd` |
| Q-08 | **Does holding collaborator payouts and backer funds make WeJammin a regulated money transmitter?** [20.04.04](./20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md) Q-05 + [20.05.05](./20.05-memberships-patronage-campaigns/20.05.05-backer-funds-fulfilment.md) Q-01/Q-04. `meta/constraints.md` flags KYC/AML `[PENDING]`; this domain is the trigger. Insolvency protection for backer funds is a corporate-structure decision, cheapest now while the company is empty. | User | `/create-prd-security` |
| Q-09 | ~~**Does the alert product ship without domain 19?**~~ **RESOLVED — no, and it does not have to: 19 and 20 sit in the same release band.** [meta/constraints.md](../meta/constraints.md) § Phase 2+ lists "Royalties/Collection (10), Licensing (11), Release/Distribution (12), **Live/Events (16–19), Fanbase (20)**…" together, so door scans land with the score and booked shows land with the alert. The supply-side-first beachhead argument this row carried is superseded by **D-31**, which made v1 the session spine (01, 02, 05, 07, 09-capture) and v1.5 the marketplaces (13, 14, 15) — [ideation-index.md](../ideation-index.md): "this supersedes the earlier 'defer the beachhead to `/plan-phase`' position recorded under D-20". Slice order *within* that band is `/plan-phase`'s work, not a MoSCoW question. | User | ✅ Resolved — D-31 + [meta/constraints.md](../meta/constraints.md) § Phase 2+ |
| Q-10 | Shared sending domain or per-artist authenticated domains? [20.03.04](./20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md) DT-02 — no clean answer. Isolation vs asking musicians to configure DKIM. | User | `/create-prd-architecture` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-31|D-31]]
- [[decisions.md#d-20|D-20]]
- [[decisions.md#d-13|D-13]]
