---
name: pnpm
description: Use when installing dependencies, managing workspaces, running scripts, or changing lockfile-sensitive configuration.
---

# pnpm Workspace Guidance

## Invariants

- Use the Corepack-pinned package manager version from root metadata.
- Commit one root `pnpm-lock.yaml`; CI installs with `pnpm install --frozen-lockfile`.
- Declare internal packages with `workspace:` ranges so registry resolution cannot silently replace them.
- Run repository tasks through root scripts; use `pnpm --filter` only for targeted local or dependency-aware CI work.
- Never hand-edit the lockfile or mix npm, Yarn, Bun, or global package binaries into repository commands.

## Verification

- A dependency change includes the manifest and lockfile delta.
- `pnpm validate` is the final local and CI contract.
- Store/cache reuse is allowed only when the lockfile, pnpm version, Node version, platform, and relevant configuration match.

## Setup Boundary

Exact Node/pnpm versions, workspace layout, package scripts, catalog policy, install hardening, and cache keys are created during `/setup-workspace`.
