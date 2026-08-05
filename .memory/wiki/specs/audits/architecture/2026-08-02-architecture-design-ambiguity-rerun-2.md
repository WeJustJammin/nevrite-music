# Architecture Ambiguity Audit — Architecture Design Fresh Rerun 2

- **Document:** `.memory/wiki/specs/2026-08-02-architecture-design.md`
- **Graph source:** [[specs/2026-08-02-architecture-design]]
- **Processed counter after report:** 1/2
- **Freshness:** post-DEC-092 independent current-source simulation
- **Score:** 3 ambiguity points / 16 checkpoints = **18.8%**

## Implementer Simulation

| Path | Forced decisions and observed divergence |
|---|---|
| Happy path | Runtime logging, CSS, deadlines, SLO registration, data, errors, and fallbacks are now deterministic. A capable team must still reconstruct why several selected technology axes rejected alternatives and resolve the diagram/matrix disagreement over whether Hono or the domain layer calls Data API/RPC/Storage. |
| Malicious path | A team can replace a selected but weakly-rationalized axis while claiming equivalent fit, or bypass domain ports by citing the matrix's `Hono → Supabase Data API/RPC/Storage` row. |
| Incompetent path | A literal team can implement the matrix instead of the diagram and place database/storage adapters in transport code, violating the modular boundary without violating the written row. |
| Concurrent path | Two teams can make different hosting/database/auth/CMS/search/realtime/async alternative analyses and different Hono/domain/persistence call graphs while each cites the architecture. |

## Rubric Score

| Dimension | Result | Fresh evidence |
|---|---|---|
| Tech Stack | ⚠️ | Major selections are named and generally reasoned, but alternative-specific rationale is incomplete for hosting, database/auth, CMS, search/realtime/async, asset storage, data access, and launch provider axes. |
| System Architecture | ⚠️ | Every component and fallback exists, but matrix grouping does not mirror every diagram arrow and `Hono → Data API/RPC/Storage` conflicts with `Domain → DB/Storage`. |
| Data Strategy | ✅ | Complete canonical store/query/migration/PII coverage. |
| Security Model | ✅ | Complete flow, roles, numeric controls, and validation boundaries. |
| Compliance | ✅ | Dedicated full-depth regulated-domain sections. |
| API Design | ✅ | Exact version/error/pagination/rate-limit contract. |
| Integration Robustness | ✅ | Capability/failure/fallback/cost complete for every admitted integration. |
| Phasing | ✅ | Dependency, entry, exit, estimate, and scope complete for every phase. |
| Persistence Architecture | ✅ | Query map and full cross-store contracts complete. |
| Error Architecture | ✅ | Typed envelope, propagation, unhandled handling, exact deadlines, offline/retry/UI boundaries complete. |
| Attack Surface | ✅ | Secrets, dependencies, OWASP, headers, logger, scrubbing, tracing, sampling, and numeric alerts complete. |
| Observability | ✅ | Linked runbooks, owner/email/timelines, hosted dashboards, registered per-route SLOs, MTTD, severity, and silencing complete. |
| Cost Architecture | ✅ | Complete baseline, curve, operation, mechanism, and ceiling. |
| Testability | ✅ | Complete DI, mocks, topology/deviations, isolation, and test-data strategy. |

## Devil's Advocate

- A choice being previously locked does not satisfy the architecture rubric's requirement to record why rejected alternatives are inferior for this system.
- The diagram makes domain services own persistence calls; the matrix currently grants those calls to Hono. That is a real dependency-direction contradiction, not stylistic wording.
- Grouping `PostgreSQL/Realtime → browser` and `Browser/Worker/Queue → telemetry` makes protocols readable, but strict path coverage requires each diagram arrow to be traceable one-to-one.

## Specification Gaps

1. **SPEC GAP R2-ARCH-01 — Tech Stack / exhaustive decision rationale:** several applicable axes lack explicit rejected alternatives and reasons. **Resolution:** add one normative technology-decision matrix covering every selected launch axis.
2. **SPEC GAP R2-ARCH-02 — System / diagram-protocol isomorphism:** matrix rows group or contradict diagram arrows. **Resolution:** replace with a one-row-per-arrow matrix that preserves transport → domain → adapter dependency direction.

## Verdict

Fresh rerun 2 does not pass. Both deterministic gaps require remediation and a third fresh rerun.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
