# Infrastructure application modules

## Contents

This directory contains pure application policies for cross-cutting
infrastructure flows. The `security-*` modules own read and protected-command
decisions; `security.ts` is their stable public barrel.

## Ownership

`security-reads.ts` owns read decisions, `security-types.ts` owns ports and
results, `security-support.ts` owns safe normalization, and
`security-execution.ts` owns command orchestration.

## Extension

Add one focused policy module below 300 lines, expose typed ports rather than
concrete adapters, and re-export the supported surface from a small barrel.

## Conventions

Server facts are authoritative. Request material never supplies identity,
authority, risk, clock, version, hash, or idempotency state. Denials use
scrubbed evidence and commits remain one atomic port operation.

## Related links

See the [architecture design](../../../.memory/wiki/specs/2026-08-02-architecture-design.md),
[backend contract](../../../.memory/wiki/specs/be/00-infrastructure.md), and
[application guide](../../README.md).
