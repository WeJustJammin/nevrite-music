# Phase 2 Slice 09 local QA-GREEN and release-gate disposition

**Date**: 2026-09-03  
**Local automated result**: PASS  
**Slice release gate**: BLOCKED — 279/283 criteria verified; four environment-owned checks remain partial

This record adds the post-remediation QA-GREEN evidence. It does not rewrite the
[independent QA-RED baseline](phase-02-slice-09-verification-remediation.md),
which remains the historical 252 PASS / 19 FAIL / 12 UNVERIFIED observation.

## Canonical validation

An uninterrupted `pnpm validate` run exited 0 after all of these gates:

- OpenAPI contracts, generated live database types, progress consistency,
  Prettier, ESLint, and TypeScript passed.
- Vitest passed 416/416 files and 3,082/3,082 tests at exactly 100% coverage:
  11,779/11,779 statements, 8,990/8,990 branches, 1,939/1,939 functions, and
  10,931/10,931 lines.
- Default Chromium Playwright passed 102/102 tests using one worker. The
  serialized configuration avoids the shared Astro/Cloudflare virtual-module
  transform race; the S07 readiness regression also passed in the ordered run.
- Every workspace build, Worker dry-run build, bundle budget, and local
  performance smoke passed. API p95 remained below the 500 ms limit with zero
  errors.
- A clean-build regression also verifies that Wrangler's executable
  `runtime-entry.js` output is copied to the immutable `dist/index.js` release
  path; syntax validation and the API p95 import both pass against fresh bytes.

The dedicated production-built S09 route command also passed 5/5. It exercised
100-record performance, server-authorized list/detail/sign-in behavior, and
forged, expired, and revoked signed-session rejection.

Executable candidate `9e6b3f6a875af9f43851dbc00dc1d2a45aada85b` and baseline
`9b2cff7849b25dd12ffae6287b1024e50654bc14` are the parents of synthetic PR
merge `e0096f2a40f09a7374977d5cfa1494ef058ac195`, which passed all three jobs in
GitHub CI run `33839386892`. This confirms the committed code against its merge
base and the clean immutable artifact path; it does not claim exact-main-SHA,
staging, or production deployment evidence.

## Database and recovery evidence

`pnpm db:reset && pnpm db:test && pnpm db:types:check` passed from a clean local
database: 45 pgTAP files / 1,670 assertions, followed by an exact generated-type
match. The dblink dependency is isolated in the `extensions` schema and leaves
no public generated-type drift.

The independent-session harness also passed with committed independent psql
sessions, cursor 0, expired zero-row lease takeover, a same-response single
activation event, and a DLQ replay race with exactly one fenced owner. The
dedicated S09 pgTAP suite passed 247 assertions covering hashed event-claim
tokens, lease release/renewal/expiry, full-identity ACK/dead-letter fencing, and
retry ownership. Together with the focused recovery suites, this verifies
**P2-S09-AC-217** locally.

The operational-evidence and protected-promotion focused suite passed 6/6 files
and 74/74 tests. Expected artifact identity is supplied independently of the
candidate sidecar; workflow readers reject ambiguous or forged identities;
retained files are SHA/root checked; reviewer self-approval is forbidden; and
release/promotion CLI entry points fail closed through symlinks.

## Reconciled acceptance evidence

- **P2-S09-AC-262** is verified locally. Chromium measured the real
  production-built route and passed LCP, INP, CLS, and long-task budgets.
  Deployed RUM or hosted Lighthouse is not claimed.
- **P2-S09-AC-265** remains partial. The complete local role/resilience fixture
  and production-built route evidence pass, but the isolated signed-session
  harness is not deployed Supabase Auth/RLS/IdP E2E.
- **P2-S09-AC-270** is verified. Contract → retained QA-RED → implementation →
  refactor → focused QA-GREEN → uninterrupted canonical validation is recorded
  without lowering a threshold.
- **P2-S09-AC-271** is verified after full formatting, progress, diff,
  contiguous-ID, acceptance-count, and mirror checks.

## External release gates

The following criteria remain unchecked and must not be presented as production
evidence:

| Criterion     | Verified locally                                                          | Missing release evidence                                                       |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| P2-S09-AC-209 | Alert thresholds, payload policy, and provider-free boundary tests pass.  | Configured provider dashboard/API query and live alert delivery.               |
| P2-S09-AC-211 | Deterministic Tier 2 latency and DLQ-ratio samples pass.                  | Production telemetry attainment and the daily production DLQ query.            |
| P2-S09-AC-265 | Local browser role, network, and production-built route suites pass.      | Deployed Supabase Auth/RLS/IdP browser-to-backend E2E.                         |
| P2-S09-AC-266 | Axe, semantics, keyboard, focus, target-size, and live-region gates pass. | VoiceOver/Safari and NVDA/Firefox manual smoke on supported operating systems. |

No provider, paid integration, hosted deployment, or unavailable screen-reader
platform was activated or fabricated. Slice 09 therefore remains blocked at
279/283, and dependency-locked Slice 10 must not start.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
