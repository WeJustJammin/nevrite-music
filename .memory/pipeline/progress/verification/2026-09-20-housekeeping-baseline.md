# Phase 2 housekeeping baseline — 2026-09-20

## Scope

Reconcile the working tree, preserve unique pipeline history, establish the
exact local runtime, and refresh the live Slice 09 baseline before any new
external-gate execution or acceptance-policy propagation.

## Workspace cleanup

- Classified 20 untracked files: 18 generated coverage JSON files and two
  unique pipeline records.
- Moved 15 generated coverage directories containing 18 JSON files
  (21,795,356 bytes) to the desktop trash. They are recoverable and were not
  acceptance evidence.
- Added narrow ignore rules for `.coverage-*`, `.ctx-coverage`, and
  `.ctx-*-cov` directories so focused local coverage does not dirty the
  worktree again.
- Preserved and adopted the recovered 2026-09-10 session log and AC266 Windows
  handoff. Both were scanned for common email, credential, JWT, and
  authorization-header patterns; none were present.

## Runtime and repository health

- Installed user-local Node `v22.23.1` and paired it explicitly with pnpm
  `11.24.0`, matching `package.json` and `.node-version`.
- `pnpm install --frozen-lockfile` passed for all 11 workspace projects without
  rewriting the lockfile.
- `pnpm progress:check` passed.
- `git fsck --connectivity-only` exited 0. It reported only recoverable dangling
  objects from prior history; no missing or corrupt reachable object exists.
- Fresh `pnpm validate` passed 535 Vitest files / 4,228 tests plus one skip at
  100% coverage, the Slice 09 evidence gate, 101 functional plus 5 real Slice
  09 E2E tests, workspace builds, bundle budgets, and performance smoke
  (`p95=1.174159 ms`, threshold `500 ms`, zero errors).
- Fresh `pnpm db:verify` passed 52 pgTAP files / 1,917 tests with migrated type
  parity.
- `git diff --check` passed before the progress reconciliation and is rerun at
  the final housekeeping gate.

## Live exact-main baseline

- GitHub `main`, `origin/main`, and the starting local HEAD were exact SHA
  `918f598525de772c82b0a0bcd82348ea8f5d523d` (PR #80).
- CI run `34823698333` and staging run `34824312138` passed; staging deployment
  `6433521892` is the authoritative deployment for candidate provenance.
- AC265 preflight run `34824500796` passed. Authorization-foundation run
  `34824651793` failed closed at `staging_prepare`; hosted acceptance did not
  run.
- AC209 run `34813947512` failed closed with redacted
  `provider_graphql_error`; it produced no receipt or production mutation.
- AC211 run `34424101528` retained no report because the natural sample floors
  were not met.
- No GitHub Actions run newer than `2026-09-14T08:49:05Z` existed at the time
  of this refresh.

## Acceptance boundary

Housekeeping does not change acceptance. Slice 09 remains 279/283 with AC209,
AC211, AC265, and AC266 open until the separately authorized decision
propagation is applied. The owner has directed AC266 to be deferred because
the required external devices are not currently practical; that disposition
is not evidence and is not recorded here as a pass.
