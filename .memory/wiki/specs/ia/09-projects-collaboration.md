# Shard 09 — Music projects and collaboration

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/09-projects-collaboration.md](deep-dives/09-projects-collaboration.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 09 is the private working record for songs, releases, project membership, creative documents, rosters, access, immutable audio lineage, review, sessions, mix/master workflow and delivery readiness. It owns workspace containers and pointers, not credits, rights, splits, payments, releases or distribution truth. V1 is web/PWA-first: manual uploads, session/roster prefill and in-app/web-push capture operate without a local DAW agent.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 9 |
| In-scope source documents loaded | 55 |
| Child capabilities reconciled | 38 |
| Added or removed feature boundaries | 0 |
| V1 bridge boundary | No local agent, watch folder, DAW parser, take ingest, environment manifest or moment-of-use prompt |
| V1 substitute | Manual upload, inferred/asked lineage, PWA push/in-app close prompt, roster/session prefill, labelled zip archives |
| Proposed “won’t” capabilities | Format-specific master logic and Atmos product surface collapse to purpose-labelled/parallel lineage data |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **07.01 Song, Release & Production Board** — minimal song containers, release membership/sequencing, fixed production stages and non-blocking milestone debt.
- **07.02 Songwriting & Composition Workspace** — immutable idea inbox, lyric line attribution and transposable chord/arrangement charts.
- **07.03 Contributors, Access & Confidentiality** — per-song roster/claim events, scoped invitations, role-derived vault access, sensitivity and NDA gates.
- **07.04 Audio Version Control & Lineage** — immutable version records, mutable canonical slots, take/comp lineage, stem standards, integrity/plausibility and A/B comparison.
- **07.05 Review, Feedback & Approval** — timestamp/range comments, safe share links, Producer triage, version-pinned approvals and advisory revision counting.
- **07.06 Sessions, Documentation & Recall** — first-class sessions, close/capture arbitration, labelled archives and combined track/channel/recall sheets.
- **07.07 Mix & Master Workflow** — reference briefs, variant matrix, objective loudness reporting and purpose-labelled/parallel deliverables.
- **07.08 Delivery, Readiness & QC** — pinned recipient packages, narrow objective QC, target-specific debt ledger, source declarations and gated remix stems.
- **07.09 DAW Bridge & Capture-at-Source** — future watch-folder/parser/local capture surfaces behind explicit evidence gate; no non-web client in v1.

### Delivery Phases

| Phase | Enabled boundary |
|---|---|
| Consumer launch | Song/release board, creative docs, roster/access/vault, manual version upload/canonical slots, review/share/approval, sessions/close prompt, manual package/QC/readiness |
| Later activation | Local watch-folder agent, supported DAW parsing, take/comp ingest, environment manifests, missing-media resolution and moment-of-use declarations |
| Explicitly excluded | Audio-hosted commercial references, arbitrary project stages, per-asset hand grants, silent auto-canonical, claimed leak prevention, DAW plugin before agent evidence, automated rights/split inference |

## Acceptance Criteria

- **AC-PRJ-01 — Create/manage song:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Title-only creation; owning party required; lifecycle and stage separate; non-empty song archives but never hard-deletes, and (6) return Song version and owner/context audit commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-02 — Assemble release:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner adds song membership edges, sequence, variant and pinned master; release never copies song/version truth, and (6) return Ordered membership version saved; readiness re-derived; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-03 — Move production stage:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized actor selects fixed stage; deadlines/capture prompts remain advisory and non-blocking, and (6) return Stage event and completeness debt update; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-04 — Capture idea or edit creative doc:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Offline idea is immutable and nameless; lyrics/charts version independently with line attribution/section anchors, and (6) return Artifact/version/origin and local timestamp preserved; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-05 — Manage roster:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized role adds party/shell/entity plus canonical/pending role; roster event emits Shard 07 claim; removal separates involvement from attribution, and (6) return Roster projection, claim command and notices commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-06 — Invite contributor:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Invite discloses context before signup through T0/T1/T2 ladder; asset access binds verified identity/NDA, not bearer link, and (6) return Delivery state, typed response and scoped grant recorded; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-07 — Access vault asset:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Policy intersects all current song roles with asset sensitivity and accepted NDA version; denied access is explained, and (6) return Short-lived stream/download grant or explicit denial; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-08 — Upload audio version:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Manual upload settles, hashes and creates immutable record/bytes residency; parent inferred or asked; no silent type/canonical choice, and (6) return Version sequence, lineage and integrity state commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-09 — Nominate canonical:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized actor deliberately sets/clears one stage/variant/format slot against exact version; pointer moves, log is immutable, and (6) return Slot version and roster notification commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-10 — Compare versions/stems:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized user streams lower-bitrate fallback if needed, loudness-matches by default and sees degraded state, and (6) return Playback has no canonical/evidence side effect; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-11 — Comment/review version:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Comment anchors point/range to immutable version with fixed audience; explicit carry follows direct lineage only, and (6) return Comment/version/audience hash commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-12 — Share private review:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Creator issues per-recipient or explicitly weaker public link pinned to version, expiry, watermark and disclosed analytics mode, and (6) return Link, recipient policy and revoke authority recorded; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-13 — Triage feedback:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Producer clusters/flags contradictions and accepts/rejects with reason; assistant never resolves creative conflict, and (6) return Triage state and author-visible reason commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-14 — Approve version:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configured approver/proxy signs exact version/open-comment snapshot; later version requires new approval, and (6) return Append-only approval evidence recorded; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-15 — Create/close session:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Human confirms inferred/manual session, attendance and owner; close commits before capture asks and supports bounded reopen, and (6) return Session state/version and close event commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-16 — Complete close prompt:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Tiered moment asks prefilled contributor facts, then at most one Producer heavyweight ask; silence/dismissal accrues debt only, and (6) return Stable ask/answer IDs; session remains closed; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-17 — Build handoff package:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User chooses owned recipient spec; canonicals resolve then pin; exact required assets only; integrity blocks, other gaps warn, and (6) return Immutable package manifest/artifact and validation report; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-18 — Run QC/readiness:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Target-specific objective checks and actionable debt derive on demand; unverifiable is distinct from passed, and (6) return Live readiness projection or pinned package result; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-19 — Declare source use:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized contributor appends sample/interpolation/AI source fact to asset/section; unknown/not-reviewed/none remain distinct, and (6) return Declaration version and downstream clearance reference emitted; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-PRJ-20 — Activate DAW bridge:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner may enable only after architecture evidence gate, supported-agent version and least-read-scope proof; unavailable in v1, and (6) return Signed device grant/agent state or gated denial; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| PRJ-01 | Create/manage song | Title-only creation; owning party required; lifecycle and stage separate; non-empty song archives but never hard-deletes. | Song version and owner/context audit commit. |
| PRJ-02 | Assemble release | Owner adds song membership edges, sequence, variant and pinned master; release never copies song/version truth. | Ordered membership version saved; readiness re-derived. |
| PRJ-03 | Move production stage | Authorized actor selects fixed stage; deadlines/capture prompts remain advisory and non-blocking. | Stage event and completeness debt update. |
| PRJ-04 | Capture idea or edit creative doc | Offline idea is immutable and nameless; lyrics/charts version independently with line attribution/section anchors. | Artifact/version/origin and local timestamp preserved. |
| PRJ-05 | Manage roster | Authorized role adds party/shell/entity plus canonical/pending role; roster event emits Shard 07 claim; removal separates involvement from attribution. | Roster projection, claim command and notices commit. |
| PRJ-06 | Invite contributor | Invite discloses context before signup through T0/T1/T2 ladder; asset access binds verified identity/NDA, not bearer link. | Delivery state, typed response and scoped grant recorded. |
| PRJ-07 | Access vault asset | Policy intersects all current song roles with asset sensitivity and accepted NDA version; denied access is explained. | Short-lived stream/download grant or explicit denial. |
| PRJ-08 | Upload audio version | Manual upload settles, hashes and creates immutable record/bytes residency; parent inferred or asked; no silent type/canonical choice. | Version sequence, lineage and integrity state commit. |
| PRJ-09 | Nominate canonical | Authorized actor deliberately sets/clears one stage/variant/format slot against exact version; pointer moves, log is immutable. | Slot version and roster notification commit. |
| PRJ-10 | Compare versions/stems | Authorized user streams lower-bitrate fallback if needed, loudness-matches by default and sees degraded state. | Playback has no canonical/evidence side effect. |
| PRJ-11 | Comment/review version | Comment anchors point/range to immutable version with fixed audience; explicit carry follows direct lineage only. | Comment/version/audience hash commits. |
| PRJ-12 | Share private review | Creator issues per-recipient or explicitly weaker public link pinned to version, expiry, watermark and disclosed analytics mode. | Link, recipient policy and revoke authority recorded. |
| PRJ-13 | Triage feedback | Producer clusters/flags contradictions and accepts/rejects with reason; assistant never resolves creative conflict. | Triage state and author-visible reason commit. |
| PRJ-14 | Approve version | Configured approver/proxy signs exact version/open-comment snapshot; later version requires new approval. | Append-only approval evidence recorded. |
| PRJ-15 | Create/close session | Human confirms inferred/manual session, attendance and owner; close commits before capture asks and supports bounded reopen. | Session state/version and close event commit. |
| PRJ-16 | Complete close prompt | Tiered moment asks prefilled contributor facts, then at most one Producer heavyweight ask; silence/dismissal accrues debt only. | Stable ask/answer IDs; session remains closed. |
| PRJ-17 | Build handoff package | User chooses owned recipient spec; canonicals resolve then pin; exact required assets only; integrity blocks, other gaps warn. | Immutable package manifest/artifact and validation report. |
| PRJ-18 | Run QC/readiness | Target-specific objective checks and actionable debt derive on demand; unverifiable is distinct from passed. | Live readiness projection or pinned package result. |
| PRJ-19 | Declare source use | Authorized contributor appends sample/interpolation/AI source fact to asset/section; unknown/not-reviewed/none remain distinct. | Declaration version and downstream clearance reference emitted. |
| PRJ-20 | Activate DAW bridge | Owner may enable only after architecture evidence gate, supported-agent version and least-read-scope proof; unavailable in v1. | Signed device grant/agent state or gated denial. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id?`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and song/project scope.
- Container ownership, workspace access, contribution credit, rights ownership and payment are independent state machines.
- Records are immutable/versioned; mutable pointers such as stage/canonical/access projection have append-only movement logs.
- Non-blocking capture creates explicit completeness debt; missing/unknown/unverifiable never becomes false completion.
- Confidentiality/sensitivity authorization precedes listing, counts, search, streaming, URLs, comments, analytics and packages.
- V1 surfaces never imply DAW observation, environment verification, missing-media parsing or automatic source detection.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `SongLifecycle` | `active | shelved | archived | unadministered` |
| `ProductionStage` | Fixed versioned set from idea through delivered; no arbitrary admin/user stages |
| `SensitivityClass` | `roster | review | stems | takes | restricted` with approved role-profile version |
| `VersionResidency` | `hot | cold | tombstoned`; record always retained |
| `LineageCharacter` | `same_recording | new_recording` |
| `SessionGrade` | `captured | confirmed | reconstructed` |
| `ReadinessGap` | `blocking_integrity | warning | opaque_dependency | unverifiable` |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, ROLE_UNRESOLVED, NDA_REQUIRED, ACCESS_REVOKED, ASSET_NOT_FOUND, UPLOAD_UNSETTLED, INTEGRITY_FAILED, CANONICAL_UNSET, SOURCE_STALE, BRIDGE_DISABLED` |

### Containers, Roster and Access

| Contract | Invariant |
|---|---|
| `CreateSong` | Title only required; song belongs to party and is never rights object. Duplicate proposal scoped to owner and never auto-merges. |
| `ChangeRoster` | Per-song append-only event. Role is Shard 07 taxonomy; unresolved role commits literal/claim but derived access fails closed. |
| `EndInvolvement` | Revokes derived access immediately while attribution persists. Retract claim is separate Shard 07/06 path. |
| `IssueInvitation` | T0 previews inviter/role only; T1 may stream non-confidential pinned rough; T2 requires identity and NDA before grants. |
| `ResolveVaultAccess` | Union of current roster roles intersected with asset sensitivity, block state, NDA and role-profile version; no hand grants. |
| `RevokeAccess` | Invalidates active URLs/tokens and future streams immediately; bytes already downloaded cannot be reclaimed or represented as protected. |

### Versions, Review and Sessions

| Contract | Invariant |
|---|---|
| `IngestVersion` | Bytes settle then checksum; immutable sequence/author/label/metadata/lineage record. Author never null; unknown marked unconfirmed. |
| `SetCanonical` | Explicit compare-and-set slot pointer; no upload auto-selection. Missing target refuses to guess; compromised target alarms, no silent fallback. |
| `AppendReviewComment` | Immutable version/audience anchor; five-minute no-reply typo edit and attributed retraction only. |
| `CarryComment` | Direct-lineage open comment view; uncertain mapping enters unplaced list, never guessed marker. |
| `CreateShareLink` | Pins version; recipient-specific identity/watermark/analytics/expiry policy. Roster identity supersedes link identity. |
| `RecordApproval` | Exact version, approver set, proxy strength and open-comment hash; append-only. |
| `CloseSession` | Close transaction precedes outbox asks; reopen rules never recall dispatched asks. Attendance remains independent from contribution. |

### Delivery, QC and Bridge

| Contract | Invariant |
|---|---|
| `BuildPackage` | Recipient-spec version plus resolved canonical IDs become immutable pins. Oversending prohibited. Integrity failure blocks; all other gaps warn. |
| `EvaluateAudioQC` | Narrow objective checks only; true peak/loudness/plausibility may warn, integrity may block; dismissal sticky per project/check version. |
| `EvaluateReadiness` | Target-selected live weighted gap list; no global score or nagging; inaccessible dependency shown opaque. |
| `RecordSourceDeclaration` | Asset/section-scoped append-only fact with author and state `none | unknown | declared | not_reviewed`; removal returns to not-reviewed. |
| `ActivateBridge` | Requires approved local-agent evidence, signed version, least-readable path proof and revocable device grant. No v1 implementation. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `song` / `song_title_version` | Owning party, lifecycle/stage/version; append-only working-title history, never rights data. |
| `project` / `project_song_membership` | Many-to-many container edge; independent ownership/access. |
| `release_container` / `release_membership` | Sequence, song, variant, pinned master version; unique position/version. |
| `milestone` / `completeness_debt` | Advisory deadline/stage prompt and unresolved non-blocking ask. |
| `idea_artifact` / `lyric_document_version` / `chart_version` | Immutable idea origin; versioned text/line attribution/section/chord symbols. |
| `roster_event` / `roster_projection` | Party/shell/entity, role/literal, access profile, inviter/author, involvement interval, Shard 07 claim ID. |
| `contributor_invitation` | Entries, disclosure tier, recipient binding, typed response, delegate/delegator, expiry/contact suppression. |
| `asset` / `asset_blob` | Song/version linkage, sensitivity, media metadata; immutable blob hash and residency. |
| `nda_acceptance` / `access_grant` | Identity/terms/version/time plus derived short-lived grant/revocation. |
| `audio_version` / `lineage_edge` | Song sequence, author, producer label, type suggestion, checksums, metadata, parent/character. |
| `canonical_slot` / `canonical_movement` | Stage/variant/format pointer, reservation/proxy state and immutable movement log. |
| `review_comment` / `comment_anchor` / `triage_record` | Version/audience/body history, temporal/musical anchor, carry/reopen/triage state. |
| `share_link` / `share_access_event` | Pinned version, recipient/public mode, watermark, expiry/cap, analytics consent and anomaly state. |
| `approval_gate` / `approval_record` | Configured approvers and version/open-comment snapshot/proxy evidence. |
| `session` / `attendance_assertion` | Owner, source links, grade, sensitivity, active/closed/reopen times and set-valued attendance. |
| `capture_moment` / `capture_ask` | Close/batch key, tier budget, payload owner, dispatch/answer/debt state. |
| `environment_archive` / `recall_sheet_version` | Labelled asset archive/manifest availability and filtered track/channel/room data. |
| `recipient_spec_version` / `handoff_package` | Owned spec, canonical pins, exact manifest, validation and artifact checksum. |
| `qc_result` / `readiness_projection` | Check/spec/source versions, outcome/dismissal and target-specific gap manifest. |
| `source_declaration` | Asset/section, declaration kind/state/details, author, supersession and clearance reference. |
| `bridge_device` / `bridge_ingest` | Future device/agent/grant/read scope/heartbeat and local queue/ingest state; disabled v1. |
| `project_audit_event` | Immutable actor/context/action/target/before-after/evidence/request hashes. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`song`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owning party, lifecycle/stage/version; append-only working-title history, never rights data..
- **`song_title_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owning party, lifecycle/stage/version; append-only working-title history, never rights data..
- **`project`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Many-to-many container edge; independent ownership/access..
- **`project_song_membership`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Many-to-many container edge; independent ownership/access..
- **`release_container`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Sequence, song, variant, pinned master version; unique position/version..
- **`release_membership`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Sequence, song, variant, pinned master version; unique position/version..
- **`milestone`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Advisory deadline/stage prompt and unresolved non-blocking ask..
- **`completeness_debt`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Advisory deadline/stage prompt and unresolved non-blocking ask..
- **`idea_artifact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable idea origin; versioned text/line attribution/section/chord symbols..
- **`lyric_document_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable idea origin; versioned text/line attribution/section/chord symbols..
- **`chart_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable idea origin; versioned text/line attribution/section/chord symbols..
- **`roster_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party/shell/entity, role/literal, access profile, inviter/author, involvement interval, Shard 07 claim ID..
- **`roster_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party/shell/entity, role/literal, access profile, inviter/author, involvement interval, Shard 07 claim ID..
- **`contributor_invitation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Entries, disclosure tier, recipient binding, typed response, delegate/delegator, expiry/contact suppression..
- **`asset`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Song/version linkage, sensitivity, media metadata; immutable blob hash and residency..
- **`asset_blob`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Song/version linkage, sensitivity, media metadata; immutable blob hash and residency..
- **`nda_acceptance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Identity/terms/version/time plus derived short-lived grant/revocation..
- **`access_grant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Identity/terms/version/time plus derived short-lived grant/revocation..
- **`audio_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Song sequence, author, producer label, type suggestion, checksums, metadata, parent/character..
- **`lineage_edge`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Song sequence, author, producer label, type suggestion, checksums, metadata, parent/character..
- **`canonical_slot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stage/variant/format pointer, reservation/proxy state and immutable movement log..
- **`canonical_movement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stage/variant/format pointer, reservation/proxy state and immutable movement log..
- **`review_comment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Version/audience/body history, temporal/musical anchor, carry/reopen/triage state..
- **`comment_anchor`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Version/audience/body history, temporal/musical anchor, carry/reopen/triage state..
- **`triage_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Version/audience/body history, temporal/musical anchor, carry/reopen/triage state..
- **`share_link`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pinned version, recipient/public mode, watermark, expiry/cap, analytics consent and anomaly state..
- **`share_access_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pinned version, recipient/public mode, watermark, expiry/cap, analytics consent and anomaly state..
- **`approval_gate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Configured approvers and version/open-comment snapshot/proxy evidence..
- **`approval_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Configured approvers and version/open-comment snapshot/proxy evidence..
- **`session`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, source links, grade, sensitivity, active/closed/reopen times and set-valued attendance..
- **`attendance_assertion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, source links, grade, sensitivity, active/closed/reopen times and set-valued attendance..
- **`capture_moment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Close/batch key, tier budget, payload owner, dispatch/answer/debt state..
- **`capture_ask`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Close/batch key, tier budget, payload owner, dispatch/answer/debt state..
- **`environment_archive`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Labelled asset archive/manifest availability and filtered track/channel/room data..
- **`recall_sheet_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Labelled asset archive/manifest availability and filtered track/channel/room data..
- **`recipient_spec_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owned spec, canonical pins, exact manifest, validation and artifact checksum..
- **`handoff_package`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owned spec, canonical pins, exact manifest, validation and artifact checksum..
- **`qc_result`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Check/spec/source versions, outcome/dismissal and target-specific gap manifest..
- **`readiness_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Check/spec/source versions, outcome/dismissal and target-specific gap manifest..
- **`source_declaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Asset/section, declaration kind/state/details, author, supersession and clearance reference..
- **`bridge_device`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future device/agent/grant/read scope/heartbeat and local queue/ingest state; disabled v1..
- **`bridge_ingest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future device/agent/grant/read scope/heartbeat and local queue/ingest state; disabled v1..
- **`project_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable actor/context/action/target/before-after/evidence/request hashes..

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Song/project owner | Container/roster/profile/spec management and all authorized creative records | Rewrite credits/rights/splits, bypass sensitivity/NDA or delete immutable versions |
| Producer role | Default roster write/invite, versions/canonical/review/triage/session/package within song profile | Escalate grants beyond own profile or suppress credited-party attribution |
| Musician/contributor | Own roster/claim response, authorized vault, upload/review/session/attestation and own declarations | Browse non-overlapping/restricted personnel or act for another contributor |
| Operator/room | Booking-linked event, headcount/contact and room gear/patch subset | Music, track names, creative attendance, capture-prompt status or split/credit answers |
| Link recipient | Pinned version and own thread under link policy | Roster/internal/other-recipient comments or broader project context |
| Approver/client | Exact approval/review scope, possibly non-user identity | Canonical/roster/vault administration unless separately granted |
| Package recipient | Expiring exact package manifest | Project browse, extra assets or live canonical following |
| Bridge device | Future scoped local ingest for approved owner/device/path | Arbitrary filesystem read, credentials, canonical/credit/rights mutation |
| System worker | Idempotent projection, hashing, prompts, purge, package/QC and notifications | Creative judgment, attendance assertion, auto-canonical or source classification |

### Access Escalation

- **Song/project owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Producer role:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Musician/contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Operator/room:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Link recipient:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Approver/client:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Package recipient:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Bridge device:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Boards automatically switch to dense semantic tables at high counts; drag interactions have keyboard reorder/actions and announced results.
- Creative documents preserve headings, line/section anchors and attribution in reading modes; charts provide transposed text views.
- Waveform comments and A/B comparison have time inputs, transcript/linear comment lists and keyboard-complete playback controls.
- Access denial names required action without leaking hidden asset names; NDA/consequence text precedes acceptance.
- Close prompts are short, focus-stable and never trap dismissal; silence/unverified/debt states use dignified text, not red failure styling.
- Readiness/QC/package gaps are ordered semantic lists with exact affected file/action and unverifiable distinct from passed.
- Offline/conflict/degraded playback states are announced and preserve work; no visual graph is required to understand lineage.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `project.song.changed.v1` | Song/owner/lifecycle/stage/version/hash | Board, search, Shards 10/22 |
| `project.roster.changed.v1` | Song/party-or-shell/role/event/access profile/version | Shard 07 claims, vault, notifications |
| `project.access.changed.v1` | Song/subject/profile/reason/state/version | Vault/link token revocation, downstream workspaces |
| `project.version.ingested.v1` | Song/version/sequence/lineage/integrity/residency/hash | Canonical, review, QC, credit capture |
| `project.canonical.changed.v1` | Song/slot/old/new/reason/version | Release/package/retention/roster notices |
| `project.review.changed.v1` | Comment/version/audience/state/anchor hash | Authorized review/triage projector |
| `project.session.closed.v1` | Session/song-links/grade/close/batch/version | Shard 07 capture, Shard 10 split capture, prompt arbiter |
| `project.approval.recorded.v1` | Gate/version/approver/proxy/comment hash | Stage/readiness/package projection |
| `project.package.generated.v1` | Package/spec/pins/manifest/validation/checksum | Recipient delivery, audit |
| `project.source-declaration.changed.v1` | Asset/section/state/kind/version | Shards 10/20/22 clearance/readiness |
| `project.bridge.state-changed.v1` | Device/agent/gate/state/version | Owner diagnostics only; disabled v1 |

Events exclude asset bytes, titles for confidential songs, comments, invite contacts, attendance names, link identities, NDA terms, source notes and unrestricted PII.

## Edge Cases

| Case | Required result |
|---|---|
| Owner account disappears | Song becomes unadministered or authority transfers through Shard 01; records remain. |
| Role taxonomy unavailable | Roster/claim commits literal; access fails closed until role profile resolves. |
| Invite forwarded | T0 context only; T1/T2 access binds intended/verified identity, not bearer. |
| Access revoked mid-stream | New reads fail immediately; active grant/token invalidated; downloaded bytes cannot be recalled. |
| Duplicate/offline upload | Hash/idempotency deduplicates record; differing metadata becomes attributed correction, not overwrite. |
| Parent lineage ambiguous | Version commits as root/sibling and asks later; never blocks or invents parent. |
| Canonical target compromised | Alarm and explicit unset/replacement; no silent fallback to latest. |
| Comment carried with low confidence | Unplaced list with original playback; no guessed marker. |
| Link opens under roster account | Resolve to project identity without link analytics; creator sees explained non-count. |
| Session auto-closes then resumes | Reopen within six hours; dispatched asks remain, close batch rules prevent duplicate moment. |
| Package source changes during build | `SOURCE_STALE` and rebuild; no mixed-version package. |
| Unknown DAW/archive format | Preserve bytes and label manifest/parsing unavailable; never verified. |
| Integrity check fails | Block package and name exact file/action; other QC warnings remain non-blocking. |
| V1 source declaration lacks DAW prompt | Voluntary manual declaration only; not-reviewed remains honest default. |
| Local agent requested in v1 | `BRIDGE_DISABLED` with evidence-gate explanation; no hidden desktop dependency. |

## Surface Applicability

Responsive web/PWA only at launch. Manual uploads, streaming review, offline idea/roll work and web-push/in-app capture are supported. Any local agent is a separately gated future surface, not an assumed extension.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| PRJ-01 Create/manage song | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-02 Assemble release | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-03 Move production stage | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-04 Capture idea or edit creative doc | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-05 Manage roster | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-06 Invite contributor | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-07 Access vault asset | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-08 Upload audio version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-09 Nominate canonical | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-10 Compare versions/stems | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-11 Comment/review version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-12 Share private review | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-13 Triage feedback | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-14 Approve version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-15 Create/close session | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-16 Complete close prompt | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-17 Build handoff package | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-18 Run QC/readiness | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-19 Declare source use | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| PRJ-20 Activate DAW bridge | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for request/event/storage/upload/offline/projection contracts; [Shard 01](01-identity-authority.md) for parties, acting context, memberships, authority and shell identities; [Shard 07](07-credits-core.md) for role taxonomy, credit claims, session capture and provenance.
- **Depended on by:** Shards 10, 14, 17, 19, 22 and 32 consume project/session/version/package pointers or events. Shard 09 owns workspace truth; consumers own rights, services, royalties, distribution and local-client concerns.

## Deep Dives Needed

- [Music projects and collaboration deep dive](deep-dives/09-projects-collaboration.md)

### Cross-Shard Section Contract Map

- **Shard 10 — Rights and ownership:** consume [Shard 10 — Rights and ownership Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 — Rights and ownership Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 14 — Services marketplace:** consume [Shard 14 — Services marketplace Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 — Services marketplace Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 17 — Royalty splits:** consume [Shard 17 — Royalty splits Contracts](17-royalty-splits.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 17 — Royalty splits Event Schemas](17-royalty-splits.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 19 — Royalty reporting and forecasting:** consume [Shard 19 — Royalty reporting and forecasting Contracts](19-royalty-reporting-forecasting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 19 — Royalty reporting and forecasting Event Schemas](19-royalty-reporting-forecasting.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 22 — Release and distribution:** consume [Shard 22 — Release and distribution Contracts](22-release-distribution.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 22 — Release and distribution Event Schemas](22-release-distribution.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 32 — Venue operations:** consume [Shard 32 — Venue operations Contracts](32-venue-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 32 — Venue operations Event Schemas](32-venue-operations.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 55 sources; locked project, roster, access, version, review, session, delivery and bridge boundaries | /write-architecture-spec | All |

## Dependency References

### Constrains

- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace]]
- [[specs/ia/17-royalty-splits|Shard 17 — Royalty splits]]
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution]]
- [[specs/ia/32-venue-operations|Shard 32 — Venue operations]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
