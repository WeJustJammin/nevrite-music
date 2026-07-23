# User Personas — WeJammin

> Status: `[DEEP]` — 4 primary personas confirmed by owner 2026-07-16 (D-19).
> Consumed by: every domain index Role Matrix (24), every feature file Role Lens.
> Short names for Role Matrix columns: **Musician** · **Producer** · **Operator** · **Fan**

> ### 👉 Companion file: [counterparties.md](./counterparties.md)
>
> **Some real users of WeJammin are deliberately not personas.** The commercial licence buyer — the
> music supervisor / brand / agency, and the monetised creator — is described in
> [counterparties.md](./counterparties.md) as two **counterparty profiles**, authored 2026-07-22 by
> owner decision **D-71**.
>
> Those profiles use the same six fields as the personas below, plus Workflow and Anti-Persona
> Behavior — but they are **not personas**: D-19 stays at **four**, and they add **no Role Matrix
> column** anywhere. A reader who consults only this file will miss them, which is why this pointer
> exists. D-71 is narrow: it closes the licence buyer only. Every other non-persona actor —
> dealer, Admin/Moderator, curator, stagehand, insurer, accountant, manager, fee-paying parent —
> remains open; see Q-01, Q-02 and Q-05 below and the non-closure table in `counterparties.md`.
>
> **Identifier note — D-71 = domain-11 D-10.** The same ratification is registered in two registers:
> globally as **D-71** here and in [`ideation-index.md`](../ideation-index.md), and locally as
> **D-10** in [`11-music-licensing/music-licensing-index.md`](../11-music-licensing/music-licensing-index.md).
> One decision, two identifiers — a reader arriving by either should land on the other. Domain-11's
> local D-10 is **not** the global D-10 in `ideation-index.md` (rights-stack priority), which is
> unrelated.

## The Structural Fact

Music's defining identity characteristic is the **multi-hyphenate**: one human simultaneously
holds several professional roles — a drummer who also mixes, sits in three bands, engineers at a
studio, and sells a cymbal on the marketplace. **A persona model of "user has a role" is wrong
for this product.** These four personas are lenses on behaviour, not account types; one human
routinely occupies three of them in one day.

Second structural fact: **bands, labels, studios, venues and agencies are first-class entities**
that book, sign, own and get paid independently of their members. A persona is not always a
person. The Band is modelled as an **entity** (domain 01), experienced *through* the Musician
and Producer personas — it is not a fifth persona.

---

## Persona: Musician (multi-hyphenate working musician)

> The structural centre. Feels fragmentation worst because they personally use all six tools.

| Field | Detail |
|-------|--------|
| **Name + Role** | Working musician holding 3+ simultaneous roles — e.g. session drummer, occasional mixer, member of two bands, part-time gear flipper. Not a star; makes a living from a portfolio of small income streams. |
| **Primary Pain Point** | Their career exists in fragments across six platforms that share no identity — so nothing accumulates, and every new client requires re-proving who they are and what they've played on. |
| **Current Workaround** | Reverb + SoundBetter + Bandsintown + Splice + DistroKid + a WhatsApp thread + a spreadsheet. A Linktree and a manually-maintained "credits" list in a Notes app or a PDF one-sheet. |
| **Success Criteria** | One identity that carries verified proof of work across every context; income visible in one place; no re-proving themselves to each new client. Measurable: time-to-book a session drops; credits are cited rather than claimed. |
| **Switching Trigger** | Losing money or a gig to a fact they couldn't prove — an unpaid session, a credit that went to someone else, a split they agreed verbally and can't evidence. Or: a trusted collaborator invites them into a project already on WeJammin. |
| **Unique Constraint** | Their roles are simultaneous, not sequential. Any UX forcing "are you an artist OR a producer OR a seller?" fails them immediately. They also cannot afford per-tool subscriptions across six products. |

### Workflow
1. Gets invited to (or finds) work — session, gig, or service request
2. Negotiates terms, does the work, delivers
3. **The moment that matters**: credit + split captured while everyone is present and friendly
4. Gets paid; the fact of the work accretes to their identity
5. That accumulated proof is what wins the next job

### Anti-Persona Behavior
- **Worst intentional**: inflates credits to claim work they didn't do; games the verified-credit graph to manufacture reputation; uses the platform to find collaborators then takes the deal off-platform to dodge fees.
- **Worst accidental**: signs a split sheet they don't understand and discovers years later they gave away their publishing; uploads a stem containing an uncleared sample and exposes every collaborator downstream.

---

## Persona: Producer (producer / engineer — the session owner)

> **The capture point.** Without this persona the provenance wedge has no mechanism — they are
> the one who is in the room when the facts become true.

| Field | Detail |
|-------|--------|
| **Name + Role** | Producer, mixing engineer, or tracking engineer who runs sessions. Owns the room (physical or remote), coordinates contributors, delivers the finished work. Often the de-facto project manager. |
| **Primary Pain Point** | They are the person who *knows* who played what — and they have no tool that records it at the moment it's true. They reconstruct credits from memory months later, chasing people who have moved on, for a project they've mentally closed. |
| **Current Workaround** | DAW session notes, a WhatsApp group, a Dropbox folder named `FINAL_v3_ACTUAL`. Split sheets as unsigned PDFs, or a verbal "we'll sort it out later" that never gets sorted. |
| **Success Criteria** | Credits and splits captured as a byproduct of running the session — zero extra admin. Everyone confirms on the day. Measurable: split agreed before the session file closes, not after money appears. |
| **Switching Trigger** | Getting dragged into a dispute over a split they facilitated but can't evidence. Or a client demanding delivery in a form they can't produce (proper metadata, signed splits, clearances). |
| **Unique Constraint** | Their work happens inside a DAW, not a browser. Any capture flow requiring them to leave the session and go fill in a web form will not be used. Also: they are a **trust broker** — their attestation is worth more than a self-claim, which is precisely what makes counter-attestation valuable. |

### Workflow
1. Sets up a project; invites contributors
2. Runs sessions — tracking, comping, revisions
3. **The moment that matters**: prompts/confirms who did what and what the split is, while everyone is present
4. Delivers with metadata intact; the record is complete on day one, not reconstructed on day 900

### Anti-Persona Behavior
- **Worst intentional**: assigns themselves a larger split than agreed and pushes it through while contributors aren't paying attention; withholds stems as leverage in a payment dispute.
- **Worst accidental**: closes a project without capturing splits ("we'll do it later") — the exact failure the platform exists to prevent, committed by the persona best placed to prevent it. **The design must make the lazy path the correct path.**

---

## Persona: Operator (venue / studio / rehearsal space operator)

> The supply side. Without this persona domains 16, 17 and 19 have no Role Matrix.

| Field | Detail |
|-------|--------|
| **Name + Role** | Owns or books a venue, recording studio, or rehearsal space. Sells time and space rather than creative output. Often runs the business on the side of engineering or performing themselves. |
| **Primary Pain Point** | Their calendar is the business, and it lives in three incompatible places — email enquiries, a paper diary or Google Calendar, and a phone. Double-bookings and no-shows cost real money; advancing a show means chasing riders and tech specs by email. |
| **Current Workaround** | Email + Google Calendar + a spreadsheet + phone calls. Maybe Studiotime or Prism.fm for one slice. Deposits chased manually; settlement done with a calculator after the show. |
| **Success Criteria** | Bookings, deposits, riders and settlement in one flow. Nobody arrives expecting a backline that doesn't exist. Measurable: fewer no-shows; advancing takes minutes; settlement is arithmetic the system already did. |
| **Switching Trigger** | A costly double-booking or a show that failed on a preventable technical mismatch (band needed something the room never had). Or: enough musicians are already on WeJammin that being absent costs them bookings. |
| **Unique Constraint** | **Their inventory is time and space, not goods or labour** — it is perishable (an unsold Tuesday is gone forever) and physically constrained (capacity, load-in, curfew, gear). They are also frequently *both* buyer and seller, and much of their work is on a phone at a loading dock, not at a desk. |

### Workflow
1. Lists the space with real specs (capacity, gear, stage plot, access, constraints)
2. Receives enquiries → holds → confirms → takes deposit
3. Advances the show/session — riders, tech specs, schedule, crew
4. Runs it; settles afterward
5. Reputation accrues from shows that went smoothly

### Anti-Persona Behavior
- **Worst intentional**: misrepresents the room's specs or capacity to win bookings; keeps deposits on cancellations outside the stated policy.
- **Worst accidental**: forgets to release a hold, blocking a slot they'd happily have sold; publishes a stale gear list, so a band arrives to a room that can't run their show.

---

## Persona: Fan

> First-class **user**, not a CRM record (D-11). Secondary in priority, primary in volume —
> fans outnumber professionals by orders of magnitude, which is a load and moderation fact
> before it is a product one.

| Field | Detail |
|-------|--------|
| **Name + Role** | Follows artists, discovers and attends shows, buys music and merch directly. Not a music professional; may be a hobbyist musician too (the boundary is porous). |
| **Primary Pain Point** | Finds out an artist they love played their city — after the show. Discovery is algorithmic and passive; there's no reliable line from "I care about this artist" to "I knew they were playing." |
| **Current Workaround** | Bandsintown/Songkick alerts, Instagram stories, a friend mentioning it, Spotify's concert tab. Merch from whichever link is in bio. |
| **Success Criteria** | Never misses a show by an artist they follow. Money reaches the artist rather than a reseller. Measurable: alert → attendance conversion. |
| **Switching Trigger** | Missing a show they'd have gone to. Or an artist they follow directing them here for tickets/merch. |
| **Unique Constraint** | **The only persona with no professional stake** — they will not tolerate professional-tool complexity, will not read a rider, and will never file a split sheet. Their surface must be a different product wearing the same brand. They are also the population that brings statutory duties that scale with reach (age assurance, DSA thresholds) and a moderation profile professionals don't have. |

### Workflow
1. Follows an artist (or imports who they already listen to)
2. Gets told when that artist does something they can act on — a show near them, a release, merch
3. Acts: buys a ticket, buys merch, attends
4. Attendance/purchase history deepens what the platform can tell them next

### Anti-Persona Behavior
- **Worst intentional**: bulk-buys tickets to scalp; harasses artists through open contact surfaces; abuses refunds.
- **Worst accidental**: buys a ticket for the wrong city/date; is a minor and hits an age-gated purchase or an adult venue.

---

## Coverage Check — do 4 personas cover 24 domains?

| Domains | Primary persona | Covered? |
|---|---|---|
| 01 Identity · 02 Credits · 03 Community · 04 Opportunities | Musician | ✅ |
| 05 Services · 07 Projects · 08 Jamming | Musician + Producer | ✅ |
| 06 Education | Musician (both sides — teacher and student are both Musicians) | ✅ |
| 09 Rights · 10 Royalties · 12 Release | Musician + Producer | ✅ |
| 11 Licensing | Musician + Producer on the **sell** side. The **buy** side is served by two non-persona counterparty profiles ([counterparties.md](./counterparties.md), D-71) — no Role Matrix column added. | ✅ (sell) · ✅ by reference (buy) |
| 13 Gear · 14 Digital Goods · 15 Gear Registry | Musician (as buyer **and** seller) | ⚠️ see Q-01 |
| 16 Venues/Studios · 17 Live Booking · 18 Show Production · 19 Ticketing | Operator (+ Musician as counterparty) | ✅ |
| 20 Fanbase · 21 Promotion | Fan + Musician | ✅ |
| 22 Analytics · 23 Career/Finance | Musician | ✅ |
| 24 Trust & Safety | All four + Admin | ⚠️ see Q-02 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Domains 13/14/15 are served by "Musician acting as seller". Is a **professional dealer/plugin-developer** a distinct persona, or a Musician in a selling context? The owner chose 4 over 5 — revisit if the Gear/Digital Role Matrices come out thin during drilling. **Explicitly NOT closed by D-71**: a dealer is a *seller*; the counterparty profiles describe *buyers*. Deferral target re-pointed from the completed `/ideate-validate` to `/create-prd`; canonical entry `vision.md` Q-05. | User | `/create-prd` |
| Q-02 | **Admin/Moderator** is not a persona but domain 24 needs one, and every domain has an admin layer per `vertical-slices.md`. Is Admin a persona, or an internal operator role outside the persona set? **Explicitly NOT closed by D-71**, and now the nearest-neighbour question to it — `24.01.03` Q-01 records that the actor's identity, permission model and console endpoints cannot be specified until this resolves. Canonical entry `vision.md` Q-00. | User | `/create-prd` |
| Q-03 | Teacher and Student are both "Musician" — does domain 06 need them split, or does the Role Lens handle it contextually? | Agent | drilling, domain 06 |
| Q-04 | How is the multi-hyphenate modelled — one account with many roles, or many contexts under one identity? Personas assume the former. | Agent | `/create-prd-architecture` |
| Q-05 | **Which remaining non-persona actors get a counterparty profile, a persona, or neither?** D-71 authored profiles for the commercial licence buyer only and listed nine actors it explicitly does not close (dealer, Admin/Moderator, curator/journalist/radio/DSP gatekeeper, dealer counterparty, stagehand, insurer, accountant, manager, fee-paying parent). Each is owned in another domain index. Canonical entry `vision.md` Q-09. | User | `/create-prd` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-11|D-11]]
