# Architecture Ambiguity Audit — Architecture Design Fresh Rerun 4

- **Document:** `.memory/wiki/specs/2026-08-02-architecture-design.md`
- **Graph source:** [[specs/2026-08-02-architecture-design]]
- **Processed counter after report:** 1/2
- **Freshness:** post-DEC-094 independent current-source simulation
- **Score:** 1.5 ambiguity points / 15 checkpoints = **10.0%**

## Implementer Simulation

| Path | Forced decisions and observed divergence |
|---|---|
| Happy path | Hosting tier and all core runtime axes are now fixed. A capable frontend setup team must still choose Storybook versus another catalog, a visual-regression mechanism, font hosting/subsetting, and whether dark mode is admitted. |
| Malicious path | A team can add Chromatic/Storybook SaaS, a font CDN, or a dark theme while claiming each is an “equivalent” setup choice despite cost, privacy, CSP, and design-governance consequences. |
| Incompetent path | A literal team may choose no component catalog, rely on manual screenshots, or ship an incomplete dark palette because the architecture delegates selection and verification together. |
| Concurrent path | Two teams select different documentation apps, screenshot tools, font origins, and launch themes while all other architecture remains identical. |

## Rubric Score

| Dimension | Result | Fresh evidence |
|---|---|---|
| Tech Stack | ⚠️ | The 20-axis matrix and Workers Paid tier are complete, but the Product Design setup boundary still says `Storybook or equivalent` and delegates font/documentation/visual-regression/dark-theme selection. |
| System Architecture | ✅ | All components, paths, fallbacks, lifecycle, and observability complete. |
| Data Strategy | ✅ | Canonical stores, query paths, migration, and field-level PII complete. |
| Security Model | ✅ | Auth, roles, limits, and validation complete. |
| Compliance | ✅ | Every regulated domain has hierarchy, consent/disclosure, filtering, and audit. |
| API Design | ✅ | Version/error/pagination/header contracts complete. |
| Integration Robustness | ✅ | Provider capability/failure/fallback/cost complete. |
| Phasing | ✅ | Dependencies, entry, exit, estimate, and scope complete. |
| Persistence Architecture | ✅ | Query map and cross-store contracts complete. |
| Error Architecture | ✅ | Envelope, propagation, unhandled, fallback, exact timeout, and boundary contracts complete. |
| Attack Surface | ✅ | Secrets, dependencies, OWASP, headers, BOLA, logger, sampling, and alerts complete. |
| Observability | ✅ | Runbooks, escalation, dashboards, SLO registration, MTTD, and fatigue controls complete. |
| Cost Architecture | ✅ | Baselines, load curve, cost drivers, observability, and ceilings complete. |
| Testability | ✅ | DI, mocks, parity, isolation, and data strategy complete. |

## Devil's Advocate

- “Or equivalent” explicitly permits multiple architectures and fails the two-implementer test.
- Font origin and dark-theme admission affect CSP, privacy, payload budgets, token governance, accessibility, and visual-test scope; they are not harmless setup details.
- Exact package versions may be pinned at setup, but the documentation/test/font/theme mechanism must be selected at architecture.

## Specification Gap

**SPEC GAP R4-ARCH-01 — Design tooling / launch posture:** component catalog, visual regression, font delivery, and dark theme remain selectable at setup. **Resolution:** lock a local static Astro component catalog, Playwright screenshots plus axe-core, self-hosted immutable WOFF2 fonts without launch subsetting, and warm-light-only launch with dark theme requiring `/evolve-feature`.

## Verdict

Fresh rerun 4 does not pass. One deterministic design-tooling correction and a fifth fresh rerun remain.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
