# Deep Dive 06 — Trust, safety, disputes and evidence

> **Parent IA Shard**: [../06-trust-safety.md](../06-trust-safety.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns protected-case mechanics, policy-bound decisions, scoped/reversible enforcement, advisory risk, dispute/legal workflows, evidence capture and lifecycle. Shard 01 owns party/mandate/ownership truth; Shard 05 owns capability/configuration/retention orchestration; source domains own transactions, objects and event-time capture points.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Intake, routes, leases, policy, decisions, controls, sanctions, notices, appeals, disputes, legal requests, captures, holds and audit share immutable versions and idempotent commands. |
| What-if expansion | Brigading, solo review, lease loss, stale targets, entity ambiguity, provider outage, partial reversal, missing capture, erasure/hold conflict and prohibited disclosure converge explicitly. |
| Adversarial pass | Target throttling, volume-as-guilt, badge exemptions, classifier enforcement, self-concurrence, ownership mutation, case enumeration, evidence editing, wildcard staff access and flag-enabled counsel gates fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

### Case, Intake and Routing

| Model | Fields and constraints |
|---|---|
| `safety_case` | `id, kind, state, severity, queue_key, jurisdiction_codes[], policy_clock_started_at, original_due_at?, current_due_at?, confidentiality, owner_capability, created_at, version`; clock start immutable. |
| `case_target` | `id, case_id, target_type/id, target_version, actor_person_id?, acting_party_id?, acting_context_version?, intake_snapshot_hash, deleted_at?`; unique target role per case. |
| `case_party` | `id, case_id, person_id?, party_id?, role, mandate_version?, disclosure_class, joined_at, left_at?`; protected identity may be null in party projection. |
| `report_intake` | `id, case_id, reporter_ref?, pseudonym_id?, reason_code/version, narrative_ciphertext?, channel, submitted_at, idempotency_hash`; unique channel/actor/hash. |
| `case_route` | `id, case_id/version, queue_key, severity, deadline_remaining_ms, policy_version, reason_codes[], computed_at`; no reporter-volume priority field. |
| `case_lease` | `id, case_id, reviewer_staff_id, claimed_at, expires_at, released_at?, state, case_version`; one active lease per case. |

### Policy, Decisions and Enforcement

| Model | Fields and constraints |
|---|---|
| `policy_rule_version` | `id, rulebook_kind, rule_key, version_no, authoritative_locale, text_hash, machine_rule jsonb, effective_from, effective_until?, supersedes_id?, published_at`; published row immutable. |
| `case_decision` | `id, case_id, finding, rule_version_id, evidence_manifest_hash, rationale_ciphertext, target_scope, proposed_by, proposed_at, activated_at?, state, version`. |
| `decision_control` | `decision_id, control_kind, required_reason, reviewer_staff_id?, prior_decider_id?, reaffirm_after?, satisfied_at, evidence_hash`; distinct-person predicate when concurrence applies. |
| `sanction` | `id, decision_id, subject_person/party, action, rung: smallint NOT NULL CHECK (rung BETWEEN 0 AND 8), scope_type/id, starts_at, ends_at?, indefinite, state, reversal_id?, version`; `rung` derives from `(action, scope_type)` per `DecisionRungMap` and is stored, not recomputed at read; `rung = 5` is rejected at write with `SANCTION_CLASS_GATED`; excludes ownership mutation. |
| `statement_of_reasons` | `id, decision_id, locale, plain_summary, structured_payload, delivery_state, supersedes_id?, created_at`; immutable correction chain. |
| `appeal` | `id, decision_id, appellant_party/person, supplement_id?, reviewer_staff_id?, state, result_by_item jsonb, decided_at?, version`; reviewer distinct from original. |
| `repeat_infringer_entry` | `id, policy_version, subject, claimant_key, asset_id, infringement_event_id, notice_id, state, counted_at?`; unique strike unit. |

### Risk, Disputes, Legal and Evidence

| Model | Fields and constraints |
|---|---|
| `risk_signal` | `id, subject_kind/id, action_event_id?, reason_codes[], source_kind, source_version, confidence?, observed_at, expires_at, state`; no person-level aggregate score. |
| `transaction_dispute` | `case_id, transaction_type/id/version, claimant/counterparty refs, mandate_versions, remedy_policy_version, deadlines, evidence_manifest_hash, state, version`. |
| `resolution_proposal` | `id, case_id, proposer, terms jsonb, monetary_amount?, expires_at?, accepted_by[], state, hash`; acceptance requires binding mandates. |
| `dmca_notice` | `id, case_id, regime, claimant_identity_ref, asset_id, attestations, completeness, delivery, removal_at?, hash`. |
| `legal_request` | `id, case_id, requester_identity, agency, instrument_type/ref, jurisdiction, requested_scope, emergency_claim?, prohibition, verification_state, received_at`. |
| `evidence_bundle` | `id, case_id, class, state, chain_head_hash, retention_clock_ids[], legal_hold_ids[], sealed_at`. |
| `evidence_entry` | `id, bundle_id, sequence, entry_kind, source_event/id/version, canonical_snapshot?, blob_id/hash?, origin, captured_at, prior_hash, entry_hash`; append-only. |
| `capture_intent` | `id, source_event/id/version, case_id, field_manifest, blob_manifest, state, attempts, next_attempt_at?, terminal_reason?, idempotency_key`. |
| `legal_hold` | `id, basis_code, authority_ref, object_manifest_hash, placed_by, placed_at, release_condition, released_by/at?, audit_id`. |

## State Machines

### Case

`draft -> received -> triaged -> queued -> claimed -> reviewing -> proposed -> awaiting_control -> decided -> resolved -> closed`.

- `reviewing -> awaiting_party -> reviewing` for typed response.
- `decided -> appealed -> decided|resolved`; history never rewinds.
- Any pre-decision state may close as duplicate/invalid only with reason and merge/notice semantics.
- `capture_failed` is evidence status attached to a live case, not a shortcut to close it.

### Decision and Enforcement

`draft -> proposed -> awaiting_control -> active -> superseded|reversed|expired`.

- Activation requires exact case/target/policy versions, control satisfaction, audit and SoR in one transaction.
- First active enforcement on a subject-target-policy tuple wins; concurrent loser receives `VERSION_CONFLICT` and re-evaluates.
- Reversal creates compensating items; it never deletes sanction or SoR.
- Expiry changes access prospectively while appeal/history remain available.

### Evidence and Legal Hold

Evidence: `intent_recorded -> capturing -> sealed | capture_failed`. Sealed entries never reopen.

Hold: `proposed -> active -> released`. Active hold contributes an unbounded retention clock; release does not erase immediately, it re-runs all remaining clocks and deletion eligibility.

## Intake, Routing and Review Algorithm

1. Validate target, reason registry version, reporter mode and acting context; redact free text from logs/events.
2. Hash stable normalized payload with reporter or anonymous session secret. Return prior case on matching idempotency; reject hash mismatch.
3. Commit case, target snapshot, intake, initial route request, capture intent and audit atomically.
4. Apply per-reporter abuse budget after admission. Excess changes routing weight and creates fraud-review signal; it never rejects the report.
5. Resolve severity from reason/object/jurisdiction policy. S0 routes only to isolated queue; no general-queue fallback exists.
6. Compute priority from severity plus deadline remaining. Use weighted-fair lane selection with reserved safety-of-person floor.
7. Lease with compare-and-set. Eligibility requires staff capability, exposure budget and no conflict with any party/target/mandate.
8. Render minimum case projection: mutable target shown beside immutable intake snapshot; sensitive media blurred/muted; sealed fields omitted.
9. Save reviewer draft outside canonical decision. Activation revalidates lease, case, target, policy and acting authority.

## Decision Control Algorithm

1. Determine allowed decision/scope from pinned policy and evidence; select narrowest sufficient containment: `object < feature < domain < account < entity`.
2. If entity-level effect requested, resolve responsible actor and mandate from Shard 01 snapshot. Ambiguity blocks collective action.
3. Compute required control:
   - ordinary: authorized moderator;
   - S1 or rung ≥ 6 (`suspend_account`, `terminate_access`, `entity_action`) or `indefinite` with at least two human moderators: distinct-human concurrence;
   - same impact with solo team: cited rule, rationale, audit, guaranteed review route and separate-sitting cooling-off reaffirmation;
   - urgent S0/S1: same four compensating controls but no cooling-off delay.
4. Original decider cannot satisfy concurrence or appeal. AI/model output cannot satisfy either.
5. Commit decision, control evidence, sanction, SoR, audit and outbox atomically. If SoR/audit fails, no sanction activates.
6. Consumers apply each enforcement item idempotently against target version and report per-item result. Partial failure leaves decision active with explicit convergence task.
7. Appeal/reversal emits item-specific compensation and correction; ownership, credits, confirmed splits and export rights remain unchanged throughout.

## Advisory Risk and Provider Failure

- Classifier, matcher and ban-evasion/ring outputs are advisory `risk_signal` rows. They may reorder or request review; never remove, sanction, notify, or become a user score.
- Rules ship in shadow mode before active routing. Shadow output cannot change user-visible state.
- Account-takeover response is protective session revocation/step-up/recovery hold, separately labeled from enforcement.
- Matcher/classifier outage fails open to unscored ordinary handling.
- Prohibited-item evaluation at listing and checkout fails closed only when that phase/domain enables it.
- Approved payout sanctions/AML screening fails closed at provider boundary; it does not infer guilt or mutate ownership.
- Counsel-gated automatic CSAM path remains unreachable until gate record, valid SoR representation, provider operating procedure and counsel/security approval all exist. Feature flags alone cannot satisfy these.

## Dispute, DMCA and Legal Algorithms

### Transaction Dispute

1. Validate transaction, claimant role/mandate, filing window and remedy-policy version.
2. Freeze parties, transaction version, remedies, deadline and evidence manifest; filing retrieves sealed evidence and cannot author contemporaneous proof.
3. Counterparty responses append typed material. Policy-versioned silence rule applies only after verified delivery/deadline.
4. Settlement requires exact terms plus every binding mandate; mark non-precedential and ineligible to create protection payout.
5. Adjudication records evidence weights, result and per-item remedy; chargeback and internal case reconcile to one canonical dispute.

### DMCA

1. Validate US `512 notice completeness and claimant identity/attestations before removal or strike.
2. Deduplicate strike by claimant/asset/infringement event; distinct claimants remain distinct.
3. Apply expeditious availability action, delivery evidence and rigid repeat-infringer policy; a notice demonstrably undelivered cannot finalize termination.
4. Counter-notice requires explicit address/jurisdiction disclosure and signed statements. Complete counter starts restoration clock and claimant delivery.
5. Restoration or litigation hold follows policy clock; all transitions preserve notice/counter-notice evidence.

### Legal Process

1. V1 accepts documented intake only; no self-service portal, emergency promise or 24/7 representation.
2. Verify requester identity, instrument authenticity, jurisdiction, authority, scope and any nondisclosure prohibition.
3. Narrow/refuse overbroad requests and record reason. Disclosure requires counsel-authorized capability, step-up, minimization manifest and expected request version.
4. Notify affected user unless legally barred; prohibition status and review date remain audited.
5. Release only manifest-listed fields/blobs through expiring protected transfer; no search/database access is granted.

## Evidence, Retention and Erasure Algorithm

1. Source domain commits `capture_intent` with source event. User-facing transaction never waits for capture delivery.
2. Worker canonicalizes listed fields, snapshots values, hashes large media already in immutable storage, and appends entry using prior chain hash.
3. Retry with stable idempotency. Exhaustion writes `capture_failed`, alerts owner and exposes truthful safe warning.
4. Party access derives from case role and entry disclosure class, never human's unrelated roles. Appeal submission is separate sealed supplement.
5. Restricted preservation exposes no raw or redacted derivative to parties or ordinary reviewers; break-glass may return sealed non-content validation only.
6. Effective delete-at is maximum applicable retention clocks; active legal hold is unbounded.
7. Erasure anonymizes subject identifiers when lawful but preserves required evidence/hash lineage. Hold release re-evaluates clocks; it never immediately deletes by itself.
8. Purged referenced media leaves immutable tombstone/hash and explicit evidentiary degradation; no replacement blob may reuse locator.

## Abuse and Recovery Verification

| Threat/failure | Control and recovery proof |
|---|---|
| Abuser suppresses reports against target | No target-keyed throttle; independent reporters remain admitted. |
| Fan campaign manufactures guilt | Volume excluded from finding and priority inputs; duplicate evidence clustered only for reviewer ergonomics. |
| Staff browses celebrity/private cases | Assignment/capability RLS, purpose-bound access, search non-enumeration and immutable read audit. |
| Staff self-approves severe sanction | Database distinct-person predicate; solo path records different control kind and cannot claim concurrence. |
| Model removes controversial art | Advisory signal schema has no enforcement command permission; target domain rejects it. |
| Ban erases provenance | Sanction schema cannot reference ownership mutation; export/credits remain available through safe route. |
| Party edits evidence after dispute | Event-time snapshots immutable; later material is sequenced supplement. |
| Reporter identity leaks in notice/event | Safe projection and allowlisted event schema omit identity; protected lookup requires purpose capability. |
| Legal requester spoofs urgency | Urgency does not bypass verification, counsel gate or manifest; V1 makes no emergency promise. |
| Kill switch enables forbidden automation | Shard 05 runtime flag and `counsel_gate` are separate predicates; both required. |
| Worker crashes after source commit | Atomic capture intent survives; retry idempotently seals or records terminal failure. |
| Reversal consumer partially fails | Per-item compensation status drives retry; user sees partial truthful state until convergence. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Authenticated request envelope, protected outbox/queue, standard errors, observability without evidence/PII, backup/recovery. |
| Shard 01 | Resolve actor, party, alias, membership, mandate, ownership and succession at exact versions; Shard 06 never mutates that truth. |
| Shard 05 | Capability grants, policy/config activation, task inbox, diagnostics, kill switches, quality gates, retention/hold orchestration and counsel-gate display. |
| Shards 11–16 | Restriction and enforcement projections; community/opportunity/service/education targets; source event capture intents. |
| Shards 25–31, 33, 35–37 | Catalog/commerce/booking/ticket transaction truth, remedy adapters, fraud signals and evidence capture points. |
| Shard 40 | Privacy-thresholded aggregate outcomes only; no allegation, raw signal, reporter or low-count cohort export. |

Every downstream skeleton listed as dependent on Shard 06 contains a reciprocal `Shard 06` reference. Consumer commands use opaque IDs and expected versions; no downstream shard receives raw case tables.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [06-trust-safety § Contracts](../06-trust-safety.md#contracts) defines commands/queries and [06-trust-safety § Event Schemas](../06-trust-safety.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked state machines, algorithms, abuse controls, counsel gates and convergence behavior | /write-architecture-spec-deepen | All |
| 2026-08-05 | A-06: retyped `sanction.rung` as a required `smallint` 0..8 derived from `DecisionRungMap` and stored, rejected `rung = 5` at write, and made the dual-control predicate concrete | /resolve-ambiguity | Data Models, Decision Control Algorithm |

## Dependency References

- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
