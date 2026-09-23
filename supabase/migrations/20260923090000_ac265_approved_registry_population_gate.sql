-- AC265 CP-02: owner-approved population gate for the approved registry RPCs.
--
-- This is intentionally forward-only.  Registry rows are immutable approval
-- evidence and rollback by deleting them would destroy that boundary, so this
-- migration has no DOWN.  It must be applied as a reviewed deployment with a
-- database backup and must never be rewritten.
--
-- It creates three EMPTY pinned policy tables and redefines the two CP-02
-- register RPCs to require an exact match against those pins.  This migration
-- seeds no row, value, resource, identity, or grant.  Until a separate
-- owner-approved forward migration seeds the pinned rows, both register RPCs
-- fail closed and return only the generic {"status":"conflict"} sentinel.
-- The strict ac265-hosted-approved-registry-control-v1 request/response
-- contracts are unchanged, and no server-derived field is invented.

create table platform_private.ac265_approved_registry_resources (
  resource_kind text primary key,
  locator_sha256 bytea not null,
  approval_ref text not null,
  environment text not null,
  constraint ac265_approved_registry_resources_kind
    check (resource_kind in ('content_schema', 'staff_case', 'organization', 'prerequisite')),
  constraint ac265_approved_registry_resources_locator_length
    check (octet_length(locator_sha256) = 32),
  constraint ac265_approved_registry_resources_approval_ref
    check (approval_ref ~ '^ac265-approval://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint ac265_approved_registry_resources_environment
    check (environment = 'staging')
);

create table platform_private.ac265_approved_registry_role_kinds (
  role_key text primary key,
  resource_kind text not null
    references platform_private.ac265_approved_registry_resources (resource_kind),
  approval_ref text not null,
  environment text not null,
  constraint ac265_approved_registry_role_kinds_role
    check (role_key in ('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite')),
  constraint ac265_approved_registry_role_kinds_approval_ref
    check (approval_ref ~ '^ac265-approval://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint ac265_approved_registry_role_kinds_environment
    check (environment = 'staging')
);

create table platform_private.ac265_approved_registry_scenario_roles (
  scenario_key text not null,
  role_key text not null
    references platform_private.ac265_approved_registry_role_kinds (role_key),
  approval_ref text not null,
  environment text not null,
  constraint ac265_approved_registry_scenario_roles_pkey
    primary key (scenario_key, role_key),
  constraint ac265_approved_registry_scenario_roles_scenario
    check (scenario_key in ('idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions', 'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab', 'auth_expiry', 'rate_limit_429', 'dependency_outage')),
  constraint ac265_approved_registry_scenario_roles_role
    check (role_key in ('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite')),
  constraint ac265_approved_registry_scenario_roles_approval_ref
    check (approval_ref ~ '^ac265-approval://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint ac265_approved_registry_scenario_roles_environment
    check (environment = 'staging')
);

create function platform_private.ac265_reject_approved_registry_policy_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved registry policies are immutable'
    using errcode = '55000';
end;
$function$;

revoke all on function platform_private.ac265_reject_approved_registry_policy_mutation()
  from public, anon, authenticated, service_role;

create trigger ac265_approved_registry_resources_are_immutable
  before update or delete or truncate
  on platform_private.ac265_approved_registry_resources
  for each statement
  execute function platform_private.ac265_reject_approved_registry_policy_mutation();
create trigger ac265_approved_registry_role_kinds_are_immutable
  before update or delete or truncate
  on platform_private.ac265_approved_registry_role_kinds
  for each statement
  execute function platform_private.ac265_reject_approved_registry_policy_mutation();
create trigger ac265_approved_registry_scenario_roles_are_immutable
  before update or delete or truncate
  on platform_private.ac265_approved_registry_scenario_roles
  for each statement
  execute function platform_private.ac265_reject_approved_registry_policy_mutation();

alter table platform_private.ac265_approved_registry_resources enable row level security;
alter table platform_private.ac265_approved_registry_resources force row level security;
alter table platform_private.ac265_approved_registry_role_kinds enable row level security;
alter table platform_private.ac265_approved_registry_role_kinds force row level security;
alter table platform_private.ac265_approved_registry_scenario_roles enable row level security;
alter table platform_private.ac265_approved_registry_scenario_roles force row level security;

revoke all on table platform_private.ac265_approved_registry_resources
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_approved_registry_role_kinds
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_approved_registry_scenario_roles
  from public, anon, authenticated, service_role;

create or replace function platform_api.ac265_approved_safe_resource_register(p_request jsonb)
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

  -- CP-02 owner-approved population gate: a safe resource is registrable only
  -- when it exactly matches one pinned (resource_kind, locator_sha256)
  -- approval.  CP-02 pins no approval by itself, so until a separate
  -- owner-approved forward migration seeds the pinned rows this gate fails
  -- closed with only the generic conflict sentinel.
  if not exists (
    select 1
    from platform_private.ac265_approved_registry_resources as pinned
    where pinned.environment = 'staging'
      and pinned.resource_kind = p_request ->> 'resourceKind'
      and pinned.locator_sha256 = v_locator_sha256
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

create or replace function platform_api.ac265_approved_runner_mapping_register(p_request jsonb)
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

  -- CP-02 owner-approved population gate.  It enforces EXACT SET EQUALITY
  -- between the request and the pinned owner approvals, in both directions:
  --   * every registered resource must match a pinned (kind, locator) pin;
  --   * every pinned resource-kind pin must be covered by a registered resource;
  --   * the role-to-kind assignment and every scenario-to-role assignment must
  --     equal the pinned sets exactly, with no extra and no missing member;
  --   * the pinned scenario assignment must reference only roles the request
  --     actually binds.
  -- CP-02 pins no approval by itself, so until a separate owner-approved
  -- forward migration seeds the pinned rows this gate fails closed with only
  -- the generic conflict sentinel.
  -- (Resource kinds are matched by registered resource, not by locator alone.)
  if exists (
    (
      select distinct resource.resource_kind
      from unnest(v_resource_refs) as requested(resource_ref)
      join platform_private.ac265_approved_safe_resources as resource
        on resource.resource_ref = requested.resource_ref
      except
      select distinct pinned.resource_kind
      from platform_private.ac265_approved_registry_resources as pinned
      where pinned.environment = 'staging'
    )
    union all
    (
      select distinct pinned.resource_kind
      from platform_private.ac265_approved_registry_resources as pinned
      where pinned.environment = 'staging'
      except
      select distinct resource.resource_kind
      from unnest(v_resource_refs) as requested(resource_ref)
      join platform_private.ac265_approved_safe_resources as resource
        on resource.resource_ref = requested.resource_ref
    )
    union all
    (
      select role_binding.role_key, resource.resource_kind
      from jsonb_each(v_roles) as role_binding(role_key, resource_refs)
      cross join lateral jsonb_array_elements_text(role_binding.resource_refs) as requested(resource_ref)
      join platform_private.ac265_approved_safe_resources as resource
        on resource.resource_ref = requested.resource_ref
      except
      select pinned.role_key, pinned.resource_kind
      from platform_private.ac265_approved_registry_role_kinds as pinned
      where pinned.environment = 'staging'
    )
    union all
    (
      select pinned.role_key, pinned.resource_kind
      from platform_private.ac265_approved_registry_role_kinds as pinned
      where pinned.environment = 'staging'
      except
      select role_binding.role_key, resource.resource_kind
      from jsonb_each(v_roles) as role_binding(role_key, resource_refs)
      cross join lateral jsonb_array_elements_text(role_binding.resource_refs) as requested(resource_ref)
      join platform_private.ac265_approved_safe_resources as resource
        on resource.resource_ref = requested.resource_ref
    )
    union all
    (
      select scenario_binding.scenario_key, requested.role_key
      from jsonb_each(v_scenarios) as scenario_binding(scenario_key, role_values)
      cross join lateral jsonb_array_elements_text(scenario_binding.role_values) as requested(role_key)
      except
      select pinned.scenario_key, pinned.role_key
      from platform_private.ac265_approved_registry_scenario_roles as pinned
      where pinned.environment = 'staging'
    )
    union all
    (
      select pinned.scenario_key, pinned.role_key
      from platform_private.ac265_approved_registry_scenario_roles as pinned
      where pinned.environment = 'staging'
      except
      select scenario_binding.scenario_key, requested.role_key
      from jsonb_each(v_scenarios) as scenario_binding(scenario_key, role_values)
      cross join lateral jsonb_array_elements_text(scenario_binding.role_values) as requested(role_key)
    )
  ) then
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

revoke all on function platform_api.ac265_approved_safe_resource_register(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_safe_resource_register(jsonb)
  to service_role;
revoke all on function platform_api.ac265_approved_runner_mapping_register(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_runner_mapping_register(jsonb)
  to service_role;

comment on table platform_private.ac265_approved_registry_resources is
  'Private owner-approved pin of exactly one safe-resource locator digest per kind; empty until an owner-approved forward migration seeds it.';
comment on table platform_private.ac265_approved_registry_role_kinds is
  'Private owner-approved nine-role to safe-resource-kind assignment; empty until an owner-approved forward migration seeds it.';
comment on table platform_private.ac265_approved_registry_scenario_roles is
  'Private owner-approved ten-scenario to role assignment; empty until an owner-approved forward migration seeds it.';
comment on function platform_api.ac265_approved_safe_resource_register(jsonb) is
  'Registers one server-derived, digest-only staging resource only when it exactly matches an owner-approved pinned kind/locator; otherwise a generic conflict.';
comment on function platform_api.ac265_approved_runner_mapping_register(jsonb) is
  'Registers one exact nine-role, ten-scenario mapping only when the resources and both assignments exactly match the owner-approved pins; otherwise a generic conflict.';

