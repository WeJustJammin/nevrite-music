# Problem Statement — WeJammin

> Status: `[DEEP]` — thesis confirmed by owner 2026-07-16 during `/ideate-discover`.
> Personas: [personas.md](./personas.md) · Competitive: [competitive-landscape.md](./competitive-landscape.md)

## The Problem

**A music career is assembled from a dozen disconnected tools that share no identity, no
history, and no record of who did what — so the work gets done, but the proof of it evaporates.**

A working musician today runs their career across Reverb (gear), SoundBetter (services),
Bandsintown (gigs), Splice (sounds), DistroKid (release), a WhatsApp thread (the band), and a
spreadsheet (the money). Nothing connects. Each tool knows a sliver; none knows the career.

The consequence is not merely inconvenience. **Because no system is present when the work
happens, the facts of the work are never recorded** — who played on it, who wrote what, who
owns which percentage. Those facts are then reconstructed years later, from memory, usually at
the exact moment they become contested and valuable.

## The Thesis — confirmed by owner (D-18)

> **Provenance is the wedge. Consolidation is the platform.**

| Half | What it does | Why it matters |
|---|---|---|
| **Consolidation** | One platform for gear, gigs, services, projects, venues, releases | The **daily reason to show up**. It is the pain musicians actually feel and can articulate. It wins the user. |
| **Provenance** | Credits, splits, and ownership captured while the work is still fresh and the parties are still in contact | The **reason they cannot leave**. It is the value they cannot take with them and no competitor can retroactively manufacture. It keeps the user. |

**Why the pairing is coherent, not a hedge**: the two halves are causally linked, not merely
bundled. A platform earns the right to capture a split *because it is already where the work
happens*. Nobody opens an app to file a split sheet — but they will confirm one in the app
they are already using to book the session, pay the engineer, and share the stems. Consolidation
is what puts WeJammin **in the workflow**; being in the workflow is what makes provenance
capturable at all.

### Where capture actually happens in v1 (D-70, 2026-07-22)

> Restated so the framing above matches what the product does. Domain 07 D-06: *the platform never
> overclaims what it cannot do — an overclaim discovered later is an unrecoverable trust breach.*

The **root cause** below — absence at the point of truth — is the industry's problem and remains
correctly stated. WeJammin's answer to it is graded, and v1 sits on the first rung:

| Rung | Where the fact is captured | Status |
|---|---|---|
| **1 — first sharing moment** | The review link (`07.05.02`) and the session-close prompt (`07.06.02`, delivered by PWA web push + in-app) | **This is v1.** Days after the take, not years — and while everyone is still reachable and still friendly. |
| **2 — at source, inside the DAW** | The DAW bridge (`07.09`) — watch folder, session parse, in-session prompt | **Not v1, and not authorised.** No non-web client surface exists (constraints.md § Project Surfaces). The **direction**, not the current claim. |

The honest v1 statement is therefore **"capture at the first sharing moment"**. That is still a
structural advantage over reconstruction — the gap it closes is *years*, not *hours* — but it is
not "present at the moment of creation", and nothing v1 ships may say that it is.

Neither half stands alone:
- **Provenance alone** is a slow burn with no daily hook — the Jaxsta / Muso.AI / Sound Credit
  failure mode. Nobody wakes up wanting a credits database.
- **Consolidation alone** is copyable, and means fighting six incumbents simultaneously, each
  better than you at their one thing, with nothing that compounds.

## Why It Matters

- **The reconstruction is the failure.** Splits, credits and ownership are recorded — if at all —
  long after the session, from memory, once money is at stake and relationships have soured.
  This is the single most litigated failure in music.
- **The data is unrepeatable.** A split captured on the day costs one signature. The same split
  reconstructed three years later may cost a lawsuit, and may be unobtainable at any price.
- **Every point solution is structurally blind to it.** None of them are present at the session,
  so none of them can capture the fact at source. They can only ask someone to remember.

## Why Now

`[PARTIAL]` — the strongest candidate signals, to be confirmed with the owner:

| Signal | Why it makes this solvable/valuable now |
|---|---|
| **Remote collaboration is normal** | Post-2020, sessions are routinely distributed. The "room" is already digital — so a platform *can* be present in it. Ten years ago the room was physical and uninstrumentable. |
| **The credits crisis is now an industry priority** | DDEX RIN, Sound Credit, Jaxsta, Muso.AI and the MLC all exist because the metadata gap became unignorable at streaming scale. The problem is acknowledged; nobody has solved capture-at-source. |
| **Streaming economics made splits matter to everyone** | Fractional royalties on millions of streams mean split accuracy now affects working musicians, not just stars. The stakes moved down-market. |
| **Edge compute makes a fat multi-domain platform viable solo** | Cloudflare Workers + Supabase make an ambitious 24-domain platform buildable without a platform team — the constraint that historically forced point solutions. |

> **Open question for the owner (Q-01)**: which of these is the *real* "why now"? Or is the
> trigger something specific to your situation rather than the market's?

## Root Cause

**No system is present at the moment of creation, so the record is always a reconstruction.**

The industry's response has been to build better reconstruction engines — databases that ingest
liner notes, label submissions, and self-asserted claims, then try to reconcile them. Every one
of them inherits the same defect: **they are asking people to remember**, and memory is
contested, lossy, and self-interested.

The root cause is not bad databases. It is **absence at the point of truth**. The fix is to be in
the workflow, close enough to the point of truth that the fact is confirmed rather than
remembered — which is why consolidation is not a separate ambition but the *precondition* for
provenance. See the two-rung table above for how close v1 actually gets (rung 1, the first sharing
moment) and how close the direction goes (rung 2, at source).

## Deep Think Annotations

| # | Hypothesis | Source | Outcome |
|---|-----------|--------|---------|
| DT-01 | The problem is the rights/credits gap (provenance) | Sweep whitespace lens; D-10 | ✅ CONFIRMED — but as the *wedge*, not the whole |
| DT-02 | The problem is tool fragmentation (consolidation) | Sweep competitive lens; owner directives D-05..D-08 | ✅ CONFIRMED — but as the *platform*, not the differentiator |
| DT-03 | These are alternatives requiring a choice | Agent framing when presenting the decision | ❌ REJECTED by owner — they are causally linked: consolidation is the precondition for provenance capture |
| DT-04 | "Cannot live without" comes from accumulated switching cost | Sweep whitespace lens | ⏳ DEFERRED — must confirm lock-in is *earned* (value they'd miss) not *hostile* (data they can't extract). See Q-02 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | [OWNER] Which "Why Now" signal is the real trigger — or is it situational rather than market-driven? | User | `/create-prd` |
| Q-02 | [OWNER] Is the lock-in **earned** or **hostile**? If a user leaves, what do they take? (Data portability is a cross-cut — and a values decision.) | User | `/create-prd` |
| Q-03 | ~~If consolidation is what wins users, which single consolidation surface is the **beachhead**? All 24 domains cannot ship first.~~ **RESOLVED (D-31):** the **session spine** (domains 01, 02, 05, 07, 09-capture; ~45 Musts) is the v1 beachhead — the provenance wedge, shipped first and fast; the 3 marketplaces (13, 14, 15) follow at v1.5. | User | ✅ Resolved — [ideation-index.md](../ideation-index.md) D-31 (amends D-20) |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-70|D-70]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-31|D-31]]
- [[decisions.md#d-20|D-20]]
