# Trust, Safety & Disputes — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Trust, Safety & Disputes](./trust-safety-disputes-index.md)
> **Status**: [BREADTH] — 9 children classified; intra-domain cross-cuts mapped 2026-07-16
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | The domain's spine: intake → decision → sanction + statement of reasons → appeal → reversal back into the queue. Every other child feeds this pipe | Musician, Producer, Operator, Fan | High | DSA Art 16 starts a clock at intake; Art 17 requires the SoR to ship with the restriction. The two halves are one statutory transaction |
| CX-02 | [24.09 Case Evidence Locker](./24.09-case-evidence-locker.md) | 24.01, 24.02, 24.04, 24.05, 24.07, 24.08 (all adjudication children) | The shared spine: every adjudication surface reads the same case-scoped bundle of snapshots. **This is why 24.09 sits at domain level** | Musician, Producer, Operator, Fan (read-only, own case) | High | Three sub-domains derived the capture-at-source principle independently — 24.03.03 DT-02, 24.04.01 DT-02, 24.04.04 DT-01 |
| CX-03 | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | Detection **proposes**; only enforcement disposes. A risk engine with sanctioning power is one that bans your best customer at 3am with no reasons and no appeal | Musician, Producer, Operator, Fan | High | 24.03 D-02; Art 17 requires the automated-means flag, so an automated sanction must still produce a truthful structured SoR |
| CX-04 | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | [24.04 Transaction Disputes & Protection](./24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-index.md) | Bidirectional: a chargeback is both a fraud signal and a dispute; dispute outcomes are the only labelled data the fraud engine will ever get | Musician, Operator (as sellers) | High | 24.03 CX-04: at cold start there are no labels, and human adjudications are the sole source |
| CX-05 | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | **Two ladders, one engine, opposite virtues.** The general ladder rewards discretion; the 512(i) repeat-infringer ladder punishes it | Musician, Producer | High | BMG v. Cox (~$1B) and UMG v. Grande ($46.7M) were lost by exercising judgment around a written policy — 24.05.01 DT-01 |
| CX-06 | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) | The crisis lane must **bypass** the queue, the classifier and the ladder — structurally, defined in the intake taxonomy | Musician, Fan | High | 24.06.03 DT-01: processing a crisis as content produces a statement of reasons explaining which policy a farewell violated |
| CX-07 | [24.07 Identity Abuse & Ownership](./24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | The domain's boundary line, tested: both touch identity, and they sit on opposite sides. Signals → 24.03; claims → 24.07. A confirmed ATO hands off to a recovery claim | Musician, Producer, Operator | Medium | 24.03 D-01 + 24.07 CX R-01: same words ("someone is using an identity that isn't theirs"), opposite machinery |
| CX-08 | [24.08 Illegal Content & Legal Process](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) | [24.09 Case Evidence Locker](./24.09-case-evidence-locker.md) | A legal hold overrides every other retention clock — including a user's own erasure right. The one place the platform defeats a user's rights by design | Musician, Producer, Operator, Fan (invisibly) | High | The `Privacy` cross-cut names the collision explicitly; 24.09 DT-03 is where it becomes a schema |
| CX-09 | [24.02 Enforcement, Appeals & Policy](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | **One listing gate, two engines.** Prohibited-items (24.02.05) and counterfeit/authenticity (24.05.03) both block a listing and must never give the seller contradictory reasons | Musician, Operator (as sellers) | Medium | A vintage guitar can fail CITES *and* be a suspected refin; the seller needs one coherent answer |
| CX-10 | [24.08 Illegal Content & Legal Process](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) | [24.01 Reporting & Moderation](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) | CSAM must **never** enter a general queue — reviewer exposure plus a preservation duty incompatible with ordinary handling | None (all four personas `❌`) | High | 24.08 D-02 + 24.01.03 DT-01; on a one-person team the reviewer is the owner and cannot be rotated |

---

## Cross-Cut Details

### CX-01: Reporting & Moderation ↔ Enforcement, Appeals & Policy

**Relationship**: The domain's spine. A report or a classifier hit becomes a case with a statutory clock;
a reviewer decides against a pinned rule version; a sanction and its Statement of Reasons land atomically;
the subject appeals; a reversal cascades back. Every other sub-domain is a specialised feeder into this
pipe — fraud proposes into it (CX-03), copyright runs a second rigid ladder inside it (CX-05), personal
safety carves a bypass out of it (CX-06).

**Role scoping**:
- **Musician**: reporter, and subject. The sanction may be their income; the SoR's specificity determines
  whether they can appeal or must guess.
- **Producer**: subject with blast radius — a takedown on a shared project mix hits six contributors who
  receive no SoR because none of them were sanctioned (24.02.03 DT-03).
- **Operator**: subject with perishable inventory — reversal on Monday returns a calendar, not the Saturday.
- **Fan**: highest volume, lowest stakes, and the population for whom a rigid ladder is actually right.

**Synthesis questions answered**:
1. **Shared state conflict**: intake owns the case; enforcement owns the sanction. Both reference one
   structured decision record — whose schema is fixed by Art 17's required fields, which is why it must
   exist before the first sanction rather than after the first regulator.
2. **Trigger chain**: report → dedup → route → review → decide → sanction + SoR (atomic) → appeal window.
   **If SoR emission fails, the sanction rolls back** — a restriction with no notice is precisely the
   failure Art 17 exists to prevent. If routing fails, the case lands in a dead-letter queue that is itself
   SLA'd; a lost report is a statutory breach, not a dropped job.
3. **Permission intersection**: reporting requires no permission; acting on it requires operator scope.
   That asymmetry is the whole design. For an *entity* subject, which member may appeal is a domain 01
   mandate question this domain cannot answer alone.
4. **Notification fan-out**: reporter (receipt, then outcome), subject (SoR), and any counterparty whose
   transaction evaporated. Collateral victims of a takedown on a shared artifact receive nothing — legal,
   arguably wrong (24.02.03 Q-02).
5. **State transition conflict**: a subject can appeal while a second independent sanction lands. Enforcement
   state is a state machine, not a set of flags, and reversing one must not reverse the other.

### CX-02: Case Evidence Locker ↔ all adjudication children

**Relationship**: One bundle, six consumers. The locker snapshots what was capturable **at the moment of
the event** — the listing photo as it was, the mix as delivered, the thread as it stood — and every
adjudication surface reads it: a moderation appeal, a claim, a chargeback representment, a DMCA
counter-notice, an ownership dispute, a law-enforcement production.

This is the product's thesis (D-18) applied to its own machinery, and the reason it sits at domain level is
empirical: **three sub-domains derived it independently, from three different directions** — returns
(24.03.03 DT-02), claims (24.04.01 DT-02), chargebacks (24.04.04 DT-01). Three independent derivations is
the signal that a principle belongs one level up.

**Role scoping**:
- **Musician / Producer / Operator / Fan**: read-only, own case only. **None may write** — evidence is
  written by the system at the event, never by a party at the dispute. That will occasionally feel unfair
  to someone who genuinely forgot to photograph the amp, and it is the correct answer anyway.
- **Producer's bundle is the richest** (brief, revisions, approvals, session provenance) and **Operator's
  the thinnest** (a booking has no delivery signature), which is exactly why their chargebacks are the
  hardest to defend.

**Synthesis questions answered**:
1. **Shared state conflict**: the locker owns bundles; it owns none of the sources. It reads the `Audit Log`
   cross-cut, the `Messaging` cross-cut, and the domain schemas of 13/17/07. **Its cost lands on those
   domains, not on 24** — every snapshot is storage and every capture is friction on a user who wants to be
   done (24.09 Q-01).
2. **Trigger chain**: event → snapshot (byproduct) → (later) case → assemble → seal. **A missing snapshot
   cannot be recovered**, so the failure happens weeks before anyone notices it.
3. **Permission intersection**: case-scoped. A party sees their own case and nothing else; a leak finding
   (24.05.04) names a collaborator and is an accusation the chain of custody has to be able to defend.
4. **Notification fan-out**: none — the locker notifies nobody. It is read, not pushed.
5. **State transition conflict**: **the retention clocks are the conflict.** CSAM preservation, chargeback
   windows, tax retention, open disputes, legal holds and GDPR erasure impose contradictory requirements on
   one bundle. Legal hold wins (CX-08); the `Privacy` cross-cut's anonymise-and-retain is the reconciling
   rule, and it is far cheaper to decide now than under a live DSAR clock.

### CX-05: Copyright & Authenticity ↔ Enforcement, Appeals & Policy

**Relationship**: The domain's sharpest internal contradiction, and it must be designed in rather than
discovered. **The general enforcement ladder rewards discretion**: a first-time Fan who posted an insult is
not a repeat offender, proportionality is a virtue, and a good reviewer exercises judgment. **The DMCA
repeat-infringer ladder punishes discretion**: 512(i) conditions safe harbour on a policy that is
*reasonably implemented*, and Cox and Grande both lost — ~$1B and $46.7M — because they had a written policy
and exercised judgment around it. Courts read that judgment as non-implementation.

So one engine must host one discretionary ladder and one rigid, automatic, auditable counter, and the rigid
one must be un-softenable *by design* so that no human can later be shown to have intervened.

**Role scoping**:
- **Musician**: subject of both ladders, and the persona for whom the rigid one is most dangerous — a
  bad-faith bulk claimant can ratchet strikes against them, and the ladder cannot exercise mercy.
- **Producer**: highest exposure — their working uploads are the masters labels control (24.05.02 DT-01).
- **Operator / Fan**: low volume on the rigid ladder; ordinary subjects of the general one.

**Synthesis questions answered**:
1. **Shared state conflict**: one sanction record, two counters. The strike counter must be a separate,
   auditable field — not an inference over the general sanction history, which is mutable by discretion.
2. **Trigger chain**: complete notice → removal → strike increment (automatic) → threshold → termination.
   A reversed strike **must decrement** (24.02.02), or the ratchet punishes people for the platform's own
   errors. An **incomplete notice must not increment** (24.05.01 D-02), or bulk malformed submissions drive
   the rigid ladder.
3. **Permission intersection**: none, and that is the point — nobody has permission to soften the counter.
4. **Notification fan-out**: subject gets the SoR and, critically, the **strike count and the next rung
   stated in advance** — a rigid ladder that surprises you is a rigid ladder nobody could act on.
5. **State transition conflict**: **termination meets D-03.** The rigid ladder says terminate; the property
   constraint says the banned bassist's 20% share and the band's chain of title survive. Both are absolute,
   and they resolve only because the sanction acts on *access*, never on the *record*.

### CX-06: Personal Safety ↔ Reporting & Moderation

**Relationship**: A carve-out, defined at intake. Three reason families leave the general queue before any
classifier touches them: CSAM (→ 24.08.01, preservation duty), factual rights disputes (→ domains 02/09,
wrong remedy), and **self-harm (→ 24.06.03, no sanction ever)**. The third is the one that must be
structural rather than conventional.

**Role scoping**:
- **Musician**: both subject and reporter — music's occupational profile carries documented elevated risk.
- **Fan**: brings the volume, and per D-13 includes minors, which is a different duty entirely.
- **Producer / Operator**: reporters, from the rooms where they see people at their worst.

**Synthesis questions answered**:
1. **Shared state conflict**: none — and the *absence* of a record is the design. A crisis leaves no
   sanction, no strike, no SoR, no case against the person.
2. **Trigger chain**: report → **bypass everything** → localised resources to the subject, resources to the
   reporter. The bypass rule lives in 24.01.01's taxonomy, is nearly free to add on day one, and is
   impossible to bolt on once the queue is the only path.
3. **Permission intersection**: none.
4. **Notification fan-out**: subject (quietly, no accusation, no case number) and reporter (who is not fine).
5. **State transition conflict**: content that is *both* a crisis disclosure and a policy violation. **The
   crisis lane wins** — do not sanction a person in crisis for how they expressed it.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) (crisis) | [24.02 Enforcement](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | **Deliberately and emphatically rejected — the rejection is the feature.** A self-harm disclosure must never reach the enforcement machine: no sanction, no strike, no SoR, no appeal. Every step of that pipeline is defensible alone and the composite is monstrous, and it is the specific failure that has burned platform after platform in public. Recorded at domain level, and again in 24.06's CX, specifically so nobody wires it up later for consistency's sake. |
| R-02 | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | [24.04 Transaction Disputes](./24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-index.md) | No shared state, no trigger chain, incompatible lifecycles. A welfare escalation has no transaction, no counterparty, no remedy set and no money. Considered because a gear pickup that goes wrong is *also* a transaction — but a robbery is not a dispute, and routing it through claims would offer a refund to someone who was assaulted. |
| R-03 | [24.08 Illegal Content](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) (TVEC) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | Considered scoring users for extremism risk. Rejected: the available signals (genre, label, imagery, iconography) are **genre proxies**, and a model built on them flags black metal, industrial, punk, drill and war-themed folk indiscriminately — 24.01.02 DT-01 arriving in the most defamatory possible context. The art-vs-advocacy call is a written policy judgment, not a score, and a "extremism risk score" attached to a musician is an artifact the platform would have to defend in court. |
| R-04 | [24.09 Case Evidence Locker](./24.09-case-evidence-locker.md) | [24.03 Fraud & Risk Operations](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | Considered feeding sealed case outcomes into the risk model as high-quality labels. **Partially deferred rather than fully rejected** — 24.03 CX-04 does want dispute outcomes as labels. What is rejected is the locker as the *channel*: adjudication outcomes carry adjudication error, and piping them straight into automated enforcement launders a human mistake into a model feature that then produces more of them. The label path must be explicit, auditable, and reversible when an appeal succeeds. |
| R-05 | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | [24.06 Personal Safety](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | Considered because takedown-as-harassment is real — a claimant repeatedly claiming an artist's own work to suppress them is an attack on a person, not on a file. Rejected as a pair: that abuse is **trusted-flagger misuse** and is handled by 24.01.04's accuracy ledger (which Art 22(6) requires anyway), or by 24.06.01 if it is genuinely targeted at the human. Routing a statutory notice process through a harassment lane would make the platform's copyright compliance contingent on a safety judgment. |
| R-06 | [24.07 Identity Abuse](./24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md) | [24.05 Copyright & Authenticity](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | The sweep's own pairing ("impersonation/counterfeit control"), rejected. Counterfeit is a claim about an **object**, resolved against a brand register and expert examination; impersonation is a claim about a **person**, resolved against the identity and credit graph. Grouping them would give a fake-Rick-Rubin profile the same adjudication path as a fake SM58. They share the word "genuine" and nothing else. |

---

## Cross-Cuts Routed OUT of this Domain

> Recorded here for the global CX file. Each is a **mechanism serving many domains**, not a thing in this
> domain — the Node Classification Gate's third test.

| Mechanism | Serves | Why it is a cross-cut, not a domain-24 feature |
|---|---|---|
| **Block, Mute & Contact Restriction Enforcement** *(NEW — Deep Think)* | community-networking, messaging (cross-cut), gear-marketplace, digital-goods-marketplace, services-marketplace, fanbase-direct-to-fan, ticketing-box-office, live-booking-settlement, venues-studios-spaces, identity-profiles-organizations | A block that only stops messages is not a block. The restricted party can still buy the target's listed amp (creating a pickup obligation at their home), book their studio, buy a ticket to their gig, or apply to their casting call. **The check must run at every call site — structurally identical to the `Roles, Permissions & Delegated Authority` cross-cut**, and needing an expression generic RBAC cannot produce: a *negative* permission scoped to a pair of actors ("these two, never"). Trust owns the policy and the adjudication ([24.06.01](./24.06-personal-safety-threat-response/24.06.01-harassment-stalking-doxxing.md)); the enforcement serves everyone. Propagation failure is silent and dangerous — the target believes they are protected. |
| **Off-Platform Leakage / Disintermediation Detection** | gear-marketplace, services-marketplace, venues-studios-spaces, live-booking-settlement, education-lessons-mentorship, digital-goods-marketplace | Split out of candidate 19 ("Messaging Safety, Scam Filtering & Disintermediation Detection"). It is a **take-rate concern wearing a safety costume**, and the `Messaging & Contextual Inbox` cross-cut already claims it explicitly: "the primary defence against off-platform leakage, the existential threat to take rate." Same classifier, different owner, different escalation — and conflating them would let a revenue metric drive a safety intervention. Only the safety half (scam, phishing) stayed as [24.01.05](./24.01-reporting-moderation/24.01.05-messaging-safety-scam-filtering.md). |
| **Operator Console Shell** | trust-safety-disputes, and every domain with a queue | Candidate 26's shell half. The `Admin, Back-Office & Support` cross-cut already lists `trust-safety-disputes` **first** in its serves list and already claims queues, PII masking, justified break-glass and admin-action audit. Domain 24 owns the queue's **routing logic, SLA model, reviewer QA and exposure controls** ([24.01.03](./24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md)); it must not build a second shell. |

## Not-Product Halves Stripped

> Routed to `/create-prd`. Each is the **infrastructure half** of a candidate whose product half was retained.

| Stripped half | From | Routed to | Why |
|---|---|---|---|
| **Audio fingerprinting engine, reference DB & vendor selection** | cand. 17 → product half is [24.05.02](./24.05-copyright-authenticity-enforcement/24.05.02-audio-fingerprinting-content-matching.md) | `/create-prd-stack` + `/create-prd-architecture` | Heavy DSP against a large reference database. **Does not fit the Cloudflare Workers execution model** — the identical conflict the `Media Handling` cross-cut already flags for transcode. Vendor selection (Audible Magic / Pex / ACRCloud) is an architecture decision with real cost. |
| **CSAM hash-set access & NCMEC pipeline integration** | cand. 22 → product half is [24.08.01](./24.08-illegal-content-legal-process/24.08.01-csam-detection-preservation-reporting.md) | `/create-prd-security` + `/create-prd-stack` | Access to industry hash sets is a **vetted vendor relationship with strict handling rules**, not an API signup. May gate the launch of image upload entirely. |
| **Credential architecture: MFA, session, device binding, recovery mechanics** | cand. 08 → product half is [24.03.02](./24.03-fraud-risk-operations/24.03.02-ato-ban-evasion-ring-detection.md) and [24.07.02](./24.07-identity-abuse-ownership-disputes/24.07.02-entity-ownership-account-recovery-disputes.md) | `/create-prd-security` | Already routed by the domain map as "Authentication, Session & Account Recovery Architecture". Trust owns **detection and contested recovery**; architecture owns the credential and the forgot-password flow. |
| **Data retention schedules & legal-hold machinery** | cands. 22/24 → product half is [24.08.03](./24.08-illegal-content-legal-process/24.08.03-law-enforcement-legal-process-portal.md) and [24.09](./24.09-case-evidence-locker.md) | `/create-prd-security` | Already routed by the domain map. Trust owns the **decision** to place a hold; the machinery that enforces it across every store is architecture — and the `Privacy` cross-cut already flags the erasure-vs-retention collision as an architecture-time decision. |
