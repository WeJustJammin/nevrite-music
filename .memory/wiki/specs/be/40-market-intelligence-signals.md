# Market Intelligence, Fraud & Scouting Signals — Backend Specification

> **IA Source**: [Shard 40 — Market intelligence, fraud and scouting signals](../ia/40-market-intelligence-signals.md)
> **Deep Dive**: [Deep Dive 40](../ia/deep-dives/40-market-intelligence-signals.md)
> **Foundation**: [Shard 00 Backend](00-infrastructure.md)
> **Status**: Complete
> **Operation count**: 14 registered HTTP operations
> **Source coverage**: 14/14 interactions, 12/12 canonical contracts, 16/16 canonical models, 8/8 canonical events

## Classification

- **Type**: Single domain. The indexed preliminary classification is valid.
- **Owned boundary**: Playlist/chart event tracking, placement quality, public curator evidence, privacy-safe audience geography, advisory routing, first-party show impact, descriptive anomaly evidence, vendor coincidence, purpose-scoped scouting visibility/watch/search, and momentum observations.
- **Excluded boundary**: Shard 39 owns provider ingestion, provenance, truth labels, and analytics series; Shard 06 owns case adjudication and external evidence decisions; Shard 00 owns authentication, audit, idempotency, jobs, object/export primitives, queues, policy gates, and provider webhook ingress; Shard 42 consumes only descriptive outputs.
- **Locked prohibitions**: No prediction, optimized itinerary, causal headline, accusation, fraud verdict, all-clear badge, automatic DSP/distributor report, named private curator dossier, averaged source layers, paid ranking, public vendor score, private watch membership disclosure, reusable discovery result list, or post-filtered consent.
- **Approval basis**: The user's blanket `/write-be-spec all shards` approval authorizes implementation-detail choices that preserve these locked IA boundaries.

## Referenced Material Inventory

| Material | Exact source location | Use |
|---|---|---|
| Shard 40 IA | Overview and architecture decisions, lines 7–42 | Domain ownership, descriptive boundary, B2, routing, anomaly, vendor, scouting, and configuration rules |
| Shard 40 IA | Features, lines 44–49 | Feature coverage 22.03, 22.04, 22.06, and 22.07 |
| Shard 40 IA | Acceptance Criteria, lines 51–66 | Fourteen success/refusal contracts |
| Shard 40 IA | Interactions, lines 68–85 | Authoritative operation inventory 40.01–40.14 |
| Shard 40 IA | Contracts, lines 87–104 | Twelve canonical wire contracts and cross-shard invariants |
| Shard 40 IA | Data Models, lines 106–145 | Sixteen canonical records and privacy restrictions |
| Shard 40 IA | Access Control, lines 147–171 | Actor roles, consent-in-query, B2/minors, exports, and escalation |
| Shard 40 IA | Accessibility, lines 173–183 | Text-first risk, layered geography, accessible dossier, and p95 target |
| Shard 40 IA | Event Schemas, lines 185–198 | Eight exact events and payload exclusions |
| Shard 40 IA | Edge Cases and coverage, lines 200–236 | Restatement, source conflict, B2 shrink, confounding, retraction, consent, enumeration, and CAS |
| Shard 40 IA | Cross-Shard Dependencies, lines 238–250 | Shards 00, 06, 39, and 42 direction |
| Shard 40 deep dive | Interactions, lines 23–64 | Stream, geography, anomaly, and scouting implementation detail |
| Shard 40 deep dive | Contracts and gates, lines 65–101 | Command outcomes, B2, consent, and cross-shard ports |
| Shard 40 deep dive | Models/invariants, lines 102–131 | State and no-self-confirming-loop rules |
| Shard 40 deep dive | Access/events/edge cases, lines 132–200 | RLS, ordering, idempotency, recovery, and verification |
| Shard 39 IA | Contracts, lines 94–110 | `MetricObservationV1`, `SeriesIntegrityV1`, and `AnalyticsSeriesV1` producer semantics |
| Shard 00 BE | Routes/contracts, lines 67–200 | Registry, strict Zod 4, global error, cache, idempotency, and job inheritance |
| Shard 00 BE | Persistence/middleware, lines 202–345 | RLS, grants, transaction, ETag, audit, and outbox inheritance |
| Shard 00 BE | Async/errors/telemetry/recovery, lines 355–499 | Queue, export object, failures, observability, migration, and tests |
| Architecture Design | API/security, lines 343–376 and 576–624 | Hono REST, acting context, authorization, privacy, and SLO |
| Data Placement Strategy | Placement/PII, lines 5–55 and 95–148 | PostgreSQL, restricted analytics, lifecycle, and cross-store consistency |
| Engineering Standards | Quality/security/recovery, lines 27–44 and 92–190 | Production, test, performance, and recovery floor |
| Installed stack skills | Hono, Cloudflare, Supabase data access, Vitest, API error handling; complete current `SKILL.md` files | Framework middleware, RLS, queue, tests, and errors |

## IA Source Map

| BE surface | Normative source | Resolution |
|---|---|---|
| Placement/chart tracking | AC/Interactions 40.01–40.04; Contracts lines 91–94 | Operations 40.01–40.04 and first four canonical contracts |
| Geography/routing/show impact | AC/Interactions 40.05–40.07; Contracts lines 95–97 | Operations 40.05–40.07 with separate layers, advisory shortlist, and null/declined impact |
| Anomaly/vendor evidence | AC/Interactions 40.08–40.10; Contracts lines 98–99 | Descriptive evidence, artist-controlled export, additive retraction, no detector feedback |
| Scouting consent/watch/signal/search | AC/Interactions 40.11–40.14; Contracts lines 100–102 | Query/fire-time consent, opaque watch, descriptive momentum, capped discovery, atomic revoke |
| Persistence | Data Models lines 110–145 | Sixteen exact canonical records with typed fields, indexes, RLS, grants, and retention |
| Events | Event Schemas lines 185–198 | Eight exact event types with minimal typed payloads |
| Failure/recovery | Edge Cases lines 200–236; deep dive 174–200 | Restatement, gate shrink, confounding, retraction, queued consent revoke, no enumeration |

### Canonical contract registry

| Exact IA contract | Owning operations |
|---|---|
| `PlaylistPlacementEventV1` | 40.01 |
| `PlacementQualityV1` | 40.02 |
| `ChartObservationV1` | 40.03 |
| `CuratorEvidenceV1` | 40.04 |
| `AudienceGeoLayerV1` | 40.05 |
| `RoutingCandidateV1` | 40.06 |
| `ShowImpactEstimateV1` | 40.07 |
| `AnomalyObservationV1` | 40.08–40.09 |
| `VendorCoincidenceV1` | 40.10 |
| `ScoutingConsentDecisionV1` | 40.11–40.14 |
| `WatchReferenceV1` | 40.11–40.12 |
| `MomentumObservationV1` | 40.12 |

## Endpoint Completeness Reconciliation

| IA ID | Literal interaction | Registered operation | Disposition |
|---|---|---|---|
| 40.01 | Record playlist transition | `POST /api/v1/internal/intelligence/playlist-transitions` | Protected source command |
| 40.02 | Render placement alert | `POST /api/v1/internal/intelligence/placement-alerts` | Protected policy command |
| 40.03 | Record chart event | `POST /api/v1/internal/intelligence/chart-observations` | Protected source command |
| 40.04 | Inspect curator evidence | `GET /api/v1/intelligence/curators/{curatorId}/evidence` | B2-gated read |
| 40.05 | View audience geography | `GET /api/v1/intelligence/subjects/{subjectId}/audience-geography` | Owner/operator scoped read |
| 40.06 | Request routing shortlist | `POST /api/v1/intelligence/routing-shortlists` | Advisory compute command |
| 40.07 | Evaluate show impact | `POST /api/v1/intelligence/show-impact-analyses` | Private compute command |
| 40.08 | Detect anomaly | `POST /api/v1/internal/intelligence/anomaly-observations` | Protected detector command |
| 40.09 | Export anomaly dossier | `POST /api/v1/intelligence/anomaly-cases/{caseId}/exports` | Artist-controlled async export |
| 40.10 | Evaluate vendor history | `GET /api/v1/intelligence/vendors/{vendorId}/coincidence` | Private/B2-gated read |
| 40.11 | Add private watch | `POST /api/v1/intelligence/scout-watches` | Consent-scoped command |
| 40.12 | Fire momentum signal | `POST /api/v1/internal/intelligence/momentum-observations` | Protected fire-time command |
| 40.13 | Search scouting discovery | `GET /api/v1/intelligence/scouting-discovery` | Purpose-scoped capped read |
| 40.14 | Revoke scouting visibility | `POST /api/v1/intelligence/scouting-visibility/revocations` | Subject-controlled atomic command |

No Shard 00 platform route is duplicated. Provider observations first enter Shard 39; Shard 40 consumes normalized integrity-labeled contracts. Export status remains on BE00 `GET /api/v1/jobs/{jobId}`.

### Feature coverage

| Feature | Operations | Backend outcome |
|---|---|---|
| 22.03 Playlist & Chart Tracking | 40.01–40.04 | Append-only placements/charts, quality-first alerts, and B2 curator evidence |
| 22.04 Audience Geography & Tour Routing Insight | 40.05–40.07 | Separate geography layers, advisory shortlist, and private show-impact range/null/declined |
| 22.06 Streaming Fraud & Fake Engagement Detection | 40.08–40.10 | Hedged anomaly evidence, human-controlled dossier, and private retractable vendor coincidence |
| 22.07 A&R Scouting Signals & Watchlists | 40.11–40.14 | Purpose consent, reference-only watch, descriptive signal, capped search, and atomic revoke |

## Shared Contract Inheritance

Every route inherits BE00 request/trace IDs, restore fencing, exact CORS, media/body limits, authentication, acting context, CSRF, strict Zod 4, BOLA, rates, idempotency, strong ETags, PostgreSQL transaction rules, audit, outbox, jobs, object/export security, redaction, and recovery.

- All failures use exactly `ApiError { code, message, requestId, details }`. `details` is an allowlisted `Record<string, JsonValue>` with BE00 size/depth limits and never includes provider payload, query text, exact geo cells, watch membership, consent reason, anomaly facts, or hidden-result cause.
- Every JSON object is strict. Extra keys, mass-assignment fields, accusatory labels, paid rank factors, raw fan identities, exact locations, and private-person curator fields fail before authorization/storage.
- Commands require `Idempotency-Key` of 8–128 printable ASCII bytes; body key must equal header. Same actor/operation/path/normalized body/target/key replays the committed status/body; changed content returns 409 `IDEMPOTENCY_CONFLICT`.
- Mutable targets require one strong decimal `If-Match` equal to `expectedVersion`. Missing/malformed is 400; authorized stale version is 409.
- Safe GET operations 40.04, 40.05, 40.10, and 40.13 use source/policy revisions, not idempotency keys. Discovery uses one bounded page only: `limit` defaults to 20 and is capped at 25; cursor, offset, page-number, and client-selected sort parameters are rejected.
- Queue envelopes contain IDs/event type/schema/aggregate version/correlation only. They exclude metric values, query text/results, exact geography, watch membership, consent state/reason, anomaly details, dossier bytes, and provider source payload.
- Authenticated/private responses use `no-store` or a named short private cache. Cause-invariant search/watch/signal outputs are byte-equivalent across absent, denied, suppressed, minor-ineligible, and consent-unavailable cases.

## API Endpoints

### Authoritative Route Registry

This is the sole route registry. IDs are stable OpenAPI `operationId` values and key every contract, middleware, error, observability, and test row.

| ID | Method and path | Request → success | Authorization and ownership | Concurrency/idempotency | Rate, cache, deadline, SLO | Validation and CORS |
|---|---|---|---|---|---|---|
| 40.01 | `POST /api/v1/internal/intelligence/playlist-transitions` | `RecordPlaylistTransitionRequest` → 201/200 `PlaylistPlacementEventV1` | Registered Shard 39 placement producer; subject derived from source binding | Key; unique source observation/transition; source revision CAS | 1000/min producer; no-store; 2s; protected command | Strict source/event; `BE00-CORS-DENY` |
| 40.02 | `POST /api/v1/internal/intelligence/placement-alerts` | `RenderPlacementAlertRequest` → 200 `PlacementAlertResponse` | Registered quality/notification worker; named placement only | Key; placement/policy version; one alert policy outcome | 600/min worker and notification budget; no-store; 2s | Strict policy; `BE00-CORS-DENY` |
| 40.03 | `POST /api/v1/internal/intelligence/chart-observations` | `RecordChartObservationRequest` → 201/200 `ChartObservationV1` | Registered Shard 39 chart producer; subject derived | Key; unique source/chart/period/subject/revision | 1000/min producer; no-store; 2s | Strict source/period; `BE00-CORS-DENY` |
| 40.04 | `GET /api/v1/intelligence/curators/{curatorId}/evidence` | `CuratorEvidenceRequest` → 200 `CuratorEvidenceV1` | Authenticated artist/operator context; public professional/institution only; B2 | Safe read; policy/source version pin; no key | 30/min actor, 10/min curator; private max-age=60; 2s | Strict path/query, B2; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.05 | `GET /api/v1/intelligence/subjects/{subjectId}/audience-geography` | `AudienceGeographyRequest` → 200 `AudienceGeographyResponse` | Subject/artist mandate; operator aggregate requires B2/floor | Safe read; source/privacy versions; no key | 60/min actor; private max-age=60; 2s | Strict coarse query; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.06 | `POST /api/v1/intelligence/routing-shortlists` | `RequestRoutingShortlistRequest` → 200 `RoutingShortlistResponse` | Artist/tour actor with `intelligence.routing.read` | Key; act/tour/source revision pins projection | 10/min owner; no-store; 2s | Strict candidates/context; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.07 | `POST /api/v1/intelligence/show-impact-analyses` | `EvaluateShowImpactRequest` → 201/200 `ShowImpactEstimateV1` | Artist/entity owns first-party booked show | Key; unique show/windows/method/source revision | 10/min owner; no-store; 2s | Strict windows/show proof; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.08 | `POST /api/v1/internal/intelligence/anomaly-observations` | `DetectAnomalyRequest` → 201/200 `AnomalyObservationV1` | Registered detector over artist-authorized Shard 39 series | Key; unique series/rule/policy/source revision; case CAS | 600/min detector and 30/min subject; no-store; 5s | Strict facts/rule; `BE00-CORS-DENY` |
| 40.09 | `POST /api/v1/intelligence/anomaly-cases/{caseId}/exports` | `ExportAnomalyDossierRequest` → 202 `DossierExportAccepted` | Artist owner/entity mandate plus recent step-up | Key and exact case version; one job per format/version tuple | 5/hour owner; no-store; <=500ms acceptance | Strict formats/step-up; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.10 | `GET /api/v1/intelligence/vendors/{vendorId}/coincidence` | `VendorCoincidenceRequest` → 200 `VendorCoincidenceV1` | Artist with linked campaigns; shared/operator view requires B2 | Safe read; policy/source version; no key | 20/min actor/vendor; no-store; 2s | Strict path/query, B2 branch; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.11 | `POST /api/v1/intelligence/scout-watches` | `AddPrivateWatchRequest` → 201/200 `WatchCreateResponse` | Scout organization mandate; query-time purpose consent/minors gate | Key; opaque subject/purpose uniqueness; consent version pin | 30/min scout, 100/day org; no-store; 2s | Strict purpose/consent; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.12 | `POST /api/v1/internal/intelligence/momentum-observations` | `FireMomentumSignalRequest` → 202 `MomentumSignalReceipt` | Registered detector/dispatcher; active watch; fire-time consent | Key; watch/source/policy version; one threshold observation | 600/min service, 30 signals/day/watch; no-store; 2s | Strict thresholds/consent; `BE00-CORS-DENY` |
| 40.13 | `GET /api/v1/intelligence/scouting-discovery` | `ScoutingDiscoveryRequest` → 200 `ScoutingDiscoveryResponse` | Scout organization purpose mandate; consent enforced inside query | Safe read; bounded single page; default 20/max 25; no cursor/key; query-family budget | 10/min scout, 50/day query family; no-store; 2s | Strict allowlisted filters and server sort; `BE00-CORS-WEB-CREDENTIALLED` |
| 40.14 | `POST /api/v1/intelligence/scouting-visibility/revocations` | `RevokeScoutingVisibilityRequest` → 200 `ScoutingConsentDecisionV1` | Subject self or entity authority for same subject/purpose | Key and visibility version; atomic instruction/watch/signal/index CAS | 20/min subject; no-store; 2s | Strict purpose/version; `BE00-CORS-WEB-CREDENTIALLED` |

### Operation Contract Matrix

| ID | Exact request | Exact success | Error contract |
|---|---|---|---|
| 40.01 | Strict `RecordPlaylistTransitionRequest` | `PlaylistPlacementEventV1`; same source fact replays | BE00 `ApiError { code, message, requestId, details }` |
| 40.02 | Strict `RenderPlacementAlertRequest` | `PlacementAlertResponse` with quality before reach | BE00 `ApiError { code, message, requestId, details }` |
| 40.03 | Strict `RecordChartObservationRequest` | `ChartObservationV1`; sources remain separate | BE00 `ApiError { code, message, requestId, details }` |
| 40.04 | Strict path/policy `CuratorEvidenceRequest` | Available/suppressed `CuratorEvidenceV1` | BE00 `ApiError { code, message, requestId, details }` |
| 40.05 | Strict `AudienceGeographyRequest` | `AudienceGeographyResponse` with separate layers | BE00 `ApiError { code, message, requestId, details }` |
| 40.06 | Strict `RequestRoutingShortlistRequest` | Ranked/insufficient `RoutingShortlistResponse` | BE00 `ApiError { code, message, requestId, details }` |
| 40.07 | Strict `EvaluateShowImpactRequest` | Measured/null/declined `ShowImpactEstimateV1` | BE00 `ApiError { code, message, requestId, details }` |
| 40.08 | Strict protected `DetectAnomalyRequest` | Descriptive `AnomalyObservationV1` | BE00 `ApiError { code, message, requestId, details }` |
| 40.09 | Strict `ExportAnomalyDossierRequest` | 202 `DossierExportAccepted`; job status inherited | BE00 `ApiError { code, message, requestId, details }` |
| 40.10 | Strict `VendorCoincidenceRequest` | Available/insufficient `VendorCoincidenceV1` | BE00 `ApiError { code, message, requestId, details }` |
| 40.11 | Strict `AddPrivateWatchRequest` | Watch/no-result `WatchCreateResponse` union | BE00 `ApiError { code, message, requestId, details }` |
| 40.12 | Strict `FireMomentumSignalRequest` | Generic recorded/suppressed `MomentumSignalReceipt` | BE00 `ApiError { code, message, requestId, details }` |
| 40.13 | Strict allowlisted `ScoutingDiscoveryRequest`; bounded single page, default 20/max 25, no cursor/offset | Capped `ScoutingDiscoveryResponse` with fixed sort metadata and `nextCursor: null`; empty causes identical | BE00 `ApiError { code, message, requestId, details }` |
| 40.14 | Strict `RevokeScoutingVisibilityRequest` | Withdraw `ScoutingConsentDecisionV1` | BE00 `ApiError { code, message, requestId, details }` |

## Request and Response Contracts — Zod 4

These schemas are authoritative for Hono, TypeScript, OpenAPI, database-boundary parsing, fixtures, and tests. Bigint/decimal values use lossless strings over JSON.

~~~ts
import { z } from "zod";

const UUID = z.uuid();
const Instant = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const Version = z.string().regex(/^[1-9][0-9]{0,18}$/);
const NonNegativeIntString = z.string().regex(/^(0|[1-9][0-9]{0,18})$/);
const NonNegativeDecimal = z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/);
const SignedDecimal = z.string().regex(/^-?(0|[1-9][0-9]*)(\.[0-9]{1,6})?$/);
const Ratio = z.number().min(0).max(1);
const Code = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_.-]*$/);
const ErrorCode = z.string().min(1).max(64).regex(/^[A-Z][A-Z0-9_]*$/);
const IdempotencyKey = z.string().min(8).max(128).regex(/^[ -~]+$/).refine(v => v.trim().length > 0);
const HttpsUrl = z.url().refine(v => v.startsWith("https://"));
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> =
  z.lazy(() => z.union([JsonPrimitive, z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema)]));
export const ApiErrorSchema = z.object({
  code: ErrorCode,
  message: z.string().min(1).max(512),
  requestId: UUID,
  details: z.record(z.string(), JsonValueSchema).refine(v => Object.keys(v).length <= 16),
}).strict();

const Integrity = z.enum(["complete", "incomplete", "stale", "revoked", "unknown"]);
const TruthClass = z.enum(["observed", "claimed"]);
const Range = z.object({ low: SignedDecimal, high: SignedDecimal }).strict()
  .refine(v => Number(v.low) <= Number(v.high), { message: "low_must_not_exceed_high" });
const Transition = z.enum(["added", "moved", "removed"]);

export const PlaylistPlacementEventV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  recordingId: UUID,
  playlistRef: z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  transition: Transition,
  position: z.number().int().positive().max(100000).nullable(),
  chartedAt: Instant,
  reachSnapshot: NonNegativeIntString,
  sourceCode: Code,
  sourceObservationId: UUID,
  sourceRevision: Version,
  integrity: Integrity,
  version: Version,
}).strict().superRefine((v, ctx) => {
  if (v.transition === "removed" && v.position !== null) {
    ctx.addIssue({ code: "custom", path: ["position"], message: "removed_position_must_be_null" });
  }
});
export const RecordPlaylistTransitionRequest = PlaylistPlacementEventV1.omit({
  id: true, version: true,
}).extend({
  actingPartyId: UUID,
  expectedVersion: Version.optional(),
  idempotencyKey: IdempotencyKey,
}).strict();

export const PlacementQualityV1 = z.object({
  placementEventId: UUID,
  evidenceRange: Range.nullable(),
  sampleCount: z.number().int().nonnegative(),
  fraudContext: z.enum(["unknown", "low_risk", "risk_indicators"]),
  qualityState: z.enum(["unknown", "neutral", "positive", "risk_first"]),
  policyVersion: Version,
  derivedAt: Instant,
}).strict().superRefine((v, ctx) => {
  if (v.qualityState === "positive" && (v.fraudContext !== "low_risk" || v.evidenceRange === null)) {
    ctx.addIssue({ code: "custom", path: ["qualityState"], message: "positive_requires_low_risk_evidence" });
  }
});
export const RenderPlacementAlertRequest = z.object({
  placementEventId: UUID,
  placementVersion: Version,
  qualityPolicyVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
export const PlacementAlertResponse = z.object({
  placementEventId: UUID,
  quality: PlacementQualityV1,
  tone: z.enum(["neutral", "positive", "risk_first"]),
  messageCode: Code,
  celebrationSuppressed: z.boolean(),
  renderedAt: Instant,
}).strict();

export const ChartObservationV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  subjectPartyId: UUID,
  chartSourceCode: Code,
  chartCode: Code,
  periodDate: DateOnly,
  position: z.number().int().positive().max(100000),
  methodologyRef: HttpsUrl,
  sourceObservationId: UUID,
  sourceRevision: Version,
  integrity: Integrity,
  version: Version,
}).strict();
export const RecordChartObservationRequest = ChartObservationV1.omit({
  id: true, version: true,
}).extend({
  actingPartyId: UUID,
  idempotencyKey: IdempotencyKey,
}).strict();

const CuratorEvidenceAvailable = z.object({
  state: z.literal("available"),
  curatorId: UUID,
  curatorKind: z.enum(["public_professional", "institution"]),
  displayName: z.string().min(1).max(120),
  evidenceRange: Range,
  sampleCount: z.number().int().positive(),
  freshness: z.enum(["current", "stale"]),
  fraudContext: z.enum(["unknown", "low_risk", "risk_indicators"]),
  sourceRefs: z.array(HttpsUrl).min(1).max(8),
  policyVersion: Version,
  derivedAt: Instant,
}).strict();
const CuratorEvidenceSuppressed = z.object({
  state: z.literal("suppressed"),
  reasonCode: z.enum(["b2_disabled", "below_privacy_floor", "no_qualifying_data"]),
  policyVersion: Version,
}).strict();
export const CuratorEvidenceV1 = z.discriminatedUnion("state", [
  CuratorEvidenceAvailable, CuratorEvidenceSuppressed,
]);
export const CuratorEvidenceRequest = z.object({
  curatorId: UUID,
  policyVersion: Version,
  sourceRevision: Version.optional(),
}).strict();

export const AudienceGeoLayerV1 = z.object({
  subjectPartyId: UUID,
  sourceLayer: z.enum(["owned", "rented"]),
  coarseCellCode: Code,
  metricCode: Code,
  metricValue: SignedDecimal,
  engagementDepth: Ratio,
  truthClass: TruthClass,
  integrity: Integrity,
  sourceRevision: Version,
  privacyPolicyVersion: Version,
  observedAt: Instant,
}).strict();
export const AudienceGeographyRequest = z.object({
  subjectId: UUID,
  sourceLayers: z.array(z.enum(["owned", "rented"])).min(1).max(2),
  metricCode: Code,
  windowDays: z.coerce.number().int().min(7).max(1095),
  privacyPolicyVersion: Version,
}).strict();
export const AudienceGeographyResponse = z.object({
  subjectPartyId: UUID,
  layers: z.array(AudienceGeoLayerV1).max(500),
  suppressedCellCount: z.number().int().nonnegative(),
  coarseningLevel: z.enum(["region", "country", "supra_region"]),
  derivedAt: Instant,
}).strict().refine(v => new Set(v.layers.map(x => x.sourceLayer)).size <= 2);

const EvidenceFactor = z.object({
  code: Code,
  direction: z.enum(["support", "contradict", "unknown"]),
  weightBand: z.enum(["low", "medium", "high"]),
}).strict();
export const RoutingCandidateV1 = z.object({
  marketCode: Code,
  evidenceFactors: z.array(EvidenceFactor).min(1).max(16),
  bookingHistory: z.enum(["positive", "negative", "mixed", "none"]),
  missingInputs: z.array(Code).max(16),
  confidence: Ratio,
  rank: z.number().int().positive().max(50).nullable(),
}).strict();
export const RequestRoutingShortlistRequest = z.object({
  actingPartyId: UUID,
  subjectPartyId: UUID,
  tourContextId: UUID,
  candidateMarketCodes: z.array(Code).min(1).max(50),
  sourceRevision: Version,
  routingPolicyVersion: Version,
  expectedVersion: Version.optional(),
  idempotencyKey: IdempotencyKey,
}).strict().refine(v => new Set(v.candidateMarketCodes).size === v.candidateMarketCodes.length, {
  path: ["candidateMarketCodes"], message: "candidate_markets_must_be_unique",
});
export const RoutingShortlistResponse = z.object({
  state: z.enum(["ranked", "insufficient"]),
  candidates: z.array(RoutingCandidateV1).max(50),
  globalMissingInputs: z.array(Code).max(16),
  sourceRevision: Version,
  policyVersion: Version,
  derivedAt: Instant,
}).strict().superRefine((v, ctx) => {
  if (v.state === "ranked" && v.candidates.some(x => x.rank === null)) {
    ctx.addIssue({ code: "custom", path: ["candidates"], message: "ranked_requires_all_ranks" });
  }
  if (v.state === "insufficient" && v.candidates.some(x => x.rank !== null)) {
    ctx.addIssue({ code: "custom", path: ["candidates"], message: "insufficient_has_no_ranking" });
  }
});

export const ShowImpactEstimateV1 = z.object({
  id: UUID,
  ownerPartyId: UUID,
  showId: UUID,
  beforeStart: DateOnly,
  beforeEnd: DateOnly,
  afterStart: DateOnly,
  afterEnd: DateOnly,
  resultState: z.enum(["measured", "null", "declined"]),
  estimateRange: Range.nullable(),
  confidence: Ratio.nullable(),
  confounderCodes: z.array(Code).max(16),
  methodVersion: Version,
  sourceRevision: Version,
  version: Version,
  derivedAt: Instant,
}).strict().superRefine((v, ctx) => {
  if (v.resultState === "measured" && (v.estimateRange === null || v.confidence === null)) {
    ctx.addIssue({ code: "custom", path: ["estimateRange"], message: "measured_requires_range_and_confidence" });
  }
  if (v.resultState !== "measured" && (v.estimateRange !== null || v.confidence !== null)) {
    ctx.addIssue({ code: "custom", path: ["estimateRange"], message: "non_measured_range_and_confidence_must_be_null" });
  }
});
export const EvaluateShowImpactRequest = z.object({
  actingPartyId: UUID,
  ownerPartyId: UUID,
  showId: UUID,
  beforeStart: DateOnly,
  beforeEnd: DateOnly,
  afterStart: DateOnly,
  afterEnd: DateOnly,
  methodVersion: Version,
  sourceRevision: Version,
  expectedVersion: Version.optional(),
  idempotencyKey: IdempotencyKey,
}).strict().superRefine((v, ctx) => {
  const bs = Date.parse(v.beforeStart), be = Date.parse(v.beforeEnd);
  const as = Date.parse(v.afterStart), ae = Date.parse(v.afterEnd);
  if (!(bs <= be && be < as && as <= ae)) {
    ctx.addIssue({ code: "custom", path: ["beforeStart"], message: "windows_must_be_ordered_and_non_overlapping" });
  }
});

const AnomalyFact = z.object({
  code: Code,
  observedValue: SignedDecimal,
  baselineRange: Range,
}).strict();
export const AnomalyObservationV1 = z.object({
  id: UUID,
  caseId: UUID,
  ownerPartyId: UUID,
  subjectPartyId: UUID,
  seriesRef: UUID,
  truthClass: TruthClass,
  ruleCode: Code,
  ruleVersion: Version,
  policyVersion: Version,
  unusualFacts: z.array(AnomalyFact).min(1).max(16),
  confidence: Ratio,
  limitCodes: z.array(Code).min(1).max(16),
  integrity: Integrity,
  observedAt: Instant,
  state: z.enum(["active", "retracted"]),
  version: Version,
}).strict();
export const DetectAnomalyRequest = AnomalyObservationV1.omit({
  id: true, caseId: true, state: true, version: true,
}).extend({
  sourceRevision: Version,
  sourceEventId: UUID,
  idempotencyKey: IdempotencyKey,
}).strict();

export const ExportAnomalyDossierRequest = z.object({
  caseId: UUID,
  formats: z.array(z.enum(["html", "pdf", "csv"])).min(1).max(3),
  expectedVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
export const DossierExportAccepted = z.object({
  caseId: UUID,
  jobId: UUID,
  state: z.literal("queued"),
  formats: z.array(z.enum(["html", "pdf", "csv"])).min(1).max(3),
  caseVersion: Version,
  acceptedAt: Instant,
}).strict();

export const VendorCoincidenceRequest = z.object({
  vendorId: UUID,
  ownerPartyId: UUID,
  policyVersion: Version,
  sourceRevision: Version.optional(),
}).strict();
const VendorAvailable = z.object({
  state: z.literal("available"),
  vendorId: UUID,
  eligibleCampaignCount: z.number().int().positive(),
  coincidentOutcomeCount: z.number().int().nonnegative(),
  coincidenceRange: Range,
  retractionCount: z.number().int().nonnegative(),
  policyVersion: Version,
  sourceRevision: Version,
  derivedAt: Instant,
}).strict();
const VendorInsufficient = z.object({
  state: z.literal("insufficient"),
  vendorId: UUID,
  reasonCode: z.enum(["b2_disabled", "below_privacy_floor", "no_linkage", "no_qualifying_data"]),
  policyVersion: Version,
}).strict();
export const VendorCoincidenceV1 = z.discriminatedUnion("state", [VendorAvailable, VendorInsufficient]);

const ScoutingPurpose = z.enum([
  "discoverable_for_work", "watchable_for_evaluation", "momentum_signals",
]);
export const ScoutingConsentDecisionV1 = z.object({
  subjectPartyId: UUID,
  purpose: ScoutingPurpose,
  action: z.enum(["allow", "withdraw"]),
  allowed: z.boolean(),
  policyVersion: Version,
  evaluatedAt: Instant,
  version: Version,
}).strict().refine(v => v.allowed === (v.action === "allow"));
export const WatchReferenceV1 = z.object({
  id: UUID,
  scoutEntityId: UUID,
  subjectOpaqueId: UUID,
  purpose: z.literal("watchable_for_evaluation"),
  createdAt: Instant,
  state: z.enum(["active", "revoked"]),
  version: Version,
}).strict();
export const AddPrivateWatchRequest = z.object({
  actingPartyId: UUID,
  scoutEntityId: UUID,
  subjectOpaqueId: UUID,
  purpose: z.literal("watchable_for_evaluation"),
  consentPolicyVersion: Version,
  expectedVersion: Version.optional(),
  idempotencyKey: IdempotencyKey,
}).strict();
export const WatchCreateResponse = z.discriminatedUnion("state", [
  z.object({ state: z.literal("created"), watch: WatchReferenceV1 }).strict(),
  z.object({ state: z.literal("no_result") }).strict(),
]);

export const MomentumObservationV1 = z.object({
  id: UUID,
  watchId: UUID,
  subjectOpaqueId: UUID,
  metricCode: Code,
  baselineValue: SignedDecimal,
  currentValue: SignedDecimal,
  absoluteFloor: NonNegativeDecimal,
  relativeFloor: NonNegativeDecimal,
  integrity: Integrity,
  sourceRevision: Version,
  observedAt: Instant,
  state: z.enum(["observed", "queued", "dispatched", "suppressed"]),
  version: Version,
}).strict();
export const FireMomentumSignalRequest = MomentumObservationV1.omit({
  id: true, state: true, version: true,
}).extend({
  consentPolicyVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
export const MomentumSignalReceipt = z.object({
  state: z.enum(["recorded", "suppressed"]),
  observationId: UUID.nullable(),
  acceptedAt: Instant,
}).strict();

export const ScoutingDiscoveryRequest = z.object({
  purpose: z.literal("discoverable_for_work"),
  creditQuery: z.string().trim().min(2).max(80),
  roleCodes: z.array(Code).max(8),
  regionCode: Code.optional(),
  limit: z.coerce.number().int().min(1).max(25).default(20),
  consentPolicyVersion: Version,
}).strict();
const CreditNativeResult = z.object({
  subjectOpaqueId: UUID,
  displayCredit: z.string().min(1).max(160),
  roleCodes: z.array(Code).min(1).max(8),
  consentPolicyVersion: Version,
}).strict();
export const ScoutingDiscoveryResponse = z.object({
  results: z.array(CreditNativeResult).max(25),
  capped: z.literal(true),
  queryClass: Code,
  paginationMode: z.literal("bounded_single_page"),
  pageSize: z.number().int().min(1).max(25),
  nextCursor: z.null(),
  sort: z.literal("display_credit_normalized_asc_subject_opaque_id_asc"),
}).strict();

export const RevokeScoutingVisibilityRequest = z.object({
  actingPartyId: UUID,
  subjectPartyId: UUID,
  purpose: ScoutingPurpose,
  policyVersion: Version,
  expectedVersion: Version,
  idempotencyKey: IdempotencyKey,
}).strict();
~~~

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 40.04 | Pagination N/A: this GET returns one available-or-suppressed curator-evidence projection; strict request parsing rejects cursor, offset, page, limit, sort, and filter keys. | The available branch has `sourceRefs` with 1–8 HTTPS URLs; the suppressed branch and every other returned field have no collections. |
| 40.05 | Pagination N/A: this GET returns one audience-geography projection rather than an enumerable resource page; strict request parsing rejects pagination keys. | `layers` contains at most 500 `AudienceGeoLayerV1` entries and at most two distinct `sourceLayer` values; entries contain no nested collections. |
| 40.10 | Pagination N/A: this GET returns one available-or-insufficient vendor-coincidence projection; strict request parsing rejects cursor, offset, page, limit, sort, and filter keys. | Neither discriminated-union branch contains a returned collection. |

### Operation 40.13 bounded-list contract

- **Pagination strategy:** one bounded page only, preserving the IA prohibition on enumeration. `limit` defaults to 20 and has an absolute maximum of 25. The response always returns `paginationMode: "bounded_single_page"`, the applied `pageSize`, `nextCursor: null`, and `capped: true`; it never exposes total count, offset, page number, continuation token, or whether additional eligible subjects exist.
- **Stable order:** after purpose consent, minor eligibility, and suppression are applied inside the same security-definer SQL statement, rows order by normalized display credit ascending under PostgreSQL `COLLATE "C"`, then `subject_opaque_id` ascending as the unique tie-break. Repeating the same normalized query and policy version returns the same ordered prefix for the same committed snapshot; changing `limit` can only shorten or extend that prefix.
- **Filter allowlist:** the only accepted query fields are `purpose`, `creditQuery`, `roleCodes`, `regionCode`, `limit`, and `consentPolicyVersion`. Strict parsing rejects `cursor`, `offset`, `page`, `sort`, raw subject/party IDs, metrics, source/provider selectors, consent-state selectors, and arbitrary field predicates with BE00 400 `VALIDATION_FAILED` before query execution.
- **Anti-traversal key:** the query-family HMAC covers scout organization, normalized `creditQuery`, sorted/deduplicated `roleCodes`, normalized `regionCode` or absence, purpose, and consent-policy version; it intentionally excludes `limit`, so varying page size cannot evade the 50/day family budget. Audit storage retains only the digest, query class, result band, applied cap, and abuse decision.

### Cross-field and header rules

| ID | Deterministic validation | Stable failure/outcome |
|---|---|---|
| 40.01 | Producer/source binding, observed truth, integrity, transition/position, event time, reach snapshot, body/header key | 422 `SOURCE_INTEGRITY_INSUFFICIENT` or `TRANSITION_INVALID`; 409 source revision/key |
| 40.02 | Placement/version/current policy; risk/unknown evaluated before celebratory tone | Unknown/risky returns neutral/risk-first success, never positive |
| 40.03 | Registered chart source, period date, position, methodology HTTPS, source revision | 422 `SOURCE_NOT_REGISTERED`, `PERIOD_INVALID`, or `POSITION_INVALID` |
| 40.04 | Curator is public professional/institution; B2 before evidence query; floor before range/n | 403 `B2_DISABLED`; permitted low-n returns suppressed without n |
| 40.05 | Owner/operator scope; source layers kept separate; cells coarsen then suppress; no source averaging | 403 `OWNER_FORBIDDEN`; sparse cells omitted with count |
| 40.06 | Subject/tour ownership, candidate cap, source/policy revision; booking history outranks inferred audience | Insufficient facts returns 200 `insufficient` with no ranks |
| 40.07 | First-party booking, non-overlapping ordered windows, source/method revision; confounder policy | Sparse/confounded returns 200 null/declined, never fabricated estimate |
| 40.08 | Registered detector, observed/integrity-qualified series, rule threshold, limits, hedged codes | 422 `RULE_NOT_TRIGGERED` or `SERIES_INTEGRITY_INSUFFICIENT` |
| 40.09 | Case ownership, step-up, exact formats, case version, no auto-recipient/provider field | 403 `EXPORT_FORBIDDEN` or `STEP_UP_REQUIRED` |
| 40.10 | Linked campaign ownership; B2 for shared view; retractions applied before range/count | Below floor/no linkage returns 200 insufficient |
| 40.11 | Scout mandate, live opaque subject resolution, current purpose consent, minor gate | Absent/denied/suppressed/minor/consent outage all return identical 200 `no_result` |
| 40.12 | Active watch, observed integrity, absolute and relative floors, fire-time consent | Quiet/revoked/below-floor all return generic 202 suppressed and notify nobody |
| 40.13 | Purpose mandate; exact six-field filter allowlist; default 20/max 25 bounded page; fixed normalized-credit/opaque-ID order; query-family budget excludes `limit`; no cursor/offset/page/sort | Empty/denied/suppressed results are identical 200 empty arrays; extra traversal fields fail 400 `VALIDATION_FAILED` |
| 40.14 | Actor is subject, one purpose, current policy/version; revoke invalidates index/watch/pending signal atomically | 409 stale version; success reveals no scout/watch count |

### Contract examples

| ID | Valid request | Success |
|---|---|---|
| 40.01 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","ownerPartyId":"018f0000-0000-7000-8000-000000000001","recordingId":"018f0000-0000-7000-8000-000000000010","playlistRef":"playlist:abc","transition":"added","position":8,"chartedAt":"2026-08-28T12:00:00Z","reachSnapshot":"240000","sourceCode":"provider_a","sourceObservationId":"018f0000-0000-7000-8000-000000000011","sourceRevision":"4","integrity":"complete","idempotencyKey":"placement-event-4"}` | 201 `PlaylistPlacementEventV1` |
| 40.02 | `{"placementEventId":"018f0000-0000-7000-8000-000000000012","placementVersion":"1","qualityPolicyVersion":"3","idempotencyKey":"placement-alert-1"}` | 200 quality-first `PlacementAlertResponse` |
| 40.03 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","ownerPartyId":"018f0000-0000-7000-8000-000000000001","subjectPartyId":"018f0000-0000-7000-8000-000000000001","chartSourceCode":"chart_a","chartCode":"weekly_tracks","periodDate":"2026-08-21","position":12,"methodologyRef":"https://example.invalid/method","sourceObservationId":"018f0000-0000-7000-8000-000000000013","sourceRevision":"2","integrity":"complete","idempotencyKey":"chart-observation-2"}` | 201 source-specific `ChartObservationV1` |
| 40.04 | `curatorId=018f0000-0000-7000-8000-000000000014&policyVersion=3` | 200 available/suppressed `CuratorEvidenceV1` |
| 40.05 | `sourceLayers=owned&sourceLayers=rented&metricCode=engaged_listeners&windowDays=90&privacyPolicyVersion=5` | 200 separate `AudienceGeoLayerV1` items |
| 40.06 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","subjectPartyId":"018f0000-0000-7000-8000-000000000001","tourContextId":"018f0000-0000-7000-8000-000000000015","candidateMarketCodes":["us_ny","us_pa"],"sourceRevision":"8","routingPolicyVersion":"4","idempotencyKey":"routing-shortlist-8"}` | 200 ranked or insufficient response |
| 40.07 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","ownerPartyId":"018f0000-0000-7000-8000-000000000001","showId":"018f0000-0000-7000-8000-000000000016","beforeStart":"2026-07-01","beforeEnd":"2026-07-14","afterStart":"2026-07-16","afterEnd":"2026-07-29","methodVersion":"2","sourceRevision":"9","idempotencyKey":"show-impact-9"}` | 201 measured/null/declined estimate |
| 40.08 | `{"ownerPartyId":"018f0000-0000-7000-8000-000000000001","subjectPartyId":"018f0000-0000-7000-8000-000000000001","seriesRef":"018f0000-0000-7000-8000-000000000017","truthClass":"observed","ruleCode":"velocity_discontinuity","ruleVersion":"2","policyVersion":"4","unusualFacts":[{"code":"velocity_delta","observedValue":"4.2","baselineRange":{"low":"0.8","high":"1.3"}}],"confidence":0.62,"limitCodes":["source_coverage_partial"],"integrity":"complete","observedAt":"2026-08-28T12:00:00Z","sourceRevision":"7","sourceEventId":"018f0000-0000-7000-8000-000000000018","idempotencyKey":"anomaly-observation-7"}` | 201 hedged `AnomalyObservationV1` |
| 40.09 | `{"caseId":"018f0000-0000-7000-8000-000000000019","formats":["html","pdf","csv"],"expectedVersion":"3","idempotencyKey":"dossier-export-3"}` | 202 queued export job |
| 40.10 | `vendorId=018f0000-0000-7000-8000-000000000020&ownerPartyId=018f0000-0000-7000-8000-000000000001&policyVersion=4` | 200 available/insufficient coincidence |
| 40.11 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000021","scoutEntityId":"018f0000-0000-7000-8000-000000000022","subjectOpaqueId":"018f0000-0000-7000-8000-000000000023","purpose":"watchable_for_evaluation","consentPolicyVersion":"6","idempotencyKey":"watch-create-6"}` | 201 watch or 200 cause-invariant no-result |
| 40.12 | `{"watchId":"018f0000-0000-7000-8000-000000000024","subjectOpaqueId":"018f0000-0000-7000-8000-000000000023","metricCode":"audience_velocity","baselineValue":"100","currentValue":"180","absoluteFloor":"50","relativeFloor":"0.4","integrity":"complete","sourceRevision":"10","observedAt":"2026-08-28T12:00:00Z","consentPolicyVersion":"6","idempotencyKey":"momentum-fire-10"}` | 202 recorded or generic suppressed |
| 40.13 | `purpose=discoverable_for_work&creditQuery=producer&roleCodes=producer&limit=25&consentPolicyVersion=6` | 200 capped array with no cursor |
| 40.14 | `{"actingPartyId":"018f0000-0000-7000-8000-000000000001","subjectPartyId":"018f0000-0000-7000-8000-000000000001","purpose":"watchable_for_evaluation","policyVersion":"6","expectedVersion":"2","idempotencyKey":"visibility-revoke-2"}` | 200 withdraw decision without watch count |

## Authorization, Ownership, and Disclosure

### Role-to-operation policy

| Actor | Allowed operations | Explicit denial |
|---|---|---|
| Artist/entity actor | 40.04–40.10 for owned/mandated subject; export after step-up | Other artist series, sparse/shared facts, automatic reporting, public vendor accusation |
| Operator/venue | 40.04 and B2-approved operator branch of 40.05/40.10 | Contributing artist/fan identity, exact cells, paid rank |
| Scout organization actor | 40.11 and 40.13 under purpose mandate; receives consent-safe 40.12 notification | Platform enumeration, revoked metrics, watch-as-follow, hidden-result cause |
| Scouted subject | 40.14 and effective visibility read projection | Scout/watch identities or reason for quiet |
| Trust & Safety | Shard 06 case consumes explicitly shared 40.09 dossier | Direct detector control, platform verdict, automatic provider report |
| Support/steward | Named source/removal/watch case under expiring field grant | Watchlist browsing, consent override, lower floor |
| Administrator | Versioned policy/B2/minors activation under dual control | Historical mutation, accusation publication, consent override |
| Service principal | Registered 40.01–40.03, 40.08, 40.12 contract only | Cross-purpose identity join, post-filter consent, arbitrary subject query |

### 403 versus 404

- 401 means missing/invalid session or protected service identity.
- 404 conceals absent/out-of-scope placement, subject, show, anomaly case, vendor linkage, watch, or curator. Existing and concealed IDs return byte-equivalent errors.
- 403 is used only after legitimate visibility: missing mandate/step-up, closed B2, disallowed operator view, or prohibited export capability.
- 40.04 and the shared branches of 40.05/40.10 check B2 before shared computation. Below-floor permitted queries return 200 suppressed/insufficient without n/range/position.
- 40.11/40.13 return cause-invariant 200 no-result/empty for absent subject, consent denial, minor ineligibility, purpose suppression, or consent dependency failure; these branches never return 403/404 that reveal subject state.
- 40.12 returns the same 202 suppressed receipt for quiet, revoked, below-floor, or consent-unavailable conditions. No scout-facing event identifies which condition applied.
- 40.14 authenticates subject before target lookup; an actor naming a different subject gets 404 unless an established entity-authority projection makes the target visible, then 403.

### Security/privacy invariants

- Source truth/integrity labels from Shard 39 are immutable inputs; Shard 40 may only reduce confidence or suppress.
- Unknown/risky placement quality cannot default positive. Anomaly language uses registered hedged codes and always includes limitations.
- Owned/rented geography remains separate at API, database, event, and UI projection levels. Exact fan/location identity never enters Shard 40.
- B2/minors gates have no administrator/support bypass. Privacy floor is at least 20 and is rechecked on every read/cache serve.
- Routing has no paid factor; vendor coincidence cannot feed anomaly detection. Static dependency tests reject either data-flow edge.
- Watch rows contain an opaque live consent reference, no subject metric snapshot. Revocation removes the reference and leaves a non-informative tombstone.
- Search has fixed cap 25 and no cursor/offset. Query audit stores a digest/class, never raw text or reusable results.
- Dossier generation is local, artist-controlled, and produces no provider/DSP recipient field or send side effect.

## Database Schema

All records use PostgreSQL. BE00 `IdempotencyRecord`, `AuditEvent`, `OutboxEvent`, `Job`, and `ObjectRecord` are inherited and not duplicated.

### Canonical model registry

| Exact IA model | Physical table | Role |
|---|---|---|
| `playlist_placement_event` | `intelligence_private.playlist_placement_events` | Immutable source event |
| `placement_quality_projection` | `intelligence_private.placement_quality_projections` | Disposable alert-quality projection |
| `chart_observation` | `intelligence_private.chart_observations` | Source-specific chart event |
| `curator_public_reference` | `intelligence_private.curator_public_references` | Public professional/institution reference |
| `audience_geo_observation` | `intelligence_private.audience_geo_observations` | Coarse source-layer observation |
| `routing_candidate_projection` | `intelligence_private.routing_candidate_projections` | Disposable advisory candidate |
| `show_impact_analysis` | `intelligence_private.show_impact_analyses` | Private measured/null/declined analysis |
| `anomaly_case` | `intelligence_private.anomaly_cases` | Artist-owned evidence timeline |
| `anomaly_observation` | `intelligence_private.anomaly_observations` | Descriptive fact/rule observation |
| `vendor_campaign_link` | `intelligence_private.vendor_campaign_links` | Structured campaign linkage |
| `vendor_coincidence_projection` | `intelligence_private.vendor_coincidence_projections` | Private retractable aggregate |
| `scouting_visibility_instruction` | `intelligence_private.scouting_visibility_instructions` | Append-only purpose decision |
| `scout_watch` | `intelligence_private.scout_watches` | Opaque consent-live reference |
| `watch_tombstone` | `intelligence_private.watch_tombstones` | Non-informative access-ended evidence |
| `momentum_observation` | `intelligence_private.momentum_observations` | Descriptive threshold observation |
| `discovery_query_audit` | `intelligence_private.discovery_query_audits` | Abuse/cap evidence without result list |

### Exhaustive typed table definitions

- `intelligence_private.playlist_placement_events`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `recording_id uuid NOT NULL` with logical FK to the Shard 39 recording/subject binding carried by the source observation; `playlist_ref text NOT NULL CHECK (length(playlist_ref) BETWEEN 1 AND 128)`; `transition text NOT NULL CHECK (transition IN ('added','moved','removed'))`; `position integer NULL CHECK (position IS NULL OR position > 0)`; `charted_at timestamptz NOT NULL`; `reach_snapshot bigint NOT NULL CHECK (reach_snapshot >= 0)`; `source_code text NOT NULL`; `source_observation_id uuid NOT NULL` with logical FK to Shard 39 `MetricObservationV1`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `integrity text NOT NULL CHECK (integrity IN ('complete','incomplete','stale','revoked','unknown'))`; `state text NOT NULL CHECK (state IN ('active','restated'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK (transition <> 'removed' OR position IS NULL)`.
- `intelligence_private.placement_quality_projections`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `placement_event_id uuid NOT NULL REFERENCES intelligence_private.playlist_placement_events(id) ON DELETE CASCADE`; `range_low numeric(20,6) NULL`; `range_high numeric(20,6) NULL`; `sample_count integer NOT NULL CHECK (sample_count >= 0)`; `fraud_context text NOT NULL CHECK (fraud_context IN ('unknown','low_risk','risk_indicators'))`; `quality_state text NOT NULL CHECK (quality_state IN ('unknown','neutral','positive','risk_first'))`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `derived_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('current','superseded'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK ((range_low IS NULL)=(range_high IS NULL))`; `CHECK (range_low IS NULL OR range_low <= range_high)`; `CHECK (quality_state <> 'positive' OR (fraud_context='low_risk' AND range_low IS NOT NULL AND sample_count > 0))`.
- `intelligence_private.chart_observations`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `subject_id uuid NOT NULL REFERENCES platform_private.party(id)`; `chart_source_code text NOT NULL`; `chart_code text NOT NULL`; `period_date date NOT NULL`; `position integer NOT NULL CHECK (position > 0)`; `methodology_ref text NOT NULL CHECK (methodology_ref LIKE 'https://%')`; `source_observation_id uuid NOT NULL` with logical FK to Shard 39; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `integrity text NOT NULL CHECK (integrity IN ('complete','incomplete','stale','revoked','unknown'))`; `state text NOT NULL CHECK (state IN ('active','restated'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `intelligence_private.curator_public_references`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for policy ownership; `curator_kind text NOT NULL CHECK (curator_kind IN ('public_professional','institution'))`; `display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120)`; `institution_name text NULL CHECK (institution_name IS NULL OR length(institution_name) BETWEEN 1 AND 120)`; `public_source_url text NOT NULL CHECK (public_source_url LIKE 'https://%')`; `provenance_ref uuid NOT NULL` with logical FK to Shard 39 source evidence; `sample_count integer NOT NULL CHECK (sample_count >= 0)`; `removal_state text NOT NULL CHECK (removal_state IN ('active','removed'))`; `removed_at timestamptz NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK ((removal_state='removed')=(removed_at IS NOT NULL))`.
- `intelligence_private.audience_geo_observations`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `subject_id uuid NOT NULL REFERENCES platform_private.party(id)`; `source_layer text NOT NULL CHECK (source_layer IN ('owned','rented'))`; `coarse_cell_code text NOT NULL`; `metric_code text NOT NULL`; `metric_value numeric(20,6) NOT NULL`; `engagement_depth numeric(9,6) NOT NULL CHECK (engagement_depth BETWEEN 0 AND 1)`; `truth_class text NOT NULL CHECK (truth_class IN ('observed','claimed'))`; `integrity text NOT NULL CHECK (integrity IN ('complete','incomplete','stale','revoked','unknown'))`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `privacy_policy_version bigint NOT NULL CHECK (privacy_policy_version > 0)`; `observed_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('active','suppressed','superseded'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `intelligence_private.routing_candidate_projections`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `tour_context_id uuid NOT NULL` with logical FK to the authorized tour-context reference carried by the Shard 39 analytics request projection; `market_code text NOT NULL`; `evidence_factors jsonb NOT NULL CHECK (jsonb_typeof(evidence_factors)='array')` parsed by `EvidenceFactor[]`; `booking_history text NOT NULL CHECK (booking_history IN ('positive','negative','mixed','none'))`; `missing_inputs text[] NOT NULL CHECK (cardinality(missing_inputs) <= 16)`; `confidence numeric(9,6) NOT NULL CHECK (confidence BETWEEN 0 AND 1)`; `rank integer NULL CHECK (rank IS NULL OR rank BETWEEN 1 AND 50)`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `expires_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('ranked','insufficient','expired'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK (state='ranked' OR rank IS NULL)`.
- `intelligence_private.show_impact_analyses`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `show_id uuid NOT NULL` with logical FK to the Shard 39 first-party show binding carried by the analytics series; `before_start date NOT NULL`; `before_end date NOT NULL`; `after_start date NOT NULL`; `after_end date NOT NULL`; `result_state text NOT NULL CHECK (result_state IN ('measured','null','declined'))`; `range_low numeric(20,6) NULL`; `range_high numeric(20,6) NULL`; `confidence numeric(9,6) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)`; `confounder_codes text[] NOT NULL CHECK (cardinality(confounder_codes) <= 16)`; `method_version bigint NOT NULL CHECK (method_version > 0)`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `state text NOT NULL CHECK (state IN ('current','retracted'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK ((range_low IS NULL)=(range_high IS NULL))`; `CHECK ((result_state='measured')=(range_low IS NOT NULL AND range_high IS NOT NULL AND confidence IS NOT NULL))`; `CHECK (result_state='measured' OR (range_low IS NULL AND range_high IS NULL AND confidence IS NULL))`.
- `intelligence_private.anomaly_cases`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `subject_id uuid NOT NULL REFERENCES platform_private.party(id)`; `metric_code text NOT NULL`; `state text NOT NULL CHECK (state IN ('open','reviewing','closed','retracted'))`; `rule_policy_version bigint NOT NULL CHECK (rule_policy_version > 0)`; `retention_until timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `intelligence_private.anomaly_observations`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `case_id uuid NOT NULL REFERENCES intelligence_private.anomaly_cases(id) ON DELETE RESTRICT`; `series_ref uuid NOT NULL` with logical FK to Shard 39 `AnalyticsSeriesV1`; `truth_class text NOT NULL CHECK (truth_class IN ('observed','claimed'))`; `source_event_id uuid NOT NULL REFERENCES platform_private.outbox_events(id)`; `rule_code text NOT NULL`; `rule_version bigint NOT NULL CHECK (rule_version > 0)`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `unusual_facts jsonb NOT NULL CHECK (jsonb_typeof(unusual_facts)='array')` parsed by `AnomalyFact[]`; `confidence numeric(9,6) NOT NULL CHECK (confidence BETWEEN 0 AND 1)`; `limit_codes text[] NOT NULL CHECK (cardinality(limit_codes) BETWEEN 1 AND 16)`; `integrity text NOT NULL CHECK (integrity IN ('complete','incomplete','stale','revoked','unknown'))`; `observed_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('active','retracted'))`; `retraction_of_id uuid NULL REFERENCES intelligence_private.anomaly_observations(id)`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `intelligence_private.vendor_campaign_links`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `vendor_party_id uuid NOT NULL REFERENCES platform_private.party(id)`; `campaign_ref uuid NOT NULL` with logical FK to the owning campaign source; `anomaly_case_id uuid NOT NULL REFERENCES intelligence_private.anomaly_cases(id)`; `relationship_evidence_ref uuid NOT NULL` with logical FK to the source contract; `linked_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('active','retracted'))`; `retracted_at timestamptz NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK ((state='retracted')=(retracted_at IS NOT NULL))`.
- `intelligence_private.vendor_coincidence_projections`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)`; `vendor_party_id uuid NOT NULL REFERENCES platform_private.party(id)`; `eligible_campaign_count integer NOT NULL CHECK (eligible_campaign_count >= 0)`; `coincident_outcome_count integer NOT NULL CHECK (coincident_outcome_count >= 0)`; `range_low numeric(20,6) NULL`; `range_high numeric(20,6) NULL`; `retraction_count integer NOT NULL CHECK (retraction_count >= 0)`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `state text NOT NULL CHECK (state IN ('available','insufficient','superseded'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK ((range_low IS NULL)=(range_high IS NULL))`; `CHECK (range_low IS NULL OR range_low <= range_high)`.
- `intelligence_private.scouting_visibility_instructions`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for the subject; `purpose text NOT NULL CHECK (purpose IN ('discoverable_for_work','watchable_for_evaluation','momentum_signals'))`; `action text NOT NULL CHECK (action IN ('allow','withdraw'))`; `allowed boolean NOT NULL`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `eligibility_checked_at timestamptz NOT NULL`; `evaluated_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('applied','superseded'))`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK (allowed=(action='allow'))`.
- `intelligence_private.scout_watches`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for scout entity; `subject_opaque_id uuid NOT NULL` as live consent handle, not a party FK; `purpose text NOT NULL CHECK (purpose='watchable_for_evaluation')`; `consent_policy_version bigint NOT NULL CHECK (consent_policy_version > 0)`; `state text NOT NULL CHECK (state IN ('active','revoked'))`; `revoked_at timestamptz NULL`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK ((state='revoked')=(revoked_at IS NOT NULL))`. No metric snapshot field exists.
- `intelligence_private.watch_tombstones`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for scout entity; `prior_watch_id uuid NOT NULL UNIQUE REFERENCES intelligence_private.scout_watches(id)`; `purpose text NOT NULL CHECK (purpose='watchable_for_evaluation')`; `ended_at timestamptz NOT NULL`; `reason_code text NOT NULL CHECK (reason_code='access_ended')`; `state text NOT NULL CHECK (state='closed')`; `version bigint NOT NULL CHECK (version=1)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`. No subject ID, consent reason, or metric field exists.
- `intelligence_private.momentum_observations`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for scout entity; `watch_id uuid NOT NULL REFERENCES intelligence_private.scout_watches(id)`; `subject_opaque_id uuid NULL` cleared on revoke; `metric_code text NOT NULL`; `baseline_value numeric(20,6) NOT NULL`; `current_value numeric(20,6) NOT NULL`; `absolute_floor numeric(20,6) NOT NULL CHECK (absolute_floor >= 0)`; `relative_floor numeric(20,6) NOT NULL CHECK (relative_floor >= 0)`; `integrity text NOT NULL CHECK (integrity IN ('complete','incomplete','stale','revoked','unknown'))`; `source_revision bigint NOT NULL CHECK (source_revision > 0)`; `observed_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('observed','queued','dispatched','suppressed'))`; `consent_policy_version bigint NOT NULL CHECK (consent_policy_version > 0)`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`.
- `intelligence_private.discovery_query_audits`: `id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()`; `owner_id uuid NOT NULL REFERENCES platform_private.party(id)` for scout entity; `purpose text NOT NULL CHECK (purpose='discoverable_for_work')`; `query_class text NOT NULL`; `query_digest bytea NOT NULL CHECK (octet_length(query_digest)=32)`; `result_band text NOT NULL CHECK (result_band IN ('none','low','capped'))`; `result_count integer NOT NULL CHECK (result_count BETWEEN 0 AND 25)`; `result_cap integer NOT NULL CHECK (result_cap BETWEEN 1 AND 25)`; `abuse_decision text NOT NULL CHECK (abuse_decision IN ('allowed','rate_limited','blocked'))`; `policy_version bigint NOT NULL CHECK (policy_version > 0)`; `occurred_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state='recorded')`; `version bigint NOT NULL CHECK (version=1)`; `created_at timestamptz NOT NULL DEFAULT now()`; `updated_at timestamptz NOT NULL DEFAULT now()`; `CHECK (result_count <= result_cap)`. No raw query or result list field exists.

Logical cross-shard references are validated inside the creating RPC against a registered producer type, owner, source revision, and current authorization. Producer deletion/revoke events cause projection suppression or append-only restatement; they never cascade-delete evidence history.

### Indexes, RLS, and grants

| Table | Required indexes/uniqueness | RLS and grants |
|---|---|---|
| `playlist_placement_events` | Unique `(source_code,source_observation_id,transition,source_revision)`; `(owner_id,charted_at DESC)`; `(recording_id,playlist_ref,charted_at DESC)` | Owner reads; registered producer inserts via RPC; immutable; no direct DML |
| `placement_quality_projections` | Unique current `(placement_event_id,policy_version)`; `(owner_id,state,derived_at DESC)` | Owner/alert worker; shared read only after B2/floor; worker upsert RPC; TTL role |
| `chart_observations` | Unique `(chart_source_code,chart_code,period_date,subject_id,source_revision)`; `(owner_id,period_date DESC)` | Owner reads; chart producer inserts; no cross-source merge/update |
| `curator_public_references` | Unique active public source/provenance; `(removal_state,updated_at)` | Authenticated evidence RPC only; steward removal grant; no private-person insert |
| `audience_geo_observations` | Unique `(subject_id,source_layer,coarse_cell_code,metric_code,source_revision)`; `(owner_id,source_layer,observed_at DESC)` | Owner or B2 operator projection; worker writes; exact/raw geography role denied |
| `routing_candidate_projections` | `(owner_id,tour_context_id,source_revision,rank)`; `(expires_at)` | Owner/tour mandate; compute worker; no venue/vendor/paid-rank role; TTL delete |
| `show_impact_analyses` | Unique `(show_id,before_start,before_end,after_start,after_end,method_version,source_revision)` | Owner/entity mandate only; compute RPC; no public/shared select |
| `anomaly_cases` | `(owner_id,state,updated_at DESC)`; `(subject_id,metric_code,state)` | Artist owner; T&S only via separately shared Shard 06 evidence; support case grant |
| `anomaly_observations` | Unique `(series_ref,rule_code,policy_version,source_event_id)`; `(case_id,observed_at,id)` | Artist and detector; T&S no direct browse; append/retract RPC only |
| `vendor_campaign_links` | Unique active `(owner_id,vendor_party_id,campaign_ref,anomaly_case_id)`; `(vendor_party_id,state)` | Campaign owner only; worker; no vendor/public read; additive retraction |
| `vendor_coincidence_projections` | Unique current `(owner_id,vendor_party_id,policy_version,source_revision)`; `(state,updated_at)` | Owner and B2-approved aggregate only; detector role explicitly denied |
| `scouting_visibility_instructions` | Unique `(owner_id,purpose,version)`; partial current `(owner_id,purpose) WHERE state='applied'` | Subject manages; consent security-definer functions read; admin/support cannot override |
| `scout_watches` | Unique active `(owner_id,subject_opaque_id,purpose)`; `(owner_id,state,created_at DESC)` | Scout entity sees own reference only while consent function permits; subject never sees watcher |
| `watch_tombstones` | Unique `prior_watch_id`; `(owner_id,ended_at DESC)` | Scout sees only generic ended record; subject/support/admin no browse; immutable |
| `momentum_observations` | Unique `(watch_id,metric_code,source_revision,consent_policy_version)`; `(state,observed_at)` | Detector/dispatcher; scout sees dispatched projection only; revoke clears subject handle/suppresses |
| `discovery_query_audits` | `(owner_id,occurred_at DESC)`; `(query_digest,occurred_at)`; `(abuse_decision,occurred_at)` | Abuse worker/auditor only; scout gets no audit table; retention role; no result joins |

All schemas revoke `CREATE` from application roles and `ALL` from `PUBLIC`, `anon`, and `authenticated`. Named `intelligence_api`, `intelligence_source_worker`, `intelligence_detector`, `intelligence_consent_worker`, `intelligence_exporter`, and `intelligence_retention` roles receive only explicit function execution and narrow table access. Migration role owns DDL and never serves requests.

### Retention and deletion

- Placement/chart events and restatements retain seven years or the shorter lawful source/subject policy; removal suppresses presentation while immutable provider-history evidence remains.
- Quality, geography, routing, and vendor projections expire after 30 days; show-impact projections after 365 days. Security/privacy revoke purges immediately.
- Curator public reference removal hides the row immediately; minimal public-source/removal evidence retains 365 days. No private-person enrichment survives.
- Artist anomaly case/evidence retains seven years from closure unless owner deletion, shorter lawful policy, or legal hold applies. Export objects inherit BE00 expiry and signed-link rules.
- Active vendor campaign links retain while their campaign/case is active; retraction evidence retains with the anomaly case. Projection cannot ratchet after retraction.
- Revoked watch removes `subject_opaque_id` and queued metrics in the same transaction; generic tombstone retains 365 days. Momentum observations retain 90 days, with immediate subject-handle clearing on revoke.
- Discovery query audits retain 90 days for abuse defense; raw query/result rows never exist. Legal hold cannot widen RLS or resurrect consent.

## State Machines and Deterministic Invariants

| Aggregate | Allowed transitions | Forbidden |
|---|---|---|
| Playlist/chart fact | Append `active` event; restatement appends new `restated` relation; prior immutable | In-place value/reach/period/source overwrite; cross-source merge |
| Placement quality | `current → superseded`; new policy/source creates current version | Unknown/risky → positive default; deletion of placement fact |
| Curator reference | `active → removed` | Private-person inference or removed-source continued display |
| Geo observation | `active → suppressed/superseded` | Source averaging, exact cell exposure, post-query floor check |
| Routing projection | `ranked/insufficient → expired` | Rank with insufficient facts, optimized itinerary, paid factor |
| Show impact | Terminal `measured`, `null`, or `declined`; later source correction creates new version/retracts old | Causal certainty, non-first-party show, fabricated point estimate |
| Anomaly case | `open → reviewing → closed`; any non-retracted → `retracted` | Fraud/intent verdict, all-clear state, automatic external report |
| Anomaly observation | `active → retracted` via additive record | Destructive rewrite, accusatory text, claimed data promoted to observed |
| Vendor link/projection | Link `active → retracted`; projection `available/insufficient → superseded` | Detector input, public score, retraction omission |
| Scouting visibility | Append `allow` or `withdraw`; latest valid purpose instruction controls | Cross-purpose inference, admin override, automatic age-threshold enable |
| Watch | `active → revoked` plus immutable generic tombstone | Durable subject snapshot, follow semantics, reason disclosure |
| Momentum | `observed → queued → dispatched` or any pre-dispatch → `suppressed` | Prediction, fire without both floors/integrity/current consent |
| Discovery audit | Terminal `recorded` | Raw query/result list, cursor/offset enumeration |

Further invariants:

1. Current placement derives from event order by provider event time/source sequence; ingestion time only breaks exact source ties.
2. Event-time reach never updates when current playlist reach changes.
3. Chart source/methodology remains visible; conflicting sources coexist.
4. Booking history outranks inferred audience in routing policy.
5. Vendor coincidence has no code/data dependency into anomaly detection.
6. Consent and minor eligibility are re-evaluated inside the database query/fire transaction.
7. Revocation atomically removes discovery index access, live watch reference, queued signal eligibility, and subject-bearing projections; tombstone reveals only access ended.
8. No clear/all-safe anomaly state exists.

## Middleware and Policies

Ordered Hono chain:

1. BE00 request/trace, restore epoch, security headers.
2. Named CORS and exact origin/preflight before authentication.
3. Method/content/media/body/query/cap gates.
4. Actor/provider/query-family/watch rate budget.
5. Human or protected service authentication.
6. Acting-party/mandate and recent step-up where required.
7. CSRF for credentialed browser commands; internal routes reject browser authority.
8. Strict Zod 4 plus forbidden-field/accusatory-term validation.
9. Owner/BOLA, source-producer, B2/minors, purpose consent, and support-grant authorization.
10. Idempotency and exact version/CAS for commands; source/policy revision for reads.
11. One RPC transaction for domain state, audit, idempotency, job/outbox as applicable.
12. Strict response parse, cache, safe telemetry, and scrubbed error boundary.

| ID | Validation policy | Authorization policy | Rate policy | CORS |
|---|---|---|---|---|
| 40.01 | Source transition/integrity | Registered placement producer | `intel-source-write` | `BE00-CORS-DENY` |
| 40.02 | Placement/quality policy | Registered alert worker | `intel-alert-worker` | `BE00-CORS-DENY` |
| 40.03 | Chart/source/period | Registered chart producer | `intel-source-write` | `BE00-CORS-DENY` |
| 40.04 | Public curator/policy/floor | Authenticated context plus B2 | `intel-curator-read` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.05 | Subject/layer/coarse window | Owner/operator B2 branch | `intel-geo-read` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.06 | Subject/tour/candidates | Routing mandate | `intel-routing-compute` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.07 | Show/windows/method | First-party show owner | `intel-impact-compute` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.08 | Series/rule/facts/limits | Registered detector | `intel-detector` | `BE00-CORS-DENY` |
| 40.09 | Case/formats/version | Owner, step-up, export | `intel-export` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.10 | Vendor/owner/policy | Linked owner, B2 branch | `intel-vendor-read` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.11 | Scout/opaque subject/purpose | Mandate plus live consent | `intel-watch-write` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.12 | Watch/thresholds/integrity | Detector plus fire-time consent | `intel-signal-fire` | `BE00-CORS-DENY` |
| 40.13 | Purpose/credit query/cap | Scout mandate plus in-query consent | `intel-discovery-family` | `BE00-CORS-WEB-CREDENTIALLED` |
| 40.14 | Subject/purpose/version | Subject self/entity authority | `intel-consent-revoke` | `BE00-CORS-WEB-CREDENTIALLED` |

## Data Flow, Concurrency, and External Seams

### Operation flows

- **40.01** verifies the Shard 39 producer and source binding, parses observed integrity, locks source tuple, appends placement/restatement, audit/idempotency/outbox, and emits `intelligence.playlist.transitioned.v1` atomically.
- **40.02** re-reads current placement/quality policy, derives risk-first quality before reach copy, writes/supersedes projection and alert outbox under one key, and suppresses praise when quality is risky/unknown.
- **40.03** validates chart registry/methodology/period, appends source-specific observation with no merge, and emits `intelligence.chart.observed.v1`.
- **40.04** checks B2 before curator lookup, admits only public professional/institution references, applies floor before range/n, and returns suppressed without low-n evidence.
- **40.05** authorizes subject/operator branch, loads Shard 39 geo layers, preserves source layers, coarsens/suppresses cells before response/cache, and emits changed event only for complete projection replacement.
- **40.06** pins subject/tour/source/policy, orders booking history above audience inference, derives factor explanations/missing inputs, and stores ranked or insufficient projection without route optimization.
- **40.07** verifies first-party show, locks method/source tuple, evaluates windows/confounders, stores measured/null/declined private analysis, and emits `intelligence.show_impact.derived.v1`.
- **40.08** accepts only registered detector facts, rejects/lower-confidence claimed/incomplete input per policy, locks unique series/rule/source, creates/reuses case, appends hedged observation, and emits `intelligence.anomaly.observed.v1`.
- **40.09** verifies owner/step-up/version, commits BE00 job/object intent/audit/outbox, returns 202, and exporter renders accessible HTML/PDF/CSV with no external recipient/send.
- **40.10** reads owner-linked campaigns, applies retractions first, enforces B2/floor for shared view, and returns available/insufficient. Projection is structurally absent from detector input.
- **40.11** resolves opaque subject inside consent/minor query; allowed path locks unique watch and stores no metrics; all denied/unknown paths return identical no-result and create no watch.
- **40.12** locks watch/source/policy, rechecks current consent/minor gate and both floors, appends descriptive observation/outbox when eligible, otherwise returns generic suppressed and emits no scout notification.
- **40.13** validates the six-field allowlist and query-family budget, applies consent/minor/suppression predicates inside one security-definer SQL statement, orders by normalized display credit under `COLLATE "C"` then opaque subject ID, writes digest/class/count-band audit, and returns one bounded page (default 20, max 25) with no cursor, offset, total, or traversal signal.
- **40.14** locks subject/purpose current instruction, appends withdraw, marks watches revoked, creates tombstones, clears/suppresses pending momentum subject data, removes index rows, emits `intelligence.scouting_visibility.changed.v1`, then commits atomically.

### External integration seams

| Seam | Exact request → response | Timeout/retry | Circuit/failure |
|---|---|---|---|
| Shard 39 `GetAnalyticsSeriesV1` | `{subjectPartyId,metricCode,sourceCodes,windowStart,windowEnd,sourceRevision?}` → `{seriesRef,revision,truthClass,points:[{period,value,sourceCode}],integrity:{state,coverage,gaps}}` | 1500ms; 2 safe reads at 100ms/300ms | Open 5 failures/30s for 30s; return unavailable/declined, never interpolate |
| Shard 39 `GetGeoLayersV1` | `{subjectPartyId,sourceLayers,metricCode,windowDays,revision}` → `{revision,layers:[{sourceLayer,cellCode,value,depth,truthClass,integrity}]}` | 1500ms; 2 reads at 100ms/300ms | Open 5/30s for 30s; no cached exact cells; suppress response |
| Shard 39 source-event port | `{sourceObservationId,sourceCode,expectedRevision}` → `{subjectPartyId,truthClass,integrity,occurredAt,revision}` | 1000ms; 2 reads at 100ms/300ms | Fail closed; no Shard 40 source truth created |
| Shard 06 evidence port | Explicit actor action `{actorPartyId,caseId,dossierObjectId,purpose,caseVersion}` → `{accepted,evidenceRef,trustCaseVersion}` | 1500ms; 2 safe requests at 200ms/600ms | Open 5/30s for 30s; dossier remains artist-controlled; no automatic share/report |
| Shard 00 settings/B2/minors | `{settingCodes,expectedVersions,subjectEligibilityRef?}` → `{values,versions,b2Enabled,minorEligible}` | 500ms; 2 reads at 50ms/150ms | Open 5/30s for 30s; shared/scouting paths fail closed |
| BE00 PostgreSQL RPC | `{operationId,requestContext,normalizedInput,inputDigest,expectedVersion?}` → `{resourceIds,versions,outboxIds,jobId?,replayed}` | 1500ms; 3 transaction-safe retries at 25/75/200ms only for serialization/deadlock | Open 5 connectivity failures/30s for 30s; no commit/no success |
| Cloudflare Queue `intelligence-domain-v1` | `{eventId,eventType,schemaVersion,aggregateId,aggregateVersion,correlationId,causationId}` → acknowledgement | 1,000 ms dispatch deadline; 4 total attempts with full-jitter caps 250ms/1s/4s; retry timeout, connection reset, 408/429/5xx; terminal binding/auth/schema/digest and non-429 4xx; consumer has 8 attempts with full-jitter caps 1s/5s/30s/2m/10m/15m/15m | Dispatcher and consumer circuits each open after 5 retryable failures/30s for 30s, admit one half-open probe, close after two successes, and reopen on failure; dispatch exhaustion leaves durable outbox for 60s sweeper; consumer attempt 8 DLQs/alerts; no dual-write rollback |
| BE00 object/export renderer | `{jobId,caseId,caseVersion,formats,fieldPolicyVersion}` → `{objectIds,manifestObjectId,completedAt}` | 15s per object; 3 known-no-effect attempts at 1/5/25s | Open 5/60s for 60s; job failed/manual review; no partial manifest/signed link |

Retries cease at deadlines. Validation, auth, stale version, B2/minors/consent denial, floor suppression, no-result, and rule-not-triggered are not retried.

### Exact retryability and circuit closure

Attempt totals include the initial attempt. Each listed delay is a full-jitter cap, chosen uniformly from zero through the cap. Unless a row says otherwise, a half-open circuit admits one probe at a time, closes after two consecutive successful probes, and reopens for the full interval after a retryable probe failure.

| Seam | Exact attempts and retry classification | Circuit open, half-open, and fallback |
|---|---|---|
| Shard 39 GetAnalyticsSeriesV1 | 1,500 ms per attempt; 3 attempts total; retry caps 100 ms then 300 ms. Retry timeout, connection reset, 408, 429, and 5xx; invalid subject/metric/window, auth denial, stale revision, response-schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open series probe. Fallback returns unavailable/declined and never interpolates or substitutes another source. |
| Shard 39 GetGeoLayersV1 | 1,500 ms per attempt; 3 attempts total; retry caps 100 ms then 300 ms. Retry timeout, connection reset, 408, 429, and 5xx; invalid layer/metric/window, auth denial, stale revision, schema failure, privacy denial, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open geography probe. Fallback suppresses the response and never serves cached exact cells. |
| Shard 39 source-event port | 1,000 ms per attempt; 3 attempts total; retry caps 100 ms then 300 ms. Retry timeout, connection reset, 408, 429, and 5xx; missing/invalid observation, integrity failure, auth denial, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open source-event probe. Fallback fails closed and creates no Shard 40 source truth. |
| Shard 06 evidence port | 1,500 ms per attempt; 3 attempts total; retry caps 200 ms then 600 ms. Retry known-no-effect timeout/connection failure, 408, 429, and 5xx; consent/purpose denial, invalid case/version, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open evidence probe. Fallback keeps the dossier artist-controlled and creates no share/report. |
| Shard 00 settings/B2/minors | 500 ms per attempt; 3 attempts total; retry caps 50 ms then 150 ms. Retry timeout, connection reset, 408, 429, and 5xx; disabled setting, ineligible minor state, version mismatch, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open settings probe. Shared and scouting paths fail closed without stale-policy fallback. |
| BE00 PostgreSQL RPC | 1,500 ms per transaction attempt; 4 attempts total; retry caps 25 ms, 75 ms, and 200 ms only for SQLSTATE 40001 or 40P01. Validation, authorization/RLS, constraint, idempotency-digest, and all other SQL failures are terminal. | Open after 5 connectivity failures in 30 s for 30 s; one half-open read-only health probe precedes one RPC. Fallback is no commit/no success; a committed outbox row is never rolled back for later dispatch failure. |
| Cloudflare Queue intelligence-domain-v1 | 1,000 ms dispatch deadline; 4 dispatch attempts total; retry caps 250 ms, 1 s, and 4 s. Retry timeout, connection reset, 408, 429, and 5xx; invalid binding/auth/schema/digest and non-429 4xx are terminal and alert. Consumer work has 8 attempts with caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min; terminal schema/digest conflicts quarantine immediately. | Dispatcher opens after 5 retryable failures in 30 s for 30 s; one half-open dispatch probe. Open/exhausted leaves the durable outbox pending for the 60 s sweeper. Consumer partition uses the same open rule; attempt 8 moves the event to DLQ with alert and preserves the last verified projection. |
| BE00 object/export renderer | 15,000 ms per object attempt; 4 attempts total; retry caps 1 s, 5 s, and 25 s. Retry only known-no-effect timeout/connection failure, 408, 429, and 5xx; invalid case/version/format, auth/schema failure, non-429 4xx, and ambiguous object creation are terminal for blind retry. | Open after 5 retryable failures in 60 s for 60 s; half-open performs one object-status probe before one render. Fallback fails the job for manual review and publishes no partial manifest or signed link. |

## Event and Consumer Contracts

All use BE00 envelope: `eventId uuid`, exact `eventType`, `schemaVersion integer=1`, `occurredAt timestamptz`, `aggregateId uuid`, `aggregateVersion decimal string`, `actorPartyId uuid`, `correlationId uuid`, nullable `causationId uuid`, `idempotencyDigest hex32`, `privacyClass`.

| Exact event type | Strict required payload | Consumer/dedupe |
|---|---|---|
| `intelligence.playlist.transitioned.v1` | `placementId uuid; recordingId uuid; playlistRef text; transition enum; period timestamptz; reachSnapshot bigint; sourceCode text` | Alerts/dashboard; `(placementId,aggregateVersion)` |
| `intelligence.chart.observed.v1` | `observationId uuid; chartCode text; sourceCode text; subjectPartyId uuid; period date; position integer; methodologyRef text` | Private timeline; `(observationId,aggregateVersion)` |
| `intelligence.geo.changed.v1` | `subjectPartyId uuid; sourceLayer enum; coarseCellCodes text array; integrity enum; privacyPolicyVersion bigint; sourceRevision bigint` | Routing/private map; `(subjectPartyId,sourceLayer,sourceRevision)` |
| `intelligence.show_impact.derived.v1` | `analysisId uuid; showId uuid; resultState enum; range nullable decimal pair; confidence nullable numeric; confounderCodes text array; methodVersion bigint` | Artist report; `(analysisId,aggregateVersion)` |
| `intelligence.anomaly.observed.v1` | `caseId uuid; observationId uuid; subjectPartyId uuid; metricFactCodes text array; confidence numeric; limitCodes text array; ruleVersion bigint` | Artist evidence; Shard 06 only after explicit share; `(observationId,aggregateVersion)` |
| `intelligence.vendor_coincidence.changed.v1` | `vendorPartyId uuid; eligibleCount integer; range nullable pair; retractionDelta integer; policyVersion bigint; sourceRevision bigint` | Private vendor view; `(vendorPartyId,sourceRevision,policyVersion)` |
| `intelligence.scouting_visibility.changed.v1` | `subjectPartyId uuid; purpose enum; action enum; policyVersion bigint; instructionVersion bigint` | Index/watch/signal invalidation; `(subjectPartyId,purpose,instructionVersion)` |
| `intelligence.momentum.observed.v1` | `observationId uuid; subjectOpaqueId uuid; metricCode text; baseline decimal; current decimal; absoluteFloor decimal; relativeFloor decimal; integrity enum; observedAt timestamptz` | Consent-aware dispatcher; `(observationId,aggregateVersion)` |

Shared events exclude exact fan/location data, private watch membership, subject consent reason, unreleased private metrics, raw query/results, curator private-person facts, provider payload, anomaly prose, and accusatory labels. On consent revoke, pending momentum events fail current-consent recheck and are acknowledged suppressed.

## Error Handling

### Global status/error rules

| HTTP | Stable code family | Meaning/retry |
|---|---|---|
| 400 | `INVALID_REQUEST`, `FORBIDDEN_FIELD` | Malformed path/query/header/body, extra key, key mismatch, forbidden accusatory/private field; fix request |
| 401 | `UNAUTHENTICATED` | Invalid human/service authentication |
| 403 | `FORBIDDEN`, `B2_DISABLED`, `STEP_UP_REQUIRED` | Visible target but mandate/gate/step-up denies |
| 404 | Resource-specific not-found | Absent/concealed target; identical details |
| 409 | `VERSION_MISMATCH`, `IDEMPOTENCY_CONFLICT`, source/policy stale | Refresh or exact replay |
| 413/415 | `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` | Transport failure |
| 422 | Domain code | Valid shape but unsupported source/rule/window/purpose/format |
| 429 | `RATE_LIMITED`, `QUERY_BUDGET_EXCEEDED` | Wait; query variation cannot evade family budget |
| 500 | `INTERNAL_ERROR` | Scrubbed owning-boundary error |
| 502/503/504 | `DEPENDENCY_UNAVAILABLE` | Retry only if safe details say retryable |

### Per-operation error matrix

| ID | Domain errors/outcomes | Recovery |
|---|---|---|
| 40.01 | `SOURCE_INTEGRITY_INSUFFICIENT` 422; `TRANSITION_INVALID` 422; `SOURCE_REVISION_STALE` 409 | Correct source/revision; exact key replay |
| 40.02 | `PLACEMENT_NOT_FOUND` 404; `POLICY_VERSION_STALE` 409; unknown/risky is success | Refresh policy; no praise fallback |
| 40.03 | `SOURCE_NOT_REGISTERED` 422; `PERIOD_INVALID` 422; `POSITION_INVALID` 422 | Correct source fact; no source merge |
| 40.04 | `CURATOR_NOT_FOUND` 404; `B2_DISABLED` 403; low-n/no-data is 200 suppressed | No criteria widening |
| 40.05 | `SUBJECT_NOT_FOUND` 404; `OWNER_FORBIDDEN` 403; `PRIVACY_POLICY_STALE` 409 | Refresh authority/policy; sparse cells stay hidden |
| 40.06 | `TOUR_CONTEXT_NOT_FOUND` 404; `TOUR_CONTEXT_INVALID` 422; insufficient history is 200 | Add facts or accept no ranking |
| 40.07 | `SHOW_NOT_FOUND` 404; `SHOW_NOT_FIRST_PARTY` 422; `WINDOW_INVALID` 422; confounded/sparse is 200 | Correct show/windows; accept null/declined |
| 40.08 | `SERIES_INTEGRITY_INSUFFICIENT` 422; `RULE_NOT_TRIGGERED` 422; `RULE_VERSION_STALE` 409 | New source/rule revision; never accuse |
| 40.09 | `CASE_NOT_FOUND` 404; `EXPORT_FORBIDDEN` 403; `STEP_UP_REQUIRED` 403; `FORMAT_UNSUPPORTED` 422 | Reauthorize/reselect format; no auto-report |
| 40.10 | `VENDOR_NOT_FOUND` 404; `B2_DISABLED` 403 shared branch; low-n/no-linkage is 200 insufficient | No public result or floor widening |
| 40.11 | `MANDATE_REQUIRED` 403 for visible scout context; `PURPOSE_INVALID` 422; subject/consent/minor causes are 200 no-result | Correct mandate/purpose only |
| 40.12 | Invalid detector 403; stale source/policy 409; quiet/revoked/below-floor/consent outage are 202 suppressed | No notification/retry inference |
| 40.13 | `MANDATE_REQUIRED` 403; `PURPOSE_INVALID` 422; `QUERY_BUDGET_EXCEEDED` 429; hidden causes are 200 empty | Wait for budget; no cursor |
| 40.14 | `SUBJECT_NOT_FOUND` 404; `SUBJECT_FORBIDDEN` 403 when visible; `PURPOSE_INVALID` 422; `VERSION_MISMATCH` 409 | Refresh purpose/version; retry same key |

## Failure Cascades and Partial-State Recovery

| Failure | Canonical result | Recovery/prohibition |
|---|---|---|
| Placement/chart commit fails | No fact/audit/idempotency/outbox | Exact retry; no partial event |
| Provider/source restates | New additive fact/restatement; prior immutable | Recompute projections; never overwrite reach/period |
| Quality worker fails | Placement remains; no alert or stale positive fallback | Outbox retry/DLQ; UI shows placement with quality unavailable |
| B2 opens then cohort shrinks | Shared cache/result suppresses immediately | Versioned purge event; no last-known low-n serve |
| Geo layer source mismatch | Layers remain separate or cell suppresses | No averaging/city synthesis |
| Booking contradicts reach | Routing weights booking higher and exposes disagreement | No optimized route |
| Release confounds impact | Null/declined analysis with confounder | No causal estimate |
| Claimed/imported anomaly input | Excluded or reduced confidence per policy | No evidence laundering |
| Dossier renderer partially fails | Job fails; no complete manifest/signed link | Bounded retry; regenerate by same job/key |
| Vendor retraction arrives | Link retracts; projection decrements/new version | No historical ratchet; detector unaffected |
| Consent service unavailable | Search/watch/signal returns cause-invariant no-result/suppressed | Fail closed; no subject existence leak |
| Consent revoked while signal queued | Visibility/watch/signal/index update commits atomically; consumer recheck suppresses | No notification; tombstone generic |
| Duplicate source/event/command | Unique/idempotency returns original | No duplicate timeline/signal |
| Queue send fails after commit | Durable outbox authoritative | Dispatcher lease/sweep/DLQ |
| Restore/PITR | BE00 restore epoch fences workers/exports | Reconcile DB/outbox/object/cache/consent before reopen |

## Observability, Rate, and Abuse Controls

| ID | Safe fields | Metrics/SLO | Audit/alert |
|---|---|---|---|
| 40.01 | operation, event/recording/owner IDs, transition, source code/revision; no provider payload | count, p95 <1.2s, conflicts/replays | 100% source audit; source error >2%/10m |
| 40.02 | placement ID, quality state, policy, outcome; no reach/range | p95 <1.2s, suppression, queue age | 100% alert audit; positive-with-risk invariant severity one |
| 40.03 | observation/owner/chart/source/period, not provider payload | p95 <1.2s, duplicates | 100% source audit; registry failures spike |
| 40.04 | curator ID/kind, state, policy; no low-n n/range | p95 <750ms, B2/suppression/cache | 100% privacy-read audit; floor violation severity one |
| 40.05 | subject ID, layer names, policy, cell count band; no exact cell/value | p95 <750ms, coarsen/suppress | sampled owner read, 100% operator privacy audit |
| 40.06 | subject/tour, state, candidate count band, policy; no factors/markets in logs | p95 <1.2s, insufficient count | 100% compute audit; paid-factor invariant |
| 40.07 | owner/show, result state, method; no range/confounders | p95 <1.2s, null/declined | 100% private analysis audit |
| 40.08 | case/series/rule codes, integrity, state; no unusual values | p95 <1.2s, rule rejection/retraction | 100% detector audit; accusatory sentinel severity one |
| 40.09 | case/job, formats, version; no dossier bytes | accept p95 <=500ms, job/object/DLQ | 100% export/step-up audit; object leak severity one |
| 40.10 | owner/vendor, state, policy; no low-n counts/range | p95 <750ms, B2/insufficient/retraction | 100% private vendor audit |
| 40.11 | scout org, purpose, generic outcome; no subject opaque ID on denied path | p95 <1.2s, no-result rate | 100% watch audit; enumeration pattern alert |
| 40.12 | watch/observation IDs, generic state, policy; no metric values/consent reason | p95 <1.2s, suppressed, notify age | 100% signal audit; revoke-notify violation severity one |
| 40.13 | scout org, query digest/class, result band, budget; no raw query/result | p95 <750ms, empty/cap/rate | 100% discovery audit; traversal pattern alert |
| 40.14 | subject, purpose, instruction version; no watch count/scout IDs | p95 <1.2s, invalidation/purge lag | 100% revoke audit; any stale access severity one |

Logs/provider-native diagnostics exclude auth headers, unrestricted IP/user agent, raw query, results, provider payload, exact geography, metric values, anomaly facts, dossier bytes/links, watch membership, subject opaque identifiers on denied branches, consent reason, hidden-result cause, and private curator/person data. Rate keys are HMAC digests; labels are bounded.

## Release, Migration, and Recovery

1. Expand enums/tables/checks/RLS/functions/indexes/event parsers/routes under bounded advisory lock.
2. Deploy with B2/shared operator/vendor/curator results disabled, minors off, scouting discovery/watch/signal disabled, and export worker paused.
3. Run Zod/OpenAPI, SQL/RLS negative, no-data-flow-loop, consent cause-invariance, idempotency/outbox, redaction, performance, and recovery tests.
4. Enable private placement/chart/geo/routing/show/anomaly paths, then export, then each scouting purpose after consent/minors policy verification.
5. B2 requires counsel-approved floor at least 20, anti-differencing/query-family evidence, lawful basis, retention, cache purge, no-export, and no-admin-bypass proof.
6. Rollback disables route/config/worker entries and keeps committed rows/outbox; no destructive down migration.
7. Recovery inherits BE00 seven-day PITR, RPO <=2m, RTO <=4h, restore-epoch fencing, and reopening order. Consent projections, B2 caches, export objects, and pending signals must reconcile before protected effects resume.

## Testing Strategy

Tests start RED from Zod/OpenAPI/SQL contracts, then use Hono `app.request()`, Supabase RPC fixtures, fake Queue/object bindings, deterministic clocks, and Shard 39/06 doubles.

| ID | Contract/handler | Auth/privacy | State/failure/observability |
|---|---|---|---|
| 40.01 | Transition/position/reach/source schemas and response | Producer only, deny browser/CORS | duplicate/restatement/CAS/atomic event |
| 40.02 | Quality/tone invariant and strict response | Worker only | risky/unknown suppress praise; queue retry |
| 40.03 | Source/chart/period/methodology schema | Producer only | conflicting sources side-by-side; duplicate safe |
| 40.04 | Available/suppressed union | B2 before lookup; public-role only | floor shrink/cache purge/no low-n telemetry |
| 40.05 | Separate layer response/coarsening | Owner/operator B2/RLS | no averaging; source outage; sparse suppression |
| 40.06 | Ranked/insufficient contracts | Tour/subject mandate | booking precedence; missing constraints; no paid factor |
| 40.07 | Measured/null/declined contracts | First-party owner only | confounding/sparse; source restatement; private only |
| 40.08 | Hedged facts/limits/rule schemas | Detector/series authorization | claimed exclusion; no verdict; unique/retraction |
| 40.09 | Formats/202/job contract | Owner/step-up/BOLA | partial render, manifest atomicity, no recipient/send |
| 40.10 | Available/insufficient union | Linked owner/B2 branch | retraction decrement; detector dependency absent |
| 40.11 | Watch/no-result union | Scout mandate and in-query consent/minor gate | identical absent/denied/outage bytes; no snapshot |
| 40.12 | Threshold/receipt schemas | Detector and fire-time consent | both floors; revoke race; generic suppression/no notify |
| 40.13 | Default-20/max-25 bounded-page schema; `nextCursor: null`; exact filter allowlist and fixed server sort | Purpose mandate/in-query consent | default/max boundaries, stable tie-break, unknown cursor/offset/page/sort rejection, prefix invariance across limits, query-family budget, enumeration block, no raw audit |
| 40.14 | Purpose/version/decision schema | Subject self/entity authority | atomic index/watch/signal revoke and generic tombstone |

Database tests prove every type/nullability/check/FK or logical producer validation, uniqueness, index-backed plan, RLS positive/negative, grants, pinned `search_path`, no direct DML, retention, and absence of raw fan/query/result/private-person/watch-snapshot fields. Event tests parse all eight exact event types, reject sensitive/extra fields, dedupe at least-once delivery, reject stale versions, exercise retry/DLQ, and verify revoke-time consumer checks. Performance tests enforce route SLOs with representative streams/cells/cases/watches.

## Deepening Passes

| Pass | Evidence | Result |
|---|---|---|
| 1 — Source fidelity | 14 interactions, 4 features, 12 contracts, 16 models, 8 events, all actors/edge cases/dependencies mapped | PASS |
| 2 — Endpoint/contract | One unique operation per interaction; sole registry; strict Zod request/success/global error | PASS |
| 3 — Persistence | Exhaustive typed/nullability/constraint fields, FK/logical producer, indexes, RLS/grants, retention for 16 models | PASS |
| 4 — Security/privacy | CORS/auth/CSRF/BOLA, 403/404, B2/minors, consent-in-query/fire, cause invariance, no enumeration | PASS |
| 5 — Concurrency/idempotency | Strong ETags, CAS, unique source keys, command keys, outbox/jobs, restatement/retraction/revoke races | PASS |
| 6 — Failure/operations | Source, B2, consent, Queue, object export, restore, retry/circuit/DLQ, telemetry/redaction deterministic | PASS |
| 7 — Testability | Per-operation matrices plus SQL/RLS/event/privacy/performance/recovery oracles | PASS |

## Ambiguity Gate

- **Micro ambiguity: PASS.** Reach is event-time; chart period is source-specific; quality unknown suppresses praise; layers never average; routing ranks evidence but not itinerary; show impact has measured/null/declined; anomaly is descriptive; vendor retraction decrements; no-result causes are identical; both momentum floors and fire-time consent are required.
- **Macro ambiguity: PASS.** Shard 39 owns source/provenance/truth; Shard 06 owns adjudication/external evidence; Shard 40 owns descriptive derived records and consent-scoped scouting; Shard 42 only consumes allowed market evidence; Shard 00 retains jobs/objects/queues/audit/idempotency.
- **Two-implementer check: PASS.** Routes, operation IDs, Zod, errors, statuses, SQL fields/constraints/indexes/RLS/grants, middleware, states, timeouts/retries/circuits, events, and tests yield identical implementations.
- **Devil's-advocate check: PASS.** No fallback may merge sources, broaden floors, infer private curators, optimize a route, state causality/fraud/all-clear, feed vendor history into detector, reveal watch/consent causes, paginate discovery, or fire after revoke.
- **Source contradiction check: PASS.** IA edge-case rows mention idempotency generically for reads; safe GET operations 40.04/40.05/40.10/40.13 instead pin source/policy revision and remain side-effect free, preserving BE00 HTTP semantics and all IA outcomes.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Classified Shard 40 as single domain and authored operations 40.01–40.14. |
| 2026-08-28 | Locked source separation, B2 privacy, descriptive anomaly/vendor, consent-in-query scouting, and no-enumeration behavior. |
| 2026-08-28 | Added strict Zod 4, exhaustive persistence/RLS, middleware/CORS, errors, seams, events, recovery, tests, and ambiguity evidence. |
| 2026-08-29 | Made 40.13 list behavior executable: bounded single page, default 20/max 25, fixed normalized-credit/opaque-ID ordering, strict filter allowlist, null continuation, and query-family anti-traversal tests. |
| 2026-08-29 | Declared pagination N/A and exact nested response caps for fixed reads 40.04, 40.05, and 40.10. |

## Dependency References

- [Shard 40 IA](../ia/40-market-intelligence-signals.md)
- [Deep Dive 40](../ia/deep-dives/40-market-intelligence-signals.md)
- [Shard 00 Backend](00-infrastructure.md)
- [Shard 06 IA — Trust and Safety](../ia/06-trust-safety.md)
- [Shard 39 IA — Analytics ingestion and reporting](../ia/39-analytics-ingestion-reporting.md)
- [Shard 42 Backend — Career planning and risk](42-career-planning-risk.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Data Placement Strategy](../data-placement-strategy.md)
- [Engineering Standards](../ENGINEERING-STANDARDS.md)


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/40-market-intelligence-signals|Deep Dive 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]

### References
- [[specs/ia/deep-dives/40-market-intelligence-signals|Deep Dive 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
