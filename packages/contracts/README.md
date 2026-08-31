# Runtime contracts

This package is the Zod authority for API, event, error, environment, registry, CMS, setting, and provider contracts. Worker, web, tests, and generators import these schemas directly. Persistence clients, UI behavior, and provider SDK behavior are prohibited here.

## Contents

The package exports runtime-validated Zod contracts and their inferred types.
Tests stay beside the contract source so generated consumers can share one
authority.

## Ownership

Contracts owns boundary schemas, error envelopes, identifiers, and OpenAPI
metadata. It does not own persistence queries, UI state, or provider SDK
payload handling.

## Extension

Add one focused contract module for a new boundary, export it from the package
entry point, and add valid, invalid, and adversarial cases beside it. Import
the schema from Worker, web, tests, and generators instead of copying types.

## Conventions

Use Zod 4, strict inferred types, bounded strings and enums, explicit unknown
handling, and stable error codes. Keep schema files below the project limit and
never include secrets or provider credentials in a contract.

## Related links

- [Typed configuration](../config/README.md)
- [Worker transport](../../apps/worker/README.md)
- [Data access](../data-access/README.md)
