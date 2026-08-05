# Show-date gear manifests, load-out and day sheets — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]  
**Deep Dive:** [[specs/ia/deep-dives/33-show-day-operations|Show-day operations deep dive]]

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

- **Shard split:** 3 of 4; 33.11, 33.12 and 33.13.
- **Boundary:** date-specific gear source/custody projection, bulk case load-out evidence and privacy-minimized accessible day-sheet delivery.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 33 IA/deep dive | manifest source resolution, case confirmation and recipient day-sheet projection |
| Shards 23, 24 and 32 | gear provenance/custody, case manifests and frozen advance state |

## Manifest and Day-Sheet Invariants

- Date manifest pins frozen plan, rig, rental allocation and source/custody versions per person/case/item. Unresolved source remains explicit shortfall.
- Manifest never strengthens ownership, custody or sale authority and never invents exact item for quantity/placeholder source.
- Load-out confirmation is case-scoped bulk `present|missing|damaged` with attributable evidence and append-only custody event. One allegation never mutates supplier/venue reputation.
- Day sheet pins exact event/timeline/crew/access/manifest/advance versions and recipient role. It renders live link, accessible artifact and offline bundle with explicit gaps.
- Old link remains resolvable and announces supersession. Crew receives only own call/pass/needed contacts; exact sensitive fields require live person grant.
- Offline bundle has expiry/revocation posture and never becomes a reusable unrestricted credential or private roster archive.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/show-events/{id}/gear-manifests` | frozen plan/rig/rental/source+custody versions/key; gear coordinator | `201 ShowGearManifestResponse`; cases/items/shortfalls/version | `403`, `409 SOURCE_STALE`, `422 SOURCE_UNRESOLVED`, `429` |
| `POST /api/v1/show-gear-manifests/{id}/case-confirmations` | case/items/state/evidence/expected version/key; authorized person | `201 ManifestCaseConfirmationResponse`; custody/load-out event | `403`, `409 CUSTODY_CONFLICT|VERSION_CONFLICT`, `422 CASE_SCOPE_INVALID`, `428`, `429` |
| `POST /api/v1/show-events/{id}/day-sheets` | source versions/recipient role/offline posture/key; producer | `201 ShowDaySheetResponse`; version/live/artifact/offline refs/gaps | `403 PROJECTION_FORBIDDEN`, `409 SOURCE_VERSION_MISSING`, `422`, `429` |
| `POST /api/v1/show-day-sheets/{id}/supersessions` | successor source versions/reason/key; producer | `ShowDaySheetResponse`; successor/old-link notice | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- Show manifest/case/item/source/custody refs, load-out confirmations/evidence and day-sheet projection/artifact/offline-grant/supersession rows pin actor and source versions.
- RLS exposes manifest to assigned gear/production roles, own day-sheet projection to recipient and sensitive data only through live purpose grants. Public access is absent.
- Manifest, custody handoff, rendering, offline expiry and supersession workers are idempotent; projections never strengthen source truth.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Show gear manifest | `draft → active|blocked`; active `→ stale|superseded|closed` | Frozen plan/rig/rental/source-custody versions trigger. Unresolved source remains explicit shortfall; quantity/placeholder never becomes exact identity/title. |
| Case load-out confirmation | `pending → present|missing|damaged|conflicted`; any outcome `→ superseded` by attributed correction | Authorized case-scoped bulk evidence trigger. Out-of-case/custody conflict blocks and one allegation never mutates reputation. |
| Day sheet | `queued → rendered|failed`; rendered `→ superseded|stale`; old link remains resolvable with notice | Exact event/timeline/crew/access/manifest/advance/recipient-role versions trigger. Recipient gets minimum own projection; sensitive fields require live grant. |
| Offline day-sheet grant | `issued → active → expired|revoked|superseded` | Recipient/device/purpose/expiry trigger. It never becomes reusable unrestricted credential or roster archive. |

Every unlisted transition returns the typed state/version/custody conflict. Public access is absent and projections never strengthen source truth.

## Failure, Deepening and Ambiguity Gate

Tests cover invented gear source, quantity-as-identity, manifest-as-title, out-of-case confirmation, reputation mutation, full-roster day sheet, expired offline credential, sensitive grant bypass and old-link silence. Seven passes converge; two implementers receive identical manifest, load-out and day-sheet behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Manifest, load-out and day-sheet contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day operations]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/32d-advance-checklist-freeze|Production advance checklist, sheets and freeze control — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day execution and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/32d-advance-checklist-freeze|Production advance checklist, sheets and freeze control — Backend Specification]]
