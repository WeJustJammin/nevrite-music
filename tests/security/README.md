# Security tests

## Contents

Adversarial authority, projection, retry, secret, and abuse-boundary tests.

## Ownership

Security tests own negative-path proof; production modules own enforcement.

## Extension

Add a focused threat case with explicit denied effects, scrubbed telemetry, and
zero unauthorized commits.

## Conventions

Use forged input and server-side fakes. Never place real credentials, provider
payloads, or private data in fixtures.

## Related links

See [`../../.agents/rules/security-first.md`](../../.agents/rules/security-first.md)
and [`../README.md`](../README.md).
