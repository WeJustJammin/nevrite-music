# Content schema registry release evidence

Use this runbook to assemble and verify the release sidecar for
`P2-S09-AC-209`, `P2-S09-AC-211`, `P2-S09-AC-265`, and `P2-S09-AC-266`.
Passing local tests does not satisfy these gates.

## Immutable identity

Start from one successful immutable build. Record its full lowercase 40-character
source SHA, artifact SHA-256 digest, build ID, and migration version. Every
component report in the sidecar must name that same source SHA, and the hosted
E2E migration version must equal the artifact migration version. AC265 follows
the staging-only identity and evidence contract in the
[AC265 hosted E2E runner contract v1](./ac265-hosted-e2e-contract-v1.md); a
production-origin E2E run cannot satisfy AC265.

The protected workflow must independently create an expected-release-identity
JSON containing the trusted source SHA, artifact digest, build ID, migration
version, production deployment ID/`productionDeployedAt`, hosted
environment/deployment ID/`hostedDeployedAt`, exact web/API/Supabase origins,
and trusted evidence cutoff `trustedCutoffAt`. For AC265, it must additionally
pin the protected CI run ID/attempt, staging run ID/attempt, exact staging
deployment, build-manifest digest, deployed artifact digest, public pathless
web/API origins, hosting account and project, Supabase project reference, and
applied migration version and digest. Populate these values, deployment times,
and the cutoff from immutable deployment outputs/protected workflow state,
never by copying values from the sidecar being checked. The cutoff is captured
after the sidecar and reports are assembled, immediately before verification.

The protected workflow must retain the combined sidecar and its referenced,
redacted component reports as workflow artifacts. AC266 raw manual reports are
the exception: they are private workflow inputs only, and the intake and
verification workflows retain sanitized manifests rather than the source JSON.
Do not commit generated evidence, browser storage state, provider exports, raw
manual reports, or manual-test recordings to the repository.

## Required reports

| Criterion | Required non-local evidence                                                                                                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC209     | Production-native alert configuration containing every locked condition plus one redacted delivered `platform.on_call` receipt captured after that configuration.                                                                                        |
| AC211     | Production query/report and dataset, at least 200 command/RPC/acceptance samples, retained queue/DLQ counts, one complete UTC day, and all five observed values below their strict thresholds.                                                           |
| AC265     | Staging-only `ac265-hosted-e2e-v3` report: all nine locked roles and ten scenarios, fresh Google through Supabase Auth, exact immutable candidate identity, opaque external session/resource references, server-derived receipts, and verified teardown. |
| AC266     | Automated axe report with zero Serious/Critical findings and complete manual VoiceOver/Safari/macOS plus NVDA/Firefox/Windows runs against the exact hosted deployment, origin, and SHA.                                                                 |

The automated axe target `/app/cms-content-modeling` is an unauthenticated
auth-boundary check only: it must finish at `/auth/sign-in` with HTTP 200. It
does not claim authenticated CMS page coverage; authenticated coverage belongs
to the AC265 hosted matrix and the manual accessibility runs.

## AC265 contract and current gate

The required runner input and evidence shape is defined by
[`ac265-hosted-runner-v1`](./ac265-hosted-e2e-contract-v1.md). Its accepted
aggregate report version is `ac265-hosted-e2e-v3`; an `ac265-hosted-e2e-v2`
report is legacy and cannot satisfy this gate. The report must bind the exact
CI/staging runs and attempts, deployment, source, build and build manifest,
artifact, public web/API origins, hosting and Supabase projects, and applied
migration. Every role, scenario, reference, and server receipt must bind to
that same identity.

The retained release gate is V3-only and fails closed without
`hostedV3Verification`, including the exact protected `runnerContractBytes` and
trusted `verificationContext`. The report's `runnerContractSha256` and trusted
`expectedRunnerContractSha256` must bind those exact bytes. Do not route this
gate through the legacy V2 compatibility validator: V2 cannot satisfy or
downgrade the retained release requirement.

The manifest carries exactly nine opaque
`ac265-session://<role>/<uuid>` handles and pre-existing safe staging resources
identified as `ac265-resource://<kind>/<uuid>`, with `kind` limited to
`content_schema`, `staff_case`, `organization`, or `prerequisite`. Session
contents never enter repository files, logs, reports, or retained artifacts.
Denied cases use eligible adults and do not create minors or invent mandates.
The real `fresh_google_oauth_through_supabase` flow, natural provider expiry,
server-generated HTTP 429, one-use staging-only `staging_one_use_lease`,
server-derived role/RLS/UI/scenario receipts, fixed `current_session_only`
logout, and a cleanup receipt are required. Any missing assertion or cleanup
failure blocks report publication.

`dependency_outage` and its lease proof are mandatory. The runner contract
must declare `scenarioParameters.dependencyOutage.outageLease`; the V3 report
must include the matching outage evidence, authenticated `leaseReceipt`, exactly
one consume event, and cleanup `outageLeaseReleaseProof`. The one-request lease
must be staging-only and at most 60 seconds. There is no skipped, omitted, or
unleased outage path that can pass the retained gate.

Role/resource and scenario/role mappings are independently trusted inputs, not
values the runner contract or report may authorize. Supply
`expectedRoleResourceBindings` and `expectedScenarioRoleBindings` from the
approved versioned policy, compare them exactly with the contract's mapping
fields, and bind role/scenario receipts to the approved session and resource
reference digests. Keep all nine role and ten scenario keys exact.

The protected workflow must resolve each opaque reference and receipt to its
exact raw bytes, recompute SHA-256 before parsing, and cross-verify the
session-to-role binding, resource kind/project/safety, and every receipt's
subject and complete candidate identity against independently captured
protected deployment outputs. Receipt signatures/authenticity must be checked
over those same bytes; a digest alone is not authentication. Execution evidence
bytes must likewise be resolved, hashed, and bound to the expected evidence
kind, identity, subject, and (for teardown) session-reference digest. The local
v3 verifier uses caller-supplied trusted identity, run ID, contract digest,
independent mappings, `resolveReceipt`, and `verifyReceiptAuthenticity`; when
execution evidence is declared, its resolver must provide the raw bytes.

The retained V3 report, runner-contract JSON, and resolved receipt JSON must
reject duplicate object members before `JSON.parse` or schema validation.
Duplicate detection is recursive and compares decoded member names, so nested
duplicates and escaped-equivalent keys fail closed. For each role and scenario,
`durationMs` must fit inside the report window:
`durationMs <= completedAt - startedAt`.

The trusted verification context also supplies a positive safe-integer
`maxRunDurationMs`, `trustedCutoffAt`, and
`expectedOutageLeaseScope`. The outage scope is exactly `runId`,
`hostingProjectId`, `supabaseProjectRef`, `deploymentId`, `dependencyId`, and
route `{ operationId, method, path }`. The signed/authenticated lease receipt
must bind that scope to the staging-only `ac265-lease://staging/<uuid>` ref and
its exact-UTF-8 SHA-256, bounded acquire/expiry timestamps, one matching
consume event, one-request limit, and replay rejection. Cleanup release proof
must use the same lease ref/digest and be covered by the authenticated cleanup
result. Report duration must fit the trusted `maxRunDurationMs`; every receipt
`issuedAt` must be inside the report window and at or before the trusted
cutoff. All nine sessions require teardown proof using only
`current_session_only`; the authenticated cleanup receipt must be issued at or
after `cleanup.completedAt` and within that run window/cutoff.

These are local trust-boundary checks only. The verifier does not implement a
protected issuer, session broker, evidence-byte service, outage-lease service,
or independent binding to actual protected workflow/deployment outputs. The
v1 session broker, safe-resource registry, fault-evidence service, isolated
hosted workflow, and report producer remain unimplemented. The runner must be
isolated and disposable; shared persistent self-hosted runners and cross-run
browser/session state are prohibited. Keep this criterion blocked: this
contract and local checks do not prove hosted acceptance.

The protected staging deployment runs `infra/workflows/collect-staging-axe-evidence.sh`
after public contract verification. It paginates GitHub deployment/status metadata,
binds the record to the current protected run's SHA, staging environment, ref,
task, creator, timestamps, and current `in_progress` status, then writes
`promotion-candidate/accessibility/axe.json` plus its independently generated
`axe.sha256` sidecar. The report verifier receives the independent sidecar
digest before the candidate and deployment evidence artifacts are uploaded, together with the
run-owned deployment creation time and a protected collection cutoff. GitHub keeps
the deployment status `in_progress` while this collection step runs; it may mark
the deployment `success` only after the job completes. This proves only the
automated Chromium/axe portion and GitHub run binding. Its precondition is the
preceding `verify-staging` gate: the served Cloudflare web response must expose
`x-wejammin-release` equal to the promoted SHA (the API response is checked too).
The GitHub deployment ID and Cloudflare Worker version ID are distinct provider
identities and must be recorded separately; neither substitutes for the served
release header or the other ID. The collector does not create or replace either
required manual screen-reader report.

After both staging Workers deploy, the protected workflow runs
`collect-provider-release-evidence.sh`. It queries Wrangler's JSON versions and
deployments listings for `wejammin-api-staging` and `wejammin-web-staging` and
retains only `promotion-candidate/provider-release-evidence.json`. The report
requires the newest deployment for each Worker to route exactly one version at
100%, that version to exist in the retained versions response, and its exact
`workers/tag`/`workers/message` annotations to bind `DEPLOY_SHA` and
`GITHUB_RUN_ID`. It contains version/deployment IDs, bounded timestamps, and
redacted annotations only; Wrangler payloads and credentials are never retained.

## Collect AC209 configuration evidence

After an exact `main` revision has passed CI, staging, and production promotion,
dispatch `collect-production-ac209.yml` from `main` with its full lowercase
`source_revision`, exact Cloudflare `production_version_id`, expected production
DLQ ID, approved configuration ID and reference, and
`confirm_collection: true`. The protected collector resolves the Cloudflare
deployment from one documented REST snapshot and obtains the exact retained
version's release attestation through the repository-pinned Wrangler CLI. It
fails closed unless the requested version appears in exactly one deployment,
that deployment is the current first deployment and routes only that version at
100%, and the version's `workers/tag` and `workers/message` bind the requested
source revision to a nonzero GitHub run ID. Mutable worker-settings annotations
are not accepted as version evidence. A GitHub deployment ID must not be
supplied as a Cloudflare deployment identity.

The retained configuration artifact is redacted configuration proof only. It
does not replace the required production-native alert exercise, Cloudflare email
delivery event, mailbox receipt, or exact-message DLQ cleanup evidence.

## Exercise AC209 delivery

Provision `CLOUDFLARE_QUEUE_EXERCISE_TOKEN` in the protected production
environment with account-scoped Workers Queues Write only. Do not reuse the
deployment token or a local Wrangler OAuth credential. Pin the provider-verified
Email Sending zone as `CLOUDFLARE_EMAIL_ZONE_ID`, the fixed sender digest as
`PRODUCTION_ALERT_SENDER_SHA256`, and the production source queue as
`CLOUDFLARE_PLATFORM_QUEUE_ID`. The existing observability token supplies
Account Analytics Read for Queue Analytics and Zone Analytics Read for the Email
Sending query. Its Zone Resources must include the exact Email Sending zone.

After the verification RPC migration and exercise workflow are deployed,
dispatch `exercise-production-ac209.yml` from `main`. Supply the exact deployed
source revision and Worker version, production DLQ ID, approved configuration ID
and reference, and set `confirm_exercise: true`. The protected job recollects
the exact-version configuration before any mutation. It then requires an
eligible alert cooldown and queries the exact zone's Email Sending Settings
node. The capability preflight requires `emailSendingAdaptive.enabled = true`
and every field selected by the event query to appear in `availableFields` for
the observability token. Its requester-specific `maxPageSize` must support the
50-row bound and `maxNumberOfFields` must support all seven selections. Only
after both preflights pass does the step record
`cleanup_required=true`, enter the queue boundary, require empty exact
source/DLQ peeks, push one UUID-marked malformed envelope, observe retry
exhaustion in the DLQ, and keep that exact message present while it correlates
one delivered Email Sending event. The
retained `dlq.attempts` value is the DLQ-local consumer counter and can be zero
before any DLQ consumer delivery. Retry exhaustion is proved by the verified
source consumer retry limit and DLQ binding, empty exact preflight, source-only
publish, and exact marker arrival in the bound DLQ; the DLQ-local counter is not
used as the source retry count. The
service-only database verifier hashes the provider-owned message identifier
internally and requires one delivered `dlq_nonempty` row for the exact release.
The Email Sending request follows Cloudflare's documented individual-event
query shape and bounds the provider result by zone, exercise timestamps, and a
50-row limit. The collector then accepts only `status = delivered` and
`isLastEvent = 1` locally, and fails closed if the page reaches the limit so an
unobserved matching event can never be inferred from a truncated result.
The identifier is an opaque, visible-ASCII provider value of at most 512 bytes;
it is not a caller-authored RFC `Message-ID`. The verifier sends
`notBefore = exercise.startedAt` and accepts only a row whose claim and delivery
both occurred at or after that boundary. The internal UUID receipt remains
separately hashed and private. Provider response bodies are capped while they
stream, time out deterministically, and fail closed on invalid UTF-8.

Migration `20260910030000_ac209_operational_alert_verification.sql` is the
expand phase: it accepts the deployed five-field completion body while adding
the optional provider identifier. Deploy the Worker that supplies
`providerMessageId`, verify it, and only then deploy a separate forward-only
migration that requires the sixth field. Applying both phases before the Worker
would break in-flight or still-running old-version completions.

The 75-minute exercise and its `always()` safety step purge only peek refs whose
body exactly matches the pre-generated marker. Cleanup runs only after the
exact-version configuration collector succeeds and the exercise step records
that it is about to enter the queue boundary. Eligibility or Email Sending
capability failure therefore performs no queue cleanup because no queue access
began. Both cleanup paths reject
ambiguous/full peeks and never invoke queue-wide purge. A hard-cancelled run is
recovered by rerunning that same GitHub Actions run, which derives the same
opaque marker. If its first rerun finds and removes a delayed marker during
fail-closed preflight, rerun the same run again to start from verified-empty
queues. Standalone cleanup performs a final source/DLQ peek after the elapsed
poll bound is reached, so normal provider latency cannot prevent a verified
already-absent result. A failed exercise reports
`email_not_observed` when no unique delivered Email Sending event was found, or
`email_invalid_configuration` when the bounded analytics input was invalid.
Provider failures are split into closed, non-secret categories:
`email_provider_permission_denied` for an HTTP authorization response,
`email_provider_resource_unavailable` for an empty exact-zone result, disabled
dataset, or required event field unavailable to the requester, and
`email_provider_graphql_error` for a well-formed GraphQL error envelope whose
free-text details are not interpreted; `email_provider_request_failed` for
another request or non-success response; `email_provider_result_truncated` when
the bounded time-window page reaches its hard limit; and
`email_provider_response_invalid` when the response is unreadable, malformed,
oversized, or rejected by the response schema. The diagnostic never includes a
provider message, path, extension, body, address, or token. `email_query_failed`
is reserved for an unexpected internal exception. The analytics request uses
the provider-documented zone/time filters, while the collector requires
`status = delivered` and `isLastEvent = 1` before accepting evidence. It reports
`database_not_observed` when that event was found but its exact provider message
identifier was not bound to a delivered database row. On success, retain only
`ac209-exercise/configuration.json` and `ac209-exercise/exercise.json` for 30
days. The latter contains hashed addresses/queue identities plus the exact
provider message identifier, and states `pending_manual_verification`; it is
provider/database proof, not Gmail acceptance.

Finally inspect the real Gmail receipt. Confirm the exact recipient, subject
`[WeJammin] dlq_nonempty`, provider message identifier, delivery time, and
redacted body fields for the same release, then record the bounded manual
receipt and reviewer attestation. Do not close AC209 from the Cloudflare
`delivered` status alone.

Manual accessibility reports record stable opaque operator IDs rather than
names or email addresses. They use strict schema version
`ac266-manual-a11y-v1`, bind the exact source SHA, deployment, origin, and
`/app/cms-content-modeling` path, and attest that the authenticated, authorized
CMS workbench was tested rather than the sign-in or access-denied boundary.
Each report records the matching OS, browser, and screen-reader product-family
versions, UTC start/completion times, `passed` outcome, and every canonical
check exactly once. Check observations are bounded structured values rather
than free-text notes. A Linux screen reader or Chromium run cannot substitute
for the two locked platform pairs.

## Collect AC266 manual accessibility evidence

Run one real macOS/Safari/VoiceOver session and one real
Windows/Firefox/NVDA session against the same successful hosted staging
candidate. Complete all 11 canonical checks in each report. The structured
observations must cover keyboard order, focus visibility and restoration,
pointer/keyboard equivalence, error association, screen-reader labels and
descriptions, heading navigation and the sanitized announced-status identity,
semantic landmarks/live regions, reflow and text spacing, zoom, contrast, and
all eligible target sizes. Target-size evidence uses unique opaque target IDs,
per-target CSS-pixel dimensions and any applicable exception, plus an explicit
attestation that every eligible target was measured. Do not include content,
names, email addresses, account identifiers, screenshots, recordings, or
free-text notes.

Hash the exact UTF-8 bytes of each completed JSON report with SHA-256. Store
their base64 encodings as the protected `ac266-manual-evidence` environment
secrets `AC266_VOICEOVER_REPORT_BASE64` and
`AC266_NVDA_REPORT_BASE64`; set `STAGING_WEB_ORIGIN` to the exact hosted origin.
The environment is limited to `main` and requires its configured reviewer. A
single-account reviewer configuration permits owner self-approval, so it must
not be described as independent review.

Dispatch `intake-ac266-manual-accessibility-reports.yml` from `main` with the
exact lowercase `voiceover_report_sha256` and `nvda_report_sha256` values. The
protected job materializes the secret bytes only in a run-ID/run-attempt-specific
directory below `runner.temp`, strictly parses the reports, verifies the two
digests, and removes the private directory in both the implementation and an
`always()` cleanup step. Its 30-day `ac266-manual-accessibility-intake`
artifact contains only the sanitized intake manifest. Raw reports are never
uploaded as artifacts.

Then dispatch `collect-ac266-manual-accessibility.yml` from `main` with the
exact `staging_run_id`, 40-character `source_sha`, GitHub
`staging_deployment_id`, and successful `manual_report_run_id`. The protected
collector downloads the named staging candidate and sanitized intake manifest,
re-materializes the same secret bytes, and requires their digests to match the
approved intake. It binds both source reports to the repository, workflow,
source SHA, staging run ID and attempt, deployment, origin, and candidate
artifact. It also verifies that the selected staging deployment was successful
before testing and remained the effective hosted release through each report's
completion. Report start must be at or after deployment; completion must be
after start and no later than the trusted intake-run start.

The collector removes the private report directory before uploading the 30-day
`ac266-manual-accessibility-evidence` artifact, which contains only the
sanitized verification manifest and report digests. Keep the two report secrets
until the protected combined-sidecar finalizer has re-materialized, strictly
parsed, and verified the exact report bytes in its private report root; rotate
or remove them only after that step completes. A digest/status manifest alone
does not substitute for the structured manual observations.

Passing either dedicated workflow proves intake and provenance infrastructure
only. The current combined release verifier does not automatically consume the
sanitized AC266 manifest: its protected assembly step must supply the original
strict report bytes privately, run the four-gate verifier, and remove them
before artifact upload. AC266 closes only when the two genuine platform reports
pass and that combined release sidecar succeeds with the other required
evidence.

## Collect AC211 evidence

Wait until a UTC day has ended and that entire day follows the selected
production deployment. Dispatch `collect-production-ac211.yml` from `main` with
the complete `utc_day`, full lowercase `source_revision`, GitHub
`production_deployment_id`, and `confirm_collection: true`. Its unprotected
preflight reads GitHub deployment metadata and statuses; only a verified source,
successful production status, and eligible day enter the protected `production`
job.

The protected job requires `CLOUDFLARE_OBSERVABILITY_API_TOKEN` plus the
non-secret `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PLATFORM_QUEUE_ID`
environment variables. It reads Workers Observability events for the exact
production release and UTC window, queries Queue Analytics `ReadMessage`
attempts and `DeleteMessage` rows whose outcome is `dlq`, and retains only:

- `slo/dataset.json`
- `slo/measurement.json`
- `slo/ac211-slo.json`

The collector fails closed on incomplete pagination, unexpected event identity,
fewer than 200 command/RPC/acceptance samples, missing queue first-attempt data,
incoherent queue counts, threshold equality or failure, and any report-integrity
mismatch. It publishes the three files atomically and uploads them for 30 days
only after successful collection. Raw provider payloads are never retained.

Queue Analytics returns Cloudflare's adaptive aggregate counts. The report
preserves that provider provenance and does not claim a lossless raw queue-event
ledger. Low natural traffic is a real failed gate: do not manufacture production
requests merely to reach 200 samples. Re-run promptly after an eligible day
because Workers Observability retention is bounded.

## Assemble the sidecar

Create the JSON only inside the protected workflow workspace. Its strict shape
is `ContentSchemaRegistryOperationalReleaseEvidenceSchema` in
`packages/contracts/src/content-schema-registry/operational-release-evidence.ts`.
Unknown fields fail. Raw provider payloads, request bodies, cookies, tokens,
authorization headers, email addresses, content values, and capability graphs
do not belong in the sidecar.

Every retained-file digest in the release sidecar is paired with a safe path
relative to one retained-report root.
The verifier streams that fixed tree within entry and depth budgets derived
from the declared report paths, resolves each path inside the root, forbids
symlink report entries and escapes, rejects special files before a nonblocking
open, pins each unique regular file's identity and size to that descriptor,
reads no more than 10 MiB plus a growth sentinel, recomputes every SHA-256 digest
from the same bytes it parses, and rejects every unreferenced file or directory.
`hosted/e2e.json` must satisfy the strict redacted
`ContentSchemaRegistryHostedE2eReportSchema` for version
`ac265-hosted-e2e-v3`; it contains only exact release identity, timestamps,
passed role/scenario keys, explicit role assertions, bounded durations,
approved opaque references and digests, verified server-receipt references and
digests, and the redacted cleanup result. Version `ac265-hosted-e2e-v2` is
legacy and cannot satisfy this contract.
The approved Phase 2 role assertions are:

| Roles                                                                   | Required assertion   |
| ----------------------------------------------------------------------- | -------------------- |
| entitled_read, owner_full, staff_case_scoped, admin_step_up             | authorized_access    |
| guardian_mandate, junior_restricted, business_mandate, forbidden_hidden | denied_no_disclosure |
| disabled_prerequisite                                                   | disabled_no_mutation |

Exercise deferred context denial using eligible adult sessions, without creating
minor accounts or invented mandates. Assert no protected disclosure or mutation
on denied contexts. Positive cases require real server capability, ownership,
case scope, and recent step-up as applicable; unavailable authority remains a
blocker. A disabled case must demonstrate disabled controls and no mutation.
All nine cases and all ten scenarios remain mandatory, with actual hosted
IdP/RLS and session teardown evidence. Do not relabel an old result, skip a case,
or use the policy map to generate claimed passes. The map validates evidence;
it neither runs a test nor grants authority. The
verifier then confirms shape, exact check coverage,
immutable identity, ordering, strict SLO limits, derived daily DLQ rate,
hosted-origin safety, deployment chronology, trusted-cutoff bounds, and evidence
timing. It does not collect telemetry,
activate a provider, provision identities, attest provider truth independently,
or perform the manual tests. A local pass proves sidecar/report consistency; it
does not by itself satisfy any of the four release criteria.

The local v3 schema and internal cross-verifier are implemented. For AC265,
the verifier hashes exact raw runner-contract, reference, execution-evidence,
and receipt bytes; checks their declared digests; resolves protected evidence
by opaque reference; validates receipt authenticity through the supplied
authenticity verifier; and compares subjects, results, resource bindings, and
complete candidate identity. It also requires independently supplied
role/resource and scenario/role mappings, validates the outage-lease lifecycle
against `expectedOutageLeaseScope`, and enforces caller-supplied
`maxRunDurationMs`, trusted cutoff, receipt run-window, and cleanup-receipt
ordering. A hash of `hosted/e2e.json` or a local fixture alone proves none of
the external sessions, resources, signed receipts, or hosted observations.

This remains a local trust-boundary check, not hosted AC265 acceptance. The
protected session broker, safe-resource registry, authenticated outage
lease/fault-evidence service, evidence-byte service, isolated hosted workflow,
and v3 hosted report producer are still missing. A future protected workflow
must supply the verifier's trusted context from authenticated CI/deployment
outputs and resolve/sign the real staging evidence. Keep the criterion
blocked until a complete protected staging run and accepted v3 report exist.

Treat `approved_scheduled_boundary` as incomplete until the protected-workflow
reviewer confirms that its alert-configuration report contains the approved
change/reference record. The verifier hashes that report but does not interpret
its provider-specific contents; the enum value alone is not approval evidence.

## Protected verification entrypoint

The standalone command is not a successful verification path. Its local JSON
arguments cannot provide the function-valued V3 trust inputs `resolveReceipt`,
`verifyReceiptAuthenticity`, or `resolveEvidence` when execution evidence is
present. The direct CLI therefore fails closed with an error instructing the
caller to use a protected workflow; do not invoke it as an acceptance gate or
expect a success marker.

Only a protected workflow entrypoint may call
`verifyContentSchemaRegistryOperationalReleaseEvidenceFile` with
`hostedV3Verification` constructed from trusted protected context. That context
must supply the exact protected `runnerContractBytes`, independently trusted
identity/digests/mappings/time bounds, and the receipt/evidence resolvers and
authenticity verifier. The workflow may emit
`content_schema_registry_release_evidence=passed` only after the V3 retained
report and all other gates pass. Until that protected entrypoint exists, no
standalone command can produce acceptance success. Keep Slice 09 and dependent
Slice 10 blocked until the protected run produces a passing sidecar and an
operator reviews the retained source reports.

Any missing, malformed, duplicate, out-of-root, digest-mismatched,
structurally local/synthetic, stale-order, threshold-equal,
threshold-exceeding, or sidecar record declared non-redacted fails closed.
Matching bytes and a `redacted: true` declaration do not prove report truth or
redaction; protected source review must reject forged, synthetic, or sensitive
report contents.

## Security boundary

- Resolve exactly nine role-bound session handles through the protected
  external broker; keep session contents outside repository files, logs, and
  retained artifacts.
- Use a protected ephemeral runner per attempt. Do not share a persistent
  self-hosted worker, browser profile, or session state across runs.
- Disable Playwright traces, screenshots, video, and HAR for authenticated
  hosted runs. The v1 contract does not retain browser session state.
- Keep retained report roots minimal. Unreferenced traces, screenshots, videos,
  storage state, provider payloads, files, and directories fail verification.
- Retain only allowlisted aggregate measurements and opaque report IDs/digests.
- Never enable a paid provider or integration from this runbook.
