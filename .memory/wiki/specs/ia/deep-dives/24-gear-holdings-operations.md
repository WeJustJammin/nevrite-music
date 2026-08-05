# Deep Dive 24 — Gear collections, rigs, custody and manifests

**Status:** Complete
**Parent:** [[specs/ia/24-gear-holdings-operations|Shard 24]]

## Overview

This deep dive closes publication exposure, rig/member continuity, compatibility confidence, condition conflicts, custody authority and volatile case/manifest behavior.

## Interactions

### Publication and Exposure Algorithm

1. Resolve current item authority and requested audience; default is private per item.
2. Generate a public-safe projection that excludes serial, exact location, private/appraised value and hidden-history counts.
3. Inspect media renditions for serial/location leakage. Automatic masking requires review confidence; uncertainty blocks activation.
4. Evaluate composed exposure against public city, dates/absence, venue address and follower reach without exposing private inputs.
5. When material, present a named warning and bind acknowledgement to evaluator/policy version.
6. Commit publication version and outbox event atomically. Public aggregate collection value is never computed.

### Rig, Compatibility and Export Flow

1. Create rig under an acting person or organisation; project/tour is optional context, not owner.
2. Add canonical records, confirmed-held records or placeholders in ordered signal path; unknowns remain unknown.
3. On transfer/loss/unavailability, replace the live usable reference with an unresolved placeholder and preserve prior versions.
4. Run compatibility only on explicit request against pinned rig, target and region-reference versions.
5. Report hard findings in voltage → connector → physical → format order; render unchecked members, stale target and coverage equally.
6. Export source snapshot with gaps and requirements. Held-item identity requires a disclosure grant; otherwise export a functional placeholder.
7. Shard 32 decides document layout, delivery, stage plot and whether advancing requests a refreshed snapshot.

### Register and Condition Flow

1. Entity-role holder creates either an identity line or quantity line; the system never chooses mode.
2. Reporter appends `functional`, `degraded`, `faulty` or `out_for_service` with note and observed time.
3. Quantity condition records total and affected count; it never pretends to identify a unit.
4. Conflicting reports stand. Public composition states disagreement and gives the worse plausible grade equal or greater prominence.
5. Tunable freshness marks condition stale and prompts authorized staff; it never clears or upgrades state.
6. Service event may supersede a report, preserving prior attribution and timeline.
7. Booking dependency notification fires when serviceable quantity crosses below the reserved threshold.

## Contracts

### Authority Derivation

`effectiveCapability = actingPartyRole ∩ ownershipAuthority ∩ confirmedCustody ∩ acceptedGrant ∩ currentPolicy`

- Ownership authorises custody/grant decisions but does not prove current possession.
- Confirmed custody authorises holder operations explicitly allowed for the reason; it does not imply sale, publication or insurance authority.
- `public_disclosure` and `sell` are separate grants with subject, audience/marketplace, term and revocation.
- Self-asserted, stale or disputed custody never creates new external authority.

### Snapshot Contract

- Compatibility, rig exports and manifests pin every source aggregate/version and creation time.
- Later edits never mutate a snapshot; consumers may compare with current versions and request refresh.
- Every field is typed `known`, `unknown`, `withheld` or `not_applicable`; omission cannot masquerade as known absence.
- A readiness result is `ready` only when purpose-specific required fields and grants are present.

## Data Models

### Custody State Machine

`pending → active → stale → active|disputed|ended`

`pending → disputed|ended` and `active → disputed|ended` are valid. No time passage produces `ended`.

| Reason | Default operational capability | Additional grant candidates |
|---|---|---|
| loan | hold, include functionally in private rig/case | public disclosure |
| service | hold, report condition, return | none |
| consignment | hold | sell, public disclosure |
| hire | hold, private operational use | public disclosure if owner permits |
| in_transit | hold/track until receipt | none |
| room_resident | hold, condition report, private register use | room publication |

### Case Membership Model

- Membership is an effective-dated fact, not a permanent parent-child relation.
- A rapid packing edit changes the live set; snapshots preserve the exact prior set.
- Case confidence may become stale after a configured interval or detected rig divergence, but membership never expires automatically.
- One item may be in multiple logical cases only when the intervals do not claim impossible simultaneous physical packing; a conflict remains visible for reconciliation.

## Access Control

### Disclosure Matrix

| Data | Private controller | Confirmed holder | Public projection/export |
|---|---:|---:|---:|
| Serial / exact identifiers | yes | purpose-limited | never |
| Private/appraised value | yes | only explicit operational purpose | never in collection/backline; purpose-bound carnet source only |
| Exact location | yes | relevant custody endpoint | never |
| Condition | yes | relevant item | published when item is published; cannot be selectively hidden |
| Held-item identity | yes | yes | owner disclosure grant required |
| Aggregate collection value | yes | no | never |

- Public-safe renditions are separate immutable media derivatives; originals remain protected.
- Revoking disclosure removes future/live projections but does not rewrite already delivered lawful snapshots; retention/withdrawal rules remain purpose-specific.
- Custody disputes suppress derived listing/publication authority immediately while preserving evidence.

## Accessibility

- Compatibility and readiness results begin with a textual summary, then ordered findings and unchecked items.
- Rig order has keyboard reorder controls, announced positions and a non-visual connection list.
- Custody state, confidence and grants use distinct text labels rather than badges alone.
- Conflict views expose both reports, authorship and timestamps without requiring side-by-side visual comparison.
- Manifest exports preserve headings, table semantics, reading order and explicit unknown/withheld labels.

## Event Schemas

### Race Resolution

| Race | Resolution |
|---|---|
| Transfer while rig/case edit commits | Transfer wins identity authority; stale edit retries and may preserve member only as placeholder |
| Custody confirmation and revocation cross | Aggregate version orders commands; later accepted command emits compensating grant/state event |
| Fault and service completion cross | Both append; observed/effective times compose current state, never arrival order alone |
| Case edit while manifest creates | Snapshot transaction pins pre- or post-edit version; mixed membership is impossible |
| Publication while exposure policy changes | Activation requires current evaluator version; stale acknowledgement fails precondition |

All state-changing events follow the parent envelope and are emitted transactionally with the authoritative write.

## Edge Cases

| Ambiguity | Locked resolution |
|---|---|
| Who owns a rig? | Acting person or organisation; project/tour is context; gear ownership remains per record |
| What happens after a member is sold? | Live operational member becomes unresolved placeholder; immutable versions preserve history |
| Is compatibility automatic? | On demand and advisory; no booking block or unscoped “compatible” result |
| Can condition be hidden? | Not for a published line; unknown/stale/conflict must be explicit |
| How do quantity faults notify bookings? | Notify when serviceable count drops below the reservation’s declared dependency |
| Can held gear be published/exported? | Only with owner-granted disclosure; otherwise use a non-identifying placeholder |
| Does case membership expire? | No; freshness decays and prompts reconciliation |
| Where is country of origin captured? | Optional logistics fact keyed to the gear record, required only by purpose-specific readiness; missing data remains a gap |
| Which value feeds a carnet? | User-selected purpose value with source/type and explicit non-legal disclaimer; Shard 32/legal process validates use |
| Does this shard issue carnets? | No; it supplies versioned source data and gaps only |

## Dependency References

- [[specs/ia/23-gear-provenance-registry|Shard 23]] owns identity, title evidence, theft, service and valuation sources.
- [[specs/ia/29-venues-spaces|Shard 29]] owns room terms, price, provision posture, reservations and availability.
- [[specs/ia/32-show-production-planning|Shard 32]] owns advancing documents, freight workflow, stage plots and carnets.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [24-gear-holdings-operations § Contracts](../24-gear-holdings-operations.md#contracts) defines commands/queries and [24-gear-holdings-operations § Event Schemas](../24-gear-holdings-operations.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

- 2026-08-02: Deepened safety-aware publication, operational groupings, advisory compatibility, condition/custody state and immutable logistics snapshots.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
