# Advance Checklist, Freeze and Change Control — Backend Specification

## Split Group

- IA source: ../ia/32-show-production-planning.md.
- Assigned interactions: 32.10 Generate advance checklist, 32.11 Answer/confirm item, 32.13 Render advance sheet, 32.14 Freeze advance and 32.15 Change frozen plan.
- Owned aggregates: AdvanceItem, AdvanceFreeze, CriticalAcknowledgment and AdvanceSheet.
- Owned events: production.advance.item_changed, production.advance.frozen and production.advance.changed_after_freeze.
- Boundary: matches create no checklist item; judgement remains explicit. Self-confirmation is disclosed and cannot silently complete bilateral work. Freeze preserves unresolved hard items. Critical post-freeze changes remain at-risk until required acknowledgments arrive.

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 32.10 | POST | /api/v1/production/events/{eventId}/advance-checklist-generations | 201 AdvanceChecklistV1 |
| 32.11 | POST | /api/v1/production/advance-items/{itemId}/responses | 201 AdvanceItemV1 |
| 32.13 | POST | /api/v1/production/events/{eventId}/advance-sheets | 202 AdvanceSheetV1 |
| 32.14 | POST | /api/v1/production/events/{eventId}/advance-freezes | 201 AdvanceFreezeV1 |
| 32.15 | POST | /api/v1/production/events/{eventId}/frozen-plan-changes | 201 FrozenPlanChangeV1 |

References: ../ia/32-show-production-planning.md, 00-infrastructure.md and companions 32a/32b/32c.

## Shared Contract Inheritance

All failures use ApiError { code, message, requestId, details }. Safe details include item/change IDs, current version, missing role and severity only. Browser writes require credentialled CORS, CSRF, strict Zod, event/side mandate, Idempotency-Key and If-Match. Scoped external response links are single-purpose, hashed, expiring and cannot browse the event.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 32](../ia/32-show-production-planning.md) | Interactions lines 68–88; Contracts lines 89–107; Data Models lines 108–151; Access Control lines 152–177; Event Schemas and Edge Cases lines 187–217 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.03 Show Advancing | 32.10, 32.11, and 32.13–32.15 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 32.10 | POST | /api/v1/production/events/{eventId}/advance-checklist-generations | show producer with diff/source visibility | key; diff/source/rule manifest unique; generation CAS | 30/hour event; no-store; 10s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, event/diff/source/rule |
| 32.11 | POST | /api/v1/production/advance-items/{itemId}/responses | assigned side or scoped external link | key plus If-Match; actor/item/response type append | 120/hour event; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED or scoped-link CORS profile, auth/token, response/evidence/side |
| 32.13 | POST | /api/v1/production/events/{eventId}/advance-sheets | production viewer and recipient-scope authority | key; version/recipient/policy/format checksum | 30/hour event; no-store; 500ms, async 2m | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, recipient/field/accessibility/render |
| 32.14 | POST | /api/v1/production/events/{eventId}/advance-freezes | production.freeze plus required governance/exception authority | key plus If-Match; checklist hash/open items/gate CAS | 10/hour event; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, gate/open-item/exception |
| 32.15 | POST | /api/v1/production/events/{eventId}/frozen-plan-changes | production.change_frozen and source authority | key plus freeze/source revisions; delta/checksum unique | 30/hour event; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, source/delta/severity/recipient |

## Zod 4 Contracts

| ID | Strict request | Success |
|---|---|---|
| 32.10 | ChecklistGenerate { capabilityDiffId/version, rider/stage/input/monitor/allocation source versions, checklistRuleVersion, eventScheduleVersion } | AdvanceChecklistV1 { checklistId, version, sourceManifest, items, noItemMatches, checksum } |
| 32.11 | AdvanceResponseCreate { itemVersion, action answer/confirm/reject/request_change, response typed, evidenceUploadIds, counterConfirmationRequested boolean } | AdvanceItemV1 { itemId, state open/answered/confirmed/rejected/blocked, responses, selfConfirmation boolean, requiredCounterparty, version } |
| 32.13 | AdvanceSheetCreate { advanceVersion, recipientPartyId, fieldPolicy, format html_live/pdf_accessible, locale, expiresAt nullable } | AdvanceSheetV1 { sheetId, sourceVersion, recipientPolicy, renderHash, artifactRef nullable, liveToken nullable, state queued/ready/superseded } |
| 32.14 | AdvanceFreezeCreate { expectedChecklistHash, gatePolicyVersion, exceptionReason nullable, exceptionAuthorityRef nullable, openItemAcknowledgements } | AdvanceFreezeV1 { freezeId, eventId, checklistHash, openItems, unresolvedHardItems, exception, state frozen, version } |
| 32.15 | FrozenPlanChangeCreate { freezeId/version, sourceChanges typed array, reasonCode, deltaSummary, severity, requiredRecipientIds, sourceRevisionManifest } | FrozenPlanChangeV1 { changeId, predecessorFreeze, successorAdvanceVersion, delta, severity, acknowledgmentIds, riskState awaiting_ack/acknowledged/at_risk } |

### Exact typed success schemas

Each operation comment maps its route to a strict Zod 4 success body. No response field is implicit.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const ItemState = z.enum(["open", "answered", "confirmed", "rejected", "blocked"]);
const Severity = z.enum(["info", "warn", "blocker", "critical"]);
const ChecklistItem = z.object({
  itemId: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/), ownerPartyId: Uuid,
  requirementRef: Uuid, severity: Severity, state: ItemState, version: Version,
}).strict();
// 32.10
export const AdvanceChecklistV1 = z.object({
  checklistId: Uuid, version: Version,
  sourceManifest: z.object({ capabilityDiffVersion: Version, riderVersion: Version, stagePlanVersion: Version, inputVersion: Version, monitorVersions: z.array(Version).max(500), allocationVersion: Version }).strict(),
  items: z.array(ChecklistItem).max(5000), noItemMatches: z.boolean(), checksum: Digest,
}).strict();
// 32.11
export const AdvanceItemV1 = z.object({
  itemId: Uuid, state: ItemState,
  responses: z.array(z.object({ responseId: Uuid, actorPartyId: Uuid, action: z.enum(["answer", "confirm", "reject", "request_change"]), answerCode: z.string().max(128).nullable(), evidenceUploadIds: z.array(Uuid).max(20), respondedAt: Instant }).strict()).max(100),
  selfConfirmation: z.boolean(), requiredCounterparty: Uuid.nullable(), version: Version,
}).strict();
// 32.13
export const AdvanceSheetV1 = z.object({
  sheetId: Uuid, sourceVersion: Version,
  recipientPolicy: z.object({ recipientPartyId: Uuid, allowedFields: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(500) }).strict(),
  renderHash: Digest, artifactRef: Uuid.nullable(), liveToken: z.string().min(32).max(512).nullable(),
  state: z.enum(["queued", "ready", "superseded"]),
}).strict();
// 32.14
export const AdvanceFreezeV1 = z.object({
  freezeId: Uuid, eventId: Uuid, checklistHash: Digest, openItems: z.array(Uuid).max(5000),
  unresolvedHardItems: z.array(Uuid).max(5000),
  exception: z.object({ reason: z.string().min(1).max(1000), authorityRef: Uuid }).strict().nullable(),
  state: z.literal("frozen"), version: Version,
}).strict();
// 32.15
export const FrozenPlanChangeV1 = z.object({
  changeId: Uuid, predecessorFreeze: Uuid, successorAdvanceVersion: Version,
  delta: z.array(z.object({ sourceRef: Uuid, beforeRevision: Version, afterRevision: Version, summary: z.string().min(1).max(1000) }).strict()).min(1).max(5000),
  severity: Severity, acknowledgmentIds: z.array(Uuid).max(5000),
  riskState: z.enum(["awaiting_ack", "acknowledged", "at_risk"]),
}).strict();
~~~

### Invariants

- Generation creates items only for shortfall, unknown or explicit judgement/coordination requirements. Pure match creates no row. Each item has source, owner/counterparty, severity, lead time, resolveBy, basis and confirmation rule.
- Response/evidence is append-only. An actor confirming its own assertion sets selfConfirmation=true and does not complete a bilateral item unless policy explicitly allows unilateral confirmation.
- Sheets render an immutable recipient-filtered source version. Live link to an older version displays superseded status and canonical latest link; artifact remains auditable.
- Freeze evaluates all hard gates. Exception requires structured reason and authority. Frozen output lists every open/hard item; no filter or render may hide them.
- Post-freeze change creates a successor version. Critical severity calculates required recipients from affected ownership/role and stays at_risk until each acknowledgment has delivered/viewed/acknowledged evidence or escalation resolves.

## Database Schema

| Model | Typed fields, constraints, indexes | RLS/grants |
|---|---|---|
| AdvanceItem | id uuid; event_id; checklist_id/version; source_ref/version; owner_party_id; counterparty_id nullable; severity info/warn/blocker/critical; lead_time_seconds; resolve_by; basis; confirmation_rule; state; current_version; created_at | unique checklist/source/requirement key; indexes event,state,resolve by; authorized owner/counterparty projection |
| advance_item_response | id uuid; item_id/version; actor_id/side; action; response_json; evidence_refs; self_confirmation; source_event_id; created_at | unique item,actor,source event; append-only; item participants only |
| AdvanceFreeze | id uuid; event_id; advance_version; checklist_hash; open_item_ids; unresolved_hard_ids; gate_policy_version; exception_reason/authority nullable; state frozen/superseded; version; frozen_by/at | unique event,advance version/hash; indexes event,state; immutable; event participants narrowed |
| CriticalAcknowledgment | id uuid; change_id; recipient_id; delivery_state; delivered/viewed/acknowledged_at nullable; escalation_state; token_digest nullable; version | unique change,recipient; recipient/producer scoped; no unrelated access |
| AdvanceSheet | id uuid; event_id; source_version; recipient_id; field_policy; format; render_hash; artifact_ref/live_token_digest nullable; state queued/ready/superseded/expired/failed; superseded_by nullable; expires_at; created_at | unique recipient/source/policy/format; indexes state/expiry; recipient and producer only |
| frozen_plan_change | id uuid; event_id; freeze_id/version; source_manifest; delta_json; reason_code; severity; required_recipients; risk_state; successor_version; version; created_by/at | unique freeze/source/delta checksum; indexes event,severity/risk; append-only |

All base tables enable RLS and deny PUBLIC/anon. External token routes expose one item/sheet and field allowlist. Evidence/artifacts are encrypted Storage refs. Responses, freezes, acknowledgments and changes are append-only; retention preserves show record/legal hold and expires tokens/artifacts per policy.

### D4 Persistence and Query-Plan Closure

Every field below is normative SQL and `NOT NULL` unless explicitly marked `NULL`. UUIDs are non-nil; JSON values carry object/array checks. Local relationships are FKs `ON DELETE RESTRICT`; cross-shard source IDs are revision-pinned owner-seam references validated before commit.

| Table | Exact SQL field types and constraints | Relationships and query-pattern indexes | RLS and grants |
|---|---|---|---|
| `advance_items` (AdvanceItem) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `checklist_id uuid NOT NULL`; `checklist_version bigint NOT NULL CHECK (checklist_version>0)`; `source_ref text NOT NULL CHECK (length(source_ref) BETWEEN 1 AND 500)`; `source_version bigint NOT NULL CHECK (source_version>0)`; `owner_party_id uuid NOT NULL`; `counterparty_id uuid NULL`; `severity text NOT NULL CHECK (severity IN ('info','warn','blocker','critical'))`; `lead_time_seconds integer NOT NULL CHECK (lead_time_seconds>=0)`; `resolve_by timestamptz NOT NULL`; `basis jsonb NOT NULL CHECK (jsonb_typeof(basis)='object')`; `confirmation_rule jsonb NOT NULL CHECK (jsonb_typeof(confirmation_rule)='object')`; `state text NOT NULL CHECK (state IN ('open','answered','confirmed','rejected','blocked'))`; `current_version bigint NOT NULL CHECK (current_version>0)`; `created_at timestamptz NOT NULL` | Event/checklist and source are pinned aggregate relationships; owner/counterparty are Shard00 parties. `UNIQUE(checklist_id,checklist_version,source_ref,source_version)`; `INDEX(event_id,state,resolve_by)`; `INDEX(owner_party_id,state,resolve_by)`; partial `INDEX(event_id,severity,resolve_by) WHERE state NOT IN ('confirmed','rejected')` | FORCE RLS. Owner/counterparty select the safe projection; checklist worker inserts; unrelated parties and PUBLIC see no row; mutations go through versioned RPC only. |
| `advance_item_responses` (advance_item_response) | `id uuid PRIMARY KEY`; `item_id uuid NOT NULL`; `item_version bigint NOT NULL CHECK (item_version>0)`; `actor_id uuid NOT NULL`; `actor_side text NOT NULL CHECK (actor_side IN ('owner','counterparty','producer'))`; `action text NOT NULL CHECK (action IN ('answer','confirm','reject','request_change'))`; `response_json jsonb NOT NULL CHECK (jsonb_typeof(response_json)='object')`; `evidence_refs text[] NOT NULL DEFAULT '{}'`; `self_confirmation boolean NOT NULL`; `source_event_id uuid NOT NULL`; `created_at timestamptz NOT NULL` | FK `item_id -> advance_items.id`; actor is Shard00 party; evidence refs are BE00 Storage receipts. `UNIQUE(item_id,actor_id,source_event_id)`; `INDEX(item_id,item_version,created_at)`; `INDEX(source_event_id)` | FORCE RLS. Item participants select; authorized participant inserts; evidence worker gets receipt-scoped validation only; append-only trigger denies UPDATE/DELETE. |
| `advance_freezes` (AdvanceFreeze) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `advance_version bigint NOT NULL CHECK (advance_version>0)`; `checklist_hash bytea NOT NULL CHECK (octet_length(checklist_hash)=32)`; `open_item_ids uuid[] NOT NULL DEFAULT '{}'`; `unresolved_hard_ids uuid[] NOT NULL DEFAULT '{}'`; `gate_policy_version bigint NOT NULL CHECK (gate_policy_version>0)`; `exception_reason text NULL CHECK (exception_reason IS NULL OR length(exception_reason) BETWEEN 1 AND 2000)`; `exception_authority uuid NULL`; `state text NOT NULL CHECK (state IN ('frozen','superseded'))`; `version bigint NOT NULL CHECK (version>0)`; `frozen_by uuid NOT NULL`; `frozen_at timestamptz NOT NULL`; CHECK requires reason and authority together | Item IDs are validated against `advance_items` for the same event/version; exception authority is a governance seam. `UNIQUE(event_id,advance_version,checklist_hash)`; partial `UNIQUE(event_id) WHERE state='frozen'`; `INDEX(event_id,state,version DESC)` | FORCE RLS. Event participants see the narrowed freeze; freeze-authority RPC inserts; immutable trigger blocks row mutation; worker has SELECT only. |
| `critical_acknowledgments` (CriticalAcknowledgment) | `id uuid PRIMARY KEY`; `change_id uuid NOT NULL`; `recipient_id uuid NOT NULL`; `delivery_state text NOT NULL CHECK (delivery_state IN ('queued','delivered','failed'))`; `delivered_at timestamptz NULL`; `viewed_at timestamptz NULL`; `acknowledged_at timestamptz NULL`; `escalation_state text NOT NULL CHECK (escalation_state IN ('none','pending','resolved','failed'))`; `token_digest bytea NULL CHECK (token_digest IS NULL OR octet_length(token_digest)=32)`; `version bigint NOT NULL CHECK (version>0)` | FK `change_id -> frozen_plan_changes.id`; recipient is Shard00 party. `UNIQUE(change_id,recipient_id)`; `INDEX(recipient_id,delivery_state,acknowledged_at)`; partial `INDEX(change_id,escalation_state) WHERE acknowledged_at IS NULL` | FORCE RLS. Recipient sees/acknowledges own row; producer sees status; delivery worker transitions constrained columns; no unrelated or PUBLIC access. |
| `advance_sheets` (AdvanceSheet) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `source_version bigint NOT NULL CHECK (source_version>0)`; `recipient_id uuid NOT NULL`; `field_policy text NOT NULL CHECK (length(field_policy) BETWEEN 1 AND 120)`; `format text NOT NULL CHECK (format IN ('html_live','pdf_accessible'))`; `render_hash bytea NOT NULL CHECK (octet_length(render_hash)=32)`; `artifact_ref text NULL`; `live_token_digest bytea NULL CHECK (live_token_digest IS NULL OR octet_length(live_token_digest)=32)`; `state text NOT NULL CHECK (state IN ('queued','ready','superseded','expired','failed'))`; `superseded_by uuid NULL`; `expires_at timestamptz NULL`; `created_at timestamptz NOT NULL` | Self-FK `superseded_by -> advance_sheets.id`; event/recipient are external relationships; artifact is BE00 Storage. `UNIQUE(recipient_id,source_version,field_policy,format)`; `INDEX(event_id,state,created_at DESC)`; partial `INDEX(expires_at) WHERE state IN ('queued','ready')` | FORCE RLS. Exact recipient and producer select; renderer gets leased SELECT/transition; token gateway resolves one digest; no broad artifact/table grant. |
| `frozen_plan_changes` (frozen_plan_change) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `freeze_id uuid NOT NULL`; `freeze_version bigint NOT NULL CHECK (freeze_version>0)`; `source_manifest jsonb NOT NULL CHECK (jsonb_typeof(source_manifest)='object')`; `delta_json jsonb NOT NULL CHECK (jsonb_typeof(delta_json)='array')`; `reason_code text NOT NULL CHECK (length(reason_code) BETWEEN 1 AND 80)`; `severity text NOT NULL CHECK (severity IN ('info','warn','blocker','critical'))`; `required_recipients uuid[] NOT NULL DEFAULT '{}'`; `risk_state text NOT NULL CHECK (risk_state IN ('awaiting_ack','acknowledged','at_risk'))`; `successor_version bigint NOT NULL CHECK (successor_version>0)`; `version bigint NOT NULL CHECK (version>0)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | FK `freeze_id -> advance_freezes.id`; event/source/recipients are pinned external relationships. `UNIQUE(freeze_id,source_manifest,delta_json)` through a stored SHA-256 digest; `INDEX(event_id,severity,risk_state,created_at DESC)`; GIN `(delta_json jsonb_path_ops)` | FORCE RLS. Event participants see permitted delta; authorized producer inserts; acknowledgment worker reads required recipients; append-only trigger denies UPDATE/DELETE. |

Migration and database tests must exercise every check/FK validator, partial/exclusion index plan, forced-RLS role, grant denial, immutable-history trigger, and token-expiry lookup. Named invoker RPCs alone receive `EXECUTE`.

## State, Transactions and Recovery

- Item: open → answered → confirmed or rejected/blocked; any source change creates successor item/version.
- Freeze: frozen → superseded by successor; immutable predecessor.
- Sheet: queued → ready/failed → superseded/expired.
- Acknowledgment: pending → delivered → viewed → acknowledged; any step may escalate; no timestamp inference.
- 32.10 commits checklist/items and item_changed outbox atomically.
- 32.11 locks item/version and appends response/state/outbox; evidence timeout writes nothing unless response policy permits evidence-later state.
- 32.14 locks current advance/checklist/items and commits freeze plus production.advance.frozen outbox atomically.
- 32.15 commits source delta/successor/required acknowledgments and changed_after_freeze outbox atomically; notification provider effects follow outbox.

## Middleware, Access and Observability

| Actor | Allowed | Denied |
|---|---|---|
| producer | generate/render/freeze/change under mandate | hide hard/open item, self-ack recipient |
| assigned side | answer/confirm visible item | other side private evidence |
| scoped external recipient | one item/sheet/purpose until expiry | browse event, re-share token |
| critical recipient | own acknowledgment | another recipient state |
| support/service | purpose-bound case/render/notification contract | fabricate response/freeze/ack |

Middleware order: request ID → CORS → auth/token → CSRF → strict size/Zod → rate → event/item/recipient RLS → idempotency/If-Match → source/gate/confirmation/severity policy → transaction → response schema → redacted audit. Logs exclude response/evidence content, external tokens, sensitive rider fields and recipient contact.

## Events and Integrations

| Event/seam | Contract and delivery |
|---|---|
| production.advance.item_changed | item, state, actor/source class, resolve-by, version; item-version dedupe |
| production.advance.frozen | event, freeze hash, open/exception refs, policy version; freeze-version dedupe |
| production.advance.changed_after_freeze | old/new version, delta digest/severity, critical recipient IDs, risk state; change-version dedupe |
| render/storage | narrowed snapshot → HTML/PDF/live artifact/accessibility report; 30s, 2 retries 1s/5s, circuit 5 failures/min 2m; prior sheet persists |
| notification provider | change/recipient opaque destination → delivery receipt; 2s, 3 retries 1s/5s/30s, circuit 10 failures/30s 60s; ack pending/at-risk, no false delivered |

Events are at-least-once with stable ID/version dedupe; stale no-op, equal-version changed digest quarantine and poison after eight attempts.

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 32.10 | 400 SOURCE_MANIFEST_INVALID; 403 GENERATE_CAPABILITY_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 422 DIFF_INCOMPLETE; 503 SOURCE_UNAVAILABLE |
| 32.11 | 400 RESPONSE_INVALID; 401 EXTERNAL_TOKEN_INVALID; 403 ITEM_SCOPE_REQUIRED; 409 RESPONSE_CONFLICT; 412 REVISION_MISMATCH; 422 COUNTER_CONFIRMATION_REQUIRED |
| 32.13 | 400 SHEET_POLICY_INVALID; 403 RECIPIENT_SCOPE_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 422 ACCESSIBILITY_GATE_FAILED; 503 RENDER_UNAVAILABLE |
| 32.14 | 400 FREEZE_REQUEST_INVALID; 403 FREEZE_OR_EXCEPTION_AUTHORITY_REQUIRED; 409 GATE_NOT_SATISFIED; 412 REVISION_MISMATCH; 422 UNRESOLVED_HARD_ITEMS |
| 32.15 | 400 CHANGE_INVALID/DELTA_REQUIRED; 403 FROZEN_CHANGE_AUTHORITY_REQUIRED; 409 SOURCE_REVISION_CONFLICT; 412 FREEZE_VERSION_STALE; 422 REQUIRED_RECIPIENTS_MISSING |

Unknown failures map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT, rate 429 plus Retry-After; hidden IDs are 404.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 32.10 | shortfall/unknown/judgement rows, match no row, owner/severity/lead/resolveBy and source manifest |
| 32.11 | assigned/external response, evidence, self-confirm disclosure, bilateral completion and CAS |
| 32.13 | exact recipient projection, accessible HTML/PDF, old link supersession and token expiry |
| 32.14 | gate success, structured exception authority, every open/hard item visible and immutable hash |
| 32.15 | successor/delta/severity recipients, provider failure at-risk, acknowledgment timestamps and escalation |

RLS/grant tests cover producer, each side, external recipient, critical recipient, support and services. Transaction tests prove checklist/response/freeze/change/ack/outbox atomicity and no partial successor.

## Deepening Passes

- Micro: item generation, judgement, confirmation, recipient projection, exception and acknowledgment semantics are exact.
- Macro: source plans/diffs remain companions; this companion owns coordination/freeze/change records.
- Devil's advocate: no implementation may create noise for matches, silently self-confirm, hide blockers, mutate a freeze, mark delivery as acknowledgment or reuse an external token.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 32.10 | `be_http_requests_total{operation_id="32.10",outcome,code}`, `be_http_latency_seconds{operation_id="32.10"}`, and `be_operation_recovery_total{operation_id="32.10",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.11 | `be_http_requests_total{operation_id="32.11",outcome,code}`, `be_http_latency_seconds{operation_id="32.11"}`, and `be_operation_recovery_total{operation_id="32.11",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.13 | `be_http_requests_total{operation_id="32.13",outcome,code}`, `be_http_latency_seconds{operation_id="32.13"}`, and `be_operation_recovery_total{operation_id="32.13",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.14 | `be_http_requests_total{operation_id="32.14",outcome,code}`, `be_http_latency_seconds{operation_id="32.14"}`, and `be_operation_recovery_total{operation_id="32.14",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.15 | `be_http_requests_total{operation_id="32.15",outcome,code}`, `be_http_latency_seconds{operation_id="32.15"}`, and `be_operation_recovery_total{operation_id="32.15",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 32d production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 32](../ia/32-show-production-planning.md)
- [Events and bill](32a-production-events-bill-rehearsal.md)
- [Rider and disclosure](32b-rider-sensitive-disclosure-redlines.md)
- [Stage and capability](32c-stage-plan-capability-allocation.md)
