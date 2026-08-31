# WeJammin — Engineering Standards

> **Architecture**: [2026-08-02 Architecture Design](2026-08-02-architecture-design.md)
> **Date**: 2026-08-02
> **Status**: Approved under owner-delegated create-PRD authority

These are release gates. Phase controls scope, never quality. A threshold change is an architecture decision and must update its enforcement fixture in the same change.

## Canonical Commands and Environment

| Purpose | Command | Enforcement |
|---|---|---|
| Install | `corepack enable && pnpm install --frozen-lockfile` | exact Node/pnpm metadata and committed `pnpm-lock.yaml` |
| Format check | `pnpm format:check` | Prettier plus `prettier-plugin-astro` |
| Lint | `pnpm lint` | ESLint flat config with type-aware TypeScript, Astro, React hooks, imports, security and static a11y rules |
| Type check | `pnpm type-check` | strict `tsc --noEmit`, `astro check`, generated Worker binding validation |
| Unit/contract/integration | `pnpm test` | deterministic Vitest run mode |
| Coverage | `pnpm test:coverage` | Vitest V8 with explicit source inclusion |
| Browser/E2E | `pnpm test:e2e` | Playwright against production build/preview plus tagged local `apps/docs` screenshots and `@axe-core/playwright` checks |
| Build | `pnpm build` | reproducible Astro/Cloudflare and dependency-ordered package build |
| Full validation | `pnpm validate` | exact ordered aggregate defined in the final section |

- Exact Node, pnpm, browser, Supabase CLI, Wrangler, and package versions are pinned during `/setup-workspace` and upgraded only through reviewed lockfile/config changes.
- CI is authoritative; no local hook may create a path that CI does not reproduce. Pre-commit hooks are not mandatory at launch.
- Warnings from TypeScript, ESLint, test runners, build, migration validation, security scanners, or browser console fail CI unless an explicit dated exception contract exists.

## Test Coverage

| Scope | Minimum | Enforcement Tool |
|---|---:|---|
| Global statements/lines/functions | 90% each | Vitest V8 coverage in `pnpm test:coverage` |
| Global branches | 85% | Vitest V8 coverage |
| Changed executable lines | 95% | coverage diff action against protected base |
| Contracts, authorization policy, money/rights transitions, CMS publication/settings resolution, idempotency/outbox | 100% branches | dedicated Vitest projects and path thresholds |
| PostgreSQL RLS/RPC/migrations | every policy/function/transition has positive and negative cases | Supabase local database tests in CI |
| API routes and Queue consumers | every operation has success plus every declared error/retry/authorization class | Hono `app.request`, Worker-compatible Vitest pool, contract coverage report |
| Critical user flows | one production-build E2E per supported state path, plus at least one failure/recovery case | Playwright trace/report |

- Every endpoint has Zod request, response, and canonical error-envelope tests. OpenAPI generation must produce no undocumented route or schema drift.
- Every protected resource test includes anonymous, wrong user/party with a valid ID, expired/revoked authority, stale version, and over-disclosure assertions.
- External network is disabled for unit/contract/integration suites. Provider sandbox tests run separately and cannot replace deterministic fakes.
- A skipped test requires issue, owner, reason, and expiry no later than 14 days; Critical security/data-integrity tests cannot be skipped.
- Flaky tests are failures. Quarantine requires a reproducer, owner, expiry within 7 days, and an equivalent blocking deterministic check.

## Linting, Formatting, and Types

- ESLint flat config rejects `any`, unsafe assertions, floating promises, unhandled results, import-boundary violations, circular dependencies, React hook misuse, unsafe DOM sinks, and noncompliant Astro/JSX accessibility patterns.
- Prettier owns formatting; ESLint formatting rules are disabled. Generated files are excluded or deterministically checked, never manually formatted.
- TypeScript uses `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, and `noPropertyAccessFromIndexSignature` unless a documented tool incompatibility proves one impossible.
- Untrusted values enter as `unknown` and are parsed by Zod. Database/provider/generated types cannot be asserted into domain/API types without validation/mapping.
- `pnpm lint:fix` and `pnpm format` are local mutation commands; CI uses non-mutating checks only.

## Performance Baseline

- Lab baseline: Chromium mobile profile approximating a mid-tier 2022 Android device, 4× CPU slowdown, 10 Mbps down / 1 Mbps up, 40ms RTT, cold cache unless the scenario says repeat view.
- Production SLO baseline: expected v1 traffic, valid first-party requests, monthly p95 normal-web response `<2,000ms`; uploads and external/background completion are measured separately.
- Budgets apply at p75 for Core Web Vitals field data and p95/p99 for API/database timing as shown. CI lab gates use the exact deterministic Lighthouse/k6/pgbench profiles committed with the tests.

### Deterministic Load and Dataset Profiles

- **Pull-request smoke:** for every changed API tier, one virtual user performs 20 sequential no-retry iterations against a production build with deterministic fixtures. This proves contract/error correctness and catches gross regressions; it does not claim percentile significance.
- **Staging release load:** k6 runs 5 requests/second for 15 minutes, then 25 requests/second for 2 minutes, with no hidden retries and at least 200 valid samples per enabled tier. The fixed request mix is 35% tier A, 35% B, 15% C, 10% D, and 5% E; tier A is 80% warm publication-cache hits and 20% forced cold/version-miss reads. Overall unexpected error rate must be `<1%`, and every tier must meet its table thresholds.
- **Representative seed manifest:** deterministic seed version and checksum are committed with the performance tests. The release dataset contains at least 10,000 users/parties, 100,000 aggregate primary domain records with at least 10,000 rows in every tested hot-path table, 100,000 relationship/authority edges, 100,000 object-metadata rows, 10,000 CMS entries with 100,000 revisions, and 1,000,000 combined activity/audit/outbox rows.
- **Database profile:** pgbench/SQL scenarios run 10 concurrent clients for 5 minutes after one warm-up pass; a second run starts from a freshly restored representative database to expose cold-plan/cache behavior. Report sample count, dataset checksum, query-plan hash, p50/p95, errors, rows examined/returned, and environment revision.

## Web Vitals per Page Type

| Page Type | LCP | INP | CLS | Enforcement Tool |
|---|---:|---:|---:|---|
| Public record/editorial/discovery | ≤2.0s | ≤150ms | ≤0.05 | Lighthouse CI plus production web-vitals RUM |
| Auth/claim/recovery | ≤2.0s | ≤150ms | ≤0.05 | Lighthouse CI plus Playwright timing fixture |
| Product record/activity and content/detail | ≤2.5s | ≤200ms | ≤0.10 | Lighthouse CI plus production web-vitals RUM |
| Work queue/list-detail/collaboration | ≤2.5s | ≤200ms | ≤0.10 | Lighthouse CI plus Playwright interaction benchmark |
| Guided transaction/form | ≤2.5s | ≤150ms | ≤0.05 | Lighthouse CI plus Playwright critical-action benchmark |
| CMS editor/preview and admin/settings | ≤2.5s | ≤200ms | ≤0.10 | Lighthouse CI plus Playwright editor/admin benchmark |
| System/degraded/PWA offline shell | ≤2.0s | ≤150ms | ≤0.05 | Lighthouse CI offline profile plus Playwright service-worker test |

CI fails when any lab metric exceeds its row by more than 5% on two clean repetitions; a single 1–5% regression warns and requires a linked measurement note. Production alerting uses the locked p75 Core Web Vitals thresholds without the CI tolerance.

## Bundle and Payload Budgets

| Page Type | Initial JS gzip | Total route JS gzip | Initial CSS gzip | HTML gzip | Enforcement Tool |
|---|---:|---:|---:|---:|---|
| Public record/editorial/discovery | ≤60KB | ≤120KB | ≤35KB | ≤75KB | `size-limit` plus build manifest CI script |
| Auth/claim/recovery | ≤70KB | ≤140KB | ≤35KB | ≤75KB | `size-limit` plus build manifest CI script |
| Product record/activity/content | ≤90KB | ≤180KB | ≤45KB | ≤100KB | `size-limit` plus build manifest CI script |
| Work queue/list-detail/collaboration | ≤120KB | ≤240KB | ≤50KB | ≤100KB | `size-limit` plus build manifest CI script |
| Guided transaction/form | ≤100KB | ≤200KB | ≤45KB | ≤100KB | `size-limit` plus build manifest CI script |
| CMS editor/preview/admin/settings | ≤140KB | ≤280KB | ≤55KB | ≤110KB | `size-limit` plus build manifest CI script |
| System/degraded/PWA shell | ≤80KB | ≤160KB | ≤40KB | ≤75KB | `size-limit` plus service-worker manifest test |

- Ordinary JSON request/response bodies are ≤256KB each; list page size is ≤50 records; synchronous export is prohibited. Zod byte/row limits and API tests enforce these values.
- Above-fold responsive image transfer is ≤250KB per page at the mobile profile; total initial image transfer is ≤750KB. Audio/video/object transfers are user-initiated, range-aware, and excluded from page weight while separately quota-tested.
- No single hydrated island may add more than 50KB gzip of route-specific JavaScript without an architecture/performance exception.

## API Response Time per Tier

| Tier | Description | p50 | p95 | p99 | Enforcement Tool |
|---|---|---:|---:|---:|---|
| A — edge-cached public read | publication-safe cache hit | ≤50ms | ≤150ms | ≤400ms | k6 against staging plus Cloudflare analytics |
| B — bounded canonical read | one projection with indexed database access | ≤150ms | ≤750ms | ≤1,500ms | k6 plus Hono/Supabase spans |
| C — protected command | bounded RPC transaction excluding async completion | ≤250ms | ≤1,200ms | `<2,000ms` | k6 plus command/RPC spans |
| D — job acceptance | commit intent/outbox and return status resource | ≤200ms | ≤500ms | ≤1,000ms | k6 plus job timestamp assertions |
| E — inbound webhook acknowledgment | verify, persist receipt/idempotency, enqueue | ≤300ms | ≤1,000ms | `<2,000ms` | signed k6 fixtures plus provider sandbox |

- Every synchronous route has an application deadline no longer than 8 seconds for reads and 15 seconds for protected commands; tests inject a timeout and assert the canonical envelope.
- Automatic client retry is limited to safe reads and idempotent operations. Performance tests do not hide failure by retrying samples before measurement.

## Database Query Time per Tier

| Tier | Description | p50 | p95 | Enforcement Tool |
|---|---|---:|---:|---|
| 1 — indexed point lookup | PK/unique key, explicit columns | ≤10ms | ≤50ms | pgbench/SQL benchmark fixtures plus `EXPLAIN (ANALYZE, BUFFERS)` review |
| 2 — indexed bounded range | deterministic cursor list ≤50 rows | ≤25ms | ≤100ms | pgbench and query-plan snapshot |
| 3 — protected transaction/RPC | invariant, version, audit, idempotency, outbox | ≤50ms | ≤300ms | pgbench RPC scenario and tracing |
| 4 — search/aggregation projection | FTS/trigram/maintained aggregate, bounded output | ≤100ms | ≤500ms | pgbench plus representative seed dataset |

- CI rejects sequential scans on protected hot-path tables above 10,000 representative rows unless the benchmark proves the row estimate, bound, and p95 budget.
- A request may issue at most 10 database round trips on a declared complex workbench route and at most 5 on other dynamic routes; span assertions fail N+1 regressions.
- Migrations lock a hot table for no longer than 1 second in the representative upgrade test. Longer work uses expand/backfill/contract and resumable jobs.

## Async, Publication, and Delivery Budgets

| Metric | Threshold | Enforcement Tool |
|---|---:|---|
| Outbox undispatched age | p95 ≤2s; alert at 2 minutes | integration timestamps plus dashboard alert test |
| Queue time to first attempt | p95 ≤60s | Worker Queue integration and staging synthetic |
| CMS cache/search/sitemap convergence | p95 ≤120s | publication-version E2E test |
| Ordinary notification first attempt | p95 ≤5 minutes | Queue/provider fake and staging email sandbox |
| Dead-letter rate | `<0.1%` daily and zero Severity-1 messages unresolved >30 minutes during owner coverage | operational projection and alert |
| Upload post-processing admission | metadata/scan state visible ≤60s; long transforms become explicit jobs | upload integration benchmark |

## Availability and Recovery

- Monthly availability target is 99.9%, excluding scheduled maintenance announced at least 48 hours in advance. Every unplanned invalid response/dependency outage remains an incident; the percentage is not permission to spend downtime.
- Synthetic public checks run every 60 seconds from at least two locations before production launch. Two consecutive failures within 5 minutes alert.
- Supabase Free has no PITR or uptime SLA. Protected production money, rights, and publication writes therefore remain disabled. Synthetic/local restore drills are diagnostic only and cannot open that gate. Enabling protected writes requires a separate owner-approved recovery capability plus immutable production-verified artifact, environment, restore-epoch, RLS/RPC, and reconciliation evidence.
- No production database RPO or RTO is claimed on the Free tier. Application artifact rollback retains a measured ≤30-minute objective, while local restore drills record observations without promoting them to hosted recovery guarantees.

## Accessibility

- WCAG 2.2 AA is mandatory. Axe automated tests report zero Critical or Serious violations on every archetype and critical state; Lighthouse accessibility score must be 100 in CI fixtures.
- Keyboard-only operation covers every interactive element, modal, menu, editor block, table control, drag alternative, upload, error recovery, and high-risk confirmation. No keyboard trap is permitted.
- Manual testing before each release covers NVDA+Firefox and VoiceOver+Safari, 200% and 400% zoom/reflow, Windows High Contrast/forced colors, reduced motion, touch target size, captions/transcripts where media requires them, and error/status announcements.
- The local/CI-only `apps/docs` catalog renders every shared primitive, route shell/archetype, density, provenance/error/offline state, locked viewport, and reduced-motion mode. Its tagged Playwright screenshot and `@axe-core/playwright` checks run inside `pnpm test:e2e`; a baseline change without reviewed visual evidence fails.
- Text contrast is ≥4.5:1 normal and ≥3:1 large; UI components/focus indicators are ≥3:1 against adjacent colors. Targets are at least 24×24 CSS px with spacing and 44×44 for primary compact-mobile actions.
- CMS publication rejects known missing required alternatives, invalid heading structure, empty link purpose, missing language, inaccessible block configuration, and color-only status.

## Security

| Control | Threshold / requirement | Enforcement Tool |
|---|---|---|
| Dependency vulnerabilities | Critical 24h, High 7d, Medium 30d, Low 90d; High/Critical block release | `pnpm audit`, OSV-Scanner, Dependabot, CI policy |
| Secret scanning | zero verified secrets in current/history diff | Gitleaks every PR plus weekly full-history scan |
| Static analysis | zero unreviewed High/Critical findings | ESLint security rules plus Semgrep Community ruleset |
| Dynamic web/API scan | zero High/Critical; Medium requires 30-day acceptance | OWASP ZAP baseline on protected staging plus authz abuse suite |
| CSP | nonce/hash policy from architecture; zero production violation caused by first-party code | Playwright header/CSP tests and report endpoint |
| Headers/CORS/CSRF | exact architecture values and exact origin list | integration/Playwright security tests |
| Authz/BOLA | every protected operation tests wrong valid user/party/resource | contract coverage gate and local Supabase RLS suite |
| Upload safety | 100% quarantined until allowlisted detection/scan/metadata checks pass | storage integration tests and scanner sandbox |
| Artifact integrity | Actions SHA pinned; artifact digest identical staging→production | workflow policy and provenance verification |

- No Critical/High security exception can ship on auth, admin, payment, rights, CMS publication, privacy, moderation/legal, upload, migration, or public disclosure paths.
- Penetration testing of auth/link/recovery, BOLA, CMS rendering/settings, upload/media, webhooks, payment reconciliation, and admin is a production-readiness gate; a qualified external test is required before handling material money volume or minors.

## Code Quality and Architecture

| Rule | Limit | Enforcement Tool |
|---|---:|---|
| Component file | 200 lines | ESLint/custom CI file-size check |
| Utility/library file | 300 lines | custom CI file-size check |
| Zod/schema file | 150 lines | custom CI file-size check |
| Test file | 400 lines | custom CI file-size check |
| Configuration file | 100 lines | custom CI file-size check |
| Function body | 50 lines excluding type signatures | ESLint `max-lines-per-function` with narrow reviewed exceptions |
| Cyclomatic complexity | 10 | ESLint complexity rule |
| Function parameters | 4 positional maximum | ESLint `max-params`; use typed parameter object beyond four |
| Circular dependencies | zero | dependency-cruiser or Madge CI graph check |
| Source directory with >2 files and no README | zero | repository structure validation script |

- Public contracts, exported application ports/use cases, domain state transitions, migrations/functions, settings/CMS definitions, security controls, and non-obvious failure/recovery behavior require documentation.
- Components render and coordinate UI only; domain decisions live in domain/application packages. Cross-domain access uses exported contracts/use cases, never another module's private tables/files.
- Duplication is measured semantically, not by premature abstraction. A third equivalent implementation is prohibited; two security/authority/error implementations are already one too many.

## Migration and Data Gates

- Every migration applies from empty state and from the latest released schema with representative data, then generated Supabase types are regenerated and diffed.
- Every exposed table/view/function has explicit grants and RLS policy tests. `security definer` uses empty fixed `search_path`, fully qualified objects, revoked defaults, named grants, and dedicated abuse tests.
- Destructive changes use expand → backfill → switch → contract. Backfills are idempotent/resumable, expose progress/failure, and do not run inside request or deploy deadlines.
- Backup/restore, deletion/hold, storage orphan/reconciliation, outbox replay, and projection anti-resurrection tests must pass before production data.

## CI/CD Gates

| Gate | Pull request | Staging | Production |
|---|---|---|---|
| Format/lint/type/build | fail | fail | artifact already proven |
| Unit/contract/integration/coverage | fail | fail on production topology regressions | artifact already proven |
| Database migration/RLS/RPC | fail local | fail representative upgrade | protected approval and compatibility check |
| Dependency/secret/license/SAST | fail by policy | fail | no unresolved release blocker |
| E2E/accessibility | affected Chromium fail | full Chromium + protected WebKit/Firefox set fail | smoke after promotion; auto rollback/disable on protected failure |
| Performance/bundle | fail concrete budgets | k6/pgbench/Lighthouse fail | canary/synthetic monitor |
| Security dynamic/provider sandbox | scheduled/affected | fail enabled capability | counsel/provider gates and runbook ready |
| Infrastructure verification | setup/infra changes | complete report required | complete production report required |

- Heavy self-hosted jobs run at most two concurrently until measured runner capacity proves three. Concurrency groups cancel stale pull-request work but never cancel an active production migration/deploy mid-transaction.
- Staging deploys after protected main gates. Production requires protected environment approval and promotes the same artifact digest.

## Validation Command

`pnpm validate`

During `/setup-workspace`, this command is implemented as the stable aggregate:

```text
pnpm format:check &&
pnpm lint &&
pnpm type-check &&
pnpm test:coverage &&
pnpm test:e2e &&
pnpm build
```

GitHub Actions may execute equivalent dependency-aware parallel jobs, but the required-check aggregator must prove every stage above plus migration/security/performance/infrastructure gates applicable to the change. No successful build may mask a failed type, test, security, accessibility, migration, or budget gate.
