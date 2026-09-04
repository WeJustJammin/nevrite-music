# Content schema registry operational evidence

## Contents

- Alert policy, thresholds, contracts, evaluator, and provider-free boundary
- Local verification command and production observability handoff

## Ownership

The `infra/observability` modules own redacted S09 aggregate evaluation and
delivery seams. Callers provide the native telemetry sink; these modules do not
own provider credentials, dashboards, or request data.

## Extension

Add new aggregate policies as bounded modules with explicit thresholds and
redacted output. Extend the focused tests before wiring a native provider or
scheduled query.

## Conventions

Keep telemetry fields compatible with the structured observability contracts;
never accept request bodies, cookies, tokens, content values, or capability
graphs in this boundary.

## Related links

- `tests/observability/phase-02-slice-09-alert-policy.test.ts`
- `tests/observability/phase-02-slice-09-alert-boundary.test.ts`
- `docs/local-bootstrap.md`

`content-schema-registry-alert-policy.ts` is the public, tested, side-effect-free
policy adapter and compatibility barrel for the redacted S09 aggregate-
measurement policy. Its focused
`content-schema-registry-alert-thresholds.ts`,
`content-schema-registry-alert-types.ts`, and
`content-schema-registry-alert-evaluator.ts` modules keep thresholds, contracts,
and evaluation independently bounded. The companion
`content-schema-registry-alert-boundary.ts` is the provider-free delivery seam:
it consumes the policy result and emits only page-worthy alert records to a
caller-provided sink. Production telemetry already emits the operation, SLO,
alert route, and runbook attributes consumed by the native Cloudflare/Supabase
observability boundary; neither module accepts request bodies, cookies, tokens,
content values, or capability graphs.

The repository has no configured provider API for creating or querying
production dashboards. Therefore local tests prove threshold semantics,
telemetry field compatibility, and provider-free sink consumption only. A
deployment must connect a native observability query/scheduled boundary to
`evaluateAndEmitContentSchemaRegistryAlerts` (or an equivalent policy
implementation) and record the resulting redacted alert delivery before
claiming production alert measurements. The policy intentionally does not
fabricate an alert when an aggregate measurement is missing or non-finite.

Run the local contract evidence with:

```bash
pnpm exec vitest run tests/observability/phase-02-slice-09-alert-policy.test.ts
```
