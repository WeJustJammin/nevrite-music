begin;

-- This table is a synthetic, read-only probe for local migration/RLS/RPC
-- verification. Feature slices own all production domain tables.
create table platform_private.db_harness_fixture (
  id uuid primary key,
  owner_id uuid not null,
  label text not null check (length(btrim(label)) between 1 and 120),
  created_at timestamptz not null
);

comment on table platform_private.db_harness_fixture is
  'Synthetic local database harness fixture; no production domain data.';

alter table platform_private.db_harness_fixture enable row level security;
alter table platform_private.db_harness_fixture force row level security;

create policy db_harness_fixture_owner_select
on platform_private.db_harness_fixture
for select
to authenticated
using ((select auth.uid()) = owner_id);

-- Keep the canonical table outside the API role's SQL privileges. This
-- allowlisted, security-barrier projection is owned by the migration role and
-- applies the same server-derived identity predicate before the invoker RPC
-- returns rows; RLS remains enabled and forced on the canonical table.
revoke all on table platform_private.db_harness_fixture
from public, anon, authenticated, service_role;

create view platform_api.db_harness_fixture_read
with (security_barrier = true)
as
  select id, owner_id, label
  from platform_private.db_harness_fixture
  where (select auth.uid()) = owner_id;

revoke all on table platform_api.db_harness_fixture_read
from public, anon, authenticated, service_role;
grant select on table platform_api.db_harness_fixture_read to authenticated;

create or replace function platform_api.list_harness_fixtures()
returns table (
  id uuid,
  owner_id uuid,
  label text
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select id, owner_id, label
  from platform_api.db_harness_fixture_read
  order by id;
$function$;

revoke all on function platform_api.list_harness_fixtures()
from public, anon, authenticated, service_role;
grant execute on function platform_api.list_harness_fixtures() to authenticated;

commit;

-- Rollback policy: this harness migration is forward-only after sharing. A
-- correction must use a compensating migration; no destructive rollback runs.
