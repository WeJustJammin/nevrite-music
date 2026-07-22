# Services Marketplace — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Services Marketplace](./services-marketplace-index.md)
> **Status**: [DEEP] — 7 sub-domains, deepening pass complete; intra-domain cross-cuts synthesised with contradictions, omissions and naming defects resolved.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | A quote renders and snapshots a listing's pricing model against a real job. The listing is a template; the quote is an immutable offer. | Musician, Producer, Operator | High | 05.01.01 D-01, 05.02.01 D-02. Immutability removes the "seller raised their rate mid-job" dispute class entirely. |
| CX-02 | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | Acceptance creates the engagement; the accepted quote version is its **scope of record** — carrying not only price/scope but the requirement checklist, kill-fee schedule, anonymity level and milestone structure. | Musician, Producer | High | 05.02 D-03, 05.03.01 D-05. Every dispute resolves back to it. Omission closed this pass: kill fee (05.03.05 D-05), anonymity (05.02.02 D-04) and milestones (05.03.02) are quote-carried terms the breadth pass dropped. |
| CX-03 | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | The revision limit and the auto-accept window are **two halves of one mechanism**. | Musician, Producer | High | 05.03.03 DT-01, 05.04.01 D-03. The limit bounds the seller's exposure; auto-accept bounds the buyer's inaction. Neither works alone. |
| CX-04 | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | **Delivery acceptance is the atomic three-way commit**: escrow release + rights transfer + credit emission. | Musician, Producer | High | 05.04.01 DT-02, 05.06.03 D-01. **The domain's thesis executing.** Everything else exists to deliver two consenting parties here. |
| CX-05 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | Rights posture is declared and priced **per tier** on the listing; the `points` pricing model has no cash and exists only as a rights term. | Musician, Producer | High | 05.01.01 D-02 (per-tier, not per-listing), 05.01.03 DT-01, 05.06.02 DT-01. Price and posture are one decision seen twice. |
| CX-06 | [05.05 Multi-Party Supply](./05.05-multi-party-supply/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | Rights and credits must reach the humans who did the work, not the contracting party. | Musician, Producer | High | 05.05.02 DT-01 (the vanishing string section), 05.06.01 DT-02. Domain principle P-02. |
| CX-07 | [05.05 Multi-Party Supply](./05.05-multi-party-supply/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | A dep substitution mutates a live engagement's counterparty — escrow payee, credit subject and rights assignor all change mid-flight — and the substitute **inherits the checklist frozen at acceptance**, not their own listing's template. | Musician, Producer, Operator | High | 05.05.01 Behavior, 05.03.01 D-05. Otherwise a substitution silently re-gates the buyer against terms they never accepted. |
| CX-08 | [05.07 Custodial & Physical](./05.07-custodial-physical-services/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | **Custodial work does NOT use the engagement lifecycle** — different state machine, shared entity, inverted order (possession precedes the quote). | Musician, Producer, Operator | High | 05.07.01 DT-01/DT-03, 05.07 D-02. Seven of the lifecycle's states are nonsense for a repair. |
| CX-09 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | Turnaround is declared on the listing; its clock is **started by the requirements gate** (the gate pass IS the clock's start event). A buyer-declared `date` gate item cannot silently re-date the committed due date — the mismatch surfaces at the gate. | Musician, Producer | High | 05.01.06 D-01, 05.03.01 D-02. Domain principle P-03. |
| CX-10 | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | The NDA gates the buyer's material going in; watermarking protects the seller's draft coming out. Ghost anonymity then suppresses the credit acceptance emits. | Musician, Producer | High | 05.04.03 DT-02 (the mirror), 05.02.02 DT-01 (the suppression). Same window, opposite directions. |
| CX-11 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.05 Multi-Party Supply](./05.05-multi-party-supply/) | Whether a listing's seller is a **person or an entity** determines the consent rule for substitution. | Musician, Producer, Operator | High | 05.05.03 DT-01 refines 05.05.01 DT-02. Same unanswered question as 05.01 Q-02, from a second direction. |
| CX-12 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | **Capacity ceiling vs immutable offer** — the two collide at acceptance. Capacity (05.01.07) is a hard concurrency cap; an issued quote (05.02.01) is a live offer. The ceiling CANNOT block acceptance of an already-issued offer. | Musician, Producer, Operator | High | DT-04 contradiction found. 05.01.07 D-01 vs 05.02.01 D-02. Resolved: the cap gates quote *issuance*, not acceptance. |
| CX-13 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | **A contracted retainer rate is PINNED against rate-card bulk mutation.** A rate card that silently repriced a live retainer client would breach a contract from a UI with no confirmation step. | Musician, Producer | High | DT-07. 05.03.04 exposes a pinned-rate flag; the rate card's blast radius must exclude it. |
| CX-14 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | **Structured exclusions drawn from the add-on/deliverable vocabulary are what let a change order be generated MECHANICALLY** when a buyer requests an excluded item. Free-text exclusions are unparseable. | Musician, Producer | High | DT-06/D-07. The listing's typed add-on vocabulary (05.01.01) is the source; 05.03.03 is the consumer that prices the change order. |
| CX-15 | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | [05.06 Rights, Warranties & Transfer](./05.06-rights-warranties-transfer/) | **The buyer's INPUT material is unwarranted** — 05.06.04 warrants the seller's deliverable, but an uncleared sample entering at the requirements gate gets mixed and acceptance permanently writes the producer's credit onto an infringing master. | Musician, Producer | High | Gap closed. 05.03.01 clearance acknowledgement (D-09) + 05.06.04. The buyer's clearance acknowledgement is the missing warranty on the input side. |
| CX-16 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | **Union scale is a floor on the rendered fee** — the ONLY place a seller's own rate is overridden — and overtime is computed from *actual* session length, impossible against a day rate that never declared its span. | Musician, Producer, Operator | Medium | 05.01.03 (scale floor) ↔ 05.02.03 DT-02 (overtime from session length). Reciprocal dependency. |
| CX-17 | [05.02 Quotes & Contracting](./05.02-quotes-scope-contracting/) | [05.03 Engagement Lifecycle](./05.03-engagement-lifecycle/) | **The trial / test-mix scope** — the industry's near-universal de-risking mechanism, absent from the breadth model — is expressed as a milestone-staged engagement whose milestone 1 carries a bounded trial deliverable. | Musician, Producer | Medium | DT-10. 05.02.01 places a new requirement on 05.03.02 (milestones). |
| CX-18 | [05.01 Listings & Pricing](./05.01-service-listings-pricing/) | [05.04 Delivery, QC & Acceptance](./05.04-delivery-qc-acceptance/) | Source-file / session handover terms are declared **per tier** and are ORTHOGONAL to rights posture — a common add-on, never implied by ownership. | Musician, Producer | Medium | 05.01.01 D-03/D-07, 05.04.04 DT-03, 05.06.01 D-04. The add-on vocabulary makes the orthogonality mechanical. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** `services-marketplace-cx.md#CX-04`

---

## Domain Principles Discovered During Drilling

Rules that emerged independently in multiple sub-domains. Each is recorded once here, because a rule reached from several directions is a property of the domain rather than of a feature.

### P-01 — The platform makes claims attributable; it does not verify them

Reached by 05.04.02 DT-01 (QC checks a spec, never quality), 05.06.04 DT-02 (sample detection produces confident false clearances), and 05.06.05 DT-03 (AI detection produces career-level false accusations). In every case the tempting technical fix would create an **implicit assurance the platform cannot honour**, and the first dispute would cite it.

The platform's real verification mechanism is social, not technical: **domain 02's counter-attestation** (the **Verified-Credit-as-Evidence** differentiator). The people who were in the room are much harder to fool than a classifier — a structural advantage no competitor without a credit graph can copy.

Design consequence: every badge, label and status in this domain says the smaller true thing. "The seller declared", never "the platform confirmed".

### P-02 — The credit follows the hands

Reached by 05.05.01 DT-01 (the dep is credited, not the booked seller), 05.05.02 DT-01 (N+1 credits, not one to the fixer), 05.05.03 D-02 (not the agency, not the delegator), and 05.06.01 DT-02 (work-for-hire transfers economics, not authorship).

A model that got the payment chain right and the credit chain wrong would pass every test anyone would think to run — both parties paid, engagement green, nobody complains — while fabricating entries in the asset the credit graph exists to protect. This is why 05.05 exists as a unit rather than four scattered commercial conveniences.

### P-03 — No clock runs against a party until the counterparty has done their bit

Reached by 05.01.06 DT-01 (turnaround starts at the requirements gate, not at purchase) and 05.04.02 DT-02 (QC gates delivery, so the auto-accept clock never starts on an invalid file). Same principle, both directions, discovered separately in unrelated sub-domains.

Every marketplace that starts the clock at checkout makes its own SLA a lie, and sellers respond by padding turnaround until the attribute is meaningless.

### P-04 — "Acceptance" names two distinct events and the domain must never conflate them

Reached by 05.02.01 DT-13 (naming defect), 05.04.01 (auto-accept), 05.01.03 DT-05 (the overloaded "reconcile"), and 05.06.03. **Quote acceptance** creates the engagement and *captures* escrow; **delivery acceptance** (including auto-accept by silence) *releases* escrow and fires the rights/credit commit. Six-plus features use the bare word "acceptance" and none says which.

The failure mode is concrete: reading 05.01.03's "reconcile at acceptance" as *quote* acceptance silently re-prices a frozen contract and destroys the scope-of-record mechanism; reading it as *delivery* acceptance is correct. Every spec, schema field and notification must qualify the word.

---

## Cross-Cut Details

### CX-04: Delivery & Acceptance ↔ Rights, Warranties & Transfer

**Relationship**: The domain's centre of gravity. Delivery acceptance fires one indivisible transaction across three systems: escrow releases (**Payments, Escrow & Payouts** cross-cut, which delegates the split math to the **Split-Capture Trigger**), the rights posture executes into domain 09, and the credit emits into domain 02 at its elected visibility. This is the domain rationale — *"binding rights transfer and split execution to escrow release — the only leverage that exists at the only moment anyone is motivated"* — implemented or not.

**Role scoping**:
- **Musician**: the persona whose entire switching trigger is this moment failing in the old world — an unpaid session, a credit that went to someone else, a split agreed verbally and unevidenced. Here they see what they gave up, what they kept, and what they were paid, recorded and citable forever.
- **Producer**: the capture point. Their "we'll sort it out later" becomes structurally impossible.
- **Operator / Fan**: none. Room hire and fandom create and transfer no copyright.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The engagement's terminal state is 05.04's; the rights record is 09's; the credit is 02's. Three owners, one event. The transfer composes **only from frozen data** (the accepted quote version), so nothing about the deal can change between acceptance and execution — no merge is possible because no concurrent write is legal.
2. **Trigger chain + failure/sync**: Delivery acceptance → atomic three-leg commit → all or none, synchronous. **The credit leg is the danger** (05.04.01 DT-02, 05.06.03 DT-01): escrow-fails is reported in minutes (it is the seller's rent), rights-fail is reported eventually (at the buyer's first sync request), and credit-fails is reported **never** — both parties got what they came for and the platform's core asset silently lost a record. It is also the leg an implementer is most likely to make async because it feels like a notification. It must be a committed leg via the Split-Capture Trigger, and its failure must page a human.
3. **Permission intersection**: The posture elected per tier at listing time (05.06.01, CX-05) governs what executes here, months later. A sealed engagement (05.02.02) suppresses the credit's *display* but not its *record* — the platform holds it.
4. **Notification fan-out**: Execution reaches both parties in plain language naming all three outcomes, and reaches domains 09 and 10, which will still be acting on this in a decade. The **Notifications & Alerts** mechanism must not fire credit-confirmation and payment-release as two events (they are adjacent — 02.02.03 Q-02).
5. **State-transition race**: **Auto-accept executes a copyright assignment by silence** (05.04.01 DT-01). Several jurisdictions require signed writing for an assignment; an unrebutted timer likely does not satisfy it. The mitigation — escrow on the timer, rights on a signature — breaks the atomicity that *is* the mechanism. Domain Q-02; needs counsel.

---

### CX-06: Multi-Party Supply ↔ Rights, Warranties & Transfer

**Relationship**: The domain's most dangerous intersection, and the one most likely to be built wrong by a reasonable person. Every shape in 05.05 inserts a party between the money and the labour — a fixer, an agency, a delegating seller, a bundle assembler. The naive model credits the engagement's seller of record. In the fixer case it records **one credit to a contractor for a twelve-piece string section they may not have played a note of** (05.05.02 DT-01) — automatically, at scale, through the happy path, on exactly the sessions with the most players and least individual visibility. That is qualitatively worse than the problem the platform exists to solve: not gaps but *lies*, landing on the population least able to absorb them.

**Role scoping**:
- **Musician**: the contracted player. The one who vanishes if this is wrong.
- **Producer**: usually the fixer, agency counterparty or assembler — the party the naive model would credit.
- **Operator**: only via studio assignment (05.05.03).
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The engagement's *seller of record* and the credit's *subject* are different fields with different values, and the entire failure comes from an implementer assuming they are one. Naming that is the point.
2. **Trigger chain + failure/sync**: One acceptance → N settlements + N+1 credits. Per 05.05.02 DT-03 the workers settle **from the same escrow release** (Split-Capture Trigger fan-out), not from the intermediary's cashflow — fixing the fixer profession's oldest failure using the platform's position as both rail and record.
3. **Permission intersection**: The intermediary controls *composition* (who is in the section) but must not control *settlement*. Separating those two is the whole mechanism.
4. **Notification fan-out**: Every downstream worker learns of their engagement and payment from the platform, without asking the fixer. That is the part that changes the relationship, not just the accounting.
5. **State-transition race**: A downstream engagement disputed while the buyer's acceptance fires. The buyer's release must not be hostage to a fixer-player dispute, but the disputed tranche must be — needing a **per-payee freeze**, not a whole-escrow freeze. `[PENDING]`.

---

### CX-08: Custodial & Physical ↔ Engagement Lifecycle — the deliberate non-relationship

**Relationship**: Recorded as a cross-cut because the *absence* is a design decision a later reader would otherwise undo. Custodial engagements share the engagement entity and almost nothing else: no requirements gate (the requirement is a physical object that arrived or did not), no turnaround clock started by that gate (it starts at estimate approval), no revision allowance (a refret is not iterated), no auto-accept window (acceptance is *the guitar coming home*, which no timer can fire), no delivery+QC upload, no rights transfer. That is a different machine with two coincidental overlaps (an estimate resembles a quote; escrow releases at the end). Custodial work also **inverts the domain's fundamental order**: everywhere else the quote precedes possession; here the seller cannot quote until they hold the thing (05.07.01 DT-01).

**Role scoping**:
- **Musician / Producer**: buyers and sellers of custodial work.
- **Operator**: **Full** — the only sub-domain where they are. The industry's heaviest buyer of technical services and a frequent seller.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Both use the engagement entity, but the custodial state machine owns its own transitions. No merge — they never write the same lifecycle fields.
2. **Trigger chain + failure/sync**: Estimate approval starts the clock; custody events (received / diagnosed / repaired / returned) drive it. The specific hazard is an implementer wiring auto-accept to a repair, which would pay a workshop for an instrument that never came back.
3. **Permission intersection**: Custody-chain and liability (05.07.03) add an Operator-owned permission surface the rest of the domain lacks.
4. **Notification fan-out**: Damage claims and custody transfers notify differently from deliverable acceptance.
5. **State-transition race**: The inversion (possession before quote) means P-03 manifests as "no estimate until possession".

---

### CX-12: Capacity Ceiling ↔ Immutable Offer — the acceptance collision

**Relationship**: A genuine contradiction surfaced by the deepening pass (DT-04). 05.01.07 D-01 makes seller capacity a **hard concurrency ceiling**; 05.02.01 D-02 makes an issued quote an **immutable live offer**. They collide at acceptance: if the ceiling blocks acceptance, a seller who issued three quotes and had two accepted could leave the third buyer holding an offer they are told they cannot take — the exact bad faith the immutability rule exists to prevent.

**Role scoping**:
- **Musician / Producer**: seller (owns the capacity setting) and buyer (holds the offer).
- **Operator**: same, for custodial / on-location capacity.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Capacity count is owned by 05.01.07; the quote is owned by 05.02.01. The count is advisory at the acceptance boundary — it gates *issuance*, never acceptance of an already-issued offer.
2. **Trigger chain + failure/sync**: Acceptance of a live offer always succeeds and increments the accepted-engagement count; issuance of a *new* quote is what the ceiling blocks. Failure surfaces at issuance ("you're at capacity"), never at the buyer's acceptance.
3. **Permission intersection**: Neither party can be denied the transaction they were already offered.
4. **Notification fan-out**: The seller is warned at issuance when near capacity; the buyer never sees a capacity-related block.
5. **State-transition race**: DT-08 (05.03.01) — a stalled gate consumes a capacity slot for an uncommitted party with no escrow to settle against, worse than the ordinary case; hence the gate must terminate (D-12) and pre-payment staging (DT-10) is refused.

---

### CX-13: Rate Card ↔ Retainers — the pinned rate

**Relationship**: DT-07. A rate card is bulk-mutable (a seller raises all their prices at once). A retainer (05.03.04) is a *contracted* recurring rate. A bulk edit that silently repriced a live retainer client would breach a contract from a UI with no confirmation step and no obvious link to the harm.

**Role scoping**: Musician / Producer — seller (edits the card) and retained buyer (protected). Operator / Fan — none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The rate card (05.01.01) owns list price; the retainer (05.03.04) owns a pinned copy. On a bulk mutation, the pinned copy wins — the retainer exposes a pinned-rate flag and the card's blast radius must exclude any listing under an active retainer.
2. **Trigger chain + failure/sync**: A card edit must enumerate its downstream retainers *before* committing and either exclude them or force an explicit change-order path.
3. **Permission intersection**: The seller cannot unilaterally reprice a contracted client; that requires the retainer's own amendment flow.
4. **Notification fan-out**: If a card edit would touch a retainer, the seller is warned before commit.
5. **State-transition race**: Concurrent card edit and retainer billing cycle — the pin resolves it deterministically in the retainer's favour.

---

### CX-14: Add-on Vocabulary ↔ Change Orders — mechanical exclusions

**Relationship**: DT-06/D-07. The value of a *structured* exclusion (drawn from the listing's typed add-on and deliverable vocabulary) is that when a buyer requests something excluded, 05.03.03 generates a **priced change order mechanically** — the excluded item already has a price because it is a known add-on. Free-text exclusions ("full mix, professional results") are unparseable and produce nothing but disputes.

**Role scoping**: Musician / Producer — seller (defines the vocabulary) and buyer (requests the extra). Operator / Fan — none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The add-on vocabulary is owned by the listing (05.01.01); the change order is owned by 05.03.03 and priced against the frozen scope of record.
2. **Trigger chain + failure/sync**: Buyer requests excluded item → system matches it to a vocabulary add-on → generates a priced change order synchronously. If the item is not in the vocabulary, it falls back to a manual quote amendment.
3. **Permission intersection**: Only the buyer can accept the change order; only the seller's listing defines what an add-on costs.
4. **Notification fan-out**: A generated change order notifies the buyer with a price and an accept/decline.
5. **State-transition race**: A change order accepted while a revision is in flight — the change order re-baselines the scope of record for subsequent revisions.

---

### CX-15: Requirements Gate ↔ Sample & Originality Warranty — the unwarranted input

**Relationship**: A gap the deepening pass closed. 05.06.04 warrants the **seller's deliverable**; nothing warranted the **buyer's input material**. An uncleared sample enters at the requirements gate (05.03.01 DT-06), gets mixed into the work, and delivery acceptance permanently writes the producer's credit onto an infringing master — an infringement the platform's own flow manufactured.

**Role scoping**: Musician / Producer — the producer whose credit lands on the infringing master is the primary victim. Operator / Fan — none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The clearance acknowledgement (05.03.01 D-09) is a buyer-side warranty on chain of title of the input, mirroring 05.06.04's seller-side warranty on the output. Both attach to the frozen scope of record.
2. **Trigger chain + failure/sync**: The gate captures the buyer's clearance acknowledgement before the seller starts. A repeatedly-false acknowledgement (input later found infringing) escalates to 24 as a pattern.
3. **Permission intersection**: The buyer supplies and warrants the input; the seller warrants their added work — neither warrants the other's contribution.
4. **Notification fan-out**: An infringement claim on a delivered master notifies both parties and 09 (chain of title is now dirty upstream of everything 09 records).
5. **State-transition race**: A clearance dispute raised after delivery acceptance — acceptance already made the record permanent (P-01: the platform recorded the claim, it did not verify it), so the remedy runs through 24 + 09, not by unwinding the commit.

---

### CX-16: Union Scale ↔ Session Contracting — the fee floor (Medium)

05.01.03's pricing library must express union scale as a **floor** on the rendered fee — the only place a seller's own rate is overridden — and 05.02.03's DT-02 computes overtime from *actual* session length, impossible against a day rate that never declared its span. A reciprocal dependency: pricing needs the scale table; contracting needs the pricing model to carry a declared session span. Owner — 05.01.03 owns the rendered fee, 05.02.03 owns the contract terms; the scale floor applies at render, overtime at settlement. Race — a session running long triggers overtime the frozen quote must have anticipated via a declared span, else it is a change order (CX-14).

---

### CX-17: Trial / Test-Mix as Milestone (Medium)

The industry's near-universal de-risking mechanism (a paid trial before committing to the full engagement) was absent from the breadth model. Expressed as a milestone-staged engagement (05.03.02) whose milestone 1 carries a bounded trial deliverable at a fraction of the fee, with the buyer's decision to proceed gating milestone 2. Owner: 05.02.01 places the requirement, 05.03.02 owns the milestone machinery.

---

### CX-18: Source-File Handover as Orthogonal Add-on (Medium)

Handover terms (stems, session files) are declared **per tier** and are orthogonal to rights posture (05.04.04 DT-03 / 05.06.01 D-04): owning the master does not imply receiving the session, and receiving the session does not imply owning the master. The add-on vocabulary (CX-14) makes this a mechanical line item rather than a warning banner.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 05.04 Delivery, QC & Acceptance | 05.07 Custodial & Physical | Custodial work uploads nothing and runs no auto-accept — QC is meaningless for a physical repair. The non-relationship is documented at CX-08; no separate QC cross-cut exists. |
| R-02 | 05.02 Quotes & Contracting | 05.07 Custodial & Physical | Custodial estimates are not quotes (possession precedes the estimate, inverting the order). Shared vocabulary, distinct lifecycle. |
| R-03 | 05.06 Rights, Warranties & Transfer | 05.07 Custodial & Physical | Repairing an instrument creates no copyright; the rights machinery has no custodial counterpart. |
| R-04 | 05.04.03 Watermarked Previews | 05.01.04 Rate Benchmarking | Watermarking protects a specific draft; benchmarking is aggregate price intelligence. No shared state, no trigger dependency. |
| R-05 | 05.05 Multi-Party Supply | 05.07 Custodial & Physical | No fixer/agency/subcontracting shape applies to a single-luthier repair; multi-party supply is a music-work concept. Independent lifecycles. |
| R-06 | 05.01.04 Rate Benchmarking | 05.06 Rights, Warranties & Transfer | The benchmark band renders only in the seller's pricing step (05.01.04 D-01) and never touches posture election. Deliberately kept apart (sub-domain CX R-04). |

> **Notes for agents:**
> - CX entries connect the seven **sub-domains** of this domain to each other. Feature-level detail lives in each sub-domain's own CX file.
> - CX-01 / CX-12 / CX-16 all connect 05.01 ↔ 05.02 but are distinct mechanisms (snapshot, capacity race, union floor) — kept separate deliberately.
> - The four domain principles (P-01..P-04) are reached from multiple sub-domains and are properties of the domain, not of any feature.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-12|D-12]]
