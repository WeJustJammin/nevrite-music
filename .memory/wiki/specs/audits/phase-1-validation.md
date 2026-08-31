# Phase 1 Validation

**Phase**: Phase 1 — Operational foundation
**Run**: 2026-08-30T23:15:19-04:00
**Remediation verification**: 2026-08-30T23:36:08-04:00
**Clean-build remediation verification**: 2026-08-30T23:53:24-04:00
**Exact-SHA CI verification**: 2026-08-31T00:02:22-04:00
**Main promotion attempt**: 2026-08-31T00:46:45-04:00
**Artifact-path main verification**: 2026-08-31T01:13:23-04:00
**Staging runtime attempt**: 2026-08-31T01:13:49-04:00
**Runtime remediation verification**: 2026-08-31T01:57:37-04:00
**Workflow**: `/validate-phase`
**Verdict**: **FAIL**

Phase implementation tracking is complete at 7/7 slices, but the independent
production-readiness gate cannot pass until the staging runtime remediation is
merged, the legacy Pages ownership of `staging.wejamm.in` is removed with owner
authorization, and the exact immutable candidate passes the strengthened live
health contract.

## Quality Shard

| Gate                                  | Result         | Fresh evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit, contract, and integration tests | PASS           | `pnpm validate`: 148 files, 877 tests, zero failures                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Coverage                              | PASS           | 100% statements (4541/4541), branches (3920/3920), functions (719/719), and lines (4225/4225)                                                                                                                                                                                                                                                                                                                                                                                                         |
| Mutation testing                      | NOT APPLICABLE | No mutation-test runner or configuration is installed; the workflow requires this gate only when supported                                                                                                                                                                                                                                                                                                                                                                                            |
| Format                                | PASS           | `pnpm format:check` exited 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Lint                                  | PASS           | `pnpm lint` exited 0 with zero reported warnings/errors                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Type check                            | PASS           | `pnpm type-check` exited 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Build                                 | PASS           | All applicable packages, Astro apps, and the Worker dry-run build completed                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Aggregate local validation            | PASS           | `pnpm validate` exited 0 after 877 Vitest tests, 21 Playwright tests, and all build gates; no Node warnings were emitted                                                                                                                                                                                                                                                                                                                                                                              |
| Database migrations                   | PASS           | Local reset applied all 14 migrations; schema lint passed; 11 pgTAP files/392 tests passed; generated types matched                                                                                                                                                                                                                                                                                                                                                                                   |
| Deployment strategy                   | PASS (static)  | Release-promotion, immutable-artifact, forward-only migration, and recovery contracts are present and covered by the passing local suite                                                                                                                                                                                                                                                                                                                                                              |
| CI for implemented Phase 1 state      | PASS           | Main run `33359583799` succeeded for merge revision `1bb432358cc44f992ce3d15597d298cce86d0a72`: quality, database, clean immutable build, and exact artifact upload all passed                                                                                                                                                                                                                                                                                                                        |
| Staging deployment and smoke          | FAIL           | Run `33359752069` verified the corrected artifact boundary and deployed the API and web scripts, but the web custom-domain trigger failed because `staging.wejamm.in` remains attached to the legacy Pages project. Live tracing also proved the API Worker lacked the required Supabase bindings and rejected the Queue binding as an unknown server key. The current local remediation is regression-covered; exact CI and staging proof remain required. See `phase-1-staging-runtime-evidence.md` |

### Blocking Findings

1. **VAL-P1-001 — RESOLVED — Green immutable Phase 1 CI evidence.** Exact run
   `33357532073` passed all three jobs for main merge
   `be36d68c495b9a244dac4fd29c24a83e0c68ce7a`, including clean build and
   exact immutable artifact upload.
2. **VAL-P1-002 — Staging does not satisfy the implemented health contract.**
   `STAGING_WEB_ORIGIN=https://staging.wejamm.in` and
   `STAGING_API_ORIGIN=https://wejammin-api-staging.wejammin.workers.dev`
   produced `API health contract mismatch`.
3. **VAL-P1-003 — RESOLVED — Aggregate validation permitted warning output.**
   Playwright forces `FORCE_COLOR` in worker and web-server children while the
   agent shell exports `NO_COLOR`; the config now removes the conflicting
   inherited variable before child launch. A red-to-green regression contract,
   a clean 21/21 Playwright run, and the clean 871-test `pnpm validate` run
   verify the resolution.
4. **VAL-P1-004 — RESOLVED — Clean checkout build lacked composite
   declarations.** Package `build` scripts used `tsc --noEmit`, so a clean CI
   runner could not satisfy project-reference outputs and failed with TS6305.
   The seven composite library packages now build with `tsc --build`; a
   red-to-green workspace contract, a clean `tsc --build --clean` reconstruction,
   the exact three-script local artifact chain, and exact-SHA CI run
   `33355571907` verify the resolution.
5. **VAL-P1-005 — RESOLVED — Staging consumed the wrong archive paths.** Run
   `33357943998` proved the downloaded artifact retains its `apps/` prefix,
   while staging and downstream production verification and deploy commands
   omitted that segment. Main run `33359583799` and staging run `33359752069`
   verify the corrected immutable boundary and both deployment inputs.
6. **VAL-P1-006 — RESOLVED — Production candidate handling assumed
   a dirty runner.** The production workflow downloaded and read the candidate
   before checkout, so a clean runner lacked the identity script and a later
   checkout could delete the candidate. It now checks out `DEPLOY_SHA` first,
   then downloads and validates the candidate before workspace setup. A
   red-to-green ordering contract, both promotion contract suites, and exact
   main CI run `33359583799` verify the fix.
7. **VAL-P1-007 — Legacy Pages ownership blocks the Worker custom domain.**
   Staging run `33359752069` uploaded `wejammin-web-staging`, then Cloudflare
   rejected the trigger with code `100117` because the active Pages project
   `wejammin-web-staging` still owns `staging.wejamm.in` and its DNS record. The
   read-only API result and exact run excerpt are preserved in
   `phase-1-staging-runtime-evidence.md`.
   Detaching that staging-only Pages domain is an external destructive action
   and remains pending explicit owner authorization.
8. **VAL-P1-008 — REMEDIATED LOCALLY — API deployment omitted required server
   configuration.** Live tail evidence showed `SUPABASE_SECRET_KEY` and
   `SUPABASE_URL` missing. The shared deployment script now supplies the URL as
   a Worker variable and the key through a mode-600 temporary Wrangler secrets
   file, then removes the file. It rejects non-canonical, credential-bearing,
   or whitespace-bearing origins before invoking Wrangler. A fake-provider
   security regression and both environment dry-runs pass.
9. **VAL-P1-009 — REMEDIATED LOCALLY — Strict configuration parsing rejected
   Cloudflare resource bindings.** The deployed Queue binding reached the
   closed Zod server schema and produced an unknown-key startup exception.
   Runtime entrypoints now project only approved server keys before strict
   validation; direct parsing remains strict. Red-to-green config and Worker
   boundary tests pass.
10. **VAL-P1-010 — REMEDIATED LOCALLY — Staging smoke could accept the stale
    Pages shell.** The old static homepage satisfied the title/heading check.
    Verification now requires the protected dynamic route to return the exact
    303 SSR redirect contract; a regression proves the stale 200 shell fails.
11. **VAL-P1-011 — REMEDIATED LOCALLY — Staging shared production Queue names.**
    Staging now uses `platform-jobs-staging` and
    `platform-jobs-staging-dlq`, while production retains its reserved names.
    Queue admission selects the expected name from `APP_ENVIRONMENT`; hosted
    environment regressions, the independent Wrangler contract, and dry-runs
    pass. The isolated resources are not present in the pre-remediation account
    inventory; exact staging must verify Wrangler provisioning and binding.

## Spec Coverage

The Phase 1 coverage sweep passed:

- seven slice trackers are present;
- all 390 unique phase-plan acceptance criteria have matching checked tracker
  entries;
- zero criteria are unchecked, missing, or extra;
- all 488 tracker source links resolve;
- IA, BE, and FE inventories contain 43 IA shards, 156 BE specifications, and
  43 FE specifications, with their layer indexes complete; and
- `pnpm progress:check` exited 0.

## Readiness Shard

**Status**: **NOT RUN — quality prerequisite failed**

`validate-phase-readiness` requires the quality shard to complete successfully.
Because the staging quality gate failed, no readiness
applicability matrix or API-documentation, accessibility, performance,
security/dependency, feature-ledger, or boundary-stub verdict is represented as
current evidence by this run.

## Constrained Next Step

1. Commit, review, and merge the staging runtime remediation with green
   exact-SHA CI.
2. With explicit owner authorization, detach only `staging.wejamm.in` from the
   legacy Pages project and remove its conflicting staging DNS record.
3. Verify the resulting staging workflow deploys the exact artifact and passes
   `pnpm verify:staging` successfully.
4. Rerun `/validate-phase`; only then may the readiness shard execute.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]
