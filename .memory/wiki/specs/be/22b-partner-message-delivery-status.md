# Partner messages, delivery choreography and store status — Backend Specification

**Status:** Complete; live partner dispatch disabled  
**IA Source:** [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/22-release-distribution|Release distribution deep dive]]

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

- **Shard split:** 2 of 4; DST-08, DST-09, DST-10, DST-11 and DST-12.
- **Boundary:** deterministic partner projections, retained message threads, admitted dispatch, acknowledgement/store reconciliation, scoped remediation and verified artist links.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 22 IA/deep dive | partner knowledge/delivery and store reconciliation algorithms |
| Shards 00 and 01 | provider admission/choreography and verified store artist identity |

## Delivery and Store Invariants

- Partner profile key is partner×destination/release type×message version×deal shape and optional territory. Structural edits require second review and conformance certification.
- No partner is offered/dispatchable before Phase-2 commercial, security, cost and conformance admission. Profiles/messages may be authored/tested offline.
- Generator pins canonical snapshot, validation/profile version, identifier set and thread; it validates its output only and never defaults/re-authors missing facts.
- Message and plain receipt are immutable; successor diff remains in same partner thread. Any source/right/profile drift before dispatch halts with exact diff.
- Dispatch choreography is idempotent per release/partner/thread step. `sent|received|accepted|rejected|overdue|unknown` are distinct; overdue triggers human chase, never blind resend.
- Partner acknowledgements ordered by partner timestamp advance choreography only. `live|preorder` requires independent store-side evidence, store-local clock and exact territory/items.
- Accepted but not live is `accepted_live_wait`. Mixed outcome retains structured rejected items; remediation redelivers only rejecting partner/items.
- Partner-specific rendering may change approved formatting, never canonical facts. Platform/profile gap is attributed to platform, not artist.
- First delivery requires verified Tier-A store artist ID from Shard 01 and landing verification; asserted link blocks or enters merge chase.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Live dispatch routes deny while partner adapter is disabled.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/releases/{id}/partner-messages` | snapshot/validation/profile/identifier/thread versions; operator/key | `201 PartnerMessageResponse`; retained deterministic message/diff | `403`, `409 SOURCE_STALE`, `422 GENERATION_INVALID`, `429` |
| `POST /api/v1/partner-messages/{id}/dispatch` | certified profile/runtime admission/message version; operator/key | no live success while disabled | `403 PARTNER_ADAPTER_DISABLED`, `409 SOURCE_DRIFT`, `422`, `429` |
| `POST /api/v1/webhooks/distribution-partner` | signed partner/profile/thread/ack timestamp/status | `202`; accepted/deduplicated | `401`, `409 EVENT_REUSED|THREAD_MISMATCH`, `422`, `429` |
| `POST /internal/v1/partner-deliveries/{id}/overdue` | due/thread/version/event; timer worker/key | `PartnerDeliveryResponse`; overdue/chase/no-op | `403`, `409 EVENT_REUSED|ACK_RECEIVED`, `429` |
| `POST /internal/v1/releases/{id}/store-status-reconcile` | store evidence/local timestamp/territory/items/event; worker/key | `DestinationStatusResponse`; preorder/live/mismatch/wait | `403`, `409 EVENT_REUSED`, `422`, `429`, `503` |
| `GET /api/v1/releases/{id}/destination-status` | owner/collaborator safe scope | `DestinationStatusBoard`; exception-first rows/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/partner-rejections/{id}/remediation-plans` | item/action/owner/source-or-rendering change; owner/key | `201 RemediationPlanResponse`; scoped plan/version | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/partner-rejections/{id}/redeliver` | approved plan/superseding message; operator/key | no live success while disabled | `403 PARTNER_ADAPTER_DISABLED`, `409 PLAN_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/artist-links` | Shard 01 store artist ID/evidence/tier; owner/key | `ArtistLinkResponse`; linked/merge-chase/blocked | `403`, `409 SOURCE_STALE`, `422 TIER_A_REQUIRED`, `429`, `503` |

## Persistence, RLS and Workers

- `partner_profile_version`, `partner_message`, `partner_delivery_step`, `partner_ack`, `store_status_evidence`, `remediation_plan` and `release_artist_link` retain immutable history.
- RLS exposes destination board to release parties, partner secrets/bytes to adapter only and artist-link evidence to authorized identity participants.
- Provider gate enforced at router/database/worker. Ack/store evidence cannot regress state; late older acknowledgement remains history.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Partner capability/profile | launch adapter `disabled`; profile `draft → reviewed → certified|rejected`, certified `→ superseded|suspended`; dispatch unavailable until Phase-2 admission | Commercial/security/cost/conformance evidence and second review trigger. Ordinary config/admin cannot enable dispatch. |
| Partner message | `generated → validated → queued`; queued `→ stale|cancelled` before dispatch; future dispatch `→ sent` | Exact canonical snapshot/profile/identifier/thread generator triggers. Missing facts/source drift block; formatting never rewrites canonical facts. |
| Delivery step | future `queued → sent → received → accepted|rejected|unknown`; sent/received `→ overdue`; mixed acceptance retains rejected items | Stable thread-step dispatch and monotonic partner acknowledgements trigger. Disabled adapter blocks send; overdue creates human chase, never blind resend. |
| Store status | `not_verified → accepted_live_wait → preorder|live|mismatch|removed`; any result `→ stale` | Independent store evidence/local clock/exact territory-items trigger. Partner acceptance alone cannot yield live/preorder and older evidence cannot regress. |
| Remediation plan | `draft → approved → redelivery_pending → completed|failed|stale`; future redelivery only targets rejected partner/items | Owner plan/source or rendering correction triggers. Disabled adapter or stale plan blocks. |
| Artist link | `asserted → verified|merge_chase|blocked`; verified `→ superseded` | Tier-A Shard 01 identity/landing evidence triggers. Asserted link blocks first delivery or enters merge chase. |

Every unlisted transition returns the typed state/version/partner-gate conflict. Partner secrets/bytes remain adapter-only.

## Failure, Deepening and Ambiguity Gate

Tests cover uncertified profile, canonical mutation, stale dispatch, blind retry, ack-as-live, out-of-order regression, mixed-item flattening, global redelivery, artist blame and asserted artist ID. Seven passes converge; two implementers receive identical delivery behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Partner delivery/status contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release distribution]]
- [[specs/be/01b-party-identity-aliases|Party identity and aliases — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release and distribution lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01b-party-identity-aliases|Person, facets, aliases, acting context and legal disclosure — Backend Specification]]
