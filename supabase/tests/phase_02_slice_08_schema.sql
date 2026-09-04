begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Slice 08 QA-RED.  These catalog assertions mirror BE05b's locked
-- persistence table exactly and remain safe while the migration is absent.
-- P2-S08-AC-024..030.

select ok(
  to_regclass('platform_private.admin_task_projections') is not null,
  'P2-S08-AC-024 admin_task_projections relation exists'
);
select ok(
  to_regclass('platform_private.admin_task_projections') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_task_projections')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'source_type', 'source_id', 'source_version', 'task_class',
          'required_capability', 'assignee_person_id', 'due_at', 'severity',
          'freshness_at', 'freshness_state', 'state', 'source_status',
          'last_error_code', 'created_at', 'updated_at'
        ]::name[])) = 16,
  'P2-S08-AC-024 admin_task_projections has all locked authority columns'
);

select ok(
  to_regclass('platform_private.admin_capability_grants') is not null,
  'P2-S08-AC-025 admin_capability_grants relation exists'
);
select ok(
  to_regclass('platform_private.admin_capability_grants') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_capability_grants')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'subject_person_id', 'capability_key', 'resource_type',
          'resource_id', 'scope', 'actions', 'starts_at', 'ends_at',
          'grantor_person_id', 'approver_person_id', 'reason', 'purpose_grant',
          'state', 'version_no', 'created_at', 'revoked_at', 'revoked_by'
        ]::name[])) = 18,
  'P2-S08-AC-025 admin_capability_grants has finite grant and audit columns'
);

select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null,
  'P2-S08-AC-026 admin_bulk_operations relation exists'
);
select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_bulk_operations')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'command_key', 'command_version', 'query_spec',
          'target_manifest_object_id', 'target_manifest_hash', 'target_count',
          'dry_run_report', 'state', 'cursor', 'success_count', 'failure_count',
          'skipped_count', 'actor_person_id', 'acting_party_id',
          'idempotency_key', 'version_no', 'created_at', 'updated_at',
          'cancelled_at'
        ]::name[])) = 20,
  'P2-S08-AC-026 admin_bulk_operations has manifest, version, and replay columns'
);

select ok(
  to_regclass('platform_private.admin_bulk_item_results') is not null,
  'P2-S08-AC-027 admin_bulk_item_results relation exists'
);
select ok(
  to_regclass('platform_private.admin_bulk_item_results') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_bulk_item_results')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'operation_id', 'target_type', 'target_id', 'expected_version',
          'state', 'attempt_count', 'result_code', 'result_summary',
          'completed_at', 'version_no'
        ]::name[])) = 11,
  'P2-S08-AC-027 admin_bulk_item_results has per-target outcome and version columns'
);

select ok(
  to_regclass('platform_private.admin_audit_links') is not null,
  'P2-S08-AC-028 admin_audit_links relation exists'
);
select ok(
  to_regclass('platform_private.admin_audit_links') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_audit_links')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'source_type', 'source_id', 'source_version',
          'content_revision_id', 'change_id', 'audit_event_id',
          'security_event_id', 'financial_audit_id', 'safe_label', 'created_at'
        ]::name[])) = 11,
  'P2-S08-AC-028 admin_audit_links has identifier-only provenance columns'
);

select ok(
  to_regclass('platform_private.admin_diagnostic_definition_versions') is not null,
  'P2-S08-AC-029 admin_diagnostic_definition_versions relation exists'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_definition_versions') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_diagnostic_definition_versions')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'key', 'version_no', 'owner_capability', 'input_schema',
          'timeout_ms', 'freshness_seconds', 'evidence_schema',
          'severity_mapping', 'runbook_ref', 'lifecycle', 'hash', 'created_at'
        ]::name[])) = 13,
  'P2-S08-AC-029 diagnostic definitions are immutable bounded registry versions'
);

select ok(
  to_regclass('platform_private.admin_diagnostic_runs') is not null,
  'P2-S08-AC-030 admin_diagnostic_runs relation exists'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_runs') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.admin_diagnostic_runs')
        and attnum > 0 and not attisdropped
        and attname = any (array[
          'id', 'definition_id', 'definition_version', 'target_type', 'target_id',
          'target_version', 'state', 'started_at', 'completed_at', 'evidence_ref',
          'result_codes', 'freshness_at', 'actor_person_id', 'job_id',
          'version_no', 'created_at'
        ]::name[])) = 16,
  'P2-S08-AC-030 diagnostic runs bind definition, target, freshness, and evidence reference'
);

-- Every canonical record is versioned and keyed.  Constraint predicates are
-- inspected instead of inserting fixtures so RED remains non-destructive.
select ok(
  coalesce((select bool_and(exists (
    select 1 from pg_constraint c
    where c.conrelid = to_regclass(t.table_name)
      and c.contype = 'p'
  )) from (values
    ('platform_private.admin_task_projections'),
    ('platform_private.admin_capability_grants'),
    ('platform_private.admin_bulk_operations'),
    ('platform_private.admin_bulk_item_results'),
    ('platform_private.admin_audit_links'),
    ('platform_private.admin_diagnostic_definition_versions'),
    ('platform_private.admin_diagnostic_runs')
  ) as t(table_name)), false),
  'P2-S08 all seven admin records have a primary key'
);

select ok(
  to_regclass('platform_private.admin_task_projections') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_task_projections')
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) ~* 'source_type.*source_id.*source_version.*task_class'),
  'P2-S08-AC-024 task projections reject duplicate source/version/class rows'
);
select ok(
  to_regclass('platform_private.admin_bulk_operations') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_operations')
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) ~* 'actor_person_id.*idempotency_key'),
  'P2-S08-AC-026 bulk operations provide actor-scoped idempotency uniqueness'
);
select ok(
  to_regclass('platform_private.admin_bulk_item_results') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_bulk_item_results')
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) ~* 'operation_id.*target_type.*target_id'),
  'P2-S08-AC-027 bulk item results prevent duplicate target commands'
);
select ok(
  to_regclass('platform_private.admin_audit_links') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_audit_links')
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) ~* 'source_type.*source_id.*source_version.*safe_label'),
  'P2-S08-AC-028 audit links preserve one immutable label per source version'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_definition_versions') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_definition_versions')
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) ~* 'key.*version_no'),
  'P2-S08-AC-029 diagnostic definitions preserve immutable key/version identity'
);
select ok(
  to_regclass('platform_private.admin_diagnostic_runs') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.admin_diagnostic_runs')
        and c.contype = 'u'
        and pg_get_constraintdef(c.oid) ~* 'definition_id.*definition_version.*target_type.*target_id.*started_at'),
  'P2-S08-AC-030 diagnostic runs prevent duplicate definition/target starts'
);

select * from finish();

rollback;
