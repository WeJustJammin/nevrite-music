# GitHub Actions workflows

## Contents

- `ci.yml` — immutable validation and build-artifact production.
- `deploy-staging.yml` — successful-main-CI promotion to staging and public
  verification.
- `deploy-production.yml` — protected promotion of the staging-verified artifact.

## Ownership

This directory owns workflow orchestration. Reusable workspace setup belongs in
`.github/actions`; validation and promotion logic belongs in versioned scripts
under `infra` when it would make a workflow exceed the config limit.

## Extension

Extend the existing CI-to-staging-to-production chain. New deployment paths must
consume the same immutable artifacts and must not add a manual bypass.

## Conventions

- Pin third-party actions by full commit digest.
- Grant minimum workflow permissions.
- Scope deployment secrets to the final deploy steps.
- Make promotion evidence before production deployment and after its source gate.
- Keep every workflow configuration at or below 100 lines.

## Related links

- `../actions/setup/action.yml`
- `../../infra/verify-release-promotion.ts`
- `../../docs/runbooks/platform/release-recovery-gates.md`
