# Run 6 — VOID. This run did not complete and its verdict is meaningless.

> **Do not read the artifacts in this directory as an audit result.**
> **Do not treat `BLOCKER-004` as closed.** Ideation is **not** complete.

## What happened

Run 6 was launched 2026-07-30 against the tree after run-5 remediation. **26 of its 29 agents
died on a session usage limit** (resets 17:30 America/New_York). What survived:

| | Expected | Actual |
|---|---|---|
| Audit shards | 26 | **6** |
| Verify shards | up to 26 | **0** |
| Units covered | 191 | **10 (5.2%)** |
| Files covered | 1122 | **55 (4.9%)** |
| Findings verified | all | **0 of 28** |

## Why it nevertheless reported `PASS`

A defect in the run script, not in the tree:

```js
verdict: blocking.length === 0 ? 'PASS' : 'FAIL'
```

`blocking` is populated **only** from returned verdicts. Zero verifiers ran → zero verdicts →
zero blocking → `PASS`. The verdict measured whether verification *happened*, not whether the
tree is clean.

Three tells make the artifact obvious in hindsight, and all three are in the returned payload:

- `coverage: 10/191 units`
- `findingsWithoutVerdict: 28` — every finding unverified
- `refutationRate: 0%` — impossible; runs 3, 4 and 5 were 69.3%, 71.4% and 70.2%

## Fixed

The run script now computes an **`INVALID`** verdict, ahead of PASS/FAIL, whenever any of these
hold — so an incomplete run can never again present as a pass:

- fewer audit shards returned than expected
- any audited shard left unverified
- coverage below 191 units or 1122 files
- any finding without a verdict
- any verdict unmatched to a finding

It also returns `complete`, `invalidReasons` and a `shards: {expected, audited, verified}` triple.

## The 6 partial audit files here

`01`, `02`, `03`, `04`, `meta`, `root` — raw, **unverified** findings only. Prior runs refuted
~70% of raw findings, so roughly two thirds of these would not survive verification. They are
retained as evidence of what ran, and are **not** an input to remediation.

## State at the time of voiding

The tree itself is committed and healthy at `08571c4`. Everything through run-5 remediation and
the four ratified blocking decisions is landed and verified:

| Cycle | Fixes | Owner decisions |
|---|---|---|
| after run 3 | 11 blocking + 4 systematic defects | 7 ratified |
| after run 4 | 10 blocking | 1 ratified |
| after run 5 | **82** — every confirmed finding | 4 blocking ratified |

Last valid measurement is **run 5**: 191/191 units, raw 315, refuted 70.2%, **13 blocking**,
81 warning.

## What is actually outstanding

1. **A real run 6** — full 191 units with verification — once the limit resets.
2. **8 owner-classified findings graded `warning`** from run 5, still open by design. They do not
   block a PASS on their own, but a different verifier can promote any of them to blocking.
3. Pre-existing table defect `04.01.01:267` (a `Partial` row, 4 cells in a 3-column table),
   predating this work.
4. A string-escaping bug in one shard's JSON write — recovered textually in run 5, but it would
   silently drop verdicts on a shard nobody checked.
