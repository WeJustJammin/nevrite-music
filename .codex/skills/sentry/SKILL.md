---
name: sentry
description: Integrate privacy-safe Sentry error monitoring and sampled tracing for WeJammin's Astro browser application and Cloudflare Workers.
version: 1.0.0
---

# Sentry Monitoring

Use the canonical bundled guidance at `.codex/skill-library/stack/monitoring/sentry/SKILL.md` for Astro integration, error boundaries, tracing, releases, source maps, alerts, filtering, and privacy controls.

## WeJammin Constraints

- Use the `$0` Developer plan initially; do not enable pay-as-you-go or purchase a plan before explicit setup-stage approval.
- Instrument browser, Astro, and Cloudflare Worker release boundaries; use provider-native telemetry for Cloudflare and Supabase internals.
- Set immutable release and environment tags and upload private source maps from protected CI.
- Keep unexpected error capture high; sample traces and filter expected/high-volume failures to preserve quota.
- Set `sendDefaultPii: false` and scrub events, breadcrumbs, URLs, headers, request bodies, and user context before export.
- Never send secrets, auth/session tokens, payment data, evidence, private media/content, legal material, or unrestricted identifiers.
- Disable Session Replay at launch. Any later enablement requires a privacy review, masking verification, consent decision, and budget check.
- Treat Sentry as diagnostic telemetry only. Canonical audit, financial, authority, moderation, publication, and legal-hold events remain in PostgreSQL.
- Alert immediately only on severity-1 outage, security, money/ledger, migration, audit-write, legal/takedown, and publication-divergence conditions; aggregate lower severity.
- Propagate safe request/correlation IDs across Worker, Supabase transaction, outbox/Queue, and external-provider calls.

Read the canonical bundled skill before implementing or reviewing Sentry configuration.
