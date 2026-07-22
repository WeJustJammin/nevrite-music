# Release & Distribution — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Release & Distribution](./release-distribution-index.md)
> **Status**: [DEEP] — 8 children; intra-domain cross-cuts synthesised from Step 6 depth evidence.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | The builder is the sole source of message content; the generator authors nothing and defaults nothing | Musician, Producer | High | 12.02.01 D-01 — generation is a pure projection; a defaulted field is a fabricated fact |
| CX-02 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | **The partner-knowledge store**: validation rule packs (12.01.02) and partner profiles (12.02.02) are two projections of one fact and pin together at hand-off to one store version | Musician | High | 12.02.02 DT-01; 12.01.02 D-07 — separation guarantees drift, and drift tells the artist two contradictory things |
| CX-03 | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | Message state is NOT store state: per-partner acks are the status board's only input, and per-partner independence is what makes the board meaningful | Musician, Producer | High | 12.02.01 notification (message≠store), 12.02.03 D-02, 12.03.02 D-02 — never claim more than the ack supports |
| CX-04 | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | **The learning loop** (bidirectional): every rejection becomes a validation rule or profile correction; artist overrides emit the outcome evidence that promotes or decays those rules | Musician, Producer | High | 12.03.03 DT-01; 12.01.02 D-06 — the domain's only compounding asset and the answer to its cold-start gap |
| CX-05 | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | [12.04 Scheduling & Windows](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | `Accepted` is the precondition that opens both the editorial pitch and the pre-save link — the release-week tools switch on together | Musician, Fan | High | 12.04 CX-03 — one trigger, two audiences |
| CX-06 | [12.04 Scheduling & Windows](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | The collision: an announced release date meeting a readiness gate a contributor has not cleared. A dispatch-time re-check turns "gate WAS green" into "gate IS green"; `Held at dispatch` is a state scheduling must render | Musician, Producer | High | 12.04.01 Q-01; 12.01.03 DT-09 — the gate question arriving with a deadline attached |
| CX-07 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.07 Identifier Assignment](./12.07-identifier-assignment-at-delivery.md) | Identifiers are required message fields; label copy determines which prefix pool a release draws from | Musician, Producer | High | 12.07 behaviour; 12.01 CX-04 |
| CX-08 | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | [12.05 Catalog Lifecycle](./12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md) | Takedown and update messages come from the one ERN generator; an update is a whole-truth reassertion, not a delta, so the retained-message diff baseline keeps unrelated edits from riding along | Musician, Producer | High | 12.02.01 DT-07/D-07 — shared mechanism, distinct human consequences |
| CX-09 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.06 Content ID](./12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md) | The readiness gate's conditions apply to fingerprint registration and apply **harder** — no override — and matching must fire at asset availability, not at delivery | Musician, Producer | High | 12.06.01 DT-01; 12.01.04 (first custody of audio) — a wrong delivery embarrasses; a wrong registration accuses strangers |
| CX-10 | [12.07 Identifier Assignment](./12.07-identifier-assignment-at-delivery.md) | [12.08 Catalog Migration & Exit](./12.08-catalog-migration-exit.md) | Prefix provenance decides what leaves with a departing artist — the crux of the earned-vs-hostile question | Musician, Producer | High | 12.07 DT-02; 12.08 DT-02 |
| CX-11 | [12.05 Catalog Lifecycle](./12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md) | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | Post-delivery, changing where a release is sold is a takedown, not a picker edit. Same gesture, opposite meanings across the delivery boundary | Musician | High | 12.03 CX-03 / R-04 — the pre/post-delivery asymmetry |
| CX-12 | [12.08 Catalog Migration & Exit](./12.08-catalog-migration-exit.md) | [12.06 Content ID](./12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md) | Imported catalog carries no attestations, so the evidence advantage in conflicts does not apply to it | Musician | High | 12.06.03 DT-02 — the boundary of the thesis |
| CX-13 | [12.04 Scheduling & Windows](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | Lead times and expected-response windows are per-partner profile data; a release date is a date PLUS per-partner timezone/chart-week semantics, computed from the same store the messages are | Musician | High | 12.04.01 DT-02; 12.02.01 DT-13; 12.02.03 D-01 |
| CX-14 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.05 Catalog Lifecycle](./12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md) | **The builder writes future obligations into the lifecycle**: a term-limited licensed inclusion schedules a takedown dated at licence expiry (recorded at add-time); a replaced master post-release is not a metadata update but a takedown + new ISRC | Musician, Producer | High | 12.01.01 D-12/DT-12 (scheduled takedown); 12.01.04 DT-09 (master replacement forfeits stream count) |
| CX-15 | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | The Deal & Parties fact classes: the ERN message is where the rights record leaves the building and becomes actionable by a third party, and where the wrong-artist-page disaster is committed (a party reference, not a string) | Musician, Producer | High | 12.02.01 DT-04 (Deals), 12.02.01→12.03.04 (Parties) — a guessed party delivers flawlessly to the wrong person |
| CX-16 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | **Silent normalisation**: DSPs do not only reject metadata, they silently rewrite accepted metadata — the board reports `Delivered` while the store displays something the artist never wrote. A read-back is the only detector, and the divergence is a learning signal as valuable as a rejection | Musician | Medium | 12.01.02 DT-10 / Q-03; 12.02.02 PC-13 read-back flag — a partner with no read-back can only be inferred, never checked |
| CX-17 | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | Store-set scoping: the selected store set is the domain over which every validation finding is scoped — deselecting a store withdraws its findings; certifying a new store can add blocking findings to work the artist never touched | Musician | Medium | 12.01.02 → 12.03.01 D-03 — findings are not release-global, they are store-scoped |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** Use `{filename}#CX-NN` when citing an entry from another file.

---

## Cross-Cut Details

### CX-01 / CX-02: The Builder Is The Message, And The Partner-Knowledge Store (12.01 ↔ 12.02)

**Relationship**: Two intertwined facts. First (CX-01): ERN generation is a **pure projection** of the builder's state — it authors nothing and defaults nothing, because a defaulted field is a fabricated fact and the domain's thesis is that its record is true (D-10/D-18). Second (CX-02), the structural conclusion of the domain: validation rule packs (12.01.02, "Apple won't take this title") and partner profiles (12.02.02, "Apple wants ERN 4.3 with these extensions") are **two projections of one fact — what this partner accepts.** New in Step 6 depth: they must **pin together at hand-off to one store version** (12.01.02 D-07 / 12.02.02 D-01), which dissolves the pinning asymmetry the breadth pass left open.

**Role scoping**:
- **Musician**: the only persona who experiences drift, and they experience it as the product lying — validation says ready, the generator emits a message the store rejects.
- **Producer**: sees it only through asset-spec divergence.
- **Operator / Fan**: not affected.
- **Platform admin** (`[PENDING]` — not a persona, ideation-index.md Q-02): the actual owner of the store; message inspection, replay against a candidate profile and the conformance test harness are internal surfaces.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The partner-knowledge store is the shared entity; **neither sub-domain owns it** — it is read by both (12.01.02 validation, 12.02.02 generation) and written by a third (12.03.03's learning loop). It belongs to the proposed **DDEX Message Rails & Partner Conformance** cross-cut. Merge strategy: a single write path through human-reviewed triage; the two read projections pin to the *same* version at a delivery's hand-off so validation and generation cannot disagree about one release.
2. **Trigger chain + failure/rollback + sync/async**: Builder edit → validation self-checks release metadata → gate → generation self-checks only its own output (12.02.01 D-08 — never re-validates the release, or a second rule source drifts from the first). Async across the store-update path; synchronous within one delivery's pin. Failure mode: a store update landing between two projections re-reading is exactly the drift; the pin is the rollback guard.
3. **Permission intersection**: None at persona level — entirely admin.
4. **Notification fan-out**: A store update can invalidate a gate-green release awaiting delivery; affected artists must be told **before** their delivery date, not at it (Notifications & Alerts cross-cut).
5. **State-transition race**: Certain. Rule packs are versioned data landing continuously (12.01.02 D-02) — a release can pass validation Monday and be invalid Wednesday untouched; profiles pin per delivery (12.02.02 D-01). The pin-together decision (D-07) resolves the asymmetry the breadth file flagged.

### CX-03: Message State Is Not Store State (12.02 → 12.03)

**Relationship**: Normalised partner acknowledgements are the status board's only input, and the honesty rules on the vocabulary originate in 12.02 (never claim more than the ack supports) and are surfaced in 12.03. The Step 6 sharpening: **message state ≠ store state.** Per-partner independence (12.02.01 D-09/DT-10) is what makes the board meaningful — atomic batching would let one partner's model gap miss the artist's date at 39 stores. The Fan's real question ("why is it on Spotify but not Apple?") is answerable only because delivery is tracked per partner, not per release.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The message thread + message ID is owned by **generation** (12.02.01 DT-06), keyed to (release × partner); the board is a read projection of ack state. No merge — one writer (choreography records acks), many readers.
2. **Trigger chain**: Ack arrives → normalise to honest vocabulary → board cell updates. Async, per partner, independently. A missing ack is `Pending`, never inferred as `Live`.
3. **Permission intersection**: None beyond release ownership.
4. **Notification fan-out**: A per-store transition (`Pending → Live`, `→ Rejected`) is the event 21 (announce coordination) and 20 (fan reach) consume — see cross-domain rows.
5. **State-transition race**: A right can lapse *under* a live release (an exclusive begins, a clearance expires), so the board's truth ("live in Japan") and the rights record can diverge — the state race with legal weight, answerable here only as far as the board can (12.03.02 → 09).

### CX-04 / CX-16: The Learning Loop & Silent Normalisation (12.03 ↔ 12.01)

**Relationship**: Domain 12's **only compounding asset**. Every rejection is evidence that validation or the profile is wrong; feeding it back turns one artist's rejection into protection for every artist after them — the only available answer to a genuine cold-start disadvantage (a mature distributor's real moat is years of knowing what Beatport rejects). New in Step 6: the loop is **bidirectional** — rejections propose rules inbound (12.03.03 DT-01), and artist overrides (12.01.02 D-06) emit the outcome evidence that promotes or decays them; the loop only closes if both directions are built. CX-16 is the loop's subtler second input: **silent normalisation** — DSPs don't only reject, they silently *rewrite* accepted metadata, so the board reports `Delivered` while the store shows text the artist never wrote. A read-back is the only detector (12.02.02 PC-13 flag records which partners can *ever* be checked), and a silent fix is a learning signal as valuable as a rejection.

**Role scoping**:
- **Musician**: an asymmetric, invisible benefit — the artist who hit the rejection paid; everyone after is warned for free. A real network effect at small scale (100 artists produce useful signal).
- **Producer**: asset rejections feed asset rules the same way (12.01.04 → 12.03.03).
- **Operator / Fan**: not affected.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Triage (12.03.03) is the **single reviewed write path** into the partner-knowledge store both other sub-domains read (CX-02). Learned entries AND hand-authored profile edits share the identical review guard (a gap this depth closes — 12.02.02).
2. **Trigger chain + rollback**: Rejection OR detected silent normalisation → triage → proposed rule/profile correction → **human review** (12.03.03 D-03, deliberately caps throughput; a false blocking rule from a partner glitch would stop valid releases for everyone, invisibly) → store update → affected releases redelivered (12.05.02). Async, multi-day, spans three sub-domains.
3. **Permission intersection**: Admin review only. The artist whose rejection produced a rule has no visibility into having contributed it (12.03.03 Q-02) — arguably worth surfacing.
4. **Notification fan-out**: A rule learned from artist A can invalidate artist B's queued release; B must hear before their delivery date. A silent-normalisation finding may notify the affected artist that the store altered their metadata.
5. **State-transition race**: The CX-02 race — a validation-invalidating update between gate-green and delivery. CX-16 adds: a partner with no read-back and no sandbox can only be *inferred*, never checked, so its board state is a weaker claim than a read-back partner's.

### CX-05: Accepted Opens The Release Week (12.03 ↔ 12.04)

**Relationship**: `Accepted` is the precondition that switches on both the editorial pitch (12.04.02) and the pre-save link (12.04.03) — the release-week tools activate together on one trigger with two audiences (the pitch to editors, the pre-save to fans).

**Synthesis questions answered**:
1. **Shared-state owner**: `Accepted` per store lives in 12.03; the windows read it.
2. **Trigger chain**: `Accepted` → pitch window opens + pre-save link goes live. If acceptance slips, both slip together — but a delivery alarm and a pitch alarm are frequently the same alarm (12.03 → 21).
3. **Permission intersection**: Release ownership only.
4. **Notification fan-out**: Pre-save going live is fan-visible (12.04.03); a slip after it is live changes what fans were shown.
5. **State-transition race**: A store that goes live *early* (DT-11) fires the window ahead of the plan — the announce can lead the store or lag it.

### CX-06: The Date/Gate Collision (12.04 ↔ 12.01)

**Relationship**: The domain's defining tension. The readiness gate (12.01.03) refuses to deliver until splits balance and contributors attest; the release date (12.04.01) is announced, promoted and pre-saved. When the window arrives and a contributor has not confirmed, the platform must either hold the artist's announced release hostage over one person's silence, or deliver unattested provenance and abandon the mechanic that makes the domain `core` (D-10). Step 6 makes the coupling concrete: the **dispatch-time re-check** turns "the gate WAS green" into "the gate IS green" (12.01.03 DT-09), and `Held at dispatch` is a distinct state 12.04 must render. The most promising escape lives outside both features: **freeze the money, not the record** — moving the enforcement point from 12 to 10 (see cross-domain row for domain 10).

**Role scoping**:
- **Musician**: bears the consequence either way — a slipped date or an unattested record.
- **Producer**: usually the person who can clear the gate, and per personas.md the one whose "we'll do it later" created the situation. Design implication, load-bearing: **the lazy path must be the correct path.**
- **Fan**: affected only through a pre-save attached to a date that slips.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Gate state and schedule are independent objects that must be evaluated *together* at one moment — the delivery window. Neither owns the decision.
2. **Trigger chain + rollback**: Window arrives → gate re-evaluated at dispatch → deliver or `Held at dispatch`. A hold cascades: date slips → pitch window may close → pre-saves orphan → announce is wrong. One contributor's silence propagates to thousands of fans. No automatic rollback — a compensating re-schedule is a human act.
3. **Permission intersection**: The Musician owns the date; the contributor owns the attestation. **Neither can override the other** — the deadlock in one line.
4. **Notification fan-out**: The escalation must **name the person** (12.04.04 DT-03) — "Jamie's confirmation is what's holding 14 Aug", not "readiness: blocked". A name produces a phone call; a system state produces a shrug. Chase nudges inherit 02.04.01 D-09 caps and are requester-initiated, never platform-initiated.
5. **State-transition race**: An attestation landing *during* delivery. The gate is evaluated at the window and **pinned**, not re-read mid-flight; a track removed at the last moment must **withdraw** its pending chase notification (CX-01 Q4) rather than leave a stale "please sign" outstanding.

### CX-07: Identifiers Are Required Fields (12.01 ↔ 12.07)

**Relationship**: Identifiers (ISRC/UPC) are required ERN fields, and label copy (12.01.05) determines which prefix pool a release draws from — a WeJammin prefix vs a third-party (label-supplied) prefix (12.07 DT-12).

**Synthesis questions answered**:
1. **Shared-state owner**: The identifier belongs to the **Canonical Data / Music Identifier Registry** cross-cut (12.07 DT-01), not to either feature; 12.07 owns only assignment-at-delivery.
2. **Trigger chain**: Delivery hand-off → assign/attach identifier → embed in message. `Format` is 12.01.02's rule; `collision` is 12.07's.
3. **Permission intersection**: A third-party prefix is a **label entity** (from 01) holding a registrant code, distinct from the human who supplied it.
4. **Notification fan-out**: None direct.
5. **State-transition race**: One ISRC legitimately appears in two simultaneous messages (single + album to the same partner) and must **never** be treated as a collision (12.07 D-01 — one recording, one ISRC, forever).

### CX-08: One Generator, Many Lifecycle Messages (12.02 ↔ 12.05)

**Relationship**: Takedown and update messages come from the one ERN generator; only the human-facing surfaces differ. Step 6 sharpening: an ERN update is a **whole-truth reassertion, not a delta** (12.02.01 DT-07) — a regeneration re-asserts every field at current values, so unrelated upstream edits ride along silently unless caught. The **retained-message diff baseline** (12.02.01 D-07) is the mechanism that makes updates safe; retention has a second, un-priced job beyond dispute evidence.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The retained verbatim message (with input versions + pinned profile version) is the diff baseline, owned by generation and stored in the **Audit Log & Provenance Ledger**.
2. **Trigger chain + rollback**: Lifecycle event (takedown / metadata change) → regenerate ERN → diff against retained prior → deliver. A retention write that fails *after* delivery is a known un-owned race (12.02.01).
3. **Permission intersection**: A takedown of a co-owned release is a governance question (who may take it down — 12.05.01 → 01/09), not a distribution one.
4. **Notification fan-out**: Contributors credited on a record leaving stores arguably must be notified (12.05.01 Q-02) — credits/splits survive takedown (D-10).
5. **State-transition race**: Takedown-while-delivering is a new un-owned race the message-thread ownership must resolve (12.02.01 → 12.02.03 idempotency).

### CX-09: The Gate Applied Harder (12.01 → 12.06)

**Relationship**: Fingerprint registration reuses the gate's conditions (ownership complete, samples cleared) but **without the escape hatch**, and matching must fire at **asset availability** — the first point of custody of the audio (12.01.04) — not at delivery. A wrong delivery embarrasses; a wrong registration deputises a machine to accuse strangers automatically, forever, including fans who are users of this platform (D-11). Registration has no deadline, so the soft-override pressure that makes 12.01.03 Q-01 hard simply does not exist — the one gate in domain 12 that should be unambiguously hard.

**Synthesis questions answered**:
1. **Shared-state owner**: Both read ownership/clearance from 09/11; neither owns them. If 09 is incomplete, delivery is *blocked* and registration is *dangerous* — same missing data, different failure mode.
2. **Trigger chain**: Asset available → fingerprint match fires (12.06 owns the match; 12.01.04 owns the custody moment); registration requested → gate at a higher bar → blocked or proceed, no override.
3. **Permission intersection**: The Producer knows whether the sample was cleared but is read-only on registration — they see the door opening and cannot stop it (12.06 CX-01), arguably wrong given they hold the deciding fact.
4. **Notification fan-out**: Registration should notify contributors — a record they played on is about to start claiming videos, possibly theirs. Nearly free; the credits already exist.
5. **State-transition race**: An ownership change (09) *after* registration leaves a false assertion standing at YouTube with nothing to retract it.

### CX-10: What Leaves (12.07 ↔ 12.08)

**Relationship**: Identifier prefix provenance decides what a departing artist takes. An ISRC from WeJammin's prefix is the key their credits, royalties, claims and chart history resolve through; keeping it on exit means their career's spine stays here while they leave — the hostile lock-in problem-statement.md Q-02 warns against, dressed as an administrative detail. Both features independently recommend the same answer: **identifiers leave, with prefix provenance recorded** — forfeiting the retention mechanism every competitor quietly relies on. That forfeit is the price of D-18's "earned" being true.

**Synthesis questions answered**:
1. **Shared-state owner**: The identifier belongs to the Music Identifier Registry cross-cut, not either feature.
2. **Trigger chain**: Exit requested → what-leaves determined by prefix provenance → export → distributor-of-record change → departure.
3. **Permission intersection**: The sharpest unresolved question in the domain — a departing Musician's export contains **multi-party facts** (splits and credits belonging to co-writers and their Producer, 12.08 DT-03). A per-user export model quietly breaks the product's core artifact; GDPR erasure sits on top of the contradiction.
4. **Notification fan-out**: A departure arguably notifies contributors whose credits attach to a leaving record — probably yes, nobody has designed it.
5. **State-transition race**: An artist leaving mid-dispute (12.05.03) or mid-conflict (12.06.03) — contested facts cannot export as settled.

### CX-11: Pre/Post-Delivery Asymmetry (12.05 ↔ 12.03)

**Relationship**: Before delivery, changing where a release is sold is a picker edit; after delivery it is a **takedown**. Same gesture, opposite meanings across the delivery boundary — the model must not let a post-delivery store deselection look like the pre-delivery one.

**Synthesis questions answered**:
1. **Shared-state owner**: The store set is 12.03's; the delivery boundary flips its edit semantics.
2. **Trigger chain**: Deselect store pre-delivery → withdraw findings/scope; deselect post-delivery → generate a takedown message (12.02/12.05).
3. **Permission intersection**: Post-delivery scope change on a co-owned release inherits takedown governance.
4. **Notification fan-out**: Removing a live store invalidates fan reach there (12.03.01 → 20), a signal 20 has no other way to learn.
5. **State-transition race**: A deselection racing an in-flight delivery to that same store.

### CX-12: The Boundary Of The Thesis (12.08 ↔ 12.06)

**Relationship**: Imported catalog carries no attestations, so the evidence advantage the domain's thesis rests on (provenance beats assertion in a conflict) does not apply to it — the boundary where "earned record" stops being universally true.

**Synthesis questions answered**:
1. **Shared-state owner**: Provenance origin (`from-project` witnessed vs `imported-master` asserted) is set at the ingest seam (12.01.01 / 12.08) and read by conflict resolution (12.06.03).
2. **Trigger chain**: Import → origin stamped `imported` → in a Content ID conflict, no attestation to cite.
3. **Permission intersection**: None special.
4. **Notification fan-out**: None.
5. **State-transition race**: An imported record later gaining a witnessed correction — origin does not upgrade retroactively.

### CX-13: The Schedule Is Computed From The Message Store (12.04 ↔ 12.02)

**Relationship**: Lead times and expected-response windows are both per-partner **profile** data, and a release date is a date PLUS per-partner semantics (12.02.01 DT-13): naive projection drops the record early in Auckland or late in LA, can push first-week numbers into the wrong chart week (Global Release Day Friday, chart weeks Fri–Thu), and forfeits new-release playlist consideration. The schedule is computed from the same partner-knowledge store the messages are.

**Synthesis questions answered**:
1. **Shared-state owner**: The partner-knowledge store (CX-02) owns lead times, response windows (PC-09/PC-10) and date semantics; the schedule reads them.
2. **Trigger chain**: Chosen date + profile timezone/window data → per-partner dispatch times computed.
3. **Permission intersection**: None.
4. **Notification fan-out**: An expected-response window breach (no ack in PC-10 P90) is the delivery alarm 21/20 ultimately feel.
5. **State-transition race**: A profile window update between schedule computation and dispatch shifts a partner's real go-live moment.

### CX-14: The Builder Writes Future Obligations Into The Lifecycle (12.01 → 12.05)

**Relationship**: Newly surfaced in Step 6 and structurally important — the release builder does not only produce a delivery, it can **write dated future obligations** the lifecycle sub-domain must honour. Two instances: (1) a **term-limited licensed inclusion** on a compilation (licences run 3–5 years) creates a **scheduled takedown obligation dated at licence expiry, recorded at the moment of the add** (12.01.01 D-12/DT-12) — nothing else in the pipeline creates a scheduled takedown from a compositional choice, and without it WeJammin keeps selling an unlicensed recording and is itself the infringer (12.02.01 → 11). (2) A **replaced master post-release** is not a heavier metadata update — several DSPs require **takedown + new ISRC**, forfeiting stream count, playlist position and release date (12.01.04 DT-09) — a career-scale cost behind a button that currently looks identical to fixing a typo.

**Role scoping**:
- **Musician**: authors both obligations, usually unaware of their weight — the licence expiry is years away; the master replacement looks like an edit.
- **Producer**: the master replacement is theirs to trigger and its cost is theirs to bear.
- **Operator / Fan**: not affected, except a fan who pre-saved a record later scheduled to disappear at licence expiry.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The scheduled-takedown obligation is created by the builder but owned by the lifecycle sub-domain (12.05.01) as a durable dated action; the licence-term fact that dates it is owned by 11. No merge — one creator, one executor, one term source.
2. **Trigger chain + rollback + sync/async**: Add licensed inclusion → record obligation dated at expiry (async, fires years later). Replace master → detect that the change class forces takedown+new-ISRC (synchronous decision at edit time) → route through 12.05.02 as a lifecycle event, not a metadata update. Rollback for the master case is expensive and largely external (the old ISRC's stream history does not transfer).
3. **Permission intersection**: A co-owned release's scheduled takedown inherits takedown governance (12.05.01 → 01/09); a master replacement is an ownership-adjacent act when it changes the delivered recording.
4. **Notification fan-out**: The scheduled takedown must warn the artist ahead of the expiry date; the master-replacement button must warn **before** the click that this is a takedown, not an edit — the whole point is that the cost is invisible at the moment of action.
5. **State-transition race**: A licence renewed *before* its scheduled-takedown fires must cancel/reschedule the obligation; a scheduled takedown racing a live promotion campaign (21) is a coordination failure the calendar must expose.

### CX-15: Where The Rights Record Leaves The Building (12.02 → 12.03)

**Relationship**: Distinct from CX-03 (acks → board). The ERN message carries two fact classes that make the delivery *actionable by a third party*: **Deals** and **Parties**. Each Deal is a rights assertion to a counterparty, not a territory checkbox — this is where the 09 rights record **leaves the building** and becomes a legally-consequential claim (12.02.01 DT-04), and where delivering into someone else's exclusive becomes possible. The Parties fact class is precisely where the **wrong-artist-page disaster is committed** — the message carries a **party reference, not a string**; an unresolved or *guessed* party delivers flawlessly to the wrong person and reports success (12.02.01 → 12.03.04). The generator **never guesses** because a guess is the failure the domain exists to prevent.

**Role scoping**:
- **Musician / Producer**: the party whose page is at stake; the wrong-page landing severs their fan follow→discovery line silently (12.03.04 DT-03).
- **Fan**: no access here, but the ultimate victim of a wrong-page delivery — a follow attaches to the DSP artist entity and reaches none of them.
- **Operator**: not affected.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The Parties fact class projects from 01 (party records/identifiers); the Deals fact class projects from 09 (rights). Neither is owned by 12 — both are read, and a guessed reference is forbidden. No merge; block on unresolved party.
2. **Trigger chain + rollback**: Generation reads party reference → if unresolved/ambiguous (two acts, same name) → **block** generation, never guess. A Deal delivered into a counterparty's exclusive is a rights conflict routed to 09.04, not arbitrated here (12.03.01 D-18).
3. **Permission intersection**: Binding a store artist ID to a band/label entity requires that entity's linking authority — 01's governance gates the edge case (12.03.04 → 01).
4. **Notification fan-out**: A wrong-page delivery has **no visible failure signal** except the board's zero-plays check (12.03.02 D-10), the platform's only detector; 20 must be told a wrong page reaches no followers.
5. **State-transition race**: A party record merged/renamed in 01 between resolution and dispatch could shift which external entity the reference resolves to.

### CX-16: Silent Normalisation (folded into CX-04 above)

See CX-04 / CX-16. Retained as a distinct map row because the mechanism (store rewrites accepted metadata) differs from rejection learning and requires a read-back capability the profile records per partner (12.02.02 PC-13).

### CX-17: Store-Set Scoping Of Findings (12.03 → 12.01)

**Relationship**: Validation findings are **not release-global — they are scoped to the selected store set** (12.01.02 → 12.03.01 D-03). The selected stores are the domain over which every finding is evaluated: deselecting a store **withdraws** its findings; certifying a **new** store can add blocking findings to work the artist never touched — an edge case neither breadth file carried.

**Synthesis questions answered** (Medium — abbreviated):
1. **Shared-state owner**: The store set is 12.03's; findings are 12.01.02's, computed *over* that set.
2. **Trigger chain**: Deselect store → recompute/withdraw findings; new store certified in the partner store → re-evaluate all in-flight releases against its rules (may newly block).
3. **Permission intersection**: None.
4. **Notification fan-out**: A newly-certified store that adds a blocking finding to a gate-green release must notify before its date (shares CX-02/CX-04's "invalidated between gate-green and delivery" fan-out).
5. **State-transition race**: The same continuous-versioning race as CX-02 — a store-set change and a rule-pack update landing together.

---

## Cross-Cuts Identified for the Global CX File

> Mechanisms serving many domains, not nodes in domain 12. Reconciled against the Step 6 mechanism registry.

| Proposed cross-cut | Serves | Registry reconciliation |
|---|---|---|
| **DDEX Message Rails & Partner Conformance** (incl. the partner-knowledge store + learning loop) | 02 (RIN), 09/11 (MWL), 10 (DSR), 12 (ERN/MEAD) | **Partially** covered by registry **Integrations, Public API & Webhooks** (DDEX/DSP connectors, ERN conformance). But that entry does NOT carry the *shared learned-conformance store* (CX-02), its *bidirectional learning loop* (CX-04), silent-normalisation read-back (CX-16), or per-delivery pinning. Flagged as an **emergent refinement** — see `emergentCrossCuts`. Domain 12 keeps only outbound release messaging. |
| **Music Identifier Registry (ISRC/ISWC/UPC/GRid/IPI/ISNI)** | 01, 02, 09, 10, 11, 12 | **Covered** by registry **Canonical Data, Taxonomy & Entity Resolution** (identifier registries + dedup/merge/redirect). 12.07 keeps only assignment-at-delivery; the *space* (allocation, collision, resolution) is Canonical Data's. Not emergent — absorbed. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 12.06 Content ID | 12.03 Store & Territory | Considered: is a UGC platform just another store, reusing store selection/status machinery? Rejected — a UGC platform does not sell the record; it hosts other people's videos containing it. The "delivery" is an ownership assertion, the "status" is a claim stream against third parties, and the failure mode is accusing strangers rather than a rejection. Reusing the store model would make claims look like sales and the claimed look like customers. Genuinely tempting and genuinely wrong. |
| R-02 | 12.04 Scheduling | 12.06 Content ID | No relationship. Registration has no window, lead time or deadline — precisely why its gate can be hard with no override (CX-09). Recording the absence because "everything in release has a schedule" is a false assumption. |
| R-03 | 12.08 Catalog Migration | 12.04 Scheduling | Considered: imported releases have original dates, so does migration need scheduling? Rejected — an imported release's date is **historical metadata**, not a schedule. Modelling it through scheduling would let the platform "schedule" a release into 2019. |
| R-04 | 12.07 Identifier Assignment | 12.04 Scheduling | Assignment happens at delivery, which the schedule triggers — but the schedule does not inform assignment, and assignment does not constrain the schedule. Pure sequence, no interaction. |
| R-05 | 12.06 Content ID | 12.02 DDEX Delivery | Considered because both are partner integrations with asset submission. Rejected — Content ID platforms do not consume DDEX. Different protocol, partners, assertion. "Both are integrations" is a category, not a relationship. Recorded because integration-shaped things attract false coupling. |
| R-06 | 12.05 Catalog Lifecycle | 12.06 Content ID | Considered: does taking down a release withdraw its fingerprint? Rejected — independent by design. A recording can be withdrawn from stores and still claim on YouTube (off sale; UGC revenue continues). Coupling them would silently destroy an income stream on an unrelated commercial decision. |
| R-07 | 12.01.02 Metadata Validation | 12.01.04 Asset Conformance | Considered again at depth: asset duration feeds a metadata rule (RC-10), so are they coupled? Rejected — reading an asset-derived value is a metadata rule *consuming* a value, not a coupling. D-06 draws the line: 12.01.04 owns measured-vs-spec, 12.01.02 owns measured-vs-declared. One measures and publishes; the other adjudicates a human's claim. Recorded so spec writers do not re-invent the coupling. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-11|D-11]]
