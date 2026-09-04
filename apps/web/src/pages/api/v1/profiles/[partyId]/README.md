# Profile portfolio browser API routes

## Contents

Same-origin API facades for profile sections, emphasis, portfolio reads, reel
reads, and reel-item commands live here.

## Ownership

These routes own browser-to-platform forwarding only. The Worker owns policy,
canonical validation, persistence, transactions, and event production.

## Extension

Add a facade only for an active route contract and preserve method, path,
headers, credentials, response status, and request ID without interpretation.

## Conventions

Use the shared profile-portfolio forwarding boundary. Never expose platform
bindings, secrets, provider credentials, or deferred EPK endpoints.

## Related links

See [`../../../../../../server/profile-portfolio-api-route.ts`](../../../../../../server/profile-portfolio-api-route.ts)
for the forwarding boundary and
[`../../../../../../../worker/src/profile-portfolio/`](../../../../../../../worker/src/profile-portfolio/)
for the canonical runtime handlers.
