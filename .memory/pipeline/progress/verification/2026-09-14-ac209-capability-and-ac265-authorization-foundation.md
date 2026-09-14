# AC209 capability correction and AC265 authorization foundation — 2026-09-14

## Scope

This record covers the AC209 verifier correction and AC265 candidate-enrollment / runner-authorization foundation merged by [PR #76](https://github.com/WeJustJammin/nevrite-music/pull/76), the candidate-reference artifact bridge merged by [PR #77](https://github.com/WeJustJammin/nevrite-music/pull/77), the raw-Node import correction merged by [PR #78](https://github.com/WeJustJammin/nevrite-music/pull/78), and the token-service host/safe-phase correction merged by [PR #79](https://github.com/WeJustJammin/nevrite-music/pull/79) as `e68d2e7d92867d3f00ac1942a430437dc5c5be9e`. It also records the subsequent exact-provenance timestamp-skew failure and its locally validated correction. It distinguishes exact-main CI/staging evidence from hosted acceptance.

## AC209 local capability verifier

Commit `c9d9049a3b27c8e524a4835ea49b310c041d15f7` adds a read-only capability probe against the configured Cloudflare zone's `emailSendingAdaptive` dataset. It uses a bounded one-hour UTC window, requests at most one newest row, and selects only `status`. An empty result is accepted as proof that this dataset query is readable; it is not a delivery receipt. Malformed, unavailable, denied, truncated, or unexpected responses fail with fixed diagnostic codes and do not expose provider response details or the token.

The focused AC209 verifier suite passes **13 files / 250 tests**. The correction is now exact-main, but the protected live verifier below fails before any effect with `provider_graphql_error`; Zone Analytics Read for the Email Service dataset remains unproven. It has not established provider access or an AC209 delivery result.

## AC265 candidate and authorization foundation

The local implementation adds a fail-closed candidate provenance verifier and strict enrollment contract. The candidate identity binds successful GitHub CI and staging run IDs and attempts, fixed workflow identities, source SHA, staging environment and deployment ID, plus the expected artifact fields, digests, and origins. Dispatch inputs and artifact JSON are treated as untrusted; the enrollment boundary recomputes and validates the identity digest.

The enrollment RPC and migration create an immutable, private verified-candidate registry. The database checks the canonical identity digest and provenance tuple. The OIDC preparation contract pins the GitHub issuer, audience, repository IDs, protected `main` ref, staging environment, workflow path, workflow/source SHA, and run/attempt. The authorization records are short-lived (at most five minutes), store token/JTI digests rather than the token, and reject replay/conflicting requests. The tables are private with RLS forced and client access revoked.

The manual `run-ac265-hosted-e2e.yml` workflow is main-only, staging-scoped, and grants `id-token: write` only to its authorization job. Its report is explicitly labeled “Authorization foundation only. Hosted browser acceptance was not run.” Earlier preflight run `34814399455` registered the exact `ec31c640...` candidate and published its ref-only, one-day artifact; authorization-only run `34814535711` proved that raw Node loads the runtime but then failed inside the deliberately redacted authorization step. The retained log cannot honestly distinguish destination validation, GitHub OIDC retrieval, or the staging prepare request.

A source audit found that the client accepted only `pipelines.actions.githubusercontent.com`, while GitHub runner-generated token URLs can use subdomains under the GitHub-owned `.actions.githubusercontent.com` namespace. PR #79 now accepts only valid nonempty DNS subdomains of that namespace and keeps HTTPS, credential, non-default-port, fragment, redirect, timeout, and bounded-response protections. It also carries one of three fixed failure phases (`destination_validation`, `oidc_request`, or `staging_prepare`) through the wrapper without retaining provider errors or their causes. The earlier live log does not prove that hostname restriction was its failure cause.

Exact-main CI run `34818589300` and staging run `34819154810` passed for `e68d2e7d...`, producing staging deployment `6432620253`. Fresh preflight run `34819341770` failed before enrollment or artifact publication because GitHub's attempt endpoint reported the CI run as created at `2026-09-14T07:35:45Z` but started at `2026-09-14T07:35:44Z`. Every other live workflow, repository, SHA, attempt, artifact, deployment, migration, provider, and digest predicate passed. An independent comparison found 240 unique manifest entries, 240 files in each artifact, and zero missing, extra, or mismatched files.

The local TDD correction permits at most five seconds of positive provider created/start skew; exactly five seconds passes and six seconds fails. It does not relax completion ordering, the exact CI-before-staging requirement, identity, success, or artifact checks. The complete live `e68d2e7d...` tuple and downloaded artifacts now pass the verifier locally. The correction still needs protected promotion and a fresh preflight; no new candidate was registered, no authorization was attempted on `e68d2e7d...`, and no hosted browser matrix has passed.

## Local verification evidence

- AC265 path-filtered suite: **41 files / 374 tests passed**.
- `pnpm db:verify`: **52 pgTAP files / 1,917 tests passed**. Local database reset, lint, and type-check also pass.
- Latest `pnpm validate`: **passed (exit 0)**. The run completed **535 Vitest files / 4,228 passing tests plus one intentional skip** with **100% statements (13,028/13,028), branches (9,826/9,826), functions (2,151/2,151), and lines (12,109/12,109)**. It also passed the Slice 09 evidence suites, **101 functional E2E tests**, **5 real Slice 09 E2E tests**, build, bundle checks, and the local performance smoke (`p95=0.963413 ms`, threshold `500 ms`, zero errors). This is local validation evidence, not hosted acceptance.

## Exact-main and live baseline checked 2026-09-14

- GitHub `main` is `e68d2e7d92867d3f00ac1942a430437dc5c5be9e`. Exact-main CI [run 34818589300](https://github.com/WeJustJammin/nevrite-music/actions/runs/34818589300) passed.
- Exact-main staging [run 34819154810](https://github.com/WeJustJammin/nevrite-music/actions/runs/34819154810) passed and deployed source `e68d2e7d...` as staging deployment `6432620253`.
- AC265 candidate [preflight run 34819341770](https://github.com/WeJustJammin/nevrite-music/actions/runs/34819341770) failed at exact provenance verification before registration or artifact publication. The locally corrected verifier passes that live tuple, but its five-second created/start skew tolerance is not part of this exact-main baseline.
- The last successful production application promotion remains source `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, [run 34734646414](https://github.com/WeJustJammin/nevrite-music/actions/runs/34734646414), deployment `6417116181`. Production was not promoted by this local work.
- Exact-main, read-only AC209 observability [run 34813947512](https://github.com/WeJustJammin/nevrite-music/actions/runs/34813947512) passed protected preflight and immutable-checkout checks, then failed at **Verify bounded Cloudflare monitoring capabilities** with `provider_graphql_error` on `emailSendingAdaptive`. Zone Analytics Read scoped to `wejamm.in` remains unproven. The run sent no email, changed no queue or production state, performed no deployment, and produced no delivery receipt.

## Acceptance boundary

No acceptance criterion was closed by this work. Slice 09 remains **279/283** (depth ratio **0.986**); **AC209, AC211, AC265, and AC266 remain open**. Slices 10–17 remain dependency-locked until Slice 09 closes. Local contract, test, artifact, and database verification do not substitute for promotion and a live rerun of the timestamp-skew correction, successful OIDC authorization, a successful live AC209 exercise with retained evidence and a genuine receipt, or hosted AC265 identity/RLS/IdP/MFA/teardown acceptance.
