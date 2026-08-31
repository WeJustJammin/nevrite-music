# Deployment workflow scripts

## Contents

This directory contains the bounded shell entrypoints used by GitHub Actions
for immutable builds and release promotion. The workflow files retain event,
identity, environment, and credential scope while these scripts own repeatable
filesystem and validation operations.

### Entry points

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
- `verify-production-candidate.sh` validates production promotion evidence,
  artifact identity, and manifest checksums before deployment.
- `read-production-candidate.sh` validates workflow-run identity before the
  promoted revision is checked out.
- `apply-production-migrations.sh` applies forward-only Supabase migrations,
  verifies the exact remote migration version, and records expanded state.

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
the workflow deploy steps, pass identity through explicit environment values,
and preserve `set -euo pipefail` in every shell entrypoint. Production promotion
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
