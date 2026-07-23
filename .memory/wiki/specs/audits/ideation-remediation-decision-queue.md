# Ideation Remediation — Canonical Decision Queue

> **Status:** Canonical compilation of independently validated draft entries. **All 43 entries are RATIFIED as of 2026-07-21.** CQ-01, CQ-03, CQ-05, A-01 and A-02 on 2026-07-19; A-03, A-04, A-05, DQ-04.06, CQ-02, CQ-04, CQ-06 and CQ-07 on 2026-07-20; CQ-08, CQ-09, P-02..P-12, DQ-MG-01..07 and DQ-04.01/.02/.03/.04/.05/.07 on 2026-07-21. Every source contract is applied. **No UNRATIFIED recommendation remains.**
>
> **Gate:** **All 43 entries are ratified and all 107 ledger identities are `verified-fixed`.** The graph refresh and a fresh full `/audit-ambiguity ideation` remain required before `/create-prd`; the recovery ledger cannot substitute for that run.
>
> **Scope:** **0 non-fixed Final Per-Finding Disposition Ledger identities.** All 107 findings in [remediation-state.md](./remediation-state.md) are `verified-fixed`: 0 product decisions, 0 architecture decisions, 0 deferred replacement entries. Every entry below is a ratified audit record. P-01 closed on its policy with practitioner-evidence collection tracked in `p01-production-stage-vocabulary-validation.md`.
>
> **Source discipline:** Entry bodies are copied from validated drafts. Ratified entries record the chosen option and source-contract application; every unresolved entry preserves source anchors, classifications, owners/stages, interim rules, options, pros/cons, and an **UNRATIFIED** recommendation.

## Architecture & Security — resolve first

### CQ-01 — Taxonomy-action RBAC grade

- **Entry type:** Architecture decision
- **Affected ledger finding:** `r-09[0]`
- **Classification:** Architecture — preserve ledger classification `needs-architecture-decision`.

**Question:** Which RBAC grade governs selecting a taxonomy value and proposing a missing one?

| Option | Pros | Cons |
|---|---|---|
| A. `Read-only` for all four personas | Keeps service taxonomy platform-curated and avoids a taxonomy-proposal write path. | Contradicts the credit-taxonomy experience that lets Musician, Producer, and Operator propose a missing value. |
| B. `Config` for Musician, Producer, and Operator; `Read-only` for Fan | Matches the credit-taxonomy interaction and retains the Fan boundary. | Requires a constrained proposal capability despite platform curation; the RBAC model must distinguish proposal from vocabulary editing. |
| C. A separate `Propose` permission | Makes the distinction explicit: users can request a value but cannot curate or publish it. | Adds a new permission concept and migration surface beyond the existing access-level vocabulary. |

**RATIFIED 2026-07-19:** Option B — Musician, Producer, and Operator have `Config` access to select a permitted taxonomy value and propose a missing one; Fan is `Read-only`. Promotion, deprecation, mapping, and all vocabulary editing remain exclusive to the external admin/governance role.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:68`.
  - Applied target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/05-services-marketplace/05.01-service-listings-pricing/05.01.02-service-category-taxonomy-attributes.md` — Role Lens, RBAC boundary, resolved Q-08, and parent Role Matrix now share the selected contract.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.06-credit-role-instrument-taxonomy.md:20-25,217` — aligned Config proposal boundary and external vocabulary-edit authority.
- **Replaced interim rule:** A proposal is a constrained Config write to the curation queue and never blocks publication; no persona can create, promote, deprecate, map, or edit vocabulary.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-01 architecture decision.

### CQ-03 — Versioned collusion evidence interface

- **Entry type:** Interim-replacement architecture decision
- **Affected ledger finding:** `r-20[2]`
- **Classification:** Architecture — preserve ledger classification `deferred-with-interim-rule`.

**Question:** What versioned evidence interface should ring detection provide to credit-dispute resolution?

| Option | Pros | Cons |
|---|---|---|
| A. Per-edge negative multiplier only | Smallest interface; preserves the established per-edge, non-accusatory model. | Gives adjudication little diagnostic context when deciding whether independent corroboration exists. |
| B. Per-edge multiplier plus a typed `requiresNonTopologicalCorroboration` constraint | Preserves no-score/no-flag/no-auto-escalation boundaries while making escalation requirements explicit and testable. | Requires a carefully versioned contract across domains 02 and 24. |
| C. Per-witness trust score and ring flag | Could make triage appear simpler. | Conflicts with the interim contract; invents a score, exposes a de facto accusation, and permits topology-only exclusion. |

**RATIFIED 2026-07-19:** Option B — `CollusionEvidenceConstraintV1` carries a per-attestation-edge multiplier plus literal `requiresNonTopologicalCorroboration: true`. No witness score, cluster verdict, ring flag, hard exclusion, or topology-only escalation is emitted.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:83`.
  - Applied target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.05-credit-dispute-resolution.md` — consumes the versioned contract only as an edge weight and requires separate non-topological corroboration for a case transition relying on the detection signal.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.04-attestation-credit-confidence/02.04.04-attestation-ring-collusion-detection.md` — defines the four-field v1 payload and its omissions.
  - Applied due-process boundary: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.01-report-intake-notice-and-action.md` — factual-dispute lane cannot be created or advanced by topology alone.
- **Replaced interim rule:** Unsupported versions are excluded from confidence calculation and cannot trigger escalation; ordinary dispute filing and resolution on other evidence remain available.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-03 architecture decision.

### CQ-05 — Canonical ownership-ledger ordering key

- **Entry type:** Architecture decision — **resolved 2026-07-19**
- **Affected ledger finding:** `r-34[0]`
- **Resolution:** The semantic ordering key was already source-locked as ascending lexicographic
  `(pool, party-id, role, contribution-basis)`. The owner selected the remaining collation: compare the
  immutable canonical serialized internal `party-id` as unsigned UTF-8 byte sequences in lexicographic order.
  No locale, display-name, case-folding, Unicode-normalization, or database-default behaviour may affect it.
  SQL, Workers, exports, and replay jobs must use that comparator or a persisted equivalent binary sort key.
- **Rejected alternatives:** Insertion/retrieval order is prohibited; party ID alone is not total; an opaque
  ledger-row ID is neither needed nor source-aligned because the four-field identity key is already unique.
- **Applied authority:** `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.02-ownership-ledger-validation.md:79-93`.
- **Replaced interim rule:** Every consented ledger now has one portable, content-derived order for Domain 10
  cent allocation; no runtime may supply a locale- or database-default comparator.
- **Resolution owner / stage:** Owner architecture decision applied; no remaining CQ-05 decision.

### A-01 — Contradictory-feedback detection mechanism

**Affected ledger identity:** `r-45[0]`
**Classification:** Architecture decision — **resolved 2026-07-19**

**Resolution:** Owner selected positional candidates plus Producer manual flags. V1 sorts same-version timestamped comments ascending by offset; each cluster starts at the earliest unassigned comment and includes subsequent unassigned comments ≤5,000 ms from that seed, preventing transitive chaining. A Producer manually flags two or more IDs in one positional cluster or song-level bin as a contradiction. V1 has no topic extraction, semantic inference, AI request, ranking, recommendation, adjudication, or automatic notification.

- **Applied authority:** `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.03-feedback-consolidation-triage.md` — Behavior, States, D-06.
- **Replaced interim rule:** Contradictions remain surfaced and never adjudicated, now through a bounded deterministic candidate-clustering and manual-flag contract.
- **Resolution owner / stage:** Owner architecture decision applied; no remaining A-01 decision.

---

### A-02 — Review-link permission-intersection contract

**Affected ledger identity:** `r-51[0]`
**Classification:** Architecture decision — **resolved 2026-07-19**

**Question retained for history:** How should review-link recipients be isolated from internal feedback?

| Option | Pros | Cons |
|---|---|---|
| A. Recipient sees only their own thread; internal scope immutable and hidden | Strong confidentiality boundary and matches child behavior. | Requires strict scope enforcement across views and APIs. |
| B. Recipient sees all feedback on shared timestamps | Better collaboration context. | Leaks internal discussion and conflicts with the documented boundary. |
| C. Owner configures visibility per thread | Flexible. | Increases permission state and accidental-disclosure risk. |

**RATIFIED 2026-07-19:** Option A — the owner selected the existing source contracts as authoritative; no source-contract redesign occurred. An unauthenticated/private-link recipient may comment only in their own thread and see replies in it. They see neither roster/internal comments, another recipient or their comments, other versions, nor the rest of the project; hidden comments are neither counted nor teased. Audience is selected at post time and immutable; crossing scope requires a deliberate, attributed new comment. Link-recipient comments notify the roster, and listen-recording failure never blocks posting.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05-review-feedback-approval-cx.md` — § `Cross-Cut Details`, `CX-01: Private Share Links ↔ Timestamped Review`: append-only version stream, asymmetric permission intersection, roster notification, and non-blocking listen-recording chain.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.01-timestamped-waveform-review.md` — § `Decisions`, `D-13` fixes post-time audience and attributed scope crossing; `D-14` provides recipient isolation with no hidden count or teaser.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.02-private-share-links-listen-analytics.md` — § `Decisions`, `D-10` makes recipients mutually invisible and labels reply audiences; edge-case scenarios operationalize the boundary.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-51.json`, finding `[0]`.

**Replaced interim rule:** None in the source contracts. The prior queue assertion that the CX boundary was incomplete was unsupported; CX-01 already states the complete permission intersection. `/create-prd-architecture` must enforce this existing asymmetric, append-only, version-anchored stream without a mutable audience, recipient-shared stream, separate recipient ACL, visibility widening, or v1 scope change.

**Resolution owner / stage:** Owner ratification applied; `r-51[0]` independently verified fixed. No remaining A-02 architecture decision.

---

### A-03 — DAW parsing viability and no-person-name path — RESOLVED

**Affected ledger identity:** `r-52[0]`
**Classification:** Architecture decision — owner-ratified contract
**Resolution owner / stage:** Owner ratification applied; architecture validates before selecting a parser or track-mapping integration.

**Question:** What DAW parsing and track-mapping contract should v1 support?

| Option | Pros | Cons |
|---|---|---|
| A. Validate supported DAWs first and define a no-person-name fallback | Grounds product promise in real session evidence. | Delays broad automation contract. |
| B. Support a broad parser immediately | Maximizes intended coverage. | Depends on explicitly unvalidated market premise. |
| C. Import manually mapped tracks only | Reliable initial data model. | Loses capture-at-source automation value. |

**RATIFIED: Option A.** Before a DAW becomes supported, WeJammin validates representative real sessions for that candidate and completes a DAW-specific legal review. No parser or track-mapping integration hardens into v1 solely from unvalidated track-name assumptions. For a parsed track with no person-name signal, the fallback is deterministic: retain any track/instrument context, make no contributor guess, and route capture to the existing explicit Producer question; ambiguity continues to ask rather than infer. Unsupported, unreadable, or rejected formats remain non-blocking: ingest/version capture proceeds without parser-derived metadata. This ratifies a selection gate, not a broad-parser commitment, delivery mechanism, or surface change.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09.02-daw-session-parsing-track-mapping.md` — § `Deep Think Annotations`, `DT-01`–`DT-03`; § `Edge Cases / Failure Modes`; § `Open Questions`, `Q-01`–`Q-03`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09-daw-bridge-capture-at-source-index.md` — § `Why This Exists — the single most consequential Deep Think finding in domain 07`; § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-52.json`, finding `[0]`.

**Preserved architecture follow-through:** `/create-prd-architecture` selects any validation candidates and delivery shape only after this gate; the current single-web-surface classification remains unchanged unless a later owner decision changes it.

> **SUPERSEDED IN PART — 2026-07-22 (D-70, queue entry DQ-08.2).** "Unless a later owner decision changes it" has now happened, and the surface rule no longer lives in this audit file. `meta/constraints.md` § Project Surfaces states it directly: **no non-web client is authorised**, and the Desktop row carries four enumerated reopen-evidence items (§ Desktop Surface — Reopen Evidence). The classification stays `single-surface` for v1. A-03's parser gate above is **unchanged** and remains a *separate, additional* gate applying after the surface question — satisfying the surface evidence does not authorise a parser.

---

### A-04 — Rights-aware vault and NDA-gating access contract — RESOLVED

**Affected ledger identity:** `r-53[0]`
**Classification:** Architecture/security decision — owner-ratified validation gate
**Resolution owner / stage:** Owner ratification applied; `/create-prd-security` validates proposed profiles with practitioners before hardening a v1 default.

**Question:** Which default access profiles may the rights-aware vault enforce in v1?

| Option | Pros | Cons |
|---|---|---|
| A. Validate proposed profiles with practitioners, then lock them | Reduces chance of an unsafe or unusable permission model. | Defers final access contract. |
| B. Lock proposed profiles as v1 now | Enables immediate authorization design. | Converts an explicitly unvalidated matrix into security policy. |
| C. Use owner-configured permissions only | Flexible for unusual teams. | Weakens predictable least-privilege defaults and raises configuration risk. |

**RATIFIED: Option A.** The Behavior-table role × asset-class profiles are validation candidates, not deployable defaults. Before hardening any v1 default, validate each candidate with practitioners who perform the affected song roles and record the approved profile version. The validation may refine who receives each sensitivity class; it may not replace the locked model with manual per-asset ACLs, project-wide grants, or an owner-configured-only regime. Until validation locks a profile, no unvalidated profile is enforced as a v1 default.

**Locked boundaries preserved:** Per-song × sensitivity-class access remains derived from roster role; Producer configuration cannot override owner confidentiality; first-access NDA evidence, immediate fail-closed revocation, terms-not-grants separation, version-pinned ordinary acceptance, and explained denial remain intact. Validation neither decides in-product NDA legal enforceability nor song-owner/master-owner precedence; those remain separately open questions.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.03-rights-aware-asset-vault-nda-gating.md` — § `Behavior`; § `Decisions`; § `Open Questions`, `Q-01`–`Q-04`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-index.md` — § `Decision Log`; § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-53.json`, finding `[0]`.

**Preserved architecture follow-through:** `/create-prd-security` defines the validation evidence, profile-version record, and enforcement rollout. It must not misrepresent in-product NDA acceptance as legally enforceable before the separate compliance decision resolves it.

---

### A-05 — Partial DSP acceptance status model — RESOLVED

**Affected ledger identity:** `r-54[1]`
**Classification:** Architecture decision — owner-ratified status contract
**Resolution owner / stage:** Owner ratification applied; `/create-prd-architecture` implements the attached-detail contract without changing the outer status identity.

**Question:** How should a store result that accepts some tracks and rejects others be represented?

| Option | Pros | Cons |
|---|---|---|
| A. Add a track axis to the per-store status object | Represents each track outcome natively. | Changes status identity and query model. |
| B. Keep release-level status with a rejected-track list | Preserves current status identity while retaining detail. | Requires attached-detail contract and careful lifecycle handling. |
| C. Collapse to release accepted/rejected | Simplest model. | Loses a material operational outcome. |

**RATIFIED: Option B.** Keep one `(release × store × territory)` status row. When partner evidence is mixed, attach one rejected-item detail for each affected recording; the parent projects `Partial acceptance`, never wholly `Accepted` or wholly `Rejected`. Each detail carries a stable affected-item ID, partner and delivery/message correlation, evidence timestamp and normalized reason, triage/remediation state, and successor-delivery correlation when redelivered. The parent exposes accepted/rejected/pending counts plus actionable affected items; it never manufactures a separate track-status row or hides the accepted tracks.

**Lifecycle boundary:** Triage locates each rejected item and redelivery remains scoped to the rejecting partner. The partner profile determines any re-delivery payload shape; regeneration still discards rather than mutates an in-flight message. A later partner acknowledgement may clear only the confirmed resolved detail; only evidence that the entire release result is healthy may remove the `Partial acceptance` projection.

**Exact sources:**
- `.memory/wiki/specs/ideation/12-release-distribution/12.03-dsp-store-territory-management/12.03.02-per-store-delivery-status.md` — § `Behavior`; § `States`; § `Open Questions`, `Q-04`.
- `.memory/wiki/specs/ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-cx.md` — § `Cross-Cut Map`, `CX-02`; § `Cross-Cut Details`.
- `.memory/wiki/specs/ideation/12-release-distribution/12.03-dsp-store-territory-management/12.03.03-rejection-triage-remediation.md` — § `Behavior`; § `States`; § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-54.json`, finding `[1]`.

**Preserved architecture follow-through:** `/create-prd-architecture` defines persistence and query mechanics for the attached details. It must preserve evidence-labelled status, store-side `Live` confirmation, partner-scoped redelivery, and the rule that a partial parent cannot over-claim a wholly healthy or wholly failed release.

---

### DQ-04.06 — Ladder concurrency and hold-consistency contract — RESOLVED

- **Affected ledger rows:** `r-78[0]`
- **Classification:** Architecture decision — owner-ratified consistency contract
- **Resolution owner / stage:** Owner ratification applied; `/create-prd-architecture` selects storage/transaction primitives that enforce this contract.

**Question:** What consistency contract should govern concurrent changes to one hold ladder?

| Option | Pros | Cons |
|---|---|---|
| A. Optimistic version check with reject-and-reoffer | Preserves a single server-authoritative order without silent demotion or last-write-wins loss. | Clients must handle rejected writes and retry against the current ladder. |
| B. Per-ladder serialized command queue | Gives callers an ordered result without retry logic. | Adds queue availability and latency concerns to time-sensitive booking work. |
| C. Pessimistic edit lock | Prevents concurrent submissions while one booker edits. | A disconnected or abandoned lock can block the room's inventory. |
| D. Last write wins | Simple to implement. | Can silently demote a live party and violates the ladder's stated accountability guarantees. |

**RATIFIED: Option A.** Every mutation carries the current version of exactly one bookable-slot ladder. The server alone assigns dense positions and orders simultaneous requests by server receipt time. A stale version is rejected before mutation; the client receives the authoritative current ladder and may re-offer its intent against that state. The server never merges, automatically replays, queues behind, locks out, or applies last-write-wins to stale mutations. Offline actions stay pending until server acceptance.

**Atomicity boundary:** A successful mutation atomically preserves dense ordering, version advance, immutable attribution/reason where required, terminal semantics, and its notification/audit intent. Expiry or release promotes lower positions; avail withdrawal, date passage, and confirmation void their target ladders without promotion. For a simultaneous challenge and release against one position, release wins. Confirmation remains blocked until both required room-side and artist-side ladders resolve.

- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.02-hold-ladder-priority.md` — position assignment; concurrent request and multi-booker edge cases; cross-cut notes; D-04, D-05, D-17.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01-availability-holds-confirmation-cx.md` — CX-01 and CX-02 state-transition conflicts.

**Preserved architecture follow-through:** `/create-prd-architecture` defines compare-and-swap storage, idempotency, durable scheduled expiry, dual-ladder-confirmation boundaries, and notification-outbox mechanics. It must not weaken server authority, stale rejection, or the terminal-action distinctions.

## Product — Credits & Rights

### CQ-02 — Public treatment of a comped-out contribution — RESOLVED

- **Entry type:** Product decision
- **Affected ledger finding:** `r-19[1]`
- **Classification:** Product decision ratified as `verified-fixed`.

**Question retained for history:** How should a retained not-in-final-master credit appear to visitors?

| Option | Pros | Cons |
|---|---|---|
| A. Do not render it to visitors; retain the owner-only qualified record | Closely tracks a released-master-only public discography. | Erases a real captured contribution from public attribution and leaves the public record less complete. |
| B. Render it with a plain-language `not in final master` qualifier | Retains the contributor's visible credit and makes the delivered-master distinction honest. | Can create a more complex public page and may surprise audiences accustomed to liner-note-only credits. |
| C. Render it without a qualifier | Preserves continuity of public credit display. | Misstates the relationship to the delivered master and defeats the purpose of retaining the qualifier. |

**RATIFIED 2026-07-20: Option B.** A retained not-in-final-master credit renders once with the plain-language qualifier **"not in final master"** whenever it otherwise passes the ordinary publication, per-credit visibility, embargo, and public-work-identity gates. It remains in its ordinary role family and chronology at its existing provenance tier. The qualifier never widens visibility: a suppressed record remains absent and uncounted. Visitors receive neither the owner-only trigger date nor the comp-out reason or delivery history.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:80`.
  - Applied target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.02-public-discography.md` — resolved edge case, D-15, and Q-07 establish public rendering, disclosure, and viewer-relative count treatment.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.01-credit-record-contribution-ledger.md` — D-09 preserves the retained credit and its unchanged tier while keeping Domain 10 neighbouring-rights registration separate.
- **Replaced interim rule:** Public treatment now follows the ratified display rule. The public qualifier changes no ownership, registration, royalty, payment, union, or neighbouring-rights result; Domain 10 retains that unresolved question.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-02 public-display decision.

### CQ-04 — Traversal presentation of suspected-ring edges

- **Entry type:** Product decision
- **Affected ledger finding:** `r-25[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** How should traversal results present an edge suspected of ring collusion?

| Option | Pros | Cons |
|---|---|---|
| A. Hide the edge | Avoids displaying a potentially tainted relation. | Suppression can tip off an adversary and makes results harder to interpret. |
| B. Mark the edge as suspected | Gives users visible context. | Publicly or privately labelling suspicion can amount to an accusation and defame an innocent participant. |
| C. Show the edge normally while silently applying its existing tier-weight demotion | Preserves a non-accusatory experience and follows the integrity system's invisible per-edge model. | Users cannot distinguish a lower-ranked result from an ordinary low-confidence result. |

**RATIFIED 2026-07-20: Option C.** An otherwise eligible suspected-ring edge remains in ordinary traversal and any returned path renders normally while silently consuming its existing per-attestation-edge-derived demotion through ordinary ranking. Ordinary publication, viewer-visibility, embargo, provenance-floor, role, query-shape, fan-safety, and ordinary result-window gates still apply. The demotion may lower ordinary rank or leave an edge outside a finite ordinary result window, but it creates no separate collusion-specific visibility threshold or unweighted bypass.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:90`.
  - Applied target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.03-credit-search-graph-traversal.md` — D-05 and resolved Q-03 establish ordinary presentation under silent per-edge demotion.
  - Applied cross-cut: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md` and `02.04-attestation-credit-confidence-cx.md` — ring detection remains internal-only while the re-derived weight affects ordinary traversal rank only.
  - Cited authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.04-attestation-credit-confidence/02.04.04-attestation-ring-collusion-detection.md` — invisible enforcement and per-edge, not cluster, demotion.
- **Replaced interim rule:** No collusion-specific hiding, mark, annotation, rationale, tooltip, notification, detector metadata, or topology-only Domain 24 case action exists. `02.04.04` remains invisible to every persona; CQ-03's constrained dispute-evidence interface and Domain 24's non-topological corroboration requirement remain unchanged.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-04 traversal-presentation decision.

### CQ-06 — Majority-by-share consent threshold

- **Entry type:** Product decision
- **Affected ledger finding:** `r-35[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** What share threshold authorizes an action under `majority-by-share`?

| Option | Pros | Cons |
|---|---|---|
| A. Strictly more than 50% of consented ownership share | Gives `majority` its ordinary meaning and blocks 50/50 ties without transferring control. | A 50% owner cannot proceed alone even when the co-owner is inactive. |
| B. At least 50% of consented ownership share | Allows a 50% owner to act. | Treats an equal split as a majority and can override an equally entitled co-owner. |
| C. A higher recorded supermajority, such as two-thirds | Better protects minority owners on consequential actions. | Changes the documented rule's meaning and adds further policy variants. |

**RATIFIED 2026-07-20: Option A.** An expressly recorded master `majority-by-share` rule authorizes a specific action only when affirmative **exact nominal master-owner share is strictly `> 50%`** of the full current consented master pool. Exactly 50% fails closed. Silence, refusal, unreachability, death, dissolution, points, display rounding, stale action approval, or an invalid ledger never supplies affirmative share or shrinks the denominator.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:104`.
  - Applied target and authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.03-master-rights-ownership.md` — records the strict exact-share predicate, action/version/scope binding, Control Summary evaluator, and edge cases.
  - Preserved foundation: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.02-ownership-ledger-validation.md` — owns exact rational shares, whole-ledger consent, version binding, lifecycle state, and 100% master-pool arithmetic.
- **Replaced interim rule:** An absent rule remains `unanimous`; `any-owner-non-exclusive` remains separate. CQ-06 controls only the recorded master-owner action predicate and does not override whole-ledger establishment/amendment consent, dispute freezes, encumbrances, licensing-policy vetoes, publishing/performer/sample permissions, release consent, takedown governance, payout calculation, or Domain 24 adjudication.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-06 majority-by-share threshold decision.

### CQ-07 — Default weight for temporally overlapping works

- **Entry type:** Product decision
- **Affected ledger finding:** `r-36[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** What default weight should a mashup receive when its embodied works overlap in time?

| Option | Pros | Cons |
|---|---|---|
| A. Prorate each work by its full overlapping duration, then normalize | Preserves an automatic suggestion. | Normalization changes the apparent contribution of simultaneously audible works and may conceal an arbitrary allocation rule. |
| B. Offer no default; require the declarant to enter exact weights totaling 100% | Avoids pretending that overlapping time determines ownership or allocation. | Adds work during declaration and can slow a common mashup flow. |
| C. Offer equal shares | Simple and comprehensible. | Arbitrarily treats unequal creative or legal contributions as equal. |

**RATIFIED 2026-07-20: Option B.** For a mashup whose embodied works overlap in time, the declarant supplies every positive exact-rational Recording→Work weight totaling exactly 100%. The system offers no duration calculation, normalization, equal-share fallback, inferred remainder, or display-rounded validation. Duration proration remains an editable proposal only for declared disjoint medley/live-set spans.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:105`.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.01-work-recording-duality.md` — owns positive exact link weights, disjoint-span proration, overlap declaration, works-never-merge, sample boundary, and mashup dual declaration.
  - Applied consumer: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/10-royalties-collections/10.03-calculation-recoupment/10.03.01-royalty-calculation-engine.md` — consumes valid as-of Domain 09 allocation before each separate work ledger and blocks invalid/incomplete allocation without authoring, normalizing, equal-splitting, inferring, or repairing it.
- **Replaced interim rule:** A weight declaration is neither ownership-ledger consent nor a master-action approval. Works remain separate; source-master lineage/sample declarations remain independently required. A sample is not a zero/small weighted component.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-07 temporal-overlap weight decision.

### CQ-08 — Writer-name equality for unclaimed-stub auto-merge

- **Entry type:** Product decision
- **Affected ledger finding:** `r-36[1]`
- **Classification:** Product — originally `needs-product-decision`; ratified to `verified-fixed` in the canonical ledger.

**Question:** What writer-name equivalence is sufficient to auto-merge two unclaimed work stubs?

| Option | Pros | Cons |
|---|---|---|
| A. Exact stored-string equality only | Lowest chance of false merge. | Fails to merge harmless variants caused by case, spacing, Unicode, or diacritics. |
| B. Canonical text equality: Unicode normalization, case-folding, whitespace normalization, and diacritic folding | Removes routine presentation variance without claiming that different people are the same person. | Can still conflate distinct writers with materially similar names. |
| C. Legal/stage identity resolution | Strongest identity assurance. | Unclaimed stubs commonly lack claimed identities, defeating the anti-proliferation purpose of their safe auto-merge exception. |
| D. Fuzzy-name similarity | Captures abbreviations and spelling variants. | Too aggressive for an irreversible-ish fusion; turns an equality rule into a probabilistic judgment. |

**RATIFIED 2026-07-21: Option B.** `writer-name-canonical-v1` is an order-independent exact set comparison over each retained asserted writer string: Unicode NFC → Unicode Default Case Folding → trim/collapse Unicode `White_Space` runs → Unicode NFD/remove every `Mn`/`Mc`/`Me` mark/NFC. Unicode 15.1 data is pinned; comparison is locale-independent. Exactly equal canonical sets may authorize an atomic auto-merge only when both records remain distinct current unclaimed, unconsented, conflict-free stubs with no distinct-person or unresolved identity/alias evidence. Original strings, source IDs, provenance, and merge lineage are retained. Canonical equality never resolves people; candidate signals, including fuzzy text, title, audio, identifiers, aliases, and legal/stage identity, cannot bypass the predicate. Strict subsets and canonical-unequal sets remain flags.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:106`.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.01-work-recording-duality.md` — sole source for the canonical predicate, eligibility conditions, atomic commit recheck, retained raw evidence, notifications, candidate/action boundary, and ordinary consented merge paths.
  - Applied cross-cut: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01-rights-registry-cx.md` — an ineligible, stale, or competing candidate aborts without link movement, ledger reconciliation, or partial mutation.
  - Applied recovery: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.04-rights-conflicts-disputes/09.04.01-conflicting-claim-detection.md` — a later incompatible assertion is ordinary claim-time detection; no auto-unmerge, auto-case, freeze, or identity adjudication.
- **Replaced interim rule:** Any claim, consent, conflict, canonical mismatch, identity/alias ambiguity, or competing merge before commit aborts atomically. A matched ISWC/ISRC, audio, or fuzzy signal can nominate a candidate only. An auto-merge says nothing about whether two writer assertions identify the same person; a later claim remains a claim under ordinary detection/dispute routing.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-08 writer-name-equivalence decision.

### CQ-09 — v1 territory and fact scope for term and moral-right status

- **Entry type:** Product decision
- **Affected ledger finding:** `r-40[0]`
- **Classification:** Product — originally `needs-product-decision`; ratified to `verified-fixed` in the canonical ledger.

**Question:** What territory and death-date coverage should v1 support for copyright-term and moral-right status?

| Option | Pros | Cons |
|---|---|---|
| A. US-first: support United States status from participant and estate records; show unavailable historical facts as unknown | Matches the confirmed primary market and limits initial legal-data scope. | Does not provide reliable answers for artists, authors, or uses centered in other territories. |
| B. US plus selected moral-rights territories such as France, Germany, and the United Kingdom | Captures the contrast between non-waivable, waivable, and limited moral-right regimes. | Introduces multiple legal frameworks and historical-data obligations before the platform has a global launch commitment. |
| C. Global, per-territory status wherever source data is available | Closest to the sources' territory-aware model. | High accuracy and data-provenance burden; partial coverage can be mistaken for a complete legal answer. |

**RATIFIED 2026-07-21: Option B.** V1 supports copyright-term/public-domain and moral-right status only for the **United States (`US`), France (`FR`), Germany (`DE`), and the United Kingdom (`GB`)**. Territory stays an explicit model dimension. A jurisdictional result is determinate only when the applicable rule and every required source-attributed fact are present: work/category/authorship data, all required death/publication/creation facts for term, and author-or-estate standing plus transfer/waiver facts for moral rights. Every other territory or missing/insufficient-fact case renders explicit `unknown` / not determined, never a global default, inferred waiver, or omitted result.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:110`.
  - Applied cross-cut: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.03-chain-of-title-lifecycle/09.03-chain-of-title-lifecycle-cx.md` — death/estate facts remain inputs; economic transfers never carry moral rights; unknown remains explicit.
  - Applied term authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.05-copyright-term-public-domain.md` — `US`/`FR`/`DE`/`GB` only; show jurisdiction, inputs, and effective rule; no clearance, licence, ownership decision, or release override.
  - Applied moral-right authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.06-moral-rights-attribution.md` — FR/DE non-waivability, GB waiver treatment, and US music non-applicability are jurisdiction-scoped; the platform records/routs facts but does not adjudicate author, estate, waiver, objection, or licence.
  - Market constraint: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/meta/constraints.md` — US-first remains the primary market; this is a bounded rights-compliance exception, not global launch scope.
- **Replaced interim rule:** A result for one jurisdiction never supplies another territory’s result. Missing death/historical/estate/waiver/category/rule evidence fails closed as `unknown` / not determined. Modern arrangements and the composition-versus-recording split remain separate. Estate standing stays with 09.03.04; licensing/release gates remain independent.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-09 territory/death-date/moral-right-scope decision.

## Product — Projects, Delivery, Marketplace & Distribution

### P-01 — Production-board stage vocabulary

**Affected ledger identity:** `r-44[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Which fixed production-stage vocabulary should every song board use?

| Option | Pros | Cons |
|---|---|---|
| A. Lock the current 10 stages | Preserves current prompts, lifecycle references, and board language. | Draft is explicitly unvalidated for beatmakers and session players. |
| B. Lock a validated shared vocabulary after practitioner review | Fits the intended users before downstream contracts harden. | Delays stage-enum-dependent specifications. |
| C. Split the vocabulary by production model | Represents electronic and session-led workflows more precisely. | Fragments lifecycle, prompts, and reporting. |

**OWNER-SELECTED 2026-07-21: Option B — validation-gated shared vocabulary.** One platform-owned, fixed, music-specific vocabulary remains the only permitted stage model. The candidate is not an enforceable lifecycle, prompt, release-readiness, reporting, or migration contract until the validation packet contains completed traces from the required beatmaker and session-player cohorts, dispositions for every mismatch, a passing result, and explicit product-owner approval of one immutable enum version with its semantic mappings. Validation may refine labels, definitions, ordering, initial semantic, approved-master terminal semantic, and prompt mappings; it may not introduce configurable columns, production-model-specific enums, a second stage machine, or unnormalised exceptions. **Closed on the policy, 2026-07-22.** The finding was "exact stage vocabulary still explicitly owner-open" — and it is not: the model, the gate, its cohort requirements, its pass conditions and the approval requirement are all decided and propagated. Candidate labels remain non-enforceable **because the gate is in force**, not because the decision is pending. Collecting the practitioner traces is downstream implementation work tracked in the validation packet — the same disposition already applied to A-03 and A-04's validation gates, both of which closed on their gate rather than on their evidence. P-02 and P-03 were out of this gate's scope and are separately resolved.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md` — § `Overview`; § `Deep Think Annotations`, `DT-01`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-index.md` — § `Decision Log`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-44.json`, finding `[0]`.

**Current interim rule:** Current vocabulary is provisional; downstream references must not present it as a fixed contract.

---

### P-02 — Large-catalogue production-board experience

**Affected ledger identity:** `r-44[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** How should the production board serve a catalogue of 60 or more songs?

| Option | Pros | Cons |
|---|---|---|
| A. Paginated board only | Keeps one familiar interaction model. | Board scanning weakens for label-scale catalogues. |
| B. Board below a threshold, catalogue table above it | Gives dense operations a suitable view while preserving board workflow for smaller projects. | Requires a threshold and two coherent views. |
| C. Exclude large catalogues from this feature | Keeps v1 bounded. | Leaves label operations without a defined workflow. |

**RATIFIED 2026-07-21: Option B — automatic board/table presentation.** In the selected project, band, cross-project, or "assigned to me" scope, count unique visible authorized Songs before local search, sort, or table-only filters. Render the craft board at **`0–59`** and the dense catalogue table at **`60+`**. The table is not a second catalogue, lifecycle, Release tracker, or configurable task board: it projects the same `Song.current_stage`, and each row action invokes the same per-Song authorized transition as board drag-and-drop. A Song with multiple Release memberships counts once; sequence, selected master, and release-specific edit remain membership data. No local filter switches a large scope back to board; no V1 user override, saved preference, URL mode, or bulk stage mutation exists.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md` — Behavior, Catalogue-Table Parity at Large Scale, edge cases, states, D-05, and resolved Q-03.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-cx.md` — CX-01 board/table transition parity and CX-02 derived Release-readiness boundary.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-index.md` — D-04.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-44.json`, finding `[1]`.

**Replaced interim rule:** Dense presentation preserves roster authorization, non-blocking capture/dismissal debt, advisory milestones, optimistic rollback, LWW actor-attributed notice, roster fan-out, and derived readiness for every linked Release. Server-mediated bounded results are required; pagination/cursor shape, page size, ordering, responsive behavior, and cache mechanics are deferred to `/write-be-spec` / `/write-fe-spec`. P-01 validation and P-03 re-approval remain independent.

**Resolution owner / stage:** Owner decision applied; `r-44[1]` verified fixed after source propagation and mechanical validation.

---

### P-03 — Approval behavior after a backward stage transition

**Affected ledger identity:** `r-44[2]`
**Classification:** Product decision — interim-replacement entry, **resolved**
**Owner / stage:** Owner decision applied 2026-07-21; `07.01.03` Q-02 was recorded as Agent/`/ideate-discover` Step 5 and is superseded by this owner ratification.

**Question:** After a song moves backward then re-advances, must superseded approvals be collected again?

| Option | Pros | Cons |
|---|---|---|
| A. Re-collect approvals | Ensures approvals match the reworked material. | Adds review delay and workload. |
| B. Auto-revive superseded approvals | Fastest return to a prior stage. | Can imply approval of changed work. |
| C. Re-collect only after material change | Preserves speed for administrative reversions. | Requires a material-change definition and audit trail. |

**RATIFIED 2026-07-21: Option C, read as version identity.** A backward stage transition marks later-stage approvals `superseded`, never deleted. On re-advance to that gate they **reinstate iff no new immutable version landed on the song between the backward move and the re-advance**; if any new version landed, the gate re-collects against its **current** approver set. The materiality predicate is version identity on the append-only timeline (`07.04.01` D-01, D-08) — the platform never asks a human whether a change was "material" and never certifies that nothing changed (`07.04.01` D-12).

This adds no new classifier and contradicts nothing. The new-version branch is `07.05.04` D-01 already doing its job (an approval pins an immutable version and never transfers); only the byte-identical administrative-reversion case needed a rule. Supersession and reinstatement are both **appended** events — the trail stays append-only per D-04, and no approval is ever retracted or rewritten. Already-pinned approvals are never rewritten to match a changed approver set; a departed approver still stalls the gate until the owner reconfigures.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.04-approval-gates-signoff-trail.md` — § `Behavior` (supersession scope), § `Edge Cases / Failure Modes` (re-advance with/without a new version, approver-set change), § `States` (`Reinstated`), § `Decisions`, `D-07`. Governing prior decisions are `D-01` and `D-04`; the earlier citation of `D-05` (proxy approvals) was mis-targeted and is corrected here.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.01-audio-version-control-lineage-timeline.md` — `D-01` immutability, `D-08` ingest order, `D-12` no certified zero delta.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md` — § `Edge Cases / Failure Modes`; resolved `Q-02`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-index.md` — `D-05`; resolved `Q-03`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.02-release-container-sequencing-assembly.md` — Release re-readiness consequence.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-cx.md` — CX-01 SQ5, CX-02 SQ5.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-44.json`, finding `[2]`.

**Replaced interim rule:** The rule is presentation-agnostic — a backward move from the board (`0–59`) or the catalogue table (`60+`) behaves identically, so P-02 is neither restated nor amended. Release readiness stays derived and recomputes from the resulting stage without its own re-approval rule. P-01 remains validation-gated and is untouched: this decision is written against the approved-master terminal **semantic**, never a candidate label.

**Resolution owner / stage:** Owner decision applied; `r-44[2]` verified fixed after source propagation and mechanical validation.

---

### P-04 — Default handoff-package contents and recipient checks

**Affected ledger identity:** `r-46[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** What must each default recipient handoff package contain and validate?

| Option | Pros | Cons |
|---|---|---|
| A. Define all six shipped recipient specs now | Makes the package builder fully deterministic. | Broad validation work before highest-frequency use is proven. |
| B. Define mastering and mix specs first; others are explicit follow-on specs | Covers primary workflows and bounds v1. | Remaining named defaults cannot yet validate. |
| C. Ship a generic package with optional fields | Fastest interface. | Contradicts recipient-spec-first product premise. |

**RATIFIED 2026-07-21: Option B, re-cut on authority rather than frequency.** `07.08.01` **originates** only the specs it owns — `mastering`, `mix`, and `archive`'s asset half — and **references** every spec another domain owns: `sync` → domain 11 (`11.02.01` clearance verdict), DSP destination → domain 12, engagement-purchased mix/mastering handover → `05.04.02` / `05.04.04`. Referencing means validating presence and surfacing the owner's verdict; it never restates the requirement, because `07.07.03` D-04 already locks that "two copies of third-party requirements would drift, and one would be wrong". `live` and `remix` are defined nowhere in the tree and get no invented contents — they become an **ownership** question (`07.08.01` Q-04), not scheduled authoring work.

Naming is not specifying: the first-run Empty state advertises only specs that have contents behind them. The recorded con for this option ("remaining named defaults cannot yet validate") is accepted and made explicit rather than hidden.

**Severity, stated because no option prose stated it:** every requirement introduced here **warns**; integrity failure remains D-04's only hard stop, per domain law "non-blocking is absolute" (`music-projects-collaboration-index.md` D-04). This ratification also repairs a **pre-existing contradiction** in the source, not created by P-04: the no-canonical edge case asserted a second block citing `07.04.02` D-06, which actually says refusing to guess "is not refusing to proceed". It now warns and offers a picker.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.01-handoff-package-builder-recipient-spec.md` — § `Behavior` ownership table; § `Edge Cases / Failure Modes` (no-canonical repair, unavailable referenced requirement, undefined spec); § `States` (`Empty`, `Blocked`); § `Decisions`, `D-04` and **`D-06`**; § `Open Questions`, `Q-01` (partly resolved) and new `Q-04`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.07-mix-master-workflow/07.07.03-mastering-workflow-loudness-targets.md` — `D-04`, the locked destination-spec ownership rule.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.03-metadata-completeness-readiness-score.md` — `Q-02`, which assigns the mastering spec here and the sync spec to domain 11.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md` — `D-04`, non-blocking is absolute.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-46.json`, finding `[0]`.

**Replaced interim rule:** Contents are no longer "not inferred" — they are **authored where owned and referenced where not**, which is why nothing was invented for `live`, `remix`, or any third-party destination. **P-05 (`r-47[0]`) is deliberately untouched:** this decision fixes who owns a spec, not which target facts readiness scores against, and the two must adopt one shared pin-vs-live rule when P-05 resolves (`07.08.01` D-03 pins; `07.08.03` requires a live target). P-01/P-02/P-03 are untouched.

**Resolution owner / stage:** Owner decision applied; `r-46[0]` verified fixed after source propagation and mechanical validation.

---

### P-05 — Readiness-target facts and ship dependency

**Affected ledger identity:** `r-47[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Which target facts must readiness score, and can readiness ship before those target specs exist?

| Option | Pros | Cons |
|---|---|---|
| A. Define every target fact now | Makes each readiness result computable. | Couples work to unresolved release, sync, and handoff policy. |
| B. Evaluate externally owned specs only; block shipping until they exist | Preserves domain boundaries. | Readiness remains unavailable until dependencies complete. |
| C. Define a generic score independent of target | Gives an early indicator. | Loses the stated gap-list-against-target meaning. |

**RATIFIED 2026-07-21: Option B, re-cut per target on authority and read as feature sequencing (not user-blocking).** This is `07.08.01` D-06 (P-04) applied to readiness targets, because the score's targets and the builder's recipient specs are **one list under two names**. `07.08.01` **authors** `ready-for-mastering` and `ready-for-mix-handoff`; `ready-for-DSP-release` **references** domain 12 and `ready-for-sync-pitch` **references** domain 11. Referenced severities are **consumed as this feature's D-02 weights, never re-derived** — a second copy would drift (`07.07.03` D-04) and consequence belongs to whoever owns the harm (domain D-05, "measure and show; never judge").

**"Block shipping" is recorded as feature sequencing, never user-blocking.** Readiness ships per target as each becomes available. An unowned target is simply **not offerable** — the same treatment `07.08.01` gives an undefined recipient spec — so nothing blocks a user and no placeholder target is advertised. The user-blocking reading would breach domain `D-04` ("non-blocking is absolute"), `07.08.01` D-04 ("everything else warns… without exception"), and P-04's own ruling that an unavailable referenced requirement "warns and names the owning domain; never blocks".

**Pin-vs-live is settled (`07.08.03` D-08), which was the only genuinely new work here.** The score and the package are a **view** and a **record** over one target-spec store with one version identity: the score re-evaluates live and names the fact that moved; the package pins its spec version alongside its contents and is never retroactively re-judged. Domain 12 resolved the identical shape by dissolving it (`12.02.02` D-01, `12.01.02` D-07/DT-09 — "a store has one version number, so pinning one pins both"). 07 does **not** inherit 12's authority to hold dispatch.

**Option C was foreclosed, not weighed:** `07.08.03` DT-01 rejects a target-independent score **"twice over"** — *"complete for what?"* and *"'76%' averages a legal landmine with a nice-to-have and calls the result precision"* — and adopting it would delete D-01, D-02, D-03 and CX-04 simultaneously. **Option A** would have reopened the just-ratified P-04 D-06 and could not express DSP readiness without contradicting `12.01.02` D-01 (per-store findings, no global valid flag).

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.03-metadata-completeness-readiness-score.md` — § `Behavior` (target ownership table, pin-vs-live), three new edge cases, § `Decisions` **`D-07`** and **`D-08`**, resolved `Q-02`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.01-handoff-package-builder-recipient-spec.md` — `D-06` (the rule being applied) and `D-03` (now pinning the spec version too).
- `.memory/wiki/specs/ideation/12-release-distribution/12.01-release-builder/12.01.02-metadata-validation-conformance.md` — `D-07`, `DT-09`, and `D-01` (per-store findings).
- `.memory/wiki/specs/ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02.02-per-partner-profile-conformance.md` — `D-01`, one knowledge store.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/music-projects-collaboration-index.md` — `D-04` non-blocking, `D-05` measure-don't-judge.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-47.json`, finding `[0]`.

**Replaced interim rule:** Target facts are no longer "not selected" — they are **owned per target**, with only `ready-for-DSP-release` fully scoreable today, `ready-for-sync-pitch` partially, and the two 07-authored targets awaiting their fact lists. A **set mismatch is recorded, not resolved**: P-04 fixed eight recipient specs while this file names four targets; `archive`, engagement-purchased, `live`, and `remix` have no target and are not offered. Also corrected here: `07.08.03` routed ISWC to domain 12, but on disk ISWC is `09.06.01` (captured and reconciled, never issued) and ISRC/UPC is `12.07`. **`07.08` Q-01 / domain Q-03 — whether readiness ever hard-blocks — remains the owner's separate open call and is not decided by P-05.** P-01 (pending), P-02, P-03, P-04 untouched.

**Resolution owner / stage:** Owner decision applied; `r-47[0]` verified fixed after source propagation and mechanical validation.

---

### P-06 — Full-melodic-loop declaration treatment

**Affected ledger identity:** `r-48[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** How should a declared preset that is actually a full melodic loop be classified?

| Option | Pros | Cons |
|---|---|---|
| A. Reclassify as library-loop and route to clearance review | Makes altered clearance obligations explicit. | Adds review friction and a new class. |
| B. Keep declared class but flag it | Preserves uploader choice while warning consumers. | Leaves classification and clearance ambiguity. |
| C. Reject until resubmitted as a loop | Strongest category integrity. | Creates avoidable resubmission burden. |

**RATIFIED 2026-07-21: Option B — flag it, never reclassify.** The declaration stands as made; the platform never overrides a user's stated type. A disputed type uses the **existing attributed type-conflict path** (`07.08.04:72`) where both types are kept and surfaced rather than auto-merged, and the mitigation moves upstream: the capture prompt asks **enumeratively** — naming loop, one-shot, drum hit, vocal, break, stem, bought beat per `11.05.01` D-05 — so the ambiguity surfaces at declaration time instead of hiding behind a bare "preset". Recorded as `07.08.04` **D-08**.

**Option A was rejected as a boundary violation, not a trade-off.** It breaches `07.08.04` D-03 ("07 owns capture and propagation; 09/11 own clearance") and the ratified P-04 D-06 / P-05 D-07 originate-vs-reference rule — the defining axes belong to domain 14 (`14.04.02` DT-01: "a preset makes no sound. It is a settings file"; `14.04.01` DT-07 on melodic loops as compositions) and the clearance consequence to `11.05.01`. It also breaches domain D-05 ("measure and show; never judge"), has no declarer slot under D-07's append-only model, and presupposes a **detector that four separate decisions reject** (`07.08.04` Q-04, `05.06.04` DT-02 — "the honest posture is declaration, not detection", `11.05.01` DT-02, `11.02.03` D-01). Neither `library-loop` nor `clearance review` occurs anywhere in the tree.

**Option C was foreclosed.** It breaches domain D-04, which names "**the capture prompt never blocks**" as an enumerated instance, and `07.08.04` D-02 locks that this feature *is* a capture prompt. It also breaches `11.05.01` D-02 (no hard gate for missing declarations) and is self-defeating: a rejected declaration returns the region to `sources not reviewed`, destroying the fact it demanded.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.04-source-declaration-samples-ai.md` — § `Edge Cases / Failure Modes`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-cx.md` — § `Cross-Cut Map`, `CX-02`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-48.json`, finding `[0]`.

**Replaced interim rule:** "No automatic reclassification, acceptance, or rejection" is now the permanent contract rather than a holding position — the platform does none of the three. The residual gap was never a taxonomy gap: the literal `[PENDING]` marker sat only in the **What User Sees** column, i.e. a capture-surface UI question, and it is now answered. `07.08.04` Q-03 / `11.05.01` Q-02 (auto-declaring WeJammin library purchases from domain 14's terms record) remains separately open and must be answered together with `11.02.03` Q-03.

**Resolution owner / stage:** Owner decision applied; `r-48[0]` verified fixed after source propagation and mechanical validation.

---

### P-07a — Re-gating after terms are re-versioned

**Affected ledger identity:** `r-50[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When access terms are re-versioned, which current holders must acknowledge the new version before their next vault access?

| Option | Pros | Cons |
|---|---|---|
| A. Re-gate every current holder | Uniform acknowledgement and simple rule. | Disrupts holders whose access and terms were not materially affected. |
| B. Re-gate only holders affected by an owner-flagged material term change | Limits interruption to materially changed obligations. | Requires a material-change definition and durable audit flag. |
| C. Never re-gate existing holders | Least interruption. | Leaves continued access under terms the holder never accepted. |

**RATIFIED 2026-07-21: Option B — confirming locked source at owner level, not inventing policy.** B is already `07.03.03` D-07 verbatim: terms re-versions **do not** re-gate existing holders by default and acceptance records stay version-pinned (D-03); only an **owner-flagged material change** re-gates, and only at the holder's **next access — never mid-transfer**. Denial stays explained per D-06.

**Materiality here is owner-declared, never platform-detected**, which is what keeps it clear of the semantic reading **P-03** rejected: there the only available judge was the wrong party, whereas here the owner authored the terms change and is the correct party. It also reuses D-07's existing declarative definition rather than minting a fourth materiality concept alongside `02.04.01` D-10.

**The finding's real defect was a stale marker, not a missing policy.** The immutable manifest's fix reads "Update CX SQ5 to reference `07.03.03` D-07 instead of PENDING" — the parent CX file still said the question was open while its `[DEEP]` child had closed it. That marker is repaired. Q-04 moves from Agent-resolved to owner-ratified.

**Option A was rejected as a recorded reversal:** `07.03.03` DT-04 already tested and **rejected** blanket re-gating on two grounds — it interrupts live work ("a mix engineer mid-render suddenly locked out is the D-04 revocation failure in reverse") and trains users to click through gates without reading. **Option C** deletes D-07's second clause and the "ordinary" qualifier A-04 preserved, leaving holders operating under terms they never accepted while the evidence trail — the feature's stated deliverable per D-05/DT-03 — asserts consent to a superseded version.

**Blocking distinction preserved:** domain D-04's absolute non-blocking rule governs creative surfaces and enumerates board, capture prompt, QC and naming — **no vault entry**. `07.03.03` D-04's immediate fail-closed revocation is a locked, legitimate security property. P-05's "feature sequencing, not user-blocking" reading is surface-specific to `07.08.03` and is **not** transplanted here.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-cx.md` — § `Cross-Cut Details`, `CX-03: Invitation ↔ Asset Vault (NDA gating)`, state-transition conflict.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.03-rights-aware-asset-vault-nda-gating.md` — § `Behavior`; § `Decisions`, `D-07`; § `Open Questions`, `Q-04`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-50.json`, finding `[0]`.

**Replaced interim rule:** The prior wording ("re-versioning does not itself establish a re-gating policy") negated a decision that was already locked on disk; D-07 does establish one, and it now reads as ratified rather than pending. **Deliberately left open** as `07.03.03` **Q-05**: what the material-change flag records, the terms-version diff behind the "showing what changed" promise, who holds the flag when song owner ≠ master owner (blocked on Q-02, which A-04 also left open), and re-gating a holder whose access profile is still an unapproved A-04 validation candidate.

**Resolution owner / stage:** Owner decision applied; `r-50[0]` verified fixed after source propagation and mechanical validation.

---

### P-07b — Downgrade-notification audience

**Affected ledger identity:** `r-50[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a contributor is downgraded, which people receive the access-change notification?

| Option | Pros | Cons |
|---|---|---|
| A. Notify the affected contributor only | Honest notice while limiting disclosure of team-role changes. | The owner must infer whether a wider coordination notice is needed. |
| B. Notify every roster member | Makes role changes transparent to the full team. | Needlessly discloses a potentially sensitive demotion and creates noise. |
| C. Notify only if the contributor encounters denial | Avoids explicit demotion messaging. | Delays notice and conceals a material loss of access. |

**RATIFIED 2026-07-21: Option B, scoped — the affected person *and* the roster.** Recorded as `07.03.01` **D-18**. A downgrade is not a special case of D-09, it is an **instance** of it: "every roster write is announced — to the named party, **and to the existing roster**." The roster audience is scoped by **D-16** to members who can already see that person's entry, so a confidentiality-restricted roster discloses nothing D-16 deliberately hides.

**This reverses the queue's own prior recommendation, on evidence.** That recommendation (A) rested on a "sensitive demotion" premise with **no source anywhere in the tree** — no file in domain 24 classifies a role change as sensitive, and `07.03.01` D-16 makes personnel **default-visible** to roster members. A would therefore be an explicit carve-out from D-09, not a neutral reading of it, and D-09's stated purpose — defeating the `meta/personas.md` Producer anti-persona by *noticing* rather than blocking — applies at least as strongly to stripping a co-writer's stem access before a splits conversation as to a routine add.

**The coordination argument is decisive.** Per `07.01.03` DT-03 work is *rostered*, not assigned — the roster is the team's only coordination record. Meanwhile `07.03.03` D-04 has already killed the downgraded party's live URLs and download tokens, so under A co-contributors keep routing stems to someone whose access is dead, and the correction travels by WhatsApp.

**Option C was struck rather than weighed:** it contradicts written `[DEEP]` behavior and locked user-facing copy at `07.03.01` ("withholding it is how a quiet demotion stays quiet"), and makes the only notice arrive as a mid-work lockout — the exact failure `07.03.03` DT-04 named. Note precisely: C does not violate `07.03.03` D-06, which governs what the denial *screen* renders, not whether advance notice is sent.

**Audience only.** Delivery cadence, batching and salience stay with the global notification cross-cut that `07.03.01` already consumes — re-authoring them here would create the second copy `07.07.03` D-04 forbids (P-04/P-05: reference, never restate).

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-cx.md` — § `Cross-Cut Details`, `CX-01: Contributor Roster ↔ Asset Vault`, notification-fan-out conflict.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.01-contributor-roster-role-assignment.md` — § `Decisions`, `D-09`; § `Open Questions`, `Q-04`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-50.json`, finding `[1]`.

**Replaced interim rule:** The affected-person half was never actually open — `07.03.01` already locked it in a `[DEEP]` file; the finding fired on a stale `[PENDING]` marker in CX-01 SQ4, now repaired. Only the third-party audience was genuinely undecided, and it is now D-18. **Deliberately left open** as `07.03.01` **Q-05**: `D-11` band-derived access is computed live from current membership, so a member leaving a band loses vault access with **no roster write and no actor** — an audience rule phrased around a write does not reach it. The same gap covers whether D-18 governs *End involvement* removal (D-13), whose audience D-13 leaves unstated. `07.03.01` Q-04 / `07.03.03` Q-02 (roster-write provenance under a label deal) bounds any "the owner" phrasing and is **not** resolved here.

**Resolution owner / stage:** Owner decision applied; `r-50[1]` verified fixed after source propagation and mechanical validation.

---

### P-08a — Comparable-sales originality aggregate

**Affected ledger identity:** `r-56[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Which aggregate originality state should the marketplace derive from component disclosures for comparable-sales matching?

| Option | Pros | Cons |
|---|---|---|
| A. Enumerated aggregate derived from components | Makes comparable-sales bucketing deterministic and inspectable. | Requires explicit component-to-aggregate and unknown mappings. |
| B. Component vector only | Preserves source-detail granularity. | Cannot establish a deterministic comparable-sales key. |
| C. Seller-entered aggregate label | Simplifies listing entry. | Weakens provenance and makes the comparable key manipulable. |

**RATIFIED 2026-07-21: Option A, constrained to a nominal enum.** `13.02.03` **D-05** authors an enumerated aggregate originality value derived from the component vector, filling the third slot of the comp key `model × condition × originality` that was already locked in four places (`13.04` index D-01, `13.02.01`, `gear-marketplace-cx.md` CX-02, `13.04.01`) but had nothing to fill it.

**The constraint is load-bearing:** the enum is **nominal, never ordered**. `13.02.03` D-04 states originality is "a factual axis, **not a quality scale**" — a modification raises value on studio gear and lowers it on vintage instruments — so an ordered severity scale would contradict a locked decision. The aggregate partitions comp sets; it does not rank units.

Authored on the owning axis and **consumed** by `13.04.01`, per the cross-domain rule (`07.07.03` D-04, P-04 D-06, P-05 D-07); a value derived inside matching logic would be the second copy that rule forbids. The component vector is untouched — the aggregate is a projection of it (D-01 stands). Derivation follows the sibling axis's "derive, don't ask" precedent (`13.02.01` D-05) rather than asking the seller for a label the comp key would then depend on.

**Option B** contradicts the locked comp key and, at 3ⁿ cells over a 7–11 component set, leaves nearly every bucket at n≤1 — forcing disclosed widening on essentially every query and re-opening whether the price guide is worth building. **Option C** makes the comp key manipulable by the party with the incentive and abandons the derive-don't-ask precedent.

**Exact sources:**
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.03-modification-originality-disclosure.md` — § `Behavior`; § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02-condition-originality-disclosure-cx.md` — § `Cross-Cut Map`, `CX-02`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.01-condition-grading-scale.md` — § `Decisions`, `D-10`; § `Cross-Cut Notes` (condition-grading relationship only).
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-56.json`, finding `[0]`.

**Replaced interim rule:** The prior wording suspended a locked decision — the comp key already requires an originality value, so "no aggregate is assumed" left `13.04.01` D-03 and `13.04.03` unexecutable. **Deliberately left open** as `13.02.03` **Q-03** (per-component materiality ranking; the Unknown mapping, where D-02 makes Unknown first-class and forbids penalising it into a false "Original"; a declaration-complete predicate, which grade has and originality does not; and non-derivable classes — free-text fallback, unmatched listings, bundles, parts) and **Q-04** (versioning of the enum and its mapping, plus materialising the value at sale so comps stay keyed to the version in force then).

**Two citation defects in this entry are corrected for the record:** it cited `13.02-…-cx.md` CX-02, which is *Flaw Disclosure ↔ Evidence Pack* and contains no comp key — the comp-key CX-02 is in the **domain** file `gear-marketplace-cx.md`. And it cited `13.02.01` D-10, which is the offer-void asymmetry, i.e. **P-08b's** evidence, not P-08a's.

**Resolution owner / stage:** Owner decision applied; `r-56[0]` verified fixed after source propagation and mechanical validation.

---

### P-08b — Live-offer outcome after a material originality change

**Affected ledger identity:** `r-56[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** What happens to a live offer when a listing’s originality state changes materially?

| Option | Pros | Cons |
|---|---|---|
| A. Void offers after a material downgrade; preserve and notify after an upgrade | Protects buyers when value-relevant evidence worsens without penalizing a seller improvement. | Requires a materiality rule and notification contract. |
| B. Preserve all offers with a disclosure notice | Retains transaction momentum. | Buyer consent may not reflect the revised originality state. |
| C. Void every offer after any originality change | Simple and conservative. | Cancels harmless corrections and creates avoidable churn. |

**RATIFIED 2026-07-21: Option C — void on any originality change, in either direction.** Recorded as `13.02.03` **D-06**. `13.03.02` principle 3 already holds that an offer is made against a stated listing and any material change to that statement voids it; C applies it literally.

**Option A cannot be ratified as worded.** Its predicate — "material **downgrade**" versus "**upgrade**" — presumes an ordering on an axis `13.02.03` D-04 explicitly forbids, and it would contradict the nominal enum ratified in P-08a. Its stated rationale ("value-relevant **evidence** worsens") also has no substrate here: unlike the flaw axis, `13.02.03` mandates no photos, so there is nothing to ground a severity test. **Option B** contradicts `13.03.02` principle 3 directly and would make the originality axis weaker than the post-purchase case, inverting the protection gradient.

C's cost is real and is accepted with a mitigation: voiding on an improvement is blunt, so per `13.02.02` D-04/D-11 the framing is **seller-protection** — a seller correcting a disclosure late is doing the right thing late and must not be punished. The void is presented as a release with the before/after diff and a one-tap re-offer path, never as a penalty. C requires **no direction test and no materiality definition**, which is why it is the only canonical option adoptable with zero invention.

**Exact sources:**
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.03-modification-originality-disclosure.md` — § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.02-mandatory-flaw-disclosure.md` — § `Behavior`; § `Decisions`, material-flaw offer treatment.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-56.json`, finding `[1]`.

**Replaced interim rule:** An originality change now has a defined offer outcome. **Recorded, not decided here:** `13.05.01`'s offer shape carries **no disclosure-version pin**, so the "offer references the version it was made against" assertion in the domain CX is currently unsupported — routed to `/write-be-spec`. Two *adjacent* stale CX markers were found and are **separate** findings, not part of P-08b: the grade auto-downgrade marker and the post-purchase disclosure-change marker, the latter already answered by `13.02.02` D-11 and `13.03.02` D-08/D-09.

**Resolution owner / stage:** Owner decision applied; `r-56[1]` verified fixed after source propagation and mechanical validation.

---

### P-09 — Local-pickup settlement branch

**Affected ledger identity:** `r-59[0]`
**Classification:** Product decision — interim-replacement entry
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Does money move through the platform for a local-pickup transaction?

| Option | Pros | Cons |
|---|---|---|
| A. Platform-settled pickup | Supports escrow, fee collection, ownership transfer, and evidence flow. | Adds payment, custody, refund, and compliance responsibilities. |
| B. Off-platform cash pickup | Minimizes platform financial role. | Cannot assume platform settlement, escrow, fees, or automatic ownership transfer. |
| C. Seller chooses per listing | Flexible across local norms. | Makes buyer expectations and every downstream branch more complex. |

**RATIFIED 2026-07-21: Option C — the seller chooses per listing.** Recorded as `13.11` **D-04**. This confirms what the tree already implements rather than selecting a new branch: `13.12` ships a per-listing pickup boolean defaulting `off`, `13.03.01` offers ship / local pickup / both, and `13.06.02`, `13.02.04`, `13.06.05` and `13.08.01` are each already written as two branches on "where money moved".

**Both global rules were rejected for concrete cost.** Platform-settled-always imposes marketplace-facilitator sales-tax and 1099-K obligations on every cash handshake plus custody and refund liability. Off-platform-always strands the escrow, evidence-baseline and ownership-chain machinery those files already specify for the settled branch.

**The chain follows the money.** On the settled branch `13.06.05` writes the ownership transfer at settlement as normal. On the off-platform branch there is no settlement event to hang it on, and the parties use the manual handshake `15.01.03` D-01 already names as "the fallback for off-platform trade". The sources currently disagree about this — `13.06.05` DT-11 reasons the platform still knows enough, `13.06.02` says there is no settlement to attach — and that conflict is recorded as `13.11` Q-04 rather than silently resolved.

**Exact sources:**
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.11-local-pickup-meetup-safety.md` — § `Deep Think Annotations`, `DT-01`; § `Open Questions`, `Q-01`; § `States`; § `Edge Cases / Failure Modes`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md` — § `Decisions`; § `Cross-Cut Notes`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-59.json`, finding `[0]`.

**Replaced interim rule:** The settlement branch is now selected per listing, so nothing is fabricated in either direction. **Deliberately left open:** `13.11` **Q-04** (how the off-platform branch's provenance gap is presented — never implying it produces an equivalent ownership chain) and **Q-05** (settled-branch residuals: whether the inspection window applies to an item inspected in person; unilateral, contradictory or absent pickup confirmation, undefined everywhere; and which address sources sales tax on a pickup).

**Resolution owner / stage:** Owner decision applied; `r-59[0]` verified fixed after source propagation and mechanical validation.

---

### P-10a — Rights-takedown effect on existing holders

**Affected ledger identity:** `r-62[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a digital good is taken down for a rights reason, what access and notice should existing holders retain?

| Option | Pros | Cons |
|---|---|---|
| A. Preserve a holder record and send a rights-takedown notice; remove further delivery | Separates the legal event from ordinary product revision and preserves auditability. | Requires explicit archive, access, and notification states. |
| B. Treat the takedown as an ordinary revision | Reuses one lifecycle path. | Obscures the rights event and can mislead holders. |
| C. Remove the prior version and holder record | Simplifies operations. | Breaks purchased-library expectations and auditability. |

**RATIFIED 2026-07-21: Option A — confirming behaviour already locked in two halves.** Recorded as `14.03.02` **D-04**, joining `14.09.03` D-02/D-04 and `14.04.01` D-08/D-09: a rights takedown stops onward delivery immediately while the holder's entitlement row **persists with its date and reason** and never silently disappears.

**A's stated benefit was already delivered by source, not by A.** `14.04.01` carries the section heading verbatim — *"Removal is not deletion, and a rights takedown is not a revision"* — so separating the legal event from a product revision was never the open part. What was open was that the resolution had propagated one direction only and `14.03.02` still carried a `[PENDING]`.

**Option B** proposes reusing "one lifecycle path" when two are already locked, so there is no single path to reuse. **Option C** contradicts at least seven locked decisions and leaves put-back after an unopposed counter-notice undefined — the material returns, and nothing says whether already-sent holder notices are retracted or delivery restored.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-versioning-updates-legacy-archive.md` — § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.01-sample-loop-pack-catalog.md` — § `Decisions`, `D-08` and `D-09`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/digital-goods-marketplace-cx.md` — § `Cross-Cut Details`, `CX-26`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-62.json`, finding `[0]`.

**Replaced interim rule:** The outcome is selected and now stated in `14.03.02` rather than only in `14.04.01`/`14.09.03`. **Deliberately left open** as `14.03.02` **Q-04**: (a) the **archive-fetch posture** — the holder record persists and onward delivery stops, but whether an existing holder may still fetch a build they already hold is unstated anywhere, and it is the difference between "you keep what you bought" and "you keep a receipt"; (b) **takedown granularity** — whether a claim against one asset withdraws the containing pack.

**Resolution owner / stage:** Owner decision applied; `r-62[0]` verified fixed after source propagation and mechanical validation.

---

### P-10b — Ordinary revision effect on existing holders

**Affected ledger identity:** `r-62[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a seller publishes an ordinary content revision, how should the platform preserve the prior version for existing holders?

| Option | Pros | Cons |
|---|---|---|
| A. Append the revision, preserve a legacy archive, and notify holders | Gives holders continuity and a clear version history. | Requires archive retention and notification rules. |
| B. Replace the prior version in place | Simplifies the library surface. | Loses holder-visible history and access to prior content. |
| C. Require repurchase for every revision | Minimizes entitlement complexity. | Undermines buyer expectations for seller-issued updates. |

**RATIFIED 2026-07-21: Option A — confirming the locked contract, not choosing among live options.** Recorded as `14.03.02` **D-04** alongside its existing D-01 (every version a buyer was entitled to remains permanently fetchable) and D-02 (updates are offered, never forced; withdrawal is not deletion), with `14.04.01` D-09 (a revision never removes a held asset).

**The premise behind this entry's recommendation was sound but under-cited** — it rests on `14.04.01` D-09, which the entry never named. **Option B** contradicts five locked decisions including permanent fetchability and "an asset in use must not vanish". **Option C** contradicts D-02 (a paywall is neither an offer nor an update) and re-opens a resolved question about the required displayed version range.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-versioning-updates-legacy-archive.md` — § `Behavior`; § `States`; § `Open Questions`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/digital-goods-marketplace-cx.md` — § `Cross-Cut Details`, `CX-26`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-62.json`, finding `[1]`.

**Replaced interim rule:** Append-preserve-notify is the contract, as it already was in three files. **Deliberately left open:** retention **duration and cost** (`14.03.02` Q-01 — "forever is a promise nobody has costed") and whether **content packs version at all** (Q-03), which bounds how often this path is exercised. Both are genuinely owner-open; the append-vs-replace-vs-repurchase framing was not.

**Resolution owner / stage:** Owner decision applied; `r-62[1]` verified fixed after source propagation and mechanical validation.

---

### P-11 — Departed contributor’s accruing pack share

**Affected ledger identity:** `r-63[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** What happens to a confirmed contributor’s accruing share after they depart or are erased?

| Option | Pros | Cons |
|---|---|---|
| A. Hold share in escrow for a future claim; do not redistribute | Preserves earnings claim and avoids unilateral enrichment. | Requires legal retention, claimant, and escheat treatment. |
| B. Redistribute among remaining contributors | Clears payable balance. | Alters confirmed economic split without departed-party consent. |
| C. Forfeit to seller/platform | Simple accounting. | High fairness and legal risk. |

**RATIFIED 2026-07-21: resolved as scoped — the confirmed split row survives unchanged.** Recorded as `14.10.03` **D-05**: a departed or erased contributor's row is never zeroed, redistributed among the remaining parties, or forfeited to the seller or platform.

**The question's premise is out of scope, and that is the finding.** It asks about an **accruing** share, but `14.10.01` (Pool Funding) and `14.10.02` (Download Attribution & Accrual) are both **WONT** in the MoSCoW ledger, and `14.10.03` survives at SHOULD *explicitly decoupled* from the pool. Per-download accrual is not being built, so there is no accruing balance to escrow, redistribute or forfeit. What remains is a direct-sale share already owed, handled by the ordinary unpayable-balance path without altering the split.

**Both alternatives were already foreclosed by locked decisions elsewhere.** Redistribution: `09.02.04` **D-14** — "an amendment **cannot produce a 0% row**; zeroing a party is removal-by-agreement" — makes silent reassignment the removal-without-consent loophole. Forfeiture: `10.04.03` **D-01** and `royalties-collections-index.md` **D-09** forbid unpayable money becoming platform float, revenue or a rounding sink.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.03-multi-contributor-pack-splits.md` — § `Edge Cases / Failure Modes`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.02-download-attribution-accrual.md` — § `Behavior`; § `Cross-Cut Notes`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-63.json`, finding `[0]`.

**Replaced interim rule:** No funds are redistributed or forfeited — now by decision rather than by assumption — and **no platform escrow contract was created**, because the premise requiring one is cut from scope. **Deliberately left open** as `14.10.03` **Q-04**: GDPR erasure versus payout retention, which is a security/legal question rather than a split-policy one. **If `14.10.01`/`14.10.02` are ever promoted from WONT, the accruing half of this question returns** and will need an escrow/claim mechanism that does not exist today.

**Resolution owner / stage:** Owner decision applied; `r-63[0]` verified fixed after source propagation and mechanical validation.

---

### P-12 — Preset compatibility break remediation owner

**Affected ledger identity:** `r-64[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a host update breaks a purchased preset bank, who owes remediation?

| Option | Pros | Cons |
|---|---|---|
| A. Treat it as external compatibility; flag library entry, no default refund | Matches a no-fault host change. | Buyer may receive no remediation. |
| B. Treat it as a vendor conformity defect | Clear vendor obligation or refund path. | Assigns vendor liability for third-party changes. |
| C. Platform goodwill remedy | Improves buyer trust. | Creates discretionary cost and inconsistent expectations. |

**RATIFIED 2026-07-21: Option A — external compatibility change; flag, disclose, never revoke.** Recorded as `14.04.02` **D-04**. No default refund and no vendor conformity obligation attach to a third party's act.

**The substance was already locked in a `[DEEP]` Must feature this entry never cited.** `14.07.01` **D-04**: *"'Perpetual' is a promise about the entitlement and the artifact, **not a guarantee of function** — stated narrowly at the buy button, with the gap disclosed."* And **D-06**: a third-party state change means *permit + mandatory disclosure + never revoke*. Ratifying A into 14.04.02 gives OS drift, lapsed dependencies and host breaks **one consistent story** rather than three.

**Option B** assigns vendor liability for a third party's act, against `14.09.02`'s supply-time conformity scope. **Option C** creates discretionary cost and inconsistent expectations on a low-value product with no source-defined trigger.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.02-preset-patch-catalog.md` — § `Behavior`; § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.01-catalog-compatibility/14.01.02-format-os-daw-compatibility-matrix.md` — § `Behavior`; § `Cross-Cut Notes`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.02-digital-refund-eligibility-adjudication.md` — § `Decisions`; § `Cross-Cut Notes`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-64.json`, finding `[0]`.

**Replaced interim rule:** The library entry stays flagged **by decision**, and the remediation owner is settled: nobody owes a remedy for a third party's change, and the buyer keeps entitlement and artifact while losing function — both facts stated. **Deliberately left open** as `14.04.02` **Q-04**: what *triggers* the compatibility flag. `14.01.02`'s matrix records **declared** host-version facts, not observed breakage, so the only path that exists today is buyer-reported; whether the platform ever asserts a break proactively, and on what evidence, is undecided — asserting one without evidence would be the platform judging a third party's product.

**Also recorded:** `14.04.02` Q-03 (refund policy for unenforceable content) appears **stale** — `14.09.02` DT-05 already answers it in the more generous direction ("the refund **is** the trial"). That is a separate reconciliation, not part of P-12.

**Resolution owner / stage:** Owner decision applied; `r-64[0]` verified fixed after source propagation and mechanical validation.

---

## Product — Marketplace, Gear & Registry

### DQ-MG-01 — Bulk-import quality bar

- **Affected finding:** r-57[0]
- **Classification:** warning / contradiction — **deferred-with-interim-rule**
- **Owner / stage:** Product owner; `/ideate-validate` (domain 13 Q-13).
- **Question:** Which quality bar applies to bulk-imported gear listings before individual inspection?

| Option | Pros | Cons |
|---|---|---|
| A. Keep the normal per-unit quality bar; do not publish until each unit is completed | Strongest buyer evidence and uniform listing quality | Blocks large existing inventories and defeats bulk-import onboarding value |
| B. Allow disclosed, lower-evidence bulk publication until label print or unit handling | Preserves catalog throughput while telling buyers what is missing | Creates a two-tier listing experience and requires trust-weight reduction |
| C. Allow bulk publication only for specified seller classes or catalog-matched units | Limits low-evidence publication to more controlled cases | Adds eligibility policy and may exclude legitimate small sellers |

**RATIFIED 2026-07-21: per-axis confirmation — the dilemma was false.** Q-13 names four axes and the queue collapsed them to one scalar; any scalar answer silently overwrites at least one. The four resolve independently and are each already locked: **model binding does not relax** (`13.01.04` D-05/D-08, DT-11 — bulk *raises* it); **grading relaxes in a bounded, disclosed way** (`13.02.01` D-11 — seller-set per-upload default, `bulk_defaulted`, reduced comp weight, never an exemption); **disclosure does not relax and admits no substitute** (`13.02.02` D-08, DT-14 — templating prohibited, absence priced not gated); **unit media does not relax but its capture moment moves** to label print (`13.03.01` D-06, DT-09). The rule in one line: *the bar does not bend; the evidence moment moves; absence is disclosed, never gated.*

**Option B could not be ratified as worded.** "Lower-evidence" and "two-tier" reverse the meaning of the decisions B claims to confirm, and `13.03-listings-inventory-cx.md` explicitly prohibits a shadow listing tier — the interim rule survives that CX *only* because it is not a second obligation tier. Two of B's stated cons are inventions: "trust-weight reduction" (no trust weight exists anywhere; the nearest analogue, a flaw count, is forbidden by `13.02.02` D-12) and "unit handling" (not a state, not an event, no signal). **Option A** rests on an undefined "complete" — `13.02.02` D-09 says the checklist can never be exhaustive.

**This finding's own prescribed fix was half-applied.** The `[PENDING]` in `13.03.04` was repaired, but the false-dilemma prose survived in `gear-marketplace-index.md` Q-13 and `13.03-listings-inventory-cx.md` — two files the entry never cited. Both are now corrected.

- **Current interim rule:** Group matching by proposed candidate and normalized title; apply the Operator’s seller-set per-upload grade with `bulk_defaulted: true`; publish grade as bulk-applied; disclose `Condition not itemised` and `Unit not photographed`; never template a flaw answer; complete disclosure/media when the seller holds the unit at label print. This rule does **not** decide whether the final quality bar may relax.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-57[0]`.
  - `../ideation/13-gear-marketplace/13.03-listings-inventory/13.03.04-bulk-listing-channel-sync.md`, `Happy Path` steps 2–6; `Edge Cases / Failure Modes`, “Bulk grade for 400 imported rows” and per-item disclosure/media row; `D-05`; `Q-01`.
  - `../ideation/13-gear-marketplace/gear-marketplace-index.md`, Q-13.
  - `../ideation/13-gear-marketplace/13.01-canonical-gear-catalog/13.01.04-listing-model-matching.md`, D-01, D-05, D-08.
  - `../ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.01-condition-grading-scale.md`, D-11.
  - `../ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.02-mandatory-flaw-disclosure.md`.
  - `../ideation/13-gear-marketplace/13.03-listings-inventory/13.03.01-listing-creation-media-demo.md`.

---

### DQ-MG-02 — False-positive stolen-serial review promise

- **Affected finding:** r-58[0]
- **Classification:** warning / unmeasurable — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What review promise applies when a stolen-serial hit is plausibly false?

| Option | Pros | Cons |
|---|---|---|
| A. Assign a high severity with a fixed expedited SLA and mandatory seller/reporter updates | Gives innocent sellers a predictable remedy and makes the hold observably non-accusatory | Needs staffing capacity and an explicit urgency trade-off against other queues |
| B. Assign a standard severity/SLA with escalation only after evidence of imminent sale or hardship | Uses one moderation baseline and reserves urgent capacity | May feel indistinguishable from accusation for ordinary innocent sellers |
| C. Release provisionally after a short evidence window while preserving the registry flag | Minimizes seller blockage | Can expose buyers and reporters to an unsafe or disputed transaction |

**RATIFIED 2026-07-21: Option B with its escalation clause struck.** The listing stays held, never deleted, and neither party is accused. **Severity, SLA and escalation are consumed from domain 24** — `24.01.03` owns routing skill, severity and clock, and severity sets the SLA — so `13.03.07` authors no number of its own, per the ratified author-where-owned rule. The innocent seller's substantive remedy already exists and is not a support queue: the locked `reported → contested` dispute path in `15.02.04`.

The struck clause ("escalation only on evidence of imminent sale or hardship") was the only inventive part of B: no source defines how the platform would observe imminence or hardship, and doing so would require adjudicating a fact nobody has. **Option A** authors a severity and SLA that domain 24 owns — the second copy the cross-domain rule forbids. **Option C** contradicts the locked hold-not-delete posture and exposes buyers during an unresolved flag.

- **Current interim rule:** A hit holds the listing rather than deleting it; both parties are informed and neither is accused. Listing remains `Hit pending review`. Source says only “Fast human resolution path”; no source assigns severity, SLA, escalation owner, or update deadline.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-58[0]`.
  - `../ideation/13-gear-marketplace/13.03-listings-inventory/13.03.07-stolen-serial-screening.md`, `Edge Cases / Failure Modes` (serial hit and false-positive rows), `States` (`Hit pending review`), `Cross-Cut Notes`, D-01, and Open Questions.
  - `../ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md`, `Behavior`: routing requires skill, severity, and clock; severity sets SLA; Q-04 retains timing values for later security/counsel confirmation.

---

### DQ-MG-03 — Used-licence transfers after vendor exit

- **Affected finding:** r-65[0]
- **Classification:** warning / missing-edge-case — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What happens to a used-licence transfer requiring vendor approval after that vendor exits?

| Option | Pros | Cons |
|---|---|---|
| A. Platform substitutes for the departed vendor and approves transfers under recorded terms | Keeps the secondary market functioning and honors continuity expectations | Makes the platform a decision-maker under vendor-authored policy |
| B. Permit transfers automatically when recorded terms contain objective eligibility rules; otherwise freeze | Limits substitution to rules the vendor already accepted | Produces unequal outcomes and leaves some buyers with a permanent freeze |
| C. Permanently freeze all approval-required transfers after exit | Avoids the platform interpreting missing consent | Destroys the second-hand market for affected catalogues |

**RATIFIED 2026-07-21: Option C, recorded as resolved-as-scoped** — the same disposition shape already ratified for P-11. Approval-required transfers **freeze** on vendor exit (`14.08.05` D-05, `14.06.01`): the platform never substitutes its own judgement for a departed vendor's discretionary approval and never invents consent. This is not new policy — it is what the locked exit behaviour already produces mechanically once no approver exists.

**Option B commissions a mechanism that does not exist.** `14.06.01` stores a *policy*, not an evaluator: there are no enumerated values, no criteria slot, no defined evaluator and no appeal path in which "objective eligibility rules" could live. **Option A** has the platform exercising a departed party's discretionary judgement under terms it did not author. **The finding was stale twice over** — `14.08.05` and `14.06.01` both carried `[PENDING — Step 5]` markers after Step 5 completed — and the entry miscited `14.03.03` D-03 (a stale-cache rule about library fetch errors, unrelated to transfers).

**Recorded friction, not resolved here:** `14.02.05` D-09 promises the buyer that tombstoned terms "remain in force" after exit. Under C one bound clause is permanently inoperative while still displayed as in force. If `14.06`/`14.08.05` scope is ever promoted, A and B return as live options.

- **Current interim rule:** On ordinary vendor exit, delist new sales but leave artifacts, all versions, entitlements, and downloads intact. For approval-required transfers, outcome is pending; no transfer-continuity policy is selected.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-65[0]`.
  - `../ideation/14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.05-vendor-exit-licence-continuity.md`, `Behavior`, `Happy Path`, and `Edge Cases / Failure Modes` row “Vendor’s transfer policy required their approval”.
  - `../ideation/14-digital-goods-marketplace/14.06-used-licence-transfer/14.06.01-vendor-transfer-policy-registry.md`.
  - `../ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.03-licence-portal-purchased-library.md`, D-03.

---

### DQ-MG-04 — Theft-report filing standing

- **Affected finding:** r-69[0]
- **Classification:** warning / broken-xref — **deferred-with-interim-rule**
- **Owner / stage:** Product owner; `/ideate-validate` (15.02.01 Q-01).
- **Question:** Who may file a theft report when ownership and physical custody differ?

| Option | Pros | Cons |
|---|---|---|
| A. Owner or documented holder/custodian may file, with filing capacity recorded | Lets the person who discovers loss act quickly while preserving evidence context | Needs defined evidence for custody and processes for conflicting claims |
| B. Legal owner only may file | Clear title-oriented authority | Fails common loan, consignment, and venue-custody loss cases |
| C. Any witness may file a provisional report | Maximizes rapid reporting | Creates high abuse and duplicate-report pressure |

**RATIFIED 2026-07-21: Option A in amended form.** The owner **or** a party in a custody state `15.08` already enumerates may file, with filing capacity recorded on the flag; a second filer on the same identity joins the existing flag; the platform still never adjudicates title.

**The queue's wording was not adopted, and the amendment matters.** "Documented holder/custodian" is a custody-evidence threshold **no source defines** — it maps to none of the six enumerated custody states, so option A as literally worded resolves its own motivating loan/consignment case to *nobody may file*. Binding standing to the enumerated states instead removes the invention. **Option B** is foreclosed by `15.02.01` DT-02, which explicitly **rejects** "the natural theft-report trigger is the owner" — the deeper node answered the parent's stale text in the opposite direction. **Option C** invents a seventh state: "provisional" is not in the locked set (`reported | contested | stale | withdrawn | recovered | resolved`) and would force a new transition map and screening render.

**Left open:** standing under `stale` custody, and under `disputed` custody where `15.08` explicitly refuses to adjudicate.

- **Current interim rule:** An owner or holder may file; the flag records filer and capacity; a second filer on the same identity joins the existing flag rather than creating a duplicate. The platform surfaces the flag and does not adjudicate title.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-69[0]`.
  - `../ideation/15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.01-theft-report-serial-flagging.md`, `Edge Cases / Failure Modes` owner/holder row, `Cross-Cut Notes`, D-01–D-04, and Q-01.
  - `../ideation/15-gear-registry-ownership/15.08-custody-loans-consignment.md`, Q-01.
  - `../ideation/15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02-stolen-gear-registry-recovery-index.md`, Q-04 is not standing authority; corrected ledger routing is Q-01 above.

---

### DQ-MG-05 — Canonical gear identity-confidence vocabulary

- **Affected finding:** r-70[0]
- **Classification:** warning / undefined-term — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** Which canonical confidence levels define a gear record’s identity?

| Option | Pros | Cons |
|---|---|---|
| A. Adopt the current render vocabulary as the canonical set | Aligns registry display and downstream contracts quickly | May prematurely turn a presentation proposal into policy |
| B. Define a smaller canonical set with evidence details held separately | Simpler buyer-facing meaning and less enum churn | Can conceal meaningful distinctions such as reconstructed versus typed serials |
| C. Define a richer evidence-derived set, including serial state, era certainty, and non-serial discriminator state | Represents provenance faithfully and supports nuanced trust decisions | Harder to explain, implement, and keep stable across record types |

**RATIFIED 2026-07-21: re-cut as an authority decision, then Option A's contents relocated.** `15.01.05` **D-03** authors the canonical identity-confidence value set — the six values already in use on disk — and `15.01.01` renders it without defining its own, per the ratified author-where-owned rule. The tree already names `15.01.05` as owner of identity-resolution logic and the authoritative value set, so a second definition inside a render table is exactly the copy that drifts. Relocation costs nothing: no downstream literal binds to the set today.

**The queue's own recommendation (C) was circular** — its stated premise ("current sources already distinguish serial confirmation, typed/reconstructed values, era uncertainty, and non-serialized resolution") *describes option A's contents*. C is also three orthogonal fields — serial state, era certainty, non-serial discriminator state — presented as one enum, silently deciding multi-valued cardinality and resting on mechanisms the tree has not granted. **Option B** risks contradicting `15.01.05` D-01: any bucketing that renders a photographic WJ-ID as equivalent to a confirmed serial would "launder a weak identity into a strong-looking one".

- **Current interim rule:** The record renders identity confidence separately from claim strength. The render-side vocabulary is proposed only; 15.01.05 owns resolution logic and the authoritative value set. No canonical enum is ratified.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-70[0]`.
  - `../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.01-gear-record-serial-identity.md`, `Behavior`, “Identity confidence and claim strength are orthogonal,” rendering table, and cross-cut notes.
  - `../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.05-non-serialized-contested-identity.md`, identity-resolution states and Q-01.
  - `../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-index.md`.

---

### DQ-MG-06 — Collision disposition for one identity key

- **Affected finding:** r-71[0]
- **Classification:** warning / unresolved-synthesis — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What happens when two gear records resolve to one identity key?

| Option | Pros | Cons |
|---|---|---|
| A. Never auto-merge; retain both records, notify both claim-holders, and merge only with mutual consent | Protects independently asserted histories and avoids irreversible mistaken conflation | Leaves duplicates visible and requires a later resolution path |
| B. Keep the first-minted record and archive later records automatically | Deterministic and minimizes duplicate public records | Privileges timing over evidence and can erase legitimate independent provenance |
| C. Auto-merge only when high-confidence identity evidence meets a defined threshold | Reduces duplicates when evidence is strong | Threshold errors can merge distinct instruments and make recovery difficult |

**RATIFIED 2026-07-21: Option A.** `15.01.05` **D-04**: two records resolving to one identity key **never auto-merge** — both are retained, both claim-holders are notified, and a merge requires mutual consent. Consistent with the append-only mint and with domain 09's ratified **CQ-08** precedent: exact equality may authorise merging *unclaimed stubs*, but nothing probabilistic ever merges records that assert independent provenance.

**The entry's interim rule described the wrong mechanism.** It says collision facts "require a **fork**"; CX-01 does not fork — it **blocks the mint pending disambiguation** (`15.01.01`, `15.01.05` D-02). Forking is CX-05's swapped serial-bearing part, a different trigger entirely. **Option B** privileges timing over evidence and can erase legitimate independent provenance against the append-only model. **Option C** makes an unpickable mistake at the threshold tail — the same probabilistic merge CQ-08 already rejected for the analogous case.

- **Current interim rule:** No final collision ownership/merge policy is selected. Collision facts require a fork rather than silent continuation; both resulting record chains receive notification. Existing sources state collision handling must not be auto-resolved.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-71[0]`; Known Report-Label and Range Corrections item 3 confirms the canonical identity is only `r-71[0]`.
  - `../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-cx.md`, CX-01 shared-state conflict, trigger chain, notification fan-out, and state-transition collision facts.
  - `../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.01-gear-record-serial-identity.md`, mint/append-only behavior and duplicate-registration mitigations.
  - `../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.05-non-serialized-contested-identity.md`.

---

### DQ-MG-07 — Suggested edits on unclaimed venue and studio records

- **Affected finding:** r-72[0]
- **Classification:** blocking / unresolved-decision — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What happens to a community suggestion for an unclaimed record?

| Option | Pros | Cons |
|---|---|---|
| A. Auto-apply eligible factual edits with unclaimed-community provenance | Keeps the launch registry current when no owner exists and preserves source transparency | Exposes facts to vandalism or inaccurate edits until challenged |
| B. Queue every edit until an owner or reviewer acts | Strongest review control | Leaves the unclaimed majority stale indefinitely and defeats community correction |
| C. Auto-apply only field classes meeting a trust/evidence threshold; queue the rest | Balances registry freshness with higher protection for consequential facts | Requires threshold, field classification, and reviewer-path policy |

**RATIFIED 2026-07-21: Option C.** `16.05.03` **D-05**: community suggestions on unclaimed records **auto-apply by field class**, using the classification `16.01.01` already defines (Statutory / Anchor / Fact / Commercial / Structural, each with "who writes" and "beats"). Factual classes apply immediately with community provenance retained; higher-stakes classes queue; commercial fields stay Operator-only regardless.

**This is the majority case, not an edge case** — `16.05.03` DT-03 says so explicitly — which is why neither blanket auto-apply (no protection for consequential facts) nor indefinite queueing (the registry never improves) was acceptable. Mirrors `13.01.02`'s ratified posture: **automation may propose, never dispose**. The entry's con "requires field classification" is **stale**: the classification is already built.

**Citation defect corrected:** the entry cited `16.05.03` Q-04, which is the *timeout on an ignored suggestion* — a claimed-record question. The entry's actual question is Q-01, never cited, nor was the sub-domain index question. The class cut line, freshness effects and filtering treatment are carried as new Q-05.

- **Current interim rule:** Provenance is retained per field. Suggestions on claimed records queue for the Operator. On unclaimed records, a suggestion may apply immediately and is marked `Community suggestion, unreviewed on an unclaimed record`; commercial fields remain Operator-only. The exact unclaimed-record policy is not selected.
- **Exact sources:**
  - `remediation-state.md`, Final Per-Finding Disposition Ledger, `r-72[0]`.
  - `../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.03-suggested-edits-field-provenance.md`, Role Lens, `Behavior`, provenance ranking, `Edge Cases / Failure Modes`, and Q-04.
  - `../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05-curation-provenance-data-integrity-index.md`, D-03, D-04, and Role Matrix.
  - `../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.01-place-data-seeding-ingestion.md`, D-02.
  - `../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.04-owner-vs-community-conflict-resolution.md`.

---

## Product — Live Booking & Fan Alerts

### DQ-04.01 — Availability under a soft hold

- **Affected ledger rows:** `r-74[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** Should a date remain presented as available while it has one or more soft holds?

| Option | Pros | Cons |
|---|---|---|
| A. Keep it available without a hold indicator | Preserves the ordinary industry meaning of a soft hold and leaves rooms sellable. | Prospective counterparties cannot judge contention before entering the booking flow. |
| B. Keep it available and disclose only an aggregate hold state | Preserves sellability while making contention legible without exposing counterparties. | The aggregate may discourage legitimate enquiries despite no booking being confirmed. |
| C. Remove it from availability at the first hold | Simple interpretation for observers and prevents additional contention. | Converts a soft hold into an exclusive reservation and contradicts the multi-position ladder model. |

**RATIFIED 2026-07-21: Option B, as a confirmation with audience scoping.** `17.01.02` **D-14**: a held date **stays available** and only an **aggregate** hold state is disclosed — never counterparty identities. This is already established by D-13 ("multiplicity count, never identities") and CX-01 ("a hold attaches to an avail but does not remove it").

**Option C** would convert a soft hold into an exclusive reservation, contradicting the locked multi-position ladder model and D-13's no-cap rule outright. **Option A** deletes locked disclosure text and leaves a counterparty unable to judge contention before entering the flow. B's gap was that it says nothing about *who* sees the aggregate — now scoped to the parties the ladder already exposes it to, with pre-ladder requests (which occupy no ladder position) excluded from the count.

**Recorded: the entry substituted the question.** The immutable `r-74` finding asks *"who owns the hold ladder — 16.06.01 or 17.01.02?"* The availability question the queue asked is now answered; the ladder-ownership question is carried forward as a separate boundary item.

- **Current interim rule:** A hold does not remove the avail; the room/date remains sellable until confirmation. Do not invent a public, named-counterparty, or exclusive-reservation outcome.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01-availability-holds-confirmation-cx.md` — CX-01: a hold attaches to an avail but does not remove it; avails stay sellable under a hold ladder.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.02-hold-ladder-priority.md` — D-13: no cap on concurrent holds; only multiplicity, never identities, is disclosed to the Operator.

### DQ-04.02 — Default offer approval rule

- **Affected ledger rows:** `r-75[0]`
- **Preserved classification:** blocking / unresolved-decision → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** What default approval rule should a newly created band use for an offer?

| Option | Pros | Cons |
|---|---|---|
| A. Unanimous member approval | Maximizes member protection for binding commercial commitments. | A missing member can deadlock a time-limited offer. |
| B. Simple majority approval | Keeps a band able to respond within normal offer windows. | Can bind a dissenting or absent member. |
| C. Delegated authority approval | Fastest for working bands with an established manager or agent. | Delegation may be absent, stale, or broader than members intended. |
| D. Require explicit setup before any offer can proceed | Avoids imposing a governance rule the band never accepted. | Creates onboarding friction and delays the first offer. |

**RATIFIED 2026-07-21: consume domain 01's rule; author nothing here.** `17.02.03` **D-07**: with no rule configured, no offer is treated as approved. This is not a new default — it follows from domain 01's fail-closed posture.

**The entry was misrouted.** `17.02.03` **D-03** states plainly that *"the band's governance rule is consumed from domain 01, not defined here"*, restated twice more in the same file. Domain 01 already defines the model: decision thresholds of **unanimity / majority / any-one-member** (`01.04.01`) plus the mandate-and-ceiling enforcement half (`01.03.03` — coarse activities × value ceiling, fails closed). The queue asked domain 17 to author a band decision rule, and its four options are not even the vocabulary domains 01 and 09 use. Authoring a default here would have created exactly the second copy the ratified author-where-owned rule forbids.

**Invention flagged:** option C's "stale delegation" — no source defines a delegation freshness or validity test. C also cannot be ratified while `17.02.03`'s delegate-vs-member-veto precedence stays pending, since that file explicitly defers precedence to *this* decision.

- **Current interim rule:** The approval primitive remains one configurable chain; no onboarding default is assumed and no offer is treated as approved without the applicable rule.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — D-06: one approval primitive with a pluggable entity-governance or spend-threshold rule.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — Q-01: unanimous deadlocks under a 48-hour clock; majority or delegation can bind members who never agreed.

### DQ-04.03 — Offer expiry during approval

- **Affected ledger rows:** `r-75[1]`
- **Preserved classification:** blocking / ambiguous-behavior → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** What happens when an offer expires before its required approvals complete?

| Option | Pros | Cons |
|---|---|---|
| A. Hard expiry | Gives the counterparty a deterministic release time and prevents approval-chain stalling. | Penalizes otherwise valid approvals delayed by ordinary band coordination. |
| B. One fixed grace window | Absorbs small coordination delays while bounding the hold on the counterparty. | Creates a new timing edge and may be exploited at the deadline. |
| C. Configurable grace window per offer | Lets parties match treatment to deal importance and context. | Adds negotiation friction and makes outcome predictability weaker. |
| D. Counterparty must explicitly extend | Preserves counterparty control and leaves no implicit extension. | Requires a live response exactly when the approval process is already delayed. |

**RATIFIED 2026-07-21: Option D, narrowed to explicit extension only.** `17.02.03` **D-08**: the offer expires, with **no implicit grace window**. An extension must be granted **explicitly, before expiry, by the offering side, as a new version** — the shape domain 17 already ratified for the analogous clock in `17.01.03`. Recorded approvals survive as audit evidence; they do not carry into the new version by themselves.

**Options B and C contradict locked decisions**, and Q-02 already names the grace window "an obvious stalling vector" — a window is precisely the mechanism a slow counterparty would exploit. **Option A** (hard expiry) is the honest runner-up and cheaper to specify; it was not chosen because it offers no path at all for the ordinary band-coordination delay this edge case calls routine.

**Left open as Q-03:** whether an extension re-opens the hold-ladder clock. `17.01.03` owns that clock, so this file must consume the answer rather than author a second one.

- **Current interim rule:** No expiry outcome is selected. Preserve the offer and recorded approvals for audit, but do not mark it accepted, expired, extended, or releasable until the owner chooses one option; downstream settlement and inventory effects remain blocked rather than inferred.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — edge case: expiry mid-approval is explicitly pending as a grace-window versus hard-stop product decision.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — Q-02: a grace protects slow bands but is an obvious stalling vector.

### DQ-04.04 — Reconciliation conflict outcome

- **Affected ledger rows:** `r-76[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** When competing box-office evidence produces conflicting counts, what outcome should govern settlement?

| Option | Pros | Cons |
|---|---|---|
| A. Highest provenance evidence controls automatically | Delivers a fast, reproducible settlement outcome. | A provenance hierarchy can still be wrong in a specific event and gives the losing party little recourse. |
| B. Keep the count provisional and settle only undisputed portions | Limits harm to the disputed economic exposure. | Produces partial settlement and requires parties to manage a later amendment. |
| C. Freeze every settlement until parties resolve the conflict | Avoids disbursing against a count either party contests. | Withholds money from parties whose deals have no stake in the disputed line. |
| D. Platform adjudicates the disputed count | Produces a final outcome in one system. | Makes the platform a commercial fact-finder without independent ground truth. |

**RATIFIED 2026-07-21: Option B, as a confirmation of locked state.** `17.09.02` **D-16**: on conflicting evidence the count stays **provisional** and **undisputed portions settle**. This confirms D-13..D-15, which already fan out corrections, freeze only the contesting act's sheet, and name/attribute/price a failed invariant.

**Option A** would turn a provenance hierarchy into a commercial verdict. **Option C** withholds money from parties with no stake in the disputed line. **Option D** makes the platform a commercial fact-finder without independent ground truth, against the posture used across the whole tree.

**Recorded: this entry is mis-mapped to its ledger row.** The immutable `r-76` manifest holds exactly one finding, and it is not "conflict outcome" — it is `17.09.02` Q-03, *"does the draw record consume scanned_paid rather than total scan?"*, i.e. **DQ-04.05's** subject, with the prescribed fix "update BOTH files". Both questions are resolved together in this pass. Separately noted: `17.09.02` Q-04 has no queue entry of its own.

- **Current interim rule:** Show each decomposed count and its provenance; price failed invariants against the deal; do not silently select a winner or overwrite a contested count. A dispute affects only the contesting act's sheet unless policy later changes that boundary.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — D-01: reconciliation is several numbers, never one attendance field.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — D-13 through D-15: corrections fan out; a dispute freezes only the contesting act's sheet; a failed invariant is named, attributed, and priced content.

### DQ-04.05 — Verified-draw count definition

- **Affected ledger rows:** `r-77[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** Which attendance count should a verified draw record publish?

| Option | Pros | Cons |
|---|---|---|
| A. `scanned_paid` only | Prevents comp-heavy or papered houses from inflating a commercial draw signal. | Understates total people physically present at a show. |
| B. `scanned_total` only | Measures physical attendance with one easy-to-explain number. | Lets comps manufacture a stronger apparent draw history. |
| C. Publish both, with one explicitly designated as verified draw | Retains both facts and makes the commercial definition explicit. | Adds information density and still requires choosing the designated count. |

**RATIFIED 2026-07-21: `scanned_paid` is the verified draw** — a verbatim confirmation of `17.09.02` **D-08**'s locked three-count model: `sold` → money, `scanned_paid` → draw, `scanned_total` → occupancy and merch per-head. `scanned_total` is retained and published as a separately labelled attendance fact; it is not erased, it is simply not the draw. The fan-out is already wired and invariant INV-03 already constrains `scanned_paid ≤ sold`.

**The owner is confirming, not inventing** — the queue's own recommendation restates a locked D-entry. **Option B is foreclosed**: it would require deleting `17.09.02` D-08 and reversing that file's own worked papered-house edge case, overturning a Must/`[DEEP]` file on the authority of a Should/`[PARTIAL]` file's stale prose.

**Repaired:** `17.11.01` carried "Scan count, not paid count" in four places, contradicting the owning file. Consuming total scan would let a papered house manufacture verified draw history — exactly the failure `17.09.02` already prices.

- **Current interim rule:** A signed settlement is required before a draw record exists, but no implementation may silently derive the verified-draw number from either total scan or paid scan while the contradiction remains unratified.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11.01-verified-draw-record.md` — D-01: only signed settlements emit records; the feature treats draw as an attendance fact per show.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — D-08: `sold`, `scanned_paid`, and `scanned_total` are distinct counts.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — Q-03: consuming total scan permits a papered house to manufacture verified draw history; sibling-file contradiction remains unresolved.

### DQ-04.07 — Gig-alert eligibility

- **Affected ledger rows:** `r-79[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** Which shows should make a fan eligible for a gig alert?

| Option | Pros | Cons |
|---|---|---|
| A. Confirmed first-party shows only | Keeps event facts accurate and alert timing tied to on-sale inventory the platform can observe. | Fans receive no notice for an artist's external shows and may perceive the product as incomplete. |
| B. First-party shows plus verified partner listings | Expands coverage while retaining a quality threshold. | Requires a partner-verification policy and produces different coverage by market. |
| C. All third-party listings | Maximizes apparent comprehensiveness. | Ingested data can be stale, duplicated, cancelled, or not actually on sale; trust in alerts erodes. |

**RATIFIED 2026-07-21: Option A, reworded to "announced first-party shows, alerted at on-sale".** `20.06.02` **D-09**, resolving Q-02.

**"Confirmed" was rejected as contradicting a locked decision:** `17.01.04` gives the Fan no visibility until announce, so alerting on a confirmed-but-unannounced show would leak an embargoed date. **Option B rests on a premise that is not constructible**: no external listing produces an on-sale instant the platform can observe, so the locked on-sale trigger (D-01) cannot fire for it — "verified partner listings" has no source anywhere in the tree. **Option C** compounds that with stale, duplicated and cancelled ingested data.

**Recorded: this entry is bound to the wrong finding.** The immutable `r-79[0]` records the **alert-radius contradiction** — `20.06.02` D-06 says 25 mi / 40 km while `20.01.03` D-05 says 80 km / 50 mi over a 10–500 km range, and neither file cites the other. That contradiction is now noted in D-06 and carried as `20.06.02` **Q-04** for an explicit owner ruling on whether the two radii are one setting or two; they may legitimately differ, since `20.06.01` DT-02 locks that *follow grants the alert; it does not grant marketing*.

- **Current interim rule:** For first-party events, issue one event-keyed alert at on-sale rather than announcement; dedupe by event; disclose the no-location partial state; do not invent third-party show eligibility. A fan demand request converting to a show may route to the domain-20 alert, but its broader eligibility policy remains unratified.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md` — D-01: alert at on-sale, not announcement; D-02: dedupe by event; D-03: surface the no-location partial state; Q-02: whether to alert on shows not booked on WeJammin remains owner-open.
  - `.memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.07-fan-demand-show-requests.md` — converted state: when a show is announced in a requested market, requesting fans are notified through domain 20's alert.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.04-confirmation-announce-gate.md` — confirmation and announce are distinct gates; show announcement alone is not the fan-alert trigger.

## Final coverage map — 0 unresolved ledger rows + 43 ratified records

| Ledger identity | Canonical entry | Classification |
|---|---|---|
| `r-09[0]` | CQ-01 | **Ratified 2026-07-19 — verified-fixed** |
| `r-20[2]` | CQ-03 | **Ratified 2026-07-19 — verified-fixed** |
| `r-34[0]` | CQ-05 | **Ratified 2026-07-19 — verified-fixed** |
| `r-45[0]` | A-01 | **Ratified 2026-07-19 — verified-fixed** |
| `r-51[0]` | A-02 | **Ratified 2026-07-19 — verified-fixed** |
| `r-19[1]` | CQ-02 | **Ratified 2026-07-20 — verified-fixed** |
| `r-52[0]` | A-03 | **Ratified 2026-07-20 — verified-fixed** |
| `r-53[0]` | A-04 | **Ratified 2026-07-20 — verified-fixed** |
| `r-54[1]` | A-05 | **Ratified 2026-07-20 — verified-fixed** |
| `r-78[0]` | DQ-04.06 | **Ratified 2026-07-20 — verified-fixed** |
| `r-25[0]` | CQ-04 | **Ratified 2026-07-20 — verified-fixed** |
| `r-35[0]` | CQ-06 | **Ratified 2026-07-20 — verified-fixed** |
| `r-36[0]` | CQ-07 | **Ratified 2026-07-20 — verified-fixed** |
| `r-36[1]` | CQ-08 | **Ratified 2026-07-21 — verified-fixed** |
| `r-40[0]` | CQ-09 | **Ratified 2026-07-21 — verified-fixed** |
| `r-44[0]` | P-01 | **Ratified 2026-07-21, closed 2026-07-22 — verified-fixed** |
| `r-44[1]` | P-02 | **Ratified 2026-07-21 — verified-fixed** |
| `r-44[2]` | P-03 | **Ratified 2026-07-21 — verified-fixed** |
| `r-46[0]` | P-04 | **Ratified 2026-07-21 — verified-fixed** |
| `r-47[0]` | P-05 | **Ratified 2026-07-21 — verified-fixed** |
| `r-48[0]` | P-06 | **Ratified 2026-07-21 — verified-fixed** |
| `r-50[0]` | P-07a | **Ratified 2026-07-21 — verified-fixed** |
| `r-50[1]` | P-07b | **Ratified 2026-07-21 — verified-fixed** |
| `r-56[0]` | P-08a | **Ratified 2026-07-21 — verified-fixed** |
| `r-56[1]` | P-08b | **Ratified 2026-07-21 — verified-fixed** |
| `r-59[0]` | P-09 | **Ratified 2026-07-21 — verified-fixed** |
| `r-62[0]` | P-10a | **Ratified 2026-07-21 — verified-fixed** |
| `r-62[1]` | P-10b | **Ratified 2026-07-21 — verified-fixed** |
| `r-63[0]` | P-11 | **Ratified 2026-07-21 — verified-fixed** |
| `r-64[0]` | P-12 | **Ratified 2026-07-21 — verified-fixed** |
| `r-57[0]` | DQ-MG-01 | **Ratified 2026-07-21 — verified-fixed** |
| `r-58[0]` | DQ-MG-02 | **Ratified 2026-07-21 — verified-fixed** |
| `r-65[0]` | DQ-MG-03 | **Ratified 2026-07-21 — verified-fixed** |
| `r-69[0]` | DQ-MG-04 | **Ratified 2026-07-21 — verified-fixed** |
| `r-70[0]` | DQ-MG-05 | **Ratified 2026-07-21 — verified-fixed** |
| `r-71[0]` | DQ-MG-06 | **Ratified 2026-07-21 — verified-fixed** |
| `r-72[0]` | DQ-MG-07 | **Ratified 2026-07-21 — verified-fixed** |
| `r-74[0]` | DQ-04.01 | **Ratified 2026-07-21 — verified-fixed** |
| `r-75[0]` | DQ-04.02 | **Ratified 2026-07-21 — verified-fixed** |
| `r-75[1]` | DQ-04.03 | **Ratified 2026-07-21 — verified-fixed** |
| `r-76[0]` | DQ-04.04 | **Ratified 2026-07-21 — verified-fixed** |
| `r-77[0]` | DQ-04.05 | **Ratified 2026-07-21 — verified-fixed** |
| `r-79[0]` | DQ-04.07 | **Ratified 2026-07-21 — verified-fixed** |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-70|D-70]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-entry|D-entry]]
