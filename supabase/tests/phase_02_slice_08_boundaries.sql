begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Slice 08 QA-RED.  The admin records are private, forced-RLS projections.
-- Direct table access is never the Worker contract: only the three active
-- platform_api RPCs below may be executable by the Worker service principal.
-- Search and bulk execution remain deferred until their later activation gates
-- are implemented.  The audit-diagnostic boundary is active for `read_audit`
-- only; the Worker route keeps `run_diagnostic` deferred.
-- P2-S08-AC-008, AC-014, AC-020, AC-024..035, AC-041, AC-044, AC-047.

select ok(
  not has_schema_privilege('anon', 'platform_private', 'usage')
    and not has_schema_privilege('authenticated', 'platform_private', 'usage'),
  'P2-S08 anonymous and authenticated callers cannot use the private schema'
);

-- Force RLS even for a table owner.  Each scalar catalog lookup deliberately
-- returns false for an absent relation so the missing migration is a clean RED
-- assertion rather than a SQL abort.
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_task_projections')), false),
  'P2-S08-AC-024 admin_task_projections enables and forces RLS'
);
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_capability_grants')), false),
  'P2-S08-AC-025 admin_capability_grants enables and forces RLS'
);
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_bulk_operations')), false),
  'P2-S08-AC-026 admin_bulk_operations enables and forces RLS'
);
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_bulk_item_results')), false),
  'P2-S08-AC-027 admin_bulk_item_results enables and forces RLS'
);
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_audit_links')), false),
  'P2-S08-AC-028 admin_audit_links enables and forces RLS'
);
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_diagnostic_definition_versions')), false),
  'P2-S08-AC-029 diagnostic definitions enable and force RLS'
);
select ok(
  coalesce((select relrowsecurity and relforcerowsecurity from pg_class
    where oid = to_regclass('platform_private.admin_diagnostic_runs')), false),
  'P2-S08-AC-030 diagnostic runs enable and force RLS'
);

-- No caller role, including the service role used by the Worker transport,
-- receives direct DML on a canonical record.  A missing relation still fails
-- the test through the leading to_regclass predicate.
select ok(
  to_regclass('platform_private.admin_task_projections') is not null
    and not has_table_privilege('anon', 'platform_private.admin_task_projections', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_task_projections', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_task_projections', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_task_projections', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_task_projections', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_task_projections', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_task_projections', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_task_projections', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_task_projections', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_task_projections', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_task_projections', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_task_projections', 'delete'),
  'P2-S08-AC-024 task projections deny direct anon/authenticated/Worker DML'
);
select ok(
  to_regclass('platform_private.admin_capability_grants') is not null
    and not has_table_privilege('anon', 'platform_private.admin_capability_grants', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_capability_grants', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_capability_grants', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_capability_grants', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_capability_grants', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_capability_grants', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_capability_grants', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_capability_grants', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_capability_grants', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_capability_grants', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_capability_grants', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_capability_grants', 'delete'),
  'P2-S08-AC-025 capability grants deny direct anon/authenticated/Worker DML'
);
select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null
    and not has_table_privilege('anon', 'platform_private.admin_bulk_operations', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_bulk_operations', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_bulk_operations', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_bulk_operations', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_operations', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_operations', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_operations', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_operations', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_operations', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_operations', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_operations', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_operations', 'delete'),
  'P2-S08-AC-026 bulk operations deny direct anon/authenticated/Worker DML'
);
select ok(
  to_regclass('platform_private.admin_bulk_item_results') is not null
    and not has_table_privilege('anon', 'platform_private.admin_bulk_item_results', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_bulk_item_results', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_bulk_item_results', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_bulk_item_results', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_item_results', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_item_results', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_item_results', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_bulk_item_results', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_item_results', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_item_results', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_item_results', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_bulk_item_results', 'delete'),
  'P2-S08-AC-027 bulk item results deny direct anon/authenticated/Worker DML'
);
select ok(
  to_regclass('platform_private.admin_audit_links') is not null
    and not has_table_privilege('anon', 'platform_private.admin_audit_links', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_audit_links', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_audit_links', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_audit_links', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_audit_links', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_audit_links', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_audit_links', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_audit_links', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_audit_links', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_audit_links', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_audit_links', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_audit_links', 'delete'),
  'P2-S08-AC-028 audit links deny direct anon/authenticated/Worker DML'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_definition_versions') is not null
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_definition_versions', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_definition_versions', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_definition_versions', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_definition_versions', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_definition_versions', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_definition_versions', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_definition_versions', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_definition_versions', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_definition_versions', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_definition_versions', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_definition_versions', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_definition_versions', 'delete'),
  'P2-S08-AC-029 diagnostic definitions deny direct anon/authenticated/Worker DML'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_runs') is not null
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_runs', 'select')
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_runs', 'insert')
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_runs', 'update')
    and not has_table_privilege('anon', 'platform_private.admin_diagnostic_runs', 'delete')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_runs', 'select')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_runs', 'insert')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_runs', 'update')
    and not has_table_privilege('authenticated', 'platform_private.admin_diagnostic_runs', 'delete')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_runs', 'select')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_runs', 'insert')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_runs', 'update')
    and not has_table_privilege('service_role', 'platform_private.admin_diagnostic_runs', 'delete'),
  'P2-S08-AC-030 diagnostic runs deny direct anon/authenticated/Worker DML'
);

-- RLS policies must exist on every relation and bind the projection to an
-- authority concept; a policy-free forced-RLS table would deny everything or
-- tempt a bypass in application code.
select ok(
  coalesce((select bool_and(exists (
    select 1 from pg_policies p
    where p.schemaname = 'platform_private'
      and p.tablename = t.table_name
      and lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''))
        ~ '(capabil|scope|actor|subject|grant|target|source)'
  )) from (values
    ('admin_task_projections'), ('admin_capability_grants'),
    ('admin_bulk_operations'), ('admin_bulk_item_results'),
    ('admin_audit_links'), ('admin_diagnostic_definition_versions'),
    ('admin_diagnostic_runs')
  ) as t(table_name)), false),
  'P2-S08 capability and scope RLS policies guard all seven admin records'
);

-- Named Worker RPC boundary.  The catalog query intentionally accepts any
-- jsonb/typed signature, while requiring every overload of the named routine
-- to be a security-definer with a pinned search_path and service-only grant.
select ok(
  coalesce((select bool_and(
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'platform_api' and p.proname = r.rpc_name)
    and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'platform_api' and p.proname = r.rpc_name
        and (not p.prosecdef or coalesce(array_to_string(p.proconfig, ','), '') !~ 'search_path='))
    and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'platform_api' and p.proname = r.rpc_name
        and has_function_privilege('service_role', p.oid, 'execute'))
    and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'platform_api' and p.proname = r.rpc_name
        and (has_function_privilege('anon', p.oid, 'execute')
          or has_function_privilege('authenticated', p.oid, 'execute')))
  ) from (values
    ('admin_inbox'), ('admin_capability_action'), ('admin_audit_diagnostic')
  ) as r(rpc_name)), false),
  'P2-S08 Worker receives only pinned security-definer grants for active inbox/capability/audit RPCs'
);

-- Search and bulk execution are not active in this slice.  A future migration
-- may define private foundations, but no Worker service principal can execute
-- these routes before their activation gates.  The combined audit/diagnostic
-- boundary remains granted for its read-audit branch only.
select ok(
  not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api'
      and p.proname in ('admin_search', 'admin_bulk_action')
      and has_function_privilege('service_role', p.oid, 'execute')),
  'P2-S08 deferred search/bulk RPC execution has no Worker grant'
);

-- Search and bulk activation remains capability/registry gated.  No canonical
-- admin table may be exposed as a platform_api relation; the only public
-- surface is the named RPC boundary above (search has no raw SQL relation and
-- bulk has no direct manifest table access).
select ok(
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform_api'
      and c.relname in (
        'admin_task_projections', 'admin_capability_grants',
        'admin_bulk_operations', 'admin_bulk_item_results',
        'admin_audit_links', 'admin_diagnostic_definition_versions',
        'admin_diagnostic_runs'
      )),
  'P2-S08 deferred search/bulk activation exposes no direct platform_api table'
);

select * from finish();

rollback;
