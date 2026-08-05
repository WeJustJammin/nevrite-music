# Development Commands

## Web Surface

| Action | Command |
|---|---|
| Install exact lockfile | `pnpm install --frozen-lockfile` |
| Development server | `pnpm dev` |
| Unit/integration tests | `pnpm test` |
| Test watch mode | `pnpm test:watch` |
| Coverage gate | `pnpm test:coverage` |
| End-to-end tests | `pnpm test:e2e` |
| Lint | `pnpm lint` |
| Lint with fixes | `pnpm lint:fix` |
| Format files | `pnpm format` |
| Check formatting | `pnpm format:check` |
| Type-check | `pnpm type-check` |
| Production build | `pnpm build` |
| Full validation | `pnpm validate` |

## Validation (run after every code change)

The validation command runs all checks for the primary surface. For multi-surface projects, run each surface's validation command.

```bash
pnpm validate
```

All checks must pass before marking any task complete.
