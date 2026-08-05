# External ticketing connections, count attestations and reconciliation — Backend Specification

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

- **Shard split:** 4 of 5; 36.14, 36.15, 36.16 and 36.17.
- **Boundary:** admitted external connectors, human-confirmed event/schema mappings, immutable manual attestations and human reconciliation decisions.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 36 IA/deep dive | connector capability, mapping, source currency/freshness, competing attestations and decider record |
| Shards 05, 06 and 31 | capability gates, disputes and settlement count provenance |

## External Count Invariants

- External connector requires venue credentials and accepted capability profile; tokens/raw payloads remain server-only. Broken connector exposes explicit gap/freshness.
- Foreign event and schema mappings require operator confirmation. No silent auto-bind or currency/unit conversion.
- Ingested value pins source currency/unit, source event/schema version, provider time, received time, freshness and provisional state.
- Manual count is immutable `value|unknown|reconstructed` attestation with source, actor, time and evidence. Concurrent entries coexist as competing.
- Reconciliation requires two independent sources or explicit single-source state and records chosen number, human decider, reason, arithmetic and counter-acceptance.
- Platform never selects canonical count or silently averages; dispute routes case workflow.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/box-office/connections` | venue/provider credentials/capability profile/key; operator | `201 BoxOfficeConnectionResponse`; verified/gap/freshness state | `403`, `409 CONNECTION_EXISTS`, `422 CAPABILITY_MISSING`, `429` |
| `POST /api/v1/box-office/connections/{id}/event-mappings` | foreign event/local show/schema map/operator confirmation/key; operator | `201 ExternalEventMappingResponse`; confirmed mapping/version | `403`, `409 MATCH_CONFLICT`, `422 MATCH_UNCONFIRMED`, `429` |
| `POST /internal/v1/box-office/external-counts` | connection/mapping/source values/currency/unit/times/key; connector worker | `201 ExternalCountResponse`; provisional sourced count | `403`, `409 EVENT_REUSED`, `422 SCHEMA_UNMAPPED`, `429` |
| `POST /api/v1/box-office/events/{id}/count-attestations` | source/value-or-unknown/evidence/actor time/key; authorized counter | `201 CountAttestationResponse`; immutable attestation | `403 SOURCE_FORBIDDEN`, `409 ATTESTATION_EXISTS`, `422 CAPACITY_EXCEEDED|NEGATIVE_COUNT`, `429` |
| `POST /api/v1/box-office/events/{id}/count-reconciliations` | source versions/chosen number/decider/reason/counter-acceptance/key; authorized human | `201 CountReconciliationResponse`; chosen/single-source/disputed state | `403`, `409 SOURCE_STALE`, `422 INDEPENDENCE_REQUIRED|REASON_REQUIRED`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Box-office connection | `pending_verification -> verified|gap`; `verified -> degraded|broken|revoked`; `degraded|broken -> verified|revoked` | Credential/capability verification establishes service; freshness or adapter failure exposes degraded/broken state, and successful re-verification restores it. Revoked is terminal and tokens/raw payloads remain adapter-only. |
| External event mapping | `unconfirmed -> confirmed|rejected`; `confirmed -> superseded`; `rejected -> unconfirmed` | Explicit operator confirmation binds exact foreign event/schema semantics; correction creates a successor. Unconfirmed/conflicting mappings block ingest and no automatic bind/conversion occurs. |
| External count | `provisional -> stale|superseded`; `stale -> superseded` | Accepted connector ingest creates an immutable provisional sourced value; freshness expiry marks it stale and a later provider value supersedes it. No transition alone makes it canonical. |
| Manual attestation | `submitted` is terminal | Authorized submission appends immutable `value|unknown|reconstructed` evidence. Concurrent attestations coexist; duplicate source identity returns `409 ATTESTATION_EXISTS` and no overwrite transition exists. |
| Count reconciliation | `pending -> chosen|single_source|disputed`; `chosen|single_source -> accepted|disputed`; `disputed -> case_open|accepted` | Authorized human reasoning over pinned independent sources selects or disputes a result; counterparty acceptance closes agreement, while disagreement routes a case. Platform workers cannot choose, average or auto-accept. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; mutation of an ingested count, attestation or human decision returns `409 IMMUTABLE_COUNT_EVIDENCE`.

## Persistence, RLS and Workers

- Connection/capability/credential refs, event/schema mapping, external source count, manual attestation and reconciliation/acceptance rows pin provider and actor versions.
- RLS exposes connection diagnostics/mappings to operator, sourced aggregate to settlement parties and credentials/raw payload only to adapter service.
- Connector, freshness and reconciliation-notification workers are idempotent; no worker chooses number or converts unapproved source semantics.

## Failure, Deepening and Ambiguity Gate

Tests cover token leak, silent event binding, silent currency conversion, broken connector hidden, manual overwrite, competing attestation collapse, automatic averaging and platform-selected reconciliation. Seven passes converge; two implementers receive identical external count and reconciliation behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | External count and reconciliation contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Box-office risk]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]
