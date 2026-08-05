---
name: react-best-practices
description: Build bounded, accessible, high-performance React islands inside WeJammin's Astro application.
version: 1.0.0
---

# React Island Practices

Use the canonical bundled guidance at `.codex/skill-library/stack/ui/react-best-practices/SKILL.md` for component architecture, waterfall prevention, bundle control, rendering performance, error boundaries, and runtime efficiency.

## WeJammin Constraints

- React is an Astro island runtime, not the page router, server framework, or global application shell.
- Ignore Next.js- and React-Server-Component-specific examples unless their underlying performance principle applies independently to an Astro island.
- Keep each island bounded to a concrete interactive responsibility; render static structure and data on the server.
- Prefer URL/server state, then island-local state. Cross-island state requires demonstrated need and architecture review.
- Pass minimal validated serializable props and call versioned Worker APIs for protected reads and writes.
- Realtime events invalidate and refetch canonical state; never use them as authorization or client-authoritative truth.
- Implement accessible loading, empty, error, conflict, pending, and degraded states that remain understandable without visual-only cues.
- Split heavy editors and dashboards, avoid hydration waterfalls, and honor route-level JavaScript and main-thread budgets.

Read the canonical bundled skill before implementing or reviewing React islands.
