begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('platform_private', 'jobs', 'jobs table exists in the private schema');
select has_table('platform_private', 'outbox_events', 'outbox table exists in the private schema');
select has_table('platform_private', 'idempotency_records', 'idempotency table exists in the private schema');
select has_table('platform_private', 'restore_fences', 'restore fence table exists in the private schema');
select has_table('audit_private', 'audit_events', 'audit table exists in the private schema');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'platform_private' and c.relname = 'jobs'), 'jobs enables RLS');
select ok((select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'platform_private' and c.relname = 'jobs'), 'jobs forces RLS');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'platform_private' and c.relname = 'outbox_events'), 'outbox enables RLS');
select ok((select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'platform_private' and c.relname = 'outbox_events'), 'outbox forces RLS');
select ok(not has_table_privilege('anon', 'platform_private.jobs', 'select') and not has_table_privilege('authenticated', 'platform_private.jobs', 'select'), 'browser roles cannot read jobs directly');
select ok(not has_table_privilege('anon', 'platform_private.outbox_events', 'select') and not has_table_privilege('authenticated', 'platform_private.outbox_events', 'select'), 'browser roles cannot read outbox directly');
select ok(not has_table_privilege('anon', 'platform_private.idempotency_records', 'select') and not has_table_privilege('authenticated', 'platform_private.idempotency_records', 'select'), 'browser roles cannot read idempotency directly');
select ok(not has_table_privilege('anon', 'audit_private.audit_events', 'select') and not has_table_privilege('authenticated', 'audit_private.audit_events', 'select'), 'browser roles cannot read audit directly');
select ok(to_regprocedure('platform_private.accept_job_with_outbox(uuid,uuid,text,uuid,bytea,bytea,timestamptz,uuid,uuid)') is not null, 'atomic job acceptance function exists');
select ok(to_regprocedure('platform_private.claim_outbox_event(uuid,uuid,integer)') is not null, 'outbox lease function exists');
select ok(to_regprocedure('platform_private.claim_job(uuid,bigint,uuid,integer)') is not null, 'job lease function exists');
select ok(to_regprocedure('platform_private.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)') is not null, 'job CAS outcome function exists');
select ok(to_regprocedure('platform_private.apply_job_outcome(uuid,bigint,uuid,platform_private.job_state,jsonb,text,boolean)') is not null, 'lease-token-aware job CAS outcome function exists');
select ok(
  not has_function_privilege('service_role', 'platform_private.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)', 'execute')
  and has_function_privilege('service_role', 'platform_private.apply_job_outcome(uuid,bigint,uuid,platform_private.job_state,jsonb,text,boolean)', 'execute'),
  'service role can execute only the lease-token-aware private outcome function'
);
select ok(to_regprocedure('platform_private.begin_restore_fence(bigint,text)') is not null and to_regprocedure('platform_private.external_effects_allowed()') is not null, 'restore fence functions exist');

create temporary table accepted_a on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000101'::uuid,
  '00000000-0000-0000-0000-000000000201'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000301'::uuid,
  decode(repeat('01', 32), 'hex'),
  decode(repeat('02', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000000401'::uuid,
  '00000000-0000-0000-0000-000000000501'::uuid
);
select ok(
  (select count(*) = 1 from platform_private.jobs where id = '00000000-0000-0000-0000-000000000401'::uuid and state = 'queued' and version = 1 and originating_event_id = '00000000-0000-0000-0000-000000000501'::uuid)
  and (select count(*) = 1 from platform_private.outbox_events where id = '00000000-0000-0000-0000-000000000501'::uuid and aggregate_id = '00000000-0000-0000-0000-000000000401'::uuid and aggregate_version = 1 and payload = jsonb_build_object('jobType', 'platform.job.execute', 'jobId', '00000000-0000-0000-0000-000000000401'::uuid))
  and (select state = 'completed' from platform_private.idempotency_records where actor_id = '00000000-0000-0000-0000-000000000101'::uuid and operation = 'platform.job.execute')
  , 'P1-S03-AC-029 atomic acceptance commits job, outbox, idempotency, and initial positive version');

create temporary table claim_a on commit drop as
select * from platform_private.claim_outbox_event('00000000-0000-0000-0000-000000000501'::uuid, '00000000-0000-0000-0000-000000000601'::uuid, 60);
update platform_private.outbox_events set dispatch_lease_until = clock_timestamp() - interval '1 second' where id = '00000000-0000-0000-0000-000000000501'::uuid;
create temporary table claim_a_retry on commit drop as
select * from platform_private.claim_outbox_event('00000000-0000-0000-0000-000000000501'::uuid, '00000000-0000-0000-0000-000000000602'::uuid, 60);
select ok(
  (select aggregate_version = 1 and lease_token = '00000000-0000-0000-0000-000000000602'::uuid from claim_a_retry)
  and (select dispatch_attempt_count = 2 and dispatched_at is null from platform_private.outbox_events where id = '00000000-0000-0000-0000-000000000501'::uuid)
  , 'P1-S03-AC-024 outbox replay reclaims an expired lease and carries the canonical aggregate version');

create temporary table accepted_b on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000102'::uuid,
  '00000000-0000-0000-0000-000000000202'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000302'::uuid,
  decode(repeat('03', 32), 'hex'),
  decode(repeat('04', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000000402'::uuid,
  '00000000-0000-0000-0000-000000000502'::uuid
);
select * from platform_private.claim_outbox_event('00000000-0000-0000-0000-000000000502'::uuid, '00000000-0000-0000-0000-000000000602'::uuid, 60);
select ok(
  platform_private.complete_outbox_event('00000000-0000-0000-0000-000000000502'::uuid, '00000000-0000-0000-0000-000000000602'::uuid)
  , 'P1-S03-AC-032 dispatch completion records one durable effect');
select ok(
  (select dispatch_attempt_count = 1 and dispatched_at is not null from platform_private.outbox_events where id = '00000000-0000-0000-0000-000000000502'::uuid)
  , 'completed outbox event retains one dispatch attempt');
select ok(
  not platform_private.complete_outbox_event('00000000-0000-0000-0000-000000000502'::uuid, '00000000-0000-0000-0000-000000000602'::uuid)
  , 'repeated outbox completion is an idempotent no-op');

create temporary table accepted_c on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000103'::uuid,
  '00000000-0000-0000-0000-000000000203'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000303'::uuid,
  decode(repeat('05', 32), 'hex'),
  decode(repeat('06', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000000403'::uuid,
  '00000000-0000-0000-0000-000000000503'::uuid
);
select * from platform_private.claim_job('00000000-0000-0000-0000-000000000403'::uuid, 1, '00000000-0000-0000-0000-000000000603'::uuid, 60);
select ok(
  platform_private.apply_job_outcome('00000000-0000-0000-0000-000000000403'::uuid, 2, '00000000-0000-0000-0000-000000000603'::uuid, 'succeeded'::platform_private.job_state, '{"result":"done"}'::jsonb, null, false)
  , 'P1-S03-AC-025 queue replay commits the canonical terminal outcome');
select ok(
  not platform_private.apply_job_outcome('00000000-0000-0000-0000-000000000403'::uuid, 2, '00000000-0000-0000-0000-000000000603'::uuid, 'queued'::platform_private.job_state, null, null, true)
  and (select state = 'succeeded' and version = 3 and result_ref = '{"result":"done"}'::jsonb from platform_private.jobs where id = '00000000-0000-0000-0000-000000000403'::uuid)
  , 'stale queue replay cannot reopen a terminal job');

create temporary table accepted_d on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000104'::uuid,
  '00000000-0000-0000-0000-000000000204'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000304'::uuid,
  decode(repeat('07', 32), 'hex'),
  decode(repeat('08', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000000404'::uuid,
  '00000000-0000-0000-0000-000000000504'::uuid
);
select * from platform_private.claim_job('00000000-0000-0000-0000-000000000404'::uuid, 1, '00000000-0000-0000-0000-000000000604'::uuid, 60);
select ok(
  not platform_private.apply_job_outcome('00000000-0000-0000-0000-000000000404'::uuid, 1, '00000000-0000-0000-0000-000000000604'::uuid, 'queued'::platform_private.job_state, null, null, true)
  and (select state = 'running' and version = 2 from platform_private.jobs where id = '00000000-0000-0000-0000-000000000404'::uuid)
  , 'P1-S03-AC-033 stale out-of-order delivery cannot regress canonical job state');

create temporary table accepted_e on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000105'::uuid,
  '00000000-0000-0000-0000-000000000205'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000305'::uuid,
  decode(repeat('09', 32), 'hex'),
  decode(repeat('0a', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000000405'::uuid,
  '00000000-0000-0000-0000-000000000505'::uuid
);
select * from platform_private.claim_job('00000000-0000-0000-0000-000000000405'::uuid, 1, '00000000-0000-0000-0000-000000000605'::uuid, 60);
update platform_private.jobs set lease_until = clock_timestamp() - interval '1 second' where id = '00000000-0000-0000-0000-000000000405'::uuid;
create temporary table claim_e_retry on commit drop as
select * from platform_private.claim_job('00000000-0000-0000-0000-000000000405'::uuid, 2, '00000000-0000-0000-0000-000000000606'::uuid, 60);
select ok(
  (select attempt_count = 2 and version = 3 and state = 'running' from claim_e_retry)
  , 'P1-S03-AC-034 an expired worker lease permits a later canonical-state attempt');

create temporary table accepted_f on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000106'::uuid,
  '00000000-0000-0000-0000-000000000206'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000306'::uuid,
  decode(repeat('0b', 32), 'hex'),
  decode(repeat('0c', 32), 'hex'),
  clock_timestamp() + interval '30 days',
  '00000000-0000-0000-0000-000000000406'::uuid,
  '00000000-0000-0000-0000-000000000506'::uuid
);
select ok(platform_private.begin_restore_fence(9001, 'local reconciliation test'), 'restore fence starts');
select ok(not platform_private.external_effects_allowed(), 'restore fence closes external effects');
select ok(not exists (select 1 from platform_private.claim_outbox_event('00000000-0000-0000-0000-000000000506'::uuid, '00000000-0000-0000-0000-000000000607'::uuid, 60)), 'fenced outbox event cannot be claimed');
select ok(platform_private.complete_restore_fence(9001), 'restore reconciliation releases the fence');
select ok(platform_private.external_effects_allowed(), 'P1-S03-AC-027 restore epoch fences consumers and sends until reconciliation completes');

insert into platform_private.outbox_events (id, event_type, schema_version, aggregate_type, aggregate_id, aggregate_version, correlation_id, payload)
values ('00000000-0000-0000-0000-000000000507'::uuid, 'job.requested', 99, 'job', '00000000-0000-0000-0000-000000000407'::uuid, 1, '00000000-0000-0000-0000-000000000307'::uuid, '{"jobId":"00000000-0000-0000-0000-000000000407","jobType":"platform.job.execute"}'::jsonb);
select * from platform_private.claim_outbox_event('00000000-0000-0000-0000-000000000507'::uuid, '00000000-0000-0000-0000-000000000608'::uuid, 60);
select ok(
  platform_private.dead_letter_unknown_outbox_event('00000000-0000-0000-0000-000000000507'::uuid, '00000000-0000-0000-0000-000000000608'::uuid)
  , 'unknown event schema is dead-lettered');
select ok(
  (select last_dispatch_error_code = 'UNKNOWN_SCHEMA_VERSION' and dead_lettered_at is not null and dispatched_at is not null from platform_private.outbox_events where id = '00000000-0000-0000-0000-000000000507'::uuid)
  and not exists (select 1 from platform_private.jobs where originating_event_id = '00000000-0000-0000-0000-000000000507'::uuid)
  , 'P1-S03-AC-036 unknown event schema versions dead-letter without execution');

select throws_ok($$update platform_private.outbox_events set aggregate_version = 2 where id = '00000000-0000-0000-0000-000000000501'::uuid$$, 'P0001', null, 'outbox identity and aggregate version are immutable');
select throws_ok($$update platform_private.jobs set state = 'queued' where id = '00000000-0000-0000-0000-000000000403'::uuid$$, 'P0001', null, 'terminal job state is immutable');

select * from finish();
rollback;
