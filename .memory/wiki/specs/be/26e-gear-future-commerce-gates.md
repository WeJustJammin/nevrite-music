# Gear international and future commerce capability gates — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]  
**Deep Dive:** [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Gear commerce fulfilment deep dive]]

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

- **Shard split:** 5 of 5; 26.21 and 26.22.
- **Boundary:** fail-closed international determinations and post-consumer-launch auction, ISO, dealer, rental/lease/fractional possession capability admission.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 26 IA/deep dive | international determination and disabled future capability contracts |
| Shards 05, 24 and 25 | governed flags/settings, custody evidence and dealer/channel deferral |

## Future Capability Invariants

- Consumer launch supports admitted domestic routes only. International routes are unreachable until feature, provider and counsel gates all pass with current evidence.
- International determination pins destination, tariff/material facts, tariff and provider rule versions, CITES result, landed-cost terms, DDP/DAP policy, refund/duty-reclaim contract and validity window.
- Unknown, stale, recompute failure or unsupported material/route is ineligible. No under-declaration, stale permission, optimistic landed cost or parcel fallback is permitted.
- Auction, ISO/wanted, authorized-dealer/MAP, rental, lease, subscription, fractional ownership and other possession models remain separately admitted post-consumer capabilities.
- Future capabilities reuse canonical inventory claims, custody, evidence and title boundaries but require distinct state machines; consumer listing/order commands never impersonate them.
- Disabled capability schemas, queues, routes, workers and admin mutations are unreachable. No hidden partial path, substitute persona or manual override bypasses counsel/provider/privacy gates.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-compliance/international-determinations` | destination/item/material/tariff/provider/policy versions/key; authorized buyer/seller; all international gates admitted | `202 InternationalDeterminationResponse`; pending/eligible/ineligible/validity/reasons | `403 CAPABILITY_DISABLED|COUNSEL_GATE_CLOSED|PROVIDER_NOT_ADMITTED`, `409 SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/gear-compliance/international-determinations/{id}` | determination; participating party | `InternationalDeterminationResponse`; result/cost basis/validity/freshness | `403`, `404`, `429`, `503` |
| `POST /internal/v1/gear-compliance/international-determinations/{id}/recomputes` | source/rule versions/event key; admitted compliance worker | `InternationalDeterminationResponse`; successor or fail-closed result | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `429` |
| `GET /api/v1/gear-commerce/capabilities` | acting party/region | `GearCommerceCapabilityResponse`; admitted capabilities/reasons/evidence freshness | `403`, `429` |
| `POST /internal/v1/gear-commerce/capability-admissions` | capability/provider/counsel/privacy/security evidence/config version/key; restricted admin workflow | `201 CapabilityAdmissionResponse`; admitted/denied/expiry | `403 ROLE_INSUFFICIENT|COUNSEL_GATE_CLOSED`, `409 EVIDENCE_STALE`, `422 CONSUMER_LAUNCH_NOT_READY`, `429` |

## Persistence, RLS and Workers

- `international_determination`, immutable rule/source snapshots, capability admission evidence and expiry/revocation events pin actor, counsel/provider/privacy decisions and policy versions.
- RLS exposes determinations to participating parties and case-bound reviewers; admission evidence to restricted administration/counsel workflows. No capability row itself grants route access without server-side gate evaluation.
- Determination/recompute and admission-expiry workers are idempotent. Stale evidence revokes reachability before effects; queued work rechecks every gate at execution.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Future commerce capability | `disabled → admission_pending → admitted|denied`; admitted `→ expired|revoked|killed`; consumer launch future capabilities remain disabled | Complete feature/provider/counsel/privacy/security evidence triggers. No admin/manual/persona/substitute-route bypass; stale evidence revokes before effect. |
| International determination | future `pending → eligible|ineligible|unknown|failed`; eligible `→ stale|expired|superseded` | Exact destination/material/tariff/provider/CITES/landed-cost/DDP-DAP/refund rule versions trigger. Unknown/stale/failure is ineligible; no under-declaration or parcel fallback. |
| Future auction/rental/lease/subscription/fractional workflow | unavailable until separately admitted; each requires its own explicit lifecycle before any active row | Explicit evolved capability only. Consumer listing/order/custody commands cannot impersonate these models. |
| Capability admission evidence | `draft → reviewed → admitted|denied`; admitted `→ expired|revoked|superseded` | Restricted review and freshness timer trigger. Admission row alone never grants route access without live server gate evaluation. |

Every unlisted transition returns the typed capability/counsel/provider gate conflict before mutation or external effect.

## Failure, Deepening and Ambiguity Gate

Tests cover feature-only enablement, stale tariff permission, unknown CITES pass, under-declaration, DDP/DAP omission, international parcel fallback, consumer-route auction emulation, rental-as-custody shortcut, admin counsel bypass and disabled worker reachability. Seven passes converge; two implementers receive identical international and future-capability behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | International and future commerce gate contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear commerce fulfilment]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/25c-gear-inventory-bulk-channels|Gear inventory claims, bundles, bulk listing and channels — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear transactions, fulfilment and possession models]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/25c-gear-inventory-bulk-channels|Gear inventory claims, bundles, bulk listing and channels — Backend Specification]]
