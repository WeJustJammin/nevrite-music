-- Local-only synthetic fixtures. Supabase db reset runs this file after the
-- committed migrations; remote production data is never seeded by this file.
begin;

delete from platform_private.db_harness_fixture;

insert into platform_private.db_harness_fixture (
  id,
  owner_id,
  label,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000101'::uuid,
    'database harness synthetic fixture alice',
    '2026-01-01T00:00:00Z'::timestamptz
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000202'::uuid,
    'database harness synthetic fixture bob',
    '2026-01-01T00:00:01Z'::timestamptz
  );

commit;
