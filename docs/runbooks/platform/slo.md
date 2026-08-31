# Foundation SLO

Tier 1 targets 99.90% availability using the `api.availability` measurement label.

1. Confirm the alert is routed through `platform.on_call` and references a bounded UTC window.
2. Compare sanitized readiness outcomes and request IDs; do not infer a provider failure from a public response.
3. Stop artifact promotion when the readiness boundary is unavailable.
4. Escalate with the measurement window, release identifier, and request IDs only.
