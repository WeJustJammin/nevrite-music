# BE Spec 12c — Contests, Submissions, Judging, and Awards

> Source: [IA Shard 12](../ia/12-community-spaces-events.md), interactions SPC-07–SPC-09. This companion owns immutable contest brief versions, `contest_submission`, judge assignments/scores, and evidence-backed `prize_commitment`. It does not transfer rights by implication, fabricate prize funding, expose blinded identity, or let an organizer rewrite rules after submissions.

Canonical model mapping: `contest_brief_version` persists in `contest_versions`; `judge_appointment` persists in `contest_judge_assignments`; `contest_verdict` persists in `contest_verdicts`; `contest_submission` and `prize_commitment` persist in their plural storage tables. Every mapped model retains typed fields, versioning, RLS, grants, and audit ownership here.

## Classification

- Backend-bearing: yes. SPC-07–SPC-09 require immutable contest briefs, time-bounded submissions, blinded/conflict-free judging, quorum/finalization, prize evidence, and award recovery.
- Boundary: this companion owns contest versions, submissions, judge assignments/scores, verdicts, and prize commitments. Identity, assets, rights/consent, Trust & Safety, and prize delivery remain external seams; rights never transfer by implication.
- Split validation: the approved 12c boundary is the contiguous IA cluster SPC-07–SPC-09 with no route overlap with scenes, forums, or informal events.
- BE00 inheritance: request IDs, auth/acting context, strict transport, idempotency, transaction/outbox, audit redaction, rate headers, CORS allowlist, and ApiError { code, message, requestId, details }.

## Referenced Material Inventory

| Material | Section / lines | Contract extracted |
|---|---:|---|
| IA Shard 12 | Overview/features and acceptance criteria, lines 8–48 | contest scope, no implied rights, prize and blind-identity constraints |
| IA Shard 12 | Interactions SPC-07–SPC-09, lines 59–61 | publish, submit, judge/finalize/award behavior and refusal |
| IA Shard 12 | Contracts, lines 76–112 | brief/submission/adjudication request invariants and errors |
| IA Shard 12 | Data Models, lines 113–156 | contest_brief_version, contest_submission, prize_commitment, judge_appointment, contest_verdict |
| IA Shard 12 | Access Control, lines 157–180 | organizer, entrant, judge, moderator and funding authority scope |
| IA Shard 12 | Event Schemas, lines 190–204 | community.contest.changed.v1, community.contest-submission.changed.v1 |
| IA Shard 12 | Edge cases/dependencies, lines 205–263 | windows, blindness, quorum, evidence expiry, retries and privacy |
| BE00 and architecture/engineering standards | global API/security/data/testing sections | exact envelope, middleware order, RLS, outbox and verification gate |

## IA Source Map

| Interaction | Operation ID | Owned effect | Canonical models/events |
|---|---|---|---|
| SPC-07 | BE12C-07 | save/publish/cancel immutable contest brief and prize commitment | contest_brief_version, prize_commitment, community.contest.changed.v1 |
| SPC-08 | BE12C-08 | accept eligible blinded submission with rights/consent snapshot | contest_submission, community.contest-submission.changed.v1 |
| SPC-09 | BE12C-09 | score, finalize and award under quorum/tie/prize gates | judge_appointment, contest_verdict, community.contest.changed.v1 |

## Endpoint Completeness Reconciliation

### Authoritative Route Registry

| Operation ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO |
|---|---|---|---|---|---|
| BE12C-07 | POST | `/api/v1/community/contests` | verified organizer with prize/source authority | key + draft `If-Match`; publish lock | 20/day/organizer; no-store; p95 700 ms |
| BE12C-08 | POST | `/api/v1/community/contests/{contestId}/submissions` | eligible entrant/mandate within window | key + brief/asset/source digest | 20/hour/entrant; no-store; p95 800 ms |
| BE12C-09 | POST | `/api/v1/community/contests/{contestId}/adjudications` | assigned conflict-free judge; award requires organizer + funding evidence | key + contest/submission/score versions | 60/hour/judge; no-store; p95 800 ms |

SPC-07 publishes a complete brief only before any submission, with eligibility, dates, rubric, rights/usage terms, judging mode, prize commitment, and cancellation policy. SPC-08 snapshots the brief/entrant/asset/rights/consents and returns an opaque receipt. SPC-09 records independent scores, resolves ties by the published rule, and awards only after required judge quorum and live prize evidence.

TLS, ULID IDs, request ID, strict JSON, authenticated party context, and a 128 KiB body cap are mandatory; assets are references to scanned media. Exact organizer/entrant/judge origins receive role-specific credentialed CORS. Preflight allows route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`. Responses are private/no-store; public contest discovery uses a sanitized versioned projection.

## Request/Response Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const JsonValue=z.lazy(()=>z.union([z.string(),z.number(),z.boolean(),z.null(),z.array(JsonValue),z.record(z.string(),JsonValue)]));
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:Id,details:z.record(z.string(),JsonValue)}).strict();
const BriefRequest=z.object({
  contestId:Id.optional(),expectedVersion:Ver.optional(),action:z.enum(['save_draft','publish','cancel']),
  title:z.string().trim().min(3).max(200),eligibilityPolicyRef:Id,
  opensAt:At,closesAt:At,judgingClosesAt:At,
  rubric:z.array(z.object({criterionId:Id,label:z.string().trim().min(1).max(120),weightBps:z.number().int().min(1).max(10_000),scoreMax:z.number().int().min(1).max(1000)}).strict()).min(1).max(30),
  rightsTermsVersion:Ver,usageScope:z.enum(['evaluation_only','public_showcase','licensed_use']),
  judgingMode:z.enum(['identified','blind','double_blind']),tieRule:z.enum(['head_judge','highest_priority_criterion','runoff']),
  prize:z.object({kind:z.enum(['money','goods','opportunity']),description:z.string().trim().min(1).max(1000),valueMinor:z.bigint().nonnegative().optional(),currency:z.string().regex(/^[A-Z]{3}$/).optional(),evidenceRef:Id}).strict(),
  cancellationPolicyRef:Id,reason:z.string().trim().min(1).max(1000).optional()
}).strict().superRefine((v,c)=>{
  if(!(Date.parse(v.opensAt)<Date.parse(v.closesAt)&&Date.parse(v.closesAt)<=Date.parse(v.judgingClosesAt)))c.addIssue({code:'custom',path:['closesAt'],message:'invalid window order'});
  if(v.rubric.reduce((n,x)=>n+x.weightBps,0)!==10_000)c.addIssue({code:'custom',path:['rubric'],message:'weights must total 10000'});
  if(v.prize.kind==='money'&&(!v.prize.valueMinor||!v.prize.currency))c.addIssue({code:'custom',path:['prize'],message:'money prize requires value/currency'});
});
const SubmissionRequest=z.object({
  briefVersion:Ver,entrantPartyId:Id,entrantMandateRef:Id.optional(),
  assetRefs:z.array(Id).min(1).max(20),rightsAssertionVersion:Ver,
  consentRefs:z.array(Id).max(30),statement:z.string().trim().min(1).max(3000)
}).strict();
const AdjudicationRequest=z.discriminatedUnion('action',[
  z.object({action:z.literal('score'),submissionId:Id,submissionVersion:Ver,judgeAssignmentId:Id,scores:z.record(z.string(),z.number().int().nonnegative()),comment:z.string().trim().max(3000)}).strict(),
  z.object({action:z.literal('finalize'),expectedContestVersion:Ver,requiredAssignmentVersions:z.array(Ver).min(1),tieResolution:z.string().trim().max(1000).optional()}).strict(),
  z.object({action:z.literal('award'),expectedContestVersion:Ver,winnerSubmissionId:Id,prizeEvidenceRef:Id,announcementAt:At}).strict()
]);
```

Every request union rejects unknown keys. Strict success envelopes expose only authorized projections:

~~~ts
const Meta=z.object({requestId:Id,traceId:Id,occurredAt:At}).strict();
const BriefSuccess=z.object({data:z.object({contestId:Id,version:Ver,state:z.enum(['draft','published','judging','finalized','awarded','cancelled']),prizeCommitmentId:Id,publicProjectionVersion:Ver}).strict(),meta:Meta}).strict();
const SubmissionSuccess=z.object({data:z.object({contestId:Id,submissionId:Id,version:Ver,state:z.enum(['submitted','withdrawn','eligible','ineligible','finalist','winner']),receiptId:Id,blindAlias:Id}).strict(),meta:Meta}).strict();
const AdjudicationSuccess=z.object({data:z.union([
  z.object({result:z.literal('score_recorded'),contestId:Id,submissionId:Id,scoreId:Id,version:Ver}).strict(),
  z.object({result:z.literal('contest_finalized'),contestId:Id,verdictId:Id,version:Ver,state:z.literal('finalized'),resultDigest:z.string().length(64)}).strict(),
  z.object({result:z.literal('contest_awarded'),contestId:Id,verdictId:Id,version:Ver,state:z.literal('awarded'),winnerSubmissionId:Id,deliveryJobId:Id}).strict()
]),meta:Meta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| BE12C-07 | BriefRequest | BriefSuccess / 201 for publish, 200 for draft/cancel | ApiError { code, message, requestId, details } / 400,401,403,409,422,429,503 |
| BE12C-08 | SubmissionRequest | SubmissionSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,410,422,429,503 |
| BE12C-09 | AdjudicationRequest | AdjudicationSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,410,422,429,503 |

### Field Validation Matrix

| Operation ID | Required validation |
|---|---|
| BE12C-07 | date window order, rubric weight total 10,000 bps, money prize value/currency, rights/cancellation refs, publish lock before first submission |
| BE12C-08 | published window and eligibility, entrant mandate/asset/rights/consent snapshots, unique digest, blind alias, no identity leakage |
| BE12C-09 | assignment conflict/quorum, submission/version CAS, score bounds, published tie rule, verified prize evidence before award, immutable result digest |

Unknown keys, invalid windows/weights/scores, stale brief/rights/evidence, ineligible or duplicate entrant/asset digest, missing consents, judge conflict, identity access in blind mode, quorum/tie mismatch, unsafe text, and unscanned assets fail before persistence. Published briefs are immutable; correction requires cancellation and a new contest unless the published cancellation policy explicitly allows a non-material clarification before first submission.

## Database Schema

### Typed Persistence Field, FK, Index, RLS, and Grant Registry

The SQL block is migration shape; this registry is the contract. Every canonical model has typed fields with explicit nullability, constraints, named FK targets, indexes, and grants.

| Model | Typed fields, nullability, constraints and FK targets | Required indexes | RLS / grants |
|---|---|---|---|
| contest_versions (contest_brief_version) | id text PK NOT NULL ULID; version bigint NOT NULL CHECK >0; tenant_id text NOT NULL FK platform_private.tenant(id); organizer_party_id text NOT NULL FK platform_private.party(id); brief_json jsonb NOT NULL object; opens_at/closes_at/judging_closes_at timestamptz NOT NULL with ordered check; state text NOT NULL enum; published_at timestamptz NULL; created_by text NOT NULL FK platform_private.party(id); created_at timestamptz NOT NULL | (organizer_party_id,state); (state,opens_at,closes_at); unique(id,version) | organizer sees own drafts; public sees published projection; judges see only policy-approved brief; RPC only; anon no grant |
| prize_commitments | id text NOT NULL ULID with (id,version) PK; contest_id text NOT NULL FK contest_versions(id); version bigint NOT NULL CHECK >0; kind text NOT NULL enum; description text NOT NULL bounded; value_minor bigint NULL CHECK >=0; currency char(3) NULL uppercase; evidence_ref text NOT NULL FK evidence.ref(id); evidence_state text NOT NULL enum; custodian_party_id text NOT NULL FK platform_private.party(id); created_at timestamptz NOT NULL | (contest_id,evidence_state); (evidence_ref); unique(contest_id,version) | organizer reads disclosed evidence state; funding custodian reads full evidence; entrants see verified status only; append-only RPC; anon no grant |
| contest_submissions | id text NOT NULL ULID with (id,version) PK; contest_id text NOT NULL FK contest_versions(id); version bigint NOT NULL CHECK >0; brief_version bigint NOT NULL; entrant_party_id text NOT NULL FK platform_private.party(id); entrant_mandate_ref text NULL FK mandate.ref(id); asset_refs jsonb NOT NULL array; asset_digest text NOT NULL length 64; rights_assertion_version bigint NOT NULL; consent_refs jsonb NOT NULL array; statement_ciphertext bytea NOT NULL; state text NOT NULL enum; submitted_at timestamptz NOT NULL | unique(contest_id,entrant_party_id,asset_digest); (contest_id,state,submitted_at); (entrant_party_id,state) | entrant sees own receipt/submission; judges see blinded alias/projection; organizer sees only policy-approved identity; no body/base-table grant; anon no grant |
| contest_judge_assignments (judge_appointment) | id text NOT NULL ULID with (id,version) PK; contest_id text NOT NULL FK contest_versions(id); version bigint NOT NULL CHECK >0; judge_party_id text NOT NULL FK platform_private.party(id); conflict_check_ref text NOT NULL FK safety.conflict_check(id); state text NOT NULL enum; created_at timestamptz NOT NULL | unique(contest_id,judge_party_id,version); (contest_id,state); (judge_party_id,state) | conflict service assigns; judge reads own assignment; organizer sees status but not conflict detail; append-only; anon no grant |
| contest_scores | id text PK NOT NULL ULID; contest_id text NOT NULL FK contest_versions(id); submission_id text NOT NULL FK contest_submissions(id); submission_version bigint NOT NULL CHECK >0; judge_assignment_id text NOT NULL FK contest_judge_assignments(id); rubric_scores jsonb NOT NULL object; weighted_score numeric(18,6) NOT NULL CHECK >=0; comment_ciphertext bytea NULL; created_at timestamptz NOT NULL | unique(submission_id,judge_assignment_id,submission_version); (contest_id,submission_id); (judge_assignment_id) | judge reads/writes own score before finalize; organizers see aggregate after release; comments restricted; no update/delete; anon no grant |
| contest_verdicts (contest_verdict) | id text NOT NULL ULID with (id,version) PK; contest_id text NOT NULL FK contest_versions(id); version bigint NOT NULL CHECK >0; result_digest text NOT NULL length 64; winner_submission_id text NULL FK contest_submissions(id); tie_rule text NOT NULL enum; tie_resolution_ciphertext bytea NULL; prize_commitment_id text NOT NULL FK prize_commitments(id); prize_commitment_version bigint NOT NULL; state text NOT NULL enum; decided_by text NOT NULL FK platform_private.party(id); decided_at timestamptz NOT NULL | unique(contest_id,result_digest,version); (contest_id,state); (winner_submission_id) | quorum/finalization worker appends; organizer reads released verdict; entrants see own result; verdict immutable; anon only public projection |

All durable tables enable and force RLS. authenticated receives only security-definer RPC execution; service_role is limited to scoring/projection workers; direct client SELECT/INSERT/UPDATE/DELETE is denied. Blind identity and protected evidence stay purpose-restricted through retention.

```sql
create table contest_versions (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  organizer_party_id text not null, brief_json jsonb not null, opens_at timestamptz not null,
  closes_at timestamptz not null, judging_closes_at timestamptz not null,
  state text not null check(state in ('draft','published','judging','finalized','awarded','cancelled')),
  published_at timestamptz, created_by text not null, created_at timestamptz not null,
  primary key(id,version), check(opens_at<closes_at and closes_at<=judging_closes_at)
);
create table prize_commitments (
  id text not null, version bigint not null check(version>0), contest_id text not null,
  kind text not null, description text not null, value_minor bigint, currency char(3),
  evidence_ref text not null, evidence_state text not null check(evidence_state in ('pending','verified','expired','revoked')),
  custodian_party_id text not null, created_at timestamptz not null,
  primary key(id,version)
);
create table contest_submissions (
  id text not null, version bigint not null check(version>0), contest_id text not null,
  brief_version bigint not null, entrant_party_id text not null, entrant_mandate_ref text,
  asset_refs jsonb not null, asset_digest text not null, rights_assertion_version bigint not null,
  consent_refs jsonb not null, statement_ciphertext bytea not null,
  state text not null check(state in ('submitted','withdrawn','eligible','ineligible','finalist','winner')),
  submitted_at timestamptz not null, primary key(id,version),
  unique(contest_id,entrant_party_id,asset_digest)
);
create table contest_judge_assignments (
  id text not null, version bigint not null check(version>0), contest_id text not null,
  judge_party_id text not null, conflict_check_ref text not null,
  state text not null check(state in ('assigned','recused','completed','revoked')),
  created_at timestamptz not null, primary key(id,version),
  unique(contest_id,judge_party_id,version)
);
create table contest_scores (
  id text primary key, contest_id text not null, submission_id text not null,
  submission_version bigint not null, judge_assignment_id text not null,
  rubric_scores jsonb not null, weighted_score numeric(18,6) not null,
  comment_ciphertext bytea, created_at timestamptz not null,
  unique(submission_id,judge_assignment_id,submission_version)
);
create table contest_verdicts (
  id text not null, version bigint not null check(version>0), contest_id text not null,
  result_digest text not null, winner_submission_id text,
  tie_rule text not null, tie_resolution_ciphertext bytea,
  prize_commitment_id text not null, prize_commitment_version bigint not null,
  state text not null check(state in ('finalized','awarded','corrected')),
  decided_by text not null, decided_at timestamptz not null,
  primary key(id,version), unique(contest_id,result_digest,version)
);
```

Award records pin winner, finalized score digest, prize evidence/version, announcement, delivery state, and audit reference. Indexes cover contest organizer/state/windows, prize evidence, submission contest/state/entrant/digest, judge state, scores submission/judge, and award delivery. All tables enable and force RLS. `anon` has no base grants; authenticated parties use RPCs. Entrants see own submissions/receipts; judges see assigned blinded projections only; organizers cannot see blind identities until policy release and cannot edit scores; public sees published brief/results only. Evidence/comments/statements remain purpose-restricted. Direct client update/delete is denied.

## Data Flow

SPC-07 validates organizer authority, rule completeness and prize evidence before publishing a version. SPC-08 snapshots the published brief, entrant eligibility, rights/consent and scanned asset digest into one submission receipt. SPC-09 appends scores under assignment CAS, finalizes a deterministic result digest after quorum, and awards only after rechecking prize evidence. Public projections advance only after the corresponding outbox event is durable.

## External Seams

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---:|---|---|
| BE00 identity/acting-context verifier | {accessToken,actingContextId} -> {actorId,partyId,roles,contextVersion} | 300 ms | 2 retries at 50/150 ms before writes | opens after 5 failures in 30 s for 60 s; fail closed with 503 DEPENDENCY_UNAVAILABLE; two successful probes close |
| identity/rights/consent and asset scanner | {contestId,partyId,assetRefs,rightsAssertionVersion,consentRefs} -> {eligible,rightsState,consentState,assetStates,policyVersion} | 2,000 ms | 2 retries at 100/500 ms; no submission write until terminal result | opens after 5 failures in 30 s for 60 s; reject new submissions while open; pending digest requeues after lease expiry |
| conflict/quorum/prize evidence service | {contestId,judgeAssignmentId,submissionVersion,prizeEvidenceRef} -> {conflictFree,quorumSatisfied,evidenceState,decisionRef} | 2,000 ms | 2 retries at 100/500 ms; idempotent lookups only | opens after 5 failures in 30 s for 60 s; finalization/award fail closed; recovery replays same operation key |

## Transactions, Events, and Recovery

SPC-07 locks contest/prize evidence, validates complete brief and zero submissions, then publishes contest/prize version, audit/outbox, and discovery projection atomically. SPC-08 locks published contest/window/eligibility/asset-rights digest, inserts `contest_submission`, receipt, audit/outbox, and immutable blind alias. SPC-09 score locks assignment/submission version and appends once; finalize locks all required assignments, verifies quorum/rubric/tie rule, and writes a score digest. Award rechecks prize evidence and winner, then appends award/winner states and delivery job. No partial award.

Idempotency binds tenant, actor, action, contest/submission, and body hash for 72 hours. Same-key/different-body returns `409 IDEMPOTENCY_CONFLICT`; replay returns stored response. Judge records are append-only; correction is a superseding score before finalize with reason and distinct version.

| Event | Trigger and payload |
|---|---|
| `community.contest.changed.v1` | brief/state/finalize/award: `{contestId,version,state,briefVersion,prizeCommitmentRef,resultDigest,occurredAt}` |
| `community.contest-submission.changed.v1` | submission eligibility/withdraw/finalist/winner: `{contestId,submissionId,version,state,blindAlias,changeCode,occurredAt}` |

Transactional outbox, per-contest/submission order, at-least-once, dedupe, 24-hour retry/dead-letter. Identity, submission content/assets, score/comments, rights, prize evidence, and judge details are excluded from general events.

Identity/rights/asset/prize/T&S adapters use 2–3 s, two retries 100/500 ms, circuit 5 failures/30 s for 60 s, and fail closed. Prize delivery/notification workers retry 1/5/30 s with 60-second leases; delivery failure keeps award truth and exposes an operator recovery state.

## State Machines and Transition Guards

The state columns in this companion are closed enums; no handler may invent an additional state. Every accepted transition is serialized under the aggregate/version lock, writes its audit/outbox record atomically, and emits the named event after commit. A rejected transition leaves the current state and all prior versions unchanged.

### `contest_versions.state`

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `draft` | `BE12C-07 save_draft` keeps `draft`; `BE12C-07 publish` moves to `published` only after rights, eligibility, judging, cancellation, and verified prize evidence pass; `BE12C-07 cancel` moves to `cancelled`. | Submission, scoring, finalization, and award are rejected. Publish with missing/expired prize evidence, incomplete rules, or a stale version returns `422`/`409` and writes no new published version. |
| `published` | `BE12C-08` may append eligible or ineligible submissions while the window is open without changing contest state. At `closesAt`, the close worker emits `community.contest.changed.v1` and moves to `judging` when at least one submission exists, or to `cancelled` with `NO_SUBMISSIONS` when none exists. `BE12C-07 cancel` may move to `cancelled` only before the first submission and when the published cancellation policy permits. | Brief edits, score/finalize/award, and submissions after `closesAt` are rejected (`BRIEF_LOCKED`/`WINDOW_CLOSED`). Cancel after the first submission or without policy authority returns `409`/`403`. |
| `judging` | `BE12C-09 score` appends immutable scores and keeps `judging`; `BE12C-09 finalize` moves to `finalized` after all required assignments, quorum, tie rule, and evidence checks pass; policy-authorized cancellation may move to `cancelled` before finalization. | New submissions, brief edits, and award are blocked. Finalize without quorum, with a conflict, stale assignment, or expired prize evidence returns `422`/`409` and keeps `judging`. |
| `finalized` | `BE12C-09 award` moves to `awarded` after winner recheck and live prize evidence. A post-verdict conflict or correction decision invalidates the round, emits a corrected verdict, and returns the contest to `judging` for a new scoring/finalization round. | New submissions, ordinary score edits, and brief changes are rejected. Award without verified evidence or with a stale winner returns `422`/`409`; cancellation is not a substitute for correcting a finalized result. |
| `awarded` | No forward transition; delivery/notification is an external job state and cannot rewrite the contest. Duplicate award is an idempotent replay of the stored result. | Brief, submission, score, finalize, cancel, and second-award commands return `409` (`CONTEST_AWARDED`) with no mutation. |
| `cancelled` | No forward transition. A new contest ID/version is required to restart after a visible cancellation. | All publish, submit, score, finalize, award, and further cancel commands are rejected with `409` (`CONTEST_CANCELLED`); historical submissions and audit remain read-only. |

Contest-state transitions emit `community.contest.changed.v1` with the new state and version. `BE12C-09` correction never mutates an old brief, score, or verdict; it records the invalidation and starts only the explicitly permitted new judging round.

### `prize_commitments.evidence_state`

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `pending` | Evidence verifier/custodian changes it to `verified` after the exact funding or deliverability proof; invalid or withdrawn proof changes it to `revoked`; the evidence-expiry worker changes it to `expired`. | `BE12C-07 publish` and `BE12C-09 award` are blocked while `pending`; no cash or opportunity prize may be represented as funded. |
| `verified` | Expiry worker changes it to `expired`; custodian or Trust & Safety revocation changes it to `revoked`. | Direct edits, downgrade to `pending`, or use after expiry/revocation are rejected; a published contest pauses award/new-submission behavior according to its policy and returns `PRIZE_EVIDENCE_INVALID`. |
| `expired` | No forward transition; a new evidence/commitment version may be created and separately verified. | Reverification by overwriting the row, publication, and award are rejected; historical proof remains immutable and purpose-restricted. |
| `revoked` | No forward transition; a new commitment/evidence version is required. | Reinstatement, publication, and award are rejected with `PRIZE_EVIDENCE_INVALID`; no downstream consumer may infer funding from an old `verified` state. |

Prize-state changes are versioned and referenced by `community.contest.changed.v1`; they never silently alter a frozen brief or an already awarded contest.

### `contest_submissions.state`

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `submitted` | `BE12C-08` creates `submitted`; the rights/consent/asset eligibility result changes it to `eligible` or `ineligible`; the entrant may withdraw before the submission deadline, moving to `withdrawn`. | A duplicate digest, closed window, missing rights/consent, or failed scanner returns `409`/`410`/`422`; score, finalist, and award actions are blocked until `eligible`. |
| `withdrawn` | No forward transition; a corrected entry uses a new submission ID/version while the window remains open. | Re-submit, score, finalist, and award commands against the withdrawn record are rejected; withdrawal remains in the event history and cannot be undone by an organizer. |
| `eligible` | `BE12C-09 finalize` selects it as `finalist`; a pre-judging evidence revocation may move it to `ineligible`; entrant withdrawal before judging closes may move it to `withdrawn`. | Score/finalist selection after the contest leaves `judging`, or without the pinned brief/rights snapshot, returns `409`/`422`; no organizer may edit entrant identity or assets in place. |
| `ineligible` | No forward transition; the entrant corrects and submits a new record if the contest window permits. | Scoring, finalist, winner, and award actions are rejected with `ELIGIBILITY_OR_RIGHTS_FAILED`; the failed evidence snapshot remains immutable. |
| `finalist` | `BE12C-09 award` changes the selected submission to `winner`; a post-verdict conflict/correction round may return it to `eligible` for re-judging under the frozen brief. | Withdrawal and arbitrary status changes are blocked after judging closes; award without finalized result, winner recheck, or prize evidence returns `422`. |
| `winner` | No forward transition. Delivery is represented by its job/outbox state, not by rewriting the submission. | A second award, entrant edit/withdraw, score change, or identity change returns `409` (`WINNER_FINAL`); corrections create a new verdict/history record. |

Submission transitions emit `community.contest-submission.changed.v1` with the new state, blind alias, and version. A consumer must not treat a receipt, upload, or public projection as an additional submission state.

### `contest_judge_assignments.state`

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `assigned` | Conflict review or judge disclosure moves to `recused`; a valid `BE12C-09 score` moves to `completed`; organizer/custodian revocation moves to `revoked`. | A score from a conflicted, expired, or unassigned judge is rejected with `403`/`422`; assignment replacement cannot mutate the old row. |
| `recused` | A confirmed conflict closes the assignment as `revoked`; no reassignment occurs on the same assignment ID. | Scoring, finalization credit, and unrecusal are blocked; a new conflict-free appointment is required. |
| `completed` | A post-verdict conflict or credential invalidation may move the appointment to `revoked` while preserving its score and reason history. | Additional scores, reassignment, or score deletion are rejected; correction uses a superseding score/verdict path. |
| `revoked` | No forward transition; a new assignment/version is required. | Score, finalize, and award operations cannot count a revoked assignment toward quorum. |

### `contest_verdicts.state`

| Current state | Valid transition and trigger | Blocked or rejected behavior |
|---|---|---|
| `finalized` | `BE12C-09 award` moves the verdict to `awarded`; a documented post-verdict conflict, failed winner recheck, or approved correction moves it to `corrected` and starts the new judging round without rewriting this row. | A finalized verdict cannot be edited, rescored, or awarded twice; failed evidence/winner checks return `422` and preserve `finalized`. |
| `awarded` | No forward transition; delivery/notification recovery is handled by the referenced job and outbox. | Reversal, second award, or direct winner replacement returns `409`; any lawful correction creates a new verdict lineage. |
| `corrected` | No forward transition; it is an immutable superseded result. | It cannot satisfy quorum, drive delivery, or be re-awarded; consumers must follow the new verdict/version referenced by the correction event. |

`contest_scores` has no state column: each score is an immutable append-only fact keyed by submission, assignment, and submission version. A correction appends a new score/version and never updates or deletes the prior fact. This is an explicit non-stateful exception, not an implicit lifecycle.

## Middleware & Policies

### Per-Operation Middleware Registry

| Operation ID | Middleware chain |
|---|---|
| BE12C-07 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(contestPublish:20/day/organizer) -> parseZod(BriefRequest) -> authorizeOrganizerAndPrizeEvidence -> idempotency(72h) -> ifMatch -> transaction |
| BE12C-08 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(contestSubmit:20/hour/entrant) -> parseZod(SubmissionRequest) -> authorizeWindowRightsConsent -> assetScan -> idempotency(72h) -> transaction |
| BE12C-09 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(adjudication:60/hour/judge) -> parseZod(AdjudicationRequest) -> authorizeAssignmentQuorumPrize -> idempotency(72h) -> ifMatch -> transaction |

### Authorization, Error, Idempotency, Rate, and Observability Matrix

| Operation ID | Roles / ownership; 403 vs 404 | Error/status cases | Idempotency and rate | Observability |
|---|---|---|---|---|
| BE12C-07 | verified organizer with prize/source authority; 403 known contest outside organizer scope; 404 concealed draft | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 409 VERSION_CONFLICT/BRIEF_LOCKED/IDEMPOTENCY_CONFLICT; 422 PRIZE_EVIDENCE_INVALID; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/contest/body hash; 20/day/organizer; replay returns body/status | operation/request/contest version, state, evidence status, latency; no private rule/prize details |
| BE12C-08 | eligible entrant/mandate during window; 403 known contest not eligible; 404 concealed contest/submission | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 DUPLICATE_SUBMISSION/VERSION_CONFLICT/IDEMPOTENCY_CONFLICT; 410 WINDOW_CLOSED; 422 ELIGIBILITY_OR_RIGHTS_FAILED; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/contest/asset hash; 20/hour/entrant; replay returns receipt | receipt/alias/version/state, scanner attempts, latency; no identity/assets/rights text |
| BE12C-09 | assigned conflict-free judge; organizer/funding authority for finalize/award; 403 known assignment/contest outside role; 404 concealed submission | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT/DUPLICATE_SCORE/IDEMPOTENCY_CONFLICT; 410 JUDGING_CLOSED; 422 JUDGE_CONFLICT_OR_QUORUM_FAILED/PRIZE_EVIDENCE_INVALID; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/contest/action/body hash; 60/hour/judge; replay returns result | assignment/result digest/state, quorum band, dependency attempts, latency; no blinded identity/scores/comments |

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod -> contest/entrant/judge RLS -> eligibility/rights/assets/conflict/prize -> step-up for publish/award -> idempotency/If-Match -> transaction -> response projection -> audit. Errors are `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed brief/submission/score |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | organizer/entrant/judge authority absent |
| 404 `NOT_FOUND` | absent/concealed contest/submission |
| 409 `VERSION_CONFLICT` | stale contest/submission/assignment |
| 409 `BRIEF_LOCKED` | submission exists/published material change |
| 409 `DUPLICATE_SUBMISSION_OR_SCORE` | unique tuple committed |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `WINDOW_CLOSED` | submission/judging deadline passed |
| 422 `ELIGIBILITY_OR_RIGHTS_FAILED` | entrant/asset/consent invalid |
| 422 `JUDGE_CONFLICT_OR_QUORUM_FAILED` | recusal/quorum/tie invalid |
| 422 `PRIZE_EVIDENCE_INVALID` | no award until verified |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no eligibility/award inferred |

Logs contain opaque request/contest/submission/assignment IDs, versions, state/code, counts/score band, latency, dependency attempts, and outbox age; exclude identities, content/assets, scores/comments, rights, and prize evidence. Metrics cover publication rejects, submissions/eligibility/withdrawals, judge conflicts/quorum, finalize/award/delivery, latency/errors/circuits/outbox. Availability 99.9%; p99 write <1.5 s; award delivery job <5 min p99 when healthy. Page on blind-identity leak, result digest mismatch, verified-prize regression, or five-minute 5xx >2%.

## Verification and Test Strategy

| Operation ID | Contract, authorization, persistence, concurrency, and seam tests |
|---|---|
| BE12C-07 | strict brief/window/weight/prize schemas; immutable publish lock; organizer/tenant/RLS; idempotency/CAS race; evidence timeout/retry/breaker; public projection privacy; CORS and exact ApiError |
| BE12C-08 | window/eligibility/asset/rights/consent properties; duplicate submission race; blinded alias projection; RLS; scanner outage/recovery; receipt replay, event dedupe and redaction |
| BE12C-09 | score bounds, judge conflict/quorum/tie properties; concurrent score/finalize/award; verified prize expiry; immutable result digest; circuit recovery; blind-identity and event privacy tests |

Tests cover schemas/cross-fields, window/weight/score properties, immutable brief, duplicate submission, blind projections, every role/tenant/conflict/revocation, RLS/grants, concurrent submit/score/finalize/award, prize evidence expiry, idempotency races, adapter retries/circuit/recovery, event privacy/order/dedupe, log redaction, migrations/index plans, CORS, accessible public brief/results, and alerts. CI fails on uncovered SPC-07–SPC-09, missing `contest_submission`/`prize_commitment`/events, route collision, rule mutation, blind leak, unverified award, direct write grant, malformed table/link, or unresolved question.

## Ambiguity Gate

- SPC-07–SPC-09, canonical models `contest_brief_version`, `contest_submission`, `prize_commitment`, `judge_appointment`, and `contest_verdict`, and both events are fully specified.
- Brief lock, rights/eligibility, blindness, judge conflict/quorum, prize evidence, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- PASS evidence: BE12C-07–BE12C-09 each have one authoritative route, strict request/success schemas and exact ApiError rows, named CORS/auth/rate/validation middleware, 403/404 rules, idempotency/observability/test rows, typed persistence/FK/index/RLS/grant entries, and exact external seam recovery.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added source inventory, typed success/error matrix, per-operation middleware/test rows, persistence registry, and seam recovery evidence. | write-be-spec remediation |
| 2026-08-29 | Added exhaustive contest, prize, submission, assignment, and verdict state machines with triggers, blocked behavior, and correction lineage. | D6 remediation |

## Dependency References

- [IA Shard 12](../ia/12-community-spaces-events.md)
- Shards 01/04/06/07/11 identity, media, Trust & Safety, contribution, rights, and prize-finance contracts.
