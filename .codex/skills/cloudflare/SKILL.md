---
name: cloudflare
description: Operate WeJammin's Astro Pages deployment, Worker/Hono runtime, queues, cache, security, and observability on Cloudflare.
version: 1.0.0
---

# Cloudflare Platform

Use the canonical bundled guidance at `.codex/skill-library/stack/hosting/cloudflare/SKILL.md` for Pages, Workers, Queues, schedules, cache, security, observability, bindings, and deployment choices.

## WeJammin Constraints

- Pages serves Astro deploy output and content-hashed static assets; Workers serves SSR, Hono API, Queue, and scheduled handlers.
- Supabase remains canonical for PostgreSQL, Auth, Storage, Realtime, and governed uploaded media; do not introduce D1, KV, R2, Durable Objects, or another Cloudflare store without a demonstrated requirement and decision update.
- Use Cloudflare Queues only with the transactional PostgreSQL outbox for business-critical work.
- Public caching keys include immutable release/publication/asset versions. Authenticated, preview, admin, legal, and private responses default to bypass/no-store.
- Custom cache rules must not bypass Pages Functions, redirects, authorization, security headers, preview isolation, or deployment freshness.
- Treat cache purge as asynchronous evidence-bearing work; security, rights, consent, privacy, takedown, and erasure removals fail closed when required.
- Keep Worker handlers bounded and move long/retryable work to jobs. Do not perform large media transforms or partner waits on interactive requests.
- Preserve least-privilege bindings, environment separation, structured telemetry, correlation IDs, and protected production deployment approval.

Read the canonical bundled skill before implementing or reviewing Cloudflare infrastructure.
