# AC265 scope propagation scan

Decision: the user approved the AC265 denied-access correction on 2026-09-09.

- Explicit contradiction: FE03 protected guardian/junior variants versus the
  architecture's adult-only launch boundary; business mandates versus Phase 2's
  deferred mandate scope. These three contexts require denial/non-disclosure.
- Implicit assumption: the hosted report records only `passed`, without naming
  whether access was granted, denied, or disabled. Introduce an explicit assertion
  for each of the nine roles and reject mismatched assertions.
- Consistent: positive entitled, owner, staff case, and admin checks still need
  real server authority; forbidden and disabled checks remain negative. Missing
  authority is a blocker, not permission to relabel a positive case as denial.
- Consistent: all ten scenarios, hosted identity binding, RLS, IdP, step-up,
  teardown, and AC209/AC211/AC266 requirements remain unchanged.

Apply targets: FE03, Phase 2 plan, Slice 09 tracker, hosted report schema/tests,
retained test fixtures, release-evidence runbook, session and propagation record.
Approval is already given for this correction; no additional scope is inferred.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
