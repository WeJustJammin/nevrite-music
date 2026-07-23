# Counterparty Profiles — WeJammin

> Status: `[DEEP]` — authored 2026-07-22 by owner decision **D-71** (queue entry DQ-10, sub-decisions
> A1-b / A2-b / A3-a).
> Companion to: [personas.md](./personas.md) — read that file first.
> Consumed by: buyer-facing Role Lens notes in `11.01.02`, `11.02.01`, `11.01-sync-licensing-index`,
> `11.06` and `11.08.02`.

## ⚠️ These are NOT personas

Read this before using anything below.

| Rule | Statement |
|---|---|
| **Not a persona** | Every profile in this file describes a real user of WeJammin who is deliberately **outside** the persona set. |
| **D-19 is unamended** | The four primary personas stay **four**: Musician · Producer · Operator · Fan. This file does not make it five. |
| **No Role Matrix column** | No domain index gains a column. Role Matrix tables stay four-column, everywhere, unchanged. |
| **Reference, never restate** | Authored once, here. Feature files **reference** a profile from their Role Lens; they never copy it. (Author-where-owned, per D-50 / P-04.) |
| **Known weakness** | A reader skimming only a four-column Role Matrix still sees no buyer. The correction depends on the prose note beneath the table being read, and on the pointer from `personas.md`. This is the accepted cost of A1-b over a fifth persona. |
| **Two parties, not one** | `11.08.02` D-11 stays load-bearing and is not expressible as a column: **licensee ≠ purchaser**. An agency purchases; the brand is licensed; the purchaser warrants authority to bind the licensee. |
| **Identity and authority are not defined here** | Buyer identity resolves against domain 01 at request time; authority comes from the ratified `Roles, Permissions & Delegated Authority` cross-cut. This file describes the *person*, not the *party model*. |

**Why two profiles and not one** (A2-b): `11.06`'s index records the two buyer gaps as different in
**kind**, not degree — in `11.01`/`11.03` the buyer matches *no* persona; in `11.06` they match one
*badly*, which is more dangerous, "because a spec writer will read `Fan: Full` and build for a music
enthusiast instead of a small-business operator." One artifact broad enough to cover both would
reproduce that defect one level up, and its fields would diverge on nearly every row.

---

## Counterparty: Professional Licence Buyer (music supervisor / brand / agency)

> Referenced by **11.01** (sync catalogue, supervisor search, briefs, holds), **11.02** (clearance
> verdict, buy-side rendering), **11.03** (rate cards, quotes, negotiation) and **11.08** (licence
> instrument, certificate issuance).

| Field | Detail |
|-------|--------|
| **Name + Role** | Music supervisor for film / TV / games / advertising, a brand's marketing lead, or an agency producer buying on the brand's behalf. Sources music against a specific scene or campaign, to a fixed air-date. Not a music maker; never appears on the sell side of any WeJammin surface. |
| **Primary Pain Point** | They brief in **reference tracks they cannot afford or cannot clear** (`11.01.02`), then discover that the works they *can* afford need months of ownership archaeology. Under a deadline, a perfect track with unresolved ownership is worth less than a good track that is clearable this week — and no catalogue tells them which is which until they have already spent the time. |
| **Current Workaround** | Production-music libraries; publisher and label contacts worked by email and phone; "sounds like *this*" briefs sent to whoever will read them. Clearance chased manually, one rights holder at a time. Quotes negotiated in email threads with no shared state, and a licence assembled by a lawyer at the end. |
| **Success Criteria** | A result set that states clearance status inline, not on a detail page; a "one-stop only" filter that collapses the catalogue to what can be licensed inside the deadline; a hold that actually holds; and an instrument that names purchaser **and** licensee correctly. Measurable: time from brief to executed licence, and the proportion of shortlisted works that clear without escalation. |
| **Switching Trigger** | A placement lost, or a delivery held, because a clearance could not be evidenced before the air-date. Or the reverse: a supervisor discovers a catalogue where the split was already agreed and evidenced, and stops paying for archaeology. |
| **Unique Constraint** | **They buy a rights scope against a clock, not a track.** Media, term, territory and exclusivity are the purchase; the music is the input. They are also frequently **not the licensed party** — an agency purchases on behalf of a brand (`11.08.02` D-11) — so any surface that assumes purchaser = licensee is wrong for them. They will never create a musician profile, so every surface they touch must work for an account with no sell-side content at all. |

### Workflow
1. Receives a brief (a scene, a campaign, a reference track, a budget, a date)
2. Searches by reference and facet (`11.01.02`); results carry clearance state, indicative price band and any active hold inline
3. Filters to one-stop / clearable-within-deadline; shortlists and auditions
4. Places a hold (`11.01.04`) or requests a quote (`11.03.02`)
5. Converges on scope, term, territory and fee through counter-offers
6. Commits at checkout; the instrument issues naming purchaser and licensee (`11.08.02`)

### Anti-Persona Behavior
- **Worst intentional**: enumerates the catalogue by repeated queries — `11.01.02` already rules that "catalogue enumeration is an attack, not a use case"; places broad holds to freeze a competitor's access with no intent to license, exploiting the fact that a hold rewrites what search may offer the next buyer; understates the usage scope at quote time to secure a lower fee, then airs against the wider scope.
- **Worst accidental**: names the wrong licensee — buys as the agency when the party who must be licensed is the brand — which is the exact failure `11.08.02` D-11 exists to prevent; or airs against an unexecuted quote, assuming a negotiation thread is a licence.

---

## Counterparty: Creator Micro-Licence Buyer (podcaster / streamer / small-business channel)

> Referenced by **11.06** (creator catalogue, whitelisting, claim release, persistence) and by the
> **Fan row of `11.02.01`**, which currently describes this population as *silently governed*.

| Field | Detail |
|-------|--------|
| **Name + Role** | A podcaster, streamer, YouTuber, or a small business running a monetised channel. Per `11.06`: they are **running a business that happens not to be a music business**. They have commercial intent, a monetised channel, and a real dispute appetite — none of which personas.md's Fan has. |
| **Primary Pain Point** | They need a track for a video **today**, at a listed price, with no negotiation and no lawyer. And the thing they are actually buying is not the licence: it is **the promise that nothing bad happens afterwards** — no Content ID claim, no demonetisation, no takedown, and no cliff when a subscription lapses. A licence that a platform's matching system claims anyway has sold them nothing. |
| **Current Workaround** | A subscription library (the Epidemic / Artlist shape), a royalty-free pack, or using whatever sounded right and hoping. When a claim lands, they fill in the hosting platform's dispute form and wait, with the video demonetised in the meantime. |
| **Success Criteria** | Buy in one step at a listed price; register the channel so the machines honour the licence; get claims released fast on the occasions one lands anyway; keep what they bought after the subscription ends. Measurable: claims per licensed upload, and time-to-release when one occurs. |
| **Switching Trigger** | A claim or demonetisation on a video they had *already licensed* music for — `11.06` D-03 records "I have a licence and got claimed anyway" as the #1 real-world complaint in this market. Or discovering that a cancelled subscription retroactively stranded their back catalogue. |
| **Unique Constraint** | **They will not negotiate, and must not be asked to** — `11.06` D-04 keeps this sub-domain entirely clear of `11.03`: flat listed prices, no quotes, no MFN, no counter-offers. They also never see a clearance verdict: per `11.02.01`, a work that cannot clear simply is not purchasable, and "unavailable" is the whole of the effect they see. That is correct — a buyer with no professional stake will not act on "Sarah hasn't attested" — but it means their surface must be self-explanatory with zero rights vocabulary. |

### Workflow
1. Searches the creator catalogue for something usable for a specific upload
2. Buys instantly at the listed price — no quote, no negotiation
3. Registers their channel so the licence is honoured by the hosting platform's rights systems
4. Publishes
5. If a claim lands anyway, raises "I have a licence — release this" and expects it to work
6. Later cancels the subscription, and expects everything already published to stay licensed

### Anti-Persona Behavior
- **Worst intentional**: buys one licence and reuses the track across several channels, or across client work, beyond the scope purchased; disputes a legitimate third-party claim to force a release they are not entitled to.
- **Worst accidental**: buys under the wrong entity — a personal account when the monetised channel belongs to the business — so the licensed party is not the party using the music; or assumes the licence lapsed with the subscription and re-uploads without checking what `11.06.04` actually preserved.

---

## Boundary Case — recorded, not resolved

A **small production company** that is neither an agency nor a monetised creator sits between the two
profiles: too deadline-and-scope-driven for the creator profile, too small and too un-lawyered for the
professional one. A single broader artifact would have absorbed it; two artifacts do not. Recorded as
the known cost of A2-b. When a spec writer hits this case, pick the profile whose **Unique Constraint**
row matches (negotiates a scope = professional; will not negotiate = creator) and say which was used.

## Consistency Obligation

The two profiles must be kept consistent wherever the buy side is genuinely common — **checkout**,
**verdict rendering** and **the licence instrument** are shared machinery serving both. A change to
one profile's description of those three must be checked against the other.

## What D-71 Does NOT Close

> Written into the decision deliberately (A3-a). D-71 is a **narrow** ratification of the commercial
> licence buyer. It is not the general answer to "does the 4-persona model cover non-musician users?",
> and a downstream reader must not treat it as one. The nine actors below are not buyers, are not
> alike, and several already have contrary domain rulings — a buyer artifact is not their answer.
> Each is owned in another domain's index, so a domain-11 ratification can make them answerable but
> cannot close them.

| Still open | Where it lives | Owner |
|---|---|---|
| Professional dealer / plugin developer (13/14/15) — a **seller**, not a buyer | `personas.md` Q-01 · `vision.md` Q-05 | User |
| **Admin / Moderator** — the sharpest of the nine; blocks the actor's identity, permission model and console endpoints | `personas.md` Q-02 · `24.01.03` Q-01 · `vision.md` Q-00 | User |
| Curator / journalist / radio / DSP gatekeeper | `21.02` Q-01 with `21` D-03 | User |
| Dealer counterparty (trade-in / consignment) | `13.09` D-03 with `13.13` | User |
| Local stagehand / crew hire | domain 18 | User |
| Insurer (off-platform) | domain 18 / 23 | User |
| Accountant | `23.02.03` DT-03 | User |
| Manager (delegated authority, not a buyer) | domain 01 / 23 | User |
| Fee-paying parent | `06` D-07 with `06` Q-01 | User |

**Honest note on scope**: `11` Q-01's own text bundles itself with `personas.md` Q-01 and `11.06`
Q-01 as "all three are one question". D-71 answers two of the three and **explicitly declines** the
dealer half. Rolled up canonically as [`vision.md` Q-09](../../vision.md).

## What D-71 Closes

| Closed | Answer |
|---|---|
| `11` Q-01 | The licence buyer is described in this file as two non-persona counterparty profiles. D-19 stays at four personas. |
| `11.06` Q-01 | The creator buyer gets its own profile; the strained `Fan: Full` mapping is corrected by reference, not by re-mapping the column. |
| `11.01.02` Q-01 | The Role Lens note changes from "this feature's primary user is unspecified" to a reference to the professional buyer profile. |
| `11.02.01` Role Lens block | Buyer-facing rendering references the professional profile; the Fan row references the creator profile. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-50|D-50]]
