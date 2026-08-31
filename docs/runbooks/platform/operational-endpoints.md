# Operational endpoints

Trigger: health, readiness, or authorized diagnostics returns an unexpected status.

1. Record the response request ID and UTC time; never copy credentials or private payloads.
2. Confirm `/api/v1/health` reports process health and `/api/v1/ready` reports only `ready` or `not_ready`.
3. An authorized operator may request the provider-neutral diagnostic summary with the named `diagnostics.read` capability, a fresh step-up, and a reason.
4. If readiness remains unavailable, stop promotion and escalate through `platform.on_call` with request IDs only.

Do not bypass authorization, expose provider topology, or use a service-role credential in a browser.
