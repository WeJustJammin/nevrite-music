# Ambiguity Audit Scope — IA

- **Invocation:** `/audit-ambiguity ia` — fresh rerun 1
- **Date:** 2026-08-28
- **Scope:** ia
- **Status:** PASS — 0/344 = 0.00% ambiguity. Report: `2026-08-28-ia-ambiguity-rerun-1.md`
- **Declared document count:** 83
- **Processed:** 83/83
- **Enumeration rule:** `.memory/wiki/specs/ia/index.md` + every numbered shard listed in that index + every Markdown file under `.memory/wiki/specs/ia/deep-dives/`.
- **Enumeration gate:** PASS. Filesystem contains 46 Markdown files directly under `ia/`: 43 numbered shards, `index.md`, and two decomposition provenance artifacts. The 39 deep-dive files match the index exactly.
- **Excluded provenance artifacts:** `.memory/wiki/specs/ia/decomposition-plan.md`, `.memory/wiki/specs/ia/decomposition-validation.md`. Neither is a numbered shard, the IA index, or a deep dive.
- **Freshness:** current working-tree source was read independently; no prior score or per-document verdict was reused.

## Rubric Files

- `/home/rob/Projects/WeJammin/.agents/skills/pipeline-rubrics/references/ia-rubric.md`
- `/home/rob/Projects/WeJammin/.agents/skills/pipeline-rubrics/references/scoring.md`

## Scoped Documents

### IA index and numbered shards — 44

- `.memory/wiki/specs/ia/index.md`
- `.memory/wiki/specs/ia/00-infrastructure.md`
- `.memory/wiki/specs/ia/01-identity-authority.md`
- `.memory/wiki/specs/ia/02-profiles-verification.md`
- `.memory/wiki/specs/ia/03-cms-content-modeling.md`
- `.memory/wiki/specs/ia/04-cms-delivery-media.md`
- `.memory/wiki/specs/ia/05-platform-configuration-admin.md`
- `.memory/wiki/specs/ia/06-trust-safety.md`
- `.memory/wiki/specs/ia/07-credits-core.md`
- `.memory/wiki/specs/ia/08-credit-reporting-disclosure.md`
- `.memory/wiki/specs/ia/09-projects-collaboration.md`
- `.memory/wiki/specs/ia/10-rights-ownership.md`
- `.memory/wiki/specs/ia/11-community-graph.md`
- `.memory/wiki/specs/ia/12-community-spaces-events.md`
- `.memory/wiki/specs/ia/13-opportunities-casting.md`
- `.memory/wiki/specs/ia/14-services-marketplace.md`
- `.memory/wiki/specs/ia/15-education-delivery.md`
- `.memory/wiki/specs/ia/16-education-credentials-institutions.md`
- `.memory/wiki/specs/ia/17-realtime-sessions.md`
- `.memory/wiki/specs/ia/18-royalty-accounting.md`
- `.memory/wiki/specs/ia/19-royalty-reporting-forecasting.md`
- `.memory/wiki/specs/ia/20-licensing-core.md`
- `.memory/wiki/specs/ia/21-specialized-licensing.md`
- `.memory/wiki/specs/ia/22-release-distribution.md`
- `.memory/wiki/specs/ia/23-gear-provenance-registry.md`
- `.memory/wiki/specs/ia/24-gear-holdings-operations.md`
- `.memory/wiki/specs/ia/25-gear-market-catalog.md`
- `.memory/wiki/specs/ia/26-gear-commerce-fulfilment.md`
- `.memory/wiki/specs/ia/27-digital-catalog-delivery.md`
- `.memory/wiki/specs/ia/28-digital-licensing-commerce.md`
- `.memory/wiki/specs/ia/29-venues-spaces.md`
- `.memory/wiki/specs/ia/30-booking-contracts.md`
- `.memory/wiki/specs/ia/31-live-settlement-intelligence.md`
- `.memory/wiki/specs/ia/32-show-production-planning.md`
- `.memory/wiki/specs/ia/33-show-day-operations.md`
- `.memory/wiki/specs/ia/34-touring-operations.md`
- `.memory/wiki/specs/ia/35-ticket-products-sales.md`
- `.memory/wiki/specs/ia/36-box-office-risk.md`
- `.memory/wiki/specs/ia/37-fanbase-direct-to-fan.md`
- `.memory/wiki/specs/ia/38-promotion-marketing.md`
- `.memory/wiki/specs/ia/39-analytics-ingestion-reporting.md`
- `.memory/wiki/specs/ia/40-market-intelligence-signals.md`
- `.memory/wiki/specs/ia/41-career-finance.md`
- `.memory/wiki/specs/ia/42-career-planning-risk.md`

### Deep dives — 39

- `.memory/wiki/specs/ia/deep-dives/01-identity-authority.md`
- `.memory/wiki/specs/ia/deep-dives/02-profiles-verification.md`
- `.memory/wiki/specs/ia/deep-dives/03-cms-content-modeling.md`
- `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md`
- `.memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md`
- `.memory/wiki/specs/ia/deep-dives/06-trust-safety.md`
- `.memory/wiki/specs/ia/deep-dives/07-credits-core.md`
- `.memory/wiki/specs/ia/deep-dives/09-projects-collaboration.md`
- `.memory/wiki/specs/ia/deep-dives/10-rights-ownership.md`
- `.memory/wiki/specs/ia/deep-dives/11-community-graph.md`
- `.memory/wiki/specs/ia/deep-dives/13-opportunities-casting.md`
- `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md`
- `.memory/wiki/specs/ia/deep-dives/15-education-delivery.md`
- `.memory/wiki/specs/ia/deep-dives/16-education-credentials-institutions.md`
- `.memory/wiki/specs/ia/deep-dives/17-realtime-sessions.md`
- `.memory/wiki/specs/ia/deep-dives/18-royalty-accounting.md`
- `.memory/wiki/specs/ia/deep-dives/19-royalty-reporting-forecasting.md`
- `.memory/wiki/specs/ia/deep-dives/20-licensing-core.md`
- `.memory/wiki/specs/ia/deep-dives/21-specialized-licensing.md`
- `.memory/wiki/specs/ia/deep-dives/22-release-distribution.md`
- `.memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md`
- `.memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md`
- `.memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md`
- `.memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md`
- `.memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md`
- `.memory/wiki/specs/ia/deep-dives/28-digital-licensing-commerce.md`
- `.memory/wiki/specs/ia/deep-dives/29-venues-spaces.md`
- `.memory/wiki/specs/ia/deep-dives/30-booking-contracts.md`
- `.memory/wiki/specs/ia/deep-dives/31-live-settlement-intelligence.md`
- `.memory/wiki/specs/ia/deep-dives/32-show-production-planning.md`
- `.memory/wiki/specs/ia/deep-dives/33-show-day-operations.md`
- `.memory/wiki/specs/ia/deep-dives/34-touring-operations.md`
- `.memory/wiki/specs/ia/deep-dives/35-ticket-products-sales.md`
- `.memory/wiki/specs/ia/deep-dives/36-box-office-risk.md`
- `.memory/wiki/specs/ia/deep-dives/37-fanbase-direct-to-fan.md`
- `.memory/wiki/specs/ia/deep-dives/38-promotion-marketing.md`
- `.memory/wiki/specs/ia/deep-dives/39-analytics-ingestion-reporting.md`
- `.memory/wiki/specs/ia/deep-dives/40-market-intelligence-signals.md`
- `.memory/wiki/specs/ia/deep-dives/41-career-finance.md`

## Gaps Fixed

- Removed the synthetic decomposition-plan contract/event links from Shards 00 and 01. The provenance plan defines no `## Contracts` or `## Event Schemas` section and is not a runtime contract producer.
- Closed four malformed inline-code spans around DMCA `512` / `512(g)` text in Shard 06 and its deep dive, restoring the six-column TSE-12 interaction row and stable rendering.
- No product or architecture decision was required.
- The historical 3/344 score is not rewritten after remediation. A new invocation must rescore current source.

## Related Specs

### Constrained by

- [[specs/ia/index|IA Layer — Information Architecture]]

### References

- [[specs/audits/2026-08-28-ia-ambiguity-report|IA Ambiguity Audit — Fresh Run 2026-08-28]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/index|IA Layer — Information Architecture]]
- [[specs/audits/2026-08-28-ia-ambiguity-report|IA Ambiguity Audit — Fresh Run (2026-08-28)]]
