# Safety policy, moderation decisions, enforcement and appeals — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]  
**Deep Dive:** [[specs/ia/deep-dives/06-trust-safety|Safety deep dive]]  
**Case Substrate:** [[specs/be/06a-case-intake-evidence|Case intake and evidence]]

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

- **Shard split:** 2 of 3; TSE-05 through TSE-07, TSE-09 and TSE-18.
- **Boundary:** immutable policy versions, advisory signals, narrow reversible decisions, concurrence controls, statements of reasons, appeals, transparency and domain-launch risk gates.
- **Approval:** Recommended split accepted under standing autonomy.

## Decision Invariants

- Published policy versions are immutable half-open UTC intervals; decision pins exact rule/locale/version. Evaluation proposes rule/severity/bounds/controls but cannot enforce.
- Decision requires evidence manifest, cited rule, finding distinct from allegation, rationale, narrow scope/consequence preview, conflict check and expected case/target/policy versions.
- Scope order is `object < feature < domain < account < entity`. Ownership, confirmed credits/splits and export rights cannot be sanctions. Entity effect blocks on unresolved responsible actor/mandate.
- S1 or rung>=6/indefinite with two+ moderators requires distinct-human concurrence. Solo path records cited rule/rationale/audit/review route/cooling-off reaffirmation; urgent S0/S1 omits delay only. AI cannot concur or appeal.
- Activation atomically commits decision/control/sanction/statement-of-reasons/audit/outbox. Failure of SoR/audit means no sanction. Appeal reviewer differs from original; reversal is item-specific compensation/correction, never deletion.
- Signals score action/object only, have reason/source/version/confidence/expiry and may prioritize review only. No durable person trust score, sanction, removal or notification permission.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| policy release sync/read | `POST /internal/v1/safety/policies/sync`; admin version reads | immutable rule versions/hash/interval/locale | `403`, `409 MANIFEST_CONFLICT`, `422 POLICY_INVALID`, `500` |
| `POST /internal/v1/safety/policy-evaluations` | case/target/reason/jurisdiction/current policy context | candidate rule/severity/bounds/control only | `403`, `409 POLICY_VERSION_INVALID`, `422`, `503` |
| `POST /api/v1/admin/safety/cases/{id}/decision-proposals` | finding/rule/evidence manifest/rationale/scope/consequence; lease, ETag/key | proposed decision/control requirements | `403`, `409 CASE_LEASE_LOST|POLICY_VERSION_INVALID|SCOPE_FORBIDDEN|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/admin/safety/decisions/{id}/controls` | concur/reaffirm/compensating-control evidence; distinct eligible human, MFA, ETag/key | satisfied/awaiting control state | `403 SELF_CONCURRENCE|STEP_UP_REQUIRED`, `409 CONTROL_REQUIRED|COOLING_OFF_ACTIVE|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/admin/safety/decisions/{id}/activate` | exact case/target/policy/control/SoR version set; ETag/key | active sanction/items/SoR or convergence job | `403`, `409 CONTROL_REQUIRED|TARGET_CHANGED|POLICY_VERSION_INVALID|ACTIVE_TUPLE_EXISTS|VERSION`, `428`, `429`, `503` |
| `GET /api/v1/safety/decisions/{id}/statement` | eligible subject/current party | safe immutable SoR/correction/appeal eligibility | `404`, `403`, `429`, `503` |
| `POST /api/v1/safety/appeals` | decision ID, item IDs, typed grounds/supplement refs; subject key | `201` appeal; original decider excluded | `403 APPEAL_FORBIDDEN`, `409 APPEAL_EXISTS|WINDOW_CLOSED`, `422`, `429` |
| `POST /api/v1/admin/safety/appeals/{id}/decisions` | per-item uphold/reverse/modify + rule/rationale; independent reviewer MFA, ETag/key | result + compensation/correction jobs | `403 ORIGINAL_DECIDER|STEP_UP_REQUIRED`, `409 EVIDENCE_CHANGED|VERSION`, `422`, `428`, `429` |
| `POST /internal/v1/safety/risk-signals` | action/object/reasons/source/version/confidence?/expiry; registered producer key | advisory signal/event only | `403`, `409 SOURCE_VERSION_CONFLICT`, `422 PERSON_SCORE_FORBIDDEN`, `429` |
| `POST /api/v1/admin/safety/risk-signals/{id}/dispositions` | ignore/monitor/open_case/link_case; reviewer ETag/key | explicit disposition, never finding | `403`, `409 EXPIRED|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/admin/safety/domain-risk-assessments` | domain/release/harms/controls/gaps/evidence/disposition; owner key | review-gated assessment | `403`, `409 RELEASE_ALREADY_GATED`, `422`, `429` |
| assessment decision | `/domain-risk-assessments/{id}/decision`; distinct approver MFA/version | approved/blocked launch gate consumed by Shard 05 | `403 SELF_APPROVAL`, `409 GAPS_UNRESOLVED|VERSION`, `428`, `429` |

All admin routes are no-store, strict, versioned/idempotent and inherit Shard 00 errors. Decisions/appeals 10/min; signals internal bounded; high-impact operations 100% traced/audited. Public status reveals no reporter/reviewer/detection/legal/evidence detail.

## Persistence, Enforcement and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Policy version | `draft → active → superseded|retired` | Signed policy sync/effective interval triggers. Invalid manifest/overlap blocks active; active/superseded immutable. |
| Decision | `proposed → awaiting_controls|ready`; awaiting controls `→ ready|rejected|stale`; ready `→ active`; active `→ reversed|superseded|expired` | Proposal/concurrence/reaffirmation/activation/appeal triggers. Missing SoR/audit/control/current target-policy set blocks activation. |
| Decision control | `required → satisfied|rejected|expired|stale` | Eligible distinct human/cooling-off timer/version change triggers. Self-concurrence or stale authority cannot satisfy. |
| Enforcement item | `pending → applying → active|partial|failed`; active `→ reversed|expired|superseded` | Consumer convergence/current target version triggers. Partial remains visible; reversal uses compensating command and never deletes history. |
| Appeal | `open → reviewing → upheld|reversed|modified|withdrawn|expired` | Independent reviewer/subject withdrawal/window timer triggers. Original decider/evidence change blocks decision; terminal appeal rejects replay. |
| Risk signal | `active → expired|ignored|monitored|linked_to_case` | Timer/reviewer disposition triggers. Signal never becomes finding/sanction/person score; terminal signal cannot be reused. |
| Domain risk assessment | `draft → review → approved|blocked|stale` | Distinct approver/current release evidence triggers. Unresolved gaps/self-approval blocks approved; stale assessment cannot open launch gate. |

Every unlisted transition returns the typed state/version conflict and performs no sanction or launch-gate change.

| Table | Invariants |
|---|---|
| `safety.policy_rule_versions` / `acceptances` | immutable rulebook/key/version/locale/text+machine hash/effective interval/supersedes and append-only acceptance |
| `safety.case_decisions` / `decision_controls` | finding/rule/evidence/rationale/scope/proposer/state/version and exact control evidence/distinct reviewer |
| `safety.sanctions` / `enforcement_items` | subject/action/rung/scope/term/state/reversal/version; unique active tuple; no ownership mutation |
| `safety.statements_of_reasons` / `appeals` | immutable correction chain and independent per-item review/result |
| `safety.risk_signals` / `review_dispositions` | action/object reasons/source/version/confidence/expiry and explicit non-finding disposition |
| `safety.risk_assessments` | domain/release/harms/controls/gaps/evidence/approver/disposition/version |

Consumers apply each enforcement item idempotently against target version and report result. Partial convergence leaves decision active with visible task; reversal emits per-item compensating commands and SoR correction. RLS separates subject-safe notices, assigned reviewer records and service-item commands. Events: decision activated/reversed, signal recorded, risk assessment decided.

## Failure, Deepening and Ambiguity Gate

Classifier/matcher outage fails open to ordinary review; prohibited-item checkout and approved payout screening fail closed only when that gated domain enables them. Automatic CSAM path requires separate counsel gate, SoR representation, provider procedure and counsel/security approval; a flag alone cannot enable it.

Tests cover exact policy interval/version, allegation/finding separation, scope ladder, entity mandate ambiguity, distinct concurrence/solo/urgent controls, atomic SoR/audit, active tuple race, partial consumer compensation, independent appeals, advisory-only signal permissions/person-score rejection, launch gate and transparency non-leakage. Seven passes and ambiguity/devil checks converge; two implementers receive identical policy, sanction and appeal behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Policy and enforcement contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/deep-dives/06-trust-safety|Deep Dive 06 — Trust, safety, disputes and evidence]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
