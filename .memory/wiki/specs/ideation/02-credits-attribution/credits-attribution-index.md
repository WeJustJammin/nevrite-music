# Credits & Attribution — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
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
| 02.01 | Credit Graph & Discography | sub-domain | [02.01-credit-graph-discography/](./02.01-credit-graph-discography/) | `[SURFACE]` | 17 hypotheses (6 children) |
| 02.02 | Session Capture | sub-domain | [02.02-session-capture/](./02.02-session-capture/) | `[SURFACE]` | 12 hypotheses (4 children) |
| 02.03 | Claiming & Cold-Start Seeding | sub-domain | [02.03-claiming-cold-start-seeding/](./02.03-claiming-cold-start-seeding/) | `[SURFACE]` | 8 hypotheses (3 children) |
| 02.04 | Attestation & Credit Confidence | sub-domain | [02.04-attestation-credit-confidence/](./02.04-attestation-credit-confidence/) | `[SURFACE]` | 11 hypotheses (4 children) |
| 02.05 | Credit Dispute Resolution | feature | [02.05-credit-dispute-resolution.md](./02.05-credit-dispute-resolution.md) | `[SURFACE]` | 3 hypotheses |
| 02.06 | Credit Role & Instrument Taxonomy | feature | [02.06-credit-role-instrument-taxonomy.md](./02.06-credit-role-instrument-taxonomy.md) | `[SURFACE]` | 3 hypotheses |
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
| D-09 | **The tier is derived, never stamped** | Attestations arrive late, get retracted, and get demoted. A stamped tier would report a credit as verified after the only person who verified it withdrew. Real cost: derived-on-read at fan-scale volume is a live constraint on the locked Supabase decision. | `02.04.02` D-01, DT-01 |
| D-10 | **The platform does not adjudicate truth** | It records who asserted what, with accountability. `02.04.02` DT-02 (tier ≠ truth), `02.05` DT-02 (disputes about captured work are *cheap*, not *settled well*), `02.10` DT-03 (no AI detection) all reduce to this. The honest claim is about evidence quality and cost, not about verdicts — and "verified" is a liability surface (`02.04` Q-03), not a copy choice. | Deep Think, Step 3 |

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
| Q-03 | **Who owns the `session` entity — domain 02 or domain 07?** Both need it. Duplicating it is the single worst structural error available in this domain. | User | `/ideate-validate` |
| Q-04 | **Is there a DAW plugin?** `02.02` Q-02 and CX-02 converge on this: without a reliable wrap signal the close prompt mistimes, the in-room tap does not happen, and the domain degrades to an async attestation chase — which is Sound Credit, which already exists and already failed. **The plugin question is not downstream of the wedge; it is the wedge.** | User | `/create-prd` |
| Q-05 | **What is the actual invitation channel for unclaimed shells?** (`02.03.02` Q-01, CX-04.) Shells have no notification channel, so the growth loop depends on a Producer telling a human — an act the platform can prompt but never perform. The growth model's load-bearing unknown. | User | `/ideate-validate` |
| Q-06 | **Credit vs split at the close prompt** (`02.02.03` DT-02). `personas.md` pairs them in one moment; they are different facts with different weight, and domain 09 owns the split. The highest-risk intersection on the map, and it runs through one UI. | User | `/create-prd` |
| Q-07 | **Ring detection's false positives are unappealable** (`02.04.04` Q-02). A real tight scene is topologically near-identical to a collusion ring; demotion is silent; the wrongly-demoted have their careers quietly devalued with no notice. The domain's hardest open question. | User | `/ideate-validate` |
| Q-08 | **Re-emission after change** (`02.08` Q-01). Amendment, retraction and demotion all mutate credits after export; downstream consumers hold stale facts. Flagged by four features, solved by none. | User | `/create-prd` |
| Q-09 | **GDPR erasure vs the joint factual record** (`02.01.01` Q-01). A credit is several people's assertion; erasing one party's link rewrites others' history. Likely de-identification rather than deletion — but it is a legal/product collision, not a preference. | User | `/create-prd-security` |
| Q-10 | **Source licensing for import** (`02.03` Q-01). MusicBrainz, Discogs, DDEX and PRO data have materially different terms; some may prohibit exactly what `02.03.01` proposes. A legal gate on a whole sub-domain. | User | `/create-prd` |
| Q-11 | **Consent for shells** (`02.02.01` Q-02, `02.03.02` Q-02/Q-03). Roll call and import create public-ish records about people who never signed up. What is visible pre-claim, and can a person refuse a shell whose credits are other people's true assertions? | User | `/create-prd-security` |
| Q-12 | Q-03 from `personas.md` (teacher/student split) has a sibling here: does the **Band as entity** hold credits directly, or only its members? Liner notes do both. | Agent | `/ideate-discover` Step 5 |
