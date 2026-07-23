# Music Projects & Collaboration — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Music Projects & Collaboration](./music-projects-collaboration-index.md)
> **Status**: [DEEP] — 9 sub-domains; 11 intra-domain cross-cuts synthesized with the 5-question protocol; cross-domain edges and mechanisms consolidated for the global file.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [07.09 DAW Bridge](./07.09-daw-bridge-capture-at-source/) | [07.06 Sessions](./07.06-sessions-documentation-recall/) · [07.04 Version Control](./07.04-audio-version-control-lineage/) · [07.08 Delivery](./07.08-delivery-readiness-qc/) | **The domain's spine.** The bridge supplies the facts that make the capture prompt pre-fillable, lineage inferable, source declaration promptable, and the review musical-anchor computable. | Producer | High | Seven features across four sub-domains independently named the bridge as a hard dependency in their own Deep Think. `07.04.01`→`07.09.01` (DT-01); `07.05.01`→`07.09` (DT-04). |
| CX-02 | [07.03 Contributors](./07.03-contributors-access-confidentiality/) | [07.06 Sessions](./07.06-sessions-documentation-recall/) | The roster is the **subject list** the capture prompt names. No roster → the prompt has nobody to pre-fill; attendance is the independence signal that keeps a self-asserted claim honest. | Producer, Musician | High | `07.06.02` DT-01 names `07.03.01` an INPUT not a peer; `07.03.01`→`07.06.01`, attendance (D-04, coarse) is exactly the independence signal DT-04 needs. |
| CX-03 | [07.04 Version Control](./07.04-audio-version-control-lineage/) | [07.05 Review & Approval](./07.05-review-feedback-approval/) | Comments and approvals **pin immutable versions** — and a link PINS, it never resolves live. Immutability is what makes "you approved it" answerable. | Musician, Producer | High | `07.05.04` DT-01; `07.05.02` D-02 pins per `07.04.02` D-03 (**contradiction found and resolved** — see detail). `07.05.01`→`07.04.01` carry-forward walks lineage (D-08). |
| CX-04 | [07.01 Song & Board](./07.01-song-release-production-board/) | [07.06 Sessions](./07.06-sessions-documentation-recall/) | Stage transitions are the **second firing moment** for the capture prompt, after session close. | Producer, Musician | High | `07.01.03` D-02 and `07.06.02` — the board is a trigger surface. Board is the single writer of `current_stage` (last-write-wins, attributed toast — no lock). |
| CX-05 | [07.02 Composition](./07.02-songwriting-composition-workspace/) | [07.04 Version Control](./07.04-audio-version-control-lineage/) | **Chart sections/bars anchor takes and comps** — "take 4 from the second chorus" is how comping is actually discussed. | Producer, Musician | High | `07.02.03` DT-03 and `07.04.03` DT-01, reached independently. |
| CX-06 | [07.07 Mix & Master](./07.07-mix-master-workflow/) | [07.08 Delivery & QC](./07.08-delivery-readiness-qc/) | The alternate matrix **multiplies** the delivery workload; the recipient spec supplies the QC ruleset. | Producer | High | `07.07.02` CX-02 and `07.08.01` DT-01. |
| CX-07 | [07.08 Delivery & QC](./07.08-delivery-readiness-qc/) | [07.01 Song & Board](./07.01-song-release-production-board/) · [07.06 Sessions](./07.06-sessions-documentation-recall/) | The readiness score is the **debt ledger** for every prompt dismissed at the board and at session close. | Musician, Producer | High | `07.08.03` DT-02 — non-blocking upstream requires honest reckoning at the exit. |
| CX-08 | [07.03 Contributors](./07.03-contributors-access-confidentiality/) | [07.05 Review & Approval](./07.05-review-feedback-approval/) | **The roster fails to describe who decides.** Approvers and link recipients are routinely not on it. | Musician, Producer | High | `07.05.04` DT-03 and `07.05.02` DT-01 — the same gap found twice, independently. |
| CX-09 | [07.03 Contributors](./07.03-contributors-access-confidentiality/) | [07.04 Version Control](./07.04-audio-version-control-lineage/) | **The roster IS the version/timeline access policy.** Access is the union of roster roles held on THIS song, resolved per-song per-person; vault sensitivity classes gate which timeline rows each viewer sees, so "the timeline" is never one document. Version authorship flows back as a machine-observed credit. | Producer, Musician | High | `07.04.01`→`07.03.01` (DT-08/D-15, roster defines the Role Lens); `07.04.01`→`07.03.03` (rough≠stems≠takes per CX-03/`07.04.03` D-05). |
| CX-10 | [07.01 Song & Board](./07.01-song-release-production-board/) | [07.04 Version Control](./07.04-audio-version-control-lineage/) | The Song is an idea container with **no intrinsic key/tempo**; it DISPLAYS version-derived properties via the canonical resolver. Release memberships pin specific versions — a **hard retention constraint**: a pinned version must never tier to tombstone. | Producer, Musician | High | `07.01.01`→`07.04.02` (key/tempo are FIXATION properties, DT-12/D-10); `07.04.01`→`07.01.02` (release pins versions, `07.01.02` D-03). |
| CX-11 | [07.01 Song & Board](./07.01-song-release-production-board/) | [07.03 Contributors](./07.03-contributors-access-confidentiality/) | The roster is the **Song's per-song access policy** (never per-project). Access may be granted by two edges at once (roster membership + owner/mandate). Container-ownership transfer is NOT a rights event and touches no credit. | Producer, Musician | High | `07.01.01`→`07.03.01` (roster is the Song's access policy, its D-01/D-05). |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** When referencing a CX entry from another file, use format `{filename}#CX-NN` (e.g., `music-projects-collaboration-cx.md#CX-09`).

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
| `07.05.01` Musical Anchor | The tempo/section map that anchors a comment falls to the uncertain tier (a MoSCoW coupling, `07.05.01` DT-04 / Q-05) |

That convergence is evidence, not coincidence. **Without the bridge, domain 07 is a good review-and-versioning
tool that asks people to remember** — which `meta/problem-statement.md` identifies as the exact defect every
competitor already has.

> **Ratified 2026-07-22 — the bridge is absent for the whole v1 window, by decision (domain D-08, DQ-08.2).** No
> non-web client on the producer's machine is authorised; the `meta/constraints.md` Desktop row now reads "not
> authorised; reopens only on the enumerated evidence", with the four reopen items written out in full at
> [`07.09` D-05](./07.09-daw-bridge-capture-at-source/07.09-daw-bridge-capture-at-source-index.md). This does
> **not** weaken the table above — it makes every row of it the **v1 state**, which is precisely why domain D-11
> restates the v1 thesis to *capture at the first sharing moment* (`07.05.02`) plus the close prompt, with
> capture-at-source described as the direction rather than the current claim. Three consequences for this
> cross-cut specifically: (1) **the spine's trigger chain does not run in v1** — bounce → ingest → parse → hints
> is unavailable, so the prompt's pre-fill sources are the session roll (`07.06.01`) and the roster
> (`07.03.01`) only, and `07.06.02` D-11 suppresses a card with neither; (2) **the moment still has a delivery
> surface** — domain D-09 assigns PWA web push + in-app as the v1 delivery of the Tier 1 and Tier 2 cards, so
> SQ4's fan-out survives the bridge's absence; (3) **`07.09.*` keep `Should`, unphased** (domain D-10), so this
> cross-cut is not re-scoped and `07.04.01` Q-05's re-scope trigger does not fire. If the gate later closes
> without reopening, this entry must be revisited together with that re-scope.

**Role scoping**:
- **Producer**: the only active participant. The bridge exists for them, at one moment, because that moment is where the platform's value is created.
- **Musician**: entirely passive and the primary beneficiary — their credits accrue without them doing anything.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — the bridge produces facts; the sub-domains own them. No merge, because the bridge never writes to a record another writer also owns.
2. **Trigger chain**: bounce → ingest → parse → hints → prompt → credits (02) + splits (09). **Every link degrades independently** and no failure blocks the work: parse failure still yields a version; a dismissed prompt still closes the session. Async throughout — the producer never waits on the bridge.
3. **Permission intersection**: the bridge acts as the producer, with the producer's grants, and must never see more.
4. **Notification fan-out**: the prompt's fan-out is the domain's largest — one close notifies every named party (see CX-02).
5. **State transition conflict**: `07.09.02` DT-02 — a wrong guess confirmed carelessly writes a false credit. The pre-fill and the counter-attestation (domain 02) are a matched pair; neither is safe alone.

### CX-02: Contributors ↔ Sessions

**Relationship**: The roster names the people; the session witnesses them; the prompt confirms them. The roster
is not administrative plumbing — it is the **subject list of the provenance graph**, and it exists so that
`07.06.02` can ask a confirmable question instead of an open one. Traffic runs both ways: `07.06.01`'s coarse
attendance (D-04) is exactly the independence signal `07.03.01` DT-04 needs so a self-assertion cannot manufacture
a credit.

**Role scoping**:
- **Producer**: writes the roster, is the primary attestor.
- **Musician**: counter-attests — the half that turns a claim into a verified credit.
- **Operator**: sees the *event* and never the creative facts (`07.06` R-01).
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the roster owns roles; the session owns attendance. **Attendance ≠ contribution** (`07.06.01` D-03, which explicitly cites `07.03.01` DT-02 as the abuse it avoids). The roster is a LOG of membership events, not mutable rows (`07.03.01` D-12) — concurrent adds are independent facts and both land; there is no last-write-wins to lose the evidence trail.
2. **Trigger chain**: roster + attendance → pre-fill → claim → counter-attestation → verified credit. Async; a dropped attestation request never blocks the close.
3. **Permission intersection**: the roster role also derives vault and version-timeline access (CX-09), so one field governs both who is credited and who can hear the stems.
4. **Notification fan-out**: **the domain's largest** — one close emits many attestation requests, each also an invitation (`07.03.02` DT-01). This is a hard demand on the Notifications cross-cut: a per-(sender, recipient, 24h) digest window (`07.03.02` DT-16) or one session close sends one person eight messages and trains dismissal; a NON-USER-addressable channel with its own global opt-out (D-14) and its own abuse limits; delivery-state reported as `delivered`, never `read` (D-18).
5. **State transition conflict**: **work happens before acceptance** (`07.03` CX-02). Capture must be able to name a non-user, or the platform loses the exact fact it exists to capture. A pending, never-accepted roster entry is fully creditable (`07.03.02` D-02) yet is a person who has consented to nothing — domain 09's split flow must handle that party.

### CX-03: Version Control ↔ Review & Approval

**Relationship**: Comments anchor to versions; approvals pin them; **a review/share link pins a version and never
resolves live**. Because versions are immutable (`07.04.01` D-01), "you approved it" is answerable — and the
industry's most common low-grade dispute stops being possible.

> **Contradiction found and resolved (recorded per Debug-by-Test discipline).** `07.05.02` D-02 ("links pin a
> version; they do not follow the canonical") cites `07.04.02 D-03` as its justification, but `07.04.02` D-03 as
> originally written classified review links as resolving LIVE. `07.04.02` revised D-03 to say committed artifacts
> pin — the sibling was right. **Consequence for whoever owns the `07.04` sub-domain CX file**: its CX-01
> synthesis Q2 still reads "updates every downstream reference that is not pinned", framing live resolution as the
> default; it is now stale against revised D-03 and should be corrected.

**Role scoping**:
- **Musician**: approves — it is their record.
- **Producer**: configures the gates and is protected by them.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — both immutable. Updating a link mints a new one; it never mutates what a live link plays (`07.05.02` D-08).
2. **Trigger chain**: approval → round counting stops → change-summary edit window closes immediately (`07.04.01` D-11, the moment a note is evidence it stops being editable) → bytes pin hot (`07.04.01` D-10) → stage advances → capture prompt fires (CX-04). **Sign-off feeds provenance**, which is why `07.05` is not merely a review tool. Link comments enter triage marked "via link" with weaker identity and never auto-start a revision round — only triage acceptance does (`07.05.02`→`07.05.03`).
3. **Permission intersection**: the approver set is independent of the roster (CX-08); a link recipient sees ONLY their own comments (`07.05.02` D-10).
4. **Notification fan-out**: per-slot severity is a hard demand on the cross-cut (`07.04.02` DT-12) — rough quiet, mix normal, master loud, commitment-disagreement (release/approval/delivered-ISRC vs current pointer) loudest. Per-feature severity is insufficient.
5. **State transition conflict**: a later integrity failure on an already-canonical version alarms and never silently reverts (`07.04.05` D-05) — silent fallback would hide the highest-blast-radius failure in the domain. Backwards stage transitions superseding approvals (`07.01` Q-03) remains the domain's most persistent unresolved edge.

### CX-04: Song & Board ↔ Sessions

**Relationship**: The board's stage transitions are the second capture moment. A song entering `mix` means the
tracking roster is final; entering `master approved` means the split question is now or never. The fixed stage
vocabulary (`07.01.03` D-01) exists **so the system knows which prompt to fire** — which a configurable kanban
could never do.

**Role scoping**:
- **Producer**: moves stages; primary prompt target.
- **Musician**: prompted where they are a listed contributor.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the Song is the single writer of record for `current_stage` — parent CX-01's [PENDING] on stage-transition locking is resolved here as **no lock, last-write-wins, attributed toast**. Locking the board makes people avoid the board, and a stage move moves no money, so the cost of a lost write is a toast, not a corrupted record.
2. **Trigger chain**: transition → prompt → credits (02) + split confirmation (09). **Never blocking** (`07.01.03` D-02). Async.
3. **Permission intersection**: producer-or-owner roles may transition.
4. **Notification fan-out**: transitions notify the roster; `master approved` notifies everyone with a split.
5. **State transition conflict**: backwards transitions supersede approvals again (`07.01` Q-03).

### CX-05: Composition ↔ Version Control

**Relationship**: Chart sections and bars are how takes and comps are actually discussed — "take 4 from the
second chorus", "punch in at bar 33". `07.02.03` DT-03 and `07.04.03` DT-01 reached this independently, which is
why it is recorded here (`07.02` R-02).

**The consequence is a MoSCoW constraint**: take/comp anchoring must be designed in from the start. A take model
keyed on timecode cannot be re-anchored to musical structure later without re-deriving every take's position.

**Role scoping**:
- **Producer**: full at both ends.
- **Musician**: read-only on version control, full on composition.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the chart owns the section map; takes reference it. Section delete orphans, never destroys (`07.02` CX-02).
2. **Trigger chain**: none automatic — structural reference, not a workflow. The bridge's tempo/section map (CX-01) is the reliable source of the anchor when present.
3. **Permission intersection**: a Producer can restructure sections while being read-only on lyrics (`07.02` D-02) — precisely why anchoring must be section-relative rather than positional.
4. **Notification fan-out**: none.
5. **State transition conflict**: reordering an arrangement must move lyric attribution and take anchors together, or authorship silently corrupts.

### CX-06: Mix & Master ↔ Delivery & QC

**Relationship**: The alternate matrix multiplies everything downstream — N variants means N masters, N QC runs,
N cells in every package. And the recipient spec (`07.08.01`) supplies QC its ruleset (`07.04.04` DT-03: there is
no universal spec, only "does this satisfy the receiver").

**Role scoping**:
- **Producer**: full — carries the multiplied workload.
- **Musician**: config on the matrix, read-only on QC.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none.
2. **Trigger chain**: matrix → mastering scope → package contents → QC ruleset. A variant added late triggers a recall that may be impossible (`07.06.03` DT-01).
3. **Permission intersection**: packages are bounded by the builder's vault grants; a handoff package resolves from canonicals at BUILD START then pins (`07.08.01` D-03).
4. **Notification fan-out**: staleness notifications; a late variant request should feel expensive, because it is.
5. **State transition conflict**: primary master re-done → every variant and format master stale. **Lineage is what makes this detectable** (CX-10) rather than discovered by a sync agent in nine months. Instrumentals/clean/TV mixes are within-recording derivations but each, if it ships, is a distinct RELEASED recording with its own ISRC (domain 12).

### CX-07: Delivery & QC ↔ Song & Board · Sessions

**Relationship**: The domain never blocks — not the board, not the capture prompt, not QC, not stem naming. That
is correct (`07.06.02` DT-02: coercion loses the room) and it would be negligent if the debt evaporated. It does
not: it accrues silently and surfaces at `07.08.03`, **at the exit, when the user wants to ship** — motivated,
and while it is still fixable.

**Non-blocking upstream + honest reckoning at the exit is the domain's core interaction design.**

**Role scoping**:
- **Musician**: full — "can I release this?" is their question.
- **Producer**: full — "can I hand this off?" is theirs.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — readiness is derived.
2. **Trigger chain**: every dismissed prompt → debt → gap list at a chosen target. Gaps link back to the *same pre-filled prompt* they came from. **New signal `07.08.03` must learn to detect** (`07.01.01`→`07.08.03`): a Song at `master approved` with ZERO asserted recordings is a finished record that is a rights object nowhere — the thesis failing in the exact place it is meant to work, and the loudest completeness deficit possible.
3. **Permission intersection**: gaps the viewer cannot see render as opaque (`07.08.03` D-05).
4. **Notification fan-out**: "ready to release" is one of the genuinely good notifications; no nagging (`07.08.03` D-03).
5. **State transition conflict**: **does readiness ever hard-block?** The domain's central unresolved tension (`07.08` Q-01). Candidates: DSP release (12) and remix publication, both external and irreversible.

### CX-08: Contributors ↔ Review & Approval

**Relationship**: **The roster describes who *makes* the record; it does not describe who *decides* it.** Found
twice independently — `07.05.02` DT-01 (the A&R who must hear the mix has no account) and `07.05.04` DT-03 (the
approver set cannot derive from the roster).

This is a genuine limit of the roster model and it shapes two features: private links exist because these people
have no accounts, and approval gates are configured independently because these people must sign off.

**Role scoping**:
- **Musician / Producer**: send links, configure gates.
- **Operator**: none.
- **Fan**: none — a Fan cannot be a link recipient as a product action, though a link forwarded to one is a real leak (`07.05.02` DT-02).

**Synthesis questions answered**:
1. **Shared state conflict**: none — the approver set is its own object.
2. **Trigger chain**: link → listen → comment → triage → round → approval → stage advance → capture prompt. **The longest chain in the domain**, and it starts with someone who has no account.
3. **Permission intersection**: `07.03.02` D-06's T1 tier grants non-confidential rough-mix STREAMING to an address-proven non-user with no identity and no roster membership — a case `07.03.03`'s "you cannot grant stems to an email address" model does not contemplate. **The boundary needs one owner.** Link recipients carry a visibly weaker identity everywhere (`07.05.01` D-06); `07.03.03` Q-02 (artist holds the song, label holds the master — who sets policy?) gates who may mint a link at all.
4. **Notification fan-out**: link comments notify the roster.
5. **State transition conflict**: comment visibility scoping — can the A&R see the band's internal notes? (`07.05.01` Q-03). An approver who is proxy-signed must be visibly attributed and visibly weaker (`07.05.04` D-05).

### CX-09: Contributors ↔ Version Control

**Relationship**: **The roster IS the version and timeline access policy — this is the tightest cross-cut in the
domain after the bridge.** Access to a version, a stem set, or a take is the union of roster roles a person holds
on THIS song, resolved per-song and per-person, never per-account (`07.04.01`→`07.03.01`, DT-08/D-15). Because
the vault gates timeline rows by sensitivity class, one person's timeline of a song is a strict subset of
another's: a session player sees rough mixes, not stem sets, not takes (`07.04.03` D-05, the strictest class).
**"The timeline" is never one document.** Value also flows back: version authorship — who bounced the mix that
shipped — is a machine-observed credit signal, materially stronger evidence than a self-claim (`07.04.01`→02 via
`07.03.01` DT-03).

**Role scoping**:
- **Producer**: full; the roster writer, therefore the access-policy author.
- **Musician**: sees a sensitivity-scoped slice of the timeline determined by the roles they hold on the song.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none contended — the roster owns membership (as an append-only log, `07.03.01` D-12), version control owns bytes and lineage; access is a *derivation*, computed at read time from the roster log rather than a stored ACL that could drift.
2. **Trigger chain**: roster write → derived access changes → the timeline a given viewer can render changes. Async and idempotent; a role downgrade removes future access but never rewrites past attribution (`07.03.01` D-05, attribution outlives membership — the rule that makes leak-tracing possible, `07.03.03` D-12).
3. **Permission intersection**: **total** — this cross-cut IS a permission intersection. A roster role simultaneously governs credit (02), vault/stem access (`07.03.03`), and timeline-row visibility (`07.04.01`). The music-specific policy (who may say who played on this song) lives here; the generic "can user X read resource Y" engine routes to `/create-prd`.
4. **Notification fan-out**: none intrinsic beyond the roster's own membership announcements (CX-02 Q4).
5. **State transition conflict**: concurrent roster adds are independent facts and both land (`07.03.01` D-12) — there is no last-write-wins to destroy the evidence trail `07.03.03` sells. A version nominated canonical while a contributor is being removed still resolves against the roster *as of* the nomination, because access is a read-time derivation over an immutable log.

### CX-10: Song & Board ↔ Version Control

**Relationship**: The Song is an **idea container, not a fixation** — it has no intrinsic key or tempo (a Song at
`writing` has no key at all; a version pitched up a semitone has a different key). Key, tempo, duration, loudness
and true peak are properties of a FIXATION that the Song only DISPLAYS via the canonical resolver
(`07.01.01`→`07.04.02`, DT-12/D-10). The reverse edge is a hard retention constraint: release memberships
(`07.01.02`) pin specific versions (`07.01.02` D-03), and **a pinned version must never tier to tombstone** —
shipping a release whose master's bytes were garbage-collected is the most embarrassing failure available to the
platform.

**Role scoping**:
- **Producer**: full at both ends; nominates canonicals and assembles releases.
- **Musician**: read-only on version control; sees the Song's displayed properties.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: none — the Song does not store key/tempo; it points at the canonical version that does. The record/bytes split (derived metadata lives in the record, not recomputed from bytes) is a product decision made in `07.04`, and it is what lets a cold-tiered version still answer `07.04.05`'s plausibility check.
2. **Trigger chain**: canonical nomination is ALSO a retention decision — it pins bytes hot permanently (`07.04.02`/`07.04.01` D-10); release membership is a *second*, stronger retention pin. Neither the resolver nor the release can be costed without the other.
3. **Permission intersection**: nomination rights ("owner", "producer") are roster roles (CX-09), and slots are per-song because the roster is per-song — cross-song nomination is refused.
4. **Notification fan-out**: per-slot severity (CX-03 Q4) — a master-level or release-level commitment change is the loudest notification in the domain.
5. **State transition conflict**: primary master re-nominated after a release pinned the prior one → the release still plays the pinned bytes (immutability), and the divergence between "release pin" and "current canonical" is a commitment-disagreement the notification layer must surface loudly. Once that master is ISRC-registered and delivered to DSPs, the pin is enforced by an external system (domain 12) that cannot be retracted.

### CX-11: Song & Board ↔ Contributors

**Relationship**: The roster is the **Song's access policy, and it is per-song, never per-project**
(`07.01.01`→`07.03.01`). A 12-song album is 12 independent access surfaces, not one — which is also why
confidentiality defaults inherit per-project but access resolves per-song. Access to a Song may be granted by two
edges at once (roster membership on the song, or owner/mandate on the container), and the two lifecycles must be
reconciled without one silently overriding the other. Crucially, **container-ownership transfer of the production
workspace is NOT a rights event** — it writes nothing to domain 09's chain-of-title ledger and touches no credit;
the transfer confirmation must say so and route anyone who meant a rights transfer to domain 09.

**Role scoping**:
- **Producer**: full; can create a Song a client's band owns from second one via mandate (domain 01.03), no later transfer needed.
- **Musician**: gains access through a roster edge or through ownership of the container.
- **Operator / Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: the Song owns its identity and lifecycle; the roster owns membership. Access is the union of the two grant edges — additive, so there is no conflicting write, but the UI must show *why* a person has access (which edge) so a removal from one edge does not read as a full revocation when the other still holds.
2. **Trigger chain**: container-ownership transfer → access follows the new owner → but no credit, split, or ledger event fires. Backwards from the standard assumption: the loud path (rights transfer) is explicitly the one this edge must NOT take.
3. **Permission intersection**: total — the roster is the access policy (CX-09). The Song's owner is always a *party* (person, alias, band entity), never the project itself (domain 01, DT-03); a dissolved band persists as the owner via 01.04.04.
4. **Notification fan-out**: abusive renames are attributable and one-click revertible (append-only title history); bulk Song creation is rate-limited (120/party/hour) with a distinct authenticated bulk-import path.
5. **State transition conflict**: a Song archived or `unadministered` keeps every credit citable — permanence is the platform's promise (`07.01.01` D-02); archival changes access, never attribution.

---

## Cross-Cut Mechanisms Identified — for the global CX file

> Candidates that turned out to be **mechanisms serving many domains**. Reconciled against the Step-6 registry:
> the last column marks whether the registry already covers it.

| Mechanism | Serves | Registry status |
|---|---|---|
| **Forensic Audio Watermarking & Leak Tracing** (per-recipient, marks the STREAM not only the download) | 05, 07, 11, 12, 14 | **Not covered.** Registry's *Media Handling* has audition watermarking only; forensic per-recipient stream encoding + leak investigation is distinct. Emergent — see below. |
| **Fine-Grained Session Attendance Time Tracking** (opt-in, person-controlled, invisible to Operator; union AFM/MU hour reports) | 05, 06, 07, 16, 17, 23 | **Not covered.** Payments/Tax do not track hours. Emergent — see below. |
| **Audio DSP Analysis Compute** (null test, true peak, loudness) | 07, 12, 14 | **Not covered.** Registry's *Audio Fingerprinting* is content-ID, not loudness/peak DSP. Emergent — see below. |
| **DAW Session Format Parsing & Parser-Rot Monitoring** | 07 (feeds 02, 09) | **Not covered.** Silent-failure parsing of proprietary formats. Emergent — see below. **Not a v1 requirement** (domain D-08): no client is authorised, so there is no parse in v1; the mechanism stays registered against `07.09.02` for the post-gate horizon. |
| **Large-Asset Resumable Upload/Download** (chunked, multi-GB stem packs over studio upstream) | 05, 07, 08, 12, 14 | Partially — *Object & Evidence Storage* covers durable storage + signed URLs, not resumable chunked ingest. Emergent extension. |
| **Media Handling & Audio Playback** (waveform, streaming, gapless A/B) | 05, 06, 07, 08, 12, 14, 20 | **Covered** — registry *Media Handling & Audio Playback*. `07.04.06`/`07.05.02` consume it; loudness-matched position-locked A/B stays local. |
| **Notifications & Alerts** (needs **PWA web push** channel in v1 + per-slot severity) | all | **Covered**, with two extensions to the registry entry. (1) **v1 channel — corrected 2026-07-22 (domain D-09)**: the capture moment is delivered by **PWA web push + in-app**, not by a native-OS notification. `07.09.03`'s native-OS channel is deferred with the client surface itself (domain D-08) and becomes live only if that gate reopens. The Tier 1 requirement this must satisfy is `07.06.02` D-09 — ≤ 5 s after the close signal, ungated. (2) `07.04.02` DT-12 still needs per-slot (not per-feature) severity. |
| **Realtime Rooms, Presence & Audio Transport** | 03, 06, 07, 08 | **Covered** (registry, owner 08). `07.06.01` consumes presence-as-attendance. |
| **Privacy, Consent & Data Portability** | all | **Covered.** The provenance-graph export question (`07.08.01` Q-02, DDEX RIN) is a values decision that rides this mechanism. |
| **Analytics Instrumentation & Reporting / Completeness Scoring** | 01, 07, 12, 13, 14, 16 | **Covered** (registry folds completeness/readiness scoring into Analytics). `07.08.03`'s song-specific readiness expression stays local. |
| **Contracts, E-Signature & Attestation** | 05, 06, 09, 10, 11, 12, 17, 20, 23 | **Covered.** Countersignature is the mechanism behind counter-attested credits. |
| **Audit Log & Provenance Ledger** (tamper-evident, append-only) | all | **Covered.** The immutability *promise* is product (`07.04.01` D-01); the credible-evidence *mechanism* is this registry entry. |

## Not-Product Concerns — routed to `/create-prd`

| Concern | Route to | Why |
|---|---|---|
| **Large-Asset Upload/Download, Chunking & Resumability** | `/create-prd-architecture` | Named by `07.02.01`, `07.04.04`, `07.08.01`, `07.09.01`. A failed 4 GB upload at 90% is product-abandoning. |
| **Audio Asset Storage Tiering & Cold Archive / Tombstoning** | `/create-prd-architecture` | `07.04.01` DT-03 — immutability (D-01) collides with storage economics; the record is immutable and cheap, the bytes tier. Bounded by CX-10's no-tombstone-a-pinned-version constraint. |
| **Tamper-Evident Append-Only Audit Log** | `/create-prd-security` | Necessary but not sufficient (`07.04.01` DT-07): the correction affordance (D-03/D-06) is the forgery surface. |
| **Audio DSP Analysis Compute** (null test, true peak, loudness) | `/create-prd-architecture` | `07.04.04` Q-01, `07.07.03` Q-03, `07.08.02` Q-01 — three features, one answer. |
| **DAW Session Format Parsing & Parser-Rot Monitoring** | `/create-prd-architecture` | `07.09.02` DT-03 — reverse-engineered formats that fail **silently**; unmonitored rot is indistinguishable from users not being credited. |
| **Local Agent Distribution, Signing, Auto-Update & Security Model** | `/create-prd` — **not required for v1** | `07.09.01` DT-03 — a second surface with real operational weight for a solo-built platform (was domain Q-01). **Resolved 2026-07-22 (domain D-08)**: no non-web client is authorised, so **`/create-prd-stack` designs no agent distribution, signing, notarisation or auto-update for v1** and is unblocked on this point. A costed statement of that same build/update/signing/notarisation/support load against Team=Solo and Budget=Lean is *reopen-evidence item (c)* on the gate (`07.09` D-05) — an owner-decision input, not tracked work (domain Q-11). |
| **Signed URL / Token Issuance & Revocation** | `/create-prd-security` | `07.05.02` — unguessable non-enumerable tokens, fail-closed revocation ≤10 s, passcode rate limiting. |
| **Audio Fingerprinting & Similarity Matching** | `/create-prd-architecture` | `07.04.01` — sonically-identical-different-bytes detection, parentless lineage inference, duplicated-session mis-file check. |
| **Checksum Mechanism & Storage Durability Guarantees** | `/create-prd-architecture` | `07.04.05` DT-03 — the plumbing half; missing-media detection stays as product. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 07.02 Composition | 07.07 Mix & Master | Both are "making the song", but there is no shared state and no trigger in either direction. The chart informs *tracking* (CX-05), not mixing; a mix engineer does not read the lyric document. The one real edge — the mix brief being *about* the song — is a relationship to `07.01.01`, not to the composition workspace. Sequential, not interacting. |
| R-02 | 07.09 DAW Bridge | 07.05 Review & Approval | Surfacing review comments in the DAW sounds like exactly what a bridge is for. Rejected on `07.09.03` DT-02: the prompt's power is its **rarity**; a comment feed turns a rare, high-value interruption into a notification stream, training dismissal and destroying the capture prompt — the one thing the bridge exists for. A tempting merge that would break the mechanism it rode in on. |
| R-03 | 07.03 Contributors | 07.02 Composition | Deriving lyric-workspace write access from roster roles is consistent with CX-09's derive-access-from-roles principle. Rejected: `07.02` D-02 makes the Producer read-only on lyrics **by default even though they are Full on the roster**, because lyric edit access invites the exact anti-persona behavior `meta/personas.md` names ("assigns themselves a larger split... while contributors aren't paying attention"). A deliberate exception to the domain's own access principle, and the exception is the point. |
| R-04 | 07.07 Mix & Master | 07.06 Sessions | Linking the mastering stage to a session record. Rejected: mastering is frequently done by an **outside engineer not on the platform** (`07.07.03` edge cases) — no session, no attendance, the master arrives as an email attachment. Forcing a session entity around it models a fiction. The mastering *credit* is captured by the ordinary roster machinery (unclaimed identities), which is sufficient and honest. |
| R-05 | 07.05 Review & Approval | 07.08 Delivery & QC | Gating delivery on unresolved review comments. Rejected on D-04 (non-blocking) + D-05 (measure, never judge): an unresolved comment is craft, and QC checks only objective faults (`07.08.02` D-04). Coupling them would make the platform adjudicate taste — the precise thing every domain decision refuses. The legitimate link runs through readiness (CX-07), which *shows* an open comment count without blocking on it. |
| R-06 | 07.01 Song & Board | 07.02 Composition | Treating the composition workspace as a stage on the board (writing → tracking → mix). Rejected: composition is not a board stage but a parallel workspace with its own read-only-by-default access (R-03) and its own lifecycle; a lyric can change after `mix`. The board reads the Song's stage; it does not own the lyric's state. Folding composition into the stage machine would force a linear order the craft does not obey. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-06|D-06]]
