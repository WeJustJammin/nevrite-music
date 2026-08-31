# BE-23b — Theft Screening and Recovery

Status: Complete

This specification turns IA Shard 23 interactions GPR-07 through GPR-10 into four Hono endpoints for theft flags, point-of-transfer screening, protected sightings, and false-flag contests. It owns theft_case, theft_flag, gear_screening, and gear_sighting evidence. It consumes 23a identity/claim/transfer facts and never adjudicates title, exposes possession/location, or labels a possessor criminal.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, theft/recovery subdomain | BE index line 40 assigns 23b theft/recovery; IA interaction table lines 66-77. |
| Backend surface | Authenticated Hono REST commands, precision-limited public screening, protected evidence storage, assigned review jobs, and Supabase RPCs | IA Contracts lines 93-116; Access Control lines 165-187; BE00 Middleware lines 253-297. |
| Canonical owner | 23b owns theft_case, theft_flag, gear_screening, and gear_sighting | IA Data Models lines 127-135 and Typed Field Registry lines 146-157. |
| Consumed authority | 23a owns identity, claims, custody and transfer; Shard 06 owns safety/dispute case adjudication; 23b only records evidence-scoped states | IA Dependency References lines 235-240 and Cross-Shard Map lines 263-273. |
| Split validity | PASS: GPR-07 through GPR-10 form the theft/recovery boundary and do not overlap identity/claim/transfer or service/value companions | IA interactions lines 68-84; approved split row. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Overview lines 7-9 | Theft flags, screening, sightings, disputes, and protected recovery ownership. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Registry Decisions lines 26-35 | Composite keys, theft flag lifecycle, possessor-as-potential-victim and append-only evidence. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Acceptance Criteria lines 45-61 | GPR-07 through GPR-10 outcomes and failure rules. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Interactions lines 74-77 | GPR-07 through GPR-10 preconditions, behavior, completion, failure and recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Global Interaction Rules lines 85-91 | Flagged mint, public lookup precision, privacy, retention and contact broker rules. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Contracts lines 93-116 | TheftFlagState, screening and recovery contracts plus exact error vocabulary. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Data Models lines 123-139 | Theft case/flag, screening and sighting relationships. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Typed Field Registry lines 142-163 | Required core fields, deterministic SQL typing and cardinality. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Access Control lines 165-187 | Public, holder, safety reviewer and service-principal privacy boundaries. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Event Schemas lines 198-213 | Safe theft/sighting payloads and excluded serials, locations and evidence. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Dependency References lines 235-240 and Cross-Shard Map lines 263-273 | BE00, Shards 01, 06, 07, 08, 14, 24, 25 and 26 directions. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Transfer, Theft and Recovery Algorithm lines 29-38 | Full-key fail-closed screening, flag lifecycle, protected sightings and brokered communication. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Abuse and Recovery Verification lines 50-62 | No duplicate identity, no auto-merge, no confrontation, and protected projection proofs. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | BE00 wire conventions, ApiError envelope, command metadata and job contracts. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | Private schema, RPC-only access, RLS, grants, jobs, provider operations, outbox and audit. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, capability checks and CORS. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, leasing and consumer recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error/Observability lines 416-461 | Boundary mapping, compensation, audit, metrics and traces. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| GPR-07 Owner reports theft | IA line 74 | BE23B-GPR07 | Active flag for item/case/bulk scope with evidence strength and optional police reference. |
| GPR-08 Buyer/marketplace screens serial | IA line 75 | BE23B-GPR08 | Clear, flagged, disputed, or cannot-check screening with full-key evidence. |
| GPR-09 Person reports sighting | IA line 76 | BE23B-GPR09 | Protected sighting/moderation/broker action with no public location or contact. |
| GPR-10 Claimant contests false flag | IA line 77 | BE23B-GPR10 | Disputed flag and Shard 06 case route with full transition history. |

### Canonical Data Models

Literal model names from IA Data Models lines 125-139:

gear_record, gear_identity_key, gear_identifier_fact, gear_claim, claim_evidence, gear_chain_event, gear_transfer, gear_duplicate_case, theft_case, theft_flag, gear_screening, gear_sighting, service_event, component_fact, valuation_estimate, appraisal_record, insurance_pack, gear_credit_link.

23b owns theft_case, theft_flag, gear_screening, and gear_sighting. It consumes gear_record, gear_identity_key, gear_identifier_fact, gear_claim, claim_evidence, gear_chain_event, gear_transfer, gear_duplicate_case, service_event, component_fact, valuation_estimate, appraisal_record, insurance_pack, and gear_credit_link through bounded projections or dependency contracts.

### Event Schemas

Literal event names from IA Event Schemas lines 198-211:

gear.identity.changed.v1, gear.claim.changed.v1, gear.transfer.changed.v1, gear.theft-flag.changed.v1, gear.sighting.changed.v1, gear.service.changed.v1, gear.valuation.changed.v1, gear.appraisal.changed.v1, gear.insurance-pack.changed.v1, gear.credit-link.changed.v1.

23b emits gear.theft-flag.changed.v1 and gear.sighting.changed.v1. Screening-only results are protected evidence and emit no public event. Events contain gear/flag/state/weight class/version or case/sighting/state/version only; serials, locations, names/contact, evidence/documents, values and police references stay protected.

## Endpoint Reconciliation

| IA interaction | HTTP operation | Command transaction | Success event |
|---|---|---|---|
| GPR-07 | POST /api/v1/gear/theft-flags | Resolve reporter standing and item/case/bulk scope, append theft case/flag/loss evidence, optionally record police ref, notify protected parties, audit/outbox atomically. | gear.theft-flag.changed.v1 |
| GPR-08 | POST /api/v1/gear/transfer-screenings | Validate full composite key, run matcher only when screenable, retain dependency result and flag projection; cannot-check blocks transfer. | No mutation event; protected screening evidence. |
| GPR-09 | POST /api/v1/gear/theft-cases/:caseId/sightings | Verify active/disputed flag, collect minimum protected facts, moderate abuse, and broker safe communication. | gear.sighting.changed.v1 |
| GPR-10 | POST /api/v1/gear/theft-flags/:flagId/contests | Verify claimant standing, append contest evidence, mark disputed everywhere, and open Shard 06 case without adjudicating. | gear.theft-flag.changed.v1 |

## API Endpoints

### Authoritative Route Registry

This is the only 23b route registry. Operation IDs are stable keys for every contract, error, authorization, idempotency, rate, observability and test row. 23a, 23c, 23d and BE00 routes are inherited and not duplicated.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE23B-GPR07 | POST | /api/v1/gear/theft-flags | gear.theft_report | Gpr07Success |
| BE23B-GPR08 | POST | /api/v1/gear/transfer-screenings | gear.transfer_screen | Gpr08Success |
| BE23B-GPR09 | POST | /api/v1/gear/theft-cases/:caseId/sightings | gear.sighting_report | Gpr09Success |
| BE23B-GPR10 | POST | /api/v1/gear/theft-flags/:flagId/contests | gear.flag_contest | Gpr10Success |

### Request/Response Contracts (Zod 4)

Every non-2xx response is ErrorResponse containing the BE00/global ApiError { code, message, requestId, details }. Unknown keys are rejected and UUID route parameters are parsed before lookup.

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
const ApiError = z.object({
  code: z.string().min(1), message: z.string().min(1),
  requestId: Uuid, details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();
const TheftFlagState = z.enum(["active", "stale", "disputed", "withdrawn", "resolved"]);
const CompositeKey = z.object({
  manufacturer: z.string().min(1).max(256),
  model: z.string().min(1).max(256),
  serial: z.string().min(1).max(256),
  secondaryIdentifiers: z.array(z.string().min(1).max(256)).max(20),
  locationFacts: z.array(z.string().min(1).max(256)).max(20),
}).strict();

const Gpr07Request = z.object({
  reporterPartyId: Uuid.optional(),
  scope: z.enum(["item", "case", "rig", "bulk"]),
  gearRecordIds: z.array(Uuid).min(1).max(1000),
  lossOccurredAt: DateTime,
  lossDescription: z.string().min(1).max(2000),
  policeReference: z.string().min(1).max(256).optional(),
  evidenceRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  idempotencyKey: IdempotencyKey,
}).strict();
const Gpr07Success = z.object({
  theftCaseId: Uuid, flagIds: z.array(Uuid).min(1),
  state: z.literal("active"),
  evidenceStrength: z.enum(["limited", "substantial", "strong"]),
  policeReferenceRecorded: z.boolean(), version: Version,
}).strict();

const Gpr08Request = z.object({
  gearRecordId: Uuid, transferId: Uuid,
  identity: CompositeKey, idempotencyKey: IdempotencyKey,
}).strict();
const Gpr08Success = z.object({
  screeningId: Uuid,
  state: z.enum(["clear", "flagged", "disputed", "cannot_check"]),
  screenable: z.boolean(), flagId: Uuid.optional(),
  compositeKeyVersion: Version, checkedAt: DateTime, version: Version,
}).strict();

const Gpr09Request = z.object({
  caseId: Uuid, flagId: Uuid, observedAt: DateTime,
  coarseLocation: z.string().min(1).max(256),
  locationPrecision: z.enum(["coarse", "approximate"]),
  evidenceRefs: z.array(z.string().min(1).max(256)).min(1).max(20),
  abuseDisclosure: z.literal(true), idempotencyKey: IdempotencyKey,
}).strict();
const Gpr09Success = z.object({
  sightingId: Uuid,
  state: z.enum(["submitted", "moderation_hold", "brokered", "rejected"]),
  protected: z.literal(true), nextActionAt: DateTime.optional(), version: Version,
}).strict();

const Gpr10Request = z.object({
  flagId: Uuid, gearRecordId: Uuid,
  standingRef: z.string().min(1).max(256),
  evidenceRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  idempotencyKey: IdempotencyKey,
}).strict();
const Gpr10Success = z.object({
  theftFlagId: Uuid, state: TheftFlagState, caseId: Uuid,
  contestOutcome: z.enum(["disputed", "withdrawn", "upheld", "stale"]),
  version: Version,
}).strict();
~~~

### Contract Registry

| Operation ID | Request body | Success body | Canonical validation |
|---|---|---|---|
| BE23B-GPR07 | Gpr07Request | Gpr07Success | Reporter standing, item/case/bulk scope and loss facts; police reference is optional. |
| BE23B-GPR08 | Gpr08Request | Gpr08Success | Full composite key required; partial key never reaches matcher; dependency failure cannot pass. |
| BE23B-GPR09 | Gpr09Request | Gpr09Success | Active/disputed flag, protected minimum facts and abuse disclosure; communication brokered. |
| BE23B-GPR10 | Gpr10Request | Gpr10Success | Standing/evidence required; dispute is recorded and routed, not adjudicated. |

### Error Registry

Every row returns ErrorResponse with BE00 ApiError { code, message, requestId, details }. details contain safe target, key version, evidence class, moderation state, or remediation owner only.

| Operation ID | 400 / 401 | 403 vs 404 | 409 | 422 domain errors | 429 / 5xx recovery |
|---|---|---|---|---|---|
| BE23B-GPR07 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without item/custody standing; NOT_FOUND hides record/scope | CONFLICT on flag/case revision | THEFT_SCOPE_REQUIRED, LOSS_FACTS_REQUIRED | RATE_LIMITED; no partial flag if scope/evidence invalid. |
| BE23B-GPR08 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN outside transfer assignment; NOT_FOUND hides record/transfer | CONFLICT on screening/key revision | IDENTITY_KEY_INCOMPLETE, SCREENING_UNAVAILABLE, FLAG_MATCHED, FLAG_DISPUTED | RATE_LIMITED; cannot-check blocks and is retained. |
| BE23B-GPR09 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN for direct protected access; NOT_FOUND hides case/flag | CONFLICT on case revision | MODERATION_REQUIRED, SIGHTING_SCOPE_INVALID | RATE_LIMITED; moderation hold, no publication. |
| BE23B-GPR10 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without claimant standing; NOT_FOUND hides flag/case | CONFLICT on flag/evidence revision | FLAG_DISPUTED, CLAIM_CASE_REQUIRED | RATE_LIMITED; disputed state retained, no silent clear/reinstate. |

### Authorization and Middleware Registry

Each operation runs request ID/trace, authenticated session or bounded anonymous projection, acting-party/standing resolution, explicit CORS policy, rate limit, Zod validation, BE00 idempotency, named RPC/seam, audit and outbox in that order.

| Operation ID | Roles and ownership | 403 rule | 404 rule | Middleware and CORS |
|---|---|---|---|---|
| BE23B-GPR07 | Owner, qualifying holder, or assigned custody reporter with gear.theft_report. | FORBIDDEN without standing on every requested item. | NOT_FOUND hides records, cases and protected scope. | auth → standing → CORS gear-api (allowlisted origins, no wildcard credentials) → rate → Zod → idempotency → RPC. |
| BE23B-GPR08 | Assigned marketplace operator/service principal at transfer; no general flag browsing. | FORBIDDEN outside transfer/gear assignment. | NOT_FOUND hides record, transfer, key and match. | auth → assignment → CORS gear-api → rate → Zod → idempotency → screening RPC. |
| BE23B-GPR09 | Reporter submits to active/disputed case; safety reviewer controls moderation; broker controls contact. | FORBIDDEN for direct owner/possessor contact or protected sighting read. | NOT_FOUND hides case, flag, and reporter details. | auth/limited intake → CORS gear-api (public intake allowlist) → rate → Zod → idempotency → moderation RPC. |
| BE23B-GPR10 | Claimant or party with record standing; assigned Shard 06 reviewer may route case. | FORBIDDEN for party without standing or reviewer outside case. | NOT_FOUND hides flag, claim and evidence. | auth → standing/case assignment → CORS gear-api → rate → Zod → idempotency → RPC. |

### Idempotency and Concurrency Registry

| Operation ID | Key and replay | Version/CAS | Failure recovery |
|---|---|---|---|
| BE23B-GPR07 | Actor/operation/request hash binds scope, item set, loss facts and evidence; replay returns same case/flags. | Case/flag CAS; one active flag per gear/case/scope revision. | Notification outage leaves committed flag with retry; invalid item rolls back entire batch. |
| BE23B-GPR08 | Key binds transfer, gear, composite-key hash and key version. | Screening decision immutable; dependency result and checked key version cannot be overwritten. | Matcher outage returns cannot_check; no transfer pass or hit/notification on incomplete key. |
| BE23B-GPR09 | Key binds case/flag, observed time, coarse location and evidence digest. | Sighting append-only; moderation/broker state CAS. | Provider/moderation outage holds privately; no public location/contact. |
| BE23B-GPR10 | Key binds flag, gear, standing and evidence digest. | Flag state and contest case CAS; contest history append-only. | Shard 06 outage leaves disputed request pending; no silent clear or reinstatement. |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | SLO |
|---|---|---|---|
| BE23B-GPR07 | 10/minute per actor and theft case, burst 2 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding notifications. |
| BE23B-GPR08 | 60/minute per transfer/service principal, burst 10 | gear-api, public precision-limited projection, POST/OPTIONS | p95 ≤ 1,000 ms excluding matcher lookup. |
| BE23B-GPR09 | 5/minute per reporter/IP and case, burst 1 | gear-api, public intake allowlist, POST/OPTIONS | p95 ≤ 1,500 ms to protected intake. |
| BE23B-GPR10 | 10/minute per claimant and flag, burst 2 | gear-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding Shard 06 case route. |

### Observability Registry

| Operation ID | Audit | Metrics | Trace and redaction |
|---|---|---|---|
| BE23B-GPR07 | gear.theft_flag.filed with reporter standing, scope, evidence class and decision | theft_flag_total by state/scope; theft_case_total; standing_denied_total | IDs/hash/counts only; serial, police ref, loss location and claimant contact redacted. |
| BE23B-GPR08 | gear.screening.completed with key version, dependency state and match class | gear_screening_total by state; screening_unavailable_total; partial_key_total | Key hash/transfer ID/state; raw serial, matcher payload and flag evidence excluded. |
| BE23B-GPR09 | gear.sighting.submitted/held/brokered with case, moderation and protection state | sighting_total by state; moderation_hold_total; broker_action_total | Coarse region/time bucket/evidence hash; exact location, reporter identity and contact excluded. |
| BE23B-GPR10 | gear.theft_flag.contested with case, standing and outcome | contested_flag_total by outcome; contest_case_total | Flag/case/evidence hashes; claimant identity, documents and direct contact excluded. |

## Database Schema

All tables are in non-exposed platform_private with RLS enabled and forced. anon and browser direct table grants are denied. Named security-invoker RPCs repeat item/custody standing, transfer assignment, reviewer case assignment, protected intake, and projection predicates. owner_id references identity.party(id); raw locations and contacts are never public.

| Table/model | All persistence fields with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.theft_cases / theft_case | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); reporter_party_id uuid NOT NULL FK identity.party(id); scope theft_scope NOT NULL CHECK IN item,case,rig,bulk; gear_record_ids uuid[] NOT NULL CHECK cardinality>0; loss_occurred_at timestamptz NOT NULL; loss_description text NOT NULL CHECK length>0; police_reference text NULL; evidence_refs text[] NOT NULL CHECK cardinality>0; evidence_strength evidence_strength NOT NULL CHECK IN limited,substantial,strong; state theft_case_state NOT NULL CHECK IN active,stale,disputed,withdrawn,resolved; contest_case_id uuid NULL FK trust.cases(id); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique reporter_party_id,loss_occurred_at,scope,gear_record_ids hash | PK; reporter_party_id,created_at DESC; state,updated_at; GIN gear_record_ids; contest_case_id | Forced RLS reporter/owner and assigned safety reviewer; public receives state projection only; police/evidence refs purpose-bound; no direct table grants. |
| platform_private.theft_flags / theft_flag | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); theft_case_id uuid NOT NULL FK platform_private.theft_cases(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); composite_key_hash bytea NOT NULL CHECK octet_length(composite_key_hash)=32; state theft_flag_state NOT NULL CHECK IN active,stale,disputed,withdrawn,resolved; evidence_strength evidence_strength NOT NULL CHECK IN limited,substantial,strong; loss_context jsonb NOT NULL; police_reference text NULL; dispute_case_id uuid NULL FK trust.cases(id); staleness_reason text NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique theft_case_id,gear_record_id | PK; gear_record_id,state; composite_key_hash,state; theft_case_id; dispute_case_id; state,updated_at DESC | Forced RLS case parties and assigned reviewer; marketplace receives matched/disputed projection only; active flag does not prevent evidence-preserving mint; lifecycle changes append-only; no direct grant. |
| platform_private.gear_screenings / gear_screening | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); transfer_id uuid NOT NULL FK platform_private.gear_transfers(id); composite_key_hash bytea NOT NULL CHECK octet_length(composite_key_hash)=32; composite_key_version bigint NOT NULL CHECK >0; dependency_result screening_dependency_state NOT NULL CHECK IN reachable,unavailable,malformed; state screening_state NOT NULL CHECK IN clear,flagged,disputed,cannot_check; matched_flag_id uuid NULL FK platform_private.theft_flags(id); checked_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique transfer_id,composite_key_version | PK; transfer_id; gear_record_id,checked_at DESC; state,checked_at; matched_flag_id | Forced RLS assigned marketplace/service principal and transfer parties; immutable screening evidence; partial key is rejected before matcher; no general flag/evidence read. |
| platform_private.gear_sightings / gear_sighting | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); theft_case_id uuid NOT NULL FK platform_private.theft_cases(id); theft_flag_id uuid NOT NULL FK platform_private.theft_flags(id); reporter_party_id uuid NULL FK identity.party(id); observed_at timestamptz NOT NULL; coarse_location text NOT NULL CHECK length>0; protected_location_object_id uuid NULL FK platform_private.object_records(id); location_precision location_precision NOT NULL CHECK IN coarse,approximate; evidence_refs text[] NOT NULL CHECK cardinality>0; abuse_state moderation_state NOT NULL CHECK IN pending,clear,hold,rejected; state sighting_state NOT NULL CHECK IN submitted,moderation_hold,brokered,rejected; broker_case_id uuid NULL FK trust.cases(id); protection_state protection_state NOT NULL CHECK IN protected,redacted; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() | PK; theft_case_id,observed_at DESC; theft_flag_id,state; abuse_state,updated_at; broker_case_id; protected_location_object_id | Forced RLS reporter, owner through broker, and assigned safety reviewer; public and possessor receive no row/location/contact; broker has purpose grant only; no direct authenticated table grant. |

### Shared persistence invariants

- Every mutation reserves inherited BE00 idempotency with actor, operation, request hash, and target. Domain state, audit, notification, case route, and outbox commit atomically.
- Theft flags may cover one item, case, rig, or bulk selection. Police reference is optional and strengthens evidence; it never gates filing.
- Screening requires the full composite identity key. Partial key is not-screenable and never queries the matcher, creates a hit, or notifies anyone.
- Active flags block or route transfer; disputed flags render disputed everywhere and never stolen. Cannot-check blocks transfer rather than passing.
- Sightings retain minimum protected time/location/evidence, use abuse moderation and brokered communication, and never expose exact location, reporter, owner, possessor, or direct contact.
- authenticated has no direct table grant; named RPCs repeat ownership/standing/assignment predicates. Service principals may perform only a named screening/projection purpose.

## Middleware & Policies

### Hono order and security

1. Attach request ID, trace ID, operation ID, bounded body limit, and correlation context.
2. Apply CORS policy gear-api: explicit allowlisted product origins, POST and OPTIONS only, no wildcard credential mode, Vary: Origin.
3. Authenticate session or bounded intake; resolve item/custody standing, transfer assignment, case party, reviewer assignment, and purpose grant.
4. Apply operation/actor/IP/case rate limit.
5. Validate path/body with the operation Zod 4 schema; reject unknown keys before existence-sensitive lookup.
6. Reserve inherited BE00 idempotency; request-hash mismatch returns CONFLICT without side effects.
7. Call named security-invoker RPC, matcher, reviewer or broker seam with expected revision/lease.
8. Append audit/outbox/notification work atomically; return only the Success schema.

### Policy rules

| Policy | Required behavior |
|---|---|
| Theft filing | Reporter must have ownership or qualifying custody standing for every item. Bulk scope is explicit; absence of police reference is neutral. |
| Flag lifecycle | Active, stale, disputed, withdrawn, and resolved are states, not deletion. Disputed never renders stolen. |
| Transfer screening | Full manufacturer/model/serial/secondary/location key required. Dependency failure returns cannot-check and blocks. |
| Match handling | Active match blocks/routes case; disputed match labels disputed; the screening service never adjudicates title or criminality. |
| Sighting privacy | Store only protected minimum and coarse projection; exact location/evidence/contact uses purpose grant and broker. |
| Possessor safety | Address possessor as possible victim. No direct owner/possessor identity, contact, confrontation, or public location workflow. |
| Contest | Standing claimant evidence opens Shard 06 case; platform records contest and does not adjudicate. |
| Protected data | Events/logs expose IDs, state, evidence class and coarse counts only; serials, police refs, documents, exact locations and contact are excluded. |

## Data Flow

### GPR-07 theft flag

POST → authenticate reporter/standing → validate item/case/rig/bulk scope and loss facts → append theft_case/flags/evidence state → optionally record police reference → notify protected parties → audit/outbox → Gpr07Success. Existing flag does not reject evidence-preserving mint.

### GPR-08 transfer screening

POST → validate complete composite key → load 23a gear/transfer assignment → run matcher → persist immutable screening with key version/dependency result → return clear/flagged/disputed/cannot-check. Partial key exits before matcher; unavailable blocks the 23a transfer.

### GPR-09 sighting

POST → verify active/disputed flag and reporter intake → accept minimum protected facts → moderation/abuse review → broker safe contact or hold/reject → append sighting/event. Public/possessor projections never include exact location or reporter contact.

### GPR-10 contest

POST → verify claimant standing → append contest evidence and disputed flag state → open/attach Shard 06 case → notify scoped parties → return contest outcome. Withdrawn/upheld/stale history remains; no silent clear or reinstatement.

## State Machines, Concurrency and Failure Recovery

| Aggregate | States and transitions | Guard |
|---|---|---|
| theft_case | active → stale, disputed, withdrawn, or resolved; disputed route may receive new evidence. | Reporter standing and scope required; transitions append evidence. |
| theft_flag | active → stale, disputed, withdrawn, or resolved. | State is system-controlled from evidence/case lifecycle; disputed never stolen. |
| gear_screening | requested → clear, flagged, disputed, or cannot_check. | Full key/version and matcher/dependency result immutable. |
| gear_sighting | submitted → moderation_hold, brokered, or rejected. | Protected minimum, abuse review and broker path required. |

| Failure | Transaction outcome | Recovery |
|---|---|---|
| Same idempotency key/hash | Replay case/flag/screen/sighting/contest result. | No duplicate flag, matcher hit, sighting, notification, or contest. |
| Hash/revision CAS loss | No domain write. | Return CONFLICT and require fresh evidence/version. |
| Scope/standing failure | No flag or evidence write. | Return typed 403/422; hidden targets remain 404. |
| Matcher receives partial key | No dependency call. | Return IDENTITY_KEY_INCOMPLETE and not-screenable. |
| Matcher/database unavailable | Screening cannot_check and transfer blocked. | Retry according to seam; never pass or fabricate hit. |
| Notification/broker outage | Flag/contest/sighting evidence committed with pending work. | Leased retry with protected payload; no direct contact fallback. |
| Abuse moderation outage | Sighting remains private moderation_hold. | Reviewer lease resumes; never publish. |
| Shard 06 contest outage | Disputed evidence retained and case route pending. | Retry assigned case seam; never clear or reinstate. |
| Outbox/worker crash | Canonical commit remains. | BE00 lease sweeper reclaims and dedupes. |

## External Seams

No seam is successful without the exact response evidence below. All failures return BE00 ApiError { code, message, requestId, details } and preserve canonical state.

| Seam | Exact request | Exact response | Timeout | Retries/backoff | Circuit behavior |
|---|---|---|---:|---|---|
| BE00 admission/idempotency RPC | operationId, actorId, actingPartyId, targetId, requestHash, idempotencyKeyHash, expectedVersion | reservationId, replay, auditContext, currentVersion | 1,000 ms | 2 attempts at 100 ms and 300 ms; commit ambiguity uses lookup | Open 30 s after 5 failures in 60 s; fail closed. |
| 23a identity/claim/custody RPC | gearRecordId, transferId, requestedKeyVersion, actorPartyId, purpose | gearRecordId, keyHash, keyVersion, claimState, custodyState, assignmentState | 1,200 ms | 1 read retry at 250 ms; no authorization retry | Open 30 s after 4 failures; screening/flag action blocks. |
| Shard 06 theft/contest case RPC | theftCaseId, flagId, requestedScope, evidenceRefs, reviewerPartyId, purpose | caseId, assignedReviewer, supportedScope, contestState, evidenceRevision, contestRoute | 1,500 ms | 1 read retry at 300 ms; no write retry after CAS ambiguity | Open 30 s after 4 failures; disputed/pending retained. |
| Composite-key flag matcher | compositeKeyHash, keyVersion, transferId, destinationPurpose | screeningId, state clear/flagged/disputed, matchedFlagId or null, checkedAt, dependencyState | 2,000 ms | 1 read retry at 300 ms; never call partial key | Open 60 s after 3 failures; cannot_check blocks. |
| 23a transfer admission seam | gearRecordId, transferId, screeningId, screeningState, expectedClaimVersion, expectedCustodyVersion | transferAdmission accepted/blocked, currentVersions, reasonCode | 1,500 ms | 1 pre-commit retry at 300 ms; lookup after ambiguity | Open 30 s after 4 failures; no transfer pass on unavailable. |
| Protected notification broker | notificationBatchId, recipientPartyIds, eventType, safeSummary, purpose | batchId, acceptedCount, failedCount, deliveryState | 3,000 ms | 3 attempts at 250 ms, 1,000 ms and 3,000 ms with same key | Open 60 s after 5 failures; pending protected retry. |
| Abuse moderation/broker | sightingId, coarseRegion, evidenceDigest, caseId, safeContactRequest | moderationState clear/hold/rejected, brokerCaseId, nextActionAt | 2,500 ms | 2 attempts at 300 ms and 900 ms; no direct-contact fallback | Open 60 s after 4 failures; private hold. |

## Events and Async Consumers

### Event envelope

Every outbox event inherits BE00:

~~~ts
type GearEvent = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregateType: "theft_case" | "theft_flag" | "gear_screening" | "gear_sighting";
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
| BE23B-GPR07 | gear.theft-flag.changed.v1 | gear/flag/state/weight class/version | Screening/cases; no serial/police/location/evidence. |
| BE23B-GPR08 | No mutation event | Protected screening audit only | Transfer gate consumes result through scoped seam; no public match event. |
| BE23B-GPR09 | gear.sighting.changed.v1 | case/sighting/state/version | Protected recovery; no location/contact. |
| BE23B-GPR10 | gear.theft-flag.changed.v1 | gear/flag/state/weight class/version | Chain/marketplace/Shard 06; disputed remains disputed. |

Consumers dedupe by eventId and aggregate identity/version. Outbox insert is atomic, lease expiry recovers crashes, and no consumer may rewrite flag/screening/sighting evidence. A flag event never asserts legal title or criminality.

## Error Handling

### Boundary matrix

| Boundary | Mapping |
|---|---|
| Zod/path/body failure | HTTP 400 INVALID_ARGUMENT with safe field paths and expected type. |
| Missing/expired session | HTTP 401 UNAUTHENTICATED without existence detail. |
| Standing/assignment/reviewer/broker capability failure | HTTP 403 FORBIDDEN and denied audit. |
| Hidden/absent record/case/flag/transfer | HTTP 404 NOT_FOUND, same for wrong-party probes. |
| Revision/idempotency/source conflict | HTTP 409 CONFLICT with current version only when visible. |
| Theft/identity gate | HTTP 422 THEFT_SCOPE_REQUIRED, LOSS_FACTS_REQUIRED, IDENTITY_KEY_INCOMPLETE, FLAG_MATCHED, FLAG_DISPUTED, or CLAIM_CASE_REQUIRED. |
| Dependency/moderation gate | HTTP 422 SCREENING_UNAVAILABLE, MODERATION_REQUIRED, or SIGHTING_SCOPE_INVALID. |
| Rate limit | HTTP 429 RATE_LIMITED with bounded Retry-After. |
| Matcher/Shard 06/notification/broker timeout | HTTP 503 DEPENDENCY_UNAVAILABLE; cannot-check/pending private state retained. |
| Unhandled error | HTTP 500 INTERNAL; cause remains in provider-native structured logs keyed by requestId. |

### Error invariants

- Every error is ErrorResponse with BE00 ApiError { code, message, requestId, details }. details exclude serials, exact locations, police refs, claimant/contact PII, evidence documents and provider payloads.
- A partial key never queries the matcher. An unavailable matcher never passes transfer. Active and disputed flags use distinct explicit outcomes.
- Sighting moderation and broker failure never publishes location or initiates direct contact. A contest failure never silently clears or reinstates a flag.
- Registered failures complete idempotency; retries cannot duplicate flags, screenings, sightings, notices, cases, or events.

## Testing Strategy

| Operation ID | Contract and handler tests | Authorization, persistence, recovery |
|---|---|---|
| BE23B-GPR07 | Scope/loss/evidence fields, optional police reference, active response and evidence strength. | Standing per bulk item, flag uniqueness, RLS, notification retry, stale/disputed/withdrawn lifecycle, no mint denial. |
| BE23B-GPR08 | Full composite key, screen states, screenable boolean, matched flag and key version response. | Partial key no matcher, dependency outage blocks, active/disputed outcomes, immutable decision, operator assignment. |
| BE23B-GPR09 | Protected minimum, coarse precision, abuse disclosure, moderation/broker states. | Direct-contact 403, hidden case 404, private location RLS, moderation outage hold, no public publication. |
| BE23B-GPR10 | Standing/evidence fields, disputed outcome and Shard 06 case ref. | Assigned-case RLS, contest CAS, disputed-everywhere projection, outage pending, no silent clear/reinstate. |

### Cross-cutting tests

- Contract tests validate all four request/success schemas and every non-2xx response against ErrorResponse and BE00 ApiError.
- Property tests prove partial keys never query, cannot-check never passes, disputed never renders stolen, locations never publish, and state transitions remain append-only.
- Integration tests use deterministic 23a, Shard 06, matcher, notification, moderation and broker fakes with timeout, duplicate, malformed response and circuit-open cases.
- RLS tests cover anonymous bounded projection, owner, holder, reporter, claimant, wrong party, unassigned reviewer, forged item, stale session, service credential misuse and evidence/location over-disclosure.
- Event tests verify atomic outbox, eventId dedupe, lease recovery, protected notification retry, and absence of screening-only public events.

## Deepening Passes

| Pass | Result and evidence |
|---|---|
| 1 Source normalization | PASS — GPR-07 through GPR-10 each map one-to-one to a route and exact IA line. |
| 2 Boundary review | PASS — 23b owns theft/recovery; 23a identity/claims/transfers and 23c/23d later evidence domains remain separate. |
| 3 Contract deepening | PASS — strict Zod 4 request/success schemas and BE00 ApiError for all four operations. |
| 4 Authorization deepening | PASS — reporter, operator, reviewer, claimant, holder, broker and public projection capabilities include 403/404 behavior. |
| 5 Persistence deepening | PASS — every owned model lists SQL type, nullability, CHECK/FK/unique constraints, indexes, forced RLS and grants. |
| 6 Concurrency deepening | PASS — idempotency, version CAS, screening key uniqueness, protected moderation, notification leases and dispute append-only history are explicit. |
| 7 Seam deepening | PASS — exact request/response, timeout ms, retry count/backoff and circuit behavior for every seam. |
| 8 Observability deepening | PASS — every operation has audit, metrics, traces, correlation and redaction. |
| 9 Test deepening | PASS — contract, handler, matcher, reviewer, broker, RLS, property, outbox and recovery tests keyed to each operation. |
| 10 Ambiguity resolution | PASS — micro/macro, two-implementer and devil's-advocate reviews found no unresolved contract choice. |

## Ambiguity Gate

PASS.

- Micro ambiguity: scope/standing, police optionality, full composite key, not-screenable, cannot-check, active/disputed rendering, protected location, brokered contact, evidence scope, contest state, CORS, rate limits and ApiError are explicit.
- Macro ambiguity: 23b owns only GPR-07 through GPR-10. 23a remains identity/claim/transfer authority; 23c service/components and 23d valuation/insurance/discography do not write theft evidence.
- Two-implementer test: one implementer can build handlers from route/contract/control registries; another can build migrations, matcher/reviewer/broker workers and cross-shard adapters from schema/state/seam tables without a product question.
- Devil's-advocate test: incomplete key, provider outage, active match, disputed match, false flag, direct-contact attempt, exact-location leak, moderation outage, contest outage, and worker crash each have typed recovery.
- Decision lock: police reference is optional, partial key never screens, unavailable screening never passes, disputed never renders stolen, sightings never enable confrontation, and the platform never adjudicates title.

## Open Questions

None.

## Dependency References

- BE00: inherit command admission, idempotency, audit, private schema boundary, RPC-only grants, forced RLS, jobs, outbox leases, CORS baseline, provider-native diagnostics correlation, and ApiError { code, message, requestId, details }. No BE00 route is duplicated.
- 23a: consume gear identity/key, claim, custody and transfer facts; return screening admission through a protected seam. 23b never rewrites identity or title.
- Shard 01: consume party/entity and protected-contact authority; no owner/contact identity is exposed here.
- Shard 06: open assigned theft/false-flag/sighting dispute case and consume reviewer scope; 23b records evidence and state but never adjudicates.
- Shard 07: consume no credit authority; downstream gear-credit projections remain bounded.
- Shard 08: identity/ownership inbound commands remain owned by 23a; screening state is a dependency for downstream reporting.
- Shard 14: transfer source remains settlement/handshake authority; 23b only screens at point of transfer.
- 23c and 23d: consume theft/flag/sighting states for service, value, insurance and discography projections without direct table access.
- Shards 24-26: consume bounded flag/screening/sighting events; transfer checkout blocks on cannot-check and never treats disputed as stolen.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Created BE-23b from approved IA Shard 23 split; mapped GPR-07 through GPR-10; added strict Zod 4 contracts, route-keyed controls, typed SQL/RLS schema, fail-closed screening, protected recovery, seams, events, tests, deepening passes, and ambiguity gate. | /write-be-spec with approved decision delegation. |
