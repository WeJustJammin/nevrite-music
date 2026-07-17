# Ticketing & Box Office — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Ticketing & Box Office](./ticketing-box-office-index.md)
> **Status**: [BREADTH] — 12 children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | The manifest is the inventory every on-sale and presale window draws from; scaling must be locked before an on-sale can be scheduled | Operator, Musician | High | An on-sale against undefined inventory is a money incident (19.02.01 D-03) |
| CX-02 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.03 Guest List & Comps](./19.03-guest-list-comps/) | The artist hold is the inventory the guest list spends; comps decrement the manifest without touching the paid count | Musician, Operator | High | 19.03.02's three-counter model exists because of this asymmetry |
| CX-03 | [19.01 Ticket Config](./19.01-ticket-config-scaling-allocations/) | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | The manifest is the state; the live count is its reporting face. The held-inventory alert is specified in 19.01.02 and surfaced in 19.05.01 | Operator | High | 19.01.02 DT-02 — the alert must fire on remaining inventory, not on a date |
| CX-04 | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | **Hard gate**: the box office cannot close while any scanning device is unreconciled — the scanned count would be short by an unknown number | Operator, Musician | High | 19.04.02 D-04, 19.05.05 D-02 |
| CX-05 | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | [19.07 External Integration](./19.07-external-ticketing-integration/) | **The domain's most consequential internal link**: scanned is the only count WeJammin independently observes, so reconciling a foreign count is only possible if WeJammin runs the door | Musician, Operator | High | 19.07.03 DT-01 — without it, ingestion is transcription, not verification |
| CX-06 | [19.03 Guest List & Comps](./19.03-guest-list-comps/) | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | Door-time comps mutate the live count while the box office is being closed and settlement computed from it | Operator, Musician | High | `19.03-guest-list-comps-cx.md#CX-03`; over-allocation adds are an attributed line on the statement |
| CX-07 | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | Refunded and opt-out inventory routes to the waitlist before public sale; the waitlist is the destination for everything that comes back | Fan, Operator | High | 19.02.05 D-01, 19.06.01 D-04 |
| CX-08 | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | [19.09 Fraud & Resale](./19.09-ticketing-fraud-bot-resale-controls/) | Queue randomisation is the domain's strongest anti-bot control and it lives in the on-sale, not in the fraud sub-domain — structural beats detective | Fan, Operator | High | 19.02.04 D-01, 19.09 D-03 |
| CX-09 | [19.09 Fraud & Resale](./19.09-ticketing-fraud-bot-resale-controls/) | [19.12 Ticket Delivery & Wallet](./19.12-ticket-delivery-fan-wallet.md) | The delivery mechanism *is* half the transfer control: static barcodes are copyable, rotating tokens need signal the venue does not have | Fan, Operator | High | 19.09.02 DT-03 |
| CX-10 | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | [19.12 Ticket Delivery & Wallet](./19.12-ticket-delivery-fan-wallet.md) | The self-updating wallet pass is the only channel that reliably tells a fan the date moved — notifications go to the payer, land in promotions, or hit a dead address | Fan | High | 19.06.03 DT-02, 19.12 DT-01 |
| CX-11 | [19.08 VIP Packages](./19.08-vip-packages-meet-and-greet/) | [19.06 Refunds & Reschedule](./19.06-refunds-cancellations-rescheduling/) | VIP physical components ship weeks ahead — before anyone knows the show will happen. A cancellation finds the fan already holding the goods | Fan, Operator | High | 19.08.03 DT-01, 19.06.02 Q-02 |
| CX-12 | [19.05 Counts & Drops](./19.05-box-office-counts-drops/) | [19.07 External Integration](./19.07-external-ticketing-integration/) | Boundary: 19.05 owns the canonical count and the certified statement; 19.07 gets foreign counts *into* it. Every ingested number carries a source and a freshness | Operator, Musician | High | 19.05 D-04, 19.07 D-03, 19.05.01 DT-02 |
| CX-13 | [19.11 RSVP](./19.11-rsvp-free-private-event-admission.md) | [19.04 Door Scanning](./19.04-door-scanning-access-control/) | RSVPs issue real admission records that scan, count and close like tickets — free does not mean uncounted | Producer, Musician, Operator | Medium | 19.11 D-02; a fire officer does not care what anyone paid |
| CX-14 | [19.10 Attendee Data](./19.10-attendee-data-capture-consent.md) | [19.02 On-Sale & Presale](./19.02-on-sale-announce-presale/) | Consent captured at purchase determines what the waitlist's demand signal may be used for and who may be sent a presale code | Fan, Musician | Medium | 19.02.05 geography is consent-bound; the 19↔20 boundary runs through here |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-04: Door Scanning ↔ Counts & Drops

**Relationship**: The certified statement (19.05.05) is this domain's output and settlement's input. It cannot be produced while a scanning device still holds unpushed scans, because the scanned count would be short by an unknown quantity — and "unknown" is exactly what a certification exists to eliminate.

**Role scoping**:
- **Operator**: must reconcile every device before they can finish the night; blocked otherwise.
- **Musician**: the beneficiary — their money is computed from a complete number or not at all.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The scanned counter. Devices write to it asynchronously; the close needs it final. The server is not the authority during the show — the devices are (19.04.02 D-02).
2. **Trigger chain**: Close → check every device → block if any is outstanding → freeze → certify. A permanently-lost device forces an explicit written-off exception on the statement (19.05.05 D-02) rather than a silent gap.
3. **Permission intersection**: No.
4. **Notification fan-out**: The close names the specific device that is blocking, so the Operator can walk it into signal rather than guess.
5. **State transition conflict**: A late-reconciling device arriving after certification is a settlement adjustment, not a statement edit (19.05.05 D-06).

### CX-05: Door Scanning ↔ External Integration

**Relationship**: **The domain's most consequential internal link, and it inverts a MoSCoW assumption.** The parent rationale argues this domain exists even if WeJammin never sells a ticket, because it must ingest box-office data or settlement is fiction. True — but an ingested number is supplied by the counterparty. Displaying it back to the artist with better typography is *transcription*, not verification: the artist is still trusting the venue's word, now more legibly.

What makes it a fact rather than a claim is a second, independently-observed source. The only one WeJammin has is its own scanned count. So the door is not an optional convenience on externally-ticketed shows — **it is what gives 19.07 its value**, and the two stand or fall together.

**Role scoping**:
- **Musician**: the party this matters to most and the one with no power over it.
- **Operator**: runs both the door and the connection.
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The canonical count holds both numbers, each with its source (19.05.01 D-02). They are not merged — the disagreement *is* the product.
2. **Trigger chain**: Ingest + scan → compare against an expected no-show band → discrepancy → adjudication → statement. A raw diff is meaningless: scanned is always below paid (19.07.03 D-02).
3. **Permission intersection**: Adjudication is settlement-adjacent authority, and the Operator adjudicates the number that decides what they pay (19.07.03 Q-01).
4. **Notification fan-out**: A material discrepancy reaches both parties **before** certification, not after the money moves.
5. **State transition conflict**: If the incumbent owns the barcode and WeJammin cannot scan (19.04 Q-03), this link does not exist and 19.07 degrades to attestation-only (19.07.04) — honest, but much weaker.

### CX-10: Refunds & Reschedule ↔ Ticket Delivery & Wallet

**Relationship**: A rescheduled show hands every holder a right they did not have yesterday — and the notification telling them frequently does not arrive. It goes to the payer rather than the holder (the ticket was transferred), lands in promotions, or hits an address that died in the eighteen months since purchase. Those fans turn up on the original night.

The wallet pass is on the phone of whoever is actually coming, and it updates itself. It is the passive, near-unmissable second channel, and it is why 19.12 is a product rather than plumbing.

**Role scoping**:
- **Fan**: the whole subject.
- **Operator**: funds the resulting opt-out refunds and does not know how many until the window closes.
- **Musician**: usually the cause; sees the attrition.
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The ticket. Reschedule rewrites its date; the pass reflects it. One writer, no conflict.
2. **Trigger chain**: Reschedule → notify + update every pass → opt-out window → refunds → released inventory routes to the waitlist (CX-07). If the notification fails, the window is a right nobody knew they had — which is worse than not offering it.
3. **Permission intersection**: The opt-out right overrides the ordinary refund policy for its duration (19.06.03 D-01). A "no refunds" policy does not survive the seller moving the date.
4. **Notification fan-out**: Both channels deliberately — the active one that mostly works, and the passive one that catches the rest.
5. **State transition conflict**: A second reschedule inside the first opt-out window (19.06.03 Q-03) — real, and grim.

### CX-12: Counts & Drops ↔ External Integration

**Relationship**: Both sub-domains produce something called a "count", which is why the boundary must be explicit: **19.05 owns the canonical count and the certified statement; 19.07's job is getting foreign counts into it.** Every ingested number carries a source and a freshness, so a blended count (WeJammin 140 + DICE 260) never averages away the fact that it came from two places of different quality and different age.

**Role scoping**:
- **Operator**: owns both.
- **Musician**: reads the result and must be able to see where each number came from — otherwise the platform has replaced "trust the venue's word" with "trust the venue's integration".
- **Fan** / **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The count. 19.07 writes with a source; 19.05 owns the schema and the freeze.
2. **Trigger chain**: Ingest → count → drop / pacing / statement. A stale source must block or qualify certification (19.07.01 D-02) rather than silently feed a drop.
3. **Permission intersection**: No.
4. **Notification fan-out**: A broken connector must reach the Operator, because a stale count silently feeds a drop the Musician reads as current (19.07.01 DT-02).
5. **State transition conflict**: An ingest landing during a close — the close must quiesce ingestion as well as the walk-up window (19.05.05).

> **Remaining CX entries** (CX-01, 02, 03, 06, 07, 08, 09, 11, 13, 14): relationship, roles and evidence recorded in the map above; the four detailed above are the ones that change downstream design. Full synthesis questions for the rest: `[PENDING — /ideate-discover Step 5 deepening]`.

---

## The Domain's Characteristic Mechanisms

> Not a template section. Recorded because three patterns recurred independently across sub-domains that were classified separately — which makes them the domain's actual character rather than local preferences. **Each should be checked for a single shared implementation at `/create-prd-architecture`; two implementations of one idea will drift.**

### 1. Deadline-with-automatic-resolution

A party holds something that belongs, by default, to someone else. The incentive is to hold it indefinitely. The unbounded state is the failure. **Every instance needs a deadline that resolves itself without anyone remembering.**

| Instance | Held thing | Auto-resolution |
|---|---|---|
| 19.01.02 D-01 | An inventory hold | Releases to public sale |
| 19.03.01 D-01 | A guest-list allocation | Returns to sale |
| 19.06.03 D-02 | A fan's money in an indefinite postponement | Converts to cancellation |

The third is the only one where inaction is *rewarded* — which is why the law had to intervene there and not in the other two.

### 2. Attribution, not prevention

Where a human must be able to say yes to something the system would rather forbid, the product's job is to record **who decided, when, and who bears it** — not to block.

| Instance | The thing that cannot be blocked |
|---|---|
| 19.03.03 D-01 | Door-time over-allocation comps |
| 19.04.01 D-05 | Operator override of a scan refusal |
| 19.04.02 D-01 | Reconciliation produces evidence, not repair |
| 19.05.05 D-03 | A *disputed* certified statement is a success, not a failure |
| 19.07.04 D-01 | A manually-typed count is attributable, not provable |

A system that blocks gets switched off by 8pm on night one, because the answer genuinely is sometimes yes. This is also the domain's clearest expression of the platform thesis (D-18): capture the fact at the moment it is true, with the parties present, or reconstruct it badly later.

### 3. Structural over detective

The cheapest and most effective controls have **no false positives**, because they remove the attacker's advantage rather than detect the attacker.

| Instance | Structural control | What it replaces |
|---|---|---|
| 19.02.04 D-01 | Randomise queue order at on-sale | Bot detection |
| 19.04.03 D-01 | Token re-entry keeps the ticket use-once | Losing the double-scan signal |
| 19.09.03 D-01 | Face-value exchange has no margin | Regulating a scalper's margin |

---

## Cross-Cut Mechanisms Discovered Here

> These serve many domains and are **not** nodes in 19. Recorded for the global CX file (`ideation-cx.md`) to absorb.

| Mechanism | Also serves | Why it is not owned here |
|---|---|---|
| **Payments, checkout & money rail** | 05, 13, 14, 19, 20 | Ticketing decides the number; the rail moves it |
| **Chargebacks & payment disputes** | 05, 13, 14, 19, 20 | The bank's process is identical whether the disputed item is a ticket, a guitar or a plugin. This domain contributes *evidence* (the scan record), not ownership |
| **Fraud & abuse detection engine** | 05, 13, 14, 19, 20, 24 | A stolen card is a stolen card. What is ticketing-specific is only the scarcity regime — BOTS Act, resale caps, transfer locks (19.09) |
| **Consent & preference management** | All | Capture, preference centre, withdrawal, DSAR, lawful basis. 19.10 owns only party-scoped event disclosure |
| **Age assurance** | 19, 20, 24, 03 | The identity/age-verification mechanism. 19.04.04 owns the physical refusal and its refund consequence |
| **Tax calculation & remittance** | 05, 13, 14, 19 | Computed rates are consumed by 19.01.03, not owned |
| **Notifications & alerts fan-out** | All | Announce, drops, reschedule notices and code delivery all ride it |
| **Attestation & counter-signature** | 02, 09, 17, 19 | **The important one.** 19.05.05 and 19.07.04 both need "a fact, attested by the party present, counter-signed by the counterparty, immutable thereafter" — which is exactly what credits (02) and rights (09) need. Three domains, one primitive. If they diverge, they will diverge badly |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 19.08 VIP Packages | 19.03 Guest List & Comps | Considered because both put a non-standard person through a door with a laminate. Rejected: a comp is inventory given away against an allocation, with a settlement consequence; a VIP package is a premium product sold at a markup. Opposite revenue signs, opposite money direction, different settlement lines. The laminate is a coincidence of stationery. |
| R-02 | 19.11 RSVP | 19.09 Fraud & Resale | Free events have no resale market, no scalping incentive and no money to defraud. The one plausible link — a leaked invite link filling a private event — is 19.02.03's shared-code trade-off, not a resale control. Applying the fraud apparatus to RSVP would import ceremony for zero risk. |
| R-03 | 19.10 Attendee Data | 19.04 Door Scanning | Tempting: the scan proves attendance, which is the strongest fan signal that exists, and attendance data is what 19.10 is about. Rejected because the scan record's use here is *evidence* (refund refusal, chargeback defence, capacity) rather than marketing data, and routing scan events into a consent-scoped marketing pipeline conflates a licensing/settlement artifact with a CRM one. The attendance→fanbase link belongs to domain 20 via 19.10's consented pipe, not directly from the door. **The closest of these rejections — worth re-examining at Step 5.** |
| R-04 | 19.02 On-Sale & Presale | 19.03 Guest List & Comps | Both carve inventory out of the manifest for a named party, and both are frequently deal terms — a strong structural resemblance. Rejected: a presale allocation is inventory *to be sold at full price to a gated audience*; a comp allocation is inventory *not to be sold at all*. Opposite revenue signs, different settlement lines. The resemblance is structural, not semantic. (Also recorded one level down at `19.03-guest-list-comps-cx.md#R-01`.) |
| R-05 | 19.12 Ticket Delivery & Wallet | 19.05 Counts & Drops | Considered because the wallet knows what a fan holds and the count knows what the room holds. Rejected: the wallet is a per-fan view of their own tickets; the count is a per-show aggregate of everyone's. No shared state beyond the ticket itself, no trigger dependency, independent lifecycles — a fan's wallet does not change when the count does. |
| R-06 | 19.01 Ticket Config | 19.04 Door Scanning | Considered because the door validates against the manifest that 19.01 defines. Rejected as a *direct* pair: the door reads a replica of the count's state (19.05.01), not the configuration. Scaling, fees and seat maps are invisible at the door — the scanner does not care what a ticket cost. The real path is 19.01 → 19.05 → 19.04, and modelling a direct link would suggest the door needs pricing data it must never have. |
