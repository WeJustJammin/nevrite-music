# Upload completion Worker boundary

## Contents

- `upload-intent-completion.ts` — request orchestration and route boundary.
- `upload-intent-completion-support.ts` — validated persistence and job helpers.
- `upload-intent-completion-response.ts` — HTTP response projection.
- `upload-intent-completion-types.ts` — local dependency and result types.
- `*.test.ts` — contract, configuration, production, and branch coverage.

## Ownership

This directory owns the Worker-side `POST /api/v1/upload-intents/{id}/complete`
boundary. Shared schemas belong in `packages/contracts`; provider-neutral state
transitions belong in `packages/application`.

## Extension

Extend the shared contract first, then add a failing boundary test before
changing orchestration. New persistence or queue behavior must remain injectable
for tests and must fail closed when a production dependency is absent.

## Conventions

- Validate path, headers, and body before invoking application behavior.
- Preserve request IDs, idempotency keys, and optimistic concurrency headers.
- Never introduce a production provider implicitly.
- Keep response construction separate from state mutation.

## Related links

- `packages/contracts/src/upload-completion.ts`
- `packages/application/src/infrastructure/upload-completion/`
- `docs/runbooks/platform/provider-webhook-reconciliation.md`
