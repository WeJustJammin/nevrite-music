# Upload-admission UI

## Contents

This directory owns the bounded upload-admission form, validation, transfer
state, and accessible feedback shown inside the infrastructure workbench.

## Ownership

The island owns local file and draft state only. Server identity, capability,
target policy, object state, checksums, and signed admission remain canonical
server concerns. A signed URL is held only for the active transfer and is never
serialized into storage, history, analytics, or logs.

## Extension

Add fields from a locked contract, write the failing interaction and
accessibility tests first, preserve focus and draft recovery, and keep all
production provider/storage activation outside this presentation boundary.

## Conventions

Accept only server-derived capability projections, keep signed transfer data
ephemeral, and announce validation or transfer state without stealing focus.

## Related links

- `docs/runbooks/platform/upload-admission-reconciliation.md`
- `packages/contracts/src/upload-admission.ts`
