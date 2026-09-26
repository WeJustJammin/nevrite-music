# Approved AC209/AC211 prelaunch production-evidence propagation

The owner approved on 2026-09-25 that production-only evidence must not gate
implementation while the product is prelaunch: "rescope 100% if we need to
collect data from production yet we are still in development." The
[propagation scan](propagation-scan-2026-09-25.md) classifies every affected
completion, dependency, evidence, and release boundary. Decision `DEC-104`
records the approved policy and supersedes `DEC-101`'s Slice 10 dependency
sentence.

All 283 authored Slice 09 IDs and all 2,000 authored Phase 2 criteria remain
preserved for traceability. `P2-S09-AC-209` and `P2-S09-AC-211` are excluded
only from the implementation-completion denominators: Slice 09 is `279/280`
active and Phase 2 has 1,997 active criteria. `P2-S09-AC-265` is the only Slice
10 implementation prerequisite, and it is staging-only by contract.

The deferred criteria are mandatory on distinct timelines and must not be
represented as passed, waived, simulated, or inferred:

- `P2-S09-AC-209` — production-rollout/post-deployment evidence gate. It does
  not gate Slice 10 implementation or the initial controlled production
  deployment needed to produce its evidence; it must pass before alerting is
  declared ready.
- `P2-S09-AC-211` — post-launch operational SLO acceptance. It does not gate
  the initial launch and is mandatory after initial launch, once genuine
  production traffic spans a complete UTC day.
- `P2-S09-AC-266` — pre-release real-device accessibility gate, unchanged from
  `DEC-101`.

The policy was propagated through the Phase 2 plan; Slice 09, Phase 2, overall,
blocker, pipeline, and session records; architecture map; release-evidence
runbook; decision ledger; progress-consistency validator; and focused policy
tests. The alert policy, alert boundaries, SLO thresholds, DLQ and queue
definitions, the protected AC211 collector, and their tests remain Slice 09
implementation scope and are unchanged.

TDD evidence: the rewritten completion-policy suite first failed seven of eight
tests against the prior policy, then passed eight of eight after the documents
were corrected. The progress-consistency validator was updated in the same pass
and reports `consistent`.

Ledger durability note: `DEC-102` and `DEC-103` previously existed only as
hand-edits of the compiled `.memory/wiki/decisions.md`, which the memory
compiler regenerates from `.memory/raw/{events,sessions}/*.jsonl`; a compile
therefore silently deleted them. Both were backfilled as raw records in the same
pass so the ledger retains 104 decisions, and `DEC-104` was authored the same
way. The hand-edit hazard is pre-existing and now corrected for these entries.

No external Slice 09 criterion is claimed complete by this propagation, and no
production release is authorized while AC209, AC211, or AC266 is unproven.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
