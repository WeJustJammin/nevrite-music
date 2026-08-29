# BE-24d — Custody, Cases, Manifests and Readiness

**Status:** Complete
**Backend surface:** Hono on Cloudflare Workers, Supabase PostgreSQL/RLS, transactional outbox, Cloudflare Queues
**Authority boundary:** Shard 24d owns custody intervals, separately scoped grants, volatile case membership, logistics facts, immutable manifest/readiness snapshots and bulk-theft handoff preparation. Shard 23 owns identity/title/theft truth; Shard 32 owns carnet, advancing and legal logistics documents.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain IA shard split; 24d owns custody, case, manifest/readiness and bulk theft handoff operations | BE index line 41 assigns custody/manifests to 24d; IA interactions 24.10–24.16 at lines 56–62 and 77–83 |
| In-scope operations | Start custody, confirm custody/grants, reconcile stale custody, end/dispute custody, maintain case membership, generate manifest/readiness, bulk theft handoff | IA source interactions lines 66–83; deep-dive Custody State Machine and Case Membership Model lines 61–81 |
| Canonical state | Custody is orthogonal to ownership; grants are separate; cases are effective-dated; snapshots are immutable and gap-led | IA decisions lines 28–35; models lines 121–125; deep-dive Snapshot Contract lines 52–57 |
| Boundary with 24a–24c | Collection/public publication, rigs/compatibility and organisation register/condition are consumed source projections; this companion does not duplicate their routes | IA interactions 24.01–24.09 lines 47–55 and 68–76 |
| Boundary with Shard 23 | Gear identity, ownership/title evidence, theft standing and the theft draft remain Shard 23 truth; this companion only prepares an eligible handoff | IA dependencies lines 220–226 and interaction 24.16 line 83 |
| Boundary with Shard 32 | This companion supplies source snapshots and gaps; Shard 32 owns carnet/advancing, document layout, freight and legal issuance | IA carnet boundary lines 34–35; dependency lines 224 and 254–256 |
| Non-goals | Self-asserted custody authority, automatic return, title transfer, sale/publication authority without grants, false complete carnet output, room availability or insurance adjudication | IA decisions lines 30–35; edge cases lines 209–218; deep dive lines 126–135 |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Overview and scope lines 7–20 | Custody, cases, manifests, logistics facts and bulk theft scope |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Holdings Decisions lines 28–35 | Rig/case grouping, custody orthogonality, self-assertion limits and carnet source boundary |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Acceptance criteria lines 56–62 | Required party roles, state transitions, stale confidence, effective membership, readiness gaps and theft eligibility |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Interactions lines 66–83 | Exact IA interaction IDs, preconditions, success and recovery behavior for 24.10–24.16 |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Command Contracts lines 96–99 | ProposeCustody, RespondCustody, SaveCaseMembership and CreateManifestSnapshot input invariants |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Data Models and Typed Field Registry lines 121–145 | CustodyInterval, CustodyGrant, Case, CaseMembership, GearLogisticsFacts and ManifestSnapshot fields, states and types |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Access Control and Events lines 149–163 and 186–201 | Owner/holder/entity roles, grant limits, realtime restrictions and exact custody/case/manifest/gap events |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Edge Cases lines 205–218 | Transfer/case races, stale return, held-item disclosure, offline divergence and incomplete carnet data |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Authority Derivation lines 43–50 | Effective capability intersection, ownership versus custody and separate disclosure/sell grants |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Snapshot Contract lines 52–57 | Pinned versions, immutable snapshots, four-valued source state and purpose-specific readiness |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Custody State Machine and Case Membership Model lines 61–81 | Valid custody transitions, no automatic return, effective intervals and snapshot continuity |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Disclosure Matrix and Race Resolution lines 83–98 and 110–120 | Disclosure bounds, grant revocation and deterministic race resolution |
| .memory/wiki/specs/be/00-infrastructure.md | Request/Response Contracts lines 112–153 | Zod 4 strictness, BE00 ApiError and safe error details |
| .memory/wiki/specs/be/00-infrastructure.md | Database and RLS lines 208–251 | Forced RLS, grants, audit/outbox/idempotency relation and negative authorization tests |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware and route archetypes lines 255–296 | Hono ordering, CORS, command limits, deadlines and step-up rules |
| .memory/wiki/specs/be/00-infrastructure.md | Protected transaction and deterministic protocol lines 300–353 | Atomic commands, CAS, idempotency hashing, version grammar and collection ceilings |
| .memory/wiki/specs/be/23a-gear-identity-claims-transfers.md | Ownership and transfer contracts | Canonical gear_records, owner authority and transfer source for custody reconciliation |
| .memory/wiki/specs/be/23b-theft-screening-recovery.md | Theft standing and draft handoff contracts | Eligible identity-only theft handoff and duplicate flag behavior |
| .memory/wiki/specs/be/23d-valuation-insurance-discography.md | Value evidence boundary | Purpose-bound value source and no public/private-value leakage |

The requested alias 24-gear-collections.md is absent. The sole canonical IA source used here is .memory/wiki/specs/ia/24-gear-holdings-operations.md; the filename resolution is recorded for audit and does not change the approved 24d boundary.

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend operation | Completion and non-negotiable recovery |
|---|---|---|---|
| 24.10 | IA source lines 56 and 77; deep dive lines 61–75 | BE24D-GHO10 proposes a pending CustodyInterval | Both owner and proposed holder are recorded; pending/self-asserted custody grants no derived authority |
| 24.11 | IA source lines 57 and 78; deep dive lines 63–75 | BE24D-GHO11 accepts or rejects exact custody and separately scoped grants | Partial grant acceptance activates custody only; silence remains neutral |
| 24.12 | IA source lines 58 and 79; deep dive lines 63–66 | BE24D-GHO12 decays confidence and emits one bounded reconciliation prompt | No response makes state stale; it never invents a return or terminal state |
| 24.13 | IA source lines 59 and 80; deep dive lines 63–66 and 110–120 | BE24D-GHO13 appends return/transfer/loss/dispute terminal or contested evidence | Version races produce visible reconciliation; prior evidence remains append-only |
| 24.14 | IA source lines 60 and 81; deep dive lines 76–81 | BE24D-GHO14 appends effective-dated CaseMembership changes | Live packing can change, historical snapshots retain removed facts and offline conflicts remain visible |
| 24.15 | IA source lines 61 and 82; deep dive lines 52–57 | BE24D-GHO15 creates immutable ManifestSnapshot and readiness gaps | Snapshot is gap-led and purpose-bound; it is never labelled as a legal/carnet document |
| 24.16 | IA source lines 62 and 83; theft dependency lines 222–225 | BE24D-GHO16 prepares an identity-only theft draft handoff | Placeholders and quantity lines are excluded and reported; duplicate identities join existing flags |

### Canonical Data Models

| IA Data Models name | 24d realization | Relationship and invariant |
|---|---|---|
| CustodyInterval | gear_custody_intervals | N:1 to canonical gear record and owner/holder parties; pending/active/stale/disputed/ended state never changes title |
| CustodyGrant | gear_custody_grants | N:1 to CustodyInterval; public_disclosure, sell and other scopes are separately accepted/revocable |
| Case | gear_cases | N:1 to controlling party; physical grouping is volatile and independent from rigs |
| CaseMembership | gear_case_memberships | N:1 to Case; effective-dated item/placeholder fact with immutable historical rows |
| GearLogisticsFacts | gear_logistics_facts | N:1 to gear record; optional purpose-specific weight/origin/value source with explicit missing state |
| ManifestSnapshot | gear_manifest_snapshots | Immutable case/rig source versions, item rows and readiness gaps |
| CollectionProjection | consumed from 24a | Private collection is source context only; snapshot does not expose aggregate or hidden location |
| PublicGearProjection | consumed from 24a | Safe label/media may be included only after disclosure policy check |
| Rig | consumed from 24b | Selected rig source is pinned; this companion does not alter rig owner/member state |
| RigVersion | consumed from 24b | Snapshot records exact version; later rig edits do not mutate it |
| RigMember | consumed from 24b | Unresolved/placeholder rows are carried as gaps, not identity |
| CompatibilityRun | consumed from 24b | Advisory findings may be included with freshness; no booking guarantee is produced |
| RegisterLine | consumed from 24c | Identity or quantity source row is retained; quantity is never expanded into units |
| ConditionReport | consumed from 24c | Condition report attribution and conflict state are copied with version |
| PublicBacklineProjection | consumed from 24c | Public projection is not a manifest authority and is never mutated here |

### Event Schemas

| IA Event Schemas event type | Producer/consumer role | Payload restriction |
|---|---|---|
| gear.custody_changed.v1 | Produced by GHO10–GHO13 for custody/grant state changes | Custody ID, prior/new state, grant change classes, actor hashes and version; no private reason/note |
| gear.case_membership_changed.v1 | Produced by GHO14 after membership append | Case/membership IDs, member kind, effective interval, version and actor hash; no serial/private location |
| gear.manifest_snapshot_created.v1 | Produced by GHO15 after immutable snapshot commit | Snapshot ID, purpose, source versions, item/gap counts and actor hash; no raw private values |
| gear.readiness_gap_changed.v1 | Produced when gap state changes and consumed by checklist/touring workers | Subject, gap type, prior/new status and source version; values remain purpose-bound |
| gear.collection_item_published.v1 | Consumed to re-evaluate safe item source | Event hint triggers authorized refetch; it does not grant manifest disclosure |
| gear.rig_version_saved.v1 | Consumed to invalidate selected rig snapshot source | Existing snapshots remain immutable; new snapshot pins a new version |
| gear.rig_member_unresolved.v1 | Consumed to add/retain a manifest unresolved gap | Placeholder remains non-identifying and is never converted to a record by inference |
| gear.compatibility_run_completed.v1 | Consumed as advisory source | Findings are marked advisory and stale when source versions move |
| gear.register_line_changed.v1 | Consumed to refresh identity/quantity rows | Quantity changes remain aggregate and do not create identity rows |
| gear.condition_reported.v1 | Consumed to refresh condition/readiness | Unknown, stale or conflicting condition remains explicit |

All events use eventId, schemaVersion, aggregateId, aggregateVersion, actorId, actingPartyId, correlationId, causationId and occurredAt. Consumers dedupe by eventId and re-read canonical state.

## Endpoint Reconciliation

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| 24.10 Start custody | BE24D-GHO10 | POST /api/v1/gear/custody/proposals | Owns pending bilateral proposal and requested grants; no derived authority |
| 24.11 Confirm custody and grants | BE24D-GHO11 | POST /api/v1/gear/custody/:custodyId/responses | Owns counterparty acceptance and separate grant activation |
| 24.12 Reconcile stale custody | BE24D-GHO12 | POST /api/v1/gear/custody/reconciliations | Owns confidence decay and bounded prompt evidence; no automatic return |
| 24.13 End or dispute custody | BE24D-GHO13 | POST /api/v1/gear/custody/:custodyId/closures | Owns append-only return/transfer/loss/dispute transition with CAS |
| 24.14 Maintain case membership | BE24D-GHO14 | POST /api/v1/gear/cases/:caseId/memberships | Owns effective-dated case changes and historical retention |
| 24.15 Generate manifest/readiness | BE24D-GHO15 | POST /api/v1/gear/manifest-snapshots | Owns immutable gap-led source snapshot; no carnet/legal document |
| 24.16 Bulk theft handoff | BE24D-GHO16 | POST /api/v1/gear/bulk-theft-handoffs | Owns identity eligibility/dedup handoff preparation; Shard 23 owns theft draft |

BE00 routes and 24a–24c routes are dependencies, not alternate handlers. Shard 26 may consume accepted sell grants but cannot infer them from custody. Shard 32 consumes snapshots and owns the document process.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE24D-GHO10 | POST | /api/v1/gear/custody/proposals | 24.10 | gear.custody.propose | ordinary command | 201 Gho10Success |
| BE24D-GHO11 | POST | /api/v1/gear/custody/:custodyId/responses | 24.11 | gear.custody.respond | high-risk authority command | 200 Gho11Success |
| BE24D-GHO12 | POST | /api/v1/gear/custody/reconciliations | 24.12 | gear.custody.reconcile | ordinary command | 200 Gho12Success |
| BE24D-GHO13 | POST | /api/v1/gear/custody/:custodyId/closures | 24.13 | gear.custody.close | high-risk authority command | 200 Gho13Success |
| BE24D-GHO14 | POST | /api/v1/gear/cases/:caseId/memberships | 24.14 | gear.case.membership.write | ordinary command | 201 Gho14Success |
| BE24D-GHO15 | POST | /api/v1/gear/manifest-snapshots | 24.15 | gear.manifest.create | high-risk export command | 201 Gho15Success |
| BE24D-GHO16 | POST | /api/v1/gear/bulk-theft-handoffs | 24.16 | gear.theft.handoff | high-risk protected command | 202 Gho16Success |

Only this registry assigns these operation IDs. The handler rejects method/path mismatch before target lookup, and clients cannot choose a different operation ID.

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict executable contracts for Hono, TypeScript, OpenAPI and tests. Unknown keys fail. Decimal versions use strings. Private identifiers, notes, exact locations and values are returned only when the authorized purpose permits them.

~~~ts
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const uuid = z.string().uuid();
const version = z.string().regex(/^[1-9][0-9]*$/).max(19);
const idemKey = z.string().regex(/^[\x21-\x7e]{8,128}$/);
const text = z.string().min(1).max(256).refine((v) => v.normalize("NFC") === v);
const dateTime = z.string().datetime({ offset: true });
const reason = z.enum(["loan", "service", "consignment", "hire", "in_transit", "room_resident"]);
const custodyState = z.enum(["pending", "active", "stale", "disputed", "ended"]);

const GrantRequest = z.strictObject({
  type: z.enum(["public_disclosure", "sell", "room_publication", "insurance"]),
  subjectPartyId: uuid,
  audience: text.max(120),
  scope: z.array(z.enum(["label", "media", "serial", "value", "location", "public_listing", "sale"])).min(1).max(20),
  startsAt: dateTime,
  endsAt: dateTime.nullable(),
}).superRefine((v, ctx) => {
  if (v.endsAt !== null && Date.parse(v.endsAt) <= Date.parse(v.startsAt)) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "grant end must follow start" });
  }
  if (v.type === "sell" && !v.scope.includes("sale")) {
    ctx.addIssue({ code: "custom", path: ["scope"], message: "sell grant requires sale scope" });
  }
});

const CustodyIntervalResource = z.strictObject({
  id: uuid,
  gearRecordId: uuid,
  ownerPartyId: uuid,
  holderPartyId: uuid,
  reason,
  startsAt: dateTime,
  expectedReturnAt: dateTime.nullable(),
  state: custodyState,
  confidence: z.number().min(0).max(1),
  version,
  createdAt: dateTime,
  updatedAt: dateTime,
});

const CustodyGrantResource = z.strictObject({
  id: uuid,
  custodyId: uuid,
  type: z.enum(["public_disclosure", "sell", "room_publication", "insurance"]),
  subjectPartyId: uuid,
  audience: text.max(120),
  scope: z.array(z.enum(["label", "media", "serial", "value", "location", "public_listing", "sale"])).min(1).max(20),
  acceptedAt: dateTime.nullable(),
  revokedAt: dateTime.nullable(),
  state: z.enum(["proposed", "accepted", "rejected", "revoked"]),
  version,
});

const Gho10Request = z.strictObject({
  gearRecordId: uuid,
  ownerPartyId: uuid,
  holderPartyId: uuid,
  reason,
  startsAt: dateTime,
  expectedReturnAt: dateTime.nullable(),
  requestedGrants: z.array(GrantRequest).max(20),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho10Success = z.strictObject({
  operationId: z.literal("BE24D-GHO10"),
  custody: CustodyIntervalResource,
  grants: z.array(CustodyGrantResource).max(20),
  derivedAuthority: z.literal("none"),
  eventType: z.literal("gear.custody_changed.v1"),
  replayed: z.boolean(),
  createdAt: dateTime,
});

const Gho11Request = z.strictObject({
  custodyId: uuid,
  decision: z.enum(["accept", "partial", "reject"]),
  acceptedGrantIds: z.array(uuid).max(20),
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho11Success = z.strictObject({
  operationId: z.literal("BE24D-GHO11"),
  custody: CustodyIntervalResource,
  grants: z.array(CustodyGrantResource).max(20),
  acceptedGrantCount: z.number().int().nonnegative(),
  silenceNeutral: z.literal(true),
  eventType: z.literal("gear.custody_changed.v1"),
  replayed: z.boolean(),
  updatedAt: dateTime,
});

const Gho12Request = z.strictObject({
  custodyId: uuid,
  freshnessPolicyVersion: version,
  observedAt: dateTime,
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho12Success = z.strictObject({
  operationId: z.literal("BE24D-GHO12"),
  custody: CustodyIntervalResource,
  promptId: uuid,
  promptState: z.enum(["sent", "already_sent", "suppressed"]),
  confidenceBefore: z.number().min(0).max(1),
  confidenceAfter: z.number().min(0).max(1),
  eventType: z.literal("gear.custody_changed.v1"),
  replayed: z.boolean(),
  updatedAt: dateTime,
});

const Gho13Request = z.strictObject({
  custodyId: uuid,
  action: z.enum(["return", "transfer", "loss", "dispute"]),
  effectiveAt: dateTime,
  note: text.max(4000),
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho13Success = z.strictObject({
  operationId: z.literal("BE24D-GHO13"),
  custody: CustodyIntervalResource,
  terminalAction: z.enum(["return", "transfer", "loss", "dispute"]),
  derivedAuthority: z.enum(["none", "preserved_for_review"]),
  eventType: z.literal("gear.custody_changed.v1"),
  replayed: z.boolean(),
  updatedAt: dateTime,
});

const CaseMemberInput = z.strictObject({
  operation: z.enum(["add", "remove"]),
  kind: z.enum(["record", "confirmed_held", "placeholder"]),
  gearRecordId: uuid.nullable(),
  custodyId: uuid.nullable(),
  placeholderCode: z.string().regex(/^[A-Z0-9_-]{1,64}$/).nullable(),
  effectiveAt: dateTime,
}).superRefine((v, ctx) => {
  const validShape =
    (v.kind === "record" && v.gearRecordId !== null && v.custodyId === null && v.placeholderCode === null) ||
    (v.kind === "confirmed_held" && v.gearRecordId !== null && v.custodyId !== null && v.placeholderCode === null) ||
    (v.kind === "placeholder" && v.gearRecordId === null && v.custodyId === null && v.placeholderCode !== null);
  if (!validShape) ctx.addIssue({ code: "custom", path: ["kind"], message: "exact member reference shape is required" });
});

const Gho14Request = z.strictObject({
  caseId: uuid,
  changes: z.array(CaseMemberInput).min(1).max(500),
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const CaseMembershipResource = z.strictObject({
  id: uuid,
  caseId: uuid,
  kind: z.enum(["record", "confirmed_held", "placeholder"]),
  gearRecordId: uuid.nullable(),
  custodyId: uuid.nullable(),
  placeholderCode: z.string().regex(/^[A-Z0-9_-]{1,64}$/).nullable(),
  effectiveFrom: dateTime,
  effectiveTo: dateTime.nullable(),
  state: z.enum(["active", "removed", "conflicted"]),
  version,
});

const Gho14Success = z.strictObject({
  operationId: z.literal("BE24D-GHO14"),
  caseId: uuid,
  caseVersion: version,
  memberships: z.array(CaseMembershipResource).max(500),
  divergence: z.boolean(),
  eventType: z.literal("gear.case_membership_changed.v1"),
  replayed: z.boolean(),
  updatedAt: dateTime,
});

const ManifestSourceRef = z.strictObject({
  subject: text.max(120),
  version,
  state: z.enum(["known", "unknown", "withheld", "not_applicable"]),
});

const Gho15Request = z.strictObject({
  caseVersionRefs: z.array(z.strictObject({ caseId: uuid, version })).max(100),
  rigVersionRefs: z.array(z.strictObject({ rigVersionId: uuid, version })).max(100),
  purpose: z.enum(["private_operations", "production_planning", "advancing_source", "carnet_source", "insurance_review"]),
  asOf: dateTime,
  requestedFields: z.array(z.enum(["serial", "weight", "country_of_origin", "purpose_value", "condition", "consent"])).min(1).max(20),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ManifestItem = z.strictObject({
  rowId: uuid,
  sourceKind: z.enum(["record", "quantity", "placeholder"]),
  sourceId: uuid.nullable(),
  label: text.max(160).nullable(),
  quantity: z.number().int().positive().nullable(),
  fields: z.record(z.string().max(80), z.strictObject({
    state: z.enum(["known", "unknown", "withheld", "not_applicable"]),
    value: z.union([z.string().trim().min(1).max(512), z.number().finite(), z.boolean()]).nullable(),
  })),
});

const ReadinessGap = z.strictObject({
  code: z.string().regex(/^[A-Z0-9_]{1,64}$/),
  subject: text.max(120),
  requiredFor: z.enum(["private_operations", "production_planning", "advancing_source", "carnet_source", "insurance_review"]),
  state: z.enum(["open", "resolved", "withheld"]),
  sourceState: z.enum(["known", "unknown", "withheld", "not_applicable"]),
});

const ManifestSnapshotResource = z.strictObject({
  id: uuid,
  purpose: z.enum(["private_operations", "production_planning", "advancing_source", "carnet_source", "insurance_review"]),
  asOf: dateTime,
  sourceVersions: z.array(ManifestSourceRef).max(200),
  items: z.array(ManifestItem).max(2000),
  gaps: z.array(ReadinessGap).max(1000),
  readiness: z.enum(["ready_for_source", "gaps_present", "withheld"]),
  version,
  createdAt: dateTime,
});

const Gho15Success = z.strictObject({
  operationId: z.literal("BE24D-GHO15"),
  snapshot: ManifestSnapshotResource,
  eventType: z.literal("gear.manifest_snapshot_created.v1"),
  readinessEventType: z.literal("gear.readiness_gap_changed.v1"),
  replayed: z.boolean(),
});

const Gho16Request = z.strictObject({
  caseIds: z.array(uuid).max(100),
  rigVersionIds: z.array(uuid).max(100),
  reportPurpose: z.literal("bulk_theft_handoff"),
  asOf: dateTime,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho16Success = z.strictObject({
  operationId: z.literal("BE24D-GHO16"),
  handoffId: uuid,
  theftDraftId: uuid.nullable(),
  state: z.enum(["queued", "submitted", "duplicate_review", "excluded"]),
  eligibleIdentityIds: z.array(uuid).max(2000),
  excludedPlaceholderCount: z.number().int().nonnegative(),
  excludedQuantityLineCount: z.number().int().nonnegative(),
  duplicateFlagCount: z.number().int().nonnegative(),
  eventType: z.literal("gear.readiness_gap_changed.v1"),
  acceptedAt: dateTime,
});

const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: uuid,
  details: BE00ErrorDetails,
});

const ErrorResponse = z.strictObject({ error: ApiError });
~~~

ErrorResponse is the only failure body. HTTP status remains on the response line. BE00 prohibits generic RFC fields and limits details to 16 keys, four nesting levels and 8 KiB.

### Contract Registry

| Operation ID | Request schema and source fields | Success schema and exact status | Global failure shape |
|---|---|---|---|
| BE24D-GHO10 | Gho10Request: gearRecordId, owner/holder parties, reason, dates, requested grants, idempotencyKey and requestId | Gho10Success, 201; pending CustodyInterval, proposed grants, derivedAuthority none | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24D-GHO11 | Gho11Request: custodyId, accept/partial/reject, exact accepted grant IDs, expectedVersion and idempotencyKey | Gho11Success, 200; custody state and separately scoped grant states, silenceNeutral true | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24D-GHO12 | Gho12Request: custodyId, freshnessPolicyVersion, observedAt, expectedVersion and idempotencyKey | Gho12Success, 200; confidence decay and one prompt state | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24D-GHO13 | Gho13Request: custodyId, terminal/contest action, effectiveAt, note, expectedVersion and idempotencyKey | Gho13Success, 200; append-only state and no derived authority on dispute/loss | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24D-GHO14 | Gho14Request: caseId, effective-dated member changes, expectedVersion and idempotencyKey | Gho14Success, 201; membership rows, new case version and divergence flag | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24D-GHO15 | Gho15Request: case/rig version refs, purpose, asOf, requested fields, idempotencyKey and requestId | Gho15Success, 201; immutable ManifestSnapshot, source states and gap-led readiness | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24D-GHO16 | Gho16Request: selected case/rig IDs, bulk_theft_handoff purpose, asOf and idempotencyKey | Gho16Success, 202; queued/submitted identity-only handoff and exclusions | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |

### Error Registry

| Operation ID | HTTP and code | Trigger | Safe details and recovery |
|---|---|---|---|
| BE24D-GHO10 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Invalid record/party/date/reason/grant scope or unknown key | BE00 FieldViolation rows; no party or gear detail |
| BE24D-GHO10 | 401 UNAUTHENTICATED, 403 FORBIDDEN or 404 NOT_FOUND | Missing session, owner standing absent, or concealed gear/party | Known actor without standing is 403; concealed target is 404 |
| BE24D-GHO10 | 409 IDEMPOTENCY_MISMATCH or 422 CUSTODY_ALREADY_OPEN | Key/body mismatch or overlapping active custody interval | Re-read current interval; no second pending interval |
| BE24D-GHO11 | 400 INVALID_REQUEST or 422 GRANT_SELECTION_INVALID | Unknown grant, grant not proposed for custody or accepted scope mismatch | Return bounded grant code; do not disclose other grants |
| BE24D-GHO11 | 403 FORBIDDEN or 404 NOT_FOUND | Caller is not the proposed counterparty or custody is concealed | No owner/holder graph in details |
| BE24D-GHO11 | 409 VERSION_MISMATCH or 422 CUSTODY_NOT_PENDING | Concurrent response or non-pending state | Re-read state; silence remains neutral and no grant is invented |
| BE24D-GHO12 | 403 FORBIDDEN, 404 NOT_FOUND or 422 FRESHNESS_NOT_DUE | Caller lacks reconciliation role, custody concealed or threshold not reached | Safe reason only; no confidence leak to unauthorized caller |
| BE24D-GHO12 | 409 VERSION_MISMATCH | Custody changed during decay | Retry against current version; no duplicate prompt |
| BE24D-GHO13 | 400 INVALID_REQUEST or 422 INVALID_TERMINAL_ACTION | Invalid action/date/note or terminal action disallowed by state | Field/state code; existing evidence remains |
| BE24D-GHO13 | 403 FORBIDDEN or 404 NOT_FOUND | Caller lacks owner/holder dispute/return standing or custody concealed | Known unauthorized is 403; concealed is 404 |
| BE24D-GHO13 | 409 VERSION_MISMATCH or 422 CUSTODY_NOT_ACTIVE | Race or action against terminal/invalid state | Reconciliation required; no automatic close |
| BE24D-GHO14 | 400 INVALID_REQUEST or 422 MEMBERSHIP_INVALID | Invalid reference union, interval, duplicate position or count | Field violations; no hidden member details |
| BE24D-GHO14 | 403 FORBIDDEN or 404 NOT_FOUND | Caller lacks case controller role or case/member concealed | Known unauthorized case is 403; concealed is 404 |
| BE24D-GHO14 | 409 VERSION_MISMATCH or 422 OFFLINE_DIVERGENCE | Case changed or interval conflicts with pinned history | Return divergence flag and current safe version; no deletion |
| BE24D-GHO15 | 400 INVALID_REQUEST or 422 MANIFEST_PURPOSE_INVALID | Invalid source refs, purpose fields or asOf | Field/gap code; no partial snapshot |
| BE24D-GHO15 | 403 FORBIDDEN or 404 NOT_FOUND | Caller lacks case/rig/export capability or selected source is concealed | No source existence or private grant graph |
| BE24D-GHO15 | 409 VERSION_MISMATCH | A selected case/rig/source changed before snapshot commit | Re-pin all sources and retry |
| BE24D-GHO15 | 422 READINESS_GAPS_PRESENT | Required source is missing/withheld for the selected purpose | 201 gap-led snapshot is valid source evidence; it is never a complete carnet |
| BE24D-GHO16 | 403 FORBIDDEN or 404 NOT_FOUND | No owner/qualifying custody theft standing or selected source concealed | No eligibility graph or target draft detail |
| BE24D-GHO16 | 409 VERSION_MISMATCH | Case/rig source changed during eligibility read | Re-pin and resubmit; prior handoff remains evidence |
| BE24D-GHO16 | 422 NO_ELIGIBLE_IDENTITIES or DUPLICATE_REVIEW | Only placeholders/quantity lines selected or existing theft flags need review | Return counts and safe draft state; no placeholder identity invented |
| All | 429 RATE_LIMITED, 502/503 DEPENDENCY_UNAVAILABLE or 500 INTERNAL_ERROR | Quota, downstream or system failure | BE00 retry/rate details only; no notes, source values, SQL or provider payload |

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/purpose predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE24D-GHO10 | Verified Supabase session; owner/controller or proposed-holder standing for the exact gear | Shard 01 resolves owner/holder relationship; owner must be canonical Shard 23 owner. Known caller without standing is 403; concealed gear/party is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; session; acting context; strict Zod; ownership/overlap RLS; BE00 idempotency/CAS; custody RPC; audit/outbox; normalized response |
| BE24D-GHO11 | Verified session; exact proposed counterparty, with owner/controller review only for registered override path | Counterparty accepts own custody and each grant separately; owner approval is required where policy says owner-confirmed. Known caller without response standing is 403; concealed custody is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credential allowlist, no wildcard, Vary Origin; session/context; step-up for owner override; strict Zod; grant predicates; BE00 idempotency/CAS; custody transaction; redacted audit |
| BE24D-GHO12 | Verified session; owner, holder or freshness worker with reconciliation capability | Custody is authorized and threshold reached; known unauthorized is 403; concealed custody is 404; threshold not reached is typed 422 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/context or worker lease; strict Zod; freshness policy; BE00 idempotency/CAS; prompt/outbox; normalized response |
| BE24D-GHO13 | Verified session; owner/holder with action standing, or scoped dispute capability | Return/transfer/loss requires owner or current holder predicate; dispute may be proposed by either party. Known caller without standing is 403; concealed custody is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/context and step-up for loss/transfer; strict Zod; state/action RLS; BE00 idempotency/CAS; append event; error normalization |
| BE24D-GHO14 | Verified session; case controller or delegated packing operator | Case belongs to acting party and every member source is readable or represented as placeholder. Known actor without control is 403; concealed case/member is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/context; strict Zod; case/member RLS; BE00 idempotency/CAS; membership transaction; audit/outbox; normalized response |
| BE24D-GHO15 | Verified session; owner/controller, delegated holder or entity role with manifest purpose capability; step-up for carnet_source/insurance_review | Caller must read every selected case/rig version and purpose-bound source. Known caller without capability is 403; concealed source is 404; missing field is 422 gap after authorization | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/step-up; strict Zod; source/grant/RLS; BE00 idempotency/CAS; snapshot transaction; outbox; no legal-document claim |
| BE24D-GHO16 | Verified session; owner or qualifying confirmed custody holder with theft-report standing | Each eligible identity is checked in Shard 23; known caller without standing is 403; concealed source is 404; placeholder/quantity exclusion is a safe result | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/step-up; strict Zod; per-source standing/RLS; BE00 idempotency/job admission; handoff transaction/outbox; normalized 202 |

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version/race handling | Atomicity and replay |
|---|---|---|---|
| BE24D-GHO10 | Key binds actor, gear, owner/holder parties, reason, dates, sorted grant requests and operation; request hash stored in BE00 for 30 days | Gear/active interval overlap checked under lock; duplicate pending proposal returns existing interval | Reserve, pending CustodyInterval, proposed grants, audit, gear.custody_changed.v1 and response commit together; matching replay is byte-equivalent |
| BE24D-GHO11 | Key binds actor, custody, decision, sorted accepted grants and expectedVersion | CAS on custody version; each grant acceptance is evaluated against the exact proposal; partial acceptance cannot activate rejected grants | Custody and grant state changes, audit, event and idempotency result commit together; no response means no mutation |
| BE24D-GHO12 | Key binds actor/worker, custody, policy version, observedAt and expectedVersion | CAS confidence/state and unique prompt window prevent duplicate nudges; stale state does not end custody | Decay, prompt evidence, audit, event and replay result commit atomically |
| BE24D-GHO13 | Key binds actor, custody, action, effectiveAt, note digest and expectedVersion | CAS serializes return/transfer/loss/dispute; later version must reconcile rather than overwrite prior terminal evidence | Append terminal/contest record, state, audit, event and idempotency response in one transaction |
| BE24D-GHO14 | Key binds actor, case, sorted changes, effectiveAt values and expectedVersion | Case version CAS; effective intervals may overlap only as a visible conflict; membership history is never deleted | Membership rows, case version, divergence evidence, audit, event and idempotency result commit atomically |
| BE24D-GHO15 | Key binds actor, sorted case/rig version refs, purpose, asOf, requested fields and contract version | All source versions are pinned in one read/transaction; any changed source returns VERSION_MISMATCH | Immutable ManifestSnapshot, gap rows, audit, gear.manifest_snapshot_created.v1, readiness events and replay result commit together |
| BE24D-GHO16 | Key binds actor, sorted case/rig IDs, asOf and report purpose | Source versions and Shard 23 theft standing are re-read; duplicates are joined by canonical identity, not copied | Handoff record, eligible/excluded counts, job/outbox and idempotency result commit; 202 replay returns the same handoff |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit and concurrency | CORS policy | Deadline and SLO |
|---|---|---|---|
| BE24D-GHO10 | 30 requests/minute/user, 60/minute/party, burst 10/10 seconds; max 4 open proposals/gear | gear-api allowlist only; explicit origins, credentials only for allowlisted origins, OPTIONS exposes registered methods/headers, Vary Origin | 15 second hard deadline; p95 under 1,200 ms; no external provider in transaction |
| BE24D-GHO11 | 30/minute/user, 60/minute/party, burst 10/10 seconds; max 4 responses/custody | gear-api allowlist only; no wildcard credentials and no private grant headers | 15 second hard deadline; p95 under 1,200 ms; CAS failure returns before timeout |
| BE24D-GHO12 | 60/minute/user, 120/minute/party, burst 20/10 seconds; one active prompt/custody/policy window | gear-api allowlist only; explicit origins, no wildcard credentials, Vary Origin | 15 second hard deadline; p95 under 1,000 ms; freshness worker uses same bounded command |
| BE24D-GHO13 | 20/minute/user, 40/minute/party, burst 8/10 seconds; max 2 closure attempts/custody | gear-api allowlist only; step-up and note are never echoed in headers | 15 second hard deadline; p95 under 1,200 ms; append-only evidence commits before response |
| BE24D-GHO14 | 60/minute/user, 120/minute/party, burst 20/10 seconds; max 8 case edits/case | gear-api allowlist only; explicit origins, no wildcard credentials, Vary Origin | 15 second hard deadline; p95 under 1,500 ms for 500 changes |
| BE24D-GHO15 | 10/minute/user, 20/minute/party, burst 4/10 seconds; max 2 active snapshots/actor and 2,000 rows | gear-api allowlist only; public origins do not receive private snapshot headers | 15 second hard deadline; p95 under 2,000 ms for 2,000 rows; rendering/legal delivery is downstream |
| BE24D-GHO16 | 5/minute/user, 10/minute/party, burst 2/10 seconds; max 1 active handoff/actor | gear-api allowlist only; explicit origins, no wildcard credentials, Vary Origin | 15 second admission deadline; p95 under 2,000 ms; Shard 23 draft work is asynchronous |

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE24D-GHO10 | Span includes operation ID, requestId, custody/gear hashes, reason class, requested grant count, version and outcome. Metrics cover pending proposals, overlaps, replay, forbidden, conflict and latency | Audit actor/party/gear hashes, reason class, dates bucket, grant types and decision. Never log note, serial, exact location, value or owner graph |
| BE24D-GHO11 | Span includes operation ID, custody hash, decision, accepted grant count, version and state transition. Metrics cover accepted/partial/rejected, grant failures, stale responses and latency | Audit counterparty/custody hashes, grant type/scope class, decision and outcome. No grant audience detail or private identifiers |
| BE24D-GHO12 | Span includes operation ID, custody hash, policy version, confidence buckets, prompt state and version. Metrics cover due/not-due, decay, duplicate suppression, stale and prompt delivery | Audit actor/custody hashes, threshold class, before/after confidence buckets and outcome. No exact location or holder note |
| BE24D-GHO13 | Span includes operation ID, custody hash, action, effective-time bucket, prior/new state and CAS outcome. Metrics cover returns, transfers, loss, dispute, conflicts and latency | Audit actor/custody/gear hashes, action, state versions and decision. Note is hashed/redacted; no title claim or private location |
| BE24D-GHO14 | Span includes operation ID, case hash, change count, member-kind classes, version and divergence. Metrics cover add/remove/conflict, stale edits and snapshot invalidation | Audit actor/case/member digests, operation, interval buckets and outcome. No label, serial, exact packing location or owner |
| BE24D-GHO15 | Span includes operation ID, snapshot hash, purpose, source count, item/gap counts, readiness and source ages. Metrics cover ready/gaps/withheld, source mismatch, replay and p95 | Audit actor/purpose/source hashes, field classes, gap codes and counts. Purpose-bound values are not logged; no legal document claim |
| BE24D-GHO16 | Span includes operation ID, handoff hash, source counts, eligible/excluded/duplicate counts, Shard 23 response class and job state. Metrics cover queued/submitted/duplicate/excluded and latency | Audit actor/source hashes, standing class, counts and outcome. Never log identity labels, serials, theft narratives or draft payload |

## Database Schema

All tables are protected by enabled and forced RLS and are mutated only through named RPCs. Direct anon/authenticated table grants are denied. Every mutable row has a positive version, correlation ID and audit linkage. Immutable snapshots retain source-state labels instead of relying on null omission.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.gear_custody_intervals / CustodyInterval | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); owner_party_id uuid NOT NULL FK identity.party(id); holder_party_id uuid NOT NULL FK identity.party(id); reason custody_reason NOT NULL CHECK IN ('loan','service','consignment','hire','in_transit','room_resident'); starts_at timestamptz NOT NULL; expected_return_at timestamptz NULL; state custody_state NOT NULL CHECK IN ('pending','active','stale','disputed','ended'); confidence numeric(9,6) NOT NULL DEFAULT 1 CHECK confidence BETWEEN 0 AND 1; proposed_by uuid NOT NULL FK auth.users(id); confirmed_at timestamptz NULL; ended_at timestamptz NULL; version bigint NOT NULL DEFAULT 1 CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK owner_party_id<>holder_party_id; CHECK ended_at IS NULL OR state IN ('ended','disputed') | PK; gear_record_id,state,starts_at DESC; owner_party_id,state,updated_at DESC; holder_party_id,state,updated_at DESC; partial gear_record_id where state IN ('pending','active','stale','disputed'); partial expected_return_at where state IN ('active','stale') | Forced RLS. Owner/controller and proposed holder read bounded rows; only counterparty response RPC can confirm; worker may decay confidence by lease; direct SELECT/INSERT/UPDATE/DELETE denied; title remains Shard 23 |
| platform_private.gear_custody_grants / CustodyGrant | id uuid NOT NULL PK DEFAULT gen_random_uuid(); custody_id uuid NOT NULL FK platform_private.gear_custody_intervals(id); type custody_grant_type NOT NULL CHECK IN ('public_disclosure','sell','room_publication','insurance'); issuer_party_id uuid NOT NULL FK identity.party(id); subject_party_id uuid NOT NULL FK identity.party(id); audience text NOT NULL CHECK char_length(audience) BETWEEN 1 AND 120; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='array'; starts_at timestamptz NOT NULL; ends_at timestamptz NULL; state custody_grant_state NOT NULL CHECK IN ('proposed','accepted','rejected','revoked'); accepted_at timestamptz NULL; revoked_at timestamptz NULL; version bigint NOT NULL DEFAULT 1 CHECK version>0; correlation_id uuid NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK ends_at IS NULL OR ends_at>starts_at; CHECK (type<>'sell' OR scope ? 'sale') | PK; custody_id,state; subject_party_id,type,state; issuer_party_id,created_at DESC; partial custody_id where state='accepted'; unique custody_id,type,subject_party_id,audience where state IN ('proposed','accepted') | Forced RLS. Issuer/owner and exact subject read own scoped grant; counterparty acceptance RPC changes state; consumers read only accepted purpose grant; public never reads grant; direct grants denied; revocation append-audited |
| platform_private.gear_cases / Case | id uuid NOT NULL PK DEFAULT gen_random_uuid(); controlling_party_id uuid NOT NULL FK identity.party(id); label text NOT NULL CHECK char_length(label) BETWEEN 1 AND 120; state case_state NOT NULL CHECK IN ('active','retired'); current_version bigint NOT NULL DEFAULT 1 CHECK current_version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() | PK; controlling_party_id,state,updated_at DESC,id; label unique within controlling_party_id where state='active' | Forced RLS. Controller/delegated packer reads/writes through case RPC; 24b/manifest readers receive pinned versions only; public denied; direct grants denied; retirement is audited and historical membership remains |
| platform_private.gear_case_memberships / CaseMembership | id uuid NOT NULL PK DEFAULT gen_random_uuid(); case_id uuid NOT NULL FK platform_private.gear_cases(id); kind case_member_kind NOT NULL CHECK IN ('record','confirmed_held','placeholder'); gear_record_id uuid NULL FK platform_private.gear_records(id); custody_id uuid NULL FK platform_private.gear_custody_intervals(id); placeholder_code text NULL CHECK placeholder_code ~ '^[A-Z0-9_-]{1,64}$'; effective_from timestamptz NOT NULL; effective_to timestamptz NULL CHECK effective_to IS NULL OR effective_to>effective_from; state case_membership_state NOT NULL CHECK IN ('active','removed','conflicted'); case_version bigint NOT NULL CHECK case_version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); CHECK ((kind='record' AND gear_record_id IS NOT NULL AND custody_id IS NULL AND placeholder_code IS NULL) OR (kind='confirmed_held' AND gear_record_id IS NOT NULL AND custody_id IS NOT NULL AND placeholder_code IS NULL) OR (kind='placeholder' AND gear_record_id IS NULL AND custody_id IS NULL AND placeholder_code IS NOT NULL)); CHECK kind<>'placeholder' OR custody_id IS NULL | PK; case_id,effective_from DESC,id; case_id,state,effective_to; gear_record_id,effective_from DESC where gear_record_id IS NOT NULL; custody_id,effective_from DESC where custody_id IS NOT NULL; placeholder_code where kind='placeholder' | Forced RLS inherited through Case controller; active rows may be appended only by case RPC; UPDATE/DELETE denied; manifest RPC can read pinned versions; no public read |
| platform_private.gear_logistics_facts / GearLogisticsFacts | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); weight_grams bigint NULL CHECK weight_grams>=0; country_of_origin char(2) NULL CHECK country_of_origin ~ '^[A-Z]{2}$'; purpose_value_minor bigint NULL CHECK purpose_value_minor>=0; purpose_currency char(3) NULL CHECK purpose_currency ~ '^[A-Z]{3}$'; value_source text NULL CHECK value_source IS NULL OR char_length(value_source) BETWEEN 1 AND 120; fact_type logistics_fact_type NOT NULL CHECK IN ('owner_declared','appraised','documented','unknown'); source_state source_state NOT NULL CHECK IN ('known','unknown','withheld','not_applicable'); source_version bigint NOT NULL CHECK source_version>0; state logistics_fact_state NOT NULL CHECK IN ('current','superseded','withheld'); version bigint NOT NULL CHECK version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK (purpose_value_minor IS NULL) = (purpose_currency IS NULL) | PK; gear_record_id,state,updated_at DESC; gear_record_id,fact_type,source_version DESC; country_of_origin; partial purpose_value_minor where purpose_value_minor IS NOT NULL | Forced RLS. Owner/controller and purpose-authorized manifest RPC read selected facts; public and ordinary holder projections cannot read private values; writes append new version; direct grants denied |
| platform_private.gear_manifest_snapshots / ManifestSnapshot | id uuid NOT NULL PK DEFAULT gen_random_uuid(); controlling_party_id uuid NOT NULL FK identity.party(id); purpose manifest_purpose NOT NULL CHECK IN ('private_operations','production_planning','advancing_source','carnet_source','insurance_review'); as_of timestamptz NOT NULL; case_version_refs jsonb NOT NULL CHECK jsonb_typeof(case_version_refs)='array'; rig_version_refs jsonb NOT NULL CHECK jsonb_typeof(rig_version_refs)='array'; source_versions jsonb NOT NULL CHECK jsonb_typeof(source_versions)='array'; item_rows jsonb NOT NULL CHECK jsonb_typeof(item_rows)='array'; gap_rows jsonb NOT NULL CHECK jsonb_typeof(gap_rows)='array'; readiness manifest_readiness NOT NULL CHECK IN ('ready_for_source','gaps_present','withheld'); version bigint NOT NULL DEFAULT 1 CHECK version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); CHECK jsonb_array_length(item_rows)<=2000 AND jsonb_array_length(gap_rows)<=1000 | PK; controlling_party_id,purpose,created_at DESC,id; purpose,readiness,created_at DESC; GIN case_version_refs; GIN rig_version_refs; correlation_id | Forced RLS. Controller/purpose-authorized caller reads own snapshot; Shard 32 adapter reads through grant-scoped RPC; public denied; immutable after commit; direct grants denied |
| platform_private.gear_theft_handoff_records / TheftHandoff | id uuid NOT NULL PK DEFAULT gen_random_uuid(); controlling_party_id uuid NOT NULL FK identity.party(id); case_ids uuid[] NOT NULL CHECK cardinality(case_ids)<=100; rig_version_ids uuid[] NOT NULL CHECK cardinality(rig_version_ids)<=100; as_of timestamptz NOT NULL; eligible_identity_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[]; excluded_placeholder_count integer NOT NULL CHECK excluded_placeholder_count>=0; excluded_quantity_line_count integer NOT NULL CHECK excluded_quantity_line_count>=0; duplicate_flag_count integer NOT NULL CHECK duplicate_flag_count>=0; theft_draft_id uuid NULL; state theft_handoff_state NOT NULL CHECK IN ('queued','submitted','duplicate_review','excluded'); version bigint NOT NULL DEFAULT 1 CHECK version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK cardinality(eligible_identity_ids)<=2000 | PK; controlling_party_id,created_at DESC,id; state,created_at DESC; GIN case_ids; GIN rig_version_ids; theft_draft_id where theft_draft_id IS NOT NULL | Forced RLS. Owner/qualifying holder reads own bounded handoff; Shard 23 worker consumes via one-way grant RPC; no public read; immutable counts/source selection after submission; direct grants denied |

Each row names SQL type, nullability, constraints and FK targets. JSON arrays are schema-validated before insert and carry sourceState values; null means the field is not applicable under the selected contract, not unknown.

### Index and Constraint Invariants

| Invariant | Enforcement |
|---|---|
| Custody is not title | CustodyInterval FK references canonical gear only; no update to owner/title columns is possible from 24d RPCs |
| Pending authority | Only accepted custody and separately accepted grant scopes can feed downstream capability checks; pending/stale/disputed state yields no authority |
| No automatic return | Freshness worker may decay confidence and mark stale, but only a versioned command may end or dispute custody |
| Grant separation | public_disclosure, sell, room_publication and insurance are distinct rows with subject, audience, term and revocation |
| Effective membership | CaseMembership intervals and versions preserve adds/removes; overlapping impossible physical claims remain conflicted and visible |
| Snapshot immutability | ManifestSnapshot source refs, item rows and gap rows cannot be updated/deleted by application roles |
| Readiness honesty | ready_for_source requires purpose-required fields and grants; gaps_present/withheld remain explicit and never become a complete legal document |
| Theft eligibility | Only canonical identity rows with ownership or qualifying confirmed custody standing enter eligible_identity_ids; placeholders and quantity counts are counted as exclusions |

### Permission and RLS Matrix

| Model | Anonymous | Owner/controller | Confirmed holder | Entity/operator | Queue/consumer |
|---|---|---|---|---|---|
| CustodyInterval | deny | read/propose/close/dispute own gear | propose/respond/close own custody slice | delegated role only when policy permits | freshness worker CAS only |
| CustodyGrant | deny | issue/revoke allowed grants | accept/reject own proposed grants; no self-grant | entity grant only for owned gear | consumers read accepted purpose grant |
| Case | deny | controller/delegated packer | read relevant delegated case | entity packer role | manifest reader pins version |
| CaseMembership | deny | append effective changes | read relevant confirmed custody | delegated packer | snapshot RPC reads pinned facts |
| GearLogisticsFacts | deny | read/write purpose-authorized facts | relevant operational fields only | registered logistics role | manifest consumer read |
| ManifestSnapshot | deny | create/read purpose-authorized snapshot | read only when delegated purpose | Shard 32 scoped read | immutable consumer read |
| TheftHandoff | deny | create/read own handoff | create only with qualifying standing | no broad override | Shard 23 one-way handoff worker |

Every RPC repeats acting party, source relation, purpose, version and disclosure predicates. Realtime messages carry only IDs, versions, gap counts and state hints; consumers refetch canonical rows.

## Middleware & Policies

### Hono Order and Security

1. Route inventory assigns one operation ID and rejects method/path mismatch.
2. Transport validates/replaces X-Request-Id, starts correlation, enforces TLS/security headers, body/URL/header ceilings and CORS policy gear-api. OPTIONS exposes only registered methods and headers.
3. Supabase session verification runs before target lookup. Worker paths use a registered lease credential, not a browser session.
4. Shard 01 resolves acting party, owner/holder/entity role, purpose and step-up freshness. Client IDs never grant capability.
5. Strict Zod parses path, headers and body; unknown keys, malformed UUIDs, invalid versions, invalid intervals, non-finite values and oversized arrays fail before resource disclosure.
6. Authorization checks canonical ownership, custody state, grant scope, case controller, source versions, manifest purpose, theft standing and privacy.
7. BE00 idempotency and expected-version CAS share one PostgreSQL transaction with state, audit and outbox. No Shard 23 draft or external document call runs inside it.
8. Success output is parsed again; strong ETag uses the decimal version; errors map to BE00 ApiError and no private provider/SQL detail.
9. Audit and metrics close with redacted hashes. Queue dispatch occurs after commit; expired leases are swept and retried.

### Policy Rules

| Policy | Enforced behavior |
|---|---|
| Effective capability | acting-party role intersects ownership, confirmed custody, accepted grant and current policy; missing any term denies the derived action |
| Custody state | pending/stale/disputed does not create sale, listing, publication or insurance authority; ended is terminal evidence |
| Grant scope | A grant names subject, audience, scope, term and revocation; acceptance of custody does not accept every grant |
| Freshness | Threshold marks stale and prompts both ends once per policy window; no response never creates a return |
| Case continuity | Live set changes through effective-dated rows; snapshots pin prior sets and retain removed facts |
| Manifest source | Four-valued source state is mandatory; no omitted field is treated as known absence |
| Purpose value | Value source is private and purpose-bound; public/backline projections cannot read it |
| Theft handoff | Identity eligibility is rechecked against Shard 23 standing; placeholders and quantity lines are excluded, counted and reported |
| Shard boundary | Shard 32 receives source data/gaps and decides carnet/advancing; 24d never emits a legal-complete document |

## Data Flow

### 24.10 Start custody

1. Validate Gho10Request and resolve actor/owner/holder relations.
2. Read Shard 23 canonical gear identity and current owner; reject concealed/nonexistent records safely.
3. Check overlapping custody intervals and policy reason. Require owner standing or proposed-holder invitation path.
4. Reserve idempotency, insert pending CustodyInterval and proposed CustodyGrant rows, write audit and gear.custody_changed.v1.
5. Commit and return derivedAuthority none. No listing/publication/transfer/insurance consumer may use pending state.

### 24.11 Confirm custody and grants

1. Validate exact custody, decision, accepted grant IDs and expectedVersion.
2. Authorize the counterparty. Re-read proposed grants and ensure each accepted ID belongs to this custody and its scope is explicit.
3. CAS pending custody to active on accept/partial, or terminal rejected evidence on reject. Activate only selected accepted grants; silence has no command effect.
4. Write audit/event and idempotency result atomically. Return custody and every grant state with separate authority.

### 24.12 Reconcile stale custody

1. Validate custody ID, freshness policy version, observed time and expectedVersion.
2. Confirm configured threshold is reached and actor is owner, holder or named freshness worker.
3. Decay confidence deterministically, mark stale if threshold requires, and insert one prompt record/outbox for both ends in the current policy window.
4. Never set ended or returned. Return prompt state sent/already_sent/suppressed and before/after confidence.

### 24.13 End or dispute custody

1. Validate action and effectiveAt; require owner/holder standing and step-up for loss/transfer where policy requires.
2. CAS current active/stale interval. Return appends ended state for return/transfer/loss, or disputed state with derivedAuthority none.
3. Preserve prior grants as revoked or review-preserved according to action; do not transfer title or infer new owner.
4. Emit gear.custody_changed.v1, audit and any readiness invalidation atomically. Races return VERSION_MISMATCH and retain both evidence paths for reconciliation.

### 24.14 Maintain case membership

1. Validate caseId, effective-dated changes and exact record/confirmed-held/placeholder union.
2. Authorize case controller and each member source. Inaccessible source may be an explicit placeholder only.
3. Lock Case, assert current version, append membership rows and increment case version. Keep prior rows for snapshots.
4. Mark divergence when effective intervals conflict; do not silently choose a physical packing claim.
5. Emit gear.case_membership_changed.v1 and return current safe membership view. Offline retries use expectedVersion.

### 24.15 Generate manifest/readiness

1. Validate source refs, purpose, asOf and requested fields. Require all selected case/rig versions to be readable.
2. Read pinned case memberships, rig members, register/condition facts, safe identity projection, custody/grants and logistics facts.
3. Classify every requested field as known, unknown, withheld or not_applicable. Apply purpose-required field matrix and create gap codes.
4. Persist immutable ManifestSnapshot and readiness change events in one transaction. ready_for_source means only purpose-specific source completeness; it does not mean legal carnet complete.
5. Return snapshot and gap-led readiness. Shard 32 may request a refreshed snapshot when source versions differ.

### 24.16 Bulk theft handoff

1. Validate selected case/rig IDs and owner/qualifying custody standing.
2. Resolve pinned members to canonical Shard 23 identity IDs. Exclude placeholders, quantity RegisterLine sources and concealed/non-eligible records with safe counts.
3. Submit an identity-only handoff through Shard 23 idempotent job admission. Existing flags join by canonical gear identity; no duplicate identity row is created.
4. Persist TheftHandoff, audit and outbox. Return 202 with queued/submitted state. Shard 23 owns draft content and theft status.

## State Machines, Concurrency and Failure Recovery

### CustodyInterval

| State | Allowed transition | Guard and recovery |
|---|---|---|
| pending | pending to active | Counterparty accepts exact custody; partial grant acceptance still activates custody only |
| pending | pending to disputed | Owner/holder disagreement is recorded; no grant or derived authority |
| pending | pending to ended | Explicit rejection/withdrawal command; no automatic time transition |
| active | active to stale | Freshness threshold reached; confidence decays and prompts, not ends |
| active | active to disputed | Counterparty dispute command; listing/publication/sale authority is suppressed |
| active | active to ended | Explicit return/transfer/loss command with CAS |
| stale | stale to active | Fresh confirmation command restores confidence only from evidence |
| stale | stale to disputed or ended | Explicit action; stale age alone cannot close |
| disputed | disputed to active or ended | Reconciliation command with current version; prior dispute remains evidence |
| ended | terminal | New custody interval required for future possession; old grants do not revive |

### CustodyGrant

| State | Allowed transition | Guard and recovery |
|---|---|---|
| proposed | proposed to accepted | Exact subject accepts and owner policy permits scope |
| proposed | proposed to rejected | Counterparty declines; no external authority |
| accepted | accepted to revoked | Issuer/policy revokes; future projections suppress immediately |
| rejected | terminal | New proposal required |
| revoked | terminal evidence | Historical lawful snapshots are retained under retention policy |

### Case and snapshot states

| Aggregate | State | Meaning |
|---|---|---|
| Case | active | Live effective-dated membership can append through version CAS |
| Case | retired | No new membership; historical facts remain readable |
| CaseMembership | active | Effective interval contributes to live/snapshot set |
| CaseMembership | removed | Removal is an append-only fact; it remains in prior snapshots |
| CaseMembership | conflicted | Overlap/impossible packing is visible for reconciliation |
| ManifestSnapshot | ready_for_source | Purpose-required fields and grants are present; no legal document claim |
| ManifestSnapshot | gaps_present | One or more required fields are unknown or stale; gap rows lead output |
| ManifestSnapshot | withheld | Purpose data is intentionally withheld or disclosure is missing |
| TheftHandoff | queued | Identity eligibility committed; Shard 23 job not yet acknowledged |
| TheftHandoff | submitted | Shard 23 accepted the identity-only handoff |
| TheftHandoff | duplicate_review | Existing identity flags require downstream review |
| TheftHandoff | excluded | No eligible identities or all source rows were placeholders/quantity |

### Failure and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Custody confirmation and revocation cross | Custody/grant version differs | Later CAS action wins with compensating event; no mixed grant state |
| Expected return passes silently | Freshness policy threshold | Confidence decays, state stale and one prompt; never auto-return |
| Owner and holder disagree | Dispute command/version | disputed state suppresses derived authority; platform does not adjudicate title |
| Transfer while case/rig source is read | Shard 23 source version changes | Snapshot or membership command retries; live references become placeholders where required |
| Case edit while manifest creates | Case version CAS | Snapshot pins either pre- or post-edit set; mixed membership impossible |
| Held item lacks disclosure grant | Grant read returns none/expired | Manifest masks/withholds identity and adds gap; public projection remains suppressed |
| Quantity line selected for theft | Source mode is quantity | Exclude/count; never manufacture identity |
| Source field unavailable | Adapter timeout or stale source | Store unknown/gap; no complete readiness claim |
| Shard 23 duplicate identity | Canonical gear identity match | Join existing flag through Shard 23, count duplicate review and avoid new identity |
| Outbox/worker crash after commit | Lease expiry | Sweeper retries event/job with same ID; consumer dedupes and refetches |
| Same key concurrent requests | BE00 unique key hash | One effect; matching replay; changed body conflict |

## External Seams

Every seam has exact request/response, timeout, retry count/backoff and circuit behavior. External calls occur after the canonical transaction or through a pre-commit read adapter whose failure cannot grant authority.

| Seam | Exact request | Exact response | Timeout, retry and circuit |
|---|---|---|---|
| BE00 command admission | operationId, actorId, actingPartyId, targetHash, requestHash, idempotencyKeyHash, expectedVersion and correlationId | reservation, replay status/body hash or IDEMPOTENCY_MISMATCH | 500 ms; 2 retries at 25 ms and 100 ms for connection reset only; open after 5 failures/30 s, half-open 15 s; open maps DEPENDENCY_UNAVAILABLE |
| Shard 01 authority | session subject, actingPartyId, target IDs, capability, purpose and step-up requirement | actor/party roles, ownership relation, mandate, purpose decision, step-up age and concealment flag | 800 ms; 2 retries at 50 ms and 150 ms for transport failures; open after 5/30 s, half-open 15 s; fail closed |
| Shard 23 identity/owner | gearRecordIds, source versions, actingPartyId, purpose and correlationId | identity ID, owner relation, source version, transfer state, theft standing and safe label; no hidden fields | 1,200 ms; 2 retries at 50 ms and 200 ms for read-only reset; open after 5/30 s, half-open 20 s; typed unknown on open |
| Shard 23 theft handoff | handoffId, eligible canonical identity IDs, source digests, actor standing, idempotency key and correlationId | accepted job/draft ID, queued/submitted state, duplicate identity count or typed rejection | 1,500 ms admission; 2 retries at 100 ms and 300 ms before send; open after 5/60 s, half-open 30 s; ambiguous result remains pending and is reconciled by handoff ID |
| 24a safe projection | gear IDs, purpose, audience, source version and acting party | safe label/media reference, sourceState, visibility decision and version | 1,000 ms; 2 retries at 50 ms and 150 ms; open after 5/30 s, half-open 15 s; missing safe source creates gap |
| 24b rig source | rigVersionIds, purpose, acting party and source version | ordered member rows, placeholder state, compatibility references and version | 1,000 ms; 2 retries at 50 ms and 150 ms; open after 5/30 s, half-open 15 s; stale source forces refresh |
| 24c register/condition source | line IDs, source version, purpose and acting party | mode, count/identity class, condition state, observedAt, conflict and sourceState | 1,000 ms; 2 retries at 50 ms and 150 ms; open after 5/30 s, half-open 15 s; unknown/gap on open |
| Shard 32 snapshot consumer | snapshot ID, purpose, source versions, gap counts and grant-scoped read token | accepted source reference, refresh request or typed refusal; no mutation token | 1,500 ms; 2 retries at 100 ms and 300 ms for transport failure; open after 5/60 s, half-open 30 s; snapshot remains immutable |
| Freshness policy/notification | custody IDs, policy version, threshold result, prompt idempotency and recipient classes | decay amount, stale decision, prompt accepted/already_sent/suppressed | 700 ms; 2 retries at 50 ms and 150 ms; open after 5/30 s, half-open 15 s; stale state is retained without prompt |
| BE00 outbox/Queue lease | eventId, eventType, aggregateId/version, payload digest and lease token | accepted queue ID or leased/unleased result | 500 ms; 2 retries at 25 ms and 100 ms; open after 5/30 s, half-open 15 s; committed event remains for sweeper |

An ambiguous seam response never upgrades authority, readiness or theft eligibility. The same idempotency key returns pending/gap/unknown evidence until a reconciler obtains canonical confirmation.

## Events and Async Consumers

### Event envelope

| Event type | Required payload | Emission rule |
|---|---|---|
| gear.custody_changed.v1 | custody ID, prior/new state, confidence class, changed grant types, version, actor and correlation IDs | GHO10–GHO13 emit transactionally with interval/grant evidence |
| gear.case_membership_changed.v1 | case ID, membership delta, member kind, effectiveAt, case version and actor hash | GHO14 emits with membership append; removed facts stay addressable |
| gear.manifest_snapshot_created.v1 | snapshot ID, purpose, source versions, item/gap counts and actor hash | GHO15 emits with immutable snapshot; no legal/carnet assertion |
| gear.readiness_gap_changed.v1 | subject ID, gap code/type, prior/new state, source version and actor/system hash | Emits when a gap opens/resolves/withholds; payload excludes values |

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| Commerce/listing authority | gear.custody_changed.v1 | Read accepted grants and state; suppress listing/sale/publication when pending/stale/disputed/revoked; never infer from possession |
| Rig/case reconciliation | gear.custody_changed.v1, gear.rig_member_unresolved.v1 | Replace unavailable live references with placeholders and preserve historical snapshots |
| Manifest invalidation | gear.case_membership_changed.v1, gear.rig_version_saved.v1, gear.register_line_changed.v1 | Mark future snapshot source stale; prior ManifestSnapshot remains immutable |
| Readiness/checklist | gear.readiness_gap_changed.v1, gear.condition_reported.v1 | Show explicit unknown/withheld/stale state and prompt authorized owner; no false complete label |
| Shard 32 advancing | gear.manifest_snapshot_created.v1 | Read grant-scoped snapshot, request refresh on source mismatch and decide document layout/carnet workflow |
| Shard 23 theft worker | TheftHandoff through one-way job seam | Create/update identity-only draft, join duplicate flags and return job evidence; no placeholder identity |
| Notifications | custody stale/prompt event and grant revocation | Notify both authorized ends without revealing private location, value or dispute narrative |

Consumers claim leases, dedupe by eventId/aggregateVersion, re-read canonical state under RLS and acknowledge only after durable effect. Failed effects remain retryable with bounded backoff.

## Error Handling

### Boundary Matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE24D-GHO10 | Transport/authority | 400/422 validation, 401 unauthenticated, 403 standing failure or 404 concealment-safe; no mutation before checks |
| BE24D-GHO11 | Counterparty/grants | 403/404 authority result, 422 invalid selection or 409 stale response; no unrequested grant activation |
| BE24D-GHO12 | Freshness | 403/404 unauthorized, 422 threshold not due or 409 stale version; no automatic terminal transition |
| BE24D-GHO13 | Terminal/contest | 403/404 standing, 422 invalid transition or 409 CAS; append evidence, never overwrite prior state |
| BE24D-GHO14 | Membership | 403/404 case/source, 422 union/interval or 409 divergence; removed facts remain |
| BE24D-GHO15 | Snapshot/readiness | 403/404 source, 409 source mismatch or 201 gap-led snapshot; never claim a legal complete document |
| BE24D-GHO16 | Theft handoff | 403/404 standing/source, 422 no eligible identities or 202 queued duplicate-review; Shard 23 owns draft |
| All | Quota/dependency/system | 429, 502/503 or 500 using BE00 ErrorResponse; no stack, notes, private values or provider payload |

### Error invariants

- Every handler returns ErrorResponse containing BE00 ApiError { code, message, requestId, details } and no alternate failure shape.
- NOT_FOUND details are empty for concealed resources. FORBIDDEN exposes only a safe reason code and recovery action.
- Custody never changes title. A grant never broadens beyond its subject, audience, scope and term.
- Unknown, stale, withheld and conflicting facts are explicit in success, gap rows, events and logs; absence is not a positive assertion.
- Snapshot and history rows are immutable. Corrections append evidence and point to superseded records.
- Dependency ambiguity produces pending, stale, gap or excluded states; it cannot produce active authority, complete readiness or an identity invented from a placeholder.
- Notes, serials, exact locations, private values, owner graphs and theft narratives are redacted from errors, metrics, events and realtime hints.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24D-CON-001 | BE24D-GHO10, BE24D-GHO11 | Strict Zod custody/grant schemas reject unknown keys, invalid dates, invalid grant scope and noncanonical versions |
| BE24D-CON-002 | BE24D-GHO12, BE24D-GHO13 | Freshness and closure schemas enforce expectedVersion, bounded note/action and explicit state |
| BE24D-CON-003 | BE24D-GHO14 | Membership union enforces exactly one record/custody/placeholder reference and effective interval rules |
| BE24D-CON-004 | BE24D-GHO15, BE24D-GHO16 | Snapshot/gap and handoff schemas bound rows, preserve source states and exclude invented identity fields |
| BE24D-ROUTE-001 | All | Only the seven route registry paths dispatch; wrong method, duplicate operation ID and undocumented path fail |
| BE24D-ERR-001 | All | Every failure parses as ErrorResponse with BE00 ApiError { code, message, requestId, details }; generic RFC extras fail |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24D-AUTH-001 | BE24D-GHO10, BE24D-GHO11 | Owner/proposed-holder bilateral flow works; self-assertion cannot activate; wrong valid user is 403 and concealed custody is 404 |
| BE24D-AUTH-002 | BE24D-GHO12, BE24D-GHO13 | Only owner/holder/scoped worker can reconcile/close; stale state never creates return; dispute suppresses authority |
| BE24D-AUTH-003 | BE24D-GHO14 | Case controller can edit; delegated packer is bounded; inaccessible record can only be explicit placeholder |
| BE24D-AUTH-004 | BE24D-GHO15 | Every case/rig/source version is authorized; purpose and grant checks gate private value/serial/identity fields |
| BE24D-AUTH-005 | BE24D-GHO16 | Owner/qualifying custody standing enters Shard 23; pending/stale/disputed custody and quantity/placeholders are excluded |
| BE24D-PRIV-001 | All | Private value, exact location, serial, owner graph, notes, theft narrative and grant details never leak |
| BE24D-CORS-001 | All | CORS policy gear-api allowlist, no wildcard credentials, Vary Origin and registered method/header exposure are verified |

### Persistence, idempotency and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24D-DB-001 | All | Migrations cover SQL types, nullability, CHECKs, FKs, indexes, forced RLS, grants, immutable fields and retention |
| BE24D-DB-002 | BE24D-GHO10, BE24D-GHO11, BE24D-GHO13 | Custody CAS serializes proposal/response/close races; no mixed state or duplicate active interval |
| BE24D-DB-003 | BE24D-GHO14 | Case version CAS preserves effective-dated history and surfaces overlapping physical conflicts |
| BE24D-DB-004 | BE24D-GHO15, BE24D-GHO16 | Snapshots/handoffs pin source versions, preserve gaps and cannot mutate after submission |
| BE24D-IDEM-001 | All | Same key/body replays exact result; different body returns IDEMPOTENCY_MISMATCH; rollback leaves no reservation |
| BE24D-RLS-001 | All | Anonymous, wrong party, forged acting party, revoked grant, service credential misuse and public base-table access are denied |

### Domain and seam tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24D-DOM-001 | BE24D-GHO10, BE24D-GHO11, BE24D-GHO12, BE24D-GHO13 | State machine permits only listed transitions, no automatic return and separate grant activation |
| BE24D-DOM-002 | BE24D-GHO14 | Effective membership and offline divergence preserve all historical facts |
| BE24D-DOM-003 | BE24D-GHO15 | Purpose matrix classifies known/unknown/withheld/not_applicable and readiness remains gap-led |
| BE24D-DOM-004 | BE24D-GHO16 | Identity-only eligibility, placeholder/quantity exclusions and duplicate join are deterministic |
| BE24D-SEAM-001 | All | BE00, Shard 01, Shard 23, 24a–24c, Shard 32 and freshness adapters honor exact request/response, timeouts, retries and circuits |
| BE24D-FAIL-001 | All | Dependency timeout, outbox crash, lease expiry, committed-disconnected replay and ambiguous theft submission recover without duplicate effects |

### Event, recovery and accessibility-support tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24D-EVT-001 | BE24D-GHO10, BE24D-GHO11, BE24D-GHO12, BE24D-GHO13 | Exact custody event, envelope, grant redaction, aggregate version and transactional emission are verified |
| BE24D-EVT-002 | BE24D-GHO14, BE24D-GHO15 | Case, manifest and readiness events preserve source versions and gap counts |
| BE24D-EVT-003 | BE24D-GHO16 | Handoff job evidence is idempotent and contains no placeholder identity or theft narrative |
| BE24D-REC-001 | All | Restore fence validates RLS, idempotency, outbox, grants, snapshot immutability and Shard 23 handoff reconciliation |
| BE24D-A11Y-001 | BE24D-GHO12, BE24D-GHO14, BE24D-GHO15 | State, confidence, conflicts, gaps, unknown/withheld labels and effective dates are text-first and not color-only |
| BE24D-PERF-001 | All | Route limits, row caps, rate headers, deadlines, retry budgets and snapshot SLOs are measured under concurrent load |

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source classification | PASS | 24.10–24.16 are the complete custody/case/manifest/theft handoff boundary from IA lines 56–62 and 77–83 |
| 2. Contract completeness | PASS | Seven routes, strict Zod request/success schemas, source-state labels, grant scopes and BE00 envelope are present |
| 3. Authorization | PASS | Owner/holder/entity roles, bilateral custody, grant subject/audience/term and explicit 403 versus 404 outcomes are present |
| 4. Privacy | PASS | Serial/value/location/note/owner graph/theft narrative restrictions and purpose-bound source fields are explicit |
| 5. Persistence | PASS | Seven domain tables list SQL types, nullability, constraints, FK targets, indexes, forced RLS and grants |
| 6. State and concurrency | PASS | Custody transitions, grant transitions, effective memberships, immutable snapshots, CAS and idempotency are deterministic |
| 7. External seams | PASS | Every seam names exact request/response, timeout, retry count/backoff and circuit behavior |
| 8. Events | PASS | Exact custody/case/manifest/readiness event names and parent envelope map to transactional producers and consumers |
| 9. Failure recovery | PASS | Stale, disputed, gap, withheld, duplicate-review and dependency-ambiguous outcomes avoid false authority |
| 10. Accessibility and operations | PASS | Text-first states/gaps, observability, restore, rate, performance and legal-boundary tests are specified |

## Ambiguity Gate

**PASS.** Evidence: IA interaction IDs 24.10–24.16 each map to exactly one route and operation ID; CustodyInterval, CustodyGrant, Case, CaseMembership, GearLogisticsFacts and ManifestSnapshot ownership is explicit; custody never changes title; grants are separate and revocable; stale custody never auto-returns; case history and source snapshots are immutable; readiness is purpose-bound and gap-led; bulk theft handoff is identity-only and Shard 23 owns the draft; Shard 32 owns carnet/advancing; all registries, typed fields, seams and recovery states are filled.

## Open Questions

None

## Dependency References

- Derives from [BE-00 platform contracts](00-infrastructure.md), including the four-field ApiError, strict input rules, idempotency_records, outbox lease, forced RLS and route archetypes.
- Consumes [BE-23a identity and transfer contracts](23a-gear-identity-claims-transfers.md) for gear_records, canonical owner and transfer versions.
- Consumes [BE-23b theft contracts](23b-theft-screening-recovery.md) through the identity-only handoff seam; Shard 23 owns theft draft/state and duplicate flags.
- Consumes [BE-23d valuation contracts](23d-valuation-insurance-discography.md) only for purpose-bound value source; no value enters public/backline output.
- Consumes 24a safe collection/publication, 24b rig/version/compatibility and 24c register/condition projections through named read contracts; it does not duplicate their routes.
- Supplies accepted custody and separately scoped grants to commerce, but commerce cannot infer sale/publication authority from possession.
- Supplies immutable source snapshots and readiness gaps to Shard 32; Shard 32 owns carnet/advancing/legal document workflow and cannot mutate 24d state.
- Supplies effective case/custody and condition-aware source facts to room, production and touring consumers; downstream consumers re-read canonical authority.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE24D-GHO10 through BE24D-GHO16 for bilateral custody/grants, stale reconciliation, terminal/dispute evidence, effective case membership, gap-led manifest snapshots and identity-only theft handoff with strict contracts, RLS, seams, events, tests and ambiguity evidence | /write-be-spec |
