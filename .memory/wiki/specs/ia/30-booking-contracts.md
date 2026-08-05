# Shard 30 — Booking, negotiation and contracts

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 30 owns live-performance commercial intention, position ladders, offer negotiation, evaluable deal economics, bilateral approval, deal memos/contracts, payment schedules, cancellation instruments, exclusivity warnings and bill-slot booking. It references physical room availability and snapshots from [[specs/ia/29-venues-spaces|Shard 29]], authority from [[specs/ia/01-identity-authority|Shard 01]], relationship context from [[specs/ia/11-community-graph|Shard 11]] and disputes/evidence from [[specs/ia/06-trust-safety|Shard 06]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 27 |
| Child capabilities | 19 |
| Commercial boundary | Performance bill slots where venue/promoter pays the act or shares performance revenue |
| Physical boundary | Shard 29 owns room/resource availability; this shard owns commercial intention and position |
| Contract boundary | Accepted immutable offer version generates deal memo and optional long-form document |
| Money boundary | Schedule, obligations, provider references and external-payment assertions; no platform-held escrow or multi-party routing before B3 |
| Launch exclusions | Actless speculative holds, buy-ons, open-run advances, automated force-majeure adjudication and platform-authored legal defaults |
| Fan boundary | Avails, holds, negotiation and draft deals never appear on fan-facing surfaces |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Avails | Room-date avails default to discoverable among authenticated eligible booking actors; operators may narrow to linked/invited. Artist routing windows are visible only to invited/linked or verified claimed-room actors. |
| Hold ownership | Shard 29 owns physical resource holds. This shard owns separate room-side and artist-side commercial position ladders referencing a slot/hold; it never duplicates room inventory. |
| Position privacy | Participants see own position, depth, age, challenge/stale state and aggregate multiplicity, not superior-holder identity or the counterparty's complete ladder. |
| Confirmation and announce | Confirmation requires one accepted offer version, both approval chains and artist approval; executed paper is not required. Announcement is a separate two-tier gate: Tier 1 is non-waivable (confirmed booking state, both principals' announce consent or a pre-authorising deal term, an announce datetime in Shard 35 plus an on-sale datetime or an explicit free/RSVP marker, lineup honesty, announce-group readiness); Tier 2 is waivable by two-key consent with a permanent attributed reason (executed contract, cleared deposit). |
| Deposit gate | A deposit is non-waivable only when the accepted deal says it is due before announcement. A zero-deposit deal is explicit; no ad-hoc waiver rewrites the accepted version. |
| Offers | Every sent version is complete, immutable and server-ordered. Simultaneous counters create siblings; only a sole live leaf can be accepted. |
| Economics | Closed-plus-instrumented grammar compiles typed terms into a versioned expression. Free-text economic signals require convert-or-acknowledge and remain unsettled. |
| Related-party offers | Allowed with visible disclosure, self-exclusion from the affected approval side and exclusion from market comparables. |
| Draw privacy | Verified draw may anchor private outcome modelling without revealing raw draw to the other party unless the owning act consents. |
| Cross-collateralized runs | Results remain provisional until run close. Recalculation is explicit; advances against open runs are disabled at consumer launch. |
| Payment rail | Record payment schedules and external/cash assertions. Single-payee Stripe collection may activate only after provider/counsel gate; escrow, pooled funds and multi-payee routing remain disabled under B3. |
| Nonpayment | Never auto-voids by platform default. It marks the show at risk and asks the entitled principal to extend, release or invoke a contract-authored auto-void clause. |
| Cancellation | Preview forfeit before commit. Agreed cancellation and material amendment require binding approval chains. Fan refunds remain outside this shard. |
| Postponement | Creates a successor show/booking linked to the original accepted deal through an approved amendment; old show becomes postponed and dependencies migrate only after each owner confirms. |
| Force majeure | Platform records declarations, responses and evidence; it never interprets the contract or supplies a missing clause. |
| Exclusivity | Structured entity-scoped clause is default; human-scoped coverage must be explicit. Straight-line distance is launch metric; carve-outs and standing waivers are typed. |
| Bill support | Show is a bill of slot bookings. Support deals can be short-form; buy-ons are disabled. Headline failure marks supports impacted, not silently cancelled. |
| Announce embargo | The pre-announce embargo is not an announce precondition — announce ends the embargo, the embargo never blocks announce, so no `EMBARGO_ACTIVE` blocker exists on `AuthorizeAnnouncement`. How this shard's `confirmed_unannounced` deal state relates to Shard 35's embargo state is OPEN (ideation `17.01.04` Q-05) and is deferred to `/create-prd-architecture`; this shard states no relationship. |

## Features

- **17.01 Availability, Holds & Confirmation** — [ideation source](../ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01-availability-holds-confirmation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.02 Offers & Negotiation** — [ideation source](../ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02-offers-negotiation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.03 Deal Structures & Economics** — [ideation source](../ideation/17-live-booking-settlement/17.03-deal-structures-economics/17.03-deal-structures-economics-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.04 Performance Contracts & Deal Memos** — [ideation source](../ideation/17-live-booking-settlement/17.04-performance-contracts-deal-memos.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.05 Deposits, Balances & Cancellation** — [ideation source](../ideation/17-live-booking-settlement/17.05-deposits-balances-cancellation/17.05-deposits-balances-cancellation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.06 Radius Clause & Exclusivity Tracking** — [ideation source](../ideation/17-live-booking-settlement/17.06-radius-clause-exclusivity.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.07 Booking Enquiry Inbox & RFQ** — [ideation source](../ideation/17-live-booking-settlement/17.07-booking-enquiry-inbox-rfq.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.14 Bill Construction & Support Slot Offers** — [ideation source](../ideation/17-live-booking-settlement/17.14-bill-construction-support-slots.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-30.01 — Publish room-date avail:** Given Authorized buyer-side actor; Shard-29 slot exists, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish room-date avail, and (6) return Commercial intention, structured terms and visibility publish over slot; if the flow cannot complete, Physical changes stale the avail; never mutate source slot.
- **AC-30.02 — Publish artist routing window:** Given Scoped representation/booking authority, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish artist routing window, and (6) return Territory, pattern, quota, fee floor and visibility publish; if the flow cannot complete, Missing territorial authority rejects without leaking window.
- **AC-30.03 — Request commercial position:** Given Named act and delegated authority; slot/window match, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request commercial position, and (6) return Position enters room and artist ladders with request snapshot; if the flow cannot complete, Actless request rejected; no arrival-order guarantee.
- **AC-30.04 — Reorder/release position:** Given Authorized ladder owner; expected version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reorder/release position, and (6) return New ordered ladder version and notices commit; if the flow cannot complete, Stale reorder returns current ladder; no lost position silently.
- **AC-30.05 — Challenge superior position:** Given Directly superior position exists; deadline valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Challenge superior position, and (6) return Challenge clock, escalation and response options open; if the flow cannot complete, Release beats concurrent challenge; timeout equals drop.
- **AC-30.06 — Compose offer:** Given Eligible composer; current room/slot refs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compose offer, and (6) return Private entity-owned draft with typed economics/outcomes; if the flow cannot complete, Unsupported economic term reports vocabulary gap.
- **AC-30.07 — Send offer version:** Given Draft passes structure/lint; recipient resolved, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Send offer version, and (6) return Immutable complete version snapshots terms, room refs, rider ref and expiry; if the flow cannot complete, Contradictory free text blocks; unstructured signal requires acknowledgment.
- **AC-30.08 — Receive external-recipient link:** Given Recipient entity not yet claimed, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Receive external-recipient link, and (6) return Readable version and provenance available; if the flow cannot complete, Acceptance/approval blocked until entity claim/authority.
- **AC-30.09 — Counter offer:** Given Live thread; actor may negotiate, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Counter offer, and (6) return Complete child version with deterministic diff/outcomes; if the flow cannot complete, Concurrent counters create sibling leaves.
- **AC-30.10 — Record verbal agreement:** Given Actor can negotiate, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record verbal agreement, and (6) return Attributed unconfirmed transcription enters thread; if the flow cannot complete, Cannot approve/accept until counterparty confirms.
- **AC-30.11 — Approve offer version:** Given Actor has binding capability under side rule, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Approve offer version, and (6) return Version-hash approval appends; non-adverse carry-forward allowed; if the flow cannot complete, Self-dealing actor excluded; authority loss invalidates pending approval.
- **AC-30.12 — Accept offer:** Given Sole live leaf; both chains satisfied; unexpired, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Accept offer, and (6) return Accepted version fixes deal, confirms commercial booking and announce prerequisites; if the flow cannot complete, Sibling/unexpired/authority mismatch rejects atomically.
- **AC-30.13 — Confirm under challenge:** Given Accepted version and artist approval exist, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Confirm under challenge, and (6) return Selected commercial position confirms; losing positions release/notify; if the flow cannot complete, Challenge race resolves one terminal result.
- **AC-30.14 — Authorize announcement:** Given Confirmation and hard prerequisite snapshot pass, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorize announcement, and (6) return Durable announce authorization emitted to downstream owner; if the flow cannot complete, the exact unsatisfied precondition and its tier are returned; a precondition whose status cannot be read returns Unknown and the gate fails closed, never satisfied.
- **AC-30.15 — Generate deal memo/contract:** Given Accepted version; approved template version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generate deal memo/contract, and (6) return Bound deal memo and optional long form generated reproducibly; if the flow cannot complete, Missing binding fails closed; PDF is view, never source.
- **AC-30.16 — Amend accepted deal:** Given Proposed complete successor version; materiality known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Amend accepted deal, and (6) return Required chains approve amendment; schedule/contract append successor; if the flow cannot complete, Paid history preserved; no in-place edits.
- **AC-30.17 — Record payment schedule:** Given Accepted deal and direction known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record payment schedule, and (6) return Deposit row zero, timed/deferred rows and reminders publish; if the flow cannot complete, Invalid gaps/party/direction reject.
- **AC-30.18 — Record payment outcome:** Given Provider-confirmed or authorized bilateral assertion, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record payment outcome, and (6) return Row state and evidence append; reminders reconcile; if the flow cannot complete, Ambiguous provider result remains pending and reconciles.
- **AC-30.19 — Handle overdue row:** Given Due time passed; no settled outcome, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Handle overdue row, and (6) return Both parties see at-risk state and entitled principal options; if the flow cannot complete, No automatic void unless accepted term explicitly grants it.
- **AC-30.20 — Preview/commit cancellation:** Given Booking active; actor can bind side, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Preview/commit cancellation, and (6) return Exact deal/run recomputation and forfeit preview precede terminal event; if the flow cannot complete, Stale preview forces recompute; no surprise obligation.
- **AC-30.21 — Agree cancellation:** Given Both binding chains approve same instrument, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Agree cancellation, and (6) return Contract-specific release/allocation commits; if the flow cannot complete, Delegate without bind authority cannot terminate.
- **AC-30.22 — Declare force majeure:** Given Party references contract event and evidence, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Declare force majeure, and (6) return Attributed declaration, response and dispute route record; if the flow cannot complete, Platform never labels claim valid/invalid.
- **AC-30.23 — Postpone show:** Given Both sides approve successor date/amendment, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Postpone show, and (6) return Original becomes postponed; successor lineage and migration tasks create; if the flow cannot complete, Any dependency refusal leaves original obligations visible.
- **AC-30.24 — Evaluate radius/exclusivity:** Given Candidate hold/offer and active clauses available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate radius/exclusivity, and (6) return Conflict/unknown/clear with clause owner and waiver route; if the flow cannot complete, Missing geodata/identity scope returns unknown.
- **AC-30.25 — Request/grant waiver:** Given Named decider; clock bounded by blocked decision, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request/grant waiver, and (6) return Grant/refuse/lapse instrument appends; if the flow cannot complete, Break-glass only under live challenge and principal action.
- **AC-30.26 — Submit booking RFQ:** Given Eligible booking actor; structured request, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Submit booking RFQ, and (6) return Rules triage and route to correct party/avail/slot; if the flow cannot complete, Auto-decline cites real structured reason; note never scored.
- **AC-30.27 — Construct bill/support offer:** Given Show/bill owner; slot control available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Construct bill/support offer, and (6) return Named/TBA slot and short/full deal thread attach to bill; if the flow cannot complete, Buy-on direction rejected; unsupported cancellation dependency remains explicit.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 30.01 | Publish room-date avail | Authorized buyer-side actor; Shard-29 slot exists | Commercial intention, structured terms and visibility publish over slot | Physical changes stale the avail; never mutate source slot |
| 30.02 | Publish artist routing window | Scoped representation/booking authority | Territory, pattern, quota, fee floor and visibility publish | Missing territorial authority rejects without leaking window |
| 30.03 | Request commercial position | Named act and delegated authority; slot/window match | Position enters room and artist ladders with request snapshot | Actless request rejected; no arrival-order guarantee |
| 30.04 | Reorder/release position | Authorized ladder owner; expected version | New ordered ladder version and notices commit | Stale reorder returns current ladder; no lost position silently |
| 30.05 | Challenge superior position | Directly superior position exists; deadline valid | Challenge clock, escalation and response options open | Release beats concurrent challenge; timeout equals drop |
| 30.06 | Compose offer | Eligible composer; current room/slot refs | Private entity-owned draft with typed economics/outcomes | Unsupported economic term reports vocabulary gap |
| 30.07 | Send offer version | Draft passes structure/lint; recipient resolved | Immutable complete version snapshots terms, room refs, rider ref and expiry | Contradictory free text blocks; unstructured signal requires acknowledgment |
| 30.08 | Receive external-recipient link | Recipient entity not yet claimed | Readable version and provenance available | Acceptance/approval blocked until entity claim/authority |
| 30.09 | Counter offer | Live thread; actor may negotiate | Complete child version with deterministic diff/outcomes | Concurrent counters create sibling leaves |
| 30.10 | Record verbal agreement | Actor can negotiate | Attributed unconfirmed transcription enters thread | Cannot approve/accept until counterparty confirms |
| 30.11 | Approve offer version | Actor has binding capability under side rule | Version-hash approval appends; non-adverse carry-forward allowed | Self-dealing actor excluded; authority loss invalidates pending approval |
| 30.12 | Accept offer | Sole live leaf; both chains satisfied; unexpired | Accepted version fixes deal, confirms commercial booking and announce prerequisites | Sibling/unexpired/authority mismatch rejects atomically |
| 30.13 | Confirm under challenge | Accepted version and artist approval exist | Selected commercial position confirms; losing positions release/notify | Challenge race resolves one terminal result |
| 30.14 | Authorize announcement | Confirmation and hard prerequisite snapshot pass | Durable announce authorization emitted to downstream owner | Exact unsatisfied precondition and tier returned; unreadable precondition returns Unknown and fails closed |
| 30.15 | Generate deal memo/contract | Accepted version; approved template version | Bound deal memo and optional long form generated reproducibly | Missing binding fails closed; PDF is view, never source |
| 30.16 | Amend accepted deal | Proposed complete successor version; materiality known | Required chains approve amendment; schedule/contract append successor | Paid history preserved; no in-place edits |
| 30.17 | Record payment schedule | Accepted deal and direction known | Deposit row zero, timed/deferred rows and reminders publish | Invalid gaps/party/direction reject |
| 30.18 | Record payment outcome | Provider-confirmed or authorized bilateral assertion | Row state and evidence append; reminders reconcile | Ambiguous provider result remains pending and reconciles |
| 30.19 | Handle overdue row | Due time passed; no settled outcome | Both parties see at-risk state and entitled principal options | No automatic void unless accepted term explicitly grants it |
| 30.20 | Preview/commit cancellation | Booking active; actor can bind side | Exact deal/run recomputation and forfeit preview precede terminal event | Stale preview forces recompute; no surprise obligation |
| 30.21 | Agree cancellation | Both binding chains approve same instrument | Contract-specific release/allocation commits | Delegate without bind authority cannot terminate |
| 30.22 | Declare force majeure | Party references contract event and evidence | Attributed declaration, response and dispute route record | Platform never labels claim valid/invalid |
| 30.23 | Postpone show | Both sides approve successor date/amendment | Original becomes postponed; successor lineage and migration tasks create | Any dependency refusal leaves original obligations visible |
| 30.24 | Evaluate radius/exclusivity | Candidate hold/offer and active clauses available | Conflict/unknown/clear with clause owner and waiver route | Missing geodata/identity scope returns unknown |
| 30.25 | Request/grant waiver | Named decider; clock bounded by blocked decision | Grant/refuse/lapse instrument appends | Break-glass only under live challenge and principal action |
| 30.26 | Submit booking RFQ | Eligible booking actor; structured request | Rules triage and route to correct party/avail/slot | Auto-decline cites real structured reason; note never scored |
| 30.27 | Construct bill/support offer | Show/bill owner; slot control available | Named/TBA slot and short/full deal thread attach to bill | Buy-on direction rejected; unsupported cancellation dependency remains explicit |

## Contracts

### Command Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `PublishAvail` | acting party, entity, slot/window, typed intent, visibility, expiry | avail/version | `AUTHORITY_REQUIRED`, `PHYSICAL_SLOT_STALE`, `TERMS_INCOMPLETE` |
| `RequestCommercialHold` | act, requester mandate, room/artist slot refs, indicative fee, idempotency key | two ladder positions | `ACT_REQUIRED`, `SLOT_UNAVAILABLE`, `MANDATE_INVALID`, `POSITION_LIMIT` |
| `ChallengePosition` | ladder, challenger, target position, expected version | challenge/deadline | `NOT_DIRECTLY_SUPERIOR`, `CHALLENGE_ALREADY_ACTIVE`, `STALE_VERSION` |
| `SendOfferVersion` | full typed offer, snapshots, expiry, version parent(s), draft claim | immutable version/hash | `ECONOMIC_CONTRADICTION`, `TERM_UNSUPPORTED`, `EXPIRY_INVALID`, `DRAFT_CLAIM_LOST` |
| `ConfirmTranscription` | version, confirming side, expected hash | negotiable version | `TRANSCRIPTION_UNCONFIRMED`, `CONTENT_MISMATCH`, `AUTHORITY_REQUIRED` |
| `ApproveOfferVersion` | version hash, side, authority proof, approval rule version | approval | `VERSION_NOT_LIVE`, `SELF_APPROVAL_FORBIDDEN`, `AUTHORITY_INSUFFICIENT` |
| `AcceptOfferVersion` | sole leaf hash, both chain results, expected thread version | accepted deal | `MULTIPLE_LIVE_LEAVES`, `APPROVAL_INCOMPLETE`, `OFFER_EXPIRED`, `HOLD_CONFLICT` |
| `AuthorizeAnnouncement` | deal, prerequisite evidence/version | authorization | `BOOKING_NOT_CONFIRMED` (P-01), `ANNOUNCE_CONSENT_INCOMPLETE` (P-02), `SCHEDULE_UNSET` (P-03), `SCHEDULE_UNKNOWN` (P-03 unreadable — fails closed), `LINEUP_UNRESOLVED` (P-04), `GROUP_MEMBER_NOT_READY` (P-05), `CONTRACT_UNEXECUTED` (P-06, waivable), `DEPOSIT_UNSATISFIED` (P-07, non-waivable when the accepted deal sets the deposit due before announcement), `HARD_GATE_FAILED` |
| `GenerateDealDocument` | accepted/amended version, template version, locale | memo/document hash | `TEMPLATE_UNAPPROVED`, `BINDING_MISSING`, `SIGNATURE_GATE_DISABLED` |
| `AppendPaymentOutcome` | schedule row, provider event or bilateral assertion, amount/currency | ledger assertion | `PROVIDER_AMBIGUOUS`, `AMOUNT_MISMATCH`, `ASSERTION_CONTESTED` |
| `CancelDeal` | deal/run, actor, reason, preview hash, expected version | cancellation/forfeit instruction | `PREVIEW_STALE`, `BIND_AUTHORITY_REQUIRED`, `ALREADY_TERMINAL` |
| `PostponeDeal` | original deal, successor slot, amendment hash, dependency consents | postponed/successor refs | `SUCCESSOR_UNAVAILABLE`, `CONSENT_INCOMPLETE`, `DEPENDENCY_MIGRATION_FAILED` |
| `RequestExclusivityWaiver` | clause, candidate booking, named decider, deadline | waiver instrument | `CLAUSE_NOT_APPLICABLE`, `DEADLINE_INVALID`, `DECIDER_UNAVAILABLE` |

### Boundary Rules

- Shard 29 remains authoritative for physical room/resource holds; this shard references slot and resource-hold versions and owns only commercial ladder state.
- Shard 01 supplies negotiate/bind/list/book activities, party governance and territorial mandates. Negotiation authority never implies binding authority.
- Shard 06 owns adjudication/evidence controls; this shard records immutable offer, declaration and payment assertions and applies outcomes.
- Shard 11 supplies relationship/link context for visibility but never grants booking authority by social connection alone.
- Downstream Shards 31/32 consume accepted deal, bill, announce authorization and payment-obligation events; they cannot mutate offer history.
- Platform-held escrow, pooled balances, multi-party payout and split routing fail closed until B3 counsel/provider evolution.
- Announce precondition P-07 (deposit) carries this shard's existing locked rule: non-waivable when the accepted deal says the deposit is due before announcement. Whether P-07 is waivable at all is OPEN (ideation `17.01.04` Q-01) and deferred to `/create-prd`; no ad-hoc waiver rewrites the accepted version in the meantime.
- Announce precondition P-06 (executed contract) is waivable at Tier 2 by two-key consent with a permanent attributed reason. Who may exercise that waiver is OPEN (ideation `17.01.04` Q-02) and deferred to `/create-prd-security`; this shard names no delegate authority for it.
- BLOCKED / not authored here: this shard models neither announce precondition P-02 (two-key announce consent and the pre-authorising deal term) nor P-05 (artist-owned announce groups, ejection and the Operator count-without-identities view). Both are fully specified in ideation `17.01.04` §§ Announce readiness and Announce groups (the tour announce) and are raised as a separate IA item rather than authored under this remediation.

## Data Models

### Canonical Aggregates

| Aggregate | Key relationships and invariants |
|---|---|
| `Avail` | Entity-attributed commercial intention over a Shard-29 slot/window; type, terms, visibility, quota and lifecycle version |
| `CommercialLadder` | Side/slot-specific ordered positions; room-side and artist-side ladders resolve independently |
| `CommercialPosition` | Named act, requester authority, rank, request snapshot, indicative fee, hold link and challenge state |
| `OfferThread` | Permanent negotiation container; sent-version DAG, live leaves, accepted version and dormancy projection |
| `OfferVersion` | Immutable complete typed terms, free-text acknowledgments, snapshots, expiry, rider ref, hash and server order |
| `Approval` | Version hash, side, actor, bind authority, rule version, decision and carry-forward cause |
| `DealExpression` | Grammar version, typed parties/sides, deduction order, count refs, FX basis and evaluable AST |
| `AcceptedDeal` | Accepted version, parties, show/bill/slot refs, confirmation and announce-gate state |
| `DealDocument` | Template/binding versions, rendered artifact hash, signatures/acceptances and supersession lineage |
| `PaymentSchedule` | Deal-owned rows including deposit zero; direction, due condition/time, amount/deferred formula and status |
| `PaymentAssertion` | Provider-confirmed or bilateral external/cash assertion, evidence, contest and reconciliation state |
| `CancellationInstrument` | Initiator, reason, policy/deal/run snapshots, recomputation, forfeit preview and approvals |
| `ForceMajeureDeclaration` | Declaring party, cited clause/event, evidence refs, response and case reference; no validity field |
| `Postponement` | Original deal/show, successor references, amendment and per-dependency migration state |
| `ExclusivityClause` | Entity/human scope, geography/time, typed carve-outs, grantor, effective interval and standing waiver policy |
| `WaiverInstrument` | Clause/candidate, decider, clock, escalation, outcome and break-glass evidence |
| `Bill` | Show-level identity with owned slots, TBA markers and per-slot booking/deal refs |

### State Machines

- Avail: `draft → published → fill_date → matched|withdrawn|expired`.
- Position: `requested → active → challenged → confirmed|released|expired|repudiated`.
- Offer version: `draft_private → sent → countered|withdrawn|expired|accepted`; sent content never mutates.
- Thread: `open → branched → accepted|dormant`; dormancy has no release or expiry side effect.
- Deal: `accepted → confirmed_unannounced → announced → performed|cancelled|postponed`; disputes are orthogonal case state.
- Schedule row: `planned → due → pending_confirmation → paid|partially_paid|overdue|waived_by_amendment|contested`.
- Waiver: `requested → granted|refused|lapsed|break_glass_used`.

### Invariants

- Every commercial position names an act and carries active delegated booking authority.
- A sent offer is a complete version; counters never mutate or reset original expiry.
- Only one live leaf can be accepted, and both sides approve the identical hash.
- Currency, payment direction, deduction order, configuration and count definitions are explicit.
- Free text can describe but cannot silently override structured economic terms.
- Deposit and balances are one schedule; cancellation reads that schedule and writes no second payment ledger.
- Payment facts are assertions/references until provider or both parties confirm; platform never calls direct transfer escrow.
- All deadlines, reminder schedules, fill boundaries and thresholds are effective settings or explicit deal terms, never constants.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Avail`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Entity-attributed commercial intention over a Shard-29 slot/window; type, terms, visibility, quota and lifecycle version.
- **`CommercialLadder`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Side/slot-specific ordered positions; room-side and artist-side ladders resolve independently.
- **`CommercialPosition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Named act, requester authority, rank, request snapshot, indicative fee, hold link and challenge state.
- **`OfferThread`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Permanent negotiation container; sent-version DAG, live leaves, accepted version and dormancy projection.
- **`OfferVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable complete typed terms, free-text acknowledgments, snapshots, expiry, rider ref, hash and server order.
- **`Approval`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Version hash, side, actor, bind authority, rule version, decision and carry-forward cause.
- **`DealExpression`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Grammar version, typed parties/sides, deduction order, count refs, FX basis and evaluable AST.
- **`AcceptedDeal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Accepted version, parties, show/bill/slot refs, confirmation and announce-gate state.
- **`DealDocument`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Template/binding versions, rendered artifact hash, signatures/acceptances and supersession lineage.
- **`PaymentSchedule`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal-owned rows including deposit zero; direction, due condition/time, amount/deferred formula and status.
- **`PaymentAssertion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Provider-confirmed or bilateral external/cash assertion, evidence, contest and reconciliation state.
- **`CancellationInstrument`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Initiator, reason, policy/deal/run snapshots, recomputation, forfeit preview and approvals.
- **`ForceMajeureDeclaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Declaring party, cited clause/event, evidence refs, response and case reference; no validity field.
- **`Postponement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Original deal/show, successor references, amendment and per-dependency migration state.
- **`ExclusivityClause`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Entity/human scope, geography/time, typed carve-outs, grantor, effective interval and standing waiver policy.
- **`WaiverInstrument`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Clause/candidate, decider, clock, escalation, outcome and break-glass evidence.
- **`Bill`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Show-level identity with owned slots, TBA markers and per-slot booking/deal refs.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Public/fan | None of avails, holds, offer threads or draft deals | All commercial-intention and negotiation data |
| Eligible booking actor | Discover permitted avails, send structured RFQ, view own positions/threads | Other ladder identities, private draw/cost assumptions, unrelated deals |
| Negotiating delegate | Draft/send/counter within scoped mandate | Approve, accept, cancel, waive or announce unless separately granted bind capability |
| Binding principal/delegate | Approve/accept/amend/cancel/waive within explicit scope | Self-approve related-party affected side |
| Room/promoter operator | Manage room-side avail/ladder, offers, bill slots and own payment assertions | Artist internal approval detail and private draw inputs |
| Artist/representative | Manage routing windows, artist ladder, approvals, own exclusivity and own payment assertions | Promoter private cost model and unrelated room ladder |
| Finance operator | Reconcile provider outcomes and schedule exceptions under dual control | Edit offer/deal terms or fabricate payment confirmation |
| Moderator/adjudicator | Review abuse, evidence and contested assertions | Negotiate, bind or determine force majeure validity |
| System worker | Expire/warn, evaluate grammar, recompute run, reconcile provider and emit gates | Invent consent, resolve legal interpretation or disclose private ladder identity |

- Entity membership and social linkage do not grant negotiate or bind capability.
- Every approval rechecks authority at commit; accepted history remains attributable after later mandate revocation.
- Retention/erasure pseudonymizes actors where permitted but preserves immutable commercial document integrity under counsel-approved schedules.

### Access Escalation

- **Public/fan:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Eligible booking actor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Negotiating delegate:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Binding principal/delegate:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Room/promoter operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Artist/representative:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Finance operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/adjudicator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Offer composition, comparison, approval, cancellation and waiver complete by keyboard with visible focus and no drag-only term ordering.
- Version diffs expose structured term changes and outcome deltas in tables/lists; color never carries favorable/adverse/material meaning alone.
- Economic outcomes state assumptions, currency, attendance points, unresolved terms and formulas in logical reading order.
- Expiry, challenge, payment and announcement deadlines show absolute date/time/timezone plus remaining time and use accessible live announcements.
- Approval screens state which entity/side the actor binds and require explicit confirmation separate from negotiation actions.
- PDF/deal memo has tagged headings/tables and an equivalent accessible HTML source; PDF is never the sole acceptance surface.
- Branching counteroffers provide a linearized leaf list and chosen baseline for screen readers.
- Force-majeure and cancellation forms preserve text, expose evidence alternatives and never use legal-status color labels.

## Event Schemas

All events include `event_id`, `event_type`, `schema_version`, `occurred_at`, `actor_ref`, `acting_party_ref`, `aggregate_ref`, `aggregate_version`, `correlation_id`, `causation_id`, `idempotency_key` and privacy class.

| Event | Required payload | Primary consumers |
|---|---|---|
| `booking.avail.changed` | avail/entity/slot, visibility, state, terms version | discovery, Shard 29 |
| `booking.position.changed` | ladder/position, disclosed rank/depth, state, deadline | parties, notifications |
| `booking.offer.version_sent` | thread/version/hash, parents, expiry, snapshot refs | approval, audit |
| `booking.offer.approval_changed` | version hash, side, rule version, decision | acceptance gate |
| `booking.deal.accepted` | deal, version/expression, parties, show/bill/slot refs | Shards 29, 31, 32 |
| `booking.announce.authorization_changed` | deal, state, prerequisite refs/blockers | ticketing/event operations |
| `booking.deal.document_generated` | deal, template/binding versions, artifact hash | parties, audit |
| `booking.payment.schedule_changed` | deal, schedule version, changed row refs | reminders, finance |
| `booking.payment.assertion_changed` | row, assertion state, amount/currency, provider ref | risk, cancellation |
| `booking.deal.cancelled` | deal/run, reason class, forfeit instruction, responsibility | settlement, bill, event operations |
| `booking.deal.postponed` | original/successor, amendment, dependency states | Shards 29, 31, 32 |
| `booking.exclusivity.evaluated` | candidate, clause refs, result, waiver ref | hold/offer flows |
| `booking.bill.changed` | bill/show, slot delta, TBA/control/dependency refs | event operations |

Events expose references and role-scoped projections rather than full private terms, raw draw, internal approvals or evidence. Consumers dedupe by event ID/idempotency key and order by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Physical hold expires while offer remains live | Offer stays readable with stale-hold warning and extension path; no false inventory promise |
| Superior position identity probing | Return position/depth only; rate-limit enumeration and audit suspicious access |
| Release races challenge | Release terminal transition wins; challenger gets next-state result, not resurrected target |
| Simultaneous counters | Preserve sibling versions; acceptance blocks until one leaf is withdrawn/expired |
| Counterparty confirms different verbal text | Keep both evidence versions; no negotiable confirmed version until exact hash agrees |
| Authority revoked after approval | Pending approval invalidates; accepted historical act remains attributed and auditable |
| Related-party self-dealing | Stamp, exclude actor from affected-side approval and market comparables |
| Unsupported/free-text economics | Keep text unsettled, suppress complete breakeven and require acknowledgment |
| Room spec/rate changes after offer send | Sent snapshot remains; notice invites explicit new version |
| Offer and hold expiry differ | Each clock acts independently and appears as separate term/status |
| Deposit due but direct transfer disputed | Mark contested/pending; no announce authorization based on unilateral payer claim |
| Provider webhook lost/duplicated | Reconcile by provider ID and idempotency; never double-mark or infer payment |
| Nonpayment deadline passes | Notify both and mark at risk; no default auto-void |
| Cancellation exactly at instalment due | Serializable server commit time decides whether row became due before preview; stale preview recomputes |
| Contract amendment after paid rows | Append schedule version, preserve paid assertions and explicit allocation/credit |
| Cancel date inside run | Recompute run explicitly, then price forfeit; results remain provisional until run close |
| Headline cancels with support deals | Mark each dependent slot impacted; apply its own dependency/cancellation term, never blanket cascade |
| Force-majeure claim contested | Preserve declarations/evidence and route dispute; platform applies no default interpretation |
| Postponement dependency partly fails | Successor remains pending; original rights/obligations visible until all required migrations resolve |
| Radius identity or distance unknown | Return unknown and block automated clear; allow typed waiver request |
| TBA slot filled | Authorized slot controller closes TBA marker and creates named booking; historical marker remains |
| Buy-on attempted | Reject unsupported deal direction/use with policy explanation; no disguised room-hire path |
| Scheduled outage during challenge expiry | Pause destructive expiry until verified delivery/recovery window; never silently drop position |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Offline work may save private offer drafts, but send, counter, approve, accept, challenge, payment assertion, cancellation, waiver and announcement authorization require server confirmation. Normal-web reads target p95 ≤2 seconds; commercial clocks and recovery are designed for continuous operation except scheduled outages.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 30.01 Publish room-date avail | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.02 Publish artist routing window | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.03 Request commercial position | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.04 Reorder/release position | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.05 Challenge superior position | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.06 Compose offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.07 Send offer version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.08 Receive external-recipient link | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.09 Counter offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.10 Record verbal agreement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.11 Approve offer version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.12 Accept offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.13 Confirm under challenge | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.14 Authorize announcement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.15 Generate deal memo/contract | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.16 Amend accepted deal | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.17 Record payment schedule | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.18 Record payment outcome | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.19 Handle overdue row | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.20 Preview/commit cancellation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.21 Agree cancellation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.22 Declare force majeure | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.23 Postpone show | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.24 Evaluate radius/exclusivity | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.25 Request/grant waiver | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.26 Submit booking RFQ | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 30.27 Construct bill/support offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/01-identity-authority|Shard 01]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/11-community-graph|Shard 11]], [[specs/ia/13-opportunities-casting|Shard 13]], [[specs/ia/29-venues-spaces|Shard 29]]
- **Depended on by:** [[specs/ia/31-live-settlement-intelligence|Shard 31]], [[specs/ia/32-show-production-planning|Shard 32]], [[specs/ia/35-ticket-products-sales|Shard 35]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 11:** consume [Shard 11 Contracts](11-community-graph.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 11 Event Schemas](11-community-graph.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 13:** this shard is the caller, per DEC-098 — Shard 13 declares no dependency on this shard and exposes a protected inbound callback instead. On its OPP-16 handoff, Shard 13 publishes `opportunity.handoff.changed.v1` from [Shard 13 Event Schemas](13-opportunities-casting.md#event-schemas) with the publication-fixed handoff mode/target and the acceptance fact manifest; this shard consumes that event into this shard `§ Contracts`, then creates or joins its own booking record under its own authority and invariants — a new `OfferThread` and `AcceptedDeal` through `SendOfferVersion`, `ApproveOfferVersion` and `AcceptOfferVersion`, or an existing `Bill` slot through interaction 30.27 — and calls Shard 13's protected inbound command `RecordHandoffOutcome` in [Shard 13 Contracts](13-opportunities-casting.md#contracts), carrying the handoff reference, the `HandoffMode`, this shard's booking record as the downstream identifier, the terminal handoff state, an `expectedVersion` and Shard 13's original idempotency key, so Shard 13 converges `handoff` state and its back-reference. Replay of the same key returns the same result; a stale revision returns `VERSION_CONFLICT`; key reuse with a changed payload returns `IDEMPOTENCY_MISMATCH`. This shard never mutates Shard 13 acceptance or disposition and never fabricates a booking to satisfy a handoff: if this shard's own authority, approval or acceptance gates refuse, no booking record is created, no outcome is reported, and the handoff stays in Shard 13's idempotent retry and escalation under `HANDOFF_FAILED` rather than rolling back the acceptance. Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 29:** consume [Shard 29 Contracts](29-venues-spaces.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 29 Event Schemas](29-venues-spaces.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 31:** consume [Shard 31 Contracts](31-live-settlement-intelligence.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 31 Event Schemas](31-live-settlement-intelligence.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 32:** consume [Shard 32 Contracts](32-show-production-planning.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 32 Event Schemas](32-show-production-planning.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 35:** inbound only, per DEC-098 — this shard declares no dependency on Shard 35. This shard exposes a protected command `RecordOnSaleSchedule` (announce datetime, on-sale datetime or explicit free/RSVP marker, `expectedVersion`) in `§ Contracts`; [Shard 35](35-ticket-products-sales.md#contracts) calls it whenever its `OnSaleSchedule` changes, and publishes this shard `§ Event Schemas` back to [Shard 35 Event Schemas](35-ticket-products-sales.md#event-schemas). Announce precondition P-03 evaluates only the schedule state recorded by that command; absent or stale state renders `SCHEDULE_UNKNOWN` and fails the gate closed. Shard 35 owns fan-facing schedule execution; this shard owns announce authority and never reads Shard 35 state directly.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |
| 2026-08-05 | A-19 announce gate rebuilt onto ratified preconditions P-01..P-07, `EMBARGO_ACTIVE` removed, Unknown fails closed, Q-01/Q-02/Q-05 recorded as open; A-18 phantom `Aggregate` registry entry deleted; A-34 stale Shard 31/32/35 filenames and wiki links corrected | `/resolve-ambiguity` | Architecture Decisions, Acceptance Criteria, Interactions, Contracts, Typed Field and Cardinality Registry, Cross-Shard Dependencies |
| 2026-08-05 | F2 — cross-shard contract reciprocity: declared the Shard 13 caller edge, consuming `opportunity.handoff.changed.v1` and calling Shard 13's protected `RecordHandoffOutcome`, and added Shard 13 to Depends on | `/resolve-ambiguity` | Cross-Shard Dependencies, Cross-Shard Section Contract Map |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
