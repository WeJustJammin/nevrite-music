# Digital entitlements, holder library and secure delivery — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]  
**Deep Dive:** [[specs/ia/deep-dives/27-digital-catalog-delivery|Digital catalog delivery deep dive]]

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

- **Shard split:** 3 of 5; 27.10, 27.11, 27.12 and 27.13.
- **Boundary:** append-only entitlement acquisition, controlled holder libraries, artifact-bound transfer grants and resumable verified delivery.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 27 IA/deep dive | entitlement identity, acquisition epochs, library projection and transfer grant contracts |
| Shards 01, 04 and 05 | acting-party authority, governed storage and delivery settings |

## Entitlement and Delivery Invariants

- Entitlement is one product/holder record with append-only acquisition epochs containing purchaser, holder, origin, proof, terms and permitted version range. Licence key, activation seat and transfer grant are artifacts of entitlement, never entitlement itself.
- Pending or ambiguous payment grants no entitlement, download, activation or seat. Issuance requires confirmed synchronous Shard 28 order proof or an authorized grant and serializes retries onto the same record.
- Holder may be a controlled person or organization; clicking account remains actor. Vendor cannot enumerate holders, access buyer libraries/derivatives or receive watermark mappings.
- Library shows holder per row and supports current/as-of projection. Empty requires authoritative zero; stale safe cache may render only with explicit age.
- Download requires current entitlement and allowed artifact version. Grant is holder/account/artifact/purpose-bound, short-lived, concurrency-limited and reauthorized on every range request; static public URLs never exist.
- Grant response includes compressed and unpacked sizes, hashes, expiry and range support. Resume verifies grant, slot, range and entitlement state before each segment; completion records bytes/ranges/hash.
- Withdrawal/revocation returns exact scope/reason and lawful alternatives. Capacity queues without consuming entitlement; expiry provides refresh without inventing completion.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/digital-entitlements` | product/purchaser/holder/origin/terms/version range/order-or-grant proof/key; entitlement issuer | `201 DigitalEntitlementResponse`; entitlement/acquisition epoch/state | `403`, `409 PROOF_PENDING|EPOCH_EXISTS|HOLDER_CONFLICT`, `422`, `429` |
| `GET /api/v1/digital-library` | controlled holder/search/facets/as-of/cursor; authenticated controlling actor | `DigitalLibraryResponse`; holder-labelled entitlements/authoritative/stale age | `403`, `429`, `503` |
| `GET /api/v1/digital-entitlements/{id}` | entitlement/as-of; holder controller | `DigitalEntitlementResponse`; epochs/terms/range/state | `403`, `404`, `429` |
| `POST /api/v1/digital-entitlements/{id}/transfer-grants` | artifact version/purpose/client capability/key; holder controller | `201 DigitalTransferGrantResponse`; bound grant/sizes/hashes/expiry/range support | `403`, `409 VERSION_NOT_ENTITLED|ENTITLEMENT_INACTIVE`, `422`, `429`, `503 CAPACITY_QUEUED` |
| `GET /api/v1/digital-transfer-grants/{id}/content` | signed grant/range; bound account/client | `206` artifact bytes with digest/range metadata | `401`, `403 GRANT_EXPIRED|ENTITLEMENT_INACTIVE`, `409 RANGE_INVALID|CONCURRENCY_LIMIT`, `416`, `429` |
| `POST /api/v1/digital-transfer-grants/{id}/refreshes` | prior grant/resume ranges/client proof/key; holder controller | `DigitalTransferGrantResponse`; successor grant/remaining ranges | `403`, `409 ARTIFACT_WITHDRAWN|ENTITLEMENT_INACTIVE`, `422`, `429` |
| `POST /internal/v1/digital-transfer-grants/{id}/completions` | bytes/ranges/hash/client receipt/event key; delivery worker | `DigitalTransferCompletionResponse`; verified/failed evidence | `403`, `409 EVENT_REUSED|HASH_MISMATCH`, `422`, `429` |

## Persistence, RLS and Workers

- `digital_entitlement`, acquisition epoch, holder projection, transfer grant/slot/range audit and completion evidence pin proof, terms, artifact, account, policy and entitlement versions.
- RLS exposes entitlements/library only to holder controllers and purpose-scoped support; vendors receive aggregate product metrics without holder identity. Artifact storage is private and accessible only through server-authorized grants.
- Library projection, grant expiry/slot and completion verification workers are idempotent. State change invalidates new range authorization immediately; issued URLs contain no reusable public authority.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Entitlement | `pending_proof → active|rejected`; active `→ restricted|revoked|expired`; authorized acquisition appends an immutable epoch to same product/holder record | Confirmed Shard 28 order or authorized grant proof triggers. Pending/ambiguous payment grants nothing and retries cannot duplicate entitlement. |
| Library projection | `authoritative → stale|rebuilding`; rebuilding `→ authoritative|failed`; safe stale may render with age | Entitlement/source change triggers. Empty requires authoritative zero and vendor cannot enumerate holders. |
| Transfer grant | `issued → active → completed|expired|revoked|failed`; capacity request may remain `queued` without consuming entitlement | Current entitlement/artifact/version/account/client/purpose authorization triggers. Every range reauthorizes and static public URLs never exist. |
| Transfer slot/range | `reserved → streaming → verified|failed|expired`; each segment advances only with valid grant/entitlement/concurrency | Bound range request/hash receipt triggers. Revoked entitlement stops new segments; hash mismatch/partial bytes cannot complete. |
| Transfer completion | `pending → verified|failed` | Exact bytes/ranges/hash/client receipt triggers. Expiry refresh creates successor grant and never invents completion. |

Every unlisted transition returns the typed state/version/entitlement conflict. Vendors receive no holder identity, library derivatives or watermark mappings.

## Failure, Deepening and Ambiguity Gate

Tests cover pending-payment issuance, duplicate entitlement records, key-as-entitlement, vendor holder enumeration, false empty library, static URL, cross-account grant, revoked resume, concurrency overrun, hash mismatch and completion on partial bytes. Seven passes converge; two implementers receive identical entitlement, library and delivery behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Entitlement, library and delivery contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog delivery]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
