# IA Remediation Worklist — 2026-08-05

Produced by `/resolve-ambiguity all ia` over the 34 upheld findings in `2026-08-05-ia-ambiguity-report.md`.

Every gap ran a tiered lookup (project context → upstream specs → config/code), and every claimed resolution was then challenged by an independent agent instructed to overturn it. Nothing below is applied yet.

## Outcome

| Class | Count | Meaning |
|---|---:|---|
| Ready to apply | 28 | An authoritative source states the answer. Fix text is written and source-cited. |
| Ready, with challenger amendments | 2 | Source holds, but the challenger corrected the proposed fix. Apply the amended version. |
| Partially sourced | 2 | Most of the gap is answered; a named sub-part is blocked on a question already tracked upstream. |
| Genuine owner decision | 2 | No source in any tier answers it. Needs a product or architecture decision. |

**30 of 34 gaps need no owner input at all.** The audit called 14 items "requires an owner decision"; tiered lookup reduced that to 2. The rest were already answered in ideation decision tables, sibling IA shards, the architecture design, or the decision ratification log — the information existed, the IA layer simply failed to carry it forward.

## Genuine owner decisions (2)

These block full remediation. Nothing else does.

### A-10 — `09-projects-collaboration.md`

**Question.** For v1, what does the vault authorization profile bind to, and what does a roster role the approved profile does not name receive — given DEC-016 says no profile is enforceable until practitioner validation approves a version, but PRJ-07 must still ship?

| Option | Trade-off |
|---|---|
| **A** — Bind the profile to an explicit `vault_role_class` attribute assigned per `role_version` in Shard 07's taxonomy (values drawn from `SensitivityClass`), ship the six ideation candidate rows as `profile_version: 0` marked non-enforceable-draft, and default any `role_version` with no `vault_role_class` — including every `pending_role_alias` — to the lowest class (`review`) with an explained denial above it. | Ships a working, least-privilege vault on day one and honours DEC-016 literally (no candidate grant is treated as approved truth; `profile_version` 0 is evidence, not contract, exactly as DEC-047 required for the P-01 stage enum). Adds one attribute to Shard 07's taxonomy model, which shard 09 does not own — needs a reciprocal edit and a Shard 07 changelog entry. Any role added to the DDEX taxonomy silently starts at `review` until an admin classifies it, so classification becomes ongoing taxonomy-admin work. |
| **B** — Bind the profile to Shard 07's `role_version.family_id` rather than individual roles, mapping each family to a `SensitivityClass` ceiling, and default an unmapped family to `review`. | Far fewer rows to maintain and new DDEX terms inherit a sensible ceiling automatically. But families are grouped for discography presentation (`07-credits-core.md:61`, 'Public records group by role family'), not for confidentiality — and the ideation matrix's whole point is that mix engineer and mastering engineer sit in the same family yet must get opposite grants ('the most trusted contributor, yet they need the least'). This option cannot express the counter-intuitive row that DT-01 says the feature exists for. |
| **C** — Ship v1 with no derived profile at all: only the song owner and the Producer/project runner (roster-write holders) reach the vault, and every other contributor gets an explained denial until an approved profile version lands. | Maximally faithful to DEC-016 — zero unapproved grant is ever enforced — and impossible to get confidentiality wrong. But it deletes the feature's actual value: a session player cannot hear their own rough mix, a mix engineer cannot get stems, so the Producer emails a Dropbox link, which is precisely the DT-02 failure ('the platform is out of the room') the whole design exists to prevent. |
| **D** — Defer the whole matrix to `/write-be-spec` per ideation Q-03's stated deferral target and leave the IA carrying only the intersection algorithm. | Matches the literal deferral written in `07.03.03` Q-03 and costs nothing now. But it re-creates the defect one layer down: BE would be authoring an access model with no IA contract to implement against, and the IA layer would ship with its most sensitive authorization decision still undefined — which is exactly the finding under review. |

**Recommendation.** Option 1. It is the only candidate that satisfies both halves of the constraint the project has already ratified: DEC-047 set the binding precedent for a validation-gated vocabulary — 'Candidate labels remain non-enforceable because the gate is in force, not because a decision is pending', and 'no draft label is a downstream contract' — so shipping the ideation matrix as `profile_version: 0` draft with a least-privilege fallback is the disposition this project has already chosen twice (A-03 DAW parsing, A-04 vault profiles). It preserves every boundary DEC-016 forbade crossing (no per-asset ACLs, no project-wide grants, no owner-configured-only regime), it keeps the mastering-engineer inversion expressible, and the `review`-floor default makes an unclassified DDEX role harmless rather than fatal. The one real cost — an attribute in Shard 07's taxonomy — is unavoidable under any option that keeps per-role granularity, because Shard 07 owns the role taxonomy and shard 09 must key on something it owns.

**Search trace.** I confirmed the defect and then searched every tier. Tier 1: `CLAUDE.md`, `.claude/instructions/` — nothing on vault policy. Tier 2, ideation: `ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.03-rights-aware-asset-vault-nda-gating.md` DOES carry a 'Default access profiles' table — six functional roles (Song owner, Producer/project runner, Songwriter, Session player, Mix engineer, Mastering engineer) against six asset columns — plus D-01..D-09, and `07.04.03` D-05 ('Takes get a stricter sensitivity class than stems') explains the IA's `takes` class. So the substance is NOT missing wholesale, and the auditor overstated by saying nothing anywhere defines it. BUT three things make it genuinely undecidable from source: (a) ideation D-08 and its ratified owner decision DEC-016 (`.memory/wiki/decisions.md:215-231`) explicitly declare those profiles NON-ENFORCEABLE candidates until practitioner validation plus an approved profile version — 'Validation may refine grants per sensitivity class; it cannot introduce manual per-asset ACLs, project-wide grants, or an owner-configured-only access model'; DEC-016 assigned the profile-versioning and enforcement-rollout design to `/create-prd-security`, and grepping `2026-08-02-architecture-design.md` for `sensitivity|role.profile|role-derived|profile version` returns ZERO hits, so that assignment was never discharged. (b) The six ideation roles are coarse functional labels, while the role taxonomy shard 09 actually binds to is OPEN — `07-credits-core.md:137` types `RoleVersion` as 'Canonical base + optional modifier, admitted party types, family, locale labels and DDEX fidelity', with `pending_role_alias` for unmapped literals. Nothing states which level of that taxonomy the profile keys on, or what a roster role the profile does not name receives. (c) The IA's own `SensitivityClass` enum `roster | review | stems | takes | restricted` is a five-way re-binning of ideation's seven asset kinds, and no source states the binding. Also searched and came back empty: `audits/decision-ratification-log.md` (grep `sensitivity|role.profile|access.profile|vault` — zero hits), `audits/blocking-decision-queue.md`, `audits/run3-owner-decision-queue.md`, all 43 sibling shards and 39 deep dives (only hits are shard 09's own three references plus `deep-dives/09` line 29's unschematized `access_profile_version?` and line 31's `sensitivity_class`), and `07-credits-core.md` + its deep dive (zero hits, so the mapping is not deferred to Shard 07). BE corroboration is unavailable: `.memory/wiki/specs/be/` contains only `.gitkeep` — all 157 entries in `be.md` are unwritten wikilinks, including `09b-roster-invitations-vault-access`. What remains is a live tension no source resolves: DEC-016 says no profile is enforceable until an approved version exists, yet PRJ-07 must ship, and `ResolveVaultAccess` fails closed — so v1 would deny every contributor. Only the owner can break that.

### A-25 — `deep-dives/04-cms-delivery-media.md`

**Question.** Shard 04 must consume dispute, takedown, rights and licence state that Shards 06, 10 and 20 own — but DEC-097 forbids a dependency pointing to a higher-numbered shard, and adding 04 -> 06 closes a real cycle through Shard 05. By what mechanism should delivery eligibility learn about that state?

| Option | Trade-off |
|---|---|
| **A** — A — Inbound-command inversion. Shard 04 exposes protected delivery commands (apply/release delivery hold, revoke delivery eligibility) that write `TakedownCaseLink` and set `AssetRight.state` to `disputed\|restricted\|revoked`. Shards 06, 10 and 20 call them and each adds Shard 04 to its own `Depends on` and Cross-Shard Section Contract Map. Shard 04's eligibility rule reads only its own local state and declares no new dependency. | Every new edge points downward (06 -> 04, 10 -> 04, 20 -> 04), so DEC-097 and the acyclicity guarantee both survive untouched — 06 -> 04 already holds transitively via 05, and 10 and 20 are not in 04's closure {00, 01, 03}. Cost: three producer shards each gain a Shard 04 integration section, and Shard 04's materialised state can lag if a command is lost, so it needs an outbox-backed reconciliation sweep to keep the hold state honest. |
| **B** — B — Upward event consumption via the Shard 00 envelope. Shard 04 registers async consumers for `safety.dmca.changed.v1` (06-trust-safety.md:256), `rights.conflict.changed.v1` / `rights.freeze.changed.v1` (10-rights-ownership.md:252-253) and `licensing.hold.changed.v1` / `licensing.instrument.lifecycle.v1` (20-licensing-core.md:222,230) in Shard 00's async consumer registry, and DEC-097 is amended to permit upward event-consumption edges. | Producers stay unaware of delivery and the events already exist. But it amends a ratified owner decision, and Shard 00's events are identifier-only envelopes — the consumer must then read producer state to resolve scope, which reintroduces the upward read edge the amendment was supposed to remove. Across 43 shards this makes the acyclicity claim unverifiable. |
| **C** — C — Broker through Shard 05. Shard 05 already owns "retention/hold orchestration" per 06-trust-safety.md's dependency line, and already depends on 04 and is depended on by 06. | Works for the trust-and-safety leg only. Shard 05's declared dependencies are 00, 01, 03, 04 — it cannot read Shard 10 or Shard 20 state either, so the rights and licensing legs still need upward edges. It also parks adjudicated legal state in the admin shard, contradicting the deep dive's own "does not adjudicate" constraint. |
| **D** — D — Renumber the shards so trust/safety, rights and licensing precede delivery. | Makes the declared direction literally true, but DEC-097 locks the 43-shard boundary table, and 05 -> 04 would have to be broken too. It rewrites every "Shard NN" reference across 83 IA documents, the feature ledger and the phase plans for zero product benefit. |

**Recommendation.** Option A. It is the only option that satisfies both ratified constraints without amending either: ideation 25.06.03 D-01's "publication consumes domains 09/11/24" is honoured because the state still originates in 06/10/20 and Shard 04 never adjudicates, while DEC-097's downward-only rule holds because every new edge points to a lower number. It also invents the least — Shard 04 already models `TakedownCaseLink` (04-cms-delivery-media.md:120) and already defines the rights enum `claimed|verified|restricted|expired|disputed|revoked|unknown` in its Contracts section, so the local landing surface exists; and ideation 25.06.04 D-01 already fixes the delivery-side behaviour as "Revoke access before byte deletion; retained evidence and audit references survive."

**Search trace.** The defect is real and I confirmed both halves of it. deep-dives/04-cms-delivery-media.md line 88 makes eligibility depend on "no dispute/takedown/hold conflict, and current source-domain permission"; line 90 says "Upload/possession/self-claim is never verified rights. Shard 10/20/06 state may verify, dispute, revoke, or hold."; line 149 publishes "| Shard 06/10/20 | Consumes dispute/takedown/right/licence state and performs delivery revoke/purge; does not adjudicate. |". The parent 04-cms-delivery-media.md line 242 declares only "Depends on: Shard 00 platform contracts, Shard 01 authority, and Shard 03 CMS definition/publication control plane" and its Cross-Shard Section Contract Map (lines 251-254) has entries for 00, 01, 03, 05 only. The reverse direction is equally silent: I read the Cross-Shard Contracts tables in deep-dives/06-trust-safety.md, deep-dives/10-rights-ownership.md and deep-dives/20-licensing-core.md and none of them names Shard 04 as a counterparty. TIER 2 SUBSTANCE — FOUND, AND IT CONFIRMS THE CONSUMPTION DIRECTION. Ideation feature 25.06.03-rights-provenance-usage-consent.md is [DEEP] and its ratified decision table states D-01: "Upload is never proof of rights; publication consumes domains 09/11/24." Domain 09 = rights-ownership (IA Shard 10), domain 11 = music-licensing (IA Shard 20), domain 24 = trust-safety-disputes (IA Shard 06). feature-ledger.md lines 769-770 assign 25.06.03 and 25.06.04 to shard 04-cms-delivery-media. So the substance is settled: Shard 04 does consume 06/10/20 state, and the deep dive's text is not an authoring error. TIER 2 FORM — THE CONFLICT IS WITH A RATIFIED OWNER DECISION, AND NOTHING RESOLVES IT. .memory/wiki/decisions.md DEC-097 (owner-approved, 2026-08-02) states: "Dependencies must point only to lower-numbered shards." decomposition-plan.md line 98 repeats it and adds "No circular dependency is approved." ia/index.md line 9 repeats it. And the naive fix creates a real cycle, not just a rule violation: 05-platform-configuration-admin.md depends on Shard 04, and 06-trust-safety.md depends on Shard 05, so adding 04 -> 06 closes the loop 04 -> 06 -> 05 -> 04. I verified Shard 04's transitive closure is exactly {00, 01, 03}. WHAT CAME BACK EMPTY. I searched 2026-08-02-architecture-design.md and ENGINEERING-STANDARDS.md for any rule that distinguishes a synchronous read dependency from an asynchronous event-consumption edge, or that permits an upward edge for either — nothing (greps on 'acyclic', 'circular', 'lower-numbered', 'dependency direction', 'asynchronous dependency', 'event-driven decoupl'). ia/decomposition-validation.md section 'Dependency Direction' asserts only "All declared edges follow this direction" and records no exception. I searched decision-ratification-log.md, blocking-decision-queue.md, run2/run3 owner decision queues, run7 packets and the audits/run3-run7 JSON corpus for 'shard 04', 'delivery revoke', 'dependency direction', 'lower-numbered' — no decision covers this. The BE layer cannot corroborate: .memory/wiki/specs/be/ and .memory/wiki/specs/fe/ contain only .gitkeep, so the '157 backend contracts' do not exist in this repo. Two constraints are each independently ratified and they cannot both be satisfied by any wording the spec already contains. Choosing the reconciliation mechanism is an architecture decision the owner must make.

## Partially sourced (2)

Apply the sourced part; record the named sub-part as blocked on its existing upstream question rather than authoring it.

### A-11 — `09-projects-collaboration.md`

**Challenger ruling.** Parts (A), (B) and (C) are sourced and may be applied as written, with three amendments: fix (A)'s target is line 23, not line 20; fix (B) should keep the source's `disabled` and `error` states or state why they are dropped; fix (C) should drop the "least-privilege tension" edge case, since 07.07.01 Q-03 resolved it in favour of the handoff package as carrier. Part (D) must be reclassified OPEN. 07.06.04 cannot be specified to the depth proposed until the owner answers Q-02 (build the Operator room-scoped view at all?) and Q-03 (photo-only artifact vs structured model?) — both still live at owner-decision-queue.md:313-314. If A-11 must close now, (D) should be amended to spec only what D-01..D-06 ratify: one combined document (D-01); both halves shipped, design effort on the analogue half (D-02); photo of the paper sheet as a first-class, unstructured input (D-03); templating from a prior session as the primary completion mechanism (D-04); never rides along with the 07.06.02 capture prompt and no prompt at all — "any time before the paper is lost", never at close (D-05 + resolved Q-01 + 07.06.02 D-09 Tier 3); Operator view room-scoped and exactly filtered to gear/patching, never track names, *if built* (D-06). The structured `recall_sheet_row` schema and the Operator projection must be recorded as blocked on Q-03 and Q-02 respectively, not authored.

**Sourced fix as proposed.** File `.memory/wiki/specs/ia/09-projects-collaboration.md`. (A) REMOVE the WON'T capability. Edit line 35 to drop the last clause, so it reads: `- **07.08 Delivery, Readiness & QC** — pinned recipient packages, narrow objective QC, target-specific debt ledger and source declarations.` Then extend the Scope Reconciliation row at line 20 to: `| Proposed “won’t” capabilities | Format-specific master logic and Atmos product surface collapse to purpose-labelled/parallel lineage data; public remix stem programs (`07.08.05`, MoSCoW WON'T) are out of scope — 07 retains only the stem set (07.04.04) and the source-declaration clearance gate (07.08.04) |`. Add to § Delivery Phases → 'Explicitly excluded': `public remix stem programs and any Fan/anonymous vault audience`. Leave the Access Control table with no Fan row — that is now correct. (B) SPECIFY 07.05.05 — advisory revision counting. Add interaction `PRJ-21 | Open/close revision round | Producer opens a round against an accepted triage batch and closes it on delivery of a new immutable version; the count informs and never blocks or bills; a batching window accumulates drip-fed feedback into one round. | Round version, contents manifest and both-party-visible count commit.` Add contract `RevisionRound | Producer-writable, contributor-readable. Off unless a revision agreement exists. Round contents are always visible to both parties. Exhaustion is visible, never blocking. Scope classification (revision vs new request) is producer-authored with a reason and is disputable via Shard 06; the platform never classifies.` Add types `RoundState = configured | open | closed | exhausted | out_of_scope` and `ScopeVerdict = in_scope | out_of_scope` (from 07.05.05 § States and D-02). Add models `revision_agreement (id, song_id, engagement_ref?, included_rounds, batching_window, state, version)` and `revision_round (id, song_id, sequence, opened_at, closed_at?, version_id?, contents[], state, version)`. Add edge cases from the source table: exhausted rounds are visible and not blocked; a small fix opens no round; disputed counts route to Shard 06 with the round contents as evidence; absent agreement the surface is hidden. Add matching AC-PRJ-21 in the shard's standard template. Cite `07.05.05` Q-01 as an unresolved boundary in a note: whether the included-round count ORIGINATES in the Shard 14 service order or here is still open, so model `engagement_ref` as a nullable pointer and never as a second writer. (C) SPECIFY 07.07.01 — reference briefs. Add interaction `PRJ-22 | Maintain mix brief | Author adds reference pointers with timestamped annotations and optional prose; a reference-only brief is complete; contradictory references are surfaced, never adjudicated. | Living brief version and annotation commit; no stage gate.` Add contract `MixBrief | Living document, never a contract and never stage-gated. Commercial references are stored as external timestamped links only — the platform never hosts or streams third-party playback. In-platform unreleased references by the same party play natively. Reference loudness/tonal targets carry forward to the mastering flow automatically.` Add models `mix_brief (id, song_id, state, version)` and `brief_reference (id, brief_id, kind: external_link | platform_version, external_uri?, source_version_id?, timestamp_ms?, annotation, version)`. Add edge cases: contradictory references surfaced not resolved; brief revised mid-mix is normal and carries a change history; a mastering-engineer roster role wanting the brief is a stated least-privilege tension. Add AC-PRJ-22. (D) SPECIFY 07.06.04 — track sheet / channel map / recall sheet. Promote the existing `recall_sheet_version` model row into a real flow. Add interaction `PRJ-23 | Author recall sheet | Derived half pre-populates from the session snapshot manifest (tracks, channel counts, sample rate, plugin chains); the producer authors the analogue half (mic, preamp, placement, outboard settings, room); prompted separately from the credit capture prompt. | Immutable-by-default sheet version with attributed edits; Operator receives a room-scoped projection.` Add contract `RecallSheet | Two halves with different provenance: derived rows are machine-populated and never typed; analogue rows are human-authored and cannot be derived. Operator visibility is room-gear/patching only — never track names, creative content, songs or attendance. Sheet inherits the session's sensitivity.` Add models `recall_sheet (id, session_id, state, version)` and `recall_sheet_row (id, sheet_id, half: derived | analogue, channel?, source_ref?, gear_ref?, placement?, settings?, author, version)`. Add AC-PRJ-23. Add edge case: sheet authored with the analogue half empty is valid and marked incomplete — never blocking. (E) Update the § Changelog with a row recording the three added flows and the WON'T exclusion.

**Sources.** .memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.05-revision-round-counting-scope.md (full file; Decisions table D-01..D-05) · .memory/wiki/specs/ideation/07-music-projects-collaboration/07.07-mix-master-workflow/07.07.01-mix-brief-reference-board.md (full file; Decisions table D-01..D-05) · .memory/wiki/specs/ideation/07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06.04-track-sheet-channel-map-recall.md (full file; Behavior, Happy Path) · .memory/wiki/specs/ideation/moscow-ledger.md line 609, 611, 612 (COULD) and line 789 (WONT, section header line 771) · .memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-index.md line 71 (Q-03, unratified [OWNER]) · .memory/wiki/decisions.md line 395-398 (DEC on 07.08.01 recipient specs; `live` and `remix` given no invented contents)

### A-19 — `30-booking-contracts.md`

**Challenger ruling.** The gap is partly answered; the fix must be amended, not applied as written. SOUND and safe to apply now: deleting `EMBARGO_ACTIVE` from `AuthorizeAnnouncement` (incoherent under either resolution of Q-05 — 19.02.01's `Embargoed` is defined as "Show created, before the announce instant", so it is the state announce terminates, never a blocker of it); the Tier-1 error set `BOOKING_NOT_CONFIRMED`/`ANNOUNCE_CONSENT_INCOMPLETE`/`SCHEDULE_UNSET`/`SCHEDULE_UNKNOWN`/`LINEUP_UNRESOLVED`/`GROUP_MEMBER_NOT_READY` (P-01..P-05, ratified by D-05/D-06/D-07); items (2) and (3)'s Unknown-fails-closed rewrite (D-14 + DT-14); item (5)'s Shard 35 dependency (P-03 requires reading the schedule); item (6)'s stale-filename correction; and item (7)'s refusal to author P-02/P-05 here. MUST CHANGE: (a) label `DEPOSIT_UNSATISFIED` as carrying the shard's EXISTING locked rule — non-waivable when the accepted deal sets `deposit_due_before_announce` — and add a note that whether P-07 is waivable at all is open owner decision 17.01.04 Q-01, deferred to `/create-prd`. Do not write "P-07, waivable" while line 32 says the opposite. (b) Drop the "Announce embargo" architecture-decision row, or downgrade it to a pointer stating that the relationship between `confirmed_unannounced` and Shard 35's embargo is open (17.01.04 Q-05, deferred to `/create-prd-architecture`); `EMBARGO_ACTIVE` can be deleted without deciding Q-05. (c) `CONTRACT_UNEXECUTED` (P-06) may be marked waivable — D-07 ratifies it ("Contract execution moves to the waivable announce tier. Resolves Q-03") — but who may waive is itself open (Q-02, `/create-prd-security`), so do not spell out delegate authority. Minor: item (5)'s target is under `## Cross-Shard Dependencies` (line 345), not `## Related Specs` (line 369).

**Sourced fix as proposed.** All edits in `.memory/wiki/specs/ia/30-booking-contracts.md`. The principle: embargo is a STATE that announce ends, not a blocker of announce, so `EMBARGO_ACTIVE` is deleted; the error set is rebuilt to map 1:1 onto the ratified preconditions P-01..P-07. (1) `## Contracts → ### Command Contracts`, line 132 — replace the `AuthorizeAnnouncement` row with: `| `AuthorizeAnnouncement` | deal, prerequisite evidence/version | authorization | `BOOKING_NOT_CONFIRMED` (P-01), `ANNOUNCE_CONSENT_INCOMPLETE` (P-02), `SCHEDULE_UNSET` (P-03), `SCHEDULE_UNKNOWN` (P-03 unreadable — fails closed), `LINEUP_UNRESOLVED` (P-04), `GROUP_MEMBER_NOT_READY` (P-05), `CONTRACT_UNEXECUTED` (P-06, waivable), `DEPOSIT_UNSATISFIED` (P-07, waivable), `HARD_GATE_FAILED` |` (Error-code naming is an implementation decision; the SET is fixed by the ratified precondition list and is not negotiable.) (2) AC-30.14, line 72 — replace the trailing failure clause `if the flow cannot complete, Deposit/lineup/embargo gap returns exact blocker.` with: `if the flow cannot complete, the exact unsatisfied precondition and its tier are returned; a precondition whose status cannot be read returns Unknown and the gate fails closed, never satisfied.` (3) Interaction row 30.14, line 104 — replace the Failure/recovery cell `Deposit/lineup/embargo gap returns exact blocker` with: `Exact unsatisfied precondition and tier returned; unreadable precondition returns Unknown and fails closed` (4) `### Architecture Decisions` table — replace the `Confirmation and announce` row (line 31) with: `| Confirmation and announce | Confirmation requires one accepted offer version, both approval chains and artist approval; executed paper is not required. Announcement is a separate two-tier gate: Tier 1 is non-waivable (confirmed booking state, both principals' announce consent or a pre-authorising deal term, an announce datetime in Shard 35 plus an on-sale datetime or an explicit free/RSVP marker, lineup honesty, announce-group readiness); Tier 2 is waivable by two-key consent with a permanent attributed reason (executed contract, cleared deposit). |` And append a new row: `| Announce embargo | The pre-announce embargo is not an announce precondition. It is the state the booking occupies before announce — this shard's `confirmed_unannounced` deal state, which is Shard 35's `OnSaleSchedule` embargo state seen from the booking side. Announce ends the embargo; the embargo never blocks announce. |` (5) `## Related Specs` line 345 — add Shard 35 to **Depends on** (P-03 requires reading its schedule; today Shard 35 appears only under **Depended on by**): `- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/01-identity-authority|Shard 01]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/11-community-graph|Shard 11]], [[specs/ia/29-venues-spaces|Shard 29]], [[specs/ia/35-ticket-products-sales|Shard 35]]` (6) `### Cross-Shard Section Contract Map` line 358 — the Shard 35 row currently points at the nonexistent `35-discovery-recommendations.md`. Correct the target and state the actual read direction: `- **Shard 35:** consume [Shard 35 Contracts](35-ticket-products-sales.md#contracts) into this shard `§ Contracts` — specifically the `OnSaleSchedule` announce/on-sale datetimes and free/RSVP marker required by announce precondition P-03; an unreadable schedule renders Unknown and fails the gate closed. Publish this shard `§ Event Schemas` to [Shard 35 Event Schemas](35-ticket-products-sales.md#event-schemas). Shard 35 owns fan-facing schedule execution; this shard owns announce authority.` (Lines 356-357 carry the same stale-filename defect — `31-live-settlement.md`, `32-event-operations.md` — but those belong to A-21's family fix, not this one.) (7) Separately raise, do NOT silently author here: Shard 30 models neither P-02 (two-key announce consent / pre-authorising deal term) nor P-05 (artist-owned announce groups, ejection, and the Operator's count-without-identities view). Both are fully specified in ideation 17.01.04 §§ 'Announce readiness' and 'Announce groups (the tour announce)'.

**Sources.** .memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.04-confirmation-announce-gate.md § Behavior → Announce readiness (Tier 1 table P-01..P-05, Tier 2 table P-06..P-07) · .memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.04-confirmation-announce-gate.md § States, row `Confirmed (unannounced)`, line 205 · .memory/wiki/specs/ideation/19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.01-announce-on-sale-scheduling.md § Decisions D-02, line 113, and § States row `Embargoed`, line 78 · .memory/wiki/specs/ideation/19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.01-announce-on-sale-scheduling.md § Behavior, line 25 · .memory/wiki/specs/ia/deep-dives/30-booking-contracts.md § Confirmation and Announcement, lines 33-40 · .memory/wiki/specs/ia/30-booking-contracts.md lines 72, 104, 132 (the defect) and line 178 (deal state machine already carrying `confirmed_unannounced`) · .memory/wiki/specs/ia/35-ticket-products-sales.md § Data Models, `OnSaleSchedule`, line 130

## Ready, with challenger amendments (2)

### A-16 — `22-release-distribution.md`

**Challenger ruling.** Do NOT reclassify the gap as OPEN — shard 22's total absence of MEAD is genuine, and D-01..D-04, PC-13, :291-292, :355, CX-05, CX-06 and R-01/R-02 are correctly quoted and do carry items (1)-(5), (7) and (8). Amend the fix instead: (a) rewrite item (6)'s inferred-tempo/key row to the source's actual scope — "Correctable; the correction is attributed, and whether it propagates to the Shard 09 version-scoped record or stays release-local is OPEN (ideation 12.02.04 Q-02, Agent-owned, deferred to /create-prd-security, blocked on the permission model)" — and drop the "verbatim from ideation" label from that row; (b) add Q-02 to the fix's STILL-OPEN-UPSTREAM note alongside Q-01, since Q-02 is the one that actually constrains shard 22's text; (c) drop or re-source the CX "lines 22-26" citation for item (1) — takedown/update as DeliveryMessageKind members are defensible from 12.02.02 PC-12 and shard 22's own Scope Reconciliation, not from that line range; (d) soften the claim that 12.02.04's own [PENDING] is closed — 12.02.02:355 closes CX-05's, and the field-list argument is the fixer's reasoning.

**Proposed fix (apply as amended above).** FILE: .memory/wiki/specs/ia/22-release-distribution.md (1) § Contracts → Types and Errors — ADD two types: | `DeliveryMessageKind` | `ern | mead | takedown | update`. The sub-domain owns the outbound release-delivery standards; `mead` is independently sequenced and never gates any other kind. | | `DescriptorProvenance` | `witnessed | inferred | asserted`. `witnessed` = projected from the Shard 09 project record or Shard 07 credits; `inferred` = derived by audio analysis; `asserted` = supplied by the user. An `inferred` value is NEVER delivered to a partner as an artist assertion, and every `inferred` value is correctable. | (2) § Interactions and § Acceptance Criteria — ADD one interaction (append as DST-21 or insert after DST-08): | DST-N | Owner enriches release descriptors | Pre-fill mood/tempo/key/instrumentation/personnel/live-vs-programmed from the Shard 09 project record and Shard 07 credits, stamping each value `witnessed`; add audio-derived tempo/key stamped `inferred`; prompt the Producer only for gaps they are uniquely authoritative for. Descriptors are ONE source shared with the editorial pitch surface (DST-13), projected twice, never authored twice. | Versioned enrichment record; delivery is never blocked by its absence or incompleteness. | Add the matching AC in the shard's existing Given/when/then/(1)-(6) form, with the refusal clause explicitly stating that an enrichment failure never blocks or fails the release delivery. (3) § Contracts → Build, Delivery and Lifecycle Contracts — AMEND `GenerateDeliveryMessage` to take `DeliveryMessageKind`, and ADD: | `GenerateEnrichmentMessage` | SEPARATE generator from `GenerateDeliveryMessage`. MEAD's content source is the session record (Shard 09/07), not the release composition object, so it must not share the ERN generator — coupling a never-blocking enrichment message into the blocking delivery path inverts the dependency. Projects the enrichment record against the partner's knowledge version. Delivered only where the partner profile's MEAD capability flag is true; where false, SKIPPED SILENTLY — no error, no failure event, no user-visible failure state. May be dispatched after ERN acceptance as an independently tracked delivery against the same release. | (4) § Data Models — AMEND and ADD: - `partner_knowledge_version` — add a capability-flag set including `mead_supported: boolean` alongside the existing ERN/deal/territory keys. When a partner's flag flips false→true, previously undeliverable enrichment records become retroactively deliverable. - `delivery_message` / `delivery_snapshot` — add `kind: DeliveryMessageKind`. Message threads and supersession are scoped per kind, so a MEAD thread never supersedes an ERN thread. - ADD `release_enrichment` | Release/recording scope, descriptor set with per-field `DescriptorProvenance` and asserting party, correction history, version. RETAINED EVEN WHERE NO SELECTED PARTNER CURRENTLY SUPPORTS MEAD — retention is what makes a later capability-flag flip deliver the backlog at zero authoring cost. It is the single source projected to both the MEAD message and the editorial pitch. | Add `kind` and the provenance field to § Typed Field and Cardinality Registry as `closed enum`. (5) § Interactions — AMEND DST-13 ("Owner manages editorial/pre-save/timeline") so the editorial pitch READS `release_enrichment` rather than holding its own claims, and state the invariant: the two surfaces cannot tell one partner two different stories because there is one record with two projections. (6) § Edge Cases — ADD, verbatim from ideation: "Partner does not consume MEAD | Skip silently; never an error path; user sees honest reach ('sent to N of M stores that use it'), never an implied failure." | "Partner adds MEAD support later | Retained enrichment becomes retroactively deliverable; deliver the backlog." | "Inferred tempo/key is wrong | Correctable; the correction is append-only and attributed, and flows back to the Shard 09 version-scoped record (key and tempo are version properties, not Song properties), NOT release-local only." | "Owner skips enrichment entirely | Delivery proceeds unchanged; advisory only, never a gate." | "MEAD delivered after ERN acceptance | Normal; independently sequenced." | "Off-platform master with no project record | Nothing to pre-fill; full manual entry, correctly scoped to the case that earns it." (7) § Access Control — Musician and Producer both Config on `release_enrichment` (per the 12.02 Role Matrix); Operator and Fan None. (8) § Event Schemas — ADD `release.enrichment.changed.v1` and `release.enrichment.delivered.v1` (release/partner/kind/state/version). Note that a SKIP emits no failure event. NOT BLOCKING, and do not treat as missing information: the exact MEAD field list is knowledge-version data, exactly as the ERN field list already is in this shard — `GenerateDeliveryMessage` is a profile projection and shard 22 enumerates no ERN fields either. Authoring MEAD symmetrically needs no new decision. STILL OPEN UPSTREAM but out of scope for this fix, flagged so nobody re-raises it as an IA gap: ideation 12.02.04 Q-01 (whether partners meaningfully consume MEAD, which could move it to `wont`) is Agent-owned, deferred to /create-prd, and was never answered. The feature ledger still carries it as `Could` assigned to shard 22, so the IA layer must represent it; if the owner later drops it to `wont`, that is a ledger change that cascades here, not a reason to leave the shard's 25/25 claim false today.

**Sources.** .memory/wiki/specs/ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02.04-mead-enrichment-delivery.md § Behavior (lines 27-39), § Happy Path (lines 45-50), § Edge Cases (lines 56-61), § States (lines 67-71), § Decisions D-01..D-04 (lines 94-97) · .memory/wiki/specs/ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02.02-per-partner-profile-conformance.md:84 (PC-13 capability flags), :291-292 (skip and retroactive-enrichment edge cases), :355 (resolves the [PENDING]) · .memory/wiki/specs/ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-cx.md CX-05 (lines 14, 80-94), CX-06 (line 15), Rejected Pairs R-01/R-02 (lines 102-103), and the sub-domain scope statement at lines 22-26 · .memory/wiki/specs/feature-ledger.md:567 · .memory/wiki/specs/ia/22-release-distribution.md § Contracts (`GenerateDeliveryMessage`), § Data Models (`partner_knowledge_version`, `delivery_message`)

### A-29 — `05-platform-configuration-admin.md`

**Challenger ruling.** Tier 2 survives for the Support operator row (architecture 746 verbatim) and for the purpose grant as a constrained instance of the existing Capability grant contract. The FIX must be amended before landing: strike "or to a Configuration approver where no current grantor exists" and route capability-denial fallback to CFG-11's own "capable administrator", not to an approver; delete the stalled-approval bullet clause entirely (no source, and it conflates grantor with approver) or mark it OPEN; delete "A disputed effective value escalates to a Configuration approver on the frozen candidate" unless it is re-derived from an actual CFG-03/CFG-04 line. Correct the anchors: insert the Support row after line 164, not 166; the escalation block is lines 168-177.

**Proposed fix (apply as amended above).** THREE EDITS, all in `.memory/wiki/specs/ia/05-platform-configuration-admin.md`. EDIT 1 — `## Access Control` table: insert a new final row after `| Service principal | ... |` (line 166), keeping the table's `| Capability | Allowed | Explicit denial |` column order: | Support operator | View the minimum support projection for a named case/request, correlate request IDs, and execute named mechanical recovery workflows with a stated reason under a purpose grant. | Content/body access by default, payment/legal evidence, granting or altering any capability, direct database mutation. | (The Allowed and Explicit-denial text is architecture line 746 verbatim, re-cased to this table's sentence style.) EDIT 2 — `### Contracts`: insert directly after the `Capability grant` row (line 95): | Purpose grant | The support form of a capability grant: an `AdminCapabilityGrant` whose `resource_type/id` names exactly one case, order, request or record; whose `actions[]` are drawn only from the registered mechanical-recovery workflow keys; whose `ends` is mandatory and set by the grantor at issue per CFG-11; and which can never carry grant/revoke actions. No wildcard resource or action. Expiry is automatic, revocation immediate, and every use is audited with the stated reason. | EDIT 3 — replace the whole `### Access Escalation` block (lines 169-177) with a stated common rule plus eight differentiated bullets. Common rule first: > A denial returns a typed reason and preserves canonical state. Three routes exist and they are not interchangeable. (a) A **capability or authority denial** — missing, expired or revoked grant, insufficient scope, stale MFA — escalates to the `grantor` recorded on the actor's `admin_capability_grant`, or to a Configuration approver where no current grantor exists, via CFG-11. It never routes to Trust & Safety. (b) An **evidence or party-authority dispute about the target of a change** routes to the Shard 06 scoped case path. (c) **Mechanical recovery** — a stuck job, a lost artifact, an unresolvable request ID — is performed by a Support operator under a purpose grant naming that single object; a Support operator can never grant, widen or restore a capability. Counsel, capability and privacy hard gates have no role override by any route. Then the eight bullets (each written from that capability's own Explicit-denial cell at lines 158-167 — no new policy is introduced): - **Settings editor:** denial for an unassigned definition or out-of-scope value escalates to the grantor via CFG-11. A disputed effective value escalates to a Configuration approver on the frozen candidate. Key creation, scope broadening, risk lowering and secret access are hard denials with no route. - **Configuration approver:** self-approval of a protected change and editing a candidate during review are separation-of-duties hard gates with no escalation. A stalled approval escalates to a second capable approver, or to the grantor where none exists. - **Release manager:** using a flag as an authorization, legal or business rule is a hard gate with no override. Environment or canary scope denial escalates to the grantor via CFG-11. - **Experiment operator:** protected-trait targeting and covert access/price/eligibility discrimination are hard gates with no override. Cohort, metric or consent-scope denial escalates to the grantor. - **Incident operator:** denial of an unassigned kill switch or break-glass escalates to the break-glass grantor and issues under the Capability grant contract with MFA, reason, bounded term, notification and evidence. Arbitrary mutation and permanent elevation are hard denials with no route. - **Admin operator:** task, search or bulk scope denial escalates to the grantor. A request to reach a party's private data routes to the Shard 06 case path or to a Privacy/legal operator — never to a broader admin grant. - **Privacy/legal operator:** hold, erasure and third-party-rights conflicts escalate to counsel; the counsel gate has no override. A denied ordinary-content read beyond the case has no escalation route. - **Service principal:** no human escalation route exists. A denial is a typed refusal to the caller plus an operations task against the registered consumer; a Support operator may not recover a service principal by grant.

**Sources.** .memory/wiki/specs/2026-08-02-architecture-design.md § Security Model → ### Authorization Roles and Explicit Permissions (section header line 730; Support operator row line 746; preamble line 732) · .memory/wiki/specs/2026-08-02-architecture-design.md line 77 (Component map — Admin Backoffice & Support Console) · .memory/wiki/specs/ia/05-platform-configuration-admin.md line 95 (Contracts — Capability grant), line 118 (Data model — AdminCapabilityGrant), line 61 (CFG-11), lines 158-167 (Access Control table), lines 170-177 (the defective Access Escalation bullets) · .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md line 39 (admin_capability_grant field list), line 66 (grant lifecycle), line 139 (break-glass abuse test row) · .memory/wiki/specs/ia/22-release-distribution.md line 197; 37-fanbase-direct-to-fan.md line 216; 38-promotion-marketing.md line 235; 39-analytics-ingestion-reporting.md line 173; 40-market-intelligence-signals.md line 156; 41-career-finance.md line 189; 42-career-planning-risk.md line 120; deep-dives/37-fanbase-direct-to-fan.md line 181 (the layer's consistent purpose-grant convention)

## Ready to apply (28)

### A-01 — `01-identity-authority.md`

**Tier.** 2 (upstream spec — same-shard Interactions table + deep dive; BE as corroboration)

**Sources.**
- `.memory/wiki/specs/ia/01-identity-authority.md § Interactions, line 72 (intact source row IDA-15)`
- `.memory/wiki/specs/ia/01-identity-authority.md § Acceptance Criteria, lines 48 and 50 (AC-IDA-14 / AC-IDA-16 — intact template)`
- `.memory/wiki/specs/ia/deep-dives/01-identity-authority.md § State machine, line 114`
- `.memory/wiki/specs/be/01d-identifiers-legacy.md § State Machine Registry (corroboration only; retrieve with `git show 7986b4d:.memory/wiki/specs/be/01d-identifiers-legacy.md`)`

**Source quote.** | IDA-15 | Record external identifier | Validate namespace format/capacity, record provenance, and attempt configured registry verification. | Identifier is labelled `self_asserted|verified|mismatch|collision|revoked`. | —— and the deep dive, line 114: "| Identifier claim | `self_asserted → verifying → verified|mismatch|collision|self_asserted`; any non-revoked → revoked; collision clears only by evidence/withdrawal. |"

**Fix.**

```
TWO edits to /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/01-identity-authority.md.

EDIT 1 — § Acceptance Criteria, line 49. Replace the entire bullet with:

- **AC-IDA-15 — Record external identifier:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Validate namespace format/capacity, record provenance, and attempt configured registry verification, and (6) return Identifier is labelled `self_asserted|verified|mismatch|collision|revoked`; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

(That is the exact boilerplate proven by AC-IDA-14 and AC-IDA-16, with step 5 = the IDA-15 Required-behavior cell minus its trailing period and step 6 = the IDA-15 Completion cell minus its trailing period. The AC is a list item, not a table row, so the pipes inside the code span need no escaping there.)

EDIT 2 — § Interactions, line 72. Escape the pipes so the four-column row renders and the generator cannot shift columns again. Replace the line with:

| IDA-15 | Record external identifier | Validate namespace format/capacity, record provenance, and attempt configured registry verification. | Identifier is labelled `self_asserted\|verified\|mismatch\|collision\|revoked`. |

Edit 2 is the root-cause fix; without it the next regeneration reintroduces Edit 1's defect.

NOTE FOR THE SAME PASS: AC-RGT-10 in .memory/wiki/specs/ia/10-rights-ownership.md line 54 (source row line 79, enum `authorized | blocked | no_recorded_obstacle`) is the fourth instance of this identical defect and is filed separately as A-12.
```

**Challenge result.** CONFIRMED — Every citation is exact and present. (1) `.memory/wiki/specs/ia/01-identity-authority.md` line 72 is verbatim the claimed source row: "| IDA-15 | Record external identifier | Validate namespace format/capacity, record provenance, and attempt configured registry verification. | Identifier is labelled `self_asserted|verified|mismatch|collision|revoked`. |" — intact, four logical columns in raw text, full five-value enum present. (2) Line 49 is the corrupted AC exactly as described: "- **AC-IDA-15 — Record external identifier:** Given Validate namespace format/capacity, record provenance, and attempt configured registry verification., when the actor invokes this flow, then the system MUST (1) validate inputs, ... (5) Record external identifier, and (6) return Identifier is labelled `self_asserted; if the flow cannot complete, verified." Three of the five enum values (`mismatch`, `collision`

### A-02 — `02-profiles-verification.md`

**Tier.** 2 (upstream spec — decomposition plan is authoritative; ideation ratified the adjudication posture; IA Shard 06 already carries the contract)

**Sources.**
- `.memory/wiki/specs/ia/decomposition-plan.md line 52 (shard 06 ← ideation 24.01–24.09) and line 48 (shard 02 ← ideation 01.05–01.08)`
- `.memory/wiki/specs/ia/decomposition-plan.md line 98 (dependency direction rule)`
- `.memory/wiki/specs/ia/06-trust-safety.md § Features (24.07) and § Contracts › Core Types and Errors (`CaseKind`), § Interactions TSE-01/TSE-03/TSE-13, § Contracts › Policy, Decisions and Enforcement (`ActivateDecision`)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md Q-01 (marked ✅ Resolved)`
- `.memory/wiki/specs/ideation/01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.03-contested-claims-ownership-transfer.md D-02 (line 112), D-07 (line 117), Edge Cases (line 68)`
- `.memory/wiki/specs/ia/index.md lines 21 and 39 (shard 06 vs shard 24 boundaries)`

**Source quote.** decomposition-plan.md line 52: "| 06 | 06-trust-safety.md | Trust, safety, disputes and evidence | 24.01–24.09 | 9 | High | Feature domain | Yes | 00, 01, 05 |" —— ideation 24.07 Q-01: "**RESOLVED — no. The platform executes a *recorded* disposition rule against its own state and never adjudicates a claim; where nothing was recorded, or the claim is contested, it freezes and routes out.**" —— ideation 01.05.03 Edge Cases: "| Band name contested at dissolution with no recorded agreement | … | Freeze; route to 24 and to lawyers |" —— IA 06-trust-safety.md § Contracts: "| `CaseKind` | `safety_report | moderation | dmca | fraud_review | transaction_dispute | impersonation | ownership | legal_process | illegal_content | crisis | governance` |" and "| TSE-13 | Resolve identity/ownership case | Shard 01 party, alias, credit, membership and mandate truth controls; credential possession is not ownership. | Scoped outcome preserves ownership records. |"

**Fix.**

```
THREE files. Every occurrence of the string 'Shard 24' in shard 02 and its deep dive is an ideation-domain reference and must become Shard 06.

A) /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/02-profiles-verification.md — five string replacements:
  • line 40 (AC-PRF-08, step 6): 'credible conflict freezes control and routes Shard 24' → 'credible conflict freezes control and routes a `CaseKind = ownership` case to [Shard 06](06-trust-safety.md) via `CreateReport` (TSE-01) for resolution under TSE-13'
  • line 61 (Interactions PRF-08, Completion cell): same replacement, plain text form 'routes a `CaseKind = ownership` case to Shard 06 (TSE-01 intake, TSE-13 resolution)'
  • line 89 (Contracts, `Contest` row): 'three attempts/target/rolling 90 days then Shard 24 review' → 'three attempts/target/rolling 90 days then Shard 06 review'
  • line 201 (Event Schemas, `profile.contest.changed.v1` Consumer contract cell): 'Shard 24, operations, notifications, commerce refetch.' → 'Shard 06 (opens or updates the `ownership` case), operations, notifications, commerce refetch.'
  • line 219 (Edge Cases): 'route Shard 24; platform does not guess.' → 'route Shard 06; platform does not guess.'

B) /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/deep-dives/02-profiles-verification.md — four string replacements:
  • line 9: 'Shard 24 adjudication' → 'Shard 06 adjudication'. In the SAME sentence also fix the adjacent ideation-numbering leak: 'Shard 02 credit meaning/rungs' → 'Shard 07 credit meaning/rungs' (ideation domain 02 = Credits & Attribution = IA Shard 07, which owns rungs — see 07-credits-core.md § Features '02.04 Attestation & Credit Confidence' and AC-CRD-16).
  • line 28: 'Credible two-sided contests freeze and route Shard 24.' → '… route Shard 06.' (keep the following sentence 'Before that capability ships, freeze is terminal-but-reviewable; no identity operator guesses.' — it is the sourced pre-ship fallback.)
  • line 103: 'freeze and route Shard 24.' → 'freeze and route Shard 06.'
  • line 162 (Cross-Shard Contracts table): '| Shard 24 | Typed claim contest, …' → '| Shard 06 | Typed claim contest, suppression/correction, false evidence, credential review, and trader mismatch case references. |'

C) Declare the dependency in both directions. Put the dependency edge on Shard 06's side so `decomposition-plan.md` line 98 ('Dependencies point only to lower-numbered shards') is preserved:
  • .memory/wiki/specs/ia/06-trust-safety.md § Cross-Shard Dependencies, '**Depends on:**' — append: '; [Shard 02](02-profiles-verification.md) for ownership-contest, claim, credential and trader-classification state — Shard 06 consumes `profile.contest.changed.v1`, `profile.credential.changed.v1` and `profile.trader-status.changed.v1` and opens `impersonation`/`ownership` cases; Shard 06 never mutates ownership (`ActivateDecision`).'
  • .memory/wiki/specs/ia/06-trust-safety.md § Cross-Shard Section Contract Map — insert, before the Shard 11 bullet: '- **Shard 02 — Profiles, claiming and qualifications:** consume [Shard 02 — Profiles, claiming and qualifications Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 — Profiles, claiming and qualifications Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.'
  • .memory/wiki/specs/ia/02-profiles-verification.md § Cross-Shard Dependencies, '**Depended on by:**' — change to: 'Shard 06 (ownership/impersonation/credential/trader case handling), Shard 15 and Shard 16 according to approved decomposition; …' (rest unchanged).
  • .memory/wiki/specs/ia/02-profiles-verification.md § Cross-Shard Section Contract Map — add the reciprocal bullet: '- **Shard 06 — Trust, safety, disputes and evidence:** consume [Shard 06 — Trust, safety, disputes and evidence Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 — Trust, safety, disputes and evidence Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.'
  • .memory/wiki/specs/ia/02-profiles-verification.md § Dependency References — add '- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]'.
  • .memory/wiki/specs/ia/decomposition-plan.md line 52 — change shard 06's dependency cell from '00, 01, 05' to '00, 01, 02, 05'. This is additive and does not violate line 98.

D) Housekeeping in ideation (not required for the IA fix, but it is what makes this gap read as OPEN): .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.03-contested-claims-ownership-transfer.md Q-01 (line 126) and identity-profiles-organizations-index.md Q-07 (line 122) both still say 'Verified still open on both sides of the seam'. Mark both ✅ Resolved and cite 24.07 Q-01, which closed it citing 01.04.02 D-02, 01.04.04 D-02 and 01.05.03 D-02.
```

**Challenge result.** CONFIRMED — The decisive check overturns nothing and in fact hardens the claim: IA Shard 24 is not trust and safety. `.memory/wiki/specs/ia/decomposition-plan.md` line 70: "| 24 | 24-gear-holdings-operations.md | Gear collections, rigs, custody and manifests | 15.04, 15.06–15.08, 15.10 | ..." and `.memory/wiki/specs/ia/index.md` line 39 agrees: "| 24 | 24-gear-holdings-operations.md | Gear collections, rigs, custody and manifests |". So every "Shard 24" string in shard 02 currently routes contested band-name ownership to the gear-custody shard. The references are ideation-domain-24 leaks, exactly as claimed. Mapping citations verified verbatim: decomposition-plan line 52 is "| 06 | 06-trust-safety.md | Trust, safety, disputes and evidence | 24.01–24.09 | 9 | High | Feature domain | Yes | 00, 01, 05 |"; line 48 is "| 02 | 02-profiles-verification.md | Profiles, claiming and qualifications | 01.05–01.

### A-03 — `02-profiles-verification.md`

**Tier.** 2 (upstream spec — same-shard Interactions table and Contracts section; BE as corroboration)

**Sources.**
- `.memory/wiki/specs/ia/02-profiles-verification.md § Interactions, line 68 (intact source row PRF-15)`
- `.memory/wiki/specs/ia/02-profiles-verification.md § Contracts, line 112 (Commerce gate)`
- `.memory/wiki/specs/ia/02-profiles-verification.md § Acceptance Criteria, line 48 (AC-PRF-16 — intact, uses `review_required`)`
- `.memory/wiki/specs/be/02c-credentials-trader.md (corroboration only; retrieve with `git show 7986b4d:.memory/wiki/specs/be/02c-credentials-trader.md`)`

**Source quote.** | PRF-15 | Declare trader status | At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission. | Approved rule pack resolves `private|trader|undetermined|review_required`; listing gate rechecks. | —— § Contracts line 112: "| Commerce gate | No listing publishes unless classification and counsel-approved disclosure rule pack are current for seller/buyer jurisdiction. Unknown or review-required fails closed. |"

**Fix.**

```
TWO edits to /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/02-profiles-verification.md.

EDIT 1 — § Acceptance Criteria, line 47. Replace the entire bullet with:

- **AC-PRF-15 — Declare trader status:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission, and (6) return Approved rule pack resolves `private|trader|undetermined|review_required`; listing gate rechecks; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

EDIT 2 — § Interactions, line 68. Escape the pipes so the row stays four-column:

| PRF-15 | Declare trader status | At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission. | Approved rule pack resolves `private\|trader\|undetermined\|review_required`; listing gate rechecks. |

Edit 2 is the root-cause fix. Both `undetermined` and `review_required` must survive verbatim in the AC — they are the fail-closed values the § Contracts 'Commerce gate' row depends on, and an implementer testing only against the corrupted AC ships a two-value classifier that cannot block a listing.
```

**Challenge result.** CONFIRMED — All four citations are exact. (1) `.memory/wiki/specs/ia/02-profiles-verification.md` line 68 is verbatim the claimed intact source row: "| PRF-15 | Declare trader status | At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission. | Approved rule pack resolves `private|trader|undetermined|review_required`; listing gate rechecks. |" (2) Line 47 is the corrupted AC: "- **AC-PRF-15 — Declare trader status:** Given At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission., ... (5) Declare trader status, and (6) return Approved rule pack resolves `private; if the flow cannot complete, trader." Both fail-closed values `undetermined` and `review_required` are destroyed, and so is "listing gate rechecks". The stated consequence is real, not rhetorical. (3) Line 112 is verbatim 

### A-04 — `03-cms-content-modeling.md`

**Tier.** 2 (upstream spec — same-shard Interactions table and Contracts section)

**Sources.**
- `.memory/wiki/specs/ia/03-cms-content-modeling.md § Interactions, line 68 (intact source row CMS-15)`
- `.memory/wiki/specs/ia/03-cms-content-modeling.md § Contracts, line 111 (Localization)`
- `.memory/wiki/specs/ideation/25-content-management-platform-configuration/25.05-taxonomies-localization-relationships/25.05.03-localization-variants-fallback.md D-01, line 75 (blocker confirmed upstream; enum not enumerated there)`
- `.memory/wiki/specs/be/03c-composition-taxonomy-localization.md (partial corroboration only, token drift noted; retrieve with `git show 7986b4d:...`)`

**Source quote.** | CMS-15 | Author locale variant | Translate allowed fields, track `untranslated|draft|review|approved|stale`, and preview explicit fallback chain. | Legal/safety/no-fallback fields block locale publish when absent/stale. | —— § Contracts line 111: "BCP 47 locale IDs, one source locale, explicit ordered fallback per type/field, stale-on-source-change. Legal/safety/jurisdictional fields default `no_fallback`." —— ideation 25.05.03 D-01: "Locale variants do not fork canonical identity/transactions; legal and safety fields may block fallback."

**Fix.**

```
TWO edits to /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/03-cms-content-modeling.md.

EDIT 1 — § Acceptance Criteria, line 47. Replace the entire bullet with:

- **AC-CMS-15 — Author locale variant:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Translate allowed fields, track `untranslated|draft|review|approved|stale`, and preview explicit fallback chain, and (6) return Legal/safety/no-fallback fields block locale publish when absent/stale; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

EDIT 2 — § Interactions, line 68. Escape the pipes so the row stays four-column:

| CMS-15 | Author locale variant | Translate allowed fields, track `untranslated\|draft\|review\|approved\|stale`, and preview explicit fallback chain. | Legal/safety/no-fallback fields block locale publish when absent/stale. |

Edit 2 is the root-cause fix. The completion condition is the load-bearing part — restoring it is what stops a test written from the AC passing a build that publishes a locale variant with a missing legally required field.

SEPARATE, NON-BLOCKING: when the BE layer is re-authored, its locale-variant state machine must adopt the IA tokens (`untranslated|draft|review|approved|stale`) rather than the `draft|stale → in_review → approved|rejected` set the deleted BE draft used. IA is authoritative; the drift should not be re-created.
```

**Challenge result.** CONFIRMED — All citations verified, including the ideation line number. (1) `.memory/wiki/specs/ia/03-cms-content-modeling.md` line 68 is verbatim: "| CMS-15 | Author locale variant | Translate allowed fields, track `untranslated|draft|review|approved|stale`, and preview explicit fallback chain. | Legal/safety/no-fallback fields block locale publish when absent/stale. |" (2) Line 47 is the worst of the four corruptions: "- **AC-CMS-15 — Author locale variant:** Given Translate allowed fields, track `untranslated, ... (5) Author locale variant, and (6) return draft; if the flow cannot complete, review." The entire completion condition is gone — the AC now says the flow returns "draft" and fails with "review". Three of five state tokens (`approved`, `stale`, and the second half of the chain) are destroyed, and the legal/safety publish block is destroyed outright. A test written from this AC would pass

### A-05 — `06-trust-safety.md`

**Tier.** 2 upstream spec (ideation)

**Sources.**
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.04-trusted-flagger-priority-channel.md (Behavior lines 28-39; Happy Path 41-48; States 63-69; D-01/D-02 lines 92-93; Q-03 resolution line 101)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.05-messaging-safety-scam-filtering.md (Behavior; States; D-01..D-03 lines 103-105)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.04-triangulation-card-testing-defense.md (Behavior; States; D-01..D-03 lines 99-101)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.06-review-rating-integrity.md (Behavior; D-01..D-03 lines 97-99)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05.03-authenticity-counterfeit-brand-protection.md (Behavior; D-01..D-03 lines 103-105)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05.04-pre-release-leak-detection-response.md (Behavior; D-01..D-03 lines 116-118)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06.02-meetup-safety-safe-exchange.md (Behavior; D-01..D-05 lines 105-109)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.02-tvec-removal.md (Behavior; D-01..D-03 lines 101-103)`
- `.memory/wiki/specs/ideation/moscow-ledger.md lines 536, 542, 547, 548, 550, 554 (SHOULD) and 763, 766 (COULD)`

**Source quote.** 24.01.04 Behavior, lines 28-33: "Flagger status is granted per-entity and is a **permission that changes the SLA of a report**. Notices may arrive individually or in bulk via API; bulk submission must be idempotent per item so a retried 5,000-item notice does not create 10,000 cases. Each per-item decision writes back to the flagger's **accuracy ledger**, and sustained inaccuracy throttles or suspends the lane — DSA Art 22(6) requires suspension after frequent insufficiently-precise or inadequately-substantiated notices, so the write-back is not optional bookkeeping, it is the statutory mechanism." — and its Q-03 resolution, line 101, quoting 24.01.03 D-05: "Priority lanes use weighted-fair scheduling with a reserved capacity floor for safety-of-person queues, not strict priority ordering". 24.08.02 D-01, line 101: "Two mechanisms, kept separate: hash matching (narrow, automatic) and written policy (broad, human)"; D-03, line 103: "Removals run through the ordinary ladder with an SoR and an appeal". 24.03.04 Behavior: "Card testing: velocity rules on authorisation attempts — many small charges, many cards, one device or session, in minutes. Response is throttle-then-block in milliseconds, before any score is consulted" and D-02, line 100: "Triangulation gets a payout hold and a review, never an auto-block". 24.06.02 D-04, line 108: "The safety record is immutable and preserved on a clean check-out, not deleted". 24.05.04 D-01, line 116: "Forensic, not preventive: per-recipient watermarking + access log, never DRM". 24.05.03 D-01, line 103: "The control for misrepresented vintage is provenance, not detection". 24.03.06 D-03, line 99: "Review removal is an enforcement action with a rule, an SoR and an appeal". 24.01.05 D-02, line 104: "Default posture is metadata + recipient warning; content inspection only on report".

**Fix.**

```
All edits are in .memory/wiki/specs/ia/06-trust-safety.md unless stated.

(1) § Contracts → Core Types and Errors, line 105. Extend `CaseKind` to:
`safety_report | moderation | dmca | fraud_review | transaction_dispute | impersonation | ownership | legal_process | illegal_content | crisis | governance | counterfeit_authenticity | leak_forensics | review_integrity | meetup_safety`
(TVEC stays inside `illegal_content` but gains its own policy path per contract (4) below — 24.08.02 D-01 requires the two mechanisms be kept separate, not that TVEC be a separate kind.)

(2) § Interactions, after TSE-18 (line 88), add eight rows in the legacy 4-column schema `ID | Interaction | Required behavior | Completion`:
| TSE-19 | Submit trusted-flagger notice | Granted per-entity status shortens the report SLA and admits idempotent bulk API submission per item; the lane covers public content only, never private messages, and never bypasses SoR or appeal. Each per-item outcome writes back to the flagger accuracy ledger. | Per-item cases created at the granted SLA; accuracy-ledger entries committed; duplicate batch replay creates no additional case. |
| TSE-20 | Evaluate message-safety signal | Metadata/pattern signals only by default (new account + payment instruction + off-platform contact + urgency); content inspection escalates only on a participant report. Warning is inline, dismissible and never blocks the send. | Recipient warning surfaced or thread delivered clean; evaluation never delays delivery. |
| TSE-21 | Defend card testing and triangulation | Card-testing velocity per device/session/card-BIN-spread throttles then blocks at the rail before any score is consulted; digital fulfilment never precedes settlement confirmation. Triangulation indicators produce a payout hold plus review, never an auto-block, and below-market price is never a signal on its own. | Rail block recorded, or hold plus review case opened with the indicator set. |
| TSE-22 | Adjudicate review integrity | Detection runs on the fraud linkage graph, never on review data. Removal is an enforcement action requiring a cited rule, a Statement of Reasons to the review author and an appeal. Reputation and integrity are per-role; a ring in one role never contaminates another. | Review-removal decision recorded with cited rule, SoR and appeal route; per-role scope preserved. |
| TSE-23 | Review authenticity or counterfeit claim | Three claim paths converge (buyer post-purchase dispute, brand notice, platform listing-time detection) and must never yield contradictory seller reasons. Trademark exhaustion is checked before any brand claim is actioned. Misrepresented provenance is adjudicated against the Shard 23 registry chain, not against detection; innocent misrepresentation is a dispute, not an offence. | Single reconciled outcome per listing with the claim path and exhaustion check recorded. |
| TSE-24 | Respond to pre-release leak | Every delivery of an unreleased asset is watermarked per recipient at transfer and logged as a consequential action. A leak report matches the copy against the platform's own reference, extracts the watermark, traces the access log and produces a finding. The asset's release state changes the meaning of an identical match. | Forensic finding with watermark identity and access trace, or explicit no-attribution result. |
| TSE-25 | Attach meetup safety layer | Offered at the moment the meeting is arranged, never buried in settings: suggested public exchange location, optional check-in/check-out timer, share-my-meetup with a trusted contact. A restricted party cannot arrange a meeting, not merely cannot message. Inform and offer; never block or moralise. | Immutable arrangement safety record persisted; clean check-out preserves rather than deletes it. |
| TSE-26 | Apply TVEC removal | Two separate mechanisms: narrow automatic hash matching against designated-organisation sets, and broad written-policy judgment applied by a human with its reasoning in the risk register. No extremism scoring of users under any signal. Removal runs the ordinary enforcement ladder with a Statement of Reasons and an appeal. | Removal recorded against the mechanism actually used, with SoR and appeal route. |

(3) § Acceptance Criteria, after AC-TSE-18 (line 65), add AC-TSE-19 .. AC-TSE-26 using the existing generated pattern for this shard: `Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) <Required behavior cell verbatim from the row above>, and (6) return <Completion cell verbatim>; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.`

(4) § Contracts, new sub-table `### Priority Lanes, Messaging Safety and Specialised Enforcement`, placed after `### Fraud, Disputes and Legal Operations` (after line 144):
| Contract | Invariant |
|---|---|
| `TrustedFlaggerGrant` | Granted per entity with recorded basis and scope; grant sets a shortened policy-versioned SLA on reports it submits, never a direct priority override. Public content only. Bulk submission idempotent per item. Accuracy ledger write-back per item is mandatory; sustained inaccuracy throttles then suspends the lane by reasoned, appealable decision. |
| `MessageSafetySignal` | Metadata/pattern evaluation only until a participant reports; only thread participants may report. Fails open — evaluation unavailability delivers the thread unwarned and never blocks or delays. Warning is dismissible and never blocks a send. |
| `CardTestingDefense` | Velocity evaluated per device, session and card-BIN spread at the authorization rail ahead of any risk score; digital fulfilment never precedes settlement confirmation. Goods-agnostic. A legitimate volume spike (many distinct buyers, devices and funding sources) is the inverse fingerprint and must not throttle. |
| `TriangulationReview` | Indicators produce a payout hold and human review, never an automatic block. Below-market price is never a standalone signal, and seller reputation never vetoes the finding. Detection is exogenous by construction; absence of on-platform signal is not absence of fraud. |
| `ReviewIntegrityAdjudication` | Detection reads the fraud linkage graph, never review data. Removal requires cited rule version, Statement of Reasons to the author and appeal. Scope is per role; findings never cross role boundaries. |
| `AuthenticityClaim` | Buyer dispute, brand notice and listing-time detection reconcile to one seller-facing reason. Trademark exhaustion is evaluated before any brand claim is actioned. Claim windows extend beyond ordinary dispute windows because authenticity failure surfaces years late. |
| `LeakForensics` | Per-recipient watermark applied at transfer; access is a consequential audited action. Finding states watermark identity and access trace or explicitly states no attribution. Platform supplies evidence for external notices; it does not host the leak. |
| `MeetupSafetyRecord` | Offered at arrangement time; immutable and preserved on clean check-out. Restriction edges block arrangement, not merely messaging. In-person incident routes to a safety case, never to the dispute engine. |
| `TVECPath` | Hash matching and written-policy judgment are separate paths with separate evidence and separate authority; neither may be evaluated as the other. No user-level extremism score under any signal, including genre proxies. Removal uses the ordinary ladder with SoR and appeal. |

(5) § Data Models, after line 167, add:
| `trusted_flagger_grant` / `flagger_accuracy_entry` | Entity, basis, scope, granted SLA profile, state/version; append-only per-item outcome attribution driving throttle/suspend. |
| `message_safety_evaluation` | Thread, matched pattern codes, signal version, evaluated-at, fail-open marker; no message content retained absent a report. |
| `rail_velocity_decision` / `triangulation_indicator` | Device/session/BIN-spread window, throttle/block outcome; and listing indicator set with hold reference. |
| `review_integrity_finding` | Role scope, linkage-graph evidence hash, cited rule, removal decision reference. |
| `authenticity_claim` | Listing/item, claim path, exhaustion check result, registry chain reference, reconciled seller reason. |
| `leak_forensic_finding` | Asset, release state at match, watermark recipient identity, access-trace hash, attribution result. |
| `meetup_safety_record` | Arrangement, offered controls, check-in/check-out timestamps, trusted-contact share state; immutable. |
| `tvec_evaluation` | Mechanism (`hash_match` or `policy_judgment`), designated-set version or rule version, human decider where policy path. |
Add one matching bullet per new model to the § Typed Field and Cardinality Registry using the identical generated sentence pattern already used at lines 173-203.

(6) § Event Schemas, after line 259, add:
| `safety.flagger.status-changed.v1` | Entity/state/accuracy-window/decision reference | Intake, transparency |
| `safety.message-warning.raised.v1` | Thread/pattern codes/signal version | Messaging surface only |
| `safety.rail.blocked.v1` | Device/session/BIN-window/outcome | Commerce/payment adapters |
| `safety.triangulation.held.v1` | Listing/indicator codes/hold reference | Payout adapter, seller notice |
| `safety.review.removed.v1` | Review/role scope/rule version/SoR reference | Reviews projection |
| `safety.authenticity.decided.v1` | Listing/claim path/outcome/reason code | Marketplace, seller notice |
| `safety.leak.finding.v1` | Asset/attribution state/finding hash | Rights holder notice, enforcement |
| `safety.meetup.record-changed.v1` | Arrangement/control state/version | Arrangement surface |
| `safety.tvec.decided.v1` | Object/mechanism/policy or set version/decision | Enforcement, transparency |

(7) § Access Control, add rows: `Trusted flagger` — permitted: submit notices in the granted scope, read own accuracy record and lane decisions; denied: private messages, queue visibility, other flaggers' records, any content outside the grant scope. `Meetup participant` — permitted: own arrangement safety record and trusted-contact share; denied: counterparty's record. Append the corresponding lines to § Access Escalation using that section's existing sentence.

(8) § Edge Cases, add: bulk notice retried after partial failure (idempotent per item, no duplicate cases); flagger claims content the platform's own provenance graph shows the target created (notice does not win by default; platform record is cited); bulk notice exceeds review capacity (weighted-fair lane share; safety-of-person capacity floor untouched); non-participant reports a private thread (rejected); signal service unavailable (fail-open, thread delivered unwarned, gap logged); distributed card testing across a botnet (per-device velocity blind; aggregate BIN-level window required); legitimate flash sale spike (must not throttle); triangulator with spotless on-platform record (reputation must not veto the finding); honest dropshipping Trader (Trader flag disambiguates, must not block); genuine below-market listing (not a signal); leaked asset matched after release (non-event, not a crisis); clean meetup check-out (record preserved, never deleted); TVEC hash set unavailable (policy path only, no automatic action).

(9) § Delivery Phases, line 43, extend the `Phase 2+` row to name these explicitly so no reader has to infer scope: append ", trusted-flagger lane, message-safety signals, card-testing/triangulation defence, review-integrity adjudication, authenticity/counterfeit review, leak forensics, meetup safety records and TVEC policy-path removal". Leave TVEC hash-set automation in the `Counsel-gated` row.

Note for the applier: ideation 24.01.04 Q-01 (may an independent musician hold a priority lane for their own catalogue?) and Q-02 (counsel confirmation of the Art 19 carve-out) remain open upstream and are deferred to /create-prd. Write `TrustedFlaggerGrant` eligibility as "granted per entity with recorded basis and scope" — the ideation's own wording — and do not narrow it to rights-holder organisations, which would pre-empt Q-01.
```

**Challenge result.** CONFIRMED — I opened all eight ideation feature files plus moscow-ledger.md and every quoted string is present verbatim. 24.01.04 lines 28-33 are exactly: "Flagger status is granted per-entity and is a **permission that changes the SLA of a report**. Notices may arrive individually or in bulk via API; bulk submission must be idempotent per item so a retried 5,000-item notice does not create 10,000 cases. Each per-item decision writes back to the flagger's **accuracy ledger**, and sustained inaccuracy throttles or suspends the lane — DSA Art 22(6) requires suspension after frequent insufficiently-precise or inadequately-substantiated notices, so the write-back is not optional bookkeeping, it is the statutory mechanism." Line 35-36 supplies 'public content only … never reaches into private messages'. D-01/D-02 are at lines 92-93 as claimed. Q-03 at line 101 is struck through and resolved with the exac

### A-06 — `06-trust-safety.md`

**Tier.** 2 upstream spec (ideation)

**Sources.**
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.01-enforcement-ladder-sanctions.md lines 42-54 (the rung table), line 36-40 (scope containment order and duration), line 83-92 (payout-hold rule), line 110 (Happy Path step 4), line 182 (D-04), line 184 (D-06), line 185 (D-07 as amended), line 187 (D-09)`
- `.memory/wiki/specs/ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md lines 45-53 (severity tiers; numeric SLA explicitly deferred to /create-prd-security)`

**Source quote.** 24.02.01-enforcement-ladder-sanctions.md, lines 42-54, verbatim: "**The ladder rungs, lowest to highest severity:**\n\n| Rung | Sanction | Acts on | Reversible? |\n|------|----------|---------|-------------|\n| 0 | Warning | Nothing (notice only) | N/A — no state changed |\n| 1 | Content removal / restriction | A specific object | Fully (object restored) |\n| 2 | Feature restriction | One capability on the account | Fully |\n| 3 | Listing / booking suspension | A marketplace or calendar surface | Nominally (perishable inventory may be lost — see 24.02.02 D-02) |\n| 4 | Demonetization | Payout *eligibility on future earnings* | Fully forward; does not touch accrued balances |\n| 5 | Payout hold | Withholding of *owed* money | **Gated — see the Payout-hold rule below** |\n| 6 | Account suspension (time-boxed) | Login-gated action; data stays readable + exportable | Fully |\n| 7 | Permanent ban | All access; ownership records preserved + exportable | By appeal only |\n| 8 | Entity-level action | An entity's platform privileges | Fully for the entity; must not touch co-owners |" — and line 110: "If the proposed rung ≥ 6 (suspension or above) **or** `duration = indefinite`, the proposal enters `proposed` and cannot be applied directly." — and D-06, line 184: "Rung 5 (payout hold) is gated off pending the money-transmission decision; fraud withholding uses the Payments risk-reserve instead" — and D-04, line 182: "Scope is a mandatory field with a containment order (`object ⊂ feature ⊂ domain ⊂ account ⊂ entity`); the narrowest that addresses the harm is chosen".

**Fix.**

```
Two files.

(A) .memory/wiki/specs/ia/06-trust-safety.md — § Contracts → Core Types and Errors. Insert a new row immediately after the `Decision` row (after line 108):

| `SanctionRung` | Closed ordered enum, `smallint` domain `0..8`, non-null on every sanction: `0 warn` (notice only, no state changed) \| `1 remove_object` (a specific object; fully reversible) \| `2 restrict_feature` (one capability on the account; fully reversible) \| `3 suspend_surface` (a marketplace or calendar surface; nominally reversible — perishable inventory may be lost) \| `4 demonetize` (payout eligibility on future earnings only; never touches accrued balances) \| `5 payout_hold` (**disabled**; a rung-5 request is refused `SANCTION_CLASS_GATED` pending the money-transmission posture — fraud withholding routes to the Payments risk reserve, which is a hold on undisbursed escrow, not a sanction on owed balance) \| `6 suspend_account` (time-boxed; login permitted, action blocked, data readable and exportable) \| `7 terminate_access` (permanent; ownership records, balances and credits preserved and exportable) \| `8 entity_action` (an entity's platform privileges only; never reaches a co-owner's account, share, credits or balance). Rung ≥ 6 or `indefinite` duration is the dual-human-control trigger in `AC-TSE-06`/`TSE-06`. |

Add a second new row binding the existing `Decision` enum to the scale (this is the predicate an implementer needs):

| `DecisionRungMap` | `warn → 0`; `remove_object → 1`; `restrict → 1` when `scope_type = object`, `→ 2` when `scope_type = feature`; `suspend_scope → 3` when `scope_type = domain` (marketplace or calendar surface), `→ 8` when `scope_type = entity`; `demonetize → 4`; `suspend_account → 6`, or `→ 8` when `scope_type = entity`; `terminate_access → 7`, or `→ 8` when `scope_type = entity`. `no_action`, `restore`, `refer_external` and `resources_only` are not sanctions and carry no rung. `payout_hold` (5) has no `Decision` member by design and cannot be reached. |

Also on line 108, add the missing rung-4 member to `Decision`, which currently has no way to express demonetization:
`no_action | warn | restrict | remove_object | suspend_scope | demonetize | suspend_account | terminate_access | restore | refer_external | resources_only`

And add a `ScopeType` row, since `DecisionRungMap` and the existing `ActivateDecision` invariant ('Uses narrowest sufficient scope') both depend on it and it is nowhere enumerated:
| `ScopeType` | Closed ordered containment enum: `object ⊂ feature ⊂ domain ⊂ account ⊂ entity`. Mandatory on every sanction; the narrowest scope that addresses the harm is chosen and widening is an explicit escalation, never an implication. |

(B) .memory/wiki/specs/ia/deep-dives/06-trust-safety.md — line 40, retype the `sanction` row so `rung` is required and typed:
| `sanction` | `id, decision_id, subject_person/party, action, rung: smallint NOT NULL CHECK (rung BETWEEN 0 AND 8), scope_type/id, starts_at, ends_at?, indefinite, state, reversal_id?, version`; `rung` derives from `(action, scope_type)` per `DecisionRungMap` and is stored, not recomputed at read; `rung = 5` is rejected at write with `SANCTION_CLASS_GATED`; excludes ownership mutation. |

And at line 103, make the predicate concrete: "S1 or rung ≥ 6 (`suspend_account`, `terminate_access`, `entity_action`) or `indefinite` with at least two human moderators: distinct-human concurrence".

Do NOT touch `Severity` — the severity-to-deadline numeric mapping is legitimately deferred to /create-prd-security by ideation 24.01.03 line 45 (Q-04) and 24.01.01 Q-02. Leaving it as 'mapping is policy-versioned' is correct.
```

**Challenge result.** CONFIRMED — I opened 24.02.01-enforcement-ladder-sanctions.md. The rung table at lines 44-54 matches the claimed quote row for row, including the exact parentheticals: rung 3 'Nominally (perishable inventory may be lost — see 24.02.02 D-02)', rung 4 'Fully forward; does not touch accrued balances', rung 5 '**Gated — see the Payout-hold rule below**', rung 8 'Fully for the entity; must not touch co-owners'. (The header row is at line 44, not 42 — lines 42-43 are the bold lead-in and blank line; immaterial.) Line 110 verbatim: "If the proposed rung ≥ 6 (suspension or above) **or** `duration = indefinite`, the proposal enters `proposed` and cannot be applied directly." D-04 line 182 verbatim: "Scope is a mandatory field with a containment order (`object ⊂ feature ⊂ domain ⊂ account ⊂ entity`); the narrowest that addresses the harm is chosen". D-06 line 184 verbatim: "Rung 5 (payout hold) is gated off p

### A-07 — `06-trust-safety.md`

**Tier.** 2 upstream spec (sibling IA shards + the IA rubric)

**Sources.**
- `.claude/skills/pipeline-rubrics/references/ia-rubric.md line 9 (dimension 5 rule)`
- `.memory/wiki/specs/ia/06-trust-safety.md lines 311-312 (declared dependencies) and 318-327 (the eight-entry map)`
- `.memory/wiki/specs/ia/08-credit-reporting-disclosure.md Cross-Shard Section Contract Map (upstream entries for Shards 00, 01, 07 — the precedent that upstreams belong in the map)`
- `.memory/wiki/specs/ia/05-platform-configuration-admin.md Cross-Shard Section Contract Map (declares its Shard 06 contract; the unreciprocated half) and § Contracts row 'Capability grant'`

**Source quote.** ia-rubric.md line 9: "| 5 | Cross-Shard Contracts | Every cross-shard reference is bidirectional and cites the specific section in the referenced shard. No reference uses \"see shard N\" without a section name. | One-way references or missing section citations | None |" — 05-platform-configuration-admin.md map: "- **Shard 06 — Trust and safety:** consume [Shard 06 — Trust and safety Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 — Trust and safety Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary." — 05-platform-configuration-admin.md § Contracts: "| Capability grant | Named actions/resources/scope/term, no wildcard; grantor cannot exceed own authority; revocation immediate; break-glass time-bounded and fully evidenced. |"

**Fix.**

```
File: .memory/wiki/specs/ia/06-trust-safety.md, § Cross-Shard Section Contract Map (currently lines 318-327). Insert the three upstream bullets ABOVE the existing Shard 11 bullet, and the ten consumer bullets in numeric order among the existing eight, so the final map reads 00, 01, 05, 11, 12, 13, 14, 15, 16, 25, 26, 27, 28, 29, 30, 31, 33, 35, 36, 37, 40 (21 entries). Every new bullet uses the layer's exact template verbatim; only the number, label and filename change.

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 05 — Platform configuration, admin and quality:** consume [Shard 05 — Platform configuration, admin and quality Contracts](05-platform-configuration-admin.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 05 — Platform configuration, admin and quality Event Schemas](05-platform-configuration-admin.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 12 — Community spaces and events:** consume [Shard 12 — Community spaces and events Contracts](12-community-spaces-events.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 12 — Community spaces and events Event Schemas](12-community-spaces-events.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 13 — Opportunities and casting:** consume [Shard 13 — Opportunities and casting Contracts](13-opportunities-casting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 13 — Opportunities and casting Event Schemas](13-opportunities-casting.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 15 — Education delivery:** consume [Shard 15 — Education delivery Contracts](15-education-delivery.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 15 — Education delivery Event Schemas](15-education-delivery.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 16 — Education credentials and institutions:** consume [Shard 16 — Education credentials and institutions Contracts](16-education-credentials-institutions.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 16 — Education credentials and institutions Event Schemas](16-education-credentials-institutions.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 29 — Venues, studios and spaces:** consume [Shard 29 — Venues, studios and spaces Contracts](29-venues-spaces.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 29 — Venues, studios and spaces Event Schemas](29-venues-spaces.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 31 — Agency, settlement and live-market intelligence:** consume [Shard 31 — Agency, settlement and live-market intelligence Contracts](31-live-settlement-intelligence.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 31 — Agency, settlement and live-market intelligence Event Schemas](31-live-settlement-intelligence.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 33 — Show-day execution and recovery:** consume [Shard 33 — Show-day execution and recovery Contracts](33-show-day-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 33 — Show-day execution and recovery Event Schemas](33-show-day-operations.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 35 — Ticket products, sales, access packages and delivery:** consume [Shard 35 — Ticket products, sales, access packages and delivery Contracts](35-ticket-products-sales.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 35 — Ticket products, sales, access packages and delivery Event Schemas](35-ticket-products-sales.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 37 — Fanbase and direct-to-fan:** consume [Shard 37 — Fanbase and direct-to-fan Contracts](37-fanbase-direct-to-fan.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 37 — Fanbase and direct-to-fan Event Schemas](37-fanbase-direct-to-fan.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 40 — Market intelligence, fraud and scouting signals:** consume [Shard 40 — Market intelligence, fraud and scouting signals Contracts](40-market-intelligence-signals.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 40 — Market intelligence, fraud and scouting signals Event Schemas](40-market-intelligence-signals.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

Label provenance so the applier does not have to guess: 00, 01, 05, 12, 13, 15, 16, 37 and 40 use the exact label string already used for that target in other shards' maps. 29, 31, 33 and 35 have no existing map label anywhere in the layer, so they use their own H1 title verbatim (29-venues-spaces.md:1 '# Shard 29 — Venues, studios and spaces'; 31-live-settlement-intelligence.md:1 '# Shard 31 — Agency, settlement and live-market intelligence'; 33-show-day-operations.md:1 '# Shard 33 — Show-day execution and recovery'; 35-ticket-products-sales.md:1 '# Shard 35 — Ticket products, sales, access packages and delivery').

Also in the same file, § Cross-Shard Dependencies line 311: replace the three bare upstream links with section-cited ones so the prose matches the map — '[Shard 00 § Contracts](00-infrastructure.md#contracts) for request/event/error/audit/recovery; [Shard 01 § Contracts](01-identity-authority.md#contracts) for parties, acting context, aliases, organizations, mandates and succession; [Shard 05 § Contracts](05-platform-configuration-admin.md#contracts) for capabilities (see its `Capability grant` row, which is the binding for `CounselGate` and the Break-glass custodian), guarded configuration, tasks, diagnostics, quality gates, retention and kill switches.'

And § Dependency References: add the ten new consumers as `[[specs/ia/<slug>|Shard NN — <Label>]]` under the existing `### Constrains` list (currently 8 entries at lines 340-347), and add a `### Constrained by` list holding Shards 00, 01 and 05 — matching the structure used by 08-credit-reporting-disclosure.md.

Reciprocity check after applying: 12, 13, 16, 29, 31, 33, 35, 37 and 40 already declare their Shard 06 contract, so those nine edges become bidirectional immediately. Shard 15 does not — .memory/wiki/specs/ia/15-education-delivery.md needs the reciprocal Shard 06 bullet added to its own map for that edge to close. Shards 00 and 01 are foundations and reference no consumer, consistent with how 08's upstream entries already work.
```

**Challenge result.** CONFIRMED — Every load-bearing claim checks out, including the ones most likely to be wrong. ia-rubric.md line 9 is verbatim: "| 5 | Cross-Shard Contracts | Every cross-shard reference is bidirectional and cites the specific section in the referenced shard. No reference uses \"see shard N\" without a section name. | One-way references or missing section citations | None |" 05-platform-configuration-admin.md line 265 carries the Shard 06 bullet verbatim as quoted, and 06-trust-safety.md does not reciprocate — the map at lines 320-327 holds only 11, 14, 25, 26, 27, 28, 30, 36. Line 312 declares 'Depended on by: Shards 11–16, 25–31, 33, 35–37 and 40', which expands to 18 consumers; 8 are mapped, so exactly 10 are missing (12, 13, 15, 16, 29, 31, 33, 35, 37, 40). The fix's count is right. 05's `Capability grant` row at line 95 is verbatim as quoted. 08-credit-reporting-disclosure.md's map does carry ups

### A-08 — `08-credit-reporting-disclosure.md`

**Tier.** 2 upstream spec (ideation), with the corruption itself resolvable from the same document

**Sources.**
- `.memory/wiki/specs/ideation/02-credits-attribution/02.10-ai-contribution-disclosure.md lines 31-53 ('#### v1 Structured Disclosure Vocabulary' field table and 'Member definitions (v1)' table)`
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.04-source-declaration-samples-ai.md line 139 (Q-02, struck through and marked ✅ Resolved 2026-07-23, citing 02.10 as the authoritative shape)`
- `.memory/wiki/specs/ia/08-credit-reporting-disclosure.md line 131 (`ai_disclosure_version` model row: 'entries JSON'), lines 135-144 (the AI Disclosure Entry V1 table the generator mis-parsed), lines 162-169 (the eight bogus registry entities)`

**Source quote.** 02.10-ai-contribution-disclosure.md lines 33-43, verbatim: "A disclosure attached to a contribution is **zero or more involvement entries** (a contribution with no entries is \"not disclosed\" — silence, not a human-origin claim, per D-05). Each entry has this v1 shape:\n\n| Field | Type | Values / Constraint | Notes |\n|-------|------|---------------------|-------|\n| `involvement_type` | enum (open/versioned) | `generation` \\| `assistance` \\| `modelling` \\| `separation` \\| `correction` | The kind of AI involvement. Open enum: new members may be added as the industry line moves... Versioned (`vocab_version`) so consumers know which member set they are reading. |\n| `scope` | enum | `whole` \\| `partial` | Whether the AI involvement covers the entire contribution or a portion of it. |\n| `scope_detail` | string (optional) | free text, ≤ 280 chars | For `partial`: which portion (e.g. \"final chorus vocal only\"). Descriptive, not adjudicated. |\n| `tool` | string (optional) | free text, ≤ 120 chars | Named tool/model if the contributor chooses to state it... Never required. |\n| `subject_is_own_model` | boolean | default `false` | Marks the contested \"model of the artist's own voice, used by that artist\" case... Recorded as a fact, judged by no one. |\n| `vocab_version` | string | e.g. `\"v1\"` | The vocabulary revision this entry was recorded against, so a later standard can re-map deterministically. |" — and 07.08.04 line 139: "**Resolved: a typed, structured record owned outside 07, which this feature references per D-04 and P-04.** `02.10 AI Contribution Disclosure` defines the v1 field shape — `involvement_type` (open, versioned enum: `generation`, `assistance`, `modelling`, `separation`, `correction`), `scope` (`whole`/`partial`), optional `scope_detail`, optional free-text `tool` (\"Never required\"), `subject_is_own_model`, `vocab_version`".

**Fix.**

```
File: .memory/wiki/specs/ia/08-credit-reporting-disclosure.md. Three edits.

(1) DELETE lines 162-169 entirely — the eight bullets beginning `- **\`Field\`:**`, `- **\`kind\`:**`, `- **\`scope\`:**`, `- **\`tool_name\`:**`, `- **\`tool_version?\`:**`, `- **\`model_name?\`:**`, `- **\`subject_is_own_model?\`:**` and `- **\`note?\`:**`. They are generation artifacts. The registry must end at line 161, `- **\`output_audit_event\`:** ...`, leaving exactly the twelve real models (`output_request`, `output_gap`, `generated_artifact`, `artifact_credit_snapshot`, `emission_record`, `union_form_profile`, `union_report`, `gear_credit_link`, `gear_discography_projection`, `ai_disclosure_version`, `destination_policy_version`, `output_audit_event`).

(2) REPLACE the `### AI Disclosure Entry V1` table (lines 135-144) with the ratified 02.10 shape, correcting the unenumerated `scope` and supplying the missing length limits. Keep the IA's finer `tool_name`/`tool_version?`/`model_name?` decomposition — it is a strict refinement of 02.10's single optional `tool` — but bind it to 02.10's ≤120-char limit; and rename the IA's untyped `note?` to `scope_detail?` so it matches the ratified name and carries the ≤280-char limit:

### AI Disclosure Entry V1

Entries are JSON objects inside `ai_disclosure_version.entries`. They are **not** entities and have no `id`, `owner_id`, `state` or `version` of their own — identity, state and versioning belong to the parent `ai_disclosure_version` row, whose `vocabulary version` column records which member set the entries were written against. A contribution with zero entries is "not disclosed" — silence, never a human-origin claim.

| Field | Type | Constraint |
|---|---|---|
| `kind` | open versioned enum | `generation` \| `assistance` \| `modelling` \| `separation` \| `correction`. `generation` = a part produced by a model; `assistance` = human-led work with AI aid; `modelling` = a modelled instrument or voice; `separation` = stem/source separation; `correction` = pitch/time correction. Open and additive by design — a new member requires a new vocabulary version on the parent row, never a schema break. |
| `scope` | closed enum | `whole` \| `partial` — whether the AI involvement covers the entire contribution or a portion of it. |
| `scope_detail?` | text | Optional, ≤ 280 characters, plain text, no links or markup. Present only for `partial`: which portion (e.g. "final chorus vocal only"). Descriptive, never adjudicated; not used for policy evaluation. |
| `tool_name?` / `tool_version?` | text | Optional, ≤ 120 characters each, plain text, no links or markup. Never required. |
| `model_name?` | text | Optional, ≤ 120 characters. Factual identifier supplied by the contributor. Never required. |
| `subject_is_own_model?` | boolean | Optional, default `false`. Marks the contested "a model of the artist's own voice, used by that artist" case. Recorded as a fact, judged by no one. |

(3) In the `### Typed Field and Cardinality Registry` preamble (line 146), append one sentence so the mis-parse cannot recur: "Entries in the `AI Disclosure Entry V1` table above are JSON keys of `ai_disclosure_version.entries`, not entities; they take no core fields and no registry bullet."

Consistency notes for the applier: this does not change AC-CXR-11 / CXR-11 (line 52 / line 71), which already say "versioned kind/scope/tool/model fields" — the fix supplies the values those words refer to. It also does not change `RecordAIDisclosure` (line 115), whose "Zero or more structured entries; absence means 'not disclosed,' never 'human'" is exactly 02.10's D-05 posture. The only substantive correction is `scope`: the current text "Bounded contribution-local description such as full, section, element or process" is unsourced drift and is replaced by the ratified `whole | partial` plus `scope_detail?`.
```

**Challenge result.** CONFIRMED — The corruption is exactly as described and the ratified shape is exactly where it is claimed to be. 02.10-ai-contribution-disclosure.md lines 31-43 carry the '#### v1 Structured Disclosure Vocabulary' heading and the field table verbatim, including "A disclosure attached to a contribution is **zero or more involvement entries** (a contribution with no entries is \"not disclosed\" — silence, not a human-origin claim, per D-05)", `scope | enum | whole | partial`, `scope_detail | string (optional) | free text, ≤ 280 chars`, `tool | string (optional) | free text, ≤ 120 chars` with 'Never required', `subject_is_own_model | boolean | default false` with 'Recorded as a fact, judged by no one', and `vocab_version`. The 'Member definitions (v1)' table follows immediately and gives exactly the five glosses the fix reproduces (generation = a part produced by a model; assistance = human-led work wit

### A-09 — `09-projects-collaboration.md`

**Tier.** 2 upstream spec (IA index + decomposition plan + reciprocal sibling shards)

**Sources.**
- `.memory/wiki/specs/ia/index.md line 32 and line 47`
- `.memory/wiki/specs/ia/decomposition-plan.md line 63 and line 78`
- `.memory/wiki/specs/ia/09-projects-collaboration.md line 331 (Cross-Shard Dependencies)`
- `.memory/wiki/specs/ia/17-realtime-sessions.md line 1 and line 312`
- `.memory/wiki/specs/ia/32-show-production-planning.md line 1 and line 252`

**Source quote.** ia/index.md:32 — "| 17 | [17-realtime-sessions.md](17-realtime-sessions.md) | Real-time jamming and remote sessions | web/PWA + specialized runtime | Feature domain | ✅ Complete | [deep dive](deep-dives/17-realtime-sessions.md) |"; ia/index.md:47 — "| 32 | [32-show-production-planning.md](32-show-production-planning.md) | Event production planning and advancing | web/PWA | Feature domain | ✅ Complete | [deep dive](deep-dives/32-show-production-planning.md) |"; ia/09-projects-collaboration.md:331 — "**Depends on:** [Shard 00](00-infrastructure.md) for request/event/storage/upload/offline/projection contracts; [Shard 01](01-identity-authority.md) for parties, acting context, memberships, authority and shell identities; [Shard 07](07-credits-core.md) for role taxonomy, credit claims, session capture and provenance."

**Fix.**

```
File `.memory/wiki/specs/ia/09-projects-collaboration.md`.

(1) § Cross-Shard Section Contract Map — REPLACE line 342 with:
`- **Shard 17 — Real-time jamming and remote sessions:** consume [Shard 17 — Real-time jamming and remote sessions Contracts](17-realtime-sessions.md#contracts) into this shard \`§ Contracts\`; publish this shard \`§ Event Schemas\` to [Shard 17 — Real-time jamming and remote sessions Event Schemas](17-realtime-sessions.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.`

(2) REPLACE line 345 with:
`- **Shard 32 — Event production planning and advancing:** consume [Shard 32 — Event production planning and advancing Contracts](32-show-production-planning.md#contracts) into this shard \`§ Contracts\`; publish this shard \`§ Event Schemas\` to [Shard 32 — Event production planning and advancing Event Schemas](32-show-production-planning.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.`

(3) INSERT three upstream entries at the TOP of the same map (immediately before the existing `- **Shard 10 — Rights and ownership:**` bullet at line 340), using the identical sentence shape:
`- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard \`§ Contracts\`; publish this shard \`§ Event Schemas\` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.`
`- **Shard 01 — Identity and authority:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard \`§ Contracts\`; publish this shard \`§ Event Schemas\` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.`
`- **Shard 07 — Credits core:** consume [Shard 07 Contracts](07-credits-core.md#contracts) into this shard \`§ Contracts\`; publish this shard \`§ Event Schemas\` to [Shard 07 Event Schemas](07-credits-core.md#event-schemas). PRJ-05's roster event publishes the Shard 07 claim command across this boundary; canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.`

(4) § Dependency References → ### Constrains — REPLACE line 360 with `- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]` and line 363 with `- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]`.

No other file changes. Shard 07 already carries the reciprocal entry (`07-credits-core.md:302`), and 17/32 already carry theirs, so reciprocity closes without editing them.
```

**Challenge result.** CONFIRMED — Every cited line verifies verbatim. `.memory/wiki/specs/ia/index.md:32` — "| 17 | [17-realtime-sessions.md](17-realtime-sessions.md) | Real-time jamming and remote sessions | web/PWA + specialized runtime | Feature domain | ✅ Complete | [deep dive](deep-dives/17-realtime-sessions.md) |"; `index.md:47` — "| 32 | [32-show-production-planning.md](32-show-production-planning.md) | Event production planning and advancing | web/PWA | Feature domain | ✅ Complete | ... |". `decomposition-plan.md:63` — "| 17 | 17-realtime-sessions.md | Real-time jamming and remote sessions | 08.01–08.08 | 8 | High | Feature domain | Yes | 00, 01, 09 |" and `:78` — "| 32 | 32-show-production-planning.md | Event production planning and advancing | 18.01–18.05, 18.19 | 6 | High | Feature domain | Yes | 00, 09, 24, 29, 30 |". `09-projects-collaboration.md:331` — "**Depends on:** [Shard 00](00-infrastructure.md) ...; 

### A-12 — `10-rights-ownership.md`

**Tier.** 2 upstream spec (shard 10's own Interactions/Contracts sections + deep-dives/10)

**Sources.**
- `.memory/wiki/specs/ia/10-rights-ownership.md line 79 (§ Interactions, RGT-10 row)`
- `.memory/wiki/specs/ia/10-rights-ownership.md line 54 (§ Acceptance Criteria, AC-RGT-10)`
- `.memory/wiki/specs/ia/10-rights-ownership.md line 122 (§ Contracts, `MasterControl`)`
- `.memory/wiki/specs/ia/deep-dives/10-rights-ownership.md line 111 (§ Chain, Control and Reversion Algorithm, step 5)`
- `.memory/wiki/specs/ia/10-rights-ownership.md line 50-53 (AC-RGT-06..09, the intact template)`

**Source quote.** deep-dives/10-rights-ownership.md:111 — "5. Verdicts are `authorized`, `blocked` or `no_recorded_obstacle`; last explicitly disclaims clearance." ia/10-rights-ownership.md:79 — "| RGT-10 | Resolve control summary | System derives ownership/control/encumbrance/covenant outcome from consented records and labels uncertainty honestly. | `authorized | blocked | no_recorded_obstacle` with evidence links. |" ia/10-rights-ownership.md:122 — "| `MasterControl` | Derived from consented ownership, joint-owner rule, grants and encumbrances. “No recorded obstacle” never equals clear title. |"

**Fix.**

```
File `.memory/wiki/specs/ia/10-rights-ownership.md`.

(1) § Interactions — REPLACE line 79 in full with (commas, not pipes, inside the Completion cell; matches the `StandardError` convention already used at `09-projects-collaboration.md:118` and the deep dive's own prose at line 111):
`| RGT-10 | Resolve control summary | System derives ownership/control/encumbrance/covenant outcome from consented records and labels uncertainty honestly. | Verdict \`authorized\`, \`blocked\` or \`no_recorded_obstacle\` with evidence links; \`no_recorded_obstacle\` never asserts clear title. |`

(2) § Acceptance Criteria — REPLACE line 54 in full, regenerated from the template used verbatim by AC-RGT-01..09 and AC-RGT-11..14:
`- **AC-RGT-10 — Resolve control summary:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) derive the ownership/control/encumbrance/covenant outcome from consented records only and label uncertainty honestly, and (6) return verdict \`authorized\`, \`blocked\` or \`no_recorded_obstacle\` with evidence links, where \`no_recorded_obstacle\` explicitly disclaims clearance and never asserts clear title; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.`

(3) § Changelog — add a row: `| <date> | Repaired RGT-10 table corruption and regenerated AC-RGT-10 from the Interactions row; verdict enum sourced from deep-dives/10 § Chain, Control and Reversion Algorithm step 5 | audit remediation (A-12) | Acceptance Criteria, Interactions |`

No semantic change is introduced — the verdict set, its derivation and the no-clear-title disclaimer all already existed in `§ Contracts` `MasterControl` and the deep dive. Apply the identical two-step repair to AC-IDA-15 (`01-identity-authority.md:49`), AC-PRF-15 (`02-profiles-verification.md:47`) and AC-CMS-15 (`03-cms-content-modeling.md:47`) under their own gap IDs.
```

**Challenge result.** CONFIRMED — All five cited lines verify verbatim. `deep-dives/10-rights-ownership.md:111` — "5. Verdicts are `authorized`, `blocked` or `no_recorded_obstacle`; last explicitly disclaims clearance." (inside "## Chain, Control and Reversion Algorithm" beginning line 105). `10-rights-ownership.md:79` — "| RGT-10 | Resolve control summary | System derives ownership/control/encumbrance/covenant outcome from consented records and labels uncertainty honestly. | `authorized | blocked | no_recorded_obstacle` with evidence links. |" — six cells in a four-column table, exactly the unescaped-pipe corruption claimed. `10-rights-ownership.md:122` — "| `MasterControl` | Derived from consented ownership, joint-owner rule, grants and encumbrances. “No recorded obstacle” never equals clear title. |" `10-rights-ownership.md:54` — the damage is real: "**AC-RGT-10 — Resolve control summary:** Given System derives owners

### A-13 — `14-services-marketplace.md`

**Tier.** 2 — upstream ideation spec (05.06.01, [DEEP]), corroborated by the run-3 ratification log and DEC-052

**Sources.**
- `.memory/wiki/specs/ideation/05-services-marketplace/05.06-rights-warranties-transfer/05.06.01-engagement-rights-posture.md § Behavior, "The election is required, per copyright, and has no default" — lines 35-38 (vocabulary table)`
- `.memory/wiki/specs/ideation/05-services-marketplace/05.06-rights-warranties-transfer/05.06.01-engagement-rights-posture.md § Behavior, "Every posture declares its parameters, or it is not elected" — lines 57-63 (required-parameter table)`
- `.memory/wiki/specs/ideation/05-services-marketplace/05.06-rights-warranties-transfer/05.06.01-engagement-rights-posture.md § Behavior, legal-combinations table — lines 71-77`
- `.memory/wiki/specs/ideation/05-services-marketplace/05.06-rights-warranties-transfer/05.06.01-engagement-rights-posture.md § Decisions D-05 (line 220), D-06 (line 221), D-07 (line 222), D-14 (line 229)`
- `.memory/wiki/specs/ideation/05-services-marketplace/05.01-service-listings-pricing/05.01.02-service-category-taxonomy-attributes.md:44 (independent confirmation of the same list)`
- `.memory/wiki/specs/audits/run3-owner-decision-queue.md:40, :213 (owner ratification 05-services-marketplace#018; D-07 quoted verbatim)`
- `.memory/wiki/decisions.md:775 DEC-052`

**Source quote.** | **Master posture** | The sound recording | Assignment (work-for-hire) · Licence · Co-ownership · Points | Always | | **Composition posture** | The underlying musical work | Creates none · Assignment · Co-ownership (writer share) · Licence | Always — including the explicit `creates none` | …and D-07: "**The posture vocabulary is closed.** Four master postures, four composition postures, no free text, no "other", and no rider may qualify what executes"

**Fix.**

```
FILE: .memory/wiki/specs/ia/14-services-marketplace.md

(1) § Contracts → Core Types and Errors — REPLACE line 100 with three rows:

| `MasterPosture` | `assignment | licence | co_ownership | points` — closed; no default, no free text, no `other` |
| `CompositionPosture` | `creates_none | assignment | co_ownership | licence` — closed; `creates_none` is an explicit required declaration, never an absent field |
| `RightsPosture` | The pair `(master: MasterPosture, composition: CompositionPosture)` elected per listing TIER, not per listing. Both required. A posture missing any required parameter below is `unelected`, never partial |

(2) § Contracts → Listings and Quotes — ADD a new contract row after `PublishListing`:

| `ElectRightsPosture` | Per tier, per copyright. Required parameters by member: `assignment` — none (the label is total), plus the determining facts in `posture_determining_facts`. `licence` — `exclusivity: exclusive|non_exclusive`, `term: years|perpetual`, `territory: worldwide|named[]`, `permitted_uses: enum[] from the deliverable/use vocabulary (selection only, never free text)`, `sublicensable: boolean`. `co_ownership` — `retained_share: decimal(2dp)` plus `administration: closed enum` (who may licence, on whose consent). `points` — `asset: master|publishing|both` plus `percentage`; the points PRICE and the points POSTURE are one object, not two fields validated against each other. `creates_none` — none. Where effect is deferred: `trigger_condition` and `vesting_term` are additionally required, on top of (never instead of) the elected posture's own parameter set. Missing any required parameter yields `unelected` and blocks tier publish with a named reason. |

(3) § Contracts → Listings and Quotes — ADD:

| `PostureDeterminingFacts` | Recorded alongside the label on every election: governing law, seller jurisdiction ASSERTED AT SIGNATURE (not at election, not the account's current value), commission-vs-employment, craft, signed-writing status, asserted capacity. Immutable evidence; the label is an opinion about the law, the facts are what survive. |

(4) § Data Models — AMEND `service_listing` / `listing_version` (line 140) and `rights_election` (line 155): rights postures are TIER-scoped, so a three-tier listing holds six posture values. `rights_election` gains `master_posture`, `composition_posture`, their parameter sets, `posture_determining_facts` and `deferred_effect: {trigger_condition, vesting_term} | null`.

(5) § Data Models → Typed Field and Cardinality Registry — add `master_posture`, `composition_posture`, `exclusivity`, `territory_kind`, `administration`, `points_asset` to the `closed enum` class.

(6) § Contracts — AMEND `ExecuteRightsPosture` / SRV-16 with the per-member Shard 10 mapping: `assignment` → chain-of-title assignment instrument on the named copyright; `licence` → licence instrument carrying the five parameters; `co_ownership` → share allocation validated against Shard 10's AGGREGATE for the recording, never the engagement; `points` → participation payee record into Shard 18, plus the Shard 10 encumbrance; `creates_none` → writes no composition instrument. The credit is emitted to Shard 07 regardless of posture — a buyout moves the money, never the credit.

(7) § Edge Cases — ADD: seller and buyer are the same human → election allowed, execution writes no self-referential grant; co-owner shares across sellers exceed the buyer's holding → blocked at execution against Shard 10's aggregate, never a false green at election; listing posture edited while a quote is outstanding → the quote is untouched (no mutation upstream of an issued quote may alter that quote's posture).

NOTE FOR THE FIXER, not part of this gap: shard 14's existing `PricingShape` (`flat | per_unit | hourly | day_halfday | tiered_volume | minimum_plus | points | hybrid`) has no `buyout` and no `spec` member, but ideation's legal-combinations table has rows for both, and `buyout` restricts master postures to `assignment | licence` only. That mismatch is a separate, currently unlogged finding — do not silently drop the two rows to make the enums line up.
```

**Challenge result.** CONFIRMED — Every citation verified at the exact lines claimed, in the cited file (.../05.06.01-engagement-rights-posture.md, 264 lines, Status [DEEP]). Vocabulary table, lines 35-38 — verbatim, no paraphrase: "| **Master posture** | The sound recording | Assignment (work-for-hire) · Licence · Co-ownership · Points | Always |" "| **Composition posture** | The underlying musical work | Creates none · Assignment · Co-ownership (writer share) · Licence | Always — including the explicit `creates none` |" That is a closed 4+4 enumeration, which is exactly what IA 14 line 100 lacks — the shard currently says only "| `RightsPosture` | Closed master and composition vocabularies; `creates_none` explicit; no default/free text |", naming the closure without stating the members. Required-parameter table, lines 57-63 — present and complete. Licence: "**Exclusivity** (exclusive / non-exclusive) · **Term** (years,

### A-14 — `18-royalty-accounting.md`

**Tier.** 2 — upstream ideation feature file 10.01.06 (6 ratified decisions), plus sibling IA shards 07/10/22 for the entity keys

**Sources.**
- `.memory/wiki/specs/ideation/10-royalties-collections/10.01-society-registration-delivery/10.01.06-neighbouring-rights-performer-registration.md § Behavior (line 25), § Happy Path (lines 36-41), § Edge Cases (lines 44-55), § States → Registration lifecycle (lines 73-79), § Decisions D-01..D-06 (lines 101-106)`
- `.memory/wiki/specs/ia/07-credits-core.md § Overview (credit graph = eligibility source)`
- `.memory/wiki/specs/ia/10-rights-ownership.md:106 (`RightType` includes `performer | neighbouring`), :214 (Performer role owns the neighbouring/NIL position)`
- `.memory/wiki/specs/ia/22-release-distribution.md § Build, Delivery and Lifecycle Contracts (`AssignISRC`), § Data Models (`recording_identifier`)`
- `.memory/wiki/specs/feature-ledger.md:292`

**Source quote.** The registration is keyed on **(performer, recording, role)** — where role means the featured/non-featured distinction that determines the share, and where the recording is identified by ISRC. Compared with `10.01.02`'s work payload this inverts almost everything: no composition, no shares summing to 100%, no publisher chain, and — decisively — **the fact being registered is a credit, which is exactly what domain 02 captures**. …D-01: "Eligibility is derived from the **credit graph**, not from an ownership share" …D-06: "A featured/non-featured assertion made by anyone other than the performer **triggers a confirmation prompt to that performer**; the assertion is usable while unconfirmed but is permanently tagged `unconfirmed` until they respond, and non-response never auto-confirms it"

**Fix.**

```
FILE: .memory/wiki/specs/ia/18-royalty-accounting.md

(1) § Interactions — ADD three rows after ROY-04 (renumber the rest, or append as ROY-19/20/21 to avoid churn; renumbering is cleaner and the shard already reconciles by feature, not by number):

| ROY-N1 | System derives performer registration eligibility | Project Shard 07 credit records for the acting party against Shard 22 `recording_identifier` ISRC; emit one eligibility row per (performer party, recording ISRC, body, territory). Eligibility derives from the credit graph alone — never from an ownership share, split or 100% arithmetic. Imported credits are eligible on identical terms to captured ones. Attestation tier scales the platform's own suggestion strength ONLY and has no standing with a society. | Eligible-unregistered set, or named blocker (`ISRC_ABSENT`, `MEMBERSHIP_ABSENT`). |
| ROY-N2 | Performer or authorized filer asserts featured role | Record `featured | non_featured` as an ATTRIBUTED assertion with asserting party and timestamp; the platform never computes it. Where the asserter is not the named performer, emit a confirmation request to that performer and set `role_confirmation: unconfirmed`. | Usable assertion carrying its confirmation state. |
| ROY-N3 | Administrator files performer registration | Bind to the performer's OWN society membership (platform accreditation is not a precondition, unlike the work-registration path); deliver via the same versioned society profile/channel/expected-by machinery as `DeliverRegistration`, including the manual-task channel. | Submitted state with immutable payload/receipt, or handoff pack. |

Add the matching AC-ROY-N1/N2/N3 entries to § Acceptance Criteria in the shard's existing Given/when/then/(1)-(6) form.

(2) § Contracts → Core Types and Errors — ADD:

| `PerformerRole` | `featured | non_featured`. Asserted and attributed, never computed or derived. |
| `RoleConfirmation` | `self_asserted | confirmed | unconfirmed`. `unconfirmed` is set when a party other than the named performer asserts the role; it is PERMANENT until the performer responds. Non-response never auto-confirms, never blocks the filing, and never causes the platform to compute its own answer. |
| `PerformerRegistrationState` | `eligible_unregistered`, `blocked_no_isrc`, `registered`, `conflicted`, `collecting`. |

ADD to the Errors row: `ISRC_ABSENT`, `MEMBERSHIP_ABSENT`, `PERFORMER_SLOT_CONFLICT`.

(3) § Contracts → Registration, Ingestion and Matching — ADD:

| `DerivePerformerEligibility` | Reads Shard 07 credits and Shard 22 ISRC only. No agreement, no split, no 100% sum. Import provenance is not a discriminator here. |
| `FilePerformerRegistration` | Keyed on `(performer_party, recording_isrc, body, territory)`. Requires the performer's own membership from `society_affiliation`; does NOT require platform accreditation. Role confirmation state travels with the record; whether it travels in the outbound payload is deferred to /write-be-spec (ideation 10.01.06 Q-04). |

(4) § Data Models — ADD (this is a SEPARATE aggregate; it cannot fold into `registration_submission`, which is work-keyed and structurally incompatible):

| `performer_registration` | Performer party, recording ISRC, body, territory, `PerformerRole`, `RoleConfirmation` with asserting party/timestamp, membership reference, submission/receipt/expected-by, `PerformerRegistrationState`, version. Unique on (performer_party, recording_isrc, body, territory). |
| `performer_role_assertion` | Append-only. Assertion, asserting party, timestamp, confirmation request/response evidence. Never mutated in place. |

Add both to § Typed Field and Cardinality Registry with `state: closed enum`.

(5) § Edge Cases — ADD, verbatim from ideation 10.01.06: performer has no society membership → surfaced as a leakage finding; the platform points, it never joins on their behalf. Featured/non-featured contested → routed to the same evidence path as a credit dispute (Shard 06/07); never a platform verdict. Performer never responds to the confirmation prompt → no blocking, assertion stands permanently tagged, periodic nudge not a hold. Credit exists with no ISRC → blocked with the ISRC gap named against Shard 22, never a silent dead end. Performer is an unclaimed shell party → money is visible to the platform for a person it cannot contact; record it, do not suppress it. Two parties claim the same performer slot → society-side conflict, money held, route to Shard 10.

(6) § Access Control — Performer/Musician has Full over their own performer registrations. Rights administrator may assert a role only within a mandate, and any such assertion sets `unconfirmed` per D-06.

(7) § Event Schemas — ADD `royalty.performer_registration.changed.v1` (registration/performer/recording/body/territory/state/version) and `royalty.performer_role.asserted.v1`.

(8) § Dependency References — AMEND "Depends on". Shard 18 currently lists 00, 01, 02, 10 and 06 and does NOT list the credit or distribution shards, which is why this feature had nowhere to attach. Add: Shard 07 for the credit graph that supplies eligibility, and Shard 22 for ISRC assignment. Add the reciprocal edges to those shards' Cross-Shard Section Contract Maps.

(9) § Scope Reconciliation — 10.01.06 is now genuinely represented; leave "Child capabilities reconciled | 24" and the § Features claim, which become true rather than false.
```

**Challenge result.** CONFIRMED — Both claimed quotes are verbatim in the cited file (.../10.01.06-neighbouring-rights-performer-registration.md). Line 25, exact: "The registration is keyed on **(performer, recording, role)** — where role means the featured/non-featured distinction that determines the share, and where the recording is identified by ISRC. Compared with `10.01.02`'s work payload this inverts almost everything: no composition, no shares summing to 100%, no publisher chain, and — decisively — **the fact being registered is a credit, which is exactly what domain 02 captures**." D-01, line 101, exact: "Eligibility is derived from the **credit graph**, not from an ownership share". D-06, line 106, exact including the tail: "…the assertion is usable while unconfirmed but is permanently tagged `unconfirmed` until they respond, and non-response never auto-confirms it". The rest of the fix is traceable line by line

### A-15 — `18-royalty-accounting.md`

**Tier.** 2 — upstream ideation 10.01.04 § States (the feature ROY-03/ROY-04 implement) plus 10.01.05 D-02

**Sources.**
- `.memory/wiki/specs/ideation/10-royalties-collections/10.01-society-registration-delivery/10.01.04-registration-status-rejection-loop.md § States (7 members) and § Decisions D-01, D-02, D-03, D-04, D-06`
- `.memory/wiki/specs/ideation/10-royalties-collections/10.01-society-registration-delivery/10.01.05-mechanical-rights-administration.md § States and § Decisions D-02`
- `.memory/wiki/specs/ideation/10-royalties-collections/10.01-society-registration-delivery/10.01-society-registration-delivery-cx.md:49 ("Registration state is a belief with an age.")`
- `.memory/wiki/specs/ia/18-royalty-accounting.md:105 (the defective row), :107 (sibling enums), § Typed Field and Cardinality Registry, § Edge Cases ("Society silent past expected-by")`

**Source quote.** 10.01.04 § States: | Unregistered | Never submitted | Honest absence, with the reason (blocked, or never attempted) | | In flight | Delivered, within expected-by | Expected-by date, always | | Registered | Acknowledgement received | Registered at that body/territory, dated, with evidence | | Rejected | Rejection code returned | Reason translated to an action and a named owner | | Conflicted | Society reports a competing claim | Routed to 09; money held at source | | Overdue | Expected-by breached, silence | **Alarm.** The feature's reason to exist | | Stale | Registered, but splits since changed (`10.01.02`) | Re-registration needed; the society holds a wrong record | 10.01.05 D-02: "\"Registered / unmatched\" is a **first-class state**, not a variant of registered"

**Fix.**

```
FILE: .memory/wiki/specs/ia/18-royalty-accounting.md

(1) § Contracts → Core Types and Errors — REPLACE line 105 with:

| `RegistrationBeliefState` | `unregistered`, `in_flight`, `registered`, `registered_unmatched`, `matched`, `rejected`, `conflicted`, `overdue`, `stale`. |
| `RegistrationBelief` | Work/society/territory/`RegistrationBeliefState`/effective observation/age/expected-by; not society truth. Scoped per (work x society x territory) — never one flag on a work, because registered at PRS is not registered at GEMA and a single flag makes territorial leakage undetectable. |

(2) ADD immediately beneath, as the member semantics (each line is derived from an upstream source, not invented):

- `unregistered` — never submitted. Renders the reason (blocked, or never attempted); never an unexplained absence.
- `in_flight` — delivered, still within expected-by. Always carries the expected-by date.
- `registered` — acknowledgement received for that body and territory, dated, with retained evidence.
- `registered_unmatched` — registered, but the body's usage is still sitting in its unmatched pool. FIRST-CLASS, not a variant of `registered` (10.01.05 D-02): at the MLC it is the modal outcome for weak metadata and it is publicly observable. This is the member that distinguishes a successful registration from money still in the black box, and collapsing it into `registered` destroys the shard's only signal for that condition. The platform observes the pool; it never claims to drive matching.
- `matched` — the body has attributed usage to the registration. Income is expected on that body's calendar; hand off to Shard 19 forecasting.
- `rejected` — a rejection code was returned. Translated to an action and a named owner, or an explicit untranslatable state; never a paraphrased guess at a society code.
- `conflicted` — the society reports a competing claim. Routes to Shard 10 as a rights dispute; money held at source. A conflict is NOT a rejection and must not collapse into one.
- `overdue` — expected-by breached with silence. Synthesises an observation and an alarm. Indefinite pending and assumed acceptance are both forbidden.
- `stale` — registered, but the underlying splits have since changed, so the society now holds a record the platform knows is wrong. Re-registration is required.

(3) ADD the transition rule that the CX file makes load-bearing: a late acknowledgement arriving AFTER an `overdue` alarm resolves that alarm and updates the same belief; it never creates a second, contradictory belief, and a retry racing a late ack must not produce a duplicate registration.

(4) § Data Models — the `state: closed enum` already stamped on `registration_submission` and `registration_observation` now resolves to `RegistrationBeliefState`. State it explicitly in the Typed Field and Cardinality Registry rather than leaving it inferred.

(5) § Edge Cases — ADD: "Splits change after a successful registration | Move the belief to `stale` and require re-registration; never silently leave `registered`, because the society holds a record the platform knows is wrong." The shard currently has no edge case for this at all — its "Usage period spans split change" row governs calculation, not re-registration.

(6) § Interactions — AMEND ROY-04's Completion cell so the three-way summary is testable against named members: "Known outcome (`registered` | `registered_unmatched` | `matched` | `rejected`), conflict route (`conflicted`) or overdue alarm (`overdue`)."

(7) CROSS-SHARD — deep-dives/19 § Forecast step 2 requires "active registration". Define `active` against this enum explicitly: `registered`, `registered_unmatched` and `matched` are active; `unregistered`, `blocked`, `rejected`, `conflicted`, `overdue` and `stale` are not. Leaving that undefined reproduces the same gap one shard downstream.
```

**Challenge result.** CONFIRMED — The seven-member states table is verbatim in .../10.01.04-registration-status-rejection-loop.md § States, including the wording the fix relies on: "| Unregistered | Never submitted | Honest absence, with the reason (blocked, or never attempted) |", "| Overdue | Expected-by breached, silence | **Alarm.** The feature's reason to exist |", "| Stale | Registered, but splits since changed (`10.01.02`) | Re-registration needed; the society holds a wrong record |". Decisions D-01, D-02, D-03, D-04, D-06 are all present, and each maps onto a specific line of the fix's item (2): D-01 "per work × per society × per territory — never one flag on a work" is the fix's scoping clause almost word for word; D-02 "Silence is **synthesised into an event** via expected-by; indefinite pending is forbidden" is the `overdue` semantics; D-04 "Rejection reasons are translated into **an action and a named owner**

### A-17 — `28-digital-licensing-commerce.md`

**Tier.** 2

**Sources.**
- `.memory/wiki/specs/ia/18-royalty-accounting.md § Contracts → Calculation, Statement and Financial Gate, line 131`
- `.memory/wiki/decisions.md § DEC-011, line 160 (Downstream clause) and line 159 (Decision clause)`
- `.memory/wiki/specs/ideation/10-royalties-collections/10.03-calculation-recoupment/10.03.01-royalty-calculation-engine.md § Decisions, D-15, line 255 (and Q-02 resolved, line 266)`
- `.memory/wiki/specs/ideation/17-live-booking-settlement/17.10-live-income-payout-tax/17.10.01-live-income-split-definition.md lines 80-85 and § Decisions D-12, line 242`
- `.memory/wiki/specs/ideation/10-royalties-collections/10.04-disbursement-payee-statements/10.04.03-thresholds-holds-unpayable-balances.md § Decisions, D-01, line 96`
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.03-multi-contributor-pack-splits.md § Decisions, D-05, line 108`
- `.memory/wiki/specs/2026-08-02-architecture-design.md line 813`
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.01-licence-issuance-entitlement-record.md DT-08, line 158 (scopes the residual apportionment-basis question)`

**Source quote.** DEC-011, Downstream: "The source-locked four-field tuple now produces the same portable, content-derived allocation order for every consented ledger. Database insertion/retrieval order and `entered-by` remain prohibited inputs; Domain 10 retains sole ownership of cent remainder policy." — DEC-011, Decision: "The platform compares `party-id` as unsigned UTF-8 byte sequences in lexicographic order. Locale, display name, case-folding, Unicode normalization, and database-default behaviour are prohibited. Every runtime uses the same comparator or a persisted equivalent binary sort key." — IA Shard 18 line 131: "| `RoundPayableAggregate` | Round once at future payable boundary by largest remainder with stable tie key; never line-by-line. |" — Ideation 10.03.01 D-15: "**The engine never rounds.** Exact decimal at a declared fixed precision (>=9 dp), never binary float. Rounding happens **once**, at the payable boundary, on **per-party aggregates**, by **largest remainder**, tie-broken on a stable key — never list order" — Ideation 17.10.01 lines 80-85: "All allocations round to the **minor unit of the pool's currency**. `sum(flat lines) + band fund + sum(member shares) + sum(withheld) == pool`, **exactly**. A non-zero difference **blocks evaluation** — it is never absorbed silently. Rounding residue is allocated by **largest remainder**, ties broken by a stable party order fixed at pin time." — Ideation 10.04.03 D-01: "A held balance is **the payee's money**, and it appears on their statement | It is not float, not revenue, not a rounding sink."

**Fix.**

```
All edits in `.memory/wiki/specs/ia/28-digital-licensing-commerce.md`. Shard 28 must CONSUME Domain 10's policy, never author a second one (DEC-011: Domain 10 has sole ownership).

(1) `### Commerce Decisions` table (lines 22-39) — append a row after the `Payout gate` row:
`| Cent rounding | Consumes Shard 18 `RoundPayableAggregate`; this shard never authors a second rounding rule. Accrual arithmetic is exact decimal at >=9 dp and never rounds line-by-line. Rounding happens once, at the payable boundary — the contributor period close — on the per-payee period aggregate, by largest remainder, so the sum of rounded payee figures equals the rounded period total exactly. Ties break on the Shard-10 ledger row key `(pool, party-id, role, contribution-basis)`, comparing `party-id` as unsigned UTF-8 bytes per DEC-011; list order, insertion/retrieval order and `entered-by` are prohibited inputs. The residue is always allocated to a named payee and is never platform float, revenue or a rounding sink. |`

(2) `### Cross-Domain Contracts` (lines 108-114) — append a bullet:
`- [[specs/ia/18-royalty-accounting|Shard 18]] owns the platform's cent remainder policy (`RoundPayableAggregate`). This shard consumes that rule for contributor accrual and period close and never defines its own rounding direction, boundary or tie key.`

(3) `### Command Contracts` (line 106) — replace the `CloseContributorPeriod` row with:
`| `CloseContributorPeriod` | period, frozen rate/splits, accrual set, gate status | Forward-only split edits; statement totals equal ledger; exactly one rounding pass over per-payee period aggregates per Shard 18 `RoundPayableAggregate`; a non-zero difference between the sum of per-payee payable figures and the rounded period total blocks the close and is never absorbed |`

(4) `## Data Models` (lines 128-129) — replace the two rows with:
`| `PromotionAllocation` | promotion, product consideration values, ownership adjustment, split refs | Every acquired item has deterministic consideration recorded as the entitlement's allocated price in the transaction currency; any minor-unit residue from apportioning one consideration across N items is allocated by largest remainder on the same stable tie key |`
`| `ContributorAccrual` | asset/acquisition, period, gross/net basis, rate, split, payee, amount, reversal | Append-only and penny-reconcilable; `amount` is exact decimal at >=9 dp and is never a rounded minor-unit value |`
Apply the same two constraint strings to the corresponding bullets in `### Typed Field and Cardinality Registry` (lines 144-145), which mirror the model-row text.

(5) `## Edge Cases` (lines 203-221) — append a row:
`| Split produces an indivisible minor unit | Largest remainder on the stable tie key allocates the leftover minor unit to a named payee; it is never retained as platform float, revenue or a rounding sink |`

(6) `## Dependency References` (lines 222-227) — append: `- Consumes the cent remainder policy from Shard 18; Domain 10 retains sole ownership of that policy (DEC-011).`

(7) `## Related Specs` — add `[[specs/ia/18-royalty-accounting|Shard 18]]` to **Depends on**, and add to `### Cross-Shard Section Contract Map`:
`- **Shard 18:** consume [Shard 18 Contracts](18-royalty-accounting.md#contracts) into this shard `§ Contracts`. Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.`

(8) Do NOT invent the single-vendor bundle apportionment basis while applying this. Raise it as a separate item citing 14.02.01 DT-08 and 14.07.04 D-03.
```

**Challenge result.** CONFIRMED — Every quote is verbatim in the cited file, and none of the authorities is a downstream BE spec. (1) `.memory/wiki/decisions.md` DEC-011 (heading line 154, "Ownership-ledger ordering uses a portable bytewise party-ID collation (2026-07-19)") — Decision: "**Option 2.** The platform compares `party-id` as unsigned UTF-8 byte sequences in lexicographic order. Locale, display name, case-folding, Unicode normalization, and database-default behaviour are prohibited." Downstream: "Database insertion/retrieval order and `entered-by` remain prohibited inputs; **Domain 10 retains sole ownership of cent remainder policy**." Exact match. (2) `.memory/wiki/specs/ia/18-royalty-accounting.md` line 131, inside § Contracts: "| `RoundPayableAggregate` | Round once at future payable boundary by largest remainder with stable tie key; never line-by-line. |" Exact. Shard 18 is an IA shard ("Royalty registratio

### A-18 — `29-venues-spaces.md`

**Tier.** 2

**Sources.**
- `.memory/wiki/specs/ia/29-venues-spaces.md § Data Models → Canonical Aggregates, header row line 133 and the 18 real rows lines 134-151`
- `.memory/wiki/specs/ia/29-venues-spaces.md § Typed Field and Cardinality Registry, line 176 (the phantom bullet)`
- `.memory/wiki/specs/ia/33-show-day-operations.md line 111 (heading `Key invariants`) and line 143 (phantom carrying that same string — proof of header-row provenance)`
- `.memory/wiki/specs/ia/30-booking-contracts.md:197`
- `.memory/wiki/specs/ia/31-live-settlement-intelligence.md:182`
- `.memory/wiki/specs/ia/32-show-production-planning.md:136`
- `.memory/wiki/specs/ia/34-touring-operations.md:140`
- `.memory/wiki/specs/ia/35-ticket-products-sales.md:151`
- `.memory/wiki/specs/ia/36-box-office-risk.md:155`

**Source quote.** Shard 29 line 133 (table header): "| Aggregate | Key relationships and invariants |" — Shard 29 line 176 (phantom registry entry): "- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key relationships and invariants." — Shard 33 line 111 (table header): "| Aggregate | Key invariants |" and line 143 (phantom): "... Constraints/relationships: Key invariants."

**Fix.**

```
Delete exactly one line from each of the eight files — the sole bullet whose entity name is the literal `Aggregate`. It is unique within each file, so match on the literal prefix `- **`Aggregate`:** required core fields` rather than on line number (line numbers shift if edits are applied in ascending order; if using line-based tooling, delete from the highest line number downward).

- `.memory/wiki/specs/ia/29-venues-spaces.md` — delete line 176
- `.memory/wiki/specs/ia/30-booking-contracts.md` — delete line 197
- `.memory/wiki/specs/ia/31-live-settlement-intelligence.md` — delete line 182
- `.memory/wiki/specs/ia/32-show-production-planning.md` — delete line 136
- `.memory/wiki/specs/ia/33-show-day-operations.md` — delete line 143
- `.memory/wiki/specs/ia/34-touring-operations.md` — delete line 140
- `.memory/wiki/specs/ia/35-ticket-products-sales.md` — delete line 151
- `.memory/wiki/specs/ia/36-box-office-risk.md` — delete line 155

After deletion, each registry's first bullet must be the first REAL aggregate from that shard's Canonical Aggregates table (shard 29: `Place`; shard 33: `SetlistVersion`). Do not touch the deterministic field-typing paragraph immediately preceding the bullet list — that text is legitimate.

Verification command (must return zero matches across the whole layer):
`grep -rn '^- \*\*`Aggregate`:\*\*' .memory/wiki/specs/ia/`

Count check per file after the fix: the number of registry bullets must equal the number of data rows in that file's Canonical Aggregates table (18 for shard 29, 13 for shard 33).

Generator note for whoever maintains the authoring tooling: the registry generator consumed the markdown table's header row as data. Any future regeneration of these eight shards will reintroduce the phantom unless the generator skips row 1 and the separator row.
```

**Challenge result.** CONFIRMED — The phantom is real and the provenance claim is proved by the file contents. `grep -rn '^- \*\*`Aggregate`:\*\*' .memory/wiki/specs/ia/` returns exactly 8 hits, at precisely the eight line numbers the fix targets: 29:176, 30:197, 31:182, 32:136, 33:143, 34:140, 35:151, 36:155. Every deletion target is correct. Shard 29 line 176 reads verbatim: "- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid` ... Constraints/relationships: **Key relationships and invariants**." Shard 29 line 133 is the table header: "| Aggregate | Key relationships and invariants |". Shard 33 line 143 ends "Constraints/relationships: **Key invariants**." and shard 33's header row reads "| Aggregate | Key invariants |". Two different header strings reproduced verbatim in two different phantoms — the header-row-consumed-as-data diagnosis is proved, not inferred. Mechanical count over all eight files (ag

### A-20 — `33-show-day-operations.md`

**Tier.** 2

**Sources.**
- `.memory/wiki/specs/ia/33-show-day-operations.md § Acceptance Criteria, AC-33.07, line 60 (the corrupted line)`
- `.memory/wiki/specs/ia/33-show-day-operations.md § Interactions, row 33.07, line 83 (authoritative success and failure cells)`
- `.memory/wiki/specs/ia/deep-dives/33-show-day-operations.md line 24 (complete four-member enum)`
- `.memory/wiki/specs/ia/deep-dives/33-show-day-operations.md lines 73 and 145 (`curfew_margin` field; version-lock re-evaluation)`
- `.memory/wiki/specs/ia/33-show-day-operations.md line 101 (`ApplyTimelineMutation` error `CURFEW_BREACH_UNACKNOWLEDGED`) and line 217 (curfew edge case)`

**Source quote.** Shard 33 line 83 (authoritative): "| 33.07 | Evaluate curfew margin | Venue constraints and duration ranges available | `breach|tight|clear` range with uncertainty/provenance renders | Unknown/stale constraint returns unknown risk |" — Deep dive 33 line 24: "2. Evaluate several venue-sourced curfew constraints and uncertainty into breach/tight/clear/unknown." — Shard 33 line 60 (the corruption, for contrast): "... and (6) return `breach; if the flow cannot complete, tight."

**Fix.**

```
All edits in `.memory/wiki/specs/ia/33-show-day-operations.md` (plus one optional line in its deep dive).

(1) Line 60 — replace the corrupted AC in full with, matching the house template used by every sibling AC:
`- **AC-33.07 — Evaluate curfew margin:** Given Venue constraints and duration ranges available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate curfew margin, and (6) return a `CurfewMarginStatus` of `breach`, `tight` or `clear` with the evaluated margin range, its uncertainty and its constraint provenance; if the flow cannot complete, an unknown or stale venue constraint returns `CurfewMarginStatus` `unknown` with the unknown-risk marker and never a fabricated margin.`

(2) Line 83 — escape the pipes inside the code span so regeneration cannot re-corrupt the AC. Replace the row with:
`| 33.07 | Evaluate curfew margin | Venue constraints and duration ranges available | `breach\|tight\|clear` range with uncertainty/provenance renders | Unknown/stale constraint returns `unknown` risk |`

(3) `## Data Models` — after the invariant bullets (around line 137, alongside 'All thresholds, bands, edit windows, staleness and alert cadences use versioned settings.'), add the named closed enum so the return type is typed rather than described:
`- `CurfewMarginStatus` is a closed enum: `breach | tight | clear | unknown`. `unknown` is reachable only from an unreadable or stale venue constraint and is never inferred from an evaluated margin.`

(4) `## Contracts → ### Command Contracts` (table at lines 97-107) — add the missing command row, since 33.07 is a normative interaction with no contract entry today:
`| `EvaluateCurfewMargin` | event/timeline version, venue curfew constraints, duration ranges | `CurfewMarginStatus`, margin range, uncertainty, constraint provenance | `CONSTRAINT_UNAVAILABLE`, `CONSTRAINT_STALE`, `STALE_VERSION` |`
(The first two errors are the typed carriers of the `unknown` branch already stated in the interaction row; `STALE_VERSION` matches every other command in this shard.)

(5) Optional consistency edit — deep dive line 24 currently writes the enum as prose (`breach/tight/clear/unknown`). Change to `` `breach | tight | clear | unknown` `` so the deep dive and the shard render one identical token set.

Verification after the fix: `grep -c 'breach' 33-show-day-operations.md` should find the status in the AC, the interaction row, the enum and the contract row; and no line in the file should end with an unmatched backtick — check with `grep -n '`[^`]*$' 33-show-day-operations.md`.

Generator note: the AC generator splits interaction rows on `|` without respecting inline code spans. Shard 33 line 83 was the only row in this shard that tripped it, but the same hazard exists anywhere a closed enum is written inline; escaping is the durable fix, not just re-authoring the AC.
```

**Challenge result.** CONFIRMED — Corruption and authority both verified verbatim. `.memory/wiki/specs/ia/33-show-day-operations.md` line 60 ends exactly as claimed: "... (5) Evaluate curfew margin, and (6) return `breach; if the flow cannot complete, tight." — an unterminated code span, a truncated enum, and the failure clause destroyed. Line 83 is the authoritative row, verbatim: "| 33.07 | Evaluate curfew margin | Venue constraints and duration ranges available | `breach|tight|clear` range with uncertainty/provenance renders | Unknown/stale constraint returns unknown risk |". The unescaped pipes inside the code span are visibly what the AC generator split on — the corrupted AC's two fragments are precisely the 1st and 2nd of the three enum members, which is the signature of the row being split into extra cells. This is a mechanical corruption, not a missing decision, so it needs no owner input. `.memory/wiki/specs/ia/

### A-21 — `35-ticket-products-sales.md`

**Tier.** 2

**Sources.**
- `.memory/wiki/specs/ia/index.md § Shards (lines 51-54: rows 36, 37, 38, 39)`
- `.memory/wiki/specs/ia/decomposition-plan.md § Domain Boundary Table (rows 36, 37, 39 — `Depends On` column)`
- `.memory/wiki/specs/ia/36-box-office-risk.md:276`
- `.memory/wiki/specs/ia/37-fanbase-direct-to-fan.md:321`
- `.memory/wiki/specs/ia/38-promotion-marketing.md:353 and :148`
- `.memory/wiki/specs/ia/39-analytics-ingestion-reporting.md:265`
- `.memory/wiki/specs/ia/35-ticket-products-sales.md:270, 279-281 (the defect site)`

**Source quote.** 38-promotion-marketing.md:353 — "- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/11-community-graph|Shard 11]], [[specs/ia/14-services-marketplace|Shard 14]], [[specs/ia/22-release-distribution|Shard 22]], [[specs/ia/35-ticket-products-sales|Shard 35]], [[specs/ia/37-fanbase-direct-to-fan|Shard 37]]"; 38-promotion-marketing.md:148 — "| `TicketConversionAttributionV1` | Shard 35 → promotion reporting | order/ticket, event, eligible click, settlement/refund state | Observed first-party conversion only; refunds net result |"; 39-analytics-ingestion-reporting.md:265 — "- **Depends on:** ... [[specs/ia/35-ticket-products-sales|Shard 35]], [[specs/ia/38-promotion-marketing|Shard 38]]"; ia/index.md — "| 38 | [38-promotion-marketing.md](38-promotion-marketing.md) | Promotion and marketing |"

**Fix.**

```
File `.memory/wiki/specs/ia/35-ticket-products-sales.md`, § Cross-Shard Dependencies.

EDIT 1 — replace line 270 in its entirety with:
`- **Depended on by:** [[specs/ia/36-box-office-risk|Shard 36]], [[specs/ia/37-fanbase-direct-to-fan|Shard 37]], [[specs/ia/38-promotion-marketing|Shard 38]], [[specs/ia/39-analytics-ingestion-reporting|Shard 39]]`

EDIT 2 — in § Cross-Shard Section Contract Map, replace lines 280-281 with the three bullets below (line 279, the Shard 36 bullet, is already correct and is left untouched). Boilerplate wording is unchanged from the existing rows; only the shard names, filenames and the added Shard 38 row differ:

`- **Shard 37:** consume [Shard 37 Contracts](37-fanbase-direct-to-fan.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 37 Event Schemas](37-fanbase-direct-to-fan.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.`
`- **Shard 38:** consume [Shard 38 Contracts](38-promotion-marketing.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 38 Event Schemas](38-promotion-marketing.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.`
`- **Shard 39:** consume [Shard 39 Contracts](39-analytics-ingestion-reporting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 39 Event Schemas](39-analytics-ingestion-reporting.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.`

EDIT 3 — § Related Specs at the foot of the file is marked `


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-13|D-13]]

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
