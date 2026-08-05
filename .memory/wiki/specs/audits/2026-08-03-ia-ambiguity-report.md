# IA Ambiguity Audit — Initial Fresh Run

**Date:** 2026-08-03  
**Scope:** 83 documents (index + 43 parent shards + 39 deep dives)  
**Verdict:** FAIL — remediation required before `/write-be-spec`

## Coverage

- Processed: 83/83.
- Parent shards: 43/43.
- Deep dives: 39/39; no referenced skeleton or missing file found.
- Cross-layer BE/FE checks: not applicable; those layers do not yet exist.

## Rubric Score

| Dimension | Result | Points | Evidence |
|---|---:|---:|---|
| Feature Enumeration | ⚠️ | 13.5/43 | 27 parent shards lack explicit Level-1 `## Features` enumeration even where scope exists elsewhere. |
| Access Model | ⚠️ | 21.5/43 | Role allow/deny tables are common, but per-role escalation paths are not exhaustive. |
| Data Model | ⚠️ | 21.5/43 | Entities/constraints exist, but complete typed fields and explicit cardinalities are not universal. |
| User Flows | ⚠️ | 21.5/43 | Interaction tables define system behavior/outcomes, but not explicit per-flow step sequences. |
| Cross-Shard Contracts | ⚠️ | 21.5/43 | Dependencies are linked, but specific producer/consumer sections are not cited universally. |
| Edge Cases | ⚠️ | 21.5/43 | Concrete cases exist, but concurrency/invalid/deletion coverage is not mapped three-per-feature. |
| Deep Dive Coverage | ✅ | 0/43 | Every referenced deep dive exists and is authored; no referenced skeleton remains. |
| Testability | ❌ | 43/43 | No parent shard contains Given/When/Then acceptance criteria. |
| **Total** | **FAIL** | **164/344 = 47.67% ambiguity** | Fresh current-source score. |

## Blocking Punch List

1. IA-R0-01 — restore explicit source-derived Features sections for 27 shards.
2. IA-R0-02 — add normative typed field/cardinality registries for every parent data model.
3. IA-R0-03 — add explicit trigger/action/system/error flow protocols per interaction.
4. IA-R0-04 — add per-role escalation paths.
5. IA-R0-05 — cite cross-shard producer/consumer sections bidirectionally.
6. IA-R0-06 — map concurrent, invalid-input and deletion/cascade behavior per feature/interaction.
7. IA-R0-07 — add at least one measurable Given/When/Then criterion per feature/interaction.

## Implementer / Devil's-Advocate Verdict

Two implementers can derive broad domain behavior but may choose different field types/cardinalities, step ordering, escalation ownership and deletion/concurrency tests. A hostile implementer could also claim broad edge-case prose satisfies every feature or silently map cross-shard dependencies without section contracts. Advancement is blocked until deterministic appendices eliminate those choices and a separate fresh rerun independently scores current source.

## Remediation State

Automatic remediation started immediately. This report remains historical and must not be converted into a pass after editing; a fresh rerun is required.

**Audited layer:** [[specs/ia/index|IA Specification Index]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/index|IA Layer — Information Architecture]]
