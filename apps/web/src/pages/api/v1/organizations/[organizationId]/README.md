# Organization relationship routes

## Contents

Organization detail, type-assignment, invitation, assertion, and membership proxies.

## Ownership

The web API boundary owns same-origin forwarding only; the Worker remains authoritative.

## Extension rules

Add a route only when a locked BE contract and Worker operation already exist.

## Conventions

Forward cookies and mutation headers without deriving actor or organization authority.

## Related links

- `apps/web/src/server/identity-authority-platform-api.ts`
