# Deployment workflow scripts

## Contents

This directory contains the bounded shell entrypoints used by GitHub Actions
for immutable builds and release promotion. The workflow files retain event,
identity, environment, and credential scope while these scripts own repeatable
filesystem and validation operations.

### Entry points

- `diagnose-content-schema-registry-slo.mjs` emits four count-only historical
  telemetry comparisons inside the protected AC211 job. It uses the existing
  observability credential, one returned event maximum per query, a 10-second
  request timeout, and a 2 MiB response cap. Raw events and secrets never enter
  output. Missing counts remain null, not zero. Diagnostic failures warn but
  never replace or bypass the subsequent normal evidence collector.

- `diagnose-content-schema-registry-queue-shape.mjs` answers the next AC211
  failure-forensics question after a `malformed_queue_analytics_row` failure:
  which Queue Analytics field drifted. It reuses the collector's exact query
  string, envelope classification, and row classifier, so its verdict is the
  collection verdict rather than a second opinion. It emits only closed value
  classes (row type, dimension presence and key count, date/count/action/outcome
  classes) plus the exact rejected gate and bounded row counts. Provider values,
  timestamps, queue identifiers, raw rows, and secrets never enter output, and
  the emitted row list is capped. It is read-only, writes no evidence file,
  and a failure warns without replacing or bypassing the normal collector.
  The gate vocabulary and envelope classification live in
  `content-schema-registry-slo-queue-shape.ts`, and the closed value-class
  descriptors live in `content-schema-registry-slo-queue-value-classes.ts`. The
  collector imports the former, so the two cannot drift apart.

  Cloudflare documents the `outcome` dimension as applicable only to
  `DeleteMessage`
  (https://developers.cloudflare.com/queues/observability/metrics/). Protected
  run `36038432808` showed that real `ReadMessage` and `WriteMessage` rows
  still carry a value there, and collection failed closed on `outcome_shape`
  because of it. The row gate now treats a non-delete outcome as inapplicable:
  an absent, null, or bounded string placeholder is accepted and never counted
  toward `dlqMessages`, while a non-string, a string past the 64-character
  bound, or the `dlq` marker on a non-delete row still rejects the row.
  `DeleteMessage` keeps its closed `success`/`dlq`/`fail` vocabulary, so
  `dlq` remains the only way a message can count as a DLQ message.

- `ac209-email-diagnostics.ts` and its entrypoint
  `diagnose-production-ac209-email.ts` answer one AC209 failure-forensics
  question for the old exercise window: whether the Email Sending dataset was
  readable and enabled for the observability token, whether the window query
  returned zero rows, an identity mismatch, a terminal-status mismatch, a full
  page, or duplicate/multiple matches, and the documented requester limits.
  It reuses the exact settings and event shapes documented for
  `zones(...).settings.emailSendingAdaptive` and `emailSendingAdaptive`, is
  read-only, and writes one redacted report of bounded counts, booleans, and
  closed non-PII codes. It never retains raw addresses, subjects, provider
  message identifiers, provider bodies, or secrets, closes no acceptance
  criterion, and replaces neither the delivery verifier nor the visible receipt
  inspection. Dispatch contract:
  `.github/workflows/diagnose-production-ac209-email.yml`.

- `build-immutable-artifacts.sh` builds the workspace and packages both web
  runtime configurations for the immutable CI artifact.
- `ac209-email-presence-contract.ts` declares the contract for
  `ac209-email-presence.ts` and its entrypoint
  `probe-production-ac209-email-presence.ts`, which answer the one question the
  hour-bounded correlation gate cannot: whether the exact parent zone's Email
  Sending dataset holds any telemetry at all. The probe samples two trailing
  windows - 24 hours and 30 days - from one instant with `limit: 1` and reports a
  bounded row count, a presence boolean, and one closed classification
  (`recent_present`, `recent_missing`, `zone_wide_missing`, or
  `provider_unavailable`). It selects only the non-PII `status` field, required
  by the GraphQL rule that every selection set be non-empty, and never publishes
  its value; no address, subject, or provider message identifier is ever selected
  or retained. An unavailable window carries a closed code from
  `AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES` rather than free text, so the retained
  artifact cannot carry a provider message or a token, and the wide window is
  checked against the provider duration ceiling at module load. It is read-only,
  performs no mutation, and closes no acceptance criterion. Dispatching it does
  not close AC209 and does not replace the correlation gate, the delivery
  verifier, or the visible receipt inspection.

  It also accepts an optional second candidate tag through
  `AC209_PRESENCE_ALTERNATE_ZONE_TAG`. The Email Sending dashboard path shows a
  sending-domain identifier beside the parent zone id, and Cloudflare documents
  `zoneTag` as a zone id without stating how a sending-domain tag resolves. The
  optional tag is inventoried over the recent window in the same dispatch and
  reported as its own closed value (`not_configured`, a bounded count, or a
  closed code). It is inventory only: it never feeds the parent-zone
  classification, never contributes to AC209 acceptance, and is never retained -
  neither tag id appears in the artifact. Omitting the variable makes no extra
  request.
  Dispatch contract: `.github/workflows/probe-production-ac209-email-presence.yml`.

  A second, sibling entry answers the dataset-ownership question that the sending
  probe alone cannot. Cloudflare documents that emails sent from a Worker through
  the `send_email` binding appear in the Email Routing summary as dropped, even
  when they were delivered successfully
  (https://developers.cloudflare.com/email-service/platform/limits/), while also
  publishing two separate zone-level datasets, `emailSendingAdaptive` and
  `emailRoutingAdaptive`
  (https://developers.cloudflare.com/email-service/observability/metrics-analytics/).
  `ac209-email-routing-presence-contract.ts` declares the routing contract and the
  combined report, `ac209-email-routing-presence.ts` implements both, and
  `probe-production-ac209-datasets.ts` is the entrypoint. The rules that are not
  dataset-specific - the probe-instant reader, the closed provider-failure mapper,
  and the bounded single-row reader - live once in
  `ac209-email-dataset-presence-shared.ts` and are shared by both probes, so the
  two halves cannot drift into different instant semantics or page bounds. One
  dispatch reads the
  sending dataset and the routing dataset from a single probe instant and reports
  them side by side: four requests total, two bounded windows per dataset, each
  with `limit: 1` and each selecting only the non-PII `status` field. Neither
  verdict is derived from the other, and the routing read reuses the sibling's
  request boundary, zone-record reader, and closed failure vocabulary rather than
  restating provider-shape rules.

  Interpretation stays deliberately cautious. A routing `dropped` row does not by
  itself prove that the Email Sending dataset should be empty, and an unreadable
  routing dataset does not prove that it holds events; in particular, an
  unavailable routing dataset is reported as a closed code rather than as an empty
  reading, which is the expected shape when Email Routing is not enabled on the
  zone. The probe enables nothing, mutates nothing, closes no acceptance
  criterion, and replaces neither the correlation gate, the delivery verifier, nor
  the visible receipt inspection. Dispatch contract:
  `.github/workflows/probe-production-ac209-email-datasets.yml`.

- `write-ci-gate-evidence.sh` derives the release gate set from successful CI
  job results and the built artifact boundary.
- `verify-ci-release-gates.sh` runs the contract, production-registry, and SLO
  runbook checks that supply independent gate evidence.
- `verify-system-chrome.sh` fails closed unless the runner provides the
  installer-provided Google Chrome binary, so browser gates never silently fall
  back to the Playwright-bundled Chromium download.
- `verify-staging-artifacts.sh` validates the workflow-derived staging
  identity, origins, and downloaded artifact boundary.
- `record-staging-artifacts.sh` records deterministic SHA-256 entries for the
  downloaded staging artifact.
- `deploy-api-worker.sh` injects the approved server configuration and a
  permission-bounded temporary Wrangler secrets file for either hosted
  environment.
- `prepare-staging-candidate.sh` copies the verified artifact and manifest into
  the promotion candidate directory.
- `finalize-staging-candidate.sh` writes the complete release-promotion
  evidence after public staging verification succeeds.
- `collect-staging-axe-evidence.sh` paginates and binds the current protected
  staging deployment/status record to the promoted SHA and run metadata, runs
  the redacted AC266 axe collector, independently hashes and verifies its
  strict report, and leaves `promotion-candidate/accessibility/axe.json` plus
  `axe.sha256` for the staging artifact upload. It requires the preceding
  staging verification to observe the served Cloudflare web response header
  `x-wejammin-release` equal to the promoted SHA. The GitHub deployment ID and
  Cloudflare Worker version ID remain distinct identities and must be retained
  separately. It writes the validated report digest, deployment identity, and
  collection timestamps to the following workflow step through `GITHUB_ENV`.
- `verify-staging-axe-evidence.sh` rechecks the canonical sidecar and report
  digest at finalization, then revalidates the report against the collected
  identity and time bounds so later workflow steps cannot mutate retained AC266
  evidence.
- `collect-content-schema-registry-axe-evidence.ts` runs the canonical hosted
  paths with Playwright and axe, retaining only bounded rule summaries and
  exact hosted identity.
- `content-schema-registry-axe-report-verifier.ts` validates the retained axe
  report independently and recomputes its SHA-256 before the full sidecar
  verifier accepts it.
- `verify-production-candidate.sh` validates production promotion evidence,
  artifact identity, and manifest checksums before deployment.
- `read-production-candidate.sh` validates workflow-run identity before the
  promoted revision is checked out.
- `verify-production-environment.ts` verifies the dispatch confirmation,
  repository identity, exact `main` revision, and live `production`
  environment protection without referencing protected secrets.
- `apply-hosted-migrations.sh` applies forward-only Supabase migrations for a
  hosted environment, verifies the exact remote version, and records expansion.
- `verify-staging-migration-evidence.mjs` binds the staging migration history to
  the exact project, source revision, and CI run before candidate promotion.
- `verify-content-schema-registry-release-evidence.ts` validates the strict S09
  production-observability, hosted-E2E, and manual-accessibility sidecar against
  independently supplied immutable build/deployment/origin identity and
  streams the approved report tree within path-derived entry/depth budgets, then
  recomputes every referenced digest from descriptor-pinned bounded reads. It
  performs no provider calls and a pass does not replace protected-workflow
  source review.
- `verify-content-schema-registry-slo-source.ts` pins bearer-authenticated
  requests to the canonical GitHub REST origin, compares two complete bounded
  deployment-status snapshots, and proves the latest status belongs to the
  requested source SHA and exact `Deploy production` workflow job and attempt.
  The deployment must identify `ref=main` and `task=deploy`; its creation and
  status times must agree with the linked job/run before setting the SLO boundary.
- `content-schema-registry-slo-deployment-provenance.ts` requires that job and
  run to match the active `Deploy production` workflow ID, path, name, manual
  event, `main` branch, source SHA, and repository identity. Every GitHub
  response remains timeout- and size-bounded.
- `ac266-manual-accessibility-report-cli.ts` exposes the offline
  `pnpm ac266:reports` operator command. `template` creates intentionally
  incomplete VoiceOver/Safari and NVDA/Firefox drafts; `prepare` strictly
  validates the completed private reports against one staging candidate and
  writes bounded, owner-only base64 files for the two protected GitHub secrets.
  It performs no network calls or uploads and never turns a template into
  accessibility evidence.
- `content-schema-registry-slo-provider.ts` performs bounded Workers
  Observability pagination and Queue Analytics aggregation, normalizing only the
  allowlisted fields needed by AC211.
- `collect-content-schema-registry-slo-evidence.ts` validates exact
  service/operation/event identity, recomputes the locked percentiles and DLQ
  ratio, and atomically publishes three digest-linked redacted reports.
- `collect-content-schema-registry-alert-configuration.ts` orchestrates the
  protected AC209 configuration capture. Its contract module locks all twelve
  conditions and thresholds; its provider client reads only the documented
  active deployment, exact-version binding targets, observability settings, and
  schedule fields. `ac209-wrangler-version-attestation.ts` obtains the same
  exact version's tag, message, and upload provenance through the pinned
  Wrangler CLI. Raw provider payloads and the alert address are discarded
  before the atomic redacted artifact is written.
- `ac209-queue-exercise.ts` runs the bounded AC209 queue marker exercise and
  re-exports its contracts plus `cleanupAc209QueueMarker` for cancellation-safe
  exact-marker cleanup.
- `ac209-queue-contracts.ts` contains the validated queue exercise/cleanup
  inputs, runtime bounds, redacted report types, and error boundary.
- `ac209-queue-provider.ts` owns bounded Cloudflare Queue API requests,
  pagination, peeks, exact marker matching, and source-consumer verification.
- `ac209-queue-cleanup.ts` polls both exact queues, purges only matching opaque
  references, rejects ambiguous full pages/provider error shapes, and proves
  marker absence before reporting cleanup.
- `exercise-production-ac209.ts` binds that exact-version configuration to one
  reviewer-approved production queue exercise. The queue adapters require empty
  exact source/DLQ preflights, observe real retry exhaustion, retain the marker
  and message identities only as SHA-256 digests, hold the DLQ message while the
  bounded Email Sending query and service-only Supabase receipt verification
  complete, and purge only the correlated peek ref in `finally`.
  Queue, Email Analytics, and Supabase response bodies are size-bounded during
  streaming, timeout-bounded, and rejected on invalid UTF-8. The database check
  receives `notBefore = exercise.startedAt`, so an earlier delivery for the same
  release cannot satisfy the run.
  `cleanup-production-ac209.ts` is the idempotent `always()` safety step: it
  rechecks the pre-generated opaque marker across both exact queues and either
  proves absence or purges only its matching refs. Neither path performs a
  queue-wide purge. The 75-minute workflow invokes this safety step only after
  the exact-version configuration collector succeeds. The retained exercise
  report explicitly leaves Gmail inbox verification pending. The marker is
  derived from the immutable GitHub
  repository/run IDs, so rerunning the same workflow run after a hard
  cancellation recovers the same marker. If the first rerun removes a delayed
  marker during fail-closed preflight, rerun that same run once more to perform
  the exercise from verified-empty queues.
  Migration `20260910030000_ac209_operational_alert_verification.sql` is an
  expand phase that temporarily accepts the deployed five-field completion
  caller; require `providerMessageId` only in a later forward migration after
  the new Worker is verified live.

- `register-ac265-approved-registry.ts` is the manual entrypoint that submits an
  already-formed strict register request to the CP-02 approved-registry RPCs.
  This is registration transport/plumbing only: CP-02, unlike CP-04b, pins no
  approval policy table, so the dispatch input and the `staging` environment
  (currently unreviewed) do NOT prove that the referenced safe resources or the
  runner mapping are owner-approved. The owner-approval binding remains open.
  Its sibling bounded service-role client
  `ac265-approved-registry-registration-rpc.ts` POSTs only the strict register
  request to exactly `ac265_approved_safe_resource_register` or
  `ac265_approved_runner_mapping_register` at the exact
  `https://<ref>.supabase.co` origin, with no-redirect/no-store transport, a
  64 KiB streamed response cap, fatal UTF-8 decoding, a fixed 10-second
  deadline, and a single generic failure boundary. It rejects any redirect,
  non-200 status, duplicate JSON member, or `{status:'conflict'}` response and
  binds every register result field (authorization, idempotency, resource kind
  and locator, environment, hosting project, Supabase project ref, and
  redaction) to the submitted request before returning. The entrypoint reads
  the request only from the exact runner-temp JSON file, requires the full
  registration environment, and appends only the server-derived
  resource reference/kind or mapping id to `GITHUB_OUTPUT` and
  `GITHUB_STEP_SUMMARY`. It deliberately does not seed rows, create identities
  or grants, or verify underlying resource safety, and it closes no AC265
  criterion.

- `run-ac265-outage-lease-control.ts` is the manual entrypoint for exactly
  one bounded CP-01 outage-lease control operation: acquire, consume, or
  release. It is foundation transport only and grants no AC265 acceptance. It
  chooses no dependency, route, duration, limit, or target: the operation and
  the authorization, target, idempotency, and (for consume/release) lease
  reference and digest all arrive as operator-supplied inputs, while the
  control plane owns every timestamp, the canonical reference digest, the
  fixed 60-second one-request policy, and the conflict decision. Its sibling
  bounded service-role client `ac265-outage-lease-rpc.ts` POSTs only the
  strict request to exactly `ac265_hosted_outage_lease_acquire`,
  `ac265_hosted_outage_lease_consume`, or `ac265_hosted_outage_lease_release`
  at the exact `https://<ref>.supabase.co` origin, with no-redirect/no-store
  transport, a 64 KiB streamed response cap, fatal UTF-8 decoding, and a fixed
  10-second deadline. `ac265-outage-lease-transport.ts` owns that shared
  transport and the failure/conflict classification, while
  `runner-temp-artifact-boundary.ts` owns the held-descriptor runner-temp,
  summary, and exclusive-record filesystem boundary used by this entrypoint.
  That boundary module is new and local to these files; the earlier
  outage-target and runner-mapping entrypoints still carry their own copies of
  the same pattern, and deduplicating them is not part of this change. The
  client accepts only a schema-valid success result whose
  authorization, target, idempotency, environment, state, and redaction fields
  are bound to the submitted request and whose lease digest it independently
  recomputes from the returned lease reference; every other rejection collapses
  to one generic failure boundary. The control plane's deliberate refusal
  envelope `{status:'conflict'}` is reported as a distinct conflict outcome so
  an operator can tell a refusal from a transport or trust failure. The
  entrypoint writes exactly one exclusive redacted record at
  `${RUNNER_TEMP}/ac265-outage-lease/outage-lease-control.json`, appends a
  redacted summary, and emits the lease reference only as a job-scoped step
  output because that reference is a one-use capability. It exercises no
  outage, seeds no approved target, registers
  no dependency or route, contacts no hosted resource, creates no identity or
  grant, and closes no AC265 criterion.

- `ac265-retained-report-producer.ts` is the retained hosted E2E report
  producer. It takes the exact report bytes the assembler emitted plus the
  independently trusted run facts, validates them on the raw-byte boundary, and
  publishes one owner-only report at the sidecar-declared relative path. Its
  ordering is deliberate: the bytes are validated in full before the report
  root is created, inspected, or written, so a rejected report leaves no
  directory behind. The returned digest is SHA-256 over the exact bytes written,
  not over a canonical re-serialization, and `serializeAc265RetainedReportV3`
  owns that one byte form. This produces a retained artifact for the existing
  verifier; it brokers no sessions, issues no receipts, and claims no criterion.

  - `ac265-retained-report-redactor.ts` is the value-level redaction boundary.
    Four layers must all pass: provenance parsing with structural classes, the
    strict `ac265-hosted-e2e-v3` schema, provenance equality for every identity
    field, reference, digest, and the run window, and prohibited-content
    inspection. There is deliberately no global high-entropy scan: the
    contract's own UUIDs, revisions, and digests are high-entropy by design and
    a secret can be made to match a digest.
  - `ac265-retained-report-provenance.ts` parses and validates the trusted run
    facts and owns the field-aware identity classes, reference patterns, and the
    shared failure boundary. `ac265-retained-report-provenance-parsers.ts` owns
    the contract, receipt-slot, session-handle, and resource-binding parsers it
    composes, so both files stay inside the utility size cap.
  - `ac265-retained-report-trusted-digests.ts` derives the trusted receipt and
    evidence digests by resolving each reference through the authenticated
    resolver and hashing the returned bytes, so no digest is ever taken from the
    report or from a caller.
  - `ac265-retained-report-publication.ts` is the narrow byte-level boundary.
    It carries no assembler, broker, or resolver and requires complete trusted
    provenance, so it is not a path that skips authentication.
  - `ac265-retained-report-binding.ts` binds a schema-valid report to those
    trusted facts, so a valid report from another run, identity, receipt set, or
    resource set is rejected instead of republished.
  - `ac265-retained-report-prohibited-content.ts` owns the focused marker
    vocabulary applied to decoded member names and string leaves.
  - `ac265-retained-report-run-manifest.ts` integrates the protected run
    manifest into the producer boundary. It reads the exact canonical
    `ac265-hosted-run-manifest-v1` bytes through the CP-04g digest-bound
    `readAc265HostedRunManifestV1Bytes`, so duplicate members, schema drift, and
    insertion-ordered (non-canonical) members fail closed rather than being
    re-canonicalized onto a different digest, and it binds the manifest's
    criterion, contract version, run, identity, session references, resource
    references, and control policy to the contract parsed from the same runner
    contract bytes the report is assembled from. The producer requires those
    bytes and their trusted digest, binds them before assembly and before any
    directory is created, and returns the verified digest so a consumer can
    recompute it over the returned bytes.
  - `ac265-retained-report-writer.ts` owns atomic, exclusive publication: an
    owner-only temporary file, `fsync`, and `link` publication that cannot
    replace an existing or racing destination, with symlinked roots and path
    components rejected and temporary artifacts removed on failure.

- `ac265-hosted-artifact-attestation-issuer.ts` is the live, fail-closed
  producer half of the CP-04c hosted-artifact boundary. It signs exact
  caller-supplied `server_receipt` and `execution_evidence` bytes into the
  canonical, domain-separated `HostedArtifactAttestationV1` companion that the
  CP-04c resolver authenticates as one member of the `Ac265HostedArtifactSource`
  tuple the calling harness assembles; the resolver never consumes the
  companion on its own. It never synthesizes receipts,
  credentials, or identity: the caller supplies the bytes and the run binding,
  and the signer refuses anything else. Key pinning is self-describing — the
  key ID is derived as `ac265-hosted-artifact-ed25519-<sha256(SPKI DER)[0..32]>`
  and any key ID that does not name the exact public half of the supplied
  private key is rejected. Subject digests are derived from the bytes, never
  accepted as a caller-supplied digest. Receipt bytes must be complete,
  duplicate-member-free `ac265-hosted-e2e-receipt-v1` envelopes, and an
  execution-evidence payload's own `kind` must match the kind its declared
  descriptor maps to (`role` → `role_assertion`, `scenario` →
  `scenario_observation`, `session_teardown` → `session_teardown`), so a
  self-consistent payload the CP-04c verifier must reject is never signed.
  Canonical byte form is not required of either input: the digest is over the
  exact bytes and the resolver digests those same bytes. No live signing key is configured by
  this code; while the distinct artifact-attestation issuer key and its
  `artifactTrustedKeys` pinning remain owner decisions, the publishing boundary
  stays unwired and AC265 stays open.

  - `ac265-hosted-artifact-attestation-issuer-inputs.ts` owns the shared
    validators, the execution-evidence subject vocabulary, and the SPKI-derived
    key-ID derivation.
  - `ac265-hosted-artifact-attestation-issuer-contract.ts` owns the issuer
    request/result/run-binding interfaces and the trusted-key surface.
  - `ac265-hosted-artifact-attestation-issuer-signing.ts` owns the single
    signing pass: request-shape validation, window checks against the pinned
    key validity, and the canonical detached signature.

- `issue-ac265-hosted-artifact-attestations.ts` is the protected entrypoint
  that runs on an isolated runner. It reads one bounded, duplicate-member-free
  request document listing the exact artifact members the caller already holds,
  reads each member through no-follow bounded reads, re-derives each subject
  from the member bytes, and publishes only the signed companions plus a
  digest index under an owner-only `0700` directory created fresh beneath
  `RUNNER_TEMP`. The index is a handoff record for the calling harness, not a
  resolver input: the harness still builds each `Ac265HostedArtifactSource`
  from the artifact bytes, the published attestation companion, and its own
  expectation, exactly as the CP-04c fixtures do. An existing output directory
  fails closed, so the entrypoint never overwrites prior evidence. Identity
  comes only from environment values; `GITHUB_STEP_SUMMARY` and every artifact
  member must resolve beneath `RUNNER_TEMP`, and a path outside it fails
  closed. It emits a redacted step summary and no artifact bytes or private
  material.

  - `issue-ac265-hosted-artifact-attestation-contract.ts` owns the entrypoint
    constants, the request/source member sets, and the issuance summary type.
  - `issue-ac265-hosted-artifact-attestation-files.ts` owns the bounded
    no-follow reads and the exclusive owner-only publication with digest-bound
    readback.
  - `issue-ac265-hosted-artifact-attestation-sources.ts` owns declared-source
    parsing and the byte-derived subject digests for both artifact kinds.

## Conventions

Scripts accept identity only through environment values derived by the calling
workflow. Staging derives identity from its successful upstream CI run;
production derives the staging run ID and source SHA from an explicit
`workflow_dispatch` and verifies both against the GitHub Actions API before the
protected production job starts. The preflight also requires the immutable
staging workflow ID/path, required reviewers, disabled administrator bypass,
and either protected branches or one exact custom `main` branch policy. Only
the production migration entrypoint contacts Supabase; its access token and
database password remain scoped to that protected-environment step. The
standalone Cloudflare observability preflight reuses the production environment
guard before entering the protected job, then scopes its capability token to
one read-only verifier step. Its Workers Observability request sets `dry: true`
and fails unless the provider response attests `run.dry: true`. Other
Cloudflare credentials remain scoped to individual workflow steps.

### Verification

Run `bash <script>` only from a checked-out repository with the workflow
environment supplied. Migration tests replace the `pnpm` provider boundary
with a local fake and never contact Supabase. Contract coverage lives in
`tests/release-identity-contract.test.ts`, `tests/workflow-evidence-scripts.test.ts`,
`tests/web-ssr-deployment-contract.test.ts`, `tests/environment-contract.test.ts`,
`tests/production-environment-preflight.test.ts`, and
`tests/cloudflare-observability-preflight-workflow-contract.test.ts`.

## Extension

Add one focused script per repeatable workflow concern. Keep provider calls in
bounded adapters invoked by their protected workflow steps, pass identity
through explicit environment values, and preserve `set -euo pipefail` in every
shell entrypoint. Production promotion
must retain its manual trigger, preflight identity/protection checks, and
protected environment gate.

## Ownership

The deployment workflow owner maintains these scripts with the corresponding
`.github/workflows/*.yml` files. Changes must preserve explicit production
dispatch, full release evidence, and fail-closed artifact checks.

## Related links

- [CI workflow](../../.github/workflows/ci.yml)
- [Staging deployment](../../.github/workflows/deploy-staging.yml)
- [Production deployment](../../.github/workflows/deploy-production.yml)
- [Production Cloudflare observability verification](../../.github/workflows/verify-production-cloudflare-observability.yml)
- [Infrastructure guidance](../README.md)
