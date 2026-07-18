# Promotion & Marketing — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Promotion & Marketing](./promotion-marketing-index.md)
> **Status**: [DEEP]
> **Last updated**: 2026-07-18

This domain is one machine, not eight features. The **release date** is the spine (owned by
21.01), the **pitch** is the projectile (21.02), the **target/CRM** is the aiming system (21.03),
the **smart link + pre-save** is the fan-facing landing (21.04), **paid promotion** is the money
lane with a statutory tripwire (21.05), **coverage → EPK** is the self-closing credibility loop
(21.07 + 21.09), and **social publishing** (21.06) and **event marketing** (21.08) are the
publish and Operator surfaces. Three facts recur across every cross-cut below and are worth
stating once:

- **The anchor moves.** A moved release date is the domain's single most destructive event. It
  reclassifies sent pitches as *escaped* misinformation, fires pre-saves on the wrong day, and
  strands scheduled social beats. Every child that states or consumes a date participates in the
  21.01.04 date-change cascade.
- **Provenance pays a marketing dividend.** Verified credits (02) and captured coverage (21.07)
  are the reason a rights platform owns a marketing domain (D-02). The credibility loop
  (pitch → coverage → verified quote → EPK) is the thesis, not an accessory.
- **Attention is a commons.** Rate limits (21.02.06) and the payola guardrail (21.05.03) both
  protect gatekeeper goodwill from being burned by one user at everyone else's cost. Neither is
  inherited automatically — each enforcement point must instantiate it or it has a back door.

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [21.01 Release Campaign Planner](./21.01-release-campaign-planner/) | [21.02 Pitching & Outreach](./21.02-pitching-outreach/) | The grid emits the DSP/press editorial deadlines the pitch queues consume; a moved anchor reclassifies already-sent pitches as escaped and HOLDS queued ones. | Musician, Producer (👁️ deadline) | High | 21.01.01→21.02 (grid emits deadlines); 21.02.01→21.01.01 (editorial window derived from grid, freezes on forfeit); 21.01.04→21.02 (sent pitches are the canonical escaped item); 21.02.03→21.01.04 (moved date drafts per-recipient corrections, never auto-sent) |
| CX-02 | [21.02 Pitching & Outreach](./21.02-pitching-outreach/) | [21.03 Pitch Targets & CRM](./21.03-pitch-targets-crm/) | Targeting and relationship history ARE the pitch's substance: directory supplies coverage-filtered targets, CRM logs every send, and the durable cross-campaign pitch object (D-02) lives against this data. | Musician | High | 21.02.03→21.03 (directory supplies targets, consumes bounces as contact-rot, CRM logs every send); 21.02.06→21.03.01 (opt-out + accepted-genre state lives on the target record) |
| CX-03 | [21.05 Paid Promotion](./21.05-paid-promotion/) | [21.02 Pitching & Outreach](./21.02-pitching-outreach/) | The payola guardrail (21.05.03) classifies the same playlist/radio placement offer that 21.02 pitches; the classifier is single source of truth and the stricter verdict wins. The "sell higher rate limits" trap is adjacent to the payola line — both monetise gatekeeper attention. | Musician, Operator (👁️), Fan (report path) | High | 21.05.03→21.02.02 (primary enforcement vector, playlist placement); 21.05.03→21.02.04 (statutory hardest line, 47 USC 317); 21.02.06→21.05.03 (rate-limit-sell trap adjacent to payola, shared not-selling-access values) |
| CX-04 | [21.07 Coverage & Clipping Log](./21.07-coverage-clipping-log.md) | [21.03 Pitch Targets & CRM](./21.03-pitch-targets-crm/) | Logging coverage flips a pitch outcome to `covered` and records the journalist in the CRM timeline; the log MUST also accept organic coverage with no pitch parent, so attribution is optional, not required. | Musician, Producer (👁️) | High | 21.07→21.03.03 (coverage flips pitch to 'covered', records journalist); 21.03.03→21.07 (coverage links back to close attribution, but organic coverage accepted parentless) |
| CX-05 | [21.07 Coverage & Clipping Log](./21.07-coverage-clipping-log.md) | [21.09 Campaign Press Kit (EPK)](./21.09-campaign-press-kit-epk.md) | Verified / verified-at-timestamp / claimed quotes flow from the log into the EPK, which renders the three-strength distinction; badge decay on link rot must propagate to every EPK that embedded the quote. | Musician, Producer (👁️) | High | 21.07→21.09 (three-strength quotes flow, badge decay propagates); 21.09→21.07 (EPK consumes verified quotes, renders verified/claimed distinction) |
| CX-06 | [21.02 Pitching & Outreach](./21.02-pitching-outreach/) | [21.09 Campaign Press Kit (EPK)](./21.09-campaign-press-kit-epk.md) | The EPK is the artefact every pitch attaches; the embargo (21.02.05) governs whether unreleased audio inside the EPK is playable and defines the leak/forward vector. | Musician | High | 21.02.03→21.09 (every pitch attaches the EPK); 21.09→21.02/21.02.05 (embargo governs playable unreleased audio, leak vector Q-02) |
| CX-07 | [21.01 Release Campaign Planner](./21.01-release-campaign-planner/) | [21.04 Smart Links & Pre-Save](./21.04-smart-links-presave-attribution/) | A moved anchor fires the pre-save library-write grant on a different day than the fan authorised against — a consent obligation, not a UX detail. | Musician, Fan (✅ own authorisation) | High | 21.01.04→21.04.02 (moved anchor fires pre-save on different day, notify = consent obligation); 21.04.02→21.01.04 (grant fires on release event not stated date) |
| CX-08 | [21.02 Pitching & Outreach](./21.02-pitching-outreach/) | [21.07 Coverage & Clipping Log](./21.07-coverage-clipping-log.md) | The capture leg of the credibility loop: a sent pitch's published coverage is captured here and its quote flows back to the EPK — pitch → coverage → EPK closes on itself (DT-01). | Musician | High | 21.02.03→21.07+21.09 (self-closing credibility loop, coverage captured into 21.07, quote flows back to EPK) |
| CX-09 | [21.01 Release Campaign Planner](./21.01-release-campaign-planner/) | [21.06 Social Publishing & Cross-Post](./21.06-social-publishing-cross-post.md) | The calendar plans social beats; anchor moves flow through 21.01.04 which classifies beats as stranded/escaped; 21.06 owns publishing and reports failures back to the calendar surface. Deliberately decoupled. | Musician | Medium | 21.01.03→21.06 (anchor moves classify beats stranded/escaped; 21.06 owns publishing, reports failures back) |
| CX-10 | [21.01 Release Campaign Planner](./21.01-release-campaign-planner/) | [21.09 Campaign Press Kit (EPK)](./21.09-campaign-press-kit-epk.md) | The 21.01.02 asset pack is the source the EPK draws from; a sent EPK version inherits the 21.01.04 escaped-item logic once the anchor moves. | Musician, Producer (👁️) | Medium | 21.09→21.01.02/21.01.04 (asset pack EPK draws from; inherits escaped-item logic once a version is sent) |
| CX-11 | [21.02 Pitching & Outreach](./21.02-pitching-outreach/) | [21.08 Event & Tour Marketing](./21.08-event-tour-marketing/) | Operator-as-sender (venue → local press) is the same spam-cannon shape as artist pitching, with the same curator-inbox commons risk; rate-limit / opt-out protection is NOT inherited and must be re-instantiated in 21.08. | Operator, Musician | Medium | 21.02.06→21.08 (operator-as-sender same commons risk, protection not inherited, must be instantiated there) |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> Feature-internal cross-cuts (within a single sub-domain — e.g. 21.04.01↔21.04.03 attribution
> windows, 21.03.02↔21.03.03 CRM/tracking event store, 21.01.01↔21.01.04 grid concurrency) live
> in each sub-domain's own CX file, not here. This file connects the domain's children to each
> other.

---

## Cross-Cut Details

### CX-01: Release Campaign Planner ↔ Pitching & Outreach

**Relationship**: The backward-planned grid (21.01.01) computes the DSP editorial and press
deadlines by counting backward from the release anchor; the pitch queues (21.02) consume those
deadlines as hard alarms. The relationship is bidirectional and asymmetric: the grid *feeds*
deadlines forward, and when the anchor *moves*, the date-change cascade (21.01.04) must reach
backward into 21.02 and reclassify every pitch by its send-state — mid-flight/queued pitches are
HELD (they state the old date), and already-sent pitches are marked *escaped* with a per-recipient
correction drafted but never auto-sent.

**Role scoping**:
- **Musician**: owns both surfaces; sees the deadline alarms and the escaped-item corrections.
- **Producer**: 👁️ sees only the deadline that binds their deliverable (surfaced in project/07
  context, not the marketing grid), never the pitch content.
- **Operator / Fan**: ❌ no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The release anchor is owned by 21.01 (which itself reads it from
   domain 12 — see cross-domain rows). The pitch's stated release date is a *copy* taken at send
   time. Merge strategy: the grid is authoritative; a sent pitch is an immutable historical event
   that can only be *corrected forward* by a new message, never silently rewritten.
2. **Trigger chain**: `anchor moved (21.01.04)` → classify each pitch by send-state → HOLD queued /
   flag sent as escaped → draft correction task. Async. Failure mode: if the hold fires late, a
   stale-date pitch escapes; the compensating action is the escaped-item correction, so the system
   degrades to "correct after the fact" rather than "prevent," and this is accepted.
3. **Permission intersection**: moving the anchor is a high-privilege band-entity action (D-01);
   whoever lacks that permission cannot trigger the cascade that HOLDs pitches, so pitch-hold
   authority is transitively gated by anchor-move authority.
4. **Notification fan-out**: an escaped-item classification notifies the Musician (correction task)
   and, where a deadline shifts, the Producer in project context. No Fan/Operator fan-out.
5. **State transition conflict**: a pitch can be `sending` at the instant the anchor moves — the
   race between "send commits" and "hold applies." Resolution: the send path checks anchor-version
   at commit; a commit racing a move is caught by the escaped-item sweep as a backstop.

### CX-02: Pitching & Outreach ↔ Pitch Targets & CRM

**Relationship**: The pitch has no substance without a target. The directory (21.03.01) supplies
coverage-filtered, opt-out-aware targets; the private CRM (21.03.02) records relationship history;
the pitch-tracking log (21.03.03) records every send and its outcome. The durable cross-campaign
pitch object (D-02) is defined *against* CRM data, and bounces returned from the send path are
consumed by the directory as contact-rot signal.

**Role scoping**:
- **Musician**: ✅ full — this is the artist's aiming system end to end.
- **Producer / Operator / Fan**: ❌ none. The CRM is single-role by design (Role Matrix).

**Synthesis questions answered**:
1. **Shared state conflict**: the *target record* is co-owned — the directory owns its public,
   aggregated fields (accepted genre, opt-out, response-rate) and the CRM owns the private overlay
   (notes, history). Schema-enforced boundary (D-02): aggregation consumes structured outcomes
   only, never note free-text.
2. **Trigger chain**: `pitch sent (21.02)` → CRM auto-creates/updates the private contact (D-01) →
   pitch-tracking log records the event. Sync at send. Failure: a send that fails to log leaves an
   untracked pitch; the send path treats logging as part of the send transaction.
3. **Permission intersection**: opt-out state on the target record (21.03.01) hard-blocks the send
   path in 21.02 — a permission fact expressed as delivery eligibility.
4. **Notification fan-out**: none outbound within the domain; bounces feed contact-rot, not user
   alerts.
5. **State transition conflict**: a target's opt-out can flip between target-selection and send;
   the send must re-check opt-out at dispatch, not at compose, or a just-opted-out contact is hit.

### CX-03: Paid Promotion ↔ Pitching & Outreach

**Relationship**: The payola guardrail (21.05.03) is a classifier that judges a
"playlist promotion / guaranteed placement" offer against DSP terms and the airplay statute. That
exact offer also appears as an ordinary pitch in 21.02, so the guardrail's primary *enforcement
vector* is the pitching path. The classifier must be the single source of truth across every
enforcement point, and where two points disagree the stricter verdict wins. Separately, the
"sell higher rate limits" monetisation idea (21.02.06 DT-02) sits adjacent to the payola line —
both monetise gatekeeper attention and share a values policy against selling access.

**Role scoping**:
- **Musician**: ✅ sees the block/allow verdict and the non-removable disclosure label when a paid
  relationship is disclosed.
- **Producer / Operator / Fan**: 👁️ — Operator sees the guardrail on their own promo; Fan has a
  report path for undisclosed paid posts.

**Synthesis questions answered**:
1. **Shared state conflict**: the payola *policy* is owned solely by 21.05.03; 21.02 holds no copy,
   it calls the classifier. This prevents the two from diverging into two definitions of "payola."
2. **Trigger chain**: `offer/pitch composed` → classifier evaluates → {allow | allow-with-disclosure
   | block (PAYOLA_AIRPLAY_BLOCKED / PAYOLA_DISCLOSURE_REQUIRED)}. Sync, blocking. Radio (21.02.04)
   is the hardest line — statutory, never overridable.
3. **Permission intersection**: no verdict can be overridden by role inside the domain; the
   classifier's block outranks the sender's send permission.
4. **Notification fan-out**: repeat block attempts and Fan reports escalate to domain 24; an
   off-platform DSP sanction surfacing is a reactive support path into 24.
5. **State transition conflict**: the same offer reaching the classifier via 21.02 *and* via the
   services-marketplace listing path (domain 05, D-06) must resolve to one verdict — the classifier
   is shared so both points read identical state; stricter-wins guards any propagation lag.

### CX-04: Coverage & Clipping Log ↔ Pitch Targets & CRM

**Relationship**: Logging a piece of coverage does two things back in the CRM: it flips the
originating pitch's outcome to `covered`, and it records/enriches the journalist as a contact on
the CRM timeline. Crucially the log must accept *organic* coverage that has no pitch parent, so the
pitch→coverage link is optional; forcing it would corrupt the honest-attribution posture (D-07).

**Role scoping**:
- **Musician**: ✅ logs coverage, sees the CRM contact update.
- **Producer**: 👁️ sees coverage that names them (constraint/reputational fact).
- **Operator / Fan**: ❌ (Operator's venue-naming stake is a cross-domain matter, see rows).

**Synthesis questions answered**:
1. **Shared state conflict**: the coverage event and the pitch event are distinct records; the CRM
   timeline is the join surface. If coverage arrives parentless, a journalist contact is created
   from the coverage alone — the CRM owner is the Musician either way.
2. **Trigger chain**: `coverage logged (21.07)` → resolve optional pitch parent → flip pitch to
   `covered` → upsert journalist contact. Async, best-effort on the pitch flip (parent may not
   exist). No rollback needed — a missing parent is a valid terminal state.
3. **Permission intersection**: none beyond the single-role CRM boundary.
4. **Notification fan-out**: an anonymised, aggregated response-rate signal derived from the log's
   honest terminal-Silent state (D-01) is the *only* sustainable source of the directory's
   per-target denominator — a fan-out into 21.03.01 aggregation (schema-boundary enforced).
5. **State transition conflict**: two coverage entries could both claim the same pitch; the pitch
   outcome is monotonic toward `covered` (once covered, stays covered), so the race is benign.

### CX-05: Coverage & Clipping Log ↔ Campaign Press Kit (EPK)

**Relationship**: The EPK's credibility depends entirely on the three-strength distinction the
coverage log produces: **verified** (WeJammin sent the pitch and holds the link),
**verified-at-timestamp** (was verified, link since changed), and **claimed** (typed by the
artist, unverifiable). Quotes flow from 21.07 into the EPK, which renders the distinction visibly.
Badge decay — a verified link that later rots — must propagate to every EPK that embedded the
quote, or the EPK asserts a verification it can no longer stand behind.

**Role scoping**:
- **Musician**: ✅ selects quotes into the EPK.
- **Producer**: 👁️ sees their credit/mention before it reaches press at scale.
- **Operator / Fan**: ❌.

**Synthesis questions answered**:
1. **Shared state conflict**: the quote's verification strength is owned by 21.07; the EPK holds a
   *reference* plus a pinned snapshot, not an independent copy of the verdict.
2. **Trigger chain**: `link rot detected (21.07)` → downgrade badge → propagate to embedded EPKs →
   re-render distinction. Async. Failure: if propagation lags, a sent EPK overstates verification
   until refresh — mitigated because the strength label is rendered from the live reference where
   the EPK is viewed online.
3. **Permission intersection**: only verified (not typed) quotes can render with a verified badge;
   the artist cannot promote a claimed quote to verified — a permission the log enforces, not the
   EPK.
4. **Notification fan-out**: fabricated "verified" quotes are a trust violation escalated to
   domain 24.
5. **State transition conflict**: a quote can decay between EPK build and EPK view; the view-time
   render from the live reference wins over the build-time snapshot for the badge.

### CX-06: Pitching & Outreach ↔ Campaign Press Kit (EPK)

**Relationship**: The EPK is the standard attachment on every pitch. Where the EPK contains
unreleased audio, the embargo (21.02.05) governs whether that audio is playable and defines the
leak/forward vector — a recipient forwarding an embargoed EPK is the primary confidentiality risk.

**Role scoping**:
- **Musician**: ✅ attaches EPK, sets embargo.
- **Producer**: 👁️ their credit is on the EPK; they could break the embargo with one studio photo
  (a constraint they must see).
- **Operator / Fan**: ❌.

**Synthesis questions answered**:
1. **Shared state conflict**: the embargo state is owned by 21.02.05; the EPK's playable-audio flag
   reads it. One embargo, many EPK sends.
2. **Trigger chain**: `pitch sent with EPK` → EPK link generated with embargo-scoped playback →
   `embargo lifts` → audio becomes playable. Async on lift.
3. **Permission intersection**: embargo state gates EPK audio playback per-recipient; the pitch's
   send permission does not include a right to bypass the embargo.
4. **Notification fan-out**: a detected leak/forward of an embargoed EPK is a Sev-class
   confidentiality event (escalates to 24 / create-prd-security).
5. **State transition conflict**: an EPK sent just before an embargo change; the playback
   authorisation is evaluated at view-time against current embargo state, not at send-time.

### CX-07: Release Campaign Planner ↔ Smart Links & Pre-Save

**Relationship**: The pre-save (21.04.02) is a library-write consent grant a Fan authorises against
a *stated* release date. The grant actually fires on the release *event*, owned by the anchor in
21.01. If the anchor moves, the pre-save fires on a day the Fan did not expect — a consent
obligation to notify, not a UX nicety (open Q-01).

**Role scoping**:
- **Musician**: ✅ moves the anchor, owns the campaign.
- **Fan**: ✅ full agency over *their own* authorisation — the only place in the domain a Fan acts.
- **Producer / Operator**: ❌.

**Synthesis questions answered**:
1. **Shared state conflict**: the release-event date is owned by 21.01/12; the pre-save grant holds
   the Fan's authorisation scoped to "the release," not to a calendar date — so a move does not
   invalidate the grant, it changes *when* it acts.
2. **Trigger chain**: `release event fires` → execute all pre-save library writes (largest fan-out
   in the domain). If the anchor moved, the notification obligation fires first. Async, batched.
3. **Permission intersection**: the Fan's grant scope (library-write) is fixed at authorisation;
   an anchor move cannot expand it.
4. **Notification fan-out**: on a material anchor move, notify every fan holding an outstanding
   pre-save (consent obligation). Release-day fan-out failures must be counted and surfaced, never
   silently absorbed (Q-04 → create-prd-compile).
5. **State transition conflict**: DSP rate limits shape the release-day fan-out window; a fan whose
   write fails must be retried/surfaced, not dropped.

### CX-08: Pitching & Outreach ↔ Coverage & Clipping Log

**Relationship**: This is the *capture leg* of the credibility loop. A sent pitch (21.02.03) whose
recipient publishes gets its coverage captured into 21.07, and the quote flows back into the EPK
(21.09) — pitch → coverage → verified quote → EPK → next pitch, closing on itself (DT-01). This is
the mechanism that makes a rights platform's marketing domain defensible: WeJammin can verify the
quote because it sent the pitch and holds the link.

**Role scoping**:
- **Musician**: ✅ pitches, captures coverage.
- **Producer**: 👁️ appears in coverage; a mis-credit is correctable only via domain 02.
- **Operator / Fan**: ❌.

**Synthesis questions answered**:
1. **Shared state conflict**: the pitch (21.02) and the coverage record (21.07) are separate
   entities joined by an optional link; the pitch owns send-state, the log owns verification-state.
2. **Trigger chain**: `pitch sent` → (later) `coverage published` → capture into 21.07 → verify
   against held link → flip pitch to `covered` (CX-04) → quote to EPK (CX-05). Async, multi-step;
   any step can stall without corrupting the others.
3. **Permission intersection**: only a pitch the sender actually sent yields a *verified* capture;
   organic coverage lacks the pitch and is verifiable only to `claimed`/`verified-at-timestamp`.
4. **Notification fan-out**: coverage capture notifies the Musician and updates the CRM contact.
5. **State transition conflict**: the same coverage could be captured twice (via pitch link and
   organically); dedup on the coverage URL prevents double-credit.

### CX-11: Pitching & Outreach ↔ Event & Tour Marketing

**Relationship**: 21.08 lets an Operator (venue) market a perishable date to local press — the same
"spam cannon" shape as artist pitching, aimed at the same finite curator/journalist goodwill. The
rate-limit and opt-out protection built in 21.02.06 does NOT propagate automatically; 21.08 must
instantiate its own instance of the same primitive, or the Operator path is an unprotected back
door onto the shared inbox commons.

**Role scoping**:
- **Operator**: ✅ full marketer in 21.08.
- **Musician**: ✅ in 21.02; shares the same commons the Operator can burn.
- **Producer / Fan**: ❌.

**Synthesis questions answered** *(Medium confidence — validate at spec time)*:
1. **Shared state conflict**: the opt-out ledger and per-target rate budget should be one shared
   platform primitive (see emergent cross-cut), not two divergent copies.
2. **Trigger chain**: `operator send (21.08)` → same rate-check + opt-out gate as 21.02.
3. **Permission intersection**: Operator sender identity vs artist sender identity both consume the
   same deliverability reputation (Q-02 / sender-identity Q-01).
4. **Notification fan-out**: outbound-abuse signals from both paths raise to 24.
5. **State transition conflict**: two senders hitting the same journalist near a rate ceiling — the
   ceiling must be per-target-global, not per-sender, to protect the recipient.

> **CX-09 and CX-10 (Medium confidence)** are facets of the same 21.01.04 date-change cascade and
> the 21.01.02 asset pack respectively; their 5-question synthesis is deferred to sub-domain
> drilling. CX-09: the calendar plans social beats, anchor moves classify them stranded/escaped,
> 21.06 owns publishing and reports failures back (deliberately decoupled). CX-10: the EPK draws
> from the 21.01.02 asset pack and a sent EPK version inherits escaped-item logic on anchor move.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 21.04 Smart Links & Pre-Save | 21.07 Coverage & Clipping Log | Both produce "results," but attribution (clicks/streams) and coverage (press quotes) are epistemically opposite (D-07) and share no entity or trigger. Deliberately kept apart so the observable does not contaminate the unobservable. |
| R-02 | 21.05 Paid Promotion | 21.03 Pitch Targets & CRM | Paid ads/creator seeding target *fans* built from a fan-graph; the CRM targets *gatekeepers*. Different populations, no shared record. |
| R-03 | 21.04 Smart Links & Pre-Save | 21.05 Paid Promotion | A paid ad may point at a smart link, but the link is a generic destination — no state, trigger, or permission couples the ad spend to the link's lifecycle. Coupling would be a reporting join, handled in Analytics (22), not here. |
| R-04 | 21.06 Social Publishing | 21.05 Paid Promotion | Organic cross-post and paid promotion are separate lanes with separate compliance surfaces (paid carries the disclosure label; organic does not). No shared scheduling or state. |
| R-05 | 21.03 Pitch Targets & CRM | 21.09 Campaign Press Kit (EPK) | The EPK attaches to a *pitch*, and the pitch (21.02) is what touches the CRM. 21.03 and 21.09 never interact directly — 21.02 is always the intermediary (CX-02, CX-06). |
| R-06 | 21.08 Event & Tour Marketing | 21.04 Smart Links & Pre-Save | Event marketing's conversion is *ticket* purchase (observable, owned by 19), not stream pre-save. They are the two halves of D-07's "same mechanism, opposite epistemics" split and are intentionally not merged. |

---

## Notes for downstream

- **CX-01, CX-07, CX-09, CX-10 are all facets of one mechanism**: the 21.01.04 date-change cascade.
  A spec writer should treat "anchor move" as a single event with fan-out into pitching, pre-save,
  social publishing, and the EPK — not four unrelated features.
- **CX-04 → CX-08 → CX-05 → CX-06 form the credibility loop**: pitch → coverage capture → verified
  quote → EPK → next pitch. This loop is the domain's thesis (D-02); breaking any link breaks the
  reason a rights platform owns marketing.
- **CX-03 has a cross-domain twin**: the payola classifier must also gate the services marketplace
  (05) listing path (D-06) and must NOT fire on WeJammin's own promoted surfaces (Q-07) — the
  recorded endogenous-payola contradiction.
