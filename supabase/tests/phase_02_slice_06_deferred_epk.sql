begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Phase 2 explicitly defers EPK persistence and RPC implementation.  Keep the
-- BE02b contract visible to downstream planning, but prove that this slice has
-- not accidentally mounted EPK tables, token routes, or database commands.

select ok(to_regclass('profiles.epk_shares') is null,
  'deferred EPK shares table is not mounted in Phase 2');
select ok(to_regclass('profiles.epk_open_events') is null,
  'deferred EPK open counter is not mounted in Phase 2');
select ok(to_regclass('profiles.epk_pdf_snapshots') is null,
  'deferred EPK PDF snapshot table is not mounted in Phase 2');

select ok(not exists (select 1
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('profiles','profile_private','profile_api','platform_api')
    and c.relname ~* '^epk(_|$)'),
  'deferred EPK relations remain unmounted across profile schemas');
select ok(not exists (select 1
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and (p.proname ~* 'epk'
      or pg_get_functiondef(p.oid) ~* '(epk_share|epk_pdf|share_token)')),
  'deferred EPK database RPCs remain unmounted');

select * from finish();
rollback;
