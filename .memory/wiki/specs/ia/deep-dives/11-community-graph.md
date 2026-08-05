# Deep Dive 11 — Social graph and collaborator network

> **Parent IA Shard**: [../11-community-graph.md](../11-community-graph.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns social-edge state, feed/search eligibility and ranking, derived collaboration paths, warm-intro privacy, density-aware reachability and owner-isolated CRM. Source domains own event truth; Shard 11 owns only authorized social projections and personal relationship records.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Follows, connections, endorsements, feed projections, appetite, calls, graph evidence, suppressions, intros, reachability and CRM records share explicit acting-party versions. |
| What-if expansion | Multi-entity acting, profile claim, block, source retraction, sparse graph, timeout, edge suppression, ignored intro, shadow reconciliation and local-only follows converge. |
| Adversarial pass | Follow-as-contact-consent, follower-roster exposure, engagement ranking, arbitrary A→B traversal, intro spam, decline leakage, notes-as-ranking and cross-owner shadow merge fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

| Model | Fields and constraints |
|---|---|
| `follow_edge` | `id, follower_party_id, target_party_id, alert_scope, state, created_at, ended_at?, version`; unique directed pair. |
| `connection_request` | `id, from/to party, context_type/id?, note_ciphertext, reachability_version, state, expires_at, version`. |
| `endorsement` | `id, endorser/endorsee, claim_key, evidence_kind/id/version, basis_label, state, hidden_at?, version`. |
| `activity_event_projection` | `id, source_domain/event/id/version, type, subject parties, evidence_class, actionability, geography, eligibility, amendment, occurred_at`. |
| `feed_preference` | `viewer_party, muted_party_ids/types/domains, controls, version`; private and non-notifying. |
| `open_to_signal` | `party_id, role_version/literal, mode, geography, scope, starts/expires, state, version`. |
| `collaboration_call` | `id, owner_party, role, scope, terms_kind, unused_submission_policy, expires_at, moderation/state, version`. |
| `collaboration_edge_evidence` | `id, endpoint_a/b human parties, source kind/id/version, evidence_class, attester, contribution_date, citable, state`. |
| `edge_suppression` | `edge_id, suppressor_human_party, starts_at, ends_at?, version`; no reason field. |
| `intro_request` | `id, requester/target/broker parties, ask_ciphertext, path_evidence_hash, state, expires_at, rate_key, version`. |
| `shadow_contact` | `id, owner_person/party, display_name_ciphertext, contact_refs_ciphertext, reconciliation_target?, state, version`. |
| `private_contact_note` | `id, owner, contact, content_ciphertext, policy_version, state, version`; no shared projection. |
| `follow_up_reminder` | `id, author, contact, due_at, recurrence?, source?, state, delivered_at?, version`. |

## State Machines

- Follow: `active -> ended`; replay may reactivate as a new version. Unfollow emits no target notification.
- Connection: `pending -> accepted | declined | expired | revoked`; accepted edge never enters derived collaboration graph.
- Endorsement: `active <-> hidden -> retracted`; hiding is endorsee-controlled and silent.
- Appetite/call: `draft -> active -> paused | expired | closed`; stale status never remains searchable.
- Intro: `requested -> broker_accepted -> target_invited -> channel_open | declined | expired | revoked`. Target is absent before broker acceptance.
- Shadow contact: `private -> reconciliation_proposed -> reconciled | private`; reconciliation always owner-confirmed.
- Reminder: `scheduled -> due -> delivered | completed | snoozed | cancelled`.

## Feed and Discovery Projection Algorithm

1. Ingest allowlisted typed source event; source domain supplies eligibility and amendment/retraction semantics.
2. Recheck viewer authorization, blocks/restrictions, acting-party scope, event eligibility and feed preference before candidacy.
3. Alert-class events route outside rank. Ordinary rank orders actionability, evidence class, geography/proximity, timeliness and viewer controls.
4. Native posts structurally remain below evidenced domain events. Scene membership may admit candidate but never boost/tie-break.
5. Return readable rank reasons; never expose numeric score, hidden alternatives or muted source.
6. Search candidate set uses public/shared role/provenance/appetite/remote/geography/feasibility projections.
7. Tag-only candidate remains degraded. Missing inputs appear in explanation; never silently treated as zero/negative.
8. Cache keys include viewer party, policy/block/suppression/projection versions; stale authorization invalidates.

## Collaboration Graph Algorithm

1. Build edges only between claimed active human parties from session/attestation evidence with second-human confirmation.
2. Exclude manual connections, follows, endorsements, entities, unclaimed profiles and self-only assertions.
3. Preserve each source edge independently. Source evidence class is lexicographically stronger than volume/recency; age is disclosed, not decayed.
4. At request time, resolve current blocks, endpoint suppressions, evidence citability and intermediary active/claimed status.
5. Query must be ego-rooted and target-specific. Search maximum depth two.
6. Intermediaries must be human; entities/unclaimed nodes may be terminals only.
7. Return path only if every edge can be explained to requester without leaking private context.
8. Dependency timeout/missing projection returns `unknown`. Exhaustive authorized search returns `no_path_within_intro_range`.
9. Either human endpoint suppression immediately removes edge from traversal without notification or effect on credits/evidence.

## Warm Intro and Reachability Algorithm

1. Resolve target reachability under block/restriction, compliance/minor policy, graph density, sender class and direct policy.
2. If direct unavailable but citable broker path exists, offer intro route; never reveal target refusal/block.
3. Validate specific ask, broker eligibility, dedicated requester rate and broker inbound cap.
4. Create broker-only request. Target receives no event/message/count until broker accepts.
5. Broker decline/ignore remains reasonless/blameless; expiry is neutral.
6. On broker acceptance, create target invitation with minimum disclosure. Only target acceptance opens channel.
7. Broker may attach optional note but need not forward requester pitch or warrant either party.
8. Revocation/block at any stage closes route and future delivery without explaining which control fired.

## Follow, Connection and Endorsement Rules

- Follow edges are entity-to-entity, approval-free, unbounded except abuse rate, and no public follower/following roster.
- Counts include active visible entities, never label people, and exclude suspended/deleted endpoints.
- Follow alert scope is per edge. Durable delivery requires verified email and explicit consent; otherwise local-only.
- Connection requests require context note and are supplementary. Fans have no connect surface.
- Endorsement requires eligible verified collaboration evidence. Claim basis stays visible; private CRM never supplies basis.
- Operator may endorse booking-evidenced reliability only, never craft. Endorsee may hide without changing evidence.

## Private CRM Isolation

1. Encrypt contact identifiers/note content and scope every query by owner person/party.
2. Two owners' records never deduplicate, co-reference or reveal common subject.
3. Shadow reconciliation requires owner-confirmed canonical target; no email/name auto-merge.
4. Reconciliation re-points reminders/tags/notes in one owner transaction; never copies to canonical profile or subject.
5. Notes are non-shareable by schema/API and absent from feed/search/ranking/endorsement/referral/safety inputs.
6. Validate notes against B5: prohibit special-category data and unverified allegations until counsel approves narrower version.
7. Logs/events contain opaque record IDs and policy outcomes only, never content/contact values.
8. Reminder delivery goes to author only and never signals subject.

## Abuse and Recovery Verification

| Threat/failure | Required control |
|---|---|
| Follow used to message target | Reachability independent; follow grants no contact capability. |
| Celebrity follower roster scraped | No public roster/API; viewer sees only own directed state and safe aggregate. |
| Platform maximizes outrage engagement | Actionability/evidence rank contract; no dwell/click/reaction objective. |
| User queries relationship between strangers | Ego-root predicate enforced server-side; A→B arbitrary denied. |
| Old/weak edges manufacture warm path | Every edge citable, second-human attested, source class explicit and fresh authorization checked. |
| Broker harassed by requests | Dedicated rate plus broker cap; silent decline/expiry. |
| Sender infers target block | Unified unavailable/intro route and no reason/count leak. |
| Private note harms another user | No shared consumers; B5 validation; owner-only encryption and audit. |
| Shadow contact becomes platform profile automatically | Owner confirmation mandatory; subject gets no signal. |
| Graph/search outage says no relationship | Explicit unknown state and retry. |
| Suppressed edge remains cached | Suppression version in path cache key and immediate invalidation. |
| Follow exists only in browser | No durable alert; local state truthfully labelled until consented synchronization. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Request/event/search/cache/notification/error and protected storage contracts. |
| Shard 01 | Party/acting context/profile claim/membership/block and minor/compliance predicates. |
| Shard 06 | Restriction/moderation outcomes and prohibited CRM-content policy; no CRM browsing. |
| Shards 07/09/14/30 | Supply citable collaboration/booking evidence; source truth remains theirs. |
| Shards 12/13/37/38 | Consume safe follow/feed/discovery/reachability events and projections only. |

All dependent IA skeletons name Shard 11 reciprocally. No consumer receives raw edge evidence, path internals, private notes, shadow contacts or refusal/block reason.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [11-community-graph § Contracts](../11-community-graph.md#contracts) defines commands/queries and [11-community-graph § Event Schemas](../11-community-graph.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked graph, ranking, discovery, intro, reachability and CRM isolation algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
