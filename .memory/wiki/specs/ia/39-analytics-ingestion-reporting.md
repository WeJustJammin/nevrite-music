# Shard 39 — Analytics ingestion, matching and reporting

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 39 owns external metric connections/import, source health, external artist/catalog matching, conflict-safe bindings, private cross-source dashboards/reports and credit-linked performance proof. It consumes identity from [[specs/ia/01-identity-authority|Shard 01]], credit confidence from [[specs/ia/07-credits-core|Shard 07]], releases from [[specs/ia/22-release-distribution|Shard 22]], ticket facts from [[specs/ia/35-ticket-products-sales|Shard 35]] and truth-labeled campaign observations from [[specs/ia/38-promotion-marketing|Shard 38]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 24 |
| Child capabilities | 14 across 22.01, 22.02, 22.05 and 22.08 |
| Source boundary | Connection proves read authority, never profile/catalog ownership; one canonical connection per external artist entity |
| Integrity boundary | No interpolation, silent restatement, unlabeled import or causal narrative |
| Matching boundary | Candidates are proposed; external IDs key bindings; ambiguity blocks rather than guesses |
| Dashboard boundary | Multi-hyphenate person/entity contexts form a set union; each series carries source, coverage and freshness |
| Sharing boundary | Snapshot default; provenance/gaps travel; provider redistribution terms may narrow fields |
| B2 boundary | Peer cohorts, sparse shared metrics and low-count exports are server-disabled until approved privacy floor |
| Proof boundary | Counter-attested credits plus sufficiently covered observed data only; role-scoped total, never confidential catalog |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Connections | Canonical external-entity connection has delegated readers/credentials. Disconnect offers retain or purge when provider terms permit; purge requires entity owner. |
| Provider adapters | Every source has versioned capability, cadence/jitter, retention, terms and health profile. Unsupported provider uses manual import, never simulated sync. |
| Ingestion | Raw immutable observations and additive restatements feed derived series. Per-series freshness/coverage render beside every number. |
| Gaps | Interpolation and fabricated estimates are banned. Unknown health fails closed. Query-window coverage excludes terminal sources only after terminal time. |
| Imports | Preview-then-commit, adapter-versioned and permanently `claimed`. Raw plays and royalty-eligible plays are distinct metrics. Claimed rows never satisfy attested proof. |
| Profile matching | External ID is canonical key; suggested subject binding requires confirmation/evidence. One confirmed subject per external profile; merge/split quarantines for re-confirmation. |
| Catalog matching | Many-to-many external/internal recordings. ISRC is a hint corroborated by duration/date/title/artist evidence; fuzzy logic only proposes. |
| Work grouping | Recordings remain distinct; career headline groups verified recordings by canonical work when available, with per-recording breakdown. Role/context union never double-counts one recording. |
| Conflict | Data cleanup and contested authority are separate classes. Contested/governance-pending blocks binding; unresolved cases end with explicit external remedy. |
| Dashboard | Root is multi-hyphenate identity and authorized entity contexts. Different-scale growth comparisons index each series to period-start 100; dual raw axes prohibited. |
| Reporting | Co-occurrence only; no causal/generated connective narrative. Source/model labels from Shard 38 cannot be strengthened. |
| Alerts | One domain noise budget; actionable/terminal conditions only by default. Failed digest render sends nothing; message contains answer and recipient-scoped data. |
| Shares | Immutable snapshot default; live specialist share explicit. Gaps, freshness, coverage and provenance always travel. Expired/revoked link resolves explicitly. |
| Benchmarks | Anonymized cohorts are architected but disabled under B2. Named peers, pushed comparisons and cohort export are prohibited. |
| Credit performance | List every credited record including no-data unknowns. Coverage precedes aggregate. Streams are never divided by split or duplicated by role. |
| Proof | Counter-attested credit and allowed observed source only; imported/self-claimed/estimated data excluded. Proof re-derives/degrades after credit/source change and is role-scoped. |
| Configuration | Cadence, jitter, coverage floors, dominant-loss ceilings, freshness, windows, alert budgets, retention and share expiry are typed versioned settings; users may only tighten integrity floors. |

## Features

- **22.01 Source Connections & Ingestion** — [ideation source](../ideation/22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01-source-connections-ingestion-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **22.02 External Identity & Catalog Matching** — [ideation source](../ideation/22-analytics-market-intelligence/22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **22.05 Cross-Source Dashboard & Reporting** — [ideation source](../ideation/22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **22.08 Credit-Linked Performance** — [ideation source](../ideation/22-analytics-market-intelligence/22.08-credit-linked-performance/22.08-credit-linked-performance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-39.01 — Connect source:** Given Entity authority and provider grant, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Connect source, and (6) return Canonical connection/delegated reader activates without claiming match; if the flow cannot complete, Unsupported scope/provider remains disconnected/manual-import only.
- **AC-39.02 — Sync source:** Given Active capability and scheduled cursor, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Sync source, and (6) return Immutable observations/restatements ingest idempotently; if the flow cannot complete, Transient retry quiet; terminal/actionable state notifies.
- **AC-39.03 — Disconnect source:** Given Owner selects retain/purge and terms allow, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Disconnect source, and (6) return Credentials revoke; history retains or purges by policy; if the flow cannot complete, Unknown provider outcome reconciles; no silent deletion.
- **AC-39.04 — Import metric file:** Given Supported parser and preview accepted, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Import metric file, and (6) return Claimed observations commit once with row/source provenance; if the flow cannot complete, Overlap/schema/metric conflict blocks or quarantines rows.
- **AC-39.05 — Inspect metric:** Given Authorized dashboard context, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Inspect metric, and (6) return Value renders with source, coverage, gap, freshness and restatement; if the flow cannot complete, Insufficient coverage returns bounded/unknown, never estimate.
- **AC-39.06 — Match external profile:** Given Candidate evidence and entity authority, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Match external profile, and (6) return Confirmed unique subject binding appends; if the flow cannot complete, Collision/merge/split quarantines; contested binding blocked.
- **AC-39.07 — Match catalog:** Given External recording and corroborating evidence, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Match catalog, and (6) return Contributor-owned many-to-many binding appends; if the flow cannot complete, Fuzzy/ISRC-only candidate requires confirmation.
- **AC-39.08 — Resolve conflict:** Given Cleanup steward or scoped dispute route, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve conflict, and (6) return Correct binding/alias or explicit unresolved remedy records; if the flow cannot complete, No response never silently awards claim.
- **AC-39.09 — View dashboard:** Given Person and authorized contexts, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View dashboard, and (6) return Set-union series render with per-series integrity labels; if the flow cannot complete, Partial source affects only dependent metric.
- **AC-39.10 — Configure alert/digest:** Given Recipient and permitted metric, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure alert/digest, and (6) return Rule consumes domain noise budget and saves; if the flow cannot complete, Closed gate/sparse/private data cannot be scheduled.
- **AC-39.11 — Render digest:** Given Due rules and complete permission-scoped render, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Render digest, and (6) return Answer plus provenance/freshness sends once; if the flow cannot complete, Any required render failure sends nothing.
- **AC-39.12 — Share/export report:** Given Step-up, field policy and snapshot/live choice, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Share/export report, and (6) return Expiring report carries all integrity labels; if the flow cannot complete, Provider terms redact/deny fields explicitly; cohorts excluded.
- **AC-39.13 — View cohort comparison:** Given B2 gate open and query meets approved floor, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View cohort comparison, and (6) return Pull-only anonymized stage/shape comparison renders; if the flow cannot complete, Below floor suppresses, never widens.
- **AC-39.14 — View contribution catalog:** Given Counter/self-claimed credits and source series, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View contribution catalog, and (6) return All records list; coverage precedes non-estimated aggregate; if the flow cannot complete, No-data remains visible unknown.
- **AC-39.15 — Compare role slices:** Given Normalized credit roles, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compare role slices, and (6) return Overlapping role totals and visible unroled bucket render; if the flow cannot complete, Slices state non-additivity; no inferred role.
- **AC-39.16 — Publish performance proof:** Given Counter-attested role credit, sufficient allowed coverage and provider terms, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish performance proof, and (6) return Role-scoped total proof version publishes; if the flow cannot complete, Import/self-claim/terms restriction blocks; later invalidation degrades.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 39.01 | Connect source | Entity authority and provider grant | Canonical connection/delegated reader activates without claiming match | Unsupported scope/provider remains disconnected/manual-import only |
| 39.02 | Sync source | Active capability and scheduled cursor | Immutable observations/restatements ingest idempotently | Transient retry quiet; terminal/actionable state notifies |
| 39.03 | Disconnect source | Owner selects retain/purge and terms allow | Credentials revoke; history retains or purges by policy | Unknown provider outcome reconciles; no silent deletion |
| 39.04 | Import metric file | Supported parser and preview accepted | Claimed observations commit once with row/source provenance | Overlap/schema/metric conflict blocks or quarantines rows |
| 39.05 | Inspect metric | Authorized dashboard context | Value renders with source, coverage, gap, freshness and restatement | Insufficient coverage returns bounded/unknown, never estimate |
| 39.06 | Match external profile | Candidate evidence and entity authority | Confirmed unique subject binding appends | Collision/merge/split quarantines; contested binding blocked |
| 39.07 | Match catalog | External recording and corroborating evidence | Contributor-owned many-to-many binding appends | Fuzzy/ISRC-only candidate requires confirmation |
| 39.08 | Resolve conflict | Cleanup steward or scoped dispute route | Correct binding/alias or explicit unresolved remedy records | No response never silently awards claim |
| 39.09 | View dashboard | Person and authorized contexts | Set-union series render with per-series integrity labels | Partial source affects only dependent metric |
| 39.10 | Configure alert/digest | Recipient and permitted metric | Rule consumes domain noise budget and saves | Closed gate/sparse/private data cannot be scheduled |
| 39.11 | Render digest | Due rules and complete permission-scoped render | Answer plus provenance/freshness sends once | Any required render failure sends nothing |
| 39.12 | Share/export report | Step-up, field policy and snapshot/live choice | Expiring report carries all integrity labels | Provider terms redact/deny fields explicitly; cohorts excluded |
| 39.13 | View cohort comparison | B2 gate open and query meets approved floor | Pull-only anonymized stage/shape comparison renders | Below floor suppresses, never widens |
| 39.14 | View contribution catalog | Counter/self-claimed credits and source series | All records list; coverage precedes non-estimated aggregate | No-data remains visible unknown |
| 39.15 | Compare role slices | Normalized credit roles | Overlapping role totals and visible unroled bucket render | Slices state non-additivity; no inferred role |
| 39.16 | Publish performance proof | Counter-attested role credit, sufficient allowed coverage and provider terms | Role-scoped total proof version publishes | Import/self-claim/terms restriction blocks; later invalidation degrades |

## Contracts

| Contract | Producer → consumer | Required fields | Errors / invariants |
|---|---|---|---|
| `ExternalSourceConnectionV1` | Provider OAuth/file owner → ingestion | external entity ID, provider, scopes, capability/terms version, delegated readers | Grant ≠ ownership; one canonical connection per external entity |
| `MetricObservationV1` | Connector/import → metric store | source, external subject, metric definition, period, value, provenance, observed-at | Unique source observation key; claimed/observed distinct |
| `MetricRestatementV1` | Connector → metric store | prior observation, new value, provider reason, recorded-at | Additive; prior value never overwritten |
| `SeriesIntegrityV1` | Health engine → dashboards/reports | series, window, freshness, coverage, dominant loss, gaps, source membership | Unknown fails closed; no interpolation |
| `ImportPreviewV1` | Parser → user/commit | file checksum, adapter version, rows, overlaps, errors, metric definitions | Commit quotes exact preview/checksum |
| `ExternalProfileBindingV1` | Matcher → identity projection | provider external ID, subject, evidence class, state, revision | One confirmed subject; conflict blocks |
| `CatalogBindingV1` | Matcher/contributor → credit performance | external recording, internal recording, contributor owner, evidence | Many-to-many; contributor binding cannot be deleted by another contributor |
| `AnalyticsSeriesV1` | Source projections → dashboard | subject/context, metric definition, points, integrity labels | Truth/source labels immutable; no causal semantics |
| `ReportSnapshotV1` | Dashboard → share/export | immutable query, values, integrity/provenance, field policy, created-at | Cohorts excluded; expired/revoked resolves explicitly |
| `CreditPerformanceProjectionV1` | Credits + metrics → contributor | contributor, roles, records, coverage, totals, unknowns | Set union; streams never split/divided |
| `VerifiedPerformanceProofV1` | Proof service → listing/public projection | contributor, role, total, coverage, sources, derived-at, validity state | Counter-attested and allowed observed sources only; no catalog disclosure |

Commands carry acting party, mandate, expected revision, idempotency key and correlation ID. Provider timeouts become `unknown_reconciling`; retries reuse provider/source cursors. Public proof/share endpoints expose opaque IDs, are rate-limited and cannot enumerate hidden contributor/catalog relations.

## Data Models

| Entity | Key relationships and constraints |
|---|---|
| `source_connection` / `delegated_reader` | One provider external entity; encrypted token ref, capability/terms version and scoped readers |
| `sync_run` / `sync_cursor` | Scheduled attempt, source window, provider receipt, counts and terminal/actionable state |
| `metric_definition` / `metric_observation` | Typed unit/semantics and immutable source-period value/provenance |
| `metric_restatement` | Links old/new observation and provider reason; append-only |
| `series_integrity` / `source_gap` | Query-window coverage, dominant-loss, freshness, membership and gaps |
| `import_batch` / `import_row` | File checksum, adapter, preview/commit revision and permanent claimed provenance |
| `external_profile_binding` | Provider external ID, internal subject, evidence/state and conflict case |
| `catalog_binding` | External/internal recording pair, contributor owner, corroboration and lifecycle |
| `match_case` | Cleanup/contested/governance class, candidates, evidence, remedy and resolution |
| `dashboard_view` / `series_projection` | Person/entity context set, query and per-series integrity; disposable |
| `alert_rule` / `digest_run` | Recipient metric rule, noise-budget cost and permission-scoped immutable render |
| `report_snapshot` / `report_share` | Immutable result/provenance and expiring access policy/view state |
| `cohort_definition` / `cohort_result` | Stage/shape criteria and anonymous aggregate; physically gate-restricted under B2 |
| `contribution_performance` | Contributor-role-record set, unknowns, coverage and non-estimated totals |
| `performance_proof` | Role-scoped total, allowed source set, derivation version and active/degraded/revoked state |

PostgreSQL holds canonical observations and bindings; high-volume series may use partitioned tables/materialized projections under the same provenance model. Tokens/import files remain restricted. Every setting/policy version needed to recompute coverage/proof is retained. Disconnect purge removes provider-derived rows only when authority and terms allow, then re-derives dependent projections/proofs.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`source_connection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: One provider external entity; encrypted token ref, capability/terms version and scoped readers.
- **`delegated_reader`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: One provider external entity; encrypted token ref, capability/terms version and scoped readers.
- **`sync_run`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scheduled attempt, source window, provider receipt, counts and terminal/actionable state.
- **`sync_cursor`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scheduled attempt, source window, provider receipt, counts and terminal/actionable state.
- **`metric_definition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Typed unit/semantics and immutable source-period value/provenance.
- **`metric_observation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Typed unit/semantics and immutable source-period value/provenance.
- **`metric_restatement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Links old/new observation and provider reason; append-only.
- **`series_integrity`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Query-window coverage, dominant-loss, freshness, membership and gaps.
- **`source_gap`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Query-window coverage, dominant-loss, freshness, membership and gaps.
- **`import_batch`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: File checksum, adapter, preview/commit revision and permanent claimed provenance.
- **`import_row`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: File checksum, adapter, preview/commit revision and permanent claimed provenance.
- **`external_profile_binding`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Provider external ID, internal subject, evidence/state and conflict case.
- **`catalog_binding`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: External/internal recording pair, contributor owner, corroboration and lifecycle.
- **`match_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Cleanup/contested/governance class, candidates, evidence, remedy and resolution.
- **`dashboard_view`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person/entity context set, query and per-series integrity; disposable.
- **`series_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person/entity context set, query and per-series integrity; disposable.
- **`alert_rule`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recipient metric rule, noise-budget cost and permission-scoped immutable render.
- **`digest_run`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recipient metric rule, noise-budget cost and permission-scoped immutable render.
- **`report_snapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable result/provenance and expiring access policy/view state.
- **`report_share`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable result/provenance and expiring access policy/view state.
- **`cohort_definition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stage/shape criteria and anonymous aggregate; physically gate-restricted under B2.
- **`cohort_result`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stage/shape criteria and anonymous aggregate; physically gate-restricted under B2.
- **`contribution_performance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Contributor-role-record set, unknowns, coverage and non-estimated totals.
- **`performance_proof`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Role-scoped total, allowed source set, derivation version and active/degraded/revoked state.

## Access Control

| Actor | Allowed | Explicitly denied |
|---|---|---|
| Person/multi-hyphenate | View own credited/context-authorized series and manage own report shares | Read another person's private dashboard or hidden catalog |
| Entity owner | Connect/disconnect/purge source and delegate readers | Treat grant as external-profile ownership; delete another contributor's binding |
| Delegated reader | Read permitted entity series | Change connection ownership, purge history or publish proof without contributor authority |
| Contributor | Bind/dispute own credited recording relation and view own role performance | Expose another contributor's confidential credits |
| Operator | Consume authoritative venue/ticket projections under event mandate | Receive duplicate private artist dashboard or fan identities |
| Match steward | Resolve data-quality cleanup with scoped evidence | Adjudicate genuine authority dispute outside trust route |
| Support/admin | Purpose-bound provider/match/report case or dual-controlled settings | Lower integrity floor, fabricate match, remove provenance or open B2 alone |
| Service principal | One connector, projection or proof contract | Join cross-user data outside approved projection/gate |

RLS scopes connection/binding/report rows by subject/entity/contributor. Source purge, report export and proof publish require step-up. B2 gate and proof-source policy use dual control. Share recipient gets only snapshot fields; view tracking is anonymous aggregate by default, never named surveillance.

### Access Escalation

- **Person/multi-hyphenate:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Entity owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Delegated reader:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Match steward:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Support/admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Every chart has an equivalent table with metric definition, units, source, freshness, coverage and gap/restatement annotations.
- Missing periods render gaps, not connecting lines; nonvisual descriptions announce missing ranges and coverage before totals.
- Indexed-to-100 comparisons explain normalization and expose raw series separately; no dual-axis-only interpretation.
- Matching candidates expose evidence and conflict state in keyboard-operable review, never confidence by color alone.
- Import preview provides row/error summary, downloadable corrections and explicit commit; large tables support semantic pagination.
- Dashboard/report controls work at 320 CSS pixels, 200% zoom, reduced motion and high contrast; p95 normal-web target remains ≤2 seconds.
- Alerts/digests use descriptive subjects, complete answer text and the same integrity labels as dashboard.
- Role slices state that overlap prevents summing; unroled credits use visible labeled section.
- Proof and report links announce active/expired/revoked/degraded state and provide owner contact path rather than 404.
- Cohort insufficient-data state explains suppression without revealing count/floor-sensitive information.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `analytics.source.state_changed.v1` | connection, provider, old/new state, capability/terms version, reason | scheduler, dashboards |
| `analytics.metric.observed.v1` | observation, source, subject, metric, period, value, provenance | integrity, projections |
| `analytics.metric.restated.v1` | old/new observation, reason, recorded-at | integrity, reports, proof |
| `analytics.series.integrity_changed.v1` | series/window, coverage, freshness, gaps, policy version | dashboard, alerts, proof |
| `analytics.profile_binding.changed.v1` | provider external ID, subject, evidence/state, revision | ingestion, audit |
| `analytics.catalog_binding.changed.v1` | external/internal recording, contributor, evidence/state | credit performance |
| `analytics.report.snapshot_created.v1` | report, query checksum, provenance policy, expiry | share/export audit |
| `analytics.credit_performance.derived.v1` | contributor, roles, coverage, totals, unknown count, derivation version | dashboard, proof |
| `analytics.performance_proof.changed.v1` | proof, role, total, coverage, validity, reason | listing/public projection |

Events are at-least-once and versioned; consumers deduplicate by event/source observation key. Raw OAuth tokens, file rows, exact share secrets, private catalog and cross-user cohort membership never enter shared events.

## Edge Cases

- Two users connect credentials for one external entity: connection remains canonical; readers delegate without duplicated ingestion.
- Provider grant covers roster but no ownership: profiles remain unbound until matching evidence confirms each subject.
- Disconnect during sync: cursor stops, partial observations remain sourced, retain/purge decision reconciles after provider revoke.
- Provider terms forbid retention/share: capability policy blocks affected retention/export/proof and explains provider constraint.
- Daily provider batch arrives late: cadence jitter setting prevents premature gap while freshness remains honest.
- Source transiently fails forever: health cannot remain falsely healthy; policy escalates degraded to unknown/actionable after configured bound.
- Provider restates to zero: append restatement, flag suspected takedown and re-derive reports/proofs.
- Import overlaps observed data: preview identifies overlap; claimed row never replaces observed source or attested coverage.
- Same external profile claimed by two subjects: unique binding freezes and routes contested case; nobody wins by timeout.
- DSP profile merge/split: all dependent bindings quarantine; history remains attached to old external ID until reconfirmed.
- Same ISRC on distinct recordings: corroboration prevents automatic bind; fuzzy candidate stays unbound.
- Contributor disputes another's binding: cannot delete it; own binding/dispute state affects own projection only until resolved.
- Dashboard opens during projection rebuild: MVCC/read-version returns one consistent projection, never mixed totals.
- One source missing from multi-series comparison: only dependent series degrades; dashboard-level `fresh` is prohibited.
- Digest permission changes before send: render rechecks recipient scope; failure sends nothing.
- Shared snapshot later receives restatement: snapshot stays immutable with original provenance; owner may issue superseding snapshot.
- Cohort falls below B2 floor after deletion: result suppresses, never widens or retains stale comparison.
- Credit revoked after proof publication: proof degrades/revokes additively and public surface updates without exposing catalog.
- One record appears in two roles: career union counts once; both role slices include it and state overlap.
- External source offers no historical contributor data: record remains listed unknown and coverage truthfully caps total.
- Large export exceeds quota: asynchronous job is bounded/expiring and fails with retry plan, never strips provenance to shrink.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 39.01 Connect source | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.02 Sync source | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.03 Disconnect source | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.04 Import metric file | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.05 Inspect metric | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.06 Match external profile | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.07 Match catalog | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.08 Resolve conflict | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.09 View dashboard | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.10 Configure alert/digest | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.11 Render digest | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.12 Share/export report | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.13 View cohort comparison | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.14 View contribution catalog | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.15 Compare role slices | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 39.16 Publish performance proof | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/01-identity-authority|Shard 01]], [[specs/ia/07-credits-core|Shard 07]], [[specs/ia/22-release-distribution|Shard 22]], [[specs/ia/35-ticket-products-sales|Shard 35]], [[specs/ia/38-promotion-marketing|Shard 38]]
- **Depended on by:** [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
- **Deep dive:** [[specs/ia/deep-dives/39-analytics-ingestion-reporting|Deep Dive 39 — Analytics ingestion, matching and reporting]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 07:** consume [Shard 07 Contracts](07-credits-core.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 07 Event Schemas](07-credits-core.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 22:** consume [Shard 22 Contracts](22-release-distribution.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 22 Event Schemas](22-release-distribution.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 35:** consume [Shard 35 Contracts](35-ticket-products-sales.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 35 Event Schemas](35-ticket-products-sales.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 38:** consume [Shard 38 Contracts](38-promotion-marketing.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 38 Event Schemas](38-promotion-marketing.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 40 — Market intelligence, fraud and scouting signals:** consume [Shard 40 — Market intelligence, fraud and scouting signals Contracts](40-market-intelligence-signals.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 40 — Market intelligence, fraud and scouting signals Event Schemas](40-market-intelligence-signals.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Locked provenance-preserving ingestion, matching, reporting and credit-performance proof | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/deep-dives/39-analytics-ingestion-reporting|Deep Dive 39 — Analytics ingestion, matching and reporting]]
