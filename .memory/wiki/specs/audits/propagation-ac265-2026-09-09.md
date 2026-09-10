# Approved AC265 propagation

The user approved denied-access testing for deferred roles on 2026-09-09.
The [scan](propagation-scan-2026-09-09.md) and
[source audit](../../../pipeline/progress/verification/2026-09-09-ac265-scope-conflict.md)
identify the originating adult-only architecture and deferred mandate scope.

Applied to [FE03](../fe/03-cms-content-modeling.md), the
[Phase 2 plan](../phases/phase-2.md), Slice 09 tracking, the release runbook,
and the hosted evidence contract. `ac265-hosted-e2e-v2` requires an explicit
assertion for every role: positive access for entitled/owner/staff/admin,
denial for guardian/junior/business-mandate/forbidden, and disabled/no-mutation
for unmet prerequisites. The validator rejects version 1, missing assertions,
skips, and assertions inconsistent with that policy.

All nine cases and ten scenarios remain required. Positive authority must be
real and server-verified. This correction neither provisions identities nor
attests to hosted execution. AC265 and the Slice 10 dependency remain open.

Validation: RED reproduced legacy acceptance and rejection of the new shape;
GREEN passed 36 hosted/retained-evidence tests under Node 22.23.1 and pnpm 11.24.0.
Full validation passed: 443 Vitest files, 3,318 tests plus one existing intentional
skip, 100% coverage, 101 functional browser checks, five production-built checks,
contracts, database types, progress, formatting, lint, types, builds, and budgets.
Local graph compiler refreshed 1,629 nodes / 10,117 edges; all 55 graph warnings
were pre-existing. The unavailable `memory_compile` tool was not called.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
