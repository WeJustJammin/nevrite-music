# Provider-effect application policy

## Contents

This directory owns provider-neutral intent planning, execution ordering, and
reconciliation. It commits durable local intent before any injected adapter is
called and retains ambiguous outcomes as pending or manual review.

## Ownership

Application policy owns state decisions and typed ports. Credentials, network
clients, webhook verification, database RPCs, and provider configuration remain
outside this directory. Phase 1 production provider registries are empty.

## Extension

Add an adapter only through an approved closed registry and a failing fake/local
test. Preserve intent-before-effect ordering, bounded deadlines, sanitized
evidence, canonical CAS, and the prohibition on blind resend after ambiguity.

## Conventions

- Keep planning, execution, and reconciliation in separate bounded modules.
- Persist the provider intent before invoking an adapter.
- Treat timeouts and unknown outcomes as pending, never as safe retries.
- Return only sanitized evidence across the application boundary.

## Related links

- `packages/contracts/src/provider-operation/`
- `apps/worker/src/provider-effects/`
- `apps/worker/src/webhooks/`
