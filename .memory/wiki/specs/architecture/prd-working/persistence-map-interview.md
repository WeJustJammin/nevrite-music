# Persistence Map Interview

> /create-prd-stack, Sub-step A. This is a feature-to-query model only; it selects no database, object store, cache, search engine, or realtime service.

## Status

- Source coverage: all 25 top-level domain indexes, the global cross-cut registry, 230 Must features, and the 42-feature CMS/settings deep dive.
- Feature-to-Query Table approved by the owner on 2026-08-02.
- **DEC-104 operating constraint:** Supabase Free provides no uptime SLA and no PITR; recovery evidence is synthetic/local only until production-verified, protected writes remain closed without it, and Cloudflare Workers Paid is the sole paid-service exception under a soft `$10/month` ceiling. No paid upgrade, overage, or add-on is authorized.
- Next: registry-first skill search, followed by store-selection options only for the query categories in this table.

## Feature-to-Query Table

| Major feature group | Find | Store | Relate | Rank/Search | Primary source |
|---|---|---|---|---|---|
| 10 Royalties & Collections | Society registrations, statements, royalty lines, recoupment and disbursement | Registration, import, normalized statement, calculation, balance and payee records | Royalty line to work/right/payee; calculation to contract/split/statement | Statement search, unmatched-line queues, financial reporting | .memory/wiki/specs/ideation/10-royalties-collections/royalties-collections-index.md |
| 11 Music Licensing | Licenses, clearances, one-stop status, quotes, negotiations and delivery | License request, clearance, rights-holder preference, quote, agreement and delivery records | License to work/right/party; negotiation to offer; agreement to payment/evidence | Catalog search, clearance status, licensing opportunity filters | .memory/wiki/specs/ideation/11-music-licensing/music-licensing-index.md |
| 12 Release & Distribution | Releases, metadata, delivery packages, DSP territories and schedules | Release, metadata, readiness check, asset package, delivery message and territory records | Release to work/assets/rights; delivery to DSP/territory; schedule to campaign | Release lookup, readiness filters, delivery exception queues | .memory/wiki/specs/ideation/12-release-distribution/release-distribution-index.md |
| 13 Gear Marketplace (Physical Goods) | Gear, condition, inventory, listings, transactions, shipping and authenticity | Gear catalog, condition, ownership, listing, order, shipping and authenticity records | Gear to owner/listing; transaction to buyer/seller/payment/dispute | Catalog search, faceted filters, price/condition ranking | .memory/wiki/specs/ideation/13-gear-marketplace/gear-marketplace-index.md |
| 14 Digital Goods & Plugin Marketplace | Digital products, licenses, entitlements, versions, downloads and compatibility | Product, version, license, entitlement, delivery, compatibility and activation records | Product to creator; purchase to entitlement; entitlement to account/device | Catalog search, compatibility filters, owned-library lookup | .memory/wiki/specs/ideation/14-digital-goods-marketplace/digital-goods-marketplace-index.md |
| 15 Gear Registry & Ownership | Instruments, provenance, ownership, theft reports, repair and collections | Instrument identity, ownership, provenance, theft, repair and visibility records | Instrument to owner; instrument to service/report/listing; provenance to evidence | Serial/identifier lookup, stolen-gear search, collection filters | .memory/wiki/specs/ideation/15-gear-registry-ownership/gear-registry-ownership-index.md |
| 16 Venues, Studios & Spaces | Places, rooms, technical specs, availability, access and amenities | Place, room, specification, availability, policy, access and amenity records | Place to organization; room to place; booking to space/specification | Location/geospatial search, capability filtering, availability | .memory/wiki/specs/ideation/16-venues-studios-spaces/venues-studios-spaces-index.md |
| 17 Live Booking & Settlement | Availability, holds, offers, contracts, settlements, advances and guarantees | Availability, hold, offer, deal, contract, settlement, payment and evidence records | Artist/venue to offer; offer to contract; settlement to payments/rights | Availability matching, booking pipeline, settlement reconciliation | .memory/wiki/specs/ideation/17-live-booking-settlement/live-booking-settlement-index.md |
| 18 Show Production & Touring | Events, bills, advances, riders, itineraries, production tasks and incidents | Event, bill, advance, rider, task, itinerary, credential and incident records | Event to venue/artist/crew; task to event/assignee; incident to evidence | Run-of-show views, task queues, tour schedule search | .memory/wiki/specs/ideation/18-show-production-touring/show-production-touring-index.md |
| 19 Ticketing & Box Office | Events, ticket inventory, presales, orders, scans, guest lists and refunds | Ticket configuration, allocation, order, credential, scan, guest-list and refund records | Ticket/order to event/buyer; scan to credential; refund to payment/dispute | On-sale lookup, inventory queries, door-validation and exception queues | .memory/wiki/specs/ideation/19-ticketing-box-office/ticketing-box-office-index.md |
| 20 Fanbase & Direct-to-Fan | Fan graph, segments, broadcasts, storefront purchases, memberships and consent | Fan relationship, consent, segment, message, order, membership and preference records | Fan to artist; consent to channel; purchase to entitlement/order | Audience segmentation, campaign targeting, supporter ranking | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/fanbase-direct-to-fan-index.md |
| 21 Promotion & Marketing | Campaigns, pitches, targets, smart links, attribution and assets | Campaign, target, pitch, outreach, link, attribution and performance records | Campaign to release; pitch to target/contact; event to attribution | Target search, campaign dashboards, attribution analysis | .memory/wiki/specs/ideation/21-promotion-marketing/promotion-marketing-index.md |
| 22 Analytics & Market Intelligence | External sources, catalog matches, charts, audience, markets and reports | Source connection, import, normalized metric, match, time-series and report records | Metric to source/entity/time; match to canonical identity/catalog | Trend analysis, market ranking, routing recommendations | .memory/wiki/specs/ideation/22-analytics-market-intelligence/analytics-market-intelligence-index.md |
| 23 Career, Finance & Business Management | Income, expenses, invoices, contracts, budgets, taxes and forecasts | Income line, expense, invoice, receivable, contract, tax and forecast records | Financial line to party/work/engagement; invoice to payment; tax to jurisdiction | Cash-flow reports, invoice aging, tax-readiness views | .memory/wiki/specs/ideation/23-career-finance-business/career-finance-business-index.md |
| 24 Trust, Safety & Disputes | Reports, cases, evidence, policies, enforcement, appeals, fraud and legal holds | Report, case, evidence snapshot, policy version, decision, sanction, appeal, risk signal and legal-hold records | Case to actor/content/transaction; decision to policy/evidence; hold to retained object | Moderation queues, risk prioritization, case history and audit reconstruction | .memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md |
| 25 Content Management & Platform Configuration | Content types, fields, entries, revisions, templates/blocks, menus/routes, taxonomies/locales, media, settings, flags, admin tasks and publication state | Immutable schema/template/entry/setting versions, typed definitions and values, navigation versions, asset references, approvals, preview grants, publish manifests and migration jobs | Content to schema/template/taxonomy/asset; CMS reference to canonical domain UUID/version; setting to allowed scope; publication to outbox/version | Admin search, revision diff, scheduled publishing, route resolution, effective-setting lookup, dependency/impact queries and delivery convergence | .memory/wiki/specs/ideation/25-content-management-platform-configuration/content-management-platform-configuration-index.md |
| 01 Identity, Profiles & Organizations | People, aliases, profiles, organizations, memberships, mandates, claims | Canonical identity, profile, organization, membership, mandate, verification and claim records | Person to profile; person to organization; organization to membership and delegated authority | Alias/name lookup, claim matching, verification queues | .memory/wiki/specs/ideation/01-identity-profiles-organizations/identity-profiles-organizations-index.md |
| 02 Credits & Attribution | Works, releases, sessions, credits, contributors, attestations and disputes | Credit graph records, session attendance, attestations, provenance tiers and correction history | Person to role to work/release/session; credit to split and rights instruments | Credit search, discography lookup, confidence/provenance filtering | .memory/wiki/specs/ideation/02-credits-attribution/credits-attribution-index.md |
| 03 Community & Networking | People, connections, communities, introductions, activity and CRM contacts | Follow, endorsement, relationship, community, feed and private-contact records | Person to person; person to community; activity to source entity | Feed ranking, collaborator discovery, warm-path matching | .memory/wiki/specs/ideation/03-community-networking/community-networking-index.md |
| 04 Opportunities & Casting | Opportunities, eligibility, submissions, auditions, shortlists, offers and outcomes | Opportunity, requirement, application, submission, review, decision and handoff records | Opportunity to publisher; submission to applicant; decision to offer/outcome | Opportunity search, eligibility filters, reviewer queues | .memory/wiki/specs/ideation/04-opportunities-casting/opportunities-casting-index.md |
| 05 Services Marketplace | Service listings, pricing, quotes, scopes, contracts, delivery and reviews | Listing, catalog, quote, scope, contract, engagement, delivery and review records | Provider to listing; buyer to quote; engagement to contract/payment/evidence | Service search, price/location filters, provider reputation | .memory/wiki/specs/ideation/05-services-marketplace/services-marketplace-index.md |
| 06 Education, Lessons & Mentorship | Teachers, students, lessons, packages, curriculum, assignments and progress | Availability, booking, lesson, package, curriculum, assignment and progress records | Teacher to learner; booking to lesson; curriculum to assignment/progress | Teacher search, availability filtering, progress reporting | .memory/wiki/specs/ideation/06-education-lessons-mentorship/education-lessons-mentorship-index.md |
| 07 Music Projects & Collaboration | Projects, songs, releases, contributors, versions, reviews and approvals | Project, work item, contributor, confidentiality, version, review and approval records | Project to assets/people; version to parent/version lineage; approval to evidence | Project filtering, work-board views, version/approval history | .memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md |
| 08 Real-Time Jamming & Remote Sessions | Session regions, peers, attendance, chat/talkback and network-quality observations | Session intent, peer, attendance, capability, network observation and fallback records | Participant to session; session to project; observation to participant/device | Peer matching by playable radius/capability; active-session presence | .memory/wiki/specs/ideation/08-realtime-jamming-remote-sessions/realtime-jamming-remote-sessions-index.md |
| 09 Rights & Ownership | Works, assets, rights, splits, agreements, conflicts and chain-of-title events | Rights registry, ownership share, split sheet, agreement, evidence and dispute records | Work/asset to right; right to party; split to verified credit and agreement | Rights lookup, conflict detection, chain-of-title reconstruction | .memory/wiki/specs/ideation/09-rights-ownership/rights-ownership-index.md |
| Global: roles, permissions and delegated authority | Actor, organization, mandate, action and scope | Authorization facts, grants, revocations and policy snapshots | Every protected record/action joins to acting context and authority source | Permission evaluation, operator reviews | ideation/ideation-cx.md |
| Global: audit and provenance ledger | State change by entity, actor, time and reason | Append-only event, hash/provenance and evidence-reference records | Every mutable domain record links to immutable provenance | As-of reconstruction, dispute and compliance queries | ideation/ideation-cx.md |
| Global: object and evidence storage | Object by owner, lifecycle, access grant and retention state | Object metadata, checksum, classification, signed-access and legal-hold records | Domain record to object metadata; immutable evidence links to case/contract | Metadata lookup, access audit, retention sweeps | ideation/ideation-cx.md |
| Global: payments, tax, subscriptions and entitlements | Payment/settlement by party, order, contract and status | Payment intent, ledger entry, tax record, entitlement and provider-event records | Provider reference to canonical transaction; entitlement to account/product | Reconciliation, payout eligibility, billing state | ideation/ideation-cx.md |
| Global: notifications and messaging | Messages/events by participant, source entity, preference and delivery status | Conversation, message, notification, preference and delivery-attempt records | Every delivery links to source event/entity and participants | Inbox, unread state, delivery retry and cadence queries | ideation/ideation-cx.md |
| Global: canonical data and taxonomy | Canonical ID, external identifier, taxonomy/version and merge history | Canonical entity, identifier, redirect, taxonomy and confidence records | All domains reference canonical UUIDs and versioned taxonomies | Identifier resolution, dedupe and entity search | ideation/ideation-cx.md |

## Candidate Query Categories (Not Decisions)

- Transactional relational state: identities, rights, contracts, payments, bookings, tickets, cases, and all workflow state requiring atomic writes.
- Object/binary state: audio, media, contracts, receipts, exports, and evidence requiring access scoping, retention, and immutable references.
- Ephemeral/realtime state: active presence, session coordination, notification delivery, and safe-degradation signals.
- Search/ranking projections: discovery, catalogues, feeds, matching, moderation queues, and analytics/reporting.
- Append-only provenance: actor-attributed state changes, evidence snapshots, provider webhooks, and audit chains.

## Questions Preserved for Store Selection

- Which object-storage provider owns ordinary media, restricted evidence, and immutable/WORM artifacts?
- Which realtime mechanism owns transient session coordination versus durable event history?
- Which search/ranking workloads stay in PostgreSQL initially, and which require a separate projection later?
- Which records require explicit cross-store consistency protocols?

## Registry-First Skill Search

The query categories were searched with the Skills CLI. No skill was installed.

| Query category | Representative registry result | Use at implementation time |
|---|---|---|
| PostgreSQL schema design | rand/cc-polymath@discover-database | Existing database-schema-design guidance remains sufficient for the PRD. |
| Object storage | caffeinelabs/skills@extension-object-storage; secondsky/claude-skills@cloudflare-r2 | Consider only if the selected storage provider needs implementation-specific help. |
| Realtime | patricio0312rev/skills@websocket-realtime-builder; nice-wolf-studio/claude-code-supabase-skills@supabase-realtime | Consider only if an approved realtime design needs implementation help. |
| PostgreSQL search | timescale/pg-aiguide@postgres | Consider after PostgreSQL full-text scope is confirmed. |
| Queues | zllovesuki/cloudflare-agent-skills@queues | Consider only after an async transport is approved. |
| Durable Objects | cloudflare/skills@durable-objects | Consider only if room coordination is approved. |

## Store-Selection Package — Confirmed (DEC-104 reconciled)

### P1 — Confirmed Coherent v1 Package

| Query category | Proposed selection | Why | Boundary / trigger to revisit |
|---|---|---|---|
| Transactional system of record | Supabase Free PostgreSQL | DEC-104 preserves the selected provider; relational transactions, row-level security, and canonical data fit the identity, rights, finance, booking, ticketing, and case workflows within Free-tier limits. | Remains canonical for all durable business records; protected writes remain closed without production-verified recovery evidence. |
| Restricted and ordinary objects | Supabase Storage | Keeps object authorization in the same RLS policy model as PostgreSQL. Free includes 1 GB of file storage; object metadata remains canonical in PostgreSQL and admissions stay within the included allowance. | Add R2 only after a measured media-volume, egress, or delivery-cost trigger and a new owner decision; no paid overage/add-on is authorized. |
| Realtime user state and fanout | Supabase Realtime | Covers broadcast, presence, and database-change delivery alongside the approved Postgres platform; it holds no canonical business state. | Introduce Durable Objects only for a proven, high-concurrency room-coordination need. Do not use it for canonical data. |
| Search and discovery | PostgreSQL full-text search plus indexed normalized/filter fields | Avoids a second search system while the initial catalog, people, credit, opportunity, venue, and marketplace search needs are still maturing. | Introduce a dedicated search projection only after an explicit relevance, latency, or scale threshold is approved. |
| Async work | Cloudflare Queues with a PostgreSQL transactional outbox and dead-letter handling | A durable database outbox preserves critical intent; the queue handles asynchronous delivery, retries, notifications, exports, and provider webhooks. | Queue messages are transport, not record of truth. A scheduled outbox sweeper recovers missed/expired delivery. |
| Room coordination | No baseline Durable Object | Supabase Realtime serves normal presence and fanout; avoiding another store reduces cross-store consistency risk. | Add Durable Objects only after a room-level coordination requirement exceeds Realtime's fit. |

### Alternatives and Tradeoffs

| Decision | Alternative | Upside | Cost / risk |
|---|---|---|---|
| Object storage | Cloudflare R2 from v1 | Lower-cost scalable media path and no egress charge from R2. | Adds authorization, signed-URL, metadata, deletion, and evidence-retention consistency work across two providers. |
| Realtime | Durable Objects from v1 | Strong single-room coordination and WebSocket control. | Adds a second stateful runtime; free-tier limits fail operations when exceeded, so it is not a shortcut to guaranteed availability. |
| Search | Dedicated search service from v1 | More specialized relevance and faceting. | Additional cost, indexing pipeline, privacy surface, and stale-projection failure modes. |
| Async | Database polling only | Fewer managed products. | Higher request latency and operational load; weaker delivery isolation than a queue plus outbox. |

### Provider Evidence

- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control): Storage uses PostgreSQL RLS policies and blocks uploads by default without a policy.
- [Supabase pricing](https://supabase.com/pricing): Free includes 500 MB database and 1 GB file storage, may pause after inactivity, and has no uptime SLA and no PITR; no paid overage/add-on is authorized.
- [Supabase Realtime](https://supabase.com/docs/guides/realtime): supports broadcast, presence, and PostgreSQL change delivery.
- [Cloudflare Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/): the Free plan includes 10,000 operations/day with 24-hour retention; queue records therefore cannot be the canonical source of truth.
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/): Free-tier operations fail when a free limit is exceeded.

### Required Confirmation

P1 store boundaries and the cross-store consistency protocol were approved on 2026-08-02 and reconciled to DEC-104 on 2026-08-30. Supabase Free remains canonical; production protected writes stay closed until recovery evidence is verified.
