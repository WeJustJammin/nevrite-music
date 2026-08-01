# Run 7 Verified Blocker Remediation Matrix

> Source baseline: Run 7, now superseded for the changed source tree.
> Scope: non-governance blockers only; Dimension 7 metadata remediation is tracked in remediation-state.md.
> Rule: use the current source and the corresponding verification report when applying any row.

## 01-identity-profiles-organizations

- [ ] **R7-01-002** — Dimension 3: The party-of-record model is unresolved for a person trading without an organization and for a legally separate band and label company represented as one on-platform party.
  - Evidence: .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02-organizations-entity-model-index.md:56
  - Verification: No current decision settles whether a person may transact without an organization or how one on-platform party represents legally separate entities. Organization creation is a Must Have, so a seller/payee model would be invented during implementation.
- [ ] **R7-01-003** — Dimension 3: Delegated authority has no rule for communication, even though messaging is the acting-context switcher's dominant use.
  - Evidence: .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md:218
  - Verification: The Must Have acting-context switcher still has no communication authority rule. The source expressly says either an eighth activity or an explicit scope rule is needed, leaving a real authorization choice to an implementer.
- [ ] **R7-01-010** — Dimension 3: Claim assurance is incomplete: collusion resistance, qualifying Tier A providers, and the capture-versus-proof requirement for contact routes remain open.
  - Evidence: .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.02-claim-initiation-proof-methods.md:244
  - Verification: Claim Initiation & Proof Methods is a Must Have, and the current source explicitly admits that a five-account collusion ring passes Tier C while no weighting rule resolves it. Existing Tier-A criteria and an optional-contact fallback narrow the issue, but they do not remove the unclosed assurance decision.
- [ ] **R7-01-016** — Dimension 4: The public portfolio of an unclaimed party has no settled lawful basis for publishing and search-indexing personal data about a non-user.
  - Evidence: .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.02-credit-backed-portfolio.md:230
  - Verification: Credit-Backed Portfolio is a Must Have and requires rendering unclaimed parties. The account-free remedy is defined, but the current source expressly says it does not provide the lawful basis; no canonical source resolves publication or indexing, so implementation would invent a privacy posture.

## 02-credits-attribution

- [ ] **R7-02-01-001** — Dimension 5: The mandatory contested embargo-lift SLA has no numeric target or capacity measure, so the status quo can persist without a measurable resolution point.
  - Evidence: .memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md:297
  - Verification: The Must embargo flow still requires a contested-lift SLA, but its value and the capacity needed to meet it remain unspecified. The directly linked Trust & Safety source confirms this case class is unbudgeted, so an implementer would have to invent the resolution bound.

## 04-opportunities-casting

- [ ] **R7-04-001** — Dimension 2: Function/private-hire buyers and crew are required by the domain but have no persona or authority model, so their access and posting powers cannot be implemented without inventing product truth.
  - Evidence: .memory/wiki/specs/ideation/04-opportunities-casting/opportunities-casting-index.md:87
  - Verification: The current domain still requires function/private-hire buyers and crew while explicitly leaving both outside the four-persona model. No posting or review authority can be implemented for them without selecting an unresolved product model.

## 06-education-lessons-mentorship

- [ ] **run7-06.02-d3-001** — Dimension 3: The public trial CTA has no defined entry or authority flow for the logged-out stranger who may be acting for a child.
  - Evidence: .memory/wiki/specs/ideation/06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02-teacher-discovery-profiles-trials-cx.md:156
  - Verification: The public page exposes the trial CTA to an accountless reader, while booking requires an account and recasts that reader as a Student. The current parent question explicitly leaves unresolved whether the adult choosing and paying for the teacher is only delegated authority or a buyer persona. No source defines the resulting entry and authority flow for a child-directed trial.
- [ ] **run7-06.03-d3-001** — Dimension 3: Practice and assignment records lack a decided access-lifecycle contract for parent visibility and former-teacher access after the teaching relationship ends.
  - Evidence: .memory/wiki/specs/ideation/06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03-curriculum-assignments-practice-cx.md:60
  - Verification: Current source resolves the former teacher's access to assignment submissions with a 90-day wind-down, but it leaves the practice diary's parent visibility unresolved. That unclosed child-data policy still forces an access decision for practice records, so the composite lifecycle gap remains material.
- [ ] **run7-06.04-d3-001** — Dimension 3: The course marketplace has no refund-eligibility and reversal contract for partially consumed digital courses.
  - Evidence: .memory/wiki/specs/ideation/06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04-course-marketplace-authoring-cx.md:133
  - Verification: Current source defines only the consequence after an entitlement is revoked: access ends while progress persists. It still marks the consumption-thresholded refund eligibility policy as pending, so an implementer would have to invent the eligibility and adjudication rule for a partially consumed course.

## 08-realtime-jamming-remote-sessions

- [ ] **R7-root-FC-01** — Dimension 3 — Feature Completeness: The domain index still treats Overdub provenance as equivalent to observed live-session provenance, while the current Overdub and attendance specs require a lower delivery-based grade.
  - Evidence: .memory/wiki/specs/ideation/08-realtime-jamming-remote-sessions/realtime-jamming-remote-sessions-index.md:129
  - Verification: Uphold: the domain index still says Overdub carries provenance intact, while the owning Must feature explicitly corrects that assertion to delivery-certainty rather than performance-certainty and says the index remains uncorrected. No current source reconciles the grade, so implementation must invent which provenance fact reaches Credits.
  - Remediation status: Candidate source fix applied on 2026-08-01. The index now distinguishes observed live-session provenance from Overdub delivery-certainty and names the witness-based upgrade; fresh Run 8 verification required.
- [ ] **R7-root-FC-04** — Dimension 3 — Feature Completeness: The domain cross-cut describes no-reference and no-witness handling as correlation or timestamp alignment, but the alignment feature says raw distributed tracks cannot correlate and R3 must be published as unaligned.
  - Evidence: .memory/wiki/specs/ideation/08-realtime-jamming-remote-sessions/realtime-jamming-remote-sessions-cx.md:82
  - Verification: Uphold: the current parent CX directs correlation/timestamp behavior after an absent reference and unarmed witness, while the owning Must alignment spec says raw endpoint tracks cannot correlate and no-reference/no-witness output is unaligned. No current source reconciles these mutually incompatible implementation paths.
  - Remediation status: Candidate source fix applied on 2026-08-01. The cross-cut now limits the fallback to an R3 placement hint and requires unaligned publication; fresh Run 8 verification required.

## 10-royalties-collections

- [ ] **RUN7-10-007** — Dimension 3: The Must-level term-calculation flow deliberately holds contradictory terms but has no launch-era exit path because its dispute engine is placed in Could.
  - Evidence: .memory/wiki/specs/ideation/10-royalties-collections/10.03-calculation-recoupment/10.03.02-deal-terms-rate-application.md:262
  - Verification: The current Must-level Deal Terms feature explicitly records the held contradictory-term state and lists three mutually exclusive launch exits without selecting one. Its referenced dispute feature remains Could, so the existing source still forces an implementation choice for release.

## 12-release-distribution

- [ ] **R7-12.04-D3-001** — Dimension 3: No finalized fan-notification policy exists for a material release-date change: the cross-cut only records a leaning and an informal handoff to domains 20/21.
  - Evidence: .memory/wiki/specs/ideation/12-release-distribution/12.04-release-scheduling-windows/12.04-release-scheduling-windows-cx.md:99
  - Verification: Upheld. The distribution source resolves per-store grant handling but not whether a material date move triggers fan notice or its authorization boundary. The directly referenced campaign and pre-save sources retain the same decision as pending, so an implementer would have to invent the policy.
- [ ] **R7-12.05-D3-001** — Dimension 3: Suspension blocks all updates while the cross-cut identifies claim-resolving credits and clearances as updates; no final exception, authorization rule, or resolved route exists.
  - Evidence: .memory/wiki/specs/ideation/12-release-distribution/12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-cx.md:22
  - Verification: Upheld. A generic contest route exists, but the source expressly leaves unresolved whether claim-resolving evidence is a permitted suspension exception, a separate evidence act, or a prohibited mutation. No final classification or authorization rule removes that implementation choice.
- [ ] **R7-12.05-D3-002** — Dimension 3: The update-to-redelivery flow recognizes that failure between takedown and re-delivery is its worst outcome but leaves recovery pending.
  - Evidence: .memory/wiki/specs/ideation/12-release-distribution/12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-cx.md:62
  - Verification: Upheld. The current cross-cut explicitly identifies a destructive takedown-to-redelivery half-failure and leaves recovery pending; no compensation, retry boundary, or user-visible recovery state is specified.
- [ ] **R7-12.06-D3-001** — Dimension 3: An ownership conflict on one UGC platform has no settled containment policy for registrations on other platforms.
  - Evidence: .memory/wiki/specs/ideation/12-release-distribution/12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-cx.md:13
  - Verification: Upheld. A conflict is routed for evidence and resolution on the originating platform, but no settled containment policy governs registration on the other UGC platforms. The direct rights authority contains no Content ID policy that resolves this per-platform decision.
- [ ] **R7-12.06-D3-002** — Dimension 3: The derived whitelist has no reconciliation policy when its identity or credit sources change after registration.
  - Evidence: .memory/wiki/specs/ideation/12-release-distribution/12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-cx.md:33
  - Verification: Upheld. The whitelist is derived and reviewed before registration, but its lifecycle after identity or credit changes is explicitly unresolved; no directly referenced identity or credit source defines a reconciliation action for this projection.

## 13-gear-marketplace

- [ ] **R7-13-018** — Dimension 3: The damage-claim edge path does not specify the settlement and ownership transition when a claim opens at the inspection-window boundary.
  - Evidence: .memory/wiki/specs/ideation/13-gear-marketplace/13.07-gear-logistics-cross-border/13.07-gear-logistics-cross-border-cx.md:52
  - Verification: Current source still declares the claim-opening versus auto-settle interaction unspecified and merely flags it; no owner/deferred decision record resolves atomic settlement and ownership behavior. An implementer would have to invent the race outcome.

## 14-digital-goods-marketplace

- [ ] **R7-14-012** — Dimension 3: Payment-failed re-purchase handling conflicts with cardinality: a new record is minted despite the single-entitlement rule and the stated reactivation rule.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.01-licence-issuance-entitlement-record.md:53
  - Verification: The same current issuance source preserves a payment-failed row, then directs a later purchase to mint a new record, contradicting its one-entitlement-per-product-per-holder rule. No exception or reconciliation for payment-failed rows is defined.
  - Remediation status: Candidate source fix applied on 2026-08-01. The failed state now reactivates the same record after successful retry or re-purchase; fresh Run 8 verification required.
- [ ] **R7-14-013** — Dimension 3: Library behavior preserves multiple rows for the same holder and product after distinct terms, gifts, or bundle overlap, without defining an exception to issuance singleton.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.01-licence-issuance-entitlement-record.md:53
  - Verification: Current library behavior explicitly preserves duplicate entitlements and rows for the same holder and product, including bundle overlap, while issuance requires one entitlement. The source supplies no defined exception or mapping between those rules.
  - Remediation status: Candidate source fix applied on 2026-08-01. The library now retains acquisition/terms history within one entitlement row and bundle overlap issues only missing entitlements; fresh Run 8 verification required.
- [ ] **R7-14-014** — Dimension 3: The takedown rule stops onward delivery but does not define existing-holder archive access or one-asset versus whole-pack scope.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-delivery-versioning-file-access.md:55
  - Verification: The current delivery source explicitly leaves archive fetch after a rights takedown and the one-asset-versus-pack boundary unresolved. Implementing the takedown path would require choosing both behaviors.
- [ ] **R7-14-015** — Dimension 3: A template whose unbundled dependency is later delisted is declared permanently incompletable with no remedy or availability contract.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.03-project-template-catalog-dependency-manifest.md:55
  - Verification: A current template edge case still states that a delisted unbundled dependency makes the session permanently uncompletable and remains pending. Its directly referenced dependency graph only gives a pre-purchase advisory to a new buyer, not a remedy for the affected buyer.
- [ ] **R7-14-017** — Dimension 3: Upgrade/base refunds are asserted as 'refund both or neither' and separately declared open.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.02-automated-refund-pipeline-revocation.md:174
  - Verification: The current upgrade feature expressly records the competing refund outcomes and says the linked adjudication source contradicts its own proposed rule. The resulting unwind behavior remains an owner decision.
- [ ] **R7-14-018** — Dimension 3: Waiver cross-cuts use a two-limb, order-keyed, unconditional gate while the canonical feature requires three limbs, an entitlement key, and an expiry condition.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation-cx.md:10
  - Verification: The current waiver cross-cut still uses an order record and a two-limb description, while the canonical waiver feature requires three limbs, entitlement-level scope, and a 14-day shelf life. The canonical source itself says the cross-cut must be sharpened, so implementation would otherwise invent the gate.
  - Remediation status: Candidate source fix applied on 2026-08-01. The cross-cut now names all three limbs, per-entitlement scope, and the statutory expiry condition; fresh Run 8 verification required.
- [ ] **R7-14-019** — Dimension 3: Waiver behavior depends on trader status even though the vendor portal lacks the declaration and checkout lacks its required pre-buy disclosure.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.01-withdrawal-waiver-entitlement-gate.md:60
  - Verification: The canonical waiver feature establishes that seller trader status must be declared at vendor onboarding and disclosed before the buyer is bound, then confirms that the current vendor source has no such field. The required data and checkout flow remain absent.
  - Remediation status: Candidate source fix applied on 2026-08-01. Vendor onboarding now captures the declaration and the listing renders it before the buyer is bound; fresh Run 8 verification required.
- [ ] **R7-14-020** — Dimension 3: An unresponsive split contributor freezes direct-sale payouts for everyone, but no timeout or fallback allocation exists.
  - Evidence: .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.03-revenue-split-royalty-pool.md:34
  - Verification: The current contributor-split behavior still blocks payout when a contributor does not answer, and the open question says no source sets a timeout or allocation policy. A direct-sale payout implementation would have to invent that fallback.

## 15-gear-registry-ownership

- [ ] **R7-15.01-D3-001** — Dimension 3: The declared canonical source for identity-confidence values does not state the enum, while the renderer contains an unresolved proposed vocabulary.
  - Evidence: .memory/wiki/specs/ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.05-non-serialized-contested-identity.md:93
  - Verification: The declared owner still does not enumerate the canonical values: it only refers to six values already elsewhere on disk, while the renderer labels its six literals as proposed. Persisted identity-confidence behavior would therefore require inventing the canonical enum and its owner.
  - Remediation status: Candidate source fix applied on 2026-08-01. The declared owner now enumerates the existing six values and the renderer references them as canonical; fresh Run 8 verification required.
- [ ] **R7-15.02-D3-003** — Dimension 3: Partial-identity screening is specified both as impossible without the full composite key and as a maker/model-only check, leaving the safety behavior undefined.
  - Evidence: .memory/wiki/specs/ideation/15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.01-theft-report-serial-flagging.md:50
  - Verification: Current source still makes a serial-unknown flag unusable for screening because a full composite key is required, but also defines a partial screen with no era or serial as a maker/model-only match. It does not specify whether that partial result can hit, hold, or only advise, forcing safety behavior to be invented.
- [ ] **R7-ROOT-D2-005** — Dimension 2: Consignment, appraisal, and dealer-stock workflows require a professional dealer, but the actor has no persona definition.
  - Evidence: .memory/wiki/specs/ideation/15-gear-registry-ownership/gear-registry-ownership-index.md:136
  - Verification: The root source and its canonical persona sources all still leave the professional dealer undecided. No authoritative source selects a persona or permissions model, so consignment, appraisal, and dealer stock workflows would require inventing actor authority.

## 20-fanbase-direct-to-fan

- [ ] **R7-20.01-002** — Dimension 3: Imported weak-provenance records have no resolved send-eligibility policy, and the legality of the only proposed re-permission path remains unresolved.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-cx.md:41
  - Verification: Upheld: weak-provenance sending and re-permission legality remain PENDING, while the importer also leaves its stale-consent outcome PENDING. The consent feature supplies a different age-only default, so the current sources are incomplete and internally inconsistent for a core import edge case.
- [ ] **R7-20.02-002** — Dimension 4: The specification identifies individual-targeting through segments as a stalking hazard but does not define the send/export k-anonymity constraint or its enforcement boundary.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md:77
  - Verification: Upheld: the privacy constraint for individually targeted sends has no chosen floor or value. The source explicitly leaves the send rule PENDING and escalates it because the author is not confident enough to decide it.
- [ ] **R7-20.03-002** — Dimension 5: The mid-send circuit breaker lacks numeric complaint thresholds and ramp curves, and the platform-wide blocklist response has no runbook.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md:44
  - Verification: Upheld: sender-health thresholds, ramp curves, and reputation model remain PENDING; the blocklist response has no runbook and the complaint breaker has no numeric trigger. The required success measures are not specified with numbers, units, and timeframes.
- [ ] **R7-20.04-002** — Dimension 4: The D2F payout flow requires financial-regulatory, tax, reserve, versioned-terms, and payee-assent decisions that remain unresolved.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md:188
  - Verification: Upheld: central payment compliance constraints remain open: money-transmitter status, tax obligations, and the versioned terms record/resolution model. The source has a worked payout path, but its open-question section still leaves these requirements undecided or unmodeled.
- [ ] **R7-20.05-002** — Dimension 3: The campaign fund-release lifecycle leaves custody, milestone verification, advance funding, insolvency protection, and partial-fulfilment refunds unresolved.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.05-backer-funds-fulfilment.md:41
  - Verification: Upheld: milestone verification, advance tranches, insolvency protection, and partial-fulfilment refunds remain unresolved. These are core backer-funds behaviors rather than optional detail, leaving the feature incomplete.
- [ ] **R7-20.06-003** — Dimension 3: Anonymous follow is required to avoid an account wall, but the durable identity, later-account linking, and consent boundary are explicitly unspecified.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.01-artist-tracking-follow.md:63
  - Verification: Upheld: the no-account follow path is required to work, but its durable identity, later-account linking, duplicate handling, and email-capture consent remain undecided. This leaves a core follow flow incomplete.
- [ ] **R7-20.07-003** — Dimension 4: The demand map mandates a k-anonymity floor but does not define k or whether explicit requests receive the same protection.
  - Evidence: .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.07-fan-demand-show-requests.md:69
  - Verification: Upheld: the demand map requires a k-anonymity floor, but the specification still supplies neither a threshold nor whether it also covers explicit requests. The privacy constraint is therefore not explicit.

## 21-promotion-marketing

- [ ] **R7-21-D2-001** — Dimension Persona Specificity: The gatekeeper population that the pitching and directory features act on has no settled persona or counterparty representation. The source explicitly records the gap, leaves the fifth-persona decision open, and says no gatekeeper profile exists, so their pain, workaround, success criteria, and switching trigger cannot be specified.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/21-promotion-marketing/promotion-marketing-index.md:147
  - Verification: The current domain source still records the gatekeeper as a structural persona gap, leaves the representation decision open, and states that no gatekeeper counterparty profile exists.
- [ ] **R7-21-D4-001** — Dimension Constraint Explicitness: The asset-readiness specification simultaneously retains the rights-clearance boundary as unresolved and declares the same question resolved with the opposite implementation boundary. A reader cannot determine whether an uncleared sample blocks this gate or only downstream release/delivery.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/21-promotion-marketing/21.01-release-campaign-planner/21.01.02-asset-readiness-gate.md:84
  - Verification: The same current document retains an unresolved rights-clearance boundary while its question row declares a different resolved boundary, leaving the gate behavior ambiguous.
  - Remediation status: Candidate source fix applied on 2026-08-01. The stale cross-cut now cites resolved Q-01: asset readiness does not adjudicate clearance, while declared uncleared rights block release/delivery; fresh Run 8 verification required.
- [ ] **R7-21-D4-002** — Dimension Constraint Explicitness: Private CRM notes are acknowledged as a defamatory and special-category-data exposure, but the source only flags it as a probable security concern. Its open-question register covers erasure, band ownership, and import instead; it assigns no owner, deadline, or required policy for this compliance constraint.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/21-promotion-marketing/21.03-pitch-targets-crm/21.03.02-private-contact-crm.md:56
  - Verification: The feature identifies special-category and defamatory-note handling as a compliance exposure, but leaves it pending and merely routes it to security without a required handling policy.

## 24-trust-safety-disputes

- [ ] **R7-24-RAW-002** — Dimension Persona Specificity: The domain's primary operating actors have no persona specification, and the source explicitly says the moderator actor, permission model, and console endpoints cannot be specified until the missing persona decision is resolved.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md:91
  - Verification: The primary moderation and legal-process actors remain outside the persona set, and the canonical persona document leaves Admin/Moderator as an open decision that blocks actor definition. This is a missing core persona/role specification under Dimension 2.
- [ ] **R7-24-RAW-004** — Dimension Feature Completeness: A fully automatic CSAM action has no valid structured Statement-of-Reasons representation: the subject reason must be generic but nonempty and honest, while the closed concurrence enum has no value for an action that no human reviewed.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.01-csam-detection-preservation-reporting.md:139
  - Verification: The automatic CSAM action has no stated valid facts-relied-on or concurrence value. Current Q-05 preserves the incompatibility, so an implementer cannot commit a complete valid Statement of Reasons.
- [ ] **R7-24-RAW-005** — Dimension Feature Completeness: The crisis lane defines an `Escalated` state but leaves the emergency-services action and its malicious-report tradeoff pending, despite requiring a decision before the first case.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06.03-crisis-welfare-escalation.md:40
  - Verification: The Escalated state remains pending, and emergency-services contact must be decided before the first case. No action or malicious-report tradeoff is specified, leaving a blocking feature-completeness gap.
- [ ] **R7-24-RAW-006** — Dimension Feature Completeness: The law-enforcement portal has no after-hours response path for a warrant received by the one-person team.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.03-law-enforcement-legal-process-portal.md:65
  - Verification: The one-person-team warrant-at-2am scenario remains pending, and Q-03 presents no selected escalation path. The after-hours legal-process flow is therefore not implementable.
- [ ] **R7-24-RAW-007** — Dimension Feature Completeness: A mandatory human-adjudicated inbound case has no defined test for a publicly reachable but unauthorised recording, so the reviewer cannot decide the case without inventing the predicate.
  - Evidence: /home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-cx.md:431
  - Verification: The closed grounds omit publicly reachable but unauthorised recordings, and the current source says the resulting human review has no defined test. This is a blocking implementer-simulation gap.

## meta

- [ ] **R7-META-002** — Dimension 4: The budget and performance axes lack the rubric-required specific values or an explicit `not applicable` value.
  - Evidence: .memory/wiki/specs/ideation/meta/constraints.md:160
  - Verification: Upheld. Budget has no fixed monetary ceiling, while latency and availability explicitly defer real targets to `/create-prd-compile`. Those are unresolved values rather than a specific value or an explicit not-applicable value required by the constraint rubric.

## Fresh-Run Rule

No row becomes complete until a fresh audit of the changed source tree independently verifies the claimed resolution.
