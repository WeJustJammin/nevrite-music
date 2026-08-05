# Gear identity, ownership claims, transfers and provenance — Backend Specification

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

- **Shard split:** 1 of 4; GPR-01, GPR-02, GPR-03, GPR-04, GPR-05 and GPR-06.
- **Boundary:** composite identity, superseding identifier facts, evidence-weighted ownership claims, screened transfer, bounded provenance and non-automatic duplicate resolution.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 23 IA/deep dive | identity/claim and transfer algorithms |
| Shards 01, 06 and 14 | party identity, disputes and marketplace transaction evidence |

## Identity, Claim and Transfer Invariants

- Mint intent is `owned|held|observed` and never implies legal title. Gear identity, possession, claim, custody and title remain separate.
- Composite key uses manufacturer/model/serial plus required secondary/location facts. No-object mint is valid; unresolved key is not. WJ-ID is weaker and disclosed.
- Identifier correction distinguishes typo from physical serial/component change. Free edit only before external reliance; otherwise successor preserves history and notifies affected parties.
- Ownership claim carries purpose-limited evidence/relationship/period/provenance. Computed tier may decrease and state is `confirmed|provisional|contested`; platform never adjudicates title.
- Transfer requires marketplace completion or manual two-party handshake, expected current claim/custody, full theft screen and custody/consideration evidence. Reversal is compensating event.
- Provenance derives immutable identity/claim/transfer/service/theft events with evidence labels and “does not prove title” disclosure. Missing history proves nothing.
- Duplicate composite key never auto-merges. Claimants are notified; mutual consent/reviewer policy may link/merge under audit while chains survive indefinitely.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-records` | intent/entity/composite identifiers/evidence; authenticated actor/key | `201 GearRecordResponse`; new/contested-key route | `403`, `409 COMPOSITE_KEY_CONTESTED`, `422 IDENTITY_KEY_INCOMPLETE`, `429` |
| `POST /api/v1/gear-records/{id}/identifier-facts` | typo/change classification/new identifier/evidence; authorized holder/key | `201 GearIdentityResponse`; successor/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-records/{id}/ownership-claims` | relationship/period/evidence refs; claimant/key | `201 GearClaimResponse`; tier/state/version | `403`, `409`, `422`, `429` |
| `POST /api/v1/gear-transfers/preflight` | gear/key/current claim/custody/from/to/source refs; parties/key | `GearTransferPreflight`; screen/gaps/hash | `403`, `409 SOURCE_STALE`, `422 SCREEN_REQUIRED`, `429`, `503` |
| `POST /api/v1/gear-transfers` | preflight/both-party confirmations/evidence; parties/key | `201 GearTransferResponse`; chain event/version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/gear-transfers/{id}/reversals` | reversal basis/party confirmations; parties/key | `201 GearTransferResponse`; compensating event | `403`, `409`, `422`, `429` |
| `GET /api/v1/gear-records/{id}/provenance` | viewer scope/cursor | `GearProvenanceResponse`; evidence-labelled/redacted chain | `404`, `429`, `503` |
| `POST /api/v1/gear-records/{id}/duplicate-resolutions` | peer record/consents/reviewer policy; claimants or reviewer/key | `DuplicateResolutionResponse`; linked/merged/separate | `403`, `409 CONSENT_MISSING`, `422`, `429` |

## Persistence, RLS and Workers

- `gear_record`, `gear_identity_key`, `gear_identifier_fact`, `gear_claim`, `gear_chain_event`, `gear_transfer` and merge links retain immutable history.
- RLS exposes bounded public identity/status, claim/evidence to claimant/reviewer, transfer to parties and exact possession/contact never publicly.
- Composite-key conflict worker may propose duplicates but cannot merge. Transfer commits screen evidence and chain event atomically.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Gear identity record | `minted → active|contested_key`; active/contested `→ superseded|retired`; intent remains immutable `owned|held|observed` | Complete composite key or valid no-object mint triggers. Unresolved key blocks; mint/intent never implies legal title. |
| Identifier fact | `current → superseded`; pre-reliance typo may replace current while relied-upon change always appends successor | Authorized holder classification/evidence triggers. Physical component/serial change preserves original identity chain and notifies affected parties. |
| Ownership claim | `provisional → confirmed|contested`; confirmed may `→ provisional|contested|superseded`; contested `→ superseded|resolved` by evidence/case outcome | Claim evidence/period/provenance and computed tier trigger. Tier may decrease and platform never adjudicates title. |
| Gear transfer | `preflight → pending_confirmations → completed|blocked|expired`; completed `→ reversed` only by compensating event | Full theft screen/current claim-custody/two-party or marketplace evidence triggers. Stale/failed screen or missing party confirmation blocks. |
| Duplicate resolution | `candidate → linked|merged|kept_separate|contested`; any resolution preserves both chains | Mutual claimant consent/reviewer policy triggers. Worker suggestion cannot auto-merge. |

Every unlisted transition returns the typed state/version/screen conflict. Provenance always carries evidence labels and no-title-proof disclaimer.

## Failure, Deepening and Ambiguity Gate

Tests cover mint-as-title, WJ-ID substitution, destructive serial edit, fixed high tier, title judgment, one-party transfer, unscreened transfer, missing-history proof and auto-merge. Seven passes converge; two implementers receive identical identity/transfer behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Gear identity/claim/transfer authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear provenance registry]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear provenance]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear identity, provenance and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]
