# Development Tooling Bootstrap Report

## Input

- `PACKAGE_MANAGER=pnpm`
- `TEST_RUNNER=vitest`
- `E2E_TEST_RUNNER=playwright`
- `LINTER=eslint`
- `FORMATTER=prettier`
- `TYPE_CHECKER=tsc+astro-check`
- `TEST_COMMAND=pnpm test`
- `TEST_WATCH_COMMAND=pnpm test:watch`
- `TEST_COVERAGE_COMMAND=pnpm test:coverage`
- `E2E_TEST_COMMAND=pnpm test:e2e`
- `LINT_COMMAND=pnpm lint`
- `LINT_FIX_COMMAND=pnpm lint:fix`
- `FORMAT_COMMAND=pnpm format`
- `FORMAT_CHECK_COMMAND=pnpm format:check`
- `TYPE_CHECK_COMMAND=pnpm type-check`
- `BUILD_COMMAND=pnpm build`
- `DEV_COMMAND=pnpm dev`
- `VALIDATION_COMMAND=pnpm validate`

## Map Result

- `.codex/instructions/tech-stack.md` web row now resolves Unit Tests=`vitest`, E2E Tests=`playwright`, package manager=`pnpm`, and every required command cell.
- Command instructions for Codex, Claude, and Pi expose the same canonical script interface.
- Session-continuity lockfile guidance is fixed to `pnpm-lock.yaml` across Codex, Claude, Pi, and shared agent skills.

## Skill Resolution

- `pnpm`: Tier 3 local project skill provisioned at `.codex/skills/pnpm/SKILL.md`.
- `vitest`: Tier 3 local project skill provisioned at `.codex/skills/vitest/SKILL.md`.
- `playwright`: Tier 3 local project skill provisioned at `.codex/skills/playwright/SKILL.md`.
- ESLint, Prettier, TypeScript, and Astro diagnostic policy is captured in the architecture and command contract; no separate map column requires a provisioning key.

## Deferred Setup Work

No application dependencies or package manifests are installed during PRD work. `/setup-workspace` pins exact versions, writes configs and scripts, installs browser binaries, sets coverage thresholds, and proves `pnpm validate` on the self-hosted runner fleet.
