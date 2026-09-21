# AC265 hosted E2E runner status

**Status: blocked; no protected hosted acceptance runner or report producer is implemented. The local v3 schema/verifier is validation-only.**

The staging-only runner contract is now documented in the
[AC265 hosted E2E runner contract v1](./ac265-hosted-e2e-contract-v1.md). The
contract defines required inputs and evidence; it is not hosted evidence or
permission to test production. The runner must remain fail-closed until the
protected population/authentication path for the CP-02 registry, session
broker, safe staging resources, fault-evidence service, hosted specs, protected
workflow, report producer, and independent verification against protected
workflow/deployment outputs exist and pass protected verification. CP-02 now
provides only a promoted staging private registry foundation with no seeded
rows; it does not authenticate mapping provenance or establish hosted evidence.
CP-03 now adds a promoted signed runner-mapping attestation application
boundary on PR #85 at exact main SHA
`a94ffbca3d41da703218dff12ee7527f31c23a34`; exact-main CI
`35592046696` passed and staging workflow `35592722418` produced deployment
`6567092259` at `https://staging.wejamm.in`; no live signing-key
configuration, registry rows, retained mapping/attestation artifact,
attestation workflow run, hosted browser matrix, independently authenticated
receipt, or AC265 acceptance exists. The staging workflow's failed-job retry
was limited to the immediate Cloudflare provider-evidence query and made no
provider configuration change.
CP-04a is a promoted approved outage-target read/attestation
foundation. It adds a strict service-role-only read over CP-01 target rows, a
canonical target projection with the stored digest, and a distinct
domain-separated Ed25519 target attestation. The protected manual main/staging
entrypoint and workflow, plus the verifier/policy, require that signed target;
a caller-provided authenticity callback cannot substitute. Focused local
verification covers 54 files / 483 tests with `pnpm type-check` passing. Exact-
runtime `pnpm validate` exits 0 with 549 Vitest files, 4,366 passed + 1
intentional skip (4,367 total), 100% coverage, 101 functional Chromium checks,
five production-built checks, green builds/bundle checks, and local API p95
1.377056 ms. After a clean reset, all `pnpm db:verify` components are green:
57 pgTAP files / 2,087 assertions, database lint, and generated-type checks
pass. Independent security review found no CP-04a blocker; a protected
orchestrator remains a required trust boundary. PR #86 / exact-main SHA
`4fa8691d24177d0a528335f3c3d06ef50d67d3a9`, CI `35597438023`, and staging
workflow `35598236704` / deployment `6568074493` are green.
live target key/configuration, seeded target or registry rows, retained
artifact, workflow run, hosted matrix, receipt, and AC265 acceptance remain
absent.
The local v3 schema/verifier does not satisfy those hosted gates. Do not generate
`hosted/e2e.json` from policy, configuration, local fixtures, or a partial run.

## Locked evidence contract

The retained report must satisfy `ac265-hosted-e2e-v3` under
`ac265-hosted-runner-v1` and contain all nine roles and all ten hosted scenarios
exactly once, each with a passed outcome and bounded duration. Role assertions
are fixed:

The retained release gate is V3-only. `verifyContentSchemaRegistryRetainedReports`
requires `hostedV3Verification` with the exact protected `runnerContractBytes`
and trusted `verificationContext`; the report's `runnerContractSha256` and the
context's `expectedRunnerContractSha256` must bind those exact bytes. The
legacy V2 report path cannot satisfy or downgrade this gate. Every role and
scenario `durationMs` must be no greater than the report window
`completedAt - startedAt`.

| Role                    | Required assertion     |
| ----------------------- | ---------------------- |
| `entitled_read`         | `authorized_access`    |
| `owner_full`            | `authorized_access`    |
| `guardian_mandate`      | `denied_no_disclosure` |
| `junior_restricted`     | `denied_no_disclosure` |
| `business_mandate`      | `denied_no_disclosure` |
| `staff_case_scoped`     | `authorized_access`    |
| `admin_step_up`         | `authorized_access`    |
| `forbidden_hidden`      | `denied_no_disclosure` |
| `disabled_prerequisite` | `disabled_no_mutation` |

Scenarios: `idp_sign_in`, `server_authoritative_rls`,
`keyboard_landmarks_live_regions`, `three_breakpoints`, `zoom_200`,
`offline_reconnect`, `stale_multi_tab`, `auth_expiry`, `rate_limit_429`, and
`dependency_outage`. The report binds the exact protected CI and staging run
IDs/attempts, deployment, source SHA, build and build-manifest digest, deployed
artifact digest, public pathless HTTPS origins, hosting and Supabase project
identifiers, and applied migration version/digest. AC265 is staging-only; a
production run cannot satisfy this contract. The schema accepts only a
redacted, complete passed aggregate report; it is not a place to record blocked
or partial execution.

## Required v1 inputs and cross-verification

The run manifest supplies nine distinct opaque session handles in the form
`ac265-session://<role>/<uuid>` and safe resource references in the form
`ac265-resource://<kind>/<uuid>`, where `<kind>` is `content_schema`,
`staff_case`, `organization`, or `prerequisite`. Handles resolve only through
an authorized external broker; session contents never enter the repository,
logs, report, or retained artifacts. Resources must be pre-existing,
synthetic, staging-only, and safe for adult test actors. Do not create minors,
invent mandates, provision identity grants, or create acceptance resources.

The independently versioned `ac265-hosted-runner-policy-v1` pins fixed
scenario parameters only; it does not select per-role resource kinds or infer
scenario/role pairs. V3 verification requires exact
`ac265-approved-runner-mappings-v1` bytes from an independently protected
source. That strict mapping schema binds `mappingId`, approval time, run ID,
candidate identity, all role-to-resource reference arrays, and the complete
scenario-to-role mapping. The protected V3 context must authenticate those
exact bytes and keep its trusted mapping fields identical to the parsed source.
The verifier compares the contract's mapping fields exactly to the
authenticated source; safe-resource kinds follow from the referenced approved
registry entries. Preserve each required role and scenario key exactly once,
but never infer that every role participates in every scenario. Bind role
receipts to their approved session/resource reference digests and scenario
receipts to their independently approved role assignments and corresponding
reference digests.

CP-02 supplies private forced-RLS registry tables and service-role-only RPCs
for redacted opaque resource references and mappings, but no live
mapping-source endpoint, authenticity key/configuration, or protected
population path is defined. The schema, callback, and local registry are
fail-closed interface/control-plane foundations, not an authenticated approval
source or hosted acceptance evidence.

CP-03 supplies a promoted application attestation implementation for exact
`ac265-approved-runner-mappings-v1` bytes. It canonicalizes the mapping,
binds the run/mapping identity and digest, and verifies the Ed25519 signature,
trusted key window, domain separator, and report validity. Its workflow/RPC
boundary is deployed but has no live trusted key, source artifact, attestation
workflow run, protected hosted run, or hosted acceptance evidence; local
fixtures and generated test keys are not deployment configuration. Local
hardening covers UUID-v4 mapping-ID
alignment, awaited response-body cancellation, realpath/symlink-safe
execution, an unnamed Linux `O_TMPFILE` writability preflight, no-follow held
descriptors, summaries constrained beneath `RUNNER_TEMP`, and deletion-free
fail-closed handling that preserves only private runner-local remnants.
The trusted-key list, cutoff, and maximum run duration remain trusted
release-policy context preconditions for a future protected orchestration
constructor; no current untrusted caller exists.

The outage target is not invented by the policy: completing it additionally
requires exact `ac265-approved-outage-target-v1` bytes authenticated by the
separately protected CP-04a target source and its trusted Ed25519 key registry.
Its validated scope supplies the expected run, hosting and Supabase projects,
deployment, dependency, and route. Missing, placeholder, unsigned, or
unauthenticated target input leaves the gate closed. CP-04a is a promoted
read/attestation foundation; no live source key/configuration, approved row,
or retained artifact currently exists, so this target cannot yet be obtained
for hosted verification.

The protected v3 reporter and verifier must bind every session/resource
reference and every server receipt to the same immutable candidate identity.
Record each opaque reference beside its required SHA-256 digest. Recompute
digests from the exact raw reference/receipt bytes being checked; do not trust a
digest copied from the report. Cross-check the session handle's role, the
resource kind and staging project, the protected resource registry, and every
receipt's run ID, deployment, source/build/artifact, origins, project, and
migration against independently captured protected workflow/deployment
outputs. Receipt sources must prove server-derived role, RLS, scenario, and
cleanup results. The local v3 verifier requires trusted release-policy identity,
run ID, contract digest, canonical approved-mapping and attestation bytes, an
independently trusted key registry, matching trusted map fields,
`trustedCutoffAt`, positive safe-integer `maxRunDurationMs`, receipt resolver,
and receipt-authenticity callback. When execution evidence is declared, its
resolver must return the exact raw bytes; the verifier hashes those bytes
before parsing and binds payload kind, candidate identity, subject, and session
teardown to the expected reference digests. It also hashes raw receipt bytes,
checks each receipt's authenticity and exact subject/result/identity, and
rejects any digest mismatch. The report window must fit within the trusted
release-policy `maxRunDurationMs` and cutoff; every receipt's
`issuedAt` must be within that run window and cutoff. These are local
verification inputs, not values a report may self-assert.

Before `JSON.parse` or schema validation, the V3 retained report, raw runner
contract, and resolved receipt JSON must be scanned for duplicate object
members recursively. Reject duplicate names after JSON escape decoding, so
escaped-equivalent and nested duplicate keys fail before parsing rather than
being resolved by last-member-wins behavior.

For `dependency_outage`, derive `expectedOutageLeaseScope` only from the
authenticated `ApprovedOutageTarget` and its CP-04a Ed25519 attestation; do not
accept it from workflow dispatch, a caller callback, or the runner contract.
The scope must exactly match `runId`,
`hostingProjectId`, `supabaseProjectRef`, `deploymentId`, `dependencyId`, and
route `{ operationId, method, path }`. Require a signed/authenticated lease receipt,
an `ac265-lease://staging/<uuid>` reference with its exact-UTF-8 SHA-256,
bounded acquired/expiry times, exactly one matching consume event, and a
same-reference/digest release proof bound into cleanup. The lease is limited
to one request and at most 60 seconds. Cleanup uses the fixed
`current_session_only` logout policy and must prove teardown for all nine
sessions. Its authenticated receipt must be issued at or after
`cleanup.completedAt` and inside the run window/cutoff.

This lease lifecycle is mandatory, not an optional scenario extension: the v1
contract requires `scenarioParameters.dependencyOutage.outageLease`, and the
V3 report must include matching outage evidence and `leaseReceipt`, exactly one
consume event, and cleanup `outageLeaseReleaseProof`. Missing lease or proof
fails validation; there is no skip or unleased outage pass.

This remains a local trust boundary for evidence, even though the CP-03 code is
promoted. CP-01 implements the private
database lease lifecycle and its service-role-only RPCs, while CP-02 provides
the promoted private safe-resource and runner-mapping registry foundation and
CP-03 provides the promoted signed mapping-attestation boundary. CP-04a
provides the promoted signed target-read/attestation boundary. CP-02
stores only opaque references and digests, derives candidate/run/identity/
deployment/project scope from the authorized candidate, and returns redacted
mapping envelopes; CP-03 authenticates only supplied canonical bytes.
Neither CP-02, CP-03, nor CP-04a verifies live underlying resource contents or
implements a protected session
broker, signed receipt issuer, independently authenticated
approved-outage-target population, evidence-byte service, or hosted workflow
integration. CP-04a seeds no live target or registry rows. Do not claim hosted
acceptance or infer it from local pgTAP results.

The report also requires a fresh `fresh_google_oauth_through_supabase` flow,
real server-side expiry and HTTP 429 observations, a bounded one-request
`staging_one_use_lease` for one staging-only dependency, and a verified cleanup
receipt. Logout is limited to `current_session_only`. Browser-local
interception, mocked server results, or missing per-session teardown proof
cannot produce a pass. Apply the fixed policy separately to each of the nine
run-scoped handles; never revoke other sessions or disconnect an identity
provider.

## Current fail-closed runner state

`tests/e2e/support/ac265-hosted-config.ts` is a fail-closed helper for explicit
`STAGING_WEB_ORIGIN` and per-role `AC265_STORAGE_STATE_<ROLE>` paths. It validates
public, pathless HTTPS origins and state-file metadata without reading, printing,
copying, or retaining credentials. It is not a Playwright config or hosted
acceptance runner; direct state paths do not implement the v1 opaque-handle/
broker contract and cannot be treated as acceptance evidence.

No hosted AC265 Playwright spec or protected workflow implements the matrix. The
global setup continues to fail closed because no v1 session broker, protected
registry population/authentication source, hosted control/evidence service,
hosted spec, isolated protected workflow, or report producer is available. The
local v3 verifier, CP-02 registry, and CP-03 promoted attestation do not provide a
protected broker/issuer or
independent workflow/deployment verification. The workflow must use an isolated
disposable runner; a shared
persistent self-hosted runner, shared browser profile, or cross-run session
state is prohibited. Do not run a local role fixture as hosted evidence.

## Remaining implementation and acceptance gates

Before a hosted acceptance run can start, all of the following must be
implemented and independently verified:

1. A run-scoped external session broker that resolves exactly nine role-bound
   handles without exposing session contents, plus independent role and current
   admin-step-up verification.
2. A protected approval/population path for the CP-02 registry containing
   pre-existing, safe adult-only staging resources, with server-derived
   before/after state evidence for denied and disabled cases. The registry's
   opaque references and locator digests do not establish resource safety by
   themselves. CP-03's attestation authenticates mapping bytes only; it does
   not replace live key provisioning, source-artifact retention, or
   authenticated resource validation.
3. A staging fault-evidence service for genuine provider expiry and server
   429 evidence, plus the bounded one-use dependency-outage lease and cleanup
   receipt. The Google flow must traverse the real Google IdP and Supabase Auth.
4. Hosted specs and a protected, isolated, disposable runner workflow that
   binds the exact candidate, redacts output, runs every role/scenario once,
   logs out each of the nine run sessions with `current_session_only`, and tears
   down all run-scoped state with a cleanup receipt issued after completion.
   Shared persistent self-hosted runners and cross-run session/profile reuse
   are not allowed.
5. The strict `ac265-hosted-e2e-v3` schema and local verifier are implemented.
   A protected hosted report producer and independent verification binding raw
   evidence/receipt bytes, subjects, resources, lease lifecycle, time bounds,
   and candidate identity to protected workflow/deployment outputs are still
   required. They must reject any missing, extra, duplicated, mismatched,
   unverified, or sensitive input.

Until every gate passes on the exact staging candidate and the existing
release-evidence verifier accepts the retained v3 report, the global setup
must keep failing and no report, role pass, scenario pass, or AC265 closure may
be claimed.
