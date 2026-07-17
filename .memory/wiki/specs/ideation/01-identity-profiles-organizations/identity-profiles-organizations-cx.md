# Identity, Profiles & Organizations — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Identity, Profiles & Organizations](./identity-profiles-organizations-index.md)
> **Status**: [BREADTH] — children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | The acting-context list is a derived view over the membership/representation graph. Aliases + mandated orgs + represented parties = the switcher's contents | Musician, Producer, Operator | High | 01.01.03 D-01 (derivation) + 01.03 index D-01 |
| CX-02 | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | Merging duplicate parties must **redirect** credits, never rewrite them — the portfolio's value rests on the credit record being immutable | Musician, Producer | High | 01.06.02 D-03 + 01.05.01 Edge Cases (duplicate shadows) |
| CX-03 | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | Creation and claiming are the two doors to the same entity. Creation is a weak assertion; claiming is a proof. Duplicate detection at creation routes into the claim flow | Musician, Producer, Operator | High | 01.02.02 D-01/D-02 + 01.05 index D-03 |
| CX-04 | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | [01.05 Profile Claiming](./01.05-profile-claiming-verification/) | The unclaimed party's portfolio — built entirely from other people's attestations — is the claim incentive, and its attesters are the claim's proof. The domain's growth loop | Musician, Producer, Operator | High | 01.05.01 DT-03 + 01.05.02 DT-03 + 01.06 index D-03 |
| CX-05 | [01.09 Party Identifier Resolution](./01.09-party-identifier-resolution.md) | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | Identifiers attach to any party — including aliases, because ISNI is assigned per public identity, not per human | Musician, Producer | High | 01.09 D-02 + 01.01.02 D-01 |
| CX-06 | [01.04 Band & Ensemble Governance](./01.04-band-ensemble-governance/) | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | Governance should be the source of mandates; today they are independently editable and can contradict. The domain's sharpest unresolved conflict | Musician | High | 01.04.01 DT-03 + 01.04.03 Q-01 + 01.04 CX-01 |
| CX-07 | [01.04 Band & Ensemble Governance](./01.04-band-ensemble-governance/) | [01.02 Organizations & Entity Model](./01.02-organizations-entity-model/) | `dissolved` is a band-specific terminal lifecycle state, governed by 01.04 and executed against 01.02's lifecycle model. Reputation and followers attach to the party, so they survive both | Musician, Operator, Fan | High | 01.02.02 Behavior (lifecycle states) + 01.04.04 Behavior + 01.02.03 D-03 |
| CX-08 | [01.08 Trader Status](./01.08-trader-status-classification.md) | [01.01 Person Identity & Roles](./01.01-person-identity-roles/) | Trader status legally **forces publication** of the legal identity 01.01.04 exists to protect. A statutory duty overriding a privacy model | Musician, Producer, Operator, Fan | High | 01.08 D-05 + 01.01.04 Edge Cases (sole trader) |
| CX-09 | [01.10 Estates & Legacy Accounts](./01.10-estates-legacy-accounts.md) | [01.03 Membership, Representation & Mandate](./01.03-membership-representation-mandate/) | Death terminates mandate but not membership history; estate access is modelled as a representation edge, not an identity handover | Musician, Producer, Operator | High | 01.10 D-01/D-02 + 01.03.01 Edge Cases (member dies) |
| CX-10 | [01.07 Credential Verification](./01.07-professional-credential-verification.md) | [01.06 Portfolio, Media Reel & EPK](./01.06-portfolio-media-epk/) | Badges are attested content on the page and in the EPK. Expiry silently changes an artifact that was already pitched | Musician, Producer, Operator | Medium | 01.07 D-02 + 01.06.03 Q-01 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-level references:** Where a cross-cut spans levels, it is recorded here at the higher level with a link to the specific lower-level item. The detail of HOW the children interact lives in each sub-domain's own CX file.

---

## Cross-Cut Details

### CX-01: Membership/Mandate ↔ Person Identity

**Relationship**: The acting-context list (01.01.03) is not stored — it is computed from the person record, their aliases, the orgs where their membership carries a mandate, and the parties they represent. This single design choice pays out three times: contexts can never be stale, revocation needs no cleanup sweep, and the Fan (no aliases, no mandates) gets exactly one context and therefore never sees the switcher at all.

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
1. **Shared state conflict**: Which record survives is the merge's decision. The credits must reference the surviving party *through a redirect*, so the original attestation is never mutated. Attestation is evidence; evidence does not get edited during a cleanup.
2. **Trigger chain**: Merge → party redirect → portfolio view resolves through it → page and EPK reflect the union. If the redirect fails, credits must point at the old party (visible but stale), never at nothing.
3. **Permission intersection**: Who may merge? Not modelled here (the cross-cut's). But merging two parties is a high-authority act with irreversible consequences for third parties' portfolios — **escalated**.
4. **Notification fan-out**: Both parties' attesters should know. Their attestation now points somewhere else.
5. **State transition conflict**: A merge racing a claim on one of the two records — 01.05.03's freeze posture likely applies, but this is unmodelled. `[PENDING — Step 5]`

---

### CX-03: Organizations ↔ Profile Claiming

**Relationship**: Two doors to one entity. 01.02.02 D-01 makes creation cheap and *weak* (an assertion), and 01.05 makes claiming the proof. Without that asymmetry, the first person to type "The Lexington" would own it. Duplicate detection at creation is where the doors meet, and it is the cheapest possible moment to prevent a split identity — after creation it becomes a merge, and CX-02 shows what merges cost.

**Role scoping**:
- **Operator**: the primary path — their venue usually exists before they arrive, so claiming is their front door.
- **Musician**: creates a band; detection catches the bandmate who created it yesterday.
- **Producer**: creates a studio.
- **Fan**: cannot create orgs — which removes the largest population from the pollution surface.

**Synthesis questions answered**:
1. **Shared state conflict**: One party record either way. The question is whether a *second* gets created, which detection exists to prevent.
2. **Trigger chain**: Create attempt → detection → claim/join offered instead. Refusal is allowed (the user may genuinely have a different entity); the Canonical Data cross-cut inherits the residue.
3. **Permission intersection**: Creation requires nothing; claiming requires proof; adding a capability to an existing entity requires a mandate. The correct action is therefore *harder* than the wrong one — a perverse incentive, flagged in 01.02 CX-02 and worth revisiting.
4. **Notification fan-out**: Claiming an entity someone else created should notify the creator; they made an assertion that is now being resolved.
5. **State transition conflict**: Two people creating the same band concurrently — detection is best-effort; the residue is a merge.

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
4. **Notification fan-out**: The subject is invited. Whether attesters learn their subject claimed is `[PENDING — Step 5]`, but it closes their loop and confirms the capture worked.
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
1. **Shared state conflict**: Lifecycle state and type set both live on the party. Divergent terminal states per type on a multi-type entity is unmodelled — `[PENDING — Step 5]`, and the sharpest gap in 01.02.
2. **Trigger chain**: Dissolution → 01.02.02 terminal state → name disposition (01.04.02) → follower graph moves (domain 20) → booking resolution changes (domain 17). One governance event, three domains.
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
5. **State transition conflict**: A private seller reclassified to trader with live listings — do their existing listings retroactively publish their address? Unmodelled and consequential. `[PENDING — Step 5]`

---

### CX-09: Estates ↔ Membership/Mandate

**Relationship**: Death terminates authority and nothing else. The membership edge ends (with a date, like any departure); the mandate terminates immediately; the credits, the attestations they made, and the lineup history are untouched. Estate access is modelled as a representation edge (01.03.02) rather than an identity handover — so the estate acts as itself, on behalf of the party, and can never attest a credit in the dead person's name.

**Role scoping**: Musician/Producer (nomination, and the deceased's own credits). Operator (org succession independent of any person). Fan (memorialised page).

**Synthesis questions answered**:
1. **Shared state conflict**: The party persists; only authority moves. Nothing merges.
2. **Trigger chain**: Verified death → mandate terminated → membership edge ended → estate representation edge created (if a successor exists). If no successor, authority simply ends and the catalogue keeps earning into an unadministrable party — 01.10 Q-01, the majority case.
3. **Permission intersection**: The defining rule (01.10 D-02) — the estate's edge is scoped to administration, never to attestation. Falls out of the existing graph with no new mechanism.
4. **Notification fan-out**: Bandmates, counterparties, followers.
5. **State transition conflict**: The deceased was the only mandate holder for a band. Departure would be blocked (01.03.01), but nobody can be blocked from dying — so the org needs a mandate recovery path that the departure rule does not provide. Real gap, `[PENDING — Step 5]`.

---

### CX-10: Credential Verification ↔ Portfolio/EPK

**Relationship**: Badges are attested content, rendered on the page and in the EPK. Both are live views (01.06.02 D-03, 01.06.03 D-01), so an expiring credential silently changes an artifact that was already pitched — a promoter who opened an EPK last week showing current public liability cover may open it today and see it expired, or worse, a band may have booked partly on a badge that has since lapsed.

**Role scoping**: Operator (their insurance/licence is the safety-critical case). Musician/Producer (union and PRO badges). Fan (sees a badge, never the credential system).

**Synthesis questions answered**: Medium confidence — 1, 3, 5 deferred to Step 5. (2) Expiry → badge state changes → page and every live EPK change. (4) The *owner* is reminded before expiry (01.07 Happy Path), but nobody who **relied** on the badge is told — which is the gap, and it is 01.07 Q-01 and 01.06.03 Q-01 arriving at the same place from opposite directions.

---

## Cross-Cuts Escalated to Global CX

> Mechanisms discovered while drilling this domain that serve **many** domains. Recorded here for the orchestrator to absorb into `ideation-cx.md`. **No node was created for any of these.**

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **Roles, Permissions & Enforcement** | All 24 | Already a ratified cross-cut. This domain owns the mandate *data* (01.03.03); the cross-cut authorises at every call site. The seam was drawn in the domain overview and is not re-litigated. |
| **Visibility, Privacy & Audience Scoping** | All 24 | The general mechanism of audience-scoping any field. 01.01.04 owns *which identities exist and which flow legally requires which one*; the scoping engine is not identity's. |
| **Canonical Data / Entity Merge & Redirect** | 01, 02, 05, 13, 14, 16 | Already ratified as extracted. **Escalated with a new constraint**: merges must redirect credits, never rewrite them (CX-02). Rewriting would break the immutability 01.06.02's value rests on — the platform editing history to fix a bookkeeping problem. |
| **Invitation & Onboarding Handoff** | 01, 02, 03, 05, 07, 16, 17 | **New discovery.** Membership invites (01.03.01), shadow-party invites (01.05.01) and claim invites (01.05.02) are one mechanism reached three ways. Three separate implementations would produce three different arrival experiences for the same stranger. |
| **Audit Trail / Attributed Writes** | 01, 02, 09, 10, 24 | Every mandate grant, context switch, ownership transfer and governance amendment is *evidence*, not a log line. The domain's value depends on it being immutable and attributable. |
| **KYC / KYB & Payable Party** | 01, 05, 13, 14, 17, 19, 23 | Extracted to Payments at ratification. **Escalated with a dependency**: a band cannot receive money until governance names someone who may act on it (01.04.03) — Payments cannot answer that question because it does not know the band's decision rules. |
| **Data Portability / Export** | All 24 | `problem-statement.md` Q-02 asks whether the lock-in is earned or hostile. Identity is where the answer is most visible: if a user leaves, do their attested credits go with them? A values decision, not a feature. |
| **Reviews & Reputation** | 01, 05, 13, 14, 16, 17 | Reputation attaches to the party, so it survives org type transitions (01.02.03 D-03) — a studio's ten-year reputation becomes its venue reputation. Whether that is *fair* is 01.02.03 Q-02, and it belongs to the cross-cut's owner. |
| **Real-Time / Notification Fan-out** | All 24 | Mandate changes, claim outcomes, expiring credentials, dissolutions. This domain generates notifications whose *absence* is a security or safety event, not just a missed update. |

## Not-Product Concerns Routed Out

> Discovered while drilling. **No node created.** Routed to `/create-prd`.

| Concern | Routed to | Why it is not product |
|---|---|---|
| Acting-context propagation & RLS enforcement | `/create-prd-architecture` | How the acting party_id travels through Workers → Supabase and is enforced at the row level. The switcher (01.01.03) is product; the transport is not. |
| ISNI / IPI / PRO / DDEX registry integration mechanics | `/create-prd-architecture`, `/create-prd-stack` | API clients, sync jobs, reconciliation. *Which* identifiers a party holds (01.09) is product; how we talk to CISAC is not. |
| Party/alias/org data model normalisation | `/create-prd-architecture` | The Party↔Person↔Alias↔Organization schema. This domain decided the *ontology* (aliases are objects, type is a set); the schema that implements it is architecture. |
| Entity merge implementation | `/create-prd-architecture` | Already routed at ratification. CX-02 adds the redirect-not-rewrite constraint as a product requirement on it. |
| Account security (password, MFA, sessions, device management) | `/create-prd-security` | Split out at ratification. Not re-absorbed. Note: **no candidate in this domain's list was account security** — the boundary narrowing held. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 01.07 Credential Verification | 01.05 Profile Claiming | The most tempting merge in the domain — both are called "verification", and they were adjacent candidates in the sweep. Rejected (01.07 DT-02): claiming proves *control of a party*; a credential proves *an assertion about a party*. A union card is not proof you own a profile (many AFM members share a name), and control of a venue's email says nothing about its insurance. Different subject, different evidence, different failure mode. Recorded rather than dropped, because it will be proposed again. |
| R-02 | 01.09 Party Identifiers | 01.04 Band Governance | A band holds an IPI, so a link looks plausible. But governance rules never read it, dissolution does not revoke it, and the identifier outlives the band by decades. Independent lifecycles, no shared state, no trigger. |
| R-03 | 01.08 Trader Status | 01.06 Portfolio/EPK | Trader status is a commerce disclosure to a buyer; the EPK is a professional pitch to a booker. Different audiences, different artifacts, no shared state. A trader disclosure on an EPK would be noise; its absence there is correct. |
| R-04 | 01.10 Estates | 01.08 Trader Status | A deceased trader's legal obligations pass to their estate in law, but on-platform the account simply stops selling. No live interaction worth modelling — the estate administers a catalogue (01.10's real subject), not a shop. |
| R-05 | 01.02 Organizations | 01.01.02 Aliases | Considered modelling aliases as single-member orgs to unify the party model (01.01.02 DT-03). Rejected for the common case: a solo alias has no members, no treasury, no governance and no dissolution, so every alias would carry four empty concepts. **Left open for the shared-alias case** (a duo) — which has all four, and is 01.01.02 Q-01. |
| R-06 | 01.07 Credential Verification | 01.01.01 Role Facets | Both describe "what you do professionally", so gating facets on credentials looks tidy. Rejected (01.01.01 D-02): facets are self-asserted and unverified *by design* — gating them would make the platform unusable for the long tail who hold no union card, which is most working musicians. The cost of a false facet is an empty portfolio, not a false credential. |
