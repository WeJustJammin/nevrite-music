# CI/CD environment configuration

The CI workflow requires no application or provider secrets. It runs only trusted repository code on the `wejammin` self-hosted runner label with read-only repository permissions.

Provider credentials belong in protected GitHub environments, never repository-level plaintext, workflow arguments, artifacts, or logs. Configure the following names when their owning setup shard reaches the provider gate.

## Staging environment secrets

| Name                        | Owner   | Purpose                                                                    |
| --------------------------- | ------- | -------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`     | Hosting | Select the WeJammin Cloudflare account.                                    |
| `CLOUDFLARE_API_TOKEN`      | Hosting | Deploy Workers/assets with least-privilege edit permissions.               |
| `SUPABASE_ACCESS_TOKEN`     | Data    | Manage the staging Supabase project through the CLI.                       |
| `SUPABASE_DB_PASSWORD`      | Data    | Apply and verify staging database migrations.                              |
| `SUPABASE_PROJECT_ID`       | Data    | Bind commands to the approved staging project.                             |
| `SUPABASE_SERVICE_ROLE_KEY` | Data    | Server-only administrative operations; never exposed to Astro client code. |
| `SENTRY_AUTH_TOKEN`         | Hosting | Upload release and source-map metadata.                                    |
| `RESEND_API_KEY`            | Hosting | Send staging transactional email.                                          |
| `STRIPE_SECRET_KEY`         | Hosting | Exercise counsel-approved Stripe-hosted staging flows.                     |
| `STRIPE_WEBHOOK_SECRET`     | Hosting | Verify staging Stripe webhook signatures.                                  |

## Production environment secrets

Production uses the same names in the protected `production` environment with distinct values, required reviewers, main-branch restrictions, and serialized deployment concurrency. Staging values must never be copied into production or vice versa.

## Environment variables

Browser-safe values are environment variables rather than secrets: `PUBLIC_APP_ORIGIN`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `PUBLIC_SENTRY_DSN`. Server-only values remain secrets even when an upstream provider describes them as identifiers.
