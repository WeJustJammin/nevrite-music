# Trust, Safety & Disputes — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Trust, Safety & Disputes](./trust-safety-disputes-index.md)
> **Status**: [DEEP] — 9 children; intra-domain cross-cuts synthesised from Step 6 edge evidence
> **Last updated**: 2026-07-18

This domain is a single adjudication machine wearing nine faces. Its cross-cuts are not incidental
couplings — they are the machine's own wiring. One decision record is authored at the queue, sealed by
enforcement, cited in a statement of reasons, contested in an appeal, and archived in the evidence locker;
one policy library is the version pin every one of those steps reads; and three reason families (self-harm,
CSAM, factual rights/credit disputes) are structurally routed *around* the general pipe before any
classifier or ladder touches them. The high-value entries below are all facets of that one spine.

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | The domain's spine: intake → route → decide → sanction + Statement of Reasons (atomic) → appeal → reversal back into the queue. One structured **decision record** is the shared entity, authored at the queue step (24.01.03) and sealed at enforcement (24.02.03); the **policy library** (24.02.04) is the version pin both read; reporter-anonymity (24.01.01 D-02) governs what identity may appear in the SoR facts field | Musician, Producer, Operator, Fan | High | DSA Art 16 starts a clock at intake; Art 17 requires the SoR to ship atomically with the restriction. Reason taxonomy is a projection of the versioned rulebook (24.01.01 → 24.02.04); the decision object must be structured at the queue or the SoR cannot be generated (24.01.03 → 24.02.03) |
| CX-02 | [24.09 Case Evidence Locker](./24.09-case-evidence-locker.md) | 24.01, 24.02, 24.04, 24.05, 24.07, 24.08 (all adjudication children) | One case-scoped bundle of snapshots, six consumers. The reviewer's entire view **is** the 24.09 snapshot (24.01.03); the snapshot is captured at the event, never reconstructed at the dispute. **This is why 24.09 sits at domain level** | Musician, Producer, Operator, Fan (read-only, own case) | High | Three sub-domains derived capture-at-source independently — 24.03.03 DT-02, 24.04.01 DT-02, 24.04.04 DT-01. Snapshot survives target delete/edit (24.01.01 → 24.09); snapshot incompleteness IS the Partial state (24.01.03 → 24.09) |
| CX-03 | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | Detection **proposes**; only enforcement disposes. A risk engine with sanctioning power bans your best customer at 3am with no reasons and no appeal. Fraud emits a signal into the same ladder that produces a truthful, structured, automated-means-flagged SoR | Musician, Producer, Operator, Fan (as friction) | High | 24.03 D-02; Art 17 requires the automated-means flag, so an automated sanction must still produce a structured SoR. Role Matrix: 24.03 is all-`❌` — the personas never see the score, only 24.02's outcome |
| CX-04 | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | [24.04 Transaction Disputes & Protection](./24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-index.md) | Bidirectional: a chargeback is both a fraud signal and a dispute; human dispute adjudications are the only labelled data the cold-start fraud engine will ever get | Musician, Operator (as sellers), Fan (as buyer) | High | 24.03 CX-04: at cold start there are no labels; human adjudications are the sole ground truth. Card-testing detection depends on 14's instant-fulfilment checkout constraint (24.03.04) |
| CX-05 | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | **Two ladders, one engine, opposite virtues.** The general ladder rewards discretion; the rigid 512(i) repeat-infringer counter punishes it and must be un-softenable by design | Musician, Producer | High | BMG v. Cox (~$1B) and UMG v. Grande ($46.7M) were lost by exercising judgment around a written policy — 24.05.01 DT-01. A reversed strike must decrement (24.05.01 → 24.02.02); an incomplete notice must not increment (24.05.01 D-02) |
| CX-06 | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) | The crisis lane must **bypass** the queue, the classifier and the ladder — structurally, defined in the intake taxonomy, executed downstream. No sanction, ever | Musician, Fan (incl. minors) | High | 24.01.01 → 24.06.03: self-harm bypass fires before any queue enqueue so a welfare case is never sanctioned. Processing a crisis as content produces an SoR explaining which policy a farewell violated (24.06.03 DT-01) |
| CX-07 | [24.07 Identity Abuse & Ownership](./24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | The domain's boundary line, tested: both touch identity, on opposite sides. **Signal-driven → 24.03; claim-driven → 24.07.** A confirmed ATO hands off to a recovery claim | Musician, Producer, Operator | Medium | 24.03 D-01 + 24.07 CX R-01: same words ("someone is using an identity that isn't theirs"), opposite machinery. The membership graph (domain 01) is the disambiguator that stops multi-account users being flagged as rings (24.03.02) |
| CX-08 | [24.08 Illegal Content & Legal Process](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) | [24.09 Case Evidence Locker](./24.09-case-evidence-locker.md) | A legal hold overrides every other retention clock — including a user's own erasure right. The one place the platform defeats a user's rights by design | Musician, Producer, Operator, Fan (invisibly) | High | 24.08.01 → 24.09: preservation writes a legal hold that only a court or the statutory clock releases; the `Privacy` cross-cut names the collision and 24.09 DT-03 makes it a schema |
| CX-09 | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) (Prohibited Items 24.02.05) | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) (Authenticity 24.05.03) | **One listing gate, two engines.** Prohibited-items and counterfeit/authenticity both block a listing at the same moment and must never give the seller contradictory reasons | Musician, Operator (as sellers) | Medium | A vintage guitar can fail CITES *and* be a suspected refin; the seller needs one coherent answer. Both cite the same rule ID from 24.02.04 but Prohibited-Items refusals are explicitly NOT Art 17 SoRs (24.02.03 → 24.02.05, R-03) |
| CX-10 | [24.08 Illegal Content & Legal Process](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) (CSAM 24.08.01) | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) (Queue 24.01.03) | CSAM must be **structurally excluded** from every general queue — reviewer exposure plus a preservation duty incompatible with ordinary handling. Only access is a logged single-viewer break-glass, no preview surface | None (all four personas `❌`) | High | 24.08.01 → 24.01.03: hard-routed out (24.08 D-02); hash-match is a separate pipeline from probabilistic classification (24.08.01 → 24.01.02, R-02). On a one-person team the reviewer is the owner and cannot be rotated (24.01.03 DT-01, Q-06) |
| CX-11 | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) (Intake 24.01.01) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | The report channel is itself an attack surface. Over-quota reporters and multi-account brigading clusters are detected at intake and **handed off** to fraud for account-side adjudication — intake emits the signal, 24.03 owns the account outcome | Musician, Producer, Operator, Fan (as abused reporter *and* as brigading target) | Medium | 24.01.01 → 24.03: intake emits an intake-abuse-suspect / brigading-cluster signal; 24.03 owns adjudication. Volume-as-priority is rejected in both layers (24.01.01 DT-03 == 24.01.03 DT-06) so brigading cannot buy queue priority |
| CX-12 | [24.08 Illegal Content & Legal Process](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) (CSAM 24.08.01) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | The masking rule: a CSAM-driven account action surfaces to the subject **only** as 24.02's generic suspension notice and reinstates through 24.02's standard review path. The CSAM basis is never disclosed in any SoR | Musician, Producer, Operator, Fan (subject, invisibly) | High | 24.08.01 → 24.02: 24.02 must not leak a CSAM-specific reason; a false-positive reinstates via the ordinary suspension-review path. This is the deliberate exception to CX-01's Art 17 specificity rule |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** Use `trust-safety-disputes-cx.md#CX-NN` when citing from another file.

---

## Cross-Cut Details

### CX-01: Reporting & Moderation ↔ Enforcement, Appeals & Policy

**Relationship**: The domain's spine. A report or classifier hit becomes a case with a statutory clock; a
reviewer decides against a **pinned rule version**; a sanction and its Statement of Reasons land atomically;
the subject appeals; a reversal cascades back into the queue. Three sub-features stitch this together across
the 24.01/24.02 boundary: the **decision record** must be structured *at the queue step* (24.01.03) or the
SoR (24.02.03) cannot be generated from it; the **policy library** (24.02.04) is the version pin the reason
taxonomy (24.01.01), the ladder (24.02.01) and the SoR all read; and the reporter-anonymity rule (24.01.01
D-02) governs which identity may appear in the SoR's facts field. Every other sub-domain is a specialised
feeder into this pipe.

**Role scoping**:
- **Musician**: reporter and subject. The sanction may be their income; the SoR's specificity determines
  whether they can appeal or must guess.
- **Producer**: subject with blast radius — a takedown on a shared project mix hits six contributors who
  receive no SoR because none of them were sanctioned (24.02.03 DT-03).
- **Operator**: subject with perishable inventory — reversal on Monday returns a calendar, not the Saturday.
- **Fan**: highest volume, lowest stakes, and the population for whom a rigid ladder is actually right.

**Synthesis questions answered**:
1. **Shared state conflict**: intake owns the case; enforcement owns the sanction; both reference **one**
   structured decision record whose schema is fixed by Art 17's required fields — which is why it must exist
   before the first sanction, not after the first regulator. The record is authored progressively (queue
   captures cited rule + evidence ref + reviewer + concurrence; enforcement seals it) and is never
   double-authored. Concurrent sanctions on one object serialise via the enforcement-state machine (409 on
   conflict, 24.02.03 → 24.02.01).
2. **Trigger chain**: report → dedup → route → review → decide → sanction + SoR (atomic) → appeal window.
   **If SoR emission fails the sanction rolls back** (CX-02 in the 24.02 sub-CX) — a restriction with no
   notice is precisely the Art 17 failure. If routing fails the case lands in an SLA'd dead-letter queue; a
   lost report is a statutory breach, not a dropped job. If the policy library cannot resolve the pinned
   version, application blocks with 422 rather than citing a live reference.
3. **Permission intersection**: reporting requires no permission; acting requires operator scope. For an
   *entity* subject, which member may appeal is a domain 01 mandate question this domain applies but does not
   define (24.02.02 → domain 01). Reporter-anonymity constrains the SoR content even though the subject has
   full appeal rights.
4. **Notification fan-out**: reporter (receipt, then outcome), subject (SoR, delivered synchronously on
   commit, **never batched into a digest**, 24.02.03 → Notifications), and any counterparty whose transaction
   evaporated. Collateral victims of a takedown on a shared artifact receive nothing — legal, arguably wrong
   (24.02.03 Q-02).
5. **State transition conflict**: a subject can appeal while a second independent sanction lands. Enforcement
   state is a state machine, not a flag set; reversing one sanction must not reverse the other, and an appeal
   reversal marks the SoR *superseded*, never deleted (it remains evidence).

### CX-02: Case Evidence Locker ↔ all adjudication children

**Relationship**: One bundle, six consumers. The locker snapshots what was capturable **at the moment of the
event** — the listing photo as it was, the mix as delivered, the thread as it stood, the venue hold and
deposit events — and every adjudication surface reads it: a moderation appeal, a claim, a chargeback
representment, a DMCA counter-notice, an ownership dispute, a law-enforcement production. Critically, the
reviewer's entire working view (24.01.03) **is** this snapshot; snapshot incompleteness surfaces as the
reviewer's Partial state, not as a silent gap.

This is the product's thesis (D-18) applied to its own machinery, and the reason it sits at domain level is
empirical: **three sub-domains derived it independently** — returns (24.03.03 DT-02), claims (24.04.01
DT-02), chargebacks (24.04.04 DT-01).

**Role scoping**:
- **Musician / Producer / Operator / Fan**: read-only, own case only. **None may write** — evidence is
  written by the system at the event, never by a party at the dispute. Occasionally unfair to someone who
  forgot to photograph the amp, and the correct answer anyway.
- **Producer's bundle is the richest** (brief, revisions, approvals, session provenance); **Operator's is
  the thinnest** (a booking has no delivery signature), which is exactly why Operator no-show bundles and
  booking-deposit chargebacks are the hardest to defend (24.09 → domain 17).

**Synthesis questions answered**:
1. **Shared state conflict**: the locker owns bundles; it owns none of the sources. It reads the `Audit Log`,
   `Messaging` and `Object & Evidence Storage` cross-cuts plus the domain schemas of 13/17/07. **Its cost
   lands on those domains** — every snapshot is storage and every capture is friction on a user who wants to
   be done (24.09 Q-01). The Projects capture (24.09 → domain 07) shares one trigger with the locker snapshot
   and must not double-capture or diverge.
2. **Trigger chain**: event → snapshot (byproduct) → (later) case → assemble → seal. **A missing snapshot
   cannot be recovered**, so the failure happens weeks before anyone notices. Structured fields are mandatory
   — a listing snapshot must capture condition/serial/photos as queryable fields, not a rendered HTML blob
   (24.09 → domain 13), or the bundle cannot be queried in a dispute.
3. **Permission intersection**: case-scoped. A party sees their own case only; a leak finding (24.05.04) names
   a collaborator and is an accusation the chain of custody must be able to defend.
4. **Notification fan-out**: none — the locker notifies nobody. It is read, not pushed.
5. **State transition conflict**: **the retention clocks are the conflict.** CSAM preservation, chargeback
   windows, tax retention, open disputes, legal holds and GDPR erasure impose contradictory requirements on
   one bundle. Legal hold wins (CX-08); the `Privacy` cross-cut's anonymise-and-retain is the reconciling
   rule, cheaper to decide now than under a live DSAR clock.

### CX-03: Fraud & Risk Operations ↔ Enforcement, Appeals & Policy

**Relationship**: Detection proposes, enforcement disposes. Fraud never sanctions directly; it emits a
scored signal that enters the same ladder every human decision uses, so an automated action still yields a
truthful, structured, automated-means-flagged SoR. A risk engine holding its own sanctioning power is one
that bans a top seller at 3am with no reasons and no appeal — the exact failure D-02 exists to prevent.

**Role scoping**:
- **Musician / Producer / Operator / Fan**: never see the score (24.03 Role Matrix all-`❌`). They experience
  fraud ops only as friction, always delivered via 24.02's sanction-with-reasons. Exposing a threshold
  teaches an adversary where it sits.

**Synthesis questions answered**:
1. **Shared state conflict**: the risk score is 24.03's private state; the sanction record is 24.02's. They
   meet only through an explicit, auditable proposal event — never a shared mutable flag. Adjudication
   outcomes may become fraud labels, but through an explicit reversible path, not by piping sealed cases
   straight into the model (R-04).
2. **Trigger chain**: signal → risk decision → *proposal* into ladder → human or automated disposition →
   SoR. If enforcement rejects the proposal, no sanction lands and the signal is retained as a label
   candidate. Async by design: detection runs continuously, disposition is bounded by the enforcement path.
3. **Permission intersection**: nobody in the four personas can read or act on a score. Fraud withholding
   targets in-flight escrow reserve, not owed balances (24.02.01 → payouts), so a demonetization proposal
   cannot reach through to a user's settled funds.
4. **Notification fan-out**: only the enforcement SoR reaches the subject; the risk basis is generalised, not
   disclosed. No fraud-specific notification exists.
5. **State transition conflict**: a proposal can arrive while an appeal on a prior sanction is open; the two
   are distinct records on the enforcement state machine and must not merge. A successful appeal that reverses
   a sanction must also retract or reverse any label it fed to the model.

### CX-04: Fraud & Risk Operations ↔ Transaction Disputes & Protection

**Relationship**: Bidirectional and mutually bootstrapping. A chargeback is simultaneously a fraud signal
(this account, this card) and a dispute (this transaction, this remedy). At cold start the fraud engine has
no labels at all, and human dispute adjudications are the only ground truth it will ever receive.

**Role scoping**:
- **Musician / Operator (as sellers)**: bear the chargeback and supply the representment evidence.
- **Fan (as buyer)**: initiates most consumer chargebacks; the buyer-protection refund path (24.04.03) is
  their remedy for the low-value counterfeit half fraud detection cannot economically review per-item.

**Synthesis questions answered**:
1. **Shared state conflict**: the dispute record (24.04) and the fraud label store (24.03) are separate; the
   dispute *outcome* is copied into the label store as an explicit, timestamped, reversible fact — not shared
   by reference, so an appeal on the dispute can retract the label.
2. **Trigger chain**: chargeback arrives → opens a dispute *and* fires a fraud signal in parallel → dispute
   resolves → outcome labels the fraud model. Representment relies on the 24.09 bundle (door-scan for tickets,
   venue-hold record for bookings, condition photos for gear) captured at each domain's own moment.
3. **Permission intersection**: the seller can view and contest the dispute but never sees the fraud score
   the same chargeback produced.
4. **Notification fan-out**: dispute events notify both parties; the fraud label move is silent.
5. **State transition conflict**: a chargeback can land while a platform dispute on the same transaction is
   already open. The filing clock must not restart and a split/credit dispute must not be miscast as a
   transaction dispute (24.04.01 → domain 02/09, D-02), or the same event yields two contradictory remedies.

### CX-05: Copyright & Authenticity ↔ Enforcement, Appeals & Policy

**Relationship**: The domain's sharpest internal contradiction, designed in rather than discovered. The
general ladder **rewards discretion** (a first-time Fan insult is not a repeat offence; proportionality is a
virtue). The DMCA 512(i) repeat-infringer ladder **punishes discretion**: Cox and Grande lost ~$1B and
$46.7M because they had a written policy and exercised judgment around it, and courts read that judgment as
non-implementation. One engine hosts one discretionary ladder and one rigid, automatic, auditable counter
that must be un-softenable *by design*.

**Role scoping**:
- **Musician**: subject of both ladders, and the persona for whom the rigid one is most dangerous — a
  bad-faith bulk claimant can ratchet strikes and the ladder cannot exercise mercy.
- **Producer**: highest exposure — their working uploads are the masters labels control (24.05.02 DT-01).
- **Operator / Fan**: low volume on the rigid ladder; ordinary subjects of the general one.

**Synthesis questions answered**:
1. **Shared state conflict**: one sanction record, two counters. The 512(i) strike is a separate, auditable
   field keyed on a distinct `(claimant, asset, event)` unit — never an inference over the mutable general
   sanction history.
2. **Trigger chain**: complete notice → removal → strike increment (automatic) → threshold → termination. A
   reversed strike **must decrement** (24.05.01 → 24.02.02) or the ratchet punishes users for platform
   errors. An **incomplete notice must not increment** (24.05.01 D-02). A fingerprint match is a *signal into
   a claim*, weighed against the provenance graph, never an auto-takedown (24.05.01 → 24.05.02).
3. **Permission intersection**: none — and that is the point. Nobody has permission to soften the counter.
4. **Notification fan-out**: the subject gets the SoR **and the strike count and next rung stated in
   advance** — a rigid ladder that surprises you is one nobody could act on.
5. **State transition conflict**: **termination meets D-03.** The rigid ladder terminates; the property
   constraint keeps the banned bassist's 20% share and the band's chain of title intact. Both are absolute
   and resolve only because the sanction acts on *access*, never on the *record*.

### CX-06: Personal Safety ↔ Reporting & Moderation

**Relationship**: A carve-out defined at intake, executed downstream. Three reason families leave the general
queue before any classifier touches them: CSAM (→ 24.08.01, preservation duty), factual rights/credit
disputes (→ domains 02/09, wrong remedy — the *remedy* leaves, the *adjudication work* does not: those cases
return as case classes on the shared `Dispute Case Engine`, see **Inbound Adjudication Load** below), and
**self-harm (→ 24.06.03, no sanction ever)**. The self-harm
bypass must fire *before* any queue enqueue (24.01.01 → 24.06.03) so a welfare case can never be sanctioned.

**Role scoping**:
- **Musician**: both subject and reporter — music's occupational profile carries documented elevated risk.
- **Fan**: brings the volume, and per D-13 includes minors — a different duty entirely.
- **Producer / Operator**: reporters, from the rooms where they see people at their worst.

**Synthesis questions answered**:
1. **Shared state conflict**: none — and the *absence* of a record is the design. A crisis leaves no sanction,
   no strike, no SoR, no case against the person.
2. **Trigger chain**: report → **bypass everything** → localised resources to subject and reporter. The bypass
   rule lives in 24.01.01's taxonomy, is nearly free on day one, and is impossible to bolt on once the queue
   is the only path.
3. **Permission intersection**: none.
4. **Notification fan-out**: subject (quietly, no accusation, no case number) and reporter (who is not fine).
5. **State transition conflict**: content that is *both* a crisis disclosure and a policy violation. **The
   crisis lane wins** — do not sanction a person in crisis for how they expressed it.

### CX-07: Identity Abuse & Ownership ↔ Fraud & Risk Operations

**Relationship**: The domain's boundary line, tested. Both touch identity and sit on opposite sides of D-02's
signal-vs-claim axis. Nobody reports card-testing or a ban-evasion ring → 24.03 (signal-driven detection).
Someone asserts "this profile is impersonating me" with evidence → 24.07 (claim-driven adjudication). A
confirmed ATO in 24.03 hands off to an account-recovery claim in 24.07.

**Role scoping**:
- **Musician / Producer / Operator**: can file impersonation and ownership claims (24.07); experience 24.03
  only as friction.
- **Fan**: `👁️` read-only in 24.07 — owns no band, label, studio or catalogue to dispute.

**Synthesis questions answered**:
1. **Shared state conflict**: 24.03 owns the risk/ring cluster; 24.07 owns the contested-ownership case. The
   membership graph (domain 01) is the shared disambiguator — it stops a legitimate multi-hyphenate being
   flagged as a ring (24.03.02) and resolves who may respond on an entity's behalf (24.07.02).
2. **Trigger chain**: ATO signal (24.03) → account-recovery claim (24.07); the handoff is an explicit case
   creation, not a shared flag. Async — detection is continuous, recovery is a bounded claim.
3. **Permission intersection**: an entity ownership claim depends on domain 01's mandate graph to decide who
   may file and bind a resolution; 24.07 is blocked on that model (24.07 Q-02).
4. **Notification fan-out**: recovery contact channels drive the D-07 delivery-failure escalation; fraud
   detection notifies nobody directly.
5. **State transition conflict**: an ATO can be in progress while the true owner files a recovery claim; the
   two must converge on one account, not fork it. Freezes on a contested entity must scope to the entity's
   own assets while accruals keep accumulating (24.07.02 → domains 09/10).

### CX-08: Illegal Content & Legal Process ↔ Case Evidence Locker

**Relationship**: A CSAM match (or a law-enforcement production) writes a **legal hold** onto the evidence
bundle that overrides every retention clock, including the user's own erasure right. This is the one place
the platform defeats a user's rights by design. The NCMEC report and the follow-up legal request (arriving
weeks later through the 24.08.03 portal) must both find the preserved material still intact.

**Role scoping**:
- **Musician / Producer / Operator / Fan**: affected invisibly. "Delete my account" must mean
  anonymise-and-retain the held bytes, and deletion appears to succeed while the material is silently retained.

**Synthesis questions answered**:
1. **Shared state conflict**: the locker owns the bundle; the legal hold is a flag 24.08 writes onto it that
   only a court or the statutory clock can clear. No party, and no ordinary retention job, can remove it.
2. **Trigger chain**: match → preservation write → legal hold → (weeks later) legal request finds it intact
   (24.08.01 → 24.08.03). Fail-closed: content is stored-but-not-servable until matching clears (24.08.01 →
   Media Handling).
3. **Permission intersection**: the hold defeats the `Privacy` cross-cut's erasure right — the single
   documented exception, and it must be decided at architecture time, not under a live DSAR clock.
4. **Notification fan-out**: none to the subject about the preservation itself; disclosure would frustrate the
   legal purpose.
5. **State transition conflict**: erasure vs mandatory preservation collide on one bundle. Resolved by
   `DELETE` meaning anonymise-and-retain, never `DELETE CASCADE` — the identical conclusion the `Privacy`
   cross-cut reached independently (D-03).

### CX-09: Prohibited Items Engine ↔ Authenticity & Counterfeit

**Relationship**: One listing gate, two engines firing at the same moment. Prohibited-items (24.02.05, e.g.
CITES-restricted materials) and counterfeit/authenticity (24.05.03, e.g. suspected refin or fake brand) both
block a listing at checkout and must present the seller one coherent reason, not two contradictory refusals.

**Role scoping**:
- **Musician / Operator (as sellers)**: the only affected roles; a Fan buying is downstream of the gate.

**Synthesis questions answered**:
1. **Shared state conflict**: both cite a rule ID from the same policy library (24.02.04); the engine is the
   machine-readable projection of that rulebook and a rule publish must rebuild it or the seller gets
   contradictory reasons (24.02.04 → 24.02.05, CX-04 in the 24.02 sub-CX).
2. **Trigger chain**: listing submit → both checks run → refusals merged into one message. A rebuild failure
   keeps the old projection and alerts — never fail open (E-12).
3. **Permission intersection**: none between the two; both are pre-publication gates. Trademark exhaustion is
   checked before any brand notice actions, so a brand register cannot become a used-market veto (24.05.03 →
   domain 13).
4. **Notification fan-out**: the seller alone; a listing-gate refusal is explicitly NOT an Art 17 SoR (R-03)
   but must cite the same rule ID for consistency.
5. **State transition conflict**: a release-state transition can flip the meaning of an identical match signal
   (crisis → non-event, 24.05.04 → domain 12); the gate must read current state, not a cached verdict.

### CX-10: CSAM Detection ↔ Moderation Queue & Reviewer Ops

**Relationship**: CSAM must be **structurally excluded** from every general moderation queue — no code path
from a CSAM hit to a general lane. Reviewer exposure plus a preservation duty are incompatible with ordinary
handling. The only human access is a single-viewer break-glass path with logged justification and no preview
surface. Hash-match (near-certain, legal duty) is a deliberately separate pipeline from probabilistic content
classification (24.08.01 → 24.01.02, R-02) so neither inherits the other's posture.

**Role scoping**:
- **None**: all four personas are `❌`. The reviewer/owner is the affected party, and on a one-person team
  (Q-06) they cannot be rotated — reviewer safeguarding is the shared open problem (24.08 Q-03).

**Synthesis questions answered**:
1. **Shared state conflict**: the CSAM case and the general queue share no state by construction; the S0-illegal
   reason set is the routing table's hard exclusion (24.01.03 → 24.08.01/24.06.03, D-06), and that set must
   agree across intake, routing and the CSAM target.
2. **Trigger chain**: hash match → out of every general queue → preservation-duty path → NCMEC. Fail-closed if
   the matcher is unavailable (content stored-but-not-servable).
3. **Permission intersection**: break-glass is the sole access, logged with justification; no reviewer holds
   standing CSAM access.
4. **Notification fan-out**: the subject sees only 24.02's generic suspension (CX-12); no CSAM-specific event
   reaches anyone outside the preservation path.
5. **State transition conflict**: the audio-CSAM coverage gap (24.08.01 DT-01/D-03) is a *known* gap that must
   be logged in the risk register (24.08.04) as an assessed, accepted risk — an unnamed risk cannot be assessed.

### CX-11: Report Intake ↔ Fraud & Risk Operations

**Relationship**: The reporting channel is itself an attack surface. Over-quota reporters
(intake-abuse-suspect) and multi-account brigading clusters are detected *at intake* and handed to fraud for
account-side adjudication. Intake emits the signal; 24.03 owns the account outcome. This keeps 24.01 focused
on the reported content while the account-level abuse pattern is adjudicated where account signals live.

**Role scoping**:
- **All four personas**: potential abusers (weaponising reports) *and* potential targets (a brigade of
  coordinated reports against one artist).

**Synthesis questions answered**:
1. **Shared state conflict**: intake owns the individual report; 24.03 owns the reporter-account risk profile.
   They meet via an explicit signal event, not a shared counter.
2. **Trigger chain**: report volume/pattern crosses a threshold → intake-abuse or brigading-cluster signal →
   24.03 adjudicates the account(s). Async and out-of-band from the reported content's own case.
3. **Permission intersection**: reporting needs no permission, which is exactly why the abuse vector exists;
   the account-side sanction that follows routes back through 24.02 like any other (CX-03).
4. **Notification fan-out**: the abused *target* is not told a brigade was detected; the abusing reporter is
   sanctioned via a standard 24.02 SoR.
5. **State transition conflict**: **volume-as-priority is rejected in both layers** (24.01.01 DT-03 ==
   24.01.03 DT-06), so a brigade cannot buy queue priority for its reports — the two layers must stay
   consistent or the guarantee breaks.

### CX-12: CSAM Detection ↔ Enforcement, Appeals & Policy (the masking rule)

**Relationship**: The deliberate exception to CX-01's Art 17 specificity. A CSAM-driven account action
surfaces to the subject **only** as 24.02's generic suspension notice; the CSAM basis is never disclosed in
any SoR, and a false positive reinstates through 24.02's ordinary suspension-review path. Specificity is the
default everywhere in this domain — here, non-disclosure is mandatory.

**Role scoping**:
- **Subject (any persona)**: sees a generic suspension, never the real reason. A wrongly-actioned user is
  reinstated without ever learning what triggered it.

**Synthesis questions answered**:
1. **Shared state conflict**: the CSAM case (24.08) and the enforcement record (24.02) are linked, but the
   enforcement record's user-facing reason field is deliberately generic — 24.02 must not leak a CSAM-specific
   reason into an SoR.
2. **Trigger chain**: match → account action proposed → 24.02 applies a generic suspension → subject sees the
   standard notice. A false positive → standard suspension-review → reinstatement, CSAM basis never surfaced.
3. **Permission intersection**: the moderator handling the ordinary suspension review has no CSAM-case access;
   the two adjudication contexts are permission-separated.
4. **Notification fan-out**: subject gets the generic suspension notice only; the true basis stays inside the
   preservation path.
5. **State transition conflict**: an appeal against the *generic* suspension runs through the normal path and
   must not force disclosure of the underlying CSAM case — the appeal can succeed (reinstate) or fail without
   ever exposing the real reason.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) (crisis) | [24.02 Enforcement](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | **Deliberately and emphatically rejected — the rejection is the feature.** A self-harm disclosure must never reach the enforcement machine: no sanction, no strike, no SoR, no appeal. Every step of that pipeline is defensible alone and the composite is monstrous, and it is the specific failure that has burned platform after platform in public. Recorded here and in 24.06's CX so nobody wires it up later for consistency's sake. |
| R-02 | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | [24.04 Transaction Disputes](./24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-index.md) | No shared state, no trigger chain, incompatible lifecycles. A welfare escalation has no transaction, no counterparty, no remedy set and no money. Considered because a gear pickup that goes wrong is *also* a transaction — but a robbery is not a dispute, and routing it through claims would offer a refund to someone who was assaulted. |
| R-03 | [24.08 Illegal Content](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) (TVEC) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | Considered scoring users for extremism risk. Rejected: the available signals (genre, label, imagery, iconography) are **genre proxies**; a model built on them flags black metal, industrial, punk, drill and war-themed folk indiscriminately — 24.01.02 DT-01 in its most defamatory context. The art-vs-advocacy call is a written policy judgment, not a score, and an "extremism risk score" attached to a musician is an artifact the platform would have to defend in court. |
| R-04 | [24.09 Case Evidence Locker](./24.09-case-evidence-locker.md) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | Considered feeding sealed case outcomes into the risk model as high-quality labels. **Partially deferred rather than fully rejected** — CX-04 does want dispute outcomes as labels. What is rejected is the *locker as the channel*: adjudication outcomes carry adjudication error, and piping them straight into automated enforcement launders a human mistake into a model feature that produces more of them. The label path must be explicit, auditable, and reversible when an appeal succeeds. |
| R-05 | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | Considered because takedown-as-harassment is real — a claimant repeatedly claiming an artist's own work to suppress them is an attack on a person. Rejected as a pair: that abuse is **trusted-flagger misuse**, handled by 24.01.04's accuracy ledger (which Art 22(6) requires anyway), or by 24.06.01 if genuinely targeted at the human. Routing a statutory notice process through a harassment lane would make copyright compliance contingent on a safety judgment. |
| R-06 | [24.07 Identity Abuse](./24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md) | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | The sweep's own pairing ("impersonation/counterfeit control"), rejected. Counterfeit is a claim about an **object**, resolved against a brand register and expert examination; impersonation is a claim about a **person**, resolved against the identity and credit graph. Grouping them would give a fake-Rick-Rubin profile the same path as a fake SM58. They share the word "genuine" and nothing else. |
| R-07 | [24.02 Enforcement](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) (Transparency Reporting 24.02.06) | [24.02.03 Statements of Reasons](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | Considered merging SoR generation with transparency reporting since both read the same decision record. Rejected: **same source record, different legal regime** — Art 17 SoRs have no micro/small carve-out; Art 15(2)/24 transparency does. Merging them would let a carve-out that applies to one leak into the other. They stay separate consumers of one record (an intra-24.02 concern, noted here because the split was a domain-shaping decision, D-05). |

---

## Cross-Cuts Routed OUT of this Domain

> Recorded here for the global CX file. Each is a **mechanism serving many domains**, not a thing in this
> domain — the Node Classification Gate's third test.

| Mechanism | Serves | Why it is a cross-cut, not a domain-24 feature |
|---|---|---|
| **Block, Mute & Contact Restriction Enforcement** *(NEW — Deep Think)* | community-networking, messaging (cross-cut), gear-marketplace, digital-goods-marketplace, services-marketplace, fanbase-direct-to-fan, ticketing-box-office, live-booking-settlement, venues-studios-spaces, identity-profiles-organizations | A block that only stops messages is not a block. The restricted party can still buy the target's listed amp (a pickup obligation at their home), book their studio, buy a ticket to their gig, or apply to their casting call. **The check must run at every call site — structurally identical to the `Roles, Permissions & Delegated Authority` cross-cut**, needing an expression generic RBAC cannot produce: a *negative* permission scoped to a pair of actors ("these two, never"). Trust owns the policy and adjudication ([24.06.01](./24.06-personal-safety-threat-response/24.06.01-harassment-stalking-doxxing.md)); enforcement serves everyone. Propagation failure is silent and dangerous — the target believes they are protected. |
| **Off-Platform Leakage / Disintermediation Detection** | gear-marketplace, services-marketplace, venues-studios-spaces, live-booking-settlement, education-lessons-mentorship, digital-goods-marketplace | Split out of candidate 19. It is a **take-rate concern wearing a safety costume**; the `Messaging & Conversations` cross-cut already claims off-platform-leakage defence. Same classifier, different owner, different escalation — conflating them would let a revenue metric drive a safety intervention. Only the safety half (scam, phishing) stayed as [24.01.05](./24.01-reporting-moderation/24.01.05-messaging-safety-scam-filtering.md). |
| **Operator Console Shell** | trust-safety-disputes, and every domain with a queue | Candidate 26's shell half. The `Admin Backoffice & Support Console` cross-cut lists `trust-safety-disputes` first in its serves list and already claims queues, PII masking, justified break-glass and admin-action audit. Domain 24 owns the queue's **routing logic, SLA model, reviewer QA and exposure controls** ([24.01.03](./24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md)); it must not build a second shell. |

## Not-Product Halves Stripped

> Routed to `/create-prd`. Each is the **infrastructure half** of a candidate whose product half was retained.

| Stripped half | From | Routed to | Why |
|---|---|---|---|
| **Audio fingerprinting engine, reference DB & vendor selection** | cand. 17 → product half is [24.05.02](./24.05-copyright-authenticity-enforcement/24.05.02-audio-fingerprinting-content-matching.md) | `/create-prd-stack` + `/create-prd-architecture` | Heavy DSP against a large reference database. **Does not fit the Cloudflare Workers execution model** — the same conflict `Media Handling` flags for transcode. Vendor selection (Audible Magic / Pex / ACRCloud) is an architecture decision with real cost. |
| **CSAM hash-set access & NCMEC pipeline integration** | cand. 22 → product half is [24.08.01](./24.08-illegal-content-legal-process/24.08.01-csam-detection-preservation-reporting.md) | `/create-prd-security` + `/create-prd-stack` | Access to industry hash sets is a **vetted vendor relationship with strict handling rules**, not an API signup. May gate the launch of image upload entirely. |
| **Credential architecture: MFA, session, device binding, recovery mechanics** | cand. 08 → product half is [24.03.02](./24.03-fraud-risk-operations/24.03.02-ato-ban-evasion-ring-detection.md) and [24.07.02](./24.07-identity-abuse-ownership-disputes/24.07.02-entity-ownership-account-recovery-disputes.md) | `/create-prd-security` | Trust owns **detection and contested recovery**; architecture owns the credential and the forgot-password flow. |
| **Data retention schedules & legal-hold machinery** | cands. 22/24 → product half is [24.08.03](./24.08-illegal-content-legal-process/24.08.03-law-enforcement-legal-process-portal.md) and [24.09](./24.09-case-evidence-locker.md) | `/create-prd-security` | Trust owns the **decision** to place a hold; the machinery that enforces it across every store is architecture — and `Privacy` already flags the erasure-vs-retention collision as an architecture-time decision. |

---

## Inbound Adjudication Load

> Case classes **owned elsewhere but adjudicated here**. The deciding semantics stay with the source domain;
> the reviewer time, the SLA and the appeal path land on this domain's machinery. Recorded so capacity
> planning sees the load rather than discovering it.

| Case class | Source | What domain 24 absorbs | Budget status |
|---|---|---|---|
| **Contested evidence-based lift objection** | [02.01.05](../02-credits-attribution/02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md) D-19/D-20/D-21/D-22 → [02.05](../02-credits-attribution/02.05-credit-dispute-resolution.md) D-07, riding the `Dispute Case Engine` cross-cut (serves 02, 05, 09, 13, 14, 17, 19, 24) | Human adjudication **per objection**, under a **mandatory resolution SLA** — the credit stays embargoed at the status quo while contested, so an embargoed status quo plus an unbounded resolver is a de facto Producer veto, the outcome the axis was decided to avoid. Plus the appeal path, and the serial-objector pattern: re-submission of evidence after an objection is deliberately **uncapped** (no cap, no cooldown, no escalation counter), so a repeat objector must keep losing on the merits *here* rather than being stopped by a counting rule nobody sourced | **Unbudgeted.** No current 24 spec allocates per-objection reviewer capacity for this class. It is **not** general-queue load — it never enters the moderation queue, so CX-06's carve-out holds — but it is reviewer time on the same unrotatable one-person team ([index](./trust-safety-disputes-index.md) Q-06, Q-07). The SLA *value* is deferred, not the requirement: `02.01.05` Q-06 — Owner: User, `/create-prd` |

**What the adjudicator is and is not asked.** The question is a **predicate check on a closed ground list**
(`02.01.05` D-19): (i) the evidence identifies a different recording; (ii) the URL/identifier is not publicly
reachable; (iii) other — free text. It is never a factual argument about who contributed what; that is
`02.05`'s ordinary credit dispute, and `02.05` D-07 keeps the two case classes distinct precisely so a
predicate check is not run as a contribution argument. Inline platform re-verification runs first, *outside*
this domain, and reaches a human only when it fails to settle the stated ground — grounds (i)/(ii) give the
re-check something the first automated pass did not have. A ground-(iii) objection has nothing for the
re-check to check, so it is logged, shown and routed straight to a human here: **never auto-handled, never
auto-resolved**.

**A known gap arrives with the load.** A recording that is publicly reachable but **unauthorised** (a leak or
bootleg) has no ground on the closed list — no source in the corpus defines an authorised-vs-unauthorised
predicate, and inventing one would make domain 12 the authority for what counts as an authorised release.
Such an objection can only be filed under ground (iii), which lands on a domain-24 human **with no defined
test to apply**. Recorded as an accepted gap, not an oversight: `02.01.05` Q-07 — Owner: User, `/create-prd`.

**Reading the embargoed record.** The adjudicator is not a session participant and must still read the
credit under `02.01.05` D-18's logged, non-publishing, case-scoped grant — the same shape as CX-02's
case-scoped, read-only locker access: a privileged read that never publishes.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-05|D-05]]
