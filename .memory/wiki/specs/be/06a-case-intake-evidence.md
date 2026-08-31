# BE 06a — Case intake and evidence

## Split Group

This companion owns the case-intake, protected safety-lane and evidence
mechanics of Shard 06:

- TSE-01 Submit safety report
- TSE-03 Route and claim case
- TSE-04 Review case
- TSE-08 Restrict another user
- TSE-14 Handle safety/crisis intake
- TSE-16 Capture evidence
- TSE-17 Place/release legal hold

It covers 24.01.01 Report Intake & Notice-and-Action Flow, 24.01.03
Moderation Queue Routing & Reviewer Operations, 24.06.01 Harassment, Stalking
& Doxxing Enforcement, 24.06.03 Crisis & Welfare Escalation and 24.09 Case
Evidence Locker & Chain of Custody. TSE-02, TSE-10 through TSE-13, TSE-15 and
TSE-18 through TSE-26 are owned by 06c; TSE-05 through TSE-07 and TSE-09,
TSE-20 through TSE-22 and TSE-26 policy enforcement are owned by 06b.

Shard 01 owns party, mandate and ownership truth. Shard 05 owns capability,
retention orchestration and counsel-gate configuration. Source domains own
transactions, content, objects and event-time capture points. This companion
never edits allegations, creates a finding, changes ownership or exposes
restricted evidence.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| TSE-01 Submit safety report | TSE-06A-01 | Public or authenticated intake command with protected identity branch | Target/reason validation, idempotency and initial case, snapshot, route and capture intent commit atomically; excess volume reweights but never blocks intake. |
| TSE-03 Route and claim case | TSE-06A-02 | Weighted-fair routing query plus exclusive lease command | Severity/deadline policy selects a lane; eligible staff obtains a compare-and-set lease without resetting clocks or weakening the S0 safety floor. |
| TSE-04 Review case | TSE-06A-03 | Protected reviewer projection and draft/proposal command | Minimum safe projection, conflict/mandate/exposure controls and exact policy version are required; allegation and immutable snapshot remain separate. |
| TSE-08 Restrict another user | TSE-06A-04 | Private actor-to-subject edge command | Current acting context creates or changes a deny-first non-discoverable edge; no case, finding or notification is created. |
| TSE-14 Handle safety/crisis intake | TSE-06A-05 | Protected safety lane and resources-only crisis command | Harassment/doxxing enters a sealed lane; crisis returns resources without classifier, sanction, appeal or reviewer requirement. |
| TSE-16 Capture evidence | TSE-06A-06 | Source-transaction capture intent and asynchronous evidence seal command | Source event atomically creates intent; worker hashes fields/media and appends an immutable chain entry or explicit capture_failed marker. |
| TSE-17 Place/release legal hold | TSE-06A-07 | Counsel-authorized retention hold state transition | Named basis, manifest, release condition, step-up and expected version control an unbounded hold clock; release only re-evaluates clocks. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/06-trust-safety.md | title, links, overview and scope lines 1-24 | Confirms canonical Shard 06 source and case/safety/evidence boundary. |
| .memory/wiki/specs/ia/06-trust-safety.md | features and delivery phases lines 26-44 | Binds five assigned feature rows and consumer/counsel phase limits. |
| .memory/wiki/specs/ia/06-trust-safety.md | acceptance criteria lines 46-57, 61-68 and 94 | Supplies TSE-01, TSE-03, TSE-04, TSE-08, TSE-14, TSE-16 and TSE-17 preconditions, behavior and failure recovery. |
| .memory/wiki/specs/ia/06-trust-safety.md | interactions and global rules lines 75-114 | Supplies exact interaction identifiers, identity sealing, deny-first edges and capture rules. |
| .memory/wiki/specs/ia/06-trust-safety.md | core, intake, evidence and access contracts lines 115-141 and 258-292 | Supplies CaseKind/State, CreateReport, RouteCase, ClaimCase, AppendCaseMaterial, SealEvidence, EvidenceProjection and actor escalation. |
| .memory/wiki/specs/ia/06-trust-safety.md | data models and typed registry lines 181-257 | Supplies the 13 assigned model names, fields, deterministic SQL types and cardinality. |
| .memory/wiki/specs/ia/06-trust-safety.md | accessibility and event schemas lines 294-328 | Supplies accessible safety forms, sealed evidence behavior and assigned event types. |
| .memory/wiki/specs/ia/06-trust-safety.md | edge cases and coverage matrix lines 330-397 | Supplies report brigading, lease loss, reporter privacy, evidence failure, hold and restriction tests. |
| .memory/wiki/specs/ia/06-trust-safety.md | dependency map and changelog lines 397-491 | Confirms Shard 00, 01 and 05 contracts and ownership boundaries. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | scope and deepening record lines 1-18 | Confirms case, evidence, capture and hold ownership plus adversarial convergence. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | case/intake/routing and evidence field contracts lines 20-31 and 45-57 | Expands all assigned case, intake, route, lease, evidence, capture and hold fields. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | state machines lines 59-83 | Locks case, evidence and legal-hold transitions and immutable clocks. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | intake/routing and evidence algorithms lines 85-95 and 147-156 | Locks hash/idempotency, weighted-fair routing, safe projection, chain hash, restricted preservation and erasure interaction. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | abuse/recovery and cross-shard lines 158-194 | Locks anti-brigading, staff access, reporter privacy, atomic capture and Shard 01/05 boundaries. |
| .memory/wiki/specs/feature-ledger.md | rows 198-199, 484-486 and 205-205 | Reconciles 24.01.01, 24.01.03, 24.06.01, 24.06.03 and 24.09 to assigned operations. |
| .memory/wiki/specs/be/00-infrastructure.md | inventory, ApiError and contracts lines 22-41 and 112-138 | Inherits RequestContext, strict Zod 4 and exact ApiError { code, message, requestId, details }. |
| .memory/wiki/specs/be/00-infrastructure.md | database, middleware, jobs, object and provider lines 202-365 | Inherits private schema, RLS, middleware order, idempotency, queue retry, object and provider circuit rules. |
| .memory/wiki/specs/be/00-infrastructure.md | errors, observability, tests and ambiguity lines 416-534 | Inherits typed failures, scrubbed telemetry, recovery tests and quality gates. |
| .memory/wiki/specs/2026-08-02-architecture-design.md | stack, authorization, storage and event seams lines 157-167, 348-370 and 495-502 | Confirms Hono/Zod, PostgreSQL authority, server-derived acting context and replaceable adapters. |
| .memory/wiki/specs/data-placement-strategy.md | placement and security lines 13-16, 23-32, 42-52 and 120-130 | Confirms protected relational/evidence placement, object metadata authority and RLS isolation. |
| .memory/wiki/specs/ENGINEERING-STANDARDS.md | contract, bounds, security and migration lines 35-50, 92-101 and 149-188 | Sets strict validation, 256 KiB body, 50-row list, endpoint and RLS test floors. |

## IA Source Map

| Exact source item | 06a ownership | Backend realization |
|---|---|---|
| TSE-01 Submit safety report | Owned | TSE-06A-01, report_intake, safety_case, case_target, case_party and initial route/capture intent. |
| TSE-03 Route and claim case | Owned | TSE-06A-02, case_route and case_lease with weighted fairness and CAS. |
| TSE-04 Review case | Owned | TSE-06A-03, minimum projection and reviewer draft outside canonical decision. |
| TSE-08 Restrict another user | Owned | TSE-06A-04, restriction_edge deny-first private relation. |
| TSE-14 Handle safety/crisis intake | Owned | TSE-06A-05, protected lane or resources-only crisis result. |
| TSE-16 Capture evidence | Owned | TSE-06A-06, capture_intent, evidence_bundle and evidence_entry chain. |
| TSE-17 Place/release legal hold | Owned | TSE-06A-07, legal_hold and retention_clock. |
| safety_case | Owned | Case aggregate with immutable original deadline and version. |
| case_party | Owned | Role, mandate and disclosure projection. |
| case_target | Owned | Target snapshot and actor/context version. |
| report_intake | Owned | Reporter pseudonym/protected identity, reason and encrypted narrative. |
| case_route | Owned | Weighted-fair route computation evidence. |
| case_lease | Owned | Exclusive expiring reviewer lease. |
| evidence_bundle | Owned | Case evidence class, retention and chain head. |
| evidence_entry | Owned | Append-only event-time snapshot and media hash entry. |
| capture_intent | Owned | Atomic source capture request, retry and terminal status. |
| legal_hold | Owned | Counsel-authorized hold manifest and release condition. |
| retention_clock | Owned | Maximum applicable retention and unbounded hold clock. |
| restriction_edge | Owned | Actor-to-subject non-discoverable restriction. |
| audit_event | Owned | Immutable safe access and intake audit metadata without logs as truth. |
| safety.case.received.v1 | Owned event | Identifier-only event after intake transaction. |
| safety.case.routed.v1 | Owned event | Identifier-only route/lease hint after route commit. |
| safety.restriction.changed.v1 | Owned event | Identifier-only edge version hint after restriction commit. |
| safety.evidence.sealed.v1 | Owned event | Identifier-only evidence bundle/entry hint after seal commit. |
| TSE-02, TSE-10 through TSE-13, TSE-15, TSE-18 through TSE-26 | Excluded | 06c owns notice, disputes, legal, specialist and governance workflows. |
| TSE-05 through TSE-07, TSE-09 and TSE-20 through TSE-22 | Excluded | 06b owns policy, enforcement, advisory and specialised enforcement workflows. |

## Feature Ledger Coverage

| Feature ledger ID | Feature | Operation coverage | Acceptance evidence |
|---|---|---|---|
| 24.01.01 | Report Intake & Notice-and-Action Flow | TSE-06A-01 | Addressable target, reason registry, anonymous non-enumerability, protected identity and idempotent case snapshot. |
| 24.01.03 | Moderation Queue Routing & Reviewer Operations | TSE-06A-02 and TSE-06A-03 | S0 isolation, weighted-fair deadline routing, exposure/conflict checks, lease CAS and safe projection. |
| 24.06.01 | Harassment, Stalking & Doxxing Enforcement | TSE-06A-05 | Protected lane, sealed reporter identity, typed response and no unsafe exposure. |
| 24.06.03 | Crisis & Welfare Escalation | TSE-06A-05 | Resources-only response without classifier, ladder, sanction or refusal that withholds resources. |
| 24.09 | Case Evidence Locker & Chain of Custody | TSE-06A-06 and TSE-06A-07 | Event-time snapshot, prior-hash chain, restricted preservation, hold clocks and capture_failed evidence. |

## Endpoint Completeness Reconciliation

Each assigned interaction has one authoritative route row, one request and
success contract, one error row, one authorization row, one external-seam
row, one observability row and one test row keyed by operation ID. TSE-06A-01
creates the initial case and does not expose a generic case enumeration route.
TSE-06A-02 combines route selection and claim with an action branch while
keeping lease acquisition CAS-protected. TSE-06A-06 is asynchronous after an
atomic source capture intent; the user-facing source transaction never waits
for evidence delivery.

No route duplicates authentication, upload, object, webhook, generic job,
policy decision, dispute, DMCA, legal disclosure or Shard 05 hold-planning
endpoints. Evidence projection is capability and purpose filtered; a case
identifier never grants evidence access.

## Shared Contract Inheritance

All operations inherit BE00 request ID, transport and exact CORS policy,
body/query ceilings, Supabase session validation, server-derived acting
context, CSRF for cookie mutations, strict Zod 4 parsing, capability/RLS,
idempotency, transactional outbox, queue delivery and ApiError
{ code, message, requestId, details }. details is bounded to 16 keys, four
levels and 8 KiB.

Every command carries actor_person_id, acting_party_id when present,
acting_context_version, idempotency_key, expected_version when mutable,
request_id and required step-up proof. Reporter identity, detection method,
reviewer identity, legal prohibition and restricted evidence never enter
ordinary response, log or event projections.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and capability | Request contract | Success contract | Error contract | Idempotency and rate | CORS and middleware |
|---|---|---|---|---|---|---|---|---|
| TSE-06A-01 | TSE-01 Submit safety report | POST /api/v1/safety/reports | Anonymous lawful target mode or authenticated reporter/claimant with current acting context | Tse06a01ReportRequest | Tse06a01ReportResponse 201 | ApiError { code, message, requestId, details }; 400 or 401 or 404 or 409 or 422 or 429 | Idempotency-Key required; 10/min reporter or anonymous session, excess admitted and reweighted; 15s | CORS first-party consumer allowlist with credentials; BE00 request-id, raw guard, strict Zod, session/context, CSRF, rate, RPC and ApiError normalization |
| TSE-06A-02 | TSE-03 Route and claim case | POST /api/v1/safety/cases/{caseId}/claim | Moderator or safety specialist queue capability, exposure budget and no party/target/mandate conflict | Tse06a02ClaimRequest | Tse06a02ClaimResponse 200 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 60/min staff and 120/min team; 15s | CORS first-party staff console allowlist with credentials; BE00 session, context, CSRF, strict Zod, capability, rate, CAS and ApiError normalization |
| TSE-06A-03 | TSE-04 Review case | POST /api/v1/safety/cases/{caseId}/review | Assigned reviewer with unexpired lease and exact case policy capability | Tse06a03ReviewRequest | Tse06a03ReviewResponse 200 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 30/min reviewer and 60/min team; 15s | CORS first-party staff console allowlist with credentials; BE00 session, context, CSRF, strict Zod, lease, exposure, capability, rate and ApiError normalization |
| TSE-06A-04 | TSE-08 Restrict another user | POST /api/v1/safety/restrictions | Authenticated consumer with current acting context; no staff capability required | Tse06a04RestrictionRequest | Tse06a04RestrictionResponse 200 | ApiError { code, message, requestId, details }; 401 or 404 or 409 or 422 | Idempotency-Key required; 30/min user and 60/min party; 15s | CORS first-party consumer allowlist with credentials; BE00 session, context, CSRF, strict Zod, rate, RPC and ApiError normalization |
| TSE-06A-05 | TSE-14 Handle safety/crisis intake | POST /api/v1/safety/intake | Authenticated safety reporter for harassment lane; crisis resources available with intake validation only | Tse06a05SafetyIntakeRequest | Tse06a05SafetyIntakeResponse 201 | ApiError { code, message, requestId, details }; 400 or 401 or 404 or 409 or 422 or 503 | Idempotency-Key required; 10/min reporter, crisis resource response 30/min; 15s | CORS first-party consumer allowlist with credentials; BE00 session/context, CSRF, strict Zod, safety lane, rate and ApiError normalization |
| TSE-06A-06 | TSE-16 Capture evidence | POST /api/v1/safety/cases/{caseId}/evidence | Source service principal with capture intent or authorized evidence worker; no user-facing wait | Tse06a06CaptureRequest | Tse06a06CaptureResponse 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 or 503 | Idempotency-Key required; 120/min source and 600/min worker; 15s acceptance, queued worker | CORS non-browser service allowlist; BE00 request-id, service principal, strict Zod, capability, rate, queue and ApiError normalization |
| TSE-06A-07 | TSE-17 Place/release legal hold | POST /api/v1/safety/legal-holds/actions | Counsel-authorized legal/privacy custodian, fresh MFA and exact object manifest | Tse06a07LegalHoldActionRequest | Tse06a07LegalHoldActionResponse 200 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 10/min custodian and 20/min party; 15s | CORS first-party legal console allowlist with credentials; BE00 session, context, CSRF, step-up, strict Zod, capability, rate, RPC and ApiError normalization |

### Registry invariants

- Reports validate the target and reason registry before target existence is
  disclosed. Anonymous receipt is opaque and non-enumerable; lawful anonymous
  mode cannot be used for legal/DMCA notice.
- Intake writes case, target snapshot, report, initial route request, capture
  intent and audit metadata in one transaction. A duplicate idempotency key
  returns the original case; a different normalized payload returns
  IDEMPOTENCY_MISMATCH without a second case.
- Reporter volume never blocks admission or changes guilt. Excess budget
  changes routing weight and emits an advisory signal handled by 06b.
- S0 cases route to an isolated queue with no general-queue fallback. Lease
  expiry preserves original deadline and returns the case to its weighted-fair
  lane.
- Reviewer projection shows mutable target beside immutable intake snapshot,
  blurs or mutes sensitive media and omits sealed fields. Draft text stays
  outside canonical decision until 06b review/decision routes act.
- Restriction edges are private actor-to-subject records, deny-first at the
  source and never discoverable by the subject or a counterparty. They do not
  create a safety case or notify the subject.
- Evidence entries are append-only, sequence-locked and chained by prior
  hash. A capture failure is explicit evidence degradation attached to a live
  case, never a reason to close it.
- Holds are counsel-authorized and time-boxed only by release condition;
  active hold contributes an unbounded retention clock. Release deletes
  nothing and reruns all remaining clocks.
- 403 means the visible case/edge/hold exists but the action is outside the
  actor grant. 404 hides a target, case, edge, evidence or hold when
  visibility itself is not permitted.

### Operation contract and error matrix

| Operation ID | Request and success | Error codes and status | 403 versus 404 |
|---|---|---|---|
| TSE-06A-01 | ReportRequest to ReportResponse with opaque receipt, case ID and safe state | VALIDATION_FAILED 422; UNAUTHENTICATED 401; TARGET_NOT_FOUND 404; IDEMPOTENCY_MISMATCH 409; RATE_LIMITED 429 | Unaddressable or undisclosable target is 404; known target with missing reporter standing is 403 only after visibility is lawful; no target existence leaks from validation. |
| TSE-06A-02 | ClaimRequest to ClaimResponse with route, lease expiry and case version | UNAUTHENTICATED 401; FORBIDDEN 403; CASE_NOT_FOUND 404; VERSION_CONFLICT 409; CASE_LEASE_LOST 409 | Hidden or wrong-lane case is 404; visible case with missing queue capability, conflict or exposure budget is 403. |
| TSE-06A-03 | ReviewRequest to ReviewResponse with safe projection and draft/proposal status | UNAUTHENTICATED 401; FORBIDDEN 403; CASE_NOT_FOUND 404; CASE_LEASE_LOST 409; POLICY_VERSION_INVALID 422 | Hidden case/evidence is 404; visible case with expired lease, conflict or exposure denial is 403/409 without sealed fields. |
| TSE-06A-04 | RestrictionRequest to RestrictionResponse with effective edge version | UNAUTHENTICATED 401; SUBJECT_NOT_FOUND 404; VERSION_CONFLICT 409; VALIDATION_FAILED 422 | Subject is always existence-safe 404; an existing edge is never revealed to the subject or counterparty. |
| TSE-06A-05 | SafetyIntakeRequest to SafetyIntakeResponse with protected case or resources-only result | VALIDATION_FAILED 422; UNAUTHENTICATED 401; TARGET_NOT_FOUND 404; IDEMPOTENCY_MISMATCH 409; PROVIDER_UNAVAILABLE 503 | Hidden safety target is 404; protected lane capability is evaluated without reporter disclosure; crisis resources remain available on advisory outage. |
| TSE-06A-06 | CaptureRequest to CaptureResponse with intent ID, status and evidence version | UNAUTHENTICATED 401; FORBIDDEN 403; CASE_NOT_FOUND 404; VERSION_CONFLICT 409; CAPTURE_FAILED 503 | Unreadable case or source is 404; worker/source without capture scope is 403; terminal failure remains explicit. |
| TSE-06A-07 | LegalHoldActionRequest to LegalHoldActionResponse with hold/clock version | UNAUTHENTICATED 401; FORBIDDEN 403; HOLD_NOT_FOUND 404; VERSION_CONFLICT 409; COUNSEL_GATE_DISABLED 422 | Hidden manifest or hold is 404; visible hold without counsel capability or step-up is 403/401; no object list leaks. |

## Request/Response Contracts (Zod 4 schemas)

All wire objects are Zod 4 strictObject schemas. Unknown keys fail. IDs are
UUIDs, timestamps carry offsets, free text is bounded and normalized before
hashing, and protected response projections never contain reporter identity,
sealed evidence or reviewer identity.

~~~ts
import { z } from "zod";

const Uuid = z.uuid();
const IsoTime = z.string().datetime({ offset: true });
const Version = z.string().regex(/^[1-9][0-9]{0,17}$/);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Code = z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/);
const Text = z.string().trim().min(1).max(2048);
const ReasonCode = z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/);
 const JsonObject = z.record(z.string().max(128), z.json()).superRefine((v, c) => {
  if (Object.keys(v).length > 64) c.addIssue({ code: "custom", message: "too many keys" });
  if (JSON.stringify(v).length > 65536) c.addIssue({ code: "custom", message: "object exceeds 64 KiB" });
});
const CaseKind = z.enum(["safety_report", "moderation", "dmca", "fraud_review", "transaction_dispute", "impersonation", "ownership", "legal_process", "illegal_content", "crisis", "governance", "counterfeit_authenticity", "leak_forensics", "review_integrity", "meetup_safety"]);
const CaseState = z.enum(["draft", "received", "triaged", "queued", "claimed", "reviewing", "awaiting_party", "proposed", "awaiting_control", "decided", "appealed", "resolved", "closed", "capture_failed"]);
const Severity = z.enum(["S0_illegal", "S1_active_harm", "S2_material", "S3_standard", "S4_low"]);
const EvidenceClass = z.enum(["ordinary", "sensitive", "legal", "restricted_preservation"]);
const ApiError = z.strictObject({
  code: Code,
  message: z.string().min(1).max(256),
  requestId: Uuid,
   details: z.record(z.string().max(64), z.json()).superRefine((v, c) => {
    if (Object.keys(v).length > 16) c.addIssue({ code: "custom", message: "too many details" });
  })
});

export const Tse06a01ReportRequest = z.strictObject({
  targetType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  targetId: Uuid,
  targetVersion: Version,
  reasonCode: ReasonCode,
  reasonRegistryVersion: Version,
  narrative: z.string().trim().max(8192).nullable(),
  reporterMode: z.enum(["identified", "pseudonymous", "anonymous"]),
  actingPartyId: Uuid.nullable(),
  channel: z.enum(["web", "mobile", "api", "trusted_flagger"]),
  evidenceRefs: z.array(Uuid).max(16)
});
export const Tse06a01ReportResponse = z.strictObject({
  caseId: Uuid,
  intakeId: Uuid,
  targetId: Uuid,
  state: CaseState,
  receiptRef: z.string().regex(/^[A-Za-z0-9_-]{22,128}$/),
  severity: Severity,
  nextStep: z.enum(["received", "resources", "safe_status"]),
  createdAt: IsoTime,
  requestId: Uuid
});

export const Tse06a02ClaimRequest = z.strictObject({
  expectedCaseVersion: Version,
  queueKey: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  leaseSeconds: z.number().int().min(60).max(1800),
  exposureBudgetRef: z.string().min(1).max(128)
});
export const Tse06a02ClaimResponse = z.strictObject({
  caseId: Uuid,
  caseVersion: Version,
  state: z.literal("claimed"),
  queueKey: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  leaseId: Uuid,
  leaseExpiresAt: IsoTime,
  originalDueAt: IsoTime.nullable(),
  severity: Severity
});

export const Tse06a03ReviewRequest = z.strictObject({
  expectedCaseVersion: Version,
  policyRuleVersionId: Uuid,
  findingDraft: z.enum(["no_action", "needs_more_material", "propose_decision"]),
  rationale: z.string().trim().min(1).max(4096),
  consequencePreview: JsonObject.nullable(),
  responseToParty: z.string().trim().max(4096).nullable(),
  materialRefs: z.array(Uuid).max(64)
});
export const Tse06a03ReviewResponse = z.strictObject({
  caseId: Uuid,
  caseVersion: Version,
  state: z.enum(["reviewing", "awaiting_party", "proposed"]),
  policyRuleVersionId: Uuid,
  safeTarget: z.strictObject({ targetType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/), targetId: Uuid, targetVersion: Version }),
  intakeSnapshotHash: Hash,
  sealedMaterialOmitted: z.literal(true),
  draftId: Uuid
});

export const Tse06a04RestrictionRequest = z.strictObject({
  subjectPersonId: Uuid,
  expectedEdgeVersion: Version.nullable(),
  action: z.enum(["create", "remove"]),
  scope: z.enum(["messaging", "search", "marketplace", "all_interaction"]),
  reasonCode: ReasonCode
});
export const Tse06a04RestrictionResponse = z.strictObject({
  edgeId: Uuid,
  state: z.enum(["active", "removed"]),
  scope: z.enum(["messaging", "search", "marketplace", "all_interaction"]),
  version: Version,
  effectiveAt: IsoTime
});

export const Tse06a05SafetyIntakeRequest = z.strictObject({
  mode: z.enum(["harassment_doxxing", "crisis_resources"]),
  targetType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/).nullable(),
  targetId: Uuid.nullable(),
  reasonCode: ReasonCode.nullable(),
  narrative: z.string().trim().max(8192).nullable(),
  reporterMode: z.enum(["identified", "pseudonymous", "anonymous"]),
  resourceLocale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  actingPartyId: Uuid.nullable()
}).superRefine((v, c) => {
  if (v.mode === "harassment_doxxing" && (v.targetId === null || v.reasonCode === null)) c.addIssue({ code: "custom", message: "protected lane target and reason required" });
  if (v.mode === "crisis_resources" && v.narrative === null) c.addIssue({ code: "custom", message: "crisis intake requires bounded intake text" });
});
export const Tse06a05SafetyIntakeResponse = z.strictObject({
  mode: z.enum(["harassment_doxxing", "crisis_resources"]),
  caseId: Uuid.nullable(),
  state: z.enum(["received", "resources"]),
  resources: z.array(z.strictObject({ key: z.string().max(128), label: z.string().max(256), uri: z.string().url() })).max(16),
  reporterIdentityProtected: z.literal(true),
  createdAt: IsoTime
});

export const Tse06a06CaptureRequest = z.strictObject({
  sourceEventType: z.string().regex(/^[a-z][a-z0-9.-]{1,127}$/),
  sourceEventId: Uuid,
  sourceEventVersion: Version,
  caseId: Uuid,
  fieldManifest: z.array(z.string().regex(/^[a-z][a-z0-9_.-]{1,127}$/)).min(1).max(128),
  blobManifest: z.array(z.strictObject({ objectId: Uuid, hash: Hash })).max(64),
  expectedCaseVersion: Version.nullable()
});
export const Tse06a06CaptureResponse = z.strictObject({
  captureIntentId: Uuid,
  evidenceBundleId: Uuid,
  state: z.enum(["intent_recorded", "capturing", "sealed", "capture_failed"]),
  attemptCount: z.number().int().min(0).max(3),
  evidenceEntryId: Uuid.nullable(),
  terminalReason: Code.nullable()
});

export const Tse06a07LegalHoldActionRequest = z.strictObject({
  action: z.enum(["place", "release"]),
  holdId: Uuid.nullable(),
  expectedHoldVersion: Version.nullable(),
  basisCode: ReasonCode,
  authorityRef: z.string().trim().min(1).max(256),
  objectManifest: z.array(z.strictObject({ objectType: z.string().max(64), objectId: Uuid, version: Version })).min(1).max(500),
  releaseCondition: Text,
  stepUpToken: z.string().min(20).max(4096),
  actingPartyId: Uuid.nullable()
}).superRefine((v, c) => {
  if (v.action === "release" && v.holdId === null) c.addIssue({ code: "custom", path: ["holdId"], message: "release requires hold" });
});
export const Tse06a07LegalHoldActionResponse = z.strictObject({
  holdId: Uuid,
  state: z.enum(["proposed", "active", "released"]),
  retentionClockId: Uuid,
  objectManifestHash: Hash,
  version: Version,
  effectiveAt: IsoTime
});

export type Tse06aApiError = z.infer<typeof ApiError>;
~~~

## Database Schema

All tables below are private platform_private tables with forced RLS. Every
field lists SQL type, nullability and a constraint. Foreign keys, indexes and
grant boundaries are explicit. Narrative and protected identity use encrypted
columns managed by a server-only key reference; plaintext is never exposed to
the Data API. Polymorphic target and source IDs have no generic foreign key:
the typed registry RPC validates the producer projection and version.

### Canonical records and fields

| Table | Fields with SQL type, nullability and constraints | Foreign keys | Query indexes and uniqueness | RLS and grants |
|---|---|---|---|---|
| platform_private.safety_case | id uuid NOT NULL PRIMARY KEY; kind text NOT NULL CHECK closed CaseKind; state text NOT NULL CHECK closed CaseState; severity text NOT NULL CHECK S0_illegal or S1_active_harm or S2_material or S3_standard or S4_low; queue_key text NOT NULL; jurisdiction_codes text[] NOT NULL CHECK cardinality <=32; policy_clock_started_at timestamptz NOT NULL; original_due_at timestamptz NULL; current_due_at timestamptz NULL; confidentiality text NOT NULL CHECK ordinary or protected or legal; owner_capability text NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; closed_reason text NULL | owner_capability is a registered capability reference validated by RPC; no generic target FK because one case has typed targets | INDEX state, severity, queue_key, current_due_at; INDEX owner_capability, state; INDEX created_at DESC; UNIQUE id and version; partial INDEX S0_illegal queue_key WHERE severity = S0_illegal | RLS enabled and forced; authenticated has no direct grant; case RPC filters staff assignment/conflict; reporter receives only opaque safe status; app_worker has named RPC EXECUTE |
| platform_private.case_target | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; target_type text NOT NULL CHECK registered type; target_id uuid NOT NULL; target_version bigint NOT NULL CHECK >0; actor_person_id uuid NULL; acting_party_id uuid NULL; acting_context_version bigint NULL; intake_snapshot_hash text NOT NULL CHECK 64 lowercase hex; deleted_at timestamptz NULL; role text NOT NULL CHECK subject or reporter_context or object; created_at timestamptz NOT NULL; UNIQUE case_id, role, target_type, target_id | case_id REFERENCES platform_private.safety_case(id); actor_person_id REFERENCES auth.users(id); acting_party_id REFERENCES platform_private.party(id); target is typed producer reference validated by RPC | INDEX case_id, role; INDEX target_type, target_id, target_version; UNIQUE case_id, role, target_type, target_id | RLS forced; target projection requires case role/capability; no public grant; RPC rechecks target version and visibility |
| platform_private.case_party | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; person_id uuid NULL; party_id uuid NULL; role text NOT NULL CHECK reporter or subject or counterparty or claimant or reviewer; mandate_version bigint NULL CHECK >0; disclosure_class text NOT NULL CHECK public or protected or restricted; joined_at timestamptz NOT NULL; left_at timestamptz NULL; created_at timestamptz NOT NULL; UNIQUE case_id, role, person_id, party_id | case_id REFERENCES platform_private.safety_case(id); person_id REFERENCES auth.users(id); party_id REFERENCES platform_private.party(id); exactly one of person_id or party_id required by CHECK | INDEX case_id, role, disclosure_class; INDEX person_id, party_id, case_id; UNIQUE case_id, role, person_id, party_id | RLS forced; role/purpose projection only; protected reporter identity is withheld from ordinary staff; named RPC grants |
| platform_private.report_intake | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; reporter_ref text NULL; pseudonym_id uuid NULL; reason_code text NOT NULL CHECK registered reason; reason_registry_version bigint NOT NULL CHECK >0; narrative_ciphertext bytea NULL; narrative_key_ref text NULL; channel text NOT NULL CHECK web or mobile or api or trusted_flagger; reporter_mode text NOT NULL CHECK identified or pseudonymous or anonymous; submitted_at timestamptz NOT NULL; normalized_payload_hash text NOT NULL CHECK 64 lowercase hex; idempotency_key text NOT NULL CHECK length 16..128; created_at timestamptz NOT NULL; UNIQUE channel, reporter_ref, normalized_payload_hash | case_id REFERENCES platform_private.safety_case(id); pseudonym_id references protected pseudonym registry; reporter_ref is a sealed hash, not an identity FK | INDEX case_id, submitted_at; INDEX reason_code, reason_registry_version; INDEX normalized_payload_hash; UNIQUE reporter_ref, idempotency_key | RLS forced; report RPC inserts only; reporter gets opaque receipt; narrative decrypt requires purpose-bound reviewer RPC and audit |
| platform_private.case_route | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; case_version bigint NOT NULL CHECK >0; queue_key text NOT NULL; severity text NOT NULL CHECK closed Severity; deadline_remaining_ms bigint NOT NULL CHECK >=0; policy_version bigint NOT NULL CHECK >0; reason_codes text[] NOT NULL CHECK cardinality 1..32; computed_at timestamptz NOT NULL; priority_weight numeric(9,6) NOT NULL CHECK >=0; route_state text NOT NULL CHECK queued or claimed or expired or rerouted; created_at timestamptz NOT NULL; UNIQUE case_id, case_version, queue_key | case_id REFERENCES platform_private.safety_case(id); policy_version references policy registry through 06b typed RPC; no reporter-volume field | INDEX queue_key, route_state, severity, computed_at; INDEX case_id, case_version DESC; INDEX current_due_at equivalent via case join; UNIQUE case_id and case_version and route_state where active | RLS forced; router worker writes; staff sees only eligible queue projection; no public or reporter grant |
| platform_private.case_lease | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; reviewer_staff_id uuid NOT NULL; claimed_at timestamptz NOT NULL; expires_at timestamptz NOT NULL; released_at timestamptz NULL; state text NOT NULL CHECK active or expired or released; case_version bigint NOT NULL CHECK >0; exposure_budget_ref text NOT NULL; conflict_check_hash text NOT NULL CHECK 64 lowercase hex; created_at timestamptz NOT NULL; UNIQUE case_id WHERE state = active | case_id REFERENCES platform_private.safety_case(id); reviewer_staff_id REFERENCES auth.users(id); exposure budget is protected policy registry reference | INDEX reviewer_staff_id, state, expires_at; INDEX case_id, case_version DESC; partial UNIQUE case_id WHERE state = active | RLS forced; claim RPC obtains lock and checks capability, exposure, conflict and S0 lane; direct table DML denied |
| platform_private.evidence_bundle | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; class text NOT NULL CHECK ordinary or sensitive or legal or restricted_preservation; state text NOT NULL CHECK open or sealed or degraded or closed; chain_head_hash text NOT NULL CHECK 64 lowercase hex; retention_clock_ids uuid[] NOT NULL; legal_hold_ids uuid[] NOT NULL; sealed_at timestamptz NULL; created_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0 | case_id REFERENCES platform_private.safety_case(id); retention_clock_ids reference retention_clock by typed RPC; legal_hold_ids reference legal_hold by typed RPC | INDEX case_id, class, state; INDEX sealed_at; GIN retention_clock_ids; GIN legal_hold_ids | RLS forced; case role and purpose projection; restricted preservation has no party derivative; worker/RPC named grants |
| platform_private.evidence_entry | id uuid NOT NULL PRIMARY KEY; bundle_id uuid NOT NULL; sequence bigint NOT NULL CHECK >0; entry_kind text NOT NULL CHECK snapshot or supplement or media or tombstone or capture_failed; source_event_type text NOT NULL; source_event_id uuid NOT NULL; source_event_version bigint NOT NULL CHECK >0; canonical_snapshot jsonb NULL; blob_id uuid NULL; blob_hash text NULL CHECK 64 lowercase hex; origin text NOT NULL CHECK source_event or party_submission or worker; captured_at timestamptz NOT NULL; prior_hash text NOT NULL CHECK 64 lowercase hex; entry_hash text NOT NULL CHECK 64 lowercase hex; disclosure_class text NOT NULL CHECK ordinary or sensitive or legal or restricted_preservation; created_at timestamptz NOT NULL; UNIQUE bundle_id, sequence; UNIQUE bundle_id, entry_hash | bundle_id REFERENCES platform_private.evidence_bundle(id); blob_id REFERENCES platform_private.object_records(id); source event is typed and immutable with no generic FK | INDEX bundle_id, sequence; INDEX source_event_type, source_event_id, source_event_version; INDEX blob_hash; UNIQUE bundle_id and sequence | RLS forced; append-only seal RPC; UPDATE and DELETE trigger raises; field/blob projection checks case role and purpose; no direct grants |
| platform_private.capture_intent | id uuid NOT NULL PRIMARY KEY; source_event_type text NOT NULL; source_event_id uuid NOT NULL; source_event_version bigint NOT NULL CHECK >0; case_id uuid NOT NULL; field_manifest jsonb NOT NULL; blob_manifest jsonb NOT NULL; state text NOT NULL CHECK intent_recorded or capturing or sealed or capture_failed; attempts integer NOT NULL CHECK 0..3; next_attempt_at timestamptz NULL; terminal_reason text NULL; idempotency_key text NOT NULL CHECK length 16..128; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE source_event_type, source_event_id, source_event_version | case_id REFERENCES platform_private.safety_case(id); source event has no generic FK because it belongs to a source-domain transaction; blob manifest IDs validated against object metadata | INDEX case_id, state; INDEX next_attempt_at WHERE state = capturing; INDEX source_event_type, source_event_id; UNIQUE source event tuple | RLS forced; source transaction and capture worker only; user-facing transaction cannot grant capture writes; app_worker executes lease/seal RPC |
| platform_private.legal_hold | id uuid NOT NULL PRIMARY KEY; basis_code text NOT NULL CHECK registered basis; authority_ref text NOT NULL; object_manifest_hash text NOT NULL CHECK 64 lowercase hex; object_manifest jsonb NOT NULL; placed_by uuid NOT NULL; placed_at timestamptz NOT NULL; release_condition text NOT NULL CHECK length 1..2048; released_by uuid NULL; released_at timestamptz NULL; state text NOT NULL CHECK proposed or active or released; audit_id uuid NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; UNIQUE object_manifest_hash, state WHERE state = active | placed_by REFERENCES auth.users(id); released_by REFERENCES auth.users(id); audit_id REFERENCES platform_private.audit_events(id); manifest objects validated by typed producer RPC | INDEX state, placed_at; INDEX object_manifest_hash; INDEX placed_by, state; UNIQUE active manifest hash | RLS forced; counsel-authorized hold RPC only; held object access is sealed/minimized and audited; no authenticated table grant |
| platform_private.retention_clock | id uuid NOT NULL PRIMARY KEY; owner_type text NOT NULL CHECK registered type; owner_id uuid NOT NULL; effective_delete_at timestamptz NULL; basis_code text NOT NULL; is_unbounded boolean NOT NULL; source_hold_id uuid NULL; state text NOT NULL CHECK active or superseded or completed; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; UNIQUE owner_type, owner_id, basis_code | source_hold_id REFERENCES platform_private.legal_hold(id); owner is polymorphic and validated by lifecycle RPC | INDEX owner_type, owner_id, state; INDEX effective_delete_at WHERE is_unbounded = false; INDEX source_hold_id | RLS forced; Shard 05 lifecycle RPC owns recalculation; 06a can place hold clock only through named RPC; no direct grant |
| platform_private.restriction_edge | id uuid NOT NULL PRIMARY KEY; actor_person_id uuid NOT NULL; subject_person_id uuid NOT NULL; scope text NOT NULL CHECK messaging or search or marketplace or all_interaction; state text NOT NULL CHECK active or removed; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE actor_person_id, subject_person_id, scope | actor_person_id REFERENCES auth.users(id); subject_person_id REFERENCES auth.users(id); actor cannot equal subject by CHECK | INDEX actor_person_id, state; INDEX subject_person_id, state is intentionally restricted; UNIQUE actor, subject, scope | RLS forced; only actor can read own edge; source-domain deny RPC can read effective version; subject, public search and staff generic search receive no existence signal |
| platform_private.audit_event | id uuid NOT NULL PRIMARY KEY; actor_person_id uuid NULL; acting_party_id uuid NULL; acting_context_version bigint NULL; action_code text NOT NULL; target_type text NOT NULL; target_id uuid NULL; target_version bigint NULL; before_hash text NULL CHECK 64 lowercase hex; after_hash text NULL CHECK 64 lowercase hex; reason_code text NULL; step_up_at timestamptz NULL; request_id uuid NOT NULL; correlation_id uuid NOT NULL; created_at timestamptz NOT NULL; retention_class text NOT NULL CHECK operational or protected or legal | actor_person_id REFERENCES auth.users(id); acting_party_id REFERENCES platform_private.party(id); request_id and correlation_id reference BE00 request envelope registry by UUID only | INDEX target_type, target_id, created_at DESC; INDEX actor_person_id, created_at DESC; INDEX request_id; INDEX retention_class, created_at; append-only UNIQUE id | RLS forced; audit writer only; authorized case/hold projection returns hashes and safe labels, never raw reason/narrative; no UPDATE or DELETE |

### Permission, RLS and grants

Defaults are revoked from public, anon and authenticated. The Worker role
receives EXECUTE only on report_create, case_claim, case_review,
restriction_change, safety_intake, capture_intent_or_seal and
legal_hold_action RPCs. Security-definer functions use an empty fixed search
path and fully qualified object names.

Case RLS derives current user, acting party, staff capability, assignment,
conflict, exposure budget, purpose and case role from RequestContext. Reporters
can see only an opaque receipt and safe own status. Staff cannot query generic
case tables; assigned projections omit reporter identity and sealed evidence.
Evidence RLS separates ordinary, sensitive, legal and restricted preservation;
break-glass returns only a sealed non-content validation result and requires
dual evidence. Restriction RLS is actor-only and source-domain deny RPCs
receive an effective version rather than the edge identity.

## Middleware & Policies

### Hono middleware order

Request ID, TLS/method/security headers and exact CORS run first, followed by
raw/body/content guards, session or service principal, acting context, CSRF
for cookie mutations, strict Zod path/query/header/body parsing, case
visibility and capability policy, step-up, rate limit, idempotency lookup,
handler/RPC, transaction/outbox, queue lease and ApiError normalization.
Sensitive media is never loaded before projection policy succeeds.

### Per-operation authorization matrix

| Operation ID | Principal and capability | Ownership and scope predicate | Commit-time recheck | Denial result |
|---|---|---|---|---|
| TSE-06A-01 | Reporter/claimant or lawful anonymous mode | Target addressable, reason valid for target kind and acting context current | Re-read target version, reason registry, idempotency hash and anonymous policy in intake transaction | Hidden target 404; stale context 401; no partial case |
| TSE-06A-02 | Moderator/safety specialist with lane capability | Queue capability, exposure budget, no conflict with party/target/mandate, S0 isolated lane | Lock case and active route; CAS case version and lease uniqueness | Hidden case 404; missing capability/conflict 403; competing lease 409 |
| TSE-06A-03 | Assigned reviewer with active lease | Own unexpired lease, exact policy version, exposure and mandate checks | Lock case/lease; recheck lease, target, policy and acting context | Hidden case/evidence 404; conflict/lease loss 403/409 |
| TSE-06A-04 | Authenticated consumer as edge actor | Actor and subject are distinct; scope is allowlisted; no case or target disclosure | Lock edge tuple and compare expected version | Subject is existence-safe 404; concurrent edge 409 |
| TSE-06A-05 | Safety reporter for protected lane or any intake actor for crisis resources | Harassment target/reason required; crisis has no reviewer or classifier predicate | Recheck target/reason for protected lane; crisis response does not open sanction state | Hidden target 404; advisory outage still returns resources |
| TSE-06A-06 | Source service principal or evidence worker | Source event, case and manifest originate from registered producer | Lock capture intent; recheck source tuple, case version and object hashes | Unknown source 404; missing worker scope 403; terminal capture failure explicit |
| TSE-06A-07 | Counsel-authorized custodian with fresh MFA | Exact manifest, basis and release condition within approved hold scope | Lock hold and clocks; recheck counsel gate, manifest hash and expected version | Hidden hold 404; no counsel/step-up 403/401; hold conflict 409 |

### Security and abuse controls

- Target-keyed throttles never suppress reports. Reporter budget is applied
  after admission and only changes weighted routing plus an advisory signal.
- Intake normalizes and hashes a stable payload with a reporter or anonymous
  session secret. A matching key replays; a differing body cannot enumerate
  or alter the prior case.
- Reporter identity and narrative are encrypted or pseudonymous. Refusal
  responses omit reporter, detection method, reviewer and sealed evidence.
- Case leases are exclusive and expiring. Staff assignment, exposure budget,
  conflict and mandate checks run before projection and again at review commit.
- Restriction edges are deny-first at the source, private to the actor and
  never a setting, case, notification or public relationship.
- Evidence entries canonicalize listed fields, hash existing immutable media,
  link prior hash and reject reopen/update/delete. Missing media creates a
  tombstone or capture_failed marker, never a fabricated entry.
- Active legal holds seal and minimize access. Hold release reruns retention
  clocks and cannot delete records or erase evidence.
- Free text is bounded and scrubbed from logs/events. No message content,
  protected traits, legal documents, credentials, tokens or raw evidence
  enters events, metrics, queues or ordinary API responses.

## Data Flow

### Transaction and external seams

| Operation ID | Canonical transaction | External seam request and response | Timeout, retries and circuit breaker |
|---|---|---|---|
| TSE-06A-01 | Validate target/reason; lock idempotency; insert case, target snapshot, parties, report, route request, capture intent and audit; commit | Target projection request: type, ID and expected version. Response: addressable flag, safe target version and report policy. | 2,000 ms, one read retry at 250 ms; circuit after 5 failures for 60 s; route deadline 15,000 ms. Unknown target is 404, never retried as mutation. |
| TSE-06A-02 | Lock case/route; calculate weighted lane; insert lease with active uniqueness and CAS; append route/lease event | Policy router request: case kind, severity, deadline, jurisdiction and queue capacities. Response: queue key, weight, policy version and due time. | 2,000 ms, 3 retries at 15/60/300 s for deterministic policy read; circuit 5/60 s; no clock reset on failure. |
| TSE-06A-03 | Lock lease/case; load minimum projection; save reviewer draft or proposal reference; no finding mutation | Target projection request: target ID/version and safe fields. Response: minimal target projection and current version. | 2,000 ms, one retry at 250 ms; circuit 5/60 s; route deadline 15,000 ms; unavailable target stays unknown and review is not written. |
| TSE-06A-04 | Lock actor/subject/scope edge; create/remove edge and audit; emit deny-first invalidation | Source-domain restriction adapter request: subject ID, scope and edge version. Response: accepted effective edge version. | 2,000 ms, 3 retries at 15/60/300 s for idempotent invalidation; circuit 5/60 s; source applies deny-first before downstream convergence. |
| TSE-06A-05 | Validate protected lane or resources-only crisis; protected mode creates intake transaction; crisis stores minimal completion | Resource adapter request: locale and crisis resource registry version. Response: verified resource labels and URIs. | 1,000 ms, 2 retries at 250/500 ms; circuit 5/60 s; outage returns cached verified resources or safe resource text, never blocks crisis help. |
| TSE-06A-06 | Source transaction writes capture intent atomically; worker leases, snapshots, hashes and appends entry or failure marker; outbox after seal | Object metadata request: object IDs and expected hashes. Response: current immutable metadata and hash. | 2,000 ms per object batch, 3 retries at 15/60/300 s; circuit 5/60 s; three worker attempts then CAPTURE_FAILED marker and alert. |
| TSE-06A-07 | Lock hold and clocks; insert active/released hold, audit and retention recalculation; commit before downstream deletion planning | Shard 05 retention adapter request: hold ID, manifest hash, action and clock IDs. Response: accepted clock version and reconciliation task ID. | 2,000 ms, 3 retries at 15/60/300 s; circuit 5/60 s; unknown remains active/pending and never permits deletion. |

All asynchronous delivery is BE00 at-least-once with stable idempotency,
three attempts and DLQ evidence. Worker crash after source commit finds the
atomic capture intent. Provider ambiguity remains pending or unknown.

### State machine and concurrency

| Aggregate | Allowed transitions and guards | Concurrent or failure behavior |
|---|---|---|
| Case | draft to received to triaged to queued to claimed to reviewing to awaiting_party to reviewing to proposed; later decision states belong to 06b | Any pre-decision state may close duplicate/invalid only with reason and merge semantics. Capture_failed attaches evidence status and cannot close the case. |
| Route and lease | queued to claimed to expired or released; one active lease per case | CASE version CAS and active unique index prevent two claimants. Lease expiry preserves original deadline and reroutes to same policy lane. |
| Restriction edge | absent to active to removed | Stable actor/subject/scope lock prevents divergent edges; source deny-first applies immediately and downstream lag is visible. |
| Capture intent | intent_recorded to capturing to sealed or capture_failed | Stable source tuple and idempotency prevent duplicate entries. Crash after source commit retries exact intent; exhausted attempts append failure marker. |
| Evidence bundle | open to sealed or degraded to closed | Sequence and prior hash are immutable. Sealed evidence never reopens; missing media creates tombstone/degradation. |
| Legal hold | proposed to active to released | Active hold adds unbounded clock. Release does not erase; it reruns every remaining retention clock and eligibility check. |

## Event Schemas

Every event uses the BE00 identifier-only envelope with eventId uuid,
eventType literal, occurredAt timestamptz, requestId uuid, correlationId uuid,
actorRef uuid nullable, aggregateId uuid, aggregateVersion bigint and strict
payload. Events carry no narrative, identity, evidence, legal document,
protected trait or raw object locator.

~~~ts
export const SafetyCaseReceivedV1 = z.strictObject({
  caseId: z.uuid(),
  caseKind: CaseKind,
  targetId: z.uuid(),
  reasonVersion: Version,
  severity: Severity,
  deadline: z.string().datetime({ offset: true }),
  intakeHash: z.string().regex(/^[a-f0-9]{64}$/)
});
export const SafetyCaseRoutedV1 = z.strictObject({
  caseId: z.uuid(),
  queueKey: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  routeVersion: Version,
  priorityInputsHash: z.string().regex(/^[a-f0-9]{64}$/)
});
export const SafetyRestrictionChangedV1 = z.strictObject({
  edgeId: z.uuid(),
  scope: z.enum(["messaging", "search", "marketplace", "all_interaction"]),
  state: z.enum(["active", "removed"]),
  version: Version
});
export const SafetyEvidenceSealedV1 = z.strictObject({
  bundleId: z.uuid(),
  entryId: z.uuid(),
  evidenceClass: EvidenceClass,
  sourceEventId: z.uuid(),
  entryHash: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(["sealed", "capture_failed", "degraded"])
});
~~~

| Event type | Producer operation | Payload and consumer rule |
|---|---|---|
| safety.case.received.v1 | TSE-06A-01 or TSE-06A-05 protected lane | Case/kind/target/reason version/severity/deadline/intake hash; router and capture worker refetch authorized case projection. |
| safety.case.routed.v1 | TSE-06A-02 | Case/queue/priority inputs/route version; task projection refetches assignment and never infers claim from event alone. |
| safety.restriction.changed.v1 | TSE-06A-04 | Edge/scope/state/version; source domains refetch deny-first edge and never disclose edge existence. |
| safety.evidence.sealed.v1 | TSE-06A-06 or TSE-06A-07 evidence change | Bundle/entry/class/source/hash/status; retention and case projection refetch authorized evidence state. |

## Error Handling

### Boundary mapping

| Boundary | Typed internal failure | HTTP and ApiError code | State guarantee |
|---|---|---|---|
| Input and reason registry | Unknown key, malformed target, invalid reason, oversized narrative | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | No case, edge, evidence or hold mutation. |
| Authentication/context | Missing, expired or stale session/acting party | 401 UNAUTHENTICATED or ACTING_CONTEXT_STALE | No protected target or case existence disclosure. |
| Capability/lease/hold | Missing lane, conflict, exposure budget, counsel or step-up | 403 FORBIDDEN or 401 STEP_UP_REQUIRED or 422 COUNSEL_GATE_DISABLED | No lease, draft, edge, evidence access or hold change. |
| Visibility | Hidden target, case, edge, evidence or hold | 404 NOT_FOUND | No reporter, subject, evidence or legal manifest leakage. |
| CAS/idempotency | Changed case/edge/hold/source or differing replay payload | 409 VERSION_CONFLICT or IDEMPOTENCY_MISMATCH or CASE_LEASE_LOST | Transaction rolls back; prior case/edge/hold remains. |
| Capture/provider | Object missing, worker timeout or resource outage | 503 PROVIDER_UNAVAILABLE or CAPTURE_FAILED; 504 UPSTREAM_TIMEOUT | Pending/unknown or explicit capture_failed; no fabricated evidence or crisis refusal. |
| Unexpected | Unclassified exception | 500 INTERNAL_ERROR | Rollback and scrubbed request/correlation telemetry. |

### Operation error coverage

| Operation ID | Required edge cases and recovery |
|---|---|
| TSE-06A-01 | Unknown target, invalid reason, stale context, anonymous legality, duplicate/replay mismatch, brigading and excess reporter volume; reject safely, replay prior case or reweight after admission. |
| TSE-06A-02 | S0 general-queue fallback attempt, conflict, exhausted exposure budget, competing lease, expiry and stale route; deny or reclaim without clock reset or safety-floor reduction. |
| TSE-06A-03 | Lease loss, stale target/policy, reviewer conflict, mandate ambiguity, sensitive media and reporter identity exposure; preserve external draft, omit sealed material and route recusal. |
| TSE-06A-04 | Self restriction, invalid scope, concurrent edge change and downstream outage; reject or apply source deny-first, then retry without revealing edge. |
| TSE-06A-05 | Harassment target failure, protected reporter, crisis classifier outage and resource provider outage; protected lane refuses safely, crisis still returns verified resources. |
| TSE-06A-06 | Worker crash, object hash mismatch, purged media, duplicate intent and retry exhaustion; append tombstone or capture_failed marker and alert without closing case. |
| TSE-06A-07 | Missing counsel gate, stale MFA/version, changed manifest, hold release and erasure conflict; keep hold active, seal access and re-evaluate clocks. |

## Observability

| Operation ID | Required structured event and metrics | Trace and redaction |
|---|---|---|
| TSE-06A-01 | safety.case.received with case ID, kind, severity, route state, outcome and intake hash; admission, reweight and idempotency metrics | Trace target policy and intake RPC; no target title, narrative, reporter identity or exact reason text |
| TSE-06A-02 | safety.case.routed with case ID, queue, severity, lease state and deadline bucket; claim conflict, lease expiry and S0-floor metrics | Trace policy router and CAS; no reviewer conflict details or exposure identity |
| TSE-06A-03 | safety.case.review_projection with case ID, policy version, projection state and outcome; lease loss, recusal and stale-policy metrics | Trace projection and policy lookup; redact allegation, narrative, reporter/reviewer identity and sensitive media |
| TSE-06A-04 | safety.restriction.changed with edge hash, scope, state and outcome; source deny latency and convergence lag | Trace actor hash and subject hash only; never emit edge existence, subject identity or reason text |
| TSE-06A-05 | safety.intake.completed with mode, case state, resource locale and outcome; crisis resource delivery and protected-lane admission metrics | Trace registry/resource adapter; narrative and reporter identity scrubbed |
| TSE-06A-06 | safety.evidence.sealed with bundle/entry IDs, status, attempt count and hash; capture latency, failure and tombstone metrics | Trace source event and object IDs; no snapshots, blobs, narrative or evidence locator |
| TSE-06A-07 | safety.hold.changed with hold ID, state, manifest hash and clock count; gate denial, active-hold and reconciliation metrics | Trace counsel capability and Shard 05 adapter; basis, object list, legal document and subject identity excluded |

Structured logs follow BE00 severity, environment, release, service,
operation, outcome, latency, requestId and correlationId. provider-native diagnostic sinks receive
scrubbed exception metadata. Metrics distinguish empty, partial, unknown,
degraded and failed; no absent card or missing evidence means no work or
healthy evidence.

## Testing Strategy

### Contract and route tests

| Operation ID | Contract and route acceptance tests |
|---|---|
| TSE-06A-01 | Valid and invalid target/reason registry, anonymous legality, narrative bounds, duplicate/replay mismatch, 404 existence safety, 201 projection, CORS and ApiError envelope. |
| TSE-06A-02 | S0 isolation, weighted-fair route, queue capability, exposure/conflict denial, lease CAS, expiry and 409 version behavior. |
| TSE-06A-03 | Minimum safe projection, policy version, lease expiry, conflict/mandate, sensitive-media omission, draft persistence and no allegation mutation. |
| TSE-06A-04 | Actor/subject distinction, allowlisted scope, create/remove CAS, immediate deny-first effect, private response and no case creation. |
| TSE-06A-05 | Protected harassment lane, sealed reporter, crisis resources-only branch, classifier bypass and provider fail-open behavior. |
| TSE-06A-06 | Atomic intent, source tuple idempotency, field/blob hash, append-only chain, capture_failed and queued 202 response. |
| TSE-06A-07 | Counsel gate, MFA, manifest hash, place/release transitions, hold precedence and no-delete release behavior. |

### Authorization, persistence and concurrency tests

- Test anonymous, wrong valid user, wrong party, forged target ID, stale
  context, expired lease, conflict, revoked capability, missing MFA and
  hidden evidence. Match exact 401/403/404/409/422 results.
- Assert direct table access is denied to anon/authenticated and positive/
  negative RLS covers reporter, case party, moderator, specialist, worker,
  counsel custodian and break-glass custodian.
- Run two identical report requests, two claims, two edge changes, two
  capture workers and two hold actions. Assert one case/lease/edge/entry/hold,
  stable replay and no duplicate event.
- Change target/policy/manifest between projection and commit. Assert stale
  refusal, no draft/sanction/evidence mutation and preserved original clock.
- Revoke or expire lease/capability during review; purge referenced object
  during capture; place hold during erasure planning. Assert explicit
  degraded/pending/blocked evidence and no false closure.

### Security, performance and recovery tests

- Fuzz target IDs, reason keys, narratives, manifests, JSON, event types and
  source paths. Confirm no SQL, path, template, HTML, credential or token
  reaches SQL, object adapter, queue, logs or events.
- Prove report volume, badges, persona, membership, protected traits and
  identity do not independently establish guilt, priority or exposure.
- Measure read projections within BE00 Tier 1 and commands within 15 seconds;
  assert per-user, per-party and per-staff limits and S0 reserved capacity.
- Simulate provider timeout, lease worker crash, queue redelivery, object
  mismatch, chain tampering, hold adapter outage and replay. Assert retry
  count 3 at 15/60/300 seconds, circuit 5/60 seconds, DLQ and truthful state.
- Verify restricted evidence has no derivative, break-glass emits no content,
  active hold survives deletion jobs, and crisis resources remain available
  during advisory outages.

### Accessibility handoff tests

Report, intake, review and hold responses expose safe validation errors,
deadlines, state, focus restoration and consequences as text and semantic
status. Sensitive media begins blurred or muted with text-only alternative.
Queues announce severity, expiry and freshness. Protected reporter and
evidence omission is not represented by an ambiguous empty state. Crisis
resources are keyboard accessible and never hidden behind a classifier.

## Deepening Passes

| Pass | Resulting hardening |
|---|---|
| Micro contract pass | Added strict CaseKind/State enums, reason/version binding, hash/idempotency fields, bounded manifests, source tuple and hold action refinements. |
| Boundary pass | Separated intake from decision, restriction from case, capture intent from source transaction and hold placement from Shard 05 lifecycle execution. |
| Adversarial pass | Rejected report suppression, case enumeration, staff browsing, reporter leakage, evidence editing, S0 fallback and hold bypass. |
| Failure/recovery pass | Added lease CAS, capture_failed/tombstone, deny-first source propagation, provider fail-open crisis resources and pending hold reconciliation. |
| Data pass | Typed all 13 persistence tables with nullability, constraints, FK or polymorphic rationale, indexes, forced RLS and named grants. |
| Macro consistency pass | Reconciled seven interactions, five feature-ledger rows, 13 model names and four event types with 06b/06c ownership. |

## Ambiguity Gate

PASS. Evidence:

- Micro: every TSE-06A operation has strict request/success contracts,
  ApiError/status mapping, explicit 403/404 rule, numeric rate limit,
  idempotency and operation-keyed tests.
- Macro: all seven assigned interactions, five feature rows, 13 canonical
  model names and four assigned event types map once; decisions, disputes,
  legal disclosure and specialist enforcement are explicitly excluded.
- External seams: target, policy, source, resource, object and retention
  adapters specify request, response, timeout, retry/backoff and circuit
  behavior. Unknown results remain pending, degraded or failed.
- Persistence: every field has SQL type, nullability and constraint, FK or
  typed polymorphic rationale, query index, forced RLS and grant boundary.
- Transport: every route names exact CORS and BE00
  ApiError { code, message, requestId, details }.
- Tables: Markdown tables were width-checked after authoring; no row uses a
  pipe as an unescaped cell separator.
- No unresolved decision gap, hidden authorization rule or undecided choice
  remains in this split.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 06a case-intake/evidence backend contracts from canonical Shard 06 IA and deep dive | /write-be-spec | All |
| 2026-08-28 | Added strict report, lease, projection, restriction, capture and hold contracts with typed RLS persistence and recovery proof | /write-be-spec-write | API, database, middleware, events, tests |

## Dependency References

- BE00 Cross-cutting platform foundation: ApiError, RequestContext,
  idempotency, object metadata, jobs, outbox, logging and recovery.
- Shard 01 Identity authority and party governance: actor, party, mandate,
  ownership and acting-context snapshots.
- Shard 05 Platform configuration, admin and quality: capabilities, MFA,
  retention clocks, legal-hold orchestration, diagnostics and counsel gates.
- Shard 03 CMS content modeling and authoring: reportable object projections
  and event-time content capture sources.
- Shard 04 CMS navigation, media and delivery: governed object metadata,
  rendition hashes and availability projections.
- Shard 06b Policy, enforcement and appeals: policy versions, findings,
  sanctions, controls and appeals consume case review outputs.
- Shard 06c Disputes, DMCA and legal risk: legal notices, disputes and
  specialist cases consume intake/evidence references without raw payload.
