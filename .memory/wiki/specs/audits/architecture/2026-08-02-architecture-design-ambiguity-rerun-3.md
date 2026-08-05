# Architecture Ambiguity Audit — Architecture Design Fresh Rerun 3

- **Document:** `.memory/wiki/specs/2026-08-02-architecture-design.md`
- **Graph source:** [[specs/2026-08-02-architecture-design]]
- **Processed counter after report:** 1/2
- **Freshness:** post-DEC-093 independent current-source simulation
- **Score:** 1.5 ambiguity points / 15 checkpoints = **10.0%**

## Implementer Simulation

| Path | Forced decisions and observed divergence |
|---|---|
| Happy path | Components, paths, fallbacks, technology alternatives, data, security, APIs, integrations, errors, operations, cost, and testing are now deterministic. A capable setup team must still select Cloudflare Free versus Workers Paid because the hosting section explicitly defers the tier. |
| Malicious path | A team can remain on Free while claiming the architecture permits it, despite the setup cost model reserving the Workers Paid floor and the availability/Queue requirements assuming the paid posture. |
| Incompetent path | A literal team can treat “plan tier deferred” as permission to postpone a production-critical capacity/cost choice until after staging validation. |
| Concurrent path | Two teams choose different Cloudflare tiers while every other architecture choice remains identical. |

## Rubric Score

| Dimension | Result | Fresh evidence |
|---|---|---|
| Tech Stack | ⚠️ | The exhaustive 20-axis matrix supplies selection/rationale/rejections, but Hosting Platform still says `Plan tier: Deferred to /setup-workspace`, contradicting the cost/integration sections that reserve Workers Paid. |
| System Architecture | ✅ | 12 named components, 17 diagram arrows, 17 one-to-one protocols, complete component/client fallbacks, lifecycle, logging, scrubbing, tracing, and numeric alerts. |
| Data Strategy | ✅ | 31 query-map rows, canonical stores/IDs, named migrations, hot paths, and semantic PII fields. |
| Security Model | ✅ | Ten-step auth, exhaustive role permissions/exclusions, numeric route limits, and Zod boundaries. |
| Compliance | ✅ | Payments, minors, and health each define hierarchy, consent/disclosure, filtering, and audit in dedicated sections; all other regulated domains are similarly gated. |
| API Design | ✅ | Versioning, exact typed errors, cursor parameters/response/binding, and headers complete. |
| Integration Robustness | ✅ | Thirteen admitted/deferred integration rows have capability, failure, fallback, cost, and gate. |
| Phasing | ✅ | Nine rows have dependencies, entry, exit, estimate, and scope; no “when ready” criterion. |
| Persistence Architecture | ✅ | 31 query rows and complete cross-store identity/create/recover/delete/read contracts. |
| Error Architecture | ✅ | Typed locked example, all-layer propagation, Worker entrypoint handling, exact client deadlines, offline/retry/UI and surface boundaries. |
| Attack Surface | ✅ | OWASP web/API coverage, configured headers, secrets, dependency cadence, BOLA, logger/scrubbing, trace sampling, and numeric alerts. |
| Observability | ✅ | Linked runbooks, owner/email/timelines, seven SLO rows, five hosted dashboards, route registry, MTTD, severity, dedupe, and mute expiry. |
| Cost Architecture | ✅ | `$0`, `$50`, and `$300` ceilings, PITR reservation, two load points, costly operations, and per-feature cost projection. |
| Testability | ✅ | Manual DI, typed ports, network-denied tests, production-like local topology/deviations, deterministic factories, and state isolation. |

## Devil's Advocate

- A paid-tier amount in a planning curve is not itself a tier decision when the hosting section explicitly delegates selection.
- The availability target cannot select a provider tier implicitly; procurement needs a named required posture before setup begins.
- Browser/PWA failure is fully covered by exact offline deadlines, local-intent reconciliation, and Astro/React boundaries even though it is not duplicated as a separate fallback-table row.

## Specification Gap

**SPEC GAP R3-ARCH-01 — Hosting / service tier:** Cloudflare tier remains deferred and contradicts the paid setup assumptions. **Resolution:** lock Workers Paid for shared staging and production at `/setup-workspace`; retain `$0` local/free pre-setup operation and treat procurement, not selection, as deferred.

## Verdict

Fresh rerun 3 does not pass. One deterministic tier correction and a fourth fresh rerun remain.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
