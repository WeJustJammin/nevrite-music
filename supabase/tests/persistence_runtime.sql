begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure('platform_api.read_authorized_job(uuid,uuid,uuid,text,boolean,text)') is not null,
  'authorized runtime job projection RPC exists'
);
select ok(
  to_regprocedure('platform_api.read_canonical_job(uuid)') is not null,
  'internal canonical runtime job projection RPC exists'
);
select ok(
  to_regprocedure('platform_api.read_restore_fence()') is not null,
  'typed canonical restore-fence RPC exists'
);
select ok(
  to_regprocedure('platform_api.consume_job_read_rate_limit(uuid,uuid)') is not null,
  'shared atomic job-read limiter RPC exists'
);
select ok(
  to_regprocedure('platform_api.claim_outbox_batch(uuid,integer,integer)') is not null,
  'bounded outbox batch claim RPC exists'
);
select ok(
  to_regprocedure('platform_api.complete_outbox_event(uuid,uuid)') is not null,
  'outbox dispatch completion RPC exists'
);
select ok(
  to_regprocedure('platform_api.heartbeat_job_lease(uuid,bigint,uuid,integer)') is not null,
  'job lease heartbeat RPC exists'
);
select ok(
  to_regprocedure('platform_api.record_processed_event(uuid,text,integer,uuid,boolean)') is not null,
  'processed-event idempotency RPC exists'
);
select ok(
  to_regprocedure('platform_api.apply_job_outcome(uuid,bigint,uuid,platform_private.job_state,jsonb,text,boolean)') is not null,
  'lease-token-aware job outcome RPC exists'
);
select ok(
  to_regclass('platform_private.job_read_rate_limits') is not null
  and to_regclass('platform_private.processed_events') is not null
  and to_regclass('platform_private.job_type_registry') is not null,
  'runtime support tables exist in the private schema'
);
select has_column(
  'platform_private',
  'jobs',
  'lease_token',
  'jobs persist the current lease token for CAS heartbeats'
);

select ok(
  (select bool_and(relrowsecurity and relforcerowsecurity)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private'
     and c.relname in ('job_type_registry', 'job_read_rate_limits', 'processed_events')),
  'runtime support tables enable and force RLS'
);
select ok(
  (select bool_and(not has_table_privilege(role_name, table_name, 'select'))
   from (values
     ('public', 'platform_private.job_type_registry'),
     ('anon', 'platform_private.job_type_registry'),
     ('authenticated', 'platform_private.job_type_registry'),
     ('service_role', 'platform_private.job_type_registry'),
     ('public', 'platform_private.job_read_rate_limits'),
     ('anon', 'platform_private.job_read_rate_limits'),
     ('authenticated', 'platform_private.job_read_rate_limits'),
     ('service_role', 'platform_private.job_read_rate_limits'),
     ('public', 'platform_private.processed_events'),
     ('anon', 'platform_private.processed_events'),
     ('authenticated', 'platform_private.processed_events'),
     ('service_role', 'platform_private.processed_events')
   ) as denied(role_name, table_name)),
  'private runtime tables have no direct read grants'
);
select throws_ok(
  $$insert into platform_private.job_type_registry (job_type) values ('9worker')$$,
  '23514', null, 'job type registry rejects keys that do not start with a letter'
);
select throws_ok(
  $$insert into platform_private.job_type_registry (job_type) values (repeat('a', 65))$$,
  '23514', null, 'job type registry rejects keys longer than 64 characters'
);
select ok(
  (select count(*) = 8
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'platform_api'
     and p.proname in (
       'read_canonical_job', 'read_restore_fence', 'read_authorized_job', 'consume_job_read_rate_limit', 'claim_outbox_batch',
       'complete_outbox_event', 'heartbeat_job_lease', 'record_processed_event'
     )
    and p.prosecdef
    and coalesce(array_to_string(p.proconfig, ','), '') like 'search_path=%'),
  'runtime API functions are security definers with an explicit empty search path'
);
select ok(
  (select bool_and(
    has_function_privilege('service_role', p.oid, 'execute')
    and not has_function_privilege('public', p.oid, 'execute')
    and not has_function_privilege('anon', p.oid, 'execute')
    and not has_function_privilege('authenticated', p.oid, 'execute')
  )
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'platform_api'
    and p.proname in (
      'read_canonical_job', 'read_restore_fence', 'read_authorized_job', 'consume_job_read_rate_limit', 'claim_outbox_batch',
      'complete_outbox_event', 'heartbeat_job_lease', 'record_processed_event'
    )),
  'runtime RPCs are executable only by service_role'
);

reset role;
create temporary table accepted_runtime on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000001001'::uuid,
  '00000000-0000-0000-0000-000000001002'::uuid,
  'object.verify',
  '00000000-0000-0000-0000-000000001003'::uuid,
  decode(repeat('21', 32), 'hex'),
  decode(repeat('22', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000001004'::uuid,
  '00000000-0000-0000-0000-000000001005'::uuid
);
select ok(
  (select count(*) = 1 from accepted_runtime
    where job_id = '00000000-0000-0000-0000-000000001004'::uuid)
  and (select count(*) = 1 from platform_private.jobs where id = '00000000-0000-0000-0000-000000001004'::uuid)
  and (select count(*) = 1 from platform_private.outbox_events where id = '00000000-0000-0000-0000-000000001005'::uuid)
  and (select count(*) = 1 from audit_private.audit_events
    where action = 'job.accepted' and decision = 'allowed'
      and reason_code = 'JOB_ACCEPTED' and actor_id = '00000000-0000-0000-0000-000000001001'::uuid
      and acting_party_id = '00000000-0000-0000-0000-000000001002'::uuid
      and target_id = '00000000-0000-0000-0000-000000001004'::uuid),
  'registered object.verify acceptance atomically appends a scrubbed audit row'
);
select throws_ok(
  $$select * from platform_private.accept_job_with_outbox(
    '00000000-0000-0000-0000-000000001011'::uuid,
    '00000000-0000-0000-0000-000000001012'::uuid,
    'platform.unknown',
    '00000000-0000-0000-0000-000000001013'::uuid,
    decode(repeat('23', 32), 'hex'), decode(repeat('24', 32), 'hex'),
    clock_timestamp() + interval '30 days',
    '00000000-0000-0000-0000-000000001014'::uuid,
    '00000000-0000-0000-0000-000000001015'::uuid
  )$$,
  '22023', null,
  'unregistered job types are rejected before canonical or audit writes'
);
select ok(
  not exists (select 1 from platform_private.jobs where id = '00000000-0000-0000-0000-000000001014'::uuid)
  and not exists (select 1 from audit_private.audit_events where target_id = '00000000-0000-0000-0000-000000001014'::uuid),
  'rejected job type leaves no job or audit row'
);

set local role service_role;
select ok(
  (select expected_epoch = consumer_epoch
    and integrity_verified
    and reconciliation_complete
   from platform_api.read_restore_fence()),
  'typed restore-fence baseline starts with matching epochs and open admission'
);
reset role;
select ok(
  platform_private.begin_restore_fence(7, 'runtime restore test'),
  'restore fence can enter reconciliation before releasing the checkpoint'
);
set local role service_role;
select ok(
  (select expected_epoch = 7
    and consumer_epoch is null
    and not integrity_verified
    and not reconciliation_complete
   from platform_api.read_restore_fence()),
  'typed restore-fence snapshot rejects a missing consumer checkpoint while reconciling'
);
reset role;
select ok(
  platform_private.complete_restore_fence(7),
  'restore fence release advances the consumer checkpoint'
);
set local role service_role;
select ok(
  (select expected_epoch = consumer_epoch
    and expected_epoch = 7
    and integrity_verified
    and reconciliation_complete
   from platform_api.read_restore_fence()),
  'typed restore-fence snapshot opens only after matching checkpoint release'
);
select throws_ok(
  $$select platform_private.begin_restore_fence(6, 'stale restore test')$$,
  '22023', null,
  'restore fence rejects an older epoch after a newer checkpoint is released'
);
set local role postgres;
select ok(
  not exists (
    select 1 from platform_private.restore_fences where restore_epoch = 6
  ),
  'rejected older restore epoch is not inserted'
);
select ok(
  not platform_private.begin_restore_fence(7, 'released epoch replay'),
  'restore fence rejects replay of the current released epoch'
);
select ok(
  (select count(*) = 1 and bool_and(state = 'released'::platform_private.restore_fence_state)
   from platform_private.restore_fences
   where restore_epoch = 7),
  'released restore epoch remains a single immutable checkpoint'
);
set local role service_role;
select ok(
  (select count(*) = 1 from platform_api.read_canonical_job(
     '00000000-0000-0000-0000-000000001004'::uuid)
   where id = '00000000-0000-0000-0000-000000001004'::uuid
     and type = 'object.verify' and state = 'queued' and version = 1),
  'internal runtime read returns one bounded canonical job snapshot'
);
select ok(
  (select count(*) = 1 from platform_api.read_authorized_job(
     '00000000-0000-0000-0000-000000001004'::uuid,
     '00000000-0000-0000-0000-000000001001'::uuid,
     null, null, false, null)
   where job_id = '00000000-0000-0000-0000-000000001004'::uuid
     and actor_id = '00000000-0000-0000-0000-000000001001'::uuid
     and state = 'queued' and version = 1),
  'authorized runtime owner read returns one bounded canonical record'
);
select ok(
  not exists (select 1 from platform_api.read_authorized_job(
    '00000000-0000-0000-0000-000000001004'::uuid,
    '00000000-0000-0000-0000-000000001099'::uuid,
    null, null, false, null)),
  'wrong actor cannot read a job projection'
);
select ok(
  (select count(*) = 1 from platform_api.read_authorized_job(
    '00000000-0000-0000-0000-000000001004'::uuid,
    '00000000-0000-0000-0000-000000001099'::uuid,
    '00000000-0000-0000-0000-000000001002'::uuid,
    'jobs.read', false, null)),
  'acting-party capability permits the matching party only'
);
select ok(
  (select count(*) = 1 from platform_api.read_authorized_job(
    '00000000-0000-0000-0000-000000001004'::uuid,
    '00000000-0000-0000-0000-000000001099'::uuid,
    null, 'jobs.read:any', true, 'support case 001'))
  and not exists (select 1 from platform_api.read_authorized_job(
    '00000000-0000-0000-0000-000000001004'::uuid,
    '00000000-0000-0000-0000-000000001099'::uuid,
    null, 'jobs.read:any', false, 'support case 001')),
  'operator reads require named capability, recent step-up, and reason'
);

select ok(
  (select allowed and limit_value = 300 and remaining = 299 and scope = 'user'
   from platform_api.consume_job_read_rate_limit(
     '00000000-0000-0000-0000-000000001001'::uuid, null)),
  'job-read limiter atomically admits a user request at the fixed user ceiling'
);
select ok(
  (select allowed and limit_value = 600 and remaining = 599 and scope = 'party'
   from platform_api.consume_job_read_rate_limit(
     '00000000-0000-0000-0000-000000001001'::uuid,
     '00000000-0000-0000-0000-000000001002'::uuid)),
  'job-read limiter atomically admits a party request and tracks both scopes'
);
reset role;
insert into platform_private.job_read_rate_limits (scope, scope_id, window_started_at, request_count)
values (
  'user', '00000000-0000-0000-0000-000000001001'::uuid,
  date_trunc('minute', clock_timestamp()), 300
)
on conflict (scope, scope_id, window_started_at) do update set request_count = 300;
set local role service_role;
select ok(
  (select not allowed and limit_value = 300 and remaining = 0 and scope = 'user'
   from platform_api.consume_job_read_rate_limit(
     '00000000-0000-0000-0000-000000001001'::uuid, null)),
  'job-read limiter rejects an exhausted user window without incrementing it'
);

reset role;
create temporary table claimed_runtime_batch on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000001021'::uuid,
  '00000000-0000-0000-0000-000000001022'::uuid,
  'object.verify',
  '00000000-0000-0000-0000-000000001023'::uuid,
  decode(repeat('25', 32), 'hex'), decode(repeat('26', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000001024'::uuid,
  '00000000-0000-0000-0000-000000001025'::uuid
);
set local role service_role;
create temporary table runtime_batch on commit drop as
select * from platform_api.claim_outbox_batch(
  '00000000-0000-0000-0000-000000001026'::uuid, 60, 1
);
select ok(
  (select count(*) = 1 from runtime_batch
   where lease_token = '00000000-0000-0000-0000-000000001026'::uuid
     and dispatch_attempt_count = 1 and aggregate_version > 0),
  'outbox batch claim returns one bounded metadata-only lease'
);
select ok(
  (select pg_get_function_result(p.oid) not like '%payload%'
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'platform_api' and p.proname = 'claim_outbox_batch'),
  'outbox batch projection excludes raw payloads'
);
select ok(
  platform_api.complete_outbox_event(
    (select event_id from runtime_batch),
    '00000000-0000-0000-0000-000000001026'::uuid
  )
  and not platform_api.complete_outbox_event(
    (select event_id from runtime_batch),
    '00000000-0000-0000-0000-000000001026'::uuid
  ),
  'outbox completion accepts the owning lease once and is idempotent thereafter'
);
select throws_ok(
  $$select * from platform_api.claim_outbox_batch(
    '00000000-0000-0000-0000-000000000000'::uuid, 60, 1)$$,
  '22023', null, 'batch claim rejects a zero lease token'
);

reset role;
insert into platform_private.outbox_events (
  id, event_type, schema_version, aggregate_type, aggregate_id,
  aggregate_version, correlation_id, payload, occurred_at
)
values (
  '00000000-0000-4000-8000-000000002025'::uuid, 'object.uploaded', 1, 'object',
  '00000000-0000-4000-8000-000000002026'::uuid, 1,
  '00000000-0000-4000-8000-000000002027'::uuid,
  jsonb_build_object('objectId', '00000000-0000-4000-8000-000000002026'::uuid),
  clock_timestamp()
);
set local role service_role;
create temporary table filtered_runtime_batch on commit drop as
select * from platform_api.claim_outbox_batch(
  '00000000-0000-4000-8000-000000002028'::uuid, 60, 100
);
select ok(
  not exists (select 1 from filtered_runtime_batch
    where event_id = '00000000-0000-4000-8000-000000002025'::uuid),
  'outbox batch claim excludes events outside the platform job consumer tuple'
);
reset role;
select ok(
  (select dispatch_lease_token is null from platform_private.outbox_events
   where id = '00000000-0000-4000-8000-000000002025'::uuid),
  'outbox events for other consumers remain unleased'
);

reset role;
create temporary table runtime_job_claim on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000001031'::uuid,
  '00000000-0000-0000-0000-000000001032'::uuid,
  'object.verify',
  '00000000-0000-0000-0000-000000001033'::uuid,
  decode(repeat('27', 32), 'hex'), decode(repeat('28', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000001034'::uuid,
  '00000000-0000-0000-0000-000000001035'::uuid
);
select * into temporary runtime_lease from platform_private.claim_job(
  '00000000-0000-0000-0000-000000001034'::uuid, 1,
  '00000000-0000-0000-0000-000000001036'::uuid, 60
);
set local role service_role;
select ok(
  platform_api.heartbeat_job_lease(
    '00000000-0000-0000-0000-000000001034'::uuid,
    2,
    '00000000-0000-0000-0000-000000001036'::uuid,
    60
  )
  and not platform_api.heartbeat_job_lease(
    '00000000-0000-0000-0000-000000001034'::uuid,
    2,
    '00000000-0000-0000-0000-000000001036'::uuid,
    60
  ),
  'job heartbeat extends only the current lease and expected version'
);
reset role;
select ok(
  (select version = 3 and lease_token = '00000000-0000-0000-0000-000000001036'::uuid
   from platform_private.jobs where id = '00000000-0000-0000-0000-000000001034'::uuid),
  'heartbeat increments the canonical version while retaining the lease token'
);
set local role service_role;
select ok(
  not platform_api.apply_job_outcome(
    '00000000-0000-0000-0000-000000001034'::uuid, 3,
    '00000000-0000-0000-0000-000000001099'::uuid,
    'succeeded'::platform_private.job_state, '{"ok":false}'::jsonb, null, false
  ),
  'job outcome rejects a non-owning lease token without changing canonical state'
);
select ok(
  platform_api.apply_job_outcome(
    '00000000-0000-0000-0000-000000001034'::uuid, 3,
    '00000000-0000-0000-0000-000000001036'::uuid,
    'succeeded'::platform_private.job_state, '{"ok":true}'::jsonb, null, false
  ),
  'terminal outcome clears the heartbeat token and closes the job'
);
reset role;
select ok(
  (select state = 'succeeded' and version = 4 and lease_token is null
   from platform_private.jobs where id = '00000000-0000-0000-0000-000000001034'::uuid),
  'terminal outcome clears the heartbeat token and closes the job'
);
set local role service_role;

select is(
  platform_api.record_processed_event(
    '00000000-0000-0000-0000-000000001041'::uuid,
    'job.requested', 1, '00000000-0000-0000-0000-000000001034'::uuid, false
  ),
  'recorded',
  'processed-event RPC records a new event identity'
);
select is(
  platform_api.record_processed_event(
    '00000000-0000-0000-0000-000000001041'::uuid,
    'job.requested', 1, '00000000-0000-0000-0000-000000001034'::uuid, false
  ),
  'duplicate',
  'processed-event RPC makes identical delivery a no-op'
);
select throws_ok(
  $$select platform_api.record_processed_event(
    '00000000-0000-0000-0000-000000001041'::uuid,
    'job.requested', 1, '00000000-0000-0000-0000-000000001099'::uuid, false)$$,
  'P0001', null, 'processed-event identity conflicts cannot be replayed as duplicates'
);
select throws_ok(
  $$select platform_api.record_processed_event(
    '00000000-0000-0000-0000-000000001042'::uuid,
    'job.requested', 2, '00000000-0000-0000-0000-000000001034'::uuid, false)$$,
  '22023', null, 'processed-event RPC rejects unregistered schema versions'
);
reset role;
select ok(
  (select count(*) = 1 from platform_private.processed_events
   where event_id = '00000000-0000-0000-0000-000000001041'::uuid),
  'processed-event dedupe stores one immutable event row'
);

select * from finish();
rollback;
