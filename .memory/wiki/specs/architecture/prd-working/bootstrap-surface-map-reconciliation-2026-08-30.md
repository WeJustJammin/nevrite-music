# Surface Stack Map Reconciliation

**Date:** 2026-08-30  
**Scope:** Tooling skill resolution only; no product, architecture, provider, package, or billing decision changed.

## Applied mappings

| Map cell | Previous alias | Exact installed skill mapping |
| --- | --- | --- |
| Web / Databases | `supabase` | `supabase-data-access` |
| Cross-cutting / Auth | `supabase-auth` | `supabase-data-access`, `security-scanning-security-hardening` |
| Cross-cutting / Contract Library | `zod` | `typescript-advanced-patterns` |

The four runtime mirrors were updated together:

- `.agents/instructions/tech-stack.md`
- `.claude/instructions/tech-stack.md`
- `.codex/instructions/tech-stack.md`
- `.pi/instructions/tech-stack.md`

Supabase Auth remains the locked authentication provider and Zod 4 remains the locked runtime contract library. The map now names exact project-local skills that workflows can load under the strict setup gate. Official Supabase Auth and Zod 4 documentation remain normative for provider- and library-specific behavior.

## Verification

- Every skill referenced by the Codex surface and cross-cutting map tables has an exact `.codex/skills/<name>/SKILL.md` path.
- No stale `supabase`, `supabase-auth`, or `zod` alias remains in any active map cell.
- Runtime mirrors remain structurally synchronized while preserving their existing runtime-specific differences.
- `pnpm validate` passes: 23 unit/contract tests, full coverage gates, 2 Playwright tests, and all format, lint, type, and build checks.
- `git diff --check` and `scripts/check-progress-consistency.mjs` pass.
- `.memory/pipeline/compile.mjs` and `.memory/pipeline/lint.mjs` report `ok: true`; lint has zero errors and 52 non-fatal `ORPHAN_SPEC` warnings.
