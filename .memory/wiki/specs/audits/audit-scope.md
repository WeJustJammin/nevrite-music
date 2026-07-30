# Audit Scope — Ambiguity Audit

> **Status**: ACTIVE — run 3 EXECUTING (canonical `/audit-ambiguity` skill)
> **Scope**: ideation (vision layer)
> **Enumerated**: 2026-07-30 (re-enumerated at execution; superseded the 2026-07-24 pass)
> **Run type**: fresh post-remediation verification run — the full run `BLOCKER-004` requires
> **Tree state**: post-DQ-R2-01 (D-75 / A′ propagated across 37 files, 2026-07-29)

## Layers To Audit

| Layer | Rubric | Documents |
|-------|--------|-----------|
| Ideation (vision) | `/home/rob/Projects/WeJammin/.claude/skills/pipeline-rubrics/references/vision-rubric.md` | 1122 |

## Rubric Files

- `/home/rob/Projects/WeJammin/.claude/skills/pipeline-rubrics/references/vision-rubric.md`
- `/home/rob/Projects/WeJammin/.claude/skills/pipeline-rubrics/references/scoring.md`

## Enumeration Gate

| Check | Result |
|-------|--------|
| Root | `.memory/wiki/specs/ideation/` |
| Total `.md` files discovered | **1122** |
| Domain folders | 24 |
| `*-index.md` | 190 |
| `*-cx.md` | 190 |
| `meta/*.md` | 6 |
| Audit units (sub-domain granularity) | **191** |
| Unit definition | any directory carrying an `*-index.md` (189), plus `meta/` and the root as one unit each |
| Files per unit | min 2 / max 11 / mean 5.9 |
| Unit-to-file reconciliation | 191 units account for **1,122 / 1,122** files — zero orphans, zero double-counting |
| Below expected threshold? | No — 1,122 matches the recorded tree size and run 2's unit count exactly |
| `surfaces/` scanned | N/A — single-surface project, no `surfaces/` directory |

### Run-3 execution shape

Sharded by domain: 26 shards (24 domains + `meta` + root), each shard audits every unit it
owns through the full 3a→3b→3c cycle, then its findings verify adversarially before the next
shard's results are merged. Cross-layer consistency checks (Step 4) are **not applicable** —
scope is ideation only, not BE/FE/all.

**Data-durability requirement (run-2 regression guard).** Run 2 lost detailed findings for
~134 of 154 scored units because agents wrote them to a session scratchpad that was later
cleaned, returning only one-line summaries. Run 3 requires every finding to be returned as
**structured data** (so it lands in the workflow journal) **and** written to
`.memory/wiki/specs/audits/run3/` — a tracked location, never a scratchpad.

Every discovered file is audited individually through the full 3a→3b→3c cycle.
No sampling, no representative selection, no skipping.

## Freshness / Session-Independence Gate

This is a **remediated rerun**. To satisfy session independence, every document is
audited by an agent with **no access to the prior audit's findings** — auditors are
instructed not to read `.memory/wiki/specs/audits/`. Findings are then adversarially
verified by a second independent pass against source. Nothing is inherited from the
previous run's manifest, ledger, or decision queue.

## Applicable Rubric Dimensions

The vision rubric has 8 dimensions, but not every dimension applies to every document.
`applicable_checkpoints` per the scoring formula excludes N/A dimensions.

| Dimension | Applies to |
|-----------|-----------|
| 1 Problem Clarity | `meta/problem-statement.md`, `ideation-index.md` |
| 2 Persona Specificity | `meta/personas.md`, and any doc with a Role Lens / Role Matrix |
| 3 Feature Completeness | Every feature file, sub-domain index, domain index |
| 4 Constraint Explicitness | `meta/constraints.md`, plus any doc asserting a constraint |
| 5 Success Measurability | Any doc asserting a metric, threshold, or target |
| 6 Competitive Positioning | `meta/competitive-landscape.md`, `ideation-index.md` |
| 7 Open Question Resolution | Every doc with an Open Questions table |
| 8 Structural Compliance | Every index/cx file; tree-level checks at `ideation-index.md` |

## Document List

### 01-identity-profiles-organizations/01.01-person-identity-roles (6)

- `01-identity-profiles-organizations/01.01-person-identity-roles/01.01-person-identity-roles-cx.md`
- `01-identity-profiles-organizations/01.01-person-identity-roles/01.01-person-identity-roles-index.md`
- `01-identity-profiles-organizations/01.01-person-identity-roles/01.01.01-person-record-role-facets.md`
- `01-identity-profiles-organizations/01.01-person-identity-roles/01.01.02-artist-names-aliases-projects.md`
- `01-identity-profiles-organizations/01.01-person-identity-roles/01.01.03-acting-context-switcher.md`
- `01-identity-profiles-organizations/01.01-person-identity-roles/01.01.04-legal-identity-vs-public-identity.md`

### 01-identity-profiles-organizations/01.02-organizations-entity-model (5)

- `01-identity-profiles-organizations/01.02-organizations-entity-model/01.02-organizations-entity-model-cx.md`
- `01-identity-profiles-organizations/01.02-organizations-entity-model/01.02-organizations-entity-model-index.md`
- `01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.01-organization-types-attributes.md`
- `01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.02-organization-creation-lifecycle.md`
- `01-identity-profiles-organizations/01.02-organizations-entity-model/01.02.03-organization-type-transitions.md`

### 01-identity-profiles-organizations/01.03-membership-representation-mandate (5)

- `01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03-membership-representation-mandate-cx.md`
- `01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03-membership-representation-mandate-index.md`
- `01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03.01-membership-records-lifecycle.md`
- `01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03.02-representation-roster-relationships.md`
- `01-identity-profiles-organizations/01.03-membership-representation-mandate/01.03.03-mandate-scope-delegated-authority.md`

### 01-identity-profiles-organizations/01.04-band-ensemble-governance (6)

- `01-identity-profiles-organizations/01.04-band-ensemble-governance/01.04-band-ensemble-governance-cx.md`
- `01-identity-profiles-organizations/01.04-band-ensemble-governance/01.04-band-ensemble-governance-index.md`
- `01-identity-profiles-organizations/01.04-band-ensemble-governance/01.04.01-partnership-terms-decision-rules.md`
- `01-identity-profiles-organizations/01.04-band-ensemble-governance/01.04.02-name-trademark-ownership.md`
- `01-identity-profiles-organizations/01.04-band-ensemble-governance/01.04.03-treasury-mandate.md`
- `01-identity-profiles-organizations/01.04-band-ensemble-governance/01.04.04-dissolution-succession.md`

### 01-identity-profiles-organizations/01.05-profile-claiming-verification (5)

- `01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05-profile-claiming-verification-cx.md`
- `01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05-profile-claiming-verification-index.md`
- `01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.01-shadow-party-creation-invitation.md`
- `01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.02-claim-initiation-proof-methods.md`
- `01-identity-profiles-organizations/01.05-profile-claiming-verification/01.05.03-contested-claims-ownership-transfer.md`

### 01-identity-profiles-organizations/01.06-portfolio-media-epk (5)

- `01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06-portfolio-media-epk-cx.md`
- `01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06-portfolio-media-epk-index.md`
- `01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.01-profile-page-composition.md`
- `01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.02-credit-backed-portfolio.md`
- `01-identity-profiles-organizations/01.06-portfolio-media-epk/01.06.03-epk-generation-sharing.md`

### 01-identity-profiles-organizations/_domain (6)

- `01-identity-profiles-organizations/01.07-professional-credential-verification.md`
- `01-identity-profiles-organizations/01.08-trader-status-classification.md`
- `01-identity-profiles-organizations/01.09-party-identifier-resolution.md`
- `01-identity-profiles-organizations/01.10-estates-legacy-accounts.md`
- `01-identity-profiles-organizations/identity-profiles-organizations-cx.md`
- `01-identity-profiles-organizations/identity-profiles-organizations-index.md`

### 02-credits-attribution/02.01-credit-graph-discography (8)

- `02-credits-attribution/02.01-credit-graph-discography/02.01-credit-graph-discography-cx.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01-credit-graph-discography-index.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01.01-credit-record-contribution-ledger.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01.02-public-discography.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01.03-credit-search-graph-traversal.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01.04-identifier-resolution-duplicate-merge.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md`
- `02-credits-attribution/02.01-credit-graph-discography/02.01.06-credit-correction-amendment.md`

### 02-credits-attribution/02.02-session-capture (6)

- `02-credits-attribution/02.02-session-capture/02.02-session-capture-cx.md`
- `02-credits-attribution/02.02-session-capture/02.02-session-capture-index.md`
- `02-credits-attribution/02.02-session-capture/02.02.01-session-roll-call.md`
- `02-credits-attribution/02.02-session-capture/02.02.02-per-track-contribution-log.md`
- `02-credits-attribution/02.02-session-capture/02.02.03-session-close-capture-prompt.md`
- `02-credits-attribution/02.02-session-capture/02.02.04-session-attendance-proof.md`

### 02-credits-attribution/02.03-claiming-cold-start-seeding (5)

- `02-credits-attribution/02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-cx.md`
- `02-credits-attribution/02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md`
- `02-credits-attribution/02.03-claiming-cold-start-seeding/02.03.01-external-catalog-import.md`
- `02-credits-attribution/02.03-claiming-cold-start-seeding/02.03.02-claim-inbox-suggested-claims.md`
- `02-credits-attribution/02.03-claiming-cold-start-seeding/02.03.03-claim-adjudication.md`

### 02-credits-attribution/02.04-attestation-credit-confidence (6)

- `02-credits-attribution/02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-cx.md`
- `02-credits-attribution/02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md`
- `02-credits-attribution/02.04-attestation-credit-confidence/02.04.01-attestation-request-confirmation.md`
- `02-credits-attribution/02.04-attestation-credit-confidence/02.04.02-provenance-tiers-credit-confidence.md`
- `02-credits-attribution/02.04-attestation-credit-confidence/02.04.03-attestation-retraction.md`
- `02-credits-attribution/02.04-attestation-credit-confidence/02.04.04-attestation-ring-collusion-detection.md`

### 02-credits-attribution/_domain (8)

- `02-credits-attribution/02.05-credit-dispute-resolution.md`
- `02-credits-attribution/02.06-credit-role-instrument-taxonomy.md`
- `02-credits-attribution/02.07-union-performer-session-reporting.md`
- `02-credits-attribution/02.08-credit-export-ddex-rin.md`
- `02-credits-attribution/02.09-gear-credit-linkage.md`
- `02-credits-attribution/02.10-ai-contribution-disclosure.md`
- `02-credits-attribution/credits-attribution-cx.md`
- `02-credits-attribution/credits-attribution-index.md`

### 03-community-networking/03.01-connections-follows-endorsements (5)

- `03-community-networking/03.01-connections-follows-endorsements/03.01-connections-follows-endorsements-cx.md`
- `03-community-networking/03.01-connections-follows-endorsements/03.01-connections-follows-endorsements-index.md`
- `03-community-networking/03.01-connections-follows-endorsements/03.01.01-follows.md`
- `03-community-networking/03.01-connections-follows-endorsements/03.01.02-professional-connections.md`
- `03-community-networking/03.01-connections-follows-endorsements/03.01.03-endorsements-skill-vouching.md`

### 03-community-networking/03.02-activity-feed-ranking (5)

- `03-community-networking/03.02-activity-feed-ranking/03.02-activity-feed-ranking-cx.md`
- `03-community-networking/03.02-activity-feed-ranking/03.02-activity-feed-ranking-index.md`
- `03-community-networking/03.02-activity-feed-ranking/03.02.01-feed-composition-event-sources.md`
- `03-community-networking/03.02-activity-feed-ranking/03.02.02-ranking-relevance-controls.md`
- `03-community-networking/03.02-activity-feed-ranking/03.02.03-native-posts-reactions.md`

### 03-community-networking/03.03-collaborator-discovery-matchmaking (6)

- `03-community-networking/03.03-collaborator-discovery-matchmaking/03.03-collaborator-discovery-matchmaking-cx.md`
- `03-community-networking/03.03-collaborator-discovery-matchmaking/03.03-collaborator-discovery-matchmaking-index.md`
- `03-community-networking/03.03-collaborator-discovery-matchmaking/03.03.01-collaborator-search-browse.md`
- `03-community-networking/03.03-collaborator-discovery-matchmaking/03.03.02-match-scoring-fit-signals.md`
- `03-community-networking/03.03-collaborator-discovery-matchmaking/03.03.03-open-to-status-availability-signals.md`
- `03-community-networking/03.03-collaborator-discovery-matchmaking/03.03.04-open-collaboration-calls.md`

### 03-community-networking/03.04-warm-intros-collaboration-graph (6)

- `03-community-networking/03.04-warm-intros-collaboration-graph/03.04-warm-intros-collaboration-graph-cx.md`
- `03-community-networking/03.04-warm-intros-collaboration-graph/03.04-warm-intros-collaboration-graph-index.md`
- `03-community-networking/03.04-warm-intros-collaboration-graph/03.04.01-collaboration-graph-path-finding.md`
- `03-community-networking/03.04-warm-intros-collaboration-graph/03.04.02-warm-intro-requests-brokering.md`
- `03-community-networking/03.04-warm-intros-collaboration-graph/03.04.03-referral-recommendation-requests.md`
- `03-community-networking/03.04-warm-intros-collaboration-graph/03.04.04-reachability-inbound-policy.md`

### 03-community-networking/03.05-private-rolodex-crm (5)

- `03-community-networking/03.05-private-rolodex-crm/03.05-private-rolodex-crm-cx.md`
- `03-community-networking/03.05-private-rolodex-crm/03.05-private-rolodex-crm-index.md`
- `03-community-networking/03.05-private-rolodex-crm/03.05.01-contact-records-shadow-contacts.md`
- `03-community-networking/03.05-private-rolodex-crm/03.05.02-private-notes-tags-lists.md`
- `03-community-networking/03.05-private-rolodex-crm/03.05.03-follow-ups-reminders.md`

### 03-community-networking/03.06-scenes-communities (6)

- `03-community-networking/03.06-scenes-communities/03.06-scenes-communities-cx.md`
- `03-community-networking/03.06-scenes-communities/03.06-scenes-communities-index.md`
- `03-community-networking/03.06-scenes-communities/03.06.01-scene-definition-membership.md`
- `03-community-networking/03.06-scenes-communities/03.06.02-scene-graph-density-map.md`
- `03-community-networking/03.06-scenes-communities/03.06.03-scene-stewardship-moderation.md`
- `03-community-networking/03.06-scenes-communities/03.06.04-scene-seeding-claiming-cold-start.md`

### 03-community-networking/03.08-contests-challenges-beat-battles (6)

- `03-community-networking/03.08-contests-challenges-beat-battles/03.08-contests-challenges-beat-battles-cx.md`
- `03-community-networking/03.08-contests-challenges-beat-battles/03.08-contests-challenges-beat-battles-index.md`
- `03-community-networking/03.08-contests-challenges-beat-battles/03.08.01-contest-creation-briefs.md`
- `03-community-networking/03.08-contests-challenges-beat-battles/03.08.02-submissions-eligibility.md`
- `03-community-networking/03.08-contests-challenges-beat-battles/03.08.03-judging-voting-anti-gaming.md`
- `03-community-networking/03.08-contests-challenges-beat-battles/03.08.04-prizes-payouts-submission-rights.md`

### 03-community-networking/_domain (6)

- `03-community-networking/03.07-forums-craft-qa.md`
- `03-community-networking/03.09-local-jam-open-mic-discovery.md`
- `03-community-networking/03.10-peer-scene-listening-rooms.md`
- `03-community-networking/03.11-conference-event-networking-mode.md`
- `03-community-networking/community-networking-cx.md`
- `03-community-networking/community-networking-index.md`

### 04-opportunities-casting/04.01-opportunity-posting-targeting (6)

- `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01-opportunity-posting-targeting-cx.md`
- `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01-opportunity-posting-targeting-index.md`
- `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.01-opportunity-post-type-taxonomy.md`
- `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.02-targeting-distribution-controls.md`
- `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.03-compensation-spec-work-guardrails.md`
- `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.04-eligibility-requirement-criteria.md`

### 04-opportunities-casting/04.02-discovery-matching-alerts (6)

- `04-opportunities-casting/04.02-discovery-matching-alerts/04.02-discovery-matching-alerts-cx.md`
- `04-opportunities-casting/04.02-discovery-matching-alerts/04.02-discovery-matching-alerts-index.md`
- `04-opportunities-casting/04.02-discovery-matching-alerts/04.02.01-opportunity-board-search.md`
- `04-opportunities-casting/04.02-discovery-matching-alerts/04.02.02-availability-geo-aware-matching.md`
- `04-opportunities-casting/04.02-discovery-matching-alerts/04.02.03-material-aware-dep-matching.md`
- `04-opportunities-casting/04.02-discovery-matching-alerts/04.02.04-alert-subscriptions-delivery.md`

### 04-opportunities-casting/04.03-submission-audition (7)

- `04-opportunities-casting/04.03-submission-audition/04.03-submission-audition-cx.md`
- `04-opportunities-casting/04.03-submission-audition/04.03-submission-audition-index.md`
- `04-opportunities-casting/04.03-submission-audition/04.03.01-structured-submission.md`
- `04-opportunities-casting/04.03-submission-audition/04.03.02-evidence-backed-application.md`
- `04-opportunities-casting/04.03-submission-audition/04.03.03-audition-tasks-media-submission.md`
- `04-opportunities-casting/04.03-submission-audition/04.03.04-blind-review-mode.md`
- `04-opportunities-casting/04.03-submission-audition/04.03.05-outbound-pitch-unsolicited.md`

### 04-opportunities-casting/04.04-triage-shortlist-decisioning (6)

- `04-opportunities-casting/04.04-triage-shortlist-decisioning/04.04-triage-shortlist-decisioning-cx.md`
- `04-opportunities-casting/04.04-triage-shortlist-decisioning/04.04-triage-shortlist-decisioning-index.md`
- `04-opportunities-casting/04.04-triage-shortlist-decisioning/04.04.01-review-queue-triage.md`
- `04-opportunities-casting/04.04-triage-shortlist-decisioning/04.04.02-shortlist-multi-reviewer-scoring.md`
- `04-opportunities-casting/04.04-triage-shortlist-decisioning/04.04.03-offer-acceptance.md`
- `04-opportunities-casting/04.04-triage-shortlist-decisioning/04.04.04-urgent-fill-first-accept-cascade.md`

### 04-opportunities-casting/04.05-outcome-response-handoff (6)

- `04-opportunities-casting/04.05-outcome-response-handoff/04.05-outcome-response-handoff-cx.md`
- `04-opportunities-casting/04.05-outcome-response-handoff/04.05-outcome-response-handoff-index.md`
- `04-opportunities-casting/04.05-outcome-response-handoff/04.05.01-disposition-close-out-obligation.md`
- `04-opportunities-casting/04.05-outcome-response-handoff/04.05.02-response-reputation-signals.md`
- `04-opportunities-casting/04.05-outcome-response-handoff/04.05.03-won-opportunity-handoff.md`
- `04-opportunities-casting/04.05-outcome-response-handoff/04.05.04-applicant-pipeline-history.md`

### 04-opportunities-casting/_domain (4)

- `04-opportunities-casting/04.06-band-member-wanted.md`
- `04-opportunities-casting/04.07-open-calls-festival-showcase-competition.md`
- `04-opportunities-casting/opportunities-casting-cx.md`
- `04-opportunities-casting/opportunities-casting-index.md`

### 05-services-marketplace/05.01-service-listings-pricing (9)

- `05-services-marketplace/05.01-service-listings-pricing/05.01-service-listings-pricing-cx.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01-service-listings-pricing-index.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.01-service-listings-packages-rate-cards.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.02-service-category-taxonomy-attributes.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.03-music-pricing-model-library.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.04-rate-benchmarking-price-transparency.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.05-remote-vs-on-location-service-mode.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.06-turnaround-rush-service-levels.md`
- `05-services-marketplace/05.01-service-listings-pricing/05.01.07-seller-capacity-queue-intake-limits.md`

### 05-services-marketplace/05.02-quotes-scope-contracting (5)

- `05-services-marketplace/05.02-quotes-scope-contracting/05.02-quotes-scope-contracting-cx.md`
- `05-services-marketplace/05.02-quotes-scope-contracting/05.02-quotes-scope-contracting-index.md`
- `05-services-marketplace/05.02-quotes-scope-contracting/05.02.01-custom-quotes-proposals-scope.md`
- `05-services-marketplace/05.02-quotes-scope-contracting/05.02.02-nda-confidentiality-ghost-production.md`
- `05-services-marketplace/05.02-quotes-scope-contracting/05.02.03-union-session-contracting.md`

### 05-services-marketplace/05.03-engagement-lifecycle (8)

- `05-services-marketplace/05.03-engagement-lifecycle/05.03-engagement-lifecycle-cx.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03-engagement-lifecycle-index.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03.01-order-lifecycle-requirements-gating.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03.02-milestones-staged-deliverables.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03.03-revisions-limits-change-orders.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03.04-retainers-recurring-engagements.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03.05-cancellation-abandonment-kill-fee.md`
- `05-services-marketplace/05.03-engagement-lifecycle/05.03.06-post-delivery-support-recall.md`

### 05-services-marketplace/05.04-delivery-qc-acceptance (6)

- `05-services-marketplace/05.04-delivery-qc-acceptance/05.04-delivery-qc-acceptance-cx.md`
- `05-services-marketplace/05.04-delivery-qc-acceptance/05.04-delivery-qc-acceptance-index.md`
- `05-services-marketplace/05.04-delivery-qc-acceptance/05.04.01-delivery-acceptance-auto-accept.md`
- `05-services-marketplace/05.04-delivery-qc-acceptance/05.04.02-deliverable-spec-automated-audio-qc.md`
- `05-services-marketplace/05.04-delivery-qc-acceptance/05.04.03-watermarked-previews-draft-protection.md`
- `05-services-marketplace/05.04-delivery-qc-acceptance/05.04.04-source-file-session-handover.md`

### 05-services-marketplace/05.05-multi-party-supply (6)

- `05-services-marketplace/05.05-multi-party-supply/05.05-multi-party-supply-cx.md`
- `05-services-marketplace/05.05-multi-party-supply/05.05-multi-party-supply-index.md`
- `05-services-marketplace/05.05-multi-party-supply/05.05.01-deps-substitutes-emergency-cover.md`
- `05-services-marketplace/05.05-multi-party-supply/05.05.02-fixers-ensemble-contracting.md`
- `05-services-marketplace/05.05-multi-party-supply/05.05.03-subcontracting-agency-brokered-engagements.md`
- `05-services-marketplace/05.05-multi-party-supply/05.05.04-multi-seller-bundles-curated-packages.md`

### 05-services-marketplace/05.06-rights-warranties-transfer (7)

- `05-services-marketplace/05.06-rights-warranties-transfer/05.06-rights-warranties-transfer-cx.md`
- `05-services-marketplace/05.06-rights-warranties-transfer/05.06-rights-warranties-transfer-index.md`
- `05-services-marketplace/05.06-rights-warranties-transfer/05.06.01-engagement-rights-posture.md`
- `05-services-marketplace/05.06-rights-warranties-transfer/05.06.02-producer-points-backend-participation.md`
- `05-services-marketplace/05.06-rights-warranties-transfer/05.06.03-rights-transfer-split-execution.md`
- `05-services-marketplace/05.06-rights-warranties-transfer/05.06.04-sample-clearance-originality-warranty.md`
- `05-services-marketplace/05.06-rights-warranties-transfer/05.06.05-ai-disclosure-human-performance-warranty.md`

### 05-services-marketplace/05.07-custodial-physical-services (5)

- `05-services-marketplace/05.07-custodial-physical-services/05.07-custodial-physical-services-cx.md`
- `05-services-marketplace/05.07-custodial-physical-services/05.07-custodial-physical-services-index.md`
- `05-services-marketplace/05.07-custodial-physical-services/05.07.01-repair-tech-luthier-job-flow.md`
- `05-services-marketplace/05.07-custodial-physical-services/05.07.02-third-party-inspection-verification.md`
- `05-services-marketplace/05.07-custodial-physical-services/05.07.03-custody-chain-liability-damage-claims.md`

### 05-services-marketplace/_domain (2)

- `05-services-marketplace/services-marketplace-cx.md`
- `05-services-marketplace/services-marketplace-index.md`

### 06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery (6)

- `06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery/06.01-lesson-booking-packages-delivery-cx.md`
- `06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery/06.01-lesson-booking-packages-delivery-index.md`
- `06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery/06.01.01-lesson-slot-booking-recurring-series.md`
- `06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery/06.01.02-lesson-packages-credits-rate-cards.md`
- `06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery/06.01.03-cancellation-makeup-no-show-policy.md`
- `06-education-lessons-mentorship/06.01-lesson-booking-packages-delivery/06.01.04-lesson-delivery-session-record.md`

### 06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials (6)

- `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02-teacher-discovery-profiles-trials-cx.md`
- `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02-teacher-discovery-profiles-trials-index.md`
- `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02.01-teacher-tuition-profile.md`
- `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02.02-verified-credentials-credit-backed-credibility.md`
- `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02.03-teacher-discovery-match-criteria.md`
- `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02.04-trial-lessons-conversion.md`

### 06-education-lessons-mentorship/06.03-curriculum-assignments-practice (7)

- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03-curriculum-assignments-practice-cx.md`
- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03-curriculum-assignments-practice-index.md`
- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03.01-curriculum-lesson-plans.md`
- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03.02-assignments-submissions-timestamped-feedback.md`
- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03.03-practice-logging-streaks-goals.md`
- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03.04-practice-room-tools.md`
- `06-education-lessons-mentorship/06.03-curriculum-assignments-practice/06.03.05-progress-reports-skill-tracking.md`

### 06-education-lessons-mentorship/06.04-course-marketplace-authoring (5)

- `06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04-course-marketplace-authoring-cx.md`
- `06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04-course-marketplace-authoring-index.md`
- `06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04.01-course-authoring-publishing.md`
- `06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04.02-course-catalog-pricing-enrollment.md`
- `06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04.03-course-consumption-completion.md`

### 06-education-lessons-mentorship/_domain (9)

- `06-education-lessons-mentorship/06.05-group-lessons-workshops-masterclasses.md`
- `06-education-lessons-mentorship/06.06-mentorship-programmes.md`
- `06-education-lessons-mentorship/06.07-learning-paths.md`
- `06-education-lessons-mentorship/06.08-certificates-badges-verification.md`
- `06-education-lessons-mentorship/06.09-exam-board-alignment.md`
- `06-education-lessons-mentorship/06.10-academy-multi-teacher-operations.md`
- `06-education-lessons-mentorship/06.11-music-therapy-practice.md`
- `06-education-lessons-mentorship/education-lessons-mentorship-cx.md`
- `06-education-lessons-mentorship/education-lessons-mentorship-index.md`

### 07-music-projects-collaboration/07.01-song-release-production-board (5)

- `07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-cx.md`
- `07-music-projects-collaboration/07.01-song-release-production-board/07.01-song-release-production-board-index.md`
- `07-music-projects-collaboration/07.01-song-release-production-board/07.01.01-song-record-work-entity.md`
- `07-music-projects-collaboration/07.01-song-release-production-board/07.01.02-release-container-sequencing-assembly.md`
- `07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md`

### 07-music-projects-collaboration/07.02-songwriting-composition-workspace (5)

- `07-music-projects-collaboration/07.02-songwriting-composition-workspace/07.02-songwriting-composition-workspace-cx.md`
- `07-music-projects-collaboration/07.02-songwriting-composition-workspace/07.02-songwriting-composition-workspace-index.md`
- `07-music-projects-collaboration/07.02-songwriting-composition-workspace/07.02.01-idea-capture-inbox.md`
- `07-music-projects-collaboration/07.02-songwriting-composition-workspace/07.02.02-lyric-workspace-per-line-attribution.md`
- `07-music-projects-collaboration/07.02-songwriting-composition-workspace/07.02.03-chord-arrangement-chart-workspace.md`

### 07-music-projects-collaboration/07.03-contributors-access-confidentiality (5)

- `07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-cx.md`
- `07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03-contributors-access-confidentiality-index.md`
- `07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.01-contributor-roster-role-assignment.md`
- `07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.02-contributor-invitation-scoped-onboarding.md`
- `07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.03-rights-aware-asset-vault-nda-gating.md`

### 07-music-projects-collaboration/07.04-audio-version-control-lineage (8)

- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04-audio-version-control-lineage-cx.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04-audio-version-control-lineage-index.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.01-audio-version-control-lineage-timeline.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.02-canonical-version-resolver.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.03-take-comp-management.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.04-stem-export-standards-naming.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.05-file-integrity-missing-media.md`
- `07-music-projects-collaboration/07.04-audio-version-control-lineage/07.04.06-stem-player-version-ab-compare.md`

### 07-music-projects-collaboration/07.05-review-feedback-approval (7)

- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05-review-feedback-approval-cx.md`
- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05-review-feedback-approval-index.md`
- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05.01-timestamped-waveform-review.md`
- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05.02-private-share-links-listen-analytics.md`
- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05.03-feedback-consolidation-triage.md`
- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05.04-approval-gates-signoff-trail.md`
- `07-music-projects-collaboration/07.05-review-feedback-approval/07.05.05-revision-round-counting-scope.md`

### 07-music-projects-collaboration/07.06-sessions-documentation-recall (6)

- `07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06-sessions-documentation-recall-cx.md`
- `07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06-sessions-documentation-recall-index.md`
- `07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06.01-session-record-attendance.md`
- `07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06.02-session-close-capture-prompt.md`
- `07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06.03-session-snapshot-archival-manifest.md`
- `07-music-projects-collaboration/07.06-sessions-documentation-recall/07.06.04-track-sheet-channel-map-recall.md`

### 07-music-projects-collaboration/07.07-mix-master-workflow (7)

- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07-mix-master-workflow-cx.md`
- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07-mix-master-workflow-index.md`
- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07.01-mix-brief-reference-board.md`
- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07.02-alternate-version-matrix.md`
- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07.03-mastering-workflow-loudness-targets.md`
- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07.04-format-specific-masters.md`
- `07-music-projects-collaboration/07.07-mix-master-workflow/07.07.05-immersive-atmos-deliverables.md`

### 07-music-projects-collaboration/07.08-delivery-readiness-qc (7)

- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-cx.md`
- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08-delivery-readiness-qc-index.md`
- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.01-handoff-package-builder-recipient-spec.md`
- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.02-automated-audio-qc-spec-validation.md`
- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.03-metadata-completeness-readiness-score.md`
- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.04-source-declaration-samples-ai.md`
- `07-music-projects-collaboration/07.08-delivery-readiness-qc/07.08.05-remix-stems-delivery-programs.md`

### 07-music-projects-collaboration/07.09-daw-bridge-capture-at-source (5)

- `07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09-daw-bridge-capture-at-source-cx.md`
- `07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09-daw-bridge-capture-at-source-index.md`
- `07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09.01-bounce-watch-folder-auto-ingest.md`
- `07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09.02-daw-session-parsing-track-mapping.md`
- `07-music-projects-collaboration/07.09-daw-bridge-capture-at-source/07.09.03-in-session-capture-surface.md`

### 07-music-projects-collaboration/_domain (2)

- `07-music-projects-collaboration/music-projects-collaboration-cx.md`
- `07-music-projects-collaboration/music-projects-collaboration-index.md`

### 08-realtime-jamming-remote-sessions/08.01-latency-budget-playability (5)

- `08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01-latency-budget-playability-cx.md`
- `08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01-latency-budget-playability-index.md`
- `08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01.01-latency-measurement-decomposition.md`
- `08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01.02-playability-verdict-tempo-ceiling.md`
- `08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01.03-shared-clock-click-countin.md`

### 08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching (5)

- `08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-cx.md`
- `08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md`
- `08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02.01-playable-radius-map-discovery.md`
- `08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02.02-route-aware-radius-correction.md`
- `08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02.03-latency-aware-match-filter.md`

### 08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance (6)

- `08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-cx.md`
- `08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md`
- `08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03.01-hifi-monitor-stream-quality-contract.md`
- `08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03.02-listener-roster-invite-access.md`
- `08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03.03-live-listener-feedback-notes.md`
- `08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03.04-monitoring-trust-playback-context.md`

### 08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes (5)

- `08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-cx.md`
- `08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-index.md`
- `08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04.01-talkback-channel-ducking.md`
- `08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04.02-per-performer-cue-mixes.md`
- `08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04.03-cue-mix-recall-portable-profile.md`

### 08-realtime-jamming-remote-sessions/08.05-session-capture-recall (6)

- `08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05-session-capture-recall-cx.md`
- `08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05-session-capture-recall-index.md`
- `08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05.01-local-first-multitrack-capture.md`
- `08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05.02-take-alignment-drift-correction.md`
- `08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05.03-auto-highlights-moment-flagging.md`
- `08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05.04-session-attendance-provenance.md`

### 08-realtime-jamming-remote-sessions/_domain (5)

- `08-realtime-jamming-remote-sessions/08.06-session-preflight-rig-readiness.md`
- `08-realtime-jamming-remote-sessions/08.07-overdub-mode.md`
- `08-realtime-jamming-remote-sessions/08.08-interruption-reconnect-continuity.md`
- `08-realtime-jamming-remote-sessions/realtime-jamming-remote-sessions-cx.md`
- `08-realtime-jamming-remote-sessions/realtime-jamming-remote-sessions-index.md`

### 09-rights-ownership/09.01-rights-registry (8)

- `09-rights-ownership/09.01-rights-registry/09.01-rights-registry-cx.md`
- `09-rights-ownership/09.01-rights-registry/09.01-rights-registry-index.md`
- `09-rights-ownership/09.01-rights-registry/09.01.01-work-recording-duality.md`
- `09-rights-ownership/09.01-rights-registry/09.01.02-ownership-ledger-validation.md`
- `09-rights-ownership/09.01-rights-registry/09.01.03-master-rights-ownership.md`
- `09-rights-ownership/09.01-rights-registry/09.01.04-publishing-rights.md`
- `09-rights-ownership/09.01-rights-registry/09.01.05-performer-neighbouring-rights.md`
- `09-rights-ownership/09.01-rights-registry/09.01.06-sample-interpolation-provenance.md`

### 09-rights-ownership/09.02-split-capture-agreements (6)

- `09-rights-ownership/09.02-split-capture-agreements/09.02-split-capture-agreements-cx.md`
- `09-rights-ownership/09.02-split-capture-agreements/09.02-split-capture-agreements-index.md`
- `09-rights-ownership/09.02-split-capture-agreements/09.02.01-moment-of-creation-split-capture.md`
- `09-rights-ownership/09.02-split-capture-agreements/09.02.02-producer-points-agreements.md`
- `09-rights-ownership/09.02-split-capture-agreements/09.02.03-work-for-hire-buyout.md`
- `09-rights-ownership/09.02-split-capture-agreements/09.02.04-split-amendment-reconsent.md`

### 09-rights-ownership/09.03-chain-of-title-lifecycle (8)

- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03-chain-of-title-lifecycle-cx.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03-chain-of-title-lifecycle-index.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.01-chain-of-title-ledger.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.02-term-territory-reversion.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.03-termination-rights-notice-windows.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.04-estate-succession-catalog-legacy.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.05-copyright-term-public-domain.md`
- `09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.06-moral-rights-attribution.md`

### 09-rights-ownership/09.04-rights-conflicts-disputes (5)

- `09-rights-ownership/09.04-rights-conflicts-disputes/09.04-rights-conflicts-disputes-cx.md`
- `09-rights-ownership/09.04-rights-conflicts-disputes/09.04-rights-conflicts-disputes-index.md`
- `09-rights-ownership/09.04-rights-conflicts-disputes/09.04.01-conflicting-claim-detection.md`
- `09-rights-ownership/09.04-rights-conflicts-disputes/09.04.02-split-ownership-dispute-cases.md`
- `09-rights-ownership/09.04-rights-conflicts-disputes/09.04.03-rights-freeze-royalty-escrow.md`

### 09-rights-ownership/09.05-ai-voice-likeness-consent (5)

- `09-rights-ownership/09.05-ai-voice-likeness-consent/09.05-ai-voice-likeness-consent-cx.md`
- `09-rights-ownership/09.05-ai-voice-likeness-consent/09.05-ai-voice-likeness-consent-index.md`
- `09-rights-ownership/09.05-ai-voice-likeness-consent/09.05.01-ai-training-consent-registry.md`
- `09-rights-ownership/09.05-ai-voice-likeness-consent/09.05.02-voice-name-likeness-rights.md`
- `09-rights-ownership/09.05-ai-voice-likeness-consent/09.05.03-ai-generated-content-disclosure.md`

### 09-rights-ownership/09.06-rights-evidence-public-record (6)

- `09-rights-ownership/09.06-rights-evidence-public-record/09.06-rights-evidence-public-record-cx.md`
- `09-rights-ownership/09.06-rights-evidence-public-record/09.06-rights-evidence-public-record-index.md`
- `09-rights-ownership/09.06-rights-evidence-public-record/09.06.01-identifier-issuance-reconciliation.md`
- `09-rights-ownership/09.06-rights-evidence-public-record/09.06.02-proof-of-creation-timestamping.md`
- `09-rights-ownership/09.06-rights-evidence-public-record/09.06.03-copyright-office-registration.md`
- `09-rights-ownership/09.06-rights-evidence-public-record/09.06.04-public-rights-lookup.md`

### 09-rights-ownership/_domain (2)

- `09-rights-ownership/rights-ownership-cx.md`
- `09-rights-ownership/rights-ownership-index.md`

### 10-royalties-collections/10.01-society-registration-delivery (9)

- `10-royalties-collections/10.01-society-registration-delivery/10.01-society-registration-delivery-cx.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01-society-registration-delivery-index.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.01-society-affiliation-party-identifiers.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.02-work-registration-payload-validation.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.03-cwr-society-file-exchange.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.04-registration-status-rejection-loop.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.05-mechanical-rights-administration.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.06-neighbouring-rights-performer-registration.md`
- `10-royalties-collections/10.01-society-registration-delivery/10.01.07-sub-publishing-territory-administration.md`

### 10-royalties-collections/10.02-statement-ingestion-normalization (7)

- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-cx.md`
- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md`
- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02.01-statement-source-ingestion.md`
- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02.02-statement-parsing-format-adapters.md`
- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02.03-line-matching-catalogue-resolution.md`
- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02.04-currency-fx-period-normalization.md`
- `10-royalties-collections/10.02-statement-ingestion-normalization/10.02.05-unmatched-line-exception-queue.md`

### 10-royalties-collections/10.03-calculation-recoupment (6)

- `10-royalties-collections/10.03-calculation-recoupment/10.03-calculation-recoupment-cx.md`
- `10-royalties-collections/10.03-calculation-recoupment/10.03-calculation-recoupment-index.md`
- `10-royalties-collections/10.03-calculation-recoupment/10.03.01-royalty-calculation-engine.md`
- `10-royalties-collections/10.03-calculation-recoupment/10.03.02-deal-terms-rate-application.md`
- `10-royalties-collections/10.03-calculation-recoupment/10.03.03-advances-recoupment-position.md`
- `10-royalties-collections/10.03-calculation-recoupment/10.03.04-restatement-adjustment-overpayment.md`

### 10-royalties-collections/10.04-disbursement-payee-statements (6)

- `10-royalties-collections/10.04-disbursement-payee-statements/10.04-disbursement-payee-statements-cx.md`
- `10-royalties-collections/10.04-disbursement-payee-statements/10.04-disbursement-payee-statements-index.md`
- `10-royalties-collections/10.04-disbursement-payee-statements/10.04.01-royalty-payout-run.md`
- `10-royalties-collections/10.04-disbursement-payee-statements/10.04.02-payee-royalty-statements.md`
- `10-royalties-collections/10.04-disbursement-payee-statements/10.04.03-thresholds-holds-unpayable-balances.md`
- `10-royalties-collections/10.04-disbursement-payee-statements/10.04.04-disputed-royalty-escrow.md`

### 10-royalties-collections/10.05-recovery-leakage (5)

- `10-royalties-collections/10.05-recovery-leakage/10.05-recovery-leakage-cx.md`
- `10-royalties-collections/10.05-recovery-leakage/10.05-recovery-leakage-index.md`
- `10-royalties-collections/10.05-recovery-leakage/10.05.01-black-box-unclaimed-search.md`
- `10-royalties-collections/10.05-recovery-leakage/10.05.02-claim-submission-evidence-pack.md`
- `10-royalties-collections/10.05-recovery-leakage/10.05.03-royalty-leakage-detection.md`

### 10-royalties-collections/_domain (7)

- `10-royalties-collections/10.06-live-setlist-pro-reporting.md`
- `10-royalties-collections/10.07-cue-sheets-broadcast-reporting.md`
- `10-royalties-collections/10.08-statement-disputes-audit-rights.md`
- `10-royalties-collections/10.09-distribution-calendar-money-in-flight.md`
- `10-royalties-collections/10.10-royalty-forecasting.md`
- `10-royalties-collections/royalties-collections-cx.md`
- `10-royalties-collections/royalties-collections-index.md`

### 11-music-licensing/11.01-sync-licensing (7)

- `11-music-licensing/11.01-sync-licensing/11.01-sync-licensing-cx.md`
- `11-music-licensing/11.01-sync-licensing/11.01-sync-licensing-index.md`
- `11-music-licensing/11.01-sync-licensing/11.01.01-sync-catalogue-tagging.md`
- `11-music-licensing/11.01-sync-licensing/11.01.02-supervisor-search-reference-matching.md`
- `11-music-licensing/11.01-sync-licensing/11.01.03-sync-briefs-pitching.md`
- `11-music-licensing/11.01-sync-licensing/11.01.04-holds-exclusivity-windows.md`
- `11-music-licensing/11.01-sync-licensing/11.01.05-dual-licence-coordination.md`

### 11-music-licensing/11.02-clearance-one-stop-status (6)

- `11-music-licensing/11.02-clearance-one-stop-status/11.02-clearance-one-stop-status-cx.md`
- `11-music-licensing/11.02-clearance-one-stop-status/11.02-clearance-one-stop-status-index.md`
- `11-music-licensing/11.02-clearance-one-stop-status/11.02.01-clearance-computation-one-stop.md`
- `11-music-licensing/11.02-clearance-one-stop-status/11.02.02-catalogue-completeness-attestation.md`
- `11-music-licensing/11.02-clearance-one-stop-status/11.02.03-encumbrance-declaration.md`
- `11-music-licensing/11.02-clearance-one-stop-status/11.02.04-multi-party-consent-routing.md`

### 11-music-licensing/11.03-licence-pricing-negotiation (5)

- `11-music-licensing/11.03-licence-pricing-negotiation/11.03-licence-pricing-negotiation-cx.md`
- `11-music-licensing/11.03-licence-pricing-negotiation/11.03-licence-pricing-negotiation-index.md`
- `11-music-licensing/11.03-licence-pricing-negotiation/11.03.01-rate-cards-pricing-rules.md`
- `11-music-licensing/11.03-licence-pricing-negotiation/11.03.02-quote-requests-negotiation.md`
- `11-music-licensing/11.03-licence-pricing-negotiation/11.03.03-most-favoured-nation.md`

### 11-music-licensing/11.04-licensing-policy-preferences (5)

- `11-music-licensing/11.04-licensing-policy-preferences/11.04-licensing-policy-preferences-cx.md`
- `11-music-licensing/11.04-licensing-policy-preferences/11.04-licensing-policy-preferences-index.md`
- `11-music-licensing/11.04-licensing-policy-preferences/11.04.01-per-work-licensing-policy.md`
- `11-music-licensing/11.04-licensing-policy-preferences/11.04.02-co-owner-veto-approval.md`
- `11-music-licensing/11.04-licensing-policy-preferences/11.04.03-policy-conflict-resolution.md`

### 11-music-licensing/11.05-sample-derivative-clearance (7)

- `11-music-licensing/11.05-sample-derivative-clearance/11.05-sample-derivative-clearance-cx.md`
- `11-music-licensing/11.05-sample-derivative-clearance/11.05-sample-derivative-clearance-index.md`
- `11-music-licensing/11.05-sample-derivative-clearance/11.05.01-sample-declaration-identification.md`
- `11-music-licensing/11.05-sample-derivative-clearance/11.05.02-programmatic-instant-clearance.md`
- `11-music-licensing/11.05-sample-derivative-clearance/11.05.03-negotiated-clearance-revenue-share.md`
- `11-music-licensing/11.05-sample-derivative-clearance/11.05.04-interpolation-replay-clearance.md`
- `11-music-licensing/11.05-sample-derivative-clearance/11.05.05-remix-stem-bootleg-licensing.md`

### 11-music-licensing/11.06-creator-micro-licensing (6)

- `11-music-licensing/11.06-creator-micro-licensing/11.06-creator-micro-licensing-cx.md`
- `11-music-licensing/11.06-creator-micro-licensing/11.06-creator-micro-licensing-index.md`
- `11-music-licensing/11.06-creator-micro-licensing/11.06.01-creator-licence-catalogue.md`
- `11-music-licensing/11.06-creator-micro-licensing/11.06.02-content-id-whitelisting.md`
- `11-music-licensing/11.06-creator-micro-licensing/11.06.03-claim-release-dispute.md`
- `11-music-licensing/11.06-creator-micro-licensing/11.06.04-licence-persistence-after-subscription.md`

### 11-music-licensing/11.07-ai-training-licensing (5)

- `11-music-licensing/11.07-ai-training-licensing/11.07-ai-training-licensing-cx.md`
- `11-music-licensing/11.07-ai-training-licensing/11.07-ai-training-licensing-index.md`
- `11-music-licensing/11.07-ai-training-licensing/11.07.01-ai-training-consent-opt-out.md`
- `11-music-licensing/11.07-ai-training-licensing/11.07.02-corpus-assembly-dataset-deals.md`
- `11-music-licensing/11.07-ai-training-licensing/11.07.03-training-compensation-attribution.md`

### 11-music-licensing/11.08-licence-instrument-lifecycle (6)

- `11-music-licensing/11.08-licence-instrument-lifecycle/11.08-licence-instrument-lifecycle-cx.md`
- `11-music-licensing/11.08-licence-instrument-lifecycle/11.08-licence-instrument-lifecycle-index.md`
- `11-music-licensing/11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md`
- `11-music-licensing/11.08-licence-instrument-lifecycle/11.08.02-licence-certificate-issuance.md`
- `11-music-licensing/11.08-licence-instrument-lifecycle/11.08.03-third-party-licence-verification.md`
- `11-music-licensing/11.08-licence-instrument-lifecycle/11.08.04-licence-amendment-expiry-lifecycle.md`

### 11-music-licensing/_domain (5)

- `11-music-licensing/11.09-cover-song-compulsory-mechanical.md`
- `11-music-licensing/11.10-print-lyric-rights.md`
- `11-music-licensing/11.11-grand-rights-dramatic-performance.md`
- `11-music-licensing/music-licensing-cx.md`
- `11-music-licensing/music-licensing-index.md`

### 12-release-distribution/12.01-release-builder (7)

- `12-release-distribution/12.01-release-builder/12.01-release-builder-cx.md`
- `12-release-distribution/12.01-release-builder/12.01-release-builder-index.md`
- `12-release-distribution/12.01-release-builder/12.01.01-release-composition-sequencing.md`
- `12-release-distribution/12.01-release-builder/12.01.02-metadata-validation-conformance.md`
- `12-release-distribution/12.01-release-builder/12.01.03-delivery-readiness-gate.md`
- `12-release-distribution/12.01-release-builder/12.01.04-audio-artwork-asset-conformance.md`
- `12-release-distribution/12.01-release-builder/12.01.05-label-copy-distributor-of-record.md`

### 12-release-distribution/12.02-ddex-delivery-messaging (6)

- `12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-cx.md`
- `12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md`
- `12-release-distribution/12.02-ddex-delivery-messaging/12.02.01-ern-message-generation.md`
- `12-release-distribution/12.02-ddex-delivery-messaging/12.02.02-per-partner-profile-conformance.md`
- `12-release-distribution/12.02-ddex-delivery-messaging/12.02.03-delivery-choreography-acknowledgement.md`
- `12-release-distribution/12.02-ddex-delivery-messaging/12.02.04-mead-enrichment-delivery.md`

### 12-release-distribution/12.03-dsp-store-territory-management (6)

- `12-release-distribution/12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-cx.md`
- `12-release-distribution/12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md`
- `12-release-distribution/12.03-dsp-store-territory-management/12.03.01-store-selection-territory-scoping.md`
- `12-release-distribution/12.03-dsp-store-territory-management/12.03.02-per-store-delivery-status.md`
- `12-release-distribution/12.03-dsp-store-territory-management/12.03.03-rejection-triage-remediation.md`
- `12-release-distribution/12.03-dsp-store-territory-management/12.03.04-artist-profile-linking-disambiguation.md`

### 12-release-distribution/12.04-release-scheduling-windows (6)

- `12-release-distribution/12.04-release-scheduling-windows/12.04-release-scheduling-windows-cx.md`
- `12-release-distribution/12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md`
- `12-release-distribution/12.04-release-scheduling-windows/12.04.01-release-date-lead-time.md`
- `12-release-distribution/12.04-release-scheduling-windows/12.04.02-editorial-pitch-windows.md`
- `12-release-distribution/12.04-release-scheduling-windows/12.04.03-pre-save-pre-add-links.md`
- `12-release-distribution/12.04-release-scheduling-windows/12.04.04-rollout-plan-deadline-timeline.md`

### 12-release-distribution/12.05-catalog-lifecycle-after-release (5)

- `12-release-distribution/12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-cx.md`
- `12-release-distribution/12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md`
- `12-release-distribution/12.05-catalog-lifecycle-after-release/12.05.01-voluntary-takedown.md`
- `12-release-distribution/12.05-catalog-lifecycle-after-release/12.05.02-metadata-update-redelivery.md`
- `12-release-distribution/12.05-catalog-lifecycle-after-release/12.05.03-involuntary-takedown-suspension.md`

### 12-release-distribution/12.06-content-id-ugc-claiming (5)

- `12-release-distribution/12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-cx.md`
- `12-release-distribution/12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md`
- `12-release-distribution/12.06-content-id-ugc-claiming/12.06.01-fingerprint-registration.md`
- `12-release-distribution/12.06-content-id-ugc-claiming/12.06.02-claim-whitelist-management.md`
- `12-release-distribution/12.06-content-id-ugc-claiming/12.06.03-claim-disputes-ownership-conflicts.md`

### 12-release-distribution/_domain (4)

- `12-release-distribution/12.07-identifier-assignment-at-delivery.md`
- `12-release-distribution/12.08-catalog-migration-exit.md`
- `12-release-distribution/release-distribution-cx.md`
- `12-release-distribution/release-distribution-index.md`

### 13-gear-marketplace/13.01-canonical-gear-catalog (7)

- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01-canonical-gear-catalog-cx.md`
- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01-canonical-gear-catalog-index.md`
- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01.01-model-records-taxonomy-attributes.md`
- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01.02-catalog-contribution-moderation.md`
- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01.03-serial-decoding-dating.md`
- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01.04-listing-model-matching.md`
- `13-gear-marketplace/13.01-canonical-gear-catalog/13.01.05-fitment-compatibility-voltage.md`

### 13-gear-marketplace/13.02-condition-originality-disclosure (6)

- `13-gear-marketplace/13.02-condition-originality-disclosure/13.02-condition-originality-disclosure-cx.md`
- `13-gear-marketplace/13.02-condition-originality-disclosure/13.02-condition-originality-disclosure-index.md`
- `13-gear-marketplace/13.02-condition-originality-disclosure/13.02.01-condition-grading-scale.md`
- `13-gear-marketplace/13.02-condition-originality-disclosure/13.02.02-mandatory-flaw-disclosure.md`
- `13-gear-marketplace/13.02-condition-originality-disclosure/13.02.03-modification-originality-disclosure.md`
- `13-gear-marketplace/13.02-condition-originality-disclosure/13.02.04-condition-evidence-pack.md`

### 13-gear-marketplace/13.03-listings-inventory (9)

- `13-gear-marketplace/13.03-listings-inventory/13.03-listings-inventory-cx.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03-listings-inventory-index.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.01-listing-creation-media-demo.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.02-listing-lifecycle-relisting.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.03-inventory-oversell-prevention.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.04-bulk-listing-channel-sync.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.05-parts-bundles-bstock.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.06-provenance-session-history-display.md`
- `13-gear-marketplace/13.03-listings-inventory/13.03.07-stolen-serial-screening.md`

### 13-gear-marketplace/13.04-price-discovery-market-data (5)

- `13-gear-marketplace/13.04-price-discovery-market-data/13.04-price-discovery-market-data-cx.md`
- `13-gear-marketplace/13.04-price-discovery-market-data/13.04-price-discovery-market-data-index.md`
- `13-gear-marketplace/13.04-price-discovery-market-data/13.04.01-price-guide-comps.md`
- `13-gear-marketplace/13.04-price-discovery-market-data/13.04.02-pricing-suggestions-repricing.md`
- `13-gear-marketplace/13.04-price-discovery-market-data/13.04.03-valuation-confidence-thin-market.md`

### 13-gear-marketplace/13.05-offers-auctions-negotiation (5)

- `13-gear-marketplace/13.05-offers-auctions-negotiation/13.05-offers-auctions-negotiation-cx.md`
- `13-gear-marketplace/13.05-offers-auctions-negotiation/13.05-offers-auctions-negotiation-index.md`
- `13-gear-marketplace/13.05-offers-auctions-negotiation/13.05.01-offers-counter-offers.md`
- `13-gear-marketplace/13.05-offers-auctions-negotiation/13.05.02-auctions-bidding.md`
- `13-gear-marketplace/13.05-offers-auctions-negotiation/13.05.03-wanted-iso-reverse-marketplace.md`

### 13-gear-marketplace/13.06-cart-checkout-orders (7)

- `13-gear-marketplace/13.06-cart-checkout-orders/13.06-cart-checkout-orders-cx.md`
- `13-gear-marketplace/13.06-cart-checkout-orders/13.06-cart-checkout-orders-index.md`
- `13-gear-marketplace/13.06-cart-checkout-orders/13.06.01-cart-multivendor-checkout.md`
- `13-gear-marketplace/13.06-cart-checkout-orders/13.06.02-order-management-lifecycle.md`
- `13-gear-marketplace/13.06-cart-checkout-orders/13.06.03-layaway-staged-payment.md`
- `13-gear-marketplace/13.06-cart-checkout-orders/13.06.04-pos-service-addons.md`
- `13-gear-marketplace/13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md`

### 13-gear-marketplace/13.07-gear-logistics-cross-border (6)

- `13-gear-marketplace/13.07-gear-logistics-cross-border/13.07-gear-logistics-cross-border-cx.md`
- `13-gear-marketplace/13.07-gear-logistics-cross-border/13.07-gear-logistics-cross-border-index.md`
- `13-gear-marketplace/13.07-gear-logistics-cross-border/13.07.01-freight-oversize-packing.md`
- `13-gear-marketplace/13.07-gear-logistics-cross-border/13.07.02-international-customs-landed-cost.md`
- `13-gear-marketplace/13.07-gear-logistics-cross-border/13.07.03-cites-export-compliance.md`
- `13-gear-marketplace/13.07-gear-logistics-cross-border/13.07.04-shipping-insurance-damage-claims.md`

### 13-gear-marketplace/13.08-returns-rma-warranty (5)

- `13-gear-marketplace/13.08-returns-rma-warranty/13.08-returns-rma-warranty-cx.md`
- `13-gear-marketplace/13.08-returns-rma-warranty/13.08-returns-rma-warranty-index.md`
- `13-gear-marketplace/13.08-returns-rma-warranty/13.08.01-returns-refunds.md`
- `13-gear-marketplace/13.08-returns-rma-warranty/13.08.02-rma-repair-routing.md`
- `13-gear-marketplace/13.08-returns-rma-warranty/13.08.03-warranty-registration-transfer-claims.md`

### 13-gear-marketplace/13.09-tradein-consignment (5)

- `13-gear-marketplace/13.09-tradein-consignment/13.09-tradein-consignment-cx.md`
- `13-gear-marketplace/13.09-tradein-consignment/13.09-tradein-consignment-index.md`
- `13-gear-marketplace/13.09-tradein-consignment/13.09.01-tradein-part-exchange.md`
- `13-gear-marketplace/13.09-tradein-consignment/13.09.02-consignment-sales-custody.md`
- `13-gear-marketplace/13.09-tradein-consignment/13.09.03-inspection-intake-grading.md`

### 13-gear-marketplace/13.10-gear-rental-backline (5)

- `13-gear-marketplace/13.10-gear-rental-backline/13.10-gear-rental-backline-cx.md`
- `13-gear-marketplace/13.10-gear-rental-backline/13.10-gear-rental-backline-index.md`
- `13-gear-marketplace/13.10-gear-rental-backline/13.10.01-rental-listings-rate-cards.md`
- `13-gear-marketplace/13.10-gear-rental-backline/13.10.02-rental-availability-reservation.md`
- `13-gear-marketplace/13.10-gear-rental-backline/13.10.03-deposits-damage-return-condition.md`

### 13-gear-marketplace/_domain (5)

- `13-gear-marketplace/13.11-local-pickup-meetup-safety.md`
- `13-gear-marketplace/13.12-gear-seller-storefront-policies.md`
- `13-gear-marketplace/13.13-authorized-dealer-map-pricing.md`
- `13-gear-marketplace/gear-marketplace-cx.md`
- `13-gear-marketplace/gear-marketplace-index.md`

### 14-digital-goods-marketplace/14.01-catalog-compatibility (6)

- `14-digital-goods-marketplace/14.01-catalog-compatibility/14.01-catalog-compatibility-cx.md`
- `14-digital-goods-marketplace/14.01-catalog-compatibility/14.01-catalog-compatibility-index.md`
- `14-digital-goods-marketplace/14.01-catalog-compatibility/14.01.01-digital-product-listing-spec-sheet.md`
- `14-digital-goods-marketplace/14.01-catalog-compatibility/14.01.02-format-os-daw-compatibility-matrix.md`
- `14-digital-goods-marketplace/14.01-catalog-compatibility/14.01.03-host-dependency-graph.md`
- `14-digital-goods-marketplace/14.01-catalog-compatibility/14.01.04-rig-profile-compatibility-checker.md`

### 14-digital-goods-marketplace/14.02-licensing-activation-entitlement (8)

- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02-licensing-activation-entitlement-cx.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02-licensing-activation-entitlement-index.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.01-licence-issuance-entitlement-record.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.02-activation-seats-machine-authorisation.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.03-offline-activation-drm-bridges.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.04-serial-blacklisting-anti-piracy.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.05-licence-terms-registry.md`
- `14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.06-trials-demos-freeware.md`

### 14-digital-goods-marketplace/14.03-delivery-versioning-library (7)

- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03-delivery-versioning-library-cx.md`
- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03-delivery-versioning-library-index.md`
- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.01-download-delivery-resumable-transfer.md`
- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.02-versioning-updates-legacy-archive.md`
- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.03-licence-portal-purchased-library.md`
- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.04-creative-asset-library-tagging-sync.md`
- `14-digital-goods-marketplace/14.03-delivery-versioning-library/14.03.05-per-buyer-forensic-watermarking.md`

### 14-digital-goods-marketplace/14.04-sound-content-catalogs (6)

- `14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04-sound-content-catalogs-cx.md`
- `14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04-sound-content-catalogs-index.md`
- `14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.01-sample-loop-pack-catalog.md`
- `14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.02-preset-patch-catalog.md`
- `14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.03-project-template-catalog-dependency-manifest.md`
- `14-digital-goods-marketplace/14.04-sound-content-catalogs/14.04.04-musical-metadata-index-search.md`

### 14-digital-goods-marketplace/14.05-beat-instrumental-licensing (6)

- `14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05-beat-instrumental-licensing-cx.md`
- `14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05-beat-instrumental-licensing-index.md`
- `14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05.01-beat-catalog-tiered-leases.md`
- `14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05.02-exclusive-rights-purchase-auto-delist.md`
- `14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05.03-lease-lifecycle-caps-expiry.md`
- `14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05.04-tagged-preview-untagged-delivery.md`

### 14-digital-goods-marketplace/14.06-used-licence-transfer (5)

- `14-digital-goods-marketplace/14.06-used-licence-transfer/14.06-used-licence-transfer-cx.md`
- `14-digital-goods-marketplace/14.06-used-licence-transfer/14.06-used-licence-transfer-index.md`
- `14-digital-goods-marketplace/14.06-used-licence-transfer/14.06.01-vendor-transfer-policy-registry.md`
- `14-digital-goods-marketplace/14.06-used-licence-transfer/14.06.02-licence-transfer-escrow.md`
- `14-digital-goods-marketplace/14.06-used-licence-transfer/14.06.03-bundled-software-with-used-hardware.md`

### 14-digital-goods-marketplace/14.07-monetisation-models-pricing (7)

- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07-monetisation-models-pricing-cx.md`
- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07-monetisation-models-pricing-index.md`
- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07.01-perpetual-purchase-ownership.md`
- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07.02-subscription-credit-economy.md`
- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07.03-rent-to-own.md`
- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07.04-bundles-promotional-sales.md`
- `14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07.05-upgrade-crossgrade-loyalty-credit.md`

### 14-digital-goods-marketplace/14.08-vendor-portal-build-qa (7)

- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08-vendor-portal-build-qa-cx.md`
- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08-vendor-portal-build-qa-index.md`
- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.01-vendor-onboarding-product-submission.md`
- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.02-automated-build-qa.md`
- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.03-audio-content-qc.md`
- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.04-release-channels-staged-rollout.md`
- `14-digital-goods-marketplace/14.08-vendor-portal-build-qa/14.08.05-vendor-exit-licence-continuity.md`

### 14-digital-goods-marketplace/14.09-digital-refunds-revocation (5)

- `14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09-digital-refunds-revocation-cx.md`
- `14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09-digital-refunds-revocation-index.md`
- `14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.01-withdrawal-right-waiver-capture.md`
- `14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.02-digital-refund-eligibility-adjudication.md`
- `14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09.03-licence-revocation-entitlement-clawback.md`

### 14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool (5)

- `14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10-contributor-revenue-royalty-pool-cx.md`
- `14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10-contributor-revenue-royalty-pool-index.md`
- `14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.01-pool-funding-rate-model.md`
- `14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.02-download-attribution-accrual.md`
- `14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10.03-multi-contributor-pack-splits.md`

### 14-digital-goods-marketplace/_domain (2)

- `14-digital-goods-marketplace/digital-goods-marketplace-cx.md`
- `14-digital-goods-marketplace/digital-goods-marketplace-index.md`

### 15-gear-registry-ownership/15.01-instrument-identity-provenance (8)

- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-cx.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-index.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.01-gear-record-serial-identity.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.02-ownership-claim-verification.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.03-ownership-transfer-handshake.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.04-provenance-chain-view.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.05-non-serialized-contested-identity.md`
- `15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01.06-identity-continuity-modification.md`

### 15-gear-registry-ownership/15.02-stolen-gear-registry-recovery (6)

- `15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02-stolen-gear-registry-recovery-cx.md`
- `15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02-stolen-gear-registry-recovery-index.md`
- `15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.01-theft-report-serial-flagging.md`
- `15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.02-point-of-sale-serial-screening.md`
- `15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.03-sighting-reports-recovery-coordination.md`
- `15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02.04-false-flag-dispute-lifecycle.md`

### 15-gear-registry-ownership/15.05-valuation-appraisal-insurance (5)

- `15-gear-registry-ownership/15.05-valuation-appraisal-insurance/15.05-valuation-appraisal-insurance-cx.md`
- `15-gear-registry-ownership/15.05-valuation-appraisal-insurance/15.05-valuation-appraisal-insurance-index.md`
- `15-gear-registry-ownership/15.05-valuation-appraisal-insurance/15.05.01-automated-valuation-comps.md`
- `15-gear-registry-ownership/15.05-valuation-appraisal-insurance/15.05.02-appraisal-record.md`
- `15-gear-registry-ownership/15.05-valuation-appraisal-insurance/15.05.03-insurance-schedule-claim-pack.md`

### 15-gear-registry-ownership/15.06-rig-profile-compatibility (5)

- `15-gear-registry-ownership/15.06-rig-profile-compatibility/15.06-rig-profile-compatibility-cx.md`
- `15-gear-registry-ownership/15.06-rig-profile-compatibility/15.06-rig-profile-compatibility-index.md`
- `15-gear-registry-ownership/15.06-rig-profile-compatibility/15.06.01-rig-definition-signal-chain.md`
- `15-gear-registry-ownership/15.06-rig-profile-compatibility/15.06.02-compatibility-oracle.md`
- `15-gear-registry-ownership/15.06-rig-profile-compatibility/15.06.03-rig-spec-sheet-source-data.md`

### 15-gear-registry-ownership/15.07-studio-backline-asset-register (5)

- `15-gear-registry-ownership/15.07-studio-backline-asset-register/15.07-studio-backline-asset-register-cx.md`
- `15-gear-registry-ownership/15.07-studio-backline-asset-register/15.07-studio-backline-asset-register-index.md`
- `15-gear-registry-ownership/15.07-studio-backline-asset-register/15.07.01-org-owned-asset-register.md`
- `15-gear-registry-ownership/15.07-studio-backline-asset-register/15.07.02-asset-condition-availability-state.md`
- `15-gear-registry-ownership/15.07-studio-backline-asset-register/15.07.03-backline-list-publication.md`

### 15-gear-registry-ownership/_domain (7)

- `15-gear-registry-ownership/15.03-service-repair-modification-history.md`
- `15-gear-registry-ownership/15.04-gear-collection-visibility.md`
- `15-gear-registry-ownership/15.08-custody-loans-consignment.md`
- `15-gear-registry-ownership/15.09-gear-discography.md`
- `15-gear-registry-ownership/15.10-cases-manifests-carnet-source-data.md`
- `15-gear-registry-ownership/gear-registry-ownership-cx.md`
- `15-gear-registry-ownership/gear-registry-ownership-index.md`

### 16-venues-studios-spaces/16.01-place-records-rooms (9)

- `16-venues-studios-spaces/16.01-place-records-rooms/16.01-place-records-rooms-cx.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01-place-records-rooms-index.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.01-place-record-type-taxonomy.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.02-room-space-first-class-entity.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.03-structured-photo-checklist-virtual-tours.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.04-accessibility-profile.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.05-place-status-at-risk-signalling.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.06-licences-insurance-statutory-records.md`
- `16-venues-studios-spaces/16.01-place-records-rooms/16.01.07-industry-trades-facilities-directory.md`

### 16-venues-studios-spaces/16.02-venue-technical-specification (8)

- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02-venue-technical-specification-cx.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02-venue-technical-specification-index.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02.01-capacity-configuration-model.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02.02-stage-pa-backline-spec.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02.03-access-logistics-curfew-limiter.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02.04-hospitality-green-room-backstage.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02.05-standing-deal-model-commercial-terms.md`
- `16-venues-studios-spaces/16.02-venue-technical-specification/16.02.06-pro-blanket-licence-setlist-reporting.md`

### 16-venues-studios-spaces/16.03-studio-technical-specification (6)

- `16-venues-studios-spaces/16.03-studio-technical-specification/16.03-studio-technical-specification-cx.md`
- `16-venues-studios-spaces/16.03-studio-technical-specification/16.03-studio-technical-specification-index.md`
- `16-venues-studios-spaces/16.03-studio-technical-specification/16.03.01-studio-rooms-acoustics.md`
- `16-venues-studios-spaces/16.03-studio-technical-specification/16.03.02-signal-chain-mic-locker-inventory.md`
- `16-venues-studios-spaces/16.03-studio-technical-specification/16.03.03-engineer-staffing-model.md`
- `16-venues-studios-spaces/16.03-studio-technical-specification/16.03.04-session-archive-recall-policy.md`

### 16-venues-studios-spaces/16.05-curation-provenance-data-integrity (9)

- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05-curation-provenance-data-integrity-cx.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05-curation-provenance-data-integrity-index.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.01-place-data-seeding-ingestion.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.02-claim-ownership-verification.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.03-suggested-edits-field-provenance.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.04-owner-vs-community-conflict-resolution.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.05-verification-decay-freshness-scoring.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.06-post-gig-session-data-harvesting.md`
- `16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.07-duplicate-detection-merge.md`

### 16-venues-studios-spaces/16.06-space-booking-reservations (11)

- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06-space-booking-reservations-cx.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06-space-booking-reservations-index.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.01-availability-calendar-holds.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.02-external-calendar-sync.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.03-reservation-lifecycle.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.04-waitlist-backfill.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.05-compound-multi-resource-booking.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.06-booking-posture-enquiry-rfq-routing.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.07-rate-cards-inclusions-extras.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.08-off-peak-seasonal-dynamic-pricing.md`
- `16-venues-studios-spaces/16.06-space-booking-reservations/16.06.09-recurring-bookings-lockout-tenancy.md`

### 16-venues-studios-spaces/_domain (4)

- `16-venues-studios-spaces/16.04-rehearsal-practice-space-specification.md`
- `16-venues-studios-spaces/16.07-spec-conformance-check-rider-room.md`
- `16-venues-studios-spaces/venues-studios-spaces-cx.md`
- `16-venues-studios-spaces/venues-studios-spaces-index.md`

### 17-live-booking-settlement/17.01-availability-holds-confirmation (6)

- `17-live-booking-settlement/17.01-availability-holds-confirmation/17.01-availability-holds-confirmation-cx.md`
- `17-live-booking-settlement/17.01-availability-holds-confirmation/17.01-availability-holds-confirmation-index.md`
- `17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.01-availability-calendar-avails.md`
- `17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.02-hold-ladder-priority.md`
- `17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.03-challenge-release-expiry.md`
- `17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.04-confirmation-announce-gate.md`

### 17-live-booking-settlement/17.02-offers-negotiation (6)

- `17-live-booking-settlement/17.02-offers-negotiation/17.02-offers-negotiation-cx.md`
- `17-live-booking-settlement/17.02-offers-negotiation/17.02-offers-negotiation-index.md`
- `17-live-booking-settlement/17.02-offers-negotiation/17.02.01-offer-sheet-composition.md`
- `17-live-booking-settlement/17.02-offers-negotiation/17.02.02-counteroffer-thread-versions.md`
- `17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md`
- `17-live-booking-settlement/17.02-offers-negotiation/17.02.04-offer-expiry-withdrawal.md`

### 17-live-booking-settlement/17.03-deal-structures-economics (5)

- `17-live-booking-settlement/17.03-deal-structures-economics/17.03-deal-structures-economics-cx.md`
- `17-live-booking-settlement/17.03-deal-structures-economics/17.03-deal-structures-economics-index.md`
- `17-live-booking-settlement/17.03-deal-structures-economics/17.03.01-deal-term-grammar-types.md`
- `17-live-booking-settlement/17.03-deal-structures-economics/17.03.02-breakeven-whatif-modelling.md`
- `17-live-booking-settlement/17.03-deal-structures-economics/17.03.03-multishow-cross-collateralization.md`

### 17-live-booking-settlement/17.05-deposits-balances-cancellation (6)

- `17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05-deposits-balances-cancellation-cx.md`
- `17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05-deposits-balances-cancellation-index.md`
- `17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05.01-deposit-invoice-collection.md`
- `17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05.02-balance-schedule-reminders.md`
- `17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05.03-cancellation-tiers-forfeit.md`
- `17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05.04-force-majeure.md`

### 17-live-booking-settlement/17.08-agency-representation-commission (5)

- `17-live-booking-settlement/17.08-agency-representation-commission/17.08-agency-representation-commission-cx.md`
- `17-live-booking-settlement/17.08-agency-representation-commission/17.08-agency-representation-commission-index.md`
- `17-live-booking-settlement/17.08-agency-representation-commission/17.08.01-representation-commission-terms.md`
- `17-live-booking-settlement/17.08-agency-representation-commission/17.08.02-commission-accrual-deduction.md`
- `17-live-booking-settlement/17.08-agency-representation-commission/17.08.03-roster-booking-pipeline.md`

### 17-live-booking-settlement/17.09-settlement-reconciliation (9)

- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09-settlement-reconciliation-cx.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09-settlement-reconciliation-index.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.01-settlement-sheet-computation.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.03-show-expense-receipt-capture.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.04-merch-settlement-venue-cut.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.05-settlement-signoff-variance.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.06-settlement-audit-trail-disputes.md`
- `17-live-booking-settlement/17.09-settlement-reconciliation/17.09.07-settlement-statement-export.md`

### 17-live-booking-settlement/17.10-live-income-payout-tax (5)

- `17-live-booking-settlement/17.10-live-income-payout-tax/17.10-live-income-payout-tax-cx.md`
- `17-live-booking-settlement/17.10-live-income-payout-tax/17.10-live-income-payout-tax-index.md`
- `17-live-booking-settlement/17.10-live-income-payout-tax/17.10.01-live-income-split-definition.md`
- `17-live-booking-settlement/17.10-live-income-payout-tax/17.10.02-disbursement-execution.md`
- `17-live-booking-settlement/17.10-live-income-payout-tax/17.10.03-withholding-tax-vat.md`

### 17-live-booking-settlement/17.11-draw-history-market-intelligence (5)

- `17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11-draw-history-market-intelligence-cx.md`
- `17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11-draw-history-market-intelligence-index.md`
- `17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11.01-verified-draw-record.md`
- `17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11.02-market-comparables-benchmarks.md`
- `17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11.03-offer-guidance-guarantee-sizing.md`

### 17-live-booking-settlement/_domain (8)

- `17-live-booking-settlement/17.04-performance-contracts-deal-memos.md`
- `17-live-booking-settlement/17.06-radius-clause-exclusivity.md`
- `17-live-booking-settlement/17.07-booking-enquiry-inbox-rfq.md`
- `17-live-booking-settlement/17.12-counterparty-relationship-payment-reliability.md`
- `17-live-booking-settlement/17.13-fan-demand-signals.md`
- `17-live-booking-settlement/17.14-bill-construction-support-slots.md`
- `17-live-booking-settlement/live-booking-settlement-cx.md`
- `17-live-booking-settlement/live-booking-settlement-index.md`

### 18-show-production-touring/18.03-show-advancing (7)

- `18-show-production-touring/18.03-show-advancing/18.03-show-advancing-cx.md`
- `18-show-production-touring/18.03-show-advancing/18.03-show-advancing-index.md`
- `18-show-production-touring/18.03-show-advancing/18.03.01-advance-checklist.md`
- `18-show-production-touring/18.03-show-advancing/18.03.02-venue-capability-diff.md`
- `18-show-production-touring/18.03-show-advancing/18.03.03-rider-redlines.md`
- `18-show-production-touring/18.03-show-advancing/18.03.04-advance-sheet.md`
- `18-show-production-touring/18.03-show-advancing/18.03.05-advance-freeze-change-control.md`

### 18-show-production-touring/18.04-riders (6)

- `18-show-production-touring/18.04-riders/18.04-riders-cx.md`
- `18-show-production-touring/18.04-riders/18.04-riders-index.md`
- `18-show-production-touring/18.04-riders/18.04.01-technical-rider.md`
- `18-show-production-touring/18.04-riders/18.04.02-hospitality-rider.md`
- `18-show-production-touring/18.04-riders/18.04.03-access-rider.md`
- `18-show-production-touring/18.04-riders/18.04.04-rider-templates-versioning.md`

### 18-show-production-touring/18.05-stage-plot-input-list (5)

- `18-show-production-touring/18.05-stage-plot-input-list/18.05-stage-plot-input-list-cx.md`
- `18-show-production-touring/18.05-stage-plot-input-list/18.05-stage-plot-input-list-index.md`
- `18-show-production-touring/18.05-stage-plot-input-list/18.05.01-stage-plot-builder.md`
- `18-show-production-touring/18.05-stage-plot-input-list/18.05.02-input-list-patch.md`
- `18-show-production-touring/18.05-stage-plot-input-list/18.05.03-monitor-iem-requirements.md`

### 18-show-production-touring/18.06-setlist-show-files (6)

- `18-show-production-touring/18.06-setlist-show-files/18.06-setlist-show-files-cx.md`
- `18-show-production-touring/18.06-setlist-show-files/18.06-setlist-show-files-index.md`
- `18-show-production-touring/18.06-setlist-show-files/18.06.01-setlist-builder.md`
- `18-show-production-touring/18.06-setlist-show-files/18.06.02-stage-ready-output.md`
- `18-show-production-touring/18.06-setlist-show-files/18.06.03-show-file-custody.md`
- `18-show-production-touring/18.06-setlist-show-files/18.06.04-performed-setlist-capture.md`

### 18-show-production-touring/18.07-show-day-schedule (5)

- `18-show-production-touring/18.07-show-day-schedule/18.07-show-day-schedule-cx.md`
- `18-show-production-touring/18.07-show-day-schedule/18.07-show-day-schedule-index.md`
- `18-show-production-touring/18.07-show-day-schedule/18.07.01-run-of-show.md`
- `18-show-production-touring/18.07-show-day-schedule/18.07.02-curfew-conflict-checking.md`
- `18-show-production-touring/18.07-show-day-schedule/18.07.03-live-slippage.md`

### 18-show-production-touring/18.08-crew-credentials (5)

- `18-show-production-touring/18.08-crew-credentials/18.08-crew-credentials-cx.md`
- `18-show-production-touring/18.08-crew-credentials/18.08-crew-credentials-index.md`
- `18-show-production-touring/18.08-crew-credentials/18.08.01-crew-roster-call-times.md`
- `18-show-production-touring/18.08-crew-credentials/18.08.02-credentials-passes.md`
- `18-show-production-touring/18.08-crew-credentials/18.08.03-local-crew-hire.md`

### 18-show-production-touring/18.09-backline-gear-manifest (5)

- `18-show-production-touring/18.09-backline-gear-manifest/18.09-backline-gear-manifest-cx.md`
- `18-show-production-touring/18.09-backline-gear-manifest/18.09-backline-gear-manifest-index.md`
- `18-show-production-touring/18.09-backline-gear-manifest/18.09.01-gear-manifest.md`
- `18-show-production-touring/18.09-backline-gear-manifest/18.09.02-backline-sourcing.md`
- `18-show-production-touring/18.09-backline-gear-manifest/18.09.03-load-out-loss-damage.md`

### 18-show-production-touring/18.11-tour-container-routing (5)

- `18-show-production-touring/18.11-tour-container-routing/18.11-tour-container-routing-cx.md`
- `18-show-production-touring/18.11-tour-container-routing/18.11-tour-container-routing-index.md`
- `18-show-production-touring/18.11-tour-container-routing/18.11.01-tour-container.md`
- `18-show-production-touring/18.11-tour-container-routing/18.11.02-routing-feasibility.md`
- `18-show-production-touring/18.11-tour-container-routing/18.11.03-itinerary-tour-book.md`

### 18-show-production-touring/18.12-travel-logistics (5)

- `18-show-production-touring/18.12-travel-logistics/18.12-travel-logistics-cx.md`
- `18-show-production-touring/18.12-travel-logistics/18.12-travel-logistics-index.md`
- `18-show-production-touring/18.12-travel-logistics/18.12.01-travel-accommodation.md`
- `18-show-production-touring/18.12-travel-logistics/18.12.02-rooming-lists.md`
- `18-show-production-touring/18.12-travel-logistics/18.12.03-ground-transport-driver-hours.md`

### 18-show-production-touring/18.13-tour-finance (5)

- `18-show-production-touring/18.13-tour-finance/18.13-tour-finance-cx.md`
- `18-show-production-touring/18.13-tour-finance/18.13-tour-finance-index.md`
- `18-show-production-touring/18.13-tour-finance/18.13.01-per-diems-float.md`
- `18-show-production-touring/18.13-tour-finance/18.13.02-tour-budget-actual.md`
- `18-show-production-touring/18.13-tour-finance/18.13.03-expense-receipt-capture.md`

### 18-show-production-touring/18.14-border-visas-carnets (5)

- `18-show-production-touring/18.14-border-visas-carnets/18.14-border-visas-carnets-cx.md`
- `18-show-production-touring/18.14-border-visas-carnets/18.14-border-visas-carnets-index.md`
- `18-show-production-touring/18.14-border-visas-carnets/18.14.01-visas-work-permits.md`
- `18-show-production-touring/18.14-border-visas-carnets/18.14.02-carnets-customs.md`
- `18-show-production-touring/18.14-border-visas-carnets/18.14.03-withholding-tax.md`

### 18-show-production-touring/_domain (11)

- `18-show-production-touring/18.01-event-record-lifecycle.md`
- `18-show-production-touring/18.02-bill-support-acts.md`
- `18-show-production-touring/18.10-day-sheet.md`
- `18-show-production-touring/18.15-tour-merch-inventory.md`
- `18-show-production-touring/18.16-show-safety-permits-insurance.md`
- `18-show-production-touring/18.17-weather-contingency.md`
- `18-show-production-touring/18.18-post-show-report.md`
- `18-show-production-touring/18.19-rehearsal-management.md`
- `18-show-production-touring/18.20-green-touring-carbon.md`
- `18-show-production-touring/show-production-touring-cx.md`
- `18-show-production-touring/show-production-touring-index.md`

### 19-ticketing-box-office/19.01-ticket-config-scaling-allocations (7)

- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01-ticket-config-scaling-allocations-cx.md`
- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01-ticket-config-scaling-allocations-index.md`
- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.01-ticket-types-price-scaling.md`
- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.02-capacity-manifest-allocations-holds.md`
- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.03-fee-structure-all-in-pricing.md`
- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.04-seating-model-ga-reserved-seat-maps.md`
- `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.05-accessible-seating-companion-tickets.md`

### 19-ticketing-box-office/19.02-on-sale-announce-presale (7)

- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02-on-sale-announce-presale-cx.md`
- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02-on-sale-announce-presale-index.md`
- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.01-announce-on-sale-scheduling.md`
- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.02-presale-windows-tiered-access.md`
- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.03-access-code-issuance-redemption.md`
- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.04-queue-waiting-room-cart-hold.md`
- `19-ticketing-box-office/19.02-on-sale-announce-presale/19.02.05-sold-out-waitlist-demand-capture.md`

### 19-ticketing-box-office/19.03-guest-list-comps (5)

- `19-ticketing-box-office/19.03-guest-list-comps/19.03-guest-list-comps-cx.md`
- `19-ticketing-box-office/19.03-guest-list-comps/19.03-guest-list-comps-index.md`
- `19-ticketing-box-office/19.03-guest-list-comps/19.03.01-guest-list-allocation-submission.md`
- `19-ticketing-box-office/19.03-guest-list-comps/19.03.02-comp-issuance-manifest-impact.md`
- `19-ticketing-box-office/19.03-guest-list-comps/19.03.03-door-time-guest-list-changes.md`

### 19-ticketing-box-office/19.04-door-scanning-access-control (6)

- `19-ticketing-box-office/19.04-door-scanning-access-control/19.04-door-scanning-access-control-cx.md`
- `19-ticketing-box-office/19.04-door-scanning-access-control/19.04-door-scanning-access-control-index.md`
- `19-ticketing-box-office/19.04-door-scanning-access-control/19.04.01-ticket-scan-validation.md`
- `19-ticketing-box-office/19.04-door-scanning-access-control/19.04.02-offline-manifest-sync-reconciliation.md`
- `19-ticketing-box-office/19.04-door-scanning-access-control/19.04.03-multi-scanner-coordination-re-entry.md`
- `19-ticketing-box-office/19.04-door-scanning-access-control/19.04.04-door-age-id-verification.md`

### 19-ticketing-box-office/19.05-box-office-counts-drops (7)

- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05-box-office-counts-drops-cx.md`
- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05-box-office-counts-drops-index.md`
- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05.01-live-count-manifest-state.md`
- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05.02-drop-reports-counterparty-distribution.md`
- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05.03-sales-pacing-on-sale-health.md`
- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05.04-walk-up-day-of-show-sales.md`
- `19-ticketing-box-office/19.05-box-office-counts-drops/19.05.05-box-office-close-certified-statement.md`

### 19-ticketing-box-office/19.06-refunds-cancellations-rescheduling (5)

- `19-ticketing-box-office/19.06-refunds-cancellations-rescheduling/19.06-refunds-cancellations-rescheduling-cx.md`
- `19-ticketing-box-office/19.06-refunds-cancellations-rescheduling/19.06-refunds-cancellations-rescheduling-index.md`
- `19-ticketing-box-office/19.06-refunds-cancellations-rescheduling/19.06.01-individual-refunds-exchanges.md`
- `19-ticketing-box-office/19.06-refunds-cancellations-rescheduling/19.06.02-event-cancellation-mass-refund.md`
- `19-ticketing-box-office/19.06-refunds-cancellations-rescheduling/19.06.03-reschedule-postponement-handling.md`

### 19-ticketing-box-office/19.07-external-ticketing-integration (6)

- `19-ticketing-box-office/19.07-external-ticketing-integration/19.07-external-ticketing-integration-cx.md`
- `19-ticketing-box-office/19.07-external-ticketing-integration/19.07-external-ticketing-integration-index.md`
- `19-ticketing-box-office/19.07-external-ticketing-integration/19.07.01-external-ticketing-connectors.md`
- `19-ticketing-box-office/19.07-external-ticketing-integration/19.07.02-count-ingestion-manifest-mapping.md`
- `19-ticketing-box-office/19.07-external-ticketing-integration/19.07.03-count-discrepancy-reconciliation.md`
- `19-ticketing-box-office/19.07-external-ticketing-integration/19.07.04-manual-count-entry-attestation.md`

### 19-ticketing-box-office/19.08-vip-packages-meet-and-greet (5)

- `19-ticketing-box-office/19.08-vip-packages-meet-and-greet/19.08-vip-packages-meet-and-greet-cx.md`
- `19-ticketing-box-office/19.08-vip-packages-meet-and-greet/19.08-vip-packages-meet-and-greet-index.md`
- `19-ticketing-box-office/19.08-vip-packages-meet-and-greet/19.08.01-package-composition-inventory.md`
- `19-ticketing-box-office/19.08-vip-packages-meet-and-greet/19.08.02-meet-and-greet-scheduling.md`
- `19-ticketing-box-office/19.08-vip-packages-meet-and-greet/19.08.03-vip-redemption-fulfilment.md`

### 19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls (5)

- `19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls/19.09-ticketing-fraud-bot-resale-controls-cx.md`
- `19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls/19.09-ticketing-fraud-bot-resale-controls-index.md`
- `19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls/19.09.01-purchase-limits-bot-mitigation.md`
- `19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls/19.09.02-ticket-transfer-delivery-controls.md`
- `19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls/19.09.03-resale-price-caps-face-value-exchange.md`

### 19-ticketing-box-office/_domain (5)

- `19-ticketing-box-office/19.10-attendee-data-capture-consent.md`
- `19-ticketing-box-office/19.11-rsvp-free-private-event-admission.md`
- `19-ticketing-box-office/19.12-ticket-delivery-fan-wallet.md`
- `19-ticketing-box-office/ticketing-box-office-cx.md`
- `19-ticketing-box-office/ticketing-box-office-index.md`

### 20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience (7)

- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-cx.md`
- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01-fan-graph-owned-audience-index.md`
- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01.01-unified-fan-record.md`
- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01.02-consent-legal-basis.md`
- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01.03-fan-preference-centre.md`
- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01.04-fan-list-import-hygiene.md`
- `20-fanbase-direct-to-fan/20.01-fan-graph-owned-audience/20.01.05-fan-list-ownership-transfer.md`

### 20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence (5)

- `20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-cx.md`
- `20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02-segmentation-superfan-intelligence-index.md`
- `20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02.01-segment-builder.md`
- `20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02.02-superfan-score.md`
- `20-fanbase-direct-to-fan/20.02-segmentation-superfan-intelligence/20.02.03-perk-entitlements-presale-eligibility.md`

### 20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging (6)

- `20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-cx.md`
- `20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03-broadcast-fan-messaging-index.md`
- `20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03.01-campaign-composer.md`
- `20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03.02-channel-routing-bulk-delivery.md`
- `20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03.03-send-scheduling-throttling.md`
- `20-fanbase-direct-to-fan/20.03-broadcast-fan-messaging/20.03.04-deliverability-sender-reputation.md`

### 20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront (6)

- `20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-cx.md`
- `20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04-direct-to-fan-storefront-index.md`
- `20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04.01-storefront-product-catalog.md`
- `20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04.02-merch-variants-print-on-demand.md`
- `20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04.03-digital-sales-name-your-price-bundles.md`
- `20-fanbase-direct-to-fan/20.04-direct-to-fan-storefront/20.04.04-d2f-revenue-split-payout.md`

### 20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns (8)

- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-cx.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05-memberships-patronage-campaigns-index.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.01-membership-tiers-benefits.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.02-exclusive-content-vault.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.03-tipping-micro-patronage.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.04-crowdfunding-preorder-campaigns.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.05-backer-funds-fulfilment.md`
- `20-fanbase-direct-to-fan/20.05-memberships-patronage-campaigns/20.05.06-virtual-fan-events.md`

### 20-fanbase-direct-to-fan/20.06-fan-experience-discovery (6)

- `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06-fan-experience-discovery-cx.md`
- `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06-fan-experience-discovery-index.md`
- `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.01-artist-tracking-follow.md`
- `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md`
- `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.03-fan-library-collection.md`
- `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.04-listening-history-import-bootstrap.md`

### 20-fanbase-direct-to-fan/_domain (3)

- `20-fanbase-direct-to-fan/20.07-fan-demand-show-requests.md`
- `20-fanbase-direct-to-fan/fanbase-direct-to-fan-cx.md`
- `20-fanbase-direct-to-fan/fanbase-direct-to-fan-index.md`

### 21-promotion-marketing/21.01-release-campaign-planner (6)

- `21-promotion-marketing/21.01-release-campaign-planner/21.01-release-campaign-planner-cx.md`
- `21-promotion-marketing/21.01-release-campaign-planner/21.01-release-campaign-planner-index.md`
- `21-promotion-marketing/21.01-release-campaign-planner/21.01.01-backward-planned-campaign-grid.md`
- `21-promotion-marketing/21.01-release-campaign-planner/21.01.02-asset-readiness-gate.md`
- `21-promotion-marketing/21.01-release-campaign-planner/21.01.03-content-calendar-beat-sheet.md`
- `21-promotion-marketing/21.01-release-campaign-planner/21.01.04-date-change-cascade.md`

### 21-promotion-marketing/21.02-pitching-outreach (8)

- `21-promotion-marketing/21.02-pitching-outreach/21.02-pitching-outreach-cx.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02-pitching-outreach-index.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02.01-dsp-editorial-pitch.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02.02-playlist-curator-pitching.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02.03-press-blog-outreach.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02.04-radio-plugging.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02.05-embargo-premiere-exclusives.md`
- `21-promotion-marketing/21.02-pitching-outreach/21.02.06-pitch-rate-limits-curator-protection.md`

### 21-promotion-marketing/21.03-pitch-targets-crm (6)

- `21-promotion-marketing/21.03-pitch-targets-crm/21.03-pitch-targets-crm-cx.md`
- `21-promotion-marketing/21.03-pitch-targets-crm/21.03-pitch-targets-crm-index.md`
- `21-promotion-marketing/21.03-pitch-targets-crm/21.03.01-media-target-directory.md`
- `21-promotion-marketing/21.03-pitch-targets-crm/21.03.02-private-contact-crm.md`
- `21-promotion-marketing/21.03-pitch-targets-crm/21.03.03-pitch-tracking-response-log.md`
- `21-promotion-marketing/21.03-pitch-targets-crm/21.03.04-contact-ownership-portability.md`

### 21-promotion-marketing/21.04-smart-links-presave-attribution (6)

- `21-promotion-marketing/21.04-smart-links-presave-attribution/21.04-smart-links-presave-attribution-cx.md`
- `21-promotion-marketing/21.04-smart-links-presave-attribution/21.04-smart-links-presave-attribution-index.md`
- `21-promotion-marketing/21.04-smart-links-presave-attribution/21.04.01-smart-link-builder.md`
- `21-promotion-marketing/21.04-smart-links-presave-attribution/21.04.02-presave-preadd-authorization.md`
- `21-promotion-marketing/21.04-smart-links-presave-attribution/21.04.03-campaign-attribution.md`
- `21-promotion-marketing/21.04-smart-links-presave-attribution/21.04.04-link-lifecycle-retirement.md`

### 21-promotion-marketing/21.05-paid-promotion (5)

- `21-promotion-marketing/21.05-paid-promotion/21.05-paid-promotion-cx.md`
- `21-promotion-marketing/21.05-paid-promotion/21.05-paid-promotion-index.md`
- `21-promotion-marketing/21.05-paid-promotion/21.05.01-paid-ad-campaigns.md`
- `21-promotion-marketing/21.05-paid-promotion/21.05.02-creator-seeding.md`
- `21-promotion-marketing/21.05-paid-promotion/21.05.03-payola-guardrail.md`

### 21-promotion-marketing/21.08-event-tour-marketing (5)

- `21-promotion-marketing/21.08-event-tour-marketing/21.08-event-tour-marketing-cx.md`
- `21-promotion-marketing/21.08-event-tour-marketing/21.08-event-tour-marketing-index.md`
- `21-promotion-marketing/21.08-event-tour-marketing/21.08.01-tour-announce-onsale.md`
- `21-promotion-marketing/21.08-event-tour-marketing/21.08.02-geo-date-promotion-soft-seat.md`
- `21-promotion-marketing/21.08-event-tour-marketing/21.08.03-ticket-sale-attribution.md`

### 21-promotion-marketing/_domain (5)

- `21-promotion-marketing/21.06-social-publishing-cross-post.md`
- `21-promotion-marketing/21.07-coverage-clipping-log.md`
- `21-promotion-marketing/21.09-campaign-press-kit-epk.md`
- `21-promotion-marketing/promotion-marketing-cx.md`
- `21-promotion-marketing/promotion-marketing-index.md`

### 22-analytics-market-intelligence/22.01-source-connections-ingestion (6)

- `22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01-source-connections-ingestion-cx.md`
- `22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01-source-connections-ingestion-index.md`
- `22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01.01-dsp-account-connection-sync.md`
- `22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01.02-social-account-connection-sync.md`
- `22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01.03-ingestion-health-gaps-freshness.md`
- `22-analytics-market-intelligence/22.01-source-connections-ingestion/22.01.04-manual-file-based-metric-import.md`

### 22-analytics-market-intelligence/22.02-external-identity-catalog-matching (5)

- `22-analytics-market-intelligence/22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-cx.md`
- `22-analytics-market-intelligence/22.02-external-identity-catalog-matching/22.02-external-identity-catalog-matching-index.md`
- `22-analytics-market-intelligence/22.02-external-identity-catalog-matching/22.02.01-external-artist-profile-matching-claiming.md`
- `22-analytics-market-intelligence/22.02-external-identity-catalog-matching/22.02.02-recording-release-catalog-matching.md`
- `22-analytics-market-intelligence/22.02-external-identity-catalog-matching/22.02.03-match-conflict-disambiguation-resolution.md`

### 22-analytics-market-intelligence/22.03-playlist-chart-tracking (5)

- `22-analytics-market-intelligence/22.03-playlist-chart-tracking/22.03-playlist-chart-tracking-cx.md`
- `22-analytics-market-intelligence/22.03-playlist-chart-tracking/22.03-playlist-chart-tracking-index.md`
- `22-analytics-market-intelligence/22.03-playlist-chart-tracking/22.03.01-playlist-placement-tracking.md`
- `22-analytics-market-intelligence/22.03-playlist-chart-tracking/22.03.02-chart-position-monitoring.md`
- `22-analytics-market-intelligence/22.03-playlist-chart-tracking/22.03.03-curator-playlist-intelligence.md`

### 22-analytics-market-intelligence/22.04-audience-geography-routing-insight (5)

- `22-analytics-market-intelligence/22.04-audience-geography-routing-insight/22.04-audience-geography-routing-insight-cx.md`
- `22-analytics-market-intelligence/22.04-audience-geography-routing-insight/22.04-audience-geography-routing-insight-index.md`
- `22-analytics-market-intelligence/22.04-audience-geography-routing-insight/22.04.01-audience-geography-map.md`
- `22-analytics-market-intelligence/22.04-audience-geography-routing-insight/22.04.02-routing-market-opportunity-insight.md`
- `22-analytics-market-intelligence/22.04-audience-geography-routing-insight/22.04.03-show-impact-attribution.md`

### 22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting (6)

- `22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-cx.md`
- `22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05-cross-source-dashboard-reporting-index.md`
- `22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05.01-unified-performance-dashboard.md`
- `22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05.02-alert-rules-scheduled-digests.md`
- `22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05.03-report-sharing-export.md`
- `22-analytics-market-intelligence/22.05-cross-source-dashboard-reporting/22.05.04-peer-benchmarking-cohort-comparison.md`

### 22-analytics-market-intelligence/22.06-streaming-fraud-detection (4)

- `22-analytics-market-intelligence/22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-cx.md`
- `22-analytics-market-intelligence/22.06-streaming-fraud-detection/22.06-streaming-fraud-detection-index.md`
- `22-analytics-market-intelligence/22.06-streaming-fraud-detection/22.06.01-artificial-streaming-anomaly-detection-evidence.md`
- `22-analytics-market-intelligence/22.06-streaming-fraud-detection/22.06.02-promo-vendor-risk-scoring.md`

### 22-analytics-market-intelligence/22.07-ar-scouting-watchlists (6)

- `22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-cx.md`
- `22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07-ar-scouting-watchlists-index.md`
- `22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07.01-artist-watchlists.md`
- `22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07.02-momentum-breakout-signals.md`
- `22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07.03-scouting-discovery-search.md`
- `22-analytics-market-intelligence/22.07-ar-scouting-watchlists/22.07.04-scouted-artist-visibility-consent.md`

### 22-analytics-market-intelligence/22.08-credit-linked-performance (5)

- `22-analytics-market-intelligence/22.08-credit-linked-performance/22.08-credit-linked-performance-cx.md`
- `22-analytics-market-intelligence/22.08-credit-linked-performance/22.08-credit-linked-performance-index.md`
- `22-analytics-market-intelligence/22.08-credit-linked-performance/22.08.01-contribution-catalog-performance.md`
- `22-analytics-market-intelligence/22.08-credit-linked-performance/22.08.02-role-sliced-performance-attribution.md`
- `22-analytics-market-intelligence/22.08-credit-linked-performance/22.08.03-verified-performance-proof-service-listings.md`

### 22-analytics-market-intelligence/_domain (2)

- `22-analytics-market-intelligence/analytics-market-intelligence-cx.md`
- `22-analytics-market-intelligence/analytics-market-intelligence-index.md`

### 23-career-finance-business/23.01-income-aggregation-financial-identity (7)

- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-cx.md`
- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md`
- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01.01-income-event-ledger.md`
- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01.02-off-platform-income-import.md`
- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01.03-multi-currency-fx.md`
- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01.04-verified-income-statement.md`
- `23-career-finance-business/23.01-income-aggregation-financial-identity/23.01.05-income-to-work-linkage.md`

### 23-career-finance-business/23.02-expenses-tax-readiness (6)

- `23-career-finance-business/23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-cx.md`
- `23-career-finance-business/23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md`
- `23-career-finance-business/23.02-expenses-tax-readiness/23.02.01-expense-receipt-capture.md`
- `23-career-finance-business/23.02-expenses-tax-readiness/23.02.02-deduction-categorization-jurisdiction-rules.md`
- `23-career-finance-business/23.02-expenses-tax-readiness/23.02.03-tax-pack-accountant-handoff.md`
- `23-career-finance-business/23.02-expenses-tax-readiness/23.02.04-cross-border-withholding-reclaim.md`

### 23-career-finance-business/23.03-invoicing-receivables (5)

- `23-career-finance-business/23.03-invoicing-receivables/23.03-invoicing-receivables-cx.md`
- `23-career-finance-business/23.03-invoicing-receivables/23.03-invoicing-receivables-index.md`
- `23-career-finance-business/23.03-invoicing-receivables/23.03.01-quote-estimate-builder.md`
- `23-career-finance-business/23.03-invoicing-receivables/23.03.02-invoice-issuance-compliance.md`
- `23-career-finance-business/23.03-invoicing-receivables/23.03.03-payment-chasing-dunning-aging.md`

### 23-career-finance-business/23.04-deal-contract-vault (6)

- `23-career-finance-business/23.04-deal-contract-vault/23.04-deal-contract-vault-cx.md`
- `23-career-finance-business/23.04-deal-contract-vault/23.04-deal-contract-vault-index.md`
- `23-career-finance-business/23.04-deal-contract-vault/23.04.01-contract-vault-document-store.md`
- `23-career-finance-business/23.04-deal-contract-vault/23.04.02-key-term-extraction-deal-summary.md`
- `23-career-finance-business/23.04-deal-contract-vault/23.04.03-option-reversion-obligation-alerts.md`
- `23-career-finance-business/23.04-deal-contract-vault/23.04.04-deal-to-rights-reconciliation.md`

### 23-career-finance-business/23.05-career-progression-benchmarking (5)

- `23-career-finance-business/23.05-career-progression-benchmarking/23.05-career-progression-benchmarking-cx.md`
- `23-career-finance-business/23.05-career-progression-benchmarking/23.05-career-progression-benchmarking-index.md`
- `23-career-finance-business/23.05-career-progression-benchmarking/23.05.01-career-goals-roadmap-templates.md`
- `23-career-finance-business/23.05-career-progression-benchmarking/23.05.02-auto-milestone-timeline.md`
- `23-career-finance-business/23.05-career-progression-benchmarking/23.05.03-peer-cohort-benchmarking.md`

### 23-career-finance-business/23.06-advances-commission-recoupment (7)

- `23-career-finance-business/23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-cx.md`
- `23-career-finance-business/23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md`
- `23-career-finance-business/23.06-advances-commission-recoupment/23.06.01-advance-underwriting-offers.md`
- `23-career-finance-business/23.06-advances-commission-recoupment/23.06.02-commission-representation-deductions.md`
- `23-career-finance-business/23.06-advances-commission-recoupment/23.06.03-recoupment-netting-ledger.md`
- `23-career-finance-business/23.06-advances-commission-recoupment/23.06.04-cashflow-smoothing-runway.md`
- `23-career-finance-business/23.06-advances-commission-recoupment/23.06.05-catalogue-stake-sale-rights-finance.md`

### 23-career-finance-business/23.07-budgeting-project-tour-pl (5)

- `23-career-finance-business/23.07-budgeting-project-tour-pl/23.07-budgeting-project-tour-pl-cx.md`
- `23-career-finance-business/23.07-budgeting-project-tour-pl/23.07-budgeting-project-tour-pl-index.md`
- `23-career-finance-business/23.07-budgeting-project-tour-pl/23.07.01-budget-actuals-tracking.md`
- `23-career-finance-business/23.07-budgeting-project-tour-pl/23.07.02-project-tour-pl.md`
- `23-career-finance-business/23.07-budgeting-project-tour-pl/23.07.03-band-treasury-member-distribution.md`

### 23-career-finance-business/_domain (4)

- `23-career-finance-business/23.08-point-of-need-insurance.md`
- `23-career-finance-business/23.09-career-sustainability-signals.md`
- `23-career-finance-business/career-finance-business-cx.md`
- `23-career-finance-business/career-finance-business-index.md`

### 24-trust-safety-disputes/24.01-reporting-moderation (7)

- `24-trust-safety-disputes/24.01-reporting-moderation/24.01-reporting-moderation-cx.md`
- `24-trust-safety-disputes/24.01-reporting-moderation/24.01-reporting-moderation-index.md`
- `24-trust-safety-disputes/24.01-reporting-moderation/24.01.01-report-intake-notice-and-action.md`
- `24-trust-safety-disputes/24.01-reporting-moderation/24.01.02-automated-content-classification.md`
- `24-trust-safety-disputes/24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md`
- `24-trust-safety-disputes/24.01-reporting-moderation/24.01.04-trusted-flagger-priority-channel.md`
- `24-trust-safety-disputes/24.01-reporting-moderation/24.01.05-messaging-safety-scam-filtering.md`

### 24-trust-safety-disputes/24.02-enforcement-appeals-policy (8)

- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-cx.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.01-enforcement-ladder-sanctions.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.02-appeals-internal-complaints.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.03-statements-of-reasons.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.04-policy-library-versioned-terms.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.05-prohibited-restricted-items-engine.md`
- `24-trust-safety-disputes/24.02-enforcement-appeals-policy/24.02.06-transparency-reporting.md`

### 24-trust-safety-disputes/24.03-fraud-risk-operations (8)

- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03-fraud-risk-operations-cx.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.01-risk-scoring-rules-engine.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.02-ato-ban-evasion-ring-detection.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.03-seller-buyer-fraud-return-abuse.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.04-triangulation-card-testing-defense.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.05-sanctions-aml-screening.md`
- `24-trust-safety-disputes/24.03-fraud-risk-operations/24.03.06-review-rating-integrity.md`

### 24-trust-safety-disputes/24.04-transaction-disputes-protection (6)

- `24-trust-safety-disputes/24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-cx.md`
- `24-trust-safety-disputes/24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-index.md`
- `24-trust-safety-disputes/24.04-transaction-disputes-protection/24.04.01-claims-dispute-filing.md`
- `24-trust-safety-disputes/24.04-transaction-disputes-protection/24.04.02-mediation-resolution-center.md`
- `24-trust-safety-disputes/24.04-transaction-disputes-protection/24.04.03-buyer-seller-protection-programs.md`
- `24-trust-safety-disputes/24.04-transaction-disputes-protection/24.04.04-chargeback-management-representment.md`

### 24-trust-safety-disputes/24.05-copyright-authenticity-enforcement (6)

- `24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-cx.md`
- `24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md`
- `24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05.01-dmca-notice-counter-notice-repeat-infringer.md`
- `24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05.02-audio-fingerprinting-content-matching.md`
- `24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05.03-authenticity-counterfeit-brand-protection.md`
- `24-trust-safety-disputes/24.05-copyright-authenticity-enforcement/24.05.04-pre-release-leak-detection-response.md`

### 24-trust-safety-disputes/24.06-personal-safety-threat-response (5)

- `24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-cx.md`
- `24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md`
- `24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06.01-harassment-stalking-doxxing.md`
- `24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06.02-meetup-safety-safe-exchange.md`
- `24-trust-safety-disputes/24.06-personal-safety-threat-response/24.06.03-crisis-welfare-escalation.md`

### 24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes (5)

- `24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-cx.md`
- `24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md`
- `24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes/24.07.01-impersonation-fake-profile.md`
- `24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes/24.07.02-entity-ownership-account-recovery-disputes.md`
- `24-trust-safety-disputes/24.07-identity-abuse-ownership-disputes/24.07.03-deceased-incapacitated-succession.md`

### 24-trust-safety-disputes/24.08-illegal-content-legal-process (6)

- `24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-cx.md`
- `24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md`
- `24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.01-csam-detection-preservation-reporting.md`
- `24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.02-tvec-removal.md`
- `24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.03-law-enforcement-legal-process-portal.md`
- `24-trust-safety-disputes/24.08-illegal-content-legal-process/24.08.04-safety-governance-risk-assessment.md`

### 24-trust-safety-disputes/_domain (3)

- `24-trust-safety-disputes/24.09-case-evidence-locker.md`
- `24-trust-safety-disputes/trust-safety-disputes-cx.md`
- `24-trust-safety-disputes/trust-safety-disputes-index.md`

### _root (4)

- `domain-map-proposal.md`
- `ideation-cx.md`
- `ideation-index.md`
- `moscow-ledger.md`

### meta (5)

- `meta/competitive-landscape.md`
- `meta/constraints.md`
- `meta/cross-cut-emergent-capabilities.md`
- `meta/personas.md`
- `meta/problem-statement.md`


## Gaps Fixed (this run)

| Fix | Count | Status |
|-----|-------|--------|
| Broken cross-references repaired | 27 | ✅ applied — 9,544/9,544 links now resolve |
| Blocking findings triaged to owner decisions | 0 / 20 | ⬜ pending — product decisions, cannot auto-resolve |
| Expired open-question deferrals reconciled | 0 / 1,865 | ⬜ pending |
| Warning findings | 0 / 178 | ⬜ deferred to `/create-prd` |

**Status**: COMPLETE — audit executed, report issued. Remediation outstanding.
**Verdict**: GAPS FOUND (20 blocking). `/create-prd` remains blocked.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-75|D-75]]
