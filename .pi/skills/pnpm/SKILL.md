---
name: pnpm
description: Use when installing dependencies, managing workspaces, running scripts, or changing lockfile-sensitive configuration.
---

# pnpm Workspace Guidance

- Use the Corepack-pinned pnpm version and one committed root `pnpm-lock.yaml`.
- CI installs with `pnpm install --frozen-lockfile`.
- Declare internal packages with `workspace:` ranges.
- Run repository tasks through root scripts; use filters only for targeted local or dependency-aware CI work.
- Never hand-edit the lockfile or mix npm, Yarn, Bun, or global package binaries into repository commands.
- `pnpm validate` is the final local and CI contract.
