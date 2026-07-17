# Identity, Profiles & Organizations — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
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
| 01.01 | Person Identity & Roles | sub-domain | [01.01-person-identity-roles/](./01.01-person-identity-roles/) | `[SURFACE]` | 12 hypotheses (4 features) |
| 01.02 | Organizations & Entity Model | sub-domain | [01.02-organizations-entity-model/](./01.02-organizations-entity-model/) | `[SURFACE]` | 9 hypotheses (3 features) |
| 01.03 | Membership, Representation & Mandate | sub-domain | [01.03-membership-representation-mandate/](./01.03-membership-representation-mandate/) | `[SURFACE]` | 9 hypotheses (3 features) |
| 01.04 | Band & Ensemble Governance | sub-domain | [01.04-band-ensemble-governance/](./01.04-band-ensemble-governance/) | `[SURFACE]` | 12 hypotheses (4 features) |
| 01.05 | Profile Claiming & Ownership Verification | sub-domain | [01.05-profile-claiming-verification/](./01.05-profile-claiming-verification/) | `[SURFACE]` | 9 hypotheses (3 features) |
| 01.06 | Portfolio, Media Reel & EPK | sub-domain | [01.06-portfolio-media-epk/](./01.06-portfolio-media-epk/) | `[SURFACE]` | 9 hypotheses (3 features) |
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

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — 6 sub-domains, 4 features, 24 leaf features. See Candidate Disposition. | Agent | ✅ `/ideate-discover` Step 3 |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — none were wholly cross-cuts, but three (Act-As, Mandate Scope, Trader Status) split: identity holds the fact, a cross-cut enforces it. Nine cross-cuts escalated, five not-product concerns routed. See [identity-profiles-organizations-cx.md](./identity-profiles-organizations-cx.md). | Agent | ✅ `/ideate-discover` Step 3 |
| Q-03 | **What is the default mandate for a band that configures nothing?** "All members, all authority" matches how bands see themselves and enables the Producer's worst-intentional behaviour; "creator only" is safe and makes whoever typed the name first the owner. Almost every band will live on this default forever. The highest-stakes product decision in the domain. | User | `/ideate-discover` Step 5 (01.03.03 Q-01) |
| Q-04 | **Governance terms and mandates can contradict, and both display as true.** Governance should be the source and mandate the derived enforcement — but mandate exists from org creation while governance arrives years later, so the dependency runs backwards. | Agent | `/create-prd-architecture` (CX-06, 01.04.03 Q-01) |
| Q-05 | **How does a 20-year veteran's pre-platform career get onto their page?** Every option (self-asserted historic credits, Discogs/MusicBrainz import, retroactive attestation) dilutes the attested-at-source purity that is the differentiator. The platform's most credible users are the ones it serves worst on day one. | User | `/ideate-validate` (01.06.02 Q-01) |
| Q-06 | **What limits apply to shadow party creation?** Unlimited is simultaneously the thesis-optimal and the abuse-optimal answer. Every limit costs captures; every capture may cost a contest (CX-03 in 01.05). | User | `/ideate-discover` Step 5 (01.05.01 Q-01) |
| Q-07 | **Who adjudicates contested claims** — the platform (support burden + liability) or domain 24 (makes identity depend on a domain that may ship later)? | User | `/ideate-validate` (01.05.03 Q-01) |
| Q-08 | **Is a shared alias (a duo) an alias with co-owners, or an organisation?** It has members, a split and a dissolution path — the three things that define an org here. Currently modelled as an alias; the case strains it. | Agent | `/ideate-discover` Step 5 (01.01.02 Q-01) |
| Q-09 | **Is a session player a member with a narrow mandate, or a non-member with a credit?** The highest-volume relationship in working music, and it decides whether the membership graph or the credit graph carries most of it. | Agent | `/ideate-discover` Step 5 (01.03 Q-01) |
| Q-10 | **Does a Fan have a public profile at all?** D-11 makes them first-class users; that does not settle whether they are *visible*. Determines whether 01.06 needs a fourth, radically thinner page archetype. | User | `/ideate-validate` (01.01 Q-03, 01.06 Q-01) |
| Q-11 | **Does the platform hold band money (a balance) or only route it?** Holding is a regulated activity; routing avoids it and makes a band treasury impossible. Constrains the payments provider choice already open in `meta/constraints.md`. | User | `/create-prd-stack` (01.04.03 Q-02) |
| Q-12 | Personas Q-01 asked whether a **professional dealer** is a distinct persona, to be revisited "if the Gear/Digital Role Matrices come out thin". This domain's evidence: 01.08's Role Lens is not thin — Musician-as-trader is the *hard* case and the reason trader status lives in identity (D-01 on 01.08). It reads as a Musician in a selling context, not a fifth persona. | User | `/ideate-validate` |
