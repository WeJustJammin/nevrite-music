begin;

create extension if not exists pgtap with schema extensions;

-- Fixed plan: 59 assertions, enumerated below in source order.  A hard count
-- keeps this suite from silently passing if an assertion is dropped.
select plan(59);

-- The broker control plane owns authorization, one-use resolve bookkeeping, and
-- teardown only.  It must never hold session state, and it must stay
-- unreachable except through the three service-role RPCs.
select ok(
  to_regclass('platform_private.ac265_session_broker_handles') is not null
  and coalesce(
    (
      select relrowsecurity and relforcerowsecurity
      from pg_catalog.pg_class
      where oid = to_regclass('platform_private.ac265_session_broker_handles')
    ),
    false
  ),
  'session broker authorizations exist as an enabled, forced-RLS private table'
);

select ok(
  to_regclass('platform_private.ac265_session_broker_handle_roles') is not null
  and coalesce(
    (
      select relrowsecurity and relforcerowsecurity
      from pg_catalog.pg_class
      where oid = to_regclass('platform_private.ac265_session_broker_handle_roles')
    ),
    false
  ),
  'session broker handles exist as an enabled, forced-RLS private table'
);

select ok(
  to_regprocedure('platform_api.ac265_session_broker_authorize(jsonb)') is not null
  and to_regprocedure('platform_api.ac265_session_broker_resolve(jsonb)') is not null
  and to_regprocedure('platform_api.ac265_session_broker_teardown(jsonb)') is not null,
  'authorize, resolve, and teardown RPCs exist with the strict JSONB request shape'
);

select ok(
  coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_session_broker_authorize(jsonb)'),
      'execute'
    ),
    false
  )
  and coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_session_broker_resolve(jsonb)'),
      'execute'
    ),
    false
  )
  and coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_session_broker_teardown(jsonb)'),
      'execute'
    ),
    false
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_session_broker_authorize(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_session_broker_authorize(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_session_broker_resolve(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_session_broker_resolve(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_session_broker_teardown(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_session_broker_teardown(jsonb)'),
      'execute'
    ),
    true
  ),
  'only service_role can execute the session broker RPCs'
);

select ok(
  (
    select count(*) = 3
      and bool_and(
        p.prosecdef
        and p.proconfig = array['search_path=""']::text[]
      )
    from pg_catalog.pg_proc as p
    where p.oid in (
      to_regprocedure('platform_api.ac265_session_broker_authorize(jsonb)'),
      to_regprocedure('platform_api.ac265_session_broker_resolve(jsonb)'),
      to_regprocedure('platform_api.ac265_session_broker_teardown(jsonb)')
    )
  ),
  'all session broker RPCs are SECURITY DEFINER with an exact empty search_path'
);

select ok(
  coalesce(
    (
      select bool_and(
        not coalesce(
          has_table_privilege(
            role_name,
            to_regclass(table_name),
            privilege_name
          ),
          false
        )
      )
      from (
        values
          ('public'::name),
          ('anon'::name),
          ('authenticated'::name),
          ('service_role'::name)
      ) as roles(role_name)
      cross join (
        values
          ('platform_private.ac265_session_broker_handles'::text),
          ('platform_private.ac265_session_broker_handle_roles'::text)
      ) as target_tables(table_name)
      cross join (
        values
          ('SELECT'::text),
          ('INSERT'::text),
          ('UPDATE'::text),
          ('DELETE'::text),
          ('TRUNCATE'::text),
          ('REFERENCES'::text),
          ('TRIGGER'::text)
      ) as grant_privileges(privilege_name)
    ),
    false
  ),
  'session broker tables have no direct grants to any API role'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_attribute
    where attrelid in (
        to_regclass('platform_private.ac265_session_broker_handles'),
        to_regclass('platform_private.ac265_session_broker_handle_roles')
      )
      and attnum > 0
      and not attisdropped
      and attname ~* '(raw|secret|credential|token|cookie|payload|body|bytes|session_state|storagestate)'
  ),
  'session broker storage keeps only opaque references, digests, and state'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relation
    where relation.relnamespace = 'platform_private'::regnamespace
      and relation.relkind = 'S'
      and relation.relname in (
        'ac265_session_broker_handles_broker_authorization_id_seq',
        'ac265_session_broker_handle_roles_handle_id_seq'
      )
  ),
  'session broker identifiers do not create exposed sequences'
);

select lives_ok(
  $$
  do $do$
  declare
    v_count bigint;
  begin
    if to_regclass('platform_private.ac265_session_broker_handle_roles') is null then
      raise exception 'missing relation platform_private.ac265_session_broker_handle_roles';
    end if;
    execute 'select count(*) from platform_private.ac265_session_broker_handle_roles'
      into v_count;
    if v_count <> 0 then
      raise exception 'session broker handle table was seeded with % live rows', v_count;
    end if;
  end
  $do$
  $$,
  'the migration does not seed a live session broker handle'
);

create temporary table ac265_broker_results (
  result_name text primary key,
  result jsonb
) on commit drop;

create temporary table ac265_broker_requests (
  request_name text primary key,
  request jsonb not null
) on commit drop;

-- The private broker tables deliberately grant nothing to service_role, so the
-- fixture and result tables must be granted explicitly for the role-switched
-- RPC calls below.
grant select, insert on ac265_broker_requests to service_role;
grant select, insert on ac265_broker_results to service_role;

-- The candidate and runner authorization rows are the same server-side identity
-- material consumed by ac265_prepare_hosted_run.  They are disposable fixtures;
-- the broker must derive every scope field from them and reject caller scope.
select lives_ok(
  $$
  insert into platform_private.ac265_verified_candidates (
    candidate_id, identity_sha256, source_revision, deployment_id,
    ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
    ci_artifact_id, staging_artifact_id, identity, provenance
  ) values (
    '10000000-0000-4000-8000-000000000010'::uuid,
    decode('ac265b0' || repeat('b', 64 - 7), 'hex'),
    repeat('a', 40),
    'ac265brokerb1',
    '34799000001',
    2,
    '34799000002',
    1,
    8801,
    9901,
    jsonb_build_object(
      'environment', 'staging',
      'ciRunId', '34799000001',
      'ciRunAttempt', 2,
      'stagingRunId', '34799000002',
      'stagingRunAttempt', 1,
      'sourceRevision', repeat('a', 40),
      'deploymentId', 'ac265brokerb1',
      'deployedAt', '2026-09-14T01:01:00.000Z',
      'buildId', 'build-34751474024-2',
      'buildManifestSha256', repeat('c', 64),
      'artifactSha256', repeat('d', 64),
      'hostingAccountId', repeat('e', 32),
      'hostingProjectId', 'wejammin-staging',
      'supabaseProjectRef', 'abcdefghijklmnopqrst',
      'migrationVersion', '20260910023405',
      'migrationSha256', repeat('f', 64),
      'webOrigin', 'https://staging.wejamm.in',
      'apiOrigin', 'https://wejammin-api-staging.wejammin.workers.dev',
      'supabaseOrigin', 'https://abcdefghijklmnopqrst.supabase.co'
    ),
    '{}'::jsonb
  )
  $$,
  'the disposable verified staging candidate fixture loads'
);

select lives_ok(
  $$
  insert into platform_private.ac265_runner_authorizations (
    authorization_id, run_id, identity_sha256, source_revision, deployment_id,
    github_run_id, github_run_attempt, workflow_sha, jti_sha256,
    request_sha256, authorized_at, expires_at
  ) values (
    '20000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    decode('ac265b0' || repeat('b', 64 - 7), 'hex'),
    repeat('a', 40),
    'ac265brokerb1',
    '34796668543',
    1,
    repeat('a', 40),
    decode(repeat('7', 64), 'hex'),
    decode(repeat('8', 64), 'hex'),
    clock_timestamp() - interval '10 seconds',
    clock_timestamp() + interval '4 minutes'
  )
  $$,
  'the disposable authorized runner fixture loads'
);

-- The nine locked roles with one opaque handle and one material reference each.
create temporary table ac265_broker_handles (
  role text primary key,
  handle_ref text not null,
  handle_sha256 text not null,
  material_ref text not null
) on commit drop;

insert into ac265_broker_handles (role, handle_ref, handle_sha256, material_ref)
select
  locked.role,
  'ac265-session://' || locked.role || '/' || locked.id::text,
  encode(
    extensions.digest(
      convert_to('ac265-session://' || locked.role || '/' || locked.id::text, 'utf8'),
      'sha256'
    ),
    'hex'
  ),
  'ac265-session-material://staging/' || locked.material_id::text
from (
  values
    ('entitled_read', '31000000-0000-4000-8000-000000000001'::uuid, '32000000-0000-4000-8000-000000000001'::uuid),
    ('owner_full', '31000000-0000-4000-8000-000000000002'::uuid, '32000000-0000-4000-8000-000000000002'::uuid),
    ('guardian_mandate', '31000000-0000-4000-8000-000000000003'::uuid, '32000000-0000-4000-8000-000000000003'::uuid),
    ('junior_restricted', '31000000-0000-4000-8000-000000000004'::uuid, '32000000-0000-4000-8000-000000000004'::uuid),
    ('business_mandate', '31000000-0000-4000-8000-000000000005'::uuid, '32000000-0000-4000-8000-000000000005'::uuid),
    ('staff_case_scoped', '31000000-0000-4000-8000-000000000006'::uuid, '32000000-0000-4000-8000-000000000006'::uuid),
    ('admin_step_up', '31000000-0000-4000-8000-000000000007'::uuid, '32000000-0000-4000-8000-000000000007'::uuid),
    ('forbidden_hidden', '31000000-0000-4000-8000-000000000008'::uuid, '32000000-0000-4000-8000-000000000008'::uuid),
    ('disabled_prerequisite', '31000000-0000-4000-8000-000000000009'::uuid, '32000000-0000-4000-8000-000000000009'::uuid)
) as locked(role, id, material_id);

insert into ac265_broker_requests (request_name, request)
select
  'authorize',
  jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001',
    'runId', '10000000-0000-4000-8000-000000000001',
    'identitySha256', 'ac265b0' || repeat('b', 64 - 7),
    'idempotencyRef', 'ac265-idempotency://staging/41000000-0000-4000-8000-000000000001',
    'handles', jsonb_agg(
      jsonb_build_object(
        'role', handle.role,
        'handleRef', handle.handle_ref,
        'handleSha256', handle.handle_sha256,
        'materialRef', handle.material_ref
      )
      order by handle.role
    )
  )
from ac265_broker_handles as handle;

-- A malformed authorize request is rejected before any live check runs.
select throws_ok(
  $$
  select platform_api.ac265_session_broker_authorize(
    (
      select request
      from pg_temp.ac265_broker_requests
      where request_name = 'authorize'
    ) || jsonb_build_object('runId', 'not-a-uuid')
  )
  $$,
  '22023',
  'AC265 session broker authorization request rejected',
  'a non-UUID run identifier is rejected as a malformed request'
);

select throws_ok(
  $$
  select platform_api.ac265_session_broker_authorize(
    (
      select request
      from pg_temp.ac265_broker_requests
      where request_name = 'authorize'
    ) || jsonb_build_object('callbackOrigin', 'https://example.test')
  )
  $$,
  '22023',
  'AC265 session broker authorization request rejected',
  'a caller-supplied unknown member is rejected as a malformed request'
);

select throws_ok(
  $$
  select platform_api.ac265_session_broker_authorize(
    jsonb_set(
      (
        select request
        from pg_temp.ac265_broker_requests
        where request_name = 'authorize'
      ),
      '{handles,0,handleSha256}',
      to_jsonb(repeat('0', 64))
    )
  )
  $$,
  '22023',
  'AC265 session broker authorization request rejected',
  'a handle digest that does not match its reference is rejected'
);

select throws_ok(
  $$
  select platform_api.ac265_session_broker_authorize(
    jsonb_set(
      (
        select request
        from pg_temp.ac265_broker_requests
        where request_name = 'authorize'
      ),
      '{handles}',
      (
        select (request -> 'handles') - 8
        from pg_temp.ac265_broker_requests
        where request_name = 'authorize'
      )
    )
  )
  $$,
  '22023',
  'AC265 session broker authorization request rejected',
  'a handle array that is not exactly nine entries is rejected'
);

-- Only service_role reaches the RPCs; an anon caller is stopped by grants.
-- The request is carried through a session setting so the assertion isolates
-- the function grant instead of failing earlier on fixture-table privileges.
select pg_catalog.set_config(
  'ac265_broker.authorize_request',
  (
    select request::text
    from pg_temp.ac265_broker_requests
    where request_name = 'authorize'
  ),
  true
);

set local role anon;
select throws_ok(
  $$
  select platform_api.ac265_session_broker_authorize(
    current_setting('ac265_broker.authorize_request')::jsonb
  )
  $$,
  '42501',
  null,
  'an anon caller cannot reach the session broker authorization RPC'
);
reset role;

set local role authenticated;
select throws_ok(
  $$
  select platform_api.ac265_session_broker_resolve(
    jsonb_build_object('criterion', 'P2-S09-AC-265')
  )
  $$,
  '42501',
  null,
  'an authenticated caller cannot reach the session broker resolve RPC'
);
reset role;

-- The private tables stay unreadable even when a row exists.
set local role anon;
select throws_ok(
  $$select count(*) from platform_private.ac265_session_broker_handles$$,
  '42501',
  null,
  'an anon caller cannot read the private session broker authorizations'
);
reset role;

-- service_role holds schema usage but no direct table privilege, so it must
-- still fail closed on a direct read.
set local role service_role;
select throws_ok(
  $$select count(*) from platform_private.ac265_session_broker_handle_roles$$,
  '42501',
  null,
  'service_role cannot read session broker handles directly'
);
reset role;

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'authorize', platform_api.ac265_session_broker_authorize(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'authorize'
  $$,
  'a matching live authorization binds all nine role handles'
);
reset role;

select is(
  (select result ->> 'state' from ac265_broker_results where result_name = 'authorize'),
  'authorized',
  'the authorization envelope reports the authorized state'
);

select is(
  (select jsonb_array_length(result -> 'handles') from ac265_broker_results where result_name = 'authorize'),
  9,
  'the authorization envelope returns exactly nine handles'
);

select ok(
  (
    select result ?& array['criterion', 'schemaVersion', 'authorizationRef', 'runId',
      'identitySha256', 'idempotencyRef', 'state', 'handles', 'maxResolvesPerHandle',
      'authorizedAt', 'expiresAt', 'environment', 'hostingProjectId', 'redacted']
      and not result ?| array['cookies', 'storageState', 'storage_state', 'accessToken',
        'refreshToken', 'material', 'session']
    from ac265_broker_results
    where result_name = 'authorize'
  ),
  'the authorization envelope carries only the redacted handle set'
);

select is(
  (
    select result ->> 'expiresAt'
    from ac265_broker_results
    where result_name = 'authorize'
  ),
  to_char(
    (
      select expires_at
      from platform_private.ac265_session_broker_handles
      where run_id = '10000000-0000-4000-8000-000000000001'::uuid
    ) at time zone 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
  ),
  'the envelope expiry is exactly the server-derived handle window'
);

select ok(
  (
    select count(*) = 9
      and bool_and(
        handle_ref like 'ac265-session://' || role || '/%'
        and handle_sha256 =
          extensions.digest(convert_to(handle_ref, 'utf8'), 'sha256')
        and material_ref like 'ac265-session-material://staging/%'
        and resolves = 0
        and logged_out_at is null
      )
    from platform_private.ac265_session_broker_handle_roles
  ),
  'every stored handle is role-bound, digest-matched, unresolved and not logged out'
);

-- Exactly one resolve per handle; the handle reference alone is not authority.
insert into ac265_broker_requests (request_name, request)
select
  'resolve-owner',
  jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001',
    'runId', '10000000-0000-4000-8000-000000000001',
    'identitySha256', 'ac265b0' || repeat('b', 64 - 7),
    'idempotencyRef', 'ac265-idempotency://staging/41000000-0000-4000-8000-000000000002',
    'role', handle.role,
    'handleRef', handle.handle_ref,
    'handleSha256', handle.handle_sha256
  )
from ac265_broker_handles as handle
where handle.role = 'owner_full';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'resolve-owner', platform_api.ac265_session_broker_resolve(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'resolve-owner'
  $$,
  'the first resolve of a bound handle is authorized'
);
reset role;

select is(
  (select result ->> 'state' from ac265_broker_results where result_name = 'resolve-owner'),
  'resolved',
  'the resolve envelope reports the resolved state'
);

select ok(
  (
    select result ->> 'materialRef' = handle.material_ref
      and result ->> 'materialRef' <> result ->> 'handleRef'
      and result ->> 'maxResolvesPerHandle' = '1'
      and result ?& array['materialRef', 'resolvedAt', 'expiresAt', 'redacted']
      and not result ?| array['cookies', 'storageState', 'accessToken', 'refreshToken']
    from ac265_broker_results
    cross join ac265_broker_handles as handle
    where result_name = 'resolve-owner'
      and handle.role = 'owner_full'
  ),
  'the resolve envelope returns only an opaque material reference and short expiry'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'resolve-owner-replay', platform_api.ac265_session_broker_resolve(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'resolve-owner'
  $$,
  'an exact resolve replay is idempotent'
);
reset role;

select is(
  (
    select (select result from ac265_broker_results where result_name = 'resolve-owner-replay')
      = (select result from ac265_broker_results where result_name = 'resolve-owner')
  ),
  true,
  'the resolve replay returns the identical resolved envelope'
);

insert into ac265_broker_requests (request_name, request)
select
  'resolve-owner-second',
  jsonb_set(
    request,
    '{idempotencyRef}',
    to_jsonb('ac265-idempotency://staging/41000000-0000-4000-8000-000000000003'::text)
  )
from ac265_broker_requests
where request_name = 'resolve-owner';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'resolve-owner-second', platform_api.ac265_session_broker_resolve(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'resolve-owner-second'
  $$,
  'a second distinct resolve reaches the one-use fence'
);
reset role;

select is(
  (select result from ac265_broker_results where result_name = 'resolve-owner-second'),
  '{"status":"conflict"}'::jsonb,
  'a handle can be resolved only once per run'
);

select is(
  (
    select resolves
    from platform_private.ac265_session_broker_handle_roles
    where role = 'owner_full'
  ),
  1,
  'the rejected second resolve leaves the stored resolve count unchanged'
);

-- A handle reference alone cannot resolve: the run identity and authorization
-- must match the exact stored run.
set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'resolve-foreign-run', platform_api.ac265_session_broker_resolve(
    jsonb_set(
      request,
      '{runId}',
      to_jsonb('10000000-0000-4000-8000-000000000099'::text)
    )
  )
  from pg_temp.ac265_broker_requests
  where request_name = 'resolve-owner'
  $$,
  'a foreign run identifier reaches the run-binding fence'
);
reset role;

select is(
  (select result from ac265_broker_results where result_name = 'resolve-foreign-run'),
  '{"status":"conflict"}'::jsonb,
  'a handle reference is not a bearer credential for another run'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'resolve-foreign-identity', platform_api.ac265_session_broker_resolve(
    jsonb_set(
      request,
      '{identitySha256}',
      to_jsonb(repeat('9', 64))
    )
  )
  from pg_temp.ac265_broker_requests
  where request_name = 'resolve-owner'
  $$,
  'a foreign runner identity reaches the identity-binding fence'
);
reset role;

select is(
  (select result from ac265_broker_results where result_name = 'resolve-foreign-identity'),
  '{"status":"conflict"}'::jsonb,
  'only the authorized runner identity can resolve the run handles'
);

-- Teardown logs out one current session only and never depends on a resolve.
insert into ac265_broker_requests (request_name, request)
select
  'teardown-disabled',
  jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001',
    'runId', '10000000-0000-4000-8000-000000000001',
    'identitySha256', 'ac265b0' || repeat('b', 64 - 7),
    'idempotencyRef', 'ac265-idempotency://staging/41000000-0000-4000-8000-000000000004',
    'role', handle.role,
    'handleRef', handle.handle_ref,
    'handleSha256', handle.handle_sha256,
    'logoutScope', 'current_session_only'
  )
from ac265_broker_handles as handle
where handle.role = 'disabled_prerequisite';

select throws_ok(
  $$
  select platform_api.ac265_session_broker_teardown(
    jsonb_set(
      (select request from pg_temp.ac265_broker_requests where request_name = 'teardown-disabled'),
      '{logoutScope}',
      to_jsonb('global'::text)
    )
  )
  $$,
  '22023',
  'AC265 session broker teardown request rejected',
  'any logout scope other than current_session_only is rejected'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'teardown-disabled', platform_api.ac265_session_broker_teardown(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'teardown-disabled'
  $$,
  'teardown succeeds for a handle that was never resolved'
);
reset role;

select ok(
  (
    select result ->> 'state' = 'logged_out'
      and result ->> 'logoutScope' = 'current_session_only'
      and result ->> 'sessionRefSha256' = handle.handle_sha256
      and result ->> 'teardownsRemaining' = '8'
      and result ->> 'role' = 'disabled_prerequisite'
      and result ?& array['loggedOutAt', 'redacted']
    from ac265_broker_results
    cross join ac265_broker_handles as handle
    where result_name = 'teardown-disabled'
      and handle.role = 'disabled_prerequisite'
  ),
  'the teardown envelope binds the exact handle digest and reports the remaining count'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'teardown-disabled-replay', platform_api.ac265_session_broker_teardown(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'teardown-disabled'
  $$,
  'an exact teardown replay is idempotent'
);
reset role;

select is(
  (
    select (select result from ac265_broker_results where result_name = 'teardown-disabled-replay')
      = (select result from ac265_broker_results where result_name = 'teardown-disabled')
  ),
  true,
  'the teardown replay returns the identical logged-out envelope'
);

insert into ac265_broker_requests (request_name, request)
select
  'teardown-disabled-second',
  jsonb_set(
    request,
    '{idempotencyRef}',
    to_jsonb('ac265-idempotency://staging/41000000-0000-4000-8000-000000000005'::text)
  )
from ac265_broker_requests
where request_name = 'teardown-disabled';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'teardown-disabled-second', platform_api.ac265_session_broker_teardown(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'teardown-disabled-second'
  $$,
  'a second distinct teardown reaches the logged-out fence'
);
reset role;

select is(
  (select result from ac265_broker_results where result_name = 'teardown-disabled-second'),
  '{"status":"conflict"}'::jsonb,
  'a handle is logged out exactly once with its own idempotency reference'
);

select ok(
  not exists (
    select 1
    from platform_private.ac265_session_broker_handle_roles
    where role <> 'disabled_prerequisite'
      and logged_out_at is not null
  ),
  'teardown of one handle never logs out another run-scoped session'
);

-- Resolve must fail closed once the broker window has closed.  The handle set
-- below is a disposable fixture with an already-closed window so the fence can
-- be exercised without weakening the immutability trigger on live handles.
select lives_ok(
  $$
  insert into platform_private.ac265_runner_authorizations (
    authorization_id, run_id, identity_sha256, source_revision, deployment_id,
    github_run_id, github_run_attempt, workflow_sha, jti_sha256,
    request_sha256, authorized_at, expires_at
  ) values (
    '20000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    decode('ac265b0' || repeat('b', 64 - 7), 'hex'),
    repeat('a', 40),
    'ac265brokerb1',
    '34796668544',
    1,
    repeat('a', 40),
    decode(repeat('9', 64), 'hex'),
    decode(repeat('9', 64), 'hex'),
    clock_timestamp() - interval '10 minutes',
    clock_timestamp() - interval '9 minutes'
  )
  $$,
  'the disposable closed-window runner authorization fixture loads'
);

select lives_ok(
  $$
  insert into platform_private.ac265_session_broker_handles (
    broker_authorization_id, authorization_id, run_id, identity_sha256,
    source_revision, deployment_id, environment, hosting_project_id,
    supabase_project_ref, idempotency_ref, request_sha256, authorized_at,
    expires_at
  ) values (
    '40000000-0000-4000-8000-000000000002'::uuid,
    '20000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    decode('ac265b0' || repeat('b', 64 - 7), 'hex'),
    repeat('a', 40),
    'ac265brokerb1',
    'staging',
    'wejammin-staging',
    'abcdefghijklmnopqrst',
    'ac265-idempotency://staging/41000000-0000-4000-8000-000000000007',
    decode(repeat('9', 64), 'hex'),
    clock_timestamp() - interval '10 minutes',
    clock_timestamp() - interval '9 minutes'
  )
  $$,
  'the disposable closed-window broker authorization fixture loads'
);

select lives_ok(
  $$
  insert into platform_private.ac265_session_broker_handle_roles (
    broker_authorization_id, role, handle_ref, handle_sha256, material_ref
  )
  select
    '40000000-0000-4000-8000-000000000002'::uuid,
    locked.role,
    'ac265-session://' || locked.role || '/' || locked.handle_id::text,
    extensions.digest(
      convert_to(
        'ac265-session://' || locked.role || '/' || locked.handle_id::text,
        'utf8'
      ),
      'sha256'
    ),
    'ac265-session-material://staging/' || locked.material_id::text
  from (
    values
      ('entitled_read', '31b00000-0000-4000-8000-000000000001'::uuid, '32b00000-0000-4000-8000-000000000001'::uuid),
      ('owner_full', '31b00000-0000-4000-8000-000000000002'::uuid, '32b00000-0000-4000-8000-000000000002'::uuid),
      ('guardian_mandate', '31b00000-0000-4000-8000-000000000003'::uuid, '32b00000-0000-4000-8000-000000000003'::uuid),
      ('junior_restricted', '31b00000-0000-4000-8000-000000000004'::uuid, '32b00000-0000-4000-8000-000000000004'::uuid),
      ('business_mandate', '31b00000-0000-4000-8000-000000000005'::uuid, '32b00000-0000-4000-8000-000000000005'::uuid),
      ('staff_case_scoped', '31b00000-0000-4000-8000-000000000006'::uuid, '32b00000-0000-4000-8000-000000000006'::uuid),
      ('admin_step_up', '31b00000-0000-4000-8000-000000000007'::uuid, '32b00000-0000-4000-8000-000000000007'::uuid),
      ('forbidden_hidden', '31b00000-0000-4000-8000-000000000008'::uuid, '32b00000-0000-4000-8000-000000000008'::uuid),
      ('disabled_prerequisite', '31b00000-0000-4000-8000-000000000009'::uuid, '32b00000-0000-4000-8000-000000000009'::uuid)
  ) as locked(role, handle_id, material_id)
  $$,
  'the disposable closed-window handle rows load'
);

insert into ac265_broker_requests (request_name, request)
select
  'resolve-closed-window',
  jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-session-broker-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
    'runId', '10000000-0000-4000-8000-000000000002',
    'identitySha256', 'ac265b0' || repeat('b', 64 - 7),
    'idempotencyRef', 'ac265-idempotency://staging/41000000-0000-4000-8000-000000000008',
    'role', 'owner_full',
    'handleRef', 'ac265-session://owner_full/31b00000-0000-4000-8000-000000000002',
    'handleSha256', encode(
      extensions.digest(
        convert_to(
          'ac265-session://owner_full/31b00000-0000-4000-8000-000000000002',
          'utf8'
        ),
        'sha256'
      ),
      'hex'
    )
  );

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'resolve-closed-window', platform_api.ac265_session_broker_resolve(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'resolve-closed-window'
  $$,
  'a resolve outside the broker window reaches the expiry fence'
);
reset role;

select is(
  (select result from ac265_broker_results where result_name = 'resolve-closed-window'),
  '{"status":"conflict"}'::jsonb,
  'a resolution requested after the broker window closed is refused'
);

select is(
  (
    select resolves
    from platform_private.ac265_session_broker_handle_roles
    where broker_authorization_id =
        '40000000-0000-4000-8000-000000000002'::uuid
      and role = 'owner_full'
  ),
  0,
  'the refused expired resolve stored no resolve progress'
);

-- An authorization whose window has closed can no longer bind new handles.
insert into ac265_broker_requests (request_name, request)
select
  'authorize-expired',
  jsonb_set(
    jsonb_set(
      request,
      '{idempotencyRef}',
      to_jsonb('ac265-idempotency://staging/41000000-0000-4000-8000-000000000006'::text)
    ),
    '{runId}',
    to_jsonb('10000000-0000-4000-8000-000000000001'::text)
  )
from ac265_broker_requests
where request_name = 'authorize';

select lives_ok(
  $$
  update platform_private.ac265_runner_authorizations
  set authorized_at = authorized_at - interval '10 minutes',
      expires_at = expires_at - interval '10 minutes'
  where authorization_id = '20000000-0000-4000-8000-000000000001'::uuid
  $$,
  'the disposable runner authorization fixture can be moved past its expiry'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_broker_results (result_name, result)
  select 'authorize-expired', platform_api.ac265_session_broker_authorize(request)
  from pg_temp.ac265_broker_requests
  where request_name = 'authorize-expired'
  $$,
  'an expired authorization reaches the live authorization fence'
);
reset role;

select is(
  (select result from ac265_broker_results where result_name = 'authorize-expired'),
  '{"status":"conflict"}'::jsonb,
  'a stale or expired runner authorization cannot bind session handles'
);

select ok(
  (
    select count(*) = 1
    from platform_private.ac265_session_broker_handles
    where run_id = '10000000-0000-4000-8000-000000000001'::uuid
  ),
  'the rejected late authorization did not mint a second handle set'
);

-- Bindings are immutable even for the table owner, and progress cannot regress.
select throws_ok(
  $$update platform_private.ac265_session_broker_handles
      set idempotency_ref = 'ac265-idempotency://staging/41000000-0000-4000-8000-000000000099'
    where run_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  '55000',
  'AC265 session broker records are immutable',
  'the session broker authorization header cannot be rewritten'
);

select throws_ok(
  $$update platform_private.ac265_session_broker_handle_roles
      set material_ref =
        'ac265-session-material://staging/32000000-0000-4000-8000-000000000099'
    where role = 'owner_full'$$,
  '55000',
  'AC265 session broker handle bindings are immutable',
  'a handle cannot be repointed at different session material'
);

select throws_ok(
  $$delete from platform_private.ac265_session_broker_handle_roles
    where role = 'owner_full'$$,
  '55000',
  'AC265 session broker records are immutable',
  'a handle binding cannot be deleted to bypass one-use resolution'
);

select throws_ok(
  $$update platform_private.ac265_session_broker_handle_roles
      set resolves = 0,
          last_resolved_at = null,
          last_resolve_idempotency_ref = null,
          last_resolve_request_sha256 = null
    where role = 'owner_full'$$,
  '55000',
  'AC265 session broker handle progress cannot regress',
  'the single permitted resolve cannot be rolled back to allow a second one'
);

select finish();
rollback;
