# Approved AC265 GitHub repository identity propagation

The user explicitly approved the repository-identity correction on 2026-09-22.
The [propagation scan](propagation-scan-2026-09-22-repository-identity.md)
records the affected AC265 contracts, hosted authorization boundary, and
intentional historical exceptions.

The canonical identity is now `WeJustJammin/wejammin` (owner ID `305953066`,
repository ID `1297208152`). AC265 uses the exact immutable staging subject
`repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging` and
workflow ref
`WeJustJammin/wejammin/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main`.
The correction was applied to candidate-enrollment and control-plane contracts,
worker OIDC checks, provenance/publication fixtures, the forward-only Supabase
migration, and the corresponding SQL tests. The migration updates deployed
function definitions without rewriting the historical migration; legacy values
remain only where historical provenance or explicit negative rejection coverage
requires them.

AC209 and AC211 workflows remain dynamically repository-scoped, and the selected
AC211 deployment/provenance tuple remains valid. Positive production fixtures,
local bootstrap instructions, and GitHub Actions guidance now use the canonical
repository. Unrelated AC266-only evidence fixtures remain deferred outside this
acceptance path.

Focused tests passed (9 files, 78 tests), `db:verify` passed (62 files, 2,212
tests), and final `pnpm validate` passed (572 files, 4,546 tests plus 1 skipped,
100% coverage, 101 functional browser tests, 5 real-route S09 tests, builds,
bundle budgets, and performance smoke). This propagation does not claim AC265
hosted acceptance or production publication; owner-controlled publication
context, signing key, key ID, approved references, and signed exact-artifact
provenance remain required.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
