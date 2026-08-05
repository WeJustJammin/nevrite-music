# Data Placement Strategy

Status: confirmed architecture input for `/write-architecture-spec` and `/write-be-spec`.

## N-Tier Model Responsibilities

| Tier | Responsibility | Examples |
|---|---|---|
| Browser / PWA | render UI; hold ephemeral interaction state, bounded safe cache, and approved offline drafts/intents | Astro HTML, React islands, service worker, IndexedDB where explicitly admitted |
| Cloudflare edge/CDN | serve immutable deploy assets and eligible public publication output; terminate requests | Pages/Workers asset delivery, CDN cache, security headers |
| Web/API runtime | authenticate, validate, authorize, execute bounded use cases, normalize errors, dispatch jobs | Astro server routes, Hono on Cloudflare Workers |
| Async runtime | converge side effects and long work through replay-safe consumers | Cloudflare Queues, scheduled dispatchers, dead-letter state |
| Relational authority | own canonical domain state, authorization relationships, settings, CMS, audit, jobs, idempotency, outbox | Supabase PostgreSQL, RLS, views, RPC functions |
| Credential/session authority | own credentials, provider handshakes, verified login identities, and sessions | Supabase Auth |
| Object storage | own immutable governed bytes and renditions under database-owned metadata | Supabase Storage and Smart CDN |
| Realtime transport | send minimal authorized invalidation/version hints | Supabase Realtime |
| External processors | provide approved payment, identity, delivery, email, registry, and diagnostics functions | typed provider adapters, Sentry |

## Complete Data Placement Map

| Data Type | Canonical Owner | Stored Content | Encryption | Rationale |
|---|---|---|---|---|
| Auth credentials and sessions | Supabase Auth | password/provider credentials, MFA/recovery state, session material | provider-managed at rest; TLS in transit | keep credentials out of application tables and Workers |
| External login links | Supabase Auth plus protected PostgreSQL link registry | provider subject, link state, verification metadata; minimal normalized provider profile | at rest and TLS | additive identities must resolve one canonical user and remain auditable |
| Users, parties, acts, organizations | PostgreSQL | canonical IDs, display/public profile, private profile, lifecycle and acting context | at rest and TLS; protected fields isolated | relational authority and capability evaluation |
| Relationships, mandates, capabilities | PostgreSQL | membership, role, delegation, scope, expiry, revocation, evidence pointers | at rest and TLS | server authorization cannot depend on client/provider claims |
| CMS definitions and content | PostgreSQL | post types, field schemas, blocks, templates, menus, settings, revisions, publication state | at rest and TLS | typed, versioned, transactional publication and audit |
| Product domain records | PostgreSQL | projects, sessions, provenance, rights, services, education, venues, discovery, workflows | at rest and TLS | cross-record invariants, RLS, audit, versioning |
| Money and commerce references | PostgreSQL | order/engagement state, amounts/currency, provider reference, allocation/hold state, reconciliation | at rest and TLS; strongest access class | domain ledger/reference state must outlive provider UI and retries |
| Payment instrument and bank details | approved payment provider | card/bank/tokenized payout data | provider controls plus TLS | WeJammin does not store raw payment instruments |
| Consent, terms, and legal evidence | PostgreSQL metadata + private Storage bytes | policy/version, actor, timestamp, method, document/evidence pointer, hold state | at rest and TLS; restricted class | immutable proof with controlled document access |
| Media and documents | Supabase Storage; PostgreSQL metadata canonical | audio, stems, images, video, PDFs, exports, contracts, evidence; hashes and renditions | at rest and TLS; signed/authenticated delivery | object lifecycle requires rights, consent, retention, and publication governance |
| Jobs, idempotency, outbox | PostgreSQL | normalized request hash, outcome pointer, state, attempts, event metadata | at rest and TLS | commit domain state and delivery intent atomically |
| Queue messages | Cloudflare Queues, transient | event ID/type/version, canonical IDs, causation/correlation; no raw protected payload by default | provider-managed and TLS | replay-safe dispatch without another source of truth |
| Public projections | PostgreSQL projection; Cloudflare cache copy | publication-approved fields and immutable version keys | at rest/TLS; public after approval | safe caching without exposing draft/private rows |
| Search and sitemap projection | PostgreSQL at launch | allowlisted published/searchable text, IDs, versions, visibility | at rest and TLS | avoids a second store until measured need; outbox-ready for future extraction |
| Notifications and subscriptions | PostgreSQL; delivery provider transient | verified channel, consent, preference, template/version, send state, provider reference | at rest and TLS | current consent and delivery history remain locally governed |
| Operational telemetry | Sentry/provider logs, noncanonical | scrubbed request/correlation IDs, route, release, timing, error class, safe versions | provider-managed and TLS | diagnostics can expire without altering business truth |
| Browser state | memory/Cache API/IndexedDB by allowlist | UI state, public cache, non-secret preferences, encrypted/bounded drafts and intent envelopes | platform transport; local encryption only where threat model supports it | resilience without granting local state authority |
| Secrets and keys | deployment/provider secret stores | API keys, webhook secrets, signing/encryption material | provider secret encryption and TLS when delivered to runtime | never committed, logged, sent to browser, or stored as settings content |

## Security Boundaries

| Tier | Stores | Does NOT Store |
|---|---|---|
| Browser / PWA | rendered authorized data, CSRF-safe session state, bounded public cache, approved local drafts/intents | service-role keys, provider secrets, raw credentials, canonical authority, full legal/payment evidence, unbounded PII |
| Edge/CDN | immutable build assets, eligible public responses, short-lived routing/cache metadata | private responses, drafts/previews, auth tokens in cache keys/logs, legal/payment records, canonical data |
| Worker/Astro/Hono | request context, short-lived access token, validated input, bounded response/job context | persistent credentials, long-lived private data, raw payment instruments, arbitrary uploaded executable content |
| Queue | minimal versioned event envelope and canonical references | source-of-truth records, raw request bodies, auth tokens, secrets, full documents/media, unnecessary PII |
| PostgreSQL | canonical records, private/public projections, policy state, audit, idempotency, jobs/outbox | raw passwords, raw payment instruments, deploy secrets, object bytes, arbitrary executable content |
| Supabase Auth | credentials, provider identity subjects, MFA/recovery/session state | domain roles, party authority, money/rights state, CMS content |
| Supabase Storage | immutable object bytes and controlled renditions | authoritative metadata without a PostgreSQL record, credentials, executable plugins/themes/scripts |
| Realtime | short-lived authorized ID/version hints | durable events, full confidential records, authority grants, final mutation results |
| External processors | minimum contract-specific payload and provider reference | unrelated profiles, unrestricted domain records, secrets for other providers, canonical audit |
| Sentry/logs | scrubbed operational metadata and sampled stack traces | request bodies, auth headers, cookies, direct PII, messages/media, legal evidence, payment details, secrets |

## PII Boundaries

### Enumerated PII Classes

The following are treated as PII or protected personal data wherever they appear:

- **Identity:** legal name, stage name when linkable, aliases, date of birth/age/minor status, pronouns, biography, portrait/avatar, signature, government/tax/business identifiers, identity-verification result and evidence.
- **Account/contact:** email, phone, postal/billing address, social/provider subject IDs and handles, recovery methods, device/session identifiers, IP address, user agent, login history, account security events.
- **Location/schedule:** precise location, home/work/venue address when nonpublic, timezone tied to a person, travel/availability/calendar data, check-in or attendance records.
- **Financial/commercial:** payment/payout provider customer IDs, bank/payout status, tax status, invoices, receipts, prices/offers tied to parties, balances, splits, holds, refunds, transaction and reconciliation history. Raw payment instruments remain with the payment provider.
- **Communications/relationships:** private messages, comments with restricted audience, contacts, follows/alerts, memberships, mandates, collaborations, invitations, blocks, disputes, reports, CRM/support notes.
- **Creative/professional:** private projects, drafts, stems, unreleased recordings, contribution and credit claims, work history, contracts, rates, availability, reviews, education/lesson history, provenance tied to a person.
- **Safety/legal:** moderation reports, allegations, sanctions, safeguarding/minor data, emergency information, takedowns, legal notices, rights disputes, consent evidence, legal-hold records.
- **Sensitive inference:** accessibility needs, health/safety information, race/ethnicity, religion, political views, sexual orientation, union status, biometric/genetic data, or criminal allegations. Collection is prohibited unless a separately approved legal/product purpose, data contract, access class, retention, and consent/lawful basis exist.

### Canonical PII Field Registry Seed

| Class | Canonical semantic identifiers |
|---|---|
| Identity | `legal_name`, `display_name`, `stage_name`, `aliases`, `birth_date`, `age_band`, `minor_status`, `pronouns`, `biography`, `avatar_asset_id`, `signature_evidence_id`, `government_identifier_reference`, `tax_identifier_reference`, `identity_verification_reference` |
| Account/contact/security | `primary_email`, `email_addresses`, `phone_numbers`, `postal_address`, `billing_address`, `provider_subject`, `provider_handle`, `recovery_method`, `ip_address`, `user_agent`, `device_id`, `session_id`, `login_at`, `security_event` |
| Location/schedule | `precise_location`, `nonpublic_address`, `timezone`, `availability_window`, `calendar_event`, `travel_itinerary`, `check_in`, `attendance_record` |
| Financial/commercial | `payment_customer_reference`, `connected_account_reference`, `payout_status`, `tax_status`, `invoice_reference`, `receipt_reference`, `offer_amount`, `balance`, `split`, `hold`, `refund`, `transaction_reference`, `reconciliation_reference` |
| Communications/relationships | `private_message`, `restricted_comment`, `contact`, `follow_alert`, `membership`, `mandate`, `collaboration`, `invitation`, `block`, `dispute`, `report`, `crm_note`, `support_note` |
| Creative/professional | `private_project`, `draft_asset`, `stem_asset`, `unreleased_recording`, `contribution_claim`, `credit_claim`, `work_history`, `contract_reference`, `private_rate`, `private_availability`, `private_review`, `lesson_history`, `person_provenance` |
| Safety/legal/special category | `moderation_report`, `allegation`, `sanction`, `safeguarding_record`, `minor_record`, `emergency_information`, `takedown`, `legal_notice`, `rights_dispute`, `consent_evidence`, `legal_hold`, `accessibility_need`, `health_safety_information`, `special_category_attribute`, `criminal_allegation` |

These are stable semantic identifiers, not required physical column names. A domain may extend the registry only through a reviewed data-placement change naming purpose, lawful basis/consent, minimization, access class, retention, deletion propagation, and telemetry/search/export treatment.

### Storage and Isolation Rules

- Private PII is stored only in protected PostgreSQL schemas and private Storage classes. Public profile/publication projections contain only fields explicitly approved by the subject and publication policy.
- Workers may process the minimum PII needed for one request but do not persist it outside canonical stores. Queue payloads use IDs instead of copied fields; consumers re-read under current policy.
- Analytics, model/AI inputs, Sentry, logs, search, and marketing/export pipelines deny PII by default. Each admitted field requires purpose, lawful basis/consent, minimization, retention, deletion propagation, and low-count controls.
- `sendDefaultPii` and session replay are disabled for Sentry. Auth headers, cookies, request bodies, query secrets, media URLs/tokens, and direct identifiers are scrubbed before telemetry export.
- PII reads by administrators, support, moderation, legal, or safety roles require a named capability, reason where appropriate, current authorization, and audit record. Bulk export is separate from ordinary read permission.
- Sparse analytics clusters and low-count exports remain unavailable until counsel approves a numeric privacy floor. CRM notes cannot contain special-category data or unverified allegations pending counsel approval.

## GDPR/Compliance Data Lifecycle

Numeric legal retention is not inferred by engineering. Counsel-gated categories remain disabled or retain only the minimum operational record until jurisdiction, lawful basis, hold precedence, and deletion schedule are approved.

| Data Category | Retention Period | Deletion Trigger | Deletion Responsibility | Verification |
|---|---|---|---|---|
| Incomplete uploads | 24 hours unless an active upload/job references them | expiry or cancelled intent | scheduled storage reconciler | zero eligible object paths plus reconciliation record |
| Idempotency outcomes | 30 days for ordinary commands; longer only in a domain contract | TTL after terminal result | database scheduled job | expired-key query plus deletion metrics |
| Queue payloads/attempt detail | provider retry window; terminal attempt detail 30 days | success, dead-letter resolution, or TTL | queue consumer/operations job | no live message; canonical job retains safe terminal summary |
| Operational logs and Sentry events | 30 days or shorter provider-plan limit | TTL, account deletion propagation where applicable, or incident scrub | telemetry owner/provider | retention configuration and sampled deletion check |
| Browser cache/offline drafts | route policy; local intents max 30 days unless user keeps an active draft | logout, completion, expiry, policy/version change, user clear | client storage controller | cache version and local purge test |
| Account/profile data | account lifetime; purge timing defined by approved erasure workflow, not assumed here | verified erasure request or account closure | identity/privacy workflow | per-store deletion manifest and unresolved-exception report |
| Public/CMS content | until unpublish/archive/erase under content policy | owner/editor action, policy action, takedown, erasure | CMS publication workflow | canonical state, cache/search/sitemap tombstone, URL checks |
| Private projects/media | purpose/contract lifecycle; numeric tail requires domain approval | owner/party action, project closure, erasure, takedown | domain workflow plus storage reconciler | database/object/rendition/reference manifest |
| Financial/tax/commerce records | counsel-gated statutory schedule by jurisdiction and record class | statutory expiry after closure | finance/privacy workflow | hold-aware ledger/report and provider confirmation |
| Consent, contract, rights, dispute, moderation, safety, and legal evidence | counsel-gated by jurisdiction, claim limitation, minor/safety duty, and legal hold | approved expiry or resolved erasure where legally permitted | legal/privacy workflow | immutable disposition record and hold check |
| Marketing/alert subscription | until withdrawal, invalid channel, or purpose expiry | unsubscribe/consent withdrawal | notification/privacy workflow | suppression state locally and provider-side deletion/suppression |
| Provider copies | minimum provider contract; cannot exceed local approved purpose without review | local deletion/takedown/withdrawal event | integration owner | provider API/result receipt or exception queue |

Legal hold overrides ordinary purge for the held scope only. A hold must name authority, reason, scope, start, reviewer, and release; it may not silently preserve unrelated data. Anonymization, unpublish, archive, logical deletion, physical purge, and evidence preservation are distinct auditable states.

## Tenancy Model

**Hybrid multi-tenant relational model.** A human account can act for multiple parties (person, act, organization, venue, studio, administrator context), and a record can involve multiple parties without being copied into separate databases.

- Isolation mechanism: party/relationship/capability-aware RLS, explicit acting-party context, protected schemas/views, endpoint authorization, and RPC revalidation.
- Data co-mingling: shared public/catalog/reference records may be globally addressable; private records remain scoped by ownership, relationship, mandate, audience, purpose, and lifecycle. Shared projects/engagements use explicit participant links, not tenant-wide access.
- Cross-tenant prevention: no caller-provided tenant ID is trusted. The server derives allowed acting context from the authenticated user, and every query/command is constrained by RLS plus domain policy.
- Administration: platform administrators are not a universal tenant. Each operational capability is named, scoped, freshness-controlled where needed, reason/audit protected, and prevented from silently impersonating a party.
- Enterprise boundary: enterprise SSO, directory sync, SCIM, enterprise policy consoles, and organization-wide administration are deferred until consumer launch readiness and a later `/evolve-feature` decision.

## Sync Protocol (multi-surface only)

The launch product has one web codebase with public, authenticated, admin, and installable-PWA route families. Sync still applies to multiple tabs/devices and temporary offline use.

- Canonical server records sync by versioned REST projection. Supabase Realtime provides only an authorized entity/version hint; clients refetch.
- Local cache is keyed by user, acting party, route/data contract version, entity ID/version, and audience. Logout or acting-context change purges protected entries.
- Offline writes are limited to approved draft/intent types with local temporary ID, contract version, expected canonical version, created/expiry time, and idempotency key.
- Reconnect order is re-authenticate → resolve acting context → refresh settings/contracts → submit intent → authorize and version-check → commit or return explicit conflict.
- Server state wins for authority and lifecycle; user input is never silently discarded. A semantic conflict requires review, merge, discard, or duplicate-as-new where the domain permits.
- Network partition behavior: public last-known-good reads may show a stale label; protected reads show offline/unavailable honestly; money, rights, consent, publication, identity linking/merging, moderation, and legal actions cannot finalize offline.
- Future native or enterprise surfaces must reuse these canonical contracts or pass `/evolve-feature`; direct database synchronization and client-authored authority remain prohibited.

## Cross-Store Consistency Protocol

| Entity | Canonical ID | Creation Sequence | Read Strategy | Partial Failure / Replay | Deletion Cascade |
|---|---|---|---|---|---|
| User identity | Supabase Auth UUID | provider/Auth verification → idempotent PostgreSQL user/link transaction → profile completion | Auth proves session; PostgreSQL resolves party/capabilities | reconcile orphaned Auth/profile/link states; never auto-merge people from matching provider text | unlink provider only when recovery remains; erasure coordinates Auth, app, processors, exceptions |
| Media asset | PostgreSQL asset UUID | create upload intent → scoped immutable Storage path → upload → checksum/scan → activate metadata | authorize metadata first, then authenticated/signed/public byte path | quarantine/expire orphan bytes; replay activation by asset/version | revoke publication → tombstone projections → purge eligible renditions/original → verify cache/hold |
| CMS publication | PostgreSQL publication UUID/version | validate typed revision → atomic activate + audit + outbox | public projection/cache by immutable version; preview separate | retain last-known-good; replay projection from outbox; stale events ignored | unpublish/tombstone cache-search-sitemap, then policy-driven archive/purge |
| Search/cache projection | source UUID/version | consume committed outbox event | projection may serve only matching current publication policy | replay checkpoint; rebuild from canonical DB | tombstone event, purge, and anti-resurrection version check |
| External delivery/payment reference | local operation UUID | commit intent/idempotency → provider call → reconcile provider reference/outcome | local state first; provider queried for reconciliation only | idempotency + webhook receipt + poll/reconcile; ambiguous state stays pending | local retention policy plus provider delete/suppress where contract permits |
| Offline intent | client temporary ID, then server operation UUID | validate locally → queue → revalidate server-side → commit | local pending plus canonical status resource | explicit conflict/expiry; safe resubmit uses same idempotency key | purge on completion, expiry, logout, or contract invalidation |
| Telemetry | domain audit/request ID anchor | emit scrubbed diagnostic event | never used as domain truth | loss/duplication tolerated and monitored | TTL/provider deletion independent of held canonical evidence |

## Summary Table

| Layer | Stores | Does NOT Store |
|---|---|---|
| Browser/PWA | bounded UI/cache/preferences and approved drafts/intents | secrets, canonical authority, unrestricted PII |
| Cloudflare edge/runtime | build/cache artifacts, transient request context, minimal queue envelopes | canonical business data, credentials, raw protected payloads |
| Supabase PostgreSQL | canonical relational state, policy, settings/CMS, audit, jobs/outbox | raw credentials, object bytes, deploy secrets |
| Supabase Auth | credentials, sessions, provider identity subjects | domain authorization or business records |
| Supabase Storage | immutable governed bytes/renditions | standalone authoritative metadata or executable extensions |
| Realtime | transient ID/version hints | durable events, confidential records, authority |
| External processors | minimum approved payload and provider reference | broad domain copies or canonical evidence |
| Telemetry | scrubbed diagnostics with bounded retention | PII, secrets, business audit, request/media bodies |
