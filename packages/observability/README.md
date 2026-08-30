# Observability

This package owns WeJammin's provider-neutral observability contract. Runtime code
uses it instead of ambient `console.*` calls or provider-specific payload shaping.

## Public boundaries

- `@wejammin/observability/logging` validates an allowlisted event schema, locks
  environment/release/service context, applies the approved sampling policy, and
  emits exactly one newline-delimited JSON object through an injected sink.

Secrets, credentials, session tokens, direct identifiers, contact details,
request or response bodies, payment/KYC material, private content, evidence, and
raw provider payloads never belong in logs or telemetry payloads. A rejected log event
produces a safe diagnostic signal; telemetry failures never alter application
truth.

Runtime adapters own SDK initialization and transport. This package owns schema,
privacy, reserved-field, and sampling behavior, with adversarial tests covering
injection and forbidden-data cases.
