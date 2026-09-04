# Stack Synthesis

> Evidence record for create-prd-stack. All original 195 Must-have leaf specifications were read on 2026-08-02; the 35 new CMS/settings Musts and 7 Shoulds were deep-read during the D-85 evolution. Bullets below record per-axis implications before stack decisions.

## Source Coverage

- Must-have leaf specifications processed: 195 of 195.
- Domain indexes, domain CX maps, global constraints, global cross-cuts, and the feature/priority ledgers were read before this synthesis.

## Hosting and edge delivery

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: ## Edge Cases / Failure Modes
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: ### Edge Cases / Failure Modes
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: 1. The person record itself (01.01.01) — always present, always context #1, never removable. 2. Each alias they own (01.01.02) — and exactly one person owns an alias, always (01.01.02 D-04, which closed their Q-01). There is no co-owned alias to admit here: th
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: | Class | Cadence | System behaviour | Example | |---|---|---|---| | static | never | No confirmation age. Never prompted | Founding year, legal name | | slow | 365 days | Confirmation age shown past 182 days; flagged past 365 | Address, accessibility, license
## Persistence and transactional integrity

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: # Feature: Person Record & Multi-Role Facets
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: The names a person releases, performs and is credited under — modelled as first-class objects, not as a string on the person record. One human routinely holds several: a legal name used on contracts, a session-credit name, and one or more artist aliases with t
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: The acting party is not cosmetic. It determines who is contractually bound, who is credited, whose legal identity a disclosure moment discloses (CX-05), and where money lands. A wrong acting party on a split attestation produces exactly the unfalsifiable recor
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: | Role | Access | What They See/Do | |------|--------|-------------------| | Musician | Full | Creates and edits a band. Fills band-specific attributes: genre, home city, catalogue, the alias(es) it releases under, whether it is available to book. Does not fil
## Authentication and authorization

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: # Feature: Person Record & Multi-Role Facets
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: > Number: 01.01.02 > Parent: [Person Identity & Roles](./01.01-person-identity-roles-index.md) > Status: [DEEP] > Last updated: 2026-07-23
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: # Feature: Acting Context Switcher
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: ## Role Lens
## Object and evidence storage

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: The record has two independent axes, and conflating them is the error this file exists to prevent:
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: Scope boundary — three seams this file does not cross: - Shared names are not aliases. The moment a name is co-owned by 2+ people it is a band org (D-04) and governance is 01.04's. This file owns the routing, not the governance. - "Project" is not a third enti
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: Scope boundary: this file owns the product half — the context list, how it is derived, how the switch is made visible, what it changes, and what the platform does when the wrong one is used. The enforcement half (propagating the acting party through every call
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: | # | Hypothesis | Source | Outcome | |---|-----------|--------|---------| | DT-01 | One organization table with a type enum and every type's attributes as nullable columns | The obvious model — and exactly the anti-pattern D-14 already rejected for marketplac
## Background and event processing

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: | Scenario | What Happens | User Sees | |----------|-------------|-----------| | User removes a facet with live obligations (open listings, a future lesson, an unsigned split sheet) | Removal blocked, not silently cascaded — deleting a facet must never delete 
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: 1. Musician opens "Release under a different name" from their settings, or from any release/credit flow that asks which name to use. 2. They enter a display name (Polygon Window). System asks the one question that decides the model: "Is anyone else in this?" —
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: What the ratified band default does to source #3 (01.03.03 D-07..D-10, DQ-02.4/.5/.6/.7). For a band, every confirmed permanent member is seeded with all seven activities up to USD 1,000, so the context appears at the moment they confirm and nobody configures 
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: The taxonomy of non-human parties and what each type actually carries. A band has a catalogue and the alias it releases under; a venue has a licensed capacity, a load-in and a curfew; a studio has rooms, gear and rates; a label has an imprint and a release sch
## Search, discovery, and analytics

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: Instrument is not a facet (D-10). A drummer is performer; "drums" is a descriptor. Facet-level instruments would produce ~40 facets each revealing the identical surface set — the rule forbids it, and the highest-volume search on the platform ("need a bassist f
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: | # | Scenario | What Happens | User Sees | |---|----------|-------------|-----------| | E-01 | Two different humans use the same alias display name (collision, not a shared alias) | Not blocked. Name collisions are legal reality in music and the platform is n
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: At ≥8 contexts a type-ahead filter appears above the list, matching on display name, substring, case-insensitive, filtering on each keystroke. Below 8 the list renders in full with no filter.
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: | Property | Values | What it decides | Resolves | |---|---|---|---| | Scope | party · type | Whether the value is one-per-entity (address, legal name, contact routing) or one-per-type (rates, capacity, hours). Union collisions are only possible on party scope
## Realtime collaboration

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: The record exists to solve one problem: personas.md states the Musician's Unique Constraint as "their roles are simultaneous, not sequential. Any UX forcing 'are you an artist OR a producer OR a seller?' fails them immediately." Every competitor's identity mod
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: The names a person releases, performs and is credited under — modelled as first-class objects, not as a string on the person record. One human routinely holds several: a legal name used on contracts, a session-credit name, and one or more artist aliases with t
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: | Role | Access | What They See/Do | |------|--------|-------------------| | Musician | Full | Switches between self, each alias (01.01.02), each band/org they hold a mandate for (01.03.03), and each party they represent (01.03.02). The current context is show
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: | Role | Access | What They See/Do | |------|--------|-------------------| | Musician | Full | Creates and edits a band. Fills band-specific attributes: genre, home city, catalogue, the alias(es) it releases under, whether it is available to book. Does not fil
## Observability and security

- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md: | Facet | Asserts | Reveals | Common descriptors under it | |---|---|---|---| | performer | Plays or sings, on record or stage | 04 Opportunities (as available player) · 07 Projects (join as contributor) · 08 Jamming · 12 Release (as display artist) · 17 Live 
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md: | # | Scenario | What Happens | User Sees | |---|----------|-------------|-----------| | E-01 | Two different humans use the same alias display name (collision, not a shared alias) | Not blocked. Name collisions are legal reality in music and the platform is n
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md: What the ratified band default does to source #3 (01.03.03 D-07..D-10, DQ-02.4/.5/.6/.7). For a band, every confirmed permanent member is seeded with all seven activities up to USD 1,000, so the context appears at the moment they confirm and nobody configures 
- .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md: | Role | Access | What They See/Do | |------|--------|-------------------| | Musician | Full | Creates and edits a band. Fills band-specific attributes: genre, home city, catalogue, the alias(es) it releases under, whether it is available to book. Does not fil

## Provider Constraint Evidence

- Cloudflare Workers Free allows 100,000 requests/day with 10 ms CPU per invocation; the paid plan has a $5/month minimum. Source: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 has free monthly allowances of 10 GB-month storage, 1 million Class A operations, and 10 million Class B operations; use beyond those allowances is chargeable. Source: https://developers.cloudflare.com/r2/pricing/
- Supabase Free includes a 500 MB database and 1 GB file storage, may pause a project after one week of inactivity, and has no uptime SLA and no PITR. No paid add-on or overage is authorized. Source: https://supabase.com/pricing

## Confirmed Database Tier

- Supabase Free is the selected managed PostgreSQL service tier under DEC-104. Procurement and project provisioning are deferred to `/setup-workspace`; there is no current paid subscription or live dependency during PRD work.
- The Free-tier inactivity pause, quotas, lack of PITR, and lack of uptime SLA are accepted constraints. No paid upgrade, overage, or add-on is authorized.
- Recovery evidence is synthetic/local only until production-verified recovery evidence is separately demonstrated; protected money, rights, and publication writes remain closed without that evidence.

## Availability Objective (Confirmed)

- **Decision:** 99.9% internal monthly availability objective, excluding announced scheduled outages; no provider uptime SLA is assumed.
- **Status:** Confirmed by the owner on 2026-08-02.
- **Meaning:** At most 0.1% unplanned downtime per reporting month; this is approximately 43 minutes and 50 seconds in a 30-day month. The exact allowance varies with calendar-month length.
- **Operational consequence:** Supabase Free may pause after inactivity and provides no uptime SLA. Hosting, monitoring, incident response, and planned-maintenance procedures must account for that best-effort posture without a paid add-on.

## Hosting Platform (STK-01)

+- .memory/wiki/specs/ideation/meta/constraints.md: | Constraint | Value | Source | |---|---|---| | Frontend architecture | Astro islands | User directive, 2026-07-16 | | Hosting — static/edge | Cloudflare Pages | User directive, 2026-07-16 | | Compute | Cloudflare Workers | User directive, 2026-07-16 | | Backe
- .memory/wiki/specs/ideation/ideation-index.md: - Project Shape: single-surface - Hub Surface (hub-and-spoke only): N/A - Surfaces: N/A — single responsive web surface - Classification Basis: Detected from document. Source describes one web platform with one stack and one shared audience pool; no distinct p
- .memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md: The single most consequential finding: the sweep produced 35 candidates describing what to capture — song records, versions, review, approval, mastering — and not one asking how the work reaches the platform. Every candidate assumes a browser. meta/personas.md
- .memory/wiki/specs/ideation/08-realtime-jamming-remote-sessions/realtime-jamming-remote-sessions-index.md: # Real-Time Jamming & Remote Sessions — Index
- .memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md: Why this is a top-level domain: Not a cross-cut despite serving every domain: it has a dedicated internal staff operating role, its own destination surfaces (report flow, resolution centre, appeal, moderation queues) and legally mandated machinery — DSA notice

- **Decision:** Cloudflare Pages plus Workers is pre-locked from ideation for the single responsive Astro-islands web surface.
- **Boundary:** Static assets use edge delivery; SSR and dynamic first-party API paths use Workers. A future native client consumes the same server-side contracts rather than introducing a separate backend.
- **Plan tier:** Cloudflare Workers Paid is the sole paid-service exception beginning at shared staging, under a soft `$10/month` ceiling. The later `/setup-workspace` procurement decision must honor this ceiling and the internal availability objective; no other paid Cloudflare or provider service is assumed.
- **Provider evidence:** [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) documents the current Free-plan limits and the paid-plan minimum.
## Authentication and Authorization

- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md`: one human must have one account with simultaneous, reversible role facets; a role facet exposes product surfaces but is never authorization, and shadow records may be created before signup.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md`: every write is attributable to an acting party; available contexts are derived from aliases and live mandates, so stale or manually configured context grants are unsafe.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03-membership-representation-mandate-cx.md`: authorization is entity-scoped and evaluates a single `{activities, domains}` authority shape; membership alone is presence, not authority, and term expiry must remove authority.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.02-claim-initiation-proof-methods.md`: claiming proves a relationship to a party rather than legal identity; KYC belongs at payout, while business-listing and DSP OAuth are proof mechanisms for bounded external identity links.
- From `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-cx.md`: roster roles and NDA acceptance are resource-access inputs; role changes must recompute grants, revoke streaming/download tokens immediately, and fail closed on partial revocation.

### Tier 1 Conclusions

- Identity: one human user identity can own or claim many person and organization parties; acting party must travel with each protected request.
- Authorization: hybrid RBAC and relationship-based authorization is required; the provider authenticates the human, while server-side policy and PostgreSQL RLS enforce resource, roster, mandate, activity, domain, term, and NDA conditions.
- Tenant model: multi-tenant by party, organization, project, confidential asset, and transaction; no provider role alone can encode access.
- Compliance: no KYC at signup; KYC/KYB gates payouts only. Audit must attribute every state-changing action to an actor identity, and minors require safeguarding in notifications and communications.
- External identity: OAuth is required for bounded claim proofs; ideation does not lock consumer social sign-in providers or enterprise SSO/SAML.

### Tier 2 Decisions Confirmed

- Supabase Auth is the sole consumer authentication provider; no second paid identity provider is in launch scope.
- Google, Apple, Meta/Facebook, and SoundCloud are launch login identities; TikTok is lower-priority post-launch; BandLab is conditional on an official provider integration.
- Social identities are additive credentials on one canonical user UUID. Users may link and unlink providers, and any linked provider may authenticate the same account.
- Enterprise SSO/SAML and all enterprise-only features are deferred until consumer launch readiness.
## Primary Language(s)

- From `.memory/wiki/specs/ideation/meta/constraints.md` under Project Surfaces: v1 is one Astro web app plus PWA on Cloudflare Workers, with no authorized desktop binary; the phase-2 native app must consume the same API-first backend contracts rather than force a rewrite.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03-membership-representation-mandate-index.md`: membership and representation feed one shared authority shape, so frontend, Worker handlers, tests, and data access need one contract vocabulary for parties, activities, domains, and actor context.
- From `.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01-credit-graph-discography-index.md`: embargo and visibility must be enforced at the record/query boundary because both search and a future API can leak render-only rules; shared validated contracts are more important than language-level backend specialization.
- From `.memory/wiki/specs/ideation/02-credits-attribution/02.02-session-capture/02.02-session-capture-index.md`: v1 capture is browser/PWA-based, must tolerate offline operation, and explicitly excludes a DAW plugin or local agent; there is no current requirement for a native or systems-language application surface.
- From `.memory/wiki/specs/architecture/prd-working/ideation-relevance-index.md`: normal web interactions target p95 at or below two seconds on the locked Cloudflare Pages/Workers and Supabase architecture; edge-compatible execution, targeted queries, shared schemas, and asynchronous non-critical work dominate the language decision.

### Tier 1 Conclusions

- The primary language should cover the Astro UI, Cloudflare Worker handlers, shared contracts, validation, tests, and Supabase client integration without cross-language schema drift.
- A systems language is not justified as a second primary language for v1 because no desktop/native runtime is authorized and media/DSP work is not in the web request path.
- Future Rust or native modules remain an exception path for measured WebAssembly/DSP/cryptographic workloads or the separately approved phase-2 native client; they should not define the v1 repository baseline.

## CI/CD

- From `.memory/wiki/specs/ideation/meta/constraints.md`: the private GitHub repository, GitHub-to-Cloudflare deployment flow, and three labeled self-hosted GitHub Actions runners are already provisioned and smoke-tested; selecting another CI provider would abandon verified infrastructure and duplicate the control plane.
- From `.memory/wiki/specs/ideation/meta/constraints.md`: the runner host has eight cores and 15 GiB RAM, so heavy jobs must use workflow concurrency controls and initially cap parallel build/test load at two until measurements prove three are safe.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.01-content-types-schema-registry/25.01.04-schema-versioning-migration.md`: CMS schema changes require validation, dry-run output, resumability, rollback evidence, and failure-safe migration gates before deployment can advance.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.09-content-delivery-preview-cache/25.09.03-atomic-publish-cache-invalidation.md`: deployment and publication automation must preserve idempotent outbox processing and converge public projections, search, sitemap, and cache state without exposing partially activated content.
- From `.memory/wiki/specs/ideation/meta/constraints.md`: consumer, payment, privacy, moderation, and regulated-record scope requires pull-request lint, type, test, build, dependency, secret, and security gates; staging may deploy continuously, while production requires a protected environment approval and migration readiness evidence.

### Tier 1 Conclusions

- **Deployable units:** one Astro/PWA web artifact, Cloudflare Worker/API code, and versioned Supabase migrations share one repository but retain separate build and deploy jobs with explicit dependencies.
- **Repository model:** monorepo on GitHub; GitHub Actions is the only option aligned with the locked repository, verified self-hosted runner fleet, and GitHub-to-Cloudflare path.
- **Compliance gates:** every production candidate must pass lint, type-check, unit/integration/E2E tests as applicable, build, migration dry-run, dependency and secret scanning, and security-policy checks.
- **Deployment policy:** staging deploys automatically after required checks; production uses a protected GitHub environment, serialized deployment concurrency, explicit approval, and rollback artifacts.
- **Runner boundary:** workflows target the `wejammin` self-hosted label, use least-privilege permissions and environment-scoped secrets, never run untrusted fork code on the private runner fleet, and begin with at most two heavy jobs concurrently.

## Monitoring / Observability

- From `.memory/wiki/specs/ideation/meta/constraints.md`: normal first-party interactions target p95 below two seconds and monthly availability is 99.9% excluding scheduled outages, so release-tagged latency, error-rate, dependency-health, and uptime signals must support both regression detection and monthly SLO accounting.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.08-admin-workspace-operations/25.08.05-site-health-config-diagnostics.md`: schema drift, stale flags, broken routes, unresolved media, scheduler/cache lag, and dependency failures must be diagnosed explicitly; an unknown or stale check can never be reported healthy.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.09-content-delivery-preview-cache/25.09.04-degraded-delivery-recovery.md`: observability must distinguish absent, unavailable, degraded, and stale states while proving that last-known-good public output remains active and security revocation or takedown still overrides cache availability.
- From `.memory/wiki/specs/ideation/22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01.03-ingestion-health-gaps-freshness.md`: external integrations require per-attempt outcomes, freshness state, named gaps, and user-actionable broken/terminal alerts; transient backoff must not create noisy false alarms.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.08-admin-workspace-operations/25.08.04-activity-audit-notifications.md`: editable history and immutable security/financial audit are separate concerns; monitoring may alert on failed audit/outbox convergence but cannot replace the canonical PostgreSQL audit and provenance records.

### Tier 1 Conclusions

- **Error-critical paths:** authentication/linking, authorization, payments/payouts, rights and ledger mutations, migrations, CMS activation, outbox consumers, external webhooks/sync, moderation/legal actions, erasure/hold, and public delivery convergence require explicit error and health signals.
- **Tracing need:** the Cloudflare Worker → Supabase → outbox/Queue → external-provider paths require propagated release, environment, request/correlation, actor-context class, and entity/version identifiers; raw PII, secrets, evidence, payment data, and content bodies are excluded.
- **Audit boundary:** durable domain audit remains first-party PostgreSQL data with policy-specific retention and legal hold. provider-native logs are operational diagnostics with minimized metadata and bounded retention, never the system of record.
- **Selected shape:** schema-validated structured JSON logs plus Cloudflare Workers Observability and Supabase Logs/Reports provide release-tagged request, dependency, trace, and database evidence. A scheduled GitHub health check covers public uptime. No third-party monitoring account, SDK, alerting plan, or source-map upload is selected.
- **Operations posture:** no existing monitoring stack and no staffed 24/7 rotation exist. The solo owner receives immediate severity-1 security, money, data-integrity, publication, and full-outage alerts; lower severities aggregate into the admin task inbox and scheduled review to avoid alert fatigue.

## Frontend Framework

- From `.memory/wiki/specs/ideation/meta/constraints.md`: Astro islands, Cloudflare Pages/Workers, one responsive web surface, and PWA delivery are owner-locked; the framework decision therefore defines rendering and hydration boundaries rather than reopening the framework family.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.01-profile-page-composition.md`: profile/EPK pages are high-traffic, public, provenance-sensitive compositions whose stable header/now/record/detail spine should render useful HTML without waiting for a client application bootstrap.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.03-templates-blocks-page-composition/25.03-templates-blocks-page-composition-index.md`: public pages require controlled, versioned, accessible blocks and templates with preview/diff/safe publish, but explicitly exclude themes, plugins, arbitrary code, and arbitrary executable rendering.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.08-admin-workspace-operations/25.08-admin-workspace-operations-index.md`: the protected admin backend includes dense search/filter/bulk workflows, capability administration, task inboxes, audit, diagnostics, and interactive editors; these need richer client islands than public content pages.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.09-content-delivery-preview-cache/25.09-content-delivery-preview-cache-index.md`: public read models, authenticated preview, atomic publication, cache/search convergence, and last-known-good delivery require separate public, preview, and admin route policies rather than a single SPA caching model.

### Tier 1 Conclusions

- **Rendering:** this is a hybrid application, not a pure SPA. Public discovery, profile, content, policy, help, catalogue, and landing routes default to prerendered or cacheable server HTML; personalized/protected and freshness-critical routes render on demand through the Cloudflare adapter.
- **Interactivity:** most public pages need little JavaScript, while admin editors, dashboards, bulk operations, realtime status, complex forms, and offline/PWA capture need bounded hydrated islands. React is the single island UI runtime; Astro remains the page, routing, layout, data-loading, and server-rendering framework.
- **Realtime:** Supabase Realtime invalidates/refetches canonical state for presence and status; it does not turn the application into a client-authoritative SPA or permit last-write-wins editing of protected records.
- **Route scale:** the broad domain and CMS inventory implies many route families, but typed route builders, shared layouts, schema-driven content rendering, and feature-owned islands keep route count from becoming one global client router/store.
- **Offline and future surfaces:** v1 PWA support is selective and workflow-specific; service-worker caches never become canonical. The phase-2 native client shares TypeScript API contracts and domain vocabulary, not Astro components or a forced universal UI codebase.

## Backend Runtime

- From `.memory/wiki/specs/ideation/meta/constraints.md`: Cloudflare Workers is owner-locked compute beside Astro/Pages and Supabase; the runtime decision must therefore define safe edge/request boundaries and escape hatches, not introduce a traditional always-on server.
- From `.memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md`: the v1 session spine is dominated by validated state transitions, permissions, versioned audio metadata, review/approval, capture prompts, and immutable provenance—not request-time DSP, mixing, mastering, or local-agent compute.
- From `.memory/wiki/specs/ideation/12-release-distribution/release-distribution-index.md`: external delivery is asynchronous, partner-specific, partially successful, retryable, and correlation-heavy; long-running DDEX and provider work cannot occupy interactive request lifetimes.
- From `.memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md`: moderation, fraud, disputes, and legal workflows require evidence-preserving adjudication and fail-closed authority checks; opaque model serving is not a v1 request-runtime requirement.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/content-management-platform-configuration-index.md`: admin and public delivery are separate trust planes, CMS activation is versioned/outbox-backed, and import/export/migration/publication work needs bounded jobs with explicit status and recovery.

### Tier 1 Conclusions

- **Dominant logic:** transactional business rules, relationship authorization, workflow/state-machine transitions, read-model composition, integration adapters, and audit/outbox creation dominate; PostgreSQL owns atomic invariants while Workers own HTTP orchestration.
- **Runtime shape:** Cloudflare Workers serves Astro SSR and one Hono-based versioned API boundary. This is a modular monolith with feature/domain modules, not independently deployed microservices.
- **Async boundary:** Queue consumers and scheduled dispatchers handle webhooks, notifications, publication convergence, imports/exports, partner delivery, reconciliation, and other retryable work. Requests commit an idempotent intent/outbox record and return bounded status rather than waiting.
- **Performance:** normal interactive requests target p95 `<2s`; edge cold starts are acceptable, but request handlers must avoid unbounded loops, large media transforms, long partner waits, and fan-out that should execute asynchronously or in set-based PostgreSQL operations.
- **Surface/protocol:** web/PWA and future native clients consume the same versioned HTTP contracts. No internal gRPC or service mesh is justified; specialized compute becomes a separately reviewed worker/service only after profiling and cost evidence.

## API Layer

- From `.memory/wiki/specs/ideation/meta/constraints.md`: v1 has one web/PWA surface but the architecture must be API-first for a phase-2 native client and external integrations; a browser-only TypeScript RPC contract would create a future migration instead of a durable platform boundary.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/identity-profiles-organizations-index.md`: one human can act through multiple parties, aliases, memberships, and mandates while legal identity is a separately authorized surface; every query and command needs explicit acting-context and projection boundaries rather than caller-selected unrestricted graph expansion.
- From `.memory/wiki/specs/ideation/02-credits-attribution/credits-attribution-index.md`: credit/provenance reads are graph-shaped and visibility-sensitive, but canonical records, evidence rungs, disputes, and embargoes require purpose-built authorized projections—not a generic traversal endpoint.
- From `.memory/wiki/specs/ideation/22-analytics-market-intelligence/analytics-market-intelligence-index.md`: dashboards and cross-source reports need filtered aggregate read models, freshness/gap annotations, and exports; flexible client query shape must not erase honesty/provenance rules or permit unbounded analytical queries on the request path.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/content-management-platform-configuration-index.md`: admin control-plane APIs and public published-content APIs are separate trust planes sharing typed contracts; drafts, settings, audit, preview, and canonical domain records cannot be exposed through one unrestricted query surface.

### Tier 1 Conclusions

- **Query shape:** reads vary widely, but the variation is known by use case—profiles, graph projections, feeds, dashboards, searches, admin lists, exports, and CMS delivery. Purpose-built read resources with filters/cursors are safer than caller-authored nested queries.
- **Realtime:** Supabase Realtime delivers minimal invalidation/status events after authorization; clients refetch canonical REST resources. Subscriptions do not replace resource APIs or expose row streams broadly.
- **Consumers:** browser/PWA, future native clients, provider webhooks, partner integrations, and potential public developer access require language-neutral HTTP contracts and generated documentation; tRPC is therefore not the platform boundary.
- **Topology:** one Hono API serves the modular monolith. Internal module calls are typed in-process calls and PostgreSQL contracts, not HTTP between pseudo-services.
- **Selected style:** versioned REST/HTTP JSON with OpenAPI, resource-oriented reads, explicit command endpoints for high-stakes state transitions, cursor pagination, idempotency keys, ETags/version preconditions, stable problem details, and signed/versioned webhooks.

## CDN / Assets

- From `.memory/wiki/specs/ideation/meta/constraints.md`: Cloudflare Pages is owner-locked for static/edge delivery while Supabase Storage is the locked backend object service; the asset topology should use each provider's native CDN rather than add a third storage/CDN vendor before revenue.
- From `.memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md`: versioned audio, stems, timestamped review, approvals, embargoes, and lineage make music media private, rights-sensitive canonical objects—not ordinary public website assets.
- From `.memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md`: evidence-locker assets and DMCA/legal material require chain of custody, access sealing, hold-aware retention, and immediate security/takedown response; generic long-lived public caching is unacceptable.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.06-media-library-asset-governance/25.06-media-library-asset-governance-index.md`: editorial media requires metadata, deduplication, approved renditions, alt text/focal points, rights/provenance/consent, reference tracking, replacement, and takedown-safe lifecycle over shared object infrastructure.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.09-content-delivery-preview-cache/25.09-content-delivery-preview-cache-index.md`: published projections, authenticated preview, atomic publication, cache/search convergence, and last-known-good recovery require versioned cache keys and explicit purge/convergence state.

### Tier 1 Conclusions

- **Deploy assets:** Astro build output, CSS, JavaScript, icons, and immutable public artifacts use Cloudflare Pages' native CDN/Tiered Cache with content-hashed names; deployments and redirects follow Pages defaults rather than broad custom cache rules.
- **Object media:** Supabase Storage remains canonical for uploaded audio, images, video, documents, contracts, and evidence. Its native CDN/Smart CDN serves approved renditions according to bucket and access policy; Cloudflare R2 is not a baseline duplicate store.
- **Access classes:** public-published, authenticated-private, preview, confidential-project, financial/legal, and evidence/hold assets have distinct buckets/policies, TTLs, rendition permissions, download semantics, and purge requirements. Private is the default.
- **Revocation:** expiring a signed URL is not treated as immediate revocation because cached copies may outlive token expiry. Sensitive access uses short browser/cache TTLs and authenticated delivery; emergency revocation deletes/quarantines the object or rotates to a new immutable path and verifies propagation.
- **Mutation model:** object bytes and public URLs are immutable/versioned. Replacement creates a new path/version and atomically updates references; takedown/erasure/hold dispatches idempotent purge and derivative cleanup with explicit completion evidence.

## Design Direction

- From `PRODUCT.md`: the default register is product, the v1 audience is professional-first, and the strategic personality is **credible, human, exact**; workflows must expose one clear task while preserving complex multi-role identity and honest system state.
- From `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.01-profile-page-composition.md`: provenance is a per-fact property, asserted and attested content must be distinguishable without a legend, absence cannot represent loading or failure, and public profile composition has a fixed Header → Now → Record → Detail spine.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.03-templates-blocks-page-composition/25.03.02-template-definitions-slots-bindings.md`: CMS templates may compose only approved blocks and slots; profile hierarchy and reserved provenance treatments are code-owned and cannot be overridden.
- From `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.10-portability-governance-quality/25.10.03-accessibility-content-quality-gates.md`: accessibility is a publication gate covering alternatives, headings, link purpose, language, references, and policy metadata; inaccessible block choices leave the registry rather than becoming author debt.
- From `.memory/wiki/specs/ideation/meta/constraints.md`: the only v1 surface is a responsive web/PWA used in mobile and mixed-light professional contexts; normal-web p95 is below two seconds, and consumer-scale fan surfaces arrive after the professional launch wedge.

### Tier 1 Conclusions

- **Direction:** product-first restrained utility under the creative north star **The Working Record**. It combines the practical density of a session track sheet with the human clarity of liner notes and the attribution discipline of a provenance label.
- **Surface split:** operational forms, tables, settings, moderation, and admin use a fixed sans product hierarchy. Limited serif display is allowed only on public identity/editorial moments; it never enters controls or dense workflow UI.
- **Color:** warm light neutrals are the default for mixed ambient light. Jam Magenta is the sole vibrant brand accent at no more than 10% of a screen; separate semantic colors are literal status signals and never decorative accents.
- **Trust vocabulary:** provenance, authorization, loading, failure, unavailable, disputed, blocked, and absent states use text, semantics, iconography, and structure in addition to color. CMS configuration cannot override protected trust, focus, contrast, or error treatments.
- **Motion and accessibility:** feedback is responsive rather than choreographed, normally 150–220 ms, never animates layout, and always respects reduced motion. WCAG 2.2 AA, keyboard, screen-reader, zoom/reflow, target-size, and non-color-cue requirements apply to every surface.
- **Governance:** legitimate visual variability resolves through typed tokens and approved settings. Arbitrary themes, plugins, scripts, CSS, expressions, decorative verification, generic card grids, profile-completion gamification, and dark/neon music-product reflexes are rejected.

## Development Tooling

- From `.memory/wiki/specs/ideation/meta/constraints.md`: the private monorepo uses three self-hosted GitHub Actions runners on one eight-core host, so tooling must be deterministic from a lockfile, cacheable, and capable of splitting lightweight checks from browser-heavy work under a two-heavy-job concurrency cap.
- From [Astro's testing guide](https://docs.astro.build/en/guides/testing/): Vitest integrates through Astro's Vite configuration for unit/component work, while Playwright is the documented cross-engine E2E path and can test the production preview rather than a development-only representation.
- From [Astro's editor/tooling guide](https://docs.astro.build/en/editor-setup/): Biome's Astro support remains experimental, while the official Astro Prettier plugin formats `.astro` files. This makes ESLint plus `eslint-plugin-astro` and Prettier safer than a Biome-only gate for the launch stack.
- From [eslint-plugin-astro's user guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/): flat-config ESLint can lint Astro templates, TypeScript frontmatter, scripts, directives, and Astro accessibility rules; dependency versions must be pinned because recommended rules may change in minor releases.
- From [TypeScript's `noEmit` reference](https://www.typescriptlang.org/tsconfig/noEmit.html) and Astro's project diagnostic guidance: Vite/Astro owns production emission, while strict `tsc --noEmit` checks package TypeScript and `astro check` checks `.astro` templates and project diagnostics.
- From [pnpm workspaces](https://pnpm.io/workspaces): pnpm provides a workspace protocol and lockfile-centered monorepo model suited to shared contracts, application packages, test utilities, and future client packages without adding a second build system.

### Tier 1 Conclusions

- **Package/build system:** pnpm workspaces with Corepack-managed, exact package-manager metadata and a committed `pnpm-lock.yaml`. Scripts are the stable interface used by developers and CI; direct global tool invocation is prohibited.
- **Unit/integration/component tests:** Vitest is the primary runner. Node/Worker-compatible projects cover contracts, domain services, data adapters, and Hono handlers; browser-mode React component tests use the Playwright provider only where real browser behavior matters.
- **End-to-end tests:** Playwright owns route, hydration, accessibility-smoke, PWA, auth, CMS publication, and critical workflow E2E tests against a production build/preview. Chromium is the fast pull-request baseline; WebKit and Firefox run on protected/nightly or release matrices until runner measurements support more.
- **Lint/format:** ESLint flat config with TypeScript, React, Astro, security, import-boundary, and accessibility rules owns correctness linting. Prettier plus the official Astro plugin owns formatting. Biome is rejected at launch because Astro coverage remains experimental; ESLint does not own formatting.
- **Type/build:** strict `tsc --noEmit` plus `astro check` forms `pnpm type-check`; `astro build` through the Cloudflare adapter forms `pnpm build`. Worker-specific type generation/checking is included once bindings exist.
- **Commands:** `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`, `pnpm test:e2e`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`, `pnpm format:check`, `pnpm type-check`, `pnpm build`, and `pnpm validate` are canonical. `pnpm validate` runs format check, lint, type-check, coverage-bearing tests, E2E critical path, and production build without rewriting files.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### Constrained by
- [[decisions.md#d-85|D-85]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-10|D-10]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
