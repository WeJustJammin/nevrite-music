# Sync catalogue, briefs, pitches and bilateral holds — Backend Specification

**Status:** Complete; Phase-2 licensing  
**IA Source:** [[specs/ia/20-licensing-core|Shard 20 — Licensing core]]  
**Deep Dive:** [[specs/ia/deep-dives/20-licensing-core|Licensing core deep dive]]

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

- **Shard split:** 1 of 4; LIC-01, LIC-02, LIC-03 and LIC-04.
- **Boundary:** human-committed eligible catalogue, advisory scope-aware search, frozen briefs/pitches and exact-scope bilateral holds.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 20 IA/deep dive | catalogue/search/brief/hold interactions and clearance seam |
| Shards 09, 10 and 13 | assets, rights truth and bounded opportunity/pitch lifecycle |

## Catalogue, Brief and Hold Invariants

- Catalogue entry binds work, master, governed assets and human-confirmed tags. Machine output may propose but never creates eligibility, clearance or asset-backed flags.
- Asset-backed claims require governed asset evidence. Missing work/master/rights/asset or active conflict returns blocked reasons, not optimistic projection.
- Search takes exact scope snapshot and renders clearance verdict, evaluated-at and freshness inline. Result is advisory and never one-stop promise unless exactly one counterparty controls every required side.
- Buyer sees remedy class and counterparty count but never private blocker identity/category; co-owner may see attributed blocker within own side.
- Brief freezes hard constraints, scope grammar/version, deadline and clearance requirement. Candidate set is bounded and pitch states terminate explicitly.
- Hold requires fresh clearance/conflict/exclusivity check and reserves every required side for exact scope/window. Unknown conflict means no hold.
- Hold is bilateral/all-required-sides, auto-expires and cannot imply licence, price acceptance or payment availability.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/sync-catalogue/preflight` | work/master/assets/tags/attestation/rights versions; owner/key | `CataloguePreflightResponse`; eligibility gaps/hash | `403`, `409 SOURCE_STALE`, `422 ASSET_EVIDENCE_REQUIRED`, `429` |
| `POST /api/v1/sync-catalogue` | preflight hash/safe projection; owner/key | `201 SyncCatalogueEntryResponse`; searchable/blocked version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/sync-searches` | metadata/reference/scope grammar/countries/cursor; professional buyer/key | `SyncSearchResponse`; advisory results/verdict ages | `403`, `422 SCOPE_REQUIRED`, `429`, `503` |
| `POST /api/v1/licensing-briefs` | hard constraints/scope/deadline/clearance requirement; buyer/key | `201 LicensingBriefResponse`; frozen brief/version | `403`, `409`, `422`, `429` |
| `POST /api/v1/licensing-briefs/{id}/pitch-requests` | bounded candidate IDs/brief version; buyer/key | `202 PitchRequestResponse`; candidate terminal states | `403`, `409 BRIEF_STALE`, `422 CANDIDATE_LIMIT_EXCEEDED`, `429` |
| `POST /api/v1/licensing-holds/preflight` | catalogue/scope/window/clearance versions; buyer/key | `HoldPreflightResponse`; required sides/conflicts/hash | `403`, `409 SOURCE_STALE`, `422 HOLD_UNAVAILABLE`, `429` |
| `POST /api/v1/licensing-holds` | preflight hash/party confirmations; buyer/key | `201 LicensingHoldResponse`; active/expiry/version | `403`, `409 PREFLIGHT_STALE|EXCLUSIVITY_CONFLICT`, `422`, `429` |
| `POST /internal/v1/licensing-holds/{id}/expire` | due/version/event; timer worker/key | `LicensingHoldResponse`; expired/no-op | `403`, `409 EVENT_REUSED`, `429` |

## Persistence, RLS and Workers

- `sync_catalogue_entry`, `licensing_brief`, `pitch_request` and `licensing_hold` pin source/scope versions and immutable state history.
- RLS exposes safe catalogue to eligible buyers, briefs/pitches to participants and hold blocker details only to authorized rights-side parties.
- Search projection invalidates on rights/clearance changes; hold transaction locks all required side/exclusivity keys atomically.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Sync catalogue entry | `draft → searchable|blocked`; searchable `→ stale|blocked|withdrawn`; stale/blocked `→ searchable` after current preflight | Human-confirmed source/tag/asset/rights evidence triggers. Machine suggestion, missing governed asset or active conflict cannot create eligibility/clearance. |
| Licensing brief | `draft → active → closed|expired|cancelled`; active `→ superseded` by explicit new scope version | Buyer frozen constraints/scope/deadline command triggers. Stale scope or unbounded candidate request blocks. |
| Pitch request/candidate | `queued → sent → viewed|responded|declined|expired|failed`; every candidate terminates explicitly | Bounded candidate manifest and delivery/response/timer trigger. Brief change makes queued request stale; no infinite/open hidden state. |
| Licensing hold | `preflight → active → expired|released|cancelled|superseded` | Fresh all-required-sides clearance/conflict/exclusivity and bilateral confirmations trigger. Unknown conflict or partial side blocks; hold never means licence, price acceptance or payment. |

Every unlisted transition returns the typed state/version/scope conflict. Buyer projections conceal private blocker identity/category.

## Failure, Deepening and Ambiguity Gate

Tests cover machine-created eligibility, fake asset flag, stale verdict, false one-stop, blocker leak, unbounded pitch, partial-side hold, unknown-conflict hold and hold-as-licence. Seven passes converge; two implementers receive identical catalogue and hold behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Catalogue, briefs and holds authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core]]
- [[specs/be/09c-audio-version-review-approval|Audio versions, review and approval — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core and instrument lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versioning, review and approval — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
