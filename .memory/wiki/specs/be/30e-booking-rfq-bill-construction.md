# Booking RFQ triage and performance bill construction — Backend Specification

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

- **Shard split:** 5 of 5; 30.26 and 30.27.
- **Boundary:** structured booking RFQ rules/triage and named/TBA performance-bill slot construction with short/full deal threads.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 30 IA/deep dive | RFQ routing, structured auto-decline and bill/support-offer seam |
| Shards 13 and 29 | opportunity routing patterns and venue-pays performance handoff |

## RFQ and Bill Invariants

- RFQ requires eligible booking actor and structured act/use/date/territory/economics requirements. Free-form note is retained but never scored.
- Rules triage routes to correct party, avail or physical slot. Auto-decline cites real structured reason/rule version and remains reviewable; it never invents recipient intent.
- Bill owner controls named or TBA slot and attaches short-form or full offer thread. TBA remains explicit and cannot masquerade as confirmed act.
- Venue-pays/splits-with-act direction is required. Buy-on direction is rejected at seam; unsupported cancellation dependency remains explicit.
- Bill references immutable Shard 29 room/spec/availability snapshots and Shard 30 deal refs; it never duplicates either lifecycle.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/booking/rfqs` | actor/act/use/date/territory/economics/requirements/note/key; eligible booking actor | `201 BookingRfqResponse`; routed/held/declined with rule reason | `403`, `409 DUPLICATE_RFQ`, `422 REQUEST_INCOMPLETE`, `429` |
| `POST /api/v1/booking/rfqs/{id}/reviews` | challenged rule/reason/evidence/key; requester or assigned operator | `201 BookingRfqReviewResponse`; review/deadline | `403`, `409 REVIEW_EXISTS`, `422`, `429` |
| `POST /api/v1/booking/bills` | show/owner/Shard-29 snapshots/key; authorized venue actor | `201 BookingBillResponse`; bill/version | `403`, `409 SNAPSHOT_STALE`, `422`, `429` |
| `POST /api/v1/booking/bills/{id}/slots` | named-or-TBA act/control/direction/dependency/offer mode/expected version/key; bill owner | `201 BookingBillSlotResponse`; slot/offer thread refs | `403`, `409 SLOT_CONTROL_CONFLICT|VERSION_CONFLICT`, `422 BUY_ON_DIRECTION_FORBIDDEN`, `428`, `429` |

## Persistence, RLS and Workers

- RFQ/rule outcome/review and bill/slot/control/dependency rows pin actor, rules, snapshots and offer refs.
- RLS exposes RFQ detail to requester/assignee, bill operational state to participants and only opaque minimum refs outside the booking boundary; notes and private economics remain restricted.
- Triage, routing, review deadline and bill-projection workers are idempotent. Rules never consume free-text note as a scoring signal.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Booking RFQ | `submitted → routed|held|auto_declined|failed`; routed/held `→ responded|expired|withdrawn`; auto-declined `→ review_pending` on challenge | Structured actor/act/use/date/territory/economics rules trigger. Free text is retained but never scored; auto-decline cites real versioned reason. |
| RFQ review | `open → upheld|reversed|remanded|expired` | Requester/assigned operator evidence and deadline trigger. Review path remains visible. |
| Booking bill | `draft → active → completed|cancelled|superseded`; immutable Shard 29 snapshots pin each version | Authorized venue actor/current room/spec/availability snapshots trigger. Bill references but never duplicates room/deal lifecycle. |
| Bill slot | `TBA → named|cancelled`; named `→ confirmed|cancelled|superseded`; offer thread remains separate linked state | Bill owner control/direction/dependency/offer-mode trigger. TBA never masquerades as confirmed; buy-on direction blocks at seam. |

Every unlisted transition returns the typed state/version/snapshot conflict. Notes/private economics remain restricted and cross-boundary refs stay opaque.

## Failure, Deepening and Ambiguity Gate

Tests cover free-text scoring, invented auto-decline reason, hidden review path, TBA-as-confirmed, buy-on acceptance, stale venue snapshot, dual bill/deal lifecycle and unsupported dependency suppression. Seven passes converge; two implementers receive identical RFQ and bill-construction behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | RFQ and bill contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking contracts]]
- [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity publication, discovery and alerts — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking, negotiation and contracts]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity publication, targeting, discovery and alerts — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]
