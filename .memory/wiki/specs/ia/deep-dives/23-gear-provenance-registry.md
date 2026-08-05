# Deep Dive 23 — Gear identity, provenance and recovery

**Status:** Complete
**Parent:** [[specs/ia/23-gear-provenance-registry|Shard 23]]

## Scope

This deep dive owns composite identity, evidence-weighted claims, transfer/theft screening, brokered recovery, component continuity and private valuation evidence.

## Deepening Record

| Pass | Result |
|---|---|
| Consistency | Gear record, identifiers, claims, custody, transfer, flags and service facts remain independently versioned. |
| What-if | Missing object, serial correction/replacement, duplicate records, silent prior owner, contested flag and sparse comps terminate honestly. |
| Adversarial | Mint-as-title, partial-key flag hits, public sightings, owner-suspect framing, appraisal substitution and discography leakage fail closed. |

## Identity and Claim Algorithm

1. Registrant chooses entity context and intent (`owned`, `held`, `observed`); no default when multiple entities are controlled.
2. Resolve composite identity from manufacturer/model/serial and required secondary/location facts. No-object mint is valid; unresolved key is not.
3. Create record without title assertion. Flag match appends protected notice but does not suppress evidence.
4. Corrections classify typo versus physical identifier/component change. Free edit exists only before external reliance.
5. Claim evidence creates attributable version; tier is maximum current standing evidence and may recompute downward.
6. Prior-owner silence is neutral. Conflicts create contest; platform exposes evidence/state but does not adjudicate title.
7. Duplicate key retains both records and requires mutual consent/reviewer policy for merge; merge never deletes chain.
8. Chain is a projection over immutable facts and always states its proof limits.

## Transfer, Theft and Recovery Algorithm

1. Marketplace settlement or manual handshake creates pending transfer with full composite key/version.
2. Screen at point of transfer. Partial key is not-screenable and never queries flag matcher.
3. Dependency failure returns cannot-check and blocks; active flag blocks/routes case; disputed flag is labelled disputed.
4. Successful transfer appends from/to/custody/source evidence. Reversal is compensating event.
5. Theft flag may cover case/rig/items and does not require police reference; reference strengthens evidence.
6. System lifecycle applies staleness, contest/withdrawal/recovery while retaining every transition.
7. Sighting collects minimum protected time/location/evidence, moderates abuse and brokers communication.
8. Possessor is addressed as possible victim; no direct identities/contact or confrontation workflow.

## Service, Value and Discography Algorithm

1. Completed service work order or owner manual declaration creates append-only event and component facts.
2. Originality is component-level; absence of modification/service facts proves nothing.
3. Estimate normalizes exact configuration/condition/market/time and requires governed comp floor. Range shows sample/recency.
4. Modification invalidates/reviews prior estimate; no silent revaluation.
5. Appraisal pins appraiser, exact gear snapshot, effective/expiry and document; owner-private and distinct from estimate.
6. Claim pack assembles selected evidence/checksums/gaps; platform does not transmit or assert insurance coverage.
7. Producer-attested gear use binds eligible credit/session. Correction/visibility/status comes only through Shard 02 credit lifecycle.

## Abuse and Recovery Verification

| Risk | Proof |
|---|---|
| Record minted as ownership | Intent/title separation tests and UI disclosure. |
| Partial serial triggers accusation | Matcher inaccessible without full composite key. |
| Duplicate records auto-merge | No automatic merge transition; consent/review required. |
| Screening outage silently passes | Cannot-check terminal result blocks transfer. |
| Disputed flag renders stolen | Projection tests use disputed at every surface. |
| Sighting exposes location | Public/party schemas omit protected coordinates/contact. |
| Estimate substitutes appraisal | Distinct types/projections and no overwrite transition. |
| Hidden credit leaks gear use | Link projection inherits credit visibility/status exactly. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Private evidence, jobs, settings, audit/outbox and bounded lookup. |
| Shard 01 | Person/entity/acting context and brokered communication identity. |
| Shard 02 | Credit evidence, status, visibility and correction. |
| Shard 06 | Theft/false-flag/sighting/merge cases and protected evidence. |
| Shard 14 | Marketplace transfer and service work-order facts. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [23-gear-provenance-registry § Contracts](../23-gear-provenance-registry.md#contracts) defines commands/queries and [23-gear-provenance-registry § Event Schemas](../23-gear-provenance-registry.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened gear identity, title limits, screening, recovery, continuity and private evidence | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/23-gear-provenance-registry|Shard 23]]
- [[specs/2026-08-02-architecture-design|Architecture design]]
- [[specs/data-placement-strategy|Data placement strategy]]
- [[specs/ia/14-services-marketplace|Shard 14]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
