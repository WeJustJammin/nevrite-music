# Projects, Delivery, Marketplace, and Distribution — Unratified Decision Queue

> **Status:** Draft only. No option below is ratified or changes a source specification.
> **Scope:** Exactly every non-fixed Final Per-Finding Disposition Ledger identity in `r-44`–`r-56` and `r-59`–`r-64`: 20 single-identity entries.
> **Authority:** The canonical identities and classifications come from [remediation-state.md](../remediation-state.md) § `Final Per-Finding Disposition Ledger`. `r-NN[index]` is the immutable manifest identity; source paths below are evidence, not authorization to select policy.
> **Classification rule:** Product choices remain with the Product owner in `/ideate-validate`. Architecture and security-contract choices remain with the listed architecture/security owner and stage. Recommendations are explicitly **UNRATIFIED**.

## Queue rules

- Every entry covers exactly one ledger identity and poses exactly one question.
- `Current interim rule` records existing behavior only. It does not decide the outstanding policy.
- `Exact sources` names the target source plus material cited authority read before drafting with current heading and decision/open-question anchors. No source file was modified.

---

## P-01 — Production-board stage vocabulary

**Affected ledger identity:** `r-44[0]`  
**Classification:** Product decision  
**Owner / stage:** Product owner — `/ideate-validate`

**Decision required:** Which fixed production-stage vocabulary should every Song board use?

**Why this needs an owner choice:** The draft is intentionally a fixed, music-specific lifecycle—not configurable Kanban—currently `writing → demo → tracking → overdubs → comp → mix → mix approved → master → master approved → delivered`. `Song.current_stage` drives stage-specific capture prompts, and `master approved` gates release readiness. Yet Q-01 explicitly says these labels have not been validated against beatmaker weekly-release or session-player workflows.

| Option | Trade-off |
|---|---|
| **A. Lock the current ten stages.** | Preserves current labels, prompt timing, and release-lifecycle references. Deliberately accepts the documented band/album bias as v1 scope. |
| **B. Practitioner-validate one shared fixed vocabulary, then lock a versioned enum.** | Tests the two named workflow gaps before lifecycle and prompt contracts harden, while retaining one music-native state model. Delays enum-dependent specification until review completes. |
| **C. Split vocabulary by production model.** | Can fit model-specific practice more closely, but changes the existing single `current_stage` contract into a polymorphic state machine. It requires new model selection, normalization, terminal-equivalence, transition-prompt, lifecycle, and migration rules. |

**UNRATIFIED recommendation:** **B.** Validate and approve one shared fixed vocabulary, then propagate it as the versioned lifecycle and prompt contract. It preserves the locked fixed-enum capture mechanism without treating provisional labels as universal. This recommendation does not choose product policy.

**Decision boundary:** This decision does not resolve approval re-collection after a backward move or 60+ song catalogue scaling; those remain separate P-03 and P-02 decisions. Union reporting is not a direct enum dependency: its source contract derives forms from captured session and attendance facts.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md` — § `Overview`; § `Deep Think Annotations`, `DT-01`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-cx.md` — `CX-01`, `CX-02`, and stage-transition capture-prompt relationship.
- `.memory/wiki/specs/ideation/02-credits-attribution/02.07-union-performer-session-reporting.md` — session-data and attendance-interval source contract.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-index.md` — § `Decision Log`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-44.json`, finding `[0]`.

**Current interim rule:** Vocabulary remains provisional. Downstream references must not present any label set as a hardened contract before owner selection and approval.

---

## P-02 — Large-catalogue production-board experience

**Affected ledger identity:** `r-44[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** How should the production board serve a catalogue of 60 or more songs?

| Option | Pros | Cons |
|---|---|---|
| A. Paginated board only | Keeps one familiar interaction model. | Board scanning weakens for label-scale catalogues. |
| B. Board below a threshold, catalogue table above it | Gives dense operations a suitable view while preserving board workflow for smaller projects. | Requires a threshold and two coherent views. |
| C. Exclude large catalogues from this feature | Keeps v1 bounded. | Leaves label operations without a defined workflow. |

**UNRATIFIED recommendation:** B — retain the board for active small projects and define a catalogue-table fallback for scale.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md` — § `Edge Cases / Failure Modes`; § `Open Questions`, `Q-03`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-index.md` — § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-44.json`, finding `[1]`.

**Current interim rule:** No scaling behavior is specified; no threshold or alternate view is assumed.

---

## P-03 — Approval behavior after a backward stage transition

**Affected ledger identity:** `r-44[2]`
**Classification:** Product decision — interim-replacement entry
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** After a song moves backward then re-advances, must superseded approvals be collected again?

| Option | Pros | Cons |
|---|---|---|
| A. Re-collect approvals | Ensures approvals match the reworked material. | Adds review delay and workload. |
| B. Auto-revive superseded approvals | Fastest return to a prior stage. | Can imply approval of changed work. |
| C. Re-collect only after material change | Preserves speed for administrative reversions. | Requires a material-change definition and audit trail. |

**UNRATIFIED recommendation:** C — permits harmless correction while protecting approval integrity when work changed.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md` — § `Open Questions`, `Q-02`; § `Edge Cases / Failure Modes`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.04-approval-gates-signoff-trail.md` — § `Decisions`, `D-05`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-44.json`, finding `[2]`.

**Current interim rule:** Current non-blocking stage handling marks later-stage sign-offs superseded; final re-advance behavior remains open.

---

## A-01 — Contradictory-feedback detection mechanism

**Affected ledger identity:** `r-45[0]`
**Classification:** Architecture decision
**Owner / stage:** Architecture owner — `/create-prd-architecture`

**Question:** What mechanism should v1 use to surface contradictory feedback?

| Option | Pros | Cons |
|---|---|---|
| A. Positional clustering plus manual flagging | Explainable, deterministic, and avoids semantic-model dependency. | Misses conflicts expressed in distant or indirect language. |
| B. Model-backed semantic detection | Finds meaning-level conflicts across wording variations. | Requires model, privacy, evaluation, and false-positive contracts. |
| C. Manual flags only | Lowest implementation ambiguity. | Misses the feature's stated contradiction-surfacing value. |

**UNRATIFIED recommendation:** A — establish deterministic, human-controlled surfacing before considering model-backed expansion.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.03-feedback-consolidation-triage.md` — § `Overview`; § `Deep Think Annotations`, `DT-01`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05-review-feedback-approval-index.md` — § `Decision Log`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-45.json`, finding `[0]`.

**Current interim rule:** Contradictions must be surfaced, never adjudicated; detection mechanism is unspecified.

---

## P-04 — Default handoff-package contents and recipient checks

**Affected ledger identity:** `r-46[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** What must each default recipient handoff package contain and validate?

| Option | Pros | Cons |
|---|---|---|
| A. Define all six shipped recipient specs now | Makes the package builder fully deterministic. | Broad validation work before highest-frequency use is proven. |
| B. Define mastering and mix specs first; others are explicit follow-on specs | Covers primary workflows and bounds v1. | Remaining named defaults cannot yet validate. |
| C. Ship a generic package with optional fields | Fastest interface. | Contradicts recipient-spec-first product premise. |

**UNRATIFIED recommendation:** B — lock the highest-frequency mastering and mix contracts, then publish explicit dependencies for the remaining recipient specs.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.01-handoff-package-builder-recipient-spec.md` — § `Overview`; § `Deep Think Annotations`, `DT-01`; § `Decisions`, `D-01`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-cx.md` — § `Cross-Cut Map`, `CX-01`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-46.json`, finding `[0]`.

**Current interim rule:** Six recipient-spec names exist; required contents and checks are not inferred.

---

## P-05 — Readiness-target facts and ship dependency

**Affected ledger identity:** `r-47[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Which target facts must readiness score, and can readiness ship before those target specs exist?

| Option | Pros | Cons |
|---|---|---|
| A. Define every target fact now | Makes each readiness result computable. | Couples work to unresolved release, sync, and handoff policy. |
| B. Evaluate externally owned specs only; block shipping until they exist | Preserves domain boundaries. | Readiness remains unavailable until dependencies complete. |
| C. Define a generic score independent of target | Gives an early indicator. | Loses the stated gap-list-against-target meaning. |

**UNRATIFIED recommendation:** B — do not fabricate target facts; readiness evaluates authoritative external specs when they are defined.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.03-metadata-completeness-readiness-score.md` — § `Behavior`; § `Cross-Cut Notes`, `Q-01`; § `Open Questions`, `Q-02`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-cx.md` — § `Cross-Cut Map`, `CX-04`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-47.json`, finding `[0]`.

**Current interim rule:** No target-specific facts or thresholds are selected; no generic readiness score substitutes for them.

---

## P-06 — Full-melodic-loop declaration treatment

**Affected ledger identity:** `r-48[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** How should a declared preset that is actually a full melodic loop be classified?

| Option | Pros | Cons |
|---|---|---|
| A. Reclassify as library-loop and route to clearance review | Makes altered clearance obligations explicit. | Adds review friction and a new class. |
| B. Keep declared class but flag it | Preserves uploader choice while warning consumers. | Leaves classification and clearance ambiguity. |
| C. Reject until resubmitted as a loop | Strongest category integrity. | Creates avoidable resubmission burden. |

**UNRATIFIED recommendation:** A — use a distinct library-loop class with clearance review.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.04-source-declaration-samples-ai.md` — § `Edge Cases / Failure Modes`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-cx.md` — § `Cross-Cut Map`, `CX-02`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-48.json`, finding `[0]`.

**Current interim rule:** Ambiguous preset/loop treatment is pending; no automatic reclassification, acceptance, or rejection is assumed.

---

## P-07a — Re-gating after terms are re-versioned

**Affected ledger identity:** `r-50[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When access terms are re-versioned, which current holders must acknowledge the new version before their next vault access?

| Option | Pros | Cons |
|---|---|---|
| A. Re-gate every current holder | Uniform acknowledgement and simple rule. | Disrupts holders whose access and terms were not materially affected. |
| B. Re-gate only holders affected by an owner-flagged material term change | Limits interruption to materially changed obligations. | Requires a material-change definition and durable audit flag. |
| C. Never re-gate existing holders | Least interruption. | Leaves continued access under terms the holder never accepted. |

**UNRATIFIED recommendation:** B — preserve acknowledgement for changed obligations without indiscriminate re-gating.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-cx.md` — § `Cross-Cut Details`, `CX-03: Invitation ↔ Asset Vault (NDA gating)`, state-transition conflict.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.03-rights-aware-asset-vault-nda-gating.md` — § `Behavior`; § `Decisions`, `D-07`; § `Open Questions`, `Q-04`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-50.json`, finding `[0]`.

**Current interim rule:** Re-versioning does not itself establish a re-gating policy; no new access behavior is introduced by this queue.

---

## P-07b — Downgrade-notification audience

**Affected ledger identity:** `r-50[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a contributor is downgraded, which people receive the access-change notification?

| Option | Pros | Cons |
|---|---|---|
| A. Notify the affected contributor only | Honest notice while limiting disclosure of team-role changes. | The owner must infer whether a wider coordination notice is needed. |
| B. Notify every roster member | Makes role changes transparent to the full team. | Needlessly discloses a potentially sensitive demotion and creates noise. |
| C. Notify only if the contributor encounters denial | Avoids explicit demotion messaging. | Delays notice and conceals a material loss of access. |

**UNRATIFIED recommendation:** A — ensure timely notice to the affected contributor without broadcasting a sensitive role change.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-cx.md` — § `Cross-Cut Details`, `CX-01: Contributor Roster ↔ Asset Vault`, notification-fan-out conflict.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.01-contributor-roster-role-assignment.md` — § `Decisions`, `D-09`; § `Open Questions`, `Q-04`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-50.json`, finding `[1]`.

**Current interim rule:** No downgrade-notification audience is selected; no new fan-out behavior is introduced by this queue.

---

## A-02 — Review-link permission-intersection contract

**Affected ledger identity:** `r-51[0]`
**Classification:** Architecture decision
**Owner / stage:** Architecture owner — `/create-prd-architecture`

**Question:** How should review-link recipients be isolated from internal feedback?

| Option | Pros | Cons |
|---|---|---|
| A. Recipient sees only their own thread; internal scope immutable and hidden | Strong confidentiality boundary and matches child behavior. | Requires strict scope enforcement across views and APIs. |
| B. Recipient sees all feedback on shared timestamps | Better collaboration context. | Leaks internal discussion and conflicts with the documented boundary. |
| C. Owner configures visibility per thread | Flexible. | Increases permission state and accidental-disclosure risk. |

**UNRATIFIED recommendation:** A — source child contracts establish this boundary; architecture must make it enforceable and remove stale CX pending wording.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05-review-feedback-approval-cx.md` — § `Cross-Cut Details`, `CX-01: Private Share Links ↔ Timestamped Review`, permission-intersection treatment.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.01-timestamped-waveform-review.md` — § `Decisions`, `D-13` and `D-14`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.05-review-feedback-approval/07.05.02-private-share-links-listen-analytics.md` — § `Decisions`, `D-10`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-51.json`, finding `[0]`.

**Current interim rule:** Child sources isolate recipient and internal scopes; CX describes the issue as pending, so cross-domain contract status is unresolved.

---

## A-03 — DAW parsing viability and no-person-name path

**Affected ledger identity:** `r-52[0]`
**Classification:** Architecture decision
**Owner / stage:** Architecture owner — `/create-prd-architecture`

**Question:** What DAW parsing and track-mapping contract should v1 support?

| Option | Pros | Cons |
|---|---|---|
| A. Validate supported DAWs first and define a no-person-name fallback | Grounds product promise in real session evidence. | Delays broad automation contract. |
| B. Support a broad parser immediately | Maximizes intended coverage. | Depends on explicitly unvalidated market premise. |
| C. Import manually mapped tracks only | Reliable initial data model. | Loses capture-at-source automation value. |

**UNRATIFIED recommendation:** A — validate real sessions and explicitly define the electronic-production fallback before stack commitments.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09.02-daw-session-parsing-track-mapping.md` — § `Deep Think Annotations`, `DT-01`; § `Open Questions`, `Q-01` and `Q-02`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09-daw-bridge-capture-at-source-index.md` — § `Why This Exists — the single most consequential Deep Think finding in domain 07`; § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-52.json`, finding `[0]`.

**Current interim rule:** No DAW parsing/track-mapping integration is selected; unvalidated attribution assumptions must not harden into a build contract.

---

## A-04 — Rights-aware vault and NDA-gating access contract

**Affected ledger identity:** `r-53[0]`
**Classification:** Architecture/security decision
**Owner / stage:** Architecture owner — `/create-prd-security`

**Question:** Which default access profiles may the rights-aware vault enforce in v1?

| Option | Pros | Cons |
|---|---|---|
| A. Validate proposed profiles with practitioners, then lock them | Reduces chance of an unsafe or unusable permission model. | Defers final access contract. |
| B. Lock proposed profiles as v1 now | Enables immediate authorization design. | Converts an explicitly unvalidated matrix into security policy. |
| C. Use owner-configured permissions only | Flexible for unusual teams. | Weakens predictable least-privilege defaults and raises configuration risk. |

**UNRATIFIED recommendation:** A — practitioner validation is required before permission hardening.

**Exact sources:**
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.03-rights-aware-asset-vault-nda-gating.md` — § `Behavior`; § `Open Questions`, `Q-03` and `Q-04`.
- `.memory/wiki/specs/ideation/07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-index.md` — § `Decision Log`; § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-53.json`, finding `[0]`.

**Current interim rule:** Access profiles are proposed only; no profile becomes a hardened permission default through this draft.

---

## A-05 — Partial DSP acceptance status model

**Affected ledger identity:** `r-54[1]`
**Classification:** Architecture decision
**Owner / stage:** Architecture owner — `/create-prd-architecture`

**Question:** How should a store result that accepts some tracks and rejects others be represented?

| Option | Pros | Cons |
|---|---|---|
| A. Add a track axis to the per-store status object | Represents each track outcome natively. | Changes status identity and query model. |
| B. Keep release-level status with a rejected-track list | Preserves current status identity while retaining detail. | Requires attached-detail contract and careful lifecycle handling. |
| C. Collapse to release accepted/rejected | Simplest model. | Loses a material operational outcome. |

**UNRATIFIED recommendation:** B — preserve `(release × store × territory)` identity with structured rejected-track detail.

**Exact sources:**
- `.memory/wiki/specs/ideation/12-release-distribution/12.03-dsp-store-territory-management/12.03.02-per-store-delivery-status.md` — § `Behavior`; § `States`; § `Open Questions`, `Q-04`.
- `.memory/wiki/specs/ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-cx.md` — § `Cross-Cut Map`, `CX-02`; § `Cross-Cut Details`.
- `.memory/wiki/specs/ideation/12-release-distribution/12.03-dsp-store-territory-management/12.03.03-rejection-triage-remediation.md` — § `Behavior`; § `States`; § `Open Questions`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-54.json`, finding `[1]`.

**Current interim rule:** Partial acceptance is recognized by delivery messaging, but per-store status representation is not selected.

---

## P-08a — Comparable-sales originality aggregate

**Affected ledger identity:** `r-56[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Which aggregate originality state should the marketplace derive from component disclosures for comparable-sales matching?

| Option | Pros | Cons |
|---|---|---|
| A. Enumerated aggregate derived from components | Makes comparable-sales bucketing deterministic and inspectable. | Requires explicit component-to-aggregate and unknown mappings. |
| B. Component vector only | Preserves source-detail granularity. | Cannot establish a deterministic comparable-sales key. |
| C. Seller-entered aggregate label | Simplifies listing entry. | Weakens provenance and makes the comparable key manipulable. |

**UNRATIFIED recommendation:** A — derive a bounded aggregate from evidence-bearing component disclosures and map unknown explicitly.

**Exact sources:**
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.03-modification-originality-disclosure.md` — § `Behavior`; § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02-condition-originality-disclosure-cx.md` — § `Cross-Cut Map`, `CX-02`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.01-condition-grading-scale.md` — § `Decisions`, `D-10`; § `Cross-Cut Notes` (condition-grading relationship only).
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-56.json`, finding `[0]`.

**Current interim rule:** Originality remains a per-component disclosure; no comparable-sales aggregate is assumed.

---

## P-08b — Live-offer outcome after a material originality change

**Affected ledger identity:** `r-56[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** What happens to a live offer when a listing’s originality state changes materially?

| Option | Pros | Cons |
|---|---|---|
| A. Void offers after a material downgrade; preserve and notify after an upgrade | Protects buyers when value-relevant evidence worsens without penalizing a seller improvement. | Requires a materiality rule and notification contract. |
| B. Preserve all offers with a disclosure notice | Retains transaction momentum. | Buyer consent may not reflect the revised originality state. |
| C. Void every offer after any originality change | Simple and conservative. | Cancels harmless corrections and creates avoidable churn. |

**UNRATIFIED recommendation:** A — apply the documented asymmetric sibling-axis treatment after materiality is defined.

**Exact sources:**
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.03-modification-originality-disclosure.md` — § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.02-mandatory-flaw-disclosure.md` — § `Behavior`; § `Decisions`, material-flaw offer treatment.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-56.json`, finding `[1]`.

**Current interim rule:** No live-offer outcome is assumed from an originality change.

---

## P-09 — Local-pickup settlement branch

**Affected ledger identity:** `r-59[0]`
**Classification:** Product decision — interim-replacement entry
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** Does money move through the platform for a local-pickup transaction?

| Option | Pros | Cons |
|---|---|---|
| A. Platform-settled pickup | Supports escrow, fee collection, ownership transfer, and evidence flow. | Adds payment, custody, refund, and compliance responsibilities. |
| B. Off-platform cash pickup | Minimizes platform financial role. | Cannot assume platform settlement, escrow, fees, or automatic ownership transfer. |
| C. Seller chooses per listing | Flexible across local norms. | Makes buyer expectations and every downstream branch more complex. |

**UNRATIFIED recommendation:** B — keep v1 pickup off-platform unless a platform-settlement product decision is deliberately made.

**Exact sources:**
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.11-local-pickup-meetup-safety.md` — § `Deep Think Annotations`, `DT-01`; § `Open Questions`, `Q-01`; § `States`; § `Edge Cases / Failure Modes`.
- `.memory/wiki/specs/ideation/13-gear-marketplace/13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md` — § `Decisions`; § `Cross-Cut Notes`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-59.json`, finding `[0]`.

**Current interim rule:** No fabricated platform settlement. Existing deterministic pickup handling remains; settlement branch is open.

---

## P-10a — Rights-takedown effect on existing holders

**Affected ledger identity:** `r-62[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a digital good is taken down for a rights reason, what access and notice should existing holders retain?

| Option | Pros | Cons |
|---|---|---|
| A. Preserve a holder record and send a rights-takedown notice; remove further delivery | Separates the legal event from ordinary product revision and preserves auditability. | Requires explicit archive, access, and notification states. |
| B. Treat the takedown as an ordinary revision | Reuses one lifecycle path. | Obscures the rights event and can mislead holders. |
| C. Remove the prior version and holder record | Simplifies operations. | Breaks purchased-library expectations and auditability. |

**UNRATIFIED recommendation:** A — retain an auditable holder relationship while stopping further delivery under the rights event.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-versioning-updates-legacy-archive.md` — § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.01-sample-loop-pack-catalog.md` — § `Decisions`, `D-08` and `D-09`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/digital-goods-marketplace-cx.md` — § `Cross-Cut Details`, `CX-26`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-62.json`, finding `[0]`.

**Current interim rule:** A rights takedown has no selected holder-access or notice outcome in this queue.

---

## P-10b — Ordinary revision effect on existing holders

**Affected ledger identity:** `r-62[1]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a seller publishes an ordinary content revision, how should the platform preserve the prior version for existing holders?

| Option | Pros | Cons |
|---|---|---|
| A. Append the revision, preserve a legacy archive, and notify holders | Gives holders continuity and a clear version history. | Requires archive retention and notification rules. |
| B. Replace the prior version in place | Simplifies the library surface. | Loses holder-visible history and access to prior content. |
| C. Require repurchase for every revision | Minimizes entitlement complexity. | Undermines buyer expectations for seller-issued updates. |

**UNRATIFIED recommendation:** A — treat an ordinary revision as append-and-correct rather than legal removal or silent replacement.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-versioning-updates-legacy-archive.md` — § `Behavior`; § `States`; § `Open Questions`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/digital-goods-marketplace-cx.md` — § `Cross-Cut Details`, `CX-26`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-62.json`, finding `[1]`.

**Current interim rule:** No ordinary-revision archive, entitlement, or notice outcome is selected by this queue.

---

## P-11 — Departed contributor’s accruing pack share

**Affected ledger identity:** `r-63[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** What happens to a confirmed contributor’s accruing share after they depart or are erased?

| Option | Pros | Cons |
|---|---|---|
| A. Hold share in escrow for a future claim; do not redistribute | Preserves earnings claim and avoids unilateral enrichment. | Requires legal retention, claimant, and escheat treatment. |
| B. Redistribute among remaining contributors | Clears payable balance. | Alters confirmed economic split without departed-party consent. |
| C. Forfeit to seller/platform | Simple accounting. | High fairness and legal risk. |

**UNRATIFIED recommendation:** A — preserve the money-bearing claim while separately resolving GDPR-versus-payout retention through security/legal design.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.03-multi-contributor-pack-splits.md` — § `Edge Cases / Failure Modes`; § `Open Questions`, `Q-01`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.02-download-attribution-accrual.md` — § `Behavior`; § `Cross-Cut Notes`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-63.json`, finding `[0]`.

**Current interim rule:** No funds are redistributed, escheated, or forfeited by assumption; no new platform escrow contract is created here.

---

## P-12 — Preset compatibility break remediation owner

**Affected ledger identity:** `r-64[0]`
**Classification:** Product decision
**Owner / stage:** Product owner — `/ideate-validate`

**Question:** When a host update breaks a purchased preset bank, who owes remediation?

| Option | Pros | Cons |
|---|---|---|
| A. Treat it as external compatibility; flag library entry, no default refund | Matches a no-fault host change. | Buyer may receive no remediation. |
| B. Treat it as a vendor conformity defect | Clear vendor obligation or refund path. | Assigns vendor liability for third-party changes. |
| C. Platform goodwill remedy | Improves buyer trust. | Creates discretionary cost and inconsistent expectations. |

**UNRATIFIED recommendation:** A — default to compatibility flagging unless the product owner classifies the break as a conformity defect under the refund policy.

**Exact sources:**
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.02-preset-patch-catalog.md` — § `Behavior`; § `Edge Cases / Failure Modes`; § `Open Questions`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.01-catalog-compatibility/14.01.02-format-os-daw-compatibility-matrix.md` — § `Behavior`; § `Cross-Cut Notes`.
- `.memory/wiki/specs/ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.02-digital-refund-eligibility-adjudication.md` — § `Decisions`; § `Cross-Cut Notes`.
- Immutable manifest `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-64.json`, finding `[0]`.

**Current interim rule:** Library entry remains compatibility-flagged; neither refund, vendor remediation, nor platform remedy is assumed.

---

## Exact coverage mapping

| Ledger identity | Queue entry | Classification | Owner / stage |
|---|---|---|---|
| `r-44[0]` | P-01 | Product | Product owner — `/ideate-validate` |
| `r-44[1]` | P-02 | Product | Product owner — `/ideate-validate` |
| `r-44[2]` | P-03 | Product / interim replacement | Product owner — `/ideate-validate` |
| `r-45[0]` | A-01 | Architecture | Architecture owner — `/create-prd-architecture` |
| `r-46[0]` | P-04 | Product | Product owner — `/ideate-validate` |
| `r-47[0]` | P-05 | Product | Product owner — `/ideate-validate` |
| `r-48[0]` | P-06 | Product | Product owner — `/ideate-validate` |
| `r-50[0]` | P-07a | Product | Product owner — `/ideate-validate` |
| `r-50[1]` | P-07b | Product | Product owner — `/ideate-validate` |
| `r-51[0]` | A-02 | Architecture | Architecture owner — `/create-prd-architecture` |
| `r-52[0]` | A-03 | Architecture | Architecture owner — `/create-prd-architecture` |
| `r-53[0]` | A-04 | Architecture/security | Architecture owner — `/create-prd-security` |
| `r-54[1]` | A-05 | Architecture | Architecture owner — `/create-prd-architecture` |
| `r-56[0]` | P-08a | Product | Product owner — `/ideate-validate` |
| `r-56[1]` | P-08b | Product | Product owner — `/ideate-validate` |
| `r-59[0]` | P-09 | Product / interim replacement | Product owner — `/ideate-validate` |
| `r-62[0]` | P-10a | Product | Product owner — `/ideate-validate` |
| `r-62[1]` | P-10b | Product | Product owner — `/ideate-validate` |
| `r-63[0]` | P-11 | Product | Product owner — `/ideate-validate` |
| `r-64[0]` | P-12 | Product | Product owner — `/ideate-validate` |

**Coverage assertion:** 20 non-fixed ledger identities in the requested numeric ranges, 20 single-identity entries, and 20 mapped exactly once. No `verified-fixed` identity is included. No policy is ratified and no source specification is changed.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-08|D-08]]
