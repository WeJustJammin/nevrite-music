# Typed configuration

`src/environment.schema.ts` owns the closed Zod contracts for server settings
and browser-safe public values. `src/environment.ts` exposes the parsing
boundaries and explicit server/browser projections.

Server runtime entrypoints call `projectServerEnvironment` when Cloudflare
passes configuration alongside Queue or other platform bindings. It retains
only the approved server keys before strict parsing; a missing required key
throws `EnvironmentConfigurationError`. Browser entrypoints call
`projectBrowserEnvironment` when sourcing a combined deployment environment.
It retains only `PUBLIC_APP_ORIGIN`,
`PUBLIC_SUPABASE_URL`, and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`; provider,
database, deployment, and other unknown values cannot be serialized.

## Contents

This package contains typed environment and runtime configuration boundaries.
Examples describe local inputs; secret values are supplied by the runtime.

## Ownership

Configuration owns parsing, allowlists, and safe environment projections. It
does not own provider authentication, application policy, or browser secrets.

## Extension

Add a schema-backed setting with a focused invalid-input test, export it from
the package entry point, and document whether it is server-only or browser
safe. Keep provider-specific bindings behind the integration boundary.

## Conventions

Use strict TypeScript, bounded strings and enums, explicit defaults, and clear
startup failures for missing server bindings. Never commit real credentials or
serialize server-only values into client output.

## Related links

- [Runtime contracts](../contracts/README.md)
- [Worker boundary](../../apps/worker/README.md)
- [Local bootstrap](../../docs/local-bootstrap.md)
