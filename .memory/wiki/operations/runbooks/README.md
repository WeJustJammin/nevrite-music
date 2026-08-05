# WeJammin Operational Runbook Contract

This directory is the canonical operational-response index. `/setup-workspace` must populate every required runbook with environment-specific commands, owners, access prerequisites, stop conditions, rollback or compensation steps, evidence capture, communication templates, and drill cadence. `/verify-infrastructure` must exercise each applicable procedure before production data or money is enabled.

| Required runbook | Scope | Production gate |
|---|---|---|
| `public-outage.md` | CDN, Astro, Hono, DNS/TLS, maintenance and rollback | synthetic failure and artifact rollback drill |
| `auth-provider.md` | Supabase Auth and additive OAuth provider outage/recovery | login/link/recovery fail-closed verification |
| `database-recovery.md` | seven-day PITR, restore, integrity checks, RLS/RPC validation | full restore proving `≤2 minute` RPO capability and measured `≤4 hour` RTO |
| `queue-outbox.md` | dispatcher lag, Queue outage, dead letter, replay | idempotent replay and current-state revalidation drill |
| `payment-reconciliation.md` | Stripe Checkout/webhook ambiguity, refunds, disputes | sandbox reconciliation and no-double-effect proof |
| `cms-publication.md` | publish convergence, cache purge, rollback, takedown | last-known-good and fail-closed removal drill |
| `security-privacy-incident.md` | exposure containment, evidence, notification decision | tabletop plus contact/access validation |
| `secret-rotation.md` | provider, application, signing, and database credentials | non-production rotation without secret disclosure |
| `migration-failure.md` | expand/backfill/switch/contract failure and compensation | representative upgrade and compensation drill |
| `quota-cost.md` | provider quota, spend, admission freeze, degradation | 80/90% alert and freeze-path verification |

Until setup supplies and verifies a file, its dependent production capability remains disabled. This index is a specification contract, not evidence that any drill has already passed.
