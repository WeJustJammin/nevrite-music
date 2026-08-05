# Society affiliation, registration projection and delivery — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]  
**Deep Dive:** [[specs/ia/deep-dives/18-royalty-accounting|Royalty accounting deep dive]]

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

- **Shard split:** 1 of 5; ROY-01, ROY-02, ROY-03 and ROY-04.
- **Boundary:** affiliation provenance, immutable as-of registration projection, society-profile delivery and acknowledgement/rejection belief.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 18 IA/deep dive | registration contracts, registration/recovery algorithm and edge cases |
| Shards 01, 09 and 10 | acting mandate, recording/work identifiers and rights/split truth |
| Shard 00 BE | jobs, storage, webhooks, audit, retries and provider ambiguity |

## Registration Invariants

- Affiliation identifies body, territory, role, identifier, status, effective dates and provenance. Conflict blocks only the affected society/territory payload.
- Registration payload is an immutable read-only projection of Shard 09/10 title, party, identifier, rights, split and allocation facts as of target usage and knowledge time.
- User corrects source records, never edits generated payload. Successor payload pins changed source versions and complete diff.
- Readiness means structurally/arithmetic valid with no known rejection reason; it never promises society acceptance, legal effect or ownership.
- Society profile versions channel `api|file|manual`, schema, cadence, sequence, response rules and expected-by policy. Delivery never guesses profile/channel.
- Submission stores immutable payload checksum, sequence, channel operation and receipt. Ambiguous provider result remains `submitted_unknown`, never silently retried as new delivery.
- Acknowledgement updates work×society×territory belief with outcome, reason, action owner and age. Silence after expected-by creates alarm; rights conflict routes to Shard 10.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Financial-policy mutations require MFA when configured.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/society-affiliations` | body/territory/role/identifier/status/dates/provenance; rights administrator/key | `201 SocietyAffiliationResponse`; asserted/acknowledged/conflict | `403`, `409 AFFILIATION_CONFLICT`, `422`, `429` |
| `POST /api/v1/works/{id}/registration-preflights` | society/territory/target times/source versions; authorized administrator/key | `RegistrationPreflightResponse`; payload/blockers/owners/hash | `403`, `409 SOURCE_STALE`, `422 REGISTRATION_BLOCKED`, `429`, `503` |
| `POST /api/v1/registration-deliveries` | preflight/profile/channel/cadence versions; administrator/key | `202 RegistrationDeliveryResponse`; immutable payload/operation/state | `403`, `409 PREFLIGHT_STALE|SEQUENCE_CONFLICT`, `422`, `429`, `503` |
| `POST /api/v1/registration-deliveries/{id}/manual-receipts` | receipt/outcome/source/time; authorized administrator ETag/key | `RegistrationDeliveryResponse`; receipt/outcome version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/webhooks/society-registration` | provider profile/signature/operation/response | `202`; accepted/deduplicated | `401`, `409 EVENT_REUSED|PROFILE_MISMATCH`, `422`, `429` |
| `GET /api/v1/works/{id}/registration-beliefs` | authorized rights participant | `RegistrationBeliefPage`; outcomes/blockers/age/freshness | `403`, `404`, `429`, `503` |
| `POST /internal/v1/registration-deliveries/{id}/expected-by` | due/version/event; timer worker/key | `RegistrationAlarmResponse`; overdue/no-op | `403`, `409 EVENT_REUSED|OUTCOME_RECEIVED`, `429`, `503` |

## Persistence, RLS and Workers

- `society_affiliation`, `society_profile_version`, `registration_payload`, `registration_delivery`, `registration_receipt` and `registration_belief` pin source versions and immutable checksums.
- RLS limits affiliations/payloads/deliveries to rights-mandated parties; society webhook principal sees operation IDs only. Safe belief projection excludes private identifiers where viewer lacks mandate.
- Payload build and delivery workers use stable operation IDs, `2s/8s/32s` retry and reconciliation. Source change never mutates in-flight payload.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Society affiliation | `asserted → acknowledged|conflicted|expired|superseded`; conflicted `→ acknowledged|superseded` after source correction | Rights administrator assertion/provider evidence trigger. Conflict blocks only affected society/territory and never rewrites other affiliations. |
| Registration payload | `building → ready|blocked|stale`; ready `→ submitted|superseded`; submitted payload is immutable | Exact Shard 09/10 sources/profile preflight trigger. User edits source, not payload; readiness never claims acceptance/legal effect/ownership. |
| Registration delivery | `queued → submitting → submitted|submitted_unknown|failed`; unknown `→ submitted|failed` by reconciliation; submitted `→ acknowledged|rejected|overdue` | Stable operation/sequence and provider/manual receipt trigger. Unknown cannot retry as a new delivery; profile/channel guessing and source mutation block. |
| Registration belief | `unknown → submitted → acknowledged|rejected|overdue|conflicted`; any state `→ superseded` by newer receipt/source version | Delivery/receipt/expected-by timer/right conflict trigger. Silence yields overdue alarm, never fabricated receipt. |

Every unlisted transition returns the typed state/version/sequence conflict. Events omit private affiliation identifiers and payload content.

## Failure, Deepening and Ambiguity Gate

Tests cover cross-territory conflict, payload editing, stale rights, acceptance promise, profile guessing, duplicate sequence, provider unknown, malformed acknowledgement, silence alarm and rights conflict misrouting. Seven passes converge; two implementers receive identical registration behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Society registration contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/10e-identifiers-registration-evidence|Identifiers, registration and evidence — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10e-identifiers-registration-evidence|Rights identifiers, registration and evidence export — Backend Specification]]
