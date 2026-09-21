begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure('platform_api.ac265_approved_outage_target_read(jsonb)') is not null,
  'CP04a approved outage-target read RPC exists with a strict JSONB request shape'
);

select ok(
  coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_approved_outage_target_read(jsonb)'),
      'execute'
    ),
    false
  )
  and not coalesce(
    has_function_privilege(
      'public',
      to_regprocedure('platform_api.ac265_approved_outage_target_read(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_approved_outage_target_read(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_approved_outage_target_read(jsonb)'),
      'execute'
    ),
    true
  ),
  'only service_role can execute the CP04a approved-target read RPC'
);

select ok(
  coalesce(
    (
      select count(*) = 1
        and bool_and(
          p.prosecdef
          and p.proconfig = array['search_path=""']::text[]
        )
      from pg_catalog.pg_proc as p
      where p.oid = to_regprocedure(
        'platform_api.ac265_approved_outage_target_read(jsonb)'
      )
    ),
    false
  ),
  'the CP04a read RPC is SECURITY DEFINER with an exact empty search_path'
);

select ok(
  coalesce(
    (
      select relrowsecurity and relforcerowsecurity
      from pg_catalog.pg_class
      where oid = to_regclass('platform_private.ac265_approved_outage_targets')
    ),
    false
  ),
  'CP04a preserves the CP01 approved-target forced-RLS boundary'
);

select ok(
  coalesce(
    (
      select bool_and(
        not coalesce(
          has_table_privilege(role_name, table_name, privilege_name),
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
        values ('platform_private.ac265_approved_outage_targets'::text)
      ) as tables(table_name)
      cross join (
        values
          ('SELECT'::text),
          ('INSERT'::text),
          ('UPDATE'::text),
          ('DELETE'::text),
          ('TRUNCATE'::text),
          ('REFERENCES'::text),
          ('TRIGGER'::text)
      ) as privileges(privilege_name)
    ),
    false
  ),
  'CP04a adds no direct approved-target table grants'
);

select lives_ok(
  $do$
  do $block$
  declare
    v_count bigint;
  begin
    execute 'select count(*) from platform_private.ac265_approved_outage_targets'
      into v_count;
    if v_count <> 0 then
      raise exception 'CP04a test requires an unseeded approved-target table; found % rows', v_count;
    end if;
  end
  $block$
  $do$,
  'CP04a migration does not seed a live approved outage target'
);

set local role anon;
select throws_ok(
  $$select platform_api.ac265_approved_outage_target_read('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot read an approved outage target'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select platform_api.ac265_approved_outage_target_read('{}'::jsonb)$$,
  '42501',
  null,
  'authenticated callers cannot read an approved outage target'
);
reset role;

-- These fixtures are disposable and rollback with this pgTAP file.  They model
-- the immutable CP01 authorization -> candidate -> target identity chain.
select lives_ok(
  $do$
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
    '71000000-0000-4000-8000-000000000001'::uuid,
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
      'hostingProjectId', 'wejammin-staging',
      'supabaseProjectRef', 'abcdefghijklmnopqrst'
    ),
    '{}'::jsonb
  )
  $do$,
  'the disposable verified candidate fixture loads'
);

select lives_ok(
  $do$
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
    '72000000-0000-4000-8000-000000000001'::uuid,
    '73000000-0000-4000-8000-000000000001'::uuid,
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
  $do$,
  'the disposable authorized-run fixture loads'
);

select lives_ok(
  $do$
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
    '74000000-0000-4000-8000-000000000001'::uuid,
    'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001',
    decode(repeat('a', 64), 'hex'),
    '71000000-0000-4000-8000-000000000001'::uuid,
    '73000000-0000-4000-8000-000000000001'::uuid,
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
  $do$,
  'the disposable approved target fixture loads'
);

create temporary table ac265_cp04a_results (
  result_name text primary key,
  result jsonb not null
) on commit drop;
grant insert on ac265_cp04a_results to service_role;

set local role service_role;
select throws_ok(
  $$select count(*) from platform_private.ac265_approved_outage_targets$$,
  '42501',
  null,
  'service_role cannot read approved target rows directly'
);
select lives_ok(
  $do$
  insert into ac265_cp04a_results (result_name, result)
  values (
    'valid',
    platform_api.ac265_approved_outage_target_read(
      jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
        'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
        'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001'
      )
    )
  )
  $do$,
  'service_role can read an approved target through the protected RPC'
);
reset role;

select ok(
  (
    select result ?& array[
      'criterion', 'schemaVersion', 'authorizationRef', 'environment',
      'hostingProjectId', 'supabaseProjectRef', 'redacted', 'targetSha256',
      'target'
    ]
      and (result - array[
        'criterion', 'schemaVersion', 'authorizationRef', 'environment',
        'hostingProjectId', 'supabaseProjectRef', 'redacted', 'targetSha256',
        'target'
      ]) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-approved-outage-target-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001'
      and result ->> 'environment' = 'staging'
      and result ->> 'hostingProjectId' = 'wejammin-staging'
      and result ->> 'supabaseProjectRef' = 'abcdefghijklmnopqrst'
      and result ->> 'redacted' = 'true'
      and result ->> 'targetSha256' = repeat('a', 64)
      and (result -> 'target') ?& array[
        'schemaVersion', 'source', 'targetId', 'targetRef', 'approvedAt',
        'expiresAt', 'scope'
      ]
      and ((result -> 'target') - array[
        'schemaVersion', 'source', 'targetId', 'targetRef', 'approvedAt',
        'expiresAt', 'scope'
      ]) = '{}'::jsonb
      and result -> 'target' ->> 'targetId' = '74000000-0000-4000-8000-000000000001'
      and result -> 'target' ->> 'targetRef' = 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001'
      and result -> 'target' -> 'scope' ->> 'runId' = '73000000-0000-4000-8000-000000000001'
      and result -> 'target' -> 'scope' ->> 'hostingProjectId' = 'wejammin-staging'
      and result -> 'target' -> 'scope' ->> 'supabaseProjectRef' = 'abcdefghijklmnopqrst'
      and result -> 'target' -> 'scope' ->> 'deploymentId' = '6428523608'
      and result -> 'target' -> 'scope' ->> 'dependencyId' = 'supabase-auth'
      and result -> 'target' -> 'scope' -> 'route' ->> 'operationId' = 'CMS-03A-06'
      and result -> 'target' -> 'scope' -> 'route' ->> 'method' = 'GET'
      and result -> 'target' -> 'scope' -> 'route' ->> 'path' = '/api/v1/cms/content-types'
      and not (result ?| array[
        'rawTarget', 'targetBytes', 'secret', 'token', 'credential',
        'identity', 'candidateId', 'sourceRevision', 'deploymentId'
      ])
      and not ((result -> 'target') ?| array[
        'rawTarget', 'targetBytes', 'secret', 'token', 'credential',
        'identity', 'candidateId', 'identitySha256', 'sourceRevision',
        'deploymentId'
      ])
    from ac265_cp04a_results
    where result_name = 'valid'
  ),
  'the read result is an exact redacted target projection with a stored digest'
);

-- Caller-provided scope and unknown request members are rejected before any
-- private rows are selected.
select throws_ok(
  $$select platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001',
      'dependencyId', 'caller-controlled'
    )
  )$$,
  '22023',
  'AC265 approved outage target read request rejected',
  'the read RPC rejects caller-controlled target scope'
);
select throws_ok(
  $$select platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001',
      'unexpected', true
    )
  )$$,
  '22023',
  'AC265 approved outage target read request rejected',
  'the read RPC rejects unknown request members'
);
select throws_ok(
  $$select platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://production/74000000-0000-4000-8000-000000000001'
    )
  )$$,
  '22023',
  'AC265 approved outage target read request rejected',
  'the read RPC rejects production target references'
);

select lives_ok(
  $do$
  insert into platform_private.ac265_approved_outage_targets (
    target_id, target_ref, target_sha256, candidate_id, run_id,
    identity_sha256, environment, source_revision, hosting_project_id,
    supabase_project_ref, deployment_id, dependency_id, route_operation_id,
    route_method, route_path, approved_at, expires_at
  ) values
    (
      '74000000-0000-4000-8000-000000000002'::uuid,
      'ac265-outage-target://staging/74000000-0000-4000-8000-000000000002',
      decode(repeat('c', 64), 'hex'),
      '71000000-0000-4000-8000-000000000001'::uuid,
      '73000000-0000-4000-8000-000000000001'::uuid,
      decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
      'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608',
      'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
      clock_timestamp() - interval '2 hours', clock_timestamp() - interval '1 hour'
    ),
    (
      '74000000-0000-4000-8000-000000000003'::uuid,
      'ac265-outage-target://staging/74000000-0000-4000-8000-000000000003',
      decode(repeat('d', 64), 'hex'),
      '71000000-0000-4000-8000-000000000001'::uuid,
      '73000000-0000-4000-8000-000000000001'::uuid,
      decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
      'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608',
      'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
      clock_timestamp() + interval '1 minute', clock_timestamp() + interval '2 hours'
    ),
    (
      '74000000-0000-4000-8000-000000000004'::uuid,
      'ac265-outage-target://staging/74000000-0000-4000-8000-000000000004',
      decode(repeat('e', 64), 'hex'),
      '71000000-0000-4000-8000-000000000001'::uuid,
      '73000000-0000-4000-8000-000000000001'::uuid,
      decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40),
      'other-hosting-project', 'abcdefghijklmnopqrst', '6428523608',
      'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
      clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
    ),
    (
      '74000000-0000-4000-8000-000000000005'::uuid,
      'ac265-outage-target://staging/74000000-0000-4000-8000-000000000005',
      decode(repeat('f', 64), 'hex'),
      '71000000-0000-4000-8000-000000000001'::uuid,
      '73000000-0000-4000-8000-000000000001'::uuid,
      decode(repeat('b', 64), 'hex'), 'staging', repeat('c', 40),
      'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608',
      'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types',
      clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
    )
  $do$,
  'disposable expiry and identity mismatch target fixtures load'
);

set local role service_role;
select is(
  platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000002'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'expired approved targets return only the conflict sentinel'
);
select is(
  platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000003'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'not-yet-approved targets return only the conflict sentinel'
);
select is(
  platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000004'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'hosting-project mismatches return only the conflict sentinel'
);
select is(
  platform_api.ac265_approved_outage_target_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', 'ac265-outage-target://staging/74000000-0000-4000-8000-000000000005'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'source-revision mismatches return only the conflict sentinel'
);
reset role;

select finish();
rollback;
