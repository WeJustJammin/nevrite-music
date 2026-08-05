# Market intelligence, fraud and scouting signals — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]  
**Deep Dive:** [[specs/ia/deep-dives/40-market-intelligence-signals|Market intelligence signals deep dive]]

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

- **Shard split:** Single contract; 40.01, 40.02, 40.03, 40.04, 40.05, 40.06, 40.07, 40.08, 40.09, 40.10, 40.11, 40.12, 40.13 and 40.14. The IA complexity gate explicitly passes without decomposition.
- **Boundary:** playlist/chart observations, private curator/geography/routing/impact intelligence, descriptive anomaly/vendor evidence and consent-safe scouting/watch/momentum.
- **Approval:** Single-document recommendation accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 40 IA/deep dive | all placement, chart, geography, routing, anomaly, vendor and scouting contracts |
| Shards 05, 06, 31, 37, 39 and 42 | gates, case escalation, live history, fan aggregates, integrity series and advisory planning |

## Placement, Chart and Curator Invariants

- Playlist transition is append-only `added|moved|removed` under integrity-qualified provider observation with event-time reach snapshot. Duplicate/restatement reconciles additively.
- Placement contribution estimate remains separate from observed transition. Quality assessment pins evidence bands, fraud context, range, sample and policy version; unknown never defaults positive.
- Alert DOM/order puts risk and uncertainty before positive placement/reach. Risky/unknown suppresses celebration and states limits.
- Chart observation is source/chart/period/position/methodology specific. Conflicting sources remain side-by-side; no cross-source reconciliation.
- Curator evidence is private report for public curator/institution only and requires sufficient B2-approved sample. It returns range, n, freshness/fraud context and never creates private-person dossier.

## Geography, Routing and Impact Invariants

- Audience geography keeps owned and rented/provider layers separate with coarse cell, metric, engagement depth, integrity and privacy policy. Sources never average; sparse cells coarsen/suppress.
- Routing shortlist is advisory candidates with evidence factors, booking history, missing inputs, confidence and no paid factor. Insufficient facts returns no ranking.
- Show impact requires first-party booked show and usable before/after windows. Result is range/confidence/null/declined with confounders; no headline causal percentage.
- Confounded or sparse comparison declines rather than inventing effect.

## Anomaly and Vendor Invariants

- Detector consumes integrity-qualified series and descriptive rule/policy only. Observation states unusual facts, evidence, confidence/limits and time; claimed/missing data lowers confidence or withholds.
- Anomaly is not fraud verdict or accusation. Human-readable dossier contains sources/provenance/timeline/defined terms and no automatic provider report.
- Shard 06 receives case only after artist-authorized human escalation and owns dispute/evidence process.
- Vendor history derives private coincidence range, eligible campaigns, n and retractions from linked promotion outcomes. Below floor/no linkage is insufficient.
- Vendor coincidence never feeds detector or self-reinforcing risk model.

## Scouting and Visibility Invariants

- Private watch requires scout purpose mandate and subject consent evaluated at read/query time. Entry stores opaque subject reference only, no metric snapshot, and is separate from follow.
- Momentum requires active watch, current purpose consent, integrity and both absolute/relative floors. It is descriptive observation, not prediction.
- Revoked/denied consent is indistinguishable from quiet/empty to scout; no enumeration side channel.
- Discovery requires purpose, mandate, capped query and current consent, returns credit-native results only. Empty/denied/suppressed render identically.
- Subject purpose revocation atomically removes index visibility, watches and pending signals. Tombstone tells scout access ended without reason/data.
- Analyst/scout cannot write artist canonical records or convert advisory signal into guaranteed plan/legal fact.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/intelligence/playlist-transitions` | recording/playlist/transition/event time/reach/source-integrity/key; intelligence worker | `201 PlaylistPlacementResponse`; additive placement/version | `403`, `409 EVENT_REUSED`, `422 INTEGRITY_INSUFFICIENT`, `429` |
| `POST /internal/v1/intelligence/placement-alerts` | placement/quality policy/evidence bands/fraud context/key; alert worker | `201 PlacementAlertResponse`; neutral/positive/risk-first/suppressed | `403`, `409 SOURCE_STALE`, `422 QUALITY_UNKNOWN`, `429` |
| `POST /internal/v1/intelligence/chart-observations` | source/chart/subject/period/position/methodology/key; chart adapter | `201 ChartObservationResponse`; source-specific event | `403`, `409 EVENT_REUSED`, `422 SOURCE_UNQUALIFIED`, `429` |
| `POST /api/v1/intelligence/curator-evidence` | public curator-or-institution/sample/policy version/key; authorized artist actor; B2 admitted | `201 CuratorEvidenceResponse`; range/n/freshness/context or suppressed | `403 B2_DISABLED`, `409 SOURCE_STALE`, `422 BELOW_PRIVACY_FLOOR|PRIVATE_PERSON_FORBIDDEN`, `429` |
| `GET /api/v1/artists/{id}/audience-geography` | source layers/metric/as-of; artist authority | `AudienceGeographyResponse`; separate coarse layers/depth/integrity | `403`, `429` |
| `POST /api/v1/artists/{id}/routing-shortlists` | tour context/history/geography versions/key; act authority | `201 RoutingShortlistResponse`; candidates/reasons/unknowns/confidence or no-ranking | `403`, `409 SOURCE_STALE`, `422 FACTS_INSUFFICIENT|PAID_FACTOR_FORBIDDEN`, `429` |
| `POST /api/v1/shows/{id}/impact-evaluations` | first-party show/before-after series/method version/key; artist authority | `201 ShowImpactResponse`; range/null/declined/confounders | `403`, `409 SOURCE_STALE`, `422 CONFOUNDED|DATA_SPARSE`, `429` |
| `POST /internal/v1/intelligence/anomaly-observations` | series/rule-policy/unusual facts/confidence-limits/time/key; detector | `201 AnomalyObservationResponse`; descriptive evidence case | `403`, `409 EVENT_REUSED`, `422 INTEGRITY_INSUFFICIENT|ACCUSATION_FORBIDDEN`, `429` |
| `POST /api/v1/intelligence/anomalies/{id}/dossiers` | artist authority/scope/format/key; artist actor | `201 AnomalyDossierResponse`; sources/provenance/timeline artifact | `403`, `422 AUTO_PROVIDER_REPORT_FORBIDDEN`, `429` |
| `POST /api/v1/intelligence/vendors/{id}/history-evaluations` | linked campaigns/anomaly outcomes/policy key; authorized entity actor | `201 VendorCoincidenceResponse`; range/n/retractions or insufficient | `403`, `409 SOURCE_STALE`, `422 BELOW_PRIVACY_FLOOR|LINKAGE_INSUFFICIENT`, `429` |
| `POST /api/v1/scouting/watches` | scout entity/subject opaque ID/purpose/mandate/key; scout; consent allowed | `201 ScoutWatchResponse`; active/no-result | `403`, `409 WATCH_EXISTS`, `422 CONSENT_DENIED|PURPOSE_INVALID`, `429` |
| `POST /internal/v1/scouting/momentum-evaluations` | watch/metric/baseline-current/floors/integrity/event key; signal worker | `MomentumObservationResponse`; signal or quiet-equivalent | `403`, `409 EVENT_REUSED`, `422 FLOOR_NOT_MET|CONSENT_DENIED`, `429` |
| `POST /api/v1/scouting/search` | purpose/mandate/query/cap/policy version/key; scout | `ScoutingSearchResponse`; capped credit-native results or invariant empty | `403`, `409 POLICY_STALE`, `422 PURPOSE_INVALID`, `429` |
| `DELETE /api/v1/artists/{id}/scouting-visibility/{purpose}` | policy version/key; subject authority | `204`; index/watch/pending signal access removed | `403`, `409 VERSION_CONFLICT`, `428`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Playlist transition | `added -> moved|removed`; `moved -> moved|removed`; `removed -> added` | Integrity-qualified provider event appends each transition with event-time reach; duplicate/restatement reconciles additively. No historical transition is overwritten. |
| Placement alert | `evaluating -> positive|neutral|risk_first|suppressed`; any emitted state `-> stale|superseded` | Evidence bands, fraud context and policy choose state; risky/unknown suppresses celebration and puts limitations first. Source change marks prior alert stale. |
| Chart observation | `observed` is terminal for its source/chart/period/methodology identity | Qualified adapter event appends immutable source-specific fact. Conflicting sources coexist; no cross-source canonicalization transition exists. |
| Curator evidence report | `evaluating -> issued|suppressed|blocked`; `issued -> stale|revoked` | B2 gate, public curator class, approved sample floor and current evidence permit a private range report. Below-floor/private-person inputs suppress or block without dossier creation. |
| Routing shortlist or impact evaluation | `current -> stale|superseded`; `stale -> superseded`; impact may originate `declined|null|current` | Current qualified facts produce advisory candidates or a range; insufficient/confounded facts produce no ranking/declined/null. Source successor marks results stale and no state becomes causal fact. |
| Anomaly observation | `observed -> escalated|dismissed|stale`; `escalated -> case_open|dismissed` | Detector emits descriptive evidence only; artist-authorized human action may route Shard 06 case. Observation never becomes fraud verdict or automatic provider report. |
| Scout watch | `active -> revoked|expired`; `revoked|expired -> active` only through a new consented watch | Current mandate, purpose and subject consent create opaque watch. Consent revocation atomically removes watch, index visibility and pending signals while returning an invariant quiet result. |
| Momentum signal | `evaluating -> emitted|quiet|suppressed`; `emitted -> stale|revoked` | Active watch, consent, integrity and absolute/relative floors permit descriptive emission. Missing floor/consent yields quiet-equivalent response and cannot be promoted to prediction. |
| Scouting visibility | `visible -> revoked`; `revoked -> visible` only through new subject authorization | Subject purpose revocation removes indexes/watches/signals atomically and leaves a reason-free tombstone. Analysts cannot restore visibility or mutate artist canonical records. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; causal claim, fraud verdict, paid ranking or consent-enumeration transition returns `409 INTELLIGENCE_POLICY_VIOLATION`.

## Persistence, RLS and Workers

- Playlist transition/quality/alert, chart observation, curator report, geo layer, route/impact analysis, anomaly case/dossier/escalation, vendor coincidence, scouting consent/watch/momentum/index/tombstone rows pin source/policy versions.
- RLS exposes placement/chart/geo/impact to artist context, anomaly/vendor facts privately, Shard 06 only after explicit share, and scouting records to consent-qualified purpose. Raw private signals never enter public/event payloads.
- Placement, chart, geo, route, impact, anomaly, vendor, watch, momentum and revocation workers are idempotent. Consent rechecks at query/fire and atomic projection swap prevents revocation races.

## Failure, Deepening and Ambiguity Gate

Tests cover transition overwrite, unknown-positive alert, cross-source chart merge, private curator dossier, sparse differencing, geo averaging, paid routing, invented route, causal show percentage, anomaly accusation, auto-report, vendor detector feedback, watch snapshots, denied-consent distinguishability, scout enumeration and post-revoke signal. Seven passes converge; two implementers receive identical market intelligence and scouting behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Market intelligence and scouting contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/deep-dives/40-market-intelligence-signals|Deep Dive 40 — Market intelligence signals]]
- [[specs/be/06a-case-intake-evidence|Case intake and evidence — Backend Specification]]
- [[specs/be/31e-live-draw-guidance-reliability-demand|Verified live draw, guidance, reliability and fan demand — Backend Specification]]
- [[specs/be/39-analytics-ingestion-reporting|Analytics ingestion, matching and reporting — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/deep-dives/40-market-intelligence-signals|Deep Dive 40 — Market intelligence, fraud and scouting signals]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/31e-live-draw-guidance-reliability-demand|Verified live draw, guidance, reliability and fan demand — Backend Specification]]
- [[specs/be/39-analytics-ingestion-reporting|Analytics ingestion, matching and reporting — Backend Specification]]
