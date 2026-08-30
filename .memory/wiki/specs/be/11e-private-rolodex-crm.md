# Private Rolodex & CRM — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/11-community-graph.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. COM-16–COM-18 require owner-scoped encrypted records, explicit canonical reconciliation, prohibited-content enforcement, transactional reference movement, private scheduling/delivery evidence, audit, and recovery.
- **Boundary:** owns the private rolodex only: shadow contacts, private notes/tags, reminders, and CRM audit events. Canonical identity confirmation, KMS, scheduler, and author-only notification are external seams. No feed/search/ranking/endorsement/referral/safety consumer receives CRM content.
- **Split validation:** approved `11e` is the exact contiguous IA CRM cluster. It has no dependency on subject consent/reachability because the subject is never contacted or made aware.
- **Inherited from BE00:** HTTPS JSON, request/session/acting context, CORS allowlist, idempotency ledger, transaction/outbox, common audit/redaction, rate headers, and `ApiError { code, message, requestId, details }`.

## Referenced Material Inventory

| Material | Sections / lines | Used contract |
|---|---:|---|
| IA Shard 11 | Overview/scope, lines 9–24 | owner-private graph boundary |
| IA Shard 11 | AC-COM-16–AC-COM-18, lines 51–53 | explicit reconciliation, B5 validation, private reminder invariants |
| IA Shard 11 | Interactions COM-16–COM-18, lines 74–76 | exact mutations, results, failures and recovery |
| IA Shard 11 | Core/CRM contracts, lines 87–122 | `CreateShadowContact`, `WritePrivateNote`, `StandardError` |
| IA Shard 11 | Data Models/field registry, lines 124–173 | `shadow_contact`, `private_contact_note`, `private_contact_tag`, `follow_up_reminder`, `community_audit_event` |
| IA Shard 11 | Access Control/Escalation, lines 174–196 | owner-only access, support/admin limits |
| IA Shard 11 | Event Schemas, lines 207–220 | `community.crm-reminder.due.v1` |
| IA Shard 11 | Edge cases/coverage, lines 223–267 | no auto-merge, prohibited content, delivery retry, deletion |
| Architecture/Data Placement/Engineering Standards | PII, data, security, testing sections | owner-purpose encryption, Supabase, Zod 4, audit/TDD |
| BE00 | all global sections | ordered requestId/CORS/auth/validation middleware, `ApiError { code, message, requestId, details }`, audit/outbox, and the numeric rate/idempotency defaults stated per operation below |

## IA Source Map

| Interaction | Operation ID | Locked effect | Canonical artifacts |
|---|---|---|---|
| COM-16 | `COM16_SHADOW_CONTACT_ACTION` | create owner-private shadow contact or explicitly reconcile it to one confirmed canonical target | `CreateShadowContact`, `shadow_contact` |
| COM-17 | `COM17_PRIVATE_CONTEXT_ACTION` | create/update/delete bounded encrypted note/tag/list value after B5 validation | `WritePrivateNote`, `private_contact_note`, `private_contact_tag` |
| COM-18 | `COM18_FOLLOW_UP_REMINDER_ACTION` | schedule/snooze/cancel author-only reminder; reconciliation moves its contact reference | `follow_up_reminder`, `community_audit_event`, `community.crm-reminder.due.v1` |

## Endpoint Reconciliation and Shared Inheritance

These are private domain mutations, not identity, messaging, notification, or BE00 platform routes. They never create a canonical person, send contact consent, infer reachability, deduplicate across owners, or expose subject existence. Each action route is a discriminated union so one IA interaction retains one authoritative operation ID.

All routes use `BE00-CORS-WEB-CREDENTIALLED`: exact configured production origins, credentials, registered JSON/idempotency/conditional headers, session-bound CSRF, and operation-specific preflight only; wildcard/`null` origins fail. COM-16–COM-18 inherit BE00's **ordinary command** archetype (`no-store`, exact 15,000 ms deadline, current version, atomic audit/outbox); reminder delivery is post-commit worker activity, not an open HTTP acceptance.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | `POST /api/v1/community/crm/shadow-contact-actions` | COM-16 | `200 ShadowContactActionResult` | required; BE00 30-day hash-bound replay | 60/h per account + CRM owner |
| `COM17_PRIVATE_CONTEXT_ACTION` | `POST /api/v1/community/crm/private-contact-context-actions` | COM-17 | `200 PrivateContextActionResult` | required; BE00 30-day hash-bound replay | 120/h per account + CRM owner |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | `POST /api/v1/community/crm/follow-up-reminder-actions` | COM-18 | `200 FollowUpReminderActionResult` | required; retained through scheduled occurrence + 30 days | 120/h per account + author; max 2,000 active |

### Operation Contract Matrix

| Operation ID | Request | Success | Error | Authorization |
|---|---|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | `ShadowContactActionRequest` containing `CreateShadowContact` | `ShadowContactActionResult` | BE00 `ApiError { code, message, requestId, details }` | CRM owner person and acting party exactly match session; contact owner only |
| `COM17_PRIVATE_CONTEXT_ACTION` | `PrivateContextActionRequest` containing `WritePrivateNote` branches | `PrivateContextActionResult` | BE00 `ApiError { code, message, requestId, details }` | contact and context row belong to acting owner; foreign UUID concealed |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | `FollowUpReminderActionRequest` | `FollowUpReminderActionResult` | BE00 `ApiError { code, message, requestId, details }` | reminder author equals acting owner and contact belongs to same owner |

## Zod 4 Contracts

```ts
import { z } from "zod";
const Uuid=z.uuid(); const Version=z.int().min(1); const Iso=z.iso.datetime({offset:true}); const RequestId=z.uuid();
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const jsonDepth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(jsonDepth)):1+Math.max(0,...Object.values(v).map(jsonDepth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(jsonDepth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
const ErrorCode=z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
export const StandardError=z.enum(["VALIDATION_FAILED","FORBIDDEN","ACTING_CONTEXT_STALE","VERSION_CONFLICT","IDEMPOTENCY_MISMATCH","BLOCKED_ROUTE","EVIDENCE_INELIGIBLE","PATH_UNCITABLE","BROKER_CAP_REACHED","RATE_LIMITED","CRM_CONTENT_PROHIBITED"]);
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();

const PrivateContactInput=z.object({displayName:z.string().trim().min(1).max(120),email:z.email().max(254).nullable(),phoneE164:z.string().regex(/^\+[1-9]\d{7,14}$/).nullable(),organization:z.string().trim().max(120).nullable()}).strict().superRefine((v,c)=>{if(v.email===null&&v.phoneE164===null)c.addIssue({code:"custom",path:["email"],message:"email_or_phone_required"});});
export const CreateShadowContact=z.object({ownerPersonId:Uuid,ownerPartyId:Uuid,contact:PrivateContactInput,clientMutationId:z.string().min(8).max(128)}).strict();
const CreateContact=z.object({kind:z.literal("create"),actingPartyId:Uuid,input:CreateShadowContact}).strict();
const ReconcileContact=z.object({kind:z.literal("reconcile"),actingPartyId:Uuid,shadowContactId:Uuid,canonicalTargetPartyId:Uuid,ownerConfirmedTarget:z.literal(true),expectedVersion:Version}).strict();
export const ShadowContactActionRequest=z.discriminatedUnion("kind",[CreateContact,ReconcileContact]);
export const ShadowContactActionResult=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("create"),shadowContactId:Uuid,reconciliationState:z.literal("shadow"),version:Version,subjectNotified:z.literal(false),replayed:z.boolean()}).strict(),
 z.object({kind:z.literal("reconcile"),shadowContactId:Uuid,reconciliationState:z.literal("reconciled"),canonicalTargetPartyId:Uuid,movedReferenceCounts:z.object({notes:z.int().nonnegative(),tags:z.int().nonnegative(),reminders:z.int().nonnegative()}).strict(),subjectNotified:z.literal(false),version:Version,replayed:z.boolean()}).strict()
]);

export const WritePrivateNote=z.object({actingPartyId:Uuid,shadowContactId:Uuid,content:z.string().trim().min(1).max(2000),expectedVersion:Version.nullable()}).strict();
const NoteAction=WritePrivateNote.extend({kind:z.enum(["create_note","update_note"]),contextId:Uuid}).strict();
const TagAction=z.object({kind:z.enum(["create_tag","update_tag"]),contextId:Uuid,actingPartyId:Uuid,shadowContactId:Uuid,value:z.string().trim().min(1).max(64),listName:z.string().trim().min(1).max(64).nullable(),expectedVersion:Version.nullable()}).strict();
const DeleteContext=z.object({kind:z.literal("delete"),contextType:z.enum(["note","tag"]),contextId:Uuid,actingPartyId:Uuid,shadowContactId:Uuid,expectedVersion:Version}).strict();
export const PrivateContextActionRequest=z.discriminatedUnion("kind",[NoteAction,TagAction,DeleteContext]);
export const PrivateContextActionResult=z.object({contextId:Uuid,contextType:z.enum(["note","tag"]),state:z.enum(["active","deleted"]),version:Version,encrypted:z.literal(true),sharedComputationVisible:z.literal(false),replayed:z.boolean()}).strict();

const Recurrence=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("none")}).strict(),
 z.object({kind:z.literal("interval"),every:z.int().min(1).max(365),unit:z.enum(["day","week","month"]),endsAt:Iso.nullable()}).strict()
]);
const ScheduleReminder=z.object({kind:z.literal("schedule"),reminderId:Uuid,actingPartyId:Uuid,shadowContactId:Uuid,dueAt:Iso,recurrence:Recurrence,expectedVersion:Version.nullable()}).strict();
const SnoozeReminder=z.object({kind:z.literal("snooze"),reminderId:Uuid,actingPartyId:Uuid,newDueAt:Iso,expectedVersion:Version}).strict();
const CancelReminder=z.object({kind:z.literal("cancel"),reminderId:Uuid,actingPartyId:Uuid,expectedVersion:Version}).strict();
export const FollowUpReminderActionRequest=z.discriminatedUnion("kind",[ScheduleReminder,SnoozeReminder,CancelReminder]);
export const FollowUpReminderActionResult=z.object({reminderId:Uuid,state:z.enum(["scheduled","due","delivered","delivery_failed_retryable","snoozed","cancelled"]),dueAt:Iso,recurrence:Recurrence,version:Version,contactNotified:z.literal(false),replayed:z.boolean()}).strict();
```

For source-contract traceability, `NoteAction`'s create/update branch is the executable expansion of `WritePrivateNote`; both literal identifiers are present. Dates must be at least one minute and at most ten years in the future for schedule/snooze. B5 content validation runs before encryption/persistence and returns only an allowlisted category code; raw rejected content is never stored, indexed, logged, traced, or sent to provider-native diagnostics.

## Authorization and Disclosure

| Operation ID | Role/ownership | Required checks | 403 vs 404 / disclosure |
|---|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | authenticated owner person acting through its own party | owner IDs equal session; create always new owner-local record; reconcile requires explicit target confirmation and current version | mismatched owner IDs 403; foreign/unknown shadow contact 404; canonical target existence is disclosed only after owner-confirmed authorized lookup; subject never notified |
| `COM17_PRIVATE_CONTEXT_ACTION` | same owner only | contact and note/tag owner tuple equals session; content passes local B5 policy; context belongs to named contact | foreign contact/context 404; self request failing content policy 422 `CRM_CONTENT_PROHIBITED`; no support/admin content read |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | reminder author acting for self | reminder and contact share owner; due/recurrence valid; active-count cap | foreign reminder/contact 404; valid self but stale acting context 409; contact reachability/consent is intentionally not queried or disclosed |

There is no cross-owner deduplication or co-reference. Search, feed, ranking, endorsement, referral, messaging, moderation training, analytics, and general safety services receive neither raw nor derived CRM content. Break-glass database access can inspect ciphertext/metadata only, never plaintext, and is dual-approved/audited.

## Database Schema

```sql
CREATE TABLE shadow_contact (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, owner_person_id uuid NOT NULL, owner_party_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','deleted')), display_name_ciphertext bytea NOT NULL CHECK(octet_length(display_name_ciphertext) BETWEEN 1 AND 1024),
 email_ciphertext bytea NULL CHECK(email_ciphertext IS NULL OR octet_length(email_ciphertext)<=1024), phone_ciphertext bytea NULL CHECK(phone_ciphertext IS NULL OR octet_length(phone_ciphertext)<=512), organization_ciphertext bytea NULL CHECK(organization_ciphertext IS NULL OR octet_length(organization_ciphertext)<=1024),
 owner_local_match_hashes bytea[] NOT NULL DEFAULT '{}', encryption_key_version smallint NOT NULL CHECK(encryption_key_version>0), reconciliation_state text NOT NULL CHECK(reconciliation_state IN ('shadow','reconciled')),
 canonical_target_party_id uuid NULL, reconciled_at timestamptz NULL, reconciliation_evidence jsonb NULL CHECK(reconciliation_evidence IS NULL OR jsonb_typeof(reconciliation_evidence)='object'),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, deleted_at timestamptz NULL,
 CHECK(owner_id=owner_party_id), CHECK((reconciliation_state='reconciled')=(canonical_target_party_id IS NOT NULL AND reconciled_at IS NOT NULL)), UNIQUE(owner_party_id,id)
);
CREATE INDEX shadow_contact_owner_idx ON shadow_contact(owner_party_id,updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX shadow_contact_owner_person_idx ON shadow_contact(owner_person_id,owner_party_id) WHERE deleted_at IS NULL;
CREATE INDEX shadow_contact_target_idx ON shadow_contact(owner_party_id,canonical_target_party_id) WHERE canonical_target_party_id IS NOT NULL AND deleted_at IS NULL;
```

Notes are separately encrypted and non-shareable by schema.

```sql
CREATE TABLE private_contact_note (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, owner_person_id uuid NOT NULL, owner_party_id uuid NOT NULL, shadow_contact_id uuid NOT NULL, content_ciphertext bytea NOT NULL CHECK(octet_length(content_ciphertext) BETWEEN 1 AND 8192),
 content_key_version smallint NOT NULL CHECK(content_key_version>0), content_policy_version bigint NOT NULL CHECK(content_policy_version>0), content_policy_result text NOT NULL CHECK(content_policy_result='allowed'),
 state text NOT NULL CHECK(state IN ('active','deleted')), version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, deleted_at timestamptz NULL,
 CHECK(owner_id=owner_party_id), FOREIGN KEY(owner_party_id,shadow_contact_id) REFERENCES shadow_contact(owner_party_id,id) ON DELETE RESTRICT
);
CREATE INDEX private_note_contact_idx ON private_contact_note(owner_party_id,shadow_contact_id,updated_at DESC) WHERE state='active';
CREATE INDEX private_note_owner_idx ON private_contact_note(owner_party_id,updated_at DESC) WHERE state='active';
```

Tags/lists carry encrypted owner vocabulary, never global facets.

```sql
CREATE TABLE private_contact_tag (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, owner_person_id uuid NOT NULL, owner_party_id uuid NOT NULL, shadow_contact_id uuid NOT NULL, value_ciphertext bytea NOT NULL CHECK(octet_length(value_ciphertext) BETWEEN 1 AND 1024),
 list_name_ciphertext bytea NULL CHECK(list_name_ciphertext IS NULL OR octet_length(list_name_ciphertext)<=1024), content_key_version smallint NOT NULL CHECK(content_key_version>0), content_policy_version bigint NOT NULL CHECK(content_policy_version>0),
 content_policy_result text NOT NULL CHECK(content_policy_result='allowed'), state text NOT NULL CHECK(state IN ('active','deleted')), version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, deleted_at timestamptz NULL,
 CHECK(owner_id=owner_party_id), FOREIGN KEY(owner_party_id,shadow_contact_id) REFERENCES shadow_contact(owner_party_id,id) ON DELETE RESTRICT
);
CREATE INDEX private_tag_contact_idx ON private_contact_tag(owner_party_id,shadow_contact_id,updated_at DESC) WHERE state='active';
CREATE INDEX private_tag_owner_idx ON private_contact_tag(owner_party_id,updated_at DESC) WHERE state='active';
```

Reminder delivery evidence is metadata-only and author-scoped.

```sql
CREATE TABLE follow_up_reminder (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, author_person_id uuid NOT NULL, author_party_id uuid NOT NULL, shadow_contact_id uuid NOT NULL, due_at timestamptz NOT NULL, recurrence jsonb NOT NULL CHECK(jsonb_typeof(recurrence)='object'),
 source text NOT NULL DEFAULT 'owner_crm' CHECK(source='owner_crm'), state text NOT NULL CHECK(state IN ('scheduled','due','delivered','delivery_failed_retryable','snoozed','cancelled')),
 delivery_attempts smallint NOT NULL DEFAULT 0 CHECK(delivery_attempts BETWEEN 0 AND 20), last_delivery_at timestamptz NULL, last_delivery_receipt text NULL CHECK(last_delivery_receipt IS NULL OR length(last_delivery_receipt)<=256),
 next_attempt_at timestamptz NULL, version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 CHECK(owner_id=author_party_id), FOREIGN KEY(author_party_id,shadow_contact_id) REFERENCES shadow_contact(owner_party_id,id) ON DELETE RESTRICT
);
CREATE INDEX reminder_due_idx ON follow_up_reminder(due_at,id) WHERE state IN ('scheduled','snoozed');
CREATE INDEX reminder_retry_idx ON follow_up_reminder(next_attempt_at,id) WHERE state='delivery_failed_retryable';
CREATE INDEX reminder_author_idx ON follow_up_reminder(author_party_id,due_at DESC);
```

CRM audit rows use hashes/IDs only and are append-only.

```sql
CREATE TABLE community_audit_event (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, owner_person_id uuid NOT NULL, owner_party_id uuid NOT NULL, state text NOT NULL DEFAULT 'committed' CHECK(state='committed'), version bigint NOT NULL DEFAULT 1 CHECK(version=1), actor_account_id uuid NOT NULL, acting_context_version bigint NOT NULL CHECK(acting_context_version>0),
 action text NOT NULL CHECK(action IN ('shadow_contact.created','shadow_contact.reconciled','private_note.written','private_tag.written','private_context.deleted','reminder.scheduled','reminder.snoozed','reminder.cancelled','reminder.delivered','reminder.delivery_failed')),
 target_type text NOT NULL CHECK(target_type IN ('shadow_contact','private_contact_note','private_contact_tag','follow_up_reminder')), target_id uuid NOT NULL, before_hash bytea NULL CHECK(before_hash IS NULL OR octet_length(before_hash)=32),
 after_hash bytea NULL CHECK(after_hash IS NULL OR octet_length(after_hash)=32), evidence_json jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(evidence_json)='object'), request_hash bytea NOT NULL CHECK(octet_length(request_hash)=32), request_id text NOT NULL CHECK(length(request_id) BETWEEN 16 AND 128), occurred_at timestamptz NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, CHECK(owner_id=owner_party_id)
);
CREATE INDEX community_audit_owner_time_idx ON community_audit_event(owner_party_id,occurred_at DESC);
CREATE INDEX community_audit_target_idx ON community_audit_event(target_type,target_id,occurred_at DESC);
CREATE UNIQUE INDEX community_audit_request_action_uq ON community_audit_event(request_id,action,target_id);
```

### References, RLS, Grants, Retention

Every `owner_id`, owner/author person or party, actor account and canonical target identifier is a versioned logical reference to Shard 01 unless the displayed same-domain composite FK applies; authorization validates the referenced version and reconciliation never auto-merges it.

| Table | References | RLS/grants | Retention/deletion |
|---|---|---|---|
| `shadow_contact` | owner person/party and confirmed canonical target are versioned identity logical refs; no automatic FK merge | RLS owner tuple only through CRM API; reconciliation worker scoped to same owner; no direct client/service-wide grants | owner-controlled deletion; 30-day encrypted recovery then key destruction; reconciliation metadata 7 years |
| `private_contact_note` | composite FK enforces same-owner contact | owner API function only; KMS purpose `crm-note`; no SELECT to search/feed/ranking/admin | delete ciphertext immediately after recovery/hold; metadata 30 days |
| `private_contact_tag` | composite FK enforces same-owner contact | owner API function only; KMS purpose `crm-tag`; no shared facet/index grant | same as notes |
| `follow_up_reminder` | composite FK enforces same-owner contact; author identity logical ref | owner API SELECT/WRITE; scheduler metadata SELECT/UPDATE; notifier gets author/delivery token only | terminal delivery metadata 24 months; cancelled 90 days unless audit hold |
| `community_audit_event` | target is polymorphic immutable ID; owner/account logical refs | append-only domain API/worker INSERT; compliance audit shaped SELECT; owner gets export metadata only | 7 years; legal hold extends; no raw CRM content ever present |

No `anon` or `authenticated` table grants. Owner-scoped definer functions fix `search_path`, assert JWT owner IDs, and return decrypted content only to the same active session after KMS purpose authorization. Owner-local match hashes use per-owner keyed HMAC, preventing cross-owner correlation. Reconciliation changes `canonical_target_party_id` and re-points owned child references in one transaction; it never merges/deletes another owner record.

## State, Middleware, Concurrency, and Flow

| Aggregate | Legal state machine |
|---|---|
| shadow contact | shadow → reconciled; reconciliation target may change only through a new explicit confirmed action and audit version; delete is soft then key destruction |
| note/tag | absent → active → active(versioned) → deleted; prohibited content never reaches absent→active |
| reminder | scheduled ↔ snoozed → due → delivered; due → delivery_failed_retryable ↔ due; any pre-delivered state → cancelled |
| audit | append only; correction is a new event, never mutation/deletion |

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation/idempotency/rate |
|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | BE00 request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → discriminated body validation → owner authorization → idempotency → 60/h/account and owner → identity/KMS/serializable transaction/audit → response validation | key required, route/owner/body hash, 30-day replay; reconcile CAS; create client ID prevents duplicate contact mutation but not owner-local dedupe/merge |
| `COM17_PRIVATE_CONTEXT_ACTION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → strict body validation → owner/contact authorization → local B5 validation → idempotency → 120/h/account and owner → KMS/transaction/audit → response validation | B5 before persistence/logging; key required 30 days; CAS update/delete; no raw content in idempotency record—only keyed request hash |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` allowlist/preflight → CSRF → auth → acting context → body/time validation → owner/contact authorization → idempotency → rate/active-cap → serializable transaction/audit/outbox → response validation | key retained through occurrence + 30 days; CAS snooze/cancel; 120/h/account and author and 2,000 active author cap |

### Operation Flows and Recovery

| Operation ID | Algorithm/concurrency | Failure/recovery boundary |
|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | create encrypts each field with owner/purpose data key and stores owner-local hashes; reconcile locks contact, verifies explicit canonical target, CASes, atomically updates reconciliation provenance and child references | KMS/identity failure commits nothing; competing reconcile one winner; failed re-point rolls back all children, preserving shadow refs; no event/notification to subject |
| `COM17_PRIVATE_CONTEXT_ACTION` | normalize in memory; deterministic local B5 rules reject special-category data/unverified allegations; owner authorization precedes KMS encryption; insert/update/delete and metadata-only audit atomically | rejected text is zeroed and never persisted/logged; KMS failure commits nothing; CAS loser preserves prior ciphertext; delete revokes key then tombstones metadata |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | lock author/contact/reminder; validate time/recurrence/cap; schedule durable due event; worker leases due row with `SKIP LOCKED`, increments attempts; author-only notification receipt transitions delivered | provider failure records evidence and retry time, not delivered; retry same delivery key with exponential delay; reconciliation moves FK under same owner transaction; contact never targeted |

### External Seams

| Seam | Exact request → response | Timeout/retry/backoff/circuit breaker |
|---|---|---|
| identity target confirmation | `{ownerPersonId,ownerPartyId,canonicalTargetPartyId,ownerConfirmed:true,actingContextVersion}` → `{authorized,canonicalTargetVersion}` | 250 ms; 1 retry at 30 ms; opens after 10 failures/30 s for 30 s; reconcile fails closed with 503, create unaffected |
| KMS encrypt/decrypt | `{ownerPersonId,purpose,keyVersion?,plaintext}` → `{ciphertext,keyVersion}` / `{plaintext}` | 500 ms; 2 retries at 50/150 ms for transport only; opens after 6 failures/60 s for 60 s; no plaintext persistence/fallback, request fails 503 |
| due scheduler | `{reminderId,authorPartyId,dueAt,version}` → `{accepted,scheduleReceipt}` | 800 ms; 3 retries at 100/300/900 ms; opens after 8 failures/60 s for 60 s; durable outbox remains pending and DB due scan is authoritative |
| author-only notifier | `{deliveryKey,authorPartyId,reminderId,dueAt,channelPreferences}` → `{accepted,deliveryReceipt}` | 1,500 ms; 4 retries at 1/5/30/120 s then worker backoff; opens after 8 failures/60 s for 60 s; row remains `delivery_failed_retryable`, never targets contact |
| outbox publisher | `{eventId,type,aggregateId,version,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries at 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; durable outbox later resumes |

The B5 prohibited-content validator is an in-process, version-pinned allow/deny module, not a network seam: `{normalizedText}` → `{allowed, safeCategoryCode, policyVersion}` within 20 ms CPU budget. It stores/returns no text and fails closed on exception.

## Event Contracts

```ts
export const CommunityCrmReminderDue=z.object({eventId:Uuid,type:z.literal("community.crm-reminder.due.v1"),occurredAt:Iso,requestId:RequestId,aggregateVersion:Version,payload:z.object({reminderId:Uuid,authorPartyId:Uuid,shadowContactId:Uuid,dueAt:Iso,version:Version,deliveryKey:z.string().min(16).max(128)}).strict()}).strict();
```

Only the author-notification worker may consume this event. It carries no contact name/address, note/tag, canonical target, recurrence detail, or subject delivery target. Transactional outbox insert is atomic; consumer deduplicates `deliveryKey`, verifies current reminder version/state/author, and marks stale or cancelled events no-op.

## Errors, Recovery, and Observability

| Operation ID | Status/code set | Safe details/recovery |
|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | 422 `VALIDATION_FAILED`; 401 `UNAUTHENTICATED`; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `ACTING_CONTEXT_STALE`/`VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | field/currentVersion for owner only; foreign record/target concealed; KMS/identity generic retry; subject gets no signal |
| `COM17_PRIVATE_CONTEXT_ACTION` | 422 `VALIDATION_FAILED`/`CRM_CONTENT_PROHIBITED`; 404 `NOT_FOUND`; 409 `VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | safe B5 category code and explanation key, never rejected text; foreign row concealed; retry KMS only with same key/body |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | 422 `VALIDATION_FAILED`; 404 `NOT_FOUND`; 409 `ACTING_CONTEXT_STALE`/`VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; 429 `RATE_LIMITED`; 503 `DEPENDENCY_UNAVAILABLE` | safe time/cap/currentVersion; delivery failure after commit is returned state and retried; no contact consent/reachability details |

Every non-2xx body is exactly BE00 `ApiError { code, message, requestId, details }`. No error/log/trace includes plaintext contact fields, notes, tags, list names, owner-local hashes, ciphertext, keys, notification contents, canonical identity details, or prohibited input.

| Operation ID | Structured logs/traces | Metrics/alerts |
|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | operation/request IDs, owner/contact opaque hashes, action, reconciliation state, moved counts, versions, replay, latency; no target/contact data | creates/reconciles/conflicts, KMS/identity failures, transaction latency; page partial-reference invariant count >0 |
| `COM17_PRIVATE_CONTEXT_ACTION` | owner/contact/context opaque hashes, type/action, policy version/result code, ciphertext byte bucket, versions/replay; plaintext absent | writes/rejections by safe category, CAS/replay/KMS failure; page any raw-content scrub detector hit |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | owner/reminder/contact hashes, action/state, due-time bucket, attempts, version/replay; no content | active/due/delivered/retry backlog, delivery latency, scheduler lag; page overdue p95 >10 min or contact-target violation >0 |

`community_audit_event` carries exact actor/context/action/target and hashes but never plaintext. provider-native diagnostics before-send drops request bodies for all `/crm/` routes and removes SQL bind values. KMS access, break-glass attempts, exports, and policy rejections are separately auditable.

## Verification and Test Strategy

### Per-operation Tests

| Operation ID | Contract/auth/privacy tests | Idempotency/concurrency/failure/telemetry tests |
|---|---|---|
| `COM16_SHADOW_CONTACT_ACTION` | strict contact/owner schema; owner tuple; foreign 404; no subject signal; no auto email/name/cross-owner merge; reconcile requires literal confirmation/target | replay no duplicate; two reconciles one winner; child refs all-or-none; KMS/identity failure rollback; audit/log contains hashes only; CORS/rate/ApiError |
| `COM17_PRIVATE_CONTEXT_ACTION` | bounds; same-owner composite relation; B5 special-category and unverified-allegation fixtures reject; schema proves no shared field/export | replay/mismatch; concurrent CAS; rejected input absent from DB/outbox/log/provider-native diagnostics; KMS failure rollback; deletion key revocation; RLS/search/feed denial |
| `COM18_FOLLOW_UP_REMINDER_ACTION` | due/recurrence branches; owner/contact; active cap; only author notification; no contact reachability call | schedule/snooze/cancel CAS/replay; lease race one delivery; provider failure retryable not delivered; reconciliation moves ref; stale event no-op; telemetry redacted |

Additional suites: Zod/OpenAPI/event snapshots; SQL checks/composite FKs/index plans; RLS/grant matrix for owner/foreign/admin/search/feed/scheduler/notifier; KMS purpose/key-rotation/deletion tests; B5 policy golden corpus and exception fail-closed test; transaction fault injection at every reconciliation statement; scheduler clock/DST/property tests; outbox dedup/order; ciphertext entropy/no-plaintext scans; backup/restore deletion-key proof; load tests at 2,000 active reminders.

Release gates: backward-compatible OpenAPI diff, migration/rollback rehearsal, RLS/grant proof, encrypted backup restore test, cross-owner correlation negative test, B5 corpus approval, reconciliation invariant query, scheduler/notifier circuit drill, provider-native diagnostics/log scrub scan, dashboards/alerts. Rollback freezes writes, drains private outbox, retains encrypted/audit truth, and never decrypts or exports data for migration convenience.

## Deepening Passes

1. **Traceability/contracts:** COM-16–COM-18, `CreateShadowContact`, `WritePrivateNote`, all five canonical models and the reminder event have exact owners/contracts.
2. **Privacy/security:** owner tuple, RLS/grants, purpose encryption, owner-local HMAC, B5 pre-persistence validation, structural consumer exclusion and 403/404 shaping close disclosure paths.
3. **Data:** every domain field has SQL type/nullability/check, physical/logical reference handling, indexes, retention/deletion, and immutable audit behavior.
4. **Concurrency/recovery:** CAS/idempotency, one-transaction reconciliation, leased delivery, stable delivery keys, bounded seam resilience and explicit retry states prevent partial truth.
5. **Operations/tests:** each operation names CORS/auth/rate/validation, BE00 errors, observability/alerts and contract/auth/privacy/concurrency/failure tests.

## Ambiguity Gate

**PASS.** Macro ownership, privacy classification, reconciliation authority, prohibited-content policy, subject non-disclosure, reminder recipient, persistence and failure recovery are closed. Micro routes, operation IDs, schema bounds, SQL types/nullability/constraints/FKs/indexes/RLS/grants, states, errors, 403/404, CORS, rates, key retention, KMS/scheduler/notifier timeout-retry-backoff-circuit behavior, telemetry, tests and rollback are exact. All markers and decisions are explicitly bound.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for COM-16–COM-18; approved companion boundary validated. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 11 — Community Graph](../ia/11-community-graph.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Data Placement Strategy](../data-placement-strategy.md)
- [Shard 01 Identity & Authority](../ia/01-identity-authority.md)
