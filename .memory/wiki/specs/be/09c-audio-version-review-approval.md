# BE-09c — Audio versions, lineage, review and approval

## Split Group

This companion owns immutable audio-version records and lineage, canonical-slot pointers, exact-version descriptor corrections and proposals, review comments and triage, private review links, and approval evidence. It owns metadata and access-aware references, not storage bytes, song/project containers, roster policy, rights, credits, release-local enrichment, sessions, packages, or local-agent ingest. The authoritative source is [IA Shard 09 — Music projects and collaboration](../ia/09-projects-collaboration.md).

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Boundary | Immutable version, review and approval command/query surface | IA scope lines 9–24; Contracts lines 144–162. |
| Operations | Eight routes for `PRJ-08` through `PRJ-14` and `PRJ-25` | IA interaction rows 85–91 and 102. |
| Data | Thirteen canonical models for versions, lineage, canonical slots, review, links, triage and approvals | IA Data Models rows 188–194 and typed registry lines 230–242. |
| Storage | Bytes settle in BE00 quarantine; this companion records checksum, residency and immutable metadata | IA PRJ-08 and deep-dive Version Ingest algorithm lines 87–98. |
| Authority | Canonical and descriptor writes require exact role/capability and expected revisions; release access alone cannot grant project authority | IA PRJ-09, PRJ-14, PRJ-25 lines 56, 91, 102; deep-dive correction algorithm lines 99–107. |
| Exclusions | No silent auto-canonical, guessed lineage, cross-audience comments, inherited approvals, Song musical attributes or platform creative adjudication | IA lines 86–91, 149–162; deep-dive review algorithm lines 109–118. |

## Referenced Material Inventory

| Source file | Section and lines | Material used | Trace |
|---|---|---|---|
| [IA parent](../ia/09-projects-collaboration.md) | Overview, Features and Delivery Phases, lines 1–44 | Version/review boundary and launch surface | IA-09C-SCOPE |
| [IA parent](../ia/09-projects-collaboration.md) | PRJ-08 through PRJ-14, lines 55–91 | Upload, canonical, playback, comment, share, triage and approval behavior | IA-09C-INT |
| [IA parent](../ia/09-projects-collaboration.md) | PRJ-25, lines 102 and 159–162 | Release-origin descriptor correction authority and proposal behavior | IA-09C-CORRECTION |
| [IA parent](../ia/09-projects-collaboration.md) | Contracts, lines 113–162 | Version, lineage, review, share, approval and correction contracts | IA-09C-CONTRACT |
| [IA parent](../ia/09-projects-collaboration.md) | Data Models and Typed Field Registry, lines 174–205, 230–242 | Exact first-column model identifiers and fields | IA-09C-DATA |
| [IA parent](../ia/09-projects-collaboration.md) | Access Control and Accessibility, lines 264–299 | Role authority, audience isolation and accessible playback/review | IA-09C-ACCESS |
| [IA parent](../ia/09-projects-collaboration.md) | Event Schemas, lines 301–319 | Ingest, correction, review and approval events plus privacy exclusions | IA-09C-EVENT |
| [IA parent](../ia/09-projects-collaboration.md) | Edge Cases and Coverage Matrix, lines 321–387 | Integrity, stale, review, link, approval and correction recovery | IA-09C-EDGE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Versions and Review Field Contracts, lines 35–50 | Typed model invariants and immutable lineage | DD09C-FIELDS |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Version Ingest/Canonical and Descriptor Correction algorithms, lines 87–107 | Hash, lineage, canonical CAS and authority-aware correction | DD09C-ALGO |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Review, Link and Approval algorithm, lines 109–118 | Anchor, audience, link and approval rules | DD09C-REVIEW |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Abuse and Recovery Verification, lines 153–169 | Anti-leak, no-auto-canonical and stale recovery controls | DD09C-RECOVERY |
| [Feature ledger](../feature-ledger.md) | rows 64–67, 268–269, 529–531 | Assigned version, canonical, integrity, stem, review, triage and approval features | FL-09C |
| [BE00](00-infrastructure.md) | Shared quarantine, signed URL, idempotency, errors, audit, cache and outbox contracts | Inherited platform behavior | BE00-INHERIT |

## IA Source Map

### Interaction map

| IA interaction | IA lines | Backend operation | Owned result |
|---|---:|---|---|
| `PRJ-08` Upload audio version | 85 | `PRJ-08` `POST /api/v1/songs/{songId}/audio-versions` | Immutable version metadata, checksum and lineage state |
| `PRJ-09` Nominate canonical | 86 | `PRJ-09` `PUT /api/v1/songs/{songId}/canonical-slots/{slotId}` | Explicit slot pointer and movement log |
| `PRJ-10` Compare versions/stems | 87 | `PRJ-10` `POST /api/v1/songs/{songId}/audio-comparisons` | Authorized playback set and degraded-state result |
| `PRJ-11` Comment/review version | 88 | `PRJ-11` `POST /api/v1/audio-versions/{versionId}/review-comments` | Immutable comment/audience anchor |
| `PRJ-12` Share private review | 89 | `PRJ-12` `POST /api/v1/audio-versions/{versionId}/share-links` | Pinned recipient/public link and revocation authority |
| `PRJ-13` Triage feedback | 90 | `PRJ-13` `POST /api/v1/songs/{songId}/review-triage` | Producer triage decision and reason |
| `PRJ-14` Approve version | 91 | `PRJ-14` `POST /api/v1/audio-versions/{versionId}/approvals` | Append-only exact-version approval evidence |
| `PRJ-25` Review release-origin version descriptor correction | 102 | `PRJ-25` `POST /api/v1/audio-versions/{versionId}/descriptor-corrections` | Append, pending proposal or terminal review outcome |

### Model map

| IA first-column identifier | IA line | Ownership in this companion |
|---|---:|---|
| `audio_version` | 188 | Immutable exact-version metadata and descriptor projection |
| `lineage_edge` | 188 | Acyclic parent/child relationship and lineage character |
| `version_descriptor_correction` | 189 | Authorized append-only tempo/key correction |
| `version_descriptor_correction_proposal` | 190 | Pending unauthorized-origin proposal and terminal review |
| `canonical_slot` | 191 | Stage/variant/format pointer and reservation |
| `canonical_movement` | 191 | Immutable pointer movement evidence |
| `review_comment` | 192 | Version-pinned body history and audience |
| `comment_anchor` | 192 | Point/range/musical anchor and mapping confidence |
| `triage_record` | 192 | Producer decision and reason |
| `share_link` | 193 | Pinned recipient/public link policy |
| `share_access_event` | 193 | First access, expiry and analytics-safe event |
| `approval_gate` | 194 | Configured approver set and gate version |
| `approval_record` | 194 | Exact version, snapshot hash and proxy evidence |

### Event map

| IA event type | IA line | Producer/consumer treatment |
|---|---:|---|
| `project.version.ingested.v1` | 308 | Published after settled hash, immutable metadata and lineage validation |
| `project.version-descriptor-correction.changed.v1` | 309 | Published value-free after append/proposal decision |
| `project.canonical.changed.v1` | 310 | Published after slot movement |
| `project.review.changed.v1` | 311 | Published after comment, share or triage projection change |
| `project.approval.recorded.v1` | 313 | Published after approval evidence append |
| `project.song.changed.v1` | 305 | Consumed for song visibility; owner is 09a |
| `project.access.changed.v1` | 307 | Consumed for revocation and audience invalidation; owner is 09b |
| `project.package.generated.v1` | 314 | Consumed by package/readiness; owner is 09d |

Events omit audio bytes, private bodies, comment text, link identity, roster names, storage locators, descriptor values for correction events and unrestricted PII.

## Feature Ledger Coverage

| Ledger ID | Capability | Ledger line | Backend treatment |
|---|---|---:|---|
| `07.04.01` | Audio Version Control, Lineage & Immutable Timeline | 64 | `PRJ-08`; immutable record, checksum and acyclic lineage |
| `07.04.02` | Canonical Version Resolver | 65 | `PRJ-09`; explicit compare-and-set slot, no latest fallback |
| `07.04.03` | Take & Comp Management | 529 | `PRJ-08`; lineage character and exact take/comp metadata |
| `07.04.04` | Stem Export Standards & Naming Enforcement | 266 | `PRJ-10`; standard labels and integrity-aware playback metadata |
| `07.04.05` | File Integrity & Missing Media Detection | 530 | `PRJ-08`, `PRJ-10`; integrity failure blocks and missing residency is visible |
| `07.04.06` | Stem Player & Version A/B Compare | 267 | `PRJ-10`; access-aware comparison and lower-bitrate degraded state |
| `07.05.01` | Timestamped Waveform Review | 66 | `PRJ-11`; immutable point/range anchor |
| `07.05.02` | Private Share Links & Listen Analytics | 67 | `PRJ-12`; recipient policy and disclosed analytics mode |
| `07.05.03` | Multi-Stakeholder Feedback Consolidation & Triage | 268 | `PRJ-13`; Producer clusters contradictions without adjudicating |
| `07.05.04` | Formal Approval Gates & Sign-Off Trail | 269 | `PRJ-14`; exact version and open-comment hash |

## Endpoint Completeness Reconciliation

| IA interaction | Route | Request | Success | Errors and recovery | Event/audit |
|---|---|---|---|---|---|
| `PRJ-08` | `POST /api/v1/songs/{songId}/audio-versions` | `IngestAudioVersionRequest` | `AudioVersionResponse` | `UPLOAD_UNSETTLED`, `INTEGRITY_FAILED`, `VALIDATION_FAILED`, `FORBIDDEN` | `project.version.ingested.v1`, audit |
| `PRJ-09` | `PUT /api/v1/songs/{songId}/canonical-slots/{slotId}` | `NominateCanonicalRequest` | `CanonicalSlotResponse` | `VERSION_CONFLICT`, `FORBIDDEN`, `CANONICAL_UNSET`, `INTEGRITY_FAILED` | `project.canonical.changed.v1`, audit |
| `PRJ-10` | `POST /api/v1/songs/{songId}/audio-comparisons` | `CompareVersionsRequest` | `AudioComparisonResponse` | `FORBIDDEN`, `ACCESS_REVOKED`, `NDA_REQUIRED`, `ASSET_NOT_FOUND` | No canonical/evidence side effect; access audit |
| `PRJ-11` | `POST /api/v1/audio-versions/{versionId}/review-comments` | `ReviewCommentRequest` | `ReviewCommentResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | `project.review.changed.v1`, audit |
| `PRJ-12` | `POST /api/v1/audio-versions/{versionId}/share-links` | `ShareReviewRequest` | `ShareLinkResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `ASSET_NOT_FOUND` | `project.review.changed.v1`, audit |
| `PRJ-13` | `POST /api/v1/songs/{songId}/review-triage` | `TriageFeedbackRequest` | `TriageResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | `project.review.changed.v1`, audit |
| `PRJ-14` | `POST /api/v1/audio-versions/{versionId}/approvals` | `ApproveVersionRequest` | `ApprovalResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | `project.approval.recorded.v1`, audit |
| `PRJ-25` | `POST /api/v1/audio-versions/{versionId}/descriptor-corrections` | `DescriptorCorrectionRequest` | `DescriptorCorrectionResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_DESCRIPTOR_TARGET_STALE`, `DESCRIPTOR_PROPOSAL_CONFLICT` | `project.version-descriptor-correction.changed.v1`, audit |

## Shared Contract Inheritance

BE00 supplies request IDs, `ApiError { code, message, requestId, details }`, authentication context, idempotency fingerprints, storage quarantine and checksum hooks, signed URL and cache revocation, audit hashing, transactional outbox and offline replay. BE01 supplies party/authority and BE07 supplies role/capability projections. Shard 22 may originate a release-local descriptor correction and shared correction ID, but this companion remains the only owner of exact version descriptors and proposal decisions. No route here writes Song musical attributes, rights, credit or release-local truth.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Request → success | Auth / ownership / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| `PRJ-08` | `PRJ-08` | `POST /api/v1/songs/{songId}/audio-versions` | `IngestAudioVersionRequest` → `AudioVersionResponse` | Upload-authorized roster role; hidden song 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → quarantineCheck → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, checksum, idempotency_key)` unique; immutable sequence and lineage CAS | 20 requests/minute/party; 1,500 ms deadline; no body cache; p95 ≤ 800 ms after quarantine settles | `ApiError { code, message, requestId, details }` | `project.version.ingested.v1` |
| `PRJ-09` | `PRJ-09` | `PUT /api/v1/songs/{songId}/canonical-slots/{slotId}` | `NominateCanonicalRequest` → `CanonicalSlotResponse` | Canonical authority and slot reservation/proxy; hidden song/slot 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(slot_id, idempotency_key)` unique; expected slot version serializable CAS | 60 requests/minute/party; 700 ms deadline; purge canonical cache; p95 ≤ 350 ms | `ApiError { code, message, requestId, details }` | `project.canonical.changed.v1` |
| `PRJ-10` | `PRJ-10` | `POST /api/v1/songs/{songId}/audio-comparisons` | `CompareVersionsRequest` → `AudioComparisonResponse` | Read access for every target under same sensitivity/NDA policy; hidden song/version 404, known denied target 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → signedGrant`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(actor, comparison_hash, idempotency_key)` unique for audit; read-only targets never mutate | 60 requests/minute/identity; 500 ms deadline; signed grants TTL 15 min; p95 ≤ 250 ms | `ApiError { code, message, requestId, details }` | Access audit only |
| `PRJ-11` | `PRJ-11` | `POST /api/v1/audio-versions/{versionId}/review-comments` | `ReviewCommentRequest` → `ReviewCommentResponse` | Roster review role or pinned share policy; hidden version 404, known audience violation 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(version_id, idempotency_key)` unique; body history CAS; five-minute edit rule | 60 requests/minute/party; 700 ms deadline; private comment cache purge; p95 ≤ 350 ms | `ApiError { code, message, requestId, details }` | `project.review.changed.v1` |
| `PRJ-12` | `PRJ-12` | `POST /api/v1/audio-versions/{versionId}/share-links` | `ShareReviewRequest` → `ShareLinkResponse` | Version creator or song share authority; hidden version 404, known non-authority 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → signedGrant → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(version_id, recipient_hash, idempotency_key)` unique; link policy version CAS | 20 requests/minute/party; 900 ms deadline; no public cache; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.review.changed.v1` |
| `PRJ-13` | `PRJ-13` | `POST /api/v1/songs/{songId}/review-triage` | `TriageFeedbackRequest` → `TriageResponse` | Producer role in song profile; hidden song 404, known non-Producer 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; triage batch CAS | 30 requests/minute/party; 700 ms deadline; purge triage cache; p95 ≤ 350 ms | `ApiError { code, message, requestId, details }` | `project.review.changed.v1` |
| `PRJ-14` | `PRJ-14` | `POST /api/v1/audio-versions/{versionId}/approvals` | `ApproveVersionRequest` → `ApprovalResponse` | Configured approver or recorded proxy; hidden version 404, known signer outside set 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(gate_id, version_id, approver_id, idempotency_key)` unique; approver-set/open-comment hashes CAS | 20 requests/minute/party; 900 ms deadline; purge approval/readiness cache; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.approval.recorded.v1` |
| `PRJ-25` | `PRJ-25` | `POST /api/v1/audio-versions/{versionId}/descriptor-corrections` | `DescriptorCorrectionRequest` → `DescriptorCorrectionResponse` | Exact-version owner or Producer with `version:edit_descriptors` may append/review; release-origin actor may submit a proposal without project read; hidden version 404, known missing authority 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=internal-release-web → csrf → tenantScope → authorization → idempotency → audit`; CORS is `internal-release-web` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Idempotency key `(shared correction ID)` unique; descriptor/proposal expected revisions serializable; one terminal proposal decision | 30 requests/minute/party; 1,000 ms deadline; purge linked-release projection; p95 ≤ 500 ms | `ApiError { code, message, requestId, details }` | `project.version-descriptor-correction.changed.v1` |

### Registry invariants

1. Every route validates UUIDs, strict body fields, checksum formats and expected versions before exposing resource-dependent detail. Hidden targets produce safe 404; known unauthorized targets produce 403 only after policy-safe existence is established.
2. Every failure uses `ApiError { code, message, requestId, details }`; details contain field paths, safe hashes and required action, never bytes, private comments, link identities, storage locators or descriptor values for correction events.
3. Upload never nominates canonical. Parent lineage is inferred only when evidence is unambiguous; otherwise a root/sibling commits and lineage can be corrected later without inventing a parent.
4. Canonical pointers, comments, links, approvals and descriptor corrections are append-only evidence with mutable projections. A later version never inherits an approval or comments without the explicit rules in its contract.
5. PRJ-25 uses one shared correction ID. Authorized append and unauthorized proposal are mutually exclusive outcomes; one proposal has one terminal decision and no decision grants project access.

### Pagination and response bounds

Collection behavior is explicit outside the operation matrices. Commands return one bounded object except the bounded comparison result; callers cannot supply a cursor. `limit` is enforced before any comparison or comment projection is materialized.

| Operation ID | Pagination and cursor | Limit and rationale |
|---|---|---|
| `PRJ-08` | Pagination: N/A; cursor: N/A | One audio-version ingest result; request body limit 128 KiB and 20 evidence references. |
| `PRJ-09` | Pagination: N/A; cursor: N/A | One canonical-slot result; request body limit 16 KiB. |
| `PRJ-10` | Pagination: N/A; cursor: N/A | Bounded comparison result; `limit` is 20 measures and request body limit 32 KiB. |
| `PRJ-11` | Pagination: N/A; cursor: N/A | One review comment; request body limit 32 KiB. |
| `PRJ-12` | Pagination: N/A; cursor: N/A | One share link; request body limit 16 KiB. |
| `PRJ-13` | Pagination: N/A; cursor: N/A | One triage record; comment-reference limit 100 and request body limit 32 KiB. |
| `PRJ-14` | Pagination: N/A; cursor: N/A | One approval record; approver evidence limit 32 and request body limit 32 KiB. |
| `PRJ-25` | Pagination: N/A; cursor: N/A | One descriptor correction; request body limit 32 KiB. |

### Operation contract and error matrix

| Operation ID | Request and validation | Success | Declared errors | Recovery |
|---|---|---|---|---|
| `PRJ-08` | Settled quarantine blob, checksum, author, type confirmation, metadata and lineage candidates | Immutable version ID, sequence, integrity and residency | `UPLOAD_UNSETTLED`, `INTEGRITY_FAILED`, `VALIDATION_FAILED`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH` | Poll quarantine or re-upload new hash; ambiguous parent commits root/sibling |
| `PRJ-09` | Exact target, slot stage/variant/format, reservation/proxy and expected slot version | Slot target/version and movement ID | `VERSION_CONFLICT`, `FORBIDDEN`, `CANONICAL_UNSET`, `INTEGRITY_FAILED` | Retry after reloading the slot with a new expected version; clear or replace explicitly; never choose latest |
| `PRJ-10` | 2–8 exact version/stem IDs and playback mode; all targets independently authorized | Scoped stream grants and degraded flags | `FORBIDDEN`, `ACCESS_REVOKED`, `NDA_REQUIRED`, `ASSET_NOT_FOUND` | Retry grant resolution only after access is re-resolved; otherwise use lower bitrate fallback; no canonical/evidence mutation |
| `PRJ-11` | Immutable version, fixed audience, point/range anchor and bounded body | Comment version and audience hash | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry within the five-minute edit window using the current comment version; uncertain carry enters unplaced list, and later edits become correction/retraction |
| `PRJ-12` | Pinned version, recipient/public mode, watermark, disclosed analytics, expiry/cap | Link ID, policy hash and revocation authority | `FORBIDDEN`, `VALIDATION_FAILED`, `ASSET_NOT_FOUND`, `IDEMPOTENCY_MISMATCH` | Retry issuance only after correcting policy inputs with the same key; otherwise revoke token/cache, and roster account resolves to project view without link analytics |
| `PRJ-13` | Open in-scope comments and author-visible accept/reject reason | Triage batch and reason version | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Producer may retry on the latest batch; contradictions remain open |
| `PRJ-14` | Exact version, approver-set version, open-comment hash, decision, proxy reference | Append-only approval evidence | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry only after re-reading the exact snapshot and supplying current hashes; later version requires new approval |
| `PRJ-25` | Closed tempo/key field, prior hash, expected descriptor revision, corrected value/reason, release origin and shared ID | Appended correction, pending proposal or terminal review result | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_DESCRIPTOR_TARGET_STALE`, `DESCRIPTOR_PROPOSAL_CONFLICT`, `VERSION_CONFLICT` | Retry review after fresh authority/revision resolution; stale proposal remains pending, reject preserves the release-local correction, and one winner remains per shared ID |

### Route field validation matrix

| Operation ID | Path and body fields | Limits and invariants | Rejection |
|---|---|---|---|
| `PRJ-08` | `songId`, quarantine blob, checksum, author, type, metadata, parent candidates | Stable settled bytes; checksum 64 hex; author present even when unconfirmed; metadata ≤ 256 KiB | `UPLOAD_UNSETTLED`, `VALIDATION_FAILED` |
| `PRJ-09` | `songId`, `slotId`, `target_version_id?`, `stage`, `variant`, `format`, `expected_slot_version`, `clear` | One exact target or explicit clear; target visible and integrity-passing; stage/variant/format ≤ 80 | `CANONICAL_UNSET`, `INTEGRITY_FAILED`, `VALIDATION_FAILED` |
| `PRJ-10` | `songId`, `version_ids`, `stem_ids`, `playback_mode`, `loudness_match` | 2–8 unique exact IDs; no mixed unauthorized sensitivity; mode `full_rate` or `adaptive` | `VALIDATION_FAILED`, `ASSET_NOT_FOUND` |
| `PRJ-11` | `versionId`, `body`, `audience`, `start_ms`, `end_ms?`, musical anchor, `edit_of?`, `retract?` | Body 1–4,000; range end ≥ start; edit ≤ 5 minutes and no reply/triage; audience immutable | `VALIDATION_FAILED` |
| `PRJ-12` | `versionId`, `mode`, `recipient_hash?`, watermark, analytics, starts-on-first-access, expiry/cap | Recipient mode requires hash; public mode requires acknowledgment; expiry ≤ 30 days; cap bounded | `VALIDATION_FAILED` |
| `PRJ-13` | `songId`, comment IDs, decision, author-visible reason, expected_batch_version | 1–200 open comments; reason 1–1,000; only accept/reject/flag | `VALIDATION_FAILED` |
| `PRJ-14` | `versionId`, `gate_id`, approver-set version, open-comment hash, decision, proxy_for? | Hashes exact; proxy visibly weaker; decision sign/reject; no inherited approval | `VALIDATION_FAILED` |
| `PRJ-25` | `versionId`, field, action, prior hash, expected descriptor revision, value, reason, origin release version, shared correction ID, proposal ID? | Field only `tempo_bpm` or `musical_key`; value matches field; reason ≤ 2,000; one shared ID | `VALIDATION_FAILED`, `VERSION_DESCRIPTOR_TARGET_STALE` |

## Request/Response Contracts (Zod 4 schemas)

```ts
import { z } from "zod";

const UUID = z.string().uuid();
const Version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const Key = z.string().trim().min(16).max(128);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const ApiError = z.object({
  code: z.enum([
    "VALIDATION_FAILED", "FORBIDDEN", "RESOURCE_NOT_FOUND", "UPLOAD_UNSETTLED",
    "INTEGRITY_FAILED", "CANONICAL_UNSET", "ACCESS_REVOKED", "NDA_REQUIRED",
    "ASSET_NOT_FOUND", "VERSION_CONFLICT", "IDEMPOTENCY_MISMATCH",
    "VERSION_DESCRIPTOR_TARGET_STALE", "DESCRIPTOR_PROPOSAL_CONFLICT", "DEPENDENCY_UNAVAILABLE"
  ]),
  message: z.string().trim().min(1).max(240),
  requestId: UUID,
  details: z.record(z.string(), z.json())
}).strict();

const ActorContext = z.object({
  actor_person_id: UUID,
  acting_party_id: UUID.optional(),
  acting_context_version: Version,
  idempotency_key: Key,
  request_id: UUID
}).strict();

const Metadata = z.object({
  producer_label: z.string().trim().min(1).max(200),
  version_type: z.enum(["take", "comp", "mix", "master", "stem", "rough", "other"]),
  sample_rate_hz: z.number().int().positive().max(384000),
  bit_depth: z.number().int().positive().max(64),
  channels: z.number().int().positive().max(256),
  duration_ms: z.number().int().positive().max(86400000)
}).strict();

export const IngestAudioVersionRequest = ActorContext.extend({
  song_id: UUID,
  quarantine_blob_id: UUID,
  checksum: Hash,
  bytes: z.number().int().nonnegative().max(1099511627776),
  author_person_id: UUID,
  author_confirmed: z.boolean(),
  original_label: z.string().trim().min(1).max(255),
  metadata: Metadata,
  parent_candidates: z.array(UUID).max(20),
  lineage_character: z.enum(["same_recording", "new_recording"]).optional(),
  confirm_type: z.literal(true)
}).strict();

export const AudioVersionResponse = z.object({
  audio_version_id: UUID,
  song_id: UUID,
  sequence: z.number().int().positive(),
  integrity: z.enum(["unverified", "passing", "failed", "unverifiable"]),
  residency: z.enum(["hot", "cold", "tombstoned"]),
  lineage_state: z.enum(["root", "linked", "ambiguous"]),
  descriptor_revision: Version,
  version: Version,
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export const NominateCanonicalRequest = ActorContext.extend({
  song_id: UUID,
  slot_id: UUID,
  stage: z.string().trim().min(1).max(80),
  variant: z.string().trim().min(1).max(80),
  format: z.string().trim().min(1).max(80),
  target_version_id: UUID.optional(),
  clear: z.boolean(),
  expected_slot_version: Version,
  reservation_token: z.string().trim().max(128).optional()
}).strict().refine(x => x.clear !== Boolean(x.target_version_id), "set exactly one of clear or target");

export const CanonicalSlotResponse = z.object({
  slot_id: UUID,
  song_id: UUID,
  target_version_id: UUID.nullable(),
  slot_version: Version,
  movement_id: UUID,
  notification_id: UUID,
  event_id: UUID
}).strict();

export const CompareVersionsRequest = ActorContext.extend({
  song_id: UUID,
  version_ids: z.array(UUID).min(2).max(8),
  stem_ids: z.array(UUID).max(16),
  playback_mode: z.enum(["full_rate", "adaptive"]),
  loudness_match: z.boolean()
}).strict();

export const AudioComparisonResponse = z.object({
  comparison_id: UUID,
  streams: z.array(z.object({
    version_id: UUID,
    grant_id: UUID,
    signed_url: z.string().url(),
    expires_at: z.string().datetime({ offset: true }),
    degraded: z.boolean()
  }).strict()),
  canonical_side_effect: z.literal(false),
  analytics_side_effect: z.literal(false)
}).strict();

export const ReviewCommentRequest = ActorContext.extend({
  version_id: UUID,
  body: z.string().trim().min(1).max(4000),
  audience: z.object({ kind: z.enum(["roster", "share_link"]), audience_hash: Hash }).strict(),
  start_ms: z.number().int().nonnegative(),
  end_ms: z.number().int().nonnegative().optional(),
  musical_anchor: z.object({ section: z.string().trim().max(80), bar: z.number().int().positive().optional(), beat: z.number().positive().optional() }).strict().optional(),
  edit_of: UUID.optional(),
  retract: z.boolean().default(false),
  expected_comment_version: Version.optional()
}).strict().refine(x => x.end_ms === undefined || x.end_ms >= x.start_ms, "comment range is reversed");

export const ReviewCommentResponse = z.object({
  comment_id: UUID,
  comment_version: Version,
  anchor_id: UUID,
  audience_hash: Hash,
  state: z.enum(["open", "resolved", "reopened", "retracted", "unplaced"]),
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export const ShareReviewRequest = ActorContext.extend({
  version_id: UUID,
  mode: z.enum(["recipient", "public"]),
  recipient_hash: Hash.optional(),
  watermark_policy: z.enum(["visible", "forensic", "none"]),
  analytics_mode: z.enum(["disclosed_minimal", "disclosed_detailed", "none"]),
  acknowledge_weaker_guarantees: z.boolean(),
  starts_on_first_access: z.boolean(),
  expires_at: z.string().datetime({ offset: true }),
  access_cap: z.number().int().positive().max(100000).optional()
}).strict().refine(x => x.mode !== "recipient" || Boolean(x.recipient_hash), "recipient binding required").refine(x => x.mode !== "public" || x.acknowledge_weaker_guarantees, "public guarantee acknowledgment required");

export const ShareLinkResponse = z.object({
  share_link_id: UUID,
  version_id: UUID,
  mode: z.enum(["recipient", "public"]),
  policy_hash: Hash,
  link_token: z.string().min(32).max(512),
  expires_at: z.string().datetime({ offset: true }),
  revoke_authority: z.literal(true),
  event_id: UUID
}).strict();

export const TriageFeedbackRequest = ActorContext.extend({
  song_id: UUID,
  comment_ids: z.array(UUID).min(1).max(200),
  decision: z.enum(["accept", "reject", "flag"]),
  author_visible_reason: z.string().trim().min(1).max(1000),
  expected_batch_version: Version
}).strict();

export const TriageResponse = z.object({
  triage_record_id: UUID,
  batch_version: Version,
  contradiction_flagged: z.boolean(),
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export const ApproveVersionRequest = ActorContext.extend({
  version_id: UUID,
  gate_id: UUID,
  approver_set_version: Version,
  open_comment_hash: Hash,
  decision: z.enum(["approved", "rejected"]),
  proxy_for_person_id: UUID.optional(),
  expected_gate_version: Version
}).strict();

export const ApprovalResponse = z.object({
  approval_record_id: UUID,
  gate_id: UUID,
  version_id: UUID,
  decision: z.enum(["approved", "rejected"]),
  proxy_strength: z.enum(["direct", "proxy"]),
  evidence_hash: Hash,
  event_id: UUID,
  audit_event_id: UUID
}).strict();

const CorrectionOrigin = z.object({
  origin_release_version_id: UUID,
  shared_correction_id: UUID
}).strict();
const TempoCorrection = ActorContext.extend({
  version_id: UUID,
  field: z.literal("tempo_bpm"),
  corrected_value: z.number().positive().max(400),
  prior_value_hash: Hash,
  expected_descriptor_revision: Version,
  reason: z.string().trim().min(1).max(2000),
  action: z.enum(["append_or_propose", "accept", "reject"]),
  proposal_id: UUID.optional(),
  origin: CorrectionOrigin
}).strict();
const KeyCorrection = ActorContext.extend({
  version_id: UUID,
  field: z.literal("musical_key"),
  corrected_value: z.string().trim().min(1).max(64),
  prior_value_hash: Hash,
  expected_descriptor_revision: Version,
  reason: z.string().trim().min(1).max(2000),
  action: z.enum(["append_or_propose", "accept", "reject"]),
  proposal_id: UUID.optional(),
  origin: CorrectionOrigin
}).strict();
export const DescriptorCorrectionRequest = z.union([TempoCorrection, KeyCorrection]);

export const DescriptorCorrectionResponse = z.object({
  outcome: z.enum(["appended", "pending", "accepted", "rejected"]),
  correction_id: UUID.nullable(),
  proposal_id: UUID.nullable(),
  descriptor_revision: Version,
  state_event_id: UUID,
  audit_event_id: UUID
}).strict();

export type ApiError = z.infer<typeof ApiError>;
export type IngestAudioVersionRequest = z.infer<typeof IngestAudioVersionRequest>;
export type AudioVersionResponse = z.infer<typeof AudioVersionResponse>;
export type NominateCanonicalRequest = z.infer<typeof NominateCanonicalRequest>;
export type CanonicalSlotResponse = z.infer<typeof CanonicalSlotResponse>;
export type CompareVersionsRequest = z.infer<typeof CompareVersionsRequest>;
export type AudioComparisonResponse = z.infer<typeof AudioComparisonResponse>;
export type ReviewCommentRequest = z.infer<typeof ReviewCommentRequest>;
export type ReviewCommentResponse = z.infer<typeof ReviewCommentResponse>;
export type ShareReviewRequest = z.infer<typeof ShareReviewRequest>;
export type ShareLinkResponse = z.infer<typeof ShareLinkResponse>;
export type TriageFeedbackRequest = z.infer<typeof TriageFeedbackRequest>;
export type TriageResponse = z.infer<typeof TriageResponse>;
export type ApproveVersionRequest = z.infer<typeof ApproveVersionRequest>;
export type ApprovalResponse = z.infer<typeof ApprovalResponse>;
export type DescriptorCorrectionRequest = z.infer<typeof DescriptorCorrectionRequest>;
export type DescriptorCorrectionResponse = z.infer<typeof DescriptorCorrectionResponse>;
```

## Database Schema

### Canonical records and fields

| Table | Typed fields with nullability and constraints | Foreign keys, indexes and RLS/grants |
|---|---|---|
| `audio_version` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `sequence integer NOT NULL CHECK (sequence > 0)`; `owner_party_id uuid NOT NULL`; `author_person_id uuid NOT NULL`; `author_confirmed boolean NOT NULL`; `original_label text NOT NULL CHECK (char_length(original_label) BETWEEN 1 AND 255)`; `producer_label text NOT NULL CHECK (char_length(producer_label) BETWEEN 1 AND 200)`; `version_type text NOT NULL`; `checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$')`; `bytes bigint NOT NULL CHECK (bytes >= 0)`; `metadata jsonb NOT NULL`; `descriptor_projection jsonb NOT NULL`; `descriptor_revision bigint NOT NULL CHECK (descriptor_revision >= 0)`; `residency text NOT NULL CHECK (residency IN ('hot','cold','tombstoned'))`; `integrity text NOT NULL CHECK (integrity IN ('unverified','passing','failed','unverifiable'))`; `created_at timestamptz NOT NULL`; `ingested_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `song_id → song.id` owned by 09a, `owner_party_id → party.id`, `author_person_id → person.id`; checksum unique per song; indexes `(song_id, sequence DESC)`, `(song_id, integrity, residency)`, `(checksum)`; RLS song role read and upload-capability append; GRANT policy: authenticated SELECT via RLS, upload/domain function INSERT, UPDATE/DELETE revoked, locator/blob fields service-role only |
| `lineage_edge` | `id uuid NOT NULL PRIMARY KEY`; `child_version_id uuid NOT NULL`; `parent_version_id uuid NULL`; `character text NOT NULL CHECK (character IN ('same_recording','new_recording'))`; `source text NOT NULL`; `confidence text NOT NULL CHECK (confidence IN ('unambiguous','ambiguous','human_confirmed'))`; `corrected_by_person_id uuid NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(child_version_id, parent_version_id)` | FK `child_version_id → audio_version.id`, `parent_version_id → audio_version.id`, `corrected_by_person_id → person.id`; CHECK child differs from parent and cycle function; indexes `(child_version_id)`, `(parent_version_id)`, `(confidence)`; RLS follows song/version; GRANT policy: authorized song-role SELECT, lineage function INSERT, UPDATE/DELETE revoked |
| `version_descriptor_correction` | `id uuid NOT NULL PRIMARY KEY`; `audio_version_id uuid NOT NULL`; `field text NOT NULL CHECK (field IN ('tempo_bpm','musical_key'))`; `prior_value_hash text NOT NULL CHECK (prior_value_hash ~ '^[a-f0-9]{64}$')`; `corrected_value jsonb NOT NULL`; `reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 2000)`; `submitted_by_party_id uuid NOT NULL`; `authority_decision_ref uuid NOT NULL`; `authority_version bigint NOT NULL`; `shared_correction_id uuid NOT NULL UNIQUE`; `origin_release_version_id uuid NOT NULL`; `created_at timestamptz NOT NULL` | FK `audio_version_id → audio_version.id`, `submitted_by_party_id → party.id`, `authority_decision_ref → authority_decision.id` opaque BE01 reference, `origin_release_version_id → release_version.id` opaque BE22 reference; indexes `(audio_version_id, created_at DESC)`, `(origin_release_version_id)`, `(shared_correction_id)`; RLS exact-version owner/authorized Producer read; GRANT policy: authorized roles SELECT via RLS, authority function INSERT, UPDATE/DELETE revoked |
| `version_descriptor_correction_proposal` | `id uuid NOT NULL PRIMARY KEY`; `audio_version_id uuid NOT NULL`; `field text NOT NULL CHECK (field IN ('tempo_bpm','musical_key'))`; `expected_descriptor_revision bigint NOT NULL`; `prior_value_hash text NOT NULL`; `proposed_value jsonb NOT NULL`; `reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 2000)`; `submitted_by_party_id uuid NOT NULL`; `origin_release_version_id uuid NOT NULL`; `shared_correction_id uuid NOT NULL UNIQUE`; `addressed_owner_party_id uuid NOT NULL`; `state text NOT NULL CHECK (state IN ('pending','accepted','rejected'))`; `reviewed_by_party_id uuid NULL`; `review_reason text NULL`; `created_at timestamptz NOT NULL`; `decided_at timestamptz NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `audio_version_id → audio_version.id`, `submitted_by_party_id → party.id`, `origin_release_version_id → release_version.id` opaque, `addressed_owner_party_id → party.id`, `reviewed_by_party_id → party.id`; indexes `(audio_version_id, state, created_at DESC)`, `(shared_correction_id)`, `(addressed_owner_party_id, state)`; RLS submitter safe-status only, target owner/authorized Producer review, no proposal access grant |
| `canonical_slot` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `stage text NOT NULL CHECK (char_length(stage) BETWEEN 1 AND 80)`; `variant text NOT NULL CHECK (char_length(variant) BETWEEN 1 AND 80)`; `format text NOT NULL CHECK (char_length(format) BETWEEN 1 AND 80)`; `target_version_id uuid NULL`; `reserved_by_party_id uuid NULL`; `proxy boolean NOT NULL DEFAULT false`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(song_id, stage, variant, format)` | FK `song_id → song.id`, `target_version_id → audio_version.id`, `reserved_by_party_id → party.id`; indexes `(song_id, stage, variant, format)`, `(target_version_id)`; RLS song profile and reservation policy; GRANT policy: authorized profile roles SELECT via RLS, CAS function INSERT/UPDATE, DELETE revoked |
| `canonical_movement` | `id uuid NOT NULL PRIMARY KEY`; `slot_id uuid NOT NULL`; `from_target_version_id uuid NULL`; `to_target_version_id uuid NULL`; `actor_person_id uuid NOT NULL`; `acting_context_version bigint NOT NULL`; `reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500)`; `target_integrity text NOT NULL`; `idempotency_key text NOT NULL`; `created_at timestamptz NOT NULL`; unique `(slot_id, idempotency_key)` | FK `slot_id → canonical_slot.id`, target IDs → `audio_version.id`, `actor_person_id → person.id`; indexes `(slot_id, created_at DESC)`, `(to_target_version_id)`; RLS authorized song roles read; GRANT policy: authorized song-role SELECT via RLS, slot function INSERT, UPDATE/DELETE revoked |
| `review_comment` | `id uuid NOT NULL PRIMARY KEY`; `version_id uuid NOT NULL`; `author_person_id uuid NOT NULL`; `audience_kind text NOT NULL CHECK (audience_kind IN ('roster','share_link'))`; `audience_hash text NOT NULL`; `body_ciphertext text NOT NULL`; `body_hash text NOT NULL`; `state text NOT NULL CHECK (state IN ('open','resolved','reopened','retracted','unplaced'))`; `created_at timestamptz NOT NULL`; `resolved_reason text NULL`; `resolved_version bigint NULL`; `reopen_count integer NOT NULL DEFAULT 0 CHECK (reopen_count >= 0)`; `version bigint NOT NULL CHECK (version >= 0)` | FK `version_id → audio_version.id`, `author_person_id → person.id`; indexes `(version_id, state, created_at)`, `(audience_hash, version_id)`, `(body_hash)`; RLS audience hash intersection, creator/authorized roles only, no broad project grant, append-only history |
| `comment_anchor` | `id uuid NOT NULL PRIMARY KEY`; `comment_id uuid NOT NULL`; `start_ms integer NOT NULL CHECK (start_ms >= 0)`; `end_ms integer NULL CHECK (end_ms IS NULL OR end_ms >= start_ms)`; `bar integer NULL CHECK (bar IS NULL OR bar > 0)`; `beat numeric(9,6) NULL CHECK (beat IS NULL OR beat > 0)`; `section text NULL CHECK (section IS NULL OR char_length(section) <= 80)`; `mapping_confidence text NOT NULL CHECK (mapping_confidence IN ('exact','musical','uncertain'))`; `placed_by_person_id uuid NULL`; `created_at timestamptz NOT NULL` | FK `comment_id → review_comment.id`, `placed_by_person_id → person.id`; indexes `(comment_id)`, `(mapping_confidence)`; RLS follows comment audience; GRANT policy: audience-authorized SELECT via RLS, anchor function INSERT, UPDATE/DELETE revoked |
| `triage_record` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `comment_ids jsonb NOT NULL CHECK (jsonb_array_length(comment_ids) BETWEEN 1 AND 200)`; `producer_person_id uuid NOT NULL`; `decision text NOT NULL CHECK (decision IN ('accept','reject','flag'))`; `author_visible_reason text NOT NULL CHECK (char_length(author_visible_reason) BETWEEN 1 AND 1000)`; `contradiction_flagged boolean NOT NULL`; `batch_version bigint NOT NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `song_id → song.id`, `producer_person_id → person.id`; JSON IDs are bounded comment refs because one triage decision covers a set; indexes `(song_id, batch_version DESC)`, `(producer_person_id, created_at DESC)`; RLS Producer and comment authors' safe result; GRANT policy: authorized safe SELECT via RLS, triage function INSERT, UPDATE/DELETE revoked |
| `share_link` | `id uuid NOT NULL PRIMARY KEY`; `version_id uuid NOT NULL`; `creator_person_id uuid NOT NULL`; `recipient_hash text NULL`; `mode text NOT NULL CHECK (mode IN ('recipient','public'))`; `watermark_policy text NOT NULL`; `analytics_mode text NOT NULL`; `starts_on_first_access boolean NOT NULL`; `expires_at timestamptz NOT NULL`; `access_cap integer NULL CHECK (access_cap IS NULL OR access_cap > 0)`; `state text NOT NULL CHECK (state IN ('active','revoked','expired'))`; `policy_hash text NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL` | FK `version_id → audio_version.id`, `creator_person_id → person.id`; CHECK recipient mode requires hash and public mode requires acknowledgment evidence; indexes `(version_id, state, expires_at)`, `(recipient_hash, state)`; RLS creator/song owner and recipient-scoped projection, token hash service-only; GRANT policy: scoped SELECT via RLS, share function INSERT/UPDATE, DELETE revoked, token hash service-role only |
| `share_access_event` | `id uuid NOT NULL PRIMARY KEY`; `share_link_id uuid NOT NULL`; `accessed_at timestamptz NOT NULL`; `roster_identity_resolved boolean NOT NULL`; `analytics_mode text NOT NULL`; `anomaly_state text NOT NULL`; `bytes_served bigint NOT NULL CHECK (bytes_served >= 0)`; `request_hash text NOT NULL` | FK `share_link_id → share_link.id`; indexes `(share_link_id, accessed_at DESC)`, `(request_hash)`; RLS creator/owner analytics scope, recipient cannot see other accesses, no identity or IP storage; GRANT policy: owner analytics SELECT via RLS, recorder INSERT, UPDATE/DELETE revoked |
| `approval_gate` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `gate_key text NOT NULL`; `approver_set jsonb NOT NULL`; `approver_set_version bigint NOT NULL`; `state text NOT NULL CHECK (state IN ('open','closed','superseded'))`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(song_id, gate_key, approver_set_version)` | FK `song_id → song.id`; indexes `(song_id, gate_key, state)`, `(approver_set_version)`; RLS song owner/authorized approver read, owner configuration write; GRANT policy: authenticated SELECT via RLS, owner configuration function INSERT/UPDATE, DELETE revoked |
| `approval_record` | `id uuid NOT NULL PRIMARY KEY`; `gate_id uuid NOT NULL`; `version_id uuid NOT NULL`; `approver_person_id uuid NOT NULL`; `proxy_for_person_id uuid NULL`; `approver_set_version bigint NOT NULL`; `open_comment_hash text NOT NULL`; `decision text NOT NULL CHECK (decision IN ('approved','rejected'))`; `proxy_strength text NOT NULL CHECK (proxy_strength IN ('direct','proxy'))`; `evidence_hash text NOT NULL`; `created_at timestamptz NOT NULL` | FK `gate_id → approval_gate.id`, `version_id → audio_version.id`, `approver_person_id → person.id`, `proxy_for_person_id → person.id`; indexes `(gate_id, version_id, created_at DESC)`, `(version_id, decision)`; RLS configured approver set and song owner; GRANT policy: configured approver/owner SELECT via RLS, approval function INSERT, UPDATE/DELETE revoked |

Grant invariant applies row-for-row: client API roles receive no direct table `GRANT`; authenticated reads and writes use the named RLS or command function, while the service role receives only least-privilege `GRANT EXECUTE` on that function. No raw table grant exposes audio, review, share, or approval data.

### Persistence invariants

- `audio_version` is immutable after ingestion. Hash, sequence, author status, labels, media metadata, descriptor projection and residency history are retained; erasure can redact identity but never remove version evidence.
- A lineage edge is acyclic. Unknown parentage commits as root or sibling with an explicit ambiguous state; no worker creates a guessed parent.
- Canonical slot mutation is an explicit CAS. Upload, review, release membership or package generation cannot auto-select a target. A compromised target raises an alarm and keeps the prior pointer until explicit clear/replace.
- Comments pin immutable versions and fixed audiences. Edits after five minutes or after reply/triage become attributed corrections or retractions. Uncertain carry is unplaced and never rendered as a guessed marker.
- Share links pin exact version, policy and expiry. Public links require acknowledged weaker guarantees; roster-authenticated access resolves to project identity without link analytics. Revocation invalidates tokens and caches immediately.
- Approval binds exact version, approver-set version and open-comment hash. Proxy strength is visible. Later versions require new approval.
- Descriptor corrections are exact `tempo_bpm` or `musical_key` facts. Authorized append and unauthorized proposal share one correction ID; no route writes a Song-level musical attribute or grants project access.

## Middleware & Policies

### Hono middleware order

1. `requestId` validates UUID and propagates it to response, audit, trace and provider-native diagnostics.
2. `cors(consumer-web-pwa)` applies web/PWA allowlist; PRJ-25 additionally requires `internal-release-web`; wildcard credentials are forbidden.
3. `authContext` resolves BE00 session, acting party and context version.
4. `rateLimit` applies party/identity/IP bucket, then strict Zod path/header/body validation.
5. `tenantScope` resolves song/version/slot under authorized projection before counts, links or comments are inspected.
6. `quarantineCheck` validates settled size/checksum for PRJ-08 and `integrityCheck` validates exact targets for PRJ-09/10/17 consumers.
7. `authorization` evaluates role, reservation, audience, approver set and exact descriptor capability.
8. `idempotency` reserves or replays fingerprint; `serializableCommand` performs expected-version CAS.
9. `auditOutbox` commits immutable row and event; `signedGrant` issues only scoped expiring playback/link tokens.
10. `responseFilter` removes private body, bytes, locator, link identity, roster names and descriptor values from event/status projections.

### Per-operation authorization matrix

| Operation ID | Required capability and ownership | 403 versus 404 | Idempotency and rate | CORS and output policy |
|---|---|---|---|---|
| `PRJ-08` | Upload-authorized song roster role | Hidden song/version 404; known non-uploader 403 | `(song, checksum, key)`; 20/minute/party | `consumer-web-pwa`; no storage locator or bytes |
| `PRJ-09` | Canonical authority plus slot reservation/proxy | Hidden slot 404; known non-authority 403 | `(slot, key)` and expected slot CAS; 60/minute/party | `consumer-web-pwa`; exact target status only |
| `PRJ-10` | Vault read for every comparison target | Hidden target 404; known denied target 403 | Comparison hash replay; 60/minute/identity | `consumer-web-pwa`; signed grants and degraded flag only |
| `PRJ-11` | Roster review role or pinned share audience | Hidden version 404; audience violation 403 | `(version, key)` and comment CAS; 60/minute/party | `consumer-web-pwa`; own audience only |
| `PRJ-12` | Version creator or song share authority | Hidden version 404; known no share authority 403 | `(version, recipient, key)`; 20/minute/party | `consumer-web-pwa`; recipient/public policy disclosed |
| `PRJ-13` | Producer role in song profile | Hidden song 404; known non-Producer 403 | `(song, key)` and batch CAS; 30/minute/party | `consumer-web-pwa`; reason visible to comment authors |
| `PRJ-14` | Configured approver or recorded proxy | Hidden version/gate 404; signer outside set 403 | `(gate, version, signer, key)`; 20/minute/party | `consumer-web-pwa`; proxy strength visible |
| `PRJ-25` | Exact-version owner or `version:edit_descriptors`; release actor may submit bounded proposal | Hidden version 404; known missing authority 403; proposal submitter sees safe status only | Shared correction ID and proposal CAS; 30/minute/party | `internal-release-web`; value-free event and no project read for submitter |

### Security and abuse controls

- Uploads remain quarantined until stable size and checksum. Media metadata checks reject path traversal, executable content, impossible duration/channel values and malformed checksums.
- Signed playback grants include target hash, identity hash, grant epoch and expiry. Edge/origin rechecks revocation for every new range request. Downloads are not retroactively recallable.
- Audience hash is fixed before comment entry. Recipient comments cannot enumerate other recipients, roster or hidden counts. Public-link acknowledgment is stored as policy evidence, not as broad access.
- Descriptor correction values are validated against field type and prior hash. Authority is resolved against the exact audio version; release role, authorship, generic vault read and Song membership alone never qualify.
- Rate abuse and replay buckets include 20 upload attempts, 20 share links, 60 comparison requests and 10 failed authority decisions per actor/target window. Responses remain the shared envelope.
- Logs and events contain hashes and safe enum values only. Private audio, comment body, link token, IP, external URI and descriptor value are excluded.

## Data Flow

### Transaction and external seams

| Seam | Exact request and response | Timeout | Retry | Circuit behavior |
|---|---|---:|---:|---|
| BE00 context/idempotency | `RequestContext { requestId, actorPersonId, actingPartyId?, contextVersion, key, fingerprint }` → `ContextDecision { accepted, replay, storedResult? }` | 100 ms | 0 retries; no backoff; in-process | N/A for network circuit (in-process); fail closed if context unavailable |
| BE00 quarantine/storage | `QuarantineProbe { blobId, checksum, bytes }` → `SettledBlob { settled, checksum, residency, integrity }` | 1,000 ms | 3 at 100 ms, 250 ms and 500 ms | Open after 4 failures for 20 s; retain pending state and return `UPLOAD_UNSETTLED` or `DEPENDENCY_UNAVAILABLE` |
| BE01 exact authority | `ResolveVersionAuthority { versionId, actorPersonId, capability }` → `AuthorityDecision { allowed, decisionRef, authorityVersion }` | 300 ms | 2 at 50 ms and 100 ms | Open after 5 failures for 30 s; no correction/approval mutation while open |
| BE07 role/audience | `ResolveReviewRole { songId, actorPartyId, capability }` → `RoleDecision { allowed, roleVersion, audienceHash }` | 400 ms | 2 at 75 ms and 150 ms | Open after 5 failures for 30 s; deny playback/review when unknown |
| Media validator | `ValidateMedia { checksum, bytes, mediaType, metadata }` → `MediaDecision { plausible, measuredMetadata, reasonCode }` | 1,500 ms | 2 at 100 ms and 300 ms | Open after 4 failures for 30 s; mark integrity `unverifiable`, never pass |
| Shard 22 correction origin | `ReleaseDescriptorOrigin { releaseVersionId, field, sharedCorrectionId, priorHash }` → `OriginReceipt { accepted, safeStatus, originVersion }` | 700 ms | 2 at 100 ms and 300 ms | Open after 5 failures for 30 s; create pending only with durable origin receipt |
| BE00 outbox/cache | `OutboxEnvelope { eventType, aggregateId, version, payloadHash }` → `EnqueueReceipt { eventId }` | 500 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 5 failures for 30 s; transaction cannot commit without durable event |

### State machines and concurrency

- Audio version: `ingesting → available | integrity_failed → tombstoned_bytes`; record is never edited/deleted.
- Canonical slot: `unset → set → changed → cleared`; each transition appends movement. A compromised target pauses at the existing pointer until explicit action.
- Comment: `open → resolved → reopened → resolved`, with `retracted` body state preserving history. Share link: `active → revoked | expired`.
- Descriptor proposal: `pending → accepted | rejected`; expected descriptor and proposal revisions plus unique shared correction ID serialize all races.
- Comparison is read-only. It may issue grants and degraded flags but never writes canonical, evidence or analytics state.
- All command transactions lock aggregate and expected version, write immutable evidence and outbox together. At-least-once consumers dedupe by event type, aggregate ID and version.

### Failure recovery

| Failure | Durable result | Retry/recovery |
|---|---|---|
| Upload still settling | No available version or a pending quarantine reference | Poll BE00 and retry same idempotency key |
| Checksum/plausibility failure | Version `integrity_failed`, bytes quarantined/tombstoned | Re-upload corrected bytes under new hash; old evidence remains |
| Ambiguous lineage | Root/sibling with explicit ambiguous state | Human adds later lineage edge after review |
| Canonical target compromised | Existing pointer preserved and blocking alarm appended | Explicit clear/replace after integrity passes |
| Comment carry uncertain | Unplaced comment retains original playback | Human re-anchors; no guessed marker |
| Share revoked mid-stream | New range requests fail and cache/token invalidated | Re-authorize under current role; old bytes remain unrecalled |
| Approval snapshot stale | No approval append | Re-open exact version and sign new snapshot |
| Descriptor authority revoked | Proposal remains pending or append rolls back | Authorized owner/Producer reviews with current revision |
| Concurrent proposal review | One expected-version terminal result wins | Loser receives committed terminal status |

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery |
|---|---|---|
| `project.version.ingested.v1` | `eventId uuid`, `songId uuid`, `versionId uuid`, `sequence integer`, `lineageState`, `integrity`, `residency`, `checksum text`, `version bigint` | No bytes, locator, private label or contact; outbox dedupe |
| `project.version-descriptor-correction.changed.v1` | `eventId uuid`, `audioVersionId uuid`, `field`, `sharedCorrectionId uuid`, `proposalId uuid?`, `state`, `descriptorRevision bigint`, `version bigint` | Deliberately no descriptor value; linked-release consumers fetch authorized projection |
| `project.canonical.changed.v1` | `eventId uuid`, `songId uuid`, `slotId uuid`, `oldTargetId uuid?`, `newTargetId uuid?`, `reasonCode`, `version bigint` | No audio bytes or unauthorized metadata |
| `project.review.changed.v1` | `eventId uuid`, `commentId uuid?`, `versionId uuid`, `audienceHash text`, `state`, `anchorHash text`, `version bigint` | No body, recipient identity or hidden counts |
| `project.approval.recorded.v1` | `eventId uuid`, `gateId uuid`, `versionId uuid`, `approverRefHash text`, `proxyStrength`, `openCommentHash text`, `decision`, `version bigint` | No approver PII or comment body |
| `project.access.changed.v1` | `eventId uuid`, `versionId uuid`, `reasonCode`, `revocationEpoch bigint` | Consumed for token invalidation; no audience membership |
| `project.package.generated.v1` | `eventId uuid`, `packageId uuid`, `manifestHash text`, `checksum text` | Consumed only; package owner is 09d |

## Error Handling

### Boundary mapping

| Condition | HTTP | `code` | Safe details |
|---|---:|---|---|
| Invalid metadata, anchor, policy or correction value | 400 | `VALIDATION_FAILED` | Field paths and allowed bounds |
| Hidden song/version/slot/gate | 404 | `RESOURCE_NOT_FOUND` | Empty details |
| Known actor without role, reservation, audience or authority | 403 | `FORBIDDEN` | Required action only |
| Quarantine not settled | 409 | `UPLOAD_UNSETTLED` | Blob status and retry-after bucket |
| Checksum/plausibility failed | 422 | `INTEGRITY_FAILED` | Safe reason, no bytes |
| Slot target absent or explicit clear required | 409 | `CANONICAL_UNSET` | Slot ID and action |
| Grant/link/token revoked | 403 | `ACCESS_REVOKED` | Reauthorize action |
| NDA/sensitivity prevents playback | 403 | `NDA_REQUIRED` | Terms hash, no terms text |
| Unreadable target | 404 | `ASSET_NOT_FOUND` | No target name/count |
| Expected version/hash moved | 409 | `VERSION_CONFLICT` | Safe committed version |
| Exact descriptor target/revision moved | 409 | `VERSION_DESCRIPTOR_TARGET_STALE` | Rebase required |
| Second terminal proposal decision | 409 | `DESCRIPTOR_PROPOSAL_CONFLICT` | Existing terminal state only |
| Storage/authority/validator unavailable | 503 | `DEPENDENCY_UNAVAILABLE` | Retry-after bucket |

### Operation error coverage

| Operation ID | 400 | 403 | 404 | 409 | 422/503 |
|---|---|---|---|---|---|
| `PRJ-08` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `UPLOAD_UNSETTLED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `INTEGRITY_FAILED`, `DEPENDENCY_UNAVAILABLE` |
| `PRJ-09` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `CANONICAL_UNSET`, `IDEMPOTENCY_MISMATCH` | `INTEGRITY_FAILED`, `DEPENDENCY_UNAVAILABLE` |
| `PRJ-10` | `VALIDATION_FAILED` | `FORBIDDEN`, `ACCESS_REVOKED`, `NDA_REQUIRED` | `RESOURCE_NOT_FOUND`, `ASSET_NOT_FOUND` | `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-11` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-12` | `VALIDATION_FAILED` | `FORBIDDEN`, `ACCESS_REVOKED` | `RESOURCE_NOT_FOUND`, `ASSET_NOT_FOUND` | `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-13` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-14` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-25` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_DESCRIPTOR_TARGET_STALE`, `DESCRIPTOR_PROPOSAL_CONFLICT`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |

Every branch serializes `ApiError { code, message, requestId, details }`; error logs include operation ID and reason code only.

## Observability

| Operation ID | Metrics | Structured logs | Trace and alerts |
|---|---|---|---|
| `PRJ-08` | ingest attempts, settle latency, checksum/integrity outcomes, lineage ambiguity | song/version IDs, hash, bytes, residency, result | `prj.audio.ingest`; alert integrity-failure and quarantine-lag spikes |
| `PRJ-09` | slot moves, clears, CAS conflicts, compromised-target alarms | slot ID, old/new target hashes, actor hash, result | `prj.canonical.nominate`; alert auto-selection attempts |
| `PRJ-10` | comparison size, grant denials, degraded streams, revocation hits | comparison ID, target hashes, mode, degraded flags | `prj.audio.compare`; alert repeated cross-sensitivity attempts |
| `PRJ-11` | comments, anchor failures, retractions, uncertain carries | version/comment IDs, audience hash, anchor hash, result | `prj.review.comment`; alert audience violations |
| `PRJ-12` | links by mode, first-access latency, revocations, cap hits | link/version IDs, recipient hash, policy hash, result | `prj.review.share`; alert token replay and public-link spikes |
| `PRJ-13` | triage batch size, contradiction flags, conflicts | song/batch IDs, decision, reason hash, result | `prj.review.triage`; alert unbounded batch attempts |
| `PRJ-14` | approvals by decision/proxy, stale hashes, gate conflicts | gate/version IDs, approver hash, proxy strength, result | `prj.review.approval`; alert signer-set anomalies |
| `PRJ-25` | append/proposal/review outcomes, stale target, terminal conflicts | version ID, field, shared ID, action, authority result | `prj.version.descriptor_correction`; alert repeated prior-hash mismatch |

No logs or structured diagnostic events contain audio bytes, body text, link token, recipient identity, storage locator or descriptor value. Trace baggage uses opaque aggregate IDs and request IDs.

## Testing Strategy

### Contract and route tests

| Operation ID | Required tests |
|---|---|
| `PRJ-08` | Strict metadata/checksum and settled-blob schema; duplicate hash/key replay; integrity failure; unknown author visible; ambiguous parent root/sibling; upload role 403 and hidden song 404; CORS and exact ApiError |
| `PRJ-09` | Explicit set/clear discriminator; slot reservation and proxy; target integrity; no latest fallback; CAS race; compromised pointer alarm; CORS and exact ApiError |
| `PRJ-10` | All target authorization; 2–8 bound; lower bitrate fallback and degraded announcement; grant revocation; no canonical/analytics mutation; CORS and exact ApiError |
| `PRJ-11` | Point/range bounds; audience immutability; five-minute edit/no-reply rule; retraction; uncertain carry unplaced; recipient isolation; CORS and exact ApiError |
| `PRJ-12` | Recipient/public discriminator; acknowledgment gate; recipient pin/expiry/cap; first-access expiry; roster identity non-count; revoke token/cache; CORS and exact ApiError |
| `PRJ-13` | Producer-only triage; reason required; contradictory cluster/flag; batch CAS and idempotency; no assistant adjudication; CORS and exact ApiError |
| `PRJ-14` | Approver/proxy set; exact version/comment hash; visible weaker proxy; stale conflict; no inherited approval; CORS and exact ApiError |
| `PRJ-25` | Field/value discriminator; owner append versus proposal; exact authority; shared-ID uniqueness; stale target; one terminal review winner; value-free event; CORS and exact ApiError |

### Persistence, concurrency and recovery tests

- Migration tests assert every listed SQL type, nullability, check, FK or opaque rationale, index, RLS policy and grant. Client cannot update/delete immutable tables.
- Property tests prove lineage acyclicity, no silent canonical, no cross-audience comment, no public-link guarantee without acknowledgment, and no correction to Song musical state.
- Serializable race tests cover upload deduplication, slot CAS, comment edits, share revocation, approver-set changes and shared correction/proposal terminal transitions.
- Worker tests duplicate ingest/review/canonical/access events and assert event-version deduplication, cache purge and no privilege widening.
- Media and storage tests inject unsettled bytes, validator outage, checksum mismatch and tombstoned residency; retries preserve the original key and evidence.
- Playwright tests cover keyboard playback controls, linear comment list and anchor text, focus-stable denial, public-link guarantee copy and visible proxy status.

## Deepening Passes

| Pass | Evidence and resolution |
|---|---|
| Boundary | Eight interactions and thirteen models traced to IA lines 85–91, 102 and 188–194; no container, roster, session or package ownership overlap |
| Contract | Strict Zod 4 contracts cover metadata, discriminated correction fields, audiences, exact hashes and shared error envelope |
| Authority | Canonical reservation, approver set and exact descriptor capability are separate; release access never grants project authority |
| Integrity | Stable checksum/quarantine, plausibility, residency and no-latest-fallback controls are explicit |
| Privacy | Events omit bytes, bodies, link identity, roster names, locators and descriptor values; RLS precedes counts and streams |
| Concurrency | CAS and idempotency cover all eight operations; proposal terminal state and shared correction ID are unique |
| State | Ingest, canonical, comment, link, approval and correction machines enumerate terminal/recovery transitions |
| Recovery | Stale target, revocation, ambiguous lineage, validator outage and partial outbox writes have durable recovery |
| Accessibility | Degraded playback is announced, comments have linear/keyboard anchors, proxy weakness and denials are textual |
| Cross-shard | BE00/01/07, Shard 22 and media seams have exact payload, timeout, retry and circuit behavior |

## Ambiguity Gate

PASS. Evidence: all eight IA interactions map one-to-one to authoritative routes and every route has CORS plus exact `ApiError { code, message, requestId, details }`; thirteen assigned model identifiers are present with typed fields, constraints, FKs or opaque rationale, indexes, RLS and grants; audio bytes, canonical selection, audience, approval and descriptor authority have non-overlapping ownership; one shared correction ID serializes append/proposal/review; all matrix/test/observability rows key every operation; table/link/marker checks are defined; and no open implementation decision was added.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored immutable audio version, lineage, review, share, approval and descriptor-correction backend companion | `/write-be-spec` | All |
| 2026-08-28 | Locked exact-version authority, strict Zod 4 contracts, typed persistence, RLS/grants, state recovery and ambiguity evidence | `/write-be-spec-write` | API, contracts, database, security, tests |

## Dependency References

- [BE00 Cross-cutting platform foundation](00-infrastructure.md) — request context, errors, idempotency, storage quarantine, signed grants, cache, audit and outbox.
- [IA Shard 01 Identity authority](../ia/01-identity-authority.md) — party, authority and succession source.
- [IA Shard 07 Credits core](../ia/07-credits-core.md) — role taxonomy and credit boundary.
- [IA Shard 09 parent](../ia/09-projects-collaboration.md) — assigned interactions, contracts, models, events and feature limits.
- [IA Shard 22 Release and distribution](../ia/22-release-distribution.md) — release-origin correction request and release-local ownership boundary.
