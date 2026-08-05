# Digital purchases, beat licensing and usage tracking — Backend Specification

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

- **Shard split:** 1 of 4; 28.01, 28.02, 28.03, 28.04 and 28.05.
- **Boundary:** perpetual/tier selection, beat leases, exclusive-rights commitment, tagged previews and non-enforcing usage-cap tracking.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 28 IA/deep dive | purchase consent, lease terms, exclusive atomicity, previews and cap tracking |
| Shards 10 and 27 | rights instruments, published artifacts and entitlement issuance |

## Purchase and Beat-Licensing Invariants

- Cart pins product/tier, holder, artifact/version range, exact price/currency and terms version. A terms change breaks consent even if the price hold remains valid.
- Beat lease presents plain caps, obligations, non-exclusive status and delivered artifact scope adjacent to purchase; missing or unknown terms fail closed.
- Exclusive purchase locks the beat and commits payment, delist, disclosed live-lease facts and Shard 10 rights instrument atomically or enters explicit compensation hold. Existing leases are never silently revoked.
- Public beat preview is a governed approved full preview with audible source tag under versioned density policy. Tagging is distinct from private forensic watermarking; untagged public preview is denied.
- Lease usage state is `tracked|self_reported|unknown` with attributed evidence and reminders. Cap/expiry signals never auto-revoke, takedown or grant vendor mutation authority.
- Paid order and entitlement issuance are idempotent but separately evidenced. Multi-party money topology remains unreachable until B3 counsel/provider gates pass.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-checkout/preparations` | buyer/holder/product/tier/listing-price-terms-artifact versions/key; holder controller | `201 DigitalCheckoutPreparationResponse`; pinned terms/price/scope/gaps/expiry | `403`, `409 SOURCE_STALE`, `422 TERMS_UNKNOWN|HOLDER_INVALID`, `429` |
| `POST /api/v1/digital-checkout/preparations/{id}/commitments` | preparation/payment proof/consent/key; holder controller; B3 gate admitted when applicable | `201 DigitalPurchaseResponse`; paid order/entitlement issuance ref | `403 B3_GATE_CLOSED`, `409 TERMS_CHANGED|PAYMENT_PENDING`, `422`, `429` |
| `POST /api/v1/digital-beats/{id}/exclusive-purchases` | exclusive terms/lease count/rights instrument/payment/expected versions/key; eligible buyer | `201 BeatExclusivePurchaseResponse`; committed or compensation-held legs | `403`, `409 EXCLUSIVE_ALREADY_COMMITTED|VERSION_CONFLICT`, `422 RIGHTS_INSTRUMENT_REQUIRED`, `429` |
| `GET /public/digital-beats/{id}/preview` | approved rendition/range; public | `206` source-tagged protected preview | `404`, `409 TAGGED_RENDITION_REQUIRED`, `416`, `429` |
| `POST /api/v1/digital-lease-usage` | entitlement/metric/value/source/evidence/key; holder or admitted evidence source | `201 DigitalLeaseUsageResponse`; tracked/self-reported/unknown/version | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `GET /api/v1/digital-entitlements/{id}/lease-status` | entitlement; holder controller | `DigitalLeaseStatusResponse`; caps/usage/expiry/source/freshness | `403`, `404`, `429` |

## Persistence, RLS and Workers

- Purchase preparation/order, beat lease snapshot, exclusive commit/compensation journal, preview rendition and usage evidence rows pin actor, holder, terms, rights, policy and provider versions; money uses integer minor units.
- RLS exposes purchase/usage to holder controllers, structured aggregate reversal/usage to vendors without buyer identity, and public tagged preview only through governed rendition.
- Payment, exclusive compensation, entitlement handoff and reminder workers use transactional outbox idempotently; provider ambiguity remains pending and never grants access.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Checkout preparation | `prepared → committed|expired|stale|cancelled`; prepared may refresh only through successor | Frozen buyer/holder/product/tier/price/terms/artifact scope triggers. Terms change invalidates consent even if price hold remains. |
| Digital purchase/order | `payment_pending → paid|declined|unknown`; paid `→ entitlement_pending → fulfilled|failed`; unknown reconciles under stable operation | Current preparation/affirmative consent/B3 topology and provider proof trigger. Ambiguity grants no access and order/entitlement remain separately evidenced. |
| Beat lease | `active → expired|cap_reached|superseded|revoked_by_governed_process`; usage evidence remains `tracked|self_reported|unknown` | Issued instrument/term timer/evidence trigger. Cap/expiry signal never auto-revokes, takedowns or grants vendor authority. |
| Exclusive beat purchase | `preflight → committing → completed|compensation_hold|failed|unknown`; hold `→ completed|void_refund|human_review` | Atomic beat lock/payment/delist/live-lease disclosure/Shard 10 instrument trigger. Existing leases remain; no partial exclusive success. |
| Public preview | `processing → approved_tagged|blocked`; approved `→ withdrawn|stale` | Governed full preview/source-tag density policy triggers. Untagged public preview denied; forensic watermark mapping stays private. |

Every unlisted transition returns the typed state/version/payment conflict. Buyer identity remains hidden from vendor projections.

## Failure, Deepening and Ambiguity Gate

Tests cover stale terms consent, unknown lease terms, partial exclusive commit, prior-lease revocation, untagged preview, watermark disclosure, cap auto-revocation, vendor buyer identity and B3 bypass. Seven passes converge; two implementers receive identical purchase and beat-licensing behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Purchase and beat-licensing contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing commerce]]
- [[specs/be/10b-splits-points-buyouts-amendments|Splits, points, buyouts and amendments — Backend Specification]]
- [[specs/be/27c-digital-entitlements-library-delivery|Digital entitlements, holder library and secure delivery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
- [[specs/be/27c-digital-entitlements-library-delivery|Digital entitlements, holder library and secure delivery — Backend Specification]]
