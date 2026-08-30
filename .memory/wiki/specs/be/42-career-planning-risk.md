# Career Planning, Insurance & Sustainability Boundary — Backend Specification

> **IA Source**: [Shard 42 — Career planning, insurance and sustainability](../ia/42-career-planning-risk.md)
> **Foundation**: [Shard 00 Backend](00-infrastructure.md)
> **Status**: Complete
> **Operation count**: 9 registered HTTP operations
> **Source coverage**: 9/9 interactions, 9/9 canonical models, 6/6 canonical events

## Classification

- **Type**: Single domain. The indexed preliminary classification is valid.
- **Owned boundary**: Queryable career goals, derived progress, immutable milestones, privacy-gated peer distributions, advisory insurance-need observations, consented insurance referrals, provider-status reconciliation, and the stable sustainability-capability refusal.
- **Excluded boundary**: Shard 40 owns descriptive market evidence; Shard 41 owns income, runway, and finance facts; Shard 00 owns authentication, provider webhook ingress, idempotency, audit, outbox, queues, jobs, feature gates, and platform errors.
- **Locked prohibitions**: No career prescription, named-peer output, single market rate, underwriting, policy sale, coverage verdict, action blocking, wellbeing input, health profile, burnout inference, sustainability score, or reusable cohort-member list.
- **Approval basis**: The user's blanket `/write-be-spec all shards` approval authorizes implementation-detail choices that preserve the locked IA boundary.

## Referenced Material Inventory

| Material | Exact source location | Use in this specification |
|---|---|---|
| Shard 42 IA | Overview and architecture decisions, lines 7–38 | Ownership, non-goals, trust-tier segregation, privacy, B2, insurance, and sustainability boundaries |
| Shard 42 IA | Features, lines 40–44 | Feature reconciliation for 23.05, 23.08, and 23.09 |
| Shard 42 IA | Acceptance Criteria, lines 46–56 | Nine success and refusal contracts |
| Shard 42 IA | Interactions, lines 58–70 | Authoritative operation inventory 42.01–42.09 |
| Shard 42 IA | Contracts, lines 72–83 | Six canonical wire contracts and external-failure rule |
| Shard 42 IA | Data Models, lines 85–111 | Nine canonical records, typed fields, and forbidden wellbeing storage |
| Shard 42 IA | Access Control, lines 113–133 | Actor classes, purpose limits, support grants, and denial behavior |
| Shard 42 IA | Accessibility, lines 135–145 | Textual states, non-blocking prompts, consent disclosure, and p95 target |
| Shard 42 IA | Event Schemas, lines 147–158 | Six exact event types and privacy exclusions |
| Shard 42 IA | Edge Cases and coverage, lines 160–190 | Trust tiers, source revocation, cohort floor, suppression, concurrency, and cascade behavior |
| Shard 42 IA | Cross-Shard Dependencies, lines 192–203 | Shard 00, 40, and 41 producer/consumer seams |
| Shard 00 BE | Route and contract registries, lines 67–200 | API registry, Zod 4, global error, cache, idempotency, and provider ingress inheritance |
| Shard 00 BE | Persistence and middleware, lines 202–345 | RLS, grants, transaction, ETag, audit, idempotency, and outbox inheritance |
| Shard 00 BE | Async, errors, telemetry, recovery, lines 355–499 | Queue, provider reconciliation, failure, observability, migration, and tests |
| Architecture Design | API and security sections, lines 343–376 and 576–624 | Hono REST, acting context, authorization, privacy, and SLO constraints |
| Data Placement Strategy | Placement and PII sections, lines 5–55 and 95–148 | PostgreSQL ownership, restricted facts, and lifecycle boundaries |
| Engineering Standards | Quality, security, and recovery sections, lines 27–44 and 92–190 | Production, test, performance, and recovery floor |
| Installed stack skills | Hono, Cloudflare, Supabase data access, Vitest, API error handling; complete current `SKILL.md` files | Framework-specific middleware, RLS, queue, test, and error conventions |

## IA Source Map

| BE surface | IA source | Resolution |
|---|---|---|
| Goal creation and progress | AC/Interactions 42.01–42.02; Contracts lines 76–77 | Operations 42.01 and 42.02; `GoalDefinitionV1` and `GoalProgressV1` |
| Milestone derivation and sharing | AC/Interactions 42.03–42.04; Contract line 78 | Operations 42.03 and 42.04; `DerivedMilestoneV1` |
| Peer distribution | AC/Interaction 42.05; Contract line 79 | Operation 42.05; `PeerDistributionV1`; B2 fail-closed |
| Insurance observation/referral | AC/Interactions 42.06–42.08; Contracts lines 80–81 | Operations 42.06–42.08; `InsuranceNeedObservationV1` and `InsuranceReferralV1` |
| Sustainability exclusion | AC/Interaction 42.09; Overview lines 21 and 37 | Operation 42.09 returns a stable capability-not-offered resource and writes no domain row |
| Persistence | Data Models lines 89–95 and typed registry lines 99–111 | Nine exact canonical records with exhaustive SQL, indexes, RLS, and grants |
| Events | Event Schemas lines 147–158 | Six exact event types with typed minimal payloads |
| Failure and recovery | Contracts line 83; Edge Cases lines 160–190 | Source-unavailable, B2, provider-ambiguous, suppression, CAS, and invalidation behavior |

## Endpoint Completeness Reconciliation

| IA ID | Literal interaction | Registered operation | Disposition |
|---|---|---|---|
| 42.01 | Add goal template | `POST /api/v1/career/goals` | Authored |
| 42.02 | View goal progress | `GET /api/v1/career/goals/{goalId}/progress` | Authored |
| 42.03 | Derive milestone | `POST /api/v1/internal/career/milestone-derivations` | Authored protected command |
| 42.04 | Share milestone | `POST /api/v1/career/milestones/{milestoneId}/shares` | Authored |
| 42.05 | View peer distribution | `GET /api/v1/career/peer-distributions` | Authored B2-gated read |
| 42.06 | Detect insurance need | `POST /api/v1/career/insurance-needs` | Authored advisory command |
| 42.07 | Request insurance referral | `POST /api/v1/career/insurance-referrals` | Authored async command |
| 42.08 | Record provider response | `POST /api/v1/internal/career/insurance-referrals/{referralId}/provider-responses` | Authored protected command behind BE00 webhook ingress |
| 42.09 | Request wellbeing/sustainability score | `POST /api/v1/career/sustainability-score-requests` | Authored stable no-storage refusal |

No Shard 00 platform route is duplicated. External providers enter only through BE00 `POST /api/v1/webhooks/{provider}`; its verified consumer invokes operation 42.08. Jobs remain on the BE00 job route.

### Feature coverage

| Feature | Operations | Backend outcome |
|---|---|---|
| 23.05 Career Progression & Benchmarking | 42.01–42.05 | Composable goals, segregated progress, derived milestones, bounded sharing, and B2 distribution |
| 23.08 Point-of-Need Insurance | 42.06–42.08 | Advisory need, affirmative consent, minimum provider package, and external-status evidence |
| 23.09 Career Sustainability Signals | 42.09 | Stable exclusion with practical Shard 41 routes and no sensitive collection |

## Shared Contract Inheritance

Every route inherits BE00 request IDs, trace correlation, exact origin checking, strict media/body limits, authentication, acting-context resolution, authorization, CSRF for cookie mutations, Zod 4 validation, BOLA checks, rate headers, idempotency, strong ETags, PostgreSQL transaction rules, audit, outbox, safe logging, and recovery fencing.

- All failures use exactly `ApiError { code, message, requestId, details }`. Status is carried on the HTTP status line. `details` is an allowlisted `Record<string, JsonValue>` capped by BE00; stack, SQL, provider text, cohort dimensions, finance facts, and sensitive input never appear.
- All JSON objects are strict. Extra keys, including wellbeing or health free text, fail validation before authorization or storage.
- Mutable commands require `Idempotency-Key`, 8–128 printable ASCII bytes. The body `idempotencyKey` must exactly equal the header. Same actor, operation, path, normalized body, target, and key replays the committed safe response; different content returns 409 `IDEMPOTENCY_CONFLICT`.
- Updates require one strong decimal `If-Match` equal to `expectedVersion`. A missing required header is 400; malformed syntax is 400; a current-authorized stale version is 409.
- Authenticated and provider-status responses are `Cache-Control: no-store` unless the route registry explicitly names a private short cache. Public milestone projection bytes are produced by the publishing boundary, never by direct table access.
- Queue messages contain IDs, event type/schema version, aggregate version, correlation, and causation only. They exclude progress values, finance amounts, cohort criteria/membership, insurance fields, provider payloads, and wellbeing data.

## API Endpoints

### Authoritative Route Registry

This is the only route registry for this specification. The ID is the stable OpenAPI `operationId` and keys every downstream contract, error, middleware, observability, and test row.

| ID | Method and path | Request → success | Authorization and ownership | Concurrency and idempotency | Rate, cache, deadline, SLO | Middleware and CORS |
|---|---|---|---|---|---|---|
| 42.01 | `POST /api/v1/career/goals` | `AddGoalTemplateRequest` → 201 `AddGoalTemplateResponse` | Person owns target; entity actor needs `career.goal.manage` mandate | Key required; first create has no ETag, replace/supersede requires exact expected version | 20/min actor, 40/hour owner; no-store; 2s; Tier 2 | `BE00-CORS-WEB-CREDENTIALLED`; auth, CSRF, strict body, goal policy |
| 42.02 | `GET /api/v1/career/goals/{goalId}/progress` | `GoalProgressReadRequest` → 200 `GoalProgressV1` | Owner or entity mandate; all other targets concealed | Safe read; source revision pins result; no key or If-Match | 120/min actor; private max-age=30, ETag; 2s; Tier 1 | `BE00-CORS-WEB-CREDENTIALLED`; auth, strict path/query, owner RLS |
| 42.03 | `POST /api/v1/internal/career/milestone-derivations` | `DeriveMilestoneRequest` → 201/200 `DerivedMilestoneV1` | Registered Shard 40/41 rule worker only; owner resolved from source fact | Key required; unique fact/rule; duplicate returns original; source revision CAS | 600/min service and 30/min owner; no-store; 5s; protected-command SLO | `BE00-CORS-DENY`; mTLS/service JWT, strict body, producer allowlist |
| 42.04 | `POST /api/v1/career/milestones/{milestoneId}/shares` | `ShareMilestoneRequest` → 200 `MilestoneShareResponse` | Owner or entity `career.milestone.share` mandate; hard-private class denied | Key and exact milestone version required; share projection CAS | 20/min actor; no-store; 2s; Tier 2 | `BE00-CORS-WEB-CREDENTIALLED`; auth, CSRF, strict body, class policy |
| 42.05 | `GET /api/v1/career/peer-distributions` | `PeerDistributionRequest` → 200 `PeerDistributionV1` | Subject self or scoped entity analyst; B2 and role/context required | Safe read; query-family budget and policy/source versions pin result | 10/hour subject/query family; no-store; 2s; privacy SLO | `BE00-CORS-WEB-CREDENTIALLED`; auth, strict query, B2, anti-differencing |
| 42.06 | `POST /api/v1/career/insurance-needs` | `DetectInsuranceNeedRequest` → 201/200 `InsuranceNeedObservationV1` | Owner or named action-service principal; no provider access | Key required; unique owner/action/requirement/rule; suppression checked under lock | 30/min owner, one prompt/policy; no-store; 2s; Tier 2 | `BE00-CORS-WEB-CREDENTIALLED`; allowlisted browser preflight, while no-Origin service calls remain subject to service auth, strict body, producer allowlist, and suppression |
| 42.07 | `POST /api/v1/career/insurance-referrals` | `RequestInsuranceReferralRequest` → 202 `InsuranceReferralV1` | Owner only; recent step-up for finance attachment; affirmative consent | Key and need version required; local referral commits before provider work | 5/hour owner, 20/day/provider; no-store; 500ms acceptance; async SLO | `BE00-CORS-WEB-CREDENTIALLED`; auth, CSRF, strict body, consent allowlist |
| 42.08 | `POST /api/v1/internal/career/insurance-referrals/{referralId}/provider-responses` | `RecordProviderResponseRequest` → 200 `InsuranceReferralV1` | BE00 verified-webhook consumer or registered reconciler only | Key is provider event ID; exact referral version; duplicate digest replays | 120/min provider and consumer lease; no-store; 2s; protected-command SLO | `BE00-CORS-DENY`; service auth, receipt binding, strict body, CAS |
| 42.09 | `POST /api/v1/career/sustainability-score-requests` | `SustainabilityCapabilityRequest` → 200 `SustainabilityCapabilityResponse` | Any authenticated acting context; no owner target lookup | Key required for stable replay; no domain mutation or If-Match | 30/min actor; private max-age=300; 250ms; Tier 1 | `BE00-CORS-WEB-CREDENTIALLED`; auth, CSRF, strict allowlist, sensitive-key rejection |

### Operation Contract Matrix

| ID | Exact request contract | Exact success contract | Error contract |
|---|---|---|---|
| 42.01 | Strict `AddGoalTemplateRequest` body plus required idempotency header | Strict `AddGoalTemplateResponse`; one or more `GoalDefinitionV1` records | BE00 `ApiError { code, message, requestId, details }` |
| 42.02 | Strict UUID path and optional source-version query in `GoalProgressReadRequest` | Strict `GoalProgressV1` with segregated tier entries | BE00 `ApiError { code, message, requestId, details }` |
| 42.03 | Strict protected `DeriveMilestoneRequest` | Strict `DerivedMilestoneV1`; duplicate derivation is identical replay | BE00 `ApiError { code, message, requestId, details }` |
| 42.04 | Strict path plus `ShareMilestoneRequest` | Strict `MilestoneShareResponse` | BE00 `ApiError { code, message, requestId, details }` |
| 42.05 | Strict `PeerDistributionRequest` query | Strict available or suppressed `PeerDistributionV1` union | BE00 `ApiError { code, message, requestId, details }` |
| 42.06 | Strict `DetectInsuranceNeedRequest` | Strict `InsuranceNeedObservationV1`; possible gap remains nullable | BE00 `ApiError { code, message, requestId, details }` |
| 42.07 | Strict `RequestInsuranceReferralRequest` and consent list | Strict `InsuranceReferralV1` in requested/provider_pending state | BE00 `ApiError { code, message, requestId, details }` |
| 42.08 | Strict receipt-bound `RecordProviderResponseRequest` | Strict `InsuranceReferralV1`; ambiguous or failed provider response maps to unknown_reconciling | BE00 `ApiError { code, message, requestId, details }` |
| 42.09 | Strict `SustainabilityCapabilityRequest`; no free text | Strict `SustainabilityCapabilityResponse`; no persisted record | BE00 `ApiError { code, message, requestId, details }` |

## Request and Response Contracts — Zod 4

These schemas are authoritative for Hono validation, TypeScript inference, OpenAPI, database-boundary parsing, fixtures, and tests. Decimal and bigint values use strings to preserve PostgreSQL precision over JSON.

~~~ts
import { z } from "zod";

const UUID = z.uuid();
const Instant = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const Version = z.string().regex(/^[1-9][0-9]{0,18}$/);
const NonNegativeDecimal = z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/);
const SignedDecimal = z.string().regex(/^-?(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/);
const MoneyMinor = z.string().regex(/^(0|[1-9][0-9]{0,18})$/);
const Code = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_.-]*$/);
const ErrorCode = z.string().min(1).max(64).regex(/^[A-Z][A-Z0-9_]*$/);
const IdempotencyKey = z.string().min(8).max(128).regex(/^[ -~]+$/).refine(v => v.trim().length > 0);
const Currency = z.string().regex(/^[A-Z]{3}$/);
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> =
  z.lazy(() => z.union([JsonPrimitive, z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema)]));
export const ApiErrorSchema = z.object({
  code: ErrorCode,
  message: z.string().min(1).max(512),
  requestId: UUID,
  details: z.record(z.string(), JsonValueSchema).refine(v => Object.keys(v).length <= 16),
}).strict();

const TargetPredicate = z.object({
  metricCode: Code,
  comparator: z.enum(["gte", "lte", "eq"]),
  targetValue: SignedDecimal,
  unitCode: Code,
  windowCode: Code,
}).strict();
const Derivation = z.object({
  queryCode: Code,
  version: Version,
  ledgerDerived: z.boolean(),
}).strict();
const Cadence = z.enum(["on_source_change", "weekly", "monthly", "quarterly", "annual"]);
const GoalState = z.enum(["active", "paused", "unavailable", "retired"]);
const VisibilityClass = z.enum(["private", "entity"]);
const GoalOverride = z.object({
  targetPredicate: TargetPredicate.optional(),
  cadence: Cadence.optional(),
  visibilityClass: VisibilityClass.optional(),
}).strict();

export const GoalDefinitionV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  entityPartyId: UUID.nullable(),
  templateId: UUID,
  targetPredicate: TargetPredicate,
  derivation: Derivation,
  cadence: Cadence,
  visibilityClass: VisibilityClass,
  state: GoalState,
  version: Version,
  createdAt: Instant,
  updatedAt: Instant,
}).strict();

export const AddGoalTemplateRequest = z.object({
  actingPartyId: UUID,
  ownerPartyId: UUID,
  entityPartyId: UUID.nullable(),
  templateId: UUID,
  override: GoalOverride.optional(),
  expectedVersion: Version.optional(),
  idempotencyKey: IdempotencyKey,
}).strict();
export const AddGoalTemplateResponse = z.object({
  definitions: z.array(GoalDefinitionV1).min(1).max(16),
  bundleVersion: Version,
  createdAt: Instant,
}).strict();

const TrustTier = z.enum(["verified", "declared", "not_applicable"]);
const ProgressState = z.enum(["not_started", "in_progress", "achieved", "unknown", "unavailable"]);
const Integrity = z.enum(["complete", "incomplete", "revoked"]);
const Freshness = z.enum(["current", "stale"]);
const GoalProgressEntry = z.object({
  trustTier: TrustTier,
  value: SignedDecimal.nullable(),
  state: ProgressState,
  sourceRevision: Version,
  integrity: Integrity,
  freshness: Freshness,
  derivedAt: Instant,
}).strict();
export const GoalProgressReadRequest = z.object({
  goalId: UUID,
  sourceRevision: Version.optional(),
}).strict();
export const GoalProgressV1 = z.object({
  goalId: UUID,
  ownerPartyId: UUID,
  ledgerDerived: z.boolean(),
  entries: z.array(GoalProgressEntry).min(1).max(2),
  goalVersion: Version,
}).strict().superRefine((v, ctx) => {
  const tiers = new Set(v.entries.map(e => e.trustTier));
  if (v.ledgerDerived && (v.entries.length !== 2 || !tiers.has("verified") || !tiers.has("declared"))) {
    ctx.addIssue({ code: "custom", path: ["entries"], message: "ledger_goals_require_verified_and_declared" });
  }
  if (!v.ledgerDerived && (v.entries.length !== 1 || !tiers.has("not_applicable"))) {
    ctx.addIssue({ code: "custom", path: ["entries"], message: "non_ledger_goal_requires_not_applicable" });
  }
  for (const e of v.entries) {
    if (e.state === "achieved" && e.value === null) {
      ctx.addIssue({ code: "custom", path: ["entries"], message: "achieved_requires_value" });
    }
    if ((e.integrity !== "complete" || e.freshness !== "current") && e.state === "achieved") {
      ctx.addIssue({ code: "custom", path: ["entries"], message: "stale_or_incomplete_cannot_be_achieved" });
    }
  }
});

const MilestoneClass = z.enum(["career", "audience", "market", "financial_hard_private"]);
const MilestoneState = z.enum(["active", "invalidated"]);
const WordingScope = z.enum(["private_exact", "entity_bounded", "public_first_recorded_on_wejammin"]);
export const DeriveMilestoneRequest = z.object({
  ownerPartyId: UUID,
  entityPartyId: UUID.nullable(),
  factKey: Code,
  factRevision: Version,
  ruleCode: Code,
  ruleVersion: Version,
  milestoneClass: MilestoneClass,
  wordingScope: WordingScope,
  sourceEventId: UUID,
  idempotencyKey: IdempotencyKey,
}).strict();
export const DerivedMilestoneV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  entityPartyId: UUID.nullable(),
  factKey: Code,
  factRevision: Version,
  ruleCode: Code,
  ruleVersion: Version,
  milestoneClass: MilestoneClass,
  wordingScope: WordingScope,
  wording: z.string().min(1).max(280),
  visibilityClass: z.enum(["private", "entity", "public"]),
  state: MilestoneState,
  invalidatedReason: Code.nullable(),
  version: Version,
  createdAt: Instant,
  updatedAt: Instant,
}).strict();
export const ShareMilestoneRequest = z.object({
  milestoneId: UUID,
  audience: z.enum(["entity", "public"]),
  wordingScope: z.enum(["entity_bounded", "public_first_recorded_on_wejammin"]),
  expectedVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
export const MilestoneShareResponse = z.object({
  milestoneId: UUID,
  projectionId: UUID,
  audience: z.enum(["entity", "public"]),
  wording: z.string().min(1).max(280),
  state: z.enum(["published", "withdrawn"]),
  version: Version,
  publishedAt: Instant,
}).strict();

export const PeerDistributionRequest = z.object({
  subjectPartyId: UUID,
  roleCode: Code,
  stageCode: Code,
  shapeCode: Code,
  metricCode: Code,
  windowDays: z.coerce.number().int().min(30).max(1095),
  policyVersion: Version,
}).strict();
const AvailableDistribution = z.object({
  state: z.literal("available"),
  roleCode: Code,
  stageCode: Code,
  shapeCode: Code,
  metricCode: Code,
  percentiles: z.object({ p25: SignedDecimal, p50: SignedDecimal, p75: SignedDecimal }).strict(),
  sampleCount: z.number().int().positive(),
  subjectPercentile: z.number().min(0).max(100),
  caveats: z.array(Code).max(8),
  sourceRevision: Version,
  policyVersion: Version,
  derivedAt: Instant,
}).strict();
const SuppressedDistribution = z.object({
  state: z.literal("suppressed"),
  reasonCode: z.enum(["b2_disabled", "below_privacy_floor", "no_qualifying_data", "query_budget_exhausted"]),
  policyVersion: Version,
  retryAfter: Instant.nullable(),
}).strict();
export const PeerDistributionV1 = z.discriminatedUnion("state", [AvailableDistribution, SuppressedDistribution]);

const DeclaredPolicyAttributes = z.object({
  policyKind: Code.optional(),
  jurisdictionCode: z.string().regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/).optional(),
  effectiveOn: DateOnly.optional(),
  expiresOn: DateOnly.optional(),
  coverageLimitMinor: MoneyMinor.optional(),
  currency: Currency.optional(),
  providerConfirmed: z.boolean(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.coverageLimitMinor) !== Boolean(v.currency)) {
    ctx.addIssue({ code: "custom", path: ["currency"], message: "currency_and_limit_must_coexist" });
  }
});
export const DetectInsuranceNeedRequest = z.object({
  actingPartyId: UUID,
  ownerPartyId: UUID,
  underlyingActionType: z.enum(["booking", "venue_requirement", "gear_purchase", "finance_action"]),
  underlyingActionId: UUID,
  underlyingActionRevision: Version,
  requirementCode: Code,
  declaredPolicyAttributes: DeclaredPolicyAttributes,
  ruleVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
export const InsuranceNeedObservationV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  underlyingActionType: Code,
  underlyingActionId: UUID,
  underlyingActionRevision: Version,
  requirementCode: Code,
  confidence: z.number().min(0).max(1),
  possibleGap: z.boolean().nullable(),
  sourceCode: Code,
  suppressionClass: Code,
  state: z.enum(["observed", "prompted", "suppressed", "expired"]),
  promptAllowed: z.boolean(),
  version: Version,
  createdAt: Instant,
}).strict();

const DisclosedField = z.enum([
  "owner_display_name", "contact_route", "requirement_code", "action_date",
  "jurisdiction_code", "declared_policy_kind", "declared_expiry", "declared_limit"
]);
export const RequestInsuranceReferralRequest = z.object({
  actingPartyId: UUID,
  needObservationId: UUID,
  providerCode: Code,
  consentVersion: Version,
  disclosedFields: z.array(DisclosedField).min(1).max(8),
  providerTermsVersion: Version,
  expectedVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
const ReferralStatus = z.enum([
  "requested", "provider_pending", "acknowledged", "declined",
  "unknown_reconciling", "withdrawn", "failed"
]);
export const InsuranceReferralV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  needObservationId: UUID,
  providerCode: Code,
  consentVersion: Version,
  disclosedFields: z.array(DisclosedField).min(1).max(8),
  providerTermsVersion: Version,
  requestedAt: Instant,
  status: ReferralStatus,
  externalReferenceDigest: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  version: Version,
  updatedAt: Instant,
}).strict();
export const RecordProviderResponseRequest = z.object({
  referralId: UUID,
  providerCode: Code,
  providerEventId: z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  receiptId: UUID,
  response: z.enum(["acknowledged", "declined", "failed", "ambiguous"]),
  externalReference: z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/).optional(),
  occurredAt: Instant,
  expectedVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();

export const SustainabilityCapabilityRequest = z.object({
  context: z.enum(["career_planning", "workload", "runway"]),
  idempotencyKey: IdempotencyKey,
}).strict();
export const SustainabilityCapabilityResponse = z.object({
  status: z.literal("not_offered"),
  code: z.literal("SUSTAINABILITY_SCORE_NOT_OFFERED"),
  message: z.string().min(1).max(280),
  alternatives: z.array(z.object({
    rel: z.enum(["workload_facts", "runway_planning"]),
    href: z.enum(["/api/v1/workload-facts", "/api/v1/career-finance/runway"]),
    label: z.string().min(1).max(80),
  }).strict()).length(2),
  stored: z.literal(false),
}).strict();
~~~

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 42.02 | Pagination N/A: this GET returns one goal-progress projection; strict `GoalProgressReadRequest` parsing rejects cursor, offset, page, limit, sort, and filter keys. | `entries` has 1–2 items: exactly two (`verified`, `declared`) for ledger-derived goals and exactly one (`not_applicable`) otherwise; entries contain no nested collections. |
| 42.05 | Pagination N/A: this GET returns one available-or-suppressed peer-distribution projection, not cohort members; strict `PeerDistributionRequest` rejects pagination keys. | The available branch has `caveats` capped at 8 codes; the suppressed branch and every other returned field have no collections. |

### Cross-field and header rules

| ID | Deterministic validation | Failure |
|---|---|---|
| 42.01 | Template is active; derivation query/version is registered; override can narrow only target, cadence, visibility; body/header keys equal; entity target requires mandate | 422 `DERIVATION_UNSUPPORTED`, 403 `OWNER_FORBIDDEN`, 409 `IDEMPOTENCY_CONFLICT` |
| 42.02 | UUID and optional source revision parse; ledger-derived response has exactly verified and declared entries; neither entry can be achieved when stale/incomplete | 400 `INVALID_REQUEST`; invariant failure is 500 and emits severity-one signal |
| 42.03 | Producer, fact type, source event, source revision, rule/version, class, and wording registry agree; financial class forces private | 422 `FACT_NOT_QUALIFYING` or `RULE_VERSION_UNSUPPORTED` |
| 42.04 | Path/body milestone IDs match; hard-private class rejects public/entity share; wording registry controls text; header/body version and key match | 422 `HARD_PRIVATE`, 409 `VERSION_MISMATCH` |
| 42.05 | B2 checked before cohort work; dimensions are exact allowlisted codes; window 30–1095; query-family budget checked before count | 403 `B2_DISABLED`, 422 `COHORT_QUERY_INVALID`, 429 `QUERY_BUDGET_EXCEEDED` |
| 42.06 | Venue requirement wins over gear context; dates are coherent; limit/currency coexist; suppression checked before prompt | 422 `REQUIREMENT_UNSUPPORTED` or `POLICY_FACTS_INVALID` |
| 42.07 | Need is visible/current; consent and provider terms are current; disclosed fields are provider/purpose allowlisted; finance field requires step-up | 422 `CONSENT_REQUIRED` or `FIELD_NOT_ALLOWLISTED`; 409 `TERMS_VERSION_STALE` |
| 42.08 | BE00 receipt is verified and bound to provider/event digest; provider matches referral; ambiguous/failed never implies coverage rejection | 401 `PROVIDER_SIGNATURE_INVALID`, 409 `PROVIDER_MISMATCH` |
| 42.09 | Only context and key accepted; any health, mood, wellbeing, burnout, diagnosis, or free-text key is rejected before logging | 400 `SENSITIVE_INPUT_FORBIDDEN` |

### Contract examples

| ID | Valid request | Success |
|---|---|---|
| 42.01 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","ownerPartyId":"018f0000-0000-7000-8000-000000000001","entityPartyId":null,"templateId":"018f0000-0000-7000-8000-000000000010","idempotencyKey":"goal-20260828-01"}` | 201 with one or more strict `GoalDefinitionV1` records |
| 42.02 | `goalId=018f0000-0000-7000-8000-000000000020` | 200 with two entries, `verified` and `declared`, for ledger goals |
| 42.03 | `{"ownerPartyId":"018f0000-0000-7000-8000-000000000001","entityPartyId":null,"factKey":"income.first_verified","factRevision":"7","ruleCode":"career.first_recorded","ruleVersion":"2","milestoneClass":"financial_hard_private","wordingScope":"private_exact","sourceEventId":"018f0000-0000-7000-8000-000000000030","idempotencyKey":"milestone-derive-7"}` | 201 private `DerivedMilestoneV1` |
| 42.04 | `{"milestoneId":"018f0000-0000-7000-8000-000000000031","audience":"public","wordingScope":"public_first_recorded_on_wejammin","expectedVersion":"1","idempotencyKey":"milestone-share-1"}` | 200 bounded `MilestoneShareResponse` |
| 42.05 | `roleCode=producer&stageCode=emerging&shapeCode=solo&metricCode=verified_income&windowDays=365&policyVersion=3` | 200 available distribution or suppressed union without membership |
| 42.06 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","ownerPartyId":"018f0000-0000-7000-8000-000000000001","underlyingActionType":"venue_requirement","underlyingActionId":"018f0000-0000-7000-8000-000000000040","underlyingActionRevision":"4","requirementCode":"public_liability","declaredPolicyAttributes":{"providerConfirmed":false},"ruleVersion":"2","idempotencyKey":"need-observation-4"}` | 201 observation with nullable `possibleGap` |
| 42.07 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","needObservationId":"018f0000-0000-7000-8000-000000000041","providerCode":"broker_alpha","consentVersion":"5","disclosedFields":["contact_route","requirement_code"],"providerTermsVersion":"8","expectedVersion":"1","idempotencyKey":"referral-request-1"}` | 202 `InsuranceReferralV1` in `provider_pending` |
| 42.08 | `{"referralId":"018f0000-0000-7000-8000-000000000042","providerCode":"broker_alpha","providerEventId":"evt_8291","receiptId":"018f0000-0000-7000-8000-000000000043","response":"ambiguous","occurredAt":"2026-08-28T12:00:00Z","expectedVersion":"2","idempotencyKey":"evt_8291"}` | 200 referral in `unknown_reconciling` |
| 42.09 | `{"context":"runway","idempotencyKey":"sustainability-route-1"}` | 200 `not_offered` with exactly two practical routes and `stored:false` |

## Authorization, Ownership, and Disclosure

### Role by operation

| Actor | 42.01 | 42.02 | 42.03 | 42.04 | 42.05 | 42.06 | 42.07 | 42.08 | 42.09 |
|---|---|---|---|---|---|---|---|---|---|
| Person or multi-hyphenate | Own goals | Own progress | Deny | Own share if class permits | Own gated cohort | Own need | Own referral | Deny | Allow |
| Entity actor | Mandated entity goal | Mandated entity progress | Deny | Mandated entity share | Scoped entity subject | Named action under mandate | Deny personal referral | Deny | Allow |
| Insurance provider | Deny | Deny | Deny | Deny | Deny | Deny | Deny direct browse | Deny direct; use BE00 webhook | Deny |
| Support | Case grant only | Case grant only | Deny | Mechanical unshare only | Deny | Case grant only | Case grant only | Deny | Allow |
| Administrator | Template policy under dual control | Deny owner data | Deny | Deny | Policy only; no B2 bypass | Trigger policy only | Provider policy only | Reconcile grant only | Allow |
| Service principal | Registered template worker only | Registered derivation read | Registered producer only | Projection worker only | B2 cohort worker only | Named action producer | Referral dispatcher only | Verified receipt/reconciler only | Deny |

### 403 versus 404 policy

- 401 means no valid session or protected service principal.
- 404 conceals a target that is absent or outside the caller's owner/entity/purpose projection. Operations 42.02, 42.04, 42.07, and 42.08 return the same 404 shape for nonexistent and concealed IDs.
- 403 is used only after the target is legitimately visible: missing entity mandate, disallowed share class, closed B2 gate, missing step-up, unsupported support grant, or prohibited operation capability.
- 42.05 returns 403 `B2_DISABLED` before cohort computation. A permitted query whose cohort is below the floor returns the 200 suppressed union without `n`, percentiles, position, or widened criteria.
- 42.06 suppression is not an authorization error. It returns an observation with `state=suppressed` and `promptAllowed=false`; the underlying action continues.
- 42.09 performs no owner-resource lookup, so it has no target-existence branch.

### Security and privacy invariants

- Financial milestones are `financial_hard_private` and cannot enter any generic sharing projection.
- Goal progress never stores or returns a cross-tier total. Verified and declared values cannot be summed, averaged, or rendered as one completion state.
- Peer distribution uses verified income only, enforces privacy before count/rank, disallows export, stores no member IDs, and has no administrator bypass.
- Insurance packages store only field names and consent evidence. Provider payload values are materialized transiently by the dispatcher, sent once under provider idempotency, and never logged or placed on Queue.
- Provider commission disclosures are configuration/public-policy data and cannot affect provider ordering, need detection, eligibility, or response state.
- Support reads require an expiring case ID, purpose code, actor, target, field allowlist, and audit event; support cannot override suppression.
- Every SQL function is `SECURITY DEFINER` only when required, pins `search_path`, re-resolves actor and target, and is executable only by its named API/worker role.

## Database Schema

All canonical records live in PostgreSQL. BE00 `IdempotencyRecord`, `AuditEvent`, `OutboxEvent`, `ProviderOperation`, and `WebhookReceipt` are inherited and are not duplicated.

### Canonical model registry

| Exact IA model | Physical table | Owner |
|---|---|---|
| `goal_template` | `career_private.goal_templates` | Shard 42 configuration |
| `goal_definition` | `career_private.goal_definitions` | Shard 42 |
| `goal_progress_projection` | `career_private.goal_progress_projections` | Shard 42 disposable projection |
| `derived_milestone` | `career_private.derived_milestones` | Shard 42 |
| `cohort_definition` | `career_private.cohort_definitions` | Shard 42 B2 configuration |
| `peer_distribution` | `career_private.peer_distributions` | Shard 42 ephemeral aggregate |
| `insurance_need_observation` | `career_private.insurance_need_observations` | Shard 42 restricted |
| `insurance_referral` | `career_private.insurance_referrals` | Shard 42 restricted |
| `insurance_prompt_suppression` | `career_private.insurance_prompt_suppressions` | Shard 42 restricted |

No wellbeing, health, self-report, inference, burnout, or sustainability-score table exists.

### Exhaustive typed table definitions

- `career_private.goal_templates`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `bundle_code text NOT NULL CHECK (bundle_code ~ '^[a-z][a-z0-9_.-]{0,63}$')`; `target_predicate jsonb NOT NULL CHECK (jsonb_typeof(target_predicate)='object')` parsed by `TargetPredicate`; `derivation_query_code text NOT NULL CHECK (derivation_query_code <> '')`; `derivation_version bigint NOT NULL CHECK (derivation_version > 0)`; `ledger_derived boolean NOT NULL`; `cadence text NOT NULL CHECK (cadence IN ('on_source_change','weekly','monthly','quarterly','annual'))`; `visibility_class text NOT NULL CHECK (visibility_class IN ('private','entity'))`; `state text NOT NULL CHECK (state IN ('active','superseded','retired'))`; `version bigint NOT NULL CHECK (version > 0)`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`. There is deliberately no archetype/persona field.
- `career_private.goal_definitions`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `entity_id uuid NULL REFERENCES platform_private.party(id)`; `template_id uuid NOT NULL REFERENCES career_private.goal_templates(id)`; `target_predicate jsonb NOT NULL CHECK (jsonb_typeof(target_predicate)='object')` parsed by `TargetPredicate`; `derivation_query_code text NOT NULL`; `derivation_version bigint NOT NULL CHECK (derivation_version > 0)`; `ledger_derived boolean NOT NULL`; `cadence text NOT NULL CHECK (cadence IN ('on_source_change','weekly','monthly','quarterly','annual'))`; `visibility_class text NOT NULL CHECK (visibility_class IN ('private','entity'))`; `state text NOT NULL CHECK (state IN ('active','paused','unavailable','retired'))`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `career_private.goal_progress_projections`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `goal_id uuid NOT NULL REFERENCES career_private.goal_definitions(id) ON DELETE CASCADE`; `trust_tier text NOT NULL CHECK (trust_tier IN ('verified','declared','not_applicable'))`; `value_numeric numeric(20,6) NULL`; `state text NOT NULL CHECK (state IN ('not_started','in_progress','achieved','unknown','unavailable'))`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `integrity text NOT NULL CHECK (integrity IN ('complete','incomplete','revoked'))`; `freshness text NOT NULL CHECK (freshness IN ('current','stale'))`; `derived_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK (state <> 'achieved' OR (value_numeric IS NOT NULL AND integrity='complete' AND freshness='current'))`. No cross-tier total column exists.
- `career_private.derived_milestones`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `entity_id uuid NULL REFERENCES platform_private.party(id)`; `fact_key text NOT NULL CHECK (fact_key <> '')`; `fact_revision bigint NOT NULL CHECK (fact_revision > 0)`; `rule_code text NOT NULL CHECK (rule_code <> '')`; `rule_version bigint NOT NULL CHECK (rule_version > 0)`; `source_event_id uuid NOT NULL REFERENCES platform_private.outbox_events(id)`; the referenced event must be from the registered Shard 40/41 producer; `milestone_class text NOT NULL CHECK (milestone_class IN ('career','audience','market','financial_hard_private'))`; `wording_scope text NOT NULL CHECK (wording_scope IN ('private_exact','entity_bounded','public_first_recorded_on_wejammin'))`; `wording text NOT NULL CHECK (length(wording) BETWEEN 1 AND 280)`; `visibility_class text NOT NULL CHECK (visibility_class IN ('private','entity','public'))`; `state text NOT NULL CHECK (state IN ('active','invalidated'))`; `invalidated_reason text NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK (milestone_class <> 'financial_hard_private' OR visibility_class='private')`.
- `career_private.cohort_definitions`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for the platform policy owner; `role_code text NOT NULL`; `stage_criteria jsonb NOT NULL CHECK (jsonb_typeof(stage_criteria)='object')`; `shape_criteria jsonb NOT NULL CHECK (jsonb_typeof(shape_criteria)='object')`; `metric_code text NOT NULL CHECK (metric_code='verified_income')`; `window_days integer NOT NULL CHECK (window_days BETWEEN 30 AND 1095)`; `privacy_floor integer NOT NULL CHECK (privacy_floor >= 20)`; `b2_policy_version bigint NOT NULL CHECK (b2_policy_version > 0)`; `state text NOT NULL CHECK (state IN ('disabled','active','retired'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `career_private.peer_distributions`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for the subject; `cohort_definition_id uuid NOT NULL REFERENCES career_private.cohort_definitions(id)`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `percentiles jsonb NOT NULL CHECK (jsonb_typeof(percentiles)='object')` parsed by the p25/p50/p75 schema; `sample_count integer NOT NULL CHECK (sample_count >= 20)`; `subject_percentile numeric(6,3) NOT NULL CHECK (subject_percentile BETWEEN 0 AND 100)`; `caveat_codes text[] NOT NULL CHECK (cardinality(caveat_codes) <= 8)`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `state text NOT NULL CHECK (state IN ('available','suppressed','expired'))`; `expires_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`. No member/list/named-peer field exists.
- `career_private.insurance_need_observations`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `underlying_action_type text NOT NULL CHECK (underlying_action_type IN ('booking','venue_requirement','gear_purchase','finance_action'))`; `underlying_action_id uuid NOT NULL` with logical FK to the registered producer type; `underlying_action_revision bigint NOT NULL CHECK (underlying_action_revision > 0)`; `requirement_code text NOT NULL`; `declared_policy_attributes jsonb NOT NULL CHECK (jsonb_typeof(declared_policy_attributes)='object')` parsed by `DeclaredPolicyAttributes`; `rule_version bigint NOT NULL CHECK (rule_version > 0)`; `confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1)`; `possible_gap boolean NULL`; `source_code text NOT NULL`; `suppression_class text NOT NULL`; `state text NOT NULL CHECK (state IN ('observed','prompted','suppressed','expired'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `career_private.insurance_referrals`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `need_observation_id uuid NOT NULL REFERENCES career_private.insurance_need_observations(id)`; `provider_code text NOT NULL CHECK (provider_code <> '')` checked against the BE00 provider registry; `consent_version bigint NOT NULL CHECK (consent_version > 0)`; `disclosed_fields text[] NOT NULL CHECK (cardinality(disclosed_fields) BETWEEN 1 AND 8)`; `provider_terms_version bigint NOT NULL CHECK (provider_terms_version > 0)`; `requested_at timestamptz NOT NULL`; `status text NOT NULL CHECK (status IN ('requested','provider_pending','acknowledged','declined','unknown_reconciling','withdrawn','failed'))`; `external_reference_digest bytea NULL CHECK (external_reference_digest IS NULL OR octet_length(external_reference_digest)=32)`; `last_provider_at timestamptz NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`. No underwriting, premium, risk, coverage, policy document, or provider payload field exists.
- `career_private.insurance_prompt_suppressions`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `provider_code text NULL` checked against the BE00 registry when present; `need_class text NOT NULL CHECK (need_class <> '')`; `rule_version bigint NOT NULL CHECK (rule_version > 0)`; `effective_from timestamptz NOT NULL`; `effective_until timestamptz NULL CHECK (effective_until IS NULL OR effective_until > effective_from)`; `state text NOT NULL CHECK (state IN ('active','expired','revoked'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.

The `underlying_action_type` registry makes `underlying_action_id` a typed logical FK: `booking` and `venue_requirement` resolve through the Shard 30 action port, `gear_purchase` through the Shard 26 purchase port, and `finance_action` through the Shard 41 finance-action port. The creating RPC verifies producer existence, owner, revision, and type before insert; delete/revoke events invalidate the observation.

### Indexes, constraints, RLS, and grants

| Table | Required indexes and uniqueness | RLS predicate and grants |
|---|---|---|
| `goal_templates` | Unique `(bundle_code, version)`; partial unique active bundle; `(owner_id, state)`; checksum index | Active reads only through `career.list_goal_templates`; config-admin dual-control RPC writes; revoke all direct `anon`/`authenticated` DML |
| `goal_definitions` | `(owner_id, state, updated_at DESC)`; `(entity_id, state)`; unique active `(owner_id, template_id, derivation_query_code)` | Owner or `career.goal.manage` mandate; API role executes RPC only; worker may select named ID; no delete, only retire/tombstone RPC |
| `goal_progress_projections` | Unique `(goal_id, trust_tier)`; `(owner_id, updated_at DESC)`; `(freshness, derived_at)` | Owner/entity progress predicate; derivation worker upserts by source revision; direct writes denied; source revoke may delete projection through invalidation RPC |
| `derived_milestones` | Unique `(owner_id, COALESCE(entity_id, owner_id), fact_key, rule_code, rule_version)`; `(owner_id, state, created_at DESC)`; `(source_event_id)` | Owner/entity mandate reads; registered producer inserts; share RPC applies class rule; no update except active→invalidated and no delete |
| `cohort_definitions` | Unique active query family `(role_code, metric_code, window_days, b2_policy_version)`; `(state, version)` | B2 worker/config-admin only; no subject or support direct access; policy activation under dual control |
| `peer_distributions` | Unique `(owner_id, cohort_definition_id, source_revision, policy_version)`; `(expires_at)` | Subject read through gate-checking RPC; B2 worker insert/delete; admin/support denied; TTL sweep only; no export grant |
| `insurance_need_observations` | Unique `(owner_id, underlying_action_type, underlying_action_id, requirement_code, rule_version)`; `(owner_id, state, created_at DESC)` | Owner/named action producer; support requires purpose grant; providers denied; write only through observation/suppression RPC |
| `insurance_referrals` | `(owner_id, requested_at DESC)`; `(provider_code, status, updated_at)`; unique nonnull `external_reference_digest` | Owner reads; dispatcher/reconciler sees named referral; support case grant; provider cannot browse; mutation RPC only |
| `insurance_prompt_suppressions` | Unique active `(owner_id, COALESCE(provider_code, ''), need_class, rule_version)`; `(owner_id, effective_until)` | Owner manages; observation RPC must honor; support/admin cannot override; direct DML denied |

All schemas revoke `CREATE` from application roles and `ALL` from `PUBLIC`, `anon`, and `authenticated`. Named `career_api`, `career_worker`, `career_provider_reconciler`, and `career_retention` roles receive only `EXECUTE` on explicit functions plus narrowly required table access. Migration role owns DDL and never serves requests.

### Retention and deletion

- Goal definitions retire on owner deletion; protected audit remains under BE00. Progress projections are disposable and expire 30 days after last source update or immediately on authority revocation.
- Derived milestones are append-only; invalidation preserves fact/rule/version evidence while public/entity projections purge immediately. Owner deletion replaces display wording with a tombstone where audit retention requires it.
- Peer distributions expire after 24 hours; cohort membership exists only in transaction/work memory and is never written or queued.
- Insurance need observations and referral metadata expire 730 days after terminal state unless a shorter provider/purpose policy applies. Disclosed values and provider response bodies are never stored. BE00 consent/audit retention remains separately governed.
- Active suppression rows remain until their explicit effective end or owner revocation; equivalent prompts cannot bypass them through a new action ID.
- Legal hold can delay destruction but cannot widen RLS, restore a prompt, publish a financial milestone, or create a wellbeing record.

## State Machines and Invariants

| Aggregate | Allowed transitions | Forbidden behavior |
|---|---|---|
| Goal definition | `active ↔ paused`; `active/paused → unavailable → active` after source recovery; any non-retired state → `retired` | Manual completion of derived metrics; unsupported query; archetype lock |
| Goal progress | `not_started → in_progress → achieved`; source failure yields `unknown` or `unavailable`; recomputation may restore | Achieved with stale/incomplete/revoked source; cross-tier combined state |
| Derived milestone | `active → invalidated` only | In-place fact/rule/wording mutation; financial share; duplicate fact/rule |
| Peer distribution | `available → suppressed/expired`; fresh query may create a new version | Criteria widening, named peer, export, reusable membership |
| Insurance need | `observed → prompted/suppressed → expired` | Definitive coverage verdict; underlying-action block; suppression bypass |
| Insurance referral | `requested → provider_pending → acknowledged/declined/unknown_reconciling/failed`; `unknown_reconciling → acknowledged/declined/failed`; nonterminal → withdrawn | Eligibility/premium/underwriting state; blind resend after ambiguous effect |
| Prompt suppression | `active → expired/revoked` | Support/admin override or automatic re-prompt under same policy |
| Sustainability request | Stateless `not_offered` response | Sensitive collection, profile, inference, score, or async work |

Additional invariants:

1. Ledger goals persist exactly one `verified` and one `declared` projection row per source revision. Missing qualifying rows yield zero for that tier.
2. Non-ledger goals persist one `not_applicable` row.
3. Tier is independent of integrity/freshness. Reclassification in Shard 41 re-derives both rows against the new revision.
4. `public_first_recorded_on_wejammin` is the only public “first” wording.
5. Venue requirements outrank gear context when one action produces competing insurance rules.
6. Only provider-confirmed structured response can alter referral external status; it still cannot create a platform coverage verdict.
7. B2 closure, privacy-floor failure, or anti-differencing limit fails closed without broader criteria.

## Middleware and Policies

Ordered Hono middleware for each operation:

1. BE00 request ID, trace, restore-epoch fence, and secure response headers.
2. Named CORS policy and exact-origin/preflight evaluation before authentication.
3. Method, content type, 256 KiB command body, URL, and query-shape gates.
4. Route/actor/query-family/provider token bucket; 429 includes safe retry metadata.
5. Session or protected service authentication; operation 42.08 also binds verified BE00 receipt.
6. Acting-party resolution and recent step-up where required.
7. CSRF for credentialed browser mutations; internal deny-CORS operations reject browser authority.
8. Strict Zod 4 parsing and sensitive-key rejection.
9. Owner/entity/purpose authorization, BOLA concealment, B2 or suppression policy.
10. Idempotency reservation and exact ETag/CAS for commands.
11. One domain RPC transaction for canonical state, audit, idempotency result, provider operation/job when applicable, and outbox.
12. Safe response parse, cache header, audit completion, metrics, and scrubbed error capture.

| ID | Validation policy | Authorization policy | Rate policy | CORS policy |
|---|---|---|---|---|
| 42.01 | Strict body plus template/derivation registry | `career.goal.manage` | `career-goal-write` | `BE00-CORS-WEB-CREDENTIALLED` |
| 42.02 | UUID/source-revision query | Owner/entity progress RLS | `career-goal-read` | `BE00-CORS-WEB-CREDENTIALLED` |
| 42.03 | Producer/fact/rule schema | `career.milestone.derive` service capability | `career-derive-service` | `BE00-CORS-DENY` |
| 42.04 | Path/body/version/class | `career.milestone.share` | `career-share-write` | `BE00-CORS-WEB-CREDENTIALLED` |
| 42.05 | Allowlisted dimensions/window | B2 plus subject/context | `career-cohort-family` | `BE00-CORS-WEB-CREDENTIALLED` |
| 42.06 | Structured action/policy only | Owner or named action producer | `insurance-need-write` | Browser credentialled or internal deny-CORS branch |
| 42.07 | Consent/field/provider terms | Owner plus step-up when required | `insurance-referral-write` | `BE00-CORS-WEB-CREDENTIALLED` |
| 42.08 | Receipt/provider/event/version | Verified webhook consumer/reconciler | `insurance-provider-response` | `BE00-CORS-DENY` |
| 42.09 | Context/key only; sensitive-key denylist | Any authenticated actor | `career-capability-read` | `BE00-CORS-WEB-CREDENTIALLED` |

## Data Flow, Concurrency, and External Seams

### Operation flows

- **42.01** resolves actor/owner/mandate, loads an active template and registered derivation, validates overrides, locks the active owner/template tuple, inserts definitions, audit, idempotency result, and `career.goal.created.v1` outbox rows atomically.
- **42.02** authorizes the goal, reads its exact source revision through Shard 40/41, derives per-tier entries, upserts the disposable projection by `(goal, tier, sourceRevision)`, parses the response, and returns ETag. Source failure returns a valid unknown/unavailable projection, never achieved.
- **42.03** validates the protected producer, source event, fact, rule, and revision; unique insertion makes duplicate derivation an identical replay. Source revocation appends `career.milestone.invalidated.v1` and purges sharing projections.
- **42.04** locks milestone/version, enforces the hard-private rule before projection, selects wording from the versioned registry, writes audit/outbox, and returns only bounded wording.
- **42.05** checks B2 and query-family budget before obtaining cohort data. Privacy floor is evaluated before rank/percentiles. Below floor returns suppressed and stores no membership.
- **42.06** resolves the underlying action through its owner port, gives venue requirement precedence, checks active suppression, compares structured facts, and records an advisory observation. It never mutates or blocks the source action.
- **42.07** verifies consent, disclosure allowlist, terms, and step-up; commits referral, BE00 ProviderOperation, audit, idempotency result, and outbox; returns 202 before provider transmission.
- **42.08** consumes a verified BE00 receipt, locks referral/version, deduplicates provider event/digest, maps acknowledged/declined to factual external status and ambiguous/failed to `unknown_reconciling`, then emits `career.insurance_referral.changed.v1`.
- **42.09** validates the tiny request, records only the BE00 idempotency result and ordinary access telemetry, returns the versioned capability resource, and creates no Shard 42 domain, audit-sensitive, queue, or provider record.

### External integration seams

| Seam | Exact request → response | Timeout and retry | Circuit and failure behavior |
|---|---|---|---|
| Shard 41 `GetGoalFactsV1` | `{ownerPartyId, queryCode, queryVersion, sourceRevision?}` → `{revision, entries:[{trustTier,value decimal or null,integrity,freshness,occurredAt}]}` | 1500ms; 2 safe reads at 100ms and 300ms jittered backoff | Open after 5 retryable failures/30s for 30s; return unknown/unavailable entries, never achieved |
| Shard 40 `ComputePeerDistributionV1` | `{subjectPartyId,roleCode,stageCode,shapeCode,metricCode,windowDays,policyVersion}` → available aggregate or suppressed reason | 2000ms; 2 safe reads at 200ms and 600ms | Open after 5 failures/30s for 30s; 503 `COHORT_UNAVAILABLE`; no last-value leak, widening, or export |
| Shard 00 settings/B2 port | `{settingCodes,expectedVersions}` → `{values,versions,enabled}` | 500ms; 2 reads at 50ms and 150ms | Open after 5 failures/30s for 30s; writes and cohort reads fail closed |
| BE00 PostgreSQL RPC | `{operationId,requestContext,normalizedInput,inputDigest,expectedVersion?}` → `{resourceIds,versions,outboxIds,replayed}` | 1500ms; 3 transaction-safe retries at 25ms, 75ms, 200ms only for serialization/deadlock | Open after 5 connectivity failures/30s for 30s; no commit means no success/effect |
| Cloudflare Queue `career-domain-v1` | `{eventId,eventType,schemaVersion,aggregateId,aggregateVersion,correlationId,causationId}` → binding acknowledgement | 1,000 ms dispatch deadline; 4 total attempts with full-jitter caps 250ms/1s/4s; retry timeout, connection reset, 408/429/5xx; terminal binding/auth/schema/digest and non-429 4xx; consumer has 8 attempts with full-jitter caps 1s/5s/30s/2m/10m/15m/15m | Dispatcher and consumer circuits each open after 5 retryable failures/30s for 30s, admit one half-open probe, close after two successes, and reopen on failure; dispatch exhaustion leaves committed outbox for 60s sweeper; consumer attempt 8 DLQs/alerts and preserves last verified state |
| Insurance provider adapter | `{referralId,providerCode,consentVersion,providerTermsVersion,disclosedFields,disclosureValues,requestedAt,idempotencyKey}` where value keys equal the consented field list → `{accepted boolean,providerReference optional string,responseClass acknowledged or declined or ambiguous}` | 5000ms; 3 pre-send-safe attempts at 1s, 5s, 25s | Open after 5 failures/60s for 60s; ambiguous send stays `unknown_reconciling` and reconciles by webhook/poll; never blind resend |
| BE00 webhook bridge | Verified `{receiptId,providerCode,externalEventId,payloadDigest}` → protected 42.08 receipt-bound command | Webhook ack <=1000ms; domain consumer 3 retries at 250ms, 1s, 4s | BE00 signature/replay circuit; invalid receipt creates no 42.08 work; different digest routes manual review |

Retries stop at the operation deadline. Business validation, authorization, stale version, B2 denial, privacy-floor suppression, and provider-declared outcomes are never retried automatically.

### Exact retryability and circuit closure

Attempt totals include the initial attempt. Each listed delay is a full-jitter cap chosen uniformly from zero through that cap. Unless a row says otherwise, a half-open circuit admits one probe at a time, closes after two consecutive successful probes, and reopens for the full interval after a retryable probe failure.

| Seam | Exact attempts and retry classification | Circuit open, half-open, and fallback |
|---|---|---|
| Shard 41 GetGoalFactsV1 | 1,500 ms per attempt; 3 attempts total; retry caps 100 ms then 300 ms. Retry timeout, connection reset, 408, 429, and 5xx; invalid owner/query/version, auth denial, response-schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open facts probe. Fallback returns unknown/unavailable entries and never achieved. |
| Shard 40 ComputePeerDistributionV1 | 2,000 ms per attempt; 3 attempts total; retry caps 200 ms then 600 ms. Retry timeout, connection reset, 408, 429, and 5xx; invalid dimensions/window, B2/privacy denial, query-budget denial, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open distribution probe. Fallback is 503 COHORT_UNAVAILABLE with no last-value leak, cohort widening, member export, or alternate-query retry. |
| Shard 00 settings/B2 port | 500 ms per attempt; 3 attempts total; retry caps 50 ms then 150 ms. Retry timeout, connection reset, 408, 429, and 5xx; disabled setting, version mismatch, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open settings probe. Writes and cohort reads fail closed without stale-policy fallback. |
| BE00 PostgreSQL RPC | 1,500 ms per transaction attempt; 4 attempts total; retry caps 25 ms, 75 ms, and 200 ms only for SQLSTATE 40001 or 40P01. Validation, authorization/RLS, constraint, idempotency-digest, and all other SQL failures are terminal. | Open after 5 connectivity failures in 30 s for 30 s; one half-open read-only health probe precedes one RPC. Fallback is no commit/no success; later queue failure cannot roll back a committed outbox row. |
| Cloudflare Queue career-domain-v1 | 1,000 ms dispatch deadline; 4 dispatch attempts total; retry caps 250 ms, 1 s, and 4 s. Retry timeout, connection reset, 408, 429, and 5xx; invalid binding/auth/schema/digest and non-429 4xx are terminal and alert. Consumer work has 8 attempts with caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min; terminal schema/digest conflicts quarantine immediately. | Dispatcher opens after 5 retryable failures in 30 s for 30 s; one half-open dispatch probe. Open/exhausted leaves the outbox pending for the 60 s sweeper. Consumer partition uses the same rule; attempt 8 moves work to DLQ with alert and preserves the last verified state. |
| Insurance provider adapter | 5,000 ms per attempt; 4 attempts total; retry caps 1 s, 5 s, and 25 s using the same provider idempotency key. Retry only known-not-sent timeout/connection failure, 408, 429, 5xx, or provider-declared retryable response; ambiguous send, acknowledged/declined result, auth/schema failure, and non-429 4xx are terminal for blind send. | Open after 5 retryable failures in 60 s for 60 s; half-open performs one provider-status reconciliation probe before one new referral. Fallback remains unknown_reconciling and reconciles by verified webhook/poll; it never blind-resends or infers coverage rejection. |
| BE00 webhook bridge | Webhook acknowledgement deadline 1,000 ms; domain handling has 4 attempts total with retry caps 250 ms, 1 s, and 4 s. Retry only internal timeout/connectivity, serialization/deadlock, and retryable 5xx. Invalid signature, replay, receipt/provider mismatch, schema/digest conflict, and non-429 4xx are terminal and create no command. | Connectivity circuit opens after 5 retryable failures in 30 s for 30 s; one half-open verified-receipt probe closes after two successes or reopens. Fallback leaves provider state unreconciled; terminal different-digest receipts route to manual review without mutating referral state. |

## Event and Consumer Contracts

All events use the BE00 envelope: `eventId uuid`, exact `eventType`, `schemaVersion integer=1`, `occurredAt timestamptz`, `aggregateId uuid`, `aggregateVersion decimal string`, `actorPartyId uuid`, `correlationId uuid`, nullable `causationId uuid`, `idempotencyDigest hex32`, and `privacyClass`. Payloads are strict:

| Exact event type | Required typed payload | Consumer and dedupe |
|---|---|---|
| `career.goal.created.v1` | `goalId uuid; ownerPartyId uuid; entityPartyId nullable uuid; targetPredicateCode text; derivationVersion bigint; cadence text; visibilityClass text` | Progress scheduler/audit; dedupe `(goalId, aggregateVersion)` |
| `career.goal.progress_changed.v1` | `goalId uuid; entries array of {trustTier enum,value nullable decimal,state enum}; sourceRevision bigint; integrity enum; derivedAt timestamptz` | Private timeline/notification; dedupe `(goalId,sourceRevision)`; never combines tiers |
| `career.milestone.derived.v1` | `milestoneId uuid; factKey text; ruleCode text; ruleVersion bigint; sourceRevision bigint; class enum; visibility enum; wordingScope enum` | Private timeline/share projector; dedupe `(milestoneId,aggregateVersion)` |
| `career.milestone.invalidated.v1` | `milestoneId uuid; sourceFactRevision bigint; reasonCode text` | Timeline/public cache purge; dedupe `(milestoneId,sourceFactRevision)` |
| `career.insurance_need.observed.v1` | `needId uuid; ownerPartyId uuid; actionType enum; actionId uuid; requirementCode text; sourceRevision bigint; confidence numeric; suppressionClass text` | Referral-prompt projector; dedupe `(needId,aggregateVersion)` |
| `career.insurance_referral.changed.v1` | `referralId uuid; providerCode text; consentVersion bigint; status enum; occurredAt timestamptz` | User status/audit/provider reconciler; dedupe `(referralId,aggregateVersion)` |

Events exclude progress source rows, finance amounts, declared policy values, disclosed provider values, policy documents, health/wellbeing data, cohort dimensions below the approved disclosure level, cohort membership, peer identities, provider payloads, and commission terms.

## Error Handling

### Global status rules

| HTTP | Stable code family | Deterministic meaning and retry |
|---|---|---|
| 400 | `INVALID_REQUEST`, `SENSITIVE_INPUT_FORBIDDEN` | Malformed path/query/header/JSON, extra key, key mismatch; fix request |
| 401 | `UNAUTHENTICATED`, `PROVIDER_SIGNATURE_INVALID` | Missing/invalid human or service authentication; reauthenticate or fix integration |
| 403 | `FORBIDDEN`, `OWNER_FORBIDDEN`, `B2_DISABLED` | Visible target but capability, gate, mandate, class, or step-up denies; no retry without state change |
| 404 | `GOAL_NOT_FOUND`, `MILESTONE_NOT_FOUND`, `REFERRAL_NOT_FOUND` | Absent or concealed target; identical safe details |
| 409 | `VERSION_MISMATCH`, `IDEMPOTENCY_CONFLICT`, `TERMS_VERSION_STALE` | Current-authorized version/key conflict; refresh or replay exact request |
| 413/415 | `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` | Transport contract failure |
| 422 | Domain code | Valid shape but unsupported fact/rule/query/consent/disclosure; correct business input |
| 429 | `RATE_LIMITED`, `QUERY_BUDGET_EXCEEDED` | Wait for safe `retryAfterSeconds`; no query-family variation |
| 500 | `INTERNAL_ERROR` | Scrubbed owning-boundary error; retry only per client policy |
| 502/503/504 | `DEPENDENCY_UNAVAILABLE`, `COHORT_UNAVAILABLE` | Dependency/circuit/deadline; retry only when `details.retryable=true` |

### Per-operation error matrix

| ID | Domain errors in addition to global envelope | Recovery |
|---|---|---|
| 42.01 | `TEMPLATE_NOT_FOUND` 404; `DERIVATION_UNSUPPORTED` 422; `OWNER_FORBIDDEN` 403; `VERSION_MISMATCH` 409 | Refresh template/authority/version; same-key replay is safe |
| 42.02 | `GOAL_NOT_FOUND` 404; source unavailable is a 200 unknown/unavailable projection; `DEPENDENCY_UNAVAILABLE` only when no safe projection can be formed | Retry read; never infer achievement |
| 42.03 | `FACT_NOT_QUALIFYING` 422; `RULE_VERSION_UNSUPPORTED` 422; `SOURCE_REVISION_STALE` 409; duplicate is 200 replay | Re-read producer revision or deploy registered rule |
| 42.04 | `MILESTONE_NOT_FOUND` 404; `HARD_PRIVATE` 422; `VISIBILITY_FORBIDDEN` 403; `VERSION_MISMATCH` 409 | Keep private or refresh version/authority |
| 42.05 | `B2_DISABLED` 403; `COHORT_QUERY_INVALID` 422; `QUERY_BUDGET_EXCEEDED` 429; below floor/no data are 200 suppressed | Do not vary query to infer membership |
| 42.06 | `ACTION_NOT_FOUND` 404; `REQUIREMENT_UNSUPPORTED` 422; `POLICY_FACTS_INVALID` 422; active suppression is 200 suppressed | Underlying action always continues |
| 42.07 | `NEED_NOT_FOUND` 404; `CONSENT_REQUIRED` 422; `PROVIDER_DISABLED` 422; `FIELD_NOT_ALLOWLISTED` 422; `TERMS_VERSION_STALE` 409 | Re-consent to current exact field/terms list |
| 42.08 | `REFERRAL_NOT_FOUND` 404; `PROVIDER_MISMATCH` 409; `RESPONSE_STALE` 409; `RECEIPT_UNVERIFIED` 401 | Reconcile from BE00 verified receipt/current version |
| 42.09 | `SENSITIVE_INPUT_FORBIDDEN` 400; otherwise returns 200 not-offered | Remove sensitive fields; use provided practical routes |

## Failure Cascades and Partial-State Recovery

| Failure point | Canonical result | Recovery and prohibited outcome |
|---|---|---|
| Goal transaction fails before commit | No goal, audit, idempotency result, or outbox | Exact safe retry; no partial definition bundle |
| Shard 41 source is stale, incomplete, or revoked | Progress is unknown/unavailable; milestone may invalidate | Re-derive on new revision; never achieved or silently reset |
| Competing goal/milestone/referral writes | One CAS winner; loser gets 409 | Refresh strong ETag; no last-write-wins |
| Duplicate milestone fact/rule | Existing milestone returned | Unique key and idempotency replay; no duplicate timeline claim |
| Public share races invalidation | Invalidation/version lock wins or share sees stale 409 | Projection purged by outbox; no stale financial/public artifact |
| B2 closes during cohort computation | Result discarded and suppressed | Recheck gate in write/read transaction; no cached aggregate served |
| Cohort falls below floor | Suppressed response without n/position | Immediate cache invalidation; criteria never broaden |
| Queue send fails after commit | Domain state and durable outbox remain authoritative | Dispatcher lease/sweep and DLQ; no rollback of committed state |
| Insurance suppression exists | Observation records suppressed or replays prior result | No prompt/provider effect; underlying action continues |
| Provider call times out after possible send | Referral remains `unknown_reconciling` | Webhook/idempotency/poll reconciliation; no blind resend or rejected-coverage claim |
| Provider sends duplicate event | Same digest replays; different digest enters manual review | One status transition; safe acknowledgement managed by BE00 |
| Referral worker dies after provider acceptance | ProviderOperation/referral remain pending | Lease expiry and reconciliation; no second external effect |
| Restore/PITR occurs | BE00 restore epoch fences producers, workers, and provider sends | Reconcile DB/outbox/provider before reopening |
| 42.09 receives sensitive field | Request rejected before body logging/storage | No domain row, event, audit-sensitive payload, or support ticket created |

## Observability, Rate, and Abuse Controls

| ID | Safe structured fields | Metrics and SLO | Audit and alert |
|---|---|---|---|
| 42.01 | operation, request/trace, actor/owner IDs, template ID, outcome, version; no predicate values | count, duration, RPC, conflicts, replays; p95 <1.2s | 100% mutation audit; alert error >2%/10m |
| 42.02 | operation, goal ID, source revision, entry states/tier names; no values | count, duration, cache, source freshness; p95 <750ms | read audit sampled 10%; alert stale >5%/15m |
| 42.03 | operation, producer, fact/rule codes, revisions, replay; no source value | count, duration, duplicates, invalidations; p95 <1.2s | 100% derivation audit; alert invariant failure immediately |
| 42.04 | operation, milestone ID, class, audience, outcome; no wording | count, duration, class denials, purge lag; p95 <1.2s | 100% share audit; alert public purge age >2m |
| 42.05 | operation, hashed query family, policy version, state; no subject/cohort members or below-floor n | count, duration, B2 denial, budget, suppression; p95 <2s | 100% privacy-query audit; alert differencing rejection spike |
| 42.06 | operation, need/action IDs, requirement code, state; no declared attributes | count, duration, suppression, possible-gap-null count; p95 <1.2s | 100% observation audit; alert duplicate prompt |
| 42.07 | operation, referral/need IDs, provider code, disclosed field names, status; no values | count, acceptance latency, provider queue age; p95 <=500ms | 100% consent/referral audit; alert outbox age >2m |
| 42.08 | operation, referral/receipt/event IDs, provider code, mapped status; no provider payload | count, duration, duplicate/digest conflict, reconcile age; p95 <1.2s | 100% provider-status audit; digest conflict severity one |
| 42.09 | operation, context, outcome; no request body capture | count and p95 <250ms | ordinary access sample; any sensitive-key attempt security counter |

Logs and structured diagnostic events exclude authentication headers, IP/user agent outside BE00 bounded abuse hashes, target values, progress values, finance amounts, cohort dimensions capable of membership inference, provider fields/payloads, policy attributes, free text, and wellbeing/health content. Metrics use bounded labels only. Rate-limit keys are HMAC digests of actor/owner/query family/provider; raw identities are not metric labels.

## Release, Migration, and Recovery

1. Expand schemas, enums, constraints, RLS, functions, indexes, event parsers, and route registry under a bounded advisory lock.
2. Deploy with B2 disabled, insurance providers disabled, referral dispatcher paused, and 42.09 enabled as the safe stable exclusion.
3. Run contract, RLS negative, idempotency, outbox, redaction, and performance tests; seed signed versioned template/rule/provider settings.
4. Enable goal/milestone private paths, then insurance observation, then each provider after its BE00 adapter/webhook/retention/runbook gate.
5. B2 requires counsel-approved policy, privacy floor at least 20, anti-differencing test evidence, ephemeral membership proof, and no-export verification before activation.
6. Rollback disables registry/config entries and workers while retaining committed canonical rows/outbox. No destructive down migration runs.
7. Recovery inherits BE00 seven-day PITR, RPO <=2m, RTO <=4h, restore-epoch fencing, and reopening order. Provider reconciliation and public milestone-cache purge must pass before protected writes/effects resume.

## Testing Strategy

All tests begin RED from the Zod/OpenAPI/database contract, then implement through Hono `app.request()`, Supabase RPC fixtures, fake Queue bindings, deterministic clocks, and registered provider doubles.

| ID | Contract and handler tests | Authorization/security tests | State, failure, and observability tests |
|---|---|---|---|
| 42.01 | Valid bundle; strict extra key; override bounds; exact response parse | Owner/entity mandate; 403/404; CORS/CSRF | same-key concurrency one effect; version conflict; atomic audit/outbox; metrics |
| 42.02 | Ledger exactly two tiers; non-ledger one tier; missing tier zero; ETag | Owner/entity RLS and concealed ID | stale/incomplete never achieved; Shard 41 timeout; cache invalidation |
| 42.03 | Producer/fact/rule schemas; bounded wording | Service-only; deny browser/CORS; source ownership | duplicate fact/rule replay; revocation invalidation; event dedupe |
| 42.04 | Public/entity schemas and wording | Hard-private denial; mandate; BOLA; CSRF | share/invalidation race; projection purge; audit/redaction |
| 42.05 | Available/suppressed union; dimension/window validation | B2 before compute; subject/context; no admin bypass | floor, differencing, no widening/export/member storage; circuit |
| 42.06 | Structured policy fields; venue precedence; nullable gap | Owner/action producer; provider denied; sensitive keys | suppression honored; duplicate prompt; source action unchanged |
| 42.07 | Consent/terms/allowlist; 202 parse | Owner and step-up; provider direct access denied | local commit before effect; timeout unknown_reconciling; no blind resend |
| 42.08 | Receipt/event/response mapping; duplicate replay | Verified bridge/reconciler only; 404 concealment | stale CAS, conflicting digest manual review, audit/outbox |
| 42.09 | Exact context/key only; two alternatives; stored false | Any authenticated actor; CORS/CSRF | no table/event/queue/provider write; sensitive sentinel never reaches logs |

Database tests prove every check, FK/logical-producer validation, uniqueness, index-backed query plan, RLS positive and negative case, grants, `search_path` pinning, no direct DML, retention sweep, and absence of wellbeing/cohort-member/underwriting columns. Event tests parse every exact event type, reject extra/sensitive fields, dedupe at least-once delivery, reject stale aggregate versions, exercise retry/DLQ, and verify no tier blending. Performance tests use representative goal/projection/cohort/referral volumes and enforce the route registry SLOs.

## Deepening Passes

| Pass | Evidence | Result |
|---|---|---|
| 1 — Source fidelity | All 9 exact interaction IDs, 3 features, 6 contracts, 9 models, 6 events, actors, edge cases, and dependencies mapped | PASS |
| 2 — Endpoint and contract | One unique operation per interaction; authoritative registry; strict Zod 4 request/success/global error for every operation | PASS |
| 3 — Persistence | Every canonical table has exhaustive typed/nullability/constraint fields, FK target or named logical producer, indexes, RLS, grants, retention | PASS |
| 4 — Security and privacy | CORS, auth, CSRF, BOLA, 403/404, B2, support grants, hard-private milestones, consent, and no-wellbeing storage fixed | PASS |
| 5 — Concurrency and idempotency | Strong ETags, CAS, keys, uniqueness, outbox, provider-operation reconciliation, and replay outcomes fixed | PASS |
| 6 — Failure and operations | Source, cohort, Queue, provider, restore, redaction, rate, observability, circuit, DLQ, and recovery behavior fixed | PASS |
| 7 — Testability | Per-operation contract/auth/state/failure tests plus SQL, RLS, event, privacy, performance, and recovery gates fixed | PASS |

## Ambiguity Gate

- **Micro ambiguity: PASS.** `unknown` is a progress state, not achievement; ledger goals always expose separate verified/declared entries; “first” means `first recorded on WeJammin`; financial milestones are unshareable; below-floor cohorts return no n; `possibleGap` is nullable and advisory; provider ambiguity maps to `unknown_reconciling`; sustainability accepts no sensitive field.
- **Macro ambiguity: PASS.** Shard 40 and 41 retain source-fact ownership; Shard 42 owns only derived goals/milestones/anonymous distributions/referral metadata; Shard 00 retains webhook, provider operation, queue, idempotency, audit, and recovery ownership.
- **Two-implementer check: PASS.** Independent implementers receive identical operation IDs/routes, strict schemas, status/error codes, table fields, constraints, indexes, RLS/grants, middleware order, state transitions, timeouts, retries, circuits, events, and test oracles.
- **Devil's-advocate check: PASS.** No permitted fallback can blend trust tiers, widen cohorts, infer named peers, publish financial milestones, bypass suppression, block source actions, treat provider silence as rejection, accept sensitive wellbeing text, or create alternate platform endpoints.
- **Source contradiction check: PASS.** The IA edge-case statement that reads mention idempotency is resolved by treating 42.02/42.05 as safe source-version-pinned reads with no idempotency key; all state-changing commands retain keys. This preserves HTTP and BE00 semantics without changing IA outcomes.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Classified Shard 42 as one domain and authored complete backend contracts for operations 42.01–42.09. |
| 2026-08-28 | Locked segregated trust tiers, B2 privacy behavior, advisory insurance semantics, provider reconciliation, and no-wellbeing-storage boundary. |
| 2026-08-28 | Added exhaustive persistence, middleware/CORS, errors, external seams, events, observability, recovery, tests, and ambiguity evidence. |
| 2026-08-29 | Declared pagination N/A and exact nested response caps for fixed reads 42.02 and 42.05. |

## Dependency References

- [Shard 42 IA](../ia/42-career-planning-risk.md)
- [Shard 00 Backend](00-infrastructure.md)
- [Shard 40 IA — Market intelligence and signals](../ia/40-market-intelligence-signals.md)
- [Shard 41 IA — Career finance](../ia/41-career-finance.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Data Placement Strategy](../data-placement-strategy.md)
- [Engineering Standards](../ENGINEERING-STANDARDS.md)


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]

### References
- [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]
