# Community & Networking — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Community & Networking](./community-networking-index.md)
> **Status**: [DEEP] — 11 children classified; intra-domain cross-cuts synthesised (Step 6). 5 synthesis questions answered for every High-confidence pair.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | The graph is matching's proximity input; matching is the graph's largest consumer by query volume. Scoping tightened Step 6: scoring may use only paths rooted at the **searcher's** node (03.04.01 D-06), so proximity is a per-result-set fact, never a general graph statistic | Musician, Producer | High | 03.03 D-03 scopes scoring to the verified graph; 03.03.02 lists proximity as a first-class axis; 03.04.01 D-06 (ego-rooted only) |
| CX-02 | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | [03.01 Connections, Follows & Endorsements](./03.01-connections-follows-endorsements/) | The derived graph **supersedes** the manual connection as the domain's real edge set; reachability governs who may request a connection. Step 6 adds a third traversal hot path: 03.01.01 D-06 tiers follow notifications on **2-hop graph distance**, putting a traversal on every follow *write* at fan volume | Musician, Producer, Operator | High | 03.01.02 DT-01 demotes the connection; 03.04.01 D-06/D-10 (manual edges never enter the graph — resolves 03.04.01 Q-01); 03.01.01 D-06 |
| CX-03 | [03.06 Scenes & Communities](./03.06-scenes-communities/) | [03.02 Activity Feed & Ranking](./03.02-activity-feed-ranking/) | Scene membership is a feed-ranking axis and secondary fan-out set; the seeded scene is what makes a new user's feed non-empty. Step 6 hardens the direction: per 03.06.01 DT-12 the dependency runs **one way only** — if the feed is cut (domain Q-09), scenes must survive intact. A scene is not a feed weighting | Musician, Producer, Operator, Fan | High | 03.02.02 DT-03 (geography a primary ranking axis); 03.06.04 DT-01 (cold-start mechanism); 03.06.01 DT-12 |
| CX-04 | [03.06 Scenes & Communities](./03.06-scenes-communities/) | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | The scene graph (03.06.02) is a filtered view of the collaboration graph. **The seeded-population / zero-density contradiction is now RESOLVED** (DT-13/D-13): city facts and platform density are answers to different questions with different subjects and must never share an axis | Musician, Producer, Operator | High | 03.06.02 Q-01 resolved by 03.06.04 DT-13/D-13; 03.04.01 D-01 (edges from counter-attested credits only) |
| CX-05 | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | [03.05 Private Rolodex & CRM](./03.05-private-rolodex-crm/) | The public evidenced graph and the private asserted rolodex answer different questions about the same people — and must never blend | Musician, Producer, Operator | High | `03.05-private-rolodex-crm-cx.md#R-01` forbids notes influencing shared computation; 03.05.01 DT-04 |
| CX-06 | [03.08 Contests](./03.08-contests-challenges-beat-battles/) | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | Contests are an on-ramp for the uncredited — a partial answer to the rich-get-richer defect matching creates | Musician, Producer | Medium | 03.08.02 DT-02 vs 03.03.01 DT-02; hinges on the unresolved "does a contest generate a credit?" (03.08 Q-03) |
| CX-07 | [03.11 Conference Networking](./03.11-conference-event-networking-mode.md) | [03.06 Scenes & Communities](./03.06-scenes-communities/) | Conference mode is a **composition, not a merge**: temporal membership (03.06.01 D-07) + bounded reachability relaxation (03.04.04). Step 6 states it as composition to narrow the fold question (Q-10) without pre-empting it | Musician, Producer, Operator | High | 03.11 DT-02, DT-03 (persistence — the value is what survives the event); 03.06.01 D-07 (visiting membership) |
| CX-08 | [03.11 Conference Networking](./03.11-conference-event-networking-mode.md) | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) | Conference mode is a bounded, reversible **inversion** of reachability — the one context where the wall is the problem | Musician, Producer, Operator | High | 03.11 DT-01; 03.04.04 DT-01 establishes the wall this feature releases |
| CX-09 | [03.02 Activity Feed & Ranking](./03.02-activity-feed-ranking/) | [03.01 Connections, Follows & Endorsements](./03.01-connections-follows-endorsements/) | The follow set is the feed's fan-out target set — the feed has no audience model of its own. The follow edge's alert scope (03.01.01 D-05) and the feed's reader controls (03.02.02 D-05) are two halves of **one control surface** and must not diverge into two settings pages | Musician, Producer, Operator, Fan | High | 03.02.01 Role Lens; 03.01.01 D-05 (alert scope) ↔ 03.02.02 D-04/D-05 (alert-class bypasses ranking) |
| CX-10 | [03.07 Forums & Craft Q&A](./03.07-forums-craft-qa.md) | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | Routing a question to people with evidenced craft standing is a matching problem — and is what would make the forum work | Musician, Producer | Medium | 03.07 DT-02: the forum's primary risk is emptiness; routing (not broadcasting) is the mitigation |
| CX-11 | [03.01 Connections, Follows & Endorsements](./03.01-connections-follows-endorsements/) | [03.06 Scenes & Communities](./03.06-scenes-communities/) | **NEW (Step 6).** Bidirectional. A seeded venue record accrues follows *before* its Operator signs up, so claiming inherits an audience (03.06.04 DT-08) — the strongest onboarding hook in the domain and a real switching trigger | Musician, Producer, Operator, Fan | High | 03.06.04 DT-08; 03.01.01 follow set; personas.md switching triggers |
| CX-12 | [03.06 Scenes & Communities](./03.06-scenes-communities/) | [03.05 Private Rolodex & CRM](./03.05-private-rolodex-crm/) | **NEW (Step 6).** Persistence rule: what survives a visiting membership's expiry is a **rolodex entry**. Expiry removes scene membership, never anything created inside it | Musician, Producer, Operator | High | 03.11 DT-03 ("the value is what survives the event") reaching the touring case; 03.05.01 contact records |
| CX-13 | [03.03 Collaborator Discovery & Matchmaking](./03.03-collaborator-discovery-matchmaking/) | [03.04 Warm Intros & Collaboration Graph](./03.04-warm-intros-collaboration-graph/) (03.04.04 Reachability) | **NEW (Step 6).** Reachability read as a discovery filter: unreachable candidates (block / inbound policy) must be filtered **before render**, not shown-and-failed. A signal + a closed wall is a self-inflicted dead end the declaration surface must surface | Musician, Producer | High | 03.03.01 (pre-render filter); 03.03.03 (signal ↔ reachability contradiction); 03.04.04 (permission gate on discovery output) |

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

A third law crystallised in Step 6, governing the two-graph structure of this domain:

> **The graph-as-read-service is not one contract but three, and conflating them is how ego-rooting gets
> quietly broken.** (1) **Ego-rooted pairwise** — 03.03, 03.04, and external 04/05; the only contract with a
> user-facing surface. (2) **Aggregate / non-identifying** — scene density, market intelligence (22); never
> exposes a pair. (3) **Permission gate** — reachability (03.04.04), evaluated on the message-send path.
> Building any of the three by widening another's query surface silently re-introduces the enumeration the
> ego-rooting rule (03.04.01 D-06) exists to prevent.

All descend directly from problem-statement.md: this product's claim is that it is *not* a reconstruction.
A feature that quietly overstates its confidence, lets participation masquerade as evidence, or lets an
aggregate read answer a pairwise question, sells the thesis for engagement.

---

## Cross-Cut Details

### CX-01: Warm Intros & Collaboration Graph ↔ Collaborator Discovery & Matchmaking

**Relationship**: These two sub-domains are one system viewed from two ends. The graph (03.04.01) supplies
proximity — the "2 hops via your bassist" that distinguishes a WeJammin match result from a directory
listing — and matching supplies the query volume that makes the graph a hot path rather than a batch job.
Step 6 tightened the contract: scoring may consume **only paths rooted at the searcher's own node**
(03.04.01 D-06), so proximity is computable for a result set but is never a general graph statistic a caller
could harvest. Neither half is coherent alone: a match without a path is a tag search, a graph nobody
queries is a table.

**Role scoping**:
- **Musician**: experiences this pair as "the platform found someone, I can see why, and I know who'd introduce me". Per personas.md their pain is re-proving themselves to each new client; the path is the cheapest proof available.
- **Producer**: as the most central node (03.04.01 Role Lens) they appear in most people's paths — so this pair *generates* the inbound flood that 03.04.04 exists to manage. The most valuable persona is punished in proportion to their value (03.04.02 DT-03, star-topology brokerage).
- **Operator**: their edges come from settled public performances, not credits (03.04.01 DT-03) — this pair only works for them if the graph is multi-source.
- **Fan**: no access to either.

**Synthesis questions answered**:
1. **Shared state conflict**: The graph is owned by 03.04.01 and derived from domain 02; matching reads it. No write contest by design — matching must never write an edge, or match outcomes become forgeable inputs to future matches.
2. **Trigger chain**: Every search (03.03.01) triggers per-candidate ego-rooted traversal (sync, at request time). This is the domain's dominant load pattern, routed as not-product to `/create-prd-architecture`. No rollback semantics — reads only.
3. **Permission intersection**: Three-way — a match result must be filtered by reachability (03.04.04, see CX-13) and by blocks (domain 24). An unreachable high-scoring match is a visible dead end, worse than an absence.
4. **Notification fan-out**: Only if matching is push (03.03 Q-04), in which case the graph's paths would justify unsolicited proposals — a claim the platform makes about people.
5. **State transition conflict**: The graph changes as credits confirm, so results are non-repeatable between queries. Acceptable — but "I saw someone yesterday and can't find them today" needs a saved-results answer.

---

### CX-02: Warm Intros & Collaboration Graph ↔ Connections, Follows & Endorsements

**Relationship**: The domain's most important internal tension, resolved in the graph's favour. 03.01.02
DT-01 demotes the manual connection to "a supplementary edge for relationships with no credit yet"; Step 6
closes the open question — per 03.04.01 D-10/DT-02 **manual edges never enter the graph at all** (resolves
03.04.01 Q-01: "at a lower weight is still blending"). Consequences: connection counts are never a displayed
status metric; connections are pre-seeded from verified credits (03.01.02 DT-03) rather than requested; and
reachability (03.04.04) governs who may *send* a request. Step 6 also surfaced a **third traversal hot
path**: 03.01.01 D-06 tiers follow notifications on 2-hop graph distance, which puts a graph traversal on
every follow *write* at fan volume — beyond the two read hot paths the domain index already routed out.

**Role scoping**:
- **Musician**: their graph arrives populated from credits; manual connections are the residue — people met but not yet worked with.
- **Producer**: generates the most edges of anyone and needs the fewest manual connections, proportionally. That is the design working.
- **Operator**: has few credits, so the manual connection is disproportionately their edge — unless the graph reads settled public performances (03.04.01 DT-03/DT-08). This is why the multi-source finding matters.
- **Fan**: follows only (03.01 D-02); no graph presence.

**Synthesis questions answered**:
1. **Shared state conflict**: Two edge sets over the same node pairs, deliberately unmerged. 03.04.01 D-01/D-10 keeps the derived graph unauthorable; blending would make it forgeable by the cheapest available action.
2. **Trigger chain**: A credit confirmation (domain 02) creates graph edges and may pre-seed connections (async, 03.01.02 DT-03). In the other direction a connection creates no graph edge — ever (`03.04-warm-intros-collaboration-graph-cx.md#R-01`). A follow *write* now triggers a 2-hop traversal to tier its notification (03.01.01 D-06); fallback if the traversal is too costly is a distance-agnostic notification, degrading value not correctness.
3. **Permission intersection**: Reachability (03.04.04) gates connection requests; blocks (24) collapse both edge types atomically (`03.01-connections-follows-endorsements-cx.md#CX-02`).
4. **Notification fan-out**: Both notify, at different weights; follow notifications must aggregate at fan volume (03.01.01 DT-02) and are tiered by graph distance (D-06).
5. **State transition conflict**: A disputed credit (02/24) suspends the graph edge; per 03.01.01 DT-11/D-12 a connection *accept* must **not** auto-create a follow (would manufacture follows at scale and inflate the one metric that must stay honest).

---

### CX-03: Scenes & Communities ↔ Activity Feed & Ranking

**Relationship**: The feed's cold-start problem and the scene's cold-start solution are the same problem. A
new user who follows nobody active sees an empty feed at the exact moment they are deciding whether the
platform is worth their time (03.02.01); a seeded scene is populated before its first member arrives
(03.06.04). Step 6 hardened the coupling into a **one-way dependency** (03.06.01 DT-12): scene membership is
a ranking axis, but a scene must never be *defined as* a feed weighting — because the feed is the
most-likely-to-be-cut feature (domain Q-09) and the scene is the cold-start mechanism that cannot be cut. If
the feed dies, scenes must survive intact.

**Role scoping**:
- **Musician / Producer**: scene-weighted feeds are how a thin platform feels local rather than dead.
- **Operator**: per personas.md their context is a phone at a loading dock — a geo-scoped feed is the only version useful in a single glance.
- **Fan**: per D-13a they are the volume, and per personas.md their need is entirely local — scene weighting is not a refinement, it is the product.

**Synthesis questions answered**:
1. **Shared state conflict**: Scene membership is owned by 03.06.01; the feed reads it as a ranking axis and a fan-out set. Per DT-12 the feed may never write scene state — the dependency is strictly feed→scene-read.
2. **Trigger chain**: Joining a scene changes feed composition (async recompute or accept staleness — the fan-out-on-read-vs-write decision, `03.02-activity-feed-ranking-cx.md#CX-01`). If the recompute fails, the feed degrades to global ranking, never errors.
3. **Permission intersection**: Scene content inherits each emitting domain's eligibility rules (03.02 D-04); membership grants no visibility of anything otherwise private.
4. **Notification fan-out**: Scene-scoped events could notify members — at D-13a fan volume in a geo scene, this is a notification-storm surface, deduped via the Notifications cross-cut.
5. **State transition conflict**: Leaving a scene stops its content; per 03.06.01 a steward redefining a scene must not invalidate an in-flight join, and already-delivered items are the retroactive-removal problem 03.02.01 flags.

---

### CX-04: Scenes & Communities ↔ Warm Intros & Collaboration Graph

**Relationship**: The scene graph (03.06.02) is the collaboration graph filtered to a scene's members. In
the [BREADTH] pass this pair carried the domain's sharpest open contradiction: a seeded scene showing 60
venues and a graph density of zero on one screen. **Step 6 resolves it (03.06.04 DT-13/D-13).** City facts
("Bristol: 60 rooms, 400 announced gigs") and platform density ("WeJammin knows N connected people here")
are answers to **different questions with different subjects** and must never share an axis or a widget.
Seeded population describes the *city*; density describes *the platform's knowledge of the city*. Displaying
them as one number was the error; displaying them as two honestly-labelled facts is coherent and is in fact
the domain's "never overstate what is known" law applied to a screen. No edges are ever seeded into the
graph (03.04.01 D-01 holds); the fix is presentational and subject-separating, not a graph-seeding
compromise.

**Role scoping**:
- **Musician / Producer**: see two labelled facts — "the city is busy" and "the platform is early here" — instead of one incoherent one.
- **Operator**: their catchment read (03.06.02 Role Lens) shows real venue coverage immediately and platform density as a separate, growing number — honest at launch, which is when they most need convincing.
- **Fan**: no graph access; they see only the city-facts half, which seeds cleanly.

**Synthesis questions answered**:
1. **Shared state conflict**: The scene graph is a derived, aggregate/non-identifying view (contract 2 of the three-contract law) owning nothing. It must never widen into the ego-rooted pairwise contract.
2. **Trigger chain**: Seeding populates city facts (03.06.04); real credit confirmations (02) populate density independently. No trigger bridges them by design — that separation *is* the resolution.
3. **Permission intersection**: The scene graph respects aggregate-only visibility (03.04.01 Q-02 declines a browsable industry-wide pairwise map); it must not become the enumeration route that 03.06.01 D-10 (aggregate-not-roster) closes.
4. **Notification fan-out**: None.
5. **State transition conflict**: A seeded venue claimed by its real owner (CX-11) is the same reconciliation family as shadow-contact claiming (03.05.01) and entity merge (01) — but per 03.06.04 D-14 these are **not one mechanism**: seeded premises are public + identity-verified; shadow contacts are private + author-confirmed + never signal their subject.

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

**Relationship**: 03.03.01 DT-02 identifies the domain's sharpest defect: evidence-first design is a
rich-get-richer machine, because you need credits to be discoverable, discoverability to get hired, and
hiring to get credits. 03.08.02 DT-02 identifies contests as one of only two escapes (the other is jams,
03.09 DT-01). Whether the escape is real depends entirely on 03.08 Q-03 — **does a contest result generate a
credit?** If yes, contests are the graph's on-ramp and are thesis-critical. If no, they are entertainment.
That one question determines this pair's existence and 03.08's MoSCoW placement.

**Synthesis questions answered**: deferred — Medium confidence; gated on 03.08 Q-03 (`/ideate-validate`).

---

### CX-07: Conference Networking ↔ Scenes & Communities

**Relationship**: Two sweep candidates (11 and 16) describe one mechanism, found from opposite directions:
03.11 DT-02 (a conference is a temporal scene) and 03.06.01 DT-03 (a touring musician needs temporary
membership of the city they are in tonight). **Step 6 states this as a composition, not a merge**: conference
mode = temporal membership (03.06.01 D-07) + bounded reachability relaxation (03.04.04), which narrows the
fold question (Q-10) without pre-empting it. Per 03.11 DT-03 the persistence finding applies identically to
the touring case — the value is what survives the event (a rolodex entry, see CX-12), not the membership
itself, which expires. The privacy postures still differ materially (a geo scene is a persistent
affiliation; conference mode broadcasts physical presence), which is why they are composed rather than
unified in this pass.

**Synthesis questions answered**: deferred — Medium confidence on the *merge* question (Q-10); the composition itself is High confidence and its synthesis rides on CX-08 (reachability) and CX-12 (persistence).

---

### CX-08: Conference Networking ↔ Warm Intros & Collaboration Graph

**Relationship**: The domain's most restrictive mechanism — 03.04.04's reachability wall, which exists
because the Producer's exit would remove D-18's capture point — has exactly one context where it inverts:
the professional who paid money and travelled specifically to be reached, for 72 hours. Conference mode is
the bounded, reversible release valve on that wall, which is why 03.11 DT-01 rejects the "thin novelty"
reading. Per 03.11 D-01 the reversion must be automatic, because per personas.md nobody will remember to
re-close it. Step 6 records the boundary sharply from the scene side: **visiting membership does NOT relax
walls** (03.06.01 D-07) — only conference mode's explicit, bounded relaxation does. The adjacency to
scene-membership makes the opposite assumption easy and it would be a serious privacy regression.

**Role scoping**:
- **Producer / Operator**: the personas whose walls are highest and whose inversion is most valuable.
- **Musician**: per 03.04.04's Role Lens their wall should be low anyway, so the inversion matters less.
- **Fan**: excluded.

**Synthesis questions answered**:
1. **Shared state conflict**: Conference mode writes a temporary override; the base policy is untouched and restored on expiry. Visiting scene membership writes no override at all (D-07).
2. **Trigger chain**: Declaring attendance relaxes the wall for attendees; expiry restores it. **Expiry failure is the feature's worst bug** — a user flooded in March because a conference ended in November. Reversion is time-triggered and must be idempotent.
3. **Permission intersection**: This *is* a permission intersection — a scoped, time-bounded elevation of who may reach you, distinct from and not conferred by scene membership.
4. **Notification fan-out**: Attendee matching may notify; per 03.11 DT-03 nobody is in an app during a conference anyway, so the value lands as a post-event digest.
5. **State transition conflict**: Event end time vs user timezone vs an in-flight contact. In-flight contacts should complete; the wall re-raising mid-contact must not fail an already-sanctioned message.

---

### CX-09: Activity Feed & Ranking ↔ Connections, Follows & Endorsements

**Relationship**: The feed has no audience model of its own — the follow set (03.01.01) *is* its fan-out
target set, with connections as a secondary set at a different weight. Per 03.02.01 D-01 the feed is a
projection of 23 domains' events onto this graph. Step 6 surfaced a control-surface unification: the follow
edge's **alert scope** (03.01.01 D-05) and the feed's **reader controls** (03.02.02 D-05) are two halves of
one control surface and MUST NOT diverge into two settings pages — and 03.02.02 D-04 (alert-class events
bypass ranking entirely) is what makes the follow edge carry the Fan's actual value. The load consequence:
per D-13a a band with 40k fan followers makes 03.01.01 the platform's dominant write-amplification driver,
which is why fan-out-on-read vs on-write is routed as not-product.

**Role scoping**:
- **Fan**: their follows are the majority of all edges by volume and produce most of the fan-out cost; the alert path (D-11) is their entire product.
- **Musician / Producer / Operator**: their follows are professional and low-volume; their *followers* may not be.

**Synthesis questions answered**:
1. **Shared state conflict**: Follows are owned by 03.01.01; the feed reads them. The alert-scope setting is a single shared control read by both surfaces — never duplicated.
2. **Trigger chain**: A follow changes the fan-out set; an unfollow must stop delivery. Alert-class events bypass ranking (03.02.02 D-04) and route via the Notifications cross-cut, not the feed pipeline.
3. **Permission intersection**: Blocks (24) must collapse follows and suppress delivery atomically — a block that severs a connection but leaves the follow keeps the blocked party receiving content (`03.01-connections-follows-endorsements-cx.md#CX-02`).
4. **Notification fan-out**: Per 03.01.01 DT-02, follow notifications at fan volume must aggregate or suppress; tiered by graph distance (D-06, CX-02).
5. **State transition conflict**: An entity merge (domain 01) re-points follows; delivered items referencing a retired entity must resolve via redirect.

---

### CX-10: Forums & Craft Q&A ↔ Collaborator Discovery & Matchmaking

**Relationship**: 03.07 DT-02 finds the forum's primary risk is emptiness, not moderation: the people worth
hearing from are in DAWs and at loading docks, not on forums. The mitigation is **routing** — put a question
in front of the five people with evidenced craft standing rather than broadcasting it — which is a matching
problem (03.03), not a forum feature. If that is right, the forum's value is deliverable without the forum,
which is 03.07 Q-04.

**Synthesis questions answered**: deferred — Medium confidence; gated on 03.07 Q-04 (`/ideate-validate`).

---

### CX-11: Connections, Follows & Endorsements ↔ Scenes & Communities

**Relationship**: **New in Step 6.** Bidirectional and load-bearing for onboarding. A seeded venue record
(03.06.04) accrues follows *before* its real Operator signs up, so when they claim it (via 16's claim flow)
they inherit an audience rather than starting at zero. Per 03.06.04 DT-08 this is the strongest onboarding
hook in the sub-domain and a real switching trigger per personas.md. The hazard, recorded honestly: those
followers followed an inferred/seeded record, so the claim must not silently convert "followed a placeholder
the platform created" into "followed you, verified" without the follower ever being told the record changed
hands.

**Role scoping**:
- **Operator**: the primary beneficiary — a claimed venue arrives alive, which is the domain's headline cold-start claim (03.06.01 D-04) made non-circular.
- **Musician / Producer**: may be the followers who followed a seeded record; their follow must remain honest across the claim transition.
- **Fan**: the bulk of seeded-record followers by volume (D-13a).

**Synthesis questions answered**:
1. **Shared state conflict**: The follow edge is owned by 03.01.01; the seeded record is owned by 03.06.04 (and, upstream, 16). On claim, ownership of the *record* transfers (16's flow) but the follow edges re-point to the now-claimed entity — they are not re-created.
2. **Trigger chain**: Claim (16) → record becomes a live entity → accrued follows re-point (sync, atomic with claim) → the new owner inherits the audience. If the claim is later reversed/disputed (24), follows must survive on the record, not vanish.
3. **Permission intersection**: Per 03.06.01 DT-10, claiming a seeded *venue* confers authority over the venue record ONLY, never over the scene — so inheriting an audience does not confer any scene stewardship (D-08).
4. **Notification fan-out**: Followers of a seeded record that gets claimed may warrant a "this venue is now on WeJammin" notification — but it must disclose the record was previously derived (never-overstate law), not imply a relationship that did not exist.
5. **State transition conflict**: Two people claiming the same seeded venue is 16's verification problem, not this feature's; the follow set must not be split or double-counted while a claim is contested.

---

### CX-12: Scenes & Communities ↔ Private Rolodex & CRM

**Relationship**: **New in Step 6.** The persistence rule for temporary affiliation. When a visiting
membership (03.06.01 D-07, the touring/conference case) expires, membership is removed — but nothing created
*inside* it is. What survives is a **rolodex entry** (03.05.01): the promoter you met in Bristol, the
engineer you jammed with at the conference. This is 03.11 DT-03's finding ("the value is what survives the
event") reaching the touring case, and it is the concrete answer to "what is a temporary scene *for*" — it
is a rolodex-generating machine with an expiry on the membership but not on the contacts.

**Role scoping**:
- **Musician / Producer / Operator**: the touring and conference-going professionals for whom the membership is disposable but the contacts are the whole point.
- **Fan**: no rolodex access (03.05 Role Matrix: ❌).

**Synthesis questions answered**:
1. **Shared state conflict**: Membership is owned by 03.06.01; the rolodex entry is owned by 03.05.01 and authored by the user, not the scene. Expiry mutates only membership state.
2. **Trigger chain**: Visiting-membership expiry (time-triggered) fires a cleanup that removes membership; it must explicitly **exclude** any rolodex entry, contact, or note created during the window. A cascade delete here would be a data-loss bug destroying the feature's entire value.
3. **Permission intersection**: The rolodex is private to its author (03.05 D-01); scene expiry never touches its visibility, which was already author-only.
4. **Notification fan-out**: None on expiry (silent). A rolodex entry created during the window follows 03.05's own rules.
5. **State transition conflict**: If the same user re-enters the scene (returns to the city / attends next year), a new visiting membership is created; the prior rolodex entries are already there and must not be duplicated — reconciliation is 03.05.01's shadow/dedup logic, not re-seeding.

---

### CX-13: Collaborator Discovery & Matchmaking ↔ Reachability & Inbound Policy (03.04.04)

**Relationship**: **New in Step 6.** Reachability (03.04.04) read as a discovery filter rather than a
message gate. Two distinct hazards: (a) an unreachable candidate (blocked, or behind a closed inbound wall)
must be filtered **before render** — a visible dead end is worse than an absence (03.03.01), so discovery
output is gated by reachability policy; (b) a user who posts an availability signal (03.03.03) while holding
a closed wall has built a **self-inflicted dead end** — the declaration surface must surface the
contradiction ("you're telling people you're open while your wall is closed") rather than let demand
dead-end silently. This is the same shortest-path query as CX-01/CX-08, read as a permission on the render
step: "within N hops" makes graph traversal a hot path on discovery output, not just on message-send.

**Role scoping**:
- **Producer / Operator**: high walls; most of their high-scoring inbound results would be unreachable-and-hidden without this filter, and most at risk of the signal-vs-wall contradiction.
- **Musician**: lower walls (03.04.04 Role Lens); fewer filtered results, but they are the persona most likely to post an "open" signal and forget a wall.
- **Fan**: no matchmaking access.

**Synthesis questions answered**:
1. **Shared state conflict**: Reachability policy is owned by 03.04.04; matchmaking reads it as a filter predicate. No write contest.
2. **Trigger chain**: Every discovery query (03.03.01) evaluates reachability per candidate before render (sync). If the reachability check is unavailable, results fail *closed* (hidden), never shown-and-broken. A block dropped mid-session (24) must remove the candidate on the next render.
3. **Permission intersection**: This is the intersection — reachability is a permission that changes what discovery may show. Blocks (24) are authoritative and override any reachability policy (03.04.04 DT-02).
4. **Notification fan-out**: The signal-vs-wall contradiction (b) is surfaced to the *signalling* user as a warning on their own declaration surface — not a notification to others.
5. **State transition conflict**: A wall raised or lowered between query and render, or a signal posted while a wall is closed, must resolve to the stricter state at render time; an in-flight contact already sanctioned by an intro (CX-08) is not retroactively blocked.

---

## Cross-Cut Mechanisms Identified (routed to the global CX)

Discovered during classification and Step 6 synthesis. These are **mechanisms serving many domains**, not
nodes in this domain. Recorded here per the Node Classification Gate and returned for the global CX file.

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **Direct Messaging & Conversations** | 03, 04, 05, 06, 07, 13, 14, 16, 17 | **Absent from all 16 candidates** — yet every contact surface in this domain terminates in a conversation. This domain owns the *policy* over it (03.04.04), not the mechanism. |
| **Verified Collaboration Graph (as a THREE-contract read service)** | 03, 04, 05, 22, 24 | Step 6 sharpened: not one contract but three — ego-rooted pairwise (03.03/03.04/04/05), aggregate/non-identifying (scene density, 22), and permission-gate (03.04.04). Product surfaces stay here; each contract spans differently and must not be built by widening another's query surface. |
| **Real-Time Rooms, Presence & Audio Transport** | 03, 05, 06, 07, 08 | Ratified by D-15. Presence decorates feed items but is consumed only, not owned (03.02 D-02). |
| **Notifications & Alerts fan-out** | All 24 | The Fan gig-alert path (D-11) routes through follows; 03.02.02 DT-02 finds alert-class events must **bypass ranking entirely**, making this a distinct mechanism from the feed. Follow-notification tiering by graph distance (03.01.01 D-06) is a new demand on it. |
| **Blocking, Muting & Harassment Controls** | All 24 | Distinct from reachability (03.04.04 DT-02): blocks are reactive, bilateral, authoritative over every edge; reachability is proactive, structural, graph-derived. Blocks collapse follow+connection atomically. |
| **Reputation & Trust Signals** | 03, 05, 13, 14, 16, 24 | Endorsements (03.01.03) overlap materially with transactional reviews in the marketplaces — which is why 03.01.03 Q-02 (cut endorsements entirely?) is live. |
| **Referral-at-point-of-decline** | 03, 04, 05, 17 | 03.04.03 DT-01: the economically important referral happens when a booked professional declines work — a moment living in 05, 17 and 04. The node may dissolve into this cross-cut (03.04.03 Q-02). |
| **Pending-action prompts derived from platform state** | 02, 05, 17, 23 | 03.05.03 DT-02: most follow-ups should not be hand-set — the platform already knows the invoice is unpaid and the credit unconfirmed. Pairs with 03.02.01 DT-03 (confirmations as feed cards). |
| **Claiming & shadow-record reconciliation (a FAMILY, not one mechanism)** | 03, 01, 16 | Appears three times: shadow contacts (03.05.01), seeded venue claiming (03.06.04), entity merge (01). Step 6 (03.06.04 D-14) proves they are NOT one mechanism — public+verified vs private+author-confirmed differ — but they need one coordinated reconciliation design (03.06.04 Q-04). |
| **Professional co-presence graph (pre-credit edges)** | 02, 03, 04 | **Emergent (02.02.01 DT-12):** co-presence is a graph edge created BEFORE any credit exists — the substrate of warm intros and dep matching, at zero marginal cost. Not in the registry, whose graph is credit-derived. A leak-with-a-fuse: must not become visible before the credit publishes (02.01.05 embargo). |
| **Data portability / graph export** | All 24 | problem-statement.md Q-02 asks whether the lock-in is earned or hostile. This domain's graph is the clearest test: if a user leaves, do they take their network? A values decision, not a feature. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 03.05 Private Rolodex | 03.03 Matchmaking | Considered feeding private notes into match scoring — the user's own opinion of a collaborator is genuinely the best signal about them that exists. Rejected as a hard architectural rule (`03.05-private-rolodex-crm-cx.md#R-01`): any read of private data by a shared computation makes that data **inferable from the computation's output**. If my private "avoid" note demotes someone in a ranking, the note has leaked through the ranking. Private data never influences shared computation. |
| R-02 | 03.07 Forums & Craft Q&A | 03.01.03 Endorsements | Considered letting good forum answers generate endorsements or craft credibility. Rejected: it converts posting into a credential, which is the participation-over-evidence failure the domain-level principle rejects in four separate places. Answering well proves you are helpful and articulate; it does not prove you can track drums, and per 03.07 D-01 the credit graph already answers that unfarmably. |
| R-03 | 03.08 Contests | 03.02.03 Native Posts | Considered posts-as-entries (`03.08-contests-challenges-beat-battles-cx.md#R-02`). Rejected: an entry accepts rights terms, a post does not. Conflating them means accidentally accepting a rights grant by posting — per personas.md the Musician's named worst-accidental behaviour ("signs a split sheet they don't understand"), automated. |
| R-04 | 03.09 Local Jams | 03.08 Contests | Considered merging them as "scene events" — both are scene rituals where people are evaluated, and both are on-ramps for the uncredited (03.09 DT-01, 03.08.02 DT-02). Rejected: a contest has a brief, eligibility, judging, prizes and **rights**; a jam has none of these, and its whole nature is that it has none of these. Merging drags a rights and payout apparatus onto a Tuesday night in a pub. The shared property (on-ramp for the uncredited) is a *finding about the domain*, not a reason to merge two unlike things. |
| R-05 | 03.06 Scenes | 03.05 Private Rolodex | Considered scene-scoped shared contact lists. Rejected: it is 03.05.02 DT-01's shared-notes rejection at a larger and worse scale. A note shared with a *scene* is shared with anyone who joins that scene, forever, including its subject — a quasi-private artefact with no author and no accountability, the worst possible shape for third-party statements about identifiable people (03.05.02 DT-02). **Note:** the *legitimate* Scenes↔Rolodex link (persistence of contacts made in a scene) is real and is CX-12 — it is one-directional and private-by-author, the opposite of a shared list. |
| R-06 | 03.02 Activity Feed | 03.05 Private Rolodex | Considered a "people you haven't spoken to in a while" feed prompt sourced from the rolodex — a standard CRM nudge. Rejected for the same reason as R-01, sharpened: it would render private annotations into a surface that is glanceable over someone's shoulder, and per 03.05.03 D-01 nothing in the rolodex may ever reach any surface but its author's own. |
| R-07 | 03.01 Connections/Follows | 03.01.02 Professional Connections (auto-follow) | Considered auto-following on connection *accept* — the LinkedIn default. Rejected per 03.01.01 DT-11/D-12: because 03.01.02 DT-03 pre-seeds connections from verified credits, auto-follow would manufacture follows at scale and inflate follower count — the one metric the domain (D-02) requires to stay honest, and (per the 17 cross-domain link) the metric promoters use as booking currency. Connection and follow stay separate consent acts. |

---

## Boundary Health Note (evidence for D-17 / `/ideate-validate`)

Two intra-domain sub-domain boundaries were tested in Step 6 and found **coherent**:
- **03.03 (Matchmaking) vs 03.04 (Warm Intros/Graph)** — one system, two ends; the graph is a read service, matchmaking a consumer. Not a merge candidate; the split is load-bearing (different privacy contracts, CX-01/CX-13).
- **03.06 (Scenes) vs 03.11 (Conference)** — composition, not duplication (CX-07); kept separate for privacy-posture reasons pending Q-10.

The domain's genuinely *incoherent* boundaries are all **cross-domain** (03↔04 calls-vs-casting, 03↔05 create-vs-hire, 03↔20 professional-follow-vs-fan-follow, 03.09↔17 recurring-jam-vs-one-off-booking) — returned in the cross-domain rows below, not resolvable inside this domain.
