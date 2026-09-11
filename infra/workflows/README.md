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

- `build-immutable-artifacts.sh` builds the workspace and packages both web
  runtime configurations for the immutable CI artifact.
- `write-ci-gate-evidence.sh` derives the release gate set from successful CI
  job results and the built artifact boundary.
- `verify-ci-release-gates.sh` runs the contract, production-registry, and SLO
  runbook checks that supply independent gate evidence.
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
- `verify-content-schema-registry-slo-source.ts` proves the requested source SHA,
  production deployment, successful production status, and complete UTC-day
  ordering through bounded GitHub deployment API reads.
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

## Conventions

Scripts accept identity only through environment values derived by the calling
workflow. Staging derives identity from its successful upstream CI run;
production derives the staging run ID and source SHA from an explicit
`workflow_dispatch` and verifies both against the GitHub Actions API before the
protected production job starts. The preflight also requires the immutable
staging workflow ID/path, required reviewers, disabled administrator bypass,
and either protected branches or one exact custom `main` branch policy. Only
the production migration entrypoint contacts Supabase; its access token and
database password remain scoped to that protected-environment step. Cloudflare
credentials remain scoped to the individual deploy steps in the workflows.

### Verification

Run `bash <script>` only from a checked-out repository with the workflow
environment supplied. Migration tests replace the `pnpm` provider boundary
with a local fake and never contact Supabase. Contract coverage lives in
`tests/release-identity-contract.test.ts`, `tests/workflow-evidence-scripts.test.ts`,
`tests/web-ssr-deployment-contract.test.ts`, and `tests/environment-contract.test.ts`.

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
- [Infrastructure guidance](../README.md)
