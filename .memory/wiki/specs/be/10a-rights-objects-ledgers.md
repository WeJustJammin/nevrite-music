# Rights Objects and Consent Ledgers — Backend Specification

## Split Group

Shard 10 rights and ownership, split 10a. This companion owns explicit work and recording objects, recording-to-work links, recording lineage, immutable rights-ledger versions, exact-rational ledger rows and ledger consent for RGT-01 through RGT-04. It does not own points, title transfers, conflicts, freezes, AI or NIL positions, identifiers or registration artifacts.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| RGT-01 assert work or recording | Explicit assertion command | Work and recording are separate rights objects. A project artifact is never promoted automatically, and non-empty, consented or earning records are retained. |
| RGT-02 link recording and work | Versioned weighted-link command | Typed links use positive reduced exact rationals that sum exactly one; recording lineage remains a separate relation. |
| RGT-03 draft or propose ownership ledger | Draft plus protected proposal command | Unbalanced drafts persist as unallocated; proposal freezes row order, arithmetic, territory and payout-basis version and creates no auto-remainder. |
| RGT-04 consent or refuse ledger | Whole-ledger consent command | A named party sees the complete frozen ledger and acts only for its authorized row or anchored publisher; stale version or row hash cannot apply. |

BE00 inheritance is mandatory for every operation: requestId, authenticated acting context, strict Zod 4 parsing, idempotency ledger, audit/outbox, CORS, rate limits, RLS and ApiError { code, message, requestId, details }. Platform endpoints are not duplicated.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/10-rights-ownership.md:28-33` and mapped to the owning backend route registry. This is the umbrella-feature trace; interaction, model, event, and contract evidence remains in the linked companion specs.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **09.01 Rights Registry** — work/recording duality, exact-rational ownership ledgers, master control/encumbrances, publishing structures, performer facts and sample provenance. | [10a](10a-rights-objects-ledgers.md#authoritative-route-registry): `RGT-OBJ-API-01`–`RGT-OBJ-API-04`; [10b](10b-splits-points-buyouts-amendments.md#authoritative-route-registry) for split/point ledger additions. |
| **09.02 Split Capture & Agreements** — creation-time split proposals, producer points, work-for-hire/buyout designation and superseding re-consent. | [10b](10b-splits-points-buyouts-amendments.md#authoritative-route-registry): `RGT-AGR-API-01`–`RGT-AGR-API-04`. |
| **09.03 Chain of Title & Rights Lifecycle** — attributed title events, term/territory/reversion, termination windows, succession, term/public-domain and moral-right status. | [10c](10c-title-control-conflicts-freezes.md#authoritative-route-registry): `RGT-TTL-API-01`–`RGT-TTL-API-05`. |
| **09.04 Rights Conflicts & Disputes** — deterministic/probabilistic conflict detection, scoped evidence cases and rights-side freeze instructions. | [10c](10c-title-control-conflicts-freezes.md#authoritative-route-registry): `RGT-TTL-API-03`–`RGT-TTL-API-05`. |
| **09.05 AI, Voice & Likeness Consent** — scoped AI-training consent, person-held NIL positions and orthogonal AI declarations without detection. | [10d](10d-ai-training-nil-consent.md#authoritative-route-registry): `RGT-CNS-API-01`–`RGT-CNS-API-03`. |
| **09.06 Rights Evidence & Public Record** — identifier allocation/reconciliation, universal possession timestamping, registration preparation and publication-safe lookup. | [10e](10e-identifiers-registration-evidence.md#authoritative-route-registry): `RGT-ID-API-01`–`RGT-ID-API-04`. |

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 10](../ia/10-rights-ownership.md) | Interactions, lines 66–73 | RGT-01 through RGT-04 preconditions, required behavior, completion and failure recovery. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Core Types and Errors, lines 100–111 | RightType, LedgerState, ConsentState, TrustLevel, StandardError and fail-closed semantics. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Registry and Ledger, lines 113–123 | AssertRightsObject, SetRecordingWorkLinks, ProposeLedger and ConsentLedger invariants. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Data Models, lines 147–184 | work, recording, recording_work_link_version, recording_lineage_edge, rights_ledger_version, rights_ledger_row and ledger_consent ownership and cardinality. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Access Control and Accessibility, lines 208–242 | Owner, producer, administrator, performer, publisher, estate, public and worker boundaries. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Event Schemas, lines 243–258 | rights.object.changed.v1, rights.ledger.proposed.v1 and rights.ledger.consented.v1 payloads and exclusions. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Edge cases and coverage matrix, lines 260–306 | Arithmetic, consent, deletion, concurrency, evidence and audit recovery requirements. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Canonical Field Contracts, lines 20–30 | Object, link, ledger, row and consent fields and unique exact-version constraints. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Ledger Invariants and Proposal/Consent Algorithm, lines 56–79 | Reduced rational arithmetic, draft/proposal lifecycle, whole-ledger hash and silence semantics. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Abuse and Recovery Verification, lines 137–153 | Credit-to-ownership isolation, rounding, forced split, attrition and state/provenance safeguards. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global request, error, middleware and deterministic protocol contracts | Exact ApiError, request IDs, idempotency, audit/outbox, CORS, CAS and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RGT-01 Assert work/recording | RGT-OBJ-API-01 | Requires explicit kind and assertion authority, creates separate object, records possession proof state and retains non-empty objects. |
| RGT-02 Link recording/work | RGT-OBJ-API-02 | Stores typed positive reduced exact-rational links summing one, rejects stale edits and keeps recording lineage separate. |
| RGT-03 Draft/propose ownership ledger | RGT-OBJ-API-03 | Persists unbalanced draft, requires exact territory and arithmetic invariants for proposal, freezes row order/hash and creates consent set. |
| RGT-04 Consent/refuse ledger | RGT-OBJ-API-04 | Shows complete frozen ledger, validates row and version hash, appends consent/refusal and never treats silence or receipt as consent. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RGT-01 | Assert a work or recording | RGT-OBJ-API-01 | Immutable asserted object, possession timestamp and retryable creation-proof state. |
| RGT-02 | Link recording to works | RGT-OBJ-API-02 | New link-set version with exact rational total one and CAS conflict protection. |
| RGT-03 | Draft and propose ownership ledger | RGT-OBJ-API-03 | Draft or frozen proposed ledger with arithmetic manifest, row authors and consent set. |
| RGT-04 | Consent or refuse frozen ledger | RGT-OBJ-API-04 | Exact ledger and row hash decision with whole-ledger state transition or typed refusal. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RGT-OBJ-API-01 | POST | /api/v1/rights/objects | RGT-01 | Producer, master administrator, named owner or writer with assertion authority for the acting party. | 201 AssertRightsObjectSuccess |
| RGT-OBJ-API-02 | POST | /api/v1/rights/recording-work-links | RGT-02 | Recording administrator or authorized actor for the recording and readable works. | 201 SetRecordingWorkLinksSuccess |
| RGT-OBJ-API-03 | POST | /api/v1/rights/ledgers/proposals | RGT-03 | Editor with authority on the object and right type; proposer is recorded. | 201 ProposeLedgerSuccess |
| RGT-OBJ-API-04 | POST | /api/v1/rights/ledgers/consents | RGT-04 | Named ledger party or anchored publisher holder acting only for its authorized row. | 200 ConsentLedgerSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 01 party and representation resolver | {partyId, actingContextId, mandateId, requiredAuthority} → {partyState, authorityVersion, representationClass, scope} | 500 ms | 2 retries at 75 ms and 225 ms; stale authority rejected | Open after 4 failures in 30 s; half-open after 20 s; return FORBIDDEN or ACTING_CONTEXT_STALE. |
| Shard 09 work/session/version resolver | {objectKind, sourceProjectId, sourceVersionId, workIds, recordingId} → {readableObjects, sourceVersion, closeMoment, participantRefs} | 700 ms | 2 retries at 100 ms and 300 ms using the same read key | Open after 4 failures in 30 s; object may commit with failed proof but links/proposals stop; half-open after 20 s. |
| Creation-proof anchor worker | {objectId, objectVersion, sourceHash, observedAt} → {anchorRef, providerVersion, proofState} | 900 ms | 3 retries at 150 ms, 450 ms and 1350 ms with same source hash | Open after 5 failures in 60 s; object remains asserted with proof_failed and retry task; half-open after 30 s. |
| Shard 00 audit and outbox | {eventType, aggregateId, version, requestId} → {auditId, outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical transaction commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All operation requests require Idempotency-Key and canonical JSON hashing. Every error is exactly ApiError { code, message, requestId, details }. Exact-rational values are integer numerator and positive integer denominator; decimal display is derived only.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RightTypeSchema = z.enum([
  "composition_writer", "composition_publisher", "master", "performer",
  "neighbouring", "nil", "ai_training", "security_interest"
]);
const LedgerStateSchema = z.enum([
  "draft", "unallocated", "proposed", "consented", "refused", "superseded",
  "disputed", "public_domain"
]);
const ConsentStateSchema = z.enum(["pending", "consented", "refused", "unreachable"]);
const RationalSchema = z.strictObject({
  numerator: z.int().nonnegative(),
  denominator: z.int().positive()
}).superRefine((v, ctx) => {
  if (v.numerator === 0) ctx.addIssue({ code: "custom", message: "zero rows are not allowed" });
});
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const AssertRightsObjectRequest = z.strictObject({
  kind: z.enum(["work", "recording"]),
  title: z.string().trim().min(1).max(500),
  actingPartyId: z.uuid(),
  sourceProjectId: z.uuid().nullable(),
  sourceVersionId: z.uuid().nullable(),
  expectedSourceVersion: z.int().nonnegative()
});
export const AssertRightsObjectSuccess = z.strictObject({
  objectId: z.uuid(),
  kind: z.enum(["work", "recording"]),
  state: z.enum(["asserted", "proof_failed"]),
  possessionAt: z.iso.datetime(),
  version: z.int().positive(),
  requestId: z.uuid()
});

export const SetRecordingWorkLinksRequest = z.strictObject({
  recordingId: z.uuid(),
  links: z.array(z.strictObject({
    workId: z.uuid(),
    type: z.enum(["composition", "adaptation", "other"]),
    weight: RationalSchema
  })).min(1).max(500),
  expectedLinkSetVersion: z.int().positive()
});
export const SetRecordingWorkLinksSuccess = z.strictObject({
  setId: z.uuid(),
  version: z.int().positive(),
  validation: z.literal("balanced"),
  requestId: z.uuid()
});

export const ProposeLedgerRequest = z.strictObject({
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  territoryProfile: z.string().min(1).max(128),
  payoutBasisTermVersion: z.int().positive(),
  rows: z.array(z.strictObject({
    partyId: z.uuid(),
    rowKind: z.enum(["writer", "publisher", "master_owner", "encumbrance"]),
    share: RationalSchema,
    writerAnchorRowId: z.uuid().nullable(),
    provenance: z.enum(["platform_witnessed", "evidence_attached", "asserted", "imported"])
  })).min(1).max(1000),
  expectedObjectVersion: z.int().positive()
});
export const ProposeLedgerSuccess = z.strictObject({
  ledgerId: z.uuid(),
  state: LedgerStateSchema,
  consentSetCount: z.int().nonnegative(),
  gapMinor: z.int().nonnegative(),
  requestId: z.uuid()
});

export const ConsentLedgerRequest = z.strictObject({
  ledgerId: z.uuid(),
  ledgerVersion: z.int().positive(),
  rowId: z.uuid(),
  rowHash: z.string().length(64),
  decision: z.enum(["consented", "refused"]),
  recipientBinding: z.uuid().nullable()
});
export const ConsentLedgerSuccess = z.strictObject({
  ledgerId: z.uuid(),
  state: LedgerStateSchema,
  consentState: ConsentStateSchema,
  version: z.int().positive(),
  requestId: z.uuid()
});
export const RightsApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RGT-OBJ-API-01 | AssertRightsObjectRequest with Idempotency-Key | AssertRightsObjectSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-OBJ-API-02 | SetRecordingWorkLinksRequest with Idempotency-Key | SetRecordingWorkLinksSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-OBJ-API-03 | ProposeLedgerRequest with Idempotency-Key | ProposeLedgerSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-OBJ-API-04 | ConsentLedgerRequest with Idempotency-Key | ConsentLedgerSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RGT-OBJ-API-01 | Require kind work or recording, nonempty title, assertion authority and readable source reference. Reject ambiguous kind and auto-promotion. Creation proof may fail loudly after object commit; non-empty, consented or earning objects cannot be deleted. |
| RGT-OBJ-API-02 | Require recording authority, readable work IDs, typed links, positive reduced exact rationals and total exactly one using integer arithmetic. Reject decimal-only or stale link-set versions; never merge concurrent edits. |
| RGT-OBJ-API-03 | Require object/right/territory, reduced positive rows, recorded row authors, payout term and expected object version. Draft can be unallocated; proposal requires exact writer, publisher anchor and master sums, no zero row and no auto-remainder. |
| RGT-OBJ-API-04 | Require party in frozen consent set, exact ledger version, exact row hash and complete ledger presentation. Refusal leaves refused, stale action returns CONSENT_STALE, unreachable remains pending and silence/read receipt never consents. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RGT-OBJ-API-01 | VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, IDEMPOTENCY_MISMATCH, DEPENDENCY_UNAVAILABLE. 403 for missing acting-party assertion authority; 404 hides unknown source/object. | Required 7 years; hash covers kind, title, acting party, source refs and expected version. Replay returns object; mismatch returns IDEMPOTENCY_MISMATCH. | 120 assertions/hour/party; 20 concurrent/party. | Log operationId, requestId, kind, source hash, proof state, version and retry class; no title or private source data. |
| RGT-OBJ-API-02 | VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, ACTING_CONTEXT_STALE, DEPENDENCY_UNAVAILABLE. 403 for foreign recording; 404 hides unknown recording/work. | Required 7 years; hash covers recording, ordered link hashes and expected version. Replay returns set/version; mismatch returns IDEMPOTENCY_MISMATCH. | 120 link writes/hour/recording; 10 concurrent/recording. | Log operationId, requestId, recording hash, work-count bucket, balanced flag, version and conflict class; no title or party names. |
| RGT-OBJ-API-03 | LEDGER_UNBALANCED, TERRITORY_INCOMPLETE, VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign object/right; 404 hides unknown object or ledger. | Required 7 years; hash covers object, right, territory, ordered row hashes, term version and expected version. Replay returns ledger; mismatch returns IDEMPOTENCY_MISMATCH. | 60 ledger proposals/hour/editor; 10 concurrent/object. | Log operationId, requestId, object/ledger hash, row-count bucket, balance class, gap bucket and version; no exact shares or party names. |
| RGT-OBJ-API-04 | CONSENT_STALE, CONSENT_REQUIRED, VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for party outside consent set; 404 hides unknown ledger/row. | Required 7 years; hash covers ledger/version/row/hash/decision/recipient binding. Replay returns decision; mismatch returns IDEMPOTENCY_MISMATCH. | 30 decisions/hour/party; 5 concurrent/ledger. | Log operationId, requestId, ledger hash, row hash, decision class, aggregate state and version; no ledger values or party identity. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns the canonical objects and ledgers. Each row below includes typed nullable fields, constraints, foreign keys, route indexes and RLS or grants. Exact rational columns never use floating point.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| work | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; kind text NOT NULL CHECK kind='work'; title text NOT NULL CHECK length(title)>0; source_project_id uuid NULL FK projects.project; source_version_id uuid NULL FK projects.version; lifecycle text NOT NULL CHECK lifecycle IN ('asserted','active','superseded','tombstoned'); assertion_actor_id uuid NOT NULL FK identity.party; possession_at timestamptz NOT NULL; creation_proof_state text NOT NULL CHECK creation_proof_state IN ('pending','anchored','proof_failed'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(source_project_id, source_version_id) where source_project_id IS NOT NULL; (owner_id, lifecycle); (source_version_id); (creation_proof_state, updated_at) | Owner and authorized writer read own work; producer may assert in assigned scope; public projection reads allowlisted fields; no direct delete/update; anon no grant. |
| recording | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; kind text NOT NULL CHECK kind='recording'; title text NOT NULL CHECK length(title)>0; source_project_id uuid NULL FK projects.project; source_version_id uuid NULL FK projects.version; lifecycle text NOT NULL CHECK lifecycle IN ('asserted','active','superseded','tombstoned'); assertion_actor_id uuid NOT NULL FK identity.party; possession_at timestamptz NOT NULL; creation_proof_state text NOT NULL CHECK creation_proof_state IN ('pending','anchored','proof_failed'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(source_project_id, source_version_id) where source_project_id IS NOT NULL; (owner_id, lifecycle); (source_version_id); (creation_proof_state, updated_at) | Master administrator and assigned producer read/write own recording; public projection reads allowlisted fields; direct delete denied for nonempty records; anon no grant. |
| recording_work_link_version | id uuid PK NOT NULL; set_id uuid NOT NULL; version bigint NOT NULL CHECK version>0; recording_id uuid NOT NULL FK rights.recording; work_id uuid NOT NULL FK rights.work; link_type text NOT NULL CHECK link_type IN ('composition','adaptation','other'); weight_numerator bigint NOT NULL CHECK weight_numerator>0; weight_denominator bigint NOT NULL CHECK weight_denominator>0; author_id uuid NOT NULL FK identity.party; evidence_hash text NOT NULL CHECK length(evidence_hash)=64; total_numerator bigint NOT NULL; total_denominator bigint NOT NULL; state text NOT NULL CHECK state IN ('draft','balanced','superseded'); created_at timestamptz NOT NULL | UNIQUE(set_id, version, work_id); (recording_id, set_id, version DESC); (work_id, state); (author_id, created_at DESC) | Recording authority writes a new version; rights readers read authorized objects; validator worker reads all rows in assigned scope; no row update/delete; anon no grant. |
| recording_lineage_edge | id uuid PK NOT NULL; parent_recording_id uuid NOT NULL FK rights.recording; child_recording_id uuid NOT NULL FK rights.recording; edge_kind text NOT NULL CHECK edge_kind IN ('derived','edited','alternate','remix'); source_version_id uuid NULL FK projects.version; author_id uuid NOT NULL FK identity.party; state text NOT NULL CHECK state IN ('active','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; UNIQUE(parent_recording_id, child_recording_id, edge_kind, version) | (parent_recording_id, state); (child_recording_id, state); (source_version_id); (author_id) | Recording owners read lineage; authorized recording administrator appends edges; work-link service cannot mutate lineage; anon no grant. |
| rights_ledger_version | id uuid PK NOT NULL; object_id uuid NOT NULL; right_type text NOT NULL CHECK right_type IN ('composition_writer','composition_publisher','master','performer','neighbouring','nil','ai_training','security_interest'); territory_profile text NOT NULL; state text NOT NULL CHECK state IN ('draft','unallocated','proposed','consented','refused','superseded','disputed','public_domain'); payout_basis_term_version bigint NOT NULL CHECK payout_basis_term_version>0; proposer_id uuid NOT NULL FK identity.party; source_hash text NOT NULL CHECK length(source_hash)=64; supersedes_id uuid NULL FK rights.rights_ledger_version; row_order_hash text NOT NULL CHECK length(row_order_hash)=64; frozen_at timestamptz NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(object_id, right_type, territory_profile, version); (object_id, right_type, state, version DESC); (proposer_id); (supersedes_id); (state, updated_at) | Object-authorized editors append drafts/proposals; consent parties read frozen ledger; control/licensing consumers read consented versions; direct update/delete denied; anon no grant. |
| rights_ledger_row | id uuid PK NOT NULL; ledger_id uuid NOT NULL FK rights.rights_ledger_version; party_id uuid NOT NULL FK identity.party; row_kind text NOT NULL CHECK row_kind IN ('writer','publisher','master_owner','encumbrance'); numerator bigint NOT NULL CHECK numerator>0; denominator bigint NOT NULL CHECK denominator>0; entered_by uuid NOT NULL FK identity.party; writer_anchor_row_id uuid NULL FK rights.rights_ledger_row; provenance text NOT NULL CHECK provenance IN ('platform_witnessed','evidence_attached','asserted','imported'); canonical_order integer NOT NULL CHECK canonical_order>0; row_hash text NOT NULL CHECK length(row_hash)=64; state text NOT NULL CHECK state IN ('draft','frozen','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(ledger_id, version, canonical_order); (ledger_id, state, canonical_order); (party_id, state); (writer_anchor_row_id); CHECK denominator>0 | Ledger editor appends rows in object scope; consent party reads whole frozen ledger; public projection excludes percentages; direct mutation/delete denied; anon no grant. |
| ledger_consent | id uuid PK NOT NULL; ledger_id uuid NOT NULL FK rights.rights_ledger_version; ledger_version bigint NOT NULL CHECK ledger_version>0; row_id uuid NOT NULL FK rights.rights_ledger_row; party_id uuid NOT NULL FK identity.party; state text NOT NULL CHECK state IN ('pending','consented','refused','unreachable'); method text NOT NULL CHECK method IN ('account','signed_link','authorized_representative'); recipient_binding uuid NULL FK identity.party; acted_at timestamptz NULL; evidence_hash text NULL CHECK evidence_hash IS NULL OR length(evidence_hash)=64; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(ledger_id, ledger_version, row_id, party_id); (ledger_id, ledger_version, state); (party_id, state); (recipient_binding); | Party reads and appends its own decision; ledger worker reads aggregate; support requires expiring purpose grant and cannot decide; anon no grant; append-only. |

### State, Concurrency and Transaction Rules

- Work and recording are distinct object kinds with explicit assertion. Creation proof is a possession timestamp and source hash, not authorship. A proof-anchor outage commits proof_failed and retries the same hash.
- Link writes use integer rational arithmetic and canonical ordering. A link-set proposal commits only when every weight is positive, reduced and sums exactly one. Work links never alter recording_lineage_edge.
- Ledger drafts may remain unbalanced and state unallocated. Proposal validates writer, publisher-anchor and master invariants, freezes canonical row order/hash and payout-basis term version, and records row authors. No remainder row is generated.
- Proposed and consented ledgers are immutable. Any row change creates a successor and resets every consent. A cross-ledger package is handled by a higher companion; this file never silently merges.
- Consent is to the whole frozen ledger while authorization is row or anchored-publisher scoped. Decision CAS requires ledger version and row hash. Silence, opening a link or a read receipt cannot transition state.
- Only all required valid consent rows transition a proposal to consented and emit rights.ledger.consented.v1. Unreachable remains pending or blocked; refusal leaves refused. Current governing version remains in force until a successor is fully consented.
- Idempotency records, audit events and outbox rows commit in the same PostgreSQL transaction. Source revocation tombstones derived access while immutable ledger evidence remains.

### Grants, RLS and Retention

- RLS predicates require object owner, recording administrator, ledger editor authority, named party or anchored publisher membership. Public/fan reads use a dedicated allowlisted projection and never receive default percentages or private evidence.
- Exact percentages, row values, consent evidence, recipient binding and private source links are excluded from ordinary logs and events. Identifiers are keyed hashes and counts are bucketed.
- Objects, ledgers, consent, audit and idempotency history retain 7 years or legal hold, whichever is longer. Non-empty, consented or earning records retain tombstones and cannot be hard-deleted.
- Service principals receive named RPC grants for object assertion, link validation, ledger arithmetic, consent aggregation, proof anchoring and outbox dispatch. No wildcard grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Named owner or writer | Read relevant ledger and act for own authorized rows or propose within object scope. | Another party row, inferred consent, whole-object freeze or self-release. |
| Producer or master administrator | Assert recording/master and manage assigned recording links. | Composition ownership, publisher share, NIL or authorship claim by role alone. |
| Publisher or admin entity | Act on anchored publisher share under recorded authority. | Naming itself over writer share or reaching authorship through representation. |
| Estate or successor | Scoped title or ledger act under verified Shard 01 representation. | Login as deceased, rewrite historical consent or vault credential access. |
| Public or fan | Publication-safe object and provenance lookup. | Percentages, disputes, private evidence or contact data. |
| System worker | Validate arithmetic, aggregate consent, anchor proof and project events. | Create consent, decide merits, infer authorship or alter a frozen ledger. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RGT-OBJ-API-01 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(objectAssertion) → parseZod(AssertRightsObjectRequest) → idempotency(7y) → authorizeAssertionAuthority → sourceReadableGuard → objectAssertionTransaction → creationProofQueue → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-OBJ-API-02 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(linkSetWrite) → parseZod(SetRecordingWorkLinksRequest) → idempotency(7y) → authorizeRecordingScope → readableWorkGuard → rationalArithmeticGuard → linkSetCAS → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-OBJ-API-03 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(ledgerProposal) → parseZod(ProposeLedgerRequest) → idempotency(7y) → authorizeLedgerEditor → territoryCoverageGuard → exactBalanceGuard → canonicalRowFreeze → consentSetTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-OBJ-API-04 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(ledgerConsent) → parseZod(ConsentLedgerRequest) → idempotency(7y) → authorizeFrozenRowParty → ledgerVersionCAS → wholeLedgerPresentationGuard → decisionAppendTransaction → aggregateConsentGuard → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects unknown keys, zero rows, non-positive denominators, unreduced or overflowing rational input, ambiguous object kind and mutable history fields.
- CORS allows configured rights web origins with credential and CSRF checks for mutations. Signed-link recipient binding is required when a link action is used; opening a link has no decision effect.
- 403 denotes authenticated actor without authority over a known object, row or ledger. 404 hides unknown or out-of-scope resources. Error details expose stable code and requestId only.
- No role converts credit, performance, project membership, a read receipt or an asserted row into ownership or consent. Public output has no default percentages or dispute existence.
- Canonical row order and hashes prevent tampering. Every consumer must preserve asserted, proposed and consented states and cannot strengthen provenance.

## Data Flow

1. RGT-OBJ-API-01 resolves authority and source references, appends a work or recording and queues a possession proof. It emits rights.object.changed.v1.
2. RGT-OBJ-API-02 reads recording and work objects, validates exact rational link sums and appends a new link-set version without touching recording lineage.
3. RGT-OBJ-API-03 appends a draft or freezes a valid proposed ledger with exact row order, source hash, territory and payout-basis term, then creates pending ledger consent rows and emits rights.ledger.proposed.v1.
4. RGT-OBJ-API-04 validates the party, ledger version and row hash, appends consent or refusal, and emits rights.ledger.consented.v1 only when every required party has valid consent.
5. Shards 14, 18, 20–22, 27 and 28 consume consented projections only. This companion does not decide title, conflict, clearance, payment or downstream legal effect.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| rights.object.changed.v1 | RGT-OBJ-API-01 | objectId hash, kind, lifecycle, source version class and object version; projects, releases, lookup and identifier consumers. Excludes title, party identity and private source data. |
| rights.ledger.proposed.v1 | RGT-OBJ-API-03 | ledgerId, objectId hash, right type, territory class, rows hash, consent-set count and version; consent tasks and split UI consume it. Excludes exact shares and private evidence. |
| rights.ledger.consented.v1 | RGT-OBJ-API-04 | ledgerId, version, party hash, row-state classes and aggregate state; control, licensing and royalty projections consume it. Excludes exact percentages and consent text. |

All events are transactional-outbox records keyed by event ID and aggregate version. Consumers can invalidate derived projections but cannot treat asserted or proposed rows as consented.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RGT-OBJ-API-01 | Ambiguous kind, missing authority, source outage or proof-anchor outage | Return VALIDATION_FAILED, FORBIDDEN or dependency error before unsafe mutation; object may commit proof_failed with retryable same-hash anchor, and non-empty objects remain retained. |
| RGT-OBJ-API-02 | Non-positive or imprecise weight, unreadable work or stale link-set | Return VALIDATION_FAILED, FORBIDDEN or VERSION_CONFLICT; reject whole edit and preserve prior link-set and lineage. |
| RGT-OBJ-API-03 | Unbalanced proposal, incomplete territory, zero row or stale object | Persist valid draft as unallocated; return LEDGER_UNBALANCED, TERRITORY_INCOMPLETE or VERSION_CONFLICT for proposal; never create remainder or alter governing ledger. |
| RGT-OBJ-API-04 | Stale version/hash, refusal, unreachable party or dispatch outage | Return CONSENT_STALE or CONSENT_REQUIRED; append refusal or pending state, never consent by timeout, and retry outbox with same event key. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RGT-OBJ-API-01 | Strict kind, title, source and exact ApiError schema. | Assertion authority, no auto-promotion, CORS/rate and 403/404. | Separate work/recording, tombstone, proof state, RLS/grants and object event. | Anchor outage, replay, source race, duplicate event and title redaction. |
| RGT-OBJ-API-02 | Link type, rational positivity, sum-one and CAS schema. | Recording authority, work readability, CORS/rate and lineage isolation. | Link uniqueness/version, integer arithmetic, RLS/grants and link event path. | Decimal rounding, concurrent stale edit, resolver outage and replay. |
| RGT-OBJ-API-03 | Right type, territory, rows, exact rational and ledger state schema. | Editor authority, no remainder, territory coverage, CORS/rate and private shares. | Draft/proposal invariants, row hashes, consent set, RLS/grants and proposed event. | Unbalanced draft, zero row, stale object, duplicate proposal and redacted gap. |
| RGT-OBJ-API-04 | Frozen version/hash, decision, recipient binding and ConsentState schema. | Whole-ledger presentation, row authority, silence refusal, CORS/rate and privacy. | Exact unique consent, CAS, aggregate transition, RLS/grants and consented event. | Stale hash, unreachable party, refusal, duplicate replay and outbox outage. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects unknown keys, zero rows, invalid denominators, unsupported types and malformed hashes; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 authority, Shard 01 representation, Shard 09 source resolution, proof anchor and outbox adapters with exact timeout and retry behavior.
- Database: verify integer arithmetic, reduced rational constraints, link and ledger CAS, append-only history, consent uniqueness, RLS and no direct client grants.
- Property: permutation of input rows yields one canonical order and same balance; any row change resets all consent; duplicate idempotency keys create one object, link set or decision.
- Acceptance gate: all four operations have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all seven assigned model identifiers and three assigned events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Ambiguous object kind, decimal weight, zero row, missing territory, absent payout term, stale row hash, signed-link opening and unreachable consent each have deterministic refusal or pending state.
- Provenance, arithmetic balance, consent and legal effectiveness are separate outputs. “Balances” is never “valid,” “clear” or legal advice.

### Meso Pass

- work and recording are separate; recording_work_link_version and recording_lineage_edge cannot substitute for one another. rights_ledger_version, rights_ledger_row and ledger_consent preserve version and party boundaries.
- Draft, proposed, consented, refused and unreachable states are not collapsed. A consumer receives safe state and version, not an inferred grant.

### Macro Pass

- Shard 09 supplies source/session facts, Shard 01 supplies authority and representation, Shard 07 supplies credit evidence, and downstream shards consume consented projections. Title, conflict, freeze and specialized positions remain in 10c–10e.
- All mutation and event dispatch are idempotent and append-only. Deletion removes derived access while required proof, ledger and audit history remain.

## Ambiguity Gate

**PASS.** RGT-01 through RGT-04 each map to one authoritative route and complete operation-keyed matrices. Object kind, exact-rational arithmetic, draft versus proposal, territory, consent hash, silence, unreachable party, source proof failure, RLS and consumer state boundaries are deterministic. BE00 ApiError and CORS inheritance are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored explicit rights object, recording link, exact-rational ledger and whole-ledger consent backend contracts. | /write-be-spec |

## Dependency References

- **Consumes:** [BE00 request and error contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas), [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for parties and representation, and [Shard 09 Contracts](../ia/09-projects-collaboration.md#contracts) for works, recordings, sessions and source versions.
- **Publishes:** rights.object.changed.v1, rights.ledger.proposed.v1 and rights.ledger.consented.v1 with hashed, state-safe payloads.
- **Sibling handoff:** 10b consumes consented ledger and object IDs for split, points, buyout and amendment; 10c consumes ledgers for control and title; 10d consumes right types and consented positions; 10e consumes object/version IDs for identifiers and registration.
- **Downstream:** Shards 14, 18, 20–22, 27 and 28 consume consented ledger state only and cannot mutate these tables or treat asserted data as consent.
