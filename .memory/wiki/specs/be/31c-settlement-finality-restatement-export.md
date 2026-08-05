# Live settlement signatures, finality, restatement and export — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]  
**Deep Dive:** [[specs/ia/deep-dives/31-live-settlement-intelligence|Live settlement intelligence deep dive]]

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

- **Shard split:** 3 of 5; 31.10, 31.11, 31.12 and 31.13.
- **Boundary:** exact-hash signatures, run-aware finality, append-only correction/restatement and privacy-safe structured/accessibile export.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 31 IA/deep dive | signature outcomes, finality, objective correction and export privacy |
| Shards 01, 06 and 18 | binding authority, disputes/legal hold and statement restatement patterns |

## Finality and Restatement Invariants

- Signature appends `agreed|under_protest` against exact sheet hash with binding proof. Owning side must explain adverse variance; authority loss invalidates unsigned intent, never prior signature.
- Finality requires both sides signed same version and run policy satisfied. Open run remains provisional until run close; unresolved lines preserve payable floor/ceiling.
- Restatement cites superseded version plus objective or authorized cause, evidence and complete derived fan-out to commission, split obligation, draw, reliability and guidance.
- Eligible party requests obey correction window; later objective facts are retained even when party-request window closed. Legal hold blocks destruction, not factual append.
- Prior signed/final versions never mutate or silently recompute. Administrative correction is append-only with reason and configured dual control.
- Export includes structured data, manifest and accessible tagged PDF/HTML parity for authorized party, but excludes other side's private trail and downstream private fan-out rows.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/live-settlement-versions/{id}/signatures` | outcome/hash/variance explanations/bind proof/key; side binding actor | `201 SettlementSignatureResponse`; signed/finality projection | `403 AUTHORITY_REQUIRED`, `409 VERSION_STALE`, `422 EXPLANATION_REQUIRED`, `429` |
| `POST /internal/v1/live-settlements/{id}/finalizations` | signed version/run policy+state/event key; finality worker | `SettlementFinalityResponse`; provisional/final/floor/ceiling | `403`, `409 EVENT_REUSED|SIGNATURE_MISMATCH|RUN_OPEN`, `429` |
| `POST /api/v1/live-settlements/{id}/restatements` | causal fact/affected version/reason/evidence/key; eligible party or authorized fact source | `201 SettlementRestatementResponse`; successor/fan-out | `403`, `409 IDEMPOTENCY_CONFLICT|LEGAL_HOLD_CONFLICT`, `422 CAUSE_UNSUPPORTED`, `429` |
| `GET /api/v1/live-settlements/{id}/exports` | version/format; authorized settlement party | `SettlementExportResponse`; structured export/manifest/accessible artifacts | `403`, `404`, `429` |

## Persistence, RLS and Workers

- Signature/authority refs, finality state, restatement cause/evidence/fan-out and export manifest/artifacts pin exact hashes and source versions.
- RLS exposes signatures/shared finality to both sides, side-private trail only to that side, and exports through expiring purpose grants. Pseudonymization cannot delete economic document content required for integrity/legal hold.
- Finality, restatement fan-out and export workers are idempotent. Consumers never receive a stronger finality than the referenced event.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Settlement signature | immutable `agreed|under_protest`; unsigned intent `pending → invalidated` on authority loss | Binding actor/exact sheet hash/adverse-variance explanation trigger. Prior signature survives later authority loss. |
| Settlement finality | `unsigned → one_side_signed → both_signed → provisional|final`; provisional `→ final|superseded`; unresolved lines retain floor/ceiling | Matching signatures and run policy/close trigger. Mismatched version/open run blocks final. |
| Settlement restatement | `requested → validating → completed|blocked|rejected`; completed creates successor and fan-out | Objective/authorized cause/evidence/correction-window policy trigger. Late objective fact remains appendable; admin correction requires dual control. |
| Settlement export | `queued → building → ready|failed`; ready `→ expired|superseded` | Authorized version/format trigger. Structured manifest and HTML/PDF parity exclude other-side private trail/fan-out. |

Every unlisted transition returns the typed state/version/hash conflict. Prior signed/final versions never mutate and downstream finality cannot strengthen.

## Failure, Deepening and Ambiguity Gate

Tests cover hashless signature, unexplained adverse variance, mismatched-version finality, open-run finalization, silent recompute, late objective fact loss, destructive admin correction, missing fan-out and cross-side private export. Seven passes converge; two implementers receive identical settlement finality, restatement and export behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Settlement finality and export contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Live settlement intelligence]]
- [[specs/be/06c-disputes-dmca-legal-risk|Disputes, DMCA and legal risk — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, restatement and statements — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Agency, settlement and live-market intelligence]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06c-disputes-dmca-legal-risk|Fraud review, transaction disputes, DMCA, identity abuse and legal process — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, recoupment, restatement and payee statements — Backend Specification]]
