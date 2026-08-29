# Gear Manifest, Load-Out and Day Sheet — Backend Specification

## Split Group

- IA source: ../ia/33-show-day-operations.md.
- Assigned interactions: 33.11 Resolve date gear manifest, 33.12 Confirm load-out and 33.13 Render/distribute day sheet.
- Owned aggregates: DateGearManifest and DaySheetVersion.
- Owned events: showday.manifest.case_changed and showday.day_sheet.versioned.
- Boundary: gear identity/custody/claims remain Shards23/24 and rental/service allocations their owners. This companion projects per-date cases and appends load-out observations. One allegation never changes supplier reputation.

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 33.11 | POST | /api/v1/showday/events/{eventId}/gear-manifests | 201 DateGearManifestV1 |
| 33.12 | POST | /api/v1/showday/events/{eventId}/loadout-confirmations | 201 LoadoutConfirmationV1 |
| 33.13 | POST | /api/v1/showday/events/{eventId}/day-sheets | 202 DaySheetVersionV1 |

References: ../ia/33-show-day-operations.md, 00-infrastructure.md and Shards23/24/32 source seams.

## Shared Contract Inheritance

ApiError { code, message, requestId, details } is exact. Asset serials, custody evidence, contact, allegation details, day-sheet tokens and protected recipient fields never enter errors/logs/events. Writes require credentialled CORS, CSRF, strict Zod, Idempotency-Key and source/manifest If-Match.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 33](../ia/33-show-day-operations.md) | Interactions lines 73–95; Contracts lines 96–115; Data Models lines 116–158; Access Control lines 159–184; Event Schemas and Edge Cases lines 195–228 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.09 Backline & Gear Manifest | 33.11–33.12 |
| 18.10 Day Sheet Generation & Distribution | 33.13 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 33.11 | POST | /api/v1/showday/events/{eventId}/gear-manifests | event gear.manage plus source visibility | key; frozen plan/rig/rental/custody manifest checksum unique | 30/hour event; no-store; 10s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, source/custody/person/case |
| 33.12 | POST | /api/v1/showday/events/{eventId}/loadout-confirmations | authorized person/crew for assigned cases | key plus If-Match; case/state/source event append | 120/hour; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, person/case/evidence/claim routing |
| 33.13 | POST | /api/v1/showday/events/{eventId}/day-sheets | show-day sheet.manage and recipient scope | key; source version/recipient policy/format checksum | 30/hour; no-store; 500ms, async 2m | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, source/recipient/accessibility/offline |

## Zod 4 Contracts and Invariants

| ID | Strict request | Success |
|---|---|---|
| 33.11 | ManifestResolve { frozenPlanVersion, rigVersionRefs, rentalAllocationRefs, gearItemVersionRefs, custodyVersionRefs, caseDefinitions, sourceWatermark } | DateGearManifestV1 { manifestId, version, people, cases, items with source/custody/state, shortfalls, checksum } |
| 33.12 | LoadoutConfirmationCreate { manifestVersion, cases 1–100 with caseId/state present/missing/damaged/custody_transferred, itemExceptions, evidenceUploadIds, observedAt, sourceEventId } | LoadoutConfirmationV1 { confirmationId, manifestVersion, caseStates, custodyEventRefs, claimRoutingRefs, version } |
| 33.13 | DaySheetCreate { sourceVersionManifest, recipientPartyId, recipientRole, fieldPolicy, formats html_live/pdf_accessible/offline_bundle, locale, expiresAt nullable } | DaySheetVersionV1 { daySheetId, version, recipientProjection, renderHash, liveLinkToken nullable, artifactRefs, offlineBundleHash, state queued/ready/superseded } |

### Exact typed success schemas

Operation comments map routes to strict Zod 4 success bodies. Artifact references are opaque IDs; response schemas never embed storage paths or signed URLs.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const ManifestItem = z.object({
  itemId: Uuid, sourceRef: Uuid, custodyPartyId: Uuid.nullable(),
  state: z.enum(["expected", "present", "missing", "damaged", "custody_transferred"]), caseId: Uuid.nullable(),
}).strict();
// 33.11
export const DateGearManifestV1 = z.object({
  manifestId: Uuid, version: Version, people: z.array(Uuid).max(1000),
  cases: z.array(z.object({ caseId: Uuid, label: z.string().min(1).max(128), itemIds: z.array(Uuid).max(1000) }).strict()).max(1000),
  items: z.array(ManifestItem).max(10_000),
  shortfalls: z.array(z.object({ itemId: Uuid, quantity: z.int().positive(), severity: z.enum(["warning", "hard"]) }).strict()).max(10_000),
  checksum: Digest,
}).strict();
// 33.12
export const LoadoutConfirmationV1 = z.object({
  confirmationId: Uuid, manifestVersion: Version,
  caseStates: z.array(z.object({ caseId: Uuid, state: z.enum(["present", "missing", "damaged", "custody_transferred"]) }).strict()).min(1).max(100),
  custodyEventRefs: z.array(Uuid).max(10_000), claimRoutingRefs: z.array(Uuid).max(10_000), version: Version,
}).strict();
const ArtifactRef = z.object({ format: z.enum(["html_live", "pdf_accessible", "offline_bundle"]), artifactRef: Uuid, checksum: Digest }).strict();
// 33.13
export const DaySheetVersionV1 = z.object({
  daySheetId: Uuid, version: Version,
  recipientProjection: z.object({ recipientPartyId: Uuid, recipientRole: z.string().regex(/^[a-z0-9_]{1,64}$/), allowedFields: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(1000) }).strict(),
  renderHash: Digest, liveLinkToken: z.string().min(32).max(512).nullable(), artifactRefs: z.array(ArtifactRef).min(1).max(3),
  offlineBundleHash: Digest, state: z.enum(["queued", "ready", "superseded"]),
}).strict();
~~~

- Manifest resolves every planned item to person/case/date plus canonical source and custody version. Missing/unconfirmed source is a named shortfall; no synthetic item.
- Cases are bulk confirmation units but exceptions name individual item. present/missing/damaged is an observation; supplier/owner fault is not inferred.
- Custody transfer invokes the canonical Shard23/24 seam after local observation outbox; local manifest does not rewrite ownership.
- Load-out allegation may create a scoped claim/case route with evidence but never a reputation score/fact.
- Day sheet pins all source versions, applies recipient allowlist and carries every gap. Old live link displays superseded/current link; offline bundle declares current-as-of and source manifest.
- Accessible PDF/HTML require tagged order, headings, tables, language, text alternatives and WCAG 2.2 AA checks before ready.

## Database Schema

| Model | Typed fields, constraints, indexes | RLS/grants |
|---|---|---|
| DateGearManifest | id uuid; event_id; version; source_manifest; people_json; cases_json; items_json; shortfalls_json; checksum; state current/superseded; created_by/at | unique event,version/checksum; GIN case/item refs; one current event partial; event/person/case scoped projection |
| manifest_case_observation | id uuid; manifest_id/version; case_id; actor_id; state; item_exceptions; evidence_refs; observed_at; source_event_id; custody_event_refs; claim_routing_refs; created_at | unique actor/source event; indexes manifest,case/time; append-only; case-assigned actors only |
| DaySheetVersion | id uuid; event_id; version; source_manifest; recipient_id/role; field_policy; render_hash; live_token_digest; html/pdf/offline artifact refs nullable; offline_bundle_hash; state; superseded_by nullable; expires_at; created_at | unique recipient/source/policy/version; indexes event,state/expiry; recipient/producer/renderer only |

All base tables enable RLS and deny PUBLIC/anon. Serials/evidence protected fields are narrowed or replaced by opaque refs. Tokens are digests, artifacts encrypted and signed briefly. Manifest/observations/sheets are append-only.

### D4 Persistence and Query-Plan Closure

Every field below is normative SQL and `NOT NULL` unless explicitly marked `NULL`. Local FKs use `ON DELETE RESTRICT`; Shard23/24 custody/gear and BE00 artifact references are revision-pinned external relationships.

| Table | Exact SQL field types and constraints | Relationships and query-pattern indexes | RLS and grants |
|---|---|---|---|
| `date_gear_manifests` (DateGearManifest) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version>0)`; `source_manifest jsonb NOT NULL CHECK (jsonb_typeof(source_manifest)='object')`; `people_json jsonb NOT NULL CHECK (jsonb_typeof(people_json)='array')`; `cases_json jsonb NOT NULL CHECK (jsonb_typeof(cases_json)='array')`; `items_json jsonb NOT NULL CHECK (jsonb_typeof(items_json)='array')`; `shortfalls_json jsonb NOT NULL CHECK (jsonb_typeof(shortfalls_json)='array')`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `state text NOT NULL CHECK (state IN ('current','superseded'))`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | Event/source members are ProductionEvent and Shard23/24 refs. `UNIQUE(event_id,version)`, `UNIQUE(event_id,checksum)`; partial `UNIQUE(event_id) WHERE state='current'`; `INDEX(event_id,state,version DESC)`; GIN `(cases_json jsonb_path_ops)` and `(items_json jsonb_path_ops)` | FORCE RLS. Event/person/case-scoped projections only; resolver inserts; direct request UPDATE/DELETE and PUBLIC grants denied. |
| `manifest_case_observations` (manifest_case_observation) | `id uuid PRIMARY KEY`; `manifest_id uuid NOT NULL`; `manifest_version bigint NOT NULL CHECK (manifest_version>0)`; `case_id uuid NOT NULL`; `actor_id uuid NOT NULL`; `state text NOT NULL CHECK (state IN ('present','missing','damaged','custody_transferred'))`; `item_exceptions jsonb NOT NULL CHECK (jsonb_typeof(item_exceptions)='array')`; `evidence_refs text[] NOT NULL DEFAULT '{}'`; `observed_at timestamptz NOT NULL`; `source_event_id uuid NOT NULL`; `custody_event_refs text[] NOT NULL DEFAULT '{}'`; `claim_routing_refs text[] NOT NULL DEFAULT '{}'`; `created_at timestamptz NOT NULL` | FK `manifest_id -> date_gear_manifests.id`; case ID resolves in the quoted manifest; custody/claim/evidence refs target Shard23/24/BE00 seams. `UNIQUE(actor_id,source_event_id)`; `INDEX(manifest_id,case_id,observed_at DESC)`; `INDEX(source_event_id)` | FORCE RLS. Case-assigned actors select/insert; custody/claim workers get row-scoped SELECT; allegations/serials are omitted from general projection; append-only trigger denies UPDATE/DELETE. |
| `day_sheet_versions` (DaySheetVersion) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version>0)`; `source_manifest jsonb NOT NULL CHECK (jsonb_typeof(source_manifest)='object')`; `recipient_id uuid NOT NULL`; `recipient_role text NOT NULL CHECK (length(recipient_role) BETWEEN 1 AND 80)`; `field_policy text NOT NULL CHECK (length(field_policy) BETWEEN 1 AND 120)`; `render_hash bytea NOT NULL CHECK (octet_length(render_hash)=32)`; `live_token_digest bytea NULL CHECK (live_token_digest IS NULL OR octet_length(live_token_digest)=32)`; `html_artifact_ref text NULL`; `pdf_artifact_ref text NULL`; `offline_artifact_ref text NULL`; `offline_bundle_hash bytea NOT NULL CHECK (octet_length(offline_bundle_hash)=32)`; `state text NOT NULL CHECK (state IN ('queued','ready','superseded','expired','failed'))`; `superseded_by uuid NULL`; `expires_at timestamptz NOT NULL`; `created_at timestamptz NOT NULL` | Self-FK `superseded_by -> day_sheet_versions.id`; event/recipient are external relationships; artifacts target BE00 Storage. `UNIQUE(recipient_id,source_manifest,field_policy,version)` through stored source digest; `INDEX(event_id,state,expires_at)`; `INDEX(recipient_id,version DESC)`; partial `INDEX(expires_at) WHERE state IN ('queued','ready')` | FORCE RLS. Recipient/producer select authorized sheet; renderer has leased transition; token gateway resolves one digest; PUBLIC/anon/authenticated have no base grant. |

Migration tests assert all types/checks, relationship validators, partial/GIN index plans, forced RLS, role grants, token/artifact concealment, expiry scans, and append-only triggers.

## State, Transactions and Recovery

- Manifest current → superseded; immutable history.
- Case observations append; latest authorized observation forms projection, contradictions remain visible.
- Day sheet queued → rendering → ready/failed → superseded/expired.
- 33.11 pins source versions and commits manifest/current pointer plus source-ready event atomically; source outage fails or retains named shortfall according to hard/soft policy.
- 33.12 locks manifest/cases, appends observations and showday.manifest.case_changed outbox atomically; canonical custody/claim side effects follow verified outbox.
- 33.13 snapshots recipient fields before queueing; render failure keeps prior ready sheet/current link.

## Middleware, Access and Observability

| Actor | Allowed | Denied |
|---|---|---|
| gear producer | resolve source-visible manifest | hidden serial/evidence outside assignment |
| assigned person/crew | confirm assigned case/items | another case/person custody |
| day-sheet recipient | exact role projection/version | other recipient/source evidence |
| renderer/custody/claim worker | one bounded contract | browse event, infer reputation |

Middleware order: request ID → CORS → auth → CSRF → strict size/Zod → rate → event/person/case/recipient RLS → idempotency/If-Match → source/custody/evidence/field policy → transaction → response validation → redacted audit. Logs include IDs, versions, case/state/shortfall counts, hashes and safe errors; exclude serials/evidence/contact/tokens.

## Events and Integrations

| Event/seam | Contract and delivery |
|---|---|
| showday.manifest.case_changed | event/case, state, custody/evidence refs, version; case-observation dedupe; no allegation text |
| showday.day_sheet.versioned | event/version, recipient policy, render/artifact/offline refs, supersession; sheet-version dedupe |
| gear/rig/rental/custody sources | ID/version → source/custody projection; 3s, 2 retries 100ms/500ms, circuit 5 failures/30s 30s; shortfall |
| custody/claim router | local observation/evidence refs → receipt/case refs; 3s, 3 retries 1s/5s/30s, circuit 5 failures/min 2m; local observation persists |
| renderer/storage | narrowed snapshot → HTML/PDF/offline artifacts; 30s, 2 retries 1s/5s, circuit 5 failures/min 2m; prior sheet persists |

Events are at-least-once, stale versions no-op, equal-version digest conflict quarantines and poison after eight attempts.

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 33.11 | 400 SOURCE_MANIFEST_INVALID/CASE_INVALID; 403 GEAR_SCOPE_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 422 SOURCE_UNRESOLVED; 503 SOURCE_UNAVAILABLE |
| 33.12 | 400 CONFIRMATION_INVALID; 403 CASE_SCOPE_REQUIRED; 409 SOURCE_EVENT_CONFLICT; 412 REVISION_MISMATCH; 422 EVIDENCE_REQUIRED/CUSTODY_ROUTE_FAILED |
| 33.13 | 400 SHEET_POLICY_INVALID; 403 RECIPIENT_SCOPE_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 422 ACCESSIBILITY_GATE_FAILED; 503 RENDER_UNAVAILABLE |

Unknown errors map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT and rates 429; hidden IDs are 404.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 33.11 | person/case/date resolution, source/custody pins, unresolved shortfall, no synthetic item |
| 33.12 | bulk plus item exception, replay/conflict, custody/claim outbox and no reputation mutation |
| 33.13 | exact recipient projection/gaps, accessible formats, offline current-as-of, old-link supersession and render failure |

RLS/grant tests cover producer, assigned/unassigned person, recipient, renderer and custody/claim workers. Transaction tests prove manifest/observation/sheet/outbox atomicity and immutable histories.

## Deepening Passes

- Micro: source/custody, case grouping, observation states, shortfall, recipient projection and supersession are explicit.
- Macro: gear/rental/custody owners remain canonical; show-day stores date projection and observations only.
- Devil's advocate: no implementation may invent gear, infer supplier fault, mutate ownership locally, hide gaps or broaden a day sheet.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 33.11 | `be_http_requests_total{operation_id="33.11",outcome,code}`, `be_http_latency_seconds{operation_id="33.11"}`, and `be_operation_recovery_total{operation_id="33.11",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.12 | `be_http_requests_total{operation_id="33.12",outcome,code}`, `be_http_latency_seconds{operation_id="33.12"}`, and `be_operation_recovery_total{operation_id="33.12",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.13 | `be_http_requests_total{operation_id="33.13",outcome,code}`, `be_http_latency_seconds{operation_id="33.13"}`, and `be_operation_recovery_total{operation_id="33.13",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 33c production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 33](../ia/33-show-day-operations.md)
- Shards23/24 gear/custody and Shard32 frozen-plan source seams.
