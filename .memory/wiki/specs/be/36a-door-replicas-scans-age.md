# Door Replicas, Scans & Age Verification — Backend Specification

**Status:** Complete

**IA source:** [Shard 36 — Door access, box office, reconciliation and ticketing risk](../ia/36-box-office-risk.md)

**Platform contract:** [BE 00 — Cross-cutting platform foundation](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 36a: provisioned door replicas, offline/online scans, peer coordination, additive reversals, and age outcome recording |
| Included IA interactions | 36.01–36.05 |
| Included feature | 19.04 Door Scanning & Access Control |
| Canonical models | DoorReplica; ScanEvent |
| Canonical commands | ProvisionDoorReplica; RecordScan |
| Boundary | Door access only; counts/drops/walk-up/close are 36b, refund/change is 36c, external counts are 36d, and transfer/exchange/consent are 36e |

The split is source-faithful. A complete encrypted replica is required for readiness; staleness warns but never refuses. Static signatures are prefilters only. Exact ticket/show/epoch lookup controls verdict. Disconnected duplicate scans admit and reconcile. Age verification stores only outcome/reason class, never ID image, number, birth date, or biometric.

## Referenced Material Inventory

| Material | Source location | Use |
|---|---|---|
| Scope and decisions | [IA 36 lines 7–44](../ia/36-box-office-risk.md#overview) | Door launch, offline, re-entry, age, privacy, and scan verdict rules |
| Feature inventory | [IA 36 lines 46–53](../ia/36-box-office-risk.md#features) | Feature 19.04 |
| Acceptance criteria | [IA 36 lines 55–77](../ia/36-box-office-risk.md#acceptance-criteria) | AC-36.01 through AC-36.05 |
| Interactions | [IA 36 lines 79–103](../ia/36-box-office-risk.md#interactions) | Exact operation names and failure recovery |
| Commands/models | [IA 36 lines 105–170](../ia/36-box-office-risk.md#contracts) | ProvisionDoorReplica, RecordScan, DoorReplica, ScanEvent |
| Access and accessibility | [IA 36 lines 172–207](../ia/36-box-office-risk.md#access-control) | Door/operator roles, minimal lookup, no ID retention, accessible verdicts |
| Events/edge cases | [IA 36 lines 209–272](../ia/36-box-office-risk.md#event-schemas) | boxoffice.scan.recorded, isolated duplicates, device loss, stale replicas |
| Dependencies | [IA 36 lines 274–285](../ia/36-box-office-risk.md#cross-shard-dependencies) | BE00 plus IA 06, 33, and 35 |
| Global wire and error contracts | [BE00 lines 112–200](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Strict Zod 4 and exact ApiError |
| Global middleware/recovery | [BE00 lines 253–500](00-infrastructure.md#middleware--policies) | CORS, auth, idempotency, offline sync, outbox, observability, recovery |

## IA Source Map

| Op | IA interaction | Backend result |
|---|---|---|
| 36.01 | Provision scanner | Complete encrypted DoorReplica artifact and device epoch enter ready |
| 36.02 | Scan ticket | Immutable accept/refuse/override ScanEvent appends locally and synchronizes |
| 36.03 | Coordinate scanners | Causal peer/server merge returns duplicates/conflicts with order confidence |
| 36.04 | Reverse/refuse prior scan | Linked additive reversal/un-admission; original is never deleted |
| 36.05 | Verify age/ID | Human pass/refusal class only; no identity-document data retained |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Interactions | 36.01 Provision scanner; 36.02 Scan ticket; 36.03 Coordinate scanners; 36.04 Reverse/refuse prior scan; 36.05 Verify age/ID |
| Contracts | ProvisionDoorReplica; RecordScan |
| Models | DoorReplica; ScanEvent |
| Events | boxoffice.scan.recorded |

## Endpoint Completeness Reconciliation

| Op | Responsibility | Persistence/effect |
|---|---|---|
| 36.01 | Bind recognized device/operator to exact complete manifest epoch, encrypt minimal lookup, issue expiry | door_replica, replica artifact, device audit |
| 36.02 | Validate token signature as prefilter, exact replica lookup, append verdict, preserve stale warning | scan_event and boxoffice.scan.recorded |
| 36.03 | Merge peer/server causal IDs, retain competing accepts, label conflict/order confidence | scanner_sync_batch plus scan_event conflict projection |
| 36.04 | Authorize reason and append reversal/refusal linked to original | scan_event kind reversal/unadmission and event |
| 36.05 | Validate age policy and append outcome class without identity data | age_verification_outcome plus audit |

No route reads or exposes cross-event ticket facts for an unknown token/name. Re-entry remains a venue physical-token process; digital tickets remain use-once. Count projection is consumed by 36b rather than duplicated here.

## Shared Contract Inheritance

BE00 owns request IDs, authentication, CORS preflight, CSRF, idempotency storage, ETag grammar, upload/artifact lifecycle, device assertions, event envelopes, audit, logging, and recovery. This companion inherits them and defines no generic platform endpoint.

Every failure uses exactly:

~~~ts
type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};
~~~

No other top-level error fields are allowed. Failures include Content-Type: application/json, X-Request-Id, Cache-Control: no-store, and applicable rate headers.

## API Endpoints

### Authoritative Route Registry

| Op | Method and path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| 36.01 | POST /api/v1/box-office/door-replicas | Operator/box-office lead | BE00-CORS-WEB-CREDENTIALLED | JSON, device assertion, If-Match | 12/hour/event | Required 24h | 201 |
| 36.02 | POST /api/v1/box-office/scans | Provisioned door device/operator | BE00-CORS-WEB-CREDENTIALLED | JSON scan union, replica assertion | 1,200/min/device | Required 7d | 201 |
| 36.03 | POST /api/v1/box-office/scanner-coordination | Provisioned device/operator | BE00-CORS-WEB-CREDENTIALLED | Bounded causal batch | 120/min/device | Required 7d | 200 |
| 36.04 | POST /api/v1/box-office/scans/{scanEventId}/reversals | Authorized door lead | BE00-CORS-WEB-CREDENTIALLED | Path, JSON, If-Match | 60/min/event | Required 7d | 201 |
| 36.05 | POST /api/v1/box-office/age-verifications | Provisioned door operator | BE00-CORS-WEB-CREDENTIALLED | JSON outcome-only union | 300/min/device | Required 24h | 201 |

BE00-CORS-WEB-CREDENTIALLED is a configured exact-origin allowlist with credentials and only POST, Content-Type, X-CSRF-Token, Idempotency-Key, If-Match, and X-Device-Assertion. Wildcard/null origins are rejected. BE00 handles OPTIONS before domain auth.

### Operation Contract Matrix

| Op | Request | Success | Failure |
|---|---|---|---|
| 36.01 | ProvisionDoorReplicaRequest plus VersionedDeviceHeaders | ProvisionDoorReplicaResult | BE00 ApiError { code, message, requestId, details } |
| 36.02 | RecordScanRequest plus DeviceCommandHeaders | RecordScanResult | BE00 ApiError { code, message, requestId, details } |
| 36.03 | CoordinateScannersRequest plus DeviceCommandHeaders | CoordinateScannersResult | BE00 ApiError { code, message, requestId, details } |
| 36.04 | ReverseScanRequest plus VersionedDeviceHeaders | ReverseScanResult | BE00 ApiError { code, message, requestId, details } |
| 36.05 | AgeVerificationRequest plus DeviceCommandHeaders | AgeVerificationResult | BE00 ApiError { code, message, requestId, details } |

## Request and Response Contracts — Zod 4

All objects are strict. UUID, timestamp, digest, enum, array, and size bounds are runtime/OpenAPI/test sources. Raw barcode tokens, names, document numbers, birth dates, and images are never accepted by server synchronization contracts.

~~~ts
import { z } from "zod";

const Uuid = z.uuid();
const Instant = z.iso.datetime({ offset: true });
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Version = z.int().positive();
const DeviceCommandHeaders = z.object({
  "idempotency-key": z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  "x-csrf-token": z.string().min(32).max(512),
  "x-device-assertion": z.string().min(32).max(2048),
}).strict();
const VersionedDeviceHeaders = DeviceCommandHeaders.extend({
  "if-match": z.string().regex(/^"[1-9][0-9]*"$/),
}).strict();

export const ProvisionDoorReplica = z.object({
  eventId: Uuid,
  deviceId: Uuid,
  operatorPartyId: Uuid,
  manifestEpoch: Version,
  projectionDigest: Sha256,
}).strict();
export const ProvisionDoorReplicaRequest = ProvisionDoorReplica.extend({
  gateIds: z.array(Uuid).min(1).max(100),
  expectedTicketCount: z.int().min(0).max(500_000),
  lookupFields: z.array(z.enum(["ticket_ref", "normalized_name_key", "age_restriction_class"]))
    .min(1).max(3),
  expiresAt: Instant,
}).strict().refine(v => new Set(v.gateIds).size === v.gateIds.length, {
  message: "gate_ids_must_be_unique",
});
export const DoorReplicaSchema = z.object({
  replicaId: Uuid,
  eventId: Uuid,
  deviceId: Uuid,
  operatorPartyId: Uuid,
  manifestEpoch: Version,
  projectionDigest: Sha256,
  encryptedArtifactRef: Uuid,
  artifactDigest: Sha256,
  expectedTicketCount: z.int().min(0).max(500_000),
  materializedTicketCount: z.int().min(0).max(500_000),
  completeness: z.literal("complete"),
  freshness: z.enum(["current", "stale"]),
  expiresAt: Instant,
  state: z.literal("ready"),
  version: Version,
}).strict().refine(v => v.expectedTicketCount === v.materializedTicketCount, {
  message: "ready_replica_must_be_complete",
});
export const ProvisionDoorReplicaResult = z.object({
  replica: DoorReplicaSchema,
  wrappedKeyRef: Uuid,
  replayed: z.boolean(),
}).strict();

const TokenLookup = z.object({
  kind: z.literal("token"),
  tokenDigest: Sha256,
  signaturePrefilter: z.enum(["valid", "invalid", "not_checked"]),
}).strict();
const NameLookup = z.object({
  kind: z.literal("name_lookup"),
  lookupResultRef: Uuid,
}).strict();
export const RecordScan = z.object({
  eventId: Uuid,
  replicaId: Uuid,
  manifestEpoch: Version,
  deviceId: Uuid,
  gateId: Uuid,
  localRecordId: Uuid,
  localSequence: z.int().positive(),
  scannedAtDevice: Instant,
  credential: z.discriminatedUnion("kind", [TokenLookup, NameLookup]),
  locallyResolvedTicketId: Uuid.nullable(),
  ticketEpoch: Version.nullable(),
  localVerdict: z.enum(["accept", "refuse", "override_accept"]),
  reasonCode: z.enum([
    "valid", "token_unknown", "wrong_event", "wrong_time", "already_used",
    "age_check_required", "operator_override", "signature_prefilter_failed"
  ]),
  replicaFreshness: z.enum(["current", "stale"]),
}).strict().superRefine((v, ctx) => {
  const known = v.locallyResolvedTicketId !== null && v.ticketEpoch !== null;
  if (!known && v.localVerdict !== "refuse")
    ctx.addIssue({ code: "custom", path: ["localVerdict"], message: "unknown_ticket_must_refuse" });
  if (v.localVerdict === "override_accept" && v.reasonCode !== "operator_override")
    ctx.addIssue({ code: "custom", path: ["reasonCode"], message: "override_reason_required" });
});
export const RecordScanRequest = RecordScan.extend({
  peerCausalIds: z.array(Uuid).max(100),
  syncedAt: Instant,
}).strict();
export const ScanEventSchema = z.object({
  scanEventId: Uuid,
  eventId: Uuid,
  ticketId: Uuid.nullable(),
  ticketEpoch: Version.nullable(),
  deviceId: Uuid,
  gateId: Uuid,
  operatorPartyId: Uuid,
  localRecordId: Uuid,
  localSequence: z.int().positive(),
  scannedAtDevice: Instant,
  receivedAtServer: Instant,
  kind: z.enum(["scan", "reversal", "unadmission"]),
  verdict: z.enum(["accept", "refuse", "override_accept", "reversed", "unadmitted"]),
  reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/),
  replicaFreshness: z.enum(["current", "stale"]),
  reversesScanEventId: Uuid.nullable(),
  conflictState: z.enum(["none", "duplicate_isolated", "duplicate_ordered", "resolved"]),
  version: Version,
}).strict().superRefine((v, ctx) => {
  if ((v.kind === "scan") !== (v.reversesScanEventId === null))
    ctx.addIssue({ code: "custom", path: ["reversesScanEventId"], message: "reversal_link_required_only_for_additive_correction" });
});
export const RecordScanResult = z.object({
  scan: ScanEventSchema,
  staleWarning: z.boolean(),
  serverVerdictChanged: z.literal(false),
  replayed: z.boolean(),
}).strict();

const CausalScanRef = z.object({
  scanEventId: Uuid,
  localRecordId: Uuid,
  deviceId: Uuid,
  localSequence: z.int().positive(),
  occurredAt: Instant,
  ticketId: Uuid.nullable(),
  ticketEpoch: Version.nullable(),
  causalParents: z.array(Uuid).max(100),
}).strict();
export const CoordinateScannersRequest = z.object({
  eventId: Uuid,
  replicaId: Uuid,
  batchId: Uuid,
  scans: z.array(CausalScanRef).min(1).max(2000),
  peerWatermarks: z.array(z.object({
    deviceId: Uuid,
    localSequence: z.int().min(0),
  }).strict()).max(100),
}).strict().refine(v => new Set(v.scans.map(x => x.scanEventId)).size === v.scans.length, {
  message: "scan_ids_must_be_unique",
});
const ScanConflict = z.object({
  conflictId: Uuid,
  ticketId: Uuid,
  ticketEpoch: Version,
  scanEventIds: z.array(Uuid).min(2).max(100),
  orderConfidence: z.enum(["causal", "server_time_only", "isolated_unknown"]),
  admissionEffect: z.literal("admit_and_reconcile"),
  state: z.enum(["open", "resolved"]),
}).strict();
export const CoordinateScannersResult = z.object({
  batchId: Uuid,
  acceptedScanIds: z.array(Uuid).max(2000),
  duplicateScanIds: z.array(Uuid).max(2000),
  conflicts: z.array(ScanConflict).max(2000),
  nextWatermark: z.int().min(0),
  replayed: z.boolean(),
}).strict();

export const ReverseScanRequest = z.object({
  action: z.enum(["reverse_accept", "record_refusal", "unadmit"]),
  reasonCode: z.enum(["operator_error", "wrong_ticket", "policy_refusal", "cash_refund", "security_incident"]),
  evidenceRef: Uuid.nullable(),
  occurredAt: Instant,
}).strict();
export const ReverseScanResult = z.object({
  correction: ScanEventSchema,
  gateObservedDelta: z.literal(-1),
  originalPreserved: z.literal(true),
  replayed: z.boolean(),
}).strict();

export const AgeVerificationRequest = z.object({
  eventId: Uuid,
  ticketId: Uuid,
  ticketEpoch: Version,
  deviceId: Uuid,
  gateId: Uuid,
  restrictionClass: z.enum(["none", "age_16", "age_18", "age_21", "venue_defined"]),
  policyVersion: z.string().min(1).max(100),
  outcome: z.enum(["pass", "refuse", "not_required"]),
  refusalClass: z.enum(["under_age", "acceptable_id_not_present", "policy_mismatch"]).nullable(),
  observedAt: Instant,
  retainedIdentityData: z.literal(false),
}).strict().superRefine((v, ctx) => {
  if ((v.outcome === "refuse") !== (v.refusalClass !== null))
    ctx.addIssue({ code: "custom", path: ["refusalClass"], message: "required_only_for_refusal" });
});
export const AgeVerificationResult = z.object({
  ageVerificationId: Uuid,
  ticketId: Uuid,
  outcome: z.enum(["pass", "refuse", "not_required"]),
  refusalClass: z.enum(["under_age", "acceptable_id_not_present", "policy_mismatch"]).nullable(),
  linkedScanEventId: Uuid.nullable(),
  retainedIdentityData: z.literal(false),
  version: Version,
  replayed: z.boolean(),
}).strict();
~~~

### Cross-field and offline rules

| Op | Rule |
|---|---|
| 36.01 | Artifact is ready only when materialized count/digest equal the Shard35 manifest projection; device key wrapping is device-bound and expires |
| 36.02 | Local exact event/ticket/epoch lookup determines verdict; signature prefilter alone never admits; stale replica only sets warning |
| 36.03 | Same ticket admitted on disconnected devices remains admitted twice operationally and creates a visible conflict; server never rewrites local evidence |
| 36.04 | If-Match binds original scan version; one additive correction may affect count once; original and prior corrections remain immutable |
| 36.05 | Request schema makes document image/number/name/date-of-birth impossible; post-sale stricter policy is surfaced to 36c material-change flow |

## Authorization, Ownership, and Disclosure

| Actor | Operations | Limits |
|---|---|---|
| Operator/box-office lead | 36.01, 36.03, 36.04; audit 36.02/05 | Event-scoped, step-up for bulk reprovision/write-off; no fan export |
| Door staff | 36.02, 36.03, 36.05; ordinary override if grant permits | Provisioned device/gate/event only; no sales/refund/count certification |
| Door lead | 36.02–36.05 | Explicit reversal/override reason; cannot delete evidence |
| Service principal | Replica builder/key wrapper and sync worker only | Exact job/event partition; no general attendee reads |
| Support/admin | Expiring purpose grant for mechanical recovery | Cannot fabricate scan/age result or bypass device/replica completeness |
| Fan/performing act/finance | No direct 36a route | Receive only other companions’ authorized projections |

Unrelated event/ticket/scan/replica returns cause-invariant 404 NOT_FOUND. Visible resource with insufficient action grant returns 403 FORBIDDEN. Base-authorized caller needing assurance receives 401 STEP_UP_REQUIRED. Unknown token and wrong-event token have the same safe response shape/timing and never reveal another event. ApiError details for concealed 404 are {}.

Security invariants:

- Acting operator/device comes from session and signed device assertion; body IDs must match grants.
- Replica contains ticket reference, keyed normalized-name lookup, ticket epoch, and age class only; no email, phone, address, document data, or marketing fields.
- Encrypted artifacts use per-device wrapped data keys; device revoke deletes wrapped key and cached artifact access.
- Token digests are keyed; raw tokens never reach server logs/events/storage. Name searches stay local and server sees lookupResultRef only.
- Age outcome is not reusable identity proof. Override/reversal requires bounded reason and audit.
- RLS is forced for API, workers, support, maintenance, and table owner.

## Database Schema

Restricted schema boxoffice_private holds door data. Party FKs use platform_private.party(id). Event/ticket/manifest/device/gate IDs owned by Shards 33/35 or BE00 remain logical references validated by exact versioned seams.

| Logical reference fields | Target or non-FK meaning | Enforcement |
|---|---|---|
| `*.event_id` | Shard33 event/show aggregate UUID | Command resolves the event/version and binds RLS event context before write |
| `scan_event.ticket_id`, `scan_conflict.ticket_id`, `age_verification_outcome.ticket_id` | Shard35 ticket aggregate UUID; nullable only for an unresolved privacy-safe scan lookup | Ticket/epoch seam validation; resolved IDs must belong to the same event |
| `*.device_id`, `*.gate_id` | Shard33 provisioned device and gate aggregate UUIDs | Door-authority seam plus event/device/gate equality under the command lock |
| `door_replica.encrypted_artifact_ref`, `door_replica.wrapped_key_ref` | BE00 artifact and KMS capability UUIDs | Stored only from a successful digest-bound KMS/artifact response; no local SQL FK |
| `scan_event.lookup_result_ref` | Shard35 privacy-safe lookup receipt UUID | Opaque logical reference; lookup response digest and event scope are verified before persistence |
| `scan_event.peer_causal_ids`, `scanner_sync_batch.accepted_scan_ids`, `scanner_sync_batch.duplicate_scan_ids`, `scan_conflict.scan_event_ids` | `boxoffice_private.scan_event(id)` element references | Command validates every array element, same-event ownership, cardinality, and locks referenced rows; PostgreSQL arrays cannot carry element FKs |
| `scan_event.local_record_id` | Device-issued business identity, not a foreign key | Unique with device/epoch and immutable after append |

### Exhaustive typed table definitions

~~~sql
CREATE TABLE boxoffice_private.door_replica (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  event_id uuid NOT NULL,
  device_id uuid NOT NULL,
  operator_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  manifest_epoch bigint NOT NULL CHECK (manifest_epoch > 0),
  projection_digest text NOT NULL CHECK (projection_digest ~ '^[a-f0-9]{64}$'),
  encrypted_artifact_ref uuid NOT NULL,
  artifact_digest text NOT NULL CHECK (artifact_digest ~ '^[a-f0-9]{64}$'),
  wrapped_key_ref uuid NOT NULL,
  expected_ticket_count integer NOT NULL CHECK (expected_ticket_count BETWEEN 0 AND 500000),
  materialized_ticket_count integer NOT NULL CHECK (materialized_ticket_count=expected_ticket_count),
  lookup_fields text[] NOT NULL CHECK (cardinality(lookup_fields) BETWEEN 1 AND 3),
  completeness text NOT NULL CHECK (completeness='complete'),
  freshness text NOT NULL CHECK (freshness IN ('current','stale')),
  state text NOT NULL CHECK (state IN ('ready','revoked','expired')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state<>'ready' OR (completeness='complete' AND materialized_ticket_count=expected_ticket_count)),
  CHECK ((state='revoked') = (revoked_at IS NOT NULL)),
  UNIQUE (event_id, device_id, manifest_epoch)
);

CREATE TABLE boxoffice_private.scan_event (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  event_id uuid NOT NULL,
  ticket_id uuid NULL,
  ticket_epoch bigint NULL CHECK (ticket_epoch IS NULL OR ticket_epoch > 0),
  replica_id uuid NOT NULL REFERENCES boxoffice_private.door_replica(id),
  device_id uuid NOT NULL,
  gate_id uuid NOT NULL,
  operator_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  local_record_id uuid NOT NULL,
  local_sequence integer NOT NULL CHECK (local_sequence > 0),
  scanned_at_device timestamptz NOT NULL,
  received_at_server timestamptz NOT NULL,
  token_digest text NULL CHECK (token_digest IS NULL OR token_digest ~ '^[a-f0-9]{64}$'),
  lookup_result_ref uuid NULL,
  kind text NOT NULL CHECK (kind IN ('scan','reversal','unadmission')),
  verdict text NOT NULL CHECK (verdict IN ('accept','refuse','override_accept','reversed','unadmitted')),
  reason_code text NOT NULL CHECK (reason_code ~ '^[a-z0-9_]{1,64}$'),
  replica_freshness text NOT NULL CHECK (replica_freshness IN ('current','stale')),
  reverses_scan_event_id uuid NULL REFERENCES boxoffice_private.scan_event(id),
  conflict_state text NOT NULL CHECK (conflict_state IN ('none','duplicate_isolated','duplicate_ordered','resolved')),
  peer_causal_ids uuid[] NOT NULL DEFAULT '{}',
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((ticket_id IS NULL) = (ticket_epoch IS NULL)),
  CHECK ((kind='scan') = (reverses_scan_event_id IS NULL)),
  CHECK ((kind='scan' AND ((token_digest IS NULL) <> (lookup_result_ref IS NULL)))
      OR (kind<>'scan' AND token_digest IS NULL AND lookup_result_ref IS NULL)),
  UNIQUE (device_id, local_record_id),
  UNIQUE (device_id, local_sequence)
);

CREATE TABLE boxoffice_private.scanner_sync_batch (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  event_id uuid NOT NULL,
  replica_id uuid NOT NULL REFERENCES boxoffice_private.door_replica(id),
  device_id uuid NOT NULL,
  request_digest text NOT NULL CHECK (request_digest ~ '^[a-f0-9]{64}$'),
  scan_count integer NOT NULL CHECK (scan_count BETWEEN 1 AND 2000),
  accepted_scan_ids uuid[] NOT NULL DEFAULT '{}',
  duplicate_scan_ids uuid[] NOT NULL DEFAULT '{}',
  conflict_count integer NOT NULL CHECK (conflict_count >= 0),
  next_watermark bigint NOT NULL CHECK (next_watermark >= 0),
  state text NOT NULL CHECK (state IN ('applied','partially_recovered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, request_digest)
);

CREATE TABLE boxoffice_private.scan_conflict (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  event_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  ticket_epoch bigint NOT NULL CHECK (ticket_epoch > 0),
  scan_event_ids uuid[] NOT NULL CHECK (cardinality(scan_event_ids) BETWEEN 2 AND 100),
  order_confidence text NOT NULL CHECK (order_confidence IN ('causal','server_time_only','isolated_unknown')),
  admission_effect text NOT NULL CHECK (admission_effect='admit_and_reconcile'),
  state text NOT NULL CHECK (state IN ('open','resolved')),
  resolved_by_party_id uuid NULL REFERENCES platform_private.party(id),
  resolution_code text NULL CHECK (resolution_code IS NULL OR resolution_code ~ '^[A-Z0-9_]{1,64}$'),
  resolved_at timestamptz NULL,
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='resolved') = (resolved_by_party_id IS NOT NULL AND resolution_code IS NOT NULL AND resolved_at IS NOT NULL))
);

CREATE TABLE boxoffice_private.age_verification_outcome (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  event_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  ticket_epoch bigint NOT NULL CHECK (ticket_epoch > 0),
  device_id uuid NOT NULL,
  gate_id uuid NOT NULL,
  operator_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  restriction_class text NOT NULL CHECK (restriction_class IN ('none','age_16','age_18','age_21','venue_defined')),
  policy_version text NOT NULL CHECK (length(policy_version) BETWEEN 1 AND 100),
  outcome text NOT NULL CHECK (outcome IN ('pass','refuse','not_required')),
  refusal_class text NULL CHECK (refusal_class IN ('under_age','acceptable_id_not_present','policy_mismatch')),
  retained_identity_data boolean NOT NULL DEFAULT false CHECK (NOT retained_identity_data),
  linked_scan_event_id uuid NULL REFERENCES boxoffice_private.scan_event(id),
  observed_at timestamptz NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((outcome='refuse') = (refusal_class IS NOT NULL)),
  UNIQUE (event_id, ticket_id, ticket_epoch, version)
);
~~~

scan_event is append-only; triggers reject UPDATE/DELETE. Reversal and unadmission are new rows. DoorReplica and ScanEvent are the exact canonical model names represented by door_replica and scan_event; supporting sync/conflict/age tables make interactions 36.03/05 durable.

### Indexes, RLS, and grants

| Tables | Indexes | RLS | Grants |
|---|---|---|---|
| door_replica | (event_id,device_id,state); (expires_at,state); artifact_digest; operator_party_id | event operator/lead or exact device worker | boxoffice_api command EXECUTE; replica_worker constrained INSERT/UPDATE; no direct client DML |
| scan_event | (event_id,received_at_server,id); (ticket_id,ticket_epoch,scanned_at_device); reversal target; (event_id,verdict); unique local IDs | provisioned event/device staff; lead audit; no fan | scan_sync command INSERT/SELECT; count_worker SELECT minimal; no UPDATE/DELETE |
| scanner_sync_batch | (event_id,device_id,created_at); unique request digest | exact device/operator partition | sync_worker command only |
| scan_conflict | (event_id,state,created_at); ticket epoch; scan_event_ids GIN | door lead/operator; fraud case grant for named conflict | reconciliation command; fraud role read only under case |
| age_verification_outcome | (event_id,ticket_id,observed_at DESC); (event_id,outcome); policy version | exact door event; no finance/marketing/fan read | door command INSERT; aggregate audit function only |

All tables ENABLE and FORCE RLS. Policies require transaction-local app.party_id, app.event_id, app.device_id, app.mandate_id, and app.purpose_grant_id; missing context denies. migration_role owns tables. anon/authenticated/service roles receive no direct DML. SECURITY DEFINER functions pin search_path, keep row_security=on, validate event/device scope, and revoke PUBLIC EXECUTE.

### Retention and deletion

- Replica lookup artifacts and wrapped keys wipe at configured post-close deadline; device revoke invalidates access immediately.
- Scan events retain only ticket/device/operator opaque IDs and bounded reason under show/fraud evidence policy; optional operator linkage deidentifies when lawful after hold.
- No age identity data exists to delete. Outcome retention is the minimum show/refund-dispute period.
- Sync payload staging expires within 24 hours after durable application; conflict evidence follows its case/close hold.
- Event cancellation triggers replica revocation and local wipe command; offline devices enforce expiry and wipe on next launch.

## State Machines, Concurrency, and Recovery

| Aggregate | States/transitions | Recovery invariant |
|---|---|---|
| Replica | building → ready → expired/revoked; current ↔ stale freshness | Incomplete never ready; stale remains usable; revoked key cannot unwrap |
| Scan | append scan; optional additive reversal/unadmission | Original immutable; each correction counts once |
| Sync | unseen → applied/duplicate; isolated conflict open → resolved | Both isolated accepts retained; no last-write-wins |
| Age outcome | pass/refuse/not_required append versions | No identity material; stricter post-sale policy routes material change |

Lock order is event/device → ticket epoch → original scan → idempotency record. Same scan local ID/hash returns saved result; same key/different hash returns 409. Competing device scans do not block offline admission. Server sync serializes per ticket epoch, creates conflict evidence, and never rewrites device time/verdict. Serializable failures retry twice at 25/75 ms jitter; exhaustion returns 409 with no partial rows/outbox.

## Middleware and Per-Operation Policies

Order: BE00 request ID → proxy/security → CORS → body limit → auth/device assertion → CSRF → rate → strict validation → event/device authorization → step-up if required → idempotency/If-Match → transaction → response validation → audit/metrics.

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| 36.01 | first-party-write | operator/lead plus recognized device | 12/hour/event | 128 KiB, complete manifest, If-Match, 24h idempotency |
| 36.02 | first-party-write | device assertion plus door grant | 1,200/min/device | 32 KiB, exact replica/event, 7d idempotency |
| 36.03 | first-party-write | device assertion plus sync grant | 120/min/device | 2 MiB/2,000 scans, 7d idempotency |
| 36.04 | first-party-write | door lead/reversal grant | 60/min/event | 32 KiB, If-Match, 7d idempotency |
| 36.05 | first-party-write | device assertion plus age-check grant | 300/min/device | 16 KiB outcome-only, 24h idempotency |

## Data Flow and External Seams

### Operation flows

| Op | Flow |
|---|---|
| 36.01 | Authenticate → fetch exact manifest projection → prove count/digest completeness → build minimal encrypted artifact → device-wrap key → insert replica/audit/idempotency → commit |
| 36.02 | Local PWA prefilters signature → exact replica lookup → records immediate verdict → online/sync route validates device/replica and appends scan/outbox or returns replay |
| 36.03 | Validate bounded causal graph → upsert by device/local ID → detect ticket-epoch duplicates → retain competing rows/create conflicts → return watermark |
| 36.04 | Authorize/lock original → validate not already corrected for same effect → append linked correction/outbox → count consumer applies delta |
| 36.05 | Authorize current restriction policy → append outcome/reason only → link scan/refund trigger if refused → discard any transient operator UI input |

### External seams

| Seam | Exact request → response | Timeout/retry/circuit |
|---|---|---|
| Shard35 manifest projection | {eventId,manifestEpoch,fields,requestId} → {ticketCount,projectionDigest,encryptedRowsRef,restrictionPolicyVersion} | Timeout 3,000 ms; 2 retries with 250/1,000 ms backoff; circuit opens 60,000 ms after 5 consecutive failures; 36.01 fails REPLICA_INCOMPLETE |
| Shard33 show/device authority | {eventId,deviceId,operatorPartyId,gateIds,permission,asOf} → {authorized,deviceState,showWindow,version} | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens 30,000 ms after 5 consecutive failures; no readiness/online mutation |
| BE00 KMS/artifact | {plaintextRef,dataDigest,deviceKeyRef,expiresAt} → {encryptedArtifactRef,artifactDigest,wrappedKeyRef} | Timeout 5,000 ms; 2 retries with 250/1,000 ms backoff keyed by digest; circuit opens 60,000 ms after 5 consecutive failures; no ready replica until success |
| Peer coordination | {batchId,deviceId,watermark,causalScanRefs} → {acceptedIds,duplicates,conflicts,nextWatermark} | Timeout 500 ms locally; 3 retries with 100/500/2,000 ms backoff; peer circuit opens for 10,000 ms after 5 consecutive failures; isolated operation continues |
| PostgreSQL command RPC | strict request → row/outbox/audit/idempotency | Timeout 2,000 ms; 2 SQLSTATE 40001 retries with 25/75 ms backoff; circuit opens for 15,000 ms after 5 consecutive failures |

No seam transmits raw token, names, ID data, or attendee contact fields.

## Event Contract

All events use BE00 envelope and at-least-once outbox. Consumers dedupe eventId and require monotonic aggregateVersion.

~~~ts
export const BoxOfficeScanRecordedEvent = z.object({
  eventId: Uuid,
  scanEventId: Uuid,
  deviceId: Uuid,
  gateId: Uuid,
  ticketId: Uuid.nullable(),
  ticketEpoch: Version.nullable(),
  kind: z.enum(["scan", "reversal", "unadmission"]),
  verdict: z.enum(["accept", "refuse", "override_accept", "reversed", "unadmitted"]),
  reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/),
  reversesScanEventId: Uuid.nullable(),
  scannedAtDevice: Instant,
  receivedAtServer: Instant,
  replicaFreshness: z.enum(["current", "stale"]),
  conflictState: z.enum(["none", "duplicate_isolated", "duplicate_ordered", "resolved"]),
}).strict(); // boxoffice.scan.recorded
~~~

Payload excludes token/name/ID data and operator free text. Counts/fraud consume opaque ticket/scan refs only.

## Error Handling

| HTTP | Codes | Rule |
|---|---|---|
| 400 | INVALID_REQUEST | Malformed path/header/body |
| 401 | UNAUTHENTICATED, STEP_UP_REQUIRED | Session/device or assurance missing |
| 403 | FORBIDDEN | Visible event/resource but action denied |
| 404 | NOT_FOUND | Absence/concealed denial/unknown cross-event token |
| 409 | CONFLICT, VERSION_MISMATCH, IDEMPOTENCY_MISMATCH | Race or replay mismatch |
| 422 | VALIDATION_FAILED plus domain code | Safe semantic failure |
| 429 | RATE_LIMITED | Exact Retry-After details |
| 502/503/504 | DEPENDENCY_UNAVAILABLE | Safe dependencyClass |
| 500 | INTERNAL_ERROR | details={} |

### Per-operation error matrix

| Op | BE00 ApiError { code, message, requestId, details } domain codes | Recovery |
|---|---|---|
| 36.01 | DEVICE_UNRECOGNIZED; REPLICA_INCOMPLETE; PII_POLICY_FAILED; MANIFEST_VERSION_CHANGED | Correct device/projection; never mark partial ready |
| 36.02 | TOKEN_UNKNOWN; WRONG_TIME; ALREADY_USED; AGE_CHECK_REQUIRED; REPLICA_EXPIRED | Return specific local safe reason; stale alone never refuses |
| 36.03 | CAUSAL_BATCH_INVALID; REPLICA_MISMATCH; SYNC_WINDOW_EXCEEDED | Split/retry batch; isolated evidence remains |
| 36.04 | SCAN_ALREADY_CORRECTED; CORRECTION_FORBIDDEN; VERSION_MISMATCH | Refresh original; append only authorized correction |
| 36.05 | AGE_POLICY_CHANGED; OUTCOME_CLASS_INVALID; TICKET_EPOCH_CHANGED | Refresh policy/ticket; record no identity data |

## Failure Cascades and Observability

| Failure | Durable truth/recovery |
|---|---|
| Device dies unsynced | Peer copy recovers when present; otherwise close receives explicit irrecoverable-device gap |
| Scheduled network outage | Complete replica scans locally; sync queues encrypted; stale warning visible |
| KMS/build failure | No ready replica or wrapped key; retry by digest |
| Duplicate isolated scans | Both accept evidence remains; conflict opens; 36b close labels exception |
| Outbox lag | Scan row/outbox atomic; alert at 15 s due live-count criticality; replay idempotently |
| Revoke/close | Wrapped key revoked, wipe command queued, expiry enforced offline |

Per-operation observability matrix:

| Op | Safe log/metric fields | SLO/alert |
|---|---|---|
| 36.01 | opId,eventId,deviceId,manifestEpoch,count,state; door_replica_total | p95 10 s/500k; incomplete/error >1% alert |
| 36.02 | opId,eventId,deviceId,verdict,reasonCode,freshness,replayed; door_scan_total | local p95 150 ms; sync p95 300 ms; availability <99.99% page |
| 36.03 | opId,batchSize,duplicateCount,conflictCount,orderConfidence; door_sync_total | p95 2 s/2k; backlog >30 s alert |
| 36.04 | opId,action,reasonCode,conflictState; door_scan_correction_total | p95 500 ms; invariant/double-delta page |
| 36.05 | opId,restrictionClass,outcome,refusalClass; door_age_outcome_total | p95 250 ms; any retained-data invariant page |

Logs exclude raw tokens, names, ticket-holder identity, ID data, and lookup contents. Metrics are bounded enums; provider-native diagnostics strips bodies.

## Release, Recovery, and Testing

- Deploy schema/RLS/functions/event schema before routes; provision pilot replicas before enabling offline scanner UI.
- Rollback disables new provisioning/sync writes only after draining scan outbox; local replicas continue until signed expiry.
- Recovery verifies replica digest/count, device key scope, local ID uniqueness, reversal graph, conflict count, outbox age, wipe jobs, and RLS isolation.

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Concurrency/recovery |
|---|---|---|---|
| 36.01 | Complete projection yields ready encrypted replica | Wrong device/event, origin, CSRF, PII field rejected | Manifest race blocks; replay one artifact |
| 36.02 | Exact epoch accept/refuse/override and stale warning | Cross-event token indistinguishable; device scope | Offline duplicate admits, sync replay one row |
| 36.03 | Causal batches dedupe and classify conflicts | Unprovisioned device/concealed event | Peer partition/rejoin preserves both accepts |
| 36.04 | Linked correction decrements once, original unchanged | Lead grant/If-Match/exact ApiError | Competing correction one effect; retry stable |
| 36.05 | Pass/refusal class persists no identity data | ID-like unknown keys rejected; event scope | Policy/ticket race blocks; replay one outcome |

Additional tests cover strict Zod/OpenAPI snapshots, all SQL checks/FKs/index plans, FORCE RLS across roles, token/name privacy, encryption/key revoke, property-generated causal graphs, outbox duplicate/gap/dead-letter, offline Playwright behavior, accessibility verdict semantics, and 1,200 scans/min/device load.

## Deepening Passes

| Pass | Evidence |
|---|---|
| Contract | Five operations have exact schemas, headers, success, ApiError, route, effect, and tests |
| Offline integrity | Completeness, staleness, exact epoch lookup, causal IDs, isolated conflict admission, and additive correction are executable |
| Privacy/security | Minimal encrypted replica, no raw token/name/ID data, device/event RLS, CORS/CSRF, and concealed lookup behavior |
| Reliability | Lock order, idempotency, outbox, retry/circuit seams, wipe, device loss, and conflict recovery |

## Ambiguity Gate

**PASS.** Operations 36.01–36.05, contracts ProvisionDoorReplica and RecordScan, canonical models DoorReplica and ScanEvent, feature 19.04, and event boxoffice.scan.recorded are fully reconciled. Every operation has a unique route and explicit CORS, auth, validation, rate, idempotency, ApiError, observability, persistence, recovery, and tests. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 36a backend contract | /write-be-spec | All |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [IA 06 — Trust, safety, disputes and evidence](../ia/06-trust-safety.md)
- [IA 33 — Show-day execution and recovery](../ia/33-show-day-operations.md)
- [IA 35 — Ticket products, sales, access packages and delivery](../ia/35-ticket-products-sales.md)
- [36b — Counts, Drops, Walk-up & Close](36b-boxoffice-counts-drops-walkup-close.md)
- [36c — Refunds & Event Changes](36c-ticket-refunds-event-changes.md)
- [36d — External Counts, Attestation & Reconciliation](36d-external-counts-attestation-reconciliation.md)
- [36e — Limits, Transfer, Exchange & Consent](36e-ticket-limits-transfer-exchange-consent.md)
