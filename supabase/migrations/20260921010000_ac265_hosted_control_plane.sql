-- AC265 CP-01: staging-only, one-use outage lease control plane.
--
-- The tables in this migration are deliberately private and digest/reference
-- based.  The only public boundary is the service_role-only JSONB RPC set
-- below.  No target bytes, credentials, caller timestamps, or caller scope
-- are accepted or retained here.

create table platform_private.ac265_approved_outage_targets (
  target_id uuid primary key default extensions.gen_random_uuid(),
  target_ref text not null,
  target_sha256 bytea not null,
  candidate_id uuid not null,
  run_id uuid not null,
  identity_sha256 bytea not null,
  environment text not null,
  source_revision text not null,
  hosting_project_id text not null,
  supabase_project_ref text not null,
  deployment_id text not null,
  dependency_id text not null,
  route_operation_id text not null,
  route_method text not null,
  route_path text not null,
  approved_at timestamptz not null,
  expires_at timestamptz not null,
  constraint ac265_approved_outage_targets_target_ref_unique
    unique (target_ref),
  constraint ac265_approved_outage_targets_target_ref_shape
    check (
      target_ref ~ '^ac265-outage-target://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_approved_outage_targets_target_sha256_length
    check (octet_length(target_sha256) = 32),
  constraint ac265_approved_outage_targets_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_approved_outage_targets_environment
    check (environment = 'staging'),
  constraint ac265_approved_outage_targets_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_approved_outage_targets_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_approved_outage_targets_expiry_order
    check (expires_at > approved_at)
);

-- Keep the candidate relationship protected without a table-level foreign key:
-- the candidate registry's immutable TRUNCATE test must remain able to reach
-- its own mutation trigger.  Candidates cannot be removed after insertion,
-- and this insert fence prevents an approved target from pointing at a
-- nonexistent candidate in the first place.
create function platform_private.ac265_validate_approved_outage_target_candidate()
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
    raise exception 'AC265 approved outage target candidate does not exist'
      using errcode = '23503';
  end if;
  return new;
end;
$function$;

revoke all on function platform_private.ac265_validate_approved_outage_target_candidate()
  from public, anon, authenticated, service_role;

create trigger ac265_approved_outage_targets_candidate_exists
  before insert
  on platform_private.ac265_approved_outage_targets
  for each row
  execute function platform_private.ac265_validate_approved_outage_target_candidate();

create function platform_private.ac265_reject_approved_outage_target_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 approved outage targets are immutable'
    using errcode = '55000';
end;
$function$;

revoke all on function platform_private.ac265_reject_approved_outage_target_mutation()
  from public, anon, authenticated, service_role;

create trigger ac265_approved_outage_targets_are_immutable
  before update or delete or truncate
  on platform_private.ac265_approved_outage_targets
  for each statement
  execute function platform_private.ac265_reject_approved_outage_target_mutation();

alter table platform_private.ac265_approved_outage_targets enable row level security;
alter table platform_private.ac265_approved_outage_targets force row level security;

revoke all on table platform_private.ac265_approved_outage_targets
  from public, anon, authenticated, service_role;

create table platform_private.ac265_hosted_outage_leases (
  lease_id uuid primary key default extensions.gen_random_uuid(),
  lease_ref text not null,
  lease_sha256 bytea not null,
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  target_id uuid not null
    references platform_private.ac265_approved_outage_targets (target_id),
  idempotency_ref text not null,
  acquire_request_sha256 bytea not null,
  environment text not null default 'staging',
  target_sha256 bytea not null,
  identity_sha256 bytea not null,
  run_id uuid not null,
  source_revision text not null,
  hosting_project_id text not null,
  supabase_project_ref text not null,
  deployment_id text not null,
  dependency_id text not null,
  route_operation_id text not null,
  route_method text not null,
  route_path text not null,
  lease_duration_seconds integer not null default 60,
  request_limit integer not null default 1,
  acquired_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_idempotency_ref text,
  consume_request_sha256 bytea,
  released_at timestamptz,
  released_idempotency_ref text,
  release_request_sha256 bytea,
  constraint ac265_hosted_outage_leases_lease_ref_unique
    unique (lease_ref),
  constraint ac265_hosted_outage_leases_acquire_idempotency_unique
    unique (authorization_id, target_id, idempotency_ref),
  constraint ac265_hosted_outage_leases_lease_ref_shape
    check (
      lease_ref ~ '^ac265-lease://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_hosted_outage_leases_lease_sha256_length
    check (octet_length(lease_sha256) = 32),
  constraint ac265_hosted_outage_leases_lease_sha256_matches_ref
    check (
      lease_sha256 = extensions.digest(convert_to(lease_ref, 'utf8'), 'sha256')
    ),
  constraint ac265_hosted_outage_leases_acquire_request_sha256_length
    check (octet_length(acquire_request_sha256) = 32),
  constraint ac265_hosted_outage_leases_target_sha256_length
    check (octet_length(target_sha256) = 32),
  constraint ac265_hosted_outage_leases_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_hosted_outage_leases_environment
    check (environment = 'staging'),
  constraint ac265_hosted_outage_leases_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_hosted_outage_leases_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_hosted_outage_leases_policy
    check (
      lease_duration_seconds = 60
      and request_limit = 1
      and expires_at = acquired_at + interval '60 seconds'
    ),
  constraint ac265_hosted_outage_leases_acquire_digests_length
    check (octet_length(acquire_request_sha256) = 32),
  constraint ac265_hosted_outage_leases_consume_digests_length
    check (
      consume_request_sha256 is null
      or octet_length(consume_request_sha256) = 32
    ),
  constraint ac265_hosted_outage_leases_release_digests_length
    check (
      release_request_sha256 is null
      or octet_length(release_request_sha256) = 32
    ),
  constraint ac265_hosted_outage_leases_consumed_fields
    check (
      (consumed_at is null and consumed_idempotency_ref is null and consume_request_sha256 is null)
      or (
        consumed_at is not null
        and consumed_idempotency_ref is not null
        and consume_request_sha256 is not null
        and consumed_at >= acquired_at
        and consumed_at < expires_at
      )
    ),
  constraint ac265_hosted_outage_leases_released_fields
    check (
      (released_at is null and released_idempotency_ref is null and release_request_sha256 is null)
      or (
        released_at is not null
        and released_idempotency_ref is not null
        and release_request_sha256 is not null
        and consumed_at is not null
        and released_at >= consumed_at
        and released_at < expires_at
      )
    )
);

-- At most one lease may be active for an authorization/target binding.  The
-- binding may issue a fresh one-use lease only after cleanup release; the
-- idempotency key above is intentionally scoped to this operation and its
-- authorization/target binding, not a global reference namespace.  It still
-- recovers an exact historical acquire retry.
create unique index ac265_hosted_outage_leases_one_active_binding_idx
  on platform_private.ac265_hosted_outage_leases (authorization_id, target_id)
  where released_at is null;

alter table platform_private.ac265_hosted_outage_leases enable row level security;
alter table platform_private.ac265_hosted_outage_leases force row level security;

revoke all on table platform_private.ac265_hosted_outage_leases
  from public, anon, authenticated, service_role;

create function platform_api.ac265_hosted_outage_lease_acquire(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
    'idempotencyRef', 'leaseDurationSeconds', 'requestLimit'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_target_ref_pattern constant text :=
    '^ac265-outage-target://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_target_id uuid;
  v_now timestamptz;
  v_request_sha256 bytea;
  v_lease_id uuid;
  v_lease_ref text;
  v_lease_sha256 bytea;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_target platform_private.ac265_approved_outage_targets%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_lease platform_private.ac265_hosted_outage_leases%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'targetRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseDurationSeconds') is distinct from 'number'
     or jsonb_typeof(p_request -> 'requestLimit') is distinct from 'number'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-outage-lease-control-v1'
     or coalesce(p_request ->> 'leaseDurationSeconds', '') <> '60'
     or coalesce(p_request ->> 'requestLimit', '') <> '1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'targetRef', '') !~ v_target_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_target_id := substring(p_request ->> 'targetRef' from v_target_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end;

  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  -- A retry of the exact request is resolved before the live authorization
  -- checks so it remains idempotent for the immutable lease that was issued.
  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.authorization_id = v_authorization_id
    and l.target_id = v_target_id
    and l.idempotency_ref = p_request ->> 'idempotencyRef'
    for update;

  if found then
    if v_lease.acquire_request_sha256 = v_request_sha256 then
      return jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
        'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
        'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
        'idempotencyRef', v_lease.idempotency_ref,
        'leaseRef', v_lease.lease_ref,
        'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
        'environment', v_lease.environment,
        'state', 'acquired',
        'leaseDurationSeconds', v_lease.lease_duration_seconds,
        'requestLimit', v_lease.request_limit,
        'acquiredAt', to_char(v_lease.acquired_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char(v_lease.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'redacted', true
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();

  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.expires_at >= v_now + interval '60 seconds';

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select tgt.*
    into v_target
  from platform_private.ac265_approved_outage_targets as tgt
  where tgt.target_id = v_target_id
    and tgt.target_ref = p_request ->> 'targetRef'
    and tgt.environment = 'staging'
    and tgt.approved_at <= v_now
    and tgt.expires_at >= v_now + interval '60 seconds';

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select cand.*
    into v_candidate
  from platform_private.ac265_verified_candidates as cand
  where cand.candidate_id = v_target.candidate_id;

  if not found
     or v_target.run_id is distinct from v_authorization.run_id
     or v_target.identity_sha256 is distinct from v_authorization.identity_sha256
     or v_target.source_revision is distinct from v_authorization.source_revision
     or v_target.deployment_id is distinct from v_authorization.deployment_id
     or v_candidate.identity_sha256 is distinct from v_authorization.identity_sha256
     or v_candidate.source_revision is distinct from v_authorization.source_revision
     or v_candidate.deployment_id is distinct from v_authorization.deployment_id
     or v_target.hosting_project_id is distinct from (v_candidate.identity ->> 'hostingProjectId')
     or v_target.supabase_project_ref is distinct from (v_candidate.identity ->> 'supabaseProjectRef') then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_lease_id := extensions.gen_random_uuid();
  v_lease_ref := 'ac265-lease://staging/' || v_lease_id::text;
  v_lease_sha256 := extensions.digest(convert_to(v_lease_ref, 'utf8'), 'sha256');

  insert into platform_private.ac265_hosted_outage_leases (
    lease_id, lease_ref, lease_sha256, authorization_id, target_id,
    idempotency_ref, acquire_request_sha256, environment, target_sha256,
    identity_sha256,
    run_id, source_revision, hosting_project_id, supabase_project_ref,
    deployment_id, dependency_id, route_operation_id, route_method, route_path,
    lease_duration_seconds, request_limit, acquired_at, expires_at
  ) values (
    v_lease_id, v_lease_ref, v_lease_sha256, v_authorization.authorization_id,
    v_target.target_id, p_request ->> 'idempotencyRef', v_request_sha256,
    'staging', v_target.target_sha256, v_target.identity_sha256, v_target.run_id,
    v_target.source_revision,
    v_target.hosting_project_id, v_target.supabase_project_ref,
    v_target.deployment_id, v_target.dependency_id, v_target.route_operation_id,
    v_target.route_method, v_target.route_path, 60, 1, v_now,
    v_now + interval '60 seconds'
  )
  on conflict do nothing
  returning * into v_lease;

  if not found then
    select l.*
      into v_lease
    from platform_private.ac265_hosted_outage_leases as l
    where l.authorization_id = v_authorization_id
      and l.target_id = v_target_id
      and l.idempotency_ref = p_request ->> 'idempotencyRef'
    for update;
    if not found or v_lease.acquire_request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
  end if;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
    'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
    'idempotencyRef', v_lease.idempotency_ref,
    'leaseRef', v_lease.lease_ref,
    'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
    'environment', v_lease.environment,
    'state', 'acquired',
    'leaseDurationSeconds', v_lease.lease_duration_seconds,
    'requestLimit', v_lease.request_limit,
    'acquiredAt', to_char(v_lease.acquired_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(v_lease.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'redacted', true
  );
end;
$function$;

revoke all on function platform_api.ac265_hosted_outage_lease_acquire(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_outage_lease_acquire(jsonb)
  to service_role;

create function platform_api.ac265_hosted_outage_lease_consume(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
    'idempotencyRef', 'leaseRef', 'leaseSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_target_ref_pattern constant text :=
    '^ac265-outage-target://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_lease_ref_pattern constant text :=
    '^ac265-lease://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_target_id uuid;
  v_lease_id uuid;
  v_now timestamptz;
  v_request_sha256 bytea;
  v_expected_lease_sha256 text;
  v_lease platform_private.ac265_hosted_outage_leases%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'targetRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-outage-lease-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'targetRef', '') !~ v_target_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'leaseRef', '') !~ v_lease_ref_pattern
     or coalesce(p_request ->> 'leaseSha256', '') !~ '^[0-9a-f]{64}$' then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_target_id := substring(p_request ->> 'targetRef' from v_target_ref_pattern)::uuid;
    v_lease_id := substring(p_request ->> 'leaseRef' from v_lease_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end;

  v_expected_lease_sha256 := encode(
    extensions.digest(convert_to(p_request ->> 'leaseRef', 'utf8'), 'sha256'),
    'hex'
  );
  if p_request ->> 'leaseSha256' <> v_expected_lease_sha256 then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;
  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id
  for update;

  if not found
     or v_lease.lease_ref <> p_request ->> 'leaseRef'
     or v_lease.authorization_id <> v_authorization_id
     or v_lease.target_id <> v_target_id then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.lease_sha256 is distinct from extensions.digest(
       convert_to(v_lease.lease_ref, 'utf8'), 'sha256'
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.consumed_at is not null then
    if v_lease.consume_request_sha256 = v_request_sha256 then
      return jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
        'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
        'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
        'idempotencyRef', v_lease.consumed_idempotency_ref,
        'leaseRef', v_lease.lease_ref,
        'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
        'environment', v_lease.environment,
        'state', 'consumed',
        'requestLimit', v_lease.request_limit,
        'consumedAt', to_char(v_lease.consumed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'redacted', true
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();
  if v_lease.expires_at <= v_now then
    return jsonb_build_object('status', 'conflict');
  end if;

  update platform_private.ac265_hosted_outage_leases
  set consumed_at = v_now,
      consumed_idempotency_ref = p_request ->> 'idempotencyRef',
      consume_request_sha256 = v_request_sha256
  where lease_id = v_lease.lease_id;

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
    'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
    'idempotencyRef', v_lease.consumed_idempotency_ref,
    'leaseRef', v_lease.lease_ref,
    'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
    'environment', v_lease.environment,
    'state', 'consumed',
    'requestLimit', v_lease.request_limit,
    'consumedAt', to_char(v_lease.consumed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'redacted', true
  );
end;
$function$;

revoke all on function platform_api.ac265_hosted_outage_lease_consume(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_outage_lease_consume(jsonb)
  to service_role;

create function platform_api.ac265_hosted_outage_lease_release(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
    'idempotencyRef', 'leaseRef', 'leaseSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_target_ref_pattern constant text :=
    '^ac265-outage-target://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_lease_ref_pattern constant text :=
    '^ac265-lease://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_target_id uuid;
  v_lease_id uuid;
  v_now timestamptz;
  v_request_sha256 bytea;
  v_expected_lease_sha256 text;
  v_lease platform_private.ac265_hosted_outage_leases%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'targetRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-outage-lease-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'targetRef', '') !~ v_target_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'leaseRef', '') !~ v_lease_ref_pattern
     or coalesce(p_request ->> 'leaseSha256', '') !~ '^[0-9a-f]{64}$' then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_target_id := substring(p_request ->> 'targetRef' from v_target_ref_pattern)::uuid;
    v_lease_id := substring(p_request ->> 'leaseRef' from v_lease_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end;

  v_expected_lease_sha256 := encode(
    extensions.digest(convert_to(p_request ->> 'leaseRef', 'utf8'), 'sha256'),
    'hex'
  );
  if p_request ->> 'leaseSha256' <> v_expected_lease_sha256 then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;
  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id
  for update;

  if not found
     or v_lease.lease_ref <> p_request ->> 'leaseRef'
     or v_lease.authorization_id <> v_authorization_id
     or v_lease.target_id <> v_target_id then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.lease_sha256 is distinct from extensions.digest(
       convert_to(v_lease.lease_ref, 'utf8'), 'sha256'
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.released_at is not null then
    if v_lease.release_request_sha256 = v_request_sha256 then
      return jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
        'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
        'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
        'idempotencyRef', v_lease.released_idempotency_ref,
        'leaseRef', v_lease.lease_ref,
        'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
        'environment', v_lease.environment,
        'state', 'released',
        'releasedAt', to_char(v_lease.released_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'redacted', true
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.consumed_at is null then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();
  if v_lease.expires_at <= v_now then
    return jsonb_build_object('status', 'conflict');
  end if;

  update platform_private.ac265_hosted_outage_leases
  set released_at = v_now,
      released_idempotency_ref = p_request ->> 'idempotencyRef',
      release_request_sha256 = v_request_sha256
  where lease_id = v_lease.lease_id;

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
    'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
    'idempotencyRef', v_lease.released_idempotency_ref,
    'leaseRef', v_lease.lease_ref,
    'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
    'environment', v_lease.environment,
    'state', 'released',
    'releasedAt', to_char(v_lease.released_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'redacted', true
  );
end;
$function$;

revoke all on function platform_api.ac265_hosted_outage_lease_release(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_outage_lease_release(jsonb)
  to service_role;

comment on table platform_private.ac265_approved_outage_targets is
  'Private, digest-only approved staging target bindings for the AC265 outage lease control plane.';
comment on function platform_private.ac265_validate_approved_outage_target_candidate() is
  'Rejects an approved target insert unless its candidate reference exists in the immutable AC265 candidate registry.';
comment on function platform_private.ac265_reject_approved_outage_target_mutation() is
  'Rejects every update, delete, and truncate of the immutable AC265 approved-target registry.';
comment on table platform_private.ac265_hosted_outage_leases is
  'Private one-use AC265 staging outage leases; lifecycle access is service_role-only through the JSONB RPCs.';
comment on function platform_api.ac265_hosted_outage_lease_acquire(jsonb) is
  'Validates a strict staging request against an existing authorization, verified candidate, and approved target, then issues a redacted 60-second one-use lease.';
comment on function platform_api.ac265_hosted_outage_lease_consume(jsonb) is
  'Consumes an AC265 lease exactly once using its opaque reference and digest, returning only a redacted server timestamp.';
comment on function platform_api.ac265_hosted_outage_lease_release(jsonb) is
  'Releases an AC265 lease only after consumption, with exact-request idempotency and conflict-only replay behavior.';
