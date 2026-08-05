# Run 7 Ideation Ambiguity Audit

> **Current status**: SUPERSEDED — source remediation began after this historical baseline; a fresh full audit is required for the current tree.
> **Gate verdict**: BLOCKED
> **Audit validity**: VALID
> **Scope**: current ideation tree, frozen for the audit

## Structural Coverage

- Raw audit reports: 26 of 26
- Independent verification reports: 26 of 26
- Audited units: 191 of 191
- Audited Markdown files: 1,122 of 1,122
- Raw findings: 388
- Verification integrity: every raw finding has exactly one independent verdict

## Final Verdicts

| Blocking | Warning | Refuted |
|---:|---:|---:|
| 114 | 122 | 152 |

The gate is blocked because 114 independently upheld blocking ambiguities remain. The blocking and warning evidence is in the corresponding Run 7 verification JSON files; refuted findings are retained for traceability.

## Domain Distribution

| Scope | Blocking | Warning | Refuted |
|---|---:|---:|---:|
| root | 0 | 1 | 0 |
| meta | 2 | 1 | 0 |
| 01 | 4 | 3 | 13 |
| 02 | 3 | 8 | 1 |
| 03 | 8 | 0 | 0 |
| 04 | 1 | 6 | 1 |
| 05 | 0 | 0 | 28 |
| 06 | 3 | 5 | 2 |
| 07 | 0 | 0 | 13 |
| 08 | 2 | 0 | 10 |
| 09 | 6 | 1 | 0 |
| 10 | 6 | 3 | 3 |
| 11 | 13 | 12 | 0 |
| 12 | 5 | 7 | 3 |
| 13 | 1 | 0 | 30 |
| 14 | 8 | 11 | 1 |
| 15 | 4 | 7 | 0 |
| 16 | 0 | 0 | 17 |
| 17 | 10 | 23 | 1 |
| 18 | 13 | 3 | 0 |
| 19 | 0 | 11 | 22 |
| 20 | 7 | 10 | 1 |
| 21 | 4 | 3 | 0 |
| 22 | 0 | 1 | 5 |
| 23 | 9 | 3 | 0 |
| 24 | 5 | 3 | 1 |

## Required Next Step

Build a remediation plan from only the Run 7 verified blocking findings, grouped by dependency and source ownership. Do not use the void Run 6 claims as evidence and do not remediate warnings until the blocking work is sequenced.
