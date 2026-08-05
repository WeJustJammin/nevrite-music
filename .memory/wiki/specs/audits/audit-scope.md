# Ambiguity Audit Scope — IA

- **Invocation:** `/audit-ambiguity ia` — fresh run
- **Date:** 2026-08-05
- **Scope:** ia
- **Status:** FAIL — 67/344 = 19.48% ambiguity. Remediation required; layer may not advance. Report: `2026-08-05-ia-ambiguity-report.md`
- **Declared document count:** 83
- **Processed:** 83/83 (plus 15 ideation source files opened for dimension 1)
- **Enumeration rule** (from `pipeline-rubrics/references/scoring.md`): `.memory/wiki/specs/ia/index.md` + every shard listed in that index + every Markdown file under `.memory/wiki/specs/ia/deep-dives/`.
- **Low-count exception:** none. Filesystem enumeration found 46 Markdown files directly under `ia/` and 39 under `ia/deep-dives/`. Of the 46, 43 are parent shards and 1 is the index; `decomposition-plan.md` and `decomposition-validation.md` are decomposition provenance artefacts, not IA shards, and fall outside the mapping rule — same treatment as the 2026-08-03 runs, which also declared 83.
- **Deep-dive gap check:** shards 00, 08, 12 and 42 have no deep-dive file. The IA index declares no deep dive for those four, so 39/39 declared deep dives resolve. Dimension 7 scoring must confirm each parent that declares none genuinely needs none.
- **Prior state:** `2026-08-03-ia-ambiguity-rerun-1.md` recorded PASS at 0/344 (0.00%) over the same 83 documents. This run is an independent fresh scoring of current source; the prior verdict carries no evidence forward.
- **Predecessor scope file:** the BE scope previously at this path is archived at `.memory/wiki/specs/audits/audit-scope-be-2026-08-03.md`.

## Rubric File Paths

| Purpose | Path |
|---|---|
| Layer rubric (8 dimensions) | `.claude/skills/pipeline-rubrics/references/ia-rubric.md` |
| Scoring formula + document mapping | `.claude/skills/pipeline-rubrics/references/scoring.md` |
| Rubric skill entry | `.claude/skills/pipeline-rubrics/SKILL.md` |

Scoring: ✅ = 0, ⚠️ = 0.5, ❌ = 1; `ambiguity% = points / applicable_checkpoints × 100`.
Applicable checkpoints: 8 dimensions × 43 parent shards = **344**. The index and the deep dives are read in full and score into their parent shard's dimensions (index into dimensions 1/5; deep dives into dimension 7 per the rubric's deep-dive audit note).

## Cross-Layer Consistency

Scope is `ia`, not `be`/`fe`/`all` — per `scoring.md`, cross-layer checks do not run in this invocation. BE exists (157 docs, PASS) and FE is partial (15/43); IA→BE and IA→FE checks belong to a `be`, `fe` or `all` scoped run.

## IA Documents (83)

### Index (1)

1. `.memory/wiki/specs/ia/index.md`

### Parent Shards (43)

2. `.memory/wiki/specs/ia/00-infrastructure.md`
3. `.memory/wiki/specs/ia/01-identity-authority.md`
4. `.memory/wiki/specs/ia/02-profiles-verification.md`
5. `.memory/wiki/specs/ia/03-cms-content-modeling.md`
6. `.memory/wiki/specs/ia/04-cms-delivery-media.md`
7. `.memory/wiki/specs/ia/05-platform-configuration-admin.md`
8. `.memory/wiki/specs/ia/06-trust-safety.md`
9. `.memory/wiki/specs/ia/07-credits-core.md`
10. `.memory/wiki/specs/ia/08-credit-reporting-disclosure.md`
11. `.memory/wiki/specs/ia/09-projects-collaboration.md`
12. `.memory/wiki/specs/ia/10-rights-ownership.md`
13. `.memory/wiki/specs/ia/11-community-graph.md`
14. `.memory/wiki/specs/ia/12-community-spaces-events.md`
15. `.memory/wiki/specs/ia/13-opportunities-casting.md`
16. `.memory/wiki/specs/ia/14-services-marketplace.md`
17. `.memory/wiki/specs/ia/15-education-delivery.md`
18. `.memory/wiki/specs/ia/16-education-credentials-institutions.md`
19. `.memory/wiki/specs/ia/17-realtime-sessions.md`
20. `.memory/wiki/specs/ia/18-royalty-accounting.md`
21. `.memory/wiki/specs/ia/19-royalty-reporting-forecasting.md`
22. `.memory/wiki/specs/ia/20-licensing-core.md`
23. `.memory/wiki/specs/ia/21-specialized-licensing.md`
24. `.memory/wiki/specs/ia/22-release-distribution.md`
25. `.memory/wiki/specs/ia/23-gear-provenance-registry.md`
26. `.memory/wiki/specs/ia/24-gear-holdings-operations.md`
27. `.memory/wiki/specs/ia/25-gear-market-catalog.md`
28. `.memory/wiki/specs/ia/26-gear-commerce-fulfilment.md`
29. `.memory/wiki/specs/ia/27-digital-catalog-delivery.md`
30. `.memory/wiki/specs/ia/28-digital-licensing-commerce.md`
31. `.memory/wiki/specs/ia/29-venues-spaces.md`
32. `.memory/wiki/specs/ia/30-booking-contracts.md`
33. `.memory/wiki/specs/ia/31-live-settlement-intelligence.md`
34. `.memory/wiki/specs/ia/32-show-production-planning.md`
35. `.memory/wiki/specs/ia/33-show-day-operations.md`
36. `.memory/wiki/specs/ia/34-touring-operations.md`
37. `.memory/wiki/specs/ia/35-ticket-products-sales.md`
38. `.memory/wiki/specs/ia/36-box-office-risk.md`
39. `.memory/wiki/specs/ia/37-fanbase-direct-to-fan.md`
40. `.memory/wiki/specs/ia/38-promotion-marketing.md`
41. `.memory/wiki/specs/ia/39-analytics-ingestion-reporting.md`
42. `.memory/wiki/specs/ia/40-market-intelligence-signals.md`
43. `.memory/wiki/specs/ia/41-career-finance.md`
44. `.memory/wiki/specs/ia/42-career-planning-risk.md`

### Deep Dives (39)

45. `.memory/wiki/specs/ia/deep-dives/01-identity-authority.md`
46. `.memory/wiki/specs/ia/deep-dives/02-profiles-verification.md`
47. `.memory/wiki/specs/ia/deep-dives/03-cms-content-modeling.md`
48. `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md`
49. `.memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md`
50. `.memory/wiki/specs/ia/deep-dives/06-trust-safety.md`
51. `.memory/wiki/specs/ia/deep-dives/07-credits-core.md`
52. `.memory/wiki/specs/ia/deep-dives/09-projects-collaboration.md`
53. `.memory/wiki/specs/ia/deep-dives/10-rights-ownership.md`
54. `.memory/wiki/specs/ia/deep-dives/11-community-graph.md`
55. `.memory/wiki/specs/ia/deep-dives/13-opportunities-casting.md`
56. `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md`
57. `.memory/wiki/specs/ia/deep-dives/15-education-delivery.md`
58. `.memory/wiki/specs/ia/deep-dives/16-education-credentials-institutions.md`
59. `.memory/wiki/specs/ia/deep-dives/17-realtime-sessions.md`
60. `.memory/wiki/specs/ia/deep-dives/18-royalty-accounting.md`
61. `.memory/wiki/specs/ia/deep-dives/19-royalty-reporting-forecasting.md`
62. `.memory/wiki/specs/ia/deep-dives/20-licensing-core.md`
63. `.memory/wiki/specs/ia/deep-dives/21-specialized-licensing.md`
64. `.memory/wiki/specs/ia/deep-dives/22-release-distribution.md`
65. `.memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md`
66. `.memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md`
67. `.memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md`
68. `.memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md`
69. `.memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md`
70. `.memory/wiki/specs/ia/deep-dives/28-digital-licensing-commerce.md`
71. `.memory/wiki/specs/ia/deep-dives/29-venues-spaces.md`
72. `.memory/wiki/specs/ia/deep-dives/30-booking-contracts.md`
73. `.memory/wiki/specs/ia/deep-dives/31-live-settlement-intelligence.md`
74. `.memory/wiki/specs/ia/deep-dives/32-show-production-planning.md`
75. `.memory/wiki/specs/ia/deep-dives/33-show-day-operations.md`
76. `.memory/wiki/specs/ia/deep-dives/34-touring-operations.md`
77. `.memory/wiki/specs/ia/deep-dives/35-ticket-products-sales.md`
78. `.memory/wiki/specs/ia/deep-dives/36-box-office-risk.md`
79. `.memory/wiki/specs/ia/deep-dives/37-fanbase-direct-to-fan.md`
80. `.memory/wiki/specs/ia/deep-dives/38-promotion-marketing.md`
81. `.memory/wiki/specs/ia/deep-dives/39-analytics-ingestion-reporting.md`
82. `.memory/wiki/specs/ia/deep-dives/40-market-intelligence-signals.md`
83. `.memory/wiki/specs/ia/deep-dives/41-career-finance.md`

## Volume

| Set | Files | Lines | Bytes |
|---|---:|---:|---:|
| Parent shards + index (excl. decomposition artefacts) | 44 | ~13,400 | ~2.42 MB |
| Deep dives | 39 | 7,432 | 0.57 MB |
| **Total in scope** | **83** | **~20,800** | **~2.99 MB** |

## Gaps Found

Run completed 2026-08-05. Nothing has been remediated yet — fixes are deferred to a single pass after this report, by owner decision.

| Class | Count | Items |
|---|---:|---|
| Systemic, deterministic, whole-layer | 3 | F1 Interactions schema split (24 shards, 393/773 boilerplate ACs); F2 unreciprocated contract edges (52 of 218); F3 dangling cross-shard references (54 refs, 10 shards, 18 nonexistent shard names) |
| Agent findings upheld after adversarial refutation | 34 | 25 blocking, 9 partial |
| Agent findings refuted and discarded | 104 | 75% of the 138 raw findings |

Score: 67/344 = 19.48%. Clean shards: 2/43 (`26-gear-commerce-fulfilment.md`, `40-market-intelligence-signals.md`). Dimension 7 (Deep Dive Coverage) scored 0 — every declared deep dive exists and is substantive.

**Remediation classes** — mechanical (F3, corrupted ACs, phantom registry entities); structural but determined (F1, F2); requires owner decision (14 items — dropped ideation sub-features, undefined enums and vocabularies, unowned embargo state, rounding rule, trust tiering). See the report's Remediation classification table.

**Prior-run status:** the 2026-08-03 IA PASS (0/344) is recommended void, not superseded — its per-document table records one identical evidence string for all 43 shards, and defects mechanically detectable in seconds were present on that date.

## Execution Handoff

`audit-ambiguity-execute` consumes this file. Each of the 83 documents runs the full 3a→3b→3c cycle (read → implementer simulation → adversarial pass). No sampling, no representative subsets, no inference of a deep dive's completeness from its parent's reference to it.
