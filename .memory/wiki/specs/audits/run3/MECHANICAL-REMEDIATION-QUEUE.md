# Run-3 Mechanical Remediation Queue

> Defects confirmed deterministically (by script or direct inspection), **not** awaiting the
> adversarial verifier pass. All are agent work — none is an owner decision.
> Held until the 26 verifiers finish: every fix here shifts line numbers, which would break the
> `file:line` references the verifiers are checking against and make run 3 non-reproducible.

## M1 — Leaked tool-call fragments in spec bodies (10 sites, 7 files)

Bare `</content>` / `</invoke>` lines written into published specs by the generating agent.

| File | Lines |
|---|---|
| `04-opportunities-casting/04.03-submission-audition/04.03.01-structured-submission.md` | 218 |
| `04-opportunities-casting/04.05-outcome-response-handoff/04.05.03-won-opportunity-handoff.md` | 261, 262 |
| `11-music-licensing/11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md` | 242 |
| `13-gear-marketplace/13.12-gear-seller-storefront-policies.md` | 220 |
| `18-show-production-touring/18.03-show-advancing/18.03.02-venue-capability-diff.md` | 300, 301 |
| `18-show-production-touring/18.07-show-day-schedule/18.07.01-run-of-show.md` | 276, 277 |
| `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.02-capacity-manifest-allocations-holds.md` | 239 |

**Fix**: delete the lines. Verify nothing semantic sits adjacent — several appear at end-of-file
where a section may also have been cut short, so check each for accompanying truncation before
deleting blind.

## M2 — Stale children-table hypothesis counts (276 of 771 claims, 35.8%)

Sub-domain index children tables claim a Deep Think count per child that does not match the
`DT-NN` rows actually in that child. Typical error is large, not off-by-one: indexes claim **3**
where **12–15** exist, which suggests the tables were written from an early draft and never
refreshed as deepening added hypotheses.

Examples:

| Index | Claims | Actual |
|---|---|---|
| `01.01-person-identity-roles-index.md` → `01.01.03-acting-context-switcher.md` | 3 | 15 |
| `01.02-organizations-entity-model-index.md` → `01.02.02-organization-creation-lifecycle.md` | 3 | 15 |
| `01.03-membership-representation-mandate-index.md` → `01.03.01-membership-records-lifecycle.md` | 3 | 13 |

**Fix**: recompute every claim from disk (`^\| DT-\d+` row count per child) and rewrite the cell.
Fully deterministic — script it, do not hand-edit 276 cells.

**Rubric impact**: this is the single largest Dimension 8 (Structural Compliance) driver in the
tree and appears in almost every sub-domain's score.

## M3 — 11 truncated cross-domain syntheses in `ideation-cx.md`

See [CONFIRMED-root-001-truncated-synthesis.md](./CONFIRMED-root-001-truncated-synthesis.md).
All 11 are domain-02 pairs (02-03 → 02-16), cut mid-word, present in every git revision
including the commit that created them, and absent from all 190 CX files on disk.

**Fix**: regenerate each pairwise synthesis from domain 02's features plus the partner domain's
features and CX, matching the shape of the 14 intact bullets (State owner / Trigger chain /
Permission / Fan-out / Race). The surviving prefix states the ownership split before it cuts, so
regeneration extends rather than replaces.

**Largest single item in this queue.** Derivable from material on disk — agent work, not an
owner decision.

## M4 — Wrong totals in `opportunities-casting-index.md:46`

Claims "5 sub-domains · 22 leaf feature files · 59 Deep Think hypotheses logged". Actual: **23**
leaf files (matching `ideation-index.md:121`) and **156** DT rows.

**Fix**: recompute and rewrite. Check every other domain index for the same defect in the same
pass — M2's 35.8% stale rate suggests this class is not isolated to domain 04.

## M5 — `CX-M##` identifier space has no registry (`root#002`)

`CX-M##` is referenced **983 times across 132 files**, but `ideation-cx.md` §1 Cross-Cut
Mechanisms — which owns the registry — contains only **2** occurrences of that identifier form.
Mechanisms are defined by name and referenced by number with nothing binding the two.

**Fix**: needs scoping before it can be classified. If a name↔number mapping is recoverable from
usage (each `CX-M##` is used consistently with one named mechanism), it is mechanical: build the
registry table in §1. If usage is inconsistent across files, the numbering is unreliable and the
scope of the fix changes. **Determine which before acting.**

## Not in this queue

Findings requiring product judgement — the craft-immutability contradiction (`05.01.01` D-10 vs
`05.01.02`:105), the alert-cap divergence, and the rest of the confirmed blocking set — go to the
owner decision queue once verification lands. The alert-cap case is *likely* mechanical
(`04.02.04` D-12 is canonical at two, the CX misstates it), but that is a verdict for the
verifier, not an assumption to act on.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-12|D-12]]
