# Architecture Ambiguity Audit — Engineering Standards

- **Document:** `.memory/wiki/specs/ENGINEERING-STANDARDS.md`
- **Graph source:** [[specs/ENGINEERING-STANDARDS]]
- **Processed counter after report:** 2/2
- **Audit mode:** fresh independent implementer simulation
- **Pre-remediation score:** 2.5 ambiguity points / 3 checkpoints = **83.3%**

## Implementer Simulation

| Path | Forced decisions and observed divergence |
|---|---|
| Happy path | A capable team can apply the quality gates but must invent the release-load profile, representative dataset, and true recovery guarantee. |
| Malicious path | A team can benchmark against trivial traffic and tiny fixtures, then claim every numeric latency target passed. |
| Incompetent path | A team may read immutable audit/outbox rows as protection from a database restore even though those rows share the same database failure domain. |
| Concurrent path | Two teams can select materially different RPS, route mixes, row counts, warm-cache ratios, and backup guarantees while both claim standards compliance. |

## Rubric Score

| Dimension | Result | Evidence |
|---|---|---|
| Engineering Standards | ⚠️ | Commands, quality gates, latency budgets, coverage, accessibility, security, migrations, and CI are concrete; recovery and performance-fixture rules remain contradictory or underspecified. |

## Devil's Advocate

- Audit/outbox rows cannot guarantee zero committed-operation loss during a database restore because they are stored in the same PostgreSQL recovery domain.
- “Expected v1 traffic” and “representative seed dataset” permit a benchmark with one request and ten rows unless the profile is numeric and versioned.
- A daily-backup RPO cannot truthfully coexist with a zero-loss claim for rights and publication records that lack an independent durable replica.

## Specification Gaps

1. **SPEC GAP STD-01 — Availability and Recovery:** the stated `≤24h` RPO conflicts with a zero-loss claim for PostgreSQL-resident audit/outbox data. **Resolution:** require seven-day Supabase PITR before protected production data, set the measured worst-case RPO to `≤2 minutes`, retain provider reconciliation as defense-in-depth, and remove the impossible zero-loss guarantee.
2. **SPEC GAP STD-02 — Performance Enforcement:** the load and dataset behind k6/pgbench gates are not numeric. **Resolution:** define PR smoke, sustained release, burst, route mix, cache mix, sample minimum, and representative row-count floors.

## Provider Verification

Supabase documentation verified on 2026-08-02 states that PITR restores to points with seconds-level granularity, has a worst-case RPO of two minutes, requires at least Small compute, and costs about `$100/month` for seven-day retention. This keeps the selected protection inside the approved `$300/month` production ceiling when reflected in the cost model.

## Verdict

The standards are not advancement-safe before remediation. Both findings are deterministic safety and test-enforcement corrections.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
