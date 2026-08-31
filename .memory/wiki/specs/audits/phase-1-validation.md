# Phase 1 Validation

**Phase**: Phase 1 — Operational foundation
**Initial run**: 2026-08-30T23:15:19-04:00
**Remediation verification**: 2026-08-31T17:51:00-04:00
**Workflow**: /validate-phase
**Validation branch**: codex/fix-phase-1-readiness-blockers
**Verdict**: **FAIL-CLOSED — local remediation passes; live staging recertification and one external production-protection prerequisite remain**

Implementation tracking remains complete at 7/7 slices and 390/390 acceptance
criteria. All seven readiness findings have been addressed in source, tests, or
fail-closed operational controls. The aggregate local validation command passes.
Phase advancement remains blocked until the remediated artifact passes CI and
live staging verification and GitHub can enforce the locked production reviewer
rule.

## Remediation Summary

| Finding                                                  | Current status                          | Fresh closure evidence                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VAL-P1-013 — upload-admission summary/focus IDs          | RESOLVED                                | Error links and first-invalid focus normalize contract keys to the real kebab-case field IDs; focused accessibility regressions pass                                                                                                                                                                                                                                                                  |
| VAL-P1-014 — upload-completion result announcement/focus | RESOLVED                                | Success is a polite atomic status with a programmatically focused result heading; error/status politeness, table sorting, and route-heading focus debt were also corrected                                                                                                                                                                                                                            |
| VAL-P1-015 — hard JavaScript budgets                     | RESOLVED                                | Complete Workbench hydration closure is 14,913 gzip bytes against 35,840; honest initial static closure is 72,576 against 92,160; largest lazy/shared chunk is 27,884 against 81,920                                                                                                                                                                                                                  |
| VAL-P1-016 — deterministic Phase 1 p95 smoke absent      | RESOLVED                                | Validation and CI run one virtual user, 20 sequential requests, zero retries, strict p95 under 500 ms, immutable artifact identity, and fail-closed error accounting; fresh p95 is 1.584 ms with 0/20 errors                                                                                                                                                                                          |
| VAL-P1-017 — cleartext staging transport                 | IMPLEMENTED; LIVE PROOF PENDING         | Web and API edge boundaries return 308 to the exact HTTPS URL outside loopback; staging verifier rejects missing or wrong redirects and probes web, API, protected runtime, and a discovered static asset                                                                                                                                                                                             |
| VAL-P1-018 — locked response headers absent              | IMPLEMENTED; LIVE PROOF PENDING         | Web, API, generated Worker wrapper, static asset, redirects, 404s, and protected 500s carry the exact locked policy in focused tests; production and staging static assets retain run_worker_first true                                                                                                                                                                                               |
| VAL-P1-019 — unprotected automatic production promotion  | SAFELY CONTAINED; EXTERNAL PREREQUISITE | Automatic staging-to-production triggering is removed; production is manual-only with immutable staging run and SHA verification, exact-main policy, reviewer and admin-bypass checks, and the live workflow disabled. The live environment now has `can_admins_bypass: false`; GitHub rejected only the required reviewer rule with HTTP 422 because the private-repository plan does not support it |

No production deployment, production DNS mutation, provider activation, billing
change, repository visibility change, or secret write was performed.

## Quality Shard

| Gate                                            | Result         | Fresh evidence                                                                                                                                    |
| ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical aggregate validation                  | PASS           | pnpm validate exited 0 in 66.6 seconds                                                                                                            |
| Unit, contract, integration, and coverage tests | PASS           | 158 Vitest files and 939 tests; 100% statements, branches, functions, and lines                                                                   |
| Browser E2E                                     | PASS           | 26/26 Playwright tests, including axe, focus, responsive layout, real upload forms, dev-module loading, island hydration, and gated chunk loading |
| Format, lint, and type check                    | PASS           | Canonical format check, zero-warning ESLint, and TypeScript project build passed                                                                  |
| Build                                           | PASS           | All packages, Astro apps, and Hono Worker build; Worker is 446.09 KiB upload and 101.72 KiB gzip                                                  |
| Database migrations                             | PASS           | Local Supabase validation completed against the backed-up development database; shutdown preserved a backup                                       |
| OpenAPI and spec coverage                       | PASS           | Contract generation, schema types, progress consistency, 7/7 slices, 390/390 criteria, and 488/488 source links pass                              |
| Dependency audit                                | PASS           | pnpm audit --audit-level=high reports no known vulnerabilities                                                                                    |
| Mutation testing                                | NOT APPLICABLE | No mutation runner or configuration is installed; this gate remains conditional on supported tooling                                              |

## Readiness Shard

**Status**: **FAIL-CLOSED**

| Gate                                       | Classification           | Result           | Basis                                                                                                                                                                            |
| ------------------------------------------ | ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API documentation synchronization          | Required                 | PASS             | Runtime contracts and generated OpenAPI remain synchronized                                                                                                                      |
| Accessibility                              | Required                 | PASS             | Automated coverage, axe, keyboard and focus, semantic-state, and route-focus regressions pass                                                                                    |
| Static bundle budgets                      | Required hard criteria   | PASS             | Built emitted-graph verifier measures recursive initial closure and explicit-action lazy chunks without manifest or no-manifest undercounting                                    |
| Phase 1 deterministic p95 smoke            | Required exit criterion  | PASS             | 20/20 samples, zero errors, p50 0.670 ms, p95 1.584 ms, p99 20.209 ms, strict p95 below 500 ms                                                                                   |
| Representative-data k6 and pgbench profile | Deferred once            | DEFERRED         | PERF-DEFER-01 remains bounded to the first data-bearing candidate                                                                                                                |
| Security hardening and non-invasive DAST   | Always on                | PENDING LIVE     | Local runtime and contract evidence pass; the remediated artifact must prove exact redirects and headers on staging                                                              |
| Dependency audit                           | Always on                | PASS             | No known vulnerabilities at the high-or-critical gate                                                                                                                            |
| Production environment approval            | Required guard           | BLOCKED EXTERNAL | Workflow is disabled and fails closed; exact-main policy and disabled administrator bypass are live, but the private-repository plan cannot configure the required reviewer rule |
| Live production deployment                 | Not required for Phase 1 | NOT APPLICABLE   | Production activation remains out of scope and disabled                                                                                                                          |

## Accessibility Closure

Upload-admission violations now map camel-case and dotted contract paths to the
real kebab-case control IDs before generating summary anchors or the first focus
target. Upload-completion success uses a polite atomic live region and focuses a
stable result heading after the success transition. Non-rate errors use assertive
alert semantics, active modified-date columns expose aria-sort, and route
navigation moves focus to the primary heading without disrupting initial page
load.

Deferred Workbench controls retain meaningful server-rendered summaries. Their
aria-controls targets exist before and after activation. The hydration E2E proves
Vite and Astro modules load, the island removes its SSR marker, query state is
interactive, heavy job controls are absent initially, and their chunk appears
only after explicit activation.

## Performance Closure

The bundle verifier discovers exact built entry roots, recursively walks static
imports, promotes immediate runtime dependencies into the initial route, fails
on unresolved local imports, and applies identical emitted-graph logic with or
without a manifest. Optional job, upload, completion, and evidence panels load
only after an explicit user action while their safe server summaries remain in
the initial document.

| Asset or scope                        |   Fresh gzip | Locked limit | Result |
| ------------------------------------- | -----------: | -----------: | ------ |
| Workbench immediate hydration closure | 14,913 bytes | 35,840 bytes | PASS   |
| Initial infrastructure route closure  | 72,576 bytes | 92,160 bytes | PASS   |
| Largest lazy or shared chunk          | 27,884 bytes | 81,920 bytes | PASS   |

The deterministic API smoke is wired into local validation, pull-request CI,
and staging promotion. Bundle and p95 evidence carry the exact source revision,
locked thresholds, and `passed: true`; staging finalization embeds and validates
that evidence before candidate publication, and production revalidates it.
Exact-threshold p95, malformed evidence, non-2xx responses, sample-count drift,
hidden retries, and superseded staging runs fail closed.

**PERF-DEFER-01 — Representative-data performance profile.** Phase 1 contains no
data-bearing domain feature. Execute the locked representative seed, k6, and
pgbench profile on the first candidate carrying data-bearing user or domain
functionality and no later than production-candidacy approval or the first
data-bearing production release, whichever occurs first. No data-bearing
promotion is permitted without seed checksum, request mix, p95 and p99, error
rate, fresh-restore and warm results, database timing, and query-plan identity
evidence.

## Security and Release Protection Closure

The API and web apply the locked six-header set to ordinary responses, errors,
redirects, and static assets. HTML CSP nonces are request-unique, stale nonce
attributes are replaced, and rewrite or adapter failures return protected generic
500 responses. Development uses a separate Wrangler config so Vite owns its
module URLs; production and staging continue to route static assets through the
security wrapper.

The production workflow accepts only an explicit manual dispatch on main with
confirmed production intent, an immutable successful staging run, and the exact
source SHA. Its preflight verifies the pinned staging workflow identity, exact
sole-main deployment branch policy, a required reviewer, and disabled
administrator bypass before entering the production environment. The live
environment now reports `can_admins_bypass: false`. The workflow remains
disabled because GitHub returned HTTP 422 when the reviewer rule was requested
under the current private-repository plan.

## Remaining Gates

1. Push this branch and require exact-SHA CI plus immutable artifact generation
   to pass.
2. Promote that artifact to staging and run the strengthened pnpm verify:staging
   and staging p95 smoke against the HTTPS origins.
3. Upgrade the GitHub plan or otherwise move to a repository visibility and plan
   combination that supports required reviewers for this private repository;
   then configure the reviewer, re-enable the manual workflow, and rerun
   /validate-phase.
4. Do not advance to Phase 2 or activate production while either remaining gate
   is incomplete.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]
