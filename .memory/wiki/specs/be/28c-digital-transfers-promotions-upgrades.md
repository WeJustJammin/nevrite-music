# Digital licence transfers, promotions and upgrades — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]  
**Deep Dive:** [[specs/ia/deep-dives/28-digital-licensing-commerce|Digital licensing commerce deep dive]]

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

- **Shard split:** 3 of 4; 28.12, 28.13, 28.14 and 28.15.
- **Boundary:** future used-licence transfer, bundled-software transfer, ownership-aware promotions and evidence-based upgrades/crossgrades.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 28 IA/deep dive | transfer atomicity, hardware sequencing, promotion allocation and upgrade proof |
| Shards 25, 26 and 27 | physical order settlement, holder records and digital entitlement authority |

## Transfer and Promotion Invariants

- Used-licence transfer is a future capability requiring current territory law, vendor policy and admitted payment/deactivation provider evidence. Unknown blocks and refunds escrow.
- Transfer changes holder on the existing entitlement atomically with funds, seller deactivation, buyer activation, writing and vendor fee; it never creates parallel entitlement history.
- Bundled software transfer is a separate licence leg after physical inspection/settlement and buyer vendor-account eligibility. Hardware return before settlement leaves licence with seller.
- Promotion pins products, per-item consideration allocation, eligibility and effective window. Multi-vendor promotion requires accepted allocation/split; owned items are not charged twice.
- Ownership lookup failure holds cart rather than assuming no ownership. Upgrade/crossgrade extends version range in place and pins base entitlement or external proof plus price basis.
- External ownership unknown shows full price and exact proof path; no honor-system discount. Terms and holder authority recheck at commit.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-licence-transfers/preflights` | entitlement/parties/territory/vendor policy/provider proof/key; holder controller; capability admitted | `DigitalLicenceTransferPreflightResponse`; eligibility/gaps/hash/expiry | `403 CAPABILITY_DISABLED|COUNSEL_GATE_CLOSED`, `409 SOURCE_STALE`, `422 POLICY_UNKNOWN`, `429` |
| `POST /api/v1/digital-licence-transfers` | preflight/escrow/deactivation/writing versions/key; parties; B3 gate admitted | `201 DigitalLicenceTransferResponse`; completed or compensation/refund state | `403 B3_GATE_CLOSED`, `409 PREFLIGHT_STALE|ENTITLEMENT_CHANGED`, `422`, `429` |
| `POST /internal/v1/physical-orders/{id}/bundled-software-transfers` | settled line/licence/buyer eligibility/inspection versions/key; order worker | `BundledSoftwareTransferResponse`; transferred/blocked/separate result | `403`, `409 HARDWARE_NOT_SETTLED|RETURN_ACTIVE`, `422 BUYER_ACCOUNT_INELIGIBLE`, `429` |
| `POST /api/v1/digital-promotions` | vendor products/allocations/eligibility/window/accepted splits/key; vendor principal | `201 DigitalPromotionResponse`; draft/active validation/version | `403`, `409 SPLIT_UNACCEPTED`, `422 ALLOCATION_INVALID`, `429` |
| `POST /api/v1/digital-promotions/{id}/price-evaluations` | holder/cart/product versions; buyer | `DigitalPromotionPriceResponse`; ownership-aware per-item consideration/gaps | `403`, `409 OWNERSHIP_LOOKUP_UNAVAILABLE`, `422`, `429` |
| `POST /api/v1/digital-entitlements/{id}/upgrades` | target range/base or external proof/price basis/terms/key; holder controller | `201 DigitalEntitlementResponse`; extended range/acquisition epoch | `403`, `409 PROOF_UNVERIFIED|TERMS_CHANGED`, `422`, `429` |

## Persistence, RLS and Workers

- Transfer preflight/escrow/deactivation/writing journal, bundled-software leg, promotion/allocation/acceptance and upgrade proof/epoch rows pin holder, policy, territory and provider versions.
- RLS exposes transfers to affected holders and purpose-scoped services, promotions to controlling vendors and evaluated buyer prices only to that buyer; vendor never receives buyer library detail.
- Transfer compensation, bundled-order handoff, promotion projection and proof-verification workers are idempotent; every execution rechecks capability and source freshness.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Used-licence transfer capability | launch terminal `disabled`; future `admission_pending → admitted|denied`, admitted `→ revoked|expired` | Current territory law/vendor policy/payment/deactivation evidence triggers. Unknown blocks and no consumer/admin bypass exists. |
| Licence transfer | future `preflight → funds_pending → deactivation_pending → writing → completed|compensating|refund_pending|failed|unknown` | Exact entitlement/parties/policy/provider/B3 evidence trigger. Holder changes in existing entitlement atomically; no parallel history. |
| Bundled software leg | `waiting_hardware → eligible|blocked`; eligible `→ transferred|failed|unknown` | Physical inspection/settlement and buyer vendor-account eligibility trigger. Active return or unsettled hardware keeps licence with seller. |
| Promotion | `draft → active|blocked`; active `→ expired|paused|retired|superseded` | Per-item allocation/eligibility/window and accepted multi-vendor split trigger. Owned items are removed from charge; lookup failure holds cart. |
| Upgrade/crossgrade | `preflight → proof_verified|full_price_required|blocked`; verified `→ committed|failed` | Base entitlement or external proof/current terms+holder authority trigger. Commit appends acquisition epoch/range in place; unknown proof never honors discount. |

Every unlisted transition returns the typed state/version/capability conflict. Vendor never receives buyer library details.

## Failure, Deepening and Ambiguity Gate

Tests cover disabled transfer route, unknown law pass, duplicate entitlement, partial funds/deactivation, hardware-before-inspection transfer, multi-vendor unsplit promotion, duplicate charge, ownership lookup fail-open and honor-system upgrade. Seven passes converge; two implementers receive identical transfer, promotion and upgrade behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Transfer, promotion and upgrade contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing commerce]]
- [[specs/be/26c-gear-remedies-settlement-transfers|Gear damage, returns, settlement and ownership transfer — Backend Specification]]
- [[specs/be/27c-digital-entitlements-library-delivery|Digital entitlements, holder library and secure delivery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/26c-gear-remedies-settlement-transfers|Gear damage, returns, settlement and ownership transfer — Backend Specification]]
- [[specs/be/27c-digital-entitlements-library-delivery|Digital entitlements, holder library and secure delivery — Backend Specification]]
