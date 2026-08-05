# Share-owner policy, quotes, negotiation and MFN — Backend Specification

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

- **Shard split:** 3 of 4; LIC-09, LIC-10, LIC-11, LIC-12, LIC-13 and LIC-14.
- **Boundary:** share-scoped policy/veto, order-independent policy fold, version-pinned quotes, separated money/consent negotiation and fixed-point MFN.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 20 IA/deep dive | policy/pricing algorithm and quote/MFN edge cases |
| Shards 10 and 18 | share authority and B3 money boundary |

## Policy and Pricing Invariants

- Policy belongs to exact owner share/side and grammar version; no owner gains work-wide authority. Defaults/overrides/exclusions/thresholds are immutable versions.
- Refusal precedes eligibility, per-owner threshold, fall-through and pricing. Fold is order-independent and attributed.
- Auto-approve is explicit opt-in, non-exclusive only, every owner policy must pass, and no MFN/dispute/self-dealing conflict. Failure/budget excess falls through to human.
- Veto validates standing side/category/buyer scope and atomically affects future/in-flight requests, never issued licences.
- Policy evaluates before price. Quote pins rate-card, policy, scope, grammar, clearance and TTL; ask in money and consent remain separate.
- Partial/pending quote or partial agreement never appears as deal. Negotiation records immutable asks/counters/consents until TTL.
- MFN evaluates complete settled set at one fixed point among eligible distinct counterparties and separates agreed from owed price. Failure yields provisional hold, never guessed amount.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Prices are purpose-limited.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/licensing-policies` | share/side/grammar/defaults/overrides/exclusions/thresholds/auto-opt-in; owner/key | `201 LicensingPolicyResponse`; version | `403`, `409 SHARE_AUTHORITY_STALE`, `422`, `429` |
| `POST /api/v1/licensing-vetoes` | share/side/category/buyer scope/effective interval; co-owner/key | `201 LicensingVetoResponse`; active/version | `403`, `409`, `422 STANDING_REQUIRED`, `429` |
| `POST /internal/v1/licensing-policy-folds` | request/owner policies/vetoes/scope versions/event; worker/key | `PolicyFoldResponse`; attributed verdict/fall-through | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/licensing-quotes` | clearance/fold/rate-card/scope/deadline versions; buyer/key | `201 LicensingQuoteResponse`; complete/partial/pending/expiry | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/licensing-quotes/{id}/counters` | money ask/counter and separate consent refs; authorized party/key | `201 LicensingNegotiationResponse`; immutable round | `403`, `409 QUOTE_EXPIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/licensing-negotiations/{id}/settle` | complete party decisions/version; authorized coordinator/key | `LicensingNegotiationResponse`; settled/no-deal | `403`, `409 PARTIAL_AGREEMENT`, `422`, `429` |
| `POST /internal/v1/licensing-negotiations/{id}/mfn` | settled set/counterparties/MFN clauses/event; worker/key | `MFNResponse`; agreed/owed or provisional hold | `403`, `409 EVENT_REUSED|SET_INCOMPLETE`, `422`, `429` |

## Persistence, RLS and Workers

- `licensing_policy`, `licensing_veto`, `policy_fold`, `licensing_quote`, `negotiation_round` and `mfn_result` pin share/scope/source versions.
- RLS exposes owner own thresholds, co-owners attributed fold outcomes, buyer complete quote and finance purpose-limited prices; private policy internals remain hidden.
- Fold/MFN workers are deterministic and order-randomization tested. Veto event withdraws affected in-flight quote/consent atomically.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Owner policy | `draft → active → superseded|retired`; active may be suspended | Exact share/side/grammar owner command triggers. Policy never grants work-wide authority; immutable version pins defaults/thresholds/exclusions. |
| Licensing veto | `active → expired|revoked|superseded` | Standing co-owner scope/interval command triggers. It atomically withdraws affected future/in-flight requests but never retroactively changes issued licence. |
| Policy fold | `queued → auto_approved|human_required|refused|blocked|failed` | Order-independent owner-policy/veto fold triggers. Refusal precedes pricing; owner failure/budget/MFN/dispute/self-dealing cannot become approval. |
| Licensing quote/negotiation | quote `draft → complete|partial|pending → expired|withdrawn|superseded`; complete `→ negotiating → settled|no_deal|expired` | Current fold/clearance/rate/scope and immutable counters/consents trigger. Partial/pending never appears as deal; money ask and consent remain separate. |
| MFN result | `pending_set → agreed_and_owed|provisional_hold|failed`; settled result `→ superseded` only by a governed restatement | Complete fixed settled set triggers. Incomplete/moving set or evaluation failure yields hold, never guessed amount. |

Every unlisted transition returns the typed state/version/policy conflict. Private thresholds/prices remain purpose limited.

## Failure, Deepening and Ambiguity Gate

Tests cover work-wide policy, input-order fold, auto-approve exclusivity, owner failure as approval, veto retroactivity, price-before-policy, consent-as-money, partial deal and MFN moving target. Seven passes converge; two implementers receive identical policy and pricing behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Policy, quote and MFN contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core]]
- [[specs/be/10b-splits-points-buyouts-amendments|Splits, points, buyouts and amendments — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core and instrument lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
