# IA Ambiguity Audit — Fresh Run (2026-08-28)

**Verdict: FAIL — 0.87% ambiguity (3/344). All three defects were mechanically remediated, but this run cannot clear the layer. A separate fresh IA audit is required.**

## Coverage

| Measure | Result |
|---|---:|
| Scoped documents | 83 |
| Documents read in full | 83/83 |
| Numbered shards scored | 43 |
| Rubric dimensions per shard | 8 |
| Applicable score cells | 344 |
| IA index | 1/1 processed |
| Deep dives | 39/39 processed directly |
| Parent feature boundaries | 252 |
| User/system flows | 803 |
| Data-model rows | 736 |
| Access-role/capability rows | 348 |
| Given/When/Then acceptance criteria | 803 |
| Flow-specific edge-case triads | 803 |

The filesystem enumeration gate passed. The two non-scoped root files, `decomposition-plan.md` and `decomposition-validation.md`, are decomposition provenance artifacts rather than the IA index, numbered shards, or deep dives.

## Method

Every scoped document received the mandatory implementer simulation, rubric pass, and devil's-advocate refutation pass. The implementer simulation attempted to derive feature boundaries, principals/capabilities, typed records and relationships, ordered flow behavior, failures, cross-shard inputs/outputs, destructive/concurrent/invalid-input outcomes, and executable acceptance criteria without external decisions.

Scoring follows the loaded rubric: ✅ = 0, ⚠️ = 0.5, ❌ = 1. One score applies per `(numbered shard, dimension)` cell; a deep-dive defect scores against its owning shard's Deep Dive Coverage cell. Support documents are processed individually but do not create additional denominator cells.

## Score

| # | Dimension | Points | Evidence |
|---|---|---:|---|
| 1 | Feature Enumeration | 0/43 | All 246 ideation Level-1 boundaries appear in exactly one or more IA feature lists; all 231 current MUST-ledger rows collapse to 108 prefixes and every prefix is represented in IA bodies. |
| 2 | Access Model | 0/43 | Every shard has named principals/capabilities, allowed actions, explicit denials, and a named escalation path. |
| 3 | Data Model | 0/43 | All shards provide models plus typed-field/cardinality registries; 736 model rows were derivable. |
| 4 | User Flows | 1/43 | Shard 06 TSE-12 rendered as a malformed interaction row because an inline-code span swallowed column separators. |
| 5 | Cross-Shard Contracts | 2/43 | Shards 00 and 01 cited nonexistent `decomposition-plan.md#contracts` and `#event-schemas` sections. |
| 6 | Edge Cases | 0/43 | All 803 flows have concurrent-access, invalid-input/authority, and deletion/revocation/cascade outcomes. |
| 7 | Deep Dive Coverage | 0/43 | All 39 referenced deep dives exist and contain choices/rationale, phasing, failure/recovery, fields, and integration contracts; four shards intentionally reference no deep dive. |
| 8 | Testability | 0/43 | All 803 flow criteria use Given/When/Then with explicit failure behavior; no subjective `should work`, `fast`, or `handle gracefully` criterion survived. |
| | **Total** | **3/344** | **0.87% ambiguity** |

## Per-Document Execution Ledger

### IA index

| Document | Result | Evidence |
|---|---|---|
| `index.md` | ✅ support pass | Enumerates 43 numbered shards and 39 existing deep dives; statuses and source boundaries are explicit. |

### Numbered shards

| Document | Result | Implementer-simulation evidence |
|---|---|---|
| `00-infrastructure.md` | ❌ 7/8 (D5) | 6 feature boundaries; 12 flows; 23 model rows; 12 GWT criteria; 12 edge triads; two dead provenance anchors forced contract-source inference. |
| `01-identity-authority.md` | ❌ 7/8 (D5) | 6 feature boundaries; 18 flows; 18 model rows; 18 GWT criteria; 18 edge triads; two dead provenance anchors forced contract-source inference. |
| `02-profiles-verification.md` | ✅ 8/8 | 4 feature boundaries; 16 flows; 16 model rows; 16 GWT criteria; 16 edge triads. |
| `03-cms-content-modeling.md` | ✅ 8/8 | 4 feature boundaries; 16 flows; 20 model rows; 16 GWT criteria; 16 edge triads. |
| `04-cms-delivery-media.md` | ✅ 8/8 | 3 feature boundaries; 14 flows; 15 model rows; 14 GWT criteria; 14 edge triads. |
| `05-platform-configuration-admin.md` | ✅ 8/8 | 3 feature boundaries; 14 flows; 17 model rows; 14 GWT criteria; 14 edge triads. |
| `06-trust-safety.md` | ❌ 7/8 (D4) | 9 feature boundaries; 26 flows; 26 model rows; 26 GWT criteria; 26 edge triads; TSE-12's malformed inline code collapsed its interaction cells. |
| `07-credits-core.md` | ✅ 8/8 | 6 feature boundaries; 19 flows; 19 model rows; 19 GWT criteria; 19 edge triads. |
| `08-credit-reporting-disclosure.md` | ✅ 8/8 | 4 feature boundaries; 14 flows; 19 model rows; 14 GWT criteria; 14 edge triads. |
| `09-projects-collaboration.md` | ✅ 8/8 | 9 feature boundaries; 25 flows; 28 model rows; 25 GWT criteria; 25 edge triads. |
| `10-rights-ownership.md` | ✅ 8/8 | 6 feature boundaries; 20 flows; 22 model rows; 20 GWT criteria; 20 edge triads. |
| `11-community-graph.md` | ✅ 8/8 | 5 feature boundaries; 18 flows; 18 model rows; 18 GWT criteria; 18 edge triads. |
| `12-community-spaces-events.md` | ✅ 8/8 | 6 feature boundaries; 13 flows; 15 model rows; 13 GWT criteria; 13 edge triads. |
| `13-opportunities-casting.md` | ✅ 8/8 | 7 feature boundaries; 20 flows; 21 model rows; 20 GWT criteria; 20 edge triads. |
| `14-services-marketplace.md` | ✅ 8/8 | 7 feature boundaries; 19 flows; 22 model rows; 19 GWT criteria; 19 edge triads. |
| `15-education-delivery.md` | ✅ 8/8 | 6 feature boundaries; 16 flows; 19 model rows; 16 GWT criteria; 16 edge triads. |
| `16-education-credentials-institutions.md` | ✅ 8/8 | 5 feature boundaries; 16 flows; 18 model rows; 16 GWT criteria; 16 edge triads. |
| `17-realtime-sessions.md` | ✅ 8/8 | 8 feature boundaries; 18 flows; 17 model rows; 18 GWT criteria; 18 edge triads. |
| `18-royalty-accounting.md` | ✅ 8/8 | 6 feature boundaries; 21 flows; 21 model rows; 21 GWT criteria; 21 edge triads. |
| `19-royalty-reporting-forecasting.md` | ✅ 8/8 | 4 feature boundaries; 12 flows; 8 model rows; 12 GWT criteria; 12 edge triads. |
| `20-licensing-core.md` | ✅ 8/8 | 5 feature boundaries; 19 flows; 17 model rows; 19 GWT criteria; 19 edge triads. |
| `21-specialized-licensing.md` | ✅ 8/8 | 6 feature boundaries; 15 flows; 14 model rows; 15 GWT criteria; 15 edge triads. |
| `22-release-distribution.md` | ✅ 8/8 | 8 feature boundaries; 22 flows; 23 model rows; 22 GWT criteria; 22 edge triads. |
| `23-gear-provenance-registry.md` | ✅ 8/8 | 5 feature boundaries; 16 flows; 14 model rows; 16 GWT criteria; 16 edge triads. |
| `24-gear-holdings-operations.md` | ✅ 8/8 | 5 feature boundaries; 16 flows; 13 model rows; 16 GWT criteria; 16 edge triads. |
| `25-gear-market-catalog.md` | ✅ 8/8 | 6 feature boundaries; 21 flows; 15 model rows; 21 GWT criteria; 21 edge triads. |
| `26-gear-commerce-fulfilment.md` | ✅ 8/8 | 7 feature boundaries; 22 flows; 14 model rows; 22 GWT criteria; 22 edge triads. |
| `27-digital-catalog-delivery.md` | ✅ 8/8 | 5 feature boundaries; 24 flows; 13 model rows; 24 GWT criteria; 24 edge triads. |
| `28-digital-licensing-commerce.md` | ✅ 8/8 | 5 feature boundaries; 18 flows; 12 model rows; 18 GWT criteria; 18 edge triads. |
| `29-venues-spaces.md` | ✅ 8/8 | 7 feature boundaries; 22 flows; 17 model rows; 22 GWT criteria; 22 edge triads. |
| `30-booking-contracts.md` | ✅ 8/8 | 8 feature boundaries; 34 flows; 28 model rows; 34 GWT criteria; 34 edge triads. |
| `31-live-settlement-intelligence.md` | ✅ 8/8 | 6 feature boundaries; 23 flows; 15 model rows; 23 GWT criteria; 23 edge triads. |
| `32-show-production-planning.md` | ✅ 8/8 | 6 feature boundaries; 16 flows; 14 model rows; 16 GWT criteria; 16 edge triads. |
| `33-show-day-operations.md` | ✅ 8/8 | 8 feature boundaries; 18 flows; 13 model rows; 18 GWT criteria; 18 edge triads. |
| `34-touring-operations.md` | ✅ 8/8 | 6 feature boundaries; 17 flows; 13 model rows; 17 GWT criteria; 17 edge triads. |
| `35-ticket-products-sales.md` | ✅ 8/8 | 6 feature boundaries; 22 flows; 15 model rows; 22 GWT criteria; 22 edge triads. |
| `36-box-office-risk.md` | ✅ 8/8 | 6 feature boundaries; 21 flows; 15 model rows; 21 GWT criteria; 21 edge triads. |
| `37-fanbase-direct-to-fan.md` | ✅ 8/8 | 7 feature boundaries; 24 flows; 22 model rows; 24 GWT criteria; 24 edge triads. |
| `38-promotion-marketing.md` | ✅ 8/8 | 9 feature boundaries; 28 flows; 20 model rows; 28 GWT criteria; 28 edge triads. |
| `39-analytics-ingestion-reporting.md` | ✅ 8/8 | 4 feature boundaries; 16 flows; 15 model rows; 16 GWT criteria; 16 edge triads. |
| `40-market-intelligence-signals.md` | ✅ 8/8 | 4 feature boundaries; 14 flows; 13 model rows; 14 GWT criteria; 14 edge triads. |
| `41-career-finance.md` | ✅ 8/8 | 6 feature boundaries; 19 flows; 15 model rows; 19 GWT criteria; 19 edge triads. |
| `42-career-planning-risk.md` | ✅ 8/8 | 3 feature boundaries; 9 flows; 7 model rows; 9 GWT criteria; 9 edge triads. |

### Deep dives

| Document | Result | Direct-read evidence |
|---|---|---|
| `deep-dives/01-identity-authority.md` | ✅ support pass | 236 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/02-profiles-verification.md` | ✅ support pass | 211 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/03-cms-content-modeling.md` | ✅ support pass | 203 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/04-cms-delivery-media.md` | ✅ support pass | 191 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/05-platform-configuration-admin.md` | ✅ support pass | 191 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/06-trust-safety.md` | ✅ support pass | 220 lines; choices, phasing, failures, fields, and contracts verified; one inline-code typo was mechanical, not a forced decision. |
| `deep-dives/07-credits-core.md` | ✅ support pass | 157 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/09-projects-collaboration.md` | ✅ support pass | 216 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/10-rights-ownership.md` | ✅ support pass | 203 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/11-community-graph.md` | ✅ support pass | 162 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/13-opportunities-casting.md` | ✅ support pass | 173 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/14-services-marketplace.md` | ✅ support pass | 187 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/15-education-delivery.md` | ✅ support pass | 161 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/16-education-credentials-institutions.md` | ✅ support pass | 177 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/17-realtime-sessions.md` | ✅ support pass | 174 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/18-royalty-accounting.md` | ✅ support pass | 148 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/19-royalty-reporting-forecasting.md` | ✅ support pass | 96 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/20-licensing-core.md` | ✅ support pass | 128 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/21-specialized-licensing.md` | ✅ support pass | 108 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/22-release-distribution.md` | ✅ support pass | 127 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/23-gear-provenance-registry.md` | ✅ support pass | 103 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/24-gear-holdings-operations.md` | ✅ support pass | 164 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/25-gear-market-catalog.md` | ✅ support pass | 187 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/26-gear-commerce-fulfilment.md` | ✅ support pass | 174 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/27-digital-catalog-delivery.md` | ✅ support pass | 161 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/28-digital-licensing-commerce.md` | ✅ support pass | 166 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/29-venues-spaces.md` | ✅ support pass | 261 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/30-booking-contracts.md` | ✅ support pass | 362 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/31-live-settlement-intelligence.md` | ✅ support pass | 272 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/32-show-production-planning.md` | ✅ support pass | 189 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/33-show-day-operations.md` | ✅ support pass | 194 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/34-touring-operations.md` | ✅ support pass | 184 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/35-ticket-products-sales.md` | ✅ support pass | 222 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/36-box-office-risk.md` | ✅ support pass | 194 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/37-fanbase-direct-to-fan.md` | ✅ support pass | 285 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/38-promotion-marketing.md` | ✅ support pass | 339 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/39-analytics-ingestion-reporting.md` | ✅ support pass | 218 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/40-market-intelligence-signals.md` | ✅ support pass | 226 lines; choices, phasing, failures, fields, and contracts verified. |
| `deep-dives/41-career-finance.md` | ✅ support pass | 223 lines; choices, phasing, failures, fields, and contracts verified. |

Coverage completeness gate: **PASS — 83/83 processed; zero skipped documents.**

## Findings That Survived Adversarial Refutation

### F01 — Shard 00 · D5 Cross-Shard Contracts · ❌

The contract map linked `decomposition-plan.md#contracts` and `decomposition-plan.md#event-schemas`, but the provenance file contains neither section. An implementer cannot consume or publish a contract at either cited boundary.

**Remediation:** removed the synthetic provenance entry. Shard 00 retains only real shard contract producers/consumers.

### F02 — Shard 01 · D5 Cross-Shard Contracts · ❌

Shard 01 duplicated the same two nonexistent decomposition-plan anchors. The dead references violate the specific-section citation rule and force an implementer to invent whether the plan is normative contract source.

**Remediation:** removed the synthetic provenance entry. The decomposition plan remains available as decomposition history, not a runtime contract surface.

### F03 — Shard 06 · D4 User Flows · ❌

TSE-12's required-behavior cell opened an inline-code span at `512(g)` and never closed it. Markdown parsing swallowed the following column separators, collapsing the six-column interaction row and preventing a stable separation between behavior, completion, and failure/recovery.

**Remediation:** closed the TSE-12 inline-code span in the interaction and acceptance criterion. Three related `512` formatting defects in scope reconciliation and the deep dive were also closed mechanically.

## Devil's-Advocate Refutations

- **Shard 30↔35 is not a reciprocity gap.** Shard 35 cites Shard 30 `§ Contracts` and `§ Event Schemas`; Shard 30 explicitly acknowledges Shard 35 as the DEC-098 callback producer while declaring no read dependency. This is the locked inbound-command exception already used by Shards 02/04/08/13, not a missing dependency.
- **The two interaction table shapes are not a flow-schema split.** Across 803 rows, both shapes carry preconditions, ordered required behavior/success, completion where separate, and failure/recovery. Every row maps to a concrete GWT criterion and an edge triad.
- **The 230-vs-231 ideation summary count does not create an IA coverage hole.** The current MoSCoW ledger contains 231 unique MUST rows across 108 Level-1 prefixes; all 108 prefixes occur in IA feature boundaries and bodies. The stale summary count belongs to an upstream vision audit and is not scored against IA.
- **The four Shards with no deep dive are not missing references.** The index explicitly records `—` for Shards 00, 08, 12, and 42; dimension 7 requires every referenced deep dive to exist, and all 39 references do.

## Remediation Classification

| Finding | Class | Decision required | Applied |
|---|---|---|---|
| F01 | Mechanical dead-link removal | No | Yes |
| F02 | Mechanical dead-link removal | No | Yes |
| F03 | Mechanical Markdown delimiter repair | No | Yes |

No scoped product or architecture judgment remains. Per the freshness gate, the source fixes do not retroactively change this run's score.

## Cross-Layer Consistency

Not applicable. The scoring reference mandates IA→BE, BE→FE, IA→FE, and error-state mapping checks only for BE, FE, or `all` scope.

## Validation

- Current-source structural rerun: 83 scoped documents, 43 parents, 39 deep dives, zero broken local links/anchors, zero malformed Markdown table rows, and zero unbalanced inline-code spans.
- Spec graph refresh: `node .memory/pipeline/compile.mjs` exited 0 with 1,399 nodes, 9,580 edges, and 49 warnings / zero errors; neither new audit artifact is orphaned.
- Progress consistency: `node scripts/check-progress-consistency.mjs` exited 0 with `No progress files yet — nothing to verify.`
- Patch hygiene: `git diff --check` exited 0.
- Full package validation: unavailable. `pnpm validate` exited 1 with `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` because this specification-stage checkout has no `package.json`, `package.yaml`, or `package.json5`.

## Final Verdict and Constrained Next Step

**FAIL for advancement on this run.** Remediation is complete, but the next valid command is a new invocation of `/audit-ambiguity ia`. Do not advance to the next pipeline layer until that fresh run independently returns 0/344.

## Related Specs

### Constrained by

- [[specs/ia/index|IA Layer — Information Architecture]]
- [[specs/audits/audit-scope|Ambiguity Audit Scope — IA]]

### References

- [[specs/ideation/ideation-index|Ideation Index]]
- [[specs/ideation/moscow-ledger|MoSCoW Ledger]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/index|IA Layer — Information Architecture]]
- [[specs/audits/audit-scope|Ambiguity Audit Scope — IA]]
- [[specs/ideation/ideation-index|Ideation Index — WeJammin]]
- [[specs/ideation/moscow-ledger|WeJammin — MoSCoW Ledger]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
