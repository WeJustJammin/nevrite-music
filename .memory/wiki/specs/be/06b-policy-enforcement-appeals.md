# BE 06b — Policy, enforcement and appeals

## Split Group

This companion owns policy-bound review decisions, enforcement, appeals,
advisory risk and specialised safety enforcement:

- TSE-05 Apply sanction/takedown
- TSE-06 Concur or reaffirm
- TSE-07 Appeal decision
- TSE-09 Evaluate advisory signal
- TSE-20 Evaluate message-safety signal
- TSE-21 Defend card testing and triangulation
- TSE-22 Adjudicate review integrity
- TSE-26 Apply TVEC removal

It covers 24.01.02 Automated Content Classification & Proactive Detection,
24.01.05 Messaging Safety & Scam Filtering, 24.02.01 Enforcement Ladder &
Sanctions, 24.02.02 Appeals & Internal Complaint Handling, 24.02.03
Statements of Reasons, 24.02.04 Policy Library & Versioned Terms Acceptance,
24.02.05 Prohibited & Restricted Items Policy Engine, 24.02.06 Transparency
Reporting, 24.03.01 through 24.03.06 risk and fraud features, 24.05.02 Audio
Fingerprinting & Content Matching and 24.08.02 Terrorist & Violent Extremist
Content Removal.

06a owns intake, case leases, restrictions, capture and legal holds. 06c owns
disputes, DMCA, legal process, specialist claims and governance risk. Shard 01
owns party/mandate/ownership truth; Shard 05 owns capabilities and counsel
gates. Advisory signals never become findings, user scores or enforcement
commands. Ownership, confirmed credits, splits, balances and export rights
are unreachable from this companion.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| TSE-05 Apply sanction/takedown | TSE-06B-01 | Protected decision activation and narrow-scope enforcement command | A cited policy, evidence inventory, control, SoR and audit commit atomically; first active subject-target-policy tuple wins. |
| TSE-06 Concur or reaffirm | TSE-06B-02 | Human control/reaffirmation command | Distinct human concurrence or documented solo compensating controls are recorded; model output and original decider never satisfy control. |
| TSE-07 Appeal decision | TSE-06B-03 | Independent appeal and per-item compensation command | Eligible subject appends sealed supplement; independent reviewer records per-item result and compensating commands. |
| TSE-09 Evaluate advisory signal | TSE-06B-04 | Service-principal advisory rule/model evaluation | Action/object signal may reorder review only; provider outage fails open and never fabricates removal or priority. |
| TSE-20 Evaluate message-safety signal | TSE-06B-05 | Off-send-path metadata safety evaluation | Participant report gates content inspection; warning is dismissible and provider failure delivers the message unwarned. |
| TSE-21 Defend card testing and triangulation | TSE-06B-06 | Payment-rail velocity control plus human triangulation review | Rail velocity throttles/blocks before risk score; triangulation creates payout hold and review, never auto-block. |
| TSE-22 Adjudicate review integrity | TSE-06B-07 | Role-scoped review-removal adjudication | Linkage-graph evidence, cited rule, SoR and appeal are required; review data is never detection input. |
| TSE-26 Apply TVEC removal | TSE-06B-08 | Separate hash-match or human policy-judgment enforcement command | Mechanism-specific evidence and authority are preserved; ordinary ladder, SoR and appeal remain required. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/06-trust-safety.md | title, links, overview and scope lines 1-24 | Confirms canonical Shard 06 source and policy/enforcement boundary. |
| .memory/wiki/specs/ia/06-trust-safety.md | features and delivery phases lines 26-44 | Binds all assigned 24.01, 24.02, 24.03, 24.05.02 and 24.08.02 feature rows and counsel-gated phases. |
| .memory/wiki/specs/ia/06-trust-safety.md | acceptance criteria lines 52-57 and 87-92 | Supplies TSE-05, TSE-06, TSE-07 and TSE-09 behavior, controls, reversibility and advisory failure. |
| .memory/wiki/specs/ia/06-trust-safety.md | acceptance criteria lines 98-104 | Supplies TSE-20 through TSE-26 specialised enforcement, fail-open, rail, review, authenticity, leak, meetup and TVEC constraints. |
| .memory/wiki/specs/ia/06-trust-safety.md | interactions and global rules lines 75-114 | Supplies exact interaction identifiers, no-auth-by-flag, deny-first, advisory and no-user-score rules. |
| .memory/wiki/specs/ia/06-trust-safety.md | core, policy, decision and specialised contracts lines 115-130 and 142-177 | Supplies CaseState, Decision, SanctionRung, DecisionRungMap, ScopeType, StandardError, PolicyVersion, EvaluatePolicy, ProposeDecision, ActivateDecision, SoR, Appeal, risk and specialised safety invariants. |
| .memory/wiki/specs/ia/06-trust-safety.md | data models and typed registry lines 181-257 | Supplies the 15 assigned model names, typed registry and cardinality rules. |
| .memory/wiki/specs/ia/06-trust-safety.md | access and escalation lines 258-292 | Supplies moderator, independent reviewer, fraud specialist, system worker and admin restrictions. |
| .memory/wiki/specs/ia/06-trust-safety.md | accessibility and event schemas lines 294-328 | Supplies consequence warnings, sensitive-media controls and eight assigned event types. |
| .memory/wiki/specs/ia/06-trust-safety.md | edge cases and coverage matrix lines 330-397 | Supplies self-concurrence, scope, SoR, version, classifier, message, rail, review and TVEC recovery. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | scope and deepening record lines 1-18 | Confirms policy-bound decision boundary and adversarial controls. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | policy, decision and enforcement contracts lines 33-43 | Expands policy rule, decision, control, sanction, SoR and appeal fields. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | state machines and decision control lines 59-77 and 97-109 | Locks activation, concurrence, narrowest scope, compensation and appeal transitions. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | advisory risk and provider failure lines 111-119 | Locks advisory-only signals, fail-open classifiers, protected response and counsel-gated automation. |
| .memory/wiki/specs/ia/deep-dives/06-trust-safety.md | abuse/recovery lines 158-173 | Locks anti-enumeration, model boundaries, ownership preservation and partial reversal. |
| .memory/wiki/specs/feature-ledger.md | rows 471-480, 482 and 489, 684-689 | Reconciles all 16 assigned feature IDs to policy/enforcement operations. |
| .memory/wiki/specs/be/00-infrastructure.md | inventory, ApiError and contracts lines 22-41 and 112-138 | Inherits RequestContext, strict Zod 4 and exact ApiError { code, message, requestId, details }. |
| .memory/wiki/specs/be/00-infrastructure.md | database, middleware, jobs and provider lines 202-365 | Inherits private schema, RLS, middleware, idempotency, queue retry and provider circuit rules. |
| .memory/wiki/specs/be/00-infrastructure.md | errors, observability, tests and ambiguity lines 416-534 | Inherits typed status mapping, scrubbed telemetry, recovery proof and quality gates. |
| .memory/wiki/specs/2026-08-02-architecture-design.md | stack, authorization and integrations lines 157-167, 348-370 and 495-502 | Confirms Hono/Zod, PostgreSQL authority, server-derived policy and replaceable providers. |
| .memory/wiki/specs/2026-08-02-architecture-design.md | security and API controls lines 707-765 and 900-907 | Confirms no BOLA/BOPLA, secrets separation, allowlisted filters, explicit CORS and safe errors. |
| .memory/wiki/specs/data-placement-strategy.md | placement and isolation lines 13-16, 23-32, 42-52 and 120-130 | Confirms protected relational/audit placement and RLS enforcement. |
| .memory/wiki/specs/ENGINEERING-STANDARDS.md | contract, bounds, security and migration lines 35-50, 92-101 and 149-188 | Sets strict validation, 256 KiB body, 50-row list, endpoint and RLS test floors. |

## IA Source Map

| Exact source item | 06b ownership | Backend realization |
|---|---|---|
| TSE-05 Apply sanction/takedown | Owned | TSE-06B-01, case_decision, sanction, enforcement_item, SoR and activation outbox. |
| TSE-06 Concur or reaffirm | Owned | TSE-06B-02, decision_control with distinct-person or solo compensating evidence. |
| TSE-07 Appeal decision | Owned | TSE-06B-03, appeal and per-item reversal/compensation. |
| TSE-09 Evaluate advisory signal | Owned | TSE-06B-04, risk_signal and review_disposition with no enforcement authority. |
| TSE-20 Evaluate message-safety signal | Owned | TSE-06B-05, message_safety_evaluation and fail-open warning event. |
| TSE-21 Defend card testing and triangulation | Owned | TSE-06B-06, rail_velocity_decision and triangulation_indicator. |
| TSE-22 Adjudicate review integrity | Owned | TSE-06B-07, review_integrity_finding with role scope. |
| TSE-26 Apply TVEC removal | Owned | TSE-06B-08, tvec_evaluation with mechanism-specific evidence. |
| policy_rule_version | Owned | Immutable rulebook version and effective interval. |
| policy_acceptance | Owned | Append-only version/locale acceptance evidence. |
| case_decision | Owned | Finding, rule, evidence, rationale, scope and state. |
| decision_control | Owned | Concurrence/reaffirmation and compensating-control proof. |
| sanction | Owned | Narrow-scope rung/action/state and reversal reference. |
| enforcement_item | Owned | Per-target command and compensation status. |
| statement_of_reasons | Owned | Immutable plain and structured reason delivery chain. |
| appeal | Owned | Independent reviewer and per-item result. |
| risk_signal | Owned | Action/object advisory score, reason, confidence and expiry. |
| review_disposition | Owned | Explicit signal disposition without user score. |
| message_safety_evaluation | Owned | Thread metadata/pattern evaluation and fail-open marker. |
| rail_velocity_decision | Owned | Device/session/card-BIN-spread rail outcome. |
| triangulation_indicator | Owned | Listing indicators and payout hold reference. |
| review_integrity_finding | Owned | Role-scoped linkage-graph finding and removal reference. |
| tvec_evaluation | Owned | Hash-match or policy-judgment mechanism evidence. |
| safety.decision.activated.v1 | Owned event | Identifier-only event after atomic enforcement commit. |
| safety.decision.reversed.v1 | Owned event | Identifier-only event after compensating reversal. |
| safety.signal.recorded.v1 | Owned event | Identifier-only advisory signal event. |
| safety.message-warning.raised.v1 | Owned event | Identifier-only recipient warning hint. |
| safety.rail.blocked.v1 | Owned event | Identifier-only rail decision event. |
| safety.triangulation.held.v1 | Owned event | Identifier-only payout hold/review event. |
| safety.review.removed.v1 | Owned event | Identifier-only role-scoped review outcome. |
| safety.tvec.decided.v1 | Owned event | Identifier-only mechanism-specific TVEC decision. |
| TSE-01, TSE-03, TSE-04, TSE-08, TSE-14, TSE-16, TSE-17 | Excluded | 06a owns intake, lease, restriction, capture and hold. |
| TSE-02, TSE-10 through TSE-13, TSE-15, TSE-18 through TSE-19, TSE-23 through TSE-25 | Excluded | 06c owns DMCA, disputes, legal, governance and specialist claims. |

## Feature Ledger Coverage

| Feature ledger ID | Feature | Operation coverage | Acceptance evidence |
|---|---|---|---|
| 24.01.02 | Automated Content Classification & Proactive Detection | TSE-06B-04 | Shadow-mode advisory classifier, action/object subject and fail-open outage tests. |
| 24.01.05 | Messaging Safety & Scam Filtering | TSE-06B-05 | Participant-report gate, metadata-first signal, dismissible warning and send-path independence. |
| 24.02.01 | Enforcement Ladder & Sanctions | TSE-06B-01 and TSE-06B-02 | DecisionRungMap, narrowest scope, control, SoR, audit and ownership preservation. |
| 24.02.02 | Appeals & Internal Complaint Handling | TSE-06B-03 | Independent reviewer, sealed supplement, per-item compensation and truthful partial state. |
| 24.02.03 | Statements of Reasons | TSE-06B-01 and TSE-06B-03 | Plain/structured SoR atomic with sanction and immutable correction chain. |
| 24.02.04 | Policy Library & Versioned Terms Acceptance | TSE-06B-01 through TSE-06B-03 | Immutable policy versions, locale/interval pinning and acceptance evidence. |
| 24.02.05 | Prohibited & Restricted Items Policy Engine | TSE-06B-01 and TSE-06B-08 | Policy-bound evaluation, counsel-gated automation and ordinary ladder controls. |
| 24.02.06 | Transparency Reporting | TSE-06B-01 and TSE-06B-03 | Safe aggregate outcome projections without allegation, reporter or low-count leakage. |
| 24.03.01 | Risk Scoring & Rules Engine | TSE-06B-04 | Reason/version/confidence/expiry signal with no durable user score. |
| 24.03.02 | Account Takeover, Ban Evasion & Fraud Ring Detection | TSE-06B-04 | Action/object linkage signal and protective response separated from sanction. |
| 24.03.03 | Seller Fraud, Buyer Fraud & Return Abuse Controls | TSE-06B-04 and TSE-06B-06 | Advisory fraud evidence and rail/triangulation separation. |
| 24.03.04 | Triangulation & Card-Testing Defense | TSE-06B-06 | Device/session/BIN rail block and human payout hold, no price-only or reputation veto. |
| 24.03.05 | Sanctions, AML & High-Value Transaction Screening | TSE-06B-06 | Provider-boundary fail-closed rail result with no ownership or guilt mutation. |
| 24.03.06 | Review & Rating Integrity | TSE-06B-07 | Linkage graph, cited rule, SoR, appeal and per-role scope. |
| 24.05.02 | Audio Fingerprinting & Content Matching | TSE-06B-04 | Advisory matcher version, hash/evidence reference and fail-open ordinary path. |
| 24.08.02 | Terrorist & Violent Extremist Content Removal | TSE-06B-08 | Separate hash/policy mechanisms, no user extremism score, ordinary ladder and SoR. |

## Endpoint Completeness Reconciliation

Each assigned interaction has one route registry row, strict request/success
schemas, an operation error row, authorization row, external seam row,
observability row and test row. TSE-06B-01 is the only enforcement activation
route. TSE-06B-02 controls are separate because a control cannot be supplied
by the original decider or model output. TSE-06B-04 is advisory and cannot
reach an enforcement command. TSE-06B-06 keeps payment-rail protection
separate from human triangulation review. TSE-06B-08 requires mechanism
specific evidence.

No authentication, intake, evidence, legal hold, dispute, DMCA or generic
settings route is duplicated. The API does not provide a user-level risk
score, unrestricted policy query, or direct database mutation.

## Shared Contract Inheritance

BE00 supplies request ID, transport and CORS, body/content limits, session and
acting-party resolution, CSRF, strict Zod 4, capability/RLS, idempotency,
outbox, queue retry, Sentry/logging and exact ApiError
{ code, message, requestId, details }. details is bounded to 16 keys, four
levels and 8 KiB.

Every command carries actor, acting context version, expected case/decision/
target version, idempotency key and step-up where required. Caller fields
cannot choose a policy version, sanction rung, target scope, reviewer,
control kind, payment outcome or enforcement authority.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and capability | Request contract | Success contract | Error contract | Idempotency and rate | CORS and middleware |
|---|---|---|---|---|---|---|---|---|
| TSE-06B-01 | TSE-05 Apply sanction/takedown | POST /api/v1/safety/cases/{caseId}/enforcement | Moderator or enforcement operator with case scope; distinct control and fresh MFA when required | Tse06b01ActivateDecisionRequest | Tse06b01ActivateDecisionResponse 200 or 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 20/min operator and 40/min team; 15s | CORS first-party staff console allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, step-up, rate, RPC and ApiError normalization |
| TSE-06B-02 | TSE-06 Concur or reaffirm | POST /api/v1/safety/decisions/{decisionId}/controls | Independent human moderator; original decider and model cannot satisfy control | Tse06b02ControlRequest | Tse06b02ControlResponse 200 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 30/min reviewer and 60/min team; 15s | CORS first-party staff console allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, MFA, rate and ApiError normalization |
| TSE-06B-03 | TSE-07 Appeal decision | POST /api/v1/safety/decisions/{decisionId}/appeals | Eligible enforcement subject/authorized party; independent reviewer capability | Tse06b03AppealRequest | Tse06b03AppealResponse 200 or 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 10/hour appellant and 30/hour reviewer; 15s | CORS first-party consumer/staff allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, rate and ApiError normalization |
| TSE-06B-04 | TSE-09 Evaluate advisory signal | POST /api/v1/safety/risk-signals/evaluate | Registered service principal and named rule/model/provider; no human enforcement capability | Tse06b04RiskSignalRequest | Tse06b04RiskSignalResponse 202 | ApiError { code, message, requestId, details }; 400 or 401 or 409 or 422 or 503 | Idempotency-Key required; 600/min service principal; 15s queued | CORS non-browser service allowlist; BE00 request-id, principal, strict Zod, rate, queue and ApiError normalization |
| TSE-06B-05 | TSE-20 Evaluate message-safety signal | POST /api/v1/safety/messages/{threadId}/safety-evaluation | Authenticated messaging-safety worker service principal; participant report required for content inspection | Tse06b05MessageSafetyRequest | Tse06b05MessageSafetyResponse 202 | ApiError { code, message, requestId, details }; 400 or 403 or 404 or 409 or 503 | Idempotency-Key required; 300/min thread worker; 2s off-send-path deadline | CORS non-browser service allowlist; BE00 request-id, strict Zod, participant gate, rate and ApiError normalization |
| TSE-06B-06 | TSE-21 Defend card testing and triangulation | POST /api/v1/safety/commerce/risk-actions | Payment-rail service for velocity; fraud specialist for triangulation review | Tse06b06CommerceRiskRequest | Tse06b06CommerceRiskResponse 200 or 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 or 503 | Idempotency-Key required; rail 120/min/device and 600/min/BIN window; 2s rail, 15s review | CORS non-browser payment/fraud allowlist; BE00 request-id, principal, strict Zod, capability for review, rate and ApiError normalization |
| TSE-06B-07 | TSE-22 Adjudicate review integrity | POST /api/v1/safety/reviews/{reviewId}/integrity | Independent review-integrity adjudicator with role scope | Tse06b07ReviewIntegrityRequest | Tse06b07ReviewIntegrityResponse 200 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 | Idempotency-Key required; 20/min adjudicator and 40/min team; 15s | CORS first-party staff console allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, rate and ApiError normalization |
| TSE-06B-08 | TSE-26 Apply TVEC removal | POST /api/v1/safety/tvec/actions | Designated-set service for hash path or human policy decider for policy path; ordinary control required | Tse06b08TvecRequest | Tse06b08TvecResponse 200 or 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 or 503 | Idempotency-Key required; 10/min object and 20/min operator; 15s | CORS first-party staff/service allowlist with credentials; BE00 session/context, CSRF, strict Zod, capability, step-up, rate and ApiError normalization |

### Registry invariants

- Policy rule versions are immutable, locale-specific and half-open UTC
  intervals. Every decision pins exact rule, evidence, case and target
  versions; superseded policy remains retrievable.
- Sanction rung derives from DecisionRungMap and is stored. Rung 5
  payout_hold is disabled and returns SANCTION_CLASS_GATED; fraud withholding
  belongs to the Payments risk reserve and is not a sanction on owed balance.
- Scope is ordered object, feature, domain, account, entity. The narrowest
  sufficient scope is required; entity action needs a resolved responsible
  actor and mandate from the Shard 01 snapshot.
- S1, rung 6 or greater and indefinite duration require distinct human
  concurrence. Solo control records cited rule, rationale, audit, guaranteed
  review route and cooling-off unless urgent S0/S1 compensating controls apply.
- SoR and audit commit with the sanction. A failure rolls back the entire
  activation. Correction supersedes the prior SoR; it never edits history.
- Appeal reviewer is distinct from original decider. Reversal is per item and
  emits compensating commands; ownership, credits, splits and export rights
  remain unchanged.
- Risk signals score only an action or object, never a person. Classifier,
  matcher, ban-evasion and message signals fail open. Prohibited checkout
  and approved payout screening fail closed only at their domain boundary.
- Message evaluation never delays send; content inspection requires a
  participant report. TVEC hash matching and policy judgment cannot consume
  each other's evidence or authority.
- 403 means a visible case, decision or target exists but action is outside
  the actor grant. 404 hides target/case/review visibility; no denial leaks
  reporter, reviewer, protected evidence or legal identity.

### Operation contract and error matrix

| Operation ID | Request and success | Error codes and status | 403 versus 404 |
|---|---|---|---|
| TSE-06B-01 | ActivateDecisionRequest to ActivateDecisionResponse with sanction, SoR, control and outbox state | UNAUTHENTICATED 401; FORBIDDEN 403; CASE_NOT_FOUND 404; VERSION_CONFLICT 409; CONTROL_REQUIRED 422; SANCTION_CLASS_GATED 422 | Hidden case/target is 404; visible target without action authority is 403; unresolved entity actor/mandate is 403 without ownership leakage. |
| TSE-06B-02 | ControlRequest to ControlResponse with actual control kind and decision version | UNAUTHENTICATED 401; FORBIDDEN 403; DECISION_NOT_FOUND 404; VERSION_CONFLICT 409; CONTROL_REQUIRED 422 | Hidden decision 404; original decider, model output or conflicted actor is 403; cooling-off failure is 422. |
| TSE-06B-03 | AppealRequest to AppealResponse with per-item result and compensation state | UNAUTHENTICATED 401; FORBIDDEN 403; DECISION_NOT_FOUND 404; VERSION_CONFLICT 409; APPEAL_WINDOW_CLOSED 422 | Hidden decision 404; ineligible subject or original decider is 403; closed window is 422 without mutation. |
| TSE-06B-04 | RiskSignalRequest to RiskSignalResponse with advisory signal/disposition | INVALID_REQUEST 400; UNAUTHENTICATED 401; IDEMPOTENCY_MISMATCH 409; PERSON_SUBJECT 422; PROVIDER_UNAVAILABLE 503 | Signal target outside service registry is 404; no human target or user-score route exists. |
| TSE-06B-05 | MessageSafetyRequest to MessageSafetyResponse with warning or delivered-unwarned state | INVALID_REQUEST 400; FORBIDDEN 403; THREAD_NOT_FOUND 404; IDEMPOTENCY_MISMATCH 409; PROVIDER_UNAVAILABLE 503 | Non-participant report is 403; hidden thread 404; provider outage returns fail-open delivery state, never blocked send. |
| TSE-06B-06 | CommerceRiskRequest to CommerceRiskResponse with rail decision or triangulation hold | UNAUTHENTICATED 401; FORBIDDEN 403; TRANSACTION_NOT_FOUND 404; VERSION_CONFLICT 409; RISK_INVALID 422; PROVIDER_UNAVAILABLE 503 | Hidden transaction/listing 404; visible listing without specialist capability 403; below-market price alone is 422. |
| TSE-06B-07 | ReviewIntegrityRequest to ReviewIntegrityResponse with role-scoped decision | UNAUTHENTICATED 401; FORBIDDEN 403; REVIEW_NOT_FOUND 404; VERSION_CONFLICT 409; POLICY_VERSION_INVALID 422; CONTROL_REQUIRED 422 | Hidden review 404; unauthorized role or conflicted adjudicator 403; review-data detection input is 422. |
| TSE-06B-08 | TvecRequest to TvecResponse with mechanism, outcome, SoR and appeal state | UNAUTHENTICATED 401; FORBIDDEN 403; OBJECT_NOT_FOUND 404; VERSION_CONFLICT 409; POLICY_VERSION_INVALID 422; PROVIDER_UNAVAILABLE 503 | Hidden object 404; visible object without mechanism authority 403; wrong evidence mechanism is 422 and no removal. |

## Request/Response Contracts (Zod 4 schemas)

All objects are strict Zod 4 schemas. Unknown keys fail, timestamps carry
offsets, IDs are UUIDs and free text is bounded. API responses expose safe
decision metadata and references, never narrative, reporter/reviewer identity,
raw evidence, private message content or user-level scores.

~~~ts
import { z } from "zod";

const Uuid = z.uuid();
const IsoTime = z.string().datetime({ offset: true });
const Version = z.string().regex(/^[1-9][0-9]{0,17}$/);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Code = z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/);
const Text = z.string().trim().min(1).max(4096);
const ScopeType = z.enum(["object", "feature", "domain", "account", "entity"]);
const Decision = z.enum(["no_action", "warn", "restrict", "remove_object", "suspend_scope", "demonetize", "suspend_account", "terminate_access", "restore", "refer_external", "resources_only"]);
const ApiError = z.strictObject({
  code: Code,
  message: z.string().min(1).max(256),
  requestId: Uuid,
   details: z.record(z.string().max(64), z.json()).superRefine((v, c) => {
    if (Object.keys(v).length > 16) c.addIssue({ code: "custom", message: "too many details" });
  })
});
 const JsonObject = z.record(z.string().max(128), z.json()).superRefine((v, c) => {
  if (Object.keys(v).length > 64 || JSON.stringify(v).length > 65536) c.addIssue({ code: "custom", message: "bounded object required" });
});

export const Tse06b01ActivateDecisionRequest = z.strictObject({
  expectedCaseVersion: Version,
  expectedDecisionVersion: Version,
  targetId: Uuid,
  targetVersion: Version,
  decision: Decision,
  scopeType: ScopeType,
  scopeId: Uuid,
  ruleVersionId: Uuid,
  evidenceManifestHash: Hash,
  rationale: Text,
  consequencePreview: JsonObject,
  controlSatisfied: z.boolean(),
  stepUpToken: z.string().min(20).max(4096).optional(),
  durationEndsAt: IsoTime.nullable(),
  indefinite: z.boolean()
}).superRefine((v, c) => {
  if (v.indefinite && v.durationEndsAt !== null) c.addIssue({ code: "custom", message: "indefinite cannot have end" });
  if (!v.indefinite && v.durationEndsAt === null) c.addIssue({ code: "custom", message: "end required" });
  if (v.decision === "no_action" || v.decision === "restore" || v.decision === "refer_external" || v.decision === "resources_only") c.addIssue({ code: "custom", path: ["decision"], message: "non-sanction decision uses no activation route" });
});
export const Tse06b01ActivateDecisionResponse = z.strictObject({
  decisionId: Uuid,
  sanctionId: Uuid,
  enforcementItemId: Uuid,
  state: z.enum(["active", "superseded", "reversed", "expired"]),
  scopeType: ScopeType,
  rung: z.number().int().min(0).max(8),
  statementOfReasonsId: Uuid,
  auditEventId: Uuid,
  outboxEventId: Uuid,
  version: Version
});

export const Tse06b02ControlRequest = z.strictObject({
  expectedDecisionVersion: Version,
  controlKind: z.enum(["concurrence", "solo_reaffirmation", "urgent_compensating_control"]),
  rationale: Text,
  evidenceHash: Hash,
  reaffirmAfter: IsoTime.nullable(),
  stepUpToken: z.string().min(20).max(4096)
});
export const Tse06b02ControlResponse = z.strictObject({
  decisionId: Uuid,
  controlKind: z.enum(["concurrence", "solo_reaffirmation", "urgent_compensating_control"]),
  satisfiedAt: IsoTime,
  reviewerPersonId: Uuid,
  decisionVersion: Version,
  state: z.literal("awaiting_control")
});

export const Tse06b03AppealRequest = z.strictObject({
  expectedDecisionVersion: Version,
  appealReason: Text,
  supplement: z.string().trim().max(8192).nullable(),
  supplementHash: Hash.nullable(),
  requestedItems: z.array(Uuid).min(1).max(64)
});
export const Tse06b03AppealResponse = z.strictObject({
  appealId: Uuid,
  decisionId: Uuid,
  state: z.enum(["appealed", "decided", "resolved"]),
  reviewerAssigned: z.boolean(),
  perItem: z.array(z.strictObject({ enforcementItemId: Uuid, result: z.enum(["upheld", "reversed", "partially_reversed", "pending"]), compensationId: Uuid.nullable() })).max(64),
  supplementSealed: z.boolean(),
  version: Version
});

export const Tse06b04RiskSignalRequest = z.strictObject({
  subjectKind: z.enum(["action", "object"]),
  subjectId: Uuid,
  actionEventId: Uuid.nullable(),
  reasonCodes: z.array(z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/)).min(1).max(32),
  sourceKind: z.enum(["classifier", "matcher", "ban_evasion_graph", "rules"]),
  sourceVersion: Version,
  confidence: z.number().min(0).max(1).nullable(),
  expiresAt: IsoTime,
  inputHash: Hash
});
export const Tse06b04RiskSignalResponse = z.strictObject({
  signalId: Uuid,
  subjectKind: z.enum(["action", "object"]),
  state: z.enum(["advisory", "expired", "dispositioned"]),
  dispositionId: Uuid.nullable(),
  enforcementReachable: z.literal(false),
  recordedAt: IsoTime
});

export const Tse06b05MessageSafetyRequest = z.strictObject({
  threadId: Uuid,
  messageEventId: Uuid,
  participantReportId: Uuid.nullable(),
  patternCodes: z.array(z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/)).max(32),
  signalVersion: Version,
  metadataHash: Hash,
  contentInspection: z.boolean()
}).superRefine((v, c) => {
  if (v.contentInspection && v.participantReportId === null) c.addIssue({ code: "custom", path: ["participantReportId"], message: "participant report required" });
});
export const Tse06b05MessageSafetyResponse = z.strictObject({
  evaluationId: Uuid,
  threadId: Uuid,
  state: z.enum(["warning_raised", "delivered_clean", "delivered_unwarned"]),
  warningDismissible: z.literal(true),
  sendBlocked: z.literal(false),
  evaluatedAt: IsoTime
});

export const Tse06b06CommerceRiskRequest = z.strictObject({
  mode: z.enum(["rail_velocity", "triangulation"]),
  transactionId: Uuid.nullable(),
  listingId: Uuid.nullable(),
  deviceHash: Hash.nullable(),
  sessionHash: Hash.nullable(),
  cardBinWindowHash: Hash.nullable(),
  attemptCount: z.number().int().min(0).max(10000).nullable(),
  indicatorCodes: z.array(z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/)).max(32),
  settled: z.boolean().nullable(),
  expectedVersion: Version.nullable()
}).superRefine((v, c) => {
  if (v.mode === "rail_velocity" && (v.transactionId === null || v.attemptCount === null)) c.addIssue({ code: "custom", message: "rail fields required" });
  if (v.mode === "triangulation" && v.listingId === null) c.addIssue({ code: "custom", message: "listing required" });
});
export const Tse06b06CommerceRiskResponse = z.strictObject({
  mode: z.enum(["rail_velocity", "triangulation"]),
  railDecisionId: Uuid.nullable(),
  indicatorId: Uuid.nullable(),
  outcome: z.enum(["allow", "throttle", "blocked", "payout_hold_review"]),
  fulfilmentAllowed: z.boolean(),
  humanReviewRequired: z.boolean(),
  version: Version
});

export const Tse06b07ReviewIntegrityRequest = z.strictObject({
  expectedReviewVersion: Version,
  roleScope: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  linkageGraphEvidenceHash: Hash,
  citedRuleVersionId: Uuid,
  action: z.enum(["review", "remove", "restore"]),
  rationale: Text,
  statementOfReasonsRequired: z.literal(true),
  appealRouteRequired: z.literal(true)
});
export const Tse06b07ReviewIntegrityResponse = z.strictObject({
  findingId: Uuid,
  reviewId: Uuid,
  action: z.enum(["review", "removed", "restored"]),
  roleScope: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  statementOfReasonsId: Uuid.nullable(),
  appealId: Uuid.nullable(),
  version: Version
});

export const Tse06b08TvecRequest = z.strictObject({
  objectId: Uuid,
  objectVersion: Version,
  mechanism: z.enum(["hash_match", "policy_judgment"]),
  designatedSetVersion: Version.nullable(),
  policyRuleVersionId: Uuid.nullable(),
  evidenceHash: Hash,
  decision: z.enum(["remove_object", "restore", "no_action"]),
  rationale: Text,
  controlSatisfied: z.literal(true),
  stepUpToken: z.string().min(20).max(4096).optional()
}).superRefine((v, c) => {
  if (v.mechanism === "hash_match" && v.designatedSetVersion === null) c.addIssue({ code: "custom", message: "designated set required" });
  if (v.mechanism === "policy_judgment" && v.policyRuleVersionId === null) c.addIssue({ code: "custom", message: "policy rule required" });
});
export const Tse06b08TvecResponse = z.strictObject({
  evaluationId: Uuid,
  mechanism: z.enum(["hash_match", "policy_judgment"]),
  outcome: z.enum(["removed", "restored", "no_action", "pending"]),
  statementOfReasonsId: Uuid.nullable(),
  appealId: Uuid.nullable(),
  version: Version
});

export type Tse06bApiError = z.infer<typeof ApiError>;
~~~

## Database Schema

All tables reside in private platform_private, have forced RLS and are
append-only except named state-transition RPCs. Every field below includes SQL
type, nullability and a constraint. Foreign keys are explicit; polymorphic
target, action and policy references use typed registries because no generic
foreign key can enforce their producer ownership. Defaults are revoked from
public, anon and authenticated.

### Canonical records and fields

| Table | Fields with SQL type, nullability and constraints | Foreign keys | Query indexes and uniqueness | RLS and grants |
|---|---|---|---|---|
| platform_private.policy_rule_version | id uuid NOT NULL PRIMARY KEY; rulebook_kind text NOT NULL CHECK registered kind; rule_key text NOT NULL CHECK lowercase key; version_no bigint NOT NULL CHECK >0; authoritative_locale text NOT NULL CHECK locale; text_hash text NOT NULL CHECK 64 lowercase hex; machine_rule jsonb NOT NULL; effective_from timestamptz NOT NULL; effective_until timestamptz NULL; supersedes_id uuid NULL; published_at timestamptz NULL; created_at timestamptz NOT NULL; UNIQUE rule_key, version_no | supersedes_id self-REFERENCES policy_rule_version(id); publisher identity is protected registry reference with no caller FK | INDEX rule_key, effective_from, effective_until; INDEX rulebook_kind, authoritative_locale; UNIQUE rule_key and version_no; partial INDEX published active interval | RLS forced; release/policy RPC inserts immutable rows; staff reads exact pinned version only; no direct authenticated grant |
| platform_private.policy_acceptance | id uuid NOT NULL PRIMARY KEY; rule_version_id uuid NOT NULL; subject_person_id uuid NOT NULL; acting_party_id uuid NULL; locale text NOT NULL; accepted_at timestamptz NOT NULL; acceptance_hash text NOT NULL CHECK 64 lowercase hex; version bigint NOT NULL CHECK >0; UNIQUE rule_version_id, subject_person_id, locale | rule_version_id REFERENCES policy_rule_version(id); subject_person_id REFERENCES auth.users(id); acting_party_id REFERENCES platform_private.party(id) | INDEX subject_person_id, accepted_at DESC; INDEX rule_version_id, locale; UNIQUE rule version, subject and locale | RLS forced; subject and authorized policy projection only; acceptance append-only; named RPC grant |
| platform_private.case_decision | id uuid NOT NULL PRIMARY KEY; case_id uuid NOT NULL; finding text NOT NULL CHECK allegation or substantiated or unsubstantiated or no_action; rule_version_id uuid NOT NULL; evidence_manifest_hash text NOT NULL CHECK 64 lowercase hex; rationale_ciphertext bytea NOT NULL; rationale_key_ref text NOT NULL; target_scope text NOT NULL CHECK object or feature or domain or account or entity; proposed_by uuid NOT NULL; proposed_at timestamptz NOT NULL; activated_at timestamptz NULL; state text NOT NULL CHECK draft or proposed or awaiting_control or active or superseded or reversed or expired; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; UNIQUE case_id, version | case_id REFERENCES platform_private.safety_case(id); rule_version_id REFERENCES policy_rule_version(id); proposed_by REFERENCES auth.users(id); target scope/actor mandate validated by 06a and Shard 01 RPC | INDEX case_id, state, version DESC; INDEX rule_version_id; INDEX target_scope, state; UNIQUE active subject-target-policy tuple enforced by activation RPC | RLS forced; assigned reviewer/decision RPC only; no narrative projection; atomic SoR/audit required |
| platform_private.decision_control | id uuid NOT NULL PRIMARY KEY; decision_id uuid NOT NULL; control_kind text NOT NULL CHECK concurrence or solo_reaffirmation or urgent_compensating_control; required_reason text NOT NULL CHECK length 1..4096; reviewer_staff_id uuid NULL; prior_decider_id uuid NULL; reaffirm_after timestamptz NULL; satisfied_at timestamptz NOT NULL; evidence_hash text NOT NULL CHECK 64 lowercase hex; created_at timestamptz NOT NULL; UNIQUE decision_id, reviewer_staff_id, control_kind | decision_id REFERENCES case_decision(id); reviewer_staff_id REFERENCES auth.users(id); prior_decider_id REFERENCES auth.users(id) | INDEX decision_id, satisfied_at; INDEX reviewer_staff_id, satisfied_at DESC; UNIQUE decision/reviewer/control | RLS forced; control RPC checks distinct-person and human identity; model/service principals cannot satisfy; append-only grant |
| platform_private.sanction | id uuid NOT NULL PRIMARY KEY; decision_id uuid NOT NULL; subject_person_id uuid NULL; subject_party_id uuid NULL; action text NOT NULL CHECK closed Decision; rung smallint NOT NULL CHECK rung BETWEEN 0 AND 8; scope_type text NOT NULL CHECK object or feature or domain or account or entity; scope_id uuid NOT NULL; starts_at timestamptz NOT NULL; ends_at timestamptz NULL; indefinite boolean NOT NULL; state text NOT NULL CHECK active or superseded or reversed or expired; reversal_id uuid NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; CHECK exactly one subject person or party; CHECK rung 5 rejected; UNIQUE decision_id, version | decision_id REFERENCES case_decision(id); subject_person_id REFERENCES auth.users(id); subject_party_id REFERENCES platform_private.party(id); reversal_id self-REFERENCES sanction(id); scope target validated by typed owner RPC | INDEX subject_person_id, state; INDEX subject_party_id, state; INDEX scope_type, scope_id, state; partial UNIQUE subject-target-policy tuple WHERE state = active | RLS forced; activation RPC only; ownership, credits, splits and balances have no grant; per-target projection |
| platform_private.enforcement_item | id uuid NOT NULL PRIMARY KEY; sanction_id uuid NOT NULL; target_type text NOT NULL CHECK registered domain; target_id uuid NOT NULL; expected_target_version bigint NOT NULL CHECK >0; command_key text NOT NULL CHECK registered command; state text NOT NULL CHECK pending or applied or failed or compensated or blocked; attempt_count integer NOT NULL CHECK 0..3; result_code text NULL CHECK uppercase code; reversal_item_id uuid NULL; completed_at timestamptz NULL; created_at timestamptz NOT NULL; UNIQUE sanction_id, target_type, target_id | sanction_id REFERENCES sanction(id); reversal_item_id self-REFERENCES enforcement_item(id); target typed command registry has no generic FK | INDEX sanction_id, state; INDEX target_type, target_id, state; INDEX attempt_count, state; UNIQUE sanction target | RLS forced; worker command RPC rechecks target version and capability; staff sees safe per-item status; no direct DML |
| platform_private.statement_of_reasons | id uuid NOT NULL PRIMARY KEY; decision_id uuid NOT NULL; locale text NOT NULL; plain_summary text NOT NULL CHECK length 1..4096; structured_payload jsonb NOT NULL; delivery_state text NOT NULL CHECK pending or delivered or failed or superseded; supersedes_id uuid NULL; created_at timestamptz NOT NULL; UNIQUE decision_id, locale, created_at | decision_id REFERENCES case_decision(id); supersedes_id self-REFERENCES statement_of_reasons(id) | INDEX decision_id, locale, created_at DESC; INDEX delivery_state; UNIQUE immutable correction chain | RLS forced; recipient-safe projection; protected reason fields encrypted; append-only RPC |
| platform_private.appeal | id uuid NOT NULL PRIMARY KEY; decision_id uuid NOT NULL; appellant_person_id uuid NULL; appellant_party_id uuid NULL; supplement_id uuid NULL; reviewer_staff_id uuid NULL; state text NOT NULL CHECK appealed or reviewing or decided or resolved or closed; result_by_item jsonb NOT NULL; decided_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; CHECK one appellant ref; UNIQUE decision_id, appellant_person_id, appellant_party_id | decision_id REFERENCES case_decision(id); appellant_person_id REFERENCES auth.users(id); appellant_party_id REFERENCES platform_private.party(id); reviewer_staff_id REFERENCES auth.users(id); supplement_id references evidence supplement by typed 06a RPC | INDEX decision_id, state; INDEX reviewer_staff_id, state; INDEX appellant refs; UNIQUE active appeal per decision/appellant | RLS forced; appellant sees own safe state; reviewer independence RPC; supplement remains sealed; no direct table grant |
| platform_private.risk_signal | id uuid NOT NULL PRIMARY KEY; subject_kind text NOT NULL CHECK action or object; subject_id uuid NOT NULL; action_event_id uuid NULL; reason_codes text[] NOT NULL CHECK cardinality 1..32; source_kind text NOT NULL CHECK classifier or matcher or ban_evasion_graph or rules; source_version bigint NOT NULL CHECK >0; confidence numeric(9,6) NULL CHECK 0..1; observed_at timestamptz NOT NULL; expires_at timestamptz NOT NULL; state text NOT NULL CHECK advisory or expired or dispositioned; input_hash text NOT NULL CHECK 64 lowercase hex; created_at timestamptz NOT NULL; UNIQUE source_kind, source_version, input_hash | action_event_id is a typed source-event reference with no generic FK; subject is action/object only | INDEX subject_kind, subject_id, observed_at DESC; INDEX source_kind, source_version; INDEX state, expires_at; UNIQUE source/input hash | RLS forced; service principal insert; risk router and authorized specialist projection only; no user profile or enforcement grant |
| platform_private.review_disposition | id uuid NOT NULL PRIMARY KEY; signal_id uuid NOT NULL; reviewer_staff_id uuid NULL; disposition text NOT NULL CHECK ignore or queue_review or expired or linked_case; reason_code text NOT NULL; created_at timestamptz NOT NULL; UNIQUE signal_id | signal_id REFERENCES risk_signal(id); reviewer_staff_id REFERENCES auth.users(id) | INDEX signal_id; INDEX reviewer_staff_id, created_at DESC; UNIQUE one current disposition | RLS forced; specialist only; no direct public or subject access; append-only RPC |
| platform_private.message_safety_evaluation | id uuid NOT NULL PRIMARY KEY; thread_id uuid NOT NULL; message_event_id uuid NOT NULL; participant_report_id uuid NULL; matched_pattern_codes text[] NOT NULL; signal_version bigint NOT NULL CHECK >0; metadata_hash text NOT NULL CHECK 64 lowercase hex; content_inspected boolean NOT NULL; state text NOT NULL CHECK warning_raised or delivered_clean or delivered_unwarned; evaluated_at timestamptz NOT NULL; fail_open boolean NOT NULL; created_at timestamptz NOT NULL; UNIQUE message_event_id, signal_version | thread_id and message_event_id are messaging producer references with no generic FK; participant_report_id typed report reference | INDEX thread_id, evaluated_at DESC; INDEX state, evaluated_at; UNIQUE message event and signal version | RLS forced; messaging worker only; participant report gate enforced; no message content retention absent report |
| platform_private.rail_velocity_decision | id uuid NOT NULL PRIMARY KEY; transaction_id uuid NOT NULL; device_hash text NULL CHECK 64 lowercase hex; session_hash text NULL CHECK 64 lowercase hex; card_bin_window_hash text NULL CHECK 64 lowercase hex; observed_attempt_count integer NOT NULL CHECK >=0; outcome text NOT NULL CHECK allow or throttle or blocked; evaluated_at timestamptz NOT NULL; settlement_confirmed boolean NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; UNIQUE transaction_id, version | transaction_id references commerce transaction by typed adapter; no ownership or price FK | INDEX device_hash, evaluated_at; INDEX card_bin_window_hash, evaluated_at; INDEX transaction_id, version DESC; INDEX outcome, evaluated_at | RLS forced; payment rail service only; no user-facing risk score; exact rail provider grant |
| platform_private.triangulation_indicator | id uuid NOT NULL PRIMARY KEY; listing_id uuid NOT NULL; indicator_codes text[] NOT NULL CHECK cardinality 1..32; indicator_set_hash text NOT NULL CHECK 64 lowercase hex; payout_hold_id uuid NULL; human_review_case_id uuid NULL; state text NOT NULL CHECK detected or held or cleared or resolved; created_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; UNIQUE listing_id, indicator_set_hash | listing_id references marketplace listing by typed adapter; payout_hold_id references payment risk reserve by typed adapter; human_review_case_id REFERENCES platform_private.safety_case(id) | INDEX listing_id, state; INDEX payout_hold_id; INDEX human_review_case_id; UNIQUE listing and indicator hash | RLS forced; fraud specialist and payment adapter named RPC; no auto-block or seller reputation override |
| platform_private.review_integrity_finding | id uuid NOT NULL PRIMARY KEY; review_id uuid NOT NULL; role_scope text NOT NULL; linkage_graph_evidence_hash text NOT NULL CHECK 64 lowercase hex; cited_rule_version_id uuid NOT NULL; removal_decision_id uuid NULL; statement_of_reasons_id uuid NULL; appeal_id uuid NULL; state text NOT NULL CHECK found or removed or restored or expired; created_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0 | cited_rule_version_id REFERENCES policy_rule_version(id); removal_decision_id REFERENCES case_decision(id); statement_of_reasons_id REFERENCES statement_of_reasons(id); appeal_id REFERENCES appeal(id); review_id is review producer reference with no generic FK | INDEX review_id, role_scope, state; INDEX cited_rule_version_id; INDEX removal_decision_id; UNIQUE review, role and version | RLS forced; integrity adjudicator only; role scope is mandatory; no review data in detection path |
| platform_private.tvec_evaluation | id uuid NOT NULL PRIMARY KEY; object_id uuid NOT NULL; object_version bigint NOT NULL CHECK >0; mechanism text NOT NULL CHECK hash_match or policy_judgment; designated_set_version bigint NULL; policy_rule_version_id uuid NULL; evidence_hash text NOT NULL CHECK 64 lowercase hex; human_decider_id uuid NULL; decision text NOT NULL CHECK remove_object or restore or no_action; state text NOT NULL CHECK evaluated or removed or restored or pending; created_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; UNIQUE object_id, object_version, mechanism, version | policy_rule_version_id REFERENCES policy_rule_version(id); human_decider_id REFERENCES auth.users(id); object has typed producer reference; CHECK hash path has designated set and policy path has rule/human decider | INDEX object_id, object_version, state; INDEX mechanism, designated_set_version; INDEX policy_rule_version_id; UNIQUE mechanism-specific evaluation tuple | RLS forced; hash service or human policy RPC; evidence mechanism cannot cross; ordinary enforcement/SoR RPC owns removal |

### Permission, RLS and grants

Only named Worker RPCs receive grants: activate_decision,
record_control, submit_appeal, evaluate_risk_signal,
evaluate_message_safety, commerce_risk_action,
adjudicate_review_integrity and tvec_action. Security-definer functions set an
empty fixed search path and qualify every table.

RLS requires current authenticated subject or registered service identity,
acting-party context, exact assigned case/role scope, conflict-free reviewer,
current mandate where entity effects are requested, fresh step-up for
high-consequence actions and CAS target versions. Policy rows are readable
only at the exact version pinned by a decision. Signals never grant
enforcement. Payment rail service cannot write sanctions; sanctions cannot
write ownership, credits, splits, balances or export rights.

## Middleware & Policies

### Hono middleware order

Request ID, TLS/method/security headers and exact CORS; raw/body/content guard;
session or registered service principal; acting-party context; CSRF for cookie
mutations; strict Zod path/query/header/body; case/target/policy visibility;
capability, conflict, exposure and step-up; rate limiting; idempotency lookup;
handler/RPC; atomic audit/SoR/outbox; worker lease; response projection and
ApiError normalization. Advisory signals are policy-separated from command
authorization.

### Per-operation authorization matrix

| Operation ID | Principal and capability | Ownership and scope predicate | Commit or response recheck | Denial result |
|---|---|---|---|---|
| TSE-06B-01 | Assigned moderator/enforcement operator and required control | Case/target/rule/evidence scope; narrowest rung; Shard 01 actor mandate for entity | Lock case/decision/target; recheck versions, controls, SoR/audit capability and active tuple | Hidden case 404; visible action denial 403; control/rung failure 422 |
| TSE-06B-02 | Independent human reviewer | Reviewer distinct from decider, conflict-free and lane-authorized | Lock decision/control; recheck human identity, prior decider and cooling-off | Hidden decision 404; original/model/conflict 403; unmet cooling-off 422 |
| TSE-06B-03 | Eligible subject/party and independent appeal reviewer | Appeal window and pinned policy; reviewer distinct from original decider | Lock decision/appeal; recheck subject, reviewer, target versions and item list | Hidden decision 404; ineligible actor 403; moved decision 409 |
| TSE-06B-04 | Registered worker and named source rule/model | Action/object subject only; shadow/active rule version and source registry | Recheck source version and expiry before signal insert; no sanction authority | Invalid person subject 422; source outage fail-open |
| TSE-06B-05 | Messaging worker | Thread event and participant report gate for content inspection | Recheck thread participant relation and event idempotency; never block send | Non-participant 403; hidden thread 404; outage delivered unwarned |
| TSE-06B-06 | Payment rail service or scoped fraud specialist | Rail transaction/velocity window or listing indicator scope; settlement gate | Recheck rail window and settlement; specialist reviews human hold | Hidden target 404; specialist scope 403; provider unknown pending |
| TSE-06B-07 | Independent review-integrity adjudicator | Role scope and linkage graph evidence; cited rule/SoR/appeal | Lock finding/review; recheck role and rule; no review-data detector | Hidden review 404; conflict/role denial 403 |
| TSE-06B-08 | Designated-set worker or human policy decider | Mechanism-specific evidence and ordinary ladder control | Lock object/evaluation; recheck mechanism, set/rule, control and versions | Hidden object 404; wrong authority 403; cross-mechanism 422 |

### Security and abuse controls

- Policy and decision fields are immutable versioned values. Caller cannot
  supply a looser rule, broader scope, rung, reviewer or control.
- Rung 5 is disabled. Rung 6, 7, 8 and indefinite are dual-human controlled.
  Scope widening is explicit and requires entity actor/mandate resolution.
- Sanction activation writes decision, control, sanction, enforcement item,
  SoR, audit and outbox atomically. Any SoR/audit failure rolls back.
- Advisory classifier, matcher, fraud, ban-evasion and message signals only
  reorder review. No signal may remove, sanction, notify, authorize or become
  a durable user score.
- Message warning is inline and dismissible; send never waits. Content
  inspection requires participant report. Provider outage fails open.
- Rail velocity evaluates device, session and card-BIN spread before score.
  Legitimate distinct-buyer spikes are not throttled. Triangulation creates a
  payout hold plus human review; below-market price and reputation are not
  standalone evidence.
- Review integrity detection uses fraud linkage graph, never review data.
  TVEC hash and policy paths have distinct evidence, set/rule and authority.
- Every protected read excludes reporter, reviewer, legal, raw evidence,
  private message and protected-trait fields. Logs contain hashes and IDs only.

## Data Flow

### Transaction and external seams

| Operation ID | Canonical transaction | External seam request and response | Timeout, retries and circuit breaker |
|---|---|---|---|
| TSE-06B-01 | Lock case/decision/target; validate rule/evidence/scope/control; write sanction, items, SoR, audit and outbox atomically | Target domain request: enforcement item, command, expected target version and correlation. Response: applied/failed/compensated item with resulting version. | Worker attempt 2,000 ms; 3 retries at 15/60/300 s for retryable item; circuit 5/60 s; partial result stays active with compensation task. |
| TSE-06B-02 | Lock decision control; verify distinct human or solo rule; append control and expected decision version | Identity/MFA request: reviewer ID, fresh step-up and context version. Response: verified human context and capability. | 2,000 ms, no retry after unknown commit; circuit 5/60 s; missing proof leaves awaiting_control. |
| TSE-06B-03 | Lock decision/appeal; append sealed supplement; assign independent reviewer; create per-item compensation intents | Notification/reversal request: appeal ID, item ID, compensation command and expected target version. Response: receipt and per-item state. | 2,000 ms, 3 retries at 15/60/300 s; circuit 5/60 s; unknown item remains pending and appeal truthful partial. |
| TSE-06B-04 | Validate action/object signal; insert advisory signal and optional disposition; never enforcement write | Classifier/matcher/risk provider request: action/object ID, rule/model version and hashed features. Response: reason codes, confidence, expiry and input hash. | Provider 2,000 ms, 3 retries at 15/60/300 s; circuit 5/60 s; outage fails open to ordinary unscored flow. |
| TSE-06B-05 | Validate thread event and participant report; insert evaluation/warning projection off send path | Message evaluator request: metadata/pattern features, report ID when present and signal version. Response: warning or clean/unwarned disposition. | 500 ms, no retry on send-path worker after event dedupe; circuit 5/60 s; outage returns delivered_unwarned. |
| TSE-06B-06 | Rail mode records velocity decision; triangulation mode records indicator and payout hold/review intent | Payment rail request: device/session/BIN window and attempt count. Response: allow/throttle/block. Fraud adapter request: listing indicator set. Response: hold/review accepted. | Rail 500 ms, one retry at 100 ms, circuit 5/60 s; fraud review 2,000 ms, 3 retries 15/60/300 s, circuit 5/60 s. |
| TSE-06B-07 | Lock review/finding; validate role graph, cited rule and SoR/appeal; append removal/restore decision | Review projection request: review ID, role and linkage evidence hash. Response: current role-scoped review version. | 2,000 ms, one retry 250 ms; circuit 5/60 s; stale graph blocks and no removal. |
| TSE-06B-08 | Lock object/evaluation; validate mechanism path, ordinary control, SoR and appeal; commit outcome/outbox | Designated set request: object hash and set version. Response: exact match/set receipt. Policy adapter request: rule/evidence. Response: human-approved judgment. | Set lookup 2,000 ms, 3 retries 15/60/300 s, circuit 5/60 s; unavailable leaves pending with no auto action. |

All queues use BE00 at-least-once delivery, stable idempotency and DLQ after
three attempts. Provider ambiguity remains pending or unknown. No automatic
retry can widen a target, change a policy or convert an advisory result into
enforcement.

### State machine and concurrency

| Aggregate | Allowed transitions and guards | Concurrent or failure behavior |
|---|---|---|
| Policy rule | draft to published to superseded | Published text/rule/locale/interval immutable; decisions retain exact version. |
| Case decision | draft to proposed to awaiting_control to active to superseded or reversed or expired | Exact case/target/policy CAS; first active tuple wins; loser receives VERSION_CONFLICT and re-evaluates. |
| Decision control | required to satisfied or expired | Distinct-person predicate and MFA are checked inside transaction; model output cannot satisfy. |
| Sanction/enforcement item | pending to applied or failed or blocked; active to reversed or expired; item to compensated | Per-item idempotent command; partial failure keeps decision active and exposes compensation state. |
| Appeal | appealed to reviewing to decided to resolved | Original decider excluded; supplements append sealed; partial reversal remains truthful until all items converge. |
| Advisory signal | advisory to dispositioned or expired | Expiry removes routing influence; outage creates no signal and ordinary flow continues. |
| Message evaluation | evaluating to warning_raised or delivered_clean or delivered_unwarned | Off-send path; duplicate event dedupes; content outage cannot delay send. |
| Rail and triangulation | allow or throttle or blocked; detected to held or cleared or resolved | Rail decision before score; triangulation hold requires human review and never auto-block. |
| Review integrity and TVEC | found to removed or restored; evaluated to removed or restored or pending | Role/mechanism evidence stays scoped; stale provider leaves prior state and no automatic action. |

## Event Schemas

Events use the BE00 identifier-only envelope: eventId uuid, eventType literal,
occurredAt timestamptz, requestId uuid, correlationId uuid, actorRef uuid
nullable, aggregateId uuid, aggregateVersion bigint and strict payload. No
raw policy text, evidence, message, reviewer or subject identity is emitted.

~~~ts
export const SafetyDecisionActivatedV1 = z.strictObject({
  caseId: z.uuid(),
  decisionId: z.uuid(),
  policyVersion: Version,
  scopeType: ScopeType,
  controlHash: z.string().regex(/^[a-f0-9]{64}$/),
  statementOfReasonsHash: z.string().regex(/^[a-f0-9]{64}$/),
  auditHash: z.string().regex(/^[a-f0-9]{64}$/)
});
export const SafetyDecisionReversedV1 = z.strictObject({
  caseId: z.uuid(),
  originalDecisionId: z.uuid(),
  resultId: z.uuid(),
  compensatingItemIds: z.array(z.uuid()).max(64)
});
export const SafetySignalRecordedV1 = z.strictObject({
  signalId: z.uuid(),
  subjectKind: z.enum(["action", "object"]),
  subjectId: z.uuid(),
  sourceVersion: Version,
  expiresAt: z.string().datetime({ offset: true })
});
export const SafetyMessageWarningRaisedV1 = z.strictObject({
  threadId: z.uuid(),
  patternCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/)).max(32),
  signalVersion: Version
});
export const SafetyRailBlockedV1 = z.strictObject({
  deviceWindowHash: z.string().regex(/^[a-f0-9]{64}$/),
  sessionWindowHash: z.string().regex(/^[a-f0-9]{64}$/),
  binWindowHash: z.string().regex(/^[a-f0-9]{64}$/),
  outcome: z.literal("blocked")
});
export const SafetyTriangulationHeldV1 = z.strictObject({
  listingId: z.uuid(),
  indicatorCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/)).max(32),
  holdReference: z.uuid()
});
export const SafetyReviewRemovedV1 = z.strictObject({
  reviewId: z.uuid(),
  roleScope: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  ruleVersion: Version,
  statementOfReasonsReference: z.uuid()
});
export const SafetyTvecDecidedV1 = z.strictObject({
  objectId: z.uuid(),
  mechanism: z.enum(["hash_match", "policy_judgment"]),
  policyOrSetVersion: Version,
  decision: z.enum(["remove_object", "restore", "no_action"])
});
~~~

| Event type | Producer operation | Payload and consumer rule |
|---|---|---|
| safety.decision.activated.v1 | TSE-06B-01 | Case/decision/policy/scope/control/SoR/audit hashes; target domain refetches exact item and never treats event as sanction proof. |
| safety.decision.reversed.v1 | TSE-06B-03 | Case/original/result/compensating IDs; consumers apply per-item compensation and retain history. |
| safety.signal.recorded.v1 | TSE-06B-04 | Signal/action-or-object/reasons/version/expiry; authorized risk router only, no enforcement consumer. |
| safety.message-warning.raised.v1 | TSE-06B-05 | Thread/pattern codes/signal version; messaging surface displays dismissible warning. |
| safety.rail.blocked.v1 | TSE-06B-06 | Device/session/BIN window/outcome; payment adapter refetches rail decision. |
| safety.triangulation.held.v1 | TSE-06B-06 | Listing/indicator codes/hold reference; payout adapter holds and opens review, never auto-blocks seller. |
| safety.review.removed.v1 | TSE-06B-07 | Review/role scope/rule/SoR reference; review projection refetches role-scoped outcome. |
| safety.tvec.decided.v1 | TSE-06B-08 | Object/mechanism/policy or set version/decision; consumers preserve mechanism-specific evidence. |

## Error Handling

### Boundary mapping

| Boundary | Typed internal failure | HTTP and ApiError code | State guarantee |
|---|---|---|---|
| Input/policy schema | Unknown action, scope, rung, rule, mechanism, report gate or field | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | No decision, signal, warning or rail mutation. |
| Auth/context/step-up | Missing session, stale context, MFA or service identity | 401 UNAUTHENTICATED or STEP_UP_REQUIRED | No protected target or evidence disclosure. |
| Capability/conflict | Wrong moderator, reviewer, specialist, subject, role or control | 403 FORBIDDEN | No state transition or lease. |
| Visibility | Hidden case, target, decision, thread, review, transaction or policy | 404 NOT_FOUND | No enumeration or protected payload leakage. |
| Version/idempotency | Moved case/target/policy, duplicate item or differing replay | 409 VERSION_CONFLICT or IDEMPOTENCY_MISMATCH | Rollback; original decision, active sanction or prior message state remains. |
| Domain guard | Missing control, rung 5, protected scope, person signal, cross-mechanism evidence, closed appeal | 422 CONTROL_REQUIRED, SANCTION_CLASS_GATED, PERSON_SUBJECT, POLICY_VERSION_INVALID or APPEAL_WINDOW_CLOSED | No enforcement or advisory escalation. |
| Provider/worker | Classifier/matcher/message/rail/set timeout or unavailable adapter | 503 PROVIDER_UNAVAILABLE or 504 UPSTREAM_TIMEOUT | Advisory fails open; message delivers; rail/set remains pending or domain fail-closed only where specified. |
| Unexpected | Unclassified exception | 500 INTERNAL_ERROR | Transaction rolls back and safe request ID is logged. |

### Operation error coverage

| Operation ID | Required edge cases and recovery |
|---|---|
| TSE-06B-01 | Unresolved actor/mandate, broad scope, self approval, stale case/target, missing control, rung 5, SoR/audit failure and partial consumer; deny, rollback or retain active per-item compensation. |
| TSE-06B-02 | Original decider, model control, conflict, stale MFA, cooling-off and urgent S0/S1; retain awaiting_control with actual control kind. |
| TSE-06B-03 | Closed window, original reviewer, stale decision, partial reversal and sealed supplement; preserve active items and retry compensation. |
| TSE-06B-04 | Person subject, score/profile attempt, shadow-mode route, provider outage and expired signal; reject or fail open with no enforcement. |
| TSE-06B-05 | Non-participant report, content inspection without report, provider outage and dismissed warning; reject inspection or deliver unwarned without delay. |
| TSE-06B-06 | Rail velocity breach, legitimate spike, settlement absent, below-market price, reputation veto and provider ambiguity; rail controls or human hold only. |
| TSE-06B-07 | Review-data detector, missing graph evidence, wrong role, no SoR/appeal and reversal; no removal or restore outside role. |
| TSE-06B-08 | Hash-set outage, wrong policy mechanism, no control, user extremism score and cross-mechanism evidence; pending/no action and ordinary ladder only. |

## Observability

| Operation ID | Required structured event and metrics | Trace and redaction |
|---|---|---|
| TSE-06B-01 | safety.decision.activated with decision/rung/scope/state/outcome and hashes; control, activation, rollback and per-item convergence metrics | Trace policy, RLS, SoR/audit and target adapter; no rationale, evidence or identity |
| TSE-06B-02 | safety.decision.controlled with decision/control kind/version/outcome; distinct-human, cooling-off and refusal metrics | Trace MFA and control RPC; no reviewer identity or private reason |
| TSE-06B-03 | safety.appeal.changed with appeal/decision/state/item counts; window, independence, partial compensation and convergence metrics | Trace appeal and reversal; supplement and legal identity scrubbed |
| TSE-06B-04 | safety.signal.recorded with signal/source/subject kind/version/expiry; advisory, expiry, outage and disposition metrics | Hash subject and features; no user score, traits, raw model input or enforcement claim |
| TSE-06B-05 | safety.message.evaluated with evaluation/thread hash/state/fail-open; warning, participant gate and delivery latency metrics | No message content, participant identity or private report |
| TSE-06B-06 | safety.rail.blocked or safety.triangulation.held with outcome/window hash/indicator count; throttle/block/hold/review metrics | Device/session/BIN hashes only; no PAN, price, reputation or seller identity |
| TSE-06B-07 | safety.review.integrity.changed with finding/review role/state/rule version; graph stale, SoR, appeal and per-role metrics | Review ID hash and graph hash only; never review text or detector input |
| TSE-06B-08 | safety.tvec.decided with evaluation/object hash/mechanism/version/outcome; provider availability and mechanism mismatch metrics | Object hash and decision metadata only; no extremist profile, raw hash set or policy text |

Logs use BE00 severity, environment, release, service, operation, outcome,
latency, requestId and correlationId. Sentry receives scrubbed errors.
Telemetry never implies an absent signal is safe or an advisory signal is a
finding.

## Testing Strategy

### Contract and route tests

| Operation ID | Contract and route acceptance tests |
|---|---|
| TSE-06B-01 | Validate DecisionRungMap, scope order, actor/mandate, control, SoR/audit and exact version; assert rung 5 denial, strict envelope, 403/404 and atomic 200/202. |
| TSE-06B-02 | Validate distinct human, control kind, MFA, cooling-off and urgent path; assert original/model denial and immutable actual control. |
| TSE-06B-03 | Validate eligible subject, window, sealed supplement, independent reviewer and per-item results; assert partial reversal and idempotent replay. |
| TSE-06B-04 | Validate action/object only, reason/version/confidence/expiry, source registry and advisory no-enforcement response; assert outage fail-open. |
| TSE-06B-05 | Validate participant report gate, metadata-only default, dismissible warning and sendBlocked false; assert outage delivered_unwarned. |
| TSE-06B-06 | Validate rail fields, BIN/device/session windows, settlement, indicator set and specialist scope; assert legitimate spike and no price-only block. |
| TSE-06B-07 | Validate role scope, graph hash, cited rule, SoR and appeal; assert review-data detection rejection and role preservation. |
| TSE-06B-08 | Validate mechanism-specific fields, designated set or policy rule, ordinary control and no user score; assert provider pending and SoR/appeal. |

### Authorization, persistence and concurrency tests

- Test anonymous, wrong valid user, wrong party, hidden target, stale context,
  expired capability, reviewer conflict, original decider, missing MFA and
  wrong service principal. Match exact 401/403/404/409/422 results.
- Verify direct table access is denied to anon/authenticated. RLS tests cover
  moderator, independent reviewer, fraud specialist, payment rail worker,
  messaging worker, policy decider and service principal.
- Run concurrent activations on one subject-target-policy tuple, concurrent
  controls, appeals and per-item compensation. Assert one winner, one event,
  no duplicate sanction and truthful partial state.
- Change policy/target/case version between review and commit. Assert
  VERSION_CONFLICT, no widened scope and no ownership/credit/balance mutation.
- Expire signals, revoke capabilities, lose providers, redeliver workers and
  fail SoR/audit writes. Assert fail-open advisory/message behavior,
  fail-closed domain rail behavior and no fabricated finding.

### Security, performance and recovery tests

- Fuzz policy keys, action/rung/scope, evidence hashes, JSON, message feature
  codes and mechanism fields. Confirm no SQL, template, credential, PAN,
  private content or protected trait reaches adapters or logs.
- Prove flags/signals cannot alter endpoint/RLS authorization, legal floors,
  consent, rights, money, ownership or evidence state.
- Measure reads against BE00 Tier 1 and protected commands within 15 seconds;
  verify per-user/team/device/BIN limits, queue lease and three-attempt
  15/60/300-second retry with circuit 5/60 seconds.
- Simulate target-domain partial application, reversal retry, control outage,
  classifier outage, message provider outage, rail unknown, hash-set outage,
  queue duplicate and snapshot replay. Assert pending/partial/unknown and DLQ.
- Verify SoR/audit atomicity, distinct human predicates, role/mechanism
  isolation, no user score, no auto triangulation block and no model control.

### Accessibility handoff tests

Decision and appeal surfaces announce consequence, scope, rung, rule version,
control kind, SoR, deadline, per-item result and partial state in text and
semantic status. Sensitive evidence is blurred/muted with text alternative.
Warnings are dismissible, not color-only, and never block send. Policy
intervals, cooling-off, appeal window and rail/hold state are accessible by
keyboard and screen reader.

## Deepening Passes

| Pass | Resulting hardening |
|---|---|
| Micro contract pass | Added strict policy/decision/scope enums, rung and interval rules, participant gate, mechanism union, bounded hashes and per-item results. |
| Boundary pass | Separated advisory, message, rail, triangulation, review-integrity and TVEC authorities from sanction activation and from 06a/06c routes. |
| Adversarial pass | Rejected self-concurrence, model controls, auth-by-flag, person scoring, review-data detection, price/reputation veto and cross-mechanism evidence. |
| Failure/recovery pass | Added CAS, atomic SoR/audit, compensation tasks, fail-open advisory/message paths, fail-closed rail path, pending TVEC and DLQ. |
| Data pass | Typed all 15 persistence tables with nullability, constraints, FK or registry rationale, indexes, forced RLS and grants. |
| Macro consistency pass | Reconciled eight interactions, 16 feature rows, 15 model names and eight events with 06a/06c boundaries. |

## Ambiguity Gate

PASS. Evidence:

- Micro: all eight TSE-06B operations have strict request/success contracts,
  exact ApiError/status mapping, explicit 403/404 rule, numeric rate limit,
  idempotency and operation-keyed tests.
- Macro: all eight assigned interactions, 16 feature rows, 15 model names
  and eight event types map once; intake, disputes and legal ownership are
  explicit.
- External seams: target, identity, risk, messaging, payment, fraud, review
  and TVEC adapters specify request, response, timeout, retries/backoff and
  circuit behavior. Advisory/provider ambiguity remains typed.
- Persistence: every field has SQL type, nullability and constraint, FK or
  typed registry rationale, query index, forced RLS and named grant.
- Transport: every route names CORS and exact BE00
  ApiError { code, message, requestId, details }.
- Tables: Markdown tables were width-checked after authoring; no row uses an
  unescaped pipe as a cell separator.
- No unresolved decision gap, hidden authorization rule or undecided choice
  remains in this split.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 06b policy/enforcement backend contracts from canonical Shard 06 IA and deep dive | /write-be-spec | All |
| 2026-08-28 | Added exact policy/rung/control, advisory, rail, review-integrity and TVEC contracts with typed RLS persistence | /write-be-spec-write | API, database, middleware, events, tests |

## Dependency References

- BE00 Cross-cutting platform foundation: ApiError, RequestContext,
  idempotency, jobs, outbox, logging, SLO and recovery.
- Shard 01 Identity authority and party governance: party, mandate, ownership
  and acting-context snapshots; this split never mutates ownership truth.
- Shard 05 Platform configuration, admin and quality: capabilities, MFA,
  policy/config versions, counsel gates, retention and diagnostics.
- Shard 06a Case intake and evidence: cases, leases, snapshots, evidence
  manifests and capture/hold references consumed by decisions.
- Shard 06c Disputes, DMCA and legal risk: dispute, legal and specialist
  workflows that consume policy, risk and evidence references.
- Shards 11–16, 25–37: target-domain enforcement, payment rail and per-item
  compensation adapters retain canonical ownership and transaction truth.
