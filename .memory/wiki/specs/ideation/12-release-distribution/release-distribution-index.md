# Release & Distribution — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `core` _(raised to core by D-10 — rights stack is the thesis)_

## Overview

Getting finished music onto stores and streaming services — release building, DDEX delivery, per-store status, scheduling and pre-save, takedowns, and Content ID registration.

**Why this is a top-level domain**: A distinct domain with its own persona (label ops, distributor), its own machinery (DDEX ERN, per-partner conformance, asynchronous partial delivery) and its own destination (the release dashboard). DistroKid, TuneCore, CD Baby and Vydia occupy it entirely. Strategically it is the enforcement point that makes the whole rights thesis work: distribution is when the artist actually wants something, which is the only moment they will fix their metadata — refuse to deliver a release whose splits do not balance and the split sheet gets signed. That single mechanic is why this is not merely 'an integration'. Delivery is asynchronous, partial and fails silently (live on Spotify, rejected by Apple, pending on Beatport), so per-store status must be a first-class tracked object rather than one 'released' flag.

**Interacting capabilities** (what justifies domain status):

- release builder & metadata validation
- DDEX messaging & per-partner delivery
- per-store, per-territory status tracking
- scheduling, pre-save & editorial windows
- takedowns & redelivery
- Content ID / fingerprint registration

## Children

> Classified through the Node Classification Gate during `/ideate-discover` Step 3, where every
> child was seeded `[SURFACE]`. The Status column below carries each child's **current** depth after
> MoSCoW allocated it in Step 5, and it mirrors the status in that child's own header — the child
> file is the owning statement, this column is the restatement.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 12.01 | Release Builder & Delivery Readiness | sub-domain | [12.01-release-builder/](./12.01-release-builder/12.01-release-builder-index.md) | `[BREADTH]` | 65 hypotheses (5 features) |
| 12.02 | DDEX Delivery Messaging | sub-domain | [12.02-ddex-delivery-messaging/](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | `[BREADTH]` | 44 hypotheses (4 features) |
| 12.03 | DSP Store & Territory Management | sub-domain | [12.03-dsp-store-territory-management/](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | `[BREADTH]` | 39 hypotheses (4 features) |
| 12.04 | Release Scheduling & Windows | sub-domain | [12.04-release-scheduling-windows/](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | `[BREADTH]` | 26 hypotheses (4 features) |
| 12.05 | Catalog Lifecycle After Release | sub-domain | [12.05-catalog-lifecycle-after-release/](./12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md) | `[BREADTH]` | 10 hypotheses (3 features) |
| 12.06 | Content ID & UGC Claiming | sub-domain | [12.06-content-id-ugc-claiming/](./12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md) | `[SURFACE]` | 9 hypotheses (3 features) |
| 12.07 | Identifier Assignment at Delivery | feature | [12.07-identifier-assignment-at-delivery.md](./12.07-identifier-assignment-at-delivery.md) | `[DEEP]` | 13 hypotheses |
| 12.08 | Catalog Migration & Exit | feature | [12.08-catalog-migration-exit.md](./12.08-catalog-migration-exit.md) | `[PARTIAL]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

**Totals**: 6 sub-domains · 25 leaf features (23 in sub-domains + 2 at domain level) · 209 Deep Think hypotheses logged.

### Classification Notes — how the 8 sweep candidates became these 8 children

| Sweep candidate | Outcome |
|---|---|
| 01 Release Builder & Metadata Validation Gate | → **12.01** sub-domain (5 features). The readiness gate split from metadata validation — see D-04 |
| 02 DDEX Messaging (ERN/DSR/RIN/MWL/MEAD) | → **12.02** sub-domain, **narrowed**. DSR → 10, RIN → 02, MWL → 09/11; shared rails → cross-cut. See D-02 |
| 03 DSP Store Management & Per-Store Delivery Status | → **12.03** sub-domain (4 features), **expanded** with territory scoping and artist-profile linking |
| 04 Release Scheduling, Pre-Save & Editorial Pitch Windows | → **12.04** sub-domain (4 features) |
| 05 Takedowns & Redelivery | → **12.05** sub-domain, **renamed** and split — involuntary takedown extracted. See D-05 |
| 06 Content ID, Fingerprinting & UGC Claiming | → **12.06** sub-domain (3 features) |
| 07 Identifier Assignment at Delivery | → **12.07** feature, **narrowed**. The identifier *registry* is a cross-cut; the *assignment moment* stays here |
| 08 Release Rollout Deadlines (feeds Promotion) | → **merged** into 12.04 as feature 12.04.04. See D-03 |

**Deep Think additions** (nodes created that no candidate contained):

| Node | Why it had to exist |
|---|---|
| 12.03.04 Artist Profile Linking & Disambiguation | The wrong-artist-page failure is the most common real distribution disaster. The candidate list enumerated the *distributor's machinery*, not the *artist's failures* — a domain built from it alone would deliver flawlessly to the wrong person and report success |
| 12.05.03 Involuntary Takedown & Delivery Suspension | The candidate list had no node for a takedown the artist did not ask for — the case with actual legal weight, and the one where the artist has no permissions |
| 12.08 Catalog Migration & Exit | problem-statement.md Q-02 asks whether the lock-in is earned or hostile. No node anywhere answered it. **A sweep enumerating what distributors do will never surface the exit, because no distributor wants it to exist** |
| Territory & exclusivity scoping (in 12.03.01) | Nothing in the candidate list stopped a release being delivered into a territory covered by someone else's exclusive — a breach, not a bug |
| 12.01.05 Label Copy & Distributor of Record | The (P) line is an ownership assertion, and WeJammin uniquely holds the record that confirms or refutes it (D-10) |

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 12.01 Release Builder & Delivery Readiness | ✅ Full | ✅ Full | ❌ None | ❌ None |
| 12.02 DDEX Delivery Messaging | ⚙️ Config | ⚙️ Config | ❌ None | ❌ None |
| 12.03 DSP Store & Territory Management | ✅ Full | ⚙️ Config | ❌ None | ❌ None |
| 12.04 Release Scheduling & Windows | ✅ Full | ⚙️ Config | 👁️ Read-only | ✅ Full |
| 12.05 Catalog Lifecycle After Release | ✅ Full | ⚙️ Config | ❌ None | ❌ None |
| 12.06 Content ID & UGC Claiming | ✅ Full | ⚙️ Config | ❌ None | ❌ None |
| 12.07 Identifier Assignment at Delivery | ✅ Full | 👁️ Read-only | ❌ None | ❌ None |
| 12.08 Catalog Migration & Exit | ✅ Full | 👁️ Read-only | ❌ None | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> Personas are defined in [meta/personas.md](../meta/personas.md) — referenced only, never redefined here.
> Per-feature detail lives in each feature file's Role Lens; the rows above are the **maximum** access
> any child in that node grants.

### Reading the matrix — the shape of this domain

- **These rows are maximums, and a maximum is often one child wide.** The 12.02 row reads `Config`
  for both Musician and Producer solely because of 12.02.04 (MEAD enrichment, where the artist and
  the producer genuinely hold the authoritative descriptors); the sub-domain's other three children
  are read-only or `None` and 12.02.02 has no persona surface at all. Read a row as "the ceiling
  somewhere inside this node", never as "what this node feels like". The per-child matrices are the
  owning statements; this table only takes their max.
- **Musician is the protagonist**, except in 12.02 (where their only write is a MEAD descriptor —
  they never touch the message) and 12.05.03 (read-only — the only place in the domain where they
  cannot act on their own release, which is what "involuntary" means).
- **Producer is high-power, low-authority throughout.** Their *facts* are load-bearing and their
  permissions are scoped to exactly the facts that are theirs alone: `Config` in five of the six
  sub-domains, narrowed each time to one thing — the asset-caused rejection they and nobody else can
  fix (12.03.03), the corrected master (12.05.02), the knowledge that settles an ownership conflict
  (12.06.03), the session descriptors the artist does not remember (12.02.04). They reach `Full` in
  exactly two children, and both are the same case: the readiness gate whose blocking facts only
  they can supply (12.01.03) and asset conformance, where the fix is a re-render in their DAW
  (12.01.04). Per personas.md they are the trust broker — the domain depends on them everywhere and
  grants them authority over their own contribution and nothing else.
- **Operator is `None` almost everywhere, and that is correct, not a gap.** An Operator has no
  stake in a release object. The single exception is a read-only lens on the rollout plan (12.04.04)
  where it contains a booking they are already party to via 16/17 — Medium confidence, gated by
  12.04 Q-03.
- **Fan is `None` except 12.04.03 (pre-save), where they are `Full`.** That one feature is the
  entire Fan experience of domain 12 and the seam where a professional tool becomes fan-facing.
  Per personas.md the Fan surface must be "a different product wearing the same brand" — if any
  builder vocabulary leaks into the pre-save page, the feature is broken.
- **`[PENDING]` — the platform admin lens.** 12.02.02 (profile authoring), 12.03.03 (rule review)
  and 12.05.03 (suspension) all have substantial internal surfaces whose actor is a platform admin
  — which ideation-index.md Q-02 flags as not yet a persona. `None` in those rows means "no
  *persona* UI", not "no UI".

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | A distinct domain with its own persona (label ops, distributor), its own machinery (DDEX ERN, per-partner conformance, asynchronous partial delivery) and its own destination (the r... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **DDEX narrowed to outbound release messaging.** DSR → 10 (Royalties), RIN → 02 (Credits), MWL → 09/11; the shared rails become a cross-cut | The sweep candidate bundled five DDEX standards owned by four different domains. Keeping them together would make Release the de-facto owner of royalty reporting and credit exchange, contradicting the ratified domain map | Agent, Deep Think, `/ideate-discover` Step 3 |
| D-03 | **Merged candidates 04 and 08.** "Release Rollout Deadlines" is a feature inside 12.04, not a peer | Rollout deadlines are *derived* from the release date and the pitch window. Splitting them puts the computation and its inputs in different nodes and gives the platform two disagreeing calendars | Agent, Deep Think, `/ideate-discover` Step 3 |
| D-04 | **The Delivery Readiness Gate is a distinct feature** (12.01.03), separate from metadata validation (12.01.02) | Validation asks "will the store accept this?" — fixable by the author alone in seconds. The gate asks "is this true?" — needs another human, over days. Presenting them as one list teaches the artist that provenance failures are clerical, which is the belief the product exists to break | Agent, Deep Think |
| D-05 | **Involuntary takedown split** from voluntary takedown (12.05.03 vs 12.05.01) | Different initiator, different permissions (the artist has none), legal weight, and it gates the other two. Merging them yields a lift button on a legally-compelled removal | Agent, Deep Think, `/ideate-discover` Step 3 |
| D-06 | **Two cross-cuts routed out of the domain**: DDEX Message Rails & Partner Conformance; Music Identifier Registry | Both are mechanisms serving 4–6 domains rather than things in this one. See [release-distribution-cx.md](./release-distribution-cx.md) | Agent, Node Classification Gate |
| D-07 | **Delivery queue/retry/backoff/credentials routed to `/create-prd`** as not-product | The state vocabulary the artist sees is product; the async job machinery behind it is architecture. See 12.02.03's Not-Product Note | Agent, Node Classification Gate |

## Recurring Patterns Found During Classification

> Three rules surfaced independently in multiple features. Recorded here because they are domain
> policy, not per-feature preferences, and downstream spec writers should apply them uniformly.

| Pattern | Where it surfaced | Statement |
|---|---|---|
| **Show the price at the decision** | 12.04.01 D-01 (date cost), 12.05.02 D-01 (update cost), 12.03.01 D-03 (dropping a store), 12.06.01 DT-03 (what registration does) | Wherever the platform knows a cost the artist cannot see, surface it at the moment of choice — never after |
| **Never claim more than you know** | 12.02.03 D-02 (`Accepted` ≠ `Live`), 12.03.02 D-04 (`Unknown`), 12.04.02 DT-03 (pitch has no reply), 12.02.03 D-01 (`Overdue`) | Where the platform does not control the outcome, honesty about the unknown beats a comforting status. A product whose thesis is that its record is true cannot over-claim on its most-viewed screens |
| **Different consequences need different affordances** | 12.01 CX-02 (validation vs gate), 12.04.04 DT-02 (hard vs soft deadlines), 12.05 CX-03 (edit vs takedown) | This domain repeatedly presents things with radically different consequences through identical affordances. Each time, the fix is to separate them visually before separating them technically |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — see Children table and Classification Notes | Agent | ✅ `/ideate-discover` Step 3 |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — two routed out (D-06) | Agent | ✅ `/ideate-discover` Step 3 |
| Q-03 | **Direct DSP delivery or via an aggregator?** (12.02 Q-01.) The largest scoping question in the domain. Direct means owning ~150 partner relationships, certifications and fifteen years of accumulated rejection knowledge we do not have (12.02.02 DT-02). Via-aggregator collapses 12.02 to one integration. D-10 is about *rights*, not *transport* — it does not settle this. | User | `/create-prd` |
| Q-04 | `[OWNER]` **Hard gate or soft gate?** (12.01.03 Q-01, and CX-06.) The domain's defining tension and a direct line to D-18 and problem-statement.md Q-02. Recommend investigating **freeze the money, not the record** (12.01.03 Q-02) — holding a payout is more defensible and more effective than holding an announced release hostage over a contributor's silence. **Still open** — MoSCoW and `/ideate-validate` both ran without taking it. 12.01.03 Q-01 (already re-pointed at `/create-prd`) records that its child rows sit behind this one, and 12.01.03 D-13 narrows the scope: under either answer the *record* says the identical thing, so this decides exactly one bit — whether the delivery button is reachable. 12.01.03 D-09 places Family C (third-party rights) permanently out of its reach, and DT-05's `Exhausted` state is required either way, so nothing downstream is blocked except whether an override affordance exists at all. | User | `/create-prd` (with 12.01.03 Q-01 / Q-04 and 12.01.01 Q-01) |
| Q-05 | `[OWNER]` **Do WeJammin-prefix ISRCs leave with a departing artist?** (12.08 Q-01, CX-10.) The most direct possible answer to "is the lock-in earned or hostile?". Recommend yes — it forfeits the retention mechanism every competitor relies on, which is the price of D-18 being true rather than marketed. **Still open** — `/ideate-validate` ran without taking it, as did 12.08 Q-01 at the same expired target. CX-10 records a concurring recommendation from both features, never a ratification, and 12.08 DT-02 ends "Owner's call". Scoped to **ISRC only**: 12.07 Q-03 splits the UPC half out, because a GS1 company prefix is an annual licence naming us as brand owner rather than a permanent registrant allocation. | User | `/create-prd` (with 12.08 Q-01; UPC half is 12.07 Q-03) |
| Q-06 | `[OWNER]` **Does WeJammin claim against its own fans?** (12.06 Q-02.) A fan's video using an artist's track is claimable revenue and a claim against a first-class user (D-11). No competitor faces this because none has both sides. A genuinely novel values question. **Still open** — `/ideate-validate` ran without taking it, as did 12.06 Q-02 at the same expired target, which states plainly that it "is a genuinely novel values question the owner must answer". Downstream of 12.06 Q-01 (is Content ID in scope for v1 at all), so take that first. | User | `/create-prd` (with 12.06 Q-01 / Q-02) |
| Q-07 | `[OWNER]` **Physical formats** — vinyl, cassette, CD. Pressing, catalog numbers, retail barcodes, distribution to record stores. Genuinely part of "release" for independent artists and a completely different machine from DDEX. No directive points either way. **Still open** — `/ideate-validate` ran without taking it. 12.01.01 Q-03 is already re-pointed at `/create-prd` and explicitly waits on this row ("strictly downstream of the physical-format scope call; do not answer it separately"), noting that vinyl side-breaks are a *physical* sequencing constraint the digital model has no field for — so this is a shape change, not an additive flag. 12.07 Q-06 (music video) is the same class of v1 scope call and travels with it. | User | `/create-prd` (with 12.01.01 Q-03 and 12.07 Q-06) |
| Q-08 | How does **export work for multi-party provenance**? (12.08 Q-02.) A split sheet is not one user's data; GDPR erasure by one party damages three people's record. No precedent — no competitor holds facts worth this problem. | User | `/create-prd-security` |
| Q-09 | `[OWNER]` Should **witnessed** and **imported** records carry a visible confidence tier across the product? (12.06.03 Q-03, 12.01.01 Q-02.) Honest, protects the record's value, and tells users their imported catalog is second-class — which is true and unwelcome. **Still open** — `/ideate-validate` ran without taking it, and this row is the *escalation target* rather than a duplicate: 12.01.01 Q-02 is resolved ("The origin fact is recorded always; the path is equal in capability; the **visibility** of a witnessed-vs-imported tier product-wide is escalated to domain Q-09"), so the origin fact is settled and only its product-wide visibility is not. 12.01.03 DT-16 and 12.08 D-02 both argue for it locally ("imported catalog being visibly second-class is true, unwelcome, and the entire point") but neither can make the product-wide call. It is a positioning decision with a commercial cost, not a UI detail — so it precedes `/write-fe-spec` rather than belonging to it. | User | `/create-prd` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-11|D-11]]
