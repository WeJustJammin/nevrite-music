# Rights & Ownership — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Rights & Ownership](./rights-ownership-index.md)
> **Status**: [BREADTH] — 6 sub-domains classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [09.02 Split Capture](./09.02-split-capture-agreements/) | [09.01 Rights Registry](./09.01-rights-registry/) | Capture is the **only write path** into the registry that produces a consented ledger. Everything else in the domain reads, transfers, defends, or publishes what capture created. | Musician, Producer | High | D-18: provenance is the wedge, and capture-at-source is its sole mechanism. |
| CX-02 | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | [09.01 Rights Registry](./09.01-rights-registry/) | The chain explains **how** the registry's current rows came to be; the registry states **what** they are now. A divergence means the platform's own records name different owners. | Musician | High | Registry state is derivable from chain events; the chain is the audit of the registry. |
| CX-03 | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | [09.01 Rights Registry](./09.01-rights-registry/) | A conflict is **about** a ledger; a resolution **corrects** one. Disputes never produce their own truth — they route back as a consented amendment. | Musician, Producer | High | [09.04 D-01](./09.04-rights-conflicts-disputes/09.04-rights-conflicts-disputes-index.md): the remedy is a corrected ledger, not a refund. |
| CX-04 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.01 Rights Registry](./09.01-rights-registry/) | Training consent is **anchored** to the ownership ledger — a grant means something only if made by people who demonstrably hold the right. This is 09.05's entire justification for living inside domain 09. | Musician | High | [09.05 D-01](./09.05-ai-voice-likeness-consent/09.05-ai-voice-likeness-consent-index.md): standalone registries collect assertions from unverified parties. |
| CX-05 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.01 Rights Registry](./09.01-rights-registry/) | The lookup reads a **publication-safe projection**, deliberately never the ledger — so privacy is opt-in by construction, not by vigilance. | Musician, Producer, Operator, Fan | High | [09.06.04 D-01](./09.06-rights-evidence-public-record/09.06.04-public-rights-lookup.md) / R-02. |
| CX-06 | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | [09.02 Split Capture](./09.02-split-capture-agreements/) | Resolution is applied as a **consented amendment** ([09.02.04](./09.02-split-capture-agreements/09.02.04-split-amendment-reconsent.md)), never a unilateral write. No admin path into the ledger exists, including for dispute resolution. | Musician, Producer | High | [09.02.04 D-02](./09.02-split-capture-agreements/09.02.04-split-amendment-reconsent.md): an override is the domain's highest-value attack surface. |
| CX-07 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | **Trust level** is defined by the chain and rendered by the lookup — the domain's honesty made visible, including for WeJammin's own imported data. | Musician, Producer, Fan | High | [09.06.04 DT-03](./09.06-rights-evidence-public-record/09.06.04-public-rights-lookup.md): without it, WeJammin is Jaxsta with better fonts. |
| CX-08 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.02 Split Capture](./09.02-split-capture-agreements/) | A work-for-hire buyout **does not** extinguish NIL. The session singer who owns nothing still holds their own voice. | Musician | High | [09.05.02 D-03](./09.05-ai-voice-likeness-consent/09.05.02-voice-name-likeness-rights.md): the fee buys the copyright, not the person. |
| CX-09 | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | A **double assignment** is a chain integrity failure that surfaces as a conflict. The chain detects it; the dispute machinery handles it. | Musician | Medium | [09.04.01](./09.04-rights-conflicts-disputes/09.04.01-conflicting-claim-detection.md): double assignment is a detection class with certain confidence. |
| CX-10 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.02 Split Capture](./09.02-split-capture-agreements/) | Timestamping and capture fire on the **same event** — session close. Both are byproducts of being in the room; neither is a task the user chooses. | Musician, Producer | Medium | Shared trigger: the fixation event produces both the evidence and the ledger. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-level references:** Where a cross-cut spans levels, it is recorded here with a link to the specific lower-level item. The detail of HOW they interact lives in the LOWER-level CX file.

---

## Cross-Cut Details

### CX-01: Split Capture ↔ Rights Registry

**Relationship**: The domain has exactly one front door.
[09.02.01](./09.02-split-capture-agreements/09.02.01-moment-of-creation-split-capture.md) is the only
thing that produces a consented ledger from nothing, and every other sub-domain operates on its output:
09.01 stores and validates it, 09.03 transfers it, 09.04 defends it, 09.05 anchors consent to it, 09.06
publishes it. This is why 09.02 carries the domain's Must proposals almost exclusively — not because it
is the most interesting, but because everything else is downstream of it existing.

The corollary is uncomfortable and worth stating plainly: **if capture does not reach the room, the whole
domain is an empty database with excellent architecture.** That makes
[09.02 Q-02](./09.02-split-capture-agreements/09.02-split-capture-agreements-index.md) — the DAW-vs-browser
surface question — a domain-level risk, not a feature detail.

**Role scoping**:
- **Musician**: Consents; the party whose rights exist or do not exist depending on whether this fires.
- **Producer**: The capture point. The domain's success is materially a function of this persona's behaviour.
- **Operator**: Not a party, except via a studio-held work-for-hire.
- **Fan**: No visibility, ever.

**Synthesis questions answered**:
1. **Shared state conflict**: The registry owns the ledger; capture proposes it. Capture cannot write a consented state unilaterally — consent comes from the parties, not from the flow.
2. **Trigger chain**: Session close ([domain 07](../07-music-projects-collaboration/)) → capture → consented ledger → everything downstream unlocks. If capture is skipped, the recording is permanently badged and release-blocked ([domain 12](../12-release-distribution/)) — consequence, not obstruction ([09.02.01 D-01](./09.02-split-capture-agreements/09.02.01-moment-of-creation-split-capture.md)).
3. **Permission intersection**: Write access to a recording does **not** confer the right to allocate its shares. The Producer drives the flow and holds no authority over anyone's percentage.
4. **Notification fan-out**: To every named party, including invited non-users via signed link. Also to [domain 02](../02-credits-attribution/) (credits) and [09.01.05](./09.01-rights-registry/09.01.05-performer-neighbouring-rights.md) (performer records) — one prompt, three records.
5. **State transition conflict**: Concurrent edits during `proposed` invalidate in-flight consents; consent must bind to a ledger **version**, not to a ledger.

### CX-02: Chain of Title & Lifecycle ↔ Rights Registry

**Relationship**: Two views of one truth. The registry says *X owns 25% today*; the chain says *how X came
to own 25%, and from whom*. The registry is derivable from the chain — so any divergence is a defect, not
a difference of opinion, and it is the worst defect available here: the platform's two authoritative
records naming different owners of the same right.

The hard cases are the ones where the chain moves with no actor. A **reversion** fires because time passed
([09.03.02](./09.03-chain-of-title-lifecycle/09.03.02-term-territory-reversion.md)); a **termination**
reaches back to unwind a link forged 35 years earlier
([09.03.03](./09.03-chain-of-title-lifecycle/09.03.03-termination-rights-notice-windows.md)). Both must
propagate to the registry atomically.

**Role scoping**:
- **Musician**: Owner. Sees both, and is the party harmed if they disagree.
- **Producer**: Read-only on the chain; a party to it where they hold shares or points.
- **Operator**: Only via a studio entity holding work-for-hire.
- **Fan**: No visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The chain is authoritative for history; the registry for current state. Neither wins a disagreement — a disagreement is an incident.
2. **Trigger chain**: Chain event → registry update, **atomically**. A reversion that appends to the chain but fails to update ownership leaves the platform confidently naming the wrong owner.
3. **Permission intersection**: Nobody can suppress a chain event, including the parties it disadvantages. A grantee cannot veto a reversion.
4. **Notification fan-out**: Affected parties, plus [domain 10](../10-royalties-collections/) (payee changes) and [domain 12](../12-release-distribution/) (distribution rights).
5. **State transition conflict**: An event landing mid-royalty-run splits the period. Distribution binds to state at run start — the same version-binding discipline as [09.02.04 CX-03](./09.02-split-capture-agreements/09.02-split-capture-agreements-cx.md).

### CX-04: AI, Voice & Likeness ↔ Rights Registry

**Relationship**: [09.05](./09.05-ai-voice-likeness-consent/) exists inside domain 09 for exactly one
reason: consent granted here is **anchored** to a consented ownership ledger. Every standalone AI-consent
registry has the same defect — it collects assertions from parties whose authority to grant is unverified.
A lead singer opting in a master owned half by a label has recorded a preference, not a permission.

Anchoring means a training grant requires **all owners of the right**
([09.05 D-02](./09.05-ai-voice-likeness-consent/09.05-ai-voice-likeness-consent-index.md)) — which makes
WeJammin's consent slower and less complete than a competitor's, and is the only thing that makes it mean
anything.

The asymmetry that matters: **NIL is not anchored to the ledger at all**
([09.05.02](./09.05-ai-voice-likeness-consent/09.05.02-voice-name-likeness-rights.md)). A voice attaches
to a person, not to property, so master ownership confers zero NIL authority. The registry anchors what is
owned; it must never be allowed to anchor what is not ownable.

**Role scoping**:
- **Musician**: Owner (training consent) and person (NIL). A WFH session singer is the second without the first.
- **Producer**: Config — surfaces both questions at capture, holds neither.
- **Operator**: No stake.
- **Fan**: No consent visibility; sees only AI disclosure ([09.05.03](./09.05-ai-voice-likeness-consent/09.05.03-ai-generated-content-disclosure.md)).

**Synthesis questions answered**:
1. **Shared state conflict**: The ledger anchors training consent. NIL is a separate record on a person and cannot be written by ledger parties.
2. **Trigger chain**: Training request → resolve ledger consent (all owners) → resolve NIL (the performer) → either missing, refused. No partial grants.
3. **Permission intersection**: Master ownership confers **zero** NIL authority — the load-bearing rule of 09.05.
4. **Notification fan-out**: A training request notifies all owners **and** every identified performer, including those who own nothing and would otherwise never hear about it.
5. **State transition conflict**: A master sold mid-request moves the ownership question to the buyer; the NIL grant does not move at all. Rights that travel and rights that do not, diverging in real time.

> CX-03, CX-05, CX-06, CX-07 and CX-08 are High-confidence entries whose full synthesis questions are
> answered in their respective sub-domain CX files (linked in the map above). CX-09 and CX-10 are Medium
> confidence and deferred to `/ideate-discover` Step 5, per the CX gate.

---

## Cross-Cut Mechanisms (routed OUT of this domain)

> Candidates and concepts that turned out to be mechanisms serving many domains. **No nodes were created
> for these.** Recorded here so the global CX file (`ideation-cx.md`) can absorb them.

| Mechanism | Serves | Why it is not a node here |
|---|---|---|
| **E-Signature & Consent Capture** | 05, 06, 09, 11, 13, 14, 16, 17 | Sweep candidate 02 was "Moment-of-Creation Split Agreement **& E-Signature**". Signing serves service contracts, lesson terms, licences, marketplace terms, venue agreements and split sheets alike. The **split sheet** is domain-owned; the **pen** is not. |
| **Work/Recording Duality (as a data axiom)** | 02, 07, 09, 10, 11, 12, 22 | The domain index calls it "an axiom every other domain must inherit" — which is the definition of a cross-cut. The *product surface* (creating, linking, viewing) stays as [09.01.01](./09.01-rights-registry/09.01.01-work-recording-duality.md); the axiom is global. |
| **Dispute Case Machinery** | 05, 09, 13, 14, 17, 19, 24 | Cases, evidence submission, arbitration workflow, resolution. Domain 24 owns the courtroom. Domain 09 owns the **cause of action** (competing claims over one right) and the **remedy** (a corrected ledger, not a refund) — [09.04 D-01](./09.04-rights-conflicts-disputes/09.04-rights-conflicts-disputes-index.md). |
| **Territory Model** | 09, 10, 11, 12, 19 | Territory is a **dimension of the ownership model**, not an attribute of a grant ([09.03.02 D-01](./09.03-chain-of-title-lifecycle/09.03.02-term-territory-reversion.md)). Term, reversion, public domain, moral rights, licensing scope and distribution all vary by territory — and differently from each other. The highest-leverage schema decision touching this domain. |
| **Consent Chase & Escalating Notification** | 02, 05, 09, 11, 17 | "Waiting on 3 of 4" with decaying, escalating reminders appears identically in split capture, credit confirmation, licence counter-signature and booking confirmation. One mechanism, many domains. |

---

## Not-Product (routed to `/create-prd`)

> Architecture and NFR concerns discovered while drilling this domain. **No nodes created.**

| Concern | Route to | Why |
|---|---|---|
| **Blockchain / DLT for the rights ledger** | `/create-prd-architecture` | Rejected as product with prejudice ([09.03.01 DT-01](./09.03-chain-of-title-lifecycle/09.03.01-chain-of-title-ledger.md)). The oracle problem is fatal: a chain proves a claim was recorded and unaltered, never that it was **true**. An immutable false statement is worse than a mutable database, because immutability now obstructs the fix. What makes WeJammin's chain trustworthy is multi-party consent at establishment — being in the room, not being on a chain. |
| **External timestamp anchoring** (RFC 3161 TSA / Merkle publication) | `/create-prd-architecture` | The one place cryptographic anchoring **does** earn its keep ([09.06.02 DT-03](./09.06-rights-evidence-public-record/09.06.02-proof-of-creation-timestamping.md)). "This hash existed by this date" is a statement about the record itself — exactly what tamper-evidence establishes. **Anchor the timestamp; do not anchor the ownership.** |
| **Escrow as regulated fund-holding** | `/create-prd-stack`, `/create-prd-security` | [09.04.03 DT-02](./09.04-rights-conflicts-disputes/09.04.03-rights-freeze-royalty-escrow.md): holding third-party funds pending a dispute is a regulated activity. The rights half (which share, contested by whom) is domain-owned; the money-transmission half is not. This is where a records domain quietly implies a payments-licensing requirement — it activates the KYC/AML and payments items already `[PENDING]` in `meta/constraints.md`. |
| **Exact rational share representation** | `/create-prd-architecture` | [09.01.02 DT-01](./09.01-rights-registry/09.01.02-ownership-ledger-validation.md): three co-writers is the most common configuration in music and is exactly what decimals cannot represent. 33.33 × 3 = 99.99 either fails validation forever or loses a hundredth of every royalty, compounding across a catalogue. Trivial now, unfixable after a million rows. |
| **Immutable append-only event storage with supersession** | `/create-prd-architecture` | Chain of title, timestamps and ledger versions all require append-only semantics. The *product* is the history; the *storage mechanism* is architecture. |
| **PII isolation for rights parties** | `/create-prd-security` | Legal names, addresses, tax IDs. Interacts with GDPR erasure vs. the permanence of consent as a legal fact ([09.01.02 Q-03](./09.01-rights-registry/09.01.02-ownership-ledger-validation.md)) — the consent must survive; the personal data must not. |
| **DDEX RIN / CWR message-format compliance** | `/create-prd` (integration architecture) | Industry interchange formats for session metadata and work registration. The *format compliance* is an integration contract; the *product* (export your splits to a society) belongs to [domain 10](../10-royalties-collections/). |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | Superficially strong — both concern rights that persist through transfers (moral rights; NIL). But NIL **never entered** the chain, so it cannot fail to travel through it: it was never a link. Moral rights are the chain's business precisely because they *are* a carve-out from a transfer that happened; NIL is a personhood right no transfer ever touched. Coupling them would imply a voice is a thing that could have been assigned and merely was not. |
| R-02 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | Deliberately and firmly rejected. Publishing dispute status would be a **reputational weapon**: "ownership disputed" damages a work's commercial prospects, and a bad-faith actor could inflict that on a rival by asserting a claim they never intend to win. The platform would be supplying the weapon. The lookup shows the last consented state or "not currently confirmed" — never the fight ([09.06.04 D-04](./09.06-rights-evidence-public-record/09.06.04-public-rights-lookup.md)). |
| R-03 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | Tempting: a training-consent registry sounds like it wants a public lookup so AI companies can check permissions at scale. Rejected because it inverts the sub-domain's purpose — a machine-readable public "who has opted out" surface is a **scraping target list**, telling exactly the wrong actors which catalogues are unprotected and which owners are absent. Whether a licensable-corpus surface exists is [09.05 Q-02](./09.05-ai-voice-likeness-consent/09.05-ai-voice-likeness-consent-index.md), and it is a very different product. |
| R-04 | [09.02 Split Capture](./09.02-split-capture-agreements/) | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | Rejected as a *distinct* pair beyond CX-10: the shared session-close trigger is already recorded there. There is no second interaction — capture does not consume identifiers, and registration does not feed capture. |
| R-05 | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | An AI training grant is not a chain-of-title event. It transfers no ownership, creates no encumbrance on title, and does not appear in a title search — it is a revocable permission that leaves the ownership record untouched. Recording grants in the chain would make every consent look like an assignment to anyone reading the history. |
