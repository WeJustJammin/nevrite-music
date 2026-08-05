# Audio versioning, review and approval — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]  
**Deep Dive:** [[specs/ia/deep-dives/09-projects-collaboration|Project collaboration deep dive]]  
**Access Boundary:** [[specs/be/09b-roster-invitations-vault-access|Project roster and vault access]]

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

- **Shard split:** 3 of 5; PRJ-08 through PRJ-14. Sessions, delivery packages and DAW capture remain separate.
- **Boundary:** quarantined manual ingest, immutable version/lineage truth, explicit canonical slots, A/B playback, version-pinned comments, private review links, human triage and append-only approvals.
- **Approval:** Recommended split accepted under standing autonomy.

## Version and Review Invariants

- Upload bytes settle in private quarantine before checksum and immutable version creation. Same song/hash/ingest key converges; author is actual person/party or explicitly unconfirmed—never null.
- Filename may suggest type but never renames source or silently classifies. Parent is inferred only from unambiguous evidence; otherwise the version commits as root/sibling and later correction appends an acyclic lineage edge.
- Upload never selects canonical. Each unique stage/variant/format slot is an explicit compare-and-set pointer with immutable movement log; unset is valid. Compromised target alarms and remains pinned until an authorized clear/replace—never fallback to “latest.”
- Comparison streams authorized, lower-bitrate fallbacks and loudness-matches by default while declaring degraded/unverifiable states. Playback, preference and analytics never mutate canonical, approval or evidence.
- Comments pin immutable version, fixed audience and point/range/optional musical anchor. Five-minute typo edit requires no reply/triage; later correction/retraction appends history. Carry follows direct lineage only and uncertain mapping enters an unplaced list.
- Share links pin one version. Per-recipient identity is default; public mode requires explicit weaker-guarantee disclosure. Roster-authenticated recipients resolve to project identity without link analytics; recipient threads/counts remain isolated.
- Producer triage records accept/reject/contradiction with author-visible reason. Software may cluster suggestions but never resolve creative conflict. Approval signs exact version, approver-set version and open-comment hash; later versions require new approval except an explicit no-intervening re-advance rule.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/songs/{songId}/audio-uploads` | `CreateAudioUploadRequest`: filename/media type/bytes/checksum/author/optional authored time; authorized uploader/key | `201 UploadSessionResponse`; private upload target/ingest key/expiry | `403`, `404`, `409 HASH_KEY_MISMATCH`, `422 MEDIA_INVALID`, `429` |
| `POST /api/v1/audio-uploads/{uploadId}/settle` | `SettleUploadRequest`: expected size/hash, label/type confirmation, parent candidate; uploader/key | `202 AudioIngestResponse`; ingest/version state | `403`, `404`, `409 UPLOAD_UNSETTLED|CHECKSUM_MISMATCH`, `422`, `429`, `503` |
| `GET /api/v1/songs/{songId}/audio-versions` | type/integrity/residency/cursor; authorized viewer | `AudioVersionPage`; viewer-safe metadata/lineage/count/freshness | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/audio-versions/{versionId}/lineage` | `LineageEdgeRequest`: parent, `same_recording|new_recording`, evidence/reason; author/Producer ETag/key | `201 LineageEdgeResponse`; immutable edge/version | `403`, `404`, `409 CYCLE_OR_EDGE_EXISTS|VERSION_CONFLICT`, `422`, `428`, `429` |
| `PUT /api/v1/songs/{songId}/canonical-slots/{slotKey}` | `CanonicalSlotRequest`: target version or clear, reason, reservation/proxy evidence; authorized role ETag/key | `CanonicalSlotResponse`; pointer/movement/version | `403`, `404`, `409 SLOT_RESERVED|VERSION_CONFLICT`, `422 TARGET_INVALID_OR_COMPROMISED`, `428`, `429` |
| `POST /api/v1/audio-comparisons` | `AudioComparisonRequest`: version IDs<=4, loudness-match default true; authorized viewer/key | `201 AudioComparisonResponse`; ephemeral stream grants/measurement/degraded states | `403`, concealment-safe `404`, `409 ASSET_STATE_CHANGED`, `422`, `429`, `503` |
| `POST /api/v1/audio-versions/{versionId}/comments` | `CreateReviewCommentRequest`: fixed audience, body<=10KiB, time range/musical anchor; authorized reviewer/key | `201 ReviewCommentResponse`; immutable anchor/audience hash | `403`, `404`, `409 VERSION_STATE_CHANGED`, `422 ANCHOR_INVALID`, `429` |
| `POST /api/v1/review-comments/{commentId}/revisions` | `CommentRevisionRequest`: typo-correct/retract/reopen, body/reason; author or permitted role ETag/key | `ReviewCommentResponse`; append-only history/state | `403`, `404`, `409 TYPO_WINDOW_CLOSED|REPLY_OR_TRIAGE_EXISTS|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/review-comments/{commentId}/carries` | `CarryCommentRequest`: direct child version, mapping evidence; author/Producer/key | `201 CommentCarryResponse`; placed/caveated/unplaced result | `403`, `404`, `409 NONDIRECT_LINEAGE|CARRY_EXISTS`, `422`, `429` |
| `POST /api/v1/audio-versions/{versionId}/share-links` | `CreateReviewLinkRequest`: recipient-specific or explicit public mode, expiry/cap/watermark/analytics mode; creator/key | `201 ReviewLinkResponse`; one-time secret, policy/version/revoke authority | `403`, `404`, `409`, `422 PUBLIC_RISK_ACK_REQUIRED`, `429` |
| `GET /api/v1/review-links/{token}` | opaque token plus recipient identity when required | `ReviewLinkProjection`; pinned version/own thread/disclosed measurement mode | `403 RECIPIENT_MISMATCH`, non-enumerable `404`, `410`, `429`, `503` |
| `DELETE /api/v1/review-links/{linkId}` | creator/song owner ETag/key | `204`; revoked grant/version, history retained | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/review-comments/{commentId}/triage` | `TriageCommentRequest`: accept/reject/contradiction/cluster, reason; Producer ETag/key | `201 TriageResponse`; state/reason/version | `403`, `404`, `409 VERSION_CONFLICT`, `422 CREATIVE_DECISION_REQUIRED`, `428`, `429` |
| `POST /api/v1/audio-versions/{versionId}/approvals` | `RecordApprovalRequest`: gate/approver-set version/decision/open-comment hash/proxy evidence; eligible approver/key | `201 ApprovalRecordResponse`; append-only signed evidence | `403 APPROVER_INELIGIBLE`, `404`, `409 COMMENT_SET_CHANGED|APPROVAL_EXISTS`, `422`, `429` |

Version reads/comparisons are 240/min/person; uploads 30/hour/person and settle 60/min; canonical/lineage 30/min/song; comments 120/min/person; links 30/hour/version/creator and opens 120/min/IP; triage/approval 60/min. Private media/responses are no-store; all signed URLs are grant-version bound and short-lived.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `project.assets` / `asset_blobs` / `audio_versions` | song/kind/sensitivity/state/version plus immutable checksum/bytes/media/residency/locator/integrity and sequence/author/label/times/metadata |
| `project.lineage_edges` | child/parent/character/source/confidence/correction/time; unique pair and deferred acyclic constraint |
| `project.canonical_slots` / `canonical_movements` | unique song/stage/variant/format pointer/reservation/proxy/version and immutable from/to/actor/reason/integrity/key |
| `project.review_comments` / `comment_histories` / `comment_anchors` | version/author/fixed audience/body state/history and point/range/musical mapping |
| `project.share_links` / `share_access_events` | version/creator/recipient hash/mode/watermark/analytics/first-access/expiry/cap/state; token hash only and minimal events |
| `project.triage_records` / `approval_gates` / `approval_records` | comment decision/reason/version and gate approver-set plus exact version/comment hash/proxy/decision evidence |

RLS uses 09b access resolution before listing, streaming, counts, comments and analytics. Link recipients receive only their pinned version/thread; roster identity supersedes link identity. Ingest workers wait for stable size, hash bytes, scan media, measure bounded metadata and atomically create immutable version; failures quarantine bytes and expose explicit state. Comparison derivations never write canonical state. Retention-hot references include canonical, approval, release pin and dispute; author erasure pseudonymizes identity without deleting versions.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Blob | `uploading → settling → hot → cold → tombstoned`; settling may become `quarantined|failed` | Upload/inspection/residency/retention triggers. Unsettled/quarantined never versions; tombstoned cannot stream and preserves evidence locator/hash. |
| Audio version | `ingesting → available|integrity_failed`; available `→ tombstoned_bytes|superseded`; integrity failed may only tombstone bytes | Ingest/current source/lifecycle triggers. Non-available cannot become canonical/approved; immutable metadata/history never rewrites. |
| Canonical slot | `unset → set`; set `→ set|cleared|compromised`; compromised requires explicit clear/replace | Authorized CAS command/integrity event triggers. Stale/reserved/invalid target blocks movement; no fallback to latest. |
| Review comment | `open → resolved → reopened → resolved`; open/resolved may append `retracted` history | Author/triage/reopen/retraction triggers. Fixed audience/version/anchor never changes; late typo edit becomes append-only revision. |
| Share link | `active → revoked|expired|exhausted` | Creator revoke/timer/cap triggers. Non-active token returns invariant denial and cannot rebind recipient/version. |
| Approval | immutable `approved|rejected` record bound to exact version/approver-set/open-comment hash | Eligible human decision triggers. Changed hash/set/version blocks; later version requires new approval. |

Every unlisted transition returns the typed state/version conflict. Events omit comments, link identities and bytes.

## Failure, Deepening and Ambiguity Gate

Tests cover duplicate/offline upload, unstable size, hash mismatch, unknown author, ambiguous/cyclic lineage, silent type/canonical attempts, slot races/reservations, compromised canonical, degraded comparison, typo-window/reply race, uncertain carry, public-link acknowledgment, first-access expiry, roster-account analytics exclusion, recipient isolation, triage assistant overreach and comment-hash approval race. Logs omit titles, comments, recipients and locators. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical ingest, canonical, review, link and approval behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Audio version, review and approval contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]
- [[specs/be/09b-roster-invitations-vault-access|Project roster, invitations and vault access — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
