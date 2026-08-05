# FE Layer — Frontend Specifications

> **BE Source**: [be/index.md](../be/index.md)
> **IA Source**: [ia/index.md](../ia/index.md)

## Reading Order

Write feature specifications after the matching BE specification, preserving IA dependency order.

## Conventions Template

Every FE specification must include component inventory, routes/guards, state, complete interactions, responsive behavior, WCAG 2.1 AA behavior, loading/error/empty states and BE/IA source maps.

## Spec-to-Source Mapping

| # | Expected FE Spec | BE Source | IA Source | Status |
|---|---|---|---|---|
| 00 | [00-infrastructure.md](./00-infrastructure.md) | [BE](../be/00-infrastructure.md) | [IA](../ia/00-infrastructure.md) | complete |
| 01 | [01-identity-authority.md](./01-identity-authority.md) | [BE group](../be/index.md) | [IA](../ia/01-identity-authority.md) | complete |
| 02 | [02-profiles-verification.md](./02-profiles-verification.md) | [BE group](../be/index.md) | [IA](../ia/02-profiles-verification.md) | complete |
| 03 | [03-cms-content-modeling.md](./03-cms-content-modeling.md) | [BE group](../be/index.md) | [IA](../ia/03-cms-content-modeling.md) | complete |
| 04 | [04-cms-delivery-media.md](./04-cms-delivery-media.md) | [BE group](../be/index.md) | [IA](../ia/04-cms-delivery-media.md) | complete |
| 05 | [05-platform-configuration-admin.md](./05-platform-configuration-admin.md) | [BE group](../be/index.md) | [IA](../ia/05-platform-configuration-admin.md) | complete |
| 06 | [06-trust-safety.md](./06-trust-safety.md) | [BE group](../be/index.md) | [IA](../ia/06-trust-safety.md) | complete |
| 07 | [07-credits-core.md](./07-credits-core.md) | [BE group](../be/index.md) | [IA](../ia/07-credits-core.md) | complete |
| 08 | [08-credit-reporting-disclosure.md](./08-credit-reporting-disclosure.md) | [BE group](../be/index.md) | [IA](../ia/08-credit-reporting-disclosure.md) | complete |
| 09 | [09-projects-collaboration.md](./09-projects-collaboration.md) | [BE group](../be/index.md) | [IA](../ia/09-projects-collaboration.md) | complete |
| 10 | [10-rights-ownership.md](./10-rights-ownership.md) | [BE group](../be/index.md) | [IA](../ia/10-rights-ownership.md) | complete |
| 11 | [11-community-graph.md](./11-community-graph.md) | [BE group](../be/index.md) | [IA](../ia/11-community-graph.md) | complete |
| 12 | [12-community-spaces-events.md](./12-community-spaces-events.md) | [BE group](../be/index.md) | [IA](../ia/12-community-spaces-events.md) | complete |
| 13 | [13-opportunities-casting.md](./13-opportunities-casting.md) | [BE group](../be/index.md) | [IA](../ia/13-opportunities-casting.md) | complete |
| 14 | [14-services-marketplace.md](./14-services-marketplace.md) | [BE group](../be/index.md) | [IA](../ia/14-services-marketplace.md) | complete |
| 15 | 15-education-delivery.md | 15-education-delivery.md | [IA](../ia/15-education-delivery.md) | not-started |
| 16 | 16-education-credentials-institutions.md | 16-education-credentials-institutions.md | [IA](../ia/16-education-credentials-institutions.md) | not-started |
| 17 | 17-realtime-sessions.md | 17-realtime-sessions.md | [IA](../ia/17-realtime-sessions.md) | not-started |
| 18 | 18-royalty-accounting.md | 18-royalty-accounting.md | [IA](../ia/18-royalty-accounting.md) | not-started |
| 19 | 19-royalty-reporting-forecasting.md | 19-royalty-reporting-forecasting.md | [IA](../ia/19-royalty-reporting-forecasting.md) | not-started |
| 20 | 20-licensing-core.md | 20-licensing-core.md | [IA](../ia/20-licensing-core.md) | not-started |
| 21 | 21-specialized-licensing.md | 21-specialized-licensing.md | [IA](../ia/21-specialized-licensing.md) | not-started |
| 22 | 22-release-distribution.md | 22-release-distribution.md | [IA](../ia/22-release-distribution.md) | not-started |
| 23 | 23-gear-provenance-registry.md | 23-gear-provenance-registry.md | [IA](../ia/23-gear-provenance-registry.md) | not-started |
| 24 | 24-gear-holdings-operations.md | 24-gear-holdings-operations.md | [IA](../ia/24-gear-holdings-operations.md) | not-started |
| 25 | 25-gear-market-catalog.md | 25-gear-market-catalog.md | [IA](../ia/25-gear-market-catalog.md) | not-started |
| 26 | 26-gear-commerce-fulfilment.md | 26-gear-commerce-fulfilment.md | [IA](../ia/26-gear-commerce-fulfilment.md) | not-started |
| 27 | 27-digital-catalog-delivery.md | 27-digital-catalog-delivery.md | [IA](../ia/27-digital-catalog-delivery.md) | not-started |
| 28 | 28-digital-licensing-commerce.md | 28-digital-licensing-commerce.md | [IA](../ia/28-digital-licensing-commerce.md) | not-started |
| 29 | 29-venues-spaces.md | 29-venues-spaces.md | [IA](../ia/29-venues-spaces.md) | not-started |
| 30 | 30-booking-contracts.md | 30-booking-contracts.md | [IA](../ia/30-booking-contracts.md) | not-started |
| 31 | 31-live-settlement-intelligence.md | 31-live-settlement-intelligence.md | [IA](../ia/31-live-settlement-intelligence.md) | not-started |
| 32 | 32-show-production-planning.md | 32-show-production-planning.md | [IA](../ia/32-show-production-planning.md) | not-started |
| 33 | 33-show-day-operations.md | 33-show-day-operations.md | [IA](../ia/33-show-day-operations.md) | not-started |
| 34 | 34-touring-operations.md | 34-touring-operations.md | [IA](../ia/34-touring-operations.md) | not-started |
| 35 | 35-ticket-products-sales.md | 35-ticket-products-sales.md | [IA](../ia/35-ticket-products-sales.md) | not-started |
| 36 | 36-box-office-risk.md | 36-box-office-risk.md | [IA](../ia/36-box-office-risk.md) | not-started |
| 37 | 37-fanbase-direct-to-fan.md | 37-fanbase-direct-to-fan.md | [IA](../ia/37-fanbase-direct-to-fan.md) | not-started |
| 38 | 38-promotion-marketing.md | 38-promotion-marketing.md | [IA](../ia/38-promotion-marketing.md) | not-started |
| 39 | 39-analytics-ingestion-reporting.md | 39-analytics-ingestion-reporting.md | [IA](../ia/39-analytics-ingestion-reporting.md) | not-started |
| 40 | 40-market-intelligence-signals.md | 40-market-intelligence-signals.md | [IA](../ia/40-market-intelligence-signals.md) | not-started |
| 41 | 41-career-finance.md | 41-career-finance.md | [IA](../ia/41-career-finance.md) | not-started |
| 42 | 42-career-planning-risk.md | 42-career-planning-risk.md | [IA](../ia/42-career-planning-risk.md) | not-started |


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/index|IA Layer — Information Architecture]]

### References
- [[specs/ia/index|IA Layer — Information Architecture]]
