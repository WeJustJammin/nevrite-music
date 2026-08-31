begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('platform_private', 'object_records', 'object records table exists in the private schema');
select has_table('platform_private', 'upload_intents', 'upload intents table exists in the private schema');
select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'object_records'),
  'object records enables RLS'
);
select ok(
  (select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'object_records'),
  'object records forces RLS'
);
select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'upload_intents'),
  'upload intents enables RLS'
);
select ok(
  (select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'upload_intents'),
  'upload intents forces RLS'
);
select ok(
  (select bool_and(not has_table_privilege(role_name, table_name, 'select'))
   from (values
     ('anon'::name, 'platform_private.object_records'::text),
     ('authenticated'::name, 'platform_private.object_records'::text),
     ('service_role'::name, 'platform_private.object_records'::text),
     ('anon'::name, 'platform_private.upload_intents'::text),
     ('authenticated'::name, 'platform_private.upload_intents'::text),
     ('service_role'::name, 'platform_private.upload_intents'::text)
   ) privileges(role_name, table_name)),
  'browser and service roles cannot select private upload tables directly'
);
select ok(
  not exists (
    select 1 from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform_private'
      and c.relname in ('object_records', 'upload_intents')
      and a.attnum > 0
      and not a.attisdropped
      and a.attname ilike '%url%'
  ),
  'signed transfer URLs have no persistence column'
);
select ok(
  to_regprocedure('platform_private.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)') is not null,
  'upload intent creation RPC exists'
);
select ok(
  to_regprocedure('platform_api.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)') is not null,
  'upload intent API adapter exists'
);
select ok(
  not has_function_privilege('service_role', 'platform_private.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_private.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_private.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute'),
  'legacy upload creation is denied to caller roles'
);
select ok(
  not has_function_privilege('service_role', 'platform_api.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_api.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_api.create_upload_intent(uuid,uuid,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute'),
  'legacy upload API adapter is denied to caller roles'
);

create temporary table upload_first on commit drop as
select * from platform_private.create_upload_intent(
  '00000000-0000-0000-0000-00000000a401'::uuid,
  '00000000-0000-0000-0000-00000000a402'::uuid,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000a403/source.wav',
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
  '00000000-0000-0000-0000-00000000a403'::uuid,
  '00000000-0000-0000-0000-00000000a404'::uuid,
  '00000000-0000-0000-0000-00000000a405'::uuid
);
select is((select intent_id from upload_first), '00000000-0000-0000-0000-00000000a404'::uuid, 'first admission returns canonical intent ID');
select is((select object_id from upload_first), '00000000-0000-0000-0000-00000000a403'::uuid, 'first admission returns canonical object ID');
select is((select version from upload_first), 1::bigint, 'new object starts at positive version one');
select is((select replayed from upload_first), false, 'first admission is not replayed');
select ok(
  (select state = 'pending_upload'::platform_private.object_state
          and byte_size = 1024
          and media_type = 'audio/wav'
          and checksum = decode(repeat('a1', 32), 'hex')
   from platform_private.object_records
   where id = '00000000-0000-0000-0000-00000000a403'::uuid),
  'admission persists governed pending object metadata'
);
select ok(
  (select state = 'issued'::platform_private.upload_intent_state
          and max_bytes = 2048
          and allowed_media_types = array['audio/wav', 'audio/mpeg']::text[]
   from platform_private.upload_intents
   where id = '00000000-0000-0000-0000-00000000a404'::uuid),
  'admission persists one short-lived issued intent'
);
select ok(
  (select response_ref->>'resourceRef' = '/api/v1/upload-intents/00000000-0000-0000-0000-00000000a404'
          and response_ref::text not ilike '%url%'
   from platform_private.idempotency_records
   where actor_id = '00000000-0000-0000-0000-00000000a401'::uuid
     and operation = 'platform.upload-intent.create'
     and key_hash = decode(repeat('a2', 32), 'hex')),
  'idempotency result stores only canonical safe reference and no signed URL'
);
select ok(
  exists (
    select 1 from audit_private.audit_events
    where target_id = '00000000-0000-0000-0000-00000000a404'::uuid
      and action = 'upload.intent.issued'
      and reason_code = 'UPLOAD_INTENT_ISSUED'
  ),
  'admission writes immutable audit evidence in the same transaction'
);

create temporary table upload_replay on commit drop as
select * from platform_private.create_upload_intent(
  '00000000-0000-0000-0000-00000000a401'::uuid,
  '00000000-0000-0000-0000-00000000a402'::uuid,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000a403/source.wav',
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
  '00000000-0000-0000-0000-00000000aff3'::uuid,
  '00000000-0000-0000-0000-00000000aff4'::uuid,
  '00000000-0000-0000-0000-00000000aff5'::uuid
);
select is((select intent_id from upload_replay), '00000000-0000-0000-0000-00000000a404'::uuid, 'same actor/key/request replays the original intent');
select is((select object_id from upload_replay), '00000000-0000-0000-0000-00000000a403'::uuid, 'same actor/key/request replays the original object');
select is((select replayed from upload_replay), true, 'idempotent retry is marked replayed');
select is((select count(*) from platform_private.object_records where owner_party_id = '00000000-0000-0000-0000-00000000a402'::uuid), 1::bigint, 'replay creates no second object');
select is((select count(*) from platform_private.upload_intents where actor_id = '00000000-0000-0000-0000-00000000a401'::uuid), 1::bigint, 'replay creates no second intent');

select throws_ok($$
  select * from platform_private.create_upload_intent(
    '00000000-0000-0000-0000-00000000a401'::uuid,
    '00000000-0000-0000-0000-00000000a402'::uuid,
    'private-media',
    'objects/00000000-0000-0000-0000-00000000a403/source.wav',
    'source-audio', 'audio/wav', 1024, decode(repeat('a1', 32), 'hex'), 'standard', 2048,
    array['audio/wav']::text[], clock_timestamp() + interval '14 minutes',
    decode(repeat('a2', 32), 'hex'), decode(repeat('ff', 32), 'hex'),
    '00000000-0000-0000-0000-00000000aff3'::uuid,
    '00000000-0000-0000-0000-00000000aff4'::uuid,
    '00000000-0000-0000-0000-00000000aff5'::uuid
  )
$$, 'P0001', null, 'same actor/key with different request hash is rejected without a second intent');
select throws_ok($$
  select * from platform_private.create_upload_intent(
    '00000000-0000-0000-0000-00000000a406'::uuid,
    '00000000-0000-0000-0000-00000000a407'::uuid,
    'private-media', 'objects/00000000-0000-0000-0000-00000000a408/too-late',
    'source-audio', 'audio/wav', 1, decode(repeat('a4', 32), 'hex'), 'standard', 1,
    array['audio/wav']::text[], clock_timestamp() + interval '16 minutes',
    decode(repeat('a5', 32), 'hex'), decode(repeat('a6', 32), 'hex'),
    '00000000-0000-0000-0000-00000000a408'::uuid,
    '00000000-0000-0000-0000-00000000a409'::uuid,
    '00000000-0000-0000-0000-00000000a40a'::uuid
  )
$$, '22023', null, 'creation RPC rejects an expiry beyond fifteen minutes');
select throws_ok($$
  select * from platform_private.create_upload_intent(
    '00000000-0000-0000-0000-00000000a40b'::uuid,
    '00000000-0000-0000-0000-00000000a40c'::uuid,
    'private-media', 'objects/../escape', 'source-audio', 'audio/wav', 1,
    decode(repeat('a7', 32), 'hex'), 'standard', 1, array['audio/wav']::text[],
    clock_timestamp() + interval '5 minutes', decode(repeat('a8', 32), 'hex'),
    decode(repeat('a9', 32), 'hex'), '00000000-0000-0000-0000-00000000a40d'::uuid,
    '00000000-0000-0000-0000-00000000a40e'::uuid,
    '00000000-0000-0000-0000-00000000a40f'::uuid
  )
$$, '22023', null, 'creation RPC rejects traversal before signing');

select throws_ok($$update platform_private.object_records set object_key = 'objects/rewritten' where id = '00000000-0000-0000-0000-00000000a403'::uuid$$, 'P0001', null, 'object key cannot be rewritten after signing');
select throws_ok($$update platform_private.upload_intents set max_bytes = 4096 where id = '00000000-0000-0000-0000-00000000a404'::uuid$$, 'P0001', null, 'issued intent constraints cannot be rewritten');
select throws_ok($$update platform_private.object_records set state = 'ready' where id = '00000000-0000-0000-0000-00000000a403'::uuid$$, 'P0001', null, 'object cannot skip verification state');
update platform_private.object_records set state = 'uploaded', version = version + 1 where id = '00000000-0000-0000-0000-00000000a403'::uuid;
select ok((select state = 'uploaded'::platform_private.object_state from platform_private.object_records where id = '00000000-0000-0000-0000-00000000a403'::uuid), 'object can advance to uploaded through the state machine');
update platform_private.object_records set state = 'verifying', version = version + 1 where id = '00000000-0000-0000-0000-00000000a403'::uuid;
select ok((select state = 'verifying'::platform_private.object_state from platform_private.object_records where id = '00000000-0000-0000-0000-00000000a403'::uuid), 'object can advance to verifying through the state machine');
update platform_private.object_records set state = 'ready', version = version + 1 where id = '00000000-0000-0000-0000-00000000a403'::uuid;
select ok((select state = 'ready'::platform_private.object_state from platform_private.object_records where id = '00000000-0000-0000-0000-00000000a403'::uuid), 'object can become ready only after verification');
select throws_ok($$update platform_private.object_records set state = 'pending_upload' where id = '00000000-0000-0000-0000-00000000a403'::uuid$$, 'P0001', null, 'ready object cannot regress');
update platform_private.upload_intents set state = 'consumed' where id = '00000000-0000-0000-0000-00000000a404'::uuid;
select ok((select state = 'consumed'::platform_private.upload_intent_state from platform_private.upload_intents where id = '00000000-0000-0000-0000-00000000a404'::uuid), 'issued intent can become consumed');
select throws_ok($$update platform_private.upload_intents set state = 'issued' where id = '00000000-0000-0000-0000-00000000a404'::uuid$$, 'P0001', null, 'terminal upload intent cannot reopen');

select * from finish();
rollback;
