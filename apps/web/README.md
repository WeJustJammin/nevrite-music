# Web

The WeJammin public web surface uses Astro hybrid rendering with React islands.
Run workspace commands from the repository root:

```sh
pnpm dev:web
pnpm --filter @wejammin/web type-check
pnpm --filter @wejammin/web build
pnpm test:e2e
```

## Staging boundary

The current Cloudflare Pages promotion deploys `dist/client` only. The generated
Astro server artifact is not promoted. Changing that hosting topology requires
an explicit infrastructure change and re-verification.
