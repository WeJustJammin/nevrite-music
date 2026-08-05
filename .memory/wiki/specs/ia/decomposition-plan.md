# WeJammin — IA Decomposition Plan

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Ideation Source**: [ideation-index.md](../ideation/ideation-index.md)
> **Approved**: 2026-08-02 — owner approved the recommended split and keep-together decisions
> **Project Type**: Single responsive web/PWA surface
> **Shard Count**: 43 total (1 cross-cutting + 42 feature-domain shards)
> **Status**: Approved and validated

## Readiness and Consistency

- Architecture status is approved under owner-delegated create-PRD authority.
- Architecture and ideation both classify WeJammin as one responsive web/PWA deployment surface.
- All 25 ideation domain indexes, CX files and descendant feature files were included in boundary analysis.
- Every top-level domain maps to at least one IA shard.
- The owner approval includes acknowledgment that the justified dependency boundaries produce more than 25 shards.

## Approved Split Decisions

| Decision | Source Domain | Resulting Shards | Boundary Rationale |
|---|---|---|---|
| M01 | 01 Identity & Organizations | 01 identity-authority + 02 profiles-verification | Authority graph and profile/qualification state have one-way dependencies and independent workflows. |
| M02 | 02 Credits & Attribution | 07 credits-core + 08 credit-reporting-disclosure | Canonical credit mutation is separated from external reporting and disclosure adapters. |
| M03 | 03 Community & Networking | 11 community-graph + 12 community-spaces-events | Relationship graph/read models are distinct from community/event participation state. |
| M04 | 06 Education & Mentorship | 15 education-delivery + 16 education-credentials-institutions | Lesson delivery/practice state is independent from course credential and institution governance. |
| M05 | 10 Royalties & Collections | 18 royalty-accounting + 19 royalty-reporting-forecasting | Accounting ledger transitions are separated from performance reporting and forecast projections. |
| M06 | 11 Music Licensing | 20 licensing-core + 21 specialized-licensing | Shared licence lifecycle precedes specialized legal-right pathways. |
| M07 | 13 Gear Marketplace | 25 gear-market-catalog + 26 gear-commerce-fulfilment | Catalog/listing search reads are separated from order, logistics and post-sale state machines. |
| M08 | 14 Digital Goods Marketplace | 27 digital-catalog-delivery + 28 digital-licensing-commerce | Product delivery/entitlement is separated from commercial licensing, revocation and revenue. |
| M09 | 15 Gear Registry | 23 gear-provenance-registry + 24 gear-holdings-operations | Canonical identity/provenance precedes collections, custody and operational manifests. |
| M10 | 17 Live Booking & Settlement | 30 booking-contracts + 31 live-settlement-intelligence | Pre-show contracting is separated from post-contract settlement and intelligence. |
| M11 | 18 Show Production & Touring | 32 show-production-planning + 33 show-day-operations + 34 touring-operations | Planning, live execution and multi-date touring have distinct state/risk boundaries. |
| M12 | 19 Ticketing & Box Office | 35 ticket-products-sales + 36 box-office-risk | Commercial ticket configuration/sales is separated from venue access, counts, reconciliation and abuse. |
| M13 | 25 CMS & Platform Configuration | 03 cms-content-modeling + 04 cms-delivery-media + 05 platform-configuration-admin | Authoring, public delivery/media and privileged configuration/admin are separate trust and lifecycle planes. |
| R01 | 22 Analytics & Market Intelligence | 39 analytics-ingestion-reporting + 40 market-intelligence-signals | Ingestion/reporting and derived intelligence have independent query and deployment boundaries. |
| R02 | 23 Career, Finance & Business | 41 career-finance + 42 career-planning-risk | Financial records/accounting are independent from planning, insurance and sustainability signals. |

## Approved Keep-Together Decisions

Domains 04, 05, 07, 08, 12, 16, 20, 21 and 24 remain one shard each after split review because their child areas share dense lifecycle, authority or query coupling. Domain 09 remains one shard at the no-concern threshold of six child areas.

## Domain Boundary Table

| # | Shard | Domain | Features Included | Sub-area Count | Complexity | Preliminary Type | Needs Deep Dive? | Depends On |
|---|---|---|---|---:|---|---|---|---|
| 00 | 00-infrastructure.md | Cross-cutting platform foundation | Architecture-wide auth/API/error/data/observability/deployment contracts | — | Medium | Cross-cutting | No | — |
| 01 | 01-identity-authority.md | Identity authority and party governance | 01.01–01.04, 01.09–01.10 | 6 | High | Feature domain | Yes | 00 |
| 02 | 02-profiles-verification.md | Profiles, claiming and qualifications | 01.05–01.08 | 4 | High | Feature domain | Yes | 00, 01 |
| 03 | 03-cms-content-modeling.md | CMS content modeling and authoring | 25.01–25.03, 25.05 | 4 | High | Feature domain | Yes | 00, 01 |
| 04 | 04-cms-delivery-media.md | CMS navigation, media and delivery | 25.04, 25.06, 25.09 | 3 | High | Feature domain | Yes | 00, 01, 03 |
| 05 | 05-platform-configuration-admin.md | Platform configuration, admin and quality | 25.07–25.08, 25.10 | 3 | High | Feature domain | Yes | 00, 01, 03, 04 |
| 06 | 06-trust-safety.md | Trust, safety, disputes and evidence | 24.01–24.09 | 9 | High | Feature domain | Yes | 00, 01, 05 |
| 07 | 07-credits-core.md | Credit graph, capture and confidence | 02.01–02.06 | 6 | High | Feature domain | Yes | 00, 01 |
| 08 | 08-credit-reporting-disclosure.md | Credit reporting, exchange and disclosure | 02.07–02.10 | 4 | Medium | Feature domain | No | 00, 01, 07 |
| 09 | 09-projects-collaboration.md | Music projects and collaboration | 07.01–07.09 | 9 | High | Feature domain | Yes | 00, 01, 07 |
| 10 | 10-rights-ownership.md | Rights and ownership | 09.01–09.06 | 6 | High | Feature domain | Yes | 00, 01, 07, 09 |
| 11 | 11-community-graph.md | Social graph and collaborator network | 03.01–03.05 | 5 | High | Feature domain | Yes | 00, 01, 06 |
| 12 | 12-community-spaces-events.md | Communities, participatory spaces and events | 03.06–03.11 | 6 | Medium | Feature domain | No | 00, 01, 06, 11 |
| 13 | 13-opportunities-casting.md | Opportunities and casting lifecycle | 04.01–04.07 | 7 | High | Feature domain | Yes | 00, 01, 06, 11 |
| 14 | 14-services-marketplace.md | Services marketplace lifecycle | 05.01–05.07 | 7 | High | Feature domain | Yes | 00, 01, 06, 09, 10 |
| 15 | 15-education-delivery.md | Lessons, practice and mentorship delivery | 06.01–06.03, 06.05–06.07 | 6 | High | Feature domain | Yes | 00, 01, 02, 06 |
| 16 | 16-education-credentials-institutions.md | Courses, credentials, institutions and special practice | 06.04, 06.08–06.11 | 5 | Medium | Feature domain | No | 00, 01, 02, 06, 15 |
| 17 | 17-realtime-sessions.md | Real-time jamming and remote sessions | 08.01–08.08 | 8 | High | Feature domain | Yes | 00, 01, 09 |
| 18 | 18-royalty-accounting.md | Royalty registration, ingestion, calculation and payout | 10.01–10.05, 10.08 | 6 | High | Feature domain | Yes | 00, 01, 07, 10 |
| 19 | 19-royalty-reporting-forecasting.md | Performance reporting, money-in-flight and forecasting | 10.06–10.07, 10.09–10.10 | 4 | Medium | Feature domain | No | 00, 07, 09, 18 |
| 20 | 20-licensing-core.md | Licensing core and instrument lifecycle | 11.01–11.04, 11.08 | 5 | High | Feature domain | Yes | 00, 01, 07, 10 |
| 21 | 21-specialized-licensing.md | Specialized clearances and licensing | 11.05–11.07, 11.09–11.11 | 6 | Medium | Feature domain | No | 00, 10, 20 |
| 22 | 22-release-distribution.md | Release and distribution lifecycle | 12.01–12.08 | 8 | High | Feature domain | Yes | 00, 07, 09, 10, 20 |
| 23 | 23-gear-provenance-registry.md | Gear identity, provenance and recovery | 15.01–15.03, 15.05, 15.09 | 5 | High | Feature domain | Yes | 00, 01, 07 |
| 24 | 24-gear-holdings-operations.md | Gear collections, rigs, custody and manifests | 15.04, 15.06–15.08, 15.10 | 5 | Medium | Feature domain | No | 00, 01, 23 |
| 25 | 25-gear-market-catalog.md | Gear catalog, listings and market data | 13.01–13.04, 13.12–13.13 | 6 | High | Feature domain | Yes | 00, 01, 06, 23 |
| 26 | 26-gear-commerce-fulfilment.md | Gear transactions, fulfilment and possession models | 13.05–13.11 | 7 | High | Feature domain | Yes | 00, 06, 14, 24, 25 |
| 27 | 27-digital-catalog-delivery.md | Digital catalog, entitlement, delivery and vendor QA | 14.01–14.04, 14.08 | 5 | High | Feature domain | Yes | 00, 01, 06, 10 |
| 28 | 28-digital-licensing-commerce.md | Digital licensing, commerce, revocation and revenue | 14.05–14.07, 14.09–14.10 | 5 | High | Feature domain | Yes | 00, 06, 10, 18, 27 |
| 29 | 29-venues-spaces.md | Venues, studios and spaces | 16.01–16.07 | 7 | High | Feature domain | Yes | 00, 01, 06, 24 |
| 30 | 30-booking-contracts.md | Booking, negotiation and contracts | 17.01–17.07, 17.14 | 8 | High | Feature domain | Yes | 00, 01, 06, 11, 29 |
| 31 | 31-live-settlement-intelligence.md | Agency, settlement and live-market intelligence | 17.08–17.13 | 6 | High | Feature domain | Yes | 00, 06, 18, 30 |
| 32 | 32-show-production-planning.md | Event production planning and advancing | 18.01–18.05, 18.19 | 6 | High | Feature domain | Yes | 00, 09, 24, 29, 30 |
| 33 | 33-show-day-operations.md | Show-day execution and recovery | 18.06–18.10, 18.16–18.18 | 8 | High | Feature domain | Yes | 00, 06, 17, 32 |
| 34 | 34-touring-operations.md | Tour routing, logistics, finance and reporting | 18.11–18.15, 18.20 | 6 | High | Feature domain | Yes | 00, 24, 31, 32, 33 |
| 35 | 35-ticket-products-sales.md | Ticket products, sales, access packages and delivery | 19.01–19.03, 19.08, 19.11–19.12 | 6 | High | Feature domain | Yes | 00, 06, 29, 30 |
| 36 | 36-box-office-risk.md | Door access, box office, reconciliation and ticketing risk | 19.04–19.07, 19.09–19.10 | 6 | High | Feature domain | Yes | 00, 06, 33, 35 |
| 37 | 37-fanbase-direct-to-fan.md | Fanbase and direct-to-fan | 20.01–20.07 | 7 | High | Feature domain | Yes | 00, 01, 06, 11, 22, 35 |
| 38 | 38-promotion-marketing.md | Promotion and marketing | 21.01–21.09 | 9 | High | Feature domain | Yes | 00, 11, 22, 37 |
| 39 | 39-analytics-ingestion-reporting.md | Analytics ingestion, matching and reporting | 22.01–22.02, 22.05, 22.08 | 4 | High | Feature domain | Yes | 00, 01, 07, 22, 35, 38 |
| 40 | 40-market-intelligence-signals.md | Market intelligence, fraud and scouting signals | 22.03–22.04, 22.06–22.07 | 4 | High | Feature domain | Yes | 00, 06, 39 |
| 41 | 41-career-finance.md | Career finance and business operations | 23.01–23.04, 23.06–23.07 | 6 | High | Feature domain | Yes | 00, 14, 18, 26, 28, 31 |
| 42 | 42-career-planning-risk.md | Career planning, insurance and sustainability | 23.05, 23.08–23.09 | 3 | Medium | Feature domain | No | 00, 40, 41 |

## Dependency Bands

1. **Foundation and governance (00–06):** infrastructure, canonical identity, CMS/configuration and trust/safety.
2. **Creative provenance and participation (07–17):** credits, projects, rights, community, opportunities, services, education and realtime sessions.
3. **Rights exploitation and release (18–22):** royalties, licensing and distribution.
4. **Physical/digital commerce and live operations (23–36):** gear registries/markets, digital goods, venues, booking, production, touring and ticketing.
5. **Audience, growth and intelligence (37–42):** fanbase, promotion, analytics and career/business management.

Dependencies point only to lower-numbered shards. No circular dependency is approved.

## Surface Applicability

All shards apply to the single responsive web/PWA surface. System-only flows remain in the same deployment surface and are identified by route family during architecture-spec authoring.

## Coverage Contract

- The feature ledger must assign every ideation feature to exactly one shard using the source prefixes in the boundary table.
- All 230 Must features must have an IA shard assignment before validation can pass.
- 00-infrastructure is architecture-sourced and intentionally has no ideation feature IDs.
- Deep-dive skeletons are created only for rows marked **Yes**.

## Next Structure Action

Generate the IA shard skeletons and IA/BE/FE/master indexes, then run dependency, load, deep-dive and feature-ledger validation.

## Related Specs

- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ideation/ideation-index|WeJammin Ideation Index]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ideation/ideation-index|Ideation Index — WeJammin]]
