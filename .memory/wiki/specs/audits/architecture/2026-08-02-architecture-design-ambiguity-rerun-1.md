# Architecture Ambiguity Audit — Architecture Design Fresh Rerun 1

- **Document:** `.memory/wiki/specs/2026-08-02-architecture-design.md`
- **Graph source:** [[specs/2026-08-02-architecture-design]]
- **Processed counter after report:** 1/2
- **Freshness:** independent current-source simulation; no prior score reused
- **Pre-remediation rerun score:** 7.5 ambiguity points / 19 checkpoints = **39.5%**

## Implementer Simulation

| Path | Forced decisions and observed divergence |
|---|---|
| Happy path | The architecture now determines data, API, provider, recovery, and styling mechanisms, but a capable team must still choose a concrete logger, infer two in-process protocols, select exact client timeout values, and decide how endpoints inherit SLOs. |
| Malicious path | A team can claim `logging-best-practices` compliance while emitting incompatible JSON or using a Node-only logger; it can also classify no endpoint as “critical” and thereby evade the critical-route SLO language. |
| Incompetent path | A literal team may install a CSS framework because the rationale is absent, use ad-hoc imports between Hono/Queue and domain modules, preserve the approximate timeout range, or report aggregate SLOs without route registration. |
| Concurrent path | Two teams can choose different logging APIs, service-call contracts, deadlines, and endpoint-tier mappings while both cite the current architecture. |

## Rubric Score

| Dimension | Result | Fresh evidence |
|---|---|---|
| Tech Stack | ⚠️ | CSS technology is named and alternatives prohibited, but the rationale and alternative-specific rejection reasons are not stated. |
| System Architecture | ⚠️ | External paths and fallbacks are strong; `Hono → domain` and `Queue consumer → domain` are absent from the protocol matrix, domain-service failure is not explicit, and the runtime logging library remains unselected. |
| Data Strategy | ✅ | Every domain/cross-cut query group maps find/store/relate/search to the locked Supabase/PostgreSQL/Storage/Queue model; canonical IDs, PII identifiers, migrations, and consistency are explicit. |
| Security Model | ✅ | Stepwise auth, role permissions/exclusions, numeric limits, and Zod boundary placement are complete. |
| Compliance | ✅ | Payments, minors, health/special category, privacy, signatures/rights, and declarations have dedicated account/consent/filter/audit contracts. |
| API Design | ✅ | Versioning, typed four-field errors, exact cursor parameters/response/binding, and rate-limit headers are locked. |
| Integration Robustness | ✅ | Every admitted external category has capability, failure, fallback, cost, and activation gate. |
| Phasing | ✅ | Every phase has dependencies, entry criteria, exit criteria, estimate, and scope. |
| Persistence Architecture | ✅ | The final artifact embeds all 25 domains and six cross-cuts plus full cross-store lifecycle contracts. |
| Error Architecture | ⚠️ | Envelope, propagation, unhandled strategy, retry/offline/UI boundaries are complete, but client deadlines remain approximate/ranged and upload idle timeout is unnamed. |
| Attack Surface | ⚠️ | Controls, headers, OWASP, sampling, fields, and alerts are concrete; the application logging runtime is described as a skill contract rather than a named implementation library. |
| Observability | ⚠️ | Runbooks, dashboards, escalation, sampling, alerts, and tier SLOs are explicit, but endpoint/consumer contracts are not required to register exactly one tier, leaving per-critical-endpoint coverage unverifiable. |
| Cost Architecture | ✅ | Idle/setup/production ceilings, 1k/10k curve, PITR reservation, highest-cost actions, and feature attribution are explicit. |
| Testability | ✅ | Manual DI, explicit composition roots, network-free fakes, local topology/deviations, isolation, and factories are locked. |

## Devil's Advocate

- A skill named `logging-best-practices` is build-time guidance, not a runtime logger contract or import path.
- The component diagram contains two typed in-process arrows that the protocol matrix does not name; “in process” alone does not define validation, error, or dependency direction.
- “Approximately 8 seconds,” “10–15 seconds,” and a separate unnamed upload idle timeout cannot produce identical clients.
- Tier SLOs do not become per-endpoint SLOs until every endpoint/consumer is required to register one tier and validation rejects omissions.
- Prohibiting Tailwind/CSS-in-JS states the outcome but not why the chosen CSS axis fits Astro, CSP, runtime, and governance constraints.

## Specification Gaps

1. **SPEC GAP R1-ARCH-01 — Tech Stack / CSS rationale:** named choice lacks rationale and rejected-alternative reasons. **Resolution:** state zero-runtime/CSP/Astro/token-governance rationale and why Tailwind/runtime CSS-in-JS are rejected.
2. **SPEC GAP R1-ARCH-02 — System / in-process protocols:** `Hono → domain` and `Queue → domain` plus domain failure fallback are missing. **Resolution:** add both matrix rows and a domain-service fallback row.
3. **SPEC GAP R1-ARCH-03 — Observability / logger:** no runtime logging library/import contract is selected. **Resolution:** lock repository-owned `@wejammin/observability` structured logger and reject ambient console/Pino/Winston at domain boundaries.
4. **SPEC GAP R1-ARCH-04 — Error / client deadlines:** approximate/ranged values and unnamed upload idle timeout remain. **Resolution:** lock exact read, command, acceptance, and no-byte upload deadlines.
5. **SPEC GAP R1-ARCH-05 — Observability / SLO registration:** tier targets are not normatively assigned per endpoint/consumer. **Resolution:** require exactly one registered tier per endpoint/consumer and fail contract/observability validation for omissions.

## Verdict

Fresh rerun 1 does not pass. The five findings are deterministic architecture clarifications and require remediation followed by another fresh rerun.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
