# Release & Distribution — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Release & Distribution](./release-distribution-index.md)
> **Status**: [BREADTH] — 8 children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | The builder is the sole source of message content; the generator authors nothing and defaults nothing | Musician, Producer | High | 12.02.01 D-01 — generation is a pure projection; a defaulted field is a fabricated fact |
| CX-02 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | **The partner-knowledge store**: validation rule packs (12.01.02) and partner profiles (12.02.02) are two projections of one fact and must share one source | Musician | High | 12.02.02 DT-01 — separation guarantees drift, and drift tells the artist two contradictory things |
| CX-03 | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | Normalised partner acks are the status board's only input; the honesty rules on the vocabulary originate in 12.02 and are surfaced in 12.03 | Musician, Producer | High | 12.02.03 D-02 and 12.03.02 D-02 — never claim more than the ack supports |
| CX-04 | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | **The learning loop**: every rejection becomes a validation rule or a profile correction, so the next artist is warned before delivery rather than rejected after it | Musician, Producer | High | 12.03.03 DT-01 — the domain's only compounding asset and the answer to its cold-start gap |
| CX-05 | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | [12.04 Scheduling & Windows](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | `Accepted` is the precondition that opens both the editorial pitch and the pre-save link — the release-week tools switch on together | Musician, Fan | High | 12.04 CX-03 — one trigger, two audiences |
| CX-06 | [12.04 Scheduling & Windows](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | The collision: an announced release date meeting a readiness gate a contributor has not cleared. Where 12.01.03 Q-01 stops being theoretical | Musician, Producer | High | 12.04.01 Q-01 — the gate question arriving with a deadline attached |
| CX-07 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.07 Identifier Assignment](./12.07-identifier-assignment-at-delivery.md) | Identifiers are required message fields; label copy determines which prefix pool a release draws from | Musician, Producer | High | 12.07 behaviour; 12.01 CX-04 |
| CX-08 | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | [12.05 Catalog Lifecycle](./12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md) | Takedown and update messages come from the one ERN generator; only the product surfaces above differ | Musician, Producer | High | 12.02.01 DT-03 — shared mechanism, distinct human consequences |
| CX-09 | [12.01 Release Builder](./12.01-release-builder/12.01-release-builder-index.md) | [12.06 Content ID](./12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md) | The readiness gate's conditions apply to fingerprint registration, and apply **harder** — no override | Musician, Producer | High | 12.06.01 DT-01 — a wrong delivery embarrasses; a wrong registration accuses strangers |
| CX-10 | [12.07 Identifier Assignment](./12.07-identifier-assignment-at-delivery.md) | [12.08 Catalog Migration & Exit](./12.08-catalog-migration-exit.md) | Prefix provenance decides what leaves with a departing artist — the crux of the earned-vs-hostile question | Musician, Producer | High | 12.07 DT-02; 12.08 DT-02 |
| CX-11 | [12.05 Catalog Lifecycle](./12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md) | [12.03 Store & Territory](./12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md) | Post-delivery, changing where a release is sold is a takedown, not a picker edit. Same gesture, opposite meanings across the delivery boundary | Musician | High | 12.03 CX-03 / R-04 — the pre/post-delivery asymmetry |
| CX-12 | [12.08 Catalog Migration & Exit](./12.08-catalog-migration-exit.md) | [12.06 Content ID](./12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md) | Imported catalog carries no attestations, so the evidence advantage in conflicts does not apply to it | Musician | High | 12.06.03 DT-02 — the boundary of the thesis |
| CX-13 | [12.04 Scheduling & Windows](./12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md) | [12.02 DDEX Delivery](./12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md) | Lead times and expected-response windows are both per-partner profile data; the schedule is computed from the same store the messages are | Musician | High | 12.04.01 DT-02; 12.02.03 D-01 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-02: The Partner-Knowledge Store (12.01 ↔ 12.02)

**Relationship**: The most important structural conclusion in domain 12. Validation rule packs (12.01.02) tell the artist "Apple won't take this title". Partner profiles (12.02.02) tell the generator "Apple wants ERN 4.3 with these extensions". These look like different concerns living in different sub-domains. They are **two projections of one fact: what this partner accepts.**

Model them separately and they drift — silently, because nothing forces them to agree. The failure is precise: validation tells the artist their release is ready for Apple, the generator emits a message Apple rejects, and the product has told one user two contradictory things about one release. For a product whose entire thesis is that its record is true (D-18), contradicting itself on the most operational screen in the domain is not a bug class, it is a credibility event.

**Role scoping**:
- **Musician**: the only persona who experiences the drift, and they experience it as the product lying.
- **Producer**: sees it only through asset-spec divergence.
- **Operator / Fan**: not affected.
- **Platform admin** (`[PENDING]` — not a persona, ideation-index.md Q-02): the actual owner of the store.

**Synthesis questions answered**:
1. **Shared state conflict**: The partner-knowledge store is the shared entity, and the question is who owns it. Neither sub-domain can — it is read by both and written by a third (12.03.03's learning loop). Strong signal it belongs to the proposed **DDEX Message Rails & Partner Conformance** cross-cut rather than to either sub-domain.
2. **Trigger chain**: Rejection (12.03.03) → proposed rule → human review → store updated → both projections change together. Atomicity across the two reads is the whole point; a store updated for the generator but not the validator is exactly the drift.
3. **Permission intersection**: None at persona level. Entirely admin.
4. **Notification fan-out**: A store update can invalidate a gate-green release awaiting delivery. Affected artists must be told before the delivery date, not at it.
5. **State transition conflict**: Yes, and certain. Rule packs are versioned data (12.01.02 D-02), so updates land continuously; a release can pass validation on Monday and be invalid on Wednesday without anyone touching it. Profile versions are pinned per delivery (12.02.02 D-02); validation is not pinned to anything. That asymmetry is unresolved and needs Step 5.

### CX-04: The Learning Loop (12.03 → 12.01)

**Relationship**: Every rejection is evidence that validation or the profile is wrong. Feeding it back turns one artist's rejection into protection for every artist after them. This is domain 12's **only compounding asset**, and the only available answer to a genuine cold-start disadvantage: DistroKid's real moat is not its UI, it is fifteen years of knowing what Beatport rejects. Provenance differentiation does nothing about that gap.

The loop has two heads (validation and profiles) that must be fed from one store (CX-02), and a human gate (12.03.03 DT-03) that caps its throughput deliberately — a false blocking rule derived from a partner glitch would stop valid releases for everyone, invisibly.

**Role scoping**:
- **Musician**: an asymmetric, invisible benefit. The artist who hit the rejection paid; everyone after is warned for free. A real network effect that works at small scale — 100 artists produce useful signal — and one of the few this domain has.
- **Producer**: asset rejections feed asset rules the same way.
- **Operator / Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Triage writes to a store both other sub-domains read. The single write path in, and it needs review (12.03.03 D-03).
2. **Trigger chain**: Rejection → triage → proposed rule → human review → store update → affected releases redelivered (12.05.02). Async, multi-day, spans three sub-domains.
3. **Permission intersection**: Admin review only. But note the artist whose rejection produced the rule has no visibility into having contributed it — arguably worth surfacing (12.03.03 Q-02).
4. **Notification fan-out**: A rule learned from artist A can invalidate artist B's queued release. B must hear about it before their delivery date.
5. **State transition conflict**: Same as CX-02 item 5 — a validation-invalidating update between gate-green and delivery.

### CX-06: The Date/Gate Collision (12.04 ↔ 12.01)

**Relationship**: The domain's defining tension, and the point where the whole product thesis is tested. The readiness gate (12.01.03) refuses to deliver until splits balance and contributors attest. The release date (12.04.01) is announced, promoted and pre-saved. When the delivery window arrives and Jamie has not confirmed their bass credit, the platform must either hold the artist's announced release hostage over a contributor's silence, or deliver unattested provenance and abandon the mechanic that justifies the domain being `core` (D-10).

There is no clever resolution. It is a product decision (12.01.03 Q-01) and it decides what kind of company this is.

The most promising escape is not in either feature: **freeze the money, not the record** (12.01.03 Q-02, 12.05 Q-01). Holding a payout is more defensible and more effective than holding a release — the dispute only matters once money exists, and taking down a record punishes fans and co-writers over a contested 5%. That moves the enforcement point from 12 to 10 and is worth the owner's attention.

**Role scoping**:
- **Musician**: bears the consequence either way — a slipped date or an unattested record.
- **Producer**: usually the person who can clear the gate, and per personas.md the one whose characteristic failure ("we'll do it later") created the situation. Their design implication is unchanged and load-bearing: **the lazy path must be the correct path.**
- **Operator / Fan**: not affected, except a Fan whose pre-save is attached to a date that slips.

**Synthesis questions answered**:
1. **Shared state conflict**: The gate state and the schedule are independent objects that must be evaluated together at one moment — the delivery window. Neither owns the decision.
2. **Trigger chain**: Window arrives → gate evaluated → deliver or hold. A hold cascades: date slips → pitch window may close → pre-saves orphan → announce is wrong. One contributor's silence propagates to thousands of fans.
3. **Permission intersection**: The Musician owns the date; the contributor owns the attestation. **Neither can override the other**, which is the deadlock in one line.
4. **Notification fan-out**: The escalation must name the person (12.04.04 DT-03) — "Jamie's confirmation is what's holding 14 Aug", not "readiness: blocked". A name produces a phone call; a system state produces a shrug.
5. **State transition conflict**: An attestation landing during delivery. The gate must be evaluated at the window and pinned, not re-read mid-flight.

### CX-09: The Gate Applied Harder (12.01 → 12.06)

**Relationship**: Fingerprint registration reuses the gate's conditions (ownership complete, samples cleared, territory accurate) but must apply them without the escape hatch. The asymmetry is worth stating plainly: a wrong **delivery** embarrasses the artist; a wrong **registration** deputises a machine to accuse strangers automatically, forever, including — per D-11 — fans who are users of this platform.

Registration also has no deadline. The soft-override pressure that makes 12.01.03 Q-01 hard (an announced date, a promoted record) simply does not exist here. Nothing is lost by waiting. That makes this the one gate in domain 12 that should be unambiguously hard, and it is a useful clarifier for Q-01 itself: the override exists to serve a deadline, so where there is no deadline there is no override.

**Role scoping**:
- **Musician**: gated harder, with no override.
- **Producer**: knows whether the sample was cleared, and is read-only on registration — they can see the door opening and cannot stop it (12.06 CX-01).
- **Fan**: the party claimed. No lens. The tension D-11 creates and nobody else faces.
- **Operator**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Both read ownership and clearance from 09/11. Neither owns them. If 09 is incomplete, delivery is blocked and registration is *dangerous* — a meaningful difference in failure mode from the same missing data.
2. **Trigger chain**: Registration requested → gate conditions evaluated at a higher bar → blocked or proceed. No override path exists.
3. **Permission intersection**: Same actors, different severity. The Producer's read-only on registration is arguably wrong given they hold the deciding fact about samples.
4. **Notification fan-out**: Registration should notify contributors — a record they played on is about to start claiming videos, possibly theirs. Nearly free, since the credits already exist.
5. **State transition conflict**: An ownership change (09) after registration. The assertion made to YouTube is now false and nothing retracts it.

### CX-10: What Leaves (12.07 ↔ 12.08)

**Relationship**: Identifier prefix provenance decides what a departing artist takes. An ISRC from WeJammin's prefix is the key their credits, royalties, claims and chart history resolve through (12.07 DT-03). Keeping it on exit means their career's spine stays here while they leave — which is precisely the hostile lock-in problem-statement.md Q-02 warns against, dressed as an administrative detail.

Both features independently recommend the same answer: **identifiers leave, with prefix provenance recorded.** It forfeits the retention mechanism every competitor quietly relies on. That forfeit is the price of D-18's "earned" being true rather than marketed, and it is the owner's call (12.08 Q-01).

**Role scoping**:
- **Musician**: takes their record or does not. This is the most consequential thing the domain does to them and they will never see it until the day they leave.
- **Producer**: the most exposed. Their credits attach to recordings owned by dozens of artists — their proof of work is distributed across other people's exit decisions (12.08 DT-03).
- **Operator / Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The **identifier** is the shared entity and it belongs to the proposed Music Identifier Registry cross-cut, not to either feature (12.07 DT-01).
2. **Trigger chain**: Exit requested → what-leaves determined by prefix provenance → export → distributor-of-record change → departure.
3. **Permission intersection**: The sharpest unresolved question in the domain. A departing Musician's export contains **multi-party facts** — splits and credits belonging to their co-writers and their Producer as much as to them (12.08 DT-03). A per-user export model quietly breaks the product's core artifact, and GDPR erasure sits on top of the contradiction. No competitor hits this, because none holds facts worth exporting.
4. **Notification fan-out**: Does a departure notify contributors? Their credits are attached to a record that is leaving. Probably yes; nobody has designed it.
5. **State transition conflict**: An artist leaving mid-dispute (12.05.03) or mid-conflict (12.06.03). Contested facts cannot export as settled.

---

## Cross-Cuts Identified for the Global CX File

> These are **mechanisms serving many domains**, not nodes in domain 12. Recorded here per the
> Node Classification Gate and returned in `crossCuts` for the global CX file to absorb.

| Proposed cross-cut | Serves | Why it is not a node in 12 |
|---|---|---|
| **DDEX Message Rails & Partner Conformance** | 02 (RIN), 09/11 (MWL), 10 (DSR), 12 (ERN/MEAD) | The sweep's candidate bundled five DDEX standards owned by four domains. The *shared* machinery — schema validation, version negotiation, partner profiles, transport choreography, the partner-knowledge store (CX-02) — serves all of them. Domain 12 keeps only outbound release messaging. Leaving the rails inside 12 would make Release the de-facto owner of royalty reporting and credit exchange |
| **Music Identifier Registry (ISRC/ISWC/UPC/GRid/IPI/ISNI)** | 01, 02, 09, 10, 11, 12 | Identifiers are assigned at different moments by different domains — ISWC by a CMO on work registration (09/10), IPI/ISNI to parties (01), ISRC/UPC at delivery (12). The *space* needs one owner for allocation, collision detection and resolution; the *moments* stay with their domains. 12.07 keeps only assignment-at-delivery |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 12.06 Content ID | 12.03 Store & Territory | Considered: is a UGC platform just another store, and should Content ID reuse the store selection and status machinery? Rejected — a UGC platform does not sell the record; it hosts other people's videos containing it. The "delivery" is an ownership assertion, the "status" is a claim stream against third parties, and the failure mode is accusing strangers rather than a rejection. Reusing the store model would make claims look like sales and the claimed look like customers. Genuinely tempting and genuinely wrong. |
| R-02 | 12.04 Scheduling | 12.06 Content ID | No relationship. Registration has no window, no lead time and no deadline — which is precisely why its gate can be hard with no override (CX-09). Recording the absence because "everything in release has a schedule" is an easy false assumption. |
| R-03 | 12.08 Catalog Migration | 12.04 Scheduling | Considered: imported releases have original release dates, so does migration need scheduling? Rejected — an imported release's date is **historical metadata**, not a schedule. Nothing is being timed; a past date is being recorded. Modelling it through scheduling would let the platform "schedule" a release into 2019. |
| R-04 | 12.07 Identifier Assignment | 12.04 Scheduling | Assignment happens at delivery, which the schedule triggers — but the schedule does not inform assignment in any way, and assignment does not constrain the schedule. Pure sequence, no interaction. |
| R-05 | 12.06 Content ID | 12.02 DDEX Delivery | Considered because both are partner integrations with fingerprint/asset submission. Rejected — Content ID platforms do not consume DDEX. Different protocol, different partners, different assertion. The apparent similarity is that both are "integrations", which is not a relationship; it is a category. Recording it because integration-shaped things attract false coupling. |
| R-06 | 12.05 Catalog Lifecycle | 12.06 Content ID | Considered: does taking down a release withdraw its fingerprint? Rejected — they are independent by design. A recording can be withdrawn from stores and still claim on YouTube, which is a legitimate and common configuration (the record is off sale; the UGC revenue continues). Coupling them would silently destroy an income stream on an unrelated commercial decision. |
