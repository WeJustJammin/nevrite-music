# Gear valuation, appraisal, insurance packs and discography — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear provenance registry]]  
**Deep Dive:** [[specs/ia/deep-dives/23-gear-provenance-registry|Gear provenance deep dive]]

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

- **Shard split:** 4 of 4; GPR-13, GPR-14, GPR-15 and GPR-16.
- **Boundary:** evidence-labelled market estimates, immutable private appraisals, owner-built insurance evidence packs and credit-inheriting producer gear-use links.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 23 IA/deep dive | valuation/appraisal/insurance/discography algorithm |
| Shards 02 and 07 | credit status/visibility and producer-attested evidence |

## Valuation, Insurance and Discography Invariants

- Estimate matches exact normalized configuration, condition, market/location and time and requires governed comparable floor. It returns range with sample/recency or no estimate.
- Sparse/mismatched comps never fabricate midpoint. Estimate is evidence-labelled and distinct from appraisal.
- Appraisal verifies appraiser identity/mandate and pins exact gear/config snapshot, value/currency, effective/expiry and private document. Expired record remains with warning.
- Insurance pack selects item snapshots, evidence, appraisals, purchase/service/photos and explicit gaps and produces signed manifest/document/checksums.
- Platform does not submit insurer claim, promise coverage, value acceptance, indemnity or payout.
- Gear-use link requires eligible credit/session and producer attestation of identity/role/use. It inherits exact credit status/visibility and never widens it.
- Hidden/disputed credit suppresses gear link and hidden-link count. Gear use does not strengthen ownership claim or professional credit.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-records/{id}/valuation-estimates` | config/condition/market/location/time/policy; owner/key | `ValuationEstimateResponse`; range/sample/recency or none | `403`, `409 SOURCE_STALE`, `422 COMPS_INSUFFICIENT`, `429`, `503` |
| `POST /api/v1/gear-records/{id}/appraisals` | appraiser mandate/snapshot/value/currency/effective/expiry/document; appraiser/key | `201 AppraisalResponse`; immutable private record | `403`, `409 SOURCE_STALE`, `422 APPRAISER_UNVERIFIED`, `429` |
| `POST /api/v1/insurance-packs` | items/evidence/appraisals/purchases/service/photos/gaps; owner/key | `202 InsurancePackResponse`; manifest/document job | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/insurance-packs/{id}` | owner/purpose grant | `InsurancePackResponse`; expiring download/checksums/gaps | `403`, `404`, `429`, `503` |
| `POST /api/v1/gear-credit-links` | eligible credit/session/gear/role/use; producer/key | `201 GearCreditLinkResponse`; derived visibility/state | `403`, `409 CREDIT_SOURCE_STALE`, `422`, `429` |
| `POST /internal/v1/gear-credit-links/{id}/refresh` | credit status/visibility/version/event; worker/key | `GearCreditLinkResponse`; visible/suppressed | `403`, `409 EVENT_REUSED`, `429` |

## Persistence, RLS and Workers

- `valuation_estimate`, `appraisal_record`, `insurance_pack` and `gear_credit_link` pin evidence/source/policy versions.
- RLS keeps appraisal/pack owner-private, estimates owner-scoped and gear links exactly aligned to Shard 07 credit projection.
- Pack/render workers are idempotent and never transmit insurer-side. Credit refresh fails closed to suppression on stale/hidden/disputed source.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Valuation estimate | `evaluating → range|no_estimate|failed`; range/no-estimate `→ stale|superseded` | Exact config/condition/market/location/time and governed comp floor trigger. Sparse/mismatched comps yield no estimate, never fabricated midpoint/appraisal. |
| Appraisal | `active → expired|superseded|revoked`; expired remains visible with warning | Verified appraiser mandate/snapshot/value/document and timer trigger. New appraisal never erases expired record. |
| Insurance pack | `queued → building → ready|failed`; ready `→ expired|superseded`; partial output `→ quarantined` | Owner-selected snapshots/evidence/gaps and checksum render trigger. Platform never submits insurer-side or promises coverage/value/payout. |
| Gear-credit link | `pending → visible|suppressed`; visible `→ suppressed`; suppressed `→ visible` only from current eligible source | Eligible credit/session plus producer attestation and Shard 07 refresh trigger. Hidden/disputed/stale source fails closed; link never strengthens ownership/credit. |

Every unlisted transition returns the typed state/version/evidence conflict. Hidden links and counts remain suppressed with source credit.

## Failure, Deepening and Ambiguity Gate

Tests cover sparse-comp estimate, midpoint fabrication, estimate-as-appraisal, expired appraisal replacement, insurer submission/coverage promise, non-producer link, hidden-credit leak and gear-use ownership inference. Seven passes converge; two implementers receive identical valuation/discography behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Valuation/insurance/discography authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear provenance registry]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear provenance]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear identity, provenance and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
