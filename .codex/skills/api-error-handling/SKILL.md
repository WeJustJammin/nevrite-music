---
name: api-error-handling
description: Define secure, stable API errors for WeJammin using problem details, correlation IDs, validation errors, conflict semantics, and retry guidance.
version: 1.0.0
---

# API Error Handling

Use the canonical bundled guidance at `.codex/skill-library/surface/api/api-error-handling/SKILL.md` for problem-details responses, validation mapping, status codes, correlation, stack suppression, retry semantics, and resilience patterns.

## WeJammin Constraints

- Use one versioned problem-details contract shared by Astro, React islands, Hono, tests, and future native clients.
- Keep stable machine-readable problem codes separate from localized human messages.
- Use `409` for optimistic-version/state conflicts and include safe current-version/recovery metadata, never protected state.
- Use `422` for validly encoded but semantically invalid commands with field-level JSON-pointer errors.
- Distinguish unavailable, absent, stale, blocked, and forbidden; never translate dependency failure into an empty result or `404`.
- Include a safe correlation ID in every error response and internal event.
- Never expose stack traces, SQL, RLS predicates, authorization graph details, secrets, raw provider responses, evidence, PII, or payment data.
- Retry guidance is explicit and idempotency-aware; clients must not retry non-idempotent commands blindly.

Read the canonical bundled skill before designing or implementing API errors.
