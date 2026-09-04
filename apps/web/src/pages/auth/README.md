# Authentication pages

## Contents

This directory contains the sign-in page, form-action boundary, and provider callback proxy used by the server-rendered Astro application.

## Ownership

The Identity domain owns authentication behavior; the web application owns accessible presentation and safe redirects.

## Extension rules

Use reviewed provider catalog entries, relative allowlisted return targets, server-side service bindings, and secure cookie forwarding. Never add a provider-specific shortcut outside the registry.

## Conventions

Pages are non-prerendered. Forms remain progressively enhanced, outcome messages use accessible live regions, and unavailable providers remain visible but disabled.

## Related links

See `apps/web/src/server/auth-platform-api.ts`, `apps/worker/src/authentication/`, and `packages/contracts/src/authentication/`.
