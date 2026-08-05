# Project sessions, delivery, QC and readiness — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]  
**Deep Dive:** [[specs/ia/deep-dives/09-projects-collaboration|Project collaboration deep dive]]  
**Credit Capture:** [[specs/be/07b-session-capture-offline|Credit session capture]]

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

- **Shard split:** 4 of 5; PRJ-15 through PRJ-19. DAW/local-agent ingestion is owned by disabled contract 09e; v1 inputs are manual/project/session facts only.
- **Boundary:** confirmed sessions and attendance, close/capture arbitration, labelled recall archives, recipient-owned handoff specs, exact package manifests, objective QC/readiness debt and manual source declarations.
- **Approval:** Recommended split accepted under standing autonomy.

## Session and Delivery Invariants

- Suggested sessions require human confirmation; no one is auto-present. Exactly one owner derives from creating context while booking/order remain linked facts. Attendance is set-valued; fine timing is opt-in by the tracked person and remains separate from contribution.
- Human close or 12 hours inactivity commits before outbox asks. Resume within six hours reopens the session; close batches within ten minutes and reopen within 30 minutes re-arms changed work but never recalls dispatched asks.
- Tier-1 contributor asks issue independently and non-blockingly; at most one Producer heavyweight ask issues only with non-empty prefill. Silence/dismissal creates completeness debt, never refusal or failed session. Shard 07 owns credit asks; Shard 10 owns split asks.
- A package target must use an owned recipient-spec version. Canonical slots resolve once and pin exact versions; package includes only required assets/metadata. Oversending is a privacy failure.
- Integrity/checksum failure blocks. Alignment, naming, loudness and other narrow objective checks warn with exact consequence/action; unsupported checks are `unverifiable`, never passed. Readiness is an on-demand target-specific ordered debt list, not a global score or nag.
- Source declarations are append-only asset/section facts `none|unknown|declared|not_reviewed`; removal returns to `not_reviewed`. They never mean clearance, rights ownership or automated detection.
- V1 packages state environment manifests, missing-media parsing and DAW observation unavailable. Recall/archive records are labelled facts and never claim reproducibility beyond captured evidence.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version/source-snapshot envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/project-sessions` | `CreateProjectSessionRequest`: song/project links, owner context, source refs, grade/sensitivity, start; authorized participant/key | `201 ProjectSessionResponse`; proposed/active version | `403`, `409 SESSION_CANDIDATE_CONFLICT`, `422`, `429` |
| `PUT /api/v1/project-sessions/{id}/attendance` | `AttendanceSetRequest`: subject assertions/timing consent/evidence refs; owner or subject ETag/key | `AttendanceSetResponse`; versioned set projection | `403`, `404`, `409 VERSION_CONFLICT`, `422 TIMING_CONSENT_REQUIRED`, `428`, `429` |
| `POST /api/v1/project-sessions/{id}/close` | `CloseProjectSessionRequest`: human or inactivity trigger/source watermark; owner/system key | `202 ProjectSessionCloseResponse`; closed version/batch/capture moment IDs | `403`, `409 SOURCE_STALE|ALREADY_CLOSED`, `422`, `429`, `503` |
| `POST /api/v1/project-sessions/{id}/reopen` | `ReopenProjectSessionRequest`: reason/source activity time; owner ETag/key | `ProjectSessionResponse`; reopened version/re-arm state | `403`, `409 REOPEN_WINDOW_CLOSED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/me/project-capture-asks` | state/session/cursor; recipient | `CaptureAskPage`; stable IDs/prefill/debt state | `404`, `422`, `429`, `503` |
| `POST /api/v1/project-capture-asks/{askId}/answers` | `CaptureAskAnswerRequest`: displayed payload hash, answer or dismiss; recipient/key | `201 CaptureAskAnswerResponse`; immutable answer/debt update | `403`, `404`, `409 PAYLOAD_STALE|ANSWER_EXISTS`, `422`, `429` |
| `POST /api/v1/project-sessions/{id}/recall-sheet-versions` | `RecallSheetRequest`: labelled track/channel/room facts and visibility; authorized participant/key | `201 RecallSheetVersionResponse`; immutable filtered version | `403`, `404`, `409 SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/recipient-specs` | owner domain/target/effective cursor; authorized builder | `RecipientSpecPage`; owned exact versions/check summaries | `403`, `422`, `429`, `503` |
| `POST /api/v1/handoff-packages/preflight` | `PackagePreflightRequest`: target/spec version and song/project scope; authorized builder/key | `PackagePreflightResponse`; exact canonical pins, blocking/warning/unverifiable gaps | `403`, `409 CANONICAL_UNSET|SOURCE_STALE`, `422 SPEC_UNAVAILABLE`, `429`, `503` |
| `POST /api/v1/handoff-packages` | `BuildPackageRequest`: preflight/pin hash, acknowledgment; builder/key | `202 HandoffPackageResponse`; immutable build request/version | `403`, `409 PREFLIGHT_STALE`, `422 INTEGRITY_FAILED`, `429`, `503` |
| `GET /api/v1/handoff-packages/{id}` | builder or exact package recipient | `HandoffPackageResponse`; state/manifest/checksum/validation/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/handoff-packages/{id}/downloads` | intended recipient/purpose/key | `201 ArtifactDownloadResponse`; exact expiring package grant/checksum | `403`, `404`, `409 PACKAGE_NOT_READY|PACKAGE_STALE`, `410`, `429` |
| `POST /api/v1/audio-qc-evaluations` | `QCEvaluationRequest`: source/package, check-set/version; authorized builder/key | `202 QCEvaluationResponse`; queued/live objective outcomes | `403`, `409 SOURCE_STALE`, `422 CHECK_SET_INVALID`, `429`, `503` |
| `POST /api/v1/qc-results/{id}/dismissals` | reason; project authority ETag/key | `QCResultResponse`; sticky same-project/check-version dismissal | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/readiness` | target/spec/song/project query; authorized viewer | `ReadinessProjectionResponse`; ordered blocking/warning/opaque/unverifiable gaps/freshness | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/assets/{assetId}/source-declarations` | `SourceDeclarationRequest`: section, state, kind, bounded details, supersedes; authorized contributor/key | `201 SourceDeclarationResponse`; append-only version/clearance event ref | `403`, `404`, `409 SOURCE_VERSION_CONFLICT`, `422`, `429` |

Session reads/writes are 120/min/person and close/reopen 10/min/session; asks 60/min/person; recall writes 30/hour/session; package preflight 30/min, builds 10/hour/project and downloads 30/min; QC/readiness 60/min/project; declarations 30/min/asset/person. Private responses/artifacts are no-store and grant-version bound.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `project.sessions` / `attendance_assertions` | owner/source/grade/sensitivity/times/state/version and subject/assertor/set state/timing consent/evidence/version |
| `project.capture_moments` / `capture_asks` | close event/batch/tier budget/state and payload owner/hash/dispatch/answer/debt; stable unique batch/recipient/tier |
| `project.environment_archives` / `recall_sheet_versions` | label/assets/manifest availability and filtered track/channel/room facts/version |
| `project.recipient_spec_versions` | owner domain/key/version/required slots/assets/metadata/objective checks/effective state |
| `project.handoff_packages` / `package_manifest_items` | source/spec/pin hash/exact minimal manifest/validation/private artifact/checksum/state/version |
| `project.qc_results` / `readiness_projections` | source/check/spec versions/outcome/measurement/consequence/dismissal/unverifiable reason and viewer-scope hash |
| `project.source_declarations` | asset/section/state/kind/details/author/time/supersession/clearance ref; append-only |

RLS grants sessions to overlapping authorized parties, limits Operator projection to headcount/contact and excludes music/names/prompt state, and grants package recipients only the exact sealed manifest. Close RPC commits session/batch/outbox atomically. Prompt workers issue independent tiered asks with stable IDs. Package workers revalidate source authorization, resolve pins once, include exact required items, checksum/seal private artifacts and quarantine partial blobs. QC workers execute only code-owned objective check versions; hidden dependencies become opaque gap codes without names/counts.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Project session | `proposed → active → closed`; closed `→ reopened → closed`; closed `→ amended` after reopen window | Human confirmation/close/inactivity/reopen/correction triggers. Suggested presence never auto-activates; stale source/unmerged work blocks close. |
| Capture ask | `queued → delivered → answered|dismissed|expired|superseded` | Independent worker/recipient/timer/payload change triggers. Silence/dismissal/expiry never means refusal or failed session. |
| Handoff package | `draft → resolving → validating → blocked|generated`; generated `→ stale|superseded` | Builder/current canonical/spec/QC worker triggers. Missing canonical/integrity/oversend blocks; stale package cannot download as current. |
| QC result | `queued → running → passed|warning|blocked|unverifiable|failed|stale` | Code-owned checker/current source triggers. Unsupported/hidden dependency is unverifiable, never pass; dismissal is scoped metadata, not result rewrite. |
| Source declaration | immutable append-only `none|unknown|declared|not_reviewed`; removal appends `not_reviewed` successor | Contributor command triggers. Declaration never means clearance/rights/detection and prior record never mutates. |

Every unlisted transition returns the typed state/version/hash conflict. Events omit attendance names, prompts, asset content and notes.

## Failure, Deepening and Ambiguity Gate

Tests cover suggested-session confirmation, auto-close/resume boundaries, duplicate batch, close-before-outbox crash, changed prompt payload, silence debt, Operator inference, canonical unset, source mutation mid-build, oversending, partial artifact cleanup, integrity block, loudness warning, unsupported check, sticky dismissal version change, hidden readiness dependency and declaration-vs-clearance confusion. No v1 path parses DAWs or observes source paths. Logs omit session/asset names, attendance, prompts, package contents and declarations. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical session, package, QC, readiness and declaration behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Session, delivery, QC and readiness contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]
- [[specs/be/07b-session-capture-offline|Session roll, contribution capture and offline merge — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versioning, review and approval — Backend Specification]]
