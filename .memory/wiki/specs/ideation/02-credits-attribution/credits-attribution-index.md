# Credits & Attribution — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-23
> **Novelty**: `whitespace` | **Priority**: `core`

## Overview

The verified graph of who did what on every session, work and recording — captured at creation, attested by the people in the room, resolvable to industry identifiers, and disputable.

**Why this is a top-level domain**: Proposed independently by four lenses, the most-cited whitespace in the corpus, and unrefuted by all three adversaries. Not Identity: the capture mechanism (session/DAW), the multi-party attestation state machine, the dispute/merge engine and the cold-start seeding pipeline have nothing to do with account management. Not Rights: a session drummer has a credit and zero ownership — conflating them is the exact error the rights lens flagged. It is a hub feeding hiring, dep matching, reputation, neighbouring-rights registration, A&R signal, gear discography and warm intros, and it has its own destinations (public discography, claim inbox, credit lookup). Jaxsta, Muso.AI, Sound Credit and Discogs all exist because credits are broken, and all fail identically: they reconstruct after the fact from whoever remembers. Only a platform present at the session captures them at source. Note: the consolidation flagged this as 'the single highest-leverage classification call on the map' and asked for owner ratification — but that flag predates verification, and three independent adversaries then tried and failed to refute it. It is not surfaced as an owner decision because verification settled it.

**Interacting capabilities** (what justifies domain status):

- credit graph & discography
- session capture at creation
- claiming & cold-start seeding
- counter-attestation & verification
- dispute resolution
- role/instrument taxonomy

## Children

> Classified 2026-07-16 through the Node Classification Gate. 11 sweep candidates → **4 sub-domains
> + 6 features**, with 2 candidates merged, 1 split, and 3 Deep Think additions. All `[SURFACE]`.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 02.01 | Credit Graph & Discography | sub-domain | [02.01-credit-graph-discography/](./02.01-credit-graph-discography/) | `[BREADTH]` | 17 hypotheses (6 children) |
| 02.02 | Session Capture | sub-domain | [02.02-session-capture/](./02.02-session-capture/) | `[BREADTH]` | 12 hypotheses (4 children) |
| 02.03 | Claiming & Cold-Start Seeding | sub-domain | [02.03-claiming-cold-start-seeding/](./02.03-claiming-cold-start-seeding/) | `[BREADTH]` | 8 hypotheses (3 children) |
| 02.04 | Attestation & Credit Confidence | sub-domain | [02.04-attestation-credit-confidence/](./02.04-attestation-credit-confidence/) | `[BREADTH]` | 11 hypotheses (4 children) |
| 02.05 | Credit Dispute Resolution | feature | [02.05-credit-dispute-resolution.md](./02.05-credit-dispute-resolution.md) | `[SURFACE]` | 3 hypotheses |
| 02.06 | Credit Role & Instrument Taxonomy | feature | [02.06-credit-role-instrument-taxonomy.md](./02.06-credit-role-instrument-taxonomy.md) | `[DEEP]` | 14 hypotheses |
| 02.07 | Union & Performer Session Reporting | feature | [02.07-union-performer-session-reporting.md](./02.07-union-performer-session-reporting.md) | `[SURFACE]` | 2 hypotheses |
| 02.08 | Credit Export & DDEX RIN Emission | feature | [02.08-credit-export-ddex-rin.md](./02.08-credit-export-ddex-rin.md) | `[SURFACE]` | 3 hypotheses |
| 02.09 | Gear ↔ Credit Linkage | feature | [02.09-gear-credit-linkage.md](./02.09-gear-credit-linkage.md) | `[SURFACE]` | 3 hypotheses |
| 02.10 | AI Contribution Disclosure | feature | [02.10-ai-contribution-disclosure.md](./02.10-ai-contribution-disclosure.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Candidate Disposition

> Every sweep candidate accounted for. Pruning and promotion are both expected outcomes.

| Sweep candidate | Disposition |
|---|---|
| 01 Verified Credit Graph & Discography | → sub-domain `02.01` |
| 02 Session Capture Companion (DAW plugin + mobile) | → sub-domain `02.02`; the **plugin channel** split out as a cross-cut (D-02) |
| 03 Credit Claiming & Cold-Start Graph Seeding | → sub-domain `02.03`; its "Provenance Tier Labelling" half merged into `02.04.02` |
| 04 Counter-Attestation & Verified vs Self-Asserted | → sub-domain `02.04` |
| 05 Credit Disputes & Attribution Resolution | → **feature** `02.05` — the dispute *engine* is a cross-cut (D-03) |
| 06 Credit Role & Instrument Taxonomy | → **feature** `02.06`; also a cross-cut with 02 as owner (D-05) |
| 07 Union & Performer Session Reporting | → **feature** `02.07` |
| 08 Session Attendance Proof | → **merged** into `02.02.04` — evidence layer for the roll, not a peer (D-04) |
| 09 Contribution Ledger → DDEX RIN Emission | → **feature** `02.08`; "contribution ledger" was a near-duplicate of `02.01.01` and merged there (D-06) |
| 10 Endorsements & Credit-Weighted Vouching | → **split**: weight → `02.04.02`; endorsement surface → **cross-cut** (D-07) |
| 11 Gear ↔ Credit Linkage | → **feature** `02.09` |
| _Deep Think addition_ | `02.01.05` Credit Visibility & Embargo |
| _Deep Think addition_ | `02.01.06` Credit Correction & Amendment |
| _Deep Think addition_ | `02.04.04` Attestation-Ring & Collusion Detection |
| _Deep Think addition_ | `02.10` AI Contribution Disclosure |

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md) — referenced, never redefined.
>
> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 02.01 Credit Graph & Discography | ✅ Full (own credits + page) | ✅ Full (own page + sessions) | ✅ Full (room's discography) | 👁️ Read-only (public tier) |
| 02.02 Session Capture | ⚙️ Config (own presence + contributions) | ✅ Full (owns the session) | 👁️ Read-only (who is in their room) | ❌ None |
| 02.03 Claiming & Cold-Start Seeding | ✅ Full (own catalog + inbox) | ✅ Full | ✅ Full (room's catalog) | ❌ None |
| 02.04 Attestation & Credit Confidence | ✅ Full (attests; reads own tiers) | ✅ Full (trust broker) | ⚙️ Config (room facts only) | 👁️ Read-only (simplified label) |
| 02.05 Credit Dispute Resolution | ✅ Full | ✅ Full | 👁️ Read-only (corroborates room facts) | ❌ None |
| 02.06 Credit Role & Instrument Taxonomy | ⚙️ Config (picks; requests additions) | ⚙️ Config | ⚙️ Config (room roles) | 👁️ Read-only (plain labels) |
| 02.07 Union & Performer Session Reporting | ⚙️ Config (own membership + line) | ✅ Full (signatory) | 👁️ Read-only | ❌ None |
| 02.08 Credit Export & DDEX RIN | ✅ Full (own credits) | ✅ Full (own works) | ✅ Full (room's credits) | ❌ None |
| 02.09 Gear ↔ Credit Linkage | ✅ Full (own contributions) | ✅ Full | ⚙️ Config (room's gear) | 👁️ Read-only |
| 02.10 AI Contribution Disclosure | ⚙️ Config (own contributions) | ✅ Full | ❌ None | 👁️ Read-only |

> **Two findings worth carrying downstream:**
> - **Operator is not a bystander in this domain.** "Recorded at <Studio>" is a standard liner-note credit and a room's discography is how it gets booked (`02.01` D-03). The sweep's provisional persona list missed this entirely.
> - **Fan is read-only, not absent.** Discogs and AllMusic are fan products; "who played that solo" is mainstream fan behavior, and the public credit page is the graph's only organic distribution channel (`02.01.02` DT-01). Per `personas.md`, the Fan surface must be the same data as a different product — no tier jargon, no claim affordances.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Proposed independently by four lenses, the most-cited whitespace in the corpus, and unrefuted by all three adversaries. Not Identity: the capture mechanism (session/DAW), the multi-party attestation state machine, the dispute/merge engine and the cold-start seeding pipeline have nothing to do with account management. Not Rights: a session drummer has a credit and zero ownership. | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **DAW / plugin host integration is a cross-cut**, not a child of `02.02` | The channel also carries stems (07), split capture (09) and service delivery (05). Domain 02 owns the *payload* — roll, log, close prompt. Separating channel from payload preserves the domain's justifying capability without claiming a platform-wide mechanism. **Caveat**: `02.02` Q-02 means the wedge's viability depends on this cross-cut's answer. | Node Classification Gate, `/ideate-discover` Step 3 |
| D-03 | **Dispute case engine is a cross-cut**; `02.05` is a feature riding it | Case, evidence, adjudicator, SLA and appeal are identical across 05, 09, 13, 14, 17, 19 and 24. Only credit-specific evidence semantics and contested-credit behavior are domain-owned. Building a second engine would fork the machinery and produce two divergent appeal experiences. | Node Classification Gate, Step 3 |
| D-04 | Candidate "Session Attendance Proof" **merged** into `02.02.04` | It is the evidence layer for the roll call, not a peer capability — it has no meaning without a roll to corroborate. | Node Classification Gate, Step 3 |
| D-05 | `02.06` Taxonomy is **both a feature here and a cross-cut mechanism**, owned by 02 | It serves 03, 04, 05, 08 and 13. Domain 02 owns it because credits are the only consumer where imprecision has consequences (an inexact role invalidates a RIN emission and misroutes a neighbouring-rights registration; an inexact service category just ranks badly). A vocabulary owned by its most demanding consumer stays rigorous. Deleting the node would also contradict D-16, which names it a justifying capability. | Node Classification Gate + Deep Think, Step 3 |
| D-06 | Candidate "Contribution Ledger → DDEX RIN Emission" **reduced** to `02.08` | The "contribution ledger" was a near-duplicate of the credit record; merged into `02.01.01`. Emission is the real capability. | Node Classification Gate, Step 3 |
| D-07 | Candidate "Endorsements & Credit-Weighted Vouching" **split** | The credit-derived *weight* is `02.04.02`'s; the endorsement *surface* is a platform reputation mechanism serving 01, 03, 04 and 05 — routed to the global CX. Domain 02 supplies the signal, not the surface. | Node Classification Gate, Step 3 |
| D-08 | **Evidence sets the tier; it never gates the credit** — proposed as a domain-level principle | Reached independently three times (`02.01.01` DT-02, `02.02.04` DT-02, `02.03` D-01). It is what separates this product from both Jaxsta (records everything, distinguishes nothing) and a verification-gated graph (distinguishes everything, records nothing). Most true credits will never be confirmed; hiding them recreates the empty-database failure. | Deep Think, Step 3 |
| D-09 | **The tier is derived, never stamped** | Attestations arrive late and get retracted; ring detection demotes the internal score. A stamped tier would report a credit as verified after the only person who verified it withdrew. Real cost: derived-on-read at fan-scale volume is a live constraint on the locked Supabase decision. | `02.04.02` D-01, DT-01 |
| D-10 | **The platform does not adjudicate truth** | It records who asserted what, with accountability. `02.04.02` DT-02 (tier ≠ truth), `02.05` DT-02 (disputes about captured work are *cheap*, not *settled well*), `02.10` DT-03 (no AI detection) all reduce to this. The honest claim is about evidence quality and cost, not about verdicts — and "verified" is a liability surface (`02.04` Q-03), not a copy choice. | Deep Think, Step 3 |
| D-11 | **The provenance rung is invariant to ring detection, and every rung-gated consumer reads the same rung** | Owner ratification of DQ-06.1 + DQ-06.2. Demotion moves the continuous internal score only. Consequences that cross child boundaries: `02.01.02` publishes no label change on demotion; `02.08` **drops demotion from its re-emission staleness trigger**; `02.01.03` traversal rank is where the defence actually lands; out-of-domain rung gates (`06.02.02`'s rung ≥ 5 credential block) do not move, and domain 10 keeps its own registration-floor call. **Accepted cost**: a fully corroborated fiction keeps its top-rung label and its rung-gated credentials indefinitely. | `02.04.02` D-19/D-20; `02.04.04` D-08/D-09; `02.04` D-07/D-08 |
| D-12 | **Materiality has exactly one boundary — `02.04.01` D-10's flat (party, role, work) identity test — and no taxonomy operation ever invalidates an attestation** | Owner ratification of DQ-05.1 + DQ-05.2. `02.04.02` D-13/DT-08's entailment layer is superseded: it was internally incoherent, its worked carrying example was an instrument change (outside the claim identity per `02.01.01` D-03 / `02.06` D-16), and it would have commissioned a role-strength ordering `02.06` does not define and could not keep stable. Accepted cost: the routine "Producer" → "Additional Production" correction re-asks, bounded by `02.04.01` D-09/D-21. Accepted blind spot: an admin pending-alias mapping error silently changes a canonical on an attested credit until someone notices; the remedy routes through `02.01.06`. | `02.04.01` D-10; `02.04.02` D-17/D-18; `02.06` D-23/D-24; `02.01.06` |
| D-13 | **An objection to an evidence-based embargo lift is a stated-ground challenge that pauses at the status quo and resolves on the dispute engine — never a Producer veto** | Owner ratification of DQ-03 axes A2–A5, extended by E8. Closed ground list includes public-but-unauthorised as a human-only authority-evidence review; public reachability is discovery evidence, never permission. Platform re-verification is the free first rung where applicable; a resolution SLA is mandatory; re-submission is unbounded. | `02.01.05` D-19–D-24; `02.05` D-07 |
| D-14 | **A contested claim stays attached to the first claimant until the contest closes; on `Unresolvable` it detaches and returns to its unclaimed shell** | Owner ratification of DQ-04.1 + DQ-04.2. Reverses `02.03.03`'s Happy Path step 2 and `02.03.02`'s Contested row, and corrects `02.03.03` D-03's suppression rule to match `02.01.02` D-06 / `02.01.01` D-11 (a contest is never published and never suppresses). The shell fallback is the pre-claim status quo — zero new state, zero new render mode — and deliberately does **not** answer `02.03.02` Q-02 (what a shell publishes). Two follow-on gaps recorded: the true owner has no unilateral control over the line (`02.03.03` Q-04), and pendency is unbounded where no corroborator exists (`02.03.03` Q-05). | `02.03.03` D-05/D-06; `02.03.02` states |

## MoSCoW Proposal

> **Proposal only — the owner decides.** Anchored to D-18 (provenance is the wedge; consolidation
> is the platform), not to the agent's sense of importance.

| Proposal | Features |
|---|---|
| **Must** | `02.01.01` Credit Record · `02.01.02` Public Discography · `02.01.05` Visibility & Embargo · `02.02.01` Roll Call · `02.02.02` Contribution Log · `02.02.03` Close Prompt · `02.04.01` Attestation · `02.04.02` Provenance Tiers · `02.06` Taxonomy |
| **Should** | `02.01.03` Credit Search · `02.01.04` Resolution & Merge · `02.01.06` Amendment · `02.03.01` Import · `02.03.02` Claim Inbox · `02.04.04` Ring Detection · `02.05` Disputes · `02.08` Export & RIN · `02.10` AI Disclosure |
| **Could** | `02.02.04` Attendance Proof · `02.03.03` Claim Adjudication · `02.04.03` Retraction · `02.09` Gear Linkage |
| **Won't (now)** | `02.07` Union Reporting |

**Reasoning**: the Must set is the wedge and nothing else — capture the fact in the room (`02.02`), record it (`02.01.01`), distinguish it from a rumour (`02.04.01`/`02.04.02`), and give it a destination worth the trouble (`02.01.02`). `02.01.05` is Must not for value but for **safety**: without embargo, capture leaks NDA sessions and the professional tier never adopts. `02.06` is Must because nothing binds without a role vocabulary.

`02.08` sits at Should despite being the answer to `problem-statement.md` Q-02 (earned vs hostile lock-in) — the commitment is what matters at launch; the emission can follow. `02.07` is the only Won't: US-only, minority-of-sessions, externally-defined rates, and a submission path that is an institutional relationship rather than an integration.

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ | Agent | ✅ Resolved this pass — see Candidate Disposition |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ | Agent | ✅ Resolved — 4 routed out (D-02, D-03, D-05, D-07) |
| Q-03 | **Who owns the `session` entity — domain 02 or domain 07?** Both need it. Duplicating it is the single worst structural error available in this domain. **An interim rule is already in force and downstream must hold it** (`ideation-cx.md` § 02-07): "**07 owns the `session` entity** as the project-level grouping where work happens; **02 reads it and captures credits AT the session, never owning the entity**" — consistent with `07.06.01` D-01 ("the **Session is a first-class entity** — the atomic unit of provenance"). What remains is ratifying first-class-07 versus jointly-owned 02/07, plus its storage representation. | User | `/create-prd-architecture` |
| Q-04 | **Is there a DAW plugin?** `02.02` Q-02 and CX-02 converge on this: without a reliable wrap signal the close prompt mistimes, the in-room tap does not happen, and the domain degrades to an async attestation chase — which is Sound Credit, which already exists and already failed. **The plugin question is not downstream of the wedge; it is the wedge.** — **ANSWERED FOR v1 (owner decision 2026-07-22, `ideation-index` D-70, queue entry DQ-08.2): no.** No non-web client on the producer's machine is authorised, so there is no plugin, no watch-folder agent and no DAW-close signal in v1. The domain's v1 wrap ladder is rungs 1, 4 and 5 (`02.02.03`), the cards ship on **PWA web push + in-app** (`07.06.02` D-17), and the v1 thesis is restated to **capture at the first sharing moment** (`vision.md`; D-70(d)). The question reopens **only** on the four enumerated evidence items in `meta/constraints.md` § Desktop Surface — Reopen Evidence; `07.09` D-04's parser gate is separate and additional. | User | `/create-prd` (post-gate only) |
| Q-05 | ~~**What is the actual invitation channel for unclaimed shells?**~~ (`02.03.02` Q-01, CX-04.) | User | ✅ **Resolved — the Producer's social act at roll call (`02.02.01`); the platform prompts it and never performs it.** `02.01.05` DT-15: "the Producer can still tell the human directly, **which is domain Q-05's real answer regardless**"; `credits-attribution-cx.md` CX-04: "**Producer**: creates the most shells and is **the only viable invitation channel**." There is no platform-side channel — a shell has no notification channel and emailing one needs contact data nobody consented to give (`02.03.02` DT-01) — and while a credit is embargoed no invitation fires at all; it fires at lift (`02.01.05` D-15). The acquisition tax is **confirmed as a cost and rejected as a bug** (`02.01.05` DT-15). |
| Q-06 | **Credit vs split at the close prompt** (`02.02.03` DT-02). `personas.md` pairs them in one moment; they are different facts with different weight, and domain 09 owns the split. The highest-risk intersection on the map, and it runs through one UI. | User | `/create-prd` |
| Q-07 | **[OWNER] Ring detection's false positives are unappealable** (`02.04.04` Q-02). A real tight scene is topologically near-identical to a collusion ring, and demotion is silent. **Narrowed by D-11**: the harm no longer reaches the public label, the rung, or any rung-gated consumer — it is bounded to traversal rank, search placement and per-edge dispute weighting. Still invisible, still unappealable, still the domain's hardest open question; what is open is whether *that* bounded harm is acceptable. | User | `/create-prd` |
| Q-08 | **Re-emission after change** (`02.08` Q-01). Amendment and retraction mutate credits after export; downstream consumers hold stale facts. **Demotion has dropped off this list** (D-11) — it is score-only and stales nothing an emitted package carries. Flagged by three features, solved by none. | User | `/create-prd` |
| Q-09 | **GDPR erasure vs the joint factual record** (`02.01.01` Q-01). A credit is several people's assertion; erasing one party's link rewrites others' history. Likely de-identification rather than deletion — but it is a legal/product collision, not a preference. | User | `/create-prd-security` |
| Q-10 | **Source licensing for import** (`02.03` Q-01). MusicBrainz, Discogs, DDEX and PRO data have materially different terms; some may prohibit exactly what `02.03.01` proposes. A legal gate on a whole sub-domain. | User | `/create-prd` |
| Q-11 | **Consent for shells** (`02.02.01` Q-02, `02.03.02` Q-02/Q-03). Roll call and import create public-ish records about people who never signed up. What is visible pre-claim, and can a person refuse a shell whose credits are other people's true assertions? | User | `/create-prd-security` |
| Q-12 | Q-03 from `personas.md` (teacher/student split) has a sibling here: does the **Band as entity** hold credits directly, or only its members? Liner notes do both. Constrained but not answered by `02.02.03` DT-12 — entities cannot tap, so an entity's row is attested by an authorised human or not at all ("This does not resolve domain Q-12 (whether the Band *holds* credits), but it constrains it"). An entity-model call on the credit graph. | Agent | `/create-prd-architecture` |
| Q-13 | **The resolution SLA for a contested embargo-lift objection** (`02.01.05` Q-06). D-13 makes an SLA mandatory — without one, an embargoed status quo plus an unbounded resolver is a de facto Producer veto. The requirement is specified; the number is not, and it is bounded by `02.05`'s ladder and domain 24's adjudication capacity, which does not currently budget for this load. | User | `/create-prd` |
| Q-14 | **Resolved under owner autonomy (2026-08-02):** public reachability is discovery evidence, never authorisation. A leak or bootleg follows `02.01.05` D-24's human authority-evidence review; unresolved cases remain on the temporary embargo path. | Owner autonomy | Resolved — E8 |
| Q-15 | **Unbounded pendency and the powerless true owner in a claim contest** (`02.03.03` Q-04, Q-05). Under D-14 the credit stays with the first claimant while contested; no corroboration SLA exists anywhere, so pendency is unbounded in the worst case, and the true owner cannot set the line Unlisted because `02.01.05`'s controls belong to a party *named* on the record. Both are consequences the decision accepted, and both need a bound or a control before implementation. | User | `/create-prd-security` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-20|D-20]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-21|D-21]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-23|D-23]]
- [[decisions.md#d-24|D-24]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-70|D-70]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-22|D-22]]
