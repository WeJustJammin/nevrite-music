# Batch 1 Propagation Scan — 2026-08-02

> **Trigger:** Owner ratified the recommended Batch 1 package with `approve A1-A4` on
> 2026-08-02. This scan records the direct source changes required before application.

## Locked Decisions

| ID | Ratified rule |
|---|---|
| A1 | An organisation is optional. A person, band, studio, agency, or label may each be a separate party of record; legally separate parties never collapse. Acting for another party requires a recorded mandate. |
| A2 | `communicate` is an independent mandate activity. No commercial activity silently grants authority to speak as a party. |
| A3 | The four primary personas remain Musician, Producer, Operator, and Fan. Dealer/plugin developer, private-hire buyer, crew, fee-paying parent/guardian, and manager are bounded account/counterparty roles; Admin/Moderator is internal staff; curator/gatekeeper is off-platform in v1. |
| A4 | No unclaimed non-user portfolio is public or search-indexed until a lawful basis, notice, and removal path are approved. Claimed or explicitly consented public paths remain eligible. |

## Explicit Contradictions — Apply

| Decision | Source | Required correction |
|---|---|---|
| A1 | `01.02-organizations-entity-model-index.md` Q-02 | Resolve organisation optionality and party-of-record separation. |
| A1 | `05.01-service-listings-pricing-index.md` Q-02 | Resolve listing seller-of-record and payee boundary against A1. |
| A2 | `01.03.03-mandate-scope-delegated-authority.md` D-01 | Add the independent `communicate` activity to the mandate vocabulary. |
| A2 | `01.01.03-acting-context-switcher.md` Q-03 | Resolve communication authority and prohibit scope inference. |
| A3 | `meta/personas.md` Q-01/Q-02/Q-05 | Replace the unbounded persona gaps with the ratified taxonomy. |
| A3 | `meta/counterparties.md` non-closure table | Classify the ratified bounded, internal, and off-platform actors. |
| A3 | `04-opportunities-casting-index.md` Q-03/Q-04 | Resolve private-hire buyer and crew representation. |
| A3 | `06.02.01-teacher-tuition-profile.md` Q-02 | Resolve fee-paying parent/guardian representation. |
| A3 | `15-gear-registry-ownership-index.md` Q-03 | Resolve dealer/plugin-developer representation. |
| A3 | `21-promotion-marketing-index.md` Q-01 | Resolve gatekeeper scope as off-platform v1. |
| A3 | `24.01.03-moderation-queue-reviewer-ops.md` Q-01 and `trust-safety-disputes-index.md` Q-03 | Resolve Admin/Moderator as internal staff, outside the persona set. |
| A4 | `01.06-portfolio-media-epk-index.md` D-03 and `01.06.02-credit-backed-portfolio.md` Q-04 | Replace public unclaimed rendering with a non-public provisional projection. |
| A4 | `01.05.01-shadow-party-creation-invitation.md` and `identity-profiles-organizations-cx.md` CX-04 | Align the claim incentive with notice/claim flow rather than public indexing. |

## Implicit Consumers — Verify

| Decision | Consumer | Expected result |
|---|---|---|
| A1/A2 | Acting-context derivation and representation edges | Context and communication writes resolve only through the recorded party and mandate. |
| A3 | Role lenses and the account/counterparty model | The existing four-persona matrices stay intact; bounded roles receive only their named workflow, never a fifth persona column. |
| A4 | Claiming and credit visibility | Credits remain preserved; public discovery is denied for unclaimed non-users until the separate legal gate is satisfied. |

## Application Gate

Apply all explicit corrections as one atomic source set. Then run a focused consistency check for:

1. stale `fifth persona` / `open` wording in the affected records;
2. mandate vocabulary consistency after adding `communicate`;
3. no source retaining public or search-indexed unclaimed portfolio rendering; and
4. decision packet and agenda status updates.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-03|D-03]]
