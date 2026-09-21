-- AC265 CP-04b: protected approved outage-target policy and registration.
--
-- No live policy or target is seeded here.  The actual safe staging dependency
-- and route require an owner-approved, forward-only policy migration.  This
-- foundation accepts only a pinned policy reference and derives every target,
-- identity, project, route, and timestamp field on the server.

create table platform_private.ac265_approved_outage_target_policies (
  policy_ref text primary key,
  environment text not null,
  dependency_id text not null,
  route_operation_id text not null,
  route_method text not null,
  route_path text not null,
  target_validity_seconds smallint not null,
  request_limit smallint not null,
  approved_at timestamptz not null,
  expires_at timestamptz not null,
  constraint ac265_approved_outage_target_policies_ref
    check (policy_ref = 'ac265-outage-policy://staging/v1'),
  constraint ac265_approved_outage_target_policies_environment
    check (environment = 'staging'),
  constraint ac265_approved_outage_target_policies_dependency_id
    check (dependency_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_outage_target_policies_operation_id
    check (route_operation_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_outage_target_policies_method
    check (route_method in ('GET', 'HEAD')),
  constraint ac265_approved_outage_target_policies_path
    check (
      length(route_path) <= 200
      and route_path ~ '^/api/v1/[a-z0-9][a-z0-9/_-]*$'
    ),
  constraint ac265_approved_outage_target_policies_validity
    check (target_validity_seconds = 120),
  constraint ac265_approved_outage_target_policies_one_request
    check (request_limit = 1),
  constraint ac265_approved_outage_target_policies_expiry_order
    check (expires_at > approved_at)
);

create table platform_private.ac265_approved_outage_target_registrations (
  registration_id uuid primary key default extensions.gen_random_uuid(),
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  target_id uuid not null
    references platform_private.ac265_approved_outage_targets (target_id),
  policy_ref text not null
    references platform_private.ac265_approved_outage_target_policies (policy_ref),
  idempotency_ref text not null,
  request_sha256 bytea not null,
  registered_at timestamptz not null,
  constraint ac265_approved_outage_target_registrations_authorization_unique
    unique (authorization_id),
  constraint ac265_approved_outage_target_registrations_target_unique
    unique (target_id),
  constraint ac265_approved_outage_target_registrations_idempotency_unique
    unique (authorization_id, idempotency_ref),
  constraint ac265_approved_outage_target_registrations_idempotency_ref
    check (
      idempotency_ref ~ '^ac265-idempotency://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_approved_outage_target_registrations_request_sha256
    check (octet_length(request_sha256) = 32)
);

create function platform_private.ac265_reject_approved_outage_target_policy_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved outage target policies are immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_approved_outage_target_registration_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved outage target registrations are immutable'
    using errcode = '55000';
end;
$function$;

revoke all on function platform_private.ac265_reject_approved_outage_target_policy_mutation()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_approved_outage_target_registration_mutation()
  from public, anon, authenticated, service_role;

create trigger ac265_approved_outage_target_policies_are_immutable
  before update or delete or truncate
  on platform_private.ac265_approved_outage_target_policies
  for each statement
  execute function platform_private.ac265_reject_approved_outage_target_policy_mutation();

create trigger ac265_approved_outage_target_registrations_are_immutable
  before update or delete or truncate
  on platform_private.ac265_approved_outage_target_registrations
  for each statement
  execute function platform_private.ac265_reject_approved_outage_target_registration_mutation();

alter table platform_private.ac265_approved_outage_target_policies enable row level security;
alter table platform_private.ac265_approved_outage_target_policies force row level security;
alter table platform_private.ac265_approved_outage_target_registrations enable row level security;
alter table platform_private.ac265_approved_outage_target_registrations force row level security;

revoke all on table platform_private.ac265_approved_outage_target_policies
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_approved_outage_target_registrations
  from public, anon, authenticated, service_role;

create function platform_private.ac265_build_approved_outage_target_canonical_json(
  p_target_id uuid,
  p_target_ref text,
  p_approved_at timestamptz,
  p_expires_at timestamptz,
  p_run_id uuid,
  p_hosting_project_id text,
  p_supabase_project_ref text,
  p_deployment_id text,
  p_dependency_id text,
  p_route_operation_id text,
  p_route_method text,
  p_route_path text
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $function$
  select pg_catalog.format(
    '{"approvedAt":%s,"expiresAt":%s,"schemaVersion":"ac265-approved-outage-target-v1","scope":{"dependencyId":%s,"deploymentId":%s,"hostingProjectId":%s,"route":{"method":%s,"operationId":%s,"path":%s},"runId":%s,"supabaseProjectRef":%s},"source":"protected-staging-fault-control-plane","targetId":%s,"targetRef":%s}',
    pg_catalog.to_json(pg_catalog.to_char(p_approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))::text,
    pg_catalog.to_json(pg_catalog.to_char(p_expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))::text,
    pg_catalog.to_json(p_dependency_id)::text,
    pg_catalog.to_json(p_deployment_id)::text,
    pg_catalog.to_json(p_hosting_project_id)::text,
    pg_catalog.to_json(p_route_method)::text,
    pg_catalog.to_json(p_route_operation_id)::text,
    pg_catalog.to_json(p_route_path)::text,
    pg_catalog.to_json(p_run_id::text)::text,
    pg_catalog.to_json(p_supabase_project_ref)::text,
    pg_catalog.to_json(p_target_id::text)::text,
    pg_catalog.to_json(p_target_ref)::text
  );
$function$;

revoke all on function platform_private.ac265_build_approved_outage_target_canonical_json(
  uuid, text, timestamptz, timestamptz, uuid, text, text, text, text, text, text, text
) from public, anon, authenticated, service_role;

create function platform_private.ac265_build_approved_outage_target_registration_envelope(
  p_registration_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
    'authorizationRef', 'ac265-authorization://staging/' || registration.authorization_id::text,
    'policyRef', registration.policy_ref,
    'idempotencyRef', registration.idempotency_ref,
    'targetRef', target.target_ref,
    'targetSha256', encode(target.target_sha256, 'hex'),
    'approvedAt', to_char(target.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(target.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'environment', target.environment,
    'hostingProjectId', target.hosting_project_id,
    'supabaseProjectRef', target.supabase_project_ref,
    'status', 'registered',
    'redacted', true
  )
  from platform_private.ac265_approved_outage_target_registrations as registration
  join platform_private.ac265_approved_outage_targets as target
    on target.target_id = registration.target_id
  where registration.registration_id = p_registration_id;
$function$;

revoke all on function platform_private.ac265_build_approved_outage_target_registration_envelope(uuid)
  from public, anon, authenticated, service_role;

create function platform_api.ac265_approved_outage_target_register(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'policyRef',
    'idempotencyRef'
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
  v_target_id uuid;
  v_target_ref text;
  v_target_expires_at timestamptz;
  v_target_canonical_json text;
  v_target_sha256 bytea;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_policy platform_private.ac265_approved_outage_target_policies%rowtype;
  v_registration platform_private.ac265_approved_outage_target_registrations%rowtype;
  v_existing platform_private.ac265_approved_outage_target_registrations%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'policyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '')
        <> 'ac265-hosted-approved-outage-target-registration-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'policyRef', '')
        <> 'ac265-outage-policy://staging/v1'
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern then
    raise exception 'AC265 approved outage target registration request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(
      p_request ->> 'authorizationRef' from v_authorization_ref_pattern
    )::uuid;
  exception when others then
    raise exception 'AC265 approved outage target registration request rejected'
      using errcode = '22023';
  end;
  v_request_sha256 := extensions.digest(
    convert_to(p_request::text, 'utf8'),
    'sha256'
  );

  select registration.*
    into v_existing
  from platform_private.ac265_approved_outage_target_registrations as registration
  where registration.authorization_id = v_authorization_id
    and registration.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;
  if found then
    if v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return platform_private.ac265_build_approved_outage_target_registration_envelope(
      v_existing.registration_id
    );
  end if;

  v_now := date_trunc('milliseconds', clock_timestamp());
  select policy.*
    into v_policy
  from platform_private.ac265_approved_outage_target_policies as policy
  where policy.policy_ref = p_request ->> 'policyRef'
    and policy.environment = 'staging'
    and policy.request_limit = 1
    and policy.approved_at <= v_now
    and policy.expires_at > v_now;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_target_expires_at := v_now + make_interval(secs => v_policy.target_validity_seconds);
  if v_policy.expires_at < v_target_expires_at then
    return jsonb_build_object('status', 'conflict');
  end if;

  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at >= v_target_expires_at
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select registration.*
    into v_existing
  from platform_private.ac265_approved_outage_target_registrations as registration
  where registration.authorization_id = v_authorization_id
    and registration.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;
  if found then
    if v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return platform_private.ac265_build_approved_outage_target_registration_envelope(
      v_existing.registration_id
    );
  end if;

  if exists (
    select 1
    from platform_private.ac265_approved_outage_target_registrations as registration
    where registration.authorization_id = v_authorization_id
  ) then
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

  v_target_id := extensions.gen_random_uuid();
  v_target_ref := 'ac265-outage-target://staging/' || v_target_id::text;
  v_target_canonical_json :=
    platform_private.ac265_build_approved_outage_target_canonical_json(
      v_target_id,
      v_target_ref,
      v_now,
      v_target_expires_at,
      v_authorization.run_id,
      v_candidate.identity ->> 'hostingProjectId',
      v_candidate.identity ->> 'supabaseProjectRef',
      v_candidate.deployment_id,
      v_policy.dependency_id,
      v_policy.route_operation_id,
      v_policy.route_method,
      v_policy.route_path
    );
  v_target_sha256 := extensions.digest(
    convert_to(v_target_canonical_json, 'utf8'),
    'sha256'
  );

  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id,
    identity_sha256, environment, source_revision, hosting_project_id,
    supabase_project_ref, deployment_id, dependency_id, route_operation_id,
    route_method, route_path, approved_at, expires_at
  ) values (
    v_target_id, v_target_ref, v_target_sha256, v_candidate.candidate_id,
    v_authorization.run_id, v_candidate.identity_sha256, 'staging',
    v_candidate.source_revision, v_candidate.identity ->> 'hostingProjectId',
    v_candidate.identity ->> 'supabaseProjectRef', v_candidate.deployment_id,
    v_policy.dependency_id, v_policy.route_operation_id, v_policy.route_method,
    v_policy.route_path, v_now, v_target_expires_at
  );

  insert into platform_private.ac265_approved_outage_target_registrations (
    authorization_id, target_id, policy_ref, idempotency_ref,
    request_sha256, registered_at
  ) values (
    v_authorization.authorization_id, v_target_id, v_policy.policy_ref,
    p_request ->> 'idempotencyRef', v_request_sha256, v_now
  )
  returning * into v_registration;

  return platform_private.ac265_build_approved_outage_target_registration_envelope(
    v_registration.registration_id
  );
exception
  when unique_violation then
    select registration.*
      into v_existing
    from platform_private.ac265_approved_outage_target_registrations as registration
    where registration.authorization_id = v_authorization_id
      and registration.idempotency_ref = p_request ->> 'idempotencyRef';
    if found and v_existing.request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_approved_outage_target_registration_envelope(
        v_existing.registration_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
end;
$function$;

revoke all on function platform_api.ac265_approved_outage_target_register(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_outage_target_register(jsonb)
  to service_role;
