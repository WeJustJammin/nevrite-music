# Gear market guides, seller pricing and storefront policies — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]  
**Deep Dive:** [[specs/ia/deep-dives/25-gear-market-catalog|Gear market catalog deep dive]]

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

- **Shard split:** 4 of 4; 25.19, 25.20 and 25.21.
- **Boundary:** confidence-gated public comparables, seller-only pricing suggestions/bounded repricing and versioned storefront policy authority.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 25 IA/deep dive | comparable admission, market confidence policy, repricing and storefront policy contracts |
| Shards 05, 11 and 23 | governed settings, money semantics and valuation boundaries |

## Market and Policy Invariants

- Comparable observations derive only from eligible settled transactions normalized by model, condition, originality, region, currency and period. Self-dealing, wash-risk, bulk-default and unmatched baselines are excluded or policy-weighted down.
- First-party settled sales and admitted external observations remain separately labelled. External source contracts must grant storage, normalization, derived-statistic, audit and correction/deletion rights.
- Guide output is `full|examples_only|declined`; it includes sample, period, dispersion, integrity and policy version. Confidence failure returns no number, never a bare median or fabricated estimate.
- Public transaction evidence is bucketed or k-anonymized under governed thresholds; raw order access remains authorized only. No hidden party, exact location or private negotiation data leaks.
- Seller suggestion uses the same eligible evidence and returns a range/rationale. Seller deviation carries no penalty and no confidence means no suggestion.
- Optional repricing is separately enabled, bounded by seller-authored floor/ceiling/cadence and concurrency checks, and never changes a price with a live offer or claim.
- Storefront defaults apply forward. Claim pins the effective policy version; statutory rules override seller preference, existing obligations survive away mode and rights-affecting terms require principal authority.
- Authorized-dealer and MAP features remain deferred until consumer launch readiness plus legal/provider admission; disabled routes and schema mutations are unreachable.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/gear-market/guides/{bucketId}` | model/condition/originality/region/currency/as-of; public | `GearMarketGuideResponse`; output class/distribution or examples/sample/period/dispersion/freshness | `404 GUIDE_DECLINED`, `422 BUCKET_UNPRICEABLE`, `429`, `503` |
| `POST /api/v1/gear-listings/{id}/price-suggestions` | listing/bucket/source versions/as-of; controlling seller | `GearPriceSuggestionResponse`; evidence-backed range/rationale or declined | `403`, `409 SOURCE_STALE`, `422 CONFIDENCE_INSUFFICIENT`, `429` |
| `PUT /api/v1/gear-listings/{id}/repricing-policy` | enabled/floor/ceiling/cadence/expected listing+price versions/key; controlling seller | `GearRepricingPolicyResponse`; bounded policy/version | `403`, `409 LIVE_OFFER_PRICE_LOCK|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /internal/v1/gear-listings/{id}/repricing-evaluations` | policy/listing/guide versions/event key; repricing worker | `GearRepricingEvaluationResponse`; proposed/applied/skipped and reason | `403`, `409 EVENT_REUSED|SOURCE_STALE|LIVE_OFFER_PRICE_LOCK`, `429` |
| `GET /api/v1/gear-storefronts/{id}/policies` | effective/as-of; seller staff or public projection | `StorefrontPolicyResponse`; authority-labelled effective fields/version | `403`, `404`, `429` |
| `POST /api/v1/gear-storefronts/{id}/policy-versions` | structured fields/authority class/effective window/expected version/key; operator or principal by field | `201 StorefrontPolicyResponse`; successor/statutory overrides | `403 PRINCIPAL_REQUIRED`, `409 VERSION_CONFLICT`, `422 STATUTORY_TERM_INVALID`, `428`, `429` |

## Persistence, RLS and Workers

- `comp_observation`, immutable guide computation/result, repricing policy/evaluation and `storefront_policy_version` rows pin eligibility, source, confidence, authority and policy versions. Monetary values use exact integer minor units or explicit decimal scale; no floating-point persistence.
- RLS exposes k-anonymous guide projections publicly, seller suggestions/policies to controlling seller roles, raw comparable/order evidence only to authorized case-bound services, and rights-affecting policy mutations only to principals.
- Comp admission, confidence recompute and repricing workers consume transactional-outbox events idempotently. Projection lag exposes freshness; stale or insufficient evidence declines rather than carrying an old number without age.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Comparable observation | `candidate → eligible|excluded|downweighted`; eligible `→ corrected|deleted|stale` | Settled transaction/source contract/integrity policy triggers. Self-dealing/wash/unmatched/bulk-default evidence cannot silently enter baseline. |
| Market guide | `computing → full|examples_only|declined|failed`; published result `→ stale|superseded` | Governed sample/privacy/confidence fold triggers. Insufficient confidence returns no number; source classes remain labelled. |
| Price suggestion | `requested → range|declined|stale` | Same eligible guide evidence and listing versions trigger. No confidence means no suggestion and seller deviation has no penalty. |
| Repricing policy/evaluation | policy `disabled ↔ enabled`; enabled `→ superseded`; evaluation `queued → proposed|applied|skipped|failed` | Seller bounds/cadence and current guide/listing concurrency trigger. Live offer/claim locks price; floor/ceiling/version prevent unbounded change. |
| Storefront policy | `draft → active → superseded|retired`; away-mode is separate `active ↔ away` presentation state | Authorized operator/principal and statutory validation trigger. Rights terms require principal; defaults apply forward and existing obligations survive away mode. |
| Dealer/MAP capability | launch terminal `disabled`; no schema/route state may activate before legal/provider admission | Explicit post-consumer evolution only. Ordinary admin/config cannot transition. |

Every unlisted transition returns the typed state/version/confidence conflict. Public guides remain k-anonymous and raw order evidence case-bound.

## Failure, Deepening and Ambiguity Gate

Tests cover unsettled comp admission, wash/self-dealing, source-class mixing, low-sample number leakage, re-identifiable examples, seller penalty, unbounded repricing, live-offer price mutation, delegated rights-term change, statutory-invalid rendering and away-mode obligation erasure. Seven passes converge; two implementers receive identical market guide and storefront policy behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Market guide and storefront policy contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear market catalog]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/23d-valuation-insurance-discography|Gear valuation, insurance evidence and discography — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear catalog, listings and market data]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/23d-valuation-insurance-discography|Gear valuation, appraisal, insurance packs and discography — Backend Specification]]
