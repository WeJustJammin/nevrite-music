# Analytics & Market Intelligence — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Analytics & Market Intelligence](./analytics-market-intelligence-index.md)
> **Status**: [DEEP] — 8 sub-domains; intra-domain CX synthesised, all High-confidence edges answered.
> **Last updated**: 2026-07-18

This domain is a pipeline with a moral spine. Data flows one way — ingest (22.01) → bind an owner
(22.02) → render/correlate (22.05) → act (22.04 route, 22.08 prove) — and three constraints run
crosswise through every stage: **honesty travels with every number** (D-05), **fraud gates the
celebration path** (D-06), and **the recommendation surface is never monetised** (D-07). Most of the
cross-cuts below are one of those three constraints appearing at a specific seam.

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [22.01 Ingestion](./22.01-source-connections-ingestion/22.01-source-connections-ingestion-index.md) | [22.02 Matching](./22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md) | Ingestion delivers numbers bound to a foreign identifier; matching binds them to an owner. External ID (not the handle) is the join key | Musician, Producer | High | A DSP grant proves read access, not ownership (22.02 D-01); handle/rename breaks naive matching (22.01.02) |
| CX-02 | [22.02 Matching](./22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md) | [22.08 Credit-Linked Performance](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | **The domain's load-bearing edge**: 22.08 rolls up performance via credit-graph matching, not a claimed artist profile; the evidence tier set at match time is the proof floor; an unworked cleanup queue silently caps rollup coverage | Musician, Producer | High | 22.02.02 DT-03 / D-04; evidence-tier floor (22.02.01 → 22.08.03); 22.02.03 → rollup coverage |
| CX-03 | [22.01.03 Ingestion Health](./22.01-source-connections-ingestion/22.01.03-ingestion-health-gaps-freshness.md) | [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) · [22.08](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | **Widest internal dependency**: honesty annotation (gaps/estimates/restatements/freshness) reaches every chart, digest, share, export and proof; the Coverage Rule gates whether a proof may claim "verified" or must downgrade | Musician, Producer, Operator | High | 22.01.03 DT-02; 22.05.01 → 22.01.03; 22.08.01 → 22.01.03 (stale not silent shrink) |
| CX-04 | [22.06 Fraud Detection](./22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md) | [22.03 Playlist](./22.03-playlist-chart-tracking/22.03-playlist-chart-tracking-index.md) · [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) · [22.07 Scouting](./22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-index.md) | **Gate on the celebration path**: fraud's signature is a placement win, a stream spike, a breakout signal. Classify before any alert/render/signal fires | Musician, Producer | High | 22.06.01 DT-03; 22.03.01 DT-03; 22.07.02 DT-03; 22.05.01 (fraud outranks the numeric win) |
| CX-05 | [22.06 Fraud Detection](./22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md) | [22.04.01 Geography Map](./22.04-audience-geography-routing-insight/22.04.01-audience-geography-map.md) | Flagged streams excluded **at the map**, once — or bots route real tours to fake demand | Musician | High | 22.04.01 DT-03(a); D-04 — one filter, one truth |
| CX-06 | [22.02 Matching](./22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md) | [22.05.03 Sharing & Export](./22.05-cross-source-dashboard-reporting/22.05.03-report-sharing-export.md) | **Invalidation fan-out**: a contested or revoked match suspends the affected numbers *inside already-shared live reports* to "unknown" and notifies holders — viewer sees the same suspension as owner | Musician, Producer | High | 22.02.02 → 22.05.03; 22.02.03 → 22.05.03 (suspend, don't serve stale) |
| CX-07 | [22.05.04 Benchmarking](./22.05-cross-source-dashboard-reporting/22.05.04-peer-benchmarking-cohort-comparison.md) | [22.07.03 Scouting Search](./22.07-ar-scouting-watchlists/22.07.03-scouting-discovery-search.md) | **Shared computation that must stay apart**: comparable-artist matching serves both — anonymised/inward vs identified/outward. Wiring them enables an aggregation attack on the k-anonymity floor | Musician, Producer | High | `22.07-ar-scouting-watchlists-cx.md#R-01` |
| CX-08 | [22.01.02 Social Ingestion](./22.01-source-connections-ingestion/22.01.02-social-analytics-ingestion.md) | [22.05.01 Unified Dashboard](./22.05-cross-source-dashboard-reporting/22.05.01-unified-performance-dashboard.md) · [22.05.02 Alerts](./22.05-cross-source-dashboard-reporting/22.05.02-alerts-digests.md) | Social series sit on one axis with streams — **the correlation that is the domain thesis**; the silence-on-transient rule exists to protect this surface's alert budget | Musician, Producer, Operator | High | 22.01.02 → 22.05.01; 22.01.02 D-01 (only actionable/terminal failures alert) |
| CX-09 | [22.03.01 Placement Tracking](./22.03-playlist-chart-tracking/22.03.01-playlist-placement-tracking.md) | [22.05.02 Alerts & Digests](./22.05-cross-source-dashboard-reporting/22.05.02-alerts-digests.md) | Playlist add/removal and chart entry are the domain's **highest-value alerts** — but alert firing is gated on CX-04's fraud classification and on placement class | Musician, Producer | High | 22.03.01 → 22.05.02; 22.05.02 → 22.03.01 (never celebrate a bot-playlist add) |
| CX-10 | [22.03.01 Placement Tracking](./22.03-playlist-chart-tracking/22.03.01-playlist-placement-tracking.md) | [22.02.02 Catalog Matching](./22.02-external-identity-catalog-matching/22.02.02-recording-release-catalog-matching.md) | Placements attach to **matched recording entities**; the same track on two ISRCs merges at the catalog entity so placements combine | Musician, Producer | Medium | 22.03.01 → 22.02.02 |
| CX-11 | [22.04 Routing Insight](./22.04-audience-geography-routing-insight/22.04-audience-geography-routing-insight-index.md) | [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) | Geography and show impact render inside the unified timeline; routing is the action the dashboard cannot itself produce | Musician, Operator | Medium | 22.04 is one of two things (with 22.08) worth putting in the frame |
| CX-12 | [22.05 Dashboard](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) | [22.08 Credit-Linked Performance](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | The **defensible (uncopyable) content renders inside the copyable frame** — they ship together per the D-18 structure | Musician, Producer, Fan | Medium | 22.05.01 DT-01; index Q-06 |
| CX-13 | [22.05.04 Benchmarking](./22.05-cross-source-dashboard-reporting/22.05.04-peer-benchmarking-cohort-comparison.md) | [22.08 Credit-Linked Performance](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | The credit-graph cohort ("drummers with comparable credit graphs") is the only benchmark serving the primary persona, and it consumes 22.08's rollup | Musician | Medium | 22.05.04 DT-03; possible re-parenting 22.05.04 Q-04 |
| CX-14 | [22.03 Playlist Estimate](./22.03-playlist-chart-tracking/22.03.01-playlist-placement-tracking.md) | [22.08.03 Verified Proof](./22.08-credit-linked-performance/22.08.03-verified-performance-proof.md) | **Negative guard**: a playlist-contribution figure is always an *estimate* (inference from timing) and must NEVER feed verified proof; the estimate label travels with the number to every persona | Musician, Producer | Medium | 22.03.01 → 22.08.03 (D-03 boundary); D-05 |
| CX-15 | [22.03.01 Placement Tracking](./22.03-playlist-chart-tracking/22.03.01-playlist-placement-tracking.md) | [22.04.01 Geography Map](./22.04-audience-geography-routing-insight/22.04.01-audience-geography-map.md) | An algorithmic placement can shift geography (a track breaks in a territory because a local playlist added it) | Musician | Low | Deferred from `22.04-audience-geography-routing-insight-cx.md#R-01`; most shifts have no placement behind them |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Ingestion ↔ Matching

**Relationship**: 22.01 produces a stream of numbers keyed to a *foreign* identifier (a Spotify
artist URI, a TikTok handle, a chart-row ISRC). None of it means anything until 22.02 binds that
identifier to a WeJammin entity. A DSP grant proves read access, not ownership — the many
credential-holders (owner, delegate, distributor) are distinct from the single canonical binding
22.02 alone may write. The join key is the stable external ID, never the display handle, because
handles rename and rebrand while the underlying account persists.

**Role scoping**:
- **Musician / Producer**: connect sources (22.01) and confirm/dispute matches (22.02); both are core.
- **Operator**: connects a venue's own social entity (22.01.02) but does not match catalog.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the **canonical connection** is guarded by a unique constraint on `(source, external_entity_id)`; matching owns the binding record. Ingestion writes metrics idempotently on `(source, external_entity_id, metric, date)` — single-writer per fact, no merge.
2. **Trigger chain**: sync grant → ingest attempt → per-attempt outcome → (async) match proposal. If matching fails or is deferred, the numbers persist as "data about a stranger" rather than being discarded — the pipeline degrades to unmatched, never to lost.
3. **Permission intersection**: who may *connect* (22.01, org-scoped via domain 01) is not who may *match* (22.02 needs a delegated MATCH_SCOPE, not merely a read grant). A read/connection grant that conferred match authority would be a privilege-escalation seam.
4. **Notification fan-out**: a new high-confidence match proposal notifies the owner to confirm; a broken connection notifies (CX-03); transient failures never do (22.01.02 D-01).
5. **State transition conflict**: re-auth completing *during* a backfill can double-write a date range. Resolved by the idempotent upsert key above; concurrent claims on one external ID are resolved by the binding-uniqueness constraint, which routes the loser to 22.02.03 conflict resolution.

### CX-02: Matching ↔ Credit-Linked Performance

**Relationship**: The domain's most consequential internal edge. 22.08 rolls up performance across
records the Musician **does not control and cannot connect a DSP for** — a session drummer has no
grant on someone else's release. So coverage depends entirely on 22.02.02 matching recordings via the
**counter-attested credit graph** (domain 02) rather than downward from a claimed artist profile. Two
further couplings hang off this edge: the **evidence tier** stamped at match time is the floor the
proof exporter (22.08.03) may never exceed, and an **unworked match-conflict cleanup queue** silently
caps rollup coverage/confidence.

**Role scoping**:
- **Musician**: the whole point — scattered session work becomes a catalog, or it doesn't.
- **Producer**: same at scale — a 200-record back catalog across defunct distributors.
- **Operator**: none — no credits, no catalog.
- **Fan**: sees only the published total (22.08.03), never the catalog.

**Synthesis questions answered**:
1. **Shared state conflict**: 22.02 owns the match record (write); 22.08 reads it. Single writer. A `match_version` optimistic-concurrency token blocks a confirm racing a contest.
2. **Trigger chain**: credit (02) → catalog match (22.02.02) → rollup (22.08.01) → proof (22.08.03). A revoked match must **cascade the whole chain loudly** and invalidate any already-published proof asserting the larger number. Silent orphaning leaves a false public claim standing under WeJammin's brand.
3. **Permission intersection**: the credit *is* the permission. A self-asserted match carries a lower evidence tier and must never mint "verified" proof — the tier is a hard ceiling, not a hint.
4. **Notification fan-out**: a record you played on breaking out is worth telling you (subject to CX-09/CX-04 gates); a revocation that shrinks your catalog must reach you before a client asks.
5. **State transition conflict**: an unworked cleanup queue (22.02.03) means unmatched rows accumulate; rollup confidence must **degrade automatically** as unmatched share rises, not hold a stale high figure. See `22.02-external-identity-catalog-matching-cx.md#CX-01`.

### CX-03: Ingestion Health ↔ Dashboard & Credit-Linked Performance

**Relationship**: The widest internal dependency in domain 22. Every chart, digest, share, export and
proof carries 22.01.03's honesty annotation (gaps, estimates, restatements, freshness). This is
one-way derivation — health writes nothing back — but its absence at any render point creates a
confident lie at exactly the place someone acts on it. The Coverage Rule additionally *gates* the
proof claim: one dead dominant source can force 22.08.03 to downgrade from "verified" to
"self-reported/partial."

**Role scoping**:
- **Musician**: gaps annotate the numbers they read and the proof they publish.
- **Producer**: a gap in a client deliverable is a professional embarrassment the client finds first.
- **Operator**: sees freshness on the market data they route/book on.
- **Fan**: never sees a gap — sees a value or nothing (22.01.03 Role Lens).

**Synthesis questions answered**:
1. **Shared state conflict**: none. Health state is derived, recomputable, single-writer.
2. **Trigger chain**: attempt outcome → health state → annotation on every consumer. If the annotation cannot be produced, the number is **suppressed, not rendered bare** — failing open here means shipping an unlabelled lie. A per-record source gap must surface as *stale-as-of-date*, never as a silent shrink.
3. **Permission intersection**: a delegated viewer can see a broken connection they cannot re-auth; the health surface renders the fixer's identity and disables the CTA for non-owners (`22.01-source-connections-ingestion-cx.md#CX-01`).
4. **Notification fan-out**: only broken/terminal states notify (owner always; a delegate only if they hold a dependent digest). Degraded/transient never notify.
5. **State transition conflict**: a restatement races an in-flight render. Resolved by snapshot-at-render-start, then the restatement is disclosed on the next open rather than silently swapped (22.01.03 D-04).

### CX-04: Fraud Detection → the celebration path

**Relationship**: Not a data flow — a **gate**, and the domain's most important structural constraint
(D-06). Artificial streaming's signature *is* success: a burst of playlist adds (22.03 wants to
alert), a stream spike (22.05 wants to render), a breakout signal (22.07 wants to broadcast to third
parties). Each feature is individually correct and collectively catastrophic without this gate — the
platform congratulates a user on the event about to remove their catalog, and tells other people
about it.

**Role scoping**:
- **Musician**: the victim, usually unknowingly (they bought a "playlist promotion" package).
- **Producer**: their record gets taken down; credit and client relationship suffer.
- **Operator / Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: none — 22.06 flags; consumers read the flag. Flagged streams are excluded upstream once, so downstream features consume corrected data and do not re-decide fraud.
2. **Trigger chain**: ingestion → fraud classification → **then** alert/render/signal. Order is the design. If classification is pending, the safe default is to withhold celebration, not to celebrate unclassified data.
3. **Permission intersection**: 22.07's outward signal is the sharp case — an ungated breakout signal tells a *third party* someone is rising on fake numbers, manufacturing reputational harm from our own unfiltered data.
4. **Notification fan-out**: a fraud warning outranks positive alerts and positive numbers in visual hierarchy (22.05.01 D-03) — a spike rendered as a win above the warning that it is fake is worse than no dashboard.
5. **State transition conflict**: a spike alerted, then flagged hours later. **Retraction must reach the exact user who was congratulated** — the celebratory notification and the correction share one addressee and must not diverge.

### CX-05: Fraud Detection ↔ Geography Map

**Relationship**: Flagged fraudulent streams carry locations. If each consumer filters them
independently, some map renders bot geography and routes a real tour to fake demand. The exclusion
happens **once, at the map** (22.04.01 D-04), so every downstream consumer inherits one correction.

**Role scoping**:
- **Musician**: routes real shows on real audiences.
- **Operator**: reads aggregate catchment demand derived from the already-filtered map.
- **Producer / Fan**: no direct surface.

**Synthesis questions answered**:
1. **Shared state conflict**: none — the map owns the filtered geography; routing (22.04.02) reads it.
2. **Trigger chain**: fraud flag (22.06) → exclusion at map build → routing consumes filtered evidence. If the flag arrives after a map is built, the map is rebuilt, not patched per-consumer.
3. **Permission intersection**: the Operator prospecting view exposes only aggregate catchment under a k-anonymity floor — never an artist's individual city listener count, which is their guarantee-negotiating position against the same viewer.
4. **Notification fan-out**: none — this is a silent exclusion, not an event.
5. **State transition conflict**: late-arriving flags trigger a map restatement, disclosed per CX-03's freshness rule.

### CX-06: Matching ↔ Report Sharing & Export

**Relationship**: A report shared as a live link is not a snapshot — it re-renders at the recipient's
permission level. So when a match is later contested or revoked, the affected numbers must be
suspended to "unknown" **inside reports that are already out in the world**, and the holders notified.
The viewer must see exactly the same suspension the owner sees, or WeJammin serves a stale value it
knows is wrong to a third party.

**Role scoping**:
- **Musician / Producer**: owner of the report and subject of the suspended number.
- **Operator**: a possible recipient of a shared market report (read-only, aggregate scope).
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the match record (22.02) is the single source; the shared report holds a *reference*, not a copy, so suspension is enforced at render, not by chasing copies.
2. **Trigger chain**: contest/revoke (22.02.03) → binding freeze → live reports referencing it render "unknown" → holders notified. Async, but the suspension is immediate on next render; there is no window where a stale confirmed value is served post-freeze.
3. **Permission intersection**: a digest to a shared recipient renders at the *recipient's* permission level (enforced once, `22.05-cross-source-dashboard-reporting-cx.md#CX-04`), else it is a scheduled data leak. An unauthorised series reference is rejected 403 at save-time where scope is auditable, not rendered-then-hidden.
4. **Notification fan-out**: invalidation notifies every holder of an affected live report — the fan-out is to *external recipients*, not just the owner.
5. **State transition conflict**: confirm-while-shared and contest-while-rendering both resolve through the `match_version` token; the frozen state always wins over an in-flight optimistic render.

### CX-07: Benchmarking ↔ Scouting Search

**Relationship**: One computation, two consumers, and they must **not** be wired together.
"Artists comparable to X" powers both 22.05.04's anonymised inward cohort and 22.07.03's identified
outward search. Connecting them lets the cohort be de-anonymised by cross-referencing against search —
a textbook aggregation attack that silently breaks the k-anonymity floor 22.05.04 D-03 depends on.

**Role scoping**: Musician and Producer are on **both sides** — the subject of one and the user of the
other, which is exactly why the separation matters. Operator and Fan: no access to either.

**Synthesis questions answered**:
1. **Shared state conflict**: the comparable-artist mechanism is shared **code**, never a shared *index*. Two separate materialisations — one anonymised, one identified.
2. **Trigger chain**: none — both are read paths.
3. **Permission intersection**: the entire concern. Inward is anonymised and consent-free (your own data against a distribution); outward is identified and consent-gated (22.07.04's purpose-scoped discoverability).
4. **Notification fan-out**: none. Benchmark alerts are rejected on values grounds (`22.05-cross-source-dashboard-reporting-cx.md#R-01`).
5. **State transition conflict**: none.

### CX-08: Social Ingestion ↔ Dashboard & Alerts

**Relationship**: The unified timeline placing a social series (TikTok, Instagram) on the same axis as
a stream series is the domain's founding thesis made visible — the TikTok-spike-to-streaming-spike
correlation only exists when both sit on one timeline. Connecting a social account is the
highest-value onboarding action because the retention window is unrecoverable. The
**silence-on-transient** rule (22.01.02 D-01) exists precisely to protect this surface's alert budget:
a flaky social API must not spend the user's finite tolerance on noise.

**Role scoping**:
- **Musician / Producer**: the primary correlation surface.
- **Operator**: connects a venue's social entity and measures campaign lift on the same series.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — ingestion writes the series; the dashboard reads it.
2. **Trigger chain**: connect → ingest → render on timeline. A disconnect/re-auth gap renders as an honest labelled gap (CX-03), never interpolated across.
3. **Permission intersection**: the entity a connection attaches to (personal/band/venue) is owned by domain 01; who may connect on a band's behalf is org governance, not a dashboard concern.
4. **Notification fan-out**: only actionable (re-auth needed) and terminal (API deprecation) failures may alert; transient/rate-limited never do.
5. **State transition conflict**: a mid-render definition edit resolves by snapshot-at-render-start; a saved view is single-owner so last-write-wins on reopen.

### CX-09: Placement Tracking ↔ Alerts & Digests

**Relationship**: Playlist add/removal and chart entry are the highest-value alerts in the domain —
and the most dangerous to fire blind. Alert firing is gated on CX-04's fraud/quality classification
*and* on placement class: an algorithmic-reach placement has no discrete removal event to alert on,
while an editorial add does. The alert engine (22.05.02) decides *what* is worth saying; the
placement tracker (22.03.01) supplies the classified event.

**Role scoping**:
- **Musician / Producer**: recipients of the highest-signal alerts in the product.
- **Operator / Fan**: none (fan gig alerts are a separate consumer surface, 20 D-11).

**Synthesis questions answered**:
1. **Shared state conflict**: none — placement events are the raw material; the alert engine reads them.
2. **Trigger chain**: placement observed → **quality/fraud classified (CX-04)** → class-checked → alert composed. A bot-playlist add is intercepted before any celebration.
3. **Permission intersection**: an alert bound to a shared digest renders at the recipient's permission level (CX-06).
4. **Notification fan-out**: this is the fan-out point; the per-domain noise budget (22.05.02 D-01) is spent here and is the sharpest open question against the platform notification cross-cut (22.05.02 Q-03).
5. **State transition conflict**: a placement alerted then reclassified as fraudulent triggers CX-04's retraction to the same addressee.

### CX-10 … CX-15 (Medium/Low — synthesis deferred per CX template rule)

- **CX-10 (Placement ↔ Catalog Matching, Medium)**: placements attach to matched recording entities; the same track on two ISRCs merges at the catalog entity so placements combine. Depends on CX-01/CX-02 resolution first.
- **CX-11 (Routing ↔ Dashboard, Medium)**: geography and show-impact are two of the three things worth rendering in the unified frame; the dashboard is the frame, 22.04 supplies an *action* it cannot itself produce.
- **CX-12 (Dashboard ↔ Credit-Linked, Medium)**: the uncopyable content (22.08) renders inside the copyable frame (22.05); they ship together (index Q-06). A packaging/sequencing coupling, not a data race.
- **CX-13 (Benchmarking ↔ Credit-Linked, Medium)**: the credit-graph cohort is the only benchmark serving the primary persona and consumes 22.08's rollup; may re-parent (22.05.04 Q-04).
- **CX-14 (Playlist Estimate ↛ Proof, Medium — negative guard)**: a playlist-contribution figure is always an estimate and must never feed verified proof; the estimate label travels to every persona including Producer read-only. This is D-05 enforced at a specific seam, not a data dependency — its *content* rule is owned by 22.08.03 (see R-01).
- **CX-15 (Placement → Geography, Low)**: an algorithmic placement can shift a territory's geography; most geographic shifts have no placement behind them, so this is a hypothesis, not a dependency.

---

## Cross-Cut Mechanisms Identified — for the global CX file

> Mechanisms serving **many domains**, discovered while drilling domain 22. Recorded here and returned
> for `ideation-cx.md` / the mechanism registry to absorb.

| Mechanism | Serves | Why it is a cross-cut, not a node |
|---|---|---|
| **Anonymised Cohort Construction & k-Anonymity Floor** | 05, 16, 22, 23 | 22.04.01 D-05 (venue market view), 22.05.04 D-03 (benchmark cohort) and rate guides (05/23) independently require the *same* privacy floor. Two floors for one mechanism is an incoherence; CX-07 shows two cohort surfaces cross-referenced break each other's floor — the floor must be one shared guarantee. **Not in the registry.** |
| **Playlist Quality / Bot Classification** | 21, 22 | One classifier feeds curator intelligence (22.03.03), fraud detection (22.06), vendor scoring (22.06.02) and 21's pitching. Duplicated copies would disagree, and CX-04's gate depends on exactly one verdict. **Not in the registry.** |
| **Purpose-Scoped Discoverability Consent** | 03, 04, 05, 20, 22 | 22.07.04 DT-03: findable-for-hire (05) ≠ watchable-for-evaluation (22.07) ≠ contactable (03/04). A single "discoverable" flag either breaks livelihoods or launders consent. **Not in the registry** (distinct from the generic Privacy/Consent mechanism). |
| **Work-Identity Tier (ISWC) above the recording** | 02, 09, 10, 11, 12, 22 | D-05's work-grouping for career totals needs an identity tier *above* ISRC; 22 matches recordings but career totals sum works. The registry's Canonical Data mechanism covers minting IDs; the **grouping tier** is a specific addition (22.02.02). |
| **External Account Connection & OAuth Token Lifecycle** | 12, 20, 21, 22 | Distributor connections, D2F socials, ad platforms and analytics grant/refresh/break/revoke identically. The *connection* is product per-domain (22.01 D-03); the token machine is one thing. Reconciles with the registry's Integrations OAuth-broker line. |
| **Notification noise budget (cross-domain)** | all 24 | 22.05.02 decides *what* is worth saying; the shared budget is platform-wide. 22.05.02 Q-03: a per-domain budget is useless if every domain independently spends the same user's tolerance. Sharpens the registry's Notifications mechanism. |

## Not-Product Concerns Identified — for `/create-prd`

| Concern | Routed to | Why |
|---|---|---|
| Time-series metrics store, retention, restatement history | `/create-prd-architecture` | 22.01.03 Q-02 — a storage/integrity trade-off, not a product decision. |
| Ingestion scheduler, queue, rate-limit budgeting, backfill orchestration | `/create-prd-architecture` | The *connection* is product (22.01 D-03); the machine underneath is not. |
| Anomaly-detection model hosting and training | `/create-prd-architecture` | Infrastructure for 22.06. |
| **DSP data licensing & terms compliance** | `/create-prd-security` | The domain's existential legal constraint (index Q-05) — storage, redistribution, bulk export and commercial display may each be forbidden. |
| Profiling non-users (curators, promo vendors) under GDPR | `/create-prd-security` | 22.03.03 DT-02, 22.06.02 DT-02 — legitimate interest, right to object, defamation. |
| Chart / playlist-index data licensing & build-vs-license fork | `/create-prd-stack` | 22.03 Q-01/Q-02 — a cost floor and a strategic fork before a user exists. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 22.03 Playlist & Chart Tracking | 22.08 Credit-Linked (credential inheritance) | The idea that a credited contributor *inherits* a chart/playlist credential ("I played on a top-40 record", 22.03.02 Q-03) is a **proof-content question** owned by 22.08.03, not an interaction. The genuine boundary — an estimate must never mint verified proof — is captured as the CX-14 guard. Wiring credential *logic* across the seam would put proof rules in two places. |
| R-02 | 22.04 Geography & Routing | 22.08 Credit-Linked Performance | No relationship. A session player's contribution catalog has no geography worth acting on — they are not touring on someone else's record. The temptation is symmetry ("everything should have a map"); a drummer's credited catalog performing in Brazil is trivia, not an action. |
| R-03 | 22.06 Fraud Detection | 22.02 Matching | Fraud concerns the *numbers* on a correct match; matching concerns *whose* numbers they are. Conflating them merges "we disagree who this is" with "these streams look fake" — three distinct epistemic states (unknown, contested, suspect), each with a different remedy, must stay distinct (`22.02-external-identity-catalog-matching-cx.md#R-02`). |
| R-04 | 22.07 Scouting | 22.01 Ingestion | Scouting reads ingested data but has no relationship to connection lifecycle. A scout connects nothing — the *subject's* connections supply the data. Modelling it would imply scouts have standing over subjects' connections, the exact inversion 22.07.04 prevents. |
| R-05 | 22.05.04 Benchmarking | 22.04 Geography & Routing | Both need cohorts, but "artists like me" and "artists with a following near here" share the **k-anonymity mechanism**, not an interaction. Recorded as a mechanism above. Wiring them opens a second aggregation attack alongside CX-07's. |
