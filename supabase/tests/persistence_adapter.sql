begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure('platform_api.accept_job_with_outbox(uuid,uuid,text,uuid,bytea,bytea,timestamptz,uuid,uuid)') is not null,
  'service adapter exposes atomic job acceptance'
);
select ok(
  to_regprocedure('platform_api.claim_outbox_event(uuid,uuid,integer)') is not null
  and to_regprocedure('platform_api.complete_outbox_event(uuid,uuid)') is not null
  and to_regprocedure('platform_api.dead_letter_unknown_outbox_event(uuid,uuid)') is not null,
  'service adapter exposes bounded outbox operations'
);
select ok(
  to_regprocedure('platform_api.claim_job(uuid,bigint,uuid,integer)') is not null
  and to_regprocedure('platform_api.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)') is not null
  and to_regprocedure('platform_api.apply_job_outcome(uuid,bigint,uuid,platform_private.job_state,jsonb,text,boolean)') is not null,
  'service adapter exposes bounded job operations'
);
select ok(
  to_regprocedure('platform_api.begin_restore_fence(bigint,text)') is not null
  and to_regprocedure('platform_api.complete_restore_fence(bigint)') is not null
  and to_regprocedure('platform_api.external_effects_allowed()') is not null,
  'service adapter exposes restore fence operations'
);

select ok(
  not has_table_privilege('service_role', 'platform_private.jobs', 'select')
  and not has_table_privilege('service_role', 'platform_private.outbox_events', 'select'),
  'service role cannot read private tables directly'
);

select ok(
  (select count(*) = 9 from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'platform_api'
     and p.proname in ('accept_job_with_outbox', 'claim_outbox_event', 'complete_outbox_event', 'dead_letter_unknown_outbox_event', 'claim_job', 'apply_job_outcome', 'begin_restore_fence', 'complete_restore_fence')),
  'all mutating adapter entry points are present'
);
select ok(
  (select count(*) = 9 from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'platform_api'
     and p.proname in ('accept_job_with_outbox', 'claim_outbox_event', 'complete_outbox_event', 'dead_letter_unknown_outbox_event', 'claim_job', 'apply_job_outcome', 'begin_restore_fence', 'complete_restore_fence')
     and p.prosecdef
     and coalesce(array_to_string(p.proconfig, ','), '') like 'search_path=%'),
  'mutating adapter functions are definer-pinned to an empty search path'
);

select ok(
  (select bool_and(not has_function_privilege(role_name, function_name, 'execute'))
   from (values
     ('public', 'platform_api.accept_job_with_outbox(uuid,uuid,text,uuid,bytea,bytea,timestamptz,uuid,uuid)'),
     ('anon', 'platform_api.accept_job_with_outbox(uuid,uuid,text,uuid,bytea,bytea,timestamptz,uuid,uuid)'),
     ('authenticated', 'platform_api.accept_job_with_outbox(uuid,uuid,text,uuid,bytea,bytea,timestamptz,uuid,uuid)'),
     ('public', 'platform_api.claim_job(uuid,bigint,uuid,integer)'),
     ('anon', 'platform_api.claim_job(uuid,bigint,uuid,integer)'),
     ('authenticated', 'platform_api.claim_job(uuid,bigint,uuid,integer)'),
     ('public', 'platform_api.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)'),
     ('anon', 'platform_api.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)'),
     ('authenticated', 'platform_api.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)')
   ) as denied(role_name, function_name)),
  'browser and public roles cannot execute service adapters'
);
select ok(
  has_function_privilege('service_role', 'platform_api.accept_job_with_outbox(uuid,uuid,text,uuid,bytea,bytea,timestamptz,uuid,uuid)', 'execute')
  and has_function_privilege('service_role', 'platform_api.claim_job(uuid,bigint,uuid,integer)', 'execute')
  and has_function_privilege('service_role', 'platform_api.claim_outbox_event(uuid,uuid,integer)', 'execute')
  and has_function_privilege('service_role', 'platform_api.apply_job_outcome(uuid,bigint,uuid,platform_private.job_state,jsonb,text,boolean)', 'execute')
  and not has_function_privilege('service_role', 'platform_api.apply_job_outcome(uuid,bigint,platform_private.job_state,jsonb,text,boolean)', 'execute'),
  'only the named service role can execute adapters'
);

set local role service_role;

create temporary table accepted_adapter on commit drop as
select * from platform_api.accept_job_with_outbox(
  '00000000-0000-0000-0000-000000000701'::uuid,
  '00000000-0000-0000-0000-000000000801'::uuid,
  'platform.job.execute',
  '00000000-0000-0000-0000-000000000901'::uuid,
  decode(repeat('11', 32), 'hex'),
  decode(repeat('12', 32), 'hex'),
  clock_timestamp() + interval '29 days',
  '00000000-0000-0000-0000-000000000a01'::uuid,
  '00000000-0000-0000-0000-000000000b01'::uuid
);
select ok((select count(*) = 1 and bool_and(version = 1 and not replayed) from accepted_adapter), 'service adapter returns one bounded acceptance result');

select ok(
  (select count(*) = 1 from platform_api.claim_job(
    '00000000-0000-0000-0000-000000000a01'::uuid, 1,
    '00000000-0000-0000-0000-000000000c01'::uuid, 60
  )),
  'service adapter claims one canonical job lease'
);
select ok(
  (select count(*) = 1 from platform_api.claim_outbox_event(
    '00000000-0000-0000-0000-000000000b01'::uuid,
    '00000000-0000-0000-0000-000000000d01'::uuid, 60
  )),
  'service adapter claims one bounded outbox lease'
);
select ok(
  platform_api.complete_outbox_event(
    '00000000-0000-0000-0000-000000000b01'::uuid,
    '00000000-0000-0000-0000-000000000d01'::uuid
  ),
  'service adapter finalizes an owned outbox lease'
);
select ok(
  platform_api.apply_job_outcome(
    '00000000-0000-0000-0000-000000000a01'::uuid, 2,
    '00000000-0000-0000-0000-000000000c01'::uuid,
    'succeeded'::platform_private.job_state, '{"result":"adapter"}'::jsonb, null, false
  ),
  'service adapter applies a version-matched job outcome'
);

select throws_ok(
  $$select platform_api.apply_job_outcome(
    '00000000-0000-0000-0000-000000000a01'::uuid, 2,
    'succeeded'::platform_private.job_state, '{"result":"legacy"}'::jsonb, null, false)$$,
  '42501', null, 'tokenless outcome adapter is not executable by service_role'
);

select throws_ok(
  $$select * from platform_api.claim_job(
    '00000000-0000-0000-0000-000000000a01'::uuid, 0,
    '00000000-0000-0000-0000-000000000c02'::uuid, 60)$$,
  '22023', null, 'adapter rejects a non-positive expected version'
);
select throws_ok(
  $$select * from platform_api.claim_outbox_event(
    '00000000-0000-0000-0000-000000000b01'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid, 60)$$,
  '22023', null, 'adapter rejects a zero lease token'
);

select ok(platform_api.begin_restore_fence(9701, 'adapter reconciliation test'), 'service adapter begins a restore fence');
select ok(not platform_api.external_effects_allowed(), 'service adapter observes a closed effects fence');
select throws_ok(
  $$select platform_api.complete_restore_fence(9701)$$,
  '42501', null, 'service adapter cannot release a restore fence with an epoch alone'
);
select ok(not platform_api.external_effects_allowed(), 'service adapter observes the unreleased effects fence');

select * from finish();
rollback;
