# Booking offers, counters, approvals and confirmation — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]  
**Deep Dive:** [[specs/ia/deep-dives/30-booking-contracts|Booking contracts deep dive]]

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

- **Shard split:** 2 of 5; 30.06, 30.07, 30.08, 30.09, 30.10, 30.11, 30.12 and 30.13.
- **Boundary:** private typed offers, external-recipient links, sibling counters, verbal transcription, binding approvals, atomic acceptance and challenged-position confirmation.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 30 IA/deep dive | immutable offer DAG, authority chains, external recipients and acceptance races |
| Shards 01 and 29 | entity claims/binding authority and physical-resource confirmation |

## Offer and Acceptance Invariants

- Draft is private and entity-owned. Sent version is complete, immutable and typed with economics, outcomes, room snapshots, rider ref, parent hashes, expiry and hold expiry.
- Unsupported terms produce vocabulary gap; contradictory free text blocks. Unstructured signal requires explicit acknowledgement and never overrides typed terms.
- External-recipient link is revocable, expiring and readable without account; approval/acceptance requires claimed entity plus current binding authority.
- Counter creates complete child version. Concurrent counters are sibling leaves; sibling live leaves block acceptance. Countering never resets expiry; extension is a new version.
- Verbal agreement is attributed unconfirmed transcription until counterparty confirms exact hash/content.
- Approval binds version hash under side rule, excludes self-dealing and invalidates on authority loss. Non-adverse carry-forward follows explicit rule only.
- Acceptance atomically requires sole live unexpired leaf, both approval chains, compatible commercial positions and active physical hold. Challenged confirmation selects one terminal result and releases losers.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/booking/offer-threads` | parties/position/room-slot refs/draft/key; eligible composer | `201 BookingOfferThreadResponse`; private draft/claim | `403`, `409 DRAFT_CLAIM_LOST`, `422 TERM_UNSUPPORTED`, `429` |
| `POST /api/v1/booking/offer-threads/{id}/versions` | full typed offer/snapshots/rider/parents/expiry/key; negotiator | `201 BookingOfferVersionResponse`; immutable hash/diff/outcomes | `403`, `409 ECONOMIC_CONTRADICTION`, `422 EXPIRY_INVALID`, `429` |
| `POST /api/v1/booking/offer-versions/{id}/recipient-links` | recipient entity/expiry/key; sender | `201 ExternalOfferLinkResponse`; revocable link/provenance | `403`, `409 RECIPIENT_RESOLVED`, `422`, `429` |
| `POST /api/v1/booking/offer-versions/{id}/transcription-confirmations` | expected hash/content confirmation/key; counterparty negotiator | `BookingOfferVersionResponse`; negotiable confirmation | `403 AUTHORITY_REQUIRED`, `409 CONTENT_MISMATCH`, `422 TRANSCRIPTION_UNCONFIRMED`, `429` |
| `POST /api/v1/booking/offer-versions/{id}/approvals` | side/authority proof/rule version/hash/key; binding actor | `201 OfferApprovalResponse`; valid/invalidated approval | `403 SELF_APPROVAL_FORBIDDEN|AUTHORITY_INSUFFICIENT`, `409 VERSION_NOT_LIVE`, `429` |
| `POST /api/v1/booking/offer-versions/{id}/acceptances` | sole leaf hash/chain results/thread+hold versions/key; binding actor | `201 BookingDealResponse`; accepted/positions confirmed | `403`, `409 MULTIPLE_LIVE_LEAVES|APPROVAL_INCOMPLETE|OFFER_EXPIRED|HOLD_CONFLICT`, `429` |
| `POST /api/v1/booking/deals/{id}/challenge-confirmations` | selected position/challenge+hold versions/key; artist binding actor | `BookingDealResponse`; confirmed/losers released | `403`, `409 CHALLENGE_RACE_LOST|VERSION_CONFLICT`, `428`, `429` |

## Persistence, RLS and Workers

- Offer thread/draft, immutable DAG versions, external links, transcription confirmations, approvals/invalidations, accepted deal and challenge result pin actor/authority/snapshot versions.
- RLS grants full thread only to side negotiators/approvers; ordinary members receive accepted logistics; cross-side internal approvals, draw and cost assumptions remain private.
- Expiry, authority invalidation, link revocation and losing-position release workers are idempotent. Acceptance transaction writes deal/outbox atomically.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Offer thread/version DAG | thread `draft → negotiating → accepted|expired|withdrawn|deadlocked`; each sent leaf `live → countered|accepted|declined|expired|superseded` | Complete typed offer/counter/response/timer triggers. Sibling live leaves block acceptance; counter never resets expiry. |
| External recipient link | `active → claimed|revoked|expired`; claimed link never substitutes binding authority | Sender/recipient identity/timer trigger. Read may be unauthenticated, approval/acceptance may not. |
| Verbal transcription | `unconfirmed → confirmed|rejected|superseded` | Counterparty exact hash/content confirmation triggers. Unconfirmed text cannot negotiate/override typed terms. |
| Offer approval | `pending → valid|rejected`; valid `→ invalidated|carried_forward` only by explicit non-adverse rule | Binding side authority/hash/rule trigger. Self-dealing or authority loss blocks/invalidates. |
| Deal acceptance | `pending → accepted|blocked|race_lost`; challenged accepted deal `→ confirmed` with loser positions released | Sole live leaf, both approval chains, compatible positions and active hold transaction trigger. Any missing/expired/conflicting leg prevents partial deal. |

Every unlisted transition returns the typed state/version/hash conflict. Cross-side internal approvals and economics remain private.

## Failure, Deepening and Ambiguity Gate

Tests cover free-text override, external-link acceptance, sibling-leaf acceptance, counter expiry reset, unconfirmed transcription, self-approval, authority-loss approval, holdless acceptance and double challenge winner. Seven passes converge; two implementers receive identical offer, approval and acceptance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Offer and acceptance contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking contracts]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking, negotiation and contracts]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]
