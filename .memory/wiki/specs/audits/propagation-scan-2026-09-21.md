# AC266 completion-policy propagation scan

Decision: on 2026-09-20 the owner explicitly deferred the AC266 real-device
assistive-technology run because the required macOS and Windows devices are not
practical to obtain during Phase 2 implementation. The owner also directed the
pipeline to continue through Phase 2 completion.

- Explicit contradiction: the canonical Phase 2 plan and current progress
  records count AC266 in Slice 09's `283`-criterion implementation-completion
  denominator and require all four external gates before Slice 10 can begin.
- Explicit contradiction: marking AC266 passed, waived, or satisfied by Linux,
  Chromium, axe, fixtures, or simulated screen-reader evidence would conflict
  with the locked real-platform evidence contract.
- Implicit assumption: the authored-criterion count and the Phase 2
  implementation-completion denominator are the same. Preserve all 283
  contiguous criterion IDs for traceability while defining 282 Phase 2
  completion criteria; AC266 remains authored and unchecked outside that
  denominator.
- Consistent: AC209, AC211, and AC265 remain mandatory Slice 09 completion and
  Slice 10 dependency gates. Their evidence standards do not change.
- Consistent: AC266 remains a mandatory post-Phase-2 production-readiness and
  release gate. The existing real macOS/Safari/VoiceOver and
  Windows/Firefox/NVDA contracts, protected workflows, report verifiers, and
  fail-closed retained-evidence rules remain unchanged.

Apply targets: Phase 2 plan; Slice 09, Phase 2, overall, blocker, and pipeline
trackers; architecture map; release-evidence runbook; decision ledger; focused
policy tests; progress-consistency validation; session and propagation records.
Keep AC266's ID and evidence tooling intact. Record Slice 09 as `279/282` until
AC209, AC211, and AC265 pass, and compute the Phase 2 completion denominator as
`1999` while retaining `2000` authored criteria.

Approval is already explicit. This propagation changes implementation sequencing,
not accessibility acceptance: it authorizes Slice 10 only after AC209, AC211,
and AC265 pass, and it does not authorize production release while AC266 is
unproven.

<!-- spec-graph: auto-generated -->

## Related Specs

### Phases into

- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References

- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
