# Promotion and marketing — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]  
**Deep Dive:** [[specs/ia/deep-dives/38-promotion-marketing|Promotion and marketing deep dive]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** Single contract; 38.01, 38.02, 38.03, 38.04, 38.05, 38.06, 38.07, 38.08, 38.09, 38.10, 38.11, 38.12, 38.13, 38.14, 38.15, 38.16, 38.17, 38.18, 38.19, 38.20, 38.21, 38.22, 38.23, 38.24, 38.25, 38.26, 38.27 and 38.28. The IA complexity gate explicitly passes without decomposition.
- **Boundary:** campaign/grid/readiness, pitches/directory/CRM, smart links/pre-save, paid/creator/social promotion, coverage/event attribution, EPK and embargo constraints.
- **Approval:** Single-document recommendation accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 38 IA/deep dive | all campaign, outreach, link, social, event and EPK interactions/contracts |
| Shards 00, 05, 14, 22, 35, 36, 37 and 39 | infrastructure/gates, creator engagements, release truth, tickets, consent and analytics consumers |

## Campaign and Readiness Invariants

- Campaign is typed with exactly one release/tour/event anchor, entity authority, immutable revision and rule-pack version. Derived deadlines require current authored rules; unknown remains blocked, never guessed.
- Readiness row exposes state, verifier type, provenance, source version and freshness. Self-attested never labels as source/machine validated.
- Content beat is offset or pinned with position/channel. Concurrent stale edit rejects; no silent merge.
- Anchor cascade preview classifies every item `movable|pinned|stranded|elapsed|embargo_conflict`, identifies stale sources and mutates nothing.
- Commit requires source-owner authority, step-up and unchanged preview/source revisions. Anchor and movable beats update atomically; escaped work becomes owned tasks; no external auto-send.
- New rule pack never rewrites historical grid; active campaign receives stale/changed-rule review tasks.

## Outreach and Directory Invariants

- DSP pitch is a readiness/export workflow only: verified Shard 22 credits/metadata prefill, provider-rule blockers and external steps. Platform never claims submission without provider receipt.
- Direct pitch is durable immutable revision with one professional target, ask, disclosures and campaign refs. Mass merge-field personalization, prohibited offer and missing disclosure reject.
- Target/sender/channel budget lease is atomic before send/export and enforces global target caps. Unknown opt-out or cap race blocks without consuming budget.
- Shared sender is unavailable by design. Platform send requires verified entity sender/provider receipt; export records user-controlled handoff, not delivery.
- Outcome is append-only accepted/rejected/silence/bounce/coverage; bounce lowers contact confidence and never means rejection.
- Directory stores professional provenance/interests/confidence/staleness only. Unverified contributions quarantine; scraped/private/personal contact rejects.
- Private CRM is entity-owned structured history and exportable. B5-gated free-text notes remain absent/excluded; directory-only facts cannot be exported as private contacts.
- Global accountless target opt-out suppresses all senders for canonical contact hash/channel.

## Link, Pre-Save and Promotion Invariants

- Smart link has durable slug, canonical/unmanaged destinations and explicit unavailable states. Visitor preference routes destination and records privacy-minimal first-party click without audience capture/fingerprint/raw IP event.
- Pre-save grant is fan-authorized, one provider/release, exact narrow scope, expiring/revocable and stored in token vault. It creates no marketing consent.
- Execution occurs once when release/provider available; retry is bounded inside validity and final provider denial/expiry is explicit.
- Link retirement is `keep|canonical_redirect|retired_page`; hard delete refused and ongoing traffic prompts review.
- Paid-promotion plan is advisory assumptions/channel/budget/creative only. No provider spend, ad-account access or fan-data audience export.
- Creator seeding brief references Shard 14 engagement, binds non-removable disclosure/amplification terms and requires rights. Prohibited placement promise blocks.
- Promotion offer classifier emits immutable `unpaid_allowed|paid_review_only|prohibited` with terms/explanation. Unknown/evaluator outage fails closed; stricter terms win; paid-review-only never activates brokerage.

## Social, Coverage, Event and EPK Invariants

- Social job pins immutable post rendering/beat, entity connection, provider capability version, due time and one idempotency key. Capability/disconnect invalidates before handoff.
- Reconciliation uses provider receipt/read-back or actor attestation and returns `published|failed|unknown|manual`; timeout never infers success.
- Coverage claim stores URL/artifact class, source, strength, observed/retrieval time and permitted evidence, not copied article body. Monitoring suggestion never auto-inserts or strengthens truth.
- Tour/event announce derives per-date readiness from first-party show, venue notice and on-sale facts, with embargo notices/tagged links. It never claims venue-contract authority.
- Soft-date diagnosis requires sufficiently fresh sales facts and returns evidence/confidence/actions to authorized artist/venue; sparse/stale withholds and never auto-spends.
- Ticket attribution is observed last eligible first-party click/session to settled order, net of refunds. Off-platform is click-only; no multi-touch/modelled credit claim.
- EPK is immutable version of authorized assets/credits/access policy with recipient-scoped revocable link. Claimed credits remain labelled; missing photo/audio authority blocks affected asset only.
- Embargo/exclusive pins asset/scope/counterparty/lift/source authority. Overlap blocks, least-detail notice propagates, and wall-clock lift is monotonic/irreversible.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/promotion-campaigns` | entity/kind/anchor/rule pack/key; campaign actor | `201 PromotionCampaignResponse`; campaign/grid/readiness | `403`, `409 SOURCE_STALE`, `422 RULE_PACK_REQUIRED`, `429` |
| `GET /api/v1/promotion-campaigns/{id}/readiness` | campaign version; campaign actor | `CampaignReadinessResponse`; rows/verifiers/provenance/freshness | `403`, `404`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/beats` | offset-or-pinned position/channel/expected version/key; editor | `201 CampaignBeatResponse`; successor/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/anchor-cascade-previews` | proposed anchor/campaign+source versions/key; source owner | `CampaignCascadePreviewResponse`; classifications/conflicts/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/anchor-changes` | preview hash/step-up/expected versions/key; source owner | `PromotionCampaignResponse`; anchor/movable beats/tasks | `403 STEP_UP_REQUIRED`, `409 PREVIEW_STALE|VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/dsp-pitches` | release/track/provider rule version/key; campaign actor | `201 DspPitchResponse`; prefill/blockers/external steps | `403`, `409 SOURCE_STALE`, `422 PROVIDER_FACTS_MISSING`, `429` |
| `POST /api/v1/promotion-pitches` | target/ask/typed content/disclosures/campaign refs/key; outreach actor | `201 PromotionPitchResponse`; immutable draft revision | `403`, `409 TARGET_STALE`, `422 MASS_PERSONALIZATION_FORBIDDEN|DISCLOSURE_REQUIRED`, `429` |
| `POST /api/v1/promotion-pitches/{id}/budget-leases` | sender/target/channel/policy version/key; outreach actor | `201 PitchBudgetLeaseResponse`; lease/expiry | `403 TARGET_OPTED_OUT`, `409 TARGET_CAP_RACE`, `422`, `429` |
| `POST /api/v1/promotion-pitches/{id}/dispatches` | lease/send-or-export/provider capability/key; verified entity sender | `201 PitchDispatchResponse`; receipt or export handoff | `403 SHARED_SENDER_UNAVAILABLE`, `409 LEASE_EXPIRED|CAPABILITY_LOST`, `422`, `429` |
| `POST /api/v1/promotion-pitches/{id}/outcomes` | outcome/provenance/occurred time/key; entity actor | `201 PitchOutcomeResponse`; append-only outcome/confidence effect | `403`, `409 OUTCOME_EXISTS`, `422`, `429` |
| `POST /api/v1/promotion-directory/targets` | professional identity/channel/interests/provenance/confidence/key; steward | `201 DirectoryTargetResponse`; accepted/quarantined/version | `403`, `409 DUPLICATE_TARGET`, `422 PRIVATE_CONTACT_FORBIDDEN`, `429` |
| `POST /api/v1/entities/{id}/promotion-crm-exports` | mandate/step-up/format/scope/key; entity controller | `202 PromotionCrmExportResponse`; export/manifest/exclusions | `403 STEP_UP_REQUIRED|MANDATE_REQUIRED`, `422 B5_NOTES_EXCLUDED|DIRECTORY_ONLY_EXCLUDED`, `429` |
| `POST /api/v1/smart-links` | slug/source/destinations/retirement policy/key; entity actor | `201 SmartLinkResponse`; durable link/destination states | `403`, `409 SLUG_TAKEN`, `422 SOURCE_INELIGIBLE`, `429` |
| `GET /l/{slug}` | destination preference/context | `302` selected destination or `SmartLinkPageResponse` unavailable state | `404`, `410`, `429` |
| `POST /api/v1/smart-links/{id}/pre-save-grants` | provider/release/scopes/expiry/OAuth proof/key; fan | `201 PreSaveGrantResponse`; active/denied/expiry | `403`, `409 GRANT_EXISTS`, `422 SCOPE_TOO_BROAD`, `429` |
| `POST /internal/v1/pre-save-grants/{id}/executions` | release availability/provider capability/event key; pre-save worker | `PreSaveGrantResponse`; succeeded/queued/failed | `403`, `409 EVENT_REUSED|GRANT_EXPIRED`, `429` |
| `POST /api/v1/smart-links/{id}/retirements` | keep/redirect/retired-page/expected version/key; entity actor | `SmartLinkResponse`; retired behavior/version | `403`, `409 VERSION_CONFLICT`, `422 HARD_DELETE_UNSUPPORTED`, `428`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/paid-plans` | goals/budget ceiling/market/assumptions/key; campaign actor | `201 PaidPromotionPlanResponse`; advisory plan | `403`, `422 PROVIDER_SPEND_FORBIDDEN|FAN_DATA_EXPORT_FORBIDDEN`, `429` |
| `POST /api/v1/promotion-seeding-briefs` | campaign/creator engagement/disclosure/amplification/rights/key; campaign actor | `201 SeedingBriefResponse`; active/blocked brief | `403`, `409 ENGAGEMENT_STALE`, `422 DISCLOSURE_REQUIRED|PLACEMENT_PROMISE_PROHIBITED`, `429` |
| `POST /api/v1/promotion-offer-classifications` | intent/value exchange/channel/terms key; policy actor | `201 PromotionOfferVerdictResponse`; verdict/explanation/version | `403`, `409 TERMS_STALE`, `422 EVALUATOR_UNKNOWN|PROHIBITED`, `429` |
| `POST /api/v1/promotion-social-jobs` | connection/provider/rendering/beat/due/capability version/key; social actor | `201 SocialPublishJobResponse`; scheduled/version | `403`, `409 CAPABILITY_LOST|CONNECTION_REVOKED`, `422`, `429` |
| `POST /internal/v1/promotion-social-jobs/{id}/reconciliations` | receipt/read-back-or-attestation/event key; social worker | `SocialPublishJobResponse`; published/failed/unknown/manual | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/promotion-coverage` | URL/artifact class/source/evidence/observed time/key; entity actor/verifier | `201 CoverageEvidenceResponse`; claimed/verified strength | `403`, `409 COVERAGE_EXISTS`, `422 ARTICLE_BODY_FORBIDDEN`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/event-announce-plans` | first-party shows/venue notices/on-sale facts/key; campaign actor | `201 EventAnnouncePlanResponse`; date readiness/embargo/tagged links | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/promotion-campaigns/{id}/soft-date-diagnostics` | event/sales/refunds/freshness versions/key; artist or venue actor | `201 SoftDateDiagnosticResponse`; evidence/confidence/actions or withheld | `403`, `409 SOURCE_STALE`, `422 DATA_INSUFFICIENT`, `429` |
| `POST /internal/v1/promotion-ticket-attributions` | eligible click/session/settled order/refund state/key; attribution worker | `201 TicketAttributionResponse`; observed/net conversion | `403`, `409 EVENT_REUSED`, `422 OFF_PLATFORM_CLICK_ONLY`, `429` |
| `POST /api/v1/promotion-epks` | campaign/blocks/assets/credits/access policy/key; entity actor | `201 EpkResponse`; immutable version/share policy | `403`, `409 SOURCE_STALE`, `422 ASSET_AUTHORITY_REQUIRED`, `429` |
| `POST /api/v1/promotion-epks/{id}/share-links` | recipient/scope/expiry/key; entity actor | `201 EpkShareResponse`; revocable scoped link | `403`, `422 SCOPE_TOO_BROAD`, `429` |
| `POST /api/v1/promotion-embargoes` | campaign/asset/scope/counterparty/lift/source authority/key; campaign actor | `201 EmbargoResponse`; active/version/notices | `403`, `409 OVERLAPPING_EXCLUSIVE`, `422`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Promotion campaign revision | `draft -> scheduled|cancelled`; `scheduled -> active|stale|cancelled`; `active -> completed|stale|cancelled`; `stale -> superseded|cancelled` | Current anchor, rule pack, authority and readiness gates schedule the immutable revision. Source/rule change marks stale and creates review tasks; no historical grid rewrites. |
| Readiness item | `unknown -> blocked|ready`; `blocked -> ready|stale`; `ready -> stale`; `stale -> superseded` | Named verifier and current provenance derive state; unknown never guesses. A current verified successor alone clears blocked/stale state. |
| Anchor cascade preview | `active -> committed|expired|stale`; `committed|expired|stale -> active` is forbidden | Step-up source owner commits the unchanged preview/hash and atomically moves only `movable` beats; escaped work becomes owned tasks. Pinned, stranded, elapsed and embargo-conflict items never silently move. |
| Outreach item | `draft -> approved|blocked`; `approved -> sent|exported|cancelled`; `sent|exported -> accepted|rejected|silence|bounce|coverage` | Disclosure, offer and budget-lease gates precede send/export. Provider receipt proves send; export proves only handoff, and append-only outcomes never reinterpret bounce as rejection. |
| Delivery budget lease | `reserved -> consumed|released|expired` | Atomic target/sender/channel cap reservation precedes transport. Unknown opt-out or cap race releases without send; terminal leases never consume twice. |
| Smart link | `active -> keep|canonical_redirect|retired_page`; destinations `available -> unavailable|superseded` | Explicit retirement policy preserves durable slug; hard delete returns `422 HARD_DELETE_UNSUPPORTED`. Unavailable destinations render a state rather than silently rerouting outside policy. |
| Pre-save grant | `active -> queued|revoked|expired|denied`; `queued -> succeeded|failed|revoked|expired`; `failed -> queued|closed` | Exact provider/release scope and validity permit one execution with bounded retries. Grant never creates marketing consent; final denial, expiry and revocation are explicit and terminal for that grant. |
| Social publish job | `scheduled -> handed_off|cancelled|invalidated`; `handed_off -> published|failed|unknown`; `unknown -> published|failed|manual` | Due-time capability/connection recheck precedes one idempotent handoff. Ambiguous provider outcome reconciles from receipt/read-back/attestation; no duplicate auto-send. |
| EPK/share/embargo | EPK `current -> superseded`; share `active -> expired|revoked`; embargo `active -> lifted|superseded` | Source or policy successor preserves immutable EPK history; TTL/revocation ends scoped access; authoritative lift ends embargo and emits notices. Overlapping exclusive scope blocks creation. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; external send, spend, brokerage activation or hard deletion outside the named gates returns `409 PROMOTION_POLICY_VIOLATION`.

## Persistence, RLS and Workers

- Campaign/grid/beat/preview/task, pitch/lease/opt-out/directory/CRM, smart-link/click/pre-save, plan/brief/verdict/social, coverage/event signal/attribution, EPK/share and embargo rows pin actor/source/policy versions.
- RLS isolates campaigns/outreach/CRM to entity, global opt-out to suppression service, tokens to vault, recipient EPK to grant and click/session data to privacy-window attribution. No fan marketing list or raw IP event exists.
- Grid, quota, dispatch, link, pre-save, classifier, social, coverage, event diagnostic, attribution, EPK and embargo workers are idempotent. B2/B5/provider gate changes invalidate pending effects and never loosen capture terms silently.

## Failure, Deepening and Ambiguity Gate

Tests cover guessed rule offset, attestation labelled validated, cascade mutation preview, stale commit, fake DSP submission, shared sender fallback, cap sybil race, global opt-out bypass, directory scraping, B5 note smuggling, pre-save marketing consent, hard-delete slug, ad spend/fan export, payola euphemism, timeout success, monitoring auto-insert, sparse soft-date claim, multi-touch inflation, EPK authority leak and embargo rollback. Seven passes converge; two implementers receive identical promotion and marketing behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Promotion and marketing contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
- [[specs/ia/deep-dives/38-promotion-marketing|Deep Dive 38 — Promotion and marketing]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagements — Backend Specification]]
- [[specs/be/22a-release-build-readiness-footprint|Release build, readiness and footprint — Backend Specification]]
- [[specs/be/35b-ticket-carts-orders-waitlists|Ticket carts, orders and returned-inventory waitlists — Backend Specification]]
- [[specs/be/37-fanbase-direct-to-fan|Fanbase and direct-to-fan — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
- [[specs/ia/deep-dives/38-promotion-marketing|Deep Dive 38 — Promotion and marketing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/22a-release-build-readiness-footprint|Release composition, readiness, footprint, dates and identifiers — Backend Specification]]
- [[specs/be/35b-ticket-carts-orders-waitlists|Ticket carts, orders and returned-inventory waitlists — Backend Specification]]
- [[specs/be/37-fanbase-direct-to-fan|Fanbase and direct-to-fan — Backend Specification]]
