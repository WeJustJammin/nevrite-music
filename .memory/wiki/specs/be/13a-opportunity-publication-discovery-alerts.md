# Opportunity publication, targeting, discovery and alerts — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/13-opportunities-casting|Opportunities and casting deep dive]]

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

- **Shard split:** 1 of 4; OPP-01 through OPP-06. Submissions, hiring decisions and downstream handoff remain separate.
- **Boundary:** immutable opportunity types, slots/decider attribution, compensation/spec-work publication gate, ordered targeting, live-term succession, finite board projection and explicit bounded alerts.
- **Approval:** Recommended split accepted under standing autonomy.

## Publication and Discovery Invariants

- Draft requires explicit acting party, attributed poster and current decider authority, immutable platform type, slots, date/location semantics, decide-by, compensation and criteria. Context may prefill facts but never compensation.
- Published type is immutable. Publication validates type/date/slot schema, casting class, six compensation facets—shape, amount/basis, unit, currency, expenses and timing—criteria trust, rights, unused-submission policy, targeting and gate-rule version. No admin force-publish exists.
- Applicant fees, credit-as-pay, unbounded negotiable and zero flat fee are invalid. Unpaid requires legitimate presence outcome or one evaluation-only deliverable round with no use rights and return/destruction on non-selection; further rounds require paid trial.
- Protected criteria are unrepresentable for labour-class types; performance exceptions require an approved jurisdiction profile. Points/buyout require named base/scope and explicit AI/model-training line.
- Material live edit creates a frozen successor, re-gates, shows an applicant-readable delta and marks every active submission `terms_changed` with Stay/Withdraw. Silence preserves candidacy; new applicants bind the successor.
- Target cascade freezes ordered invite/trusted-network/qualified-local/broad predicates and timing. Trusted network uses verified-credit collaboration evidence, never follows.
- Board resolves targeting, restrictions, own-party exclusion, availability/reachability and material evidence before rank. It is finite/exhaustible, fit-primary with recency only as equal-fit tie-break, session-stable with explicit “N new,” one-sentence reasons and degraded/unknown inputs.
- Alerts exist only from explicit user intent, at most 20 live intents/account and two lifetime deliveries/user/post. Critical requires context-raised status and material confidence; push contains minimum safe recipient facts and never claims read/notified.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/opportunities` | `CreateOpportunityRequest`: acting party, decider authority ref, type/version, context and slots; poster/key | `201 OpportunityResponse`; draft/container/slot versions | `403`, `409`, `422 TYPE_OR_AUTHORITY_INVALID`, `429` |
| `PATCH /api/v1/opportunities/{id}` | draft-only container/slot fields; poster ETag/key | `OpportunityResponse`; successor draft/version | `403`, `404`, `409 TYPE_IMMUTABLE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/opportunities/{id}/publication-preflights` | terms/criteria/compensation/spec-work/rights/targeting/rule versions; poster/key | `PublicationPreflightResponse`; exact blocking/warning gaps/hash | `403`, `409 SOURCE_STALE`, `422 PUBLICATION_GATE_FAILED`, `429`, `503` |
| `POST /api/v1/opportunities/{id}/publish` | preflight/source hash; poster+decider ETag/key | `OpportunityResponse`; frozen published terms/slots/outbox version | `403 DECIDER_AUTHORITY_REQUIRED`, `409 PREFLIGHT_STALE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/opportunities/{id}/terms-successors` | complete new terms and reason; poster/decider ETag/key | `201 TermsVersionResponse`; re-gated successor/delta/applicant notices | `403`, `404`, `409 SOURCE_STALE|VERSION_CONFLICT`, `422 COMPENSATION_OR_CRITERIA_INVALID`, `428`, `429` |
| `POST /api/v1/opportunities/{id}/targeting-stages` | ordered predicates/times/notification policy; poster ETag/key | `201 TargetingCascadeResponse`; frozen cascade/version | `403`, `404`, `409 VERSION_CONFLICT`, `422 FOLLOW_GRAPH_FORBIDDEN|STAGE_INVALID`, `428`, `429` |
| `GET /api/v1/opportunities` | type/role/date/location/compensation/fit session cursor, limit<=50 | `OpportunityBoardPage`; safe finite results/reasons/freshness/new count | `422 CURSOR_INVALID`, `429`, `503` |
| `GET /api/v1/opportunities/{id}` | public/professional viewer projection | `OpportunityDetailResponse`; viewer-safe terms/slots/freshness/eligibility gaps | `404`, `429`, `503` |
| `POST /api/v1/me/opportunity-alerts` | bounded query/type preferences, tier ceiling, expiry; user/key | `201 AlertIntentResponse`; explicit intent/version/budget | `403`, `409 ALERT_INTENT_LIMIT`, `422`, `429` |
| `PATCH /api/v1/me/opportunity-alerts/{id}` | preferences/pause/expiry; owner ETag/key | `AlertIntentResponse`; version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `DELETE /api/v1/me/opportunity-alerts/{id}` | owner ETag/key | `204`; cancelled version | `403`, `404`, `409`, `428`, `429` |

Board reads are 120/min/person/IP; drafts 30/hour/poster; preflight/publish/terms 20/hour/post; targeting 20/hour; alerts 30/min and 20 live/account. Private professional compensation/protected filters are omitted from Fan projection. Alert delivery uses quiet hours, per-device evidence and no raw private matching facts.

## Persistence, RLS and Workers

Tables: `opportunity.opportunities`, `opportunity_slots`, `opportunity_terms_versions`, `compensation_specs`, `eligibility_criteria`, `targeting_stages`, `board_documents`, `alert_intents`, `alert_deliveries` and audit events. Type and handoff mode are immutable after publication; terms/targeting pin rule versions.

RLS is acting-party/poster/decider and viewer-projection bound. A serializable publish RPC re-resolves authority and commits terms/slots/outbox only after all gates. Board workers create viewer-safe documents from source versions; cache age over 60 minutes removes fit claims and displays age rather than blanking. Alert workers calculate policy tier, respect user ceiling/quiet hours, dedupe user/post and record device delivery without claiming user receipt.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Opportunity | `draft → published → closed|cancelled|expired`; published remains published while material terms move through a successor | Poster/decider publish, close/cancel or database-time expiry triggers. Invalid authority/type/compensation/criteria/rights/targeting gate blocks; type and handoff mode never change after publication. |
| Terms version | `draft → preflight_passed|blocked`; passed `→ active`; active `→ superseded` | Exact preflight/source hash and authorized publish/successor command trigger. Material edit freezes/re-gates successor and marks active submissions terms-changed; stale or blocked versions cannot activate. |
| Targeting cascade | `draft → active → completed|expired|cancelled`; active `→ superseded` only by an authorized versioned replacement | Frozen ordered stage times/predicates trigger. Follow graph, stale source or invalid stage blocks; platform confidence never reorders stages. |
| Board document | `active → stale|suppressed|removed`; stale `→ active` after current authorized rebuild | Source/restriction/availability/evidence/cache-age change triggers. Over-age cache removes fit claims and shows age; dependency loss yields degraded/unknown rather than fabricated eligibility. |
| Alert intent | `active ↔ paused`; active/paused `→ expired|cancelled`; expired requires a new intent | Owner command or database-time expiry triggers. Live-intent ceiling, invalid scope/tier or stale version blocks; intent never exists implicitly. |
| Alert delivery | `eligible → queued → delivered_to_device|failed|suppressed`; failed may retry within the two-delivery lifetime budget | Current match/policy/quiet-hour/device consent triggers. State proves device delivery only, never read/notified; revoked consent or exhausted budget suppresses. |

Every unlisted transition returns the typed state/version/gate conflict. Events omit private matching, compensation and protected-filter facts.

## Failure, Deepening and Ambiguity Gate

Tests cover hidden acting identity, post-publish type change, missing compensation facet, applicant fee/credit-as-pay, unpaid reusable audition, protected labour criterion, admin force-publish, compensation decrease, silent applicant preservation, follow-based targeting, infinite-scroll/engagement rank, matching outage degradation, implicit alert and critical-alert abuse. Seven passes converge; two implementers receive identical publication, terms, board and alert behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Opportunity publication/discovery contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/deep-dives/13-opportunities-casting|Deep Dive 13 — Opportunities and casting lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths, reachability and warm introductions — Backend Specification]]
