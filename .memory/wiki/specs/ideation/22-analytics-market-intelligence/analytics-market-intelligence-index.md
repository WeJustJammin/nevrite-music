# Analytics & Market Intelligence — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [SURFACE]
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

## Children

> Candidate children discovered by the 14-lens sweep. All are `[SURFACE]` — identified only.
> `/ideate-discover` runs each through the Node Classification Gate to determine
> sub-domain (folder) vs feature (file), then drills. **Nothing below is confirmed structure.**

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Streaming/DSP Analytics Aggregation | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 02 | Social Analytics Aggregation | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 03 | Playlist Tracking & Chart Monitoring | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 04 | Audience Geography & Tour Routing Insights | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 05 | Cross-Source Reporting & Automated Digests | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 06 | Streaming Fraud & Fake Engagement Detection | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 07 | A&R Scouting Signals & Watchlists | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 08 | Artist Discovery Signals & Scouting | _unclassified_ | _pending_ | `[SURFACE]` | 0 |

## Role Matrix

> `[PENDING]` — populated by `/ideate-discover` once `meta/personas.md` exists.
> Provisional personas for this domain (from sweep): artist, manager, label, A&R, booking agent, distributor
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | artist | manager | label | A&R | booking agent | distributor |
|-------| --- | --- | --- | --- | --- | --- |
| _pending — children unclassified_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Renamed from 'Audience & Performance Analytics' to resolve the collision a verifier flagged with the fan domain. idea.md names 'Analytics Dashboard: comprehensive insights and perf... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | `/ideate-discover` |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | `/ideate-discover` |
