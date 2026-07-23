# Community & Networking — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `in-source` | **Priority**: `core`

## Overview

The social layer — connections and follows, the activity feed, collaborator matchmaking, warm intros, a private rolodex, and the spaces (genre, craft, city, scene) where music people actually gather.

**Why this is a top-level domain**: In-source ('Professional Networking') but specified as nothing. Distinct from Identity (who exists) and Credits (what you did): this is who you know and what's happening. Network and community stay merged deliberately — the feed reads the graph, scenes densify the graph, and neither half justifies a split alone. The structural insight is that LinkedIn-for-music has failed repeatedly because a graph of 'accept?' clicks is worthless; a graph derived from verified collaboration is real by construction, which makes warm intros meaningful rather than spam. Local scenes are also the only tractable cold-start strategy: 200 users in one city feels alive, 20,000 scattered globally feels dead. Boundary adjusted: the monetized/ticketed half of listening parties moved to Fanbase & D2F, resolving a three-way collision between this domain, Fanbase and Real-Time Jamming. Peer/scene listening sessions stay here and consume the Real-Time Rooms cross-cut rather than owning transport.

**Interacting capabilities** (what justifies domain status):

- connection graph & follows
- activity feed
- collaborator matchmaking
- warm intros
- private rolodex CRM
- community spaces & scenes
- forums/Q&A + contests

## Children

> 16 sweep candidates classified through the Node Classification Gate → **7 sub-domains, 4 domain-level
> features, 25 child features**. 5 candidates merged, 2 nodes added by Deep Think, 6 mechanisms routed to
> cross-cuts, 2 concerns routed to `/create-prd`. All nodes `[SURFACE]`; the domain is `[BREADTH]`.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 03.01 | Connections, Follows & Endorsements | sub-domain | [03.01-connections-follows-endorsements/](./03.01-connections-follows-endorsements/) | [BREADTH] | 10 hypotheses |
| 03.02 | Activity Feed & Ranking | sub-domain | [03.02-activity-feed-ranking/](./03.02-activity-feed-ranking/) | [BREADTH] | 10 hypotheses |
| 03.03 | Collaborator Discovery & Matchmaking | sub-domain | [03.03-collaborator-discovery-matchmaking/](./03.03-collaborator-discovery-matchmaking/) | [BREADTH] | 13 hypotheses |
| 03.04 | Warm Intros & the Collaboration Graph | sub-domain | [03.04-warm-intros-collaboration-graph/](./03.04-warm-intros-collaboration-graph/) | [BREADTH] | 15 hypotheses |
| 03.05 | Private Industry Rolodex & Contact CRM | sub-domain | [03.05-private-rolodex-crm/](./03.05-private-rolodex-crm/) | [BREADTH] | 10 hypotheses |
| 03.06 | Scenes & Communities | sub-domain | [03.06-scenes-communities/](./03.06-scenes-communities/) | [BREADTH] | 14 hypotheses |
| 03.07 | Forums & Craft Q&A | feature | [03.07-forums-craft-qa.md](./03.07-forums-craft-qa.md) | [SURFACE] | 3 hypotheses |
| 03.08 | Contests, Challenges & Beat Battles | sub-domain | [03.08-contests-challenges-beat-battles/](./03.08-contests-challenges-beat-battles/) | [BREADTH] | 14 hypotheses |
| 03.09 | Local Jam & Open Mic Discovery | feature | [03.09-local-jam-open-mic-discovery.md](./03.09-local-jam-open-mic-discovery.md) | [SURFACE] | 3 hypotheses |
| 03.10 | Peer & Scene Listening Rooms | feature | [03.10-peer-scene-listening-rooms.md](./03.10-peer-scene-listening-rooms.md) | [SURFACE] | 3 hypotheses |
| 03.11 | Conference & Industry Event Networking Mode | feature | [03.11-conference-event-networking-mode.md](./03.11-conference-event-networking-mode.md) | [SURFACE] | 3 hypotheses |

> **Type column values:**
> - `domain` — a top-level grouping within a surface (folder with index + CX)
> - `sub-domain` — a grouping within a domain that has 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Classification Record

| Sweep candidate | Outcome |
|---|---|
| 01 Connections, Follows & Endorsements | → **03.01** (sub-domain — 3 distinct edge types with different consent models) |
| 02 Activity Feed, Ranking & Presence | → **03.02**; **presence unbundled** to the ratified D-15 cross-cut |
| 03 Collaborator Discovery & Matchmaking | → **03.03** (merged with 04 + 08) |
| 04 Open Collaboration Calls | → **merged** into 03.03 as 03.03.04 (the demand side of one market) |
| 05 Warm Introductions & Referral Requests | → **merged** into 03.04 (near-duplicate of 06) |
| 06 Collaboration Graph & Verified Warm Intros | → **merged** into 03.04; graph-as-read-service → **cross-cut** |
| 07 Private Industry Rolodex & Contact CRM | → **03.05** (sub-domain — reconciliation is the interacting problem) |
| 08 Open-To Status & Availability Signals | → **merged** into 03.03 as 03.03.03 (the supply side of one market) |
| 09 Local Scenes & Geo Communities | → **merged** into 03.06 (one mechanism, partition key = geo) |
| 10 Local Scene Graph | → **merged** into 03.06 as 03.06.02 (a filtered view of the collaboration graph) |
| 11 Genre & Craft Scenes | → **merged** into 03.06 (same mechanism, partition key = genre/craft) |
| 12 Forums & Craft Q&A | → **03.07** (feature — one capability; promotion condition recorded) |
| 13 Contests, Challenges & Beat Battles | → **03.08** (sub-domain — brief→eligibility→judging→prizes→**rights** chain) |
| 14 Local Jam & Open Mic Discovery | → **03.09** (feature) |
| 15 Listening Sessions & Live Audio Rooms (peer/scene) | → **03.10** (feature; consumes the D-15 cross-cut) |
| 16 Conference & Industry Event Networking Mode | → **03.11** (feature; = a temporal scene, see CX-07) |
| **+ Reachability & Inbound Contact Policy** | **Deep Think addition** → 03.04.04. Not in the sweep. The largest gap. |
| **+ Scene Seeding, Claiming & Cold Start** | **Deep Think addition** → 03.06.04. Not in the sweep. Makes the domain's own cold-start claim non-circular. |

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 03.01-connections-follows-endorsements | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 03.02-activity-feed-ranking | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 03.03-collaborator-discovery-matchmaking | ✅ Full | ✅ Full | 👁️ Read-only | ❌ None |
| 03.04-warm-intros-collaboration-graph | ✅ Full | ✅ Full | ✅ Full | ⚙️ Config |
| 03.05-private-rolodex-crm | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 03.06-scenes-communities | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 03.07-forums-craft-qa | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 03.08-contests-challenges-beat-battles | ✅ Full | ✅ Full | ⚙️ Config | 👁️ Read-only |
| 03.09-local-jam-open-mic-discovery | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 03.10-peer-scene-listening-rooms | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 03.11-conference-event-networking-mode | ✅ Full | ✅ Full | ✅ Full | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> **Rules:**
> - Persona names come from `meta/personas.md` (D-19) — Musician · Producer · Operator · Fan
> - NEVER redefine a persona here — reference only
> - Access icons are shorthand; detailed per-role behavior lives in each feature file's **Role Lens**
>
> **Reading the Fan column**: the Fan's access is `Full` only where a feature was built for them
> (03.02 feed, 03.09 jams/open mics) and `None` wherever a feature is professional-only. Per personas.md
> the Fan's "surface must be a different product wearing the same brand" — the ❌ entries are deliberate
> and are the domain's main defence of the Producer persona, whose exit would remove D-18's capture point.
>
> **Reading the Operator column**: `Read-only`/`Config` entries mostly reflect that the Operator's real
> equivalent lives in domains 16/17 (their calendar, their bookings), not that they are second-class.
> The exception is 03.04.01 DT-03 — **a credit-only graph makes the Operator invisible**, which is a live
> structural finding, not a permission choice.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | In-source ('Professional Networking') but specified as nothing. Distinct from Identity (who exists) and Credits (what you did): this is who you know and what's happening. Network a... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **The derived collaboration graph supersedes the manual connection** as this domain's real edge set | The domain overview names the click-graph as the repeated failure of LinkedIn-for-music. 03.01.02 DT-01 demotes the connection to a supplementary edge for relationships with no credit yet. Consequence: connection counts are never a status metric, and connections should be pre-seeded from verified credits rather than requested. | `/ideate-discover` Step 3; domain overview; D-18 |
| D-03 | **Evidence beats participation** — a domain-level design law | Found independently four times (feed ranking, match scoring, forum reputation, contest voting): every participation metric proposed as an input to something consequential was rejected for an evidence metric. Descends from D-18 — participation masquerading as evidence sells the thesis for engagement. Full table in `community-networking-cx.md`. | `/ideate-discover` Step 3, four sub-domains independently |
| D-04 | **Never overstate what is known** — a domain-level design law | Found three times: degraded search results are labelled (03.03.01 D-03); a failed traversal returns "unknown" not "no path" (03.04.01 D-03); seeded records are visibly derived (03.06.04 D-02). Descends from problem-statement.md — this product's claim is that it is not a reconstruction. | `/ideate-discover` Step 3, three sub-domains independently |
| D-05 | **Domain 02 (Credits) is a hard upstream dependency of this domain** | The graph is derived from counter-attested credits (03.04.01 D-01), and the graph is what makes matching, intros and reachability non-generic. Nothing in 03.03/03.04 has value before credits have volume. This is a **sequencing fact with direct MoSCoW force**: shipping intros before credits ships an empty product. | `/ideate-discover` Step 3; 03.04.01 DT-01 |
| D-06 | Presence is **not** owned here — it is the ratified D-15 cross-cut | The sweep's candidate 02 bundled presence into the feed's name. D-15 already extracted `Real-Time Rooms, Presence & Audio Transport` as a cross-cut serving Education, Services, Projects and Community. Unbundled. | D-15; 03.02 D-02 |
| D-07 | Scene stewards are **not a fifth persona** | The sweep's provisional persona list included "scene organiser". D-19 ratifies four personas; per personas.md's multi-hyphenate structural fact, a scene organiser is a Musician or Operator wearing another hat. | D-19; 03.06 D-05 |
| D-08 | 03.05 (Private Rolodex) is a **declared cut candidate** | It is the least thesis-aligned node in the domain (D-18: provenance is the wedge, consolidation is the platform — a private notes app is neither) and carries the domain's highest compliance exposure (03.05.02 DT-02: third-party-authored personal data with subject rights the author does not control). Recorded honestly rather than defended. | `/ideate-discover` Step 3; 03.05 D-04 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — see the Children table and Classification Record. | Agent | ✅ `/ideate-discover` Step 3 |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — 6 mechanisms routed; see `community-networking-cx.md`. Notably **Direct Messaging was absent from all 16 candidates** yet every contact surface here terminates in one. | Agent | ✅ `/ideate-discover` Step 3 |
| Q-03 | **Is 03.03.04 (Open Collaboration Calls) a duplicate of domain 04 (Opportunities & Casting)?** The stated boundary is "has a hiring process", which is thin — and users do not classify their own needs. The counter-argument for keeping it: 03.03.04 DT-02 finds a call is the earliest possible split-capture point, which is thesis-shaped. The single most likely structural error in this domain. | User | `/create-prd-architecture` |
| Q-04 | ~~**How is the seeded-population / zero-density contradiction resolved?** (`community-networking-cx.md#CX-04`) A seeded scene shows 60 venues and a graph density of zero on the same screen.~~ **RESOLVED** — city facts and platform density are answers to **different questions with different subjects** and must never share an axis or a widget; the contradiction was a presentation defect, so nothing is hidden, nothing is blended, and no edge is seeded (03.04.01 D-01 holds). | User | ✅ Resolved — [03.06.04](./03.06-scenes-communities/03.06.04-scene-seeding-claiming-cold-start.md) D-13 / DT-13; `community-networking-cx.md#CX-04` |
| Q-05 | [OWNER] **How does a musician with no credits get discovered?** (03.03.01 DT-02) Evidence-first ranking is a rich-get-richer machine: you need credits to be discoverable, discoverability to get hired, and hiring to get credits. The domain has only two escapes — contests (03.08.02 DT-02) and jams (03.09 DT-01) — and the first only works if a contest generates a credit (03.08 Q-03). | User | `/create-prd` |
| Q-06 | ~~**Does the collaboration graph read booking data (domain 17), not just credits?** (03.04.01 DT-03)~~ **RESOLVED** — yes. Edges are **multi-source with per-source evidentiary class**, decided precisely because "a credit-only graph makes the Operator persona invisible and strands domains 16/17". Which domain-17 edges qualify (public performance vs consented private booking) is the narrower residue, tracked as 03.04.01 Q-04. | User | ✅ Resolved — [03.04.01](./03.04-warm-intros-collaboration-graph/03.04.01-collaboration-graph-path-finding.md) D-02 |
| Q-07 | **What is the reachability default, given that one human is routinely three personas in a day?** (03.04.04 DT-04) The Producer needs a wall, the Musician needs openness, and they are the same person on the same account. Keying the default to a persona is impossible. 03.04.04 D-04 fixes only the launch posture (density-gated, permissive until the graph is dense); the steady-state default is the inbound-contact permission model itself. | User | `/create-prd-security` |
| Q-08 | **What is the DSAR answer for third-party-authored statements about a person?** (03.05.02 DT-02, 03.01.03 DT-04) Private rolodex notes and endorsements are the **same problem twice** and need one answer: honouring exposes the author, refusing may be unlawful. | User | `/create-prd-security` |
| Q-09 | ~~**Is the feed a Must at all?** (03.02 Q-02)~~ **RESOLVED** — no. The MoSCoW ledger places **03.02.01 Feed Composition at Should**, **03.02.02 Ranking & Feed Controls at Could** and **03.02.03 Native Posts at Won't**, while **03.01.01 Follows is a Must** — the edge the Fan's alert path rides on. 03.02.02's rationale states it directly: "the Fan's actual value (gig alerts) bypasses ranking, and at cold start there is no engagement data to rank on anyway." The alert path is the Must; the feed is not. | User | ✅ Resolved — [moscow-ledger.md](../moscow-ledger.md) |
| Q-10 | Is "temporal scene membership" one mechanism serving three surfaces? (`#CX-07`) Conference mode (03.11 DT-02) and the touring musician (03.06.01 DT-03) were found independently and describe the same thing. Step 6 narrowed it to a **composition** (temporal membership + bounded reachability relaxation) explicitly "without pre-empting" the fold question; what remains is the component boundary. | User | `/create-prd-architecture` |
| Q-11 | ~~Q-01 in personas.md asks whether a dealer persona is needed for domains 13/14/15.~~ **RESOLVED for this domain** — not triggered here: the Role Matrix is served by the four personas, and the Operator's thinness (see the Role Matrix note) was a **graph-source problem** now closed by Q-06 (03.04.01 D-02, multi-source edges), not a persona gap. The dealer-persona question itself remains open under its own owner and has been re-pointed to `/create-prd`. | Agent | ✅ Resolved — [personas.md](../meta/personas.md) Q-01 · [vision.md](../../vision.md) Q-05 |

## Not-Product Concerns Routed Out

> Architecture/NFR concerns discovered during classification. Not nodes here.

| Concern | Why not product | Routed to |
|---|---|---|
| **Graph storage + 2-hop traversal on a hot path** | Per `#CX-02`, reachability makes graph traversal run on **every inbound contact attempt**, and per `#CX-01` matching runs it per-candidate per-query. Recursive CTEs over Supabase Postgres at this frequency is an architecture decision, not a product one — and it is the largest technical consequence of this domain. | `/create-prd-architecture` |
| **Feed fan-out on read vs write** | Per D-13a a band with 40k fan followers sets the platform's write amplification; per `#CX-03` a suppression control that stops fan-out (rather than filtering at render) changes the model again. | `/create-prd-architecture` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-13a|D-13a]]
