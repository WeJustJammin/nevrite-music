# Identity, Profiles & Organizations — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-23
> **Novelty**: `industry-standard` | **Priority**: `core`

## Overview

Who exists on the platform: humans holding several simultaneous professional roles, and bands/labels/studios/venues/agencies as first-class entities that book, sign, own and get paid independently of their members — plus the membership and representation graph, the profile/EPK surface, and the claim-and-verify flow that turns a seeded record into an owned one.

**Why this is a top-level domain**: Survives the skeptic on three grounds. (1) It is a destination, not a surface: the profile/EPK is the most-visited page type on any music platform and the artifact hiring decisions are made from; claiming a venue page is a funnel with its own conversion rate; band governance is somewhere you go. (2) It is product ontology, not mechanism. Music's defining structural fact is the multi-hyphenate (a drummer who mixes, sits in three bands, engineers at a studio and sells a cymbal) and the band-as-entity that signs and is paid independently of any member. Every platform that modelled 'user has a profile' — early SoundCloud, Bandcamp, every LinkedIn-for-music — could never represent a band or a manager acting for an artist. (3) Boundary narrowed in direct response to a verifier who argued this is a cross-cut. That objection correctly identified real duplication, and I acted on all of it: KYC/KYB moved to Payments, age assurance to Safeguarding, entity merge to Canonical Data, account security split to architecture and Trust. The seam that remains is explicit — this domain owns the ENTITY MODEL and the membership/representation graph (who is a member of what, with what mandate); the Roles & Permissions cross-cut owns ENFORCEMENT at every call site. That line was already drawn in the cross-cut's own rationale. What survives extraction is ontology, and ontology is the most expensive thing on this map to retrofit.

**Interacting capabilities** (what justifies domain status):

- multi-role professional identity
- organisation & band entity model
- membership & representation graph
- profile, portfolio & EPK
- claiming & ownership verification
- professional & credential verification

**What the breadth pass found** (2026-07-16): the boundary narrowing held — no candidate turned out to be account security, KYC, or age assurance re-entering by the back door. Two structural discoveries reshaped the domain. First, **shadow parties** (01.05.01): the sweep's candidate list covered claiming but not how an unowned party comes to exist, and the Producer cannot capture credits at a session where half the room has no account. That makes shadow parties the precondition for the entire provenance thesis, not a convenience. Second, the **growth loop** (CX-04): the portfolio a shadow party accumulates from other people's attestations is what makes claiming worth doing, and its attesters are the proof the claimant is real. The wedge feature is the acquisition mechanism, and the provenance graph is an identity-verification substrate no competitor can copy — they would have had to be in the room. Both were unnamed in the sweep.

## Children

> Classified through the Node Classification Gate on 2026-07-16. 12 sweep candidates → **6 sub-domains + 4 features**, containing **24 leaf feature files** in total.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01.01 | Person Identity & Roles | sub-domain | [01.01-person-identity-roles/](./01.01-person-identity-roles/) | `[BREADTH]` | 12 hypotheses (4 features) |
| 01.02 | Organizations & Entity Model | sub-domain | [01.02-organizations-entity-model/](./01.02-organizations-entity-model/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 01.03 | Membership, Representation & Mandate | sub-domain | [01.03-membership-representation-mandate/](./01.03-membership-representation-mandate/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 01.04 | Band & Ensemble Governance | sub-domain | [01.04-band-ensemble-governance/](./01.04-band-ensemble-governance/) | `[BREADTH]` | 12 hypotheses (4 features) |
| 01.05 | Profile Claiming & Ownership Verification | sub-domain | [01.05-profile-claiming-verification/](./01.05-profile-claiming-verification/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 01.06 | Portfolio, Media Reel & EPK | sub-domain | [01.06-portfolio-media-epk/](./01.06-portfolio-media-epk/) | `[BREADTH]` | 9 hypotheses (3 features) |
| 01.07 | Professional, Union & Credential Verification | feature | [01.07-professional-credential-verification.md](./01.07-professional-credential-verification.md) | `[SURFACE]` | 3 hypotheses |
| 01.08 | Trader vs Private Seller Classification | feature | [01.08-trader-status-classification.md](./01.08-trader-status-classification.md) | `[SURFACE]` | 3 hypotheses |
| 01.09 | Party Identifier Resolution | feature | [01.09-party-identifier-resolution.md](./01.09-party-identifier-resolution.md) | `[SURFACE]` | 3 hypotheses |
| 01.10 | Estates, Deceased Users & Legacy Accounts | feature | [01.10-estates-legacy-accounts.md](./01.10-estates-legacy-accounts.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `domain` — a top-level grouping within a surface (folder with index + CX)
> - `sub-domain` — a grouping within a domain that has 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Candidate Disposition

> How the sweep's 12 candidates map to what was actually created. Nothing was dropped silently.

| Sweep candidate | Disposition |
|---|---|
| 01 Multi-Role Professional Identity | → sub-domain **01.01** (merged with candidate 09) |
| 02 Organizations & Entity Model | → sub-domain **01.02** |
| 03 Band & Ensemble Governance | → sub-domain **01.04** |
| 04 Membership, Teams & Mandate Scope | → **merged** into sub-domain **01.03** (with candidate 05) |
| 05 Representation & Roster Relationships | → **merged** into sub-domain **01.03** (with candidate 04) |
| 06 Profile Claiming & Ownership Verification | → sub-domain **01.05**, expanded with a Deep Think addition (shadow parties) |
| 07 Professional, Union & Credential Verification | → feature **01.07** |
| 08 Trader vs Private Seller Classification | → feature **01.08** |
| 09 Act-As / Context Switching | → **merged** into 01.01 as feature **01.01.03**; enforcement half escalated as a cross-cut, transport half routed to `/create-prd-architecture` |
| 10 Party Identifier Resolution (ISNI/IPI/IPN/PRO) | → feature **01.09**; registry integration mechanics routed to `/create-prd` |
| 11 Portfolio, Media Reel & EPK | → sub-domain **01.06**, split to surface the credit-backed portfolio as its own feature |
| 12 Deceased Users, Estates & Legacy Accounts | → feature **01.10** |

**Deep Think additions** (not in the candidate list): 01.01.02 Artist Names/Aliases · 01.01.04 Legal vs Public Identity · 01.02.03 Org Type Transitions · 01.05.01 Shadow Party Creation · 01.06.02 Credit-Backed Portfolio (split out).

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md) (D-19). Referenced, never redefined.

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 01.01 Person Identity & Roles | ✅ Full | ✅ Full | ✅ Full | ⚙️ Config |
| 01.02 Organizations & Entity Model | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 01.03 Membership, Representation & Mandate | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 01.04 Band & Ensemble Governance | ✅ Full | 👁️ Read-only | ❌ None | 👁️ Read-only |
| 01.05 Profile Claiming & Ownership Verification | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 01.06 Portfolio, Media Reel & EPK | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 01.07 Professional, Union & Credential Verification | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 01.08 Trader vs Private Seller Classification | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |
| 01.09 Party Identifier Resolution | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 01.10 Estates, Deceased Users & Legacy Accounts | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> **Reading this matrix**: `personas.md` is explicit that these are lenses on behaviour, not account types — one human occupies three of them in a day. Access in 01.04 in particular is granted by **membership**, not by persona: a Producer who is in the band governs it; the ❌ against Operator means an Operator has no standing in a band they are not part of.
>
> **Two Fan lenses are load-bearing rather than incidental**: 01.08 Read-only is the *point* of trader classification — the disclosure exists to be read by the buyer (01.08 DT-03). 01.04 Read-only is the fan-facing consequence of a dissolution: their follow rides the name and moves with it (01.04.02 DT-03).
>
> **Rules:**
> - Persona names come from `meta/personas.md` — use short names
> - NEVER redefine a persona here — reference only
> - Only list children that exist — the matrix grows as children are added
> - Access icons are shorthand; detailed per-role behavior lives in each feature file's **Role Lens**

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Survives the skeptic on three grounds. (1) It is a destination, not a surface: the profile/EPK is the most-visited page type on any music platform and the artifact hiring decisions... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | Candidates 04 (Membership/Mandate) and 05 (Representation/Roster) **merged** into sub-domain 01.03 | One graph, two edge types, one mandate model. A band member who can sign for the band and a manager who can sign for the band have identical authority and must not be authorised by two mechanisms — they would drift until one had a hole. The domain overview already frames them as one capability. | Node Classification Gate, `/ideate-discover` Step 3 |
| D-03 | Candidate 09 (Act-As) **merged** into 01.01; its enforcement half escalated as a cross-cut, its transport half routed to architecture | Act-As is the runtime expression of multi-role identity, not a separate thing — the context list is *derived* from role facets, aliases and memberships. Splitting it would put a derived value in a different node from its inputs. | Node Classification Gate + 01.01.03 DT-02 |
| D-04 | **Shadow parties added** (01.05.01) — a Deep Think addition, not a sweep candidate | The thesis (D-18) requires capture at the session; `personas.md` says the design "must make the lazy path the correct path". A signup wall at the capture moment makes the lazy path the wrong path, and the lazy path always wins. Shadow parties are the precondition for provenance, and their claim flow is the growth loop (CX-04). | Deep Think, `/ideate-discover` Step 3 |
| D-05 | **Aliases are first-class objects** (01.01.02), not a string on the person record | One human = several artist identities, each with its own catalogue, following and ISNI. Credits attach to the alias and resolve to the person. A field holds one value, so the second alias forces a second account and fragments the credit graph — the exact failure the platform exists to fix. Catastrophic retrofit cost. | Deep Think DT-01/DT-02 on 01.01.02 |
| D-06 | **Org type is a set, not a value** (01.02.03) | The indie reality: one address is a rehearsal room, a studio and a 120-cap venue; a band starts a label. One type per entity forces three entities and shatters the history that makes each credible. Followers/reviews/credits attach to the party, never the type, so transitions need no migration. | Deep Think DT-01/DT-03 on 01.02.03 |
| D-07 | **Legal identity is a separate authorised surface**, not flagged fields on the person record (01.01.04) | A visibility flag is a filter that must be applied correctly at every read path in 24 domains forever; one omission is one permanent doxx. A separate surface makes leaking require an explicit act. Note the collision recorded at CX-08: trader law lawfully overrides this. | Deep Think DT-01 on 01.01.04 |
| D-08 | **The record of work is never destroyed by any lifecycle event** — not by facet removal, org closure, member departure, dissolution, or death | Applied five times independently (01.01.01 D-03, 01.02.02 D-03, 01.03.01 D-04, 01.04.04 D-01, 01.10 D-01) and it is the domain's single invariant. `problem-statement.md` exists because "the proof of it evaporates"; a delete would be the platform performing that evaporation itself, usually on third parties who never consented. | Agent, derived from `problem-statement.md` |
| D-09 | **The band default mandate is a peer seed with a value ceiling, keyed to capacity, and scoped to bands alone** — every `confirmed` `permanent` band membership edge carries all seven activities (book/sign/spend/list/release/settle/administer) up to **USD 1,000 per act**, configurable per band, escalating above it to the uncapped owning-mandate holder; `touring`/`staff`/`honorary` hold presence with zero authority until granted; studio/venue/label/shop/agency are not seeded at all | Resolves Q-03, the domain's highest-stakes product decision, which almost every band will live on forever. Neither published horn taken whole: custodial seeding was refused on 01.03.03 DT-03's own reasoning (it makes whoever typed the name first the owner of the band), and "all members, all authority" was taken bounded rather than absolute. Accepted cost, stated rather than designed away: the split-push `personas.md` names is maximally enabled below the ceiling, and the defence is after-the-fact transparency (01.04.03 D-01) plus the audit trail. Two obligations reach outside 01.03: the seed includes `administer`, so the governance disclosure must describe the same authority in the same words (01.04.01 D-05), and 01.03-cx R-02 was amended in the same pass to distinguish a barred *derivation* from a permitted *rebuttable default*. Detail: 01.03.03 D-07..D-10. | User ratification, DQ-02.4 / DQ-02.5 / DQ-02.6 / DQ-02.7 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — 6 sub-domains, 4 features, 24 leaf features. See Candidate Disposition. | Agent | ✅ `/ideate-discover` Step 3 |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — none were wholly cross-cuts, but three (Act-As, Mandate Scope, Trader Status) split: identity holds the fact, a cross-cut enforces it. Nine cross-cuts escalated, five not-product concerns routed. See [identity-profiles-organizations-cx.md](./identity-profiles-organizations-cx.md). | Agent | ✅ `/ideate-discover` Step 3 |
| Q-03 | ~~**What is the default mandate for a band that configures nothing?**~~ **RESOLVED — D-09.** Peer seed with a ceiling: every `confirmed` `permanent` band membership edge carries all seven activities up to **USD 1,000 per act**, escalating above that to the uncapped owning-mandate holder; `touring`/`staff`/`honorary` carry presence with zero authority as a rebuttable default; no non-band org type is seeded at all. Detail at 01.03.03 D-07..D-10. | User | ✅ Ratified by owner |
| Q-04 | **Governance terms and mandates can contradict, and both display as true.** Governance should be the source and mandate the derived enforcement — but mandate exists from org creation while governance arrives years later, so the dependency runs backwards. | Agent | `/create-prd-architecture` (CX-06, 01.04.03 Q-01) |
| Q-05 | **[OWNER] How does a 20-year veteran's pre-platform career get onto their page?** *Mechanism settled, judgment open.* Imports render at rung 1, are permanently source-marked and are never promotable (`02.03.01` D-01: "Imported credits are permanently source-marked and capped below captured tiers"; `02.04.02` D-03: "Claiming and self-assertion never raise the rung"), and no copy claims completeness (`01.06.02` D-06) — so the purity is protected by rung separation rather than diluted. What remains is the product judgment `01.06.02` Q-01 records: does a page reading "1,847 credits — Listed on Discogs" help the veteran or advertise that the platform did not witness their career? Its recommendation is to accept it, fix the copy, and move import earlier in `/plan-phase`. | User | `/create-prd` (01.06.02 Q-01) |
| Q-06 | ~~**What limits apply to shadow party creation?**~~ **RESOLVED — none on creation; the effects are tiered.** Per [01.05.01](./01.05-profile-claiming-verification/01.05.01-shadow-party-creation-invitation.md) **D-06**: "Creation is never limited; the effects of creation are. No rate limit, quota, reputation gate or per-submission cap may cause a capture to fail — DT-05 — **resolves parent Q-01 and domain Q-06.**" Invitation dispatch and shadow visibility are tiered on the creator's credit-graph standing (D-07: Tier 0 = 10 dispatches/24h and unindexed, Tier 1 = 100/24h and searchable), and excess dispatch is queued, never dropped (D-08). The paradox was an artifact of conflating the record with its effects. | User | ✅ `/ideate-discover` Step 5 (01.05.01 D-06) |
| Q-07 | **[OWNER] Who adjudicates contested claims** — the platform (support burden + liability) or domain 24 (makes identity depend on a domain that may ship later)? Verified still open on both sides of the seam: `01.05.03` Q-01 carries it unchanged, and 24 asks the same question back — `24.07` Q-01 and `24.07.02` Q-01 ("**Does the platform adjudicate band-name ownership, or freeze and route to counsel?** DT-03 says the second, and users will hate it. This is the owner's call.", Owner: *User + counsel*). Neither domain can close it for the other. | User | `/create-prd` (01.05.03 Q-01) |
| Q-08 | ~~**Is a shared alias (a duo) an alias with co-owners, or an organisation?**~~ **RESOLVED — it is a band org.** Per [01.01.02](./01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md) **D-04**: "A shared name is a band org (01.02.01 type `band`), not a co-owned alias. Aliases are single-owner by construction. Alias creation asks 'is anyone else in this?' and routes accordingly." Co-ownership brings members, decision rules, name ownership and dissolution — 01.04's exact definition of a band. Consequences recorded at CX-11 (one handle namespace, solo→shared promotion) and CX-12 (governance capture reachable from alias creation). | Agent | ✅ `/ideate-discover` Step 5 (01.01.02 D-04) |
| Q-09 | ~~**Is a session player a member with a narrow mandate, or a non-member with a credit?**~~ **RESOLVED — non-member with a credit.** Per [01.03.01](./01.03-membership-representation-mandate/01.03.01-membership-records-lifecycle.md) **D-05**: "A session engagement produces a **credit** (domain 02), never a membership edge. No inference path from credit → membership exists — DT-04; **resolves Q-01 / parent Q-01 / domain Q-09.** Membership is a period relationship with an org; a credit is an event relationship with a work. The credit graph carries the majority of music's working relationships." `session` was removed from the capacity enum (D-03) and lineup may never be used to infer record personnel (D-15). | Agent | ✅ `/ideate-discover` Step 5 (01.03.01 D-05) |
| Q-10 | **[OWNER] Does a Fan have a public profile at all?** D-11 makes them first-class users; that does not settle whether they are *visible*. Determines whether 01.06 needs a fourth, radically thinner page archetype. Verified still open at both dependants (`01.01` Q-03, `01.06` Q-01), and 03 records adjacent evidence without deciding it (`03.01.01` Q-03: no Follow control on a Fan profile is "an *emptiness* argument, not a *policy* one"). A visibility choice about a persona — the owner's product call. | User | `/create-prd` (01.01 Q-03, 01.06 Q-01) |
| Q-11 | **Does the platform hold band money (a balance) or only route it?** Holding is a regulated activity; routing avoids it and makes a band treasury impossible. Constrains the payments provider choice already open in `meta/constraints.md`. | User | `/create-prd-stack` (01.04.03 Q-02) |
| Q-12 | **[OWNER]** Personas Q-01 asked whether a **professional dealer** is a distinct persona, to be revisited "if the Gear/Digital Role Matrices come out thin". This domain's evidence: 01.08's Role Lens is not thin — Musician-as-trader is the *hard* case and the reason trader status lives in identity (D-01 on 01.08). It reads as a Musician in a selling context, not a fifth persona. **This domain's evidence is not the whole record**: 13 reports five independent arrivals at the same seam (`13.08.01` Q-01/DT-01/DT-11, `13.09`, `13.12` DT-02/DT-05, `13.13`), and `13.12` DT-05 argues trader status attaches to a *capacity*, not a person — which cuts against this row's reading. `meta/personas.md` Q-01 is explicit that D-71 does **not** close it and already re-points here; canonical entry `vision.md` Q-05. Persona-set changes are the owner's. | User | `/create-prd` (personas.md Q-01, vision.md Q-05) |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-71|D-71]]
