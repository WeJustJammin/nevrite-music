# Deep Dive 19 — Royalty reporting and forecasting

**Status:** Complete
**Parent:** [[specs/ia/19-royalty-reporting-forecasting|Shard 19]]

## Scope

This deep dive owns reporter authority, expectation clocks, calendar provenance, forecast eligibility and uncertainty disclosure.

## Deepening Record

| Pass | Result |
|---|---|
| Consistency | Returns, expectations, actuals and forecasts remain separately versioned. |
| What-if | Covers, amendments, unverifiable cues, calendar slips, thin/lumpy data and rights changes terminate honestly. |
| Adversarial | Duplicate filing, invented amounts, guaranteed forecasts and hidden model error fail closed. |

## Reporting Algorithm

1. A completed show provides act/date/venue/territory and immutable setlist version; manual shows are explicitly lower-provenance.
2. Match items to registered works through Shard 18 mappings. Covers remain reportable; unmatched originals route to registration.
3. Resolve reporter's own membership or authorized operator role. The platform never borrows accreditation.
4. Freeze society profile, return version, sequence and expected-by. Amendments supersede and restart the clock.
5. Silence past expected-by becomes overdue belief, not rejection. Observed distribution links to Shard 18 actual.
6. Cue-sheet expectation arises from placement/licence term. Platform records confirmation evidence/chases but never files for production.
7. Per-territory unverifiability is first-class and never collapsed to missing or confirmed.

## Calendar and In-Flight Algorithm

1. Curator candidate records body/territory/income type, usage-period mapping, schedule, tolerance, source and effective dates.
2. Review activates immutable version; corrections supersede and identify affected expectations.
3. Eligible registration plus calendar creates dated expectation with amount absent.
4. Arriving statement satisfies by source/right/period evidence even if unpredicted.
5. Due date plus tolerance and counterparty-wide delay signal determines overdue. Late never automatically means leakage.
6. Unknown calendar or unregistered work renders honest absence/finding, not default cadence.

## Forecast Algorithm

1. Separate deterministic in-flight expectations before model eligibility.
2. Require versioned minimum history/coverage, active registration and stable rights basis. Policy values are governed settings.
3. Remove/robustly isolate disclosed one-off events; do not silently smooth lumpy creator income into certainty.
4. Emit lower/upper range, confidence/basis, coverage, horizon, model/version and generated time—or no forecast.
5. Rights/catalogue/registration changes mark stale before any recompute.
6. Actual Shard 18 versions calibrate immutable forecast and expose error. Model replacement does not rewrite old forecasts.
7. Forecast cannot feed payable balance, payout, credit decision or guaranteed-income language.

## Abuse and Recovery Verification

| Risk | Proof |
|---|---|
| Duplicate return | Show/reporter/society/sequence uniqueness and supersession tests. |
| Invented in-flight amount | Schema amount is absent unless independent source fact exists. |
| Cue status fabricated | Evidence basis required; unverifiable state tested. |
| Calendar silently edited | Immutable version/provenance and affected-expectation manifest. |
| Thin data chart | Eligibility denies and API returns explicit insufficient history. |
| Forecast presented as fact | Projection/contract separates ranges from actual/in-flight. |
| Model hides misses | Calibration binds immutable actual/forecast versions. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Schedules, governed settings, jobs, audit and notifications. |
| Shard 09 | Show/setlist and placement source records. |
| Shard 10 | Work registration, rights and territory truth. |
| Shard 18 | Statement actuals, mappings, coverage and accounting versions. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [19-royalty-reporting-forecasting § Contracts](../19-royalty-reporting-forecasting.md#contracts) defines commands/queries and [19-royalty-reporting-forecasting § Event Schemas](../19-royalty-reporting-forecasting.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened reporting authority, expectation clocks, calendar provenance and forecast uncertainty | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/19-royalty-reporting-forecasting|Shard 19]]
- [[specs/ia/18-royalty-accounting|Shard 18]]
- [[specs/2026-08-02-architecture-design|Architecture design]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
