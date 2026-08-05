# Deep Dive 36 — Door access, box office, reconciliation and ticketing risk

**Status:** Complete
**Parent:** [[specs/ia/36-box-office-risk|Shard 36]]

## Overview

This deep dive closes offline scan conflict semantics, count certification, refund obligation finality, external-source uncertainty, acquisition-limit integrity, tracked transfer and named-party consent.

## Interactions

### Door Provisioning and Scan

1. Provision recognized BYOD device to event/operator and download encrypted minimal replica/epoch.
2. Ready requires complete replica; freshness warning/escalation never changes ticket verdict.
3. Scan signed non-semantic token or perform one-tap offline name lookup.
4. Exact local lookup returns accept/refusal reason; Operator may override with reason.
5. Same-device repeat inside dedupe window re-shows result without count mutation.
6. Peer-reachable scanners exchange causal scan IDs; isolated scanners admit and later reconcile duplicates.
7. Re-entry uses physical token; ticket never regains unused state.

### Count, Walk-Up and Close

1. Atomically derive sourced/fresh paid, comp, scanned, admitted and remaining counters.
2. Deliver immutable deal-scoped drops and movement.
3. Walk-up seller spends online/preallocated offline manifest units, takes cash/card and creates admitted ticket at birth.
4. Cash float is counted/reconciled as venue custody assertion; platform is ledger, not till.
5. Close enters draining, finishes in-flight sale, quiesces count and requires every device reconciled/written off.
6. Operator signs; counterparty responds asynchronously. Unknown/disputed count blocks only expressions dependent on it.

### Refund, Cancellation and Reschedule

1. Evaluate exact frozen policy before fan asks: granted/excluded/discretionary.
2. Automatic grant creates one obligation for original all-in amount and returns eligible unit to waitlist.
3. Exchange atomically acquires replacement, settles delta and releases original or changes nothing.
4. Mass cancellation uses step-up authentication, blast-radius preview and irreversible event commit.
5. Per-ticket obligations reconcile original methods; dead methods become tracked identity-verified alternative incidents.
6. Reschedule updates pass and opens full opt-out window; unresolved TBC deadline converts cancellation.

### External Counts and Certification

1. Display provider capability/terms posture before venue authorizes credentials.
2. Propose foreign event match; operator confirms before any data flows.
3. Ingest source currency/counts under connection-level declared/proven mapping with freshness.
4. Manual entry remains first-class and supports `unknown`.
5. Compare independent sources against configured expected-no-show band; raise before close.
6. Named party chooses operational figure/reason; counterparty accepts/protests. Platform never adjudicates.

### Fraud, Transfer, Exchange and Consent

1. Optional show limit counts accumulated acquisitions under account, not basket/card.
2. Transfer keeps acquisition counter, updates holder/epoch and remains reversible until claim.
3. Accessible recipient acknowledges route/companion facts without disability proof.
4. Face-value listing routes waitlist first and transfers same ticket; platform takes no margin.
5. Marketing request names each party and purpose; transactional delivery/change notices remain independent.
6. Buyer is not assumed attendee. Claimed recipient can separately consent; declining does not alter admission.

## Contracts

### Scan Verdict

```text
ScanVerdict = {
  accepted: boolean,
  reason: accepted | already_used | wrong_time | age_check |
          wrong_gate_label | unknown_ticket | override,
  ticket_epoch?,
  local_record_id,
  device_id,
  gate,
  local_time,
  replica_version,
  freshness
}
```

Unknown token returns generic same-show denial and no cross-event hint. Signed-token payload is never used to construct database query.

### Offline Conflict

- Local scan ID is globally unique and idempotent.
- Peer exchange supplies causal relation; device clock is evidence, not sole order.
- Isolated duplicate accepts are not rewritten. Reconciliation records conflict and final admitted interpretation.
- Missing logs become explicit close gap, not estimated count.
- Replica/log retention ends under configured post-close policy or evidence hold.

### Refund Finality

Cancellation complete operationally when event commit succeeds; financially `refund_complete` only when every obligation is discharged or transferred to counsel-approved unclaimed-funds process. Rail failure never converts obligation into revenue.

### Face-Value Basis

Listing ceiling is original all-in paid amount allocated to ticket. Buyer pays no platform resale markup. Seller sees exact expected return and unavoidable provider cost before listing; platform margin is zero.

Every replica retention, staleness warning, dedupe window, reconnect/attestation/refund/reschedule deadline, no-show band, acquisition limit and consent expiry resolves from versioned settings or an explicit show/policy instrument; implementations contain no hidden numeric policy.

## Data Models

### Count and Attestation

- Count snapshot stores every source/freshness and never silently averages.
- `unknown` differs from zero/blank.
- Manual revision appends competing attestation.
- Same-party multiple sources remain one independence class.
- Self-attested/single-party state remains visible.
- Close signature references exact count version.

### Purchase and Transfer Counter

Acquisition counter increments on committed paid/comp? Purchase limit applies paid acquisitions under policy; transfer does not decrement. Refund/exchange reversal can release allowance under explicit policy. Fraud signals never mutate counter or deny automatically.

### Consent Projection

Consent key is fan×named party×purpose×channel×text version. Scope/expiry renew under policy. Withdrawal prevents future platform use/export and emits recipient suppression request; prior lawful transaction/audit remains.

## Access Control

- Provisioning requires box-office lead; scanner receives event-only replica.
- Door role can scan/lookup/ordinary override but not sell/refund/export.
- Seller role can sell/count float but not certify final close unless granted.
- Counterparty act sees aggregate deal-scoped counts and can counter-attest.
- Refund finance can reconcile obligations but not modify event/ticket evidence.
- Fraud reviewer acts through Shard-06 case and cannot silently block account.
- Marketing party receives only fans consenting to that exact party/purpose.

## Accessibility

- Scan UI remains usable one-handed, with external keyboard and screen reader.
- Refusal/override paths provide concise reason and do not expose sensitive details publicly.
- Refund state shows obligation, method, amount and expected next action.
- Count discrepancies provide arithmetic/source/freshness in accessible tables.
- Consent parties can be grouped by bill role while each toggle remains named and independent.

## Event Schemas

### Ordering and Idempotency

Every device provisioning, scan, count, sale, close, refund, change, mapping, attestation, transfer, exchange and consent command uses stable idempotency keys.

| Race | Resolution |
|---|---|
| Two offline scans | Both append; causal/unknown ordering reconciles later |
| Scan reversal vs close | close pins scan-log version; reversal creates successor |
| Walk-up sale vs close | draining allows in-flight commit, then quiesces |
| Refund vs scan | ticket aggregate lock chooses one; scanned ticket cannot newly refund |
| Cancellation vs transfer | event/ticket versions serialize; current holder notified, payer obligation preserved |
| External mapping correction vs drop | new count projection; old drops immutable |
| Transfer vs exchange listing | ticket epoch/state lock permits only one |
| Consent withdrawal vs export | grant epoch checked before artifact generation |

### Device Loss

De-provision immediately, rotate event/device credential and prevent sync from old epoch. Peer/server logs already received remain. Local replica key deletion is requested; event PII incident record/audit follows Shard 06.

## Edge Cases

| Failure | Deterministic recovery |
|---|---|
| Barcode signature valid but no local ticket | Refuse generic unknown; signature never implies admission |
| Name collision offline | Require secondary non-sensitive discriminator/manual Operator decision |
| Age-check refusal later overturned | Append refund-case outcome/scan reversal; never edit age event |
| Count exceeds paid+comp | Live alarm with offending scan refs; do not delete scans |
| System-opened discretionary case times out | Apply configured protective outcome; fan case follows disclosed appeal policy |
| External source reports comps as sold | Mapping remains provisional and settlement flags contaminated paid count |
| Unknown count on flat guarantee | Settlement may proceed labeled if expression does not consume count |
| Account compromise transfers ticket | Freeze current epoch through case; preserve chain/evidence and holder communications |
| Consent recipient exported then ignores withdrawal | Record noncompliance/escalation; platform suppresses future and never falsely claims deletion |

### Two-Implementer Check

Implementations must converge on complete-replica offline scanning, staleness-not-refusal, admit-and-reconcile conflicts, sourced count snapshots, draining/certified close, all-in refund obligations, irreversible cancellation with financial tail, explicit external uncertainty, accumulated purchase limits, tracked ticket epochs, zero-margin face-value exchange and named-party consent. Silent averages, fan counts, fee-retaining cancellation refunds, hidden fraud blocks or blanket consent are non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [36-box-office-risk § Contracts](../36-box-office-risk.md#contracts) defines commands/queries and [36-box-office-risk § Event Schemas](../36-box-office-risk.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
