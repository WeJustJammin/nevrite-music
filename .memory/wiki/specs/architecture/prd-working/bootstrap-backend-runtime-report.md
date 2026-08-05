# Backend Runtime Bootstrap Report

- **Pipeline stage:** `create-prd`
- **Bootstrap keys:** `BACKEND_RUNTIME=cloudflare-workers`; `BACKEND_FRAMEWORK=hono`.
- **Map result:** `.codex/instructions/tech-stack.md` web `BE Frameworks` cell is `hono`.
- **Framework resolution:** Tier 1 exact bundled Hono skill at `.codex/skill-library/stack/frameworks/hono/SKILL.md`, installed as `.codex/skills/hono/SKILL.md` with Worker, transaction, queue, and security boundaries.
- **Companion resolution:** backend-framework bootstrap also installs `.codex/skills/api-error-handling/SKILL.md` from the exact bundled API companion skill.
- **Runtime resolution:** Cloudflare Workers is recorded in architecture and remains operationally covered by the Cloudflare hosting skill; the surface map has no separate runtime column.
- **Provisioning boundary:** Worker/Hono versions, bindings, limits, Queue consumers, schedules, local emulation, and deployments remain deferred to `/setup-workspace`.
