# Cover, print, lyric and grand-right routing — Backend Specification

**Status:** Complete; grand rights unsupported  
**IA Source:** [[specs/ia/21-specialized-licensing|Shard 21 — Specialized licensing]]  
**Deep Dive:** [[specs/ia/deep-dives/21-specialized-licensing|Specialized licensing deep dive]]

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

- **Shard split:** 4 of 4; SPL-15 only.
- **Boundary:** use classifier routing to cover statutory guidance, negotiated print/lyric licensing or explicit unsupported grand-right path.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 21 IA/deep dive | cover/print/grand-right classifier and WONT boundary |
| Shard 20 | structured scope grammar and negotiated instrument lifecycle |

## Specialized Route Invariants

- Classifier distinguishes non-dramatic audio cover, print/lyric reproduction/display and dramatic/grand-right use from declared facts; statutory status is never inferred from title or possession.
- Cover route provides jurisdiction/source-specific guidance and evidence checklist only; platform never claims statutory licence filed, accepted or legally sufficient.
- Print/lyric use routes negotiated composition-side clearance with exact format, quantity/audience, territory, term and reproduction/display scope.
- Grand rights is unsupported/WONT in current product and cannot enter ordinary media scope, auto-approve, quote or instrument issuance.
- If grand rights is reconsidered, it requires explicit evolution and composition-side specialized architecture; no generic scope fallback.
- Unknown/mixed dramatic use returns blocked classification gaps, never chooses the easier route.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/specialized-licensing/classify` | use/media/dramatic context/format/territory/term facts; requester/key | `SpecializedRouteResponse`; cover/print/grand-right/gaps | `403`, `422 USE_CLASSIFICATION_INCOMPLETE`, `429` |
| `POST /api/v1/cover-licensing/guidance` | classification/jurisdiction/distribution facts; requester/key | `CoverGuidanceResponse`; route/evidence/disclaimers | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/print-lyric-clearances/preflight` | work/format/quantity/audience/countries/term/scope; requester/key | `PrintLyricPreflight`; required parties/gaps/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/grand-rights/requests` | any dramatic-use request; requester/key | no supported artifact | `422 GRAND_RIGHTS_UNSUPPORTED`, `429` |

## Persistence, RLS and Workers

- `specialized_route_classification` stores request facts, grammar/policy versions and route/gaps. Cover guidance is non-authoritative evidence; print route references Shard 20 request.
- No grand-right scope value, policy auto-approve, quote type or instrument schema exists. Registry validation rejects additions without `/evolve-feature` propagation.
- RLS scopes route/guidance to requester and mandate participants; audit stores route codes/digests, not private brief content.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Specialized classification | `pending → cover|print_lyric|grand_right|blocked_unknown_mixed`; result `→ stale|superseded` on fact/policy change | Declared use/media/dramatic/format/territory/term facts trigger. Unknown/mixed never chooses easier route and title/possession never infers statutory status. |
| Cover guidance | `draft → issued|blocked`; issued `→ stale|superseded` | Current classification/jurisdiction/distribution facts trigger. Guidance/evidence checklist never claims filing, acceptance or legal sufficiency. |
| Print/lyric clearance | `preflight → negotiation_required|blocked`; negotiation/issuance follows Shard 20 | Exact format/quantity/audience/countries/term/reproduction-display scope triggers. Missing scope/source blocks. |
| Grand-right capability | terminal `unsupported`; no route, policy, quote or instrument state may be created | Any dramatic/grand-right request returns typed unsupported. Admin/registry/generic-scope fallback cannot transition without explicit evolution and propagation. |

Every unlisted transition returns the typed state/version/route conflict. Audit stores route codes/digests only, not private brief content.

## Failure, Deepening and Ambiguity Gate

Tests cover title-based statutory inference, cover filing claim, print scope omission, dramatic use through ordinary media, grand-right auto-approve, admin registry bypass and mixed-use easy routing. Seven passes converge; two implementers receive identical specialized routing behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Cover/print/grand-right routing authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized licensing]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized licensing]]
- [[specs/be/20d-licence-issuance-verification-lifecycle|Licence issuance, verification and immutable lifecycle — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized clearances and licensing]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized clearances and licensing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/20d-licence-issuance-verification-lifecycle|Licence issuance, verification and immutable lifecycle — Backend Specification]]
