# Supplier substitution, fixers and multi-party service supply — Backend Specification

**Status:** Complete; B3 multi-payee activation disabled  
**IA Source:** [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/14-services-marketplace|Services marketplace deep dive]]

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

- **Shard split:** 4 of 5; SRV-14 and SRV-15. Composition may be recorded; activation/payment release is unreachable until B3 counsel and payment-capability approval.
- **Boundary:** buyer-approved identity substitution, actual-worker attribution, N+1 fixer engagements, bundle stage composition, visible title/payout plans and hard multi-payee denial.
- **Approval:** Recommended split accepted under standing autonomy.

## Supply Invariants

- Actual worker always receives credit; agency/fixer commission is commercial and never attribution. Agency authority never inferred.
- Identity-based substitution requires explicit buyer approval; facility/channel-based substitution may use an accepted pre-authorized profile. First delivery/approval ordering determines original versus actual worker and is immutable.
- Refused/failed required substitution is seller fault. Substitute sees only scoped work facts, not unrelated commercial terms, and cannot bind buyer without mandate.
- Fixer composition is N player engagements plus fixer engagement/credits. Bundle is a milestone chain with one whole-bundle counterparty and visible composed title chain.
- Buyer sees stages, counterparties, actual workers, engagements, title/credit chain and payout plan before activation. Each worker/stage remains independently traceable.
- B3 gate is checked both composition activation and any multi-payee release. Disabled state returns `COUNSEL_GATE_DISABLED` before payment/provider effects; no admin/feature flag override and no split-to-single-payee workaround.
- Single-payee engagement may proceed only when it truthfully has one payee; composition records cannot be flattened to hide beneficiaries.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/engagements/{id}/substitution-proposals` | original/actual worker, basis/profile, scope and first-work boundary; seller/key | `201 SubstitutionResponse`; proposed/version | `403`, `409 SUBSTITUTION_EXISTS`, `422`, `429` |
| `POST /api/v1/substitutions/{id}/buyer-decisions` | approve/refuse exact worker/scope; buyer ETag/key | `SubstitutionResponse`; approved/refused version/credit projection | `403`, `409 DELIVERY_OR_VERSION_RACE`, `422`, `428`, `429` |
| `POST /api/v1/supply-compositions` | kind/fixer/buyer/stages/workers/engagement templates/title+payout plan; authorized coordinator/key | `201 SupplyCompositionResponse`; recorded inactive composition/version | `403`, `409`, `422`, `429` |
| `GET /api/v1/supply-compositions/{id}` | buyer/fixer/scoped worker | `SupplyCompositionResponse`; viewer-safe stages/counterparties/title/payout gate | `403`, `404`, `429`, `503` |
| `POST /api/v1/supply-compositions/{id}/activate` | exact plan/consents/counsel+payment capability versions; buyer/fixer key | no success while B3 disabled | `403 COUNSEL_GATE_DISABLED` before provider effect, `409 SOURCE_STALE`, `422`, `429` |
| `POST /internal/v1/supply-compositions/{id}/multi-payee-release` | future accepted stage/allocations/provider manifest; worker/key | no success while B3 disabled | `403 COUNSEL_GATE_DISABLED`, `409 EVENT_REUSED`, `422`, `429` |

Reads are 120/min; substitutions 20/hour/engagement; composition writes 10/hour/buyer; activation/release 5/hour with step-up and 100% audit. Commercial details are no-store and omitted from public events.

## Persistence, RLS and Workers

Tables: `service.substitutions`, `supply_compositions`, `supply_stages`, `supply_workers`, `supply_title_chains`, `supply_payout_plans` and audit events. Database constraint prohibits active multi-payee composition/release without an approved immutable B3 capability version.

RLS is buyer/fixer/scoped worker. Workers update actual-worker credit only after effective approval ordering, never redirect credit to agency. No v1 worker invokes multi-payee provider APIs. Events carry original/actual/state/consent/version without private terms.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Substitution | `proposed → approved|refused|failed|superseded`; approved `→ effective` only if approval precedes first work/delivery boundary | Seller proposal, buyer decision and immutable first-work ordering trigger. Identity substitution without approval, profile mismatch or delivery/version race blocks; refused/failed required substitution is seller fault. |
| Actual-worker credit projection | `pending → attributable|blocked`; attributable `→ emitted`; source correction appends a superseding projection | Effective substitution/work evidence triggers. Agency/fixer commission never redirects attribution and missing worker identity blocks emission. |
| Supply composition | `recorded_inactive → activation_blocked`; future approved B3 capability may permit `→ active → completed|cancelled|failed` | Exact plan/consents/capability version triggers. V1 always returns counsel-gate disabled before provider effect; feature/admin flags and beneficiary flattening cannot bypass. |
| Multi-payee release | future `pending → dispatched → acknowledged|failed|unknown`; unavailable in v1 | Approved immutable B3 capability and exact accepted stages/allocations/provider manifest would trigger. No v1 row/provider call may enter pending. |

Every unlisted transition returns the typed state/version/counsel-gate conflict. Events omit private commercial terms and never flatten worker/title/payout chains.

## Failure, Deepening and Ambiguity Gate

Tests cover identity substitution without consent, delivery/approval race, facility profile misuse, agency credit theft, inferred agency mandate, hidden worker/commercial leakage, composition flattening, B3 admin/flag bypass and provider call while disabled. Seven passes converge; two implementers receive identical substitution and hard-gated supply behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Substitution and B3 supply contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
