# Run 8 Preflight — Dimension 7 Governance Verification

**Status:** candidate source repair verified; **non-gating**. This is a static review of the current
source tree against Run 7's machine-readable verified findings. It is not an independent Run 8 audit.

## Scope and Method

1. Parsed every `*-verified.json` report in `audits/run7`.
2. Filtered finding IDs carrying Dimension 7 (`D7`).
3. Located each cited Open Questions table by its audit evidence line.
4. Checked every such table source for the explicit owner/deadline/blocked-decision governance contract.
5. Checked the newly repaired prose-only gaps for their named governance or an already-locked resolution.

## Results

| Check | Result |
|---|---:|
| Run 7 verified Dimension 7 verdicts | 60 |
| Upheld Dimension 7 verdicts | 54 |
| Upheld blocking verdicts | 32 |
| Upheld warning verdicts | 22 |
| Refuted verdicts | 6 |
| Unique evidence-bearing Open Questions table sources | 55 |
| Table sources missing the governance contract | **0** |

The governance contract states the accountable owner, defines the hard decision deadline as the gate
before the named `Deferred To` stage, names the blocked decision, and prevents downstream work without a
resolution or formally approved supersession.

## Prose Repairs Included

- Added explicit local governance for connection/endorsement, feed-control, cross-border invoice,
  cohort-dimensionality, overlapping-commission, and provisional-loss questions.
- Replaced stale 09.02, 18.03, 18.04, and 18.09 cross-cut deferrals with the already-locked source
  behavior that resolves them.
- Added decision metadata for the local-agent reopening gate, open counterparties, and the 07/08
  Overdub ratification.

## Limits and Next Gate

This check proves only that the repaired source tree contains the expected governance evidence. It does
not re-score ambiguity, validate cross-document semantics, or close the audit gate. The outstanding
owner/policy decisions in `run7-owner-decision-packet.md` must be ratified, then a fresh independent
`/audit-ambiguity ideation` run must pass before ideation can be locked.
