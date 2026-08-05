# Career planning, insurance and sustainability boundaries — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]  
**Deep Dive:** None; the IA complexity gate converged below the deep-dive threshold.

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

- **Shard split:** Single contract; 42.01, 42.02, 42.03, 42.04, 42.05, 42.06, 42.07, 42.08 and 42.09. The IA complexity gate explicitly passes without decomposition.
- **Boundary:** queryable goals, source-derived milestones, B2-gated peer distributions, possible insurance-gap observations/referrals and a permanent no-wellbeing-inference boundary.
- **Approval:** Single-document recommendation accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 42 IA | all goal, milestone, cohort, insurance and capability-refusal contracts; no deep dive required |
| Shards 40 and 41 | descriptive market evidence, verified income/runway and source-integrity states |
| Shards 00, 01, 05 and 06 | authority, privacy, B2 counsel gate, consent, audit and incident controls |

## Goal and Milestone Invariants

- Goal definition is composable predicate/query configuration, not fixed career archetype. It pins derivation query/version, cadence and visibility class; unavailable source disables with explanation.
- Progress derives from current canonical source revision and records integrity/freshness. Stale, incomplete or revoked evidence cannot become `achieved`; unknown remains explicit.
- Milestone derivation is unique by owner/fact/rule version and append-only. Source revocation appends visible invalidation and purges public cache; it does not erase historical private evidence.
- Share projection applies bounded approved wording and current authority. Financial and hard-private classes can never become public through user-selected visibility.

## Peer Distribution Invariants

- Peer distribution is unavailable until B2 counsel gate opens with approved cohort dimensions, minimum floor, privacy review and differencing controls.
- When enabled it is pull-only, purpose-bound and role/context constrained. Response includes distribution, n, subject position, freshness, method and caveats; no named peer, market-rate prescription, export or reusable cohort list.
- Below-floor, denied and no-data states return invariant suppressed shape. Repeated/overlapping queries cannot widen or difference hidden cohorts.

## Insurance and Sustainability Invariants

- Insurance observation names an underlying action, structured requirement, declared policy attributes, source and confidence. It may say `possible gap` only; it never interprets definitive coverage.
- Prompt is non-blocking and suppression is versioned. Decline or referral failure leaves booking, gear, finance and other source actions unchanged.
- Referral requires affirmative provider/path selection, current terms and field-level consent. Only the minimum package transmits; external state remains explicit and never implies underwriting, eligibility, premium or coverage decision.
- Wellbeing/sustainability score is permanently not offered in this architecture. Endpoint accepts no sensitive body, stores no health/wellbeing profile or inference, and routes to existing workload/runway facts only.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy classification and rate-limit controls; typed errors never reveal suppressed cohort or insurance facts.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/career/goals` | owner/entity/template/target query/version/cadence/visibility/key; owner authority | `201 GoalDefinitionResponse`; enabled or explained-disabled goal | `403`, `409 GOAL_EXISTS`, `422 QUERY_UNSUPPORTED|VISIBILITY_INVALID`, `429` |
| `GET /api/v1/career/goals/{id}/progress` | source/as-of; owner/entity authority | `GoalProgressResponse`; value/state/source revision/integrity/freshness | `403`, `404`, `409 SOURCE_STALE`, `429` |
| `POST /internal/v1/career/milestones/derive` | owner/fact/rule/source revision/class/wording/key; derivation worker | `201 DerivedMilestoneResponse`; milestone/version or idempotent existing | `403`, `409 EVENT_KEY_CONFLICT`, `422 SOURCE_INTEGRITY_INSUFFICIENT`, `429` |
| `POST /api/v1/career/milestones/{id}/shares` | scope/wording policy/expected version/key; owner/entity authority | `201 MilestoneShareResponse`; bounded projection/URL | `403`, `409 VERSION_CONFLICT`, `422 CLASS_NOT_SHAREABLE|WORDING_INVALID`, `428`, `429` |
| `POST /api/v1/career/peer-distributions` | role/stage/shape/context/policy version/key; subject authority; B2 admitted | `PeerDistributionResponse`; distribution/n/position/caveats or invariant suppressed | `403 B2_DISABLED`, `409 POLICY_STALE`, `422 BELOW_PRIVACY_FLOOR|DIFFERENCING_RISK`, `429` |
| `POST /internal/v1/career/insurance-needs` | owner/action/requirement/declared policy/source/confidence/suppression key; trusted source worker | `201 InsuranceNeedObservationResponse`; possible-gap/unknown/suppressed | `403`, `409 EVENT_KEY_CONFLICT`, `422 COVERAGE_VERDICT_FORBIDDEN`, `429` |
| `POST /api/v1/career/insurance-referrals` | need/provider/consented fields/terms version/key; owner | `201 InsuranceReferralResponse`; external pending/status reference | `403`, `409 CONSENT_STALE`, `422 PROVIDER_UNAVAILABLE|FIELD_NOT_CONSENTED`, `429` |
| `POST /internal/v1/career/insurance-referrals/{id}/responses` | provider reference/outcome/time/key; signed provider/operations actor | `201 InsuranceReferralStatusResponse`; explicit provider/unknown state | `403`, `409 EVENT_KEY_CONFLICT`, `422 UNDERWRITING_CLAIM_FORBIDDEN`, `429` |
| `POST /api/v1/career/wellbeing-score` | no request body; any authenticated context | `CapabilityNotOfferedResponse`; stable explanation and runway/workload routes | `403`, `422 SENSITIVE_INPUT_FORBIDDEN`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Goal definition | `enabled -> disabled|retired`; `disabled -> enabled|retired`; `enabled|disabled -> superseded` | Source availability and supported query determine enabled state with explanation; versioned owner update creates successor. Disabled/retired goals cannot emit achieved progress. |
| Goal progress | `unknown -> in_progress|achieved`; `in_progress -> achieved|stale|unknown`; `achieved -> stale|invalidated`; `stale|invalidated -> superseded` | Current canonical source integrity/freshness derives state. Stale, incomplete or revoked evidence never becomes achieved; recomputation appends successor. |
| Derived milestone | `derived -> invalidated|superseded`; `invalidated -> superseded` | Unique owner/fact/rule event appends milestone; source revocation appends visible invalidation and purges public cache. Historical private evidence remains. |
| Milestone share | `active -> expired|revoked|degraded`; `degraded -> superseded|revoked` | Current authority, shareable class and approved wording create bounded projection. Financial/hard-private class blocks; source invalidation degrades and removes public cache. |
| Peer distribution | `evaluating -> available|suppressed|blocked`; `available -> stale|revoked` | B2 gate, purpose, approved dimensions, privacy floor and differencing controls permit pull-only response. Below-floor/denied/no-data return invariant suppressed shape and never widen. |
| Insurance need observation | `unknown -> possible_gap|suppressed`; `possible_gap -> superseded|suppressed`; `suppressed -> superseded` | Trusted structured source/confidence may describe only possible gap; suppression is versioned. No state asserts coverage, underwriting or eligibility. |
| Insurance referral | `pending -> submitted|failed|withdrawn`; `submitted -> provider_pending|unknown|resolved`; `provider_pending|unknown -> resolved|failed` | Affirmative provider selection, current terms and field-level consent send only minimum package. External outcome remains explicit and never affects source booking/gear/finance action. |
| Wellbeing score capability | `not_offered` is permanent | Endpoint accepts no body and always returns stable explanation/routes. Sensitive input returns `422 SENSITIVE_INPUT_FORBIDDEN`; no profile, inference or alternate state exists. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; sensitive inference, cohort enumeration or definitive insurance claim returns `409 CAREER_POLICY_VIOLATION`.

## Persistence, RLS and Workers

- Goal definitions/progress, milestone events/shares/invalidations, insurance needs/suppressions/referrals and provider status persist with source/policy versions. Cohort membership is ephemeral; no wellbeing table exists.
- RLS restricts owner/entity goals and milestones by mandate, insurance rows by explicit purpose, and B2 responses to the requesting subject. Public milestone projection contains approved wording only.
- Progress, milestone derivation/invalidation, public-cache purge, insurance trigger and provider reconciliation workers/events are idempotent and transactional. Consent and authority recheck at dispatch/read time.
- Privacy-safe generic denials and capped query budgets prevent peer, milestone and referral enumeration; rate limits include overlapping-cohort detection.

## Failure, Deepening and Ambiguity Gate

Tests cover unsupported goal source, stale-achieved progress, duplicate milestone, revoked public milestone, financial share, B2-closed access, below-floor differencing, definitive insurance verdict, repeated prompt after suppression, referral without field consent, provider timeout interpreted as denial, source-action blocking and wellbeing payload storage. Seven passes converge; two implementers receive identical career planning and risk behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Career planning, insurance and sustainability-boundary contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]
- [[specs/be/40-market-intelligence-signals|Market intelligence, fraud and scouting signals — Backend Specification]]
- [[specs/be/41a-income-tax-receivables|Income, tax readiness and receivables — Backend Specification]]
- [[specs/be/41b-deals-recoupment-pl|Deals, recoupment, runway and closing — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/40-market-intelligence-signals|Market intelligence, fraud and scouting signals — Backend Specification]]
- [[specs/be/41a-income-tax-receivables|Income, tax readiness and receivables — Backend Specification]]
- [[specs/be/41b-deals-recoupment-pl|Deals, recoupment, runway and closing — Backend Specification]]
