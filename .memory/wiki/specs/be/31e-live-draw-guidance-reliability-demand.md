# Verified live draw, guidance, reliability and fan demand — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]  
**Deep Dive:** [[specs/ia/deep-dives/31-live-settlement-intelligence|Live settlement intelligence deep dive]]

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

- **Shard split:** 5 of 5; 31.18, 31.19, 31.20, 31.21, 31.22 and 31.23.
- **Boundary:** verified paid-admissions records, artist-owned guidance/sharing, contextual reliability facts and private thresholded fan-demand signals.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 31 IA/deep dive | verified draw, sparse-data guidance, purpose grants, reliability facts and demand sharing |
| Shards 05, 06 and 30 | B2 capabilities, abuse review and performing-entity/slot identity |

## Intelligence and Demand Invariants

- Verified draw requires bilaterally signed settlement, performing entity, explicit bill slot and provenance-backed paid-admissions count. Unsigned, unresolved protest or inferred slot blocks.
- Draw is append-only artist-owned history. Artist-authorized actors see raw own records; no public score, cross-artist corpus or agency-wide leakage exists.
- Guidance runs only on B2-approved projection and returns range, basis, period, confidence and exclusions. Sparse/fast-changing corpus returns `insufficient`, never point estimate.
- Negotiation sharing uses artist-issued purpose/time/scope grant for selected records or derived range. Revocation stops future reads; accepted snapshot remains auditable.
- Reliability shows specific contextual late-pay, cancellation, variance and resolution facts to relevant active/past counterparties. No history says `no history`; no public/global score.
- Fan demand is one-way private verified-fan signal using coarse location/time and dedupe/abuse controls. Artist sees threshold eligibility, never rows.
- Promoter sharing requires artist opt-in plus B2 gate and threshold. Below threshold or refused consent renders nothing; analyst cannot write artist records.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/live-draw-records` | signed settlement/entity/slot/paid admissions/source version/key; draw worker | `201 LiveDrawResponse`; verified record/version | `403`, `409 RECORD_EXISTS`, `422 NOT_FINAL|SLOT_REQUIRED|COUNT_PROVENANCE_INSUFFICIENT`, `429` |
| `GET /api/v1/artists/{id}/live-draw` | own authority/as-of/cursor; artist-side actor | `LiveDrawHistoryResponse`; raw own records/freshness | `403`, `429` |
| `POST /api/v1/artists/{id}/live-guidance` | candidate market/date/slot/model-input versions/key; artist-side actor; B2 admitted | `LiveGuidanceResponse`; range/basis/confidence or insufficient | `403 B2_DISABLED`, `409 MODEL_INPUT_STALE`, `422 CORPUS_INSUFFICIENT`, `429` |
| `POST /api/v1/artists/{id}/draw-access-grants` | recipient/scope/purpose/expiry/key; artist authority | `201 DrawAccessGrantResponse`; active grant/snapshot policy | `403 AUTHORITY_REQUIRED`, `422 PURPOSE_INVALID|SCOPE_TOO_BROAD`, `429` |
| `GET /api/v1/booking-counterparties/{id}/reliability-facts` | active/past context; relevant booking actor | `ReliabilityFactResponse`; specific facts/resolutions/no-history | `403`, `429` |
| `POST /api/v1/live-demand-signals` | artist/coarse location-time/anti-abuse proof/key; verified fan | `201 LiveDemandSignalResponse`; accepted/deduped private signal | `403 FAN_UNVERIFIED`, `409 SIGNAL_DUPLICATE`, `429 RATE_LIMITED` |
| `POST /api/v1/artists/{id}/demand-sharing` | promoter/purpose/scope/expiry/artist consent/key; artist authority; B2 admitted | `201 DemandSharingResponse`; thresholded active/empty state | `403 B2_DISABLED`, `409 CONSENT_REQUIRED`, `422 THRESHOLD_NOT_MET`, `429` |

## Persistence, RLS and Workers

- Draw record, guidance run, draw access grant/snapshot, contextual reliability fact and fan signal/aggregate/sharing state pin settlement, source, consent and policy versions.
- RLS exposes raw draw/guidance to artist authority, selected snapshots to grantee, reliability only in relevant context and fan rows to abuse services pseudonymously; promoters receive threshold aggregates only.
- Draw, guidance, grant expiry, reliability and demand aggregation workers are idempotent. B2 projection is read-only and cannot mutate canonical artist records.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Verified draw record | immutable `verified`; source correction appends `superseded` record | Bilaterally signed settlement/performing entity/explicit bill slot/provenance-backed paid count trigger. Protest/unresolved/inferred slot blocks. |
| Guidance run | `queued → range|insufficient|failed|stale` | B2-approved projection/current market/date/slot/model inputs trigger. Sparse/fast-changing corpus yields insufficient, never point estimate. |
| Draw access grant | `active → revoked|expired|superseded`; accepted snapshot remains immutable/auditable | Artist-issued recipient/purpose/scope/time grant trigger. Revocation stops future reads only. |
| Reliability fact | immutable contextual `recorded|resolved|superseded`; empty projection is `no_history` | Relevant booking/settlement/cancellation evidence trigger. No public/global score or cross-context leakage. |
| Fan demand signal/sharing | signal `accepted|deduped|rejected`; aggregate `below_threshold|eligible`; sharing `pending → active|empty|revoked|expired` | Verified-fan coarse signal/abuse controls and artist opt-in+B2+threshold trigger. Promoter receives aggregate only; analyst cannot write artist records. |

Every unlisted transition returns the typed state/version/B2 conflict. Raw draw/fan rows remain artist/private-abuse scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover unsigned draw, inferred slot, public raw draw, sparse point estimate, revoked grant read, accepted-snapshot erasure, global reliability score, no-history negativity, fan-row sharing, below-threshold leakage and analyst writeback. Seven passes converge; two implementers receive identical live intelligence and demand behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Live intelligence and demand contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Live settlement intelligence]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/30e-booking-rfq-bill-construction|Booking RFQ triage and performance bill construction — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Agency, settlement and live-market intelligence]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/30e-booking-rfq-bill-construction|Booking RFQ triage and performance bill construction — Backend Specification]]
