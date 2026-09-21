begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regclass('platform_private.ac265_approved_outage_target_policies') is not null,
  'CP04b creates the private approved outage-target policy ledger'
);
select ok(
  to_regclass('platform_private.ac265_approved_outage_target_registrations') is not null,
  'CP04b creates the private approved outage-target registration sidecar'
);
select ok(
  to_regprocedure('platform_api.ac265_approved_outage_target_register(jsonb)') is not null,
  'CP04b exposes one strict JSONB target-registration RPC'
);
select ok(
  to_regprocedure(
    'platform_private.ac265_build_approved_outage_target_canonical_json(uuid,text,timestamptz,timestamptz,uuid,text,text,text,text,text,text,text)'
  ) is not null,
  'CP04b exposes a private canonical target-byte builder'
);

select ok(
  coalesce(
    (
      select bool_and(relrowsecurity and relforcerowsecurity)
      from pg_catalog.pg_class
      where oid in (
        to_regclass('platform_private.ac265_approved_outage_target_policies'),
        to_regclass('platform_private.ac265_approved_outage_target_registrations')
      )
    ),
    false
  ),
  'policy and registration ledgers both enforce RLS'
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
        values
          ('platform_private.ac265_approved_outage_target_policies'::text),
          ('platform_private.ac265_approved_outage_target_registrations'::text)
      ) as tables(table_name)
      cross join (
        values
          ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text),
          ('DELETE'::text), ('TRUNCATE'::text), ('REFERENCES'::text),
          ('TRIGGER'::text)
      ) as privileges(privilege_name)
    ),
    false
  ),
  'no application role has direct policy or registration table privileges'
);

select ok(
  coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_approved_outage_target_register(jsonb)'),
      'execute'
    ),
    false
  )
  and not coalesce(
    has_function_privilege(
      'public',
      to_regprocedure('platform_api.ac265_approved_outage_target_register(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_approved_outage_target_register(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_approved_outage_target_register(jsonb)'),
      'execute'
    ),
    true
  ),
  'only service_role can execute target registration'
);

select ok(
  coalesce(
    (
      select p.prosecdef and p.proconfig = array['search_path=""']::text[]
      from pg_catalog.pg_proc as p
      where p.oid = to_regprocedure(
        'platform_api.ac265_approved_outage_target_register(jsonb)'
      )
    ),
    false
  ),
  'target registration is SECURITY DEFINER with an empty search_path'
);

select is(
  (select count(*) from platform_private.ac265_approved_outage_target_policies),
  0::bigint,
  'the migration seeds no operator policy'
);
select is(
  (select count(*) from platform_private.ac265_approved_outage_target_registrations),
  0::bigint,
  'the migration seeds no target registration'
);
select is(
  (select count(*) from platform_private.ac265_approved_outage_targets),
  0::bigint,
  'the migration seeds no approved outage target'
);

select is(
  platform_private.ac265_build_approved_outage_target_canonical_json(
    '74000000-0000-4000-8000-000000000001'::uuid,
    'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001',
    '2026-09-21T13:00:00.000Z'::timestamptz,
    '2026-09-21T13:01:00.000Z'::timestamptz,
    '73000000-0000-4000-8000-000000000001'::uuid,
    'wejammin-staging',
    'abcdefghijklmnopqrst',
    '6428523608',
    'supabase-auth',
    'CMS-03A-06',
    'GET',
    '/api/v1/cms/content-types'
  ),
  '{"approvedAt":"2026-09-21T13:00:00.000Z","expiresAt":"2026-09-21T13:01:00.000Z","schemaVersion":"ac265-approved-outage-target-v1","scope":{"dependencyId":"supabase-auth","deploymentId":"6428523608","hostingProjectId":"wejammin-staging","route":{"method":"GET","operationId":"CMS-03A-06","path":"/api/v1/cms/content-types"},"runId":"73000000-0000-4000-8000-000000000001","supabaseProjectRef":"abcdefghijklmnopqrst"},"source":"protected-staging-fault-control-plane","targetId":"74000000-0000-4000-8000-000000000001","targetRef":"ac265-outage-target://staging/74000000-0000-4000-8000-000000000001"}',
  'SQL canonical target bytes exactly match the TypeScript sorted-key vector'
);
select is(
  encode(
    extensions.digest(
      convert_to(
        platform_private.ac265_build_approved_outage_target_canonical_json(
          '74000000-0000-4000-8000-000000000001'::uuid,
          'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001',
          '2026-09-21T13:00:00.000Z'::timestamptz,
          '2026-09-21T13:01:00.000Z'::timestamptz,
          '73000000-0000-4000-8000-000000000001'::uuid,
          'wejammin-staging', 'abcdefghijklmnopqrst', '6428523608',
          'supabase-auth', 'CMS-03A-06', 'GET', '/api/v1/cms/content-types'
        ),
        'utf8'
      ),
      'sha256'
    ),
    'hex'
  ),
  'ecd573c63eff6b11b4ff044a70a8180901948e88a9c1db036f51f4a27e1f3d7e',
  'SQL canonical target digest matches the independent Node golden vector'
);

set local role anon;
select throws_ok(
  $$select platform_api.ac265_approved_outage_target_register('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot register a target'
);
reset role;

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
) values (
  '71000000-0000-4000-8000-000000000001'::uuid,
  decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
  '34751474024', 2, '34751910125', 1, 8801, 9901,
  jsonb_build_object(
    'environment', 'staging', 'ciRunId', '34751474024',
    'ciRunAttempt', 2, 'stagingRunId', '34751910125',
    'stagingRunAttempt', 1, 'sourceRevision', repeat('a', 40),
    'deploymentId', '6428523608', 'hostingProjectId', 'wejammin-staging',
    'supabaseProjectRef', 'abcdefghijklmnopqrst'
  ),
  '{}'::jsonb
);
insert into platform_private.ac265_runner_authorizations (
  authorization_id, run_id, identity_sha256, source_revision, deployment_id,
  github_run_id, github_run_attempt, workflow_sha, jti_sha256, request_sha256,
  authorized_at, expires_at
) values (
  '72000000-0000-4000-8000-000000000001'::uuid,
  '73000000-0000-4000-8000-000000000001'::uuid,
  decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
  '34796668543', 1, repeat('a', 40), decode(repeat('7', 64), 'hex'),
  decode(repeat('8', 64), 'hex'), clock_timestamp() - interval '10 seconds',
  clock_timestamp() + interval '4 minutes'
);

create temporary table ac265_cp04b_results (
  result_name text primary key,
  result jsonb not null
) on commit drop;
grant select, insert on ac265_cp04b_results to service_role;

set local role service_role;
insert into ac265_cp04b_results (result_name, result)
values (
  'missing_policy',
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001'
    )
  )
);
reset role;
select is(
  (select result from ac265_cp04b_results where result_name = 'missing_policy'),
  '{"status":"conflict"}'::jsonb,
  'a missing operator-approved policy fails closed with only the conflict sentinel'
);

select throws_ok(
  $$insert into platform_private.ac265_approved_outage_target_policies (
      policy_ref, environment, dependency_id, route_operation_id, route_method,
      route_path, target_validity_seconds, request_limit, approved_at, expires_at
    ) values (
      'ac265-outage-policy://staging/v1', 'staging', 'supabase-auth',
      'CMS-03A-06', 'GET', '/api/v1/cms/content-types', 60, 1,
      clock_timestamp(), clock_timestamp() + interval '1 day'
    )$$,
  '23514',
  null,
  'a 60-second target validity is rejected because it cannot cover the acquisition window and exact 60-second lease'
);
select throws_ok(
  $$insert into platform_private.ac265_approved_outage_target_policies (
      policy_ref, environment, dependency_id, route_operation_id, route_method,
      route_path, target_validity_seconds, request_limit, approved_at, expires_at
    ) values (
      'ac265-outage-policy://staging/v1', 'staging', 'supabase-auth',
      'CMS-03A-06', 'POST', '/api/v1/cms/content-types', 120, 2,
      clock_timestamp(), clock_timestamp() + interval '1 day'
    )$$,
  '23514',
  null,
  'policy rows reject unsafe methods and multi-request outage authority'
);

insert into platform_private.ac265_approved_outage_target_policies (
  policy_ref, environment, dependency_id, route_operation_id, route_method,
  route_path, target_validity_seconds, request_limit, approved_at, expires_at
) values (
  'ac265-outage-policy://staging/v1', 'staging', 'supabase-auth',
  'CMS-03A-06', 'GET', '/api/v1/cms/content-types', 120, 1,
  clock_timestamp() + interval '1 minute', clock_timestamp() + interval '1 day'
);
set local role service_role;
insert into ac265_cp04b_results (result_name, result)
values (
  'future_policy',
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000006'
    )
  )
);
reset role;
alter table platform_private.ac265_approved_outage_target_policies
  disable trigger ac265_approved_outage_target_policies_are_immutable;
delete from platform_private.ac265_approved_outage_target_policies;
alter table platform_private.ac265_approved_outage_target_policies
  enable trigger ac265_approved_outage_target_policies_are_immutable;

insert into platform_private.ac265_approved_outage_target_policies (
  policy_ref, environment, dependency_id, route_operation_id, route_method,
  route_path, target_validity_seconds, request_limit, approved_at, expires_at
) values (
  'ac265-outage-policy://staging/v1', 'staging', 'supabase-auth',
  'CMS-03A-06', 'GET', '/api/v1/cms/content-types', 120, 1,
  clock_timestamp() - interval '1 minute', clock_timestamp() + interval '30 seconds'
);
set local role service_role;
insert into ac265_cp04b_results (result_name, result)
values (
  'short_policy_window',
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000007'
    )
  )
);
reset role;
alter table platform_private.ac265_approved_outage_target_policies
  disable trigger ac265_approved_outage_target_policies_are_immutable;
delete from platform_private.ac265_approved_outage_target_policies;
alter table platform_private.ac265_approved_outage_target_policies
  enable trigger ac265_approved_outage_target_policies_are_immutable;

select is(
  (select result from ac265_cp04b_results where result_name = 'future_policy'),
  '{"status":"conflict"}'::jsonb,
  'a future-dated policy fails closed before its approval window begins'
);
select is(
  (select result from ac265_cp04b_results where result_name = 'short_policy_window'),
  '{"status":"conflict"}'::jsonb,
  'a policy that cannot cover the full target validity window fails closed'
);
select is(
  (select count(*) from platform_private.ac265_approved_outage_targets),
  0::bigint,
  'invalid policy windows create no target rows'
);

insert into platform_private.ac265_approved_outage_target_policies (
  policy_ref, environment, dependency_id, route_operation_id, route_method,
  route_path, target_validity_seconds, request_limit, approved_at, expires_at
) values (
  'ac265-outage-policy://staging/v1', 'staging', 'supabase-auth',
  'CMS-03A-06', 'GET', '/api/v1/cms/content-types', 120, 1,
  clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 day'
);

set local role service_role;
select throws_ok(
  $$select count(*) from platform_private.ac265_approved_outage_target_policies$$,
  '42501',
  null,
  'service_role cannot read target policy rows directly'
);
insert into ac265_cp04b_results (result_name, result)
values (
  'registered',
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001'
    )
  )
),
(
  'replay',
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001'
    )
  )
),
(
  'changed_idempotency',
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000002'
    )
  )
);
reset role;

set local role service_role;
insert into ac265_cp04b_results (result_name, result)
values (
  'lease_acquired',
  platform_api.ac265_hosted_outage_lease_acquire(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'targetRef', (
        select result ->> 'targetRef'
        from ac265_cp04b_results
        where result_name = 'registered'
      ),
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000008',
      'leaseDurationSeconds', 60,
      'requestLimit', 1
    )
  )
);
reset role;

select ok(
  (
    select result ?& array[
      'criterion', 'schemaVersion', 'authorizationRef', 'policyRef',
      'idempotencyRef', 'targetRef', 'targetSha256', 'approvedAt',
      'expiresAt', 'environment', 'hostingProjectId', 'supabaseProjectRef',
      'status', 'redacted'
    ]
      and (result - array[
        'criterion', 'schemaVersion', 'authorizationRef', 'policyRef',
        'idempotencyRef', 'targetRef', 'targetSha256', 'approvedAt',
        'expiresAt', 'environment', 'hostingProjectId', 'supabaseProjectRef',
        'status', 'redacted'
      ]) = '{}'::jsonb
      and result ->> 'status' = 'registered'
      and result ->> 'redacted' = 'true'
      and result ->> 'environment' = 'staging'
      and result ->> 'hostingProjectId' = 'wejammin-staging'
      and result ->> 'supabaseProjectRef' = 'abcdefghijklmnopqrst'
      and result ->> 'targetRef' ~ '^ac265-outage-target://staging/[0-9a-f-]{36}$'
      and result ->> 'targetSha256' ~ '^[a-f0-9]{64}$'
      and not (result ?| array[
        'dependencyId', 'route', 'runId', 'candidateId', 'identity',
        'sourceRevision', 'deploymentId', 'secret', 'token', 'credential'
      ])
    from ac265_cp04b_results
    where result_name = 'registered'
  ),
  'registration returns only the exact redacted server-derived envelope'
);
select is(
  (select result from ac265_cp04b_results where result_name = 'replay'),
  (select result from ac265_cp04b_results where result_name = 'registered'),
  'an exact retry returns the original immutable registration'
);
select is(
  (select result from ac265_cp04b_results where result_name = 'changed_idempotency'),
  '{"status":"conflict"}'::jsonb,
  'a second idempotency reference cannot register another target for the authorization'
);
select ok(
  (
    select result ->> 'state' = 'acquired'
      and result ->> 'leaseDurationSeconds' = '60'
      and result ->> 'requestLimit' = '1'
      and result ->> 'targetRef' = (
        select registered.result ->> 'targetRef'
        from ac265_cp04b_results as registered
        where registered.result_name = 'registered'
      )
    from ac265_cp04b_results
    where result_name = 'lease_acquired'
  ),
  'a registered target remains valid long enough to acquire the exact 60-second CP01 lease'
);
select is(
  (select count(*) from platform_private.ac265_approved_outage_target_registrations),
  1::bigint,
  'one authorization produces exactly one registration sidecar'
);
select is(
  (select count(*) from platform_private.ac265_approved_outage_targets),
  1::bigint,
  'one authorization produces exactly one approved outage target'
);
select ok(
  (
    select target.target_sha256 = extensions.digest(
      convert_to(
        platform_private.ac265_build_approved_outage_target_canonical_json(
          target.target_id, target.target_ref, target.approved_at,
          target.expires_at, target.run_id, target.hosting_project_id,
          target.supabase_project_ref, target.deployment_id,
          target.dependency_id, target.route_operation_id,
          target.route_method, target.route_path
        ),
        'utf8'
      ),
      'sha256'
    )
      and target.expires_at > target.approved_at
      and target.expires_at = target.approved_at + interval '120 seconds'
      and target.dependency_id = 'supabase-auth'
      and target.route_operation_id = 'CMS-03A-06'
      and target.route_method = 'GET'
      and target.route_path = '/api/v1/cms/content-types'
    from platform_private.ac265_approved_outage_targets as target
  ),
  'the target digest and scope are derived only from the approved policy and locked run'
);

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
) values
(
  '71000000-0000-4000-8000-000000000002'::uuid,
  decode(repeat('c', 64), 'hex'), repeat('c', 40), '6428523609',
  '34751474025', 1, '34751910126', 1, 8802, 9902,
  jsonb_build_object(
    'environment', 'staging', 'ciRunId', '34751474025',
    'ciRunAttempt', 1, 'stagingRunId', '34751910126',
    'stagingRunAttempt', 1, 'sourceRevision', repeat('c', 40),
    'deploymentId', '6428523609', 'hostingProjectId', 'wejammin-staging',
    'supabaseProjectRef', 'abcdefghijklmnopqrst'
  ),
  '{}'::jsonb
),
(
  '71000000-0000-4000-8000-000000000003'::uuid,
  decode(repeat('e', 64), 'hex'), repeat('e', 40), '6428523611',
  '34751474026', 1, '34751910127', 1, 8803, 9903,
  jsonb_build_object(
    'environment', 'staging', 'ciRunId', '34751474026',
    'ciRunAttempt', 1, 'stagingRunId', '34751910127',
    'stagingRunAttempt', 1, 'sourceRevision', repeat('e', 40),
    'deploymentId', '6428523611', 'hostingProjectId', 'wejammin-staging',
    'supabaseProjectRef', 'abcdefghijklmnopqrst'
  ),
  '{}'::jsonb
);
insert into platform_private.ac265_runner_authorizations (
  authorization_id, run_id, identity_sha256, source_revision, deployment_id,
  github_run_id, github_run_attempt, workflow_sha, jti_sha256, request_sha256,
  authorized_at, expires_at
) values
  (
    '72000000-0000-4000-8000-000000000002'::uuid,
    '73000000-0000-4000-8000-000000000002'::uuid,
    decode(repeat('c', 64), 'hex'), repeat('c', 40), '6428523609',
    '34796668544', 1, repeat('c', 40), decode(repeat('9', 64), 'hex'),
    decode(repeat('a', 64), 'hex'), clock_timestamp() - interval '5 minutes',
    clock_timestamp() - interval '1 second'
  ),
  (
    '72000000-0000-4000-8000-000000000003'::uuid,
    '73000000-0000-4000-8000-000000000003'::uuid,
    decode(repeat('d', 64), 'hex'), repeat('d', 40), '6428523610',
    '34796668545', 1, repeat('d', 40), decode(repeat('c', 64), 'hex'),
    decode(repeat('d', 64), 'hex'), clock_timestamp() - interval '10 seconds',
    clock_timestamp() + interval '4 minutes'
  ),
  (
    '72000000-0000-4000-8000-000000000004'::uuid,
    '73000000-0000-4000-8000-000000000004'::uuid,
    decode(repeat('e', 64), 'hex'), repeat('e', 40), '6428523611',
    '34796668546', 1, repeat('e', 40), decode(repeat('e', 64), 'hex'),
    decode(repeat('f', 64), 'hex'), clock_timestamp() + interval '1 minute',
    clock_timestamp() + interval '5 minutes'
  );

set local role service_role;
select is(
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000002',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000003'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'expired authorizations fail closed with only the conflict sentinel'
);
select is(
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000003',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000004'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'authorizations without an exact candidate identity fail closed generically'
);
select is(
  platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000004',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000005'
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'future-dated authorizations fail closed until their validity window begins'
);
reset role;
select is(
  (select count(*) from platform_private.ac265_approved_outage_targets),
  1::bigint,
  'failed registrations create no additional target rows'
);

select throws_ok(
  $$select platform_api.ac265_approved_outage_target_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
      'authorizationRef', 'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
      'policyRef', 'ac265-outage-policy://staging/v1',
      'idempotencyRef', 'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001',
      'dependencyId', 'caller-controlled'
    )
  )$$,
  '22023',
  'AC265 approved outage target registration request rejected',
  'caller-authored scope is rejected before private state is selected'
);

select throws_ok(
  $$update platform_private.ac265_approved_outage_target_policies
    set dependency_id = 'other'$$,
  '55000',
  'AC265 approved outage target policies are immutable',
  'approved target policies cannot be updated'
);
select throws_ok(
  $$delete from platform_private.ac265_approved_outage_target_registrations$$,
  '55000',
  'AC265 approved outage target registrations are immutable',
  'target registration sidecars cannot be deleted'
);

select finish();
rollback;
