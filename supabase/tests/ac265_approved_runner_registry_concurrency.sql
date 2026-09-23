-- AC265 CP-02 concurrency probe.
--
-- The workers are independent dblink sessions.  A third session owns each
-- advisory gate, so both worker queries are dispatched before either can
-- enter the operation.  No timing assumption or fixed sleep is used.
-- Fixtures are committed by the setup session because dblink workers cannot
-- observe rows held by this test's outer transaction.

begin;

create extension if not exists dblink with schema extensions;
create extension if not exists pgtap with schema extensions;
select no_plan();

create temporary table ac265_cp02_concurrency_results (
  case_name text primary key,
  result_a jsonb,
  result_b jsonb,
  resource_count bigint not null default 0,
  lock_wait_count bigint not null default 0,
  mapping_count bigint not null default 0,
  resource_child_count bigint not null default 0,
  scenario_child_count bigint not null default 0,
  reader_result jsonb
) on commit drop;

do $probe$
declare
  candidate_a constant uuid := '10000000-0000-4000-8000-000000000030';
  candidate_b constant uuid := '10000000-0000-4000-8000-000000000031';
  candidate_c constant uuid := '10000000-0000-4000-8000-000000000032';
  authorization_a constant uuid := '20000000-0000-4000-8000-000000000030';
  authorization_b constant uuid := '20000000-0000-4000-8000-000000000031';
  authorization_c constant uuid := '20000000-0000-4000-8000-000000000032';
  run_a constant uuid := '10000000-0000-4000-8000-000000000030';
  run_b constant uuid := '10000000-0000-4000-8000-000000000031';
  run_c constant uuid := '10000000-0000-4000-8000-000000000032';
  authorization_ref_a constant text := 'ac265-authorization://staging/20000000-0000-4000-8000-000000000030';
  authorization_ref_b constant text := 'ac265-authorization://staging/20000000-0000-4000-8000-000000000031';
  authorization_ref_c constant text := 'ac265-authorization://staging/20000000-0000-4000-8000-000000000032';
  setup_connection constant text := 'ac265_cp02_concurrency_setup';
  gate_connection constant text := 'ac265_cp02_concurrency_gate';
  same_resource_a constant text := 'ac265_cp02_same_resource_a';
  same_resource_b constant text := 'ac265_cp02_same_resource_b';
  different_resource_a constant text := 'ac265_cp02_different_resource_a';
  different_resource_b constant text := 'ac265_cp02_different_resource_b';
  same_mapping_a constant text := 'ac265_cp02_same_mapping_a';
  same_mapping_b constant text := 'ac265_cp02_same_mapping_b';
  different_mapping_a constant text := 'ac265_cp02_different_mapping_a';
  different_mapping_b constant text := 'ac265_cp02_different_mapping_b';
  mapping_writer constant text := 'ac265_cp02_mapping_writer';
  mapping_reader constant text := 'ac265_cp02_mapping_reader';
  different_resource_gate constant bigint := 265092002;
  same_mapping_gate constant bigint := 265092003;
  different_mapping_gate constant bigint := 265092004;
  read_mapping_gate constant bigint := 265092005;
  same_resource_request jsonb;
  different_resource_request_a jsonb;
  different_resource_request_b jsonb;
  resource_seed_request jsonb;
  mapping_request_a jsonb;
  mapping_request_b jsonb;
  mapping_request_b_conflict jsonb;
  mapping_request_c jsonb;
  role_bindings_a jsonb;
  role_bindings_b jsonb;
  role_bindings_c jsonb;
  scenario_bindings jsonb;
  role_keys constant text[] := array[
    'entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted',
    'business_mandate', 'staff_case_scoped', 'admin_step_up',
    'forbidden_hidden', 'disabled_prerequisite'
  ];
  scenario_keys constant text[] := array[
    'idp_sign_in', 'server_authoritative_rls',
    'keyboard_landmarks_live_regions', 'three_breakpoints', 'zoom_200',
    'offline_reconnect', 'stale_multi_tab', 'auth_expiry', 'rate_limit_429',
    'dependency_outage'
  ];
  same_resource_result_a jsonb;
  same_resource_result_b jsonb;
  different_resource_result_a jsonb;
  different_resource_result_b jsonb;
  same_mapping_result_a jsonb;
  same_mapping_result_b jsonb;
  different_mapping_result_a jsonb;
  different_mapping_result_b jsonb;
  reader_result jsonb;
  resource_ref_a_content text;
  resource_ref_a_staff text;
  resource_ref_a_organization text;
  resource_ref_a_prerequisite text;
  resource_ref_b_content text;
  resource_ref_b_staff text;
  resource_ref_b_organization text;
  resource_ref_b_prerequisite text;
  resource_ref_c_content text;
  resource_ref_c_staff text;
  resource_ref_c_organization text;
  resource_ref_c_prerequisite text;
  worker_sql text;
  cleanup_sql constant text := $cleanup_sql$
  do $cleanup_body$
declare
  trigger_row record;
begin
  create temporary table if not exists ac265_cp02_trigger_defs (
    relation_name text not null,
    trigger_name text not null,
    trigger_definition text not null
  ) on commit preserve rows;
  truncate ac265_cp02_trigger_defs;

  insert into ac265_cp02_trigger_defs (relation_name, trigger_name, trigger_definition)
  select format('%I.%I', namespace.nspname, relation.relname),
         trigger.tgname,
         pg_catalog.pg_get_triggerdef(trigger.oid)
  from pg_catalog.pg_trigger as trigger
  join pg_catalog.pg_class as relation on relation.oid = trigger.tgrelid
  join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
  where not trigger.tgisinternal
    and relation.oid in (
      to_regclass('platform_private.ac265_approved_safe_resources'),
      to_regclass('platform_private.ac265_approved_runner_mappings'),
      to_regclass('platform_private.ac265_approved_runner_mapping_resources'),
      to_regclass('platform_private.ac265_approved_runner_mapping_scenarios'),
      to_regclass('platform_private.ac265_runner_authorizations'),
      to_regclass('platform_private.ac265_verified_candidates')
    );

  for trigger_row in
    select relation_name, trigger_name, trigger_definition
    from ac265_cp02_trigger_defs
  loop
    execute format(
      'drop trigger if exists %I on %s',
      trigger_row.trigger_name,
      trigger_row.relation_name
    );
  end loop;

  delete from platform_private.ac265_approved_runner_mapping_scenarios
  where mapping_id in (
    select mapping_id
    from platform_private.ac265_approved_runner_mappings
    where authorization_id in (
      '20000000-0000-4000-8000-000000000030'::uuid,
      '20000000-0000-4000-8000-000000000031'::uuid,
      '20000000-0000-4000-8000-000000000032'::uuid
    )
  );
  delete from platform_private.ac265_approved_runner_mapping_resources
  where mapping_id in (
    select mapping_id
    from platform_private.ac265_approved_runner_mappings
    where authorization_id in (
      '20000000-0000-4000-8000-000000000030'::uuid,
      '20000000-0000-4000-8000-000000000031'::uuid,
      '20000000-0000-4000-8000-000000000032'::uuid
    )
  );
  delete from platform_private.ac265_approved_runner_mappings
  where authorization_id in (
    '20000000-0000-4000-8000-000000000030'::uuid,
    '20000000-0000-4000-8000-000000000031'::uuid,
    '20000000-0000-4000-8000-000000000032'::uuid
  );
  delete from platform_private.ac265_approved_safe_resources
  where authorization_id in (
    '20000000-0000-4000-8000-000000000030'::uuid,
    '20000000-0000-4000-8000-000000000031'::uuid,
    '20000000-0000-4000-8000-000000000032'::uuid
  );
  delete from platform_private.ac265_runner_authorization_jtis
  where authorization_id in (
    '20000000-0000-4000-8000-000000000030'::uuid,
    '20000000-0000-4000-8000-000000000031'::uuid,
    '20000000-0000-4000-8000-000000000032'::uuid
  );
  delete from platform_private.ac265_runner_authorizations
  where authorization_id in (
    '20000000-0000-4000-8000-000000000030'::uuid,
    '20000000-0000-4000-8000-000000000031'::uuid,
    '20000000-0000-4000-8000-000000000032'::uuid
  );
  delete from platform_private.ac265_verified_candidates
  where candidate_id in (
    '10000000-0000-4000-8000-000000000030'::uuid,
    '10000000-0000-4000-8000-000000000031'::uuid,
    '10000000-0000-4000-8000-000000000032'::uuid
  );

  for trigger_row in
    select trigger_definition
    from ac265_cp02_trigger_defs
  loop
    execute trigger_row.trigger_definition;
  end loop;
end;
$cleanup_body$;
$cleanup_sql$;
  ignored_rows bigint;
  poll integer;
  observed_mapping_count bigint;
  observed_resource_child_count bigint;
  observed_scenario_child_count bigint;
  same_resource_worker_pids integer[];
  same_resource_lock_wait_pids integer[];
  locked_authorization_id uuid;
begin
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_resource_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_resource_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_resource_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_resource_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_mapping_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_mapping_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_mapping_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_mapping_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(mapping_writer); exception when others then null; end;
  begin perform extensions.dblink_disconnect(mapping_reader); exception when others then null; end;

  perform extensions.dblink_connect(
    setup_connection,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_exec(setup_connection, cleanup_sql);
  perform extensions.dblink_exec(setup_connection, $fixtures$
    insert into platform_private.ac265_verified_candidates (
      candidate_id, identity_sha256, source_revision, deployment_id,
      ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
      ci_artifact_id, staging_artifact_id, identity, provenance
    )
    select fixture.candidate_id,
           decode(fixture.identity_hex, 'hex'),
           fixture.source_revision,
           fixture.deployment_id,
           fixture.ci_run_id,
           2,
           fixture.staging_run_id,
           1,
           fixture.ci_artifact_id,
           fixture.staging_artifact_id,
           jsonb_build_object(
             'environment', 'staging',
             'ciRunId', fixture.ci_run_id,
             'ciRunAttempt', 2,
             'stagingRunId', fixture.staging_run_id,
             'stagingRunAttempt', 1,
             'sourceRevision', fixture.source_revision,
             'deploymentId', fixture.deployment_id,
             'deployedAt', '2026-09-21T03:01:00.000Z',
             'buildId', 'build-' || fixture.ci_run_id,
             'buildManifestSha256', repeat('c', 64),
             'artifactSha256', repeat('d', 64),
             'hostingAccountId', repeat('e', 32),
             'hostingProjectId', 'wejammin-staging',
             'supabaseProjectRef', fixture.supabase_project_ref,
             'migrationVersion', '20260921010000',
             'migrationSha256', repeat('f', 64),
             'webOrigin', 'https://staging.wejamm.in',
             'apiOrigin', 'https://wejammin-api-staging.wejammin.workers.dev',
             'supabaseOrigin', 'https://' || fixture.supabase_project_ref || '.supabase.co'
           ),
           '{}'::jsonb
    from (
      values
        ('10000000-0000-4000-8000-000000000030'::uuid, repeat('b', 64), repeat('a', 40), '6428523630', '34751474030', '34751910130', 8830, 9930, 'abcdefghijklmnopqrst'),
        ('10000000-0000-4000-8000-000000000031'::uuid, repeat('c', 64), repeat('d', 40), '6428523631', '34751474031', '34751910131', 8831, 9931, 'abcdefghijklmnopqrsu'),
        ('10000000-0000-4000-8000-000000000032'::uuid, repeat('e', 64), repeat('f', 40), '6428523632', '34751474032', '34751910132', 8832, 9932, 'abcdefghijklmnopqrsv')
    ) as fixture(candidate_id, identity_hex, source_revision, deployment_id, ci_run_id, staging_run_id, ci_artifact_id, staging_artifact_id, supabase_project_ref)
  $fixtures$);
  perform extensions.dblink_exec(setup_connection, $authorizations$
    insert into platform_private.ac265_runner_authorizations (
      authorization_id, run_id, identity_sha256, source_revision,
      deployment_id, github_run_id, github_run_attempt, workflow_sha,
      jti_sha256, request_sha256, authorized_at, expires_at
    )
    select fixture.authorization_id,
           fixture.run_id,
           decode(fixture.identity_hex, 'hex'),
           fixture.source_revision,
           fixture.deployment_id,
           fixture.github_run_id,
           1,
           fixture.workflow_sha,
           decode(fixture.jti_hex, 'hex'),
           decode(fixture.request_hex, 'hex'),
           clock_timestamp() - interval '10 seconds',
           clock_timestamp() + interval '4 minutes'
    from (
      values
        ('20000000-0000-4000-8000-000000000030'::uuid, '10000000-0000-4000-8000-000000000030'::uuid, repeat('b', 64), repeat('a', 40), '6428523630', '34796668530', repeat('a', 40), repeat('1', 64), repeat('2', 64)),
        ('20000000-0000-4000-8000-000000000031'::uuid, '10000000-0000-4000-8000-000000000031'::uuid, repeat('c', 64), repeat('d', 40), '6428523631', '34796668531', repeat('d', 40), repeat('3', 64), repeat('4', 64)),
        ('20000000-0000-4000-8000-000000000032'::uuid, '10000000-0000-4000-8000-000000000032'::uuid, repeat('e', 64), repeat('f', 40), '6428523632', '34796668532', repeat('f', 40), repeat('5', 64), repeat('6', 64))
    ) as fixture(authorization_id, run_id, identity_hex, source_revision, deployment_id, github_run_id, workflow_sha, jti_hex, request_hex)
 $authorizations$);

 perform extensions.dblink_connect(
   gate_connection,
   'host=db port=5432 dbname=postgres user=postgres password=postgres'
 );

  -- AC265 CP-02 owner-approved population pins (disposable, local-test-only).
  -- The population-gate migration seeds no rows; these exact pins let the
  -- register RPCs accept the disposable fixtures used by this suite.  The pin
  -- tables deliberately grant nothing to service_role, so fixtures are loaded
  -- as the superuser connection exactly like the CP-01 candidate/authorization
  -- rows above, never through a runtime role.
  perform extensions.dblink_exec(setup_connection, $pins_resources$
    insert into platform_private.ac265_approved_registry_resources
      (resource_kind, locator_sha256, approval_ref, environment)
    values
      ('content_schema', decode(repeat('1', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000001', 'staging'),
      ('staff_case', decode(repeat('2', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000002', 'staging'),
      ('organization', decode(repeat('3', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000003', 'staging'),
      ('prerequisite', decode(repeat('4', 64), 'hex'), 'ac265-approval://staging/90000000-0000-4000-8000-000000000004', 'staging')
  $pins_resources$);
  perform extensions.dblink_exec(setup_connection, $pins_roles$
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
      ('disabled_prerequisite', 'prerequisite', 'ac265-approval://staging/90000000-0000-4000-8000-000000000018', 'staging')
  $pins_roles$);
  perform extensions.dblink_exec(setup_connection, $pins_scenarios$
    insert into platform_private.ac265_approved_registry_scenario_roles
      (scenario_key, role_key, approval_ref, environment)
    select scenario_key, role_key, 'ac265-approval://staging/90000000-0000-4000-8000-000000000020', 'staging'
    from unnest(array['idp_sign_in', 'server_authoritative_rls', 'keyboard_landmarks_live_regions', 'three_breakpoints', 'zoom_200', 'offline_reconnect', 'stale_multi_tab', 'auth_expiry', 'rate_limit_429', 'dependency_outage']) as scenarios(scenario_key)
    cross join unnest(array['entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted', 'business_mandate', 'staff_case_scoped', 'admin_step_up', 'forbidden_hidden', 'disabled_prerequisite']) as roles(role_key)
  $pins_scenarios$);

  -- Case 1: the same safe-resource request is dispatched twice.
  same_resource_request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', authorization_ref_a,
    'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000030',
    'resourceKind', 'content_schema',
    'locatorSha256', repeat('1', 64)
  );
  perform extensions.dblink_exec(gate_connection, 'begin');
  select remote_authorization into locked_authorization_id
  from extensions.dblink(
    gate_connection,
    format(
      'select authorization_id from platform_private.ac265_runner_authorizations where authorization_id = %L::uuid for update',
      authorization_a
    )
  ) as row(remote_authorization uuid);
  if locked_authorization_id is distinct from authorization_a then
    raise exception 'AC265 CP-02 concurrency fixture authorization row was not locked';
  end if;
  perform extensions.dblink_connect(same_resource_a, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_connect(same_resource_b, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_exec(same_resource_a, 'set application_name = ''ac265_cp02_same_resource_a''');
  perform extensions.dblink_exec(same_resource_b, 'set application_name = ''ac265_cp02_same_resource_b''');
  perform extensions.dblink_exec(same_resource_a, 'set role service_role');
  perform extensions.dblink_exec(same_resource_b, 'set role service_role');
  perform extensions.dblink_exec(same_resource_a, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(same_resource_b, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_safe_resource_register(%L::jsonb));
    end;
    $body$;
  $worker$, same_resource_request::text);
  perform extensions.dblink_send_query(same_resource_a, worker_sql);
  perform extensions.dblink_send_query(same_resource_b, worker_sql);
  poll := 0;
  loop
    poll := poll + 1;
    select observed_pids, lock_wait_pids
      into same_resource_worker_pids, same_resource_lock_wait_pids
    from extensions.dblink(
      gate_connection,
      $observe$
        select
          coalesce(
            array_agg(activity.pid order by activity.pid)
              filter (where activity.state = 'active'),
            '{}'::integer[]
          ),
          coalesce(
            array_agg(activity.pid order by activity.pid)
              filter (
                where activity.state = 'active'
                  and activity.wait_event_type = 'Lock'
                  and cardinality(pg_catalog.pg_blocking_pids(activity.pid)) > 0
                  and exists (
                    select 1
                    from pg_catalog.pg_locks as wait_lock
                    where wait_lock.pid = activity.pid
                      and not wait_lock.granted
                      and wait_lock.locktype in ('transactionid', 'tuple')
                  )
              ),
            '{}'::integer[]
          )
        from pg_catalog.pg_stat_activity as activity
        where activity.application_name in (
          'ac265_cp02_same_resource_a',
          'ac265_cp02_same_resource_b'
        )
      $observe$
    ) as row(observed_pids integer[], lock_wait_pids integer[]);
    exit when cardinality(same_resource_worker_pids) = 2
      and cardinality(same_resource_lock_wait_pids) = 2
      and same_resource_worker_pids = same_resource_lock_wait_pids;
    if poll >= 1000 then
      raise exception
        'AC265 CP-02 concurrency workers did not both reach the authorization row lock (observed %, waiting %)',
        same_resource_worker_pids,
        same_resource_lock_wait_pids;
    end if;
  end loop;
  perform extensions.dblink_exec(gate_connection, 'commit');
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(same_resource_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(same_resource_b, false) as result(value text);
  end loop;
  select result into same_resource_result_a from extensions.dblink(same_resource_a, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select result into same_resource_result_b from extensions.dblink(same_resource_b, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  insert into ac265_cp02_concurrency_results(case_name, result_a, result_b, resource_count, lock_wait_count)
  values (
    'identical-safe-resource',
    same_resource_result_a,
    same_resource_result_b,
    (select total from extensions.dblink(
      setup_connection,
      format('select count(*) from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_a, 'content_schema')
    ) as row(total bigint)),
    cardinality(same_resource_lock_wait_pids)
  );
  perform extensions.dblink_disconnect(same_resource_b);
  perform extensions.dblink_disconnect(same_resource_a);

  -- Case 2: the same authorization/kind with different idempotency keys has
  -- one winner and one conflict, never two resource rows.
  different_resource_request_a := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', authorization_ref_a,
    'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000031',
    'resourceKind', 'staff_case',
    'locatorSha256', repeat('2', 64)
  );
  different_resource_request_b := jsonb_set(
    different_resource_request_a,
    '{idempotencyRef}',
    to_jsonb('ac265-idempotency://staging/40000000-0000-4000-8000-000000000032'::text)
  );
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', different_resource_gate));
  perform extensions.dblink_connect(different_resource_a, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_connect(different_resource_b, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_exec(different_resource_a, 'set role service_role');
  perform extensions.dblink_exec(different_resource_b, 'set role service_role');
  perform extensions.dblink_exec(different_resource_a, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(different_resource_b, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_safe_resource_register(%L::jsonb));
    end;
    $body$;
  $worker$, different_resource_gate, different_resource_request_a::text);
  perform extensions.dblink_send_query(different_resource_a, worker_sql);
  worker_sql := format($worker$
    do $body$
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_safe_resource_register(%L::jsonb));
    end;
    $body$;
  $worker$, different_resource_gate, different_resource_request_b::text);
  perform extensions.dblink_send_query(different_resource_b, worker_sql);
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', different_resource_gate));
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(different_resource_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(different_resource_b, false) as result(value text);
  end loop;
  select result into different_resource_result_a from extensions.dblink(different_resource_a, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select result into different_resource_result_b from extensions.dblink(different_resource_b, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  insert into ac265_cp02_concurrency_results(case_name, result_a, result_b, resource_count)
  values (
    'different-idempotency-safe-resource',
    different_resource_result_a,
    different_resource_result_b,
    (select total from extensions.dblink(
      setup_connection,
      format('select count(*) from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_a, 'staff_case')
    ) as row(total bigint))
  );
  perform extensions.dblink_disconnect(different_resource_b);
  perform extensions.dblink_disconnect(different_resource_a);

  -- Seed the remaining resources through the protected RPC, retaining only
  -- opaque refs in this test.  No raw locator/content/credential is stored.
  perform extensions.dblink_exec(setup_connection, 'set role service_role');
  perform extensions.dblink_exec(setup_connection, 'create temporary table ac265_cp02_seed_results (result_name text primary key, result jsonb) on commit preserve rows');
  for resource_seed_request in
    select jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
      'authorizationRef', seed.authorization_ref,
      'idempotencyRef', seed.idempotency_ref,
      'resourceKind', seed.resource_kind,
      'locatorSha256', seed.locator_sha256
    )
    from (
      values
        (authorization_ref_a, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000033', 'organization', repeat('3', 64)),
        (authorization_ref_a, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000034', 'prerequisite', repeat('4', 64)),
        (authorization_ref_b, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000035', 'content_schema', repeat('1', 64)),
        (authorization_ref_b, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000036', 'staff_case', repeat('2', 64)),
        (authorization_ref_b, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000037', 'organization', repeat('3', 64)),
        (authorization_ref_b, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000038', 'prerequisite', repeat('4', 64)),
        (authorization_ref_c, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000039', 'content_schema', repeat('1', 64)),
        (authorization_ref_c, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000040', 'staff_case', repeat('2', 64)),
        (authorization_ref_c, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000041', 'organization', repeat('3', 64)),
        (authorization_ref_c, 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000042', 'prerequisite', repeat('4', 64))
    ) as seed(authorization_ref, idempotency_ref, resource_kind, locator_sha256)
  loop
    perform extensions.dblink_exec(
      setup_connection,
      format(
        'insert into pg_temp.ac265_cp02_seed_results(result_name, result) values (%L, platform_api.ac265_approved_safe_resource_register(%L::jsonb))',
        resource_seed_request ->> 'idempotencyRef',
        resource_seed_request::text
      )
    );
  end loop;
  perform extensions.dblink_exec(setup_connection, 'reset role');
  select remote_resource_ref into resource_ref_a_content
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_a, 'content_schema')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_a_staff
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_a, 'staff_case')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_a_organization
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_a, 'organization')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_a_prerequisite
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_a, 'prerequisite')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_b_content
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_b, 'content_schema')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_b_staff
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_b, 'staff_case')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_b_organization
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_b, 'organization')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_b_prerequisite
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_b, 'prerequisite')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_c_content
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_c, 'content_schema')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_c_staff
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_c, 'staff_case')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_c_organization
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_c, 'organization')
  ) as row(remote_resource_ref text);
  select remote_resource_ref into resource_ref_c_prerequisite
  from extensions.dblink(
    setup_connection,
    format('select resource_ref from platform_private.ac265_approved_safe_resources where authorization_id = %L::uuid and resource_kind = %L', authorization_c, 'prerequisite')
  ) as row(remote_resource_ref text);
  perform extensions.dblink_exec(setup_connection, 'reset role');

  select jsonb_object_agg(role_key, jsonb_build_array(
    case role_key
      when 'owner_full' then resource_ref_a_organization
      when 'business_mandate' then resource_ref_a_organization
      when 'staff_case_scoped' then resource_ref_a_staff
      when 'admin_step_up' then resource_ref_a_organization
      when 'disabled_prerequisite' then resource_ref_a_prerequisite
      else resource_ref_a_content
    end
  )) into role_bindings_a from unnest(role_keys) as roles(role_key);
  select jsonb_object_agg(role_key, jsonb_build_array(
    case role_key
      when 'owner_full' then resource_ref_b_organization
      when 'business_mandate' then resource_ref_b_organization
      when 'staff_case_scoped' then resource_ref_b_staff
      when 'admin_step_up' then resource_ref_b_organization
      when 'disabled_prerequisite' then resource_ref_b_prerequisite
      else resource_ref_b_content
    end
  )) into role_bindings_b from unnest(role_keys) as roles(role_key);
  select jsonb_object_agg(role_key, jsonb_build_array(
    case role_key
      when 'owner_full' then resource_ref_c_organization
      when 'business_mandate' then resource_ref_c_organization
      when 'staff_case_scoped' then resource_ref_c_staff
      when 'admin_step_up' then resource_ref_c_organization
      when 'disabled_prerequisite' then resource_ref_c_prerequisite
      else resource_ref_c_content
    end
  )) into role_bindings_c from unnest(role_keys) as roles(role_key);
  select jsonb_object_agg(scenario_key, to_jsonb(role_keys)) into scenario_bindings
  from unnest(scenario_keys) as scenarios(scenario_key);

  mapping_request_a := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', authorization_ref_a,
    'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000030',
    'roleResourceBindings', role_bindings_a,
    'scenarioRoleBindings', scenario_bindings
  );
  mapping_request_b := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', authorization_ref_b,
    'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000031',
    'roleResourceBindings', role_bindings_b,
    'scenarioRoleBindings', scenario_bindings
  );
  mapping_request_b_conflict := jsonb_set(
    mapping_request_b,
    '{idempotencyRef}',
    to_jsonb('ac265-idempotency://staging/50000000-0000-4000-8000-000000000032'::text)
  );
  mapping_request_c := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
    'authorizationRef', authorization_ref_c,
    'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000033',
    'roleResourceBindings', role_bindings_c,
    'scenarioRoleBindings', scenario_bindings
  );

  -- Case 3: identical mapping requests return one immutable result and a
  -- complete nine-role/ten-scenario child set.
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', same_mapping_gate));
  perform extensions.dblink_connect(same_mapping_a, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_connect(same_mapping_b, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_exec(same_mapping_a, 'set role service_role');
  perform extensions.dblink_exec(same_mapping_b, 'set role service_role');
  perform extensions.dblink_exec(same_mapping_a, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(same_mapping_b, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_runner_mapping_register(%L::jsonb));
    end;
    $body$;
  $worker$, same_mapping_gate, mapping_request_a::text);
  perform extensions.dblink_send_query(same_mapping_a, worker_sql);
  perform extensions.dblink_send_query(same_mapping_b, worker_sql);
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', same_mapping_gate));
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(same_mapping_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(same_mapping_b, false) as result(value text);
  end loop;
  select result into same_mapping_result_a from extensions.dblink(same_mapping_a, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select result into same_mapping_result_b from extensions.dblink(same_mapping_b, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select mapping_total, resource_total, scenario_total
    into observed_mapping_count, observed_resource_child_count, observed_scenario_child_count
  from extensions.dblink(
    setup_connection,
    format($counts$
      select
        (select count(*) from platform_private.ac265_approved_runner_mappings where authorization_id = %L::uuid),
        (select count(*)
         from platform_private.ac265_approved_runner_mapping_resources as child
         where child.mapping_id in (
           select mapping.mapping_id
           from platform_private.ac265_approved_runner_mappings as mapping
           where mapping.authorization_id = %L::uuid
         )),
        (select count(*)
         from platform_private.ac265_approved_runner_mapping_scenarios as child
         where child.mapping_id in (
           select mapping.mapping_id
           from platform_private.ac265_approved_runner_mappings as mapping
           where mapping.authorization_id = %L::uuid
         ))
    $counts$, authorization_a, authorization_a, authorization_a)
  ) as row(mapping_total bigint, resource_total bigint, scenario_total bigint);
  insert into ac265_cp02_concurrency_results(case_name, result_a, result_b, mapping_count, resource_child_count, scenario_child_count)
  values (
    'identical-runner-mapping',
    same_mapping_result_a,
    same_mapping_result_b,
    observed_mapping_count,
    observed_resource_child_count,
    observed_scenario_child_count
  );
  perform extensions.dblink_disconnect(same_mapping_b);
  perform extensions.dblink_disconnect(same_mapping_a);

  -- Case 4: distinct mapping idempotency keys for one run serialize to one
  -- parent and one complete child set, with no orphaned rows.
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', different_mapping_gate));
  perform extensions.dblink_connect(different_mapping_a, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_connect(different_mapping_b, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_exec(different_mapping_a, 'set role service_role');
  perform extensions.dblink_exec(different_mapping_b, 'set role service_role');
  perform extensions.dblink_exec(different_mapping_a, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(different_mapping_b, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_runner_mapping_register(%L::jsonb));
    end;
    $body$;
  $worker$, different_mapping_gate, mapping_request_b::text);
  perform extensions.dblink_send_query(different_mapping_a, worker_sql);
  worker_sql := format($worker$
    do $body$
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_runner_mapping_register(%L::jsonb));
    end;
    $body$;
  $worker$, different_mapping_gate, mapping_request_b_conflict::text);
  perform extensions.dblink_send_query(different_mapping_b, worker_sql);
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', different_mapping_gate));
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(different_mapping_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(different_mapping_b, false) as result(value text);
  end loop;
  select result into different_mapping_result_a from extensions.dblink(different_mapping_a, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select result into different_mapping_result_b from extensions.dblink(different_mapping_b, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select mapping_total, resource_total, scenario_total
    into observed_mapping_count, observed_resource_child_count, observed_scenario_child_count
  from extensions.dblink(
    setup_connection,
    format($counts$
      select
        (select count(*) from platform_private.ac265_approved_runner_mappings where authorization_id = %L::uuid),
        (select count(*)
         from platform_private.ac265_approved_runner_mapping_resources as child
         where child.mapping_id in (
           select mapping.mapping_id
           from platform_private.ac265_approved_runner_mappings as mapping
           where mapping.authorization_id = %L::uuid
         )),
        (select count(*)
         from platform_private.ac265_approved_runner_mapping_scenarios as child
         where child.mapping_id in (
           select mapping.mapping_id
           from platform_private.ac265_approved_runner_mappings as mapping
           where mapping.authorization_id = %L::uuid
         ))
    $counts$, authorization_b, authorization_b, authorization_b)
  ) as row(mapping_total bigint, resource_total bigint, scenario_total bigint);
  insert into ac265_cp02_concurrency_results(case_name, result_a, result_b, mapping_count, resource_child_count, scenario_child_count)
  values (
    'different-idempotency-runner-mapping',
    different_mapping_result_a,
    different_mapping_result_b,
    observed_mapping_count,
    observed_resource_child_count,
    observed_scenario_child_count
  );
  perform extensions.dblink_disconnect(different_mapping_b);
  perform extensions.dblink_disconnect(different_mapping_a);

  -- Case 5: the reader starts under the same advisory gate as registration.
  -- It can see no mapping yet, or the committed complete mapping, but never a
  -- parent with only a subset of its role/scenario children.
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', read_mapping_gate));
  perform extensions.dblink_connect(mapping_writer, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_connect(mapping_reader, 'host=db port=5432 dbname=postgres user=postgres password=postgres');
  perform extensions.dblink_exec(mapping_writer, 'set role service_role');
  perform extensions.dblink_exec(mapping_writer, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(mapping_reader, 'create temporary table ac265_cp02_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      insert into pg_temp.ac265_cp02_worker_result(result)
      values (platform_api.ac265_approved_runner_mapping_register(%L::jsonb));
    end;
    $body$;
  $worker$, read_mapping_gate, mapping_request_c::text);
  perform extensions.dblink_send_query(mapping_writer, worker_sql);
  worker_sql := format($worker$
    do $body$
    declare
      observed_mapping_id text;
      observed_result jsonb;
    begin
      perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
      select mapping_id::text into observed_mapping_id
      from platform_private.ac265_approved_runner_mappings
      where authorization_id = %L::uuid
      order by mapping_id
      limit 1;
      if observed_mapping_id is null then
        observed_result := '{"status":"conflict"}'::jsonb;
      else
        execute 'set local role service_role';
        observed_result := platform_api.ac265_approved_runner_mapping_read(
          jsonb_build_object(
            'criterion', 'P2-S09-AC-265',
            'schemaVersion', 'ac265-hosted-approved-registry-control-v1',
            'authorizationRef', %L,
            'mappingId', observed_mapping_id
          )
        );
        execute 'reset role';
      end if;
      insert into pg_temp.ac265_cp02_worker_result(result) values (observed_result);
    end;
    $body$;
  $worker$, read_mapping_gate, authorization_c, authorization_ref_c);
  perform extensions.dblink_send_query(mapping_reader, worker_sql);
  perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', read_mapping_gate));
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(mapping_writer, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(mapping_reader, false) as result(value text);
  end loop;
  select result into reader_result from extensions.dblink(mapping_reader, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb);
  select mapping_total, resource_total, scenario_total
    into observed_mapping_count, observed_resource_child_count, observed_scenario_child_count
  from extensions.dblink(
    setup_connection,
    format($counts$
      select
        (select count(*) from platform_private.ac265_approved_runner_mappings where authorization_id = %L::uuid),
        (select count(*)
         from platform_private.ac265_approved_runner_mapping_resources as child
         where child.mapping_id in (
           select mapping.mapping_id
           from platform_private.ac265_approved_runner_mappings as mapping
           where mapping.authorization_id = %L::uuid
         )),
        (select count(*)
         from platform_private.ac265_approved_runner_mapping_scenarios as child
         where child.mapping_id in (
           select mapping.mapping_id
           from platform_private.ac265_approved_runner_mappings as mapping
           where mapping.authorization_id = %L::uuid
         ))
    $counts$, authorization_c, authorization_c, authorization_c)
  ) as row(mapping_total bigint, resource_total bigint, scenario_total bigint);
  insert into ac265_cp02_concurrency_results(case_name, result_a, result_b, mapping_count, resource_child_count, scenario_child_count, reader_result)
  values (
    'read-during-mapping-registration',
    (select result from extensions.dblink(mapping_writer, 'select result from pg_temp.ac265_cp02_worker_result') as row(result jsonb)),
    null,
    observed_mapping_count,
    observed_resource_child_count,
    observed_scenario_child_count,
    reader_result
  );
  perform extensions.dblink_disconnect(mapping_reader);
  perform extensions.dblink_disconnect(mapping_writer);
  perform extensions.dblink_disconnect(gate_connection);
  perform extensions.dblink_exec(setup_connection, cleanup_sql);
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  begin perform extensions.dblink_cancel_query(same_resource_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(same_resource_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(different_resource_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(different_resource_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(same_mapping_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(same_mapping_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(different_mapping_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(different_mapping_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(mapping_writer); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(mapping_reader); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, 'rollback'); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', different_resource_gate)); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', same_mapping_gate)); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', different_mapping_gate)); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', read_mapping_gate)); exception when others then null; end;
  begin perform extensions.dblink_disconnect(mapping_reader); exception when others then null; end;
  begin perform extensions.dblink_disconnect(mapping_writer); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_mapping_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_mapping_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_mapping_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_mapping_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_resource_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_resource_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_resource_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_resource_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, 'reset role'); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, cleanup_sql); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$probe$;

select ok(
   (select result_a = result_b
      and result_a ->> 'status' is distinct from 'conflict'
      and resource_count = 1
      and lock_wait_count = 2
   from ac265_cp02_concurrency_results
   where case_name = 'identical-safe-resource'),
  'concurrent identical safe-resource registrations return one identical result and one row'
);

select ok(
  (select ((result_a = '{"status":"conflict"}'::jsonb and result_b ->> 'status' is distinct from 'conflict')
        or (result_b = '{"status":"conflict"}'::jsonb and result_a ->> 'status' is distinct from 'conflict'))
      and resource_count = 1
   from ac265_cp02_concurrency_results
   where case_name = 'different-idempotency-safe-resource'),
  'concurrent same-authentication same-kind resource registrations serialize to one winner and one conflict'
);

select ok(
  (select result_a = result_b
      and result_a ->> 'status' is distinct from 'conflict'
      and mapping_count = 1
      and resource_child_count = 9
      and scenario_child_count = 90
   from ac265_cp02_concurrency_results
   where case_name = 'identical-runner-mapping'),
  'concurrent identical mapping registrations return one identical mapping and complete child sets'
);

select ok(
  (select ((result_a = '{"status":"conflict"}'::jsonb and result_b ->> 'status' is distinct from 'conflict')
        or (result_b = '{"status":"conflict"}'::jsonb and result_a ->> 'status' is distinct from 'conflict'))
      and mapping_count = 1
      and resource_child_count = 9
      and scenario_child_count = 90
   from ac265_cp02_concurrency_results
   where case_name = 'different-idempotency-runner-mapping'),
  'concurrent distinct-idempotency mappings for one run produce one conflict and no orphan or partial children'
);

select ok(
  (select mapping_count = 1
      and resource_child_count = 9
      and scenario_child_count = 90
      and (
        reader_result = '{"status":"conflict"}'::jsonb
        or (
          jsonb_array_length(coalesce(reader_result -> 'resources', reader_result #> '{mapping,resources}', '[]'::jsonb)) = 4
          and (select count(*) from jsonb_object_keys(coalesce(reader_result -> 'roleResourceBindings', reader_result #> '{mapping,roleResourceBindings}', '{}'::jsonb))) = 9
          and (select count(*) from jsonb_object_keys(coalesce(reader_result -> 'scenarioRoleBindings', reader_result #> '{mapping,scenarioRoleBindings}', '{}'::jsonb))) = 10
        )
      )
   from ac265_cp02_concurrency_results
   where case_name = 'read-during-mapping-registration'),
  'a concurrent read sees either no mapping or the complete mapping, never a partial child set'
);

select finish();
rollback;
