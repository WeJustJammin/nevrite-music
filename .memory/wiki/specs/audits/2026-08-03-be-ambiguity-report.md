# BE Ambiguity Audit — Initial Fresh Run

**Date:** 2026-08-03  
**Scope:** 157 documents (index + 156 backend contracts)  
**Verdict:** FAIL — contract-detail remediation required before `/write-fe-spec`

## Coverage

- Processed: 157/157 through current-source implementer simulation, rubric scoring and devil's-advocate review.
- Contract documents: 156/156; the BE index is a structural reference and is not scored as an endpoint contract.
- IA → BE coverage: pass. Every IA interaction allocation is represented by a backend endpoint/worker or an explicit closed/deferred capability boundary.
- BE → FE field/error checks: not applicable because FE specifications are not authored.

## Rubric Score

| Dimension | Result | Points | Evidence |
|---|---:|---:|---|
| Upstream Traceability | ⚠️ | 78/156 | Specs identify IA shard and allocated interaction, but endpoint rows do not universally cite exact IA section and field source. |
| Contract Completeness | ⚠️ | 78/156 | Strict Zod 4 is required and request/response field sets are named, but most endpoints omit fully typed field-by-field schemas and examples. |
| Error Exhaustiveness | ⚠️ | 78/156 | Application codes are present, but per-code message shape and retry/no-retry guidance are not universal. |
| Schema Completeness | ⚠️ | 78/156 | Persistence entities, RLS and key invariants are present; complete column types/nullability/FKs/query indexes are not universal. |
| Middleware Explicitness | ❌ | 156/156 | Endpoint rows do not each define numeric rate, validation stage and CORS policy; broad Shard 00 inheritance is insufficient under this rubric. |
| State Transitions | ⚠️ | 78/156 | Lifecycle invariants and blocked outcomes exist, but exhaustive state/trigger/transition tables are not universal. |
| Concurrency | ⚠️ | 78/156 | Idempotency/version/lease/serialization rules exist at contract level, but not every write names its strategy in its endpoint row. |
| Pagination & Limits | ❌ | 96/96 applicable | List/read surfaces do not universally define cursor, default/max page size, filters and sorting. |
| Integration Seams | ❌ | 90/90 applicable | Provider boundaries retain unknown states, but request/response, timeout milliseconds, retry/backoff and circuit-breaker rules are not all explicit. |
| Security Rules | ⚠️ | 78/156 | Authentication/authorization/RLS are strong; input sanitization and excluded output fields are not explicit for every endpoint. |
| Global Error Envelope | ❌ | 156/156 | Contracts cite Shard 00, but do not each explicitly cite architecture `## Error Architecture` as required by rubric dimension 11. |
| **Total** | **FAIL** | **1044/1590 = 65.66% ambiguity** | Structural domain behavior is deterministic; transport, persistence and operational contract cells remain under-specified. |

## Blocking Punch List

1. BE-R0-01 — add exact IA section and field-source references per endpoint/schema.
2. BE-R0-02 — add strict typed Zod request/success/error schemas with constraints and examples per endpoint.
3. BE-R0-03 — add complete application error, envelope, message and retry guidance per endpoint.
4. BE-R0-04 — add typed persistence columns, nullability, uniqueness, FKs and query indexes.
5. BE-R0-05 — add per-endpoint auth, numeric rate, validation stage and CORS matrix.
6. BE-R0-06 — add exhaustive entity state/transition/trigger/blocked-operation tables.
7. BE-R0-07 — name concurrency strategy per write and cursor/default/max/sort/filter policy per list.
8. BE-R0-08 — define each external seam's request/response, timeout, retries/backoff and circuit breaker.
9. BE-R0-09 — add per-endpoint sanitization/output-filter rules and direct `Error Architecture` citation.

## Cross-Layer Consistency

- IA interaction allocation is complete across Shards 00–42; no orphan backend domain was found.
- No FE mapping is scored or inferred before FE authoring.
- The failure is specification depth, not a contradiction of locked architecture or domain boundaries.

## Implementer / Devil's-Advocate Verdict

Two implementers receive the same domain invariants, authority boundaries, endpoints and failure intent, but can choose different DTO field types, retry behavior, rate windows, pagination, table indexes, provider timeouts and response filtering. A hostile implementer can satisfy broad Shard 00 inheritance while making route-specific operational choices the rubric explicitly requires in the contract. Advancement remains blocked until deterministic endpoint appendices are authored and a separate fresh rerun scores current source.

## Remediation State

Mechanical remediation is authorized under standing autonomy. This report remains historical and cannot be converted into a pass after edits; `/audit-ambiguity be` must run freshly after remediation.

**Audited layer:** [[specs/be/index|BE Specification Index]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/be/index|BE Layer — Backend Specifications]]
