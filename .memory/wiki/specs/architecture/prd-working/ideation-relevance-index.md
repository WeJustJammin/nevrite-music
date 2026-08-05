# Ideation Relevance Index

> Source record for create-prd-stack. Every top-level domain index and CX document was read before architecture decisions are presented.

## Required Sources Read

- Global constraints: .memory/wiki/specs/ideation/meta/constraints.md
- Product inventory and locked decisions: .memory/wiki/specs/ideation/ideation-index.md
- Cross-domain mechanisms: .memory/wiki/specs/ideation/ideation-cx.md
- Domain coverage: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 indexes and CX maps.
- Domain 25 coverage: content-management-platform-configuration index/CX, all 10 sub-domain indexes/CX files, and all 42 leaf specifications.
- Must deep-read coverage: all 230 Must-have leaf specifications, synthesized per stack axis in architecture/prd-working/stack-synthesis.md.

## Stack-Axis Relevance

| Axis | Requirements considered | High-signal sources |
|---|---|---|
| Web delivery and API boundary | Astro islands, SSR edge handlers, future native client consumes contracts, p95 target, continuous availability, isolated admin/public APIs, published CMS projections | constraints Project Surfaces; 01, 02, 04, 07, 17, 24–25 |
| Relational data and transactions | identity, rights, credits, booking, payment, settlement, audit provenance, legal holds, immutable CMS schema/content/settings versions | 01, 02, 05, 09–19, 23–25; global audit/payment/permissions contracts |
| Authorization and authentication | person/org acting context, delegated mandate, staff/operator separation, admin capabilities, step-up, counterparty roles | 01, 03, 05, 07, 17, 20, 24–25; global roles/permissions contract |
| Object and evidence storage | audio/media, editorial assets/renditions, contracts, receipts, evidence locker, signed access, WORM retention | 02, 05, 07, 09, 11–15, 24–25; global object/evidence contract |
| Background and event processing | notifications, split capture, payouts, delivery state, moderation, webhooks, schedules, migrations and cache invalidation | global notifications, payments, messaging, audit; 02, 04–7, 10–14, 17–25 |
| Search, discovery, analytics | people, credits, opportunities, catalogues, venues, fan/audience, intelligence, admin search and published content | 01–4, 11–16, 20–22, 25 |
| Realtime and collaboration | session attendance, project coauthoring, presence, safe degradation, messaging, editor conflict/status refresh | 02, 07, 08, 18, 25; global messaging/notifications |
| CI/CD and release governance | content-schema migrations, block/template compatibility, settings-definition drift, deployment-safe rollback and preview isolation | constraints CI/CD; 25.01, 25.03, 25.07, 25.09–25.10 |
| Observability and security | immutable audit, privacy controls, abuse/risk, DMCA, admin actions, publish convergence, stale flags/routes/assets and settings rollback | 01, 05, 09, 14, 20, 23–25; constraints Compliance |
| Content management and configuration | structured editorial types, revisions/workflow, controlled composition, navigation, media governance, typed settings, bounded admin, preview/delivery and portability | domain 25 index/CX plus all 25.01–25.10 indexes and 42 leaf specifications |

## Decision Constraints

- Existing architecture locks: Cloudflare Pages + Workers and Supabase; do not replace them without a decision-propagation workflow.
- Cost: $0/month pre-revenue. Select free-tier-compatible primitives and define admission controls before paid overages.
- Reliability: 99.9% monthly availability, excluding scheduled outages. Use managed, multi-zone services where available; document degraded-mode behavior and planned maintenance.
- Performance: normal first-party web interactions must maintain p95 below two seconds. Favor edge delivery, cached reads, targeted queries, and asynchronous non-critical work.
- Compliance: design for US state privacy controls, provider-minimized PCI scope, ESIGN/UETA audit trails, DMCA baseline, and provider-managed payout onboarding.
- CMS boundary: first-party and settings-first; no plugins, themes, arbitrary code, CMS-local identity/roles, or generic storage for canonical transactional domains.
