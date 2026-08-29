# Opportunity Submissions, Auditions & Pitches — Backend Specification

> **IA Source**: [Shard 13 — Opportunities and casting lifecycle](../ia/13-opportunities-casting.md)
> **Deep Dives**: [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md)
> **Status**: Complete

## Split Group

> **Split origin**: `13-opportunities-casting`
> **Companion specs**: `13a-opportunity-publication-discovery-alerts.md`, `13c-triage-offers-dispositions.md`, `13d-handoff-history-specialized-calls.md`
> **Shared entities**: `opportunity_slot`, `opportunity_terms_version`, `submission`, `submission_version`, `opportunity_audit_event`

## Classification

- **Type**: multi-domain split — candidate submission, bounded audition work, and unsolicited pitch admission have separate data ownership and authorization paths.
- **Boundary**: OPP-07–09. Publication/policy is owned by 13a; reviews/offers by 13c; disposition and handoff by 13d.
- **Expected operations**: 3 HTTP operations; every operation maps one-to-one to an IA interaction.
- **Approval**: blanket approval from `/write-be-spec all shards` and delegated decision authority.

## Referenced Material Inventory

| Source | Sections / lines | Use |
|---|---:|---|
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Features 26–34; Acceptance Criteria 44–46; Interactions 69–71 | Submission, audition and pitch behavior |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Contracts 93–147; Data Models 148–203 | State, gates, submission and attempt fields |
| [Shard 13 IA](../ia/13-opportunities-casting.md) | Access Control 204–226; Events 237–253; Edge Cases 254–277 | Candidate/reviewer separation, event privacy and recovery |
| [Shard 13 deep dive](../ia/deep-dives/13-opportunities-casting.md) | Submission and Review Algorithm 76–87; Offer/Race 88–99; Abuse 111–127 | Eligibility, resumable uploads, policy pinning and retries |
| [BE00](00-infrastructure.md) | Request/response, upload intents, jobs, errors and outbox | Shared contract inheritance |
| [13a publication](13a-opportunity-publication-discovery-alerts.md) | Route registry and frozen terms/pitch policy | Upstream terms and policy input |

## IA Source Map

| BE section | IA source | Section / lines |
|---|---|---:|
| Routes and endpoint reconciliation | Shard 13 IA | Interactions 69–71 |
| Submission and audition contracts | Shard 13 IA | Contracts 126–133; Data Models 162–165, 189–192 |
| Pitch policy pinning | Shard 13 IA | Contracts 127–128; Data Models 160–162 |
| Access/privacy | Shard 13 IA | Access Control 204–226 |
| Events and edge handling | Shard 13 IA | Event Schemas 243–250; Edge Cases 262, 267–277 |
| Algorithm details | Shard 13 deep dive | Submission and Review 76–87; Abuse and Recovery 111–127 |
| Shared transport and errors | BE00 | §§ Request/Response Contracts, Upload Lifecycle, Error Handling |

## Endpoint Completeness Reconciliation

| IA interaction | Operation | Specced | Notes |
|---|---|:---:|---|
| OPP-07 Assemble submission | OPP-SUB-API-01 | ✅ | One current entity/post/slot submission; resubmission supersedes. |
| OPP-08 Complete audition task | OPP-SUB-API-02 | ✅ | Bounded rights/retention and resumable upload. |
| OPP-09 Submit unsolicited pitch | OPP-SUB-API-03 | ✅ | Re-evaluates and consumes target-local policy. |

## API Endpoints

### Route Registry

| ID | Method and path | Request | Success | Authorization / ownership | Rate / deadline |
|---|---|---|---|---|---|
| OPP-SUB-API-01 | `POST /api/v1/opportunities/{opportunityId}/slots/{slotId}/submissions` | `SubmitApplicationRequest` | `201 SubmissionResource` + `ETag` | verified person/Band acting party; eligibility and non-reviewer predicate | 10/min/user, 30/min/party; 15,000ms / p95 2,000ms |
| OPP-SUB-API-02 | `POST /api/v1/submissions/{submissionId}/audition-attempts` | `AuditionAttemptRequest` | `202 JobStatus` + `Location` | applicant entity owns submission; upload intent bound to task | 5/hour/submission, 30/min/user; 15,000ms / p95 2,000ms |
| OPP-SUB-API-03 | `POST /api/v1/targets/{targetPartyId}/pitches` | `UnsolicitedPitchRequest` | `201 SubmissionResource` + `ETag` | eligible professional, current target policy, no Fan access | 3/day/target/user and 30/day/user; 15,000ms / p95 2,000ms |

### Transport and external seams

All operations inherit BE00's CORS allowlist, strict media type, security headers, `RequestMeta`, and `ApiError { code, message, requestId, details }`. Mutations require `Idempotency-Key` and strong `If-Match` for addressed mutable rows. Body max is 256KiB; audition media uses a BE00 upload intent and never traverses Hono. Same key plus digest replays the same result; key reuse with a changed digest returns `409 IDEMPOTENCY_MISMATCH`.

The exact request/response, timeout, retry/backoff, and circuit-open recovery behavior is defined once in the registry below.

### External Seam Circuit and Recovery Registry

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit/open-state recovery |
|---|---|---:|---|---|
| Shard 01 actor/capability | {actorId,actingPartyId} -> {personId,partyId,authorityVersion,capabilities} | 500 ms | 3 attempts at 50/100/200 ms before write | opens after 5 failures in 30 s for 60 s; no write while open; two fresh probes close |
| Shard 06 evidence/reachability | {partyId,targetId,criterionRefs} -> {allowed,freshness,sourceVersion} | 500 ms | 2 attempts at 100/250 ms for read only | opens after 5 failures in 30 s for 60 s; return visible gap and fail closed for admission; close after two probes |
| BE00 upload/verification | {targetType,targetId,purpose,checksum} -> {uploadIntentId,jobId,jobState} | 1,000 ms | 3 attempts at 100/250/500 ms for admission; worker 5 attempts then DLQ | opens after 5 failures in 30 s for 60 s; no new upload intent while open; replay same checksum after lease recovery |

## Request/Response Contracts

All contracts in this section are strict Zod 4 schemas.

```ts
const Uuid = z.string().uuid();
const Version = z.string().regex(/^[1-9][0-9]*$/);
const IdempotencyKey = z.string().min(8).max(128).regex(/^[\x21-\x7E]+$/);
const SubmitApplicationRequest = z.object({ actingPartyId: Uuid, entityId: Uuid, termsVersionId: Uuid, evidenceRefs: z.array(Uuid).min(1).max(16), availability: z.array(z.object({ date: z.string().date(), available: z.boolean() })).min(1).max(64), answers: z.record(z.string(), z.string().max(500)).refine(x => Object.keys(x).length <= 32) }).strict();
const AuditionAttemptRequest = z.object({ expectedVersion: Version, taskId: Uuid, uploadIntentId: Uuid, round: z.number().int().min(1).max(1), evidenceRefs: z.array(Uuid).max(8), declaredChecksum: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const UnsolicitedPitchRequest = z.object({ actingPartyId: Uuid, entityId: Uuid, policyVersionId: Uuid, evaluationId: Uuid, evidenceRefs: z.array(Uuid).min(1).max(16), pitch: z.string().min(1).max(2000) }).strict();
```

Response schemas are strict: `SubmissionResource { data: { id, entityId, targetPartyId?, opportunityId?, slotId?, source, state, termsVersionId, targetPitchPolicyVersionId?, targetPitchPolicyEvaluationId?, dispositionDueAt?, version, submittedAt, createdAt, updatedAt }, meta }`; pitch content is visible only to target-authorized viewers. `AuditionAttemptAccepted { data: { id, submissionId, taskId, round, mediaState, evidenceRefs, jobId }, meta }` is returned through BE00 `JobStatus` at 202. No response includes copied résumé content, reviewer score, queue position, hidden criteria, raw media URL, or provider payload.

~~~ts
const ResponseMeta=z.object({requestId:Uuid,correlationId:Uuid,emittedAt:z.string().datetime({offset:true})}).strict();
const SubmissionResource=z.object({data:z.object({id:Uuid,entityId:Uuid,targetPartyId:Uuid.nullable(),opportunityId:Uuid.nullable(),slotId:Uuid.nullable(),source:z.enum(['application','unsolicited_pitch']),state:z.enum(['submitted','terms_changed','held','shortlisted','offered','withdrawn','accepted','declined','rejected','dispositioned']),termsVersionId:Uuid,targetPitchPolicyVersionId:Uuid.nullable(),targetPitchPolicyEvaluationId:Uuid.nullable(),dispositionDueAt:z.string().datetime({offset:true}).nullable(),version:Version,submittedAt:z.string().datetime({offset:true}),createdAt:z.string().datetime({offset:true}),updatedAt:z.string().datetime({offset:true})}).strict(),meta:ResponseMeta}).strict();
const AuditionAttemptAccepted=z.object({data:z.object({id:Uuid,submissionId:Uuid,taskId:Uuid,round:z.literal(1),mediaState:z.enum(['uploading','verifying','accepted','failed','discarded']),evidenceRefs:z.array(Uuid).max(8),jobId:Uuid}).strict(),meta:ResponseMeta}).strict();
const JobStatus=z.object({data:z.object({jobId:Uuid,state:z.enum(['queued','running','succeeded','failed','cancelled']),attemptCount:z.number().int().nonnegative(),resultRef:Uuid.nullable(),errorCode:z.string().min(1).max(80).nullable()}).strict(),meta:ResponseMeta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| OPP-SUB-API-01 | SubmitApplicationRequest | SubmissionResource / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,413,422,429,503 |
| OPP-SUB-API-02 | AuditionAttemptRequest | JobStatus (result AuditionAttemptAccepted) / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,413,415,422,429,503 |
| OPP-SUB-API-03 | UnsolicitedPitchRequest | SubmissionResource / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation | Field × constraint | Failure |
|---|---|---|
| OPP-SUB-API-01 | IDs UUID and slot belongs to opportunity; `termsVersionId` is current; entity is person/Band acting party | 422 `VALIDATION_FAILED`, concealed foreign target 404 |
| OPP-SUB-API-01 | 1–16 cited evidence refs; 1–64 date confirmations; answers max 32 keys/500 chars | 422 `VALIDATION_FAILED` |
| OPP-SUB-API-01 | eligibility, open slot, non-reviewer and current authority rechecked transactionally | 403 `FORBIDDEN`, 409 `ELIGIBILITY_FAILED` or `VERSION_CONFLICT` |
| OPP-SUB-API-02 | task belongs to submission; exactly one evaluation-only round; upload intent target/purpose/checksum match | 422 `VALIDATION_FAILED`, 409 `PUBLICATION_GATE_FAILED` |
| OPP-SUB-API-02 | checksum 64 lowercase hex; expected version exact; upload job not terminal-invalid | 400 `INVALID_REQUEST`, 409 `VERSION_CONFLICT` |
| OPP-SUB-API-03 | policy/evaluation IDs match current target policy and evaluation hash; policy mode open/open_with_criteria/referral_only | 409 `PITCH_POLICY_CHANGED`, 422 `PITCH_POLICY_CLOSED` |
| OPP-SUB-API-03 | SLA integer 7–30 is read from pinned policy; Fans and unmet criteria/referral rejected | 403 `FORBIDDEN`, 422 `PITCH_CRITERIA_UNMET`/`REFERRAL_REQUIRED` |

### Error, authorization, rate and observability matrix

| Operation | Success | Error classes | 403 vs 404 | Rate / observability |
|---|---|---|---|---|
| OPP-SUB-API-01 | 201 `SubmissionResource` | 400, 401, 403, 404, 409, 413, 422, 429, 503, 504, 500 | known ineligible actor 403; foreign/private opportunity or slot 404 | 10/30 min; log operation/party/versions, metric latency/refusal, audit submission, trace span |
| OPP-SUB-API-02 | 202 `JobStatus` | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 | known non-owner 403; concealed submission/task 404 | 5/hour/submission; log checksum digest only, metric upload/job, audit attempt, trace upload/job |
| OPP-SUB-API-03 | 201 `SubmissionResource` | 400, 401, 403, 404, 409, 422, 429, 503, 504, 500 | Fan/ineligible known actor 403; target policy unreadable/foreign 404 | 3/day/target; log policy/evaluation hash, metric pitch refusals, audit admission, trace policy evaluation |

Every error is BE00's four-field envelope; `details` has safe JSON-pointer violations only. `503/504` are retryable only when the operation did not commit; committed outcomes are replayed by idempotency key.

### Per-operation examples

| ID | Request example | Success example |
|---|---|---|
| OPP-SUB-API-01 | `{ "actingPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "entityId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d5", "termsVersionId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d6", "evidenceRefs":["018f0c45-73fe-7dc2-9c09-68f7ecf132d7"], "availability":[{"date":"2026-09-14","available":true}], "answers":{"experience":"live"} }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8","state":"submitted","version":"1"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d9"} }` |
| OPP-SUB-API-02 | `{ "expectedVersion":"1", "taskId":"018f0c45-73fe-7dc2-9c09-68f7ecf132da", "uploadIntentId":"018f0c45-73fe-7dc2-9c09-68f7ecf132db", "round":1, "evidenceRefs":[], "declaredChecksum":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc","mediaState":"verifying","jobId":"018f0c45-73fe-7dc2-9c09-68f7ecf132dd"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132de"} }` |
| OPP-SUB-API-03 | `{ "actingPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df", "entityId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e0", "policyVersionId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e1", "evaluationId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e2", "evidenceRefs":["018f0c45-73fe-7dc2-9c09-68f7ecf132e3"], "pitch":"Available for the stated role." }` | `{ "data":{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132e4","source":"unsolicited_pitch","state":"submitted","dispositionDueAt":"2026-09-28T19:00:00Z","version":"1"},"meta":{"requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e5"} }` |

## Database Schema

All tables live in `opportunity_private`, use RLS, and have no anon/client grants. Every row has `id uuid`, `owner_id uuid`, closed `state`, `version bigint > 0`, `created_at`, and `updated_at`.

| Model | Fields / constraints | Indexes / RLS |
|---|---|---|
| `submission` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `entity_id uuid FK party NOT NULL`; `opportunity_id uuid FK opportunity NULL`; `slot_id uuid FK opportunity_slot NULL`; `target_party_id uuid FK party NULL`; `source submission_source NOT NULL`; `terms_version_id uuid FK terms NOT NULL`; `target_pitch_policy_version_id/target_pitch_policy_evaluation_id uuid FK NULL`; `submitted_at/disposition_due_at timestamptz NULL`; `state submission_state NOT NULL`; `version bigint >0`; timestamps NOT NULL; unsolicited pitch requires target/policy/deadline and null opportunity/slot | unique active `(entity_id,opportunity_id,slot_id)` and `(entity_id,target_party_id,source)`; applicant/target RLS |
| `submission_version` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `submission_id uuid FK submission NOT NULL`; `answers jsonb NOT NULL`; `evidence_refs uuid[] NOT NULL CHECK cardinality 1..16`; `availability jsonb NOT NULL`; `content_hash bytea NOT NULL`; `created_by_person_id uuid FK person NOT NULL`; `version bigint >0`; timestamps NOT NULL; append-only | `(submission_id,version DESC)`; applicant and authorized target RLS |
| `audition_task` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `submission_id uuid FK submission NOT NULL`; `scope text 1..1000`; `rounds smallint CHECK 1`; `retention_days integer CHECK 1..365`; `payment jsonb NOT NULL`; `rights_posture rights_posture NOT NULL`; `return_destroy_required boolean NOT NULL`; `state audition_task_state NOT NULL`; `version bigint >0`; timestamps NOT NULL | `(submission_id,state)`; applicant/target read; verifier transition function |
| `audition_attempt` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `task_id uuid FK audition_task NOT NULL`; `round smallint CHECK 1`; `attempt_no integer CHECK 1..10`; `upload_object_id uuid FK object_records NOT NULL`; `checksum text CHECK length=64`; `media_state media_state NOT NULL`; `evidence_refs uuid[] NOT NULL`; `version bigint >0`; timestamps NOT NULL | unique `(task_id,round,attempt_no)`; applicant insert, verifier worker update |
| `target_pitch_policy_version` | `id uuid PK`; `target_party_id uuid FK party NOT NULL`; `controller_party_id uuid FK party NOT NULL`; `mode target_pitch_mode NOT NULL`; `disposition_sla_days integer NULL CHECK 7..30`; `criteria_set_id uuid FK criteria NULL`; `referral_class text NULL`; `referral_max_age_days integer NULL CHECK >0`; `rate_policy_version bigint NULL`; `effective_at/expiry/retired_at timestamptz NULL/NOT NULL`; `supersedes_id uuid FK self NULL`; `evaluation_hash text 64 NOT NULL`; `version bigint >0`; `created_at timestamptz NOT NULL` | unique current effective target; controller capability RLS |
| `target_pitch_policy_evaluation` | `id uuid PK`; `owner_id uuid FK party NOT NULL`; `policy_version_id uuid FK target_pitch_policy_version NOT NULL`; `pitcher_party_id uuid FK party NOT NULL`; `pitcher_class pitcher_class NOT NULL`; `criteria_input_hash/referral_evidence_hash text 64 NULL`; `rate_input_hash text 64 NOT NULL`; `outcome evaluation_outcome NOT NULL`; `reason evaluation_reason NOT NULL`; `evaluated_at timestamptz NOT NULL`; `consumed_by_submission_id uuid FK submission NULL`; version/updated_at NOT NULL | `(policy_version_id,pitcher_party_id,evaluated_at DESC)`; evaluator function only; no queue fields |

### State, RLS and grants

`submission: draft → submitted → terms_changed|held|shortlisted|offered|withdrawn|accepted|declined|rejected|dispositioned`; `audition_attempt: created → uploading → verifying → accepted|failed|discarded`; `target_pitch_policy_evaluation: evaluated → consumed|expired`. Applicant cannot self-author a disposition. An upload failure leaves previous attempts intact. Only a current target policy evaluation can be consumed, and consumption plus submission/deadline is one transaction.

| Role | Grant / predicate |
|---|---|
| Applicant entity | select own submission/versions/tasks/attempts; insert own submission and attempt under acting-party capability |
| Target reviewer | select target-anchored submission/pitch content only under policy capability; no evidence outside scoped target |
| Shard 06 moderator | case-scoped evidence enforcement; no submission eligibility override |
| Upload verifier worker | execute named transition function; object checksum and task rights gate required |
| Public/Fan/anon | no submission, audition, pitch, queue or evidence grants |

## Middleware & Policies

### Per-Operation Middleware Registry (named policy)

| Operation ID | Ordered chain |
|---|---|
| OPP-SUB-API-01 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(10/min/user,30/min/party) -> parseZod(SubmitApplicationRequest) -> authorizeApplicantEligibility -> idempotency -> If-Match -> transaction -> audit/outbox |
| OPP-SUB-API-02 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(5/hour/submission,30/min/user) -> parseZod(AuditionAttemptRequest) -> authorizeTaskAndUploadIntent -> idempotency -> If-Match -> jobAdmission -> audit/outbox |
| OPP-SUB-API-03 | requestId -> strictCors(BE13-CORS-WEB-CREDENTIALLED) -> requireAuth -> resolveActingContext -> rateLimit(3/day/target,30/day/user) -> parseZod(UnsolicitedPitchRequest) -> evaluateTargetPolicy -> idempotency -> transaction -> audit/outbox |


`requestId → strictCors(registered web origins; no wildcard credentials) → securityHeaders → bodyLimit → contentType → rateLimit → auth → actingContext → zod → capability/ownership → policy/evidence check → idempotency → If-Match → handler → audit/outbox`. A pitch route evaluates target-local policy again at submit; absence/expiry/unreadability is `PITCH_POLICY_CLOSED`. Bulk, one-click, template, or inferred submissions are schema-inexpressible.

| Operation | Explicit middleware and CORS policy |
|---|---|
| OPP-SUB-API-01 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(submission) → auth → actingContext → zod → applicant ownership/eligibility → idempotency → If-Match → handler → audit/outbox`. |
| OPP-SUB-API-02 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(upload) → auth → actingContext → zod → applicant/task ownership → upload-intent policy → idempotency → If-Match → handler → audit/outbox`. |
| OPP-SUB-API-03 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit → contentType → rateLimit(pitch) → auth → actingContext → zod → professional eligibility → target policy evaluation → idempotency → handler → audit/outbox`. |

## Data Flow

Recovery behavior is included in each flow below.

Submission commits evidence refs and an immutable version, then emits `opportunity.submission.changed.v1`. Audition uses BE00 upload intent; verification queue retries 100/500/2,500/12,500/60,000ms up to five times, quarantines failed objects and sends DLQ. Pitch admission atomically consumes the policy evaluation, computes `disposition_due_at`, and schedules expiry; later policy changes cannot rewrite it. All consumers use an inbox keyed by `(consumer,event_id)` and preserve unknown/stale observations.

## Events and Consumer Contracts

| Event type | Minimum payload | Consumers |
|---|---|---|
| `opportunity.submission.changed.v1` | submission/entity/post-slot-or-target/source/pinned policy/disposition due/state/version | applicant, owner, review and pitch-expiry projectors |

Event payload excludes résumé/media bytes, evidence contents, private pitch text, queue position, reviewer notes, PII and provider tokens.

## Error Handling

| Code | HTTP | Meaning / recovery |
|---|---:|---|
| `ELIGIBILITY_FAILED` | 409 | Named criterion code; no mutation; applicant fixes evidence/availability. |
| `PUBLICATION_GATE_FAILED` | 409 | Audition task terms are invalid; no attempt accepted. |
| `PITCH_POLICY_CLOSED` | 422 | Target has no admissible open policy; no queue lookup. |
| `PITCH_POLICY_CHANGED` | 409 | Evaluation stale; caller re-evaluates and explicitly resubmits. |
| `PITCH_CRITERIA_UNMET` / `REFERRAL_REQUIRED` | 422 | Typed refusal without target queue leakage. |
| `UPLOAD_FAILED` | 502/503 | Job retry/DLQ; prior attempts and evidence remain. |
| `VERSION_CONFLICT` / `IDEMPOTENCY_MISMATCH` | 409 | Re-read ETag or use original key; never merge payloads. |

## Verification and Test Strategy

| Level | Required assertions |
|---|---|
| Contract | Valid examples; strict unknown-key rejection; UUID/date/checksum/round/SLA constraints; policy mode and evaluation hash binding. |
| Permission | Applicant/target/reviewer/Fan matrix; candidate reviewer is excluded; foreign target is concealed 404; no raw evidence or pitch leakage. |
| Integration | Submission supersession uniqueness; upload resume/quarantine/DLQ; policy evaluation consumption and immutable pitch deadline; outbox/inbox replay. |
| Concurrency | Duplicate submissions, concurrent terms changes, stale If-Match, competing policy publication and evaluation consumption. |
| Performance/security | 2s p95 commands, 15s hard deadline, CORS/security headers, 30/day pitch budget, RLS direct-table denial and PII-redacted logs. |

### Per-Operation Verification Matrix

| Operation ID | Required contract, security, concurrency, seam and observability tests |
|---|---|
| OPP-SUB-API-01 | strict submission response and request; eligibility/non-reviewer 403 vs concealed 404; duplicate/CAS/idempotency; Shard 01/06 breaker recovery; RLS, event, CORS, rate and redacted audit |
| OPP-SUB-API-02 | strict JobStatus/AuditionAttemptAccepted; upload intent/checksum; owner/RLS and concurrent attempts; upload circuit/DLQ recovery; exact error, trace, CORS and media privacy |
| OPP-SUB-API-03 | strict pitch resource; policy mode/evaluation hash and Fan refusal; duplicate/consumption CAS; policy seam timeout/breaker; deadline, event, rate, CORS and redaction |

## Deepening Passes and Ambiguity Gate

1. Endpoint reconciliation covers OPP-07, OPP-08 and OPP-09 exactly once.
2. Contract pass binds every request/success/error to strict Zod and BE00 envelope.
3. Concurrency pass defines supersession, evaluation consumption and upload resume races.
4. Authorization pass names actor/entity ownership, target scope and 403/404 behavior.
5. Observability pass adds logs, metrics, audit and spans for all three operations.
6. Abuse pass bounds evidence, pitch volume, rounds, body size and enumeration.
7. Partial-state pass preserves prior attempts, no queue writes on refusal, and DLQ recovery.

## Ambiguity Gate

**PASS.** OPP-07–09 each has a stable route, strict request/success/error contract, field constraints, CORS/auth/rate/observability rows, persistence/RLS state machine, retry policy, exact examples and tests. Two implementers can ship the split without a new product or architecture decision.

PASS evidence: OPP-SUB-API-01–OPP-SUB-API-03 each have one authoritative route, typed request/success schemas and exact ApiError rows, named CORS/auth/rate/validation middleware, 403/404 rules, idempotency/observability/test rows, typed persistence/FK/index/RLS/grant entries, and exact seam timeout/retry/breaker recovery.

## Open Questions

None. All product decisions are inherited from the IA shard; implementation decisions are locked here.

## Changelog

| Date | Change | Workflow | Sections |
|---|---|---|---|
| 2026-08-28 | Initial complete BE authoring for OPP-07–09 | `/write-be-spec` | All |

## Dependency References

- [BE00 platform foundation](00-infrastructure.md) — upload, jobs, transport, errors, idempotency, outbox and RLS.
- [BE13a publication](13a-opportunity-publication-discovery-alerts.md) — frozen opportunity terms and target policy.
- [IA Shard 01](../ia/01-identity-authority.md) — acting context and mandates.
- [IA Shard 06](../ia/06-trust-safety.md) — evidence and reachability enforcement.
- [13c triage/offers](13c-triage-offers-dispositions.md) — consumes submitted candidates.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
