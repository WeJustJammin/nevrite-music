# Upload storage boundary

## Contents

- `upload-intent-storage.ts` — signed-intent orchestration boundary.
- `storage-support.ts` — injected adapter and compensation helpers.
- `storage-validation.ts` — configuration and request validation.
- `storage-types.ts` — local dependency types.
- `*.test.ts` — signing, cleanup, configuration, and timeout evidence.

## Ownership

This directory owns the upload-intent storage seam: server-generated object
keys, bounded local signing, production adapter validation, and direct-upload
inactivity enforcement.

## Extension

Keep provider credentials behind the injected storage adapter. Signed
credentials are never logged, and failed persistence must revoke a credential
when the adapter supports compensation. Keep transfer limits and deadline
behavior in focused modules; add a failing boundary test for each new refusal
or cleanup path.

## Conventions

- Validate production adapters before accepting a request.
- Enforce byte ceilings while streaming, not after buffering.
- Revoke or expire credentials after failed canonical persistence.
- Reset the inactivity clock only when bytes arrive.

## Related links

- `packages/application/src/infrastructure/upload-admission/`
- `packages/contracts/src/upload-intent/`
- `apps/worker/src/upload-completion/`
