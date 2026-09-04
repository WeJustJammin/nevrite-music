# Authentication contracts

## Contents

This module defines authentication primitives, strict request and resource schemas, provider metadata, and the authoritative AUTH-API-01 through AUTH-API-15 policy registry.

## Ownership

The Identity domain owns the contract vocabulary. Worker, web, OpenAPI, tests, and future clients consume the same runtime schemas.

## Extension rules

Change a contract only through the originating specification workflow. Keep objects strict, enums closed, return paths first-party, times UTC, and provider launch state honest.

## Conventions

Schemas use Zod 4 and stable validation codes. Browser input never supplies authority identifiers or session claims, and success resources exclude tokens and provider secrets.

## Related links

See `apps/worker/src/authentication/`, `apps/web/src/pages/auth/`, and `docs/openapi/openapi.json`.
