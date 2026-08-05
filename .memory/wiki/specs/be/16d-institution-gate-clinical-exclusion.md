# Institution evolution gate and clinical-purpose exclusion — Backend Specification

**Status:** Complete; institutions disabled; clinical purpose prohibited  
**IA Source:** [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]  
**Deep Dive:** [[specs/ia/deep-dives/16-education-credentials-institutions|Course and institution deep dive]]

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

- **Shard split:** 4 of 4; EDU-CI-13, EDU-CI-14 and EDU-CI-16.
- **Boundary:** hard post-consumer academy-operation gate and pre-persistence exclusion/quarantine of therapy, clinical, health-outcome, insurance and PHI-purpose data.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 16 IA/deep dive | institution evolution gate and prohibited clinical paths |
| Shards 01, 03, 06 and 15 | organization mandate, governed settings, protected review and ordinary non-clinical tuition |

## Gate and Prohibited-Data Invariants

- Multi-teacher academy operations are deferred until consumer readiness and explicit `/evolve-feature`; no consumer route, migration seed, setting or entitlement depends on them.
- Institution state is `disabled|design_only|enabled`; launch is `disabled`, and ordinary configuration/admin cannot transition it.
- Future authority comes from Shard 01 organization mandate, never domain name, email domain, login provider, enterprise SSO or platform-admin role.
- Teacher roster mandate never transfers personal identity. Future join/leave must preserve academy student/credit continuity while isolating private practice and personal profile data.
- Future closure freezes new sales/credits, computes liability and routes to counsel-approved insolvency/refund handling; platform never promises escrow.
- Therapy client/case/note, diagnosis, treatment goal, clinical outcome, insurance-purpose and PHI schemas are prohibited from the product estate.
- Strict structured schemas reject clinical fields before persistence. Likely clinical purpose hidden in free text/upload is quarantined for limited protected review; raw content never enters logs or analytics.
- Ordinary non-clinical tuition is routed to Shard 15 only after prohibited-purpose validation. No reviewer/admin can convert quarantined clinical content into an education record.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Disabled institution routes reject before database/provider effect; clinical payload logs contain classification code and digest only.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/academy-education/configurations` | organization/mandate/terms/rates/rooms/liability policy; future principal/key | no success while disabled | `403 INSTITUTION_GATE_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/academy-education/{id}/roster-mandates` | teacher/capabilities/effective interval/evidence; future principal+teacher/key | no success while disabled | `403 INSTITUTION_GATE_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/academy-education/{id}/roster-exits` | mandate/continuity/liability versions; future parties/key | no success while disabled | `403 INSTITUTION_GATE_DISABLED`, `409`, `422`, `429` |
| `POST /internal/v1/academy-education/{id}/close` | closure/liability/counsel-policy versions; future worker/key | no success while disabled | `403 INSTITUTION_GATE_DISABLED`, `409`, `429` |
| `POST /api/v1/education-purpose-preflights` | typed purpose/fields/text digests/upload metadata; authenticated actor/key | `PurposePreflightResponse`; ordinary/prohibited/quarantined | `403`, `422 CLINICAL_PURPOSE_FORBIDDEN`, `429` |
| `POST /internal/v1/education-purpose/{id}/classify-upload` | private object/digest/purpose policy/event; DLP worker/key | `PurposeClassificationResponse`; allowed/quarantined/rejected | `403`, `409 EVENT_REUSED`, `422`, `429`, `503` |
| `POST /api/v1/education-purpose/{id}/route-tuition` | allowed preflight hash and Shard 15 request; actor/key | `202 TuitionRouteResponse`; downstream command ID | `403`, `409 PREFLIGHT_STALE`, `422 CLINICAL_PURPOSE_FORBIDDEN`, `429`, `503` |

## Persistence, RLS and Workers

- Future `academy_education_config`, `academy_roster_mandate` and `academy_credit_liability` tables are inaccessible while gate is disabled. No enterprise SSO or admin role appears in their authority predicates.
- `education_purpose_preflight` stores actor, policy version, field-name set, content digest, classification and short expiry; it never stores rejected clinical text.
- Quarantined uploads remain encrypted private objects with assignment-only reviewer access, bounded retention and no general education/catalog/analytics projection.
- RLS denies institution tables at launch; purpose decisions are actor plus assigned-reviewer scoped. Audit stores codes/digests, never therapy content or PHI.
- Router, database function, worker and setting registry independently enforce institution disablement. Classifier outage fails closed to quarantine; retry is `2s/8s/32s` then assigned review.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Institution capability | `disabled → design_only → enabled` only through explicit `/evolve-feature` plus complete authority/liability/safeguarding approval; launch remains disabled | Ordinary configuration/admin/SSO/domain/feature flag cannot transition. Disabled rejects before database/provider effect. |
| Future academy configuration | future `draft → active → closing → closed`; active may be suspended; unavailable while institution gate disabled | Future Shard 01 mandate and approved terms/liability policies would trigger. Closure freezes sales/credits and routes liability without escrow promise. |
| Future roster mandate | future `proposed → active → revoked|expired|superseded`; unavailable while gate disabled | Future principal and teacher consent/authority would trigger. It never transfers personal identity or private practice data. |
| Education purpose preflight | `pending → ordinary|prohibited|quarantined|expired` | Strict field validation/content digest policy triggers. Prohibited raw text is not persisted; classifier outage/uncertain free text fails closed to quarantine. |
| Quarantined upload | `quarantined → allowed|rejected|expired`; allowed may dispatch one tuition route | Assigned protected review/current policy triggers. Reviewer cannot convert clinical content into education; rejected/expired object never projects. |
| Tuition route command | `pending → dispatched → completed|failed|unknown` | Current ordinary preflight hash and Shard 15 request trigger. Stale/prohibited/quarantined classification blocks with no fallback. |

Every unlisted transition returns the typed state/version/gate conflict. Logs/audit retain codes and digests only, never therapy content or PHI.

## Failure, Deepening and Ambiguity Gate

Tests cover admin/SSO/domain authority, launch dependency, hidden academy activation, identity capture on roster, escrow promise, structured therapy field, PHI in free text/upload, logging leakage, analytics projection, reviewer conversion and classifier outage. Seven passes converge; two implementers receive identical institution-gate and clinical-exclusion behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Institution and clinical exclusion contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses and institutions]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/15a-teacher-facets-discovery-trials|Teacher tuition facets, discovery and trials — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses, credentials, institutions and special practice]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/15a-teacher-facets-discovery-trials|Teacher tuition facets, discovery and trials — Backend Specification]]
