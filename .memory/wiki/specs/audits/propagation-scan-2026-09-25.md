# AC209/AC211 prelaunch production-evidence propagation scan

Decision request: on 2026-09-25 the owner directed that production-only
completion evidence must not gate implementation or initial launch while the
product is still prelaunch ("rescope 100% if we need to collect data from
production yet we are still in development"). The owner explicitly approved
moving the production-evidence closure of `P2-S09-AC-209` and `P2-S09-AC-211`
out of the active implementation-completion denominator and reducing the
Slice 10 implementation prerequisite to `P2-S09-AC-265`.

This scan follows the [AC266 propagation precedent](propagation-scan-2026-09-21.md)
and decision `DEC-101`. It changes implementation sequencing and gate timing
only. No authored criterion ID, evidence contract, threshold, sample floor, or
verification component is removed or weakened.

## Gate timing (the core distinction)

The three deferred criteria do **not** share a deadline, and none of them blocks
the initial deployment:

| Criterion | Gate type | Timing | Blocks initial launch? |
| --- | --- | --- | --- |
| `P2-S09-AC-209` | Production-rollout / post-deployment alert evidence | After a release is selected and live in production; closes when a controlled alert exercise yields the correlated provider event | No |
| `P2-S09-AC-211` | Post-launch operational SLO acceptance | After genuine production traffic exists across a complete UTC day | No |
| `P2-S09-AC-266` | Pre-release real-device accessibility | Before production readiness/release | N/A — it is the pre-release gate |
| `P2-S09-AC-265` | Staging-only hosted matrix, production-bound acceptance route | Active; blocks Slice 10 implementation; cannot close until a hosted-scope acceptance route exists | No |

## Classification

- **Production-only (classification: genuine production runtime required) —
  `P2-S09-AC-209`.** The criterion closes only through the fail-closed
  production operational-alert pipeline against a selected live production
  release, followed by a controlled alert exercise that yields one uniquely
  correlated provider event plus a delivered `dlq_nonempty` row. No live
  production deployment carrying the exact release exists in the current
  development state; the evidence requires one to be deployed first. This is a
  **production-rollout/post-deployment evidence gate**: it can gate declaring
  alerting operational for that release, and it does not gate choosing or
  performing the initial deployment. The alert policy, boundaries, and tests
  remain Slice 09 implementation scope.
- **Production-only (classification: genuine production runtime required) —
  `P2-S09-AC-211`.** The criterion closes only through a retained Tier 2 SLO
  report over a complete midnight-to-midnight UTC day of *genuine production
  traffic* with natural floors of 200 commands, 200 protected RPCs, 200
  acceptances, and 1 queue first attempt, plus the five locked SLO results. That
  traffic cannot exist until the product has launched and is in use, so the
  closure gate is **post-launch operational SLO acceptance**. It must not gate
  the initial deployment or the initial launch. The threshold definitions,
  collector, and row classification remain Slice 09 implementation scope.
- **Active, with an open acceptance-path defect — `P2-S09-AC-265`.** The hosted
  E2E contract is explicitly staging-only
  (`docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md`: "a
  production-origin E2E run cannot satisfy AC265"), and it remains the **only**
  Slice 10 implementation prerequisite. Its own logic reads only hosted
  evidence, but its declared acceptance route requires "the existing
  release-evidence verifier", and that verifier pins
  `alerting.deploymentId` and `slo.deploymentId` to
  `expected.productionDeploymentId` while the evidence shape requires all four
  members. AC265 therefore **cannot close prelaunch** in the current
  implementation, because closing it would require production-bound AC209/AC211
  evidence — the exact circularity this decision removes. The minimal
  decoupling is a hosted-scope evidence route that keeps `alerting` and `slo`
  mandatory in the production sidecar. It is recorded here as **remaining
  work** to be delivered separately; no evidence standard is weakened and no
  check is removed.

## Remaining work (not delivered by this propagation)

- Implement the hosted-scope acceptance route for AC265 and AC266: add a
  hosted-scope evidence shape and hosted-only expected identity
  (`{artifact, hostedE2e, accessibility, verifiedAt}` without
  `productionDeploymentId`/`productionDeployedAt`), and route AC265 and AC266
  acceptance through the retained hosted-report verifier plus the existing
  axe and manual verifiers. `alerting` and `slo` stay mandatory in the
  production sidecar for AC209 and AC211. Until it lands, AC265 remains an open
  implementation gate whose closure path is blocked.
- **Consistent — `P2-S09-AC-266`.** Owner-deferred under `DEC-101`; remains the
  separate mandatory **pre-release** post-Phase 2 production-readiness/release
  gate requiring genuine macOS/Safari/VoiceOver and Windows/Firefox/NVDA
  evidence. It alone carries a pre-release deadline, and that label must not be
  copied onto AC209 or AC211.

## Explicit contradictions

- The canonical Phase 2 plan and current progress records count AC209 and AC211
  inside Slice 09's active `282`-criterion implementation denominator and gate
  Slice 10 on `AC209, AC211, and AC265`. This is the locked-decision text that
  must be superseded for implementation sequencing and gate timing.
- `DEC-101`'s historical sentence "Slice 10 remains locked until AC209, AC211,
  and AC265 pass" stays in the ledger as history but must be explicitly
  superseded by `DEC-104` for the dependency, not deleted or rewritten.
- Treating the absent production evidence as an implementation defect — or
  marking any criterion passed, waived, simulated, or inferred — would fabricate
  acceptance.
- Treating AC209 or AC211 as pre-release blockers repeats the circularity the
  owner rejected: they cannot be proven before the launch they would be gating.

## Implicit assumptions

- That "implementation completion" and "production acceptance" are the same
  milestone, and that all deferred criteria share one deadline. They do not.
  Authored IDs are preserved and only the active denominator and gate timing
  move, exactly as `DEC-101` separated them for AC266.
- That deferred criteria stop being mandatory. AC209 and AC211 remain authored,
  unchecked, and required after launch — AC209 before alerting for a release is
  declared operational, AC211 before operational SLO acceptance is claimed.
  AC266 remains mandatory before production readiness/release.

## Consistent (no change)

- The alert pipeline, thresholds, DLQ/queue definitions, collector, and their
  tests remain Slice 09 implementation scope and stay in the tree.
- AC265's staging-only identity, broker, receipt, and matrix contracts are
  unchanged.
- AC266's real-device contracts, protected workflows, and report verifiers are
  unchanged.
- No IA, BE, or FE specification contains AC209/AC211 ID references
  (verified by cascade audit), so this is a plan, tracker, validator, runbook,
  and architecture-map correction with no spec rewrite.

## Apply targets

Phase 2 plan; Slice 09, Phase 2, overall, blocker, and pipeline trackers;
architecture map; release-evidence runbook; decision ledger; progress-consistency
validator; focused policy tests; session and propagation records. New active
denominators: Slice 09 `279/280`, Phase 2 `1,997 active / 2,000 authored`.
Slice 10 implementation prerequisite: `AC265` only. AC209 is a
production-rollout/post-deployment evidence gate; AC211 is post-launch
operational SLO acceptance; AC266 remains the pre-release real-device gate.

Approval is already explicit and recorded. This propagation does not relax
AC209 or AC211 — it reschedules them to the point where their evidence can
actually exist, and it does not authorize production release while AC266 is
unproven.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
