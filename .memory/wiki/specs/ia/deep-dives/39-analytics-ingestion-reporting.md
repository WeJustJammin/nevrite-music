# Deep Dive 39 — Analytics ingestion, matching and reporting

**Status:** Complete
**Parent:** [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
**Surface:** Responsive web/PWA

## Overview

This deep dive locks observation immutability, query-window integrity, match conflict handling, consistent dashboards and revocable proof. Analytics may be incomplete, stale, claimed or unavailable; it may never hide those states or transform them into fact.

### Convergence Findings

| Pass | Finding | Resolution |
|---|---|---|
| Cross-section | Provider grant and catalog ownership are independent | Connection, profile binding and catalog binding are separate aggregates |
| What-if | Provider revisions alter commercial proof | Restatements append and trigger deterministic re-derivation/degradation |
| What-if | Multi-role contexts overlap | Dashboard/catalog union by canonical recording; role slices overlap explicitly |
| Adversarial | Imported data launders into verified badge | Claimed provenance permanently excluded from attested coverage/proof |
| Adversarial | Name/ISRC collisions silently bind wrong catalog | External IDs key profiles; corroborated proposals require confirmation |
| Adversarial | Cohort floor leaks through repeated queries | B2 gate closed; future floor enforced over query family, not response alone |
| Operations | Partial projection rebuild tears dashboard | Versioned MVCC projection pointer provides one consistent read snapshot |

## Interactions

### Ingestion and Restatement

1. Connector validates provider capability/terms and canonical external-entity connection.
2. Sync reserves source/window cursor and records run before provider call.
3. Provider rows normalize into typed metric definitions; raw payload checksum/evidence remains restricted.
4. Observation insert deduplicates on provider/source subject/metric/period/version key.
5. Changed provider value appends restatement linked to prior observation; no update-in-place.
6. Integrity engine computes source membership, gaps, freshness, coverage and dominant loss per `(subject, metric, query window)`.
7. Projection publishes one immutable derivation version through outbox.
8. Transient errors back off without user noise; terminal auth/withdrawal or configured prolonged degradation becomes actionable.

### Manual Import

1. Upload is encrypted, checksummed and scanned before parser selection.
2. Adapter emits typed rows, units, metric semantics, overlaps and row errors into preview.
3. User resolves mapping and accepts exact checksum/adapter/preview revision.
4. Commit appends `claimed` observations idempotently; raw and royalty-eligible plays remain separate.
5. Imported rows can fill visual/private continuity only with claimed markers; they do not enter attested coverage or proof.
6. Rollback appends batch exclusion and re-derives; source history remains auditable.

### Matching and Conflict

1. Matcher proposes external profile candidates from external ID evidence; display name never joins.
2. Authorized entity actor confirms binding strength. Store unique constraint prevents two confirmed subjects.
3. Recording matcher proposes many-to-many pairs using ISRC plus corroborating title/artist/duration/date evidence; fuzzy score never binds.
4. Contributor owns their pair assertion. Another contributor may add own binding or dispute, never delete first party's record.
5. Class 2/3 data cleanup routes to steward queue; class 1 authority dispute routes to trust/dispute owner.
6. Contested/governance-pending state blocks downstream binding. Timeout never awards a claimant.
7. External merge/split quarantines affected bindings and proofs until explicit reconfirmation.

### Dashboard, Reports and Proof

1. Dashboard resolves person plus authorized entity contexts and canonical recording set union.
2. Read captures one projection version; all cards/series use that version or report partial unavailability.
3. Each series carries metric definition, source membership, freshness, gaps, coverage, restatements and truth label.
4. Cross-scale growth chart indexes each eligible series to period-start 100; raw values remain separate tables.
5. Digest renders from recipient permission at send time; any required query/render failure aborts whole message.
6. Snapshot share freezes query/result/integrity and field policy. Live share recomputes under owner and provider permissions.
7. Credit catalog enumerates every counter/self-claimed credit, marks unknown data and computes coverage before total.
8. Proof filters to counter-attested role credits and allowed observed sources, then records total/coverage/derivation.
9. Credit revocation, terms change, purge or restatement re-derives proof to active/degraded/revoked without revealing catalog.

## Contracts

### Command Results

| Command | Success | Stable refusal / recovery |
|---|---|---|
| `ConnectAnalyticsSource` | `{connectionId, state, capabilityVersion}` | `scope_missing`, `provider_unsupported`, `entity_conflict` |
| `RunSourceSync` | `{runId, cursor, observed, restated}` | `transient_retry`, `terminal_authorization`, `terms_blocked` |
| `PreviewMetricImport` | `{previewId, checksum, rows, overlaps, errors}` | `adapter_unknown`, `metric_ambiguous`, `malware_rejected` |
| `CommitMetricImport` | `{batchId, claimedRows}` | `preview_stale`, `checksum_changed`, `overlap_unresolved` |
| `ConfirmProfileBinding` | `{bindingId, evidence, state}` | `unique_conflict`, `candidate_stale`, `authority_denied` |
| `ConfirmCatalogBinding` | `{bindingId, contributorOwner, evidence}` | `corroboration_insufficient`, `conflict_pending` |
| `ResolveMatchCase` | `{caseId, resolution, affectedBindings}` | `wrong_process`, `evidence_insufficient`, `external_remedy_required` |
| `OpenAnalyticsDashboard` | `{projectionVersion, series, integrity}` | `context_denied`, `projection_unavailable` |
| `CreateReportSnapshot` | `{reportId, version, fields, expiresAt}` | `provider_terms_denied`, `step_up_required`, `query_incomplete` |
| `PublishPerformanceProof` | `{proofId, state, role, total, coverage}` | `credit_not_attested`, `coverage_insufficient`, `source_not_publishable` |

### Integrity Formula

For query window `W`, eligible source-period cells form denominator `E`; observed attested cells form `O`; coverage `c = |O| / |E|`. A floored aggregate is stateable only when `c` meets configured minimum and no single absent source exceeds configured dominant-loss ceiling. Settings may become stricter, not weaker, at user level. Claimed/imported cells never enter `O`. Unknown health yields unknown integrity.

### Capability Gates

| Gate | Closed behavior | Activation evidence |
|---|---|---|
| `provider_connector:<id>` | Manual import only | Provider access, terms/retention/share matrix, adapter tests and runbook |
| `retained_history:<provider>` | Purge required at disconnect if closed | Provider terms and approved retention purpose |
| `shared_provider_report` | Restricted fields omitted/refused | Redistribution terms and disclosure policy |
| `cohort_benchmarking` | No computation/table/export | B2 lawful basis, k-floor, query-family anti-differencing and tests |
| `public_performance_proof` | Private projection only | Provider publication terms and approved source policy |

Server gates and schema/RLS default deny; UI flags cannot activate them.

## Data Models

### State Machines

| Aggregate | States |
|---|---|
| Connection | `pending → active → degraded → actionable/terminal → disconnected`; purge/retain is separate disposition |
| Sync run | `reserved → fetching → normalizing → committed/partial_failed/failed` |
| Import | `uploaded → previewed → committed/excluded/rejected` |
| Profile binding | `proposed → confirmed → quarantined/disputed → reconfirmed/unbound` |
| Catalog binding | `proposed → contributor_confirmed → disputed/invalidated`; another contributor cannot delete |
| Report share | `active → expired/revoked`; snapshot payload immutable |
| Proof | `active → degraded/revoked`; re-derivation may restore only with new valid evidence version |

### Invariants

| Model | Invariant |
|---|---|
| Observation | Immutable source fact; provenance and metric semantics required |
| Restatement | Links prior/new values; projections choose current by source order without deleting history |
| Integrity | Per subject/metric/window/projection version; no dashboard-global freshness |
| Profile binding | One confirmed internal subject per provider external profile |
| Catalog binding | Unique contributor-owned external/internal pair; many-to-many globally |
| Dashboard projection | One immutable version pointer per completed build; readers never mix versions |
| Report snapshot | Values, integrity labels and field policy frozen together |
| Performance proof | No catalog relation in public payload; role/coverage/source policy explicit |

Tokens, import payloads and provider raw responses remain restricted and retention-bound. Deidentified aggregate data cannot be rejoined to fan/contact identities. Purge produces deletion evidence and re-derives every dependent projection before public proof is considered current.

## Access Control

| Action | Predicate |
|---|---|
| Connect/delegate source | Entity owner or explicit `analytics.connection_manage` mandate |
| Purge source history | Current entity owner + step-up + provider policy allows/requests |
| Confirm profile | Subject/entity authority plus evidence; connection alone insufficient |
| Bind recording | Contributor authority for own credit relation |
| Resolve cleanup | Scoped match-steward role; true dispute requires case authority |
| View dashboard | Person self or active mandate for every included entity context |
| Share/export | `analytics.report_share`, step-up and field/provider policy |
| Publish proof | Contributor self + valid attested derivation + publication gate |
| Change integrity/gates | Dual-controlled policy role; floor cannot be weakened ad hoc |

RLS applies at connection subject, entity context, contributor and report owner. Support access is case-scoped and expiring. Share recipients cannot navigate beyond included snapshot. Public proof endpoints are non-enumerable and reveal total/role/coverage only.

## Accessibility

- Integrity state precedes headline value in DOM and visual order.
- Gaps are table rows/ranges, never only broken chart lines; restatement history is keyboard/screen-reader accessible.
- Candidate matching shows evidence/source and requires explicit confirmation; confidence is not color-only.
- Import preview supports row summary, error download and focus-preserving correction.
- Dashboard context selector names included person/entities and prevents accidental hidden-context aggregation.
- Indexed series explain baseline and expose raw tables; role slices state overlap/non-additivity.
- Digest/share preserves headings, data tables, units, provenance and freshness in HTML/PDF/CSV-accessible equivalents.
- Expired/revoked/degraded proof pages provide explicit state and recovery/contact path.
- Async projections show named freshness/progress and keep normal web/PWA p95 target ≤2 seconds through cached complete versions.

## Event Schemas

| Stream | Ordering and consumer rule |
|---|---|
| Source connection | Monotonic connection revision; terminal/disconnect blocks future cursor reservation |
| Metric source key | Provider/source sequence selects current; restatements remain additive |
| Binding | Aggregate revision; quarantine invalidates downstream projection until reconfirmed |
| Projection | Build ID/version publishes atomically only after complete integrity computation |
| Report | Snapshot immutable; access state separate monotonic revision |
| Proof | Derivation version plus validity sequence; stale proof cannot overwrite newer revocation |

Event envelope includes event/schema/aggregate IDs and versions, occurred/recorded time, correlation, causation and producer. Outbox commit is atomic. Dead-letter replay preserves IDs. Shared events exclude token, raw provider payload, import row, share secret, private catalog and cohort membership.

## Edge Cases

| Scenario | Required outcome |
|---|---|
| Delegated credential revoked | Other valid credential may continue canonical connection; ownership/binding unchanged |
| Disconnect retain later becomes terms-forbidden | Policy queues purge/re-derivation with owner notice; no hidden retention |
| Partial sync commits before failure | Committed observations remain; missing window opens gap and run is partial_failed |
| Restatement arrives out of order | Source sequence selects current; history/order anomaly retained and alerted |
| Import parser version changes | Existing batch retains old semantics; re-import creates new preview, not reinterpretation |
| Profile rename | External ID keeps binding; display metadata updates as sourced fact |
| External profile merge/split | Quarantine dependent data/proof until reconfirmed; never auto-repoint |
| Work grouping uncertain | Keep per-recording totals; grouped headline marks unknown rather than heuristic merge |
| Dispute never answered | Binding stays blocked and case ends with external remedy, not claimant win |
| Projection rebuild receives new event | Event belongs next build or restarts deterministically; published version stays coherent |
| Empty digest | Default sends nothing; no message falsely implying no activity |
| Live share owner loses permission | Access revokes/field-redacts by policy; snapshot remains governed by creation terms |
| Cohort repeated-query attack | Gate closed; future query-family budget/floor blocks differencing |
| Confidential credit contributes to proof | Total may include only if publication authority permits; catalog/title never exposed |
| Proof source purged | Proof degrades/revokes immediately after derivation transaction |

## Verification

- **Two-implementer check:** source keys, coverage formula, states, conflict routing, projection consistency and proof filters are explicit.
- **Devil's-advocate check:** grant-as-ownership, import laundering, auto-match, timeout claim win, causal prose, sparse differencing and confidential-catalog leakage are blocked.
- **Bidirectional dependency check:** identity, credits, release, ticket, promotion and market-intelligence edges name source/consumer ownership.
- **Complexity check:** below 400-line pass threshold; no split required.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [39-analytics-ingestion-reporting § Contracts](../39-analytics-ingestion-reporting.md#contracts) defines commands/queries and [39-analytics-ingestion-reporting § Event Schemas](../39-analytics-ingestion-reporting.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Locked ingestion, matching, integrity, reporting and proof state machines | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
