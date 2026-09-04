# Party claim command facades

## Contents

Challenge creation, proof submission, and accepted-claim conversion facades.

## Ownership

This directory owns the same-origin Astro facades for one claim's challenge,
proof, and conversion commands. Each route delegates to the shared
profile-ownership platform proxy and never embeds Worker credentials or
authorizes from browser-supplied identity.

## Extension rules

Keep claim identifiers in the path, validate command bodies through the shared
contracts, preserve CSRF/idempotency headers, and return the upstream typed
status, body, and safe response headers. Add deferred claim operations only in
their owning implementation slice.

## Conventions

Use the shared facade transport, forward no cookies on account-free flows, and
keep opaque proof material out of paths, query strings, logs, and redirects.

## Related links

- `apps/web/src/server/profile-ownership-platform-api.ts`
- `.memory/wiki/specs/be/02a-shadow-claim-ownership.md`
