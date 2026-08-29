# BE Spec 12d — Informal Events, Listening Rooms, Conference Mode, and Event Relationships

> Source: [IA Shard 12](../ia/12-community-spaces-events.md), interactions SPC-10–SPC-13. This companion owns `informal_event_listing`, `listening_room_scope`, `conference_attendee_grant`, and append-only `space_audit_event`. It does not imply venue endorsement, expose exact private locations before eligibility, record listening-room media by default, or create a relationship without bilateral consent.

## Classification

- Backend-bearing: yes for bounded informal listings, listening-room scopes, and attendee grants. SPC-13 is an ownership handoff adapter only; the canonical relationship is written by Shard 11 after bilateral consent.
- Boundary: this companion owns informal_event_listing, listening_room_scope, conference_attendee_grant, and space_audit_event. It does not persist event_relationships, send contact requests, infer a relationship from proximity, or duplicate Shard 11's social route.
- Split validation: the approved 12d boundary is SPC-10–SPC-13. SPC-10–SPC-12 are local writes; SPC-13 supplies event/grant/consent context to the owning Shard 11 flow and records only local audit of the handoff.
- BE00 inheritance: request IDs, auth/acting context, strict transport, idempotency, transaction/outbox, audit redaction, rate headers, CORS allowlist, and ApiError { code, message, requestId, details }.

## Referenced Material Inventory

| Material | Section / lines | Contract extracted |
|---|---:|---|
| IA Shard 12 | Overview/features and acceptance criteria, lines 8–48 | bounded events, no exact location leak, no proximity relationship |
| IA Shard 12 | Interactions SPC-10–SPC-13, lines 62–65 | listing/room/grant behavior and Shard 11 relationship ownership |
| IA Shard 12 | Contracts, lines 76–112 | event/room/grant/request invariants and typed errors |
| IA Shard 12 | Data Models, lines 113–156 | informal_event_listing, listening_room_scope, conference_attendee_grant, space_audit_event |
| IA Shard 12 | Access Control, lines 157–180 | organizer, participant, attendee, bilateral-consent and privacy scope |
| IA Shard 12 | Event Schemas, lines 190–204 | community.informal-listing.changed.v1, community.event-networking.changed.v1 |
| IA Shard 12 | Edge cases/dependencies, lines 205–263 | location reveal, no recording, lease expiry, and Shard 11 handoff refusal |
| BE00 and architecture/engineering standards | global API/security/data/testing sections | exact envelope, middleware order, RLS, outbox and verification gate |

## IA Source Map

| Interaction | Operation ID | Owned effect | Canonical models/events |
|---|---|---|---|
| SPC-10 | BE12D-10 | publish bounded informal event listing | informal_event_listing, community.informal-listing.changed.v1 |
| SPC-11 | BE12D-11 | create/join/leave/close listening scope | listening_room_scope, community.event-networking.changed.v1 |
| SPC-12 | BE12D-12 | activate/disable attendee grant | conference_attendee_grant, community.event-networking.changed.v1 |
| SPC-13 | BE12D-13 | authorize and hand off bilateral relationship context to Shard 11; append local audit only | space_audit_event, community.event-networking.changed.v1 |

## Endpoint Completeness Reconciliation

### Authoritative Route Registry

| Operation ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO |
|---|---|---|---|---|---|
| BE12D-10 | POST | `/api/v1/community/informal-events` | verified organizer/operator with place/source evidence | key + place/event source digest | 30/day/organizer; no-store; p95 600 ms |
| BE12D-11 | POST | `/api/v1/community/listening-rooms` | eligible participants under room consent policy | key + room/session/media versions | 30/hour/party; no-store; p95 500 ms |
| BE12D-12 | POST | `/api/v1/community/events/{eventId}/conference-grants` | verified attendee activating own grant | key + attendee/event/policy versions | 20/hour/attendee; no-store; p95 500 ms |
| BE12D-13 | POST | `/api/v1/community/events/{eventId}/relationships` | both parties consent or authorized event operator supplies bilateral evidence | key + party/grant/consent digest | 30/hour/party; no-store; p95 600 ms |

SPC-10 publishes a bounded informal jam/open-mic listing only after organizer/place/source confirmation; precise location and contact reveal by eligibility policy. SPC-11 creates a listening scope with explicit membership, media access, presence, chat, recording, expiry, and moderation rules. SPC-12 activates a verified attendee grant only inside the event/geofence/time policy and makes discoverability opt-in. SPC-13 verifies both grants/consents, invokes the owning Shard 11 relationship command with bilateral context, and appends only a local provenance audit; it never writes a local relationship row, and a unilateral contact/follow request is not a relationship.

TLS, ULID IDs, request ID, authenticated party context, strict JSON, and 64 KiB body cap are mandatory. Exact community/event origins receive credentialed CORS; realtime presence workers are non-browser. Preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; private responses are no-store. Public event discovery uses a sanitized projection with coarse place/time and no attendee graph.

## Request/Response Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const JsonValue=z.lazy(()=>z.union([z.string(),z.number(),z.boolean(),z.null(),z.array(JsonValue),z.record(z.string(),JsonValue)]));
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:Id,details:z.record(z.string(),JsonValue)}).strict();
const InformalEventRequest=z.object({
  listingId:Id.optional(),expectedVersion:Ver.optional(),kind:z.enum(['jam','open_mic','workshop','meetup']),
  title:z.string().trim().min(3).max(160),organizerPartyId:Id,placeRef:Id,
  placeSourceVersion:Ver,startsAt:At,endsAt:At,capacity:z.number().int().min(1).max(100_000),
  eligibilityPolicyRef:Id,locationReveal:z.enum(['public_coarse','eligible_only','confirmed_only']),
  accessibilityRefs:z.array(Id).max(20),evidenceRefs:z.array(Id).min(1).max(30)
}).strict().refine(v=>Date.parse(v.startsAt)<Date.parse(v.endsAt),{path:['endsAt'],message:'must follow start'});
const ListeningRoomRequest=z.object({
  roomId:Id.optional(),expectedVersion:Ver.optional(),action:z.enum(['create','join','leave','close']),
  sessionRef:Id,mediaRef:Id,mediaVersion:Ver,participantIds:z.array(Id).max(100),
  accessPolicyRef:Id,recording:z.literal(false),expiresAt:At
}).strict();
const ConferenceGrantRequest=z.object({
  attendeeRecordRef:Id,attendeeRecordVersion:Ver,eventVersion:Ver,networkingPolicyVersion:Ver,
  discoverability:z.enum(['off','mutual_context','attendees']),contactScopes:z.array(z.enum(['profile','message_request','meeting_request'])).max(3),
  activatedAt:At,expiresAt:At
}).strict().refine(v=>Date.parse(v.activatedAt)<Date.parse(v.expiresAt),{path:['expiresAt'],message:'must follow activation'});
const RelationshipRequest=z.object({
  partyAId:Id,partyBId:Id,relationshipType:z.enum(['met_at','collaborated_at','introduced_at']),
  grantARef:Id,grantBRef:Id,consentARef:Id,consentBRef:Id,
  contextRef:Id,evidenceRefs:z.array(Id).min(1).max(20),observedAt:At
}).strict().refine(v=>v.partyAId!==v.partyBId,{path:['partyBId'],message:'parties must differ'});
```

Every request object rejects unknown keys. Success contracts are strict and SPC-13 returns a downstream handoff result rather than a local relationship resource:

~~~ts
const Meta=z.object({requestId:Id,traceId:Id,occurredAt:At}).strict();
const InformalEventSuccess=z.object({data:z.object({listingId:Id,version:Ver,state:z.enum(['draft','confirmed','cancelled','completed']),placeProjectionRef:Id,startsAt:At,endsAt:At}).strict(),meta:Meta}).strict();
const ListeningRoomSuccess=z.object({data:z.object({roomId:Id,version:Ver,state:z.enum(['open','closed','expired']),participantLeaseRef:Id,expiresAt:At,recordingAllowed:z.literal(false)}).strict(),meta:Meta}).strict();
const ConferenceGrantSuccess=z.object({data:z.object({eventId:Id,grantId:Id,version:Ver,state:z.enum(['active','disabled','expired','revoked']),discoverability:z.enum(['off','mutual_context','attendees']),expiresAt:At}).strict(),meta:Meta}).strict();
const RelationshipHandoffSuccess=z.object({data:z.object({handoffId:Id,downstreamOperationId:z.string().trim().min(1).max(128),handoffStatus:z.enum(['accepted','pending','refused']),relationshipRef:Id.nullable(),localAuditEventId:Id,grantContextVersion:Ver}).strict(),meta:Meta}).strict();
~~~

### Operation Contract Matrix

| Operation ID | Request schema | Success schema / status | Error response |
|---|---|---|---|
| BE12D-10 | InformalEventRequest | InformalEventSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| BE12D-11 | ListeningRoomRequest | ListeningRoomSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,410,422,429,503 |
| BE12D-12 | ConferenceGrantRequest | ConferenceGrantSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,410,422,429,503 |
| BE12D-13 | RelationshipRequest | RelationshipHandoffSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503; Shard 11 refusal is returned unchanged |

### Field Validation Matrix

| Operation ID | Required validation |
|---|---|
| BE12D-10 | event kind/title/place source/evidence and start/end/capacity bounds; location reveal is allowlisted; organizer authority and source version are current |
| BE12D-11 | room/session/media/access policy versions; participant scope; explicit recording=false; expiry and join/leave action state |
| BE12D-12 | attendee/event/policy versions; signed event-window/geofence observation; discoverability/contact scopes; activation before expiry |
| BE12D-13 | distinct parties; both active grants and bilateral consent refs; event context/evidence; sorted pair; no relationship persistence in this companion; Shard 11 denial/error is not translated |

Unknown keys, unsafe text, invalid interval/capacity, stale/unverified place/event/attendee, ineligible party, recording request, duplicate active room/listing/grant, expired grant/consent, asymmetric relationship evidence, precise coordinates/contact, and restricted party pair fail before persistence. The server derives event-time/geofence eligibility from signed source observations; clients cannot assert it.

## Database Schema

### Typed Persistence Field, FK, Index, RLS, and Grant Registry

The SQL block is migration shape; this registry is the contract. event_relationships is intentionally absent: Shard 11 owns that canonical model and this companion stores only handoff audit.

| Model | Typed fields, nullability, constraints and FK targets | Required indexes | RLS / grants |
|---|---|---|---|
| informal_event_listings (informal_event_listing) | id text PK NOT NULL ULID; version bigint NOT NULL CHECK >0; tenant_id text NOT NULL FK platform_private.tenant(id); kind text NOT NULL enum; title text NOT NULL length 3..160; organizer_party_id text NOT NULL FK platform_private.party(id); place_ref text NOT NULL opaque source FK place.ref(id); place_source_version bigint NOT NULL CHECK >0; starts_at/ends_at timestamptz NOT NULL ordered; capacity integer NOT NULL CHECK >0; eligibility_policy_ref text NOT NULL FK policy.ref(id); location_reveal text NOT NULL enum; accessibility_refs/evidence_refs jsonb NOT NULL arrays; state text NOT NULL enum; created_at timestamptz NOT NULL | (place_ref,state,starts_at); (organizer_party_id,state); (state,starts_at); unique(place_ref,starts_at,organizer_party_id) | organizer reads/writes own listing via RPC; public gets coarse projection; source worker appends cancellation; anon no base grant |
| listening_room_scopes (listening_room_scope) | id text PK/version pair NOT NULL ULID; version bigint NOT NULL CHECK >0; session_ref text NOT NULL FK session.ref(id); media_ref text NOT NULL FK media.ref(id); media_version bigint NOT NULL CHECK >0; access_policy_ref text NOT NULL FK policy.ref(id); participant_ids jsonb NOT NULL array; recording_allowed boolean NOT NULL CHECK=false; state text NOT NULL enum; expires_at timestamptz NOT NULL; created_by text NOT NULL FK platform_private.party(id); created_at timestamptz NOT NULL | (session_ref,state); (expires_at,state); GIN participant_ids only for worker scope | participants read own room projection; media/token worker writes leases; no durable movement/audio grant; anon no grant |
| conference_attendee_grants (conference_attendee_grant) | id text PK/version pair NOT NULL ULID; version bigint NOT NULL CHECK >0; event_id text NOT NULL FK informal_event_listings(id); party_id text NOT NULL FK platform_private.party(id); attendee_record_ref text NOT NULL FK attendee.ref(id); attendee_record_version bigint NOT NULL CHECK >0; networking_policy_version bigint NOT NULL FK policy.version(id); discoverability text NOT NULL enum; contact_scopes jsonb NOT NULL array; activated_at/expires_at timestamptz NOT NULL ordered; state text NOT NULL enum; created_at timestamptz NOT NULL | unique(event_id,party_id,version); (event_id,state,expires_at); (party_id,state) | attendee owns full row; other attendees see policy-minimized projection; expiry worker appends state; anon no grant |
| space_audit_events (space_audit_event) | id text PK NOT NULL ULID; aggregate_type text NOT NULL enum; aggregate_id text NOT NULL; aggregate_version bigint NOT NULL CHECK >0; actor_id text NOT NULL FK platform_private.party(id); action text NOT NULL closed code; before_hash text NULL length 64; after_hash text NOT NULL length 64; evidence_refs jsonb NOT NULL array; request_id text NOT NULL; occurred_at timestamptz NOT NULL | (aggregate_type,aggregate_id,occurred_at DESC); (request_id) unique | audit custodian append/select; all other roles receive redacted projection; no update/delete; anon no grant |

All durable tables enable and force RLS. authenticated receives only security-definer RPC execution; service_role is limited to source, lease, projection and audit workers. Base table SELECT/INSERT/UPDATE/DELETE is denied to clients. Shard 11 relationship rows and visibility are not mirrored here.

```sql
create table informal_event_listings (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  kind text not null, title text not null, organizer_party_id text not null,
  place_ref text not null, place_source_version bigint not null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  capacity integer not null check(capacity>0), eligibility_policy_ref text not null,
  location_reveal text not null, accessibility_refs jsonb not null, evidence_refs jsonb not null,
  state text not null check(state in ('draft','confirmed','cancelled','completed')),
  created_at timestamptz not null, primary key(id,version), check(starts_at<ends_at)
);
create table listening_room_scopes (
  id text not null, version bigint not null check(version>0), session_ref text not null,
  media_ref text not null, media_version bigint not null, access_policy_ref text not null,
  participant_ids jsonb not null, recording_allowed boolean not null default false check(recording_allowed=false),
  state text not null check(state in ('open','closed','expired')),
  expires_at timestamptz not null, created_by text not null, created_at timestamptz not null,
  primary key(id,version)
);
create table conference_attendee_grants (
  id text not null, version bigint not null check(version>0), event_id text not null,
  party_id text not null, attendee_record_ref text not null, attendee_record_version bigint not null,
  networking_policy_version bigint not null, discoverability text not null,
  contact_scopes jsonb not null, activated_at timestamptz not null, expires_at timestamptz not null,
  state text not null check(state in ('active','disabled','expired','revoked')),
  created_at timestamptz not null, primary key(id,version),
  unique(event_id,party_id,version), check(activated_at<expires_at)
);
create table space_audit_events (
  id text primary key, aggregate_type text not null, aggregate_id text not null,
  aggregate_version bigint not null, actor_id text not null, action text not null,
  before_hash text, after_hash text not null, evidence_refs jsonb not null,
  request_id text not null, occurred_at timestamptz not null
);
```

Presence rows are ephemeral with room/party/lease/last-seen and no durable movement history. Indexes cover listing place/state/time, room state/expiry, grant event/party/state/expiry, and audit aggregate/time. All durable tables enable and force RLS. `anon` has no base grants; authenticated parties use RPCs. Listings project location by eligibility. Room content/presence is participant-only. Conference grants are own/full and other/minimized according to discoverability. Shard 11 owns relationship visibility and persistence; this companion returns only a handoff result plus its local audit event. `space_audit_event` is append-only to audit custodians. Direct client update/delete is denied; realtime workers receive scoped leases.

## Data Flow

SPC-10 verifies organizer/place/source facts, writes the listing and audit, then projects only coarse public location. SPC-11 validates room policy/media and creates participant leases; recording remains false. SPC-12 validates signed event-window/geofence facts and writes an opt-in grant. SPC-13 verifies both grants/consents, sends one idempotent command to Shard 11, and stores only the local handoff audit/outbox entry; no relationship row is persisted here.

## Transactions and State

- SPC-10 locks place/source and organizer authority, appends listing, `space_audit_event`, outbox, and discovery job. Source cancellation/venue withdrawal appends cancelled and removes precise projection deny-first.
- SPC-11 creates/joins/leaves under a room lock and policy/media version. Join appends participant membership and a presence lease; leave revokes it. Close/expiry revokes media/session tokens. Recording is structurally disabled; no audio waveform/content persists.
- SPC-12 locks attendee/event/policy, verifies current event-window observation and explicit activation, appends grant/audit/outbox. Disable is immediate and available to the attendee; expiry/revocation removes networking projection.
- SPC-13 sorts party IDs, locks both current grants/consents, verifies bilateral evidence and event context, calls the owning Shard 11 relationship command with the bilateral context, and appends only `space_audit_event` plus the handoff outbox entry. No local relationship row is written. A Shard 11 refusal is returned unchanged; consent withdrawal stops any pending handoff and keeps local audit history private.

Idempotency binds tenant, actor, operation, aggregate/party pair, and body hash for 72 hours. Same key/different body is `409 IDEMPOTENCY_CONFLICT`; replay returns stored result. Optimistic versions and database time govern expiry.

## Events and External Seams

| Event | Trigger and payload |
|---|---|
| `community.informal-listing.changed.v1` | listing transition: `{listingId,version,kind,state,placeProjectionRef,startsAt,endsAt,changeCode,occurredAt}` |
| `community.event-networking.changed.v1` | grant/relationship transition: `{eventId,grantId,grantVersion,relationshipId,relationshipVersion,state,changeCode,occurredAt}` |

## External Seams

| Seam | Exact request -> response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---:|---|---|
| BE00 identity/acting-context verifier | {accessToken,actingContextId} -> {actorId,partyId,roles,contextVersion} | 300 ms | 2 retries at 50/150 ms before writes | opens after 5 failures in 30 s for 60 s; fail closed with 503 DEPENDENCY_UNAVAILABLE; two successful probes close |
| place/event/attendee source and restriction service | {eventId,placeRef,partyId,sourceVersion,policyVersion} -> {sourceState,windowState,geofenceState,restrictionState,projectionRef} | 2,000 ms | 2 retries at 100/500 ms; idempotent lookups only | opens after 5 failures in 30 s for 60 s; reject new listing/grant while open; expired lease requeues |
| Shard 11 relationship owner | {partyAId,partyBId,grantRefs,consentRefs,eventContext,evidenceRefs} -> {operationId,relationshipRef,state,error:ApiError (nullable)} | 2,000 ms | 2 retries at 100/500 ms using the same handoff key; refusal is never retried as success | opens after 5 failures in 30 s for 60 s; return 503 while open; accepted/refused handoff is replayed from outbox and any refusal body is returned unchanged |
| realtime token/presence service | {roomId,partyId,policyVersion,leaseUntil} -> {tokenRef,leaseRef,expiresAt} | 1,000 ms | no synchronous retry; worker renews at 10 s and retries 1/5/30 s | opens after 3 failures in 30 s for 60 s; close new joins and expire uncertain presence; lease renewal restores only after a fresh policy check |

Transactional outbox, per-aggregate ordering, at-least-once, event-ID dedupe, retry/dead-letter. Events omit precise place, attendee/party identity for general consumers, contact scopes, consent/evidence, presence, media, and audit hashes. Authorized relationship consumer gets opaque party refs only.

Place/event/attendee/identity/restriction/media sources use 2 s, retries 100/500 ms, circuit 5 failures/30 s for 60 s; uncertainty fails closed. Realtime token/presence service uses 1 s and 30-second leases; outage closes new joins and expires uncertain presence. Discovery/network projections retry 1/5/30 s and apply deny-first removal.

## Middleware & Policies

### Per-Operation Middleware Registry

| Operation ID | Middleware chain |
|---|---|
| BE12D-10 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(informalListing:30/day/organizer) -> parseZod(InformalEventRequest) -> authorizePlaceEvidence -> idempotency(72h) -> ifMatch -> transaction |
| BE12D-11 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(listeningRoom:30/hour/party) -> parseZod(ListeningRoomRequest) -> authorizeRoomPolicy -> idempotency(72h) -> ifMatch -> leaseTransaction |
| BE12D-12 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(conferenceGrant:20/hour/attendee) -> parseZod(ConferenceGrantRequest) -> authorizeWindowGeofence -> idempotency(72h) -> ifMatch -> transaction |
| BE12D-13 | requestId -> strictCors(BE12-CORS-COMMUNITY-CREDENTIALLED) -> requireAuth -> resolveActingParty -> rateLimit(relationshipHandoff:30/hour/party) -> parseZod(RelationshipRequest) -> authorizeBilateralGrantConsent -> idempotency(72h) -> ifMatch -> Shard11HandoffTransaction |

### Authorization, Error, Idempotency, Rate, and Observability Matrix

| Operation ID | Roles / ownership; 403 vs 404 | Error/status cases | Idempotency and rate | Observability |
|---|---|---|---|---|
| BE12D-10 | verified organizer/operator; 403 known event/place outside scope; 404 concealed source/listing | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT/IDEMPOTENCY_CONFLICT; 422 SOURCE_OR_ELIGIBILITY_INVALID; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/listing/body hash; 30/day/organizer; replay returns listing | operation/request/listing version, projection state, latency; no exact location/contact |
| BE12D-11 | eligible participant under room policy; 403 known room outside scope; 404 concealed room/media | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT/IDEMPOTENCY_CONFLICT; 410 WINDOW_OR_ROOM_EXPIRED; 422 RECORDING_PROHIBITED; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/room/body hash; 30/hour/party; replay returns lease/result | room state/lease age, policy version, latency; no media/presence history |
| BE12D-12 | verified attendee activating own grant; 403 known event/attendee outside scope; 404 concealed attendee/event | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT/IDEMPOTENCY_CONFLICT; 410 WINDOW_OR_GRANT_EXPIRED; 422 SOURCE_OR_ELIGIBILITY_INVALID; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE | 72 h actor/event/body hash; 20/hour/attendee; replay returns grant | grant state/discoverability/expiry, source attempts, latency; party/contact redacted |
| BE12D-13 | both parties must hold active grants and bilateral consent; 403 known pair missing authority; 404 concealed event/grant context | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT/IDEMPOTENCY_CONFLICT; 422 BILATERAL_CONSENT_REQUIRED; 503 DEPENDENCY_UNAVAILABLE or unchanged Shard 11 ApiError | 72 h sorted-pair/context/body hash; 30/hour/party; accepted/refused handoff replayed | handoff ID/downstream operation/status, audit/outbox latency; no relationship payload |

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod -> place/event/party RLS -> eligibility/restriction/consent -> idempotency/If-Match -> transaction -> minimized response -> audit. Every failure is `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed event/room/grant/relationship |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | organizer/participant/attendee authority absent |
| 404 `NOT_FOUND` | absent/concealed place/event/room/party |
| 409 `VERSION_CONFLICT` | stale aggregate/source |
| 409 `DUPLICATE_OR_CONSENT_CONFLICT` | active duplicate or asymmetric consent |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `WINDOW_OR_GRANT_EXPIRED` | event/room/grant deadline passed |
| 422 `SOURCE_OR_ELIGIBILITY_INVALID` | place/attendee/policy/restriction failed |
| 422 `RECORDING_PROHIBITED` | room recording cannot be enabled |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no location/access/relationship inferred |

Logs contain request/trace/operation IDs, opaque aggregate/role IDs, versions/state/code, participant counts above privacy threshold, latency, lease/dependency/outbox age; exclude precise place, parties, contacts, consent/evidence, media, presence path, and relationship details. Metrics cover confirmed/cancelled listings, room joins/lease expiry, grant activation/disable, relationship consent/withdrawal, projection removal lag, latency/errors/circuits/outbox. Availability 99.9%; p99 writes <1.5 s; deny-first privacy removal <5 s p99. Page on precise-location leak, recording artifact creation, withdrawn relationship projection >30 s, or five-minute 5xx >2%.

## Verification and Test Strategy

| Operation ID | Contract, authorization, persistence, concurrency, and seam tests |
|---|---|
| BE12D-10 | strict listing/time/location schema; source cancellation and organizer/RLS matrix; duplicate/CAS/idempotency race; coarse projection privacy; source breaker recovery; CORS and exact ApiError |
| BE12D-11 | room action state/recording=false; participant authorization and lease expiry; concurrent join/leave/close; media/realtime timeout and recovery; no durable movement/audio; event dedupe |
| BE12D-12 | signed window/geofence and discoverability properties; attendee/RLS/revocation; grant CAS/idempotency; source outage fail-closed; expiry projection and event privacy |
| BE12D-13 | bilateral consent/order and no-proximity property; Shard 11 success/refusal/timeout mapping; no local relationship row; audit/outbox recovery; unchanged ApiError and CORS |

Tests cover schemas/cross-fields, time/capacity/location projection, recording invariant, attendee window/geofence, bilateral consent/order, every role/tenant/revocation/restriction, RLS/field projection, concurrent join/leave/grant/relationship/withdrawal, idempotency races, realtime lease expiry, adapter retries/circuit/recovery, event privacy/order/dedupe, audit append-only, log redaction, migrations/index plans, CORS, accessibility, and alerts. CI fails on uncovered SPC-10–SPC-13, missing four canonical models/two events, route collision, location/presence/contact leak, unilateral relationship, direct write grant, malformed table/link, or unresolved question.

## Ambiguity Gate

- SPC-10–SPC-13, all four canonical models, and both events are fully specified.
- Confirmation, location reveal, no-recording, attendee opt-in, bilateral relationship, audit, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- PASS evidence: BE12D-10–BE12D-13 each have one authoritative route, strict request/success schemas, an exact ApiError row, named CORS/auth/rate/validation middleware, 403/404 rules, idempotency/observability/test rows, typed persistence/FK/index/RLS/grant entries, and exact source/Shard 11 handoff seam recovery. No local event_relationships table or shadow edge remains.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added source inventory, typed success/error matrix, per-operation middleware/test rows, persistence ownership registry, exact seams, and Shard 11 relationship handoff correction. | write-be-spec remediation |

## Dependency References

- [IA Shard 12](../ia/12-community-spaces-events.md)
- Shards 01/04/06/09/10 identity, media, Trust & Safety, projects, and social-relationship contracts.
