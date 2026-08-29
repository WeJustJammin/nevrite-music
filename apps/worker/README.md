# WeJammin API Worker

Run locally from the repository root:

```sh
pnpm dev:worker
```

Deploy only through an explicit environment command:

```sh
pnpm --filter @wejammin/worker deploy:staging
pnpm --filter @wejammin/worker deploy:production
```

Production deployment requires the protected GitHub `production` environment. Never use a generic deploy command because Wrangler environments map to separate Cloudflare services.

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```sh
pnpm --filter @wejammin/worker cf-typegen
```
