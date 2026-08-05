# Gear rigs, advisory compatibility and source exports — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear holdings operations]]  
**Deep Dive:** [[specs/ia/deep-dives/24-gear-holdings-operations|Gear holdings deep dive]]

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

- **Shard split:** 2 of 4; 24.03, 24.04, 24.05 and 24.06.
- **Boundary:** acting-party-owned rigs, ordered members/placeholders, immutable advisory compatibility and disclosure-safe source snapshots.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 24 IA/deep dive | rig/member continuity, compatibility and export flow |
| Shards 09, 23 and 32 | project context, gear identity and downstream advancing/carnet boundary |

## Rig and Compatibility Invariants

- Rig belongs to acting person or organization; project/tour is optional context, never owner. Referenced gear retains independent owner.
- Member references readable gear, confirmed-custody item or non-identifying placeholder and stores order, role, connections, placement and explicit known/unknown specs.
- Transfer/loss/unavailability replaces live usable reference with unresolved placeholder; historical rig snapshots remain immutable and member is never silently removed.
- Held gear requires owner disclosure grant for identifiable export; otherwise masked/non-identifying placeholder.
- Compatibility runs only on explicit request and pins rig, target, region/reference and creation time. Output contains mismatches, exclusions, checked/unchecked, coverage and freshness.
- Compatibility is advisory: no bare `compatible:true`, no silent pass and no automatic booking block.
- Export pins rig/source versions and carries visible gaps/advisory requirements. It is source data only and never carnet, rider or advancing authority.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-rigs` | acting party/context/name/members; controller/key | `201 GearRigResponse`; ordered version | `403`, `409`, `422 CONTEXT_INACCESSIBLE`, `429` |
| `POST /api/v1/gear-rigs/{id}/versions` | ordered member changes/connections/specs; controller ETag/key | `201 GearRigResponse`; successor/diff | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /internal/v1/gear-rigs/member-invalidation` | gear transfer/loss/unavailability/source event; worker/key | `RigInvalidationResponse`; unresolved placeholders | `403`, `409 EVENT_REUSED`, `429` |
| `POST /api/v1/gear-rigs/{id}/compatibility-runs` | rig/target/region/reference versions; controller/key | `202 CompatibilityRunResponse`; immutable run | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `GET /api/v1/compatibility-runs/{id}` | controller/delegated viewer | `CompatibilityRunResponse`; findings/coverage/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/gear-rigs/{id}/exports` | purpose/disclosure grant/source versions; controller/key | `202 RigExportResponse`; snapshot/gaps/job | `403`, `409 SOURCE_STALE`, `422 DISCLOSURE_GRANT_REQUIRED`, `429` |

## Persistence, RLS and Workers

- `rig`, immutable `rig_version`, `rig_member`, `compatibility_run` and `rig_export_snapshot` pin context/source/reference versions.
- RLS exposes rig to controller/delegates, held member identity only under disclosure grant and export object by purpose grant.
- Invalidation and compatibility workers are idempotent; stale member update retries after transfer and can preserve placeholder only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Rig version | immutable `active → superseded|retired`; successor preserves ordered member/history diff | Controller command triggers. Optional project/tour context never becomes owner and stale version blocks. |
| Rig member reference | `usable → unresolved_placeholder|unavailable|removed`; unresolved may `→ usable` with current readable/custody source | Transfer/loss/unavailability/source recovery triggers. Historical snapshots never mutate and member is never silently removed. |
| Compatibility run | `queued → checking → completed|partial|failed|stale`; completed/partial `→ stale` on source/reference change | Explicit request with exact rig/target/region/reference triggers. Output must include checked/unchecked/coverage/freshness; no bare compatible or booking block. |
| Rig export | `queued → building → ready|blocked|failed`; ready `→ stale|expired|superseded` | Exact source versions/purpose/disclosure grants trigger. Held identifiable gear without grant masks/blocks; artifact never claims carnet/rider/advancing authority. |

Every unlisted transition returns the typed state/version/disclosure conflict. Held identity remains grant-scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover context-as-owner, hidden owner leak, silent member removal, historical mutation, held-item export, bare compatible boolean, stale silent pass, booking block and carnet claim. Seven passes converge; two implementers receive identical rig behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Rig/compatibility/export contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear holdings operations]]
- [[specs/ia/deep-dives/24-gear-holdings-operations|Deep Dive 24 — Gear holdings]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/deep-dives/24-gear-holdings-operations|Deep Dive 24 — Gear collections, rigs, custody and manifests]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]
