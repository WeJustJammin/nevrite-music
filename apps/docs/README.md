# WeJammin documentation surface

This is the project-owned documentation surface. It is an Astro site used to
publish operational and developer guidance; product behavior remains in the web
and Worker applications.

## Contents

- `src/pages/` contains server-rendered documentation routes.
- `public/` contains documentation-only static assets.
- `astro.config.mjs` and `tsconfig.json` define the docs build.
- The [local bootstrap guide](../../docs/local-bootstrap.md) is the required
  starting point for a new checkout.

## Ownership

The docs surface owns rendered documentation pages and their navigation. The
root `docs/` directory owns source runbooks and architecture records. It does
not own API handlers, domain rules, secrets, or deployment credentials.

## Extension

Add a route as a focused `.astro` file under `src/pages/`. Keep generated
output in `dist/`; never edit generated files. Add shared interactive behavior
only as a bounded React island at a documented interaction seam.

## Conventions

Use server-rendered semantic HTML first, project UI tokens from
`@wejammin/ui`, accessible headings and links, and strict TypeScript. Run
`pnpm --filter @wejammin/docs type-check` and `pnpm --filter @wejammin/docs build`
after changing this surface. Cloudflare Workers Paid is the sole paid
exception; hosted actions remain outside local docs bootstrap.

## Related links

- [Local bootstrap](../../docs/local-bootstrap.md)
- [Web surface](../web/README.md)
- [Shared UI](../../packages/ui/README.md)
