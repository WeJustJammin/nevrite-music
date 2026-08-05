# Run 7 — Owner Decision Packet

> Status: OPEN — generated 2026-08-01 from the independently verified Run 7 blocker matrix.
> Scope: 36 owner or policy decisions. Nine source-only repairs are excluded because they require fresh Run 8 verification, not a new decision.
> Decision aid: [run7-owner-decision-agenda.md](./run7-owner-decision-agenda.md) groups recommendations
> without ratifying them.

## Use

1. Decide each entry explicitly; do not infer a policy from implementation convenience.
2. Apply each ratified decision in its owning ideation source and record the ratification.
3. Run the full fresh Run 8 audit only after every entry is resolved.

## Decision Lanes

### Platform targets

| Finding | Domain | Decision that remains open | Evidence |
|---|---|---|---|
| R7-META-002 | meta | **Ratified (2026-08-02):** pre-revenue infrastructure cap is **$0/month**; availability is **100% outside scheduled outages**; normal-web p95 is **<2 seconds** for first-party interactive web requests at expected v1 load. | .memory/wiki/specs/ideation/meta/constraints.md:160 |

### Actors and authority

| Finding | Domain | Decision that remains open | Evidence |
|---|---|---|---|
| R7-01-002 | 01-identity-profiles-organizations | **Ratified (2026-08-02):** organization is optional; a person and each legally separate band, studio, agency, or label are distinct parties of record, and acting for another party requires a recorded mandate. | .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.02-organizations-entity-model/01.02-organizations-entity-model-index.md (Q-02, A1) |
| R7-01-003 | 01-identity-profiles-organizations | **Ratified (2026-08-02):** `communicate` is an independent explicit mandate grant; no commercial activity, domain, membership, or representation scope implies authority to speak as the party. | .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03.03-mandate-scope-delegated-authority.md (D-13, A2) |
| R7-01-016 | 01-identity-profiles-organizations | **Ratified (2026-08-02):** an unclaimed non-user portfolio is neither public nor search-indexed; future release requires claim or explicit consent plus approved lawful basis, notice, and account-free removal controls. | .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.02-credit-backed-portfolio.md (D-13, A4) |
| R7-04-001 | 04-opportunities-casting | **Ratified (2026-08-02):** function/private-hire buyer and crew are bounded account/counterparty roles, not additional primary personas. | .memory/wiki/specs/ideation/04-opportunities-casting/opportunities-casting-index.md (Q-03/Q-04, A3) |
| run7-06.02-d3-001 | 06-education-lessons-mentorship | **Ratified (2026-08-02):** a fee-paying parent/guardian is a bounded account/counterparty role for child-directed booking, payment, and consent, without general practice-data access. | .memory/wiki/specs/ideation/06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02-teacher-discovery-profiles-trials-cx.md (D-76, A3) |
| R7-ROOT-D2-005 | 15-gear-registry-ownership | **Ratified (2026-08-02):** professional dealer/plugin-developer and dealer-counterparty behavior is a bounded seller account/counterparty role, not a new persona. | .memory/wiki/specs/ideation/15-gear-registry-ownership/gear-registry-ownership-index.md (Q-03, A3) |
| R7-21-D2-001 | 21-promotion-marketing | **Ratified (2026-08-02):** curators, journalists, radio programmers, and DSP editors are off-platform v1 directory/contact and outbound-pitch targets, not an on-platform persona. | .memory/wiki/specs/ideation/21-promotion-marketing/promotion-marketing-index.md (D-09/Q-01, A3) |
| R7-24-RAW-002 | 24-trust-safety-disputes | **Ratified (2026-08-02):** Admin/Moderator is an internal staff role with a separate console and permission boundary, never a public persona or ordinary acting context. | .memory/wiki/specs/ideation/24-trust-safety-disputes/trust-safety-disputes-index.md (Q-03, A3) |

### Safety, legal, and compliance policy

| Finding | Domain | Decision that remains open | Evidence |
|---|---|---|---|
| R7-14-020 | 14-digital-goods-marketplace | **Ratified (2026-08-02):** after 30 calendar days from the recorded split request, pay confirmed shares and hold only the unresolved portion in a non-forfeitable record with a claim path. Silence never reallocates, absorbs, or forfeits the held share. | .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.03-multi-contributor-pack-splits.md (D-07, B1) |
| R7-20.02-002 | 20-fanbase-direct-to-fan | **Counsel-gated (owner decision, 2026-08-02):** no segment-based campaign send or audience export ships until qualified privacy/security review approves the numeric floor and enforcement scope; counts and a fan's own record remain available. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md (D-06, B2) |
| R7-20.04-002 | 20-fanbase-direct-to-fan | **Counsel-gated (owner decision, 2026-08-02):** v1 D2F sales are a compliance-cleared single-payee path only. No multi-party payout, collaborator accrual, held collaborator funds, reserve, or split disbursement launches before qualified approval. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md (D-12, B3) |
| R7-20.06-003 | 20-fanbase-direct-to-fan | **Ratified (2026-08-02):** an immediate browser-local follow has no alert delivery; verified email plus explicit alert consent makes it durable and alert-eligible, and later account creation links the same consented follow without duplication. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.01-artist-tracking-follow.md (D-06/D-08, B4) |
| R7-20.07-003 | 20-fanbase-direct-to-fan | **Counsel-gated (owner decision, 2026-08-02):** demand-map and sparse-cluster disclosure do not ship until qualified privacy/security review approves a numeric floor covering passive density and explicit requests. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.07-fan-demand-show-requests.md (D-05, B2) |
| R7-21-D4-002 | 21-promotion-marketing | **Counsel-gated (owner decision, 2026-08-02):** no private free-text notes about identifiable third parties ship in v1; structured private outcomes only until qualified review approves policy and controls. | .memory/wiki/specs/ideation/21-promotion-marketing/21.03-pitch-targets-crm/21.03.02-private-contact-crm.md (D-05, B5) |
| R7-24-RAW-004 | 24-trust-safety-disputes | **Counsel-gated (owner decision, 2026-08-02):** the fully automatic CSAM action path does not launch before qualified counsel approves a valid, honest, non-disclosing structured Statement-of-Reasons representation. | .memory/wiki/specs/ideation/24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.01-csam-detection-preservation-reporting.md (D-07, B6) |
| R7-24-RAW-005 | 24-trust-safety-disputes | **Counsel-gated (owner decision, 2026-08-02):** v1 crisis handling is resources-only, with no emergency-services contact or escalation state; any future escalation operation requires qualified approval. | .memory/wiki/specs/ideation/24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06.03-crisis-welfare-escalation.md (D-04, B6) |
| R7-24-RAW-006 | 24-trust-safety-disputes | **Counsel-gated (owner decision, 2026-08-02):** v1 uses a documented legal intake, not a self-service law-enforcement portal or 24/7 response promise; expedited/after-hours operation requires qualified approval. | .memory/wiki/specs/ideation/24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.03-law-enforcement-legal-process-portal.md (D-04, B6) |

### Transaction and lifecycle behavior

| Finding | Domain | Decision that remains open | Evidence |
|---|---|---|---|
| R7-01-010 | 01-identity-profiles-organizations | **Resolved under owner autonomy (2026-08-02):** Tier-C counter-attestation alone may create only a provisional claim; it cannot elevate public trust, change ownership, or resolve a contest before independent proof arrives. | .memory/wiki/specs/ideation/01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.02-claim-initiation-proof-methods.md (D-16, C1) |
| R7-02-01-001 | 02-credits-attribution | **Resolved under owner autonomy (2026-08-02):** contested lifts use a 7-day evidence exchange and a 30-day final-decision target; unsupported objections lift, while timely substantiated cases stay embargoed with weekly status and priority review. | .memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md (D-23, C2) |
| run7-06.03-d3-001 | 06-education-lessons-mentorship | **Resolved under owner autonomy (2026-08-02):** guardians see lesson feedback and billing/entitlement facts but never an identifiable child's practice diary; practice data needs separate safeguarding approval to leave the education domain. | .memory/wiki/specs/ideation/06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03.03-practice-logging-streaks-goals.md (D-07, C3) |
| run7-06.04-d3-001 | 06-education-lessons-mentorship | **Resolved under owner autonomy (2026-08-02):** a 14-day pre-material-consumption refund window applies; material consumption is 20% of total lesson duration, with substantiated defect, misrepresentation, and mandatory-law overrides. | .memory/wiki/specs/ideation/06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04.02-course-catalog-pricing-enrollment.md (D-06, C4) |
| RUN7-10-007 | 10-royalties-collections | **Resolved under owner autonomy (2026-08-02):** contradictory terms use a minimal bilateral reconciliation flow with exact conflict display and full affected-counterparty consent; unresolved cases remain held for the later dispute system. | .memory/wiki/specs/ideation/10-royalties-collections/10.03-calculation-recoupment/10.03.02-deal-terms-rate-application.md (D-19, C5) |
| R7-12.04-D3-001 | 12-release-distribution | **Resolved under owner autonomy (2026-08-02):** distribution updates the artist and emits `release.date_changed`; it never directly messages fans. Promotion may message only after artist authorization and applicable follow, pre-save, or release-update consent. Store/pre-save links update independently. | .memory/wiki/specs/ideation/12-release-distribution/12.04-release-scheduling-windows/12.04-release-scheduling-windows-cx.md (D1) |
| R7-12.05-D3-001 | 12-release-distribution | **Resolved under owner autonomy (2026-08-02):** suspension permits only timestamped, claimant-visible additive evidence; it cannot mutate challenged facts, delivery state, or prior evidence. All other mutations remain blocked. | .memory/wiki/specs/ideation/12-release-distribution/12.05-catalog-lifecycle-after-release/12.05.03-involuntary-takedown-suspension.md (D-05) |
| R7-12.05-D3-002 | 12-release-distribution | **Resolved under owner autonomy (2026-08-02):** persist the per-store redelivery plan and prior state before takedown; run it idempotently; incomplete redelivery becomes visible `recovering` and retries only its recorded plan. | .memory/wiki/specs/ideation/12-release-distribution/12.05-catalog-lifecycle-after-release/12.05.02-metadata-update-redelivery.md (D-06) |
| R7-12.06-D3-001 | 12-release-distribution | **Resolved under owner autonomy (2026-08-02):** unresolved recording-ownership conflict blocks new registration on all supported UGC platforms; existing registrations and claims retain platform-specific state; no automatic cross-platform withdrawal occurs without recorded supported remediation. | .memory/wiki/specs/ideation/12-release-distribution/12.06-content-id-ugc-claiming/12.06.03-claim-disputes-ownership-conflicts.md (D-05) |
| R7-12.06-D3-002 | 12-release-distribution | **Resolved under owner autonomy (2026-08-02):** identity, channel, or credit changes derive a proposed whitelist reconciliation; existing entries stay, proposed exclusions are protected while pending, and conflicting registration or claim actions stay blocked until authorized review. | .memory/wiki/specs/ideation/12-release-distribution/12.06-content-id-ugc-claiming/12.06.02-claim-whitelist-management.md (D-05) |
| R7-13-018 | 13-gear-marketplace | **Resolved under owner autonomy (2026-08-02):** a damage claim received before the inspection deadline atomically enters `claim-open` and suspends settlement and title transfer. Settlement resumes only from the withdrawn, rejected, or resolved outcome. | .memory/wiki/specs/ideation/13-gear-marketplace/13.07-gear-logistics-cross-border/13.07.04-shipping-insurance-damage-claims.md (D-07) |
| R7-14-014 | 14-digital-goods-marketplace | **Resolved under owner autonomy (2026-08-02):** rights takedown stops new and archive delivery of the identified asset while preserving its holder record. Excludable packs stay available; inseparable containers are withheld and unaffected entitlements remain recorded. | .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-versioning-updates-legacy-archive.md (D-06) |
| R7-14-015 | 14-digital-goods-marketplace | **Resolved under owner autonomy (2026-08-02):** a required delisted dependency marks a template `dependency unavailable` and stops future completable sales. Existing buyers choose a compatible update or template refund, without an extra external purchase. | .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.03-project-template-catalog-dependency-manifest.md (D-04) |
| R7-14-017 | 14-digital-goods-marketplace | **Resolved under owner autonomy (2026-08-02):** after an approved base refund, a buyer may retain the upgrade only through an explicit, paid disclosed difference; otherwise both refund and revoke. The difference is never silently charged. | .memory/wiki/specs/ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.02-digital-refund-eligibility-adjudication.md (D-15) |
| R7-20.01-002 | 20-fanbase-direct-to-fan | **Resolved under owner autonomy (2026-08-02):** weak-provenance and stale-consent imports remain quarantined from marketing and campaign delivery until fresh recorded consent through a lawful re-permission path. Export/delete remains available. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01.04-fan-list-import-hygiene.md (D-05) |
| R7-20.03-002 | 20-fanbase-direct-to-fan | **Resolved under owner autonomy (2026-08-02):** v1 has no bulk email or comparable broadcast delivery. Delivery stays disabled pending a managed sender, numeric thresholds, ramp curve, and blocklist incident runbook. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md (D-06) |
| R7-20.05-002 | 20-fanbase-direct-to-fan | **Resolved under owner autonomy (2026-08-02):** v1 excludes paid campaign funding; it may show non-binding interest only. Collection, custody, release, and split remain gated on qualified funds-protection approval. | .memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.05-backer-funds-fulfilment.md (D-06) |
| R7-24-RAW-007 | 24-trust-safety-disputes | **Resolved under owner autonomy (2026-08-02):** public reachability is discovery evidence, never authorisation. A human reviews the cited object, claimant authority, and publisher release/licence/authority evidence; unresolved cases remain embargoed. | .memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md (D-24) |

## Completion Rule

This packet is an intake list, not a substitute for source remediation. A finding remains open until its decision is ratified, applied to the owning source, and independently cleared by Run 8.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-76|D-76]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-23|D-23]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-24|D-24]]
