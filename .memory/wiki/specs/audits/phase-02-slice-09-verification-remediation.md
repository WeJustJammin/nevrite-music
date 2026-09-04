# Phase 2 Slice 09 verification remediation evidence

Date: 2026-09-02

This is an evidence record only. It does not change the S09 acceptance tracker
or claim production readiness where the required provider or manual device is
unavailable.

## Observed independent QA-RED baseline

The independent S09 audit enumerated **283 criteria** and recorded **252
PASS, 19 FAIL, and 12 UNVERIFIED** before this remediation pass. That result
is retained as the real QA-RED baseline; this artifact does not reclassify the
19 failures or the 12 unverified criteria.

Named failures observed at that gate:

- Initial bundle budget measured **133,098 bytes against the 92,160-byte
  initial-route limit**.
- Initial coverage was **below the required 100% threshold**.
- The current UI hydration assertion failed **1/65** before correction.
- The independent activation review reopened a concrete activation defect.
- The independent release review reopened a concrete signed release/block
  registry defect.

The first three are measurable gate failures; the activation and release
review findings are named review reopenings. Their final disposition remains
subject to the parent slice’s canonical validation and review record.

## Targeted automated runs

- The earlier targeted `pnpm exec vitest run` over the S09 alert, fuzz, SLO,
  recovery, contract, role, DOM, operation-boundary, and traceability artifacts
  recorded **18 files, 68 tests passed** before the final A06/evidence-map
  additions.
- The complete current S09 sweep records **19 files, 73 tests passed**.
- S09 web component suites covering commands, invalidation, mutations,
  platform API, role matrix, runtime DOM/runtime, server, and workbench:
  **9 files, 54 tests passed**.
- S09 browser contract and recovery-state suites:
  **8 tests passed**.
- S09 Creator-role, browser-vitals, and network-resilience suites:
  **4 tests passed**.
- `pnpm progress:check`: **passed**.
- Targeted Prettier check for all remediation artifacts: **passed**.

## Acceptance evidence

### AC209 — alert conditions

`tests/observability/phase-02-slice-09-alert-policy.test.ts` proves all
declared threshold predicates, boundary behavior, malformed-measurement
handling, and runbook/telemetry field compatibility. The additional
`phase-02-slice-09-alert-boundary.test.ts` proves that the production telemetry
source defines the redacted request/migration measurements, alert route,
runbook, retry, DLQ, and native Cloudflare observability attributes, and that
the provider-free delivery seam consumes those aggregates.

The repository has no configured provider API/dashboard query or production
alert-delivery boundary. `infra/observability/README.md` records this setup
boundary explicitly. `evaluateContentSchemaRegistryAlerts` is intentionally a
side-effect-free policy adapter and is not imported by production code; no
live alert delivery claim is made. AC209 remains provider-delivery unverified.

### AC211 — Tier 2 SLOs

`tests/performance/phase-02-slice-09-slo-measurement.test.ts` computes the
declared command p95, protected-RPC p95, acceptance p99, queue first-attempt
p95, and daily DLQ ratio from deterministic samples below each locked
threshold, then verifies named breach alerts at the exact boundaries. This is
local contract measurement, not a production telemetry query; production
SLO attainment remains unverified until provider measurements are recorded.

### AC216 — hostile-input fuzz boundary

`tests/security/phase-02-slice-09-input-fuzz.test.ts` runs 64 generated hostile
values through the registry request/query/release-header schemas and covers
depth 9, 129 keys/arrays/fields/relations, oversized Unicode, executable and
SQL-like strings, regex-shaped input, prototype keys, arbitrary projection,
duplicate approvals, signature bytes, and header aliases. All cases reject as
expected.

### AC217 — performance and recovery

`tests/performance/phase-02-slice-09-recovery.test.ts` parses 25 maximum
128-field definitions and asserts the p95 budget. The focused
`tests/performance/phase-02-slice-09-recovery-durable.test.ts` uses a file-backed
durable RPC adapter to verify old-active fallback, activation rollback,
crash-resume from a persisted cursor, durable DLQ replay, and already-applied
activation idempotency without a duplicate switch. The benchmark plus three
durability tests pass. The adapter is deliberately not presented as live
Supabase/pgTAP execution.

### AC262 — browser performance contract

`tests/e2e/phase-02-slice-09-content-schema-registry-performance.spec.ts`
collects Chromium LCP, Event Timing INP, CLS, and long-task entries from a
real browser workload after loading the production registry SSR/CSS markup.
Metrics remain nullable until the relevant observer records them; unsupported
observers fail the test instead of being replaced with zero. The strict LCP
<2.5 s, INP <200 ms, CLS <0.1, and long-task <50 ms checks pass. The local
Astro route cannot boot its `PLATFORM_API` service binding (the current worker
dev process reports an invalid `DIAGNOSTICS_CAPABILITY` export), so no
deployed-route/Lighthouse/RUM measurement is claimed.

### AC263 — Vitest state and error coverage

The existing nine S09 web component suites passed 54 tests, covering async
state/access variants, exact safe error copy, retry timing/state, rollback and
focus behavior, and disclosure-safe/unauthorized fields. The new
`tests/integration/phase-02-slice-09-dom-interactions.test.ts` passes actual
jsdom submit/refetch interactions for delayed loading, conflict rollback,
retained values, live-region output, and focus restoration. The role
integration artifact adds full eight-role server-authoritative projection
assertions.

### AC264 — integration contracts and invalidation

`tests/integration/phase-02-slice-09-operation-boundaries.test.ts` passes
explicit required/optional field maps and unknown-field rejection for all
eight operations, exact per-operation error/success mappings, and A05-A08
signed-release/read boundary assertions. The existing
`phase-02-slice-09-registry-contract-evidence.test.ts` additionally passes
generated fixtures, browser mutation transport headers/ETag/idempotency,
rate-limit UI retention, and metadata-only realtime invalidation.
The new `phase-02-slice-09-list-query-options.test.ts` positively parses
compatible A06 query fixtures with every optional field populated (including
cursor, sort, direction, lifecycle, state, and coerced limit), while retaining
empty-query defaults and rejecting incompatible combinations through the locked
schema.

### AC265 — role, responsive, and resilience browser coverage

The existing S09 browser suites pass the protected route, landmarks,
keyboard/focus, live regions, 320/768/1024/1280 CSS-pixel layouts, 200% zoom,
offline/reconnect, stale multi-tab metadata, auth expiry, 429, and outage
checks. The new role fixture passes seven no-command protected projections and
the Creator owner-full named form fields; the hook-backed Creator component
render is covered by the React role integration test because the static
Playwright JSX fixture cannot safely invoke hook components. The new network
suite exercises browser offline/reconnect, a second-tab invalidation, 429
safe-boundary behavior, canonical retry navigation, and a subsequent 200
refetch, plus mutation 429/idempotency retention. No role is silently skipped.
The role/network runs remain browser-fixture evidence while the local
`PLATFORM_API` service binding is unavailable.

### AC266 — accessibility release checks

The existing S09 browser suite passes axe with zero serious/critical findings,
semantic landmarks, textual live/status output, keyboard focus, target-size,
reduced-motion, and no-trap checks. The added keyboard release test explicitly
tabs away from the first control and returns with Shift+Tab, then tabs from the
last registry control to an outside sentinel and returns with Shift+Tab.
VoiceOver and NVDA binaries are not available on this Linux host, so no manual
screen-reader execution is claimed.

### AC269 — source traceability

`tests/contracts/phase-02-slice-09-evidence-map.test.ts` executes every
allowlisted manifest command through a no-shell runner (and proves a nonzero
runner fails), checking each requested criterion's phase-plan row, runnable
command, concrete test file, marker, observed result, and explicit limitation.
It also retains the QA-RED counts and rejects a premature QA-GREEN claim. The existing
`phase-02-slice-09-locked-traceability.test.ts` passes source-layer assertions
for all eight BE03a operations, five BE03a feature-ledger rows, IA
AC-CMS-01/02/03/04/10, FE `ContentSchemaRegistryWorkbench` ownership, and the
BE03b/BE03c consumed 03a boundaries.

### AC270 — TDD sequence and retained RED evidence

The observed sequence is Contract → QA-RED → remediation implementation →
targeted QA-GREEN evidence → parent canonical validation. The locked 283-
criterion audit and its 252/19/12 result above are the retained Contract and
QA-RED record. The remediation tests were added as isolated verification
artifacts and their final GREEN runs are retained above.

During this pass, the first role browser attempt produced a real invalid-hook-
call failure for the Creator full form; the first performance-fixture attempt
produced a real CLS value of 0.141 due to late stylesheet adoption. Both
failures were corrected without lowering a threshold. The initial bundle,
coverage, hydration, activation-review, and release-review findings remain
part of the named baseline above. Canonical QA-GREEN output, including the
final coverage/bundle/review disposition, is intentionally pending parent
validation; no result was fabricated.

### AC271 — validation and reconciliation checks

`pnpm progress:check` passed, targeted Prettier checks passed, and the
operation-boundary artifact remains at or below 400 lines under both `wc -l`
and newline-split counting. The scoped `git diff --check` command produced no
whitespace findings. The executable per-criterion map test also passed. Full
`pnpm format:check` was not green because 37 unrelated active-agent files are
currently unformatted; those files were not changed here. Canonical
`pnpm validate` and final per-slice reconciliation remain parent-owned and
must run after active agents finish.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
