# Approved AC266 Phase 2 completion-policy propagation

The owner explicitly deferred AC266 on 2026-09-20 because the required real
macOS/Safari/VoiceOver and Windows/Firefox/NVDA devices are not practical to
obtain during Phase 2 implementation. The
[propagation scan](propagation-scan-2026-09-21.md) identifies every affected
completion, dependency, evidence, and release boundary. Decision `DEC-101`
records the approved policy.

All 283 authored Slice 09 IDs and all 2,000 authored Phase 2 criteria remain
preserved for traceability. AC266 stays unchecked and is excluded only from the
implementation-completion denominators: Slice 09 is `279/282` active and Phase 2
has 1,999 active criteria. Slice 10 remains locked until AC209, AC211, and AC265
pass. AC266 remains mandatory for post-Phase 2 production readiness and release;
it is not passed, waived, simulated, inferred, or replaceable with Linux-only or
synthetic evidence.

The policy was propagated through the Phase 2 plan; Slice 09, Phase 2, overall,
blocker, and pipeline trackers; architecture map; release-evidence runbook;
decision ledger; session record; progress-consistency validator; and focused
contract tests. AC266's evidence contracts, protected workflows, report
verifiers, and genuine-device requirements remain intact.

TDD evidence: the new completion-policy suite first failed all four tests
against the prior `283`-criterion completion policy. GREEN passed four focused
files with 20 tests and one intentional skip. Full validation under Node
22.23.1 and pnpm 11.24.0 passed 536 Vitest files, 4,234 tests plus one
intentional skip, and 100% coverage across 13,028 statements, 9,826 branches,
2,151 functions, and 12,109 lines. It also passed 101 functional Playwright
checks, five production-built Slice 09 checks, contracts, database types,
progress, formatting, lint, type checks, builds, bundle budgets, and performance
smoke (`p95=1.527671 ms`, threshold `500 ms`, zero errors). Database verification
passed 52 pgTAP files / 1,917 tests with generated type parity. The graph compiler
refreshed 1,632 nodes / 10,125 edges; all 55 graph warnings were pre-existing.

Fresh AC211 run `35560241699` passed preflight but failed closed with zero
eligible command, protected-RPC, acceptance, and queue-first-attempt samples and
produced no retained artifact. No external Slice 09 criterion and no AC266
acceptance is claimed by this propagation.

<!-- spec-graph: auto-generated -->

## Related Specs

### Phases into

- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References

- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
