# AC209 capability correction and AC265 authorization foundation — 2026-09-14

## Scope

This record covers the AC209 verifier correction and AC265 candidate-enrollment / runner-authorization foundation merged by [PR #76](https://github.com/WeJustJammin/nevrite-music/pull/76), the candidate-reference artifact bridge merged by [PR #77](https://github.com/WeJustJammin/nevrite-music/pull/77), the raw-Node import correction merged by [PR #78](https://github.com/WeJustJammin/nevrite-music/pull/78) as `ec31c640b052b26c0febc232a8e63cb2125163d9`, and the follow-on token-service host/diagnostic correction that remains locally validated and pending promotion. It distinguishes exact-main CI/staging evidence from hosted acceptance.

## AC209 local capability verifier

Commit `c9d9049a3b27c8e524a4835ea49b310c041d15f7` adds a read-only capability probe against the configured Cloudflare zone's `emailSendingAdaptive` dataset. It uses a bounded one-hour UTC window, requests at most one newest row, and selects only `status`. An empty result is accepted as proof that this dataset query is readable; it is not a delivery receipt. Malformed, unavailable, denied, truncated, or unexpected responses fail with fixed diagnostic codes and do not expose provider response details or the token.

The focused AC209 verifier suite passes **13 files / 250 tests**. The correction is now exact-main, but the protected live verifier below fails before any effect because the token lacks Zone Analytics Read for the Email Service dataset. It has not established provider access or an AC209 delivery result.

## AC265 candidate and authorization foundation

The local implementation adds a fail-closed candidate provenance verifier and strict enrollment contract. The candidate identity binds successful GitHub CI and staging run IDs and attempts, fixed workflow identities, source SHA, staging environment and deployment ID, plus the expected artifact fields, digests, and origins. Dispatch inputs and artifact JSON are treated as untrusted; the enrollment boundary recomputes and validates the identity digest.

The enrollment RPC and migration create an immutable, private verified-candidate registry. The database checks the canonical identity digest and provenance tuple. The OIDC preparation contract pins the GitHub issuer, audience, repository IDs, protected `main` ref, staging environment, workflow path, workflow/source SHA, and run/attempt. The authorization records are short-lived (at most five minutes), store token/JTI digests rather than the token, and reject replay/conflicting requests. The tables are private with RLS forced and client access revoked.

The manual `run-ac265-hosted-e2e.yml` workflow is main-only, staging-scoped, and grants `id-token: write` only to its authorization job. Its report is explicitly labeled “Authorization foundation only. Hosted browser acceptance was not run.” Fresh preflight run `34814399455` registered the exact `ec31c640...` candidate and published its ref-only, one-day artifact; the downloaded file passed exact name, one-file, one-line, newline, UUID, and staging-scheme validation. Authorization-only run `34814535711` proved that raw Node now loads the runtime, but then failed inside the single deliberately redacted authorization step. The retained log cannot honestly distinguish destination validation, GitHub OIDC retrieval, or the staging prepare request.

A source audit found that the client accepted only `pipelines.actions.githubusercontent.com`, while GitHub runner-generated token URLs can use region-sharded hosts under the GitHub-owned `.actions.githubusercontent.com` namespace. The local TDD correction accepts only valid nonempty DNS subdomains of that namespace and keeps HTTPS, credential, non-default-port, fragment, redirect, timeout, and bounded-response protections. It also carries one of three fixed failure phases (`destination_validation`, `oidc_request`, or `staging_prepare`) through the wrapper without retaining provider errors or their causes. This correction is not yet promoted, and the prior live log does not prove it was the failure cause. No OIDC authorization or hosted browser matrix has passed.

## Local verification evidence

- Integrated AC265 focused suite: **42 files / 389 tests passed**.
- `pnpm db:verify`: **52 pgTAP files / 1,917 tests passed**. Local database reset, lint, and type-check also pass.
- Latest `pnpm validate`: **passed (exit 0)**. The run completed **535 Vitest files / 4,227 passing tests plus one intentional skip** with **100% statements (13,028/13,028), branches (9,826/9,826), functions (2,151/2,151), and lines (12,109/12,109)**. It also passed the Slice 09 evidence suites, **101 functional E2E tests**, **5 real Slice 09 E2E tests**, build, bundle checks, and the local performance smoke (`p95=0.678046 ms`, threshold `500 ms`, zero errors). This is local validation evidence, not hosted acceptance.

## Exact-main and live baseline checked 2026-09-14

- GitHub `main` is `ec31c640b052b26c0febc232a8e63cb2125163d9`. Exact-main CI [run 34813554693](https://github.com/WeJustJammin/nevrite-music/actions/runs/34813554693) passed.
- Exact-main staging [run 34814232319](https://github.com/WeJustJammin/nevrite-music/actions/runs/34814232319) passed and deployed source `ec31c640...` as staging deployment `6431777124`. AC265 candidate [preflight run 34814399455](https://github.com/WeJustJammin/nevrite-music/actions/runs/34814399455) then passed, registered the candidate, and published a strictly validated candidate-reference artifact.
- AC265 authorization-only [run 34814535711](https://github.com/WeJustJammin/nevrite-music/actions/runs/34814535711) loaded the raw runtime and then failed with the existing generic authorization message. The local GitHub token-service host/phase-diagnostic TDD correction is not part of this exact-main baseline.
- The last successful production application promotion remains source `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, [run 34734646414](https://github.com/WeJustJammin/nevrite-music/actions/runs/34734646414), deployment `6417116181`. Production was not promoted by this local work.
- Exact-main, read-only AC209 observability [run 34813947512](https://github.com/WeJustJammin/nevrite-music/actions/runs/34813947512) passed protected preflight and immutable-checkout checks, then failed at **Verify bounded Cloudflare monitoring capabilities** with `provider_graphql_error` on `emailSendingAdaptive`. Zone Analytics Read scoped to `wejamm.in` remains unproven. The run sent no email, changed no queue or production state, performed no deployment, and produced no delivery receipt.

## Acceptance boundary

No acceptance criterion was closed by this work. Slice 09 remains **279/283** (depth ratio **0.986**); **AC209, AC211, AC265, and AC266 remain open**. Slices 10–17 remain dependency-locked until Slice 09 closes. Local contract, test, and database verification do not substitute for promotion and a live rerun of the token-service correction, successful OIDC authorization, a successful live AC209 exercise with retained evidence and a genuine receipt, or hosted AC265 identity/RLS/IdP/MFA/teardown acceptance.
