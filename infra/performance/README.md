# Performance smoke

`api-p95-smoke.mjs` owns the Phase 1 pull-request API timing gate. It runs one
virtual user through 20 sequential requests with zero application retries,
using the fixed health response fixture. Local mode imports the immutable
Wrangler bundle at `apps/worker/dist/index.js`; staging mode targets an
explicit HTTPS origin and rejects redirects.

## Commands

After the production Worker build:

```sh
node infra/performance/api-p95-smoke.mjs --mode local
```

Against protected staging:

```sh
node infra/performance/api-p95-smoke.mjs --mode staging --origin "$STAGING_API_ORIGIN"
```

Both commands emit exactly one JSON evidence line. The summary fields are
`samples`, `errors`, `p50Ms`, `p95Ms`, `p99Ms`, `passed`, and
`thresholdFailures`; local mode also records the artifact path and SHA-256.
The Phase 1 Tier 0 p95 threshold is 500 ms. The representative-data k6 and
pgbench profile remains a separate deferred gate until the first data-bearing
release.
