# Booking announcement, documents, amendments and payment assertions — Backend Specification

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

- **Shard split:** 3 of 5; 30.14, 30.15, 30.16, 30.17, 30.18 and 30.19.
- **Boundary:** announcement prerequisites, reproducible deal documents, append-only amendments, payment schedules/assertions and overdue options.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 30 IA/deep dive | hard announcement gates, binding/template versions, amendment and payment evidence |
| Shards 03, 05 and 18 | governed templates/settings and exact-money evidence patterns |

## Deal Document and Payment Invariants

- Announcement authorization requires confirmed deal plus current deposit, lineup and embargo prerequisite snapshot; blocker is exact and authorization is durable/revocable.
- Deal memo/long form renders reproducibly from accepted/amended version, approved template/binding version and locale. Accessible HTML is parity source; PDF is a view, never source.
- Amendment is complete immutable successor approved by required chains based on materiality. Schedule/document append successor and paid history is never edited.
- Payment schedule supports explicit zero deposit, timed/deferred rows, payer/payee/direction, exact amount/currency and reminders. Invalid gap/party/direction rejects.
- Provider-confirmed or authorized bilateral assertion appends against row/version and never mutates provider facts. State distinguishes `asserted|confirmed|contested|overdue|waived`.
- Ambiguous provider remains pending and reconciles. Overdue exposes at-risk state and principal options; no automatic void unless accepted term explicitly grants it.
- Payment events contain no bank/card data. Multi-party funds/effects remain behind B3 counsel/provider gate.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/booking/deals/{id}/announcement-authorizations` | prerequisite refs/versions/key; binding venue/artist authority | `201 AnnouncementAuthorizationResponse`; authorized/blocked/revoked | `403`, `409 DEPOSIT_UNSATISFIED|LINEUP_UNRESOLVED|EMBARGO_ACTIVE|HARD_GATE_FAILED`, `429` |
| `POST /api/v1/booking/deals/{id}/documents` | deal version/template/binding/locale/key; participant | `201 DealDocumentResponse`; HTML/artifact hash/template refs | `403`, `409 TEMPLATE_UNAPPROVED|BINDING_MISSING`, `422 SIGNATURE_GATE_DISABLED`, `429` |
| `POST /api/v1/booking/deals/{id}/amendments` | complete successor/materiality/approval rules/expected version/key; negotiator | `201 BookingDealAmendmentResponse`; pending/accepted successor | `403`, `409 APPROVAL_INCOMPLETE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `PUT /api/v1/booking/deals/{id}/payment-schedule` | rows/payer-payee/direction/reminders/expected version/key; finance-authorized participant | `BookingPaymentScheduleResponse`; versioned rows | `403`, `409 VERSION_CONFLICT`, `422 SCHEDULE_GAP|PARTY_INVALID|DIRECTION_INVALID`, `428`, `429` |
| `POST /api/v1/booking/payment-rows/{id}/assertions` | provider event or bilateral assertion/amount/currency/evidence/key; authorized source | `201 BookingPaymentAssertionResponse`; asserted/confirmed/contested/pending | `403`, `409 AMOUNT_MISMATCH|ASSERTION_CONTESTED`, `422 PROVIDER_AMBIGUOUS`, `429` |
| `POST /internal/v1/booking/payment-rows/{id}/overdue-evaluations` | due time/schedule+term versions/event key; reminder worker | `BookingPaymentRowResponse`; at-risk/options/no-op | `403`, `409 EVENT_REUSED|ROW_SETTLED`, `429` |

## Persistence, RLS and Workers

- Announcement prerequisite/auth records, template/binding/document hashes, amendments/approvals, payment schedule rows/assertions/reconciliation and overdue evaluations pin source, authority and provider versions using exact money storage.
- RLS exposes documents/schedules to deal participants by role, restricted assertions to finance-capable actors and only opaque operational refs downstream. Provider IDs remain restricted.
- Announcement, document, reminder, provider reconciliation and overdue workers are idempotent; ambiguous callbacks cannot confirm money or void deal.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Announcement authorization | `blocked → authorized`; authorized `→ revoked|stale|superseded` | Confirmed deal/current deposit-lineup-embargo-hard-gate snapshot triggers. Exact blocker prevents authorization; no fan announcement occurs here. |
| Deal document | `queued → rendered|failed`; rendered `→ superseded|stale`; HTML remains parity source and PDF derivative | Accepted/amended deal, approved template/binding/locale trigger. Unapproved template/missing binding blocks and signature gate remains explicit. |
| Deal amendment | `draft → approval_pending → accepted|rejected|expired`; accepted `→ superseded` by later amendment | Complete successor/materiality approval chains trigger. Schedule/document append successors and paid history never edits. |
| Payment schedule row | `scheduled → asserted|pending_provider|confirmed|contested|overdue|waived`; asserted/pending `→ confirmed|contested|failed`; overdue may later confirm/waive | Exact row/version provider or bilateral evidence/timer trigger. Ambiguity never confirms and overdue never auto-voids absent accepted term. |
| Payment reconciliation | `pending → confirmed|failed|unknown`; unknown retries stable provider identity | Provider evidence triggers. Payment events omit bank/card data and B3 blocks multi-party money effects. |

Every unlisted transition returns the typed state/version/payment conflict. Provider IDs and assertions remain finance scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover announcement without deposit, PDF-as-source, unapproved template, in-place amendment, paid-history rewrite, omitted zero deposit, provider fact mutation, ambiguous confirmation, bank/card event leak and automatic overdue void. Seven passes converge; two implementers receive identical announcement, document and payment behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Announcement, document and payment contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking contracts]]
- [[specs/be/03b-editorial-workflow-publication|Editorial workflow and publication — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, restatement and statements — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking, negotiation and contracts]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/03b-editorial-workflow-publication|CMS entries, revisions, review, scheduling and publication — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, recoupment, restatement and payee statements — Backend Specification]]
