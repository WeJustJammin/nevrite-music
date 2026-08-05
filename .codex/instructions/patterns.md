# Code Patterns & Conventions

## TypeScript → skills: `clean-code`, `typescript-advanced-patterns`
- **Strict mode** everywhere — `strict: true` in tsconfig
- **Explicit types** — No `any`, no implicit returns
- **Zod validation** — All API inputs validated with Zod schemas
- **Self-documenting** — Clear naming over comments
- **Zod inference** — Derive types from Zod schemas (for example, `z.infer<typeof schema>`)

## File Organization → skill: `clean-code`
- **File size limits** — Per-type limits (enforced by extensibility rule): 200 lines for components (.tsx), 300 for utilities (.ts), 150 for schemas (.schema.ts), 400 for tests (.test.ts), 100 for config files
- **Single responsibility** — One component/module per file
- **Named exports** — No default exports for utilities
- **Direct imports** — Import from specific files, avoid barrel files

## Components
- **Astro first** — Render static/server HTML in `.astro` components; hydrate only interactions that require client state.
- **React islands** — One explicit interaction boundary per island; serializable validated props; an island error cannot erase canonical server-rendered context.
- **Route families** — Public, product, admin, auth/recovery and system routes use their locked shells/archetypes rather than one universal dashboard.
- **Global primitives** — Consume `packages/ui`; feature modules may extend but not redefine navigation, forms, provenance, errors, audit, upload or offline/conflict behavior.
- **State ownership** — URL/server projections own durable view state; island-local state stays local. Add a shared client store only after a documented cross-island requirement.
- **Accessibility** — Semantic HTML, keyboard behavior, visible focus, non-color state, reduced motion and WCAG 2.2 AA are component acceptance criteria.

## API & Data → skills: `api-design-principles`, `supabase-data-access`
- **Input validation** — Zod schemas on every endpoint
- **Error format** — Exactly `{ code, message, requestId, details }`; HTTP status remains on the response line
- **No magic strings** — Constants and enums for repeated values
- **Authorization** — Resolve authenticated user plus current acting party/capability, then recheck with RLS/RPC
- **Transactions** — Multi-row invariants, versions, idempotency, audit and outbox commit in one PostgreSQL RPC
- **Rate limiting** — Apply the numeric route-class limits from the architecture and emit standard rate-limit headers
- **Pagination** — Opaque deterministic cursors; page size at most 50

## Security → skill: `security-scanning-security-hardening`
- **No secrets in client code** — Server-side only, environment variables
- **CSP headers** — Content Security Policy on all responses
- **Input sanitization** — Prevent XSS, injection attacks
- **CORS configured** — Explicit allowed origins, no wildcards in production

## Naming
- **Files:** kebab-case (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Functions:** camelCase (`getUserById`)
- **Constants:** SCREAMING_SNAKE (`MAX_RETRY_COUNT`)
- **Types/Interfaces:** PascalCase (`UserSession`)

## What NOT to Do
- No `console.log` in committed code — Use a structured logging utility
- No deferred-work comment markers — Lazy placeholders are banned. If required information genuinely does not exist yet, use a `// BOUNDARY:` stub (see rule: `boundary-not-placeholder`)
- No `any` type — Ever
- No inline styles — Use CSS classes or scoped styles
- No hardcoded URLs — Use environment config
- No barrel files (`index.ts`) — Import directly from source files
