-- AC265 CP-02: private approved safe-resource and runner-mapping registry.
--
-- This is intentionally forward-only.  Registry rows are independently
-- approved control-plane facts and are immutable once inserted; rollback by
-- deleting them would destroy the evidence boundary.  The migration must be
-- applied as a reviewed deployment with a database backup, never rewritten.
-- No raw locators, resource contents, credentials, caller timestamps, or
-- caller-supplied identity/project scope are accepted or retained.

create table platform_private.ac265_approved_safe_resources (
  resource_id uuid primary key default extensions.gen_random_uuid(),
  resource_ref text not null,
  resource_sha256 bytea not null,
  resource_kind text not null,
  locator_sha256 bytea not null,
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  candidate_id uuid not null,
  run_id uuid not null,
  identity_sha256 bytea not null,
  environment text not null,
  source_revision text not null,
  deployment_id text not null,
  hosting_project_id text not null,
  supabase_project_ref text not null,
  approved_at timestamptz not null,
  idempotency_ref text not null,
  request_sha256 bytea not null,
  constraint ac265_approved_safe_resources_resource_ref_unique
    unique (resource_ref),
  constraint ac265_approved_safe_resources_one_kind_per_authorization
    unique (authorization_id, resource_kind),
  constraint ac265_approved_safe_resources_idempotency_unique
    unique (authorization_id, idempotency_ref),
  constraint ac265_approved_safe_resources_resource_ref_shape
    check (
      resource_ref ~ '^ac265-resource://(?:content_schema|staff_case|organization|prerequisite)/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_approved_safe_resources_resource_sha256_length
    check (octet_length(resource_sha256) = 32),
  constraint ac265_approved_safe_resources_resource_sha256_matches_ref
    check (
      resource_sha256 = extensions.digest(convert_to(resource_ref, 'utf8'), 'sha256')
    ),
  constraint ac265_approved_safe_resources_kind
    check (resource_kind in ('content_schema', 'staff_case', 'organization', 'prerequisite')),
  constraint ac265_approved_safe_resources_locator_sha256_length
    check (octet_length(locator_sha256) = 32),
  constraint ac265_approved_safe_resources_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_approved_safe_resources_environment
    check (environment = 'staging'),
  constraint ac265_approved_safe_resources_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_approved_safe_resources_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_safe_resources_hosting_project_id_format
    check (hosting_project_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_safe_resources_hosting_project_id_scope
    check (hosting_project_id = 'wejammin-staging'),
  constraint ac265_approved_safe_resources_supabase_project_ref_format
    check (supabase_project_ref ~ '^[a-z0-9]{20}$'),
  constraint ac265_approved_safe_resources_idempotency_ref_shape
    check (
      idempotency_ref ~ '^ac265-idempotency://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_approved_safe_resources_request_sha256_length
    check (octet_length(request_sha256) = 32)
);

create table platform_private.ac265_approved_runner_mappings (
  mapping_id uuid primary key default extensions.gen_random_uuid(),
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  candidate_id uuid not null,
  run_id uuid not null,
  identity_sha256 bytea not null,
  identity jsonb not null,
  environment text not null,
  source_revision text not null,
  deployment_id text not null,
  hosting_project_id text not null,
  supabase_project_ref text not null,
  approved_at timestamptz not null,
  idempotency_ref text not null,
  request_sha256 bytea not null,
  constraint ac265_approved_runner_mappings_one_per_run_authorization
    unique (authorization_id, run_id),
  constraint ac265_approved_runner_mappings_idempotency_unique
    unique (authorization_id, idempotency_ref),
  constraint ac265_approved_runner_mappings_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_approved_runner_mappings_identity_shape
    check (jsonb_typeof(identity) = 'object'),
  constraint ac265_approved_runner_mappings_environment
    check (environment = 'staging'),
  constraint ac265_approved_runner_mappings_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_approved_runner_mappings_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_runner_mappings_hosting_project_id_format
    check (hosting_project_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_runner_mappings_hosting_project_id_scope
    check (hosting_project_id = 'wejammin-staging'),
  constraint ac265_approved_runner_mappings_supabase_project_ref_format
    check (supabase_project_ref ~ '^[a-z0-9]{20}$'),
  constraint ac265_approved_runner_mappings_idempotency_ref_shape
    check (
      idempotency_ref ~ '^ac265-idempotency://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_approved_runner_mappings_request_sha256_length
    check (octet_length(request_sha256) = 32)
);

create table platform_private.ac265_approved_runner_mapping_resources (
  mapping_resource_id uuid primary key default extensions.gen_random_uuid(),
  mapping_id uuid not null
    references platform_private.ac265_approved_runner_mappings (mapping_id),
  resource_id uuid not null
    references platform_private.ac265_approved_safe_resources (resource_id),
  role_key text not null,
  ordinal integer not null,
  constraint ac265_approved_runner_mapping_resources_role_key
    check (role_key in (
      'entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted',
      'business_mandate', 'staff_case_scoped', 'admin_step_up',
      'forbidden_hidden', 'disabled_prerequisite'
    )),
  constraint ac265_approved_runner_mapping_resources_ordinal_positive
    check (ordinal > 0),
  constraint ac265_approved_runner_mapping_resources_role_resource_unique
    unique (mapping_id, role_key, resource_id)
);

create table platform_private.ac265_approved_runner_mapping_scenarios (
  mapping_scenario_id uuid primary key default extensions.gen_random_uuid(),
  mapping_id uuid not null
    references platform_private.ac265_approved_runner_mappings (mapping_id),
  scenario_key text not null,
  role_key text not null,
  ordinal integer not null,
  constraint ac265_approved_runner_mapping_scenarios_scenario_key
    check (scenario_key in (
      'idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions',
      'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab',
      'auth_expiry', 'rate_limit_429', 'dependency_outage'
    )),
  constraint ac265_approved_runner_mapping_scenarios_role_key
    check (role_key in (
      'entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted',
      'business_mandate', 'staff_case_scoped', 'admin_step_up',
      'forbidden_hidden', 'disabled_prerequisite'
    )),
  constraint ac265_approved_runner_mapping_scenarios_ordinal_positive
    check (ordinal > 0),
  constraint ac265_approved_runner_mapping_scenarios_role_unique
    unique (mapping_id, scenario_key, role_key)
);

-- CP-02 deliberately uses insert fences instead of candidate foreign keys.
-- CP-01's immutable candidate registry must retain its stable TRUNCATE
-- mutation behavior while every new row is still checked at insertion time.
create function platform_private.ac265_validate_approved_safe_resource_candidate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_verified_candidates as candidate
    where candidate.candidate_id = new.candidate_id
  ) then
    raise exception 'AC265 approved safe resource candidate does not exist'
      using errcode = '23503';
  end if;
  return new;
end;
$function$;

create function platform_private.ac265_validate_approved_runner_mapping_candidate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_verified_candidates as candidate
    join platform_private.ac265_runner_authorizations as authz
      on authz.authorization_id = new.authorization_id
    where candidate.candidate_id = new.candidate_id
      and authz.run_id = new.run_id
      and authz.identity_sha256 = candidate.identity_sha256
      and authz.source_revision = candidate.source_revision
      and authz.deployment_id = candidate.deployment_id
      and new.identity_sha256 = candidate.identity_sha256
      and new.identity = candidate.identity
      and new.source_revision = candidate.source_revision
      and new.deployment_id = candidate.deployment_id
      and new.environment = candidate.identity ->> 'environment'
      and new.hosting_project_id = candidate.identity ->> 'hostingProjectId'
      and new.supabase_project_ref = candidate.identity ->> 'supabaseProjectRef'
  ) then
    raise exception 'AC265 approved runner mapping candidate binding is invalid'
      using errcode = '23503';
  end if;
  return new;
end;
$function$;

create function platform_private.ac265_reject_approved_safe_resource_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved safe resources are immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_approved_runner_mapping_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved runner mappings are immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_approved_runner_mapping_resource_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved runner mapping resources are immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_approved_runner_mapping_scenario_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved runner mapping scenarios are immutable'
    using errcode = '55000';
end;
$function$;

-- The child tables intentionally use normal foreign keys for row existence,
-- but authorization scope is a cross-table invariant.  Keep that invariant
-- in an insert fence so a future direct writer cannot bind a resource from a
-- different authorization (or a mismatched candidate/run/project tuple) to a
-- mapping that happens to exist.
create function platform_private.ac265_validate_approved_mapping_resource_binding()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_approved_runner_mappings as mapping
    join platform_private.ac265_approved_safe_resources as resource
      on resource.resource_id = new.resource_id
    where mapping.mapping_id = new.mapping_id
      and resource.authorization_id = mapping.authorization_id
      and resource.candidate_id = mapping.candidate_id
      and resource.run_id = mapping.run_id
      and resource.identity_sha256 = mapping.identity_sha256
      and resource.environment = mapping.environment
      and resource.source_revision = mapping.source_revision
      and resource.deployment_id = mapping.deployment_id
      and resource.hosting_project_id = mapping.hosting_project_id
      and resource.supabase_project_ref = mapping.supabase_project_ref
  ) then
    raise exception 'AC265 approved mapping resource authorization mismatch'
      using errcode = '23503';
  end if;
  return new;
end;
$function$;

revoke all on function platform_private.ac265_validate_approved_safe_resource_candidate() from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_approved_runner_mapping_candidate() from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_approved_safe_resource_mutation() from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_approved_runner_mapping_mutation() from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_approved_runner_mapping_resource_mutation() from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_approved_runner_mapping_scenario_mutation() from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_approved_mapping_resource_binding() from public, anon, authenticated, service_role;

create trigger ac265_approved_safe_resources_candidate_exists
  before insert on platform_private.ac265_approved_safe_resources
  for each row execute function platform_private.ac265_validate_approved_safe_resource_candidate();
create trigger ac265_approved_safe_resources_are_immutable
  before update or delete or truncate on platform_private.ac265_approved_safe_resources
  for each statement execute function platform_private.ac265_reject_approved_safe_resource_mutation();
create trigger ac265_approved_runner_mappings_candidate_exists
  before insert on platform_private.ac265_approved_runner_mappings
  for each row execute function platform_private.ac265_validate_approved_runner_mapping_candidate();
create trigger ac265_approved_runner_mappings_are_immutable
  before update or delete or truncate on platform_private.ac265_approved_runner_mappings
  for each statement execute function platform_private.ac265_reject_approved_runner_mapping_mutation();
create trigger ac265_approved_runner_mapping_resources_are_immutable
  before update or delete or truncate on platform_private.ac265_approved_runner_mapping_resources
  for each statement execute function platform_private.ac265_reject_approved_runner_mapping_resource_mutation();
create trigger ac265_approved_runner_mapping_resources_scope_fence
  before insert on platform_private.ac265_approved_runner_mapping_resources
  for each row execute function platform_private.ac265_validate_approved_mapping_resource_binding();
create trigger ac265_approved_runner_mapping_scenarios_are_immutable
  before update or delete or truncate on platform_private.ac265_approved_runner_mapping_scenarios
  for each statement execute function platform_private.ac265_reject_approved_runner_mapping_scenario_mutation();

alter table platform_private.ac265_approved_safe_resources enable row level security;
alter table platform_private.ac265_approved_safe_resources force row level security;
alter table platform_private.ac265_approved_runner_mappings enable row level security;
alter table platform_private.ac265_approved_runner_mappings force row level security;
alter table platform_private.ac265_approved_runner_mapping_resources enable row level security;
alter table platform_private.ac265_approved_runner_mapping_resources force row level security;
alter table platform_private.ac265_approved_runner_mapping_scenarios enable row level security;
alter table platform_private.ac265_approved_runner_mapping_scenarios force row level security;

revoke all on table platform_private.ac265_approved_safe_resources from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_approved_runner_mappings from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_approved_runner_mapping_resources from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_approved_runner_mapping_scenarios from public, anon, authenticated, service_role;

-- Internal envelope builder.  It is called only from the service_role-only
-- definer RPCs; it exposes the already reviewed V1 mapping and four opaque
-- resource references, never underlying resource content or locator bytes.
create function platform_private.ac265_build_approved_runner_mapping_envelope(
  p_mapping_id uuid,
  p_authorization_id uuid,
  p_idempotency_ref text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_mapping platform_private.ac265_approved_runner_mappings%rowtype;
  v_resources jsonb;
  v_role_bindings jsonb;
  v_scenario_bindings jsonb;
  v_envelope jsonb;
begin
  select mapping.*
    into v_mapping
  from platform_private.ac265_approved_runner_mappings as mapping
  where mapping.mapping_id = p_mapping_id
    and mapping.authorization_id = p_authorization_id;

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'kind', resource.resource_kind,
        'ref', resource.resource_ref,
        'sha256', encode(resource.resource_sha256, 'hex')
      ) order by resource.resource_kind
    ),
    '[]'::jsonb
  )
  into v_resources
  from (
    select distinct resource.resource_kind, resource.resource_ref, resource.resource_sha256
    from platform_private.ac265_approved_runner_mapping_resources as child
    join platform_private.ac265_approved_safe_resources as resource
      on resource.resource_id = child.resource_id
    where child.mapping_id = v_mapping.mapping_id
  ) as resource;

  select coalesce(
    jsonb_object_agg(
      binding.role_key,
      binding.refs order by binding.role_key
    ),
    '{}'::jsonb
  )
  into v_role_bindings
  from (
    select child.role_key,
      jsonb_agg(resource.resource_ref order by child.ordinal) as refs
    from platform_private.ac265_approved_runner_mapping_resources as child
    join platform_private.ac265_approved_safe_resources as resource
      on resource.resource_id = child.resource_id
    where child.mapping_id = v_mapping.mapping_id
    group by child.role_key
  ) as binding;

  select coalesce(
    jsonb_object_agg(
      binding.scenario_key,
      binding.roles order by binding.scenario_key
    ),
    '{}'::jsonb
  )
  into v_scenario_bindings
  from (
    select child.scenario_key,
      jsonb_agg(child.role_key order by child.ordinal) as roles
    from platform_private.ac265_approved_runner_mapping_scenarios as child
    where child.mapping_id = v_mapping.mapping_id
    group by child.scenario_key
  ) as binding;

  v_envelope := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_mapping.authorization_id::text,
    'environment', v_mapping.environment,
    'hostingProjectId', v_mapping.hosting_project_id,
    'supabaseProjectRef', v_mapping.supabase_project_ref,
    'redacted', true,
    'mapping', jsonb_build_object(
      'schemaVersion', 'ac265-approved-runner-mappings-v1',
      'source', 'protected-ac265-runner-mapping-control-plane',
      'mappingId', v_mapping.mapping_id::text,
      'approvedAt', to_char(v_mapping.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'runId', v_mapping.run_id,
      'identity', v_mapping.identity,
      'roleResourceBindings', v_role_bindings,
      'scenarioRoleBindings', v_scenario_bindings
    ),
    'resources', v_resources
  );

  if p_idempotency_ref is not null then
    v_envelope := jsonb_build_object('idempotencyRef', p_idempotency_ref) || v_envelope;
  end if;
  return v_envelope;
end;
$function$;

revoke all on function platform_private.ac265_build_approved_runner_mapping_envelope(uuid, uuid, text) from public, anon, authenticated, service_role;

create function platform_api.ac265_approved_safe_resource_register(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef',
    'resourceKind', 'locatorSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_request_sha256 bytea;
  v_now timestamptz;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_resource platform_private.ac265_approved_safe_resources%rowtype;
  v_existing platform_private.ac265_approved_safe_resources%rowtype;
  v_resource_id uuid;
  v_resource_ref text;
  v_resource_sha256 bytea;
  v_locator_sha256 bytea;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'resourceKind') is distinct from 'string'
     or jsonb_typeof(p_request -> 'locatorSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-approved-registry-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'resourceKind', '') not in ('content_schema', 'staff_case', 'organization', 'prerequisite')
     or coalesce(p_request ->> 'locatorSha256', '') !~ '^[a-f0-9]{64}$' then
    raise exception 'AC265 approved safe resource request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_locator_sha256 := decode(p_request ->> 'locatorSha256', 'hex');
  exception when others then
    raise exception 'AC265 approved safe resource request rejected' using errcode = '22023';
  end;
  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select resource.*
    into v_existing
  from platform_private.ac265_approved_safe_resources as resource
  where resource.authorization_id = v_authorization_id
    and resource.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;
  if found then
    if v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', 'ac265-authorization://staging/' || v_existing.authorization_id::text,
      'idempotencyRef', v_existing.idempotency_ref,
      'resource', jsonb_build_object(
        'kind', v_existing.resource_kind,
        'ref', v_existing.resource_ref,
        'sha256', encode(v_existing.resource_sha256, 'hex')
      ),
      'locatorSha256', encode(v_existing.locator_sha256, 'hex'),
      'environment', v_existing.environment,
      'hostingProjectId', v_existing.hosting_project_id,
      'supabaseProjectRef', v_existing.supabase_project_ref,
      'approvedAt', to_char(v_existing.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'redacted', true
    );
  end if;

  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.expires_at > v_now
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- A concurrent identical request can pass the optimistic replay lookup
  -- before the winning transaction commits, then wait here on the shared
  -- authorization row. Re-read after acquiring that serialization lock so an
  -- exact replay returns the immutable winner instead of falling through to
  -- the one-resource-per-kind conflict check.
  select resource.*
    into v_existing
  from platform_private.ac265_approved_safe_resources as resource
  where resource.authorization_id = v_authorization_id
    and resource.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;
  if found then
    if v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', 'ac265-authorization://staging/' || v_existing.authorization_id::text,
      'idempotencyRef', v_existing.idempotency_ref,
      'resource', jsonb_build_object(
        'kind', v_existing.resource_kind,
        'ref', v_existing.resource_ref,
        'sha256', encode(v_existing.resource_sha256, 'hex')
      ),
      'locatorSha256', encode(v_existing.locator_sha256, 'hex'),
      'environment', v_existing.environment,
      'hostingProjectId', v_existing.hosting_project_id,
      'supabaseProjectRef', v_existing.supabase_project_ref,
      'approvedAt', to_char(v_existing.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'redacted', true
    );
  end if;

  select candidate.*
    into v_candidate
  from platform_private.ac265_verified_candidates as candidate
  where candidate.identity_sha256 = v_authorization.identity_sha256
    and candidate.source_revision = v_authorization.source_revision
    and candidate.deployment_id = v_authorization.deployment_id
    and candidate.identity ->> 'environment' = 'staging'
    and candidate.identity ->> 'hostingProjectId' = 'wejammin-staging'
    and candidate.identity ->> 'supabaseProjectRef' ~ '^[a-z0-9]{20}$';
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  if exists (
    select 1
    from platform_private.ac265_approved_safe_resources as resource
    where resource.authorization_id = v_authorization.authorization_id
      and resource.resource_kind = p_request ->> 'resourceKind'
  ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_resource_id := extensions.gen_random_uuid();
  v_resource_ref := 'ac265-resource://' || (p_request ->> 'resourceKind') || '/' || v_resource_id::text;
  v_resource_sha256 := extensions.digest(convert_to(v_resource_ref, 'utf8'), 'sha256');
  insert into platform_private.ac265_approved_safe_resources (
    resource_id, resource_ref, resource_sha256, resource_kind, locator_sha256,
    authorization_id, candidate_id, run_id, identity_sha256, environment,
    source_revision, deployment_id, hosting_project_id, supabase_project_ref,
    approved_at, idempotency_ref, request_sha256
  ) values (
    v_resource_id, v_resource_ref, v_resource_sha256, p_request ->> 'resourceKind',
    v_locator_sha256, v_authorization.authorization_id, v_candidate.candidate_id,
    v_authorization.run_id, v_candidate.identity_sha256, 'staging',
    v_candidate.source_revision, v_candidate.deployment_id,
    v_candidate.identity ->> 'hostingProjectId', v_candidate.identity ->> 'supabaseProjectRef',
    v_now, p_request ->> 'idempotencyRef', v_request_sha256
  )
  returning * into v_resource;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_resource.authorization_id::text,
    'idempotencyRef', v_resource.idempotency_ref,
    'resource', jsonb_build_object(
      'kind', v_resource.resource_kind,
      'ref', v_resource.resource_ref,
      'sha256', encode(v_resource.resource_sha256, 'hex')
    ),
    'locatorSha256', encode(v_resource.locator_sha256, 'hex'),
    'environment', v_resource.environment,
    'hostingProjectId', v_resource.hosting_project_id,
    'supabaseProjectRef', v_resource.supabase_project_ref,
    'approvedAt', to_char(v_resource.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'redacted', true
  );
exception
  when unique_violation then
    select resource.*
      into v_existing
    from platform_private.ac265_approved_safe_resources as resource
    where resource.authorization_id = v_authorization_id
      and resource.idempotency_ref = p_request ->> 'idempotencyRef';
    if found and v_existing.request_sha256 = v_request_sha256 then
      return jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
        'authorizationRef', 'ac265-authorization://staging/' || v_existing.authorization_id::text,
        'idempotencyRef', v_existing.idempotency_ref,
        'resource', jsonb_build_object('kind', v_existing.resource_kind, 'ref', v_existing.resource_ref, 'sha256', encode(v_existing.resource_sha256, 'hex')),
        'locatorSha256', encode(v_existing.locator_sha256, 'hex'),
        'environment', v_existing.environment,
        'hostingProjectId', v_existing.hosting_project_id,
        'supabaseProjectRef', v_existing.supabase_project_ref,
        'approvedAt', to_char(v_existing.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'redacted', true
      );
    end if;
    return jsonb_build_object('status', 'conflict');
end;
$function$;

revoke all on function platform_api.ac265_approved_safe_resource_register(jsonb) from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_safe_resource_register(jsonb) to service_role;

create function platform_api.ac265_approved_runner_mapping_register(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef',
    'roleResourceBindings', 'scenarioRoleBindings'
  ];
  v_role_keys constant text[] := array[
    'entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted',
    'business_mandate', 'staff_case_scoped', 'admin_step_up',
    'forbidden_hidden', 'disabled_prerequisite'
  ];
  v_scenario_keys constant text[] := array[
    'idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions',
    'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab',
    'auth_expiry', 'rate_limit_429', 'dependency_outage'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_resource_ref_pattern constant text :=
    '^ac265-resource://(?:content_schema|staff_case|organization|prerequisite)/' || v_uuid_pattern || '$';
  v_authorization_id uuid;
  v_request_sha256 bytea;
  v_now timestamptz;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_mapping platform_private.ac265_approved_runner_mappings%rowtype;
  v_existing platform_private.ac265_approved_runner_mappings%rowtype;
  v_roles jsonb;
  v_scenarios jsonb;
  v_resource_refs text[];
  v_resource_count bigint;
  v_kind_count bigint;
  v_role_key text;
  v_scenario_key text;
  v_role_values jsonb;
  v_scenario_values jsonb;
  v_resource_ref text;
  v_role_ordinal integer;
  v_scenario_ordinal integer;
  v_resource_id uuid;
  v_mapping_id uuid;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'roleResourceBindings') is distinct from 'object'
     or jsonb_typeof(p_request -> 'scenarioRoleBindings') is distinct from 'object'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-approved-registry-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern then
    raise exception 'AC265 approved runner mapping request rejected' using errcode = '22023';
  end if;

  v_roles := p_request -> 'roleResourceBindings';
  v_scenarios := p_request -> 'scenarioRoleBindings';
  if (select count(*) from jsonb_object_keys(v_roles)) <> cardinality(v_role_keys)
     or exists (select 1 from jsonb_object_keys(v_roles) as key where key <> all(v_role_keys))
     or (select count(*) from jsonb_object_keys(v_scenarios)) <> cardinality(v_scenario_keys)
     or exists (select 1 from jsonb_object_keys(v_scenarios) as key where key <> all(v_scenario_keys)) then
    raise exception 'AC265 approved runner mapping request rejected' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_each(v_roles) as role_binding(key, value)
    where jsonb_typeof(role_binding.value) <> 'array'
      or jsonb_array_length(role_binding.value) = 0
      or exists (
        select 1 from jsonb_array_elements(role_binding.value) as item(value)
        where jsonb_typeof(item.value) <> 'string'
           or item.value #>> '{}' !~ v_resource_ref_pattern
      )
      or (select count(*) from jsonb_array_elements(role_binding.value))
         <> (select count(distinct item.value) from jsonb_array_elements(role_binding.value) as item(value))
  )
  or exists (
    select 1
    from jsonb_each(v_scenarios) as scenario_binding(key, value)
    where jsonb_typeof(scenario_binding.value) <> 'array'
      or jsonb_array_length(scenario_binding.value) = 0
      or exists (
        select 1 from jsonb_array_elements(scenario_binding.value) as item(value)
        where jsonb_typeof(item.value) <> 'string'
           or item.value #>> '{}' <> all(v_role_keys)
      )
      or (select count(*) from jsonb_array_elements(scenario_binding.value))
         <> (select count(distinct item.value) from jsonb_array_elements(scenario_binding.value) as item(value))
  ) then
    raise exception 'AC265 approved runner mapping request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 approved runner mapping request rejected' using errcode = '22023';
  end;
  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select mapping.*
    into v_existing
  from platform_private.ac265_approved_runner_mappings as mapping
  where mapping.authorization_id = v_authorization_id
    and mapping.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;
  if found then
    if v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return platform_private.ac265_build_approved_runner_mapping_envelope(
      v_existing.mapping_id, v_existing.authorization_id, v_existing.idempotency_ref
    );
  end if;

  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.expires_at > v_now
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select candidate.*
    into v_candidate
  from platform_private.ac265_verified_candidates as candidate
  where candidate.identity_sha256 = v_authorization.identity_sha256
    and candidate.source_revision = v_authorization.source_revision
    and candidate.deployment_id = v_authorization.deployment_id
    and candidate.identity ->> 'environment' = 'staging'
    and candidate.identity ->> 'hostingProjectId' = 'wejammin-staging'
    and candidate.identity ->> 'supabaseProjectRef' ~ '^[a-z0-9]{20}$';
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_resource_refs := array(
    select distinct item.value
    from jsonb_each(v_roles) as role_binding(key, value)
    cross join lateral jsonb_array_elements_text(role_binding.value) as item(value)
  );
  if cardinality(v_resource_refs) <> 4 then
    return jsonb_build_object('status', 'conflict');
  end if;

  select count(distinct resource.resource_id), count(distinct resource.resource_kind)
    into v_resource_count, v_kind_count
  from platform_private.ac265_approved_safe_resources as resource
  where resource.authorization_id = v_authorization.authorization_id
    and resource.candidate_id = v_candidate.candidate_id
    and resource.run_id = v_authorization.run_id
    and resource.identity_sha256 = v_candidate.identity_sha256
    and resource.source_revision = v_candidate.source_revision
    and resource.deployment_id = v_candidate.deployment_id
    and resource.environment = 'staging'
    and resource.hosting_project_id = v_candidate.identity ->> 'hostingProjectId'
    and resource.supabase_project_ref = v_candidate.identity ->> 'supabaseProjectRef'
    and resource.resource_ref = any(v_resource_refs);
  if v_resource_count <> 4 or v_kind_count <> 4 then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_mapping_id := extensions.gen_random_uuid();
  insert into platform_private.ac265_approved_runner_mappings (
    mapping_id, authorization_id, candidate_id, run_id, identity_sha256, identity,
    environment, source_revision, deployment_id, hosting_project_id,
    supabase_project_ref, approved_at, idempotency_ref, request_sha256
  ) values (
    v_mapping_id, v_authorization.authorization_id, v_candidate.candidate_id,
    v_authorization.run_id, v_candidate.identity_sha256, v_candidate.identity,
    'staging', v_candidate.source_revision, v_candidate.deployment_id,
    v_candidate.identity ->> 'hostingProjectId', v_candidate.identity ->> 'supabaseProjectRef',
    v_now, p_request ->> 'idempotencyRef', v_request_sha256
  )
  on conflict do nothing
  returning * into v_mapping;

  if not found then
    select mapping.*
      into v_existing
    from platform_private.ac265_approved_runner_mappings as mapping
    where mapping.authorization_id = v_authorization.authorization_id
      and mapping.idempotency_ref = p_request ->> 'idempotencyRef'
    for update;
    if not found or v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return platform_private.ac265_build_approved_runner_mapping_envelope(
      v_existing.mapping_id, v_existing.authorization_id, v_existing.idempotency_ref
    );
  end if;

  for v_role_key, v_role_values in
    select key, value from jsonb_each(v_roles) order by key
  loop
    v_role_ordinal := 0;
    for v_resource_ref in
      select value from jsonb_array_elements_text(v_role_values)
  loop
      v_role_ordinal := v_role_ordinal + 1;
      select resource.resource_id
        into v_resource_id
      from platform_private.ac265_approved_safe_resources as resource
      where resource.authorization_id = v_authorization.authorization_id
        and resource.resource_ref = v_resource_ref;
      insert into platform_private.ac265_approved_runner_mapping_resources (
        mapping_id, resource_id, role_key, ordinal
      ) values (
        v_mapping.mapping_id, v_resource_id, v_role_key, v_role_ordinal
      );
    end loop;
  end loop;

  for v_scenario_key, v_scenario_values in
    select key, value from jsonb_each(v_scenarios) order by key
  loop
    v_scenario_ordinal := 0;
    for v_role_key in
      select value from jsonb_array_elements_text(v_scenario_values)
  loop
      v_scenario_ordinal := v_scenario_ordinal + 1;
      insert into platform_private.ac265_approved_runner_mapping_scenarios (
        mapping_id, scenario_key, role_key, ordinal
      ) values (
        v_mapping.mapping_id, v_scenario_key, v_role_key, v_scenario_ordinal
      );
    end loop;
  end loop;

  return platform_private.ac265_build_approved_runner_mapping_envelope(
    v_mapping.mapping_id, v_mapping.authorization_id, v_mapping.idempotency_ref
  );
end;
$function$;

revoke all on function platform_api.ac265_approved_runner_mapping_register(jsonb) from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_runner_mapping_register(jsonb) to service_role;

create function platform_api.ac265_approved_runner_mapping_read(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'mappingId'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_mapping_id uuid;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_mapping platform_private.ac265_approved_runner_mappings%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'mappingId') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-approved-registry-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'mappingId', '') !~ ('^' || v_uuid_pattern || '$') then
    raise exception 'AC265 approved runner mapping read request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_mapping_id := (p_request ->> 'mappingId')::uuid;
  exception when others then
    raise exception 'AC265 approved runner mapping read request rejected' using errcode = '22023';
  end;

  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.expires_at > clock_timestamp();
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select mapping.*
    into v_mapping
  from platform_private.ac265_approved_runner_mappings as mapping
  where mapping.mapping_id = v_mapping_id
    and mapping.authorization_id = v_authorization.authorization_id
    and mapping.run_id = v_authorization.run_id
    and mapping.identity_sha256 = v_authorization.identity_sha256
    and mapping.source_revision = v_authorization.source_revision
    and mapping.deployment_id = v_authorization.deployment_id;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  return platform_private.ac265_build_approved_runner_mapping_envelope(
    v_mapping.mapping_id, v_mapping.authorization_id
  );
end;
$function$;

revoke all on function platform_api.ac265_approved_runner_mapping_read(jsonb) from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_runner_mapping_read(jsonb) to service_role;

comment on table platform_private.ac265_approved_safe_resources is
  'Private immutable AC265 staging safe-resource registry; stores only opaque references and locator digests.';
comment on table platform_private.ac265_approved_runner_mappings is
  'Private immutable AC265 approved runner mapping parent bound to one authorized run and full candidate identity.';
comment on table platform_private.ac265_approved_runner_mapping_resources is
  'Private immutable normalized role-to-resource bindings for an approved AC265 runner mapping.';
comment on table platform_private.ac265_approved_runner_mapping_scenarios is
  'Private immutable normalized scenario-to-role bindings for an approved AC265 runner mapping.';
comment on function platform_api.ac265_approved_safe_resource_register(jsonb) is
  'Registers one server-derived, digest-only staging resource per kind for an authorized AC265 run.';
comment on function platform_api.ac265_approved_runner_mapping_register(jsonb) is
  'Atomically registers one exact nine-role, ten-scenario AC265 runner mapping over four approved resources.';
comment on function platform_api.ac265_approved_runner_mapping_read(jsonb) is
  'Reads a redacted ApprovedRunnerMappingsV1 envelope only through its authorized run binding.';
