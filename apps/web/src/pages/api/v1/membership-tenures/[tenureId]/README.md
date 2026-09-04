# Membership tenure mutation routes

## Contents

Acceptance, ending, and capacity-period Astro proxy endpoints.

## Ownership

The web API boundary owns same-origin forwarding only; the Worker remains authoritative.

## Extension rules

Add a route only when a locked BE contract and Worker operation already exist.

## Conventions

Forward cookies and concurrency headers without interpreting authority client-side.

## Related links

- `apps/web/src/server/identity-authority-platform-api.ts`
