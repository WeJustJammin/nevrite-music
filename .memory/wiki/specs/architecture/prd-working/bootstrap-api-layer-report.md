# API Layer Bootstrap Report

- **Pipeline stage:** `create-prd`
- **Bootstrap key:** `API_LAYER=REST`.
- **Map result:** `.codex/instructions/tech-stack.md` cross-cutting `API Design` cell is `api-design-principles`.
- **Resolution:** REST is the bootstrap default and resolves to the existing `.codex/skills/api-design-principles/SKILL.md`; `.codex/skills/api-error-handling/SKILL.md` remains the backend companion for problem responses.
- **Excluded resolutions:** GraphQL and tRPC skills are not provisioned because neither style was selected.
- **Verification target:** the map cell equals `api-design-principles` and both API design/error skills are readable.
- **Provisioning boundary:** OpenAPI generator, route namespace, schema library, generated clients, webhook keys, and gateway policies remain deferred to later stack/tooling decisions and `/setup-workspace`.
