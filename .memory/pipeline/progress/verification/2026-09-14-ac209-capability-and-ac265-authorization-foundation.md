# AC209 capability correction and AC265 authorization foundation — 2026-09-14

## Scope

This record covers the AC209 verifier correction and AC265 candidate-enrollment / runner-authorization foundation merged by [PR #76](https://github.com/WeJustJammin/nevrite-music/pull/76) as `bc808277a74cf12e75c47eb62d8220b0d601430a`, plus the follow-on candidate-reference artifact bridge that remains locally validated and pending promotion. It distinguishes exact-main CI/staging evidence from hosted acceptance.

## AC209 local capability verifier

Commit `c9d9049a3b27c8e524a4835ea49b310c041d15f7` adds a read-only capability probe against the configured Cloudflare zone's `emailSendingAdaptive` dataset. It uses a bounded one-hour UTC window, requests at most one newest row, and selects only `status`. An empty result is accepted as proof that this dataset query is readable; it is not a delivery receipt. Malformed, unavailable, denied, truncated, or unexpected responses fail with fixed diagnostic codes and do not expose provider response details or the token.

The focused AC209 verifier suite passes **13 files / 250 tests**. The correction is now exact-main, but the protected live verifier below fails before any effect because the token lacks Zone Analytics Read for the Email Service dataset. It has not established provider access or an AC209 delivery result.

## AC265 candidate and authorization foundation

The local implementation adds a fail-closed candidate provenance verifier and strict enrollment contract. The candidate identity binds successful GitHub CI and staging run IDs and attempts, fixed workflow identities, source SHA, staging environment and deployment ID, plus the expected artifact fields, digests, and origins. Dispatch inputs and artifact JSON are treated as untrusted; the enrollment boundary recomputes and validates the identity digest.

The enrollment RPC and migration create an immutable, private verified-candidate registry. The database checks the canonical identity digest and provenance tuple. The OIDC preparation contract pins the GitHub issuer, audience, repository IDs, protected `main` ref, staging environment, workflow path, workflow/source SHA, and run/attempt. The authorization records are short-lived (at most five minutes), store token/JTI digests rather than the token, and reject replay/conflicting requests. The tables are private with RLS forced and client access revoked.

The manual `run-ac265-hosted-e2e.yml` workflow is main-only, staging-scoped, and grants `id-token: write` only to its authorization job. Its report is explicitly labeled “Authorization foundation only. Hosted browser acceptance was not run.” Preflight run `34807981562` registered the exact candidate in staging, but GitHub does not expose the completed job's `candidate_ref`; the ref-only, one-day artifact bridge remains local pending promotion. The authorization-only and hosted browser workflows have not run.

## Local verification evidence

- Integrated AC265 focused suite: **39 files / 323 tests passed**.
- `pnpm db:verify`: **52 pgTAP files / 1,917 tests passed**. Local database reset, lint, and type-check also pass.
- Latest `pnpm validate`: **passed (exit 0)**. The run completed **535 Vitest files / 4,221 passing tests plus one intentional skip** with **100% statements, branches, functions, and lines**. It also passed the Slice 09 evidence suites, **101 functional E2E tests**, **5 real Slice 09 E2E tests**, build, bundle checks, and the local performance smoke (`p95=0.844937 ms`, threshold `500 ms`, zero errors). This is local validation evidence, not hosted acceptance.

## Exact-main and live baseline checked 2026-09-14

- GitHub `main` is `bc808277a74cf12e75c47eb62d8220b0d601430a`. Exact-main CI [run 34807453440](https://github.com/WeJustJammin/nevrite-music/actions/runs/34807453440) passed.
- Exact-main staging [run 34807866392](https://github.com/WeJustJammin/nevrite-music/actions/runs/34807866392) passed and deployed source `bc808277...` as staging deployment `6430733556`. AC265 candidate [preflight run 34807981562](https://github.com/WeJustJammin/nevrite-music/actions/runs/34807981562) then passed and registered the candidate, but the completed run did not retain a retrievable candidate reference.
- The last successful production application promotion remains source `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, [run 34734646414](https://github.com/WeJustJammin/nevrite-music/actions/runs/34734646414), deployment `6417116181`. Production was not promoted by this local work.
- Exact-main, read-only AC209 observability [run 34808453690](https://github.com/WeJustJammin/nevrite-music/actions/runs/34808453690) failed at **Verify bounded Cloudflare monitoring capabilities** with `provider_graphql_error`. The token has Account Analytics Read but still needs Zone Analytics Read scoped to the Email Service zone for `emailSendingAdaptive`. The run sent no email, made no production mutation, and produced no delivery receipt.

## Acceptance boundary

No acceptance criterion was closed by this work. Slice 09 remains **279/283** (depth ratio **0.986**); **AC209, AC211, AC265, and AC266 remain open**. Slices 10–17 remain dependency-locked until Slice 09 closes. Local contract, test, and database verification do not substitute for promotion of the artifact bridge, a successful live AC209 exercise with retained evidence and a genuine receipt, or hosted AC265 identity/RLS/IdP/MFA/teardown acceptance.
