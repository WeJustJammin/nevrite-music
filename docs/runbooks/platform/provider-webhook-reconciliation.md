# Provider and webhook reconciliation

Use this runbook for rejected webhook signatures, duplicate or conflicting
delivery identifiers, unknown provider outcomes, or provider operations that
remain pending beyond their bounded deadline.

## Safety boundary

Production provider registries are empty and disabled in Phase 1. Automated
verification uses local/fake adapters only. Do not activate Stripe, Resend,
Sentry, another provider, a trial, or a paid service from this runbook.

Webhook raw bytes, signatures, credentials, and provider response bodies are
never logged or displayed. Persist only the bounded digest, provider-neutral
identifier, normalized event identity, state, timestamps, and sanitized
evidence declared by the contract.

## Webhook admission

1. Record UTC time, request ID, provider registry key, receipt ID, delivery ID,
   normalized event ID when available, digest prefix, and decision. Do not copy
   the raw request or signature.
2. Confirm the provider is registered and enabled for the current environment.
   An absent/disabled adapter fails closed before parsing or effect execution.
3. Verify the signature and timestamp against the exact raw bytes before JSON
   parsing. Invalid, stale, oversized, or malformed input performs no domain
   work and returns only the declared safe response.
4. Reserve the delivery identity and SHA-256 atomically. A replay with the same
   digest is an idempotent duplicate and returns exactly `{ "received": true }`.
   The same identity with a different digest enters manual review and performs
   no effect.
5. Parse and normalize only after verification. Unknown event types or schema
   versions remain acknowledged admission evidence but never execute a domain
   handler.

## Provider-effect reconciliation

1. Confirm the canonical provider-operation intent committed before any adapter
   call. Every attempt must bind operation ID, normalized request hash,
   idempotency key, provider key, and canonical version.
2. A pre-send failure may retry within the declared bounded policy. Once the
   adapter might have received the request, a timeout or lost response is an
   unknown outcome: keep the operation `pending`/manual-review and never resend
   blindly.
3. Reconcile through a provider-neutral status/read adapter only when that
   adapter is explicitly registered and verified. Match the remote evidence to
   the original operation identity before committing success or failure.
4. Conflicting evidence, digest changes, unsupported status lookup, or expired
   authority remains closed and escalates to `platform.on_call` with sanitized
   identifiers only.

The operator surface may show state, version, timestamps, digest prefix,
attempt count, and sanitized provenance. It must not expose raw payloads,
signatures, secrets, provider headers, or privileged response bodies.
