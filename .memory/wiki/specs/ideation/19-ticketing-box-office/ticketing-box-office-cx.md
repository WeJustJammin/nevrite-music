# Ticketing & Box Office — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Ticketing & Box Office](./ticketing-box-office-index.md)
> **Status**: [DEEP] — 12 children classified; intra-domain cross-cuts mapped and synthesised.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | The manifest is the inventory every on-sale and presale window draws from; scaling must be **locked** before an on-sale can be scheduled (422 MANIFEST_NOT_LOCKED); timed-tier triggers interleave with the on-sale/presale schedule | Operator, Musician | High | 19.02.01 D-03 (on-sale against undefined inventory is a money incident); intra 19.01.01→19.02, 19.02.01→19.01 |
| CX-02 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.03 Guest List & Comps](./19.03-guest-list-comps/) | The artist hold is the inventory the guest list spends; comps decrement the manifest at a bound price level without touching the paid count; paid sale wins the last-unit race | Musician, Operator | High | 19.03.02 three-counter model; intra 19.03.02→19.01.02, 19.03.01→19.01.02 (D-06/D-09) |
| CX-03 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | The manifest is the state; the live count is its reporting face. Tier advances, level exhaustion and held-inventory alerts are specified in 19.01 and surfaced in 19.05.01; raw count is never exposed to Fans | Operator | High | 19.01.02 DT-02 (alert fires on remaining inventory, not a date); intra 19.01.01→19.05.01 |
| CX-04 | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | **Hard gate**: the box office cannot close while any scanning device is unreconciled — the scanned count would be short by an unknown number. The reconciled, deduplicated scanned count is the number the fire officer and settlement both read | Operator, Musician | High | 19.04.02 D-04, 19.05.05 D-02; intra 19.04.02→19.05.05, 19.04.02→19.05.01, 19.04.01→19.05.01 |
| CX-05 | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | [19.07 External Integration](./19.07-external-ticketing-integration/) | **The domain's most consequential internal link**: scanned is the only count WeJammin independently observes, so reconciling a foreign count is only verification (not transcription) if WeJammin runs the door | Musician, Operator | High | 19.07.03 DT-01; the door and reconciliation stand or fall together |
| CX-06 | [19.03 Guest List & Comps](./19.03-guest-list-comps/) | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | Door-time comps mutate the live count while the box office is being closed and settlement computed from it; a comp issued after close forces re-certification with all parties notified | Operator, Musician | High | 19.03.02→19.05.01, 19.03.02→19.05.05 (state-race); over-allocation is an attributed line on the statement |
| CX-07 | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | Refunded and opt-out inventory routes to the waitlist before public sale; the waitlist is the destination for everything that comes back | Fan, Operator | High | 19.02.05 D-01, 19.06.01 D-04 |
| CX-08 | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | [19.09 Fraud & Resale](./19.09-ticketing-fraud-bot-resale-controls/) | Queue randomisation is the domain's strongest anti-bot control and it lives in the on-sale, not in the fraud sub-domain — structural beats detective | Fan, Operator | High | 19.02.04 D-01, 19.09 D-03 |
| CX-09 | [19.09 Fraud & Resale](./19.09-ticketing-fraud-bot-resale-controls/) | [19.12 Ticket Delivery & Wallet](./19.12-ticket-delivery-fan-wallet.md) | The delivery mechanism *is* half the transfer control: static barcodes are copyable, rotating tokens need signal the venue does not have | Fan, Operator | High | 19.09.02 DT-03 |
| CX-10 | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | [19.12 Ticket Delivery & Wallet](./19.12-ticket-delivery-fan-wallet.md) | The self-updating wallet pass is the only channel that reliably tells a fan the date moved — notifications go to the payer, land in promotions, or hit a dead address | Fan | High | 19.06.03 DT-02, 19.12 DT-01 |
| CX-11 | [19.08 VIP Packages](./19.08-vip-packages-meet-and-greet/) | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | VIP physical components ship weeks ahead — before anyone knows the show will happen. A cancellation finds the fan already holding the goods | Fan, Operator | High | 19.08.03 DT-01, 19.06.02 Q-02 |
| CX-12 | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | [19.07 External Integration](./19.07-external-ticketing-integration/) | **Boundary**: 19.05 owns the canonical count and the certified statement; 19.07 gets foreign counts *into* it. Every ingested number carries a source and a freshness; a blended count never averages away where it came from | Operator, Musician | High | 19.05 D-04, 19.07 D-03, 19.05.01 DT-02; intra 19.05.01→19.07.02/03 |
| CX-13 | [19.03 Guest List & Comps](./19.03-guest-list-comps/) | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | Comps scan identically to paid tickets (single-use barcode defeats forwarding); door lookup by name admits an undelivered comp because the record persists; an offline comp added at the door is the one case admit-and-reconcile can oversell | Operator, Musician | High | 19.03.02→19.04.01 (D-01/DT-01), 19.04.02→19.03.03 (unbacked offline write) |
| CX-14 | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | Refunds and transfers landing after the door replica's last sync are the main source of staleness *with money attached* — they set the stakes for the D-06 staleness threshold and can produce admitted-then-refunded anomalies at the lane | Operator, Fan, Musician | High | 19.04.02→19.06.01 (state-race); admitted-vs-refunded is a settlement discrepancy |
| CX-15 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | Accessible tickets route to the accessible entrance and the companion must scan **with** the position holder at the same lane, not independently — the door needs the companion-to-position link from the config | Operator, Fan | High | 19.01.05→19.04.01 (trigger-dependency); companion is a zero-fee entitlement bound to a position |
| CX-16 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | A post-on-sale face-value *decrease* under a price-guarantee policy routes a delta-refund batch to 19.06; the fee layer recomputes so displayed==charged for the new all-in | Fan, Operator | Medium | 19.01.01→19.06 (D-06 price guarantee); depends on Q-06 refund policy |
| CX-17 | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | [19.09 Fraud & Resale](./19.09-ticketing-fraud-bot-resale-controls/) | Barcode-signing (defeat forgery) and rotating-vs-static-barcode-in-basements are owned in 19.09; the door's enumeration-resistant refusal posture *depends on* that anti-fraud decision — the two co-design the artifact | Operator, Fan | High | 19.04.01→19.09.02 (Q-03/D-08/DT-06); pairs with CX-09 (delivery is the other half) |
| CX-18 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.11 RSVP & Free Admission](./19.11-rsvp-free-private-event-admission.md) | A zero-value price level routes admission to the RSVP rail instead of the paid rail — price is the switch between the two admission economies | Operator, Producer, Musician | Medium | 19.01.01→19.11 (D-02); free does not mean uncounted (see CX-19) |
| CX-19 | [19.11 RSVP & Free Admission](./19.11-rsvp-free-private-event-admission.md) | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | RSVPs issue real admission records that scan, count and close like tickets — a fire officer does not care what anyone paid | Producer, Musician, Operator | Medium | 19.11 D-02 |
| CX-20 | [19.03 Guest List & Comps](./19.03-guest-list-comps/) | [19.12 Ticket Delivery & Wallet](./19.12-ticket-delivery-fan-wallet.md) | Comps deliver via the ordinary path as a 0-face (+optional fee) transaction; a delivery failure leaves the record intact for door lookup, so delivery is best-effort, not a gate on admission | Fan, Operator | Medium | 19.03.02→19.12 (notification); decouples delivery from the admission record |
| CX-21 | [19.10 Attendee Data](./19.10-attendee-data-capture-consent.md) | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | Consent captured at purchase determines what the waitlist's demand signal may be used for and who may be sent a presale code; the 19↔20 boundary runs through here | Fan, Musician | Medium | 19.02.05 geography is consent-bound |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** referencing a CX entry from another file uses `ticketing-box-office-cx.md#CX-NN`.

---

## Cross-Cut Details

### CX-01: Ticket Config ↔ On-Sale & Presale

**Relationship**: The scaled manifest is the inventory an on-sale sells. Scaling (levels, fees, holds, seat map) must be **locked** before a schedule can fire — a partial manifest counts as unlocked and returns 422 MANIFEST_NOT_LOCKED. Once live, timed-tier triggers (price-tier advances, level exhaustion) interleave with the on-sale/presale clock, and a cart holds its quoted price for its TTL so a tier advance never re-prices an in-flight cart.

**Role scoping**:
- **Operator**: locks the manifest and owns the schedule; blocked from scheduling until config is complete.
- **Musician**: proposes face value via a booking term (17.04) except when self-promoting; reads the resulting on-sale.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The manifest is owned by 19.01; the schedule references its locked snapshot. No concurrent mutation — the lock is the merge strategy (config edits after lock re-open the gate).
2. **Trigger chain**: Lock manifest → schedule on-sale → fire. If the manifest is edited after scheduling, the schedule is invalidated and re-lock is required, never silently fired against stale inventory. Sync precondition.
3. **Permission intersection**: Yes — a Musician who holds only Config on 19.01 cannot schedule an on-sale (Operator-Full on 19.02).
4. **Notification fan-out**: A tier advance or level exhaustion surfaces in the live count (CX-03), not to Fans as raw numbers.
5. **State transition conflict**: A tier advance racing an in-flight cart — resolved by D-08: the cart's quoted price is frozen at add-to-cart; the advance applies only to new carts.

### CX-02: Ticket Config ↔ Guest List & Comps

**Relationship**: A comp draws a unit from the artist hold (or a comp-designated block for reserved seating, to preserve sellable adjacency, D-06) at a bound price level, decrementing the manifest's sellable count and incrementing comp — without touching paid. The three-counter model (paid / comp / scanned) exists precisely because this decrement must not read as a sale.

**Role scoping**:
- **Musician**: spends their own allocation; Full on 19.03.
- **Operator**: owns the manifest the allocation draws from; adjudicates over-allocation.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The manifest's sellable count. Issuance writes sellable−1 / comp+1 in one transaction; the owner is 19.01, the writer is 19.03.
2. **Trigger chain**: Guest-list submission → comp issuance → manifest decrement. If issuance fails the allocation is not spent. Auto-return of unspent allocation re-increments sellable (same shape as hold auto-release, DT-01 — candidate shared mechanism).
3. **Permission intersection**: The purchase flow never self-comps, even for a multi-hyphenate Operator buying into their own show — a zero-cost accessible ticket is only reachable via a 19.03 comp.
4. **Notification fan-out**: Escalating deadline prompts (T-48h/T-12h/T-2h) and cross-allocation duplicate warnings fan out to the owning party.
5. **State transition conflict**: A comp issuance can race a public sale for the last unit — **paid sale wins** (D-09); the comp fails and the allocation is not spent.

### CX-03: Ticket Config ↔ Counts & Drops

**Relationship**: The manifest is the state; the live count is its reporting face. Tier advances, level exhaustion and the held-inventory alert are specified in 19.01 and surfaced in 19.05.01 — but the alert must fire on *remaining inventory*, not on a calendar date (19.01.02 DT-02), and the raw count is never shown to a Fan (only band/pressure signals).

**Role scoping**:
- **Operator**: sees the full count.
- **Musician**: deal-scoped subset (default paid+remaining, widening for percentage deals).
- **Fan**: sees pressure signals only, never the raw remaining count.

**Synthesis questions answered**:
1. **Shared state conflict**: The manifest owns the numbers; 19.05.01 is a read-model over it. No write conflict — the count reads, it does not own.
2. **Trigger chain**: Manifest mutation (sale/hold/comp/exhaustion) → live-count update → optional Operator alert. Async, fire-and-forget for display; the manifest is authoritative.
3. **Permission intersection**: The Musician deal-scope on the live view is the same grant model as a drop's scope — keep them consistent (19.05.01 D-05).
4. **Notification fan-out**: Held-inventory and exhaustion alerts reach the Operator; tier-advance is Operator-visible only.
5. **State transition conflict**: None on the read path; the freeze at close (CX-04) is where the count stops tracking the manifest.

### CX-04: Door Scanning ↔ Counts & Drops

**Relationship**: The certified statement (19.05.05) is this domain's output and settlement's input. It cannot be produced while any scanning device still holds unpushed scans — the scanned count would be short by an unknown quantity, and "unknown" is what a certification exists to eliminate. The reconciled, deduplicated scanned count is simultaneously the fire officer's capacity number and settlement's admitted number.

**Role scoping**:
- **Operator**: must reconcile every device before the night can close; blocked otherwise.
- **Musician**: the beneficiary — paid from a complete number or not at all.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The scanned counter. Devices write asynchronously and are the authority during the show (19.04.02 D-02); the close needs it final. The scanned counter reads net of reversals (accepts − reversals per D-07), not raw accepts.
2. **Trigger chain**: Close → check every provisioned device → block if any is outstanding or unreconciled (D-04) → freeze → certify → 24h replica wipe (D-08). A permanently-lost device forces an explicit written-off exception on the statement, not a silent gap.
3. **Permission intersection**: No — reconciliation is an Operator-scoped door action.
4. **Notification fan-out**: The close names the specific blocking device so the Operator can walk it into signal. Double-scans, admitted-refunded tickets and dead-device gaps must reach the Operator, never self-correct silently.
5. **State transition conflict**: A late-reconciling device arriving after certification is a settlement adjustment, not a statement edit (19.05.05 D-06).

### CX-05: Door Scanning ↔ External Integration

**Relationship**: **The domain's most consequential internal link, and it inverts a MoSCoW assumption.** The domain exists even if WeJammin never sells a ticket, because it must ingest box-office data or settlement is fiction. True — but an ingested number is supplied by the counterparty; displaying it back with better typography is transcription, not verification. What makes it a fact is a second, independently-observed source, and the only one WeJammin has is its own scanned count. The door is what gives 19.07 its value; the two stand or fall together (Q-05).

**Role scoping**:
- **Musician**: matters to them most; no power over it.
- **Operator**: runs both the door and the connection.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The canonical count holds both numbers, each with its source (19.05.01 D-02). They are not merged — the disagreement *is* the product.
2. **Trigger chain**: Ingest + scan → compare against an expected no-show band → discrepancy → adjudication → statement. A raw diff is meaningless: scanned is always below paid (19.07.03 D-02).
3. **Permission intersection**: Adjudication is settlement-adjacent authority, and the Operator adjudicates the number that decides what they pay (19.07.03 Q-01) — a self-favouring resolution pattern is a 24 trust signal.
4. **Notification fan-out**: A material discrepancy reaches both parties **before** certification, not after the money moves.
5. **State transition conflict**: If the incumbent owns the barcode and WeJammin cannot scan (19.04 Q-03), this link does not exist and 19.07 degrades to attestation-only (19.07.04) — honest, but much weaker.

### CX-06: Guest List & Comps ↔ Counts & Drops

**Relationship**: Door-time comps (including after-close over-allocations) mutate the live count while the box office is being closed and settlement computed from it. The paid/comp/scanned counters are three certified lines plus a facility-fee line; a comp issued after close forces re-certification with all parties notified.

**Role scoping**:
- **Operator**: authorises door-time over-allocation (a Musician cannot); bears the re-certification.
- **Musician**: over-allocation spends their budget and lands attributed on the statement.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The comp counter and the certified snapshot. Issuance writes sellable−1/comp+1 in one transaction; the close freezes the snapshot — a comp issued into the gap between compute and certify is the race.
2. **Trigger chain**: Door-time add → comp issuance → live-count mutation → (if after close) re-certification. Every door-time add issues a comp through 19.03.03, carrying the authoriser+timestamp+absorb-party attribution.
3. **Permission intersection**: Post-deadline / over-allocation adds are an Operator action, never a Musician one (19.03.01) — the permission model diverges from ordinary submission.
4. **Notification fan-out**: A post-close comp re-certifies and notifies all parties; the attribution record is the evidence if the overage is later disputed (routes to 24).
5. **State transition conflict**: Issuance racing the close freeze — resolved by treating any post-freeze mutation as a re-certification event, never a silent statement edit.

### CX-07: On-Sale & Presale ↔ Refunds & Reschedule

**Relationship**: Refunded, opted-out and returned inventory routes to the waitlist before returning to public sale; the waitlist is the destination for everything that comes back. This closes the loop between money leaving (refund) and inventory re-entering the sale.

**Role scoping**:
- **Fan**: waitlisted fans are the beneficiaries of returned inventory.
- **Operator**: owns the routing policy and funds the refunds.
- **Musician** / **Producer**: not directly affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The manifest. A refund re-increments sellable; the waitlist claims it before public release. One owner (manifest), ordered consumers (waitlist then public).
2. **Trigger chain**: Refund/opt-out → inventory returns → waitlist offer → claim or expiry → public sale. Async offers with a claim TTL (deadline-with-auto-resolution).
3. **Permission intersection**: No — waitlist position is Fan-scoped; routing policy is Operator-scoped.
4. **Notification fan-out**: A returned unit fires a waitlist offer notification to the next eligible fan (consent-scoped per CX-21).
5. **State transition conflict**: Two refunds returning units concurrently vs a finite waitlist — offers are issued atomically against sellable to avoid over-offering.

### CX-08: On-Sale & Presale ↔ Fraud & Resale

**Relationship**: Queue randomisation at on-sale is the domain's strongest anti-bot control, and it lives in the on-sale flow, not the fraud sub-domain — structural (remove the attacker's advantage) beats detective (catch the attacker after). Per-buyer purchase limits are enforced per-checkout here; cross-account scalping detection defers to 24.

**Role scoping**:
- **Fan**: subject to the queue and the per-buyer limit.
- **Operator**: configures limits and the queue.
- **Musician** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The queue order and the per-buyer counter. Randomisation is computed at queue entry; the limit counts carted units reserved at cart creation (D-05).
2. **Trigger chain**: On-sale fires → queue randomises → checkout enforces per-buyer limit → over-limit is refused. Sync at checkout.
3. **Permission intersection**: No.
4. **Notification fan-out**: None — a refused over-limit checkout is an inline error, not a notification.
5. **State transition conflict**: Cross-account scalping evades the per-checkout limit; this is deliberately deferred to 24 as a [PENDING] cross-cut rather than solved here.

### CX-09: Fraud & Resale ↔ Ticket Delivery & Wallet

**Relationship**: The delivery mechanism *is* half the transfer control. A static barcode is copyable and forwardable; a rotating token defeats forwarding but needs signal the venue does not have. The choice of delivery artifact and the anti-forgery posture at the door co-determine each other (see CX-17 for the door half).

**Role scoping**:
- **Fan**: holds the artifact; a rotating token that fails offline strands them at the door.
- **Operator**: bears the false-refusal risk of an over-clever token in a basement.
- **Musician** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The barcode/token. 19.12 issues it; 19.09 sets its signing/rotation policy. One artifact, two owners of different properties.
2. **Trigger chain**: Issue policy (19.09) → delivery renders the artifact (19.12) → door validates (CX-17). If rotation requires signal and there is none, the door must fall back to a signed-static posture, not refuse.
3. **Permission intersection**: No.
4. **Notification fan-out**: A transfer re-issues the artifact and notifies the new holder.
5. **State transition conflict**: A rotating token mid-transfer — the token must invalidate the sender's copy atomically or a double-entry is possible.

### CX-10: Refunds & Reschedule ↔ Ticket Delivery & Wallet

**Relationship**: A rescheduled show hands every holder a right they did not have yesterday, and the notification telling them frequently does not arrive — it goes to the payer rather than the holder, lands in promotions, or hits a dead address. The wallet pass is on the phone of whoever is actually coming and updates itself; it is the passive, near-unmissable second channel, and it is why 19.12 is a product rather than plumbing.

**Role scoping**:
- **Fan**: the whole subject.
- **Operator**: funds the resulting opt-out refunds; does not know how many until the window closes.
- **Musician**: usually the cause; sees the attrition.
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The ticket. Reschedule rewrites its date; the pass reflects it. One writer, no conflict.
2. **Trigger chain**: Reschedule → notify + update every pass → opt-out window → refunds → released inventory routes to the waitlist (CX-07). If the notification fails, the window is a right nobody knew they had — worse than not offering it.
3. **Permission intersection**: The opt-out right overrides the ordinary refund policy for its duration (19.06.03 D-01). A "no refunds" policy does not survive the seller moving the date.
4. **Notification fan-out**: Both channels deliberately — the active one that mostly works and the passive pass that catches the rest.
5. **State transition conflict**: A second reschedule inside the first opt-out window (19.06.03 Q-03) — real, and grim; the second window must supersede, not nest.

### CX-11: VIP Packages ↔ Refunds & Reschedule

**Relationship**: VIP physical components ship weeks ahead — before anyone knows the show will happen. A cancellation finds the fan already holding the goods, so the refund cannot assume the deliverable is recoverable.

**Role scoping**:
- **Fan**: keeps the shipped goods; the refund must account for that.
- **Operator**: bears the un-recovered component cost on cancellation.
- **Musician** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The VIP order's fulfilment state vs the show's cancellation state — two independent lifecycles that a cancellation forces to reconcile.
2. **Trigger chain**: Cancellation → refund → but the physical component's cost is already sunk; the refund policy must decide whether the fan owes it or keeps it free.
3. **Permission intersection**: No.
4. **Notification fan-out**: Cancellation notifies VIP holders separately from GA (their entitlement is different).
5. **State transition conflict**: A cancellation arriving after the component ships but before the M&G — the experience is refundable, the shipped good may not be.

### CX-12: Counts & Drops ↔ External Integration

**Relationship**: Both sub-domains produce something called a "count", which is why the boundary must be explicit: **19.05 owns the canonical count and the certified statement; 19.07's job is getting foreign counts into it.** Every ingested number carries a source and a freshness, so a blended count (WeJammin 140 + DICE 260) never averages away the fact that it came from two places of different quality and age.

**Role scoping**:
- **Operator**: owns both.
- **Musician**: reads the result and must see where each number came from — otherwise "trust the venue's word" becomes "trust the venue's integration".
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The count. 19.07 writes with a source; 19.05 owns the schema and the freeze.
2. **Trigger chain**: Ingest → count → drop / pacing / statement. A stale source must block or qualify certification (19.07.01 D-02) rather than silently feed a drop.
3. **Permission intersection**: No.
4. **Notification fan-out**: A broken connector must reach the Operator, because a stale count silently feeds a drop the Musician reads as current (19.07.01 DT-02).
5. **State transition conflict**: An ingest landing during a close — the close must quiesce ingestion as well as the walk-up window (19.05.05).

### CX-13: Guest List & Comps ↔ Door Scanning

**Relationship**: Comps scan identically to paid tickets — a single-use barcode defeats forwarding, and a door lookup by name admits an undelivered comp because the record persists (D-01/DT-01). The dangerous edge is the reverse direction: a comp *added offline at the door* (19.04.02 → 19.03.03) is the one case admit-and-reconcile can oversell, because it is an unbacked write to inventory with no server to check against.

**Role scoping**:
- **Operator**: runs the door and authorises door-time comps.
- **Musician**: their allocation; sees the attributed line.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The manifest. An offline door comp writes locally with no live sellable check — the oversell is flagged distinctly as an unbacked offline write at reconciliation, not silently absorbed.
2. **Trigger chain**: Name lookup / door add → comp issuance → admit. Offline, the write queues; on resync it reconciles against the true count and surfaces any oversell.
3. **Permission intersection**: Door-time over-allocation is an Operator action; the door scanner role must carry comp-issue authority for it to work at the lane.
4. **Notification fan-out**: An offline-comp oversell surfaces to the Operator at reconciliation (CX-04 / CX-06).
5. **State transition conflict**: The offline comp vs the reconciled online count — resolved by admit-and-reconcile (admit the person, reconcile the number), never last-writer-wins.

### CX-14: Door Scanning ↔ Refunds & Reschedule

**Relationship**: Refunds and transfers landing after the door replica's last sync are the main source of staleness *with money attached*. They set the stakes for the D-06 staleness threshold: a fan refunded online after the replica synced still scans as valid at a stale door, and an already-admitted-then-refunded ticket is a real settlement discrepancy (paid drops, scanned unchanged).

**Role scoping**:
- **Operator**: bears the reconciliation of admitted-vs-refunded.
- **Fan**: a refunded-but-still-admitted fan is the friction point; a legitimately refunded fan must not be waved through as paid.
- **Musician**: the discrepancy flows into their settlement number.

**Synthesis questions answered**:
1. **Shared state conflict**: The ticket's validity state. The refund writes online; the door reads a stale replica. The replica's freshness gate (amber at 60 min, D-06) bounds the exposure.
2. **Trigger chain**: Refund/transfer online → replica staleness grows → door either admits on a stale replica (admit-and-reconcile) or refuses if too stale. Refund provenance (paid down, scanned unchanged if already admitted) is a discrepancy settlement must carry (19.05.01, 19.05.04).
3. **Permission intersection**: No.
4. **Notification fan-out**: An admitted-then-refunded ticket surfaces to the Operator at reconciliation, not silently.
5. **State transition conflict**: The refund and the scan race across the online/offline boundary — resolved by never auto-refusing a legitimate holder on a stale replica (avoid false counterfeit accusations, DT-04) and reconciling the money afterward.

### CX-15: Ticket Config ↔ Door Scanning

**Relationship**: Accessible seating (19.01.05) imposes door behaviour: accessible tickets route to the accessible entrance, and a companion must scan **with** the position holder at the same lane, not independently. The door needs the companion-to-position link, which only the config can supply.

**Role scoping**:
- **Operator**: staffs the accessible lane and enforces the companion pairing.
- **Fan**: the accessible-position holder and their companion.
- **Musician** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The companion-to-position link, owned in 19.01.05, read at the door. The accessible block is exempt from the hold/kill/auto-release lifecycle (CX-04 exclusion).
2. **Trigger chain**: Accessible ticket + companion issued (19.01.05) → door validates the pair → admit together. A companion scanning alone is refused/held for the position holder.
3. **Permission intersection**: Access-requirements free-text is health-adjacent PII (see the routed-out security cross-cut) — visible only to this show's access staff, excluded from logs and AI payloads, encrypted at rest.
4. **Notification fan-out**: None routine; a mismatch is a door-side exception.
5. **State transition conflict**: A production kill against an accessible position (cross to domain 18) is a hard block requiring an equivalent replacement — it cannot silently remove the position the door expects.

### CX-16: Ticket Config ↔ Refunds & Reschedule

**Relationship**: A post-on-sale face-value *decrease* under a price-guarantee policy routes a delta-refund batch to 19.06 — every prior buyer at the higher price is owed the difference. The fee layer recomputes so displayed==charged for the new all-in. Medium-confidence because it depends on Q-06 (refund policy and whether fees are refundable), which is unresolved.

**Role scoping**:
- **Operator**: initiates the decrease and funds the delta-refunds.
- **Fan**: the beneficiary of the guarantee.
- **Musician** / **Producer**: not affected.

**Synthesis questions answered** (provisional pending Q-06):
1. **Shared state conflict**: Face value (19.01) is the fee base; a decrease recomputes every all-in. Ordering contract: face resolves before fees apply, so a simultaneous decrease + timed tier advance yields a single-valued all-in.
2. **Trigger chain**: Price decrease → identify prior buyers above the new price → delta-refund batch → 19.06. Async batch.
3. **Permission intersection**: Editing face value on a booked show requires settlement-side rights (a deal term), not box-office rights (cross to 17).
4. **Notification fan-out**: Delta-refunded fans are notified of the refund.
5. **State transition conflict**: A decrease during an active tier advance — the display/charge invariant (charge the single carried value computed once) prevents a divergence; a divergence is a P1 compliance incident.

### CX-17: Door Scanning ↔ Fraud & Resale

**Relationship**: Barcode-signing (defeat forgery) and the rotating-vs-static barcode decision for no-signal basements are owned in 19.09. The door's enumeration-resistant refusal posture *depends on* that anti-fraud decision — the two co-design the same artifact from opposite ends (issuance vs validation). This is the door half of CX-09.

**Role scoping**:
- **Operator**: runs the door; inherits whatever the fraud policy issues.
- **Fan**: a valid holder must never be refused by an over-clever token that needs absent signal.
- **Musician** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The barcode signature/rotation scheme. 19.09 owns the scheme; 19.04 validates against it on a possibly-offline replica.
2. **Trigger chain**: Fraud policy sets signing/rotation → door validates → refuse on invalid signature, but degrade gracefully (no rotation) when offline. The refusal must be enumeration-resistant (no oracle for guessing valid codes).
3. **Permission intersection**: No.
4. **Notification fan-out**: A pattern of refusals is a 24 moderation/dispute signal (cross to domain 24).
5. **State transition conflict**: A rotating token whose rotation window advances while the door is offline — resolved by validating the signature (static property) rather than the rotation (time-dependent) when offline.

### CX-18 / CX-19: Free-admission rail (Ticket Config ↔ RSVP ↔ Door)

**Relationship** (Medium): A zero-value price level (19.01) is the switch that routes admission to the RSVP rail (19.11) instead of the paid rail — no cart, no charge, no refund path. But RSVPs still issue real admission records that scan, count and close like tickets (19.11 → 19.04): free does not mean uncounted, because a fire officer does not care what anyone paid. Full 5-question synthesis deferred to Step 5 deepening — these are Medium-confidence and gated on Q-02 (does a Producer studio playback even have a domain-16 venue?) and Q-06.

### CX-20 / CX-21: Delivery decoupling and consent gating

**Relationship** (Medium): Comps deliver via the ordinary path as a 0-face transaction, but a delivery failure leaves the record intact for door lookup (CX-20) — delivery is best-effort, admission is not gated on it. Separately, consent captured at purchase (19.10) determines what the waitlist demand signal may be used for and who may be sent a presale code (CX-21) — this is where the 19↔20 boundary physically runs. Both Medium; full synthesis deferred to Step 5.

> **Synthesis coverage**: all High-confidence entries (CX-01 through CX-15, CX-17) carry full 5-question synthesis. Medium entries (CX-16, CX-18–CX-21) carry relationship + role scoping; full synthesis is gated on the open questions each names.

---

## The Domain's Characteristic Mechanisms

> Not a template section. Recorded because three patterns recurred independently across sub-domains that were classified separately — which makes them the domain's actual character rather than local preferences. **Each should be checked for a single shared implementation at `/create-prd-architecture`; two implementations of one idea will drift.**

### 1. Deadline-with-automatic-resolution

A party holds something that belongs, by default, to someone else. The incentive is to hold it indefinitely. The unbounded state is the failure. **Every instance needs a deadline that resolves itself without anyone remembering.**

| Instance | Held thing | Auto-resolution |
|---|---|---|
| 19.01.02 D-01 | An inventory hold | Releases to public sale |
| 19.03.01 D-01 | A guest-list allocation | Returns to sale |
| 19.02.04 D-08 | A cart's quoted price | Expires with the cart TTL |
| 19.02.05 | A waitlist offer | Expires and passes to the next fan |
| 19.06.03 D-02 | A fan's money in an indefinite postponement | Converts to cancellation |

The last is the only one where inaction is *rewarded* — which is why the law had to intervene there and not in the others. **Note**: the registry's *Availability, Scheduling & Reservations* mechanism covers hold-expiry, but not the money-state case (postponement→refund) — see Emergent Cross-Cuts.

### 2. Attribution, not prevention

Where a human must be able to say yes to something the system would rather forbid, the product's job is to record **who decided, when, and who bears it** — not to block.

| Instance | The thing that cannot be blocked |
|---|---|
| 19.03.03 D-01 | Door-time over-allocation comps |
| 19.04.01 D-05 | Operator override of a scan refusal |
| 19.04.02 D-01 | Reconciliation produces evidence, not repair |
| 19.05.05 D-03 | A *disputed* certified statement is a success, not a failure |
| 19.07.04 D-01 | A manually-typed count is attributable, not provable |

A system that blocks gets switched off by 8pm on night one. This is the domain's clearest expression of the platform thesis (D-18): capture the fact at the moment it is true, with the parties present, or reconstruct it badly later.

### 3. Structural over detective

The cheapest and most effective controls have **no false positives**, because they remove the attacker's advantage rather than detect the attacker.

| Instance | Structural control | What it replaces |
|---|---|---|
| 19.02.04 D-01 | Randomise queue order at on-sale | Bot detection |
| 19.04.03 D-01 | Token re-entry keeps the ticket use-once | Losing the double-scan signal |
| 19.09.03 D-01 | Face-value exchange has no margin | Regulating a scalper's margin |

---

## Cross-Cut Mechanisms Discovered Here

> These serve many domains and are **not** nodes in 19. Recorded for the global CX file (`ideation-cx.md`) to absorb. Registry name in **bold** where one already exists.

| Mechanism | Registry name | Also serves | Why it is not owned here |
|---|---|---|---|
| Payments, checkout & money rail | **Payments, Escrow & Payouts** | 05, 13, 14, 19, 20 | Ticketing decides the number; the rail moves it |
| Chargebacks & payment disputes | **Payments, Escrow & Payouts** | 05, 13, 14, 19, 20 | The bank's process is identical whatever the item; this domain contributes *evidence* (the scan record), not ownership |
| Fraud & abuse detection engine | (cross-cut → 24) | 05, 13, 14, 19, 20, 24 | A stolen card is a stolen card. What is ticketing-specific is only the *scarcity* regime — BOTS Act, resale caps, transfer locks (19.09) |
| Consent & preference management | **Privacy, Consent & Data Portability** | All | 19.10 owns only party-scoped event disclosure |
| Age assurance | **Safeguarding & Minor Protection** | 19, 20, 24, 03 | 19.04.04 owns the physical refusal and its refund consequence |
| Tax calculation & remittance | **Tax Calculation & Remittance** | 05, 13, 14, 19 | Computed rates are consumed by 19.01.03, not owned |
| Notifications & alerts fan-out | **Notifications & Alerts** | All | Announce, drops, reschedule notices and code delivery all ride it |
| Attestation & counter-signature | **Contracts, E-Signature & Attestation** (partial) | 02, 09, 17, 19 | **The important one.** 19.05.05 and 19.07.04 need "a fact, attested by the party present, counter-signed by the counterparty, immutable thereafter" — see Emergent Cross-Cuts: the registry frames this as *document* e-signature and omits 19; the box-office *number-attestation* flavour is a distinct variant |
| Holds / atomic reservation lifecycle | **Availability, Scheduling & Reservations** (partial) | 05, 06, 08, 16, 17, 18, 19 | Inventory holds/auto-release match the reservation primitive; the postponement→money case does not — see Emergent Cross-Cuts |
| Health-adjacent access-requirements PII | **Privacy, Consent & Data Portability** | 01, 19, 24 | 19.01.05 free-text access requirements are encrypted, log-excluded, AI-payload-excluded; the isolation mechanism is shared, the field is ours |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 19.08 VIP Packages | 19.03 Guest List & Comps | Both put a non-standard person through a door with a laminate. Rejected: a comp is inventory given away against an allocation with a settlement consequence; a VIP package is a premium product sold at a markup. Opposite revenue signs, opposite money direction, different settlement lines. The laminate is a coincidence of stationery. |
| R-02 | 19.11 RSVP | 19.09 Fraud & Resale | Free events have no resale market, no scalping incentive and no money to defraud. The one plausible link — a leaked invite link filling a private event — is 19.02.03's shared-code trade-off, not a resale control. Applying the fraud apparatus to RSVP imports ceremony for zero risk. |
| R-03 | 19.10 Attendee Data | 19.04 Door Scanning | Tempting: the scan proves attendance, the strongest fan signal there is. Rejected because the scan record's use here is *evidence* (refund refusal, chargeback defence, capacity) rather than marketing data; routing scan events straight into a consent-scoped marketing pipeline conflates a licensing/settlement artifact with a CRM one. The attendance→fanbase link belongs to domain 20 via 19.10's consented pipe, not directly from the door. **The closest of these rejections.** |
| R-04 | 19.02 On-Sale & Presale | 19.03 Guest List & Comps | Both carve inventory from the manifest for a named party and both are frequently deal terms. Rejected: a presale allocation is inventory *to be sold at full price to a gated audience*; a comp allocation is inventory *not to be sold at all*. Opposite revenue signs, different settlement lines — structural resemblance, not semantic. |
| R-05 | 19.12 Ticket Delivery & Wallet | 19.05 Counts & Drops | The wallet knows what a fan holds; the count knows what the room holds. Rejected: the wallet is a per-fan view of their own tickets, the count a per-show aggregate of everyone's. No shared state beyond the ticket itself, independent lifecycles — a fan's wallet does not change when the count does. |
| R-06 | 19.01 Ticket Config | 19.04 Door Scanning (as a *direct config/pricing* link) | The door validates against a **replica of the count** (19.05.01), not against the configuration — scaling, fees and seat maps are invisible at the door. Modelling a direct pricing→door link would suggest the scanner needs pricing data it must never have. **Narrow rejection**: the *accessible-routing* link (CX-15) is a genuine 19.01→19.04 dependency, because a companion-to-position pairing is admission data, not pricing data. |
| R-07 | 19.08 VIP Packages | 19.01 Ticket Config (as a plain price level) | Considered folding VIP into ticket scaling as a high-priced tier. Rejected: a VIP package bundles a physical/experiential component with its own fulfilment and cancellation lifecycle (CX-11) — it is a product, not a price point on the seat map. |
