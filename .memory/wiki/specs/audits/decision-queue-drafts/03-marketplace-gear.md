# Marketplace, Gear & Registry Decision Queue — Draft

> **Status:** DRAFT — UNRATIFIED. This document presents owner decisions; it does not select policy, amend source specifications, or change final ledger dispositions.
>
> **Authority discipline:** Every row retains the canonical identity and classification from the Final Per-Finding Disposition Ledger in `../remediation-state.md`. “Interim rule” repeats only source-locked current behavior. A recommendation is explicitly **UNRATIFIED**.

## Scope

| Canonical finding | Ledger classification | Queue treatment |
|---|---|---|
| r-57[0] | warning / contradiction — deferred-with-interim-rule | Interim-replacement entry |
| r-58[0] | warning / unmeasurable — needs-product-decision | Decision entry |
| r-65[0] | warning / missing-edge-case — needs-product-decision | Decision entry |
| r-69[0] | warning / broken-xref — deferred-with-interim-rule | Interim-replacement entry |
| r-70[0] | warning / undefined-term — needs-product-decision | Decision entry |
| r-71[0] | warning / unresolved-synthesis — needs-product-decision | Decision entry |
| r-72[0] | blocking / unresolved-decision — needs-product-decision | Decision entry |

No entries merge: none of these rows ask the identical policy question. Shared registry context across r-69, r-70, and r-71 does not make filing standing, identity vocabulary, and collision disposition identical policy.

---

## DQ-MG-01 — Bulk-import quality bar

- **Affected finding:** r-57[0]
- **Classification:** warning / contradiction — **deferred-with-interim-rule**
- **Owner / stage:** Product owner; `/ideate-validate` (domain 13 Q-13).
- **Question:** Which quality bar applies to bulk-imported gear listings before individual inspection?

| Option | Pros | Cons |
|---|---|---|
| A. Keep the normal per-unit quality bar; do not publish until each unit is completed | Strongest buyer evidence and uniform listing quality | Blocks large existing inventories and defeats bulk-import onboarding value |
| B. Allow disclosed, lower-evidence bulk publication until label print or unit handling | Preserves catalog throughput while telling buyers what is missing | Creates a two-tier listing experience and requires trust-weight reduction |
| C. Allow bulk publication only for specified seller classes or catalog-matched units | Limits low-evidence publication to more controlled cases | Adds eligibility policy and may exclude legitimate small sellers |

**UNRATIFIED recommendation:** B — retain the existing disclosure-first interim direction because sources already preserve matching gates, visible quality limits, and later per-unit completion. The owner must still ratify, revise, or replace it.

- **Current interim rule:** Group matching by proposed candidate and normalized title; apply the Operator’s seller-set per-upload grade with `bulk_defaulted: true`; publish grade as bulk-applied; disclose `Condition not itemised` and `Unit not photographed`; never template a flaw answer; complete disclosure/media when the seller holds the unit at label print. This rule does **not** decide whether the final quality bar may relax.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-57[0]`.
  - `../../ideation/13-gear-marketplace/13.03-listings-inventory/13.03.04-bulk-listing-channel-sync.md`, `Happy Path` steps 2–6; `Edge Cases / Failure Modes`, “Bulk grade for 400 imported rows” and per-item disclosure/media row; `D-05`; `Q-01`.
  - `../../ideation/13-gear-marketplace/gear-marketplace-index.md`, Q-13.
  - `../../ideation/13-gear-marketplace/13.01-canonical-gear-catalog/13.01.04-listing-model-matching.md`, D-01, D-05, D-08.
  - `../../ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.01-condition-grading-scale.md`, D-11.
  - `../../ideation/13-gear-marketplace/13.02-condition-originality-disclosure/13.02.02-mandatory-flaw-disclosure.md`.
  - `../../ideation/13-gear-marketplace/13.03-listings-inventory/13.03.01-listing-creation-media-demo.md`.

---

## DQ-MG-02 — False-positive stolen-serial review promise

- **Affected finding:** r-58[0]
- **Classification:** warning / unmeasurable — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What review promise applies when a stolen-serial hit is plausibly false?

| Option | Pros | Cons |
|---|---|---|
| A. Assign a high severity with a fixed expedited SLA and mandatory seller/reporter updates | Gives innocent sellers a predictable remedy and makes the hold observably non-accusatory | Needs staffing capacity and an explicit urgency trade-off against other queues |
| B. Assign a standard severity/SLA with escalation only after evidence of imminent sale or hardship | Uses one moderation baseline and reserves urgent capacity | May feel indistinguishable from accusation for ordinary innocent sellers |
| C. Release provisionally after a short evidence window while preserving the registry flag | Minimizes seller blockage | Can expose buyers and reporters to an unsafe or disputed transaction |

**UNRATIFIED recommendation:** A — the documented harm is an innocent seller blocked by another person’s mistyped report; a bounded and communicated path best preserves the existing “never an accusation” rule. Severity and timing remain owner choices.

- **Current interim rule:** A hit holds the listing rather than deleting it; both parties are informed and neither is accused. Listing remains `Hit pending review`. Source says only “Fast human resolution path”; no source assigns severity, SLA, escalation owner, or update deadline.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-58[0]`.
  - `../../ideation/13-gear-marketplace/13.03-listings-inventory/13.03.07-stolen-serial-screening.md`, `Edge Cases / Failure Modes` (serial hit and false-positive rows), `States` (`Hit pending review`), `Cross-Cut Notes`, D-01, and Open Questions.
  - `../../ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md`, `Behavior`: routing requires skill, severity, and clock; severity sets SLA; Q-04 retains timing values for later security/counsel confirmation.

---

## DQ-MG-03 — Used-licence transfers after vendor exit

- **Affected finding:** r-65[0]
- **Classification:** warning / missing-edge-case — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What happens to a used-licence transfer requiring vendor approval after that vendor exits?

| Option | Pros | Cons |
|---|---|---|
| A. Platform substitutes for the departed vendor and approves transfers under recorded terms | Keeps the secondary market functioning and honors continuity expectations | Makes the platform a decision-maker under vendor-authored policy |
| B. Permit transfers automatically when recorded terms contain objective eligibility rules; otherwise freeze | Limits substitution to rules the vendor already accepted | Produces unequal outcomes and leaves some buyers with a permanent freeze |
| C. Permanently freeze all approval-required transfers after exit | Avoids the platform interpreting missing consent | Destroys the second-hand market for affected catalogues |

**UNRATIFIED recommendation:** B — it preserves continuity where the departed vendor’s own recorded terms make the decision mechanical without pretending the platform can invent consent for discretionary policies.

- **Current interim rule:** On ordinary vendor exit, delist new sales but leave artifacts, all versions, entitlements, and downloads intact. For approval-required transfers, outcome is pending; no transfer-continuity policy is selected.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-65[0]`.
  - `../../ideation/14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.05-vendor-exit-licence-continuity.md`, `Behavior`, `Happy Path`, and `Edge Cases / Failure Modes` row “Vendor’s transfer policy required their approval”.
  - `../../ideation/14-digital-goods-marketplace/14.06-used-licence-transfer/14.06.01-vendor-transfer-policy-registry.md`.
  - `../../ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.03-licence-portal-purchased-library.md`, D-03.

---

## DQ-MG-04 — Theft-report filing standing

- **Affected finding:** r-69[0]
- **Classification:** warning / broken-xref — **deferred-with-interim-rule**
- **Owner / stage:** Product owner; `/ideate-validate` (15.02.01 Q-01).
- **Question:** Who may file a theft report when ownership and physical custody differ?

| Option | Pros | Cons |
|---|---|---|
| A. Owner or documented holder/custodian may file, with filing capacity recorded | Lets the person who discovers loss act quickly while preserving evidence context | Needs defined evidence for custody and processes for conflicting claims |
| B. Legal owner only may file | Clear title-oriented authority | Fails common loan, consignment, and venue-custody loss cases |
| C. Any witness may file a provisional report | Maximizes rapid reporting | Creates high abuse and duplicate-report pressure |

**UNRATIFIED recommendation:** A — matches the existing “owner/holder may file” interim behavior and records capacity without choosing title adjudication. Standing evidence and conflicts still require product policy.

- **Current interim rule:** An owner or holder may file; the flag records filer and capacity; a second filer on the same identity joins the existing flag rather than creating a duplicate. The platform surfaces the flag and does not adjudicate title.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-69[0]`.
  - `../../ideation/15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.01-theft-report-serial-flagging.md`, `Edge Cases / Failure Modes` owner/holder row, `Cross-Cut Notes`, D-01–D-04, and Q-01.
  - `../../ideation/15-gear-registry-ownership/15.08-custody-loans-consignment.md`, Q-01.
  - `../../ideation/15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02-stolen-gear-registry-recovery-index.md`, Q-04 is not standing authority; corrected ledger routing is Q-01 above.

---

## DQ-MG-05 — Canonical gear identity-confidence vocabulary

- **Affected finding:** r-70[0]
- **Classification:** warning / undefined-term — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** Which canonical confidence levels define a gear record’s identity?

| Option | Pros | Cons |
|---|---|---|
| A. Adopt the current render vocabulary as the canonical set | Aligns registry display and downstream contracts quickly | May prematurely turn a presentation proposal into policy |
| B. Define a smaller canonical set with evidence details held separately | Simpler buyer-facing meaning and less enum churn | Can conceal meaningful distinctions such as reconstructed versus typed serials |
| C. Define a richer evidence-derived set, including serial state, era certainty, and non-serial discriminator state | Represents provenance faithfully and supports nuanced trust decisions | Harder to explain, implement, and keep stable across record types |

**UNRATIFIED recommendation:** C — identity evidence is central to registry value and current sources already distinguish serial confirmation, typed/reconstructed values, era uncertainty, and non-serialized resolution. Owner must define the actual stable set and semantics.

- **Current interim rule:** The record renders identity confidence separately from claim strength. The render-side vocabulary is proposed only; 15.01.05 owns resolution logic and the authoritative value set. No canonical enum is ratified.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-70[0]`.
  - `../../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.01-gear-record-serial-identity.md`, `Behavior`, “Identity confidence and claim strength are orthogonal,” rendering table, and cross-cut notes.
  - `../../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.05-non-serialized-contested-identity.md`, identity-resolution states and Q-01.
  - `../../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-index.md`.

---

## DQ-MG-06 — Collision disposition for one identity key

- **Affected finding:** r-71[0]
- **Classification:** warning / unresolved-synthesis — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What happens when two gear records resolve to one identity key?

| Option | Pros | Cons |
|---|---|---|
| A. Never auto-merge; retain both records, notify both claim-holders, and merge only with mutual consent | Protects independently asserted histories and avoids irreversible mistaken conflation | Leaves duplicates visible and requires a later resolution path |
| B. Keep the first-minted record and archive later records automatically | Deterministic and minimizes duplicate public records | Privileges timing over evidence and can erase legitimate independent provenance |
| C. Auto-merge only when high-confidence identity evidence meets a defined threshold | Reduces duplicates when evidence is strong | Threshold errors can merge distinct instruments and make recovery difficult |

**UNRATIFIED recommendation:** A — existing collision facts favor non-destructive treatment; consent-based merge preserves append-only provenance while leaving policy details explicit.

- **Current interim rule:** No final collision ownership/merge policy is selected. Collision facts require a fork rather than silent continuation; both resulting record chains receive notification. Existing sources state collision handling must not be auto-resolved.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-71[0]`; Known Report-Label and Range Corrections item 3 confirms the canonical identity is only `r-71[0]`.
  - `../../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-cx.md`, CX-01 shared-state conflict, trigger chain, notification fan-out, and state-transition collision facts.
  - `../../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.01-gear-record-serial-identity.md`, mint/append-only behavior and duplicate-registration mitigations.
  - `../../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.05-non-serialized-contested-identity.md`.

---

## DQ-MG-07 — Suggested edits on unclaimed venue and studio records

- **Affected finding:** r-72[0]
- **Classification:** blocking / unresolved-decision — **needs-product-decision**
- **Owner / stage:** Product owner; `/ideate-validate`.
- **Question:** What happens to a community suggestion for an unclaimed record?

| Option | Pros | Cons |
|---|---|---|
| A. Auto-apply eligible factual edits with unclaimed-community provenance | Keeps the launch registry current when no owner exists and preserves source transparency | Exposes facts to vandalism or inaccurate edits until challenged |
| B. Queue every edit until an owner or reviewer acts | Strongest review control | Leaves the unclaimed majority stale indefinitely and defeats community correction |
| C. Auto-apply only field classes meeting a trust/evidence threshold; queue the rest | Balances registry freshness with higher protection for consequential facts | Requires threshold, field classification, and reviewer-path policy |

**UNRATIFIED recommendation:** C — current sources define per-field provenance and already exclude commercial fields; a bounded, evidence-aware rule can keep factual records alive without accepting unrestricted changes. Threshold and eligible field classes remain owner decisions.

- **Current interim rule:** Provenance is retained per field. Suggestions on claimed records queue for the Operator. On unclaimed records, a suggestion may apply immediately and is marked `Community suggestion, unreviewed on an unclaimed record`; commercial fields remain Operator-only. The exact unclaimed-record policy is not selected.
- **Exact sources:**
  - `../remediation-state.md`, Final Per-Finding Disposition Ledger, `r-72[0]`.
  - `../../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.03-suggested-edits-field-provenance.md`, Role Lens, `Behavior`, provenance ranking, `Edge Cases / Failure Modes`, and Q-04.
  - `../../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05-curation-provenance-data-integrity-index.md`, D-03, D-04, and Role Matrix.
  - `../../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.01-place-data-seeding-ingestion.md`, D-02.
  - `../../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.04-owner-vs-community-conflict-resolution.md`.

---

## Exact Coverage Mapping

| Ledger non-fixed row | Queue entry | Treatment | Classification preserved |
|---|---|---|---|
| r-57[0] | DQ-MG-01 | Interim-replacement entry | warning / contradiction — deferred-with-interim-rule |
| r-58[0] | DQ-MG-02 | Decision entry | warning / unmeasurable — needs-product-decision |
| r-65[0] | DQ-MG-03 | Decision entry | warning / missing-edge-case — needs-product-decision |
| r-69[0] | DQ-MG-04 | Interim-replacement entry | warning / broken-xref — deferred-with-interim-rule |
| r-70[0] | DQ-MG-05 | Decision entry | warning / undefined-term — needs-product-decision |
| r-71[0] | DQ-MG-06 | Decision entry | warning / unresolved-synthesis — needs-product-decision |
| r-72[0] | DQ-MG-07 | Decision entry | blocking / unresolved-decision — needs-product-decision |

**Coverage assertion:** exactly seven rows covered — `r-57[0]`, `r-58[0]`, `r-65[0]`, `r-69[0]`, `r-70[0]`, `r-71[0]`, and `r-72[0]`. No fixed ledger row is included; no source specification was changed.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-02|D-02]]
