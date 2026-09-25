-- AC265 run-scoped session broker control plane.
--
-- This migration owns only authorization, one-use resolution bookkeeping, and
-- teardown for the nine locked role handles of one protected hosted run.  It
-- deliberately stores no session state: every handle row carries the opaque
-- handle reference, its reference digest, and an opaque material reference that
-- only the external broker can dereference.  A handle reference is not a bearer
-- credential, and resolving it through these RPCs is impossible without the
-- exact live runner authorization for the same run, identity, source revision,
-- and deployment.  No live authorization, handle, or material reference is
-- seeded here.

create table platform_private.ac265_session_broker_handles (
  broker_authorization_id uuid primary key
    default extensions.gen_random_uuid(),
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  run_id uuid not null,
  identity_sha256 bytea not null,
  source_revision text not null,
  deployment_id text not null,
  environment text not null default 'staging',
  hosting_project_id text not null,
  supabase_project_ref text not null,
  idempotency_ref text not null,
  request_sha256 bytea not null,
  authorized_at timestamptz not null,
  expires_at timestamptz not null,
  constraint ac265_session_broker_handles_idempotency_unique
    unique (authorization_id, idempotency_ref),
  constraint ac265_session_broker_handles_environment
    check (environment = 'staging'),
  constraint ac265_session_broker_handles_hosting_project
    check (hosting_project_id = 'wejammin-staging'),
  constraint ac265_session_broker_handles_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_session_broker_handles_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_session_broker_handles_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_session_broker_handles_request_sha256_length
    check (octet_length(request_sha256) = 32),
  constraint ac265_session_broker_handles_idempotency_ref_shape
    check (
      idempotency_ref ~ '^ac265-idempotency://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_session_broker_handles_window
    check (
      expires_at > authorized_at
      and expires_at <= authorized_at + interval '5 minutes'
    )
);

create table platform_private.ac265_session_broker_handle_roles (
  handle_id uuid primary key default extensions.gen_random_uuid(),
  broker_authorization_id uuid not null
    references platform_private.ac265_session_broker_handles (broker_authorization_id)
    on delete cascade,
  role text not null,
  handle_ref text not null,
  handle_sha256 bytea not null,
  material_ref text not null,
  resolve_limit smallint not null default 1,
  resolves integer not null default 0,
  last_resolved_at timestamptz,
  last_resolve_idempotency_ref text,
  last_resolve_request_sha256 bytea,
  logged_out_at timestamptz,
  last_teardown_idempotency_ref text,
  last_teardown_request_sha256 bytea,
  constraint ac265_session_broker_handle_roles_role_unique
    unique (broker_authorization_id, role),
  constraint ac265_session_broker_handle_roles_handle_ref_unique
    unique (handle_ref),
  constraint ac265_session_broker_handle_roles_material_ref_unique
    unique (material_ref),
  constraint ac265_session_broker_handle_roles_role_locked
    check (
      role in (
        'entitled_read',
        'owner_full',
        'guardian_mandate',
        'junior_restricted',
        'business_mandate',
        'staff_case_scoped',
        'admin_step_up',
        'forbidden_hidden',
        'disabled_prerequisite'
      )
    ),
  constraint ac265_session_broker_handle_roles_handle_ref_shape
    check (
      handle_ref ~ '^ac265-session://(entitled_read|owner_full|guardian_mandate|junior_restricted|business_mandate|staff_case_scoped|admin_step_up|forbidden_hidden|disabled_prerequisite)/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_session_broker_handle_roles_material_ref_shape
    check (
      material_ref ~ '^ac265-session-material://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_session_broker_handle_roles_handle_ref_role_bound
    check (handle_ref like 'ac265-session://' || role || '/%'),
  constraint ac265_session_broker_handle_roles_handle_sha256_length
    check (octet_length(handle_sha256) = 32),
  constraint ac265_session_broker_handle_roles_handle_sha256_matches_ref
    check (
      handle_sha256 = extensions.digest(convert_to(handle_ref, 'utf8'), 'sha256')
    ),
  constraint ac265_session_broker_handle_roles_resolve_policy
    check (
      resolve_limit = 1
      and resolves between 0 and resolve_limit
    ),
  constraint ac265_session_broker_handle_roles_resolve_fields
    check (
      (
        resolves = 0
        and last_resolved_at is null
        and last_resolve_idempotency_ref is null
        and last_resolve_request_sha256 is null
      )
      or (
        resolves = 1
        and last_resolved_at is not null
        and last_resolve_idempotency_ref is not null
        and last_resolve_request_sha256 is not null
        and octet_length(last_resolve_request_sha256) = 32
      )
    ),
  constraint ac265_session_broker_handle_roles_teardown_fields
    check (
      (
        logged_out_at is null
        and last_teardown_idempotency_ref is null
        and last_teardown_request_sha256 is null
      )
      or (
        logged_out_at is not null
        and last_teardown_idempotency_ref is not null
        and last_teardown_request_sha256 is not null
        and octet_length(last_teardown_request_sha256) = 32
      )
    )
);

-- One handle row per role per authorized run, and no second authorization for a
-- run that already bound handles: the run's handle set is frozen at authorize
-- time so a later authorization cannot widen or swap the protected matrix.
create unique index ac265_session_broker_handles_one_per_run_idx
  on platform_private.ac265_session_broker_handles (run_id);

alter table platform_private.ac265_session_broker_handles enable row level security;
alter table platform_private.ac265_session_broker_handles force row level security;
alter table platform_private.ac265_session_broker_handle_roles enable row level security;
alter table platform_private.ac265_session_broker_handle_roles force row level security;

revoke all on table platform_private.ac265_session_broker_handles
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_session_broker_handle_roles
  from public, anon, authenticated, service_role;

create function platform_private.ac265_reject_session_broker_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 session broker records are immutable'
    using errcode = '55000';
end;
$function$;

revoke all on function platform_private.ac265_reject_session_broker_mutation()
  from public, anon, authenticated, service_role;

-- The handle set itself never changes after authorization; only the bounded
-- resolve/teardown progress columns may advance, and only through the RPCs.
create trigger ac265_session_broker_handles_are_immutable
  before update or delete or truncate
  on platform_private.ac265_session_broker_handles
  for each statement
  execute function platform_private.ac265_reject_session_broker_mutation();

create trigger ac265_session_broker_handle_roles_reject_truncate
  before truncate
  on platform_private.ac265_session_broker_handle_roles
  for each statement
  execute function platform_private.ac265_reject_session_broker_mutation();

-- Deletion is never a supported lifecycle operation: it would erase the
-- one-use resolve and teardown record that AC265 evidence must bind to.
create trigger ac265_session_broker_handle_roles_reject_delete
  before delete
  on platform_private.ac265_session_broker_handle_roles
  for each statement
  execute function platform_private.ac265_reject_session_broker_mutation();

create function platform_private.ac265_guard_session_broker_handle_role_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.broker_authorization_id is distinct from old.broker_authorization_id
     or new.role is distinct from old.role
     or new.handle_ref is distinct from old.handle_ref
     or new.handle_sha256 is distinct from old.handle_sha256
     or new.material_ref is distinct from old.material_ref
     or new.resolve_limit is distinct from old.resolve_limit then
    raise exception 'AC265 session broker handle bindings are immutable'
      using errcode = '55000';
  end if;
  if new.resolves < old.resolves
     or (old.logged_out_at is not null and new.logged_out_at is null) then
    raise exception 'AC265 session broker handle progress cannot regress'
      using errcode = '55000';
  end if;
  return new;
end;
$function$;

revoke all on function platform_private.ac265_guard_session_broker_handle_role_update()
  from public, anon, authenticated, service_role;

create trigger ac265_session_broker_handle_roles_guard_update
  before update
  on platform_private.ac265_session_broker_handle_roles
  for each row
  execute function platform_private.ac265_guard_session_broker_handle_role_update();

create function platform_private.ac265_build_session_broker_authorize_envelope(
  p_broker_authorization_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || context.authorization_id::text,
    'runId', context.run_id,
    'identitySha256', encode(context.identity_sha256, 'hex'),
    'idempotencyRef', context.idempotency_ref,
    'state', 'authorized',
    'handles', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'role', handle.role,
            'handleRef', handle.handle_ref,
            'handleSha256', encode(handle.handle_sha256, 'hex')
          )
          order by locked.position
        )
        from platform_private.ac265_session_broker_handle_roles as handle
        join (
          values
            ('entitled_read', 1),
            ('owner_full', 2),
            ('guardian_mandate', 3),
            ('junior_restricted', 4),
            ('business_mandate', 5),
            ('staff_case_scoped', 6),
            ('admin_step_up', 7),
            ('forbidden_hidden', 8),
            ('disabled_prerequisite', 9)
        ) as locked(role, position)
          on locked.role = handle.role
        where handle.broker_authorization_id = context.broker_authorization_id
      ),
      '[]'::jsonb
    ),
    'maxResolvesPerHandle', 1,
    'authorizedAt', to_char(context.authorized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(context.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'environment', context.environment,
    'hostingProjectId', context.hosting_project_id,
    'redacted', true
  )
  from platform_private.ac265_session_broker_handles as context
  where context.broker_authorization_id = p_broker_authorization_id;
$function$;

revoke all on function platform_private.ac265_build_session_broker_authorize_envelope(uuid)
  from public, anon, authenticated, service_role;

create function platform_private.ac265_build_session_broker_resolve_envelope(
  p_handle_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || context.authorization_id::text,
    'runId', context.run_id,
    'identitySha256', encode(context.identity_sha256, 'hex'),
    'role', handle.role,
    'handleRef', handle.handle_ref,
    'handleSha256', encode(handle.handle_sha256, 'hex'),
    'idempotencyRef', handle.last_resolve_idempotency_ref,
    'state', 'resolved',
    'materialRef', handle.material_ref,
    'maxResolvesPerHandle', 1,
    'resolvedAt', to_char(handle.last_resolved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(context.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'environment', context.environment,
    'hostingProjectId', context.hosting_project_id,
    'redacted', true
  )
  from platform_private.ac265_session_broker_handle_roles as handle
  join platform_private.ac265_session_broker_handles as context
    on context.broker_authorization_id = handle.broker_authorization_id
  where handle.handle_id = p_handle_id;
$function$;

revoke all on function platform_private.ac265_build_session_broker_resolve_envelope(uuid)
  from public, anon, authenticated, service_role;

create function platform_private.ac265_build_session_broker_teardown_envelope(
  p_handle_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || context.authorization_id::text,
    'runId', context.run_id,
    'identitySha256', encode(context.identity_sha256, 'hex'),
    'role', handle.role,
    'handleRef', handle.handle_ref,
    'handleSha256', encode(handle.handle_sha256, 'hex'),
    'idempotencyRef', handle.last_teardown_idempotency_ref,
    'state', 'logged_out',
    'logoutScope', 'current_session_only',
    'sessionRefSha256', encode(handle.handle_sha256, 'hex'),
    'teardownsRemaining', (
      select count(*)::integer
      from platform_private.ac265_session_broker_handle_roles as pending
      where pending.broker_authorization_id = context.broker_authorization_id
        and pending.logged_out_at is null
    ),
    'loggedOutAt', to_char(handle.logged_out_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'environment', context.environment,
    'hostingProjectId', context.hosting_project_id,
    'redacted', true
  )
  from platform_private.ac265_session_broker_handle_roles as handle
  join platform_private.ac265_session_broker_handles as context
    on context.broker_authorization_id = handle.broker_authorization_id
  where handle.handle_id = p_handle_id;
$function$;

revoke all on function platform_private.ac265_build_session_broker_teardown_envelope(uuid)
  from public, anon, authenticated, service_role;

comment on table platform_private.ac265_session_broker_handles is
  'Private immutable run-scoped session broker authorizations for one protected AC265 hosted run; carries no session state, only reference digests.';
comment on table platform_private.ac265_session_broker_handle_roles is
  'Private one-use resolve and current-session-only teardown bookkeeping for the nine locked role handles; session material never enters this table.';
comment on function platform_private.ac265_reject_session_broker_mutation() is
  'Rejects every update, delete, and truncate of the immutable AC265 session broker authorization header.';
comment on function platform_private.ac265_guard_session_broker_handle_role_update() is
  'Rejects any AC265 session broker handle binding change and any regression of bounded resolve or teardown progress.';

create function platform_api.ac265_session_broker_authorize(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'runId',
    'identitySha256', 'idempotencyRef', 'handles'
  ];
  v_role_keys constant text[] := array[
    'entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted',
    'business_mandate', 'staff_case_scoped', 'admin_step_up',
    'forbidden_hidden', 'disabled_prerequisite'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_handle_ref_pattern constant text :=
    '^ac265-session://(' || array_to_string(v_role_keys, '|') || ')/(' || v_uuid_pattern || ')$';
  v_material_ref_pattern constant text :=
    '^ac265-session-material://staging/(' || v_uuid_pattern || ')$';
  v_digest_pattern constant text := '^[a-f0-9]{64}$';
  v_authorization_id uuid;
  v_request_sha256 bytea;
  v_now timestamptz;
  v_broker_authorization_id uuid;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_existing platform_private.ac265_session_broker_handles%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'runId') is distinct from 'string'
     or jsonb_typeof(p_request -> 'identitySha256') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'handles') is distinct from 'array'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-session-broker-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'identitySha256', '') !~ v_digest_pattern
     or coalesce(p_request ->> 'runId', '') !~ ('^' || v_uuid_pattern || '$')
     or jsonb_array_length(p_request -> 'handles') <> 9
     or exists (
       select 1
       from jsonb_array_elements(p_request -> 'handles') as item(value)
       where jsonb_typeof(item.value) <> 'object'
         or (item.value - array['role', 'handleRef', 'handleSha256', 'materialRef'])
            <> '{}'::jsonb
         or jsonb_typeof(item.value -> 'role') is distinct from 'string'
         or jsonb_typeof(item.value -> 'handleRef') is distinct from 'string'
         or jsonb_typeof(item.value -> 'handleSha256') is distinct from 'string'
         or jsonb_typeof(item.value -> 'materialRef') is distinct from 'string'
         or coalesce(item.value ->> 'role', '') <> all(v_role_keys)
         or coalesce(item.value ->> 'handleRef', '') !~ v_handle_ref_pattern
         or coalesce(item.value ->> 'materialRef', '') !~ v_material_ref_pattern
         or coalesce(item.value ->> 'handleSha256', '') !~ v_digest_pattern
         or (item.value ->> 'handleRef') not like 'ac265-session://' || (item.value ->> 'role') || '/%'
         or decode(item.value ->> 'handleSha256', 'hex')
            <> extensions.digest(convert_to(item.value ->> 'handleRef', 'utf8'), 'sha256')
     )
     or (
       select count(distinct item.value ->> 'role')
       from jsonb_array_elements(p_request -> 'handles') as item(value)
     ) <> 9
     or (
       select count(distinct item.value ->> 'handleRef')
       from jsonb_array_elements(p_request -> 'handles') as item(value)
     ) <> 9
     or (
       select count(distinct item.value ->> 'materialRef')
       from jsonb_array_elements(p_request -> 'handles') as item(value)
     ) <> 9 then
    raise exception 'AC265 session broker authorization request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 session broker authorization request rejected'
      using errcode = '22023';
  end;

  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  -- An exact retry resolves to the frozen handle set before any live checks so
  -- it stays idempotent after the authorization window closes.
  select broker.*
    into v_existing
  from platform_private.ac265_session_broker_handles as broker
  where broker.authorization_id = v_authorization_id
    and broker.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;

  if found then
    if v_existing.request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_session_broker_authorize_envelope(
        v_existing.broker_authorization_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();

  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.run_id = (p_request ->> 'runId')::uuid
    and authz.identity_sha256 = decode(p_request ->> 'identitySha256', 'hex')
    and authz.expires_at >= v_now + interval '60 seconds';

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select cand.*
    into v_candidate
  from platform_private.ac265_verified_candidates as cand
  where cand.identity_sha256 = v_authorization.identity_sha256
    and cand.source_revision = v_authorization.source_revision
    and cand.deployment_id = v_authorization.deployment_id;

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_broker_authorization_id := extensions.gen_random_uuid();

  begin
    insert into platform_private.ac265_session_broker_handles (
      broker_authorization_id,
      authorization_id,
      run_id,
      identity_sha256,
      source_revision,
      deployment_id,
      environment,
      hosting_project_id,
      supabase_project_ref,
      idempotency_ref,
      request_sha256,
      authorized_at,
      expires_at
    ) values (
      v_broker_authorization_id,
      v_authorization.authorization_id,
      v_authorization.run_id,
      v_authorization.identity_sha256,
      v_authorization.source_revision,
      v_authorization.deployment_id,
      'staging',
      v_candidate.identity ->> 'hostingProjectId',
      v_candidate.identity ->> 'supabaseProjectRef',
      p_request ->> 'idempotencyRef',
      v_request_sha256,
      v_now,
      -- The broker window can never outlive the runner authorization it was
      -- derived from; a short remaining authorization yields a short window.
      least(v_now + interval '5 minutes', v_authorization.expires_at)
    );

    insert into platform_private.ac265_session_broker_handle_roles (
      broker_authorization_id,
      role,
      handle_ref,
      handle_sha256,
      material_ref
    )
    select
      v_broker_authorization_id,
      item.value ->> 'role',
      item.value ->> 'handleRef',
      decode(item.value ->> 'handleSha256', 'hex'),
      item.value ->> 'materialRef'
    from jsonb_array_elements(p_request -> 'handles') as item(value);
  exception
    when unique_violation then
      return jsonb_build_object('status', 'conflict');
  end;

  return platform_private.ac265_build_session_broker_authorize_envelope(
    v_broker_authorization_id
  );
end;
$function$;

revoke all on function platform_api.ac265_session_broker_authorize(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_session_broker_authorize(jsonb)
  to service_role;

create function platform_api.ac265_session_broker_resolve(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'runId',
    'identitySha256', 'idempotencyRef', 'role', 'handleRef', 'handleSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_digest_pattern constant text := '^[a-f0-9]{64}$';
  v_authorization_id uuid;
  v_request_sha256 bytea;
  v_now timestamptz;
  v_context platform_private.ac265_session_broker_handles%rowtype;
  v_handle platform_private.ac265_session_broker_handle_roles%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'runId') is distinct from 'string'
     or jsonb_typeof(p_request -> 'identitySha256') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'role') is distinct from 'string'
     or jsonb_typeof(p_request -> 'handleRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'handleSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-session-broker-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'identitySha256', '') !~ v_digest_pattern
     or coalesce(p_request ->> 'handleSha256', '') !~ v_digest_pattern
     or coalesce(p_request ->> 'runId', '') !~ ('^' || v_uuid_pattern || '$')
     or (p_request ->> 'handleRef') not like 'ac265-session://' || (p_request ->> 'role') || '/%'
     or decode(p_request ->> 'handleSha256', 'hex')
        <> extensions.digest(convert_to(p_request ->> 'handleRef', 'utf8'), 'sha256') then
    raise exception 'AC265 session broker resolve request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 session broker resolve request rejected'
      using errcode = '22023';
  end;

  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select handle.*
    into v_handle
  from platform_private.ac265_session_broker_handle_roles as handle
  where handle.handle_ref = p_request ->> 'handleRef'
    and handle.role = p_request ->> 'role'
  for update;

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select context.*
    into v_context
  from platform_private.ac265_session_broker_handles as context
  where context.broker_authorization_id = v_handle.broker_authorization_id;

  if not found
     or v_context.authorization_id <> v_authorization_id
     or v_context.run_id <> (p_request ->> 'runId')::uuid
     or v_context.identity_sha256 <> decode(p_request ->> 'identitySha256', 'hex') then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- Exact replay of the single permitted resolve returns the same envelope,
  -- including after expiry, so teardown evidence stays bound to one resolve.
  if v_handle.resolves = 1 then
    if v_handle.last_resolve_request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_session_broker_resolve_envelope(
        v_handle.handle_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();

  if v_context.expires_at <= v_now then
    return jsonb_build_object('status', 'conflict');
  end if;

  update platform_private.ac265_session_broker_handle_roles
  set resolves = 1,
      last_resolved_at = v_now,
      last_resolve_idempotency_ref = p_request ->> 'idempotencyRef',
      last_resolve_request_sha256 = v_request_sha256
  where handle_id = v_handle.handle_id;

  return platform_private.ac265_build_session_broker_resolve_envelope(
    v_handle.handle_id
  );
end;
$function$;

revoke all on function platform_api.ac265_session_broker_resolve(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_session_broker_resolve(jsonb)
  to service_role;

create function platform_api.ac265_session_broker_teardown(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'runId',
    'identitySha256', 'idempotencyRef', 'role', 'handleRef', 'handleSha256',
    'logoutScope'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_digest_pattern constant text := '^[a-f0-9]{64}$';
  v_authorization_id uuid;
  v_request_sha256 bytea;
  v_now timestamptz;
  v_context platform_private.ac265_session_broker_handles%rowtype;
  v_handle platform_private.ac265_session_broker_handle_roles%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'runId') is distinct from 'string'
     or jsonb_typeof(p_request -> 'identitySha256') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'role') is distinct from 'string'
     or jsonb_typeof(p_request -> 'handleRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'handleSha256') is distinct from 'string'
     or jsonb_typeof(p_request -> 'logoutScope') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-session-broker-control-v1'
     or coalesce(p_request ->> 'logoutScope', '') <> 'current_session_only'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'identitySha256', '') !~ v_digest_pattern
     or coalesce(p_request ->> 'handleSha256', '') !~ v_digest_pattern
     or coalesce(p_request ->> 'runId', '') !~ ('^' || v_uuid_pattern || '$')
     or (p_request ->> 'handleRef') not like 'ac265-session://' || (p_request ->> 'role') || '/%'
     or decode(p_request ->> 'handleSha256', 'hex')
        <> extensions.digest(convert_to(p_request ->> 'handleRef', 'utf8'), 'sha256') then
    raise exception 'AC265 session broker teardown request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 session broker teardown request rejected'
      using errcode = '22023';
  end;

  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select handle.*
    into v_handle
  from platform_private.ac265_session_broker_handle_roles as handle
  where handle.handle_ref = p_request ->> 'handleRef'
    and handle.role = p_request ->> 'role'
  for update;

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select context.*
    into v_context
  from platform_private.ac265_session_broker_handles as context
  where context.broker_authorization_id = v_handle.broker_authorization_id;

  if not found
     or v_context.authorization_id <> v_authorization_id
     or v_context.run_id <> (p_request ->> 'runId')::uuid
     or v_context.identity_sha256 <> decode(p_request ->> 'identitySha256', 'hex') then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- Logging out is idempotent per handle and never requires a prior resolve, so
  -- teardown can still complete after a failed or interrupted run.
  if v_handle.logged_out_at is not null then
    if v_handle.last_teardown_request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_session_broker_teardown_envelope(
        v_handle.handle_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();

  update platform_private.ac265_session_broker_handle_roles
  set logged_out_at = v_now,
      last_teardown_idempotency_ref = p_request ->> 'idempotencyRef',
      last_teardown_request_sha256 = v_request_sha256
  where handle_id = v_handle.handle_id;

  return platform_private.ac265_build_session_broker_teardown_envelope(
    v_handle.handle_id
  );
end;
$function$;

revoke all on function platform_api.ac265_session_broker_teardown(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_session_broker_teardown(jsonb)
  to service_role;

comment on function platform_api.ac265_session_broker_authorize(jsonb) is
  'Binds the nine locked role handles to one live run authorization and returns a redacted handle envelope; a handle reference is never a bearer credential.';
comment on function platform_api.ac265_session_broker_resolve(jsonb) is
  'Authorizes exactly one resolution per role handle for the exact authorized run and runner identity and returns only an opaque session-material reference and short expiry.';
comment on function platform_api.ac265_session_broker_teardown(jsonb) is
  'Records current-session-only teardown for one run-scoped handle and returns the handle-digest-bound teardown evidence envelope; it never revokes another session.';
