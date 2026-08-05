# Deep Dive 29 — Venues, studios and spaces

**Status:** Complete
**Parent:** [[specs/ia/29-venues-spaces|Shard 29]]

## Overview

This deep dive closes authority collisions, field truth, resource-graph availability, external-calendar uncertainty, atomic room-hire reservation and the performance-booking seam.

## Interactions

### Place, Claim and Room Lifecycle

1. Normalize location and compare both location and identity signals; neither alone authorizes merge.
2. Create a source-tagged record when no safe candidate exists. Seeded records remain visibly unverified and may never seed accessibility.
3. Resolve acting party through Shard 01. Place claims prove control, not legal ownership, and disclose no anchor details on failure.
4. Room creation auto-extends place type set and binds operating party by scoped grant or claim provenance.
5. Room rename/refit creates a new effective version. Subdivision/merge supersedes physical volumes and retains `formed_from` lineage.
6. Retire/supersede cannot strand confirmed reservations; operator previews migration/cancellation impact before commit.
7. Authority collision freezes widening changes, preserves existing service and enters Shard-06 adjudication.

### Structured Truth and Curation

1. Select room/use-type field schema from versioned settings.
2. Capture a typed value, closed caveats, optional display note, source and evidence; `none` and `not_stated` are explicit.
3. Validate shape and physical consistency. Impossible shapes reject; plausible contradictions publish with flags.
4. Append revision without overwriting history. Current projection chooses the last agreed value under field-class policy.
5. First-hand accessibility contradictions may temporarily outrank owner claims while adjudication runs; commercial terms remain operator-only and statutory slots remain declaration/authority-only.
6. Decay labels each field by source and age. Stale facts remain visible but drop from confident filtering and conformance.
7. Completed reservations generate up to a configured hard ceiling of observable fact prompts; silence never confirms.

### Availability, Holds and Calendar Sync

1. Expand requested interval through setup, teardown and room minimum changeover using `max(previous teardown, next setup, room minimum)`.
2. Traverse `requires`, `part_of`, derived `excludes`, soft `contends`, staff and Shard-24 allocation dependencies.
3. Normalize native reservations and provider busy blocks into the room timeline. Provider data exposes busy state only, never public client detail.
4. If provider freshness is outside configured tolerance, mark uncertain intervals unavailable for instant booking while enquiry remains possible.
5. Claim every hard resource under one serializable operation. Compute lead-time-proportional TTL clamped by settings and slot resale/announce floor.
6. A higher-ranked challenge may replace a hold only through the configured policy; replacement never extends the original hard expiry.
7. Convert all held resources with reservation commit or release all. Expiry/waitlist effects are emitted idempotently.

### Room-Hire Reservation

1. Classify declared use type. Rehearsal, recording session and dry room hire stay here; performance bill/deal routes to Shard 30 before financial terms.
2. Resolve room posture: contact-only, enquiry-only or instant-book. Posture may differ by use type.
3. Compute price from duration, static date/weekday variant, mandatory extras, provision posture and tax/currency context.
4. Freeze rate, spec, statutory, accessibility, cancellation and quote snapshots. Instant-book quote is binding until expiry; enquiry output is an estimate.
5. Acquire atomic hold and payment authorization, then commit reservation/compound. External payment failure compensates authorization and releases all resources.
6. Changes are new lifecycle events, not row edits. Reduce prices only the released delta; reschedule consumes a configured allowance atomically.
7. Completion is inferred after the slot, then remains provisional for the no-show window before facts can commit.

### Waitlist and Recurrence

1. Waitlist entry records acceptable slot/configuration/price bounds, eligibility, rank and expiry.
2. Cancellation or hold expiry selects one ranked candidate at a time; lead time controls offer-window length.
3. Expired offer advances the queue and consumes notification budget without penalizing the requester.
4. Recurring series creates deterministic instance IDs through a bounded review horizon.
5. Skip releases one instance; move creates an explicit exception. No-end recurrence is represented by periodic renewal, never infinite inventory capture.
6. Lockout supply may block calendar intervals and expose contact posture, but no tenancy money, deposits, eviction or subletting flow exists.

### Conformance and Handoff

1. Pin rider, room spec, event configuration, staffing and effective-condition versions.
2. Compare only schema-declared compatible fields. Display note is never machine-matched.
3. Return `match`, `unknown` or `conflict` per field with provenance, age, caveat and responsible follow-up party.
4. Summaries count states but never call the room suitable/unsuitable.
5. Performance-deal handoff sends immutable snapshot references and declared use type to Shard 30; each domain rejects the other's use types.

## Contracts

### Conditional Value

```text
ConditionalValue<T> = {
  value: T | none | not_stated,
  caveats: Caveat[],
  note?: display_only_text,
  provenance: ProvenanceRef,
  effective: Interval,
  revision: positive_integer
}

Caveat =
  weekday | time_window | date_range | room_configuration |
  billing_role | staffing | notice_period | priced_extra |
  temporarily_unavailable
```

Predicates are closed and schema-versioned. The evaluator chooses the most specific matching effective rule, rejects overlapping equal-specificity rules and never executes free text.

### Availability Decision

```text
AvailabilityDecision = {
  result: available | unavailable | uncertain,
  room_ref,
  interval,
  required_resources[],
  blocking_resources[],
  calendar_versions[],
  freshness_state,
  evaluated_at
}
```

Only `available` can enter instant-book hold. `uncertain` can enter enquiry with a disclosed reason.

### Room-Hire / Performance Seam

| Declared use | Owner | Allowed payload |
|---|---|---|
| rehearsal, recording session, dry hire | Shard 29 | room quote, rate, extras, cancellation and reservation |
| performance where hirer pays venue fixed room hire | Shard 29 | same as room hire; no artist compensation terms |
| performance where venue/promoter pays act or shares door | Shard 30 | room/spec/calendar snapshot refs and performance requirements |
| ambiguous/pay-to-play | Shard 30 review posture | no instant booking until classification is explicit |

### Policy Configuration

Every numeric behavior references an effective policy row: hold TTL clamps, announce/resale floor, sync freshness, claim settling window, corroboration threshold, response lapse, cancellation partition, reschedule allowance, no-show window, waitlist offer window, notification budget, recurrence review horizon, quote validity and operator-fault remedy. Policy updates are forward-effective; frozen reservations do not silently recompute.

## Data Models

### Provenance Resolution

| Field class | Writers | Resolution |
|---|---|---|
| statutory | authorized operator/profile source | declaration with expiry; not platform-verified |
| anchor | claim workflow only | private proof; never public field history |
| structural | authorized operator; qualified first-hand suggestion | last agreed, visible contest |
| operational fact | operator and qualified first-hand | last agreed; configured safe facts may auto-apply after corroboration |
| accessibility | operator and qualified visitor/performer | first-hand safety contradiction may govern temporarily |
| commercial | authorized operator only | community may flag but never set |

### Relationship and Resource Graph

- `requires(A,B)` means booking A atomically requires B.
- `part_of(A,B)` means whole/part occupancy follows configured exclusivity.
- `excludes(A,B)` is derived from requires, part-of or hard shared-resource capacity and is never directly edited.
- `contends(A,resource)` is a soft shared dependency; quote/booking must disclose and allocate or obtain acknowledgement.
- Effective-dated graph edits that conflict with confirmed future reservations are blocked until a safe date or governed migration.

### Calendar Authority

- Native confirmed reservation and active native hold are canonical for their resources.
- External busy block is authoritative only as a block, never proof of availability.
- Multiple providers union busy intervals. A deletion is accepted only beyond the connector's monotonic watermark.
- Mapping changes are future-effective and replay into a shadow projection before activation.
- Public availability is coarse; exact free/busy detail is scoped to authorized operator and qualified requester flows.

### Reservation Snapshots

Reservation keeps immutable references to use type, room/relationship graph version, spec fields relevant to use, accessibility/status overrides, rate/quote, cancellation policy, holder authority and provider freshness decision. Later corrections produce notices and remediation obligations; they do not rewrite what was represented at purchase.

## Access Control

### Capability Predicates

```text
may_manage_room =
  acting_party.has(room, manage_room) &&
  mandate.active_at(commit_time)

may_instant_book =
  requester.eligible &&
  room.claim == full &&
  posture(use_type) == instant_book &&
  calendar.fresh_enough &&
  quote.binding

may_publish_field =
  schema.writer_classes.includes(source_class) &&
  actor.scope.includes(room) &&
  evidence_policy_satisfied
```

- A place claimant cannot automatically control an independently claimed room; collision follows adjudication.
- A delegated booker sees assigned enquiry/calendar context but not payout destinations, org membership or unrelated clients.
- Community evidence is pseudonymous publicly; operators see only information needed to answer the claim.
- Provider tokens, raw calendar payloads, claim anchors and certificate-like documents never enter public/read projections.
- Administrative overrides require reason, before/after state, affected-party notice and immutable audit; no direct database edits.

## Accessibility

- Place claim, spec capture and calendar configuration remain usable on narrow mobile screens and at 200% zoom.
- Field freshness, provenance and contest status use text labels with accessible descriptions.
- Accessibility search states its unknown-handling before results and preserves the user's include/exclude choice.
- Effective-dated access failures surface at room, quote and reservation views and provide a direct remediation/contact path.
- Time inputs announce timezone and DST interpretation. Alternatives avoid drag, hover and map-only controls.
- Photo checklist identifies required shot purpose and supports text evidence when photography is unsafe or impossible.
- Hold timers and waitlist offer deadlines expose absolute date/time plus remaining time; expiration never relies on animation alone.

## Event Schemas

### Ordering and Idempotency

Every command, provider callback, expiry worker and compensation step uses a stable idempotency key; same-key replays return the prior result and same-key/different-payload attempts fail explicitly.

| Race | Resolution |
|---|---|
| Spec edit vs conformance run | Run pins observed spec version; newer version emits stale-run notice |
| External busy block vs native hold | Serializable interval claim checks latest mirror watermark before commit |
| Hold challenge vs conversion | One compare-and-swap terminal transition wins; loser reads final reservation/expiry |
| Room outage vs reservation commit | Status version is part of commit predicate; outage wins or reservation finishes first and receives immediate impact event |
| Quote expiry vs payment authorization | Reservation predicate checks server time; late authorization voids/compensates |
| Cancellation vs completion | Event-time and expected version decide; terminal state cannot be overwritten |
| Provider revoke vs webhook | Revocation epoch rejects later callback from prior grant |
| Duplicate merge vs new reservation | Merge lock covers identifiers; reservation resolves canonical room or retries |

### Event Privacy Classes

- Public projection events: publishable place/room/status/spec summary only.
- Counterparty events: reservation, quote, impact and contact-route references scoped to participants.
- Operator events: resource identities, sync diagnostics and private demand aggregates.
- Restricted events: claim proofs, moderation evidence, connector payloads and payment references; references only outside owning service.

## Edge Cases

### Failure and Recovery Matrix

| Failure | Deterministic recovery |
|---|---|
| Offline spec draft conflicts on reconnect | Merge non-overlapping fields; same-field conflict requires explicit choose/retain-both evidence |
| Provider returns partial page then timeout | Do not advance watermark; preserve previous busy union and mark delayed |
| Provider changes recurring event instance | Apply stable provider instance ID; missing ID creates conservative block and operator review |
| Room becomes out of service mid-session | Record incident, preserve current occupancy safety, block next slot and notify affected parties |
| Required staff withdraws from compound | Whole compound becomes impacted; no silent substitute or partial confirmation |
| Gear quantity drops below allocated demand | Preserve earliest confirmed allocations; block new holds and notify impacted later reservations |
| Rate changes while quote open | Binding instant quote remains until expiry; enquiry estimate refreshes before acceptance |
| Terms differ from actual deal | Reservation snapshot and Shard-30 contract remain distinct; drift may become private trust evidence, not automatic liability |
| Community report is coordinated abuse | Independence excludes linked accounts/bookings; Shard 06 rate-limits and adjudicates |
| Claimed record requests delisting | Close/suppress under policy while preserving referenced history and legal retention |
| Place closes with retained session archives | Notify affected holders and preserve policy evidence; file/right custody remains outside this shard |
| Public user infers vacancy from calendar | Coarse posture and privacy delay prevent exact occupancy disclosure |
| System resumes after scheduled outage | Reconcile provider watermarks, expire overdue holds, compensate unfinished commits, then reopen instant booking |

### Two-Implementer Check

Two independent implementations must converge on: room as canonical bookable unit; typed condition evaluation; explicit unknowns; per-field provenance; conservative external availability; all-or-release compound holds; frozen reservation snapshots; room-hire versus performance seam; three-way conformance; and settings-backed numeric policy. Any implementation that auto-merges, treats stale data as free, hardcodes timing, silently overwrites evidence, or creates partial compound reservations is non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [29-venues-spaces § Contracts](../29-venues-spaces.md#contracts) defines commands/queries and [29-venues-spaces § Event Schemas](../29-venues-spaces.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
