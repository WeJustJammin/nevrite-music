# Identity, Profiles & Organizations — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Identity, Profiles & Organizations](./identity-profiles-organizations-index.md)
> **Status**: [DEEP] — sub-domain cross-cuts synthesised; 5-question synthesis answered for High-confidence entries; Step-5 pendings resolved where downstream evidence now exists.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | The acting-context list is a derived view over the membership/representation graph. Aliases + mandated orgs + represented parties = the switcher's contents | Musician, Producer, Operator | High | 01.01.03 D-01 (derivation) + 01.03 index D-01 |
| CX-02 | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | Merging duplicate parties must **redirect** credits, never rewrite them — the portfolio's value rests on the credit record being immutable | Musician, Producer | High | 01.06.02 D-03 + 01.05.01 Edge Cases (duplicate shadows) |
| CX-03 | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | Creation and claiming are the two doors to the same entity. Creation is a weak assertion; claiming is a proof. Duplicate detection at creation routes into the claim flow | Musician, Producer, Operator | High | 01.02.02 D-01/D-02 + 01.05 index D-03 |
| CX-04 | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | The unclaimed party's portfolio — built entirely from other people's attestations — is the claim incentive, and its attesters are the claim's proof. The domain's growth loop | Musician, Producer, Operator | High | 01.05.01 DT-03 + 01.05.02 DT-03 + 01.06 index D-03 |
| CX-05 | [01.09 Party Identifier Resolution](./01.09-party-identifier-resolution.md) | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | Identifiers attach to any party — including aliases, because ISNI is assigned per public identity, not per human | Musician, Producer | High | 01.09 D-02 + 01.01.02 D-01 |
| CX-06 | [01.04 Band & Ensemble Governance](./01.04-band-ensemble-governance/) | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | Governance should be the source of mandates; today they are independently editable and can contradict. The domain's sharpest unresolved conflict | Musician | High | 01.04.01 DT-03 + 01.04.03 Q-01 + 01.04 CX-01 |
| CX-07 | [01.04 Band & Ensemble Governance](./01.04-band-ensemble-governance/) | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | `dissolved` is a band-specific terminal state governed by 01.04, executed against 01.02's lifecycle model. Ending one capability on a multi-type entity is a type removal, not a terminal state | Musician, Operator, Fan | High | 01.02.02 Behavior + 01.04.04 Behavior + 01.02.03 D-01/D-03 + 01.02.02→01.02.03 D-17/DT-15 |
| CX-08 | [01.08 Trader Status](./01.08-trader-status-classification.md) | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | Trader status legally **forces publication** of the legal identity 01.01.04 exists to protect. A statutory duty overriding a privacy model | Musician, Producer, Operator, Fan | High | 01.08 D-05 + 01.01.04 Edge Cases (sole trader) |
| CX-09 | [01.10 Estates & Legacy Accounts](./01.10-estates-legacy-accounts.md) | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | Death terminates mandate but not membership history; estate access is modelled as a representation edge, not an identity handover | Musician, Producer, Operator | High | 01.10 D-01/D-02 + 01.03.01 Edge Cases (member dies) |
| CX-10 | [01.07 Credential Verification](./01.07-professional-credential-verification.md) | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | Badges are attested content on the page and in the EPK. Expiry silently changes an artifact that was already pitched | Musician, Producer, Operator | Medium | 01.07 D-02 + 01.06.03 Q-01 |
| CX-11 | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | Handles are ONE namespace across aliases and orgs; a solo alias promotes to a `band` org carrying its handle, following and catalogue without minting a new identity | Musician, Producer, Operator, Fan | High | 01.01.02 D-04/D-05 + E-28 (solo→shared promotion) |
| CX-12 | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | [01.04 Band & Ensemble Governance](./01.04-band-ensemble-governance/) | Because a shared name IS a band (D-04), governance capture must be reachable FROM alias creation and promotion — not only a deliberate "create a band" flow | Musician, Producer | High | 01.01.02→01.04 (Happy Path step 2 + E-28) |
| CX-13 | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | The person record is created by reference as well as at signup; other-asserted facets are inherited on claim; a shadow party can never be an acting context | Musician, Producer, Operator | High | 01.01.01 DT-05 (most load-bearing ref) + 01.05.01 DT-08 + 01.05.02 (facet inheritance) |
| CX-14 | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | Descriptors (the matchable free text) live on the profile, not the record; alias aggregation is private-by-default or the page outs the link by publishing it | Musician, Producer, Operator | High | 01.01.01 D-04 (descriptors) + 01.01.02→01.06 D-07/DT-07 (linkage privacy) |
| CX-15 | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | Members are the org's spine; lineup is a derived view over memberships, not a stored attribute; the custodial mandate ceiling is derived from the granting party | Musician, Producer, Operator | High | 01.02.01 DT-07 (lineup derived) + 01.02.02 (creator=first mandate, ceiling) |
| CX-16 | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | [01.10 Estates & Legacy Accounts](./01.10-estates-legacy-accounts.md) | The sole owning mandate holder dies — mortality violates the one-owner invariant the departure rule cannot cover; `ownerless` + succession, and the org is not frozen | Musician, Producer, Operator, Fan | High | 01.02.02→01.10 (state-race) + 01.02 D-16 (`ownerless`) + 01.10 Q-01 |
| CX-17 | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | [01.08 Trader Status](./01.08-trader-status-classification.md) | Trader is an orthogonal classification, not an org type; adding `shop` triggers a trader assessment; unclaimed orgs incur no statutory duty | Musician, Producer, Operator | Medium | 01.02.01 DT-10 + 01.02.02 D-14 |
| CX-18 | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | [01.09 Party Identifier Resolution](./01.09-party-identifier-resolution.md) | Which identifiers a party may hold is a function of type — LC/DPID are label-only; ISNI/IPI attach to artist parties | Musician, Producer, Operator | Medium | 01.02.01→01.09 (shared-entity) + domain CX-05 |
| CX-19 | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | [01.07 Credential Verification](./01.07-professional-credential-verification.md) | A badge attaches to a facet but is not a facet (issued, not self-asserted); the positive twin of R-06 — the badge decorates a facet, it does not license it | Musician, Producer, Operator | Medium | 01.01.01→01.07 (DT-08) + R-06 |
| CX-20 | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | [01.10 Estates & Legacy Accounts](./01.10-estates-legacy-accounts.md) | Facets freeze at death — the estate can neither add one (a first-person claim it may not write) nor remove one (editing the historic record) | Musician, Producer | Medium | 01.01.01→01.10 (state-race, domain CX-09) + D-08 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-level references:** Where a cross-cut spans levels, it is recorded here at the higher level with a link to the specific lower-level item. The detail of HOW the children interact lives in each sub-domain's own CX file.
>
> **Cross-references:** referencing a CX entry from another file uses `{filename}#CX-NN` (e.g., `identity-profiles-organizations-cx.md#CX-13`).

---

## Cross-Cut Details

### CX-01: Membership/Mandate ↔ Person Identity

**Relationship**: The acting-context list (01.01.03) is not stored — it is computed from the person record, their aliases, the orgs where their membership carries a mandate, and the parties they represent. This single design choice pays out three times: contexts can never be stale, revocation needs no cleanup sweep, and the Fan (no aliases, no mandates) gets exactly one context and therefore never sees the switcher at all. Membership WITHOUT a mandate yields no context — presence is not authority (01.01.03 → 01.03.01/01.03.03). Represented parties are the only context type that is always dual-attributed ("{Agent} on behalf of {Artist}", D-09).

**Role scoping**:
- **Musician**: switches between self, aliases, and each band they hold a mandate for.
- **Producer**: self ↔ studio; the acting context at attestation time is recorded on every credit they capture.
- **Operator**: acts as the venue; on a phone, at a loading dock.
- **Fan**: one context, switcher absent — a consequence of the derivation, not a feature flag.

**Synthesis questions answered**:
1. **Shared state conflict**: The graph (01.03) owns the edges; 01.01.03 holds no state and only reads. Nothing to merge.
2. **Trigger chain**: Mandate granted → context appears. Revoked/expired → context vanishes, and any in-flight action fails authorisation at the call site rather than silently succeeding.
3. **Permission intersection**: Yes, fundamentally — a membership without a mandate is presence without authority, and does not yield an actable context.
4. **Notification fan-out**: Mandate changes notify the affected member. Silently *gaining* authority is a security event, not a convenience.
5. **State transition conflict**: Revocation mid-action is the live race; it fails closed (01.03.03 D-05) and preserves the draft.

---

### CX-02: Profile Claiming ↔ Portfolio (merge must redirect)

**Relationship**: The domain's most dangerous operation. Two shadow parties for one human is routine (two producers each credited the same horn player), and merging them is the Canonical Data cross-cut's job. But the credits pointing at both must be **redirected**, not rewritten — because 01.06.02's entire value rests on the credit record being immutable. A merge that rewrites credits would silently edit history to make a bookkeeping problem go away, which is the platform performing the exact evaporation it exists to prevent.

**Role scoping**:
- **Musician**: the merged subject; their portfolio must gain both sets of credits and lose nothing.
- **Producer**: the attester on both sides — their attestations must remain attributable to them, unaltered.
- **Operator**: merged venue records (two "The Lexington"), with show histories on both.
- **Fan**: follows both records; must end up following one.

**Synthesis questions answered**:
1. **Shared state conflict**: Which record survives is the merge's decision. The credits must reference the surviving party *through a redirect*, so the original attestation is never mutated. Attestation is evidence; evidence does not get edited during a cleanup. Facets union across the merge; other-asserted facets keep their attester marking (CX-13).
2. **Trigger chain**: Merge → party redirect → portfolio view resolves through it → page and EPK reflect the union. If the redirect fails, credits must point at the old party (visible but stale), never at nothing.
3. **Permission intersection**: Who may merge? Not modelled here (the cross-cut's). But merging two parties is a high-authority act with irreversible consequences for third parties' portfolios — **escalated**.
4. **Notification fan-out**: Both parties' attesters should know. Their attestation now points somewhere else.
5. **State transition conflict**: A merge racing a claim on one of the two records — 01.05.03's freeze posture applies (the org-side twin is confirmed: a claim landing mid-edit collides at 01.05.02), but the merge-vs-claim ordering for person records remains for validation. `[PENDING — /ideate-validate]`

---

### CX-03: Organizations ↔ Profile Claiming

**Relationship**: Two doors to one entity. 01.02.02 D-01 makes creation cheap and *weak* (an assertion), and 01.05 makes claiming the proof. Without that asymmetry, the first person to type "The Lexington" would own it. Duplicate detection at creation is where the doors meet, and it is the cheapest possible moment to prevent a split identity — after creation it becomes a merge, and CX-02 shows what merges cost. Detection signal S1 must rank *capability intent* first (01.02.02 → 01.02.03), which fixes the perverse incentive both CX files flag.

**Role scoping**:
- **Operator**: the primary path — their venue usually exists before they arrive, so claiming is their front door.
- **Musician**: creates a band; detection catches the bandmate who created it yesterday.
- **Producer**: creates a studio.
- **Fan**: cannot create orgs — which removes the largest population from the pollution surface.

**Synthesis questions answered**:
1. **Shared state conflict**: One party record either way. The question is whether a *second* gets created, which detection exists to prevent. Creation captures only the spine; type determines which terminal states are reachable (01.02.02 → 01.02.01).
2. **Trigger chain**: Create attempt → detection → claim/join offered instead. `unclaimed → owned` is executed in 01.05.02, the transition that unlocks every binding capability a custodian lacks. Refusal is allowed; the Canonical Data cross-cut inherits the residue. Succession out of `ownerless` and name/trademark adjudication route to 01.05.03 (D-16, DT-13).
3. **Permission intersection**: Creation requires nothing; claiming requires proof; adding a capability to an existing entity requires a mandate. The correct action is therefore *harder* than the wrong one — a perverse incentive, flagged in 01.02 CX-02 and worth revisiting.
4. **Notification fan-out**: Claiming an entity someone else created should notify the creator; they made an assertion that is now being resolved.
5. **State transition conflict**: Two people creating the same band concurrently — detection is best-effort; the residue is a merge. A claim landing while a custodian is mid-edit collides at 01.05.02.

---

### CX-04: Portfolio ↔ Profile Claiming (the growth loop)

**Relationship**: The domain's flywheel, and the clearest expression of D-18's claim that consolidation and provenance are causally linked rather than bundled. The Producer captures credits at the session (consolidation puts us in the room). Those credits create shadow parties with portfolios (provenance). The portfolio — built by other people, unfakeable by its subject — is what makes claiming worth doing. And the attesters who built it are the proof that the claimant is real (01.05.02 DT-03).

So the wedge feature *is* the acquisition mechanism, and the provenance graph *is* the identity-verification substrate. Neither was designed to be the other.

**Role scoping**:
- **Producer**: creates the loop's inputs at the session; rarely its subject.
- **Musician**: the claimant, arriving to a career already on the page.
- **Operator**: the same loop with business-shaped proof — their venue's show history is the bait.
- **Fan**: outside the loop entirely, and must stay outside: fan attestation would make reputation purchasable at scale.

**Synthesis questions answered**:
1. **Shared state conflict**: The party record is the same object before and after claiming; claiming attaches an owner rather than creating anything, so the accumulated history survives the conversion by construction.
2. **Trigger chain**: Capture → shadow party + portfolio → invitation (best-effort) → claim → proof via the same attesters → owned party. Every link is designed to survive its own failure: no contact route still leaves the credit standing (01.05.01 D-04).
3. **Permission intersection**: A shadow party is a subject, never an agent (01.05.01 D-05). Claiming is the only thing that grants agency — the domain's cleanest authority boundary.
4. **Notification fan-out**: The subject is invited; and on a successful claim the attesters **are** notified (01.05.02 D-11) — they are the fraud alarm, the only people who know "Big Mike" is Michael Adeyemi, and the notice closes their capture loop and re-engages them. **(Resolves the former Step-5 pending.)**
5. **State transition conflict**: Credits accreting while a claim is in flight is safe — orthogonal writes to the same party.

---

### CX-05: Party Identifiers ↔ Person Identity

**Relationship**: Identifiers attach to any party, and that includes aliases — ISNI is assigned per *public identity*, not per human, and a self-published writer holds separate IPIs for their writer and publisher capacities. Both facts independently break the naive "identifier is a field on the person" model, and both are why 01.01.02 D-01 makes aliases objects.

**Role scoping**:
- **Musician**: their alias may hold an ISNI distinct from theirs; their IPIs are per capacity.
- **Producer**: producer alias and artist alias, each potentially identified.
- **Operator**: typically none — honest irrelevance.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The party (person or alias) owns its identifiers. A merge with conflicting identifiers surfaces rather than resolves silently — a dropped IPI is a dropped royalty stream (01.09 Edge Cases).
2. **Trigger chain**: Identifier recorded → works registered in 09/10 carry it → royalties route. A wrong-but-well-formed identifier misroutes silently, for years (01.09 DT-03).
3. **Permission intersection**: An identifier is weak claim evidence (01.05.02) — a PRO membership matching a common name proves little.
4. **Notification fan-out**: None.
5. **State transition conflict**: Alias retirement with a live ISNI — the identifier persists (the name existed), which is correct and unstated.

---

### CX-06: Band Governance ↔ Membership/Mandate

**Relationship**: The domain's sharpest unresolved conflict. Governance terms say "£2,000+ needs three of four"; the mandate graph says "the bassist can spend £500". Both are recorded, both display as true, and nothing reconciles them. Governance *ought* to be the source and mandate the derived enforcement — but mandate exists from org creation (01.02.02) while governance arrives years later, so the dependency currently runs backwards.

**Role scoping**: Musician (members) primarily. Producer where a member, or where relying on a band's ability to bind itself at the capture moment. Operator/Fan unaffected.

**Synthesis questions answered**:
1. **Shared state conflict**: **Unresolved.** Two records claim authority over one question with no precedence rule. 01.04.03 Q-01 must be answered before either is specified.
2. **Trigger chain**: Recording terms *should* regenerate mandates; today it does not, so a band that agrees a threshold and does not also edit the mandate graph has agreed nothing operative.
3. **Permission intersection**: Recursive on both sides — amending terms is governed by current terms; changing a mandate needs an administer mandate.
4. **Notification fan-out**: Mandate changes notify; term changes that alter someone's authority currently do not.
5. **State transition conflict**: Terms and mandate edited concurrently produces a silently contradictory state that cannot be fixed at the edit site.

---

### CX-07: Band Governance ↔ Organizations

**Relationship**: Lifecycle is not type-uniform. A band `dissolves` under governance; a shop `closes`; a venue goes `dormant` seasonally. Because type is a set (01.02.03 D-01), a multi-type entity has no single terminal state — a band+label that stops being a band still has a catalogue to administer. And because followers/reputation attach to the party rather than the type (01.02.03 D-03), they survive every terminal state, which is exactly why 01.04.02's name disposition transfers an audience.

**Role scoping**: Musician (dissolution). Operator (closure, dormancy, and needing to know which party a name now resolves to). Producer (read-only; their credits ride the catalogue). Fan (sees the page state; their follow moves with the name).

**Synthesis questions answered**:
1. **Shared state conflict**: Lifecycle state and type set both live on the party. The divergent-terminal-state gap is **RESOLVED** (01.02.02 → 01.02.03, D-17/DT-15): ending one capability on a multi-type entity is a **type removal**, not a per-type terminal state — a band+label that stops being a band drops the `band` type and persists as a `label` with its catalogue. A terminal lifecycle state applies only when the **last** type ends.
2. **Trigger chain**: Dissolution → 01.02.02 terminal state (or type removal, per §1) → name disposition (01.04.02) → follower graph moves (domain 20) → booking resolution changes (domain 17). One governance event, three domains.
3. **Permission intersection**: Terminating requires an owning mandate; dissolving additionally requires governance's decision rules.
4. **Notification fan-out**: The widest in the domain — members, counterparties with live bookings, and followers.
5. **State transition conflict**: Dissolution vs an incoming booking — live obligations block (01.04.04 D-04, 01.02.02).

---

### CX-08: Trader Status ↔ Person Identity (legal identity)

**Relationship**: A statutory duty overriding a privacy model. 01.01.04 is built so that legal identity is a separately-authorised surface with no read path from the public profile — and trader law requires a trader's real name and geographic address to be **published on their listings**. For an Operator this is routine. For a working musician selling from home, the address they must publish is where they live, and 01.01.04's careful privacy expectation is lawfully demolished.

**Role scoping**:
- **Musician**: the collision case. Sells a cymbal, crosses into trading, must publish a home address.
- **Producer**: same shape.
- **Operator**: uncontroversial — they have a business address.
- **Fan**: the beneficiary. The disclosure exists for them (01.08 DT-03).

**Synthesis questions answered**:
1. **Shared state conflict**: 01.01.04 holds legal identity; 01.08 publishes a subset of it. The publication is a *disclosure* with a scope of "everyone", which 01.01.04's model can express — but it is the widest possible scope, granted by law rather than by the user.
2. **Trigger chain**: Trader classification → publication duty → legal identity surfaced publicly. Irreversible in practice once published, even if the classification later changes.
3. **Permission intersection**: The user cannot decline; the alternative is not listing. 01.08 D-05 makes the disclosure blocking and prominent, because discovering it afterwards is a betrayal.
4. **Notification fan-out**: The seller must understand *before* listing. This is the one place where friction is correct.
5. **State transition conflict**: A private seller reclassified to trader with live listings — do their existing listings retroactively publish their address? Unmodelled and consequential. `[PENDING — /ideate-validate]`

---

### CX-09: Estates ↔ Membership/Mandate

**Relationship**: Death terminates authority and nothing else. The membership edge ends (with a date, like any departure); the mandate terminates immediately; the credits, the attestations they made, and the lineup history are untouched. Estate access is modelled as a representation edge (01.03.02) rather than an identity handover — so the estate acts as itself, on behalf of the party, and can never attest a credit in the dead person's name.

**Role scoping**: Musician/Producer (nomination, and the deceased's own credits). Operator (org succession independent of any person). Fan (memorialised page).

**Synthesis questions answered**:
1. **Shared state conflict**: The party persists; only authority moves. Nothing merges.
2. **Trigger chain**: Verified death → mandate terminated → membership edge ended → estate representation edge created (if a successor exists). If no successor, authority simply ends and the catalogue keeps earning into an unadministrable party — 01.10 Q-01, the majority case.
3. **Permission intersection**: The defining rule (01.10 D-02) — the estate's edge is scoped to administration, never to attestation. Falls out of the existing graph with no new mechanism.
4. **Notification fan-out**: Bandmates, counterparties, followers.
5. **State transition conflict**: The deceased was the only mandate holder for a band. Departure would be blocked (01.03.01), but nobody can be blocked from dying — so the org needs a mandate recovery path that the departure rule does not provide. This is CX-16, now sourced to 01.02's `ownerless` state.

---

### CX-10: Credential Verification ↔ Portfolio/EPK

**Relationship**: Badges are attested content, rendered on the page and in the EPK. Both are live views (01.06.02 D-03, 01.06.03 D-01), so an expiring credential silently changes an artifact that was already pitched — a promoter who opened an EPK last week showing current public liability cover may open it today and see it expired, or worse, a band may have booked partly on a badge that has since lapsed.

**Role scoping**: Operator (their insurance/licence is the safety-critical case). Musician/Producer (union and PRO badges). Fan (sees a badge, never the credential system).

**Synthesis questions answered**: Medium confidence — 1, 3, 5 deferred to /ideate-validate. (2) Expiry → badge state changes → page and every live EPK change. (4) The *owner* is reminded before expiry (01.07 Happy Path), but nobody who **relied** on the badge is told — which is the gap, and it is 01.07 Q-01 and 01.06.03 Q-01 arriving at the same place from opposite directions.

---

### CX-11: Person Identity ↔ Organizations (handle namespace + promotion)

**Relationship**: Handles are ONE namespace across aliases and orgs — both are public identities at `wejamm.in/{handle}`, so 01.02 must not mint handles from a separate pool (01.01.02 D-04/D-05). And the solo→shared promotion path (01.01.02 E-28) turns an alias carrying a handle, following and catalogue into a `band` org — without minting a new identity or orphaning the audience. This is exactly the seam where R-05 (aliases-as-orgs, rejected for the *solo* case) reopens for the shared-alias/duo case (Q-08): a shared name **is** a band (D-04).

**Role scoping**:
- **Musician**: promotes a solo alias to a band as a project grows from one person to several.
- **Producer**: a studio alias that becomes a studio org.
- **Operator**: registers an org handle in the same pool aliases draw from.
- **Fan**: follows the handle, and their follow must ride the promotion (domain 20).

**Synthesis questions answered**:
1. **Shared state conflict**: One handle registry, two consumers (alias, org). The party owns its handle; promotion transfers the handle to the org **without releasing it to the pool**, or a concurrent registration could hijack a live audience mid-promotion.
2. **Trigger chain**: Alias with ≥1 release-or-credit → promotion → `band` org created carrying handle + followers + catalogue. If org creation fails mid-promotion, the alias must remain fully intact — never a half-migrated identity.
3. **Permission intersection**: Creating an alias requires nothing; promoting it into an org others can join is a governance-establishing act — the promoter becomes the first owning mandate (01.02.02 / CX-15), and governance capture fires (CX-12).
4. **Notification fan-out**: Followers of the promoted alias are told the name is now a band, with one-tap unfollow — a consent moment, the same fan-out as an alias transfer (domain 20).
5. **State transition conflict**: Two members concurrently promoting the same shared alias — detection is best-effort; the residue is a merge (CX-03).

---

### CX-12: Person Identity ↔ Band Governance (governance reachable from alias)

**Relationship**: The highest-value new seam this pass surfaced. Because D-04 makes a shared name a band, 01.04's governance capture must be reachable **from** alias creation (01.01.02 Happy Path step 2) and from solo→shared promotion (E-28) — not only from a deliberate "create a band" flow. If governance lived only behind an explicit entry point, the many bands that begin life as a shared alias would carry no governance terms at all and default silently — which is why the default mandate (Q-03) is the domain's highest-stakes product decision.

**Role scoping**: Musician (band members). Producer (a member, or relying on a band's ability to bind itself at capture). Operator/Fan unaffected.

**Synthesis questions answered**:
1. **Shared state conflict**: The band org (01.02) is the entity; governance terms (01.04), the membership graph (01.03) and the alias origin (01.01.02) are all views over it. Governance attaches to the promoted party — nothing merges.
2. **Trigger chain**: Shared alias created / alias promoted → governance capture offered **inline** (never forced). Skipping leaves the default mandate (Q-03) — so the design must make the skip legible, not silent.
3. **Permission intersection**: Capturing governance terms is a member act; the alias creator seeds the first membership and mandate (CX-15).
4. **Notification fan-out**: Bandmates named during capture are invited (the shared invitation cross-cut).
5. **State transition conflict**: Governance captured while the alias is still solo-owned is safe; the live conflict is terms-vs-mandate (CX-06), which this seam **feeds** but does not itself create.

---

### CX-13: Person Identity ↔ Profile Claiming (shadow records, facet inheritance)

**Relationship**: The most load-bearing reference in the domain (01.01.01 DT-05). The person record is created **by reference** as well as at signup — *existence and ownership are independent axes*. A shadow record carries OTHER-ASSERTED facets inferred from the referencing flow (credited on horn ⇒ `performer`). On claim, those facets are INHERITED by the claimant and are removable without a reason. And a shadow party can NEVER be an acting context (01.01.03 / 01.05.01 DT-08) — the structural reason shadow parties cannot be sockpuppets for self-attested splits (domain Q-06).

**Role scoping**:
- **Musician**: the claimant, inheriting a set of facets other people asserted about them.
- **Producer**: the attester whose reference created the shadow record and its facets.
- **Operator**: a seeded venue page is a shadow party of the same shape (CX-03, domain 16).
- **Fan**: outside — a fan reference never creates an actable facet.

**Synthesis questions answered**:
1. **Shared state conflict**: The party record is the SAME object before and after claiming (CX-04). Facets union; other-asserted facets keep their attester marking through the claim and through any subsequent merge (CX-02).
2. **Trigger chain**: Reference (credit/lineup) → shadow record + other-asserted facets → claim → facets inherited. The claim copy must attribute the facets to the attester ("Sam Reeves credited you as a performer on 3 tracks"), never read as the platform deciding who they are.
3. **Permission intersection**: A shadow party is a subject, never an agent (01.05.01 D-05); claiming is the only thing that grants agency and the ability to be an acting context (CX-01). Facet addition never creates a context — the switcher appears at the second **context**, not the second facet.
4. **Notification fan-out**: On a successful claim the attesters are notified (01.05.02 D-11 — the fraud alarm; same mechanism that resolves CX-04 §4).
5. **State transition conflict**: Credits accreting to the shadow while a claim is in flight is safe (orthogonal writes); a second human independently signing up for the same record is the merge case (CX-02).

---

### CX-14: Person Identity ↔ Portfolio/EPK (descriptors + linkage privacy)

**Relationship**: Two things split off the person record onto the profile page. **Descriptors** — open free text per facet ("mixing engineer", "session drummer, jazz/soul") — live on 01.06, not on the record (01.01.01 D-04), because they are the field the matching domains (04/05/08) actually query, while a facet is only the discoverability predicate. **Alias aggregation** in 01.06.02 is PRIVATE-BY-DEFAULT per alias (sharpened by D-07): a public portfolio must render only linkage-permitted aliases, or it publishes the connection by aggregating it (DT-07) — the platform outing a producer who spent a career keeping two names apart.

**Role scoping**:
- **Musician**: writes descriptors; controls which aliases a viewer may see aggregated.
- **Producer**: the outing risk is theirs — a ghost-production alias must not be inferable from an aggregate.
- **Operator**: a multi-type entity's composed page must keep freshness flags, not style them away (01.02.01 → 01.06).
- **Fan**: read-only; sees only linkage-permitted aliases.

**Synthesis questions answered**:
1. **Shared state conflict**: The record owns facets; the profile owns descriptors and the aggregation view. Whether a zero-facet record has a public page at all is 01.06's call (domain Q-10).
2. **Trigger chain**: Facet added → its descriptor input surface appears on the profile (matched field, D-15). Alias linkage permission changes → the aggregated view recomputes what it may render.
3. **Permission intersection**: Linkage privacy is **fail-closed** — an alias is aggregated into a public portfolio only with explicit linkage permission; the default reveals nothing (01.01.04 DT-01, E-18's inference channel).
4. **Notification fan-out**: None routine; a linkage-permission change is a privacy action, not an announcement.
5. **State transition conflict**: A linkage revoked while a public portfolio is cached must drop the aggregated alias on next render — a stale aggregate is a disclosure.

---

### CX-15: Organizations ↔ Membership/Mandate (members are the spine)

**Relationship**: Members are the org's SPINE; the current lineup is a DERIVED view over active memberships and explicitly **not** a stored attribute of the org (corrected boundary, 01.02.01 DT-07) — storing lineup lets the band page and the mandate graph drift, giving downstream consumers two sources of truth. The creator becomes the first owning mandate (01.02.02), and every custodial mandate's ceiling is DERIVED from 01.03.03 rule 1 (cannot exceed what the granting party granted; an unclaimed org granted nothing). The always-one-owner invariant is enforced on voluntary departure only — mortality violates it (CX-16).

**Role scoping**: Musician / Producer / Operator (members and mandate holders, per membership not persona). Fan none.

**Synthesis questions answered**:
1. **Shared state conflict**: The membership graph (01.03) owns the edges; the org (01.02) reads lineup from it. Nothing is stored twice, so nothing can drift.
2. **Trigger chain**: Org created → creator's owning mandate created (and, if org creation happened *in* a context, the context must not capture the mandate — that would smuggle org-owns-org back in, 01.02.02 DT-12). Member added → lineup view changes with no write to the org.
3. **Permission intersection**: A mandate covers the org UNIFORMLY today — a member mandated for the shop can also edit the venue. Per-type mandates are not defined, left as Q-04 rather than invented.
4. **Notification fan-out**: Mandate grants/revocations notify the affected member; silently gaining authority is a security event (CX-01).
5. **State transition conflict**: The cross-sub-domain race is departure-vs-mandate-recovery, which mortality forces open (CX-16); the intra-01.02 attribute-write-vs-type-removal race is handled at 01.02.03 D-04 (write rejected, value retained).

---

### CX-16: Organizations ↔ Estates (sole owner dies)

**Relationship**: The sole owning mandate holder dies — the always-one-owner invariant (CX-15) is violated by **mortality**, not by any user action, so the departure rule that would normally block the last owner from leaving cannot apply (nobody can be blocked from dying). 01.02 supplies the `ownerless` state and a succession route (D-16); 01.10 supplies the estate. Critically the org is **not** frozen — other people's bookings depend on it.

**Role scoping**: Musician / Producer (the deceased's org and bandmates). Operator (org succession independent of any person). Fan (sees the page state).

**Synthesis questions answered**:
1. **Shared state conflict**: The org party persists; only the owning mandate is missing. Nothing merges — `ownerless` is a hole in the mandate graph, not a change to the entity.
2. **Trigger chain**: Verified death → owning mandate terminated → org enters `ownerless` → succession (if a successor exists) restores an owner; if none, the org keeps operating unadministrable (01.10 Q-01, the majority case).
3. **Permission intersection**: The estate acts as itself on behalf of the party (a representation edge, CX-09), never as the deceased; it may administer, never attest.
4. **Notification fan-out**: Bandmates, counterparties with live bookings, followers.
5. **State transition conflict**: An incoming booking arriving while the org is `ownerless` — the org must still accept it; who settles it waits on succession. This is the recovery path the departure rule (01.03.01) does not provide, and it closes the gap CX-09 §5 flagged.

---

### CX-17: Organizations ↔ Trader Status (orthogonal classification)

**Relationship**: Trader status is an ORTHOGONAL classification, not an org type (01.02.01 DT-10 — answers parent index Q-01): trader applies to non-org parties too (a musician flipping gear at volume), so it cannot be an org type. But adding the `shop` type TRIGGERS a trader assessment (01.02.02), and D-14's "unclaimed orgs are inert" keeps an unclaimed shop from incurring statutory duties nobody accepted.

**Synthesis (Medium — 1, 4 deferred)**:
2. **Trigger chain**: `shop` type added → trader assessment fires → the statutory returns-policy floor (DT-10) applies to the shop's sales flows; a shop may only add terms *more generous* than the floor.
3. **Permission intersection**: Only a **claimed** shop carries the duty — an unclaimed shell is inert (D-14).
5. **State transition conflict**: A trader reclassification with live listings — the retroactive-publication race is CX-08 §5, `[PENDING — /ideate-validate]`.

---

### CX-18: Organizations ↔ Party Identifiers (identifiers by type)

**Relationship**: Which identifiers a party may hold is a FUNCTION OF TYPE — LC and DDEX DPID are label-only; ISNI/IPI attach to artist parties (domain CX-05). 01.09 owns identifier contents and resolution; the type taxonomy owns which type admits which identifier.

**Synthesis (Medium — 3, 4 deferred)**:
1. **Shared state conflict**: The party owns its identifiers; the type set gates which are valid. On merge, `party`-scoped attributes reconcile to one value while `type`-scoped ones survive per type (01.02.01 → Canonical Data).
2. **Trigger chain**: A type added → its identifier slots become available (a label gains LC/DPID, which then gate DSP delivery in domain 12).
5. **State transition conflict**: Removing a type does not revoke an already-issued identifier — it outlives the type by decades (the R-02 logic, applied to orgs).

---

### CX-19: Person Identity ↔ Credential Verification (badge attaches to facet)

**Relationship**: A badge ATTACHES to a facet — union/PRO membership (AFM, MU, PRS, ASCAP, BMI) renders against the facet it corroborates. But the credential is **not** a facet (01.01.01 → 01.07, DT-08): it is not self-asserted (a card is issued) and reveals no surface the facet doesn't already reveal. This is the positive twin of R-06 (which rejected *gating* facets on credentials): the badge **decorates** a facet, it does not **license** it.

**Synthesis (Medium — 1, 5 deferred)**:
2. **Trigger chain**: Credential verified → badge appears on the facet's surfaces and in the EPK (CX-10). Expiry removes the badge but never the facet.
3. **Permission intersection**: A lapsed credential removes the badge and never the facet — the person is still a `writer`, just no longer a badged PRS member. Suspension (domain 24) is a third axis again: it revokes permission without touching either facet or credential.
4. **Notification fan-out**: Expiry reminders go to the owner (CX-10 §4); relying parties are the unaddressed gap.

---

### CX-20: Person Identity ↔ Estates (facets freeze at death)

**Relationship**: Facets FREEZE at death (domain CX-09 applied to the person record): the estate can neither ADD a facet — a facet is a self-assertion about a profession, and an estate asserting "he was a producer" is a third party writing a claim in the first person — nor REMOVE one, which would edit the historic record and violate the domain invariant D-08. CX-09 freezes *authority*; this freezes *self-assertion*.

**Synthesis (Medium — 2, 4 deferred)**:
1. **Shared state conflict**: The frozen facet set is the last self-assertion the person made; the estate reads it, never writes it.
3. **Permission intersection**: The estate's representation edge is scoped to administration (01.10 D-02); facet mutation is outside that scope by construction.
5. **State transition conflict**: A facet edit in flight at the moment of death — the freeze wins; the edit is discarded because only the person could have authored it.

---

## Cross-Cuts Escalated to Global CX

> Mechanisms discovered while drilling this domain that serve **many** domains. Recorded here for the orchestrator to absorb into `ideation-cx.md`. **No node was created for any of these.**

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **Roles, Permissions & Enforcement** | All 24 | Already a ratified cross-cut. This domain owns the mandate *data* (01.03.03); the cross-cut authorises at every call site and must never trust a client-asserted acting party (01.01.03 → Roles & Permissions, D-02). The three-axis seam (facet reveals a surface / permission authorises an action / visibility scopes the read) is new since breadth (DT-09). |
| **Visibility, Privacy & Audience Scoping** | All 24 | The general mechanism of audience-scoping any field. 01.01.04 owns *which identities exist and which flow legally requires which one*; the scoping engine is not identity's. Linkage privacy (CX-14) is a fail-closed consumer of it. |
| **Canonical Data / Entity Merge & Redirect** | 01, 02, 05, 13, 14, 16 | Already ratified as extracted. **Escalated with constraints**: merges must redirect credits, never rewrite them (CX-02); facets union and other-asserted facets keep their attester marking (CX-13); `party`-scoped attributes reconcile to one value while `type`-scoped survive per type (CX-18). |
| **Invitation & Onboarding Handoff** | 01, 02, 03, 05, 07, 16, 17 | Membership invites (01.03.01), shadow-party invites (01.05.01), claim invites (01.05.02) and governance-capture invites (CX-12) are one mechanism reached four ways. Separate implementations would produce different arrival experiences for the same stranger. |
| **Audit Trail / Attributed Writes** | 01, 02, 09, 10, 24 | Every mandate grant, context switch, ownership transfer and governance amendment is *evidence*, not a log line. Context switches are **pullable, never pushed** (01.01.03 D-15) — the log is the only real protection against a mandate holder acting against the party within scope. |
| **Notifications & Fan-out** | All 24 | HARD requirement, not a preference (01.01.03 D-10): delivery is a **union across all contexts** a party holds; only the inbox *view* scopes. Context-scoped delivery would rebuild the six-tab fragmentation the platform sells the cure for. Mandate changes, claim outcomes, expiring credentials and dissolutions all fan out here. |
| **Real-Time Presence** | 03, 06, 07, 08, 17, 18, +01 | New consumer, no new mechanism: the shared-inbox presence indicator (01.01.03 DT-10) rides the presence mechanism already extracted from domain 08 (D-15). |
| **KYC / KYB & Payable Party** | 01, 05, 13, 14, 17, 19, 23 | Extracted to Payments at ratification. **Escalated with a dependency**: a band cannot receive money until governance names someone who may act on it (01.04.03); and the acting context determines the money destination while never gating action on payout readiness — a context with no payout method acts freely and blocks at settlement (01.01.03 → Payments). |
| **Data Portability / Export** | All 24 | `problem-statement.md` Q-02 asks whether the lock-in is earned or hostile. Identity is where the answer is most visible: if a user leaves, do their attested credits go with them? A values decision, not a feature. |
| **Reviews & Reputation** | 01, 05, 13, 14, 16, 17 | Reputation attaches to the party, so it survives org type transitions (01.02.03 D-03). Whether that is *fair* is 01.02.03 Q-02, and it belongs to the cross-cut's owner. |

## Not-Product Concerns Routed Out

> Discovered while drilling. **No node created.** Routed to `/create-prd`.

| Concern | Routed to | Why it is not product |
|---|---|---|
| Acting-context propagation & RLS enforcement | `/create-prd-architecture` | How the acting party_id travels through Workers → Supabase and is enforced at the row level. The switcher (01.01.03) is product; the transport is not. |
| ISNI / IPI / PRO / DDEX registry integration mechanics | `/create-prd-architecture`, `/create-prd-stack` | API clients, sync jobs, reconciliation. *Which* identifiers a party holds (01.09) is product; how we talk to CISAC is not. |
| Party/alias/org/handle data-model normalisation | `/create-prd-architecture` | The Party↔Person↔Alias↔Organization schema and the single handle namespace (CX-11). This domain decided the *ontology* (aliases are objects, type is a set, handles are one pool); the schema that implements it is architecture. |
| Entity merge implementation | `/create-prd-architecture` | Already routed at ratification. CX-02/CX-13/CX-18 add the redirect-not-rewrite, facet-union and scope-arithmetic constraints as product requirements on it. |
| Account security (password, MFA, sessions, device management) | `/create-prd-security` | Split out at ratification. Not re-absorbed. Note: **no candidate in this domain's list was account security** — the boundary narrowing held. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 01.07 Credential Verification | 01.05 Profile Claiming | The most tempting merge in the domain — both are called "verification", and they were adjacent candidates in the sweep. Rejected (01.07 DT-02): claiming proves *control of a party*; a credential proves *an assertion about a party*. A union card is not proof you own a profile (many AFM members share a name), and control of a venue's email says nothing about its insurance. Different subject, different evidence, different failure mode. Recorded rather than dropped, because it will be proposed again. |
| R-02 | 01.09 Party Identifiers | 01.04 Band Governance | A band holds an IPI, so a link looks plausible. But governance rules never read it, dissolution does not revoke it, and the identifier outlives the band by decades. Independent lifecycles, no shared state, no trigger. (The identifier-by-type dependency is with 01.02, not governance — see CX-18.) |
| R-03 | 01.08 Trader Status | 01.06 Portfolio/EPK | Trader status is a commerce disclosure to a buyer; the EPK is a professional pitch to a booker. Different audiences, different artifacts, no shared state. A trader disclosure on an EPK would be noise; its absence there is correct. |
| R-04 | 01.10 Estates | 01.08 Trader Status | A deceased trader's legal obligations pass to their estate in law, but on-platform the account simply stops selling. No live interaction worth modelling — the estate administers a catalogue (01.10's real subject), not a shop. |
| R-05 | 01.02 Organizations | 01.01.02 Aliases | Considered modelling aliases as single-member orgs to unify the party model (01.01.02 DT-03). Rejected for the common case: a solo alias has no members, no treasury, no governance and no dissolution, so every alias would carry four empty concepts. **Reopened for the shared-alias case** (a duo) — which has all four, and is 01.01.02 Q-01/domain Q-08. The promotion path in CX-11 is how the two models connect without merging them. |
| R-06 | 01.07 Credential Verification | 01.01.01 Role Facets | Both describe "what you do professionally", so gating facets on credentials looks tidy. Rejected (01.01.01 D-02): facets are self-asserted and unverified *by design* — gating them would make the platform unusable for the long tail who hold no union card, which is most working musicians. The cost of a false facet is an empty portfolio, not a false credential. (The *non-gating* relationship — a badge decorating a facet — is real and kept as CX-19.) |
