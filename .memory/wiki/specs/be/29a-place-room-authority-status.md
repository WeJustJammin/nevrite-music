# Place & Room Authority and Status — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/29-venues-spaces.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. Interactions 29.01–29.04 and 29.10 create governed identities, verify scoped authority, version room topology, preserve lifecycle lineage, propagate effective status, and emit durable events.
- **Boundary:** this companion owns building/physical-volume identity and venue-scoped authority decisions. Shard 01 owns parties, mandates and acting context; Shard 06 owns proof custody/moderation; Shard 29c owns calendars; confirmed-reservation truth is read from Shard 29d.
- **Split validation:** the approved `29a` companion exactly captures place/room identity, authority, lifecycle and status. Specification, accessibility, calendars and reservations remain in `29b`–`29d`.
- **BE00 inheritance:** HTTPS JSON, UUID request IDs, session/acting-context authentication, `BE00-CORS-WEB-CREDENTIALLED`, CSRF, 30-day idempotency floor, common audit/outbox, rate headers, strict response validation, and `ApiError { code, message, requestId, details }`.

## Referenced Material Inventory

| Material | Sections / lines | Locked input used here |
|---|---:|---|
| IA Shard 29 | Overview/scope/decisions, lines 7–38 | Building versus business, physical-volume identity, authority and status rules |
| IA Shard 29 | AC-29.01–AC-29.04 and AC-29.10, lines 51–54, 60 | Exact success/failure and non-destructive history behavior |
| IA Shard 29 | Interactions 29.01–29.04 and 29.10, lines 79–82, 88 | Operation triggers, commits and recovery |
| IA Shard 29 | Commands/boundaries, lines 102–127 | `CreatePlace`, `ClaimPlaceScope`, `UpsertRoomVersion`, `DeclareRoomStatus`; Shard ownership |
| IA Shard 29 | Models/states/invariants/fields, lines 129–193 | `Place`, `Room`, `RoomRelationship`; effective state and core-field registry |
| IA Shard 29 | Access control, lines 194–220 | contributor, claimant, operator, staff, moderator and worker capabilities |
| IA Shard 29 | Event Schemas, lines 233–252 | `venue.place.changed`, `venue.room.changed`, `venue.status.changed` |
| Architecture + Engineering Standards | API/data/security/testing sections | Hono Workers, Supabase PostgreSQL, Zod 4, deny-by-default, TDD |
| BE00 | common wire types, route archetypes, idempotency, audit/outbox, recovery | platform error/CORS/rate/deadline contracts |

## IA Source Map

| IA interaction | Stable operation ID | Owned behavior | Canonical artifacts |
|---|---|---|---|
| 29.01 | `V29_01_RESOLVE_PLACE` | return safe duplicate candidates or create one sourced place without silent merge | `CreatePlace`, `Place`, `venue.place.changed` |
| 29.02 | `V29_02_CLAIM_SCOPE` | verify place/room-scoped proof and record provisional/full capabilities without exposing anchors | `ClaimPlaceScope`, `Place`, `Room` |
| 29.03 | `V29_03_UPSERT_ROOM` | create/version a physical-volume room, operating provenance and authored relationships | `UpsertRoomVersion`, `Room`, `RoomRelationship`, `venue.room.changed` |
| 29.04 | `V29_04_TRANSITION_ROOM` | outage/restore/retire/supersede with preserved lineage and confirmed-booking protection | `Room`, `RoomRelationship`, `venue.room.changed`, `venue.status.changed` |
| 29.10 | `V29_10_DECLARE_STATUS` | effective place/room operating or at-risk status with moderation/corroboration and cascade preview | `DeclareRoomStatus`, `Place`, `Room`, `venue.status.changed` |

## Endpoint Reconciliation and Shared Inheritance

No BE00, identity, Trust & Safety, calendar or reservation endpoint is duplicated. All five routes inherit BE00's **ordinary command** archetype: `no-store`, exact 15,000 ms deadline, current version for mutation, 30-day hash-bound replay, atomic audit/outbox, account plus acting-party rate keys, and session-bound CSRF.

`BE00-CORS-WEB-CREDENTIALLED` admits only exact configured production origins, credentials, registered JSON/idempotency/conditional headers and operation-specific preflight. Wildcard and `null` origins fail.

## API Endpoints

### Umbrella Feature Trace

The IA Shard 29 feature bullets are represented across 29a–29d: 16.01 Place Records & Rooms; 16.02 Venue Technical Specification; 16.03 Studio Technical Specification; 16.04 Rehearsal & Practice Space Specification; 16.05 Curation, Provenance & Data Integrity; 16.06 Space Booking & Reservations; 16.07 Spec Conformance Check (Rider ↔ Room).

### Authoritative Route Registry

This is the sole route registry for this companion; its IDs key every downstream matrix.

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `V29_01_RESOLVE_PLACE` | `POST /api/v1/venues/place-resolutions` | 29.01 | `200 ExistingPlaceResult` or `201 CreatedPlaceResult` | required; 30-day body-hash replay | 20/min/account + acting party |
| `V29_02_CLAIM_SCOPE` | `POST /api/v1/venues/authority-claims` | 29.02 | `202 ClaimPlaceScopeResult` | required through terminal review + 30 days | 5/hour/account + claimant party |
| `V29_03_UPSERT_ROOM` | `POST /api/v1/venues/room-version-actions` | 29.03 | `200/201 UpsertRoomVersionResult` | required; 30-day replay; expected version on update | 30/min/account + operator party |
| `V29_04_TRANSITION_ROOM` | `POST /api/v1/venues/room-lifecycle-actions` | 29.04 | `200 RoomLifecycleResult` | required through effective transition + 30 days | 10/min/account + operator party |
| `V29_10_DECLARE_STATUS` | `POST /api/v1/venues/status-declarations` | 29.10 | `200/202 DeclareRoomStatusResult` | required through moderation/cascade + 30 days | 10/min/account + actor; public risk 5/day |

### Operation Contract Matrix

| Operation ID | Exact request | Exact success | Error contract | Authorization |
|---|---|---|---|---|
| `V29_01_RESOLVE_PLACE` | `CreatePlace` | `ExistingPlaceResult | CreatedPlaceResult` | BE00 `ApiError { code, message, requestId, details }` | contributor or operator; source class capability checked |
| `V29_02_CLAIM_SCOPE` | `ClaimPlaceScope` | `ClaimPlaceScopeResult` | BE00 `ApiError { code, message, requestId, details }` | claimant party equals acting context; proof route eligible for scope |
| `V29_03_UPSERT_ROOM` | `UpsertRoomVersion` | `UpsertRoomVersionResult` | BE00 `ApiError { code, message, requestId, details }` | full/provisional/delegated capability by action and room scope |
| `V29_04_TRANSITION_ROOM` | `RoomLifecycleRequest` | `RoomLifecycleResult` | BE00 `ApiError { code, message, requestId, details }` | full operator or capability-scoped delegate; destructive transition is preview-bound |
| `V29_10_DECLARE_STATUS` | `DeclareRoomStatus` | `DeclareRoomStatusResult` | BE00 `ApiError { code, message, requestId, details }` | operator, qualified evidence worker, or moderator outcome by reason class |

## Zod 4 Contracts

```ts
import { z } from "zod";
const UUID=z.uuid(); const Instant=z.iso.datetime({offset:true}); const Version=z.string().regex(/^[1-9][0-9]{0,18}$/); const RequestId=z.uuid();
const ErrorCode=z.string().min(1).max(64).regex(/^[A-Z][A-Z0-9_]*$/);
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const depth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(depth)):1+Math.max(0,...Object.values(v).map(depth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(depth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();
export const VenueAuthorityError=z.enum(["LOCATION_INVALID","SOURCE_FORBIDDEN","IDEMPOTENCY_CONFLICT","ANCHOR_INELIGIBLE","PROOF_FAILED","CLAIM_CONFLICT","REVIEW_REQUIRED","TYPE_CONFLICT","RELATIONSHIP_CYCLE","LIVE_RESERVATION_CONFLICT","STALE_VERSION","TRANSITION_INVALID","FUTURE_BOOKING_CONFLICT","AUTHORITY_REQUIRED"]);

export const PlaceType=z.enum(["recording_studio","rehearsal_space","performance_venue","broadcast_room","writing_room","education_space","multi_use"]);
export const PlaceState=z.enum(["seeded_unverified","community_unverified","claimed_provisional","claimed_full","dormant"]);
export const OperatingStatus=z.enum(["open","possibly_closed","temporarily_closed","closed"]);
const Location=z.object({countryCode:z.string().regex(/^[A-Z]{2}$/),jurisdictionCode:z.string().min(2).max(32),timeZone:z.string().min(3).max(64),latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),precision:z.enum(["exact","approximate"]),normalizedAddressHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const CreatePlace=z.object({actingPartyId:UUID,location:Location,typeSet:z.array(PlaceType).min(1).max(7),source:z.object({class:z.enum(["community_first_hand","operator","trusted_import"]),sourceRef:UUID.nullable(),observedAt:Instant}).strict(),clientMutationId:z.string().min(8).max(128)}).strict();
export const ExistingPlaceResult=z.object({kind:z.literal("existing_candidates"),candidates:z.array(z.object({placeId:UUID,displayLabel:z.string().min(1).max(180),locationPrecision:z.enum(["exact","approximate"]),typeSet:z.array(PlaceType),matchReason:z.enum(["same_location","nearby_location","same_building_reference"])}).strict()).min(1).max(10),mergePerformed:z.literal(false),requestId:RequestId}).strict();
export const CreatedPlaceResult=z.object({kind:z.literal("created"),placeId:UUID,state:PlaceState,typeSet:z.array(PlaceType).min(1),sourceVersion:Version,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const ClaimPlaceScope=z.object({actingPartyId:UUID,scope:z.discriminatedUnion("kind",[z.object({kind:z.literal("place"),placeId:UUID}).strict(),z.object({kind:z.literal("room"),placeId:UUID,roomId:UUID}).strict()]),proofRoute:z.enum(["verified_domain","payment_account","signed_lease","staff_attestation","manual_review"]),proofToken:z.string().min(16).max(4096),requestedLevel:z.enum(["provisional","full"]),requestedCapabilities:z.array(z.enum(["describe","answer_enquiries","manage_rooms","manage_specs","manage_calendar","manage_rates","manage_reservations","delegate"])).min(1).max(8)}).strict();
export const ClaimPlaceScopeResult=z.object({claimId:UUID,scopeKind:z.enum(["place","room"]),scopeId:UUID,state:z.enum(["provisional","full","review_required","rejected"]),grantedCapabilities:z.array(z.string().min(1).max(64)).max(8),reviewCaseId:UUID.nullable(),anchorDisclosed:z.literal(false),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const RoomType=z.enum(["control_room","live_room","booth","rehearsal_room","stage","hall","classroom","multi_use"]);
const AuthoredRelationship=z.object({kind:z.enum(["requires","part_of","contends"]),targetRoomId:UUID,effectiveFrom:Instant,effectiveUntil:Instant.nullable()}).strict();
export const UpsertRoomVersion=z.object({actingPartyId:UUID,action:z.enum(["create","update"]),placeId:UUID,roomId:UUID,expectedVersion:Version.nullable(),name:z.string().trim().min(1).max(120),physicalVolumeKey:z.string().min(8).max(128),roomType:RoomType,operatingPartyId:UUID,relationships:z.array(AuthoredRelationship).max(50),effectiveAt:Instant}).strict().superRefine((v,c)=>{if((v.action==="update")!==(v.expectedVersion!==null))c.addIssue({code:"custom",path:["expectedVersion"],message:"update_requires_version"});if(v.relationships.some(r=>r.targetRoomId===v.roomId))c.addIssue({code:"custom",path:["relationships"],message:"self_relationship_forbidden"});});
export const UpsertRoomVersionResult=z.object({roomId:UUID,placeId:UUID,state:z.enum(["draft","live","out_of_service","retired","superseded"]),roomType:RoomType,placeTypeAdded:PlaceType.nullable(),relationshipVersion:Version,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const RoomLifecycleRequest=z.object({actingPartyId:UUID,roomId:UUID,operation:z.enum(["outage","restore","retire","supersede"]),effectiveAt:Instant,successorRoomIds:z.array(UUID).max(20),reasonCode:z.enum(["maintenance","refit","subdivision","merge","permanent_closure","operator_decision"]),expectedVersion:Version,confirmedReservationPlan:z.discriminatedUnion("kind",[z.object({kind:z.literal("none")}).strict(),z.object({kind:z.literal("migrate"),previewToken:z.string().min(16).max(256),targetRoomId:UUID}).strict()])}).strict();
export const RoomLifecycleResult=z.object({roomId:UUID,oldState:z.string().min(1).max(32),newState:z.enum(["live","out_of_service","retired","superseded"]),effectiveAt:Instant,successorRoomIds:z.array(UUID).max(20),affectedReservationCount:z.int().nonnegative(),migrationCommitted:z.boolean(),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const DeclareRoomStatus=z.object({actingPartyId:UUID,scope:z.discriminatedUnion("kind",[z.object({kind:z.literal("place"),placeId:UUID}).strict(),z.object({kind:z.literal("room"),roomId:UUID}).strict()]),status:OperatingStatus,reasonCode:z.enum(["verified_operator","qualified_observation","temporary_outage","public_at_risk","moderation_outcome"]),effectiveFrom:Instant,effectiveUntil:Instant.nullable(),evidenceRef:UUID.nullable(),moderationCaseId:UUID.nullable(),expectedVersion:Version,previewToken:z.string().min(16).max(256).nullable()}).strict().superRefine((v,c)=>{if(v.reasonCode==="public_at_risk"&&v.evidenceRef===null)c.addIssue({code:"custom",path:["evidenceRef"],message:"risk_requires_evidence"});});
export const DeclareRoomStatusResult=z.object({scopeKind:z.enum(["place","room"]),scopeId:UUID,oldStatus:OperatingStatus,newStatus:OperatingStatus,state:z.enum(["committed","pending_moderation"]),affectedRoomIds:z.array(UUID).max(500),affectedReservationIds:z.array(UUID).max(500),effectiveFrom:Instant,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();
```

The handler validates wall-clock/effective-interval rules with an injected clock. `excludes` is absent from `AuthoredRelationship`; it is derived only from resource/relationship facts. A place's type set is transactionally extended when a live child room introduces a type and cannot remove a type while any live room uses it. Duplicate candidates never auto-merge.

## Authorization and Disclosure

| Operation ID | Allowed principal | Ownership/capability checks | 403 versus 404 / disclosure |
|---|---|---|---|
| `V29_01_RESOLVE_PLACE` | community contributor, operator, registered import worker | acting party/current source capability; trusted import only for registered producer | hidden/private candidate is omitted; known forbidden source is 403; unsafe location candidate never reveals exact address |
| `V29_02_CLAIM_SCOPE` | authenticated claimant party | acting party matches request; proof route eligible; room belongs to place; claim conflict and current mandate checked | hidden scope is 404; known self lacking proof route is 403; failures never disclose anchor, competing claimant or proof material |
| `V29_03_UPSERT_ROOM` | full operator; provisional claimant/delegate only for granted actions | place/room scope, room type, operating-party mandate and expected version current | foreign room/place is 404; visible scope lacking capability is 403; no membership/anchor detail returned |
| `V29_04_TRANSITION_ROOM` | full operator or explicit lifecycle delegate | room ownership, nonterminal state, preview token and confirmed-reservation plan; no unilateral claim revocation | foreign room 404; visible but unauthorized transition 403; affected client identity never returned |
| `V29_10_DECLARE_STATUS` | full operator, qualified evidence worker, moderator outcome worker | reason-specific authority; public risk requires corroborated evidence/moderation; preview for confirmed bookings | hidden scope 404; known actor lacking reason authority 403; public output contains status/effective time, not claimant/evidence/private reservations |

Public visitors read only separately shaped publishable projections. Provisional claimants cannot instant-enable booking, payouts, destructive lifecycle or delegation. Support gets an expiring purpose grant for mechanical recovery only; moderators cannot change rates/reservations, and no role bypasses identity, counsel, evidence or privacy gates.

## Database Schema

All tables live in `venue_private`; public views contain approximate location and publishable status only. `owner_id` is the governing acting party/source aggregate, but capability and scope columns—not ownership alone—drive RLS.

```sql
CREATE TABLE venue_private.place (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('seeded_unverified','community_unverified','claimed_provisional','claimed_full','dormant')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 normalized_location_ciphertext bytea NOT NULL CHECK(octet_length(normalized_location_ciphertext) BETWEEN 1 AND 8192), normalized_location_hash text NOT NULL CHECK(normalized_location_hash ~ '^[a-f0-9]{64}$'), location_precision text NOT NULL CHECK(location_precision IN ('exact','approximate')),
 country_code char(2) NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'), jurisdiction_code text NOT NULL CHECK(length(jurisdiction_code) BETWEEN 2 AND 32), timezone text NOT NULL CHECK(length(timezone) BETWEEN 3 AND 64), type_set text[] NOT NULL CHECK(cardinality(type_set) BETWEEN 1 AND 7),
 operating_status text NOT NULL CHECK(operating_status IN ('open','possibly_closed','temporarily_closed','closed')), status_reason_code text NOT NULL, status_effective_from timestamptz NOT NULL, status_effective_until timestamptz NULL,
 claim_party_id uuid NULL, claim_state text NULL CHECK(claim_state IN ('provisional','full','review_required','rejected')), claim_capabilities text[] NOT NULL DEFAULT '{}', claim_proof_ref uuid NULL, jurisdiction_profile_version bigint NOT NULL CHECK(jurisdiction_profile_version>0), source_class text NOT NULL CHECK(source_class IN ('community_first_hand','operator','trusted_import')), source_ref uuid NULL,
 deleted_at timestamptz NULL, CHECK(status_effective_until IS NULL OR status_effective_until>status_effective_from), CHECK((claim_party_id IS NULL)=(claim_state IS NULL))
);
CREATE UNIQUE INDEX place_location_live_uq ON venue_private.place(normalized_location_hash) WHERE deleted_at IS NULL;
CREATE INDEX place_owner_state_idx ON venue_private.place(owner_id,state,updated_at DESC);
CREATE INDEX place_status_idx ON venue_private.place(operating_status,status_effective_from DESC) WHERE deleted_at IS NULL;
CREATE INDEX place_claim_idx ON venue_private.place(claim_party_id,claim_state) WHERE claim_party_id IS NOT NULL;
```

Rooms remain one physical-volume identity across rename/refit; subdivision/merge uses successor lineage.

```sql
CREATE TABLE venue_private.room (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('draft','live','out_of_service','retired','superseded')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 place_id uuid NOT NULL REFERENCES venue_private.place(id) ON DELETE RESTRICT, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120), physical_volume_key text NOT NULL CHECK(length(physical_volume_key) BETWEEN 8 AND 128), room_type text NOT NULL CHECK(room_type IN ('control_room','live_room','booth','rehearsal_room','stage','hall','classroom','multi_use')),
 operating_party_id uuid NOT NULL, authority_state text NOT NULL CHECK(authority_state IN ('provisional','full','delegated')), authority_provenance_ref uuid NOT NULL, status text NOT NULL CHECK(status IN ('open','possibly_closed','temporarily_closed','closed')), status_reason_code text NOT NULL,
 status_effective_from timestamptz NOT NULL, status_effective_until timestamptz NULL, effective_from timestamptz NOT NULL, effective_until timestamptz NULL, successor_room_ids uuid[] NOT NULL DEFAULT '{}', deleted_at timestamptz NULL,
 CHECK(owner_id=operating_party_id), CHECK(status_effective_until IS NULL OR status_effective_until>status_effective_from), CHECK(effective_until IS NULL OR effective_until>effective_from), UNIQUE(place_id,physical_volume_key)
);
CREATE INDEX room_place_state_idx ON venue_private.room(place_id,state,updated_at DESC);
CREATE INDEX room_operator_idx ON venue_private.room(operating_party_id,state,updated_at DESC);
CREATE INDEX room_status_idx ON venue_private.room(status,status_effective_from DESC) WHERE state NOT IN ('retired','superseded');
CREATE INDEX room_successors_gin_idx ON venue_private.room USING gin(successor_room_ids);
```

Relationships are effective-dated; `excludes` rows may only be inserted by the derivation worker.

```sql
CREATE TABLE venue_private.room_relationship (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','inactive')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 source_room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, target_room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, kind text NOT NULL CHECK(kind IN ('requires','excludes','part_of','contends')), authored boolean NOT NULL,
 provenance_ref uuid NOT NULL, effective_from timestamptz NOT NULL, effective_until timestamptz NULL, derived_rule_version bigint NULL CHECK(derived_rule_version>0), CHECK(source_room_id<>target_room_id),
 CHECK(effective_until IS NULL OR effective_until>effective_from), CHECK((kind='excludes')=(NOT authored)), CHECK((kind='excludes')=(derived_rule_version IS NOT NULL)), UNIQUE(source_room_id,target_room_id,kind,effective_from)
);
CREATE INDEX room_relationship_source_idx ON venue_private.room_relationship(source_room_id,kind,effective_from DESC) WHERE state='active';
CREATE INDEX room_relationship_target_idx ON venue_private.room_relationship(target_room_id,kind,effective_from DESC) WHERE state='active';
CREATE INDEX room_relationship_effective_idx ON venue_private.room_relationship(effective_from,effective_until) WHERE state='active';
```

### References, RLS, Grants, and Retention

| Table | FK/logical reference enforcement | RLS and grants | Retention/deletion |
|---|---|---|---|
| `Place` → `venue_private.place` | party/claim/proof/source/jurisdiction IDs are versioned logical refs to Shards 01/06/config; location hash uniqueness yields candidates, never merge | contributor create RPC; scoped claimant/operator shaped SELECT/UPDATE; public approximate view; geocoder/import service narrow INSERT; no direct client DML | no hard delete after any room/reservation/event reference; otherwise 30-day encrypted recovery then key destruction; status/audit 7 years |
| `Room` → `venue_private.room` | physical FK to `place`; operating/authority IDs logical to Shard 01; successor IDs validated as same-place or approved merge lineage; reservation conflict reconciled | scoped operator/delegate functions; public publishable view; lifecycle/calendar workers named columns only; no `anon/authenticated` table grant | terminal room/history retained indefinitely while referenced; private optional fields erased under lawful request |
| `RoomRelationship` → `venue_private.room_relationship` | physical room FKs; cycle trigger for `requires/part_of`; derivation capability required for `excludes`; provenance logical to source rule/evidence | endpoint-scope operator read/write for authored kinds; derivation worker INSERT/UPDATE derived kind; public projection safe relationships only | inactive history 7 years; never cascade-delete rooms/evidence |

Every table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. Definer RPCs pin `search_path`, assert BE00 acting party/mandate/purpose/version, keep `row_security=on`, revoke `PUBLIC`, and expose exact columns. Migration role owns; no browser role can select claim proofs, exact location, private reservation references or evidence.

## State, Middleware, Concurrency, and Flow

| Aggregate | Legal state machine and guard |
|---|---|
| Place | `seeded_unverified|community_unverified → claimed_provisional → claimed_full → dormant`; status independently `open|possibly_closed|temporarily_closed|closed`; dormant may not silently erase history |
| Room | `draft → live ↔ out_of_service`; `retired|superseded` terminal for new reservations; restore only from outage; successors mandatory for split/merge |
| Relationship | absent → active → inactive; directional `requires/part_of` insert/update rejected on cycle; derived `excludes` not authored |
| Claim | absent → provisional/full/review_required/rejected; review outcome may promote/reject; revocation is adjudicated, not unilateral delete |

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation/idempotency/rate |
|---|---|---|
| `V29_01_RESOLVE_PLACE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/acting context → strict body/source/location validation → contribution capability → idempotency → 20/min/account+party → serializable resolution transaction/outbox → response validation | required key bound to actor/method/path/body for 30 days; normalized hash advisory lock; existing candidate returns stored safe result |
| `V29_02_CLAIM_SCOPE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict scope/proof validation → claimant/scope authorization → idempotency → 5/hour/account+claimant → proof/review transaction/outbox → response validation | proof token never logged/idempotency-stored; keyed digest only; binding retained through terminal review+30 days |
| `V29_03_UPSERT_ROOM` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict action/relationship validation → scope capability → idempotency → 30/min/account+operator → serializable room/type/graph transaction/outbox → response validation | create unique volume; update CAS expected version; same key replay; different hash `IDEMPOTENCY_CONFLICT` |
| `V29_04_TRANSITION_ROOM` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict lifecycle body → scope/preview/reservation authorization → idempotency → 10/min/account+operator → serializable transition/lineage/cascade transaction → response validation | key retained through effective transition+30 days; preview token bound to room/version/reservation snapshot |
| `V29_10_DECLARE_STATUS` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict status/evidence body → reason authority/moderation → idempotency → 10/min/account+operator and public-risk 5/day/actor → serializable status/cascade transaction/outbox → response validation | key retained through moderation/cascade+30 days; preview bound to affected reservations; pending moderation is durable 202 |

Every row names `BE00-CORS-WEB-CREDENTIALLED` explicitly and inherits the stated ordinary-command deadline and BE00 error envelope.

### Operation Flows and Recovery

| Operation ID | Transaction/concurrency algorithm | Failure recovery / prohibited result |
|---|---|---|
| `V29_01_RESOLVE_PLACE` | normalize/geocode; lock location hash; query safe candidates; either return candidates or insert place+source+audit+outbox+idempotency atomically | duplicate race returns candidate/unique conflict recovery; no auto merge; geocoder failure creates nothing; exact address stays private |
| `V29_02_CLAIM_SCOPE` | verify scope and proof eligibility; call proof service with one-time token; lock scope; reject competing terminal claim or record review state/capabilities | provider ambiguity becomes `review_required`, never full authority; failed proof stores digest/outcome only and reveals no anchor/claimant |
| `V29_03_UPSERT_ROOM` | lock place then room then sorted relationship endpoints; validate graph acyclic; CAS; extend place type set; insert relationship successors and events | any relation/type/authority failure rolls back room/type/graph; removal of live-room type blocked; `excludes` never accepted from request |
| `V29_04_TRANSITION_ROOM` | lock room and sorted future reservations; compare preview snapshot; apply outage/restore or terminal lineage; close availability from effective time; emit room/status changes | confirmed reservation without exact migration plan returns conflict; partial successor/migration impossible; stale preview/version returns current safe state |
| `V29_10_DECLARE_STATUS` | resolve reason authority/evidence; public risk enters moderation unless qualified outcome; lock scope and affected rooms/reservations; validate preview; commit effective status/cascade/outbox | moderation outage preserves pending case; status failure leaves calendars unchanged; no reservation identity in public event/projection; worker retries cascade by aggregate version |

### External Seams

| Seam | Exact request → response | Timeout, retry/backoff, circuit behavior |
|---|---|---|
| Shard 01 authority | `{accountId,actingPartyId,scopeType,scopeId,capability,contextVersion}` → `{allowed,partyVersion,mandateVersion,reasonCode}` | 250 ms; 1 retry after 25 ms; opens after 15 failures/30 s for 30 s; open circuit fails closed before lookup/mutation |
| location/jurisdiction resolver | `{countryCode,lat,lng,addressHash,precision}` → `{normalizedHash,jurisdictionCode,timeZone,candidateRefs,resolverVersion}` | 800 ms; 2 retries after 100/300 ms; opens after 8 failures/60 s for 60 s; no place created, retry same key |
| Shard 06 proof/moderation | `{claimOrStatusId,route,evidenceRefOrTokenDigest,scope,policyVersion}` → `{outcome,caseId?,safeReason,policyVersion}` | 1,500 ms; 2 retries after 150/450 ms; opens after 6 failures/60 s for 60 s; claim/status remains review-required/pending, never full/public |
| calendar/reservation conflict preview | `{roomIds,effectiveAt,transition,reservationSnapshotVersion}` → `{confirmedRefs,opaqueAffectedIds,previewToken,snapshotVersion}` | 600 ms; 1 retry after 75 ms; opens after 10 failures/30 s for 30 s; destructive transition fails closed without partial cascade |
| outbox dispatcher | `{eventId,eventType,aggregateRef,aggregateVersion,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries after 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; committed truth remains in durable outbox for later drain |

## Event Contracts

```ts
const VenueEventBase=z.object({event_id:UUID,event_type:z.string().min(1).max(96),schema_version:z.literal("1"),occurred_at:Instant,actor_ref:UUID.nullable(),acting_party_ref:UUID.nullable(),aggregate_ref:UUID,aggregate_version:Version,correlation_id:UUID,causation_id:UUID.nullable(),idempotency_key:z.string().min(8).max(128),payload:JsonValueSchema}).strict();
export const VenuePlaceChanged=VenueEventBase.extend({event_type:z.literal("venue.place.changed"),payload:z.object({placeId:UUID,changedFields:z.array(z.string().min(1).max(64)).min(1).max(20),sourceClass:z.enum(["community_first_hand","operator","trusted_import"]),effectiveAt:Instant}).strict()}).strict();
export const VenueRoomChanged=VenueEventBase.extend({event_type:z.literal("venue.room.changed"),payload:z.object({roomId:UUID,placeId:UUID,state:z.enum(["draft","live","out_of_service","retired","superseded"]),roomType:RoomType,relationshipDeltaIds:z.array(UUID).max(100),effectiveAt:Instant}).strict()}).strict();
export const VenueStatusChanged=VenueEventBase.extend({event_type:z.literal("venue.status.changed"),payload:z.object({scopeKind:z.enum(["place","room"]),scopeId:UUID,oldStatus:OperatingStatus,newStatus:OperatingStatus,reasonCode:z.string().min(1).max(64),affectedReservationRefs:z.array(UUID).max(500),effectiveAt:Instant}).strict()}).strict();
```

Outbox insert is atomic with state. Consumers deduplicate `event_id`, order by `(aggregate_ref, aggregate_version)`, ignore older versions and reauthorize before display. Payloads contain references only—never exact location, proof anchors, evidence, client identity or reservation details.

## Errors, Recovery, and Observability

BE00 transport failures (`INVALID_REQUEST`, media/size errors), authentication and dependency errors apply before these domain outcomes. All bodies use the exact four-field envelope above.

| Operation ID | HTTP/status and domain code | Safe trigger/recovery |
|---|---|---|
| `V29_01_RESOLVE_PLACE` | 422 `LOCATION_INVALID`/`SOURCE_FORBIDDEN`; 409 `IDEMPOTENCY_CONFLICT`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | correct normalized location/source; replay exact hash; candidates remain separate |
| `V29_02_CLAIM_SCOPE` | 422 `ANCHOR_INELIGIBLE`/`PROOF_FAILED`/`REVIEW_REQUIRED`; 409 `CLAIM_CONFLICT`/`IDEMPOTENCY_CONFLICT`; 404 `NOT_FOUND`; 429; 503 | safe reason only; review route/case ID for claimant; no anchor or competitor disclosure |
| `V29_03_UPSERT_ROOM` | 422 `TYPE_CONFLICT`/`RELATIONSHIP_CYCLE`; 409 `LIVE_RESERVATION_CONFLICT`/`STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403 `FORBIDDEN`; 404; 429; 503 | refresh room/place/graph; correct relationships; transaction rolled back |
| `V29_04_TRANSITION_ROOM` | 422 `TRANSITION_INVALID`; 409 `FUTURE_BOOKING_CONFLICT`/`STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403 `AUTHORITY_REQUIRED`; 404; 429; 503 | refresh preview/version or provide complete migration; no partial lineage/calendar effect |
| `V29_10_DECLARE_STATUS` | 422 `TRANSITION_INVALID`/`REVIEW_REQUIRED`; 409 `FUTURE_BOOKING_CONFLICT`/`STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403 `AUTHORITY_REQUIRED`; 404; 429; 503 | submit qualified evidence/moderation or refresh preview; current status remains |

| Operation ID | Safe logs/traces | Metrics/SLO and alert |
|---|---|---|
| `V29_01_RESOLVE_PLACE` | operation/request IDs, actor/place hashes, source class, candidate count, result kind, resolver version, replay; no address | count/latency/candidate/duplicate/replay; p95 <1.2 s; alert duplicate-race >2%/15 min |
| `V29_02_CLAIM_SCOPE` | actor/scope/claim IDs, proof route, safe outcome, case/version, replay; no token/anchor | claim outcomes/provider latency/review age; p95 acceptance <2 s; page full grant without verified outcome |
| `V29_03_UPSERT_ROOM` | actor/place/room IDs, action/type/state, relation counts/versions, replay | mutations/conflicts/cycle/latency; p95 <1.5 s; page type-superset invariant failure |
| `V29_04_TRANSITION_ROOM` | actor/room IDs, operation/states, opaque affected count, preview/version, replay | transitions/conflicts/migration lag; p95 <2 s; page terminal room accepting new reservation |
| `V29_10_DECLARE_STATUS` | actor/scope IDs, reason/status/state, affected counts, case/version, replay; no evidence/client data | status/pending/cascade lag; p95 <2 s; page public risk without moderation/corroboration |

Audit rows contain actor/context/action/scope, before/after hashes, reason/evidence/policy versions, preview/idempotency/request hashes and result. provider-native diagnostic sinks receive opaque IDs and safe codes only; request bodies, exact location, proof tokens, evidence and affected reservation identities are scrubbed.

## Release and Testing

### Per-operation Tests

| Operation ID | Contract/authorization tests | Idempotency/concurrency/failure/observability tests |
|---|---|---|
| `V29_01_RESOLVE_PLACE` | strict location/source/type schema; contributor/import capability; exact location concealed; safe candidates; no auto-merge | same key replay; hash mismatch; duplicate race yields separate candidate; resolver circuit no write; CORS/CSRF/rate/ApiError/log redaction |
| `V29_02_CLAIM_SCOPE` | scope/room membership; route eligibility; owner context; provisional/full capabilities; foreign 404; anchor nondisclosure | competing claims serialize; proof ambiguity review-only; provider timeout no authority; terminal replay; case/outbox/audit/metrics |
| `V29_03_UPSERT_ROOM` | create/update version; place type auto-extension; authored `excludes` rejected; cycle/foreign scope; capability matrix | CAS and volume-key race one winner; relationship failure rolls all back; event order/dedup; CORS/rate/error/trace |
| `V29_04_TRANSITION_ROOM` | legal state transitions; successors/lineage; confirmed reservation migration; delegate scope; history retained | stale preview/version; all-or-none migration; conflict seam outage; replay; calendar-close event; no client identity logs |
| `V29_10_DECLARE_STATUS` | reason authority; intervals; risk evidence/moderation; place/room cascade preview; public safe projection | competing status CAS; pending moderation recovery; cascade retry; no partial status/calendar; rate/alert/audit/provider-native diagnostics scrub |

Additional suites: Zod/OpenAPI/event snapshots; SQL checks/FKs/cycle trigger/index plans; RLS matrix for public/contributor/provisional/full/delegate/moderator/worker/foreign; location privacy differential tests; property tests for place-type superset and graph acyclicity; effective-time/DST tests; outbox version/dedup; circuit chaos; migration rollback and no-hard-delete checks.

Release requires compatible OpenAPI diff, expand/contract migration rehearsal, RLS/grant verification, duplicate shadow resolution, claim-provider/moderation and reservation-preview circuit drills, invariant queries, redaction scan, dashboards/alerts and rollback proof. Rollback disables writes/workers and drains outbox while retaining identity, claim, lineage and effective status truth.

## Deepening Passes

1. **Traceability:** all five IA IDs, four assigned commands, three canonical models and three events map to authoritative operations and persistence.
2. **Contracts/security:** strict Zod, exact BE00 errors/CORS/archetype, acting-party capability, 403/404 and nondisclosure are explicit per operation.
3. **Data:** every field has SQL type/nullability/check, reference handling, indexes, RLS/grants and retention; place type/relationship/lineage constraints are closed.
4. **Reliability:** CAS, advisory/serializable locks, preview tokens, idempotency, atomic outbox, exact seam resilience and recovery prevent partial state.
5. **Operations/tests:** logs/metrics/alerts, privacy scrub, per-op tests, migrations, circuit drills and rollback are complete.

## Ambiguity Gate

**PASS.** Macro building/room identity, authority ownership, lifecycle/history, status moderation and cross-shard boundaries are locked. Micro routes, operation IDs, request/success/errors, enums/bounds, CORS/archetypes/deadlines, rates, idempotency, SQL fields/constraints/FKs/indexes/RLS/grants, states, locks, seams, telemetry, tests and rollback are exact. No unresolved or unspecified implementation choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-29 | Initial production backend contract for Shard 29a after approved split validation. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 29 — Venues, Studios and Spaces](../ia/29-venues-spaces.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Shard 01 Identity & Authority](../ia/01-identity-authority.md)
- [Shard 06 Trust & Safety](../ia/06-trust-safety.md)
