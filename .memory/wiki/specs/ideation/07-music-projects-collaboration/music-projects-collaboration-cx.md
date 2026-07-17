# Music Projects & Collaboration — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Music Projects & Collaboration](./music-projects-collaboration-index.md)
> **Status**: [BREADTH] — 9 sub-domains classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [07.09 DAW Bridge](./07.09-daw-bridge-capture-at-source/) | [07.06 Sessions](./07.06-sessions-documentation-recall/) · [07.04 Version Control](./07.04-audio-version-control-lineage/) · [07.08 Delivery](./07.08-delivery-readiness-qc/) | **The domain's spine.** The bridge supplies the facts that make the capture prompt pre-fillable, lineage inferable, and source declaration promptable at the moment of use. | Producer | High | Seven features across four sub-domains independently named the bridge as a hard dependency in their own Deep Think. |
| CX-02 | [07.03 Contributors](./07.03-contributors-access-confidentiality/) | [07.06 Sessions](./07.06-sessions-documentation-recall/) | The roster is the **subject list** the capture prompt names. No roster → the prompt has nobody to pre-fill. | Producer, Musician | High | `07.06.02` DT-01 — `07.03.01` is an input to the prompt, not a peer of it. |
| CX-03 | [07.04 Version Control](./07.04-audio-version-control-lineage/) | [07.05 Review & Approval](./07.05-review-feedback-approval/) | Comments and approvals **pin immutable versions**. Immutability is what makes "you approved it" answerable. | Musician, Producer | High | `07.05.04` DT-01 — a free payoff of `07.04.01` D-01. |
| CX-04 | [07.01 Song & Board](./07.01-song-release-production-board/) | [07.06 Sessions](./07.06-sessions-documentation-recall/) | Stage transitions are the **second firing moment** for the capture prompt, after session close. | Producer, Musician | High | `07.01.03` D-02 and `07.06.02` — the board is a trigger surface, not decoration. |
| CX-05 | [07.02 Composition](./07.02-songwriting-composition-workspace/) | [07.04 Version Control](./07.04-audio-version-control-lineage/) | **Chart sections/bars anchor takes and comps** — "take 4 from the second chorus" is how comping is actually discussed. | Producer, Musician | High | `07.02.03` DT-03 and `07.04.03` DT-01, reached independently. Cross-sub-domain, so recorded here per `07.02` R-02. |
| CX-06 | [07.07 Mix & Master](./07.07-mix-master-workflow/) | [07.08 Delivery & QC](./07.08-delivery-readiness-qc/) | The alternate matrix **multiplies** the delivery workload; the recipient spec supplies the QC ruleset. | Producer | High | `07.07.02` CX-02 and `07.08.01` DT-01. |
| CX-07 | [07.08 Delivery & QC](./07.08-delivery-readiness-qc/) | [07.01 Song & Board](./07.01-song-release-production-board/) · [07.06 Sessions](./07.06-sessions-documentation-recall/) | The readiness score is the **debt ledger** for every prompt dismissed at the board and at session close. | Musician, Producer | High | `07.08.03` DT-02 — non-blocking upstream requires honest reckoning at the exit. |
| CX-08 | [07.03 Contributors](./07.03-contributors-access-confidentiality/) | [07.05 Review & Approval](./07.05-review-feedback-approval/) | **The roster fails to describe who decides.** Approvers and link recipients are routinely not on it. | Musician, Producer | High | `07.05.04` DT-03 and `07.05.02` DT-01 — the same gap found twice, independently. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: DAW Bridge ↔ Sessions · Version Control · Delivery

**Relationship**: **The domain's spine, and its single largest risk.** The bridge is not one sub-domain among
nine — it is the mechanism that makes the other eight capture facts rather than request them. Seven features
across four sub-domains independently concluded, in their own Deep Think, that they cannot work without it:

| Feature | Without the bridge |
|---|---|
| `07.04.01` Version Control | Lineage is hand-typed, and wrong within a week |
| `07.06.02` Capture Prompt | A blank form at 1am — dismissed |
| `07.08.04` Source Declaration | A delivery-time question answered "no", honestly and wrongly |
| `07.06.01` Session Record | A calendar form nobody fills in |
| `07.04.03` Take & Comp | Empty — comp maps exist only in the DAW |
| `07.04.05` File Integrity | Checksums only; no missing-media detection |
| `07.06.03` Session Snapshot | A zip with no manifest |

That convergence is evidence, not coincidence. **Without the bridge, domain 07 is a good review-and-versioning
tool that asks people to remember** — which `meta/problem-statement.md` identifies as the exact defect every
competitor already has.

**Role scoping**:
- **Producer**: the only active participant. The bridge exists for them, at one moment, because that moment is where the platform's value is created.
- **Musician**: entirely passive and the primary beneficiary — their credits accrue without them doing anything.
- **Operator**: none.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — the bridge produces facts; the sub-domains own them.
2. **Trigger chain**: bounce → ingest → parse → hints → prompt → credits (02) + splits (09). **Every link degrades independently** and no failure blocks the work: parse failure still yields a version; a dismissed prompt still closes the session.
3. **Permission intersection**: the bridge acts as the producer, with the producer's grants, and must never see more.
4. **Notification fan-out**: the prompt's fan-out is the domain's largest — one close notifies every named party.
5. **State transition conflict**: `07.09.02` DT-02 — a wrong guess confirmed carelessly writes a false credit. The pre-fill and the counter-attestation are a matched pair; neither is safe alone.

### CX-02: Contributors ↔ Sessions

**Relationship**: The roster names the people; the session witnesses them; the prompt confirms them. The roster
is not administrative plumbing — it is the **subject list of the provenance graph**, and it exists so that
`07.06.02` can ask a confirmable question instead of an open one.

**Role scoping**:
- **Producer**: writes the roster, is the primary attestor.
- **Musician**: counter-attests — the half that turns a claim into a verified credit.
- **Operator**: sees the *event* and never the creative facts (`07.06` R-01).
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the roster owns roles; the session owns attendance. **Attendance ≠ contribution** (`07.06.01` D-03) — conflating them would manufacture false credits at scale.
2. **Trigger chain**: roster + attendance → pre-fill → claim → counter-attestation → verified credit.
3. **Permission intersection**: the roster role also derives vault access (`07.03` CX-01), so one field governs both who is credited and who can hear the stems.
4. **Notification fan-out**: large — one close, many attestation requests, each also an invitation (`07.03.02` DT-01).
5. **State transition conflict**: **work happens before acceptance** (`07.03` CX-02). Capture must be able to name a non-user, or the platform loses the exact fact it exists to capture.

### CX-03: Version Control ↔ Review & Approval

**Relationship**: Comments anchor to versions; approvals pin them. Because versions are immutable
(`07.04.01` D-01), "you approved it" is answerable — and the industry's most common low-grade dispute stops
being possible. This is the clearest demonstration in the domain that the version model earns its cost.

**Role scoping**:
- **Musician**: approves — it is their record.
- **Producer**: configures the gates and is protected by them.
- **Operator** / **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — both immutable.
2. **Trigger chain**: approval → round counting stops → stage advances → capture prompt fires (CX-04). **Sign-off feeds provenance**, which is not obvious and is why `07.05` is not merely a review tool.
3. **Permission intersection**: the approver set is independent of the roster (CX-08).
4. **Notification fan-out**: "waiting on you" is what actually unblocks records.
5. **State transition conflict**: backwards stage transitions supersede approvals (`07.01` Q-03) — the domain's most persistent unresolved edge, raised in three sub-domains.

### CX-04: Song & Board ↔ Sessions

**Relationship**: The board's stage transitions are the second capture moment. A song entering `mix` means the
tracking roster is final; entering `master approved` means the split question is now or never. The fixed stage
vocabulary (`07.01.03` D-01) exists **so the system knows which prompt to fire** — which a configurable kanban
could never do, and which is why the board is craft-specific rather than generic.

**Role scoping**:
- **Producer**: moves stages; primary prompt target.
- **Musician**: prompted where they are a listed contributor.
- **Operator** / **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the Song owns `current_stage`; the session owns its own record.
2. **Trigger chain**: transition → prompt → credits. **Never blocking** (`07.01.03` D-02) — a blocked board is an avoided board, and an avoided board captures nothing.
3. **Permission intersection**: producer-or-owner roles may transition.
4. **Notification fan-out**: transitions notify the roster; `master approved` notifies everyone with a split.
5. **State transition conflict**: backwards transitions again (`07.01` Q-03).

### CX-05: Composition ↔ Version Control

**Relationship**: Chart sections and bars are how takes and comps are actually discussed — "take 4 from the
second chorus", "punch in at bar 33". `07.02.03` DT-03 and `07.04.03` DT-01 reached this independently, which is
why it is recorded here rather than inside either sub-domain (`07.02` R-02).

**The consequence is a MoSCoW constraint**: take/comp anchoring must be designed in from the start. A take model
keyed on timecode cannot be re-anchored to musical structure later without re-deriving every take's position. If
`07.02.03` and `07.04.03` land in different buckets, the anchoring may become impossible.

**Role scoping**:
- **Producer**: full at both ends.
- **Musician**: read-only.
- **Operator** / **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the chart owns the section map; takes reference it. Section delete orphans, never destroys (`07.02` CX-02).
2. **Trigger chain**: none automatic — this is structural reference, not a workflow.
3. **Permission intersection**: a Producer can restructure sections while being read-only on lyrics (`07.02` D-02) — precisely why anchoring must be section-relative rather than positional.
4. **Notification fan-out**: none.
5. **State transition conflict**: reordering an arrangement must move lyric attribution and take anchors together, or authorship silently corrupts.

### CX-06: Mix & Master ↔ Delivery & QC

**Relationship**: The alternate matrix multiplies everything downstream — N variants means N masters, N QC runs,
N cells in every package. And the recipient spec (`07.08.01`) is what supplies QC its ruleset (`07.04.04` DT-03:
there is no universal spec, only "does this satisfy the receiver").

**Role scoping**:
- **Producer**: full — carries the multiplied workload.
- **Musician**: config on the matrix, read-only on QC.
- **Operator** / **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none.
2. **Trigger chain**: matrix → mastering scope → package contents → QC ruleset. A variant added late triggers a recall that may be impossible (`07.06.03` DT-01).
3. **Permission intersection**: packages are bounded by the builder's vault grants.
4. **Notification fan-out**: staleness notifications; a late variant request should feel expensive, because it is.
5. **State transition conflict**: primary master re-done → every variant and format master stale. **Lineage is what makes this detectable** rather than discovered by a sync agent in nine months.

### CX-07: Delivery & QC ↔ Song & Board · Sessions

**Relationship**: The domain never blocks — not the board, not the capture prompt, not QC, not stem naming. That
is correct (`07.06.02` DT-02: coercion loses the room) and it would be negligent if the debt evaporated. It does
not: it accrues silently and surfaces at `07.08.03`, **at the exit, when the user wants to ship** — motivated,
and while it is still fixable.

**Non-blocking upstream + honest reckoning at the exit is the domain's core interaction design.** Neither half
works alone: blocking upstream loses the room; no reckoning loses the record.

**Role scoping**:
- **Musician**: full — "can I release this?" is their question.
- **Producer**: full — "can I hand this off?" is theirs.
- **Operator** / **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — readiness is derived.
2. **Trigger chain**: every dismissed prompt → debt → gap list at a chosen target. Gaps link back to the *same pre-filled prompt* they came from.
3. **Permission intersection**: gaps the viewer cannot see render as opaque (`07.08.03` D-05).
4. **Notification fan-out**: "ready to release" is one of the genuinely good notifications; no nagging (`07.08.03` D-03).
5. **State transition conflict**: **does readiness ever hard-block?** The domain's central unresolved tension — `07.08` Q-01. Candidates: DSP release (12) and remix publication (`07.08` CX-05), both external and irreversible.

### CX-08: Contributors ↔ Review & Approval

**Relationship**: **The roster describes who *makes* the record; it does not describe who *decides* it.** Found
twice independently — `07.05.02` DT-01 (the A&R who must hear the mix has no account) and `07.05.04` DT-03 (the
approver set cannot derive from the roster). The label A&R, the manager and the sync client are the people whose
opinion determines the record, and none of them is a contributor.

This is a genuine limit of the roster model and it shapes two features: private links exist because these people
have no accounts, and approval gates are configured independently because these people must sign off.

**Role scoping**:
- **Musician** / **Producer**: send links, configure gates.
- **Operator**: none.
- **Fan**: none — a Fan cannot be a link recipient as a product action, though a link forwarded to one is a real leak (`07.05.02` DT-02).

**Synthesis questions answered**:
1. **Shared state conflict**: none — the approver set is its own object.
2. **Trigger chain**: link → listen → comment → triage → round → approval → stage advance → capture prompt. **The longest chain in the domain**, and it starts with someone who has no account.
3. **Permission intersection**: link recipients carry a weaker identity, which must be visibly weaker everywhere (`07.05.01` D-06).
4. **Notification fan-out**: link comments notify the roster.
5. **State transition conflict**: comment visibility scoping — can the A&R see the band's internal notes? (`07.05.01` Q-03).

---

## Cross-Cut Mechanisms Identified — for the global CX file

> Candidates that turned out to be **mechanisms serving many domains**. No node was created for the first three.

| Mechanism | Serves | Origin |
|---|---|---|
| **Forensic Audio Watermarking & Leak Tracing** | 05, 07, 11, 12, 14 | Sweep candidate 20, demoted (`07.03` D-02). Its product expression is behavior of `07.05.02`, not a node. |
| **Time Tracking, Billable Hours & Invoicing** | 05, 06, 07, 16, 17, 23 | Sweep candidate 32, demoted (`07.08` D-04). A billing engine in a music-projects domain is scope leak; what 07 owns is session attendance. |
| **Data Portability & Account Export** | All 24 | Sweep candidate 33's generic half (`07.08` D-03). Explicitly a values decision — `meta/problem-statement.md` Q-02 ("earned or hostile lock-in"). The music-specific half merged into `07.08.01`. |
| **Audio Playback, Waveform Rendering & Streaming Delivery** | 05, 06, 07, 08, 12, 14, 20 | Identified beneath `07.04.06` and `07.05.01` (`07.04` D-04). The engine is shared; the *comparison* and *review* workflows stay in 07. |
| **Completeness Scoring & Readiness Gating** | 01, 07, 12, 13, 14, 16 | Identified beneath `07.08.03`. The song-specific expression stays; the scoring mechanism is shared. |
| **Real-Time Rooms, Presence & Audio Transport** | 03, 06, 07, 08 | **Already ratified (D-15).** Consumed here by `07.06.01` (presence as attendance). |
| **Notification & Messaging Fan-Out** | All | Consumed throughout. Note `07.09.03` needs **native OS notifications**, which the cross-cut may not currently cover. |
| **Real-Time Collaborative Editing & Presence** | 03, 06, 07 | Consumed by `07.02.02` (lyrics) and `07.02.03` (charts). Distinct from audio transport. |

## Not-Product Concerns — routed to `/create-prd`

| Concern | Route to | Why |
|---|---|---|
| **Large-Asset Upload/Download, Chunking & Resumability** | `/create-prd-architecture` | Named independently by `07.02.01`, `07.04.04`, `07.08.01`, `07.09.01`. Multi-GB stem packs over studio upstream; a failed 4 GB upload at 90% is product-abandoning. |
| **Audio Asset Storage Tiering & Cold Archive** | `/create-prd-architecture` | `07.04.01` DT-03 — immutability (D-01) collides with storage economics. Proposed tombstone model: the *record* is immutable and cheap; the *bytes* tier. |
| **Tamper-Evident Append-Only Audit Log** | `/create-prd-security` | The immutability *promise* is product (`07.04.01` D-01); the mechanism that makes it credible as evidence is architecture. |
| **Audio DSP Analysis Compute** (null test, true peak, loudness) | `/create-prd-architecture` | `07.04.04` Q-01, `07.07.03` Q-03, `07.08.02` Q-01 — **three features, one answer**. Cloudflare Workers may not be a viable path for multi-GB DSP. |
| **DAW Session Format Parsing & Parser-Rot Monitoring** | `/create-prd-architecture` | `07.09.02` DT-03 — reverse-engineered proprietary formats that fail **silently**; unmonitored parser rot is indistinguishable from users not being credited. |
| **Local Agent Distribution, Signing, Auto-Update & Security Model** | `/create-prd` | `07.09.01` DT-03 — a second surface with real operational weight for a solo-built platform. |
| **Signed URL / Token Issuance & Revocation** | `/create-prd-security` | `07.05.02` — the private-link mechanism; identity-bound rather than bearer. |
| **Checksum Mechanism & Storage Durability Guarantees** | `/create-prd-architecture` | `07.04.05` DT-03 — the plumbing half; missing-media detection stays as product. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 07.02 Composition | 07.07 Mix & Master | Considered a link between the composition workspace and the mix workflow — both are "making the song". Rejected: no shared state and no trigger in either direction. The chart informs *tracking* (CX-05), not mixing; a mix engineer does not read the lyric document. The one real edge — the mix brief being *about* the song — is a relationship to `07.01.01` (the Song), not to the composition workspace. Their lifecycles are sequential, not interacting. |
| R-02 | 07.09 DAW Bridge | 07.05 Review & Approval | Considered surfacing review comments in the DAW — the producer is there, the notes are actionable there, and it sounds like exactly what a bridge is for. Rejected on `07.09.03` DT-02: the prompt's power is its **rarity**, and adding a comment feed turns a rare, high-value interruption into a notification stream — training dismissal and destroying the capture prompt, the one thing the bridge exists for. **The bridge is for capture, not for delivering everything the platform knows.** A tempting merge that would break the mechanism it rode in on. |
| R-03 | 07.03 Contributors | 07.02 Composition | Considered deriving lyric-workspace write access from roster roles, consistent with `07.03` CX-01's derive-access-from-roles principle. Rejected: `07.02` D-02 makes the Producer read-only on lyrics **by default even though they are Full on the roster** — because a producer with lyric edit access invites the exact anti-persona behavior `meta/personas.md` names ("assigns themselves a larger split... while contributors aren't paying attention"). Composition access is granted deliberately, not derived. A rare and deliberate exception to the domain's own access principle, and the exception is the point. |
| R-04 | 07.07 Mix & Master | 07.06 Sessions | Considered linking the mastering stage to a session record. Rejected: mastering is frequently done by an **outside engineer who is not on the platform** (`07.07.03` edge cases) — there is no session, no attendance, and the master arrives as an email attachment. Forcing a session entity around it would model a fiction. The mastering *credit* is captured by the ordinary roster machinery (`07.03.01` D-02, unclaimed identities), which is sufficient and honest. |
