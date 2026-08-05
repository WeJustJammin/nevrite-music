# Propagation Batch 6 — Scene Feed Boundary

> **Date**: 2026-08-02
> **Status**: Applied
> **Authority**: User delegated full decision autonomy until ideation completes
> **Decision**: D-81

## Decision

Scene membership supplies candidacy for a member's own feed only. It must never alter rank. Rank uses
only graph proximity, geography, event class, recency, and reader controls. A displayed “in your scene”
reason explains geographic candidacy and must not imply a participation boost.

## Applied Sources

| Source | Applied change |
|---|---|
| [03.02.02 Ranking, Relevance & Feed Controls](../ideation/03-community-networking/03.02-activity-feed-ranking/03.02.02-ranking-relevance-controls.md) | Added the scorer invariant, explicit happy path, non-stale control behavior, and D-06. |
| [03.06.01 Scene Definition & Membership](../ideation/03-community-networking/03.06-scenes-communities/03.06.01-scene-definition-membership.md) | Resolved Q-07 against D-08 and 03.02.02 D-06. |
| [Ideation Index](../ideation/ideation-index.md) | Recorded global D-81. |

## Verification

- No membership term, boost, or tie-breaker may enter the scorer.
- Scene membership remains reversible and inert for all authority, density, stewardship, and rank.
- Materialized feeds apply reader controls before rendering, so a control change cannot expose stale content.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-81|D-81]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-08|D-08]]
