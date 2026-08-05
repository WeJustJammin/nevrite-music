# Session roll, contribution capture and offline merge — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]  
**Deep Dive:** [[specs/ia/deep-dives/07-credits-core|Credit deep dive]]  
**Credit Boundary:** [[specs/be/07a-credit-assertions-visibility|Credit assertions and visibility]]

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

- **Shard split:** 2 of 3; CRD-08 through CRD-11. Shard 09 owns project/session/part truth and wrap events; this contract owns the credit-capture roll, contributions, prompts, attendance evidence and offline reconciliation.
- **Boundary:** temporal roll, explicit contribution claims, deterministic offline operation merge, non-blocking close prompts, consent-respecting attendance evidence and room-mode witnessed capture.
- **Approval:** Recommended split accepted under standing autonomy.

## Capture Invariants

- Pre-seeded bookings, collaborators and prior personnel are owner-only provisional suggestions. Presence never creates a credit, a contribution, an attestation, rights, splits or payment authority.
- One roll subject exists per session party or shell with many capacities and observed/inferred intervals. Bands expand to member entries; the author of every fact remains explicit.
- Offline operations are append-only and device-idempotent. Concurrent addition wins removal, capacities union, intervals widen and become conflicted; no inferred endpoint corroborates attendance. Human evidence outranks contradictory device evidence without deleting either source.
- Contributions are separate immutable claims. Self may attribute self; Producer/delegate may attribute a roll party; each row has one role, many instruments, an actual human/delegate asserter, visibility intent and stable claim hash.
- Wrap or six hours of inactivity closes the capture aggregate; reopening is allowed for 24 hours. Contributor delta cards and Producer reconciliation issue independently within five seconds and never block project/session closure.
- Prompt answers bind the exact displayed claim hash. A changed claim creates a new issue; silence, skip, expiry, declined device evidence and non-response never mean refusal.
- Room-mode taps are witnessed capture only. Attendance evidence is optional, purpose-bound and consequence-free to decline; it cannot gate credit creation or raise provenance by itself.

## API Endpoint Matrix

All bodies are strict Zod 4 objects with bounded arrays/strings and rejected unknown keys. Mutations inherit Shard 00 request, actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/credit-sessions` | `CreateCreditSessionRequest`: project session ID/version, owner party, default visibility; session owner/delegate/key | `201 CreditSessionResponse`; capture ID/version/provisional seed job | `403`, `409 SESSION_CAPTURE_EXISTS|SOURCE_VERSION_CONFLICT`, `422`, `429`, `503` |
| `GET /api/v1/credit-sessions/{id}/roll` | `RollQuery`: since version/cursor; overlapping participant or owner | `SessionRollPage`; viewer-safe entries/intervals/conflicts/freshness | `403`, `404`, `422`, `429`, `503` |
| `PUT /api/v1/credit-sessions/{id}/roll/{subjectId}` | `UpsertRollEntryRequest`: party-or-shell, capacities, state, source ops; self or owner/delegate ETag/key | `RollEntryVersionResponse`; merged version and conflict set | `403 SUBJECT_SCOPE_FORBIDDEN`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/credit-sessions/{id}/roll/{subjectId}/intervals` | `AppendRollIntervalRequest`: start/end, observed/inferred qualities, source; authorized author/key | `201 RollIntervalResponse`; interval/version/conflict flags | `403`, `404`, `409 INTERVAL_CONFLICT`, `422 INTERVAL_INVALID`, `429` |
| `POST /api/v1/credit-sessions/{id}/offline-operations` | `OfflineOperationBatch`: device ID, base version, ordered unique ops<=250 and client times; participant/owner key | `OfflineMergeResponse`; accepted/rejected op IDs, new version, row conflicts | `403`, `409 DEVICE_OP_REUSED|BASE_TOO_OLD`, `422 OP_BATCH_INVALID`, `429`, `503` |
| `POST /api/v1/credit-sessions/{id}/contributions` | `AppendContributionRequest`: part ID/version, subject, one role version-or-literal, instruments, qualifier, visibility intent; self or owner/delegate/key | `201 ContributionClaimResponse`; immutable claim/hash and credit-assertion eligibility | `403 ATTRIBUTION_FORBIDDEN`, `404`, `409 CLAIM_DUPLICATE|PART_VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/credit-sessions/{id}/close` | `CloseCreditSessionRequest`: source wrap version or inactivity trigger, final client op watermark; owner/delegate/system key | `202 CreditSessionCloseResponse`; closed version and stable prompt issue IDs | `403`, `409 SOURCE_VERSION_CONFLICT|UNMERGED_REQUIRED_OPS`, `422`, `429`, `503` |
| `POST /api/v1/credit-sessions/{id}/reopen` | `ReopenCreditSessionRequest`: reason/source session version; owner/delegate ETag/key | `CreditSessionResponse`; reopened version and changed-delta schedule | `403`, `409 REOPEN_WINDOW_CLOSED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/me/credit-prompts` | `CreditPromptQuery`: state/cursor/limit<=50 | `CreditPromptPage`; exact claim summaries and issue IDs | `404`, `422`, `429`, `503` |
| `POST /api/v1/credit-prompts/{issueId}/answers` | `PromptAnswerRequest`: confirm/refuse/dont-know/skip, displayed claim hash; recipient/key | `201 PromptAnswerResponse`; immutable answer and next state | `403`, `404`, `409 CLAIM_HASH_STALE|ANSWER_EXISTS`, `422`, `429` |
| `POST /api/v1/credit-sessions/{id}/attendance-evidence` | `AttendanceEvidenceRequest`: subject, source kind, range, consent, evidence pointer; subject or authorized room operator/key | `201 AttendanceEvidenceResponse`; evidence ref/reliability, no credit effect | `403`, `409 CONSENT_REVOKED|EVIDENCE_DUPLICATE`, `422`, `429` |
| `DELETE /api/v1/credit-sessions/{id}/attendance-evidence/{evidenceId}` | consent withdrawal/ETag/key; subject or privacy authority | `204`; pointer access revoked, required tombstone/hash retained | `403`, `404`, `409 RETENTION_HOLD|VERSION_CONFLICT`, `428`, `429` |

Roll reads are 240/min/person; online roll/contribution writes 120/min/session and 60/min/actor; offline batches 12/min/device with 250 operations each; close/reopen 10/min/session; prompts 60/min/person; attendance 20/min/person. Private responses are no-store; every mutation records device/request/idempotency hashes and emits no raw location or byproduct signal.

## Persistence, RLS and Workers

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Capture session | `open → closing → closed`; closed `→ reopened → closing`; closed becomes `final` after 24-hour reopen window | Owner/source wrap/inactivity/reopen triggers. Unmerged required ops block close; final rejects reopen; project/session closure remains independent. |
| Roll entry | `provisional → observed|inferred|confirmed|disputed`; any non-terminal may become `removed` by additive source operation | Seed/human/device operation triggers. Inferred presence never corroborates itself; removal does not delete intervals/source facts. |
| Offline operation | `received → accepted|rejected|conflicted|superseded` | Serializable merge/current base/device key triggers. Reused op replays; too-old base or invalid operation cannot mutate; terminal op immutable. |
| Contribution claim | `asserted → superseded|withdrawn|contested` through Shard 07a correction rules | Authorized append/case outcome triggers. Claim is immutable; attendance evidence cannot promote it. |
| Prompt issue | `pending → answered|skipped|expired|superseded` | Exact claim-hash answer/timer/changed claim triggers. Silence/skip/expiry never means refusal; terminal issue rejects another answer. |
| Attendance evidence | `active → revoked|held|expired`; held `→ revoked|active` after hold resolution | Consent withdrawal/retention hold/purpose expiry triggers. Non-active evidence has no credit/provenance effect; held tombstone remains protected. |

Every unlisted transition returns the named state/version/hash conflict and preserves append-only operations/evidence.

| Table | Constraints and indexes |
|---|---|
| `credit.capture_sessions` | project session/source version, owner, visibility default, state, wrap/autoclose/reopen clocks and version; unique project session |
| `credit.session_roll_entries` / `credit.roll_intervals` | unique session/subject; capacities, author and state plus immutable intervals/source quality/conflict/version |
| `credit.offline_devices` / `credit.offline_operations` | session-scoped device registration, base/sequence/op hash, outcome and server version; unique device/op ID |
| `credit.contribution_claims` / `credit.contribution_instruments` | immutable session/part/subject/role/literal/asserter/visibility/hash and unique claim/instrument pairs |
| `credit.close_prompt_issues` / `credit.prompt_answers` | unique recipient/delta, claim-hash set, cadence/state and immutable exact-hash answer |
| `credit.attendance_evidence` | subject/session/source/range/consent/reliability/encrypted pointer/revocation/tombstone; no direct public projection |

RLS limits roll and attendance to overlapping participants, owner/delegates and purpose-granted support; a participant sees only authorized intervals and prompt material. Room operators can submit room facts but cannot attest creative contribution. A serializable merge RPC validates source versions, locks the capture aggregate, folds unseen operations in deterministic server order and appends conflict facts without destructive reconciliation.

The seed worker consumes Shard 09 project/session participants but leaves them provisional. The close worker atomically marks the capture version and records two independent outbox intents, then creates contributor and Producer prompt issues within five seconds; retries reuse stable recipient/delta IDs. Inactivity scheduling uses database time, is cancelled by a newer operation and cannot race a source wrap into duplicate issues. Events: capture opened, roll changed, contribution appended, session closed/reopened and prompt answered; payloads omit private session names, device details and attendance evidence.

## Failure, Deepening and Ambiguity Gate

Tests cover duplicate device replay, reused op ID with different bytes, online/offline races, add/remove convergence, interval widening/conflicts, removed subject with committed contribution, band expansion changes, inferred-vs-human evidence, stale part/source version, invalid attribution, auto-close race, 24-hour reopen boundary, crash between close and prompt creation, independent prompt delivery, changed claim re-ask, silence/skip semantics, consent withdrawal and room tap misclassification. No test permits roll presence or attendance to create credit automatically. Logs omit session names, location, device observations and claim narratives. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical roll, merge, contribution, close and consent behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Session capture and offline merge contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/deep-dives/07-credits-core|Deep Dive 07 — Credit graph, capture and confidence]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
