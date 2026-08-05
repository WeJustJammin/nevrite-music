# Candidate triage, shortlists, offers and dispositions — Backend Specification

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

- **Shard split:** 3 of 4; OPP-10 through OPP-15. Acceptance commits before the 13d handoff and cannot be rolled back by downstream failure.
- **Boundary:** conflict-safe review assignment, recoverable triage, disagreement-preserving shortlist, irrevocable-fuse offers/counters, receipt-ordered acceptance, honest urgent cascades and immutable applicant dispositions.
- **Approval:** Recommended split accepted under standing autonomy.

## Decision Invariants

- Reviewer cannot be a candidate for the opportunity; exclusion overrides every grant and hides queue existence/details. High-consequence actions re-resolve Shard 01 activity/domain authority.
- Reject is disabled until queue, evidence, criteria and media are completely loaded. Advance/hold remain recoverable where safe; hold requires closed blocker, owner and resolve-by<=decide-by.
- Multi-reviewer reject is a vote; disagreement advances to shortlist. Independent reviews and attribution remain visible and are never averaged into authority or hidden behind a platform score.
- Bulk triage is criterion-scoped to a criterion live at submission with exact count and confirmation. No `reject remaining` command or applicant self-disposition/nudge exists.
- Offer re-runs compensation gate and shows exact post-to-offer delta, fuse, named external revoke causes and number of live parallel offers. Issuer cannot revoke inside fuse except named cause; counter is a reverse offer with its own gate/fuse/delta.
- Accept compares active offer and slot versions; a database receipt sequence—not device time—orders races. Winning transaction fills slot, commits durable acceptance and outbox atomically; losers receive explicit filled/cascade dispositions.
- Poster-ranked urgent cascade remains authoritative; platform confidence cannot reorder it. Parallel/serial behavior and fuse are disclosed. First valid receipt wins.
- Every submitted candidate receives one immutable per-slot disposition. Winning acceptance closes all remaining active submissions; delist/delete never discharges the obligation or history.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/opportunity-slots/{slotId}/review-assignments` | reviewer/authority/rubric/scope; decider/key | `201 ReviewAssignmentResponse`; assigned or conflict-denied version | `403`, `409 REVIEW_CONFLICT|ASSIGNMENT_EXISTS`, `422`, `429` |
| `POST /api/v1/opportunity-submissions/{id}/triage` | advance/reject/hold, criterion/evidence snapshot, blocker/owner/resolve-by; assigned reviewer/key | `201 TriageVoteResponse`; recoverable vote/state/version | `403 REVIEW_CONFLICT`, `404`, `409 EVIDENCE_INCOMPLETE|QUEUE_INCOMPLETE`, `422 HOLD_INVALID`, `429` |
| `POST /api/v1/opportunity-slots/{slotId}/bulk-triage` | criterion version/exact candidate IDs+count/decision; decider step-up/key | `202 BulkTriageResponse`; manifest/job ID | `403`, `409 CRITERION_STALE`, `422 REJECT_REMAINING_FORBIDDEN`, `429` |
| `PUT /api/v1/opportunity-slots/{slotId}/shortlist` | candidate set/source vote versions; decider ETag/key | `ShortlistResponse`; independent reviews/disagreement/version | `403`, `409 SOURCE_STALE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/opportunity-submissions/{id}/offers` | final terms/delta/compensation proof/fuse/parallel count/handoff mode; current decider/key | `201 OfferResponse`; irrevocable active version | `403`, `409 SLOT_ALREADY_FILLED|OFFER_ACTIVE`, `422 COMPENSATION_GATE_FAILED|DELTA_UNAVAILABLE`, `429` |
| `POST /api/v1/offers/{id}/counters` | full reverse terms/delta/fuse; candidate entity/key | `201 OfferResponse`; active counter version | `403`, `404`, `409 OFFER_EXPIRED|SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/offers/{id}/accept` | exact offer/slot versions and availability confirmation; candidate entity/key | `201 OfferAcceptanceResponse`; receipt sequence/winner/slot/outbox IDs | `403`, `404`, `409 OFFER_EXPIRED|SLOT_ALREADY_FILLED|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/offers/{id}/decline` | structured reason optional; candidate entity/key | `OfferResponse`; declined version | `403`, `404`, `409 OFFER_EXPIRED`, `422`, `429` |
| `POST /api/v1/opportunity-slots/{slotId}/urgent-cascades` | ordered candidate IDs, serial/parallel mode/fuses/disclosure; poster/decider key | `201 UrgentCascadeResponse`; exact rank/stages/version | `403`, `409 SLOT_STATE_CHANGED`, `422 CASCADE_INVALID`, `429` |
| `POST /internal/v1/opportunities/{id}/disposition-sweep` | winning acceptance or close cause/source versions; worker/key | `DispositionSweepResponse`; per-submission committed/noticed counts | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/opportunity-slots/{slotId}/pipeline` | owner/reviewer authorization, state cursor | `OwnerPipelinePage`; private candidates/reviews/obligations/freshness | `403`, `404`, `429`, `503` |

Review reads/writes are 120/min/reviewer; bulk jobs 10/hour/slot; offers/counters 20/hour/slot; accept/decline 30/min/candidate; urgent cascade 5/hour/slot. All private pipeline/offer responses are no-store and 100% audited where irreversible.

## Persistence, RLS and Workers

Tables: `opportunity.review_assignments`, `triage_votes`, `bulk_triage_jobs`, `shortlists`, `shortlist_reviews`, `offers`, `offer_responses`, `urgent_cascades`, `submission_dispositions` and audit events. Unique active offer/slot and unique disposition/submission/slot constraints enforce convergence.

RLS is slot-assignment/decider/applicant scoped; candidates cannot read competing queues. Serializable acceptance locks offer+slot, assigns monotonic receipt sequence, commits winner/filled slot/outbox and dispositions atomically. Bulk workers execute exact manifests through ordinary triage validation. Disposition workers retry notices without changing immutable truth.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Review assignment | `assigned → active → completed|revoked|conflicted` | Decider assignment and reviewer activity trigger. Candidate-reviewer identity conflict overrides every grant and blocks queue visibility/action. |
| Triage vote | immutable `advance|reject|hold`; hold has derived `open → resolved|expired|escalated` blocker state | Assigned reviewer decision with fully loaded queue/evidence/criteria/media triggers. Reject before complete load or invalid/open-ended hold blocks; reviewer disagreement resolves to shortlist, never averaged authority. |
| Shortlist version | `draft → active → superseded|closed` | Decider full-set replacement with exact vote versions triggers. Stale sources or unauthorized reviewer data block; independent reviews remain attributed. |
| Offer/counter | `active → accepted|declined|expired|revoked|superseded`; counter creates a gated active successor and supersedes the prior offer | Issuer/candidate command, database-time fuse/expiry or named revoke cause triggers. Compensation/delta/source failure blocks; issuer revoke inside fuse without named cause is forbidden. |
| Opportunity slot | `open → offer_active → filled|open|closed|cancelled`; only one acceptance transaction can yield filled | Offer issuance/termination or monotonic receipt-sequenced acceptance triggers. Stale offer/slot versions and losing concurrent receipts return filled conflict with no partial commit. |
| Urgent cascade | `draft → active → completed|cancelled|stale`; active stages advance in frozen poster rank | Authorized decider command, fuse expiry and offer outcomes trigger. Platform confidence cannot reorder, and slot/source change makes cascade stale. |
| Submission disposition | immutable exactly one of `accepted|declined|not_selected|slot_filled|cancelled|expired|withdrawn` per submitted candidate/slot | Winning acceptance or terminal close sweep atomically commits truth; notice delivery is separate retryable status. Delist/delete cannot erase or satisfy the obligation. |

Every unlisted transition returns the typed state/version/receipt conflict. Events omit competing queue details and preserve immutable disposition truth independently from notice delivery.

## Failure, Deepening and Ambiguity Gate

Tests cover candidate-reviewer grant override, partial queue reject, invalid hold, disagreement averaging, bulk reject remaining, compensation/delta gate, fuse revocation, two accepts, device-clock manipulation, urgent rank reordering, post deletion with open obligations, duplicate disposition and notice failure. Seven passes converge; two implementers receive identical triage, offer, race and disposition behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Triage, offer and disposition contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/deep-dives/13-opportunities-casting|Deep Dive 13 — Opportunities and casting lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/13b-submissions-auditions-pitches|Opportunity submissions, auditions and unsolicited pitches — Backend Specification]]
