# BE-22b — Partner Message, Delivery and Status

Status: Complete

This specification turns Shard 22 interactions DST-08 through DST-13 into six Hono command endpoints. It owns immutable partner knowledge versions, message snapshots/threads, delivery steps and acknowledgements, store-side status, artist links, and editorial/pre-save timeline state. It consumes the 22a readiness, footprint, date-plan, identifier, and finding contracts and never rewrites them.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, partner message/delivery/status subdomain | Approved Shard 22 split assigns DST-08 through DST-13 to 22b. |
| Backend surface | Authenticated Hono REST commands, partner adapters, store-evidence readers, OAuth grant use, Supabase RPCs and leased jobs | IA Contracts lines 112-128; deep dive Partner Knowledge lines 28-37; BE00 Middleware lines 253-297. |
| Canonical owner | 22b owns partner knowledge versions, delivery snapshots/messages/steps/acks, store status, store artist links, and editorial timeline evidence | IA Data Models lines 157-179; deep dive lines 30-37 and 49-58. |
| Consumed authority | 22a owns release/readiness/footprint/date/identifier truth; Shards 01 and 10 own identity/rights; 22b reads pinned revisions and never substitutes them | IA Dependency References lines 346-359 and the 22a BE specification. |
| Split validity | PASS: DST-08 through DST-13 have one delivery/status owner and no conflict with build or lifecycle boundaries | IA interaction table lines 79-102 and approved index split. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/22-release-distribution.md | Overview lines 7-20 | Distribution source-of-truth and partner boundary. |
| .memory/wiki/specs/ia/22-release-distribution.md | Acceptance Criteria lines 52-75 | Message, status, editorial and rejection completion criteria. |
| .memory/wiki/specs/ia/22-release-distribution.md | Interactions lines 88-93 | DST-08 through DST-13 preconditions, behavior, completion, failure and recovery. |
| .memory/wiki/specs/ia/22-release-distribution.md | Global Interaction Rules lines 104-110 | Snapshot, acknowledgement, notification and external-success rules. |
| .memory/wiki/specs/ia/22-release-distribution.md | Contracts lines 112-128 | DeliveryMessageKind, DestinationState, PartnerMEADCapabilityState and error vocabulary. |
| .memory/wiki/specs/ia/22-release-distribution.md | Data Models lines 157-179 | Partner, message, step, ack, store and link invariants. |
| .memory/wiki/specs/ia/22-release-distribution.md | Typed Field Registry lines 181-216 | Core field types and cardinality. |
| .memory/wiki/specs/ia/22-release-distribution.md | Access Control lines 218-240 | Owner, operator, partner and artist-link access boundaries. |
| .memory/wiki/specs/ia/22-release-distribution.md | Event Schemas lines 252-272 | Safe message/status payloads and excluded bytes/secrets. |
| .memory/wiki/specs/ia/22-release-distribution.md | Dependency References lines 346-359 | BE00, Shards 01, 06, 07, 09, 10, 20, 37-39 directions. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Partner Knowledge and Delivery Algorithm lines 28-37 | Profile key, certification, pure generator, sequence-aware dispatch, windows and chase. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Store/Date/Notification Algorithm lines 49-58 | Store-local evidence, ack ordering, partial outcomes and bounded interrupts. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Cross-Shard Contracts lines 85-95 | Readiness, identity, rights and partner seam ownership. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | BE00 wire conventions and ApiError envelope. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | Private schema, RPC-only access, RLS, grants, jobs, provider operations, outbox and audit. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, capability checks and CORS. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, lease and dedupe recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error/Observability lines 416-461 | Boundary mapping, compensation, audit, metrics and traces. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| DST-08 System generates partner message | IA line 88 | BE22B-DST08 | Retained deterministic message for one kind/thread/profile snapshot. |
| DST-09 Delivery operator dispatches | IA line 89 | BE22B-DST09 | Idempotent message-step dispatch with evidenced state. |
| DST-10 System reconciles store status | IA line 90 | BE22B-DST10 | Timestamp-ordered ack plus independent store-local evidence. |
| DST-11 Owner remediates rejection | IA line 91 | BE22B-DST11 | Scoped superseding message for rejecting destination/items only. |
| DST-12 Owner links artist profile | IA line 92 | BE22B-DST12 | Verified or honest merge-chase store artist link. |
| DST-13 Owner manages editorial/pre-save/timeline | IA line 93 | BE22B-DST13 | One-use OAuth, claim source, person-owned critical path and honest deadline state. |

### Canonical Data Models

Literal names from IA Data Models lines 157-179:

release, release_version, release_recording_membership, release_label_copy, label_distribution_mandate, distributor_authority_snapshot, partner_knowledge_version, release_enrichment, release_descriptor_correction, release_finding, delivery_readiness_item, destination_selection, release_date_plan, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, store_artist_link, release_asset_analysis, asset_rendition, release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_whitelist, ugc_claim_case, recording_identifier, release_identifier, catalogue_export_job, import_manifest.

22b owns partner_knowledge_version, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, and store_artist_link. It consumes release, release_version, release_finding, delivery_readiness_item, destination_selection, release_date_plan, release_identifier, release_enrichment, and the remaining canonical models without rewriting them.

### Event Schemas

Literal names from IA Event Schemas lines 256-270:

distribution.release.changed.v1, distribution.readiness.changed.v1, distribution.footprint.changed.v1, distribution.date-plan.changed.v1, distribution.message.changed.v1, distribution.destination-status.changed.v1, distribution.catalogue-lifecycle.changed.v1, distribution.ugc-registration.changed.v1, distribution.identifier.changed.v1, release.enrichment.changed.v1, release.enrichment.delivered.v1, release.descriptor-correction.changed.v1, distribution.partner-capability.changed.v1, distribution.label-copy.changed.v1, distribution.export.changed.v1.

22b emits distribution.message.changed.v1 and distribution.destination-status.changed.v1. No message/media bytes, partner secrets, private rights evidence, exact pre-announcement dates, claim detail, or export URL enters an event.

## Endpoint Reconciliation

| IA interaction | HTTP operation | Command transaction | Success event |
|---|---|---|---|
| DST-08 | POST /api/v1/releases/:releaseId/delivery-messages | Re-read 22a readiness and identifier revisions, resolve immutable partner knowledge, pin snapshot, pure-project bytes, persist thread/supersession and audit/outbox. | distribution.message.changed.v1 |
| DST-09 | POST /api/v1/delivery-messages/:messageId/dispatch | Verify runtime profile admission and assigned queue scope, reserve message-step provider operation, dispatch once, persist acknowledgement window. | distribution.message.changed.v1 |
| DST-10 | POST /api/v1/delivery-messages/:messageId/status/reconcile | Verify ack signature/order, quarantine unknown/out-of-order ack, independently read store-local evidence, persist non-regressing statuses. | distribution.destination-status.changed.v1 |
| DST-11 | POST /api/v1/releases/:releaseId/redeliveries | Bind rejection findings and correction refs, require destructive approval, scope to rejecting partner/items, create superseding message/thread step. | distribution.message.changed.v1 |
| DST-12 | POST /api/v1/releases/:releaseId/artist-links | Resolve Shard 01 party and destination artist ID, verify tier and landing separately, persist link/merge chase. | distribution.destination-status.changed.v1 |
| DST-13 | POST /api/v1/releases/:releaseId/editorial-submissions | Consume one-use OAuth grant, project retained release_enrichment, persist claim/deadline/critical path and honest confirmation. | distribution.message.changed.v1 |

## API Endpoints

### Authoritative Route Registry

This is the only 22b route registry. Operation IDs are stable keys for every contract, error, authorization, idempotency, rate, observability and test row. 22a routes and BE00 platform routes are inherited, not repeated.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE22B-DST08 | POST | /api/v1/releases/:releaseId/delivery-messages | delivery.message_generate | Dst08Success |
| BE22B-DST09 | POST | /api/v1/delivery-messages/:messageId/dispatch | delivery.dispatch | Dst09Success |
| BE22B-DST10 | POST | /api/v1/delivery-messages/:messageId/status/reconcile | delivery.status_reconcile | Dst10Success |
| BE22B-DST11 | POST | /api/v1/releases/:releaseId/redeliveries | delivery.redeliver | Dst11Success |
| BE22B-DST12 | POST | /api/v1/releases/:releaseId/artist-links | release.artist_link | Dst12Success |
| BE22B-DST13 | POST | /api/v1/releases/:releaseId/editorial-submissions | release.editorial | Dst13Success |

### Request/Response Contracts (Zod 4)

Every non-2xx response is ErrorResponse containing the BE00/global ApiError { code, message, requestId, details }. Unknown keys are rejected and route parameters are UUIDs.

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
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: Uuid,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();
const DestinationState = z.enum([
  "not_selected", "queued", "sent", "received", "accepted", "rejected",
  "live_preorder", "live", "partial", "overdue", "unknown", "withdrawn", "removed",
]);
const MessageKind = z.enum(["ern", "mead", "takedown", "update"]);

const Dst08Request = z.object({
  releaseVersionId: Uuid, destinationId: Uuid, kind: MessageKind,
  readinessRevision: Version, validationRevision: Version,
  partnerKnowledgeVersion: z.string().min(1).max(128),
  identifierRevision: Version, priorMessageHash: z.string().length(64).optional(),
  deltaAcknowledged: z.boolean(), deltaAcknowledgedAt: DateTime.optional(),
  idempotencyKey: IdempotencyKey,
}).strict().refine(v => !v.deltaAcknowledged || Boolean(v.deltaAcknowledgedAt),
  { path: ["deltaAcknowledgedAt"], message: "artist-unrequested delta requires acknowledgement time" });
const Dst08Success = z.object({
  deliverySnapshotId: Uuid, messageId: Uuid, threadId: Uuid,
  kind: MessageKind, messageHash: z.string().length(64),
  state: z.enum(["generated", "queued", "blocked", "superseded"]),
  profileVersion: z.string().min(1), version: Version,
}).strict();

const Dst09Request = z.object({
  messageId: Uuid, deliveryStepId: Uuid.optional(),
  runtimeAdmissionVersion: Version, expectedWindowAt: DateTime,
  idempotencyKey: IdempotencyKey,
}).strict();
const Dst09Success = z.object({
  deliveryStepId: Uuid, state: DestinationState, attempt: z.number().int().min(1),
  providerReference: z.string().min(1).max(256).optional(),
  nextActionAt: DateTime.optional(), version: Version,
}).strict();

const StoreStatus = z.object({
  storeId: Uuid, territoryCode: z.string().regex(/^[A-Z]{2,3}$/),
  itemId: Uuid.optional(), state: DestinationState,
  storeEvidenceRef: z.string().min(1).max(256).optional(),
  observedLocalAt: DateTime.optional(),
}).strict();
const Dst10Request = z.object({
  messageId: Uuid, ackId: Uuid, partnerTimestamp: DateTime,
  signature: z.string().min(1).max(4096),
  statuses: z.array(StoreStatus).min(1).max(1000),
  idempotencyKey: IdempotencyKey,
}).strict();
const Dst10Success = z.object({
  reconciliationId: Uuid, quarantined: z.boolean(),
  state: z.enum(["accepted", "rejected", "partial", "live", "unknown", "quarantined"]),
  statuses: z.array(StoreStatus), nextActionAt: DateTime.optional(), version: Version,
}).strict();

const Dst11Request = z.object({
  releaseVersionId: Uuid, sourceMessageId: Uuid, destinationId: Uuid,
  findingIds: z.array(Uuid).min(1).max(100),
  correctionRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  scope: z.enum(["rejected_items_only", "destination_only"]),
  ownerFullApprovalId: Uuid.optional(),
  idempotencyKey: IdempotencyKey,
}).strict().refine(v => Boolean(v.ownerFullApprovalId),
  { path: ["ownerFullApprovalId"], message: "owner Full approval is required for redelivery" });
const Dst11Success = z.object({
  redeliveryPlanId: Uuid, newMessageId: Uuid, threadId: Uuid,
  state: z.enum(["queued", "generated", "blocked"]), destinationId: Uuid, version: Version,
}).strict();

const Dst12Request = z.object({
  releaseVersionId: Uuid, destinationId: Uuid, artistPartyId: Uuid,
  storeArtistId: z.string().min(1).max(256),
  verificationEvidenceRef: z.string().min(1).max(256),
  landingUrl: z.string().url().optional(), idempotencyKey: IdempotencyKey,
}).strict();
const Dst12Success = z.object({
  storeArtistLinkId: Uuid,
  state: z.enum(["asserted", "verified", "merge_chase", "blocked"]),
  verificationTier: z.enum(["asserted", "tier_a_verified"]),
  landingVerifiedAt: DateTime.optional(), version: Version,
}).strict();

const Dst13Request = z.object({
  releaseVersionId: Uuid, destinationId: Uuid, oauthGrantId: Uuid,
  claimSourceRef: z.string().min(1).max(256),
  hardDeadlineAt: DateTime, softDeadlineAt: DateTime,
  criticalPathOwnerPartyId: Uuid, idempotencyKey: IdempotencyKey,
}).strict().refine(v => new Date(v.softDeadlineAt) <= new Date(v.hardDeadlineAt),
  { path: ["softDeadlineAt"], message: "soft deadline must not exceed hard deadline" });
const Dst13Success = z.object({
  submissionId: Uuid,
  state: z.enum(["draft", "submitted", "link_required", "deadline_missed", "confirmed"]),
  oneUseGrantConsumed: z.boolean(),
  criticalPath: z.array(z.object({
    ownerPartyId: Uuid, action: z.string().min(1), dueAt: DateTime,
  }).strict()),
  version: Version,
}).strict();
~~~

### Contract Registry

| Operation ID | Request body | Success body | Canonical validation |
|---|---|---|---|
| BE22B-DST08 | Dst08Request | Dst08Success | Readiness, validation, identifiers, destination and profile revisions are pinned; delta acknowledgement is explicit. |
| BE22B-DST09 | Dst09Request | Dst09Success | Runtime-admitted profile and assigned queue are required; provider response is evidence, not canonical identity. |
| BE22B-DST10 | Dst10Request | Dst10Success | Signature, partner timestamp and store-local evidence are separate checks; status cannot regress. |
| BE22B-DST11 | Dst11Request | Dst11Success | Rejection findings and correction refs scope the new message; owner Full approval is required. |
| BE22B-DST12 | Dst12Request | Dst12Success | Shard 01 party/ID resolution and landing verification are distinct; asserted link is not verified. |
| BE22B-DST13 | Dst13Request | Dst13Success | One-use OAuth and retained release_enrichment source drive an honest editorial state and deadline path. |

### Error Registry

Every row returns ErrorResponse with BE00 ApiError { code, message, requestId, details }. details include safe target, profile/message revision, quarantine reason, retry guidance, or remediation owner only.

| Operation ID | 400 / 401 | 403 vs 404 | 409 | 422 domain errors | 429 / 5xx recovery |
|---|---|---|---|---|---|
| BE22B-DST08 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without message capability; NOT_FOUND hides release/destination | MESSAGE_SEQUENCE_CONFLICT, CONFLICT | DELIVERY_SNAPSHOT_STALE, PROFILE_UNCERTIFIED, MEAD_CERTIFICATION_EVIDENCE_REQUIRED | RATE_LIMITED; no message bytes committed when dependency unavailable. |
| BE22B-DST09 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN for unassigned operator/profile; NOT_FOUND hides message/step | MESSAGE_SEQUENCE_CONFLICT, CONFLICT | PROFILE_UNCERTIFIED, ACK_QUARANTINED | RATE_LIMITED; ambiguous send remains pending for reconciliation, never blind resend. |
| BE22B-DST10 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without reconciliation scope; NOT_FOUND hides message/ack | CONFLICT on ack replay or state revision | ACK_QUARANTINED, DELIVERY_SNAPSHOT_STALE | RATE_LIMITED; unavailable store evidence yields unknown, not live. |
| BE22B-DST11 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without release mandate/Full approval; NOT_FOUND hides finding/message | MESSAGE_SEQUENCE_CONFLICT, CONFLICT | PARTNER_RULE_BLOCKED, DELIVERY_SNAPSHOT_STALE | RATE_LIMITED; only rejecting destination/items are retried. |
| BE22B-DST12 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without release or artist standing; NOT_FOUND hides party/store ID | CONFLICT on link revision | ARTIST_LINK_REQUIRED, PROFILE_UNCERTIFIED | RATE_LIMITED; merge chase remains honest and no guessed landing. |
| BE22B-DST13 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without editorial mandate; NOT_FOUND hides release/destination | CONFLICT on deadline/submission revision | OAUTH_GRANT_REQUIRED, EDITORIAL_DEADLINE_EXPIRED | RATE_LIMITED; spent grant is never retried, unconfirmed state remains visible. |

### Authorization and Middleware Registry

Each operation runs request ID/trace, authenticated session, acting-party capability, explicit CORS policy, rate limit, Zod validation, BE00 idempotency, RPC/adapter/job, audit and outbox in that order. 22b does not authorize from a body-supplied owner or provider reference.

| Operation ID | Roles and ownership | 403 rule | 404 rule | Middleware and CORS |
|---|---|---|---|---|
| BE22B-DST08 | Owner/admin or assigned distribution operator with delivery.message_generate. | FORBIDDEN for unassigned operator, missing mandate, or non-owner. | NOT_FOUND hides release, destination, or profile. | auth → acting-party → CORS distribution-api (allowlisted origins, no wildcard credentials) → rate → Zod → idempotency → RPC. |
| BE22B-DST09 | Assigned delivery operator/worker with delivery.dispatch and queue scope. | FORBIDDEN for another partner, queue, message, or profile. | NOT_FOUND hides message/step. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → provider-operation RPC. |
| BE22B-DST10 | Named reconciler or operator with delivery.status_reconcile; store evidence reader is scoped to destination. | FORBIDDEN for ack/message outside assignment. | NOT_FOUND hides message/ack/store target. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → reconciliation RPC. |
| BE22B-DST11 | Release owner/admin with delivery.redeliver; contributor cannot approve destructive redelivery. | FORBIDDEN without release mandate or owner Full approval. | NOT_FOUND hides release, rejection finding, or source message. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22B-DST12 | Release owner/admin and named Shard 01 artist-link resolver. | FORBIDDEN for another release, artist party, or destination. | NOT_FOUND hides release, party, or store profile. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22B-DST13 | Release owner/admin with release.editorial and a purpose-bound OAuth grant. | FORBIDDEN for contributor without mandate or grant owner mismatch. | NOT_FOUND hides release/destination/editorial target. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → OAuth/RPC. |

### Idempotency and Concurrency Registry

| Operation ID | Key and replay | Version/CAS and ordering | Failure recovery |
|---|---|---|---|
| BE22B-DST08 | Actor/operation/request hash; same request replays snapshot/message for 30 days. | Thread revision and kind are locked; ERN, MEAD, takedown and update threads never supersede each other. | Stale 22a revision halts generation; artist-unrequested delta requires acknowledgement; no fallback profile. |
| BE22B-DST09 | Key binds message and step; provider idempotency key is derived once and never changed. | Step CAS sequence; provider operation remains pending on ambiguous result. | Reconcile provider/store evidence; overdue triggers human chase, never blind resend. |
| BE22B-DST10 | Key binds ack ID, message, partner timestamp and status digest. | Acks order by partner timestamp; recognized duplicate is replay, older/out-of-order is quarantined; store status monotonic per item. | Store outage leaves unknown; quarantined ack is retained for review and cannot regress state. |
| BE22B-DST11 | Key binds source message, destination, finding/correction set and approval. | New superseding message/step; source message bytes immutable; non-rejecting destinations excluded. | Rule failure leaves prior delivery and rejection detail; stale plan requires fresh 22a snapshot. |
| BE22B-DST12 | Key binds release/destination/artist/store evidence. | Link revision CAS; asserted/merge/verified transitions are append-only evidence. | Failed verification remains merge_chase or blocked; no guessed landing. |
| BE22B-DST13 | Key binds OAuth grant, claim source and deadlines. | One-use grant CAS consumes once; deadline revision CAS; submitted does not imply confirmed. | Expired/missing grant returns link_required; provider timeout leaves honest submitted/unknown state. |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | SLO |
|---|---|---|---|
| BE22B-DST08 | 10/minute per actor, release, destination and kind, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding pure-message bytes generation. |
| BE22B-DST09 | 30/minute per operator, message and destination, burst 5 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,000 ms to accepted provider operation. |
| BE22B-DST10 | 60/minute per message and provider, burst 10 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms for 1,000 status rows. |
| BE22B-DST11 | 10/minute per actor, release and destination, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to queue scoped redelivery. |
| BE22B-DST12 | 20/minute per actor, release and destination, burst 4 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms excluding Shard 01 verification. |
| BE22B-DST13 | 5/minute per actor, release and destination, burst 1 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to accepted submission or honest link_required. |

### Observability Registry

| Operation ID | Audit | Metrics | Trace and redaction |
|---|---|---|---|
| BE22B-DST08 | delivery.message.generated with actor, kind, profile/snapshot revisions, delta decision | delivery_message_total by kind/state; profile_uncertified_total | IDs/hashes/revisions only; no message bytes, partner secrets, rights evidence or private dates. |
| BE22B-DST09 | delivery.step.dispatched with operator, message/step, provider operation and outcome | delivery_dispatch_total by state; provider_attempt_total | Idempotency hash/provider reference; request bytes and credentials redacted. |
| BE22B-DST10 | delivery.status.reconciled with ack verification/quarantine and evidence class | ack_total by state; store_status_total by state; quarantine_total | Partner timestamp, status digest and evidence ref; raw payload/signature redacted. |
| BE22B-DST11 | delivery.redelivery.requested with finding IDs, scope and approval | redelivery_total by state; scoped_item_total | IDs and correction hashes; rejected media and rights text excluded. |
| BE22B-DST12 | store.artist_link.changed with party, destination, tier and decision | artist_link_total by state/tier; landing_verification_total | Store ID hash and evidence ref; no unrelated artist PII. |
| BE22B-DST13 | editorial.submission.changed with grant consumption, deadline state and owner | editorial_submission_total by state; deadline_miss_total | Grant ID hash and claim source ref; OAuth token and pitch bytes redacted. |

## Database Schema

All tables are in non-exposed platform_private with RLS enabled and forced. anon, browser direct table access, and broad service-role access are denied. Named security-invoker RPCs/views repeat the actor, acting-party, release-owner, assignment, and purpose predicates. owner_id references identity.party(id); provider references are evidence, not canonical identity.

| Table/model | All persistence fields with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.partner_knowledge_versions / partner_knowledge_version | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); partner_id uuid NOT NULL FK integration.partners(id); destination_id uuid NOT NULL FK distribution.destinations(id); release_type text NOT NULL CHECK length>0; message_version text NOT NULL; deal_shape text NOT NULL; territory_code text NULL CHECK territory_code is null or matches ^[A-Z]{2,3}$; certification partner_capability_state NOT NULL CHECK IN unsupported,certified,revoked; mead_capability_state partner_mead_capability_state NOT NULL CHECK IN unsupported,certified,revoked; rule_pack jsonb NOT NULL; asset_spec_version text NOT NULL; adapter_test_evidence_hash bytea NOT NULL CHECK octet_length=32; tested_schema_version text NOT NULL; tested_at timestamptz NOT NULL; certified_by uuid NULL FK identity.party(id); revoked_at timestamptz NULL; valid_from timestamptz NOT NULL; valid_through timestamptz NULL CHECK valid_through>valid_from; version bigint NOT NULL CHECK >0; state partner_capability_state NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); immutable profile key and unique partner,destination,release_type,message_version,deal_shape,territory_code,version | PK; unique profile key/version; destination_id,certification,valid_through; partner_id,destination_id,updated_at DESC; mead_capability_state,updated_at | Forced RLS for integration-governance capability; second reviewer required for structural changes; certified version immutable; owner/assigned operator reads bounded profile; no browser grant. |
| platform_private.delivery_snapshots / delivery_snapshot | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); destination_id uuid NOT NULL FK distribution.destinations(id); kind delivery_message_kind NOT NULL CHECK IN ern,mead,takedown,update; partner_knowledge_version_id uuid NOT NULL FK platform_private.partner_knowledge_versions(id); readiness_revision bigint NOT NULL CHECK >0; validation_revision bigint NOT NULL CHECK >0; identifier_revision bigint NOT NULL CHECK >0; canonical_snapshot_hash bytea NOT NULL CHECK octet_length=32; rights_basis_hash bytea NOT NULL CHECK octet_length=32; state snapshot_state NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,destination_id,kind,readiness_revision,validation_revision,identifier_revision | PK; release_version_id,destination_id,kind,created_at DESC; partner_knowledge_version_id; state,updated_at | Forced RLS release owner and assigned delivery operator; immutable after message generation; only message RPC can create; 22a revisions are read-only FKs; no browser table grant. |
| platform_private.delivery_messages / delivery_message | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); delivery_snapshot_id uuid NOT NULL FK platform_private.delivery_snapshots(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); destination_id uuid NOT NULL FK distribution.destinations(id); kind delivery_message_kind NOT NULL CHECK IN ern,mead,takedown,update; thread_id uuid NOT NULL; message_hash bytea NOT NULL CHECK octet_length=32; message_bytes_object_id uuid NOT NULL FK platform_private.object_records(id); supersedes_message_id uuid NULL FK platform_private.delivery_messages(id); delta_hash bytea NULL CHECK delta_hash is null or octet_length(delta_hash)=32; delta_acknowledged_at timestamptz NULL; state message_state NOT NULL CHECK IN generated,queued,sent,received,accepted,rejected,superseded,blocked; profile_version text NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique thread_id,kind,version; unique message_hash | PK; release_version_id,destination_id,kind,created_at DESC; thread_id,kind,version DESC; state,updated_at; message_hash | Forced RLS owner/operator assignment; message bytes object is separately authorized and immutable; no app UPDATE/DELETE; only superseding append through command RPC; no direct grant. |
| platform_private.delivery_steps / delivery_step | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); delivery_message_id uuid NOT NULL FK platform_private.delivery_messages(id); step_kind text NOT NULL CHECK IN partner_dispatch,editorial_submission,store_reconcile; sequence_no integer NOT NULL CHECK >0; provider_operation_id uuid NULL FK platform_private.provider_operations(id); idempotency_key_hash bytea NOT NULL CHECK octet_length=32; state delivery_step_state NOT NULL CHECK IN queued,running,sent,received,accepted,rejected,overdue,unknown,quarantined; attempt_count integer NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 32; expected_window_at timestamptz NOT NULL; next_action_at timestamptz NULL; provider_reference text NULL; last_error_code text NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique delivery_message_id,sequence_no; unique provider_operation_id where not null | PK; delivery_message_id,sequence_no; state,next_action_at; provider_operation_id; owner_id,created_at DESC | Forced RLS assigned operator/worker; worker lease and CAS required; provider secret never stored; app cannot rewrite sequence or terminal evidence; editorial step uses same table with purpose-bound grant. |
| platform_private.partner_acks / partner_ack | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); delivery_step_id uuid NOT NULL FK platform_private.delivery_steps(id); external_ack_id text NOT NULL; partner_timestamp timestamptz NOT NULL; received_at timestamptz NOT NULL DEFAULT now(); signature_verified_at timestamptz NULL; payload_digest bytea NOT NULL CHECK octet_length(payload_digest)=32; state ack_state NOT NULL CHECK IN accepted,duplicate,rejected,quarantined; quarantine_reason text NULL; safe_status jsonb NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique provider/external_ack_id through provider_operation FK and unique delivery_step_id,external_ack_id | PK; delivery_step_id,partner_timestamp DESC; state,received_at; payload_digest | Forced RLS integration evidence capability; raw provider payload/signature excluded; accepted state requires verified signature; reconciler may append state only; no browser grant. |
| platform_private.store_statuses / store_status | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); delivery_message_id uuid NOT NULL FK platform_private.delivery_messages(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); store_id uuid NOT NULL FK distribution.stores(id); territory_code text NOT NULL CHECK territory_code ~ ^[A-Z]{2,3}$; item_id uuid NULL FK catalog.recordings(id); state destination_state NOT NULL CHECK IN not_selected,queued,sent,received,accepted,rejected,live_preorder,live,partial,overdue,unknown,withdrawn,removed; store_evidence_ref text NULL; observed_local_at timestamptz NULL; partner_timestamp timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique delivery_message_id,store_id,territory_code,item_id | PK; release_version_id,store_id,territory_code,state; store_id,observed_local_at DESC; delivery_message_id,state | Forced RLS release owner and scoped status reader; monotonic state RPC rejects regression; store evidence ref is purpose-bound; no direct browser table access. |
| platform_private.store_artist_links / store_artist_link | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); destination_id uuid NOT NULL FK distribution.destinations(id); artist_party_id uuid NOT NULL FK identity.party(id); store_artist_id text NOT NULL CHECK length(store_artist_id)>0; verification_tier text NOT NULL CHECK IN asserted,tier_a_verified; state artist_link_state NOT NULL CHECK IN asserted,verified,merge_chase,blocked; claim_state text NOT NULL CHECK IN unclaimed,claimed,merge_pending,merged; verification_evidence_ref text NOT NULL; landing_verified_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,destination_id,artist_party_id; unique destination_id,store_artist_id,artist_party_id | PK; release_version_id,destination_id,state; artist_party_id,state; destination_id,store_artist_id | Forced RLS release owner and Shard 01 resolver; party/ID resolution rechecked by RPC; asserted rows cannot be presented as verified; merge updates append evidence; no unrelated artist PII grant. |

### Shared persistence invariants

- Message kind is part of every thread and uniqueness key. MEAD never supersedes ERN, takedown, or update; MEAD is independently sequenced and never gates ERN.
- Partner profile/rule/spec versions and generated message bytes are immutable. A successor profile or message appends a row and points to the prior row.
- Domain rows, audit_private.audit_events, provider operation evidence, and platform_private.outbox_events commit atomically. Raw provider payloads, media bytes, OAuth tokens, and private rights evidence are not stored in these tables.
- The BE00 idempotency record binds actor, operation, request hash, and message/step or ack target. Registered domain failures replay without duplicate partner effects.
- Direct table grants are absent for anon/authenticated. Named RPCs use security invoker and repeat ownership, operator assignment, provider scope, and purpose. Workers may CAS only leased rows.

## Middleware & Policies

### Hono order and security

1. Attach request ID, trace ID, operation ID, bounded body limit, and provider payload digest.
2. Apply CORS policy distribution-api: explicit allowlisted product origins, POST and OPTIONS only, no wildcard credential mode, Vary: Origin.
3. Authenticate session or verified provider receipt, resolve acting party, release mandate, destination assignment, and capability.
4. Apply operation/actor/message rate limit.
5. Validate path/body with the operation Zod 4 schema; reject unknown keys before lookup.
6. Reserve inherited BE00 idempotency; hash mismatch returns CONFLICT without adapter work.
7. Call named RPC/provider-operation procedure with expected revision and lease token.
8. Append audit/outbox in the same transaction; return only the Success schema.

### Policy rules

| Policy | Required behavior |
|---|---|
| Snapshot admission | DST-08 rereads 22a readiness, validation, footprint, date, identifier, rights basis and profile revisions at handoff. Any drift returns DELIVERY_SNAPSHOT_STALE. |
| Profile certification | Profile key is partner × destination × release type × message version × deal shape, optionally territory. Structural edits require second review and conformance certification. Certification never inherits across partner, destination, adapter, or aggregator. |
| Pure generation | Generator projects canonical data into deterministic bytes and stores hash, input versions, thread, supersession, and receipt. It never fills a missing value or mutates canonical release data. |
| Dispatch | Only certified, runtime-admitted profile and assigned queue scope can dispatch. Provider reference is evidence and no partner response alone proves store live. |
| Acknowledgement | Signature and partner timestamp are checked. Unknown/out-of-order acks are quarantined; status never regresses. |
| Store status | Live/preorder requires independent store-side evidence in store-local time and exact territory/item. Partial retains rejected-item detail. |
| Artist link | A store ID is asserted until Shard 01 verification and landing evidence reach Tier A. Guessed profile links are blocked. |
| Editorial | A one-use purpose-bound OAuth grant is consumed once. Editorial reads the single retained release_enrichment projection and never creates a second claim source. |

## Data Flow

### DST-08 message generation

POST → auth and idempotency → read 22a release/readiness/validation/identifier revisions → resolve current partner_knowledge_version and capability → pin delivery_snapshot → pure deterministic projection → compare prior kind/thread and require delta acknowledgement → persist delivery_message → audit/outbox → Dst08Success. Unsupported, unverified, or revoked MEAD skips before generation and emits no failure event.

### DST-09 dispatch and DST-10 reconciliation

Dispatch verifies runtime admission, queue assignment, message hash, sequence and expected window, then creates one provider operation and step. Reconciliation verifies signed acknowledgement and partner timestamp, quarantines unknown/out-of-order data, and separately reads store-local status. Accepted partner state without store evidence remains accepted or live-wait; it never becomes live.

### DST-11 redelivery

Read rejection findings → confirm corrected source/rendering and per-store effect → require owner Full approval for destructive work → create a new snapshot/message/step for the rejecting destination/items only. The prior message and non-rejecting destinations are unchanged.

### DST-12 and DST-13

Artist link resolves Shard 01 party/ID, records asserted or merge chase, and separately verifies landing. Editorial consumes one-use OAuth, reads release_enrichment, stores claim source and person-owned hard/soft deadline path, and reports submitted/link-required/confirmed honestly.

## State Machines, Concurrency and Failure Recovery

| Aggregate | States and transitions | Guard |
|---|---|---|
| partner_knowledge_version | unsupported → certified → revoked; each certification/revocation creates an attributed immutable successor. | Evidence hash, tested schema/profile, second review, and valid-through required; revoked blocks new MEAD/delivery work. |
| delivery_message | generated → queued → sent → received → accepted or rejected; generated → superseded or blocked. | Message kind/thread sequence and profile snapshot are immutable; MEAD has independent sequence. |
| delivery_step | queued → running → sent → received → accepted/rejected; running → overdue/unknown; any out-of-order input → quarantined. | Provider idempotency key and lease/CAS; ambiguous send remains pending. |
| partner_ack | received → accepted, duplicate, rejected, or quarantined. | Verified signature and monotonic partner timestamp; no state regression. |
| store_status | queued → accepted → live_preorder → live; any path may be partial, overdue, unknown, withdrawn, or removed with evidence. | Store-local evidence required for live; item-level rows preserve partial detail. |
| store_artist_link | asserted → merge_chase → verified, or asserted → blocked; claim_state is separate. | Shard 01 party and destination ID must match; landing is separately witnessed. |
| editorial step | queued → submitted → confirmed, or queued → link_required/deadline_missed. | One-use grant CAS and hard/soft deadline; submitted never implies confirmed. |

| Failure | Transaction outcome | Recovery |
|---|---|---|
| Same idempotency key/hash | Replay stored result and safe status. | No second message, provider operation, ack effect, link, or OAuth spend. |
| Hash mismatch or version CAS loss | No domain/adapter write. | Return CONFLICT and require explicit fresh revision. |
| Profile not certified/runtime suspended | No generation or dispatch. | Surface PROFILE_UNCERTIFIED; prior pinned history remains readable; updates/takedowns against valid pinned versions follow policy. |
| Adapter timeout after send | Provider operation remains pending. | Reconcile by provider operation/idempotency key; no blind resend. |
| Out-of-order/unknown ack | Persist quarantine evidence only. | Human/integration review may append verified correction; recorded state cannot regress. |
| Store evidence unavailable | Keep accepted or unknown, not live. | Retry store reader; overdue generates human chase and bounded interrupt. |
| Redelivery correction stale | No new message. | Re-evaluate 22a snapshot and request new explicit approval. |
| OAuth missing/expired/spent | No editorial provider write. | Return link_required; user obtains a fresh one-use grant. |
| Worker crash | Lease expires; step remains recoverable. | Reclaim with bounded attempts, preserving sequence and provider key. |

## External Seams

No seam is considered successful without the exact response evidence below. All failures return BE00 ApiError { code, message, requestId, details } and preserve canonical state.

| Seam | Exact request | Exact response | Timeout | Retries/backoff | Circuit behavior |
|---|---|---|---:|---|---|
| 22a admission/readiness RPC | releaseVersionId, destinationId, kind, readinessRevision, validationRevision, identifierRevision | releaseVersionId, readinessState, validationRevision, footprintRevision, identifierRevision, canonicalHash | 1,000 ms | 2 reads at 100 ms and 300 ms; no retry after message commit | Open 30 s after 5 failures in 60 s; return DELIVERY_SNAPSHOT_STALE/DEPENDENCY_UNAVAILABLE. |
| Partner adapter HTTPS dispatch | messageId, threadId, kind, messageHash, messageBytesRef, profileVersion, providerIdempotencyKey | providerOperationId, providerReference, acceptedAt, responseWindowAt, acknowledgementId or null | 5,000 ms | 2 attempts at 250 ms and 1,000 ms only when provider confirms no acceptance; ambiguous result is lookup, not resend | Open 30 s after 5 failures in 60 s; step remains pending and human chase applies. |
| Partner operation lookup | providerOperationId, providerIdempotencyKey, messageHash | providerOperationId, state sent/received/accepted/rejected/unknown, partnerTimestamp, providerReference | 3,000 ms | 2 reads at 250 ms and 750 ms | Open 60 s after 5 failures; retain unknown. |
| Store evidence reader | storeId, releaseVersionId, destinationId, territoryCode, itemId, observedAfter | storeId, territoryCode, itemId, state live_preorder/live/partial/unknown, observedLocalAt, evidenceRef | 3,000 ms | 2 reads at 250 ms and 750 ms; no state inference on failure | Open 60 s after 5 failures; status is unknown or prior accepted. |
| Shard 01 artist-link RPC | releaseVersionId, destinationId, artistPartyId, storeArtistId, evidenceRef | linkId, state asserted/verified/merge_chase/blocked, verificationTier, landingVerifiedAt | 1,500 ms | 1 read at 250 ms; no write retry after CAS ambiguity | Open 30 s after 4 failures; remain merge_chase. |
| Editorial OAuth/provider seam | grantId, destinationId, releaseVersionId, claimSourceRef, idempotencyKey, deadline | providerSubmissionId, state submitted/confirmed/link_required, consumedAt, providerDeadline | 4,000 ms | 1 pre-spend retry at 300 ms; never retry after grant consumption without lookup | Open 30 s after 4 failures; no grant replay, return honest submitted/link_required. |

## Events and Async Consumers

### Event envelope

Every outbox event inherits BE00:

~~~ts
type DistributionEvent = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregateType: "delivery_message" | "delivery_step" | "store_status" | "store_artist_link";
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
| BE22B-DST08 | distribution.message.changed.v1 | message/destination/kind/thread/state/version/profile version | Delivery board and dispatch worker; no bytes/secrets. |
| BE22B-DST09 | distribution.message.changed.v1 | message/partner/thread/state/version | Delivery board; provider operation dedupes by provider key. |
| BE22B-DST10 | distribution.destination-status.changed.v1 | release/store/territory/state/version | Board and alerts; unknown/quarantine explicit. |
| BE22B-DST11 | distribution.message.changed.v1 | message/destination/scope/state/version | Dispatch worker; only rejecting target scope. |
| BE22B-DST12 | distribution.destination-status.changed.v1 | release/destination/link state/version | Owner board; artist party access remains scoped. |
| BE22B-DST13 | distribution.message.changed.v1 | release/destination/editorial state/version | Owner tasks and promotion; no claim/pitch bytes. |

Consumers dedupe by eventId and aggregate identity/version. Outbox insert is atomic with each command, lease expiry recovers crashed dispatch, and consumers cannot rewrite 22b canonical rows. A MEAD skip for unsupported/unverified/revoked capability emits no failure event.

## Error Handling

### Boundary matrix

| Boundary | Mapping |
|---|---|
| Zod/path/body failure | HTTP 400 INVALID_ARGUMENT with field paths and safe expected type. |
| Missing/expired session | HTTP 401 UNAUTHENTICATED without existence detail. |
| Owner/operator/destination/grant mismatch | HTTP 403 FORBIDDEN and denied audit. |
| Hidden or absent release/message/step/ack/store | HTTP 404 NOT_FOUND, same for wrong-party probes. |
| Revision, thread sequence, idempotency or one-use CAS conflict | HTTP 409 CONFLICT with current version only when visible. |
| Domain gate | HTTP 422 exact code: DELIVERY_SNAPSHOT_STALE, MESSAGE_SEQUENCE_CONFLICT, PROFILE_UNCERTIFIED, ACK_QUARANTINED, PARTNER_RULE_BLOCKED, ARTIST_LINK_REQUIRED, OAUTH_GRANT_REQUIRED, or EDITORIAL_DEADLINE_EXPIRED. |
| Rate limit | HTTP 429 RATE_LIMITED and bounded Retry-After. |
| Provider/store/OAuth timeout or malformed response | HTTP 503 DEPENDENCY_UNAVAILABLE; pending/unknown state retained. |
| Unhandled error | HTTP 500 INTERNAL; cause remains in Sentry/structured logs keyed by requestId. |

### Error invariants

- Every error response is ErrorResponse with BE00 ApiError { code, message, requestId, details }; details never contain provider payloads, OAuth tokens, message bytes, or private rights evidence.
- A provider acknowledgement alone never maps to store live. A store reader outage maps to unknown or accepted, not inferred live.
- Out-of-order acknowledgements are retained as ACK_QUARANTINED and cannot regress status. A partial result preserves rejected item IDs and remedy.
- Registered domain failures complete BE00 idempotency; retrying the same request cannot duplicate a message thread, provider operation, ack effect, link, or grant spend.

## Testing Strategy

| Operation ID | Contract and handler tests | Authorization, persistence, recovery |
|---|---|---|
| BE22B-DST08 | Strict request/success/error schemas; kind closure; delta acknowledgement; all revision fields; deterministic hash. | Owner/operator assignment; stale 22a facts; profile certification; kind isolation; idempotent replay; bytes immutable; no MEAD skip event. |
| BE22B-DST09 | Step request, response state, provider reference, retry-window fields. | Queue scope and operator 403/404; provider key uniqueness; timeout lookup; circuit open; no blind resend; lease recovery. |
| BE22B-DST10 | Signed ack, timestamp, status array, quarantine response, item-level partial state. | Duplicate/out-of-order ack; signature failure; monotonic status; store-local evidence; unknown on outage; RLS. |
| BE22B-DST11 | Findings/correction scope, approval refinement, superseding response. | Owner Full approval; rejecting destination-only write; non-rejecting untouched; stale plan; idempotency and sequence. |
| BE22B-DST12 | Store ID/tier/state/landing response; URL and evidence validation. | Shard 01 party mismatch; merge chase; no guessed landing; unique link; RLS/PII isolation. |
| BE22B-DST13 | One-use grant, deadline ordering, critical-path response, honest state. | Grant owner/expiry/spend race; provider lookup after timeout; no retry after spend; deadline interrupt and RLS. |

### Cross-cutting tests

- Contract tests validate all six operation schemas and every non-2xx response against ErrorResponse and BE00 ApiError.
- Integration tests use deterministic partner adapter, operation lookup, store reader, Shard 01 resolver, and OAuth fakes with timeout, duplicate, malformed response, and circuit-open cases.
- Property tests prove message kind/thread isolation, ack monotonicity, item-level partial preservation, and no store-live inference without evidence.
- RLS tests cover anonymous, correct owner, wrong user, wrong party, unassigned operator, forged destination, revoked mandate, stale session, service credential misuse, and over-disclosure.
- Event tests verify atomic outbox, eventId dedupe, lease recovery, safe payload exclusions, and zero failure event for MEAD capability skip.

## Deepening Passes

| Pass | Result and evidence |
|---|---|
| 1 Source normalization | PASS — DST-08 through DST-13 each map one-to-one to a route and exact IA line. |
| 2 Boundary review | PASS — 22a owns prerequisite release facts; 22b owns message/delivery/status; 22c and 22d own later lifecycle/enrichment/catalogue actions. |
| 3 Contract deepening | PASS — strict Zod 4 request/success schemas and BE00 ApiError for all six operations. |
| 4 Authorization deepening | PASS — owner, admin, assigned operator, worker, resolver and OAuth grant boundaries include 403/404 behavior. |
| 5 Persistence deepening | PASS — every owned table lists SQL type, nullability, CHECK/FK/unique constraints, query indexes, forced RLS and grants. |
| 6 Concurrency deepening | PASS — thread kind isolation, provider keys, ack ordering, CAS, leases, grant consumption and replay are explicit. |
| 7 Seam deepening | PASS — exact request/response, timeout ms, retry count/backoff and circuit behavior for all seams. |
| 8 Observability deepening | PASS — every operation has audit, metrics, traces, correlation and redaction. |
| 9 Test deepening | PASS — contract, handler, provider, store, OAuth, RLS, property, outbox and recovery cases keyed to each operation. |
| 10 Ambiguity resolution | PASS — micro/macro, two-implementer and devil's-advocate review found no unresolved contract choice. |

## Ambiguity Gate

PASS.

- Micro ambiguity: profile key, certification evidence, message-kind/thread isolation, delta acknowledgement, provider idempotency, ack ordering, store-local proof, redelivery scope, artist verification, one-use OAuth, deadlines, CORS, rate limits, and ApiError are explicit.
- Macro ambiguity: 22b consumes 22a revisions and owns only DST-08 through DST-13. It does not author release/readiness/rights truth or lifecycle/UGC/catalogue/label truth.
- Two-implementer test: one implementer can build Hono handlers from the route/contract/control registries; another can build migrations and worker/RPC logic from database/state/seam tables without a product question.
- Devil's-advocate test: stale snapshot, uncertified profile, ambiguous adapter send, out-of-order ack, store outage, partial rejection, OAuth race, wrong party, and worker crash all have typed recovery.
- Decision lock: no provider acceptance becomes store-live, no profile certification inherits, no unsupported MEAD emits an error event, and no overdue condition triggers blind redelivery.

## Open Questions

None.

## Dependency References

- BE00: inherit command admission, idempotency, audit, private schema boundary, RPC-only grants, forced RLS, provider-operation evidence, outbox leases, Sentry correlation, CORS baseline, and ApiError { code, message, requestId, details }. No BE00 route is duplicated.
- 22a: consume release/readiness/validation/footprint/date/identifier revisions and release findings. DST-08 rereads all required facts at handoff; 22b never changes them.
- Shard 01: consume acting-party authority, label/owner mandate, artist party and store artist-link verification; no identity or artist merge truth is authored here.
- Shard 06: consume trust/safety assignment and claim/review paths for blocked or disputed delivery.
- Shard 09: consume exact audio/version and descriptor projections through 22a; message generation never reauthors audio facts.
- Shard 10: consume rights/consent/territory and provider eligibility facts; a partner ack is not rights evidence.
- Shard 20: consume licensed-inclusion provenance already captured by 22a.
- 22c: consumes message/status history for updates, takedowns and removal; 22b does not initiate destructive lifecycle actions.
- 22d: consumes retained delivery/message/status evidence for enrichment, export, catalogue migration and label/distributor decisions.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Created BE-22b from approved IA Shard 22 split; mapped DST-08 through DST-13; added deterministic message contracts, provider/store/OAuth seams, typed persistence/RLS, sequence recovery, events, tests, deepening passes, and ambiguity gate. | /write-be-spec with approved decision delegation. |
