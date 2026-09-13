# AC265 hosted E2E runner status

**Status: blocked; no protected hosted acceptance runner or report producer is implemented. The local v3 schema/verifier is validation-only.**

The staging-only runner contract is now documented in the
[AC265 hosted E2E runner contract v1](./ac265-hosted-e2e-contract-v1.md). The
contract defines required inputs and evidence; it is not hosted evidence or
permission to test production. The runner must remain fail-closed until the
session broker, safe staging resources, fault-evidence service, hosted specs,
protected workflow, report producer, and independent verification against
protected workflow/deployment outputs exist and pass protected verification.
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

The expected mappings are separate trusted inputs:
`expectedRoleResourceBindings` and `expectedScenarioRoleBindings`. Compare them
exactly with the contract's `roleResourceBindings` and `scenarioRoleBindings`;
do not accept mappings selected by the contract or report itself. Preserve all
nine role keys and ten scenario keys. Bind role receipts to their approved
session/resource reference digests and scenario receipts to the independently
approved role assignments and corresponding reference digests.

The protected v3 reporter and verifier must bind every session/resource
reference and every server receipt to the same immutable candidate identity.
Record each opaque reference beside its required SHA-256 digest. Recompute
digests from the exact raw reference/receipt bytes being checked; do not trust a
digest copied from the report. Cross-check the session handle's role, the
resource kind and staging project, the protected resource registry, and every
receipt's run ID, deployment, source/build/artifact, origins, project, and
migration against independently captured protected workflow/deployment
outputs. Receipt sources must prove server-derived role, RLS, scenario, and
cleanup results. The local v3 verifier requires caller-supplied trusted
identity, run ID, contract digest, independent mappings, `trustedCutoffAt`,
positive safe-integer `maxRunDurationMs`, receipt resolver, and
receipt-authenticity callback. When execution evidence is declared, its
resolver must return the exact raw bytes; the verifier hashes those bytes
before parsing and binds payload kind, candidate identity, subject, and session
teardown to the expected reference digests. It also hashes raw receipt bytes,
checks each receipt's authenticity and exact subject/result/identity, and
rejects any digest mismatch. The report window must fit within
caller-supplied `maxRunDurationMs` and the trusted cutoff; every receipt's
`issuedAt` must be within that run window and cutoff. These are local
verification inputs, not values a report may self-assert.

Before `JSON.parse` or schema validation, the V3 retained report, raw runner
contract, and resolved receipt JSON must be scanned for duplicate object
members recursively. Reject duplicate names after JSON escape decoding, so
escaped-equivalent and nested duplicate keys fail before parsing rather than
being resolved by last-member-wins behavior.

For `dependency_outage`, the independently expected
`expectedOutageLeaseScope` must exactly match `runId`, `hostingProjectId`,
`supabaseProjectRef`, `deploymentId`, `dependencyId`, and route
`{ operationId, method, path }`. Require a signed/authenticated lease receipt,
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

This is a local trust boundary only; it does not implement a protected broker,
issuer, lease service, or evidence-byte service, or independently bind supplied
trusted values to actual hosted workflow/deployment outputs.

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
global setup continues to fail closed because no v1 session broker, approved
safe-resource registry, hosted control/evidence service, hosted spec, isolated
protected workflow, or report producer is available. The local v3 verifier does
not provide a protected broker/issuer or independent workflow/deployment
verification. The workflow must use an isolated disposable runner; a shared
persistent self-hosted runner, shared browser profile, or cross-run session
state is prohibited. Do not run a local role fixture as hosted evidence.

## Remaining implementation and acceptance gates

Before a hosted acceptance run can start, all of the following must be
implemented and independently verified:

1. A run-scoped external session broker that resolves exactly nine role-bound
   handles without exposing session contents, plus independent role and current
   admin-step-up verification.
2. A registry of pre-existing, safe adult-only staging resources, with
   server-derived before/after state evidence for denied and disabled cases.
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
