# Licensing clearance, evidence, encumbrance and consent — Backend Specification

**Status:** Complete  
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

- **Shard split:** 2 of 4; LIC-05, LIC-06, LIC-07 and LIC-08.
- **Boundary:** completeness attestations, own-work encumbrance declarations, scope-specific fail-closed clearance and simultaneous verified-person consent.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 20 IA/deep dive | scope/clearance and evidence/encumbrance/consent algorithms |
| Shards 01, 06 and 10 | verified parties, protected disputes and rights/consent graph |

## Clearance and Consent Invariants

- Scope grammar expands territory to explicit countries and exact master/publishing/performer/other sides. Unset is non-permissive; data use is separate; AI training omitted means refused.
- Clearance is computed per work+scope from bitemporal rights/administration, consent graph, disputes, attestations, encumbrances, holds/exclusives and policy versions.
- Verdict is `clearable|consent_needed|incomplete|encumbered|contested|blocked|unknown`; owner/operator cannot override fail-closed result.
- Completeness attestation references immutable party-list version, side, knowledge basis, identity/presence/listing and evidence grade. Retraction supersedes, never deletes.
- Contributor may declare own-work sample/material/source/scope ceiling with evidence grade; it creates no accusation or third-party notification.
- Downstream scope ceiling is intersection of upstream clearance instruments. Encumbrance retraction preserves attributable history.
- All required parties receive simultaneous plain-language request naming all stakes plus exact legal grammar appendix. One human receives one combined request.
- Non-response, expired identity or unavailable party stays pending/expired and never improves status. Buyer projection hides blocker identity/category.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/licensing-completeness-attestations` | party-list/side/basis/identity/listing/grade; owner/participant/key | `201 CompletenessAttestationResponse`; valid/corroborated/contested | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/licensing-encumbrances` | own-work material/source/scope ceiling/evidence; contributor/key | `201 EncumbranceResponse`; declared/version | `403`, `409`, `422 ACCUSATION_SCOPE_FORBIDDEN`, `429` |
| `POST /api/v1/licensing-encumbrances/{id}/retractions` | successor reason/evidence; declarant/key | `201 EncumbranceResponse`; superseded version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/licensing-clearance/preflights` | work/scope/buyer/end-client/as-of versions; buyer/key | `ClearanceResponse`; verdict/age/remedy/counterparty count | `403`, `409 SOURCE_STALE`, `422 SCOPE_REQUIRED`, `429`, `503` |
| `POST /api/v1/licensing-consent-requests` | clearance snapshot/all stakes/deadline; buyer or administrator/key | `201 ConsentRequestResponse`; simultaneous per-person requests | `403`, `409 CLEARANCE_STALE`, `422`, `429` |
| `POST /api/v1/licensing-consent-requests/{id}/decisions` | approve/decline/counter exact scope/price; verified person ETag/key | `ConsentRequestResponse`; decision/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /internal/v1/licensing-consent-requests/{id}/expire` | due/version/event; timer worker/key | `ConsentRequestResponse`; expired/no-op | `403`, `409 EVENT_REUSED|DECIDED`, `429` |

## Persistence, RLS and Workers

- `completeness_attestation`, `licensing_encumbrance`, `clearance_snapshot`, `consent_request` and decisions retain source/scope versions and history.
- RLS gives buyer redacted verdict, rights-side co-owner attributed blockers, declarant own encumbrance and verified person own consent request.
- Clearance projector is deterministic by source hash; consent fan-out commits all required requests/outbox rows atomically.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Completeness attestation | `asserted → valid|corroborated|contested|stale`; any current state `→ superseded|retracted` | Exact party-list/side/basis/evidence append or source change triggers. Retraction preserves history and never improves clearance by deletion. |
| Licensing encumbrance | `declared → active|contested`; active/contested `→ superseded|retracted` | Contributor own-work declaration/evidence or retraction triggers. It creates no accusation/third-party notification and cannot widen upstream scope ceiling. |
| Clearance snapshot | immutable verdict `clearable|consent_needed|incomplete|encumbered|contested|blocked|unknown`; current `→ stale|superseded` | Exact bitemporal rights/consent/dispute/hold/policy fold triggers. Owner/admin override is forbidden; unset and omitted AI training are non-permissive. |
| Consent request | `pending → approved|declined|countered|expired|unavailable`; countered may produce a successor pending request | Verified person decision or timer/identity availability triggers. All parties receive simultaneous combined requests; silence never improves status. |

Every unlisted transition returns the typed state/version/clearance conflict. Buyer sees redacted remedy/count only, not blocker identity/category.

## Failure, Deepening and Ambiguity Gate

Tests cover default scope, AI-training implication, owner override, deleted attestation, accusation notification, scope-ceiling expansion, sequential consent, silence-as-consent, erased-party consent and blocker leakage. Seven passes converge; two implementers receive identical clearance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Clearance, evidence and consent authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core and instrument lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
