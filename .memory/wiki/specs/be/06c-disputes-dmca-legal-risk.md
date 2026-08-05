# Fraud review, transaction disputes, DMCA, identity abuse and legal process — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]  
**Deep Dive:** [[specs/ia/deep-dives/06-trust-safety|Safety deep dive]]  
**Authority:** [[specs/be/01c-relationships-authority-governance|Party authority]]

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

- **Shard split:** 3 of 3; TSE-02 and TSE-10 through TSE-15.
- **Boundary:** account protection, transaction disputes/settlements, DMCA notice/counter-notice/repeat-infringer handling, identity/ownership cases, personal-safety/crisis intake and verified legal process.
- **Approval:** Recommended split accepted under standing autonomy.

## Gated Domain Invariants

- Account-takeover response revokes sessions, requires step-up or holds recovery; it is protective and separately reviewable, not a sanction.
- Dispute filing freezes exact transaction/parties/mandates/remedy policy/deadline/evidence manifest. Contemporaneous evidence is retrieved, never reconstructed. Settlement is binding-party agreement, non-precedential and cannot create platform finding/protection payout.
- DMCA removal/strike requires complete identified US 512 notice/attestations. Strike unique unit is claimant+asset+infringement event; duplicates/incomplete notices cannot inflate. Counter-notice requires explicit disclosure consequences/signed statements; restoration clock starts only when complete/delivered.
- Identity/ownership resolution consumes Shard 01 party/alias/credit/membership/mandate truth; credential possession is not ownership and outcome cannot rewrite ownership records.
- Crisis resources flow bypasses classifier/enforcement ladder/SoR/appeal and never sanctions person in crisis. Emergency disclosure/24x7 promise/automation remains counsel-gated.
- Legal disclosure requires verified requester/instrument/jurisdiction/authority/scope/minimization/approval/prohibition state. V1 has documented intake only, no self-service portal or emergency guarantee.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/safety/dmca-notices` | identified claimant, asset, regime, required attestations/contact/signature; key | draft if incomplete; validated notice + case/capture intent if complete; no incomplete removal/strike | `409 DUPLICATE_NOTICE`, `422 NOTICE_INCOMPLETE`, `429`, `503` |
| `GET /api/v1/safety/dmca-notices/{id}/status` | claimant receipt or subject safe access | safe notice/removal/counter/restoration state/deadlines | `404`, `403`, `429`, `503` |
| `POST /api/v1/safety/dmca-notices/{id}/counter-notices` | subject identity/address/jurisdiction/signed 512(g) statements; ETag/key | complete counter + claimant delivery/restoration clock | `403`, `409 COUNTER_INCOMPLETE|STATE|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/safety/transaction-disputes` | transaction type/ID/version, claimant acting context, reason; key | case/dispute with frozen remedies/deadlines/evidence manifest | `403`, `404 TRANSACTION_NOT_FOUND`, `409 WINDOW_CLOSED|DISPUTE_EXISTS`, `422`, `429` |
| `POST /api/v1/safety/transaction-disputes/{id}/responses` | typed counterparty material; ETag/key | append-only response | `403`, `409 DEADLINE|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/safety/transaction-disputes/{id}/resolution-proposals` | exact terms/amount?/expiry; proposer mandate ETag/key | pending proposal/hash | `403 MANDATE_INVALID`, `409 REMEDY_NOT_ALLOWED|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/safety/resolution-proposals/{id}/accept` | binding party acceptance/mandate version; ETag/key | signed settlement when all required accept; non-precedential | `403`, `409 MANDATE_CHANGED|PROPOSAL_EXPIRED|VERSION`, `428`, `429` |
| `POST /api/v1/admin/safety/transaction-disputes/{id}/decide` | disclosed evidence weights/per-item remedy; specialist MFA, ETag/key | reasoned outcome + chargeback/internal reconciliation | `403`, `409 EVIDENCE_CHANGED|PROVIDER_STATE_CONFLICT|VERSION`, `422`, `428`, `429`, `503` |
| `POST /internal/v1/safety/account-protections` | account/action signal, source version, bounded protective actions; auth-risk principal | protection record + session revoke/step-up/recovery hold | `403`, `409 SOURCE_STALE`, `422 SANCTION_ACTION_FORBIDDEN`, `503` |
| identity/ownership case action | `/api/v1/admin/safety/identity-cases/{id}/decisions`; exact Shard 01 refs/versions | scoped access/claim correction without ownership mutation | `403`, `409 IDENTITY_TRUTH_CHANGED|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/safety/personal-safety-reports` | harassment/doxxing/meetup/crisis reason, target/evidence refs; key | protected lane case or resources-only completion | `409`, `422`, `429`, `503`; crisis never creates sanction by itself |
| `POST /api/v1/legal/requests` | documented requester/instrument/jurisdiction/scope/prohibition evidence; counsel gate | received draft/request case; no disclosure | `403 COUNSEL_GATE_DISABLED`, `422 REQUEST_INCOMPLETE`, `429` |
| `POST /api/v1/admin/legal/requests/{id}/decisions` | verify/narrow/refuse/disclose, minimization manifest, prohibition/user-notice state; counsel MFA/ETag/key | decision; disclose returns protected export job only | `403 STEP_UP_REQUIRED|DISCLOSURE_PROHIBITED`, `409 VERIFICATION_INCOMPLETE|VERSION`, `422`, `428`, `429` |

All routes use Shard 00 errors/no-store/idempotency/version/rates. DMCA 20/day claimant+IP with abuse review; disputes per transaction policy; protected/legal/admin 10/min and 100% access/decision audit.

## Persistence, RLS and Integration

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Account protection | `active → review_due → resolved|revoked|extended` | Auth-risk command/reviewer/current evidence triggers. Protection is not sanction; non-active record cannot block access, and extension requires fresh source. |
| Transaction dispute | `open → awaiting_response → negotiating|decision_pending`; negotiating `→ settled|decision_pending`; decision pending `→ resolved`; resolved `→ closed` | Filing/response/proposal/all-party acceptance/specialist decision triggers. Frozen remedy/mandate/evidence versions block stale action; provider ambiguity remains reconciling. |
| Resolution proposal | `pending → accepted|declined|expired|invalidated` | Required binding-party decisions/timer/mandate change triggers. Only all-required accepted creates settlement; terminal proposal cannot bind. |
| DMCA notice | `draft → validated → removed|rejected`; removed `→ countered → restoration_wait → restored|retained`; any terminal path `→ closed` | Completeness/reviewer/provider delivery/counter clock triggers. Incomplete/duplicate notice cannot remove or strike; undelivered counter cannot start restoration. |
| Repeat-infringer entry | `eligible → counted|excluded|reversed` | Unique complete notice event/current policy triggers. Duplicate/incomplete event never counts; reversal preserves history and adjusts current count. |
| Legal request | `received → verifying → narrowed|refused|approved`; approved `→ disclosing → completed|blocked|failed` | Counsel verification/minimization/prohibition decision/export job triggers. Gate disabled, unverified authority or prohibition blocks disclosure; completion requires exact manifest evidence. |

Every unlisted transition returns the named state/version conflict and preserves evidence, frozen remedies and disclosure audit.

| Table | Invariants |
|---|---|
| `safety.account_protections` | account/source/reasons/actions/review/state/version; separate from sanctions |
| `safety.transaction_disputes` | case/transaction/parties/mandates/remedy/deadlines/evidence/state/version |
| `safety.resolution_proposals` | proposer/terms/amount/expiry/acceptances/state/hash; exact mandates |
| `safety.dmca_notices` / `counter_notices` | claimant/asset/attestations/completeness/delivery/removal/restoration/hash |
| `safety.repeat_infringer_entries` | policy/subject/claimant/asset/event/notice/state/count time; unique strike unit |
| `safety.legal_requests` / `disclosure_decisions` | requester/instrument/jurisdiction/scope/prohibition/verification and minimization/release manifest |

Case participants receive minimum role projection; legal/DMCA identities/evidence are sealed. Finance/payment adapters reconcile provider chargeback to one canonical dispute without guessing. Disclosure exports list exact fields/blobs, expire and grant no search/database access. User notification occurs unless legally barred; prohibition review remains audited.

Events: dispute changed, DMCA changed, legal-disclosure decided. Payloads are IDs/versions/deadlines only.

## Failure, Deepening and Ambiguity Gate

- Provider/payment ambiguity remains pending/reconciling and never duplicates remedy. Undelivered DMCA notice cannot finalize termination. Overbroad/spoofed urgency never bypasses verification/counsel/manifest. Crisis input never becomes guilt signal.
- Tests cover filing windows/mandates/evidence freeze, settlement signatures, silence delivery rules, chargeback reconciliation, notice completeness/dedup/strike counts, counter disclosure/restoration/litigation hold, ATO protection-versus-sanction, identity truth preservation, crisis resources-only path, legal authenticity/minimization/prohibition/notification and RLS/non-enumeration.
- Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical dispute, DMCA, safety, identity and legal behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Disputes, DMCA and legal-risk contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/deep-dives/06-trust-safety|Deep Dive 06 — Trust, safety, disputes and evidence]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
