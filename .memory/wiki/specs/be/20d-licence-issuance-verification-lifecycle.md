# Licence issuance, verification and immutable lifecycle — Backend Specification

**Status:** Complete; paid multi-counterparty issuance B3-disabled  
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

- **Shard split:** 4 of 4; LIC-15, LIC-16, LIC-17, LIC-18 and LIC-19.
- **Boundary:** fresh issuance gate, atomic required-side instruments, reproducible certificate projection, live verification, amendment and term/termination lifecycle.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 20 IA/deep dive | issuance/consideration saga and lifecycle algorithm |
| Shards 00, 06, 10 and 14 | provider reconciliation, breach evidence, rights effects and B3 gate |

## Issuance and Lifecycle Invariants

- Issuance re-evaluates clearance, blocks, holds, exclusivity, policy, payment and B3 fresh. At most one overlapping exclusive commits.
- Payee topology is determined before provider effect. Paid multi-counterparty returns `PAYOUT_DISABLED_B3`; single-payee or zero consideration may proceed.
- One transaction records commitment, all required-side instrument pair, rights/revenue registration, audit, idempotency and outbox. No partial dual licence.
- Provider ambiguity remains pending and reconciles to issue or void/refund; never charge-only success or premature issuance.
- Instrument pins scope grammar, explicit countries, parties/capacities, rights sides, agreed/owed price, obligations, issued-at, effective-from, term trigger/duration and supersession.
- Certificate/file is reproducible projection with unguessable verification reference, never authority source. Render failure retries without reissuing.
- Verification is live and returns `valid|superseded|terminated|expired|cannot_verify` with pinned grammar/instrument/lifecycle and timestamped validity window.
- Narrowing/administrative amendment creates successor as permitted; widening is new request with fresh clearance, consent, policy, quote and consideration. Refusal leaves original.
- Later policy/veto/ownership/encumbrance changes affect new requests only. Expiry-indeterminate is explicit; breach termination requires authorized Shard 06 evidence/case.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/licence-issuances/preflight` | settled quote/clearance/policy/exclusivity/payment/topology versions; coordinator/key | `LicenceIssuancePreflight`; required sides/B3/gaps/hash | `403 PAYOUT_DISABLED_B3`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/licence-instruments` | preflight/commitment/provider state; coordinator/key | `202 LicenceInstrumentResponse`; pending/issued pair | `403 PAYOUT_DISABLED_B3`, `409 PREFLIGHT_STALE`, `422`, `429`, `503 PROVIDER_UNKNOWN` |
| `POST /internal/v1/licence-issuances/{id}/reconcile` | provider/transaction evidence/event; finance worker/key | `LicenceInstrumentResponse`; issued or void/refund | `403`, `409 EVENT_REUSED|PROVIDER_MISMATCH`, `429`, `503` |
| `POST /api/v1/licence-instruments/{id}/certificate-jobs` | instrument/version/render profile; authorized party/key | `202 LicenceCertificateResponse`; job/reference | `403`, `404`, `409 VERSION_CONFLICT`, `429` |
| `GET /verify/licence/{reference}` | unguessable reference | `LicenceVerificationResponse`; lifecycle/window/scope summary | `404`, `409 CANNOT_VERIFY`, `429`, `503` |
| `POST /api/v1/licence-instruments/{id}/amendment-preflights` | change classification/scope/parties/terms/source versions; party/key | `LicenceAmendmentPreflight`; narrowing/admin/widening route | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/licence-instruments/{id}/amendments` | non-widening preflight/party decisions; parties/key | `201 LicenceInstrumentResponse`; successor/original unchanged | `403`, `409 WIDENING_REQUIRES_NEW_GRANT`, `422`, `429` |
| `POST /internal/v1/licence-instruments/{id}/term-evaluate` | trigger/duration/time/evidence versions/event; worker/key | `LicenceInstrumentResponse`; active/indeterminate/expired | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/licence-instruments/{id}/terminate` | Shard 06 case/evidence/authority versions; authorized party ETag/key | `LicenceInstrumentResponse`; terminated/version | `403`, `409 CASE_STALE|VERSION_CONFLICT`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- `licence_issuance`, `licence_instrument`, `instrument_commitment`, `certificate_projection`, `instrument_amendment` and lifecycle events are immutable-versioned.
- Exclusion constraints prevent overlapping exclusive scope. Required-side instruments commit in one serializable transaction.
- RLS exposes full instrument to parties, safe verification projection by reference and finance provider details only to reconciler. Verification secret is never enumerable.
- Render/term workers are idempotent. Provider ambiguity blocks issued event. B3 denial is enforced before provider and in database function.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Licence issuance | `preflight → commitment_pending → provider_pending → issued|void_refund|failed|unknown`; unknown reconciles under stable provider identity | Fresh clearance/hold/exclusivity/policy/topology/B3/payment and provider evidence trigger. Multi-payee paid B3 denial, overlap or ambiguity blocks issuance; required-side pair commits atomically. |
| Licence instrument | `issued → active|effective_pending`; active/effective-pending `→ superseded|terminated|expired|expiry_indeterminate` | Issued/effective trigger/term evaluation or authorized Shard 06 termination triggers. Later policy/veto/ownership changes affect new requests only. |
| Certificate projection | `queued → rendered|failed`; rendered `→ stale|superseded`; failed retries without reissuance | Exact instrument/render profile triggers. File/reference never becomes authority source and secret is non-enumerable. |
| Verification projection | live result `valid|superseded|terminated|expired|cannot_verify` bound to exact lifecycle/window/evaluated time | Unguessable reference and current instrument fold trigger. Indeterminate/missing dependency returns cannot-verify, never validity. |
| Instrument amendment | `preflight → narrowing|administrative|widening`; narrowing/admin `→ successor_issued|refused`; widening `→ new_grant_required` | Exact classified change and party decisions trigger. Refusal leaves original unchanged; widening must restart full clearance/consent/policy/quote/consideration. |

Every unlisted transition returns the typed state/version/issuance conflict. Provider ambiguity never creates charge-only or premature licence success.

## Failure, Deepening and Ambiguity Gate

Tests cover stale gate, overlapping exclusive, B3 provider call, partial pair, charge-only success, certificate-as-authority, enumerable reference, widening shortcut, retroactive veto, absent expiry and unsupported breach termination. Seven passes converge; two implementers receive identical issuance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Licence issuance and lifecycle contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/14d-substitution-multiparty-supply|Supplier substitution, fixers and multi-party service supply — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core and instrument lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/14d-substitution-multiparty-supply|Supplier substitution, fixers and multi-party service supply — Backend Specification]]
