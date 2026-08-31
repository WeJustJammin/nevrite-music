# Project Structure

## Current Layout

```
apps/
  web/                 Astro pages, layouts, React islands and PWA
  worker/              Hono Worker routes, middleware, consumers and schedules
packages/
  contracts/           Zod API/event/CMS/setting/provider/error contracts
  domain/              pure domain modules and state machines
  application/         use cases, policy and injected ports
  data-access/         Supabase repositories, generated types and RPC adapters
  integrations/        Approved Cloudflare/Supabase and local-fake adapters
  ui/                  design tokens and global accessible components
  config/              typed environment and settings contracts
  observability/       structured logging, tracing, metrics and scrubbing
  test-support/        deterministic factories, fakes and harnesses
supabase/              migrations, synthetic seeds, database/RLS/RPC tests
tests/                 contract, integration, E2E, accessibility, performance, security
infra/                 Cloudflare/Supabase configuration and recovery scripts
docs/                  generated OpenAPI and implementation ADRs
.github/workflows/      pinned CI/CD and scheduled quality gates
.memory/wiki/operations/runbooks/ operational response procedures
```

## Architecture Separation

| Concern | Location | Runtime |
|---------|----------|---------|
| Runtime/API contracts | `packages/contracts` | browser, Worker, tests, generation |
| Domain invariants | `packages/domain/<domain>` | Worker and tests |
| Use cases/policy | `packages/application/<domain>` | Worker and tests |
| Data access | `packages/data-access`, `supabase/` | Worker, PostgreSQL and tests |
| Integrations | `packages/integrations/<provider>` | Worker, Queue and tests |
| API/async transport | `apps/worker` | Cloudflare Workers |
| Web composition | `apps/web` | Astro server and browser |
| Design system | `packages/ui`, `DESIGN.md` | Astro, browser and tests |
| Observability | `packages/observability` | browser, Worker and tests |
| Infrastructure | `infra/`, `.github/workflows` | CI and provider control planes |

## Protected Files (Do Not Modify Without Approval)
- `AGENTS.md` — Project agent config
- `.memory/wiki/specs/ENGINEERING-STANDARDS.md` — Quality bar
- `.codex/instructions/*` — Agent rules
- `package.json` — Dependencies (add carefully)
- `tsconfig.json` — TypeScript config

## Notes
- Codex agent config lives in `.codex/`
- The web and API are one modular edge deployment baseline; domain packages remain extraction-safe without becoming launch microservices.
