# GitHub repository identity propagation scan

Decision: the canonical GitHub repository is `WeJustJammin/wejammin`, with
stable owner ID `305953066` and repository ID `1297208152`. The exact AC265
staging immutable subject is
`repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging`, and the
workflow ref is
`WeJustJammin/wejammin/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main`.
The user explicitly approved this propagation on 2026-09-22.

- Explicit contradiction: AC265 worker OIDC checks, candidate-enrollment and
  provenance contracts, publication context, and hosted SQL fixtures still
  referenced the pre-rename repository identity.
- Explicit contradiction: deployed AC265 authorization functions and their SQL
  tests must accept the current immutable subject/repository/workflow tuple and
  reject the legacy tuple.
- Consistent: owner and repository numeric IDs, the `main` branch, candidate
  identity digest, and AC265 evidence standards remain unchanged.
- Consistent: AC209 and AC211 workflows are dynamically repository-scoped; the
  selected AC211 provenance tuple remains valid.
- Intentional preservation: historical records and migration strings, plus
  negative legacy-identity fixtures, remain unchanged for provenance and
  fail-closed regression coverage.
- Applied: current production-preflight and promotion fixtures, local bootstrap
  instructions, and GitHub Actions guidance now use the canonical repository.
- Deferred: unrelated AC266-only evidence fixtures remain outside this
  acceptance path.

Apply targets: AC265 contracts, worker OIDC checks, provenance/publication
fixtures, the forward-only Supabase migration, SQL tests, positive production
fixtures, current onboarding guidance, and this propagation record.
Repository-wide acceptance is not implied. Focused tests passed (9 files,
78 tests), `db:verify` passed (62 files, 2,212 tests), and final `pnpm validate`
passed (572 files, 4,546 tests plus 1 skipped, 100% coverage, 101 functional
browser tests, 5 real-route S09 tests, builds, bundle budgets, and performance
smoke).


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
