# Release promotion timeline, updates and takedowns — Backend Specification

**Status:** Complete  
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

- **Shard split:** 3 of 4; DST-13, DST-14, DST-15, DST-16 and DST-17.
- **Boundary:** editorial/pre-save/deadline states, explicit announced-date changes, per-store update classification, voluntary withdrawal and evidence-scoped involuntary removal.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 22 IA/deep dive | date/notification and catalogue lifecycle algorithms |
| Shards 06 and 09 | suspension/claim evidence and canonical release/credit updates |

## Promotion and Lifecycle Invariants

- Editorial/pre-save uses claim source, one-use OAuth and hard/soft deadlines with person-owned critical path. Submission/link/deadline states are honest; platform never guarantees editorial placement.
- Delivery notifications are purpose-scoped; distribution never directly messages fans. One delivery contact gets actionable interrupts; collaborators get scoped digest.
- Announced date change lists broken promise, forfeits and pre-save continuity. Owner explicitly chooses new plan; command emits event only and never automatically messages fans.
- Update classifies each field/store into metadata update, redelivery, takedown or new release before authorization. Credit changes land canonically regardless of store support.
- Replacing master asks whether same recording/new version; identity is never silently reused.
- Voluntary takedown lists irreversible losses/counts, authority and destination scope and sends only where accepted delivery exists. Before acceptance it cancels queued thread.
- Takedown retains provenance. Re-entry is new release/UPC while existing recording retains ISRC.
- Involuntary suspension/removal uses legal/rights/safety evidence, narrowest scope, claimant/basis/contest notice and append-only claim path.
- Later evidence can supersede lifecycle state but never erases post-mortem or original command.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/releases/{id}/promotion-timelines` | claim source/OAuth/deadlines/owners; release owner/key | `201 PromotionTimelineResponse`; honest states/critical path | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/date-change-preflights` | current/new plan/announcement/pre-save versions; owner/key | `DateChangePreflight`; losses/forfeits/continuity/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/date-changes` | preflight hash/explicit confirmation; owner/key | `201 ReleaseDatePlanResponse`; new announced date/event | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/update-preflights` | field/audio/store/current delivery versions; owner/key | `ReleaseUpdatePreflight`; classified per-store plan/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/updates` | preflight/approvals; owner/key | `202 ReleaseUpdateResponse`; update/redelivery/new-release route | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/takedown-preflights` | destinations/authority/accepted-delivery versions; owner/key | `TakedownPreflight`; losses/counts/scope/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/takedowns` | preflight/step-up/confirmation; owner/key | `202 CatalogueLifecycleResponse`; cancel-thread/withdraw command | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /internal/v1/releases/{id}/involuntary-removals` | Shard 06 case/evidence/scope/notice versions; authorized reviewer/key | `202 CatalogueLifecycleResponse`; suspended/removed | `403`, `409 CASE_STALE`, `422 SCOPE_TOO_BROAD`, `429` |
| `POST /api/v1/catalogue-lifecycle/{id}/contests` | actor/evidence/case refs; affected party/key | `201 CatalogueContestResponse`; append-only contest | `403`, `409`, `422`, `429` |

## Persistence, RLS and Workers

- `promotion_timeline`, `release_date_change`, `release_update_plan`, `catalogue_lifecycle_command` and `catalogue_contest` retain source, authorization and outcome versions.
- RLS exposes owner/collaborator scoped timelines, lifecycle basis to affected parties with protected-evidence redaction and reviewer details only to assigned case roles.
- Date event has no fan-notification consumer in this shard. Lifecycle worker targets accepted delivery threads only and preserves canonical release/identifier/provenance.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Promotion timeline item | `planned → submitted|linked|missed|cancelled|failed`; submitted/linked may become `confirmed|expired` | Owner/person-owned deadline action and one-use OAuth evidence trigger. No state guarantees editorial placement or directly messages fans. |
| Date change | `preflight → confirmed|abandoned|stale`; confirmed creates new announced plan and supersedes prior | Explicit owner acceptance of losses/forfeits/pre-save continuity triggers. No automatic date selection or fan notification. |
| Release update | `classified → metadata_update|redelivery|takedown|new_release|blocked`; routed command `→ pending → completed|failed|partial` | Per-field/store/audio identity preflight and approvals trigger. Credit canonical update persists regardless of store support; recording identity never silently reuses. |
| Voluntary takedown | `preflight → queued → cancelled_thread|withdraw_sent → acknowledged|failed|unknown` | Authority/scope/loss confirmation and accepted-delivery evidence trigger. Before acceptance only queued thread cancels; re-entry requires new release/UPC while ISRC stays recording-bound. |
| Involuntary lifecycle | `active → suspended|removed`; later evidence `→ reinstated|scope_narrowed|superseded` | Authorized Shard 06 legal/rights/safety case and narrowest-scope command trigger. Original command/post-mortem remain immutable. |
| Catalogue contest | `open → case_linked → resolved|closed|superseded` | Affected-party evidence/case outcome triggers. It never erases original lifecycle history. |

Every unlisted transition returns the typed state/version/authority conflict. Lifecycle basis is redacted to purpose-scoped viewers.

## Failure, Deepening and Ambiguity Gate

Tests cover editorial guarantee, fan direct-message, automatic date move, hidden forfeits, update misclassification, master identity reuse, takedown before acceptance, provenance deletion, same-UPC re-entry and overbroad involuntary removal. Seven passes converge; two implementers receive identical lifecycle behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Promotion/update/takedown contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release distribution]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release and distribution lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
