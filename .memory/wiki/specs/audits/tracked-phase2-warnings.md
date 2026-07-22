# Tracked Phase-2 Ambiguity Warnings

> Deferred from the 2026-07-18 ideation ambiguity audit. These are WARNING-severity findings on
> phase-2 domain features (not v1/v1.5). Each is resolved when its domain is deepened and specced
> (`/write-be-spec` / `/write-fe-spec`), where the feature is re-audited. Fixing now would polish
> content that changes before it is built. Total: 224 warnings.

## Domain 03 (8)

| File | Category | Fix |
|---|---|---|
| 03.01.02-professional-connections.md | contradiction | Correct Happy Path step 3 to state the note is mandatory (matching D-03), removing the 'optional / likely mandatory' hedge so the three sections agree |
| 03.01.02-professional-connections.md | unmeasurable | State a concrete interim flat-quota default (e.g. N requests per rolling period), noting it is provisional pending Q-01's model decision — mirror the  |
| 03.01.02-professional-connections.md | unresolved-decision | Assign the expiry period a proposed value + owner + target stage (e.g. '14 days, proposed, /write-be-spec'), so it is a tracked deferral rather than a |
| 03.01-connections-follows-endorsements-cx.md | contradiction | Reconcile CX-02 synthesis Q2 to cite 03.01.01 D-12 (no auto-follow) as resolved, per the 'Step 6 must reconcile the CX file' note in 03.01.01's cross- |
| 03.01-connections-follows-endorsements-cx.md | unresolved-decision | Note explicitly that CX-03 is gated on 03.01.03's Won't/Q-04 status so it reads as intentionally parked rather than unfinished. |
| 03.02.01-feed-composition-event-sources.md | undefined-term | This is a legitimate upstream gap (Q-01, tracked). Keep, but add a note that the alert-scope enum (03.01.01 D-05/Q-01) and this catalogue are the same |
| 03.04.04-reachability-inbound-policy.md | contradiction | Resolve Q-04 by adopting 03.04.01 D-03 (fail closed on unknown) as the launch behavior, narrowing Q-04 to only the architecture-level open/closed tuni |
| 03.06.01-scene-definition-membership.md | unresolved-decision | Keep Q-06 tracked, but flag it as a hard prerequisite for the D-06 evidence ladder (not just a risk) so /ideate-validate verifies the 02/07 location c |

## Domain 04 (6)

| File | Category | Fix |
|---|---|---|
| 04.02-discovery-matching-alerts-cx.md | unresolved-decision | Fold 04.02.04's replay resolution into CX-03 Q5; either synthesise CX-05's permission/state questions or mark them explicitly deferred to the (surface |
| 04.01.02-targeting-distribution-controls.md | missing-edge-case | Resolve Q-02 (confidentiality as a first-class flag separate from the rung) and the blocked-target disclosure rule, or explicitly re-route them to a s |
| 04.04.02-shortlist-multi-reviewer-scoring.md | unresolved-decision | Set a shippable default attribution mode (recommend anonymous-to-each-other, per the social-explosiveness argument in parent Q-03) and a default non-c |
| 04.03-submission-audition-cx.md | unmeasurable | Either synthesise the answerable halves or annotate that these questions are blocked on the deferred blind-review feature (04.03.04) and the evidence/ |
| 04.04-triage-shortlist-decisioning-cx.md | unresolved-decision | Fold 04.04.03's three-grants resolution into CX-02 Q3 (the promised Step-6 synthesis that never landed). |
| 04.05.03-won-opportunity-handoff.md | document-integrity | Strip the trailing '</content>' / '</invoke>' lines from 04.05.03 and 04.03.01. |

## Domain 06 (3)

| File | Category | Fix |
|---|---|---|
| 06.01.02-lesson-packages-credits-rate-cards.md | contradiction | Update 06.01.02 edge 35 to match 06.01.03's resolution — both-no-show is a no-fault return, not indefinite limbo — and delete the stale 'pending 06.01 |
| 06.01.03-cancellation-makeup-no-show-policy.md | broken-cross-reference | Correct the citation in the 'Nobody joins a remote lesson' edge case from (D-03) to (D-11 / DT-09). A spec-writer following the citation lands on the  |
| 06.03.03-practice-logging-streaks-goals.md | undefined-mechanism | Specify the goal object: enumerate goal types (exam-grade, tempo-target, date-bound, freeform) and the progress source per type (exam goals read 06.09 |

## Domain 08 (6)

| File | Category | Fix |
|---|---|---|
| 08.05.04-session-attendance-provenance.md | unresolved-decision | Resolve which feature owns the single close prompt (with domain 02 in the room), or explicitly state that this is escalated past ideation with a named |
| 08.05.01-local-first-multitrack-capture.md | undefined-term | Define the source of the scheduled-end time (booking/05, session-creation, or absent) and specify the prompt behaviour when no scheduled end exists (e |
| 08.05.01-local-first-multitrack-capture.md | ambiguous-behavior | Either resolve the assignment authority now, or make the edge row defer explicitly to Q-04 rather than asserting 'Operator/Producer assigns' (which re |
| 08.03.01-hifi-monitor-stream-quality-contract.md | missing-edge-case | State in the Happy Path / States that degradation-policy selection is a mandatory step of stream creation (or gate 'Verifying'→'Live' on it), so the ' |
| 08.07-overdub-mode.md | unmeasurable | Provide at least provisional per-instrument residual thresholds (or a single conservative default) sourced in a MUST/SHOULD artifact, rather than leav |
| 08.03-remote-monitoring-session-attendance-cx.md | unresolved-decision | Resolve the active/passive listener-join notification (CX-01 Q4), and the Medium-confidence CX-03/CX-04 syntheses whose questions are still marked [PE |

## Domain 10 (5)

| File | Category | Fix |
|---|---|---|
| 10.09-distribution-calendar-money-in-flight.md | unmeasurable | State the tolerance basis: e.g. per-(society × income-type) grace period sourced from the same hand-maintained calendar as the distribution date (maki |
| 10.02.05-unmatched-line-exception-queue.md | undefined-term | Define how the 'plausible window' is bounded for a period-less line (e.g. the earliest-to-latest usage span implied by the statement's distribution cy |
| 10.03.03-advances-recoupment-position.md | unmeasurable | Specify the run-rate basis (e.g. trailing N distribution cycles or trailing 12 months of earned-in-scope amounts), how it handles sources with irregul |
| 10.05.01-black-box-unclaimed-search.md | undefined-term | Define the alarm window (a fixed lead time such as 90 days, or a per-pool fraction of the statutory holding period), and note whether it is uniform or |
| 10.05.01-black-box-unclaimed-search.md | undefined-term | Define what makes graph growth 'material' enough to re-sweep (e.g. any new attested credit or ISRC, since those are the signal classes that change can |

## Domain 11 (7)

| File | Category | Fix |
|---|---|---|
| 11.01.05-dual-licence-coordination.md | contradiction | Reconcile explicitly: state in 11.01.05 that a *hold* is a waitable reservation (notify-me queue is legitimate) whereas a live exclusive *licence* is  |
| 11.01.02-supervisor-search-reference-matching.md | broken-cross-reference | Correct the path to 11.03.02-quote-requests-negotiation.md (the same file is referenced correctly elsewhere in this document's Cross-Cut Notes). |
| 11.01-sync-licensing-cx.md | unresolved-decision | Resolve the PENDING (recommend auto-release with notification, consistent with the domain's 'perishable state warns its owner' pattern P-01) or re-rou |
| 11.08-licence-instrument-lifecycle-cx.md | unresolved-decision | Answer Q4 explicitly — the file itself notes tracking verifiers 'turns an anonymous check into a surveillance record', which strongly implies stateles |
| 11.04-licensing-policy-preferences-cx.md | stale-marker | Update CX-01 synthesis Q4 to cite 11.04.02 D-06 as the resolution (audience-scoped naming: co-owners yes, buyer never) rather than leaving a stale PEN |
| 11.05-sample-derivative-clearance-cx.md | missing-edge-case | Either resolve by pointing at 11.02.03's derivation-graph walk (which already handles chains/cycles) or explicitly scope nested-interpolation handling |
| 11.08.01-licence-scope-grammar.md | structural | Remove the stray `</content>` line at the end of the file. |

## Domain 12 (6)

| File | Category | Fix |
|---|---|---|
| 12.03.02-per-store-delivery-status.md | missing-edge-case | Add an explicit board mapping for 12.02.03's `Held` state (e.g. a `Held` row or a `Sent · held` qualifier carrying the honest attribution from 12.02.0 |
| 12.01.05-label-copy-distributor-of-record.md | unresolved-decision | Either route this to a named stage with an owner (it is an org-governance question — 01/09, same shape as 12.05.01 Q-01 co-owned takedown) as a proper |
| 12.04.02-editorial-pitch-windows.md | ambiguous-behavior | State the intended default (e.g. a date move that keeps the pitch inside the store's window holds it; a move outside the window withdraws it and surfa |
| 12.04.01-release-date-lead-time.md | missing-edge-case | Specify the cold-start behaviour for rejection headroom explicitly: either suppress E2 with an honest 'we can't size safe headroom for {partner} yet'  |
| 12.04.01-release-date-lead-time.md | missing-edge-case | Add the named-delivery-contact requirement to 12.04.01's delivery-lock preconditions and Scheduled/Set states, cross-referencing 12.03.02 D-15, so the |
| 12.01-release-builder-cx.md | missing-synthesis | Either add a brief Details block for CX-04 and CX-06 (even one line per synthesis question, as CX-17 does in the domain CX file with '(Medium — abbrev |

## Domain 16 (26)

| File | Category | Fix |
|---|---|---|
| 16.05.03-suggested-edits-field-provenance.md | ambiguous-behavior | Decide 16.05.03 Q-04 (ignored-suggestion timeout) jointly with 16.05.04's escalation model; state a concrete window or an explicit 'never auto-applies |
| 16.05.03-suggested-edits-field-provenance.md | unresolved-decision | Specify equal-class arbitration (16.05.07 D-12 resolves same-class ties at MERGE — reuse that per-class logic here: community ties resolve by freshnes |
| 16.05.03-suggested-edits-field-provenance.md | unresolved-decision | Resolve 16.05.03 Q-03: enumerate the field classes a Fan may suggest (proposed: identity/location facts only, never spec/commercial). |
| 16.06.07-rate-cards-inclusions-extras.md | unresolved-decision | Escalate 16.06.07 Q-01 to /ideate-validate as an owner decision with a stated default (proposed: non-binding at launch, quote captured onto the reserv |
| 16.06.07-rate-cards-inclusions-extras.md | undefined-term | Resolve 16.06.07 Q-02 (controlled vs free-form extras) — a data-model decision that gates the price-comparison capability. |
| 16.06.09-recurring-bookings-lockout-tenancy.md | unresolved-decision | Resolve 16.06.09 Q-01 at /ideate-validate. If 'represent only', state that lockout billing/eviction are explicitly out of scope; if 'operate', it pull |
| 16.06.09-recurring-bookings-lockout-tenancy.md | missing-edge-case | Resolve 16.06.09 Q-03: define whether an indefinite series can be indefinitely held, or reuse 16.06.01's hold-challenge model for standing recurring c |
| 16.06.09-recurring-bookings-lockout-tenancy.md | contradiction | Back-annotate 16.06.09 Q-04 / the edge case as resolved by 16.06.02 D-07 (no interaction by construction). |
| 16.06.09-recurring-bookings-lockout-tenancy.md | broken-reference | Fix the link to `16.06.04-waitlist-backfill.md`. |
| 16.06.05-compound-multi-resource-booking.md | unresolved-decision | Resolve the 05↔16 compound ownership (16.06.05 Q-01/Q-04) at /ideate-validate with a cross-check to domain 05; at minimum state whether the cross-doma |
| 16.06.05-compound-multi-resource-booking.md | contradiction | Back-annotate this edge case as resolved by 16.06.03 D-16/CX-04 (blended ladder over the compound). |
| 16.06.05-compound-multi-resource-booking.md | unresolved-decision | Answer the mobile-asset-allocation fork once for 16.03.02 Q-01 / 16.01.02 Q-05 / 16.06.05 Q-02 (they explicitly must be answered together) via a manda |
| 16.05.04-owner-vs-community-conflict-resolution.md | unresolved-decision | Escalate 16.05.04 Q-01 (the field-class→policy map) to /ideate-validate as the owner values decision it is; enumerate the policy for every field class |
| 16.05.04-owner-vs-community-conflict-resolution.md | unmeasurable | Resolve 16.05.04 Q-02: state the corroboration threshold and whether reaching it auto-flips the field or escalates to 24 (16.05.06 D-12 supplies the i |
| 16.07-spec-conformance-check-rider-room.md | contradiction | Back-annotate 16.07 Q-02 as resolved by 16.02.02 D-05; update the 'Spec is free text' edge case to reference the value/caveat/note triple. |
| 16.07-spec-conformance-check-rider-room.md | unresolved-decision | Confirm 16.07 Q-01/Q-04 with domain 18 (rider structure + ownership of the advance workflow) during /create-prd or /write-be-spec; state the assumed r |
| 16.06.02-external-calendar-sync.md | broken-reference | Fix both links to the actual filenames. |
| 16.01.03-structured-photo-checklist-virtual-tours.md | missing-edge-case | Resolve 16.01.03 Q-02 (automated shot-type validation feasibility) at /create-prd and state the interim control explicitly (community flagging, once 1 |
| 16.01.03-structured-photo-checklist-virtual-tours.md | unresolved-decision | Resolve 16.01.03 Q-01 jointly with 16.05.04's owner-vs-community policy — it is the media instance of the same conflict. |
| 16.01.06-licences-insurance-statutory-records.md | ambiguous-behavior | Resolve 16.01.06 Q-02 (missing-hirer-PLI: block/warn/upsell). Note 16.06.06 D-12 already leans 'relay, never enforce' — reconcile the two so the booki |
| 16.02.04-hospitality-green-room-backstage.md | unresolved-decision | Resolve guest-list ownership (16.02.04 Q-01, cross-check 19) and billing-variant baselines (Q-02) at /ideate-validate; these are ideation-internal Ste |
| 16.02.06-pro-blanket-licence-setlist-reporting.md | missing-edge-case | Resolve 16.02.06 Q-03 with a cross-check to 24 and 10 before the setlist path is planned; 16.06.03 Q-06 already flags this as a hard phase-ordering de |
| 16.02.06-pro-blanket-licence-setlist-reporting.md | contradiction | Apply 16.05.03 D-02 (statutory outranks owner) to resolve the register-vs-operator precedence rather than deferring it as a new decision. |
| 16.01-place-records-rooms-cx.md | unmeasurable | Complete CX-05's synthesis: state whether the licence record is the source of the at-risk signal (emits an event) or is independently observed, and de |
| 16.03-studio-technical-specification-cx.md | unmeasurable | Complete CX-04's synthesis or explicitly downgrade it to a note; state how a recall request resolves when the engineer who ran the session has left an |
| 16.03.03-engineer-staffing-model.md | unresolved-decision | Resolve the 16↔05 house-engineer reconciliation (Q-01/Q-03) via the mandatory 05 cross-check; it is correctly bounded to 'no later than /write-be-spec |

## Domain 17 (70)

| File | Category | Fix |
|---|---|---|
| 17.01-availability-holds-confirmation-index.md | contradiction | Update the Role Matrix row to reflect D-04's two-ladder model (Full artist-side / Read-only room-side), resolving Q-06. |
| 17.01-availability-holds-confirmation-cx.md | unmeasurable | Update CX-04 to reference 17.01.01 D-14 (routing buffers annotate, never block) which resolves the PENDING, so the CX file is not read as an open gap. |
| 17.01-availability-holds-confirmation-cx.md | missing-edge-case | Point CX-05 at 17.01.03 D-04/D-05, which fully specify the warn schedule and delivery gate. |
| 17.01.02-hold-ladder-priority.md | unresolved-decision | Decide whether the artist-side ladder exists before spec; if yes, 17.01.03 and 17.01.04 must be re-scoped (their happy paths assume Operator-issues/Mu |
| 17.01.02-hold-ladder-priority.md | unmeasurable | Ratify the three constants at /ideate-validate (Q-07); acceptable as-is for ideation since mechanisms are decided and only the constants are provision |
| 17.01.03-challenge-release-expiry.md | unresolved-decision | Answer the artist-side-ladder shape question (shared with 17.01.02 Q-06) before spec so this file's direction assumption is validated. |
| 17.01.04-confirmation-announce-gate.md | missing-edge-case | Resolve the room-date-vs-show-slot grain (sub-domain Q-01) before writing C-05/D-12 into the BE spec; it converts a cosmetic ambiguity into a hard blo |
| 17.01.04-confirmation-announce-gate.md | unmeasurable | Flagged honestly (Q-06); confirm the cold-start behaviour (what the warning says before comparables exist) at /create-prd. |
| 17.02-offers-negotiation-cx.md | missing-edge-case | Point CX-04 at 17.02.01 D-07, which resolves the interaction; the CX file currently reads as an open gap that is actually closed downstream. |
| 17.02.01-offer-sheet-composition.md | unresolved-decision | Confirm the 16<->17 boundary requirements (Q-06) during /write-architecture-spec; tracked correctly, low risk. |
| 17.02.02-counteroffer-thread-versions.md | unresolved-decision | Resolve Q-08 (closed vs open grammar) before speccing 17.02.02 D-05; the file specifies the safe degradation, so acceptable for ideation, but flag the |
| 17.02.03-offer-approval-chain.md | missing-edge-case | Resolve alongside Q-01 - the deadlock is the argument against a unanimous default. |
| 17.02.03-offer-approval-chain.md | missing-edge-case | Specify lineup-change-invalidation (Q-03). |
| 17.02.04-offer-expiry-withdrawal.md | ambiguous-behavior | Decide the expiry/approval tie-break (Q-02); shared with 17.02.03 Q-02 - answer once. |
| 17.02.04-offer-expiry-withdrawal.md | unresolved-decision | Resolve whether expiry is hard-enforced or advisory (Q-01) and whether serial extension is limited. |
| 17.02.04-offer-expiry-withdrawal.md | missing-edge-case | Reconcile with 17.02.01 D-07 - the resolution exists but this file was not updated. |
| 17.03-deal-structures-economics-cx.md | missing-edge-case | Resolve run-ownership across independent Operators; it underpins the domain-level Q-02 grain decision. |
| 17.03.01-deal-term-grammar-types.md | unresolved-decision | Force this decision at /ideate-validate - it is the single highest-leverage open question in the domain and multiple downstream features degrade diffe |
| 17.03.01-deal-term-grammar-types.md | undefined-term | Scope the launch territory-profile set (Q-02) at MoSCoW; the gross-basis blocking validation depends on it. |
| 17.03.02-breakeven-whatif-modelling.md | unresolved-decision | Ratify the degraded-state presentation (Q-01); low risk since a safe default is specified. |
| 17.03.02-breakeven-whatif-modelling.md | unresolved-decision | Resolve the 23<->17 boundary at Step 6. |
| 17.04-performance-contracts-deal-memos.md | ambiguous-behavior | Decide the prose-edit-of-economic-term policy (Q-02); the divergence between the legal document and the settlement formula is a serious downstream haz |
| 17.04-performance-contracts-deal-memos.md | missing-edge-case | Specify the mid-flight authority-loss case at Step 5. |
| 17.05-deposits-balances-cancellation-cx.md | missing-edge-case | Specify the in-flight-payment vs cancellation ordering (also 17.05.01 edge case). |
| 17.05-deposits-balances-cancellation-cx.md | missing-edge-case | Resolve at Step 5; low risk. |
| 17.05.01-deposit-invoice-collection.md | unresolved-decision | Resolve Q-01 (auto-void vs hold); the state machine's terminal transition depends on it. |
| 17.05.01-deposit-invoice-collection.md | ambiguous-behavior | Ratify DT-03 (receiving-side confirmation required for off-platform deposits to open the announce gate). |
| 17.05.01-deposit-invoice-collection.md | missing-edge-case | Specify partial-payment cancellation handling (ties to 17.05.03). |
| 17.05.02-balance-schedule-reminders.md | ambiguous-behavior | Specify the same-day cancellation/instalment precedence (Q-02). |
| 17.05.02-balance-schedule-reminders.md | missing-edge-case | Specify amendment propagation into an in-flight schedule (Q-03). |
| 17.05.03-cancellation-tiers-forfeit.md | missing-edge-case | Resolve alongside the domain grain question (Q-02). |
| 17.05.03-cancellation-tiers-forfeit.md | missing-edge-case | Specify FM-reclassification unwind. |
| 17.05.03-cancellation-tiers-forfeit.md | missing-edge-case | Specify headline-cancellation support cascade and forfeit direction (17.14 Q-03). |
| 17.07-booking-enquiry-inbox-rfq.md | unresolved-decision | Resolve enquiry expiry/auto-decline (Q-01); the lifecycle state machine has an undefined terminal state. |
| 17.07-booking-enquiry-inbox-rfq.md | missing-edge-case | State the moderation routing behaviour at product level, not just 'routes to 24'. |
| 17.07-booking-enquiry-inbox-rfq.md | missing-edge-case | Resolve enquiry reach into invite-only avails (Q-02). |
| 17.08-agency-representation-commission-cx.md | missing-edge-case | Resolve 17.08.01 Q-02 (scope structured vs free text); it decides whether CX-03 exists at all. |
| 17.08-agency-representation-commission-cx.md | missing-edge-case | Resolve at Step 5 alongside the grain question. |
| 17.08.01-representation-commission-terms.md | unresolved-decision | Resolve the supported sunset-clause set (Q-01); the feature's stated 'real subject' is unspecified. |
| 17.08.01-representation-commission-terms.md | unresolved-decision | Resolve Q-02 (scope structured vs free text permitted). |
| 17.08.01-representation-commission-terms.md | missing-edge-case | Resolve manager-vs-agent commission modelling (Q-03); may belong in domain 23. |
| 17.08.02-commission-accrual-deduction.md | unresolved-decision | Resolve clawback handling (Q-01); it bounds the settlement amendment window across the whole domain. |
| 17.08.02-commission-accrual-deduction.md | unresolved-decision | Specify commission stacking order (17.08.01 Q-03). |
| 17.09-settlement-reconciliation-cx.md | missing-edge-case | Resolve 17.09.04 Q-01 (merch sheet-line vs parallel, per-room vs per-deal). |
| 17.09.01-settlement-sheet-computation.md | unresolved-decision | Resolve the grain question (domain Q-02) before spec; every downstream settlement feature inherits the ambiguity. |
| 17.09.02-box-office-count-reconciliation.md | unresolved-decision | Resolve with the payouts-provider decision at /create-prd-stack; correctly escalated. |
| 17.09.03-show-expense-receipt-capture.md | unresolved-decision | Resolve whether the expense schedule is structured (Q-01); the cap alone does not bound composition. |
| 17.09.03-show-expense-receipt-capture.md | missing-edge-case | Specify unreceipted-cash deductibility (Q-03). |
| 17.09.04-merch-settlement-venue-cut.md | missing-edge-case | Specify bundle handling in the merch sub-grammar (Q-02). |
| 17.09.04-merch-settlement-venue-cut.md | undefined-term | Specify the merch sales-tax basis (Q-03) as a deal term or territory default. |
| 17.09.04-merch-settlement-venue-cut.md | unresolved-decision | Resolve Q-01; 17.09.01 D-09 handles disposition-declaration but not the sheet-vs-parallel choice. |
| 17.09.05-settlement-signoff-variance.md | unmeasurable | Ratify the materiality threshold at /ideate-validate (Q-01); mechanism is decided, only the constant is provisional. |
| 17.09.06-settlement-audit-trail-disputes.md | unresolved-decision | Ratify one amendment-window value across 17.09.05 Q-03 / 17.09.06 Q-01 / index Q-03 - they must agree. |
| 17.09.07-settlement-statement-export.md | unresolved-decision | Decide protest presentation on the statement (Q-02). |
| 17.09.07-settlement-statement-export.md | undefined-term | Scope export formats (Q-01); acceptable since a machine-readable fallback is always guaranteed. |
| 17.10-live-income-payout-tax-cx.md | missing-edge-case | Resolve the split-vs-withholding ordering state conflicts (CX-02/CX-03 Q5); 17.10.01 edge case partly covers it - cross-reference. |
| 17.10.01-live-income-split-definition.md | unresolved-decision | Assign an owner domain for band-hires-player engagements (Q-03) - correctly flagged as an upstream gap, not a mere deferral. |
| 17.10.01-live-income-split-definition.md | missing-edge-case | Resolve the payout-recipient decision (Q-06 / index Q-01) at /create-prd-stack. |
| 17.10.02-disbursement-execution.md | unresolved-decision | Resolve individuals-vs-entity (Q-01) at /create-prd-stack; the whole feature's compliance shape hinges on it. |
| 17.10.02-disbursement-execution.md | missing-edge-case | Resolve clawback enforcement (Q-02). |
| 17.10.02-disbursement-execution.md | missing-edge-case | Specify guardian/minor payout eligibility at /create-prd-security. |
| 17.11-draw-history-market-intelligence-cx.md | missing-edge-case | Resolve whether market comparables (17.11.02) is in scope before this edge can be specified. |
| 17.11.01-verified-draw-record.md | unmeasurable | Specify the established-confidence threshold per market. |
| 17.11.01-verified-draw-record.md | missing-edge-case | Specify festival-draw handling. |
| 17.12-counterparty-relationship-payment-reliability.md | unresolved-decision | Resolve the contest-rate derivation (Q-01) - 17.09.05 D-12 offers 'directed facts' as a partial answer; reconcile the two. |
| 17.12-counterparty-relationship-payment-reliability.md | unmeasurable | Specify recency weighting. |
| 17.12-counterparty-relationship-payment-reliability.md | unresolved-decision | Resolve the private-vs-public scope (Q-03) before spec; it changes the whole feature's surface. |
| 17.14-bill-construction-support-slots.md | unresolved-decision | Specify the lighter support-booking flow's field set (Q-01); without it the platform loses bill data needed by the announce gate, settlement deduction |
| 17.14-bill-construction-support-slots.md | unresolved-decision | Resolve the buy-on permission values decision (Q-02). |
| 17.14-bill-construction-support-slots.md | missing-edge-case | Specify the post-announce support-drop refill/refund behaviour (coordinated with 19/21). |

## Domain 18 (9)

| File | Category | Fix |
|---|---|---|
| 18.03.01-advance-checklist.md | contradiction | Reconcile the two Role Matrices by encoding the contextual rule explicitly in both index files (DIY act = Full/owner; managed act = effectively read-o |
| 18.03.01-advance-checklist.md | ambiguous-behavior | State explicitly that `self-confirmed` is terminal for the freeze-gate count but flagged separately for 24's evidentiary weight; disambiguate the two  |
| 18.07.02-curfew-conflict-checking.md | unmeasurable | Define the uncertainty computation, e.g. `±X = unmeasured_song_count × per_song_uncertainty_minutes` (with a stated default) or an explicit variance f |
| 18.08.01-crew-roster-call-times.md | missing-edge-case | State in this feature file that the roster carries a type dimension (touring-party vs local-labour) and that party-size derivations exclude local labo |
| 18.05-stage-plot-input-list-cx.md | unresolved-decision | The referenced 18.05 index Open Questions (Q-01 editor / Q-02 export / Q-03 versioning) do NOT contain this modelling decision — the 'see Open Questio |
| 18.09-backline-gear-manifest-index.md | contradiction | Mark index Q-02 as RESOLVED by 18.09.01 D-05 (date-scoped ghost model). The stale 'open' status contradicts the feature file's locked decision. |
| 18.09-backline-gear-manifest-cx.md | contradiction | Update CX-01 synthesis #1 to cite 18.09.01 D-05 as the resolution (date-scoped ghost carrying the vendor serial), rather than calling Q-02 unresolved. |
| 18.07.01-run-of-show.md | missing-edge-case | Specify default buffer durations per slot (after build, soundcheck→doors reset, last-support→headliner changeover, before curfew) or the derivation ru |
| 18.18-post-show-report.md | unmeasurable | Either give concrete defaults or explicitly route the reminder-decay and reply-window durations to `/write-be-spec` alongside the editable-window PEND |

## Domain 19 (6)

| File | Category | Fix |
|---|---|---|
| 19.02-on-sale-announce-presale-cx.md | unmeasurable | Either backfill CX-04/CX-05 5-question synthesis, or replace the `[PENDING]` with an explicit pointer: 'resolved in 19.02.05 + domain CX-07'. |
| 19.02.03-access-code-issuance-redemption.md | ambiguous-behavior | State the code-redemption resumption rule explicitly (recommend: use-count is per-ticket-issued, resumable until window close or code exhaustion) and  |
| 19.02.05-sold-out-waitlist-demand-capture.md | unresolved-decision | Assign this a Q-number in the feature's Open Questions table with owner (User — it is a fairness/policy call) and a target stage, or decide the defaul |
| 19.01-ticket-config-scaling-allocations-cx.md | missing-synthesis | Backfill CX-03 synthesis (how a partial hold-release, an orphan-single rule, and a per-section model choice interact) or explicitly delegate to 19.01. |
| 19.10-attendee-data-capture-consent.md | unresolved-decision | Before /create-prd, resolve Q-01 (personalisation yes/no) since it determines the record shape the entire 19→20 pipe carries; if deferred, add an expl |
| 19.05.03-sales-pacing-on-sale-health.md | unmeasurable | Acceptable to defer the curve math, but pin down the cold-start behavior as an ideation-level decision (e.g. 'until room history exists, pace only aga |

## Domain 20 (8)

| File | Category | Fix |
|---|---|---|
| 20.01.03-fan-preference-centre.md | contradiction | Cross-link this tier's radius to 20.06.02 D-06 and state explicitly whether they are one setting or two; reconcile the defaults. |
| 20.02.01-segment-builder.md | contradiction | Correct the Membership dimension's source domain from 20.04 to 20.05 (20.05.01 Membership Tiers). |
| 20.02.01-segment-builder.md | missing-edge-case | State the shipped behavior for the count view (allowed, no floor) in the cell and mark only the send/export floor as tracked to Q-01, rather than leav |
| 20.05.02-exclusive-content-vault.md | missing-edge-case | Specify the takedown behavior (e.g. inherit 20.04.03's halt-and-preserve pattern: disable access to the flagged item, route the case to 24/09, notify  |
| 20.01-fan-graph-owned-audience-cx.md | unresolved-synthesis | Refresh CX-01 Q3/Q4, CX-02 Q4, and CX-04 Q1: replace the stale 'Step 5 deepening' [PENDING] with the resolved answer (or a link to the feature-file De |
| 20.02.02-superfan-score.md | unresolved-decision | Replace the [PENDING] cells with the resolved behavior from D-04 (withhold with an honest 'not enough signal' state) and D-01 (attendance-dominant ran |
| 20.03.04-deliverability-sender-reputation.md | unresolved-decision | Re-point the Behavior and edge-case [PENDING] markers (thresholds/ramp/reputation model; blocklist runbook; own-domain) to the real target stages alre |
| 20.04.01-storefront-product-catalog.md | ambiguous-behavior | Either align the two windows or explicitly state and justify the divergence (e.g. 'price honoured for 30 min but subject to availability once the 15-m |

## Domain 21 (8)

| File | Category | Fix |
|---|---|---|
| 21.01.03-content-calendar-beat-sheet.md | unresolved-decision | Either state that the beat-set concurrency model mirrors 21.01.01's per-row optimistic-lock resolution, or explicitly note the two are intentionally d |
| 21.01.02-asset-readiness-gate.md | unmeasurable | Give a design-default (e.g. 'within 3 days of a hard deadline, 7 for soft') and a tracked Q for tuning, or state the threshold is derived per-row from |
| 21.01.02-asset-readiness-gate.md | undefined-term | State explicitly whether uploaded/linked deliverables persist on the gate row (making 21.01.02 the asset source for the EPK) or whether the gate only  |
| 21.02.01-dsp-editorial-pitch.md | missing-edge-case | Resolve the stale-rule behavior within ideation (Step 5) before /create-prd: at minimum specify that derived hard-window dates render with a last-veri |
| 21.02.01-dsp-editorial-pitch.md | unresolved-decision | Add a tracked Open Question (owner + stage) resolving system-guard vs copy-warning for DSP-pitch confidentiality, and reflect the chosen behavior in 2 |
| 21.01.01-backward-planned-campaign-grid.md | unmeasurable | Specify a design-default escalation schedule for hard rows (e.g. reminders at R−14/−7/−3/−1 with rising severity) or route it to a named stage with a  |
| 21.02-pitching-outreach-cx.md | unresolved-decision | Convert CX-05's open design question into a tracked Open Question with owner + stage, or state the default (leave to human, no system model) as a deci |
| 21.01-release-campaign-planner-cx.md | unmeasurable | Either add the 5-question synthesis for CX-04 or attach a tracked Q (owner + stage) deferring the early-warning design, so it is a deferral rather tha |

## Domain 22 (7)

| File | Category | Fix |
|---|---|---|
| 22.08.01-contribution-catalog-performance.md | broken-cross-reference | Correct the link target to ../22.06-streaming-fraud-detection/. |
| 22.02.03-match-conflict-disambiguation-resolution.md | contradiction | Either mark Q-03 resolved-by-CX-02 and add the unmatched-queue-share degradation mechanism to 22.08.01's coverage behavior, or downgrade CX-02's asser |
| 22.02.01-external-artist-profile-matching-claiming.md | broken-cross-reference | Correct to ../22.08-credit-linked-performance/22.08.03-verified-performance-proof-service-listings.md. |
| 22.05.01-unified-performance-dashboard.md | missing-edge-case | Specify baseline-zero handling for the indexed-to-100 co-plot (e.g. rebase to first non-zero datapoint with a stated offset, or fall back to absolute  |
| 22.07.04-scouted-artist-visibility-consent.md | unresolved-dependency | Inline the tombstone/suppression contract into 22.07.04 (the piece that actually ships) rather than referencing decisions in un-deepened siblings, or  |
| 22.01-source-connections-ingestion-cx.md | unresolved-decision | Replace the [PENDING] with the resolution and cross-reference 22.01.03's delegate edge cases + domain CX-03, so a spec-writer reading the sub-cx first |
| 22.01.03-ingestion-health-gaps-freshness.md | missing-edge-case | Define dominant-loss for the no-prior-window case (e.g. treat a source with no prior contribution as unknown-share and default to the conservative ref |

## Domain 23 (8)

| File | Category | Fix |
|---|---|---|
| 23.01.01-income-event-ledger.md | unmeasurable | Either specify a concrete/default window (e.g. 'N days, configurable') or add an Open Question with owner + stage the way Q-04 handles the merge thres |
| 23.01.02-off-platform-income-import.md | unresolved-decision | Resolve the column-mapping-UI-vs-per-bank-parser decision here or promote it to a tracked Open Question with owner + target stage; the current `[PENDI |
| 23.03.02-invoice-issuance-compliance.md | missing-edge-case | State the v1 behaviour explicitly (e.g. 'reverse-charge unsupported at launch -> blocked with explanation' or 'free-text VAT-note field') or route it  |
| 23.01-income-aggregation-financial-identity-cx.md | unresolved-synthesis | Answer synthesis Q4 for CX-03 (who is notified on credit revocation / work-linkage degradation), or explicitly mark it out-of-scope-for-this-pair rath |
| 23.02-expenses-tax-readiness-cx.md | unresolved-synthesis | Answer synthesis Q4 for CX-01 (notification on re-categorization / jurisdiction re-map) or scope it out explicitly. |
| 23.04-deal-contract-vault-cx.md | unresolved-synthesis | Answer synthesis Q4 for CX-01 (notification on extraction-ready / confirmation-required, and to whom given the counterparty-delegate conflict) or scop |
| 23.05-career-progression-benchmarking-cx.md | unresolved-synthesis | Answer synthesis Q4 for CX-03 or scope it out; note the whole feature is `could`-tier and may be cut (Q-05), which would moot this, but the marker sho |
| 23.06-advances-commission-recoupment-cx.md | unresolved-synthesis | Answer synthesis Q5 for CX-03 (runway behaviour on income reversal after recoupment) or scope it out explicitly rather than leaving a Step 5 `[PENDING |

## Domain 24 (11)

| File | Category | Fix |
|---|---|---|
| 24.01.05-messaging-safety-scam-filtering.md | broken-cross-reference | Repoint the link to ./24.01.03-moderation-queue-reviewer-ops.md and correct the display name to 'Moderation Queue & Reviewer Ops'. |
| 24.01.03-moderation-queue-reviewer-ops.md | unmeasurable | Add the reserved safety-floor share (e.g. a default %) to the Q-05 operational-tuning defaults list, or state it is an explicit config value to be set |
| 24.06.01-harassment-stalking-doxxing.md | unresolved-decision | Either promote EXIF-stripping-at-ingest to a Must control owned independently of the Could classification feature (e.g. in the media ingest / Privacy  |
| 24.02-enforcement-appeals-policy-cx.md | missing-synthesis | Add Cross-Cut Details (the 5 synthesis questions) for CX-04, CX-05, and CX-06, matching the depth given to CX-01–CX-03. |
| 24.03-fraud-risk-operations-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-02, CX-04, and CX-05. |
| 24.04-transaction-disputes-protection-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-02, CX-04, and CX-05. |
| 24.01-reporting-moderation-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-04 and CX-05, or explicitly mark them as deferred-with-owner rather than leaving them at map depth. |
| 24.05-copyright-authenticity-enforcement-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-03 and CX-04. |
| 24.06-personal-safety-threat-response-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-02 and CX-03 (or state the Low-confidence CX-03 is a hypothesis pending 24.06.03 Q-01, with owner). |
| 24.07-identity-abuse-ownership-disputes-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-03, noting the dependency on 24.07.03 succession establishing standing. |
| 24.08-illegal-content-legal-process-cx.md | missing-synthesis | Add Cross-Cut Details synthesis for CX-02 and CX-03, and reconcile with 24.08.04 Q-03 (is the risk register a product feature or a /create-prd-securit |

## Domain other (30)

| File | Category | Fix |
|---|---|---|
| problem-statement.md | unmeasurable | Either downgrade to a defensible qualitative claim ('splits/credits disputes are a leading, recurring source of music-industry litigation') or attach  |
| problem-statement.md | undefined-term | Add an inline cross-reference to the canonical domain list, e.g. '(see the 24 domains enumerated in ideation-index.md Structure Map)'. Do not leave a  |
| problem-statement.md | undefined-term | State the intended capture trigger(s) at vision level, or explicitly defer with a tracked Open Question owned by the user (e.g. 'Q-04: What concrete e |
| problem-statement.md | unresolved-decision | No fix to the statement needed — it is correctly deferred. Ensure /ideate-validate / MoSCoW resolves Q-03 before /create-prd consumes this file, and g |
| problem-statement.md | missing-reference | Add a link to the decisions ledger (e.g. ../meta or .memory/wiki/decisions.md) in the header alongside the personas/competitive links, so D-NN referen |
| competitive-landscape.md | contradiction | Either (a) mark Q-03 resolved like Q-02, stating the confirmed classification and moving the rationale out of a parenthetical, or (b) if genuinely ope |
| competitive-landscape.md | undefined-term | Expand on first use ('the PROs — Performing Rights Organizations') and either name the target PROs for v1 or explicitly defer PRO selection to a track |
| competitive-landscape.md | undefined-term | Add a one-line pointer to the authoritative phasing source (e.g., 'Phase boundaries per MoSCoW in ideation-index.md') or a short v1-vs-Phase-2 scope n |
| personas.md | unmeasurable | Either attach a concrete baseline+target+timeframe to each (e.g. "median time-to-book from 9 days → under 48h by launch+6mo"), or remove the "Measurab |
| personas.md | contradiction | Resolve before Role Matrices consume this: either add an explicit non-persona "Admin/Operator-role" column with a stub definition (scope, what it can  |
| personas.md | undefined-term | Define the canonical set the number refers to (e.g. "six tool categories WeJammin consolidates: identity, credits, services, booking, distribution, ma |
| personas.md | unresolved-decision | Add an inline assumption marker in "The Structural Fact" section pointing to Q-04 (e.g. "assumes single-account-many-roles model — see Q-04, locks at  |
| services-marketplace-cx.md | unresolved-decision | Convert the per-payee-freeze `[PENDING]` into a tracked Open Question with an owner and stage (/create-prd-architecture, coordinate with Payments cros |
| education-lessons-mentorship-cx.md | unsynthesized-cx | Either pin CX-11 and CX-12 to a named stage/owner (e.g. Step 5 / /ideate-validate) as CX-10 does, or answer their 5 synthesis questions at least at br |
| credits-attribution-index.md | contradiction | Qualify the domain-matrix Operator cell for 02.02 to 'Read-only (roll only, opt-in per session); no contribution-log access' to match 02.02.01/02.02.0 |
| realtime-jamming-remote-sessions-index.md | contradiction | Update D-05 (and D-04's framing) to state that overdub carries provenance at a LOWER, honestly-labelled grade (delivery-certainty), with the observed- |
| royalties-collections-cx.md | missing-synthesis | Either add a CX-11 Cross-Cut Details block with the five synthesis answers (it is a real dependency for leakage detection's 'Registered but unmatched  |
| gear-registry-ownership-index.md | contradiction | Resync the index summary line to the deepened cx file: 19 confirmed cross-cuts, 6 rejected pairs, 6 escalated mechanisms. |
| gear-registry-ownership-index.md | unmeasurable | Correct '21 leaf features total' to 24 in both the Children note and Q-01 (which repeats the figure). |
| venues-studios-spaces-index.md | contradiction | Mark domain-index Q-04 resolved (→ 16.02.02 D-05). Similarly review Q-01 (bands-answer, still a genuine validation gate), Q-03 (conditionality — 16.02 |
| venues-studios-spaces-index.md | unresolved-decision | Resolve 16.05.03 Q-03 (Fan suggestion field-class scope) and replace the 'unresolved' matrix cell with the decided scope. |
| promotion-marketing-index.md | contradiction | State '9 children ... 6 sub-domains, 3 features (one of which, 21.09, is a Deep Think addition)'. |
| live-booking-settlement-index.md | unresolved-decision | Ratify at /ideate-validate before PRD; if the agent needs distinct permissions, it is not merely a Musician lens and the Role Matrix legend needs a fi |
| live-booking-settlement-index.md | contradiction | Reconcile the 17.01.02 row across domain index, sub-domain index, and leaf (17.01.02 Q-06) - state it is Full on artist-side ladders and Read-only on  |
| live-booking-settlement-cx.md | unresolved-decision | CX-24 synthesis Q1/Q5 flag the over-commit race as 'a knowing simplification for /ideate-validate' - confirm it is explicitly out of scope for v1 rath |
| fanbase-direct-to-fan-index.md | structural-staleness | Refresh the domain index status and the children status column to reflect the completed depth allocation (and update its Last-updated date), so the pi |
| career-finance-business-index.md | structural-truncation | Complete the D-01 Context cell (or replace the ellipsis with an explicit 'see Overview for full rationale' pointer) so the Decision Log is self-contai |
| trust-safety-disputes-index.md | contradiction | Correct the count to 'two of the nine rows are all-❌ (24.03, 24.08)' in the Role Matrix note and in Q-02 and Q-03, or add the intended third all-❌ row |
| trust-safety-disputes-index.md | contradiction | Change 'Three Deep Think additions' to 'Four Deep Think additions' (the list is correct: Harassment, Crisis, Pre-Release Leak, Succession). |
| trust-safety-disputes-index.md | contradiction | Annotate the 24.05 domain row that '✅ Full' reflects 24.05.01 (statutory 512(g)) only and access varies per child, or add a 'see sub-domain matrix' ca |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-nn|D-NN]]
