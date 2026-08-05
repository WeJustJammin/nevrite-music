# IA Layer — Information Architecture

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Plan**: [decomposition-plan.md](decomposition-plan.md)
> **Surface**: Single responsive web/PWA

## Reading Order

Read 00-infrastructure first, then feature shards in numerical dependency order. Dependencies only point to lower-numbered shards.

## Shards

| # | Shard | Source Boundary | Surface | Type | Status | Deep Dive |
|---|---|---|---|---|---|---|
| 00 | [00-infrastructure.md](00-infrastructure.md) | Cross-cutting platform foundation | web/PWA | Cross-cutting | ✅ Complete | — |
| 01 | [01-identity-authority.md](01-identity-authority.md) | Identity authority and party governance | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/01-identity-authority.md) |
| 02 | [02-profiles-verification.md](02-profiles-verification.md) | Profiles, claiming and qualifications | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/02-profiles-verification.md) |
| 03 | [03-cms-content-modeling.md](03-cms-content-modeling.md) | CMS content modeling and authoring | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/03-cms-content-modeling.md) |
| 04 | [04-cms-delivery-media.md](04-cms-delivery-media.md) | CMS navigation, media and delivery | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/04-cms-delivery-media.md) |
| 05 | [05-platform-configuration-admin.md](05-platform-configuration-admin.md) | Platform configuration, admin and quality | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/05-platform-configuration-admin.md) |
| 06 | [06-trust-safety.md](06-trust-safety.md) | Trust, safety, disputes and evidence | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/06-trust-safety.md) |
| 07 | [07-credits-core.md](07-credits-core.md) | Credit graph, capture and confidence | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/07-credits-core.md) |
| 08 | [08-credit-reporting-disclosure.md](08-credit-reporting-disclosure.md) | Credit reporting, exchange and disclosure | web/PWA | Feature domain | ✅ Complete | — |
| 09 | [09-projects-collaboration.md](09-projects-collaboration.md) | Music projects and collaboration | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/09-projects-collaboration.md) |
| 10 | [10-rights-ownership.md](10-rights-ownership.md) | Rights and ownership | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/10-rights-ownership.md) |
| 11 | [11-community-graph.md](11-community-graph.md) | Social graph and collaborator network | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/11-community-graph.md) |
| 12 | [12-community-spaces-events.md](12-community-spaces-events.md) | Communities, participatory spaces and events | web/PWA | Feature domain | ✅ Complete | — |
| 13 | [13-opportunities-casting.md](13-opportunities-casting.md) | Opportunities and casting lifecycle | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/13-opportunities-casting.md) |
| 14 | [14-services-marketplace.md](14-services-marketplace.md) | Services marketplace lifecycle | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/14-services-marketplace.md) |
| 15 | [15-education-delivery.md](15-education-delivery.md) | Lessons, practice and mentorship delivery | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/15-education-delivery.md) |
| 16 | [16-education-credentials-institutions.md](16-education-credentials-institutions.md) | Courses, credentials, institutions and special practice | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/16-education-credentials-institutions.md) |
| 17 | [17-realtime-sessions.md](17-realtime-sessions.md) | Real-time jamming and remote sessions | web/PWA + specialized runtime | Feature domain | ✅ Complete | [deep dive](deep-dives/17-realtime-sessions.md) |
| 18 | [18-royalty-accounting.md](18-royalty-accounting.md) | Royalty registration, ingestion, calculation and payout | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/18-royalty-accounting.md) |
| 19 | [19-royalty-reporting-forecasting.md](19-royalty-reporting-forecasting.md) | Performance reporting, money-in-flight and forecasting | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/19-royalty-reporting-forecasting.md) |
| 20 | [20-licensing-core.md](20-licensing-core.md) | Licensing core and instrument lifecycle | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/20-licensing-core.md) |
| 21 | [21-specialized-licensing.md](21-specialized-licensing.md) | Specialized clearances and licensing | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/21-specialized-licensing.md) |
| 22 | [22-release-distribution.md](22-release-distribution.md) | Release and distribution lifecycle | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/22-release-distribution.md) |
| 23 | [23-gear-provenance-registry.md](23-gear-provenance-registry.md) | Gear identity, provenance and recovery | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/23-gear-provenance-registry.md) |
| 24 | [24-gear-holdings-operations.md](24-gear-holdings-operations.md) | Gear collections, rigs, custody and manifests | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/24-gear-holdings-operations.md) |
| 25 | [25-gear-market-catalog.md](25-gear-market-catalog.md) | Gear catalog, listings and market data | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/25-gear-market-catalog.md) |
| 26 | [26-gear-commerce-fulfilment.md](26-gear-commerce-fulfilment.md) | Gear transactions, fulfilment and possession models | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/26-gear-commerce-fulfilment.md) |
| 27 | [27-digital-catalog-delivery.md](27-digital-catalog-delivery.md) | Digital catalog, entitlement, delivery and vendor QA | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/27-digital-catalog-delivery.md) |
| 28 | [28-digital-licensing-commerce.md](28-digital-licensing-commerce.md) | Digital licensing, commerce, revocation and revenue | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/28-digital-licensing-commerce.md) |
| 29 | [29-venues-spaces.md](29-venues-spaces.md) | Venues, studios and spaces | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/29-venues-spaces.md) |
| 30 | [30-booking-contracts.md](30-booking-contracts.md) | Booking, negotiation and contracts | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/30-booking-contracts.md) |
| 31 | [31-live-settlement-intelligence.md](31-live-settlement-intelligence.md) | Agency, settlement and live-market intelligence | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/31-live-settlement-intelligence.md) |
| 32 | [32-show-production-planning.md](32-show-production-planning.md) | Event production planning and advancing | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/32-show-production-planning.md) |
| 33 | [33-show-day-operations.md](33-show-day-operations.md) | Show-day execution and recovery | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/33-show-day-operations.md) |
| 34 | [34-touring-operations.md](34-touring-operations.md) | Tour routing, logistics, finance and reporting | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/34-touring-operations.md) |
| 35 | [35-ticket-products-sales.md](35-ticket-products-sales.md) | Ticket products, sales, access packages and delivery | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/35-ticket-products-sales.md) |
| 36 | [36-box-office-risk.md](36-box-office-risk.md) | Door access, box office, reconciliation and ticketing risk | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/36-box-office-risk.md) |
| 37 | [37-fanbase-direct-to-fan.md](37-fanbase-direct-to-fan.md) | Fanbase and direct-to-fan | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/37-fanbase-direct-to-fan.md) |
| 38 | [38-promotion-marketing.md](38-promotion-marketing.md) | Promotion and marketing | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/38-promotion-marketing.md) |
| 39 | [39-analytics-ingestion-reporting.md](39-analytics-ingestion-reporting.md) | Analytics ingestion, matching and reporting | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/39-analytics-ingestion-reporting.md) |
| 40 | [40-market-intelligence-signals.md](40-market-intelligence-signals.md) | Market intelligence, fraud and scouting signals | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/40-market-intelligence-signals.md) |
| 41 | [41-career-finance.md](41-career-finance.md) | Career finance and business operations | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/41-career-finance.md) |
| 42 | [42-career-planning-risk.md](42-career-planning-risk.md) | Career planning, insurance and sustainability | web/PWA | Feature domain | ✅ Complete | — |

## Conventions

- Every shard must define features, user interactions, data model, access control, accessibility and edge cases.
- Cross-shard dependencies are bidirectional in skeleton metadata and directional in the approved plan.
- Complex shards receive a referenced deep-dive skeleton under deep-dives/.
- Status progression: 🔲 Skeleton → 📝 Draft → 👀 Review → ✅ Complete.
- The next authoring target is always the lowest-numbered pending shard.
