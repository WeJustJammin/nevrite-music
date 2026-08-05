# Bootstrap Report — P1 Persistence Map

**Date:** 2026-08-02  
**Pipeline stage:** create-prd

## Input

- Surface update: web / Databases / supabase

## Applied Map Update

- Filled the web Databases cell with `supabase`.
- Added the required unconfigured cells as `—`; no unconfirmed stack choice was introduced.
- Did not modify cross-cutting, global, command, or root-config fields.

## Skill Resolution

- `supabase` is already supported by the installed curated `supabase:supabase` skill.
- No project-local skill copy or new package installation was needed.

## Deferred P1 Details

- Storage is Supabase Storage; object authority and metadata remain in PostgreSQL.
- Realtime is ephemeral Supabase Realtime only.
- Search is PostgreSQL full-text search for v1.
- Asynchronous delivery is Cloudflare Queues plus a PostgreSQL transactional outbox.
- Durable Objects remain deferred pending a demonstrated room-level coordination need.

The deferred details are architecture contracts in `architecture-draft.md`, not surface-map skill cells.
