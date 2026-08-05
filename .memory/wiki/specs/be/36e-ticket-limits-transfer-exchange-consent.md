# Ticket purchase limits, transfers, face-value exchange and consent — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]  
**Deep Dive:** [[specs/ia/deep-dives/36-box-office-risk|Box-office risk deep dive]]

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

- **Shard split:** 5 of 5; 36.18, 36.19, 36.20 and 36.21.
- **Boundary:** accumulated purchase limits, same-identity holder transfer, waitlist-first face-value exchange and named-party/purpose consent.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 36 IA/deep dive | purchase-limit accumulation, epoch transfer, face-value basis and consent propagation |
| Shards 06, 35 and 37 | fraud review, ticket identity/waitlist and downstream fan marketing |

## Risk, Transfer and Consent Invariants

- Purchase limit accumulates acquisitions across account/identified buyer before selection under versioned show policy. Circumvention signals review via Shard 06, never silent auto-block.
- Transfer preserves deterministic ticket identity, acquisition count and ticket epoch history; old credential invalidates atomically. Reversible before claim only and allowance never resets.
- Face-value listing requires valid unscanned ticket and price at or below original all-in per-ticket basis. Waitlist-first matching transfers holder and refunds seller atomically; unsold remains explicit.
- Fraud reviewer acts through case/evidence and cannot silently block account or mutate ticket.
- Consent names exact fan, marketing party, purpose, policy text/version, expiry and state. Decline leaves transaction unchanged.
- Withdrawal propagates future suppression; marketing party receives only fans consenting to that exact party/purpose and never inherited/general consent.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `PUT /api/v1/ticket-events/{id}/purchase-limit-policy` | limit/identity accumulation/rule version/expected version/key; operator | `PurchaseLimitPolicyResponse`; active version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/tickets/{id}/transfers` | ticket epoch/recipient claim/policy/expected version/key; holder | `201 TicketTransferResponse`; pending or claimed/new epoch | `403`, `409 TRANSFER_LOCKED|CLAIMED|VERSION_CONFLICT`, `422 ACCESS_ACK_REQUIRED`, `428`, `429` |
| `POST /api/v1/tickets/{id}/face-value-listings` | original all-in basis/price/seller policy/key; holder | `201 FaceValueListingResponse`; listed/waitlist posture | `403`, `409 TICKET_INELIGIBLE`, `422 PRICE_EXCEEDS_BASIS`, `429` |
| `POST /api/v1/face-value-listings/{id}/purchases` | matched waitlist buyer/payment/listing version/key; buyer | `201 TicketExchangeResponse`; atomic transfer/seller refund | `403`, `409 LISTING_UNAVAILABLE|PAYMENT_AMBIGUOUS`, `422`, `429` |
| `POST /api/v1/ticket-event-consents` | fan/event/named party/purpose/policy text+version/expiry/key; fan | `201 PartyConsentResponse`; granted/declined state | `403`, `409 TEXT_STALE`, `422 PARTY_UNNAMED|PURPOSE_INVALID`, `429` |
| `DELETE /api/v1/ticket-event-consents/{id}` | expected version/key; fan | `204`; withdrawn/suppression queued | `403`, `409 VERSION_CONFLICT`, `428`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Purchase-limit policy | `current -> superseded` | Expected-version update activates an immutable successor for future accumulation. Existing acquisition counts remain attached and never reset on policy, transfer or identity-epoch change. |
| Ticket transfer | `pending_claim -> claimed|cancelled|expired`; `pending_claim -> superseded` | Recipient claim atomically changes holder epoch and invalidates the old credential; sender may cancel only before claim. Claimed, expired or cancelled transfers cannot replay, and package/access acknowledgement gates remain binding. |
| Face-value listing | `listed -> matched|withdrawn|expired`; `matched -> settlement_pending|listed`; `settlement_pending -> sold|reconciliation_required`; `reconciliation_required -> sold|listed|closed` | Waitlist-first match reserves the exact ticket/version; atomic buyer payment, holder transfer and seller refund complete sale. Ambiguity remains explicit, above-basis price never lists, and unsold ticket stays with seller. |
| Circumvention signal | `open -> case_routed|dismissed`; `case_routed -> resolved` | Versioned purchase-policy evaluation emits evidence to Shard 06 review. Signal alone never blocks an account or mutates a ticket. |
| Party consent | `granted -> withdrawn|expired`; `declined -> granted`; `withdrawn|expired -> granted` only through a new consent record | Explicit fan choice records the exact named party, purpose and text version; decline leaves transaction unchanged. Withdrawal/expiry ends future disclosure and cannot be silently reversed. |
| Consent suppression | `queued -> applied|failed`; `failed -> queued` | Withdrawal enqueues purpose/party-specific future suppression; idempotent propagation records each recipient result. Until applied, downstream exports must exclude the withdrawn consent rather than rely on stale projection. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; any allowance reset, old-credential revival or inherited/general consent returns `409 POLICY_INVARIANT_VIOLATION`.

## Persistence, RLS and Workers

- Purchase policy/acquisition accumulator/circumvention signal, ticket transfer epochs, exchange listing/match/payment/refund and party consent/withdrawal/suppression rows pin source and policy versions.
- RLS exposes own acquisition/transfer/exchange/consent to fan, policy to operator and fraud evidence to case-bound reviewers. Marketing receives consented projections only.
- Limit, transfer, exchange, fraud-routing and consent-suppression workers are idempotent; no retry resets allowance or replays claim.

## Failure, Deepening and Ambiguity Gate

Tests cover post-selection limit, circumvention auto-ban, transfer allowance reset, old credential validity, above-basis listing, non-atomic seller refund, hidden unsold state, generic consent, decline changing purchase and withdrawn marketing export. Seven passes converge; two implementers receive identical ticket-risk, exchange and consent behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Ticket limits, exchange and consent contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Box-office risk]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/35e-ticket-delivery-transfer-claim|Ticket delivery, pass projection and transfer claim — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/35e-ticket-delivery-transfer-claim|Ticket delivery, pass projection and transfer claim — Backend Specification]]
