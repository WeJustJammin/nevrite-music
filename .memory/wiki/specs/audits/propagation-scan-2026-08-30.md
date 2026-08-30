# Sentry Removal and Free-Only Operations Propagation Scan

**Date:** 2026-08-30  
**Decision type:** Architecture and operational-cost constraint  
**Owner directive:** Remove Sentry. Use free services only; no trials, subscriptions, payment methods, pay-as-you-go, or paid add-ons without explicit approval of the named service and exact price.

## Superseded decision

`DEC-063` selected Sentry Developer plus structured native telemetry. Sentry signup activated a Business trial, so the owner rejected the vendor and explicitly authorized complete removal. The external organization/project/trial is scheduled for deletion; all GitHub Sentry credentials and variables have been removed.

## Scan coverage

The full current-disk scan found 430 case-insensitive `Sentry` occurrences on 414 lines across 122 project decision, specification, phase-plan, and stack-map files:

| Classification | Files | Result |
|---|---:|---|
| Source decision and architecture | 5 | Explicit contradiction |
| Infrastructure and Phase 1 contracts | 5 | Explicit contradiction |
| Downstream BE/FE specifications | 107 | Explicit provider assumption |
| Project stack maps and `AGENTS.md` | 5 | Explicit contradiction |

Runtime, dependency, workflow, environment-template, and repository-credential scans are tracked separately and contain zero Sentry references after removal.

## Replacement contract

- Application observability uses schema-validated newline-delimited structured logs plus Cloudflare/Supabase native telemetry already included with the selected infrastructure.
- Browser correctness relies on contract tests, Playwright, safe user-facing error boundaries, request/correlation IDs, and server/provider diagnostics; no third-party browser telemetry SDK is installed.
- Diagnostic metadata remains PII-minimized, allowlisted, release-aware, and separate from canonical PostgreSQL audit/provenance records.
- No external monitoring account, DSN, source-map upload token, vendor release, trial, paid monitoring plan, or pay-as-you-go monitoring is permitted.
- Any future paid service requires a new owner decision naming the service and exact recurring and usage-based ceiling before provisioning.

## Apply authorization

The owner explicitly said `remove sentry`; that directive authorizes applying every explicit Sentry contradiction identified by this scan. No replacement paid vendor is authorized.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]

### References
- [[specs/phases/phase-1|Phase 1 — Operational foundation]]
