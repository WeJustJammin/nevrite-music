# BE 07b — Session capture, contribution logging and offline convergence

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 07 — Credit graph, capture and confidence | 07b — Session capture and offline merge | CRD-08 through CRD-11; temporal session roll, contribution claims, close prompts, prompt answers and consented attendance evidence. |

The canonical IA source is .memory/wiki/specs/ia/07-credits-core.md. Its approved deep dive is .memory/wiki/specs/ia/deep-dives/07-credits-core.md. Shard 09 owns project, session, part and wrap source truth; this companion owns credit-capture records and their immutable evidence. 07a owns assertions, visibility and graph projections. 07c owns claims, attestations, provenance and taxonomy.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CRD-08 Run session roll | CRD-07B-01 | Versioned temporal roll upsert and offline merge command | Session owner or delegate confirms provisional people, shells, entities, capacities and observed or inferred intervals; presence never creates credit. |
| CRD-09 Log contribution | CRD-07B-02 | Append-only per-part contribution claim command | Self may name self; Producer or delegate may name a roll party; exactly one role, many instruments, visibility intent and actual human asserter are recorded. |
| CRD-10 Close session | CRD-07B-03 | Non-blocking session close and contributor-delta prompt command | Wrap or six-hour inactivity closes session and independently issues contributor and Producer reconciliation prompts; close never waits for either. |
| CRD-11 Capture attendance evidence | CRD-07B-04 | Consent-scoped attendance evidence reference command | Optional byproduct evidence attaches to session only; consent is per signal, decline is consequence-free and evidence never gates credit or provenance. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/07-credits-core.md | title, links, overview and scope lines 1-24 | Establishes contribution truth, session capture ownership and non-inference of rights or credit from presence. |
| .memory/wiki/specs/ia/07-credits-core.md | features and acceptance criteria lines 25-55 | Supplies session roll, contribution, close prompt and attendance requirements. |
| .memory/wiki/specs/ia/07-credits-core.md | interactions and global rules lines 56-87 | Supplies exact CRD-08 through CRD-11 preconditions, offline merge, close and consent behavior. |
| .memory/wiki/specs/ia/07-credits-core.md | session capture contracts lines 114-123 | Defines UpsertRollEntry, MergeOfflineRoll, AppendContribution, IssueClosePrompt and RecordPromptAnswer invariants. |
| .memory/wiki/specs/ia/07-credits-core.md | data models and typed registry lines 144-197 | Defines session, session_roll_entry, roll_interval, contribution_claim, close_prompt_issue, prompt_answer and attendance_evidence. |
| .memory/wiki/specs/ia/07-credits-core.md | access control and escalation lines 198-223 | Defines producer, participant, operator, work-owner and worker authority and denial behavior. |
| .memory/wiki/specs/ia/07-credits-core.md | accessibility and event schemas lines 224-248 | Defines accessible roll/contribution/prompt surfaces and credit.session.closed.v1 plus credit.prompt.answered.v1. |
| .memory/wiki/specs/ia/07-credits-core.md | edge cases and coverage matrix lines 249-295 | Supplies offline add/remove, auto-close, prompt silence, consent withdrawal, deletion and concurrency outcomes. |
| .memory/wiki/specs/ia/07-credits-core.md | cross-shard map, changelog and dependencies lines 296-359 | Establishes Shard 09 source events, Shard 06 dispute routing and downstream projection constraints. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | scope and deepening record lines 1-18 | Confirms session capture convergence, no roll-to-credit promotion and offline adversarial controls. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | canonical field contracts lines 20-35 | Supplies exact session roll, interval, contribution, prompt and attendance fields. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | session capture algorithm lines 56-66 | Defines pre-seeding, additive offline merge, actual-human assertion, close timing, prompt hash binding and witnessed room mode. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | dispute and abuse verification lines 96-111 | Defines producer deletion protection, roll-to-credit separation, refusal semantics and worker outage behavior. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | cross-shard contracts and implementation envelope lines 113-132 | Binds BE00, Shards 01, 06, 09 and 10 to PostgreSQL RLS, Hono/Zod, queue and outbox boundaries. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | changelog and dependency references lines 134-157 | Records locked decisions and dependency direction. |

## IA Source Map

### Interaction map

| IA interaction | Backend operation | Owned command and invariant | Source trace |
|---|---|---|---|
| CRD-08 Run session roll | CRD-07B-01 | Upsert one roll entry per party or shell, many capacities and intervals, with additive offline merge. | Parent IA line 43 and interaction line 67; deep dive lines 56-65. |
| CRD-09 Log contribution | CRD-07B-02 | Append one-role contribution claim with instrument versions, visibility intent and actual asserter. | Parent IA line 44 and interaction line 68; deep dive lines 61-65. |
| CRD-10 Close session | CRD-07B-03 | Close at wrap or six hours inactivity and issue stable independent prompt IDs without blocking close. | Parent IA line 45 and interaction line 69; deep dive lines 63-65. |
| CRD-11 Capture attendance evidence | CRD-07B-04 | Persist consented session evidence reference; decline or withdrawal has no credit consequence. | Parent IA line 46 and interaction line 70; deep dive lines 58-65. |

### Model map

| IA model name | BE owner | Persistence and contract use | Source trace |
|---|---|---|---|
| session | CRD-07B-01, CRD-07B-03, CRD-07B-04 | Shard 09 session reference, owner, wrap/auto-close state and capture version. | Parent IA line 155; deep dive lines 26 and 58-65. |
| session_roll_entry | CRD-07B-01 | One party or shell per session, capacities, author and presence state. | Parent IA line 155; deep dive lines 26 and 58-60. |
| roll_interval | CRD-07B-01 | Observed/inferred interval with conflict and source version. | Parent IA line 155; deep dive line 27. |
| contribution_claim | CRD-07B-02 | Session/part, subject, role/instruments, asserter, claim hash and visibility intent. | Parent IA line 156; deep dive line 28. |
| close_prompt_issue | CRD-07B-03 | Stable contributor or Producer delta issue, claim hashes, channel, cadence and reoffer state. | Parent IA line 157; deep dive line 29. |
| prompt_answer | CRD-07B-03 and CRD-07B-02 | Immutable answer bound to displayed claim hash; silence is not refusal. | Parent IA line 157; deep dive lines 29 and 64-65. |
| attendance_evidence | CRD-07B-04 | Consent-scoped source signal, time range, reliability and protected evidence pointer. | Parent IA line 158; deep dive lines 28 and 58-65. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| credit.session.closed.v1 | CRD-07B-03 | Session wrap, roll and contribution hashes for prompt and downstream coordinators. | Parent IA line 239. |
| credit.prompt.answered.v1 | CRD-07B-02 and CRD-07B-03 | Prompt issue, claim hash, answer kind, actual actor and time for refresh. | Parent IA line 240. |

The event producer commits the canonical record and outbox entry together. Event payloads use opaque IDs and hashes only; private session names, narrative, attendance signal details, refusal identity, device identifiers and unrestricted PII remain protected.

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 02.02.01 | Session Roll Call | CRD-07B-01 | Owner/delegate roll, one subject per session, capacities and observed/inferred/conflicted intervals. |
| 02.02.02 | Per-Track Contribution Log | CRD-07B-02 | Append-only per-part claim, one role, many instruments, actual human asserter and visibility intent. |
| 02.02.03 | Session Close Capture Prompt | CRD-07B-03 | Wrap or inactivity close, stable issue IDs, independent prompts, hash-bound answers and non-blocking failure. |
| 02.02.04 | Session Attendance Proof | CRD-07B-04 | Per-signal consent, session-only evidence reference, human-over-device conflict and consequence-free withdrawal. |

Source trace: feature-ledger.md lines 24-26 contain 02.02.01, 02.02.02 and 02.02.03; line 495 contains 02.02.04. The identifiers and names above are copied from those rows.

## Endpoint Completeness Reconciliation

Each owned interaction has one stable operation ID, route registry row, strict request and success schema, error row, authorization row, idempotency/rate rule, observability row and test row. CRD-07B-01 owns roll convergence but never asserts credit. CRD-07B-02 owns contribution claims but does not resolve taxonomy, party claims or provenance. CRD-07B-03 closes the session and prompts independently; a prompt failure cannot roll back the close. CRD-07B-04 stores attendance evidence only after signal-specific consent and never attaches it to a credit.

Inherited routes are not repeated:

- BE00 supplies request context, ApiError, idempotency, offline replay envelope, audit, outbox and queue recovery.
- BE01 supplies party, shell, membership, mandate and acting-context snapshots.
- BE06 receives credit contests or authority disputes; no capture route adjudicates them.
- BE09 owns project/session/part/wrap source events; this companion stores versioned references and capture records.
- BE10 may consume contribution references but owns rights and splits; presence and contribution never create them.

## Shared Contract Inheritance

- Request envelope includes requestId, session or service principal, acting context, locale, schema version and trace context.
- Success envelope includes data, requestId and schemaVersion.
- Error envelope is exactly ApiError { code, message, requestId, details }. Every route uses it for 4xx and 5xx, including stale offline writes and provider timeout.
- Idempotency-Key binds actor, route, normalized input hash and schema version. Matching replay returns the original result; differing payload returns IDEMPOTENCY_MISMATCH with no second effect.
- Commands carry expectedVersion. Compare-and-set losers return VERSION_CONFLICT while additive offline merge returns a deterministic conflict marker rather than dropping edits.
- Transactional outbox publishes credit.session.closed.v1 and credit.prompt.answered.v1 only after canonical state commits.
- Supabase PostgreSQL RLS enforces session owner, participant and purpose-bound evidence access. Anonymous clients have no direct table grant.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CRD-07B-01 | CRD-08 Run session roll | POST /api/v1/sessions/{sessionId}/roll | Session owner or delegated roll manager; Shard 09 owns session | RunSessionRollRequest | RunSessionRollResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 120/hour per session and 30/min per device; offline batch key per source version | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, session capability, rate, CAS, outbox and ApiError normalization |
| CRD-07B-02 | CRD-09 Log contribution | POST /api/v1/sessions/{sessionId}/contributions | Self, Producer or delegated contributor authority; subject must be on roll | LogContributionRequest | LogContributionResponse 201 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 120/hour per session and 60/hour per actor; part key prevents duplicate claim | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, roll membership, role scope, rate, append transaction and ApiError normalization |
| CRD-07B-03 | CRD-10 Close session | POST /api/v1/sessions/{sessionId}/close | Session owner, Producer or close worker after wrap or six-hour inactivity | CloseSessionRequest | CloseSessionResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 10/day per session owner and 120/min close worker; stable issue IDs | CORS first-party consumer and service allowlist with credentials; BE00 context, CSRF or principal, strict Zod, close capability, rate, outbox and ApiError normalization |
| CRD-07B-04 | CRD-11 Capture attendance evidence | POST /api/v1/sessions/{sessionId}/attendance-evidence | Consented participant for own signal; worker may attach authorized source reference | CaptureAttendanceEvidenceRequest | CaptureAttendanceEvidenceResponse 201 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 60/hour per participant and 600/hour worker; one key per signal/version | CORS first-party consumer and service allowlist with credentials; BE00 context or principal, CSRF for browser, strict Zod, consent gate, rate, evidence queue and ApiError normalization |

### Registry invariants

- Every operation returns ApiError { code, message, requestId, details }; details are field-safe and never contain private session names, narrative, device identifiers or refusal identity.
- 403 means visible session or roll target exists but the actor lacks owner, delegate, Producer, self, participant, consent or worker authority. 404 means the session, subject, part or evidence projection is hidden by RLS or absent from the actor's permitted view.
- 409 means expected-version loss, duplicate terminal close, idempotency mismatch or a same-source replay that carries a different normalized payload. 422 means subject not on roll, multiple roles, missing consent or invalid interval.
- Roll additions win removals in offline merge. Capacities union. Intervals widen and mark conflict. No merge path deletes an earlier version or creates a credit.
- Close transaction writes the session close marker and prompt issue intents atomically; prompt delivery is asynchronous and never blocks or reverses close.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| CRD-07B-01 | RunSessionRollRequest to RunSessionRollResponse with roll version, entries, intervals, merge state and conflict markers. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-owner/delegate; SESSION_NOT_FOUND 404 for hidden session; VERSION_CONFLICT 409 on same-version non-merge command. |
| CRD-07B-02 | LogContributionRequest to LogContributionResponse with append-only claim, claim hash, subject, role, instruments and committed version. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-self non-Producer or subject not on roll; SESSION_NOT_FOUND 404 for hidden session; VERSION_CONFLICT 409; MULTIPLE_ROLES or INVALID_PART 422. |
| CRD-07B-03 | CloseSessionRequest to CloseSessionResponse with closed version, stable contributor and Producer issue IDs, prompt state and outbox state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unauthorized closer; SESSION_NOT_FOUND 404; VERSION_CONFLICT 409 on duplicate competing close; CLOSE_NOT_READY 422 only for an explicitly premature close command. |
| CRD-07B-04 | CaptureAttendanceEvidenceRequest to CaptureAttendanceEvidenceResponse with consent version, evidence ID, signal state and session-only attachment marker. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-participant or non-consented signal; SESSION_NOT_FOUND 404; VERSION_CONFLICT 409; CONSENT_REQUIRED or SIGNAL_INVALID 422. |

## Request/Response Contracts (Zod 4 schemas)

All schemas are Zod 4 strict objects. Unknown keys are rejected. UUIDs are opaque IDs, dates are offset-aware ISO datetimes, hashes are lower-case hexadecimal and offline sourceVersion is a client-generated monotonic version bound to the device installation.

~~~ts
import { z } from "zod";

export const ApiError = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: z.uuid(),
  details: z.record(z.string(), z.json()),
});

const Id = z.uuid();
const Version = z.number().int().nonnegative();
const DateTime = z.iso.datetime({ offset: true });
const DateOnly = z.string().date();
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Key = z.string().min(16).max(128);

export const RunSessionRollRequest = z.strictObject({
  idempotencyKey: Key,
  sessionId: Id,
  expectedVersion: Version,
  sourceDeviceId: z.string().min(1).max(120),
  sourceVersion: Version,
  entries: z.array(z.strictObject({
    partyRef: Id.optional(),
    shellRef: Id.optional(),
    capacities: z.array(z.string().min(1).max(80)).max(20),
    state: z.enum(["provisional", "present", "departed"]),
    intervals: z.array(z.strictObject({
      startsAt: DateTime,
      endsAt: DateTime.optional(),
      startQuality: z.enum(["observed", "inferred"]),
      endQuality: z.enum(["observed", "inferred"]).optional(),
      conflict: z.boolean(),
    })).max(100),
  })).max(500),
  mergeBaseVersion: Version.optional(),
});
export const RunSessionRollResponse = z.strictObject({
  sessionId: Id,
  version: Version,
  entries: z.array(z.strictObject({
    entryId: Id,
    partyRef: Id.optional(),
    shellRef: Id.optional(),
    capacities: z.array(z.string().min(1)),
    state: z.enum(["provisional", "present", "departed", "closed"]),
    intervals: z.array(z.strictObject({
      startsAt: DateTime,
      endsAt: DateTime.optional(),
      startQuality: z.enum(["observed", "inferred"]),
      endQuality: z.enum(["observed", "inferred"]).optional(),
      conflict: z.boolean(),
    })),
  })),
  mergeState: z.enum(["canonical", "merged_additive", "conflicted"]),
  creditCreated: z.literal(false),
});

export const LogContributionRequest = z.strictObject({
  idempotencyKey: Key,
  sessionId: Id,
  expectedVersion: Version,
  partId: Id.optional(),
  subjectPartyRef: Id.optional(),
  subjectShellRef: Id.optional(),
  roleVersionId: Id.optional(),
  roleLiteral: z.string().min(1).max(160).optional(),
  instrumentVersionIds: z.array(Id).max(20),
  visibilityIntent: z.enum(["public", "embargoed", "confidential"]),
  qualifier: z.string().min(1).max(120).optional(),
  contributedOn: DateOnly.optional(),
  asserterHumanRef: Id,
  claimHash: Hash,
});
export const LogContributionResponse = z.strictObject({
  contributionClaimId: Id,
  sessionId: Id,
  partId: Id.optional(),
  subjectPartyRef: Id.optional(),
  subjectShellRef: Id.optional(),
  roleVersionId: Id.optional(),
  retainedRoleLiteral: z.string().min(1),
  instrumentVersionIds: z.array(Id),
  visibilityIntent: z.enum(["public", "embargoed", "confidential"]),
  state: z.enum(["committed", "qualified", "superseded"]),
  claimHash: Hash,
  version: Version,
});

export const CloseSessionRequest = z.strictObject({
  idempotencyKey: Key,
  sessionId: Id,
  expectedVersion: Version,
  closeReason: z.enum(["wrap", "inactivity_six_hours", "owner_manual"]),
  contributorDeltaHash: Hash,
  producerReconciliationHash: Hash,
  issueContributorPrompt: z.boolean(),
  issueProducerPrompt: z.boolean(),
  reopenUntil: DateTime.optional(),
});
export const CloseSessionResponse = z.strictObject({
  sessionId: Id,
  closedVersion: Version,
  closeState: z.enum(["closed", "reopened"]),
  contributorPromptIssueId: Id.optional(),
  producerPromptIssueId: Id.optional(),
  promptState: z.enum(["not_requested", "queued", "issued", "failed"]),
  sessionClosedEventId: Id,
  closeBlocksOnPrompt: z.literal(false),
});

export const CaptureAttendanceEvidenceRequest = z.strictObject({
  idempotencyKey: Key,
  sessionId: Id,
  expectedVersion: Version,
  participantRef: Id,
  signalKind: z.enum(["device_presence", "room_tap", "calendar_overlap", "human_note"]),
  consentRef: Id,
  consentVersion: Version,
  startsAt: DateTime,
  endsAt: DateTime.optional(),
  sourceEvidenceRef: Id,
  reliability: z.number().min(0).max(1),
  humanConflictRef: Id.optional(),
});
export const CaptureAttendanceEvidenceResponse = z.strictObject({
  attendanceEvidenceId: Id,
  sessionId: Id,
  participantRef: Id,
  consentVersion: Version,
  state: z.enum(["recorded", "queued", "rejected"]),
  attachedToCredit: z.literal(false),
  consentWithdrawalConsequence: z.literal("none"),
  version: Version,
});
~~~

Cross-field validation requires exactly one subjectPartyRef or subjectShellRef, exactly one roleVersionId or roleLiteral, a roll entry for the subject, interval end after start, and actual human asserter distinct from sourceDeviceId. Attendance requires consentRef/version for the exact signal kind and rejects a participant who is not on the session. Close permits owner_manual only when the source session policy permits it; no prompt field can make close conditional. Offline roll merge accepts removals only as tombstone intentions, then applies additive-wins semantics.

## Database Schema

The seven tables below are the complete 07b persistence set. The session source record is represented here as a capture-owned reference and versioned projection; Shard 09 remains canonical for session lifecycle. Party, shell, project, part, role and instrument tables are producer-owned opaque references unless a local foreign key is explicitly stated. Every table has Supabase PostgreSQL RLS enabled and no direct anon/authenticated table grant.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| session | id uuid NOT NULL PRIMARY KEY; source_session_id uuid NOT NULL; owner_party_ref uuid NOT NULL; project_ref uuid NOT NULL; source_version bigint NOT NULL CHECK >= 0; state text NOT NULL CHECK provisional/open/closed/reopened; wrap_at timestamptz NULL; auto_close_at timestamptz NULL; closed_at timestamptz NULL; close_reason text NULL CHECK wrap/inactivity_six_hours/owner_manual; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | source_session_id is Shard 09 canonical opaque ref; project and party refs have no local FK. Unique source_session_id; indexes owner_party_ref plus state, project_ref plus state, auto_close_at, version. | RLS permits owner/delegate, named participant and case-scoped reviewer projections; svc_session_capture writes capture state; source-session mutation remains Shard 09-only; no client table grant. |
| session_roll_entry | id uuid NOT NULL PRIMARY KEY; session_id uuid NOT NULL; party_ref uuid NULL; shell_ref uuid NULL; capacities jsonb NOT NULL CHECK jsonb_typeof(capacities) = array; author_ref uuid NOT NULL; state text NOT NULL CHECK provisional/present/departed/closed; source_device_id text NULL; source_version bigint NOT NULL CHECK >= 0; removal_intent boolean NOT NULL DEFAULT false; conflict boolean NOT NULL DEFAULT false; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; CHECK exactly one party_ref or shell_ref. | session_id FK to session.id; party/shell refs resolve through Shard 01. Unique session_id plus subject ref; indexes session_id plus state, party_ref, shell_ref, source_device_id plus source_version. | RLS permits owner/delegate and overlapping participant projection; non-overlapping participant cannot read; svc_session_capture writes; no direct client grant. |
| roll_interval | id uuid NOT NULL PRIMARY KEY; entry_id uuid NOT NULL; starts_at timestamptz NOT NULL; ends_at timestamptz NULL CHECK ends_at IS NULL OR ends_at >= starts_at; start_quality text NOT NULL CHECK observed/inferred; end_quality text NULL CHECK observed/inferred; conflict boolean NOT NULL DEFAULT false; source_version bigint NOT NULL CHECK >= 0; created_at timestamptz NOT NULL. | entry_id FK to session_roll_entry.id; index entry_id plus starts_at, conflict plus starts_at, source_version; exclusion constraint prevents impossible overlapping observed intervals for one entry while allowing inferred conflict intervals. | RLS follows parent entry; service role writes append-only intervals; participant receives own/overlapping authorized intervals; no client table grant. |
| contribution_claim | id uuid NOT NULL PRIMARY KEY; session_id uuid NOT NULL; part_id uuid NULL; subject_party_ref uuid NULL; subject_shell_ref uuid NULL; role_version_id uuid NULL; role_literal text NULL CHECK char_length(role_literal) <= 160; instrument_version_ids jsonb NOT NULL CHECK jsonb_typeof(instrument_version_ids) = array; asserter_ref uuid NOT NULL; asserted_at timestamptz NOT NULL; visibility_intent text NOT NULL CHECK public/embargoed/confidential; qualifier text NULL; claim_hash char(64) NOT NULL; committed_at timestamptz NOT NULL; state text NOT NULL CHECK committed/qualified/superseded; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; CHECK exactly one subject ref; CHECK role version or literal. | session_id FK to session.id; part, party/shell, role and instrument refs are producer/07c opaque refs. Unique session_id plus part_id plus subject ref plus claim_hash; indexes session_id, part_id, asserter_ref, claim_hash, state. | RLS permits asserter, subject party, session owner/Producer, named participant and case reviewer by purpose; public projection is handled by 07a; svc_contribution_capture writes append-only; no client table grant. |
| close_prompt_issue | id uuid NOT NULL PRIMARY KEY; session_id uuid NOT NULL; recipient_ref uuid NOT NULL; delta_hash char(64) NOT NULL; claim_hashes jsonb NOT NULL CHECK jsonb_typeof(claim_hashes) = array; channel text NOT NULL CHECK in_app/email/notification; issued_at timestamptz NOT NULL; reoffer_no smallint NOT NULL DEFAULT 0 CHECK between 0 and 2; state text NOT NULL CHECK queued/issued/answered/expired/failed; stable_issue_key char(64) NOT NULL; next_offer_at timestamptz NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | session_id FK to session.id; recipient ref resolves through Shard 01. Unique session_id plus recipient_ref plus delta_hash; indexes session_id plus state, recipient_ref plus state, next_offer_at, stable_issue_key. | RLS permits recipient and session owner/Producer status projection; prompt body is recipient-scoped; svc_close_prompt writes; no client table grant. |
| prompt_answer | id uuid NOT NULL PRIMARY KEY; issue_id uuid NOT NULL; session_id uuid NOT NULL; actor_ref uuid NOT NULL; claim_hash char(64) NOT NULL; answer_kind text NOT NULL CHECK confirm/refuse/dont_know; private_reason text NULL; answered_at timestamptz NULL; state text NOT NULL CHECK recorded/stale/withdrawn; supersedes_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | issue_id FK to close_prompt_issue.id; session_id FK to session.id; supersedes_id FK to prompt_answer.id; actor ref is Shard 01 opaque. Index issue_id plus state, session_id plus answered_at, claim_hash; unique issue_id plus actor_ref plus version. | RLS exposes answer to actor and authorized session owner only; private_reason is purpose-bound; public projection never shows refusal; svc_close_prompt writes append-only; no client table grant. |
| attendance_evidence | id uuid NOT NULL PRIMARY KEY; session_id uuid NOT NULL; participant_ref uuid NOT NULL; signal_kind text NOT NULL CHECK device_presence/room_tap/calendar_overlap/human_note; consent_ref uuid NOT NULL; consent_version bigint NOT NULL CHECK >= 0; starts_at timestamptz NOT NULL; ends_at timestamptz NULL CHECK ends_at IS NULL OR ends_at >= starts_at; source_evidence_ref uuid NOT NULL; reliability numeric(9,6) NOT NULL CHECK between 0 and 1; human_conflict_ref uuid NULL; state text NOT NULL CHECK recorded/queued/rejected/withdrawn; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL. | session_id FK to session.id; participant and evidence refs resolve through Shard 01/00 purpose services; unique session_id plus participant_ref plus signal_kind plus consent_version; indexes session_id plus participant_ref, signal_kind, starts_at, state. | RLS permits participant own evidence, session owner only authorized projection and case reviewer protected view; svc_attendance_capture writes; consent withdrawal revokes derived access without deleting audit; no direct client grant. |

### Persistence invariants

- Offline sourceVersion and expectedVersion are both checked. A stale source can be merged only through additive rules; an ordinary same-version overwrite returns VERSION_CONFLICT.
- Roll add wins remove, capacities union, intervals widen and conflict. A tombstone removal intention cannot erase a later or concurrent addition.
- Contribution claims are append-only. Correction, replacement or non-final state uses a qualifier or successor, never deletion. A roll state never creates a credit.
- Prompt answers bind the claimHash shown. If the claim changes, the old answer remains historical but is not evidence for the new claim. Silence, skipped prompt and don't-know never become a public negative.
- Attendance evidence is session-only. Consent withdrawal marks derived access withdrawn and preserves the audit reference; it never lowers a rung, blocks a prompt or removes a credit.

## Middleware & Policies

### Hono middleware order

1. Create requestId and trace context; validate envelope.
2. Select operation CORS policy and reject non-allowlisted origin; browser credential routes never use wildcard credentials.
3. Verify CSRF for browser commands.
4. Authenticate session or service principal; resolve acting context and freshness.
5. Resolve session visibility and owner/delegate/participant purpose capability under RLS.
6. Enforce body-size, interval-count, batch-count and offline sourceVersion limits.
7. Bind Idempotency-Key to actor, session, source device, route and normalized input.
8. Parse strict Zod 4 schema and cross-field role, subject, interval, consent and close checks.
9. Apply rate and expected-version/CAS policy; lock session or append aggregate.
10. Write canonical records, audit and outbox atomically; queue prompt/evidence delivery after commit.
11. Project authorized response, add no-store or ETag headers and normalize every failure to ApiError { code, message, requestId, details }.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| CRD-07B-01 | Session owner or delegated roll manager | Source session open, owner/delegate mandate and entry subjects | Lock session version; recheck source version and additive merge base | Hidden session is 404; visible session without owner/delegate is 403. |
| CRD-07B-02 | Self, Producer or delegate | Subject on roll; self only for self; Producer/delegate for any roll party | Lock roll entry/part append key; recheck subject and claim hash | Hidden session/part is 404; visible subject outside authority is 403. |
| CRD-07B-03 | Owner, Producer or close worker | Wrap or six-hour inactivity; owner manual close policy | Lock session; recheck close state and stable prompt keys | Hidden session is 404; visible session without close authority is 403. |
| CRD-07B-04 | Consented participant or authorized capture worker | Own signal, session membership and exact consentRef/version | Lock consent/signal uniqueness; recheck consent before attach | Hidden session is 404; non-participant or withdrawn consent is 403. |

### Security and abuse controls

- Session owner/delegate scope is purpose-bound. A room operator may record witnessed room facts but cannot assert creative contribution merely from facility role.
- Actual human asserter is resolved from acting context; device, account or offline client identifier never substitutes for a human.
- Roll entries and attendance evidence are protected from cross-session enumeration. Participant projections are overlap-scoped.
- Prompt answers keep refusal identity and private reason protected. Public and participant projections render refuse, don't-know, unanswered and expired without retaliation signal.
- Device signals cannot corroborate inferred intervals against human evidence. Human conflict is recorded and human evidence outranks device evidence.
- Offline payloads are bounded by count, size, source version and key lifetime. Replay and tampered source devices fail idempotency or signature checks.
- SQL SECURITY DEFINER functions set fixed search_path, validate current service role and actor purpose and insert credit_audit_event before returning. Direct table grants are revoked.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| CRD-07B-01, CRD-07B-03, CRD-07B-04 | Shard 09 session/part source | sessionId, sourceSessionVersion, sourceDeviceId, requestedPartIds, expectedVersion | sourceSessionVersion, sessionState, wrapAt, partVersions, ownerRef, capturePermission | 2,000 ms; safe read retries twice at 100/500 ms, no unknown write retry; circuit opens after 5 failures in 60 seconds; unknown source version blocks mutation. |
| CRD-07B-01, CRD-07B-02 | Shard 01 party, shell, membership and mandate snapshot | actorRef, sessionId, subjectRefs, requestedSnapshotVersion, relationKind | snapshotVersion, partyState, shellState, membershipState, mandateState, delegateCapability | 2,000 ms; one safe read retry at 250 ms; circuit 5 failures/60 seconds; unknown authority returns 403 or pending and writes nothing. |
| CRD-07B-02 | 07c role/instrument resolver | roleVersionId or roleLiteral, locale, partyType, requesterScope, instrumentVersionIds | resolutionKind, roleVersionId, retainedLiteral, pendingAliasId, instrumentVersionRefs | 1,000 ms; 3 read retries at 100/500/1,500 ms; circuit 5/60 seconds; role outage permits bounded literal only when policy allows, never fuzzy selection. |
| CRD-07B-03 | Prompt notification adapter | issueId, recipientRef, channel, deltaHash, claimHashes, reofferNo, expectedVersion | providerReceiptRef, deliveryState, deliveredAt, notificationId | 2,000 ms; 3 retries at 15/60/300 seconds with same issue key; circuit 5/60 seconds; failure leaves close committed and prompt failed/queued. |
| CRD-07B-04 | Consent and evidence adapter | sessionId, participantRef, consentRef, consentVersion, signalKind, sourceEvidenceRef, timeRange | consentState, evidenceReceiptRef, retentionClass, evidenceState | 2,000 ms; 3 retries at 15/60/300 seconds for safe reference writes; circuit 5/60 seconds; unknown consent blocks attach and never fabricates evidence. |

Provider uncertainty is typed pending or unavailable. It never creates credit, attestation, provenance rung or presence. A timeout after a local commit is reconciled using requestId and idempotency key.

### State machines and concurrency

- Roll: provisional → present → departed → closed. Conflict flags remain until resolution; previous versions are never erased.
- Contribution: draft → committed → qualified or superseded. One role per row, many instruments; a replacement creates a successor.
- Session: open → closing → closed; closed can reopen within 24 hours when the source policy allows. Prompt failure never returns state to open.
- Prompt: queued → issued → answered, expired or failed; max one issue plus two nudges. An answer is recorded only when its claim hash matches the shown claim.
- Attendance: consented → recorded or queued → withdrawn. Consent decline or withdrawal is consequence-free.
- Concurrent roll updates use sourceDeviceId and sourceVersion. Adds win removes, capacities union and intervals widen. Same event replay returns prior result; different payload with same key returns IDEMPOTENCY_MISMATCH.
- Concurrent contribution writes compare session/part version and unique claim key. Losers get prior result or typed conflict, never a duplicate public claim.
- Concurrent close commands compare session version. One close emits one credit.session.closed.v1 and stable issue IDs; duplicate close is a no-op.

### Failure recovery

- Crash after session close commit leaves the outbox and durable prompt issue rows. Prompt workers resume by stable issue key; close remains complete.
- Offline merge failure preserves the client batch for resubmission with sourceVersion. Server returns a conflict projection, never silently discards additions.
- Prompt provider timeout records failed or queued state and retries with the same issue ID. Contributor delta is reissued on retry; silence remains neutral.
- Attendance adapter failure records queued/unavailable evidence and alerts; no prompt, credit or provenance state is lowered.
- Shard 09 source deletion or closure removes derived write authority while preserving immutable roll/contribution/audit records under retention. Party revocation removes future access and leaves history.
- A stale mandate, role or consent snapshot returns a typed conflict. The worker refetches; no stale actor, role or consent is used.

## Event Schemas

### Payload contracts

~~~ts
export const CreditSessionClosedV1 = z.strictObject({
  type: z.literal("credit.session.closed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  sessionId: z.uuid(),
  closedVersion: z.number().int().nonnegative(),
  closeReason: z.enum(["wrap", "inactivity_six_hours", "owner_manual"]),
  rollHash: z.string().regex(/^[a-f0-9]{64}$/),
  contributionHash: z.string().regex(/^[a-f0-9]{64}$/),
  reopenedUntil: z.iso.datetime({ offset: true }).optional(),
});

export const CreditPromptAnsweredV1 = z.strictObject({
  type: z.literal("credit.prompt.answered.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  issueId: z.uuid(),
  sessionId: z.uuid(),
  claimHash: z.string().regex(/^[a-f0-9]{64}$/),
  answerKind: z.enum(["confirm", "refuse", "dont_know"]),
  actorRef: z.uuid(),
  answeredAt: z.iso.datetime({ offset: true }).optional(),
});
~~~

Events omit session names, private reason, device IDs, raw attendance signal, narrative, refusal exposure, internal score and unrestricted PII. Consumers refetch an authorized projection using session and claim versions.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, CSRF or authentication | INVALID_REQUEST 400 or UNAUTHENTICATED 401 | Correct envelope or establish fresh context; no mutation. |
| Session visibility and capture capability | FORBIDDEN 403 for visible unauthorized actor; opaque 404 for hidden session | Use owner/delegate or participant path; no ID enumeration. |
| Strict schema and interval/subject/consent rule | INVALID_REQUEST 400 or typed 422 | Correct fields; no provider call or partial append. |
| Idempotency/source version | IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409 | Replay same source key or refetch and additive-merge. |
| Prompt/evidence provider | PROVIDER_UNAVAILABLE 503 only after durable queue state | Retry by stable issue/evidence key; no close reversal or fabricated evidence. |
| Consent withdrawal | CONSENT_REVOKED 422 with no negative signal | Remove derived access and preserve audit; never lower credit/provenance. |

### Operation error coverage

| Operation ID | Invalid input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| CRD-07B-01 | Non-owner/delegate, subject ambiguity, invalid interval, excessive batch or closed source session is rejected. | Additive offline merge converges; Shard 09 outage leaves batch pending; session deletion tombstones source refs and retains capture history. |
| CRD-07B-02 | Subject not on roll, non-Producer attribution, multiple roles or missing role/instrument resolution is rejected. | Unique claim key prevents duplicate; resolver outage retains permitted literal only; party revocation removes future writes without deleting claim. |
| CRD-07B-03 | Premature manual close or unauthorized closer is rejected; prompt fields cannot block close. | One close wins; provider failure affects only prompt state; auto-close correction reopens within 24 hours with event history. |
| CRD-07B-04 | Non-participant, missing consent or withdrawn consent is rejected; invalid signal/time range returns 422. | Evidence queue retries; unknown consent never attaches; erasure withdraws derived access but retains required evidence/audit. |

## Observability

Every operation emits requestId, traceId, operationId, outcome, latencyMs, actorType, sessionRefHash, sourceVersion, schemaVersion and purpose. Logs and events exclude private session names, narratives, device identifiers, answer reasons and raw evidence.

| Operation ID | Audit event and metrics | Safe trace fields |
|---|---|---|
| CRD-07B-01 | credit.session.roll.changed; merge additions, removals, interval conflicts, stale versions and batch size metrics | session hash, entry count bucket, merge state, source version, conflict count bucket |
| CRD-07B-02 | credit.contribution.changed; append, qualified, role invalid, membership denial and duplicate metrics | session hash, part hash, role family, instrument count, claim hash |
| CRD-07B-03 | credit.session.closed.v1; close reason, reopen, prompt enqueue/failure and close latency metrics | session hash, close reason, closed version, issue count, prompt state |
| CRD-07B-04 | credit.attendance.changed; consent, record, queue, withdrawal and provider latency metrics | session hash, participant hash, signal kind, consent version, state |

provider-native diagnostic sinks receive exception fingerprints and provider circuit state without request bodies. Alerts fire for roll conflict growth, close outbox lag over 60 seconds, prompt retry exhaustion, evidence queue age over 5 minutes, consent mismatch and a projection attempting to treat roll presence as credit.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CRD-07B-01 | Parse strict roll/interval schema and exactly-one subject; test owner/delegate access, additive offline merge, interval conflict, stale version and creditCreated false. |
| CRD-07B-02 | Parse one role/many instruments; test self versus Producer authority, subject-on-roll, append-only claim, role resolver outage and duplicate replay. |
| CRD-07B-03 | Test wrap and six-hour close, stable issue IDs, independent prompts, provider timeout, duplicate close, reopen within 24 hours and closeBlocksOnPrompt false. |
| CRD-07B-04 | Test signal-specific consent, participant authority, withdrawal, human-over-device conflict, queued evidence and attachedToCredit false. |

### Persistence, concurrency and recovery tests

- Migration tests assert every listed SQL type, nullability, check, FK, unique constraint, index, RLS policy and grant.
- Property tests generate offline add/remove permutations, duplicate source keys, stale versions, duplicate closes, claim-hash changes, consent withdrawal and provider unknown responses. Every property asserts no roll-to-credit promotion and no silent deletion.
- Worker tests run crash-after-close-commit, prompt timeout, evidence timeout, duplicate outbox delivery and source session revocation. Stable keys converge to one state.
- Security tests attempt cross-session IDs, nonparticipant evidence reads, device-as-asserter, direct table reads, CSRF, replay, oversized interval batches and private answer leakage.
- Performance tests keep local roll and contribution p95 under 300 ms, close command under 300 ms before queued effects, and bound offline merge payload and queue memory.

### Accessibility handoff tests

Roll and contribution grids expose semantic headers, participant labels, interval conflict text and keyboard-complete editing. Close prompts have explicit confirm, refuse and don't-know labels; silence is not rendered negative. Consent controls state signal purpose, version and consequence-free decline. Offline conflicts announce additive merge and focus changed rows. Screen-reader, keyboard-only, 200 percent zoom, high contrast, reduced motion and timeout-extension tests are required.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | Four operations each have strict Zod request/success schemas, common ApiError, explicit CORS, auth, rate, idempotency and 403/404 behavior. PASS. |
| Capture pass | Roll, interval, contribution, prompt and attendance fields preserve temporal, asserter, consent and hash invariants; roll never creates credit. PASS. |
| Offline pass | Additive merge, source version, device key, interval widening, conflict markers and retry behavior are deterministic. PASS. |
| Persistence pass | All seven models have typed SQL fields, nullability, constraints, FK target or opaque-reference rationale, indexes, RLS and grants. PASS. |
| State/recovery pass | Roll, contribution, close, prompt and consent state machines include CAS, stable keys, outbox recovery and provider unknown behavior. PASS. |
| Adversarial pass | Device impersonation, nonparticipant access, producer deletion, stale claim hash, prompt retaliation, consent withdrawal and roll-to-credit inference fail safe. PASS. |
| Macro boundary pass | 07a/07c, BE00, BE01, BE06, BE09 and BE10 ownership is referenced without route/table duplication. PASS. |
| Auditability pass | CRD-07B-01 through CRD-07B-04 appear in route, contract, error, auth, observability and test rows; event and model names are literal and line-traced. PASS. |

## Ambiguity Gate

PASS. The sole canonical IA source is .memory/wiki/specs/ia/07-credits-core.md with deep dive .memory/wiki/specs/ia/deep-dives/07-credits-core.md. CRD-08 through CRD-11 have one owner and one operation. Shard 09 session truth, Shard 01 authority, 07b capture truth and 07a/07c downstream boundaries are explicit. Additive offline merge, source-version conflict, prompt neutrality, consent scope, 403 versus 404, idempotency, rates, CORS, ApiError, external timeouts, retries, circuit breakers, RLS, grants, deletion and provider uncertainty are resolved. No route duplicates 07a, 07c or platform endpoints. All tables have matching Markdown widths and no unescaped cell pipes.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 07b backend companion from canonical Shard 07 IA and deep dive; classified four interactions, seven models and two events. | /write-be-spec | All |
| 2026-08-28 | Added strict Zod 4 contracts, route registry, typed PostgreSQL/RLS schema, offline merge, external seam budgets, event payloads, error matrices, observability and tests. | /write-be-spec-write | API, database, middleware, data flow, events, errors, observability, tests |

## Dependency References

### Constrained by

- [BE00 — Platform foundation](00-infrastructure.md)
- [BE01 — Authentication and account linking](01a-auth-account-linking.md)
- [BE01 — Party, identity and authority](01c-relationships-authority-governance.md)
- [BE06 — Trust, safety and disputes](06a-case-intake-evidence.md)
- [IA Shard 07 — Credit graph, capture and confidence](../ia/07-credits-core.md)
- [IA Deep Dive 07 — Credit graph, capture and confidence](../ia/deep-dives/07-credits-core.md)

### Constrains

- [07a — Credit assertions and visibility](07a-credit-assertions-visibility.md)
- [07c — Claims, confidence and taxonomy](07c-claims-attestations-confidence-taxonomy.md)
- [IA Shard 09 — Projects and collaboration](../ia/09-projects-collaboration.md)
- [IA Shard 10 — Rights and ownership](../ia/10-rights-ownership.md)
