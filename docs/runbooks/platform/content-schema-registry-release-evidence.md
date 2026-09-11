# Content schema registry release evidence

Use this runbook to assemble and verify the release sidecar for
`P2-S09-AC-209`, `P2-S09-AC-211`, `P2-S09-AC-265`, and `P2-S09-AC-266`.
Passing local tests does not satisfy these gates.

## Immutable identity

Start from one successful immutable build. Record its full lowercase 40-character
source SHA, artifact SHA-256 digest, build ID, and migration version. Every
component report in the sidecar must name that same source SHA, and the hosted
E2E migration version must equal the artifact migration version.

The protected workflow must independently create an expected-release-identity
JSON containing the trusted source SHA, artifact digest, build ID, migration
version, production deployment ID/`productionDeployedAt`, hosted
environment/deployment ID/`hostedDeployedAt`, exact web/API/Supabase origins,
and trusted evidence cutoff `trustedCutoffAt`. Populate deployment times and
the cutoff from immutable deployment outputs/protected workflow state, never by
copying values from the sidecar being checked. The cutoff is captured after the
sidecar and reports are assembled, immediately before verification.

The protected workflow must retain the sidecar and its referenced reports as
workflow artifacts. Do not commit generated evidence, browser storage state,
provider exports, or manual-test recordings to the repository.

## Required reports

| Criterion | Required non-local evidence                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC209     | Production-native alert configuration containing every locked condition plus one redacted delivered `platform.on_call` receipt captured after that configuration.                                                 |
| AC211     | Production query/report and dataset, at least 200 command/RPC/acceptance samples, retained queue/DLQ counts, one complete UTC day, and all five observed values below their strict thresholds.                    |
| AC265     | Hosted staging or production Playwright report against pathless HTTPS origins, Google through Supabase Auth, all locked role variants, every resilience scenario, the deployed migration, and exact artifact SHA. |
| AC266     | Automated axe report with zero Serious/Critical findings and complete manual VoiceOver/Safari/macOS plus NVDA/Firefox/Windows runs against the exact hosted deployment, origin, and SHA.                          |

The automated axe target `/app/cms-content-modeling` is an unauthenticated
auth-boundary check only: it must finish at `/auth/sign-in` with HTTP 200. It
does not claim authenticated CMS page coverage; authenticated coverage belongs
to the AC265 hosted matrix and the manual accessibility runs.

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
`CLOUDFLARE_PLATFORM_QUEUE_ID`. The existing observability token supplies the
read-only Analytics permission for the Email Sending query.

After the verification RPC migration and exercise workflow are deployed,
dispatch `exercise-production-ac209.yml` from `main`. Supply the exact deployed
source revision and Worker version, production DLQ ID, approved configuration ID
and reference, and set `confirm_exercise: true`. The protected job recollects
the exact-version configuration before any mutation. It then requires an
eligible alert cooldown and empty exact source/DLQ peeks, pushes one UUID-marked
malformed envelope, observes retry exhaustion in the DLQ, and keeps that exact
message present while it correlates one delivered Email Sending event. The
service-only database verifier hashes the provider-owned message identifier
internally and requires one delivered `dlq_nonempty` row for the exact release.
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

The second-release tighten preflight is an ordered deployment gate, separate
from the AC209 delivery and receipt gate: confirm that remote migration history
contains `20260910030000_ac209_operational_alert_verification.sql`; confirm
that the provider-aware production Worker exact version routes at 100% traffic;
confirm that legacy in-flight invocations have drained; and confirm that a real
provider-aware completion produced a non-null provider digest. Only after all
four checks pass may the forward-only migration use `CREATE OR REPLACE
FUNCTION` to make `providerMessageId` required for new completion calls.
Historical `provider_message_hash` remains nullable; this tighten does not
rewrite historical rows. This runbook does not claim that the required
provider-aware completion exists. The already-locked AC209 provider delivery,
service/database evidence, and manual Gmail receipt remain separate mandatory
acceptance requirements.

The 75-minute exercise and its `always()` safety step purge only peek refs whose
body exactly matches the pre-generated marker. Cleanup runs only after the
exact-version configuration collector succeeds. Both paths reject
ambiguous/full peeks and never invoke queue-wide purge. A hard-cancelled run is
recovered by rerunning that same GitHub Actions run, which derives the same
opaque marker. If its first rerun finds and removes a delayed marker during
fail-closed preflight, rerun the same run again to start from verified-empty
queues. On success, retain only
`ac209-exercise/configuration.json` and `ac209-exercise/exercise.json` for 30
days. The latter contains hashed addresses/queue identities plus the exact
provider message identifier, and states `pending_manual_verification`; it is
provider/database proof, not Gmail acceptance.

Finally inspect the real Gmail receipt. Confirm the exact recipient, subject
`[WeJammin] dlq_nonempty`, provider message identifier, delivery time, and
redacted body fields for the same release, then record the bounded manual
receipt and reviewer attestation. Do not close AC209 from the Cloudflare
`delivered` status alone.

Manual accessibility reports record stable operator IDs rather than names or
email addresses. They include concrete OS, browser, and screen-reader versions,
completion time, report digest, `passed` outcome, and every canonical check
exactly once. A Linux screen reader or Chromium run cannot substitute for the
two locked platform pairs.

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

Every digest is paired with a safe path relative to one retained-report root.
The verifier streams that fixed tree within entry and depth budgets derived
from the declared report paths, resolves each path inside the root, forbids
symlink report entries and escapes, rejects special files before a nonblocking
open, pins each unique regular file's identity and size to that descriptor,
reads no more than 10 MiB plus a growth sentinel, recomputes every SHA-256 digest
from the same bytes it parses, and rejects every unreferenced file or directory.
`hosted/e2e.json` must satisfy the strict redacted
`ContentSchemaRegistryHostedE2eReportSchema`; it contains only exact release
identity, timestamps, passed role/scenario keys, explicit role assertions, and
bounded durations. Report version `ac265-hosted-e2e-v2` rejects legacy reports.
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

Treat `approved_scheduled_boundary` as incomplete until the protected-workflow
reviewer confirms that its alert-configuration report contains the approved
change/reference record. The verifier hashes that report but does not interpret
its provider-specific contents; the enum value alone is not approval evidence.

## Verify

Run from the immutable checkout after all four report families exist:

```bash
node --experimental-strip-types \
  infra/workflows/verify-content-schema-registry-release-evidence.ts \
  "$S09_RELEASE_EVIDENCE_PATH" \
  "$S09_EXPECTED_RELEASE_IDENTITY_PATH" \
  "$S09_RELEASE_REPORT_ROOT"
```

The executable samples `Date.now()` once for its trusted clock. It rejects an
expected `trustedCutoffAt` later than that clock; equality is accepted. Direct
callers may inject a trusted clock for deterministic tests, but production
verification must use the default executable clock and create the expected
identity from protected deployment outputs.

Success emits exactly:

```text
content_schema_registry_release_evidence=passed
```

Any missing, malformed, duplicate, out-of-root, digest-mismatched, structurally
local/synthetic, stale-order, threshold-equal, threshold-exceeding, or sidecar
record declared non-redacted exits nonzero. Matching bytes and a `redacted: true`
declaration do not prove report truth or redaction; protected source review must
reject forged, synthetic, or sensitive report contents.
Keep Slice 09 and dependent Slice 10 blocked until the protected run produces a
passing sidecar and an operator reviews the retained source reports.

## Security boundary

- Provision hosted test identities and storage state outside repository files.
- Disable Playwright traces for authenticated hosted runs unless the protected
  artifact process proves they contain no cookies, tokens, email addresses, or
  OAuth query values.
- Keep retained report roots minimal. Unreferenced traces, screenshots, videos,
  storage state, provider payloads, files, and directories fail verification.
- Retain only allowlisted aggregate measurements and opaque report IDs/digests.
- Never enable a paid provider or integration from this runbook.
