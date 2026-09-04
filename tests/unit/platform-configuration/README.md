# Platform configuration unit tests

## Contents

Focused defensive-branch tests for the platform-configuration Worker boundary,
runtime adapters, production composition, and telemetry.

## Ownership

These tests own isolated negative-path and coverage proof. Production modules
own request admission, authorization, persistence delegation, and telemetry.

## Extension

Add a focused regression for one observable boundary behavior. Keep fixtures
deterministic and each test file within the repository size cap.

## Conventions

Use server-owned contexts and dependency fakes. Preserve fail-closed behavior,
deadline propagation, disclosure-safe errors, and the global 100% threshold.

## Related links

See [`../../../apps/worker/src/platform-configuration/README.md`](../../../apps/worker/src/platform-configuration/README.md)
and [`../../README.md`](../../README.md).
