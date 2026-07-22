# Ideation Ambiguity Audit — Report

> Layer: **ideation** (Vision Rubric). Original run: `/audit-ambiguity ideation`, 2026-07-18.
> Method: 33 auditor agents: 9 vision-level documents under the full 8-dimension rubric and 24
> domain auditors using per-file implementer simulation. Owner-approved tiered scope covered files
> feeding downstream; 254 intentionally `[SURFACE]` Could/Won't features were class-ruled-out as
> minimal-by-design rather than treated as ambiguity.
>
> **Recovery notice (2026-07-18):** cross-file remediation stopped at a weekly model limit. The
> authoritative recovery ledger is [remediation-state.md](remediation-state.md). No claim below
> labelled `applied` is final until an independent verifier reconciles its source manifest.

## Original Result Summary

| Metric | Original result | Recovery status |
|--------|-----------------|-----------------|
| Full-audited files | 867 reported | Coverage record requires reconciliation: the original total plus 254 class-ruled-out files accounts for 1,121 of 1,122 scoped documents. |
| Files with zero findings | 637 (73%) | Historical, not a final verdict. |
| Findings | 355 reported: 31 blocking, 324 warning | Bucket accounting below explains 350; fresh run must reconcile the five-finding difference. |
| Rough ambiguity | ~22.3% | Historical; recompute only from the fresh audit. |

The original audit identified contradictions an 8/8 self-check cannot expose: a downstream
implementer reading two separately plausible files could still be forced into incompatible designs.

## Finding Categories (original top counts)

`unresolved-decision` 89 · `missing-edge-case` 65 · `contradiction` 59 · `unmeasurable` 36 ·
`undefined-term` 24 · `ambiguous-behavior` 16 · `broken-cross-reference` 11 · `missing-synthesis` 11

## Triage & Remediation

### Bucket 1 — Agent cascade errors (5 blocking + 12 warning) — applied, verify in fresh audit

Mechanical release-split and runner-migration cascades were corrected in the source tree:

- `ideation-index.md`: D-31/D-20 sequencing, 09-capture definition, citation and count repair,
  Admin-persona canonical question, and Q-namespace clarification.
- `constraints.md`: system `svc.sh` runner commands, current infrastructure state, organization
  conversion deadline, and testable baseline moderation scope.
- `feature-ledger.md`: D-31 phase legend and unphased `—` notation.

These edits are source changes, not substitute verification. The fresh audit determines whether every
original cascade finding is closed.

### Bucket 2 — Owner architecture decisions (2) — recorded, verify propagation

- **D-33** Split-Capture Trigger: layered ownership — 09 owns sheet/instrument, 02 owns credit
  record, trigger remains cross-cut; 10 does not own capture.
- **D-34** Ladder/challenge/expiry engine: 17 Live Booking owns it; 16 owns place records only.

The decisions exist in `ideation-index.md`; all claimed downstream propagation remains subject to the
manifest and fresh-audit checks.

### Bucket 3 — Cross-file contradictions + v1/v1.5 warnings (107 findings, 81 files) — PARTIAL

The `wejammin-audit-remediate` workflow reported **33/81 manifests processed and 48 edits applied**
before a weekly model limit stopped the remaining agents. It therefore did **not** remediate this
bucket in full.

| Status | Manifests | Findings | Blocking |
|--------|----------:|---------:|---------:|
| Applied but independently unverified | 33 | 48 | 9 |
| Pending recovery | 48 | 59 | 17 |
| **Total manifest-backed target** | **81** | **107** | **26** |

The intended reconciliation rules remain evidence to verify, not proof of completion: contested
credits stay visible per 02.01.01 D-11; draw count is `scanned_paid` per 17.09.02; domain-04 terms
set belongs to 04.01.01 D-09; discovery dedup key is `(user, post)`; cold start has no
`Overdue` qualifier without history; campaign anchor is 21.01.01.

### Bucket 4 — Phase-2 domain warnings (224) — TRACKED

Warnings on `[PARTIAL]`/`[SURFACE]` content in phase-2 domains (03, 04, 06, 08, 10, 11, 12, 16–24)
are retained in [tracked-phase2-warnings.md](tracked-phase2-warnings.md). Their deferral remains an
explicit scope disposition, not a clean result: the fresh audit must preserve, revise, or retire this
applicability ruling with reconciled counts.

## Verdict

`[REMEDIATION-PARTIAL — DO NOT ADVANCE]`

Complete the 107-row recovery ledger, independently verify every applied edit, resolve or properly
route remaining product/architecture decisions, refresh the knowledge graph, and run a fresh full
`/audit-ambiguity ideation`. `/create-prd` remains blocked until that run has a truthful coverage
record and a compliant final verdict.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-31|D-31]]
- [[decisions.md#d-20|D-20]]
- [[decisions.md#d-33|D-33]]
- [[decisions.md#d-34|D-34]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-09|D-09]]
