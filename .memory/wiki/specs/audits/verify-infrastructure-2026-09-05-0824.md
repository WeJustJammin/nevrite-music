# Infrastructure Verification Report: Slice 09 hosted auth recovery

**Verification window**: 2026-09-05 08:10-08:24 -04:00  
**Trigger**: `infrastructure` — owner-approved `/implement-slice 9-17` continuation  
**Verdict**: **FAIL — exact-main CI, staging, production, and the hosted auth-provider transport are healthy, but four external acceptance gates keep Slice 09 at 279/283; Slices 10–17 remain dependency-locked**

## Results

| #   | Check                         | Status                           | Current evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Placeholder/map audit         | PASS                             | Required project paths remain resolved. Existing untracked coverage and context-mode directories were preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1   | CI/CD config                  | PASS                             | PR #20 merged the active-request-context Worker fetch correction. Repeated exact-main timeout-only failures in the repository-wide AST and two-build SSR contract checks were corrected without changing assertions by PR #21. `main` and the protected production reviewer remain business-account-only under `WeJustJammin`.                                                                                                                                                                                                                                      |
| 2   | CI/CD green                   | PASS                             | Exact main SHA `b22a914327291e2895bbcc7dc8f60837c8faa0d6` passed CI run `33965293079`; database, quality, and immutable-build jobs all succeeded. Workspace artifact `9969324579` has digest `sha256:db3b63838256007b42af30c22fa91cad4025503d76b9daf681c22ce933a88094`; test evidence `9969307786` has digest `sha256:cb94e33161ffc7508ba41c30e84060f1f290c0c98be411e0212b5163c807cf3e`.                                                                                                                                                                            |
| 3   | Environment/secrets audit     | PASS WITH PROVIDER BOUNDARY      | Staging and production deployments consumed their environment-owned Supabase secrets successfully; direct Worker-style RPC diagnostics and both deployments passed without exposing secret values. Supabase staging and production Google forms remain disabled with blank Client ID and Client Secret fields.                                                                                                                                                                                                                                                      |
| 4   | Migrations/rollback readiness | PASS WITH BOUNDARY               | Staging and protected production applied and verified forward-only migrations through `20260905080000_content_schema_registry_operational_alerts`. No destructive rollback was attempted. Supabase Free still lacks PITR, so the locked recovery boundary remains.                                                                                                                                                                                                                                                                                                  |
| 5   | Staging deployment/health     | PASS                             | Staging run `33965655238` and deployment `6280862362` succeeded for exact SHA `b22a914...`. Candidate artifact `9969340186` has digest `sha256:a0256d4002d70bdc1345bb51510d0d26567e45ad196dfd990e60a55a4b033f25`; deployment evidence `9969340453` has digest `sha256:eb4e4f3541fa2229e6aef2099ceeeaf315c1df3a28d78e89b059d9a21150dbd7`. Both the pathless staging web origin and direct staging API return HTTP `200` from `/api/v1/auth/providers`.                                                                                                               |
| 6   | Auth smoke                    | BLOCKED AFTER TRANSPORT RECOVERY | Production run `33965764707` and deployment `6280885024` succeeded after exact-SHA protected approval. Five sequential production requests to `/api/v1/auth/providers` returned HTTP `200`; Cloudflare recorded all five at info level with 21 successes and 0 errors in the 15-minute window. The valid catalog reports Google, Apple, Facebook, and SoundCloud as `temporarily_unavailable`. Google remains disabled in both Supabase projects; no business-owned Google OAuth client or authorized hosted test identities are configured, so AC265 remains open. |
| 7   | Logging/alerting              | BLOCKED                          | The scheduled operational provider remains deployed and previously produced consecutive successful cron evaluations, but no genuine redacted `platform.on_call` delivery receipt exists. AC209 remains open.                                                                                                                                                                                                                                                                                                                                                        |
| 8   | Production telemetry          | BLOCKED                          | The production artifact is live and healthy, but the locked complete UTC-day dataset with at least 200 command/RPC/acceptance samples and daily Queue/DLQ counts has not elapsed and been retained. AC211 remains open.                                                                                                                                                                                                                                                                                                                                             |
| 9   | Manual accessibility          | BLOCKED                          | Automated axe/browser coverage passes, but the locked VoiceOver/Safari/macOS and NVDA/Firefox/Windows manual runs do not exist. AC266 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 10  | Spec-pipeline integrity       | PASS WITH BLOCKER                | Phase 2 remains 8/17. Slice 09 remains 279/283 with depth ratio `0.986`; Slice 10 explicitly depends on Slice 09 and may not start.                                                                                                                                                                                                                                                                                                                                                                                                                                 |

The current local gate passes 423 Vitest files / 3,148 tests at 100% coverage,
102 Playwright checks, every build/contract/format/lint/type/performance check,
and database verification with 34 migrations and 45 pgTAP files / 1,678 tests
plus generated-type parity.

Production evidence artifact `9969392638` retained the successful exact-SHA
attempt with digest
`sha256:7d538f3b911de6aedc4d6edf3be12840fc7b93b641055294f2b648d2781a333e`.
The earlier run `33965746220` safely skipped because
`confirm_production=false`; it performed no preflight or deployment work.

## Evidence Boundary

PR #20 demonstrated the stale fetch failure with a regression before changing
the default fetch seam to resolve `globalThis.fetch` inside each active Worker
request. PR #21 retained every repository-wide assertion while giving the AST
scan and two-build SSR contract sufficient shared-runner headroom. Exact-main
CI `33965293079`, staging `33965655238`, and protected production
`33965764707` all passed for `b22a914...`.

The external browser is signed into GitHub/Supabase as `WeJustJammin` and
Cloudflare/Google as `admin.wejammin@gmail.com`. The Google Cloud console cannot
reach project credentials until the account accepts Google Cloud Platform Terms
of Service. That legal acceptance was not performed. No OAuth client was
created, no provider was enabled, and no test identity was provisioned.

## Open Acceptance Criteria

| Criterion       | Verified now                                                                                                                                     | Evidence still required                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P2-S09-AC-209` | Exact-SHA provider deployment and successful scheduled evaluation.                                                                               | Genuine post-configuration redacted live-delivery receipt.                                                                                                                                                                          |
| `P2-S09-AC-211` | Exact-SHA production deployment and healthy provider/catalog requests.                                                                           | One complete production UTC day, at least 200 command/RPC/acceptance samples, all five SLO results, and daily Queue/DLQ counts.                                                                                                     |
| `P2-S09-AC-265` | Hosted migrations, pathless staging/production origins, HTTP `200` provider catalog, protected routes, and unauthenticated concealment boundary. | Owner acceptance of the Google Cloud terms, a business-owned OAuth client, enabled Supabase Google configuration, authorized non-production identities, and the complete hosted Auth/RLS/RPC/Worker/web role and resilience matrix. |
| `P2-S09-AC-266` | Automated accessibility and browser gates pass.                                                                                                  | Signed VoiceOver/Safari and NVDA/Firefox manual smoke against the same candidate.                                                                                                                                                   |

## Required Handoff

1. The owner must review and accept the Google Cloud Platform Terms of Service
   in the open `admin.wejammin@gmail.com` browser tab before OAuth client setup
   can proceed.
2. Configure a business-owned Google OAuth client with the Supabase staging
   callback first, provision purpose-built non-production identities, execute
   the hosted AC265 matrix, then repeat the locked production configuration
   only after staging evidence passes.
3. Retain independent AC209, AC211, and AC266 evidence. Do not start Slice 10
   until all four open criteria pass.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]
