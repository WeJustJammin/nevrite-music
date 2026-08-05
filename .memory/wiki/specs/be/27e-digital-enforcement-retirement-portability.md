# Digital enforcement, withdrawal, retirement and portability — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]  
**Deep Dive:** [[specs/ia/deep-dives/27-digital-catalog-delivery|Digital catalog delivery deep dive]]

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

- **Shard split:** 5 of 5; 27.20, 27.21, 27.22, 27.23 and 27.24.
- **Boundary:** platform-adjudicated vendor enforcement, continuity-preserving retirement, minimal-scope malicious/rights withdrawal and export-before-erasure.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 27 IA/deep dive | enforcement authority, emergency withdrawal, rights scoping, vendor continuity and erasure |
| Shards 05, 06 and 08 | retention settings, adjudication/appeal and portability evidence |

## Enforcement and Continuity Invariants

- Vendor may request serial/key enforcement with reason/evidence but cannot mutate entitlement directly. Platform independently adjudicates, notifies and offers appeal before effect except enumerated emergency safety policy.
- Blacklisting/enforcement is distinct from Shard 28 refund revocation. Licence key or activation state never substitutes for entitlement history.
- Vendor/product retirement stops new sales but preserves resolvable terms, owned-library state and required perpetual artifacts under the continuity manifest. Committed orders become owned or refunded, never paid-without-access.
- Emergency malicious withdrawal requires enumerated evidence and configured dual control above blast-radius threshold. New and in-flight unsafe delivery stops, partial transfers are marked unsafe and holders receive concrete next action.
- Rights-cause removal targets the smallest valid identified asset/container/version scope. Unaffected pack assets/versions remain; withdrawal is an append-only state, not deletion.
- Entitlement/acquisition and review evidence survives withdrawal. Every notice uses factual safety/legal reason class without accusatory language and exposes appeal/remediation state.
- Account erasure requires mandatory portable entitlement/library export first. Eligible personal context is erased/anonymized while perpetual contractual records survive under lawful pseudonymous retention.
- Vendor never receives holder identity, buyer-library data, derivatives or watermark mapping through enforcement or retirement workflows.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-enforcement/requests` | entitlement-or-key/reason/evidence/expected product version/key; vendor principal | `201 DigitalEnforcementRequestResponse`; pending case/deadline | `403 PRINCIPAL_REQUIRED`, `409 REQUEST_EXISTS`, `422 EVIDENCE_REQUIRED`, `429` |
| `POST /api/v1/digital-enforcement/requests/{id}/decisions` | action/reason/evidence/expected case version/key; independent adjudicator | `DigitalEnforcementDecisionResponse`; notified/effective-or-pending-appeal | `403 RECUSAL_REQUIRED`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/digital-enforcement/requests/{id}/appeals` | challenged decision/reason/evidence/key; affected holder | `201 DigitalEnforcementAppealResponse`; protected appeal/deadline | `403`, `409 APPEAL_EXISTS`, `422`, `429` |
| `POST /api/v1/digital-vendors/{id}/retirements` | products/continuity manifest/effective time/expected versions/key; vendor principal | `201 DigitalVendorRetirementResponse`; validation/gaps/scheduled state | `403`, `409 COMMITTED_ORDER_CONFLICT|VERSION_CONFLICT`, `422 CONTINUITY_INCOMPLETE`, `429` |
| `POST /api/v1/digital-artifacts/{id}/withdrawals` | reason class/scope/safety-or-legal evidence/expected versions/key; authorized safety/legal actor | `201 DigitalArtifactWithdrawalResponse`; minimal scope/transfer behavior/notices | `403`, `409 VERSION_CONFLICT`, `422 SCOPE_INVALID|DUAL_CONTROL_REQUIRED`, `428`, `429` |
| `POST /internal/v1/digital-artifacts/{id}/emergency-stops` | malicious evidence/policy/blast radius/dual approvals/event key; emergency worker | `DigitalArtifactWithdrawalResponse`; stopped transfers/unsafe partials | `403`, `409 EVENT_REUSED`, `422 EVIDENCE_INSUFFICIENT`, `429` |
| `POST /api/v1/digital-portability/exports` | controlled holder/scope/format/key; data subject | `202 DigitalPortabilityExportResponse`; mandatory entitlement/library export | `403`, `409 EXPORT_IN_PROGRESS`, `422`, `429` |
| `POST /api/v1/digital-portability/erasures` | holder/completed export/retention acknowledgement/key; data subject | `202 DigitalErasureResponse`; eligible erasure/pseudonymous retention manifest | `403`, `409 EXPORT_REQUIRED|LEGAL_HOLD`, `422`, `429` |

## Persistence, RLS and Workers

- Enforcement request/decision/appeal, retirement continuity manifest, artifact withdrawal/scope, holder notice, portability export and erasure/retention manifest rows pin actor, evidence, policy and source versions.
- RLS exposes enforcement cases to affected holder, requesting vendor only at request-safe scope and adjudicators; withdrawal evidence to scoped reviewers; portability artifacts only to the data subject through expiring grants.
- Emergency stop, notice, retirement, export and erasure workers are idempotent. Privacy/security withdrawal invalidates grants immediately; retries preserve acquisition evidence and never broaden removal scope.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Enforcement request | `pending → evidence_review → decision_pending → denied|effect_pending|effective`; effect-pending may pause for appeal; emergency policy may bypass pre-effect appeal only | Vendor request and independent conflict-screened adjudicator trigger. Vendor cannot mutate entitlement directly; key/activation never substitutes history. |
| Enforcement appeal | `open → reviewing → upheld|reversed|remanded|closed` | Affected holder evidence/deadline triggers. Decision/evidence remains append-only and holder is notified. |
| Vendor/product retirement | `draft → scheduled → effective|blocked|cancelled`; effective preserves continuity | Principal plus complete continuity manifest/committed-order resolution trigger. Orders become owned or refunded, never paid-without-access. |
| Artifact withdrawal | `proposed → active|blocked`; active `→ remediated|superseded`; emergency stop `active` requires enumerated evidence/dual control above threshold | Safety/legal actor and minimal valid scope trigger. Unsafe transfers stop, partials mark unsafe and unaffected assets/versions remain. |
| Portability export | `queued → building → ready|failed`; ready `→ expired|superseded` | Data-subject scope/format trigger. Export is mandatory before erasure and uses expiring grant. |
| Erasure | `blocked_export_required|blocked_legal_hold|queued → processing → completed|partial|failed` | Completed export/retention acknowledgment/lawful hold evaluation trigger. Eligible context erases/anonymizes while perpetual contractual evidence survives pseudonymously. |

Every unlisted transition returns the typed state/version/evidence conflict. Vendors never receive holder identity, library data, derivatives or watermark mappings.

## Failure, Deepening and Ambiguity Gate

Tests cover vendor direct blacklist, blacklist-as-refund, retirement artifact deletion, paid-without-access, single-actor mass emergency stop, whole-pack rights removal, acquisition evidence deletion, accusatory notice, vendor holder enumeration, erasure before export and perpetual record destruction. Seven passes converge; two implementers receive identical enforcement, retirement and portability behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Enforcement, retirement and portability contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog delivery]]
- [[specs/be/05c-portability-quality-lifecycle|Portability, quality and lifecycle — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/08a-portability-ddex-emission|Portability and DDEX emission — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/05c-portability-quality-lifecycle|Portability, quality gates and data lifecycle — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/08a-portability-ddex-emission|Credit portability and DDEX RIN emission — Backend Specification]]
