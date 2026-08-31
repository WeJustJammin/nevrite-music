# Room Specifications, Accessibility & Conformance — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/29-venues-spaces.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. Interactions 29.05–29.09 and 29.21 require immutable typed truth, provenance, evidence/moderation, audience-separated accessibility projection, contests, jurisdiction-bounded declarations, gear references and persisted conformance results.
- **Boundary:** owns room technical/specification truth and comparison. Shard 24 remains canonical for asset identity/quantity/condition; Shard 06 owns moderation/evidence custody; Shard 30 owns rider/performance negotiation. Conformance informs but never blocks booking or negotiation.
- **Split validation:** approved `29b` exactly covers specs, gear posture, media evidence, accessibility, corrections/contests and conformance. Identity/status, calendars and reservations remain in `29a`, `29c`, `29d`.
- **BE00 inheritance:** UUID request IDs, strict Zod/OpenAPI, session/acting-context auth, named CORS/CSRF, rate headers, 30-day idempotency floor, audit/outbox, BE00 Error Handling status/app-code/retry mappings and the four-field `ApiError`.

## Referenced Material Inventory

| Material | Sections / lines | Locked input used here |
|---|---:|---|
| IA Shard 29 | Architecture decisions, lines 24–38 | typed truth states, bounded conditions, accessibility separation, statutory limits and conformance semantics |
| IA Shard 29 | AC-29.05–AC-29.09 and AC-29.21, lines 56–60, 72 | publish/spec/gear/evidence/accessibility/contest/conformance behavior |
| IA Shard 29 | Interactions 29.05–29.09 and 29.21, lines 83–87, 99 | exact preconditions, commits and recovery |
| IA Shard 29 | Commands/boundaries, lines 102–127 | `ReviseSpecField`, `EvaluateConformance`, Shard 24/30/06 ownership |
| IA Shard 29 | Models/states/invariants/fields, lines 129–193 | six canonical models, contest state, private-data constraints, core fields |
| IA Shard 29 | Access control/accessibility, lines 194–232 | per-role write/read boundaries and announced unknowns |
| IA Shard 29 | Events, lines 233–252 | four literal event types and redacted payload rules |
| Architecture/Engineering Standards | security/data/testing | Hono, Supabase PostgreSQL/Storage, Zod 4, contract-first TDD |
| BE00 | error/CORS/archetype/idempotency/event/recovery sections | platform transport and operational floor |

## IA Source Map

| IA interaction | Stable operation ID | Owned behavior | Canonical artifacts |
|---|---|---|---|
| 29.05 | `V29_05_REVISE_SPEC_FIELD` | append one typed field revision with truth state, conditions, caveats and provenance | `ReviseSpecField`, `SpecFieldRevision`, `AccessibilityProfile`, `StatutoryDeclaration`, `venue.spec.field.revised`, `venue.accessibility.overridden` |
| 29.06 | `V29_06_PUBLISH_GEAR_PROVISION` | publish room allocation/provision posture referencing authorized Shard 24 assets | `SpecFieldRevision`, `venue.spec.field.revised` |
| 29.07 | `V29_07_ATTACH_MEDIA_EVIDENCE` | attach first-hand/operator media to checklist/field with immutable provenance and moderation | `MediaEvidence` |
| 29.08 | `V29_08_READ_ACCESSIBILITY` | shaped audience or performer/crew route with explicit unknown and temporary overrides | `AccessibilityProfile` |
| 29.09 | `V29_09_CONTEST_FIELD` | immutable suggestion/contest, safe auto-apply only for configured classes, moderation linkage | `FieldContest`, `venue.field.contested` |
| 29.21 | `V29_21_EVALUATE_CONFORMANCE` | compare frozen rider/spec/event snapshots into immutable `match|unknown|conflict` results | `EvaluateConformance`, `ConformanceRun`, `venue.conformance.completed` |

## Endpoint Reconciliation and Shared Inheritance

No BE00, Shard 24 asset, Shard 06 evidence/moderation, or Shard 30 rider endpoint is duplicated. V29_08 is **authenticated read** (`no-store`, exact 8,000 ms deadline, no idempotency key). The five mutations/computations are **ordinary commands** (`no-store`, exact 15,000 ms deadline, 30-day replay, atomic audit/outbox). All browser routes use `BE00-CORS-WEB-CREDENTIALLED`; writes add session-bound CSRF.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | `POST /api/v1/venues/spec-field-revisions` | 29.05 | `201 ReviseSpecFieldResult` | required; 30-day hash-bound replay | 60/hour/account + actor; 20/hour/room |
| `V29_06_PUBLISH_GEAR_PROVISION` | `POST /api/v1/venues/gear-provision-revisions` | 29.06 | `201 PublishGearProvisionResult` | required; 30-day replay | 30/hour/account + operator |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | `POST /api/v1/venues/media-evidence` | 29.07 | `201 AttachMediaEvidenceResult` | required through moderation + 30 days | 30/hour/account + contributor; 200/day |
| `V29_08_READ_ACCESSIBILITY` | `GET /api/v1/venues/rooms/:roomId/accessibility` | 29.08 | `200 ReadAccessibilityResult` | safe read; key rejected | 120/min/account + acting party |
| `V29_09_CONTEST_FIELD` | `POST /api/v1/venues/field-contests` | 29.09 | `201 FieldContestResult` | required through terminal contest + 30 days | 20/day/account + challenger |
| `V29_21_EVALUATE_CONFORMANCE` | `POST /api/v1/venues/conformance-runs` | 29.21 | `201 EvaluateConformanceResult` | required; unique snapshots/config; 30-day replay | 30/hour/account + acting party |

### Read cardinality and pagination policy

| Operation ID | Read shape and allowlisted filters | Page size and cursor |
|---|---|---|
| `V29_08_READ_ACCESSIBILITY` | Single room accessibility projection keyed by `roomId`; `route`, `includeNotStated`, and `at` are the only query controls; no arbitrary filter or sort keys | N/A: singular room projection, no cursor or page parameter; `segments` is capped at 100 and ordered by route then `segmentCode ASC`, with profile/override versions pinning the read |

### Operation Contract Matrix

| Operation ID | Exact request | Exact success | Error contract | Authorization |
|---|---|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | `ReviseSpecField` | `ReviseSpecFieldResult` | BE00 `ApiError { code, message, requestId, details }` | field-class contributor/operator capability |
| `V29_06_PUBLISH_GEAR_PROVISION` | `PublishGearProvisionRequest` | `PublishGearProvisionResult` | BE00 `ApiError { code, message, requestId, details }` | room operator and authorized Shard 24 register view |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | `AttachMediaEvidenceRequest` | `AttachMediaEvidenceResult` | BE00 `ApiError { code, message, requestId, details }` | first-hand contributor or operator evidence capability |
| `V29_08_READ_ACCESSIBILITY` | path `AccessibilityPath` + query `ReadAccessibilityQuery` | `ReadAccessibilityResult` | BE00 `ApiError { code, message, requestId, details }` | public-publishable room; authenticated route for exact viewer policy |
| `V29_09_CONTEST_FIELD` | `ContestFieldRequest` | `FieldContestResult` | BE00 `ApiError { code, message, requestId, details }` | contributor/requester/operator with permitted field class |
| `V29_21_EVALUATE_CONFORMANCE` | `EvaluateConformance` | `EvaluateConformanceResult` | BE00 `ApiError { code, message, requestId, details }` | rider/spec snapshots visible to acting party; result shaped to same scope |

## Zod 4 Contracts

```ts
import { z } from "zod";
const UUID=z.uuid(); const Instant=z.iso.datetime({offset:true}); const Version=z.string().regex(/^[1-9][0-9]{0,18}$/); const RequestId=z.uuid();
const ErrorCode=z.string().min(1).max(64).regex(/^[A-Z][A-Z0-9_]*$/);
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]); const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const depth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(depth)):1+Math.max(0,...Object.values(v).map(depth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(depth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();
export const VenueSpecError=z.enum(["FIELD_UNKNOWN","VALUE_INVALID","SOURCE_FORBIDDEN","CONDITION_UNSUPPORTED","SNAPSHOT_MISSING","SCHEMA_INCOMPATIBLE","ASSET_AUTHORITY_REQUIRED","COMPOSED_EXPOSURE_RISK","MEDIA_UNSAFE","CONTEST_FORBIDDEN","STALE_VERSION"]);

export const TruthState=z.enum(["stated","none","not_stated","contested","temporarily_unavailable"]);
const TypedValue=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("boolean"),value:z.boolean()}).strict(),z.object({kind:z.literal("integer"),value:z.int().min(-1000000).max(1000000),unit:z.string().min(1).max(32).nullable()}).strict(),
 z.object({kind:z.literal("decimal"),value:z.string().regex(/^-?(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/),unit:z.string().min(1).max(32)}).strict(),z.object({kind:z.literal("enum"),value:z.string().min(1).max(64)}).strict(),
 z.object({kind:z.literal("text"),value:z.string().trim().min(1).max(500)}).strict(),z.object({kind:z.literal("reference"),value:UUID,referenceType:z.enum(["asset","room","media","declaration"])}).strict()
]);
const Condition=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("date_range"),startsAt:Instant,endsAt:Instant}).strict(),z.object({kind:z.literal("weekday"),days:z.array(z.int().min(1).max(7)).min(1).max(7)}).strict(),
 z.object({kind:z.literal("time_window"),startLocal:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),endLocal:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),timeZone:z.string().min(3).max(64)}).strict(),
 z.object({kind:z.literal("room_configuration"),configurationCode:z.string().min(1).max(64)}).strict(),z.object({kind:z.literal("billing_role"),role:z.enum(["client_pays","venue_pays","split"])}).strict(),
 z.object({kind:z.literal("operator_staffing"),required:z.boolean()}).strict(),z.object({kind:z.literal("notice"),minimumMinutes:z.int().min(0).max(525600)}).strict(),z.object({kind:z.literal("priced_extra"),extraCode:z.string().min(1).max(64)}).strict()
]);
export const ReviseSpecField=z.object({actingPartyId:UUID,roomId:UUID,fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/),fieldClass:z.enum(["technical","accessibility_audience","accessibility_performer","statutory","gear_provision","commercial"]),truthState:TruthState,value:TypedValue.nullable(),caveats:z.array(z.enum(["configuration_dependent","staff_dependent","priced_extra","temporary","source_aged","measurement_approximate"])).max(8),conditions:z.array(Condition).max(8),displayNote:z.string().trim().max(500).nullable(),source:z.object({class:z.enum(["operator","first_hand","community","shard24_register","moderator_outcome"]),evidenceRef:UUID.nullable(),observedAt:Instant}).strict(),effectiveFrom:Instant,effectiveUntil:Instant.nullable(),expectedCurrentRevision:Version.nullable()}).strict().superRefine((v,c)=>{if((v.truthState==="stated")!==(v.value!==null))c.addIssue({code:"custom",path:["value"],message:"truth_value_mismatch"});});
export const ReviseSpecFieldResult=z.object({revisionId:UUID,roomId:UUID,fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/),truthState:TruthState,contestState:z.enum(["clear","contested"]),completenessTier:z.enum(["unknown","basic","verified","operator_complete"]),currentProjectionVersion:Version,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const PublishGearProvisionRequest=z.object({actingPartyId:UUID,roomId:UUID,provisionPosture:z.enum(["installed","available_on_request","priced_extra","bring_your_own","not_stated"]),assetBindings:z.array(z.object({assetId:UUID,assetVersion:Version,quantityAvailable:z.int().min(0).max(10000),identityVisibility:z.enum(["exact","category_only","suppressed"])}).strict()).max(500),conditions:z.array(Condition).max(8),expectedProjectionVersion:Version.nullable()}).strict();
export const PublishGearProvisionResult=z.object({revisionIds:z.array(UUID).max(501),roomId:UUID,posture:z.enum(["installed","available_on_request","priced_extra","bring_your_own","not_stated"]),publishedAssetCount:z.int().nonnegative(),suppressedAssetCount:z.int().nonnegative(),projectionVersion:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const AttachMediaEvidenceRequest=z.object({actingPartyId:UUID,roomId:UUID,checklistSlot:z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/).nullable(),storageObjectId:UUID,captureAt:Instant,sourceClass:z.enum(["first_hand","operator"]),altText:z.string().trim().min(1).max(500),expectedRoomVersion:Version}).strict();
export const AttachMediaEvidenceResult=z.object({mediaEvidenceId:UUID,moderationCaseId:UUID,state:z.enum(["pending_moderation","published","removed_privacy","contested_accuracy"]),provenanceVersion:Version,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const AccessibilityPath=z.object({roomId:UUID}).strict();
export const ReadAccessibilityQuery=z.object({route:z.enum(["audience","performer_crew"]),includeNotStated:z.enum(["true","false"]).default("false"),at:Instant.nullable().default(null)}).strict();
const AccessibilitySegment=z.object({segmentCode:z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),truthState:TruthState,value:TypedValue.nullable(),caveats:z.array(z.string().min(1).max(64)).max(8),sourceClass:z.enum(["operator","first_hand","community","shard24_register","moderator_outcome"]),observedAt:Instant.nullable(),temporaryOverride:z.object({state:TruthState,startsAt:Instant,endsAt:Instant}).strict().nullable()}).strict();
export const ReadAccessibilityResult=z.object({roomId:UUID,route:z.enum(["audience","performer_crew"]),segments:z.array(AccessibilitySegment).max(100),excludedUnknownCount:z.int().nonnegative(),unknownAnnouncement:z.string().min(1).max(300),profileVersion:Version,requestId:RequestId}).strict();

export const ContestFieldRequest=z.object({actingPartyId:UUID,roomId:UUID,fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/),visibleRevisionId:UUID,suggestedValue:TypedValue.nullable(),reasonCode:z.enum(["fact_inaccurate","source_stale","temporary_change","privacy_or_safety","unflattering_but_accurate"]),evidenceRef:UUID.nullable(),expectedProjectionVersion:Version}).strict();
export const FieldContestResult=z.object({contestId:UUID,state:z.enum(["open","corroborating","operator_answered","resolved","escalated","withdrawn"]),visibleRevisionId:UUID,autoAppliedRevisionId:UUID.nullable(),moderationCaseId:UUID.nullable(),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const EvaluateConformance=z.object({actingPartyId:UUID,riderSnapshot:z.object({riderId:UUID,version:Version,schemaVersion:Version}).strict(),roomSpecSnapshot:z.object({roomId:UUID,version:Version,schemaVersion:Version}).strict(),eventConditions:z.array(Condition).max(20),fieldKeys:z.array(z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/)).min(1).max(200),comparisonConfigVersion:Version}).strict();
const ConformanceField=z.object({fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/),outcome:z.enum(["match","unknown","conflict"]),confidence:z.enum(["high","medium","low","not_computable"]),riderRef:UUID.nullable(),specRevisionRef:UUID.nullable(),reasonCode:z.enum(["equal","within_tolerance","missing_rider","missing_spec","stale_spec","unsupported_schema","condition_not_met","value_conflict"])}).strict();
export const EvaluateConformanceResult=z.object({runId:UUID,summary:z.object({match:z.int().nonnegative(),unknown:z.int().nonnegative(),conflict:z.int().nonnegative()}).strict(),fields:z.array(ConformanceField).max(200),advisoryOnly:z.literal(true),bookingBlocked:z.literal(false),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();
```

`commercial` and `statutory` fields are operator-only; community sources can only create contests/suggestions and never overwrite them. US is the only launch statutory profile; unsupported jurisdictions persist `not_stated`/unknown, never a verification claim. Display notes cannot encode conditions: all behavior uses the bounded condition union.

## Authorization and Disclosure

| Operation ID | Principal/capability | Ownership and policy | 403 versus 404 / disclosure |
|---|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | full/provisional/delegated operator by field capability; qualified contributor for allowlisted factual classes | live room scope, field/source class, mandate and expected projection current | hidden room/field is 404; visible room lacking class capability 403; evidence/caveat internals shaped by audience |
| `V29_06_PUBLISH_GEAR_PROVISION` | full/delegated room operator | room authority plus authorized Shard 24 register view per asset/version; no asset mutation | foreign room/asset 404; visible room lacking register/room authority 403; composed/private asset value suppressed, not leaked |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | first-hand contributor or room operator | room publishability, upload ownership, checklist slot and moderation policy | hidden room/object 404; known unsafe source/slot 403; removal reason safely shaped; accurate-unflattering content contests rather than erases |
| `V29_08_READ_ACCESSIBILITY` | public-publishable viewer through authenticated policy context | room public and route visible; performer route may require event scope for nonpublic segments | hidden/nonpublishable room 404; route not visible 403; exact unknown count is safe only in returned public profile |
| `V29_09_CONTEST_FIELD` | contributor/requester/operator with current room visibility | field class contestable; current visible revision; reason/evidence policy | hidden field/room 404; commercial/statutory overwrite attempt 403; challenger evidence/identity withheld from public |
| `V29_21_EVALUATE_CONFORMANCE` | rider owner/delegate, room operator, or Shard 30 scoped worker | caller can read both frozen snapshots and named fields; no wider rider/spec access | either hidden snapshot yields indistinguishable 404; visible mismatch of mandate 403; per-field result exposes references only within caller scope |

Moderators resolve safety/evidence cases but cannot author rates, statutory truth or booking outcomes. Support mechanical recovery uses expiring purpose grants. Public projections exclude exact future occupancy, claimant anchors, evidence files and private asset value.

## Database Schema

`owner_id` identifies the room/operator aggregate owner; every row also carries explicit room/source/actor references used by RLS. All JSON values are validated by the corresponding Zod schema at the database boundary.

```sql
CREATE TABLE venue_private.spec_field_revision (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('current','superseded','contested','withdrawn')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL, field_key text NOT NULL CHECK(field_key ~ '^[a-z][a-z0-9_.-]{1,95}$'), field_class text NOT NULL CHECK(field_class IN ('technical','accessibility_audience','accessibility_performer','statutory','gear_provision','commercial')),
 truth_state text NOT NULL CHECK(truth_state IN ('stated','none','not_stated','contested','temporarily_unavailable')), typed_value jsonb NULL, caveats text[] NOT NULL DEFAULT '{}', conditions jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(conditions)='array'), display_note text NULL CHECK(display_note IS NULL OR length(display_note)<=500),
 source_class text NOT NULL CHECK(source_class IN ('operator','first_hand','community','shard24_register','moderator_outcome')), source_evidence_ref uuid NULL, observed_at timestamptz NOT NULL, effective_from timestamptz NOT NULL, effective_until timestamptz NULL, supersedes_revision_id uuid NULL REFERENCES venue_private.spec_field_revision(id) ON DELETE RESTRICT,
 projection_version bigint NOT NULL CHECK(projection_version>0), CHECK((truth_state='stated')=(typed_value IS NOT NULL)), CHECK(effective_until IS NULL OR effective_until>effective_from), UNIQUE(room_id,field_key,version)
);
CREATE UNIQUE INDEX spec_field_current_uq ON venue_private.spec_field_revision(room_id,field_key) WHERE state IN ('current','contested');
CREATE INDEX spec_field_room_class_idx ON venue_private.spec_field_revision(room_id,field_class,field_key,created_at DESC);
CREATE INDEX spec_field_source_idx ON venue_private.spec_field_revision(source_class,source_evidence_ref) WHERE source_evidence_ref IS NOT NULL;
```

Accessibility profiles separate route classes and preserve temporary effective overrides.

```sql
CREATE TABLE venue_private.accessibility_profile (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('draft','published','superseded')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL, route_class text NOT NULL CHECK(route_class IN ('audience','performer_crew')), segments jsonb NOT NULL CHECK(jsonb_typeof(segments)='array'), caveats text[] NOT NULL DEFAULT '{}', completeness_tier text NOT NULL CHECK(completeness_tier IN ('unknown','basic','verified','operator_complete')),
 effective_from timestamptz NOT NULL, effective_until timestamptz NULL, source_revision_ids uuid[] NOT NULL DEFAULT '{}', projection_version bigint NOT NULL CHECK(projection_version>0), CHECK(effective_until IS NULL OR effective_until>effective_from), UNIQUE(room_id,route_class,version)
);
CREATE UNIQUE INDEX accessibility_profile_current_uq ON venue_private.accessibility_profile(room_id,route_class) WHERE state='published' AND effective_until IS NULL;
CREATE INDEX accessibility_profile_effective_idx ON venue_private.accessibility_profile(room_id,effective_from,effective_until);
```

Media rows reference governed storage; binary bytes remain in the media/storage domain.

```sql
CREATE TABLE venue_private.media_evidence (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('pending_moderation','published','removed_privacy','contested_accuracy','rejected')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL, checklist_slot text NOT NULL CHECK(checklist_slot ~ '^[a-z][a-z0-9_.-]{1,63}$'), field_key text NULL CHECK(field_key IS NULL OR field_key ~ '^[a-z][a-z0-9_.-]{1,95}$'), contributor_party_id uuid NOT NULL,
 storage_object_id uuid NOT NULL UNIQUE, capture_at timestamptz NOT NULL, source_class text NOT NULL CHECK(source_class IN ('first_hand','operator')), alt_text text NOT NULL CHECK(length(alt_text) BETWEEN 1 AND 500), moderation_case_id uuid NOT NULL, provenance_version bigint NOT NULL CHECK(provenance_version>0)
);
CREATE INDEX media_evidence_room_slot_idx ON venue_private.media_evidence(room_id,checklist_slot,created_at DESC) WHERE state='published';
CREATE INDEX media_evidence_field_idx ON venue_private.media_evidence(room_id,field_key,created_at DESC) WHERE field_key IS NOT NULL;
CREATE INDEX media_evidence_moderation_idx ON venue_private.media_evidence(moderation_case_id,state);
```

Statutory declarations store structured assertions/references, never certificate blobs or unsupported verification claims.

```sql
CREATE TABLE venue_private.statutory_declaration (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('draft','declared','expired','superseded','contested')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL, jurisdiction_code text NOT NULL CHECK(length(jurisdiction_code) BETWEEN 2 AND 32), capability_slot text NOT NULL CHECK(capability_slot ~ '^[a-z][a-z0-9_.-]{1,63}$'), declaration_code text NOT NULL CHECK(declaration_code ~ '^[a-z][a-z0-9_.-]{1,63}$'),
 issuer_name text NULL CHECK(issuer_name IS NULL OR length(issuer_name)<=160), external_reference text NULL CHECK(external_reference IS NULL OR length(external_reference)<=256), declared_by_party_id uuid NOT NULL, declared_at timestamptz NOT NULL, expires_at timestamptz NULL, provenance_ref uuid NOT NULL, profile_version bigint NOT NULL CHECK(profile_version>0), CHECK(expires_at IS NULL OR expires_at>declared_at), UNIQUE(room_id,capability_slot,version)
);
CREATE INDEX statutory_room_slot_idx ON venue_private.statutory_declaration(room_id,capability_slot,created_at DESC);
CREATE INDEX statutory_expiry_idx ON venue_private.statutory_declaration(expires_at,id) WHERE state='declared' AND expires_at IS NOT NULL;
```

Field contests preserve both visible and suggested truth without community overwrite.

```sql
CREATE TABLE venue_private.field_contest (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('open','corroborating','operator_answered','resolved','escalated','withdrawn')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL, field_key text NOT NULL CHECK(field_key ~ '^[a-z][a-z0-9_.-]{1,95}$'), visible_revision_id uuid NOT NULL REFERENCES venue_private.spec_field_revision(id) ON DELETE RESTRICT, challenger_party_id uuid NOT NULL,
 suggested_value jsonb NULL, reason_code text NOT NULL CHECK(reason_code IN ('fact_inaccurate','source_stale','temporary_change','privacy_or_safety','unflattering_but_accurate')), evidence_ref uuid NULL, visibility text NOT NULL CHECK(visibility IN ('operator_only','participants','public_contested_marker')),
 moderation_case_id uuid NULL, resolution_code text NULL, resolved_revision_id uuid NULL REFERENCES venue_private.spec_field_revision(id) ON DELETE RESTRICT, expected_projection_version bigint NOT NULL CHECK(expected_projection_version>0)
);
CREATE INDEX field_contest_room_state_idx ON venue_private.field_contest(room_id,state,created_at DESC);
CREATE INDEX field_contest_field_idx ON venue_private.field_contest(room_id,field_key,created_at DESC);
CREATE INDEX field_contest_moderation_idx ON venue_private.field_contest(moderation_case_id) WHERE moderation_case_id IS NOT NULL;
```

Conformance is immutable and advisory; snapshots/results use references and bounded typed result JSON.

```sql
CREATE TABLE venue_private.conformance_run (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('completed','superseded')), version bigint NOT NULL CHECK(version=1), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 rider_id uuid NOT NULL, rider_version bigint NOT NULL CHECK(rider_version>0), rider_schema_version bigint NOT NULL CHECK(rider_schema_version>0), room_id uuid NOT NULL, room_spec_version bigint NOT NULL CHECK(room_spec_version>0), room_schema_version bigint NOT NULL CHECK(room_schema_version>0),
 event_conditions jsonb NOT NULL CHECK(jsonb_typeof(event_conditions)='array'), comparison_config_version bigint NOT NULL CHECK(comparison_config_version>0), results jsonb NOT NULL CHECK(jsonb_typeof(results)='array'), match_count integer NOT NULL CHECK(match_count>=0), unknown_count integer NOT NULL CHECK(unknown_count>=0), conflict_count integer NOT NULL CHECK(conflict_count>=0),
 advisory_only boolean NOT NULL DEFAULT true CHECK(advisory_only), booking_blocked boolean NOT NULL DEFAULT false CHECK(NOT booking_blocked), request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'), UNIQUE(rider_id,rider_version,room_id,room_spec_version,comparison_config_version,request_hash)
);
CREATE INDEX conformance_room_time_idx ON venue_private.conformance_run(room_id,created_at DESC);
CREATE INDEX conformance_rider_time_idx ON venue_private.conformance_run(rider_id,created_at DESC);
```

### References, RLS, Grants, and Retention

Every `owner_id`, room/party/evidence/moderation/storage/asset/rider/config identifier not backed by a displayed local FK is a versioned logical reference to its named owning shard. Transaction-time validation and reconciliation enforce source authority and revocation.

| Canonical model/table | FK and logical-reference enforcement | RLS and grants | Retention/deletion |
|---|---|---|---|
| `SpecFieldRevision` → `venue_private.spec_field_revision` | physical self-FK for `supersedes_revision_id`; `room_id` resolves to Shard 29a `Room`; owner/source/evidence refs resolve to Shards 01/06 with versions | scoped operator/contributor append RPC; public/search shaped current projection; conformance read; no UPDATE/DELETE grant | append-only history 7 years or source/legal hold; private note/evidence reference redacted on erasure |
| `AccessibilityProfile` → `venue_private.accessibility_profile` | `room_id` resolves to Shard 29a `Room`; source revision IDs are deferrably checked against `SpecFieldRevision`; owner is a versioned Shard 01 party | public publishable route view; operator projection worker writes; performer-private segments need event/mandate scope | effective versions 7 years; superseded structured truth retained for reservation snapshot |
| `MediaEvidence` → `venue_private.media_evidence` | `room_id` resolves to Shard 29a; contributor to Shard 01; storage object to BE00 storage; moderation case to Shard 06 | contributor/operator participant view; public published rendition; moderation/storage workers narrow columns | privacy removal hides rendition immediately; provenance/audit 7 years; binary follows governed storage retention |
| `StatutoryDeclaration` → `venue_private.statutory_declaration` | `room_id` resolves to Shard 29a; declarer to Shard 01; provenance/reference to the configured jurisdiction source; certificate bytes are forbidden | full operator append/read; public current declaration label only; no contributor write | declared/expired history 7 years; no certificate bytes exist to retain |
| `FieldContest` → `venue_private.field_contest` | physical FKs to visible/resolved `SpecFieldRevision`; room/challenger resolve to Shards 29a/01; evidence/case refs resolve to Shard 06 | challenger/operator/moderator shaped participant views; public contested marker only | case/evidence policy from Shard 06; resolution metadata 7 years |
| `ConformanceRun` → `venue_private.conformance_run` | rider/version resolves to Shard 30; room/spec version to Shard 29a/this companion; comparison config to BE00 versioned settings | snapshot-authorized caller and Shard 30 scoped worker; immutable INSERT/SELECT only | 24 months for ordinary runs; referenced negotiation/contract runs retained with parent lifecycle |

All tables force RLS. Definer functions pin `search_path`, assert BE00 acting context/mandate/purpose, revoke `PUBLIC`, and expose exact columns. No browser table grants exist; migration role owns. Search/feed/analytics cannot read raw evidence, private notes, exact asset value or inaccessible rider fields.

## State, Middleware, Concurrency, and Flow

| Aggregate | Legal state machine/invariant |
|---|---|
| field revision | append current → superseded; current ↔ contested marker via new revision/contest; history immutable |
| accessibility | draft → published → superseded; temporary override effective interval wins only while active and never rewrites base |
| media | pending_moderation → published/rejected; published → removed_privacy or contested_accuracy; accurate-unflattering uses contest, not erasure |
| statutory | draft → declared → expired/superseded/contested; unsupported jurisdiction stays unknown/not-stated |
| contest | `open → corroborating|operator_answered → resolved|escalated|withdrawn`; resolution appends revision, never edits evidence |
| conformance | completed immutable; superseded only by a new run on newer snapshot/config; never booking-blocking |

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation/idempotency/rate |
|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | request ID → `BE00-CORS-WEB-CREDENTIALLED` → CSRF → auth/context → strict typed-value/condition/body validation → room/field/source capability → idempotency → rate → serializable append/projection/outbox → response validation | key bound actor/route/body 30 days; current projection CAS; 60/hour actor and 20/hour room |
| `V29_06_PUBLISH_GEAR_PROVISION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict bindings/conditions → room + Shard24 authority → idempotency → rate → serializable batch revisions/outbox → response validation | all bindings one key/transaction; asset versions/hash retained 30 days; no partial publish |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict metadata/storage reference → room/source policy → idempotency → rate → moderation/provenance transaction/outbox → response validation | storage object/key unique; binding retained through moderation+30 days; binary never enters idempotency/log |
| `V29_08_READ_ACCESSIBILITY` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → auth/context → strict path/query → room visibility/route policy → effective projection → response validation | rejects idempotency key; 120/min account+party; cache key viewer/room/route/profile/override versions; no-store |
| `V29_09_CONTEST_FIELD` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict reason/value/evidence → field-class/visibility policy → idempotency → rate → serializable contest/case/outbox → response validation | key through terminal+30 days; visible projection CAS; no raw evidence in key record |
| `V29_21_EVALUATE_CONFORMANCE` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → auth/context → strict snapshots/conditions/fields → dual-snapshot authorization → idempotency/rate → snapshot load/immutable insert/outbox → response validation | unique snapshot/config/request hash; 30-day replay; unsupported/stale becomes per-field unknown, not request failure unless snapshot absent |

Every row names `BE00-CORS-WEB-CREDENTIALLED` explicitly; all failures return the operation's cited BE00 envelope.

### Operation Flows and Recovery

| Operation ID | Transaction/concurrency algorithm | Failure and recovery |
|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | lock room/field projection; authorize class/source; validate typed value/conditions/jurisdiction; CAS current; append revision and derived profile/declaration projection + events atomically | malformed/impossible rejects before write; contradictory allowed fact becomes contested, not silent overwrite; projection rebuild from revisions is deterministic |
| `V29_06_PUBLISH_GEAR_PROVISION` | authorize and batch-read Shard24 versions; compute exposure-safe bindings; lock room/gear fields; append one posture + permitted binding revisions atomically | missing authority or composed exposure suppresses exact binding; any provider/version failure rolls back batch; never mutates asset/condition |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | verify upload ownership/hash/scan; reserve evidence ID; create moderation case and pending provenance atomically; callback publishes/removes | moderation outage leaves pending, retryable; privacy removal hides rendition but keeps provenance; accurate-unflattering challenge creates contest |
| `V29_08_READ_ACCESSIBILITY` | load audience-specific current profile and effective overrides; exclude unknown by default unless explicit flag; render source age/caveats and announcement | projection/source timeout returns unavailable/degraded, never “accessible”; audience and performer segments cannot cross-leak |
| `V29_09_CONTEST_FIELD` | lock current projection; validate contestable class; insert immutable contest; safe configured factual classes may append auto revision; otherwise case workflow | commercial/statutory never auto-apply; race yields stale version; case outage leaves open/escalation retry, visible truth preserved |
| `V29_21_EVALUATE_CONFORMANCE` | authorize/fetch exact snapshots; map schemas; compare each field under bounded conditions/config; write immutable results/summary/outbox | missing snapshots fail; incompatible/stale individual fields become unknown where mapper can safely run; no result changes booking/negotiation state |

### External Seams

| Seam | Exact request → response | Timeout, retry/backoff, circuit behavior |
|---|---|---|
| Shard 01 authority | `{actingPartyId,roomId,fieldClass,capability,contextVersion}` → `{allowed,mandateVersion,reasonCode}` | 250 ms; 1 retry after 25 ms; opens after 15 failures/30 s for 30 s; open circuit fails closed |
| Shard 24 register projection | `{actingPartyId,roomId,assetRefs:[{id,version}],purpose}` → `{authorizedAssets:[{id,version,quantity,visibility}],projectionVersion}` | 600 ms; 1 retry after 75 ms; opens after 10 failures/30 s for 30 s; open circuit rolls back/suppresses detail, never invents gear |
| Shard 06 evidence/moderation | `{objectId,objectType,sourceRef,contentHash,policyVersion}` → `{caseId,state,safeReason,policyVersion}` | 1,500 ms; 2 retries after 150/450 ms; opens after 6 failures/60 s for 60 s; mutation remains pending/open, never auto-publishes/resolves |
| governed storage/media scan | `{storageObjectId,ownerPartyId,purpose}` → `{exists,owned,scanState,contentHash,renditionRef}` | 1,000 ms; 2 retries after 100/300 ms; opens after 8 failures/60 s for 60 s; no evidence row commits unless safe scan state proven |
| jurisdiction profile | `{countryCode,jurisdictionCode,at}` → `{supported,profileVersion,allowedSlots,expiryRules}` | 500 ms; 1 retry after 50 ms; opens after 10 failures/30 s for 30 s; unsupported/outage returns unknown and forbids statutory claim |
| rider/spec snapshot loader | `{riderId,riderVersion,roomId,specVersion,fieldKeys,viewerPartyId}` → `{authorized,riderFields,specFields,schemaVersions,digests}` | 1,200 ms; 2 retries after 100/300 ms; opens after 8 failures/60 s for 60 s; absent snapshot fails, field mapper uncertainty becomes unknown |
| outbox dispatcher | `{eventId,eventType,aggregateRef,aggregateVersion,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries after 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; durable outbox drains later |

## Event Contracts

```ts
const EventBase=z.object({event_id:UUID,event_type:z.string().min(1).max(96),schema_version:z.literal("1"),occurred_at:Instant,actor_ref:UUID.nullable(),acting_party_ref:UUID.nullable(),aggregate_ref:UUID,aggregate_version:Version,correlation_id:UUID,causation_id:UUID.nullable(),idempotency_key:z.string().min(8).max(128),payload:JsonValueSchema}).strict();
export const VenueSpecFieldRevised=EventBase.extend({event_type:z.literal("venue.spec.field.revised"),payload:z.object({roomId:UUID,fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/),revisionId:UUID,provenanceRef:UUID.nullable(),contestState:z.enum(["clear","contested"]),freshnessState:z.enum(["fresh","aged","expired"])}).strict()}).strict();
export const VenueAccessibilityOverridden=EventBase.extend({event_type:z.literal("venue.accessibility.overridden"),payload:z.object({roomId:UUID,routeClass:z.enum(["audience","performer_crew"]),segmentCode:z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),truthState:TruthState,effectiveFrom:Instant,effectiveUntil:Instant,sourceRef:UUID.nullable()}).strict()}).strict();
export const VenueFieldContested=EventBase.extend({event_type:z.literal("venue.field.contested"),payload:z.object({contestId:UUID,roomId:UUID,fieldKey:z.string().regex(/^[a-z][a-z0-9_.-]{1,95}$/),visibleRevisionId:UUID,challengerSourceClass:z.enum(["operator","first_hand","community","shard24_register","moderator_outcome"]),moderationCaseId:UUID.nullable()}).strict()}).strict();
export const VenueConformanceCompleted=EventBase.extend({event_type:z.literal("venue.conformance.completed"),payload:z.object({runId:UUID,riderId:UUID,riderVersion:Version,roomId:UUID,roomSpecVersion:Version,summary:z.object({match:z.int().nonnegative(),unknown:z.int().nonnegative(),conflict:z.int().nonnegative()}).strict(),fieldResultRefs:z.array(UUID).max(200)}).strict()}).strict();
```

Events are transactional-outbox records; consumers dedupe `event_id`, order by aggregate version, reauthorize and tolerate unknown optional fields. Payloads contain references, not evidence/media, private rider data, asset value or full provider objects.

## Errors, Recovery, and Observability

| Operation ID | Status/domain errors | Safe recovery |
|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | 422 `FIELD_UNKNOWN`/`VALUE_INVALID`/`SOURCE_FORBIDDEN`/`CONDITION_UNSUPPORTED`; 409 `STALE_VERSION`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | correct typed field/condition/source or refresh current projection; prior revision unchanged |
| `V29_06_PUBLISH_GEAR_PROVISION` | 422 `ASSET_AUTHORITY_REQUIRED`/`COMPOSED_EXPOSURE_RISK`; 409 stale/idempotency; 403; 404; 429; 503 | reauthorize assets or accept category/suppressed projection; no partial bindings |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | 422 `MEDIA_UNSAFE`/`SOURCE_FORBIDDEN`; 409 idempotency; 403; 404; 429; 503 | replace/verify upload or await moderation; no binary/evidence leakage |
| `V29_08_READ_ACCESSIBILITY` | 422 invalid route/query; 403; 404; 429; 503 | correct route or retry; dependency uncertainty never maps to accessible |
| `V29_09_CONTEST_FIELD` | 422 `CONTEST_FORBIDDEN`/`VALUE_INVALID`; 409 `STALE_VERSION`/idempotency; 403; 404; 429; 503 | refresh field or use permitted contest path; visible truth remains |
| `V29_21_EVALUATE_CONFORMANCE` | 422 `SNAPSHOT_MISSING`/`SCHEMA_INCOMPATIBLE`; 409 idempotency; 403; 404; 429; 503 | acquire compatible snapshots or rerun newer version; no booking/negotiation effect |

Every response uses BE00 `ApiError { code, message, requestId, details }`; details allowlist field/safe reason/current version/retry only. Unknowns, moderation internals, evidence, exact asset/rider data and private route segments never appear.

| Operation ID | Safe logs/traces | Metrics/SLO and alert |
|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | IDs/hashes, field/class/truth/caveat counts, source class, versions/replay; no value/note/evidence | revisions/validation/contests/latency; p95 <1.2 s; alert projection mismatch |
| `V29_06_PUBLISH_GEAR_PROVISION` | actor/room IDs, posture, binding/suppression counts, Shard24 version; no asset value | batch/authority/suppression/latency; p95 <1.5 s; alert unauthorized detail >0 |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | evidence/room/object/case opaque IDs, slot/source/state/version; no media/alt content | uploads/moderation backlog/removal; p95 acceptance <1.5 s; page unsafe publication |
| `V29_08_READ_ACCESSIBILITY` | room hash, route, include flag, segment/unknown counts, versions/degraded; no private segments | read p95 <500 ms, unknown/degraded ratios; alert route cross-leak >0 |
| `V29_09_CONTEST_FIELD` | contest/room/field/case IDs, reason/source/state/version; suggested value/evidence excluded | contests/auto-apply/escalation age; p95 <1.2 s; page forbidden-class auto-apply |
| `V29_21_EVALUATE_CONFORMANCE` | run/snapshot IDs, schema/config versions, summary counts, latency/replay; no field values | run p95 <2 s, unknown/schema ratios; alert bookingBlocked truthy or mutation attempt |

Audit stores actor/context/action/target, before/after hashes, source/policy/snapshot versions, idempotency/request hashes and outcome. the structured diagnostic boundary scrubs request bodies, typed values, notes, evidence/media, accessibility private segments, assets and rider fields.

## Release and Testing

### Per-operation Tests

| Operation ID | Contract/auth/privacy tests | Idempotency/concurrency/failure/observability tests |
|---|---|---|
| `V29_05_REVISE_SPEC_FIELD` | all truth states/value branches/caveats/conditions; field-class/source authority; statutory US-only; contributor commercial denial | CAS concurrent revisions one current; replay/mismatch; invalid value no row; profile/event consistency; CORS/rate/error/redaction |
| `V29_06_PUBLISH_GEAR_PROVISION` | Shard24 authority/version/quantity; posture; category/suppressed visibility; no asset mutation/value exposure | all-or-none batch; asset seam timeout; replay; revocation reconciliation; event/audit/log assertions |
| `V29_07_ATTACH_MEDIA_EVIDENCE` | source/slot/storage ownership/alt text; moderation; privacy removal vs accurate contest; hidden room 404 | duplicate object/key; scan/moderation failure pending/no row; callback order/dedup; binary absent from telemetry |
| `V29_08_READ_ACCESSIBILITY` | audience/performer segregation; exclude unknown default; include-not-stated announcement; temporary overrides/source age | profile rollover/cache versions; dependency outage not accessible; rate/CORS/ApiError; privacy differential logs |
| `V29_09_CONTEST_FIELD` | contestable class/reasons/evidence; commercial/statutory never community-overwrite; challenger visibility | two contests serialize; safe auto-apply allowlist; moderation outage/open recovery; event/RLS/audit |
| `V29_21_EVALUATE_CONFORMANCE` | snapshot auth/schema; match/unknown/conflict; stale/unsupported unknown; advisory/nonblocking literals | unique/replay; source timeout; immutable run; event dedup; assert no reservation/negotiation write and telemetry redaction |

Also required: Zod/OpenAPI/event snapshots; SQL constraints/FKs/current-unique indexes/RLS matrix; condition property/fuzz tests; profile effective-time/DST tests; field-projection rebuild; storage/KMS/moderation chaos; conformance golden corpus/schema evolution; load tests at 200 fields; migration/rollback and erasure evidence.

## Deepening Passes

1. **Traceability:** six interactions, two source commands, six first-column models and four events are literal and owned.
2. **Truth/security:** typed states, bounded conditions, source/class authority, audience segregation, Shard 24/06/30 boundaries and safe 403/404 are exact.
3. **Persistence:** all fields, constraints, references, indexes, RLS/grants, retention and immutable histories are specified.
4. **Reliability:** CAS, append/projection transactions, batch atomicity, idempotency, outbox and explicit seam circuits/recovery close races.
5. **Testing/operations:** per-op middleware/CORS/errors/telemetry/tests plus migration, privacy, chaos and rollback gates are complete.

## Ambiguity Gate

**PASS.** Macro truth ownership, asset/evidence/rider boundaries, accessibility semantics, contest authority, statutory posture and advisory conformance are locked. Micro routes, operation IDs, schemas, enum/bounds, errors, CORS/archetypes/deadlines, rates, idempotency, SQL/RLS/grants, state/concurrency, seam resilience, telemetry and tests are exact. No unresolved or unspecified choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-29 | Initial production backend contract for Shard 29b after approved split validation. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 29 — Venues, Studios and Spaces](../ia/29-venues-spaces.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Shard 06 Trust & Safety](../ia/06-trust-safety.md)
- [Shard 24 Gear Holdings & Operations](../ia/24-gear-holdings-operations.md)
- [Shard 30 Booking & Contracts](../ia/30-booking-contracts.md)
