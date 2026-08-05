# Shard 36 — Door access, box office, reconciliation and ticketing risk

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 36 owns door validation/offline coordination, live box-office counts/drops/walk-up/close, fan refunds/cancellation/reschedule, external-ticket count integration, purchase/transfer/resale controls and event-party consent. It consumes ticket identities/inventory from [[specs/ia/35-ticket-products-sales|Shard 35]], show-day offline primitives from [[specs/ia/33-show-day-operations|Shard 33]], platform resilience from [[specs/ia/00-infrastructure|Shard 00]], and dispute/evidence controls from [[specs/ia/06-trust-safety|Shard 06]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 30 |
| Child capabilities | 20 |
| Door launch | BYOD phone/PWA, provisioned encrypted replica, static signed ticket epoch, offline name lookup and local peer coordination |
| Count boundary | Canonical sourced/fresh counters, immutable drops and certified close; never fan-facing |
| Refund boundary | Full original all-in amount for policy-granted/event-cancellation refunds; tracked obligation until discharged |
| External boundary | Provider capability profiles plus manual attestation; no unsupported barcode impersonation or silent event mapping |
| Fraud boundary | Structural controls, optional accumulated-acquisition limits, tracked transfer and face-value exchange; no margin-taking resale |
| Consent boundary | Named party/purpose consent independent of transaction; buyer never silently treated as every attendee |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Scan | Exact ticket/show/epoch lookup with cryptographically signed non-semantic token; signature is prefilter, replica lookup controls verdict. Specific refusal reasons and audited Operator override. |
| Offline | Complete replica required; staleness warns but never refuses. Peer-reachable devices share causal scan IDs; disconnected conflicts admit-and-reconcile. Minimal encrypted name lookup data wipes after close. |
| Re-entry | Ticket remains use-once. Venue physical token controls re-entry; age-restricted shows require distinguishable token class. |
| Age | Restriction disclosed before purchase and at scan. Post-sale increase is material change with opt-out refund/exchange. Door refusal opens refund case automatically. |
| Counts | Paid, comp, admitted/scanned and remaining are distinct canonical counters with source/freshness. Performing act gets paid+admissions aggregate floor; gross/net money remains deal-scoped. |
| Close | Operator certifies immediately; counterparty asynchronously counter-attests. Single-party/lapsed remains labeled unreconciled. Count-dependent settlement cannot finalize on unknown/disputed count. |
| Walk-up | Same manifest and all-in price, cash/card, ticket admitted at birth. Platform reconciles float but never holds cash. Offline sale uses preallocated inventory. |
| Refunds | Granted refunds automatic; excluded/discretionary explicit. Policy/event cancellation returns original all-in amount unless statute mandates more; no fee retention. One refund obligation per ticket. |
| Cancellation | Irreversible show cancellation commits separately from refund rails, requires step-up authentication and blast-radius preview. Obligation remains open until every ticket is discharged or lawful unclaimed-funds process applies. |
| Reschedule | New date with time-boxed opt-out refund window; TBC deadline auto-converts to cancellation. Second change restarts full window. |
| External providers | Operator-confirmed event mapping and visible capability/freshness. Manual count is legitimate. External refunds/tickets link to provider; WeJammin never claims control it lacks. |
| Reconciliation | Gate-observed scanned counter is platform source. Discrepancy is attributed, quantified and resolved by named party decision/counter-acceptance; platform never adjudicates. |
| Purchase limits | Optional per show, disclosed, based on accumulated acquired units under account identity. Transfer does not restore acquisition allowance; verified refund/exchange does. |
| Transfer | Tracked two-tap default, reversible until claimed, static signed fallback. Current holder gets logistics; payer and holder get cancellation/reschedule; payer receives refund. |
| Accessible transfer | Allowed with access-route/companion acknowledgment and current suitability notice; no disability proof. |
| Resale | Face-value exchange/waitlist first. Buyer pays no platform markup; listing basis is original all-in ticket amount and any unavoidable provider cost is disclosed before seller confirms. |
| Consent | Transactional notices require no marketing consent. Marketing is per named party/purpose with expiry/withdrawal. No mandatory per-attendee personalization; recipient can consent when claiming/transferring. |

## Features

- **19.04 Door Scanning & Access Control** — [ideation source](../ideation/19-ticketing-box-office/19.04-door-scanning-access-control/19.04-door-scanning-access-control-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.05 Box Office Counts, Drops & Day-of-Show** — [ideation source](../ideation/19-ticketing-box-office/19.05-box-office-counts-drops/19.05-box-office-counts-drops-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.06 Refunds, Cancellations & Rescheduling** — [ideation source](../ideation/19-ticketing-box-office/19.06-refunds-cancellations-rescheduling/19.06-refunds-cancellations-rescheduling-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.07 External Ticketing Integration & Count Reconciliation** — [ideation source](../ideation/19-ticketing-box-office/19.07-external-ticketing-integration/19.07-external-ticketing-integration-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.09 Ticketing Fraud, Bot & Resale Controls** — [ideation source](../ideation/19-ticketing-box-office/19.09-ticketing-fraud-bot-resale-controls/19.09-ticketing-fraud-bot-resale-controls-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.10 Attendee Data Capture & Event-Party Consent** — [ideation source](../ideation/19-ticketing-box-office/19.10-attendee-data-capture-consent.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-36.01 — Provision scanner:** Given Recognized device/operator and complete event replica, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Provision scanner, and (6) return Encrypted replica/device epoch enters ready; if the flow cannot complete, Missing/incomplete replica blocks readiness.
- **AC-36.02 — Scan ticket:** Given Current/offline replica and code/name input, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Scan ticket, and (6) return Accept/refuse/override event appends instantly; if the flow cannot complete, Stale warns; unknown leaks no cross-event info.
- **AC-36.03 — Coordinate scanners:** Given Peers reachable or later server sync, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Coordinate scanners, and (6) return Duplicate/conflict detected with causal/order confidence; if the flow cannot complete, Disconnected conflict admits and reconciles.
- **AC-36.04 — Reverse/refuse prior scan:** Given Authorized door actor and reason, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reverse/refuse prior scan, and (6) return Additive linked reversal decrements gate-observed count; if the flow cannot complete, Original scan never deleted.
- **AC-36.05 — Verify age/ID:** Given Ticket restriction and venue policy current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Verify age/ID, and (6) return Human records pass/refusal class only; if the flow cannot complete, No ID image/data retained.
- **AC-36.06 — Read live count:** Given Authorized deal/role projection, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Read live count, and (6) return Consistent sourced/fresh counter snapshot renders; if the flow cannot complete, Fan sees only availability boolean.
- **AC-36.07 — Issue immutable drop:** Given Recipient/scope deal term valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Issue immutable drop, and (6) return Snapshot/source/freshness/movement delivers; if the flow cannot complete, Later scope change is forward-only.
- **AC-36.08 — Evaluate pacing:** Given Break-even/trajectory reference available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate pacing, and (6) return Actionable deviation alert or silence; if the flow cannot complete, No reference means no claim.
- **AC-36.09 — Sell walk-up:** Given Window permission, manifest units and all-in price, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Sell walk-up, and (6) return Cash/card sale admits at birth and records ticket/float; if the flow cannot complete, Offline oversell from authorized block is honored then reconciled.
- **AC-36.10 — Close box office:** Given Sales drained; devices reconciled/written off, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Close box office, and (6) return Certified counters/float/exceptions and attestations version; if the flow cannot complete, Unreconciled device blocks close absent reason.
- **AC-36.11 — Request individual refund/exchange:** Given Ticket/holder/payer/policy and unscanned state, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request individual refund/exchange, and (6) return Automatic/excluded/discretionary result or atomic exchange; if the flow cannot complete, One obligation; refund returns original payer method.
- **AC-36.12 — Cancel event:** Given Step-up actor, blast-radius preview and reason, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Cancel event, and (6) return Event cancellation and per-ticket obligations commit; if the flow cannot complete, Rail failure never rolls back cancellation.
- **AC-36.13 — Reschedule/postpone:** Given New date or TBC deadline and policy version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reschedule/postpone, and (6) return Wallet updates and opt-out window opens; if the flow cannot complete, Deadline expiry auto-converts cancellation.
- **AC-36.14 — Connect external platform:** Given Venue credentials and capability profile accepted, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Connect external platform, and (6) return Verified data/mapping proposal/freshness state saves; if the flow cannot complete, Broken connector shows explicit gap.
- **AC-36.15 — Map/ingest external count:** Given Operator-confirmed show mapping and schema mapping, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Map/ingest external count, and (6) return Source-currency sourced/fresh/provisional values append; if the flow cannot complete, No silent auto-bind/conversion.
- **AC-36.16 — Attest manual count:** Given Authorized actor at close; source known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Attest manual count, and (6) return Immutable attestation/unknown/reconstructed state appends; if the flow cannot complete, Concurrent entries remain competing.
- **AC-36.17 — Reconcile count discrepancy:** Given Two independent sources or explicit single-source state, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reconcile count discrepancy, and (6) return Chosen number/decider/reason/counter-acceptance record; if the flow cannot complete, Platform does not choose.
- **AC-36.18 — Configure/enforce purchase limit:** Given Show policy enabled and account identified, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure/enforce purchase limit, and (6) return Accumulated acquisition count enforces before selection; if the flow cannot complete, Circumvention signals review, not auto-block.
- **AC-36.19 — Transfer ticket:** Given Policy/holder/recipient/epoch valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Transfer ticket, and (6) return Same ticket changes holder; old credential invalidates; if the flow cannot complete, Reversible until claim; no allowance reset.
- **AC-36.20 — List/buy face-value exchange:** Given Valid unscanned ticket and waitlist posture, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) List/buy face-value exchange, and (6) return Waitlist-first resale transfers/refunds seller atomically; if the flow cannot complete, Unsold state is explicit.
- **AC-36.21 — Capture/withdraw consent:** Given Named party/purpose/fan and policy valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capture/withdraw consent, and (6) return Consent version/expiry/withdrawal propagates; if the flow cannot complete, Transaction unchanged if declined.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 36.01 | Provision scanner | Recognized device/operator and complete event replica | Encrypted replica/device epoch enters ready | Missing/incomplete replica blocks readiness |
| 36.02 | Scan ticket | Current/offline replica and code/name input | Accept/refuse/override event appends instantly | Stale warns; unknown leaks no cross-event info |
| 36.03 | Coordinate scanners | Peers reachable or later server sync | Duplicate/conflict detected with causal/order confidence | Disconnected conflict admits and reconciles |
| 36.04 | Reverse/refuse prior scan | Authorized door actor and reason | Additive linked reversal decrements gate-observed count | Original scan never deleted |
| 36.05 | Verify age/ID | Ticket restriction and venue policy current | Human records pass/refusal class only | No ID image/data retained |
| 36.06 | Read live count | Authorized deal/role projection | Consistent sourced/fresh counter snapshot renders | Fan sees only availability boolean |
| 36.07 | Issue immutable drop | Recipient/scope deal term valid | Snapshot/source/freshness/movement delivers | Later scope change is forward-only |
| 36.08 | Evaluate pacing | Break-even/trajectory reference available | Actionable deviation alert or silence | No reference means no claim |
| 36.09 | Sell walk-up | Window permission, manifest units and all-in price | Cash/card sale admits at birth and records ticket/float | Offline oversell from authorized block is honored then reconciled |
| 36.10 | Close box office | Sales drained; devices reconciled/written off | Certified counters/float/exceptions and attestations version | Unreconciled device blocks close absent reason |
| 36.11 | Request individual refund/exchange | Ticket/holder/payer/policy and unscanned state | Automatic/excluded/discretionary result or atomic exchange | One obligation; refund returns original payer method |
| 36.12 | Cancel event | Step-up actor, blast-radius preview and reason | Event cancellation and per-ticket obligations commit | Rail failure never rolls back cancellation |
| 36.13 | Reschedule/postpone | New date or TBC deadline and policy version | Wallet updates and opt-out window opens | Deadline expiry auto-converts cancellation |
| 36.14 | Connect external platform | Venue credentials and capability profile accepted | Verified data/mapping proposal/freshness state saves | Broken connector shows explicit gap |
| 36.15 | Map/ingest external count | Operator-confirmed show mapping and schema mapping | Source-currency sourced/fresh/provisional values append | No silent auto-bind/conversion |
| 36.16 | Attest manual count | Authorized actor at close; source known | Immutable attestation/unknown/reconstructed state appends | Concurrent entries remain competing |
| 36.17 | Reconcile count discrepancy | Two independent sources or explicit single-source state | Chosen number/decider/reason/counter-acceptance record | Platform does not choose |
| 36.18 | Configure/enforce purchase limit | Show policy enabled and account identified | Accumulated acquisition count enforces before selection | Circumvention signals review, not auto-block |
| 36.19 | Transfer ticket | Policy/holder/recipient/epoch valid | Same ticket changes holder; old credential invalidates | Reversible until claim; no allowance reset |
| 36.20 | List/buy face-value exchange | Valid unscanned ticket and waitlist posture | Waitlist-first resale transfers/refunds seller atomically | Unsold state is explicit |
| 36.21 | Capture/withdraw consent | Named party/purpose/fan and policy valid | Consent version/expiry/withdrawal propagates | Transaction unchanged if declined |

## Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `ProvisionDoorReplica` | event/device/operator, manifest epoch, projection | replica/expiry | `DEVICE_UNRECOGNIZED`, `REPLICA_INCOMPLETE`, `PII_POLICY_FAILED` |
| `RecordScan` | event/device/gate, token/name ref, local record ID/time | verdict/scan event | `TOKEN_UNKNOWN`, `WRONG_TIME`, `ALREADY_USED`, `AGE_CHECK_REQUIRED` |
| `CloseBoxOffice` | event/count snapshot, devices, float, exceptions, attestations | close version | `DEVICE_UNRECONCILED`, `SALE_DRAINING`, `COUNTER_UNKNOWN` |
| `ResolveRefund` | ticket, holder/payer, policy/cause, expected state | outcome/obligation | `ALREADY_SCANNED`, `ALREADY_REFUNDED`, `POLICY_EXCLUDED` |
| `CancelTicketedEvent` | event, step-up proof, preview hash, reason | cancellation/obligations | `STEP_UP_REQUIRED`, `PREVIEW_STALE`, `ALREADY_TERMINAL` |
| `RescheduleEvent` | event, date/TBC deadline, opt-out policy | successor/window | `DATE_INVALID`, `DEADLINE_INVALID`, `STALE_VERSION` |
| `MapExternalEvent` | connection, foreign event, local show, operator confirmation | mapping | `CAPABILITY_MISSING`, `MATCH_UNCONFIRMED` |
| `AppendCountAttestation` | event/source, values/unknown, actor/time/evidence | attestation | `CAPACITY_EXCEEDED`, `NEGATIVE_COUNT`, `SOURCE_FORBIDDEN` |
| `TransferTicket` | ticket epoch, holder, recipient claim, policy | transfer/new epoch | `TRANSFER_LOCKED`, `CLAIMED`, `ACCESS_ACK_REQUIRED` |
| `ListFaceValueTicket` | ticket, original all-in basis, seller policy | listing | `TICKET_INELIGIBLE`, `PRICE_EXCEEDS_BASIS` |
| `RecordPartyConsent` | fan, event, named party/purpose, policy text/version | consent state | `PARTY_UNNAMED`, `PURPOSE_INVALID`, `TEXT_STALE` |

- Commands use stable idempotency keys, aggregate versions and immutable evidence.
- External provider facts remain provider-owned; WeJammin stores mappings/projections/attestations.
- Refund obligation and Shard-30 commercial cancellation allocation are distinct.
- Ticket/fan/consent PII is least-privilege and never used for unconsented marketing.

## Data Models

| Aggregate | Key invariants |
|---|---|
| `DoorReplica` | Event/device/manifest epoch, encrypted minimal lookup, completeness/freshness/expiry |
| `ScanEvent` | Immutable local/server IDs/times, ticket epoch, verdict/gate/device/operator and reversal link |
| `BoxOfficeCount` | Snapshot version with paid/comp/scanned/admitted/remaining/source/freshness breakdown |
| `DropSnapshot` | Recipient/scope/count version and immutable delivery |
| `WalkUpSale` | Manifest unit, cash/card, all-in price, operator, admission and float line |
| `BoxOfficeClose` | Quiesced count, device reconciliation, float/exceptions, signatures/attestations |
| `RefundObligation` | Ticket/cause, original payer/method, all-in amount, provider/alternative state and discharge |
| `EventChange` | Cancellation/reschedule/TBC, blast radius, opt-out policy and lifecycle |
| `ExternalConnection` | Venue credentials ref, provider/capability profile, health/freshness |
| `CountMapping` | Connection-level declared/proven mapping assumptions and source currency |
| `CountAttestation` | Source/actor/values-or-unknown, original/reconstructed, self/counter state |
| `PurchaseLimitPolicy` | Show/account basis, accumulated counter, cap and signal state |
| `TicketTransfer` | Ticket epochs, sender/recipient, claim/reversal and access acknowledgment |
| `ExchangeListing` | Ticket, original all-in basis, waitlist/public state, provider cost and outcome |
| `PartyConsent` | Fan, named party, purpose/channel, text/version, grant/expiry/withdrawal/export refs |

- Replica and scan logs wipe no later than configured post-close retention unless evidence hold.
- Scan events are append-only; admitted count derives from accepts minus linked reversals/un-admissions.
- Refund obligation never silently expires; alternative/unclaimed process remains counsel-gated.
- All thresholds, windows, uncertainty bands, retry/attestation/opt-out periods and limits use versioned settings.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key invariants.
- **`DoorReplica`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event/device/manifest epoch, encrypted minimal lookup, completeness/freshness/expiry.
- **`ScanEvent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable local/server IDs/times, ticket epoch, verdict/gate/device/operator and reversal link.
- **`BoxOfficeCount`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Snapshot version with paid/comp/scanned/admitted/remaining/source/freshness breakdown.
- **`DropSnapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recipient/scope/count version and immutable delivery.
- **`WalkUpSale`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Manifest unit, cash/card, all-in price, operator, admission and float line.
- **`BoxOfficeClose`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Quiesced count, device reconciliation, float/exceptions, signatures/attestations.
- **`RefundObligation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ticket/cause, original payer/method, all-in amount, provider/alternative state and discharge.
- **`EventChange`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Cancellation/reschedule/TBC, blast radius, opt-out policy and lifecycle.
- **`ExternalConnection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Venue credentials ref, provider/capability profile, health/freshness.
- **`CountMapping`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Connection-level declared/proven mapping assumptions and source currency.
- **`CountAttestation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source/actor/values-or-unknown, original/reconstructed, self/counter state.
- **`PurchaseLimitPolicy`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Show/account basis, accumulated counter, cap and signal state.
- **`TicketTransfer`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ticket epochs, sender/recipient, claim/reversal and access acknowledgment.
- **`ExchangeListing`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ticket, original all-in basis, waitlist/public state, provider cost and outcome.
- **`PartyConsent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Fan, named party, purpose/channel, text/version, grant/expiry/withdrawal/export refs.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Fan/holder/payer | Own ticket/change/refund/transfer/exchange/consent states | Other attendees, counts, fraud signals |
| Door staff | Provisioned scanner, scan/name lookup, age result and ordinary override | Sales/refunds/count certification/PII export |
| Box-office seller | Walk-up sales/float and own device reconciliation | Scan-only role assumptions or settlement edits |
| Operator/box-office lead | Device provisioning, close/certify, external mapping and exception approval | Fan marketing without consent |
| Performing act | Minimum count aggregates/drops and counter-attestation | Fan rows, device PII, unrelated money |
| Finance/refund role | Obligations/provider reconcile/alternative incident | Door lookup/marketing use |
| Fraud/moderation role | Circumvention/resale/dispute evidence under case scope | Automatic hidden block or broad attendee export |
| Named event party | Consented attendee export/use for exact purpose | Transactional data or other party's consents |

- Device replica includes only fields needed for token/name lookup and age flag; encrypted at rest.
- Age verification stores outcome/reason class, never ID image/number.
- Consent withdrawal propagates platform suppression and recipient notification/audit; off-platform deletion cannot be falsely guaranteed.

### Access Escalation

- **Fan/holder/payer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Door staff:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Box-office seller:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Operator/box-office lead:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Performing act:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Finance/refund role:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Fraud/moderation role:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Named event party:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Scanner has large targets, high contrast, haptic/audio plus text, and one-tap name lookup/override.
- Verdict/refusal includes specific readable reason; color/sound never acts alone.
- Offline/stale status is calm and explicit; readiness blockers name remediation.
- Refund/exchange surfaces show exact all-in amount, destination, deadline and obligation state.
- Counts/drops include tables and freshness/source text.
- Consent names each party/purpose in manageable grouped controls; decline-all preserves transaction.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `boxoffice.scan.recorded` | event/device/ticket epoch, verdict/reversal refs, times | counts, fraud |
| `boxoffice.count.versioned` | event/version, counters/source/freshness | drops, close, settlement |
| `boxoffice.close.changed` | event/close, device/float/attestation states | settlement, audit |
| `ticketing.refund.obligation_changed` | ticket/cause, amount/method/state | fan, finance |
| `ticketing.event_change.committed` | event/change, blast radius, window/deadline | delivery, refund |
| `ticketing.external.count_changed` | connection/mapping/source, values/freshness | count, reconciliation |
| `ticketing.transfer.changed` | ticket, old/new epochs, holder/claim state | wallet, fraud |
| `ticketing.exchange.changed` | listing/ticket, price basis/state/outcome | waitlist, finance |
| `ticketing.party_consent.changed` | fan/party/purpose/version/state | export/suppression |

Events carry opaque refs, not barcode tokens, replica names, IDs, attendee rows or consent contact exports. Consumers dedupe/order by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Same ticket scans offline at two gates | Admit both if isolated; reconcile conflict visibly and preserve gate evidence |
| Device dies with unsynced scans | Peer copies recover when available; otherwise close records irrecoverable gap/write-off |
| Replica stale for hours | Warn/escalate but scan; missing/incomplete replica blocks readiness |
| Age restriction raised after sale | Material-change notice and opt-out refund/exchange |
| Cash walk-up refunded | Return from venue float assertion, un-admit ticket and restore manifest |
| Single-party close | Label unreconciled; count-dependent settlement remains nonfinal |
| Cancellation refund rail fails | Obligation remains open and fan contacted; event stays cancelled |
| Dead original payment method | Identity-verified provider-supported alternative/manual incident; no silent credit substitution |
| External connector stale | Hide current claim, show gap and manual path |
| Purchase-limit evasion suspected | Surface evidence for review; do not auto-refuse ticket |
| Accessible ticket transfer | Recipient acknowledges access route/companion posture; no proof request |
| Exchange listing unsold | Fan retains valid ticket and sees clear state |
| Consent withdrawn after party export | Suppress future exports/use, notify party, audit request; no false deletion guarantee |
| Scheduled outage at doors | Provisioned replicas continue; close/reconcile waits for recovery |

## Surface Applicability

Responsive web/PWA is the sole launch surface. BYOD scanning, offline replicas/name lookup, walk-up reserve and consent/refund views are supported. Provider reconciliation, close finality, mass refund, external mapping and consent export require server confirmation. Normal-web reads target p95 ≤2 seconds; door scans remain locally available through scheduled outages when a complete replica exists.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 36.01 Provision scanner | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.02 Scan ticket | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.03 Coordinate scanners | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.04 Reverse/refuse prior scan | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.05 Verify age/ID | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.06 Read live count | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.07 Issue immutable drop | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.08 Evaluate pacing | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.09 Sell walk-up | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.10 Close box office | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.11 Request individual refund/exchange | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.12 Cancel event | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.13 Reschedule/postpone | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.14 Connect external platform | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.15 Map/ingest external count | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.16 Attest manual count | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.17 Reconcile count discrepancy | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.18 Configure/enforce purchase limit | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.19 Transfer ticket | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.20 List/buy face-value exchange | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 36.21 Capture/withdraw consent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/33-show-day-operations|Shard 33]], [[specs/ia/35-ticket-products-sales|Shard 35]]
- **Depended on by:** None


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 33:** consume [Shard 33 Contracts](33-show-day-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 33 Event Schemas](33-show-day-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 35:** consume [Shard 35 Contracts](35-ticket-products-sales.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 35 Event Schemas](35-ticket-products-sales.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
