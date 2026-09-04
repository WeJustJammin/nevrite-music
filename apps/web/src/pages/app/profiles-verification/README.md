# Profiles verification routes

## Contents

Authenticated collection, selected-record, and shared server-rendered shell
routes for the profile-ownership workbench.

## Ownership

This directory owns the protected Phase 2 Slice 05 Astro page boundary. The
shared shell derives identity, acting context, CSRF, and canonical claim data
on the server before it renders bounded React-island props.

## Extension rules

Keep authentication and disclosure decisions in the server context loader.
Collection and record routes may select view state through the URL but must not
treat that state as authorization or pass secrets and proof evidence to the
client.

## Conventions

Redirect unauthenticated requests through the approved sign-in target, render
degraded states without protected props, and use one canonical route shell so
responsive, accessibility, and focus behavior remain consistent.

## Related links

- `apps/web/src/server/profile-ownership-context.ts`
- `.memory/wiki/specs/fe/02-profiles-verification.md`
