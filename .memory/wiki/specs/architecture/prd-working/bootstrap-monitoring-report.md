# Monitoring Bootstrap Report

- **Pipeline stage:** `create-prd`
- **Bootstrap keys:** `MONITORING=sentry`; `OBSERVABILITY=structured-logging` resolved to `logging-best-practices`.
- **Map result:** `.codex/instructions/tech-stack.md` cross-cutting cells are `Monitoring=sentry` and `Observability=logging-best-practices`.
- **Monitoring resolution:** Tier 1 exact bundled skill at `.codex/skill-library/stack/monitoring/sentry/SKILL.md`, installed as `.codex/skills/sentry/SKILL.md` with project privacy, quota, audit, and provider-boundary constraints.
- **Observability resolution:** existing `.codex/skills/logging-best-practices/SKILL.md` satisfies structured JSON logs, correlation IDs, levels, sampling, centralized diagnostics, and PII handling; no duplicate skill was installed.
- **Provisioning boundary:** Sentry account/project, DSNs, source-map token, alert rules, uptime monitor, Cloudflare observability, and Supabase log settings remain deferred to `/setup-workspace`.
