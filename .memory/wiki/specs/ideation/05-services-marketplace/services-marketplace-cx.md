# Services Marketplace — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Services Marketplace](./services-marketplace-index.md)
> **Status**: [BREADTH] — 7 sub-domains classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | A quote renders and snapshots a listing's pricing model against a real job. The listing is a template; the quote is an offer. | Musician, Producer, Operator | High | 05.01.01 D-01, 05.02.01 D-02. Immutability removes the "seller raised their rate mid-job" dispute class entirely. |
| CX-02 | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | Acceptance creates the engagement; the accepted quote version is its **scope of record** | Musician, Producer | High | 05.02 D-03, 05.03.01 D-01. Every dispute in this domain resolves back to it. |
| CX-03 | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | The revision limit and the auto-accept window are **two halves of one mechanism** | Musician, Producer | High | 05.03.03 DT-01, 05.04.01 D-03. The limit bounds the seller's exposure; auto-accept bounds the buyer's inaction. Neither works alone. |
| CX-04 | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | **Acceptance is the atomic three-way commit**: escrow release + rights transfer + credit emission | Musician, Producer | High | 05.04.01 DT-02, 05.06.03 D-01. **The domain's thesis executing.** Everything else exists to deliver two consenting parties here. |
| CX-05 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | Rights posture is declared and priced on the listing; the `points` pricing model has no cash and exists only as a rights term | Musician, Producer | High | 05.01.01 D-02, 05.01.03 DT-01, 05.06.02 DT-01. Price and posture are one decision seen twice. |
| CX-06 | [05.05 Multi-Party Supply](./05.05-multi-party-supply/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | Rights and credits must reach the humans who did the work, not the contracting party | Musician, Producer | High | 05.05.02 DT-01 (the vanishing string section), 05.06.01 DT-02. Domain principle P-02. |
| CX-07 | [05.05 Multi-Party Supply](./05.05-multi-party-supply/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | A dep substitution mutates a live engagement's counterparty — escrow payee, credit subject and rights assignor all change mid-flight | Musician, Producer, Operator | High | 05.05.01 Behavior. Structurally unlike anything else in the domain. |
| CX-08 | [05.07 Custodial & Physical](./05.07-custodial-physical-services/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | **Custodial work does NOT use the engagement lifecycle** — different state machine, shared entity | Musician, Producer, Operator | High | 05.07.01 DT-03, 05.07 D-02. Seven of the lifecycle's states are nonsense for a repair. |
| CX-09 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | Turnaround is declared on the listing; its clock is started by the requirements gate | Musician, Producer | High | 05.01.06 DT-01, 05.03.01 D-02. Domain principle P-03. |
| CX-10 | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | The NDA gates the buyer's material going in; watermarking protects the seller's draft coming out. Ghost anonymity then suppresses the credit acceptance emits. | Musician, Producer | High | 05.04.03 DT-02 (the mirror), 05.02.02 DT-01 (the suppression). Same window, opposite directions. |
| CX-11 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.05 Multi-Party Supply](./05.05-multi-party-supply/) | Whether a listing's seller is a **person or an entity** determines the consent rule for substitution | Musician, Producer, Operator | High | 05.05.03 DT-01 refines 05.05.01 DT-02. Same unanswered question as 05.01 Q-02, from a second direction. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** `services-marketplace-cx.md#CX-04`

---

## Domain Principles Discovered During Drilling

Three rules emerged independently in multiple sub-domains. Each is recorded once here, because a rule reached from three directions is a property of the domain rather than of a feature.

### P-01 — The platform makes claims attributable; it does not verify them

Reached by 05.04.02 DT-01 (QC checks a spec, never quality), 05.06.04 DT-02 (sample detection produces confident false clearances), and 05.06.05 DT-03 (AI detection produces career-level false accusations). In every case the tempting technical fix would create an **implicit assurance the platform cannot honour**, and the first dispute would cite it.

The platform's real verification mechanism is social, not technical: **domain 02's counter-attestation**. The people who were in the room are much harder to fool than a classifier — and that is a structural advantage no competitor without a credit graph can copy.

Design consequence: every badge, label and status in this domain says the smaller true thing. "The seller declared", never "the platform confirmed".

### P-02 — The credit follows the hands

Reached by 05.05.01 DT-01 (the dep is credited, not the booked seller), 05.05.02 DT-01 (N+1 credits, not one to the fixer), 05.05.03 D-02 (not the agency, not the delegator), and 05.06.01 DT-02 (work-for-hire transfers economics, not authorship).

A model that got the payment chain right and the credit chain wrong would pass every test anyone would think to run — both parties paid, engagement green, nobody complains — while fabricating entries in the asset D-18 calls "the value they cannot take with them and no competitor can retroactively manufacture". This is why 05.05 exists as a unit rather than as four scattered commercial conveniences.

### P-03 — No clock runs against a party until the counterparty has done their bit

Reached by 05.01.06 DT-01 (turnaround starts at the requirements gate, not at purchase) and 05.04.02 DT-02 (QC gates delivery, so the auto-accept clock never starts on an invalid file). Same principle, both directions, discovered separately in unrelated sub-domains.

Every marketplace that starts the clock at checkout makes its own SLA a lie, and sellers respond by padding turnaround until the attribute is meaningless.

---

## Cross-Cut Details

### CX-04: Delivery & Acceptance ↔ Rights, Warranties & Transfer

**Relationship**: The domain's centre of gravity. Acceptance fires one indivisible transaction across three systems: escrow releases (Payments cross-cut), the rights posture executes into domain 09, and the credit emits into domain 02 at its elected visibility. This is the sentence in the domain rationale — *"binding rights transfer and split execution to escrow release — the only leverage that exists at the only moment anyone is motivated"* — implemented or not implemented.

It is also where D-18's causal claim cashes out. The thesis says consolidation is the *precondition* for provenance: being where the work happens is the only way to capture the split at source. Here the seller is not filing a split sheet — they are getting paid, and the split happens because that is how getting paid works. `meta/personas.md` states the imperative for the Producer's worst accidental behaviour — **"the design must make the lazy path the correct path"** — and this intersection either satisfies it or the product is Jaxsta with a marketplace attached.

**Role scoping**:
- **Musician**: the persona whose entire `Switching Trigger` is this moment failing in the old world — an unpaid session, a credit that went to someone else, a split agreed verbally and unevidenced. Here they see what they gave up, what they kept, and what they were paid, recorded and citable forever.
- **Producer**: `meta/personas.md` calls them "the capture point", and this is the capture. Their "we'll sort it out later" becomes structurally impossible.
- **Operator**: none. Room hire creates and transfers no copyright.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The engagement's terminal state is 05.04's; the rights record is domain 09's; the credit is domain 02's. Three owners, one event. The transfer composes **only from frozen data** (the accepted quote version), so nothing about the deal can change between acceptance and execution.
2. **Trigger chain**: Acceptance → atomic three-leg commit → all or none. **The credit leg is the danger** (05.04.01 DT-02, 05.06.03 DT-01): of the three partial failures, escrow-fails is reported in minutes (it is the seller's rent), rights-fail is reported eventually (at the buyer's first sync request), and credit-fails is reported **never** — both parties got what they came for and the platform's core asset silently lost a record. It is also the leg an implementer is most likely to make asynchronous, because it feels like a notification. It must be a committed leg, and its failure must page a human.
3. **Permission intersection**: The posture elected at listing time (05.06.01) governs what executes here, months later. A sealed engagement (05.02.02) suppresses the credit's *display* but not its *record* — the platform holds it.
4. **Notification fan-out**: Execution reaches both parties in plain language naming all three outcomes, and reaches domains 09 and 10, which will still be acting on this in a decade.
5. **State transition conflict**: **Auto-accept executes a copyright assignment by silence** (05.04.01 DT-01). Several jurisdictions require signed writing for an assignment; an unrebutted timer likely does not satisfy that. The mitigation — escrow on the timer, rights on a signature — breaks the atomicity that *is* the mechanism. Both options are bad. Domain Q-02; needs counsel.

---

### CX-06: Multi-Party Supply ↔ Rights, Warranties & Transfer

**Relationship**: The domain's most dangerous intersection, and the one most likely to be built wrong by a reasonable person. Every shape in 05.05 inserts a party between the money and the labour — a fixer, an agency, a delegating seller, a bundle assembler. The naive model, in every case, credits the engagement's seller of record. It is seductive because it is *consistent*: the buyer paid X, X delivered, credit X.

It also, in the fixer case, records **one credit to a contractor for a twelve-piece string section they may not have played a note of** (05.05.02 DT-01) — automatically, at scale, through the happy path, on exactly the sessions with the most players and the least individual visibility.

That is qualitatively worse than the problem the platform exists to solve. Jaxsta has *gaps*. This would have *lies*, generated by the platform's own delivery flow, landing on the population least able to absorb it: the anonymous section player whose career "exists in fragments" and who most needs proof of work to accumulate.

Hence P-02, and hence the two-layer model (N+1 engagements, N+1 credits) is not a completeness nicety — it is what stops the feature poisoning the well.

**Role scoping**:
- **Musician**: the contracted player. The one who vanishes if this is wrong.
- **Producer**: usually the fixer, agency counterparty or assembler — the party the naive model would credit.
- **Operator**: only via studio assignment (05.05.03).
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The engagement's *seller of record* and the credit's *subject* are different fields with different values, and the entire failure comes from an implementer assuming they are one. Naming that is the point of writing this down.
2. **Trigger chain**: One acceptance → N settlements + N+1 credits. Per 05.05.02 DT-03 the workers must settle **from the same escrow release**, not from the intermediary's cashflow — fixing the fixer profession's oldest failure using the platform's unique position as both rail and record.
3. **Permission intersection**: The intermediary controls *composition* (who is in the section, who is rostered) but must not control *settlement*. Separating those two is the whole mechanism.
4. **Notification fan-out**: Every downstream worker learns of their engagement and their payment from the platform, without asking the fixer. That is the part that changes the relationship, not just the accounting.
5. **State transition conflict**: A downstream engagement disputed while the buyer's acceptance fires. The buyer's release must not be hostage to a fixer-player dispute, but the disputed tranche must be — needing a **per-payee freeze**, not a whole-escrow freeze. `[PENDING]`.

---

### CX-08: Custodial & Physical ↔ Engagement Lifecycle — the deliberate non-relationship

**Relationship**: Recorded as a cross-cut because the *absence* is a design decision a later reader would otherwise undo.

Custodial engagements share the engagement entity and almost nothing else. Count what 05.03's lifecycle offers them: a requirements gate (no — the requirement is a physical object that arrived or did not), a turnaround clock started by that gate (no — it starts at estimate approval), a revision allowance (no — a refret is not iterated), an auto-accept window (no — acceptance is *the guitar coming home*, which no timer can fire), delivery + QC (no — nothing is uploaded), a rights transfer (no — repairing a guitar creates no copyright).

That is not a lifecycle with unused fields. It is a different machine with two coincidental overlaps (an estimate resembles a quote; escrow releases at the end). Forcing them together would be a consolidation that reads as tidy and behaves as a trap — the specific hazard being an implementer wiring auto-accept to a repair, which would pay a workshop for an instrument that never came back.

Custodial work also **inverts the domain's fundamental order**: everywhere else the quote precedes possession; here the seller cannot quote until they hold the thing (05.07.01 DT-01). Everything else in 05.07 follows from that inversion.

**Role scoping**:
- **Musician / Producer**: buyers and sellers of custodial work.
- **Operator**: **Full** — the only sub-domain where they are. The industry's heaviest buyer of technical services and a frequent seller.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The engagement entity is shared; the state machine is not. Whether that is one polymorphic entity or two is an architecture decision, not an ideation one.
2. **Trigger chain**: Independent. No custodial state transitions into a 05.03 state or vice versa.
3. **Permission intersection**: None — but custodial work has a permission nothing else in the domain has: the **approved estimate is a permission to alter someone else's physical property** (05.07.03 DT-03).
4. **Notification fan-out**: Independent.
5. **State transition conflict**: None, by construction — which is the point of recording the separation.

---

### CX-03: Engagement Lifecycle ↔ Delivery & Acceptance — the bounded loop

**Relationship**: The revision limit and the auto-accept window look like a seller-protection feature and a buyer-convenience feature. They are one mechanism with two ends.

Without a revision limit, acceptance never arrives: the buyer can always ask for one more thing, escrow holds indefinitely, the seller works for free. Without auto-accept, the revision limit does not bind: a buyer who simply *does nothing* — neither accepting nor revising — holds the seller's money hostage forever, and no allowance restrains inaction.

Together they bound the engagement at both ends. Every creative marketplace that has one without the other has the corresponding pathology.

**Role scoping**:
- **Musician**: as a seller, the limit lets them decline an out-of-scope request without a confrontation — the platform, not the person, says "that's a change order". This matters more than it sounds: the reason musicians do unpaid revisions is that refusing costs them the relationship.
- **Producer**: most damaged by unbounded revisions (longest engagements, most opinionated clients) and most likely to abuse them as a buyer.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The engagement's terminal state, approached from both ends.
2. **Trigger chain**: Delivery → window opens → revision request pauses it → redelivery restarts it → acceptance or expiry terminates. The **revision-vs-change-order boundary is the taste dispute** (05.03.03 DT-02) and no rule resolves it — but 05.02.01's structured exclusions dissolve most of the volume before it arises, because most disputes are unstated *assumptions* (tuning, stems, an instrumental), not judgements. Invest in exclusions, not adjudication.
3. **Permission intersection**: None.
4. **Notification fan-out**: The auto-accept countdown is the one place the platform should nag hard — the consequence of silence is ownership.
5. **State transition conflict**: A revision request landing at the instant auto-accept fires. Materially different outcomes; precedence undefined. `[PENDING]`.

---

### CX-05: Listings & Pricing ↔ Rights, Warranties & Transfer

**Relationship**: The rights posture is a **priced product attribute**, not a legal footnote. A work-for-hire master costs more than a licence; a points deal costs no cash at all. That means the listing (05.01) and the rights model (05.06) are describing the same decision in two vocabularies — and the `points` model is where the two collapse entirely: it is a pricing model whose payload is a rights term, with zero cash at purchase.

The consequence runs through the whole domain. Because points cannot be escrowed (05.01.03 DT-01), the set of engagements that lack the domain's flagship protection is determined by **which crafts the taxonomy permits points for** (05.01 CX-01). A taxonomy decision silently decides where the escrow mechanism applies.

**Role scoping**:
- **Musician**: sees the posture priced, in plain language, before electing — the one place their "worst accidental" outcome (signing away publishing unknowingly) is prevented or caused.
- **Producer**: elects points routinely; this is their long-term equity.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The posture is declared on the listing, negotiable on the quote, frozen at acceptance. Three touchpoints, one immutable answer at the end.
2. **Trigger chain**: Listing election → quote render → acceptance → execution. A listing cannot publish without an election (05.06.01 D-01) — there is no safe default, because both candidates produce the platform's own stated failure mode (DT-01 in that file).
3. **Permission intersection**: The craft (05.01.02) constrains legal pricing models, which constrains available postures. A taxonomy permission propagates into a rights outcome.
4. **Notification fan-out**: None.
5. **State transition conflict**: A listing's posture changing while a quote derived from it is live. The quote is immutable and honours its snapshot (05.01 CX-06), so no conflict — the immutability rule pays for itself here.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 05.07 Custodial & Physical | 05.06 Rights, Warranties & Transfer | Considered whether custodial work carries rights consequences. It does not — repairing a guitar creates no copyright and no transfer occurs. The one adjacency (a repair permanently alters an instrument and may destroy its value) is a *value* question for domain 15, not a rights question for 05.06. Clean independence. |
| R-02 | 05.01 Listings & Pricing (benchmarking) | 05.04 Delivery, QC & Acceptance | No shared state, no trigger dependency. Market rate data does not affect delivery; delivery outcomes feed benchmarking only via accepted-engagement *prices*, which is a 05.01-internal relationship (05.01 CX-02). |
| R-03 | 05.07 Custodial & Physical | 05.05 Multi-Party Supply | Considered: can a luthier subcontract a refret, or a fixer assemble a repair team? Theoretically yes; in practice custodial work has no dep, ensemble or bundle concept — the whole point is that *this* tech, whom you chose, has your instrument. Rejected until evidence. |
| R-04 | 05.02 Quotes & Contracting (union) | 05.07 Custodial & Physical | Union scale covers performers, not techs. A luthier is not on an AFM session rate card. No interaction. |
| R-05 | 05.07 Custodial & Physical | 05.04 Delivery, QC & Acceptance | Considered whether a returned instrument is a "delivery" that could be QC'd. Rejected — no file, no spec, nothing to analyse. The equivalent check is the **return condition record** (05.07.03), a different mechanism with a different evidentiary basis (mutual photographs, not DSP). |
| R-06 | 05.02 Quotes & Contracting | 05.02 Quotes & Contracting (competing quotes / tender) | Considered a comparison view of multiple sellers' quotes for one job. Rejected as **out of domain** — buyer-initiated briefs where many respond and one is selected is the post→submit→triage→decide workflow the domain map explicitly moved to **Opportunities & Casting (04)**. Building it here would rebuild 04. |

---

## Cross-Cut Mechanisms This Domain Consumes

> Per `/ideate-discover` Step 3: mechanisms serving many domains are not nodes here. Recorded so downstream readers see the dependencies, and so the global CX file can absorb the new demands this drilling surfaced.

| Mechanism | What this domain needs from it | New demand this drilling surfaced |
|---|---|---|
| **Payments, Escrow & Payouts** | Escrow with lifecycle-driven release triggers; ~15-20% services take rate; multi-party split settlement | **Four new demands.** (1) A **zero-rated expense line type** — travel/per-diem/cartage must not carry commission (05.01.05 DT-02). (2) A **fee stack**, not a single rate — platform take + agency commission compound invisibly to ~60-75% net for a rostered player (05.05.03 DT-02). (3) **Escrow payee change mid-engagement** for deps (05.05.01). (4) **Per-payee freeze** rather than whole-escrow freeze when one downstream worker disputes (CX-06). Also: the cross-cut's release-trigger model assumes a payment event at vesting — **points-only and retainer deals have none** (domain Q-01). |
| **Atomic Payment ↔ Rights Transfer** | The three-leg acceptance commit | **This domain is the cross-cut's primary trigger site.** Hard requirement: the **credit-emission leg must be a committed leg**, never async (CX-04) — it is the only failure no human would ever report. Open exposure: auto-accept may make the rights leg legally softer than the money leg (domain Q-02). |
| **Contracts & E-Signature** | Quote/NDA/union/retainer instruments; templating, redlining, signature, versioning, tamper-evident archive | For **points-only deals the instrument is the entire protection** — there is no escrow (05.06.02 DT-01). Jurisdiction-awareness is load-bearing: "work for hire" is a US statutory term that does not port (05.06.01 DT-03). |
| **Media Handling & Audio Playback** | Demo reels, resumable multi-GB transfer, timestamped-comment player, loudness analysis, watermarking, signed expiring URLs, duration measurement | **Hard stack collision.** The cross-cut names watermarking and loudness normalization as its own capabilities; `meta/constraints.md` locks Cloudflare Workers, which cannot execute either over full-length multitracks. QC and watermarking both blocked (domain Q-06). Note the DSP cost is **per-revision-round**, not per-engagement. |
| **Availability, Scheduling & Reservation** | On-location dates; atomic decrement for waitlist races; custodial appointments | **Does not model queue depth.** It is calendar-shaped by design (perishable time — the Operator's constraint). Async creative work has concurrency, not slots (05.01.07 DT-01), which is why 05.01.07 exists. Unresolved: a seller selling both remote and on-location has two scarcity models against one body (05.01 CX-04). |
| **Canonical Data, Taxonomy & Entity Resolution** | Genre and instrument facets; union scale tables; deliverable spec templates | This domain owns the **craft** axis only (05.01.02 D-02). Scale tables and loudness targets both have an unsolved **refresh** problem — a stale value is worse than none, because the platform's number gets trusted (05.02.03 Q-01, 05.04.02 Q-02). |
| **Reviews, Ratings & Portable Reputation** | Per-role reputation on listings; fact-derived signals | This domain generates the cross-cut's **best fact-derived signals**: SLA met/breached, abandonment, recall responsiveness. Per-role is mandatory here — the multi-hyphenate's mixing rating must not contaminate their luthiery. |
| **Search & Discovery** | Faceted browse, ranking, relaxation | **Capacity as a ranking input** (05.01.07). Unresolved: ranking a full seller wastes the impression; ranking them down punishes success. Also: **never rank by price ascending** — that, not published benchmarks, is what causes the Fiverr race to the bottom (05.01.04 DT-01). |
| **Subscriptions & Entitlements** | Retainer billing — recurring charge, proration, dunning, lapse | Engine there, **drawdown here** (05.03.04 D-01). An entitlement is a boolean; a retainer allowance is a meter in music units ("4 of 6 mixes, 11 days left"). |
| **Shipping, Fulfilment & Logistics** | Two-way custodial movement, insurance to declared value, carrier liability windows | The domain map extracted this cross-cut citing **"two-way custodial repair intake"** as one of its four justifications. 05.07 is that use case. |
| **Audit Log & Provenance Ledger** | Engagement state history; gated-material access; warranty declarations; accepted-vs-auto-accepted; the custody chain | **The evidentiary substance of four features.** A warranty not permanently attributable to a person and a date is worth nothing (05.06.04 D-04); a watermark identifies nobody without the access log; a custody chain is worth what its immutability is worth. |
| **Messaging & Contextual Inbox** | Negotiation threads anchored to a quote version; revision notes | Constraints: **the chat is not the scope of record** (05.02 D-03), and notes must batch into rounds (05.03.03 DT-03). |
| **Notifications & Alerts** | Auto-accept countdown; abandonment notice; emergency cover; window expiry | Two are load-bearing rather than informational: the **escalating abandonment notice** is what makes an automatic settlement legitimate rather than a confiscation (05.03.05 D-04), and at 3 hours' notice **the notification *is* the emergency-cover feature**. |
| **Localization, Currency & Timezone** | Multi-currency; working days; due dates; jurisdiction | "5 working days" is not a portable promise (05.01.06 D-03). Rights posture semantics vary by jurisdiction (05.06.01 DT-03). Union structures are mostly US/UK. |
| **Privacy, Consent & Data Portability** | k-anonymity for rate aggregation; DSAR against sealed credits | Genuine tension: a **sealed credit** is personal data the subject asked to hide and the platform deliberately holds (05.02.02 Q-04). |
| **Roles, Permissions & Delegated Authority** | Agency acting for a player at every call site | Domain 01 owns the mandate; this cross-cut enforces it. |
| **Analytics Instrumentation & Per-Domain Reporting** | Benchmark aggregation pipeline | 05.01.04 owns the **placement** (the band rendered inside the pricing step); the cross-cut owns the pipeline. A benchmark on a dashboard nobody opens changes no rates. |
| **Public SEO Surfaces & Embeds** | Category pages, public listings | The domain's primary organic acquisition surface, and the reason Fan has read access to 05.01 at all. |
| **Geo, Location & Map Discovery** | Travel radius, addresses, inspector proximity | Coverage is the practical ceiling on 05.07.02. |
| **Offline & Low-Connectivity Field Resilience** | Condition capture at a workbench; on-location work | Domain Q-09 — the custodial workflow is a phone in a workshop, another argument for the open mobile-surface question in `meta/constraints.md`. |
| **Safeguarding & Minor Protection** | Contracting capacity where a party is under 18 | 05.02.01 edge case, unresolved. |
| **DAW & Desktop Bridge** | Session-format awareness, plugin manifests | Routed to not-product as a hard constraint by the domain map (implies a desktop surface `single-surface` does not cover). 05.04.04 depends on it softly. |

### Candidate routed OUT of this domain to a cross-cut

| Candidate | Routed to | Why |
|---|---|---|
| **13 — Escrow with Music Milestone Semantics** | **Payments, Escrow & Payouts** | The cross-cut explicitly owns "escrow with defined release triggers" and names services-marketplace among the twelve domains it serves. What is domain-owned is the *definition* of those triggers — acceptance (05.04.01), auto-accept (05.04.01), milestone signoff (05.03.02), cancellation settlement (05.03.05) — not the engine. A node here would rebuild a mechanism serving twelve domains, which is exactly the anti-pattern the Node Classification Gate exists to catch. The "music milestone semantics" that made it look domain-specific turn out to live entirely in the trigger definitions, which are already nodes. |
