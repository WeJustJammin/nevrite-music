# Competitive Landscape — WeJammin

> Status: `[DEEP]` — completed `/ideate-validate` 2026-07-18.

## The Structural Observation (the whole thesis in one paragraph)

**Every competitor is a point solution.** A working musician runs their career across Reverb +
SoundBetter + Bandsintown + Splice + DistroKid + a WhatsApp thread + a spreadsheet, with no shared
identity, no shared credit history, and no shared ownership record between any of them. WeJammin's
bet is that consolidating them wins the user, and that being present at the session — where splits
and credits become true — creates a record no point solution can replicate. The credits databases
(Jaxsta, Muso.AI, Sound Credit, Discogs) exist *because* credits are broken, and all fail the same
way: they **reconstruct** credits after the fact from whoever remembers. None were in the room.

## Top Competitors

| Competitor | What they do | Category | Our Angle |
|-----------|-------------|----------|-----------|
| **Reverb** | New/used gear marketplace | Gear (13) | Beat on provenance: gear history that follows the instrument across owners (15), and a seller identity that carries verified credits — a Reverb listing is anonymous, a WeJammin listing is by a known session player. |
| **Discogs** | Marketplace + definitive release/credit DB | Gear (13) / Credits (02) | Discogs credits are crowd-reconstructed after release; ours are captured at the session and counter-attested. Same authority, opposite direction. |
| **Sweetwater / Guitar Center** | Gear retail | Gear (13) | We're a marketplace with community + provenance, not a retailer; the gear connects to the musician's identity and history. |
| **Plugin Boutique / ADSR** | Plugin marketplace | Digital (14) | Comparable digital storefront; our differentiator is the same identity that hires, collaborates, and gets credited — the plugin dev is a known producer, not a faceless vendor. |
| **Splice** | Samples, rent-to-own plugins, collaboration | Digital (14) / Projects (07) | Splice does sounds + light collaboration; we do the full session with split capture at its center. Their collaboration doesn't capture ownership; ours is built around it. |
| **SoundBetter / AirGigs / Vocalizr** | Services marketplace (mix, master, session) | Services (05) | The hire is the funnel into the room. They stop at delivery; we capture the credit and split at the moment the work is delivered — the thing they structurally cannot do. |
| **BandLab / Soundtrap / Kompoz** | Browser DAW + collaboration | Projects (07) | They own the making; we own the making *plus* the provenance and the marketplace around it. A finished BandLab track has no split sheet; a WeJammin project does. |
| **Bandsintown / Songkick** | Gig discovery, fan alerts | Fanbase (20) / Ticketing (19) | Phase 2. Their fan graph is anonymous follows; ours is fed by verified professional identity and connects to the artist's whole career. |
| **Studiotime / Peerspace** | Studio/space booking | Venues (16) | Phase 2. We add advancing, riders, settlement, and the operator's whole workflow, not just a booking calendar. |
| **Prism.fm / Muzeek / Gigwell** | Venue booking + settlement | Live Booking (17) | Phase 2. Same category; our edge is one identity spanning the artist, the agent, and the venue, with settlement reading a bound contract. |
| **Master Tour / Eventric** | Tour + production management | Show Production (18) | Phase 2. Incumbent tooling; we integrate it with the artist's identity, credits, and finances rather than a standalone tour DB. |
| **Sound Credit / Jaxsta / Muso.AI** | Credits databases | **Credits (02)** | **The direct wedge competitor — and the one we beat by construction.** They reconstruct; we capture at source. Detailed below. |
| **Songtrust / Kobalt** | Publishing admin, royalty collection | Royalties (10) | Phase 2 — and likely an **integration partner**, not a rival. We capture the split; they can collect against it. |
| **DistroKid / TuneCore / CD Baby** | Distribution to DSPs | Release (12) | Phase 2 — also a likely **integration** target. We own the pre-release record (splits, credits, masters); distribution is a downstream pipe. |
| **Bandcamp / Patreon / Beatstars** | Direct-to-fan / beats | Fanbase (20) / Digital (14) | Phase 2. Our D2F rides on a verified-artist identity and the fan graph, not a standalone store. |
| **Vampr / Jammcard** | Musician networking | Community (03) | Their graph is "accept?" clicks; ours is derived from verified collaboration, which makes warm intros real rather than spam. |
| **Sonicbids / ReverbNation** | EPKs, submissions | Opportunities (04) | Phase 2. EPKs built from a live, verified credit graph rather than self-asserted claims. |

## The Credits-Database Failure Mode (why domain 02 is whitespace)

Jaxsta, Muso.AI, Sound Credit and Discogs all exist because credits are broken — and all inherit
the same defect: **they ask people to remember.** They ingest liner notes, label submissions, and
self-asserted claims, then try to reconcile them after release. None of them were present when the
session happened, so none can capture the fact at the moment it is true and uncontested. The same
asymmetry governs splits (domain 09): reconstructing a split sheet years later, after a track earns
money and relationships have soured, is the single most litigated failure in music. Capturing it on
the day costs one signature. **A platform that hosts the session is the only kind of system that can
capture provenance at source.** That is not a feature competitors can copy — the copy would have had
to be in the room.

## Unique Differentiators

1. **Split-at-creation** — ownership captured at the moment of creation, not in reconstruction.
   Structurally unrepeatable by any competitor who wasn't present at the session.
2. **A verified credit graph** derived from real sessions, not self-assertion — makes the
   professional network real by construction, which makes hiring, dep-matching, and warm intros
   trustworthy rather than gameable.
3. **Compound effects no point solution can replicate** — gear provenance that follows an instrument
   across owners; payouts that settle against a rights record the platform already holds; a seller
   who is a known, credited professional rather than an anonymous listing.

## Moat

**Earned lock-in, not hostile lock-in.** The moat is the accumulating, verified record of a
musician's career — credits, splits, gear history, reputation — that lives on WeJammin because it
was captured here at the moment it was true, and cannot be reconstructed elsewhere. A user who
leaves doesn't lose access to *data they could export*; they lose the *provenance* that only exists
because the platform was present when the work happened. Network effects compound it: each verified
collaboration strengthens the graph for everyone in it. This is defensible in a way a marketplace or
a DAW alone is not — those compete on price and features; provenance competes on having been there.

## Integration Partners vs Competitors

A key strategic distinction for `/create-prd-stack`: several "competitors" are better modelled as
**integration targets** — WeJammin owns the upstream record (splits, credits, masters) and hands off
to them downstream. Strong candidates: **DistroKid/TuneCore** (distribution), **Songtrust/Kobalt**
(collection), the **PROs** (registration), **Stripe** (payments/payouts). We capture; they execute.

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which competitor is the one to BEAT first? For v1 (session spine + marketplaces), the direct rivals are **SoundBetter** (services) and **Reverb** (gear); the wedge competitor is **Sound Credit/Jaxsta**. | User | `/create-prd` |
| Q-02 | Angle is confirmed as **both** (D-18): consolidation wins users, provenance keeps them. No further decision needed — recorded for traceability. | — | resolved |
| Q-03 | Which of these become integration partners vs rivals in v1? (DistroKid, Songtrust, Stripe are partners, not v1 competitors anyway — they're phase-2 adjacent.) | User | `/create-prd-stack` |
