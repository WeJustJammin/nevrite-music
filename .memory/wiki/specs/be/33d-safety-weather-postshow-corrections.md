# BE Spec 33d — Safety, Weather, Post-Show Reporting, and Corrections

> Source: [IA Shard 33](../ia/33-show-day-operations.md) interactions 33.14–33.18. This companion owns operational safety evidence, weather contingency monitoring, human operational decisions, governed post-show reports, and correction suggestions. It never declares regulatory compliance and never mutates venue, gear, or production source truth directly.

## Scope and Ownership

- **Owns:** `SafetyRequirement`, `SafetyEvidence`, `ContingencyPlan`, `OperationalDecision`, and `PostShowReport`; append-only decision/evidence history; report version locks; correction handoff receipts.
- **Consumes:** event, venue, jurisdiction, responsible-party, credential, frozen production-plan, gear, and forecast references through versioned service contracts.
- **Delegates:** canonical venue/gear corrections to Shards 29/32 and notifications to the communications owner. Accepted suggestions are applied only by the canonical owner.
- **Prohibits:** machine-made proceed/pause/cancel decisions, fabricated human acceptance, silent forecast substitution, destructive report edits, and claims that a requirement is compliant.

## Interaction Traceability

| IA ID | Backend operation | Success invariant | Failure invariant |
|---|---|---|---|
| 33.14 | Record safety requirement/evidence | Requirement provenance, validity interval, responsible role, evidence, and human acceptance status are versioned | API returns `EVIDENCE_INVALID`; it never emits `compliant=true` |
| 33.15 | Monitor weather contingency | Fresh/unknown forecast posture and threshold alerts reach the named authority | Provider outage persists `forecastState=unknown` and raises a degraded alert |
| 33.16 | Record weather/safety decision | Authorized human appends proceed/modify/pause/cancel with reason and evidence | Service rejects absent authority, reason, or evidence and never decides automatically |
| 33.17 | File post-show report | Co-editors create private, versioned factual/judgement items until the edit lock | Expired edits return `REPORT_LOCKED`; correction creates a new governed version |
| 33.18 | Route venue/gear correction | Qualified item and evidence create an idempotent suggestion at the canonical owner | No report item changes venue, gear, custody, or production records locally |

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 33](../ia/33-show-day-operations.md) | Interactions lines 73–95; Contracts lines 96–115; Data Models lines 116–158; Access Control lines 159–184; Event Schemas and Edge Cases lines 195–228 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.16 Show Safety, Permits & Insurance Certificates | BE33D-14 / 33.14 |
| 18.17 Weather Monitoring & Contingency | BE33D-15 and BE33D-16 / 33.15–33.16 |
| 18.18 Post-Show Report & Notes | BE33D-17 and BE33D-18 / 33.17–33.18 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | AuthZ | Idempotency | Rate limit | Success | CORS policy |
|---|---|---|---|---|---|---|---|
| BE33D-14 | POST | `/api/v1/showday/events/{eventId}/safety-evidence` | production safety editor or event administrator | `Idempotency-Key`, 24 h, body hash | 30/min/principal/event | 201 requirement/evidence version | `BE00-CORS-WEB-CREDENTIALLED` |
| BE33D-15 | POST | `/api/v1/showday/events/{eventId}/contingency-plans` | event administrator or named safety authority | `Idempotency-Key`, 24 h, body hash | 12/min/principal/event | 201 contingency-plan version | `BE00-CORS-WEB-CREDENTIALLED` |
| BE33D-16 | POST | `/api/v1/showday/events/{eventId}/operational-decisions` | named decider with live event credential | `Idempotency-Key`, 72 h, body hash | 20/min/principal/event | 201 immutable decision | `BE00-CORS-WEB-CREDENTIALLED` |
| BE33D-17 | POST | `/api/v1/showday/events/{eventId}/post-show-reports` | production party listed as co-editor | `Idempotency-Key`, 24 h, body hash | 20/min/principal/event | 201 report version | `BE00-CORS-WEB-CREDENTIALLED` |
| BE33D-18 | POST | `/api/v1/showday/events/{eventId}/corrections` | report co-editor or event administrator | `Idempotency-Key`, 72 h, body hash | 20/min/principal/event | 202 correction receipt | `BE00-CORS-WEB-CREDENTIALLED` |

All routes require TLS, authenticated actor/session, ULID path parameters, `Content-Type: application/json`, `X-Request-Id`, exact origin allow-list CORS, and a maximum 64 KiB body. Browser preflight permits `POST, OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; credentials are enabled only for first-party origins. Responses use `Cache-Control: no-store`; there are no public cache variants.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE33D-14 | strict path `eventId`, headers, and `SafetyEvidenceRequest` body; reject unknown keys and validate the success body before serialization |
| BE33D-15 | strict path `eventId`, headers, and `ContingencyPlanRequest` body; reject unknown keys and validate the success body before serialization |
| BE33D-16 | strict path `eventId`, headers, and `OperationalDecisionRequest` body; reject unknown keys and validate the success body before serialization |
| BE33D-17 | strict path `eventId`, headers, and `PostShowReportRequest` body; reject unknown keys and validate the success body before serialization |
| BE33D-18 | strict path `eventId`, headers, and `CorrectionRequest` body; reject unknown keys and validate the success body before serialization |

## Contract Schemas

```ts
const Ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const IsoInstant = z.string().datetime({ offset: true });
const NonBlank = z.string().trim().min(1).max(2_000);
const EvidenceRef = z.object({ kind: z.enum(['document','declaration','forecast','photo','incident']), refId: Ulid, capturedAt: IsoInstant }).strict();

const SafetyEvidenceRequest = z.object({
  requirementId: Ulid.optional(), sourceRef: NonBlank, jurisdictionRef: NonBlank,
  venueRef: Ulid, requirementClass: z.enum(['fire','electrical','structural','crowd','weather','medical','other']),
  dueAt: IsoInstant, validFrom: IsoInstant, validUntil: IsoInstant, responsiblePartyId: Ulid,
  evidence: z.array(EvidenceRef).min(1).max(20), submittedAt: IsoInstant,
  humanAcceptance: z.object({ status: z.enum(['pending','accepted','rejected']), actorId: Ulid.optional(), at: IsoInstant.optional(), note: z.string().trim().max(2_000).optional() }).strict()
}).strict().superRefine((v,c) => {
  if (Date.parse(v.validFrom) >= Date.parse(v.validUntil)) c.addIssue({ code:'custom', path:['validUntil'], message:'must be after validFrom' });
  if (Date.parse(v.submittedAt) > Date.parse(v.validUntil)) c.addIssue({ code:'custom', path:['submittedAt'], message:'evidence is outside validity window' });
  if (v.humanAcceptance.status !== 'pending' && (!v.humanAcceptance.actorId || !v.humanAcceptance.at)) c.addIssue({ code:'custom', path:['humanAcceptance'], message:'decided acceptance requires actor and time' });
});

const ContingencyPlanRequest = z.object({
  hazard: z.enum(['lightning','wind','heat','cold','precipitation','air_quality','other']),
  providerRef: z.string().trim().min(1).max(200), namedDeciderId: Ulid,
  thresholds: z.array(z.object({ metric: NonBlank, comparator: z.enum(['gt','gte','lt','lte','eq']), value: z.number().finite(), unit: NonBlank, action: z.enum(['notify','modify','pause','cancel']) }).strict()).min(1).max(20),
  contacts: z.array(Ulid).min(1).max(50), effectiveFrom: IsoInstant, expectedVersion: z.number().int().min(0)
}).strict();

const OperationalDecisionRequest = z.object({
  planId: Ulid, trigger: NonBlank, authorityId: Ulid,
  decision: z.enum(['proceed','modify','pause','cancel']), reason: NonBlank,
  evidence: z.array(EvidenceRef).min(1).max(20), decidedAt: IsoInstant,
  notifyPartyIds: z.array(Ulid).min(1).max(100)
}).strict();

const ReportItem = z.object({ itemId: Ulid, classification: z.enum(['fact','judgement']), subject: NonBlank, statement: NonBlank, evidence: z.array(EvidenceRef).max(20), correctionTarget: z.enum(['none','venue','gear','production']) }).strict();
const PostShowReportRequest = z.object({
  reportId: Ulid.optional(), expectedVersion: z.number().int().min(0), coEditorIds: z.array(Ulid).min(1).max(30),
  knownVarianceRefs: z.array(Ulid).max(100), items: z.array(ReportItem).min(1).max(250), observedAt: IsoInstant
}).strict().superRefine((v,c) => { if (new Set(v.items.map(x=>x.itemId)).size !== v.items.length) c.addIssue({ code:'custom', path:['items'], message:'itemId must be unique' }); });

const CorrectionValue = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), value: NonBlank }).strict(),
  z.object({ kind: z.literal('number'), value: z.number().finite() }).strict(),
  z.object({ kind: z.literal('boolean'), value: z.boolean() }).strict(),
  z.object({ kind: z.literal('timestamp'), value: IsoInstant }).strict(),
  z.object({ kind: z.literal('identifier'), value: Ulid }).strict(),
  z.object({ kind: z.literal('text_list'), value: z.array(NonBlank).min(1).max(50) }).strict(),
]);
const CorrectionPatchEntry = z.object({
  fieldCode: z.string().regex(/^(venue|gear|production)\.[a-z][a-z0-9_]{0,62}$/),
  operation: z.enum(['add', 'replace', 'remove']),
  proposedValue: CorrectionValue.nullable(),
}).strict().superRefine((v, c) => {
  if (v.operation === 'remove' && v.proposedValue !== null)
    c.addIssue({ code: 'custom', path: ['proposedValue'], message: 'remove_requires_null' });
  if (v.operation !== 'remove' && v.proposedValue === null)
    c.addIssue({ code: 'custom', path: ['proposedValue'], message: 'add_or_replace_requires_value' });
});
const CorrectionRequest = z.object({
  reportId: Ulid, reportVersion: z.number().int().positive(), itemId: Ulid,
  target: z.enum(['venue','gear','production']), targetEntityId: Ulid,
  evidence: z.array(EvidenceRef).min(1).max(20),
  proposedPatch: z.array(CorrectionPatchEntry).min(1).max(25),
}).strict().superRefine((v, c) => {
  if (v.proposedPatch.some(entry => !entry.fieldCode.startsWith(`${v.target}.`)))
    c.addIssue({ code: 'custom', path: ['proposedPatch'], message: 'field_code_target_mismatch' });
  if (new Set(v.proposedPatch.map(entry => entry.fieldCode)).size !== v.proposedPatch.length)
    c.addIssue({ code: 'custom', path: ['proposedPatch'], message: 'duplicate_field_code' });
});
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonPrimitive, z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema)]));
const ApiError = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/), message: z.string().min(1).max(500),
  requestId: z.string().uuid(),
  details: z.record(z.string(), JsonValueSchema).refine(v => Object.keys(v).length <= 16),
}).strict();
```

### Exact typed success schemas

Each operation comment is the authoritative route mapping. These strict Zod 4 parsers are the only successful bodies; asynchronous work is represented by typed state and job identifiers.

```ts
const ResponseVersion = z.number().int().positive();
// BE33D-14 / 33.14
const SafetyEvidenceSuccess = z.object({
  requirementId: Ulid, requirementVersion: ResponseVersion, evidenceVersion: ResponseVersion,
  acceptance: z.object({ status: z.enum(['pending','accepted','rejected']), actorId: Ulid.nullable(), at: IsoInstant.nullable() }).strict()
    .superRefine((v, ctx) => {
      if (v.status === 'pending' ? v.actorId !== null || v.at !== null : v.actorId === null || v.at === null) {
        ctx.addIssue({ code: 'custom', message: 'pending has no acceptance actor/time; terminal acceptance requires both' });
      }
    }),
  validity: z.object({ validFrom: IsoInstant, validUntil: IsoInstant, expired: z.boolean() }).strict(),
  recordedAt: IsoInstant,
}).strict();
// BE33D-15 / 33.15
const ContingencyPlanSuccess = z.object({
  planId: Ulid, version: ResponseVersion, state: z.enum(['active','superseded','disabled']),
  monitorJobId: Ulid, thresholdCount: z.number().int().min(1).max(20), effectiveFrom: IsoInstant,
}).strict();
// BE33D-16 / 33.16
const OperationalDecisionSuccess = z.object({
  decisionId: Ulid, planId: Ulid, decision: z.enum(['proceed','modify','pause','cancel']),
  authorityId: Ulid, decidedAt: IsoInstant,
  notificationReceipts: z.array(z.object({ partyId: Ulid, outboxEventId: Ulid, state: z.literal('queued') }).strict()).min(1).max(100),
}).strict();
// BE33D-17 / 33.17
const PostShowReportSuccess = z.object({
  reportId: Ulid, version: ResponseVersion, state: z.enum(['draft','recorded','superseded']),
  itemIds: z.array(Ulid).min(1).max(250), coEditorIds: z.array(Ulid).min(1).max(30), observedAt: IsoInstant,
}).strict();
// BE33D-18 / 33.18
const CorrectionReceiptSuccess = z.object({
  correctionId: Ulid, reportId: Ulid, reportVersion: ResponseVersion, itemId: Ulid,
  destination: z.enum(['venue','gear','production']), handoffJobId: Ulid,
  state: z.enum(['queued','accepted','rejected','dead_lettered']), acceptedAt: IsoInstant.nullable(),
}).strict().superRefine((v, ctx) => {
  if (v.state === 'accepted' ? v.acceptedAt === null : v.acceptedAt !== null) {
    ctx.addIssue({ code: 'custom', message: 'acceptedAt is present only for accepted handoffs' });
  }
});
```

Dates are normalized to UTC after offset validation. Unknown keys, non-finite numbers, unsafe HTML, unsupported media, duplicate IDs, and references outside the actor's event scope fail before persistence. The correction patch is schema-validated again by its canonical destination and cannot contain identity, ownership, ACL, or audit fields.

## Persistence and Access Control

```sql
create table safety_requirements (
  id text primary key check (id ~ '^[0-9A-HJKMNP-TV-Z]{26}$'), event_id text not null,
  source_ref text not null, jurisdiction_ref text not null, venue_ref text not null,
  requirement_class text not null check (requirement_class in ('fire','electrical','structural','crowd','weather','medical','other')),
  due_at timestamptz not null, valid_from timestamptz not null, valid_until timestamptz not null,
  responsible_party_id text not null, version integer not null check (version > 0), created_at timestamptz not null,
  unique (event_id, id, version), check (valid_from < valid_until)
);
create table safety_evidence (
  id text primary key, requirement_id text not null references safety_requirements(id), document_or_declaration_ref text not null,
  submitted_at timestamptz not null, validity_state text not null check (validity_state in ('valid','expired','unknown')),
  submitter_id text not null, acceptance_state text not null check (acceptance_state in ('pending','accepted','rejected')),
  accepted_by text, accepted_at timestamptz, created_at timestamptz not null,
  check ((acceptance_state='pending' and accepted_by is null and accepted_at is null) or (acceptance_state<>'pending' and accepted_by is not null and accepted_at is not null))
);
create table contingency_plans (
  id text primary key, event_id text not null, hazard text not null, provider_ref text not null, threshold_json jsonb not null,
  named_decider_id text not null, contact_ids jsonb not null, effective_from timestamptz not null,
  forecast_state text not null check (forecast_state in ('fresh','stale','unknown')),
  state text not null check (state in ('active','superseded','disabled')),
  version integer not null check (version > 0), created_at timestamptz not null,
  unique (event_id, hazard, version)
);
create table operational_decisions (
  id text primary key, event_id text not null, plan_id text not null references contingency_plans(id), trigger_text text not null,
  authority_id text not null, decision text not null check (decision in ('proceed','modify','pause','cancel')),
  reason text not null, evidence_json jsonb not null, notification_state text not null check (notification_state in ('pending','sent','partial','failed')),
  decided_at timestamptz not null, created_at timestamptz not null
);
create table post_show_reports (
  id text not null, event_id text not null, version integer not null check (version > 0), co_editor_ids jsonb not null,
  known_variance_refs jsonb not null, item_json jsonb not null, edit_until timestamptz not null,
  prior_version integer, state text not null check (state in ('draft','recorded','superseded')),
  created_by text not null, created_at timestamptz not null, primary key (id, version)
);
create table correction_handoffs (
  id text primary key, event_id text not null, report_id text not null, report_version integer not null, item_id text not null,
  target_domain text not null check (target_domain in ('venue','gear','production')), target_entity_id text not null,
  evidence_json jsonb not null, proposed_patch jsonb not null, destination_receipt text,
  state text not null check (state in ('queued','accepted','rejected','dead_lettered')), accepted_at timestamptz,
  created_by text not null, created_at timestamptz not null,
  check ((state='accepted' and accepted_at is not null) or (state<>'accepted' and accepted_at is null)),
  unique (report_id, report_version, item_id, target_domain)
);
```

Indexes: `safety_requirements(event_id,due_at)`, `safety_evidence(requirement_id,submitted_at desc)`, `contingency_plans(event_id,hazard,version desc)`, `operational_decisions(event_id,decided_at desc)`, `post_show_reports(event_id,id,version desc)`, and `correction_handoffs(state,created_at)`. Partial indexes cover pending acceptances, unknown forecasts, failed notifications, unlocked reports, and queued handoffs.

RLS is enabled and forced on every table. `showday_service` owns tables but does not bypass RLS; `authenticated` receives `SELECT/INSERT` only through security-definer functions that require tenant membership, event scope, live role/credential, and row-purpose checks. Safety requirements/evidence are visible only to assigned safety roles and event administrators; decisions are visible to operational parties; reports and correction evidence remain private to co-editors, event administrators, and canonical correction reviewers. Direct `UPDATE/DELETE`, client grants on base tables, public access, cross-tenant joins, and service-key browser use are denied. Worker roles receive the narrow `SELECT`/`UPDATE` needed for forecast, notification, and handoff state only.

## Transactions, State, and Concurrency

- BE33D-14 locks `(event_id, requirement_id)`, validates provenance and interval, inserts a new immutable requirement/evidence version, appends audit/outbox rows, then commits. Acceptance is a human assertion, not a compliance result.
- BE33D-15 locks `(event_id, hazard)`, requires `expectedVersion`, persists a complete plan version, schedules monitoring, and emits no decision. Version mismatch returns `409 VERSION_CONFLICT` with current version.
- Forecast observations move `fresh -> stale -> unknown`; recovery moves `unknown -> fresh` only after a timestamp-monotonic successful observation. Threshold crossings create alerts and never alter `OperationalDecision`.
- BE33D-16 checks authority and credential at `decidedAt`, locks the active plan, inserts an immutable `OperationalDecision`, notification jobs, audit, and outbox in one transaction. Decisions are corrected by a superseding append, never update/delete.
- BE33D-17 serializes on report ID, verifies `expectedVersion` and the event-specific edit deadline, writes the entire next version plus item-level diff. At/after `editUntil`, only an administrator-approved correction version is permitted.
- BE33D-18 verifies the cited version/item/evidence, inserts one handoff, and commits before dispatch. Replays return the stored receipt; destination rejection preserves evidence and does not change source records.

Idempotency records bind tenant, actor, operation, path, and canonical body hash. Same key/different hash returns `409 IDEMPOTENCY_CONFLICT`; in-flight duplicate returns `409 REQUEST_IN_PROGRESS`; committed replay returns the original status/body. Every write uses database time and an audit/outbox row in the same transaction.

## External Boundaries and Recovery

The forecast adapter sends `{eventId, coordinatesRef, metrics, observedAfter}` and accepts `{providerObservationId, observedAt, expiresAt, metrics, advisoryCodes}`. Connect timeout is 500 ms and total timeout 2 s; retry 2 times for timeout/429/5xx with 200 ms then 800 ms full jitter, honoring `Retry-After` up to 30 s. A circuit opens after 5 failures in 60 s for 60 s, half-opens with one probe, and records `forecastState=unknown`; the last known reading is labelled stale and never presented as current. Alerts identify provider degradation and the named authority. No provider response can create an operational decision.

The notification adapter sends `{eventId,eventType,recipientPolicyId,templateVersion,opaqueReasonRef,dedupeKey}` and accepts `{deliveryReceiptId,state}`. The correction adapter sends `{handoffId,targetOwner,targetAggregateId,fieldCode,evidenceRefs,sourceReportVersion,dedupeKey}` and accepts `{handoffReceiptId,state,acceptedVersion?}`. Each has a 3 s total timeout and 3 retries at 1/5/30 s full-jitter backoff for timeout/429/5xx; a per-adapter circuit opens after 5 failures/min for 2 min, leaves the committed outbox/handoff queued, and half-opens with one receipt-safe probe. Permanent 4xx is dead-lettered with a reason. Workers lease jobs for 60 s, renew every 20 s, reclaim expired leases, and deduplicate by outbox/event ID. Delivery is at-least-once, consumer handling is idempotent, and operator replay requires a reason. PII/evidence bodies are not logged or placed in notification payloads.

## Events and Delivery

| Event | Trigger | Payload | Consumers |
|---|---|---|---|
| `showday.safety.evidence_changed` | committed requirement/evidence version or acceptance | `{eventId, requirementId, evidenceId, validityState, acceptanceState, version, occurredAt}` | responsible parties |
| `showday.operational_decision.recorded` | committed human decision | `{eventId, decisionId, trigger, authorityId, decision, reasonRef, evidenceRefs, occurredAt}` | all operational parties |
| `showday.post_report.versioned` | committed report version or lock transition | `{eventId, reportId, version, changedItemRefs, editUntil, occurredAt}` | correction workflows |

Envelope: `{eventId, eventType, schemaVersion: 1, aggregateId, aggregateVersion, occurredAt, traceId, tenantId, payload}`. Outbox publication is at-least-once, ordered per aggregate, retried for 24 h, then dead-lettered. Consumers deduplicate `eventId`; payloads contain opaque evidence/reason references rather than private contents. Schema changes are additive within v1; breaking changes require a new version and dual-publish migration.

## Middleware, Error, and Operation Matrix

| Operation | Schema | Authorization | Transaction/output | Audit/event |
|---|---|---|---|---|
| BE33D-14 / 33.14 | `SafetyEvidenceRequest` | safety editor/admin, scoped responsibility | versioned requirement/evidence, 201 | evidence audit + `showday.safety.evidence_changed` |
| BE33D-15 / 33.15 | `ContingencyPlanRequest` | admin/named safety authority | versioned plan and monitor job, 201 | plan audit; threshold alerts only |
| BE33D-16 / 33.16 | `OperationalDecisionRequest` | exact named decider + live credential | immutable decision and notifications, 201 | decision audit + `showday.operational_decision.recorded` |
| BE33D-17 / 33.17 | `PostShowReportRequest` | listed co-editor | next report version or lock error, 201 | report audit + `showday.post_report.versioned` |
| BE33D-18 / 33.18 | `CorrectionRequest` | co-editor/admin | queued canonical handoff, 202 | handoff audit; destination owns mutation |

Middleware order is request ID -> TLS/origin/CORS -> body cap/content type -> authentication -> tenant/event scope -> rate limit -> Zod validation -> authorization/credential -> idempotency -> transaction -> outbox/audit -> response. All failures return `ApiError { code, message, requestId, details }`; details are allow-listed and contain no evidence body, provider secret, private report text, or existence oracle.

| Status/code | Condition | Retry contract |
|---|---|---|
| 400 `VALIDATION_FAILED` | schema, interval, evidence, or cross-field failure | correct request |
| 401 `UNAUTHENTICATED` | absent/invalid session | reauthenticate |
| 403 `FORBIDDEN` | role, event scope, responsibility, credential, or co-editor failure | do not retry unchanged |
| 404 `NOT_FOUND` | scoped aggregate unavailable | do not reveal cross-tenant existence |
| 409 `VERSION_CONFLICT` | stale plan/report version | refetch current version |
| 409 `IDEMPOTENCY_CONFLICT` | key reused with different hash | new key after correction |
| 409 `REPORT_LOCKED` | report edit window closed | use approved correction path |
| 422 `EVIDENCE_INVALID` | evidence absent, expired, or unresolvable | supply valid evidence |
| 422 `AUTHORITY_INVALID` | decider not named/live at decision time | route to named authority |
| 429 `RATE_LIMITED` | route budget exhausted | honor `Retry-After` |
| 503 `FORECAST_UNKNOWN` | provider unavailable/no current observation | human authority uses unknown posture |
| 503 `DEPENDENCY_UNAVAILABLE` | notification/correction boundary unavailable | worker retries; client may replay key |

## Observability and SLOs

Structured logs include request/trace ID, operation ID, tenant/event opaque IDs, actor role, outcome/code, latency, DB duration, dependency attempt, forecast freshness class, decision kind, report version, and outbox ID. They exclude evidence/report bodies, coordinates, contacts, tokens, cookies, and provider payloads. Metrics cover request count/error/latency, authorization denials, evidence validity state, unknown-forecast duration, threshold alerts, decision-to-notification latency, locked-report attempts, handoff age/rejection, outbox lag, circuit state, and dead letters.

Availability target is 99.9% monthly. p95/p99 request latency targets are 300/900 ms excluding asynchronous delivery; operational-decision commit p99 is 1 s; 99% of decision notifications enqueue within 2 s and deliver within 30 s when the destination is healthy; forecast freshness is <=5 min when the provider is healthy; 99% of correction handoffs reach their destination within 60 s. Page on unknown forecast >10 min inside an active monitoring window, decision notification lag >2 min, queued correction >10 min, outbox oldest age >60 s, dead-letter growth, or five-minute 5xx >2%.

## Verification Matrix

| Area | Required tests |
|---|---|
| Contracts | table-driven valid/boundary/malformed/unknown-key/body-size tests for every schema; interval, unique-item, acceptance, evidence, and protected-patch properties |
| Authorization | every route x every role; tenant/event isolation; expired credential; removed co-editor; named-decider exact match; non-disclosing 404 behavior |
| Safety | no response/event contains `compliant`; accepted evidence requires human actor/time; expired evidence rejected; version history immutable |
| Weather | fresh/stale/unknown transitions; threshold alert without decision; provider timeout/429/5xx retry/circuit; recovery probe; stale reading labelled |
| Decisions | authority/evidence/reason required; proceed/modify/pause/cancel; no provider-created decision; concurrent decision append; notification partial/failure replay |
| Reports | co-edit concurrency; optimistic conflict; edit-boundary clock tests; factual/judgement preservation; correction version after lock; private-field redaction |
| Corrections | qualified target/evidence; duplicate handoff; destination reject/timeout/recovery; no local venue/gear/production mutation; protected patch-key rejection |
| Data | migration up/down rehearsal; constraints/index plans; forced RLS/grants; direct update/delete denial; audit/outbox atomicity; backup/restore sampling |
| Reliability | idempotency replay/hash conflict/in-flight race; worker lease crash/reclaim; outbox duplicate/order/dead-letter; SLO/alert synthetic checks |

Integration tests use Postgres with RLS enabled and real transaction isolation; contract tests pin dependency and event schemas. Time, ULID creation, provider observations, and delivery outcomes are deterministic fakes. CI fails on route duplication, undocumented error/status/event, missing operation-matrix row, public grant, log secret/evidence leakage, malformed Markdown table, broken relative link, or uncovered IA interaction/model/event.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| BE33D-14 | `be_http_requests_total{operation_id="BE33D-14",outcome,code}`, `be_http_latency_seconds{operation_id="BE33D-14"}`, and `be_operation_recovery_total{operation_id="BE33D-14",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| BE33D-15 | `be_http_requests_total{operation_id="BE33D-15",outcome,code}`, `be_http_latency_seconds{operation_id="BE33D-15"}`, and `be_operation_recovery_total{operation_id="BE33D-15",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| BE33D-16 | `be_http_requests_total{operation_id="BE33D-16",outcome,code}`, `be_http_latency_seconds{operation_id="BE33D-16"}`, and `be_operation_recovery_total{operation_id="BE33D-16",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| BE33D-17 | `be_http_requests_total{operation_id="BE33D-17",outcome,code}`, `be_http_latency_seconds{operation_id="BE33D-17"}`, and `be_operation_recovery_total{operation_id="BE33D-17",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| BE33D-18 | `be_http_requests_total{operation_id="BE33D-18",outcome,code}`, `be_http_latency_seconds{operation_id="BE33D-18"}`, and `be_operation_recovery_total{operation_id="BE33D-18",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

- Every interaction 33.14–33.18 maps to one stable route and operation matrix row.
- `SafetyRequirement`, `SafetyEvidence`, `ContingencyPlan`, `OperationalDecision`, and `PostShowReport` have typed storage, ownership, lifecycle, concurrency, RLS, grants, audit, and test contracts.
- `showday.safety.evidence_changed`, `showday.operational_decision.recorded`, and `showday.post_report.versioned` define exact triggers, payloads, delivery, ordering, privacy, and evolution.
- Human authority, unknown-weather posture, report lock/correction behavior, canonical-owner handoff, dependency recovery, errors, observability, SLOs, and CORS are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Added explicit pre-audit structural closure and normalized authoritative per-operation CORS policies. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [IA Shard 33](../ia/33-show-day-operations.md)
- Shards 29/32 canonical venue, gear, and frozen-production correction seams.
- Shard 14 event/engagement authority and communications seam.
