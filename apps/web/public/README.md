# Public web assets

Static, viewer-safe assets served from the web origin.

## Contents

- `profile-portfolio-offline.js` registers and primes the public-profile cache.
- `profile-portfolio-sw.js` provides the scoped `/profiles/` offline navigation fallback.

## Ownership

Do not place secrets, private projections, or authenticated responses in this directory.

## Extension

Add only cache-safe, viewer-safe files with explicit scope and lifecycle tests.

## Conventions

Keep service workers narrowly scoped and version cache names when response semantics change.

## Related links

See [`../src/pages/profiles/`](../src/pages/profiles/) for the public route and
[`../src/styles/profile-portfolio.css`](../src/styles/profile-portfolio.css) for its readiness boundary.
