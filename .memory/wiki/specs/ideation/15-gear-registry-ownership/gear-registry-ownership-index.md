# Gear Registry & Ownership — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-23
> **Novelty**: `whitespace` | **Priority**: `important`

## Overview

A persistent identity for every individual instrument and piece of gear that outlives any transaction — serials, ownership chain, service history, theft status, valuation, insurance schedules, and the records it played on.

**Why this is a top-level domain**: Proposed independently by four lenses and unrefuted by all three adversaries. Not a marketplace sub-domain because it exists with no transaction: musicians register gear they will never sell, and it serves insurance schedules, tour carnets, studio asset registers, stolen-gear recovery and rig compatibility. Reverb's My Collection and Discogs' Collection prove the retention behaviour; Carfax is the strategic model — every transaction enriches a record that makes the next one safer and better-priced. The stolen-gear registry is the highest-goodwill unserved need in the corpus: van and venue theft is endemic, existing registries are fragmented and unchecked at the point of sale, and only a platform that is also the marketplace can check a serial at listing time. Gear discography (this Telecaster played on these eleven records) is impossible for Reverb (no sessions) and for a credits database (no gear identity) — it exists only where both live together, which is the clearest proof this is not a marketplace feature.

**Interacting capabilities** (what justifies domain status):

- serial-keyed instrument identity
- ownership & provenance chain
- stolen registry & recovery
- service/mod history
- valuation & insurance schedules
- rig profile & compatibility

**How this domain expresses the thesis** (D-18: *provenance is the wedge, consolidation is the platform*): three of its capabilities exist **only** because WeJammin is also the marketplace and also the credits graph. Point-of-sale serial screening (15.02.02) is impossible for a registry that isn't a marketplace — which is precisely why every existing stolen-gear registry fails. Gear discography (15.09) is impossible without both gear identity and session credits. Witnessed ownership transfer (15.01.03) only exists because the sale happens here. Consolidation is the precondition; the accreting record is what compounds. This domain is the thesis restated with objects in place of songs.

## Children

> 10 children classified through the Node Classification Gate: **5 sub-domains** (folders with index + CX)
> and **5 features** (leaf files). 21 leaf features total. All `[SURFACE]` pending Step 5 deepening.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 15.01 | Instrument Identity & Provenance | sub-domain | [15.01-instrument-identity-provenance/](./15.01-instrument-identity-provenance/) | `[BREADTH]` | 19 hypotheses (6 features) |
| 15.02 | Stolen Gear Registry & Recovery | sub-domain | [15.02-stolen-gear-registry-recovery/](./15.02-stolen-gear-registry-recovery/) | `[BREADTH]` | 13 hypotheses (4 features) |
| 15.03 | Service, Repair & Modification History | feature | [15.03-service-repair-modification-history.md](./15.03-service-repair-modification-history.md) | `[SURFACE]` | 4 hypotheses |
| 15.04 | Gear Collection & Visibility | feature | [15.04-gear-collection-visibility.md](./15.04-gear-collection-visibility.md) | `[SURFACE]` | 4 hypotheses |
| 15.05 | Valuation, Appraisal & Insurance | sub-domain | [15.05-valuation-appraisal-insurance/](./15.05-valuation-appraisal-insurance/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 15.06 | Rig Profile & Compatibility | sub-domain | [15.06-rig-profile-compatibility/](./15.06-rig-profile-compatibility/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 15.07 | Studio & Backline Asset Register | sub-domain | [15.07-studio-backline-asset-register/](./15.07-studio-backline-asset-register/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 15.08 | Custody, Loans & Consignment | feature | [15.08-custody-loans-consignment.md](./15.08-custody-loans-consignment.md) | `[SURFACE]` | 4 hypotheses — **Deep Think addition** |
| 15.09 | Gear Discography | feature | [15.09-gear-discography.md](./15.09-gear-discography.md) | `[SURFACE]` | 4 hypotheses |
| 15.10 | Cases, Manifests & Carnet Source Data | feature | [15.10-cases-manifests-carnet-source-data.md](./15.10-cases-manifests-carnet-source-data.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

**Cross-cuts**: [gear-registry-ownership-cx.md](./gear-registry-ownership-cx.md) — 10 confirmed pairs, 5 rejected, 5 mechanisms escalated to the platform level.

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 15.01 Instrument Identity & Provenance | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 15.02 Stolen Gear Registry & Recovery | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 15.03 Service, Repair & Modification History | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 15.04 Gear Collection & Visibility | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 15.05 Valuation, Appraisal & Insurance | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 15.06 Rig Profile & Compatibility | ✅ Full | ✅ Full | 👁️ Read-only | ❌ None |
| 15.07 Studio & Backline Asset Register | 👁️ Read-only | ⚙️ Config | ✅ Full | 👁️ Read-only |
| 15.08 Custody, Loans & Consignment | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 15.09 Gear Discography | ⚙️ Config | ✅ Full | ⚙️ Config | 👁️ Read-only |
| 15.10 Cases, Manifests & Carnet Source Data | ✅ Full | 👁️ Read-only | ✅ Full | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> Persona definitions live in [meta/personas.md](../meta/personas.md) — referenced, never redefined here.
> Per-role behaviour is in each feature file's **Role Lens**.

**Reading the matrix — two findings worth downstream attention:**

1. **Musician and Producer are near-identical across this domain.** Both are gear owners registering
   objects, and the multi-hyphenate fact (personas.md) means they are frequently the same human. The
   distinction bites in exactly two places, and both are load-bearing: **15.09**, where only the
   Producer — as session owner and trust broker — may attest gear-on-session, because the gear's
   owner has a financial incentive to inflate; and **15.07**, where the Producer configures a room
   they work in but do not own. Elsewhere the distinction is genuinely absent, and that is a finding
   rather than a gap.
2. **The Operator's row is the one that diverges** — read-only on rigs (they are the compatibility
   *target*, not an author) and full on the asset register (their business inventory). This
   asymmetry is why 15.06 and 15.07 are separate sub-domains rather than one with two modes.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Proposed independently by four lenses and unrefuted by all three adversaries. Not a marketplace sub-domain because it exists with no transaction: musicians register gear they will ... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | Sweep candidates 01 (*Instrument Passport & Provenance Chain*) and 02 (*Serial Registry & Ownership Transfer*) **MERGED** into 15.01 | They are the same thing named twice: the "passport" IS the serial-keyed record and the "provenance chain" IS the ownership-transfer history. Two nodes would have competed to own one entity. | Node Classification Gate, `/ideate-discover` Step 3 |
| D-03 | Sweep candidate 05 (*Gear Collection & Rig Inventory*) **SPLIT** — collection → 15.04, rig → 15.06 | Different groupings with different semantics. A collection is an ownership set; a rig is a functional configuration with signal-chain order that routinely contains gear the user does not own. One entity cannot be both an ownership record and an operational config. | Node Classification Gate, `/ideate-discover` Step 3 |
| D-04 | **15.08 Custody, Loans & Consignment ADDED** — not in the sweep's candidate list | Four features (15.02.01 theft standing, 15.05.03 insurance, 15.06.01 rigs, 15.07.01 asset registers) independently produced wrong answers traceable to one missing concept: **custody ≠ ownership**. Gear lives in studios that don't own it, on loan, with techs, on consignment, in transit. That four unrelated nodes converged on the same gap is the evidence it is a node, not a field. | Deep Think, `/ideate-discover` Step 3 |
| D-05 | Identity key is `(maker, model, era, serial)`, never `serial` alone | Serials are unique only within maker+model+era; Gibson demonstrably reused sequences. A bare-serial key guarantees collisions, and the consequence is not cosmetic: point-of-sale screening (15.02.02) would flag innocent sellers whose instrument shares a reused number. A false "stolen" on a public listing naming a seller is the worst output this domain can produce. | Deep Think DT-02 on 15.01.05 |
| D-06 | **The registry never overstates what it knows.** Gaps render as gaps; "no match" is scoped to registry coverage; "no service history recorded" ≠ "never serviced"; a screen failure never renders as a pass | The single principle unifying this domain's design. It recurs at 15.01.04 (chain gaps are the honest majority case), 15.02.02 (a "verified clean" badge on an empty registry converts a buyer's caution into misplaced confidence), 15.03 (absence of a record is not evidence of absence), 15.05.03 (an overstated claim pack gets rejected and burns the owner's credibility), and 15.06.02 (a check against unknown specs is not a pass). A registry that cannot say "I don't know" will fabricate — and a provenance product that fabricates is worse than no product. | Deep Think, synthesised across 6 features |
| D-07 | The platform surfaces contests; it does not adjudicate title | WeJammin has no discovery powers and cannot determine who owns a disputed instrument. Adjudicating means being wrong often with someone's livelihood as the stake. Telling a buyer "two people claim this" gives them the protection they actually need. Applies identically to contested ownership claims (15.01.02) and contested theft flags (15.02.04) — which is why they share one dispute path. | Deep Think DT-03 on 15.02.04 |
| D-08 | **Boundary rule: 15 supplies evidence; other domains supply process.** | Applied consistently at four boundaries: the luthier's work-order is domain 05 (15.03 DT-01); the technical rider is domain 18 (15.06.03 DT-01); the ATA carnet is domain 18 (15.10 DT-01); the insurer is off-platform and the boundary is a document (15.05.03 DT-02). Each was independently tempting and each would have duplicated another domain for one section of its output. | Deep Think, synthesised across 4 features |
| D-09 | The org register carries a **quantity-tracked** mode alongside the identity-tracked one | Commodity stock — 40 mic stands, 200 cables, four interchangeable practice amps — gains nothing from per-object identity while the registration cost is real, and identity-only loads the heaviest onboarding on the lowest-value room type. A quantity-tracked line records a count and carries no serial identity; the Operator retains identity-tracking per item wherever the object is distinguishable, valuable or theft-prone. Scoped to org registers (15.07); it does not alter 15.01.01's `(maker, model, era, serial)` key (D-05), which quantity lines simply do not carry. It does degrade condition: on a quantity line, condition is a fact about the count (15.07.02 D-04). | 15.07.01 DT-03; ratified by user 2026-07-22 (DQ-15.A2) |

## MoSCoW Proposals

> **Proposals only — the owner decides.** Anchored to D-18 (provenance is the wedge, consolidation
> is the platform) and to this domain's `important` (not `core`) priority. Full reasoning per feature
> is in the return payload of `/ideate-discover` Step 3.

| Proposal | Features |
|---|---|
| **Must** | 15.01.01 Gear Record & Serial Identity — everything in the domain keys off it, and domain 13 needs it to render a passport |
| **Should** | 15.01.02 · 15.01.03 · 15.01.04 · 15.01.05 · 15.02.01 · 15.02.02 · 15.02.04 · 15.04 · 15.08 · 15.09 |
| **Could** | 15.01.06 · 15.02.03 · 15.03 · 15.05.01 · 15.05.02 · 15.05.03 · 15.06.01 · 15.06.02 · 15.06.03 · 15.07.01 · 15.07.02 · 15.07.03 · 15.10 |

**Two proposals worth arguing about:**

- **15.02.02 (screening) is the domain's strategic peak and is proposed `should`, not `must`** — not
  because it is less valuable, but because it has a cold-start dependency: on day one the flag
  registry is empty, every check returns "no match", and the feature is at its most reassuring when
  it knows least. It is worth building only once 15.02.01 has population. Shipping it early would
  manufacture exactly the false assurance D-06 exists to prevent.
- **15.02.01/15.02.04 must ship together.** A flag without a dispute path is a weapon; a flag without
  a terminal state rots into a permanent false positive on innocent gear. Flagging alone is
  net-negative.

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — 5 sub-domains, 5 features, 21 leaf features. See Children. | Agent | ✅ `/ideate-discover` Step 3 |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — none of the 10 candidates was a cross-cut, but 5 *mechanisms* discovered during drilling belong at the platform level. See the CX file's escalation table. | Agent | ✅ `/ideate-discover` Step 3 |
| Q-03 | **[OWNER]** **The dealer-persona gap is real.** personas.md Q-01 asked whether a professional dealer is a distinct persona or a Musician in a selling context, and said to revisit "if the Gear Role Matrices come out thin". They did not come out thin — but consignment (15.08 DT-03), appraisal (15.05.02) and a dealer's stock register (15.07 Q-02) all have an actor with no persona. The gap is not Musician-vs-Producer thinness; it is a missing fifth actor. Explicitly **not** closed by D-71, which authored counterparty profiles for licence *buyers* only: *"a dealer is a seller; the counterparty profiles describe buyers."* `meta/personas.md` Q-01 has itself been re-pointed to `/create-prd` (canonical entry `vision.md` Q-05); this row follows it. | User | `/create-prd` |
| Q-04 | **[OWNER]** **Provenance is not authenticity.** A counterfeit with a long, genuinely-recorded chain reads as *more* trustworthy than a real instrument with no chain — so the registry, unqualified, makes fakes more saleable. Does the platform assert authenticity at all, or only record assertions and disclose that it does not verify them? A liability decision. The **disclosure half is already settled** — 15.01.04 D-02 requires the chain to state what it does not prove — but whether the platform makes any authenticity assertion at all is an owner call, carried identically at [15.01](./15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-index.md) Q-03 (already `[OWNER]` → `/create-prd`). | User | `/create-prd` |
| Q-05 | **The composed-exposure hazard needs an owner.** Public collection + public tour dates + public city = a targeting package for endemic gear theft (CX-07). No single domain can see the composition. This domain has closed its own four holes; the platform-level mechanism has no home. | User | `/create-prd-security` |
| Q-06 | **[OWNER]** **Valuation conflict of interest.** WeJammin runs the marketplace whose comps feed the valuation and takes a fee on the resulting sales — and inflated estimates become the comps for the next estimate. Disclosure, independent method, or don't offer valuation? A values decision, not a technical one. Carried identically at [15.05](./15.05-valuation-appraisal-insurance/15.05-valuation-appraisal-insurance-index.md) Q-01 and 15.05.01 Q-01; 15.05.01 D-02 (sample size and recency rendered with the estimate) is the only mitigation so far ratified and does not answer whether the product is offered at all. | User | `/create-prd` |
| Q-07 | **[OWNER]** **Boundary with domain 16**: a venue listing could carry a free-text gear list and satisfy most Operators. 15.07 adds serial identity, condition, valuation and custody. Is that wanted, or does 16 own a simple list and 15.07 serve a minority? This decides whether 15.07 exists. **Still open.** 16.04 (rehearsal rooms) confirmed the read-through for its own room type — backline renders from 15.07.03 filtered by 15.07.02 condition and 16.04 types no item list (16.04 D-06, owner decision DQ-15.A1). That is a **per-feature confirmation** in the sibling convention (16.02.02 D-06, 16.03.02 D-04/D-05), not an answer to this question. Carried identically at [15.07](./15.07-studio-backline-asset-register/15.07-studio-backline-asset-register-index.md) Q-01, also still open; a scope call on whether a whole sub-domain exists. | User | `/create-prd` |
| Q-08 | **[OWNER]** **Cold start governs three of this domain's best features.** Screening needs flags that predate thefts; gear discography needs sessions that happened here; the chain needs transfers. All are worth ~zero at launch and compound thereafter. Is that an acceptable shape, or does something need seeding? Accept-the-slow-burn vs seed is a product-strategy call the owner takes; only once it is taken can the mechanics follow (external-registry federation is already queued at [15.02](./15.02-stolen-gear-registry-recovery/15.02-stolen-gear-registry-recovery-index.md) Q-02 → `/create-prd`). | User | `/create-prd` |
| Q-09 | Is there a **gear catalogue** (maker/model/era/spec reference data)? 15.01.01, 15.01.05 and 15.06 all lean on it, and building it is a large, unglamorous data problem nobody has scoped. | User | `/create-prd` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-71|D-71]]
