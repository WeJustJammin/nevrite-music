# Shard 19 — Performance reporting, money-in-flight and forecasting

**Status:** Complete
**Surface:** Web/PWA and scheduled reference-data jobs
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 19 owns live-performance PRO returns, cue-sheet expectations, curated distribution calendars, money-in-flight expectations and conservative royalty forecasts. It consumes immutable Shard 18 accounting facts; it never edits them, promises money, files another party's cue sheet, blends deterministic dates with statistical estimates or emits a forecast when evidence is too thin.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 4 |
| Child capabilities | 4 |
| Reporting | Live setlist→PRO return and cue-sheet expectation/chase |
| Timing | Society/territory/income-type distribution calendar and overdue tolerance |
| Forecasting | Registration-gated range with public calibration; silence on thin data |

## Features

- **10.06 Live Performance Setlist → PRO Reporting** — [ideation source](../ideation/10-royalties-collections/10.06-live-setlist-pro-reporting.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **10.07 Cue Sheets & Broadcast Performance Reporting** — [ideation source](../ideation/10-royalties-collections/10.07-cue-sheets-broadcast-reporting.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **10.09 Distribution Calendar & Money-in-Flight** — [ideation source](../ideation/10-royalties-collections/10.09-distribution-calendar-money-in-flight.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **10.10 Royalty Forecasting** — [ideation source](../ideation/10-royalties-collections/10.10-royalty-forecasting.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-RRF-01 — Performer reports completed show:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Load Shard 09/booking show and setlist; match registered works; explain covers/unmatched entries, and (6) return Draft return or honest no-route state; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-02 — Performer/operator submits PRO return:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve own membership/reporting role/territory; freeze return version and expected-by; prevent blind duplicate, and (6) return Submitted/manual task or typed block; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-03 — Performer amends setlist:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create superseding return against same show; retain prior filing and restart expected-by, and (6) return Amended version, never duplicate history loss; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-04 — Rights holder tracks cue sheet:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create expectation from licensed placement, production/territory and obligation evidence, and (6) return Expected, confirmed, missing or unverifiable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-05 — User chases missing cue sheet:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create off-platform task/contact evidence; platform never files for production, and (6) return Follow-up history and honest dead end; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-06 — Curator updates calendar:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Version body/territory/income type/usage period/distribution/tolerance with source provenance, and (6) return Reviewed active calendar version; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-07 — System projects money-in-flight:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Join registration state to applicable calendar; state body/period/due date and amount unknown, and (6) return Dated expectation, never fabricated amount; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-08 — Statement arrives:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Match Shard 18 source/period/right to expectation and mark arrival independent of expected amount, and (6) return Arrived/reconciled or unexplained arrival; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-09 — Expected distribution is late:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply versioned tolerance and counterparty-wide delay signal before finding, and (6) return Overdue observation, not automatic leakage accusation; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-10 — User requests forecast:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Verify registrations, rights stability, coverage and sufficient history; separate in-flight facts, and (6) return Range or explicit insufficient-data silence; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-11 — Model recalibrates:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compare immutable forecast version to actual Shard 18 outcomes; publish error/coverage, and (6) return Calibrated/stale/withdrawn version; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RRF-12 — Catalogue/rights change:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Invalidate affected forecast basis and recompute only when still eligible, and (6) return No stale confident chart; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Outcome |
|---|---|---|---|
| RRF-01 | Performer reports completed show | Load Shard 09/booking show and setlist; match registered works; explain covers/unmatched entries. | Draft return or honest no-route state. |
| RRF-02 | Performer/operator submits PRO return | Resolve own membership/reporting role/territory; freeze return version and expected-by; prevent blind duplicate. | Submitted/manual task or typed block. |
| RRF-03 | Performer amends setlist | Create superseding return against same show; retain prior filing and restart expected-by. | Amended version, never duplicate history loss. |
| RRF-04 | Rights holder tracks cue sheet | Create expectation from licensed placement, production/territory and obligation evidence. | Expected, confirmed, missing or unverifiable. |
| RRF-05 | User chases missing cue sheet | Create off-platform task/contact evidence; platform never files for production. | Follow-up history and honest dead end. |
| RRF-06 | Curator updates calendar | Version body/territory/income type/usage period/distribution/tolerance with source provenance. | Reviewed active calendar version. |
| RRF-07 | System projects money-in-flight | Join registration state to applicable calendar; state body/period/due date and amount unknown. | Dated expectation, never fabricated amount. |
| RRF-08 | Statement arrives | Match Shard 18 source/period/right to expectation and mark arrival independent of expected amount. | Arrived/reconciled or unexplained arrival. |
| RRF-09 | Expected distribution is late | Apply versioned tolerance and counterparty-wide delay signal before finding. | Overdue observation, not automatic leakage accusation. |
| RRF-10 | User requests forecast | Verify registrations, rights stability, coverage and sufficient history; separate in-flight facts. | Range or explicit insufficient-data silence. |
| RRF-11 | Model recalibrates | Compare immutable forecast version to actual Shard 18 outcomes; publish error/coverage. | Calibrated/stale/withdrawn version. |
| RRF-12 | Catalogue/rights change | Invalidate affected forecast basis and recompute only when still eligible. | No stale confident chart. |

## Contracts

| Contract | Rule |
|---|---|
| `CreateLiveReturn` | Show/setlist owned upstream; return uses reporter's own PRO membership and includes covers even when performer earns nothing. |
| `SubmitLiveReturn` | Versioned society delivery profile, reporter role, idempotency/sequence and expected-by; no guaranteed income. |
| `CreateCueSheetExpectation` | Placement/production/territory/obligation/expected evidence; platform observes/chases and never files. |
| `PublishDistributionCalendar` | Reviewed source, body, territory, income type, usage-period rule, distribution schedule, tolerance and effective version. |
| `ProjectMoneyInFlight` | Registration + calendar yields date/status only unless an independently sourced amount fact exists. |
| `EvaluateOverdueDistribution` | Late after explicit tolerance; late is not leakage, and unexpected arrivals remain valid. |
| `GenerateRoyaltyForecast` | Range/confidence/basis/coverage/model version only after minimum-evidence policy; in-flight rendered separately. |
| `CalibrateForecast` | Immutable forecast-versus-actual error by horizon/version; no retrospective model rewrite. |

### Types and Errors

`ReturnState = draft|submitted|amended|overdue|distributed|not_filed`; `CueSheetState = expected|confirmed|missing|unverifiable|collecting`; `InFlightState = scheduled|due|arrived|overdue|unknown`; `ForecastState = insufficient_data|active|stale|withdrawn|calibrated`.

Errors: `NOT_AUTHORIZED`, `MEMBERSHIP_REQUIRED`, `WORK_UNREGISTERED`, `RETURN_DUPLICATE`, `REPORTING_ROUTE_UNAVAILABLE`, `CALENDAR_UNKNOWN`, `EXPECTATION_NOT_DUE`, `REGISTRATION_REQUIRED`, `INSUFFICIENT_HISTORY`, `FORECAST_BASIS_STALE`.

## Data Models

| Model | Invariants |
|---|---|
| `live_performance_return` | Show, reporter/membership, territory, setlist version, society profile, sequence, expected-by and state. |
| `return_line` | Performed item→registered work match, cover/original status and unmatched reason; no earnings promise. |
| `cue_sheet_expectation` | Placement/production/territory/obligation, evidence state, chase tasks and lifecycle. |
| `distribution_calendar_version` | Body/territory/income type/usage-period mapping, schedule, tolerance, provenance/effective dates. |
| `money_in_flight_expectation` | Registration/calendar/work/right/period/due state; amount absent by default. |
| `forecast_eligibility` | Catalogue/registration/history/coverage checks and policy version. |
| `royalty_forecast_version` | Party/catalogue/horizon/range/confidence/basis/model/coverage and immutable created time. |
| `forecast_calibration` | Forecast version, actual accounting versions, error metrics and coverage. |

Shard 18 calculations/statements remain canonical. Calendar and forecast models are derived/read-only and cannot authorize payment, rights, registration or accounting mutations.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`live_performance_return`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Show, reporter/membership, territory, setlist version, society profile, sequence, expected-by and state..
- **`return_line`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Performed item→registered work match, cover/original status and unmatched reason; no earnings promise..
- **`cue_sheet_expectation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Placement/production/territory/obligation, evidence state, chase tasks and lifecycle..
- **`distribution_calendar_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Body/territory/income type/usage-period mapping, schedule, tolerance, provenance/effective dates..
- **`money_in_flight_expectation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Registration/calendar/work/right/period/due state; amount absent by default..
- **`forecast_eligibility`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Catalogue/registration/history/coverage checks and policy version..
- **`royalty_forecast_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party/catalogue/horizon/range/confidence/basis/model/coverage and immutable created time..
- **`forecast_calibration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Forecast version, actual accounting versions, error metrics and coverage..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Performer/reporter | Own show return, membership route, status and amendments | Another act's return or guaranteed payout claim |
| Venue/operator | Returns only where territory/reporting role explicitly permits | Performer membership impersonation |
| Rights holder/admin | Mandate-scoped cue expectations, in-flight and forecasts | Production-side filing authority without mandate |
| Calendar curator | Source review, candidate version and correction | Silent activation, accounting edits |
| Finance/support | Scoped expectation/forecast diagnostics | Model manipulation, payout action, unrelated catalogue |
| Service principal | One schedule/projection/calibration job | Interactive or accounting authority |

### Access Escalation

- **Performer/reporter:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Venue/operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Rights holder/admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Calendar curator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Finance/support:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Setlist matching, return status, calendar, in-flight, forecast and calibration views are keyboard operable with visible focus and persistent text states.
- Dates always include timezone/period context; ranges expose lower/upper/confidence/basis in text.
- Known dates, unknown amounts, estimates, actuals, overdue and unverifiable states never rely on color alone.
- Charts have equivalent tables; insufficient data renders explanation rather than an empty misleading axis.
- Submission/amendment jobs preserve input and announce terminal state without time-limited-only feedback.

## Event Schemas

| Event | Safe payload | Consumers |
|---|---|---|
| `royalty.live-return.changed.v1` | Return/show/society/state/version | Tasks/registration reporting |
| `royalty.cue-sheet-expectation.changed.v1` | Expectation/placement/territory/state/version | Tasks/leakage |
| `royalty.distribution-calendar.changed.v1` | Calendar/body/territory/income/state/version | In-flight projector |
| `royalty.money-in-flight.changed.v1` | Expectation/right/period/due-state/version | Dashboard/leakage |
| `royalty.forecast.changed.v1` | Forecast/horizon/state/coverage class/version | Dashboard |
| `royalty.forecast-calibrated.v1` | Forecast/calibration/error class/version | Transparency/eligibility |

Events exclude amounts, society/member IDs, setlists, productions, model features, private catalogue details and accounting lines.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Cover song | File writer's work correctly; explain performer may earn nothing. |
| Unregistered original | Preserve setlist; omit return line and create registration/leakage action. |
| Venue and performer may both report | Reporter-role/sequence checks prevent platform blind duplicate; society remains final deduper. |
| Cue sheet cannot be verified | `unverifiable`, never assumed filed/missing. |
| Production is defunct/no contact | Honest dead end and retained expectation, no fake escalation. |
| Calendar changes | New version affects future projection; prior expectation retains source version and correction history. |
| Distribution slips market-wide | Tolerance/delay signal prevents premature leakage label. |
| Unexpected statement arrives | Reconcile normally; calendar is not an income gate. |
| Thin/lumpy history | No forecast; in-flight facts remain separate. |
| One-off sync distorts history | Exclude/robustly model with disclosed basis; never silently establish baseline. |
| Rights/registration changes | Mark forecast stale/withdrawn before recompute. |
| Forecast used as guaranteed cash | UI/API labels range, basis and calibration; no payable/payout contract accepts forecast. |

## Dependency References

- **Depends on:** [[specs/ia/18-royalty-accounting|Shard 18]] for accounting actuals/coverage; [[specs/ia/10-rights-ownership|Shard 10]] for works/registrations/rights; [[specs/ia/09-projects-collaboration|Shard 09]] for show/setlist/placement records; [[specs/ia/00-infrastructure|Shard 00]] for schedules/settings/jobs/audit.
- **Depended on by:** leakage, analytics and career planning consume labelled expectations/ranges only.
- **Deep dive:** [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Reporting and forecasting deep dive]].

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| RRF-01 Performer reports completed show | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-02 Performer/operator submits PRO return | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-03 Performer amends setlist | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-04 Rights holder tracks cue sheet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-05 User chases missing cue sheet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-06 Curator updates calendar | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-07 System projects money-in-flight | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-08 Statement arrives | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-09 Expected distribution is late | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-10 User requests forecast | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-11 Model recalibrates | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RRF-12 Catalogue/rights change | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 18:** consume [Shard 18 Contracts](18-royalty-accounting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 18 Event Schemas](18-royalty-accounting.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 10:** consume [Shard 10 Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 09:** consume [Shard 09 Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Locked performance reporting, cue expectations, curated calendars and conservative calibrated forecasts | `/write-architecture-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
