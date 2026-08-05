# DQ-R2-01 — Owner Decision Brief

> **Date**: 2026-07-29 · **Type**: Architecture (data model) — options presented, owner decides.
> **Source entry**: [run2-blocking-decision-queue.md](./run2-blocking-decision-queue.md) `DQ-R2-01`
> **Question**: On a representation edge, what is the relationship between the mandate's **seven
> activity verbs** (`01.03.03` D-01, ratified DQ-02.3) and the **five commercial-domain scope** the
> same edge names (`01.03.02` Behavior line 25)?
>
> **OUTCOME — RATIFIED 2026-07-29**: Option **A′**, two flat axes conjoined at the call site, by the
> owner. Option **A** (the run-2 draft's full cross-product) **REJECTED**. Recorded in
> [decision-ratification-log.md](./decision-ratification-log.md) `DQ-R2-01` and globally as
> `ideation-index.md` D-75. Where this brief and that record differ, the record governs.

---

## Verdict: the finding is REAL, and the draft understated it

The adversarial pass **confirmed** the finding on every count and found it stronger than written. It is
not "two vocabularies that were never reconciled" — it is an **internal contradiction across three
normative statements in the same sub-domain**, none of which carries an open marker:

| # | Line | What it says | Reading it forces |
|---|---|---|---|
| 1 | `01.03.02`:25 | "…carries: scope (which activities — live booking, recording, publishing, sync, merch), territory, term (start, end, notice), **a mandate (01.03.03)**, and optionally commercial terms (commission)." | Scope and mandate are **two sibling items** on one edge. |
| 2 | `01.03.02`:76 | "scope **is** the mandate; term-bounding is what membership lacks." | Scope and mandate are **the same field**. |
| 3 | `01.03-cx`:11 (CX-02) | "Representation scope **IS** a mandate, additionally bounded by term and territory." | Same field again — and it moves *term* **outside** the mandate, contradicting `01.03.03`:25, where term is a mandate dimension. |

Reading 2/3 is **unsatisfiable as written**: if scope *is* the mandate, then scope values must be
mandate activity values — but that enum is **closed at seven** (`01.03.03` D-01, ratified DQ-02.3) and
none of `live booking / recording / publishing / sync / merch` is in it.

Five candidate refutations were tested and all five failed:

- **"It is already stated, the auditor missed it."** No. `01.03.03`:25 enumerates exactly four scope
  dimensions — activity (seven verbs), value ceiling, party, inherited term. There is no commercial-domain
  axis. Worse, the mandate file's own coherence rule commits the same conflation rather than resolving
  it: `01.03.03`:29 — "A manager with **live-booking scope** cannot sub-delegate **recording scope** they
  never had." Mirrored at `01.03-cx`:54.
- **"Line 25 is illustrative prose."** No. It is a declarative modelling rule in the Behavior section,
  ratified by D-02 (`01.03.02`:89), and it is **operative**: `01.03.02`:34 — "Every scope item is shown as
  a plain-language statement of what the manager will be able to do on their behalf." Illustrative prose
  does not generate a consent screen.
- **"It is settled elsewhere."** No. `grep` for the five-domain list across all **1,122** ideation files
  returns **exactly one line** (`01.03.02`:25). `decision-ratification-log.md` has **zero** hits for
  representation-edge scope. Verified.
- **"The two are at different levels, which is itself the answer."** No — this is the strongest
  disconfirmation. The level relationship is stated **three mutually incompatible ways** (table above).
- **"It is a tracked `[OWNER]` deferral."** No. `01.03.02`'s only two `[OWNER]` questions are Q-01
  (commission and the sunset tail, :97) and Q-02 (on-platform signing, :98); its only `[PENDING]` (:51) is
  a last-write/notify rule. **The gap has no marker in its own file.** Silent, not deferred.

**This is not the stale-parent-marker pattern, and the polarity is reversed.** In the known stale cases a
parent flags pending while a `[DEEP]` child already answers. Here the parent CX carries **no** pending
marker and asserts a confident settled identity, while the child it points to omits the axis entirely.
Both files are `[PARTIAL]` (`01.03.02`:5, `01.03.03`:5); neither is `[DEEP]`.

**Why it blocks.** `01.03.03`:32 — "Enforcement is not here. **This file produces the answer**; the
cross-cut asks the question at every call site." The file that produces the answer has no domain axis;
the edge that consumes it names five domains. The Roles & Permissions resolver therefore has **no
defined shape for representation-edge authority**.

---

## Correction: the draft's recommendation is wrong as written

The draft recommends Option A (verbs × domains crossed) on the stated grounds that it "**disturbs no
ratified decision** — the fix is a terminological rename" (queue :33, :38-39). **That claim is false on
three independent counts, and one of its two supporting arguments is circular.**

**1. A 7 × 5 cross-product IS the permission matrix that was already rejected by name.**

- `01.03.03` D-01 (:108): "Mandates are coarse (…), **not a granular matrix**."
- `01.03.03` DT-02 (:91): "❌ REJECTED — a permission matrix is a thing no band will ever configure, so
  every band would run on defaults, and the feature would be decorative." Same annotation, at DQ-02.3,
  logged the residual explicitly: "**seven** plain-language statements per member is **closer to the
  matrix this annotation dislikes** than four would have been."
- `01.03.03` D-02 (:109): "Authority is stated in plain language, **not as a permission grid**."
- `01.03.03`:54: "mandates are shown as plain-language statements, **not a checkbox grid**."

Seven was already conceded to be near the tolerance limit. A cross-product is **35 addressable cells per
grant**, and `01.03.02`:34 requires every scope item to render as a plain-language sentence on the
artist's consent screen. Because the enum is promoted to global **D-69** (`ideation-index.md`:254),
re-opening it is not a local edit.

**2. It breaks the one-mechanism rule the merge exists to protect.** A makes membership authority a bare
verb and representation authority a `(verb, domain)` pair — two different types. That is exactly what
`01.03-cx`:12 (CX-03: "the authority arriving by each must be **indistinguishable** to the enforcement
cross-cut"), `01.03-cx`:62 ("A party's authority set is the **union** of what arrives via membership and
what arrives via representation") and `01.03.02` DT-02 (:69: "identical authority … must not be authorised
by two different mechanisms") forbid. A does not say how the union of a verb and a `(verb, domain)` pair
is computed.

**3. Its product-promise argument is half-circular.** The **verb** half of the promise is real and quoted:
`01.03.02`:16 — "my manager can book but not sign." The **domain** half — "for live but not publishing" —
appears **nowhere in the 1,122-file tree**; it exists only inside DQ-R2-01's own pros cell. `grep` for
`but not publishing|live but not|for live but` returns **0 lines**. So the promise cannot be cited to
justify the exact half A is meant to establish.

**Two collisions the draft never costs:**

- **A third scope vocabulary already exists and is ratified.** Domain 17 models representation scope as
  "structured filters (**territory set + work-type enum**)" (`17.08.01`:35-36). A **resolved** question
  (`17.01.01`:302) and a **ratified** decision (`17.01.01` D-11:289) both stand on it. A locks a
  five-value list without reconciling it, which would mint a **fourth** vocabulary rather than reconcile
  two. "work type" appears on only 17 lines tree-wide and its membership is **never enumerated**.
- **`administer` × `publishing` is a grant another ratified decision forbids.** `09.01.04` D-06 (:250):
  "Only the writer may create or modify the publisher rows anchored to their own share — no co-writer, no
  Producer, **no admin override**." Against `01.03.03`:48: "**The seed includes `administer`.** Any
  confirmed permanent member can therefore alter another member's mandate, invite, and remove." Adding a
  `publishing` domain makes this collision explicit. A carve-out must be written at one end.

Also: **A must delete `01.03.02`:76 and restate CX-02** (`01.03-cx`:11, :43, :54). The queue's downstream
list omits the sub-domain CX entirely, and the entry never mentions CX-02 or the "scope is the mandate"
identity (zero hits). Ratifying A as drafted would leave three lines asserting a superseded identity.

**None of this makes the two-axis idea wrong.** Options B and C are independently refuted below. It makes
the draft's *form* of the two-axis idea wrong: presented as free, presented as a cross-product, presented
without the 09 and 17 collisions.

---

## Options

| Option | What it means | Pros | Cons |
|---|---|---|---|
| **A — Cross-product, as drafted** | Edge carries a mandate (7 verbs) **and** a domain scope (5 domains); authority is the cross-product `verb ∈ mandate AND domain ∈ scope`. Rename `01.03.02` "activities" → "domains". | Matches `01.03.02`:25, which already names both on the edge. Verbs (actions) and domains (areas) are genuinely different axes. | **35 cells per grant = the matrix `01.03.03` DT-02 rejected and D-02 forbids rendering.** Makes membership and representation different types, breaking CX-03's indistinguishability and the CX-03 union. Its "disturbs no ratified decision" claim is false. Ignores 17's ratified work-type enum. Does not cost the `administer`/D-06 collision. |
| **A′ — Two flat axes, conjoined at the call site** *(recommended)* | Same two axes, but **never crossed as a configurable grid**: a grant is one flat verb set **plus** one flat domain set (7 + 5 = up to 12 plain-language statements, not 35). The resolver evaluates the conjunction at the call site. **Membership edges read as all-domains** (explicit universal rule, not silence). Rename "activities" → "domains"; delete `01.03.02`:76; restate CX-02 as a conjunction. | Satisfies DT-02/D-02: nothing renders as a grid, and the statement count grows from 7 to ~12, not 35. Restores CX-03: both edge types resolve to the same `(verbs, domains)` shape, so the union is defined. Keeps D-01/D-69 intact — no enum repeal. Keeps every existing normative line either unchanged or more determinate. | Still adds a second conjunct at every representation call site. Still requires the `administer`/`09.01.04` D-06 carve-out and reconciliation against 17's work-type enum. Territory/term/commission stay edge-level, so they cannot vary **per domain** on one edge. |
| **A″ / H1 — Domain is the edge's identity, not a field on it** | A representation edge is **single-scoped**: one edge per commercial domain. `(representing party, represented party, ONE domain, territory, term, mandate, commission)`. Multi-domain representation = multiple edges. Mandate stays the seven verbs, untouched. | **Resolves the :25 vs :76 contradiction without deleting either line** — per single-scoped edge, "scope is the mandate" becomes coherent. Makes `01.03.02`:44's conflict test computable as a **uniqueness key** on `(represented party, domain)`, which is what its copy already implies: "{Artist} already has live booking representation." Matches `01.03.02`:27, where the roster is already a per-domain reverse view ("granted it **live-booking** representation", singular). Lets territory/term/commission vary per domain, which A′ cannot. `01.03.03` needs **no** new scope dimension. | Multiplies edges against a **consent artifact**: `01.03.02`:50 — "the edge *is* the represented party's consent (D-01)" — so one consent act mints N edges. Requires rewriting the Happy Path (`01.03.02`:33 requests "scope (live + recording)" as one edge). Makes `01.03-cx`:69's already-`[PENDING]` ceiling-union arithmetic span N edges instead of 2. |
| **B — Domains for representation, verbs for membership; no crossing** | Representation scoped by the 5 domains only; the 7 verbs are membership-only. | Simplest mental model per edge type. | **Refuted.** `01.03.02`:36 performs verb-level scoping *on a representation edge*: "replying to booking enquiries, but not, say, **signing away masters**, unless that scope was granted." Also contradicted by :25 carrying "a mandate (01.03.03)" on the same edge. Breaks the one promise the feature verifiably makes (:16). |
| **C — Collapse to one vocabulary** | Map the 5 domains into the 7 verbs (or vice versa); one scope dimension. | One list to learn and enforce. | **Most expensive by a wide margin.** Repeals globally ratified D-69 (`ideation-index.md`:254), `01.03.03` D-01/D-07..D-10, identity-domain D-09, and DQ-02.3 itself; reopens at least three questions closed *on the enum's strength* (`17.09.05`:332, `04.03.01`:213, `11.02.02`:220). Semantically wrong regardless: publishing is not an action, `sign` is not an area. |
| **D — Domains as presets that expand to verb sets** | The 5 domains are UI presets; each expands to a verb subset. One axis at the resolver. | Sourced by `01.03.02`:34 (domain is the input, plain language is the authority). Keeps one mechanism, satisfying DT-02. | Requires authoring a 5-preset → verb-subset table (up to 35 cells) that **no source supports** — it becomes a new owner decision rather than closing this one. And the label must persist anyway: `17.08.01`:71 — "Scope must be structured, or nothing can be filtered." Once persisted and read by the royalty pipeline, the "display token" is load-bearing for money and drifts back to A′. |
| **G — Defer to `/create-prd` with a tracked contract** | Add markers; decide downstream. | 1–3 file edits. Zero ratified decisions disturbed. | **Removes zero ambiguity** and leaves the three-way contradiction standing. Refuted by observed cost: the question is already routed downstream in five places, and while it waited, `04` invented "posting/submit/casting authority", `17` invented negotiate/bind and publish/hold/confirm, `07` invented `roster:write`, `20` invented `fan:merge`. Deferring further **multiplies vocabularies** rather than deferring one decision. |

*(Option E — a sparse per-verb domain map — is strictly dominated by A′: same file surface, plus two
invented rules, plus a hand-maintained applicability table no source defines.)*

### Cost, cheapest first

`G < A′ ≈ A < D < A″ < B < C`. Measured edit surface: the five-domain list occurs on **1 line in 1 file**,
so the rename itself is trivial. `01.03.02` is cited by 14 files, `01.03.03` by 34; **23 files** use
"activity/activities" in the seven-verb sense (including `ideation-index.md` and `ideation-cx.md`), so the
term collision the rename ends is one-directional — the second meaning is spread across 23 files that need
confirming, not editing. A′'s core is ~3 files; full propagation ~15.

---

## Recommendation

**A′ — two flat axes, conjoined at the call site, with membership edges explicitly universal-domain.**

Three independent lines of evidence force a **two-axis** commitment, so B, C and G are out: `01.03.02`:36
performs verb scoping on a representation edge (kills B); D-69 makes the enum global (kills C); and five
downstream files already invented local authority vocabularies while the question waited (kills G). Of the
two-axis forms, A′ is the only one that satisfies **every** ratified constraint simultaneously — DT-02's
no-matrix rule and D-02's plain-language rule (≈12 statements, never a grid), CX-03's indistinguishability
and union (both edge types resolve to one `(verbs, domains)` shape), D-01/D-69 (no enum repeal), and 17's
requirement that scope be structured enough to filter. It is also the form under which every existing
normative line either survives unchanged or becomes **more** determinate: `01.03.02`:25 already names both
axes, `01.03.03`:29 already reasons in domain scopes, and `01.03.02`:34's "every scope item" already
implies a set.

**Why the draft was wrong:** it picked the right axis count and the wrong shape, then asserted a cost of
zero. A cross-product is the artefact `01.03.03` DT-02 rejected by name, its cross-type asymmetry breaks
the CX-03 union the sub-domain merge exists to protect, and its "manager can book for live but not
publishing" justification is a sentence that appears nowhere in the tree outside the proposal itself.
A′ keeps the draft's insight and drops the three claims that do not hold.

**Three obligations attach to A′ regardless of anything else, and must be written in the same pass:**

1. An **explicit universal-domain rule for membership edges** — "membership carries no domain scope and is
   read as all domains." Silence here is what makes the CX-03 union undefined.
2. An **`administer` carve-out** at one end of the `09.01.04` D-06 / `01.03.03` D-07 collision.
3. A **restatement of `01.03.02` D-02 over both axes** (`01.03.02`:89). It read "Representation edges are
   scoped, territory-bounded and term-bounded" before this propagation, and it is the decision that must
   name the two axes. **Corrected 2026-07-29**: this obligation previously named a D-03 restatement. The
   scope decision is `01.03.02` **D-02**; `01.03.02` D-03 is about optional signed terms, is out of scope,
   and is preserved untouched.

**A″ is the serious runner-up, and the owner should know why.** It is the only option that repairs the
:25-vs-:76 contradiction without deleting a normative line, and the only one under which `01.03.02`:44's
conflict test is computable. It loses on one point: it re-shapes the consent artifact (`01.03.02`:50), which
is a heavier change to a ratified model than adding a field. If the owner would rather not delete :76, A″
is the right pick — the axis commitment is identical either way, and that is the first open sub-question
below.

---

## What this changes downstream

**Core — the reconciliation itself (3 files):**

| File | Lines | Change |
|---|---|---|
| `…/01.03.02-representation-roster-relationships.md` | 25, 27, 33, 34, 44, **76**, 89 | Rename "activities" → "domains"; add the conjunction rule; **delete :76's "scope is the mandate"**; fix the three spellings of one token (`live booking` :25 / `live-booking` :27 / `live` :33); state :44's conflict granularity; restate D-02. |
| `…/01.03.03-mandate-scope-delegated-authority.md` | 25, 29, 110, 114 | Add the domain dimension to the scope tuple (A′) *or* record that domain lives on the edge (A″); restate :29 over both axes; restate D-03; state D-07's domain scope. |
| `…/01.03-membership-representation-mandate-cx.md` | **11 (CX-02)**, 43, 54, 62 (CX-03), 69 | Restate the asserted identity as a conjunction; define the cross-type union; resolve or re-point the `[PENDING]` ceiling-union arithmetic. **Omitted entirely from the queue entry's downstream list.** |

**Propagation (~12 more files):** `01.03-membership-representation-mandate-index.md`:5 (status), :50 (D-04) ·
`01.01.03-acting-context-switcher.md`:35-36 (the derivation predicate — an existence test that is
one-dimensional today) · `identity-profiles-organizations-cx.md`:290 (non-escalation arithmetic), :297,
:368 · `04.03.01-structured-submission.md`:213 (one line: membership carries no domain axis) ·
`05.05.03-subcontracting-agency-brokered-engagements.md`:40, 52, 58, 68, 74 · `09.01.04-publishing-rights.md`:250
(the D-06 carve-out) · domain 17, seven files that read representation scope as an authority or filter input:
`17.01.01`:189, 289, 302 · `17.02.03`:104 · `17.08.01`:35-36, 71, 121 · `17.08.03`:28, 54 · `17.08-cx`:12,
76-77, 84-86 · `live-booking-settlement-cx.md`:447, 450-452, 661.

**Ratified decision ids affected** (all *restated or bounded* under A′ — none repealed):
`01.03.02` D-02 · `01.03.03` D-01, D-03, D-07 · `01.03` index D-01, D-04 · sub-domain CX-02, CX-03 ·
global **D-69** (`ideation-index.md`:254) · identity-domain D-09 · `17.01.01` D-11 · `17.02.03` D-02 ·
`09.01.04` D-06 · **DQ-02.3**. Under Option C, the same list is a **repeal** list.

**Not resolved by any option here** — orthogonal, must not be presented as closed by ratifying this:
`01.01.03` Q-03 (`[OWNER]`, :218 — the enum has **no communication verb**, so granting `book` silently
grants the right to speak as the party) · `17.08.01` Q-02 (`[OWNER]`, :121 — is representation scope
structured **at all**, or free text?) · `01.03.03` Q-02 (:124, per-type grants on a multi-type org) ·
`01.03.02` Q-01/Q-02 (:97-98, commission and on-platform signing).

**Three record defects found while verifying this entry** (housekeeping, not owner decisions):

1. **`DQ-02.3` is ambiguous across records.** `blocking-decision-queue.md`:148 labels the *value-ceiling*
   axis DQ-02.3; `decision-ratification-log.md`:265 labels the *activity enum* DQ-02.3. The spec tree
   follows the **log**, so the log is the operative namespace. Any future citation of "DQ-02.3" needs the
   queue renumbered or a mapping note.
2. **`ideation-ambiguity-report-run2-interim.md`:37 misattributes this gap to DQ-04.** DQ-04 is a domain-02
   credit-contest entry (DQ-04.1/.2); the separate DQ-04.01–.07 series is domain-17 live/fan. Neither
   namespace mentions mandate verbs, representation edges, or commercial domains. The relevant
   ratifications are **DQ-02.3–.7**. The gap description is accurate; the provenance is not.
3. **`DQ-02`'s affected-files list (`blocking-decision-queue.md`:182) omits `01.03.02`** — the one file that
   names the five-domain scope. That omission is the plausible mechanism by which this gap survived the
   DQ-02 propagation pass, and it is worth checking whether other DQ entries are similarly under-scoped.
   Relatedly, `remediation-state.md`'s "0 needs-architecture-decision" should state its scope boundary, so
   it is not read as "no architecture decisions outstanding anywhere" while DQ-R2-01 is open.

---

## Open sub-questions

Both remain genuinely open **after** picking a two-axis option, and both are load-bearing.

**1. Is the domain a field on one edge (A′), or the edge's identity (A″)?** This is not cosmetic. It decides
three things: whether `01.03.02`:44's two-agent conflict test is a **uniqueness key** on
`(represented party, domain)` — which its own copy implies, "{Artist} already has live booking
representation" — or a set-intersection whose granularity must be defined from scratch; whether **territory,
term and commission can vary per domain** on one relationship (they can under A″, cannot under A′, and
`01.03.02`:25 carries all three as singular today); and whether `01.03.02`:76 gets **deleted** (A′) or
**preserved as coherent** (A″). Cost of A″ is edge multiplication against a consent artifact
(`01.03.02`:50, "the edge *is* the represented party's consent").

**2. Are the five domains identical to domain 17's ratified work-type enum, or a separate axis?**
`17.08.01`:35-36 models representation scope as "territory set + **work-type enum**", and `17.01.01`
Q-04:302 is **RESOLVED** on that basis. If they are the same axis, say so and the five values become the
enum's membership — which no file currently enumerates. If they are different, this ratification mints a
**fourth** scoping vocabulary in a tree that already has three. Note the taxonomy also needs a ruling:
`01.03.02`:25 lists **sync as a sibling of publishing**, while `09.01.04`:102 makes sync a right type
carved **inside** publishing ("performance, mechanical, sync, print"), and `11.08.01` D-14 requires
authority resolvable per rights side. A domain axis at "publishing" granularity may be too coarse for the
rights stack.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-75|D-75]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-69|D-69]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-14|D-14]]
