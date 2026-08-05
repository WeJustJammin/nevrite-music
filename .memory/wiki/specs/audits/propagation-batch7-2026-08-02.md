# Propagation Batch 7 — Entitlement Payment-Failure Recovery

> **Date**: 2026-08-02
> **Status**: Applied
> **Authority**: User delegated full decision autonomy until ideation completes
> **Decision**: D-82

## Decision

An entitlement is uniquely keyed by `(product, holder)` across all lifecycle states. A failed
payment leaves the existing record non-granting. A retry or new purchase serialises on that record;
only a fresh confirmed capture may append an acquisition epoch and current terms snapshot before the
record becomes `active`. Concurrent attempts cannot create a duplicate entitlement.

## Applied Sources

| Source | Applied change |
|---|---|
| [14.02.01 Licence Issuance & Entitlement Record](../ideation/14-digital-goods-marketplace/14.02-licensing-activation-entitlement/14.02.01-licence-issuance-entitlement-record.md) | Defined state-independent singleton scope, capture-gated recovery, concurrency behavior, lifecycle transition, and D-14. |
| [Ideation Index](../ideation/ideation-index.md) | Recorded global D-82. |

## Verification

- A `payment-failed` record cannot grant access.
- At most one payment attempt exists for a `(product, holder)` record at a time.
- `active` follows a fresh confirmed capture plus recorded acquisition epoch and terms snapshot.
- Retries, re-purchases, and concurrent checkouts cannot mint a second entitlement.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-82|D-82]]
- [[decisions.md#d-14|D-14]]
