# Deep Dive 14 — Services marketplace lifecycle

> **Parent IA Shard**: [../14-services-marketplace.md](../14-services-marketplace.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns listing/quote invariants, requirements/SLA clocks, milestone/revision/change-order mechanics, delivery acceptance races, exit settlement, multi-party supply gating, rights-credit execution and custody evidence. Payment provider custody, rights registry and credit graph remain external canonical owners.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Listing, quote, acknowledgements, engagement, requirements, clocks, milestones, revisions, deliveries, acceptance legs, exits, supply, rights and custody share frozen versions. |
| What-if expansion | Quote drift, self-dealing, expiry race, requirements deadlock, upstream dependency, revision race, provider outage, atomic-leg failure, substitution race and damage converge. |
| Adversarial pass | Default rights, hidden rates, silent repricing, unlimited revisions, fake delivery, auto-accept abuse, off-platform files, reverse kill fees, agency credit capture and insurance claims fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

| Model | Fields and constraints |
|---|---|
| `listing_version` | `listing_id, seller_party, primary_craft, facets, tiers/addons, pricing_model_versions, mode, SLA, capacity, master/composition posture, state, published_at, supersedes_id`. |
| `quote_version` | `quote_id, buyer/seller, listing_snapshot?, scope, price_eval, requirements, artifact_set, milestones, revisions, anonymity, rights, exit, expiry, material_terms_hash, supersedes_id?`. |
| `engagement` | `id, accepted_quote_id/version, parties, state, contract_currency, requirement_gate, due_at?, payment_auth_ref, guardian_refs?, version`. |
| `requirement_item` | `engagement, type, required_shape, source_methods, completeness_rule_version, state, submission_ref, rejection_count`. |
| `sla_clock_event` | `engagement, event_kind, actor, cause/waiting_on, occurred_at, prior/new_due, contested_at?`. |
| `revision_round` | `engagement/milestone, artifact_version, window, freeze_at, allowance_before/after, state, redelivery_id?`. |
| `delivery` | `id, engagement/milestone, artifact_set_version, artifacts/digests, QC, declarations, payout_readiness, published_at, accept_at, state, version`. |
| `acceptance` | `id, delivery, kind, accepter, received/fired_at, payment_leg, rights_leg, credit_leg, state, rollback/evidence`. |
| `exit_settlement` | `engagement, exit_kind, fault, consumed_basis, fee/refund/expense/rights legs, liability_cap, state, evidence`. |
| `custody_handoff` | `job/item, from/to custodian, condition_version, declared_value, approved_estimate_version, accepted_by_both, occurred_at`. |

## State Machines

- Listing: `draft -> live -> stale -> dormant | paused -> archived`; live craft change requires archive/new listing.
- Quote: `requested -> drafting -> issued -> accepted | declined | expired | withdrawn | superseded | void_seller_suspension`.
- Engagement: `requirements -> active -> buyer_wait | seller_work -> delivered -> revision -> delivered -> accepted | auto_accepted -> closed` plus distinct exits.
- Requirements: `open -> submitted -> passed | rejected -> resubmitted -> deadlock`.
- Delivery: `draft -> validating -> published -> retracted | accepted | auto_accepted | revision_requested`.
- Acceptance coordination: `pending -> committing -> committed | retrying -> rolled_back_escalated`.
- Custody job: `intake -> assessed -> estimated -> approved -> in_work -> return_pending -> returned | disputed`.

## Quote Acceptance and Engagement Creation

1. Resolve buyer/seller acting authority, guardian/agency and same-human control.
2. Validate exact issued quote, expiry, seller status and no acceptance already in flight.
3. Render full quote; diff only supplemental. Collect separate acknowledgements for material terms.
4. Same human on both sides requires distinct authorized buyer human; otherwise reject.
5. Request provider payment authorization in contract currency with stable idempotency.
6. Atomically mark quote accepted, create engagement/requirements, attach payment auth and outbox. Provider failure leaves quote issued.
7. Repeat same acceptance returns engagement. No new quote version allowed during in-flight acceptance.
8. Multi-payee composition may be recorded but activation returns B3 counsel-gate denial.

## Requirements and SLA Algorithm

1. Freeze typed checklist from accepted quote. Later additions require change order.
2. Accept project attachment before upload; disallow off-platform links for file requirements.
3. Run mechanical completeness only. Seller receives measurements, not verdict.
4. Reject with typed gaps; three rejection rounds are the maximum, and the third enters no-fault deadlock/full return/no kill fee.
5. `satisfied_by` upstream engagement suppresses nudges/fault while on-time.
6. Pass all items atomically; start SLA at pass instant.
7. Pause only when buyer owes named response. Resume only on awaited act; record due-date shift.
8. Replacement after pass restarts clock only if seller elects. On-location gate deadline derives from cancellation boundary.

## Revision and Change-Order Algorithm

1. Open round only with ≥1 note against exact artifact; batch until send or 48h/24h rush expiry.
2. Freeze round, pause buyer-wait and resume seller clock; seller cannot redeliver before freeze.
3. Each note keeps artifact anchor and resolution outcome. No automatic carry.
4. Valid different-file redelivery decrements allowance; identical/rejected redelivery refunds it.
5. Revision received through accept deadline +120s wins before auto-accept.
6. Accepted quote classifies scope. Out-of-scope becomes expiring change order; private assistant may suggest but never rule for buyer.
7. Change order has price/payment/scope and allowance delta default zero; pending does not pause auto-accept.
8. Post-acceptance request is recall, never revision.

## Delivery and Atomic Acceptance Algorithm

1. Verify complete frozen artifact set, digest and required declarations. Partial set remains draft.
2. Run integrity/technical spec. Failing mandatory QC is not delivery; engine outage fail-open flagged. Watermark outage fail-closed to streaming-only.
3. Verify seller payout readiness at delivery and notify through window.
4. Publish fixed acceptance instant (3 business day floor, 30 calendar day ceiling), alerts and 120-second revision grace.
5. Explicit acceptance requires eligible non-seller authority. On-location attendance proof may be affirmative acceptance basis.
6. Auto-accept job rechecks no timely revision/extension/retraction and uses actual fire time, never backdates.
7. Begin one transaction/saga with payment release, Shard 10 rights execution and Shard 07 credit emission from frozen quote/artifact data.
8. Retry complete set after 2s/8s/32s. If any leg cannot commit, compensate/rollback all, preserve delivery, notify parties and page human.
9. Commit `accepted` or `auto_accepted` permanently with leg evidence; protection lifts only then.

## Exit Settlement Algorithm

1. Authorize cancel via same mandate class as quote acceptance; mutual release requires both.
2. Determine distinct exit kind and fault. Delivery received first wins against cancellation.
3. Compute consumed work/capacity under quote schedule. Pre-gate first 48h free; later held-time rules apply.
4. Abandonment timer starts at awaited act, reset only by it; one accepted extension. Repeated seller rejection caps fee zero and routes review.
5. Produce four legs with bases: seller fee/kill, buyer refund, expenses 100% zero-take, rights disposition.
6. Automatic abandonment uses kill schedule, never full amount. Liability cap defaults engagement value.
7. Seller fault yields refund + cover/reputation, no reverse kill fee.
8. Points-only exit executes rights disposition only; never invents cash debt.
9. Mutual release free. Off-platform leakage is Shard 06 signal, not fee.

## Multi-Party Supply and Rights Execution

- Actual worker always receives credit. Agency/fixer commission is commercial, not attribution.
- Identity-based substitution requires buyer consent; facility/channel-based may use pre-authorized profile.
- Fixer creates N player engagements + fixer engagement/credits. B3 gate blocks multi-payee release until approved.
- Bundle is milestone chain with one whole-bundle counterparty and visible composed title chain.
- Final rights execution reads frozen quote posture/artifact digests plus live Shard 10 aggregate allocation only.
- Master/composition posture has no default and remains symmetric/plain-language. Artifact set is orthogonal.
- Sample/originality/AI human-performance declarations are append-only per delivery; platform detects nothing.
- AI-generated part emits no performance credit; false declaration routes Shard 06 integrity case.

## Custody and Inspection Algorithm

1. At intake, both parties confirm structured condition/media and declared value consequence.
2. Assessment creates estimate separating labour/parts. Payment authorization occurs on estimate approval, not booking.
3. Every handoff records from/to, time and mutual condition. Approved estimate defines permitted change.
4. Return compares against estimate/condition chain, not merely original appearance.
5. Damage contest opens Shard 06 evidence case; fee payment never represented as item insurance.
6. Inspection uses category template and graph conflict check; inspector paid on report delivery regardless finding/transaction outcome.

## Abuse and Recovery Verification

| Threat/failure | Required control |
|---|---|
| Seller silently changes quote after acceptance | Immutable accepted quote snapshot; all variance change order. |
| Same human self-accepts | Distinct-human buyer predicate and quote-time nominee. |
| Seller adds impossible requirement | Frozen checklist; addition requires accepted change order. |
| Buyer note-drips forever | Bounded note window; one batch/round and allowance accounting. |
| Seller uploads dummy artifact to start clock | Complete artifact set + QC/declarations required. |
| Auto-accept beats timely revision | Deadline+120s grace and serializable acceptance job. |
| Worker loses credit through agency | Credit leg names actual worker; agency commission separate. |
| Multi-party path bypasses counsel | B3 gate checked at composition activation and release. |
| Rights executed from mutable listing | Frozen quote/artifact digests only; live allocation read constrained. |
| Platform promises leak prevention | Evidential watermarking language; streaming-only fallback. |
| Repair fee implied to insure item | Condition/declared-value copy and fee/item-value separation. |
| Acceptance saga partially fails | Stable leg IDs, compensation/rollback and human escalation. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Payments, uploads/media, requests/errors/outbox, timers, signed URLs and audit. |
| Shard 01 | Party/mandate/agency/guardian/self-dealing checks and actual-worker identities. |
| Shard 06 | Disputes, spec-work/integrity/abuse and custody evidence cases. |
| Shard 09 | Project assets/requirements/deliveries and sessions; project truth remains separate. |
| Shard 10 | Frozen rights elections and aggregate validation; title instruments/results. |
| Shards 07/26/41 | Credit emission, gear service/custody integration and finance/tax execution. |

Shards 26 and 41 name Shard 14 reciprocally. Consumers use immutable accepted-quote/engagement/delivery projections, never listing templates as contract truth.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [14-services-marketplace § Contracts](../14-services-marketplace.md#contracts) defines commands/queries and [14-services-marketplace § Event Schemas](../14-services-marketplace.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked quote, requirements, revision, acceptance, exit, supply, rights and custody algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
