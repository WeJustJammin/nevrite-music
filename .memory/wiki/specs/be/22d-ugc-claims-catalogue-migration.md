# UGC fingerprint/claims and catalogue migration — Backend Specification

**Status:** Complete; fingerprint/claim provider disabled  
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

- **Shard split:** 4 of 4; DST-18, DST-19 and DST-20.
- **Boundary:** stricter fingerprint registration, human-directed UGC claim actions and portable export/import with explicit witnessed-data limits.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 22 IA/deep dive | fingerprint/claim, identifier and export continuity algorithms |
| Shards 06, 10 and 21 | claim disputes, ownership/sample gates and provider whitelist boundary |

## UGC and Migration Invariants

- Fingerprint registration is stricter than distribution: requires fresh ownership, sample/encumbrance, conflict and rights completeness plus reviewed derived whitelist.
- Provider registration/claim adapters remain disabled until Phase-2 admission. No route/database/worker bypass or optimistic registered state.
- UGC claim shows people, videos, instrument/evidence and held facts. User chooses release, whitelist or dispute action; platform never auto-responds.
- Unresolved ownership/sample conflict blocks new registration but does not fabricate claim outcome. Existing claim history remains visible.
- Export is always available and includes canonical records, partner/message/status history, identifiers, assets/evidence manifests and checksums without secret URLs.
- Import marks origin, asserted versus witnessed facts and known loss. It never fabricates attestations, provider acknowledgement, live status or ownership.
- Same ISRC with conflicting holder blocks and routes Shard 06/10; no automatic merge or blind second allocation.
- Exit/lock-in never depends on withholding user data. Imported catalogue remains usable with honest confidence/provenance boundaries.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/ugc-registrations/preflight` | recording/ownership/sample/rights/conflict/whitelist versions; owner/key | `UgcRegistrationPreflight`; stricter gaps/hash | `403`, `409 SOURCE_STALE`, `422 UGC_CLEARANCE_INCOMPLETE`, `429` |
| `POST /api/v1/ugc-registrations` | preflight/provider profile; owner/key | no provider success while disabled | `403 UGC_PROVIDER_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/ugc-claims/{id}/decisions` | release/whitelist/dispute and evidence/version; affected owner/key | no provider action while disabled; dispute may route locally | `403 UGC_PROVIDER_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/catalogue-exports` | scope/assets/evidence/history/options; owner/key | `202 CatalogueExportResponse`; job/manifest state | `403`, `409`, `422`, `429` |
| `GET /api/v1/catalogue-exports/{id}` | owner | `CatalogueExportResponse`; expiring download/checksum/coverage | `403`, `404`, `429`, `503` |
| `POST /api/v1/catalogue-imports/preflight` | manifest/checksums/origin/witnessed-loss; owner/key | `CatalogueImportPreflight`; conflicts/gaps/hash | `403`, `409 IDENTIFIER_HOLDER_CONFLICT`, `422`, `429` |
| `POST /api/v1/catalogue-imports` | preflight/object refs; owner/key | `202 CatalogueImportResponse`; asserted/witnessed records/job | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |

## Persistence, RLS and Workers

- `ugc_registration`, `ugc_claim`, `catalogue_export`, `catalogue_import` and manifests pin evidence/provider/source versions and immutable checksums.
- RLS exposes claims/evidence to affected parties/reviewers, exports/imports to owner purpose scope and provider secrets to adapters only.
- Provider gate enforced at router/database/worker. Export jobs always available; import transaction does not upgrade asserted facts to witnessed authority.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| UGC provider capability | launch terminal `disabled`; future admission may `→ enabled|killed` only after Phase-2 review | No route/database/worker bypass. Disabled state prevents optimistic registration/claim provider effects. |
| UGC registration | `preflight → clearance_ready|blocked|stale`; future enabled provider path `→ submitting → registered|failed|unknown` | Stricter ownership/sample/conflict/rights/whitelist evidence triggers. Unresolved conflict blocks new registration without altering prior claim history. |
| UGC claim | future `open → release_requested|whitelist_requested|disputed`; provider actions `→ released|whitelisted|failed|unknown`, dispute routes locally | Explicit affected-owner decision triggers. Platform never auto-responds or fabricates provider outcome. |
| Catalogue export | `queued → building → ready|failed`; ready `→ expired|superseded`; partial output `→ quarantined` | Owner scope/manifest/checksum worker triggers. Export remains available and never withholds canonical/history/identifier/evidence coverage for lock-in. |
| Catalogue import | `preflight → ready|blocked`; ready `→ importing → completed|failed|partial`; completed facts remain `asserted|witnessed` per source | Manifest/checksum/origin/loss validation triggers. ISRC-holder conflict blocks and routes Shard 06/10; import never fabricates attestation, acknowledgement, live status or ownership. |

Every unlisted transition returns the typed state/version/provider-gate conflict. Provider secrets remain adapter-only and imported confidence/provenance stays explicit.

## Failure, Deepening and Ambiguity Gate

Tests cover delivery-grade-equals-fingerprint, provider bypass, claim auto-response, conflict ignored, export omission/lock-in, fabricated import attestation/live status, ISRC holder auto-merge and blind reallocation. Seven passes converge; two implementers receive identical UGC/migration behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | UGC and migration contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release distribution]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/21b-creator-microlicensing-content-id|Creator micro-licensing, whitelisting and Content ID recovery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release and distribution lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/21b-creator-microlicensing-content-id|Creator micro-licensing, whitelisting and Content ID recovery — Backend Specification]]
