begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- AC265 CP-02 owner-approved population gate.
--
-- The migration that owns this boundary creates three EMPTY pinned policy
-- tables and redefines the two CP-02 register RPCs to require an exact match
-- against those pins.  With no pinned rows both RPCs fail closed with only
-- the generic conflict sentinel; with disposable pinned rows they accept
-- exactly the pinned approvals and reject drift in either direction.
-- Disposable rows here are local-test-only; the migration seeds none.

select ok(
  coalesce((
    select count(*) = 3 and bool_and(relrowsecurity and relforcerowsecurity)
    from pg_catalog.pg_class
    where oid in (
      to_regclass('platform_private.ac265_approved_registry_resources'),
      to_regclass('platform_private.ac265_approved_registry_role_kinds'),
      to_regclass('platform_private.ac265_approved_registry_scenario_roles')
    )
  ), false),
  'all three CP-02 pinned policy tables exist with enabled, forced RLS'
);

select ok(
  coalesce((
    select bool_and(not coalesce(has_table_privilege(role_name, to_regclass(table_name), privilege_name), false))
    from (values ('public'::name), ('anon'::name), ('authenticated'::name), ('service_role'::name)) as roles(role_name)
    cross join (values
      ('platform_private.ac265_approved_registry_resources'::text),
      ('platform_private.ac265_approved_registry_role_kinds'::text),
      ('platform_private.ac265_approved_registry_scenario_roles'::text)
    ) as tables(table_name)
    cross join (values ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text), ('DELETE'::text), ('TRUNCATE'::text), ('REFERENCES'::text), ('TRIGGER'::text)) as privileges(privilege_name)
  ), false),
  'all CP-02 pinned policy tables have no direct grants, including service_role'
);

select ok(
  coalesce((
    select count(*) = 0
    from pg_catalog.pg_proc as p
    where p.proname = 'ac265_reject_approved_registry_policy_mutation'
      and not (
        coalesce(has_function_privilege('public', p.oid, 'execute'), false)
        or coalesce(has_function_privilege('anon', p.oid, 'execute'), false)
        or coalesce(has_function_privilege('authenticated', p.oid, 'execute'), false)
        or coalesce(has_function_privilege('service_role', p.oid, 'execute'), false)
      )
  ), false),
  'the pinned-policy mutation guard is not executable by any runtime role'
);

select ok(
  coalesce((
    select bool_and(coalesce(has_function_privilege('service_role', proc, 'execute'), false)
        and not coalesce(has_function_privilege('public', proc, 'execute'), true)
        and not coalesce(has_function_privilege('anon', proc, 'execute'), true)
        and not coalesce(has_function_privilege('authenticated', proc, 'execute'), true))
    from (values
      (to_regprocedure('platform_api.ac265_approved_safe_resource_register(jsonb)')),
      (to_regprocedure('platform_api.ac265_approved_runner_mapping_register(jsonb)'))
    ) as functions(proc)
  ), false),
  'the redefined register RPCs remain service_role-only'
);

create temporary table ac265_gate_results (result_name text primary key, result jsonb) on commit drop;
create temporary table ac265_gate_requests (request_name text primary key, request jsonb not null) on commit drop;
grant select, insert on ac265_gate_results, ac265_gate_requests to service_role;

-- Disposable candidate and authorization fixtures model the immutable CP-01
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

insert into ac265_gate_requests(request_name, request)
select 'resource-content-schema', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000070',
  'resourceKind', 'content_schema',
  'locatorSha256', repeat('1', 64)
);
insert into ac265_gate_requests(request_name, request)
select 'resource-staff-case', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000071',
  'resourceKind', 'staff_case',
  'locatorSha256', repeat('2', 64)
);
insert into ac265_gate_requests(request_name, request)
select 'resource-organization', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000072',
  'resourceKind', 'organization',
  'locatorSha256', repeat('3', 64)
);
insert into ac265_gate_requests(request_name, request)
select 'resource-prerequisite', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000073',
  'resourceKind', 'prerequisite',
  'locatorSha256', repeat('4', 64)
);

-- No pins yet: the safe-resource RPC fails closed without writing a row.
set local role service_role;
select is(
  platform_api.ac265_approved_safe_resource_register((select request from ac265_gate_requests where request_name = 'resource-content-schema')),
  '{"status":"conflict"}'::jsonb,
  'an unpinned safe resource fails closed with only the conflict sentinel'
);
reset role;
select is(
  (select count(*)::integer from platform_private.ac265_approved_safe_resources),
  0,
  'a fail-closed safe-resource registration writes no row'
);

-- Seed the disposable owner-approved pins (local-test-only).
insert into platform_private.ac265_approved_registry_resources (resource_kind, locator_sha256, approval_ref, environment) values
  ('content_schema', decode(repeat('1', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000001', 'staging'),
  ('staff_case', decode(repeat('2', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000002', 'staging'),
  ('organization', decode(repeat('3', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000003', 'staging'),
  ('prerequisite', decode(repeat('4', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000004', 'staging');

insert into platform_private.ac265_approved_registry_role_kinds (role_key, resource_kind, approval_ref, environment) values
  ('entitled_read', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000010', 'staging'),
  ('owner_full', 'organization', 'ac265-approval://staging/90000000-0000-4000-8000-000000000011', 'staging'),
  ('guardian_mandate', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000012', 'staging'),
  ('junior_restricted', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000013', 'staging'),
  ('business_mandate', 'organization', 'ac265-approval://staging/90000000-0000-4000-8000-000000000014', 'staging'),
  ('staff_case_scoped', 'staff_case', 'ac265-approval://staging/90000000-0000-4000-8000-000000000015', 'staging'),
  ('admin_step_up', 'organization', 'ac265-approval://staging/90000000-0000-4000-8000-000000000016', 'staging'),
  ('forbidden_hidden', 'content_schema', 'ac265-approval://staging/90000000-0000-4000-8000-000000000017', 'staging'),
  ('disabled_prerequisite', 'prerequisite', 'ac265-approval://staging/90000000-0000-4000-8000-000000000018', 'staging');

insert into platform_private.ac265_approved_registry_scenario_roles (scenario_key, role_key, approval_ref, environment)
select scenario_key, role_key, 'ac265-approval://staging/90000000-0000-4000-8000-000000000020', 'staging'
from unnest(array['idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions', 'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab', 'auth_expiry', 'rate_limit_429', 'dependency_outage']) as scenarios(scenario_key)
cross join unnest(array['entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite']) as roles(role_key);

-- Pins are immutable insert-only approval evidence.
select throws_ok($$update platform_private.ac265_approved_registry_resources set environment = 'staging' where resource_kind = 'content_schema'$$, '55000', 'AC265 approved registry policies are immutable', 'pinned resources reject update');
select throws_ok($$delete from platform_private.ac265_approved_registry_role_kinds$$, '55000', 'AC265 approved registry policies are immutable', 'pinned role-kind assignments reject delete');
select throws_ok($$truncate platform_private.ac265_approved_registry_scenario_roles$$, '55000', 'AC265 approved registry policies are immutable', 'pinned scenario-role assignments reject truncate');

-- A safe resource matching a pinned (kind, locator) registers.
set local role service_role;
select lives_ok($$
  insert into ac265_gate_results(result_name, result)
  select 'resource-content-schema', platform_api.ac265_approved_safe_resource_register(request)
  from ac265_gate_requests where request_name = 'resource-content-schema'
$$, 'a safe resource exactly matching the pinned kind and locator registers');
reset role;
select ok(
  (select (result -> 'resource') ->> 'kind' = 'content_schema' and result ->> 'locatorSha256' = repeat('1', 64)
   from ac265_gate_results where result_name = 'resource-content-schema'),
  'the registered resource echoes the pinned kind and locator digest'
);

-- A valid kind with a non-pinned locator fails closed.
select is(
  platform_api.ac265_approved_safe_resource_register(
    jsonb_set((select request from ac265_gate_requests where request_name = 'resource-staff-case'), '{locatorSha256}', to_jsonb(repeat('9', 64)::text))
  ),
  '{"status":"conflict"}'::jsonb,
  'a valid kind with a non-pinned locator fails closed'
);

-- Register the remaining pinned kinds.
set local role service_role;
select lives_ok($$
  insert into ac265_gate_results(result_name, result)
  select request_name, platform_api.ac265_approved_safe_resource_register(request)
  from ac265_gate_requests
  where request_name in ('resource-staff-case', 'resource-organization', 'resource-prerequisite')
$$, 'the remaining pinned safe resources register');
reset role;
select is(
  (select count(*)::integer from platform_private.ac265_approved_safe_resources),
  4,
  'exactly four pinned safe resources exist after registration'
);

-- A mapping exactly equal to the pins registers.
insert into ac265_gate_requests(request_name, request)
select 'mapping-valid', jsonb_build_object(
  'criterion', 'P2-S09-AC-265',
  'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
  'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000020',
  'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000071',
  'roleResourceBindings', jsonb_build_object(
    'entitled_read', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-content-schema')),
    'owner_full', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-organization')),
    'guardian_mandate', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-content-schema')),
    'junior_restricted', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-content-schema')),
    'business_mandate', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-organization')),
    'staff_case_scoped', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-staff-case')),
    'admin_step_up', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-organization')),
    'forbidden_hidden', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-content-schema')),
    'disabled_prerequisite', jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-prerequisite'))
  ),
  'scenarioRoleBindings', (
    select jsonb_object_agg(scenario_key, to_jsonb(array['entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite']))
    from unnest(array['idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions', 'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab', 'auth_expiry', 'rate_limit_429', 'dependency_outage']) as scenarios(scenario_key)
  )
);
set local role service_role;
select lives_ok($$
  insert into ac265_gate_results(result_name, result)
  select 'mapping-valid', platform_api.ac265_approved_runner_mapping_register(request)
  from ac265_gate_requests where request_name = 'mapping-valid'
$$, 'a mapping exactly matching the pinned approvals registers');
reset role;
select ok(
  (select result ? 'mapping' and jsonb_array_length(result -> 'resources') = 4
   from ac265_gate_results where result_name = 'mapping-valid'),
  'the approved mapping returns the redacted four-resource envelope'
);

-- Drift is rejected by the policy gate itself, not by idempotent replay, so
-- each drift case uses a fresh idempotency reference.
-- A role bound to the wrong pinned kind is rejected.
set local role service_role;
select is(
  platform_api.ac265_approved_runner_mapping_register(
    jsonb_set(
      jsonb_set(
        (select request from ac265_gate_requests where request_name = 'mapping-valid'),
        '{idempotencyRef}',
        to_jsonb('ac265-idempotency://staging/50000000-0000-4000-8000-000000000081'::text)
      ),
      '{roleResourceBindings,entitled_read}',
      jsonb_build_array((select result #>> '{resource,ref}' from ac265_gate_results where result_name = 'resource-organization'))
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'a role bound to the wrong pinned resource kind fails closed'
);
reset role;
-- A scenario missing a pinned role member is rejected.
select is(
  platform_api.ac265_approved_runner_mapping_register(
    jsonb_set(
      jsonb_set(
        (select request from ac265_gate_requests where request_name = 'mapping-valid'),
        '{idempotencyRef}',
        to_jsonb('ac265-idempotency://staging/50000000-0000-4000-8000-000000000082'::text)
      ),
      '{scenarioRoleBindings,zoom_200}',
      (select (request #> '{scenarioRoleBindings,zoom_200}') - 8 from ac265_gate_requests where request_name = 'mapping-valid')
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'a scenario missing a pinned role member fails closed'
);
-- CP-02 permits exactly one mapping per (authorization, run), so order
-- independence is not separately re-registered here; set equality is proven
-- bidirectionally by the accepted exact mapping above and the two rejections.
select is(
  (select count(*)::integer from platform_private.ac265_approved_runner_mappings),
  1,
  'only the exact pinned mapping creates an immutable parent'
);
select * from finish();
rollback;

