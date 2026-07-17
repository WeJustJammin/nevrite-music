# Music Licensing — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Music Licensing](./music-licensing-index.md)
> **Status**: [BREADTH] — 8 sub-domains + 3 features classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [11.02 Clearance](./11.02-clearance-one-stop-status/) | [11.08 Instrument](./11.08-licence-instrument-lifecycle/) | The gate issues — clearance is the precondition for every instrument in the domain, re-checked fresh at issuance | Musician, Producer | High | 11.02.01 D-04; 11.08.02 D-02 |
| CX-02 | [11.04 Policy](./11.04-licensing-policy-preferences/) | [11.02 Clearance](./11.02-clearance-one-stop-status/) | Policy is a clearance verdict input — it is why clearance is per-(work, scope), not per-work | Musician, Producer | High | 11.02.01 DT-01 |
| CX-03 | [11.04 Policy](./11.04-licensing-policy-preferences/) | [11.03 Pricing](./11.03-licence-pricing-negotiation/) | **Evaluation order**: refusal is checked before price. A forbidden use is never quoted. | Musician, Producer | High | 11.04 D-03; 11.03.01 DT-01 |
| CX-04 | [11.08.01 Scope Grammar](./11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md) | **all sub-domains** | The grammar is the domain's shared type system — policies, cards, clearance verdicts and MFN comparability all key off it | Musician, Producer | High | 11.08.01 DT-01; four features collapse without it |
| CX-05 | [11.04 Policy](./11.04-licensing-policy-preferences/) | [11.05.02 Programmatic](./11.05-sample-derivative-clearance/11.05.02-programmatic-instant-clearance.md) | Standing sample terms **are** 11.04 applied to sampling — programmatic clearance is downstream of policy, not of the registry | Musician, Producer | High | 11.04 D-01; 11.02.04 DT-01 |
| CX-06 | [11.02.03 Encumbrance](./11.02-clearance-one-stop-status/11.02.03-encumbrance-declaration.md) | [11.05.01 Declaration](./11.05-sample-derivative-clearance/11.05.01-sample-declaration-identification.md) | Declaration identifies; encumbrance taints. Deliberately separate so declaring does not immediately start a chore. | Musician, Producer | High | 11.02.03 D-03; 11.05 D-04 |
| CX-07 | [11.02.01 Clearance](./11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md) | [11.07.02 Corpus](./11.07-ai-training-licensing/11.07.02-corpus-assembly-dataset-deals.md) | **Corpus assembly must gate on full clearance, not merely consent** — an encumbered work in a shipped model is unrecoverable | Musician, Producer | High | 11.07.02 DT-03 |
| CX-08 | [11.01 Sync](./11.01-sync-licensing/) | [11.03 Pricing](./11.03-licence-pricing-negotiation/) | Sync is pricing's heaviest consumer; MFN exists almost entirely for sync's dual-sided structure | Musician, Producer | High | 11.03.03 DT-01 |
| CX-09 | [11.06 Creator](./11.06-creator-micro-licensing/) | [11.03 Pricing](./11.03-licence-pricing-negotiation/) | **Deliberate non-interaction.** Creator licensing never touches pricing — flat listed prices, no negotiation, no MFN. | Fan | High | 11.06 D-04; 11.06.01 D-01 |
| CX-10 | [11.09 Cover](./11.09-cover-song-compulsory-mechanical.md) | [11.04 Policy](./11.04-licensing-policy-preferences/) | **Deliberate non-interaction.** The compulsory regime overrides veto and policy — the platform must not show a control that does not exist. | Musician | High | 11.09 D-02 |
| CX-11 | [11.11 Grand Rights](./11.11-grand-rights-dramatic-performance.md) | [11.04.01 Policy](./11.04-licensing-policy-preferences/11.04.01-per-work-licensing-policy.md) | Grand rights must be **excluded from auto-approve** — the node exists mainly so policy has a category to refuse | Musician, Operator | High | 11.11 D-01, D-02 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-04: Scope Grammar ↔ everything (the domain's type system)

**Relationship**: The scope grammar (11.08.01) is not a feature of the instrument sub-domain that other things
happen to reference — it is the **shared vocabulary the entire domain is written in**. Policies (11.04.01) are
predicates over it. Rate cards (11.03.01) are functions from it. Clearance verdicts (11.02.01) are computed
per-(work, **scope**). MFN comparability (11.03.03) is a distance within it. The policy fold (11.04.03) can
only reconcile owners who "disagree in kind" because both project onto the same lattice.

This is the domain's most load-bearing structural finding, and **the sweep did not contain it** — it listed the
certificate (candidate 17) but never the language the certificate is written in.

**Role scoping**:
- **Musician / Producer**: consume it constantly, in plain words, and should never see it
- **Operator**: not affected
- **Fan** (as creator buyer): never sees it — a creator licence is a fixed point in the space with no choices, and that absence is much of the product

**Synthesis questions answered**:
1. **Shared state conflict**: The grammar is platform-owned; every other node holds instances or predicates over it. No node may extend it locally — a domain-specific axis value would silently break the fold.
2. **Trigger chain**: Grammar evolution → new instances only. Instances pin their version at issue (11.08.01 D-03). A grammar change must never retroactively alter what an issued licence means.
3. **Permission intersection**: Policy and grammar must share the vocabulary or 11.04.03's fold has nothing to project onto.
4. **Notification fan-out**: None — it is infrastructure.
5. **State transition conflict**: Same pinning rule as 11.03.01 D-02 (card pins at read) and 11.08.02 (instrument pins at issue). **Three instances of one pattern** — see P-02 below.

### CX-03: Policy ↔ Pricing (the evaluation order)

**Relationship**: The most-repeated correctness rule in the domain: **refusal is evaluated before price, and if
it fires nothing else runs.** A tobacco block is not a high price; it is a refusal at any price. The two must
stay distinct objects (11.03.01 DT-01) because merging them makes refusal expressible as a number — which
implies a big enough offer should work, and quietly converts a moral-rights position into a negotiating one.

**Role scoping**:
- **Musician**: the refusing party is usually the one with the least leverage and the strongest feelings — the asymmetry this rule protects
- **Producer**: needs to see blocks early, not at deal time, or they build a pitch on a work that cannot take it
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: Policy and cards are separate records with separate authors and separate semantics. Neither is a field on the other.
2. **Trigger chain**: Request → policy → (refused: stop) → price → quote. A block set mid-flight **withdraws** in-flight quotes, not merely future ones.
3. **Permission intersection**: This is the domain's central permission rule — refusals are absolute and unweighted; a 1% owner blocks as hard as a 90% owner.
4. **Notification fan-out**: A block kills other owners' earning capacity; they must be told, or they believe their catalogue is earning when it is dead (11.04.03 D-04).
5. **State transition conflict**: Block racing an issuance — the gate's fresh re-check (11.02.01 D-04) is the serialization point.

### CX-01: Clearance ↔ Instrument (the gate)

**Relationship**: Every route in this domain — sync, sample, cover, creator, AI — terminates in an instrument,
and every instrument passes the same gate. That single choke point is what makes "one-stop" mean something: one
definition of clearable, evaluated once, in one place, fresh at the moment money moves.

**Role scoping**:
- **Musician / Producer**: read-only on both sides. They configure the gate's inputs upstream (policy, consent, price) and cannot issue or withhold at the gate itself.
- **Operator**: not affected
- **Fan** (as creator buyer): experiences the gate as an instant yes; a no is rendered as "unavailable", never as a clearance explanation

**Synthesis questions answered**:
1. **Shared state conflict**: The verdict is computed, not stored as truth — the instrument pins the verdict it saw at issue. The two must never be reconciled after the fact.
2. **Trigger chain**: Gate → mint → payment, atomically (11.08.02 D-03). A cached verdict never issues (11.02.01 D-04).
3. **Permission intersection**: The gate is where every upstream permission decision is finally enforced; nothing downstream may override it, including the owner (11.08.02 DT-02).
4. **Notification fan-out**: Issuance notifies rights holders after the fact — for policy-approved licences, the receipt is the first notice (11.04.01 DT-02's hazard).
5. **State transition conflict**: Clearance degrading between agreement and issuance is not a race to be eliminated — it is a real event, and the gate refusing an agreed deal is the correct, painful outcome.

---

## Domain-Wide Patterns

> Three patterns recurred across unrelated sub-domains during this pass. Each was found independently at least
> twice, which is what distinguishes them from local rules. **They are candidates for the global CX file.**

### P-01: Perishable state must warn its owner, not only its counterparty

Found three times, from one persona insight. personas.md's Operator anti-persona — *"forgets to release a hold,
blocking a slot they'd happily have sold"* — reappeared structurally in:

- **11.01.04 DT-02** — a forgotten sync hold freezes a work; the *owner* loses the sale silently
- **11.08.04 DT-02** — an unattended licence expiry is a renewal the owner never knew was available
- **11.04.03 D-04** — an owner whose policy is inert believes their catalogue earns when it is dead

A supply-side lesson from a venue-booking persona generated the same design requirement in three features that
have nothing else in common. **Worth stating once at platform level rather than rediscovering per feature.**

### P-02: The old record always survives — supersede, never edit

Found three times:

- **11.02.02 D-01** — adding a writer supersedes an attestation; the old one is evidence of what was claimed and when
- **11.08.04 D-01** — an amendment supersedes a certificate; other parties relied on the original
- **11.03.01 D-02 / 11.08.01 D-03** — cards and grammars pin at read/issue; a later edit never mutates an issued instance

This is arguably **a platform-level invariant, not a domain-11 rule** — it is the provenance thesis (D-18)
applied reflexively to the platform's own records. Flagged in 11.08.04 Q-02 and escalated here.

### P-03: Availability changes silently under an in-flight deal

Found three times, as a **fail-open leak** rather than a designed behaviour:

- `11.01-sync-licensing-cx.md#CX-03` Q2 — a hold granted while the search index still shows the work available
- `11.02-clearance-one-stop-status-cx.md#CX-01` Q2 — an attestation invalidating while a work is under hold or pitch
- `11.04-licensing-policy-preferences-cx.md#CX-02` Q2 — an aggregate recompute killing a live negotiation

Three sub-domains independently discovered that a state change must notify parties with a live interest, and each
recorded it locally. **It is one architectural requirement, not three bugs** — flagged in 11.04.03 Q-03 and
routed to `/create-prd-architecture`.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 11.03 Pricing | 11.04 Policy (merge) | The strongest merge candidate in the domain, considered twice (11.03.01 DT-01, 11.04 D-02) and rejected both times. Both are standing owner preferences applied without asking, and merging would visibly shrink the domain. But a card answers **how much** and a policy answers **whether at all** — they are not points on one scale. Merging yields the absurd "set your price for tobacco ads: [never]", and worse, makes refusal expressible as a number, which implies a sufficient offer should work. Their real relationship is evaluation *order* (CX-03), not shared structure. |
| R-02 | 11.01 Sync | 11.06 Creator (shared catalogue) | Considered: one catalogue, two checkout modes. Rejected on three independent axes (11.06.01 DT-01) — **search paradigm** (reference-track vs video-context; a creator would not know a BPM if asked), **price mechanism** (negotiated vs flat-and-never-negotiable), and **product** (permission vs the absence of a claim, which is a downstream integration promise, not a licence term). A shared catalogue with a "simple mode" would drag negotiation, MFN and clearance vocabulary into a surface whose entire premise is their absence. |
| R-03 | 11.05 Sample Clearance | 11.09 Cover Songs | Tempting — both are "using someone else's song". Rejected: **consent is the axis and they sit at opposite ends.** Sampling requires permission that can be refused at any price; covering requires no permission at all because the compulsory regime removes the owner's veto. Modelling them together would put a consent step in a flow that legally has none, and would show a cover's writer a control they do not possess (CX-10). |
| R-04 | 11.07 AI Training | 11.04.02 Veto (parallel consent) | Rejected as a *system*, confirmed as an *identity*: "never AI training" **is** an 11.04.02 category block — same mechanism, same per-share scope, same unanimity fold (`11.07-ai-training-licensing-cx.md#R-02`). Building a parallel AI consent engine would give the platform two systems that must agree about refusal and will eventually not. 11.07 contributes the category and the surrounding product (corpus, compensation), not a second consent model. |
| R-05 | 11.11 Grand Rights | 11.08.01 Scope Grammar (as a media value) | Rejected (11.11 DT-02): grand rights carry **treatment approval** — a subjective, ongoing creative veto that the grammar cannot express and no machine can check. Adding it as a media axis value would let the system quote and auto-approve a licence whose defining term it cannot represent. It is the one licence type in the domain not reducible to scope. |
| R-06 | 11.02.02 Attestation | 11.02.04 Consent Routing | Recorded at sub-domain level (`11.02-clearance-one-stop-status-cx.md#R-01`) and repeated here because the conflation is tempting at domain level too: an attestation is a **claim about a fact**, a consent is a **decision about a permission**. Different failure modes (a false claim vs a withheld permission), different remedies (contest vs escalate), different actors (the knower vs the owner). Merging them makes "I confirm nobody is missing" and "I agree to this deal" one object, which is how consent theatre gets built. |
| R-07 | 11.10 Print & Lyric | 11.05 Sample & Derivative | Considered: a lyric quoted in another song is a derivative use, so print/lyric could sit under derivatives. Rejected — the *rights basis* is the same (composition) but the transaction is not: print/lyric licenses the work **as text or notation to be reproduced**, not as material to be built on. A lyric aggregator is not making a derivative work; they are displaying the original. 11.10 is a thin passenger on this domain's machinery (11.10 DT-02) and moving it under derivatives would imply an interaction it does not have. |
