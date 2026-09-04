# Infrastructure Verification Report: Post-deploy candidate `5d6e49f34b678c59da2ac4f7059f08e6dc3b4790`

**Verification window**: 2026-09-04 17:03 -04:00  
**Trigger**: `infrastructure` — Phase 2 Slice 09 post-deploy verification  
**Verdict**: **FAIL — staging deployment is verified for the exact main SHA, but external acceptance remains BLOCKED; Slice 09 remains 279/283**

## Results

| #   | Check                     | Status                    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | Placeholder/map audit     | PASS                      | `AGENTS.md` plus the `.agents`, `.claude`, `.codex`, and `.pi` command and technology maps contain zero unresolved bootstrap markers or empty command rows. `pnpm progress:check` and the spec-graph compiler pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1   | CI/CD config              | PASS                      | Main protection and the staging custom branch policy are configured. The required CI checks are `Format, lint, type, and test`, `Database migrations, lint, and pgTAP`, and `Build immutable workspace artifacts`. All GitHub activity for this verification — actor, merger, and deployer — is `WeJustJammin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2   | CI/CD green               | PASS                      | Exact main SHA `5d6e49f34b678c59da2ac4f7059f08e6dc3b4790` passed CI run `33917604565`; all three jobs reached terminal success. The immutable workspace artifact is `9953929511`, digest `sha256:2a89077d739b3195a55777dcb441ae08451106860cf0e8b11950a265b26af3fe`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3   | Environment audit         | PASS WITH BOUNDARY        | Supabase staging is `ACTIVE_HEALTHY`, project ref `ytmgizarejtjtfplkwoi`, with 33 migrations and latest migration `20260902080000`. No secret value was read or emitted. Production runtime credentials are absent, and no production deployment is claimed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 4   | Migration check           | PASS                      | Staging run `33918141133`, job `101169994068`, completed successfully through migration, deployment, public-contract, performance, and evidence steps. Independent migration, performance, and candidate verifiers pass. The staging sidecar records `expanded` state, `forwardFixOnly: true`, and no destructive rollback path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 5   | Staging deployment/health | PASS WITH READINESS NOTE  | Deployment `6272586576` and status `17842104340` are successful for exact source SHA `5d6e49f34b678c59da2ac4f7059f08e6dc3b4790`. Candidate artifact `9953965534` has digest `sha256:3d6ed3ab69bb93ee5d1de62dbd56620a9abd2e5bacabe64a2dce3347caa21e05`; deployment evidence artifact `9953965990` has digest `sha256:2566be89247b3475c710abd5992882781d3bc8c3ea402ab72d5d954a9b96971b`. API version `0f6ef117-c377-4229-ab0b-72c815346414` and web version `e3b79e94-99d2-4447-ac22-be3c5e485bb1` are deployed. Fresh probes: web root `200`; protected infrastructure and CMS routes `303` to sign-in; API health `200`/`ok`; CMS API `401`; p95 `42.649115ms` over `20/20` requests with zero errors and exact source-SHA evidence. `/api/v1/ready` is `503`/`not_ready` because no readiness checker is intentionally configured; this is not reported as a green readiness claim. |
| 6   | Auth smoke test           | BLOCKED                   | Google is disabled. The provider catalog DB RPC works only under `service_role`, while the Worker provider boundary returns `503 DEPENDENCY_UNAVAILABLE`; unauthenticated session returns `401`. No authorized test identities or complete hosted Auth → RLS/RPC → Worker/web matrix exists. AC265 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 6.5 | Logging gate              | LOCAL PASS / LIVE BLOCKED | Local logging, alert, and telemetry semantics remain passing. No approved production-native scheduled alert exercise, threshold result, or redacted real `platform.on_call` delivery receipt exists. AC209 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 6.6 | Error tracking gate       | PARTIAL                   | The provider-free native-observability boundary remains policy-conformant locally. The staging deployment and public health/performance evidence do not substitute for production failure capture, telemetry, or DLQ evidence. AC211 remains open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7   | Spec-pipeline integrity   | PASS WITH WARNINGS        | All 228 manifest entries pass. Phase 1 is 7/7, Phase 2 is 8/17, Slice 09 is 279/283 with depth ratio `0.986`, and Slice 10 remains dependency-locked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Evidence Boundary

This report records the successful exact-main CI and staging deployment for
`5d6e49f34b678c59da2ac4f7059f08e6dc3b4790`. CI run `33917604565` and staging
run `33918141133` completed successfully under the `WeJustJammin` actor, merger,
and deployer identity. The migration sidecar and immutable candidate and
deployment-evidence artifacts are recorded above. Fresh public probes were
read-only; no secret value was retrieved or emitted. No production deployment,
production telemetry window, provider receipt, hosted test identity, or manual
accessibility session is claimed. The intentional `/api/v1/ready` 503 means no
readiness checker is configured; it is not evidence of production readiness.

## Failures

1. **External release evidence remains incomplete.** AC-209, AC-211, AC-265,
   and AC-266 still require live alert delivery, production telemetry/DLQ
   evidence, deployed Auth/RLS/IdP browser E2E, and supported-platform manual
   accessibility evidence respectively.
2. **Hosted Auth smoke cannot complete.** Google remains disabled and the
   Worker provider boundary returns `503 DEPENDENCY_UNAVAILABLE`; a
   `service_role` provider-catalog RPC result does not establish the user-facing
   Auth/RLS/Worker/web matrix.
3. **Production remains intentionally unverified.** Production runtime
   credentials are absent, and no production deployment or
   production-readiness claim is made.

## Open Acceptance Criteria

| Criterion       | Verified now                                                                                                               | Evidence still required                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P2-S09-AC-209` | Local alert semantics, scrubbed fields, evaluator, and sink boundaries pass.                                               | Approved provider-native scheduled query, threshold exercise, and redacted real `platform.on_call` delivery receipt.                                |
| `P2-S09-AC-211` | Deterministic performance and telemetry fixtures pass; staging p95 is `42.649115ms` over `20/20` with zero errors.         | One complete production UTC window with revision, sample counts/checksum, required percentiles, errors, and daily production DLQ query.             |
| `P2-S09-AC-265` | Local signed-session, role, concealment, and recovery fixtures pass; protected staging routes return the sign-in boundary. | Same artifact plus configured Google IdP, authorized non-production identities, hosted migrations, and complete Auth → RLS/RPC → Worker/web matrix. |
| `P2-S09-AC-266` | Automated semantics, keyboard, focus, live-region, responsive, target-size, non-color, zoom, and axe gates pass.           | Signed VoiceOver/Safari and NVDA/Firefox manual smoke against the same candidate on supported operating systems.                                    |

## Next Steps

1. Obtain the owner-controlled provider-native alert query, threshold exercise,
   and redacted `platform.on_call` receipt for AC-209.
2. Capture the required production telemetry window and daily DLQ query for
   AC-211, bound to the exact candidate revision.
3. Configure the accepted hosted Auth provider and authorized non-production
   identities, then run the complete Auth → RLS/RPC → Worker/web matrix for
   AC-265.
4. Run and sign the required VoiceOver/Safari and NVDA/Firefox manual smoke for
   AC-266.
5. Re-run infrastructure and phase verification after those independent
   receipts exist. Keep Slice 09 at 279/283 and Phase 2 at 8/17 until then;
   do not promote production.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]
