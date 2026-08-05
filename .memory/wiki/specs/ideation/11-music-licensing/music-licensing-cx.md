# Music Licensing — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Music Licensing](./music-licensing-index.md)
> **Status**: [DEEP] — 8 sub-domains + 3 features; intra-domain cross-cuts mapped and synthesised after the deepening pass.
> **Last updated**: 2026-07-30

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [11.02 Clearance](./11.02-clearance-one-stop-status/) | [11.08 Instrument](./11.08-licence-instrument-lifecycle/) | The gate issues — clearance is the precondition for every instrument in the domain, re-checked fresh at issuance; carries the at-most-one-exclusive-per-(work, exclusivity scope) and no-charge-without-licence invariants | Musician, Producer | High | 11.02.01 D-04; 11.08.02 D-02; 11.02.01→11.08.02 (DT-08) |
| CX-02 | [11.04 Policy](./11.04-licensing-policy-preferences/) | [11.02 Clearance](./11.02-clearance-one-stop-status/) | Policy is a clearance verdict input — it is why clearance is per-(work, scope), not per-work | Musician, Producer | High | 11.02.01 DT-01 |
| CX-03 | [11.04 Policy](./11.04-licensing-policy-preferences/) | [11.03 Pricing](./11.03-licence-pricing-negotiation/) | **Evaluation order**: refusal is checked before price. A forbidden use is never quoted. | Musician, Producer | High | 11.04 D-03; 11.03.01 DT-01; 11.04.01→11.03.01 (#R-02) |
| CX-04 | [11.08.01 Scope Grammar](./11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md) | **all sub-domains** | The grammar is the domain's shared type system — policies, cards, clearance verdicts and MFN comparability all key off it | Musician, Producer | High | 11.08.01 DT-01; four features collapse without it |
| CX-05 | [11.04 Policy](./11.04-licensing-policy-preferences/) | [11.05.02 Programmatic](./11.05-sample-derivative-clearance/11.05.02-programmatic-instant-clearance.md) | Standing sample terms **are** 11.04 applied to sampling — programmatic clearance is downstream of policy, not of the registry; D-05..D-15 presumed to apply unless deliberately excepted | Musician, Producer | High | 11.04 D-01; 11.02.04 DT-01; 11.04.01→11.05.02 |
| CX-06 | [11.02.03 Encumbrance](./11.02-clearance-one-stop-status/11.02.03-encumbrance-declaration.md) | [11.05.01 Declaration](./11.05-sample-derivative-clearance/11.05.01-sample-declaration-identification.md) | Declaration identifies; encumbrance taints. Deliberately separate so declaring does not immediately start a chore. An undeclared sample **is** the encumbrance. | Musician, Producer | High | 11.02.03 D-03; 11.05 D-04; 11.05.01→11.02.03 |
| CX-07 | [11.02.01 Clearance](./11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md) | [11.07 AI Training](./11.07-ai-training-licensing/) | **Corpus assembly must gate on full clearance, not merely consent** — an encumbered work in a shipped model is unrecoverable. Inverse direction also live: provenance-unknown generative output arriving *in* a work is a restricted-source problem no node covered. | Musician, Producer | High | 11.07.02 DT-03; 11.02.03→11.07 (DT-11) |
| CX-08 | [11.01 Sync](./11.01-sync-licensing/) | [11.03 Pricing](./11.03-licence-pricing-negotiation/) | Sync is pricing's heaviest consumer; MFN exists almost entirely for sync's dual-sided structure | Musician, Producer | High | 11.03.03 DT-01 |
| CX-09 | [11.06 Creator](./11.06-creator-micro-licensing/) | [11.03 Pricing](./11.03-licence-pricing-negotiation/) | **Deliberate non-interaction.** Creator licensing never touches pricing — flat listed prices, no negotiation, no MFN. | Fan | High | 11.06 D-04; 11.06.01 D-01 |
| CX-10 | [11.09 Cover](./11.09-cover-song-compulsory-mechanical.md) | [11.04 Policy](./11.04-licensing-policy-preferences/) | **Deliberate non-interaction.** The compulsory regime overrides veto and policy — the platform must not show a control that does not exist. | Musician | High | 11.09 D-02 |
| CX-11 | [11.11 Grand Rights](./11.11-grand-rights-dramatic-performance.md) | [11.04.01 Policy](./11.04-licensing-policy-preferences/11.04.01-per-work-licensing-policy.md) | Grand rights must be **excluded from auto-approve** — the node exists mainly so policy has a category to refuse | Musician, Operator | High | 11.11 D-01, D-02 |
| CX-12 | [11.02.01 Clearance gate](./11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md) | [11.04 Policy](./11.04-licensing-policy-preferences/) · [11.04.02 Veto](./11.04-licensing-policy-preferences/11.04.02-co-owner-veto-approval.md) · [11.03 Pricing](./11.03-licence-pricing-negotiation/) | **The gate's fresh re-check at issuance is the single serialization point for every race in the domain** — mid-evaluation policy edits, concurrent ceiling drops, vetoes landing during execution all resolve here. | Musician, Producer | High | 11.04.01→11.02.01 (state-race); 11.02.01 D-04 |
| CX-13 | [11.02.02 Attestation](./11.02-clearance-one-stop-status/11.02.02-catalogue-completeness-attestation.md) | [11.02.01 Verdict](./11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md) | Attestation supplies the **only verdict input computation cannot derive** (the party set is closed); it pins the party-list version it was made against — an addition always wins, a stale attestation is rejected invalid-on-arrival with a diff, never silently reattached. | Musician, Producer | High | 11.02.01→11.02.02; 11.02.02→verdict (state-race) |
| CX-14 | [11.02.03 Encumbrance](./11.02-clearance-one-stop-status/11.02.03-encumbrance-declaration.md) | [11.08.01 Grammar](./11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md) · [11.02.01 Gate](./11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md) | **Scope-intersection invariant**: a downstream licence's scope must be a subset of the intersection of upstream clearance scopes; the gate refuses any licence exceeding the ceiling, naming it ("available for up to 3 years, not 10"). | Musician, Producer | High | 11.02.03→11.08.01 (DT-04/D-05); 11.02.03→11.02.01 |
| CX-15 | [11.04.01 Policy auto-approve](./11.04-licensing-policy-preferences/11.04.01-per-work-licensing-policy.md) | [11.03.03 MFN](./11.03-licence-pricing-negotiation/11.03.03-most-favoured-nation.md) | **NEW edge**: under MFN one share's deal terms propagate to another's, so an owner's auto-approve can set the economics of co-owners who never saw the deal — auto-approve removes exactly the human MFN would have alerted. | Musician, Producer | High | 11.04.01→11.03.03 (DT-07) |
| CX-16 | [11.04.02 Buyer blocks](./11.04-licensing-policy-preferences/11.04.02-co-owner-veto-approval.md) | [11.08.01 Scope Grammar](./11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md) | **Correction, now ratified**: of the grammar's nine axes only **eight are policy-bearing**; the ninth, `grantee scope`, is **grant-side only** and no policy carries it (11.08.01 D-18), so buyer blocks live *outside* the grammar. 11.04.01's claim "the policy key space is the scope grammar" is true for category blocks over those eight, false for buyer blocks. | Musician, Producer | High | 11.04.02→11.08.01; 11.04.02→11.04.01 |
| CX-17 | [11.04.02 Category block](./11.04-licensing-policy-preferences/11.04.02-co-owner-veto-approval.md) | [11.07.01 AI consent](./11.07-ai-training-licensing/11.07.01-ai-training-consent-opt-out.md) | Same mechanism, **opposite default** — 11.07.01 is opt-in/refused-by-default; 11.04.02's block table defaults empty (permitted). "Never AI training" is an 11.04.02 category block with a louder name, but the two must reconcile the default or they contradict. | Musician, Producer | High | 11.04.02→11.07.01 |
| CX-18 | [11.04.02 Buyer blocks](./11.04-licensing-policy-preferences/11.04.02-co-owner-veto-approval.md) | [11.04.03 Policy fold](./11.04-licensing-policy-preferences/11.04.03-policy-conflict-resolution.md) | The fold operates over the grammar's **eight policy-bearing axes** and therefore **cannot fold buyer blocks** (they key on party identity, evaluable only at request time when a buyer exists); the grant-side `grantee` axis does not change this (11.08.01 D-18), and the effective-work-policy aggregate is incomplete by construction. | Musician, Producer | High | 11.04.02→11.04.03 (D-09/DT-07) |
| CX-19 | [11.05.01 Declaration](./11.05-sample-derivative-clearance/11.05.01-sample-declaration-identification.md) | [11.05.04 Interpolation](./11.05-sample-derivative-clearance/11.05.04-interpolation-replay-clearance.md) | Declaration is the **sole route in** — fingerprinting is structurally blind to a replayed/interpolated melody; the "a melody you played from another song" element type is the only mechanism by which an interpolation ever enters the system. | Musician, Producer | High | 11.05.01→11.05.04 (#CX-03) |
| CX-20 | [11.05.01 Declaration](./11.05-sample-derivative-clearance/11.05.01-sample-declaration-identification.md) | [11.05.05 Remix & Stem](./11.05-sample-derivative-clearance/11.05.05-remix-stem-bootleg-licensing.md) | Remixes are how derivation **cycles** become real (A samples B; B is a remix of A); the declaration layer must accept a cycle-creating declaration (D-12), not reject it. | Musician, Producer | Medium | 11.05.01→11.05.05 (state-race) |
| CX-21 | [11.02.03 Encumbrance](./11.02-clearance-one-stop-status/11.02.03-encumbrance-declaration.md) | [11.05.03 Negotiated clearance](./11.05-sample-derivative-clearance/11.05.03-negotiated-clearance-revenue-share.md) | **Clearance is not terminal** (correcting the breadth pass): a lapsing clearance re-encumbers a work with no user action and routes to 11.05.03 as a *renewal*, with pre-expiry warnings at 90/30/7 days — a Scheduled-Jobs consumer the breadth pass omitted. | Musician, Producer | High | 11.02.03→11.05.03 (DT-06) |
| CX-22 | [11.02.03 Encumbrance](./11.02-clearance-one-stop-status/11.02.03-encumbrance-declaration.md) · [11.05.01 Declaration](./11.05-sample-derivative-clearance/11.05.01-sample-declaration-identification.md) | [11.01.04 Holds & Pitches](./11.01-sync-licensing/11.01.04-holds-exclusivity-windows.md) | A declaration or encumbrance landing mid-hold **silently changes availability** — buyer AND pitcher must both be notified (fail-open leak), and it is the spite vector at its most valuable: a rival's live deal dies at declaration and the contest is slower than the dead deal. | Musician, Producer | High | 11.02.03→11.01.04; 11.02.01→11.01.04 |
| CX-23 | [11.04.01 Policy](./11.04-licensing-policy-preferences/11.04.01-per-work-licensing-policy.md) | [11.04.02 Co-owner veto](./11.04-licensing-policy-preferences/11.04.02-co-owner-veto-approval.md) | Refusal is checked **first** and if it fires nothing else runs; a new veto **withdraws in-flight quotes**, never merely future ones. | Musician, Producer | High | 11.04.01→11.04.02 (#CX-01) |
| CX-24 | [11.02.01 Clearance](./11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md) | [11.09 Cover](./11.09-cover-song-compulsory-mechanical.md) · [11.10 Print & Lyric](./11.10-print-lyric-rights.md) | The verdict must **decompose per rights side** — a combined master+composition verdict would suppress exactly the composition-only catalogue (covers, print/lyric) that survives cold-start and is a candidate beachhead (Q-04). | Musician | High | 11.02.01→11.09/11.10 (DT-07) |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** When referencing a CX entry from another file, use format `{filename}#CX-NN`.

---

## Cross-Cut Details

### CX-04: Scope Grammar ↔ everything (the domain's type system)

**Relationship**: The scope grammar (11.08.01) is not a feature of the instrument sub-domain that other things
happen to reference — it is the **shared vocabulary the entire domain is written in**. Policies (11.04.01) are
predicates over it. Rate cards (11.03.01) are functions from it. Clearance verdicts (11.02.01) are computed
per-(work, **scope**). MFN comparability (11.03.03) is a distance within it. The policy fold (11.04.03) can
only reconcile owners who "disagree in kind" because both project onto the same lattice. **The one thing the
grammar does *not* express is a refusal keyed on a counterparty (see CX-16) — which is why buyer blocks live
outside it.** It does name a party: `grantee scope` is its ninth axis. That axis is **grant-side only** — who
*an instrument* runs to — and **policies do not carry it**, so containment is evaluated over the **eight
policy-bearing axes** only (11.08.01 D-18, ratified 2026-07-30). The domain's type system therefore has two
lists, and both belong in any restatement of it: nine axes an instrument may carry, eight a policy may.

This is the domain's most load-bearing structural finding, and **the sweep did not contain it** — it listed the
certificate (candidate 17) but never the language the certificate is written in.

**Role scoping**:
- **Musician / Producer**: consume it constantly, in plain words, and should never see it
- **Operator**: not affected
- **Fan** (as creator buyer): never sees it — a creator licence is a fixed point in the space with no choices

**Synthesis questions answered**:
1. **Shared state conflict**: The grammar is platform-owned; every other node holds instances or predicates over it. No node may extend it locally — a domain-specific axis value would silently break the fold.
2. **Trigger chain**: Grammar evolution → new instances only. Instances pin their version at **request creation** and carry it unchanged through pricing to issue (11.08.01 D-03). A grammar change must never retroactively alter what an issued licence means — and must never reach an instrument mid-flight between quote and issue either.
3. **Permission intersection**: Policy and grammar must share the vocabulary or 11.04.03's fold has nothing to project onto — and the shared vocabulary is the **eight policy-bearing axes** (11.08.01 D-18). The exception is party identity: no axis lets an owner key a refusal on it, and the grant-side `grantee` axis is not one policies carry — CX-16/CX-18.
4. **Notification fan-out**: None — it is infrastructure.
5. **State transition conflict**: Same pinning rule as 11.03.01 D-02 (card pins at read) and 11.08.02 (the instrument carries the version pinned at **request creation**, per 11.08.01 D-03) — three instances of one pattern (P-02), and the grammar's pin sits upstream of the card's so the two cannot disagree.

### CX-12: The gate is the domain's single serialization point

**Relationship**: Every mutable input to a clearance verdict — policy edits, ceiling drops, vetoes, encumbrance
declarations, holds — can change *while a deal is in flight*. Rather than lock each input, the domain resolves
all of them at one place: **the gate's fresh re-check at the moment of issuance** (11.02.01 D-04). A cached
verdict never issues. Whatever the world looks like at that instant is the world the licence is minted against.

**Role scoping**:
- **Musician / Producer**: read-only on the gate itself; they set the inputs upstream and cannot force or block at the gate
- **Operator / Fan**: not affected (Fan sees an instant yes; a stale-then-failed deal renders as "unavailable")

**Synthesis questions answered**:
1. **Shared state conflict**: The verdict is *computed at issue*, never stored as durable truth. The instrument pins what the gate saw; the two are never reconciled after the fact.
2. **Trigger chain**: agree → gate re-check → (pass: mint + charge atomically | fail: refuse the agreed deal). The re-check failing an agreed deal is the correct, painful outcome, not a bug.
3. **Permission intersection**: Every upstream permission decision (policy, veto, consent, encumbrance) is finally enforced here; nothing downstream may override it, including the owner (11.08.02 DT-02).
4. **Notification fan-out**: A veto or encumbrance that lands *between* agreement and the gate and causes a refusal manufactures a dispute out of correct behaviour → 24 must be told (CX row to 24).
5. **State transition conflict**: This *is* the domain's answer to the race problem — serialize at one choke point instead of locking N inputs.

### CX-13: Attestation is the only underivable verdict input, and it is versioned

**Relationship**: Computation can derive everything about a work *except whether the party list is complete* —
splits summing to 100% proves nothing about a *missing* party (11.02.02 the whole reason it exists). Attestation
supplies that one fact. Because the party set can mutate, an attestation carries the **party-list version** it
was made against.

**Role scoping**:
- **Musician / Producer**: the Producer is the best-informed attester (holds the stems, knows the room)
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: The registry (09) owns the party set; the attestation is a *claim about* a specific version of it. Owner of the claim = the attester; owner of the fact = 09.
2. **Trigger chain**: party added → prior attestation superseded, not edited (P-02); a stale attestation is rejected **invalid-on-arrival with a diff**, never silently reattached to the new version. No valid attestation → verdict `incomplete` (fails closed).
3. **Permission intersection**: Attestation requires a *verified identity* (01) — attribution is the entire deterrent; an unverified attestation is strictly worse than none (a badge implying trust with no teeth).
4. **Notification fan-out**: DT-04 — non-response never improves state; consent starts at "no", attestation starts at "unproven".
5. **State transition conflict**: An addition always wins the race against a stale attestation.

### CX-14: The scope-intersection invariant (taint has a ceiling, and it is named)

**Relationship**: When a work is built on cleared upstream material, the downstream licence cannot grant more
than the upstream permitted. Formally: **downstream scope ⊆ ⋂(upstream clearance scopes)**. The gate enforces
this and, when it clips, *names the ceiling* rather than failing opaquely ("available for up to 3 years, not
10"). The intersection is only expressible because both sides speak the scope grammar (CX-04).

**Role scoping**:
- **Musician / Producer**: sees the ceiling as a concrete limit, not a mysterious refusal
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: Upstream clearances (11.02.03/11.05.03) own their scopes; the downstream gate reads them and computes the intersection — it never mutates upstream scopes.
2. **Trigger chain**: request scope > intersection → refuse, naming the tightest binding axis. A partial fan-out leaves descendants `unknown`, never clearable (fails closed).
3. **Permission intersection**: This *is* the permission rule for derivative works — you cannot license out more than every source licensed to you.
4. **Notification fan-out**: none at compute time; a *lapse* upstream re-encumbers downstream (CX-21) and that fans out.
5. **State transition conflict**: An upstream clearance lapsing shrinks the intersection with no downstream action — perishable, per P-01.

### CX-15: Auto-approve + MFN can bind co-owners who never saw the deal

**Relationship**: MFN says "if you gave anyone better terms, I get them too." Auto-approve says "sell my share on
these standing terms without asking me." Compose them and an owner's *automatic* acceptance of a cheap deal can,
via a co-owner's MFN clause, **reprice the co-owner's share** — and auto-approve is exactly the mechanism that
removed the human MFN would otherwise have alerted. This edge did not exist in the breadth pass.

**Role scoping**:
- **Musician**: the persona 11.04 most serves (many small stakes) is also the one most exposed here — their convenience feature can move a co-owner's economics
- **Producer**: same, master side
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: Two owners' deal terms are coupled by the MFN clause; neither "owns" the coupling — it is a term of the work's deal history.
2. **Trigger chain**: owner A auto-approves deal at rate R → MFN holder B's floor drops to R → B's future (and MFN-retroactive) deals reprice. If this must roll back, it is a dispute (24), not a system undo.
3. **Permission intersection**: A's permission (auto-approve on A's share) produces an economic effect on B's share — the sharpest case of a permission crossing a share boundary.
4. **Notification fan-out**: **B must be told** — an MFN reprice caused by A's automation is invisible to B otherwise (the "your catalogue is quietly earning less" hazard, P-01).
5. **State transition conflict**: Concurrent auto-approvals across shares under mutual MFN must resolve at the gate (CX-12) or produce inconsistent floors.

### CX-16: Buyer blocks break "the policy key space is the grammar"

**Relationship**: 11.04.01 asserts the policy key space *is* the scope grammar. That holds for **category blocks**
("no tobacco", "no political ads") — they are predicates over the media/usage axes. It is **false for buyer
blocks** ("never license to BrandCo"), because the grammar carries **no axis an owner can key a refusal on a
counterparty with**. Buyer blocks key on *party identity*, which lives in 01, not in the grammar. This is a
correction owed on the 11.04.01 text, not a design gap — but it must be written down or two files contradict.

**The axis count in the breadth-pass version of this entry ("six axes: media/territory/term/exclusivity/usage/
scale") is superseded** — 11.08.01's depth pass carries **nine** (adding data use, extent of use and grantee
scope; D-06/D-15/D-17). The correction is not only arithmetic: **grantee scope** names a party (licensee plus
permitted assignees/sublicensees), which is the thing this entry and 11.04.02 D-09/DT-07 assert the grammar
does not have. **Resolved 2026-07-30 by [11.08.01 D-18](./11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md),
answering 11.04.02 Q-07: the grantee axis is GRANT-SIDE ONLY.** It says who *this instrument* runs to and is
not a value space an owner authors refusals in; **policies do not carry it**, so of nine axes only **eight are
policy-bearing** and containment is evaluated over those eight. The rationale is 11.08.01 DT-15's own — it
argues the axis end to end from **delivery** failure (an agency licence that does not run to the brand is
worthless paper) and never from refusal. **Every behaviour below stands unchanged**; only the premise under it
is restated. Two things travel with the resolution and are recorded in 11.08.01 rather than here: the
**asymmetry** — the grammar carries an axis policies deliberately ignore, and leaving that implicit is what
raised Q-07 — and the **containment rule**, without which 11.08.01 D-04 (`unspecified` fails containment)
would make a grantee-less policy, which is every policy, contain no request at all.

**Role scoping**:
- **Musician / Producer**: experience one "block" surface but two evaluation regimes underneath
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: Category blocks fold over the grammar (11.04.03); buyer blocks cannot fold (CX-18) — they resolve against a buyer identity (01) at request time.
2. **Trigger chain**: category block → evaluable at policy-set time and foldable into effective-work-policy; buyer block → evaluable only when a named buyer exists.
3. **Permission intersection**: Both share the *block engine*, not the *key space*. Making a policy key on a counterparty would break the fold; making the fold operate over identity is structurally impossible (identity is not a lattice point). 11.08.01 D-18 forecloses the first by keeping `grantee scope` out of every policy, so this stays a statement about the design rather than a risk to manage.
4. **Notification fan-out**: A buyer block's free-text reason is disclosed to co-owners (D-13) → it is UGC on a surface with a named target and is reportable to 24 (though the block itself is never moderated, only the prose).
5. **State transition conflict**: A buyer block survives its author's death (01.10 tombstone); the estate's scoped access is what makes lifting possible.

### CX-21: Clearance is not terminal — it perishes and renews

**Relationship**: The breadth pass modelled clearance as a one-time terminal event. Depth found it is
**perishable**: a licensed clearance has a term, and when the term lapses the work **silently re-encumbers** with
no user action. The renewal route is 11.05.03 (negotiated clearance), reused as a re-clearance flow. This makes
11.02.03 a *consumer of the Scheduled-Jobs cross-cut* (pre-expiry warnings at 90/30/7 days) — which the breadth
pass omitted because it assumed clearance never expired.

**Role scoping**:
- **Musician / Producer**: must be warned before the lapse, not after — the classic "perishable state warns its owner" case (P-01)
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: The clearance record (11.02.03) owns the term; the scheduled-jobs cross-cut owns the clock. Neither mutates the other's data.
2. **Trigger chain**: term reaches T-90/T-30/T-7 → warn owner; term lapses → work re-encumbered → any downstream licence's intersection (CX-14) shrinks.
3. **Permission intersection**: A lapsed clearance revokes nothing already issued (licences are irrevocable, D-06) but blocks *new* issuance on the tainted work.
4. **Notification fan-out**: The exposed set is the notification set (11.02.03) — one message per owner per encumbrance, listing all affected works, never one per work.
5. **State transition conflict**: A renewal negotiated during the warning window races the lapse; the gate (CX-12) is the serialization point.

### CX-03: Policy ↔ Pricing (the evaluation order)

**Relationship**: **Refusal is evaluated before price, and if it fires nothing else runs.** A tobacco block is
not a high price; it is a refusal at any price. The two must stay distinct objects (11.03.01 DT-01) because
merging them makes refusal expressible as a number — which implies a big enough offer should work, and quietly
converts a moral-rights position into a negotiating one.

**Role scoping**:
- **Musician**: the refusing party usually has the least leverage and the strongest feelings — the asymmetry this rule protects
- **Producer**: needs to see blocks early, not at deal time
- **Operator / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: Policy and cards are separate records with separate authors and semantics. Neither is a field on the other.
2. **Trigger chain**: request → policy → (refused: stop) → price → quote. A block set mid-flight *withdraws* in-flight quotes.
3. **Permission intersection**: Refusals are absolute and unweighted; a 1% owner blocks as hard as a 90% owner.
4. **Notification fan-out**: A block kills other owners' earning capacity; they must be told (11.04.03 D-04).
5. **State transition conflict**: Block racing an issuance — the gate's fresh re-check (CX-12) is the serialization point.

### CX-01: Clearance ↔ Instrument (the gate)

**Relationship**: Every route in this domain — sync, sample, cover, creator, AI — terminates in an instrument,
and every instrument passes the same gate. That single choke point is what makes "one-stop" mean something: one
definition of clearable, evaluated once, fresh at the moment money moves. The gate also enforces two invariants
the instrument carries: **at-most-one-exclusive-per-(work, exclusivity scope)** (two irrevocable contradictory
exclusives have no remedy) and **no-charge-without-licence / no-licence-without-charge**.

**Role scoping**:
- **Musician / Producer**: read-only on both sides — they configure inputs upstream, cannot issue or withhold at the gate
- **Operator**: not affected
- **Fan** (as creator buyer): experiences the gate as an instant yes; a no renders as "unavailable"

**Synthesis questions answered**:
1. **Shared state conflict**: The verdict is computed, not stored as truth — the instrument pins the verdict it saw at issue.
2. **Trigger chain**: gate → mint → payment, atomically (11.08.02 D-03). A cached verdict never issues.
3. **Permission intersection**: The gate is where every upstream permission decision is finally enforced; nothing downstream may override it (11.08.02 DT-02).
4. **Notification fan-out**: Issuance notifies rights holders after the fact — for policy-approved licences, the receipt is the first notice (11.04.01 DT-02's hazard).
5. **State transition conflict**: Clearance degrading between agreement and issuance is a real event; the gate refusing an agreed deal is the correct, painful outcome (see CX-12).

---

## Domain-Wide Patterns

> Patterns that recurred across unrelated sub-domains. Each was found independently at least twice, which is what
> distinguishes them from local rules. **They are candidates for the global CX file.**

### P-01: Perishable state must warn its owner, not only its counterparty

Found four times, from one persona insight. personas.md's Operator anti-persona — *"forgets to release a hold,
blocking a slot they'd happily have sold"* — reappeared structurally in:

- **11.01.04 DT-02** — a forgotten sync hold freezes a work; the *owner* loses the sale silently
- **11.08.04 DT-02** — an unattended licence expiry is a renewal the owner never knew was available
- **11.04.03 D-04** — an owner whose policy is inert believes their catalogue earns when it is dead
- **CX-21** — a lapsing clearance re-encumbers a work with no user action; warn at 90/30/7 days

A supply-side lesson from a venue-booking persona generated the same requirement in four features with nothing
else in common. **State it once at platform level.**

### P-02: The old record always survives — supersede, never edit

Found four times:

- **11.02.02 D-01** — adding a writer supersedes an attestation; the old one is evidence of what was claimed and when
- **11.08.04 D-01** — an amendment supersedes a certificate; other parties relied on the original
- **11.03.01 D-02 / 11.08.01 D-03** — cards and grammars pin at read/issue; a later edit never mutates an issued instance
- **11.08.04 Q-02** — explicitly escalated as a candidate platform invariant

This is a platform-level invariant, not a domain-11 rule — the provenance thesis (D-18) applied reflexively to
the platform's own records. **Already present as a constraint on the registry's Verified-Credit-as-Evidence and
Audit-Log mechanisms** — this pass confirms it holds inside licensing too.

### P-03: Availability changes silently under an in-flight deal (fail-open leak)

Found three times, as a *fail-open leak* rather than a designed behaviour:

- `11.01-sync-licensing-cx.md#CX-03` — a hold granted while the search index still shows the work available
- `11.02-clearance-one-stop-status-cx.md#CX-01` — an attestation invalidating while a work is under hold or pitch
- `11.04-licensing-policy-preferences-cx.md#CX-02` — an aggregate recompute killing a live negotiation

CX-22 is a fourth instance and the highest-stakes: a declaration/encumbrance kills a rival's live deal and doubles
as a spite vector. **One architectural requirement, not four bugs** — flagged 11.04.03 Q-03, routed to
`/create-prd-architecture`.

### P-04: Same block engine, divergent defaults — a latent contradiction

Category blocks, buyer blocks, and AI-training consent all reuse one refusal engine but **disagree on the
default and the key space**:

- **Category blocks** (11.04.02) — key on the grammar's eight policy-bearing axes; default *empty* (permitted); foldable
- **Buyer blocks** (11.04.02) — key on party identity (01), never on the grant-side `grantee` axis (11.08.01 D-18); default *empty*; **not** foldable (CX-16, CX-18)
- **AI-training consent** (11.07.01) — same engine, default *refused* (opt-in) (CX-17)

Two files (11.04.01 and 11.07.01) currently describe the same engine with contradictory defaults. **The consent
engine must be unified with an explicit per-category default, or the platform ships two block systems that will
eventually disagree about refusal.** Routed to `/create-prd-architecture`.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 11.03 Pricing | 11.04 Policy (merge) | The strongest merge candidate in the domain, considered twice (11.03.01 DT-01, 11.04 D-02) and rejected both times. A card answers **how much** and a policy answers **whether at all** — not points on one scale. Merging yields the absurd "set your price for tobacco ads: [never]", and makes refusal expressible as a number. Their real relationship is evaluation *order* (CX-03), not shared structure. |
| R-02 | 11.01 Sync | 11.06 Creator (shared catalogue) | Considered: one catalogue, two checkout modes. Rejected on three axes (11.06.01 DT-01) — **search paradigm** (reference-track vs video-context), **price mechanism** (negotiated vs flat-and-never-negotiable), **product** (permission vs the absence of a claim). A shared catalogue with a "simple mode" would drag negotiation, MFN and clearance vocabulary into a surface whose entire premise is their absence. |
| R-03 | 11.05 Sample Clearance | 11.09 Cover Songs | Both are "using someone else's song", but **consent is the axis and they sit at opposite ends.** Sampling requires permission that can be refused at any price; covering requires no permission at all (compulsory regime removes the veto). Modelling them together would put a consent step in a flow that legally has none (CX-10). |
| R-04 | 11.07 AI Training | 11.04.02 Veto (parallel consent) | Rejected as a *system*, confirmed as an *identity*: "never AI training" **is** an 11.04.02 category block — same mechanism, same per-share scope, same unanimity fold. Building a parallel AI consent engine would give the platform two systems that must agree about refusal and will eventually not. 11.07 contributes the *category and surrounding product* (corpus, compensation), not a second consent model. **Note the default mismatch — CX-17/P-04.** |
| R-05 | 11.11 Grand Rights | 11.08.01 Scope Grammar (as a media value) | Rejected (11.11 DT-02): grand rights carry **treatment approval** — a subjective, ongoing creative veto the grammar cannot express and no machine can check. Adding it as a media axis value would let the system auto-approve a licence whose defining term it cannot represent. The one licence type not reducible to scope. |
| R-06 | 11.02.02 Attestation | 11.02.04 Consent Routing | An attestation is a **claim about a fact**; a consent is a **decision about a permission**. Different failure modes (false claim vs withheld permission), remedies (contest vs escalate), actors (the knower vs the owner). Merging them makes "I confirm nobody is missing" and "I agree to this deal" one object — how consent theatre gets built. |
| R-07 | 11.10 Print & Lyric | 11.05 Sample & Derivative | The *rights basis* is the same (composition) but the transaction is not: print/lyric licenses the work **as text or notation to be reproduced**, not as material to be built on. A lyric aggregator displays the original; they are not making a derivative. Moving 11.10 under derivatives would imply an interaction it does not have (11.10 DT-02). |
| R-08 | 11.04.01 Category policy | 11.04.02 Buyer blocks (single "policy" object) | Considered — both are refusals set in advance. Rejected, and the rejection **survives 11.08.01 D-15's grantee axis**: category blocks key on the grammar's **eight policy-bearing** axes and **fold** across owners; buyer blocks key on party identity (01) and are only evaluable at request time. The grantee axis does not merge them — it is **grant-side only** and no policy carries it (11.08.01 D-18, CX-16). Merging would force a policy-keyable counterparty into the grammar (breaking the fold, CX-04) or force the fold to operate over identity (structurally impossible, CX-18). They share the block **engine**, not the key space. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-13|D-13]]
