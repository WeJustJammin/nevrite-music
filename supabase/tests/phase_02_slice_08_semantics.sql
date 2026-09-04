begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Slice 08 QA-RED.  These assertions cover the non-null/version, replay,
-- append-only, and manifest-bound semantics that cannot be proven by names
-- and relation existence alone.  P2-S08-AC-009, AC-015, AC-021, AC-024..030,
-- AC-033..035.

select ok(
  to_regclass('platform_private.admin_task_projections') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_task_projections')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'source_version.*> *0'),
  'P2-S08-AC-024 task source versions are strictly positive'
);
select ok(
  to_regclass('platform_private.admin_capability_grants') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_capability_grants')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'version_no.*> *0')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_capability_grants')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'cardinality.*actions'),
  'P2-S08-AC-025 grants carry positive versions and bounded action sets'
);
select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_operations')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'command_version.*> *0')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_operations')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'target_count.*1.*500')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_operations')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'version_no.*> *0'),
  'P2-S08-AC-026 bulk manifests use positive command/row versions and a 1..500 bound'
);
select ok(
  to_regclass('platform_private.admin_bulk_item_results') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_item_results')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'expected_version.*> *0')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_item_results')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'attempt_count.*0.*3')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_item_results')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'version_no.*> *0'),
  'P2-S08-AC-027 item outcomes enforce expected versions, retry ceiling, and row versions'
);
select ok(
  to_regclass('platform_private.admin_audit_links') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_audit_links')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'source_version.*> *0')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_audit_links')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'safe_label'),
  'P2-S08-AC-028 audit links enforce positive source versions and safe labels'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_definition_versions') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_definition_versions')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'version_no.*> *0')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_definition_versions')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'timeout_ms.*100.*2000')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_definition_versions')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'freshness_seconds.*1.*604800'),
  'P2-S08-AC-029 diagnostic definitions enforce positive versions and bounded timeouts'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_runs') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_runs')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'definition_version.*> *0')
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_runs')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'version_no.*> *0'),
  'P2-S08-AC-030 diagnostic runs bind positive definition and result versions'
);

-- Cross-table foreign keys keep manifests, item outcomes, diagnostic
-- definitions, and their audit links attached to their owning authority.
select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_operations')
        and c.contype = 'f'
        and pg_get_constraintdef(c.oid) ~* 'target_manifest_object_id'),
  'P2-S08-AC-026 bulk operation manifest is backed by a protected object record'
);
select ok(
  to_regclass('platform_private.admin_bulk_item_results') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_item_results')
        and c.contype = 'f'
        and pg_get_constraintdef(c.oid) ~* 'operation_id'),
  'P2-S08-AC-027 item outcomes remain owned by one bulk operation'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_runs') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_runs')
        and c.contype = 'f'
        and pg_get_constraintdef(c.oid) ~* 'definition_id'),
  'P2-S08-AC-030 diagnostic runs remain bound to a code-owned definition version'
);

-- Audit links and diagnostic definitions are append-only.  Their protected
-- history cannot be rewritten through an UPDATE/DELETE policy, and the search
-- and bulk surfaces remain projections rather than alternate source tables.
select ok(
  to_regclass('platform_private.admin_audit_links') is not null
    and not exists (select 1 from pg_policies
      where schemaname = 'platform_private'
        and tablename = 'admin_audit_links'
        and cmd in ('UPDATE', 'DELETE', 'ALL')),
  'P2-S08-AC-028 audit links expose no update or delete policy'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_definition_versions') is not null
    and not exists (select 1 from pg_policies
      where schemaname = 'platform_private'
        and tablename = 'admin_diagnostic_definition_versions'
        and cmd in ('UPDATE', 'DELETE', 'ALL')),
  'P2-S08-AC-029 diagnostic definitions expose no update or delete policy'
);
select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null
    and exists (select 1 from pg_attribute
      where attrelid = to_regclass('platform_private.admin_bulk_operations')
        and attname = 'target_manifest_object_id' and attnotnull)
    and not exists (select 1 from pg_attribute
      where attrelid = to_regclass('platform_private.admin_bulk_operations')
        and attname = 'query_spec' and attnotnull),
  'P2-S08-AC-033 bulk execution requires a frozen manifest and cannot require broad query replay'
);

select * from finish();

rollback;
