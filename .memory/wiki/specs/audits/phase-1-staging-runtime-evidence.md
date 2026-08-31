# Phase 1 Staging Runtime Evidence

**Captured**: 2026-08-31T01:52:13-04:00

**Candidate**: `1bb432358cc44f992ce3d15597d298cce86d0a72`

**Staging workflow**: GitHub Actions run `33359752069`, job `99388688223`

**Remediation closure**: 2026-08-31T14:58:46-04:00

**Current candidate**: `c2880f34a3127235b859d69e89dc8129d0746d6d`

**Current staging workflow**: GitHub Actions run `33425837272`, attempt 2

This capture preserves the external evidence that opened validation findings
VAL-P1-002 and VAL-P1-007 through VAL-P1-011. It contains no credentials or
secret values. The initial observations precede deployment of the remediation
and prove the failure state; the appended closure section records the later
successful deployment and current readiness probes.

## Immutable staging run

`gh run view 33359752069 --log` confirmed that the web artifact uploaded as
`wejammin-web-staging` and received the temporary Worker origin
`https://wejammin-web-staging.wejammin.workers.dev`. The custom-domain update
then failed with Cloudflare code `100117`:

```text
Hostname 'staging.wejamm.in' already has externally managed DNS records
(A, CNAME, etc). Delete them first or try a different hostname. [code: 100117]
```

The failed job still uploaded deployment evidence as artifact
`staging-deployment-1bb432358cc44f992ce3d15597d298cce86d0a72`, artifact ID
`9746300548`.

## Pages ownership

A read-only Cloudflare API request to the staging Pages project domain endpoint
returned HTTP 200 with the following sanitized result:

```json
{
  "success": true,
  "domains": [{ "name": "staging.wejamm.in", "status": "active" }]
}
```

The request targeted only
`/accounts/{account-id}/pages/projects/wejammin-web-staging/domains`; it made no
mutation.

## Public routing comparison

Fresh redirect-disabled probes produced:

| Target                                                                 | Result                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `https://staging.wejamm.in/app/infrastructure`                         | HTTP 200, no `Location`; stale Pages shell title `WeJammin \| Operational foundation`     |
| `https://wejammin-web-staging.wejammin.workers.dev/app/infrastructure` | HTTP 303 to `/auth/sign-in?returnTo=%2Fapp%2Finfrastructure`; current SSR Worker contract |
| `https://wejammin-api-staging.wejammin.workers.dev/health`             | HTTP 500, Cloudflare `Worker threw exception` page                                        |

## API live tail

The read-only command
`wrangler tail wejammin-api-staging --format pretty` connected successfully. A
fresh request to `/health?tail_probe=20260831` produced an exception event and:

```text
EnvironmentConfigurationError: Invalid server environment configuration
(SUPABASE_SECRET_KEY: value is required and has the wrong type;
SUPABASE_URL: value is required and has the wrong type;
<root>: unknown configuration key)
```

This matches the deployed workflow state: the Supabase bindings were not passed,
and the Cloudflare Queue resource binding reached the strict server-environment
parser before projection.

## Queue inventory boundary

A read-only `wrangler queues list` after the failed staging run showed only
`platform-jobs` and `platform-jobs-dlq`, both created during that run. No
environment-isolated staging pair existed yet. The local remediation declares
`platform-jobs-staging` and `platform-jobs-staging-dlq`, and the application
admission path selects the staging name explicitly.

Current Wrangler automatic provisioning supports Queues and is enabled by
default, so the next approved staging deploy is expected to create the isolated
pair. The exact run must still verify creation and binding before VAL-P1-011 can
be closed. See
<https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning>.

## Remediation closure

The owner approved both staging-only cleanup and PR #4 merge. The Pages custom
domain attachment `9a518c78-50fe-4a86-913d-363c7fb6a47e` was deleted from
project `wejammin-web-staging`; its follow-up API lookup returned HTTP 404. The
single proxied CNAME `staging.wejamm.in -> wejammin-web-staging.pages.dev` was
then deleted, and the dashboard reported zero remaining exact-name records.
No production domain, Pages project, Worker, or DNS record was changed.

PR #4 merged as `c2880f34a3127235b859d69e89dc8129d0746d6d` after exact PR CI
run `33421209928` passed. Main CI run `33425577715` then passed quality,
database, clean immutable build, and artifact upload for that merge revision.

Staging run `33425837272` attempt 2 completed successfully for the same
revision:

- `wejammin-web-staging` deployed and attached custom domain
  `staging.wejamm.in` through Worker custom-domain record
  `e8b962dd57634f7060ec1b03dff03accd785c07f`;
- `wejammin-api-staging` deployed with the required Supabase configuration and
  the `PLATFORM_JOBS` Queue binding;
- Queue `platform-jobs-staging`
  (`3ee669d551df4b43a94b46a32b09ff8f`) has one producer and one consumer;
- DLQ `platform-jobs-staging-dlq`
  (`582acab261fc4db2b59e11fbbedb346f`) exists as the consumer's failure-routing
  target; and
- workflow and independent local smoke verification both returned
  `apiStatus: 200`, `webStatus: 200`, and the expected protected-route
  `webRuntimeStatus: 303`.

The staging deployment blocker is closed. Readiness probing after closure found
two separate security failures: cleartext HTTP returns 200 rather than an HTTPS
redirect, and the HTTPS web/API responses omit the architecture-required CSP,
HSTS, MIME-sniffing, frame, referrer, and permissions headers. Those observations
are recorded as current readiness findings in `phase-1-validation.md`; they do
not reopen the deployment/smoke gate.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]
