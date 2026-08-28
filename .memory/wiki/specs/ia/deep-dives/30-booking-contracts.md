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
3. P-02 reads immutable exact-deal-version evidence: both direct-principal consent records, a still-effective executed accepted-deal term that pre-authorises one side, or one `single_party_self_promoted` record when both principals resolve to the same identity. Missing, revoked, superseded or unreadable evidence fails closed.
4. P-05 reads the booking's first-class Musician-owned announce group. Every active member must be ready in one versioned manifest, or the booking must have a committed Musician-authorized ejection; one regression or unknown member blocks the atomic group.
5. An Operator sees group existence, its own booking and aggregate blocker count only. It may append an ejection request; the request does not change membership and only the Musician owner may decide it.
6. P-06 and eligible P-07 waiver use two independently authorized side actions: that side's direct principal or an explicitly named delegate holding a current, versioned Shard-30 `announce_waive` capability scoped to the exact booking and precondition. Generic negotiate/bind/book authority is insufficient; commit pins and rechecks capability version. Self-promotion is the sole one-action collapse.
7. P-07 freezes from the accepted deal: `explicit_zero` passes; `due_before_announce` is hard/non-waivable until full settled or receiving-side-confirmed receipt; only `not_due_before_announce` may be waived. Missing/contradictory term evidence is Unknown and blocks. Waiver leaves instalment zero, debt, reminders and cancellation rights intact.
8. Before authorization, Shard 35 records the accepted on-sale schedule through the protected `RecordOnSaleSchedule` callback. The snapshot binds the exact deal version, timing term and venue-local/UTC instants (or free/RSVP marker); a schedule change supersedes any pre-announce authorization bound to the prior version.
9. `AuthorizeAnnouncement` binds the current recorded schedule snapshot and emits a versioned `AnnounceAuthorization`; schedule readiness is a P-03 input, but Shard 35 remains the owner of the operational schedule and venue-local timer.
10. At the resolved instant, the Shard-35 timer calls `CommitScheduledAnnouncement` with exact deal, authorization, schedule and lifecycle versions. Shard 30 revalidates all versions and atomically appends the one `AnnounceRecord` while transitioning canonical `confirmed_unannounced → announced`; replay returns that record and emits no duplicate fan-out.
11. Shard 35 projects operational `Embargoed` from the versioned lifecycle event until the canonical announce transition is observed. `Embargoed` is never a second lifecycle fact and neither timer nor projection can mutate `AcceptedDeal`.

### Deal Document and Amendment

1. Generate deal memo directly from accepted typed version. Operator template controls presentation/legal clauses; platform binding map controls data placement.
2. Optional long-form document uses approved template version. Electronic-signature production capability stays disabled until counsel-approved forms/retention/enforceability gate.
3. HTML is canonical accessible view; PDF carries hash/version/backlink and is never re-imported as truth.
4. Amendment is a complete successor offer version with materiality and required approvals.
5. On acceptance, append contract/document/schedule versions. Paid rows and historical obligations never rewrite.

### Payment Schedule and Nonpayment

1. Compile deposit as row zero and remaining fixed, date/condition-based or settlement-deferred rows. The accepted deposit amount/due condition also produces immutable `DepositAnnouncePolicy`; the announce gate never derives policy from current payment status or mutates this schedule.
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

### Announcement Authorization

- `RecordAnnounceConsent` appends immutable P-02 evidence scoped to one accepted deal/version. Direct consent requires the named principal; executed-term evidence pins the exact accepted term/version; self-promotion collapses to one attributed action and never fabricates a second actor.
- `ChangeAnnounceGroup` is compare-and-swap over a Musician-owned group version. Create/add/eject/dissolve actions append membership events and atomically recompute the active-member readiness projection.
- `RequestAnnounceGroupEjection` lets an Operator controlling an active member booking append a request without mutating membership or reading foreign member identities. The Musician owner decides through `ChangeAnnounceGroup`.
- `EvaluateAnnounceGroupReadiness` returns `ready|blocked|unknown`, active-member count, aggregate blocker count and the evaluated version manifest; Operator projections omit member identifiers and member-level readiness.
- `ClassifyDepositAnnouncePolicy` pins accepted deal/version, amount/currency, due condition/date and term evidence into `explicit_zero|due_before_announce|not_due_before_announce`; missing/contradictory evidence cannot become a permissive class.
- `GrantAnnounceWaiveCapability` and `RevokeAnnounceWaiveCapability` append immutable Shard-30 capability versions naming one delegate, principal side, exact deal/booking and `P-06|P-07`. A P-07 grant requires pinned `not_due_before_announce`. Shard 01 supplies canonical parties/current relationship authority; generic activity/domain never implies this purpose capability.
- `WaiveAnnouncePrecondition` appends one permanent side action with reason and direct-principal or pinned capability authority/policy versions. Two independent sides converge `one_key_recorded → waived`; one grant cannot satisfy both, and self-promotion records one honest action. P-07 waiver changes only announce authorization.
- `AuthorizeAnnouncement` consumes an exact prerequisite manifest. `ANNOUNCE_CONSENT_INCOMPLETE|ANNOUNCE_CONSENT_STALE`, `GROUP_MEMBER_NOT_READY|ANNOUNCE_GROUP_UNKNOWN` and any unreadable prerequisite fail closed before authorization.

### Canonical Announcement and Schedule Boundary

- Shard 30 owns `AcceptedDeal`, its versioned lifecycle, `AnnounceAuthorization` and the exactly-once `AnnounceRecord`. Only this shard may commit `confirmed_unannounced → announced`.
- Shard 35 owns `OnSaleSchedule`, venue-local timer jobs and the derived operational `Embargoed` projection. It records schedule snapshots before authorization and invokes Shard-30 callbacks; it cannot write deal lifecycle or authorization.
- `RecordOnSaleSchedule` accepts an exact schedule/deal version and appends an immutable P-03 snapshot. Missing or contradictory local/UTC timing, accepted-term mismatch, stale versions and changed idempotency payloads fail closed. A pre-announce replacement supersedes the authorization that named the prior schedule version.
- `CommitScheduledAnnouncement` accepts only an authenticated Shard-35 timer occurrence with the active authorization and matching schedule/deal/lifecycle versions at or after the resolved instant. Unknown, stale, revoked, superseded, early or non-confirmed inputs fail closed before fan-visible mutation.
- The lifecycle event is the sole cross-shard canonical fact. Shard 35 applies lifecycle versions monotonically and deduplicates event/worker retries; no reconciliation loop or duplicate canonical state exists.

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

### Announcement Evidence and Groups

- `AnnounceConsent` is append-only and pins `deal_id`, `deal_version`, principal side, source, actor and accepted-term ref/version when applicable. Effective-status changes preserve original evidence. Direct evidence is unique per deal/version/side; one self-promoter record is unique per deal/version and satisfies both resolved sides exactly once.
- `AnnounceGroup` pins a Musician owner, lifecycle, membership version, active-member count, aggregate blocker count and readiness manifest hash. Its state is `assembling → blocked|ready → announced|dissolved`; an active member regression returns readiness to `blocked`, and unreadable evidence projects `unknown`.
- `AnnounceGroupMembershipEvent` is the immutable add/eject/dissolve fact. Membership is `active → ejected`; a stale group version cannot append an event.
- `AnnounceGroupEjectionRequest` is `pending → accepted|refused|superseded`; only an accepted Musician decision points to a membership event and changes the fan-in set.
- `AnnounceGroupReadinessProjection` is unique per group/version/manifest. Member versions remain restricted; Operator views carry only their booking state and aggregate counts.
- `DepositAnnouncePolicy` is immutable per accepted deal version and pins amount/currency, due condition/date, term evidence ref/version and `explicit_zero|due_before_announce|not_due_before_announce`. Zero has no invoice; positive classes retain instalment zero. Unknown evidence blocks.
- `AnnounceWaiveCapability` is immutable/versioned and pins delegate, principal side, exact deal/booking, `P-06|P-07`, validity interval, grantor, source relationship/version and P-07 policy ref/version where applicable. State is `draft → active → revoked|expired`; only `active` at commit authorizes.
- `AnnouncePreconditionWaiver` is append-only per deal/version/eligible-precondition/side and pins actor, authority ref/version, P-07 policy ref/version, reason and gate version. Later revocation ends future use without rewriting valid history; P-07 payment obligations survive.

### Canonical Announcement and Schedule Models

- `OnSaleSchedule` is Shard-35-owned operational data: schedule ID/version, accepted deal ID/version, venue timezone, local announce/on-sale instants and resolved UTC instants (or the explicit free/RSVP marker), accepted timing-term ref/version, timer-job occurrence and operational freshness. Its `Embargoed`/`Announced` values are projections, not a second `AcceptedDeal` lifecycle.
- `OnSaleScheduleSnapshot` is the immutable Shard-30 P-03 evidence recorded through `RecordOnSaleSchedule`; it pins the exact schedule/deal/timing-term versions used by authorization. A successor schedule appends a new snapshot and never edits prior evidence.
- `AnnounceAuthorization` is the Shard-30 versioned active/superseded/revoked/consumed authorization bound to one accepted deal, one immutable schedule snapshot and the exact prerequisite/group/policy manifest. At most one active version exists per deal.
- `AnnounceRecord` is the single Shard-30 append-only fact for a deal's `confirmed_unannounced → announced` transition. It pins lifecycle-before/after, authorization, schedule, timer occurrence and idempotency versions; its append and lifecycle outbox event commit atomically.
- Ownership is strict: Shard 35 may create/update `OnSaleSchedule` and run the venue-local timer; Shard 30 may create/update `OnSaleScheduleSnapshot`, `AnnounceAuthorization`, `AcceptedDeal` lifecycle and `AnnounceRecord`. Neither writes the other shard's aggregate, and no reconciliation loop repairs competing lifecycle facts.

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
| waive eligible P-06/P-07 as principal | direct principal for that side and exact deal/version; P-07 requires `not_due_before_announce` |
| waive eligible P-06/P-07 as delegate | current versioned `announce_waive` capability for exact delegate, side, deal/booking and precondition; P-07 pins eligible policy; generic negotiate/bind/book is insufficient |
| grant/revoke announce-waive delegate capability | direct principal for that side; exact deal/booking/precondition and expected version |
| waive exclusivity | explicit `waive` for clause class |
| authorize announcement | `announce` + accepted deal scope |
| record direct announce consent | named principal for exact deal/version; self-promoter action collapses only after both sides resolve to the same identity |
| create/change announce group | Musician artist-owner authority + expected group version |
| request announce-group ejection | Operator control of its own active member booking; request only, no membership decision |
| record on-sale schedule | authenticated Shard-35 service callback; exact schedule/deal/timing-term versions |
| commit scheduled announcement | authenticated Shard-35 timer occurrence; exact active authorization, schedule and lifecycle versions |
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
| Consent revocation or accepted-term supersession vs announce gate | gate pins the current evidence/deal versions; ineffective or stale P-02 evidence fails closed |
| Member readiness regression vs group authorization | group manifest/version lock makes the group `blocked|unknown`; no partial member announcement |
| Membership change vs ejection/readiness evaluation | group compare-and-swap commits one order; stale operation returns `MEMBERSHIP_VERSION_CONFLICT` and retries against the new manifest |
| Deposit policy classify vs deal amendment | accepted deal version decides; amendment creates a new policy version, invalidates stale P-07 grants/actions and never rewrites the old schedule/history |
| Capability grant/revoke vs Tier-2 waiver | commit-time capability/policy version, status and exact scope decide; stale/revoked/expired/ineligible capability appends no side action |
| Two Tier-2 side actions race | gate-version compare-and-swap appends each unique side once and yields one terminal waiver; one capability cannot cross sides |
| Schedule record vs announcement authorization | schedule snapshot commits first; authorization binds its immutable ID/version; a changed pre-announce snapshot supersedes the prior authorization and requires reauthorization |
| Timer callback vs schedule/deal/authorization change | Shard-30 compares all pinned versions in one transaction; stale/mismatched callback fails closed and cannot publish or reopen lifecycle |
| Duplicate timer callback vs canonical announce | unique worker occurrence/idempotency/deal constraints return the existing `AnnounceRecord`; lifecycle/outbox append occurs once |
| Lifecycle event delay/replay to Shard 35 | projection applies lifecycle versions monotonically; lag exposes freshness/keeps `Embargoed`, never grants local authority to announce |
| Cancellation vs due row | serializable server timestamp and snapshot hash determine order |
| Amendment vs payment callback | callback appends to original row/provider ref, then amendment mapping projects effect |
| Postponement vs room reallocation | successor remains pending until Shard-29 version/hold confirms |
| Headline cancellation vs support acceptance | support acceptance pins dependency version; impacted event follows if headline terminal wins |

### Privacy and Consumer Contracts

- Avail discovery carries commercial summary only; no fan projection exists.
- Position events expose identity only to ladder owner and named act side.
- Offer/deal events outside participants carry opaque refs and minimum operational state.
- Consent events carry source/status and evidence refs, never private accepted-term content. Group events expose member identities only to the Musician owner and the affected booking; Operators receive group existence, own booking state and aggregate blocker count.
- Deposit-policy events carry classification/evidence refs, never private contract text. Announce-waiver capability events carry exact resource/precondition/state but omit private relationship content. Waiver events expose attributed reason only to principals/audit; operational consumers receive eligible precondition key state and evidence refs. No event represents P-07 debt as waived or settled.
- Payment events never include bank/card data; provider IDs remain restricted.
- Evidence, declarations and unconfirmed verbal transcription use restricted retention and legal-hold policy.

### Versioned Announcement Events

| Event | Producer | Required payload | Consumer rule |
|---|---|---|---|
| `ticketing.schedule.changed.v1` | Shard 35 | schedule ID/version, exact deal ID/version, local+UTC instants or free/RSVP marker, timing-term ref/version, source idempotency | Shard 30 records the immutable P-03 snapshot before authorization; stale/contradictory payloads fail closed |
| `booking.announce.authorization_changed.v1` | Shard 30 | deal/version, authorization ID/version/state, schedule ID/version, prerequisite manifest hash and typed blockers | Shard 35 updates operational readiness/timer linkage monotonically; it cannot mutate deal lifecycle |
| `booking.deal.lifecycle_changed.v1` | Shard 30 | deal ID/version, `confirmed_unannounced|announced|cancelled|postponed`, announce record/auth/schedule refs where present | Shard 35 derives `Embargoed` and fan visibility monotonically; duplicate/delayed delivery cannot create a second canonical state |

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
| Executed announce-preauthorisation term revoked or superseded | Preserve evidence history, mark it ineffective and block P-02 until current evidence satisfies the exact deal version |
| Same identity controls both principals | Append one `single_party_self_promoted` consent action and count it once as the source for both resolved sides |
| One active announce-group member regresses or becomes unreadable | Recompute whole group `blocked|unknown`; authorize none until all active members are ready or the affected booking is ejected |
| Operator ejection request races Musician membership change | Membership version determines order; request never mutates membership and a stale action returns conflict without identity leakage |
| Delegate has negotiate or generic bind/book but no exact `announce_waive` capability | Refuse with `ANNOUNCE_WAIVE_CAPABILITY_REQUIRED`; no waiver action or unrelated authority detail is exposed |
| Capability expires/revokes while waiver UI is open | Commit returns `ANNOUNCE_WAIVE_CAPABILITY_STALE`; refresh authority and preserve no server-side partial action |
| One delegate grant is presented for both sides | Reject cross-side reuse; require independently authorized side actions except the explicit self-promoter identity collapse |
| Capability revokes after valid waiver action | Preserve the pinned permanent action; revoke future use immediately and never rewrite prior provenance |
| Explicit zero deposit | Classify `explicit_zero`, satisfy P-07 without invoice/payment receipt and reject waiver as unnecessary |
| Positive deposit explicitly due before announce | Keep P-07 hard until full settled or receiving-side-confirmed receipt; reject every capability grant/waiver with `P07_WAIVER_FORBIDDEN` |
| Positive deposit not due before announce is waived | Authorize only the gate after two keys and all other prerequisites; retain full schedule, debt, reminders and cancellation rights |
| Deposit amount/due condition missing or contradictory | Project Unknown and fail closed; never infer zero or waiver eligibility |
| Schedule is recorded before authorization | Preserve the immutable P-03 snapshot; `AuthorizeAnnouncement` must bind its exact schedule/version before producing active authorization |
| On-sale schedule changes after authorization | Append the successor snapshot, supersede the prior authorization, keep canonical deal `confirmed_unannounced` and require fresh authorization |
| Timer arrives early or with stale versions | Return typed failure with no lifecycle/fan mutation; Shard 35 retries only after obtaining current versions and instant |
| Timer callback is replayed after announce | Return the existing `AnnounceRecord`; emit no duplicate lifecycle, announce or fan-out event |
| Shard-35 lifecycle projection is delayed or replayed | Keep operational `Embargoed` until the versioned canonical event is applied; dedupe and never create a second deal state |
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

Independent implementations must converge on: distinct physical/commercial holds; named-act positions; private ladder identities; immutable branching versions; same-hash dual approval; closed-plus-instrumented economics; immutable P-02 evidence and P-05 groups; Tier-2 waiver by direct principal or exact-booking/precondition versioned `announce_waive` delegate with two independent side actions and pinned authority; P-07 `explicit_zero|due_before_announce|not_due_before_announce` from the accepted deal, with zero pass, due-before hard/non-waivable, not-due-before conditionally waivable and every payment obligation preserved; fail-closed unknown evidence; one canonical Shard-30 deal lifecycle/authorization/announce record; Shard-35-owned schedule/timer with derived `Embargoed`; record-first schedule binding; exact version checks and exactly-once timer commit; record-first payments under B3; previewed cancellation; non-adjudicated force majeure; successor-based postponement; entity-default exclusivity; and per-slot support dependencies. Implementations that infer waiver authority, bypass due-before P-07, erase debt, reuse one capability across sides, fabricate self-promoter consent, enumerate group members, invent escrow, maintain duplicate lifecycle facts/reconciliation loops, let Shard 35 mutate deal state, auto-void by default or apply legal defaults are non-conformant.

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
| 2026-08-28 | F10 partial — deepened P-02/P-05, exact-booking/precondition Tier-2 waiver authority and P-07 accepted-deal classification: zero passes, due-before is hard/non-waivable, not-due-before may be waived without changing debt/schedule/cancellation. Only Shard-30/35 state ownership remains open. | `/resolve-ambiguity` | Interactions, Contracts, Data Models, Access Control, Event Schemas, Edge Cases |
| 2026-08-28 | F10 complete — locked one canonical Shard-30 lifecycle fact with versioned authorization and exactly-once announce record; Shard 35 owns schedule/timer and derives operational `Embargoed`. Added record-first schedule binding, versioned timer callback, fail-closed stale/replay handling and no-duplicate-state boundary. | `/resolve-ambiguity` | Interactions, Contracts, Data Models, Access Control, Event Schemas, Edge Cases |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
