# Promotion & Marketing — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Promotion & Marketing](./promotion-marketing-index.md)
> **Status**: [BREADTH] — 9 children classified; 8 intra-domain cross-cuts confirmed, 6 rejected pairs, 6 mechanisms routed out.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [21.01 Campaign Planner](./21.01-release-campaign-planner/) | [21.02 Pitching](./21.02-pitching-outreach/) · [21.04 Links](./21.04-smart-links-presave-attribution/) · [21.05 Paid](./21.05-paid-promotion/) · [21.06 Social](./21.06-social-publishing-cross-post.md) | The grid is the domain's spine — it emits the deadlines every other child consumes, and the date-change cascade is what breaks them all at once | Musician, Producer | High | Every channel's deadline derives from the release anchor. The cascade (21.01.04) classifies each child's artefacts as recomputable or escaped — and escape status is a property of the *child*, not the grid. |
| CX-02 | [21.07 Coverage](./21.07-coverage-clipping-log.md) | [21.09 EPK](./21.09-campaign-press-kit-epk.md) · [21.02 Pitching](./21.02-pitching-outreach/) | **The domain's thesis loop**: pitch → coverage → verified quote → stronger EPK → better next pitch | Musician, Producer | High | The only closed loop on the release side, and the only one whose output is a *verified fact* rather than a metric. Domain index D-02. |
| CX-03 | [21.02.05 Embargo](./21.02-pitching-outreach/21.02.05-embargo-premiere-exclusives.md) | [21.01.03 Calendar](./21.01-release-campaign-planner/21.01.03-content-calendar-beat-sheet.md) · [21.04.04 Lifecycle](./21.04-smart-links-presave-attribution/21.04.04-link-lifecycle-retirement.md) · [21.06 Social](./21.06-social-publishing-cross-post.md) · [21.08.01 Announce](./21.08-event-tour-marketing/21.08.01-tour-announce-onsale.md) | A time-lock binding every publication surface at once, including parties who cannot see the campaign | Musician, Producer, Operator | High | The breach vector is always your own side: a Producer's studio photo, a venue's calendar listing. Both are parties nobody currently tells. |
| CX-04 | [21.05.03 Payola Guardrail](./21.05-paid-promotion/21.05.03-payola-guardrail.md) | [21.02.02 Playlist](./21.02-pitching-outreach/21.02.02-playlist-curator-pitching.md) · [21.02.04 Radio](./21.02-pitching-outreach/21.02.04-radio-plugging.md) · [21.05.02 Seeding](./21.05-paid-promotion/21.05.02-creator-seeding.md) | One policy, many enforcement points — and a back door in domain 05 | Musician, Producer, Operator, Fan | High | The sanction lands on the artist's track, not the seller's business. Users cannot distinguish buying attention, buying an endorsement, and buying a slot. |
| CX-05 | [21.03 CRM](./21.03-pitch-targets-crm/) | [21.02 Pitching](./21.02-pitching-outreach/) | Targeting and history are the pitch's substance; the composer is a text box | Musician | High | A press pitch succeeds on whether the journalist covers this music and whether prior relationship exists. The email text is the least important part. |
| CX-06 | [21.04.03 Campaign Attribution](./21.04-smart-links-presave-attribution/21.04.03-campaign-attribution.md) | [21.08.03 Ticket Attribution](./21.08-event-tour-marketing/21.08.03-ticket-sale-attribution.md) | Same mechanism, opposite epistemics — deliberately **not** merged | Musician, Operator | High | Stream conversion is unobservable to anyone; ticket conversion is a row in domain 19's database. A shared UI would imply the DSP side knows what the ticket side knows. |
| CX-07 | [21.05.02 Seeding](./21.05-paid-promotion/21.05.02-creator-seeding.md) | [21.05.01 Ads](./21.05-paid-promotion/21.05.01-paid-ad-campaigns.md) | Seeding produces the creative that ads amplify; both draw one budget | Musician | Medium | Native creator content outperforms brand-made creative, which is why the industry converged on amplifying seeded posts. Budget contention is real; modelling the trade-off would require a comparative effectiveness we cannot measure. |
| CX-08 | [21.01.02 Asset Gate](./21.01-release-campaign-planner/21.01.02-asset-readiness-gate.md) | [21.09 EPK](./21.09-campaign-press-kit-epk.md) | The EPK is both a gated asset and a consumer of other gated assets | Musician, Producer | Medium | The EPK must exist before press outreach and cannot be built before credits are confirmed in 02. It sits mid-chain, which is unusual and may mean the gate needs ordering rather than a flat list. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: The grid is the spine

**Relationship**: 21.01 derives every deadline; 21.02, 21.04, 21.05 and 21.06 consume them. The
interesting half is not the derivation — it is the cascade. When the anchor moves, each child owns
the question "what of mine has already escaped into the world?" and the answers differ sharply:
21.02's sent pitches sit in a journalist's inbox; 21.06's published posts are public; 21.04's live
links are in circulation; 21.05's spend is already gone.

**Role scoping**:
- **Musician**: owns the anchor and receives the bill — the list of humans who must now be told.
- **Producer**: sees only their own deadline move, in project context (21.01 D-02).
- **Operator**: unaffected by release anchors. A *tour* date change is 17/18's problem with 21.08 consequences.
- **Fan**: affected only where something already public changes — a pre-save authorised against a stated date.

**Synthesis questions answered**:
1. **Shared state conflict**: The grid owns dates. Children own their artefacts and their escape status. No child writes the anchor; only the cascade does.
2. **Trigger chain**: Anchor change → preview → classify per child → commit. Escaped items become drafted tasks, never automated sends (21.01.04 DT-02). If a child's classification fails, the cascade must not commit — a partial cascade leaves the campaign in a state nobody can reason about.
3. **Permission intersection**: Moving the anchor should carry release-approval authority, not post-editing authority. For a band entity this is unresolved (21.01.04 Q-02).
4. **Notification fan-out**: The largest in the domain — Producers, pitch recipients, pre-savers, the distributor.
5. **State transition conflict**: Sharpest is the cascade racing a pitch send. Queues must hold; sent is irreversible.

### CX-02: The thesis loop — pitch → coverage → EPK → pitch

**Relationship**: The loop that makes domain 21 more than an adjacency. A pitch produces coverage;
coverage produces a **verified** quote (not a claimed one, because we sent the pitch and hold the
link); the quote strengthens the EPK; the stronger EPK wins the next pitch. Each cycle the artefact
gets more credible from facts rather than assertions.

**Role scoping**:
- **Musician**: owns the loop and is the beneficiary of its accumulation.
- **Producer**: appears in it — their credit on the EPK, their name in the coverage. Read-only access exists so a mis-credit does not propagate to press at scale unchallenged.
- **Operator**: consumes the EPK when booking (21.09 DT-03) and sees coverage of shows at their room.
- **Fan**: sees the verified quotes on public surfaces — which is why verification matters to someone other than the artist.

**Synthesis questions answered**:
1. **Shared state conflict**: 21.07 owns coverage items; 21.09 owns EPK versions and selections. The quote is referenced, not copied — if the source link rots, the EPK's verification claim must decay with it rather than persist as a verified-looking assertion.
2. **Trigger chain**: Pitch sent → coverage published → captured (suggested, never auto-inserted — 21.07 DT-02) → quote available → EPK version. Every step is human-confirmed, which is slow and is the only thing keeping the "verified" label meaningful.
3. **Permission intersection**: The Producer can *see* an EPK naming them and dispute through 02, but cannot edit it. Visibility without authorship is the right shape — it is the artist's document about a fact the Producer co-owns.
4. **Notification fan-out**: New coverage should reach the artist and any Producer named in it. Today a producer learns they were credited — or mis-credited — by accident, if ever.
5. **State transition conflict**: A credit disputed *after* an EPK is sent is the escaped-item problem again: the wrong name is already in a journalist's inbox and possibly in print. Versioning limits the blast radius; nothing recalls it.

### CX-03: Embargo binds everything, including people who cannot see why

**Relationship**: An embargo is a timestamp plus a set of bound parties, and it reaches further than
any campaign surface: the calendar's beats, the social publisher, the smart link's live date, the
tour announce, and the personal social accounts of people who have no idea a campaign exists.

**Role scoping**:
- **Musician**: sets it, and most often breaks it.
- **Producer**: bound, not privileged — the constraint reaches them, the plan does not.
- **Operator**: bound in 21.08. A venue publishing a show before the announce is a routine, unforced disaster, and it is a party the release-cycle model never contemplated (21.08.01 DT-01).
- **Fan**: no visibility, by definition.

**Synthesis questions answered**:
1. **Shared state conflict**: One embargo object per exclusive, owned by 21.02.05, referenced everywhere. Two embargoes on one asset stay separate objects with separate lift times; the earliest lift governs what is actually public.
2. **Trigger chain**: Lift → fan-out (link live, beats unblock, coverage capture begins). Lift is a wall-clock fact with no rollback — nothing un-publishes an outlet's piece. Downstream failures are independently recoverable and must not reverse it.
3. **Permission intersection**: The important one, and inverted from the usual direction: **being bound requires no access to the campaign**. Most access models cannot express "you must obey this constraint and may not see the thing it protects" — which is probably why no existing tool does this.
4. **Notification fan-out**: On set, everyone bound. On lift, everyone waiting. On breach, the artist immediately — the exclusive is salvageable for minutes.
5. **State transition conflict**: A negotiated lift time is an *external commitment* and must not auto-follow a moved release anchor (21.01.04). This is where CX-01 and CX-03 collide, and the rule is that the human-agreed time wins over the derived one.

### CX-04: One payola policy, many enforcement points, one back door

**Relationship**: 21.05.03 owns the policy; it is enforced at playlist pitching (21.02.02), radio
(21.02.04) and creator seeding (21.05.02), each at different severity — playlist is a DSP terms
violation, radio carries statutory exposure, seeding is a disclosure obligation.

**The back door**: the same offer appears as a **service listing in domain 05**, where nothing knows
about DSP terms (domain index D-06).

**Role scoping**:
- **Musician**: gets sanctioned, and is least able to tell the three purchases apart.
- **Producer / Operator**: bound whenever compensated to promote — a plugin demo, a gear endorsement, a boosted event post.
- **Fan**: the party disclosure protects; entitled to know a post was paid for.

**Synthesis questions answered**:
1. **Shared state conflict**: The guardrail writes verdicts, never budgets. Features own their spend records.
2. **Trigger chain**: Spend → classify → allow / require disclosure / block. Synchronous and blocking; a guardrail evaluated after the money moves is a report.
3. **Permission intersection**: No override at any tier. A guardrail its subject can lift is an override with a guardrail-shaped label.
4. **Notification fan-out**: A block must explain itself concretely — a bare denial sends the artist to buy the same thing off-platform, which is the exact harm, achieved through our own opacity.
5. **State transition conflict**: Terms change and a compliant running campaign becomes non-compliant. Retroactive blocking is hostile; letting it run is negligent. Unresolved (21.05.03 Q-02).

### CX-05: CRM ↔ Pitching

**Relationship**: 21.03 supplies who to pitch and what happened last time; 21.02 does the pitching.
The value asymmetry is the point — a press pitch succeeds on targeting and relationship, and the
email text is nearly irrelevant. This is why 21.03 is a sibling sub-domain rather than a helper
inside 21.02.

**Role scoping**:
- **Musician**: the only participant. Both sub-domains are single-persona.
- **Producer / Operator / Fan**: not senders. The Operator's local-press relationships are real and homeless (domain index Q-10).

**Synthesis questions answered**:
1. **Shared state conflict**: 21.02 creates pitch events; 21.03 owns contacts and the log. The pitch event is written once by 21.02 and owned thereafter by 21.03.
2. **Trigger chain**: Pitch sent → contact auto-created if absent → event on the timeline → outcome recorded → aggregate flows to the directory. Auto-creation is essential: a CRM requiring data entry is the spreadsheet we are replacing (21.03.02 DT-01).
3. **Permission intersection**: Rate limits (21.02.06) read target opt-out state, which lives on the directory record. Opt-out beats every queue and every tier.
4. **Notification fan-out**: A directory fact change ("this journalist moved outlet") fans out to every artist holding a private reference — an event a spreadsheet can never fire.
5. **State transition conflict**: A target opting out while pitches are queued. Opt-out wins; the queue is purged.

### CX-06: Two attributions, deliberately not merged

**Relationship**: 21.04.03 and 21.08.03 are the same mechanism — tagged link, click, conversion —
applied to situations with opposite truth status. Stream conversion happens inside a DSP that
returns nothing to anyone; ticket conversion is a row in domain 19's database.

**Role scoping**:
- **Musician**: sees both, and must be able to tell that one is a fact and one is a correlation.
- **Operator**: per-date ticket reports only; nothing in 21.04.03.
- **Fan**: the tracked party in both. A purchase attribution joins marketing to a *transaction*, which is more sensitive than a click log.

**Synthesis questions answered**:
1. **Shared state conflict**: None — separate features over a shared click service (routed out as a cross-cut).
2. **Trigger chain**: Independent.
3. **Permission intersection**: Operator gets per-date reports in 21.08.03 and nothing in 21.04.03.
4. **Notification fan-out**: None.
5. **State transition conflict**: None. **Recorded because the non-merge is the decision** — a shared UI would inevitably imply the DSP side knows what the ticket side knows, and that implication is exactly the lie 21.04.03 exists to refuse (domain index D-07).

---

## Cross-Cuts Escaping This Domain

> Mechanisms discovered here that serve many domains. Recorded for absorption into
> [ideation-cx.md](../ideation-cx.md) — **not** built as nodes in 21.

| Mechanism | Serves | Why it is not a 21 node |
|---|---|---|
| **Timed Reveal / Embargo Lock** | 12, 13, 14, 17, 19, 20, 21 | Content that must not surface before T, enforced across every publication surface, binding parties who cannot see why. Identical for a scheduled release, an unlisted product drop, a tour announce and a fan-only reveal. 21.08.01 DT-01 generalised it further: it must bind **counterparty organisations** (venues), not only the artist's own collaborators. |
| **Sponsorship & Paid-Endorsement Disclosure** | 05, 13, 14, 20, 21 | Material-connection disclosure applies wherever compensated endorsement happens — a paid gear review, a sponsored plugin demo, a paid service testimonial, a paid fan post. Building it in 21 means four inconsistent reimplementations, and the inconsistency is where violations live. The music-specific *payola policy* stays here. |
| **Short Links, Routing & Click Attribution** | 05, 13, 14, 19, 20, 21 | Link creation, redirect, geo routing, bot filtering and click events are plumbing. The *smart link* (DSP routing, pre-save-aware, campaign-scoped) is 21's product on top of it. |
| **Outbound Contact & Deliverability** | 04, 05, 17, 20, 21 | Sending to humans at scale — bounce handling, opt-out that works without an account, rate limiting, sender reputation, CAN-SPAM/GDPR obligations. 21.02.06 is the domain-specific policy on top; the machinery is shared, and its failure mode (one user's spam damaging every user's deliverability) is platform-wide. |
| **Connected External Accounts / OAuth Broker** | 12, 20, 21, 22 | DSP, social and ad-platform grants: token lifecycle, scope display, revocation, expiry detection. Token expiry is 21.04.02's primary failure mode and 21.06's silent-death mode — the same problem twice, which is the signature of a mechanism. |
| **Multi-Party Approval & Sign-off** | 01, 07, 12, 21 | Band-entity approval of a post, an ad, a release, a split. Recurs wherever a first-class non-person entity must authorise an act by one of its members. Lower confidence than the others — it may be an aspect of the identity model in 01 rather than a mechanism in its own right. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 21.03 Pitch Targets & CRM | 21.04 Smart Links & Pre-Save | Considered because both are "things you use when promoting". Rejected: no shared state, no trigger dependency, entirely independent lifecycles. The CRM is about reaching gatekeepers; smart links are about routing an audience that already arrived. They never touch. |
| R-02 | 21.06 Social Publishing | 21.07 Coverage & Clipping Log | Considered — both concern content in public. Rejected: your own post is not coverage. Conflating them would let artists log their own social posts as press, corrupting the one artefact in the domain whose entire value is that it is verified (CX-02). The distinction is load-bearing, not pedantic. |
| R-03 | 21.05 Paid Promotion | 21.09 EPK | No interaction. Ads do not carry press kits; press kits are not ad creative. Considered only because both are "campaign assets" — which is a category, not a relationship. |
| R-04 | 21.01 Campaign Planner | 21.03 Pitch Targets & CRM | Rejected as a direct pair. The grid emits *pitch deadlines*, which 21.02 consumes; 21.03 supplies 21.02's targets. Both relate to the grid via 21.02, not to each other. Recording it would double-count 21.02's mediation. |
| R-05 | 21.02 Pitching | 21.08 Event & Tour Marketing | **Partially rejected, and the residue is a real gap.** Release-cycle press outreach and tour local-press outreach share machinery but have different senders (the Operator is a sender in 21.08 and not in 21.02), different targets (local vs national) and different anchors (add dates and on-sales, not the release). Recorded as Q-10 on the domain index rather than as a cross-cut, because the honest finding is that Operator outreach is currently *homeless* rather than connected. |
| R-06 | 21.04 Smart Links | 21.09 EPK | Considered — an EPK contains links. Rejected: the EPK embeds the *music*, not a routing link, and its recipient is a journalist with a promo stream, not a fan choosing a DSP. Different artefact, different audience, no shared state. |
