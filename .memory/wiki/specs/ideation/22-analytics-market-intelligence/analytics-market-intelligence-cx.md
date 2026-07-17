# Analytics & Market Intelligence — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Analytics & Market Intelligence](./analytics-market-intelligence-index.md)
> **Status**: [BREADTH] — 8 sub-domains classified; intra-domain CX mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [22.01 Ingestion](./22.01-source-connections-ingestion/22.01-source-connections-ingestion-index.md) | [22.02 Matching](./22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md) | Ingestion delivers numbers bound to foreign identifiers; matching gives them an owner. Unmatched data is a fact about a stranger | Musician, Producer | High | A DSP grant proves read access, not ownership (22.02 D-01) |
| CX-02 | [22.02 Matching](./22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md) | [22.08 Credit-Linked Performance](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | **The domain's load-bearing edge**: 22.08's coverage depends on matching via the credit graph, not via a claimed artist profile | Musician, Producer | High | 22.02.02 DT-03 / D-04 — without credit-native matching, 22.08 serves only artists and fails the session player it exists for |
| CX-03 | [22.01.03 Ingestion Health](./22.01-source-connections-ingestion/22.01.03-ingestion-health-gaps-freshness.md) | [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) · [22.08](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | Honesty annotation reaches every render. The widest internal dependency in the domain | Musician, Producer, Operator | High | 22.01.03 DT-02 — a gap silently shrinks a career, then 22.08.03 exports it as proof |
| CX-04 | [22.06 Fraud Detection](./22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md) | [22.03 Playlist Tracking](./22.03-playlist-chart-tracking/22.03-playlist-chart-tracking-index.md) · [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) · [22.07 Scouting](./22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-index.md) | **Gate on the celebration path**: fraud's signature is a placement win, a stream spike and a breakout signal | Musician, Producer | High | 22.06.01 DT-03; 22.03.01 DT-03; 22.07.02 DT-03 — three features independently hit this |
| CX-05 | [22.06 Fraud Detection](./22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md) | [22.04.01 Geography Map](./22.04-audience-geography-routing-insight/22.04.01-audience-geography-map.md) | Flagged streams excluded **at the map**, once — or bots route real tours to fake demand | Musician | High | 22.04.01 DT-03(a); D-04 — one filter, one truth |
| CX-06 | [22.04 Routing Insight](./22.04-audience-geography-routing-insight/22.04-audience-geography-routing-insight-index.md) | [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) | Geography and show impact render inside the unified timeline; routing is the action the dashboard cannot itself produce | Musician, Operator | Medium | The dashboard is the frame; 22.04 is one of two things worth putting in it |
| CX-07 | [22.05.04 Benchmarking](./22.05-cross-source-dashboard-reporting/22.05.04-peer-benchmarking-cohort-comparison.md) | [22.07.03 Scouting Search](./22.07-ar-scouting-watchlists/22.07.03-scouting-discovery-search.md) | **Shared computation that must stay apart**: comparable-artist matching serves both — anonymised/inward vs identified/outward | Musician, Producer | High | `22.07-ar-scouting-watchlists-cx.md#R-01` — wiring them enables an aggregation attack on the k-anonymity floor |
| CX-08 | [22.08 Credit-Linked Performance](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | [22.05.04 Benchmarking](./22.05-cross-source-dashboard-reporting/22.05.04-peer-benchmarking-cohort-comparison.md) | The credit-graph cohort ("drummers with comparable credit graphs") is the only benchmark serving the primary persona — and it consumes 22.08's rollup | Musician | Medium | 22.05.04 DT-03; possible re-parenting, 22.05.04 Q-04 |
| CX-09 | [22.03.01 Placement Tracking](./22.03-playlist-chart-tracking/22.03.01-playlist-placement-tracking.md) | [22.04.01 Geography Map](./22.04-audience-geography-routing-insight/22.04.01-audience-geography-map.md) | An algorithmic placement can shift geography (a track breaks in a territory because a local playlist added it) | Musician | Low | Deferred to this level from `22.04-audience-geography-routing-insight-cx.md#R-01`. Most geographic shifts have no placement behind them |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-02: Matching ↔ Credit-Linked Performance

**Relationship**: The domain's most consequential internal edge. 22.08 rolls up performance across
records the Musician **does not control and cannot connect a DSP for** — a session drummer has no
grant on someone else's release. So coverage depends entirely on 22.02.02 being able to match
recordings via the **counter-attested credit graph** rather than downward from a claimed artist
profile. If matching only works profile-first, 22.08 serves artists and fails the exact persona the
platform is built for (D-19's multi-hyphenate).

**Role scoping**:
- **Musician**: the whole point. Their scattered session work becomes a catalog, or it doesn't.
- **Producer**: same, at larger scale — a 200-record back catalog spanning defunct distributors.
- **Operator**: not affected — no credits, no catalog.
- **Fan**: sees only the published total (22.08.03), never the catalog.

**Synthesis questions answered**:
1. **Shared state conflict**: 22.02 owns matches; 22.08 reads them. Single writer, no merge.
2. **Trigger chain**: credit (domain 02) → catalog match (22.02.02) → rollup (22.08.01) → proof (22.08.03). **A revoked match cascades the whole chain and must invalidate a published commercial claim.** Silent orphaning at any link leaves a false public assertion standing under WeJammin's brand.
3. **Permission intersection**: the credit *is* the permission (`22.08-credit-linked-performance-cx.md#CX-01` Q3). Domain 02's attestation model is this domain's access control — a bug there is a data leak here.
4. **Notification fan-out**: a record you played on breaking out is worth telling you; subject to 22.05.02's noise budget and CX-04's fraud gate.
5. **State transition conflict**: covered in `22.02-external-identity-catalog-matching-cx.md#CX-01`.

### CX-03: Ingestion Health ↔ Dashboard & Credit-Linked Performance

**Relationship**: The widest internal dependency in domain 22. Every chart, digest, share, export and
proof carries 22.01.03's honesty annotation. This is one-way derivation — health writes nothing — but
its absence at any render point creates a confident lie at exactly the place someone acts on it.

**Role scoping**:
- **Musician**: gaps annotate the numbers they read and the proof they publish.
- **Producer**: a gap in a client deliverable is a professional embarrassment discovered by the client.
- **Operator**: sees freshness on the market data they route/book on.
- **Fan**: never sees a gap — sees a value or nothing (22.01.03 Role Lens).

**Synthesis questions answered**:
1. **Shared state conflict**: none. Derived, recomputable, single-writer.
2. **Trigger chain**: attempt outcome → health state → annotation on every consumer. If annotation fails, the number must be suppressed rather than rendered bare — failing open here means rendering an unlabelled lie.
3. **Permission intersection**: a delegated viewer can see a broken connection they cannot fix (`22.01-source-connections-ingestion-cx.md#CX-01` Q3).
4. **Notification fan-out**: broken connections notify; transient failures never do (22.01.02 D-01).
5. **State transition conflict**: restatements race with renders. Snapshot-at-render; disclose the restatement (22.01.03 D-04).

### CX-04: Fraud Detection → the celebration path

**Relationship**: Not a data flow — a **gate**, and the domain's most important structural constraint.
Artificial streaming's signature *is* success: a burst of playlist adds (22.03.01 wants to alert), a
stream spike (22.05.01 wants to render), a breakout signal (22.07.02 wants to broadcast to third
parties). Each feature is individually correct and collectively catastrophic without this gate — the
platform congratulates a user on the event that is about to remove their catalog, and tells other
people about it.

**Role scoping**:
- **Musician**: the victim, usually unknowingly — they bought a "playlist promotion" package.
- **Producer**: their record gets taken down; their credit and client relationship suffer.
- **Operator / Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: none — 22.06 flags; consumers read the flag.
2. **Trigger chain**: ingestion → fraud classification → **then** alerting/rendering/signalling. Order is the design. If classification fails, the safe default is to withhold celebration, not to celebrate unclassified data.
3. **Permission intersection**: 22.07.02 is the sharp case — an ungated signal tells a *third party* that someone is breaking out on fake numbers, manufacturing reputational harm out of our own unfiltered data.
4. **Notification fan-out**: fraud warnings outrank positive alerts and positive numbers (22.05.01 D-03).
5. **State transition conflict**: a spike alerted, then flagged hours later. Retraction must reach the user who was congratulated. `[PENDING — /ideate-discover Step 5 deepening]`.

### CX-07: Benchmarking ↔ Scouting Search

**Relationship**: One computation, two consumers, and they must **not** be wired together.
"Artists comparable to X" powers both 22.05.04's anonymised inward cohort and 22.07.03's identified
outward search. Connecting them lets the cohort be de-anonymised by cross-referencing against search —
a textbook aggregation attack that silently breaks the k-anonymity floor 22.05.04 D-03 depends on.

**Role scoping**: Musician and Producer are on **both sides** — the subject of one and the user of the
other, which is exactly why the separation matters. Operator and Fan: no access to either.

**Synthesis questions answered**:
1. **Shared state conflict**: the comparable-artist mechanism is shared **code**, not shared state. It must never become a shared *index*.
2. **Trigger chain**: none — both are read paths.
3. **Permission intersection**: the entire concern. Inward is anonymised and consent-free (your own data against a distribution); outward is identified and consent-gated (22.07.04).
4. **Notification fan-out**: none. Benchmark alerts are rejected on values grounds (`22.05-cross-source-dashboard-reporting-cx.md#R-01`).
5. **State transition conflict**: none.

### CX-01, CX-05, CX-06, CX-08, CX-09

`[PENDING — /ideate-discover Step 5 deepening]` for full synthesis. CX-01 and CX-05 are High
confidence and their commitments are already recorded as decisions in the child files (22.02 D-01;
22.04.01 D-04 — flagged streams excluded once, at the map, so every consumer inherits one correction
rather than duplicating the filter). CX-06, CX-08 and CX-09 are Medium/Low and synthesis is deferred
per the CX template's rule.

---

## Cross-Cut Mechanisms Identified — for the global CX file

> Discovered while drilling domain 22. These are **mechanisms serving many domains**, not nodes in
> this domain. Recorded here and returned for `ideation-cx.md` to absorb.

| Mechanism | Serves | Why it is a cross-cut, not a node |
|---|---|---|
| **Notification & Alert Delivery** | All 24 | 22.05.02 decides *what* is worth saying; channels, preferences, quiet hours and the **cross-domain noise budget** are platform-wide. 22.05.02 Q-03 is sharp: a per-domain budget is useless if every domain independently spends the same user's tolerance. |
| **Canonical Work/Recording Identifier Registry** (ISRC/ISWC/UPC) | 02, 09, 10, 11, 12, 22 | 12 mints identifiers; 10 matches statements; 22 matches analytics. Owning it in 22 would fork the platform's identity of a recording. 22 consumes it (22.02 D-02). |
| **External Account Connection & OAuth Token Lifecycle** | 12, 20, 21, 22 | Distributor connections, D2F socials, ad platforms and analytics all grant, refresh, break and revoke identically. The *connection* is product per-domain; the token lifecycle machine is one thing. |
| **Purpose-Scoped Discoverability Consent** | 03, 04, 05, 20, 22 | 22.07.04 DT-03 — findable-for-hire (05) ≠ watchable-for-evaluation (22.07) ≠ contactable (03/04). A global "discoverable" flag either breaks livelihoods or launders consent. Domain 22 cannot own this alone. See 22.07.04 Q-04. |
| **Per-Domain Reporting & Instrumentation** | All 24 | The domain index's own founding distinction: vendor sales, box office and profile views are each domain's own reporting; domain 22 owns **external** ingestion, normalisation and cross-source correlation. Recorded to keep the boundary from eroding during drilling. |
| **Anonymised Cohort Construction & k-Anonymity Floor** | 05, 16, 22, 23 | 22.04.01 D-05 and 22.05.04 D-03 independently require the same floor for different data. Two floors for one mechanism would be an incoherence — a benchmark, a venue market view and a rate guide are the same privacy question three times. |
| **Playlist Quality / Bot Classification** | 21, 22 | Serves 22.03.03 (curator intelligence), 22.06.02 (vendor scoring) and 21's pitching. `22.06-streaming-fraud-detection-cx.md#R-02` — one classifier, several consumers; duplicating it lets the copies disagree. |

## Not-Product Concerns Identified — for `/create-prd`

| Concern | Routed to | Why |
|---|---|---|
| Time-series metrics store, retention, restatement history | `/create-prd-architecture` | Architecture. 22.01.03 Q-02 asks how much restatement history to keep — a storage/integrity trade-off, not a product decision. |
| Ingestion scheduler, queue, rate-limit budgeting, backfill orchestration | `/create-prd-architecture` | Infrastructure. The *connection* is product (22.01 D-03); the machine underneath is not. |
| Anomaly-detection model hosting and training | `/create-prd-architecture` | Infrastructure for 22.06. |
| **DSP data licensing & terms compliance** | `/create-prd-security` | The domain's existential legal constraint, hit independently by 22.01 Q-02, 22.05 Q-01 and 22.08.03 Q-03. Storage, redistribution to third parties, bulk export and commercial display may each be forbidden. |
| Profiling non-users (curators, promo vendors) under GDPR | `/create-prd-security` | 22.03.03 DT-02, 22.06.02 DT-02. We would rate people and businesses who are not our users and never consented. Legitimate interest, right to object, defamation. |
| Chart data licensing | `/create-prd-stack` | 22.03 Q-02. A cost floor before a user. |
| Playlist index: build / license / narrow | `/create-prd-stack` | 22.03 Q-01. A strategic fork, not a build detail — building competes on the incumbents' moat rather than ours (22.03.03 DT-01). |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 22.03 Playlist & Chart Tracking | 22.08 Credit-Linked Performance | Rejected: a credited contributor arguably inherits a chart/playlist credential ("I played on a top-40 record") — see 22.03.02 Q-03 — but that is a **proof-content question** owned by 22.08.03, not an interaction between sub-domains. 22.03 observes placements; 22.08 decides what may be asserted. Wiring them would put proof rules in two places, and proof rules are the one thing in this domain that must never be duplicated. |
| R-02 | 22.04 Geography & Routing | 22.08 Credit-Linked Performance | Rejected: no relationship. A session player's contribution catalog has no geography worth acting on — they are not touring on someone else's record. The temptation is symmetry ("everything should have a map"); the honest answer is that a drummer's credited catalog performing in Brazil is trivia, not an action. |
| R-03 | 22.06 Fraud Detection | 22.02 Matching | Rejected: fraud concerns the *numbers* attached to a correct match; matching concerns *whose* numbers they are. Conflating them would put "we disagree about who this is" and "these streams look fake" in one bucket — the same category error `22.02-external-identity-catalog-matching-cx.md#R-02` rejects between conflicts and gaps. Three distinct epistemic states (unknown, contested, suspect) must stay distinct, because each has a different remedy. |
| R-04 | 22.07 Scouting | 22.01 Ingestion | Rejected: scouting reads the same ingested data but has no relationship to connection lifecycle. A scout connects nothing — the *subject's* connections supply the data. Recorded because it looks like a dependency and is merely shared substrate; modelling it would imply scouts have standing over subjects' connections, the exact inversion 22.07.04 exists to prevent. |
| R-05 | 22.05.04 Benchmarking | 22.04 Geography & Routing | Rejected as a pair despite both needing cohorts: "artists like me" (benchmarking) and "artists with a following near here" (the Operator's market view) share the **k-anonymity mechanism**, not an interaction. Recorded above as a cross-cut mechanism instead. Wiring them would let a venue's market view be cross-referenced against a benchmark cohort — a second aggregation attack alongside CX-07's. |
