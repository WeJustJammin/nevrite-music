---
name: hono
description: Build WeJammin's versioned HTTP API and event handlers with Hono on Cloudflare Workers.
version: 1.0.0
---

# Hono Backend

Use the canonical bundled guidance at `.codex/skill-library/stack/frameworks/hono/SKILL.md` for documentation lookup, request testing, routing, middleware, and Cloudflare Worker optimization.

## WeJammin Constraints

- Hono is the versioned API/router layer inside a modular monolith, not a license to create route-owned business logic.
- Middleware order must establish correlation, security headers, body/size limits, authentication, acting context, authorization, validation, idempotency, and observability before a protected use case runs.
- Domain services consume validated contracts and execute atomic invariants through PostgreSQL transactions/functions.
- Long or retryable work commits intent/outbox state and continues through Queues or schedules; never hold HTTP requests open for partner, media, import/export, or convergence work.
- Queue payloads contain safe identifiers, schema/event version, correlation/causation, and expected entity version—not raw PII, secrets, evidence, payment details, or private content.
- Return stable sanitized problem responses with correlation IDs; never expose stacks, SQL, policy predicates, provider payloads, or secrets.
- Keep handlers Web-standards based, bounded, and testable through `app.request()` without a live server.
- Astro server routes may adapt page requests but must call the same use cases/contracts rather than duplicate authorization or domain rules.

Read the canonical bundled skill before implementing or reviewing Hono code.
