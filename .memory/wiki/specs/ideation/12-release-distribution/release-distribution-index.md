# Release & Distribution — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [SURFACE]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `core` _(raised to core by D-10 — rights stack is the thesis)_

## Overview

Getting finished music onto stores and streaming services — release building, DDEX delivery, per-store status, scheduling and pre-save, takedowns, and Content ID registration.

**Why this is a top-level domain**: A distinct domain with its own persona (label ops, distributor), its own machinery (DDEX ERN, per-partner conformance, asynchronous partial delivery) and its own destination (the release dashboard). DistroKid, TuneCore, CD Baby and Vydia occupy it entirely. Strategically it is the enforcement point that makes the whole rights thesis work: distribution is when the artist actually wants something, which is the only moment they will fix their metadata — refuse to deliver a release whose splits do not balance and the split sheet gets signed. That single mechanic is why this is not merely 'an integration'. Delivery is asynchronous, partial and fails silently (live on Spotify, rejected by Apple, pending on Beatport), so per-store status must be a first-class tracked object rather than one 'released' flag.

**Interacting capabilities** (what justifies domain status):

- release builder & metadata validation
- DDEX messaging & per-partner delivery
- per-store, per-territory status tracking
- scheduling, pre-save & editorial windows
- takedowns & redelivery
- Content ID / fingerprint registration

## Children

> Candidate children discovered by the 14-lens sweep. All are `[SURFACE]` — identified only.
> `/ideate-discover` runs each through the Node Classification Gate to determine
> sub-domain (folder) vs feature (file), then drills. **Nothing below is confirmed structure.**

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Release Builder & Metadata Validation Gate | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 02 | DDEX Messaging (ERN/DSR/RIN/MWL/MEAD) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 03 | DSP Store Management & Per-Store Delivery Status | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 04 | Release Scheduling, Pre-Save & Editorial Pitch Windows | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 05 | Takedowns & Redelivery | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 06 | Content ID, Fingerprinting & UGC Claiming | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 07 | Identifier Assignment at Delivery | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 08 | Release Rollout Deadlines (feeds Promotion) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |

## Role Matrix

> `[PENDING]` — populated by `/ideate-discover` once `meta/personas.md` exists.
> Provisional personas for this domain (from sweep): artist, label ops, distributor, manager, release coordinator
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | artist | label ops | distributor | manager | release coordinator |
|-------| --- | --- | --- | --- | --- |
| _pending — children unclassified_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | A distinct domain with its own persona (label ops, distributor), its own machinery (DDEX ERN, per-partner conformance, asynchronous partial delivery) and its own destination (the r... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | `/ideate-discover` |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | `/ideate-discover` |
