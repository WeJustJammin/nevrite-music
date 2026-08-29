# Run of Show, Crew and Credentials — Backend Specification

## Split Group

- IA source: ../ia/33-show-day-operations.md.
- Assigned interactions: 33.05 Generate run of show, 33.06 Apply live slippage, 33.07 Evaluate curfew margin, 33.08 Build crew roster/calls, 33.09 Issue credential and 33.10 Attach local crew engagement.
- Owned aggregates: RunOfShow, CrewAssignment and Credential.
- Owned events: showday.timeline.changed and showday.credential.changed.
- Boundary: the timeline derives only from pinned sources; gaps remain gaps. Credentials are advisory venue/event access projections, not identity or legal authorization. Local crew engagement/payment remains Shard14.

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 33.05 | POST | /api/v1/showday/events/{eventId}/run-of-show-generations | 201 RunOfShowV1 |
| 33.06 | POST | /api/v1/showday/events/{eventId}/timeline-slippages | 201 RunOfShowV1 |
| 33.07 | GET | /api/v1/showday/events/{eventId}/curfew-margin | 200 CurfewMarginV1 |
| 33.08 | POST | /api/v1/showday/events/{eventId}/crew-assignments | 201 CrewRosterV1 |
| 33.09 | POST | /api/v1/showday/events/{eventId}/credentials | 201 CredentialV1 |
| 33.10 | POST | /api/v1/showday/events/{eventId}/local-crew-links | 201 CrewAssignmentV1 |

References: ../ia/33-show-day-operations.md, 00-infrastructure.md and Shards14/32 source seams.

## Shared Contract Inheritance

ApiError { code, message, requestId, details } is exact. Details/logs/events omit personal contact, payment terms, protected schedule notes, credential token and venue security topology. Writes use credentialled CORS, CSRF, strict Zod, Idempotency-Key and If-Match; external engagement linkage quotes source revision.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 33](../ia/33-show-day-operations.md) | Interactions lines 73–95; Contracts lines 96–115; Data Models lines 116–158; Access Control lines 159–184; Event Schemas and Edge Cases lines 195–228 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.07 Show Day Schedule & Timing | 33.05–33.07 |
| 18.08 Crew, Call Times & Credentials | 33.08–33.10 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 33.05 | POST | /api/v1/showday/events/{eventId}/run-of-show-generations | show-day timeline.manage | key; frozen plan/bill/call/constraint manifest unique | 30/hour event; no-store; 10s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, source/timeline/constraint |
| 33.06 | POST | /api/v1/showday/events/{eventId}/timeline-slippages | timeline owner/operator | key plus If-Match; mutation/cascade preview CAS | 120/hour event; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, timeline/mutation/cascade |
| 33.07 | GET | /api/v1/showday/events/{eventId}/curfew-margin | event participant with constraint visibility | safe read; timeline/curfew/source watermark ETag | 120/min; private max-age=15; 1s | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, event/constraint RLS |
| 33.08 | POST | /api/v1/showday/events/{eventId}/crew-assignments | crew.manage and engagement/person visibility | key plus If-Match; person/role/call version CAS | 60/hour; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, person/role/engagement/schedule |
| 33.09 | POST | /api/v1/showday/events/{eventId}/credentials | credential.issue and current roster/area map | key; person/role/area-map version unique; prior supersedes | 120/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, roster/role/area/expiry |
| 33.10 | POST | /api/v1/showday/events/{eventId}/local-crew-links | crew.manage and accepted Shard14 engagement visibility | key; engagement/person/role/event unique | 60/hour; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, engagement/source/role/call |

## Zod 4 Contracts

| ID | Strict request/query | Success |
|---|---|---|
| 33.05 | RunOfShowGenerate { frozenAdvanceVersion, billVersion, crewCallVersion, constraintVersions, durationRangeSources, ruleVersion } | RunOfShowV1 { timelineId, version, items with owner/startRange/endRange/dependencies/source, gaps, uncertainty, curfewRisk, sourceManifest } |
| 33.06 | TimelineSlippageCreate { timelineVersion, mutation { itemId, observedStart/End nullable, deltaSeconds nullable, reasonCode }, cascadePreviewId, acceptedAffectedItemIds } | RunOfShowV1 { priorVersion, version, mutation, cascadedItems, newRanges, curfewMargin, unresolvedConflicts } |
| 33.07 | CurfewMarginQuery { asOf nullable } | CurfewMarginV1 { risk breach/tight/clear/unknown, earliest/latestMarginSeconds nullable, curfewConstraint, timelineVersion, provenance, uncertainty } |
| 33.08 | CrewRosterCreate { expectedVersion, assignments with personId/roles/sourceEngagementId nullable/perRoleCalls/availability, conflictAcknowledgements } | CrewRosterV1 { eventId, version, assignments, namedConflicts, callSchedule } |
| 33.09 | CredentialCreate { crewAssignmentId/version, role, areaCodes, areaMapVersion, validFrom/Until, credentialType } | CredentialV1 { credentialId, event/person/role/areas, tokenRef, state advisory_active, version, expiresAt } |
| 33.10 | LocalCrewLinkCreate { engagementId, engagementRevision, personId, roles, callRefs, paymentReference, sourceAcceptedAt } | CrewAssignmentV1 { assignmentId, sourceEngagementRef, roles/calls, credentialPosture, version } |

### Exact typed success schemas

Every operation comment is a normative route mapping to a strict Zod 4 body.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const TimelineItem = z.object({
  itemId: Uuid, ownerPartyId: Uuid, startRange: z.object({ earliest: Instant, latest: Instant }).strict(),
  endRange: z.object({ earliest: Instant, latest: Instant }).strict(), dependencies: z.array(Uuid).max(100),
  source: z.object({ kind: z.string().regex(/^[a-z0-9_]{1,64}$/), refId: Uuid, version: Version }).strict(),
}).strict();
const Margin = z.object({ earliestSeconds: z.int().nullable(), latestSeconds: z.int().nullable() }).strict();
// 33.05
export const GenerateRunOfShowSuccess = z.object({
  timelineId: Uuid, version: Version, items: z.array(TimelineItem).max(2000),
  gaps: z.array(z.object({ afterItemId: Uuid.nullable(), beforeItemId: Uuid.nullable(), seconds: z.int().min(0) }).strict()).max(2000),
  uncertainty: z.enum(["none", "bounded", "material"]), curfewRisk: z.enum(["breach", "tight", "clear", "unknown"]),
  sourceManifest: z.array(z.object({ sourceRef: Uuid, version: Version }).strict()).max(500),
}).strict();
// 33.06
export const TimelineSlippageSuccess = z.object({
  timelineId: Uuid, priorVersion: Version, version: Version,
  mutation: z.object({ itemId: Uuid, observedStart: Instant.nullable(), observedEnd: Instant.nullable(), deltaSeconds: z.int().nullable(), reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict(),
  cascadedItems: z.array(Uuid).max(2000), newRanges: z.array(TimelineItem).max(2000), curfewMargin: Margin,
  unresolvedConflicts: z.array(z.object({ itemId: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(2000),
}).strict();
// 33.07
export const CurfewMarginV1 = z.object({
  risk: z.enum(["breach", "tight", "clear", "unknown"]), earliestMarginSeconds: z.int().nullable(), latestMarginSeconds: z.int().nullable(),
  curfewConstraint: z.object({ curfewAt: Instant, sourceRef: Uuid, version: Version }).strict(), timelineVersion: Version,
  provenance: z.array(z.object({ refId: Uuid, version: Version }).strict()).max(500), uncertainty: z.enum(["none", "bounded", "unknown"]),
}).strict();
const CrewAssignment = z.object({ assignmentId: Uuid, personId: Uuid, roles: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).min(1).max(20), callIds: z.array(Uuid).max(100), availability: z.enum(["available", "partial", "unavailable", "unknown"]) }).strict();
// 33.08
export const CrewRosterV1 = z.object({
  eventId: Uuid, version: Version, assignments: z.array(CrewAssignment).max(2000),
  namedConflicts: z.array(z.object({ assignmentId: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/), acknowledged: z.boolean() }).strict()).max(2000),
  callSchedule: z.array(z.object({ callId: Uuid, startsAt: Instant, endsAt: Instant, assignmentIds: z.array(Uuid).max(2000) }).strict()).max(2000),
}).strict();
// 33.09
export const CredentialV1 = z.object({
  credentialId: Uuid, eventId: Uuid, personId: Uuid, role: z.string().regex(/^[a-z0-9_]{1,64}$/),
  areas: z.array(z.string().regex(/^[A-Z0-9_-]{1,32}$/)).min(1).max(100), tokenRef: Uuid,
  state: z.literal("advisory_active"), version: Version, expiresAt: Instant,
}).strict();
// 33.10
export const CrewAssignmentV1 = z.object({
  assignmentId: Uuid, sourceEngagementRef: z.object({ engagementId: Uuid, revision: Version }).strict(),
  roles: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).min(1).max(20), calls: z.array(Uuid).max(100),
  credentialPosture: z.enum(["none", "eligible", "issued", "superseded", "revoked"]), version: Version,
}).strict();
~~~

- Timeline owns operational items; source objects remain referenced. Missing source creates an explicit gap with owner/severity, never an invented time.
- Live slippage first produces/quotes a cascade preview. Stale clients receive current timeline and rebase data; no last-write-wins.
- Curfew risk range: breach when latest allowed is below earliest plausible completion; clear when earliest allowed exceeds latest completion plus buffer; tight otherwise; stale/unknown hard constraint is unknown.
- Crew call is per role. One person with overlapping role calls produces a named conflict; acknowledgment does not erase it.
- Credential areas derive from role plus venue area-map version and may only narrow by issuer. Role/area change supersedes prior credential immediately; token is not proof beyond event/expiry.
- Local engagement link references accepted Shard14 engagement and payment reference only; no hiring, contract, invoice or payment state is duplicated.

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 33.07 | Pagination N/A: this GET returns one curfew-margin projection; strict request parsing rejects cursor, offset, page, limit, and sort keys. | `provenance` contains at most 500 `{ refId, version }` entries; no other returned field is a collection. |

## Database Schema

| Model | Typed fields, constraints, indexes | RLS/grants |
|---|---|---|
| RunOfShow | id uuid; event_id; version; source_manifest; items_json; gaps_json; uncertainty_json; curfew_projection; checksum; parent_version nullable; created_by/at | unique event,version/checksum; GIN items; append-only; event participants via item visibility |
| timeline_mutation | id uuid; timeline_id/prior/new version; item_id; observed times/delta; reason; cascade_json; source_event_id; created_by/at | unique timeline,new version/source event; append-only |
| CrewAssignment | id uuid; event_id; person_id; roles; source_engagement_id/revision nullable; per_role_calls; availability; conflicts; payment_reference nullable; credential_posture; version | unique event,person,version; indexes event,role; person/crew managers; payment fields narrowed |
| Credential | id uuid; event_id; person_id; crew_assignment_id/version; role; area_codes; area_map_version; token_digest; state advisory_active/superseded/revoked/expired; valid_from/until; supersedes_id nullable; version | unique active event/person/role/area map partial; expiry index; person/issuer/scanner safe projection |

All base tables enable RLS and deny PUBLIC/anon. Credential tokens are BE00 digests; scanners receive event/area/state only. Versions/mutations are append-only. Engagement/payment remain external typed refs.

### D4 Persistence and Query-Plan Closure

Every field below is normative SQL and `NOT NULL` unless explicitly marked `NULL`; local FKs use `ON DELETE RESTRICT`, while revision-pinned Shard14/32 and venue refs are validated through owner seams.

| Table | Exact SQL field types and constraints | Relationships and query-pattern indexes | RLS and grants |
|---|---|---|---|
| `run_of_shows` (RunOfShow) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version>0)`; `source_manifest jsonb NOT NULL CHECK (jsonb_typeof(source_manifest)='object')`; `items_json jsonb NOT NULL CHECK (jsonb_typeof(items_json)='array')`; `gaps_json jsonb NOT NULL CHECK (jsonb_typeof(gaps_json)='array')`; `uncertainty_json jsonb NOT NULL CHECK (jsonb_typeof(uncertainty_json)='array')`; `curfew_projection jsonb NOT NULL CHECK (jsonb_typeof(curfew_projection)='object')`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `parent_version uuid NULL`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | Self-FK `parent_version -> run_of_shows.id`; event/source manifest are revision-pinned ProductionEvent/Shard32 relationships. `UNIQUE(event_id,version)`, `UNIQUE(event_id,checksum)`; `INDEX(event_id,version DESC)`; GIN `(items_json jsonb_path_ops)` | FORCE RLS. Event participants select items allowed by item visibility; producer inserts; append-only trigger denies UPDATE/DELETE. |
| `timeline_mutations` (timeline_mutation) | `id uuid PRIMARY KEY`; `timeline_id uuid NOT NULL`; `prior_version bigint NOT NULL CHECK (prior_version>0)`; `new_version bigint NOT NULL CHECK (new_version=prior_version+1)`; `item_id uuid NOT NULL`; `observed_start timestamptz NULL`; `observed_end timestamptz NULL`; `delta_seconds integer NULL`; `reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 500)`; `cascade_json jsonb NOT NULL CHECK (jsonb_typeof(cascade_json)='array')`; `source_event_id uuid NOT NULL`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL`; CHECK requires at least one observation/delta | FK `timeline_id -> run_of_shows.id`; item ID resolves inside the quoted timeline. `UNIQUE(timeline_id,new_version)`, `UNIQUE(timeline_id,source_event_id)`; `INDEX(timeline_id,created_at DESC)`; `INDEX(item_id,created_at DESC)` | FORCE RLS. Same visibility as timeline; authorized live operator inserts; immutable audit history denies UPDATE/DELETE. |
| `crew_assignments` (CrewAssignment) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `person_id uuid NOT NULL`; `roles text[] NOT NULL CHECK (cardinality(roles) BETWEEN 1 AND 20)`; `source_engagement_id uuid NULL`; `source_engagement_revision bigint NULL CHECK (source_engagement_revision IS NULL OR source_engagement_revision>0)`; `per_role_calls jsonb NOT NULL CHECK (jsonb_typeof(per_role_calls)='object')`; `availability jsonb NOT NULL CHECK (jsonb_typeof(availability)='object')`; `conflicts jsonb NOT NULL CHECK (jsonb_typeof(conflicts)='array')`; `payment_reference text NULL`; `credential_posture text NOT NULL CHECK (credential_posture IN ('none','eligible','issued','superseded','revoked'))`; `version bigint NOT NULL CHECK (version>0)` | Event/person are ProductionEvent/Shard00 refs; engagement/payment are Shard14 refs. `UNIQUE(event_id,person_id,version)`; `INDEX(event_id,version DESC)`; GIN `(roles)`; `INDEX(person_id,event_id)` | FORCE RLS. Person and crew manager select; payment reference is removed from general projection; authorized roster RPC inserts; unrelated roles concealed. |
| `credentials` (Credential) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `person_id uuid NOT NULL`; `crew_assignment_id uuid NOT NULL`; `crew_assignment_version bigint NOT NULL CHECK (crew_assignment_version>0)`; `role text NOT NULL CHECK (length(role) BETWEEN 1 AND 80)`; `area_codes text[] NOT NULL CHECK (cardinality(area_codes) BETWEEN 1 AND 100)`; `area_map_version bigint NOT NULL CHECK (area_map_version>0)`; `token_digest bytea NOT NULL CHECK (octet_length(token_digest)=32)`; `state text NOT NULL CHECK (state IN ('advisory_active','superseded','revoked','expired'))`; `valid_from timestamptz NOT NULL`; `valid_until timestamptz NOT NULL CHECK (valid_until>valid_from)`; `supersedes_id uuid NULL`; `version bigint NOT NULL CHECK (version>0)` | FK `crew_assignment_id -> crew_assignments.id`; self-FK `supersedes_id -> credentials.id`; area map is a version-pinned venue ref. Partial `UNIQUE(event_id,person_id,role,area_map_version) WHERE state='advisory_active'`; `INDEX(event_id,token_digest,state)`; partial `INDEX(valid_until) WHERE state='advisory_active'` | FORCE RLS. Person/issuer see safe record; scanner RPC sees event/areas/state only by digest; token/venue topology never enters general projection; no PUBLIC base grant. |

Migration tests assert every check/FK/seam validator, index plan, forced-RLS policy, role grant, expiry lookup, token concealment, and append-only history.

## State, Transactions and Recovery

- Timeline version appends; source refresh or slippage creates successor.
- Credential active → superseded/revoked/expired; no reactivation.
- Crew assignment versions append; source engagement cancellation creates a successor inactive posture.
- 33.05 commits timeline and showday.timeline.changed atomically.
- 33.06 locks timeline/current version, validates cascade preview and commits new version/mutation/event atomically.
- 33.09 locks assignment/person/role, supersedes prior token and emits credential event atomically.
- Source/provider failures write no partial version; notifications/scanner cache invalidation follow outbox and retry.

## Middleware, Access and Observability

Order: request ID → CORS → auth → CSRF → strict parse → rate → event/person/issuer RLS → idempotency/If-Match → source/role/area/constraint policy → transaction → response schema → redacted audit. Logs include IDs, versions, role/area codes, risk/conflict counts and safe errors; exclude contact, payment, protected notes, token and security topology.

## Events and Integrations

| Event/seam | Contract and delivery |
|---|---|
| showday.timeline.changed | timeline/version, mutation, cascade row refs, curfew margin/risk; at-least-once, timeline-version dedupe |
| showday.credential.changed | event/person/role/areas, state, version/expiry; credential-version dedupe, no token |
| Shard32 frozen plan/bill/calls | source versions → owned timing/constraints; 3s, 2 retries 100ms/500ms, circuit 5 failures/30s 30s; explicit gap |
| Shard14 engagement | engagement/revision → accepted person/role/payment ref; 2,000 ms/attempt; 3 total attempts with full-jitter caps 100ms/500ms; retry timeout, connection reset, 408/429/5xx; terminal unaccepted/revoked engagement, person/role mismatch, auth/schema, non-429 4xx; circuit opens after 5 retryable failures/30s for 30s, admits one half-open engagement probe, closes after two successes, and reopens on failure; fail closed with no assignment, credential, payment state, or duplicate lifecycle |
| credential scanner/cache | credential state → bounded signed verification projection; 1s, 2 retries 100ms/500ms, circuit 10 failures/30s 30s; deny on unknown |

### Exact retryability and circuit closure

Attempt totals include the initial attempt; every delay is full jitter from zero through its stated cap. Half-open circuits admit one probe at a time, close after two consecutive successful probes, and reopen for the full interval after a retryable probe failure.

| Seam | Deadline and exact attempt schedule | Retryable versus terminal outcomes | Circuit open, half-open, and fallback |
|---|---|---|---|
| Shard32 frozen plan/bill/calls | 3,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429, and 5xx. Invalid source version, auth denial, frozen-plan conflict, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open plan probe. Fallback records an explicit owned-source gap; it never invents timing or constraints. |
| Shard14 engagement | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429, and 5xx. Unaccepted/revoked engagement, person/role mismatch, auth denial, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open engagement probe. Fallback fails closed and creates no assignment, credential, payment state, or duplicate engagement lifecycle. |
| Credential scanner/cache | 1,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection/cache failure, 408, 429, and 5xx. Invalid signature/token scope, expired/revoked credential, schema failure, and non-429 4xx are terminal denials. | Open after 10 retryable failures in 30 s for 30 s; one half-open verification probe. Fallback denies access as unknown and emits no bearer/token data. |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 33.05 | 400 SOURCE_MANIFEST_INVALID; 403 TIMELINE_CAPABILITY_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 422 REQUIRED_SOURCE_GAP; 503 SOURCE_UNAVAILABLE |
| 33.06 | 400 MUTATION_INVALID/CASCADE_MISMATCH; 403 TIMELINE_AUTHORITY_REQUIRED; 409 TIMELINE_CONFLICT; 412 REVISION_MISMATCH |
| 33.07 | 400 QUERY_INVALID; 403 EVENT_SCOPE_REQUIRED; 409 CONSTRAINT_STALE; 503 SOURCE_UNAVAILABLE |
| 33.08 | 400 ROSTER_INVALID/CALL_CONFLICT_UNACKNOWLEDGED; 403 CREW_CAPABILITY_REQUIRED; 409 ASSIGNMENT_CONFLICT; 412 REVISION_MISMATCH |
| 33.09 | 400 CREDENTIAL_INVALID/AREA_INVALID; 403 ISSUER_OR_ROLE_REQUIRED; 409 CREDENTIAL_CONFLICT; 422 ASSIGNMENT_STALE |
| 33.10 | 400 ENGAGEMENT_LINK_INVALID; 403 CREW_OR_ENGAGEMENT_SCOPE_REQUIRED; 409 ENGAGEMENT_ALREADY_LINKED; 422 ENGAGEMENT_NOT_ACCEPTED; 503 ENGAGEMENT_SOURCE_UNAVAILABLE |

Unknown failures map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT, rates 429; hidden IDs are 404.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 33.05 | pinned timeline, duration ranges/gaps, no invented time and source conflict |
| 33.06 | preview/cascade acceptance, stale rebase, exact ranges and current-version CAS |
| 33.07 | breach/tight/clear formulas, uncertainty and stale hard constraint unknown |
| 33.08 | per-role calls, multi-role overlap named, acknowledgment and person/engagement scope |
| 33.09 | derived areas, narrowing, supersession/revoke/expiry and scanner unknown deny |
| 33.10 | accepted source link, replay, cancellation successor and no hiring/payment copy |

RLS/grant tests cover person, TM/producer, act, venue issuer/scanner, unrelated actor and services. Transaction tests prove timeline/credential/outbox atomicity and token invalidation.

## Deepening Passes

- Micro: ranges, gaps, cascade, curfew formulas, per-role calls, credential derivation and engagement refs are explicit.
- Macro: production/engagement/room owners remain canonical; show-day owns operational projections only.
- Devil's advocate: no implementation may invent missing time, silently last-write, turn unknown curfew clear, hide crew conflict, widen areas or create duplicate employment/payment.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 33.05 | `be_http_requests_total{operation_id="33.05",outcome,code}`, `be_http_latency_seconds{operation_id="33.05"}`, and `be_operation_recovery_total{operation_id="33.05",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.06 | `be_http_requests_total{operation_id="33.06",outcome,code}`, `be_http_latency_seconds{operation_id="33.06"}`, and `be_operation_recovery_total{operation_id="33.06",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.07 | `be_http_requests_total{operation_id="33.07",outcome,code}`, `be_http_latency_seconds{operation_id="33.07"}`, and `be_operation_recovery_total{operation_id="33.07",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.08 | `be_http_requests_total{operation_id="33.08",outcome,code}`, `be_http_latency_seconds{operation_id="33.08"}`, and `be_operation_recovery_total{operation_id="33.08",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.09 | `be_http_requests_total{operation_id="33.09",outcome,code}`, `be_http_latency_seconds{operation_id="33.09"}`, and `be_operation_recovery_total{operation_id="33.09",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.10 | `be_http_requests_total{operation_id="33.10",outcome,code}`, `be_http_latency_seconds{operation_id="33.10"}`, and `be_operation_recovery_total{operation_id="33.10",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 33b production backend specification |
| 2026-08-29 | Made 33.07 fixed-read pagination N/A and its nested collection cap explicit. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 33](../ia/33-show-day-operations.md)
- Shards14/32 engagement and frozen production source seams.
