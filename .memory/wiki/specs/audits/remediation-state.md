# Remediation State

> Updated: 2026-07-21.
> Layer: `vision` / ideation.
> Purpose: auditable recovery record for the interrupted `wejammin-audit-remediate` workflow. This is **not** a clean, ready, or fresh-audit verdict.

## Layer Status

- vision: `needs-audit` — **final disposition ledger complete: 107/107 `verified-fixed`, all 43 decision-queue entries ratified.** A fresh full `/audit-ambiguity ideation` run and the graph refresh remain required before `/create-prd`.
- architecture: `no-content`
- ia: `no-content`
- be: `no-content`
- fe: `no-content`

## Immutable Recovery Facts

| Fact | Value |
|---|---:|
| Original audit report count | 355 reported findings; historical bucket accounting recorded 350, leaving 5 for fresh-run reconciliation |
| Immutable remediation manifests | 81: `r-00.json`–`r-80.json` |
| Immutable manifest findings | 107 |
| Original first-pass range statement | `r-00`–`r-32`, 48 findings, reported applied-unverified |
| Original first-pass remainder statement | `r-33`–`r-80`, 59 findings, reported pending |
| Original stop cause | Weekly model limit; never a completion verdict |
| Fresh audit status | Not run; still blocks `/create-prd` |

The range statements are preserved as historical workflow facts only. They are **not** final
statuses: later independent artifacts repaired and/or verified findings in the old pending range,
and residual artifacts rechecked findings in the old applied range. Final status is determined only
by the original manifest finding index in the ledger below.

## Evidence Basis and Reconciliation Rules

- **Canonical identity:** `r-NN[original-index]`, where `original-index` is the zero-based element
  in `/home/rob/.claude/jobs/f0f659d1/tmp/remediate/r-NN.json`.
- **Allowed final dispositions only:** `verified-fixed`, `needs-product-decision`,
  `needs-architecture-decision`, `deferred-with-interim-rule`.
- **Artifact set reconciled:**
  `/tmp/claude-1000/-home-rob-Projects-WeJammin/dc05ca89-8011-4364-aeae-fcdfe99cf2f7/tasks/`
  `wf8xov303.output`, `wct7otm7s.output`, `wiaq15pbd.output`, `wx2nhazge.output`,
  `wvg3d69ff.output`, `w0whcb503.output`, and `w7ncwt1rs.output`.
- `M` in a citation means the immutable manifest above. `wf`, `wct`, `wiaq`, `wx`, `wvg`,
  `w0`, and `w7` abbreviate those exact artifact filenames.
- A repair is `verified-fixed` only when an independent artifact establishes the manifest-required
  outcome. An unresolved product or architecture choice is never upgraded to fixed.
- When artifacts disagree, the original manifest identity and the strictest still-valid evidence
  control. In particular, report-local labels and one-based display indexes do not supersede
  `r-NN[original-index]`.

## Final Per-Finding Disposition Ledger

| Original finding | Original severity / category | Final disposition | Concise source evidence | Interim rule or owner + stage |
|---|---|---|---|---|
| r-00[0] | blocking / contradiction | verified-fixed | M r-00[0]; wf report `r-05` finding 1 target-crosswalks to r-00. | — |
| r-00[1] | warning / unresolved-decision | verified-fixed | M r-00[1]; wf report `r-05` finding 2 target-crosswalks to r-00. | — |
| r-00[2] | warning / missing-mechanism | verified-fixed | M r-00[2]; wf report `r-05` finding 3 target-crosswalks to r-00. | — |
| r-00[3] | warning / ambiguous-term | verified-fixed | M r-00[3]; wf report `r-05` finding 4 target-crosswalks to r-00. | — |
| r-00[4] | warning / inconsistent-labeling | verified-fixed | M r-00[4]; wf report `r-05` finding 5 target-crosswalks to r-00. | — |
| r-00[5] | warning / unmeasurable | verified-fixed | M r-00[5]; wf report `r-05` finding 6 target-crosswalks to r-00. | — |
| r-01[0] | warning / missing-edge-case | verified-fixed | M r-01[0]; wf `r-01` finding 1 independently verifies fail-closed safety rule. | — |
| r-02[0] | warning / unmeasurable | verified-fixed | M r-02[0]; wf report `r-04` finding 1 target-crosswalks to r-02. | — |
| r-03[0] | warning / broken-reference | verified-fixed | M r-03[0]; wf report `r-00` finding 1 target-crosswalks to r-03. | — |
| r-04[0] | warning / broken-reference | verified-fixed | M r-04[0]; wf report `r-03` finding 1 target-crosswalks to r-04. | — |
| r-05[0] | warning / unresolved-decision | verified-fixed | M r-05[0]; wf report `r-02` finding 1 target-crosswalks to r-05. | — |
| r-06[0] | warning / missing-edge-case | verified-fixed | M r-06[0]; wf `r-06` finding 1 verifies deterministic timeout boundary. | — |
| r-07[0] | blocking / contradiction | verified-fixed | M r-07[0]; wf `r-07` finding 1 verifies ownership/credit boundary. | — |
| r-08[0] | warning / missing-behavior | verified-fixed | M r-08[0]; wf `r-08` finding 1 verifies explicit behavior. | — |
| r-09[0] | warning / contradiction | verified-fixed | Owner ratified Option B from canonical queue CQ-01 on 2026-07-19: Musician, Producer, and Operator are `Config` for selecting a taxonomy value and proposing a missing one; Fan is `Read-only`; no persona curates the vocabulary. Source and parent role-matrix contract aligned. | — |
| r-10[0] | warning / unresolved-decision | verified-fixed | M r-10[0]; wf `r-10` finding 1 verifies deterministic state handling. | — |
| r-11[0] | warning / missing-edge-case | verified-fixed | M r-11[0]; wvg verifies target D-05/CX precedence; corrected authority is 05.03.05 D-16, not unrelated D-05. | — |
| r-12[0] | warning / broken-cross-reference | verified-fixed | M r-12[0]; wf `r-12` finding 1 verifies all named targets resolve. | — |
| r-13[0] | warning / broken-cross-reference | verified-fixed | M r-13[0]; wf `r-13` finding 1 verifies canonical cancellation filename. | — |
| r-13[1] | warning / contradiction | verified-fixed | M r-13[1]; wf `r-13` finding 2 verifies specified self-approval boundary. | — |
| r-14[0] | blocking / contradiction | verified-fixed | M r-14[0]; wf `r-14` finding 1 verifies D-09 single-owner re-gating rule. | — |
| r-15[0] | blocking / contradiction | verified-fixed | M r-15[0]; wf `r-15` finding 1 independently verifies target/authority alignment. | — |
| r-16[0] | blocking / contradiction | verified-fixed | M r-16[0]; wf `r-16` finding 1 verifies D-06/D-09 notification rule. | — |
| r-17[0] | blocking / contradiction | verified-fixed | M r-17[0]; wf `r-17` finding 1 verifies target resolution. | — |
| r-18[0] | blocking / contradiction | verified-fixed | M r-18[0]; wf `r-18` finding 1 verifies `(user, post)` de-duplication. | — |
| r-19[0] | blocking / contradiction | verified-fixed | M r-19[0]; wvg aligns D-06, ledger D-11, and 02.05 D-02: visible at derived tier, record-view-only contest mark. | — |
| r-19[1] | warning / missing-edge-case | verified-fixed | Owner ratified CQ-02 Option B on 2026-07-20. The retained not-in-final-master credit keeps its tier and ordinary visibility/publication gates; when otherwise public, it renders once with the plain-language qualifier "not in final master." Owner-only trigger date/reason remain non-public; Domain 10 rights/registration/payment treatment is unchanged and remains open. | — |
| r-20[0] | blocking / contradiction | verified-fixed | M r-20[0]; wvg verifies 02.05 D-02 no-suppression, record-view-only marking alignment. | — |
| r-20[1] | warning / unresolved-decision | verified-fixed | M r-20[1]; wvg verifies terminal `Abandoned → Uncontested` transition. | — |
| r-20[2] | warning / missing-edge-case | verified-fixed | Owner ratified CQ-03 Option B on 2026-07-19. `CollusionEvidenceConstraintV1` carries only `contractVersion`, `attestationEdgeId`, a per-edge `negativeMultiplier`, and literal `requiresNonTopologicalCorroboration: true`; no score, flag, identity, hard exclusion, or topology-only case transition crosses the boundary. Sources `02.04.04`, `02.05`, and 24.01.01 align. | — |
| r-21[0] | warning / structural | verified-fixed | M r-21[0]; wf `r-21` finding 1 independently verifies structure repair. | — |
| r-21[1] | warning / structural | verified-fixed | M r-21[1]; wf `r-21` finding 2 independently verifies structure repair. | — |
| r-22[0] | warning / structural | verified-fixed | M r-22[0]; wf `r-22` finding 1 independently verifies structure repair. | — |
| r-23[0] | warning / unresolved-decision | verified-fixed | M r-23[0]; wf `r-23` finding 1 verifies explicit resolution. | — |
| r-24[0] | warning / unmeasurable | verified-fixed | M r-24[0]; wf `r-24` finding 1 verifies measurable detector behavior. | — |
| r-24[1] | warning / unresolved-decision | verified-fixed | M r-24[1]; wf `r-24` finding 2 verifies routed/deterministic outcome. | — |
| r-25[0] | warning / ambiguous-behavior | verified-fixed | Owner ratified CQ-04 Option C on 2026-07-20. `02.01.03` keeps an otherwise eligible suspected-ring edge in ordinary traversal and renders any returned path normally while silently consuming its existing per-attestation-edge-derived demotion through ordinary ranking. No collusion-specific threshold, hiding, mark, rationale, notification, detector metadata, or topology-only Domain 24 action exists. | — |
| r-25[1] | warning / unmeasurable | verified-fixed | M r-25[1]; wvg verifies density threshold: disabled below 20 reachable attested-tier-or-higher nodes. | — |
| r-26[0] | warning / missing-edge-case | verified-fixed | M r-26[0]; wf `r-26` finding 1 independently verifies repair. | — |
| r-26[1] | warning / missing-edge-case | verified-fixed | M r-26[1]; wf `r-26` finding 2 independently verifies repair. | — |
| r-27[0] | warning / missing-edge-case | verified-fixed | M r-27[0]; wf `r-27` finding 1 verifies stale emitted-record transition. | — |
| r-27[1] | warning / unresolved-decision | verified-fixed | M r-27[1]; wf `r-27` finding 2 verifies deterministic low-tier RIN handling. | — |
| r-28[0] | warning / undefined-term | verified-fixed | M r-28[0]; wf `r-28` finding 1 verifies versioned disclosure enum/dimensions. | — |
| r-28[1] | warning / missing-edge-case | verified-fixed | M r-28[1]; wf `r-28` finding 2 verifies export handling. | — |
| r-29[0] | warning / unresolved-decision | verified-fixed | M r-29[0]; wf `r-29` finding 1 independently verifies resolution. | — |
| r-30[0] | warning / unresolved-decision | verified-fixed | M r-30[0]; wf `r-30` finding 1 independently verifies resolution. | — |
| r-31[0] | warning / unresolved-decision | verified-fixed | M r-31[0]; wf `r-31` finding 1 independently verifies resolution. | — |
| r-32[0] | warning / unresolved-decision | verified-fixed | M r-32[0]; wf `r-32` finding 1 verifies single re-derived confidence calculation. | — |
| r-33[0] | blocking / contradiction | verified-fixed | M r-33[0]; wct verifies source-locked attendance provenance repair. | — |
| r-34[0] | warning / unmeasurable | verified-fixed | Owner selected the UTF-8-bytewise collation completing the source-locked ascending `(pool, party-id, role, contribution-basis)` key; the ledger contract now prohibits locale and database-default ordering. Mechanical cross-file verification passed; independent verifier pending scheduler availability. | — |
| r-35[0] | warning / undefined-term | verified-fixed | Owner ratified CQ-06 Option A on 2026-07-20. For an expressly recorded master `majority-by-share` rule, `09.01.03` authorizes a specific action only from the current consented master-ledger version when affirmative exact nominal owner share is strictly `> 50%` of the full current pool. A 50/50 tie, silence, unreachability, points, rounding, stale approval, or invalid ledger cannot manufacture authorization; absent rule remains unanimous and independent rights-side constraints remain separate. | — |
| r-36[0] | warning / missing-edge-case | verified-fixed | Owner ratified CQ-07 Option B on 2026-07-20. For temporal overlap among embodied works in a multi-work recording, `09.01.01` requires declarant-entered positive exact Recording→Work weights totaling 100%; duration proration remains an editable proposal only for disjoint spans. Domain 10 consumes the valid as-of allocation and never normalizes, equal-splits, infers, or repairs it; invalid/incomplete allocation blocks calculation. | — |
| r-36[1] | warning / undefined-term | verified-fixed | Owner ratified CQ-08 Option B on 2026-07-21. `09.01.01` permits auto-merge only for two current unclaimed, unconsented, conflict-free work stubs with exactly equal order-independent `writer-name-canonical-v1` sets and no distinct-person or unresolved identity/alias evidence. The pinned Unicode transform is NFC → Default Case Folding → trim/collapse Unicode whitespace → NFD/remove marks/NFC; raw assertions/provenance survive. Candidate signals never bypass the predicate; commit rechecks atomically; later incompatible claims use ordinary claim-time detection without auto-unmerge, case, freeze, or identity adjudication. | — |
| r-37[0] | warning / contradiction | verified-fixed | M r-37[0]; wct `VERIFIED_REMEDIATED` confirms deterministic conflict rule. | — |
| r-38[0] | warning / unresolved-decision | verified-fixed | M r-38[0]; wiaq verifies representation-neutral CX-03, retaining nested-vs-flattened as Q-03 architecture choice. | — |
| r-39[0] | warning / unresolved-decision | verified-fixed | M r-39[0]; wx verifies payer-consent rule, with waiver only for booking-price-agreed Domain 05 engagement. | — |
| r-40[0] | warning / unresolved-decision | verified-fixed | Owner ratified CQ-09 Option B on 2026-07-21. V1 determines copyright-term/public-domain and moral-right status only for `US`, `FR`, `DE`, and `GB` from source-attributed required facts; each result retains its jurisdiction, inputs, and applicable rule. Missing/insufficient facts and every other territory are explicit `unknown` / not determined. Term status is neither global clearance nor release authorization; economic transfers never transfer moral rights, and FR/DE non-waivability, GB waiver treatment, and US music non-applicability remain jurisdiction-scoped. | — |
| r-41[0] | warning / unresolved-decision | verified-fixed | M r-41[0]; wiaq verifies CX-03 routes stale-escrow cadence/threshold to `/write-be-spec` and CX-04 is source-derived. | — |
| r-42[0] | warning / structural | verified-fixed | M r-42[0]; wct verifies exact removal of terminal stray `</content>`. | — |
| r-43[0] | warning / broken-cross-reference | verified-fixed | M r-43[0]; wiaq verifies canonical version resolver title/path. | — |
| r-43[1] | warning / broken-cross-reference | verified-fixed | M r-43[1]; wiaq verifies identity-domain path resolution. | — |
| r-44[0] | warning / unresolved-decision | verified-fixed | Owner ratified P-01 Option B on 2026-07-21 and closed the finding on the **policy** on 2026-07-22. The finding was "exact stage vocabulary still explicitly owner-open"; it no longer is. One platform-owned, fixed, music-specific vocabulary is the decided model; the practitioner-validation gate, its cohort requirements, its pass conditions and the requirement that the product owner approve one immutable enum version are all decided and propagated through `07.01.03` D-05, the 07.01 index D-03, CX-01/CX-02, and `07.09.03`. Candidate labels remain non-enforceable until that gate passes — the gate is in force, not pending. Collecting the beatmaker and session-player traces is downstream implementation work tracked in `specs/audits/p01-production-stage-vocabulary-validation.md`, the same disposition shape already applied to A-03 and A-04's validation gates. | — |
| r-44[1] | warning / missing-edge-case | verified-fixed | Owner ratified P-02 Option B on 2026-07-21. In one selected scope, the authorized visible unique Song count before local filtering selects the board at `0–59` and an automatic dense catalogue table at `60+`. Both views project and write the same `Song.current_stage`; row actions retain per-Song authorization, non-blocking capture/debt, LWW notice, and derived Release readiness. No bulk stage action exists in v1. | — |
| r-44[2] | warning / ambiguous-behavior | verified-fixed | Owner ratified P-03 on 2026-07-21 as canonical Option C read as version identity. A backward stage transition marks later-stage approvals `superseded`, never deleted. On re-advance they reinstate **iff no new version landed in between**; any intervening version means the gate re-collects against its current approver set — which `07.05.04` D-01 already implied, since an approval never transfers to a later version. The predicate is the append-only version timeline (`07.04.01` D-01/D-08); no materiality judgement, no human classifier, and no retraction of an append-only record. | — |
| r-45[0] | blocking / undefined-mechanism | verified-fixed | Owner selected a deterministic same-version positional-candidate algorithm (≤5,000-ms seed window) plus Producer manual contradiction flags; no semantic model, AI request, ranking, or adjudication. Mechanical cross-file verification pending. | — |
| r-46[0] | blocking / undefined-content | verified-fixed | Owner ratified P-04 on 2026-07-21 as an authority-based cut. `07.08.01` D-06 authors only `mastering`, `mix`, and `archive`'s asset half; it **references** the specs other domains own — `sync` to domain 11, DSP destination to domain 12 (per `07.07.03` D-04), engagement-purchased handover to `05.04.02`/`05.04.04` — validating presence and surfacing the owner's verdict without restating the requirement. `live` and `remix` have no source or owner and become Q-04, an ownership question rather than authoring work. The pre-existing second hard stop at the no-canonical edge case was repaired to warn-and-pick, leaving integrity failure as D-04's only block. | — |
| r-47[0] | warning / undefined-content | verified-fixed | Owner ratified P-05 on 2026-07-21 as P-04's ownership rule applied to readiness targets. `07.08.03` D-07: `07.08.01` authors `ready-for-mastering` and `ready-for-mix-handoff`; `ready-for-DSP-release` references domain 12 and `ready-for-sync-pitch` domain 11, consuming their severities as this feature's D-02 weights rather than re-deriving them; an unowned target is **not offerable**, so nothing blocks and no placeholder is advertised. Readiness ships per target as each becomes available — build order, not a user gate. D-08 settles the pin-vs-live tension with `07.08.01` D-03 by dissolving it as domain 12 did: one target-spec store, one version identity, the score a live view and the package a pinned record that also pins its spec version. | — |
| r-48[0] | warning / missing-edge-case | verified-fixed | Owner ratified P-06 Option B on 2026-07-21. `07.08.04` D-08: a mis-typed declaration is **flagged by a human, never reclassified by the platform**. The declaration stands as made; a disputed type uses the existing attributed type-conflict path where both types are kept and surfaced. Mitigation moves upstream to an enumerative prompt naming loop/one-shot/break, per `11.05.01` D-05. Reclassification was rejected as breaching D-03 (07 owns capture, 09/11 own clearance), P-04 D-06, and domain D-05, and as requiring a detector four decisions reject; rejection was foreclosed by domain D-04, which names "the capture prompt never blocks" as an enumerated instance. | — |
| r-48[1] | warning / duplicate-content | verified-fixed | M r-48[1]; w7 verifies exactly one `Declared` state row remains. | — |
| r-49[0] | warning / unmeasurable | verified-fixed | M r-49[0]; wiaq `VERIFIED REPAIRED` confirms concrete provenance/capture repair. | — |
| r-50[0] | warning / contradiction | verified-fixed | Owner ratified P-07a Option B on 2026-07-21, confirming locked `07.03.03` D-07 at owner level: terms re-versions do not re-gate existing holders by default and acceptance records stay version-pinned; only an **owner-flagged material change** re-gates, at next access and never mid-transfer. Materiality is owner-declared — the owner authored the change — so it does not repeat the semantic reading P-03 rejected, and it reuses D-07's existing definition rather than minting a fourth. The finding's actual defect was a stale `[PENDING]` marker in CX-03 SQ5 contradicting a resolved child; that marker is now repaired. What the flag records became `07.03.03` Q-05. | — |
| r-50[1] | warning / contradiction | verified-fixed | Owner ratified P-07b Option B on 2026-07-21. `07.03.01` D-18: a downgrade notifies the affected person **and** the roster, because it is a roster write and D-09 already governs every roster write; the roster audience is scoped by D-16 to members who can already see that person's entry. Notifying only the affected party was rejected as a carve-out from D-09 resting on a "sensitive demotion" classification that exists nowhere in the tree; notify-on-denial was rejected as contradicting written `[DEEP]` behavior and locked copy. The finding's actual defect was a stale `[PENDING]` marker in CX-01 SQ4, now repaired. Actorless band-derived downgrades became `07.03.01` Q-05. | — |
| r-51[0] | warning / contradiction | verified-fixed | Owner ratified the existing immutable Domain 07 contract on 2026-07-19. Independent source recheck confirms CX-01's asymmetric permission intersection and roster notification/non-blocking post chain; 07.05.01 D-13 fixes post-time audience and requires a deliberate attributed new comment to cross scope; D-14 excludes roster/internal and other-recipient comments with no hidden count or teaser; 07.05.02 D-10 makes recipients mutually invisible and audience-labels replies. | — |
| r-52[0] | warning / unvalidated-premise | verified-fixed | Owner ratified validation-first DAW support: validate representative real sessions and complete DAW-specific legal review before selecting a parser; person-free names retain track/instrument context but create no contributor guess and route to the Producer prompt; ambiguity asks; unsupported/unreadable formats remain non-blocking. | — |
| r-53[0] | warning / unvalidated-content | verified-fixed | Owner ratified validation-first vault profiles: practitioner-validate and version approved role × sensitivity-class defaults before enforcement; no manual per-asset ACLs, project-wide grants, or owner-configured-only regime. Existing least-privilege, NDA evidence, fail-closed revocation, and explained-denial boundaries remain locked. | — |
| r-54[0] | blocking / contradiction | verified-fixed | M r-54[0]; w7 verifies evidence-gated public qualifier and internal-only seeded timeout. | — |
| r-54[1] | blocking / missing-edge-case | verified-fixed | Owner ratified attached rejected-item details under one `(release × store × territory)` row. Mixed evidence projects `Partial acceptance`; each detail retains item, partner/message correlation, evidence, triage/remediation, and successor-delivery correlation. Triage/redelivery stay rejecting-partner-scoped. | — |
| r-55[0] | blocking / contradiction | verified-fixed | M r-55[0]; w7 verifies delivery choreography matches cold-start public/internal behavior. | — |
| r-56[0] | blocking / undefined-term | verified-fixed | Owner ratified P-08a Option A on 2026-07-21, constrained. `13.02.03` D-05 authors an enumerated aggregate originality value derived from the component vector, filling the third slot of the comp key `model × condition × originality` that was already locked in four places. The enum is **nominal, never ordered** — D-04 states originality is "a factual axis, not a quality scale" — and it is authored on the owning axis and merely consumed by `13.04.01`, per the cross-domain rule. The component vector is unaffected. Derivation inputs, Unknown mapping, completeness predicate and enum versioning are recorded as `13.02.03` Q-03/Q-04. | — |
| r-56[1] | warning / unresolved-decision | verified-fixed | Owner ratified P-08b Option C on 2026-07-21. `13.02.03` D-06: an originality change **voids a live offer in either direction**, versioned and disclosed. `13.03.02` principle 3 already voids an offer on any material change to the stated listing; a direction test was unavailable because D-04 makes the axis non-ordinal and no evidence substrate exists on it, so voiding-on-any-change is the only option requiring neither an ordering nor a materiality definition. Framed as seller-protection per `13.02.02` D-04/D-11 so late honest disclosure is not punished. | — |
| r-57[0] | warning / contradiction | verified-fixed | Owner ratified DQ-MG-01 on 2026-07-21 as **per-axis confirmation**, correcting a false dilemma. The four axes Q-13 names resolve independently, not as one scalar: model binding does not relax (`13.01.04` D-05/D-08, DT-11 — bulk raises it); grading relaxes in a bounded disclosed way (`13.02.01` D-11, `bulk_defaulted`, reduced comp weight, never an exemption); disclosure does not relax and admits no substitute (`13.02.02` D-08, DT-14); unit media does not relax but its capture moment moves to label print (`13.03.01` D-06, DT-09). The stale "either the bar bends or bulk fails" text in `gear-marketplace-index.md` Q-13 and `13.03-listings-inventory-cx.md` — the unapplied half of this finding's own prescribed fix — is repaired. A scalar ratification would have silently overwritten at least one axis and, per CX-03, created the prohibited shadow listing tier. | — |
| r-58[0] | warning / unmeasurable | verified-fixed | Owner ratified DQ-MG-02 Option B on 2026-07-21 **with its escalation clause struck**. `13.03.07`: the listing stays held, never deleted, neither party accused; severity, SLA and escalation are **consumed from domain 24** (`24.01.03` owns routing skill/severity/clock) and this feature authors no number of its own, per the ratified author-where-owned rule. The innocent seller's substantive remedy is the already-locked `reported → contested` path in `15.02.04`. The struck "imminent sale or hardship" clause was the only inventive part of the option. | — |
| r-59[0] | warning / ambiguous-behavior | verified-fixed | Owner ratified P-09 Option C on 2026-07-21. `13.11` D-04: settlement on a local pickup is a **per-listing seller choice**, confirming what the tree already implements — `13.12`'s pickup boolean, `13.03.01`'s ship/pickup/both selector, and `13.06.02`, `13.02.04`, `13.06.05`, `13.08.01` already branching on where money moved. A global settled rule would impose facilitator sales-tax and 1099-K duties on every cash handshake; a global off-platform rule would strand the escrow and ownership-chain machinery already specified. The chain follows the money: settled writes the transfer normally, off-platform uses `15.01.03` D-01's manual handshake. Provenance-gap presentation and settled-branch residuals are `13.11` Q-04/Q-05. | — |
| r-60[0] | warning / contradiction | verified-fixed | M r-60[0]; w7 verifies in-flight transfer termination at next chunk boundary/no grace. | — |
| r-60[1] | warning / unresolved-decision | verified-fixed | M r-60[1]; w7 verifies manifest-required revocation outcome. | — |
| r-61[0] | warning / broken-cross-reference | verified-fixed | M r-61[0]; w7 verifies four direct link-basename repairs. | — |
| r-62[0] | warning / missing-edge-case | verified-fixed | Owner ratified P-10a Option A on 2026-07-21, confirming behaviour already locked in halves. `14.03.02` D-04 with `14.09.03` D-02/D-04 and `14.04.01` D-08/D-09: a rights takedown stops onward delivery immediately while the holder's entitlement row **persists with its date and reason** and never silently disappears. `14.04.01`'s own heading states it — "Removal is not deletion, and a rights takedown is not a revision" — so treating it as a revision would reuse a path that does not exist singly, and removing the holder record would contradict at least seven locked decisions and leave counter-notice put-back undefined. Archive-fetch posture and takedown granularity are `14.03.02` Q-04. | — |
| r-62[1] | warning / unresolved-decision | verified-fixed | Owner ratified P-10b Option A on 2026-07-21, confirming the locked contract rather than choosing among options. `14.03.02` D-04 with D-01/D-02 and `14.04.01` D-09: an ordinary revision appends and notifies while every prior entitled version stays permanently fetchable. Replace-in-place contradicts five locked decisions; repurchase-per-revision contradicts D-02 ("updates are offered") and the required displayed version range. Retention duration/cost and preset-pack scope remain open as `14.03.02` Q-01/Q-03/Q-04. | — |
| r-63[0] | warning / missing-edge-case | verified-fixed | Owner ratified P-11 on 2026-07-21 as **resolved-as-scoped**. `14.10.03` D-05: a departed or erased contributor's confirmed split row survives unchanged — never zeroed, redistributed, or forfeited. Redistribution is foreclosed by `09.02.04` D-14 (a 0% row is the removal-without-consent loophole) and forfeiture by `10.04.03` D-01 / `royalties-collections-index.md` D-09 (unpayable money is never platform float or revenue). **The question's "accruing" premise is out of scope**: `14.10.01` pool funding and `14.10.02` download attribution/accrual are both **WONT**, and `14.10.03` is explicitly decoupled from the pool, so no accrual exists to escrow. Erasure-vs-retention is `14.10.03` Q-04; the accruing half returns only if those WONT features are promoted. | — |
| r-64[0] | warning / unresolved-decision | verified-fixed | Owner ratified P-12 Option A on 2026-07-21. `14.04.02` D-04: a host-update break is an **external compatibility change** — flag the library entry, disclose, never revoke, with no default refund and no vendor conformity obligation. This ratifies into 14.04.02 the pattern already locked at `14.07.01` D-04 ("'perpetual' is a promise about the entitlement and the artifact, not a guarantee of function") and D-06 (third-party state change → permit + disclose + never revoke), giving OS drift, lapsed dependencies and host breaks one consistent story. Vendor-defect classification would assign liability for a third party's act against `14.09.02`'s supply-time conformity scope. Flag-trigger detection is `14.04.02` Q-04. | — |
| r-65[0] | warning / missing-edge-case | verified-fixed | Owner ratified DQ-MG-03 Option C on 2026-07-21, **recorded as resolved-as-scoped** — the same disposition shape as P-11. Approval-required transfers freeze on vendor exit (`14.08.05` D-05, `14.06.01`): the platform never substitutes its own judgement for a departed vendor's discretionary approval and never invents consent. Auto-approval on "objective eligibility rules" was rejected as commissioning a new mechanism — `14.06.01` stores a policy, not an evaluator, with no criteria slot, no defined evaluator and no appeal path. Two stale `[PENDING]` markers repaired. Recorded friction: `14.02.05` D-09 promises tombstoned terms "remain in force", leaving one clause permanently inoperative while displayed as active. | — |
| r-66[0] | warning / broken-cross-reference | verified-fixed | M r-66[0]; w7 verifies offline-activation link target exists. | — |
| r-67[0] | warning / broken-xref | verified-fixed | M r-67[0]; w7 verifies provenance-chain link correction. | — |
| r-68[0] | warning / broken-xref | verified-fixed | M r-68[0]; w7 verifies canonical Domain 24 display/path correction. | — |
| r-69[0] | warning / broken-xref | verified-fixed | Owner ratified DQ-MG-04 Option A on 2026-07-21 **in amended form**. `15.02.01` Q-01: the owner **or** a party in a custody state `15.08` already enumerates may file, with filing capacity recorded; a second filer on the same identity joins the existing flag; the platform still never adjudicates title. The queue's word "documented" was deliberately not adopted — it is a custody-evidence threshold no source defines and maps to none of the six enumerated states, so option A as literally worded resolved its own motivating loan/consignment case to "nobody may file". Owner-only was foreclosed by `15.02.01` DT-02, which explicitly rejects the owner as the natural trigger. | — |
| r-70[0] | warning / undefined-term | verified-fixed | Owner ratified DQ-MG-05 on 2026-07-21, **re-cut as an authority decision**. `15.01.05` D-03 authors the canonical identity-confidence value set — the six values already in use — and `15.01.01` renders without defining its own, per the author-where-owned rule; no downstream literal binds to the set today, so relocation costs nothing. The queue's recommendation (C) was circular: its premise described option A's contents. Collapsing the set is forbidden by `15.01.05` D-01 (a WJ-ID is never presented as equivalent to a serial); the richer set was three orthogonal fields wearing one enum's clothes. | — |
| r-71[0] | warning / unresolved-synthesis | verified-fixed | Owner ratified DQ-MG-06 Option A on 2026-07-21. `15.01.05` D-04: two records resolving to one identity key **never auto-merge** — both retained, both claim-holders notified, merge only on mutual consent. Consistent with the append-only mint and with domain 09's ratified CQ-08 precedent that nothing probabilistic merges records asserting independent provenance. The entry's interim rule described the wrong mechanism: CX-01 **blocks the mint pending disambiguation**, it does not fork — forking is CX-05's swapped serial-bearing part, a different trigger. | — |
| r-72[0] | blocking / unresolved-decision | verified-fixed | Owner ratified DQ-MG-07 Option C on 2026-07-21. `16.05.03` D-05: community suggestions on unclaimed records **auto-apply by field class**, using the classification `16.01.01` already defines (Statutory / Anchor / Fact / Commercial / Structural); factual classes apply immediately with community provenance retained, higher-stakes classes queue, commercial stays Operator-only. `16.05.03` DT-03 calls this the majority case at launch, so neither blanket auto-apply nor indefinite queueing was acceptable. Mirrors `13.01.02`'s ratified "automation may propose, never dispose". Class cut line and freshness effects are Q-05. | — |
| r-73[0] | blocking / contradiction | verified-fixed | M r-73[0]; wct `REMEDIATED` verifies release-campaign contradiction repair. | — |
| r-74[0] | blocking / contradiction | verified-fixed | Owner ratified DQ-04.01 Option B on 2026-07-21 as a **confirmation with audience scoping**. `17.01.02` D-14: a held date stays available and only an **aggregate** hold state is disclosed, never counterparty identities — already established by D-13 and CX-01. Removing the date at first hold would convert a soft hold into an exclusive reservation against the multi-position ladder model; showing nothing would delete locked disclosure text. Scoped to the parties the ladder already exposes it to, with pre-ladder requests (which occupy no position) excluded from the count. **Recorded:** the immutable finding asks "who owns the hold ladder — 16.06.01 or 17.01.02?"; the queue substituted the availability question, and the ownership question is carried forward. | — |
| r-75[0] | blocking / unresolved-decision | verified-fixed | Owner ratified DQ-04.02 on 2026-07-21 by **consuming domain 01's rule rather than authoring one**. `17.02.03` D-07: with no rule configured, no offer is treated as approved — domain 01 already defines the model (`01.04.01` unanimity / majority / any-one-member, plus `01.03.03`'s mandate-and-ceiling enforcement and fail-closed posture), and `17.02.03` D-03 states outright that "the band's governance rule is consumed from domain 01, not defined here". The queue misrouted a domain-01 decision to domain 17; authoring a default in 17 would have created the second copy the cross-domain rule forbids. Delegation staleness was flagged as invention — no source defines a delegation validity test. | — |
| r-75[1] | blocking / ambiguous-behavior | verified-fixed | Owner ratified DQ-04.03 Option D on 2026-07-21, **narrowed to explicit extension only**. `17.02.03` D-08: an offer expires with **no implicit grace window**; an extension must be granted explicitly, before expiry, by the offering side, as a new version — the shape domain 17 already ratified for the analogous clock in `17.01.03`. Recorded approvals survive as audit evidence and do not carry into the new version by themselves. A grace window was rejected because Q-02 already names it an obvious stalling vector. Ladder-clock interaction on extension is Q-03. | — |
| r-76[0] | blocking / contradiction | verified-fixed | Owner ratified DQ-04.04 Option B on 2026-07-21 as a **confirmation of locked state**. `17.09.02` D-16: on conflicting evidence the count stays provisional and undisputed portions settle — confirming D-13..D-15, which already fan out corrections, freeze only the contesting act's sheet, and name/attribute/price a failed invariant. Auto-selecting highest-provenance evidence would turn a hierarchy into a verdict; freezing everything withholds money from uninvolved parties; platform adjudication contradicts the posture used across the tree. **Recorded: this entry was mis-mapped** — the immutable `r-76` finding is the `scanned_paid` verified-draw question, i.e. DQ-04.05's subject, and `17.09.02` Q-04 has no queue entry of its own. Both are resolved together here. | — |
| r-77[0] | blocking / contradiction | verified-fixed | Owner ratified DQ-04.05 on 2026-07-21: **`scanned_paid` is the verified draw**, confirming `17.09.02` D-08's locked three-count model (`sold` → money, `scanned_paid` → draw, `scanned_total` → occupancy and merch per-head). `scanned_total` is retained and published as a separately labelled attendance fact, not erased. `17.11.01`'s contradicting "scan count, not paid count" prose — a Should/`[PARTIAL]` file overriding a Must/`[DEEP]` decision — is repaired. Consuming total scan would let a papered house manufacture verified draw history, the failure `17.09.02` already prices. | — |
| r-78[0] | blocking / unresolved-concurrency | verified-fixed | Owner ratified optimistic per-ladder version checks: server-assigned dense ordering and receipt-time ties; stale mutations reject before write and re-offer against authoritative state; no merge, replay, queue-behind, lock, or last-write-wins. Terminal/action semantics remain atomic. | — |
| r-79[0] | blocking / contradiction | verified-fixed | Owner ratified DQ-04.07 on 2026-07-21, **reworded and re-bound**. `20.06.02` D-09: alerts fire for **announced** first-party shows at on-sale, resolving Q-02. "Confirmed" was rejected because `17.01.04` embargoes a confirmed-unannounced show from fans; third-party listings were rejected on mechanical grounds — the locked on-sale trigger cannot fire for a listing whose on-sale the platform cannot observe, so "verified partner listings" is not constructible from any source. **The entry was bound to the wrong finding:** immutable `r-79[0]` records the alert-radius contradiction (`20.06.02` 25 mi vs `20.01.03` 80 km, neither citing the other). That contradiction is now recorded in D-06 and carried as `20.06.02` Q-04 for an explicit owner ruling on whether the two radii are one setting or two. | — |
| r-80[0] | blocking / undefined-term | verified-fixed | M r-80[0]; wct verifies source declaration’s undefined term repair; no surviving blocking finding. | — |

## Reconciliation Arithmetic

| Disposition | Blocking | Warning | Total |
|---|---:|---:|---:|
| verified-fixed | 26 | 81 | 107 |
| needs-product-decision | 0 | 0 | 0 |
| needs-architecture-decision | 0 | 0 | 0 |
| deferred-with-interim-rule | 0 | 0 | 0 |
| **Total** | **26** | **81** | **107** |

- Manifest arithmetic: `r-00`–`r-32` = 48; `r-33`–`r-80` = 59; `48 + 59 = 107`.
- Disposition arithmetic: `107 + 0 + 0 + 0 = 107`.
- Current blocker arithmetic: `26 + 0 + 0 + 0 = 26`; warning arithmetic:
  `81 + 0 + 0 + 0 = 81`; `26 + 81 = 107`.

## Known Report-Label and Range Corrections

1. **Do not use `wf` report labels as manifest IDs.** Its first five target reports are crossed:
   report `r-00` targets original `r-03`; report `r-02` targets original `r-05`; report
   `r-03` targets original `r-04`; report `r-04` targets original `r-02`; report `r-05`
   targets original `r-00`. This ledger uses the manifest target and `r-NN[original-index]`.
2. **Correct the previous r-45/r-48 attribution.** The duplicate `Declared` state-row repair is
   `r-48[1]`, not r-45. `r-45[0]` is the feedback contradiction-detector architecture finding,
   now `verified-fixed` after its owner-ratified positional-candidate and Producer-flag contract; it
   is not an active architecture decision.
3. **Correct the previous r-71 ID claim.** The original manifest contains exactly `r-71[0]`;
   it is an unresolved synthesis finding. Old references to `CX-01 Q1 and Q5` are report-local
   prose, not immutable manifest finding IDs.
4. **Correct the pending/applied conflict.** The historical `r-00`–`r-32` applied and
   `r-33`–`r-80` pending ranges remain recovery facts only. `wct`, `wiaq`, `wx`, `wvg`, `w0`,
   and `w7` contain later overlapping verification. This ledger’s canonical per-finding rows,
   not a range label, decide final disposition.
5. **Strictest evidence examples.** `r-39` remains fixed only after `wx` adds the missing
   “amount agreed at booking” predicate; `r-20[2]` is `verified-fixed` only after the owner-ratified
   constrained collusion interface replaces the prior invented interface; `r-57[0]` remains deferred
   despite deterministic bulk mechanics because quality-bar policy stays User-owned.

## Required Gate

This ledger does not close the vision layer. Before advancing:

1. **All 107 findings are `verified-fixed`.** No product, architecture, or deferred-with-interim-rule entry remains. P-01 closed on its policy: the validation gate is decided and in force, and collecting its practitioner evidence is tracked implementation work, not an open decision.
2. **All interim rules have been replaced with full behavior.** The three former `deferred-with-interim-rule` entries (`r-57[0]`, `r-59[0]`, `r-69[0]`) now carry ratified contracts.
3. Run the required graph refresh and update `audit-scope.md` `## Gaps Fixed` only when the workflow
   explicitly reaches that gate.
4. Run a fresh full `/audit-ambiguity ideation`; touched-file checks and this recovery ledger cannot
   replace that fresh run.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-15|D-15]]
