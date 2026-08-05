# Deep Dive 10 — Rights and ownership

> **Parent IA Shard**: [../10-rights-ownership.md](../10-rights-ownership.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns exact-rational ledger invariants, frozen whole-ledger consent, split/buyout/points mechanics, chain-of-title projections, scoped conflicts/freezes, AI/NIL consent positions and evidence operations. Shard 10 records agreement/evidence; downstream domains execute money, licences, releases and filings.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Objects, links, ledger rows, consents, agreements, amendments, title events, conflicts, freezes, positions, identifiers and proofs share exact versions and immutable evidence. |
| What-if expansion | Unbalanced drafts, stale consent, simultaneous amendments, unreachable parties, inherited ledgers, conflicting transfers, failed freezes, duplicate identifiers and anchor outage converge. |
| Adversarial pass | Credit-to-right inference, decimal drift, partial-row consent, admin override, silence-as-consent, whole-work freeze, self-release, public dispute leak and master-to-NIL inference fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

### Objects and Ledgers

| Model | Fields and constraints |
|---|---|
| `rights_object` | `id, kind(work|recording), title, asserted_by/context, source_project/version?, lifecycle, created_at, version`; explicit assertion only. |
| `recording_work_link_version` | `set_id, version, recording_id, links[{work_id,type,weight_num,weight_den}], author, evidence_hash`; each positive, canonical sum 1. |
| `rights_ledger_version` | `id, object_id, right_type, territory_profile, state, payout_basis_term_version, proposer, source_hash, supersedes_id?, created_at, version`. |
| `rights_ledger_row` | `id, ledger_id, party_id, row_kind, numerator, denominator, entered_by, writer_anchor_row_id?, provenance, canonical_order`; reduced exact rational. |
| `ledger_consent` | `ledger_id/version, row_id, party_id, state, method, recipient_binding?, acted_at, evidence_hash`; unique exact row/party/version. |
| `master_encumbrance` | `id, object_id, kind, base_key, tier, numerator/denominator, payee, term, recoupment, evidence, state`. |
| `joint_owner_rule` | `master_ledger_id, rule(unanimous|majority_by_share), consented_version`; default unanimous. |

### Agreements, Title and Conflicts

| Model | Fields and constraints |
|---|---|
| `split_capture` | `id, work_id, source_session_id?, participant_designations, proposer, ledger_id?, debt_state, term_version, version`. |
| `buyout_designation` | `id, contribution_id, payer, designee, beneficiary?, consideration_ref/value, consent_set, disclaimer_version, state`. |
| `ledger_amendment` | `id, current_id, proposed_id, proposal_kind, delta_hash, impact_manifest, standing_party, state, queued_after_id?, version`. |
| `title_event` | `id, right_type, object_id, share_num/den, territory, period, event_kind, from/to, trust, evidence, effective_at, recorded_at, conflicts[]`. |
| `territory_grant` | `id, anchor_row/right, grantee, territory_set, right_scope, term, conditions, collection_share?, evidence, state`. |
| `rights_conflict` | `id, kind, object/right/share/territory/period, claim_refs[], evidence_hash, dismissible, state, case_id?, version`. |
| `rights_freeze_instruction` | `id, conflict/case, exact_scope, adapter, required_state, state, authorized_by, release_authority, evidence, version`. |

### Consent, Identifier and Proof

| Model | Fields and constraints |
|---|---|
| `ai_training_position` | `holder/right_scope, position, grantee/use/model?, territory, term, compensation?, evidence, state, version`. |
| `nil_position` | `person_id, right_kind, use/scope, grantee?, territory, term, compensation?, authority/evidence, state, version`. |
| `identifier_allocation` | `object_id, scheme, value, issuer/registrant, request_key, state, allocated_at, supersedes_id?, evidence`; unique active scheme/value. |
| `creation_timestamp` | `object/version, source_hash, observed_at, anchor_provider/version, anchor_ref, evidence_hash, state`. |
| `registration_draft` | `owner_context, jurisdiction, form/version, object_ids/versions, group, gaps, artifact_hash, submission_state/evidence`. |

## Ledger Invariants

1. Every rational is stored reduced with positive denominator; arithmetic uses integers only.
2. Composition writer rows sum exactly one for each territory in a proposed/consented ledger.
3. Publisher rows are anchored one-to-one/many to writer rows and sum exactly to each anchor writer share.
4. Master ownership rows sum exactly one; points/encumbrances never enter ownership sum.
5. Each encumbrance base/tier sum is ≤1; control derives waterfall and covenants separately.
6. Public-domain publishing ledger is terminal, has zero rows and skips balance invariants.
7. No zero-percent ownership row. Removal requires consented amendment or contribution-scoped buyout path.
8. Entity rows remain entity rows; membership never fans out.
9. Proposed/consented ledgers are immutable. Any row change creates a new version and resets all consents.
10. No-new-party recording lineage may reference parent ledger until first divergence, when it forks an independent snapshot.

## Ledger Proposal and Consent Algorithm

1. Validate actor authority, right/object/territory, row party identities and exact rationals.
2. Persist draft even when unbalanced; compute exact gap without creating remainder.
3. To propose, enforce structural/arithmetic invariants and freeze canonical row order/hash plus payout-basis term version.
4. Determine consent set from every row/party and anchored publisher holder; consent is to whole ledger.
5. Proposer's proposal action may also record consent only against exact frozen version; any edit invalidates it with all others.
6. Signed-link action binds intended recipient and ledger hash; opening/read receipt has no consent meaning.
7. Refusal leaves ledger proposed/refused; unreachable remains pending/blocked. Silence never advances.
8. Only all required valid consents move ledger to consented and emit downstream event.
9. Display “Balances” after arithmetic success; never “valid,” “clear” or legally effective.

## Split, Points and Buyout Algorithm

1. Shard 09 close moment supplies work, participants and claims; never percentages.
2. Capture ternary designation per participant: share, fee, present-not-party. Empty/open remains first-class debt.
3. Share path creates ledger draft; fee path creates buyout/engagement reference; neither blocks session close.
4. Ensemble contractor binds players only under Shard 01 agency. Otherwise individual extinguishment consents remain pending.
5. Points require named base, payee, exact rate, tier/term and consent; they are encumbrance and assign through title event.
6. Points and WFH fee are mutually exclusive per contribution, not globally per person.
7. Buyout records designation + consideration atomically, beneficiary explicitly named/none, and required designee/payer consents.
8. WFH legal effect is never asserted. Credit, performer fact, neighbouring-right potential and NIL survive.

## Amendment and Transfer Algorithm

1. Verify proposer has standing on any ledger version in chain.
2. Enforce one `open` amendment; later proposals queue with source snapshot and must rebase.
3. Distinguish correction/amendment from transfer/grant. World-change transfers become title events with different consent set.
4. Produce per-party before/after delta and downstream impact manifest: licences, registrations, accounting runs and releases.
5. Any change resets all consent; share decrease requires affected party's explicit exact decreased value.
6. Current ledger governs until successor fully consents. No admin override.
7. Unreachable blocks indefinitely; notify at most three resends per rolling seven days, while saving remains unlimited.
8. Cross-ledger proposal is one atomic consent package; master/publishing both advance or neither.
9. True-up is separate consent item and downstream instruction, never compelled payment.
10. Court order is evidence/notice unless it compels WeJammin directly; compelled action records `court_ordered`, never consent.

## Chain, Control and Reversion Algorithm

1. Append title event with right/share/territory/period/from/to/evidence/trust; never delete prior events.
2. Conflicting events coexist and raise conflict; chronology alone does not choose winner.
3. Current projection folds only non-conflicted effective events over last consented ledger, preserving gaps.
4. Control summary combines exact ownership, joint-owner rule, grants, encumbrances, covenants and custody.
5. Verdicts are `authorized`, `blocked` or `no_recorded_obstacle`; last explicitly disclaims clearance.
6. Fixed-term approved reversion executes atomically into title and registry at deadline. Conditional reversion only notifies/request action.
7. Missing grant term is incomplete; never perpetual. Territory belongs to grant/right scope, not bare ownership row.
8. Succession uses verified Shard 01 representation; platform records event and never determines probate/heir priority.

## Conflict, Dispute and Freeze Algorithm

1. Run conflict detection synchronously on claim/write: arithmetic overlap, double assignment, territory collision, external contradiction and public-domain contradiction.
2. Duplicate candidate requires title plus corroborating writer/identifier/fingerprint; title alone never flags.
3. Deterministic conflicts cannot be suppressed. Duplicate candidate may be dismissed by either party and remembers exact pair/version.
4. Notify; do not auto-open case or freeze money.
5. Standing party opens Shard 06 case for exact right/share/territory/period. Producer attestation is separate evidence; platform evidence unweighted.
6. Authorized case outcome may issue share-scoped freeze instruction. Whole-work freeze prohibited.
7. Downstream money/distribution adapter acknowledges hold. If required hold fails, operation halts; Shard 10 never claims custody.
8. Release requires independent authority and cannot be performed by beneficiary for own disputed share.

## AI, NIL, Identifier and Evidence Algorithms

- AI training grant requires every relevant holder's scoped position; most restrictive governs. No-position is unknown, not refusal or consent.
- NIL belongs to person. Master ownership, credit, representation or WFH never confers it.
- AI content declaration records asserted facts only; no detection. Absence is undeclared.
- Identifier allocation preflights external/internal existing IDs, reserves idempotently, then commits. Conflict ranks history/order/registrant but owners confirm.
- Creation timestamp automatically hashes each asserted object/version and anchors externally. Failure is visible/retryable; proof states possession, not authorship.
- Registration drafts pin jurisdiction/form/source versions and group candidates. No automatic filing.
- Public lookup reads dedicated allowlisted projection; percentages/disputes/private economics/evidence remain absent by default.

## Abuse and Recovery Verification

| Threat/failure | Required control |
|---|---|
| Credited party treated as owner | No credit-to-ledger command; explicit ledger row/consent required. |
| Decimal rounding steals share | Integer rational storage/invariants and canonical order. |
| One party consents only own row | Consent action shows/binds whole ledger hash. |
| Admin forces split | No override capability/schema; only consent or compelled platform order path. |
| Attrition spam targets unreachable party | Proposal resend cap, current ledger governs, no silence semantics. |
| Producer zeroes contributor | Zero rows invalid; buyout/removal requires scoped agreement/consent. |
| Party freezes whole catalog | Exact right/share/territory/period scope and authorized case. |
| Party releases own escrow | Separate release authority predicate; no self-release. |
| Public lookup exposes dispute | Separate projection with no conflict/dispute fields or hidden counts. |
| Master owner licenses voice clone | NIL/AI position required independently. |
| Identifier retry burns codes | Stable request key/reservation and provider reconciliation. |
| Anchor outage loses object | Object commits with failed proof state; retry anchors same source hash. |
| Downstream consumes asserted as consented | State/provenance required in projection; consumer gate rejects. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Exact request/event/error, protected evidence storage, signed artifacts, outbox and audit. |
| Shard 01 | Parties, mandates, agency, organizations, estates and representation; no membership flattening. |
| Shard 07 | Credit/performance evidence and contributor shells; credit never becomes ownership. |
| Shard 09 | Work/session/version/source facts and capture moment; project ownership/access remain separate. |
| Shard 06 | Rights cases/evidence and authorized freeze/release outcomes; no admin merits decision. |
| Shards 14/18/20–22/27/28 | Consume consented exact-rational/title/conflict/identifier/position projections and return idempotent execution evidence. |

All dependent IA skeletons name Shard 10 reciprocally. Consumers cannot write ledger/title tables and must preserve asserted/consented/registered/collecting distinctions.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [10-rights-ownership § Contracts](../10-rights-ownership.md#contracts) defines commands/queries and [10-rights-ownership § Event Schemas](../10-rights-ownership.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked exact-rational ledger, consent, agreement, title, conflict, AI/NIL and evidence algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
