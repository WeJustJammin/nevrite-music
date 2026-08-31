# Sentry Removal and Free-Only Operations Propagation Record

**Date:** 2026-08-30  
**Source decision:** DEC-104  
**Scan:** `propagation-scan-2026-08-30.md`

## Applied

- Scheduled deletion of the `wejammin` Sentry organization, its `wejammin-application` project, and the activated Business trial.
- Removed repository variable `PUBLIC_SENTRY_DSN`, staging variables `SENTRY_ORG` and `SENTRY_PROJECT`, and staging secret `SENTRY_AUTH_TOKEN`.
- Removed all SDKs, CLI packages, tokens, DSNs, source-map/release uploads, workflow steps, environment placeholders, runtime wrappers, tests, and documentation from the implementation workspace.
- Superseded DEC-063 with DEC-104 and propagated the replacement contract through 122 active architecture, IA/BE/FE, phase-plan, stack-map, and project-instruction files.
- Replaced vendor-specific error capture with schema-validated structured logs, release/request correlation, Cloudflare Workers Observability, Supabase native logs, Playwright coverage, and a scheduled GitHub health check.
- Retained historical references only in decision and propagation audit records so the removal reason and authorization remain reviewable.

## Verification

- Active project/spec scan: zero case-insensitive whole-word `Sentry` references outside audit history.
- Runtime/config/workflow/dependency/lockfile scan: zero Sentry references.
- GitHub repository/staging settings: zero Sentry variables or secrets.
- `pnpm install --frozen-lockfile`: pass.
- `pnpm validate`: pass; 23 tests, 100% statements/branches/functions/lines, 2 Playwright tests, all builds green.
- `node .memory/pipeline/compile.mjs`: pass; 1,605 nodes and 9,942 edges refreshed.
- `node .memory/pipeline/lint.mjs`: pass with zero errors; 51 `ORPHAN_SPEC` warnings remain for disconnected working/audit/index documents, including this propagation record.

## Cost boundary

No monitoring replacement is authorized. New services default to genuinely free operation. A trial, payment method, subscription, usage billing, or paid add-on requires a separate owner approval naming the service, recurring price, usage price, and ceiling. The owner reconfirmed DEC-103 Workers Paid as the sole paid-service exception after the setup billing audit.

## Infrastructure-tier reconciliation

DEC-104 also reconciles the selected Supabase architecture to the owner's free-tier posture. Supabase Free remains the PostgreSQL/Auth/Storage/Realtime provider, but no PITR, uptime SLA, paid upgrade, overage, or paid add-on is assumed. Recovery evidence is synthetic/local only until production-verified recovery evidence is separately demonstrated; protected money, rights, and publication writes remain closed without it. Cloudflare Workers Paid remains the sole paid-service exception under a soft `$10/month` ceiling.

The implementation pass propagated that boundary through every runtime instruction surface, the engineering standards, inherited IA/BE recovery clauses, and the operations runbook index. It also removed unused Resend and Stripe setup bindings from `.env.example`, `.github/SECRETS.md`, and the strict server-environment schema. Those providers remain unconfigured and absent from the production registry; introducing either now fails strict environment parsing and requires a new owner cost decision.
