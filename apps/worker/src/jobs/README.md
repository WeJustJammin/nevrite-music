# Worker jobs

## Contents

This directory contains the pure Worker boundary for read-only job status
requests. The registrar delegates principal parsing, authorization,
deadline/rate orchestration, responses, and the process-local test fallback
limiter to focused modules. No module here talks to a database, queue,
provider, or paid observability service.

## Ownership

The Worker owns HTTP validation, safe envelopes, request IDs, authorization
decisions, rate/deadline policy, and response headers. Persistence, RLS,
session verification, and audit adapters are injected ports owned by their
respective infrastructure boundaries.

## Extension

To add another job endpoint, create a focused `job-<resource>.ts` registrar,
keep request parsing before principal resolution, inject all data and side
effect ports through a typed dependency object, and register the route from
the Worker entrypoint. Add tests beside the endpoint with one acceptance
marker per owned criterion. Keep utilities at or below 300 lines and tests at
or below 400 lines.

## Conventions

Use strict Zod contracts from [`packages/contracts/src`](../../../../packages/contracts/src/README.md),
safe `ApiError` responses and `no-store` for authenticated data. Keep provider
and persistence adapters outside this boundary. Do not trust caller headers as
authority or perform mutation/idempotency work in a read route.

## Related links

See the [Worker source guide](../README.md), the [application infrastructure
boundary](../../../../packages/application/src/README.md), and the
[infrastructure backend specification](../../../../.memory/wiki/specs/be/00-infrastructure.md).
