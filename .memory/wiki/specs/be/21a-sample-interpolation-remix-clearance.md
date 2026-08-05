# Sample, interpolation and remix clearance — Backend Specification

**Status:** Complete; fingerprint provider disabled  
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

- **Shard split:** 1 of 4; SPL-01, SPL-02, SPL-03, SPL-04, SPL-05 and SPL-06.
- **Boundary:** human sample/replay declarations, machine suggestions without authority, unanimous source-side clearance and exact remix/stem grants.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 21 IA/deep dive | sample/interpolation/remix interactions and authority boundaries |
| Shards 10 and 20 | rights sides, consent graph, scope grammar and instrument issuance |

## Sample and Derivative Invariants

- Human declaration is enumerative/versioned and records contribution, recording/composition sides, known/unknown source and human/machine provenance. Truthful unidentified source remains first-class indefinitely.
- Missing declaration does not block ordinary release, but unresolved truth blocks every licensing scope requiring clearance.
- Fingerprint/local adapter returns candidate/prominence measurement only. It never auto-declares, auto-notifies, auto-merges or auto-clears; provider absence is visible.
- Instant clearance composes fresh Shard 20 scope/policy/consent/terms. Any failure falls to negotiation, never false clear.
- Sample terms require unanimous consent from every required source-side owner and validated stacking of fee/revenue-share obligations.
- Replay/interpolation asks plain language whether recognizable material was replayed, resolves composition side only and states master is not cleared.
- Stem possession or upload never creates grant authority. Remix grant pins exact source assets, derivative/exploitation scope and Shard 10 authority.
- Scope ceiling is intersection of upstream instruments; bootleg path can only seek retroactive legitimisation and never rewrites prior unauthorized history.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Machine/provider routes reject while fingerprint integration is disabled.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/sample-declarations` | project/contribution/sides/source-known/provenance; contributor/key | `201 SampleDeclarationResponse`; current/superseded history | `403`, `409`, `422`, `429` |
| `POST /api/v1/sample-declarations/{id}/successors` | corrected declaration/reason/source versions; declarant ETag/key | `201 SampleDeclarationResponse`; successor/diff | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/sample-identity-suggestions` | governed asset/digest/provider policy; contributor/key | no provider success while disabled | `403 FINGERPRINT_PROVIDER_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/sample-identity-suggestions/{id}/decisions` | confirm/reject candidate/provenance; human contributor/key | `SampleSuggestionResponse`; retained decision | `403`, `409`, `422`, `429` |
| `POST /api/v1/sample-clearances/preflight` | source sides/scope/policy/consent/terms versions; rights holder/key | `SampleClearancePreflight`; issue/negotiation route/hash | `403`, `409 SOURCE_STALE`, `422 CLEARANCE_INCOMPLETE`, `429` |
| `POST /api/v1/sample-clearances` | preflight/owner decisions/stacked obligations; coordinator/key | `202 SampleClearanceResponse`; instrument or negotiation | `403`, `409 PREFLIGHT_STALE`, `422 UNANIMOUS_CONSENT_REQUIRED`, `429` |
| `POST /api/v1/interpolation-declarations` | project/replayed-material/composition source; creator/key | `201 InterpolationResponse`; composition route/warning | `403`, `409`, `422`, `429` |
| `POST /api/v1/remix-grants/preflight` | source assets/authority/scope/exploitation; rights holder/key | `RemixGrantPreflight`; eligible/gaps/hash | `403`, `409 SOURCE_STALE`, `422 POSSESSION_NOT_AUTHORITY`, `429` |
| `POST /api/v1/remix-grants` | preflight/consents/consideration; rights holder/key | `202 LicenceInstrumentResponse`; issued/pending | `403`, `409 PREFLIGHT_STALE`, `422`, `429`, `503` |

## Persistence, RLS and Workers

- `sample_declaration`, `sample_suggestion`, `sample_clearance`, `interpolation_declaration` and `remix_grant` pin project/assets/rights/scope versions.
- RLS exposes declarations to project participants, candidates to declarant, clearance blockers to relevant source owners and buyer only redacted status.
- Fingerprint gate is enforced at router, database and worker. Shard 20 issuance owns canonical instrument; this shard stores specialized inputs/references only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Sample declaration | `current → superseded`; each immutable value records `known_source|unknown_source` and sides/provenance | Contributor explicit create/correction triggers. Missing declaration may allow ordinary release but unresolved truth blocks clearance-required scope. |
| Fingerprint suggestion | launch capability `disabled`; future suggestion `queued → candidate|no_match|failed`, candidate `→ confirmed|rejected` only by human | No provider action while disabled. Future machine output never declares, notifies, merges or clears automatically. |
| Sample clearance | `preflight → instant_issue|negotiation_required|blocked`; issue path `→ issued|failed`, negotiation follows Shard 20 | Fresh all-side scope/policy/consent/terms and unanimous source-owner decisions trigger. Any failure falls to negotiation/blocked, never false clear. |
| Interpolation declaration | immutable `composition_route|source_unknown|not_recognizable` | Creator plain-language declaration triggers. It never clears master side or infers statutory status. |
| Remix grant | `preflight → pending_issuance → issued|failed|blocked`; issued `→ superseded|terminated|expired` under Shard 20 | Exact assets/authority/scope/consent trigger. Possession/upload is not authority; widening/bootleg history cannot be rewritten. |

Every unlisted transition returns the typed state/version/clearance conflict. Specialized rows never replace canonical Shard 20 instrument state.

## Failure, Deepening and Ambiguity Gate

Tests cover unidentified-source rejection, release block from missing declaration, machine auto-clear, provider-disabled fallback, non-unanimous clearance, master implication for interpolation, stem-possession authority and retroactive history rewrite. Seven passes converge; two implementers receive identical specialized-clearance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Sample/interpolation/remix clearance authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized licensing]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized licensing]]
- [[specs/be/20b-clearance-evidence-consent|Licensing clearance, evidence, encumbrance and consent — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized clearances and licensing]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized clearances and licensing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/20b-clearance-evidence-consent|Licensing clearance, evidence, encumbrance and consent — Backend Specification]]
