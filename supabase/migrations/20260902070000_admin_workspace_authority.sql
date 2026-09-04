begin;

-- Phase 2 / Slice 08: private admin-workspace projections and the three
-- currently active Worker boundaries.  Search and bulk execution remain
-- deferred; diagnostic records are forward foundations only.

create or replace function platform_private.admin_actions_valid(p_actions text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  action_name text;
begin
  if p_actions is null or pg_catalog.cardinality(p_actions) not between 1 and 16 then
    return false;
  end if;
  foreach action_name in array p_actions loop
    if action_name is null
       or action_name = '*'
       or action_name like '%*%'
       or action_name !~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$' then
      return false;
    end if;
  end loop;
  return true;
end;
$body$;

create or replace function platform_private.admin_result_codes_valid(p_codes text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  code text;
begin
  if p_codes is null or pg_catalog.cardinality(p_codes) > 32 then
    return false;
  end if;
  foreach code in array p_codes loop
    if code is null or code !~ '^[A-Z][A-Z0-9_]{2,63}$' then
      return false;
    end if;
  end loop;
  return true;
end;
$body$;

-- Admin grants are scoped to exactly one selected acting party.  Keeping this
-- check in a named immutable function lets the table boundary and the command
-- boundary enforce the same closed scope vocabulary.
create or replace function platform_private.admin_scope_valid(
  p_scope jsonb,
  p_acting_party_id uuid default null
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  scope_key text;
  scoped_party text;
begin
  if p_scope is null
     or pg_catalog.jsonb_typeof(p_scope) <> 'object'
     or not platform_private.cfg_json_bounded(p_scope, 4, 65536)
     or not (p_scope ? 'actingPartyId')
     or (select count(*) from pg_catalog.jsonb_object_keys(p_scope)) <> 1 then
    return false;
  end if;
  for scope_key in select pg_catalog.jsonb_object_keys(p_scope) loop
    if scope_key <> 'actingPartyId' then
      return false;
    end if;
  end loop;
  scoped_party := nullif(p_scope->>'actingPartyId', '');
  if not platform_private.cfg_valid_uuid(scoped_party) then
    return false;
  end if;
  return p_acting_party_id is null
    or scoped_party::uuid = p_acting_party_id;
end;
$body$;

create table platform_private.admin_task_projections (
  id uuid primary key default extensions.gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  source_version bigint not null,
  task_class text not null,
  required_capability text not null,
  assignee_person_id uuid references platform_private.person_party(party_id),
  due_at timestamptz,
  severity text not null,
  freshness_at timestamptz not null,
  freshness_state text not null,
  state text not null,
  source_status text not null,
  last_error_code text,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint admin_task_source_type_check check (
    source_type = pg_catalog.btrim(source_type)
    and source_type ~ '^[a-z][a-z0-9._-]{1,63}$'
  ),
  constraint admin_task_source_version_check check (source_version > 0),
  constraint admin_task_class_check check (
    task_class in (
      'approval', 'failed_job', 'schedule', 'expiring_right',
      'expiring_flag', 'hold', 'diagnostic', 'incident'
    )
  ),
  constraint admin_task_capability_check check (
    required_capability ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(required_capability) <= 128
  ),
  constraint admin_task_severity_check check (severity in ('info', 'warning', 'high', 'critical')),
  constraint admin_task_freshness_check check (
    freshness_state in ('healthy', 'stale', 'partial', 'unknown', 'failed')
  ),
  constraint admin_task_state_check check (
    state in ('open', 'assigned', 'blocked', 'completed', 'unknown')
  ),
  constraint admin_task_status_check check (
    pg_catalog.length(source_status) <= 64
  ),
  constraint admin_task_error_code_check check (
    last_error_code is null or last_error_code ~ '^[A-Z][A-Z0-9_]{2,63}$'
  ),
  constraint admin_task_source_unique unique (source_type, source_id, source_version, task_class)
);

create index admin_task_assignee_state_due_idx
  on platform_private.admin_task_projections (assignee_person_id, state, due_at);
create index admin_task_capability_freshness_idx
  on platform_private.admin_task_projections (required_capability, freshness_state);
create index admin_task_source_version_idx
  on platform_private.admin_task_projections (source_type, source_id, source_version desc);

create table platform_private.admin_capability_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  subject_person_id uuid not null references platform_private.person_party(party_id),
  capability_key text not null,
  resource_type text not null,
  resource_id uuid not null,
  scope jsonb not null,
  actions text[] not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  grantor_person_id uuid not null references platform_private.person_party(party_id),
  approver_person_id uuid references platform_private.person_party(party_id),
  reason text not null,
  purpose_grant boolean not null,
  state text not null,
  version_no bigint not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  revoked_at timestamptz,
  revoked_by uuid references platform_private.person_party(party_id),
  constraint admin_grant_capability_check check (
    capability_key ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(capability_key) <= 128
  ),
  constraint admin_grant_resource_check check (
    resource_type ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(resource_type) <= 128
  ),
  constraint admin_grant_scope_check check (
    platform_private.admin_scope_valid(scope)
  ),
  constraint admin_grant_actions_check check (
    pg_catalog.cardinality(actions) between 1 and 16
    and platform_private.admin_actions_valid(actions)
  ),
  constraint admin_grant_term_check check (ends_at > starts_at),
  constraint admin_grant_reason_check check (
    pg_catalog.length(pg_catalog.btrim(reason)) between 1 and 512
  ),
  constraint admin_grant_state_check check (
    state in ('pending', 'active', 'expired', 'revoked')
  ),
  constraint admin_grant_version_check check (version_no > 0),
  constraint admin_grant_purpose_action_check check (
    not purpose_grant or not (actions && array['grant', 'revoke']::text[])
  ),
  constraint admin_grant_revocation_check check (
    (state = 'revoked' and revoked_at is not null and revoked_by is not null)
    or (state <> 'revoked' and revoked_at is null and revoked_by is null)
  ),
  constraint admin_grant_id_version_unique unique (id, version_no)
);

create unique index admin_grant_one_active_idx
  on platform_private.admin_capability_grants (subject_person_id, capability_key, resource_type, resource_id)
  where state = 'active';
create index admin_grant_subject_state_expiry_idx
  on platform_private.admin_capability_grants (subject_person_id, state, ends_at);
create index admin_grant_grantor_created_idx
  on platform_private.admin_capability_grants (grantor_person_id, created_at desc);
create index admin_grant_resource_state_idx
  on platform_private.admin_capability_grants (capability_key, resource_type, resource_id, state);

create table platform_private.admin_bulk_operations (
  id uuid primary key default extensions.gen_random_uuid(),
  command_key text not null,
  command_version bigint not null,
  query_spec jsonb,
  target_manifest_object_id uuid not null references platform_private.object_records(id),
  target_manifest_hash text not null,
  target_count integer not null,
  dry_run_report jsonb,
  state text not null,
  cursor integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  skipped_count integer not null default 0,
  actor_person_id uuid not null references platform_private.person_party(party_id),
  acting_party_id uuid references platform_private.party(id),
  idempotency_key text not null,
  version_no bigint not null default 1,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  cancelled_at timestamptz,
  constraint admin_bulk_command_check check (
    command_key ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(command_key) <= 128
  ),
  constraint admin_bulk_command_version_check check (command_version > 0),
  constraint admin_bulk_query_spec_check check (
    query_spec is null
    or (pg_catalog.jsonb_typeof(query_spec) = 'object'
      and platform_private.cfg_json_bounded(query_spec, 4, 65536))
  ),
  constraint admin_bulk_manifest_hash_check check (target_manifest_hash ~ '^[a-f0-9]{64}$'),
  constraint admin_bulk_target_count_check check (target_count between 1 and 500),
  constraint admin_bulk_state_check check (
    state in ('draft', 'dry_run', 'approved', 'running', 'completed', 'partial', 'failed', 'cancelled')
  ),
  constraint admin_bulk_cursor_check check (cursor between 0 and 500 and cursor <= target_count),
  constraint admin_bulk_success_count_check check (success_count between 0 and 500),
  constraint admin_bulk_failure_count_check check (failure_count between 0 and 500),
  constraint admin_bulk_skipped_count_check check (skipped_count between 0 and 500),
  constraint admin_bulk_count_total_check check (
    success_count + failure_count + skipped_count <= target_count
  ),
  constraint admin_bulk_idempotency_key_check check (
    pg_catalog.length(idempotency_key) between 16 and 128
    and idempotency_key !~ '[[:cntrl:]]'
  ),
  constraint admin_bulk_version_check check (version_no > 0),
  constraint admin_bulk_cancelled_check check (
    (state = 'cancelled' and cancelled_at is not null)
    or (state <> 'cancelled' and cancelled_at is null)
  ),
  constraint admin_bulk_actor_idempotency_unique unique (actor_person_id, idempotency_key)
);

create index admin_bulk_state_updated_idx
  on platform_private.admin_bulk_operations (state, updated_at);
create index admin_bulk_command_state_idx
  on platform_private.admin_bulk_operations (command_key, command_version, state);
create index admin_bulk_manifest_hash_idx
  on platform_private.admin_bulk_operations (target_manifest_hash);
create index admin_bulk_party_created_idx
  on platform_private.admin_bulk_operations (acting_party_id, created_at desc);

create table platform_private.admin_bulk_item_results (
  id uuid primary key default extensions.gen_random_uuid(),
  operation_id uuid not null references platform_private.admin_bulk_operations(id),
  target_type text not null,
  target_id uuid not null,
  expected_version bigint not null,
  state text not null,
  attempt_count integer not null default 0,
  result_code text,
  result_summary jsonb,
  completed_at timestamptz,
  version_no bigint not null default 1,
  constraint admin_bulk_item_target_type_check check (
    target_type ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(target_type) <= 128
  ),
  constraint admin_bulk_item_expected_version_check check (expected_version > 0),
  constraint admin_bulk_item_state_check check (
    state in ('pending', 'succeeded', 'failed', 'skipped', 'cancelled')
  ),
  constraint admin_bulk_item_attempt_check check (attempt_count between 0 and 3),
  constraint admin_bulk_item_result_code_check check (
    result_code is null or result_code ~ '^[A-Z][A-Z0-9_]{2,63}$'
  ),
  constraint admin_bulk_item_summary_check check (
    result_summary is null
    or (pg_catalog.jsonb_typeof(result_summary) = 'object'
      and platform_private.cfg_json_bounded(result_summary, 4, 65536))
  ),
  constraint admin_bulk_item_completed_check check (
    (state = 'pending' and completed_at is null)
    or (state <> 'pending' and completed_at is not null)
  ),
  constraint admin_bulk_item_version_check check (version_no > 0),
  constraint admin_bulk_item_target_unique unique (operation_id, target_type, target_id)
);

create index admin_bulk_item_operation_state_idx
  on platform_private.admin_bulk_item_results (operation_id, state);
create index admin_bulk_item_target_idx
  on platform_private.admin_bulk_item_results (target_type, target_id);
create index admin_bulk_item_result_code_idx
  on platform_private.admin_bulk_item_results (result_code);

create table platform_private.admin_audit_links (
  id uuid primary key default extensions.gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  source_version bigint not null,
  content_revision_id uuid,
  change_id uuid,
  audit_event_id uuid references audit_private.audit_events(id),
  security_event_id uuid,
  financial_audit_id uuid,
  safe_label text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint admin_audit_source_type_check check (
    source_type = pg_catalog.btrim(source_type)
    and source_type ~ '^[a-z][a-z0-9._-]{1,63}$'
  ),
  constraint admin_audit_source_version_check check (source_version > 0),
  constraint admin_audit_safe_label_check check (
    pg_catalog.length(pg_catalog.btrim(safe_label)) between 1 and 128
  ),
  constraint admin_audit_link_target_check check (
    content_revision_id is not null
    or change_id is not null
    or audit_event_id is not null
    or security_event_id is not null
    or financial_audit_id is not null
  ),
  constraint admin_audit_source_label_unique unique (
    source_type, source_id, source_version, safe_label
  )
);

create index admin_audit_source_version_idx
  on platform_private.admin_audit_links (source_type, source_id, source_version);
create index admin_audit_content_revision_idx
  on platform_private.admin_audit_links (content_revision_id);
create index admin_audit_change_idx
  on platform_private.admin_audit_links (change_id);
create index admin_audit_event_idx
  on platform_private.admin_audit_links (audit_event_id);
create index admin_audit_security_event_idx
  on platform_private.admin_audit_links (security_event_id);
create index admin_audit_financial_idx
  on platform_private.admin_audit_links (financial_audit_id);

create table platform_private.admin_diagnostic_definition_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null,
  version_no bigint not null,
  owner_capability text not null,
  input_schema jsonb not null,
  timeout_ms integer not null,
  freshness_seconds integer not null,
  evidence_schema jsonb not null,
  severity_mapping jsonb not null,
  runbook_ref text not null,
  lifecycle text not null,
  hash text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint admin_diag_def_key_check check (
    key ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(key) <= 128
  ),
  constraint admin_diag_def_version_check check (version_no > 0),
  constraint admin_diag_def_owner_check check (
    owner_capability ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(owner_capability) <= 128
  ),
  constraint admin_diag_def_input_check check (
    pg_catalog.jsonb_typeof(input_schema) = 'object'
    and platform_private.cfg_json_bounded(input_schema, 4, 65536)
  ),
  constraint admin_diag_def_timeout_check check (timeout_ms between 100 and 2000),
  constraint admin_diag_def_freshness_check check (freshness_seconds between 1 and 604800),
  constraint admin_diag_def_evidence_check check (
    pg_catalog.jsonb_typeof(evidence_schema) = 'object'
    and platform_private.cfg_json_bounded(evidence_schema, 4, 65536)
  ),
  constraint admin_diag_def_severity_check check (
    pg_catalog.jsonb_typeof(severity_mapping) = 'object'
    and platform_private.cfg_json_bounded(severity_mapping, 4, 65536)
  ),
  constraint admin_diag_def_runbook_check check (
    pg_catalog.length(pg_catalog.btrim(runbook_ref)) between 1 and 256
  ),
  constraint admin_diag_def_lifecycle_check check (
    lifecycle in ('draft', 'active', 'deprecated', 'retired')
  ),
  constraint admin_diag_def_hash_check check (hash ~ '^[0-9a-f]{64}$'),
  constraint admin_diag_def_key_version_unique unique (key, version_no)
);

create index admin_diag_def_key_lifecycle_idx
  on platform_private.admin_diagnostic_definition_versions (key, lifecycle);
create index admin_diag_def_owner_idx
  on platform_private.admin_diagnostic_definition_versions (owner_capability);
create unique index admin_diag_def_one_active_idx
  on platform_private.admin_diagnostic_definition_versions (key)
  where lifecycle = 'active';

create table platform_private.admin_diagnostic_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  definition_id uuid not null references platform_private.admin_diagnostic_definition_versions(id),
  definition_version bigint not null,
  target_type text not null,
  target_id uuid not null,
  target_version bigint,
  state text not null,
  started_at timestamptz not null default pg_catalog.clock_timestamp(),
  completed_at timestamptz,
  evidence_ref text,
  result_codes text[] not null default '{}',
  freshness_at timestamptz,
  actor_person_id uuid references platform_private.person_party(party_id),
  job_id uuid references platform_private.jobs(id),
  version_no bigint not null default 1,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint admin_diag_run_definition_version_check check (definition_version > 0),
  constraint admin_diag_run_target_type_check check (
    target_type ~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
    and pg_catalog.length(target_type) <= 128
  ),
  constraint admin_diag_run_target_version_check check (
    target_version is null or target_version > 0
  ),
  constraint admin_diag_run_state_check check (
    state in ('unknown', 'running', 'healthy', 'stale', 'failed')
  ),
  constraint admin_diag_run_evidence_check check (
    evidence_ref is null or pg_catalog.length(evidence_ref) <= 256
  ),
  constraint admin_diag_run_codes_check check (platform_private.admin_result_codes_valid(result_codes)),
  constraint admin_diag_run_version_check check (version_no > 0),
  constraint admin_diag_run_completed_check check (
    (state = 'running' and completed_at is null)
    or (state <> 'running' and completed_at is not null)
  ),
  constraint admin_diag_run_unique unique (
    definition_id, definition_version, target_type, target_id, started_at
  )
);

create index admin_diag_run_target_idx
  on platform_private.admin_diagnostic_runs (target_type, target_id, target_version);
create index admin_diag_run_definition_idx
  on platform_private.admin_diagnostic_runs (definition_id, definition_version, created_at desc);
create index admin_diag_run_state_freshness_idx
  on platform_private.admin_diagnostic_runs (state, freshness_at);

-- Immutable diagnostic definitions and audit links retain provenance.  Grant
-- and bulk state transitions are intentionally left to their RPC boundaries.
create or replace function platform_private.admin_immutable_record()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
end;
$body$;

create trigger admin_audit_links_immutable
before update or delete on platform_private.admin_audit_links
for each row execute function platform_private.admin_immutable_record();

create trigger admin_diagnostic_definitions_immutable
before update or delete on platform_private.admin_diagnostic_definition_versions
for each row execute function platform_private.admin_immutable_record();

-- The marker is set only by the security-definer RPCs.  Direct callers have no
-- table privilege and, even if a future grant is misconfigured, no RLS path.
do $body$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_task_projections', 'admin_capability_grants',
    'admin_bulk_operations', 'admin_bulk_item_results',
    'admin_audit_links', 'admin_diagnostic_definition_versions',
    'admin_diagnostic_runs'
  ] loop
    execute format('alter table platform_private.%I enable row level security', table_name);
    execute format('alter table platform_private.%I force row level security', table_name);
    execute format('revoke all on table platform_private.%I from public, anon, authenticated, service_role', table_name);
    execute format('drop policy if exists %I on platform_private.%I', table_name || '_worker_policy', table_name);
    execute format(
      'create policy %I on platform_private.%I for all to service_role using (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''') with check (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')',
      table_name || '_worker_policy', table_name
    );
  end loop;

  -- Append-only foundation records have no UPDATE/DELETE policy at all.
  execute 'drop policy if exists admin_audit_links_worker_policy on platform_private.admin_audit_links';
  execute 'create policy admin_audit_links_worker_select on platform_private.admin_audit_links for select to service_role using (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')';
  execute 'create policy admin_audit_links_worker_insert on platform_private.admin_audit_links for insert to service_role with check (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')';
  execute 'drop policy if exists admin_diagnostic_definition_versions_worker_policy on platform_private.admin_diagnostic_definition_versions';
  execute 'create policy admin_diagnostic_definition_versions_worker_select on platform_private.admin_diagnostic_definition_versions for select to service_role using (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')';
  execute 'create policy admin_diagnostic_definition_versions_worker_insert on platform_private.admin_diagnostic_definition_versions for insert to service_role with check (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')';
  execute 'drop policy if exists admin_diagnostic_runs_worker_policy on platform_private.admin_diagnostic_runs';
  execute 'create policy admin_diagnostic_runs_worker_select on platform_private.admin_diagnostic_runs for select to service_role using (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')';
  execute 'create policy admin_diagnostic_runs_worker_insert on platform_private.admin_diagnostic_runs for insert to service_role with check (current_setting(''app.admin_rpc'', true) = ''true'' and current_setting(''app.admin_capability'', true) <> '''')';
end;
$body$;

create or replace function platform_private.admin_request_reserve(
  p_request jsonb,
  p_actor_id uuid,
  p_acting_party_id uuid
)
returns platform_private.idempotency_records
language plpgsql
security definer
set search_path = ''
as $body$
declare
  key_value text := nullif(p_request->>'idempotencyKey', '');
begin
  if p_request is null
     or p_actor_id is null
     or p_acting_party_id is null
     or key_value is null
     or pg_catalog.length(key_value) < 8
     or pg_catalog.length(key_value) > 256
     or key_value ~ '[[:cntrl:]]' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return platform_private.identity_idempotency_reserve(
    p_actor_id,
    'admin.capability.action:' || p_acting_party_id::text,
    platform_private.cfg_hash_text(key_value),
    platform_private.cfg_hash_text(
      platform_private.admin_business_request(p_request)::text
    )
  );
end;
$body$;

-- A grantor may delegate only a strict subset of its currently effective,
-- party-scoped authority.  Resource and capability wildcards are intentionally
-- unsupported, so every requested action must be covered by one parent row.
create or replace function platform_private.admin_grantor_can_delegate(
  p_actor_person_id uuid,
  p_acting_party_id uuid,
  p_capability_key text,
  p_resource_type text,
  p_resource_id uuid,
  p_scope jsonb,
  p_actions text[],
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $body$
  select p_actor_person_id is not null
     and p_acting_party_id is not null
     and p_capability_key is not null
     and p_resource_type is not null
     and p_resource_id is not null
     and p_actions is not null
     and p_starts_at is not null
     and p_ends_at is not null
     and p_ends_at > p_starts_at
     and platform_private.admin_scope_valid(p_scope, p_acting_party_id)
     and exists (
       select 1
         from platform_private.admin_capability_grants parent_grant
        where parent_grant.subject_person_id = p_actor_person_id
          and parent_grant.capability_key = p_capability_key
          and parent_grant.resource_type = p_resource_type
          and parent_grant.resource_id = p_resource_id
          and parent_grant.state = 'active'
          and parent_grant.starts_at <= pg_catalog.clock_timestamp()
          and parent_grant.ends_at > pg_catalog.clock_timestamp()
          and p_starts_at >= parent_grant.starts_at
          and p_ends_at <= parent_grant.ends_at
          and platform_private.admin_scope_valid(parent_grant.scope, p_acting_party_id)
          and not exists (
            select 1
              from pg_catalog.unnest(p_actions) requested(action_name)
             where requested.action_name <> all(parent_grant.actions)
          )
     );
$body$;

create or replace function platform_private.admin_capability_allows(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_capability_key text,
  p_resource_type text,
  p_resource_id uuid,
  p_action text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $body$
  select exists (
    select 1
      from platform_private.admin_capability_grants grant_row
     where grant_row.subject_person_id = platform_private.identity_actor_person(p_actor_id)
       and grant_row.capability_key = p_capability_key
       and grant_row.resource_type = p_resource_type
       and grant_row.resource_id = p_resource_id
       and p_action = any(grant_row.actions)
       and grant_row.state = 'active'
       and grant_row.starts_at <= pg_catalog.clock_timestamp()
       and grant_row.ends_at > pg_catalog.clock_timestamp()
       and platform_private.admin_scope_valid(grant_row.scope, p_acting_party_id)
  );
$body$;

-- Idempotency hashes cover only the business command.  Transport context
-- carries request/correlation trace IDs and must not turn an otherwise
-- identical retry into a hash conflict.
create or replace function platform_private.admin_business_request(p_request jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $body$
  select coalesce(p_request, '{}'::jsonb) - array['context', 'idempotencyKey']::text[]
$body$;

create or replace function platform_private.admin_inbox_cursor_encode(
  p_due_at timestamptz,
  p_task_id uuid
)
returns text
language sql
immutable
set search_path = ''
as $body$
  select pg_catalog.encode(
    pg_catalog.convert_to(coalesce(p_due_at::text, '') || '|' || p_task_id::text, 'utf8'),
    'hex'
  )
$body$;

-- Active inbox projection RPC.  Search and bulk are deliberately absent from
-- this migration; their private records are not an executable query surface.
create or replace function platform_api.admin_inbox(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor record;
  limit_value integer := 25;
  task_classes text[];
  states text[];
  stale_after_value timestamptz;
  cursor_value text;
  cursor_payload text;
  cursor_due_text text;
  cursor_due_at timestamptz;
  cursor_task_id uuid;
  cursor_due_is_null boolean := false;
  response jsonb;
begin
  perform pg_catalog.set_config('app.admin_rpc', 'true', true);
  perform pg_catalog.set_config('app.admin_capability', 'admin.inbox.read', true);
  perform platform_private.cfg_require_keys(
    p_request,
    array['cursor', 'limit', 'taskClasses', 'states', 'staleAfter', 'context']::text[],
    array[]::text[]
  );
  if p_request ? 'limit' then
    begin
      limit_value := (p_request->>'limit')::integer;
    exception when others then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end;
  end if;
  if limit_value not between 1 and 50 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  if p_request ? 'taskClasses' and p_request->'taskClasses' <> 'null'::jsonb then
    if pg_catalog.jsonb_typeof(p_request->'taskClasses') <> 'array'
       or pg_catalog.jsonb_array_length(p_request->'taskClasses') > 8 then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    task_classes := array(
      select value from pg_catalog.jsonb_array_elements_text(p_request->'taskClasses') value
    );
    if not platform_private.cfg_array_distinct(task_classes)
       or exists (
         select 1 from pg_catalog.unnest(task_classes) requested(value)
         where requested.value not in (
           'approval', 'failed_job', 'schedule', 'expiring_right',
           'expiring_flag', 'hold', 'diagnostic', 'incident'
         )
       ) then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
  end if;
  if p_request ? 'states' and p_request->'states' <> 'null'::jsonb then
    if pg_catalog.jsonb_typeof(p_request->'states') <> 'array'
       or pg_catalog.jsonb_array_length(p_request->'states') > 5 then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    states := array(
      select value from pg_catalog.jsonb_array_elements_text(p_request->'states') value
    );
    if not platform_private.cfg_array_distinct(states)
       or exists (
         select 1 from pg_catalog.unnest(states) requested(value)
         where requested.value not in ('open', 'assigned', 'blocked', 'completed', 'unknown')
       ) then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
  end if;
  if p_request ? 'staleAfter' and p_request->>'staleAfter' is not null then
    begin
      stale_after_value := (p_request->>'staleAfter')::timestamptz;
    exception when others then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end;
  end if;
  cursor_value := nullif(p_request->>'cursor', '');
  if cursor_value is not null then
    begin
      if cursor_value !~ '^[0-9a-f]+$' or pg_catalog.length(cursor_value) % 2 <> 0 then
        raise exception 'INVALID_REQUEST' using errcode = 'P0001';
      end if;
      cursor_payload := pg_catalog.convert_from(
        pg_catalog.decode(cursor_value, 'hex'), 'utf8'
      );
      if pg_catalog.strpos(cursor_payload, '|') < 1
         or pg_catalog.split_part(cursor_payload, '|', 3) <> '' then
        raise exception 'INVALID_REQUEST' using errcode = 'P0001';
      end if;
      cursor_due_text := pg_catalog.split_part(cursor_payload, '|', 1);
      cursor_task_id := platform_private.cfg_parse_uuid(
        pg_catalog.split_part(cursor_payload, '|', 2), 'INVALID_REQUEST'
      );
      if cursor_due_text = '' then
        cursor_due_is_null := true;
      else
        cursor_due_at := cursor_due_text::timestamptz;
      end if;
      if platform_private.admin_inbox_cursor_encode(cursor_due_at, cursor_task_id)
           <> pg_catalog.lower(cursor_value) then
        raise exception 'INVALID_REQUEST' using errcode = 'P0001';
      end if;
    exception when others then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end;
  end if;
  select * into actor from platform_private.cfg_request_actor(p_request, true);

  with eligible as (
    select task_row.*
      from platform_private.admin_task_projections task_row
     where platform_private.admin_capability_allows(
       actor.actor_id, actor.acting_party_id, task_row.required_capability,
       task_row.source_type, task_row.source_id, 'read'
     )
       and (task_classes is null or task_row.task_class = any(task_classes))
       and (states is null or task_row.state = any(states))
       and (stale_after_value is null or task_row.freshness_at <= stale_after_value)
       and (
         cursor_value is null
         or (cursor_due_is_null and task_row.due_at is null
             and task_row.id > cursor_task_id)
         or (not cursor_due_is_null and (
           task_row.due_at is null
           or task_row.due_at > cursor_due_at
           or (task_row.due_at = cursor_due_at and task_row.id > cursor_task_id)
         ))
       )
  ), paged as (
    select eligible.*, row_number() over (order by eligible.due_at asc nulls last, eligible.id) as page_position
      from eligible
  ), limited as (
    select * from paged where page_position <= limit_value + 1
  )
  select pg_catalog.jsonb_build_object(
    'items', coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'taskId', task.id,
      'sourceType', task.source_type,
      'sourceId', task.source_id,
      'sourceVersion', task.source_version::text,
      'taskClass', task.task_class,
      'requiredCapability', task.required_capability,
      'assigneePersonId', task.assignee_person_id,
      'dueAt', task.due_at,
      'severity', task.severity,
      'freshnessAt', task.freshness_at,
      'freshness', task.freshness_state,
      'state', task.state,
      'sourceStatus', task.source_status,
      'canAct', platform_private.admin_capability_allows(
        actor.actor_id, actor.acting_party_id, task.required_capability,
        task.source_type, task.source_id, 'read'
      )
    ) order by task.due_at asc nulls last, task.id)
      filter (where task.page_position <= limit_value), '[]'::jsonb),
     'nextCursor', case when count(*) filter (where task.page_position > limit_value) > 0
       then platform_private.admin_inbox_cursor_encode(
         (select page.due_at from limited page where page.page_position = limit_value),
         (select page.id from limited page where page.page_position = limit_value)
       )
       else null end,
     'aggregateFreshness', case
       when count(*) filter (where task.page_position <= limit_value) = 0 then 'unknown'
       when count(*) filter (where task.page_position <= limit_value
                               and task.freshness_state in ('failed', 'unknown')) > 0 then 'unknown'
       when count(*) filter (where task.page_position <= limit_value
                               and task.freshness_state in ('partial', 'stale')) > 0 then 'partial'
      else 'healthy'
    end,
    'partialSources', coalesce(pg_catalog.jsonb_agg(distinct task.source_type order by task.source_type)
      filter (where task.page_position <= limit_value
        and task.freshness_state in ('partial', 'stale', 'unknown', 'failed')), '[]'::jsonb),
    'generatedAt', pg_catalog.clock_timestamp()
  ) into response
    from limited task;
  return response;
end;
$body$;

-- Server-owned capability context used by the Worker composition.  The result
-- is deliberately an array of names only: no grant rows, resource IDs, or
-- other private authority metadata cross this boundary.
create or replace function platform_api.admin_context_capabilities(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor record;
  actor_person_id uuid;
  capabilities jsonb;
begin
  perform pg_catalog.set_config('app.admin_rpc', 'true', true);
  perform pg_catalog.set_config('app.admin_capability', 'admin.context.capabilities', true);
  perform platform_private.cfg_require_keys(
    p_request,
    array['context']::text[],
    array['context']::text[]
  );
  select * into actor from platform_private.cfg_request_actor(p_request, true);
  actor_person_id := platform_private.identity_actor_person(actor.actor_id);
  select coalesce(pg_catalog.jsonb_agg(candidate.capability_key order by candidate.capability_key), '[]'::jsonb)
    into capabilities
    from (
      select grant_row.capability_key
        from platform_private.admin_capability_grants grant_row
       where grant_row.subject_person_id = actor_person_id
         and grant_row.state = 'active'
         and grant_row.starts_at <= pg_catalog.clock_timestamp()
         and grant_row.ends_at > pg_catalog.clock_timestamp()
         and platform_private.admin_scope_valid(grant_row.scope, actor.acting_party_id)
      union
      select actor_grant.capability_code
        from identity_private.membership_tenure tenure
        join identity_private.organization_actor_grant actor_grant
          on actor_grant.organization_id = tenure.organization_id
         and actor_grant.person_id = tenure.person_id
       where tenure.organization_id = actor.acting_party_id
         and tenure.person_id = actor_person_id
         and tenure.state = 'confirmed'
         and tenure.starts_on <= current_date
         and (tenure.ends_on is null or tenure.ends_on >= current_date)
         and actor_grant.active
         and actor_grant.active
         and actor_grant.valid_from <= current_date
         and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
    ) candidate;
  return capabilities;
end;
$body$;

-- Active capability grant/revoke boundary.  It persists bounded grants plus
-- immutable audit/outbox intent; delivery is owned by the later admin slice.
create or replace function platform_api.admin_capability_action(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor record;
  action_name text := p_request->>'action';
  reservation platform_private.idempotency_records;
  grant_row platform_private.admin_capability_grants%rowtype;
  grant_id uuid;
  expected_version bigint;
  state_name text;
  output jsonb;
  actor_person_id uuid;
  subject_person_id uuid;
  capability_key text;
  resource_type text;
  resource_id uuid;
  scope_value jsonb;
  requested_actions text[];
  starts_at_value timestamptz;
  ends_at_value timestamptz;
  approver_person_id uuid;
  correlation_id uuid;
  outbox_event_id uuid;
begin
  perform pg_catalog.set_config('app.admin_rpc', 'true', true);
  perform pg_catalog.set_config('app.admin_capability', 'admin.capability.grant', true);
  perform platform_private.cfg_require_keys(
    p_request,
    array[
      'action', 'grantId', 'expectedVersion', 'subjectPersonId', 'capabilityKey',
      'resourceType', 'resourceId', 'scope', 'actions', 'startsAt', 'endsAt',
      'reason', 'approverPersonId', 'purposeGrant', 'stepUpToken',
      'idempotencyKey', 'ifMatch', 'context'
    ]::text[],
    array[]::text[]
  );
  select * into actor from platform_private.cfg_request_actor(p_request, true);
  if action_name not in ('create', 'revoke') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  actor_person_id := platform_private.identity_actor_person(actor.actor_id);

  -- Reserve before branch validation and before any write.  The operation key
  -- includes the selected party, preventing cross-party replay collisions for
  -- one actor while retaining the database-level hash conflict check.
  reservation := platform_private.admin_request_reserve(
    p_request, actor.actor_id, actor.acting_party_id
  );
  if reservation.state = 'completed'::platform_private.idempotency_state then
    output := reservation.response_ref->'responseBody';
    if output is null or pg_catalog.jsonb_typeof(output) <> 'object' then
      raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
    end if;
    return output;
  end if;
  if reservation.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
       set state = 'reserved', response_ref = null
     where id = reservation.id;
  end if;
  correlation_id := platform_private.cfg_correlation(p_request);

  if action_name = 'create' then
    if coalesce(pg_catalog.jsonb_typeof(p_request->'actions'), '') <> 'array'
       or not platform_private.cfg_valid_uuid(p_request->>'subjectPersonId')
       or not platform_private.cfg_valid_uuid(p_request->>'resourceId')
       or not platform_private.admin_scope_valid(p_request->'scope', actor.acting_party_id)
       or nullif(pg_catalog.btrim(p_request->>'capabilityKey'), '') is null
       or p_request->>'capabilityKey' !~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
       or nullif(pg_catalog.btrim(p_request->>'resourceType'), '') is null
       or p_request->>'resourceType' !~ '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$'
       or p_request->>'startsAt' is null
       or p_request->>'endsAt' is null
       or nullif(pg_catalog.btrim(p_request->>'reason'), '') is null
       or p_request->>'purposeGrant' not in ('true', 'false') then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end if;
    requested_actions := array(
      select value from pg_catalog.jsonb_array_elements_text(p_request->'actions') value
    );
    if not platform_private.admin_actions_valid(requested_actions) then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end if;
    begin
      starts_at_value := (p_request->>'startsAt')::timestamptz;
      ends_at_value := (p_request->>'endsAt')::timestamptz;
    exception when others then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end;
    if ends_at_value <= starts_at_value then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from pg_catalog.unnest(requested_actions) action_value
       where action_value in ('grant', 'revoke')
    ) and p_request->>'purposeGrant' = 'true' then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end if;
    subject_person_id := (p_request->>'subjectPersonId')::uuid;
    capability_key := pg_catalog.btrim(p_request->>'capabilityKey');
    resource_type := pg_catalog.btrim(p_request->>'resourceType');
    resource_id := (p_request->>'resourceId')::uuid;
    scope_value := p_request->'scope';
    if not exists (
      select 1 from platform_private.person_party person
       where person.party_id = subject_person_id
         and person.account_state in ('claimed', 'active')
    ) then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end if;
    if resource_type = 'person' and not exists (
      select 1 from platform_private.person_party person
       where person.party_id = resource_id
         and person.account_state in ('claimed', 'active')
    ) then
      raise exception 'GRANT_INVALID' using errcode = 'P0001';
    end if;
    if p_request->>'approverPersonId' is not null then
      if not platform_private.cfg_valid_uuid(p_request->>'approverPersonId') then
        raise exception 'GRANT_INVALID' using errcode = 'P0001';
      end if;
      approver_person_id := (p_request->>'approverPersonId')::uuid;
      if not exists (
        select 1 from platform_private.person_party person
         where person.party_id = approver_person_id
           and person.account_state in ('claimed', 'active')
      ) then
        raise exception 'GRANT_INVALID' using errcode = 'P0001';
      end if;
    end if;
    if p_request->>'purposeGrant' = 'true' then
      if approver_person_id is null or approver_person_id = actor_person_id then
        raise exception 'GRANT_INVALID' using errcode = 'P0001';
      end if;
      perform platform_private.cfg_require_fresh_step_up(p_request);
    end if;
    perform platform_private.cfg_require_capability(
      actor.actor_id, actor.acting_party_id, 'admin.capability.grant'
    );
    if not platform_private.admin_grantor_can_delegate(
      actor_person_id, actor.acting_party_id, capability_key, resource_type,
      resource_id, scope_value, requested_actions, starts_at_value, ends_at_value
    ) then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    grant_id := extensions.gen_random_uuid();
    begin
      insert into platform_private.admin_capability_grants(
        id, subject_person_id, capability_key, resource_type, resource_id, scope,
        actions, starts_at, ends_at, grantor_person_id, approver_person_id, reason,
        purpose_grant, state, version_no
      ) values (
        grant_id, subject_person_id, capability_key, resource_type, resource_id,
        scope_value, requested_actions, starts_at_value, ends_at_value,
        actor_person_id, approver_person_id, pg_catalog.btrim(p_request->>'reason'),
        (p_request->>'purposeGrant')::boolean, 'active', 1
      );
    exception when unique_violation then
      raise exception 'GRANT_CONFLICT' using errcode = 'P0001';
    end;
    state_name := 'active';
    expected_version := 1;
  else
    grant_id := platform_private.cfg_parse_uuid(
      p_request->>'grantId', 'GRANT_NOT_FOUND'
    );
    if p_request->>'ifMatch' is not null then
      expected_version := platform_private.cfg_parse_version(
        p_request->>'ifMatch', 'GRANT_VERSION_CONFLICT'
      );
      if p_request->>'expectedVersion' is not null
         and platform_private.cfg_parse_version(
           p_request->>'expectedVersion', 'GRANT_VERSION_CONFLICT'
         ) <> expected_version then
        raise exception 'GRANT_VERSION_CONFLICT' using errcode = 'P0001';
      end if;
    else
      expected_version := platform_private.cfg_parse_version(
        p_request->>'expectedVersion', 'GRANT_VERSION_CONFLICT'
      );
    end if;
    perform platform_private.cfg_require_capability(
      actor.actor_id, actor.acting_party_id, 'admin.capability.grant'
    );
    select * into grant_row
      from platform_private.admin_capability_grants candidate
     where candidate.id = grant_id
     for update;
    if not found
       or grant_row.grantor_person_id <> actor_person_id
       or not platform_private.admin_scope_valid(grant_row.scope, actor.acting_party_id) then
      raise exception 'GRANT_NOT_FOUND' using errcode = 'P0001';
    end if;
    if grant_row.state <> 'active' or grant_row.version_no <> expected_version then
      raise exception 'GRANT_VERSION_CONFLICT' using errcode = 'P0001';
    end if;
    update platform_private.admin_capability_grants candidate
       set state = 'revoked', revoked_at = pg_catalog.clock_timestamp(),
           revoked_by = actor_person_id, version_no = candidate.version_no + 1
     where candidate.id = grant_id
       and candidate.version_no = expected_version
       and candidate.state = 'active'
       and candidate.grantor_person_id = actor_person_id
     returning candidate.* into grant_row;
    if not found then
      raise exception 'GRANT_VERSION_CONFLICT' using errcode = 'P0001';
    end if;
    state_name := grant_row.state;
    expected_version := grant_row.version_no;
  end if;

  if action_name = 'create' then
    output := pg_catalog.jsonb_build_object(
      'grantId', grant_id,
      'subjectPersonId', subject_person_id,
      'capabilityKey', capability_key,
      'resourceType', resource_type,
      'resourceId', resource_id,
      'state', state_name,
      'startsAt', starts_at_value,
      'endsAt', ends_at_value,
      'version', expected_version::text,
      'notificationTaskId', null,
      'outboxEventId', null
    );
  else
    output := pg_catalog.jsonb_build_object(
      'grantId', grant_row.id,
      'subjectPersonId', grant_row.subject_person_id,
      'capabilityKey', grant_row.capability_key,
      'resourceType', grant_row.resource_type,
      'resourceId', grant_row.resource_id,
      'state', grant_row.state,
      'startsAt', grant_row.starts_at,
      'endsAt', grant_row.ends_at,
      'version', grant_row.version_no::text,
      'notificationTaskId', null,
      'outboxEventId', null
    );
  end if;
  outbox_event_id := platform_private.cfg_emit_effects(
    case when action_name = 'create' then 'admin.capability.create' else 'admin.capability.revoke' end,
    actor.actor_id, actor.acting_party_id, 'admin_capability_grant', grant_id,
    case when action_name = 'create' then 'ADMIN_CAPABILITY_CREATED' else 'ADMIN_CAPABILITY_REVOKED' end,
    'admin.capability.changed.v1', 'admin_capability_grant', grant_id,
    expected_version,
    pg_catalog.jsonb_build_object(
      'grantId', grant_id, 'subjectPersonId',
      case when action_name = 'create' then subject_person_id else grant_row.subject_person_id end,
      'state', state_name, 'version', expected_version
    ),
    correlation_id
  );
  output := pg_catalog.jsonb_set(output, '{outboxEventId}', pg_catalog.to_jsonb(outbox_event_id), true);
  perform platform_private.cfg_request_complete(
    reservation.id, case when action_name = 'create' then 201 else 200 end, output
  );
  return output;
end;
$body$;

-- The combined audit/diagnostic API is active only for the read-audit branch.
-- Diagnostic definition/run records remain ungranted foundations and any run
-- request fails closed until its later activation slice.
create or replace function platform_api.admin_audit_diagnostic(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor record;
  link_row platform_private.admin_audit_links%rowtype;
  audit_event_at timestamptz;
  security_event_at timestamptz;
  evidence_at timestamptz;
  expected_freshness_at timestamptz;
  evidence_ref text;
  state_name text;
  target_id uuid;
  target_version bigint;
  audit_link_id uuid;
  expected_if_match bigint;
  reservation platform_private.idempotency_records;
  key_value text;
  output jsonb;
begin
  perform pg_catalog.set_config('app.admin_rpc', 'true', true);
  perform pg_catalog.set_config('app.admin_capability', 'admin.audit.read', true);
  perform platform_private.cfg_require_keys(
    p_request,
    array[
      'action', 'targetType', 'targetId', 'targetVersion', 'auditLinkId',
      'diagnosticDefinitionKey', 'diagnosticDefinitionVersion', 'input',
      'expectedFreshnessAt', 'reason', 'context', 'idempotencyKey', 'ifMatch'
    ]::text[],
    array[]::text[]
  );
  if p_request->>'action' <> 'read_audit' then
    raise exception 'DIAGNOSTIC_UNAVAILABLE' using errcode = 'P0001';
  end if;
  select * into actor from platform_private.cfg_request_actor(p_request, true);
  audit_link_id := platform_private.cfg_parse_uuid(
    p_request->>'auditLinkId', 'AUDIT_TARGET_NOT_FOUND'
  );
  target_id := platform_private.cfg_parse_uuid(
    p_request->>'targetId', 'AUDIT_TARGET_NOT_FOUND'
  );
  if p_request->>'targetVersion' is not null then
    target_version := platform_private.cfg_parse_version(
      p_request->>'targetVersion', 'AUDIT_TARGET_NOT_FOUND'
    );
  end if;
  if p_request->>'ifMatch' is not null then
    expected_if_match := platform_private.cfg_parse_version(
      p_request->>'ifMatch', 'DIAGNOSTIC_VERSION_CONFLICT'
    );
    if target_version is null or target_version <> expected_if_match then
      raise exception 'DIAGNOSTIC_VERSION_CONFLICT' using errcode = 'P0001';
    end if;
  end if;
  key_value := nullif(p_request->>'idempotencyKey', '');
  if key_value is not null then
    if pg_catalog.length(key_value) < 8
       or pg_catalog.length(key_value) > 256
       or key_value ~ '[[:cntrl:]]' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    reservation := platform_private.identity_idempotency_reserve(
      actor.actor_id,
      'admin.audit.diagnostic:' || actor.acting_party_id::text,
      platform_private.cfg_hash_text(key_value),
      platform_private.cfg_hash_text(
        platform_private.admin_business_request(p_request)::text
      )
    );
    if reservation.state = 'completed'::platform_private.idempotency_state then
      output := reservation.response_ref->'responseBody';
      if output is null or pg_catalog.jsonb_typeof(output) <> 'object' then
        raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
      end if;
      return output;
    end if;
    if reservation.state = 'failed_retryable'::platform_private.idempotency_state then
      update platform_private.idempotency_records
         set state = 'reserved', response_ref = null
       where id = reservation.id;
    end if;
  end if;
  select link.* into link_row
    from platform_private.admin_audit_links link
   where link.id = audit_link_id
     and link.source_type = p_request->>'targetType'
     and link.source_id = target_id
     and (
       target_version is null
       or link.source_version = target_version
     );
  if not found then
    raise exception 'AUDIT_TARGET_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not platform_private.admin_capability_allows(
    actor.actor_id, actor.acting_party_id, 'admin.audit.read',
    link_row.source_type, link_row.source_id, 'read'
  ) then
    -- Existing unauthorized records and nonexistent records intentionally use
    -- the same response so link existence cannot be enumerated.
    raise exception 'AUDIT_TARGET_NOT_FOUND' using errcode = 'P0001';
  end if;
  if link_row.audit_event_id is not null then
    select event.occurred_at into audit_event_at
      from audit_private.audit_events event
     where event.id = link_row.audit_event_id;
  end if;
  if link_row.security_event_id is not null then
    select event.occurred_at into security_event_at
      from identity.security_events event
     where event.id = link_row.security_event_id;
  end if;
  evidence_at := case
    when audit_event_at is null then security_event_at
    when security_event_at is null then audit_event_at
    else greatest(audit_event_at, security_event_at)
  end;
  if p_request->>'expectedFreshnessAt' is not null then
    begin
      expected_freshness_at := (p_request->>'expectedFreshnessAt')::timestamptz;
    exception when others then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end;
  end if;
  if evidence_at is null then
    state_name := 'unknown';
  elsif expected_freshness_at is not null and evidence_at < expected_freshness_at then
    state_name := 'stale';
  else
    state_name := 'healthy';
  end if;
  if evidence_at is not null then
    if security_event_at is not null
       and (audit_event_at is null or security_event_at >= audit_event_at) then
      evidence_ref := link_row.security_event_id::text;
    else
      evidence_ref := link_row.audit_event_id::text;
    end if;
  end if;
  output := pg_catalog.jsonb_build_object(
    'action', 'read_audit',
    'auditLinkId', link_row.id,
    'diagnosticRunId', null,
    'targetType', link_row.source_type,
    'targetId', link_row.source_id,
    'targetVersion', link_row.source_version::text,
    'state', state_name,
    'freshnessAt', evidence_at,
    'evidenceRef', evidence_ref,
    'resultCodes', '[]'::jsonb,
    'outboxEventId', null
  );
  if reservation.id is not null then
    perform platform_private.cfg_request_complete(reservation.id, 200, output);
  end if;
  return output;
end;
$body$;

revoke all on function platform_api.admin_inbox(jsonb),
  platform_api.admin_capability_action(jsonb),
  platform_api.admin_audit_diagnostic(jsonb),
  platform_api.admin_context_capabilities(jsonb)
from public, anon, authenticated, service_role;
grant execute on function platform_api.admin_inbox(jsonb),
  platform_api.admin_capability_action(jsonb),
  platform_api.admin_audit_diagnostic(jsonb),
  platform_api.admin_context_capabilities(jsonb)
to service_role;

revoke all on function platform_private.admin_actions_valid(text[]),
  platform_private.admin_result_codes_valid(text[]),
  platform_private.admin_scope_valid(jsonb, uuid),
  platform_private.admin_business_request(jsonb),
  platform_private.admin_inbox_cursor_encode(timestamptz, uuid),
  platform_private.admin_request_reserve(jsonb, uuid, uuid),
  platform_private.admin_grantor_can_delegate(uuid, uuid, text, text, uuid, jsonb, text[], timestamptz, timestamptz),
  platform_private.admin_immutable_record(),
  platform_private.admin_capability_allows(uuid, uuid, text, text, uuid, text)
from public, anon, authenticated, service_role;

commit;
