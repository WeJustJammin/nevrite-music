---
name: github-actions
description: Build and secure WeJammin CI/CD workflows on GitHub Actions, the self-hosted runner fleet, and protected Cloudflare deployment environments.
version: 1.0.0
---

# GitHub Actions CI/CD

Use the canonical bundled guidance at `.codex/skill-library/stack/devops/github-actions/SKILL.md` for workflow syntax, triggers, caching, matrices, reusable workflows, artifacts, secrets, least-privilege permissions, concurrency, and deployment protection.

## WeJammin Constraints

- Target the private `WeJustJammin/nevrite-music` repository and the locked GitHub-to-Cloudflare deployment path.
- Use the existing self-hosted runners through the `wejammin` label; do not bind workflows to a single runner name.
- Cap heavy parallel jobs at two until runner-host measurements demonstrate safe capacity for three.
- Never execute untrusted fork code on the self-hosted fleet.
- Default workflow permissions to read-only and elevate only the jobs that require deployment or attestations.
- Deploy staging after required checks; deploy production through a protected environment with explicit approval and serialized concurrency.
- Keep Cloudflare and Supabase credentials environment-scoped and out of logs and command-line arguments.
- Validate and dry-run database/CMS migrations before deployment; retain rollback artifacts and preserve last-known-good public projections.

Read the canonical bundled skill before authoring or reviewing any workflow.
