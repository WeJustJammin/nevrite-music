# Propagation Record — DQ-R2-01 (Option A′)

> **Decision**: DQ-R2-01, ratified by the owner **2026-07-29** as **Option A′**.
> **Global id**: `ideation-index.md` **D-75** · **Memory id**: `DEC-049`
> **Layer**: ideation (vision) · **Scope**: 37 ideation files + 7 audit records
> **Brief**: [dq-r2-01-decision-brief.md](./dq-r2-01-decision-brief.md)

## The ratified rule

A **representation edge** carries two independent flat scope axes — `activities` (a subset of
the closed seven: `book / sign / spend / list / release / settle / administer`) and `domains`
(a subset of `live booking / recording / publishing / sync / merch`). An action is authorised
iff its verb is in the edge's `activities` **and** its domain is in the edge's `domains`,
resolved at the moment of the action. At most **7 + 5 = 12** plain-language statements per
edge, never 35 addressable cells.

A **membership edge** carries the activity axis only and resolves to **all five domains**, so
both edge types present one shape — `{activities, domains}` — to the enforcement cross-cut
(`01.03-cx` CX-03). Territory, term and commission stay **edge-level** and do not vary per
domain (accepted cost). `administer` never reaches authorship: `09.01.04` D-06 stands over the
mandate.

## What was wrong

Three normative statements, **no open marker on any of them**:

| Location | Said |
|---|---|
| `01.03.02`:25 | the edge "carries: **scope (which activities — live booking, recording, publishing, sync, merch)**, territory, term, **a mandate (01.03.03)**" — scope and mandate as *siblings* |
| `01.03.02`:76 | "**scope is the mandate**" — identity |
| `01.03-cx`:11 (CX-02) | "Representation scope IS a mandate, **additionally bounded by term** and territory" — identity, *and* term outside the mandate, contradicting `01.03.03`:25 |

The identity reading was **unsatisfiable**: if scope *is* the mandate, scope's values must be
mandate values, but that enum is closed at seven and no domain is in it. Sharpest form: the
word "activities" was filled with two different vocabularies **nine lines apart in one file**
— `:16` cited *"my manager can book but not sign"* (verbs), `:25` filled the same word with the
five domains.

## Why the draft's recommendation was rejected

The prepared draft recommended **Option A**, a full 7×5 cross-product. Rejected on three counts:

1. A 35-cell grid **is** the permission matrix `01.03.03` DT-02 rejects by name ("a thing no
   band will ever configure"), and D-02 forbids rendering authority as a grid.
2. Its cross-type asymmetry breaks the CX-03 indistinguishability the sub-domain merge exists
   to protect.
3. Its justification — "book for live but not publishing" — was **half-sourced**. The verb half
   is real (`01.03.02`:16); the domain half appears nowhere in 1,122 files. The five-domain
   list occurred on **exactly one line** tree-wide.

Options B (domains-for-representation / verbs-for-membership), C (collapse to one vocabulary),
D (domains as presets) and G (defer) were each independently refuted against source. See the
brief for the evidence per option.

## Landing sites

| File | Change |
|---|---|
| `01.03.02` | `:25` two-axis Behavior · `:16` role lens · `:33-34` Happy Path · `:44` overlap · `:76`/`:79` cross-cuts · **D-02** restated · new **D-05** · new **Q-03/Q-04/Q-05** |
| `01.03.03` | `:25` scope dimensions · `:48` `administer` seed carve-out · `:100` cross-cut · new **D-11** · new **Q-04** |
| `01.03.01` | new **D-19** — membership universal-domain rule |
| `01.03-cx` | **CX-02** identity + term corrected · **CX-03** one-shape guarantee · `:69` per-edge union |
| `01.03` index | **D-03** scope description · new **D-05** |
| `ideation-cx.md` | `:27` Roles, Permissions & Delegated Authority — two-axis resolver added, D-69 text byte-identical |
| `ideation-index.md` | new global **D-75** + backlink |
| `09.01.04` | new **D-17** — a representation mandate never reaches authorship |
| Domains 04, 05, 07, 11, 17, 20 | 30 files — local authority references aligned to the two conjuncts |

Full list: 37 ideation files. **111 edits applied, 0 skipped** across six disjoint ownership
groups, then 6 defects remediated (below).

## Verification

Two independent passes ran against the changed tree.

**Consistency check** — PASS on 8 of 9 checks; 4 defects found and **all 4 fixed**:

| # | Defect | Fix |
|---|---|---|
| 1 | `01.03.02`:33-34 Happy Path never touched — still `scope (live + recording)`, single-axis, 8 lines below the new Behavior | Both axes named; renders as one plain-language statement |
| 2 | `01.03.02`:44 asserted a **per-domain-intersection overlap rule** the decision does not license, and `17.08.01`:83/:127 stated it *differently* while citing that row | Both reduced to what A′ licenses — disjoint `domains` never conflict; partial intersection, term/territory in the key, and block-vs-warn tracked as **Q-04** |
| 3 | `04.01.01`:53/:171 asserted `list` authorises an entity post, contradicted by its **own Q-08** 117 lines later | Reduced to "the posting activity (Q-08)"; the literal marketplace-listing reading at `05.05.03`:40 is correct and left intact |
| 4 | `ideation-cx.md`:27 stated the derived min-one-domain rule as flat ratified policy in the row every enforcement consumer reads | `**derived rule — agent decision, owner may override**` marker inserted, matching the other two landing sites |

Also fixed, found by the implementer simulation: the carve-out's trailing clause ("only the
writer may create or modify the publisher rows anchored to their own share") over-reached past
its own first clause and would have **voided the legitimate delegated publisher-administration
case** at `01.03.02`:79. Rescoped in `01.03.03`:48 and `:100` to co-writers' shares.

**Verified clean**: seven-verb enum intact (12 ordered occurrences tree-wide); `ideation-index.md`
D-69 and D-67 byte-identical to HEAD; `01.03.02` D-01/D-03/D-04 and DT-01..DT-04 byte-identical;
DT-02's matrix rejection affirmatively restated in 9 places and contradicted nowhere; zero table
column mismatches on any changed line; all cross-references resolve; no numbering collisions; no
file edited outside its ownership group.

**Four residual sweep hits, all benign by design**: `01.03-cx`:11 and `ideation-index.md`:260
quote the old defective text inside their own correction notes; `05.05.03`:40's `list` is
literal marketplace listing and correctly requires both conjuncts; `04.01.01`:212's pipe-count
mismatch is pre-existing (identical at `HEAD`:207, outside every hunk).

**Implementer simulation** — residual ambiguity attributable to DQ-R2-01: **0**. Every question
the decision touches is answerable from the text as it now stands.

## Left open, deliberately

| Id | Question | Owner | Deferred to |
|---|---|---|---|
| `01.03.02` **Q-03** | Are the five domains identical to domain 17's ratified work-type enum, or a fourth vocabulary? `01.03.02`:25 lists **sync** as publishing's *sibling*; `09.01.04`:102 carves sync *inside* publishing as a right type. A taxonomy ruling, not an authority-model one. | User | `/create-prd` |
| `01.03.02` **Q-04** | The representation overlap key — does partial `domains` intersection conflict? Does the key carry territory and term? Does detection block or warn? | User | `/create-prd` |

## Pre-existing gaps surfaced, now tracked

Neither is attributable to this decision; both were untracked, which is the `PAT-011` failure
mode that let DQ-R2-01 itself survive two audit runs.

| Id | Gap |
|---|---|
| `01.03.02` **Q-05** | A representation edge has **no typed attribute table**, unlike membership's. `territory` has no domain, `notice` no unit, no lifecycle state enum; Q-01 contradicts Behavior on whether `commission` is modelled at all. |
| `01.03.03` **Q-04** | A representation edge's **value ceiling default is unspecified**. Fail-closed reads unset as zero and blocks the acting manager; null-as-uncapped hands an agent unbounded spend. |

## Root cause

**DQ-02's recorded affected-files list omitted `01.03.02`** — the one file in 1,122 naming a
competing scope vocabulary. The propagation then ran correctly against an incomplete target
list, and the contradiction survived two full audit runs. Recorded as **`PAT-011`**: derive a
decision's affected-files list by grepping the tree for every competing term the decision
settles, never from the decision's own text or the prior propagation record. Fixed in DQ-02's
list, with the omission noted as the propagation-miss mechanism.

Two further bookkeeping errors fixed: "DQ-02.3" resolved to two different decisions across
records (`decision-ratification-log.md` is operative; the other now carries a disambiguation
note), and `ideation-ambiguity-report-run2-interim.md` misattributed this gap to DQ-04, a
domain-02 credit entry.

## Next step

`/audit-ambiguity ideation` — the fresh full run (191 units + the verification phase) that
`BLOCKER-004` requires before `/create-prd`. The weekly limit that capped run 2 at 81% reset on
**2026-07-28 19:00 ET**, so the run is unblocked. Run 2's other three raw-blocking units —
`07.08-delivery-readiness-qc`, `14.06-used-licence-transfer`, `20.01-fan-graph-owned-audience` —
lost their detail to a scratchpad cleanup and still need that run to confirm or refute.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-75|D-75]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-69|D-69]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-67|D-67]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-04|D-04]]
