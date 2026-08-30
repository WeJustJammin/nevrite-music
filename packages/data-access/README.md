# Data access

Generated Supabase types, bounded repositories, and migration-owned RPC adapters belong here. The package implements application ports and must not own transport response shapes, cross-domain policy, or unrestricted SQL access.

`src/database.types.ts` is generated from the committed local migrations. Update it with `pnpm db:types` while the local database is running; CI regenerates it in memory and rejects drift.
