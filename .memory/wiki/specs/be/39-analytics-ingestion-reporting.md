# Analytics ingestion, matching and reporting — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]  
**Deep Dive:** [[specs/ia/deep-dives/39-analytics-ingestion-reporting|Analytics ingestion and reporting deep dive]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** Single contract; 39.01, 39.02, 39.03, 39.04, 39.05, 39.06, 39.07, 39.08, 39.09, 39.10, 39.11, 39.12, 39.13, 39.14, 39.15 and 39.16. The IA complexity gate explicitly passes without decomposition.
- **Boundary:** source connection/import, immutable observations/restatements, profile/catalog matching, integrity-labelled analytics, alerts/reports/cohorts and contribution performance proofs.
- **Approval:** Single-document recommendation accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 39 IA/deep dive | all source, matching, integrity, dashboard, report and proof contracts |
| Shards 01, 05, 07, 22, 35, 36 and 38 | identity, gates, credits, release/ticket/promotion source semantics |

## Source and Observation Invariants

- External connection pins provider external entity, scopes, capability/terms version, grant and delegated readers. Grant never implies ownership or subject match; one canonical connection exists per external entity.
- Sync writes immutable observations under unique source key and additive restatements referencing prior value. Prior observation is never overwritten.
- Disconnect revokes credentials and follows explicit retain/purge policy permitted by provider/legal terms. Unknown provider outcome reconciles and no history silently deletes.
- File import requires supported parser, immutable preview/checksum/adapter version, row overlaps/errors and metric definitions. Commit quotes exact preview; blocked/quarantined rows do not contaminate accepted observations.
- Claimed/imported and provider-observed provenance remain distinct. Import cannot launder truth label.
- Series integrity stores freshness, coverage, dominant loss, gaps, source membership and policy version. Unknown fails closed, no interpolation or unlabelled estimate.

## Matching and Conflict Invariants

- External profile binding requires entity authority plus evidence and exactly one confirmed subject. Candidate confidence alone cannot bind.
- Collision, merge/split or contested identity quarantines. Silence/no response never awards claim.
- Catalog binding is contributor-owned many-to-many with corroborating evidence. Fuzzy/ISRC-only candidates require explicit confirmation; one contributor cannot delete another's binding.
- Conflict resolution appends corrected binding/alias or explicit unresolved remedy with steward/dispute authority and version. Historical bindings/evidence remain.

## Dashboard, Report and Proof Invariants

- Dashboard is set-union source series under explicit person/entity context. Every series exposes metric definition, units, source/truth label, coverage, gaps, freshness and restatement; partial source affects only dependent metric.
- No causal semantics are inferred from observed series. Gaps render as accessible rows/ranges, not only chart breaks.
- Alert/digest rule requires permitted metric, source integrity, recipient and domain noise budget. Closed gate, sparse/private data cannot schedule.
- Digest renders complete permission-scoped answer once with headings, tables, units, provenance and freshness; any required render failure sends nothing.
- Share/export requires step-up, field policy and immutable snapshot or explicit live choice. Expiring/revoked state is resolvable; provider restrictions redact/deny explicitly and cohorts are excluded.
- Cohort comparison is pull-only B2-approved anonymized stage/shape query above floor. Below floor suppresses and never widens or enables differencing.
- Contribution projection lists all counter/self-claimed records, puts coverage before non-estimated set-union aggregate, preserves no-data unknown and never splits/divides streams.
- Role slices overlap and expose non-additivity plus visible unroled bucket; no role is inferred.
- Public/listing proof requires counter-attested role credit, allowed observed sources, sufficient coverage and provider terms. It publishes role-scoped total/coverage/sources/validity without confidential catalog; later invalidation degrades visibly.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/analytics/connections` | entity/provider/external entity/scopes/capability+terms/grant/readers/key; entity authority | `201 AnalyticsConnectionResponse`; active/disconnected/manual-only state | `403`, `409 CONNECTION_EXISTS`, `422 PROVIDER_UNSUPPORTED|SCOPE_UNSUPPORTED`, `429` |
| `POST /internal/v1/analytics/connections/{id}/syncs` | cursor/capability+terms versions/event key; connector worker | `202 AnalyticsSyncResponse`; cursor/quiet-retry/actionable state | `403`, `409 EVENT_REUSED|CAPABILITY_LOST`, `429` |
| `DELETE /api/v1/analytics/connections/{id}` | retain-or-purge policy/expected version/key; owner | `204`; credentials revoked/history policy pending-complete | `403`, `409 PROVIDER_OUTCOME_UNKNOWN|VERSION_CONFLICT`, `422 PURGE_NOT_PERMITTED`, `428`, `429` |
| `POST /api/v1/analytics/import-previews` | file/parser/checksum/key; authorized importer | `201 AnalyticsImportPreviewResponse`; rows/overlaps/errors/definitions | `403`, `409 CHECKSUM_REUSED`, `422 PARSER_UNSUPPORTED`, `429` |
| `POST /api/v1/analytics/import-previews/{id}/commits` | exact preview/checksum/accepted rows/key; importer | `202 AnalyticsImportResponse`; accepted/quarantined row states | `403`, `409 PREVIEW_STALE|SCHEMA_CONFLICT|METRIC_CONFLICT`, `422`, `429` |
| `GET /api/v1/analytics/metrics/{id}` | authorized context/window | `MetricInspectionResponse`; value/source/coverage/gaps/freshness/restatements | `403`, `404`, `429` |
| `POST /api/v1/analytics/profile-bindings` | provider external ID/subject/evidence/expected connection version/key; entity authority | `201 ExternalProfileBindingResponse`; confirmed/quarantined state | `403`, `409 BINDING_COLLISION|BINDING_CONTESTED`, `422 CONFIRMATION_REQUIRED`, `429` |
| `POST /api/v1/analytics/catalog-bindings` | external/internal recording/contributor/evidence/key; contributor | `201 CatalogBindingResponse`; confirmed/candidate/quarantined | `403`, `409 BINDING_CONTESTED`, `422 FUZZY_CONFIRMATION_REQUIRED`, `429` |
| `POST /api/v1/analytics/binding-conflicts/{id}/resolutions` | action/alias-or-binding/reason/evidence/expected version/key; steward or dispute actor | `BindingResolutionResponse`; successor/unresolved remedy | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/analytics/dashboards/{id}` | explicit person/entity contexts/query/as-of | `AnalyticsDashboardResponse`; set-union series/integrity labels | `403`, `409 CONTEXT_FORBIDDEN`, `429`, `503` |
| `POST /api/v1/analytics/alerts` | recipient/metric/rule/noise budget/key; authorized actor | `201 AnalyticsAlertResponse`; active/blocked version | `403`, `409 RULE_EXISTS`, `422 GATE_CLOSED|DATA_SPARSE|METRIC_PRIVATE`, `429` |
| `POST /internal/v1/analytics/digests/{id}/renders` | due rule/permission snapshot/event key; digest worker | `AnalyticsDigestResponse`; sent-or-nothing/render evidence | `403`, `409 EVENT_REUSED`, `422 REQUIRED_RENDER_FAILED`, `429` |
| `POST /api/v1/analytics/reports` | query/snapshot-or-live/field policy/expiry/step-up/key; authorized actor | `201 AnalyticsReportResponse`; expiring report/redactions | `403 STEP_UP_REQUIRED`, `409 SOURCE_STALE`, `422 PROVIDER_FIELD_DENIED|COHORT_EXPORT_FORBIDDEN`, `429` |
| `POST /api/v1/analytics/cohort-comparisons` | approved stage/shape query/policy version/key; authorized analyst; B2 admitted | `201 CohortComparisonResponse`; anonymized result or suppressed | `403 B2_DISABLED`, `409 POLICY_STALE`, `422 BELOW_PRIVACY_FLOOR`, `429` |
| `GET /api/v1/analytics/contributors/{id}/performance` | role/context/as-of; contributor controller | `CreditPerformanceResponse`; records/coverage/totals/unknowns | `403`, `429` |
| `POST /api/v1/analytics/contributors/{id}/role-slices` | normalized roles/context/key; contributor controller | `RoleSliceResponse`; overlapping totals/unroled/non-additivity | `403`, `422 ROLE_INVALID`, `429` |
| `POST /api/v1/analytics/performance-proofs` | contributor/role/counter-attested credit/allowed series/terms/key; contributor | `201 PerformanceProofResponse`; published/blocked validity | `403`, `409 SOURCE_STALE`, `422 COUNTER_ATTESTATION_REQUIRED|COVERAGE_INSUFFICIENT|TERMS_RESTRICTED`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Analytics connection | `active -> degraded|manual_only|disconnecting`; `degraded -> active|manual_only|disconnecting`; `disconnecting -> disconnected|outcome_unknown`; `outcome_unknown -> disconnected|active` | Capability/terms/grant health controls service; disconnect revokes credentials first, then applies permitted retain/purge policy. Unknown provider outcome reconciles without silent history deletion. |
| Sync run | `queued -> running -> succeeded|partial|failed|blocked`; `failed|blocked -> queued` | Connector lease and unique event key process immutable observations; capability loss blocks. Retry resumes from committed cursor and never overwrites prior values. |
| Observation | `observed` is immutable; `observed -> restated` creates a linked successor | Unique source key appends provider/import evidence; corrected values reference the prior observation. Claimed and provider-observed truth labels never convert into each other. |
| Import preview/batch | Preview `active -> committed|expired|stale`; batch `validating -> accepted|partial|quarantined|failed` | Exact checksum/adapter/schema preview is consumed once. Row-level conflicts quarantine without contaminating accepted observations; stale preview returns `409 PREVIEW_STALE`. |
| Profile or catalog binding | `candidate -> confirmed|quarantined|rejected`; `confirmed -> contested|superseded`; `contested|quarantined -> confirmed|unresolved|rejected` | Explicit authorized evidence confirms; collision, fuzzy-only evidence or dispute quarantines. Resolution appends successor/alias/remedy and never deletes historical contributor evidence. |
| Analytics alert/digest | Alert `blocked -> active`; `active -> paused|revoked`; digest `due -> rendering -> sent|failed`; `failed -> due|closed` | Gate, integrity, permission and noise-budget checks activate; each render uses one permission snapshot. Required render failure sends nothing and closed/private/sparse state blocks scheduling. |
| Analytics report | `rendering -> active|blocked|failed`; `active -> expired|revoked|degraded`; `degraded -> superseded|revoked` | Step-up and field/provider policy produce immutable snapshot or explicit live projection. Expiry/revocation resolves visibly; source invalidation degrades rather than silently serving stale proof. |
| Performance proof | `blocked -> published`; `published -> degraded|revoked|superseded` | Counter-attested credit, permitted observed sources, coverage and provider terms permit publication. Later source/terms invalidation visibly degrades or revokes without exposing confidential catalog. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; observation overwrite, silent identity binding or cohort-floor bypass returns `409 ANALYTICS_INTEGRITY_VIOLATION`.

## Persistence, RLS and Workers

- Connection/capability/terms/readers, observation/restatement/integrity, import preview/rows, profile/catalog binding/conflict, dashboard/alert/digest/report, cohort query, contributor projection/role slice and proof rows pin source and policy versions.
- RLS isolates source connections/series by entity/context, contributor catalog bindings by owner, reports by grant, cohort execution to B2 projection and confidential catalog/provider fields from proof/public output.
- Sync, parser, integrity, matcher, dashboard, alert, digest, report, contribution and proof workers are idempotent. Consumers cannot strengthen truth/source/permission/validity labels.

## Failure, Deepening and Ambiguity Gate

Tests cover grant-as-ownership, overwrite restatement, silent disconnect deletion, import laundering, interpolation, confidence auto-match, timeout claim win, contributor binding deletion, hidden context aggregation, causal prose, digest partial send, cohort export/differencing, sparse floor widening, divided streams, inferred role and confidential proof leakage. Seven passes converge; two implementers receive identical analytics ingestion, matching and reporting behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Analytics ingestion, matching and reporting contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
- [[specs/ia/deep-dives/39-analytics-ingestion-reporting|Deep Dive 39 — Analytics ingestion and reporting]]
- [[specs/be/01b-party-identity-aliases|Party identity and aliases — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions and visibility — Backend Specification]]
- [[specs/be/22b-partner-message-delivery-status|Partner message delivery and status — Backend Specification]]
- [[specs/be/38-promotion-marketing|Promotion and marketing — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
- [[specs/ia/deep-dives/39-analytics-ingestion-reporting|Deep Dive 39 — Analytics ingestion, matching and reporting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01b-party-identity-aliases|Person, facets, aliases, acting context and legal disclosure — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/22b-partner-message-delivery-status|Partner messages, delivery choreography and store status — Backend Specification]]
- [[specs/be/38-promotion-marketing|Promotion and marketing — Backend Specification]]
