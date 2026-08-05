# Deep Dive 09 — Music projects and collaboration

> **Parent IA Shard**: [../09-projects-collaboration.md](../09-projects-collaboration.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns song/project container invariants, roster-derived access, immutable media lineage, canonical resolution, review/share/approval, sessions/capture arbitration, delivery/readiness and the future DAW-bridge gate. It does not own credit evidence, rights, splits, payments or distribution.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Container, roster, invite, asset, version, canonical, review, link, approval, session, prompt, package and bridge records share exact versions, idempotency and audit. |
| What-if expansion | Owner loss, role outage, forwarded invite, revocation, offline upload, ambiguous lineage, compromised canonical, link/roster collision, reopen and stale package converge. |
| Adversarial pass | Access-by-link, hand grants, credit deletion, hidden personnel counts, auto-canonical, review audience promotion, fake stream protection, operator overreach and agent filesystem creep fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

### Containers, Roster and Assets

| Model | Fields and constraints |
|---|---|
| `song` | `id, owning_party_id, lifecycle, current_stage, confidentiality, created_by/context, archived_at?, version`; no right/split fields. |
| `project_song_membership` | `project_id, song_id, purpose?, added_by/at, removed_at?, version`; many-to-many. |
| `release_membership` | `release_id, song_id, sequence, variant_key, selected_master_version_id?, version`; selected master pins exact version. |
| `roster_event` | `id, song_id, subject_party/shell, role_version/literal, event_kind, author/context, effective_at, claim_id?, access_profile_version?, version`; append-only. |
| `contributor_invitation` | `id, song_id, roster_event_ids[], inviter/delegate, intended_recipient_hash, disclosure_tier, delivery, response, expires_at, version`. |
| `asset` | `id, song_id, kind, sensitivity_class, source_version_id?, declared_owner_context, state, version`. |
| `asset_blob` | `id, asset_id, checksum, bytes, media_type, residency, storage_locator, integrity_state, tombstoned_at?`; locator protected. |
| `nda_acceptance` | `subject_identity, song_id, terms_version, accepted_at, method, evidence_hash`; append-only. |

### Versions, Review and Sessions

| Model | Fields and constraints |
|---|---|
| `audio_version` | `id, song_id, sequence, author_person/party, author_confirmed, producer_label, type_suggestion?, authored_at?, ingested_at, checksum, metadata, residency, integrity, version`. |
| `lineage_edge` | `child_version_id, parent_version_id, character, source, confidence, corrected_by?, created_at`; acyclic; child may be root. |
| `canonical_slot` | `song_id, stage, variant, format, target_version_id?, reserved_by?, proxy, version`; unique slot. |
| `canonical_movement` | `slot, from/to, actor/context, reason, target_integrity, created_at, idempotency`; immutable. |
| `review_comment` | `id, version_id, author/ref, audience, body/history, state, created_at, resolved_reason/version?, reopen_count`. |
| `comment_anchor` | `comment_id, start_ms, end_ms?, bar/beat/section?, mapping_confidence, placed_by?`. |
| `share_link` | `id, version_id, creator, recipient_hash?, mode, watermark_policy, analytics_mode, starts_on_first_access, expires/cap, state, version`. |
| `approval_record` | `gate_id, version_id, approver/ref, proxy_for?, approver_set_version, open_comment_hash, decision, created_at`; append-only. |
| `session` | `id, owner_person/party, source_kind/ref?, grade, sensitivity, started/closed/reopened, state, version`. |
| `attendance_assertion` | `session_id, subject_party/shell, asserted_by, state, timing?, timing_consent?, evidence_refs[], version`; set semantics. |
| `capture_moment` | `id, session_id, close_event_id, batch_key, tier_budget, state, dispatched_at?`. |

### Delivery and Bridge

| Model | Fields and constraints |
|---|---|
| `recipient_spec_version` | `id, owner_domain, key, version, required_slots/assets/metadata, objective_checks, effective interval, state`. |
| `handoff_package` | `id, song/project, spec_version, canonical_pin_hash, manifest, validation, checksum, artifact_locator, state, version`. |
| `qc_result` | `source_version/package, check_key/version, outcome, measurement?, consequence, dismissed_at?, unverifiable_reason?`. |
| `readiness_projection` | `target/spec/source_hash, weighted_gaps[], computed_at, viewer_scope_hash`; derived/live. |
| `source_declaration` | `asset/section, state, kind, details, author, declared_at, supersedes_id?, clearance_ref?`. |
| `bridge_device` | `id, owner, device_public_key, agent_version, allowed_roots_hash, grant, gate_evidence, state, last_seen`; no v1 active rows. |

## State Machines

- Song lifecycle: `active <-> shelved -> archived`; `unadministered -> active` only through restored authority. Non-empty song never deletes.
- Roster involvement: `proposed -> active -> ended`; claim retraction is separate and may route to dispute.
- Invitation: `draft -> sent -> delivered -> accepted | declined | expired | suppressed`; attribution survives invite expiry.
- Asset blob: `uploading -> settling -> hot -> cold -> tombstoned`; immutable record remains.
- Audio version: `ingesting -> available | integrity_failed -> tombstoned_bytes`; record never edits/deletes.
- Canonical slot pointer may set/change/clear; every transition writes movement record.
- Review comment: `open -> resolved -> reopened -> resolved`; retraction hides body but preserves state/history.
- Session: `scheduled? -> active -> closed -> reopened -> closed -> amended`; scheduled mirror may discard if never activated.
- Package: `draft -> resolving -> validating -> blocked | generated -> stale | superseded`.

## Roster, Invitation and Access Algorithm

1. Resolve actor's current per-song union of roles and `roster:write`/`may_invite` capability.
2. Validate subject disambiguation. Unclaimed shell is allowed; name search alone never binds an existing party.
3. Resolve Shard 07 role. Unknown/unavailable commits bounded literal and claim but provides no derived access until profile resolves.
4. Commit roster event and Shard 07 claim command atomically through outbox. Notify named party and authorized roster audience.
5. Invitation preview exposes T0 only. T1 disclosure may stream one non-confidential pinned rough; T2 requires verified identity and NDA.
6. On access, calculate union of live roles, then intersect sensitivity profile, blocks, NDA, asset state and version. Never persist hand-edited asset grants.
7. Issue short-lived scoped token. Any role/block/NDA/material-policy change invalidates grants and signed URLs.
8. End involvement revokes access but leaves roster history/credit. Claim retraction follows Shard 07/06, never owner delete.

## Version Ingest and Canonical Algorithm

1. Upload to quarantine; wait for stable size/hash. Retry with same idempotency/hash returns existing ingest.
2. Record immutable sequence, original label, author or visible unconfirmed author, ingest/authored timestamps, checksum and measured metadata.
3. Suggest version type from filename but require confirmation; never rename producer file or silently apply suggestion.
4. Infer parent only when evidence is unambiguous; otherwise commit root/sibling and request lineage. Enforce acyclic edge.
5. Verify checksum/plausibility. Unknown checks remain unverifiable; uncomputed deltas never render zero.
6. Do not set canonical. Nomination validates actor, slot reservation/proxy, target visibility/integrity and expected slot version.
7. Commit pointer movement/outbox. Re-nomination of same target is idempotent; clearing is allowed.
8. Compromised canonical raises blocking alarm and preserves pointer until explicit clear/replace; no fallback to latest.
9. Canonical, approval, release pin and dispute make bytes retention-hot; erasure redacts author identity, never version.

## Review, Link and Approval Algorithm

1. Anchor comment to immutable version with point/range and optional musical anchor; audience fixed before text entry.
2. Five-minute typo edit allowed only with no reply/triage; later correction/retraction appends history.
3. Carry open comment down direct lineage. Exact mapping displays normally; musical mapping caveated; uncertain enters unplaced list with original playback.
4. New version resolves nothing. Three carries trigger one staleness notice, not auto-action.
5. Create per-recipient link by default; public link requires explicit disclosure of weaker identity/analytics/watermark guarantees.
6. First access starts expiry; active playback receives bounded grace. Roster-authenticated human resolves to project view without link analytics.
7. Recipient comments remain mutually isolated. Creator and song owner may view analytics/revoke; recipient is told measurement mode.
8. Approval pins exact version, approver-set version and open-comment hash. Proxy visibly weaker. Later version never inherits except explicit re-advance rule with no intervening version.

## Session and Capture Arbitration

1. Suggest session from booking/order/room/project activity; human confirms. No one is auto-present.
2. Session owner derives from creating context priority and remains exactly one; source booking/order stay linked distinct facts.
3. Attendance is set-valued assertions; overlaps permitted, fine timing opt-in by tracked person, Operator sees headcount/contact only.
4. Close after human action or twelve hours inactivity; resume within six hours reopens same session.
5. Commit close before dispatching asks. Batch closes within ten minutes; reopen within thirty minutes re-arms but never recalls asks.
6. Tier 1 contributor asks fire independently and non-blockingly. Tier 2 permits one Producer heavyweight ask; empty prefill does not fire.
7. V1 prefill uses session roll/roster/manual project facts only. No DAW parse, local agent or source-path observation.
8. Dismissal/silence creates debt, never refusal or failed session. Shard 07 owns credit ask; Shard 10 owns split ask.

## Delivery, QC and Readiness Algorithm

1. User chooses target backed by an owned recipient spec; unowned target is unavailable.
2. Resolve canonical slots once, then pin exact versions/spec. Revalidate authorization and source versions.
3. Include only required assets/metadata; oversending is privacy failure.
4. Validate checksum/integrity first. Integrity blocks; alignment/naming/loudness/objective checks warn with consequence and action.
5. Unsupported checks render unverifiable, never passed. Sticky dismissal applies to same project/check version.
6. Generate immutable manifest/artifact and receipt. Source changes during build produce `SOURCE_STALE`.
7. Readiness is on-demand live ordered debt for selected target. Hidden dependency appears opaque and never reveals protected field.
8. V1 package explicitly states environment manifest and missing-media parse unavailable.

## DAW Bridge Evidence Gate

Bridge remains disabled until all are reviewed and recorded:

1. Costed local-agent build/update/signing/notarization/support model suitable for solo team.
2. Threat model proving least filesystem read scope, secret isolation, signed updates, revocation and local queue protection.
3. Representative real-session validation for each supported DAW plus legal review of parsing format.
4. Product evidence that watch-folder agent improves capture enough to justify permanent desktop operational surface.

Activation is a new architecture decision propagated downstream; a feature flag alone cannot authorize it.

## Abuse and Recovery Verification

| Threat/failure | Control and proof |
|---|---|
| Owner removes contributor history | End involvement cannot delete roster/credit/version events. |
| Forwarded invite leaks stems | Bearer receives T0 only; T2 identity/NDA/role check required per access. |
| Producer hand-grants sensitive asset | No hand-grant schema/API; access derives from profile intersection. |
| Revoked user reuses signed URL | Grant-version/token revocation checked at edge/origin; short expiry. |
| Upload races create duplicate versions | Stable hash/idempotency plus unique song/hash/ingest key. |
| System chooses “latest” as canonical | No auto-canonical command; unset is explicit. |
| Share analytics becomes surveillance | Disclosed mode, analytics-free option, minimal events, creator/owner scope and no roster-account measurement. |
| Link recipient sees other feedback | Recipient-scoped audience RLS and hidden counts. |
| Operator infers unreleased work | Booking/headcount projection excludes music, names and prompt state. |
| Readiness leaks hidden gap | Opaque dependency code after authorization; no field/name/count. |
| Source declaration mistaken as clearance | Separate state/event and downstream owner; no rights mutation. |
| Local agent reads home directory | Evidence gate, allowed-root attestation and deny-by-default device grant; disabled v1. |
| Package worker partly writes | Unsealed artifact quarantined; canonical request retries idempotently from pinned manifest. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Upload quarantine/storage, request/idempotency/errors, outbox, offline replay, signed URLs, cache purge and audit. |
| Shard 01 | Party/shell/membership/authority/block and succession; workspace access never creates identity truth. |
| Shard 07 | Role taxonomy, roster-generated claims, session/credit capture and provenance; Shard 09 never edits credit records. |
| Shard 10 | Receives song/session/source/credit pointers for rights/splits; rights outcome never changes project facts. |
| Shards 14/17/19/22/32 | Consume exact project/session/version/package projections for services, royalties, distribution and operations. |

All dependent IA skeletons name Shard 09 reciprocally. Consumers use typed commands/events and opaque versioned projections, never direct asset/project tables.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [09-projects-collaboration § Contracts](../09-projects-collaboration.md#contracts) defines commands/queries and [09-projects-collaboration § Event Schemas](../09-projects-collaboration.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked project, access, version, review, session, delivery and future-bridge algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
