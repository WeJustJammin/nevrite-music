# Slice 09 Option A propagation record

**Date**: 2026-09-02  
**Status**: IN PROGRESS  
**Scan**: [Option A downstream propagation scan](propagation-scan-2026-09-02.md)  
**Authorization**: User response `a`

## Locked resolution

Option A preserves IA03 and replaces the contradictory BE03a/FE03/phase-plan
assumptions with the complete IA-first clarification package recorded in the
scan. The rejected Option B assumptions must not survive in implementation
contracts.

## Apply ledger

| Order | Layer/artifact                | State       | Evidence                                                                                                            |
| ----: | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
|     1 | IA03 parent                   | applied     | Atomic aggregate, normative envelope/exceptions, protected reads, release-only CMS-10, corrected events, changelog. |
|     2 | IA03 deep dive                | applied     | Canonical fields/algorithms for locales, workflow, relations, approvals, artifacts, block identity, and validators. |
|     3 | BE03a                         | applied     | Seven operations, nine tables, protected reads, activation evidence, finite relations, and signed release boundary. |
|     4 | BE03b/BE03c consumers         | applied     | Mandatory model envelopes, policy evidence, safe placeholders, BlockKey grammar, and canonical registry digest.     |
|     5 | FE03                          | in progress | Concrete reads, projections, queries, owners, errors, and CMS-10 read-only UI.                                      |
|     6 | Phase 2 Slice 09 plan/tracker | pending     | Recompute depth floor, author canonical criteria, mirror exactly.                                                   |
|     7 | Indexes/ledgers/graph         | pending     | Refresh generated and dependency views.                                                                             |
|     8 | Fresh IA and BE/FE gates      | pending     | Full-corpus ambiguity and cross-layer evidence.                                                                     |

## Validation ledger

| Gate                                | State   | Evidence                                              |
| ----------------------------------- | ------- | ----------------------------------------------------- |
| IA-owned formatting                 | pass    | Prettier check on parent and deep dive.               |
| Progress consistency after IA apply | pass    | `pnpm progress:check`.                                |
| Whitespace after IA apply           | pass    | `git diff --check`.                                   |
| BE contract reconciliation          | pass    | Independent per-file assertions plus targeted review. |
| BE-owned formatting and whitespace  | pass    | Explicit Prettier and `git diff --check`.             |
| Fresh IA ambiguity                  | pending | Must cover 83 documents after all propagation edits.  |
| Fresh combined BE/FE ambiguity      | pending | Must cover 201 documents after all propagation edits. |
| Spec graph compile                  | pending | Run after clean corpus gates.                         |

## Open apply work

No product or architecture choice remains open. Remaining work is deterministic
downstream propagation, audit remediation, acceptance-plan regeneration, and
contract-first implementation.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
