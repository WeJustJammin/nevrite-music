# Run 7 Evidence Path Reconciliation

Run 7 verification evidence is valid under the repository-aware resolver:

1. An absolute path resolves as recorded.
2. A repository-relative path resolves from the repository root.
3. A domain-relative path resolves from the verified report's domain directory.
4. A pointer outside the ideation tree is allowed only for a directly cited canonical source:
   vision.md, feature-ledger.md, or the pipeline rubric used for scoring.

## Verification Result

- 944 verification evidence pointers inspected.
- 80 domain-relative aliases in the music-licensing verification report resolve uniquely inside
  .memory/wiki/specs/ideation/11-music-licensing.
- The remaining external canonical pointers resolve only to the approved vision, feature-ledger,
  or rubric files.
- No verification evidence pointer remains unresolved after applying the resolver.

## Raw-Report Note

Some raw reports retain historical or domain-relative aliases. Raw reports are triage inputs; the
independent verification reports provide the controlling final verdict evidence. Source remediation
must cite the current source paths from the verification reports.
