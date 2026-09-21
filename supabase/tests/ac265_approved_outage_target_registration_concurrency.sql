-- AC265 CP-04b concurrency probe.
--
-- This test uses two independent dblink worker sessions and a third session
-- that explicitly owns the authorization-row lock.  The fixtures are committed
-- by the setup session because dblink workers cannot see rows held by this
-- test's outer transaction.  The policy and all target values are disposable
-- local fixtures only; no live policy, target, or hosted acceptance is claimed.
--
-- The wait assertion is based on pg_stat_activity/pg_locks, not a sleep or a
-- timing assumption.  Cleanup drops and restores only the immutable triggers
-- needed to remove these exact disposable fixture rows, including on error.

begin;

create extension if not exists dblink with schema extensions;
create extension if not exists pgtap with schema extensions;
select no_plan();

create temporary table ac265_cp04b_concurrency_results (
  case_name text primary key,
  result_a jsonb,
  result_b jsonb,
  target_count bigint not null,
  registration_count bigint not null,
  lock_wait_count bigint not null
) on commit drop;

do $probe$
declare
  candidate_id constant uuid := '81000000-0000-4000-8000-000000000001';
  same_authorization_id constant uuid := '82000000-0000-4000-8000-000000000001';
  distinct_authorization_id constant uuid := '82000000-0000-4000-8000-000000000002';
  same_run_id constant uuid := '83000000-0000-4000-8000-000000000001';
  distinct_run_id constant uuid := '83000000-0000-4000-8000-000000000002';
  same_authorization_ref constant text :=
    'ac265-authorization://staging/82000000-0000-4000-8000-000000000001';
  distinct_authorization_ref constant text :=
    'ac265-authorization://staging/82000000-0000-4000-8000-000000000002';
  same_idempotency_ref constant text :=
    'ac265-idempotency://staging/84000000-0000-4000-8000-000000000001';
  distinct_idempotency_ref_a constant text :=
    'ac265-idempotency://staging/84000000-0000-4000-8000-000000000002';
  distinct_idempotency_ref_b constant text :=
    'ac265-idempotency://staging/84000000-0000-4000-8000-000000000003';
  setup_connection constant text := 'ac265_cp04b_registration_setup';
  gate_connection constant text := 'ac265_cp04b_registration_gate';
  same_worker_a constant text := 'ac265_cp04b_registration_same_a';
  same_worker_b constant text := 'ac265_cp04b_registration_same_b';
  distinct_worker_a constant text := 'ac265_cp04b_registration_distinct_a';
  distinct_worker_b constant text := 'ac265_cp04b_registration_distinct_b';
  same_request constant jsonb := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
    'authorizationRef', same_authorization_ref,
    'policyRef', 'ac265-outage-policy://staging/v1',
    'idempotencyRef', same_idempotency_ref
  );
  distinct_request_a constant jsonb := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
    'authorizationRef', distinct_authorization_ref,
    'policyRef', 'ac265-outage-policy://staging/v1',
    'idempotencyRef', distinct_idempotency_ref_a
  );
  distinct_request_b constant jsonb := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-outage-target-registration-v1',
    'authorizationRef', distinct_authorization_ref,
    'policyRef', 'ac265-outage-policy://staging/v1',
    'idempotencyRef', distinct_idempotency_ref_b
  );
  connection_string constant text :=
    'host=db port=5432 dbname=postgres user=postgres password=postgres';
  cleanup_sql constant text := $cleanup$
    do $cleanup_body$
    declare
      trigger_row record;
    begin
      create temporary table if not exists ac265_cp04b_trigger_defs (
        relation_name text not null,
        trigger_name text not null,
        trigger_definition text not null
      ) on commit preserve rows;
      truncate ac265_cp04b_trigger_defs;

      insert into ac265_cp04b_trigger_defs (
        relation_name, trigger_name, trigger_definition
      )
      select format('%I.%I', namespace.nspname, relation.relname),
             trigger.tgname,
             pg_catalog.pg_get_triggerdef(trigger.oid)
      from pg_catalog.pg_trigger as trigger
      join pg_catalog.pg_class as relation on relation.oid = trigger.tgrelid
      join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
      where not trigger.tgisinternal
        and relation.oid in (
          to_regclass('platform_private.ac265_approved_outage_target_policies'),
          to_regclass('platform_private.ac265_approved_outage_target_registrations'),
          to_regclass('platform_private.ac265_approved_outage_targets'),
          to_regclass('platform_private.ac265_runner_authorizations'),
          to_regclass('platform_private.ac265_verified_candidates')
        );

      for trigger_row in
        select relation_name, trigger_name
        from ac265_cp04b_trigger_defs
      loop
        execute format(
          'drop trigger if exists %I on %s',
          trigger_row.trigger_name,
          trigger_row.relation_name
        );
      end loop;

      delete from platform_private.ac265_approved_outage_target_registrations
      where authorization_id in (
        '82000000-0000-4000-8000-000000000001'::uuid,
        '82000000-0000-4000-8000-000000000002'::uuid
      );
      delete from platform_private.ac265_approved_outage_targets
      where candidate_id = '81000000-0000-4000-8000-000000000001'::uuid
         or run_id in (
           '83000000-0000-4000-8000-000000000001'::uuid,
           '83000000-0000-4000-8000-000000000002'::uuid
         );
      delete from platform_private.ac265_approved_outage_target_policies
      where policy_ref = 'ac265-outage-policy://staging/v1';
      delete from platform_private.ac265_runner_authorization_jtis
      where authorization_id in (
        '82000000-0000-4000-8000-000000000001'::uuid,
        '82000000-0000-4000-8000-000000000002'::uuid
      );
      delete from platform_private.ac265_runner_authorizations
      where authorization_id in (
        '82000000-0000-4000-8000-000000000001'::uuid,
        '82000000-0000-4000-8000-000000000002'::uuid
      );
      delete from platform_private.ac265_verified_candidates
      where candidate_id = '81000000-0000-4000-8000-000000000001'::uuid;

      for trigger_row in
        select trigger_definition
        from ac265_cp04b_trigger_defs
        order by relation_name, trigger_name
      loop
        execute trigger_row.trigger_definition;
      end loop;
    end;
    $cleanup_body$;
  $cleanup$;
  fixtures_sql constant text := $fixtures$
    begin;
    insert into platform_private.ac265_verified_candidates (
      candidate_id, identity_sha256, source_revision, deployment_id,
      ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
      ci_artifact_id, staging_artifact_id, identity, provenance
    ) values (
      '81000000-0000-4000-8000-000000000001'::uuid,
      decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523690',
      '34751474090', 2, '34751910190', 1, 8890, 9990,
      jsonb_build_object(
        'environment', 'staging',
        'ciRunId', '34751474090',
        'ciRunAttempt', 2,
        'stagingRunId', '34751910190',
        'stagingRunAttempt', 1,
        'sourceRevision', repeat('a', 40),
        'deploymentId', '6428523690',
        'hostingProjectId', 'wejammin-staging',
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
        '82000000-0000-4000-8000-000000000001'::uuid,
        '83000000-0000-4000-8000-000000000001'::uuid,
        decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523690',
        '34796668590', 1, repeat('a', 40), decode(repeat('1', 64), 'hex'),
        decode(repeat('3', 64), 'hex'), clock_timestamp() - interval '10 seconds',
        clock_timestamp() + interval '4 minutes'
      ),
      (
        '82000000-0000-4000-8000-000000000002'::uuid,
        '83000000-0000-4000-8000-000000000002'::uuid,
        decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523690',
        '34796668591', 1, repeat('a', 40), decode(repeat('2', 64), 'hex'),
        decode(repeat('4', 64), 'hex'), clock_timestamp() - interval '10 seconds',
        clock_timestamp() + interval '4 minutes'
      );
    insert into platform_private.ac265_approved_outage_target_policies (
      policy_ref, environment, dependency_id, route_operation_id, route_method,
      route_path, target_validity_seconds, request_limit, approved_at, expires_at
    ) values (
      'ac265-outage-policy://staging/v1', 'staging', 'supabase-auth',
      'CMS-03A-06', 'GET', '/api/v1/cms/content-types', 120, 1,
      clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 day'
    );
    commit;
  $fixtures$;
  worker_sql text;
  ignored_rows bigint;
  poll integer;
  observed_pids integer[];
  lock_wait_pids integer[];
  locked_authorization_id uuid;
  same_result_a jsonb;
  same_result_b jsonb;
  distinct_result_a jsonb;
  distinct_result_b jsonb;
  target_count bigint;
  registration_count bigint;
  same_lock_wait_count bigint;
  distinct_lock_wait_count bigint;
begin
  -- Recover from a prior interrupted run before installing this run's fixtures.
  begin perform extensions.dblink_disconnect(distinct_worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(distinct_worker_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_worker_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;

  perform extensions.dblink_connect(setup_connection, connection_string);
  perform extensions.dblink_exec(setup_connection, cleanup_sql);
  perform extensions.dblink_exec(setup_connection, fixtures_sql);
  perform extensions.dblink_connect(gate_connection, connection_string);

  -- Case 1: identical requests must return the same immutable envelope.
  perform extensions.dblink_exec(gate_connection, 'begin');
  select remote_authorization
    into locked_authorization_id
  from extensions.dblink(
    gate_connection,
    format(
      'select authorization_id from platform_private.ac265_runner_authorizations where authorization_id = %L::uuid for update',
      same_authorization_id
    )
  ) as row(remote_authorization uuid);
  if locked_authorization_id is distinct from same_authorization_id then
    raise exception 'AC265 CP-04b identical-request authorization row was not locked';
  end if;

  perform extensions.dblink_connect(same_worker_a, connection_string);
  perform extensions.dblink_connect(same_worker_b, connection_string);
  perform extensions.dblink_exec(same_worker_a, 'set application_name = ''ac265_cp04b_registration_same_a''');
  perform extensions.dblink_exec(same_worker_b, 'set application_name = ''ac265_cp04b_registration_same_b''');
  perform extensions.dblink_exec(same_worker_a, 'set role service_role');
  perform extensions.dblink_exec(same_worker_b, 'set role service_role');
  perform extensions.dblink_exec(
    same_worker_a,
    'create temporary table ac265_cp04b_worker_result (result jsonb) on commit preserve rows'
  );
  perform extensions.dblink_exec(
    same_worker_b,
    'create temporary table ac265_cp04b_worker_result (result jsonb) on commit preserve rows'
  );
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04b_worker_result(result)
      values (platform_api.ac265_approved_outage_target_register(%L::jsonb));
    end;
    $body$;
  $worker$, same_request::text);
  perform extensions.dblink_send_query(same_worker_a, worker_sql);
  perform extensions.dblink_send_query(same_worker_b, worker_sql);

  poll := 0;
  loop
    poll := poll + 1;
    select active_pids, waiting_pids
      into observed_pids, lock_wait_pids
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
          'ac265_cp04b_registration_same_a',
          'ac265_cp04b_registration_same_b'
        )
      $observe$
    ) as row(active_pids integer[], waiting_pids integer[]);
    exit when cardinality(observed_pids) = 2
      and cardinality(lock_wait_pids) = 2
      and observed_pids = lock_wait_pids;
    if poll >= 2000 then
      raise exception
        'AC265 CP-04b identical-request workers did not both wait on the authorization row (observed %, waiting %)',
        observed_pids,
        lock_wait_pids;
    end if;
  end loop;
  same_lock_wait_count := cardinality(lock_wait_pids);
  perform extensions.dblink_exec(gate_connection, 'commit');
  while extensions.dblink_is_busy(same_worker_a) <> 0 loop
    poll := poll + 1;
    if poll >= 100000 then
      raise exception 'AC265 CP-04b identical-request worker A did not finish';
    end if;
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(same_worker_a, false) as result(value text);
  end loop;
  while extensions.dblink_is_busy(same_worker_b) <> 0 loop
    poll := poll + 1;
    if poll >= 100000 then
      raise exception 'AC265 CP-04b identical-request worker B did not finish';
    end if;
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(same_worker_b, false) as result(value text);
  end loop;
  select result into same_result_a
  from extensions.dblink(same_worker_a, 'select result from pg_temp.ac265_cp04b_worker_result')
    as row(result jsonb);
  select result into same_result_b
  from extensions.dblink(same_worker_b, 'select result from pg_temp.ac265_cp04b_worker_result')
    as row(result jsonb);
  select total into target_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*)::bigint from platform_private.ac265_approved_outage_targets where run_id = %L::uuid',
      same_run_id
    )
  ) as row(total bigint);
  select total into registration_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*)::bigint from platform_private.ac265_approved_outage_target_registrations where authorization_id = %L::uuid',
      same_authorization_id
    )
  ) as row(total bigint);
  insert into ac265_cp04b_concurrency_results
    (case_name, result_a, result_b, target_count, registration_count, lock_wait_count)
  values (
    'identical-requests', same_result_a, same_result_b, target_count,
    registration_count, same_lock_wait_count
  );
  perform extensions.dblink_disconnect(same_worker_b);
  perform extensions.dblink_disconnect(same_worker_a);

  -- Case 2: distinct idempotency references have one winner and one sentinel.
  perform extensions.dblink_exec(gate_connection, 'begin');
  select remote_authorization
    into locked_authorization_id
  from extensions.dblink(
    gate_connection,
    format(
      'select authorization_id from platform_private.ac265_runner_authorizations where authorization_id = %L::uuid for update',
      distinct_authorization_id
    )
  ) as row(remote_authorization uuid);
  if locked_authorization_id is distinct from distinct_authorization_id then
    raise exception 'AC265 CP-04b distinct-request authorization row was not locked';
  end if;

  perform extensions.dblink_connect(distinct_worker_a, connection_string);
  perform extensions.dblink_connect(distinct_worker_b, connection_string);
  perform extensions.dblink_exec(distinct_worker_a, 'set application_name = ''ac265_cp04b_registration_distinct_a''');
  perform extensions.dblink_exec(distinct_worker_b, 'set application_name = ''ac265_cp04b_registration_distinct_b''');
  perform extensions.dblink_exec(distinct_worker_a, 'set role service_role');
  perform extensions.dblink_exec(distinct_worker_b, 'set role service_role');
  perform extensions.dblink_exec(
    distinct_worker_a,
    'create temporary table ac265_cp04b_worker_result (result jsonb) on commit preserve rows'
  );
  perform extensions.dblink_exec(
    distinct_worker_b,
    'create temporary table ac265_cp04b_worker_result (result jsonb) on commit preserve rows'
  );
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04b_worker_result(result)
      values (platform_api.ac265_approved_outage_target_register(%L::jsonb));
    end;
    $body$;
  $worker$, distinct_request_a::text);
  perform extensions.dblink_send_query(distinct_worker_a, worker_sql);
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04b_worker_result(result)
      values (platform_api.ac265_approved_outage_target_register(%L::jsonb));
    end;
    $body$;
  $worker$, distinct_request_b::text);
  perform extensions.dblink_send_query(distinct_worker_b, worker_sql);

  poll := 0;
  loop
    poll := poll + 1;
    select active_pids, waiting_pids
      into observed_pids, lock_wait_pids
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
          'ac265_cp04b_registration_distinct_a',
          'ac265_cp04b_registration_distinct_b'
        )
      $observe$
    ) as row(active_pids integer[], waiting_pids integer[]);
    exit when cardinality(observed_pids) = 2
      and cardinality(lock_wait_pids) = 2
      and observed_pids = lock_wait_pids;
    if poll >= 2000 then
      raise exception
        'AC265 CP-04b distinct-request workers did not both wait on the authorization row (observed %, waiting %)',
        observed_pids,
        lock_wait_pids;
    end if;
  end loop;
  distinct_lock_wait_count := cardinality(lock_wait_pids);
  perform extensions.dblink_exec(gate_connection, 'commit');
  while extensions.dblink_is_busy(distinct_worker_a) <> 0 loop
    poll := poll + 1;
    if poll >= 100000 then
      raise exception 'AC265 CP-04b distinct-request worker A did not finish';
    end if;
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(distinct_worker_a, false) as result(value text);
  end loop;
  while extensions.dblink_is_busy(distinct_worker_b) <> 0 loop
    poll := poll + 1;
    if poll >= 100000 then
      raise exception 'AC265 CP-04b distinct-request worker B did not finish';
    end if;
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(distinct_worker_b, false) as result(value text);
  end loop;
  select result into distinct_result_a
  from extensions.dblink(distinct_worker_a, 'select result from pg_temp.ac265_cp04b_worker_result')
    as row(result jsonb);
  select result into distinct_result_b
  from extensions.dblink(distinct_worker_b, 'select result from pg_temp.ac265_cp04b_worker_result')
    as row(result jsonb);
  select total into target_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*)::bigint from platform_private.ac265_approved_outage_targets where run_id = %L::uuid',
      distinct_run_id
    )
  ) as row(total bigint);
  select total into registration_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*)::bigint from platform_private.ac265_approved_outage_target_registrations where authorization_id = %L::uuid',
      distinct_authorization_id
    )
  ) as row(total bigint);
  insert into ac265_cp04b_concurrency_results
    (case_name, result_a, result_b, target_count, registration_count, lock_wait_count)
  values (
    'distinct-idempotency-requests', distinct_result_a, distinct_result_b,
    target_count, registration_count, distinct_lock_wait_count
  );
  perform extensions.dblink_disconnect(distinct_worker_b);
  perform extensions.dblink_disconnect(distinct_worker_a);
  perform extensions.dblink_disconnect(gate_connection);
  perform extensions.dblink_exec(setup_connection, cleanup_sql);
  perform extensions.dblink_disconnect(setup_connection);
exception
  when others then
    -- Release the explicit row lock first so blocked workers can unwind.
    begin perform extensions.dblink_exec(gate_connection, 'rollback'); exception when others then null; end;
    begin perform extensions.dblink_cancel_query(distinct_worker_b); exception when others then null; end;
    begin perform extensions.dblink_cancel_query(distinct_worker_a); exception when others then null; end;
    begin perform extensions.dblink_cancel_query(same_worker_b); exception when others then null; end;
    begin perform extensions.dblink_cancel_query(same_worker_a); exception when others then null; end;
    begin perform extensions.dblink_disconnect(distinct_worker_b); exception when others then null; end;
    begin perform extensions.dblink_disconnect(distinct_worker_a); exception when others then null; end;
    begin perform extensions.dblink_disconnect(same_worker_b); exception when others then null; end;
    begin perform extensions.dblink_disconnect(same_worker_a); exception when others then null; end;
    begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
    begin perform extensions.dblink_exec(setup_connection, cleanup_sql); exception when others then null; end;
    begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
    raise;
end;
$probe$;

select ok(
  result_a = result_b
    and result_a ->> 'status' = 'registered'
    and target_count = 1
    and registration_count = 1
    and lock_wait_count = 2,
  'concurrent identical registration requests return one identical envelope and one target plus sidecar'
)
from ac265_cp04b_concurrency_results
where case_name = 'identical-requests';

select ok(
  (
    (result_a ->> 'status' = 'registered' and result_b = '{"status":"conflict"}'::jsonb)
    or (result_b ->> 'status' = 'registered' and result_a = '{"status":"conflict"}'::jsonb)
  )
    and target_count = 1
    and registration_count = 1
    and lock_wait_count = 2,
  'concurrent distinct idempotency requests return one registered winner and one generic conflict with one target plus sidecar'
)
from ac265_cp04b_concurrency_results
where case_name = 'distinct-idempotency-requests';

select finish();
rollback;
