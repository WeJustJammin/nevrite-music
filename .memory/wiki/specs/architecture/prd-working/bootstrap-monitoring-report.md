# Monitoring Bootstrap Report

- **Pipeline stage:** `create-prd`
- **Bootstrap keys:** `Monitoring=logging-best-practices`; `OBSERVABILITY=structured-logging` resolved to `logging-best-practices`.
- **Map result:** `.codex/instructions/tech-stack.md` cross-cutting cells are `Monitoring=logging-best-practices` and `Observability=logging-best-practices`.
- **Monitoring resolution:** `logging-best-practices` owns the application boundary; Cloudflare and Supabase native telemetry require no additional vendor skill or account.
- **Observability resolution:** existing `.codex/skills/logging-best-practices/SKILL.md` satisfies structured JSON logs, correlation IDs, levels, sampling, centralized diagnostics, and PII handling; no duplicate skill was installed.
- **Provisioning boundary:** third-party monitoring accounts, DSNs, source-map tokens, vendor alert rules, vendor uptime monitors, trials, subscriptions, and pay-as-you-go monitoring are prohibited. `/setup-workspace` may configure only the native telemetry already included with an explicitly approved infrastructure plan.
