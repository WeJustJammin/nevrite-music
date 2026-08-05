# Income, tax readiness and receivables — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]  
**Deep Dive:** [[specs/ia/deep-dives/41-career-finance|Career finance and business operations deep dive]]

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

- **Shard split:** 1 of 2; 41.01, 41.02, 41.03, 41.04, 41.05, 41.06, 41.07, 41.08, 41.09, 41.10 and 41.11. High-complexity finance is split at the immutable business-instrument boundary.
- **Boundary:** income/reversal/import/FX evidence, issued financial snapshots, expense and tax-readiness evidence, quotes, invoices, receivables and dunning.
- **Approval:** Recommended two-document split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 41 IA/deep dive | income ordering, reconciliation, FX, expense/tax, quote, invoice and dunning contracts |
| Shards 14, 18, 26, 28 and 31 | accepted economics, royalty, commerce, licensing and live-settlement source facts |
| Shards 00, 01, 05 and 06 | authority, restricted-data policy, counsel gates, audit and disputes |

## Income and Snapshot Invariants

- Income rows are append-only native-currency evidence keyed by `(producer, source_event_id)`. Duplicate delivery is idempotent; conflicting reuse returns `EVENT_KEY_CONFLICT` and never overwrites.
- Reversal for an absent predecessor parks outside totals. Predecessor arrival releases it atomically in source order; exclusion, reconciliation and correction remain additive.
- Declared import requires checksum-bound preview, explicit holder confirmation and visible overlap disposition. Declared evidence never gains verified provenance through reconciliation.
- FX is a versioned projection over an unchanged native row. One rate/date/source applies to gross, deductions and net; unresolved FX blocks issuance but not ledger visibility.
- Issued statements capture one immutable event, reconciliation and FX version set. Correction supersedes the snapshot and verification page; it never mutates the issued artifact.
- Work linkage is a revocable read projection. Credit or permission loss degrades attribution without deleting income evidence.

## Expense and Tax-Readiness Invariants

- Receipt original stores before extraction. Proposed supplier/date/amount/category and confidence remain distinct from user-confirmed fields and preserve evidence regions.
- Tax packs are preparation evidence only: supported jurisdiction/year must have a qualified, versioned rule pack. Missing evidence or unsupported rules block issuance; no generic legal/tax advice substitutes.
- Withholding and reclaim store deduction, territory, deadline source and checklist. The platform neither submits claims nor asserts treaty eligibility.
- Financial PII, receipt bodies, tax identifiers and addresses stay in restricted schema/storage under purpose-bound privacy controls. Shared events carry opaque references and classified summaries only.

## Quote, Invoice and Dunning Invariants

- Quote drafts are mutable; send creates an immutable successor version and opaque non-enumerable recipient token. Expiry warns but does not rewrite acceptance facts.
- Invoice issuance validates fiscal fields and serializes `(issuer, series)` allocation in the same transaction as immutable issuance. Retry returns the same instrument.
- Correction uses linked credit note and, where policy permits, replacement invoice. Original number and contents remain available.
- Receivable state is append-only and confidence-bearing. `unknown` outranks stale `unpaid` for dunning safety.
- Dunning requires invoice opt-in, confident unpaid state, no exclusion and a short lease. Dispatch rechecks payment, delivery, PO and exclusion; any unknown/paid/excluded state cancels without send.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Mutations require acting-party authority, `Idempotency-Key`, expected version where mutable state exists, audit correlation and the cited rate limit; typed errors use the shared Shard 00 envelope.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/finance/income-events` | producer/source event/holder/native components/trust/time/key; signed source worker | `201 IncomeEventResponse`; event and ledger version | `403`, `409 EVENT_KEY_CONFLICT`, `422 COMPONENTS_UNBALANCED|SOURCE_UNTRUSTED`, `429` |
| `POST /internal/v1/finance/income-reversals` | original/source event/reason/native components/time/key; signed source worker | `201 IncomeReversalResponse`; applied or parked | `403`, `409 EVENT_KEY_CONFLICT`, `422 ORIGINAL_INVALID`, `429` |
| `POST /api/v1/finance/income-imports/preview` | file/manual rows/checksum/schema/key; holder/delegate | `201 IncomeImportPreviewResponse`; exact/possible overlaps and expiry | `403`, `422 FORMAT_UNSUPPORTED`, `429` |
| `POST /api/v1/finance/income-imports/{id}/commit` | preview checksum/row dispositions/expected version/key; holder | `201 IncomeImportCommitResponse`; declared rows/batch | `403`, `409 PREVIEW_STALE|OVERLAP_UNRESOLVED`, `428`, `429` |
| `GET /api/v1/finance/income-events/{id}/fx` | reporting currency/date policy/as-of; holder/delegate | `FxProjectionResponse`; native plus estimate/actual provenance or unresolved | `403`, `404`, `422 RATE_UNAVAILABLE`, `429` |
| `POST /api/v1/finance/statements` | holder/period/currency/policy/source versions/key; holder/delegate | `201 IssuedFinancialSnapshotResponse`; immutable artifact/verify URL | `403`, `409 DUPLICATE_UNRESOLVED|SOURCE_STALE`, `422 FX_UNRESOLVED|BLOCKING_EXCEPTION`, `429` |
| `PUT /api/v1/finance/income-events/{id}/work-link` | work/credit/source revision/expected version/key; earner authority | `IncomeWorkLinkResponse`; current attribution projection | `403`, `409 VERSION_CONFLICT`, `422 CREDIT_UNAVAILABLE`, `428`, `429` |
| `POST /api/v1/finance/expenses` | source/native amount/supplier/date/evidence/category confirmation/key; holder/delegate | `201 ExpenseEvidenceResponse`; original/proposal/confirmed state | `403`, `409 EVENT_KEY_CONFLICT`, `422 EVIDENCE_MISSING|CONFIRMATION_INVALID`, `429` |
| `POST /api/v1/finance/tax-packs` | jurisdiction/year/rule pack/source versions/key; holder/accountant mandate | `201 TaxPackResponse`; artifact/version/exceptions | `403`, `409 SOURCE_STALE`, `422 JURISDICTION_UNSUPPORTED|RULE_PACK_UNAVAILABLE|BLOCKING_EXCEPTION`, `429` |
| `PUT /api/v1/finance/withholding/{id}` | territory/deduction/deadline source/checklist/expected version/key; holder/delegate | `WithholdingPreparationResponse`; record and alerts | `403`, `409 VERSION_CONFLICT`, `422 ELIGIBILITY_ASSERTION_FORBIDDEN`, `428`, `429` |
| `POST /api/v1/finance/quotes` | supplier/lines/terms/currency/expiry/key; supplier authority | `201 QuoteVersionResponse`; sent version/recipient URL | `403`, `409 VERSION_CONFLICT`, `422 TERMS_INVALID`, `429` |
| `POST /api/v1/finance/invoices` | issuer/customer/fiscal fields/lines/dates/series/source terms/key; issuer authority | `201 InvoiceInstrumentResponse`; sequence/version | `403`, `409 SEQUENCE_CONFLICT`, `422 FISCAL_FIELD_MISSING`, `429` |
| `POST /api/v1/finance/invoices/{id}/credit-notes` | reason/lines/policy/expected version/key; issuer authority | `201 CreditNoteResponse`; linked immutable correction | `403`, `409 VERSION_CONFLICT`, `422 CORRECTION_POLICY_INVALID`, `428`, `429` |
| `POST /internal/v1/finance/receivables/{id}/events` | source state/confidence/time/key; signed provider/worker | `201 ReceivableEventResponse`; event/current projection | `403`, `409 EVENT_KEY_CONFLICT`, `422 STATE_INVALID`, `429` |
| `POST /internal/v1/finance/dunning/{invoiceId}/leases` | ladder/policy/source versions/key; dunning worker | `201 DunningLeaseResponse`; lease or safe refusal | `403`, `409 LEASE_EXISTS`, `422 PAID|PAYMENT_UNKNOWN|EXCLUDED|MECHANICAL_BLOCKER`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Income event/reversal | Income event `received -> applied|excluded`; reversal `received -> applied|parked`; `parked -> applied|rejected` | Trusted unique source event appends native components; missing predecessor parks reversal until atomic source-order release. Conflicting event-key reuse returns `409 EVENT_KEY_CONFLICT`; no row overwrites. |
| Income import preview/batch | Preview `active -> committed|expired|stale`; row `declared -> accepted|quarantined|discarded` | Checksum-bound explicit overlap dispositions consume the exact preview once. Declared rows retain declared provenance permanently and unresolved overlap blocks commit. |
| Issued statement | `issued -> superseded` | Corrected event/reconciliation/FX version set creates a successor snapshot and verification page. Issued artifacts remain immutable and unresolved FX/exception blocks a new issuance. |
| Work linkage | `active -> degraded|revoked|superseded`; `degraded -> active|revoked|superseded` | Credit/permission/source revision controls read attribution only. Loss degrades or revokes projection without deleting income evidence. |
| Expense evidence | `original_stored -> proposed|awaiting_confirmation`; `proposed -> confirmed|rejected|corrected`; `confirmed -> corrected` | Extraction preserves original and evidence regions; explicit authorized review confirms fields. Proposal confidence never becomes confirmation automatically. |
| Tax pack | `rendering -> issued|blocked|failed`; `issued -> superseded`; `blocked|failed -> rendering` | Supported jurisdiction/year, qualified rule pack and complete evidence permit immutable issuance. Missing/unsupported evidence blocks and no state implies filing or advice. |
| Quote/invoice | Quote `draft -> sent -> accepted|rejected|expired|superseded`; invoice `issuing -> issued|failed`; `issued -> credited|superseded` | Send/issuance creates immutable version and serializes invoice sequence once. Correction appends linked credit note/replacement; original number/content remain. |
| Receivable | `unknown -> unpaid|paid|disputed`; `unpaid -> paid|unknown|disputed`; `disputed -> paid|unpaid|unknown` | Append-only confident source events derive projection; `unknown` outranks stale unpaid for safety. No state is rewritten, only superseded by newer evidence. |
| Dunning lease | `active -> dispatched|cancelled|expired`; `dispatched -> completed|failed` | Short lease rechecks payment, delivery, PO, exclusion and confidence immediately before send. Paid, unknown, excluded or mechanically blocked state cancels without dispatch. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; overwrite of financial evidence or advice/eligibility assertion returns `409 FINANCE_INVARIANT_VIOLATION`.

## Persistence, RLS and Workers

- Restricted tables hold income events/reversals/imports, FX projections, snapshots, expense evidence, tax packs, withholding, quote/invoice instruments, receivable events and dunning decisions; every projection pins source and policy version.
- RLS requires holder, scoped delegate/accountant or issuer mandate. Public verification/recipient routes resolve opaque expiring token to a redacted immutable projection and cannot enumerate identifiers.
- Ingestion, parked-reversal release, FX, statement, extraction, alert, invoice-sequence, receivable and dunning workers/events use transactional outbox and consumer idempotency. Provider timeout remains explicit `unknown_reconciling`.
- Endpoint rate limits separate signed-source throughput from holder actions; public tokens use stricter IP/token buckets and generic not-found responses.

## Failure, Deepening and Ambiguity Gate

Tests cover conflicting duplicate, orphan reversal, stale preview, provenance promotion, mixed FX, unresolved statement, revoked work credit, failed extraction, unsupported tax pack, eligibility advice, invoice retry/sequence race, credit-note overwrite, unknown-payment dunning and exclusion race. Seven passes converge; two implementers receive identical income, tax-readiness and receivables behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Income, tax-readiness and receivables contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
- [[specs/ia/deep-dives/41-career-finance|Deep Dive 41 — Career finance and business operations]]
- [[specs/be/18a-society-affiliation-registration|Society affiliation and registration — Backend Specification]]
- [[specs/be/31c-settlement-finality-restatement-export|Settlement finality, restatement and export — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
- [[specs/ia/deep-dives/41-career-finance|Deep Dive 41 — Career finance and business operations]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/18a-society-affiliation-registration|Society affiliation, registration projection and delivery — Backend Specification]]
- [[specs/be/31c-settlement-finality-restatement-export|Live settlement signatures, finality, restatement and export — Backend Specification]]
