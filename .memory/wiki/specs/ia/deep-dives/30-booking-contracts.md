# Deep Dive 30 — Booking, negotiation and contracts

**Status:** Complete
**Parent:** [[specs/ia/30-booking-contracts|Shard 30]]

## Overview

This deep dive closes the split between physical and commercial holds, immutable branching negotiation, same-hash bilateral approval, payment-record boundaries, cancellation/postponement causality and support-slot dependency.

## Interactions

### Avail and Commercial Position Flow

1. Publisher selects a Shard-29 physical slot/window and declares commercial intention; no avail is inferred from an empty calendar.
2. Resolve acting-party activity, domain and territory. Room-date listing requires room-side authority; artist window requires scoped representation.
3. Apply visibility: room-date defaults to authenticated eligible discovery; artist windows require verified claimed-room status or explicit link/invite.
4. A named act requests a position. Snapshot requester mandate, indicative fee, slot version and competing-position multiplicity.
5. Operator assigns room-side position; artist side independently assigns candidate room/promoter position.
6. Only directly superior active position can be challenged. Notify through escalation ladder and require delivery confirmation before destructive expiry.
7. Release wins against simultaneous challenge. Confirmation converts selected commercial positions and delegates physical resource confirmation to Shard 29.

### Offer, Counter and Approval Flow

1. Acquire private single-editor draft claim with idle expiry; entity owns draft, not individual device.
2. Compile structured terms into deal expression and render outcomes at breakeven plus permitted attendance points.
3. Lint free text for economic signals. Structured contradiction blocks; unmatched signal requires conversion or explicit unsettled acknowledgment.
4. Send a complete immutable version with server order, hash, parents, room/hold/rider snapshots and explicit offer/hold expiries.
5. Counter creates a complete child. Concurrent children are sibling live leaves; neither overwrites the other.
6. Negotiator may log verbal terms, but the other side must confirm identical transcription hash before approval.
7. Approval binds version hash and side under Shard-01 governance/spend rule. Non-adverse carry-forward is computed only for terms with defined polarity; undefined/free-text/attachments always re-open approval.
8. Acceptance checks sole live leaf, both chains, authority, expiry and position atomically. Accepted version becomes immutable deal source.

### Confirmation and Announcement

1. Accepted offer plus artist approval is sufficient for confirmation; executed paper is not a prerequisite.
2. Confirmation resolves both commercial ladders, confirms Shard-29 resource hold and records displaced position notices.
3. Announcement gate evaluates non-waivable identity/date/room/lineup honesty and accepted-deal prerequisites.
4. Deposit gate follows accepted schedule: `deposit_due_before_announce=true` requires confirmed receipt; explicit zero deposit passes without waiver.
5. Waivable operational prerequisites require both principals or separately scoped binding delegates and permanent reason.
6. Gate emits authorization only; downstream ticketing/publishing owns announcement artifact and timing.

### Deal Document and Amendment

1. Generate deal memo directly from accepted typed version. Operator template controls presentation/legal clauses; platform binding map controls data placement.
2. Optional long-form document uses approved template version. Electronic-signature production capability stays disabled until counsel-approved forms/retention/enforceability gate.
3. HTML is canonical accessible view; PDF carries hash/version/backlink and is never re-imported as truth.
4. Amendment is a complete successor offer version with materiality and required approvals.
5. On acceptance, append contract/document/schedule versions. Paid rows and historical obligations never rewrite.

### Payment Schedule and Nonpayment

1. Compile deposit as row zero and remaining fixed, date/condition-based or settlement-deferred rows.
2. Every row states payer, payee, direction, amount/formula, currency, due rule and provider/external posture.
3. Platform may record bilateral cash/bank assertions; one-side assertion remains pending until counterparty or provider confirms.
4. Stripe single-payee collection can activate only after provider/counsel enablement. Webhook and poll reconcile PaymentIntent; ambiguous state blocks finality.
5. Pre-due reminders may be muted. Overdue alerts reach payer and counterparty and cannot be suppressed.
6. Nonpayment marks show at risk and presents hold/release/extend options. Auto-void executes only if the accepted deal contains a typed clause and its notice/grace conditions pass.

### Cancellation, Force Majeure and Postponement

1. Cancellation preview pins current deal, schedule, run and responsibility snapshots and shows exact forfeit/credits before commitment.
2. Server commit time serializes due-row and cancellation races. Changed snapshot invalidates preview.
3. Agreed cancellation is a binding bilateral instrument, not a lighter message approval.
4. Force-majeure declaration cites the actual clause and records response/evidence; no platform validity or default clause is created.
5. Postponement proposes successor slot plus complete amendment. Each dependency—room, bill, ticket manifest, payment schedule—confirms migration.
6. Original show enters `postponed` only when bilateral amendment commits; unresolved dependencies remain visible and compensatable.

### Exclusivity and Bill Flow

1. Evaluate active typed clauses at commercial hold time against candidate entity/human scope, straight-line distance, dates and carve-outs.
2. Default scope is act entity. Human scope must be explicitly accepted because member overlap is not inferred.
3. Pre-authorized typed carve-out can clear automatically with recorded rule version; otherwise open named-decider waiver.
4. Waiver cannot outlive the blocked decision. Break-glass is principal-only, challenge-only, attributed and immediately notified.
5. Bill owns headline/support/TBA slots; each slot owns a booking/deal and explicit slot controller.
6. Support short form fixes flat fee, date, slot, set length and expiry plus required dependencies. Buy-on is unsupported.
7. Headline failure marks support slots impacted and evaluates each accepted dependency term; no automatic cancellation.

## Contracts

### Deal Expression

```text
DealExpression = {
  grammar_version,
  denomination_currency,
  settlement_currency,
  fx_basis: fixed | reference_fixed_on_date | settlement_date,
  parties_and_sides[],
  configuration_ref,
  terms[],
  deduction_order[],
  count_definition_refs[],
  unsettled_acknowledgments[]
}
```

The evaluator is shared by offer modelling and downstream settlement. Modelling supplies private side-specific assumptions and never writes them into the deal. If any economic term is unmodellable, complete breakeven is suppressed and the unresolved count is announced.

### Version DAG Rules

- Server allocates monotonically ordered version sequence; client clocks have no ordering authority.
- Every sent version has one or more parent refs, full content and content hash.
- Sibling live leaves block acceptance. Withdraw/expire/counter transitions are append-only.
- Offer expiry is a version term and countering does not reset it; extension creates a new version.
- Hold expiry is independent and rendered on every relevant version.
- Erasure may pseudonymize actor identity under policy but cannot delete economic document content needed for integrity/legal hold.

### Approval Rule

```text
accept(version_hash) iff
  version == sole_live_leaf &&
  artist_rule(version_hash).satisfied &&
  buyer_rule(version_hash).satisfied &&
  all_approvals.authority_active_at_commit &&
  offer.not_expired &&
  position.confirmable
```

Negotiate, bind, waive, announce and cancel are separate capabilities. Same-human-on-both-sides is disclosed; related-party actor cannot satisfy both sides.

### B3 Payment Gate

| Capability | Consumer-launch posture |
|---|---|
| Schedule/invoice/reminders | enabled as record and obligation workflow |
| External/cash payment assertion | enabled with bilateral/provider confirmation |
| Stripe single-payee collection | feature-gated until provider/counsel production approval |
| Platform-held escrow/pooled funds | disabled |
| Multi-party split routing/payout | disabled |
| Open-run advance | disabled |

No UI, contract text or event may call a direct or pending transfer “escrow.” A provider reference is evidence, not the canonical money balance.

All platform timing, escalation, visibility, reminder, lapse and anti-abuse numbers resolve from versioned settings. Parties may choose only deal-term values the schema exposes; implementations contain no hidden numeric policy constants.

## Data Models

### Hold Separation

- Shard-29 `ResourceHold` answers “is the room/resource reserved?”
- Shard-30 `CommercialPosition` answers “whose negotiation has priority?”
- Confirmation requires both; neither state implies the other.
- Commercial hold does not consume an avail. Matching/withdrawal changes avail state explicitly.
- Two ladders can disagree; participants see their own side and a conflict-risk summary, never hidden counterparty identity.

### Deal-Term Polarity

Every structured term declares evaluation semantics and approval polarity per side. Monetary terms have directional benefit; configuration, set length, time and named support may be `contextual`, forcing renewed approval on change. Free text and attachments are always material.

### Payment and Amendment Ledger

- Schedule is versioned under accepted deal/amendment.
- Assertions append against row/version and never mutate provider facts.
- Amendment maps prior rows to `retained`, `satisfied`, `credited`, `reallocated` or `superseded`; paid evidence remains.
- Cancellation first recomputes cross-collateralized run, then applies contracted forfeit to current obligation.
- Fan-ticket refunds, payouts and settlement accounting remain downstream concerns.

### Postponement Lineage

Original deal/show remains immutable and transitions to `postponed` with successor reference. Successor receives inherited terms only through accepted amendment; new date/room/rider/payment conditions are explicit deltas. No dependency is silently cloned.

## Access Control

### Authority Matrix

| Action | Required capability |
|---|---|
| publish room avail | `list` + booking domain + room scope |
| publish artist window | `list` + booking domain + territory |
| request/hold position | `book` + named act scope |
| draft/counter | `negotiate` + side/entity scope |
| approve/accept/amend | `bind` + side/entity + value/territory bounds |
| cancel/agreed cancel | `cancel` or explicit `bind_termination` |
| waive announce/exclusivity | explicit `waive` for clause/gate class |
| authorize announcement | `announce` + accepted deal scope |
| assert payment | payer/payee finance capability for own side |

- Full thread visibility is limited to approvers/negotiators for a side; ordinary entity members see accepted logistics only.
- Internal approval actors/rules, private draw and private cost assumptions never disclose cross-side.
- Non-platform link is revocable, expiring and readable without account; any commitment requires claimed entity and authority.
- Finance reconciliation cannot edit terms. Moderator cannot accept, waive or interpret force majeure.

## Accessibility

- Outcome tables include formulas, assumptions and unresolved terms, with downloadable structured data where authorized.
- Branching threads expose chronological and parent/child navigation with clear current-live-leaf labels.
- Materiality is named term-by-term; struck/deleted visual styling has spoken equivalents.
- Binding actions identify exact version hash in human-readable short form and summarize changed obligations before confirmation.
- Timers survive zoom/reflow and expose absolute deadlines. Warning delivery does not depend on push notification alone.
- Payment and cancellation states distinguish `asserted`, `confirmed`, `contested`, `overdue` and `waived` in text.
- Legal documents have accessible HTML parity, language metadata, tagged export and no canvas-only signatures.

## Event Schemas

### Ordering and Idempotency

Every send, approval, acceptance, challenge, schedule outcome, cancellation and migration command has a stable idempotency key. Same key/different payload fails explicitly.

| Race | Resolution |
|---|---|
| Position release vs challenge | release compare-and-swap wins; challenge returns terminal state |
| Challenge expiry vs delivery failure | expiry defers only under configured bounded delivery attempts |
| Sibling counter vs acceptance | thread-version lock detects multiple leaves and rejects acceptance |
| Authority revoke vs approval | commit-time authority check rejects pending action |
| Approval vs version withdrawal | one terminal transition wins; approval cannot revive version |
| Deposit webhook vs announce gate | gate reads reconciled row version; ambiguous/unilateral state fails closed |
| Cancellation vs due row | serializable server timestamp and snapshot hash determine order |
| Amendment vs payment callback | callback appends to original row/provider ref, then amendment mapping projects effect |
| Postponement vs room reallocation | successor remains pending until Shard-29 version/hold confirms |
| Headline cancellation vs support acceptance | support acceptance pins dependency version; impacted event follows if headline terminal wins |

### Privacy and Consumer Contracts

- Avail discovery carries commercial summary only; no fan projection exists.
- Position events expose identity only to ladder owner and named act side.
- Offer/deal events outside participants carry opaque refs and minimum operational state.
- Payment events never include bank/card data; provider IDs remain restricted.
- Evidence, declarations and unconfirmed verbal transcription use restricted retention and legal-hold policy.

## Edge Cases

### Failure and Recovery Matrix

| Failure | Deterministic recovery |
|---|---|
| Draft editor disappears | Idle lease expires; entity member resumes latest saved private draft |
| Economic grammar version changes | Old version evaluates forever under pinned grammar; new send recompiles explicitly |
| Recipient prints stale PDF | Stamp/hash/backlink reveals superseded state; platform source remains authoritative |
| Offer expires during approval | Approval may append as late evidence but cannot satisfy acceptance |
| Position flapping | Rate-limited configured threshold triggers review; never auto-ranks by draw/reliability |
| Notification provider outage | Destructive commercial expiry pauses within bounded policy and records delivery failure |
| Raw draw consent revoked | Existing model snapshot remains auditable; future render omits raw source and recalculates permitted outputs |
| Cross-currency reference unavailable | Evaluation becomes incomplete/unknown; no silent fallback rate |
| Payment asserted by payer, denied by payee | Row becomes contested; announce/finality fail closed and case may route Shard 06 |
| Connected account restricted | Collection remains pending/blocked; no alternate payee or pooled holding |
| Nonpayment auto-void clause fires | Verify accepted clause, notice/grace and authority; emit revert, never restore destroyed holds |
| Force-majeure clause absent | Record declaration and disagreement; platform supplies no default |
| Successor postponement date fails | Original remains postponed-pending or active per bilateral amendment state; no orphan contract |
| Radius clause overlaps member's other act | Entity-scoped clause does not bind human unless explicitly authored; show warning without assumption |
| Waiver decider unavailable | Escalate within authority tree until deadline; lapse is explicit |
| Support act cancels | Only its slot/deal changes; bill remains and slot controller may restore TBA |
| Headliner replaced | New headline deal/version triggers all dependent support-term reevaluation |
| Buy-on disguised as “admin fee” | Economic lint and payment-direction policy block; acknowledgment cannot bypass disabled type |
| Scheduled outage spans offer expiry | Explicit deal expiry still occurs; only destructive challenge auto-drop receives delivery-protection deferral |

### Two-Implementer Check

Independent implementations must converge on: distinct physical/commercial holds; named-act positions; private ladder identities; immutable branching versions; same-hash dual approval; closed-plus-instrumented economics; non-waivable accepted-deal deposit semantics; record-first payments under B3; previewed cancellation; non-adjudicated force majeure; successor-based postponement; entity-default exclusivity; and per-slot support dependencies. Any implementation that mutates sent versions, equates negotiation with binding, invents escrow, auto-voids by default, applies legal defaults or cascades support cancellations is non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [30-booking-contracts § Contracts](../30-booking-contracts.md#contracts) defines commands/queries and [30-booking-contracts § Event Schemas](../30-booking-contracts.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
