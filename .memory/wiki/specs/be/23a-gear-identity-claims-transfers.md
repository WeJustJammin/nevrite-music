# BE-23a — Gear Identity, Claims and Transfers

Status: Complete

This specification turns IA Shard 23 interactions GPR-01 through GPR-06 into six Hono endpoints for gear identity, identifier continuity, ownership claims, transfers, bounded provenance views, and duplicate-record cases. It owns the canonical identity/claim/transfer chain and never treats minting as title, possession as ownership, or a public projection as evidence.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, identity/claims/transfers subdomain | BE index line 40 assigns 23a identity/claims/transfers; IA interaction table lines 66-73. |
| Backend surface | Authenticated Hono REST commands, bounded public projection, protected evidence storage, and Supabase RPCs | IA Contracts lines 93-121; IA Access Control lines 165-187; BE00 Middleware lines 253-297. |
| Canonical owner | 23a owns gear_record, gear_identity_key, gear_identifier_fact, gear_claim, claim_evidence, gear_chain_event, gear_transfer, and gear_duplicate_case | IA Data Models lines 125-139 and Typed Field Registry lines 142-163. |
| Explicit non-ownership | Theft flags/screening/sightings, service/components, valuation/appraisal/insurance, and discography are companion boundaries 23b-23d | IA interactions GPR-07 through GPR-16, lines 74-84; approved split row. |
| Split validity | PASS: identity/claims/transfers are a coherent write boundary and no source interaction is split across companions | IA Scope Reconciliation lines 13-19 and interactions lines 68-73. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Overview lines 7-9 | Ownership of gear identity, provenance, claims, transfers, and protected evidence. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Registry Decisions lines 22-35 | Mint/title distinction, composite keys, claims, transfer handshake, and immutable history. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Acceptance Criteria lines 45-61 | GPR-01 through GPR-16 outcomes; 23a uses GPR-01 through GPR-06. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Interactions lines 64-73 | GPR-01 through GPR-06 preconditions, behavior, completion, failure and recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Global Interaction Rules lines 85-91 | Distinct identity/possession/title, public lookup protection, retention and deletion. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Contracts lines 93-121 | GearIntent, IdentityConfidence, ClaimState, transfer contracts, and exact error vocabulary. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Data Models lines 123-139 | Identity, claim, evidence, chain, transfer and duplicate-case invariants. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Typed Field Registry lines 142-163 | Required core fields, deterministic SQL typing and cardinality. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Access Control lines 165-187 | Public, claimant, holder, reviewer, provider and service-principal boundaries. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Event Schemas lines 198-213 | Safe identity/claim/transfer payloads and excluded serials, locations and evidence. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Dependency References lines 235-240 and Cross-Shard Map lines 263-273 | BE00, Shards 01, 06, 07, 08, 14, 24, 25 and 26 directions. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Identity and Claim Algorithm lines 18-28 | Composite identity, evidence tiers, silence-neutral claims, and no title adjudication. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Transfer, Theft and Recovery Algorithm lines 29-39 | Handshake/settlement transfer, expected versions, and append-only reversal. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Abuse and Recovery Verification lines 50-62 | No duplicate identity, no auto-merge, and protected projection guarantees. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | BE00 wire conventions, error envelope, command metadata and pagination. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | Private schema, RPC-only access, RLS, grants, idempotency, outbox and audit. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, capability checks and CORS. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, leasing and consumer recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error/Observability lines 416-461 | Boundary mapping, compensation, audit, metrics and traces. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| GPR-01 User mints gear record | IA line 68 | BE23A-GPR01 | Gear record with explicit intent, resolved composite key, and no-title disclosure. |
| GPR-02 User corrects/adds identifier | IA line 69 | BE23A-GPR02 | Superseding identity fact preserving prior reliance/history. |
| GPR-03 Person claims ownership | IA line 70 | BE23A-GPR03 | Evidence-tiered claim with claimant notification and no title adjudication. |
| GPR-04 Buyer/seller transfers ownership | IA line 71 | BE23A-GPR04 | Settlement/handshake transfer chain event after full-screen evidence. |
| GPR-05 User views provenance | IA line 72 | BE23A-GPR05 | Projection-specific evidence-labelled chain and does-not-prove-title disclosure. |
| GPR-06 Parties resolve duplicate records | IA line 73 | BE23A-GPR06 | Consented/reviewer-approved merge under audit or indefinitely separate records. |

### Canonical Data Models

Literal model names from IA Data Models lines 125-139:

gear_record, gear_identity_key, gear_identifier_fact, gear_claim, claim_evidence, gear_chain_event, gear_transfer, gear_duplicate_case, theft_case, theft_flag, gear_screening, gear_sighting, service_event, component_fact, valuation_estimate, appraisal_record, insurance_pack, gear_credit_link.

23a owns gear_record, gear_identity_key, gear_identifier_fact, gear_claim, claim_evidence, gear_chain_event, gear_transfer, and gear_duplicate_case. It reads theft_case, theft_flag, gear_screening, gear_sighting, service_event, component_fact, valuation_estimate, appraisal_record, insurance_pack, and gear_credit_link only through bounded projections or dependency contracts.

### Event Schemas

Literal event names from IA Event Schemas lines 198-211:

gear.identity.changed.v1, gear.claim.changed.v1, gear.transfer.changed.v1, gear.theft-flag.changed.v1, gear.sighting.changed.v1, gear.service.changed.v1, gear.valuation.changed.v1, gear.appraisal.changed.v1, gear.insurance-pack.changed.v1, gear.credit-link.changed.v1.

23a emits gear.identity.changed.v1, gear.claim.changed.v1, and gear.transfer.changed.v1. Events contain gear/key/state/confidence/version or pseudonymous claim state only; serials, locations, names/contact, evidence/documents, values, police references, and private service details stay protected.

## Endpoint Reconciliation

| IA interaction | HTTP operation | Command transaction | Success event |
|---|---|---|---|
| GPR-01 | POST /api/v1/gear/records | Resolve entity and composite key, reserve idempotency, append record/key/origin, notify protected parties on flag, and audit/outbox atomically. | gear.identity.changed.v1 |
| GPR-02 | POST /api/v1/gear/records/:gearId/identity-corrections | Classify typo versus physical/component change, preserve relied-upon fact, append superseding identifier/key event, and notify affected parties. | gear.identity.changed.v1 |
| GPR-03 | POST /api/v1/gear/records/:gearId/claims | Validate evidence/relationship/period, notify current claimants, compute current tier, append claim/evidence and chain event. | gear.claim.changed.v1 |
| GPR-04 | POST /api/v1/gear/records/:gearId/transfers | Validate expected claim/custody, require full composite screening evidence from 23b, record settlement/handshake custody and consideration, append transfer. | gear.transfer.changed.v1 |
| GPR-05 | POST /api/v1/gear/records/:gearId/provenance-views | Resolve viewer projection first, derive immutable chain, redact protected fields, and attach does-not-prove-title disclosure. | No mutation event; projection audit only. |
| GPR-06 | POST /api/v1/gear/duplicate-cases/:caseId/resolve | Notify candidate claimants, require mutual consent or assigned reviewer policy, retain both records, append merge/link event under audit. | gear.identity.changed.v1 and, when claims change, gear.claim.changed.v1 |

## API Endpoints

### Umbrella Feature Trace

The IA Shard 23 feature bullets are represented across 23a–23d: 15.01 Instrument Identity & Provenance; 15.02 Stolen Gear Registry & Recovery; 15.03 Service, Repair & Modification History; 15.05 Valuation, Appraisal & Insurance; 15.09 Gear Discography.

### Authoritative Route Registry

This is the only 23a route registry. Operation IDs are stable keys for every contract, error, authorization, idempotency, rate, observability and test row. 23b-23d and BE00 routes are inherited and not duplicated.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE23A-GPR01 | POST | /api/v1/gear/records | gear.identity_mint | Gpr01Success |
| BE23A-GPR02 | POST | /api/v1/gear/records/:gearId/identity-corrections | gear.identity_correct | Gpr02Success |
| BE23A-GPR03 | POST | /api/v1/gear/records/:gearId/claims | gear.claim_submit | Gpr03Success |
| BE23A-GPR04 | POST | /api/v1/gear/records/:gearId/transfers | gear.transfer_execute | Gpr04Success |
| BE23A-GPR05 | POST | /api/v1/gear/records/:gearId/provenance-views | gear.provenance_view | Gpr05Success |
| BE23A-GPR06 | POST | /api/v1/gear/duplicate-cases/:caseId/resolve | gear.duplicate_resolve | Gpr06Success |

### Request/Response Contracts (Zod 4)

Every non-2xx response is ErrorResponse containing the BE00/global ApiError { code, message, requestId, details }. Unknown keys are rejected, UUID route parameters are parsed before lookup, and public projections use a separate response schema.

~~~ts
import { z } from "zod";
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const Uuid = z.uuid();
const Version = z.string().regex(/^[1-9]\d*$/);
const IdempotencyKey = z.string().min(1).max(128);
const DateTime = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const ApiError = z.object({
  code: z.string().min(1), message: z.string().min(1),
  requestId: Uuid, details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();
const GearIntent = z.enum(["owned", "held", "observed"]);
const ClaimState = z.enum(["asserted", "provisional", "confirmed", "contested", "superseded", "withdrawn"]);
const IdentityConfidence = z.enum(["canonical", "composite", "secondary", "visual", "wj_id"]);

const IdentityKey = z.object({
  manufacturer: z.string().min(1).max(256),
  model: z.string().min(1).max(256),
  serial: z.string().min(1).max(256),
  secondaryIdentifiers: z.array(z.string().min(1).max(256)).max(20),
  locationFacts: z.array(z.string().min(1).max(256)).max(20),
}).strict();
const Gpr01Request = z.object({
  entityId: Uuid.optional(), intent: GearIntent, identity: IdentityKey,
  originRef: z.string().min(1).max(256).optional(), idempotencyKey: IdempotencyKey,
}).strict();
const Gpr01Success = z.object({
  gearRecordId: Uuid, identityKeyId: Uuid, intent: GearIntent,
  identityConfidence: IdentityConfidence,
  state: z.enum(["active", "contested"]), theftNoticeRecorded: z.boolean(),
  version: Version,
}).strict();

const Gpr02Request = z.object({
  gearId: Uuid, expectedVersion: Version,
  correctionKind: z.enum(["typo", "physical_component_change"]),
  identity: IdentityKey, removedComponentId: Uuid.optional(),
  replacementComponentId: Uuid.optional(),
  relianceRefs: z.array(z.string().min(1).max(256)).max(50),
  reason: z.string().min(1).max(2000), idempotencyKey: IdempotencyKey,
}).strict();
const Gpr02Success = z.object({
  identityFactId: Uuid, state: z.enum(["active", "superseded", "contested"]),
  priorKeyPreserved: z.literal(true), identityConfidence: IdentityConfidence,
  version: Version,
}).strict();

const Gpr03Request = z.object({
  gearId: Uuid, expectedClaimVersion: Version,
  relationship: z.string().min(1).max(128),
  possessionStart: DateOnly, possessionEnd: DateOnly.optional(),
  evidenceRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  idempotencyKey: IdempotencyKey,
}).strict().refine(v => !v.possessionEnd || v.possessionEnd >= v.possessionStart,
  { path: ["possessionEnd"], message: "possession end must not precede start" });
const Gpr03Success = z.object({
  claimId: Uuid, evidenceTier: z.enum(["none", "limited", "substantial", "strong"]),
  state: ClaimState, notifiedClaimantCount: z.number().int().min(0),
  version: Version,
}).strict();

const Gpr04Request = z.object({
  gearId: Uuid, expectedClaimVersion: Version, expectedCustodyVersion: Version,
  source: z.enum(["marketplace_settlement", "manual_handshake"]),
  settlementRef: z.string().min(1).max(256).optional(),
  handshakeRef: z.string().min(1).max(256).optional(),
  screeningEvidenceRef: z.string().min(1).max(256),
  currentHolderPartyId: Uuid, newHolderPartyId: Uuid,
  custodyEvidenceRef: z.string().min(1).max(256),
  considerationEvidenceRef: z.string().min(1).max(256),
  effectiveAt: DateTime, idempotencyKey: IdempotencyKey,
}).strict().refine(v => v.source !== "marketplace_settlement" || Boolean(v.settlementRef),
  { path: ["settlementRef"], message: "settlement source requires settlementRef" })
  .refine(v => v.source !== "manual_handshake" || Boolean(v.handshakeRef),
  { path: ["handshakeRef"], message: "manual source requires handshakeRef" });
const Gpr04Success = z.object({
  transferId: Uuid,
  state: z.enum(["completed", "blocked", "contested"]),
  reversalOf: Uuid.optional(), screeningState: z.enum(["clear", "flagged", "disputed", "cannot_check"]),
  version: Version,
}).strict();

const Gpr05Request = z.object({
  gearId: Uuid, projection: z.enum(["public", "claimant", "holder", "operator"]),
  chainRevision: Version, idempotencyKey: IdempotencyKey,
}).strict();
const Gpr05Success = z.object({
  gearRecordId: Uuid, identityConfidence: IdentityConfidence,
  ownershipStrength: z.enum(["none", "limited", "substantial", "strong"]),
  chain: z.array(z.object({
    eventId: Uuid, eventType: z.string().min(1), state: z.string().min(1),
    evidenceLabel: z.string().min(1), occurredAt: DateTime,
  }).strict()),
  disclosure: z.literal("does_not_prove_title"),
  redactedFields: z.array(z.string().min(1)), version: Version,
}).strict();

const Gpr06Request = z.object({
  caseId: Uuid, candidateGearIds: z.array(Uuid).min(2).max(10),
  compositeKeyVersion: Version, notifiedClaimantIds: z.array(Uuid).min(1),
  mutualConsentIds: z.array(Uuid), reviewerPolicyId: Uuid.optional(),
  decision: z.enum(["link", "merge_under_audit", "remain_separate"]),
  idempotencyKey: IdempotencyKey,
}).strict().refine(v => v.decision === "remain_separate" ||
  v.mutualConsentIds.length >= 2 || Boolean(v.reviewerPolicyId),
  { path: ["decision"], message: "link/merge requires mutual consent or reviewer policy" });
const Gpr06Success = z.object({
  duplicateCaseId: Uuid,
  state: z.enum(["awaiting_consent", "linked", "merged_under_audit", "separate"]),
  retainedGearRecordIds: z.array(Uuid).min(2), version: Version,
}).strict();
~~~

### Contract Registry

| Operation ID | Request body | Success body | Canonical validation |
|---|---|---|---|
| BE23A-GPR01 | Gpr01Request | Gpr01Success | Entity context is explicit when needed; full composite key resolves; intent never implies title. |
| BE23A-GPR02 | Gpr02Request | Gpr02Success | Typo/component change is classified; prior relied-upon identity is preserved and superseded. |
| BE23A-GPR03 | Gpr03Request | Gpr03Success | Evidence, relationship and possession period are required; tier computes and may fall; silence is neutral. |
| BE23A-GPR04 | Gpr04Request | Gpr04Success | Expected claim/custody and full screening evidence are required; transfer/reversal is append-only. |
| BE23A-GPR05 | Gpr05Request | Gpr05Success | Projection resolves before chain derivation; protected fields are absent, not blanked after disclosure. |
| BE23A-GPR06 | Gpr06Request | Gpr06Success | Candidate claimants are notified; merge/link requires mutual consent or assigned reviewer policy; no auto-merge. |

### Error Registry

Every row returns ErrorResponse with BE00 ApiError { code, message, requestId, details }. details contain only safe target, revision, evidence class, projection, or remediation data.

| Operation ID | 400 / 401 | 403 vs 404 | 409 | 422 domain errors | 429 / 5xx recovery |
|---|---|---|---|---|---|
| BE23A-GPR01 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN for unauthorized entity; NOT_FOUND hides inaccessible entity/key | CONFLICT on revision/idempotency | ENTITY_CONTEXT_REQUIRED, IDENTITY_KEY_INCOMPLETE, IDENTITY_KEY_CONFLICT | RATE_LIMITED; failed mint writes no partial record. |
| BE23A-GPR02 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without record control; NOT_FOUND hides gear record | CONFLICT on expected version | IDENTITY_KEY_INCOMPLETE, IDENTITY_KEY_CONFLICT | RATE_LIMITED; prior identity fact remains canonical. |
| BE23A-GPR03 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without claim standing; NOT_FOUND hides record/evidence | CONFLICT on claim version | CLAIM_EVIDENCE_REQUIRED, CLAIM_CONTESTED | RATE_LIMITED; claim/evidence transaction rolls back together. |
| BE23A-GPR04 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without transfer mandate; NOT_FOUND hides record/parties | CONFLICT on claim/custody version | TRANSFER_SCREEN_REQUIRED, SCREENING_UNAVAILABLE, FLAG_MATCHED, FLAG_DISPUTED, CLAIM_CONTESTED | RATE_LIMITED; cannot-check blocks, never passes. |
| BE23A-GPR05 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN for projection field; NOT_FOUND hides unresolvable record | CONFLICT on chain revision | PROJECTION_UNAVAILABLE | RATE_LIMITED; return honest unavailable projection, no partial leak. |
| BE23A-GPR06 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN outside assigned case; NOT_FOUND hides case/candidates | MERGE_CONSENT_REQUIRED, CONFLICT | MERGE_CONSENT_REQUIRED | RATE_LIMITED; records remain separate and retained. |

### Authorization and Middleware Registry

Each operation runs request ID/trace, authenticated session, acting-party/entity or projection resolution, explicit CORS policy, rate limit, Zod validation, BE00 idempotency, named RPC/seam, audit and outbox in that order. Public provenance uses a bounded projection and never bypasses authorization by using a service credential.

| Operation ID | Roles and ownership | 403 rule | 404 rule | Middleware and CORS |
|---|---|---|---|---|
| BE23A-GPR01 | Authenticated registrant with entity context and gear.identity_mint. | FORBIDDEN when entity is not controlled or capability absent. | NOT_FOUND for hidden entity or conflicting private key lookup. | auth → acting-party/entity → CORS gear-api (allowlisted origins, no wildcard credentials) → rate → Zod → idempotency → RPC. |
| BE23A-GPR02 | Owner/controlled party with gear.identity_correct. | FORBIDDEN for actor without record control. | NOT_FOUND hides record and identity evidence. | auth → acting-party → CORS gear-api → rate → Zod → idempotency → RPC. |
| BE23A-GPR03 | Verified claimant/owner/holder with gear.claim_submit. | FORBIDDEN for actor without qualifying standing. | NOT_FOUND hides gear/evidence/claimants. | auth → acting-party → CORS gear-api → rate → Zod → idempotency → RPC. |
| BE23A-GPR04 | Buyer/seller or assigned settlement operator with gear.transfer_execute. | FORBIDDEN for party outside current claim/custody or settlement. | NOT_FOUND hides record and counterparty identity. | auth → acting-party → CORS gear-api → rate → Zod → idempotency → RPC. |
| BE23A-GPR05 | Public visitor receives public projection; claimant/holder/operator receive only their projection. | FORBIDDEN for requested field outside projection. | NOT_FOUND for an unresolvable record without existence leakage. | auth/anonymous projection → CORS gear-api (public allowlist, no credentials for anonymous) → rate → Zod → idempotency → RPC. |
| BE23A-GPR06 | All candidate claimants by consent; assigned safety/dispute reviewer by case policy. | FORBIDDEN for reviewer outside assigned case or party without standing. | NOT_FOUND hides case/candidate records. | auth → acting-party/case assignment → CORS gear-api → rate → Zod → idempotency → RPC. |

### Idempotency and Concurrency Registry

| Operation ID | Key and replay | Version/CAS | Failure recovery |
|---|---|---|---|
| BE23A-GPR01 | Actor/operation/request hash; same mint replays record/key result for 30 days. | Unique composite-key hash; entity-context and gear revision CAS. | Roll back record/key/origin together; flagged key notice is protected append-only evidence. |
| BE23A-GPR02 | Key binds gear, correction kind, identity hash, reliance refs and expected version. | Identity facts append; prior fact is superseded, never overwritten; unique active key. | Conflict leaves old key and all external reliance intact; affected parties are notified asynchronously. |
| BE23A-GPR03 | Key binds gear, evidence digest, relationship, period and expected claim version. | Claim tier/state CAS; evidence rows append-only; one active claim revision per claimant/record. | Notification failure leaves claim committed with retry job; invalid evidence rolls back claim/evidence. |
| BE23A-GPR04 | Key binds gear, source reference, parties, screen evidence and expected versions. | Claim/custody CAS; transfer event unique by source settlement/handshake; reversal is new event. | Screening unavailable blocks; ambiguous settlement is reconciled by source lookup, never duplicated. |
| BE23A-GPR05 | Key binds gear, projection and chain revision; safe read replay. | Chain projection reads immutable revision and never writes source facts. | Projection failure returns unavailable, not a partial or guessed chain. |
| BE23A-GPR06 | Key binds case, candidate set, consent/policy digest and decision. | Candidate records retained; merge/link CAS under case revision; no auto transition. | Missing consent leaves awaiting_consent/separate; reviewer decision is audited and reversible only by new event. |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | SLO |
|---|---|---|---|
| BE23A-GPR01 | 20/minute per actor and entity, burst 4 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms. |
| BE23A-GPR02 | 20/minute per actor and gear record, burst 4 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms. |
| BE23A-GPR03 | 10/minute per actor and gear record, burst 2 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding notification. |
| BE23A-GPR04 | 5/minute per transfer and gear record, burst 1 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding screening lookup. |
| BE23A-GPR05 | 60/minute per actor/IP and gear record, burst 10 | gear-api, public projection allowlist, POST/OPTIONS | p95 ≤ 750 ms. |
| BE23A-GPR06 | 10/minute per case and actor, burst 2 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding claimant notification. |

### Observability Registry

| Operation ID | Audit | Metrics | Trace and redaction |
|---|---|---|---|
| BE23A-GPR01 | gear.identity.minted with actor/entity/intent/key confidence/decision | gear_identity_mint_total by intent/state; key_conflict_total | Key hash and IDs only; serial/location/entity contact redacted. |
| BE23A-GPR02 | gear.identity.superseded with correction kind, reliance and decision | gear_identity_correction_total by kind/state; reliance_notice_total | Old/new key hashes; raw identifiers and contact redacted. |
| BE23A-GPR03 | gear.claim.submitted with actor, evidence class, tier and contest | gear_claim_total by state/tier; claimant_notification_total | Claim/evidence IDs and pseudonyms; evidence documents and possession detail redacted. |
| BE23A-GPR04 | gear.transfer.requested/completed/blocked with source, screen state and versions | gear_transfer_total by state/source; transfer_screen_block_total | Party pseudonyms, refs and hashes; counterparty contact and title assertions redacted. |
| BE23A-GPR05 | gear.provenance.viewed with projection and redaction count | gear_provenance_view_total by projection; projection_denied_total | Gear ID and state only; claimant identity, location, evidence and contact excluded. |
| BE23A-GPR06 | gear.duplicate.resolved with case, consent/policy class and outcome | duplicate_case_total by state/decision; auto_merge_attempt_total | Candidate IDs/hash and consent counts; claimant identity/evidence excluded. |

## Database Schema

All tables are in non-exposed platform_private with RLS enabled and forced. anon and browser direct table grants are denied. Named security-invoker RPCs repeat actor, entity, owner/holder standing, claimant notification, case assignment, and projection predicates. owner_id references identity.party(id); possession and title are never inferred from a service credential.

| Table/model | All persistence fields with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.gear_records / gear_record | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); attributed_party_id uuid NOT NULL FK identity.party(id); entity_id uuid NOT NULL FK identity.entities(id); intent gear_intent NOT NULL CHECK IN owned,held,observed; identity_key_id uuid NOT NULL FK platform_private.gear_identity_keys(id); state gear_record_state NOT NULL CHECK IN active,contested,superseded,withdrawn; origin_type text NOT NULL CHECK length>0; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique entity_id,identity_key_id | PK; entity_id,identity_key_id; owner_id,state,updated_at DESC; identity_key_id; attributed_party_id | Forced RLS entity/party standing; owner may mutate via identity RPC; public only bounded projection; no direct authenticated table grant. |
| platform_private.gear_identity_keys / gear_identity_key | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); manufacturer text NOT NULL CHECK length>0; model text NOT NULL CHECK length>0; serial text NOT NULL CHECK length>0; secondary_identifiers jsonb NOT NULL DEFAULT []; location_facts jsonb NOT NULL DEFAULT []; composite_key_hash bytea NOT NULL CHECK octet_length(composite_key_hash)=32; confidence identity_confidence NOT NULL CHECK IN canonical,composite,secondary,visual,wj_id; source text NOT NULL; effective_at timestamptz NOT NULL; superseded_by uuid NULL FK platform_private.gear_identity_keys(id); state identity_key_state NOT NULL CHECK IN active,superseded,contested; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique composite_key_hash where state=active | PK; gear_record_id,state; unique composite_key_hash; manufacturer,model,serial; superseded_by | Forced RLS owner/controlled party; key reads use public precision-limited projection; correction appends and supersedes; no raw location grant to public. |
| platform_private.gear_identifier_facts / gear_identifier_fact | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); identifier_type text NOT NULL CHECK IN serial,secondary,location,wj_id; value text NOT NULL CHECK length>0; value_hash bytea NOT NULL CHECK octet_length(value_hash)=32; source_type text NOT NULL CHECK length>0; effective_at timestamptz NOT NULL; superseded_at timestamptz NULL; state identifier_fact_state NOT NULL CHECK IN asserted,superseded,contested; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique gear_record_id,identifier_type,value_hash,effective_at | PK; gear_record_id,identifier_type,state; value_hash; effective_at DESC | Forced RLS owner/claimant projection; values are append-only; public sees bounded status/hash only; no direct table grant. |
| platform_private.gear_claims / gear_claim | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); claimant_party_id uuid NOT NULL FK identity.party(id); relationship text NOT NULL CHECK length>0; possession_start date NOT NULL; possession_end date NULL CHECK possession_end>=possession_start; state claim_state NOT NULL CHECK IN asserted,provisional,confirmed,contested,superseded,withdrawn; evidence_tier evidence_tier NOT NULL CHECK IN none,limited,substantial,strong; current_evidence_version bigint NOT NULL CHECK >0; notification_state notification_state NOT NULL CHECK IN pending,sent,failed; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique gear_record_id,claimant_party_id,current_evidence_version | PK; gear_record_id,state; claimant_party_id,state; gear_record_id,updated_at DESC; notification_state | Forced RLS claimant/owner and assigned reviewer; silence is neutral; tier recomputation may fall; no title-adjudication grant. |
| platform_private.claim_evidence / claim_evidence | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); claim_id uuid NOT NULL FK platform_private.gear_claims(id); evidence_object_id uuid NULL FK platform_private.object_records(id); evidence_type text NOT NULL CHECK length>0; purpose text NOT NULL CHECK length>0; evidence_digest bytea NOT NULL CHECK octet_length(evidence_digest)=32; source text NOT NULL; submitted_at timestamptz NOT NULL; state evidence_state NOT NULL CHECK IN submitted,verified,rejected,withdrawn; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() | PK; claim_id,submitted_at DESC; evidence_digest; state,submitted_at; evidence_object_id | Forced RLS claimant/owner/reviewer purpose grant; object bytes separately authorized; append-only evidence; no public evidence or direct browser grant. |
| platform_private.gear_chain_events / gear_chain_event | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); event_type gear_chain_event_type NOT NULL; actor_party_id uuid NULL FK identity.party(id); basis_ref text NOT NULL; prior_event_id uuid NULL FK platform_private.gear_chain_events(id); payload jsonb NOT NULL; occurred_at timestamptz NOT NULL; state chain_event_state NOT NULL CHECK IN accepted,contested,superseded; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique gear_record_id,version | PK; gear_record_id,occurred_at DESC; gear_record_id,version; event_type,occurred_at; prior_event_id | Forced RLS bounded owner/public projection; append-only payload and history; actor may append only through authorized domain RPC; update/delete denied. |
| platform_private.gear_transfers / gear_transfer | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); from_party_id uuid NOT NULL FK identity.party(id); to_party_id uuid NOT NULL FK identity.party(id); source transfer_source NOT NULL CHECK IN marketplace_settlement,manual_handshake; settlement_ref text NULL; handshake_ref text NULL; screening_ref text NOT NULL; screening_state screening_state NOT NULL CHECK IN clear,flagged,disputed,cannot_check; custody_evidence_ref text NOT NULL; consideration_evidence_ref text NOT NULL; claim_version bigint NOT NULL CHECK >0; custody_version bigint NOT NULL CHECK >0; effective_at timestamptz NOT NULL; reversal_of uuid NULL FK platform_private.gear_transfers(id); state transfer_state NOT NULL CHECK IN completed,blocked,contested,reversed; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK source=marketplace_settlement OR settlement_ref IS NULL; CHECK source=manual_handshake OR handshake_ref IS NULL; unique source,settlement_ref where settlement_ref is not null; unique source,handshake_ref where handshake_ref is not null | PK; gear_record_id,effective_at DESC; from_party_id,created_at DESC; to_party_id,created_at DESC; screening_state; reversal_of | Forced RLS current parties and assigned marketplace operator; full screen evidence required before completed; reversal appends; counterparty contact excluded. |
| platform_private.gear_duplicate_cases / gear_duplicate_case | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); candidate_gear_ids uuid[] NOT NULL CHECK cardinality(candidate_gear_ids)>=2; composite_key_hash bytea NOT NULL CHECK octet_length(composite_key_hash)=32; claimant_party_ids uuid[] NOT NULL CHECK cardinality(claimant_party_ids)>=1; notified_at timestamptz NULL; mutual_consent_ids uuid[] NOT NULL DEFAULT []; reviewer_policy_id uuid NULL FK trust.review_policies(id); assigned_reviewer_party_id uuid NULL FK identity.party(id); decision duplicate_decision NOT NULL CHECK IN link,merge_under_audit,remain_separate; state duplicate_case_state NOT NULL CHECK IN awaiting_consent,linked,merged_under_audit,separate,blocked; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique composite_key_hash,state where state in awaiting_consent,linked,merged_under_audit | PK; composite_key_hash; state,updated_at; assigned_reviewer_party_id,state; GIN candidate_gear_ids | Forced RLS candidate claimants and assigned reviewer; no automatic merge; both records and chains retained; policy/consent evidence read only through case projection. |

### Shared persistence invariants

- Every mutation reserves inherited BE00 idempotency with actor, operation, request hash, and target. Domain rows, audit events, notifications, and outbox events commit atomically.
- Identity facts, claim evidence, chain events, transfer events, and duplicate decisions are append-only. Corrections supersede prior facts; no terminal deletion removes relied-upon history.
- Minting a record with a theft flag or contested key is allowed to preserve evidence and notifies protected parties; minting never grants title, possession, authority, or custody.
- Public projection never exposes claimant identity/contact, exact possession/location, evidence documents, or private chain payload. Absence of a claim/service event proves nothing.
- authenticated has no direct table grants; named security-invoker RPCs repeat ownership/entity/case predicates. Service roles cannot bypass them.

## Middleware & Policies

### Hono order and security

1. Attach request ID, trace ID, operation ID, bounded body limit, and correlation context.
2. Apply CORS policy gear-api: explicit allowlisted product origins, POST and OPTIONS only, no wildcard credential mode, Vary: Origin.
3. Authenticate session or resolve anonymous public projection; resolve entity context, claimant/holder standing, transfer parties, and case assignment.
4. Apply operation/actor/entity/gear rate limit.
5. Validate path/body with the operation Zod 4 schema; reject unknown keys before existence-sensitive lookup.
6. Reserve inherited BE00 idempotency; request-hash mismatch returns CONFLICT without side effects.
7. Call named security-invoker RPC with expected version and purpose grant.
8. Append audit/outbox/notification work atomically; return only the Success schema.

### Policy rules

| Policy | Required behavior |
|---|---|
| Entity context | If actor controls multiple entities, entityId is mandatory; no default entity is selected. |
| Identity key | Manufacturer/model/serial plus required secondary/location facts form composite key. WJ-ID is weaker and never substitutes for incomplete canonical identity. |
| Intent | owned, held, and observed are explicit capabilities/claims and never title. |
| Claim | Evidence tier is computed from current standing evidence; silence is neutral; platform never adjudicates legal title. |
| Transfer | Completed settlement or manual two-party handshake, expected claim/custody versions, full screen result, custody and consideration evidence are required. Reversal is a new event. |
| Provenance projection | Public receives bounded status/provenance and does-not-prove-title disclosure. Protected fields are absent, not redacted after delivery. |
| Duplicate | Notify all current claimants; link/merge requires mutual consent or assigned reviewer policy. Both records remain on refusal and merge. |
| PII/evidence | Serial/location/contact/evidence/object URLs stay in protected projections and purpose-scoped storage. |

## Data Flow

### GPR-01 mint

POST → authenticate and resolve entity → validate intent and full composite key → compare active key → append gear_record, gear_identity_key, identifier facts and chain event → if protected theft flag exists, append notice and notify parties → audit/outbox → Gpr01Success. Key conflict routes to duplicate case; it does not deny evidence-preserving mint by default.

### GPR-02 identity correction

POST → verify control and expected version → classify typo versus physical/component change → calculate new composite key → append new key/fact and supersede prior fact when valid → preserve reliance refs and queue affected-party notices. A serial-bearing component change preserves original key history and never edits the old row.

### GPR-03 claim

POST → verify claimant standing → validate relationship/period and purpose-limited evidence → append claim/evidence → notify every current claimant → compute evidence tier from current evidence → append claim chain event. Competing evidence produces contested state, not a title judgment.

### GPR-04 transfer

POST → verify current claim/custody versions → require full composite screen evidence from 23b → require settlement or two-party handshake plus custody/consideration refs → append transfer and chain event. Screening cannot-check, flagged, disputed, or contested claim blocks or labels disputed; it never labels possessor criminal.

### GPR-05 provenance

POST → resolve viewer projection → load immutable identity/claim/transfer/service/theft event projection → filter protected fields → return evidence-labelled ordered chain and does-not-prove-title disclosure. A projection dependency failure returns honest unavailable and never a partial chain.

### GPR-06 duplicate resolution

POST → verify case and candidate key → notify claimants → validate mutual consent or assigned reviewer policy → link or merge under audit, retaining both records/chains, or remain separate. No automatic merge transition exists.

## State Machines, Concurrency and Failure Recovery

| Aggregate | States and transitions | Guard |
|---|---|---|
| gear_record | active → contested, superseded, or withdrawn; prior identity/claim/transfer history remains. | State changes use expected version and append chain event; intent never implies title. |
| gear_identity_key | active → superseded or contested; replacement key is a new row. | Unique active composite hash; corrections never delete old relied-upon key. |
| gear_claim | asserted → provisional → confirmed; any state → contested, superseded, or withdrawn. | Evidence/tier recomputes; silence alone never downgrades. |
| gear_transfer | blocked/contested → completed only after full screen and expected versions; completed → reversed only by new event. | No transfer pass on cannot-check or active flag. |
| gear_duplicate_case | awaiting_consent → linked, merged_under_audit, separate, or blocked. | Consent/reviewer policy and claimant notification required; no auto-merge. |

| Failure | Transaction outcome | Recovery |
|---|---|---|
| Same idempotency key/hash | Replay stored safe result. | No duplicate record, claim, evidence, transfer, notification, or merge. |
| Hash/revision CAS loss | No domain write. | Return CONFLICT and require fresh explicit revision. |
| Entity context missing | No record/key write. | Return ENTITY_CONTEXT_REQUIRED; actor selects entity. |
| Identity key incomplete/conflicting | No replacement activation. | Return typed error; route contested key/duplicate case; old key remains. |
| Claimant notification outage | Claim/evidence commit with notification pending. | Leased notification retries; claim remains visible with notification state. |
| Screening unavailable | Transfer blocked/cannot-check. | Retry 23b screen lookup; never pass or notify a hit. |
| Transfer source ambiguity | No second transfer. | Lookup settlement/handshake by immutable source ref and idempotency key. |
| Projection dependency failure | No source mutation. | Return unavailable projection; retry with same chain revision. |
| Missing duplicate consent | Case awaiting consent/separate. | Notify outstanding claimants or apply only assigned policy; never auto-merge. |
| Outbox/worker crash | Canonical commit remains. | BE00 lease sweeper reclaims and dedupes event/notification. |

## External Seams

No seam is successful without the exact response evidence below. All failures return BE00 ApiError { code, message, requestId, details } and preserve canonical identity/claim/transfer state.

| Seam | Exact request | Exact response | Timeout | Retries/backoff | Circuit behavior |
|---|---|---|---:|---|---|
| BE00 admission/idempotency RPC | operationId, actorId, actingPartyId, targetId, requestHash, idempotencyKeyHash, expectedVersion | reservationId, replay, auditContext, currentVersion | 1,000 ms | 2 attempts at 100 ms and 300 ms before domain write; commit ambiguity uses lookup | Open 30 s after 5 failures in 60 s; fail closed. |
| Shard 01 identity/entity RPC | actorId, entityId, gearId, requiredCapability, expectedPartyVersion | partyId, entityId, controlled boolean, capabilities, partyVersion | 1,200 ms | 1 read retry at 250 ms; no write retry after CAS ambiguity | Open 30 s after 4 failures; FORBIDDEN/DEPENDENCY_UNAVAILABLE, no default entity. |
| Shard 06 claim/reviewer RPC | gearRecordId, claimantPartyId, casePurpose, evidenceRefs, requestedPolicy | caseId, standingState, assignedReviewer, allowedScope, evidenceRevision | 1,500 ms | 1 read retry at 300 ms; no retry for authorization | Open 30 s after 4 failures; claim remains contested/pending. |
| Shard 08 protected identity command | gearRecordId, identityKeyId, currentHolderPartyId, effectiveAt, expectedVersion, idempotencyKey | commandId, linkedRecordId, state accepted/rejected, version | 2,000 ms | 1 pre-commit retry at 300 ms; lookup after ambiguity | Open 60 s after 3 failures; no orphaned cross-shard link. |
| Shard 08 protected ownership-transfer command | gearRecordId, transferId, fromPartyId, toPartyId, effectiveAt, expectedVersion, idempotencyKey | commandId, projectionState accepted/rejected, version | 2,000 ms | 1 retry at 300 ms only before commit; source lookup after ambiguity | Open 60 s after 3 failures; transfer evidence remains append-only. |
| Shard 14 settlement/handshake reader | settlementRef or handshakeRef, gearRecordId, expectedParties | sourceState completed/valid/unknown, fromPartyId, toPartyId, custodyRef, considerationRef | 1,500 ms | 2 reads at 250 ms and 750 ms; no inferential success | Open 30 s after 4 failures; transfer blocked. |
| 23b full composite screening seam | gearRecordId, compositeKeyHash, keyVersion, transferId | screenId, state clear/flagged/disputed/cannot_check, matchedFlagRef, checkedAt | 2,000 ms | 1 read retry at 300 ms; never retry partial key | Open 60 s after 3 failures; cannot-check blocks transfer. |
| Protected notification broker | notificationBatchId, recipientPartyIds, eventType, purpose, safeSummary | batchId, acceptedCount, failedCount, deliveryState | 3,000 ms | 3 attempts at 250 ms, 1,000 ms, 3,000 ms using same batch key | Open 60 s after 5 failures; pending notification is visible, no evidence leak. |

## Events and Async Consumers

### Event envelope

Every outbox event inherits BE00:

~~~ts
type GearEvent = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregateType: "gear_record" | "gear_claim" | "gear_transfer" | "gear_duplicate_case";
  aggregateId: string;
  aggregateVersion: string;
  correlationId: string;
  causationId: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
};
~~~

| Operation ID | Event type | Safe payload | Consumer/delivery rule |
|---|---|---|---|
| BE23A-GPR01 | gear.identity.changed.v1 | gear/key/state/confidence/version | Registry and marketplace; eventId dedupe; no serial/location. |
| BE23A-GPR02 | gear.identity.changed.v1 | gear/key-change/state/version | Reliance projections; prior key remains history. |
| BE23A-GPR03 | gear.claim.changed.v1 | gear/claimant pseudonym/state/tier/version | Chain/transfer; no evidence documents or contact. |
| BE23A-GPR04 | gear.transfer.changed.v1 | gear/transfer/state/version | Chain/marketplace and 23b; no custody/consideration detail. |
| BE23A-GPR05 | No mutation event | Projection audit only | Public/claimant views never publish protected fields. |
| BE23A-GPR06 | gear.identity.changed.v1 and gear.claim.changed.v1 when claims change | case/gear/state/version/consent class | Registry/claim projections; both chains retained. |

Consumers dedupe by eventId and aggregate identity/version. Outbox insert is atomic, leases recover crashes, and no consumer may rewrite 23a identity, claim, transfer, or duplicate evidence. Event emission never asserts legal title.

## Error Handling

### Boundary matrix

| Boundary | Mapping |
|---|---|
| Zod/path/body failure | HTTP 400 INVALID_ARGUMENT with safe field paths and expected type. |
| Missing/expired session | HTTP 401 UNAUTHENTICATED without existence detail. |
| Entity/claim/holder/reviewer capability failure | HTTP 403 FORBIDDEN and denied audit. |
| Hidden or absent record/key/claim/case | HTTP 404 NOT_FOUND, same for wrong-party probes. |
| Revision/idempotency/settlement conflict | HTTP 409 CONFLICT with current version only when visible. |
| Identity gate | HTTP 422 ENTITY_CONTEXT_REQUIRED, IDENTITY_KEY_INCOMPLETE, or IDENTITY_KEY_CONFLICT. |
| Claim/transfer gate | HTTP 422 CLAIM_EVIDENCE_REQUIRED, CLAIM_CONTESTED, TRANSFER_SCREEN_REQUIRED, SCREENING_UNAVAILABLE, FLAG_MATCHED, FLAG_DISPUTED, or CLAIM_CONTESTED. |
| Projection/duplicate gate | HTTP 422 PROJECTION_UNAVAILABLE or MERGE_CONSENT_REQUIRED. |
| Rate limit | HTTP 429 RATE_LIMITED with bounded Retry-After. |
| Cross-shard/notification timeout | HTTP 503 DEPENDENCY_UNAVAILABLE; committed source state remains honest and recoverable. |
| Unhandled error | HTTP 500 INTERNAL; cause remains in provider-native structured logs keyed by requestId. |

### Error invariants

- Every error is ErrorResponse with BE00 ApiError { code, message, requestId, details }. details exclude serials, exact locations, claimant/contact PII, evidence documents, and counterparty data.
- A flagged key does not deny minting; transfer screening is stricter and blocks cannot-check/active flags. Disputed is never rendered stolen.
- Public lookup cannot be used to probe existence, claimants, exact possession, evidence, or contact. Hidden targets return 404.
- Registered failures complete idempotency. No retry duplicates chain event, claim/evidence, transfer, notification, or merge.

## Testing Strategy

| Operation ID | Contract and handler tests | Authorization, persistence, recovery |
|---|---|---|
| BE23A-GPR01 | Intent enum, entity refinement, composite key fields, flagged mint, response confidence/state. | Multiple entities, incomplete/conflicting key, key uniqueness, RLS, protected notice, no-title guarantee. |
| BE23A-GPR02 | Typo/component classification, reliance refs, identity response and hash. | Control 403/404, superseding key, serial-component history, CAS/idempotency, notification retry. |
| BE23A-GPR03 | Evidence/relationship/period, date refinement, tier/state response. | Standing, claimant notification, silence-neutral recompute, contested claim, evidence RLS, replay. |
| BE23A-GPR04 | Source/refinement, expected versions, screen states, transfer response. | Full screen gate, cannot-check/flag block, settlement ambiguity, custody/consideration refs, reversal event. |
| BE23A-GPR05 | Projection enum, chain labels, redaction and disclosure literal. | Public/claimant/holder projections, hidden target 404, no partial leak on dependency failure, rate limit. |
| BE23A-GPR06 | Candidate/consent/policy refinement, decision/state response. | Claimant notifications, reviewer assignment, no auto-merge, retained chains, CAS/replay and RLS. |

### Cross-cutting tests

- Contract tests validate all six request/success schemas and every non-2xx response against ErrorResponse and BE00 ApiError.
- Property tests prove composite-key uniqueness, append-only supersession, evidence-tier recomputation, screening fail-closed behavior, and no-title/public-redaction invariants.
- Integration tests use deterministic Shard 01, 06, 08, 14, 23b and notification fakes with timeout, duplicate, malformed response, and circuit-open cases.
- RLS tests cover anonymous public projection, owner, claimant, holder, wrong party, contributor, reviewer outside case, forged entity ID, stale session, service credential misuse, and evidence over-disclosure.
- Event tests verify atomic outbox, eventId dedupe, lease recovery, protected notice retry, merge consent, and no unrequested title/possession assertion.

## Deepening Passes

| Pass | Result and evidence |
|---|---|
| 1 Source normalization | PASS — GPR-01 through GPR-06 each map one-to-one to a route and exact IA line. |
| 2 Boundary review | PASS — 23a owns identity/claims/transfers; 23b theft/recovery, 23c service/components, 23d value/insurance/discography. |
| 3 Contract deepening | PASS — strict Zod 4 request/success schemas and BE00 ApiError for all six operations. |
| 4 Authorization deepening | PASS — entity, owner, claimant, holder, reviewer and public projection capabilities include 403/404 behavior. |
| 5 Persistence deepening | PASS — every owned model lists SQL type, nullability, CHECK/FK/unique constraints, indexes, forced RLS and grants. |
| 6 Concurrency deepening | PASS — idempotency, version CAS, key uniqueness, notification leases, transfer source uniqueness and no-auto-merge are explicit. |
| 7 Seam deepening | PASS — exact request/response, timeout ms, retry count/backoff and circuit behavior for every seam. |
| 8 Observability deepening | PASS — every operation has audit, metrics, traces, correlation and redaction. |
| 9 Test deepening | PASS — contract, handler, RLS, dependency, property, outbox, projection and recovery tests keyed to each operation. |
| 10 Ambiguity resolution | PASS — micro/macro, two-implementer and devil's-advocate reviews found no unresolved contract choice. |

## Ambiguity Gate

PASS.

- Micro ambiguity: entity selection, intent, composite identity, WJ-ID weakness, correction classification, evidence tier, silence neutrality, transfer source, full screening, projection fields, duplicate consent, CORS, rate limits and ApiError are explicit.
- Macro ambiguity: 23a owns GPR-01 through GPR-06 only. Theft/sighting/screening, service/components, valuation/insurance, and discography are companion owners; dependencies never write 23a source tables outside named RPCs.
- Two-implementer test: one implementer can build handlers from route/contract/control registries; another can build migrations, chain workers, and cross-shard adapters from schema/state/seam tables without a product question.
- Devil's-advocate test: incomplete key, existing flag, claimant silence, competing claim, unavailable screening, settlement ambiguity, projection leak, missing consent, notification outage, and worker crash each have typed recovery.
- Decision lock: minting never grants title, silence never downgrades, cannot-check never passes transfer, disputed never renders stolen, public lookup never leaks protected data, and merge never occurs automatically.

## Open Questions

None.

## Dependency References

- BE00: inherit command admission, idempotency, audit, private schema boundary, RPC-only grants, forced RLS, jobs, outbox leases, CORS baseline, provider-native diagnostics correlation, and ApiError { code, message, requestId, details }. No BE00 route is duplicated.
- Shard 01: consume party/entity resolution and controlled-entity authority; no identity account truth is authored here.
- Shard 06: consume claim/reviewer/case and dispute routes; 23a computes claim state but never adjudicates title or safety.
- Shard 07: consume credit status only in downstream 23d; 23a does not widen credit visibility.
- Shard 08: call protected inbound RecordGearItemIdentity and RecordGearOwnershipTransfer commands with item/version/holder/effective time/idempotency; canonical gear identity and ownership remain 23a.
- Shard 14: consume completed settlement/handshake work-order facts for transfer source validation.
- 23b: consume full composite screening result and theft flag state; 23a blocks transfer on cannot-check/flag but does not own theft lifecycle.
- 23c: consumes identity/transfer history for service/component continuity.
- 23d: consumes claims/history for valuation/appraisal/insurance/discography projections.
- Shards 24-26: consume bounded identity, transfer, claim and screening events; they never write 23a tables directly.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Created BE-23a from approved IA Shard 23 split; mapped GPR-01 through GPR-06; added strict Zod 4 contracts, route-keyed controls, typed SQL/RLS schema, identity/claim/transfer state recovery, seams, events, tests, deepening passes, and ambiguity gate. | /write-be-spec with approved decision delegation. |
