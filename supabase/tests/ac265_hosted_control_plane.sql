begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- CP-01 owns the protected approved-target and one-use lease boundary.  The
-- target is deliberately inserted below as a disposable test fixture; the
-- migration must not seed a live target or retain its raw bytes.
select ok(
  to_regclass('platform_private.ac265_approved_outage_targets') is not null
  and coalesce(
    (
      select relrowsecurity and relforcerowsecurity
      from pg_catalog.pg_class
      where oid = to_regclass('platform_private.ac265_approved_outage_targets')
    ),
    false
  ),
  'approved outage targets exist as an enabled, forced-RLS private table'
);

select ok(
  to_regclass('platform_private.ac265_hosted_outage_leases') is not null
  and coalesce(
    (
      select relrowsecurity and relforcerowsecurity
      from pg_catalog.pg_class
      where oid = to_regclass('platform_private.ac265_hosted_outage_leases')
    ),
    false
  ),
  'outage leases exist as an enabled, forced-RLS private table'
);

select ok(
  to_regprocedure('platform_api.ac265_hosted_outage_lease_acquire(jsonb)') is not null
  and to_regprocedure('platform_api.ac265_hosted_outage_lease_consume(jsonb)') is not null
  and to_regprocedure('platform_api.ac265_hosted_outage_lease_release(jsonb)') is not null,
  'acquire, consume, and release RPCs exist with the strict JSONB request shape'
);

select ok(
  coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_acquire(jsonb)'),
      'execute'
    ),
    false
  )
  and coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_consume(jsonb)'),
      'execute'
    ),
    false
  )
  and coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_release(jsonb)'),
      'execute'
    ),
    false
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_acquire(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_acquire(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_consume(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_consume(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_release(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_hosted_outage_lease_release(jsonb)'),
      'execute'
    ),
    true
  ),
  'only service_role can execute the outage lease lifecycle RPCs'
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
      to_regprocedure('platform_api.ac265_hosted_outage_lease_acquire(jsonb)'),
      to_regprocedure('platform_api.ac265_hosted_outage_lease_consume(jsonb)'),
      to_regprocedure('platform_api.ac265_hosted_outage_lease_release(jsonb)')
    )
  ),
  'all outage lease RPCs are SECURITY DEFINER with an exact empty search_path'
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
          ('platform_private.ac265_approved_outage_targets'::text),
          ('platform_private.ac265_hosted_outage_leases'::text)
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
  'approved target and lease tables have no direct grants to any API role'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relation
    where relation.relnamespace = 'platform_private'::regnamespace
      and relation.relkind = 'S'
      and relation.relname in (
        'ac265_approved_outage_targets_target_id_seq',
        'ac265_hosted_outage_leases_lease_id_seq'
      )
  ),
  'control-plane identifiers do not create exposed sequences'
);

select ok(
  to_regclass('platform_private.ac265_approved_outage_targets') is not null
  and not exists (
    select 1
    from pg_catalog.pg_attribute
    where attrelid = to_regclass('platform_private.ac265_approved_outage_targets')
      and attnum > 0
      and not attisdropped
      and (
        attname ~* '(raw|secret|credential|token|payload|body|bytes)'
        or attname in ('target', 'scope_json', 'target_json')
      )
  ),
  'approved-target storage keeps parsed scope and digests, never raw target or secret bytes'
);

select ok(
  to_regclass('platform_private.ac265_hosted_outage_leases') is not null
  and not exists (
    select 1
    from pg_catalog.pg_attribute
    where attrelid = to_regclass('platform_private.ac265_hosted_outage_leases')
      and attnum > 0
      and not attisdropped
      and (
        attname ~* '(raw|secret|credential|token|payload|body|bytes)'
        or attname in ('target', 'scope_json', 'target_json', 'request')
      )
  ),
  'lease storage keeps only opaque references, hashes, state, and parsed binding fields'
);

-- A missing migration is a RED failure, not a reason to manufacture a live
-- target.  This assertion intentionally runs before the disposable fixture.
select lives_ok(
  $$
  do $do$
  declare
    v_count bigint;
  begin
    if to_regclass('platform_private.ac265_approved_outage_targets') is null then
      raise exception 'missing relation platform_private.ac265_approved_outage_targets';
    end if;
    execute 'select count(*) from platform_private.ac265_approved_outage_targets'
      into v_count;
    if v_count <> 0 then
      raise exception 'approved outage target table was seeded with % live rows', v_count;
    end if;
  end
  $do$
  $$,
  'the migration does not seed a live approved outage target'
);

create temporary table ac265_control_plane_results (
  result_name text primary key,
  result jsonb
) on commit drop;

create temporary table ac265_control_plane_requests (
  request_name text primary key,
  request jsonb not null
) on commit drop;

-- The candidate and authorization rows are the same server-side identity
-- material consumed by ac265_prepare_hosted_run.  They are test fixtures only;
-- the RPC must derive every scope field from these records and the approved
-- target, never from caller-provided scope fields.
select lives_ok(
  $$
  insert into platform_private.ac265_verified_candidates (
    candidate_id,
    identity_sha256,
    source_revision,
    deployment_id,
    ci_run_id,
    ci_run_attempt,
    staging_run_id,
    staging_run_attempt,
    ci_artifact_id,
    staging_artifact_id,
    identity,
    provenance
  ) values (
    '10000000-0000-4000-8000-000000000010'::uuid,
    decode(repeat('b', 64), 'hex'),
    repeat('a', 40),
    '6428523608',
    '34751474024',
    2,
    '34751910125',
    1,
    8801,
    9901,
    jsonb_build_object(
      'environment', 'staging',
      'ciRunId', '34751474024',
      'ciRunAttempt', 2,
      'stagingRunId', '34751910125',
      'stagingRunAttempt', 1,
      'sourceRevision', repeat('a', 40),
      'deploymentId', '6428523608',
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
    authorization_id,
    run_id,
    identity_sha256,
    source_revision,
    deployment_id,
    github_run_id,
    github_run_attempt,
    workflow_sha,
    jti_sha256,
    request_sha256,
    authorized_at,
    expires_at
  ) values (
    '20000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    decode(repeat('b', 64), 'hex'),
    repeat('a', 40),
    '6428523608',
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

select lives_ok(
  $$
  insert into platform_private.ac265_approved_outage_targets (
    target_id,
    target_ref,
    target_sha256,
    candidate_id,
    run_id,
    identity_sha256,
    environment,
    source_revision,
    hosting_project_id,
    supabase_project_ref,
    deployment_id,
    dependency_id,
    route_operation_id,
    route_method,
    route_path,
    approved_at,
    expires_at
  ) values (
    '30000000-0000-4000-8000-000000000001'::uuid,
    'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001',
    decode(repeat('e', 64), 'hex'),
    '10000000-0000-4000-8000-000000000010'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    decode(repeat('b', 64), 'hex'),
    'staging',
    repeat('a', 40),
    'wejammin-staging',
    'abcdefghijklmnopqrst',
    '6428523608',
    'supabase-auth',
    'CMS-03A-06',
    'GET',
    '/api/v1/cms/content-types',
    clock_timestamp() - interval '1 minute',
    clock_timestamp() + interval '1 hour'
  )
  $$,
  'the disposable approved staging target fixture loads'
);

select throws_ok(
  $$
  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id, identity_sha256,
    environment, source_revision, hosting_project_id, supabase_project_ref,
    deployment_id, dependency_id, route_operation_id, route_method, route_path,
    approved_at, expires_at
  ) values (
    '30000000-0000-4000-8000-000000000099'::uuid,
    'ac265-outage-target://staging/30000000-0000-4000-8000-000000000099',
    decode(repeat('f', 64), 'hex'),
    '10000000-0000-4000-8000-000000000099'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
    'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608', 'supabase-auth',
    'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
    clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
  )
  $$,
  '23503',
  'AC265 approved outage target candidate does not exist',
  'an approved target cannot reference a nonexistent candidate'
);

-- Approved target bindings are immutable even for the table owner.  The only
-- supported lifecycle operation is publishing a new approved target row.
select throws_ok(
  $$update platform_private.ac265_approved_outage_targets
    set route_path = '/api/v1/cms/should-not-change'
    where target_id = '30000000-0000-4000-8000-000000000001'::uuid$$,
  '55000',
  'AC265 approved outage targets are immutable',
  'the approved target owner cannot update an issued target binding'
);
select throws_ok(
  $$delete from platform_private.ac265_approved_outage_targets
    where target_id = '30000000-0000-4000-8000-000000000001'::uuid$$,
  '55000',
  'AC265 approved outage targets are immutable',
  'the approved target owner cannot delete an issued target binding'
);

-- Project identifiers are part of the immutable candidate binding.  A target
-- that changes either project half must fail closed with the same conflict
-- sentinel as an unapproved target.
select lives_ok(
  $$
  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id, identity_sha256,
    environment, source_revision, hosting_project_id, supabase_project_ref,
    deployment_id, dependency_id, route_operation_id, route_method, route_path,
    approved_at, expires_at
  ) values (
    '30000000-0000-4000-8000-000000000011'::uuid,
    'ac265-outage-target://staging/30000000-0000-4000-8000-000000000011',
    decode(repeat('1', 64), 'hex'),
    '10000000-0000-4000-8000-000000000010'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
    'different-hosting-project', 'abcdefghijklmnopqrst', '6428523608',
    'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
    clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
  )
  $$,
  'the disposable hosting-project mismatch target fixture loads'
);
select lives_ok(
  $$
  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id, identity_sha256,
    environment, source_revision, hosting_project_id, supabase_project_ref,
    deployment_id, dependency_id, route_operation_id, route_method, route_path,
    approved_at, expires_at
  ) values (
    '30000000-0000-4000-8000-000000000012'::uuid,
    'ac265-outage-target://staging/30000000-0000-4000-8000-000000000012',
    decode(repeat('2', 64), 'hex'),
    '10000000-0000-4000-8000-000000000010'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
    'wejammin-staging', 'different-supabase-project', '6428523608',
    'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
    clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
  )
  $$,
  'the disposable Supabase-project mismatch target fixture loads'
);

with valid as (
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001',
    'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001',
    'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004',
    'leaseDurationSeconds', 60,
    'requestLimit', 1
  ) as request
)
insert into ac265_control_plane_requests (request_name, request)
select 'valid', request from valid;

insert into ac265_control_plane_requests (request_name, request)
select fixture.fixture_name, fixture.fixture_request
from ac265_control_plane_requests as base
cross join lateral (
  values
    (
      'project-mismatch-hosting',
      jsonb_set(base.request, '{targetRef}', to_jsonb('ac265-outage-target://staging/30000000-0000-4000-8000-000000000011'::text))
    ),
    (
      'project-mismatch-supabase',
      jsonb_set(base.request, '{targetRef}', to_jsonb('ac265-outage-target://staging/30000000-0000-4000-8000-000000000012'::text))
    ),
    (
      'acquire-different-active',
      jsonb_set(base.request, '{idempotencyRef}', to_jsonb('ac265-idempotency://staging/40000000-0000-4000-8000-000000000014'::text))
    )
) as fixture(fixture_name, fixture_request)
where base.request_name = 'valid';

insert into ac265_control_plane_requests (request_name, request)
select fixture.fixture_name, fixture.fixture_request
from ac265_control_plane_requests as base
cross join lateral (
  values
    (
      'extra-key',
      base.request || jsonb_build_object('expiresAt', '2099-01-01T00:00:00.000Z')
    ),
    (
      'caller-scope',
      base.request || jsonb_build_object(
        'dependencyId', 'other-dependency',
        'route', jsonb_build_object('operationId', 'OTHER', 'method', 'GET', 'path', '/')
      )
    ),
    (
      'bad-authorization-ref',
      jsonb_set(base.request, '{authorizationRef}', to_jsonb('ac265-authorization://staging/not-a-uuid'::text))
    ),
    (
      'bad-target-environment',
      jsonb_set(base.request, '{targetRef}', to_jsonb('ac265-outage-target://production/30000000-0000-4000-8000-000000000001'::text))
    ),
    (
      'wrong-authorization',
      jsonb_set(base.request, '{authorizationRef}', to_jsonb('ac265-authorization://staging/20000000-0000-4000-8000-000000000099'::text))
    ),
    (
      'unapproved-target',
      jsonb_set(base.request, '{targetRef}', to_jsonb('ac265-outage-target://staging/30000000-0000-4000-8000-000000000099'::text))
    ),
    (
      'bad-target-ref',
      jsonb_set(base.request, '{targetRef}', to_jsonb('not-a-target-reference'::text))
    ),
    (
      'missing-target',
      jsonb_set(base.request, '{targetRef}', to_jsonb('ac265-outage-target://staging/30000000-0000-4000-8000-000000000099'::text))
    ),
    (
      'caller-lease-seconds',
      base.request || jsonb_build_object('leaseSeconds', 60)
    )
) as fixture(fixture_name, fixture_request)
where base.request_name = 'valid';

set local role anon;
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot acquire an outage lease'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_consume('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot consume an outage lease'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_release('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot release an outage lease'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire('{}'::jsonb)$$,
  '42501',
  null,
  'authenticated callers cannot acquire an outage lease'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_consume('{}'::jsonb)$$,
  '42501',
  null,
  'authenticated callers cannot consume an outage lease'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_release('{}'::jsonb)$$,
  '42501',
  null,
  'authenticated callers cannot release an outage lease'
);
reset role;

-- All lifecycle work is performed through the API RPCs.  These direct table
-- mutations are expected to fail even for service_role.
set local role service_role;
select throws_ok(
  $$select count(*) from platform_private.ac265_approved_outage_targets$$,
  '42501',
  null,
  'service_role cannot read approved target rows directly'
);
select throws_ok(
  $$select count(*) from platform_private.ac265_hosted_outage_leases$$,
  '42501',
  null,
  'service_role cannot read lease rows directly'
);
select throws_ok(
  $$insert into platform_private.ac265_approved_outage_targets default values$$,
  '42501',
  null,
  'service_role cannot insert approved target rows directly'
);
select throws_ok(
  $$insert into platform_private.ac265_hosted_outage_leases default values$$,
  '42501',
  null,
  'service_role cannot insert lease rows directly'
);
reset role;

select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire((select request from pg_temp.ac265_control_plane_requests where request_name = 'extra-key'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'acquire rejects caller-supplied expiry or other extra keys'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire((select request from pg_temp.ac265_control_plane_requests where request_name = 'caller-scope'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'acquire rejects caller-supplied target scope fields'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire((select request from pg_temp.ac265_control_plane_requests where request_name = 'bad-authorization-ref'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'acquire rejects malformed authorization references'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire((select request from pg_temp.ac265_control_plane_requests where request_name = 'bad-target-environment'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'acquire rejects production outage-target references'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire((select request from pg_temp.ac265_control_plane_requests where request_name = 'bad-target-ref'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'acquire rejects malformed target references'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_acquire((select request from pg_temp.ac265_control_plane_requests where request_name = 'caller-lease-seconds'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'acquire does not accept a caller-controlled lease duration'
);

grant select on ac265_control_plane_requests to service_role;
grant insert on ac265_control_plane_results to service_role;

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'acquire-first', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'valid'
  $$,
  'service_role can acquire a valid staging-scoped one-use lease through the RPC'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'acquire-repeat', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'valid'
  $$,
  'repeating the same acquire request is idempotent'
);
reset role;

select is(
  (select result from ac265_control_plane_results where result_name = 'acquire-repeat'),
  (select result from ac265_control_plane_results where result_name = 'acquire-first'),
  'identical acquire retries return the same immutable lease response'
);

select throws_ok(
  $$update platform_private.ac265_hosted_outage_leases
    set lease_sha256 = decode(repeat('f', 64), 'hex')
    where lease_ref = (
      select result ->> 'leaseRef'
      from ac265_control_plane_results
      where result_name = 'acquire-first'
    )$$,
  '23514',
  null,
  'the stored lease digest CHECK rejects a digest that does not match lease_ref'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'acquire-different-active', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'acquire-different-active'
  $$,
  'a different acquire idempotency key reaches the active-binding fence'
);
reset role;

select is(
  (select result from ac265_control_plane_results where result_name = 'acquire-different-active'),
  '{"status":"conflict"}'::jsonb,
  'a second acquire with different idempotency conflicts while the first lease is active'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'project-mismatch-hosting', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'project-mismatch-hosting'
  $$,
  'hosting-project mismatch reaches the conflict-safe acquire boundary'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'project-mismatch-supabase', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'project-mismatch-supabase'
  $$,
  'Supabase-project mismatch reaches the conflict-safe acquire boundary'
);
reset role;

select is(
  (select result from ac265_control_plane_results where result_name = 'project-mismatch-hosting'),
  '{"status":"conflict"}'::jsonb,
  'a hosting-project mismatch returns only the conflict sentinel'
);
select is(
  (select result from ac265_control_plane_results where result_name = 'project-mismatch-supabase'),
  '{"status":"conflict"}'::jsonb,
  'a Supabase-project mismatch returns only the conflict sentinel'
);

select ok(
  (
    select result ?& array[
      'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
      'idempotencyRef', 'leaseRef', 'leaseSha256', 'environment', 'state',
      'leaseDurationSeconds', 'requestLimit', 'acquiredAt', 'expiresAt',
      'redacted'
    ]
      and (result - array[
        'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
        'idempotencyRef', 'leaseRef', 'leaseSha256', 'environment', 'state',
        'leaseDurationSeconds', 'requestLimit', 'acquiredAt', 'expiresAt',
        'redacted'
      ]) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-outage-lease-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001'
      and result ->> 'targetRef' = 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001'
      and result ->> 'idempotencyRef' = 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004'
      and result ->> 'leaseRef' ~ '^ac265-lease://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and result ->> 'leaseSha256' = encode(
        extensions.digest(convert_to(result ->> 'leaseRef', 'utf8'), 'sha256'),
        'hex'
      )
      and result ->> 'environment' = 'staging'
      and result ->> 'leaseDurationSeconds' = '60'
      and (result ->> 'requestLimit')::integer = 1
      and result ->> 'state' = 'acquired'
      and (result ->> 'expiresAt')::timestamptz = (result ->> 'acquiredAt')::timestamptz + interval '60 seconds'
      and result ->> 'redacted' = 'true'
      and not (result ?| array[
        'targetBytes', 'target', 'secret', 'token', 'authorizationToken',
        'oidcToken', 'rawTarget', 'rawRequest', 'requestPayload'
      ])
    from ac265_control_plane_results
    where result_name = 'acquire-first'
  ),
  'the acquire result is an exact redacted, server-derived lease contract'
);

-- Missing/unapproved target and all cross-run/candidate bindings use one
-- indistinguishable conflict sentinel; they must not disclose target existence.
set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'missing-target', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'missing-target'
  $$,
  'missing target request reaches the conflict-safe acquire boundary'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'wrong-authorization', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'wrong-authorization'
  $$,
  'wrong authorization request reaches the conflict-safe acquire boundary'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'unapproved-target', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'unapproved-target'
  $$,
  'unapproved target request reaches the conflict-safe acquire boundary'
);
reset role;

select is(
  (select result from ac265_control_plane_results where result_name = 'missing-target'),
  '{"status":"conflict"}'::jsonb,
  'missing or unapproved targets return only the conflict sentinel'
);
select is(
  (select result from ac265_control_plane_results where result_name = 'wrong-authorization'),
  '{"status":"conflict"}'::jsonb,
  'wrong authorization returns only the conflict sentinel'
);
select is(
  (select result from ac265_control_plane_results where result_name = 'unapproved-target'),
  '{"status":"conflict"}'::jsonb,
  'unapproved target scope returns only the conflict sentinel'
);

-- Consume requests use only the opaque lease reference and exact digest.  The
-- server derives the consumed timestamp and never accepts a caller timestamp.
insert into ac265_control_plane_requests (request_name, request)
select 'consume-valid', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001',
  'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'acquire-first';

insert into ac265_control_plane_requests (request_name, request)
select 'consume-wrong-digest', jsonb_set(request, '{leaseSha256}', to_jsonb(repeat('f', 64)))
from ac265_control_plane_requests
where request_name = 'consume-valid'
union all
select 'consume-extra-key', request || jsonb_build_object('consumedAt', '2099-01-01T00:00:00.000Z')
from ac265_control_plane_requests
where request_name = 'consume-valid';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'consume-first', platform_api.ac265_hosted_outage_lease_consume(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'consume-valid'
  $$,
  'service_role can consume the acquired lease once'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'consume-repeat', platform_api.ac265_hosted_outage_lease_consume(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'consume-valid'
  $$,
  'repeating the same consume request is idempotent'
);
reset role;

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'acquire-different-consumed', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'acquire-different-active'
  $$,
  'a different acquire idempotency key reaches the consumed-before-release fence'
);
reset role;

select is(
  (select result from ac265_control_plane_results where result_name = 'acquire-different-consumed'),
  '{"status":"conflict"}'::jsonb,
  'a second acquire with different idempotency conflicts before cleanup release'
);

select is(
  (select result from ac265_control_plane_results where result_name = 'consume-repeat'),
  (select result from ac265_control_plane_results where result_name = 'consume-first'),
  'same lease consume retry returns the same immutable outcome'
);
select ok(
  (
    select result ->> 'state' = 'consumed'
      and result ->> 'redacted' = 'true'
      and result ->> 'environment' = 'staging'
      and (result ->> 'requestLimit')::integer = 1
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-outage-lease-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001'
      and result ->> 'targetRef' = 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001'
      and result ->> 'idempotencyRef' = 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005'
      and result ->> 'leaseRef' = (select request ->> 'leaseRef' from ac265_control_plane_requests where request_name = 'consume-valid')
      and result ->> 'leaseSha256' = (select request ->> 'leaseSha256' from ac265_control_plane_requests where request_name = 'consume-valid')
      and result ? 'consumedAt'
      and not (result ?| array['targetBytes', 'target', 'secret', 'token', 'rawRequest'])
    from ac265_control_plane_results
    where result_name = 'consume-first'
  ),
  'consume returns one redacted server-timestamped event and no sensitive bytes'
);

select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_consume((select request from pg_temp.ac265_control_plane_requests where request_name = 'consume-extra-key'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'consume rejects caller-supplied timestamps'
);
select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_consume((select request from pg_temp.ac265_control_plane_requests where request_name = 'consume-wrong-digest'))$$,
  '22023',
  'AC265 outage lease request rejected',
  'consume rejects a digest that does not match the exact lease reference'
);

-- Release succeeds only after the first lease has been consumed.
insert into ac265_control_plane_requests (request_name, request)
select 'release-valid', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001',
  'idempotencyRef', 'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'acquire-first';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'release-first', platform_api.ac265_hosted_outage_lease_release(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'release-valid'
  $$,
  'service_role can release the consumed lease'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'release-repeat', platform_api.ac265_hosted_outage_lease_release(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'release-valid'
  $$,
  'repeating the same release request is idempotent'
);
reset role;

select is(
  (select result from ac265_control_plane_results where result_name = 'release-repeat'),
  (select result from ac265_control_plane_results where result_name = 'release-first'),
  'same release retry returns the same immutable outcome'
);
select ok(
  (
    select result ?& array[
      'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
      'idempotencyRef', 'leaseRef', 'leaseSha256', 'environment', 'state',
      'releasedAt', 'redacted'
    ]
      and (result - array[
        'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
        'idempotencyRef', 'leaseRef', 'leaseSha256', 'environment', 'state',
        'releasedAt', 'redacted'
      ]) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-outage-lease-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/20000000-0000-4000-8000-000000000001'
      and result ->> 'targetRef' = 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000001'
      and result ->> 'idempotencyRef' = 'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006'
      and result ->> 'leaseRef' = (select request ->> 'leaseRef' from ac265_control_plane_requests where request_name = 'release-valid')
      and result ->> 'leaseSha256' = (select request ->> 'leaseSha256' from ac265_control_plane_requests where request_name = 'release-valid')
      and result ->> 'environment' = 'staging'
      and result ->> 'state' = 'released'
      and result ->> 'redacted' = 'true'
      and result ? 'releasedAt'
      and not (result ?| array['targetBytes', 'target', 'secret', 'token', 'rawRequest'])
    from ac265_control_plane_results
    where result_name = 'release-first'
  ),
  'release returns the exact redacted server-timestamped contract'
);

select throws_ok(
  $$select platform_api.ac265_hosted_outage_lease_release(jsonb_set((select request from pg_temp.ac265_control_plane_requests where request_name = 'release-valid'), '{leaseSha256}', to_jsonb(repeat('f', 64))))$$,
  '22023',
  'AC265 outage lease request rejected',
  'release rejects a digest that does not match the exact lease reference'
);
select is(
  (select result from ac265_control_plane_results where result_name = 'consume-repeat'),
  (select result from ac265_control_plane_results where result_name = 'consume-first'),
  'a replayed consume cannot create a second event or change the first outcome'
);

-- A second synthetic staging fixture proves release-before-consume is rejected
-- and provides an unconsumed lease for the server-time expiry fence.
select lives_ok(
  $$
  insert into platform_private.ac265_runner_authorizations (
    authorization_id, run_id, identity_sha256, source_revision, deployment_id,
    github_run_id, github_run_attempt, workflow_sha, jti_sha256, request_sha256,
    authorized_at, expires_at
  ) values (
    '20000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
    '34796668544', 1, repeat('a', 40), decode(repeat('9', 64), 'hex'),
    decode(repeat('1', 64), 'hex'), clock_timestamp() - interval '10 seconds',
    clock_timestamp() + interval '4 minutes'
  )
  $$,
  'the second disposable authorized runner fixture loads'
);
select lives_ok(
  $$
  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id, identity_sha256,
    environment, source_revision, hosting_project_id, supabase_project_ref,
    deployment_id, dependency_id, route_operation_id, route_method, route_path,
    approved_at, expires_at
  ) values (
    '30000000-0000-4000-8000-000000000002'::uuid,
    'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
    decode(repeat('1', 64), 'hex'),
    '10000000-0000-4000-8000-000000000010'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
    'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608', 'supabase-auth',
    'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
    clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
  )
  $$,
  'the second disposable approved staging target fixture loads'
);

select lives_ok(
  $$
  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id, identity_sha256,
    environment, source_revision, hosting_project_id, supabase_project_ref,
    deployment_id, dependency_id, route_operation_id, route_method, route_path,
    approved_at, expires_at
  ) values (
    '30000000-0000-4000-8000-000000000003'::uuid,
    'ac265-outage-target://staging/30000000-0000-4000-8000-000000000003',
    decode(repeat('3', 64), 'hex'),
    '10000000-0000-4000-8000-000000000010'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
    'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608', 'supabase-auth',
    'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
    clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
  )
  $$,
  'the third disposable approved staging target fixture loads'
);

insert into ac265_control_plane_requests (request_name, request)
select 'second-acquire', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000007',
  'leaseDurationSeconds', 60,
  'requestLimit', 1
);

insert into ac265_control_plane_requests (request_name, request)
select 'third-acquire', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000003',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000010',
  'leaseDurationSeconds', 60,
  'requestLimit', 1
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'second-acquire', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'second-acquire'
  $$,
  'the second lease acquires for release-before-consume and expiry coverage'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'third-acquire', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'third-acquire'
  $$,
  'the third lease acquires for consumed-expired release coverage'
);
reset role;

insert into ac265_control_plane_requests (request_name, request)
select 'release-before-consume', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
  'idempotencyRef', 'ac265-idempotency://staging/60000000-0000-4000-8000-000000000008',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'second-acquire';

insert into ac265_control_plane_requests (request_name, request)
select 'third-consume', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000003',
  'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000011',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'third-acquire';

insert into ac265_control_plane_requests (request_name, request)
select 'third-release', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000003',
  'idempotencyRef', 'ac265-idempotency://staging/60000000-0000-4000-8000-000000000012',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'third-acquire';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'release-before-consume', platform_api.ac265_hosted_outage_lease_release(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'release-before-consume'
  $$,
  'release-before-consume reaches the lifecycle fence'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'third-consume', platform_api.ac265_hosted_outage_lease_consume(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'third-consume'
  $$,
  'the third lease can be consumed before expiry'
);
reset role;

select is(
  (select result ->> 'state' from ac265_control_plane_results where result_name = 'release-before-consume'),
  'released',
  'an unconsumed lease can still be released so bounded teardown clears the active-lease slot'
);
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'release-before-consume-repeat', platform_api.ac265_hosted_outage_lease_release(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'release-before-consume'
  $$,
  'repeating the same unconsumed teardown release is idempotent'
);
select is(
  (select result from ac265_control_plane_results where result_name = 'release-before-consume-repeat'),
  (select result from ac265_control_plane_results where result_name = 'release-before-consume'),
  'an unconsumed teardown release replay returns the same immutable outcome'
);
select ok(
  (
    select result ? 'releasedAt'
      and result ?& array[
        'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
        'idempotencyRef', 'leaseRef', 'leaseSha256', 'environment', 'state',
        'releasedAt', 'redacted'
      ]
      and (result - array[
        'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
        'idempotencyRef', 'leaseRef', 'leaseSha256', 'environment', 'state',
        'releasedAt', 'redacted'
      ]) = '{}'::jsonb
      and result ->> 'state' = 'released'
      and result ->> 'redacted' = 'true'
      and not (result ?| array['consumedAt', 'targetBytes', 'secret', 'token'])
    from ac265_control_plane_results
    where result_name = 'release-before-consume'
  ),
  'the unconsumed teardown release returns the exact redacted contract with no consume claim'
);
select ok(
  not exists (
    select 1
    from platform_private.ac265_hosted_outage_leases
    where lease_ref = (select result ->> 'leaseRef' from ac265_control_plane_results where result_name = 'second-acquire')
      and released_at is null
  ),
  'releasing an unconsumed lease clears the row from the active-lease set'
);

-- The released lease is spent: it must never be consumable afterwards, or a
-- released capability could still inject one request.
insert into ac265_control_plane_requests (request_name, request)
select 'consume-after-release', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
  'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000017',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'second-acquire';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'consume-after-release', platform_api.ac265_hosted_outage_lease_consume(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'consume-after-release'
  $$,
  'consuming a previously released lease reaches the lifecycle fence'
);
reset role;
select is(
  (select result from ac265_control_plane_results where result_name = 'consume-after-release'),
  '{"status":"conflict"}'::jsonb,
  'a released lease cannot be consumed afterwards'
);

-- Teardown must leave the binding usable: the same authorization/target pair
-- can acquire a fresh one-use lease after the abandoned one was released.
insert into ac265_control_plane_requests (request_name, request)
select 'teardown-reacquire', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000018',
  'leaseDurationSeconds', 60,
  'requestLimit', 1
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'teardown-reacquire', platform_api.ac265_hosted_outage_lease_acquire(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'teardown-reacquire'
  $$,
  'the binding accepts a fresh acquire after an unconsumed teardown release'
);
reset role;
select is(
  (select result ->> 'state' from ac265_control_plane_results where result_name = 'teardown-reacquire'),
  'acquired',
  'teardown leaves the authorization and target binding usable for a later attempt'
);

-- Expiry is server-time based.  These fixture updates are test-only superuser
-- mutations; callers cannot update this table because the direct-grant test
-- above is part of this contract.  The expiry assertions use the fresh
-- teardown re-acquire, because the earlier fixture lease has been released by
-- the teardown coverage and a released lease is spent.
select lives_ok(
  $$
  with lease_clock as (select clock_timestamp() as now)
  update platform_private.ac265_hosted_outage_leases as lease
  set acquired_at = lease_clock.now - interval '61 seconds',
      expires_at = lease_clock.now - interval '1 second'
  from lease_clock
  where lease_ref = (select result ->> 'leaseRef' from ac265_control_plane_results where result_name = 'teardown-reacquire')
  $$,
  'the disposable lease fixture can be moved past its server expiry for the expiry assertion'
);

insert into ac265_control_plane_requests (request_name, request)
select 'consume-expired', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
  'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000009',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'teardown-reacquire';

-- An unexpired-but-window-expired lease must also refuse release, so an
-- operator cannot silently clear the active slot after the bounded window.
insert into ac265_control_plane_requests (request_name, request)
select 'release-expired-unconsumed', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000002',
  'idempotencyRef', 'ac265-idempotency://staging/60000000-0000-4000-8000-000000000019',
  'leaseRef', result ->> 'leaseRef',
  'leaseSha256', result ->> 'leaseSha256'
)
from ac265_control_plane_results
where result_name = 'teardown-reacquire';
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'consume-expired', platform_api.ac265_hosted_outage_lease_consume(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'consume-expired'
  $$,
  'expired lease consume reaches the expiry fence'
);
select is(
  (select result from ac265_control_plane_results where result_name = 'consume-expired'),
  '{"status":"conflict"}'::jsonb,
  'an expired one-use lease cannot be consumed'
);

set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'release-expired-unconsumed', platform_api.ac265_hosted_outage_lease_release(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'release-expired-unconsumed'
  $$,
  'expired unconsumed release reaches the expiry fence'
);
reset role;
select is(
  (select result from ac265_control_plane_results where result_name = 'release-expired-unconsumed'),
  '{"status":"conflict"}'::jsonb,
  'an unconsumed lease cannot be released after its bounded window has expired'
);

-- A consumed lease that has passed its hard expiry remains consumed but cannot
-- be released.  Move the disposable row's test timestamps together to retain
-- the exact 60-second lifecycle CHECK while making the expiry deterministic.
select lives_ok(
  $$
  with lease_clock as (select clock_timestamp() as now)
  update platform_private.ac265_hosted_outage_leases as lease
  set acquired_at = lease_clock.now - interval '61 seconds',
      consumed_at = lease_clock.now - interval '31 seconds',
      expires_at = lease_clock.now - interval '1 second'
  from lease_clock
  where lease_ref = (select result ->> 'leaseRef' from ac265_control_plane_results where result_name = 'third-acquire')
  $$,
  'the disposable consumed lease fixture can be moved past its server expiry'
);
set local role service_role;
select lives_ok(
  $$
  insert into ac265_control_plane_results (result_name, result)
  select 'third-release', platform_api.ac265_hosted_outage_lease_release(request)
  from pg_temp.ac265_control_plane_requests
  where request_name = 'third-release'
  $$,
  'consumed-expired release reaches the expiry fence'
);
reset role;
select is(
  (select result from ac265_control_plane_results where result_name = 'third-release'),
  '{"status":"conflict"}'::jsonb,
  'a consumed lease cannot be released after its expiry'
);
select ok(
  not exists (
    select 1
    from platform_private.ac265_hosted_outage_leases
    where lease_ref = (select result ->> 'leaseRef' from ac265_control_plane_results where result_name = 'third-acquire')
      and (released_at is not null or released_idempotency_ref is not null or release_request_sha256 is not null)
  ),
  'an expired release conflict leaves all release state fields unchanged'
);


select finish();
rollback;
