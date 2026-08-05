# Shard 29 — Venues, studios and spaces

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 29 owns place and room identity, room technical truth, provenance, availability, room-hire reservation primitives and rider-to-room conformance. It consumes acting-party authority from [[specs/ia/01-identity-authority|Shard 01]], evidence and abuse controls from [[specs/ia/06-trust-safety|Shard 06]], and published gear posture from [[specs/ia/24-gear-holdings-operations|Shard 24]]. It hands performance-deal negotiation and contracts to [[specs/ia/30-booking-contracts|Shard 30]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 47 |
| Child capabilities | 35 |
| Place boundary | One physical premises record with a type set, room children and optional trade profile |
| Bookable boundary | Room is the spec-, calendar- and reservation-carrying unit |
| Launch booking | Contact, enquiry and instant room hire; performance bill slots hand off to Shard 30 |
| Launch exclusions | Dynamic pricing, operated tenancies, virtual-tour hosting, bulk PDF ingestion and automated PRO submission |
| Truth model | Per-field provenance, immutable revision history, visible contests and explicit unknowns |
| Gear boundary | Shard 24 owns assets and condition; this shard owns room allocation, provision posture and booking effects |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Place and room identity | A place is a building, not a business. Its type set must contain every live room type. A room is a physical volume and survives rename/refit; subdivision or merge creates successors with lineage. |
| Authority | Unclaimed places remain describable but rooms cannot become bookable. Room operating authority arrives through a Shard-01-backed grant or verified room-scoped claim; revocation is adjudicated, never a unilateral destructive action. |
| Technical truth | Structured fields use typed value, closed caveats and display-only note. `none`, `not_stated`, `contested` and `temporarily_unavailable` are distinct. |
| Conditionality | A shared, bounded condition model supports date range, weekday, time window, room configuration, billing role, operator/staffing, notice and priced-extra predicates. No free-form rule engine. |
| Accessibility | Audience and performer/crew routes are separate structured profiles. Explicit accessibility filters exclude unknown by default and offer an announced “include not stated” control. Temporary losses are effective-dated overrides. |
| Statutory data | The address resolves a versioned jurisdiction profile. Launch authors the US profile only; unsupported territories show unknown. Store declarations and expiry, not certificate documents or verification claims. |
| Availability | Platform calendar is authoritative only for native reservations. External uncertainty blocks availability conservatively and visibly; stale sync downgrades instant booking instead of claiming a free slot. |
| Quotes | Instant-book computed quotes are binding for a configured validity window. Enquiry quotes are explicitly estimates until accepted through Shard 30 or a room-hire contract. |
| Pricing | Static off-peak and seasonal variants are allowed. Dynamic demand pricing is disabled. Every rate, TTL, threshold, window and penalty is versioned configuration, never hardcoded. |
| Recurrence and lockout | Recurring bookings have series identity and bounded review dates. Lockout/tenancy supply may be represented but rent, deposits, eviction and subletting are not operated. |
| Conformance | Rider-to-room comparison returns `match`, `unknown` or `conflict` per field with provenance and age. It informs; it never blocks negotiation or booking. |

## Features

- **16.01 Place Records & Rooms** — [ideation source](../ideation/16-venues-studios-spaces/16.01-place-records-rooms/16.01-place-records-rooms-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **16.02 Venue Technical Specification** — [ideation source](../ideation/16-venues-studios-spaces/16.02-venue-technical-specification/16.02-venue-technical-specification-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **16.03 Studio Technical Specification** — [ideation source](../ideation/16-venues-studios-spaces/16.03-studio-technical-specification/16.03-studio-technical-specification-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **16.04 Rehearsal & Practice Space Specification** — [ideation source](../ideation/16-venues-studios-spaces/16.04-rehearsal-practice-space-specification.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **16.05 Curation, Provenance & Data Integrity** — [ideation source](../ideation/16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05-curation-provenance-data-integrity-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **16.06 Space Booking & Reservations** — [ideation source](../ideation/16-venues-studios-spaces/16.06-space-booking-reservations/16.06-space-booking-reservations-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **16.07 Spec Conformance Check (Rider ↔ Room)** — [ideation source](../ideation/16-venues-studios-spaces/16.07-spec-conformance-check-rider-room.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-29.01 — Create or find place:** Given Actor may contribute; normalized location available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create or find place, and (6) return Existing candidate is shown or seeded/community record created with source provenance; if the flow cannot complete, Race may create candidate duplicate; never silently merge.
- **AC-29.02 — Claim place or room:** Given Shard 01 acting party; eligible proof route, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Claim place or room, and (6) return Provisional/full authority and scoped capabilities recorded; if the flow cannot complete, Failed proof reveals no private anchor; review/appeal retained.
- **AC-29.03 — Add or change room:** Given Authorized operator; place type compatible, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add or change room, and (6) return Room, operating party, relationships and effective version commit; if the flow cannot complete, Type auto-extends on add; removal with live room blocks.
- **AC-29.04 — Retire, supersede or outage room:** Given No unsafe future transition, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Retire, supersede or outage room, and (6) return History remains; availability closes from effective time; if the flow cannot complete, Confirmed reservations block retire/supersede or require explicit migration.
- **AC-29.05 — Publish room specification:** Given Authorized operator/contributor by field class, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish room specification, and (6) return Typed field revision, source, age and completeness tier publish; if the flow cannot complete, Contradictions flag; malformed or impossible typed values reject.
- **AC-29.06 — Publish gear provision:** Given Room references authorized Shard-24 register view, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish gear provision, and (6) return Provision posture and available quantity/identity projection publish; if the flow cannot complete, Missing authority or composed-exposure risk suppresses detail.
- **AC-29.07 — Contribute photo/evidence:** Given Actor has first-hand or operator capability, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contribute photo/evidence, and (6) return Evidence attaches to checklist slot and field with provenance; if the flow cannot complete, Safety/privacy removal allowed; mere unflattering accuracy becomes contest, not erasure.
- **AC-29.08 — Read accessibility:** Given Public room exists, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Read accessibility, and (6) return Separate audience and performer routes show caveats, source and temporary overrides; if the flow cannot complete, Unknown is announced; no binary “accessible” claim is inferred.
- **AC-29.09 — Suggest factual correction:** Given Field class permits contribution, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Suggest factual correction, and (6) return Immutable suggestion/contest enters review or configured safe auto-apply; if the flow cannot complete, Commercial terms and statutory declarations never community-overwrite.
- **AC-29.10 — Change place status/at-risk:** Given Authorized operator or qualified evidence, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Change place status/at-risk, and (6) return Effective status/signal propagates to projections and calendars; if the flow cannot complete, Public at-risk claim requires moderation/corroboration; abuse routes Shard 06.
- **AC-29.11 — Configure availability:** Given Authorized room operator; version current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure availability, and (6) return Native slots, buffers, holds, exceptions and external blocks form one room calendar; if the flow cannot complete, Cycles/overlaps reject with exact resource/member.
- **AC-29.12 — Sync external calendar:** Given Provider grant valid; room mapping explicit, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Sync external calendar, and (6) return Busy-only mirror updates watermark and staleness state; if the flow cannot complete, Ambiguous or stale sync blocks uncertain slots and disables instant book.
- **AC-29.13 — Place/challenge hold:** Given Slot and resource graph available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Place/challenge hold, and (6) return Ranked expiring hold claims all required resources atomically; if the flow cannot complete, Losing challenge names higher claim; expiry releases all resources.
- **AC-29.14 — Request room-hire enquiry:** Given Posture permits use type; requester eligible, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request room-hire enquiry, and (6) return Routed enquiry carries identity, credits, requirements and lapse time; if the flow cannot complete, Broken assignee falls back to org; lapse is explicit, never decline.
- **AC-29.15 — Instant-book room hire:** Given Full claim, valid rate card/payout, fresh calendar, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Instant-book room hire, and (6) return Quote, policy, resources, payment authorization and reservation commit idempotently; if the flow cannot complete, Any leg fails all-or-release-all; payment compensation visible.
- **AC-29.16 — Reserve compound resources:** Given Every room/person/asset dependency available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reserve compound resources, and (6) return One compound identity owns member reservations and holds; if the flow cannot complete, Member failure releases all and identifies failed dependency.
- **AC-29.17 — Cancel, reduce or reschedule:** Given Reservation/policy snapshot active, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Cancel, reduce or reschedule, and (6) return Versioned ladder applies to released delta; one allowed move is atomic; if the flow cannot complete, Stale request returns current terms/state; no partial mutation.
- **AC-29.18 — Complete/no-show reservation:** Given End plus configured provisional window reached, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Complete/no-show reservation, and (6) return Completion inferred, then evidence harvest becomes eligible; if the flow cannot complete, Timely no-show voids provisional harvest; money dispute remains separate.
- **AC-29.19 — Join/receive waitlist offer:** Given Eligible demand and expiring entry, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Join/receive waitlist offer, and (6) return Ranked, lead-time-aware sequential offer receives bounded acceptance window; if the flow cannot complete, Expiry advances queue; repeated-loss notification budget enforced.
- **AC-29.20 — Create recurring series:** Given Every instance and review horizon valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create recurring series, and (6) return Series identity, exception instances and future review commit; if the flow cannot complete, Conflicting instance is named; user may trim/split, never partial-create silently.
- **AC-29.21 — Compare rider to room:** Given Comparable rider/spec snapshots available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compare rider to room, and (6) return Per-field match/unknown/conflict and confidence projection returns; if the flow cannot complete, Stale/unsupported fields become unknown, not false conflict.
- **AC-29.22 — Hand off performance bill slot:** Given Declared use type means venue pays/splits with act, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Hand off performance bill slot, and (6) return Shard 30 receives immutable room/spec/availability snapshot references; if the flow cannot complete, Room-hire fields are rejected at seam; no dual lifecycle.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 29.01 | Create or find place | Actor may contribute; normalized location available | Existing candidate is shown or seeded/community record created with source provenance | Race may create candidate duplicate; never silently merge |
| 29.02 | Claim place or room | Shard 01 acting party; eligible proof route | Provisional/full authority and scoped capabilities recorded | Failed proof reveals no private anchor; review/appeal retained |
| 29.03 | Add or change room | Authorized operator; place type compatible | Room, operating party, relationships and effective version commit | Type auto-extends on add; removal with live room blocks |
| 29.04 | Retire, supersede or outage room | No unsafe future transition | History remains; availability closes from effective time | Confirmed reservations block retire/supersede or require explicit migration |
| 29.05 | Publish room specification | Authorized operator/contributor by field class | Typed field revision, source, age and completeness tier publish | Contradictions flag; malformed or impossible typed values reject |
| 29.06 | Publish gear provision | Room references authorized Shard-24 register view | Provision posture and available quantity/identity projection publish | Missing authority or composed-exposure risk suppresses detail |
| 29.07 | Contribute photo/evidence | Actor has first-hand or operator capability | Evidence attaches to checklist slot and field with provenance | Safety/privacy removal allowed; mere unflattering accuracy becomes contest, not erasure |
| 29.08 | Read accessibility | Public room exists | Separate audience and performer routes show caveats, source and temporary overrides | Unknown is announced; no binary “accessible” claim is inferred |
| 29.09 | Suggest factual correction | Field class permits contribution | Immutable suggestion/contest enters review or configured safe auto-apply | Commercial terms and statutory declarations never community-overwrite |
| 29.10 | Change place status/at-risk | Authorized operator or qualified evidence | Effective status/signal propagates to projections and calendars | Public at-risk claim requires moderation/corroboration; abuse routes Shard 06 |
| 29.11 | Configure availability | Authorized room operator; version current | Native slots, buffers, holds, exceptions and external blocks form one room calendar | Cycles/overlaps reject with exact resource/member |
| 29.12 | Sync external calendar | Provider grant valid; room mapping explicit | Busy-only mirror updates watermark and staleness state | Ambiguous or stale sync blocks uncertain slots and disables instant book |
| 29.13 | Place/challenge hold | Slot and resource graph available | Ranked expiring hold claims all required resources atomically | Losing challenge names higher claim; expiry releases all resources |
| 29.14 | Request room-hire enquiry | Posture permits use type; requester eligible | Routed enquiry carries identity, credits, requirements and lapse time | Broken assignee falls back to org; lapse is explicit, never decline |
| 29.15 | Instant-book room hire | Full claim, valid rate card/payout, fresh calendar | Quote, policy, resources, payment authorization and reservation commit idempotently | Any leg fails all-or-release-all; payment compensation visible |
| 29.16 | Reserve compound resources | Every room/person/asset dependency available | One compound identity owns member reservations and holds | Member failure releases all and identifies failed dependency |
| 29.17 | Cancel, reduce or reschedule | Reservation/policy snapshot active | Versioned ladder applies to released delta; one allowed move is atomic | Stale request returns current terms/state; no partial mutation |
| 29.18 | Complete/no-show reservation | End plus configured provisional window reached | Completion inferred, then evidence harvest becomes eligible | Timely no-show voids provisional harvest; money dispute remains separate |
| 29.19 | Join/receive waitlist offer | Eligible demand and expiring entry | Ranked, lead-time-aware sequential offer receives bounded acceptance window | Expiry advances queue; repeated-loss notification budget enforced |
| 29.20 | Create recurring series | Every instance and review horizon valid | Series identity, exception instances and future review commit | Conflicting instance is named; user may trim/split, never partial-create silently |
| 29.21 | Compare rider to room | Comparable rider/spec snapshots available | Per-field match/unknown/conflict and confidence projection returns | Stale/unsupported fields become unknown, not false conflict |
| 29.22 | Hand off performance bill slot | Declared use type means venue pays/splits with act | Shard 30 receives immutable room/spec/availability snapshot references | Room-hire fields are rejected at seam; no dual lifecycle |

## Contracts

### Command Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `CreatePlace` | location, type set, source, idempotency key | place ID, duplicate candidates | `LOCATION_INVALID`, `SOURCE_FORBIDDEN`, `IDEMPOTENCY_CONFLICT` |
| `ClaimPlaceScope` | party, place/room scope, proof route, proof token | claim state/capabilities | `ANCHOR_INELIGIBLE`, `PROOF_FAILED`, `CLAIM_CONFLICT`, `REVIEW_REQUIRED` |
| `UpsertRoomVersion` | room/place, expected version, type, relationships, effective time | room version | `TYPE_CONFLICT`, `RELATIONSHIP_CYCLE`, `LIVE_RESERVATION_CONFLICT`, `STALE_VERSION` |
| `ReviseSpecField` | room, field key, typed value, caveats, note, source evidence | immutable field revision | `FIELD_UNKNOWN`, `VALUE_INVALID`, `SOURCE_FORBIDDEN`, `CONDITION_UNSUPPORTED` |
| `DeclareRoomStatus` | scope, status/reason, effective interval | status version/cascade preview | `TRANSITION_INVALID`, `FUTURE_BOOKING_CONFLICT`, `AUTHORITY_REQUIRED` |
| `ConfigureCalendar` | room, posture, windows, buffers, mappings, expected version | calendar version | `WINDOW_INVALID`, `MAPPING_AMBIGUOUS`, `STALE_VERSION` |
| `PlaceResourceHold` | requester, resources, slot, rank basis, idempotency key | hold and expiry | `RESOURCE_UNAVAILABLE`, `HOLD_LIMIT`, `CALENDAR_UNCERTAIN` |
| `QuoteRoomHire` | holder, use type, slot, configuration, extras, quote key | priced quote snapshot | `RATE_UNAVAILABLE`, `MANDATORY_EXTRA_MISSING`, `QUOTE_POLICY_UNAVAILABLE` |
| `CommitRoomReservation` | hold, quote, holder, payment authorization, policy acceptance | reservation/compound IDs | `HOLD_EXPIRED`, `QUOTE_EXPIRED`, `PAYMENT_NOT_AUTHORIZED`, `AUTHORITY_LOST` |
| `MutateReservation` | reservation, operation, expected version, idempotency key | new state and money instruction | `POLICY_BLOCKED`, `MINIMUM_BLOCK`, `STALE_VERSION`, `ALREADY_FINAL` |
| `RecordExternalBusyDelta` | connector, room mapping, provider event/version | mirror watermark and blocks | `CONNECTOR_REVOKED`, `MAPPING_UNKNOWN`, `EVENT_REPLAYED` |
| `EvaluateConformance` | rider version, room spec version, event conditions | field results and summary | `SNAPSHOT_MISSING`, `SCHEMA_INCOMPATIBLE` |

### Boundary Rules

- Shard 01 is authoritative for party identity, mandates and acting context; this shard stores scoped references and decisions, not duplicate membership.
- Shard 24 is authoritative for asset identity, quantity and condition. This shard stores room binding, provision posture, reservation allocation and price reference only.
- Shard 30 owns performance negotiation, offers, actual deal terms and contracts. Shard 29 owns room-hire reservation state and immutable handoff snapshots.
- Shard 06 owns moderation, abuse cases and evidence custody; this shard owns field contests and applies final outcomes.
- Provider callbacks, retries and user commands require stable idempotency keys; same key/different payload returns `IDEMPOTENCY_CONFLICT`.

## Data Models

### Canonical Aggregates

| Aggregate | Key relationships and invariants |
|---|---|
| `Place` | Building identity, normalized/exact-or-approximate location, type set, status, claim scope and jurisdiction profile; no hard delete after reference |
| `Room` | Child of one place; physical-volume identity, operating party provenance, state, type, lineage and relationship graph |
| `RoomRelationship` | `requires`, derived `excludes`, `part_of` or soft `contends`; effective-dated and acyclic where directional |
| `SpecFieldRevision` | Room/field/value/caveats/note/source/evidence/effective interval; append-only history and one current projection |
| `AccessibilityProfile` | Separate audience and performer routes, structured segments/caveats and effective-dated impairment overrides |
| `MediaEvidence` | Checklist slot, field reference, contributor, capture time, moderation state and immutable provenance |
| `StatutoryDeclaration` | Jurisdiction capability slot, declaration, issuer/reference where supported, expiry and provenance; no certificate blob at launch |
| `Calendar` | One per room; native intervals, provider mirrors, buffers, posture by use type, freshness and version |
| `ResourceHold` | Ranked claim over room/person/asset resource set, challenge state and hard expiry |
| `RateCardVersion` | Use type, duration basis, static variants, extras, visibility, effective interval and tax/currency context |
| `QuoteSnapshot` | Frozen computation inputs, line allocation, binding posture and expiry |
| `Reservation` | Holder, room/use type, interval, policy/quote/spec versions, lifecycle, payment references and idempotency lineage |
| `CompoundReservation` | Root identity and atomic member reservations/resources; all members share terminal compensation outcome |
| `WaitlistEntry` | Demand, eligibility, rank basis, expiry, notification budget and offer state |
| `RecurringSeries` | Bounded rule, review date, generated instance identities and explicit skips/moves |
| `FieldContest` | Field/revisions, parties, evidence, visibility, moderation reference and resolution |
| `ConformanceRun` | Rider/spec/event snapshots plus immutable per-field `match|unknown|conflict` outcomes |

### State Machines

- Place: `seeded_unverified|community_unverified → claimed_provisional → claimed_full → dormant`; operating status is independently `open|possibly_closed|temporarily_closed|closed`.
- Room: `draft → live → out_of_service → live`; `retired` and `superseded` are terminal for new reservations while history remains.
- Hold: `active → challenged|converted|expired|released`; challenge never extends beyond the original hard slot bound.
- Reservation: `pending_authorization → confirmed → in_progress → completed_provisional → completed`; alternate terminals are `cancelled_client`, `cancelled_operator`, `no_show`, `failed`.
- External mirror: `healthy → delayed → stale → disconnected`; posture degrades from instant booking before data is treated unavailable.
- Field contest: `open → corroborating|operator_answered → resolved|escalated|withdrawn`.

### Invariants

- Place type set is always a superset of live room types; removal never cascades.
- `excludes` is derived from resource/relationship facts and cannot be authored pairwise.
- A room without qualifying claim authority cannot be `live` or instant-bookable.
- Exact future occupancy, client identity and private asset value never leak through public availability or gear projections.
- Quote, cancellation policy, room spec, accessibility override and statutory snapshot IDs freeze on reservation.
- Native and external intervals normalize to one timezone-aware timeline; DST ambiguity requires explicit offset choice.
- All thresholds, TTLs, decay profiles, ladders and notification budgets reference versioned settings.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key relationships and invariants.
- **`Place`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Building identity, normalized/exact-or-approximate location, type set, status, claim scope and jurisdiction profile; no hard delete after reference.
- **`Room`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Child of one place; physical-volume identity, operating party provenance, state, type, lineage and relationship graph.
- **`RoomRelationship`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `requires`, derived `excludes`, `part_of` or soft `contends`; effective-dated and acyclic where directional.
- **`SpecFieldRevision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Room/field/value/caveats/note/source/evidence/effective interval; append-only history and one current projection.
- **`AccessibilityProfile`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Separate audience and performer routes, structured segments/caveats and effective-dated impairment overrides.
- **`MediaEvidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Checklist slot, field reference, contributor, capture time, moderation state and immutable provenance.
- **`StatutoryDeclaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Jurisdiction capability slot, declaration, issuer/reference where supported, expiry and provenance; no certificate blob at launch.
- **`Calendar`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: One per room; native intervals, provider mirrors, buffers, posture by use type, freshness and version.
- **`ResourceHold`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ranked claim over room/person/asset resource set, challenge state and hard expiry.
- **`RateCardVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Use type, duration basis, static variants, extras, visibility, effective interval and tax/currency context.
- **`QuoteSnapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Frozen computation inputs, line allocation, binding posture and expiry.
- **`Reservation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Holder, room/use type, interval, policy/quote/spec versions, lifecycle, payment references and idempotency lineage.
- **`CompoundReservation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Root identity and atomic member reservations/resources; all members share terminal compensation outcome.
- **`WaitlistEntry`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Demand, eligibility, rank basis, expiry, notification budget and offer state.
- **`RecurringSeries`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Bounded rule, review date, generated instance identities and explicit skips/moves.
- **`FieldContest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Field/revisions, parties, evidence, visibility, moderation reference and resolution.
- **`ConformanceRun`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Rider/spec/event snapshots plus immutable per-field `match | unknown | conflict` outcomes.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Public visitor | Read publishable place/room facts, broad availability posture, accessibility and conformance summaries | Exact occupancy, claimant anchors, private evidence, calendars, client identity, asset value |
| Authenticated requester | Enquire, hold, quote, reserve, contest eligible facts, view own lifecycle | Operator-only terms edits, other clients, private staff/resource calendars |
| Community contributor | Create unclaimed venue/trade record, suggest permitted facts, attach qualified evidence | Set commercial terms, statutory declarations, status authority or booking posture |
| Provisional claimant | Describe and answer enquiries within scope | Instant-book commitment, payout changes, destructive authority |
| Full room/place operator | Manage scoped rooms, specs, calendars, rates, reservations and delegations | Unilateral grant revocation, evidence erasure, Shard-24 asset mutation beyond authorized inline path |
| Delegated booker/staff | Capability-scoped calendar/enquiry/spec actions for assigned room/use type | Org finances, membership, unrelated rooms and delegation administration |
| Moderator/adjudicator | Review public-risk, evidence and authority disputes; issue scoped outcome | Change rates, accept bookings or mutate settlement |
| System worker | Expire holds, ingest provider deltas, infer completion, apply configured cascades | Invent authority, silently resolve contests or widen visibility |

- Every write evaluates acting party, room scope, field class, source class and current mandate at commit time.
- Sensitive claim anchors, contact routes and exact calendar data use least-privilege projections and auditable access.
- Operator changes that affect confirmed reservations require preview, reason and immutable notification record.

### Access Escalation

- **Public visitor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Authenticated requester:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Community contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Provisional claimant:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Full room/place operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Delegated booker/staff:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/adjudicator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- All place, room, rate, calendar and conformance flows meet WCAG 2.1 AA on responsive web/PWA with keyboard-only completion and visible focus.
- Accessibility facts never collapse into color, icon or a binary score; route segments, caveats, provenance, age and temporary override are announced in text.
- Calendar grids have equivalent chronological lists, explicit dates/timezones and non-drag controls for selection, resize and reschedule.
- Compound/resource failures focus the first failed member and name every affected resource without requiring graph interpretation.
- Spec forms are grouped, resumable and phone-native; validation associates errors with labels and preserves entered values offline.
- Maps, photos and tours have text alternatives; map-only pin placement has address/search and coordinate-entry alternatives.
- Conformance results expose table/list views with per-field status text and do not rely on red/amber/green alone.
- Live sync, hold challenges, quote expiry and status cascades use polite announcements; destructive deadlines use assertive alerts without stealing focus.

## Event Schemas

All events include `event_id`, `event_type`, `schema_version`, `occurred_at`, `actor_ref`, `acting_party_ref`, `aggregate_ref`, `aggregate_version`, `correlation_id`, `causation_id`, `idempotency_key` and redacted `payload`.

| Event | Required payload | Primary consumers |
|---|---|---|
| `venue.place.changed` | place, changed fields, source class, effective time | search, trust, room projections |
| `venue.room.changed` | room/place, state/type/relationship delta, effective time | calendar, Shard 30, search |
| `venue.spec.field.revised` | room, field, revision, provenance, contest/freshness state | conformance, search, harvest |
| `venue.accessibility.overridden` | room/route segment, impairment interval, source | search, reservation notifications |
| `venue.status.changed` | place/room, old/new, reason, affected reservation refs | Shard 30, notifications, trust |
| `venue.calendar.sync_state_changed` | room, provider, state, watermark, last success | booking posture, operator alerts |
| `venue.hold.changed` | hold, resources, rank, state, expiry | availability, waitlist, checkout |
| `venue.quote.issued` | quote, rate version, binding posture, expiry, total/currency | checkout, audit |
| `venue.reservation.changed` | reservation/compound, old/new, policy/quote refs, cause | Shard 30, payments, harvest |
| `venue.waitlist.offer_changed` | entry/offer, slot, state, expiry | notifications, demand analytics |
| `venue.field.contested` | field, visible revision, challenger source, case ref | operator, Shard 06 |
| `venue.conformance.completed` | run, snapshots, summary counts, per-field refs | Shard 30, advance workflow |

Events carry references rather than private evidence, contact details or full provider payloads. Consumers must tolerate duplicates, unknown optional fields and out-of-order delivery by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Concurrent duplicate place creation | Commit both only when candidate cannot be safely resolved; raise reversible merge candidate |
| Type removal with dependent room | Reject and return blocking rooms; never orphan specs/calendars |
| Granted operator and claimant conflict | Preserve service, freeze authority expansion and route adjudication; no unilateral revocation |
| Accurate but unflattering contributed media | Keep contested unless privacy/safety/policy removal applies; retain evidence trail |
| Accessibility loss during bookings | Effective override appears immediately and notifies affected holders with alternatives/cancellation path |
| Statutory change invalidates future use | Stop new incompatible confirmations; preview affected reservations and require governed remediation |
| External provider outage | Preserve last busy blocks, mark stale, disable uncertain instant book and accept enquiry |
| Calendar webhook replay/out of order | Dedupe by provider event; monotonic watermark prevents rollback |
| Hold expires during payment | Reservation commit fails; authorization void/compensates; no hidden booking |
| Two compound bookings share one resource | Serializable resource claim chooses one; loser receives failed member and no partial holds |
| DST fold/gap | Require explicit offset for ambiguous local time; reject nonexistent local time with nearest valid options |
| Room reassigned after ticket/on-sale dependency | Preserve reservation identity, emit reassignment and force Shard-30/ticketing impact review |
| Operator cancels or room fails | Full client remedy executes independently of operator recovery; reason and responsibility remain auditable |
| No-show after provisional harvest | Reports are voided before publication; late dispute follows evidence case without rewriting source history |
| Stale spec in conformance run | Field becomes unknown and cites age/source; never silently reuses confident match |
| Recurring series conflict at future instance | Name instance and allow trim/split; never create an unseen partial series |
| Duplicate merge with live calendars | Place merge re-parents without joining calendars; room merge blocks until reservation risk is resolved |
| Unsupported jurisdiction | Statutory capability remains explicit unknown; no US rule is applied by analogy |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Offline drafts may capture spec edits and evidence, but authority, holds, quotes, reservations, calendar sync and moderation require server confirmation. Normal-web reads target p95 ≤2 seconds; availability and reservation operations are designed for continuous service except scheduled outages, with explicit degraded states rather than false certainty.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 29.01 Create or find place | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.02 Claim place or room | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.03 Add or change room | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.04 Retire, supersede or outage room | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.05 Publish room specification | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.06 Publish gear provision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.07 Contribute photo/evidence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.08 Read accessibility | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.09 Suggest factual correction | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.10 Change place status/at-risk | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.11 Configure availability | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.12 Sync external calendar | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.13 Place/challenge hold | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.14 Request room-hire enquiry | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.15 Instant-book room hire | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.16 Reserve compound resources | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.17 Cancel, reduce or reschedule | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.18 Complete/no-show reservation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.19 Join/receive waitlist offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.20 Create recurring series | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.21 Compare rider to room | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 29.22 Hand off performance bill slot | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/01-identity-authority|Shard 01]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/24-gear-holdings-operations|Shard 24]]
- **Depended on by:** [[specs/ia/30-booking-contracts|Shard 30]], [[specs/ia/32-event-operations|Shard 32]], [[specs/ia/35-discovery-recommendations|Shard 35]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 24:** consume [Shard 24 Contracts](24-gear-holdings-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 24 Event Schemas](24-gear-holdings-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 30:** consume [Shard 30 Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 32:** consume [Shard 32 Contracts](32-event-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 32 Event Schemas](32-event-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 35:** consume [Shard 35 Contracts](35-discovery-recommendations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 35 Event Schemas](35-discovery-recommendations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
