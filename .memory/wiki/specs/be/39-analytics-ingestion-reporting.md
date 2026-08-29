# Analytics Ingestion, Matching and Reporting — Backend Specification

## Classification

- IA source: ../ia/39-analytics-ingestion-reporting.md.
- Backend required; single analytics boundary with provider ingestion, immutable observations, matching, integrity-aware projections, sharing and role-scoped performance proof.
- Runtime: Hono/Cloudflare Workers, Zod 4, Supabase PostgreSQL with RLS, Cloudflare Queues and Cron Triggers, encrypted provider-token references owned by BE00.
- Hard boundaries: a connection grants read authority, never identity/catalog ownership; raw observations are immutable; restatements append; missing periods are never interpolated; ambiguity blocks binding; B2 cohort output is server-disabled until an approved privacy policy exists.

## Referenced Material Inventory

| Source | Locked material |
|---|---|
| ../ia/39-analytics-ingestion-reporting.md | 39.01–39.16, canonical models/events, integrity, access, matching, sharing and proof rules |
| 00-infrastructure.md | ApiError, auth/mandates, credential vault, idempotency, queues, receipts, audit, CORS and telemetry |
| ../ENGINEERING-STANDARDS.md | strict Zod-first contracts, denial semantics, tests, migrations and logs |
| ../data-placement-strategy.md | provider-token/PII isolation, retention, RLS and export restrictions |

## IA Source Map and Completeness

| IA ID | Operation | Method | Path |
|---|---|---|---|
| 39.01 | Connect source | POST | /api/v1/analytics/source-connections |
| 39.02 | Sync source | POST | /api/v1/analytics/source-connections/{connectionId}/syncs |
| 39.03 | Disconnect source | POST | /api/v1/analytics/source-connections/{connectionId}/disconnects |
| 39.04 | Import metric file | POST | /api/v1/analytics/metric-imports |
| 39.05 | Inspect metric | GET | /api/v1/analytics/metrics/{metricId} |
| 39.06 | Match external profile | POST | /api/v1/analytics/profile-bindings |
| 39.07 | Match catalog | POST | /api/v1/analytics/catalog-bindings |
| 39.08 | Resolve conflict | POST | /api/v1/analytics/match-cases/{caseId}/resolutions |
| 39.09 | View dashboard | POST | /api/v1/analytics/dashboard-queries |
| 39.10 | Configure alert/digest | PUT | /api/v1/analytics/alert-rules/{ruleId} |
| 39.11 | Render digest | POST | /api/v1/internal/analytics/digest-renders |
| 39.12 | Share/export report | POST | /api/v1/analytics/report-shares |
| 39.13 | View cohort comparison | POST | /api/v1/analytics/cohort-comparisons |
| 39.14 | View contribution catalog | GET | /api/v1/analytics/contribution-catalog |
| 39.15 | Compare role slices | POST | /api/v1/analytics/contribution-performance-queries |
| 39.16 | Publish performance proof | POST | /api/v1/analytics/performance-proofs |

All 16 interactions are authoritative here. Provider webhooks, token encryption, generic job/outbox records and shared audit remain in Shard 00.

## Shared Contract Inheritance

- Failure envelope: the exact BE00/global `ApiError { code, message, requestId, details }` envelope. `code` is the registered application-code enum, `message` is the safe stable message, `requestId` is the request UUID, and `details` is either `null` or a strict bounded JSON allowlist for the declared error code. Details never contain credentials, raw provider responses, confidential catalog data, hidden candidates, or another subject's metrics.
- Browser writes require credentialled allowlisted CORS, CSRF and session auth. Internal jobs use service JWT plus mTLS and deny CORS.
- Mutations require Idempotency-Key for 24-hour digest-bound replay. Revisioned changes additionally require If-Match; stale revision returns 412 REVISION_MISMATCH.
- Query collections use opaque cursor and limit 1–100. Every series and export carries source, observed/claimed class, coverage, freshness, gaps, integrity policy and derivation version.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 39](../ia/39-analytics-ingestion-reporting.md) | Interactions lines 73–93; Contracts lines 94–111; Data Models lines 112–162; Access Control lines 163–188; Event Schemas and Edge Cases lines 202–241 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 22.01 Source Connections & Ingestion | 39.01–39.05 |
| 22.02 External Identity & Catalog Matching | 39.06–39.08 |
| 22.05 Cross-Source Dashboard & Reporting | 39.09–39.13 |
| 22.08 Credit-Linked Performance | 39.14–39.16 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Success | Auth and ownership | Concurrency/idempotency | Rate, cache, deadline, SLO | Middleware and CORS |
|---|---|---|---|---|---|---|---|
| 39.01 | POST | /api/v1/analytics/source-connections | 201/200 SourceConnectionV1 | external entity owner; delegated reader may join existing connection only | key; provider/external entity canonical unique; credential CAS | 10/hour actor/provider; no-store; 3s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, OAuth receipt/capability |
| 39.02 | POST | /api/v1/analytics/source-connections/{connectionId}/syncs | 202 SyncRunV1 | owner/delegated reader with sync capability | key; one active connection/window; advisory lock | 10/hour connection; no-store; 500ms; async provider cadence | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, source policy, health budget |
| 39.03 | POST | /api/v1/analytics/source-connections/{connectionId}/disconnects | 202 SourceConnectionV1 | owner; purge requires owner step-up, reader may only remove self | key plus If-Match; disconnect/sync CAS | 5/day connection; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, step-up for purge, CSRF, terms policy |
| 39.04 | POST | /api/v1/analytics/metric-imports | 202 MetricImportV1 | subject/entity operator with analytics.import | key; checksum/adapter/preview revision unique | 5/hour owner; no-store; 500ms; async 15m | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, upload receipt, adapter validator |
| 39.05 | GET | /api/v1/analytics/metrics/{metricId} | 200 AnalyticsMetricV1 | own/context-authorized series | safe read; series integrity revision ETag | 120/min actor; private max-age=30; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, path/query parse, RLS/context policy |
| 39.06 | POST | /api/v1/analytics/profile-bindings | 201/202 ProfileBindingV1 | subject claimant or scoped match steward | key; provider external ID has one confirmed subject; CAS | 30/hour claimant; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, evidence schema, conflict policy |
| 39.07 | POST | /api/v1/analytics/catalog-bindings | 201 CatalogBindingV1 | credited contributor for own relation or steward cleanup | key; contributor/external/internal revision unique | 60/hour actor; no-store; 2s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, credit authority, evidence policy |
| 39.08 | POST | /api/v1/analytics/match-cases/{caseId}/resolutions | 200 MatchCaseV1 | match steward for cleanup; trust route for authority dispute | key plus If-Match; case transition CAS and dual control where required | 30/hour steward; no-store; 2s; protected-command | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, purpose grant |
| 39.09 | POST | /api/v1/analytics/dashboard-queries | 200 DashboardViewV1 | person/entity context-set authorization | safe query; projection and policy versions pin response | 60/min actor; private max-age=30; 3s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, context union/RLS |
| 39.10 | PUT | /api/v1/analytics/alert-rules/{ruleId} | 200 AlertRuleV1 | recipient owns rule and every referenced series | key plus If-Match; noise-budget CAS | 30/hour actor; no-store; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, metric/permission/noise policy |
| 39.11 | POST | /api/v1/internal/analytics/digest-renders | 201/200 DigestRunV1 | registered scheduler/alert worker | schedule key; permission snapshot and render digest unique | 600/min worker; no-store; 10s; protected-command | BE00-CORS-DENY, service auth, producer allowlist, permission recheck |
| 39.12 | POST | /api/v1/analytics/report-shares | 201 ReportShareV1 | report owner/context mandate; provider terms must allow fields | key; immutable snapshot checksum; share policy CAS | 20/hour owner; no-store; 5s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, step-up for export, CSRF, terms/redaction |
| 39.13 | POST | /api/v1/analytics/cohort-comparisons | 200 CohortResultV1 or 403 | B2 policy principal and qualifying subject only | safe query; policy/cohort/query versions pin result | 10/hour subject; no-store; 3s; privacy SLO | BE00-CORS-WEB-CREDENTIALLED, auth, strict query, B2 physical gate/anti-differencing |
| 39.14 | GET | /api/v1/analytics/contribution-catalog | 200 ContributionCatalogV1 | contributor sees own role relations | safe read; binding revision ETag | 120/min actor; private max-age=30; 2s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, query parse, contributor RLS |
| 39.15 | POST | /api/v1/analytics/contribution-performance-queries | 200 ContributionPerformanceV1 | contributor or scoped entity context | safe query; binding/integrity/derivation versions pin | 30/min actor; private max-age=30; 5s; Tier 1 | BE00-CORS-WEB-CREDENTIALLED, auth, strict roles, integrity and confidential-field filter |
| 39.16 | POST | /api/v1/analytics/performance-proofs | 201 PerformanceProofV1 | contributor owns role and counter-attested credits | key plus role-slice checksum; proof active-version CAS | 20/day contributor; no-store; 5s; Tier 2 | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, credit/integrity/terms policy |

## Request and Response Contracts — Zod 4

Unknown fields fail. UUIDs are lowercase canonical, time is RFC 3339 UTC, date periods are closed-open, integer counters are safe nonnegative integers, decimal rates are strings matching canonical fixed precision, and provider/metric identifiers are registered enums.

| ID | Request schema | Success schema |
|---|---|---|
| 39.01 | SourceConnectRequest { provider, externalEntityId, oauthReceiptId, scopes unique, capabilityVersion, termsVersion, delegatedReaderIds max 50 } | SourceConnectionV1 { connectionId, state active/action_required, provider, externalEntityId, readers, capabilityVersion, revision } |
| 39.02 | SyncCreateRequest { sourceWindow, mode incremental/full_allowed, force false by default } | SyncRunV1 { runId, state queued/running, window, cursorVersion, counts nullable } |
| 39.03 | DisconnectRequest { disposition retain/purge_if_terms_allow, revokeProviderGrant boolean, reasonCode } | SourceConnectionV1 { state disconnecting/disconnected/purge_queued, revision } |
| 39.04 | MetricImportCreate { uploadReceiptId, fileChecksum, adapterId, adapterVersion, previewRevision, commit boolean, claimedProvenance } | MetricImportV1 { batchId, state preview_ready/queued, accepted, overlaps, quarantined } |
| 39.05 | MetricInspectQuery { periodStart, periodEnd, sourceIds max 50, cursor nullable, limit default 100 and range 1–100 } | AnalyticsMetricV1 { definition, observations, restatements, integrity, nextCursor } |
| 39.06 | ProfileBindingCreate { provider, externalProfileId, subjectId, evidence typed array 1–20, proposedState candidate/confirmed } | ProfileBindingV1 { bindingId, state candidate/confirmed/contested/quarantined, revision, caseId nullable } |
| 39.07 | CatalogBindingCreate { externalRecordingId, internalRecordingId, contributorPartyId, roleCodes unique, evidence typed array } | CatalogBindingV1 { bindingId, state, corroboration, revision } |
| 39.08 | MatchResolution { action confirm/reject/quarantine/route_authority_dispute, candidateId nullable, evidenceIds, rationaleCode } | MatchCaseV1 { caseId, class, state, resolution, revision } |
| 39.09 | DashboardQuery { contexts unique typed set max 20, metricIds max 100, period, grain enum, filters strict, cursor nullable, limit default 50 and range 1–100 } | DashboardViewV1 { contexts, series, integritySummary, nextCursor, queryChecksum } |
| 39.10 | AlertRulePut { metricId, comparator enum, threshold decimal, cadence realtime/daily/weekly, digestMode, active } | AlertRuleV1 { ruleId, revision, noiseCost, nextEvaluationAt } |
| 39.11 | DigestRenderCommand { recipientId, scheduleBucket, ruleRevisionIds, requestedAt } | DigestRunV1 { digestId, permissionSnapshotId, state rendered/suppressed, artifactRef nullable } |
| 39.12 | ReportShareCreate { queryChecksum, format live_snapshot/csv/pdf, fieldSelection, expiresAt max 30 days, recipientPolicy, redistributionAck } | ReportShareV1 { reportId, shareId, snapshotChecksum, expiresAt, downloadToken nullable } |
| 39.13 | CohortComparisonQuery { cohortDefinitionId, metricIds max 20, period, grain, queryFamilyNonce } | CohortResultV1 { cohortVersion, memberBucket, anonymousSeries, integrity, privacyPolicyVersion } |
| 39.14 | ContributionCatalogQuery { roleCodes nullable, state confirmed/contested/all, cursor nullable, limit default 50 and range 1–100 } | ContributionCatalogV1 { bindings, unknownCount, nextCursor, revision } |
| 39.15 | ContributionPerformanceQuery { roleCodes 1–20, recordingIds nullable max 500, period, metricIds max 20 } | ContributionPerformanceV1 { roleSlices, coverage, totals, unknownCount, derivationVersion } |
| 39.16 | PerformanceProofCreate { roleCode, period, allowedSourceIds, visibility unlisted/public, expiresAt nullable } | PerformanceProofV1 { proofId, role, total, coverage, validity active/degraded, derivationVersion, publicToken } |

### Cross-field invariants

- 39.01 externalEntityId plus provider identifies one canonical connection. A second valid grant becomes a delegated reader/credential; it never creates duplicate ingestion or proves profile ownership.
- 39.03 purge is allowed only when provider terms permit and an owner approves. Disconnect during sync stops future pages; already committed observations keep source provenance.
- 39.04 commit must quote the exact checksum, adapter version and preview revision. Claimed import rows never replace observed provider facts or counter-attested coverage.
- 39.06 confirmed uniqueness is provider/externalProfileId. Conflicting subjects freeze the binding; timeout never chooses a winner.
- 39.07 is contributor-specific and many-to-many. One contributor cannot delete another contributor's relation.
- 39.09 context sets are a union of independently authorized person/entity contexts; data is never duplicated or broadened by role overlap.
- 39.13 returns FEATURE_POLICY_DISABLED unless B2 activation, privacy-floor version, minimum cohort size, query-family budget and anti-differencing cache are all active.
- 39.16 accepts only counter-attested role relations and observed series above the proof integrity floor; output is role-scoped and omits confidential catalog rows.

### Exact typed success schemas

Each operation comment binds an authoritative route to one strict Zod 4 success contract. Raw provider credentials, unpermitted series, and suppressed cohort counts are absent by schema.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Cursor = z.string().min(1).max(512).nullable();
const Decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d{1,12})?$/);
const Period = z.object({ startsAt: Instant, endsAt: Instant }).strict();
const Integrity = z.object({ state: z.enum(["verified", "partial", "contested", "unknown"]), sourceCoverage: z.number().min(0).max(1), revision: Version }).strict();
const SeriesPoint = z.object({ periodStart: Instant, periodEnd: Instant, value: Decimal.nullable(), suppression: z.enum(["none", "policy", "insufficient_data"])}).strict();
// 39.01
export const SourceConnectionV1 = z.object({
  connectionId: Uuid, state: z.enum(["active", "action_required"]), provider: z.string().regex(/^[a-z0-9_]{1,64}$/),
  externalEntityId: z.string().min(1).max(256), readers: z.array(Uuid).max(50), capabilityVersion: Version, revision: Version,
}).strict();
// 39.02
export const SyncRunV1 = z.object({ runId: Uuid, state: z.enum(["queued", "running"]), window: Period, cursorVersion: Version, counts: z.object({ read: z.int().nonnegative(), accepted: z.int().nonnegative(), quarantined: z.int().nonnegative() }).strict().nullable() }).strict();
// 39.03
export const DisconnectSourceConnectionSuccess = z.object({ connectionId: Uuid, state: z.enum(["disconnecting", "disconnected", "purge_queued"]), revision: Version }).strict();
// 39.04
export const MetricImportV1 = z.object({ batchId: Uuid, state: z.enum(["preview_ready", "queued"]), accepted: z.int().nonnegative(), overlaps: z.int().nonnegative(), quarantined: z.int().nonnegative() }).strict();
const MetricDefinition = z.object({ metricId: Uuid, code: z.string().regex(/^[a-z0-9_.-]{1,128}$/), unit: z.string().min(1).max(64), aggregation: z.enum(["sum", "count", "average", "latest"])}).strict();
// 39.05
export const AnalyticsMetricV1 = z.object({
  definition: MetricDefinition, observations: z.array(SeriesPoint).max(5000),
  restatements: z.array(z.object({ observationId: Uuid, supersededById: Uuid, reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/), recordedAt: Instant }).strict()).max(5000),
  integrity: Integrity, nextCursor: Cursor,
}).strict();
// 39.06
export const ProfileBindingV1 = z.object({ bindingId: Uuid, state: z.enum(["candidate", "confirmed", "contested", "quarantined"]), revision: Version, caseId: Uuid.nullable() }).strict();
// 39.07
export const CatalogBindingV1 = z.object({ bindingId: Uuid, state: z.enum(["candidate", "confirmed", "contested", "quarantined"]), corroboration: z.array(z.object({ evidenceId: Uuid, sourceKind: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(100), revision: Version }).strict();
// 39.08
export const MatchCaseV1 = z.object({ caseId: Uuid, class: z.enum(["cleanup", "contested", "governance"]), state: z.enum(["open", "confirmed", "rejected", "quarantined", "routed_authority_dispute"]), resolution: z.object({ action: z.string().regex(/^[a-z0-9_]{1,64}$/), candidateId: Uuid.nullable(), rationaleCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict().nullable(), revision: Version }).strict();
const DashboardSeries = z.object({ metricId: Uuid, contextId: Uuid, points: z.array(SeriesPoint).max(5000) }).strict();
// 39.09
export const DashboardViewV1 = z.object({
  contexts: z.array(z.object({ kind: z.enum(["person", "entity", "release", "event"]), id: Uuid }).strict()).max(20),
  series: z.array(DashboardSeries).max(2000), integritySummary: z.array(Integrity).max(2000), nextCursor: Cursor, queryChecksum: Digest,
}).strict();
// 39.10
export const AlertRuleV1 = z.object({ ruleId: Uuid, revision: Version, noiseCost: z.int().nonnegative().max(10_000), nextEvaluationAt: Instant.nullable() }).strict();
// 39.11
export const DigestRunV1 = z.object({ digestId: Uuid, permissionSnapshotId: Uuid, state: z.enum(["rendered", "suppressed"]), artifactRef: Uuid.nullable() }).strict();
// 39.12
export const ReportShareV1 = z.object({ reportId: Uuid, shareId: Uuid, snapshotChecksum: Digest, expiresAt: Instant, downloadToken: z.string().min(32).max(2048).nullable() }).strict();
// 39.13
export const CohortResultV1 = z.object({
  cohortVersion: Version, memberBucket: z.enum(["suppressed", "small", "medium", "large"]),
  anonymousSeries: z.array(z.object({ metricId: Uuid, points: z.array(SeriesPoint).max(5000) }).strict()).max(20),
  integrity: Integrity, privacyPolicyVersion: Version,
}).strict();
const ContributionBinding = z.object({ bindingId: Uuid, recordingId: Uuid, contributorPartyId: Uuid, roleCodes: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).min(1).max(100), state: z.enum(["confirmed", "contested"]), revision: Version }).strict();
// 39.14
export const ContributionCatalogV1 = z.object({ bindings: z.array(ContributionBinding).max(100), unknownCount: z.int().nonnegative(), nextCursor: Cursor, revision: Version }).strict();
// 39.15
export const ContributionPerformanceV1 = z.object({
  roleSlices: z.array(z.object({ roleCode: z.string().regex(/^[a-z0-9_]{1,64}$/), recordingIds: z.array(Uuid).max(500), series: z.array(DashboardSeries).max(20) }).strict()).max(20),
  coverage: z.number().min(0).max(1), totals: z.array(z.object({ metricId: Uuid, value: Decimal.nullable(), suppression: z.enum(["none", "policy", "insufficient_data"])}).strict()).max(20),
  unknownCount: z.int().nonnegative(), derivationVersion: Version,
}).strict();
// 39.16
export const PerformanceProofV1 = z.object({
  proofId: Uuid, role: z.string().regex(/^[a-z0-9_]{1,64}$/),
  total: z.array(z.object({ metricId: Uuid, value: Decimal }).strict()).max(20), coverage: z.number().min(0).max(1),
  validity: z.enum(["active", "degraded"]), derivationVersion: Version, publicToken: z.string().min(32).max(2048),
}).strict();
~~~

## Pagination and Limits

| Operation | Cursor, default/max page | Stable sort | Filter options |
|---|---|---|---|
| 39.05 | Opaque HMAC cursor binds actor/context, integrity revision, filter hash, and last `(periodStart,observationId)`; default 100, maximum 100 | `periodStart ASC, observationId ASC` | mandatory period; optional `sourceIds` maximum 50 |
| 39.09 | Opaque HMAC cursor binds actor, query checksum, projection/policy versions, and last `(contextId,metricId,periodStart)`; default 50, maximum 100 | `contextId ASC, metricId ASC, periodStart ASC` | typed contexts maximum 20, metric IDs maximum 100, period, grain, and the declared strict dimension filters |
| 39.14 | Opaque HMAC cursor binds contributor, binding revision, filter hash, and last `(recordingId,bindingId)`; default 50, maximum 100 | `recordingId ASC, bindingId ASC` | optional role codes and `state=confirmed|contested|all`; RLS always limits to the contributor |

Malformed, expired, actor/policy-mismatched, or filter-mismatched cursors return `400 VALIDATION_FAILED`; revision drift requires a first-page restart and never mixes snapshots.

## Database Schema

All IDs are uuid, revisions are positive bigint, timestamps are timestamptz UTC, jsonb columns are validated against versioned Zod/JSON schemas before persistence, and provider credentials are opaque BE00 vault references.

| Model | Typed fields and constraints | Keys/indexes | RLS/grants |
|---|---|---|---|
| source_connection | id; provider; external_entity_id; owner_entity_id; credential_ref; scopes text array; capability_version; terms_version; state; revision; disconnected_at nullable | unique provider,external_entity_id; FK owner entity; index owner,state | owner and scoped reader projection; connector service only sees its provider credential ref |
| delegated_reader | connection_id; party_id; scope enum; granted_by; expires_at nullable; revision | PK connection,party; FK connection/party; index party | reader sees permitted series; owner grants/revokes; no ownership mutation |
| sync_run | id; connection_id; source_window tstzrange; state queued/running/succeeded/partial/action_required/failed; provider_receipt nullable; counts jsonb; started_at/ended_at nullable | unique connection,source_window,request_digest; index state,created_at | connector and authorized readers see safe status |
| sync_cursor | connection_id; stream_key; cursor_ref encrypted; provider_revision; last_observed_at; version | PK connection,stream_key; FK connection; index last_observed_at | connector service only; browser gets freshness projection |
| metric_definition | id; provider nullable; key; unit enum; semantic_version; aggregation enum; claimed_allowed boolean; definition_json | unique provider,key,semantic_version | registered adapters read; settings dual control writes |
| metric_observation | id; source_connection_id nullable; import_row_id nullable; external_subject_id; metric_definition_id; period daterange; value_numeric numeric nullable; value_json jsonb nullable; provenance observed/claimed; provider_key; observed_at | exactly one value; unique source observation key; BRIN period; FK definition/source/import | immutable; subject/context projection only |
| metric_restatement | id; prior_observation_id; replacement_observation_id; provider_reason; recorded_at | unique prior,replacement; FK both observations; index recorded_at | append-only connector; inherited subject authorization |
| series_integrity | id; series_key; window daterange; policy_version; coverage numeric 0..1; freshness_state; dominant_loss nullable; membership_checksum; computed_at | unique series,window,policy_version; index series,computed_at | projection service write; authorized context read |
| source_gap | id; series_integrity_id; source_id; gap_range daterange; reason enum; actionable boolean | unique integrity,source,gap_range; GIST gap_range | follows integrity; no raw provider error |
| import_batch | id; owner_party_id; upload_receipt_id; file_checksum; adapter_id/version; preview_revision; provenance; state; counts | unique owner,file_checksum,adapter_version; index state | owner/operator metadata; importer service rows |
| import_row | id; batch_id; row_number; row_checksum; metric_definition_id nullable; overlap_observation_id nullable; state accepted/overlap/quarantined; error_code nullable | unique batch,row_number; FK batch/definition/observation | owner safe preview; raw values importer service only |
| external_profile_binding | id; provider; external_profile_id; subject_id; evidence_json; state candidate/confirmed/contested/quarantined/revoked; revision | unique confirmed provider,external_profile_id partial; index subject,state | subject own; match steward purpose grant; others denied |
| catalog_binding | id; external_recording_id; internal_recording_id; contributor_party_id; role_codes; evidence_json; state; revision | unique external,internal,contributor,revision; index contributor,state | contributor own; steward scoped; another contributor cannot mutate |
| match_case | id; class cleanup/contested/governance; subject_scope; candidates_json; evidence_refs; state; remedy; resolution nullable; revision | index class,state,created_at; candidate digest unique | claimant/steward/trust route by class; support read requires purpose grant |
| dashboard_view | id; owner_party_id; context_set_json; query_json; query_checksum; policy_version; saved boolean; revision | unique owner,query_checksum where saved; GIN context/query | owner only; query service security invoker |
| series_projection | id; query_checksum; series_key; result_json; integrity_id; source_membership; expires_at | unique query,series; TTL index; FK integrity | disposable cache under calling subject scope |
| alert_rule | id; owner_party_id; metric_definition_id; comparator; threshold; cadence; digest_mode; noise_cost; active; revision | unique owner,id; index owner,active | owner CRUD; evaluator read |
| digest_run | id; owner_party_id; schedule_bucket; rule_revision_ids; permission_snapshot; render_checksum; state rendered/suppressed/failed; artifact_ref nullable | unique owner,schedule_bucket,render_checksum; index state | owner sees artifact/status; renderer service writes |
| report_snapshot | id; owner_party_id; query_checksum; result_ref; provenance_json; gaps_json; policy_version; terms_versions; checksum; expires_at | unique owner,checksum; index expires_at | owner and authorized share projection; immutable |
| report_share | id; snapshot_id; token_digest; field_policy; recipient_policy; state active/revoked/expired; expires_at; opened_at nullable; version | unique token_digest; FK snapshot; index state,expires_at | owner manages; token route sees narrowed snapshot only |
| cohort_definition | id; owner_party_id; criteria_json; version; privacy_policy_version; activation_state disabled/active | unique owner,id,version | B2 principal only; no general authenticated grant |
| cohort_result | id; definition_id; query_checksum; query_family_hash; member_bucket; anonymous_result; integrity_json; expires_at | unique definition,query_checksum,privacy_policy_version; TTL/query-family index | B2 service and qualifying subject; no member IDs |
| contribution_performance | id; contributor_party_id; role_codes; recording_set_checksum; period; totals_json; unknown_count; coverage; derivation_version; source_set | unique contributor,role set,recording set,period,derivation; index contributor,period | contributor own; entity mandate only when contributor attested |
| performance_proof | id; contributor_party_id; role_code; period; total_json; coverage; allowed_source_set; derivation_version; state active/degraded/revoked; public_token_digest; version | one active contributor,role,period partial; index state | contributor manages; public token gets exact safe projection |

### Literal SQL type and nullability closure

Every persisted domain field above has the following migration-level type and constraint. Fields not marked NULL are NOT NULL; object and array JSONB values have CHECK (jsonb_typeof(...)) guards for their declared shape.

| Model | Literal SQL fields, nullability, and checks |
|---|---|
| source_connection | id uuid PRIMARY KEY; provider text NOT NULL CHECK (provider &lt;&gt; ''); external_entity_id text NOT NULL CHECK (external_entity_id &lt;&gt; ''); owner_entity_id uuid NOT NULL; credential_ref text NOT NULL CHECK (credential_ref &lt;&gt; ''); scopes text[] NOT NULL DEFAULT ARRAY[]::text[]; capability_version text NOT NULL CHECK (capability_version &lt;&gt; ''); terms_version text NOT NULL CHECK (terms_version &lt;&gt; ''); state text NOT NULL CHECK (state IN ('pending','active','action_required','disabled','disconnecting','disconnected','purge_queued','purged')); revision bigint NOT NULL CHECK (revision &gt; 0); disconnected_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |
| delegated_reader | connection_id uuid NOT NULL; party_id uuid NOT NULL; scope text NOT NULL CHECK (scope IN ('summary','series','export')); granted_by uuid NOT NULL; expires_at timestamptz NULL; revision bigint NOT NULL CHECK (revision &gt; 0); created_at timestamptz NOT NULL DEFAULT now(); PRIMARY KEY (connection_id,party_id) |
| sync_run | id uuid PRIMARY KEY; connection_id uuid NOT NULL; source_window tstzrange NOT NULL CHECK (NOT isempty(source_window)); state text NOT NULL CHECK (state IN ('queued','running','succeeded','partial','action_required','failed')); provider_receipt text NULL; counts jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(counts)='object'); request_digest text NOT NULL CHECK (request_digest &lt;&gt; ''); started_at timestamptz NULL; ended_at timestamptz NULL CHECK (ended_at IS NULL OR started_at IS NOT NULL AND ended_at &gt;= started_at); created_at timestamptz NOT NULL DEFAULT now() |
| sync_cursor | connection_id uuid NOT NULL; stream_key text NOT NULL CHECK (stream_key &lt;&gt; ''); cursor_ref bytea NOT NULL; provider_revision text NOT NULL CHECK (provider_revision &lt;&gt; ''); last_observed_at timestamptz NOT NULL; version bigint NOT NULL CHECK (version &gt; 0); updated_at timestamptz NOT NULL DEFAULT now(); PRIMARY KEY (connection_id,stream_key) |
| metric_definition | id uuid PRIMARY KEY; provider text NULL; key text NOT NULL CHECK (key &lt;&gt; ''); unit text NOT NULL CHECK (unit IN ('count','currency','ratio','duration_seconds','bytes')); semantic_version text NOT NULL CHECK (semantic_version ~ '^[0-9]+\\.[0-9]+\\.[0-9]+$'); aggregation text NOT NULL CHECK (aggregation IN ('sum','latest','average','minimum','maximum')); claimed_allowed boolean NOT NULL DEFAULT false; definition_json jsonb NOT NULL CHECK (jsonb_typeof(definition_json)='object'); created_at timestamptz NOT NULL DEFAULT now() |
| metric_observation | id uuid PRIMARY KEY; source_connection_id uuid NULL; import_row_id uuid NULL; external_subject_id text NOT NULL CHECK (external_subject_id &lt;&gt; ''); metric_definition_id uuid NOT NULL; period daterange NOT NULL CHECK (NOT isempty(period)); value_numeric numeric NULL; value_json jsonb NULL; provenance text NOT NULL CHECK (provenance IN ('observed','claimed')); provider_key text NOT NULL CHECK (provider_key &lt;&gt; ''); observed_at timestamptz NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); CHECK ((value_numeric IS NULL) &lt;&gt; (value_json IS NULL)); CHECK (value_json IS NULL OR jsonb_typeof(value_json) IN ('object','array','number','string','boolean')) |
| metric_restatement | id uuid PRIMARY KEY; prior_observation_id uuid NOT NULL; replacement_observation_id uuid NOT NULL CHECK (replacement_observation_id &lt;&gt; prior_observation_id); provider_reason text NOT NULL CHECK (provider_reason &lt;&gt; ''); recorded_at timestamptz NOT NULL DEFAULT now() |
| series_integrity | id uuid PRIMARY KEY; series_key text NOT NULL CHECK (series_key &lt;&gt; ''); window daterange NOT NULL CHECK (NOT isempty(window)); policy_version text NOT NULL CHECK (policy_version &lt;&gt; ''); coverage numeric(5,4) NOT NULL CHECK (coverage BETWEEN 0 AND 1); freshness_state text NOT NULL CHECK (freshness_state IN ('fresh','stale','unknown')); dominant_loss text NULL; membership_checksum text NOT NULL CHECK (membership_checksum &lt;&gt; ''); computed_at timestamptz NOT NULL |
| source_gap | id uuid PRIMARY KEY; series_integrity_id uuid NOT NULL; source_id text NOT NULL CHECK (source_id &lt;&gt; ''); gap_range daterange NOT NULL CHECK (NOT isempty(gap_range)); reason text NOT NULL CHECK (reason IN ('permission','retention','provider_outage','not_reported','mapping_unknown')); actionable boolean NOT NULL; created_at timestamptz NOT NULL DEFAULT now() |
| import_batch | id uuid PRIMARY KEY; owner_party_id uuid NOT NULL; upload_receipt_id uuid NOT NULL; file_checksum text NOT NULL CHECK (file_checksum &lt;&gt; ''); adapter_id text NOT NULL CHECK (adapter_id &lt;&gt; ''); adapter_version text NOT NULL CHECK (adapter_version &lt;&gt; ''); preview_revision bigint NOT NULL CHECK (preview_revision &gt; 0); provenance jsonb NOT NULL CHECK (jsonb_typeof(provenance)='object'); state text NOT NULL CHECK (state IN ('uploaded','previewed','committed','rejected','purged')); counts jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(counts)='object'); created_at timestamptz NOT NULL DEFAULT now() |
| import_row | id uuid PRIMARY KEY; batch_id uuid NOT NULL; row_number integer NOT NULL CHECK (row_number &gt; 0); row_checksum text NOT NULL CHECK (row_checksum &lt;&gt; ''); metric_definition_id uuid NULL; overlap_observation_id uuid NULL; state text NOT NULL CHECK (state IN ('accepted','overlap','quarantined')); error_code text NULL; raw_value_ref text NULL; created_at timestamptz NOT NULL DEFAULT now() |
| external_profile_binding | id uuid PRIMARY KEY; provider text NOT NULL CHECK (provider &lt;&gt; ''); external_profile_id text NOT NULL CHECK (external_profile_id &lt;&gt; ''); subject_id uuid NOT NULL; evidence_json jsonb NOT NULL CHECK (jsonb_typeof(evidence_json)='object'); state text NOT NULL CHECK (state IN ('candidate','confirmed','contested','quarantined','revoked')); revision bigint NOT NULL CHECK (revision &gt; 0); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |
| catalog_binding | id uuid PRIMARY KEY; external_recording_id text NOT NULL CHECK (external_recording_id &lt;&gt; ''); internal_recording_id uuid NOT NULL; contributor_party_id uuid NOT NULL; role_codes text[] NOT NULL CHECK (cardinality(role_codes) &gt; 0); evidence_json jsonb NOT NULL CHECK (jsonb_typeof(evidence_json)='object'); state text NOT NULL CHECK (state IN ('candidate','confirmed','contested','revoked')); revision bigint NOT NULL CHECK (revision &gt; 0); created_at timestamptz NOT NULL DEFAULT now() |
| match_case | id uuid PRIMARY KEY; class text NOT NULL CHECK (class IN ('cleanup','contested','governance')); subject_scope jsonb NOT NULL CHECK (jsonb_typeof(subject_scope)='object'); candidates_json jsonb NOT NULL CHECK (jsonb_typeof(candidates_json)='array'); evidence_refs text[] NOT NULL DEFAULT ARRAY[]::text[]; state text NOT NULL CHECK (state IN ('open','triaged','awaiting_evidence','resolved','closed')); remedy text NOT NULL CHECK (remedy IN ('bind','reject','merge','quarantine','no_change')); resolution jsonb NULL CHECK (resolution IS NULL OR jsonb_typeof(resolution)='object'); revision bigint NOT NULL CHECK (revision &gt; 0); candidate_digest text NOT NULL CHECK (candidate_digest &lt;&gt; ''); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |
| dashboard_view | id uuid PRIMARY KEY; owner_party_id uuid NOT NULL; context_set_json jsonb NOT NULL CHECK (jsonb_typeof(context_set_json)='array'); query_json jsonb NOT NULL CHECK (jsonb_typeof(query_json)='object'); query_checksum text NOT NULL CHECK (query_checksum &lt;&gt; ''); policy_version text NOT NULL CHECK (policy_version &lt;&gt; ''); saved boolean NOT NULL DEFAULT false; revision bigint NOT NULL CHECK (revision &gt; 0); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |
| series_projection | id uuid PRIMARY KEY; query_checksum text NOT NULL CHECK (query_checksum &lt;&gt; ''); series_key text NOT NULL CHECK (series_key &lt;&gt; ''); result_json jsonb NOT NULL CHECK (jsonb_typeof(result_json)='object'); integrity_id uuid NOT NULL; source_membership text[] NOT NULL DEFAULT ARRAY[]::text[]; expires_at timestamptz NOT NULL; created_at timestamptz NOT NULL DEFAULT now() |
| alert_rule | id uuid PRIMARY KEY; owner_party_id uuid NOT NULL; metric_definition_id uuid NOT NULL; comparator text NOT NULL CHECK (comparator IN ('gt','gte','lt','lte','delta_gt','delta_lt')); threshold numeric NOT NULL; cadence text NOT NULL CHECK (cadence IN ('daily','weekly','monthly')); digest_mode text NOT NULL CHECK (digest_mode IN ('immediate','digest_only')); noise_cost integer NOT NULL CHECK (noise_cost BETWEEN 0 AND 100); active boolean NOT NULL DEFAULT true; revision bigint NOT NULL CHECK (revision &gt; 0); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |
| digest_run | id uuid PRIMARY KEY; owner_party_id uuid NOT NULL; schedule_bucket timestamptz NOT NULL; rule_revision_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[]; permission_snapshot jsonb NOT NULL CHECK (jsonb_typeof(permission_snapshot)='object'); render_checksum text NOT NULL CHECK (render_checksum &lt;&gt; ''); state text NOT NULL CHECK (state IN ('rendered','suppressed','failed')); artifact_ref text NULL; created_at timestamptz NOT NULL DEFAULT now() |
| report_snapshot | id uuid PRIMARY KEY; owner_party_id uuid NOT NULL; query_checksum text NOT NULL CHECK (query_checksum &lt;&gt; ''); result_ref text NOT NULL CHECK (result_ref &lt;&gt; ''); provenance_json jsonb NOT NULL CHECK (jsonb_typeof(provenance_json)='object'); gaps_json jsonb NOT NULL CHECK (jsonb_typeof(gaps_json)='array'); policy_version text NOT NULL CHECK (policy_version &lt;&gt; ''); terms_versions jsonb NOT NULL CHECK (jsonb_typeof(terms_versions)='object'); checksum text NOT NULL CHECK (checksum &lt;&gt; ''); expires_at timestamptz NOT NULL; created_at timestamptz NOT NULL DEFAULT now() |
| report_share | id uuid PRIMARY KEY; snapshot_id uuid NOT NULL; token_digest text NOT NULL CHECK (token_digest &lt;&gt; ''); field_policy jsonb NOT NULL CHECK (jsonb_typeof(field_policy)='object'); recipient_policy jsonb NOT NULL CHECK (jsonb_typeof(recipient_policy)='object'); state text NOT NULL CHECK (state IN ('active','revoked','expired')); expires_at timestamptz NOT NULL; opened_at timestamptz NULL; version bigint NOT NULL CHECK (version &gt; 0); created_at timestamptz NOT NULL DEFAULT now() |
| cohort_definition | id uuid PRIMARY KEY; owner_party_id uuid NOT NULL; criteria_json jsonb NOT NULL CHECK (jsonb_typeof(criteria_json)='object'); version bigint NOT NULL CHECK (version &gt; 0); privacy_policy_version text NOT NULL CHECK (privacy_policy_version &lt;&gt; ''); activation_state text NOT NULL CHECK (activation_state IN ('disabled','active')); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |
| cohort_result | id uuid PRIMARY KEY; definition_id uuid NOT NULL; query_checksum text NOT NULL CHECK (query_checksum &lt;&gt; ''); query_family_hash text NOT NULL CHECK (query_family_hash &lt;&gt; ''); member_bucket integer NOT NULL CHECK (member_bucket &gt;= 0); anonymous_result jsonb NOT NULL CHECK (jsonb_typeof(anonymous_result)='object'); integrity_json jsonb NOT NULL CHECK (jsonb_typeof(integrity_json)='object'); privacy_policy_version text NOT NULL CHECK (privacy_policy_version &lt;&gt; ''); expires_at timestamptz NOT NULL; created_at timestamptz NOT NULL DEFAULT now() |
| contribution_performance | id uuid PRIMARY KEY; contributor_party_id uuid NOT NULL; role_codes text[] NOT NULL CHECK (cardinality(role_codes) &gt; 0); recording_set_checksum text NOT NULL CHECK (recording_set_checksum &lt;&gt; ''); period daterange NOT NULL CHECK (NOT isempty(period)); totals_json jsonb NOT NULL CHECK (jsonb_typeof(totals_json)='object'); unknown_count integer NOT NULL CHECK (unknown_count &gt;= 0); coverage numeric(5,4) NOT NULL CHECK (coverage BETWEEN 0 AND 1); derivation_version text NOT NULL CHECK (derivation_version &lt;&gt; ''); source_set text[] NOT NULL DEFAULT ARRAY[]::text[]; created_at timestamptz NOT NULL DEFAULT now() |
| performance_proof | id uuid PRIMARY KEY; contributor_party_id uuid NOT NULL; role_code text NOT NULL CHECK (role_code &lt;&gt; ''); period daterange NOT NULL CHECK (NOT isempty(period)); total_json jsonb NOT NULL CHECK (jsonb_typeof(total_json)='object'); coverage numeric(5,4) NOT NULL CHECK (coverage BETWEEN 0 AND 1); allowed_source_set text[] NOT NULL DEFAULT ARRAY[]::text[]; derivation_version text NOT NULL CHECK (derivation_version &lt;&gt; ''); state text NOT NULL CHECK (state IN ('active','degraded','revoked')); public_token_digest text NOT NULL CHECK (public_token_digest &lt;&gt; ''); version bigint NOT NULL CHECK (version &gt; 0); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() |

### Persistence and retention rules

- metric_observation, metric_restatement, report_snapshot and evidence used by an active proof are append-only. Provider zero restatement is a real replacement value and may trigger suspected-takedown review; the prior fact remains.
- Token references, raw imports and provider response artifacts obey capability/terms retention. Purge removes permitted raw/provider-derived facts through a recorded job, invalidates projections/proofs and preserves only required audit digests.
- Every base table has RLS enabled and no PUBLIC/anon grant. Request handlers use bounded security-invoker RPCs; connector, matcher, projector, digest and proof roles receive only their named columns/actions.

## State, Concurrency and Recovery

| Aggregate | Transitions | Invariants/recovery |
|---|---|---|
| source_connection | pending → active → action_required/disabled; active → disconnecting → disconnected/purge_queued → purged | grant loss never implies ownership loss; canonical connection lock prevents duplicate ingestion |
| sync_run | queued → running → succeeded/partial/action_required/failed | cursor and observations commit per page; disconnect stops next lease; retry resumes exact cursor |
| profile/catalog binding | candidate → confirmed/contested/quarantined/revoked | ambiguity never auto-confirms; merge/split quarantines dependent bindings |
| match_case | open → investigating → resolved/routed | cleanup steward cannot resolve genuine authority dispute |
| report share | active → revoked/expired | snapshot immutable; provider terms may narrow or revoke |
| performance proof | active → degraded/revoked; degraded → active after valid re-derivation | source/credit/integrity loss degrades immediately; history remains |

- Observation ingest locks source key and inserts observation plus outbox atomically. Same digest replays; a changed digest on the same key is 409 SOURCE_OBSERVATION_CONFLICT.
- Restatement inserts replacement observation, restatement edge and invalidation outbox in one serializable transaction. Dashboards, shares, digests and proofs never silently retain a superseded total.
- Import preview/commit uses checksum plus adapter/preview revision CAS. Overlaps remain claimed facts and never modify observed rows.
- Dashboard queries pin source membership, binding revisions, integrity policy and projection watermark. A concurrent sync may produce a later view, not a mixed view.

## Middleware and Policies

Order: request ID → proxy normalization → CORS → auth/service binding → CSRF for browser writes → strict size/header/Zod → rate and provider budget → context/mandate/RLS → idempotency/If-Match → integrity/terms/B2 policy → handler → response schema → redacted audit/log.

| IDs | Authorization rule | CORS |
|---|---|---|
| 39.01–39.04 | owner/import mandate; step-up for credential or purge; readers limited to sync/self-removal | BE00-CORS-WEB-CREDENTIALLED |
| 39.05, 39.09, 39.10, 39.12–39.16 | subject, contributor or explicitly authorized context; other subjects concealed as 404 | BE00-CORS-WEB-CREDENTIALLED |
| 39.06–39.08 | claimant own relation or purpose-bound steward/trust route; class limits action | BE00-CORS-WEB-CREDENTIALLED |
| 39.11 | scheduler/digest service principal only | BE00-CORS-DENY |

Rate keys combine actor, subject/context, provider and query family. Cohort and sparse-report gates use privacy budgets, minimum bucket floors, stable query-family hashing and anti-differencing delay. Logs omit credentials, provider payloads, metric values, catalog identities, candidate sets, report tokens and recipient fields.

## External Integrations

| Seam | Contract | Timeout/retry/circuit | Terminal behavior |
|---|---|---|---|
| provider OAuth/capabilities | OAuth receipt → encrypted grant/capability/terms versions | 3s; 2 retries 250ms/1s; opens after 5 failures/min for 2m | connection action_required; no credential in domain row/log |
| provider metrics API | cursor/window → page plus receipt/next cursor | connect 1s, total 10s; 5 retries 1s/5s/30s/2m/10m with jitter; provider circuit 10 failures/5m for 15m | run partial/action_required; committed pages remain sourced |
| upload/parser adapter | upload receipt plus adapter version → preview rows | 30,000 ms worker deadline; 4 total attempts with full-jitter caps 10s/1m/5m; retry worker timeout/crash, transient storage/adapter, retryable 5xx; terminal malware, unsupported format/version, invalid row schema, digest mismatch, deterministic parse failure; adapter-version circuit opens after 5 retryable failures/60s for 5m, admits one half-open preview probe, closes after two successes, and reopens on failure | Batch failed_actionable; no unlabeled commit and no reuse across adapter versions |
| storage/render service | snapshot payload → encrypted CSV/PDF artifact | 15s; 2 retries 1s/5s; circuit 5 failures/min for 2m | snapshot persists; share/export reports RENDER_UNAVAILABLE |
| email/push delivery | digest artifact plus opaque destination → receipt | 2s; 3 retries 1s/5s/30s; circuit 10 failures/30s for 60s | digest run retryable/suppressed; no broadened recipient |
| credit/recording source shards | counter-attested relation query → versioned role/record set | 2s; 2 retries 100ms/500ms; circuit 5 failures/30s for 30s | contribution/proof fails closed with CREDIT_AUTHORITY_UNAVAILABLE |

All queues are at-least-once with event/receipt dedupe, exponential retry capped at 15 minutes and poison quarantine after eight attempts. Future schemas, signature failures and equal-version digest conflicts quarantine; stale versions no-op.

### Exact retryability and circuit closure

Attempt totals include the initial attempt. Each delay is a full-jitter cap chosen uniformly from zero through that cap. Unless stated otherwise, half-open admits one probe at a time, closes after two consecutive successful probes, and reopens for the full interval after a retryable probe failure.

| Seam | Exact attempts and retry classification | Circuit open, half-open, and fallback |
|---|---|---|
| Provider OAuth/capabilities | 3,000 ms per attempt; 3 attempts total; retry caps 250 ms then 1 s. Retry timeout, connection reset, 408, 429, and 5xx; user denial, invalid/expired receipt, capability/terms mismatch, auth/schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 60 s for 2 min; one half-open capability probe. Fallback sets connection action_required and stores no credential in a domain row or log. |
| Provider metrics API | Connect deadline 1,000 ms and total deadline 10,000 ms per attempt; 6 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, and 10 min. Retry timeout, connection reset, 408, 429 honoring bounded Retry-After, 5xx, and provider-declared retryable cursor; invalid grant/window/cursor, auth/schema failure, and non-429 4xx are terminal. | Provider circuit opens after 10 retryable failures in 5 min for 15 min; one half-open page probe. Fallback leaves the run partial/action_required and preserves already committed sourced pages. |
| Upload/parser adapter | 30,000 ms worker deadline; 4 attempts total; retry caps 10 s, 1 min, and 5 min. Retry worker timeout/crash, transient storage/adapter availability, and retryable 5xx; malware, unsupported format/version, invalid row schema, digest mismatch, and deterministic parse failure are terminal. | Adapter-version circuit opens after 5 retryable failures in 60 s for 5 min; one half-open preview probe. Fallback marks the batch failed_actionable and permits no unlabeled commit. |
| Storage/render service | 15,000 ms per attempt; 3 attempts total; retry caps 1 s then 5 s. Retry only known-no-effect timeout/connection failure, 408, 429, and 5xx; invalid snapshot/format, ownership/auth/schema failure, non-429 4xx, and ambiguous artifact creation are terminal for blind render. | Open after 5 retryable failures in 60 s for 2 min; half-open performs one object-status probe before one render. Fallback preserves the snapshot and returns RENDER_UNAVAILABLE with no partial artifact. |
| Email/push delivery | 2,000 ms per attempt; 4 attempts total; retry caps 1 s, 5 s, and 30 s. Retry only known-no-effect timeout/connection failure, 408, 429, 5xx, or provider-declared retryable receipt; invalid/suppressed destination, auth/schema failure, non-429 4xx, and ambiguous acceptance are terminal for blind send. | Open after 10 retryable failures in 30 s for 60 s; half-open performs one receipt-status probe before one delivery. Fallback marks the digest run retryable/suppressed and never broadens recipients. |
| Credit/recording source shards | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. Retry timeout, connection reset, 408, 429, and 5xx; invalid relation/role/version, auth denial, counter-attestation failure, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open authority probe. Fallback fails contribution/proof closed with CREDIT_AUTHORITY_UNAVAILABLE. |
| Queue consumers | 30,000 ms handler deadline; 8 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min. Retry transient dependency/DB availability, serialization/deadlock, handler timeout, and retryable 5xx. Future schema, invalid signature, equal-version digest conflict, auth denial, and invariant failure are terminal and quarantined; stale versions succeed as no-op. | Open the consumer event-type partition after 20 retryable failures in 60 s for 60 s; one half-open event probe. Open retains the durable event; attempt 8 moves it to poison quarantine/DLQ with alert and preserves committed pages/projections. |

## Event and Consumer Contracts

Each event includes eventId, literal eventType, schemaVersion=1, aggregateId/version, occurredAt, producer and traceId.

| Event | Producer and payload | Consumers and idempotency |
|---|---|---|
| analytics.source.state_changed.v1 | connection service: connection, provider, old/new state, capability/terms version, reason | scheduler/health/audit; connection-version |
| analytics.metric.observed.v1 | connector/import: observation, source, subject, metric, period, value, provenance | integrity/projector; source observation key |
| analytics.metric.restated.v1 | connector: old/new observation, reason, recorded-at | invalidator/report/proof; old-new pair |
| analytics.series.integrity_changed.v1 | health engine: series/window, coverage, freshness, gaps, policy version | dashboards/alerts/proof; series-window-policy |
| analytics.profile_binding.changed.v1 | matcher: provider external ID, subject, evidence/state, revision | projector/case audit; binding-revision |
| analytics.catalog_binding.changed.v1 | matcher: external/internal recording, contributor, evidence/state | contribution projector; binding-revision |
| analytics.report.snapshot_created.v1 | 39.12: report, query checksum, provenance policy, expiry | renderer/share audit; report-checksum |
| analytics.credit_performance.derived.v1 | 39.15 worker: contributor, roles, coverage, totals, unknown count, derivation version | proof eligibility/dashboard; contributor-slice-version |
| analytics.performance_proof.changed.v1 | 39.16/invalidation: proof, role, total, coverage, validity, reason | public proof/cache/audit; proof-version |

## Error Handling

| ID | Status and ApiError codes | Recovery/disclosure |
|---|---|---|
| 39.01 | 400 PROVIDER_SCOPE_INVALID; 401 AUTH_REQUIRED; 403 OWNER_REQUIRED; 409 CONNECTION_CONFLICT; 503 PROVIDER_UNAVAILABLE | same external entity joins canonical connection only after owner grant |
| 39.02 | 404 CONNECTION_NOT_FOUND; 409 SYNC_ALREADY_ACTIVE; 422 CAPABILITY_UNSUPPORTED; 429 PROVIDER_BUDGET; 503 PROVIDER_UNAVAILABLE | unsupported source offers import, never simulated sync |
| 39.03 | 403 OWNER_REQUIRED/STEP_UP_REQUIRED; 409 SYNC_DISCONNECT_RACE; 412 REVISION_MISMATCH; 422 PURGE_TERMS_FORBIDDEN | retain/purge outcome explicit; retry job safe |
| 39.04 | 400 ADAPTER_INVALID/PREVIEW_MISMATCH; 409 IMPORT_CHECKSUM_EXISTS; 413 PAYLOAD_TOO_LARGE; 422 ROWS_QUARANTINED | preview exposes owner-safe row errors; commit is all accepted rows plus quarantine facts |
| 39.05 | 400 PERIOD_INVALID; 404 METRIC_NOT_FOUND; 409 SERIES_INTEGRITY_UNKNOWN; 429 RATE_LIMITED | never interpolates; safe integrity/gap details returned |
| 39.06 | 400 EVIDENCE_INVALID; 403 SUBJECT_AUTHORITY_REQUIRED; 409 PROFILE_BINDING_CONTESTED; 422 AMBIGUOUS_MATCH | candidates remain hidden from unrelated claimants |
| 39.07 | 400 EVIDENCE_INVALID; 403 CONTRIBUTOR_AUTHORITY_REQUIRED; 409 CATALOG_BINDING_CONFLICT; 422 CORROBORATION_REQUIRED | no fuzzy auto-bind; other contributor relation untouched |
| 39.08 | 403 CASE_SCOPE_REQUIRED/DUAL_CONTROL_REQUIRED; 404 CASE_NOT_FOUND; 409 CASE_STATE_CONFLICT; 412 REVISION_MISMATCH | authority dispute routes to trust workflow |
| 39.09 | 400 QUERY_INVALID; 403 CONTEXT_NOT_AUTHORIZED; 409 PROJECTION_INTEGRITY_UNKNOWN; 429 QUERY_BUDGET; 503 PROJECTION_UNAVAILABLE | no partial unauthorized series; gaps remain visible |
| 39.10 | 400 RULE_INVALID; 404 RULE_NOT_FOUND; 409 NOISE_BUDGET_EXCEEDED; 412 REVISION_MISMATCH | existing rule remains |
| 39.11 | 401 SERVICE_AUTH_REQUIRED; 409 DIGEST_ALREADY_RENDERED; 422 RECIPIENT_PERMISSION_LOST; 503 RENDER_UNAVAILABLE | permission loss suppresses; no stale delivery |
| 39.12 | 400 FIELD_POLICY_INVALID; 403 REDISTRIBUTION_FORBIDDEN; 409 SNAPSHOT_STALE; 422 INTEGRITY_BELOW_EXPORT_FLOOR; 503 RENDER_UNAVAILABLE | snapshot/provenance persists for retry |
| 39.13 | 403 FEATURE_POLICY_DISABLED/COHORT_NOT_AUTHORIZED; 409 PRIVACY_FLOOR_NOT_MET; 429 QUERY_FAMILY_BUDGET | returns no count below floor; no alternate export |
| 39.14 | 400 QUERY_INVALID; 403 CONTRIBUTOR_AUTHORITY_REQUIRED; 404 CATALOG_NOT_FOUND | only own confidential relations |
| 39.15 | 400 ROLE_SLICE_INVALID; 403 CONTRIBUTOR_AUTHORITY_REQUIRED; 409 COVERAGE_UNKNOWN; 503 CREDIT_AUTHORITY_UNAVAILABLE | unknowns explicit; no estimated totals |
| 39.16 | 400 PROOF_REQUEST_INVALID; 403 ROLE_AUTHORITY_REQUIRED; 409 PROOF_VERSION_CONFLICT; 422 INTEGRITY_BELOW_PROOF_FLOOR/TERMS_FORBID_PROOF | prior proof degrades/revokes; confidential catalog absent |

Provider/SQL exceptions never escape. Unknown failures map to 500 INTERNAL_ERROR, dependency deadlines to 503 DEPENDENCY_TIMEOUT and admission budgets to 429 RATE_LIMITED with Retry-After.

## Testing Strategy

| ID | Required deterministic tests |
|---|---|
| 39.01 | canonical connection under concurrent grants; delegated read not ownership; credential absent from logs/tables |
| 39.02 | cursor resumes after partial page; disconnect race stops next lease; unsupported provider never fakes sync |
| 39.03 | owner retain/purge choices; reader self-removal only; forbidden terms block purge |
| 39.04 | preview checksum/adapter CAS; overlap remains claimed; malformed rows quarantine |
| 39.05 | source/restatement/integrity exposed; no interpolation; cross-subject 404 |
| 39.06 | one confirmed subject; competing claim freezes; merge/split quarantines dependents |
| 39.07 | many-to-many corroborated binding; contributor cannot delete another relation |
| 39.08 | cleanup versus authority routes; stale revision 412; scoped evidence and dual control |
| 39.09 | multi-hyphenate context union without duplicate/broadened rows; watermark consistency |
| 39.10 | owner rule CAS, metric permission, noise budget and schedule |
| 39.11 | permission recheck before render/send; schedule replay; renderer circuit |
| 39.12 | immutable snapshot carries provenance/gaps; terms narrow fields; expiry/revocation |
| 39.13 | physical B2 gate default deny, cohort floor, anti-differencing and no n below floor |
| 39.14 | own roles and contested/unknown states; confidential cross-contributor denial |
| 39.15 | role-slice observed totals, coverage and unknowns; no causal narrative/estimation |
| 39.16 | only attested credits and covered observations; restatement/source loss degrades proof |

RLS/grant tests cover anon, authenticated subject, entity owner, delegated reader, contributor, match steward, support purpose grant and each service principal. Transaction tests prove append-only observations/restatements, canonical connection uniqueness, binding conflict freeze, consistent query watermark and atomic invalidation outbox.

## Deepening Passes

- Micro: observed versus claimed, zero restatement, cadence jitter, integrity unknown, contributor-specific binding and role-scoped proof are explicit.
- Macro: provider grants never become identity/catalog ownership; Shard 39 does not duplicate ticket, venue, fan or credit source facts.
- Security: credentials, hidden candidates, metric values, confidential catalog and recipient information are absent from logs/events/public proof.
- Failure: every integration has finite timeout/retry/circuit behavior and a local actionable state.
- Two-implementer: routes, strict schemas, status/error codes, typed tables, indexes, RLS/grants, state transitions, event semantics and tests are deterministic.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 39.01 | `be_http_requests_total{operation_id="39.01",outcome,code}`, `be_http_latency_seconds{operation_id="39.01"}`, and `be_operation_recovery_total{operation_id="39.01",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.02 | `be_http_requests_total{operation_id="39.02",outcome,code}`, `be_http_latency_seconds{operation_id="39.02"}`, and `be_operation_recovery_total{operation_id="39.02",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.03 | `be_http_requests_total{operation_id="39.03",outcome,code}`, `be_http_latency_seconds{operation_id="39.03"}`, and `be_operation_recovery_total{operation_id="39.03",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.04 | `be_http_requests_total{operation_id="39.04",outcome,code}`, `be_http_latency_seconds{operation_id="39.04"}`, and `be_operation_recovery_total{operation_id="39.04",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.05 | `be_http_requests_total{operation_id="39.05",outcome,code}`, `be_http_latency_seconds{operation_id="39.05"}`, and `be_operation_recovery_total{operation_id="39.05",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.06 | `be_http_requests_total{operation_id="39.06",outcome,code}`, `be_http_latency_seconds{operation_id="39.06"}`, and `be_operation_recovery_total{operation_id="39.06",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.07 | `be_http_requests_total{operation_id="39.07",outcome,code}`, `be_http_latency_seconds{operation_id="39.07"}`, and `be_operation_recovery_total{operation_id="39.07",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.08 | `be_http_requests_total{operation_id="39.08",outcome,code}`, `be_http_latency_seconds{operation_id="39.08"}`, and `be_operation_recovery_total{operation_id="39.08",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.09 | `be_http_requests_total{operation_id="39.09",outcome,code}`, `be_http_latency_seconds{operation_id="39.09"}`, and `be_operation_recovery_total{operation_id="39.09",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.10 | `be_http_requests_total{operation_id="39.10",outcome,code}`, `be_http_latency_seconds{operation_id="39.10"}`, and `be_operation_recovery_total{operation_id="39.10",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.11 | `be_http_requests_total{operation_id="39.11",outcome,code}`, `be_http_latency_seconds{operation_id="39.11"}`, and `be_operation_recovery_total{operation_id="39.11",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.12 | `be_http_requests_total{operation_id="39.12",outcome,code}`, `be_http_latency_seconds{operation_id="39.12"}`, and `be_operation_recovery_total{operation_id="39.12",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.13 | `be_http_requests_total{operation_id="39.13",outcome,code}`, `be_http_latency_seconds{operation_id="39.13"}`, and `be_operation_recovery_total{operation_id="39.13",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.14 | `be_http_requests_total{operation_id="39.14",outcome,code}`, `be_http_latency_seconds{operation_id="39.14"}`, and `be_operation_recovery_total{operation_id="39.14",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.15 | `be_http_requests_total{operation_id="39.15",outcome,code}`, `be_http_latency_seconds{operation_id="39.15"}`, and `be_operation_recovery_total{operation_id="39.15",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 39.16 | `be_http_requests_total{operation_id="39.16",outcome,code}`, `be_http_latency_seconds{operation_id="39.16"}`, and `be_operation_recovery_total{operation_id="39.16",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

- Micro ambiguity: PASS — 16/16 interactions have explicit transport, validation, errors, persistence, policy and test oracles.
- Macro ambiguity: PASS — source ownership, matching authority, B2 gate, redistribution terms and proof ownership have single boundaries.
- Devil's-advocate check: PASS — no implementation may interpolate, silently overwrite, auto-bind ambiguity, treat a reader grant as ownership, reveal sparse cohorts or publish confidential catalog.
- Source contradiction check: PASS — manual imports coexist as labeled claimed facts and cannot replace observed provider facts.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend specification for IA Shard 39 |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure contracts](00-infrastructure.md)
- [IA Shard 39](../ia/39-analytics-ingestion-reporting.md)
- [Engineering standards](../ENGINEERING-STANDARDS.md)
- [Data placement strategy](../data-placement-strategy.md)
