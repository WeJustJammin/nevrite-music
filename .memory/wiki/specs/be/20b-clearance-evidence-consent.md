# Clearance Evidence and Consent — Backend Specification

## Split Group

Shard 20 licensing core, split 20b. This companion owns completeness attestations, corroboration, contributor encumbrance declarations, fresh clearance snapshots and consent routing for LIC-05 through LIC-08. It owns evidence and consent state, not source work/rights truth, owner policy, quote, instrument or lifecycle authority.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| LIC-05 completeness evidence | Immutable evidence command | A verified attestor pins a party-list version, side, authority and knowledge basis; supersession preserves history and grade never becomes consent. |
| LIC-06 encumbrance | Own-work declaration command | A credited contributor may declare only their own work or material with a scope ceiling; fingerprinting can prompt privately but cannot declare or accuse. |
| LIC-07 clearance | Fresh query plus snapshot command | A complete LicenceScope is evaluated against bitemporal rights, consent, evidence, encumbrance, holds and policy versions with fail-closed precedence. |
| LIC-08 consent routing | Coordinated command | All derived standing parties receive one simultaneous plain-language request naming their stakes; nonresponse never improves clearance and partial approval cannot make a deal. |

BE00 inheritance is mandatory: requestId, acting context, strict Zod 4 schemas, idempotency ledger, audit/outbox, rate limits, RLS and ApiError { code, message, requestId, details } apply to every operation. This companion does not redeclare platform endpoints.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 20](../ia/20-licensing-core.md) | Interactions, lines 64–75 | Normative evidence, encumbrance, clearance and consent preconditions, behavior and recovery. |
| [IA Shard 20](../ia/20-licensing-core.md) | Contracts, lines 99–119 | LicenceScope, ClearanceVerdict, EvidenceGrade, ConsentState, ComputeClearance, CreateCompletenessAttestation, DeclareEncumbrance and RouteConsent. |
| [IA Shard 20](../ia/20-licensing-core.md) | Data Models, lines 133–143 and 157–182 | completeness_attestation, corroboration, encumbrance_declaration, clearance_snapshot, consent_request and consent_decision fields and invariants. |
| [IA Shard 20](../ia/20-licensing-core.md) | Access Control, lines 184–206 | Verified attestor, credited contributor, owner, buyer and reviewer boundaries and escalation. |
| [IA Shard 20](../ia/20-licensing-core.md) | Event Schemas, lines 217–232 | Evidence, clearance and consent event payloads and privacy exclusions. |
| [IA Shard 20](../ia/20-licensing-core.md) | Edge Cases and matrices, lines 234–297 | Contest, retraction, erased party, unknown verdict, partial approval, concurrent access and deletion behavior. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Scope and Clearance Algorithm, lines 18–27 | Complete scope, explicit territory, standing parties, precedence and audience-safe projection. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Evidence, Encumbrance and Consent Algorithm, lines 29–38 | Attestation floor, contest, own-work declaration, ceiling intersection and simultaneous consent. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Abuse and Recovery Verification, lines 73–85 | Cached badge, silence-as-approval, blocker bypass, certificate and issued-scope safeguards. |
| [BE00](00-infrastructure.md) | Contracts, middleware and deterministic protocol rules | Global error envelope, actor context, replay hash, audit/outbox, CORS, fail-closed and retention inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| LIC-05 Owner/participant attests catalogue completeness | LIC-CLR-API-01 | Pins immutable party-list version, side, verified attestor, authority and knowledge basis; contest invalidates and supersession preserves prior evidence. |
| LIC-06 Contributor declares encumbrance | LIC-CLR-API-02 | Accepts own-work/material declaration with source, scope ceiling and EvidenceGrade; no accusation or notification; retraction supersedes. |
| LIC-07 Buyer requests clearance | LIC-CLR-API-03 | Requires complete pinned LicenceScope, derives standing parties, loads fresh bitemporal facts and folds unknown above blocked through clearable_now. |
| LIC-08 System routes consent | LIC-CLR-API-04 | Sends one request per verified person simultaneously with plain-language scope, price, deadline and legal appendix; pending or partial approval cannot clear. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| LIC-05 | Record completeness evidence and corroboration | LIC-CLR-API-01 | Immutable attestation keyed to party-list version and side with contest/supersession state. |
| LIC-06 | Record own-work encumbrance declaration | LIC-CLR-API-02 | Attributable declaration with scope ceiling, grade and retraction supersession. |
| LIC-07 | Evaluate fresh clearance | LIC-CLR-API-03 | Bitemporal versions, required-side verdicts, dominant precedence and audience-safe remedy snapshot. |
| LIC-08 | Route and collect consent decisions | LIC-CLR-API-04 | Simultaneous one-person-per-request routing, immutable decision sequence and no partial deal. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every operation row in the contract, error, middleware and test matrices keys to these IDs.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| LIC-CLR-API-01 | POST | /api/v1/licensing/completeness-attestations | LIC-05 | Verified attestor with authority on the named rights side or assigned evidence operator. | 201 CreateCompletenessAttestationSuccess |
| LIC-CLR-API-02 | POST | /api/v1/licensing/encumbrances | LIC-06 | Credited contributor acting on their own work or material. | 201 DeclareEncumbranceSuccess |
| LIC-CLR-API-03 | POST | /api/v1/licensing/clearance-requests | LIC-07 | Buyer or mandate representative requests own named scope; assigned licensing operator may run scoped evaluation. | 200 ComputeClearanceSuccess |
| LIC-CLR-API-04 | POST | /api/v1/licensing/consent-requests | LIC-08 | Licensing service routes only derived standing parties; party acts only on their own consent. | 201 RouteConsentSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 02 verified-identity/evidence resolver | {personId, authorityRef, evidenceRefs, asOf} → {verifiedPerson, identityState, evidenceGrade, authorityVersion} | 600 ms | 2 retries at 100 ms and 300 ms with same read key | Open after 4 failures in 30 s; attestation or route remains pending and returns DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| Shard 06 contest and protected-case resolver | {workId, sideId, evidenceId, caseRef} → {contestState, caseVersion, remedyClass, authorizedActor} | 700 ms | 2 retries at 100 ms and 300 ms; no state advance on uncertainty | Open after 4 failures in 30 s; preserve current evidence and return CONTEST_UNRESOLVED; half-open after 20 s. |
| Shard 10 rights and consent-graph resolver | {workId, scopeHash, asOf, expectedVersions} → {rightsSides, standingParties, rightsVersion, consentGraphVersion, holds} | 800 ms | 2 retries at 100 ms and 300 ms; fresh key per evaluation | Open after 4 failures in 30 s; clearance returns CLEARANCE_UNKNOWN and consent is not routed; half-open after 20 s. |
| BE00 notification and outbox | {eventType, requestId, pseudonymousPartyId, deadline} → {outboxId, acceptedAt} | 500 ms | 3 retries at 100 ms, 300 ms and 900 ms; no duplicate send on replay | Open after 5 failures in 30 s; consent remains pending with dispatch retry; half-open after 15 s. |

## Request/Response Contracts

The schemas below are Zod 4 strict contracts. Idempotency-Key is a required request header and is bound to a canonical body hash. All failures use the exact BE00 envelope ApiError { code, message, requestId, details }.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const LicenceScopeSchema = z.strictObject({
  grammarVersion: z.string().min(1).max(64),
  media: z.array(z.string().min(1)).min(1),
  dataUse: z.array(z.string().min(1)).min(1),
  territoryCountries: z.array(z.string().length(2)).min(1),
  termTrigger: z.string().min(1).max(128),
  termDuration: z.string().min(1).max(128),
  exclusivity: z.enum(["non_exclusive", "exclusive"]),
  usage: z.array(z.string().min(1)).min(1),
  scale: z.string().min(1).max(128),
  extent: z.string().min(1).max(128),
  granteePartyId: z.uuid()
});
const EvidenceGradeSchema = z.enum(["captured", "reconstructed", "cleared_evidenced", "cleared_asserted"]);
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const CreateCompletenessAttestationRequest = z.strictObject({
  workId: z.uuid(),
  sideId: z.uuid(),
  partyListVersion: z.int().positive(),
  attestorId: z.uuid(),
  authorityBasis: z.string().min(1).max(128),
  knowledgeBasis: z.string().min(1).max(500),
  identityVerified: z.literal(true),
  presenceVerified: z.literal(true),
  listingComplete: z.literal(true),
  evidenceGrade: EvidenceGradeSchema,
  corroborationIds: z.array(z.uuid()).max(50)
});
export const CreateCompletenessAttestationSuccess = z.strictObject({
  attestationId: z.uuid(),
  state: z.enum(["valid", "corroborated", "contested", "superseded"]),
  version: z.int().positive(),
  requestId: z.uuid()
});

export const DeclareEncumbranceRequest = z.strictObject({
  workId: z.uuid(),
  masterId: z.uuid().nullable(),
  materialId: z.uuid(),
  sourceRef: z.string().min(1).max(500),
  scopeCeiling: LicenceScopeSchema,
  evidenceGrade: EvidenceGradeSchema,
  declaration: z.string().min(1).max(2000),
  expectedWorkVersion: z.int().positive()
});
export const DeclareEncumbranceSuccess = z.strictObject({
  declarationId: z.uuid(),
  state: z.enum(["active", "retracted", "superseded"]),
  scopeCeilingHash: z.string().length(64),
  version: z.int().positive(),
  requestId: z.uuid()
});

export const ComputeClearanceRequest = z.strictObject({
  workId: z.uuid(),
  buyerId: z.uuid(),
  endClientId: z.uuid(),
  scope: LicenceScopeSchema,
  asOf: z.iso.datetime(),
  expectedRightsVersion: z.int().positive(),
  expectedConsentGraphVersion: z.int().positive()
});
export const ComputeClearanceSuccess = z.strictObject({
  snapshotId: z.uuid(),
  verdict: z.enum(["unknown", "blocked", "contested", "encumbered", "incomplete", "consent_needed", "clearable_now"]),
  snapshotAgeSeconds: z.int().nonnegative(),
  remedyClass: z.string().min(1).max(64),
  requiredSideCount: z.int().nonnegative(),
  requestId: z.uuid()
});

export const RouteConsentRequest = z.strictObject({
  clearanceSnapshotId: z.uuid(),
  partyIds: z.array(z.uuid()).min(1).max(200),
  plainLanguageScope: z.string().min(1).max(2000),
  legalAppendix: z.string().min(1).max(20000),
  priceMinor: z.int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  deadline: z.iso.datetime(),
  expectedSnapshotVersion: z.int().positive()
});
export const RouteConsentSuccess = z.strictObject({
  requestIds: z.array(z.uuid()).min(1),
  states: z.array(z.enum(["pending", "approved", "declined", "countered", "expired", "revoked_pre_issue"])),
  allPartiesRouted: z.literal(true),
  requestId: z.uuid()
});
export const LicensingApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| LIC-CLR-API-01 | CreateCompletenessAttestationRequest with Idempotency-Key | CreateCompletenessAttestationSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-CLR-API-02 | DeclareEncumbranceRequest with Idempotency-Key | DeclareEncumbranceSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-CLR-API-03 | ComputeClearanceRequest with Idempotency-Key | ComputeClearanceSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-CLR-API-04 | RouteConsentRequest with Idempotency-Key | RouteConsentSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| LIC-CLR-API-01 | Require verified identity and presence, a positive immutable party-list version, side authority, knowledge basis, listing assertion and EvidenceGrade. A listed contest invalidates immediately; an unlisted credible claim becomes contested. Corroboration improves disclosure only and never grants consent. |
| LIC-CLR-API-02 | Require credited-contributor standing on the own work or material, source, scope ceiling under a supported grammar and evidence grade. Fingerprint output is a private prompt only. Retraction creates a superseding declaration and cannot erase the predecessor. |
| LIC-CLR-API-03 | Require named buyer and end client, pinned supported LicenceScope, explicit countries and loadable expected rights and consent-graph versions. Unset axes are non-permissive. Fold precedence is unknown > blocked > contested > encumbered > incomplete > consent_needed > clearable_now. |
| LIC-CLR-API-04 | Require a fresh snapshot, unique verified reachable parties, simultaneous routing, plain-language scope, exact legal appendix, price and deadline. One person receives one combined request across stakes. Nonresponse, erased identity and unavailable route remain pending or blocked; partial approval never clears. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| LIC-CLR-API-01 | VALIDATION_FAILED, NOT_AUTHORIZED, EVIDENCE_CONTESTED, CONTEST_UNRESOLVED, DEPENDENCY_UNAVAILABLE, VERSION_CONFLICT. 403 for missing side authority or non-attestor; 404 hides unknown work, side or party-list version. | Required 7 years; hash covers work, side, party-list, attestor, authority, knowledge, grade and corroboration IDs. Replay returns attestation; mismatch returns IDEMPOTENCY_MISMATCH. | 60 attestations/hour/attestor; 10 concurrent/side. | Log operationId, requestId, work/side hashes, party-list version, grade class, contest state and version; no knowledge text, identity name or evidence contents. |
| LIC-CLR-API-02 | VALIDATION_FAILED, NOT_AUTHORIZED, ENCUMBRANCE_ACTIVE, CONTEST_UNRESOLVED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-credited or foreign work; 404 hides unknown work/material/declaration. | Required 7 years; hash covers work, material, source hash, ceiling hash, grade and expected version. Replay returns declaration; mismatch returns IDEMPOTENCY_MISMATCH. | 30 declarations/hour/contributor; 5 concurrent/work. | Log operationId, requestId, work/material/source hashes, ceiling hash, grade, active/retracted state and version; no accusation text or fingerprint. |
| LIC-CLR-API-03 | SCOPE_REQUIRED, GRAMMAR_UNSUPPORTED, CLEARANCE_UNKNOWN, CLEARANCE_BLOCKED, ENCUMBRANCE_ACTIVE, CONSENT_REQUIRED, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign buyer/mandate; 404 hides unknown work, scope or snapshot. | Required 24 hours for derived snapshot; hash covers work, parties, scope, as-of and expected versions. Replay returns snapshot; mismatch returns IDEMPOTENCY_MISMATCH. | 240 evaluations/hour/buyer; 20 concurrent/work. | Log operationId, requestId, work/scope/buyer hashes, verdict class, dominant reason class, side-count bucket, freshness and dependency latency; no blocker identity. |
| LIC-CLR-API-04 | CONSENT_REQUIRED, CONSENT_ROUTE_UNAVAILABLE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for a caller attempting another party's decision or foreign snapshot; 404 hides unknown snapshot or party. | Required through request deadline plus 7 years; hash covers snapshot version, party pseudonyms, scope hash, price class and deadline. Replay returns request IDs/states; mismatch returns IDEMPOTENCY_MISMATCH. | 120 routes/hour/snapshot owner; 50 concurrent/snapshot. | Log operationId, requestId, snapshot hash, party-count bucket, route availability class, state counts and dispatch latency; no consent text, names or exact price. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns the immutable evidence, clearance snapshot and consent decision records. Domain fields below state type, nullability, constraints and foreign keys; indexes are deterministic route keys and RLS is party or side scoped.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| completeness_attestation | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; work_id uuid NOT NULL FK works.work; side_id uuid NOT NULL FK rights.rights_side; party_list_version bigint NOT NULL CHECK party_list_version>0; attestor_id uuid NOT NULL FK identity.party; authority_basis text NOT NULL; knowledge_basis text NOT NULL; identity_verified boolean NOT NULL CHECK identity_verified=true; presence_verified boolean NOT NULL CHECK presence_verified=true; listing_complete boolean NOT NULL CHECK listing_complete=true; evidence_grade text NOT NULL CHECK evidence_grade IN ('captured','reconstructed','cleared_evidenced','cleared_asserted'); state text NOT NULL CHECK state IN ('valid','corroborated','contested','superseded'); supersedes_id uuid NULL FK licensing.completeness_attestation; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(work_id, side_id, party_list_version, version); (work_id, side_id, state, version DESC); (attestor_id, created_at DESC); (supersedes_id) | Attestor reads own attestations; side authority reads own side; evidence operator writes assigned scope; clearance worker reads valid state; buyer receives grade and verdict only; anon no grant; DELETE denied. |
| corroboration | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; attestation_id uuid NOT NULL FK licensing.completeness_attestation; corroborator_id uuid NOT NULL FK identity.party; evidence_ref text NOT NULL; evidence_grade text NOT NULL CHECK evidence_grade IN ('captured','reconstructed','cleared_evidenced','cleared_asserted'); state text NOT NULL CHECK state IN ('active','superseded','contested'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(attestation_id, corroborator_id, version); (attestation_id, state, version DESC); (corroborator_id); (evidence_ref) | Corroborator reads own evidence; attestation owner sees grade/state; clearance worker reads active metadata; private evidence content stays in Shard 02 storage; anon no grant; DELETE denied. |
| encumbrance_declaration | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; work_id uuid NOT NULL FK works.work; master_id uuid NULL FK works.master; material_id uuid NOT NULL FK works.material; source_ref text NOT NULL; scope_ceiling jsonb NOT NULL CHECK jsonb_typeof(scope_ceiling)='object'; evidence_grade text NOT NULL CHECK evidence_grade IN ('captured','reconstructed','cleared_evidenced','cleared_asserted'); declaration text NOT NULL; state text NOT NULL CHECK state IN ('active','retracted','superseded'); supersedes_id uuid NULL FK licensing.encumbrance_declaration; expected_work_version bigint NOT NULL CHECK expected_work_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (work_id, state, created_at DESC); (owner_id, state, created_at DESC); (material_id, state); (supersedes_id); GIN(scope_ceiling) | Contributor reads and appends own declarations; clearance worker reads active declarations; operator has assigned remediation scope; buyer receives encumbered verdict class only; anon no grant; source text is private. |
| clearance_snapshot | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; work_id uuid NOT NULL FK works.work; buyer_id uuid NOT NULL FK identity.party; end_client_id uuid NOT NULL FK identity.party; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='object'; scope_hash text NOT NULL CHECK length(scope_hash)=64; rights_version bigint NOT NULL CHECK rights_version>0; consent_graph_version bigint NOT NULL CHECK consent_graph_version>0; evidence_version bigint NOT NULL CHECK evidence_version>0; policy_version bigint NOT NULL CHECK policy_version>0; per_side_verdicts jsonb NOT NULL CHECK jsonb_typeof(per_side_verdicts)='object'; dominant_state text NOT NULL CHECK dominant_state IN ('unknown','blocked','contested','encumbered','incomplete','consent_needed','clearable_now'); remedy_class text NOT NULL; evaluated_at timestamptz NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(work_id, buyer_id, scope_hash, rights_version, consent_graph_version, evidence_version, policy_version); (buyer_id, evaluated_at DESC); (work_id, scope_hash, evaluated_at DESC); (dominant_state, evaluated_at DESC) | Buyer reads own snapshot and safe verdict; owner reads attributed blocker only for own side; clearance worker inserts; issuance gate reads fresh snapshots; no direct client update/delete; anon no grant. |
| consent_request | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; clearance_snapshot_id uuid NOT NULL FK licensing.clearance_snapshot; party_id uuid NOT NULL FK identity.party; stakes jsonb NOT NULL CHECK jsonb_typeof(stakes)='array'; plain_language_scope text NOT NULL; legal_appendix text NOT NULL; price_minor bigint NOT NULL CHECK price_minor>=0; currency char(3) NOT NULL CHECK currency ~ '^[A-Z]{3}$'; deadline timestamptz NOT NULL; state text NOT NULL CHECK state IN ('pending','approved','declined','countered','expired','revoked_pre_issue'); route_version bigint NOT NULL CHECK route_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(clearance_snapshot_id, party_id, route_version); (party_id, state, deadline); (clearance_snapshot_id, state); (deadline, state) | Party reads and decides own request; buyer reads state and safe stake class; route service inserts; finance cannot read legal text; anon no grant; DELETE denied and expired history retained. |
| consent_decision | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; consent_request_id uuid NOT NULL FK licensing.consent_request; party_id uuid NOT NULL FK identity.party; decision text NOT NULL CHECK decision IN ('approved','declined','countered','revoked_pre_issue'); decision_text text NULL; decided_at timestamptz NOT NULL; actor_id uuid NOT NULL FK identity.party; sequence_no integer NOT NULL CHECK sequence_no>0; state text NOT NULL CHECK state IN ('recorded','superseded'); supersedes_id uuid NULL FK licensing.consent_decision; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(consent_request_id, sequence_no); (consent_request_id, decided_at DESC); (party_id, decided_at DESC); (state); (supersedes_id) | Party may append own decision; clearance and issuance workers read current sequence; buyer sees state only; support needs purpose grant and cannot decide; anon no grant; immutable append only. |

### State, Concurrency and Transaction Rules

- An attestation references an immutable party-list version. A listed contest immediately changes the attestation to contested; a superseding row preserves the prior row and its audit chain. Grade and corroboration are quality signals, never authority or consent.
- Encumbrance writes require own-work standing and expected source version. Retraction appends a superseding row; active declarations intersect downstream scope ceilings and remain attributable.
- Clearance evaluates complete scope and explicit countries against fresh bitemporal rights, consent graph, attestation, encumbrance, hold and policy versions. The dominant state uses unknown > blocked > contested > encumbered > incomplete > consent_needed > clearable_now. Any resolver uncertainty is CLEARANCE_UNKNOWN.
- Clearance transactions lock the expected source versions and store a scope hash, per-side verdicts, evaluated-at and exactly one remedy class. Buyer projections never reveal blocker identity; authorized co-owner views may attribute their side.
- Consent routing creates all party requests in one transaction from the derived standing-party set. One person receives one combined request naming all stakes. A route timeout or partial write leaves requests pending and no synthetic approval. Decision sequence numbers are compare-and-swap protected.
- Consent state has no timeout-to-approved transition. Expiry is explicit, and a later decision cannot mutate an issued instrument because issuance owns its own protected gate.

### Grants, RLS and Retention

- RLS requires party, side, mandate or assigned evidence/case scope. The buyer can read verdict, age and remedy class only. A contributor can read their own declaration. A party can read and decide only their own consent request.
- Private knowledge statements, legal appendices, evidence contents, exact blocker reasons, party identity and fingerprints are excluded from buyer search and standard logs. Pseudonymous event payloads are used.
- Immutable evidence, consent decisions, audit and idempotency retain 7 years or legal hold, whichever is longer. Revoked or erased identity state leaves pseudonymous share and evidence history while blocking fresh consent.
- Service grants are named RPC grants for evidence ingest, clearance evaluation, consent routing and notification. There is no wildcard storage or database grant.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Verified attestor | Create evidence for a rights side where authority basis is verified. | Another side, unverified identity or converting grade into consent. |
| Credited contributor | Declare or retract encumbrance on own work/material. | Accusing another contributor, notifying third parties or resolving consent. |
| Professional buyer | Request own named clearance and view verdict, age and remedy class. | Blocker identity, private evidence, co-owner policy or another buyer's scope. |
| Buyer representative | Request within declared mandate with named licensee/end client. | Inferred affiliate, undisclosed end client or foreign scope. |
| Rights/licensing operator | Run assigned evidence, clearance and route jobs. | Grant owner consent, override a verdict or route outside derived parties. |
| Dispute/legal reviewer | Read assigned contest or breach evidence projection. | General evidence browsing or direct mutation of canonical state. |
| Service principal | Purpose-limited resolver, evaluator, router and outbox work. | Interactive authority, wildcard party access or approval on silence. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| LIC-CLR-API-01 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(attestationWrite) → parseZod(CreateCompletenessAttestationRequest) → idempotency(7y) → authorizeVerifiedAttestor → verifyPartyListVersion → evidenceContestGuard → attestationAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-CLR-API-02 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(encumbranceWrite) → parseZod(DeclareEncumbranceRequest) → idempotency(7y) → authorizeCreditedContributor → ownWorkGuard → scopeCeilingGuard → sourceVersionCAS → encumbranceAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-CLR-API-03 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(clearanceEvaluate) → parseZod(ComputeClearanceRequest) → idempotency(24h) → authorizeBuyerOrOperatorScope → supportedGrammarGuard → freshVersionLoad → standingPartyDerivation → precedenceFold → clearanceSnapshotTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| LIC-CLR-API-04 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(consentRoute) → parseZod(RouteConsentRequest) → idempotency(deadlinePlus7y) → authorizeSnapshotScope → verifiedReachablePartyGuard → simultaneousRouteGuard → consentRequestTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects extra keys, wildcard parties, unsupported grammar and data-use omission. Scope canonicalization sorts arrays and keys before hashing, while legal text is encrypted at rest.
- Consent dispatch is credentialed only to configured licensing origins with CSRF protection. No notification reveals another party's identity or the full party list.
- 403 denotes known resource without required authority. 404 hides unknown or out-of-scope work, side, snapshot or party. Error details expose stable classes and requestId only.
- Clearance is fail closed. Unknown, stale, unavailable and erased-party inputs never become clearable_now. No role has an override path.
- Fingerprint prompts remain private and advisory. Evidence and consent payloads exclude secrets, raw legal text in events, private media and exact prices except purpose-authorized paths.

## Data Flow

1. LIC-CLR-API-01 verifies party authority and Shard 02 identity, appends an attestation and optional corroboration references, and emits licensing.evidence.changed.v1.
2. LIC-CLR-API-02 verifies credited-contributor standing and writes own-work encumbrance with a scope ceiling; retraction supersedes prior state and emits the same evidence event.
3. LIC-CLR-API-03 resolves Shard 10 rights and consent graph plus evidence, hold and policy versions, computes standing parties and precedence, then writes an audience-safe clearance snapshot and emits licensing.clearance.changed.v1.
4. LIC-CLR-API-04 takes the snapshot's derived standing parties, routes one combined request per verified person, appends route records and emits licensing.consent.changed.v1. Decisions are appended by each party through the platform consent boundary.
5. 20c consumes verdict and consent state for policy and quote; 20d re-evaluates fresh state and never treats a cached snapshot or consent projection as issuance authority.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| licensing.evidence.changed.v1 | LIC-CLR-API-01 and LIC-CLR-API-02 | workId hash, sideId hash, evidence kind, state, grade class, version and evaluated-at; clearance consumes it. Excludes evidence content, actor name, fingerprints and legal text. |
| licensing.clearance.changed.v1 | LIC-CLR-API-03 | workId hash, scope hash, verdict class, evaluated-at, remedy class and snapshot version; search, quote and issuance request paths consume it. Excludes blocker identity and party details. |
| licensing.consent.changed.v1 | LIC-CLR-API-04 and decision append boundary | requestId, pseudonymous party hash, state and version; quote and issuance gate consume it. Excludes consent text, legal appendix, identity and exact price. |

All events are transactional-outbox records and are idempotent by event ID plus aggregate version. Consumers may invalidate stale projections but cannot strengthen evidence grade, consent or clearance.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| LIC-CLR-API-01 | Contest, invalid authority, missing verification, stale party-list or resolver outage | Return EVIDENCE_CONTESTED, NOT_AUTHORIZED, VERSION_CONFLICT or DEPENDENCY_UNAVAILABLE before unsafe mutation; preserve prior evidence and retry only with the same idempotency key. |
| LIC-CLR-API-02 | Non-own declaration, unsupported scope, source race or Shard 06 uncertainty | Return NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT or CONTEST_UNRESOLVED; do not accuse or notify; keep prior declaration and retry resolver/outbox idempotently. |
| LIC-CLR-API-03 | Scope missing, grammar unsupported, stale input, resolver outage or contested side | Return SCOPE_REQUIRED, GRAMMAR_UNSUPPORTED or CLEARANCE_UNKNOWN; persist no permissive verdict and expose only safe remedy class. |
| LIC-CLR-API-04 | Unreachable party, notification outage, expired identity, duplicate route or partial decision | Keep request pending or expired, retry dispatch with the same route version and never approve by timeout. A partial approval set remains CONSENT_REQUIRED and cannot form a deal. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| LIC-CLR-API-01 | Zod evidence grade, party-list, authority, verified flags and exact ApiError schema. | Attestor side authority, contest behavior, CORS/rate, 403/404 and redaction. | Immutable attestation, corroboration links, supersession, RLS/grants and event. | Listed contest, unlisted claim, resolver outage, replay, duplicate outbox and audit redaction. |
| LIC-CLR-API-02 | Own-work, ceiling, source, grade and retraction schema. | Credited-contributor standing, no accusation, CORS/rate and privacy. | Declaration CAS, scope intersection, supersession, RLS/grants and event. | Fingerprint-only prompt, source race, resolver outage, replay and attributable history. |
| LIC-CLR-API-03 | LicenceScope, explicit territory, precedence and verdict schema. | Buyer/mandate containment, blocker privacy, fail-closed, CORS/rate and 404 hiding. | Versioned snapshot uniqueness, side fold, RLS and event. | Unknown resolver, erased party, stale cache, contest, replay and safe projection. |
| LIC-CLR-API-04 | Party uniqueness, legal appendix, price/currency, deadline and ConsentState schema. | Party-only decision, simultaneous routing, no silence approval, CORS/rate and privacy. | One request per party, decision sequence, deadline state, RLS and event. | Unreachable party, duplicate route, partial approval, notification outage, retry and redacted logs. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects wildcard or incomplete scope, unknown keys, non-country territory, malformed grades, empty party lists and past deadlines; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 identity, Shard 02 evidence, Shard 06 contest, Shard 10 rights graph and outbox adapters with the exact timeout and retry policies.
- Database: prove side and party RLS, append-only history, CAS, unique route, retention, no direct client grants and event version monotonicity.
- Contract: test each precedence state, audience projection, simultaneous routing, consent nonresponse and partial approval; assert no consumer elevates evidence, consent or clearance.
- Acceptance gate: LIC-CLR-API-01 through LIC-CLR-API-04 each have authoritative route, contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all six assigned models and three assigned events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Empty scope, omitted data use, territory label, missing party-list version, unverified attestor, retracted declaration, unknown resolver, erased party and duplicate party input have explicit typed refusal or pending behavior.
- Scope ceiling is intersected with upstream clearance; no fingerprint or grade can widen scope or create consent authority.

### Meso Pass

- Attestation, corroboration, encumbrance, clearance and consent are distinct records. A high EvidenceGrade is not ConsentState approved, and an advisory clearable_now snapshot is not an issuance decision.
- Buyer and owner projections differ: buyer receives verdict, age and remedy class; an authorized side owner may see their own attributed blocker. No actor can override the fold.

### Macro Pass

- Shard 02 owns verified identity/evidence quality, Shard 06 owns contests/cases, Shard 10 owns rights and standing graph, 20a owns catalogue/brief/hold, 20c owns policy/quote and 20d owns instrument. This companion publishes only safe evidence, clearance and consent events.
- Protected issuance reloads all versions. A stale clear badge, silent party, later contest or notification failure cannot authorize or revoke an issued instrument.

## Ambiguity Gate

**PASS.** LIC-05 through LIC-08 map one-to-one to four routes and complete operation-keyed matrices. Party-list immutability, own-work scope, precedence, audience privacy, simultaneous routing, nonresponse, erasure, contest, retraction and partial approval each have deterministic state and recovery. BE00 envelope, RLS ownership, event exclusions and sibling boundaries are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored evidence, encumbrance, clearance and consent backend contracts with fail-closed precedence and non-permissive consent routing. | /write-be-spec |

## Dependency References

- **Consumes:** [Shard 00 Contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) for actor context, ApiError, idempotency, audit, outbox and notifications; [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for parties and mandates; [Shard 02 Contracts](../ia/02-profiles-verification.md#contracts) for verified identity/evidence; [Shard 06 Contracts](../ia/06-trust-safety.md#contracts) for contest and protected cases; [Shard 10 Contracts](../ia/10-rights-ownership.md#contracts) for rights sides and consent graph.
- **Publishes:** licensing.evidence.changed.v1, licensing.clearance.changed.v1 and licensing.consent.changed.v1 with audience-safe hashes and version metadata.
- **Sibling handoff:** 20a supplies catalogue/brief/hold references; 20c consumes clearance and consent state for policy and quote; 20d consumes fresh snapshot and consent state but repeats the protected issuance gate.
- **Downstream:** Shard 21 and Shard 22 may consume clearance verdict classes and consent completion only through their named contracts; neither can infer party identity or issue an instrument.
