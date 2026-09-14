# AC209 capability correction and AC265 authorization foundation — 2026-09-14

## Scope

This record covers the AC209 verifier correction and AC265 candidate-enrollment / runner-authorization foundation merged by [PR #76](https://github.com/WeJustJammin/nevrite-music/pull/76), the candidate-reference artifact bridge merged by [PR #77](https://github.com/WeJustJammin/nevrite-music/pull/77) as `eb5f18e081f091d5394201fca2613bb0299f175f`, and the follow-on raw Node import correction that remains locally validated and pending promotion. It distinguishes exact-main CI/staging evidence from hosted acceptance.

## AC209 local capability verifier

Commit `c9d9049a3b27c8e524a4835ea49b310c041d15f7` adds a read-only capability probe against the configured Cloudflare zone's `emailSendingAdaptive` dataset. It uses a bounded one-hour UTC window, requests at most one newest row, and selects only `status`. An empty result is accepted as proof that this dataset query is readable; it is not a delivery receipt. Malformed, unavailable, denied, truncated, or unexpected responses fail with fixed diagnostic codes and do not expose provider response details or the token.

The focused AC209 verifier suite passes **13 files / 250 tests**. The correction is now exact-main, but the protected live verifier below fails before any effect because the token lacks Zone Analytics Read for the Email Service dataset. It has not established provider access or an AC209 delivery result.

## AC265 candidate and authorization foundation

The local implementation adds a fail-closed candidate provenance verifier and strict enrollment contract. The candidate identity binds successful GitHub CI and staging run IDs and attempts, fixed workflow identities, source SHA, staging environment and deployment ID, plus the expected artifact fields, digests, and origins. Dispatch inputs and artifact JSON are treated as untrusted; the enrollment boundary recomputes and validates the identity digest.

The enrollment RPC and migration create an immutable, private verified-candidate registry. The database checks the canonical identity digest and provenance tuple. The OIDC preparation contract pins the GitHub issuer, audience, repository IDs, protected `main` ref, staging environment, workflow path, workflow/source SHA, and run/attempt. The authorization records are short-lived (at most five minutes), store token/JTI digests rather than the token, and reject replay/conflicting requests. The tables are private with RLS forced and client access revoked.

The manual `run-ac265-hosted-e2e.yml` workflow is main-only, staging-scoped, and grants `id-token: write` only to its authorization job. Its report is explicitly labeled “Authorization foundation only. Hosted browser acceptance was not run.” Preflight run `34811541315` registered the exact candidate and published its ref-only, one-day artifact; the downloaded file passed exact name, one-file, one-line, newline, UUID, and staging-scheme validation. Authorization-only run `34811631563` failed before requesting OIDC or contacting staging because raw Node could not resolve the root-undeclared `@wejammin/contracts` alias. A local subprocess regression reproduced that failure, then passed after both runtime imports changed to the established specific relative source path. The fix remains pending promotion; no OIDC authorization or hosted browser matrix has passed.

## Local verification evidence

- Integrated AC265 focused suite: **41 files / 368 tests passed**.
- `pnpm db:verify`: **52 pgTAP files / 1,917 tests passed**. Local database reset, lint, and type-check also pass.
- Latest `pnpm validate`: **passed (exit 0)**. The run completed **535 Vitest files / 4,222 passing tests plus one intentional skip** with **100% statements (13,028/13,028), branches (9,826/9,826), functions (2,151/2,151), and lines (12,109/12,109)**. It also passed the Slice 09 evidence suites, **101 functional E2E tests**, **5 real Slice 09 E2E tests**, build, bundle checks, and the local performance smoke (`p95=0.916881 ms`, threshold `500 ms`, zero errors). This is local validation evidence, not hosted acceptance.

## Exact-main and live baseline checked 2026-09-14

- GitHub `main` is `eb5f18e081f091d5394201fca2613bb0299f175f`. Exact-main CI [run 34810971144](https://github.com/WeJustJammin/nevrite-music/actions/runs/34810971144) passed.
- Exact-main staging [run 34811424162](https://github.com/WeJustJammin/nevrite-music/actions/runs/34811424162) passed and deployed source `eb5f18e...` as staging deployment `6431324760`. AC265 candidate [preflight run 34811541315](https://github.com/WeJustJammin/nevrite-music/actions/runs/34811541315) then passed, registered the candidate, and published a strictly validated candidate-reference artifact.
- AC265 authorization-only [run 34811631563](https://github.com/WeJustJammin/nevrite-music/actions/runs/34811631563) failed before OIDC or staging with `ERR_MODULE_NOT_FOUND` for `@wejammin/contracts`. The local two-import TDD correction is not part of this exact-main baseline.
- The last successful production application promotion remains source `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, [run 34734646414](https://github.com/WeJustJammin/nevrite-music/actions/runs/34734646414), deployment `6417116181`. Production was not promoted by this local work.
- Exact-main, read-only AC209 observability [run 34808453690](https://github.com/WeJustJammin/nevrite-music/actions/runs/34808453690) failed at **Verify bounded Cloudflare monitoring capabilities** with `provider_graphql_error`. The token has Account Analytics Read but still needs Zone Analytics Read scoped to the Email Service zone for `emailSendingAdaptive`. The run sent no email, made no production mutation, and produced no delivery receipt.

## Acceptance boundary

No acceptance criterion was closed by this work. Slice 09 remains **279/283** (depth ratio **0.986**); **AC209, AC211, AC265, and AC266 remain open**. Slices 10–17 remain dependency-locked until Slice 09 closes. Local contract, test, and database verification do not substitute for promotion of the raw-runtime correction, successful OIDC authorization, a successful live AC209 exercise with retained evidence and a genuine receipt, or hosted AC265 identity/RLS/IdP/MFA/teardown acceptance.
