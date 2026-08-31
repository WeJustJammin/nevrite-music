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

Production uses the same names in the protected `production` environment with distinct values, required reviewers, main-branch restrictions, and serialized deployment concurrency. Staging values must never be copied into production or vice versa.

The production workflow must remain disabled until the environment reports a required-reviewer rule and `can_admins_bypass: false`. The environment now has administrator bypass disabled and the sole custom deployment branch policy `{ name: "main", type: "branch" }`. The current private-repository plan still rejects required reviewers with HTTP 422, so the checked-in manual promotion guard fails closed until that final plan prerequisite is resolved.

The Cloudflare token is restricted to the WeJammin account with only Workers Scripts Edit and Cloudflare Pages Edit permissions. Create separate staging and production tokens; never reuse the interactive Wrangler OAuth credential in CI.

## Environment variables

Non-secret GitHub environment variables include `CLOUDFLARE_ACCOUNT_ID`, `STAGING_WEB_ORIGIN`, `STAGING_API_ORIGIN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_URL`. Browser-safe application values are also variables rather than secrets: `PUBLIC_APP_ORIGIN`, `PUBLIC_SUPABASE_URL`, and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Administrative keys and database passwords remain secrets. No third-party application-provider credential is authorized.

## Cost control

Workers Paid runs under DEC-103's soft $10/month operational budget. Cloudflare's enabled account-level `Billing Budget Alert` is set to exactly `$10` and delivers to the owner email. Both Worker environments retain a 50 ms per-invocation CPU cap; any expected increase above the budget requires a new owner decision before configuration changes.
