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

## Contents

The package contains the provider-neutral logging contract, privacy scrubber,
sampling policy, and colocated adversarial tests.

## Ownership

Observability owns validation, redaction, reserved-field protection, and the
injected sink boundary. It does not own a hosted monitoring account, provider
SDK credentials, or application business decisions.

## Extension

Add a schema-backed event field only when its privacy and retention behavior is
specified. Extend the allowlist and adversarial tests together; runtime code
must continue to use the package boundary.

## Conventions

Emit one newline-delimited structured event, scrub direct identifiers and
secrets, preserve correlation context, and treat telemetry failure as
non-authoritative. No third-party monitoring SDK is required for local setup.

## Related links

- [Runtime contracts](../contracts/README.md)
- [Test support](../test-support/README.md)
- [Local bootstrap](../../docs/local-bootstrap.md)
