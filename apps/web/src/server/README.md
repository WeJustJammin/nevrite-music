# Web server boundaries

This directory contains server-only Astro composition for authentication,
authorization, and private Worker service bindings. Modules validate every
untrusted value and return disclosure-safe responses; they never become a
second domain-policy or persistence layer.

## Contents

- `infrastructure-context.ts` — verified route context and fail-closed shell
  projection.
- `infrastructure-surface-projection.ts` — capability-gated safe props for
  upload and read-only evidence islands.
- `job-status-boundary.ts` — same-origin JobStatus response policy.
- `job-status-platform-api.ts` — opaque Bearer forwarding through the private
  `PLATFORM_API` Worker binding.

## Ownership

This directory owns server request composition only. The API Worker verifies
Supabase sessions, resolves current authority, and applies domain policy. The
browser library owns no credentials, and shared contracts own every wire
shape. Tokens remain inside request-scoped closures and must never enter HTML,
logs, error envelopes, or client props.

## Extension

Add a focused module for each server boundary and construct its ports through
an identity-tracked factory. New cookie formats require a locked authentication
contract before implementation. Unknown credentials, missing bindings, invalid
upstream bodies, and unsupported provider state fail closed.

## Conventions

Use strict TypeScript, bounded response reads, `Cache-Control: no-store`, and
allowlisted forwarded headers. Treat Cloudflare service bindings as private
transports, not authority sources. Add integration tests for success,
conditional reads, authentication failure, disclosure collapse, and dependency
failure.

## Related links

- [Web surface](../../README.md)
- [Browser-safe library](../lib/README.md)
- [Shared contracts](../../../../packages/contracts/README.md)
- [Infrastructure specification](../../../../.memory/wiki/specs/2026-08-02-architecture-design.md)
