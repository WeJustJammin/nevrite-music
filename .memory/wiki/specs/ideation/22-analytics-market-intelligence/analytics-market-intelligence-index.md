# Analytics & Market Intelligence — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `in-source` | **Priority**: `important`

## Overview

Aggregating an artist's performance across DSPs, socials, playlists and charts into one comparable, longitudinal view — with alerting, routing insight, fraud detection and A&R signal.

**Why this is a top-level domain**: Renamed from 'Audience & Performance Analytics' to resolve the collision a verifier flagged with the fan domain. idea.md names 'Analytics Dashboard: comprehensive insights and performance metrics' and specifies nothing. This is one of the largest defensible categories in the industry — Chartmetric, Soundcharts, Viberate and Songstats are venture-scale companies whose entire product is this aggregation, and the pain is concrete: an artist logs into six dashboards and can never answer 'is my career growing?'. Deliberately distinguished from the Analytics Instrumentation cross-cut: per-domain reporting (vendor sales, box office, profile views) is a mechanism each domain owns, whereas EXTERNAL ingestion, normalization and cross-source correlation is its own machine with its own destination and its own audience. The distinction is what is ingested, not merely who reads it. The TikTok-spike-to-streaming-spike correlation is only computable when both sit on one timeline; audience-geography-versus-tour-history is where it converts into an action no incumbent can produce, because no incumbent also holds the routing data.

**Interacting capabilities** (what justifies domain status):

- DSP & social data ingestion
- normalization & cross-source correlation
- playlist/chart tracking & alerting
- audience geography → routing insight
- artificial-streaming detection
- A&R scouting signal

## What Breadth Discovery Found

> Added by `/ideate-discover` Step 3. The domain's rationale above survived drilling; its **centre
> of gravity moved.**

The sweep's 8 candidates describe the **Chartmetric category** — ingest DSP data, draw charts, rank
artists. Drilled against the ratified thesis (D-18) and personas (D-19), that framing has a hole in
the middle: **every candidate serves an artist with a Spotify profile, and the platform's primary
persona doesn't have one.** A session drummer is a body of counter-attested credits attached to other
people's records. Every incumbent analytics product models one artist entity and is structurally
blind to them.

That produced 22.08 (Credit-Linked Performance) — the domain's only uncopyable node, and a Deep Think
addition rather than a sweep candidate. It answers a question nobody has ever answered: *"how are the
records I played on doing?"* It is computable **only** here, because it needs a credit graph captured
at the session (domain 02) joined to catalog performance — and no competitor holds both, nor can
manufacture one retroactively (that is precisely problem-statement's root cause: absence at the point
of truth).

The honest shape of this domain after drilling:

| Half | Sub-domains | Character |
|---|---|---|
| **Table stakes** (consolidation — wins the user) | 22.01, 22.02, 22.03, 22.05 | Copyable. Incumbents do it, several do it better. Necessary — this is the front door and the articulated pain — and defensible of nothing. |
| **Differentiated** (provenance + consolidation — keeps the user) | 22.04, 22.08 | Requires data only WeJammin holds: the credit graph (02) and the booking record (17). Un-copyable by construction. |
| **Contested** | 22.06, 22.07 | 22.06 protects users but may be unbuildable on the data we can get. 22.07 is scouting — its natural buyer is a label, its subject is our primary persona. |

This is D-18's structure appearing without being forced: the copyable half is the platform, the
uncopyable half is the wedge, and **neither works alone**. 22.05's dashboard has no defensibility;
22.08 has no daily hook and a circular cold-start (22.08.01 DT-03). They must ship together.

## Children

> Classified through the Node Classification Gate. All `[SURFACE]` — depth is allocated by MoSCoW in
> Step 5. 8 sub-domains, 26 leaf features.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Source Connections & Ingestion | sub-domain | [22.01-source-connections-ingestion/](./22.01-source-connections-ingestion/22.01-source-connections-ingestion-index.md) | `[SURFACE]` | 10 hypotheses |
| 02 | External Identity & Catalog Matching | sub-domain | [22.02-external-identity-catalog-matching/](./22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md) | `[SURFACE]` | 8 hypotheses |
| 03 | Playlist & Chart Tracking | sub-domain | [22.03-playlist-chart-tracking/](./22.03-playlist-chart-tracking/22.03-playlist-chart-tracking-index.md) | `[SURFACE]` | 8 hypotheses |
| 04 | Audience Geography & Tour Routing Insight | sub-domain | [22.04-audience-geography-routing-insight/](./22.04-audience-geography-routing-insight/22.04-audience-geography-routing-insight-index.md) | `[SURFACE]` | 9 hypotheses |
| 05 | Cross-Source Dashboard & Reporting | sub-domain | [22.05-cross-source-dashboard-reporting/](./22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md) | `[SURFACE]` | 12 hypotheses |
| 06 | Streaming Fraud & Fake Engagement Detection | sub-domain | [22.06-streaming-fraud-detection/](./22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md) | `[SURFACE]` | 6 hypotheses |
| 07 | A&R Scouting Signals & Watchlists | sub-domain | [22.07-ar-scouting-watchlists/](./22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-index.md) | `[SURFACE]` | 11 hypotheses |
| 08 | Credit-Linked Performance | sub-domain | [22.08-credit-linked-performance/](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md) | `[SURFACE]` | 9 hypotheses |

### Candidate Disposition

> How the sweep's 8 candidates map to the 8 sub-domains above.

| Sweep candidate | Disposition |
|---|---|
| 01 Streaming/DSP Analytics Aggregation | → **22.01** (sub-domain) — split into connection, health and import; the *connection* is product, the pipeline is architecture |
| 02 Social Analytics Aggregation | → **22.01.02** (feature) — kept distinct from DSP, not merged: different retention, auth semantics and failure classes (22.01.02 DT-01) |
| 03 Playlist Tracking & Chart Monitoring | → **22.03** (sub-domain) |
| 04 Audience Geography & Tour Routing Insights | → **22.04** (sub-domain) — the loop, not the map, is the product |
| 05 Cross-Source Reporting & Automated Digests | → **22.05** (sub-domain) — alerts + digests merged into one feature (one noise budget, 22.05.02 DT-01) |
| 06 Streaming Fraud & Fake Engagement Detection | → **22.06** (sub-domain) |
| 07 A&R Scouting Signals & Watchlists | → **22.07** (sub-domain) — **merged with 08** |
| 08 Artist Discovery Signals & Scouting | → **merged into 22.07** — near-duplicate of 07; the sweep was tuned for coverage, not discipline |
| — | **22.02** External Identity & Catalog Matching — **Deep Think addition**: the join every candidate assumed and none named |
| — | **22.08** Credit-Linked Performance — **Deep Think addition**: the domain's only uncopyable node |

## Role Matrix

> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None
> Personas per [meta/personas.md](../meta/personas.md) (D-19). Detailed per-role behavior lives in
> each feature file's Role Lens.

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 22.01 Source Connections & Ingestion | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 22.02 External Identity & Catalog Matching | ✅ Full | ✅ Full | ❌ None | ❌ None |
| 22.03 Playlist & Chart Tracking | ✅ Full | 👁️ Read-only | ❌ None | ❌ None |
| 22.04 Audience Geography & Tour Routing Insight | ✅ Full | 👁️ Read-only | 📊 Reports | ❌ None |
| 22.05 Cross-Source Dashboard & Reporting | ✅ Full | ✅ Full | 👁️ Read-only | ❌ None |
| 22.06 Streaming Fraud & Fake Engagement Detection | ✅ Full | 👁️ Read-only | ❌ None | ❌ None |
| 22.07 A&R Scouting Signals & Watchlists | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 22.08 Credit-Linked Performance | ✅ Full | ✅ Full | ❌ None | 👁️ Read-only |

**Reading this matrix — three things it says:**

1. **The Operator is nearly absent, and that is correct.** A venue's business is time and space
   (personas.md), not audience data. Their one substantive surface is **22.04** — "who is listening in
   my catchment, and would they come?" — and it is `📊 Reports` (aggregate only) because an artist's
   city-level listener count is their negotiating position on a guarantee (22.04 D-02). They also
   scout artists to book (22.07) and configure their venue's own social reach (22.01.02).
2. **The Fan is almost entirely `None`, and that is also correct.** Fans *generate* this data by
   listening and never see it. Their single touchpoint is `👁️` on **22.08.03** — a verified proof on
   a public service listing, which is genuinely useful to them: a legible trust signal requiring no
   industry literacy.
3. **A&R / label / booking agent do not appear**, because they are not personas (D-19). Their
   behavior is absorbed as Producer-in-an-org-context and Operator. See D-04 and Q-02 — this is the
   domain's one live persona gap.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Renamed from 'Audience & Performance Analytics' to resolve the collision a verifier flagged with the fan domain. idea.md names 'Analytics Dashboard: comprehensive insights and perf... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **22.08 Credit-Linked Performance created** — the domain's only uncopyable node | The sweep enumerated the analytics category's furniture and never asked what *this platform's* data makes newly possible. Every candidate serves an artist with a Spotify profile; the ratified primary persona (D-19) doesn't have one. 22.08 answers "how are the records I played on doing?" — computable only where a counter-attested credit graph meets catalog performance. | Agent, Deep Think, `/ideate-discover` Step 3, 2026-07-16 |
| D-03 | **Sweep candidates 07 and 08 merged** into 22.07 | Near-duplicates describing one capability from two angles. | Agent classification, 2026-07-16 |
| D-04 | Sweep personas (artist/manager/label/A&R/booking agent/distributor) **mapped onto the ratified four**, not invented | Per D-19's entity model — labels and agencies are **entities** (domain 01) experienced *through* personas. A&R/label → Producer in an org context; booking agent/promoter → Operator; manager → Musician or Producer in an org context. A mapping, not an invention — and it may be wrong. See Q-02. | Agent, D-19 compliance, 2026-07-16 |
| D-05 | **Honesty is structural in this domain, not decorative** | Gaps are never interpolated (22.01.03 D-01); estimates are labelled (22.03.01 D-03); imported provenance travels to every export (22.01.04 D-02); co-occurrence is described, causation never asserted (22.05.01 D-02). Rationale: a platform whose thesis is that reconstructed facts are the disease (D-18) cannot fabricate facts in its own charts. This is the domain's single most cross-cutting principle. | Agent, thesis-derived, 2026-07-16 |
| D-06 | **Fraud detection gates the celebration path** | Artificial streaming's signature *is* success — a placement win, a stream spike, a breakout signal. Three features independently discovered this (22.03.01 DT-03, 22.06.01 DT-03, 22.07.02 DT-03). Ungated, the platform congratulates users on the event that removes their catalog, and broadcasts it to third parties. See `analytics-market-intelligence-cx.md#CX-04`. | Agent, Deep Think, 2026-07-16 |
| D-07 | **The recommendation surface is never monetised** | Three features independently converged: venue-paid routing rank (22.04.02 DT-03), curator pitch brokering (22.03.03 DT-03), promo-vendor scoring while selling promo (22.06.02 DT-03). Each is individually tempting and collectively fatal — these are the surfaces where users trust us with financially consequential decisions. Proposed as a **platform-level product principle**, not a domain rule. See Q-04. | Agent, Deep Think, 2026-07-16 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | **Is partner-level DSP analytics access obtainable?** Spotify for Artists has no general public analytics API; incumbents use partnership or scraping. If unobtainable, 22.01/22.05/22.08 lose their richest source and fall back on distributor files. This is a gate on the domain's viability, not a detail. | User | `/create-prd-stack` |
| Q-02 | **[OWNER]** **Is a label A&R a distinct persona, or a Producer in an org context?** D-04 assumes the latter. Directly parallels personas.md Q-01 (dealer persona for 13/14/15). If "distinct persona", 22.07's Role Matrix is wrong. **Canonical at [22.07 Q-01](./22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-index.md)**, already `[OWNER]` → `/create-prd`; [`meta/personas.md`](../meta/personas.md) Q-01 made the identical move ("Deferral target re-pointed from the completed `/ideate-validate` to `/create-prd`"), and **D-71** closed only the commercial-licence buyer while explicitly leaving the other non-persona actors open (personas.md Q-05). A values/entity-model call no later stage resolves on its own. Re-pointed from the completed `/ideate-validate`. | User | `/create-prd` |
| Q-03 | **Does 22.08 belong in domain 22 or domain 02 (Credits & Attribution)?** It is the credit graph's payoff. For 22: it needs the whole ingestion/matching machine. For 02: the credit graph is the subject and 22 is merely a data source. Genuinely unresolved — and it is a **domain-boundary** question, which is precisely what `/decompose-architecture` locks. **Canonical at [22.08 Q-02](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md)**, already pointed there. Re-pointed from the completed `/ideate-validate`. | User | `/decompose-architecture` |
| Q-04 | **[OWNER]** **Adopt D-07 as a platform principle?** Three independent features concluded "don't monetise the recommendation surface". The owner should see the pattern whole rather than as three footnotes — and decide before revenue depends on the answer. D-07 is recorded as "**Proposed** as a platform-level product principle, not a domain rule", so adoption is still open here. This row is the **canonical adoption**; its three feature-level instances — [22.04.02 Q-02](./22.04-audience-geography-routing-insight/22.04.02-routing-market-opportunity-insight.md), [22.06 Q-03](./22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md) and [22.06.02 Q-03/Q-04](./22.06-streaming-fraud-detection/22.06.02-promo-vendor-risk-scoring.md) — are already `[OWNER]` → `/create-prd` and name it as such. Re-pointed from the completed `/ideate-validate`. | User | `/create-prd` |
| Q-05 | **Do DSP terms permit** storing, redistributing to third parties (22.05.03), bulk export (22.05.03 D-04), cross-user aggregation (22.05.04) and commercial display (22.08.03)? Hit independently by four features. May forbid several outright. | User | `/create-prd-security` |
| Q-06 | ~~**This domain's answer to problem-statement Q-03 (beachhead)**: 22.05.01's dashboard is the articulated pain and wins users; 22.08 is uncopyable and keeps them but has a circular cold-start (22.08.01 DT-03 — the payoff that motivates credit capture requires the capture to exist). They must ship together, which makes this domain a poor solo beachhead and a strong second move behind a consolidation surface.~~ **RESOLVED — the domain's own reading was right, and the beachhead went elsewhere.** [`ideation-index.md`](../ideation-index.md) **D-31** (User, 2026-07-18): "**v1 = session spine** (01, 02, 05, 07, 09-capture) ~45 Musts — the wedge, shipped first and fast. **v1.5 = the 3 marketplaces** (13, 14, 15) … Phase 2+ = the remaining ~124 Musts" — domain 22 is **phase 2+**. The same file states it outright: "It no longer needs to pick a beachhead — D-31 did." D-31 amends D-20's "defer the beachhead" half. The "ship together" finding survives intact: [moscow-ledger.md](../moscow-ledger.md) § MUST carries **both** 22.05.01 and 22.08.01. Same resolution as [22.08 Q-03](./22.08-credit-linked-performance/22.08-credit-linked-performance-index.md). | User | ✅ **RESOLVED** — `ideation-index.md` D-31 (amends D-20) |
| Q-07 | ~~**Does 22.07.03 survive?** Domain 05 already offers *consented* search over the same people (they listed themselves for hire). The delta here is precisely the unconsented part (22.07.03 DT-02). That may be a reason to cut it rather than build it carefully.~~ **RESOLVED — no; cut at the MoSCoW pass.** [moscow-ledger.md](../moscow-ledger.md) **§ WONT** lists `22.07.03 Scouting Discovery Search`, for exactly this reason: "domain 05's services marketplace already offers essentially this search over the same people, consented by construction — they listed themselves for hire. The delta here is precisely the unconsented …". The cut is selective, not sub-domain-wide — per [22.07 Q-02](./22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-index.md) (closed on the same ledger): 22.07.04 `SHOULD`, 22.07.01/.02 `COULD`, "only the unconsented discovery search is cut". | User | ✅ **RESOLVED** — `moscow-ledger.md` § WONT (MoSCoW pass, ratified by D-20) |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
