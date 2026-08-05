# Decision Queue Draft 04 — Live Booking and Fan Alerts

> **Status:** DRAFT — UNRATIFIED. This queue identifies owner decisions and one architecture contract. It does not amend a source specification, select policy, or close a ledger finding.
>
> **Ledger scope:** Every non-fixed finding from `r-73` through `r-79`, and no other finding. `r-73[0]` is verified-fixed, so it has no queue entry.
>
> **Merge check:** No entries are merged. The two `r-75` rows concern different policies (approval-rule selection vs expiry/exception handling); every other row concerns a distinct policy or architecture contract.

## DQ-04.01 — Availability under a soft hold

- **Affected ledger rows:** `r-74[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** Should a date remain presented as available while it has one or more soft holds?

| Option | Pros | Cons |
|---|---|---|
| A. Keep it available without a hold indicator | Preserves the ordinary industry meaning of a soft hold and leaves rooms sellable. | Prospective counterparties cannot judge contention before entering the booking flow. |
| B. Keep it available and disclose only an aggregate hold state | Preserves sellability while making contention legible without exposing counterparties. | The aggregate may discourage legitimate enquiries despite no booking being confirmed. |
| C. Remove it from availability at the first hold | Simple interpretation for observers and prevents additional contention. | Converts a soft hold into an exclusive reservation and contradicts the multi-position ladder model. |

**UNRATIFIED recommendation:** Option B — preserve the source's soft-hold semantics while exposing only the minimum contention signal needed for an informed booking choice.

- **Current interim rule:** A hold does not remove the avail; the room/date remains sellable until confirmation. Do not invent a public, named-counterparty, or exclusive-reservation outcome.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01-availability-holds-confirmation-cx.md` — CX-01: a hold attaches to an avail but does not remove it; avails stay sellable under a hold ladder.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.02-hold-ladder-priority.md` — D-13: no cap on concurrent holds; only multiplicity, never identities, is disclosed to the Operator.

## DQ-04.02 — Default offer approval rule

- **Affected ledger rows:** `r-75[0]`
- **Preserved classification:** blocking / unresolved-decision → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** What default approval rule should a newly created band use for an offer?

| Option | Pros | Cons |
|---|---|---|
| A. Unanimous member approval | Maximizes member protection for binding commercial commitments. | A missing member can deadlock a time-limited offer. |
| B. Simple majority approval | Keeps a band able to respond within normal offer windows. | Can bind a dissenting or absent member. |
| C. Delegated authority approval | Fastest for working bands with an established manager or agent. | Delegation may be absent, stale, or broader than members intended. |
| D. Require explicit setup before any offer can proceed | Avoids imposing a governance rule the band never accepted. | Creates onboarding friction and delays the first offer. |

**UNRATIFIED recommendation:** Option D — do not silently select governance for a new band; require an explicit rule before the first binding offer, then apply the configured rule.

- **Current interim rule:** The approval primitive remains one configurable chain; no onboarding default is assumed and no offer is treated as approved without the applicable rule.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — D-06: one approval primitive with a pluggable entity-governance or spend-threshold rule.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — Q-01: unanimous deadlocks under a 48-hour clock; majority or delegation can bind members who never agreed.

## DQ-04.03 — Offer expiry during approval

- **Affected ledger rows:** `r-75[1]`
- **Preserved classification:** blocking / ambiguous-behavior → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** What happens when an offer expires before its required approvals complete?

| Option | Pros | Cons |
|---|---|---|
| A. Hard expiry | Gives the counterparty a deterministic release time and prevents approval-chain stalling. | Penalizes otherwise valid approvals delayed by ordinary band coordination. |
| B. One fixed grace window | Absorbs small coordination delays while bounding the hold on the counterparty. | Creates a new timing edge and may be exploited at the deadline. |
| C. Configurable grace window per offer | Lets parties match treatment to deal importance and context. | Adds negotiation friction and makes outcome predictability weaker. |
| D. Counterparty must explicitly extend | Preserves counterparty control and leaves no implicit extension. | Requires a live response exactly when the approval process is already delayed. |

**UNRATIFIED recommendation:** Option D — preserve the stated expiry unless the counterparty affirmatively extends it; this avoids an automatic exception becoming a stalling mechanism.

- **Current interim rule:** No expiry outcome is selected. Preserve the offer and recorded approvals for audit, but do not mark it accepted, expired, extended, or releasable until the owner chooses one option; downstream settlement and inventory effects remain blocked rather than inferred.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — edge case: expiry mid-approval is explicitly pending as a grace-window versus hard-stop product decision.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.02-offers-negotiation/17.02.03-offer-approval-chain.md` — Q-02: a grace protects slow bands but is an obvious stalling vector.

## DQ-04.04 — Reconciliation conflict outcome

- **Affected ledger rows:** `r-76[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** When competing box-office evidence produces conflicting counts, what outcome should govern settlement?

| Option | Pros | Cons |
|---|---|---|
| A. Highest provenance evidence controls automatically | Delivers a fast, reproducible settlement outcome. | A provenance hierarchy can still be wrong in a specific event and gives the losing party little recourse. |
| B. Keep the count provisional and settle only undisputed portions | Limits harm to the disputed economic exposure. | Produces partial settlement and requires parties to manage a later amendment. |
| C. Freeze every settlement until parties resolve the conflict | Avoids disbursing against a count either party contests. | Withholds money from parties whose deals have no stake in the disputed line. |
| D. Platform adjudicates the disputed count | Produces a final outcome in one system. | Makes the platform a commercial fact-finder without independent ground truth. |

**UNRATIFIED recommendation:** Option B — preserve evidence and versioning, settle undisputed exposure, and leave the contested economic outcome open to the parties' recorded resolution path.

- **Current interim rule:** Show each decomposed count and its provenance; price failed invariants against the deal; do not silently select a winner or overwrite a contested count. A dispute affects only the contesting act's sheet unless policy later changes that boundary.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — D-01: reconciliation is several numbers, never one attendance field.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — D-13 through D-15: corrections fan out; a dispute freezes only the contesting act's sheet; a failed invariant is named, attributed, and priced content.

## DQ-04.05 — Verified-draw count definition

- **Affected ledger rows:** `r-77[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** Which attendance count should a verified draw record publish?

| Option | Pros | Cons |
|---|---|---|
| A. `scanned_paid` only | Prevents comp-heavy or papered houses from inflating a commercial draw signal. | Understates total people physically present at a show. |
| B. `scanned_total` only | Measures physical attendance with one easy-to-explain number. | Lets comps manufacture a stronger apparent draw history. |
| C. Publish both, with one explicitly designated as verified draw | Retains both facts and makes the commercial definition explicit. | Adds information density and still requires choosing the designated count. |

**UNRATIFIED recommendation:** Option C, with `scanned_paid` designated as the verified-draw metric — retain `scanned_total` as a separately labelled attendance fact rather than erasing it.

- **Current interim rule:** A signed settlement is required before a draw record exists, but no implementation may silently derive the verified-draw number from either total scan or paid scan while the contradiction remains unratified.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11.01-verified-draw-record.md` — D-01: only signed settlements emit records; the feature treats draw as an attendance fact per show.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — D-08: `sold`, `scanned_paid`, and `scanned_total` are distinct counts.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09.02-box-office-count-reconciliation.md` — Q-03: consuming total scan permits a papered house to manufacture verified draw history; sibling-file contradiction remains unresolved.

## DQ-04.06 — Ladder concurrency and hold-consistency contract

- **Affected ledger rows:** `r-78[0]`
- **Preserved classification:** blocking / unresolved-concurrency → needs-architecture-decision
- **Decision owner / stage:** Architecture owner; `/create-prd-architecture`

**Question:** What consistency contract should govern concurrent changes to one hold ladder?

| Option | Pros | Cons |
|---|---|---|
| A. Optimistic version check with reject-and-reoffer | Preserves a single server-authoritative order without silent demotion or last-write-wins loss. | Clients must handle rejected writes and retry against the current ladder. |
| B. Per-ladder serialized command queue | Gives callers an ordered result without retry logic. | Adds queue availability and latency concerns to time-sensitive booking work. |
| C. Pessimistic edit lock | Prevents concurrent submissions while one booker edits. | A disconnected or abandoned lock can block the room's inventory. |
| D. Last write wins | Simple to implement. | Can silently demote a live party and violates the ladder's stated accountability guarantees. |

**UNRATIFIED recommendation:** Option A — version each ladder, assign positions on the server, reject stale writes, and re-offer the action against the authoritative current shape.

- **Current interim rule:** Server receipt time breaks position ties; the second concurrent write is rejected rather than merged or applied last-write-wins; offline actions remain pending until server acceptance. This is an interim behavior description, not a ratified architecture contract.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.02-hold-ladder-priority.md` — concurrent request and multi-booker edge cases: server-assigned monotonic positions; optimistic concurrency; reject and re-offer stale writes.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.02-hold-ladder-priority.md` — not-product boundary: optimistic-concurrency versioning is routed to `/create-prd-architecture`.

## DQ-04.07 — Gig-alert eligibility

- **Affected ledger rows:** `r-79[0]`
- **Preserved classification:** blocking / contradiction → needs-product-decision
- **Decision owner / stage:** Product owner; `/ideate-validate`

**Question:** Which shows should make a fan eligible for a gig alert?

| Option | Pros | Cons |
|---|---|---|
| A. Confirmed first-party shows only | Keeps event facts accurate and alert timing tied to on-sale inventory the platform can observe. | Fans receive no notice for an artist's external shows and may perceive the product as incomplete. |
| B. First-party shows plus verified partner listings | Expands coverage while retaining a quality threshold. | Requires a partner-verification policy and produces different coverage by market. |
| C. All third-party listings | Maximizes apparent comprehensiveness. | Ingested data can be stale, duplicated, cancelled, or not actually on sale; trust in alerts erodes. |

**UNRATIFIED recommendation:** Option B — keep on-sale as the action point and add only source-qualified external listings, with clear source attribution and cancellation handling.

- **Current interim rule:** For first-party events, issue one event-keyed alert at on-sale rather than announcement; dedupe by event; disclose the no-location partial state; do not invent third-party show eligibility. A fan demand request converting to a show may route to the domain-20 alert, but its broader eligibility policy remains unratified.
- **Exact sources:**
  - `.memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.02-gig-alerts-near-me.md` — D-01: alert at on-sale, not announcement; D-02: dedupe by event; D-03: surface the no-location partial state; Q-02: whether to alert on shows not booked on WeJammin remains owner-open.
  - `.memory/wiki/specs/ideation/20-fanbase-direct-to-fan/20.07-fan-demand-show-requests.md` — converted state: when a show is announced in a requested market, requesting fans are notified through domain 20's alert.
  - `.memory/wiki/specs/ideation/17-live-booking-settlement/17.01-availability-holds-confirmation/17.01.04-confirmation-announce-gate.md` — confirmation and announce are distinct gates; show announcement alone is not the fan-alert trigger.

## Exact Coverage Mapping

| Ledger row in requested range | Ledger disposition | Queue treatment |
|---|---|---|
| `r-73[0]` | verified-fixed | Excluded: fixed row; no decision or interim-replacement entry required. |
| `r-74[0]` | needs-product-decision | DQ-04.01 |
| `r-75[0]` | needs-product-decision | DQ-04.02 |
| `r-75[1]` | needs-product-decision | DQ-04.03 |
| `r-76[0]` | needs-product-decision | DQ-04.04 |
| `r-77[0]` | needs-product-decision | DQ-04.05 |
| `r-78[0]` | needs-architecture-decision | DQ-04.06 |
| `r-79[0]` | needs-product-decision | DQ-04.07 |

**Coverage assertion:** Non-fixed rows covered exactly once: `r-74[0]`, `r-75[0]`, `r-75[1]`, `r-76[0]`, `r-77[0]`, `r-78[0]`, `r-79[0]`. No fixed row, source-spec change, or out-of-range ledger row receives a decision entry.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
