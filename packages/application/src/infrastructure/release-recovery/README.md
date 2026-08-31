# Release and recovery policy

## Contents

This directory evaluates immutable artifact promotion, forward-only migration
evidence, recovery readiness, maintenance notice, and availability evidence.

## Ownership

These functions only evaluate typed evidence. Workflow execution, deployment,
database recovery, approval, and provider operations remain outside this pure
application boundary.

## Extension

Add failing contract and policy tests first. Preserve same-artifact promotion,
protected production approval, forward-fix-only migrations, and fail-closed
protected writes whenever current recovery evidence is absent or insufficient.

## Conventions

Evidence is immutable, bounded, and disclosure-safe. Synthetic/local evidence
never represents an operational restore or enables protected writes.

## Related links

- `docs/runbooks/platform/release-recovery-gates.md`
- `packages/contracts/src/release-recovery.ts`
