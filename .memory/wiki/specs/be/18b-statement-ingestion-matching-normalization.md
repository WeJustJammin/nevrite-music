# Royalty statement ingestion, matching and normalization — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]  
**Deep Dive:** [[specs/ia/deep-dives/18-royalty-accounting|Royalty accounting deep dive]]

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

- **Shard split:** 2 of 5; ROY-05, ROY-06, ROY-07, ROY-08, ROY-09 and ROY-10.
- **Boundary:** statement-source registry, custody-safe immutable ingest, deterministic whole-file parsing, reversible catalogue mappings, exception queue and source-native normalization.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 18 IA/deep dive | ingestion/parsing, identity mapping, exception and normalization algorithms |
| Shards 00, 09 and 10 | private objects/imports, catalogue identifiers and rights facts |

## Ingestion, Matching and Normalization Invariants

- Statement source pins counterparty, payee/reporting relationship, remittee, cadence, correction window and custody channels `upload|dkim_forward|platform_fetch`.
- Ingest verifies complete transfer, byte length, checksum and custody before immutable private original exists. Same checksum for same counterparty/payee is certain duplicate.
- Different bytes are never deduplicated before deterministic parse comparison decides new statement versus restatement.
- Adapter selection uses declared source plus in-file fingerprint and statement-date effective version. Mismatch blocks; content sniffing never guesses.
- Whole-file parse classifies every row. Monetary reconciliation sums exact source-currency values with file-derived tolerance; missing stated total is explicit `unoracled`.
- Failed structural/monetary reconciliation blocks matching/calculation and ages as money-sized exception. No line may be silently dropped or materiality-filtered.
- Matching cascade is exact identifiers, source codes, party/legal-name signals, then fuzzy evidence. Fuzzy candidate needs at least two independent signal classes and never auto-confirms or moves money.
- Human-confirmed mapping is source/catalogue scoped, reversible and replayed deterministically. Catalogue update may resweep but never override a human decision.
- Exception queue ranks open source amount, correction-window expiry and age; closed outcomes remain forever.
- Original amount, currency, precision, source FX and deductions remain immutable. Usage/distribution/receipt/payout dates stay distinct.
- Reporting FX is labelled derived view with provider/method/date. No rate on or before target within seven days leaves source-native result and explicit residual.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Original documents remain holder-only private storage.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/royalty-statement-sources` | counterparty/payee/remittee/cadence/correction/custody; mandated party/key | `201 StatementSourceResponse`; versioned source | `403`, `409 SOURCE_EXISTS`, `422`, `429` |
| `POST /api/v1/royalty-statements/ingest-intents` | source/channel/length/checksum/period metadata; holder/key | `201 StatementIngestIntentResponse`; upload/fetch/forward requirements | `403`, `409 CERTAIN_DUPLICATE`, `422`, `429` |
| `POST /api/v1/royalty-statements` | completed intent/private object/custody evidence; holder/key | `202 RoyaltyStatementResponse`; ingest/duplicate/notification state | `403`, `409 CHECKSUM_MISMATCH`, `422`, `429`, `503` |
| `POST /internal/v1/royalty-statements/{id}/parse` | source/fingerprint/date/adapter version/input hash; parser worker/key | `RoyaltyParseResponse`; reconciled/unoracled/blocked | `403`, `409 EVENT_REUSED|ADAPTER_MISMATCH`, `422`, `429` |
| `GET /api/v1/royalty-statements/{id}/parse-exceptions` | holder/authorized accountant | `ParseExceptionPage`; value/age/reason/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/royalty-source-identities/{id}/mapping-decisions` | candidate signals/confirm-reject/not-mine/source scope; authorized accountant ETag/key | `201 CatalogueMappingResponse`; reversible mapping/version | `403`, `409 VERSION_CONFLICT`, `422 SIGNALS_INSUFFICIENT`, `428`, `429` |
| `POST /api/v1/royalty-source-identities/{id}/mapping-reversals` | mapping/cause/new evidence; authorized accountant/key | `201 CatalogueMappingResponse`; reversed/restatement job | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/royalty-exceptions` | holder/reason/value/age/correction-window cursor | `RoyaltyExceptionPage`; open and closed history | `403`, `429`, `503` |
| `POST /api/v1/royalty-exceptions/{id}/resolve` | mapping/not-mine/missing-period/rights/escalation and evidence; authorized actor/key | `RoyaltyExceptionResponse`; terminal/successor state | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /internal/v1/royalty-statements/{id}/normalize` | parsed statement/period/FX policy versions/event; worker/key | `RoyaltyNormalizationResponse`; source facts/derived view/residual | `403`, `409 EVENT_REUSED`, `422 PERIOD_UNKNOWN`, `429`, `503 FX_UNAVAILABLE` |

## Persistence, RLS and Workers

- `statement_source`, `royalty_statement`, `statement_parse`, `statement_row`, `source_identity_mapping`, `royalty_exception` and `normalized_money_fact` retain immutable inputs and successor lineage.
- Decimal columns use explicit precision/scale; source amounts are never binary float. Mapping uniqueness is source+identity effective interval.
- RLS isolates documents/rows/mappings by holder/mandate; no cross-uploader aggregation. Workers receive object identifiers and signed purpose grant, not broad storage access.
- Parser/normalizer output is deterministic by input hash + adapter/engine version. Restatement job traverses only after reconciled or explicitly accepted unoracled input.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Statement ingest | `intent → transferring → verified → parsing`; transfer may become `failed|certain_duplicate`; verified/parsing `→ new_statement|restatement|blocked` | Complete custody/length/checksum and deterministic parse comparison trigger. Different bytes never deduplicate early; failed verification creates no original. |
| Statement parse | `queued → parsing → reconciled|unoracled|blocked|failed`; failed may retry under same input/adapter identity | Declared source+fingerprint+date adapter and whole-file reconciliation trigger. Adapter mismatch, dropped row or monetary failure blocks matching/calculation. |
| Source identity mapping | `candidate → confirmed|rejected|not_mine`; confirmed `→ reversed|superseded` | Human decision with two independent fuzzy signal classes when not exact triggers. Catalogue resweep cannot override confirmed decision; reversal creates deterministic restatement. |
| Royalty exception | `open → investigating → resolved|not_mine|missing_period|rights_escalated|closed`; terminal outcome may gain successor on new evidence | Authorized evidence decision triggers. Queue ranking never drops material rows and closed history remains immutable. |
| Normalization | `queued → source_native|reporting_fx|fx_unavailable|blocked`; result `→ superseded` by restatement | Reconciled/accepted-unoracled input and exact period/FX policy trigger. No qualifying FX preserves source-native amount/residual; source facts never mutate. |

Every unlisted transition returns the typed state/version/input-hash conflict. Documents, rows and mappings remain holder/mandate isolated.

## Failure, Deepening and Ambiguity Gate

Tests cover incomplete transfer, false dedupe, adapter guessing, dropped line, tolerance arithmetic, no-total fabrication, title-only mapping, probability auto-confirm, human-decision override, materiality drop, date conflation, FX fabrication and document leakage. Seven passes converge; two implementers receive identical ingestion and normalization behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Statement ingest/matching contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/10e-identifiers-registration-evidence|Identifiers, registration and evidence — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10e-identifiers-registration-evidence|Rights identifiers, registration and evidence export — Backend Specification]]
