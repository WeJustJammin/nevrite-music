# Architecture Ambiguity Audit — 2026-08-02

- **Invocation:** `/audit-ambiguity architecture`
- **Scope:** 2/2 documents processed
- **Pre-remediation ambiguity:** **60.0%**
- **Status:** deterministic gaps remediated; **fresh rerun required**
- **Advancement:** blocked; do not run `/decompose-architecture` yet
- **Sources:** [[specs/2026-08-02-architecture-design]], [[specs/ENGINEERING-STANDARDS]]

## Score

The layer had 15 rubric checkpoints and 10 additional implementer-simulation checkpoints. Rubric ambiguity contributed 5.0 points; the ten concrete two-implementer gaps contributed 10 points: `(5 + 10) / (15 + 10) = 60.0%`.

| Architecture dimension | Pre-remediation result | Finding |
|---|---|---|
| Tech Stack | ⚠️ | CSS architecture deferred |
| System Architecture | ⚠️ | protocols and component fallback not enumerated |
| Data Strategy | ❌ | final query map absent; PII field identifiers absent |
| Security Model | ✅ | no ambiguity finding |
| Compliance | ✅ | no ambiguity finding |
| API Design | ⚠️ | error types and cursor wire contract incomplete |
| Integration Robustness | ⚠️ | Stripe hosted versus embedded mode ambiguous |
| Phasing | ✅ | no ambiguity finding |
| Engineering Standards | ⚠️ | RPO contradiction and nonnumeric performance profile |
| Persistence Architecture | ⚠️ | normative map outside final artifact |
| Error Architecture | ✅ | no ambiguity finding |
| Attack Surface | ✅ | no ambiguity finding |
| Observability | ⚠️ | named runbooks lacked linked contract |
| Cost Architecture | ✅ | no ambiguity finding |
| Testability | ⚠️ | DI mechanism not locked |

## Deterministic Remediation

| Gap | Remediation applied |
|---|---|
| ARCH-01 | locked token-driven vanilla CSS, cascade layers, Astro scoped styles, and React CSS Modules |
| ARCH-02 | added communication-protocol and component-failure/fallback matrices |
| ARCH-03 | embedded the complete 25-domain plus six-cross-cut query map in final and draft architecture |
| ARCH-04 | added canonical semantic PII registry seed and extension gate to architecture and data placement |
| ARCH-05 | typed and bounded the four-field error envelope; locked cursor request/response, binding, authentication, and expiry |
| ARCH-06 | locked Stripe-hosted Checkout redirect and hosted Connect; prohibited embedded/custom card UI and payment frames at launch |
| ARCH-07 | created and linked the canonical operational runbook contract |
| ARCH-08 | locked manual constructor/function injection and explicit composition roots; prohibited reflection containers/service locators |
| STD-01 | replaced the impossible zero-loss claim with seven-day PITR, `≤2 minute` worst-case RPO, restore gate, and budget reservation |
| STD-02 | added numeric PR smoke, staging sustained/burst load, route/cache mix, sample, dataset, and pgbench profiles |

The decisions are recorded as DEC-088 through DEC-091. The shared specification graph was recompiled after remediation.

## Freshness Gate

This invocation does not rescore its own edits. Per the audit workflow, any specification remediation invalidates advancement until a separate fresh `/audit-ambiguity architecture` run independently simulates and scores the changed documents. Only a fresh 0% result may recommend `/decompose-architecture`.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
