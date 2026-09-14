# AC209 capability correction and AC265 authorization foundation — 2026-09-14

## Scope

This record covers the local AC209 verifier correction and the AC265 candidate-enrollment / runner-authorization foundation in the `codex/ac265-protected-runner` worktree. It distinguishes those local changes from exact-main evidence and hosted acceptance.

## AC209 local capability verifier

Commit `c9d9049a3b27c8e524a4835ea49b310c041d15f7` adds a read-only capability probe against the configured Cloudflare zone's `emailSendingAdaptive` dataset. It uses a bounded one-hour UTC window, requests at most one newest row, and selects only `status`. An empty result is accepted as proof that this dataset query is readable; it is not a delivery receipt. Malformed, unavailable, denied, truncated, or unexpected responses fail with fixed diagnostic codes and do not expose provider response details or the token.

The focused AC209 verifier suite passes **13 files / 250 tests**. This is local test evidence. The exact-main protected checks below still fail at the live capability step, so the local correction has not established live provider access or an AC209 delivery result.

## AC265 candidate and authorization foundation

The local implementation adds a fail-closed candidate provenance verifier and strict enrollment contract. The candidate identity binds successful GitHub CI and staging run IDs and attempts, fixed workflow identities, source SHA, staging environment and deployment ID, plus the expected artifact fields, digests, and origins. Dispatch inputs and artifact JSON are treated as untrusted; the enrollment boundary recomputes and validates the identity digest.

The enrollment RPC and migration create an immutable, private verified-candidate registry. The database checks the canonical identity digest and provenance tuple. The OIDC preparation contract pins the GitHub issuer, audience, repository IDs, protected `main` ref, staging environment, workflow path, workflow/source SHA, and run/attempt. The authorization records are short-lived (at most five minutes), store token/JTI digests rather than the token, and reject replay/conflicting requests. The tables are private with RLS forced and client access revoked.

The manual `run-ac265-hosted-e2e.yml` workflow is main-only, staging-scoped, and grants `id-token: write` only to its authorization job. Its report is explicitly labeled “Authorization foundation only. Hosted browser acceptance was not run.” The current branch has no hosted run; candidate enrollment and OIDC preparation have only local implementation/test evidence, not a live staging authorization or browser-matrix result.

## Local verification evidence

- Integrated AC265 focused suite: **39 files / 323 tests passed**.
- `pnpm db:verify`: **52 pgTAP files / 1,917 tests passed**. Local database reset, lint, and type-check also pass.
- Final `pnpm validate`: **passed (exit 0)**. The run completed **534 Vitest files / 4,212 passing tests plus one intentional skip** with **100% statements (13,028/13,028), branches (9,826/9,826), functions (2,151/2,151), and lines (12,109/12,109)**. It also passed the Slice 09 evidence suites, **101 functional E2E tests**, **5 real Slice 09 E2E tests**, build, bundle checks, and the local performance smoke (`p95=0.831862 ms`, threshold `500 ms`, zero errors). This is local validation evidence, not hosted acceptance.

## Exact-main and live baseline checked 2026-09-14

- GitHub `main` was `74ef45ce90712e51e1c1b34ce37180944408edaf` (commit time `2026-09-14T00:52:32Z`). Exact-main CI [run 34794061024](https://github.com/WeJustJammin/nevrite-music/actions/runs/34794061024) passed.
- Exact-main staging [run 34794440541](https://github.com/WeJustJammin/nevrite-music/actions/runs/34794440541) passed and deployed source `74ef45ce...` as staging deployment `6428523608`. Read-only candidate provenance [preflight run 34794679222](https://github.com/WeJustJammin/nevrite-music/actions/runs/34794679222) also passed on that SHA. These runs predate the current local worktree changes.
- The last successful production application promotion remains source `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, [run 34734646414](https://github.com/WeJustJammin/nevrite-music/actions/runs/34734646414), deployment `6417116181`. Production was not promoted by this local work.
- Exact-main AC209 observability runs [34794940821](https://github.com/WeJustJammin/nevrite-music/actions/runs/34794940821), [34796668543](https://github.com/WeJustJammin/nevrite-music/actions/runs/34796668543), and [34800936599](https://github.com/WeJustJammin/nevrite-music/actions/runs/34800936599) failed on source `74ef45ce...`; the latest failed at **Verify bounded Cloudflare monitoring capabilities**. No delivery receipt or AC209 acceptance evidence was produced.

## Acceptance boundary

No acceptance criterion was closed by this work. Slice 09 remains **279/283** (depth ratio **0.986**); **AC209, AC211, AC265, and AC266 remain open**. Slices 10–17 remain dependency-locked until Slice 09 closes. Local contract, test, and database verification do not substitute for exact-main promotion of these changes, a successful live AC209 exercise with retained evidence and a genuine receipt, or hosted AC265 identity/RLS/IdP/MFA/teardown acceptance.
