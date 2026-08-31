# BE 07a — Credit assertions, visibility and graph projections

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 07 — Credit graph, capture and confidence | 07a — Assertions, visibility and graph projections | CRD-01 through CRD-07 and CRD-19; immutable work credits, role/instrument references, public and protected projections, graph traversal, party-shell merge, visibility, correction and party-page curation. |

The canonical IA source is .memory/wiki/specs/ia/07-credits-core.md. Its approved deep dive is .memory/wiki/specs/ia/deep-dives/07-credits-core.md. 07b owns session roll and capture; 07c owns imports, claims, attestations, provenance, contests and taxonomy. This companion never creates rights, splits, payment, ownership or person-identity truth.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CRD-01 Assert credit | CRD-07A-01 | Immutable credit assertion command | Authorized work participant resolves party or shell, exact or bounded literal role, scope and confidentiality; one active party/role/work/scope row is created or evidence is accreted. |
| CRD-02 View work ledger | CRD-07A-02 | Viewer-relative protected ledger query | Credited party, participant, producer, work/release owner or case reviewer receives only the same authorized set used for rows and count. |
| CRD-03 View public discography | CRD-07A-03 | Public party-page projection query | Confidentiality, release or lift and page curation are applied before grouping, counts, pagination, cache or search; hidden records are indistinguishable from absent records. |
| CRD-04 Traverse graph | CRD-07A-04 | Tier-bounded graph traversal query | Fan and Professional paths, density floor, hop authorization and explanation are enforced; sparse results degrade explicitly and cannot enumerate hidden endpoints. |
| CRD-05 Merge duplicate party shell | CRD-07A-05 | Human-reviewed party-shell re-point command | A knowledgeable party reviews evidence and manifest; people never auto-merge and rejection creates a durable negative assertion. |
| CRD-06 Set/lift embargo | CRD-07A-06 | Record-wide visibility version command | Strictest inherited default wins; release event, 72-hour public-evidence window or manual authority is required to lift. |
| CRD-07 Propose correction | CRD-07A-07 | Superseding credit amendment command | In-place edits are rejected; required approvers and reminders lead to applied successor or Shard 06 dispute. |
| CRD-19 Curate discography page | CRD-07A-08 | Party-page curation command | Credited party or Shard 01 estate authority manages at most three families and six pins per family; curation never changes ledger visibility. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/07-credits-core.md | title, links, overview and scope lines 1-24 | Establishes canonical ownership of contribution truth, visibility, graph, correction and taxonomy boundaries. |
| .memory/wiki/specs/ia/07-credits-core.md | features and acceptance criteria lines 25-55 | Supplies credit, ledger, discography, traversal, merge, embargo, correction and curation requirements. |
| .memory/wiki/specs/ia/07-credits-core.md | interactions and global rules lines 56-87 | Supplies exact CRD-01 through CRD-07 and CRD-19 IDs, preconditions, idempotency and projection rules. |
| .memory/wiki/specs/ia/07-credits-core.md | core, credit, visibility and taxonomy contracts lines 88-113 and 135-143 | Defines CreditScope, CreditState, Confidentiality, PageCuration, AssertCredit, ProjectDiscography, curation, embargo, correction and merge invariants. |
| .memory/wiki/specs/ia/07-credits-core.md | data models and typed registry lines 144-197 | Defines work_credit, credit_instrument, credit_order_assertion, discography_curation, credit_visibility_version, credit_amendment, party_merge_assertion and credit_audit_event. |
| .memory/wiki/specs/ia/07-credits-core.md | access control and escalation lines 198-223 | Defines public, credited-party, producer, work-owner, taxonomy, dispute and worker permissions and denial behavior. |
| .memory/wiki/specs/ia/07-credits-core.md | accessibility and event schemas lines 224-248 | Defines projection accessibility and credit.record.changed.v1 plus credit.visibility.changed.v1 payload minimums. |
| .memory/wiki/specs/ia/07-credits-core.md | edge cases and coverage matrix lines 249-295 | Supplies duplicate assertion, embargo leak, offline-adjacent, merge, curation, deletion and concurrency outcomes. |
| .memory/wiki/specs/ia/07-credits-core.md | cross-shard map, changelog and dependency references lines 296-359 | Defines Shards 00, 01, 06, 09, 10 and downstream projection contracts. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | scope and deepening record lines 1-18 | Confirms immutable versions, viewer-safe projections, no rights inference, graph privacy and converged boundaries. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | canonical field contracts lines 20-35 | Supplies exact fields for work_credit, visibility, amendment, merge and curation records. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | state machines and projection algorithm lines 36-55 | Defines asserted/superseded states, visibility transitions, unique assertion keys, authorization-before-aggregation and cache purge timing. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | embargo and correction algorithms lines 78-95 | Defines strict inheritance, lift grounds, objection, seven-day recovery, reminders and human-only merges. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | dispute and abuse verification lines 96-111 | Defines anti-enumeration, no auto-merge, taxonomy history and contest separation controls. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | cross-shard contracts and implementation envelope lines 113-132 | Binds BE00, Shards 01, 06, 09 and 10 to PostgreSQL RLS, Hono/Zod, outbox and projection behavior. |
| .memory/wiki/specs/ia/deep-dives/07-credits-core.md | changelog and dependency references lines 134-157 | Records locked decisions and dependency direction. |

## IA Source Map

### Interaction map

| IA interaction | Backend operation | Owned command or query | Source trace |
|---|---|---|---|
| CRD-01 Assert credit | CRD-07A-01 | Validate participant, party or shell, work, role, scope and confidentiality; insert or accrete one active credit. | Parent IA line 36 and interaction line 60; deep dive lines 47-54. |
| CRD-02 View work ledger | CRD-07A-02 | Apply RLS and confidentiality before selecting rows and count from one authorized projection. | Parent IA line 37 and interaction line 61; deep dive lines 51-54. |
| CRD-03 View public discography | CRD-07A-03 | Apply public eligibility and curation before grouping, count, pagination, cache and search. | Parent IA line 38 and interaction line 62; deep dive lines 51-54. |
| CRD-04 Traverse graph | CRD-07A-04 | Enforce tier, path allowlist, density floor and independent hop authorization with visible explanation. | Parent IA line 39 and interaction line 63; deep dive lines 51-54 and 105-106. |
| CRD-05 Merge duplicate party shell | CRD-07A-05 | Human-reviewed evidence and re-point manifest; no automatic person merge; negative rejection persists. | Parent IA line 40 and interaction line 64; deep dive lines 88-95. |
| CRD-06 Set/lift embargo | CRD-07A-06 | Append visibility version using inherited default and one permitted lift ground. | Parent IA line 41 and interaction line 65; deep dive lines 78-87. |
| CRD-07 Propose correction | CRD-07A-07 | Append successor proposal, collect approval or route disagreement to Shard 06. | Parent IA line 42 and interaction line 66; deep dive lines 88-95. |
| CRD-19 Curate discography page | CRD-07A-08 | Apply party or estate authority, family/pin caps and family-scoped last-write-wins. | Parent IA line 54 and interaction line 78; parent contracts line 109. |

### Model map

| IA model name | BE owner | Persistence and contract use | Source trace |
|---|---|---|---|
| work_credit | CRD-07A-01, CRD-07A-02, CRD-07A-03, CRD-07A-06, CRD-07A-07 | Immutable party/role/work contribution record with scope, qualifier, dates, asserter and confidentiality. | Parent IA line 148; deep dive line 24. |
| credit_instrument | CRD-07A-01 | Additive instrument-version association; never make/model truth or rights. | Parent IA line 149; deep dive line 28. |
| credit_order_assertion | CRD-07A-03, CRD-07A-08 | Work or release owner display ordering, not ledger mutation or prominence inference. | Parent IA line 150. |
| discography_curation | CRD-07A-08 | Party-page listed state, family order and bounded pins. | Parent IA line 151; parent contract line 109. |
| credit_visibility_version | CRD-07A-06, CRD-07A-03 | Append-only confidentiality, inheritance, release evidence and exposure interval. | Parent IA line 152; deep dive line 25. |
| credit_amendment | CRD-07A-07 | Successor proposal, approvals, reminders, escalation and dispute link. | Parent IA line 153; deep dive lines 43 and 90-92. |
| party_merge_assertion | CRD-07A-05 | Candidate shell/party evidence, decision or negative assertion and re-point manifest. | Parent IA line 154; deep dive lines 88-95. |
| credit_audit_event | All commands and protected reads | Immutable actor, context, action, target, before/after, evidence and request hashes. | Parent IA line 166; deep dive lines 47-54 and 86. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| credit.record.changed.v1 | CRD-07A-01, CRD-07A-05, CRD-07A-07 | Credit version, state, party, role, work, scope, confidentiality and hash projection. | Parent IA line 237. |
| credit.visibility.changed.v1 | CRD-07A-06 and CRD-07A-08 projection refresh | Credit old/new visibility, reason, effective interval and version; curation changes are page-only. | Parent IA line 238. |

The event producer emits only after the local transaction and outbox write commit. Downstream readers receive opaque IDs and authorized projections; no event carries hidden counts, internal score, evidence narrative, private session facts or unrestricted PII.

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 02.01.01 | Credit Record & Contribution Ledger | CRD-07A-01, CRD-07A-02 | Unique active party/role/work/scope credit, append-only history and viewer-relative ledger count. |
| 02.01.02 | Public Discography | CRD-07A-03, CRD-07A-08 | Public eligibility before aggregate, role-family grouping, curation caps and cache purge. |
| 02.01.05 | Credit Visibility & Embargo | CRD-07A-06, CRD-07A-03 | Inherited strictest confidentiality, permitted lift grounds, objection and seven-day recovery. |
| 02.01.03 | Credit Search & Graph Traversal | CRD-07A-04, CRD-07A-03 | Tier/path allowlist, density floor, bounded cursor and no hidden endpoint enumeration. |
| 02.01.04 | Identifier Resolution & Duplicate Merge | CRD-07A-05 | Human-only merge, re-point manifest, per-record visibility/history and durable negative assertion. |
| 02.01.06 | Credit Correction & Amendment | CRD-07A-07 | Superseding successor, approval reminders, immutable original and dispute escalation. |

Source trace: feature-ledger.md lines 21-23 contain 02.01.01, 02.01.02 and 02.01.05; lines 216-218 contain 02.01.03, 02.01.04 and 02.01.06. The exact identifiers and feature names above are copied from those ledger rows.

## Endpoint Completeness Reconciliation

Every owned interaction has one stable operation ID, one route registry row, one strict request and success schema, one error row, one authorization row, one idempotency/rate rule, one observability row and one test row. CRD-07A-02 and CRD-07A-03 remain separate because a protected work ledger and public party page have different visibility, count, cache and 403/404 semantics. CRD-07A-05 is only a human-reviewed re-point command. CRD-07A-06 owns record-wide visibility and CRD-07A-08 owns page-only curation; neither can mutate the other. CRD-07A-07 creates a successor and never edits work_credit in place.

Inherited routes are not repeated:

- BE00 supplies authenticated request context, error envelope, idempotency, outbox, audit, cache and recovery.
- BE01 supplies party, shell, alias, membership, mandate, estate and acting-context snapshots.
- BE06 supplies contest, dispute and protected case commands.
- BE09 owns project, work, recording and session source truth; this companion stores opaque references only.
- BE10 consumes credits as evidence and owns rights and splits; no 07a route writes those facts.

## Shared Contract Inheritance

The following BE00 contracts are authoritative:

- Request envelope includes requestId, session or service principal, acting context, locale, schema version and trace context.
- Success envelope includes data, requestId and schemaVersion.
- Error envelope is exactly ApiError { code, message, requestId, details }. All routes use it for every 4xx and 5xx response.
- Idempotency-Key binds actor, route, normalized input hash and schema version. A matching replay returns the original response; a differing payload returns IDEMPOTENCY_MISMATCH with no mutation.
- Commands carry expectedVersion and compare-and-set the aggregate. Read projections use a viewer-context digest and ETag; stale context returns ACTING_CONTEXT_STALE.
- Transactional outbox commits canonical state and event enqueue together. Workers retry by stable operation key.
- Supabase PostgreSQL RLS is the authorization boundary. Anonymous public reads use a safe projection and never direct table access.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CRD-07A-01 | CRD-01 Assert credit | POST /api/v1/credits | Authorized participant with work and party/shell scope; Shard 09 owns work | AssertCreditRequest | AssertCreditResponse 201 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 30/hour per actor and 120/hour per work | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, participant capability, rate, transaction/outbox and ApiError normalization |
| CRD-07A-02 | CRD-02 View work ledger | GET /api/v1/works/{workId}/credits | Credited party, session participant, producer, work/release owner or case-scoped reviewer | WorkLedgerQuery | WorkLedgerResponse 200 | ApiError { code, message, requestId, details }; 401, 403, 404 or 503 | Read digest optional; signed keyset cursor over `(assertedAt DESC, creditId DESC)` within one authorized snapshot; default limit 50, max 100; stable sort `assertedAt DESC, creditId DESC`; filter allowlist `includeQualified` only; 300/min per IP and 600/min per session; ETag required | CORS first-party consumer allowlist with credentials; BE00 context, strict Zod, RLS projection, rate, cache and ApiError normalization |
| CRD-07A-03 | CRD-03 View public discography | GET /api/v1/parties/{partyId}/discography | Public safe projection; authenticated context may add only explicitly authorized public filters | PublicDiscographyQuery | PublicDiscographyResponse 200 | ApiError { code, message, requestId, details }; 400, 404 or 503 | Read digest optional; signed keyset cursor over `(roleFamily ASC, contributedOn DESC NULLS LAST, creditId ASC)` within one public snapshot; default limit 25, max 50; stable sort `roleFamily ASC, contributedOn DESC NULLS LAST, creditId ASC`; filter allowlist `roleFamily` only; 240/min per IP and 600/min per session; cache key is viewer-safe | CORS public first-party allowlist without credential wildcard; BE00 context, strict Zod, visibility-before-count, rate, cache purge and ApiError normalization |
| CRD-07A-04 | CRD-04 Traverse graph | GET /api/v1/credits/graph | Fan or Professional tier from BE00/BE01; each endpoint independently authorized | GraphTraversalQuery | GraphTraversalResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 429 or 503 | Read digest optional; signed keyset cursor over `(hopCount ASC, nodeRefs lexicographic ASC)` within one budgeted snapshot; default limit 25, max 50; stable sort `hopCount ASC, nodeRefs lexicographic ASC`; filter allowlist `startKind`, `tier`, `maxHops`, `densityFloor`, `edgeKinds`; 30/min per session and 200/min per Professional account; traversal budget token required | CORS first-party consumer allowlist with credentials; BE00 context, strict Zod, tier, hop RLS, budget rate, cache and ApiError normalization |
| CRD-07A-05 | CRD-05 Merge duplicate party shell | POST /api/v1/credits/party-merges | Knowledgeable party with standing and human merge capability; no worker authority | MergePartyShellRequest | MergePartyShellResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 5/day per reviewer and 20/day per merge lane | CORS first-party staff allowlist with credentials; BE00 context, CSRF, strict Zod, human-only capability, step-up, rate, transaction/outbox and ApiError normalization |
| CRD-07A-06 | CRD-06 Set/lift embargo | POST /api/v1/credits/{creditId}/visibility | Credited party or authorized producer/work owner for setting; lift authority and permitted ground required | VisibilityActionRequest | VisibilityActionResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 20/hour per credit and 100/hour per authorized owner | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, capability, expected version, rate, cache purge and ApiError normalization |
| CRD-07A-07 | CRD-07 Propose correction | POST /api/v1/credits/{creditId}/amendments | Correction authority over credit; approver set and party-change boundary checked | ProposeCorrectionRequest | ProposeCorrectionResponse 201 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 422 | Idempotency-Key required; 10/day per credit and 50/day per correction lane | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, capability, rate, reminder job, outbox and ApiError normalization |
| CRD-07A-08 | CRD-19 Curate discography page | POST /api/v1/parties/{partyId}/discography/curation | Credited party for own page or Shard 01 estate authority | CurateDiscographyRequest | CurateDiscographyResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404 or 409 | Idempotency-Key required; 60/hour per party and 180/hour per curation client; family-scoped version | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, page capability, family CAS, rate, cache and ApiError normalization |

### Registry invariants

- Every operation returns ApiError { code, message, requestId, details } with an allowlisted details object. Internal score, hidden counts, protected evidence and identity reasons never enter details.
- 403 means an authenticated actor or visible projection lacks the requested role, capability, party/work scope or lift ground. 404 means the work, party, credit, shell or merge target is hidden by RLS or absent from the actor's permitted projection. Embargoed records use the same 404-equivalent response as absent records.
- 409 means idempotency mismatch, stale aggregate or competing merge/amendment/curation version. 422 means role, scope, policy, lift-ground, approval, density or pin validation after authentication. 429 is traversal or curation rate exhaustion only.
- Public rows, counts, cache keys, search totals and graph paths are computed after authorization. No query reveals a hidden row through count, order, timing-class or error difference.
- Credit creation, visibility and correction writes append audit_event and outbox records in one transaction. Curation writes page state only and cannot update credit_visibility_version.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| CRD-07A-01 | AssertCreditRequest to AssertCreditResponse with credit ID, version, role resolution, scope, confidentiality and dedupe state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-participant or wrong work scope; WORK_OR_PARTY_NOT_FOUND 404 for hidden references; IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409; ROLE_OR_SCOPE_INVALID or TAXONOMY_PENDING 422. |
| CRD-07A-02 | WorkLedgerQuery to WorkLedgerResponse with authorized rows and count from one projection version. | UNAUTHENTICATED 401; FORBIDDEN 403 when no read authority; WORK_NOT_FOUND 404 when hidden; PROJECTION_UNAVAILABLE 503 without partial data. |
| CRD-07A-03 | PublicDiscographyQuery to PublicDiscographyResponse with public role groups, bounded cursor and freshness. | INVALID_REQUEST 400; PARTY_NOT_FOUND or EMBARGOED_NOT_FOUND 404 with invariant counts/cache/search; PROJECTION_UNAVAILABLE 503. No public 403 for confidential records. |
| CRD-07A-04 | GraphTraversalQuery to GraphTraversalResponse with bounded paths, cursor, density state and visible explanation. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for disallowed tier/path; START_NOT_FOUND 404; RATE_LIMITED 429 with resumable cursor; PROJECTION_UNAVAILABLE 503. |
| CRD-07A-05 | MergePartyShellRequest to MergePartyShellResponse with human decision, re-point manifest hash and negative or applied state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for worker, conflicted or non-standing actor; CANDIDATE_NOT_FOUND 404; VERSION_CONFLICT or duplicate proposal 409; HUMAN_CONFIRMATION_REQUIRED 422. |
| CRD-07A-06 | VisibilityActionRequest to VisibilityActionResponse with old/new confidentiality, ground, effective interval and cache-purge state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for another party or missing authority; CREDIT_NOT_FOUND 404; VERSION_CONFLICT 409; LIFT_GROUND_REQUIRED or OBJECTION_OPEN 422. |
| CRD-07A-07 | ProposeCorrectionRequest to ProposeCorrectionResponse with successor or dispute reference and reminder state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for no correction authority; CREDIT_NOT_FOUND 404; VERSION_CONFLICT 409; IN_PLACE_EDIT or PARTY_CHANGE_REQUIRES_DISPUTE 422. |
| CRD-07A-08 | CurateDiscographyRequest to CurateDiscographyResponse with family order, pins, curation version and projection freshness. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for another page or absent estate authority; PARTY_PAGE_NOT_FOUND 404; VERSION_CONFLICT 409 on family CAS; CURATION_CAP_EXCEEDED 422. |

## Request/Response Contracts (Zod 4 schemas)

All schemas are Zod 4 strict objects. Unknown keys are rejected. UUIDs are opaque canonical UUID strings, dates are offset-aware ISO datetimes, hashes are lower-case hexadecimal strings and cursors are signed BE00 values.

~~~ts
import { z } from "zod";

export const ApiError = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: z.uuid(),
  details: z.record(z.string(), z.json()),
});

const Id = z.uuid();
const Version = z.number().int().nonnegative();
const DateTime = z.iso.datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Cursor = z.string().min(1).max(512);
const Key = z.string().min(16).max(128);

export const AssertCreditRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  partyRef: Id.optional(),
  shellRef: Id.optional(),
  workId: Id,
  recordingId: Id.optional(),
  compositionId: Id.optional(),
  scope: z.enum(["recording", "composition", "both"]),
  roleVersionId: Id.optional(),
  roleLiteral: z.string().min(1).max(160).optional(),
  instrumentVersionIds: z.array(Id).max(20),
  qualifier: z.string().min(1).max(120).optional(),
  contributedOn: z.string().date().optional(),
  confidentiality: z.enum(["public", "embargoed", "confidential"]),
  evidenceRefs: z.array(Id).max(50),
});
export const AssertCreditResponse = z.strictObject({
  creditId: Id,
  version: Version,
  partyRef: Id.optional(),
  shellRef: Id.optional(),
  roleResolution: z.enum(["exact", "alias", "bounded_literal_pending"]),
  roleVersionId: Id.optional(),
  retainedRoleLiteral: z.string().min(1),
  scope: z.enum(["recording", "composition", "both"]),
  confidentiality: z.enum(["public", "embargoed", "confidential"]),
  state: z.enum(["asserted", "contested", "superseded", "withdrawn"]),
  dedupeState: z.enum(["created", "evidence_accreted", "replayed"]),
});

export const WorkLedgerQuery = z.strictObject({
  workId: Id,
  viewerContextVersion: Version,
  includeQualified: z.boolean().default(true),
  cursor: Cursor.optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export const WorkLedgerResponse = z.strictObject({
  workId: Id,
  projectionVersion: Version,
  count: z.number().int().nonnegative(),
  rows: z.array(z.strictObject({
    creditId: Id,
    partyRef: Id.optional(),
    shellRef: Id.optional(),
    roleFamily: z.string().min(1),
    roleLabel: z.string().min(1),
    scope: z.enum(["recording", "composition", "both"]),
    qualifier: z.string().trim().max(256).optional(),
    provenanceSentence: z.string().min(1),
    state: z.enum(["asserted", "contested", "superseded", "withdrawn"]),
    version: Version,
    assertedAt: DateTime,
  })).max(100),
  nextCursor: Cursor.nullable(),
});

export const PublicDiscographyQuery = z.strictObject({
  partyId: Id,
  roleFamily: z.string().min(1).max(80).optional(),
  cursor: Cursor.optional(),
  limit: z.number().int().min(1).max(50).default(25),
  viewerContextVersion: Version.optional(),
});
export const PublicDiscographyResponse = z.strictObject({
  partyId: Id,
  projectionVersion: Version,
  freshness: z.enum(["converged", "version_labelled"]),
  groups: z.array(z.strictObject({
    roleFamily: z.string().min(1),
    items: z.array(z.strictObject({
      creditId: Id,
      workId: Id,
      roleLabel: z.string().min(1),
      provenanceSentence: z.string().min(1),
      contributedOn: z.string().date().nullable(),
    })).max(50),
  })).max(50),
  nextCursor: Cursor.nullable(),
});

export const GraphTraversalQuery = z.strictObject({
  startKind: z.enum(["party", "work"]),
  startId: Id,
  tier: z.enum(["fan", "professional"]),
  maxHops: z.number().int().min(1).max(3),
  densityFloor: z.number().int().min(1).max(100),
  cursor: Cursor.optional(),
  limit: z.number().int().min(1).max(50).default(25),
  edgeKinds: z.array(z.enum(["credit", "work_party"])).min(1).max(2).optional(),
  budgetToken: z.string().min(1).max(256),
});
export const GraphTraversalResponse = z.strictObject({
  startKind: z.enum(["party", "work"]),
  startId: Id,
  densityState: z.enum(["meets", "sparse_degraded", "disabled"]),
  paths: z.array(z.strictObject({
    nodeRefs: z.array(Id).min(2).max(8),
    edgeKinds: z.array(z.enum(["credit", "work_party"])).min(1),
    explanation: z.string().min(1).max(500),
  })).max(50),
  nextCursor: Cursor.nullable(),
  projectionVersion: Version,
});

export const MergePartyShellRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  candidatePartyOrShellRefs: z.array(Id).length(2),
  evidenceRefs: z.array(Id).min(1).max(50),
  repointManifest: z.array(z.strictObject({ creditId: Id, fromRef: Id, toRef: Id })).min(1).max(1000),
  knowledgeableReviewerRef: Id,
  humanConfirmation: z.literal(true),
  decision: z.enum(["approve", "reject"]),
});
export const MergePartyShellResponse = z.strictObject({
  mergeAssertionId: Id,
  state: z.enum(["approved", "rejected", "applied", "negative_assertion"]),
  repointManifestHash: Hash,
  affectedCreditCount: z.number().int().nonnegative(),
  visibilityPreserved: z.literal(true),
  version: Version,
});

export const VisibilityActionRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  creditId: Id,
  action: z.enum(["set_confidential", "set_embargoed", "lift"]),
  requestedConfidentiality: z.enum(["public", "embargoed", "confidential"]),
  liftGround: z.enum(["release_event", "verified_public_evidence", "manual_authorized"]).optional(),
  releaseEvidenceRef: Id.optional(),
  objectionWindowClosedAt: DateTime.optional(),
  reasonCode: z.string().min(1).max(80),
});
export const VisibilityActionResponse = z.strictObject({
  visibilityVersionId: Id,
  creditId: Id,
  previous: z.enum(["public", "embargoed", "confidential"]),
  current: z.enum(["public", "embargoed", "confidential", "lift_pending"]),
  liftGround: z.enum(["release_event", "verified_public_evidence", "manual_authorized"]).optional(),
  objectionState: z.enum(["not_applicable", "open", "closed", "paused"]),
  cachePurgeState: z.enum(["queued", "completed", "not_required"]),
  version: Version,
});

export const ProposeCorrectionRequest = z.strictObject({
  idempotencyKey: Key,
  expectedVersion: Version,
  creditId: Id,
  successor: z.strictObject({
    partyRef: Id.optional(),
    shellRef: Id.optional(),
    roleVersionId: Id.optional(),
    roleLiteral: z.string().min(1).max(160).optional(),
    workId: Id.optional(),
    qualifier: z.string().min(1).max(120).optional(),
  }),
  changeKind: z.enum(["role", "work", "qualifier", "party", "scope"]),
  approverRefs: z.array(Id).min(1).max(20),
  evidenceRefs: z.array(Id).max(50),
});
export const ProposeCorrectionResponse = z.strictObject({
  amendmentId: Id,
  state: z.enum(["proposed", "awaiting_agreement", "applied", "disputed", "correction_blocked"]),
  successorCreditId: Id.optional(),
  disputeCaseId: Id.optional(),
  nextReminderAt: DateTime.optional(),
  originalImmutable: z.literal(true),
  version: Version,
});

export const CurateDiscographyRequest = z.strictObject({
  idempotencyKey: Key,
  expectedFamilyVersions: z.record(z.string(), Version),
  partyId: Id,
  primaryRoleFamilies: z.array(z.string().min(1).max(80)).max(3),
  familyOrder: z.array(z.string().min(1).max(80)).max(3),
  pins: z.array(z.strictObject({ creditId: Id, roleFamily: z.string().min(1).max(80), rank: z.number().int().min(1).max(6) })).max(18),
});
export const CurateDiscographyResponse = z.strictObject({
  curationId: Id,
  partyId: Id,
  families: z.array(z.strictObject({
    roleFamily: z.string().min(1),
    rankOrderedCreditIds: z.array(Id).max(6),
    version: Version,
  })),
  ledgerVisibilityChanged: z.literal(false),
  version: Version,
});
~~~

Cross-field validation occurs after strict parsing: AssertCreditRequest requires exactly one of partyRef or shellRef, a work and scope-compatible recording/composition reference, and a roleVersionId or roleLiteral. VisibilityActionRequest requires a lift ground only for lift and a release evidence reference only for release/public evidence. ProposeCorrectionRequest routes party changes out of ordinary application. CurateDiscographyRequest requires each pin already public on the page and enforces unique rank per family.

## Database Schema

The eight tables below are the complete 07a persistence set. Work, recording, composition, party, shell, role and instrument source tables remain producer-owned and are referenced by opaque IDs where cross-shard foreign keys would couple ownership. Supabase PostgreSQL RLS is enabled on every table; anonymous and authenticated clients receive projections, never direct table grants.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| work_credit | id uuid NOT NULL PRIMARY KEY; party_ref uuid NULL; shell_ref uuid NULL; work_id uuid NOT NULL; recording_id uuid NULL; composition_id uuid NULL; scope text NOT NULL CHECK recording/composition/both; role_version_id uuid NULL; role_literal text NULL CHECK char_length(role_literal) <= 160; qualifier text NULL; contributed_on date NULL; asserted_at timestamptz NOT NULL; asserted_by uuid NOT NULL; acting_context_version bigint NOT NULL CHECK >= 0; confidentiality text NOT NULL CHECK public/embargoed/confidential; state text NOT NULL CHECK asserted/contested/superseded/withdrawn; claim_hash char(64) NOT NULL; supersedes_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; CHECK exactly one party_ref or shell_ref; CHECK role_version_id or role_literal. | supersedes_id FK to work_credit.id; party/work/recording/composition/role refs are producer-owned opaque refs with no local FK. Unique active party-or-shell, role identity, work_id and scope; indexes work_id plus state, party_ref plus confidentiality, shell_ref, role_version_id, asserted_at and claim_hash. | RLS policy returns row only to authorized credited party, participant, owner or case projection; public policy requires current visibility view; svc_credit_assertion has typed INSERT/UPDATE function only; anon/authenticated have no table grant. |
| credit_instrument | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; instrument_version_id uuid NOT NULL; asserted_by uuid NOT NULL; created_at timestamptz NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0. | credit_id FK to work_credit.id; instrument ref is 07c-owned opaque ref. Unique credit_id plus instrument_version_id; indexes credit_id and instrument_version_id. | RLS follows parent credit projection and party scope; svc_credit_assertion writes; no direct client grant. |
| credit_order_assertion | id uuid NOT NULL PRIMARY KEY; owner_party_ref uuid NOT NULL; work_id uuid NOT NULL; release_id uuid NULL; ordered_credit_ids jsonb NOT NULL CHECK jsonb_typeof(ordered_credit_ids) = array; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Work/release refs are producer-owned opaque refs; ordered IDs are validated against authorized visible credits in the transaction. Index owner_party_ref plus work_id, release_id, updated_at; unique owner_party_ref plus work_id plus release_id. | RLS permits work/release owner and public projection worker; no contributor can infer billing authority; svc_credit_projection writes; no client table grant. |
| discography_curation | id uuid NOT NULL PRIMARY KEY; party_id uuid NOT NULL; role_family text NOT NULL; page_state text NOT NULL CHECK listed/unlisted; family_order smallint NOT NULL CHECK family_order between 1 and 3; credit_id uuid NOT NULL; pin_rank smallint NULL CHECK pin_rank between 1 and 6; expected_family_version bigint NOT NULL CHECK >= 0; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | credit_id FK to work_credit.id; party_id is Shard 01 opaque ref. Index party_id plus role_family plus family_order, party_id plus pin_rank, credit_id; unique party_id plus role_family plus credit_id and partial unique party_id plus role_family plus pin_rank where pin_rank is not null. | RLS permits credited party or estate authority for writes and public listed projection for reads; svc_credit_curation owns typed function; no client table grant. |
| credit_visibility_version | id uuid NOT NULL PRIMARY KEY; credit_id uuid NOT NULL; session_id uuid NULL; confidentiality text NOT NULL CHECK public/embargoed/confidential/lift_pending; source text NOT NULL CHECK inherited/producer/owner/release/manual/objection; inherited_from uuid NULL; release_evidence_id uuid NULL; objection_case_id uuid NULL; effective_from timestamptz NOT NULL; effective_to timestamptz NULL; exposure_window tstzrange NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; reason_code text NOT NULL; created_by uuid NOT NULL; created_at timestamptz NOT NULL. | credit_id FK to work_credit.id; inherited_from self FK to credit_visibility_version.id; session, evidence and objection refs are producer/06-owned opaque refs. Index credit_id plus effective_from DESC, confidentiality plus effective_to, objection_case_id; exclude overlapping effective intervals per credit except lift_pending transition. | RLS exposes current scoped row to credited party, participant, owner or case reviewer; public projection reads only eligible current row; svc_visibility writes; no client table grant. |
| credit_amendment | id uuid NOT NULL PRIMARY KEY; original_credit_id uuid NOT NULL; successor_credit_id uuid NULL; proposer_ref uuid NOT NULL; proposal_hash char(64) NOT NULL; change_kind text NOT NULL CHECK role/work/qualifier/party/scope; required_approver_refs jsonb NOT NULL CHECK jsonb_typeof(required_approver_refs) = array; reminder_state text NOT NULL CHECK none/day3/day10/day14; next_reminder_at timestamptz NULL; state text NOT NULL CHECK draft/proposed/awaiting_agreement/applied/disputed/correction_blocked; dispute_case_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | original_credit_id FK to work_credit.id; successor_credit_id FK to work_credit.id; dispute_case_id is 06-owned opaque ref. Index original_credit_id plus state, proposer_ref, next_reminder_at, proposal_hash; unique original_credit_id plus proposal_hash. | RLS permits parties in approval set and case reviewer with purpose capability; original remains readable; svc_credit_amendment writes and reminder worker updates only state; no direct client grant. |
| party_merge_assertion | id uuid NOT NULL PRIMARY KEY; candidate_a_ref uuid NOT NULL; candidate_b_ref uuid NOT NULL; proposer_ref uuid NOT NULL; knowledgeable_reviewer_ref uuid NOT NULL; evidence_refs jsonb NOT NULL CHECK jsonb_typeof(evidence_refs) = array; repoint_manifest jsonb NOT NULL CHECK jsonb_typeof(repoint_manifest) = array; decision text NOT NULL CHECK approve/reject; state text NOT NULL CHECK proposed/approved/applied/negative_assertion; negative_reason text NULL; manifest_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; decided_at timestamptz NULL. | Candidate and reviewer refs resolve through Shard 01 purpose-bound snapshots; no local person FK. Index candidate_a_ref, candidate_b_ref, state, manifest_hash; unique unordered candidate pair plus proposal version. | RLS exposes proposal to standing parties and assigned reviewer only; rejected negative assertion remains restricted; svc_credit_merge writes; no worker or client table grant. |
| credit_audit_event | id uuid NOT NULL PRIMARY KEY; credit_id uuid NULL; actor_ref uuid NULL; acting_context_version bigint NULL; action text NOT NULL; target_ref_hash char(64) NOT NULL; before_hash char(64) NULL; after_hash char(64) NULL; evidence_hash char(64) NULL; request_id uuid NOT NULL; purpose text NOT NULL; created_at timestamptz NOT NULL. | credit_id FK to work_credit.id; actor and target refs are opaque and deliberately not cascaded. Index credit_id plus created_at DESC, action plus created_at DESC, request_id; unique request_id plus action plus target_ref_hash. | Insert-only RLS for svc_credit_audit; authorized subject receives redacted audit projection; no update/delete grants to any client or ordinary operator. |

### Persistence invariants

- The active unique key is party or shell plus canonical role identity plus work plus scope. A concurrent assertion locks the key, accretes evidence and asserter references, and returns the one version.
- Visibility is append-only. A restrictive transition queues public cache purge within 60 seconds; a permissive projection may be version-labelled until convergence. Curation has no write path to visibility.
- Merge and amendment operations preserve original rows and visibility history. Source deletion tombstones producer references and removes derived projection access without deleting required evidence or audit lineage.
- Discography pin sets union during a party merge even when a family exceeds six pins; every pin renders until the survivor re-curates. Writes enforce caps for ordinary curation, never reads.

## Middleware & Policies

### Hono middleware order

1. Create requestId and trace context; reject malformed envelope.
2. Select operation CORS policy and origin; credentialed requests use an explicit first-party allowlist, never wildcard credentials.
3. Verify CSRF for browser commands and reject unsafe cross-origin requests.
4. Authenticate session or service principal and resolve acting context version.
5. Resolve purpose capability and target visibility under RLS. Hidden targets become opaque 404.
6. Enforce body/query size, decompression and cursor limits.
7. Bind Idempotency-Key or read digest to normalized input and actor.
8. Parse the strict Zod 4 contract and run cross-field role, scope, visibility and curation checks.
9. Apply capability, tier, expected-version and rate policies; lock command aggregate or use one projection snapshot.
10. Commit canonical state, audit and outbox, then project only authorized fields.
11. Add security headers, ETag or cache-control, structured metrics and ApiError normalization.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| CRD-07A-01 | Authorized participant with credit.assert capability | Actor participant, party/shell, work and scope; role is exact, alias or bounded literal | Lock active assertion key; recheck acting context, work version and role result | Hidden work/party is 404; visible non-participant or wrong scope is 403. |
| CRD-07A-02 | Credited party, participant, producer, owner or case reviewer | Work read authority and confidentiality projection | Snapshot rows and count together; recheck viewer context | No read authority on visible work is 403; hidden work is 404. |
| CRD-07A-03 | Anonymous or authenticated public viewer | Only current public eligibility and page curation | Snapshot visibility/currency before aggregate; recheck purge epoch | Confidential or embargoed record is 404-equivalent; no public 403. |
| CRD-07A-04 | Fan or Professional graph viewer | Tier path allowlist and independent endpoint RLS | Bound traversal budget and projection version | Disallowed tier/path is 403; hidden start/end is 404 and omitted from paths. |
| CRD-07A-05 | Knowledgeable human reviewer | Standing over both candidates and no conflict | Lock candidate pair; recheck human confirmation and versions | Non-standing or worker is 403; hidden candidate is 404. |
| CRD-07A-06 | Credited party, producer, work owner or authorized lift actor | Record-wide visibility and ground-specific evidence | Lock credit/visibility; recheck objection window and expected version | Visible record without authority is 403; hidden credit is 404. |
| CRD-07A-07 | Correction-authorized actor and resolved approver set | Original credit scope; party change cannot apply locally | Lock original amendment chain; recheck approver versions | Unauthorized proposer is 403; hidden credit is 404. |
| CRD-07A-08 | Credited party or Shard 01 estate authority | Own party page, public pin eligibility and family scope | Lock family version only; recheck page and pin visibility | Another page is 403; hidden party page is 404. |

### Security and abuse controls

- Public projection applies authorization before counts, grouping, order, pagination, cache keys and search. Hidden records do not affect totals or timing-class.
- A credit never writes rights, splits, royalty, ownership, popularity or platform-trust state. Role family is presentation vocabulary, not confidentiality.
- A role resolver may return at most five fuzzy candidates but never auto-selects. This companion accepts a bounded literal only when the 07c resolver marks the requester-scoped pending state.
- Graph traversal uses a per-session budget, max hops, density floor and path explanation. Fan cannot use Professional paths; unauthorized hops are absent, not blocked labels.
- Merge is human-only for people. A worker, import, heuristic or credential possession cannot satisfy knowledgeable-party confirmation.
- Confidentiality defaults ratchet to the strictest project, producer, room or embargoed value. Lift requires a ground and evidence; public reachability is never authority.
- SQL SECURITY DEFINER functions set a fixed search_path, assert service role, verify purpose and write audit before returning. Direct anon/authenticated table grants are revoked.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| CRD-07A-01, CRD-07A-02, CRD-07A-03 | Shard 09 work and recording projection | workId, recordingId, compositionId, requestedVersion, viewerContextVersion, purpose | workVersion, workState, authorizedObjectRefs, releaseState, projectionVersion | 2,000 ms; safe reads retry twice at 100/500 ms, no mutation retry; circuit opens after 5 failures in 60 seconds; unknown work version blocks command or returns projection unavailable. |
| CRD-07A-01, CRD-07A-05, CRD-07A-08 | Shard 01 party, shell, mandate and estate snapshot | actorRef, candidateRefs, partyRef, requestedSnapshotVersion, relationKind | snapshotVersion, partyState, shellState, standing, mandateState, estateAuthority | 2,000 ms; one safe read retry at 250 ms; circuit 5 failures/60 seconds; unknown authority returns pending or 403 and never mutates. |
| CRD-07A-01, CRD-07A-06, CRD-07A-07 | 07c role and instrument resolver | roleVersionId or roleLiteral, locale, partyType, requesterScope, instrumentVersionIds | resolutionKind, roleVersionId, retainedLiteral, pendingAliasId, instrumentVersions, resolverVersion | 1,000 ms; 3 retries at 100/500/1,500 ms for reads; circuit 5/60 seconds; timeout permits bounded literal only when policy explicitly allows, never fuzzy selection. |
| CRD-07A-05, CRD-07A-07 | Shard 06 dispute and case adapter | creditOrMergeRef, evidenceRefs, expectedVersion, disputeKind, purpose | caseId, acceptedVersion, caseState, projectionScope | 2,000 ms; 3 retries at 15/60/300 seconds for safe case creation with same key; circuit 5/60 seconds; unknown create reconciles by idempotency key. |
| CRD-07A-03, CRD-07A-04, CRD-07A-06 | Public cache and search purge | projectionRef, oldVisibilityVersion, newVisibilityVersion, purgeEpoch, reasonCode | purgeReceipt, completedAt, cacheEpoch, searchEpoch | 2,000 ms; 3 retries at 15/60/300 seconds; circuit 5/60 seconds; purge failure leaves restrictive source deny-first and alerts. |
| CRD-07A-08 | Estate curation authority adapter | partyId, actingContextVersion, familyVersions, requestedPinIds | estateDecision, acceptedFamilyVersions, authorityExpiry | 2,000 ms; one retry at 250 ms; circuit 5/60 seconds; unknown estate authority denies curation. |

Provider or projection uncertainty is typed pending or unavailable. It never creates an ownership, right, role, visibility or merge decision. A provider timeout after a local commit is reconciled by requestId and idempotency key before another attempt.

### State machines and concurrency

- Credit state is asserted → contested, superseded or withdrawn. Contest is participant-only and does not hide a public record. A successor never edits the original.
- Visibility state is confidential or embargoed → lift_pending → public; lift_pending returns to embargoed on a timely closed-ground objection. Public can revert only within seven days after a triggering release retracts.
- Amendment state is draft → proposed → awaiting_agreement → applied, disputed or correction_blocked. Day 3 and day 10 reminders lead to day 14 escalation; no silence auto-applies.
- Merge state is proposed → approved → applied or negative_assertion. Human confirmation and a candidate-pair lock are mandatory; rejected pairs cannot be re-proposed without a new evidence version.
- Curation uses last-write-wins scoped per role family. Different families merge; same-family writes compare expectedFamilyVersion. A merge unions pins and prompts re-curation if caps are exceeded.
- CRD-07A-01 unique assertion, CRD-07A-05 candidate pair, CRD-07A-06 visibility transition, CRD-07A-07 proposal hash and CRD-07A-08 family version are database-enforced. Losers receive prior result or typed 409.

### Failure recovery

- Crash after local commit leaves credit_audit_event and outbox. A worker republishes credit.record.changed.v1 or credit.visibility.changed.v1 by event ID without duplicate state.
- Public purge failure keeps restrictive visibility effective at the source and removes stale projection reads by deny-first middleware; retry and alert continue until the 60-second SLO is met.
- A stale work, party, mandate, role or visibility snapshot returns VERSION_CONFLICT or ACTING_CONTEXT_STALE, preserving the prior record and requiring refetch.
- A merge or amendment provider returns unknown only after durable command state exists. Reconciliation finds the request key before any re-point or case command is repeated.
- Source deletion tombstones object references and drops derived public visibility. Required credit and audit lineage remains retained under the applicable clock or hold.

## Event Schemas

### Payload contracts

~~~ts
export const CreditRecordChangedV1 = z.strictObject({
  type: z.literal("credit.record.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  creditId: z.uuid(),
  version: z.number().int().nonnegative(),
  state: z.enum(["asserted", "contested", "superseded", "withdrawn"]),
  partyRef: z.uuid().optional(),
  shellRef: z.uuid().optional(),
  roleVersionId: z.uuid().optional(),
  workId: z.uuid(),
  scope: z.enum(["recording", "composition", "both"]),
  confidentiality: z.enum(["public", "embargoed", "confidential"]),
  claimHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const CreditVisibilityChangedV1 = z.strictObject({
  type: z.literal("credit.visibility.changed.v1"),
  eventId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }),
  creditId: z.uuid(),
  previous: z.enum(["public", "embargoed", "confidential"]),
  current: z.enum(["public", "embargoed", "confidential", "lift_pending"]),
  reasonCode: z.string().min(1).max(80),
  effectiveAt: z.iso.datetime({ offset: true }),
  version: z.number().int().nonnegative(),
});
~~~

Event consumers refetch authorized projections. They never receive claimant identity, hidden count, role-resolution candidates, evidence narrative, private session facts, internal confidence score or direct ownership implication.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, CSRF or authentication | INVALID_REQUEST 400 or UNAUTHENTICATED 401 | Correct envelope or establish fresh context; no domain mutation. |
| Target visibility and capability | FORBIDDEN 403 for visible unauthorized target; opaque 404 for hidden target | Do not retry by enumerating IDs; use permitted party or case path. |
| Strict schema and cross-field rule | INVALID_REQUEST 400 or typed 422 | Return allowlisted field paths; no provider call. |
| Idempotency and expected version | IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409 | Replay original key or refetch current version. |
| Projection/cache | PROJECTION_UNAVAILABLE 503 | Serve no partial authorization set; retry from the same projection epoch. |
| Graph budget | RATE_LIMITED 429 with bounded cursor | Resume with returned cursor after rate window; no path expansion. |
| Taxonomy/party/work dependency | TAXONOMY_PENDING, ACTING_CONTEXT_STALE or VERSION_CONFLICT | Keep literal or prior record; refetch exact dependency. |
| Shard 06 case command | DISPUTE_REQUIRED 422 or typed pending | Preserve immutable credit and expose case reference only to authorized participant. |

### Operation error coverage

| Operation ID | Invalid input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| CRD-07A-01 | Missing party/shell, invalid scope, unresolvable work, unauthorized participant or role conflict refuses before mutation. | Assertion key converges; taxonomy outage may retain bounded literal; source deletion tombstones reference and preserves record. |
| CRD-07A-02 | No work read authority returns 403; hidden work returns 404; invalid cursor returns 400. | Projection uses one authorized snapshot; provider outage returns unavailable, never partial rows; revocation removes derived access. |
| CRD-07A-03 | Invalid party or limit returns 400; hidden/confidential page is 404-equivalent. | Restrictive change purges within 60 seconds; permissive lag is version-labelled; deletion removes public row without revealing absence. |
| CRD-07A-04 | Invalid tier, hop, density or budget returns typed 400/403; unauthorized endpoints are omitted. | Budget and cursor serialize; sparse data degrades or disables; projection outage returns unavailable. |
| CRD-07A-05 | Worker, heuristic, missing evidence or absent knowledgeable human is 403/422. | Candidate lock yields one proposal; rejection persists negative assertion; source revocation preserves history. |
| CRD-07A-06 | Missing lift ground, open objection or unauthorized actor changes nothing. | Visibility CAS serializes; cache failure remains deny-first; erasure anonymizes where lawful and holds supersede clocks. |
| CRD-07A-07 | In-place edit, invalid party change, missing approver or absent authority is rejected. | Duplicate proposal replays; stale approver yields conflict; no response escalates day 14 and never applies. |
| CRD-07A-08 | Other-page actor, hidden pin, duplicate rank or cap violation is rejected. | Family CAS protects same-family edits; merge unions pins; party deletion removes projection but retains curation audit. |

## Observability

Every operation emits a structured audit/log record with requestId, traceId, operationId, outcome, latencyMs, actorType, purpose, projectionVersion and aggregateRefHash. Logs and events exclude raw identity, private session facts, hidden counts, evidence narratives and internal scores.

| Operation ID | Audit event and metrics | Safe trace fields |
|---|---|---|
| CRD-07A-01 | credit.record.changed.v1; assertion accepted, accretion, role-pending, duplicate and authority-denial counters | credit hash, work hash, role family, scope, confidentiality, version |
| CRD-07A-02 | credit.ledger.read; authorized row count, projection latency, stale-context and unavailable counters | work hash, count bucket, projection epoch, viewer tier |
| CRD-07A-03 | credit.discography.read; public item count bucket, purge age, cache hit and freshness counters | party hash, role family, freshness, cursor bucket |
| CRD-07A-04 | credit.graph.traversed; tier, hops, density degradation, budget and omitted-hop counters | start hash, tier, hop count, density state, path count bucket |
| CRD-07A-05 | credit.party-merge.changed; proposal, human decision, negative assertion and re-point convergence counters | candidate pair hash, decision, affected count bucket, manifest hash |
| CRD-07A-06 | credit.visibility.changed.v1; lift ground, objection, purge and exposure-window counters | credit hash, old/new state, reason code, purge epoch |
| CRD-07A-07 | credit.amendment.changed; proposal, reminder, applied, disputed and blocked counters | credit hash, change kind, state, approver count bucket |
| CRD-07A-08 | credit.discography-curation.changed; family CAS, pin cap, merge union and cache refresh counters | party hash, role family, pin count bucket, version |

provider-native diagnostic sinks receive exception fingerprints and circuit state without request bodies. Alerts fire for public purge age over 60 seconds, projection mismatch between count and rows, repeated 403/404 timing divergence, graph budget abuse, stale-context spikes and amendment reminders past day 14.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CRD-07A-01 | Parse strict role/scope schema and exactly-one party/shell; assert participant authority, unique accretion, no rights/split row, bounded literal on taxonomy outage and exact ApiError. |
| CRD-07A-02 | Assert RLS projection and count use one snapshot; test credited party, participant, owner and reviewer roles, hidden 404, visible 403 and provider-unavailable no-partial behavior. |
| CRD-07A-03 | Assert confidential and absent pages have identical 404/count/cache/search behavior; test role grouping, freshness, purge within 60 seconds and public-only projection. |
| CRD-07A-04 | Test Fan versus Professional paths, density floor, hop authorization, cursor resumption and RATE_LIMITED budget; hidden endpoints never appear. |
| CRD-07A-05 | Reject worker and auto-merge; test human evidence, candidate lock, durable negative assertion, re-point manifest and idempotent replay. |
| CRD-07A-06 | Test strictest inherited default, all three lift grounds, objection pause, seven-day recovery, expected version and deny-first purge. |
| CRD-07A-07 | Reject in-place and party mutations; test approvals, day 3/10/14 reminders, Shard 06 dispute route, immutable original and stale replay. |
| CRD-07A-08 | Test estate authority, three-family/six-pin caps, unique ranks, family-scoped CAS, merge union and ledgerVisibilityChanged false. |

### Persistence, concurrency and recovery tests

- Migration tests assert each field type, nullability, check, FK, unique constraint, index, RLS policy and grant listed above.
- Property tests generate duplicate assertion keys, stale versions, hidden records, mixed family curation, merge pin overflow, restrictive cache failures, source deletion and provider unknown responses. Every property asserts no ownership or rights mutation and no hidden-count leak.
- Worker tests run crash-after-commit, duplicate outbox delivery, timeout-after-provider-commit and purge retry. Event IDs and idempotency keys converge to one state.
- Security tests attempt cross-party IDs, wildcard staff reads, graph endpoint enumeration, CSRF, cache-key poisoning, fuzzy auto-selection, role-family privilege escalation and direct table access.
- Performance tests hold p95 local command and protected read under 300 ms, public read under 200 ms on warm projection, and graph traversal within the configured budget; provider effects return durable pending state.

### Accessibility handoff tests

Ledger and discography tables have semantic headers, row labels, text provenance sentences and non-color confidentiality/state indicators. Graph results have a linear path list and explanation; no force-directed canvas is required. Embargo and hidden-count behavior is not announced to assistive technology. Curation and amendment forms expose field-level errors, focus the first invalid control and announce version conflicts. Keyboard-only, 200 percent zoom, high contrast, reduced motion and screen-reader status tests are required.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | Eight operations each have strict Zod request/success schemas, common ApiError, route CORS, auth, rate, idempotency or read digest and 403/404 behavior. PASS. |
| Projection pass | Ledger rows/count, public grouping/count, cache/search and graph hops all apply authorization before aggregation; hidden records are invariant. PASS. |
| Persistence pass | All eight models have typed SQL fields, nullability, constraints, FK target or opaque-reference rationale, indexes, RLS and grants. PASS. |
| State/concurrency pass | Assertion, visibility, amendment, merge and family-scoped curation state machines use database CAS, unique keys, outbox and retry reconciliation. PASS. |
| Adversarial pass | Rights inference, fuzzy role selection, auto-merge, graph enumeration, hidden-count differencing, cache staleness, pin overflow and stale authority were tested as safe refusal or bounded degradation. PASS. |
| Macro boundary pass | 07b/07c, BE00, BE01, BE06, BE09 and BE10 ownership is referenced without route/table duplication. PASS. |
| Auditability pass | CRD-07A-01 through CRD-07A-08 appear in route, contract, error, auth, observability and test rows; event and model names are literal and line-traced. PASS. |

## Ambiguity Gate

PASS. The sole canonical IA source is .memory/wiki/specs/ia/07-credits-core.md with deep dive .memory/wiki/specs/ia/deep-dives/07-credits-core.md. CRD-01 through CRD-07 and CRD-19 have one owner and one operation. Work, party, shell, role, visibility, curation and source-shard ownership is explicit. 403 versus 404, confidentiality before aggregates, graph density, human-only merge, correction escalation, idempotency, rate limits, CORS, ApiError, external timeouts, retries, circuit breakers, RLS, grants, deletion and provider uncertainty are resolved. No route duplicates 07b, 07c or platform endpoints. All tables have matching Markdown widths and no unescaped cell pipes.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 07a backend companion from canonical Shard 07 IA and deep dive; classified eight interactions, eight models and two events. | /write-be-spec | All |
| 2026-08-28 | Added strict Zod 4 contracts, route registry, typed PostgreSQL/RLS schema, external seam budgets, event payloads, error matrices, observability and tests. | /write-be-spec-write | API, database, middleware, data flow, events, errors, observability, tests |

## Dependency References

### Constrained by

- [BE00 — Platform foundation](00-infrastructure.md)
- [BE01 — Authentication and account linking](01a-auth-account-linking.md)
- [BE01 — Party, identity and authority](01c-relationships-authority-governance.md)
- [BE06 — Trust, safety and disputes](06a-case-intake-evidence.md)
- [IA Shard 07 — Credit graph, capture and confidence](../ia/07-credits-core.md)
- [IA Deep Dive 07 — Credit graph, capture and confidence](../ia/deep-dives/07-credits-core.md)

### Constrains

- [07b — Session capture and offline merge](07b-session-capture-offline.md)
- [07c — Claims, confidence and taxonomy](07c-claims-attestations-confidence-taxonomy.md)
- [IA Shard 08 — Credit reporting and disclosure](../ia/08-credit-reporting-disclosure.md)
- [IA Shard 09 — Projects and collaboration](../ia/09-projects-collaboration.md)
- [IA Shard 10 — Rights and ownership](../ia/10-rights-ownership.md)
- [IA Shard 18 — Royalty accounting](../ia/18-royalty-accounting.md)
- [IA Shard 19 — Royalty reporting and forecasting](../ia/19-royalty-reporting-forecasting.md)
- [IA Shard 20 — Licensing core](../ia/20-licensing-core.md)
- [IA Shard 22 — Release and distribution](../ia/22-release-distribution.md)
- [IA Shard 23 — Gear provenance registry](../ia/23-gear-provenance-registry.md)
- [IA Shard 27 — Digital catalog and delivery](../ia/27-digital-catalog-delivery.md)
- [IA Shard 39 — Analytics ingestion and reporting](../ia/39-analytics-ingestion-reporting.md)
