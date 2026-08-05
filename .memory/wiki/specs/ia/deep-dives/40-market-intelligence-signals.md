# Deep Dive 40 — Market intelligence, fraud and scouting signals

**Status:** Complete
**Parent:** [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
**Surface:** Responsive web/PWA

## Overview

This deep dive fixes event ordering, privacy-floor enforcement, descriptive inference, non-accusatory evidence and consent-at-use scouting. Intelligence projections are disposable interpretations over sourced observations; they never become identity, rights, guilt or prediction facts.

### Convergence Findings

| Pass | Finding | Resolution |
|---|---|---|
| Cross-section | Placement/chart facts and quality interpretations have different stability | Immutable observations plus replaceable policy-versioned projections |
| What-if | Sparse geography becomes identifying after drill-down/repeated queries | B2 gate closed; future enforcement applies to query family and cached derivatives |
| What-if | Revocation races queued watch signal | Consent re-evaluated at database query and dispatch/fire time |
| Adversarial | Vendor signal trains fraud detector and confirms itself | One-way detector outcome → vendor coincidence; no reverse feature/input |
| Adversarial | Scout enumerates through filters/timing | Consent inside query, capped result set, no deep cursor, invariant empty response |
| Adversarial | Platform converts anomaly into accusation | Schema has observation/confidence/limits only and no guilty/fraud verdict |
| Operations | Expensive analyses exceed p95 | Serve last complete labeled projection; asynchronous rebuild swaps atomically |

## Interactions

### Placement and Chart Streams

1. Shard 39 emits integrity-qualified provider observation with provider period and source sequence.
2. Placement reducer compares prior current state and appends added/moved/removed event; follower/reach snapshots at that event.
3. Quality evaluator computes evidence bands before alert eligibility and stores policy/source version.
4. Alert renders placement fact plus risk/unknown first. Provider restatement appends correction and re-derives state.
5. Chart adapter stores source methodology and chart period. Separate source observations coexist even when conflicting.
6. Empty chart/placement state remains neutral and distinguishes no observed event from unavailable source.

### Geography, Routing and Show Impact

1. Geography builder consumes separate source layers and coarse normalized region keys; it never sums/averages different source definitions.
2. Fraud-excluded series applies once upstream of every map/routing consumer.
3. Privacy policy evaluates cell and full query family before projection. While B2 closed, cross-artist/operator outputs do not exist.
4. Routing scorer orders evidence by policy: prior booking result, owned audience, engagement depth, rented reach, then advisory context.
5. Each candidate lists observed support, uncertainty and missing travel/venue/business constraints; no route optimization occurs.
6. Show-impact method admits only first-party booked show with usable pre/post windows and sufficient integrity.
7. Confounder rules produce range, null or declined state. No analysis runs when release/promo/other show effects dominate.

### Anomaly and Vendor Evidence

1. Detector receives immutable integrity-labeled series and approved descriptive rule version.
2. Crossing creates observation with facts, baseline, unusual dimensions, confidence and limitations; language template forbids accusation.
3. Early warning may be low-confidence but names uncertainty. `Clear` creates no user badge or reassurance.
4. Artist may add context/evidence and export dossier; only explicit artist share routes case to trust/support.
5. Platform never transmits dossier to external DSP/distributor automatically.
6. Vendor projection links only structured promotion engagements to later anomaly observations and shows n/range.
7. Retraction or invalidated observation decrements projection additively. Vendor result never enters detector input or threshold.

### Consent-Scoped Scouting

1. Subject appends purpose-specific visibility instruction; minors cannot grant while gate closed.
2. Search function accepts scout mandate/purpose/query and joins only current allowed subjects before ranking/counting.
3. Credit-native ranking uses permitted credit/role facts; metric predicates require separately approved purpose and integrity.
4. Function returns fixed capped set with no cursor past cap and invariant empty envelope.
5. Watch creation re-evaluates same purpose consent and stores opaque subject reference only.
6. Watch reads resolve live subject projection; no snapshot survives withdrawal.
7. Momentum detector may create private candidate, but dispatcher rechecks consent at fire time.
8. Withdrawal invalidates search index, active watch projection and pending signal atomically; scout sees tombstone with no cause.

## Contracts

### Command Results

| Command | Success | Stable refusal / recovery |
|---|---|---|
| `AppendPlacementTransition` | `{eventId, currentState, qualityState}` | `source_unqualified`, `sequence_conflict`, `duplicate` |
| `RecordChartObservation` | `{observationId, source, period}` | `methodology_missing`, `source_unqualified` |
| `BuildAudienceGeoProjection` | `{projectionId, layers, privacyVersion}` | `b2_gate_closed`, `integrity_insufficient`, `privacy_suppressed` |
| `GenerateRoutingShortlist` | `{candidates, evidenceVersion}` | `facts_insufficient`, `privacy_suppressed`; never returns invented plan |
| `DeriveShowImpact` | `{analysisId, state, range, confounders}` | `not_first_party`, `declined_confounding`, `integrity_insufficient` |
| `RecordAnomalyObservation` | `{caseId, observationId, confidence}` | `rule_unavailable`, `source_unqualified`; no fraud verdict |
| `ExportAnomalyDossier` | `{jobId, expiresAt, formatVersion}` | `step_up_required`, `case_denied`, `export_in_progress` |
| `BuildVendorCoincidence` | `{projectionId, n, range, state}` | `below_floor`, `linkage_insufficient`, `b2_gate_closed` when shared |
| `SearchScoutingDiscovery` | `{results, capReached}` | Invariant empty success for denied/no-match/suppressed subject causes |
| `CreateScoutWatch` | `{watchId, purpose}` | Invariant unavailable for absent/denied subject; no existence leak |
| `DispatchMomentumSignal` | `{signalId, state}` | Revoked/denied is recorded privately as suppressed and externally indistinguishable from quiet |

### Capability Gates

| Gate | Closed behavior | Activation evidence |
|---|---|---|
| `shared_geo_intelligence` | Artist-private own layers only; no operator/cross-artist map | B2 floor, lawful basis, coarse-cell policy, anti-differencing tests |
| `shared_curator_vendor_metrics` | Public source facts/private campaign history only; no shared score/rate | B2 floor, defamation/privacy review, retraction/dispute process |
| `scouting_discovery` | No search/watch/signal index | Purpose-specific consent UX, subject controls, abuse monitoring and product approval |
| `minor_scouting` | Minor excluded from index/watch/signal regardless instruction | Counsel-approved age assurance/safeguarding and evolved architecture |
| `metric_scouting` | Credit-native search only | Consent purpose, B2 policy, explainability and anti-ranking-harm review |

All gates default deny in server functions, RLS and projection build. UI flags cannot open them. Privacy floor is applied before counts, ranking, cache keys and timing-visible work.

### Cross-Shard Contracts

- [[specs/ia/39-analytics-ingestion-reporting|Shard 39]] supplies immutable observations, integrity labels, match bindings and truth provenance; Shard 40 cannot strengthen them.
- [[specs/ia/06-trust-safety|Shard 06]] receives a case only after authorized human share/escalation and owns evidence/dispute handling; Shard 40 retains no guilt verdict.
- [[specs/ia/00-infrastructure|Shard 00]] owns queues, atomic projection swap, privacy-safe rate limits and notification primitives; Shard 40 owns intelligence rules.
- [[specs/ia/42-career-planning-risk|Shard 42]] may consume advisory market evidence but cannot convert shortlist/anomaly into guaranteed plan or legal fact.

## Data Models

### State Machines

| Aggregate | States |
|---|---|
| Placement | Derived `absent/present/removed`; immutable transition history and separate quality projection |
| Quality | `unknown/neutral/positive/risk_context`; policy replacement never edits event |
| Show impact | `queued → derived_range/derived_null/declined/failed` |
| Anomaly case | `open_observed → contextualized → exported/shared → retracted/closed`; no guilty/clear state |
| Vendor projection | `insufficient/private_available/retracted`; shared state requires gate |
| Watch | `active → access_revoked/tombstoned/removed`; subject projection not retained after revoke |
| Signal | `candidate → consent_checked → dispatched/suppressed/expired` |

### Invariants

| Model | Invariant |
|---|---|
| Placement event | Event-period source facts immutable; live reach never rewrites history |
| Chart observation | Unique source/chart/subject/period; conflicting sources coexist |
| Geo observation | One source semantic per value; owned/rented layers cannot aggregate into one metric |
| Routing candidate | Contains evidence and missing inputs; no itinerary/booking command relation |
| Show impact | Range/null/declined required; causal headline field absent |
| Anomaly observation | Facts/confidence/limits required; accusation/intent/verdict fields absent |
| Vendor coincidence | Detector cannot consume it; retraction delta monotonic |
| Watch reference | No copied subject metric/profile; purpose required |
| Discovery result | Result set capped and ephemeral; no unrestricted export/pagination |

Exact fan geo, watch membership, query result lists and consent evidence are restricted. Query audits retain purpose/query class/abuse outcome, not long-lived subject results. Public curator facts honor source removal/correction. Dossiers and anomaly cases retain under approved evidence schedule.

## Access Control

| Action | Predicate |
|---|---|
| View artist intelligence | Self or active entity analytics mandate for named subject |
| View operator aggregate | Event/market mandate + open B2 gate + approved query floor |
| Export dossier | Subject/entity authority + step-up; sharing remains explicit |
| Read vendor history | Entity participated in linked campaign; shared view gate separately open |
| Search scouting | Scout organization mandate + approved purpose + open capability gate |
| Watch subject | Search-authorized subject and same purpose consent at write/read |
| Fire signal | Watch active + purpose consent at fire + source integrity + noise budget |
| Change policy/gate | Dual-controlled platform role; subject consent never overrideable |

Security-definer functions use fixed query shapes and bounded result counts. No raw subject-ID lookup is exposed to scouts. Support grants are case-scoped/expiring. Administrator cannot reveal why subject is absent or cache revoked result.

## Accessibility

- Risk and uncertainty precede positive placement/reach in DOM order.
- Timeline/map/chart surfaces provide equivalent tables and text summaries with source, period, sample, confidence and gaps.
- Geography list separates owned/rented layers and supports keyboard navigation without map.
- Shortlist names missing constraints and advisory status before rank/reason.
- Null/declined show-impact results use neutral language and no failure styling.
- Anomaly dossier uses descriptive facts, defined terms, accessible tables and no alarming motion/color-only severity.
- Search empty states are identical and do not disclose consent/minor/privacy causes to any assistive technology path.
- Watch tombstone explains access ended without subject data; focus and list position remain stable.
- Cached complete projections and explicit freshness preserve p95 ≤2 seconds without partial-state deception.

## Event Schemas

### Ordering and Idempotency

| Stream | Rule |
|---|---|
| Playlist | Provider subject/playlist sequence; corrections append and reducer derives current state |
| Chart | Source/chart/period key; restatement adds new source version |
| Geo/routing | Projection build version swaps atomically after privacy/integrity evaluation |
| Anomaly | Case sequence; retraction cannot be overwritten by older observation |
| Scouting visibility | Subject/purpose ledger version invalidates index/watch/signal synchronously via outbox |
| Momentum | Candidate ID dedupes; dispatch quotes current consent version |

Envelope includes event/schema/aggregate IDs and versions, occurred/recorded time, correlation, causation and producer. Shared events exclude exact location, fan identity, watch/scout identity, hidden consent state, private metrics and accusation labels.

## Edge Cases

| Scenario | Required outcome |
|---|---|
| Provider backfills old playlist add | Event uses provider period and records late ingestion; no false current alert |
| Playlist removed before quality finishes | Current state removed; quality remains historical context, no celebratory alert |
| Chart method changes | New methodology/version displayed; historical observations not normalized silently |
| Curator becomes private individual | Shared profile withdraws/tombstones; institutional history remains without person name |
| Geo query differs by one artist | Query-family floor/anti-differencing blocks both when B2 opens |
| Venue offers payment for routing rank | Factor schema has no payment/sponsorship field; attempt audited/refused |
| Show window has release and viral event | Analysis declines and names confounders, not low-confidence causal result |
| Early anomaly later normalizes | Retraction appends, dossier updates and vendor coincidence decrements |
| Vendor changes name | Provenance links legal/provider identity where lawful; name alone never merges/splits risk history |
| Artist shares dossier with platform | Creates scoped trust case; still no automatic external report |
| Scout changes purpose after query | New purpose triggers fresh consent query; prior results not reusable |
| Subject revokes during watch page load | Read returns tombstone, not cached profile or reason |
| Consent outage timing differs | Response padding/invariant envelope prevents existence inference |
| Signal candidate generated pre-revocation | Fire-time check suppresses and purges payload beyond minimal audit |
| Minor ages into eligibility | Fresh affirmative purpose instruction required; no automatic index entry |

## Verification

- **Two-implementer check:** observations, projections, states, query gates, refusals and revocation races are explicit.
- **Devil's-advocate check:** sparse differencing, paid routing, anomaly accusation, auto-report, vendor feedback loop, watch snapshots and scout enumeration are blocked.
- **Bidirectional dependency check:** infrastructure, safety, analytics and career consumers have explicit ownership boundaries.
- **Complexity check:** below 400-line pass threshold; no split required.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [40-market-intelligence-signals § Contracts](../40-market-intelligence-signals.md#contracts) defines commands/queries and [40-market-intelligence-signals § Event Schemas](../40-market-intelligence-signals.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Locked privacy-safe intelligence, anomaly evidence and consent-scoped scouting state | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]
