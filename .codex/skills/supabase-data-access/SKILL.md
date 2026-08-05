---
name: supabase-data-access
description: Use for application reads/writes against Supabase PostgreSQL; this project deliberately uses generated supabase-js/Data API contracts and SQL/RPC functions instead of a general ORM.
---

# Supabase Data Access

- Generate database TypeScript types from committed migrations and fail CI on unexplained drift.
- Use `supabase-js`/PostgREST for allowlisted reads, views, projections, and ordinary single-resource writes under explicit grants and RLS.
- Put multi-row invariants, version checks, idempotency, immutable audit, and transactional outbox creation in migration-owned PostgreSQL functions/transactions.
- Prefer `security invoker`; every `security definer` function requires an empty fixed `search_path`, explicit grants, threat review, and tests.
- Browser islands never receive service-role credentials or query unrestricted canonical tables.
- Direct PostgreSQL is for migrations, backup/restore, diagnostics, and a measured server-only query escape hatch. Edge traffic uses the appropriate transaction pooler with prepared statements disabled when required.
- Avoid ORM-generated schema ownership, implicit lazy loading, and application-side multi-call transaction approximations.
