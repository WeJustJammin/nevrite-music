# Deep Dive 07 — Credit graph, capture and confidence

> **Parent IA Shard**: [../07-credits-core.md](../07-credits-core.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns credit identity/versioning, viewer-safe graph projection, session capture convergence, claims/attestations, provenance derivation, correction/dispute integration and assertion-time taxonomy resolution. Rights, splits and collection remain Shard 10+ concerns.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Credits, visibility, roll intervals, contribution claims, prompts, claims, attestations, derivations, contests and vocabulary share immutable hashes/versions. |
| What-if expansion | Offline overlap, duplicate assertion, stale prompt, orphan correction, shell merge, embargo leak, evidence objection, retraction and vocabulary outage converge. |
| Adversarial pass | Credit-to-right inference, roll-to-credit automation, graph enumeration, attestation rings, reciprocal pressure, hidden-count leaks, fuzzy auto-resolution and admin rewrite fail closed. |
| Convergence | No new boundary, state, actor, field or unresolved implementation choice appeared. |

## Canonical Field Contracts

| Model | Fields and constraints |
|---|---|
| `work_credit` | `id, party_id, role_version_id?, role_literal, work_id, recording_id?, composition_id?, scope, qualifier?, contributed_on?, asserted_at, asserted_by, acting_context_version, confidentiality, state, claim_hash, supersedes_id?, version`; one active party/role/work/scope. |
| `credit_visibility_version` | `credit_id, confidentiality, page_curation?, source, inherited_from?, release_evidence_id?, objection_case_id?, effective_from/to, exposure_window?, version`. |
| `session_roll_entry` | `session_id, party_id?/shell_id, capacities[], author, state, version`; one subject per session. |
| `roll_interval` | `entry_id, starts_at, ends_at?, start_quality, end_quality, conflict, source_version`. |
| `contribution_claim` | `id, session_id, part_id?, party/shell, role_version/literal, instrument_versions[], asserter, asserted_at, visibility_intent, claim_hash, committed_at`. |
| `close_prompt_issue` | `id, session_id, recipient, delta_hash, claim_hashes[], channel, issued_at, reoffer_no, state`; unique recipient/delta. |
| `credit_claim` | `id, credit_id, shell_id, claimant_party, identity_evidence_ref, state, first_claimed_at, case_id?, version`. |
| `attestation` | `id, credit_id, claim_hash, attester_person/party, answer, requester_set[], conflict_note?, created_at, retracted_by_id?`; authenticated immutable edge. |
| `provenance_derivation` | `credit_id, evidence_set_hash, algorithm_version, rung?, score?, explanation_codes[], unavailable_reason?, derived_at`. |
| `role_version` | `id, canonical_key, base, modifier?, family_id, admitted_party_types[], labels, ddex_code?, fidelity, state, version`. |
| `pending_role_alias` | `id, requester_scope, literal, locale, candidate_ids[], state, resolved_role_id?, retained_hash`; bounded UGC. |

## State Machines

- Credit: `asserted -> contested | superseded | withdrawn`. `acknowledged` is intentionally absent because no independent interaction produces it; provenance strengthening occurs through the attestation state machine below, never through self-assertion. Contest is orthogonal participant state and never public suppression.
- Visibility: `confidential | embargoed -> lift_pending -> public`; `lift_pending -> embargoed` on timely objection; public may revert only within seven days when triggering release retracts.
- Roll: `provisional -> present -> departed -> closed`; conflict flag resolves without deleting prior versions.
- Claim: `suggested -> pending -> attached -> contested -> resolved | unresolvable`; unresolvable returns credit to original shell.
- Attestation request: `queued -> delivered -> answered | expired | muted`; max one request plus two nudges.
- Amendment: `draft -> proposed -> awaiting_agreement -> applied | disputed | correction_blocked`.

## Credit Assertion and Projection

1. Validate acting context, target work, party/shell, role input, scope and confidentiality.
2. Resolve role exact/alias; fuzzy only returns candidates; no hit commits screened literal plus requester-scoped pending alias.
3. Normalize unique key `party + role + work + scope`. Existing active credit accretes new evidence/asserter reference rather than duplicate row.
4. Commit credit and audit. Never create rights, split, payment or ownership row.
5. Public projection applies authorization before counts, grouping, ordering, pagination, cache and search.
6. Group by role family; pinned highlights then reverse chronology; leaf role and plain-language provenance sentence render per line.
7. Embargoed/confidential records produce identical nonexistence behavior across page, count, result total, graph, export, notification and status.
8. Restrictive visibility purges public projections within 60 seconds; permissive publication may lag and remains version-labelled until converged.

## Session Capture and Offline Merge

1. Pre-seed owner-only provisional roll from bookings, project collaborators and prior personnel; none count as presence until confirmed.
2. Record one entry per party/shell with many intervals/capacities and author. Bands expand to member entries.
3. Offline merge: additions win removals, capacities union, intervals widen and mark conflicted, inferred endpoints never corroborate.
4. Contributions remain separate from roll. Self asserts self; Producer/delegate may assert any roll party; asserter always actual human/delegate.
5. Each contribution has one role, many instruments, retained literal, visibility intent and claim hash. Replaced/non-final parts remain qualified.
6. Wrap or six hours inactivity closes session; reopen allowed 24 hours. Close never waits for credit/split confirmation.
7. Contributor delta and Producer reconciliation issue independently. Answer binds displayed claim hash; changed claim creates new ask.
8. Room-mode taps are witnessed, not attestations. Silence and skipped prompts are never refusal.

## Attestation and Provenance Derivation

1. Requester must be credited party, session owner or close workflow; attester must overlap session and be independent of credited party/asserter, including entity membership.
2. Suppress requests across active block/open dispute. Require work, date and another named present party.
3. Collapse concurrent requests by credit/attester. Enforce one request, nudges ≥7 and ≥21 days, recipient outstanding/rolling limits and mute/dormancy.
4. Record confirm/refuse/don't-know. Refusal identity and optional reason stay private; retraction appends reason and preserves edge.
5. Material party/role/work amendment invalidates all supporting attestations. Instrument, qualifier and taxonomy completion do not.
6. Derive categorical rung solely from current eligible evidence and configured algorithm version. Self-assertion/claim/import agreement never promotes.
7. Compute internal score separately; saturation limits extra attestations. Ring detection demotes edge score only and cannot change rung.
8. Derivation failure emits unavailable reason and removes label; never substitutes lowest or silently retains stale higher state.

## Embargo and Correction Algorithms

### Embargo

- Session default inherits project → Producer → room → embargoed; strictest co-Producer choice wins.
- Participants and credited party always retain scoped read/export; nonparticipants cannot infer existence.
- Release event, verified public evidence after 72-hour objection, or manual authorized lift may publish. Date is only reminder.
- Timely closed-ground objection pauses lift and opens Shard 06 case after platform re-verification.
- Lift is one-way except seven-day retracted-release recovery; exposure window remains permanent audit.

### Correction and Merge

- Amendment always creates successor. Party change uses claim transfer/dispute, never ordinary edit.
- Required non-response after day 3/day 10 reminders escalates day 14; it never auto-applies.
- Orphan with no available approver enters `correction_blocked` and remains readable.
- People never auto-merge. Knowledgeable party approves re-point manifest; rejection creates permanent negative assertion.
- Merge preserves each credit's visibility and history, then re-derives viewer projections.

## Dispute and Abuse Verification

| Threat/failure | Required control |
|---|---|
| Producer deletes replaced contributor | Append-only qualifier/amendment; original survives. |
| Roll presence becomes credit | No roll-to-credit command; explicit contribution required. |
| Claimant treats identity proof as contribution proof | Claim state and provenance rung separate; claim gives no rung. |
| Reciprocal attestation cartel | No reciprocity mechanic; independence predicate; score-only ring demotion; escalation requires non-topological evidence. |
| Refusal retaliation | Refusal unattributed and publicly indistinguishable from unanswered. |
| Fan maps private relationships | Fan traversal limited and viewer-relative; sparse density floor disables/degrades queries. |
| Embargo inferred from counts/cache | Authorization precedes all aggregates and cache keys; 404-equivalent response. |
| Fuzzy role corrupts record | Never auto-select; literal commits with pending resolution. |
| Taxonomy admin rewrites history | Credits pin role version/literal; deprecation does not re-resolve. |
| Concurrent correction/attestation | Expected claim hash/version; stale answer historical but unsupported. |
| Contest used to erase credit | Contest marker participant-only; public record remains at prior derived tier; discovery weight zero where specified. |
| Derivation worker outage | Explicit unavailable state and retry; no fabricated confidence. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Request/idempotency/error envelopes, outbox, offline replay, projection/cache purge and protected audit. |
| Shard 01 | Canonical party/shell/alias/membership/mandate and identity-merge evidence; Shard 07 owns no person identity. |
| Shard 06 | Credit/claim/lift disputes and privileged case-scoped projections; contest outcome returns typed command. |
| Shard 09 | Project/session/part source truth and wrap events; Shard 07 owns roll/contribution capture records. |
| Shard 10 | May consume credit IDs as evidence; cannot infer ownership/split from credit or mutate credit truth. |
| Shards 08, 18–20, 22, 23, 39 | Receive authorized rung/taxonomy/credit projections only; no internal score, ring flag, embargo existence or refusal identity. |

All downstream IA skeletons name Shard 07 reciprocally. Consumers use versioned events/projections, never direct credit-table coupling.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [07-credits-core § Contracts](../07-credits-core.md#contracts) defines commands/queries and [07-credits-core § Event Schemas](../07-credits-core.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked credit, visibility, capture, confidence, correction, dispute and taxonomy algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
