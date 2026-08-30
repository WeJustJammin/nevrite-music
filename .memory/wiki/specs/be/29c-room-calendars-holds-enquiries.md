# Room Calendars, Holds & Enquiries — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/29-venues-spaces.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. Interactions 29.11–29.14 and 29.19 version room calendars, ingest uncertain external busy state, arbitrate expiring multi-resource holds, durably route room-hire enquiries, and run bounded waitlist offers.
- **Boundary:** this companion owns `Calendar`, `ResourceHold` and `WaitlistEntry` truth. Shard 29a owns room identity/authority, Shard 24 owns asset/person resource identity and condition, Shard 29d owns quotes/reservations, and the enquiry delivery seam owns its routed conversation record.
- **Split validation:** the approved `29c` companion exactly captures calendar, external mirror, hold, enquiry and waitlist behavior. It neither prices nor commits a reservation and does not duplicate provider, identity or notification infrastructure.
- **BE00 inheritance:** HTTPS JSON, UUID request IDs, strict Zod 4/OpenAPI response validation, named CORS, authentication/acting context, CSRF where applicable, 30-day hash-bound idempotency, common audit/outbox, rate headers, deadlines and `ApiError { code, message, requestId, details }`.

## Referenced Material Inventory

| Material | Sections / lines | Locked input used here |
|---|---:|---|
| IA Shard 29 | Overview/scope/decisions, lines 7–38 | resource-aware availability, unknown-state posture, external-calendar uncertainty and versioned settings |
| IA Shard 29 | AC-29.11–AC-29.14 and AC-29.19, lines 61–64, 69 | exact availability, mirror, hold, enquiry and waitlist outcomes |
| IA Shard 29 | Interactions 29.11–29.14 and 29.19, lines 89–92, 97 | triggers, preconditions, commits and failure behavior |
| IA Shard 29 | Commands/boundaries, lines 102–127 | `ConfigureCalendar`, `RecordExternalBusyDelta`, `PlaceResourceHold` and ownership seams |
| IA Shard 29 | Models/states/invariants/fields, lines 129–193 | `Calendar`, `ResourceHold`, `WaitlistEntry`, mirror/hold states, DST and privacy invariants |
| IA Shard 29 | Access control, lines 194–220 | requester, operator/delegate, provider worker and public disclosure rules |
| IA Shard 29 | Event Schemas, lines 233–252 | `venue.calendar.sync_state_changed`, `venue.hold.changed`, `venue.waitlist.offer_changed` |
| Architecture + Engineering Standards | API/data/security/testing sections | Hono Workers, Supabase PostgreSQL, Zod 4, deny-by-default, TDD and observability |
| BE00 | common wire types, route archetypes, CORS, idempotency, audit/outbox, recovery | platform contracts inherited rather than duplicated |

## IA Source Map

| IA interaction | Stable operation ID | Owned behavior | Canonical artifacts |
|---|---|---|---|
| 29.11 | `V29_11_CONFIGURE_CALENDAR` | atomically version native windows, exceptions, buffers, use posture and explicit provider mappings | `ConfigureCalendar`, `Calendar` |
| 29.12 | `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | authenticate a provider delta, deduplicate provider version and degrade mirror freshness safely | `RecordExternalBusyDelta`, `Calendar`, `venue.calendar.sync_state_changed` |
| 29.13 | `V29_13_PLACE_OR_CHALLENGE_HOLD` | place or challenge one ranked, hard-expiring claim over the complete resource set | `PlaceResourceHold`, `ResourceHold`, `venue.hold.changed` |
| 29.14 | `V29_14_REQUEST_ENQUIRY` | route an eligible room-hire enquiry with explicit lapse and organization fallback | routed enquiry handoff; no duplicate reservation model |
| 29.19 | `V29_19_WAITLIST_ACTION` | join demand or accept/decline a bounded sequential offer under a notification budget | `WaitlistEntry`, `venue.waitlist.offer_changed` |

## Endpoint Reconciliation and Shared Inheritance

The registry below adds only Shard 29 command surfaces. Provider connections/signatures, party mandates, resource identities, notifications, idempotency rows and event delivery remain at their owning seams. `V29_12_RECORD_EXTERNAL_BUSY_DELTA` is a machine endpoint with `BE00-CORS-DENY`, signed connector authentication and BE00's **async acceptance** 2,000 ms deadline. The four browser commands use `BE00-CORS-WEB-CREDENTIALLED` and the **ordinary command** 15,000 ms deadline. Every mutation is `no-store`, validates the current aggregate version where applicable, and stores an exact response replay for at least 30 days.

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion; its IDs key every contract, authorization, middleware, flow, error, observability and test row.

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | `PUT /api/v1/venues/rooms/:roomId/calendars` | 29.11 | `200 ConfigureCalendarResult` | required; room/version/body hash; 30 days | 20/min/account + acting party + room |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | `POST /api/v1/internal/venues/external-calendar-deltas` | 29.12 | `202 RecordExternalBusyDeltaResult` | connector/provider event+version; 90 days | 600/min/connector; burst 100 |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | `POST /api/v1/venues/resource-hold-actions` | 29.13 | `200/201 ResourceHoldResult` | required through terminal hold + 30 days | 30/min/account + requester; 10 active/requester |
| `V29_14_REQUEST_ENQUIRY` | `POST /api/v1/venues/room-hire-enquiries` | 29.14 | `202 RoomHireEnquiryResult` | required through lapse + 30 days | 10/hour/account + requester + room |
| `V29_19_WAITLIST_ACTION` | `POST /api/v1/venues/waitlist-actions` | 29.19 | `200/201 WaitlistActionResult` | required through entry/offer terminal + 30 days | 20/min/account + requester; join 10/day/room |

### Operation Contract Matrix

| Operation ID | Exact request | Exact success | Error contract | Authorization |
|---|---|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | `ConfigureCalendar` plus path `roomId` equality | `ConfigureCalendarResult` | BE00 `ApiError { code, message, requestId, details }` | full operator or `manage_calendar` delegate for the room |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | `RecordExternalBusyDelta` | `RecordExternalBusyDeltaResult` | BE00 `ApiError { code, message, requestId, details }` | registered connector signature and exact connector/room mapping |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | `ResourceHoldAction = PlaceResourceHold | ChallengeResourceHold` | `ResourceHoldResult` | BE00 `ApiError { code, message, requestId, details }` | eligible requester; challenge capability and same slot/resource scope |
| `V29_14_REQUEST_ENQUIRY` | `RequestRoomHireEnquiry` | `RoomHireEnquiryResult` | BE00 `ApiError { code, message, requestId, details }` | authenticated eligible requester under room use posture |
| `V29_19_WAITLIST_ACTION` | `WaitlistActionRequest` | `WaitlistActionResult` | BE00 `ApiError { code, message, requestId, details }` | entry owner; offer token required for accept/decline |

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
export const CalendarHoldError=z.enum(["WINDOW_INVALID","MAPPING_AMBIGUOUS","STALE_VERSION","CONNECTOR_REVOKED","MAPPING_UNKNOWN","EVENT_REPLAYED","RESOURCE_UNAVAILABLE","HOLD_LIMIT","CALENDAR_UNCERTAIN","RANK_INSUFFICIENT","HOLD_EXPIRED","POSTURE_BLOCKED","ASSIGNEE_UNAVAILABLE","ENQUIRY_LAPSED","WAITLIST_INELIGIBLE","OFFER_EXPIRED","OFFER_TOKEN_INVALID","IDEMPOTENCY_CONFLICT"]);

export const UseType=z.enum(["recording","rehearsal","room_hire","education","broadcast","private_event","performance"]);
export const ZonedInterval=z.object({startsAt:Instant,endsAt:Instant,timeZone:z.string().min(3).max(64),utcOffsetMinutes:z.int().min(-840).max(840)}).strict().superRefine((v,c)=>{if(Date.parse(v.endsAt)<=Date.parse(v.startsAt))c.addIssue({code:"custom",path:["endsAt"],message:"end_must_follow_start"});});
const Posture=z.object({useType:UseType,mode:z.enum(["instant_book","enquiry_only","blocked"]),minimumNoticeMinutes:z.int().min(0).max(525600),maximumHorizonDays:z.int().min(1).max(1095)}).strict();
const ProviderMapping=z.object({connectorId:UUID,providerCalendarRef:z.string().min(1).max(256),mappingId:UUID,enabled:z.boolean(),freshnessTtlSeconds:z.int().min(60).max(604800)}).strict();
export const ConfigureCalendar=z.object({actingPartyId:UUID,roomId:UUID,expectedVersion:Version,timeZone:z.string().min(3).max(64),postureByUse:z.array(Posture).min(1).max(7),nativeWindows:z.array(ZonedInterval).max(366),exceptionBlocks:z.array(ZonedInterval).max(366),setupBufferMinutes:z.int().min(0).max(1440),teardownBufferMinutes:z.int().min(0).max(1440),providerMappings:z.array(ProviderMapping).max(20),resourceGraphVersion:Version}).strict();
export const ConfigureCalendarResult=z.object({calendarId:UUID,roomId:UUID,version:Version,mirrorState:z.enum(["healthy","delayed","stale","disconnected"]),instantBookEnabled:z.boolean(),normalizedWindowCount:z.int().nonnegative(),replayed:z.boolean(),requestId:RequestId}).strict();

const BusyDelta=z.object({providerBusyRefHash:z.string().regex(/^[a-f0-9]{64}$/),operation:z.enum(["upsert","delete"]),interval:ZonedInterval.nullable()}).strict().superRefine((v,c)=>{if((v.operation==="upsert")!==(v.interval!==null))c.addIssue({code:"custom",path:["interval"],message:"upsert_requires_interval"});});
export const RecordExternalBusyDelta=z.object({connectorId:UUID,mappingId:UUID,providerEventId:z.string().min(1).max(256),providerVersion:z.string().min(1).max(128),occurredAt:Instant,deltas:z.array(BusyDelta).min(1).max(500),deliveryId:UUID}).strict();
export const RecordExternalBusyDeltaResult=z.object({calendarId:UUID,mappingId:UUID,accepted:z.boolean(),duplicate:z.boolean(),syncWatermark:z.string().min(1).max(256),mirrorState:z.enum(["healthy","delayed","stale","disconnected"]),lastSuccessAt:Instant,version:Version,requestId:RequestId}).strict();

const HoldResource=z.object({kind:z.enum(["room","person","asset"]),resourceId:UUID,quantity:z.number().positive().max(100000).nullable()}).strict();
const RankBasis=z.object({class:z.enum(["confirmed_dependency","checkout","waitlist_offer","operator_hold","enquiry"]),priority:z.int().min(0).max(1000),requestedAt:Instant,policyVersion:Version}).strict();
export const PlaceResourceHold=z.object({action:z.literal("place"),actingPartyId:UUID,requesterPartyId:UUID,resources:z.array(HoldResource).min(1).max(100),slot:ZonedInterval,rankBasis:RankBasis,expectedCalendarVersions:z.record(UUID,Version),ttlSeconds:z.int().min(30).max(1800),clientMutationId:z.string().min(8).max(128)}).strict();
export const ChallengeResourceHold=z.object({action:z.literal("challenge"),actingPartyId:UUID,requesterPartyId:UUID,targetHoldId:UUID,resources:z.array(HoldResource).min(1).max(100),slot:ZonedInterval,rankBasis:RankBasis,expectedTargetVersion:Version,clientMutationId:z.string().min(8).max(128)}).strict();
export const ResourceHoldAction=z.discriminatedUnion("action",[PlaceResourceHold,ChallengeResourceHold]);
export const ResourceHoldResult=z.object({holdId:UUID,state:z.enum(["active","challenged","converted","expired","released"]),resources:z.array(HoldResource).min(1).max(100),slot:ZonedInterval,rank:z.int().nonnegative(),expiresAt:Instant,higherClaimId:UUID.nullable(),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const RequestRoomHireEnquiry=z.object({actingPartyId:UUID,requesterPartyId:UUID,roomId:UUID,useType:UseType,slot:ZonedInterval,profileCreditRefs:z.array(UUID).max(30),requirements:z.array(z.object({key:z.string().min(1).max(64),value:z.string().min(1).max(500)}).strict()).max(50),message:z.string().trim().min(1).max(5000),preferredAssigneePartyId:UUID.nullable(),lapsesAt:Instant,consentToShareProfile:z.boolean()}).strict();
export const RoomHireEnquiryResult=z.object({enquiryRef:UUID,roomId:UUID,routingState:z.enum(["queued_assignee","queued_organization_fallback"]),assigneePartyId:UUID.nullable(),organizationPartyId:UUID,lapsesAt:Instant,replayed:z.boolean(),requestId:RequestId}).strict();

const WaitlistJoin=z.object({action:z.literal("join"),actingPartyId:UUID,requesterPartyId:UUID,roomId:UUID,useType:UseType,desiredSlot:ZonedInterval,minimumLeadMinutes:z.int().min(0).max(525600),entryExpiresAt:Instant,notificationBudget:z.int().min(1).max(20)}).strict();
const WaitlistOfferResponse=z.object({action:z.enum(["accept_offer","decline_offer"]),actingPartyId:UUID,requesterPartyId:UUID,entryId:UUID,offerId:UUID,offerToken:z.string().min(32).max(512),expectedVersion:Version}).strict();
export const WaitlistActionRequest=z.union([WaitlistJoin,WaitlistOfferResponse]);
export const WaitlistActionResult=z.object({entryId:UUID,state:z.enum(["active","offered","accepted","declined","expired","removed"]),rank:z.int().positive(),offerId:UUID.nullable(),offerExpiresAt:Instant.nullable(),holdId:UUID.nullable(),notificationsRemaining:z.int().nonnegative(),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();
```

Path `roomId` and body `roomId` must match. The server verifies each ISO timestamp's supplied offset against the IANA zone at that instant; ambiguous or nonexistent DST wall time returns `WINDOW_INVALID` rather than guessing. Intervals normalize to half-open UTC `[start,end)` ranges. Empty availability is valid only when every use posture is `blocked`. Provider payloads, client identity and exact future occupancy never enter public projections.

## Authorization and Disclosure

| Operation ID | Allowed principal | Ownership/capability checks | 403 versus 404 / disclosure |
|---|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | full room operator or scoped delegate | fresh Shard 01 mandate, room scope, `manage_calendar`, expected version and resource graph version | hidden/foreign room is 404; visible room without capability is 403; response omits provider credentials and private blocks |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | registered connector worker only | mTLS/signature, connector grant, enabled mapping, room binding, provider event/version monotonicity | unknown mapping is generic 404; revoked known connector is 403; provider calendar ID/event body never returned |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | eligible requester or reservation worker | requester equals acting context or service mandate; complete resource set; posture/calendar/rank/limits current | hidden resource is collapsed to 404; visible but ineligible is 403; loser sees only opaque higher claim ID/rank |
| `V29_14_REQUEST_ENQUIRY` | authenticated eligible requester | requester/context match, room visibility, use posture, share consent and nonexpired lapse | hidden room 404; known room with blocked posture or ineligible actor 403; assignee contact/private schedule omitted |
| `V29_19_WAITLIST_ACTION` | entry owner or signed offer worker | requester/context, entry/offer ownership, token digest, expiry, eligibility and version | foreign/unknown entry or offer is 404; owner with invalid action is 403/422; queue members and exact rank bases omitted |

Public availability returns coarse posture buckets only—never exact future occupancy, provider labels, client identity, private hold purpose or resource value. Operators see their room's normalized blocks but provider secrets stay connector-only. Support requires an expiring purpose grant and cannot advance a hold/offer or edit windows.

## Database Schema

All tables live in `venue_private`. `owner_id` is the governing room/requester party, but RLS always rechecks current Shard 01 scope and purpose rather than trusting ownership alone.

```sql
CREATE TABLE venue_private.calendar (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','suspended','retired')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, timezone text NOT NULL CHECK(length(timezone) BETWEEN 3 AND 64), posture_by_use jsonb NOT NULL CHECK(jsonb_typeof(posture_by_use)='array' AND jsonb_array_length(posture_by_use) BETWEEN 1 AND 7),
 native_windows tstzmultirange NOT NULL DEFAULT '{}', exception_blocks tstzmultirange NOT NULL DEFAULT '{}', external_busy tstzmultirange NOT NULL DEFAULT '{}', setup_buffer interval NOT NULL CHECK(setup_buffer>=interval '0' AND setup_buffer<=interval '1 day'), teardown_buffer interval NOT NULL CHECK(teardown_buffer>=interval '0' AND teardown_buffer<=interval '1 day'),
 provider_mappings jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(provider_mappings)='array' AND jsonb_array_length(provider_mappings)<=20), mirror_state text NOT NULL CHECK(mirror_state IN ('healthy','delayed','stale','disconnected')), sync_watermark text NULL CHECK(sync_watermark IS NULL OR length(sync_watermark)<=256),
 last_success_at timestamptz NULL, freshness_deadline timestamptz NULL, resource_graph_version bigint NOT NULL CHECK(resource_graph_version>0), instant_book_enabled boolean NOT NULL, deleted_at timestamptz NULL, UNIQUE(room_id),
 CHECK((jsonb_array_length(provider_mappings)=0) OR freshness_deadline IS NOT NULL), CHECK(mirror_state='healthy' OR NOT instant_book_enabled)
);
CREATE INDEX calendar_owner_state_idx ON venue_private.calendar(owner_id,state,updated_at DESC);
CREATE INDEX calendar_mirror_freshness_idx ON venue_private.calendar(mirror_state,freshness_deadline) WHERE state='active';
CREATE INDEX calendar_posture_gin_idx ON venue_private.calendar USING gin(posture_by_use);
CREATE INDEX calendar_native_gist_idx ON venue_private.calendar USING gist(native_windows);
CREATE INDEX calendar_busy_gist_idx ON venue_private.calendar USING gist(external_busy);
```

`ResourceHold` locks the full sorted resource vector; partial-overlap exclusion is enforced by serializable overlap queries while per-resource transaction advisory locks are held.

```sql
CREATE TABLE venue_private.resource_hold (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','challenged','converted','expired','released')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 requester_party_id uuid NOT NULL, resources jsonb NOT NULL CHECK(jsonb_typeof(resources)='array' AND jsonb_array_length(resources) BETWEEN 1 AND 100), resource_ids uuid[] NOT NULL CHECK(cardinality(resource_ids) BETWEEN 1 AND 100), resource_set_hash text NOT NULL CHECK(resource_set_hash ~ '^[a-f0-9]{64}$'),
 slot tstzrange NOT NULL CHECK(NOT isempty(slot) AND lower_inc(slot) AND NOT upper_inc(slot)), rank_class text NOT NULL CHECK(rank_class IN ('confirmed_dependency','checkout','waitlist_offer','operator_hold','enquiry')), rank_priority integer NOT NULL CHECK(rank_priority BETWEEN 0 AND 1000),
 rank_requested_at timestamptz NOT NULL, rank_policy_version bigint NOT NULL CHECK(rank_policy_version>0), rank integer NOT NULL CHECK(rank>0), challenge_target_id uuid NULL REFERENCES venue_private.resource_hold(id) ON DELETE RESTRICT,
 expires_at timestamptz NOT NULL, calendar_versions jsonb NOT NULL CHECK(jsonb_typeof(calendar_versions)='object'), converted_reservation_id uuid NULL, higher_claim_id uuid NULL REFERENCES venue_private.resource_hold(id) ON DELETE RESTRICT,
 idempotency_key_hash text NOT NULL CHECK(idempotency_key_hash ~ '^[a-f0-9]{64}$'), terminal_at timestamptz NULL, CHECK(owner_id=requester_party_id), CHECK(expires_at>created_at), CHECK((state='converted')=(converted_reservation_id IS NOT NULL)), CHECK(id<>COALESCE(challenge_target_id,'00000000-0000-0000-0000-000000000000'::uuid))
);
CREATE UNIQUE INDEX resource_hold_idempotency_uq ON venue_private.resource_hold(requester_party_id,idempotency_key_hash);
CREATE INDEX resource_hold_resource_gin_idx ON venue_private.resource_hold USING gin(resource_ids);
CREATE INDEX resource_hold_slot_gist_idx ON venue_private.resource_hold USING gist(slot) WHERE state IN ('active','challenged');
CREATE INDEX resource_hold_expiry_idx ON venue_private.resource_hold(expires_at,id) WHERE state IN ('active','challenged');
CREATE INDEX resource_hold_requester_idx ON venue_private.resource_hold(requester_party_id,state,created_at DESC);
```

```sql
CREATE TABLE venue_private.waitlist_entry (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','offered','accepted','declined','expired','removed')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 requester_party_id uuid NOT NULL, room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, use_type text NOT NULL CHECK(use_type IN ('recording','rehearsal','room_hire','education','broadcast','private_event','performance')),
 desired_slot tstzrange NOT NULL CHECK(NOT isempty(desired_slot) AND lower_inc(desired_slot) AND NOT upper_inc(desired_slot)), minimum_lead interval NOT NULL CHECK(minimum_lead>=interval '0' AND minimum_lead<=interval '365 days'), rank_basis jsonb NOT NULL CHECK(jsonb_typeof(rank_basis)='object'), rank integer NOT NULL CHECK(rank>0),
 entry_expires_at timestamptz NOT NULL, offer_id uuid NULL, offered_at timestamptz NULL, offer_expires_at timestamptz NULL, offer_token_digest text NULL CHECK(offer_token_digest IS NULL OR offer_token_digest ~ '^[a-f0-9]{64}$'),
 fulfillment_hold_id uuid NULL REFERENCES venue_private.resource_hold(id) ON DELETE RESTRICT, loss_count integer NOT NULL DEFAULT 0 CHECK(loss_count>=0), notification_budget integer NOT NULL CHECK(notification_budget BETWEEN 1 AND 20), notifications_sent integer NOT NULL DEFAULT 0 CHECK(notifications_sent BETWEEN 0 AND notification_budget),
 next_notification_at timestamptz NULL, terminal_at timestamptz NULL, CHECK(owner_id=requester_party_id), CHECK(entry_expires_at>created_at), CHECK(state NOT IN ('offered','accepted','declined') OR (offer_id IS NOT NULL AND offered_at IS NOT NULL AND offer_expires_at IS NOT NULL AND offer_token_digest IS NOT NULL)), CHECK(state<>'offered' OR offer_expires_at>offered_at)
);
CREATE UNIQUE INDEX waitlist_active_demand_uq ON venue_private.waitlist_entry(requester_party_id,room_id,use_type,lower(desired_slot),upper(desired_slot)) WHERE state IN ('active','offered');
CREATE INDEX waitlist_room_rank_idx ON venue_private.waitlist_entry(room_id,use_type,rank,created_at) WHERE state='active';
CREATE INDEX waitlist_offer_expiry_idx ON venue_private.waitlist_entry(offer_expires_at,id) WHERE state='offered';
CREATE INDEX waitlist_owner_state_idx ON venue_private.waitlist_entry(requester_party_id,state,updated_at DESC);
```

### References, RLS, Grants, and Retention

| Table/model | FK/logical reference enforcement | RLS and grants | Retention/deletion |
|---|---|---|---|
| `Calendar` → `venue_private.calendar` | physical FK to Shard 29a `room`; owner/mandate logical to Shard 01; provider mapping to registered connector; resource graph version to Shard 24 | scoped operator/delegate SELECT/UPDATE through definer RPC; connector worker may update only mirror fields; public shaped posture view; no direct browser DML | calendar versions/audit 7 years after final reservation; provider mappings/tokens erased on disconnect; busy details 90 days after expiry |
| `ResourceHold` → `venue_private.resource_hold` | self FKs for challenge/higher claim; room/person/asset IDs validated as typed logical Shard 29a/24 refs; converted reservation logical to 29d | requester safe SELECT; hold/reservation workers INSERT/transition; operator sees opaque slot/resource availability only; no `anon/authenticated` table grants | active through terminal plus 1 year; payment/legal hold extends; expired private purpose erased after 90 days |
| `WaitlistEntry` → `venue_private.waitlist_entry` | physical room and hold FKs; requester/notification policy refs logical to Shards 01/config; offer token stored only as digest | owner-shaped SELECT/action RPC; operator aggregate demand only; waitlist/notification workers narrow transitions; no public row access | terminal entries 1 year for fairness audit; offer token digest 90 days; notification metadata per consent/erasure policy |

Every table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. Definer functions pin `search_path`, keep `row_security=on`, verify acting party/mandate/purpose/version, revoke `PUBLIC`, and return exact columns. Migration role owns tables. No browser role can select exact occupancy, provider mapping, competitor rank basis, offer digest, requester identity or asset value.

## State, Middleware, Concurrency, and Flow

| Aggregate/process | Legal state machine and guard |
|---|---|
| Calendar | `active ↔ suspended → retired`; only an authorized room lifecycle action retires it; a stale/disconnected mirror forces instant-book off without erasing native windows |
| External mirror | `healthy → delayed → stale → disconnected`; a newer successful mapped delta may recover `delayed|stale` to `healthy`; reconnect authorization is required from `disconnected` |
| Hold | `active → challenged|converted|expired|released`; challenge never extends the original hard bound; converted/released/expired are terminal |
| Waitlist entry | `active → offered → accepted|declined|expired`; `active → removed|expired`; an expired offer advances exactly one next eligible entry |
| Enquiry delivery | local durable handoff `queued_assignee|queued_organization_fallback`; the owning delivery seam records delivered/lapsed conversation state, while this companion retains only idempotency, audit and outbox evidence |

Mirror freshness is recomputed from the versioned mapping TTL on every availability decision and by a scheduled sweeper. A database clock, not a client timestamp, governs hold, offer and enquiry expiry. All resource IDs are sorted by `(kind,id)` before locks, and every availability computation uses one calendar/resource-graph version vector.

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation, idempotency, rate and deadline |
|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/acting context → path/body equality → strict Zod → room capability → idempotency → transaction/outbox → success/`ApiError` validation | required key bound to actor/method/path/body for 30 days; 20/min/account+party+room; 15,000 ms ordinary-command deadline |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | request ID → `BE00-CORS-DENY` → mTLS/service token → raw-body signature/timestamp → strict Zod → connector/mapping grant → idempotency/provider dedupe → transaction/outbox → success/`ApiError` validation | key is connector+provider event/version/body hash for 90 days; 600/min/connector burst 100; 2,000 ms async-acceptance deadline |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict Zod → eligibility/resource scope → idempotency → active-hold quota → serializable locks/transaction/outbox → success/`ApiError` validation | required body-hash key through terminal+30 days; 30/min/account+requester and 10 active/requester; 15,000 ms deadline |
| `V29_14_REQUEST_ENQUIRY` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict Zod → room posture/consent/eligibility → idempotency → rate → durable handoff/outbox → success/`ApiError` validation | required key through lapse+30 days; 10/hour/account+requester+room; 15,000 ms deadline |
| `V29_19_WAITLIST_ACTION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict union → owner/offer-token/eligibility → idempotency → rate → serializable rank/offer transaction/outbox → success/`ApiError` validation | required key through entry/offer terminal+30 days; 20/min/account+requester and join 10/day/room; 15,000 ms deadline |

Every operation returns only BE00 `ApiError { code, message, requestId, details }` on failure. CORS denial happens before authentication and emits no resource fact. Idempotency mismatch is `409 IDEMPOTENCY_CONFLICT`; concurrent in-progress replay returns BE00 `409 REQUEST_IN_PROGRESS` with a bounded retry hint.

### Operation Flows and Recovery

| Operation ID | Transaction/concurrency algorithm | Failure recovery / prohibited result |
|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | load authority; normalize offset-aware intervals; validate no invalid overlap/cycle; lock room/calendar; CAS expected version and resource graph; replace versioned range sets/mappings; compute mirror and instant posture; write audit/outbox/idempotency atomically | stale version returns current safe version; invalid DST/mapping writes nothing; connector outage preserves prior mapping; configuration never creates a quote/hold/reservation |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | verify raw signature before JSON use; resolve exact mapping; advisory-lock connector/event and row-lock calendar; reject older conflicting provider version, replay equal hash; apply busy upsert/delete; advance watermark/freshness; emit state change only on relevant delta | ambiguous mapping is rejected, never broadcast; partial batch impossible; poison delta is quarantined with redacted digest; stale sweeper disables instant-book even when callbacks stop |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | load fresh calendars/resource graph; sort and advisory-lock every resource; serializable overlap/rank query; place all resources or none; challenge compares versioned rank without extending slot/expiry; commit hold/audit/outbox/replay together | losing challenge returns opaque higher claim; calendar uncertainty or one unavailable member creates no hold; expiry worker releases every member idempotently; crash after commit drains outbox |
| `V29_14_REQUEST_ENQUIRY` | authorize room/use; validate future lapse and requirements; resolve preferred assignee then organization fallback; generate enquiryRef; atomically store BE00 idempotency result plus durable handoff/audit/outbox; attempt immediate delivery | broken assignee becomes explicit `queued_organization_fallback`, never decline; seam circuit leaves durable queued handoff; lapse emits terminal delivery instruction without fabricating operator response |
| `V29_19_WAITLIST_ACTION` | join locks equivalent active demand and computes policy rank; accept locks entry/offer/slot then creates a waitlist-priority hold atomically; decline/expiry advances one next eligible entry under skip-locked worker; decrement notification budget only after accepted notification receipt | expired token cannot create hold; hold failure returns entry to active or advances per policy atomically; repeated losses suppress notices at budget, not eligibility; worker retries by entry/version |

### External Seams

| Seam | Exact request → response | Timeout, retry/backoff, circuit behavior |
|---|---|---|
| Shard 01 authority | `{accountId,actingPartyId,scopeType:"room",scopeId,capability,contextVersion}` → `{allowed,partyVersion,mandateVersion,reasonCode}` | 250 ms; 1 retry after 25 ms; opens after 15 failures/30 s for 30 s; open circuit fails closed before any read/write |
| connector registry/signature | `{connectorId,mappingId,deliveryId,providerEventId,providerVersion,bodySha256,signature,timestamp}` → `{valid,grantState,roomId,mappingVersion,providerClockSkewSeconds}` | 300 ms; 1 retry after 40 ms; opens after 12 failures/30 s for 30 s; open circuit rejects/quarantines callback and never advances watermark |
| Shard 24 resource graph | `{resourceRefs,slot,roomId,expectedGraphVersion,includeCondition:true}` → `{available,unavailableRefs,currentGraphVersion,exclusionRefs,reasonCodes}` | 500 ms; 2 retries after 50/150 ms; opens after 10 failures/30 s for 30 s; open circuit returns `CALENDAR_UNCERTAIN` and creates no hold |
| enquiry routing/delivery | `{enquiryRef,requesterPartyId,roomId,useType,slot,profileCreditRefs,requirements,message,lapsesAt,preferredAssigneePartyId}` → `{accepted,conversationRef,routeState,assigneePartyId?,organizationPartyId,routeVersion}` | 800 ms; 2 retries after 100/400 ms; opens after 8 failures/60 s for 60 s; open circuit retains queued outbox handoff and returns durable 202 |
| notification dispatcher | `{notificationId,template:"venue_waitlist_offer",recipientPartyId,entryId,offerId,expiresAt,dedupeKey}` → `{accepted,receiptId,acceptedAt}` | 1,000 ms; 3 retries after 1/4/16 s; opens after 10 failures/60 s for 60 s; budget decrements only on accepted receipt, expiry still advances queue |
| BE00 outbox dispatcher | `{eventId,eventType,aggregateRef,aggregateVersion,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries after 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; committed rows remain durable and drain in aggregate-version order |

## Event Contracts

```ts
const VenueEventBase=z.object({event_id:UUID,event_type:z.string().min(1).max(96),schema_version:z.literal("1"),occurred_at:Instant,actor_ref:UUID.nullable(),acting_party_ref:UUID.nullable(),aggregate_ref:UUID,aggregate_version:Version,correlation_id:UUID,causation_id:UUID.nullable(),idempotency_key:z.string().min(8).max(128),payload:JsonValueSchema}).strict();
export const VenueCalendarSyncStateChanged=VenueEventBase.extend({event_type:z.literal("venue.calendar.sync_state_changed"),payload:z.object({calendarId:UUID,roomId:UUID,connectorId:UUID,mirrorState:z.enum(["healthy","delayed","stale","disconnected"]),syncWatermark:z.string().min(1).max(256),lastSuccessAt:Instant.nullable(),instantBookEnabled:z.boolean()}).strict()}).strict();
export const VenueHoldChanged=VenueEventBase.extend({event_type:z.literal("venue.hold.changed"),payload:z.object({holdId:UUID,resourceRefs:z.array(z.object({kind:z.enum(["room","person","asset"]),resourceId:UUID}).strict()).min(1).max(100),rank:z.int().positive(),oldState:z.enum(["absent","active","challenged","converted","expired","released"]),newState:z.enum(["active","challenged","converted","expired","released"]),expiresAt:Instant}).strict()}).strict();
export const VenueWaitlistOfferChanged=VenueEventBase.extend({event_type:z.literal("venue.waitlist.offer_changed"),payload:z.object({entryId:UUID,offerId:UUID.nullable(),roomId:UUID,slot:ZonedInterval,state:z.enum(["active","offered","accepted","declined","expired","removed"]),offerExpiresAt:Instant.nullable()}).strict()}).strict();
```

Calendar configuration without a mirror-state transition is audited but does not invent another IA event type. Enquiry routing uses the owning seam's event contract and BE00 outbox, not a duplicate `venue.*` schema. Consumers deduplicate `event_id`, order by `(aggregate_ref,aggregate_version)`, ignore older versions and reauthorize before disclosure. Events carry opaque references—never client identity, provider payload, exact public occupancy, rank basis, offer token or message.

## Errors, Recovery, and Observability

BE00 transport/media/size, authentication, CSRF, CORS, deadline, dependency and rate failures apply in addition to the domain outcomes below. Every failure validates against the exact four-field `ApiError` schema.

| Operation ID | HTTP/status and domain code | Safe trigger/recovery |
|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | 422 `WINDOW_INVALID`/`MAPPING_AMBIGUOUS`; 409 `STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | correct interval/offset/mapping or refresh versions; prior calendar remains intact |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | 401 `UNAUTHENTICATED`; 403 `CONNECTOR_REVOKED`; 404 `MAPPING_UNKNOWN`; 409 `EVENT_REPLAYED`/`IDEMPOTENCY_CONFLICT`; 422; 429; 503 | connector refreshes mapping/grant or replays identical body; mismatch quarantined; watermark unchanged |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | 422 `HOLD_LIMIT`/`RANK_INSUFFICIENT`; 409 `RESOURCE_UNAVAILABLE`/`CALENDAR_UNCERTAIN`/`HOLD_EXPIRED`/`STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | retry with fresh calendar/resource vector or later slot; no partial member hold |
| `V29_14_REQUEST_ENQUIRY` | 422 `POSTURE_BLOCKED`/`ENQUIRY_LAPSED`; 409 `IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | choose allowed use/future lapse; delivery outage leaves explicit durable queue, not false decline |
| `V29_19_WAITLIST_ACTION` | 422 `WAITLIST_INELIGIBLE`/`OFFER_TOKEN_INVALID`; 409 `OFFER_EXPIRED`/`RESOURCE_UNAVAILABLE`/`STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | refresh entry/offer; expired offer advances safely; acceptance never succeeds without atomic hold |

| Operation ID | Safe logs/traces | Metrics/SLO and alert |
|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | request/op/actor/room/calendar IDs, versions, interval/mapping counts, mirror state, replay; no provider refs or block detail | config count/conflict/latency; p95 <1.5 s; page invalid instant-book enable or version regression |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | connector/mapping/delivery hashes, provider-version hash, delta count, old/new mirror, watermark hash, replay; no raw provider payload | accepted/replayed/quarantined, freshness age and ingest latency; p95 accept <500 ms; page stale rooms or signature failures spike |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | actor/requester/hold IDs, resource count/set hash, slot bucket, rank class/result, expiry/version/replay; no client or asset value | hold wins/losses/expiry/conflicts/lock latency; p95 <800 ms; page overlapping active claims or expiry lag >30 s |
| `V29_14_REQUEST_ENQUIRY` | actor/requester/room/enquiry refs, use, route state, assignee presence, lapse bucket, replay; message/profile refs scrubbed | queued/fallback/delivery/lapse and latency; p95 accept <700 ms; alert queue age >2 min or fallback >20%/15 min |
| `V29_19_WAITLIST_ACTION` | actor/entry/offer/hold IDs, action/state/rank bucket, remaining budget, version/replay; token and other members scrubbed | join/offer/accept/expire/loss/notification suppression; p95 <800 ms; page double offer or accepted-without-hold |

Audit rows record actor/context/action/scope, before/after hashes, authority/policy/calendar/resource versions, idempotency/request hash and safe result. provider-native diagnostic sinks receive opaque IDs and codes only. Raw provider data/signatures, enquiry message, contact/profile details, exact occupancy, offer tokens and private resource facts are scrubbed from logs, traces, errors and event payloads.

## Release and Testing

### Per-operation Tests

| Operation ID | Contract/authorization tests | Idempotency/concurrency/failure/observability tests |
|---|---|---|
| `V29_11_CONFIGURE_CALENDAR` | strict shapes/bounds, path equality, IANA offset/DST, overlap/buffer/posture/mapping rules, operator/delegate scope, 403/404 privacy | same-key replay/mismatch, CAS race one winner, resource version conflict, connector circuit preserves state, CORS/CSRF/rate/`ApiError`/redaction |
| `V29_12_RECORD_EXTERNAL_BUSY_DELTA` | signature/timestamp/raw hash, connector grant/mapping, upsert/delete interval rules, old/equal/new provider versions, `BE00-CORS-DENY` | duplicate exact replay, conflicting replay quarantine, batch rollback, callback/sweeper race, circuit no watermark, async deadline/metrics/outbox |
| `V29_13_PLACE_OR_CHALLENGE_HOLD` | complete typed resources, use posture/freshness, rank/TTL/quota, requester/service mandate, opaque loser response | intersecting resource races serialize one winner, all-or-none member failure, expiry/challenge race, seam circuit, replay/event/audit/alert |
| `V29_14_REQUEST_ENQUIRY` | eligibility/posture, consent/profile refs, message bounds, lapse, preferred assignee/fallback, hidden room 404 | replay, assignee disappearance race, delivery circuit durable queue, lapse recovery, no false decline, logs/errors omit message/contact |
| `V29_19_WAITLIST_ACTION` | join uniqueness/eligibility/lead/expiry/budget; owner/token/version for accept/decline; no queue disclosure | offer expiry vs accept one winner, atomic hold, sequential skip-locked advancement, notification receipt budget, replay/CORS/rate/event metrics |

Additional suites cover Zod/OpenAPI/event snapshots; SQL checks/FKs/index plans; RLS/grants for public/requester/operator/delegate/connector/waitlist/notification/support/foreign roles; property tests for UTC normalization and one active equivalent demand; randomized resource-overlap/rank serialization; mirror freshness sweeps; outbox ordering/dedup; circuit chaos; privacy differential tests; retention/erasure and migration rollback.

Release requires compatible OpenAPI diff, expand/contract migration rehearsal, RLS/grant verification, DST/provider fixture replay, overlapping-resource invariant query, stale-mirror and expiry-worker drills, enquiry/notification circuit drills, redaction scan, dashboards/alerts and rollback proof. Rollback disables new commands/workers, preserves calendars/holds/entries/idempotency/outbox, forces affected rooms to enquiry-only, drains terminal transitions, and never re-enables instant booking from stale data.

## Deepening Passes

1. **Traceability:** all five IA interactions, three named IA commands, three canonical models and three literal events map to stable routes, contracts and persistence.
2. **Contracts/security:** exact Zod 4 requests/successes/errors, BE00 `ApiError`, per-route named CORS/deadlines/rates/idempotency, authority ownership and 403/404 disclosure are explicit.
3. **Data:** every persistence field has SQL type/nullability/checks, FK/logical enforcement, query indexes, forced RLS, least-privilege grants and retention.
4. **Reliability:** DST validation, mirror degradation, sorted resource locks, serializable rank arbitration, hard expiry, atomic outbox and exact seam circuits prevent optimistic or partial availability.
5. **Operations/tests:** safe telemetry, per-operation tests, chaos, privacy, migrations, release and rollback close both ordinary and failure paths.

## Ambiguity Gate

**PASS.** Macro ownership of calendars, provider mirrors, resource holds, enquiry routing and waitlist offers is reconciled with Shards 01/24/29a/29d and BE00. Micro routes, operation IDs, schemas, bounds, states, CORS, deadlines, rates, idempotency, 403/404, SQL fields/constraints/FKs/indexes/RLS/grants, locks, expiry, external seam timeout/retry/circuit behavior, errors, observability, tests and rollback are exact. No unresolved, provisional or unspecified implementation choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for approved Shard 29c split. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 29 — Venues, Studios and Spaces](../ia/29-venues-spaces.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Engineering Standards](../ENGINEERING-STANDARDS.md)
- [Shard 01 Identity & Authority](../ia/01-identity-authority.md)
- [Shard 24 Gear Holdings & Operations](../ia/24-gear-holdings-operations.md)
- [Shard 30 Booking & Contracts](../ia/30-booking-contracts.md)
