# IA Ambiguity Audit — Fresh Combined Final Report (2026-09-02)

> **Verdict**: PASS — 344/344 IA checkpoints; 0/344 ambiguity (0.00%).
> **Scope**: 83 IA-layer documents processed: 43 parent shards scored, 39 referenced deep dives, and the IA index as supporting inventory.
> **Freshness**: Four separate final batch reruns were read from current disk after remediation; no inherited verdict was used.

## Verdict

**PASS — 344/344 checkpoints; 0/344 ambiguity (0.00%); 0 warnings; 0 fails.**

All 43 parent shards scored all eight applicable IA dimensions. Every final batch artifact reports a uniform pass, and the combined shard union is exactly 00–42 with no overlap or omission.

## Scope and freshness

- Documents processed: **83** = 43 parent shard specifications + 39 indexed deep dives + the supporting [IA index](../ia/index.md#shards).
- Parent coverage: every current IA index row 00–42 was scored; deep-dive coverage follows the index `Deep Dive` column. Shards 00, 08, 12 and 42 explicitly require no deep dive after convergence; the other 39 have matching deep dives.
- Review mode: each final batch reread its full parent documents, referenced deep dives, reciprocal contract-map counterparts, and relevant authoritative ideation index/domain children. This was full-document review, not sampling or mechanical-only scoring.
- Current-disk source inventory was independently checked against the IA index: 43/43 parent links present, 39/39 deep-dive links present, 0 missing, 0 unlisted, and every processed document non-empty.
- Final rerun statements explicitly reject inherited scoring: Batch A records no inherited IA40 verdict, Batch B imports no prior score, and Batch C uses no prior batch verdict; Batch D records a direct post-remediation current-disk read. This synthesis uses only those final rerun results and current inventory verification.

## IA rubric

Each applicable checkpoint uses the two-implementer test and the project scoring convention: ✅ = 0 ambiguity points/pass, ⚠️ = 0.5/warning, ❌ = 1/fail; ambiguity percentage = points / applicable checkpoints × 100.

| Dimension | Exact IA rubric dimension |
| --------- | ------------------------- |
| D1        | Feature Enumeration       |
| D2        | Access Model              |
| D3        | Data Model                |
| D4        | User Flows                |
| D5        | Cross-Shard Contracts     |
| D6        | Edge Cases                |
| D7        | Deep Dive Coverage        |
| D8        | Testability               |

Rubric inputs read: /home/rob/Projects/WeJammin/.agents/skills/audit-ambiguity/SKILL.md; /home/rob/Projects/WeJammin/.agents/skills/audit-ambiguity-rubrics/SKILL.md; /home/rob/Projects/WeJammin/.agents/skills/audit-ambiguity-execute/SKILL.md; /home/rob/Projects/WeJammin/.agents/skills/pipeline-rubrics/SKILL.md; /home/rob/Projects/WeJammin/.agents/skills/pipeline-rubrics/references/scoring.md; /home/rob/Projects/WeJammin/.agents/skills/pipeline-rubrics/references/ia-rubric.md.

## Batch membership and coverage

| Batch        | Parent shards                              | Parents | Applicable checkpoints | Final evidence                                                 |
| ------------ | ------------------------------------------ | ------: | ---------------------: | -------------------------------------------------------------- |
| A            | 00, 04, 08, 12, 16, 20, 24, 28, 32, 36, 40 |      11 |                     88 | [Batch A final rerun](/tmp/wejammin-ia-audit-batch-a-rerun.md) |
| B            | 01, 05, 09, 13, 17, 21, 25, 29, 33, 37, 41 |      11 |                     88 | [Batch B final rerun](/tmp/wejammin-ia-audit-batch-b-rerun.md) |
| C            | 02, 06, 10, 14, 18, 22, 26, 30, 34, 38, 42 |      11 |                     88 | [Batch C final rerun](/tmp/wejammin-ia-audit-batch-c-rerun.md) |
| D            | 03, 07, 11, 15, 19, 23, 27, 31, 35, 39     |      10 |                     80 | [Batch D final rerun](/tmp/wejammin-ia-audit-batch-d-rerun.md) |
| **Combined** | **00–42 exactly once**                     |  **43** |                **344** | **All four final reruns**                                      |

## Per-shard checkpoint scores

Every matrix cell is pass/applicable (`✅ 1/1`); the source artifact for each row is identified in the batch column.

| Batch | Shard |     D1 |     D2 |     D3 |     D4 |     D5 |     D6 |     D7 |     D8 |   Total |
| ----- | ----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | -----: | ------: |
| A     |    00 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    04 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    08 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    12 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    16 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    20 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    24 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    28 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    32 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    36 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| A     |    40 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    01 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    05 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    09 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    13 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    17 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    21 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    25 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    29 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    33 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    37 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| B     |    41 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    02 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    06 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    10 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    14 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    18 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    22 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    26 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    30 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    34 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    38 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| C     |    42 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    03 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    07 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    11 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    15 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    19 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    23 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    27 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    31 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    35 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |
| D     |    39 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | ✅ 1/1 | **8/8** |

## Dimension summary

| Dimension                |    Pass | Applicable | Ambiguity points |
| ------------------------ | ------: | ---------: | ---------------: |
| D1 Feature Enumeration   |      43 |         43 |                0 |
| D2 Access Model          |      43 |         43 |                0 |
| D3 Data Model            |      43 |         43 |                0 |
| D4 User Flows            |      43 |         43 |                0 |
| D5 Cross-Shard Contracts |      43 |         43 |                0 |
| D6 Edge Cases            |      43 |         43 |                0 |
| D7 Deep Dive Coverage    |      43 |         43 |                0 |
| D8 Testability           |      43 |         43 |                0 |
| **Total**                | **344** |    **344** |            **0** |

## Final batch evidence

| Batch | Current-disk score/evidence anchors                                                                                                                                           | Current read-inventory anchor                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A     | Score matrix lines 15–29; per-parent evidence lines 45–149; IA40 vocabulary closure lines 151–156; reciprocal-edge check lines 158–162; no-findings punch-list lines 164–166. | `/tmp/wejammin-ia-audit-batch-a-rerun.md:168–382` (194 unique current files).               |
| B     | Score table lines 18–34; full-document evidence anchors lines 36–54; Shard 01 reciprocal edges lines 56–66; no-findings punch-list lines 68–70.                               | `/tmp/wejammin-ia-audit-batch-b-rerun.md:72–580` (476 unique current files).                |
| C     | Score/evidence lines 18–59; reciprocal-edge verification lines 61–70; score and punch-list lines 72–80.                                                                       | `/tmp/wejammin-ia-audit-batch-c-rerun.md:82–502` (384 current IA/deep-dive/ideation files). |
| D     | Score/evidence lines 14–55; twelve reciprocal edges lines 57–76; no-findings punch-list lines 78–81.                                                                          | `/tmp/wejammin-ia-audit-batch-d-rerun.md:83–404` (296 current IA/deep-dive/ideation files). |

The batch inventories are supporting read sets and may contain authoritative ideation children beyond the 83 scored/supporting IA-layer documents. They do not expand the scored checkpoint denominator.

## Remediation closure and separate fresh reruns

### Reciprocal contract-map remediation

- Batch B separately verified the repaired Shard 01 ↔ Shards 03, 07 and 23 boundaries, including `#contracts` and `#event-schemas` anchors and canonical ownership, at the [final B artifact](/tmp/wejammin-ia-audit-batch-b-rerun.md) lines 56–66.
- Batch C separately verified the repaired Shard 10 ↔ 07 and Shard 18 ↔ 19 reciprocal boundaries at the [final C artifact](/tmp/wejammin-ia-audit-batch-c-rerun.md) lines 61–70.
- Batch D separately verified twelve repaired reciprocal boundaries, with source and target map lines both anchor-complete, at the [final D artifact](/tmp/wejammin-ia-audit-batch-d-rerun.md) lines 57–76.
- Batch A separately checked the current Shard 40 map and its current counterparts in Shards 06, 39 and 42 at the [final A artifact](/tmp/wejammin-ia-audit-batch-a-rerun.md) lines 158–162.

These checks were performed after reciprocal-edge remediation and then rescored in separate fresh reruns; no prior reciprocal verdict was carried forward.

### IA40 purpose-vocabulary remediation

The IA40 open vocabulary was remediated before the separate Batch A rerun. Current evidence now defines `DiscoverabilityPurposeV1` at registry version 1 as exactly `findable-for-hire`, `findable-for-collaboration`, and `watchable-for-evaluation`, and rejects aliases, unknown members and other versions before persistence, query or fire. The final A verification cites:

- [40-market-intelligence-signals.md](../ia/40-market-intelligence-signals.md):22, 52, 66–69, 90, 96, 106–110, 132–153, 168, 223–230.
- [22.07.04-scouted-artist-visibility-consent.md](../ideation/22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07.04-scouted-artist-visibility-consent.md):53–57, 101, 118.
- [Final A rerun](/tmp/wejammin-ia-audit-batch-a-rerun.md):151–156.

Decision after remediation and fresh reread: **PASS**; no IA40 vocabulary ambiguity remains.

## Current IA source inventory verification

The canonical current inventory is [`.memory/wiki/specs/ia/index.md`](../ia/index.md#shards):13–57.

| Inventory check                               | Current result                                                   |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Indexed parent rows                           | 43                                                               |
| Filesystem parent shard files                 | 43                                                               |
| Indexed deep-dive links                       | 39                                                               |
| Filesystem deep-dive files                    | 39                                                               |
| Missing indexed parents                       | 0                                                                |
| Missing indexed deep dives                    | 0                                                                |
| Unlisted parent files                         | 0                                                                |
| Unlisted deep-dive files                      | 0                                                                |
| Non-empty processed documents                 | 83/83                                                            |
| Combined bytes (index + parents + deep dives) | 4,065,544                                                        |
| Combined lines                                | 22,038                                                           |
| Current sorted-manifest SHA-256               | e30825a64f4cc2ce903a0e2e0d0f2e5e5c650ba74fd146b2989702a7f0c11a56 |

The 43 parent rows are the complete 00–42 membership listed in the batch table above. The index's four no-deep-dive rows are 00, 08, 12 and 42; the remaining 39 indexed deep-dive links resolve to current files.

## Warning/fail punch-list

**None.** The four final batch artifacts report 0 warnings and 0 fails, and no ambiguous decision remains. No additional source-path/line remediation is pending.

## Audit disposition

IA is clear on current disk. Reciprocal-edge remediation and IA40 vocabulary remediation were each followed by separate fresh reruns; all 344 applicable checkpoints pass. This report is the only repository file written by this task.
