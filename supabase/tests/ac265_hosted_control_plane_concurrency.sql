-- AC265 CP-01 concurrency probe.
--
-- This is intentionally a separate, two-connection test.  Each worker waits
-- on a PostgreSQL advisory gate before entering the RPC, so the two calls are
-- dispatched before either worker can pass the gate.  No timing assumption or
-- fixed sleep is used.  The disposable fixtures are committed by a dedicated
-- setup connection because the dblink workers cannot observe an outer test
-- transaction's uncommitted rows.

begin;

create extension if not exists dblink with schema extensions;
create extension if not exists pgtap with schema extensions;
select no_plan();

create temporary table ac265_cp01_concurrency_results (
  case_name text primary key,
  result_a jsonb,
  result_b jsonb,
  lease_count bigint not null,
  active_count bigint not null,
  consumed_count bigint not null,
  released_count bigint not null,
  partial_count bigint not null
) on commit drop;

do $probe$
declare
  candidate_id constant uuid := '10000000-0000-4000-8000-000000000100';
  same_authorization_id constant uuid := '20000000-0000-4000-8000-000000000101';
  different_authorization_id constant uuid := '20000000-0000-4000-8000-000000000102';
  transition_authorization_id constant uuid := '20000000-0000-4000-8000-000000000103';
  same_run_id constant uuid := '10000000-0000-4000-8000-000000000101';
  different_run_id constant uuid := '10000000-0000-4000-8000-000000000102';
  transition_run_id constant uuid := '10000000-0000-4000-8000-000000000103';
  same_target_id constant uuid := '30000000-0000-4000-8000-000000000301';
  different_target_id constant uuid := '30000000-0000-4000-8000-000000000302';
  transition_target_id constant uuid := '30000000-0000-4000-8000-000000000303';
  source_revision constant text := repeat('c', 40);
  deployment_id constant text := 'ac265-cp01-concurrency';
  hosting_project_id constant text := 'wejammin-staging';
  supabase_project_ref constant text := 'abcdefghijklmnopqrst';
  setup_connection constant text := 'ac265_cp01_setup';
  gate_connection constant text := 'ac265_cp01_gate';
  same_a constant text := 'ac265_cp01_same_a';
  same_b constant text := 'ac265_cp01_same_b';
  different_a constant text := 'ac265_cp01_different_a';
  different_b constant text := 'ac265_cp01_different_b';
  transition_a constant text := 'ac265_cp01_transition_a';
  transition_b constant text := 'ac265_cp01_transition_b';
  same_gate constant bigint := 265091001;
  different_gate constant bigint := 265091002;
  transition_gate constant bigint := 265091003;
  same_request jsonb;
  different_request_a jsonb;
  different_request_b jsonb;
  transition_acquire_request jsonb;
  transition_consume_request jsonb;
  transition_release_request jsonb;
  worker_sql text;
  cleanup_sql constant text := $cleanup$
do $body$
begin
  delete from platform_private.ac265_hosted_outage_leases
  where authorization_id in (
    '20000000-0000-4000-8000-000000000101'::uuid,
    '20000000-0000-4000-8000-000000000102'::uuid,
    '20000000-0000-4000-8000-000000000103'::uuid
  )
  or target_id in (
    '30000000-0000-4000-8000-000000000301'::uuid,
    '30000000-0000-4000-8000-000000000302'::uuid,
    '30000000-0000-4000-8000-000000000303'::uuid
  );

  execute 'drop trigger if exists ac265_approved_outage_targets_are_immutable on platform_private.ac265_approved_outage_targets';
  delete from platform_private.ac265_approved_outage_targets
  where target_id in (
    '30000000-0000-4000-8000-000000000301'::uuid,
    '30000000-0000-4000-8000-000000000302'::uuid,
    '30000000-0000-4000-8000-000000000303'::uuid
  );
  execute 'create trigger ac265_approved_outage_targets_are_immutable before update or delete or truncate on platform_private.ac265_approved_outage_targets for each statement execute function platform_private.ac265_reject_approved_outage_target_mutation()';

  delete from platform_private.ac265_runner_authorizations
  where authorization_id in (
    '20000000-0000-4000-8000-000000000101'::uuid,
    '20000000-0000-4000-8000-000000000102'::uuid,
    '20000000-0000-4000-8000-000000000103'::uuid
  );

  execute 'drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates';
  delete from platform_private.ac265_verified_candidates
  where candidate_id = '10000000-0000-4000-8000-000000000100'::uuid;
  execute 'create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation()';
end;
$body$;
$cleanup$;
  same_result_a jsonb;
  same_result_b jsonb;
  different_result_a jsonb;
  different_result_b jsonb;
  transition_seed_result jsonb;
  transition_result_a jsonb;
  transition_result_b jsonb;
  transition_lease_ref text;
  transition_lease_sha256 text;
  ignored_rows bigint;
  same_lease_count bigint;
  same_active_count bigint;
  different_lease_count bigint;
  different_active_count bigint;
  transition_lease_count bigint;
  transition_active_count bigint;
  transition_consumed_count bigint;
  transition_released_count bigint;
  transition_partial_count bigint;
  poll integer;
begin
  -- A rerun after an interrupted local test starts from a clean fixture set.
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  perform extensions.dblink_connect(
    setup_connection,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_exec(setup_connection, cleanup_sql);
  perform extensions.dblink_exec(setup_connection, 'begin');
  perform extensions.dblink_exec(
    setup_connection,
    format($candidate$
      insert into platform_private.ac265_verified_candidates (
        candidate_id, identity_sha256, source_revision, deployment_id,
        ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
        ci_artifact_id, staging_artifact_id, identity, provenance
      ) values (
        %L::uuid, decode(repeat('a1', 32), 'hex'), %L, %L,
        '999100', 1, '999101', 1, 99101, 99102,
        jsonb_build_object(
          'environment', 'staging',
          'sourceRevision', %L,
          'deploymentId', %L,
          'ciRunId', '999100',
          'ciRunAttempt', 1,
          'stagingRunId', '999101',
          'stagingRunAttempt', 1,
          'hostingProjectId', %L,
          'supabaseProjectRef', %L
        ),
        '{}'::jsonb
      )
    $candidate$,
      candidate_id, source_revision, deployment_id, source_revision,
      deployment_id, hosting_project_id, supabase_project_ref
    )
  );
  perform extensions.dblink_exec(
    setup_connection,
    format($authorizations$
      insert into platform_private.ac265_runner_authorizations (
        authorization_id, run_id, identity_sha256, source_revision,
        deployment_id, github_run_id, github_run_attempt, workflow_sha,
        jti_sha256, request_sha256, authorized_at, expires_at
      ) values
        (%L::uuid, %L::uuid, decode(repeat('a1', 32), 'hex'), %L, %L,
         '999101', 1, %L, decode(repeat('b1', 32), 'hex'),
         decode(repeat('c1', 32), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes'),
        (%L::uuid, %L::uuid, decode(repeat('a1', 32), 'hex'), %L, %L,
         '999102', 1, %L, decode(repeat('b2', 32), 'hex'),
         decode(repeat('c2', 32), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes'),
        (%L::uuid, %L::uuid, decode(repeat('a1', 32), 'hex'), %L, %L,
         '999103', 1, %L, decode(repeat('b3', 32), 'hex'),
         decode(repeat('c3', 32), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes')
    $authorizations$,
      same_authorization_id, same_run_id, source_revision, deployment_id, source_revision,
      different_authorization_id, different_run_id, source_revision, deployment_id, source_revision,
      transition_authorization_id, transition_run_id, source_revision, deployment_id, source_revision
    )
  );
  perform extensions.dblink_exec(
    setup_connection,
    format($targets$
      insert into platform_private.ac265_approved_outage_targets (
        target_id, target_ref, target_sha256, candidate_id, run_id,
        identity_sha256, environment, source_revision, hosting_project_id,
        supabase_project_ref, deployment_id, dependency_id, route_operation_id,
        route_method, route_path, approved_at, expires_at
      ) values
        (%L::uuid, %L, extensions.digest(convert_to(%L, 'utf8'), 'sha256'),
         %L::uuid, %L::uuid, decode(repeat('a1', 32), 'hex'), 'staging', %L,
         %L, %L, %L, 'supabase-auth', 'CMS-03A-06', 'GET',
         '/api/v1/cms/content-types', clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '1 hour'),
        (%L::uuid, %L, extensions.digest(convert_to(%L, 'utf8'), 'sha256'),
         %L::uuid, %L::uuid, decode(repeat('a1', 32), 'hex'), 'staging', %L,
         %L, %L, %L, 'supabase-auth', 'CMS-03A-06', 'GET',
         '/api/v1/cms/content-types', clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '1 hour'),
        (%L::uuid, %L, extensions.digest(convert_to(%L, 'utf8'), 'sha256'),
         %L::uuid, %L::uuid, decode(repeat('a1', 32), 'hex'), 'staging', %L,
         %L, %L, %L, 'supabase-auth', 'CMS-03A-06', 'GET',
         '/api/v1/cms/content-types', clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '1 hour')
    $targets$,
      same_target_id, 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000301', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000301', candidate_id, same_run_id, source_revision, hosting_project_id, supabase_project_ref, deployment_id,
      different_target_id, 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000302', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000302', candidate_id, different_run_id, source_revision, hosting_project_id, supabase_project_ref, deployment_id,
      transition_target_id, 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000303', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000303', candidate_id, transition_run_id, source_revision, hosting_project_id, supabase_project_ref, deployment_id
    )
  );
  perform extensions.dblink_exec(setup_connection, 'commit');

  -- The gate connection owns each session-level advisory lock.  Workers enter
  -- a transaction-scoped lock on the same key and therefore cannot execute an
  -- RPC until both asynchronous queries have been sent.
  perform extensions.dblink_connect(
    gate_connection,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );

  same_request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000101',
    'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000301',
    'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000401',
    'leaseDurationSeconds', 60,
    'requestLimit', 1
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', same_gate)
  );
  begin perform extensions.dblink_disconnect(same_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_b); exception when others then null; end;
  perform extensions.dblink_connect(
    same_a,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_connect(
    same_b,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_exec(same_a, 'set role service_role');
  perform extensions.dblink_exec(same_b, 'set role service_role');
  perform extensions.dblink_exec(same_a, 'create temporary table ac265_cp01_worker_result(result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(same_b, 'create temporary table ac265_cp01_worker_result(result jsonb) on commit preserve rows');
  worker_sql := format($worker$
do $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
  insert into pg_temp.ac265_cp01_worker_result(result)
  values (platform_api.ac265_hosted_outage_lease_acquire(%L::jsonb));
end;
$body$;
$worker$, same_gate, same_request::text);
  perform extensions.dblink_send_query(same_a, worker_sql);
  perform extensions.dblink_send_query(same_b, worker_sql);
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', same_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(same_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(same_b, false) as result(value text);
  end loop;
  select remote_result into same_result_a
  from extensions.dblink(same_a, 'select result from pg_temp.ac265_cp01_worker_result') as row(remote_result jsonb);
  select remote_result into same_result_b
  from extensions.dblink(same_b, 'select result from pg_temp.ac265_cp01_worker_result') as row(remote_result jsonb);
  select count(*) into same_lease_count
  from platform_private.ac265_hosted_outage_leases where target_id = same_target_id;
  select count(*) into same_active_count
  from platform_private.ac265_hosted_outage_leases
  where target_id = same_target_id and released_at is null;
  insert into ac265_cp01_concurrency_results
    (case_name, result_a, result_b, lease_count, active_count, consumed_count, released_count, partial_count)
  values ('identical-acquire', same_result_a, same_result_b, same_lease_count, same_active_count, 0, 0, 0);
  perform extensions.dblink_disconnect(same_b);
  perform extensions.dblink_disconnect(same_a);

  different_request_a := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000102',
    'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000302',
    'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000402',
    'leaseDurationSeconds', 60,
    'requestLimit', 1
  );
  different_request_b := jsonb_set(
    different_request_a,
    '{idempotencyRef}',
    to_jsonb('ac265-idempotency://staging/40000000-0000-4000-8000-000000000403'::text)
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', different_gate)
  );
  begin perform extensions.dblink_disconnect(different_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_b); exception when others then null; end;
  perform extensions.dblink_connect(
    different_a,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_connect(
    different_b,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_exec(different_a, 'set role service_role');
  perform extensions.dblink_exec(different_b, 'set role service_role');
  perform extensions.dblink_exec(different_a, 'create temporary table ac265_cp01_worker_result(result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(different_b, 'create temporary table ac265_cp01_worker_result(result jsonb) on commit preserve rows');
  worker_sql := format($worker$
do $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
  insert into pg_temp.ac265_cp01_worker_result(result)
  values (platform_api.ac265_hosted_outage_lease_acquire(%L::jsonb));
end;
$body$;
$worker$, different_gate, different_request_a::text);
  perform extensions.dblink_send_query(different_a, worker_sql);
  worker_sql := format($worker$
do $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
  insert into pg_temp.ac265_cp01_worker_result(result)
  values (platform_api.ac265_hosted_outage_lease_acquire(%L::jsonb));
end;
$body$;
$worker$, different_gate, different_request_b::text);
  perform extensions.dblink_send_query(different_b, worker_sql);
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', different_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(different_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(different_b, false) as result(value text);
  end loop;
  select remote_result into different_result_a
  from extensions.dblink(different_a, 'select result from pg_temp.ac265_cp01_worker_result') as row(remote_result jsonb);
  select remote_result into different_result_b
  from extensions.dblink(different_b, 'select result from pg_temp.ac265_cp01_worker_result') as row(remote_result jsonb);
  select count(*) into different_lease_count
  from platform_private.ac265_hosted_outage_leases where target_id = different_target_id;
  select count(*) into different_active_count
  from platform_private.ac265_hosted_outage_leases
  where target_id = different_target_id and released_at is null;
  insert into ac265_cp01_concurrency_results
    (case_name, result_a, result_b, lease_count, active_count, consumed_count, released_count, partial_count)
  values ('different-acquire', different_result_a, different_result_b, different_lease_count, different_active_count, 0, 0, 0);
  perform extensions.dblink_disconnect(different_b);
  perform extensions.dblink_disconnect(different_a);

  -- Seed one committed lease, then race consume against release.  Release no
  -- longer requires a prior consume, so the serializations are consume+release
  -- (consumed then released), release-then-consume (released first, so the
  -- consume must conflict), or consume-then-conflicting-release when the lease
  -- is already released.  None may leave a half-populated transition.
  transition_acquire_request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/20000000-0000-4000-8000-000000000103',
    'targetRef', 'ac265-outage-target://staging/30000000-0000-4000-8000-000000000303',
    'idempotencyRef', 'ac265-idempotency://staging/40000000-0000-4000-8000-000000000404',
    'leaseDurationSeconds', 60,
    'requestLimit', 1
  );
  perform extensions.dblink_exec(setup_connection, 'set role service_role');
  perform extensions.dblink_exec(setup_connection, 'create temporary table ac265_cp01_seed_result(result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(
    setup_connection,
    format('insert into pg_temp.ac265_cp01_seed_result(result) values (platform_api.ac265_hosted_outage_lease_acquire(%L::jsonb))', transition_acquire_request::text)
  );
  select remote_result into transition_seed_result
  from extensions.dblink(setup_connection, 'select result from pg_temp.ac265_cp01_seed_result') as row(remote_result jsonb);
  perform extensions.dblink_exec(setup_connection, 'reset role');
  transition_lease_ref := transition_seed_result ->> 'leaseRef';
  transition_lease_sha256 := transition_seed_result ->> 'leaseSha256';
  transition_consume_request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', transition_acquire_request ->> 'authorizationRef',
    'targetRef', transition_acquire_request ->> 'targetRef',
    'idempotencyRef', 'ac265-idempotency://staging/50000000-0000-4000-8000-000000000503',
    'leaseRef', transition_lease_ref,
    'leaseSha256', transition_lease_sha256
  );
  transition_release_request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', transition_acquire_request ->> 'authorizationRef',
    'targetRef', transition_acquire_request ->> 'targetRef',
    'idempotencyRef', 'ac265-idempotency://staging/60000000-0000-4000-8000-000000000603',
    'leaseRef', transition_lease_ref,
    'leaseSha256', transition_lease_sha256
  );
  perform extensions.dblink_exec(setup_connection, 'drop table pg_temp.ac265_cp01_seed_result');

  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', transition_gate)
  );
  begin perform extensions.dblink_disconnect(transition_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(transition_b); exception when others then null; end;
  perform extensions.dblink_connect(
    transition_a,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_connect(
    transition_b,
    'host=db port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_exec(transition_a, 'set role service_role');
  perform extensions.dblink_exec(transition_b, 'set role service_role');
  perform extensions.dblink_exec(transition_a, 'create temporary table ac265_cp01_worker_result(result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(transition_b, 'create temporary table ac265_cp01_worker_result(result jsonb) on commit preserve rows');
  worker_sql := format($worker$
do $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
  insert into pg_temp.ac265_cp01_worker_result(result)
  values (platform_api.ac265_hosted_outage_lease_consume(%L::jsonb));
end;
$body$;
$worker$, transition_gate, transition_consume_request::text);
  perform extensions.dblink_send_query(transition_a, worker_sql);
  worker_sql := format($worker$
do $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
  insert into pg_temp.ac265_cp01_worker_result(result)
  values (platform_api.ac265_hosted_outage_lease_release(%L::jsonb));
end;
$body$;
$worker$, transition_gate, transition_release_request::text);
  perform extensions.dblink_send_query(transition_b, worker_sql);
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', transition_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(transition_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(transition_b, false) as result(value text);
  end loop;
  select remote_result into transition_result_a
  from extensions.dblink(transition_a, 'select result from pg_temp.ac265_cp01_worker_result') as row(remote_result jsonb);
  select remote_result into transition_result_b
  from extensions.dblink(transition_b, 'select result from pg_temp.ac265_cp01_worker_result') as row(remote_result jsonb);
  select count(*) into transition_lease_count
  from platform_private.ac265_hosted_outage_leases where target_id = transition_target_id;
  select count(*) into transition_active_count
  from platform_private.ac265_hosted_outage_leases
  where target_id = transition_target_id and released_at is null;
  select count(*) into transition_consumed_count
  from platform_private.ac265_hosted_outage_leases
  where target_id = transition_target_id and consumed_at is not null;
  select count(*) into transition_released_count
  from platform_private.ac265_hosted_outage_leases
  where target_id = transition_target_id and released_at is not null;
  select count(*) into transition_partial_count
  from platform_private.ac265_hosted_outage_leases
  where target_id = transition_target_id
    and (
      (consumed_at is null and (consumed_idempotency_ref is not null or consume_request_sha256 is not null))
      or (consumed_at is not null and (consumed_idempotency_ref is null or consume_request_sha256 is null))
      or (released_at is null and (released_idempotency_ref is not null or release_request_sha256 is not null))
      or (released_at is not null and (released_idempotency_ref is null or release_request_sha256 is null))
    );
  insert into ac265_cp01_concurrency_results
    (case_name, result_a, result_b, lease_count, active_count, consumed_count, released_count, partial_count)
  values ('consume-release', transition_result_a, transition_result_b, transition_lease_count, transition_active_count, transition_consumed_count, transition_released_count, transition_partial_count);
  perform extensions.dblink_disconnect(transition_b);
  perform extensions.dblink_disconnect(transition_a);
  perform extensions.dblink_disconnect(gate_connection);
  perform extensions.dblink_exec(setup_connection, cleanup_sql);
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  begin perform extensions.dblink_cancel_query(same_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(same_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(different_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(different_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(transition_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(transition_b); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); perform pg_catalog.pg_advisory_unlock(%s::bigint); perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', same_gate, different_gate, transition_gate)); exception when others then null; end;
  begin perform extensions.dblink_disconnect(transition_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(transition_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(different_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(same_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, 'rollback'); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, cleanup_sql); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$probe$;

select ok(
  (select result_a ->> 'state' = 'acquired'
     and result_b ->> 'state' = 'acquired'
     and result_a = result_b
     and lease_count = 1
     and active_count = 1
   from ac265_cp01_concurrency_results
   where case_name = 'identical-acquire'),
  'concurrent identical acquire requests return one identical lease and persist one active row'
);

select ok(
  (select ((result_a ->> 'state' = 'acquired' and result_b = '{"status":"conflict"}'::jsonb)
       or (result_b ->> 'state' = 'acquired' and result_a = '{"status":"conflict"}'::jsonb))
      and lease_count = 1
      and active_count = 1
   from ac265_cp01_concurrency_results
   where case_name = 'different-acquire'),
  'concurrent different-idempotency acquire requests serialize to one lease and one conflict'
);

select ok(
  (select ((result_a ->> 'state' = 'consumed' and result_b ->> 'state' = 'released')
        or (result_a ->> 'state' = 'consumed' and result_b = '{"status":"conflict"}'::jsonb)
        or (result_a = '{"status":"conflict"}'::jsonb and result_b ->> 'state' = 'released'))
      and lease_count = 1
      and active_count between 0 and 1
      and consumed_count between 0 and 1
      and released_count between 0 and 1
      and consumed_count + released_count >= 1
      and partial_count = 0
   from ac265_cp01_concurrency_results
   where case_name = 'consume-release'),
  'concurrent consume and release serialize to consume-then-release, or a release that forces the consume to conflict'
);

select finish();
rollback;
