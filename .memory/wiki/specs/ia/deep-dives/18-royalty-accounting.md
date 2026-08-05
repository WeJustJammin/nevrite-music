# Deep Dive 18 — Royalty accounting

**Status:** Complete
**Parent:** [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]

## Scope

This deep dive owns custody-safe ingestion, deterministic adapters, identity mapping, exact bitemporal calculations, restatement lineage, statement traceability, recovery evidence and the B3 money-movement boundary.

## Deepening Record

| Pass | Converged result |
|---|---|
| Cross-section consistency | Original, parse, mapping, parameter set, calculation, statement and payout state are independently versioned. |
| What-if expansion | Duplicate/restatement, parser drift, missing oracle/period/FX/terms, mapping reversal, dispute race and unpayable party have terminal behavior. |
| Adversarial pass | Silent dropped lines, probabilistic money, float arithmetic, assumed contracts, hidden residuals, balance seizure and premature escrow fail closed. |
| Convergence | Reporting is downstream; payout execution remains a disabled adapter rather than weakening accounting semantics. |

## Ingestion and Parsing Algorithm

1. Resolve authenticated actor, payee party/reporting mandate and versioned source registry.
2. Verify transfer completion, byte length/checksum, custody (`upload`, DKIM-witnessed forward, platform fetch) and immutable private object before ingest.
3. Same checksum for same counterparty/payee is certain duplicate. Different bytes continue until parsed comparison determines new statement versus restatement.
4. Select adapter using declared source plus in-file fingerprint and statement-date effective version. Mismatch blocks; content sniffing never guesses.
5. Adapter runs deterministically without clock, locale, live FX or LLM. Every row becomes normalized or named unparseable classification.
6. Capture every printed total and declare the one the line set reconciles to.
7. Structural reconciliation requires every row classified. Monetary reconciliation sums exact source-currency values using `0.5×10^-q + n×0.5×10^-p`.
8. No stated total yields `unoracled`; failed checks block matching/calculation and age as money-sized alarms.
9. Additive format drift creates review even when totals reconcile. Original and prior adapter output remain immutable.

## Identity Mapping and Exception Algorithm

1. Collapse repeated lines to source identity; this is the unit of candidate, decision and future replay.
2. Apply exact identifiers then source proprietary codes, party/legal-name signals and finally fuzzy evidence.
3. Exact scoped prior mapping replays deterministically. A fuzzy candidate requires at least two independent signal classes.
4. No probability threshold auto-confirms. Title-only goes to exception queue with value.
5. Human confirmation/rejection records actor, evidence, catalogue/source scope and version. Mapping is not ownership.
6. Future value an order of magnitude above mapping baseline re-enters review while retaining historical attribution until changed.
7. Reversal preserves rejection/history and creates restatement manifest for every attributed line.
8. Queue ranks open amount, expiry/correction window and age. It stores closed outcomes forever and never applies a materiality drop.
9. Catalogue/right updates re-sweep but never override a human decision; contradictions show both facts once.
10. Every platform total carries source coverage and unattributed residual.

## Normalization and Calculation Algorithm

1. Preserve original amount/currency/precision and source FX/deductions exactly.
2. Keep usage, distribution, receipt and payout dates distinct. Missing usable period is exception unless a bounded window proves one split version.
3. Allocate source currency before conversion. Usage spans split versions only at the finest source-supplied sub-period; overlapping works require Shard 10 exact weights.
4. Pin reporting FX at use with rate date/provider/method. No rate on/before date within seven days leaves source-native result/residual.
5. Resolve parameter set bitemporally: recording→work allocation, right type, territory, source, split, entities and authored deal terms as of usage and knowledge time.
6. `no deal` may yield raw split; `known deal, terms missing` yields no amount. Contradictory/unrepresentable terms hold calculation.
7. Refuse entity cycles, self-referential arithmetic, rates outside bounds and parts above whole.
8. Compute exact decimal at ≥9 dp with pinned engine version. Itemize deductions; never net or round in engine.
9. Parts below whole create visible residual routed to exceptions/rights. Nothing redistributes it.
10. Future payable aggregate rounds once by largest remainder and stable tie key only after B3 enables provider payout.

## Recoupment, Restatement and Statement Algorithm

1. Earnings calculation stays separate from recoupment/payability.
2. Advance/recoupable amount, application order, reserve timing and cross-collateral scope are explicit terms. Missing advance means unknown position.
3. Any source correction, mapping reversal, rights/allocation/term change creates a new restatement, never overwrite.
4. Restatement traverses calculation→recoupment→payee statement→future payout references and records cause/delta at every edge.
5. A disputed scope absorbs new versions and shows changed amount/cause; stale dispute resolution cannot win a race.
6. Payee statement freezes display rates and states `earned`, `deducted`, `applied`, `payable`, `paid` separately.
7. Zero-paid and broken-chain statements still issue. Aggregate defaults but drill-through reaches source/session until the first honest break.
8. Coverage and open/unattributed/held residuals appear on every applicable view and export.

## B3 Payout and Escrow Gate

1. Current state is calculation/reporting only. `ExecuteRoyaltyPayout` always returns `PAYOUT_DISABLED_B3`.
2. Calculated balances are liabilities/derived positions, not represented as WeJammin-held funds, escrow, wallet deposits or guaranteed money.
3. A future `/evolve-feature` requires counsel, Stripe/provider, KYC/AML, tax, money-transmission, ledger, hold, refund, insolvency and reconciliation contracts.
4. Activation must preserve one transfer per payee/run, provider finality, failed-transfer return to payable, idempotent interruptible run and statement-before-transfer.
5. Disputed amount scope may be marked held in calculation, but no party or admin can release provider escrow because none exists pre-B3.
6. No threshold, dormancy, erasure or account closure turns a balance into platform revenue, float, forfeiture or redistribution.

## Registration and Recovery Algorithm

1. Affiliation identity is body/territory/role/identifier/status/dates. Conflicts block only affected payload.
2. Payload projects Shard 10/09 truth; local readiness means no visible rejection reason, never acceptance guarantee.
3. Society profile versions dialect/channel/cadence/turnaround as data; submission is sequence-aware and expected-by.
4. Acknowledgement/rejection creates per-work/society/territory belief with age, translated action/owner or explicit untranslatable state.
5. Silence after expected-by becomes an event/alarm. Rights conflict routes to Shard 10, not rejection.
6. Recovery search is mandate-bounded and evidence-bearing. It says candidate count, not promised money.
7. Self-asserted credit alone cannot rank a claim. Claim submission has evidence cost, expected-by and manual handoff where no API exists.
8. Dismissed candidates persist across re-sweeps; platform-caused leakage is attributed to the platform.

## Abuse and Recovery Verification

| Failure or abuse | Required proof |
|---|---|
| Statement tampering | Immutable original checksum/custody and parse input hash. |
| Parser silently drops lines | Structural classification count and source-total reconciliation. |
| Fuzzy match moves money | Contract test proves only confirmed mapping enters calculation. |
| FX rewrites history | Pinned rate/method and reversal inheriting original rate. |
| Deal term invented | Authored closed taxonomy or explicit incomplete/held state. |
| Float/rounding leakage | Exact decimal properties and largest-remainder conservation tests. |
| Restatement erases prior result | Immutable version/cause/dependency/delta lineage. |
| Multi-party file leaks data | Holder-only document policy and no cross-uploader aggregation. |
| Disabled payout invoked | B3 feature/runtime/database gate denies before provider side effect. |
| Unpayable balance seized | State-machine test excludes revenue/forfeit/redistribute transitions. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Immutable objects, imports/jobs, deterministic settings, audit/outbox and future provider reconciliation. |
| Shard 01 | Party/payee identity, reporting mandate and authority. |
| Shard 02 | Society identifiers, external evidence and credit provenance. |
| Shard 06 | Dispute workflow, protected evidence and access review. |
| Shard 10 | Works, recordings, rights, splits, exact multi-work allocation and title conflicts. |
| Shard 19 | Read-only accounting versions, coverage and residuals for reporting/forecasting. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [18-royalty-accounting § Contracts](../18-royalty-accounting.md#contracts) defines commands/queries and [18-royalty-accounting § Event Schemas](../18-royalty-accounting.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened ingest, mapping, exact calculation, restatement, statements, recovery and B3 payout boundary | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/2026-08-02-architecture-design|Architecture design]]
- [[specs/data-placement-strategy|Data placement strategy]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
