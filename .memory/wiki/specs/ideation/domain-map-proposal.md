# WeJammin — Proposed Domain Map

## Provenance and validation

Recovered from the authoritative final workflow JSON and independently reconciled against the ratified ideation index and constraints. The recovery contains **1,545 raw concepts**, **24 candidate domains**, and **24 final domains**. It passed the original **14-lens sweep** and a fresh independent four-lens audit covering marketplace boundaries, music lifecycle coverage, entity/trust boundaries, and architecture boundaries. No blockers or major omissions remain.

This is a proposal for owner review. It preserves recovered facts, ratified priorities, novelty labels, and ordering; it does not create domain folders or alter scope.

## Locked directives

- Maximal all-domain coverage; do not scope-cut the recovered map.
- Physical multi-vendor gear and instrument marketplace remains a first-class domain.
- Digital DAW plugins and adjacent digital goods marketplace remains a first-class domain.
- Venue, studio, and musician-services directory and marketplace remains first-class scope.
- Event management remains first-class scope, including live booking, production/touring, and ticketing.
- Locked stack: Astro islands, Cloudflare Pages, Cloudflare Workers, and Supabase.
- Firebase is abandoned; legacy Firebase and Next.js material is discarded.

## 25-domain overview

| # | Domain | Priority | Novelty | Purpose |
|---:|---|---|---|---|
| 01 | Identity, Profiles & Organizations | core | industry-standard | Music-industry people, organizations, roles, representation, claims, and public professional presence. |
| 02 | Credits & Attribution | core | whitespace | Verified record of who contributed what to sessions, works, and recordings. |
| 03 | Community & Networking | core | in-source | Professional social graph, collaboration discovery, introductions, and music scenes. |
| 04 | Opportunities & Casting | important | industry-standard | Demand-side workflow for gigs, auditions, briefs, applications, and hiring decisions. |
| 05 | Services Marketplace | core | in-source | Scoped buying and selling of human music work, from proposal through rights-linked acceptance. |
| 06 | Education, Lessons & Mentorship | important | industry-standard | Recurring teaching, practice, courses, mentorship, and safeguarding-aware delivery. |
| 07 | Music Projects & Collaboration | core | in-source | Music-native workspace from idea through approved, technically valid delivery. |
| 08 | Real-Time Jamming & Remote Sessions | important | industry-standard | Low-latency synchronous music, monitoring, coordination, and multitrack capture. |
| 09 | Rights & Ownership | core | industry-standard | Authoritative work and recording ownership, splits, title, identifiers, and consent. |
| 10 | Royalties & Collections | core | industry-standard | Registration, statement processing, calculations, recovery, and royalty disbursement. |
| 11 | Music Licensing | core | industry-standard | Buyer-facing permission workflows for sync, samples, covers, remixes, stems, and AI use. |
| 12 | Release & Distribution | core | industry-standard | Release construction and delivery to DSPs and stores, with lifecycle and Content ID control. |
| 13 | Gear Marketplace (Physical Goods) | core | user-directive | Multi-vendor commerce for new and used instruments and physical equipment. |
| 14 | Digital Goods & Plugin Marketplace | core | user-directive | Multi-vendor DAW plugins and digital music-product licensing, delivery, and compatibility. |
| 15 | Gear Registry & Ownership | important | whitespace | Persistent identity, provenance, recovery, service, valuation, and insurance for individual gear. |
| 16 | Venues, Studios & Spaces | core | user-directive | Canonical places directory with operational data, provenance, and bookable resources. |
| 17 | Live Booking & Settlement | core | industry-standard | Commercial show lifecycle from holds and deals through contract, settlement, and reliability. |
| 18 | Show Production & Touring | core | in-source | Operational execution from confirmed show through advancing, routing, and performance. |
| 19 | Ticketing & Box Office | important | user-directive | Admission configuration, selling, control, scanning, refunding, and reconciliation. |
| 20 | Fanbase & Direct-to-Fan | important | industry-standard | First-class fan relationships, consent, monetization, memberships, and patronage. |
| 21 | Promotion & Marketing | important | industry-standard | Campaign planning, pitching, discovery acquisition, attribution, and coverage tracking. |
| 22 | Analytics & Market Intelligence | important | in-source | Trustworthy aggregation and explanation of professional, commerce, fan, release, and live data. |
| 23 | Career, Finance & Business Management | important | in-source | Financial operations, business planning, tax readiness, and team financial visibility. |
| 24 | Trust, Safety & Disputes | core | industry-standard | Prevention, investigation, enforcement, remediation, and appeals for platform harm. |
| 25 | Content Management & Platform Configuration | core | user-directive | First-party structured content, templates/blocks, navigation, media, publishing, typed settings, and bounded admin operations. |

## Detailed domain boundaries

### 01. Identity, Profiles & Organizations

**Purpose / summary.** People and first-class organizations: multi-role professional identity, entity and membership/representation graph, claimable profiles, portfolios, and EPKs.

**Why it earns a top-level boundary.** Owns music-industry ontology and organization governance; enforcement remains a cross-cut.

**Capabilities.** Multi-role professional identity; organization and band entity model; membership and representation graph; profile, portfolio, and EPK; claiming and ownership verification; professional and credential verification.

**Sub-domains.** Multi-Role Professional Identity; Organizations & Entity Model; Band & Ensemble Governance; Membership, Teams & Mandate Scope; Representation & Roster Relationships; Profile Claiming & Ownership Verification; Professional, Union & Credential Verification; Trader vs Private Seller Classification; Act-As / Context Switching; Party Identifier Resolution; Portfolio, Media Reel & EPK; Deceased Users, Estates & Legacy Accounts.

**Personas.** Working musician; band; manager; agent; studio owner; venue operator; label; dealer/shop.

### 02. Credits & Attribution

**Purpose / summary.** Verified graph of who did what on sessions, works, and recordings, captured at creation and attested by participants.

**Why it earns a top-level boundary.** Credits are distinct from profile identity and ownership; source capture creates defensible attribution.

**Capabilities.** Credit graph and discography; session capture at creation; claiming and cold-start seeding; counter-attestation and verification; dispute resolution; role/instrument taxonomy.

**Sub-domains.** Verified Credit Graph & Discography; Session Capture Companion; Credit Claiming & Cold-Start Graph Seeding; Counter-Attestation; Credit Disputes; Credit Role & Instrument Taxonomy; Union & Performer Session Reporting; Session Attendance Proof; Contribution Ledger to DDEX RIN; Endorsements; Gear-to-Credit Linkage.

**Personas.** Session player; producer; engineer; artist; label ops; A&R; union rep.

### 03. Community & Networking

**Purpose / summary.** Music social graph: follows, activity, collaborator matching, warm introductions, private rolodex, and local, genre, and craft scenes.

**Why it earns a top-level boundary.** Owns who professionals know and what is happening; verified collaboration makes the graph meaningful.

**Capabilities.** Connection graph and follows; activity feed; collaborator matchmaking; warm intros; private rolodex CRM; community spaces and scenes; forums/Q&A and contests.

**Sub-domains.** Connections, Follows & Endorsements; Activity Feed, Ranking & Presence; Collaborator Discovery & Matchmaking; Open Collaboration Calls; Warm Introductions; Private Industry Rolodex; Open-To Status; Local Scenes; Genre & Craft Scenes; Forums & Craft Q&A; Contests and Beat Battles; Local Jam & Open Mic Discovery; Listening Sessions; Conference Networking Mode.

**Personas.** Working musician; producer; engineer; band; scene organiser; industry professional.

### 04. Opportunities & Casting

**Purpose / summary.** Demand-side work flow: gigs, dep calls, auditions, vacancies, crew jobs, applications, briefs, and camps through submission and decision.

**Why it earns a top-level boundary.** Distinct inverse of the services marketplace: requester posts a need, candidates apply, and requester chooses.

**Capabilities.** Opportunity posting and targeting; alerts and availability-aware matching; structured submission and audition; triage, shortlist, and decisioning; outcome and response tracking.

**Sub-domains.** Gig & Job Board; Gig Alerts; Dep/Sub Calls; Auditions & Casting Calls; Briefs/RFPs/Buyer-Initiated Posts; Band & Member Wanted; Crew Posts; Festival and Showcase Applications; Support Slot Pitching; Creative Briefs; Songwriting Camps; Song Catalog & Pitch One-Sheet; A&R Review Queue; Spec Work Guardrails.

**Personas.** Working musician; dep player; MD/bandleader; crew; promoter; festival booker; A&R; publisher.

### 05. Services Marketplace

**Purpose / summary.** Buying and selling human music work, including scoped proposals, escrow, revisions, delivery QC, acceptance, and rights transfer.

**Why it earns a top-level boundary.** Human output has scoped engagements and revision/acceptance economics unlike physical or digital goods.

**Capabilities.** Service listings and music pricing models; quotes/proposals and scope; order lifecycle with revisions; delivery, QC, and acceptance; escrow release ↔ rights transfer; deps, fixers, and subcontracting.

**Sub-domains.** Service Listings & Pricing; Quotes, Scope & Contracting; Order Lifecycle and Revisions; Delivery, QC & Acceptance; Escrow and Rights Transfer; Remote Session Performance; Mixing and Mastering; Production and Arrangement; Repair and Maintenance; Creative Services; Fixers and Subcontracting; Dispute Evidence.

**Personas.** Mix/mastering engineer; producer; session player; luthier/tech; artist buyer; label buyer; fixer; agency.

### 06. Education, Lessons & Mentorship

**Purpose / summary.** Teaching and learning through recurring lessons, practice, courses, mentorship, and safeguarding-aware delivery.

**Why it earns a top-level boundary.** Recurring, progress-tracked, minors-heavy relationships differ materially from service engagements.

**Capabilities.** Recurring lesson booking and packages; teacher/student matching and trials; curriculum, assignments, and practice tracking; course authoring and marketplace; mentorship programmes; safeguarding-gated delivery.

**Sub-domains.** 1:1 Lesson Booking; Teacher/Student Matching; Curriculum and Practice Tracking; Course Marketplace; Mentorship; Learning Paths and Certifications; Exam Board Alignment; Verified Teacher Profiles; Music Therapy Practice.

**Personas.** Teacher; student; parent/guardian; mentor; school/academy.

### 07. Music Projects & Collaboration

**Purpose / summary.** Workspace from idea to delivered master: song/release containers, contributors, versioned assets, review, approvals, and technical handoff.

**Why it earns a top-level boundary.** Music-native workflow produces credits and splits as a byproduct; generic task management does not.

**Capabilities.** Song/release container and stage gates; contributor roster and roles; audio version control and lineage; timestamped review and approval; mix/master workflow and deliverable specifications; validated handoff packages.

**Sub-domains.** Song and Work Entity; Release Container; Production Stage Board; Contributor Roster; Project Onboarding; Idea Capture; Lyric Workspace; Recording Sessions; Take and Comp Management; Stem and Version Lineage; Timestamped Review; Approval Gates; Mix Workflow; Mastering Workflow; Format-Specific Masters; Immersive Deliverables; Automated Audio QC; Metadata Completeness; Time Tracking; Project Export.

**Personas.** Artist; producer; mix engineer; mastering engineer; label ops; A&R; songwriter.

### 08. Real-Time Jamming & Remote Sessions

**Purpose / summary.** Synchronous networked music: low-latency jams, playable-radius matching, high-fidelity monitoring, talkback, and capture.

**Why it earns a top-level boundary.** Product destination built on a shared real-time transport pipe; latency budgeting makes collaborator matching substantive.

**Capabilities.** Low-latency jam rooms and latency budgeting; geographic peer/playable-radius matching; high-fidelity remote session monitoring; in-room talkback and cue mixes; multitrack capture of network sessions.

**Sub-domains.** Low-Latency Jam Rooms; Playable-Radius Matching; Remote Session Monitoring; Talkback and Cue Mixes; Rehearsal/Jam Capture; Multitrack Network Capture.

**Personas.** Musician; band; remote session player; mix engineer; remote client/producer; teacher.

### 09. Rights & Ownership

**Purpose / summary.** Authoritative ownership record: work/recording duality, creation-time splits, chain of title, identifiers, AI/NIL consent, and claim disputes.

**Why it earns a top-level boundary.** Rights registry captures the irrecoverable split-at-creation moment and underpins downstream income.

**Capabilities.** Work/recording ownership registry; moment-of-creation split capture and e-sign; chain of title, term, territory, and reversion; work identifier issuance; AI/likeness consent declarations; claim conflict detection and disputes.

**Sub-domains.** Work vs Recording Duality; Split Agreement; Ownership Percentage Ledger; Master Rights; Publishing Rights; Producer Points; Work-for-Hire; Chain of Title; Rights Reversion; Estate and Legacy; Moral Rights; ISRC/ISWC/UPC/GRid Issuance; Public Rights Lookup; Ownership Disputes; AI Training and Likeness Consent; NIL Rights; Proof of Creation; Sample Clearance Status.

**Personas.** Songwriter; producer; artist; publisher; label; estate/heir; rights administrator.

### 10. Royalties & Collections

**Purpose / summary.** Society registration and statement-to-payee processing: ingestion, calculation, recoupment, distributions, black-box recovery, and live reporting.

**Why it earns a top-level boundary.** Collection is operationally distinct from ownership and has independent counterparties and rejection loops.

**Capabilities.** Society registration and rejection handling; statement ingestion and normalization; royalty calculation and recoupment; split disbursement and payee statements; black-box recovery; live setlist → PRO reporting.

**Sub-domains.** PRO/CMO Registration; Mechanical Administration; Neighbouring Rights Registration; Sub-Publishing; CWR Exchange; Works Registration; Black-Box Recovery; Live Setlist Reporting; Cue Sheets; Statement Ingestion; Calculation Engine; Advances and Recoupment; Split Disbursement; Payee Statements; Statement Disputes; Escrow; Leakage Detection; Forecasting.

**Personas.** Songwriter; performer; publisher; label; manager; rights administrator; estate.

### 11. Music Licensing

**Purpose / summary.** Third parties acquiring permission to use music: sync, sample, cover, remix, stem, AI-training, and creator licences.

**Why it earns a top-level boundary.** Buyer-facing marketplace with distinct search, negotiation, clearance, and dual-licence mechanics.

**Capabilities.** Sync catalog, tagging, and supervisor search; briefs, pitching, and holds; quoting, MFN, and dual-licence coordination; clearance status and one-stop flag; sample/cover/remix/AI licence workflows; licence certificate issuance.

**Sub-domains.** Sync Marketplace; Sync Tagging; Clearance and One-Stop Status; Sync Briefs and Holds; Rate Cards and MFN; Master/Sync Coordination; Sample Clearance; Programmatic Clearance; Cover and Compulsory Licences; Remix and Stem Rights; Creator Micro-Licensing; Content ID Whitelisting; AI Training Licences; Licence Certificates.

**Personas.** Music supervisor; brand/agency; content creator; producer (sampling); publisher; label; artist.

### 12. Release & Distribution

**Purpose / summary.** Getting finished music to DSPs and stores: release build, DDEX delivery, partner status, scheduling, takedown, and Content ID.

**Why it earns a top-level boundary.** Has its own persona, asynchronous partner mechanics, and release-dashboard destination.

**Capabilities.** Release builder and metadata validation; DDEX messaging and per-partner delivery; per-store, per-territory status tracking; scheduling, pre-save, and editorial windows; takedowns and redelivery; Content ID/fingerprint registration.

**Sub-domains.** Release Builder; DDEX Messaging; DSP Store Management; Scheduling and Editorial Windows; Takedowns and Redelivery; Content ID; Identifier Assignment; Release Rollout Deadlines.

**Personas.** Artist; label ops; distributor; manager; release coordinator.

### 13. Gear Marketplace (Physical Goods)

**Purpose / summary.** Multi-vendor new/used instrument and equipment commerce with catalog, condition grades, offers, auctions, checkout, and gear freight.

**Why it earns a top-level boundary.** Owner-directed physical marketplace; non-fungible condition and physical logistics require distinct inventory and returns models.

**Capabilities.** Canonical catalog and taxonomy; condition-graded listings; offers/auctions/negotiation; multi-vendor cart and order; gear-specific freight and customs; price guide from comps; vendor storefront operations.

**Sub-domains.** Canonical Gear Catalog; Catalog Contribution; Serial Decoding; Condition Grading; Listing Lifecycle; Offers; Auctions; Multi-Vendor Checkout; Order Management; Freight and Packing; Customs and Duties; CITES Compliance; Insurance Claims; Returns/RMA/Warranty; Price Guide; Vendor Storefront; Inventory Sync; Local Pickup; Trade-In and Consignment; Rental and Backline; Parts and Consumables; Compatibility and Fitment.

**Personas.** Private seller; dealer/shop; buyer/collector; working musician; luthier; rental house.

### 14. Digital Goods & Plugin Marketplace

**Purpose / summary.** Multi-vendor DAW plugins and adjacent digital product commerce with licences, activation, compatibility, updates, and buyer libraries.

**Why it earns a top-level boundary.** Owner-directed DAW-plugin marketplace; licensing, host compatibility, piracy, and irrevocable delivery require distinct product mechanics.

**Capabilities.** Digital listings and compatibility matrix; licence issuance, activation, and seats; download/version delivery and library; sample/preset/beat catalogs with musical metadata; vendor build submission and QA; perpetual, subscription, credits, and rent-to-own monetisation.

**Sub-domains.** Digital Listings; Plugin OS/CPU/DAW Matrix; Host Dependencies; Compatibility Checker; Licence Activation and Seats; Offline/iLok DRM; Version Delivery; Desktop Library; Sample Packs; Presets; DAW Templates; Beat Licensing; Used Licence Transfer; Bundled Software Licences; Trials and Demos; Subscriptions and Rent-to-Own; Vendor Build QA; Malware and Code-Signing; Anti-Piracy; Vendor Exit Continuity.

**Personas.** Plugin developer; sample label; beatmaker; producer buyer; engineer; artist.

### 15. Gear Registry & Ownership

**Purpose / summary.** Persistent identity for individual gear: serials, ownership provenance, service history, theft status, valuation, insurance, and recording links.

**Why it earns a top-level boundary.** Gear identity outlives marketplace transactions and enables recovery, valuation, and trusted provenance.

**Capabilities.** Serial-keyed instrument identity; ownership and provenance chain; stolen registry and recovery; service/mod history; valuation and insurance schedules; rig profile and compatibility.

**Sub-domains.** Instrument Identity; Serial Registry; Ownership Chain; Stolen Gear Registry; Recovery Workflow; Service History; Modification History; Valuation; Insurance Schedules; Rig Profile; Compatibility; Credit Linkage.

**Personas.** Musician/owner; collector; studio owner; tour manager; luthier/tech; insurer; buyer.

### 16. Venues, Studios & Spaces

**Purpose / summary.** Canonical community-curated registry of music places: venue technical specifications, studios, rehearsal spaces, and trades plus bookable time.

**Why it earns a top-level boundary.** Owner-directed directory becomes useful through structured operational data, provenance, and bookable compound resources.

**Capabilities.** Canonical place records and tech specifications; claim and verification; community curation, provenance, and freshness decay; availability and space booking; compound resource booking (room + engineer + backline); enquiry/RFQ routing.

**Sub-domains.** Venue Technical Records; Studio Rooms and Acoustics; Signal Chain and Mic Locker; Engineer Staffing; Rehearsal Spaces; Trades and Facilities Directory; Room Child Entities; Claiming; Data Seeding; Community Curation; Owner/Community Conflicts; Freshness Scoring; Post-Gig Data Harvest; Space Reservations; Compound Booking; Enquiry Routing.

**Personas.** Venue operator; studio owner; rehearsal space operator; band; artist; tour manager; engineer; community editor.

### 17. Live Booking & Settlement

**Purpose / summary.** Commercial spine of a show: availability holds, offers and deal structures, contracts, deposits, radius clauses, and post-show settlement.

**Why it earns a top-level boundary.** Booking and settlement share deal terms and provide the commercial record behind draw and reliability intelligence.

**Capabilities.** Availability, holds, and challenges; offers and deal structures; contracts and deposits; settlement computed from deal + counts; expense and merch reconciliation; draw intelligence.

**Sub-domains.** Availability and Hold Ladder; Offers; Deal Structures; Contracts; Deposits; Radius Clauses; Settlement; Expenses; Merch Reconciliation; Draw Intelligence; Payment Reliability; Commission Accounting.

**Personas.** Booking agent; promoter; venue talent buyer; artist; band; manager; tour manager.

### 18. Show Production & Touring

**Purpose / summary.** Everything from confirmed to performed: advancing, riders, stage plots, setlists, crew/backline, routing, itineraries, and border compliance.

**Why it earns a top-level boundary.** Operational show execution has its own pre-performance workflow and shared live record, distinct from commercial booking.

**Capabilities.** Event lifecycle and advancing; structured riders + venue diff; setlists, stage plots, and run of show; crew and backline; routing, itinerary, and day sheets; travel, per diems, and border compliance.

**Sub-domains.** Event Lifecycle; Show Advancing; Technical and Hospitality Riders; Rider Compliance; Stage Plots; Setlists; Performer View; Run of Show; Crew Roster; Backline; Tour Routing; Itineraries; Day Sheets; Travel; Per Diems; Border Compliance; Incident Log.

**Personas.** Tour manager; production manager; FOH engineer; artist; band; promoter; venue production; crew.

### 19. Ticketing & Box Office

**Purpose / summary.** Admission commerce and control: ticket configuration, sales, presales, allocations, guests, scanning, live counts, refunds, and external reconciliation.

**Why it earns a top-level boundary.** Owner-directed event-management scope; ticket lifecycle and admission controls are distinct from booking and production.

**Capabilities.** Ticket configuration, scaling, and allocations; on-sale, presale, and announce; guest list and comps; door scanning and live counts; refunds/rescheduling; external ticketing ingestion and reconciliation.

**Sub-domains.** Ticket Configuration; Pricing and Scaling; On-Sale and Presale; Allocations; Guest List and Comps; Door Scanning; Live Counts; Refunds; Rescheduling; External Ticketing Ingestion; Reconciliation; Accessibility Tickets.

**Personas.** Promoter; venue box office; artist; door staff; fan/attendee; tour manager.

### 20. Fanbase & Direct-to-Fan

**Purpose / summary.** Artist-to-audience relationship and monetization: owned lists and consent, segmentation, superfan scoring, D2F commerce, memberships, and patronage.

**Why it earns a top-level boundary.** Fans are confirmed first-class users, not CRM records; D2F owns permanent artist/fan infrastructure.

**Capabilities.** Owned fan data and consent; segmentation and superfan scoring; broadcast channels (email/SMS/push); direct-to-fan storefront and digital sales; memberships, patronage, and crowdfunding; fan-side discovery (gated).

**Sub-domains.** Fan Profiles; Consent and Preferences; Audience Segmentation; Superfan Scoring; Email/SMS/Push Broadcasts; Artist Microsites; D2F Storefront; Digital Music Sales; Merchandising; Memberships; Patronage; Crowdfunding; Fan Discovery; Gig Alerts.

**Personas.** Artist; band; label; manager; fan; merch manager.

### 21. Promotion & Marketing

**Purpose / summary.** Reaching new audiences through campaign planning, curator/press/radio pitching, smart links, pre-save, paid distribution, and coverage tracking.

**Why it earns a top-level boundary.** Acquisition is distinct from D2F retention/commerce and analytics measurement; campaign artifacts have a defined lifespan.

**Capabilities.** Release campaign planning and deadlines; curator/press/radio pitching; contact CRM and pitch tracking; smart links, pre-save, and attribution; paid ads and creator seeding; coverage capture → EPK.

**Sub-domains.** Release Campaign Planner; Playlist Pitching; Press Outreach; Radio/DSP Editorial; Pitch Target Directory; Press CRM; Smart Links; Paid Ads; Content Calendar; Coverage Log; Event Marketing; Payola Disclosure.

**Personas.** Publicist; radio plugger; playlist pitcher; label marketing; artist; manager.

### 22. Analytics & Market Intelligence

**Purpose / summary.** Aggregating and explaining professional, commerce, fan, release, and live data into trustworthy performance, demand, and market intelligence.

**Why it earns a top-level boundary.** Measurement and insight form a dedicated decision surface; source health and provenance prevent false commercial claims.

**Capabilities.** Cross-source analytics ingestion; performance dashboards and explainability; audience/demand/market intelligence; benchmarking and forecasting; data health, coverage, and provenance; actionable recommendations.

**Sub-domains.** Data Connections; Ingestion and Normalization; Performance Dashboards; Revenue Analytics; Audience Analytics; Demand Intelligence; Market Intelligence; Benchmarking; Forecasting; Data Health; Coverage and Provenance; Recommendations.

**Personas.** Artist; manager; label; promoter; venue; agent; analytics user.

### 23. Career, Finance & Business Management

**Purpose / summary.** Running a music business: income and expense capture, budgets, cash flow, invoices, commissions, advances, tax readiness, and team finance visibility.

**Why it earns a top-level boundary.** Business management consolidates financial operational work outside marketplace payment rails and royalty collection.

**Capabilities.** Income/expense capture and reconciliation; budgets, cash flow, and scenario planning; invoicing, receivables, and payables; commission/advance/recoupment tracking; tax readiness and accountant export; business entity/team financial visibility.

**Sub-domains.** Income Capture; Expense Capture; Reconciliation; Budgets; Cash Flow; Scenario Planning; Invoices; Receivables; Payables; Commissions; Advances; Recoupment; Tax Readiness; Accountant Export; Entity Financial Visibility.

**Personas.** Artist; manager; band treasurer; label ops; tour manager; accountant; financial advisor.

### 24. Trust, Safety & Disputes

**Purpose / summary.** Preventing and resolving platform harm: moderation, enforcement/appeals, fraud/risk operations, transaction disputes, protection programs, and IP enforcement.

**Why it earns a top-level boundary.** Dedicated statutory and operator surfaces distinguish adjudication from cross-cut mechanisms; it protects money, strangers, minors, and uploads.

**Capabilities.** Report intake and moderation queues; enforcement ladder and appeals; fraud/risk scoring and ring detection; transaction disputes and mediation; buyer/seller protection and chargebacks; copyright and counterfeit enforcement.

**Sub-domains.** Report Intake; Content Moderation; Notice-and-Action; Appeals; Transparency Reporting; Trusted Flagger Channel; Fraud Rules; Account Takeover and Ban Evasion; Seller/Buyer Fraud; Card Testing; Chargebacks; Disputes and Evidence; Protection Programs; Counterfeit and Brand Protection; DMCA and Repeat Infringer; Impersonation; Minor Safety; Meetup Safety.

**Personas.** Trust and safety operator; moderator; fraud analyst; disputes specialist; buyer; seller; rights holder; reported user.

### 25. Content Management & Platform Configuration

**Purpose / summary.** A first-party WordPress-like operating system for structured content types and entries, controlled templates/blocks, menus/navigation, taxonomies/localization, media, revisions/publishing, preview/delivery, typed settings, admin operations, and portability/quality.

**Why it earns a top-level boundary.** It is a daily operator destination with ten interacting capability groups and explicit user-facing/editorial behavior. The former architecture-only “configuration” concern did not own authoring, workflow, navigation, revision, preview, or governance.

**Capabilities.** Schema registry; content lifecycle; approved block/template composition; routes and SEO; taxonomy/localization; media rights and accessibility; settings/flags governance; bounded admin workspace; content APIs, preview and cache convergence; import/export, quality, retention and erasure.

**Sub-domains.** Content Types & Schema Registry; Content Entries & Editorial Lifecycle; Templates, Blocks & Page Composition; Navigation, Routes & Discovery Metadata; Taxonomies, Localization & Relationships; Media Library & Asset Governance; Settings, Flags & Configuration Governance; Admin Workspace & Operations; Content Delivery, Preview & Cache Coherence; Portability, Governance & Quality.

**Personas.** The four primary personas consume or manage scoped self/represented-party content through owning domains. Internal platform staff are bounded account roles, not a fifth persona.

## Cross-cutting systems

| System | Purpose | Affected domains |
|---|---|---|
| Payments, Escrow & Payouts | Shared money rails, KYC/KYB, ledger, fees, refunds, and multi-party payout controls. | 13 Gear Marketplace; 14 Digital Goods; 05 Services; 16 Venues/Studios/Spaces; 17 Live Booking; 19 Ticketing; 11 Music Licensing; 10 Royalties; 20 Fanbase; 06 Education; 23 Career/Finance; 08 Real-Time Jamming. |
| Tax & Fiscal Compliance | Marketplace tax, VAT, invoicing, tax identity, seller reporting, and duties. | 13 Gear; 14 Digital Goods; 05 Services; 19 Ticketing; 11 Licensing; 16 Venues/Studios/Spaces; 20 Fanbase; 23 Career/Finance; 06 Education. |
| Contracts & E-Signature | Reusable agreement, signature, version, and evidence machinery. | 09 Rights; 05 Services; 17 Live Booking; 16 Venues/Studios/Spaces; 11 Licensing; 13 Gear; 01 Identity; 06 Education; 23 Career/Finance. |
| Atomic Payment ↔ Rights Transfer | Binds accepted delivery and money movement to required rights transfer. | 09 Rights; 05 Services; 07 Music Projects; 17 Live Booking; 10 Royalties; 14 Digital Goods; 02 Credits. |
| Availability, Scheduling & Reservation | Shared time, external calendar, scarce inventory, and reservation model. | 16 Venues/Studios/Spaces; 05 Services; 17 Live Booking; 18 Show Production; 06 Education; 13 Gear; 19 Ticketing; 04 Opportunities; 03 Community; 08 Real-Time Jamming. |
| Messaging & Contextual Inbox | Context-bound conversations, files, structured offers, and durable evidence. | 13 Gear; 05 Services; 16 Venues/Studios/Spaces; 17 Live Booking; 18 Show Production; 07 Music Projects; 03 Community; 04 Opportunities; 11 Licensing; 06 Education. |
| Notifications & Alerts | Urgent, preference-aware in-app, email, push, and SMS delivery. | 13 Gear; 14 Digital Goods; 05 Services; 17 Live Booking; 18 Show Production; 04 Opportunities; 20 Fanbase; 03 Community; 10 Royalties; 16 Venues/Studios/Spaces. |
| Reviews, Ratings & Portable Reputation | Transaction-gated reviews and cross-domain reputation signals. | 13 Gear; 14 Digital Goods; 05 Services; 16 Venues/Studios/Spaces; 17 Live Booking; 06 Education; 03 Community; 01 Identity; 24 Trust/Safety. |
| Roles, Permissions & Delegated Authority (Enforcement) | Scoped multi-entity authority enforcement and revocation. | 01 Identity; 09 Rights; 17 Live Booking; 18 Show Production; 16 Venues/Studios/Spaces; 07 Music Projects; 13 Gear; 23 Career/Finance; 20 Fanbase. |
| Media Handling & Audio Playback | Secure ingest, media processing, playback, watermarking, and large transfer. | 07 Music Projects; 01 Identity; 14 Digital Goods; 13 Gear; 11 Licensing; 05 Services; 20 Fanbase; 16 Venues/Studios/Spaces; 02 Credits; 08 Real-Time Jamming. |
| Real-Time Rooms, Presence & Audio Transport | Reusable synchronous room, presence, transport, routing, and capture primitive. | 08 Real-Time Jamming; 06 Education; 05 Services; 07 Music Projects; 03 Community; 20 Fanbase. |
| DAW & Desktop Bridge | Desktop and DAW-host boundary for capture, asset, and workflow integration. | 02 Credits; 07 Music Projects; 14 Digital Goods; 08 Real-Time Jamming; 15 Gear Registry; 22 Analytics. |
| Geo, Location & Map Discovery | Address, geocoding, local/radius/corridor discovery, and place intelligence. | 16 Venues/Studios/Spaces; 13 Gear; 05 Services; 04 Opportunities; 03 Community; 18 Show Production; 08 Real-Time Jamming; 20 Fanbase; 17 Live Booking. |
| Shipping, Fulfilment & Logistics | Carrier, labels, tracking, delivery, returns, and logistics integration. | 13 Gear; 20 Fanbase; 05 Services; 18 Show Production; 15 Gear Registry. |
| Onboarding & Role-Aware Activation | Role-specific progressive activation and first-value journeys. | 01 Identity; 02 Credits; 05 Services; 13 Gear; 14 Digital Goods; 16 Venues/Studios/Spaces; 17 Live Booking; 20 Fanbase. |
| Search & Discovery | Federated faceted retrieval, recommendations, and saved discovery across entities. | 01 Identity; 02 Credits; 03 Community; 04 Opportunities; 05 Services; 13 Gear; 14 Digital Goods; 16 Venues/Studios/Spaces; 11 Licensing; 20 Fanbase. |
| Canonical Data, Taxonomy & Entity Resolution | Shared canonical entities, vocabulary, imports, matching, and deduplication. | 01 Identity; 02 Credits; 09 Rights; 13 Gear; 14 Digital Goods; 16 Venues/Studios/Spaces; 11 Licensing; 12 Distribution; 22 Analytics. |
| Privacy, Consent & Data Portability | Consent, DSAR, erasure, portability, and sensitive-data privacy controls. | 01 Identity; 20 Fanbase; 24 Trust/Safety; 23 Career/Finance; 18 Show Production; 06 Education; 07 Music Projects; 02 Credits; 09 Rights; 15 Gear Registry; 10 Royalties. |
| Audit Log & Provenance Ledger | Tamper-evident, attributable history for regulated, financial, and contested actions. | 09 Rights; 10 Royalties; 02 Credits; 17 Live Booking; 24 Trust/Safety; 01 Identity; 13 Gear; 07 Music Projects; 23 Career/Finance. |
| Localization, Currency & Timezone | Locale, currency, time zone, and internationalized product presentation. | 13 Gear; 14 Digital Goods; 05 Services; 17 Live Booking; 18 Show Production; 10 Royalties; 11 Licensing; 16 Venues/Studios/Spaces; 23 Career/Finance. |
| Accessibility | Accessible component, content, and critical-flow behavior. | 01 Identity; 13 Gear; 07 Music Projects; 20 Fanbase; 19 Ticketing; 16 Venues/Studios/Spaces; 06 Education. |
| Integrations, Public API & Webhooks | Partner connectors, public API, and secure event delivery. | 22 Analytics; 10 Royalties; 12 Distribution; 19 Ticketing; 13 Gear; 23 Career/Finance; 18 Show Production; 14 Digital Goods; 02 Credits. |
| Public SEO Surfaces & Embeds | Indexable public pages and embeddable platform surfaces. | 16 Venues/Studios/Spaces; 13 Gear; 01 Identity; 02 Credits; 20 Fanbase; 03 Community; 11 Licensing; 14 Digital Goods. |
| Subscriptions & Entitlements | Plans, entitlement checks, billing state, and gated access. | 13 Gear; 14 Digital Goods; 05 Services; 06 Education; 20 Fanbase; 08 Real-Time Jamming; 22 Analytics. |
| Promoted Placement & Advertising | Governed paid discovery, sponsorship, and advertising disclosure. | 13 Gear; 14 Digital Goods; 05 Services; 04 Opportunities; 20 Fanbase; 21 Promotion; 03 Community. |
| Referrals, Invites & Affiliates | Invitation, attribution, incentive, and abuse-controlled referral system. | 01 Identity; 03 Community; 13 Gear; 14 Digital Goods; 05 Services; 20 Fanbase. |
| Admin, Back-Office & Support | Operators’ admin, casework, configuration, and support tooling. | 01 Identity; 13 Gear; 14 Digital Goods; 05 Services; 09 Rights; 17 Live Booking; 19 Ticketing; 24 Trust/Safety. |
| Content Management, Settings & Publishing | Structured editorial content, controlled composition, navigation, typed configuration, preview, revision, and publishing control. | 25 owns; all domains consume according to explicit bindings and settings definitions. |
| Follow, Save & Watchlist | Shared intentional-interest, collection, and alert primitives. | 03 Community; 04 Opportunities; 13 Gear; 14 Digital Goods; 11 Licensing; 20 Fanbase; 16 Venues/Studios/Spaces. |
| Bulk Import, Sync & Migration Tooling | High-volume import, mapping, validation, sync, and migration tooling. | 02 Credits; 09 Rights; 13 Gear; 16 Venues/Studios/Spaces; 10 Royalties; 12 Distribution; 22 Analytics. |
| Analytics Instrumentation & Per-Domain Reporting | Product telemetry, domain reporting, and decision-grade measurement. | 01 Identity; 03 Community; 04 Opportunities; 05 Services; 13 Gear; 14 Digital Goods; 17 Live Booking; 19 Ticketing; 20 Fanbase; 22 Analytics. |
| Safeguarding & Minor Protection | Age-aware controls, guardian flows, and minor-specific safeguards. | 06 Education; 03 Community; 20 Fanbase; 24 Trust/Safety; 04 Opportunities. |
| Offline & Low-Connectivity Field Resilience | Offline capture, synchronization, and degraded field workflows. | 18 Show Production; 19 Ticketing; 02 Credits; 15 Gear Registry; 17 Live Booking. |

## Not-product / architecture concerns and downstream routing

| Concern | Classification / rationale | Downstream routing |
|---|---|---|
| Enterprise Security Architecture, Threat Detection, WAF & Scraper Defense | Security architecture and operations, not a destination product domain. | `/create-prd-security` |
| Authentication, Session & Account Recovery Architecture | Credential, session, and recovery mechanics; profile ownership disputes remain product work. | `/create-prd-security` |
| Global CDN & availability | **99.9% monthly availability, excluding scheduled outages**; Cloudflare is a baseline, not a substitute for the service requirement. | `/create-prd-compile` (operational definition) |
| Legacy Stack (Next.js, Firebase App Hosting, Google Drive, Vite migration) | Superseded predecessor implementation material; Firebase and Next.js are discarded. | `meta/constraints.md` |
| Low-Latency Audio Transport Layer | Dedicated media architecture beneath jam and monitoring experience. | `/create-prd-architecture` |
| Audio Transcode, Analysis & Waveform Rendering Pipeline | Heavy DSP/transcode architecture beneath media experiences. | `/create-prd-architecture` |
| Money Transmission & Escrow Licensing Posture | Legal/payment-regulatory constraint for controlled funds. | `meta/constraints.md` |
| Payment Provider, Seller-of-Record & Tax Architecture | Architecture and compliance-provider choice. | `/create-prd-stack` |
| Search Infrastructure, Indexing & Retrieval Architecture | Implementation architecture beneath Search & Discovery. | `/create-prd-architecture` |
| Recommendation, Ranking & ML Infrastructure | Technical strategy beneath discovery and analytics product behavior. | `/create-prd-architecture` |
| Media Storage, CDN, DRM & Digital-Asset Infrastructure | Storage and delivery architecture beneath media and digital-goods domains. | `/create-prd-architecture` |
| Data Platform, Warehouse & ETL Infrastructure | Ingestion/warehouse architecture beneath analytics and operational domains. | `/create-prd-architecture` |
| Data Residency & Cross-Border Transfer Architecture | Privacy and cross-border compliance constraint. | `/create-prd-security` |
| Observability, SRE & Incident Response | Operational infrastructure and service-management concern. | `/create-prd-compile` |
| CI/CD, Environments & Release Engineering | Delivery-pipeline and runtime environment concern. | `/setup-workspace-cicd` |
| Feature Flags, Experiments & Configuration Runtime | Runtime evaluation, rollout, cache, and deployment machinery beneath domain 25's product behavior. | `/create-prd-architecture` |
| Design System & Component Library | Shared UI implementation infrastructure. | `/create-prd-design-system` |
| Realtime Multi-Party Sync & Collaborative Edit Conflict Resolution | Collaborative document-sync architecture, distinct from audio transport. | `/create-prd-architecture` |
| AI Fuzzy Matching & Ranking Engine | Implementation strategy beneath search, matching, and tagging product behavior. | `/create-prd-architecture` |
| Data Retention & Legal Hold Machinery | Security/privacy policy and legal-operational machinery. | `/create-prd-security` |
| Vulnerability Disclosure & Bug Bounty | Security operations process. | `/create-prd-security` |
| Rate Limiting, WAF, Bot & Scraper Defense | Merged into Enterprise Security Architecture, Threat Detection, WAF & Scraper Defense. | `/create-prd-security` |
| Fan Data Ownership, Consent & Portability | Merged into Privacy, Consent & Data Portability cross-cut. | Privacy, Consent & Data Portability |
| Audio Transport as Domain | Merged into Real-Time Rooms, Presence & Audio Transport cross-cut. | Real-Time Rooms, Presence & Audio Transport |

## Daily-use wedge

Capture provenance at the instant music is made: a project/session workflow produces verified credits and signed, machine-readable splits before memories and relationships decay. That record unlocks portable reputation, accurate ownership, rights registration, licensing, and payment-linked transfers. The map retains all user-directed marketplaces and event management; it does not substitute a generic marketplace for their distinct domain physics.

## Coverage notes

Ratified value-chain sequence: identity and credits (01–02); discovery and work demand (03–04); services and education (05–06); creation (07–08); ownership and income (09–12); physical, digital, and gear-provenance commerce (13–15); places and live-event management (16–19); fan growth and intelligence (20–22); business operation (23); safety and adjudication (24).

The evolved ideation index records 25 domains, 776 feature leaves, 230 Musts deepened, 292 Shoulds partially deepened or deeper, one responsive web/PWA surface, and the owner-locked Astro islands + Cloudflare Pages/Workers + Supabase stack. Firebase is wholly abandoned. The absent `domains-1.md` draft must not be used to cut scope; the authoritative index plus D-85 supersede recovery-era counts.

## Owner decisions recovered from the map

### Physical gear, digital goods, and human services: three domains, one marketplace, or goods/services split?

- **Options recorded:** Three domains: 13 Gear, 14 Digital Goods, and 05 Services; one Marketplace domain with heavy sub-domains; two domains: Goods and Services.
- **Recorded recommendation:** Three domains, as mapped.
- **Recorded basis:** User ratified three separate marketplace domains. Shared cart, payment, messaging, search, review, tax, and shipping belong to cross-cuts; inventory, fulfilment, and returns are irreconcilable at the domain model.

### Is the rights stack thesis or adjacency?

- **Options recorded:** All four rights domains core; all four important after directed scope; Rights core with royalties/licensing/distribution important.
- **Recorded recommendation:** User-ratified index currently retains all four as core.
- **Recorded basis:** D-10 and D-16 ratify the full rights chain as thesis. Split-at-creation, payment-rights atomicity, and recovery require the ownership chain.

### Are fans first-class users or CRM objects?

- **Options recorded:** B2B-only CRM objects; fan-facing consumer surface; deferred fan surface but first-class data model.
- **Recorded recommendation:** Fans are first-class users.
- **Recorded basis:** D-11 ratifies fan accounts, follows, gig alerts, and show discovery as live product scope; structural classification remains a single web surface.

### Is real-time jamming a top-level domain or cross-cut mechanism?

- **Options recorded:** Top-level real-time destination with shared transport cross-cut; cross-cut only; exclude real-time jamming.
- **Recorded recommendation:** Retain the top-level destination and extract shared transport.
- **Recorded basis:** D-15 ratifies Domain 08 narrowed to latency-aware matching and monitoring; shared rooms and transport are cross-cut. Dedicated media infrastructure remains an architecture constraint.

**Status: [EVOLVED — original 24-domain classification reaffirmed 2026-07-19; owner added domain 25 on 2026-08-02 via D-85]**


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-85|D-85]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-15|D-15]]
