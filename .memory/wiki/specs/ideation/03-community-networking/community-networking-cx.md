# Community & Networking — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Community & Networking](./community-networking-index.md)
> **Status**: [BREADTH] — 11 children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | The graph is matching's proximity input; matching is the graph's largest consumer by query volume | Musician, Producer | High | 03.03 D-03 scopes scoring to the verified graph; 03.03.02's inputs table lists proximity as a first-class axis |
| CX-02 | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | [03.01 Connections, Follows & Endorsements](./03.01-connections-follows-endorsements/) | The derived graph **supersedes** the manual connection as the domain's real edge set; reachability governs who may request a connection | Musician, Producer, Operator | High | 03.01.02 DT-01 demotes the connection to a supplementary edge; 03.04.01 Q-01 asks whether manual edges enter the graph at all |
| CX-03 | [03.06 Scenes & Communities](./03.06-scenes-communities/) | [03.02 Activity Feed & Ranking](./03.02-activity-feed-ranking/) | Scene membership is a primary feed-ranking axis and the secondary fan-out set; the seeded scene is what makes a new user's feed non-empty | Musician, Producer, Operator, Fan | High | 03.02.02 DT-03 makes geography a primary ranking axis; 03.06.04 DT-01 is the cold-start mechanism the feed depends on |
| CX-04 | [03.06 Scenes & Communities](./03.06-scenes-communities/) | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | The scene graph (03.06.02) is a filtered view of the collaboration graph — and inherits its cold-start emptiness, producing a populated scene with zero density | Musician, Producer, Operator | High | 03.06.02 DT-03 and 03.06.04 DT-04 record this as an **unresolved contradiction** between two of the domain's own decisions |
| CX-05 | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | [03.05 Private Rolodex & CRM](./03.05-private-rolodex-crm/) | The public evidenced graph and the private asserted rolodex answer different questions about the same people — and must never blend | Musician, Producer, Operator | High | `03.05-private-rolodex-crm-cx.md#R-01` forbids notes influencing shared computation; 03.05.01 DT-04 names the tension |
| CX-06 | [03.08 Contests](./03.08-contests-challenges-beat-battles/) | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | Contests are an on-ramp for the uncredited — a partial answer to the rich-get-richer defect matching creates | Musician, Producer | Medium | 03.08.02 DT-02 vs 03.03.01 DT-02; hinges on the unresolved "does a contest generate a credit?" (03.08 Q-03) |
| CX-07 | [03.11 Conference Networking](./03.11-conference-event-networking-mode.md) | [03.06 Scenes & Communities](./03.06-scenes-communities/) | Conference mode is a **temporal scene** — the same mechanism as scene membership with an expiry and a stronger privacy posture | Musician, Producer, Operator | Medium | 03.11 DT-02 and 03.06.01 DT-03 (the touring musician) converge on one mechanism from opposite directions |
| CX-08 | [03.11 Conference Networking](./03.11-conference-event-networking-mode.md) | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | Conference mode is a bounded, reversible **inversion** of reachability — the one context where the wall is the problem | Musician, Producer, Operator | High | 03.11 DT-01; 03.04.04 DT-01 establishes the wall this feature releases |
| CX-09 | [03.02 Activity Feed & Ranking](./03.02-activity-feed-ranking/) | [03.01 Connections, Follows & Endorsements](./03.01-connections-follows-endorsements/) | The follow set is the feed's fan-out target set — the feed has no audience model of its own | Musician, Producer, Operator, Fan | High | 03.02.01 Role Lens; 03.01.01 is named as the feed's primary input |
| CX-10 | [03.07 Forums & Craft Q&A](./03.07-forums-craft-qa.md) | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | Routing a question to people with evidenced craft standing is a matching problem — and is what would make the forum work | Musician, Producer | Medium | 03.07 DT-02: the forum's primary risk is emptiness, and routing (not broadcasting) is the mitigation |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-level references:** Cross-cuts spanning levels are recorded here with a link to the specific lower-level item; the detail of HOW they interact lives in the lower-level CX file.
>
> **Cross-references:** Use format `{filename}#CX-NN` (e.g. `03.04-warm-intros-collaboration-graph-cx.md#CX-02`)

---

## The Domain-Level Principle (found four times independently)

Recorded before the CX details because it is a **domain-level design law**, not four coincidences:

> **Evidence beats participation.** Every time a participation metric was proposed as an input to something
> consequential, it was rejected in favour of an evidence metric.

| Where | Participation metric proposed | Rejected because | Evidence metric used instead |
|---|---|---|---|
| 03.02.02 DT-01 | Engagement-ranked feed | Buries the Producer (who works, doesn't post) — inverts D-18 | Actionability; evidenced events outrank asserted ones |
| 03.03.02 DT-04 | Endorsement counts as a match-scoring input | Inflatable; would make a vanity metric allocate work | The credit graph |
| 03.07 DT-01 | Forum reputation / karma | Measures who posts most, not who knows | Per-craft evidenced credentials |
| 03.08.03 DT-01 | Public voting in contests | Measures follower counts, not the work | Craft-scoped expert panel |

A second, related law appeared three times:

> **Never overstate what is known.** Degraded search results are labelled as degraded (03.03.01 D-03); a
> failed graph traversal returns "unknown", never "no path" (03.04.01 D-03); seeded scene records are
> visibly derived, never presented as verified (03.06.04 D-02).

Both descend directly from problem-statement.md: this product's claim is that it is *not* a reconstruction.
A feature that quietly overstates its confidence, or that lets participation masquerade as evidence, sells
the thesis for engagement.

---

## Cross-Cut Details

### CX-01: Warm Intros & Collaboration Graph ↔ Collaborator Discovery & Matchmaking

**Relationship**: These two sub-domains are one system viewed from two ends. The graph (03.04.01) supplies
proximity — the "2 hops via your bassist" that distinguishes a WeJammin match result from a directory
listing — and matching supplies the query volume that makes the graph a hot path rather than a batch job.
Neither is coherent alone: a match without a path is a tag search, and a graph nobody queries is a table.

**Role scoping**:
- **Musician**: experiences this pair as "the platform found someone, I can see why, and I know who'd introduce me". Per personas.md their pain is re-proving themselves to each new client; the path is the cheapest proof available.
- **Producer**: as the most central node (03.04.01 Role Lens) they appear in most people's paths — so this pair *generates* the inbound flood that 03.04.04 exists to manage. The domain's most valuable persona is punished in proportion to their value (03.04.02 DT-03).
- **Operator**: their edges come from bookings, not credits (03.04.01 DT-03) — this pair only works for them if the graph is multi-source.
- **Fan**: no access to either.

**Synthesis questions answered**:
1. **Shared state conflict**: The graph is owned by 03.04.01 and derived from domain 02; matching reads it. No write contest by design — matching must never write an edge, or match outcomes become forgeable inputs to future matches.
2. **Trigger chain**: Every search (03.03.01) triggers per-candidate traversal. This is the domain's dominant load pattern, routed as not-product to `/create-prd-architecture`.
3. **Permission intersection**: Three-way — a match result must be filtered by reachability (03.04.04) and by blocks (domain 24). An unreachable high-scoring match is a visible dead end, which is worse than an absence.
4. **Notification fan-out**: Only if matching is push (03.03 Q-04), in which case the graph's paths would justify unsolicited proposals — a claim the platform makes about people.
5. **State transition conflict**: The graph changes as credits confirm, so results are non-repeatable between queries. Acceptable — but "I saw someone yesterday and can't find them today" needs a saved-results answer.

---

### CX-02: Warm Intros & Collaboration Graph ↔ Connections, Follows & Endorsements

**Relationship**: The domain's most important internal tension, resolved in the graph's favour. 03.01.02
DT-01 demotes the manual connection from "the domain's core edge" to "a supplementary edge for
relationships with no credit yet", because the domain overview names the click-graph as the repeated
failure. The consequences ripple: connection counts must never be a displayed status metric; connections
should be **pre-seeded from verified credits** (03.01.02 DT-03) rather than requested; and whether manual
edges enter the graph at all is left open (03.04.01 Q-01) rather than assumed. The second half of the pair
is reachability — 03.04.04 governs who may *send* a connection request, making 03.01.02's throttling a
consumer of the graph rather than a rate limiter.

**Role scoping**:
- **Musician**: their graph arrives populated from their credits; manual connections are the residue — people met but not yet worked with.
- **Producer**: generates the most edges of anyone and needs the fewest manual connections, proportionally. That is the design working.
- **Operator**: has almost no credits, so the manual connection is disproportionately their edge — unless the graph reads bookings (03.04.01 DT-03). This is why the multi-source finding matters.
- **Fan**: follows only (03.01 D-02); no graph presence.

**Synthesis questions answered**:
1. **Shared state conflict**: Two edge sets over the same node pairs, deliberately unmerged. 03.04.01 D-01 keeps the derived graph unauthorable; blending would make it forgeable by the cheapest available action.
2. **Trigger chain**: A credit confirmation (domain 02) creates graph edges and may pre-seed connections (03.01.02 DT-03). In the other direction a connection creates no graph edge — ever (`03.04-warm-intros-collaboration-graph-cx.md#R-01`).
3. **Permission intersection**: Reachability (03.04.04) gates connection requests; blocks (24) collapse both edge types atomically (`03.01-connections-follows-endorsements-cx.md#CX-02`).
4. **Notification fan-out**: Both notify, at different weights; follow notifications must aggregate at fan volume (03.01.01 DT-02).
5. **State transition conflict**: A disputed credit (02/24) should suspend the graph edge; whether it also retracts a pre-seeded connection is unresolved (03.01.02 Q-02).

---

### CX-03: Scenes & Communities ↔ Activity Feed & Ranking

**Relationship**: The feed's cold-start problem and the scene's cold-start solution are the same problem.
Per 03.02.01, a new user who follows nobody active sees an empty feed at the exact moment they are deciding
whether the platform is worth their time. Per 03.06.04, a seeded scene is populated before its first member
arrives. The feed therefore depends on scenes for non-emptiness, and scenes depend on the feed for
visibility — 03.06 Q-03 (is a scene a place or a weighting?) is really asking whether the feed is the
scene's surface.

**Role scoping**:
- **Musician / Producer**: scene-weighted feeds are how a thin platform feels local rather than dead.
- **Operator**: per personas.md their context is a phone at a loading dock — a geo-scoped feed is the only version useful in a single glance.
- **Fan**: per D-13a they are the volume, and per personas.md their need is entirely local — scene weighting is not a refinement for them, it is the product.

**Synthesis questions answered**:
1. **Shared state conflict**: Scene membership is owned by 03.06.01; the feed reads it as a ranking axis and a fan-out set.
2. **Trigger chain**: Joining a scene changes feed composition. Per `03.02-activity-feed-ranking-cx.md#CX-01` this either rebuilds a precomputed feed or accepts staleness — the fan-out-on-read-vs-write decision.
3. **Permission intersection**: Scene content inherits each emitting domain's eligibility rules (03.02 D-04); membership grants no visibility of anything otherwise private.
4. **Notification fan-out**: Scene-scoped events could notify members — at D-13a fan volume in a geo scene, this is a notification-storm surface.
5. **State transition conflict**: Leaving a scene stops its content; already-delivered items are the retroactive-removal problem 03.02.01 flags.

---

### CX-04: Scenes & Communities ↔ Warm Intros & Collaboration Graph

**Relationship**: **This pair contains an unresolved contradiction between two of the domain's own
decisions, and it is the most important open item in this file.** 03.06.02 is the scene graph — the
collaboration graph filtered to a scene's members. 03.06.04 seeds scenes from real-world facts (venues,
gigs, locally-credited artists) so they are never empty. But 03.04.01 D-01 says graph edges come **only**
from counter-attested credits on this platform. So a seeded scene shows 60 venues, 400 gigs, and a density
of **zero**: two features telling contradictory stories about the same city on one screen — "Bristol is
thriving" and "nobody here has ever worked together".

Both escape routes are unattractive. Hide density until real edges exist → the scene's only meaningful
metric is absent exactly when a user is judging the platform. Seed edges from public credit data → inject
unverified claims into the graph at scale, in the platform's own voice, violating both 03.04.01 D-01 and
the domain's own "never overstate what is known" law.

Recorded at 03.06.02 DT-03, 03.06.02 Q-01 and 03.06.04 DT-04. **Escalated, not papered over.**

**Role scoping**:
- **Musician / Producer**: see the contradiction directly — a scene that looks busy and reads as unconnected.
- **Operator**: their catchment read (03.06.02 Role Lens) is empty at launch, which is when they most need convincing.
- **Fan**: no graph access, so they see only the populated half — arguably the only persona for whom seeding works cleanly.

**Synthesis questions answered**:
1. **Shared state conflict**: The scene graph is a derived view owning nothing. The conflict is not in state — it is in **narrative**: two truthful features producing an incoherent joint claim.
2. **Trigger chain**: Seeding populates a scene; nothing populates its graph until real credits confirm. **No trigger bridges them, and that is the finding.**
3. **Permission intersection**: The scene graph must respect the graph's visibility rules (03.04.01 Q-02 declines a browsable industry-wide map).
4. **Notification fan-out**: None.
5. **State transition conflict**: A seeded venue claimed by its real owner is the same reconciliation problem as the rolodex's shadow contacts (03.05.01) — the second appearance in this domain, probably needing one shared answer (03.06.04 Q-04).

---

### CX-05: Warm Intros & Collaboration Graph ↔ Private Rolodex & CRM

**Relationship**: The domain holds two graphs of the same industry, and their relationship is that they must
**never touch**. The public graph is derived, evidenced and shared (03.04.01 D-01). The rolodex is asserted,
private and unverifiable (03.05.01 DT-04). Both are legitimate — they answer different questions ("who has
this person actually worked with?" vs "what do I think of them?") — but `03.05-private-rolodex-crm-cx.md#R-01`
forbids the obvious blend, for an architectural rather than aesthetic reason: a private note that demotes
someone in a shared ranking has **leaked through that ranking**.

**Role scoping**:
- **Musician / Producer / Operator**: hold both and will not naturally perceive the boundary — the platform must maintain it for them.
- **Fan**: no access to either.

**Synthesis questions answered**:
1. **Shared state conflict**: None permitted. The rolodex references identities (domain 01); it never reads from or writes to the graph.
2. **Trigger chain**: A shadow contact joining triggers rolodex reconciliation (03.05.01) and must **not** trigger any graph event, or the rolodex's contents become inferable from graph activity.
3. **Permission intersection**: Strictly one-way and closed. A hard architectural rule for `/create-prd-architecture`.
4. **Notification fan-out**: Never, in either direction. 03.05 D-01 is inviolable.
5. **State transition conflict**: An entity merge in domain 01 cascades to both — and must not let one reveal the other.

---

### CX-06: Contests ↔ Collaborator Discovery & Matchmaking

**Relationship**: `[PENDING — /ideate-discover Step 5 deepening]` — 03.03.01 DT-02 identifies the domain's
sharpest defect: evidence-first design is a rich-get-richer machine, because you need credits to be
discoverable, discoverability to get hired, and hiring to get credits. 03.08.02 DT-02 identifies contests
as one of only two escapes (the other is jams, 03.09 DT-01). Whether the escape is real depends entirely on
03.08 Q-03 — **does a contest result generate a credit?** If yes, contests are the graph's on-ramp and are
thesis-critical. If no, they are entertainment. That one question determines this pair's existence and
03.08's MoSCoW placement.

**Synthesis questions answered**: deferred — Medium confidence entry.

---

### CX-07: Conference Networking ↔ Scenes & Communities

**Relationship**: `[PENDING — /ideate-discover Step 5 deepening]` — two sweep candidates (11 and 16) turn
out to describe one mechanism, discovered from opposite directions: 03.11 DT-02 (a conference is a temporal
scene) and 03.06.01 DT-03 (a touring musician needs temporary membership of the city they are in tonight).
Whether they merge is 03.11 Q-02; kept separate for this pass because the privacy posture differs
materially — a geo scene is a persistent affiliation, conference mode broadcasts physical presence and
relaxes contact walls.

**Synthesis questions answered**: deferred — Medium confidence entry.

---

### CX-08: Conference Networking ↔ Warm Intros & Collaboration Graph

**Relationship**: The domain's most restrictive mechanism — 03.04.04's reachability wall, which exists
because the Producer's exit would remove D-18's capture point — has exactly one context where it inverts:
the professional who paid money and travelled specifically to be reached, for 72 hours. Conference mode is
the bounded, reversible release valve on that wall, which is why 03.11 DT-01 rejects the "thin novelty"
reading. Per 03.11 D-01 the reversion must be automatic, because per personas.md nobody will remember to
re-close it.

**Role scoping**:
- **Producer / Operator**: the personas whose walls are highest and whose inversion is most valuable.
- **Musician**: per 03.04.04's Role Lens their wall should be low anyway, so the inversion matters less.
- **Fan**: excluded.

**Synthesis questions answered**:
1. **Shared state conflict**: Conference mode writes a temporary override; the base policy is untouched and restored on expiry.
2. **Trigger chain**: Declaring attendance relaxes the wall for attendees; expiry restores it. **Expiry failure is the feature's worst bug** — a user flooded in March because a conference ended in November.
3. **Permission intersection**: This *is* a permission intersection — a scoped, time-bounded elevation of who may reach you.
4. **Notification fan-out**: Attendee matching may notify; per 03.11 DT-03 nobody is in an app during a conference anyway.
5. **State transition conflict**: Event end time vs user timezone vs an in-flight contact. In-flight contacts should complete.

---

### CX-09: Activity Feed & Ranking ↔ Connections, Follows & Endorsements

**Relationship**: The feed has no audience model of its own — the follow set (03.01.01) *is* its fan-out
target set, with connections as a secondary set at a different weight. Per 03.02.01 D-01 the feed is a
projection of 23 domains' events onto this graph. The load consequence: per D-13a a band with 40k fan
followers makes 03.01.01 the platform's dominant write-amplification driver, which is why fan-out-on-read
vs on-write is routed as not-product.

**Role scoping**:
- **Fan**: their follows are the majority of all edges by volume and produce most of the fan-out cost.
- **Musician / Producer / Operator**: their follows are professional and low-volume; their *followers* may not be.

**Synthesis questions answered**:
1. **Shared state conflict**: Follows are owned by 03.01.01; the feed reads them.
2. **Trigger chain**: A follow changes the fan-out set; an unfollow must stop delivery.
3. **Permission intersection**: Blocks (24) must collapse follows and suppress delivery atomically — a block that severs a connection but leaves the follow keeps the blocked party receiving content (`03.01-connections-follows-endorsements-cx.md#CX-02`).
4. **Notification fan-out**: Per 03.01.01 DT-02, follow notifications at fan volume must aggregate or suppress.
5. **State transition conflict**: An entity merge (domain 01) re-points follows; delivered items referencing a retired entity must resolve.

---

### CX-10: Forums & Craft Q&A ↔ Collaborator Discovery & Matchmaking

**Relationship**: `[PENDING — /ideate-discover Step 5 deepening]` — 03.07 DT-02 finds the forum's primary
risk is emptiness, not moderation: the people worth hearing from are in DAWs and at loading docks, not on
forums. The mitigation is **routing** — put a question in front of the five people with evidenced craft
standing rather than broadcasting it — which is a matching problem (03.03), not a forum feature. If that is
right, the forum's value is deliverable without the forum, which is 03.07 Q-04.

**Synthesis questions answered**: deferred — Medium confidence entry.

---

## Cross-Cut Mechanisms Identified (routed to the global CX)

Discovered during classification. These are **mechanisms serving many domains**, not nodes in this domain.
Recorded here per the Node Classification Gate and returned for the global CX file.

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **Direct Messaging & Conversations** | 03, 04, 05, 06, 07, 13, 14, 16, 17 | **Absent from all 16 candidates** — yet every contact surface in this domain terminates in a conversation. Already implied as shared by D-14's rationale. This domain owns the *policy* over it (03.04.04), not the mechanism. |
| **Verified Collaboration Graph (as a read service)** | 03, 04, 05, 22, 24 | Derivation and traversal are owned at 03.04.01, but 04 (casting), 05 (services ranking), 22 (market intelligence) and 24 (sybil detection) all read it. Product surfaces stay here; the read service spans. |
| **Real-Time Rooms, Presence & Audio Transport** | 03, 05, 06, 07, 08 | Already ratified by D-15. Recorded again because the candidate list bundled presence into 03.02's name — now unbundled (03.02 D-02). |
| **Notifications & Alerts fan-out** | All 24 | The Fan gig-alert path (D-11) routes through follows; 03.02.02 DT-02 finds alert-class events must **bypass ranking entirely**, making this a distinct mechanism from the feed rather than a feature of it. |
| **Blocking, Muting & Harassment Controls** | All 24 | Distinct from reachability (03.04.04 DT-02): blocks are reactive, bilateral, about individuals; reachability is proactive, structural, graph-derived. Blocks are authoritative over every edge in this domain. |
| **Reputation & Trust Signals** | 03, 05, 13, 14, 16, 24 | Endorsements (03.01.03) overlap materially with transactional reviews in the marketplaces — which is why 03.01.03 Q-02 (cut endorsements entirely?) is live. |
| **Referral-at-point-of-decline** | 03, 04, 05, 17 | 03.04.03 DT-01: the economically important referral happens when a booked professional declines work — a moment living in 05, 17 and 04, not here. The node may dissolve into this cross-cut (03.04.03 Q-02). |
| **Pending-action prompts derived from platform state** | 02, 05, 17, 23 | 03.05.03 DT-02: most follow-ups should not be hand-set — the platform already knows the invoice is unpaid and the credit unconfirmed. Pairs with 03.02.01 DT-03 (confirmations as feed cards). |
| **Claiming & shadow-record reconciliation** | 03, 01, 16 | Appears **three times independently**: shadow contacts (03.05.01), seeded venue claiming (03.06.04), entity merge (domain 01). Three divergent implementations would be a defect (03.06.04 Q-04). |
| **Data portability / graph export** | All 24 | problem-statement.md Q-02 asks whether the lock-in is earned or hostile. This domain's graph is the clearest test: if a user leaves, do they take their network? A values decision, not a feature. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 03.05 Private Rolodex | 03.03 Matchmaking | Considered feeding private notes into match scoring — the user's own opinion of a collaborator is genuinely the best signal about them that exists. Rejected as a hard architectural rule (`03.05-private-rolodex-crm-cx.md#R-01`): any read of private data by a shared computation makes that data **inferable from the computation's output**. If my private "avoid" note demotes someone in a ranking, the note has leaked through the ranking. Private data never influences shared computation. |
| R-02 | 03.07 Forums & Craft Q&A | 03.01.03 Endorsements | Considered letting good forum answers generate endorsements or craft credibility — an apparently natural bridge between two features about expertise. Rejected: it converts posting into a credential, which is the participation-over-evidence failure the domain-level principle rejects in four separate places. Answering well proves you are helpful and articulate; it does not prove you can track drums, and per 03.07 D-01 the credit graph already answers that unfarmably. |
| R-03 | 03.08 Contests | 03.02.03 Native Posts | Considered posts-as-entries (`03.08-contests-challenges-beat-battles-cx.md#R-02`). Rejected: an entry accepts rights terms, a post does not. Conflating them means accidentally accepting a rights grant by posting — per personas.md the Musician's named worst-accidental behaviour ("signs a split sheet they don't understand"), automated. |
| R-04 | 03.09 Local Jams | 03.08 Contests | Considered merging them as "scene events" — both are scene rituals where people are evaluated, and both are on-ramps for the uncredited (03.09 DT-01, 03.08.02 DT-02). Rejected: a contest has a brief, eligibility, judging, prizes and **rights**; a jam has none of these, and its whole nature is that it has none of these. Merging drags a rights and payout apparatus onto a Tuesday night in a pub. The shared property (on-ramp for the uncredited) is a *finding about the domain*, not a reason to merge two unlike things. |
| R-05 | 03.06 Scenes | 03.05 Private Rolodex | Considered scene-scoped shared contact lists — a scene's collective rolodex of local promoters and engineers. Rejected: it is 03.05.02 DT-01's shared-notes rejection at a larger and worse scale. A note shared with a *scene* is shared with anyone who joins that scene, forever, including its subject — and it creates a quasi-private artefact with no author and no accountability, the worst possible shape for third-party statements about identifiable people (03.05.02 DT-02). |
| R-06 | 03.02 Activity Feed | 03.05 Private Rolodex | Considered a "people you haven't spoken to in a while" feed prompt sourced from the rolodex — a standard CRM nudge. Rejected for the same reason as R-01, sharpened: it would render private annotations into a surface that is glanceable over someone's shoulder, and per 03.05.03 D-01 nothing in the rolodex may ever reach any surface but its author's own. The feed is a shared-context surface by construction. |
