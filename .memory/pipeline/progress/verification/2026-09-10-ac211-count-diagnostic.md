# AC211 protected count-only diagnostic

The user approved adding a diagnostic to the existing protected AC211 workflow.
No sample floors, SLO thresholds, credentials, deployment, or acceptance rules
were changed.

The diagnostic uses the existing observability credential after source preflight
and production approval. It issues four bounded historical queries for the same
UTC window: dataset, registry needle, production registry, and exact-release
production registry. Each requests at most one event, uses a 10-second timeout
and 2 MiB response limit, and emits only provider counts. Missing counts are
null, never inferred zero. Raw events, provider errors, and secrets are not
printed. An unavailable diagnostic emits a fixed warning; normal collection
still runs and must independently satisfy every acceptance requirement.

These are provider event counts, not command/RPC/acceptance sample counts.
The account-wide baseline may include other scripts and scheduled invocations.
No difference between counts alone proves an implementation defect; investigate
the point where filtering removes events before changing emission or filters.

Regression tests cover the progressive filter bodies, bounded queries, explicit
zero versus unknown, invalid/incomplete responses, input validation, default
transport, CLI redaction, and preserved workflow protection/collector ordering.
The initial RED run failed for the missing diagnostic and workflow invocation;
the targeted GREEN run passes 16 tests. Full working-tree validation passed:
444 Vitest files, 3,329 tests plus one existing intentional skip, 100% configured
coverage, 101 functional and five production-built browser checks, database types,
contracts, progress, formatting, lint, types, builds, and budgets. Separate
diagnostic-helper coverage is 100% (15 statements, 8 branches, 1 function).
The working tree also contains separately pending AC265 changes, which are not
part of the diagnostic PR. No production diagnostic result is claimed before
protected execution.
