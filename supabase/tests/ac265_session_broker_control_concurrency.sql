-- AC265 session broker control-plane concurrency probe.
--
-- This is intentionally a separate, two-connection test.  Each worker waits on
-- a PostgreSQL advisory gate before entering the broker RPC, so both calls are
-- dispatched before either worker can pass the gate.  No timing assumption or
-- fixed sleep is used, and no case depends on which worker wins the race.  The
-- disposable fixtures are committed by a dedicated setup connection because the
-- dblink workers cannot observe an outer test transaction's uncommitted rows.
-- The resolve, replay, and teardown races also need handle sets that are already
-- durable, so those nine-role handle sets are minted through the same committed
-- setup connection instead of the test transaction.  Every fixture identifier is
-- private to this probe, so it cannot collide with the sequential broker suite.

begin;

create extension if not exists dblink with schema extensions;
create extension if not exists pgtap with schema extensions;
-- Fixed plan: four concurrent cases plus one cleanup-integrity assertion.  A
-- hard count keeps the probe from silently passing if a case is dropped.
select plan(5);

create temporary table ac265_broker_concurrency_results (
  case_name text primary key,
  result_a jsonb,
  result_b jsonb,
  handle_count bigint not null,
  role_row_count bigint not null,
  resolved_count bigint not null,
  resolve_ref_count bigint not null,
  logged_out_count bigint not null,
  teardown_ref_count bigint not null,
  stored_idempotency_ref text
) on commit drop;

-- One opaque handle reference and one opaque material reference per locked role
-- and per case, so no case shares a handle digest or a material reference with
-- another case or with the sequential broker suite.
create temporary table ac265_broker_concurrency_handles (
  case_name text not null,
  role text not null,
  locked_position integer not null,
  handle_ref text not null,
  handle_sha256 text not null,
  material_ref text not null,
  primary key (case_name, role)
) on commit drop;

-- Cleanup integrity: the probe must remove its own committed fixtures and leave
-- every private immutability guard enabled for later suites.
create temporary table ac265_broker_concurrency_cleanup (
  broker_rows bigint not null,
  role_rows bigint not null,
  authorization_rows bigint not null,
  candidate_rows bigint not null,
  disabled_triggers bigint not null
) on commit drop;

do $probe$
declare
  criterion constant text := 'P2-S09-AC-265';
  schema_version constant text := 'ac265-hosted-session-broker-control-v1';
  authorization_ref_prefix constant text := 'ac265-authorization://staging/';
  idempotency_ref_prefix constant text := 'ac265-idempotency://staging/';
  -- Probe-private identity digest.  The verified-candidate registry is unique on
  -- identity_sha256 alone, so sharing a repeated-character digest with another
  -- suite would collide if that suite was interrupted before its cleanup.
  identity_sha256_hex constant text :=
    'ac265b0' || repeat('c', 64 - 7);
  source_revision constant text := repeat('a', 40);
  deployment_id constant text := '6428523608';
  hosting_project_id constant text := 'wejammin-staging';
  supabase_project_ref constant text := 'abcdefghijklmnopqrst';
  connection_string constant text :=
    'host=db port=5432 dbname=postgres user=postgres password=postgres';
  setup_connection constant text := 'ac265_broker_setup';
  gate_connection constant text := 'ac265_broker_gate';
  authorize_function constant text := 'platform_api.ac265_session_broker_authorize';
  resolve_function constant text := 'platform_api.ac265_session_broker_resolve';
  teardown_function constant text := 'platform_api.ac265_session_broker_teardown';
  worker_timeouts constant text :=
    'set statement_timeout = ''30s''; set lock_timeout = ''10s''';
  -- Aggregate reads run on the setup connection.  Reading the broker tables
  -- from the outer test transaction would hold ACCESS SHARE until rollback and
  -- self-deadlock against the cleanup DDL, which needs ACCESS EXCLUSIVE.
  aggregate_sql_template constant text := $agg$
select
  count(distinct broker.broker_authorization_id),
  count(handle.handle_id),
  count(handle.handle_id) filter (where handle.resolves = 1),
  count(handle.handle_id) filter (where handle.last_resolve_idempotency_ref is not null),
  count(handle.handle_id) filter (where handle.logged_out_at is not null),
  count(handle.handle_id) filter (where handle.last_teardown_idempotency_ref is not null),
  coalesce(%s, '')
from platform_private.ac265_session_broker_handles as broker
left join platform_private.ac265_session_broker_handle_roles as handle
  on handle.broker_authorization_id = broker.broker_authorization_id
where broker.run_id = %L::uuid
    $agg$;
  worker_temp_table constant text :=
    'create temporary table ac265_broker_worker_result(result jsonb) on commit preserve rows';
  worker_result_select constant text := 'select result from pg_temp.ac265_broker_worker_result';
  worker_sql_template constant text := $worker$
do $body$
begin
  perform pg_catalog.pg_advisory_xact_lock(%s::bigint);
  insert into pg_temp.ac265_broker_worker_result(result)
  values (%s(%L::jsonb));
end;
$body$;
$worker$;
  case_resolve_one_use constant text := 'resolve-one-use';
  case_resolve_replay constant text := 'resolve-replay';
  case_authorize_race constant text := 'authorize-race';
  case_teardown_race constant text := 'teardown-race';
  resolve_one_use_role constant text := 'owner_full';
  resolve_replay_role constant text := 'entitled_read';
  teardown_race_role constant text := 'staff_case_scoped';
  role_keys constant text[] := array[
    'entitled_read', 'owner_full', 'guardian_mandate', 'junior_restricted',
    'business_mandate', 'staff_case_scoped', 'admin_step_up',
    'forbidden_hidden', 'disabled_prerequisite'
  ];
  candidate_id constant uuid := '10000000-0000-4000-8000-000000000201';
  resolve_one_use_run_id constant uuid := '10000000-0000-4000-8000-000000000211';
  resolve_replay_run_id constant uuid := '10000000-0000-4000-8000-000000000212';
  authorize_race_run_id constant uuid := '10000000-0000-4000-8000-000000000213';
  teardown_race_run_id constant uuid := '10000000-0000-4000-8000-000000000214';
  resolve_one_use_authorization_id constant uuid := '20000000-0000-4000-8000-000000000211';
  resolve_replay_authorization_id constant uuid := '20000000-0000-4000-8000-000000000212';
  authorize_race_authorization_id constant uuid := '20000000-0000-4000-8000-000000000213';
  teardown_race_authorization_id constant uuid := '20000000-0000-4000-8000-000000000214';
  resolve_one_use_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000221';
  resolve_one_use_second_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000222';
  resolve_replay_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000223';
  authorize_race_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000224';
  authorize_race_second_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000225';
  teardown_race_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000226';
  teardown_race_second_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000227';
  seed_resolve_one_use_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000231';
  seed_resolve_replay_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000232';
  seed_teardown_race_idempotency_id constant uuid := '41000000-0000-4000-8000-000000000234';
  resolve_one_use_handle_prefix constant text := '31000001-0000-4000-8000';
  resolve_one_use_material_prefix constant text := '32000001-0000-4000-8000';
  resolve_replay_handle_prefix constant text := '31000002-0000-4000-8000';
  resolve_replay_material_prefix constant text := '32000002-0000-4000-8000';
  authorize_race_handle_prefix constant text := '31000003-0000-4000-8000';
  authorize_race_material_prefix constant text := '32000003-0000-4000-8000';
  teardown_race_handle_prefix constant text := '31000004-0000-4000-8000';
  teardown_race_material_prefix constant text := '32000004-0000-4000-8000';
  resolve_one_use_gate constant bigint := 265093001;
  resolve_replay_gate constant bigint := 265093002;
  authorize_race_gate constant bigint := 265093003;
  teardown_race_gate constant bigint := 265093004;
  resolve_one_use_a constant text := 'ac265_broker_resolve_one_use_a';
  resolve_one_use_b constant text := 'ac265_broker_resolve_one_use_b';
  resolve_replay_a constant text := 'ac265_broker_resolve_replay_a';
  resolve_replay_b constant text := 'ac265_broker_resolve_replay_b';
  authorize_race_a constant text := 'ac265_broker_authorize_race_a';
  authorize_race_b constant text := 'ac265_broker_authorize_race_b';
  teardown_race_a constant text := 'ac265_broker_teardown_race_a';
  teardown_race_b constant text := 'ac265_broker_teardown_race_b';
  v_cleanup_sql text;
  v_handles jsonb;
  v_seed_result jsonb;
  v_request_a jsonb;
  v_result_a jsonb;
  v_result_b jsonb;
  v_aggregate_sql text;
  v_handle_count bigint;
  v_role_row_count bigint;
  v_resolved_count bigint;
  v_resolve_ref_count bigint;
  v_logged_out_count bigint;
  v_teardown_ref_count bigint;
  v_stored_idempotency_ref text;
  v_trigger_state text;
  v_broker_rows bigint;
  v_role_rows bigint;
  v_authorization_rows bigint;
  v_candidate_rows bigint;
  v_disabled_triggers bigint;
  v_handle_ref text;
  v_handle_sha256 text;
  ignored_rows bigint;
  poll integer;
  seed record;
begin
  -- A rerun after an interrupted local test starts from a clean fixture set.
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  perform extensions.dblink_connect(setup_connection, connection_string);

  -- The broker tables reject every delete, so the disposable probe rows are
  -- removed with their guard triggers disabled.  The disable, the deletes, and
  -- the re-enable all run inside ONE explicit transaction, and PostgreSQL
  -- re-enables the triggers on rollback.  A connection loss mid-cleanup
  -- therefore leaves the private immutability guards enabled; durable DDL is
  -- never issued.  Deletes are scoped to this probe's own run and candidate
  -- identifiers only.
  v_cleanup_sql := format($cleanup$
begin;
alter table platform_private.ac265_session_broker_handles
  disable trigger ac265_session_broker_handles_are_immutable;
alter table platform_private.ac265_session_broker_handle_roles
  disable trigger ac265_session_broker_handle_roles_reject_delete;

delete from platform_private.ac265_session_broker_handle_roles
where broker_authorization_id in (
  select broker_authorization_id
  from platform_private.ac265_session_broker_handles
  where run_id in (%L::uuid, %L::uuid, %L::uuid, %L::uuid)
);

delete from platform_private.ac265_session_broker_handles
where run_id in (%L::uuid, %L::uuid, %L::uuid, %L::uuid);

alter table platform_private.ac265_session_broker_handles
  enable trigger ac265_session_broker_handles_are_immutable;
alter table platform_private.ac265_session_broker_handle_roles
  enable trigger ac265_session_broker_handle_roles_reject_delete;

delete from platform_private.ac265_runner_authorizations
where authorization_id in (%L::uuid, %L::uuid, %L::uuid, %L::uuid);

alter table platform_private.ac265_verified_candidates
  disable trigger ac265_verified_candidates_are_immutable;
delete from platform_private.ac265_verified_candidates
where candidate_id = %L::uuid;
alter table platform_private.ac265_verified_candidates
  enable trigger ac265_verified_candidates_are_immutable;
commit;
$cleanup$,
    resolve_one_use_run_id, resolve_replay_run_id,
    authorize_race_run_id, teardown_race_run_id,
    resolve_one_use_run_id, resolve_replay_run_id,
    authorize_race_run_id, teardown_race_run_id,
    resolve_one_use_authorization_id, resolve_replay_authorization_id,
    authorize_race_authorization_id, teardown_race_authorization_id,
    candidate_id
  );
  perform extensions.dblink_exec(setup_connection, v_cleanup_sql);

  -- The candidate and runner authorizations mirror the sequential broker suite's
  -- server-side identity material, with probe-private identifiers so the two
  -- suites can never share a row.
  perform extensions.dblink_exec(setup_connection, 'begin');
  perform extensions.dblink_exec(
    setup_connection,
    format($candidate$
      insert into platform_private.ac265_verified_candidates (
        candidate_id, identity_sha256, source_revision, deployment_id,
        ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
        ci_artifact_id, staging_artifact_id, identity, provenance
      ) values (
        %L::uuid, decode(%L, 'hex'), %L, %L,
        '34751910240', 1, '34751910241', 1, 8841, 9941,
        jsonb_build_object(
          'environment', 'staging',
          'ciRunId', '34751910240',
          'ciRunAttempt', 1,
          'stagingRunId', '34751910241',
          'stagingRunAttempt', 1,
          'sourceRevision', %L,
          'deploymentId', %L,
          'deployedAt', '2026-09-14T01:01:00.000Z',
          'buildId', 'build-34751910240-1',
          'buildManifestSha256', repeat('c', 64),
          'artifactSha256', repeat('d', 64),
          'hostingAccountId', repeat('e', 32),
          'hostingProjectId', %L,
          'supabaseProjectRef', %L,
          'migrationVersion', '20260924192516',
          'migrationSha256', repeat('f', 64),
          'webOrigin', 'https://staging.wejamm.in',
          'apiOrigin', 'https://wejammin-api-staging.wejammin.workers.dev',
          'supabaseOrigin', 'https://abcdefghijklmnopqrst.supabase.co'
        ),
        '{}'::jsonb
      )
    $candidate$,
      candidate_id, identity_sha256_hex, source_revision, deployment_id,
      source_revision, deployment_id, hosting_project_id, supabase_project_ref
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
        (%L::uuid, %L::uuid, decode(%L, 'hex'), %L, %L,
         '34796668511', 1, %L, decode(repeat('7', 64), 'hex'),
         decode(repeat('9', 64), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes'),
        (%L::uuid, %L::uuid, decode(%L, 'hex'), %L, %L,
         '34796668512', 1, %L, decode(repeat('1', 64), 'hex'),
         decode(repeat('2', 64), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes'),
        (%L::uuid, %L::uuid, decode(%L, 'hex'), %L, %L,
         '34796668513', 1, %L, decode(repeat('3', 64), 'hex'),
         decode(repeat('4', 64), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes'),
        (%L::uuid, %L::uuid, decode(%L, 'hex'), %L, %L,
         '34796668514', 1, %L, decode(repeat('5', 64), 'hex'),
         decode(repeat('6', 64), 'hex'), clock_timestamp() - interval '10 seconds',
         clock_timestamp() + interval '4 minutes')
    $authorizations$,
      resolve_one_use_authorization_id, resolve_one_use_run_id,
      identity_sha256_hex, source_revision, deployment_id, source_revision,
      resolve_replay_authorization_id, resolve_replay_run_id,
      identity_sha256_hex, source_revision, deployment_id, source_revision,
      authorize_race_authorization_id, authorize_race_run_id,
      identity_sha256_hex, source_revision, deployment_id, source_revision,
      teardown_race_authorization_id, teardown_race_run_id,
      identity_sha256_hex, source_revision, deployment_id, source_revision
    )
  );
  perform extensions.dblink_exec(setup_connection, 'commit');

  -- Nine locked role handles per case, with the handle digest taken over the
  -- exact handle reference bytes, exactly as the broker RPC requires.
  insert into ac265_broker_concurrency_handles (
    case_name, role, locked_position, handle_ref, handle_sha256, material_ref
  )
  select
    expanded.case_name,
    expanded.role,
    expanded.locked_position,
    expanded.handle_ref,
    encode(extensions.digest(convert_to(expanded.handle_ref, 'utf8'), 'sha256'), 'hex'),
    expanded.material_ref
  from (
    select
      seeds.case_name,
      locked.role,
      locked.locked_position,
      'ac265-session://' || locked.role || '/' || seeds.handle_prefix || '-'
        || lpad(locked.locked_position::text, 12, '0') as handle_ref,
      'ac265-session-material://staging/' || seeds.material_prefix || '-'
        || lpad(locked.locked_position::text, 12, '0') as material_ref
    from (
      values
        (case_resolve_one_use, resolve_one_use_handle_prefix, resolve_one_use_material_prefix),
        (case_resolve_replay, resolve_replay_handle_prefix, resolve_replay_material_prefix),
        (case_authorize_race, authorize_race_handle_prefix, authorize_race_material_prefix),
        (case_teardown_race, teardown_race_handle_prefix, teardown_race_material_prefix)
    ) as seeds(case_name, handle_prefix, material_prefix)
    cross join (
      select locked_role.role, locked_role.locked_position
      from unnest(role_keys) with ordinality as locked_role(role, locked_position)
    ) as locked
  ) as expanded;

  -- The three cases that race on an existing handle set need durable rows, so
  -- the handle sets are minted and committed through the setup connection.
  perform extensions.dblink_exec(setup_connection, 'set role service_role');
  perform extensions.dblink_exec(
    setup_connection,
    'create temporary table ac265_broker_seed_result(result jsonb) on commit preserve rows'
  );
  for seed in
    select *
    from (
      values
        (
          case_resolve_one_use, resolve_one_use_run_id,
          resolve_one_use_authorization_id, seed_resolve_one_use_idempotency_id
        ),
        (
          case_resolve_replay, resolve_replay_run_id,
          resolve_replay_authorization_id, seed_resolve_replay_idempotency_id
        ),
        (
          case_teardown_race, teardown_race_run_id,
          teardown_race_authorization_id, seed_teardown_race_idempotency_id
        )
    ) as seeds(case_name, run_id, authorization_id, idempotency_id)
  loop
    select jsonb_agg(
        jsonb_build_object(
          'role', handle.role,
          'handleRef', handle.handle_ref,
          'handleSha256', handle.handle_sha256,
          'materialRef', handle.material_ref
        )
        order by handle.locked_position
      )
      into v_handles
    from ac265_broker_concurrency_handles as handle
    where handle.case_name = seed.case_name;

    v_request_a := jsonb_build_object(
      'criterion', criterion,
      'schemaVersion', schema_version,
      'authorizationRef', authorization_ref_prefix || seed.authorization_id::text,
      'runId', seed.run_id::text,
      'identitySha256', identity_sha256_hex,
      'idempotencyRef', idempotency_ref_prefix || seed.idempotency_id::text,
      'handles', v_handles
    );
    perform extensions.dblink_exec(
      setup_connection,
      'delete from pg_temp.ac265_broker_seed_result'
    );
    perform extensions.dblink_exec(
      setup_connection,
      format(
        'insert into pg_temp.ac265_broker_seed_result(result) values (%s(%L::jsonb))',
        authorize_function,
        v_request_a::text
      )
    );
    select remote_result into v_seed_result
    from extensions.dblink(
      setup_connection,
      'select result from pg_temp.ac265_broker_seed_result'
    ) as row(remote_result jsonb);

    if v_seed_result ->> 'state' is distinct from 'authorized' then
      raise exception 'AC265 session broker concurrency fixture for % was not authorized: %',
        seed.case_name, v_seed_result;
    end if;
  end loop;
  perform extensions.dblink_exec(setup_connection, 'drop table pg_temp.ac265_broker_seed_result');
  perform extensions.dblink_exec(setup_connection, 'reset role');

  -- The gate connection owns each session-level advisory lock.  Workers enter a
  -- transaction-scoped lock on the same key and therefore cannot execute an RPC
  -- until both asynchronous queries have been sent.
  perform extensions.dblink_connect(gate_connection, connection_string);

  -- Case 1: one-use resolve race.  Two different-idempotency resolve requests for
  -- the same handle must serialize so that a single resolve is consumed and the
  -- losing request fails closed with a conflict.
  select handle.handle_ref, handle.handle_sha256
    into v_handle_ref, v_handle_sha256
  from ac265_broker_concurrency_handles as handle
  where handle.case_name = case_resolve_one_use
    and handle.role = resolve_one_use_role;

  v_request_a := jsonb_build_object(
    'criterion', criterion,
    'schemaVersion', schema_version,
    'authorizationRef', authorization_ref_prefix || resolve_one_use_authorization_id::text,
    'runId', resolve_one_use_run_id::text,
    'identitySha256', identity_sha256_hex,
    'idempotencyRef', idempotency_ref_prefix || resolve_one_use_idempotency_id::text,
    'role', resolve_one_use_role,
    'handleRef', v_handle_ref,
    'handleSha256', v_handle_sha256
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', resolve_one_use_gate)
  );
  begin perform extensions.dblink_disconnect(resolve_one_use_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(resolve_one_use_b); exception when others then null; end;
  perform extensions.dblink_connect(resolve_one_use_a, connection_string);
  perform extensions.dblink_connect(resolve_one_use_b, connection_string);
  perform extensions.dblink_exec(resolve_one_use_a, 'set role service_role');
  perform extensions.dblink_exec(resolve_one_use_b, 'set role service_role');
  perform extensions.dblink_exec(resolve_one_use_a, worker_timeouts);
  perform extensions.dblink_exec(resolve_one_use_b, worker_timeouts);
  perform extensions.dblink_exec(resolve_one_use_a, worker_temp_table);
  perform extensions.dblink_exec(resolve_one_use_b, worker_temp_table);
  perform extensions.dblink_send_query(
    resolve_one_use_a,
    format(worker_sql_template, resolve_one_use_gate, resolve_function, v_request_a::text)
  );
  perform extensions.dblink_send_query(
    resolve_one_use_b,
    format(
      worker_sql_template, resolve_one_use_gate, resolve_function,
      jsonb_set(
        v_request_a,
        '{idempotencyRef}',
        to_jsonb(idempotency_ref_prefix || resolve_one_use_second_idempotency_id::text)
      )::text
    )
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', resolve_one_use_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(resolve_one_use_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(resolve_one_use_b, false) as result(value text);
  end loop;
  select remote_result into v_result_a
  from extensions.dblink(resolve_one_use_a, worker_result_select) as row(remote_result jsonb);
  select remote_result into v_result_b
  from extensions.dblink(resolve_one_use_b, worker_result_select) as row(remote_result jsonb);
  perform extensions.dblink_disconnect(resolve_one_use_b);
  perform extensions.dblink_disconnect(resolve_one_use_a);

  v_aggregate_sql := format(
    aggregate_sql_template,
    format('max(handle.last_resolve_idempotency_ref) filter (where handle.role = %L::text)', resolve_one_use_role),
    resolve_one_use_run_id
  );
  select agg.handle_count, agg.role_row_count, agg.resolved_count,
         agg.resolve_ref_count, agg.logged_out_count, agg.teardown_ref_count,
         agg.stored_idempotency_ref
    into v_handle_count, v_role_row_count, v_resolved_count,
         v_resolve_ref_count, v_logged_out_count, v_teardown_ref_count,
         v_stored_idempotency_ref
  from extensions.dblink(setup_connection, v_aggregate_sql)
    as agg(handle_count bigint, role_row_count bigint, resolved_count bigint,
           resolve_ref_count bigint, logged_out_count bigint,
           teardown_ref_count bigint, stored_idempotency_ref text);

  insert into ac265_broker_concurrency_results (
    case_name, result_a, result_b, handle_count, role_row_count,
    resolved_count, resolve_ref_count, logged_out_count, teardown_ref_count,
    stored_idempotency_ref
  ) values (
    case_resolve_one_use, v_result_a, v_result_b, v_handle_count,
    v_role_row_count, v_resolved_count, v_resolve_ref_count,
    v_logged_out_count, v_teardown_ref_count,
    nullif(v_stored_idempotency_ref, '')
  );

  -- Case 2: identical resolve replay race.  Two identical requests for the same
  -- handle must both return the same resolved envelope while still consuming
  -- exactly one resolve.
  select handle.handle_ref, handle.handle_sha256
    into v_handle_ref, v_handle_sha256
  from ac265_broker_concurrency_handles as handle
  where handle.case_name = case_resolve_replay
    and handle.role = resolve_replay_role;

  v_request_a := jsonb_build_object(
    'criterion', criterion,
    'schemaVersion', schema_version,
    'authorizationRef', authorization_ref_prefix || resolve_replay_authorization_id::text,
    'runId', resolve_replay_run_id::text,
    'identitySha256', identity_sha256_hex,
    'idempotencyRef', idempotency_ref_prefix || resolve_replay_idempotency_id::text,
    'role', resolve_replay_role,
    'handleRef', v_handle_ref,
    'handleSha256', v_handle_sha256
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', resolve_replay_gate)
  );
  begin perform extensions.dblink_disconnect(resolve_replay_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(resolve_replay_b); exception when others then null; end;
  perform extensions.dblink_connect(resolve_replay_a, connection_string);
  perform extensions.dblink_connect(resolve_replay_b, connection_string);
  perform extensions.dblink_exec(resolve_replay_a, 'set role service_role');
  perform extensions.dblink_exec(resolve_replay_b, 'set role service_role');
  perform extensions.dblink_exec(resolve_replay_a, worker_timeouts);
  perform extensions.dblink_exec(resolve_replay_b, worker_timeouts);
  perform extensions.dblink_exec(resolve_replay_a, worker_temp_table);
  perform extensions.dblink_exec(resolve_replay_b, worker_temp_table);
  perform extensions.dblink_send_query(
    resolve_replay_a,
    format(worker_sql_template, resolve_replay_gate, resolve_function, v_request_a::text)
  );
  perform extensions.dblink_send_query(
    resolve_replay_b,
    format(worker_sql_template, resolve_replay_gate, resolve_function, v_request_a::text)
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', resolve_replay_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(resolve_replay_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(resolve_replay_b, false) as result(value text);
  end loop;
  select remote_result into v_result_a
  from extensions.dblink(resolve_replay_a, worker_result_select) as row(remote_result jsonb);
  select remote_result into v_result_b
  from extensions.dblink(resolve_replay_b, worker_result_select) as row(remote_result jsonb);
  perform extensions.dblink_disconnect(resolve_replay_b);
  perform extensions.dblink_disconnect(resolve_replay_a);

  v_aggregate_sql := format(
    aggregate_sql_template,
    format('max(handle.last_resolve_idempotency_ref) filter (where handle.role = %L::text)', resolve_replay_role),
    resolve_replay_run_id
  );
  select agg.handle_count, agg.role_row_count, agg.resolved_count,
         agg.resolve_ref_count, agg.logged_out_count, agg.teardown_ref_count,
         agg.stored_idempotency_ref
    into v_handle_count, v_role_row_count, v_resolved_count,
         v_resolve_ref_count, v_logged_out_count, v_teardown_ref_count,
         v_stored_idempotency_ref
  from extensions.dblink(setup_connection, v_aggregate_sql)
    as agg(handle_count bigint, role_row_count bigint, resolved_count bigint,
           resolve_ref_count bigint, logged_out_count bigint,
           teardown_ref_count bigint, stored_idempotency_ref text);

  insert into ac265_broker_concurrency_results (
    case_name, result_a, result_b, handle_count, role_row_count,
    resolved_count, resolve_ref_count, logged_out_count, teardown_ref_count,
    stored_idempotency_ref
  ) values (
    case_resolve_replay, v_result_a, v_result_b, v_handle_count,
    v_role_row_count, v_resolved_count, v_resolve_ref_count,
    v_logged_out_count, v_teardown_ref_count,
    nullif(v_stored_idempotency_ref, '')
  );

  -- Case 3: authorize race.  Two different-idempotency authorize requests for the
  -- same run must serialize to one frozen nine-role handle set; the one-per-run
  -- index makes a second handle set for the run impossible.
  select jsonb_agg(
      jsonb_build_object(
        'role', handle.role,
        'handleRef', handle.handle_ref,
        'handleSha256', handle.handle_sha256,
        'materialRef', handle.material_ref
      )
      order by handle.locked_position
    )
    into v_handles
  from ac265_broker_concurrency_handles as handle
  where handle.case_name = case_authorize_race;

  v_request_a := jsonb_build_object(
    'criterion', criterion,
    'schemaVersion', schema_version,
    'authorizationRef', authorization_ref_prefix || authorize_race_authorization_id::text,
    'runId', authorize_race_run_id::text,
    'identitySha256', identity_sha256_hex,
    'idempotencyRef', idempotency_ref_prefix || authorize_race_idempotency_id::text,
    'handles', v_handles
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', authorize_race_gate)
  );
  begin perform extensions.dblink_disconnect(authorize_race_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(authorize_race_b); exception when others then null; end;
  perform extensions.dblink_connect(authorize_race_a, connection_string);
  perform extensions.dblink_connect(authorize_race_b, connection_string);
  perform extensions.dblink_exec(authorize_race_a, 'set role service_role');
  perform extensions.dblink_exec(authorize_race_b, 'set role service_role');
  perform extensions.dblink_exec(authorize_race_a, worker_timeouts);
  perform extensions.dblink_exec(authorize_race_b, worker_timeouts);
  perform extensions.dblink_exec(authorize_race_a, worker_temp_table);
  perform extensions.dblink_exec(authorize_race_b, worker_temp_table);
  perform extensions.dblink_send_query(
    authorize_race_a,
    format(worker_sql_template, authorize_race_gate, authorize_function, v_request_a::text)
  );
  perform extensions.dblink_send_query(
    authorize_race_b,
    format(
      worker_sql_template, authorize_race_gate, authorize_function,
      jsonb_set(
        v_request_a,
        '{idempotencyRef}',
        to_jsonb(idempotency_ref_prefix || authorize_race_second_idempotency_id::text)
      )::text
    )
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', authorize_race_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(authorize_race_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(authorize_race_b, false) as result(value text);
  end loop;
  select remote_result into v_result_a
  from extensions.dblink(authorize_race_a, worker_result_select) as row(remote_result jsonb);
  select remote_result into v_result_b
  from extensions.dblink(authorize_race_b, worker_result_select) as row(remote_result jsonb);
  perform extensions.dblink_disconnect(authorize_race_b);
  perform extensions.dblink_disconnect(authorize_race_a);

  v_aggregate_sql := format(
    aggregate_sql_template,
    'max(broker.idempotency_ref)',
    authorize_race_run_id
  );
  select agg.handle_count, agg.role_row_count, agg.resolved_count,
         agg.resolve_ref_count, agg.logged_out_count, agg.teardown_ref_count,
         agg.stored_idempotency_ref
    into v_handle_count, v_role_row_count, v_resolved_count,
         v_resolve_ref_count, v_logged_out_count, v_teardown_ref_count,
         v_stored_idempotency_ref
  from extensions.dblink(setup_connection, v_aggregate_sql)
    as agg(handle_count bigint, role_row_count bigint, resolved_count bigint,
           resolve_ref_count bigint, logged_out_count bigint,
           teardown_ref_count bigint, stored_idempotency_ref text);

  insert into ac265_broker_concurrency_results (
    case_name, result_a, result_b, handle_count, role_row_count,
    resolved_count, resolve_ref_count, logged_out_count, teardown_ref_count,
    stored_idempotency_ref
  ) values (
    case_authorize_race, v_result_a, v_result_b, v_handle_count,
    v_role_row_count, v_resolved_count, v_resolve_ref_count,
    v_logged_out_count, v_teardown_ref_count,
    nullif(v_stored_idempotency_ref, '')
  );

  -- Case 4: teardown race.  Two different-idempotency teardowns for the same
  -- handle must serialize to exactly one logged-out handle, and teardown stays
  -- independent of any resolve.
  select handle.handle_ref, handle.handle_sha256
    into v_handle_ref, v_handle_sha256
  from ac265_broker_concurrency_handles as handle
  where handle.case_name = case_teardown_race
    and handle.role = teardown_race_role;

  v_request_a := jsonb_build_object(
    'criterion', criterion,
    'schemaVersion', schema_version,
    'authorizationRef', authorization_ref_prefix || teardown_race_authorization_id::text,
    'runId', teardown_race_run_id::text,
    'identitySha256', identity_sha256_hex,
    'idempotencyRef', idempotency_ref_prefix || teardown_race_idempotency_id::text,
    'role', teardown_race_role,
    'handleRef', v_handle_ref,
    'handleSha256', v_handle_sha256,
    'logoutScope', 'current_session_only'
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_lock(%s::bigint); end $gate$;', teardown_race_gate)
  );
  begin perform extensions.dblink_disconnect(teardown_race_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(teardown_race_b); exception when others then null; end;
  perform extensions.dblink_connect(teardown_race_a, connection_string);
  perform extensions.dblink_connect(teardown_race_b, connection_string);
  perform extensions.dblink_exec(teardown_race_a, 'set role service_role');
  perform extensions.dblink_exec(teardown_race_b, 'set role service_role');
  perform extensions.dblink_exec(teardown_race_a, worker_timeouts);
  perform extensions.dblink_exec(teardown_race_b, worker_timeouts);
  perform extensions.dblink_exec(teardown_race_a, worker_temp_table);
  perform extensions.dblink_exec(teardown_race_b, worker_temp_table);
  perform extensions.dblink_send_query(
    teardown_race_a,
    format(worker_sql_template, teardown_race_gate, teardown_function, v_request_a::text)
  );
  perform extensions.dblink_send_query(
    teardown_race_b,
    format(
      worker_sql_template, teardown_race_gate, teardown_function,
      jsonb_set(
        v_request_a,
        '{idempotencyRef}',
        to_jsonb(idempotency_ref_prefix || teardown_race_second_idempotency_id::text)
      )::text
    )
  );
  perform extensions.dblink_exec(
    gate_connection,
    format('do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;', teardown_race_gate)
  );
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(teardown_race_a, false) as result(value text);
  end loop;
  for poll in 1..4 loop
    select count(*) into ignored_rows
    from extensions.dblink_get_result(teardown_race_b, false) as result(value text);
  end loop;
  select remote_result into v_result_a
  from extensions.dblink(teardown_race_a, worker_result_select) as row(remote_result jsonb);
  select remote_result into v_result_b
  from extensions.dblink(teardown_race_b, worker_result_select) as row(remote_result jsonb);
  perform extensions.dblink_disconnect(teardown_race_b);
  perform extensions.dblink_disconnect(teardown_race_a);

  v_aggregate_sql := format(
    aggregate_sql_template,
    format('max(handle.last_teardown_idempotency_ref) filter (where handle.role = %L::text)', teardown_race_role),
    teardown_race_run_id
  );
  select agg.handle_count, agg.role_row_count, agg.resolved_count,
         agg.resolve_ref_count, agg.logged_out_count, agg.teardown_ref_count,
         agg.stored_idempotency_ref
    into v_handle_count, v_role_row_count, v_resolved_count,
         v_resolve_ref_count, v_logged_out_count, v_teardown_ref_count,
         v_stored_idempotency_ref
  from extensions.dblink(setup_connection, v_aggregate_sql)
    as agg(handle_count bigint, role_row_count bigint, resolved_count bigint,
           resolve_ref_count bigint, logged_out_count bigint,
           teardown_ref_count bigint, stored_idempotency_ref text);

  insert into ac265_broker_concurrency_results (
    case_name, result_a, result_b, handle_count, role_row_count,
    resolved_count, resolve_ref_count, logged_out_count, teardown_ref_count,
    stored_idempotency_ref
  ) values (
    case_teardown_race, v_result_a, v_result_b, v_handle_count,
    v_role_row_count, v_resolved_count, v_resolve_ref_count,
    v_logged_out_count, v_teardown_ref_count,
    nullif(v_stored_idempotency_ref, '')
  );

  perform extensions.dblink_disconnect(gate_connection);
  perform extensions.dblink_exec(setup_connection, v_cleanup_sql);

  -- Record cleanup integrity from the setup connection so the outer test
  -- transaction still takes no lock on the private broker tables.
  perform extensions.dblink_exec(
    setup_connection,
    format(
      $cleanup_evidence$
        create temporary table ac265_broker_cleanup_evidence on commit preserve rows as
        select
          (select count(*) from platform_private.ac265_session_broker_handles
            where run_id in (%L::uuid, %L::uuid, %L::uuid, %L::uuid)) as broker_rows,
          (select count(*) from platform_private.ac265_session_broker_handle_roles
            where broker_authorization_id in (%L::uuid, %L::uuid, %L::uuid, %L::uuid)) as role_rows,
          (select count(*) from platform_private.ac265_runner_authorizations
            where authorization_id in (%L::uuid, %L::uuid, %L::uuid, %L::uuid)) as authorization_rows,
          (select count(*) from platform_private.ac265_verified_candidates
            where candidate_id = %L::uuid) as candidate_rows,
          (select count(*) from pg_catalog.pg_trigger
            where tgrelid in (
                'platform_private.ac265_session_broker_handles'::regclass,
                'platform_private.ac265_session_broker_handle_roles'::regclass,
                'platform_private.ac265_verified_candidates'::regclass
              )
              and not tgisinternal
              and tgname in (
                'ac265_session_broker_handles_are_immutable',
                'ac265_session_broker_handle_roles_reject_delete',
                'ac265_verified_candidates_are_immutable'
              )
              -- tgenabled is 'O' when enabled and 'D' when disabled.
              and tgenabled = 'D') as disabled_triggers
      $cleanup_evidence$,
      resolve_one_use_run_id, resolve_replay_run_id,
      authorize_race_run_id, teardown_race_run_id,
      resolve_one_use_authorization_id, resolve_replay_authorization_id,
      authorize_race_authorization_id, teardown_race_authorization_id,
      resolve_one_use_authorization_id, resolve_replay_authorization_id,
      authorize_race_authorization_id, teardown_race_authorization_id,
      candidate_id
    )
  );
  select evidence.broker_rows, evidence.role_rows, evidence.authorization_rows,
         evidence.candidate_rows, evidence.disabled_triggers
    into v_broker_rows, v_role_rows, v_authorization_rows,
         v_candidate_rows, v_disabled_triggers
  from extensions.dblink(
    setup_connection,
    'select broker_rows, role_rows, authorization_rows, candidate_rows, disabled_triggers from pg_temp.ac265_broker_cleanup_evidence'
  ) as evidence(broker_rows bigint, role_rows bigint, authorization_rows bigint,
                candidate_rows bigint, disabled_triggers bigint);
  insert into ac265_broker_concurrency_cleanup (
    broker_rows, role_rows, authorization_rows, candidate_rows, disabled_triggers
  ) values (
    v_broker_rows, v_role_rows, v_authorization_rows, v_candidate_rows,
    v_disabled_triggers
  );
  perform extensions.dblink_exec(
    setup_connection,
    'drop table pg_temp.ac265_broker_cleanup_evidence'
  );
  perform extensions.dblink_disconnect(setup_connection);
exception when others then
  begin perform extensions.dblink_cancel_query(resolve_one_use_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(resolve_one_use_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(resolve_replay_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(resolve_replay_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(authorize_race_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(authorize_race_b); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(teardown_race_a); exception when others then null; end;
  begin perform extensions.dblink_cancel_query(teardown_race_b); exception when others then null; end;
  begin
    perform extensions.dblink_exec(
      gate_connection,
      format(
        'do $gate$ begin perform pg_catalog.pg_advisory_unlock(%s::bigint); perform pg_catalog.pg_advisory_unlock(%s::bigint); perform pg_catalog.pg_advisory_unlock(%s::bigint); perform pg_catalog.pg_advisory_unlock(%s::bigint); end $gate$;',
        resolve_one_use_gate, resolve_replay_gate,
        authorize_race_gate, teardown_race_gate
      )
    );
  exception when others then null;
  end;
  begin perform extensions.dblink_disconnect(teardown_race_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(teardown_race_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(authorize_race_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(authorize_race_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(resolve_replay_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(resolve_replay_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(resolve_one_use_b); exception when others then null; end;
  begin perform extensions.dblink_disconnect(resolve_one_use_a); exception when others then null; end;
  begin perform extensions.dblink_disconnect(gate_connection); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, 'rollback'); exception when others then null; end;
  begin perform extensions.dblink_exec(setup_connection, v_cleanup_sql); exception when others then null; end;
  begin perform extensions.dblink_disconnect(setup_connection); exception when others then null; end;
  raise;
end;
$probe$;

select ok(
  (
    select ((result_a ->> 'state' = 'resolved'
             and result_b = '{"status":"conflict"}'::jsonb)
         or (result_b ->> 'state' = 'resolved'
             and result_a = '{"status":"conflict"}'::jsonb))
      and handle_count = 1
      and role_row_count = 9
      and resolved_count = 1
      and resolve_ref_count = 1
      and stored_idempotency_ref =
        coalesce(result_a ->> 'idempotencyRef', result_b ->> 'idempotencyRef')
    from ac265_broker_concurrency_results
    where case_name = 'resolve-one-use'
  ),
  'concurrent distinct-idempotency resolve requests serialize to one resolved handle and one conflict'
);

select ok(
  (
    select result_a ->> 'state' = 'resolved'
      and result_b ->> 'state' = 'resolved'
      and result_a = result_b
      and handle_count = 1
      and role_row_count = 9
      and resolved_count = 1
      and resolve_ref_count = 1
      and stored_idempotency_ref = result_a ->> 'idempotencyRef'
    from ac265_broker_concurrency_results
    where case_name = 'resolve-replay'
  ),
  'concurrent identical resolve replays return one identical envelope and consume one resolve'
);

select ok(
  (
    select ((result_a ->> 'state' = 'authorized'
             and result_b = '{"status":"conflict"}'::jsonb)
         or (result_b ->> 'state' = 'authorized'
             and result_a = '{"status":"conflict"}'::jsonb))
      and jsonb_array_length(
        coalesce(result_a -> 'handles', result_b -> 'handles')
      ) = 9
      and handle_count = 1
      and role_row_count = 9
      and resolved_count = 0
      and stored_idempotency_ref =
        coalesce(result_a ->> 'idempotencyRef', result_b ->> 'idempotencyRef')
    from ac265_broker_concurrency_results
    where case_name = 'authorize-race'
  ),
  'concurrent distinct-idempotency authorize requests serialize to one nine-role handle set'
  ' and one conflict'
);

select ok(
  (
    select ((result_a ->> 'state' = 'logged_out'
             and result_b = '{"status":"conflict"}'::jsonb)
         or (result_b ->> 'state' = 'logged_out'
             and result_a = '{"status":"conflict"}'::jsonb))
      and handle_count = 1
      and role_row_count = 9
      and resolved_count = 0
      and logged_out_count = 1
      and teardown_ref_count = 1
      and stored_idempotency_ref =
        coalesce(result_a ->> 'idempotencyRef', result_b ->> 'idempotencyRef')
    from ac265_broker_concurrency_results
    where case_name = 'teardown-race'
  ),
  'concurrent distinct-idempotency teardown requests serialize to one logged-out handle and one conflict'
);

select ok(
  (
    select broker_rows = 0
      and role_rows = 0
      and authorization_rows = 0
      and candidate_rows = 0
      and disabled_triggers = 0
    from ac265_broker_concurrency_cleanup
  ),
  'the probe removes its committed fixtures and leaves every private immutability guard enabled'
);

select finish();
rollback;
