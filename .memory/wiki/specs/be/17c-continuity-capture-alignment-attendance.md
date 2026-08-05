# Session continuity, local capture, alignment and attendance — Backend Specification

**Status:** Complete; specialized runtime disabled  
**IA Source:** [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]  
**Deep Dive:** [[specs/ia/deep-dives/17-realtime-sessions|Real-time sessions deep dive]]

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

- **Shard split:** 3 of 4; RTS-11, RTS-12, RTS-13, RTS-14, RTS-15 and RTS-16.
- **Boundary:** reconnect gaps, authority loss, immutable endpoint-local capture, participant-controlled upload, sidecar alignment and sealed observed-attendance facts.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 17 IA/deep dive | continuity, local capture/upload/alignment, attendance and close algorithms |
| Shards 02, 09 and 10 | evidence projection, project assets/versions and credit/rights interpretation |

## Continuity, Capture and Evidence Invariants

- Participant network loss never stops authorized local capture. Rejoin appends a named gap to one attendance row, re-authenticates/re-syncs and restores performer-owned cue/profile.
- Producer loss does not stop endpoint recording. Current take may finish only while conductor/policy remain valid; without delegated authority no new take starts.
- Conductor loss ends current live take. Deputy may manage room after take only; local files finalize safely without silent timing or authority succession.
- Runtime creates one immutable local file per session/take/endpoint at full quality by default. Lossy fallback requires explicit label and consent.
- Scheduled end plus 30 minutes prompts but never destructively auto-stops. Storage warning is expressed in minutes and never silently lowers fidelity.
- Finalization is uninterruptible and yields playable local file with latched signal/clipping facts. Runtime crash recovers only integrity-proven journal/chunks or declares loud partial/lost state.
- Participant owns endpoint asset and may upload, withhold or discard. Upload pauses during live room, resumes immutable verified chunks with bounded retry and never silently abandons.
- Alignment stores offset/drift model, residual and manual nudge beside immutable original audio. It never bakes correction, quantizes feel, places failure at zero or reports a confidence score.
- Attendance records authenticated endpoint/audio windows and server transport-clock audible seconds. Endpoint timestamps cannot author duration; presence never becomes automatic credit or proof a human played.
- Each participant sees own detailed rows; producer sees purpose-limited summary and never lateral audible seconds. Close is one prompt plus one notification and seals at session end +24 hours.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Runtime-dependent capture routes reject while disabled; durable evidence routes accept only signed admitted-runtime facts.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/realtime-takes/{id}/interruption-events` | participant/gap/cause/runtime sequence; admitted runtime/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 SEQUENCE_CONFLICT`, `422`, `429` |
| `POST /api/v1/realtime-takes/{id}/authority-loss` | producer/conductor/deputy state/policy version; runtime/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `429` |
| `POST /api/v1/realtime-takes/{id}/finalizations` | endpoint/file checksum/duration/signal/clip/journal integrity; runtime/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/realtime-capture-assets/{id}/upload-intents` | upload/withhold/discard action and asset version; participant owner/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 TAKE_ACTIVE|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/realtime-capture-assets/{id}/chunks` | offset/size/checksum/provider state; participant runtime/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 CHUNK_CONFLICT`, `422`, `429`, `503` |
| `POST /api/v1/realtime-takes/{id}/alignment-jobs` | committed method/reference/anchors/asset versions; producer/key | `202 AlignmentResponse`; job/model state | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /internal/v1/realtime-alignments/{id}/complete` | offsets/drift/residual/per-asset result/event; worker/key | `AlignmentResponse`; sidecar/unaligned/partial | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/realtime-alignments/{id}/manual-nudges` | asset/nudge/version; authorized editor/key | `AlignmentResponse`; preserved sidecar successor | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/remote-session-intents/{id}/attendance` | own detail or producer summary; participant | `AttendanceResponse`; scoped segments/gaps/basis | `403`, `404`, `429`, `503` |
| `POST /api/v1/remote-session-intents/{id}/attendance-attestations` | own observed rows/declared role/instrument; participant/key | `201 AttendanceAttestationResponse`; pending/sealed version | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /internal/v1/remote-session-intents/{id}/seal-attendance` | +24h due/observations/attestations/event; worker/key | `AttendanceSealResponse`; immutable evidence IDs | `403`, `409 EVENT_REUSED`, `429`, `503` |

## Persistence, RLS and Workers

- `realtime_interruption`, `capture_asset`, `capture_chunk`, `alignment_model`, `alignment_nudge`, `attendance_observation` and `attendance_attestation` are append-only or immutable-successor records.
- Asset state is `local_pending|uploading|uploaded|withheld|discarded|lost|partial`; no state implies audio exists remotely. Original checksum never changes.
- RLS gives asset owner control, project-authorized playback after upload, participant own attendance detail and producer aggregate summary. Shards 02/10 receive sealed evidence only and decide meaning.
- Upload retry uses `2s/8s/32s` then next authorized open. Alignment failure preserves originals. Seal worker emits pseudonymous evidence without raw audio, exact lateral seconds or device data.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Participant continuity | future `connected → interrupted → reauthenticating → connected|ended` | Runtime gap/rejoin triggers. Capture continues locally; rejoin appends one named gap and never silently restores authority. |
| Capture asset | `local_pending → uploading → uploaded`; local-pending/uploading `→ withheld|discarded|lost|partial`; uploaded may be withdrawn under retention | Owner choice/finalization/integrity/upload triggers. No state implies remote bytes; live take blocks upload and retry never silently abandons. |
| Finalization | future `recording → finalizing → playable|partial|lost`; finalizing is uninterruptible | Endpoint stop/crash recovery and integrity proof trigger. Unproven chunks cannot become playable and fidelity never silently lowers. |
| Alignment | `queued → running → aligned|partial|unaligned|failed`; aligned/partial `→ superseded` by manual nudge successor | Exact assets/method/anchors and worker outcome trigger. Failure preserves originals; no zero placement, baked correction, quantization or confidence score. |
| Attendance | `observing → pending_attestation → sealed`; pending may receive own attestation until session+24h | Server transport/presence and seal timer trigger. Endpoint clocks cannot author duration; sealed evidence does not auto-create credit or performance proof. |

Every unlisted transition returns the typed state/version/integrity conflict. Evidence omits raw audio, lateral exact seconds and device data.

## Failure, Deepening and Ambiguity Gate

Tests cover disconnect auto-stop, duplicate attendance, silent deputy authority, scheduled destructive stop, silent fidelity downgrade, fabricated crash recovery, compelled upload, live upload contention, destructive alignment, zero placement, lateral seconds, attendance-to-credit and premature seal. Seven passes converge; two implementers receive identical continuity, capture and evidence behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Continuity, capture and attendance contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time sessions]]
- [[specs/be/02c-credentials-trader|Credentials and trader evidence — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versions, review and approval — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time jamming and remote sessions]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader-status assessment — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versioning, review and approval — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
