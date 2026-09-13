# CI/CD environment configuration

The CI workflow requires no application or provider secrets. It runs only trusted repository code on the `wejammin` self-hosted runner label with read-only repository permissions.

Only the credentials listed below are authorized. They belong in protected GitHub environments, never repository-level plaintext, workflow arguments, artifacts, or logs. Adding any provider secret requires a new owner approval that names the service and exact cost.

## Staging environment secrets

| Name                    | Owner   | Purpose                                                               |
| ----------------------- | ------- | --------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Hosting | Deploy Workers/assets with least-privilege edit permissions.          |
| `SUPABASE_ACCESS_TOKEN` | Data    | Manage the staging Supabase project through the CLI.                  |
| `SUPABASE_DB_PASSWORD`  | Data    | Apply and verify staging database migrations.                         |
| `SUPABASE_SECRET_KEY`   | Data    | Rotatable server-only API access; never exposed to Astro client code. |

## Production environment secrets

Production uses the same names in the protected `production` environment with
distinct values, plus the production-only
`CLOUDFLARE_OBSERVABILITY_API_TOKEN` and the manual-only
`CLOUDFLARE_QUEUE_EXERCISE_TOKEN`. Configure the observability token for the
WeJammin account with Workers Observability Write and Account Analytics Read,
plus Zone Analytics Read for only the exact Email Sending zone; it must not have
Workers Scripts Edit. The scheduled S09 alert boundary uses it only to
read structured Workers Logs and Queue metrics. The manual AC211 collection
workflow uses the same read-only scopes to assemble bounded aggregate evidence;
the protected AC209 exercise also uses its Analytics Read scope for the bounded
Email Sending delivery query. Because Email Sending analytics is a zone-level
GraphQL dataset, both the Zone Analytics Read permission and the token's Zone
Resources must name the exact Email Sending zone. The automated preflight proves
access to that configured zone; confirm the token's exclusion of every other
zone in its Cloudflare resource policy. It never retains raw provider responses.
The queue-exercise token must be
restricted to the WeJammin account with Workers Queues Write and no deployment,
zone-management, Email Sending management, or billing permission. It exists
only for the serialized, reviewer-approved AC209 workflow, which preflights
empty exact queues and can purge only the correlated peek ref.
The deployment token and interactive Wrangler OAuth credential must never be
substituted for it. Required reviewers,
main-branch restrictions, and serialized deployment concurrency remain in
force. Staging values must never be copied into production or vice versa.
The protected production workflow exercises both provider APIs with
`infra/verify-cloudflare-observability.ts` before migrations or deployment and
fails with a secret-safe permission error when either scope is unavailable.

The production environment reports required-reviewer rule `64231612` for the
business account `WeJustJammin` (reviewer ID `305953066`),
`prevent_self_review: false`,
`can_admins_bypass: false`, and the sole custom deployment branch policy
`{ name: "main", type: "branch" }`. This single-business-account repository
keeps production `workflow_dispatch`/manual-only while allowing the dispatching
owner to provide the explicit protected-environment approval. Administrator
bypass remains disabled.

## Repository security controls

Before changing `WeJustJammin/nevrite-music` from PRIVATE to PUBLIC, a
full-history safety audit scanned 309 commits, 17,443 objects, and 12,175 text
blobs and found no committed production credentials, private keys, or provider
tokens. Secret scanning, push protection, vulnerability alerts, and automated
security fixes are enabled. Environment secrets remain protected and must never
be placed in repository contents, workflow arguments, artifacts, or logs.

The Cloudflare deployment token is restricted to the WeJammin account with Cloudflare
Pages Edit and Workers Scripts Edit, plus zone-scoped Workers Routes Edit for
the production custom-domain binding. Create separate staging and production
tokens; never reuse the interactive Wrangler OAuth credential in CI.

## Environment variables

Non-secret GitHub environment variables include `CLOUDFLARE_ACCOUNT_ID`, `STAGING_WEB_ORIGIN`, `STAGING_API_ORIGIN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_URL`. Production also records `PRODUCTION_API_ORIGIN` for the post-deploy health gate, `PRODUCTION_ALERT_EMAIL_SHA256` and `PRODUCTION_ALERT_SENDER_SHA256` for redacted AC209 address verification, `CLOUDFLARE_EMAIL_ZONE_ID` for the exact Email Sending analytics zone, `CLOUDFLARE_PLATFORM_QUEUE_ID` for the exact production queue and AC211 Queue Analytics query, and `STAGING_SUPABASE_PROJECT_REF` so promotion can independently match staging migration evidence to the configured staging project. Browser-safe application values are variables rather than secrets: `PUBLIC_APP_ORIGIN`, `PUBLIC_SUPABASE_URL`, and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Administrative keys and database passwords remain secrets. No third-party application-provider credential is authorized.

## Cost control

Workers Paid runs under DEC-103's soft $10/month operational budget. Cloudflare's enabled account-level `Billing Budget Alert` is set to exactly `$10` and delivers to the owner email. Both Worker environments retain a 50 ms per-invocation CPU cap; any expected increase above the budget requires a new owner decision before configuration changes.
