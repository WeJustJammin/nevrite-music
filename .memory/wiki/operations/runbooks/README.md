# WeJammin Operational Runbook Contract

This directory is the canonical operational-response index. `/setup-workspace` must populate every required runbook with environment-specific commands, owners, access prerequisites, stop conditions, rollback or compensation steps, evidence capture, communication templates, and drill cadence. `/verify-infrastructure` must exercise each applicable procedure before production data or money is enabled.

| Required runbook | Scope | Production gate |
|---|---|---|
| `public-outage.md` | CDN, Astro, Hono, DNS/TLS, maintenance and rollback | synthetic failure and artifact rollback drill |
| `auth-provider.md` | Supabase Auth and additive OAuth provider outage/recovery | login/link/recovery fail-closed verification |
| `database-recovery.md` | Free-tier synthetic/local restore, integrity checks, RLS/RPC validation | diagnostic restore evidence only; no production PITR/RPO/RTO claim and protected writes remain closed |
| `queue-outbox.md` | dispatcher lag, Queue outage, dead letter, replay | idempotent replay and current-state revalidation drill |
| `payment-reconciliation.md` | Stripe Checkout/webhook ambiguity, refunds, disputes | sandbox reconciliation and no-double-effect proof |
| `cms-publication.md` | publish convergence, cache purge, rollback, takedown | last-known-good and fail-closed removal drill |
| `platform-configuration.md` | typed settings registry, effective values, review/activation/rollback, and secret boundary | settings authorization, RLS, replay, rollback, and no-secret drill |
| `content-schema-registry.md` | content types, schema activation/migration, signed block registry, protected reads, and recovery | tenant isolation, signature/nonce, migration resume, outbox, and disclosure drill |
| `security-privacy-incident.md` | exposure containment, evidence, notification decision | tabletop plus contact/access validation |
| `secret-rotation.md` | provider, application, signing, and database credentials | non-production rotation without secret disclosure |
| `migration-failure.md` | expand/backfill/switch/contract failure and compensation | representative upgrade and compensation drill |
| `quota-cost.md` | provider quota, spend, admission freeze, degradation | 80/90% alert and freeze-path verification |

`auth-provider.md` now documents the Slice 02 containment and reconciliation procedure. It remains unverified operational guidance until `/verify-infrastructure` records a successful drill; dependent provider enablement stays closed.

`platform-configuration.md` documents the Slice 07 settings/runtime containment and reconciliation procedure. It remains unverified operational guidance until `/verify-infrastructure` records a successful drill; dependent configuration activation stays closed.

`content-schema-registry.md` documents the Slice 09 registry, migration, and
signed-release containment and reconciliation procedure. It remains unverified
operational guidance until `/verify-infrastructure` records a successful drill;
dependent activation and release registration stay closed.

Until setup supplies and verifies a file, its dependent production capability remains disabled. This index is a specification contract, not evidence that any drill has already passed.
# Identity authority

- [Identity authority, alias, and acting-context runbook](identity-authority.md)
- [Shadow-party, invitation, and claim-proof runbook](profile-ownership.md)
- [Public profile and credit-backed portfolio runbook](profile-portfolio.md)
