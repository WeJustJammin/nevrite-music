begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- AC265 CP-02 is a private, forward-only registry.  The test intentionally
-- starts with the schema/privilege boundaries before loading disposable rows.
select ok(
  coalesce(
    (
      select count(*) = 4
        and bool_and(relrowsecurity and relforcerowsecurity)
      from pg_catalog.pg_class
      where oid in (
        to_regclass('platform_private.ac265_approved_safe_resources'),
        to_regclass('platform_private.ac265_approved_runner_mappings'),
        to_regclass('platform_private.ac265_approved_runner_mapping_resources'),
        to_regclass('platform_private.ac265_approved_runner_mapping_scenarios')
      )
    ),
    false
  ),
  'all four CP-02 registry tables exist with enabled, forced RLS'
);

select ok(
  coalesce(
    (
      select count(*) = 2
        and bool_and(pg_catalog.pg_get_constraintdef(oid) ilike '%hosting_project_id%wejammin-staging%')
      from pg_catalog.pg_constraint
      where conrelid in (
        to_regclass('platform_private.ac265_approved_safe_resources'),
        to_regclass('platform_private.ac265_approved_runner_mappings')
      )
        and conname in (
          'ac265_approved_safe_resources_hosting_project_id_scope',
          'ac265_approved_runner_mappings_hosting_project_id_scope'
        )
    ),
    false
  ),
  'safe resources and mappings are explicitly scoped to wejammin-staging'
);

select ok(
  to_regprocedure('platform_api.ac265_approved_safe_resource_register(jsonb)') is not null
    and to_regprocedure('platform_api.ac265_approved_runner_mapping_register(jsonb)') is not null
    and to_regprocedure('platform_api.ac265_approved_runner_mapping_read(jsonb)') is not null,
  'CP-02 register and read RPCs exist with strict JSONB boundaries'
);

select ok(
  coalesce(
    (
      select count(*) = 3
        and bool_and(
          p.prosecdef
          and p.proconfig = array['search_path=""']::text[]
        )
      from pg_catalog.pg_proc as p
      where p.oid in (
        to_regprocedure('platform_api.ac265_approved_safe_resource_register(jsonb)'),
        to_regprocedure('platform_api.ac265_approved_runner_mapping_register(jsonb)'),
        to_regprocedure('platform_api.ac265_approved_runner_mapping_read(jsonb)')
      )
    ),
    false
  ),
  'all CP-02 RPCs are SECURITY DEFINER with an exact empty search_path'
);

select ok(
  coalesce(
    (
      select bool_and(
        coalesce(has_function_privilege('service_role', proc, 'execute'), false)
        and not coalesce(has_function_privilege('public', proc, 'execute'), true)
        and not coalesce(has_function_privilege('anon', proc, 'execute'), true)
        and not coalesce(has_function_privilege('authenticated', proc, 'execute'), true)
      )
      from (
        values
          (to_regprocedure('platform_api.ac265_approved_safe_resource_register(jsonb)')),
          (to_regprocedure('platform_api.ac265_approved_runner_mapping_register(jsonb)')),
          (to_regprocedure('platform_api.ac265_approved_runner_mapping_read(jsonb)'))
      ) as functions(proc)
    ),
    false
  ),
  'only service_role can execute the CP-02 registry RPCs'
);

select ok(
  coalesce(
    (
      select bool_and(
        not coalesce(
          has_table_privilege(role_name, to_regclass(table_name), privilege_name),
          false
        )
      )
      from (values ('public'::name), ('anon'::name), ('authenticated'::name), ('service_role'::name)) as roles(role_name)
      cross join (
        values
          ('platform_private.ac265_approved_safe_resources'::text),
          ('platform_private.ac265_approved_runner_mappings'::text),
          ('platform_private.ac265_approved_runner_mapping_resources'::text),
          ('platform_private.ac265_approved_runner_mapping_scenarios'::text)
      ) as tables(table_name)
      cross join (
        values
          ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text), ('DELETE'::text),
          ('TRUNCATE'::text), ('REFERENCES'::text), ('TRIGGER'::text)
      ) as privileges(privilege_name)
    ),
    false
  ),
  'all CP-02 tables have no direct grants, including service_role'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_attribute
    where attrelid in (
      to_regclass('platform_private.ac265_approved_safe_resources'),
      to_regclass('platform_private.ac265_approved_runner_mappings'),
      to_regclass('platform_private.ac265_approved_runner_mapping_resources'),
      to_regclass('platform_private.ac265_approved_runner_mapping_scenarios')
    )
      and attnum > 0
      and not attisdropped
      and attname ~* '(raw|secret|credential|token|payload|body|content|locator$)'
    ),
  'CP-02 storage contains no raw locator, content, credential, token, or payload columns'
);

create temporary table ac265_cp02_results (
  result_name text primary key,
  result jsonb
) on commit drop;

create temporary table ac265_cp02_requests (
  request_name text primary key,
  request jsonb not null
) on commit drop;

grant select, insert on ac265_cp02_results, ac265_cp02_requests to service_role;

-- Disposable candidate and authorization rows model the immutable CP-01
-- server-side identity tuple.  CP-02 derives all scope from these rows.
select lives_ok(
  $$
  with fixture as (
    select jsonb_build_object(
      'environment', 'staging',
      'ciRunId', '34751474024',
      'ciRunAttempt', 2,
      'stagingRunId', '34751910125',
      'stagingRunAttempt', 1,
      'sourceRevision', repeat('a', 40),
      'deploymentId', '6428523620',
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
    ) as identity
  ),
  canonical as (
    select
      identity,
      '{"environment":' || pg_catalog.to_json(identity ->> 'environment')::text ||
      ',"ciRunId":' || pg_catalog.to_json(identity ->> 'ciRunId')::text ||
      ',"ciRunAttempt":' || (identity ->> 'ciRunAttempt')::integer::text ||
      ',"stagingRunId":' || pg_catalog.to_json(identity ->> 'stagingRunId')::text ||
      ',"stagingRunAttempt":' || (identity ->> 'stagingRunAttempt')::integer::text ||
      ',"sourceRevision":' || pg_catalog.to_json(identity ->> 'sourceRevision')::text ||
      ',"deploymentId":' || pg_catalog.to_json(identity ->> 'deploymentId')::text ||
      ',"deployedAt":' || pg_catalog.to_json(identity ->> 'deployedAt')::text ||
      ',"buildId":' || pg_catalog.to_json(identity ->> 'buildId')::text ||
      ',"buildManifestSha256":' || pg_catalog.to_json(identity ->> 'buildManifestSha256')::text ||
      ',"artifactSha256":' || pg_catalog.to_json(identity ->> 'artifactSha256')::text ||
      ',"hostingAccountId":' || pg_catalog.to_json(identity ->> 'hostingAccountId')::text ||
      ',"hostingProjectId":' || pg_catalog.to_json(identity ->> 'hostingProjectId')::text ||
      ',"supabaseProjectRef":' || pg_catalog.to_json(identity ->> 'supabaseProjectRef')::text ||
      ',"migrationVersion":' || pg_catalog.to_json(identity ->> 'migrationVersion')::text ||
      ',"migrationSha256":' || pg_catalog.to_json(identity ->> 'migrationSha256')::text ||
      ',"webOrigin":' || pg_catalog.to_json(identity ->> 'webOrigin')::text ||
      ',"apiOrigin":' || pg_catalog.to_json(identity ->> 'apiOrigin')::text ||
      ',"supabaseOrigin":' || pg_catalog.to_json(identity ->> 'supabaseOrigin')::text ||
      '}' as identity_canonical
    from fixture
  )
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
  )
  select
    '10000000-0000-4000-8000-000000000020'::uuid,
    extensions.digest(convert_to(identity_canonical, 'UTF8'), 'sha256'),
    identity ->> 'sourceRevision',
    identity ->> 'deploymentId',
    identity ->> 'ciRunId',
    (identity ->> 'ciRunAttempt')::integer,
    identity ->> 'stagingRunId',
    (identity ->> 'stagingRunAttempt')::integer,
    8801,
    9901,
    identity,
    '{}'::jsonb
  from canonical
  $$,
  'the disposable CP-02 verified candidate fixture loads'
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
    '20000000-0000-4000-8000-000000000020'::uuid,
    '10000000-0000-4000-8000-000000000020'::uuid,
    (select identity_sha256 from platform_private.ac265_verified_candidates where candidate_id = '10000000-0000-4000-8000-000000000020'::uuid),
    repeat('a', 40),
    '6428523620',
    '34796668520',
    1,
    repeat('a', 40),
    decode(repeat('7', 64), 'hex'),
    decode(repeat('8', 64), 'hex'),
    clock_timestamp() - interval '10 seconds',
    clock_timestamp() + interval '4 minutes'
  )
  $$,
  'the disposable CP-02 authorization fixture loads'
);

-- AC265 CP-02 owner-approved population pins (disposable, local-test-only).
-- The population-gate migration seeds no rows; these exact pins let the
-- register RPCs accept the disposable fixtures used by this suite.
insert into platform_private.ac265_approved_registry_resources
  (resource_kind, locator_sha256, approval_ref, environment)
values
  ('content_schema', decode(repeat('1', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000001', 'staging'),
  ('staff_case', decode(repeat('2', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000002', 'staging'),
  ('organization', decode(repeat('3', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000003', 'staging'),
  ('prerequisite', decode(repeat('4', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000004', 'staging');

insert into platform_private.ac265_approved_registry_role_kinds
  (role_key, resource_kind, approval_ref, environment)
values
  ('entitled_read', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000010', 'staging'),
  ('owner_full', 'organization', 'ac265-approval://staging/90000000-0000-4000-8000-000000000011', 'staging'),
  ('guardian_mandate', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000012', 'staging'),
  ('junior_restricted', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000013', 'staging'),
  ('business_mandate', 'organization', 'ac265-approval://staging/90000000-0000-4000-8000-000000000014', 'staging'),
  ('staff_case_scoped', 'staff_case', 'ac265-approval://staging/90000000-0000-4000-8000-000000000015', 'staging'),
  ('admin_step_up', 'organization', 'ac265-approval://staging/90000000-0000-4000-8000-000000000016', 'staging'),
  ('forbidden_hidden', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000017', 'staging'),
  ('disabled_prerequisite', 'prerequisite', 'ac265-approval://staging/90000000-0000-4000-8000-000000000018', 'staging');

insert into platform_private.ac265_approved_registry_scenario_roles
  (scenario_key, role_key, approval_ref, environment)
select scenario_key, role_key, 'ac265-approval://staging/90000000-0000-4000-8000-000000000020', 'staging'
from unnest(array['idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions', 'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab', 'auth_expiry', 'rate_limit_429', 'dependency_outage']) as scenarios(scenario_key)
cross join unnest(array['entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite']) as roles(role_key);

select ok(
  (
    select identity_sha256 = extensions.digest(
      convert_to(
        '{"environment":' || pg_catalog.to_json(identity ->> 'environment')::text ||
        ',"ciRunId":' || pg_catalog.to_json(identity ->> 'ciRunId')::text ||
        ',"ciRunAttempt":' || (identity ->> 'ciRunAttempt')::integer::text ||
        ',"stagingRunId":' || pg_catalog.to_json(identity ->> 'stagingRunId')::text ||
        ',"stagingRunAttempt":' || (identity ->> 'stagingRunAttempt')::integer::text ||
        ',"sourceRevision":' || pg_catalog.to_json(identity ->> 'sourceRevision')::text ||
        ',"deploymentId":' || pg_catalog.to_json(identity ->> 'deploymentId')::text ||
        ',"deployedAt":' || pg_catalog.to_json(identity ->> 'deployedAt')::text ||
        ',"buildId":' || pg_catalog.to_json(identity ->> 'buildId')::text ||
        ',"buildManifestSha256":' || pg_catalog.to_json(identity ->> 'buildManifestSha256')::text ||
        ',"artifactSha256":' || pg_catalog.to_json(identity ->> 'artifactSha256')::text ||
        ',"hostingAccountId":' || pg_catalog.to_json(identity ->> 'hostingAccountId')::text ||
        ',"hostingProjectId":' || pg_catalog.to_json(identity ->> 'hostingProjectId')::text ||
        ',"supabaseProjectRef":' || pg_catalog.to_json(identity ->> 'supabaseProjectRef')::text ||
        ',"migrationVersion":' || pg_catalog.to_json(identity ->> 'migrationVersion')::text ||
        ',"migrationSha256":' || pg_catalog.to_json(identity ->> 'migrationSha256')::text ||
        ',"webOrigin":' || pg_catalog.to_json(identity ->> 'webOrigin')::text ||
        ',"apiOrigin":' || pg_catalog.to_json(identity ->> 'apiOrigin')::text ||
        ',"supabaseOrigin":' || pg_catalog.to_json(identity ->> 'supabaseOrigin')::text ||
        '}',
        'UTF8'
      ),
      'sha256'
    )
    from platform_private.ac265_verified_candidates
    where candidate_id = '10000000-0000-4000-8000-000000000020'::uuid
  ),
  'the candidate fixture identity digest matches CP-01 canonical identity bytes'
);

-- A safe resource accepts only its kind and locator digest from the caller.
-- Every other tuple member and the opaque resource reference are server-derived.
insert into ac265_cp02_requests(request_name, request)
values
  (
    'resource-content-schema',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
      'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000020',
      'resourceKind', 'content_schema',
      'locatorSha256', repeat('1', 64)
    )
  ),
  (
    'resource-staff-case',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
      'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000021',
      'resourceKind', 'staff_case',
      'locatorSha256', repeat('2', 64)
    )
  ),
  (
    'resource-organization',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
      'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000022',
      'resourceKind', 'organization',
      'locatorSha256', repeat('3', 64)
    )
  ),
  (
    'resource-prerequisite',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
      'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000023',
      'resourceKind', 'prerequisite',
      'locatorSha256', repeat('4', 64)
    )
  );

set local role service_role;
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'resource-content-schema', platform_api.ac265_approved_safe_resource_register(request)
  from ac265_cp02_requests
  where request_name = 'resource-content-schema'
  $$,
  'service_role registers the content-schema resource'
);
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'resource-staff-case', platform_api.ac265_approved_safe_resource_register(request)
  from ac265_cp02_requests
  where request_name = 'resource-staff-case'
  $$,
  'service_role registers the staff-case resource'
);
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'resource-organization', platform_api.ac265_approved_safe_resource_register(request)
  from ac265_cp02_requests
  where request_name = 'resource-organization'
  $$,
  'service_role registers the organization resource'
);
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'resource-prerequisite', platform_api.ac265_approved_safe_resource_register(request)
  from ac265_cp02_requests
  where request_name = 'resource-prerequisite'
  $$,
  'service_role registers the prerequisite resource'
);
reset role;

select ok(
  (
    select result ?& array['criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef', 'resource', 'locatorSha256', 'environment', 'hostingProjectId', 'supabaseProjectRef', 'approvedAt', 'redacted']
      and (result - array['criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef', 'resource', 'locatorSha256', 'environment', 'hostingProjectId', 'supabaseProjectRef', 'approvedAt', 'redacted']) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-approved-registry-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020'
      and result ->> 'locatorSha256' = repeat('1', 64)
      and result ->> 'environment' = 'staging'
      and result ->> 'hostingProjectId' = 'wejammin-staging'
      and result ->> 'supabaseProjectRef' = 'abcdefghijklmnopqrst'
      and result ->> 'idempotencyRef' = 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000020'
      and result ->> 'approvedAt' is not null
      and jsonb_typeof(result -> 'criterion') = 'string'
      and jsonb_typeof(result -> 'schemaVersion') = 'string'
      and jsonb_typeof(result -> 'authorizationRef') = 'string'
      and jsonb_typeof(result -> 'idempotencyRef') = 'string'
      and jsonb_typeof(result -> 'locatorSha256') = 'string'
      and jsonb_typeof(result -> 'environment') = 'string'
      and jsonb_typeof(result -> 'hostingProjectId') = 'string'
      and jsonb_typeof(result -> 'supabaseProjectRef') = 'string'
      and jsonb_typeof(result -> 'approvedAt') = 'string'
      and jsonb_typeof(result -> 'redacted') = 'boolean'
      and result -> 'redacted' = 'true'::jsonb
      and jsonb_typeof(result -> 'resource') = 'object'
      and jsonb_typeof(result #> '{resource,kind}') = 'string'
      and jsonb_typeof(result #> '{resource,ref}') = 'string'
      and jsonb_typeof(result #> '{resource,sha256}') = 'string'
      and (result -> 'resource') ?& array['kind', 'ref', 'sha256']
      and ((result -> 'resource') - array['kind', 'ref', 'sha256']) = '{}'::jsonb
      and result #>> '{resource,kind}' = 'content_schema'
      and result #>> '{resource,ref}' ~ '^ac265-resource://content_schema/[0-9a-f-]{36}$'
      and result #>> '{resource,sha256}' ~ '^[a-f0-9]{64}$'
      and result #>> '{resource,sha256}' = encode(extensions.digest(convert_to(result #>> '{resource,ref}', 'utf8'), 'sha256'), 'hex')
    from ac265_cp02_results
    where result_name = 'resource-content-schema'
  ),
  'safe-resource registration returns the exact redacted server-derived shape'
);

select ok(
  (
    select count(*) = 4
      and count(distinct resource_kind) = 4
      and bool_and(environment = 'staging')
      and bool_and(candidate_id = '10000000-0000-4000-8000-000000000020'::uuid)
      and bool_and(run_id = '10000000-0000-4000-8000-000000000020'::uuid)
      and bool_and(hosting_project_id = 'wejammin-staging')
      and bool_and(supabase_project_ref = 'abcdefghijklmnopqrst')
    from platform_private.ac265_approved_safe_resources
    where authorization_id = '20000000-0000-4000-8000-000000000020'::uuid
  ),
  'four safe resources retain only the derived staging identity/project tuple'
);

-- Exact retries reproduce the immutable result.  Reusing the kind or the
-- idempotency reference for a different request returns only a conflict.
set local role service_role;
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'resource-content-schema-retry', platform_api.ac265_approved_safe_resource_register(request)
  from ac265_cp02_requests
  where request_name = 'resource-content-schema'
  $$,
  'an exact safe-resource retry is accepted'
);
select lives_ok(
  $$
  select platform_api.ac265_approved_safe_resource_register(
    (select request || jsonb_build_object('locatorSha256', repeat('f', 64), 'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000024')
     from ac265_cp02_requests where request_name = 'resource-content-schema')
  )
  $$,
  'a different safe-resource idempotency request reaches the conflict boundary'
);
reset role;
select is(
  (select result from ac265_cp02_results where result_name = 'resource-content-schema-retry'),
  (select result from ac265_cp02_results where result_name = 'resource-content-schema'),
  'an exact safe-resource retry returns the original immutable outcome'
);
set local role service_role;
select is(
  platform_api.ac265_approved_safe_resource_register(
    (select request || jsonb_build_object('locatorSha256', repeat('f', 64), 'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000024')
     from ac265_cp02_requests where request_name = 'resource-content-schema')
  ),
  '{"status":"conflict"}'::jsonb,
  'a non-identical safe-resource retry is a conflict'
);
reset role;

-- Mapping requests carry exact role/scenario key sets.  The role map covers
-- all four registered resource kinds exactly once by opaque reference.
insert into ac265_cp02_requests(request_name, request)
select 'mapping-valid', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000020',
  'roleResourceBindings', jsonb_build_object(
    'entitled_read', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-content-schema')),
    'owner_full', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-organization')),
    'guardian_mandate', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-content-schema')),
    'junior_restricted', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-content-schema')),
    'business_mandate', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-organization')),
    'staff_case_scoped', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-staff-case')),
    'admin_step_up', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-organization')),
    'forbidden_hidden', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-content-schema')),
    'disabled_prerequisite', jsonb_build_array((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-prerequisite'))
  ),
  'scenarioRoleBindings', jsonb_build_object(
    'idp_sign_in', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'server_authoritative_rls', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'keyboard_landmarks_live_regions', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'three_breakpoints', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'zoom_200', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'offline_reconnect', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'stale_multi_tab', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'auth_expiry', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'rate_limit_429', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite'),
    'dependency_outage', jsonb_build_array('entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite')
  )
)
where exists (select 1 from ac265_cp02_results where result_name = 'resource-prerequisite');

set local role service_role;
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'mapping-valid', platform_api.ac265_approved_runner_mapping_register(request)
  from ac265_cp02_requests
  where request_name = 'mapping-valid'
  $$,
  'service_role registers an exact nine-role, ten-scenario mapping'
);
reset role;

select ok(
  (
    select result ?& array['criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef', 'environment', 'hostingProjectId', 'supabaseProjectRef', 'redacted', 'mapping', 'resources']
      and (result - array['criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef', 'environment', 'hostingProjectId', 'supabaseProjectRef', 'redacted', 'mapping', 'resources']) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-approved-registry-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020'
      and result ->> 'idempotencyRef' = 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000020'
      and result ->> 'environment' = 'staging'
      and result ->> 'hostingProjectId' = 'wejammin-staging'
      and result ->> 'supabaseProjectRef' = 'abcdefghijklmnopqrst'
      and jsonb_typeof(result -> 'criterion') = 'string'
      and jsonb_typeof(result -> 'schemaVersion') = 'string'
      and jsonb_typeof(result -> 'authorizationRef') = 'string'
      and jsonb_typeof(result -> 'idempotencyRef') = 'string'
      and jsonb_typeof(result -> 'environment') = 'string'
      and jsonb_typeof(result -> 'hostingProjectId') = 'string'
      and jsonb_typeof(result -> 'supabaseProjectRef') = 'string'
      and jsonb_typeof(result -> 'redacted') = 'boolean'
      and result -> 'redacted' = 'true'::jsonb
      and jsonb_typeof(result -> 'mapping') = 'object'
      and (result -> 'mapping') ?& array['schemaVersion', 'source', 'mappingId', 'approvedAt', 'runId', 'identity', 'roleResourceBindings', 'scenarioRoleBindings']
      and ((result -> 'mapping') - array['schemaVersion', 'source', 'mappingId', 'approvedAt', 'runId', 'identity', 'roleResourceBindings', 'scenarioRoleBindings']) = '{}'::jsonb
      and jsonb_typeof(result -> 'resources') = 'array'
      and result #>> '{mapping,schemaVersion}' = 'ac265-approved-runner-mappings-v1'
      and result #>> '{mapping,source}' = 'protected-ac265-runner-mapping-control-plane'
      and result #>> '{mapping,mappingId}' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and result #>> '{mapping,approvedAt}' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
      and result #>> '{mapping,runId}' = '10000000-0000-4000-8000-000000000020'
      and jsonb_typeof(result #> '{mapping,identity}') = 'object'
      and jsonb_typeof(result #> '{mapping,roleResourceBindings}') = 'object'
      and jsonb_typeof(result #> '{mapping,scenarioRoleBindings}') = 'object'
      and jsonb_array_length(result -> 'resources') = 4
      from ac265_cp02_results
    where result_name = 'mapping-valid'
  ),
  'mapping registration returns only its redacted derived identity'
);

select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mappings),
  1,
  'mapping registration creates exactly one immutable parent'
);
select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mapping_resources),
  9,
  'mapping registration persists role-resource children atomically'
);
select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mapping_scenarios),
  90,
  'mapping registration persists ten scenario-role children with ordinals'
);
select ok(
  not exists (
    select 1
    from platform_private.ac265_approved_runner_mapping_resources as child
    where child.ordinal is null or child.ordinal < 1
  )
  and not exists (
    select 1
    from platform_private.ac265_approved_runner_mapping_scenarios as child
    where child.ordinal is null or child.ordinal < 1
  ),
  'all mapping children have positive server-side ordinals'
);

-- The read boundary emits the existing ApprovedRunnerMappingsV1 shape plus the
-- four-entry resource manifest, with all values joined to this authorization.
insert into ac265_cp02_requests(request_name, request)
select 'mapping-read', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'mappingId', result #>> '{mapping,mappingId}'
)
from ac265_cp02_results
where result_name = 'mapping-valid';

set local role service_role;
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'mapping-read', platform_api.ac265_approved_runner_mapping_read(request)
  from ac265_cp02_requests
  where request_name = 'mapping-read'
  $$,
  'service_role reads a mapping through its authorization binding'
);
reset role;

select ok(
  (
    select result ?& array['criterion', 'schemaVersion', 'authorizationRef', 'environment', 'hostingProjectId', 'supabaseProjectRef', 'redacted', 'mapping', 'resources']
      and (result - array['criterion', 'schemaVersion', 'authorizationRef', 'environment', 'hostingProjectId', 'supabaseProjectRef', 'redacted', 'mapping', 'resources']) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-approved-registry-control-v1'
      and result ->> 'authorizationRef' = 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020'
      and result ->> 'environment' = 'staging'
      and result ->> 'hostingProjectId' = 'wejammin-staging'
      and result ->> 'supabaseProjectRef' = 'abcdefghijklmnopqrst'
      and jsonb_typeof(result -> 'criterion') = 'string'
      and jsonb_typeof(result -> 'schemaVersion') = 'string'
      and jsonb_typeof(result -> 'authorizationRef') = 'string'
      and jsonb_typeof(result -> 'environment') = 'string'
      and jsonb_typeof(result -> 'hostingProjectId') = 'string'
      and jsonb_typeof(result -> 'supabaseProjectRef') = 'string'
      and jsonb_typeof(result -> 'redacted') = 'boolean'
      and result -> 'redacted' = 'true'::jsonb
      and jsonb_typeof(result -> 'mapping') = 'object'
      and (result -> 'mapping') ?& array['schemaVersion', 'source', 'mappingId', 'approvedAt', 'runId', 'identity', 'roleResourceBindings', 'scenarioRoleBindings']
      and ((result -> 'mapping') - array['schemaVersion', 'source', 'mappingId', 'approvedAt', 'runId', 'identity', 'roleResourceBindings', 'scenarioRoleBindings']) = '{}'::jsonb
      and result #>> '{mapping,schemaVersion}' = 'ac265-approved-runner-mappings-v1'
      and result #>> '{mapping,source}' = 'protected-ac265-runner-mapping-control-plane'
      and result #>> '{mapping,mappingId}' = (select result #>> '{mapping,mappingId}' from ac265_cp02_results where result_name = 'mapping-valid')
      and result #>> '{mapping,mappingId}' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and result #>> '{mapping,approvedAt}' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
      and result #>> '{mapping,runId}' = '10000000-0000-4000-8000-000000000020'
      and jsonb_typeof(result #> '{mapping,identity}') = 'object'
      and jsonb_typeof(result #> '{mapping,roleResourceBindings}') = 'object'
      and jsonb_typeof(result #> '{mapping,scenarioRoleBindings}') = 'object'
      and (select count(*) from jsonb_object_keys(result -> 'mapping' -> 'roleResourceBindings')) = 9
      and (select count(*) from jsonb_object_keys(result -> 'mapping' -> 'scenarioRoleBindings')) = 10
      and jsonb_array_length(result -> 'resources') = 4
      and not (result::text ~* '(locator|secret|credential|token|payload)')
    from ac265_cp02_results
    where result_name = 'mapping-read'
  ),
  'mapping read returns the exact redacted control envelope and four-entry manifest'
);

select ok(
  (
    select count(*) = 4
      and count(distinct value ->> 'kind') = 4
      and count(distinct value ->> 'ref') = 4
      and bool_and(value ?& array['kind', 'ref', 'sha256'])
      and bool_and((value - array['kind', 'ref', 'sha256']) = '{}'::jsonb)
      and bool_and(jsonb_typeof(value -> 'kind') = 'string')
      and bool_and(jsonb_typeof(value -> 'ref') = 'string')
      and bool_and(jsonb_typeof(value -> 'sha256') = 'string')
      and bool_and(value ->> 'ref' ~ '^ac265-resource://(?:content_schema|staff_case|organization|prerequisite)/[0-9a-f-]{36}$')
      and bool_and(value ->> 'sha256' ~ '^[a-f0-9]{64}$')
      and bool_and(value ->> 'sha256' = encode(extensions.digest(convert_to(value ->> 'ref', 'utf8'), 'sha256'), 'hex'))
    from ac265_cp02_results,
      lateral jsonb_array_elements(result -> 'resources') as resource(value)
    where result_name = 'mapping-read'
  ),
  'the read manifest contains four distinct kind/reference/digest entries'
);

-- Mapping replay is exact; any changed role/scenario set or second mapping for
-- this run/authentication is a conflict and creates no orphan children.
set local role service_role;
select lives_ok(
  $$
  insert into ac265_cp02_results(result_name, result)
  select 'mapping-retry', platform_api.ac265_approved_runner_mapping_register(request)
  from ac265_cp02_requests
  where request_name = 'mapping-valid'
  $$,
  'an exact mapping retry is accepted'
);
reset role;
select is(
  (select result from ac265_cp02_results where result_name = 'mapping-retry'),
  (select result from ac265_cp02_results where result_name = 'mapping-valid'),
  'an exact mapping retry returns the original immutable outcome'
);

insert into ac265_cp02_requests(request_name, request)
select 'mapping-conflict', jsonb_set(
  request,
  '{roleResourceBindings,owner_full,0}',
  to_jsonb((select result #>> '{resource,ref}' from ac265_cp02_results where result_name = 'resource-staff-case'))
)
from ac265_cp02_requests
where request_name = 'mapping-valid';
set local role service_role;
select is(
  platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-conflict')),
  '{"status":"conflict"}'::jsonb,
  'a changed mapping retry is a conflict'
);
select is(
  platform_api.ac265_approved_runner_mapping_register(
    (select request || jsonb_build_object('idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000099') from ac265_cp02_requests where request_name = 'mapping-valid')
  ),
  '{"status":"conflict"}'::jsonb,
  'a second idempotency key for one run/authentication is a conflict'
);
reset role;
select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mappings),
  1,
  'mapping conflicts do not create a second parent'
);
select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mapping_resources),
  9,
  'mapping conflicts do not create resource orphans'
);
select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mapping_scenarios),
  90,
  'mapping conflicts do not create scenario orphans'
);

-- Exact key validation rejects missing and extra role/scenario members, while
-- duplicate array members are also rejected before any parent insert.
insert into ac265_cp02_requests(request_name, request)
select 'mapping-missing-role', request #- '{roleResourceBindings,owner_full}'
from ac265_cp02_requests where request_name = 'mapping-valid';
insert into ac265_cp02_requests(request_name, request)
select 'mapping-extra-role', jsonb_set(request, '{roleResourceBindings,unexpected}', '[]'::jsonb)
from ac265_cp02_requests where request_name = 'mapping-valid';
insert into ac265_cp02_requests(request_name, request)
select 'mapping-missing-scenario', request #- '{scenarioRoleBindings,dependency_outage}'
from ac265_cp02_requests where request_name = 'mapping-valid';
insert into ac265_cp02_requests(request_name, request)
select 'mapping-extra-scenario', jsonb_set(request, '{scenarioRoleBindings,unexpected}', '[]'::jsonb)
from ac265_cp02_requests where request_name = 'mapping-valid';
insert into ac265_cp02_requests(request_name, request)
select 'mapping-duplicate-role-value', jsonb_set(request, '{roleResourceBindings,owner_full}', (request #> '{roleResourceBindings,owner_full}') || (request #> '{roleResourceBindings,owner_full}'))
from ac265_cp02_requests where request_name = 'mapping-valid';
insert into ac265_cp02_requests(request_name, request)
select 'mapping-duplicate-scenario-value', jsonb_set(request, '{scenarioRoleBindings,dependency_outage}', ' ["owner_full", "owner_full"]'::jsonb)
from ac265_cp02_requests where request_name = 'mapping-valid';

set local role service_role;
select throws_ok($$select platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-missing-role'))$$, '22023', 'AC265 approved runner mapping request rejected', 'mapping rejects a missing role key');
select throws_ok($$select platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-extra-role'))$$, '22023', 'AC265 approved runner mapping request rejected', 'mapping rejects an extra role key');
select throws_ok($$select platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-missing-scenario'))$$, '22023', 'AC265 approved runner mapping request rejected', 'mapping rejects a missing scenario key');
select throws_ok($$select platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-extra-scenario'))$$, '22023', 'AC265 approved runner mapping request rejected', 'mapping rejects an extra scenario key');
select throws_ok($$select platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-duplicate-role-value'))$$, '22023', 'AC265 approved runner mapping request rejected', 'mapping rejects duplicate role resource values');
select throws_ok($$select platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-duplicate-scenario-value'))$$, '22023', 'AC265 approved runner mapping request rejected', 'mapping rejects duplicate scenario role values');
reset role;

-- Unknown and cross-authorization resources are indistinguishable conflicts.
set local role service_role;
select is(
  platform_api.ac265_approved_runner_mapping_register(
    jsonb_set((select request from ac265_cp02_requests where request_name = 'mapping-valid'), '{roleResourceBindings,owner_full,0}', to_jsonb('ac265-resource://organization/30000000-0000-4000-8000-000000000099'::text))
  ),
  '{"status":"conflict"}'::jsonb,
  'mapping rejects an unknown resource reference'
);
reset role;

select lives_ok(
  $$
  with fixture as (
    select
      jsonb_set(identity, '{sourceRevision}', to_jsonb(repeat('d', 40)))
        || jsonb_build_object(
          'deploymentId', '6428523621',
          'ciRunId', '34751474025',
          'stagingRunId', '34751910126',
          'hostingProjectId', 'wejammin-staging',
          'supabaseProjectRef', 'abcdefghijklmnopqrsu'
        ) as identity
    from platform_private.ac265_verified_candidates
    where candidate_id = '10000000-0000-4000-8000-000000000020'::uuid
  ),
  canonical as (
    select
      identity,
      '{"environment":' || pg_catalog.to_json(identity ->> 'environment')::text ||
      ',"ciRunId":' || pg_catalog.to_json(identity ->> 'ciRunId')::text ||
      ',"ciRunAttempt":' || (identity ->> 'ciRunAttempt')::integer::text ||
      ',"stagingRunId":' || pg_catalog.to_json(identity ->> 'stagingRunId')::text ||
      ',"stagingRunAttempt":' || (identity ->> 'stagingRunAttempt')::integer::text ||
      ',"sourceRevision":' || pg_catalog.to_json(identity ->> 'sourceRevision')::text ||
      ',"deploymentId":' || pg_catalog.to_json(identity ->> 'deploymentId')::text ||
      ',"deployedAt":' || pg_catalog.to_json(identity ->> 'deployedAt')::text ||
      ',"buildId":' || pg_catalog.to_json(identity ->> 'buildId')::text ||
      ',"buildManifestSha256":' || pg_catalog.to_json(identity ->> 'buildManifestSha256')::text ||
      ',"artifactSha256":' || pg_catalog.to_json(identity ->> 'artifactSha256')::text ||
      ',"hostingAccountId":' || pg_catalog.to_json(identity ->> 'hostingAccountId')::text ||
      ',"hostingProjectId":' || pg_catalog.to_json(identity ->> 'hostingProjectId')::text ||
      ',"supabaseProjectRef":' || pg_catalog.to_json(identity ->> 'supabaseProjectRef')::text ||
      ',"migrationVersion":' || pg_catalog.to_json(identity ->> 'migrationVersion')::text ||
      ',"migrationSha256":' || pg_catalog.to_json(identity ->> 'migrationSha256')::text ||
      ',"webOrigin":' || pg_catalog.to_json(identity ->> 'webOrigin')::text ||
      ',"apiOrigin":' || pg_catalog.to_json(identity ->> 'apiOrigin')::text ||
      ',"supabaseOrigin":' || pg_catalog.to_json(identity ->> 'supabaseOrigin')::text ||
      '}' as identity_canonical
    from fixture
  )
  insert into platform_private.ac265_verified_candidates (
    candidate_id, identity_sha256, source_revision, deployment_id,
    ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
    ci_artifact_id, staging_artifact_id, identity, provenance
  )
  select
    '10000000-0000-4000-8000-000000000021'::uuid,
    extensions.digest(convert_to(identity_canonical, 'UTF8'), 'sha256'),
    identity ->> 'sourceRevision', identity ->> 'deploymentId',
    identity ->> 'ciRunId', (identity ->> 'ciRunAttempt')::integer,
    identity ->> 'stagingRunId', (identity ->> 'stagingRunAttempt')::integer,
    8802, 9902,
    identity,
    '{}'::jsonb
  from canonical
  $$,
  'the disposable cross-binding candidate fixture loads'
);

select lives_ok(
  $$
  insert into platform_private.ac265_runner_authorizations (
    authorization_id, run_id, identity_sha256, source_revision, deployment_id,
    github_run_id, github_run_attempt, workflow_sha, jti_sha256,
    request_sha256, authorized_at, expires_at
  ) values (
    '20000000-0000-4000-8000-000000000021'::uuid,
    '10000000-0000-4000-8000-000000000021'::uuid,
    (select identity_sha256 from platform_private.ac265_verified_candidates where candidate_id = '10000000-0000-4000-8000-000000000021'::uuid), repeat('d', 40), '6428523621',
    '34796668521', 1, repeat('d', 40), decode(repeat('9', 64), 'hex'),
    decode(repeat('a', 64), 'hex'), clock_timestamp() - interval '10 seconds',
    clock_timestamp() + interval '4 minutes'
  )
  $$,
  'the disposable cross-binding authorization fixture loads'
);

select lives_ok(
  $$
  insert into platform_private.ac265_approved_safe_resources (
    resource_id, resource_ref, resource_sha256, resource_kind, locator_sha256,
    authorization_id, candidate_id, run_id, identity_sha256, environment,
    source_revision, deployment_id, hosting_project_id, supabase_project_ref,
    approved_at, idempotency_ref, request_sha256
  ) values (
    '30000000-0000-4000-8000-000000000021'::uuid,
    'ac265-resource://content_schema/30000000-0000-4000-8000-000000000021',
    extensions.digest(convert_to('ac265-resource://content_schema/30000000-0000-4000-8000-000000000021', 'utf8'), 'sha256'),
    'content_schema', decode(repeat('1', 64), 'hex'),
    '20000000-0000-4000-8000-000000000021'::uuid,
    '10000000-0000-4000-8000-000000000021'::uuid,
    '10000000-0000-4000-8000-000000000021'::uuid,
    (select identity_sha256 from platform_private.ac265_verified_candidates where candidate_id = '10000000-0000-4000-8000-000000000021'::uuid), 'staging', repeat('d', 40), '6428523621',
    'wejammin-staging', 'abcdefghijklmnopqrsu', clock_timestamp(),
    'ac265-idempotency://staging/60000000-0000-4000-8000-000000000021', decode(repeat('b', 64), 'hex')
  )
  $$,
  'the cross-binding resource fixture loads'
);

select throws_ok(
  $$
  insert into platform_private.ac265_approved_runner_mapping_resources (
    mapping_id, resource_id, role_key, ordinal
  )
  select
    (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1),
    '30000000-0000-4000-8000-000000000021'::uuid,
    'owner_full',
    99
  $$,
  '23503',
  'AC265 approved mapping resource authorization mismatch',
  'mapping resource insert fence rejects a cross-authorization child'
);

insert into ac265_cp02_requests(request_name, request)
select 'mapping-cross-binding', jsonb_set(
  request,
  '{roleResourceBindings,owner_full,0}',
  to_jsonb('ac265-resource://content_schema/30000000-0000-4000-8000-000000000021'::text)
)
from ac265_cp02_requests where request_name = 'mapping-valid';
set local role service_role;
select is(
  platform_api.ac265_approved_runner_mapping_register((select request from ac265_cp02_requests where request_name = 'mapping-cross-binding')),
  '{"status":"conflict"}'::jsonb,
  'mapping rejects a resource owned by another authorization'
);
reset role;

-- Insert fences reject rows that point at a nonexistent candidate without a
-- foreign key, preserving CP-01 candidate-registry truncate semantics.
select throws_ok(
  $$
  insert into platform_private.ac265_approved_safe_resources (
    resource_id, resource_ref, resource_sha256, resource_kind, locator_sha256,
    authorization_id, candidate_id, run_id, identity_sha256, environment,
    source_revision, deployment_id, hosting_project_id, supabase_project_ref,
    approved_at, idempotency_ref, request_sha256
  ) values (
    '30000000-0000-4000-8000-000000000099'::uuid,
    'ac265-resource://content_schema/30000000-0000-4000-8000-000000000099',
    extensions.digest(convert_to('ac265-resource://content_schema/30000000-0000-4000-8000-000000000099', 'utf8'), 'sha256'),
    'content_schema', decode(repeat('1', 64), 'hex'),
    '20000000-0000-4000-8000-000000000020'::uuid,
    '10000000-0000-4000-8000-000000000099'::uuid,
    '10000000-0000-4000-8000-000000000020'::uuid,
    decode(repeat('b', 64), 'hex'), 'staging', repeat('a', 40), '6428523620',
    'wejammin-staging', 'abcdefghijklmnopqrst', clock_timestamp(),
    'ac265-idempotency://staging/60000000-0000-0000-0000-000000000099', decode(repeat('b', 64), 'hex')
  )
  $$,
  '23503',
  'AC265 approved safe resource candidate does not exist',
  'safe resource insert requires an existing candidate'
);

-- Mapping read is authorization-bound and never discloses another mapping.
set local role service_role;
select is(
  platform_api.ac265_approved_runner_mapping_read(
    (select request || jsonb_build_object('authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000021') from ac265_cp02_requests where request_name = 'mapping-read')
  ),
  '{"status":"conflict"}'::jsonb,
  'mapping read rejects a cross-authorization binding'
);
select throws_ok(
  $$select platform_api.ac265_approved_runner_mapping_read((select request || jsonb_build_object('mappingId', 'not-a-uuid') from ac265_cp02_requests where request_name = 'mapping-read'))$$,
  '22023',
  'AC265 approved runner mapping read request rejected',
  'mapping read rejects an invalid mapping identifier'
);
reset role;

-- The parent insert fence independently binds its immutable identity and
-- deployment tuple to both the verified candidate and the authorization.
select throws_ok(
  $$
  insert into platform_private.ac265_approved_runner_mappings (
    mapping_id, authorization_id, candidate_id, run_id, identity_sha256,
    identity, environment, source_revision, deployment_id,
    hosting_project_id, supabase_project_ref, approved_at,
    idempotency_ref, request_sha256
  )
  select
    '70000000-0000-4000-8000-000000000099'::uuid,
    authorization_id,
    candidate_id,
    run_id,
    identity_sha256,
    identity || jsonb_build_object('buildId', 'tampered-build'),
    environment,
    source_revision,
    deployment_id,
    hosting_project_id,
    supabase_project_ref,
    clock_timestamp(),
    'ac265-idempotency://staging/70000000-0000-4000-8000-000000000099',
    decode(repeat('7', 64), 'hex')
  from platform_private.ac265_approved_runner_mappings
  limit 1
  $$,
  '23503',
  'AC265 approved runner mapping candidate binding is invalid',
  'mapping parent insert fence rejects candidate identity drift'
);

-- Parent and child tables are immutable insert-only registries.
select throws_ok($$update platform_private.ac265_approved_safe_resources set resource_kind = 'organization' where resource_id = (select resource_id from platform_private.ac265_approved_safe_resources limit 1)$$, '55000', 'AC265 approved safe resources are immutable', 'safe resources reject update');
select throws_ok($$delete from platform_private.ac265_approved_safe_resources where resource_id = (select resource_id from platform_private.ac265_approved_safe_resources limit 1)$$, '55000', 'AC265 approved safe resources are immutable', 'safe resources reject delete');
select throws_ok($$update platform_private.ac265_approved_runner_mappings set approved_at = clock_timestamp() where mapping_id = (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1)$$, '55000', 'AC265 approved runner mappings are immutable', 'mappings reject update');
select throws_ok($$delete from platform_private.ac265_approved_runner_mappings where mapping_id = (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1)$$, '55000', 'AC265 approved runner mappings are immutable', 'mappings reject delete');
select throws_ok($$update platform_private.ac265_approved_runner_mapping_resources set ordinal = 99 where mapping_id = (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1)$$, '55000', 'AC265 approved runner mapping resources are immutable', 'mapping resources reject update');
select throws_ok($$delete from platform_private.ac265_approved_runner_mapping_resources where mapping_id = (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1)$$, '55000', 'AC265 approved runner mapping resources are immutable', 'mapping resources reject delete');
select throws_ok($$update platform_private.ac265_approved_runner_mapping_scenarios set ordinal = 99 where mapping_id = (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1)$$, '55000', 'AC265 approved runner mapping scenarios are immutable', 'mapping scenarios reject update');
select throws_ok($$delete from platform_private.ac265_approved_runner_mapping_scenarios where mapping_id = (select mapping_id from platform_private.ac265_approved_runner_mappings limit 1)$$, '55000', 'AC265 approved runner mapping scenarios are immutable', 'mapping scenarios reject delete');

select * from finish();
rollback;
