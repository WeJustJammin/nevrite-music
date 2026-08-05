# External exam evidence and platform credential exclusion — Backend Specification

**Status:** Complete; exam-board registry disabled  
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

- **Shard split:** 3 of 4; EDU-CI-11, EDU-CI-12 and EDU-CI-15.
- **Boundary:** future version-pinned external exam goals/results and permanent exclusion of platform-issued completion credentials, badges, grades and trust marks.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 16 IA/deep dive | exam-board/evidence algorithm and prohibited credential paths |
| Shards 02, 03 and 15 | evidence projection, CMS registry and education-completion separation |

## Evidence and Exclusion Invariants

- US consumer launch has no exam-board surface or active registry route. Future support is additive per board and syllabus version.
- Goal pins board, instrument, grade, territory and syllabus version plus external session/deadline. Boards and grades are never normalized to a common level or synthetic percentage.
- Requirement mapping references repertoire; it does not host unlicensed syllabus material. Deadline tracking never claims external entry succeeded.
- Result is self-reported or third-party evidenced with issuer, provenance, verification and consent state. Shard 02 owns any approved display projection.
- WeJammin never issues a skill certificate, completion badge, grade, score, public rank or trust mark. Course completion and lesson participation cannot enter credential blocks.
- CMS cannot manufacture credential authority: approved content-type/block registry excludes certificate templates and credential issuance semantics.
- Credential exclusion has no admin, academy, setting or feature-flag bypass. Unsupported requests create no artifact, event or projection row.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Disabled routes reject before mutation or external effect.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/exam-goals` | board/instrument/grade/syllabus/session/deadline; future teacher/student/key | no success while registry disabled | `403 CAPABILITY_DISABLED`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/exam-goals/{id}/results` | outcome/issuer/provenance/evidence refs/consent; authorized future actor/key | no success while registry disabled | `403 CAPABILITY_DISABLED`, `409`, `422`, `429` |
| `POST /internal/v1/exam-results/{id}/project-evidence` | result/source/consent versions/event; worker/key | no success while registry disabled | `403 CAPABILITY_DISABLED`, `409 EVENT_REUSED`, `429` |
| `POST /api/v1/education-credentials` | any completion/participation/certificate/badge request; authenticated actor/key | no artifact created | `422 PLATFORM_CREDENTIAL_UNSUPPORTED`, `429` |
| `POST /api/v1/cms/content-types/credential-authority` | any certificate/badge/grade schema; administrator/key | no schema created | `422 CONTENT_TYPE_PROHIBITED`, `429` |

## Persistence, RLS and Workers

- Future-only `exam_board`, `syllabus_version`, `exam_requirement`, `exam_goal` and `exam_result_evidence` tables are migration-defined but inaccessible while capability is disabled; no launch seed enables a board.
- Board/grade identifiers remain source-specific. No normalized-level column, credential aggregate, certificate template or education-to-Shard-02 automatic join exists.
- RLS denies all exam rows while disabled; future access is learner/current teacher scoped with consented Shard 02 projection only.
- Router, database function and worker layers independently enforce the exam gate. Credential-exclusion endpoints always return typed unsupported response and emit abuse-safe audit only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Exam-board capability | launch terminal state `disabled`; future change requires explicit evolved board/syllabus capability, migration and policy approval | No ordinary route/admin/setting/academy action can transition. Disabled state rejects before row, artifact, event or external effect. |
| Future exam goal | future-only `draft → active → submitted_externally|expired|cancelled`; unavailable while capability is disabled | Future exact board/syllabus/session/deadline and authorized actor would trigger. Deadline never means external entry succeeded. |
| Future exam result evidence | future-only immutable `self_reported|third_party_evidenced`; consented projection `pending → approved|rejected|revoked` under Shard 02 | Future issuer/provenance/evidence/consent would trigger. No cross-board normalization or automatic verification. |
| Platform credential request | terminal `unsupported` with no persisted domain artifact | Any certificate/badge/grade/completion request returns typed unsupported. CMS/admin/academy/feature flag cannot create a transition or projection. |

Every unlisted transition returns capability-disabled or platform-credential-unsupported before mutation. Audit is abuse-safe and carries no unsupported artifact semantics.

## Failure, Deepening and Ambiguity Gate

Tests cover hidden launch route, admin gate bypass, cross-board normalization, deadline-as-entry, self-report-as-verified, completion-to-credential projection, CMS certificate template, academy-issued platform badge and event emission on unsupported request. Seven passes converge; two implementers receive identical disabled exam and credential-exclusion behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Exam evidence and credential exclusion contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses and institutions]]
- [[specs/be/02c-credentials-trader|Credentials and trader evidence — Backend Specification]]
- [[specs/be/03a-content-schema-registry|Content schema registry — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses, credentials, institutions and special practice]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader-status assessment — Backend Specification]]
- [[specs/be/03a-content-schema-registry|CMS content types, schema registry and migrations — Backend Specification]]
