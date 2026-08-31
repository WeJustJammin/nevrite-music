# BE 08c — Gear-to-credit linkage and item discography

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 08 — Credit reporting, exchange and disclosure | 08c — Gear credit linkage | CXR-08 through CXR-10; contribution-granular gear links, owner opt-in discography projection and protected inbound ownership events from Shard 23. |

## Classification

This companion stores an optional byproduct link between one contribution credit and one registered Shard 23 item/version. It derives a viewer-safe item discography line only after item-owner opt-in and public source-credit eligibility. It accepts protected identity and ownership events from Shard 23 but never writes canonical gear identity or ownership. A session-close prompt cannot create a gear link.

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CXR-08 Link gear to contribution | CXR-08C-01 | Contribution-scoped command | Credited party or mandated Producer links an existing credit to one exact registered item/version with author and source method; visibility is inherited. |
| CXR-09 Publish gear discography line | CXR-08C-02 | Owner opt-in projection command | Item owner opts an item into public display; projection contains only still-public source credits and purges deny-first when visibility narrows. |
| CXR-10 Transfer registered gear | CXR-08C-03 | Protected inbound service command | Shard 23 reports an ownership change; this shard records the event and rebuilds projections without mutating ownership or transferring private source access. |

The following boundaries are explicit:

- BE00 owns request context, error envelope, idempotency, queue, audit and storage. BE01 owns party and mandate authority. BE07 owns credit and visibility truth. Shard 23 owns registered gear identity, serial state and ownership.
- 08c never writes rights, ownership, payment, credit truth or provenance. It stores opaque source references and exact source versions.
- 08a owns generic artifacts and DDEX output. 08b owns union reports. 08d owns AI disclosures. None of those routes are repeated here.
- The only Shard 23 direction is inbound protected commands described by the IA contract map. There is no 08c dependency on a Shard 23 database or an outbound ownership mutation.

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | title, overview and scope reconciliation lines 1-24 | Establishes optional contribution links, inherited confidentiality, item opt-in, ownership boundary and no session prompt. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | features and delivery phases lines 25-38 | Defines 02.09 gear linkage, item-identity gate, owner opt-in and explicitly disabled gear prompts. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | acceptance criteria lines 40-51 | Supplies CXR-08, CXR-09 and CXR-10 preconditions, source method, purge, item transfer and failure behavior. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | interactions and global rules lines 57-82 | Supplies exact CXR-08 through CXR-10 IDs, contribution granularity, visibility ceiling and no-ownership-mutation rules. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | core types and errors lines 84-95 | Defines OutputKind, ArtifactState and StandardError values used by link and projection failures. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | gear contracts lines 107-118 | Defines LinkGearCredit, ProjectGearDiscography, RecordGearItemIdentity and RecordGearOwnershipTransfer. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | data models and typed registry lines 119-165 | Defines gear_credit_link and gear_discography_projection fields, relationships and deterministic types. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | access control and escalation lines 166-187 | Defines credited party, Producer, item owner, recipient adapter and system-worker authority. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | accessibility lines 188-195 | Requires visible opt-in consequences, keyboard-safe projections, status announcements and retry behavior. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | event schemas lines 197-208 | Defines credit.gear-link.changed.v1 and item/credit privacy exclusions. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | edge cases and coverage matrix lines 210-249 | Supplies owner transfer, embargo purge, item outage, revocation, deletion and concurrency outcomes. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | cross-shard dependencies and contract map lines 251-267 | Establishes BE00, BE01, BE07 and Shard 23 inbound-only direction. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | changelog and dependencies lines 269-295 | Records DEC-098 inbound command direction and no dependency on Shard 23. No deep-dive file is required; scope line 23 and Deep Dives Needed lines 258-260 say none. |
| .memory/wiki/specs/feature-ledger.md | row 498 | 02.09 Gear Credit Linkage is the owned Could surface row mapped to this IA shard. |
| .memory/wiki/specs/be/00-infrastructure.md | API Endpoints line 67; Database Schema line 202; Middleware and Policies line 253; Data Flow line 298 | Inherits platform envelope, idempotency, audit, queue, RLS and service-boundary contracts. |
| .memory/wiki/specs/be/07a-credit-assertions-visibility.md | API Endpoints line 119; Database Schema line 369; Data Flow line 432; Event Schemas line 464 | Consumes credit visibility and source-version projections; no private source context crosses into item projections. |

## IA Source Map

The parent IA field registry is retained for companion reconciliation: scope_detail?, tool_name?, tool_version?, model_name? and subject_is_own_model? are exact optional AI Disclosure Entry V1 JSON keys owned by 08d, not fields of 08c.

### Interaction map

| IA interaction | Backend operation | Owned command and invariant | Source trace |
|---|---|---|---|
| CXR-08 Link gear to contribution | CXR-08C-01 | Link one existing contribution to one exact item/version with author and source method; a session-level link is invalid. | Parent IA acceptance line 49 and interaction line 68; gear contract line 113. |
| CXR-09 Publish gear discography line | CXR-08C-02 | Require per-item owner opt-in and public source credit; projection is derived and purged on restrictive visibility. | Parent IA acceptance line 50 and interaction line 69; gear contract line 114. |
| CXR-10 Transfer registered gear | CXR-08C-03 | Accept Shard 23 ownership event, retain item-linked history and rebuild authorized projections without writing ownership. | Parent IA acceptance line 51 and interaction line 70; contract line 117 and cross-shard map line 267. |

### Model map

| IA model name | BE owner | Persistence and contract use | Source trace |
|---|---|---|---|
| gear_credit_link | CXR-08C-01 and CXR-08C-02 | Contribution, item/version, author, source method, inherited visibility, opt-in and state. | Parent IA line 130; typed registry line 160. |
| gear_discography_projection | CXR-08C-02 and CXR-08C-03 | Item/version, safe public credit references, projection hash/version and purge state. | Parent IA line 131; typed registry line 161. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| credit.gear-link.changed.v1 | CXR-08C-01, CXR-08C-02 and CXR-08C-03 | Link/item/credit state, visibility, projection version and purge signal for Shard 23. | Parent IA line 205 and event schema line 197. |

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 02.09 | Gear Credit Linkage | CXR-08C-01 through CXR-08C-03 | Contribution-only link, exact item identity, owner opt-in, inherited confidentiality, deny-first purge and inbound ownership reconciliation. |

Source trace: feature-ledger.md row 498 names 02.09 Gear Credit Linkage and points to 08-credit-reporting-disclosure.

## Endpoint Completeness Reconciliation

Each owned interaction has one stable operation ID, one route registry row, one strict request and success schema, one error row, one authorization row, one idempotency/rate rule, one observability row and one test row. CXR-08C-01 is the only link creation command. CXR-08C-02 owns projection/opt-in. CXR-08C-03 is the protected Shard 23 inbound ownership event and is not a user transfer endpoint.

| Interaction | Request and success | Persistence effect | External effect |
|---|---|---|---|
| CXR-08 | LinkGearCreditRequest to LinkGearCreditResponse | Insert one contribution/item link, source version, visibility ceiling and audit/outbox. | Resolve exact BE07 credit visibility and Shard 23 item identity. |
| CXR-09 | ProjectGearDiscographyRequest to ProjectGearDiscographyResponse | CAS opt-in and derived projection, or purge marker when source is restrictive. | Read BE07 public state and notify/purge Shard 23 projection worker. |
| CXR-10 | RecordGearOwnershipTransferRequest to RecordGearOwnershipTransferResponse | Append inbound ownership event and queue projection rebuild; no canonical owner write. | Verify Shard 23 event identity/version and reconcile by idempotency key. |

## Shared Contract Inheritance

- BE00 request envelope carries requestId, authenticated session or service principal, acting context, locale, schema version and trace context.
- Success envelope is data, requestId and schemaVersion. Every route uses exactly ApiError { code, message, requestId, details } for 4xx and 5xx.
- Idempotency-Key binds actor, route, normalized request hash and schema version. Same key and hash returns the first result; changed payload returns IDEMPOTENCY_MISMATCH with no duplicate link or event.
- expectedVersion and source credit/item versions are required. CAS losers return VERSION_CONFLICT.
- RLS applies the source credit's confidentiality as a hard ceiling. Item opt-in never widens an embargoed or confidential credit, and prior-owner private session access never follows an item transfer.
- Shard 23 identity and ownership are authoritative. The inbound event is accepted only from an authenticated service principal with the registered item version and source event ID.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CXR-08C-01 | CXR-08 Link gear to contribution | POST /api/v1/credits/{creditId}/gear-links | Credited party or Producer with mandate covering the contribution; item identity must resolve | LinkGearCreditRequest | LinkGearCreditResponse 201 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 20/day per actor and 100/day per credit | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, BE01 mandate, BE07 visibility, item gate, rate and ApiError normalization |
| CXR-08C-02 | CXR-09 Publish gear discography line | POST /api/v1/gear-items/{itemId}/discography-lines | Item owner or delegated item curator; owner opt-in is per item/version | ProjectGearDiscographyRequest | ProjectGearDiscographyResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 503 | Idempotency-Key required; 30/hour per item owner and 300/hour projection lane | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, item authority, visibility-before-projection, rate, purge queue and ApiError normalization |
| CXR-08C-03 | CXR-10 Transfer registered gear | POST /api/v1/internal/gear/ownership-events | Shard 23 registered service principal only; this route records an event and never grants owner authority | RecordGearOwnershipTransferRequest | RecordGearOwnershipTransferResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 503 | Idempotency-Key required; 120/min per Shard 23 principal and 2,000/hour ownership-event lane | CORS non-browser Shard 23 service allowlist; BE00 principal signature/replay, strict Zod, item/version CAS, deny-first purge, rate, queue and ApiError normalization |

### Registry invariants

- Every operation returns ApiError { code, message, requestId, details }; details contain field paths, opaque IDs, state and retry metadata only.
- 403 means a visible credit/item/link exists but the actor lacks credited-party, mandate, item-owner, curator or Shard 23 service capability. 404 means RLS hides the source credit/item/link or the opaque source event is absent.
- 409 means idempotency mismatch, stale credit/item/source version or duplicate active link/event. 422 means session-level link, unresolved item, missing author/source method or invalid opt-in state. 503 means the source or projection adapter remains unavailable after bounded retry.
- Ownership transfer is never written by 08c. The inbound command only records the authoritative event and triggers projection reconciliation.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| CXR-08C-01 | LinkGearCreditRequest to LinkGearCreditResponse with link, item/version, source method, author, source visibility ceiling and version. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-credited party or mandate; CREDIT_OR_ITEM_NOT_FOUND 404; IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409; SESSION_LINK_FORBIDDEN, ITEM_UNRESOLVED or AUTHOR_REQUIRED 422; SOURCE_UNAVAILABLE 503. |
| CXR-08C-02 | ProjectGearDiscographyRequest to ProjectGearDiscographyResponse with item opt-in, public-safe lines, projection version and purge state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-owner; ITEM_NOT_FOUND 404; VERSION_CONFLICT 409; SOURCE_UNAVAILABLE or PURGE_PENDING 503. |
| CXR-08C-03 | RecordGearOwnershipTransferRequest to RecordGearOwnershipTransferResponse with accepted item/version, event ID and projection rebuild state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-Shard 23 principal; ITEM_NOT_FOUND 404 for unknown item/version; IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409; OWNERSHIP_EVENT_UNVERIFIED 422; PROJECTION_UNAVAILABLE 503. |

### Route field validation matrix

| Operation ID | Required validation | Success assertion |
|---|---|---|
| CXR-08C-01 | Existing contribution credit, exact one item/version, author, source method, mandate and source visibility version; reject session-level links. | One link is written with inherited restrictive visibility and no ownership or credit mutation. |
| CXR-08C-02 | Item owner opt-in, item version, source link versions and visibility-safe projection; never use prior owner opt-in. | Projection includes only current public lines or records a deny-first purge state. |
| CXR-08C-03 | Shard 23 service signature, event ID, item/version, current holder, effective time and expected version. | Event is appended once and rebuild is queued; owner authority and private access remain source-controlled. |

## Request/Response Contracts (Zod 4 schemas)

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
const Visibility = z.enum(["public", "embargoed", "confidential"]);
const LinkState = z.enum(["pending", "active", "purged", "rejected"]);

export const LinkGearCreditRequest = z.strictObject({
  creditId: Id,
  contributionRef: Id,
  itemId: Id,
  itemVersion: Version,
  authorPartyId: Id,
  sourceMethod: z.string().min(1).max(120),
  sourceCreditVersion: Version,
  expectedVersion: Version,
});

export const LinkGearCreditResponse = z.strictObject({
  linkId: Id,
  creditId: Id,
  contributionRef: Id,
  itemId: Id,
  itemVersion: Version,
  state: LinkState,
  inheritedVisibility: Visibility,
  sourceMethod: z.string().min(1).max(120),
  authorPartyId: Id,
  projectionEligible: z.boolean(),
  version: Version,
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const ProjectGearDiscographyRequest = z.strictObject({
  itemId: Id,
  itemVersion: Version,
  ownerOptIn: z.boolean(),
  sourceLinkVersions: z.array(z.strictObject({ linkId: Id, version: Version })).max(500),
  expectedVersion: Version,
});

export const ProjectGearDiscographyResponse = z.strictObject({
  projectionId: Id,
  itemId: Id,
  itemVersion: Version,
  state: z.enum(["published", "purged", "blocked", "pending"]),
  ownerOptIn: z.boolean(),
  publicLines: z.array(z.strictObject({
    linkId: Id,
    creditId: Id,
    contributionRef: Id,
    visibility: z.literal("public"),
  })).max(500),
  projectionHash: Hash.optional(),
  purgeEpoch: Version,
  version: Version,
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const RecordGearItemIdentityRequest = z.strictObject({
  itemId: Id,
  itemVersion: Version,
  currentHolderRef: Id,
  effectiveAt: DateTime,
  expectedVersion: Version,
  sourceEventId: Id,
});

export const RecordGearItemIdentityResponse = z.strictObject({
  itemId: Id,
  acceptedItemVersion: Version,
  identityState: z.enum(["registered", "pending", "rejected"]),
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const RecordGearOwnershipTransferRequest = z.strictObject({
  itemId: Id,
  itemVersion: Version,
  currentHolderRef: Id,
  effectiveAt: DateTime,
  expectedVersion: Version,
  sourceEventId: Id,
});

export const RecordGearOwnershipTransferResponse = z.strictObject({
  ownershipEventId: Id,
  itemId: Id,
  acceptedItemVersion: Version,
  eventState: z.enum(["accepted", "duplicate", "rejected"]),
  projectionRebuildState: z.enum(["queued", "running", "complete", "pending"]),
  priorOwnerPrivateAccessTransferred: z.literal(false),
  requestId: Id,
  schemaVersion: z.string().min(1),
});
~~~

RecordGearItemIdentityRequest and RecordGearItemIdentityResponse are the protected companion command contract for the Shard 23 identity bootstrap. They are not a second public operation or route. All commands use BE00 headers: X-Request-Id, Idempotency-Key, schema version and trace context. Unknown keys, malformed UUIDs, invalid versions and unbounded link arrays are rejected before source or projection effects.

## Database Schema

The two tables below are the complete 08c persistence set. Item identity, serial state, ownership and source credit truth remain external opaque references. Supabase PostgreSQL RLS is enabled on both tables; public projections are deny-first.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| gear_credit_link | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; credit_id uuid NOT NULL; contribution_ref uuid NOT NULL; item_ref uuid NOT NULL; item_version bigint NOT NULL CHECK > 0; author_ref uuid NOT NULL; source_method text NOT NULL CHECK char_length(source_method) between 1 and 120; source_credit_version bigint NOT NULL CHECK > 0; inherited_visibility text NOT NULL CHECK public, embargoed or confidential; owner_opt_in boolean NOT NULL DEFAULT false; state text NOT NULL CHECK pending, active, purged or rejected; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | credit and contribution refs are BE07 opaque refs; item and author refs are Shard 23/BE01 opaque refs with no local FK. UNIQUE credit_id, contribution_ref, item_ref, item_version; indexes credit_id, contribution_ref, item_ref plus item_version, inherited_visibility, state, owner_id. | RLS permits credited party, mandated Producer and assigned projection worker according to source purpose; public projection sees only active public links; svc_gear_link writes; no direct client table grant. |
| gear_discography_projection | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; item_ref uuid NOT NULL; item_version bigint NOT NULL CHECK > 0; owner_opt_in boolean NOT NULL; public_link_refs jsonb NOT NULL DEFAULT [] CHECK jsonb_typeof(public_link_refs) = array; source_visibility_versions jsonb NOT NULL DEFAULT [] CHECK jsonb_typeof(source_visibility_versions) = array; projection_hash char(64) NULL; purge_epoch bigint NOT NULL DEFAULT 0 CHECK >= 0; state text NOT NULL CHECK published, purged, blocked or pending; rebuilt_from_event_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | item and link refs are Shard 23/08c opaque refs; rebuilt_from_event_id is a local inbound event ref. UNIQUE item_ref, item_version; indexes item_ref plus item_version, owner_id, state, purge_epoch, projection_hash, updated_at DESC. | RLS permits item owner, delegated curator, Shard 23 purge worker and source-authorized viewer projection; public grant selects only published lines; svc_gear_projection writes; no direct client table grant. |

### Persistence invariants

- gear_credit_link is contribution-granular and cannot be inserted with only a session reference. Exact item identity and source method are mandatory.
- inherited_visibility is the minimum of source credit visibility and any item projection policy. An owner opt-in cannot make an embargoed or confidential credit public.
- gear_discography_projection is derived and rebuildable. If a source credit becomes restrictive, purge_epoch advances before public rows are removed; the previous owner never gains access to private source context.
- Item ownership transfer is represented by an inbound Shard 23 event. 08c does not update currentHolder, owner or serial truth and does not transfer private session access.
- Deleting or revoking a party, credit or item removes derived public lines, preserves a safe audit tombstone and queues idempotent rebuild/cleanup.

## Middleware & Policies

### Hono middleware order

1. HTTPS, body-size and array limits: JSON body 128 KiB and 500 link/version entries.
2. CORS: credentialed first-party consumer/staff allowlist for human routes; non-browser Shard 23 service allowlist for internal route; never wildcard credentials.
3. Request ID, trace context and replay-window validation.
4. BE00 authentication, acting-context or service-principal signature, CSRF for browser commands and schema version.
5. Strict Zod 4 parsing and cross-field checks for contribution granularity, item versions and owner opt-in.
6. BE01 mandate or item authority and BE07 visibility resolution before existence-sensitive queries.
7. Idempotency and numeric rate reservation.
8. Transactional CAS, source-version recheck, deny-first purge and audit/outbox write.
9. Queue/cache projection and redacted response with metrics.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| CXR-08C-01 | Credited party or mandated Producer | Contribution credit scope, mandate, exact item identity and source method | Lock link key; recheck credit visibility, item version and mandate | Hidden credit/item is 404; visible actor without credit or mandate is 403. |
| CXR-08C-02 | Item owner or delegated curator | Item owner opt-in and item/version scope; source credit must be public | Lock item projection; recheck every source link and visibility version | Hidden item is 404; another owner or curator is 403. |
| CXR-08C-03 | Authenticated Shard 23 service principal | Registered item/version and event source; no human ownership capability | Lock item event key; recheck expected item version and source event ID | Unknown item/version is 404; non-Shard 23 principal is 403. |

### Security and abuse controls

- A caller cannot smuggle item ownership through authorPartyId, currentHolderRef or ownerOptIn. Authority comes from BE01 or the verified Shard 23 service principal.
- Source credit visibility is checked before cache keys, counts, line ordering and event payload. Hidden links are omitted rather than represented as gaps.
- Public lines contain only opaque credit/contribution/item refs and allowed public labels. Private session source, serial details, prior owner and mandate evidence are withheld.
- Session close, attendance capture and gear prompts are separate surfaces; no 08c route accepts a session-close invocation as link authority.
- Internal events require signed service authentication, replay detection, sourceEventId uniqueness and rate budget. Ownership event payloads are never accepted from browser origins.
- Logs include requestId, opaque refs, visibility state, item version, purge epoch and timing class only. Raw serials, private source context and holder identity are excluded.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| CXR-08C-01, CXR-08C-02 | BE07 credit and visibility projection | creditId, contributionRef, purpose, requestedVersion, viewerContextVersion | creditVersion, visibilityState, publicLabels, contributionState, allowedForItemProjection | 2,000 ms; 2 safe read retries at 100/500 ms; circuit opens after 5 failures in 60 seconds; unknown source denies projection and does not create a link. |
| CXR-08C-01, CXR-08C-02 | BE01 party and mandate authority | actorRef, creditId, contributionRef, itemRef, requestedContextVersion | authorityState, mandateState, partyRef, contextVersion, effectiveAt | 2,000 ms; one safe read retry at 250 ms; circuit 5/60 seconds; unknown authority returns pending or 403 without mutation. |
| CXR-08C-01, CXR-08C-03 | Shard 23 item identity and ownership adapter | itemId, itemVersion, sourceEventId, currentHolderRef, effectiveAt, expectedVersion | registeredItemVersion, identityState, holderState, acceptedEventId, sourceVersion | 2,000 ms; 3 retries at 15/60/300 seconds for idempotent reads/event reconciliation; circuit 5/60 seconds; unknown event remains pending. |
| CXR-08C-02, CXR-08C-03 | Projection cache and purge worker | itemRef, linkRefs, sourceVisibilityVersions, purgeEpoch, reasonCode | projectionHash, purgeReceipt, cacheEpoch, completedAt | 2,000 ms; 3 retries at 15/60/300 seconds; circuit 5/60 seconds; failure applies deny-first and leaves rebuild pending. |

All seams carry requestId and idempotency key. A source or purge timeout after local commit is reconciled by event ID and version before another attempt.

### State machines and concurrency

- gear_credit_link: pending -> active -> purged or rejected. A restrictive source state can only move active to purged; it never becomes public through item opt-in.
- gear_discography_projection: pending -> published or blocked; published -> purged on opt-out, source restriction, item revocation or deletion. Rebuilds use item version and purge epoch.
- Shard 23 ownership event: accepted -> projection rebuild queued -> running -> complete or pending. Duplicate sourceEventId is a replay, not a second ownership change.
- Same idempotency key and hash returns the first link/projection/event result. Changed input returns IDEMPOTENCY_MISMATCH. Competing expected versions return VERSION_CONFLICT.
- Projection worker orders visibility invalidation before public cache write. It never publishes a line from a stale source snapshot.

### Failure recovery

- Item identity unavailable leaves the link absent or pending and leaves the credit unaffected. No guessed item or fuzzy identity is accepted.
- Credit visibility becomes embargoed/confidential: deny-first purge runs, purge_epoch increments, source line is removed within the Shard 07 restrictive-visibility SLA and no source mutation occurs.
- Shard 23 event timeout leaves the event pending, reconciles by sourceEventId and expected version, and never changes holder state locally.
- Cache purge failure keeps restrictive source policy active, serves no new public line and retries through the queue.
- Owner revocation or deletion removes public projection access and queues cleanup while retaining item-linked non-PII history and audit tombstone.
- A rebuild race discards stale worker output when item version or source visibility version no longer matches.

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery rule |
|---|---|---|
| credit.gear-link.changed.v1 | eventId, linkId, creditId, contributionRef, itemRef, itemVersion, state, inheritedVisibility, projectionVersion, purgeEpoch, occurredAt | Opaque refs and safe state only; no serial, holder, mandate, private session source or hidden credit label. |

~~~ts
export const GearLinkChangedEvent = z.strictObject({
  eventId: z.uuid(),
  linkId: z.uuid(),
  creditId: z.uuid(),
  contributionRef: z.uuid(),
  itemRef: z.uuid(),
  itemVersion: z.number().int().positive(),
  state: z.enum(["pending", "active", "purged", "rejected"]),
  inheritedVisibility: z.enum(["public", "embargoed", "confidential"]),
  projectionVersion: z.number().int().nonnegative(),
  purgeEpoch: z.number().int().nonnegative(),
  occurredAt: z.iso.datetime({ offset: true }),
});
~~~

The transactional outbox publishes after link/event commit. Shard 23 consumes a safe link/projection event and refetches its own authorized item view; event delivery does not grant ownership.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, signature, CSRF or authentication | UNAUTHENTICATED or INVALID_REQUEST | Reject before source or projection effect; retain requestId. |
| Credit/item/mandate scope | FORBIDDEN or 404 | Do not disclose hidden source credit, item or holder state. |
| Item identity or source visibility | ITEM_UNRESOLVED, SOURCE_UNAVAILABLE or EMBARGOED_NOT_FOUND | Leave link absent/pending and preserve restrictive projection. |
| CAS or idempotency | IDEMPOTENCY_MISMATCH or VERSION_CONFLICT | Return safe version metadata and require explicit retry. |
| Purge/cache worker | PURGE_PENDING or PROJECTION_UNAVAILABLE | Keep deny-first and retry without widening visibility. |
| Shard 23 ownership event | OWNERSHIP_EVENT_UNVERIFIED or duplicate accepted event | Reconcile by sourceEventId; never write owner locally. |
| Revocation/deletion | ACCESS_REVOKED | Remove derived access, preserve non-PII tombstone and queue cleanup. |

### Operation error coverage

| Operation ID | Invalid input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| CXR-08C-01 | Session-level link, unresolved item, missing author/source method, nonparticipant or invalid mandate is rejected. | Link uniqueness and CAS collapse replay; source outage leaves no link; deletion purges derived line and preserves audit. |
| CXR-08C-02 | Non-owner opt-in, hidden item, stale source link or invalid projection input is rejected. | Visibility invalidation wins races; cache outage stays deny-first; item deletion removes projection without exposing prior owner context. |
| CXR-08C-03 | Browser caller, unsigned source, unknown item/version or malformed event is rejected. | Duplicate sourceEventId is idempotent; stale event is VERSION_CONFLICT; adapter outage leaves rebuild pending and no local owner mutation. |

## Observability

| Operation ID | Audit event and metrics | Safe trace fields and alert |
|---|---|---|
| CXR-08C-01 | gear.link.created, gear_link_total, link_rejected_total, item_identity_latency_ms | requestId, linkId, creditRef hash, itemRef hash, visibility and state; alert on session-level-link attempts and identity outage. |
| CXR-08C-02 | gear.discography.projected, gear_projection_total, purge_total, purge_pending_total | requestId, projectionId, itemRef hash, itemVersion, purgeEpoch, state; alert on public line after restrictive source or purge SLA breach. |
| CXR-08C-03 | gear.ownership.event.accepted, ownership_event_total, rebuild_pending_total, source_event_duplicate_total | requestId, sourceEventId hash, itemRef hash, version and rebuild state; alert on unsigned events, replay spikes or local owner-write attempt. |

Structured logs exclude serial numbers, holder identity, private session facts, mandate evidence and hidden credit titles. provider-native diagnostic sinks receive only opaque refs and redacted codes.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CXR-08C-01 | Parse strict request/response; reject session-only links, unresolved item, missing author/source and non-mandated Producer; verify 403 versus hidden 404; replay idempotency. |
| CXR-08C-02 | Parse owner opt-in and public-only projection; reject non-owner and hidden item; race opt-out with rebuild; assert restrictive visibility purges line before cache publish. |
| CXR-08C-03 | Parse signed internal event; reject browser/unsigned source and stale version; replay sourceEventId; assert no owner or private-access mutation and rebuild queue once. |

### Persistence, concurrency and recovery tests

- Migration tests assert both tables, SQL types, nullability, checks, opaque-ref rationale, indexes, RLS policies and grants.
- Property tests generate session-level refs, invalid versions, unknown keys, malformed hashes, duplicate source events and over-limit arrays.
- Concurrency tests race link creation, owner opt-in/opt-out, visibility invalidation, item transfer events and two rebuild workers.
- Security tests prove inherited confidentiality, private session source, serial/holder data, mandate evidence and prior-owner access cannot leak.
- Queue tests prove deny-first purge, bounded retries, circuit opening, sourceEventId reconciliation and stale-worker discard.
- Accessibility tests verify opt-in consequence disclosure, purge status, keyboard projection controls, no-color state and persistent retry routes.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | CXR-08 through CXR-10 have strict schemas, status/error mapping, idempotency and numeric rates. |
| Link-boundary pass | Contribution granularity, author/source method and exact item identity are mandatory; session-close prompt is excluded. |
| Persistence pass | Both IA models have typed SQL fields, constraints, opaque-ref/FK rationale, indexes, RLS and grants. |
| State/recovery pass | Link, projection and inbound-event states, CAS, deny-first purge and adapter retry are explicit. |
| Adversarial pass | Hidden credits/items, owner changes, prior-owner privacy, forged events, replay and cache failure are covered. |
| Macro boundary pass | BE00, BE01 and BE07 are consumed; Shard 23 is inbound-only; 08a, 08b and 08d routes are not duplicated. |
| Auditability pass | Source inventory, exact source-map IDs, route registry, per-operation matrices, event payload, tests and links reconcile. |

## Ambiguity Gate

PASS. The sole canonical IA source is .memory/wiki/specs/ia/08-credit-reporting-disclosure.md and it requires no deep-dive file. CXR-08 through CXR-10 have one owner and one operation. Contribution-only linkage, exact Shard 23 item identity, owner opt-in, inherited confidentiality, deny-first purge, inbound ownership event direction, prior-owner privacy, 403 versus 404, idempotency, numeric rates, CORS, ApiError, external timeout/retry/circuit budgets, RLS, grants, deletion and stale rebuild behavior are resolved. No route duplicates BE00, 08a, 08b or 08d. All Markdown tables have matching widths and no unescaped cell pipes.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Classified and authored contribution gear links, item discography projection and Shard 23 inbound ownership contracts from canonical Shard 08 IA. | /write-be-spec | All |
| 2026-08-28 | Locked inherited visibility, protected inbound commands, typed persistence, purge recovery, route matrices and ambiguity evidence. | /write-be-spec-write | API, Contracts, Database, Middleware, Data Flow, Tests |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [BE01b — Party identity and aliases](01b-party-identity-aliases.md)
- [BE07a — Credit assertions and visibility](07a-credit-assertions-visibility.md)
- [BE08a — Portability and DDEX/RIN emission](08a-portability-ddex-emission.md)
- [IA Shard 08 — Credit reporting, exchange and disclosure](../ia/08-credit-reporting-disclosure.md)
