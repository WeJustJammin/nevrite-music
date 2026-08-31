# Cross-surface verification

Cross-package contract, integration, E2E, accessibility, performance, and security checks live here. Tests assert externally observable contracts and never bypass production boundaries through private hooks or secret data.

## Contents

This directory contains cross-surface Vitest checks and the Playwright E2E
scaffold. Package-local behavior tests remain beside their implementation.

## Ownership

These tests own workspace-level contracts, validation policy, and public
boundary assertions. They do not own implementation helpers or production
credentials.

## Extension

Add a test file named for one boundary, use deterministic fixtures, and assert
observable behavior or a concrete file contract. Add a corresponding script or
fixture only when the acceptance criterion requires it.

## Conventions

Use Vitest for unit/integration contract checks and Playwright for browser
flows. Keep tests independent, reject shallow truthy assertions, and never
contact paid or production providers during local validation.

## Related links

- [Local bootstrap](../docs/local-bootstrap.md)
- [Runtime contracts](../packages/contracts/README.md)
- [E2E scaffold](e2e/scaffold.spec.ts)
