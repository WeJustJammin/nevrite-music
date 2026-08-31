begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Legacy S04-S06 entry points are retained for SECURITY DEFINER delegation,
-- never as caller-facing authority.  The target-aware/provider-aware wrappers
-- are the only service-role command paths.
select ok(
  (select bool_and(not has_function_privilege('service_role', function_name, 'execute'))
   from (values
     ('platform_private.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_api.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_private.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)'),
     ('platform_private.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)'),
     ('platform_private.apply_provider_operation_outcome(uuid,bigint,platform_private.provider_operation_state,text,text,boolean,timestamptz,timestamptz)'),
     ('platform_private.apply_webhook_receipt_outcome(uuid,platform_private.webhook_receipt_state,platform_private.webhook_receipt_state,uuid,text)'),
     ('platform_api.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)'),
     ('platform_api.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)'),
     ('platform_api.apply_provider_operation_outcome(uuid,bigint,platform_private.provider_operation_state,text,text,boolean,timestamptz,timestamptz)'),
     ('platform_api.apply_webhook_receipt_outcome(uuid,platform_private.webhook_receipt_state,platform_private.webhook_receipt_state,uuid,text)'),
     ('platform_private.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_api.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_private.apply_object_verification(uuid,bigint,platform_private.object_state,text,uuid,uuid)'),
     ('platform_api.apply_object_verification(uuid,bigint,platform_private.object_state,text,uuid,uuid)'),
     ('platform_private.read_consumable_object(uuid)'),
     ('platform_api.read_consumable_object(uuid)')
   ) as legacy(function_name)),
  'all legacy S04-S06 RPC signatures are denied to service_role'
);
select ok(
  (select bool_and(
     has_function_privilege('service_role', function_name, 'execute')
     and not has_function_privilege('anon', function_name, 'execute')
     and not has_function_privilege('authenticated', function_name, 'execute')
   )
   from (values
     ('platform_private.create_upload_intent_authorized(uuid,uuid,text,uuid,bigint,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_private.complete_upload_intent_authorized(uuid,uuid,uuid,bigint,text,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_private.create_provider_operation_authorized(text,text,uuid,uuid,bytea,bytea,jsonb,uuid,uuid,uuid)'),
     ('platform_private.read_provider_operation_authorized(uuid,uuid,uuid)'),
     ('platform_private.apply_provider_operation_outcome_authorized(uuid,uuid,uuid,bigint,platform_private.provider_operation_state,text,text,boolean,timestamptz,timestamptz)'),
     ('platform_private.record_webhook_receipt_authorized(text,text,bytea,text,integer,jsonb,timestamptz,uuid,uuid,uuid,uuid,uuid)'),
     ('platform_private.apply_webhook_receipt_outcome_authorized(uuid,platform_private.webhook_receipt_state,platform_private.webhook_receipt_state,uuid,text,uuid,uuid)'),
     ('platform_api.create_upload_intent_authorized(uuid,uuid,text,uuid,bigint,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_api.complete_upload_intent_authorized(uuid,uuid,uuid,bigint,text,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)'),
     ('platform_api.create_provider_operation_authorized(text,text,uuid,uuid,bytea,bytea,jsonb,uuid,uuid,uuid)'),
     ('platform_api.read_provider_operation_authorized(uuid,uuid,uuid)'),
     ('platform_api.apply_provider_operation_outcome_authorized(uuid,uuid,uuid,bigint,platform_private.provider_operation_state,text,text,boolean,timestamptz,timestamptz)'),
     ('platform_api.record_webhook_receipt_authorized(text,text,bytea,text,integer,jsonb,timestamptz,uuid,uuid,uuid,uuid,uuid)'),
     ('platform_api.apply_webhook_receipt_outcome_authorized(uuid,platform_private.webhook_receipt_state,platform_private.webhook_receipt_state,uuid,text,uuid,uuid)')
   ) as current(function_name)),
  'only authority-revalidating wrappers retain service_role execution'
);

select ok(
  not has_function_privilege('service_role', 'platform_private.complete_restore_fence(bigint)', 'execute')
  and not has_function_privilege('service_role', 'platform_api.complete_restore_fence(bigint)', 'execute')
  and not has_function_privilege('anon', 'platform_private.complete_restore_fence(bigint)', 'execute')
  and not has_function_privilege('authenticated', 'platform_api.complete_restore_fence(bigint)', 'execute'),
  'epoch-only restore release is unavailable to service and browser roles'
);
set local role service_role;
select throws_ok(
  $$select platform_api.complete_restore_fence(98101)$$,
  '42501', null,
  'service_role cannot release a restore fence with an epoch alone'
);
reset role;

-- Build one valid completion and one unrelated, generic job request.  The
-- latter has a valid immutable job.requested event but no object binding and
-- must not be accepted for this object.
create temporary table closure_upload on commit drop as
select * from platform_private.create_upload_intent_authorized(
  '00000000-0000-0000-0000-00000000e101'::uuid,
  '00000000-0000-0000-0000-00000000e102'::uuid,
  'release', '00000000-0000-0000-0000-00000000e103'::uuid, 1,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000e104/source.wav',
  'source-audio', 'audio/wav', 1024,
  decode(repeat('e1', 32), 'hex'), 'standard', 2048,
  array['audio/wav']::text[], clock_timestamp() + interval '14 minutes',
  decode(repeat('e2', 32), 'hex'), decode(repeat('e3', 32), 'hex'),
  '00000000-0000-0000-0000-00000000e104'::uuid,
  '00000000-0000-0000-0000-00000000e105'::uuid,
  '00000000-0000-0000-0000-00000000e106'::uuid
);
create temporary table closure_completion on commit drop as
select * from platform_private.complete_upload_intent_authorized(
  '00000000-0000-0000-0000-00000000e101'::uuid,
  '00000000-0000-0000-0000-00000000e102'::uuid,
  '00000000-0000-0000-0000-00000000e105'::uuid, 1,
  'release', '00000000-0000-0000-0000-00000000e103'::uuid, 1,
  1024, 'audio/wav', decode(repeat('e1', 32), 'hex'), 'local',
  decode(repeat('e7', 32), 'hex'), decode(repeat('e8', 32), 'hex'),
  '00000000-0000-0000-0000-00000000e109'::uuid,
  '00000000-0000-0000-0000-00000000e10a'::uuid,
  '00000000-0000-0000-0000-00000000e10b'::uuid
);
select ok(
  (select object_id = '00000000-0000-0000-0000-00000000e104'::uuid
      and job_id = '00000000-0000-0000-0000-00000000e10a'::uuid
   from closure_completion),
  'authorized completion returns the object-bound verification job'
);
select ok(
  exists (
    select 1
    from platform_private.jobs as job
    join platform_private.outbox_events as event
      on event.id = job.originating_event_id
    where job.id = '00000000-0000-0000-0000-00000000e10a'::uuid
      and event.event_type = 'object.uploaded'
      and event.schema_version = 1
      and event.aggregate_type = 'object_record'
      and event.aggregate_id = '00000000-0000-0000-0000-00000000e104'::uuid
      and event.payload = '{"objectId":"00000000-0000-0000-0000-00000000e104"}'::jsonb
  ),
  'verification job origin is an immutable object-bound outbox event'
);

create temporary table unrelated_job on commit drop as
select * from platform_private.accept_job_with_outbox(
  '00000000-0000-0000-0000-00000000e111'::uuid,
  '00000000-0000-0000-0000-00000000e112'::uuid,
  'platform.object.verify',
  '00000000-0000-0000-0000-00000000e113'::uuid,
  decode(repeat('e4', 32), 'hex'), decode(repeat('e5', 32), 'hex'),
  clock_timestamp() + interval '14 minutes',
  '00000000-0000-0000-0000-00000000e114'::uuid,
  '00000000-0000-0000-0000-00000000e115'::uuid
);
select throws_ok(
  $$select * from platform_private.apply_object_verification(
    '00000000-0000-0000-0000-00000000e104'::uuid, 2,
    'verifying'::platform_private.object_state, null,
    '00000000-0000-0000-0000-00000000e116'::uuid,
    '00000000-0000-0000-0000-00000000e114'::uuid
  )$$,
  'P0001', null,
  'unrelated verification job request is rejected before object mutation'
);
select ok(
  (select state = 'uploaded'::platform_private.object_state and version = 2
   from platform_private.object_records
   where id = '00000000-0000-0000-0000-00000000e104'::uuid),
  'rejected unrelated job leaves the governed object unchanged'
);
select ok(
  (select count(*) = 1 and bool_and(state = 'queued'::platform_private.job_state)
   from platform_private.jobs
   where id = '00000000-0000-0000-0000-00000000e114'::uuid),
  'rejected unrelated job remains untouched'
);

select * from finish();
rollback;
