begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_column(
  'platform_private',
  'object_records',
  'observed_byte_size',
  'object records retain provider-observed byte metadata'
);
select has_column(
  'platform_private',
  'object_records',
  'observed_media_type',
  'object records retain provider-observed media metadata'
);
select has_column(
  'platform_private',
  'object_records',
  'observed_checksum',
  'object records retain provider-observed checksum metadata'
);
select ok(
  (select relrowsecurity and relforcerowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'object_records'),
  'object records remain forced-RLS private state'
);
select ok(
  (select bool_and(not has_table_privilege(role_name, table_name, 'select'))
   from (values
     ('public'::name, 'platform_private.object_records'::text),
     ('anon'::name, 'platform_private.object_records'::text),
     ('authenticated'::name, 'platform_private.object_records'::text),
     ('service_role'::name, 'platform_private.object_records'::text),
     ('public'::name, 'platform_private.jobs'::text),
     ('anon'::name, 'platform_private.jobs'::text),
     ('authenticated'::name, 'platform_private.jobs'::text),
     ('service_role'::name, 'platform_private.jobs'::text),
     ('public'::name, 'platform_private.outbox_events'::text),
     ('anon'::name, 'platform_private.outbox_events'::text),
     ('authenticated'::name, 'platform_private.outbox_events'::text),
     ('service_role'::name, 'platform_private.outbox_events'::text)
   ) private_tables(role_name, table_name)),
  'browser and service roles cannot select private completion tables directly'
);
select ok(
  not exists (
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform_private'
      and c.relname = 'object_records'
      and a.attnum > 0
      and not a.attisdropped
      and a.attname ilike '%url%'
  ),
  'completion authority has no signed URL persistence column'
);

select ok(
  to_regprocedure('platform_private.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)') is not null,
  'upload completion RPC exists'
);
select ok(
  to_regprocedure('platform_private.apply_object_verification(uuid,bigint,platform_private.object_state,text,uuid,uuid)') is not null,
  'object verification CAS RPC exists'
);
select ok(
  to_regprocedure('platform_private.read_consumable_object(uuid)') is not null,
  'ready-only object projection RPC exists'
);
select ok(
  to_regprocedure('platform_api.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_api.apply_object_verification(uuid,bigint,platform_private.object_state,text,uuid,uuid)') is not null
  and to_regprocedure('platform_api.read_consumable_object(uuid)') is not null,
  'completion API adapters exist'
);
select ok(
  not has_function_privilege('service_role', 'platform_private.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('public', 'platform_private.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_private.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_private.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute'),
  'legacy completion private RPC is denied to caller roles'
);
select ok(
  not has_function_privilege('service_role', 'platform_api.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('public', 'platform_api.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_api.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_api.complete_upload_intent(uuid,uuid,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute'),
  'legacy completion API adapter is denied to caller roles'
);

select ok(
  not has_function_privilege('service_role', 'platform_private.apply_object_verification(uuid,bigint,platform_private.object_state,text,uuid,uuid)', 'execute')
  and not has_function_privilege('service_role', 'platform_private.read_consumable_object(uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_private.apply_object_verification(uuid,bigint,platform_private.object_state,text,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_private.read_consumable_object(uuid)', 'execute'),
  'legacy verification and ready-only RPCs are denied to caller roles'
);

create temporary table completion_first on commit drop as
select * from platform_private.create_upload_intent(
  '00000000-0000-0000-0000-00000000a501'::uuid,
  '00000000-0000-0000-0000-00000000a502'::uuid,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000a505/source.wav',
  'source-audio',
  'audio/wav',
  1024,
  decode(repeat('a1', 32), 'hex'),
  'standard',
  2048,
  array['audio/wav', 'audio/mpeg']::text[],
  clock_timestamp() + interval '14 minutes',
  decode(repeat('a2', 32), 'hex'),
  decode(repeat('a3', 32), 'hex'),
  '00000000-0000-0000-0000-00000000a505'::uuid,
  '00000000-0000-0000-0000-00000000a506'::uuid,
  '00000000-0000-0000-0000-00000000a507'::uuid
);

create temporary table completion_result on commit drop as
select * from platform_private.complete_upload_intent(
  '00000000-0000-0000-0000-00000000a501'::uuid,
  '00000000-0000-0000-0000-00000000a502'::uuid,
  '00000000-0000-0000-0000-00000000a506'::uuid,
  1,
  1024,
  'audio/wav',
  decode(repeat('a1', 32), 'hex'),
  'fake',
  decode(repeat('a8', 32), 'hex'),
  decode(repeat('a9', 32), 'hex'),
  '00000000-0000-0000-0000-00000000a50a'::uuid,
  '00000000-0000-0000-0000-00000000a50b'::uuid,
  '00000000-0000-0000-0000-00000000a50c'::uuid
);
select is((select job_id from completion_result), '00000000-0000-0000-0000-00000000a50b'::uuid, 'completion returns the verification job ID');
select is((select event_id from completion_result), '00000000-0000-0000-0000-00000000a50c'::uuid, 'completion returns the committed upload event ID');
select is((select object_id from completion_result), '00000000-0000-0000-0000-00000000a505'::uuid, 'completion returns the governing object ID');
select is((select object_version from completion_result), 2::bigint, 'completion advances the object version with CAS');
select is((select replayed from completion_result), false, 'first completion is not replayed');
select ok(
  (select state = 'uploaded'::platform_private.object_state
      and version = 2
      and observed_byte_size = 1024
      and observed_media_type = 'audio/wav'
      and observed_checksum = decode(repeat('a1', 32), 'hex')
   from platform_private.object_records
   where id = '00000000-0000-0000-0000-00000000a505'::uuid),
  'completion atomically records provider metadata and uploaded state'
);
select ok(
  (select state = 'consumed'::platform_private.upload_intent_state
   from platform_private.upload_intents
   where id = '00000000-0000-0000-0000-00000000a506'::uuid),
  'completion consumes the one-shot upload intent'
);
select ok(
  (select job_type = 'platform.object.verify'
      and state = 'queued'::platform_private.job_state
      and version = 1
      and originating_event_id = '00000000-0000-0000-0000-00000000a50c'::uuid
   from platform_private.jobs
   where id = '00000000-0000-0000-0000-00000000a50b'::uuid),
  'completion enqueues one queued verification job linked to its event'
);
select ok(
  (select event_type = 'object.uploaded'
      and schema_version = 1
      and aggregate_type = 'object_record'
      and aggregate_id = '00000000-0000-0000-0000-00000000a505'::uuid
      and aggregate_version = 2
      and payload = jsonb_build_object('objectId', '00000000-0000-0000-0000-00000000a505'::uuid)
   from platform_private.outbox_events
   where id = '00000000-0000-0000-0000-00000000a50c'::uuid),
  'completion enqueues the strict object.uploaded/1 event atomically'
);
select is(
  (select count(*) from platform_private.outbox_events where aggregate_id = '00000000-0000-0000-0000-00000000a505'::uuid),
  1::bigint,
  'completion creates no duplicate object event'
);
select ok(
  (select response_ref->>'status' = '202'
      and response_ref->>'jobRef' = '00000000-0000-0000-0000-00000000a50b'
      and response_ref::text not ilike '%url%'
   from platform_private.idempotency_records
   where actor_id = '00000000-0000-0000-0000-00000000a501'::uuid
     and operation = 'platform.upload-intent.complete'
     and key_hash = decode(repeat('a8', 32), 'hex')),
  'completion idempotency stores only a safe status and job reference'
);
select ok(
  exists (
    select 1 from audit_private.audit_events
    where action = 'upload.completion.accepted'
      and target_id = '00000000-0000-0000-0000-00000000a505'::uuid
      and reason_code = 'UPLOAD_COMPLETION_ACCEPTED'
  ),
  'completion appends immutable audit evidence in the same transaction'
);
select is(
  (select count(*) from platform_private.read_consumable_object('00000000-0000-0000-0000-00000000a505'::uuid)),
  0::bigint,
  'uploaded objects are not consumable before verification'
);

create temporary table completion_replay on commit drop as
select * from platform_private.complete_upload_intent(
  '00000000-0000-0000-0000-00000000a501'::uuid,
  '00000000-0000-0000-0000-00000000a502'::uuid,
  '00000000-0000-0000-0000-00000000a506'::uuid,
  1,
  1024,
  'audio/wav',
  decode(repeat('a1', 32), 'hex'),
  'fake',
  decode(repeat('a8', 32), 'hex'),
  decode(repeat('a9', 32), 'hex'),
  '00000000-0000-0000-0000-00000000affa'::uuid,
  '00000000-0000-0000-0000-00000000affb'::uuid,
  '00000000-0000-0000-0000-00000000affc'::uuid
);
select is((select job_id from completion_replay), '00000000-0000-0000-0000-00000000a50b'::uuid, 'same completion binding replays the original job');
select is((select event_id from completion_replay), '00000000-0000-0000-0000-00000000a50c'::uuid, 'same completion binding replays the original event');
select is((select replayed from completion_replay), true, 'matching completion retry is marked replayed');
select is((select count(*) from platform_private.jobs where id = '00000000-0000-0000-0000-00000000a50b'::uuid), 1::bigint, 'matching retry creates no second verifier job');
select throws_ok($$
  select * from platform_private.complete_upload_intent(
    '00000000-0000-0000-0000-00000000a501'::uuid,
    '00000000-0000-0000-0000-00000000a502'::uuid,
    '00000000-0000-0000-0000-00000000a506'::uuid,
    1, 1024, 'audio/wav', decode(repeat('a1', 32), 'hex'), 'fake',
    decode(repeat('a8', 32), 'hex'), decode(repeat('ff', 32), 'hex'),
    '00000000-0000-0000-0000-00000000af01'::uuid,
    '00000000-0000-0000-0000-00000000af02'::uuid,
    '00000000-0000-0000-0000-00000000af03'::uuid
  )
$$, 'P0001', null, 'same completion key with a different body is rejected');
select throws_ok($$
  select * from platform_private.complete_upload_intent(
    '00000000-0000-0000-0000-00000000af11'::uuid,
    '00000000-0000-0000-0000-00000000a502'::uuid,
    '00000000-0000-0000-0000-00000000a506'::uuid,
    1, 1024, 'audio/wav', decode(repeat('a1', 32), 'hex'), 'production',
    decode(repeat('b8', 32), 'hex'), decode(repeat('b9', 32), 'hex'),
    '00000000-0000-0000-0000-00000000af12'::uuid,
    '00000000-0000-0000-0000-00000000af13'::uuid,
    '00000000-0000-0000-0000-00000000af14'::uuid
  )
$$, '22023', null, 'completion fails closed when a production adapter is supplied');
select throws_ok($$
  select * from platform_private.complete_upload_intent(
    '00000000-0000-0000-0000-00000000a501'::uuid,
    '00000000-0000-0000-0000-00000000a502'::uuid,
    '00000000-0000-0000-0000-00000000a506'::uuid,
    1, 1024, 'audio/wav', decode(repeat('a1', 32), 'hex'), 'fake',
    decode(repeat('c8', 32), 'hex'), decode(repeat('c9', 32), 'hex'),
    '00000000-0000-0000-0000-00000000af21'::uuid,
    '00000000-0000-0000-0000-00000000af22'::uuid,
    '00000000-0000-0000-0000-00000000af23'::uuid
  )
$$, 'P0001', null, 'a consumed intent cannot start another verifier');

create temporary table verification_started on commit drop as
select * from platform_private.apply_object_verification(
  '00000000-0000-0000-0000-00000000a505'::uuid,
  2,
  'verifying'::platform_private.object_state,
  null,
  '00000000-0000-0000-0000-00000000a50d'::uuid,
  '00000000-0000-0000-0000-00000000a50b'::uuid
);
select is((select state from verification_started), 'verifying'::platform_private.object_state, 'verifier claims uploaded object with a CAS transition');
select is((select version from verification_started), 3::bigint, 'verification start increments the object version');
select is((select applied from verification_started), true, 'verification start reports an applied transition');
select ok(
  (select state = 'running'::platform_private.job_state
      and attempt_count = 1
      and lease_until is not null
      and lease_token is not null
   from platform_private.jobs where id = '00000000-0000-0000-0000-00000000a50b'::uuid),
  'verification start leases the queued job before reading bytes'
);
select is(
  (select count(*) from platform_private.read_consumable_object('00000000-0000-0000-0000-00000000a505'::uuid)),
  0::bigint,
  'verifying objects remain non-consumable'
);

create temporary table verification_ready on commit drop as
select * from platform_private.apply_object_verification(
  '00000000-0000-0000-0000-00000000a505'::uuid,
  3,
  'ready'::platform_private.object_state,
  null,
  '00000000-0000-0000-0000-00000000a50e'::uuid,
  '00000000-0000-0000-0000-00000000a50b'::uuid
);
select is((select state from verification_ready), 'ready'::platform_private.object_state, 'exact provider metadata advances an object to ready');
select is((select version from verification_ready), 4::bigint, 'ready transition increments the object version');
select ok(
  (select state = 'succeeded'::platform_private.job_state
      and result_ref->>'type' = 'object_record'
      and result_ref->>'id' = '00000000-0000-0000-0000-00000000a505'
      and error_code is null
      and lease_until is null
      and lease_token is null
   from platform_private.jobs where id = '00000000-0000-0000-0000-00000000a50b'::uuid),
  'ready transition completes the verification job with a safe result reference'
);
select is(
  (select count(*) from platform_private.read_consumable_object('00000000-0000-0000-0000-00000000a505'::uuid)),
  1::bigint,
  'only a ready object is returned by the consumable projection'
);
select is((select version from platform_private.read_consumable_object('00000000-0000-0000-0000-00000000a505'::uuid)), 4::bigint, 'consumable projection returns the strong object version');
select is((select applied from platform_private.apply_object_verification(
  '00000000-0000-0000-0000-00000000a505'::uuid, 3,
  'ready'::platform_private.object_state, null,
  '00000000-0000-0000-0000-00000000a50f'::uuid,
  '00000000-0000-0000-0000-00000000a50b'::uuid)), false, 'terminal verifier replay cannot regress or duplicate a ready object');

create temporary table mismatch_admission on commit drop as
select * from platform_private.create_upload_intent(
  '00000000-0000-0000-0000-00000000a511'::uuid,
  '00000000-0000-0000-0000-00000000a512'::uuid,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000a515/source.wav',
  'source-audio', 'audio/wav', 1024, decode(repeat('b1', 32), 'hex'), 'standard', 2048,
  array['audio/wav']::text[], clock_timestamp() + interval '14 minutes',
  decode(repeat('b2', 32), 'hex'), decode(repeat('b3', 32), 'hex'),
  '00000000-0000-0000-0000-00000000a515'::uuid,
  '00000000-0000-0000-0000-00000000a516'::uuid,
  '00000000-0000-0000-0000-00000000a517'::uuid
);
select * from platform_private.complete_upload_intent(
  '00000000-0000-0000-0000-00000000a511'::uuid,
  '00000000-0000-0000-0000-00000000a512'::uuid,
  '00000000-0000-0000-0000-00000000a516'::uuid,
  1, 1000, 'audio/wav', decode(repeat('c1', 32), 'hex'), 'local',
  decode(repeat('c2', 32), 'hex'), decode(repeat('c3', 32), 'hex'),
  '00000000-0000-0000-0000-00000000a518'::uuid,
  '00000000-0000-0000-0000-00000000a519'::uuid,
  '00000000-0000-0000-0000-00000000a51a'::uuid
);
select * from platform_private.apply_object_verification(
  '00000000-0000-0000-0000-00000000a515'::uuid, 2,
  'verifying'::platform_private.object_state, null,
  '00000000-0000-0000-0000-00000000a51b'::uuid,
  '00000000-0000-0000-0000-00000000a519'::uuid
);
select throws_ok($$
  select * from platform_private.apply_object_verification(
    '00000000-0000-0000-0000-00000000a515'::uuid, 3,
    'ready'::platform_private.object_state, null,
    '00000000-0000-0000-0000-00000000a51c'::uuid,
    '00000000-0000-0000-0000-00000000a519'::uuid
  )
$$, 'P0001', null, 'mismatched provider metadata cannot become ready');
select * from platform_private.apply_object_verification(
  '00000000-0000-0000-0000-00000000a515'::uuid, 3,
  'quarantined'::platform_private.object_state, 'OBJECT_BYTES_MISMATCH',
  '00000000-0000-0000-0000-00000000a51d'::uuid,
  '00000000-0000-0000-0000-00000000a519'::uuid
);
select ok(
  (select state = 'quarantined'::platform_private.object_state and version = 4
   from platform_private.object_records where id = '00000000-0000-0000-0000-00000000a515'::uuid),
  'mismatched provider metadata can only terminate in quarantine'
);
select ok(
  (select state = 'failed'::platform_private.job_state and error_code = 'OBJECT_BYTES_MISMATCH'
   from platform_private.jobs where id = '00000000-0000-0000-0000-00000000a519'::uuid),
  'quarantine records a sanitized terminal job error'
);
select is(
  (select count(*) from platform_private.read_consumable_object('00000000-0000-0000-0000-00000000a515'::uuid)),
  0::bigint,
  'quarantined objects remain unavailable to consumers'
);

select ok(platform_private.begin_restore_fence(505, 'upload completion restore test'), 'restore fence enters reconciliation');
select throws_ok($$
  select * from platform_private.complete_upload_intent(
    '00000000-0000-0000-0000-00000000a501'::uuid,
    '00000000-0000-0000-0000-00000000a502'::uuid,
    '00000000-0000-0000-0000-00000000a506'::uuid,
    1, 1024, 'audio/wav', decode(repeat('a1', 32), 'hex'), 'fake',
    decode(repeat('d8', 32), 'hex'), decode(repeat('d9', 32), 'hex'),
    '00000000-0000-0000-0000-00000000af31'::uuid,
    '00000000-0000-0000-0000-00000000af32'::uuid,
    '00000000-0000-0000-0000-00000000af33'::uuid
  )
$$, 'P0001', null, 'restore fencing blocks upload completion mutations');
select throws_ok($$select * from platform_private.apply_object_verification(
  '00000000-0000-0000-0000-00000000a505'::uuid, 4,
  'ready'::platform_private.object_state, null,
  '00000000-0000-0000-0000-00000000af34'::uuid,
  '00000000-0000-0000-0000-00000000a50b'::uuid
)$$, 'P0001', null, 'restore fencing blocks verification mutations');
select ok(platform_private.complete_restore_fence(505), 'restore fence releases after reconciliation');

select * from finish();
rollback;
