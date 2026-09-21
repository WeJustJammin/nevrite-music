-- AC265 CP-04d concurrency probe.
--
-- Two service-role workers submit one identical manifest while a third session
-- owns the authorization-row lock.  The test observes lock wait state rather
-- than using a timing assertion, then verifies one immutable manifest, its
-- complete source set, and one global replay row per source.

create extension if not exists dblink with schema extensions;
create extension if not exists pgtap with schema extensions;
select no_plan();

create temporary table ac265_cp04d_concurrency_results (
  result_a jsonb,
  result_b jsonb,
  manifest_count bigint not null,
  source_count bigint not null,
  replay_count bigint not null,
  lock_wait_count integer not null
) on commit preserve rows;

do $probe$
declare
  candidate_id constant uuid := 'a2650101-0000-4000-8000-000000000001';
  v_authorization_id constant uuid := 'a2650102-0000-4000-8000-000000000001';
  run_id constant uuid := 'a2650103-0000-4000-8000-000000000001';
  receipt_ref constant text :=
    'ac265-receipt://server/a2650105-0000-4000-8000-000000000001';
  evidence_ref constant text :=
    'ac265-evidence://blob/a2650105-0000-4000-8000-000000000002';
  authorization_ref constant text :=
    'ac265-authorization://staging/a2650102-0000-4000-8000-000000000001';
  idempotency_ref constant text :=
    'ac265-idempotency://staging/a2650104-0000-4000-8000-000000000001';
  connection_string constant text :=
    'host=db port=5432 dbname=postgres user=postgres password=postgres';
  setup_connection constant text := 'ac265_cp04d_setup';
  gate_connection constant text := 'ac265_cp04d_gate';
  worker_a constant text := 'ac265_cp04d_worker_a';
  worker_b constant text := 'ac265_cp04d_worker_b';
  request jsonb;
  worker_sql text;
  result_a jsonb;
  result_b jsonb;
  locked_authorization_id uuid;
  observed_pids integer[] := '{}';
  lock_wait_pids integer[] := '{}';
  observed_manifest_count bigint;
  observed_source_count bigint;
  observed_replay_count bigint;
  poll integer;
  ignored_rows bigint;
begin
  begin perform extensions.dblink_disconnect(worker_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;

  perform extensions.dblink_connect(setup_connection, connection_string);
  perform extensions.dblink_exec(setup_connection, $cleanup$
    do $cleanup_body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable
        on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable
        on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable
        on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable
        on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_sources
      where manifest_id in (
        select manifest_id
        from platform_private.ac265_hosted_artifact_manifests
        where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid
      );
      delete from platform_private.ac265_hosted_artifact_replay_ledger
      where artifact_ref in (
        'ac265-receipt://server/a2650105-0000-4000-8000-000000000001',
        'ac265-evidence://blob/a2650105-0000-4000-8000-000000000002'
      );
      delete from platform_private.ac265_hosted_artifact_manifests
      where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_runner_authorizations
      where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_verified_candidates
      where candidate_id = 'a2650101-0000-4000-8000-000000000001'::uuid;
      create trigger ac265_verified_candidates_are_immutable
        before update or delete or truncate
        on platform_private.ac265_verified_candidates
        for each statement
        execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable
        before update or delete or truncate
        on platform_private.ac265_hosted_artifact_manifests
        for each statement
        execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable
        before update or delete or truncate
        on platform_private.ac265_hosted_artifact_manifest_sources
        for each statement
        execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable
        before update or delete or truncate
        on platform_private.ac265_hosted_artifact_replay_ledger
        for each statement
        execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
    end;
    $cleanup_body$;
  $cleanup$);

  perform extensions.dblink_exec(setup_connection, $fixtures$
    insert into platform_private.ac265_verified_candidates (
      candidate_id, identity_sha256, source_revision, deployment_id,
      ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
      ci_artifact_id, staging_artifact_id, identity, provenance
    ) values (
      'a2650101-0000-4000-8000-000000000001'::uuid,
      decode(repeat('9', 64), 'hex'), repeat('8', 40), '6428523699',
      '97000001', 1, '97000002', 1, 9701, 9702,
      jsonb_build_object(
        'environment', 'staging', 'ciRunId', '97000001',
        'ciRunAttempt', 1, 'stagingRunId', '97000002',
        'stagingRunAttempt', 1, 'sourceRevision', repeat('8', 40),
        'deploymentId', '6428523699', 'hostingProjectId', 'wejammin-staging',
        'supabaseProjectRef', 'bcdefghijklmnopqrstu'
      ),
      '{}'::jsonb
    );
    insert into platform_private.ac265_runner_authorizations (
      authorization_id, run_id, identity_sha256, source_revision,
      deployment_id, github_run_id, github_run_attempt, workflow_sha,
      jti_sha256, request_sha256, authorized_at, expires_at
    ) values (
      'a2650102-0000-4000-8000-000000000001'::uuid,
      'a2650103-0000-4000-8000-000000000001'::uuid,
      decode(repeat('9', 64), 'hex'), repeat('8', 40), '6428523699',
      '97100001', 1, repeat('8', 40), decode(repeat('a', 64), 'hex'),
      decode(repeat('b', 64), 'hex'), clock_timestamp() - interval '30 seconds',
      clock_timestamp() + interval '4 minutes'
    );
  $fixtures$);

  request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'authorizationRef', authorization_ref,
    'idempotencyRef', idempotency_ref,
    'sources', jsonb_build_array(
      jsonb_build_object(
        'kind', 'server_receipt', 'artifactRef', receipt_ref,
        'artifactSha256', repeat('c', 64), 'attestationSha256', repeat('d', 64),
        'attestationKeyId', 'release-key-concurrency', 'subjectSha256', repeat('e', 64),
        'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      jsonb_build_object(
        'kind', 'execution_evidence', 'artifactRef', evidence_ref,
        'artifactSha256', repeat('f', 64), 'attestationSha256', repeat('0', 64),
        'attestationKeyId', 'release-key-concurrency', 'subjectSha256', repeat('1', 64),
        'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    )
  );

  perform extensions.dblink_connect(gate_connection, connection_string);
  perform extensions.dblink_exec(gate_connection, 'begin');
  select remote_authorization into locked_authorization_id
  from extensions.dblink(
    gate_connection,
    format(
      'select authorization_id from platform_private.ac265_runner_authorizations where authorization_id = %L::uuid for update',
      v_authorization_id
    )
  ) as row(remote_authorization uuid);
  if locked_authorization_id is distinct from v_authorization_id then
    raise exception 'CP04d concurrency fixture authorization row was not locked';
  end if;

  perform extensions.dblink_connect(worker_a, connection_string);
  perform extensions.dblink_connect(worker_b, connection_string);
  perform extensions.dblink_exec(worker_a, 'set application_name = ''ac265_cp04d_worker_a''');
  perform extensions.dblink_exec(worker_b, 'set application_name = ''ac265_cp04d_worker_b''');
  perform extensions.dblink_exec(worker_a, 'set role service_role');
  perform extensions.dblink_exec(worker_b, 'set role service_role');
  perform extensions.dblink_exec(worker_a, 'create temporary table ac265_cp04d_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(worker_b, 'create temporary table ac265_cp04d_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04d_worker_result(result)
      values (platform_api.ac265_hosted_artifact_manifest_register(%L::jsonb));
    end;
    $body$;
  $worker$, request::text);
  perform extensions.dblink_send_query(worker_a, worker_sql);
  perform extensions.dblink_send_query(worker_b, worker_sql);

  poll := 0;
  loop
    poll := poll + 1;
    select observed, waiting
      into observed_pids, lock_wait_pids
    from extensions.dblink(
      gate_connection,
      $observe$
        select
          coalesce(array_agg(activity.pid order by activity.pid)
            filter (where activity.state = 'active'), '{}'::integer[]),
          coalesce(array_agg(activity.pid order by activity.pid)
            filter (
              where activity.state = 'active'
                and activity.wait_event_type = 'Lock'
                and cardinality(pg_catalog.pg_blocking_pids(activity.pid)) > 0
                and exists (
                  select 1 from pg_catalog.pg_locks as wait_lock
                  where wait_lock.pid = activity.pid
                    and not wait_lock.granted
                    and wait_lock.locktype in ('transactionid', 'tuple')
                )
            ), '{}'::integer[])
        from pg_catalog.pg_stat_activity as activity
        where activity.application_name in ('ac265_cp04d_worker_a', 'ac265_cp04d_worker_b')
      $observe$
    ) as row(observed integer[], waiting integer[]);
    exit when cardinality(observed_pids) = 2 and cardinality(lock_wait_pids) >= 1;
    if poll >= 1000 then
      raise exception 'CP04d workers did not reach the authorization lock (observed %, waiting %)', observed_pids, lock_wait_pids;
    end if;
  end loop;

  perform extensions.dblink_exec(gate_connection, 'commit');
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(worker_a, false) as result(value text);
    select count(*) into ignored_rows
    from extensions.dblink_get_result(worker_b, false) as result(value text);
  end loop;
  select result into result_a
  from extensions.dblink(worker_a, 'select result from pg_temp.ac265_cp04d_worker_result') as row(result jsonb);
  select result into result_b
  from extensions.dblink(worker_b, 'select result from pg_temp.ac265_cp04d_worker_result') as row(result jsonb);

  perform extensions.dblink_disconnect(worker_b);
  perform extensions.dblink_disconnect(worker_a);
  perform extensions.dblink_disconnect(gate_connection);
  select total into observed_manifest_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*) from platform_private.ac265_hosted_artifact_manifests where authorization_id = %L::uuid',
      v_authorization_id
    )
  ) as row(total bigint);
  select total into observed_source_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*) from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = %L::uuid)',
      v_authorization_id
    )
  ) as row(total bigint);
  select total into observed_replay_count
  from extensions.dblink(
    setup_connection,
    format(
      'select count(*) from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in (%L, %L)',
      receipt_ref,
      evidence_ref
    )
  ) as row(total bigint);
  perform extensions.dblink_exec(setup_connection, $cleanup_after$
    do $cleanup_body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable
        on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable
        on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable
        on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable
        on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_sources
        where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in ('ac265-receipt://server/a2650105-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650105-0000-4000-8000-000000000002');
      delete from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_runner_authorizations where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_verified_candidates where candidate_id = 'a2650101-0000-4000-8000-000000000001'::uuid;
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
    end;
    $cleanup_body$;
  $cleanup_after$);
  insert into ac265_cp04d_concurrency_results
    (result_a, result_b, manifest_count, source_count, replay_count, lock_wait_count)
  values (
    result_a, result_b, observed_manifest_count, observed_source_count,
    observed_replay_count, cardinality(lock_wait_pids)
  );
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  begin perform extensions.dblink_cancel_query(worker_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(worker_b); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, 'rollback'); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin
    perform extensions.dblink_exec(setup_connection, $cleanup_on_error$
      do $cleanup_body$
      begin
        drop trigger if exists ac265_hosted_artifact_manifests_are_immutable
          on platform_private.ac265_hosted_artifact_manifests;
        drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable
          on platform_private.ac265_hosted_artifact_manifest_sources;
        drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable
          on platform_private.ac265_hosted_artifact_replay_ledger;
        drop trigger if exists ac265_verified_candidates_are_immutable
          on platform_private.ac265_verified_candidates;
        delete from platform_private.ac265_hosted_artifact_manifest_sources
          where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid);
        delete from platform_private.ac265_hosted_artifact_replay_ledger
          where artifact_ref in ('ac265-receipt://server/a2650105-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650105-0000-4000-8000-000000000002');
        delete from platform_private.ac265_hosted_artifact_manifests
          where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid;
        delete from platform_private.ac265_runner_authorizations
          where authorization_id = 'a2650102-0000-4000-8000-000000000001'::uuid;
        delete from platform_private.ac265_verified_candidates
          where candidate_id = 'a2650101-0000-4000-8000-000000000001'::uuid;
        create trigger ac265_verified_candidates_are_immutable
          before update or delete or truncate on platform_private.ac265_verified_candidates
          for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
        create trigger ac265_hosted_artifact_manifests_are_immutable
          before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests
          for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
        create trigger ac265_hosted_artifact_manifest_sources_are_immutable
          before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources
          for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
        create trigger ac265_hosted_artifact_replay_ledger_are_immutable
          before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger
          for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      end;
      $cleanup_body$;
    $cleanup_on_error$);
  exception when others then null;
  end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$probe$;

select ok(
  (select result_a = result_b
      and result_a ->> 'status' is distinct from 'conflict'
      and manifest_count = 1
      and source_count = 2
      and replay_count = 2
      and lock_wait_count >= 1
   from ac265_cp04d_concurrency_results),
  'concurrent identical registrations serialize to one complete immutable manifest'
);

create temporary table ac265_cp04d_overlap_results (
  result_a jsonb,
  result_b jsonb,
  manifest_count bigint not null,
  source_count bigint not null,
  replay_count bigint not null
) on commit preserve rows;

do $overlap$
declare
  candidate_a constant uuid := 'a2650201-0000-4000-8000-000000000001';
  candidate_b constant uuid := 'a2650201-0000-4000-8000-000000000002';
  authorization_a constant uuid := 'a2650202-0000-4000-8000-000000000001';
  authorization_b constant uuid := 'a2650202-0000-4000-8000-000000000002';
  receipt_ref constant text :=
    'ac265-receipt://server/a2650205-0000-4000-8000-000000000001';
  evidence_ref constant text :=
    'ac265-evidence://blob/a2650205-0000-4000-8000-000000000002';
  connection_string constant text :=
    'host=db port=5432 dbname=postgres user=postgres password=postgres';
  setup_connection constant text := 'ac265_cp04d_overlap_setup';
  worker_a constant text := 'ac265_cp04d_overlap_worker_a';
  worker_b constant text := 'ac265_cp04d_overlap_worker_b';
  request_a jsonb;
  request_b jsonb;
  worker_sql text;
  result_a jsonb;
  result_b jsonb;
  observed_manifest_count bigint;
  observed_source_count bigint;
  observed_replay_count bigint;
  ignored_rows bigint;
  poll integer;
begin
  begin perform extensions.dblink_disconnect(worker_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;

  perform extensions.dblink_connect(setup_connection, connection_string);
  perform extensions.dblink_exec(setup_connection, $cleanup$
    do $cleanup_body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable
        on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable
        on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable
        on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable
        on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_sources
        where manifest_id in (
          select manifest_id from platform_private.ac265_hosted_artifact_manifests
          where authorization_id in (
            'a2650202-0000-4000-8000-000000000001'::uuid,
            'a2650202-0000-4000-8000-000000000002'::uuid
          )
        );
      delete from platform_private.ac265_hosted_artifact_replay_ledger
        where artifact_ref in (
          'ac265-receipt://server/a2650205-0000-4000-8000-000000000001',
          'ac265-evidence://blob/a2650205-0000-4000-8000-000000000002'
        );
      delete from platform_private.ac265_hosted_artifact_manifests
        where authorization_id in (
          'a2650202-0000-4000-8000-000000000001'::uuid,
          'a2650202-0000-4000-8000-000000000002'::uuid
        );
      delete from platform_private.ac265_runner_authorizations
        where authorization_id in (
          'a2650202-0000-4000-8000-000000000001'::uuid,
          'a2650202-0000-4000-8000-000000000002'::uuid
        );
      delete from platform_private.ac265_verified_candidates
        where candidate_id in (
          'a2650201-0000-4000-8000-000000000001'::uuid,
          'a2650201-0000-4000-8000-000000000002'::uuid
        );
      create trigger ac265_verified_candidates_are_immutable
        before update or delete or truncate
        on platform_private.ac265_verified_candidates
        for each statement
        execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable
        before update or delete or truncate
        on platform_private.ac265_hosted_artifact_manifests
        for each statement
        execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable
        before update or delete or truncate
        on platform_private.ac265_hosted_artifact_manifest_sources
        for each statement
        execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable
        before update or delete or truncate
        on platform_private.ac265_hosted_artifact_replay_ledger
        for each statement
        execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
    end;
    $cleanup_body$;
  $cleanup$);

  perform extensions.dblink_exec(setup_connection, $fixtures$
    insert into platform_private.ac265_verified_candidates (
      candidate_id, identity_sha256, source_revision, deployment_id,
      ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
      ci_artifact_id, staging_artifact_id, identity, provenance
    ) values
      (
        'a2650201-0000-4000-8000-000000000001'::uuid,
        decode(repeat('7', 64), 'hex'), repeat('7', 40), '6428523701',
        '98000001', 1, '98000002', 1, 9801, 9802,
        jsonb_build_object(
          'environment', 'staging', 'ciRunId', '98000001',
          'ciRunAttempt', 1, 'stagingRunId', '98000002',
          'stagingRunAttempt', 1, 'sourceRevision', repeat('7', 40),
          'deploymentId', '6428523701', 'hostingProjectId', 'wejammin-staging',
          'supabaseProjectRef', 'abcdefghijklmnopqrst'
        ), '{}'
      ),
      (
        'a2650201-0000-4000-8000-000000000002'::uuid,
        decode(repeat('8', 64), 'hex'), repeat('8', 40), '6428523702',
        '98000003', 1, '98000004', 1, 9803, 9804,
        jsonb_build_object(
          'environment', 'staging', 'ciRunId', '98000003',
          'ciRunAttempt', 1, 'stagingRunId', '98000004',
          'stagingRunAttempt', 1, 'sourceRevision', repeat('8', 40),
          'deploymentId', '6428523702', 'hostingProjectId', 'wejammin-staging',
          'supabaseProjectRef', 'abcdefghijklmnopqrst'
        ), '{}'
      );
    insert into platform_private.ac265_runner_authorizations (
      authorization_id, run_id, identity_sha256, source_revision,
      deployment_id, github_run_id, github_run_attempt, workflow_sha,
      jti_sha256, request_sha256, authorized_at, expires_at
    ) values
      (
        'a2650202-0000-4000-8000-000000000001'::uuid,
        'a2650203-0000-4000-8000-000000000001'::uuid,
        decode(repeat('7', 64), 'hex'), repeat('7', 40), '6428523701',
        '98100001', 1, repeat('7', 40), decode(repeat('a', 64), 'hex'),
        decode(repeat('b', 64), 'hex'), clock_timestamp() - interval '30 seconds',
        clock_timestamp() + interval '4 minutes'
      ),
      (
        'a2650202-0000-4000-8000-000000000002'::uuid,
        'a2650203-0000-4000-8000-000000000002'::uuid,
        decode(repeat('8', 64), 'hex'), repeat('8', 40), '6428523702',
        '98100002', 1, repeat('8', 40), decode(repeat('c', 64), 'hex'),
        decode(repeat('d', 64), 'hex'), clock_timestamp() - interval '30 seconds',
        clock_timestamp() + interval '4 minutes'
      );
  $fixtures$);

  request_a := jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'authorizationRef', 'ac265-authorization://staging/a2650202-0000-4000-8000-000000000001',
    'idempotencyRef', 'ac265-idempotency://staging/a2650204-0000-4000-8000-000000000001',
    'sources', jsonb_build_array(
      jsonb_build_object(
        'kind', 'server_receipt', 'artifactRef', receipt_ref,
        'artifactSha256', repeat('a', 64), 'attestationSha256', repeat('b', 64),
        'attestationKeyId', 'release-key-overlap', 'subjectSha256', repeat('c', 64),
        'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      jsonb_build_object(
        'kind', 'execution_evidence', 'artifactRef', evidence_ref,
        'artifactSha256', repeat('d', 64), 'attestationSha256', repeat('e', 64),
        'attestationKeyId', 'release-key-overlap', 'subjectSha256', repeat('f', 64),
        'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    )
  );
  request_b := jsonb_set(
    jsonb_set(request_a, '{authorizationRef}', to_jsonb('ac265-authorization://staging/a2650202-0000-4000-8000-000000000002'::text)),
    '{idempotencyRef}', to_jsonb('ac265-idempotency://staging/a2650204-0000-4000-8000-000000000002'::text)
  );
  request_b := jsonb_set(
    request_b,
    '{sources}',
    jsonb_build_array((request_a -> 'sources') -> 1, (request_a -> 'sources') -> 0)
  );

  perform extensions.dblink_connect(worker_a, connection_string);
  perform extensions.dblink_connect(worker_b, connection_string);
  perform extensions.dblink_exec(worker_a, 'set application_name = ''ac265_cp04d_overlap_worker_a''');
  perform extensions.dblink_exec(worker_b, 'set application_name = ''ac265_cp04d_overlap_worker_b''');
  perform extensions.dblink_exec(worker_a, 'set role service_role');
  perform extensions.dblink_exec(worker_b, 'set role service_role');
  perform extensions.dblink_exec(worker_a, 'create temporary table ac265_cp04d_overlap_worker_result (result jsonb) on commit preserve rows');
  perform extensions.dblink_exec(worker_b, 'create temporary table ac265_cp04d_overlap_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04d_overlap_worker_result(result)
      values (platform_api.ac265_hosted_artifact_manifest_register(%L::jsonb));
    end;
    $body$;
  $worker$, request_a::text);
  perform extensions.dblink_send_query(worker_a, worker_sql);
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04d_overlap_worker_result(result)
      values (platform_api.ac265_hosted_artifact_manifest_register(%L::jsonb));
    end;
    $body$;
  $worker$, request_b::text);
  perform extensions.dblink_send_query(worker_b, worker_sql);

  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(worker_a, false) as result(value text);
    select count(*) into ignored_rows
    from extensions.dblink_get_result(worker_b, false) as result(value text);
  end loop;
  select result into result_a
  from extensions.dblink(worker_a, 'select result from pg_temp.ac265_cp04d_overlap_worker_result') as row(result jsonb);
  select result into result_b
  from extensions.dblink(worker_b, 'select result from pg_temp.ac265_cp04d_overlap_worker_result') as row(result jsonb);
  perform extensions.dblink_disconnect(worker_b);
  perform extensions.dblink_disconnect(worker_a);

  select total into observed_manifest_count
  from extensions.dblink(
    setup_connection,
    $$select count(*) from platform_private.ac265_hosted_artifact_manifests where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid)$$
  ) as row(total bigint);
  select total into observed_source_count
  from extensions.dblink(
    setup_connection,
    $$select count(*) from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid))$$
  ) as row(total bigint);
  select total into observed_replay_count
  from extensions.dblink(
    setup_connection,
    format('select count(*) from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in (%L, %L)', receipt_ref, evidence_ref)
  ) as row(total bigint);
  perform extensions.dblink_exec(setup_connection, $cleanup_after$
    do $cleanup_body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid));
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in ('ac265-receipt://server/a2650205-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650205-0000-4000-8000-000000000002');
      delete from platform_private.ac265_hosted_artifact_manifests where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid);
      delete from platform_private.ac265_runner_authorizations where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid);
      delete from platform_private.ac265_verified_candidates where candidate_id in ('a2650201-0000-4000-8000-000000000001'::uuid, 'a2650201-0000-4000-8000-000000000002'::uuid);
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
    end;
    $cleanup_body$;
  $cleanup_after$);
  insert into ac265_cp04d_overlap_results
    (result_a, result_b, manifest_count, source_count, replay_count)
  values (result_a, result_b, observed_manifest_count, observed_source_count, observed_replay_count);
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  begin perform extensions.dblink_cancel_query(worker_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_a); exception when others then null; end;
  begin
    perform extensions.dblink_exec(setup_connection, $cleanup_on_error$
      do $cleanup_body$
      begin
        drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
        drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
        drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
        drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
        delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid));
        delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in ('ac265-receipt://server/a2650205-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650205-0000-4000-8000-000000000002');
        delete from platform_private.ac265_hosted_artifact_manifests where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid);
        delete from platform_private.ac265_runner_authorizations where authorization_id in ('a2650202-0000-4000-8000-000000000001'::uuid, 'a2650202-0000-4000-8000-000000000002'::uuid);
        delete from platform_private.ac265_verified_candidates where candidate_id in ('a2650201-0000-4000-8000-000000000001'::uuid, 'a2650201-0000-4000-8000-000000000002'::uuid);
        create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
        create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
        create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
        create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      end;
      $cleanup_body$;
    $cleanup_on_error$);
  exception when others then null;
  end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$overlap$;

select ok(
  (
    ((select result_a ->> 'status' from ac265_cp04d_overlap_results) is distinct from 'conflict')
    <> ((select result_b ->> 'status' from ac265_cp04d_overlap_results) is distinct from 'conflict')
    and (select manifest_count = 1 and source_count = 2 and replay_count = 2 from ac265_cp04d_overlap_results)
    and (
      select (case when result_a ->> 'status' is distinct from 'conflict' then result_a else result_b end -> 'sources' -> 0 ->> 'artifactRef')
             < (case when result_a ->> 'status' is distinct from 'conflict' then result_a else result_b end -> 'sources' -> 1 ->> 'artifactRef')
      from ac265_cp04d_overlap_results
    )
  ),
  'reverse-order overlapping source requests canonicalize before replay writes without deadlock'
);

create temporary table ac265_cp04d_window_results (
  scenario text primary key,
  status text not null,
  manifest_count bigint not null,
  finalization_count bigint not null
) on commit preserve rows;

create temporary table ac265_cp04d_finalization_results (
  scenario text primary key,
  status_a text not null,
  status_b text not null,
  finalization_count bigint not null
) on commit preserve rows;

do $late_registration$
declare
  candidate_id constant uuid := 'a2650301-0000-4000-8000-000000000001';
  authorization_id constant uuid := 'a2650302-0000-4000-8000-000000000001';
  run_id constant uuid := 'a2650303-0000-4000-8000-000000000001';
  authorization_ref constant text := 'ac265-authorization://staging/a2650302-0000-4000-8000-000000000001';
  idempotency_ref constant text := 'ac265-idempotency://staging/a2650304-0000-4000-8000-000000000001';
  artifact_ref constant text := 'ac265-evidence://blob/a2650305-0000-4000-8000-000000000001';
  connection_string constant text := 'host=db port=5432 dbname=postgres user=postgres password=postgres';
  setup_connection constant text := 'ac265_cp04d_late_registration_setup';
  gate_connection constant text := 'ac265_cp04d_late_registration_gate';
  worker_connection constant text := 'ac265_cp04d_late_registration_worker';
  request jsonb;
  worker_sql text;
  worker_result jsonb;
  ignored_rows bigint;
  locked_id uuid;
  poll integer;
begin
  begin perform extensions.dblink_disconnect(worker_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  perform extensions.dblink_connect(setup_connection, connection_string);
  perform extensions.dblink_exec(setup_connection, $cleanup$
    do $body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifest_finalizations_are_immutable on platform_private.ac265_hosted_artifact_manifest_finalizations;
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_finalizations
       where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_manifest_sources
       where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref = 'ac265-evidence://blob/a2650305-0000-4000-8000-000000000001';
      delete from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_runner_authorizations where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_verified_candidates where candidate_id = 'a2650301-0000-4000-8000-000000000001'::uuid;
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_finalizations for each statement execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();
    end;
    $body$;
  $cleanup$);
  perform extensions.dblink_exec(setup_connection, format($fixtures$
    insert into platform_private.ac265_verified_candidates (
      candidate_id, identity_sha256, source_revision, deployment_id, ci_run_id, ci_run_attempt,
      staging_run_id, staging_run_attempt, ci_artifact_id, staging_artifact_id, identity, provenance
    ) values (
      %L::uuid, decode(repeat('3', 64), 'hex'), repeat('3', 40), '6428523801',
      '98300001', 1, '98300002', 1, 9831, 9832,
      jsonb_build_object('environment', 'staging', 'ciRunId', '98300001', 'ciRunAttempt', 1,
        'stagingRunId', '98300002', 'stagingRunAttempt', 1, 'sourceRevision', repeat('3', 40),
        'deploymentId', '6428523801', 'hostingProjectId', 'wejammin-staging',
        'supabaseProjectRef', 'abcdefghijklmnopqrst'), '{}'::jsonb
    );
    insert into platform_private.ac265_runner_authorizations (
      authorization_id, run_id, identity_sha256, source_revision, deployment_id,
      github_run_id, github_run_attempt, workflow_sha, jti_sha256, request_sha256, authorized_at, expires_at
    ) values (
      %L::uuid, %L::uuid, decode(repeat('3', 64), 'hex'), repeat('3', 40), '6428523801',
      '98310001', 1, repeat('3', 40), decode(repeat('4', 64), 'hex'), decode(repeat('5', 64), 'hex'),
      clock_timestamp() - interval '1 second', clock_timestamp() + interval '0.8 seconds'
    );
  $fixtures$, candidate_id, authorization_id, run_id));
  request := jsonb_build_object(
    'criterion', 'P2-S09-AC-265', 'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'authorizationRef', authorization_ref, 'idempotencyRef', idempotency_ref,
    'sources', jsonb_build_array(jsonb_build_object(
      'kind', 'execution_evidence', 'artifactRef', artifact_ref,
      'artifactSha256', repeat('6', 64), 'attestationSha256', repeat('7', 64),
      'attestationKeyId', 'release-key-window', 'subjectSha256', repeat('8', 64),
      'issuedAt', to_char((clock_timestamp() - interval '1 second') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'expiresAt', to_char((clock_timestamp() + interval '0.8 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ))
  );
  perform extensions.dblink_connect(gate_connection, connection_string);
  perform extensions.dblink_exec(gate_connection, 'begin');
  select value into locked_id from extensions.dblink(gate_connection,
    format('select authorization_id from platform_private.ac265_runner_authorizations where authorization_id = %L::uuid for update', authorization_id)
  ) as row(value uuid);
  if locked_id is distinct from authorization_id then raise exception 'late registration authorization lock was not acquired'; end if;
  perform extensions.dblink_connect(worker_connection, connection_string);
  perform extensions.dblink_exec(worker_connection, 'set role service_role');
  perform extensions.dblink_exec(worker_connection, 'set statement_timeout = ''15s''; set lock_timeout = ''5s''');
  perform extensions.dblink_exec(worker_connection, 'create temporary table ac265_cp04d_window_worker_result (result jsonb) on commit preserve rows');
  worker_sql := format($worker$
    do $body$
    begin
      insert into pg_temp.ac265_cp04d_window_worker_result(result)
      values (platform_api.ac265_hosted_artifact_manifest_register(%L::jsonb));
    end;
    $body$;
  $worker$, request::text);
  perform extensions.dblink_send_query(worker_connection, worker_sql);
  perform extensions.dblink_exec(gate_connection, 'do $body$ begin perform pg_sleep(1.25); end; $body$');
  perform extensions.dblink_exec(gate_connection, 'commit');
  while extensions.dblink_is_busy(worker_connection) = 1 loop
    perform pg_sleep(0.01);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows from extensions.dblink_get_result(worker_connection, false) as result(value text);
  end loop;
  select result into worker_result from extensions.dblink(worker_connection, 'select result from pg_temp.ac265_cp04d_window_worker_result') as row(result jsonb);
  insert into ac265_cp04d_window_results values ('late-registration', worker_result ->> 'status', 0, 0);
  perform extensions.dblink_disconnect(worker_connection);
  perform extensions.dblink_disconnect(gate_connection);
  perform extensions.dblink_exec(setup_connection, $cleanup$ do $body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifest_finalizations_are_immutable on platform_private.ac265_hosted_artifact_manifest_finalizations;
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref = 'ac265-evidence://blob/a2650305-0000-4000-8000-000000000001';
      delete from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_runner_authorizations where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_verified_candidates where candidate_id = 'a2650301-0000-4000-8000-000000000001'::uuid;
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_finalizations for each statement execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();
    end;
  $body$; $cleanup$);
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  begin perform extensions.dblink_cancel_query(worker_connection); exception when others then null; end;
  begin perform extensions.dblink_exec(gate_connection, 'rollback'); exception when others then null; end;
  begin perform extensions.dblink_disconnect(worker_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, $cleanup$ do $body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifest_finalizations_are_immutable on platform_private.ac265_hosted_artifact_manifest_finalizations;
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in (select manifest_id from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref = 'ac265-evidence://blob/a2650305-0000-4000-8000-000000000001';
      delete from platform_private.ac265_hosted_artifact_manifests where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_runner_authorizations where authorization_id = 'a2650302-0000-4000-8000-000000000001'::uuid;
      delete from platform_private.ac265_verified_candidates where candidate_id = 'a2650301-0000-4000-8000-000000000001'::uuid;
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_finalizations for each statement execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();
    end;
  $body$; $cleanup$); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$late_registration$;

select is((select status from ac265_cp04d_window_results where scenario = 'late-registration'), 'conflict', 'registration rechecks the wall clock after an authorization lock and rejects an expired request');

do $race_fixtures$
declare
  connection_string constant text := 'host=db port=5432 dbname=postgres user=postgres password=postgres';
  setup_connection constant text := 'ac265_cp04d_finalization_setup';
  worker_names text[] := array[
    'ac265_cp04d_finalization_worker_a', 'ac265_cp04d_finalization_worker_b',
    'ac265_cp04d_finalization_worker_c', 'ac265_cp04d_finalization_worker_d',
    'ac265_cp04d_finalization_worker_e', 'ac265_cp04d_finalization_worker_f'
  ];
  worker_sql text;
  request_a jsonb;
  request_b jsonb;
  result_a jsonb;
  result_b jsonb;
  worker_output_a text;
  worker_output_b text;
  finalization_count bigint;
  ignored_rows bigint;
  worker_name text;
  poll integer;
begin
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  foreach worker_name in array worker_names loop
    begin perform extensions.dblink_disconnect(worker_name); exception when others then null; end;
  end loop;
  perform extensions.dblink_connect(setup_connection, connection_string);
  perform extensions.dblink_exec(setup_connection, $cleanup$
    do $body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifest_finalizations_are_immutable on platform_private.ac265_hosted_artifact_manifest_finalizations;
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in ('ac265-evidence://blob/a2650405-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650405-0000-4000-8000-000000000002', 'ac265-evidence://blob/a2650405-0000-4000-8000-000000000003');
      delete from platform_private.ac265_hosted_artifact_manifests where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_runner_authorizations where authorization_id in ('a2650402-0000-4000-8000-000000000001'::uuid, 'a2650402-0000-4000-8000-000000000002'::uuid, 'a2650402-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_verified_candidates where candidate_id in ('a2650401-0000-4000-8000-000000000001'::uuid, 'a2650401-0000-4000-8000-000000000002'::uuid, 'a2650401-0000-4000-8000-000000000003'::uuid);
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_finalizations for each statement execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();
    end;
    $body$;
  $cleanup$);
  perform extensions.dblink_exec(setup_connection, $fixtures$
    insert into platform_private.ac265_verified_candidates (
      candidate_id, identity_sha256, source_revision, deployment_id, ci_run_id, ci_run_attempt,
      staging_run_id, staging_run_attempt, ci_artifact_id, staging_artifact_id, identity, provenance
    )
    select
      format('a2650401-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      decode(repeat(chr(96 + n), 64), 'hex'), repeat(chr(96 + n), 40), '64285239' || lpad(n::text, 2, '0'),
      format('9840000%s', n), 1, format('9841000%s', n), 1, 9840 + n, 9850 + n,
      jsonb_build_object('environment', 'staging', 'ciRunId', format('9840000%s', n), 'ciRunAttempt', 1,
        'stagingRunId', format('9841000%s', n), 'stagingRunAttempt', 1,
        'sourceRevision', repeat(chr(96 + n), 40), 'deploymentId', '64285239' || lpad(n::text, 2, '0'),
        'hostingProjectId', 'wejammin-staging', 'supabaseProjectRef', 'abcdefghijklmnopqrst'), '{}'::jsonb
    from generate_series(1, 3) as row(n);
    insert into platform_private.ac265_runner_authorizations (
      authorization_id, run_id, identity_sha256, source_revision, deployment_id,
      github_run_id, github_run_attempt, workflow_sha, jti_sha256, request_sha256, authorized_at, expires_at
    )
    select
      format('a2650402-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('a2650403-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      decode(repeat(chr(96 + n), 64), 'hex'), repeat(chr(96 + n), 40), '64285239' || lpad(n::text, 2, '0'),
      format('9842000%s', n), 1, repeat(chr(96 + n), 40), decode(lpad(to_hex(n), 64, '0'), 'hex'), decode(lpad(to_hex(100 + n), 64, '0'), 'hex'),
      clock_timestamp() - interval '30 seconds', clock_timestamp() + interval '4 minutes'
    from generate_series(1, 3) as row(n);
    insert into platform_private.ac265_hosted_artifact_manifests (
      manifest_id, manifest_ref, authorization_id, candidate_id, run_id, identity_sha256,
      environment, source_revision, deployment_id, hosting_project_id, supabase_project_ref,
      source_count, source_set_complete, kind_complete, registered_at, idempotency_ref, request_sha256
    )
    select
      format('a2650406-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('ac265-artifact-manifest://staging/a2650406-0000-4000-8000-%s', lpad(n::text, 12, '0')),
      format('a2650402-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('a2650401-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('a2650403-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      decode(repeat(chr(96 + n), 64), 'hex'), 'staging', repeat(chr(96 + n), 40), '64285239' || lpad(n::text, 2, '0'),
      'wejammin-staging', 'abcdefghijklmnopqrst', 1, true, false, clock_timestamp(),
      format('ac265-idempotency://staging/a2650404-0000-4000-8000-%s', lpad(n::text, 12, '0')), decode(repeat('c', 64), 'hex')
    from generate_series(1, 3) as row(n);
    insert into platform_private.ac265_hosted_artifact_replay_ledger (
      artifact_ref, manifest_id, authorization_id, candidate_id, run_id, identity_sha256,
      source_revision, deployment_id, hosting_project_id, supabase_project_ref, artifact_kind,
      artifact_sha256, attestation_sha256, attestation_key_id, subject_sha256, issued_at, expires_at, first_seen_at
    )
    select
      format('ac265-evidence://blob/a2650405-0000-4000-8000-%s', lpad(n::text, 12, '0')),
      format('a2650406-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('a2650402-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('a2650401-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      format('a2650403-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
      decode(repeat(chr(96 + n), 64), 'hex'), repeat(chr(96 + n), 40), '64285239' || lpad(n::text, 2, '0'),
      'wejammin-staging', 'abcdefghijklmnopqrst', 'execution_evidence', decode(repeat('d', 64), 'hex'),
      decode(repeat('e', 64), 'hex'), 'release-key-race', decode(repeat('f', 64), 'hex'),
      clock_timestamp() - interval '30 seconds', clock_timestamp() + interval '90 seconds', clock_timestamp()
    from generate_series(1, 3) as row(n);
    insert into platform_private.ac265_hosted_artifact_manifest_sources (
      manifest_id, source_ordinal, artifact_ref, artifact_kind, artifact_sha256,
      attestation_sha256, attestation_key_id, subject_sha256, issued_at, expires_at
    )
    select
      replay.manifest_id, 1, replay.artifact_ref, replay.artifact_kind, replay.artifact_sha256,
      replay.attestation_sha256, replay.attestation_key_id, replay.subject_sha256,
      replay.issued_at, replay.expires_at
    from platform_private.ac265_hosted_artifact_replay_ledger as replay
    where replay.artifact_ref in (
      'ac265-evidence://blob/a2650405-0000-4000-8000-000000000001',
      'ac265-evidence://blob/a2650405-0000-4000-8000-000000000002',
      'ac265-evidence://blob/a2650405-0000-4000-8000-000000000003'
    );
  $fixtures$);

  request_a := jsonb_build_object(
    'criterion', 'P2-S09-AC-265', 'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'authorizationRef', 'ac265-authorization://staging/a2650402-0000-4000-8000-000000000001',
    'manifestId', 'a2650406-0000-4000-8000-000000000001',
    'finalizationRef', 'ac265-finalization://staging/a2650407-0000-4000-8000-000000000001',
    'manifestSha256', repeat('1', 64)
  );
  request_b := request_a;
  perform extensions.dblink_connect(worker_names[1], connection_string);
  perform extensions.dblink_connect(worker_names[2], connection_string);
  perform extensions.dblink_exec(worker_names[1], 'set role service_role');
  perform extensions.dblink_exec(worker_names[2], 'set role service_role');
  perform extensions.dblink_exec(worker_names[1], 'set statement_timeout = ''15s''; set lock_timeout = ''5s''');
  perform extensions.dblink_exec(worker_names[2], 'set statement_timeout = ''15s''; set lock_timeout = ''5s''');
  worker_sql := format('select platform_api.ac265_hosted_artifact_manifest_finalize(%L::jsonb)', request_a::text);
  perform extensions.dblink_send_query(worker_names[1], worker_sql);
  perform extensions.dblink_send_query(worker_names[2], worker_sql);
  select value into worker_output_a from extensions.dblink_get_result(worker_names[1]) as result(value text);
  select value into worker_output_b from extensions.dblink_get_result(worker_names[2]) as result(value text);
  result_a := worker_output_a::jsonb;
  result_b := worker_output_b::jsonb;
  select value into finalization_count
  from extensions.dblink(
    setup_connection,
    $$select count(*)::bigint from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id = 'a2650406-0000-4000-8000-000000000001'::uuid$$
  ) as row(value bigint);
  insert into ac265_cp04d_finalization_results values ('same-request', coalesce(result_a ->> 'status', 'finalized'), coalesce(result_b ->> 'status', 'finalized'), finalization_count);
  perform extensions.dblink_disconnect(worker_names[2]); perform extensions.dblink_disconnect(worker_names[1]);

  request_a := jsonb_set(jsonb_set(request_a, '{manifestId}', to_jsonb('a2650406-0000-4000-8000-000000000002'::text)), '{authorizationRef}', to_jsonb('ac265-authorization://staging/a2650402-0000-4000-8000-000000000002'::text));
  request_a := jsonb_set(request_a, '{finalizationRef}', to_jsonb('ac265-finalization://staging/a2650407-0000-4000-8000-000000000002'::text));
  request_b := jsonb_set(request_a, '{manifestSha256}', to_jsonb(repeat('2', 64)));
  perform extensions.dblink_connect(worker_names[3], connection_string); perform extensions.dblink_connect(worker_names[4], connection_string);
  perform extensions.dblink_exec(worker_names[3], 'set role service_role'); perform extensions.dblink_exec(worker_names[4], 'set role service_role');
  perform extensions.dblink_exec(worker_names[3], 'set statement_timeout = ''15s''; set lock_timeout = ''5s'''); perform extensions.dblink_exec(worker_names[4], 'set statement_timeout = ''15s''; set lock_timeout = ''5s''');
  worker_sql := format('select platform_api.ac265_hosted_artifact_manifest_finalize(%L::jsonb)', request_a::text); perform extensions.dblink_send_query(worker_names[3], worker_sql);
  worker_sql := format('select platform_api.ac265_hosted_artifact_manifest_finalize(%L::jsonb)', request_b::text); perform extensions.dblink_send_query(worker_names[4], worker_sql);
  select value into worker_output_a from extensions.dblink_get_result(worker_names[3]) as result(value text);
  select value into worker_output_b from extensions.dblink_get_result(worker_names[4]) as result(value text);
  result_a := worker_output_a::jsonb;
  result_b := worker_output_b::jsonb;
  select value into finalization_count
  from extensions.dblink(
    setup_connection,
    $$select count(*)::bigint from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id = 'a2650406-0000-4000-8000-000000000002'::uuid$$
  ) as row(value bigint);
  insert into ac265_cp04d_finalization_results values ('same-ref-conflict', coalesce(result_a ->> 'status', 'finalized'), coalesce(result_b ->> 'status', 'finalized'), finalization_count);
  perform extensions.dblink_disconnect(worker_names[4]); perform extensions.dblink_disconnect(worker_names[3]);

  request_a := jsonb_set(jsonb_set(request_a, '{manifestId}', to_jsonb('a2650406-0000-4000-8000-000000000003'::text)), '{authorizationRef}', to_jsonb('ac265-authorization://staging/a2650402-0000-4000-8000-000000000003'::text));
  request_a := jsonb_set(request_a, '{finalizationRef}', to_jsonb('ac265-finalization://staging/a2650407-0000-4000-8000-000000000003'::text));
  request_a := jsonb_set(request_a, '{manifestSha256}', to_jsonb(repeat('3', 64)));
  request_b := jsonb_set(jsonb_set(request_a, '{finalizationRef}', to_jsonb('ac265-finalization://staging/a2650407-0000-4000-8000-000000000004'::text)), '{manifestSha256}', to_jsonb(repeat('4', 64)));
  perform extensions.dblink_connect(worker_names[5], connection_string); perform extensions.dblink_connect(worker_names[6], connection_string);
  perform extensions.dblink_exec(worker_names[5], 'set role service_role'); perform extensions.dblink_exec(worker_names[6], 'set role service_role');
  perform extensions.dblink_exec(worker_names[5], 'set statement_timeout = ''15s''; set lock_timeout = ''5s'''); perform extensions.dblink_exec(worker_names[6], 'set statement_timeout = ''15s''; set lock_timeout = ''5s''');
  worker_sql := format('select platform_api.ac265_hosted_artifact_manifest_finalize(%L::jsonb)', request_a::text); perform extensions.dblink_send_query(worker_names[5], worker_sql);
  worker_sql := format('select platform_api.ac265_hosted_artifact_manifest_finalize(%L::jsonb)', request_b::text); perform extensions.dblink_send_query(worker_names[6], worker_sql);
  select value into worker_output_a from extensions.dblink_get_result(worker_names[5]) as result(value text);
  select value into worker_output_b from extensions.dblink_get_result(worker_names[6]) as result(value text);
  result_a := worker_output_a::jsonb;
  result_b := worker_output_b::jsonb;
  select value into finalization_count
  from extensions.dblink(
    setup_connection,
    $$select count(*)::bigint from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id = 'a2650406-0000-4000-8000-000000000003'::uuid$$
  ) as row(value bigint);
  insert into ac265_cp04d_finalization_results values ('same-manifest-different-ref', coalesce(result_a ->> 'status', 'finalized'), coalesce(result_b ->> 'status', 'finalized'), finalization_count);
  perform extensions.dblink_disconnect(worker_names[6]); perform extensions.dblink_disconnect(worker_names[5]);

  perform extensions.dblink_exec(setup_connection, $cleanup$ do $body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifest_finalizations_are_immutable on platform_private.ac265_hosted_artifact_manifest_finalizations;
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in ('ac265-evidence://blob/a2650405-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650405-0000-4000-8000-000000000002', 'ac265-evidence://blob/a2650405-0000-4000-8000-000000000003');
      delete from platform_private.ac265_hosted_artifact_manifests where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_runner_authorizations where authorization_id in ('a2650402-0000-4000-8000-000000000001'::uuid, 'a2650402-0000-4000-8000-000000000002'::uuid, 'a2650402-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_verified_candidates where candidate_id in ('a2650401-0000-4000-8000-000000000001'::uuid, 'a2650401-0000-4000-8000-000000000002'::uuid, 'a2650401-0000-4000-8000-000000000003'::uuid);
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_finalizations for each statement execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();
    end;
  $body$; $cleanup$);
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  foreach worker_name in array worker_names loop
    begin perform extensions.dblink_cancel_query(worker_name); exception when others then null; end;
    begin perform extensions.dblink_disconnect(worker_name); exception when others then null; end;
  end loop;
  begin perform extensions.dblink_exec(setup_connection, $cleanup$ do $body$
    begin
      drop trigger if exists ac265_hosted_artifact_manifest_finalizations_are_immutable on platform_private.ac265_hosted_artifact_manifest_finalizations;
      drop trigger if exists ac265_hosted_artifact_manifests_are_immutable on platform_private.ac265_hosted_artifact_manifests;
      drop trigger if exists ac265_hosted_artifact_manifest_sources_are_immutable on platform_private.ac265_hosted_artifact_manifest_sources;
      drop trigger if exists ac265_hosted_artifact_replay_ledger_are_immutable on platform_private.ac265_hosted_artifact_replay_ledger;
      drop trigger if exists ac265_verified_candidates_are_immutable on platform_private.ac265_verified_candidates;
      delete from platform_private.ac265_hosted_artifact_manifest_finalizations where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_hosted_artifact_manifest_sources where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_hosted_artifact_replay_ledger where artifact_ref in ('ac265-evidence://blob/a2650405-0000-4000-8000-000000000001', 'ac265-evidence://blob/a2650405-0000-4000-8000-000000000002', 'ac265-evidence://blob/a2650405-0000-4000-8000-000000000003');
      delete from platform_private.ac265_hosted_artifact_manifests where manifest_id in ('a2650406-0000-4000-8000-000000000001'::uuid, 'a2650406-0000-4000-8000-000000000002'::uuid, 'a2650406-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_runner_authorizations where authorization_id in ('a2650402-0000-4000-8000-000000000001'::uuid, 'a2650402-0000-4000-8000-000000000002'::uuid, 'a2650402-0000-4000-8000-000000000003'::uuid);
      delete from platform_private.ac265_verified_candidates where candidate_id in ('a2650401-0000-4000-8000-000000000001'::uuid, 'a2650401-0000-4000-8000-000000000002'::uuid, 'a2650401-0000-4000-8000-000000000003'::uuid);
      create trigger ac265_verified_candidates_are_immutable before update or delete or truncate on platform_private.ac265_verified_candidates for each statement execute function platform_private.ac265_reject_verified_candidate_mutation();
      create trigger ac265_hosted_artifact_manifests_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifests for each statement execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();
      create trigger ac265_hosted_artifact_manifest_sources_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_sources for each statement execute function platform_private.ac265_reject_hosted_artifact_source_mutation();
      create trigger ac265_hosted_artifact_replay_ledger_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_replay_ledger for each statement execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();
      create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable before update or delete or truncate on platform_private.ac265_hosted_artifact_manifest_finalizations for each statement execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();
    end;
  $body$; $cleanup$); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$race_fixtures$;

select ok(
  (select status_a <> 'conflict' and status_b <> 'conflict' and status_a = status_b and finalization_count = 1 from ac265_cp04d_finalization_results where scenario = 'same-request'),
  'concurrent identical finalizations are idempotent and create one ledger row'
);
select ok(
  (select ((status_a = 'conflict')::integer + (status_b = 'conflict')::integer) = 1 and finalization_count = 1 from ac265_cp04d_finalization_results where scenario = 'same-ref-conflict'),
  'concurrent finalizations with one reference and conflicting digests resolve to one success and one conflict'
);
select ok(
  (select ((status_a = 'conflict')::integer + (status_b = 'conflict')::integer) = 1 and finalization_count = 1 from ac265_cp04d_finalization_results where scenario = 'same-manifest-different-ref'),
  'concurrent finalizations with different references and conflicting digests resolve on the manifest uniqueness lock'
);

select * from finish();
