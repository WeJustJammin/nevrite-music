# Content schema registry worker

## Contents

Validated CMS registry contracts, lifecycle routes, release verification,
bounded dependency adapters, telemetry, and their Slice 09 acceptance tests.

## Ownership

This boundary owns request admission, caller-derived authority, release
evidence verification, dependency/error mapping, and scrubbed observability.
Database RPCs remain the transaction and audit authority.

## Module map

- `migration-worker.ts` is the compatibility export facade.
- `migration-worker-engine.ts` composes admission, lease, dry-run, backfill,
  and verification stages.
- `migration-worker-{admission,lease,dry-run,backfill,verification}.ts` own
  stage decisions; `migration-worker-batches.ts` owns bounded batch execution.
- `migration-worker-input-schemas.ts` is the stable facade over the focused
  job, activation-evidence, and queue schema modules.
- `migration-worker-plan-schemas.ts` is the stable facade over plan types,
  plan-record, batch, and plan-record output modules; `schema-core.ts` and
  `validation.ts` own shared parsing and validation.
- `migration-worker-results.ts` owns result and rollback mapping.
- `contracts.ts` remains the stable feature seam; `contracts-schema-exports.ts`
  owns runtime schema re-exports and `contracts-type-aliases.ts` owns parsed
  worker aliases.
- `migration-worker-runtime.ts` owns validated dependencies and durable
  dead-letter persistence.

## Extension rules

Keep secrets and private evidence server-side. Add operations through strict
contracts and named RPC adapters; preserve fail-closed defaults and bounded
request, response, and dependency behavior.

## Conventions

Use the existing `ContentSchemaRegistry` naming and keep security branches and
contract changes covered by colocated tests.

## Related links

- `.memory/wiki/specs/be/03a-content-schema-registry.md`
- `.memory/wiki/operations/runbooks/content-schema-registry.md`
