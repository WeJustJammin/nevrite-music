begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- S04: target and version authority is persisted beside the canonical intent,
-- then revalidated by the same service-role RPC that completes the upload.
select has_table('platform_private', 'upload_intent_authority',
  'upload intent target authority evidence exists');
select ok(
  (select relrowsecurity and relforcerowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private'
     and c.relname = 'upload_intent_authority'),
  'upload target authority evidence is forced RLS');
select ok(
  not has_table_privilege('anon', 'platform_private.upload_intent_authority', 'select')
  and not has_table_privilege('authenticated', 'platform_private.upload_intent_authority', 'select')
  and not has_table_privilege('service_role', 'platform_private.upload_intent_authority', 'select'),
  'upload target authority evidence has no direct table reads');
select ok(
  to_regprocedure('platform_private.create_upload_intent_authorized(uuid,uuid,text,uuid,bigint,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_private.complete_upload_intent_authorized(uuid,uuid,uuid,bigint,text,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)') is not null,
  'target-aware upload admission and completion RPCs exist');
select ok(
  has_function_privilege('service_role', 'platform_private.create_upload_intent_authorized(uuid,uuid,text,uuid,bigint,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and has_function_privilege('service_role', 'platform_private.complete_upload_intent_authorized(uuid,uuid,uuid,bigint,text,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_private.create_upload_intent_authorized(uuid,uuid,text,uuid,bigint,text,text,text,text,bigint,bytea,text,bigint,text[],timestamptz,bytea,bytea,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_private.complete_upload_intent_authorized(uuid,uuid,uuid,bigint,text,uuid,bigint,bigint,text,bytea,text,bytea,bytea,uuid,uuid,uuid)', 'execute'),
  'target-aware upload RPCs are service-role-only');

create temporary table target_upload_first on commit drop as
select * from platform_private.create_upload_intent_authorized(
  '00000000-0000-0000-0000-00000000d401'::uuid,
  '00000000-0000-0000-0000-00000000d402'::uuid,
  'release', '00000000-0000-0000-0000-00000000d403'::uuid, 7,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000d404/source.wav',
  'source-audio', 'audio/wav', 1024,
  decode(repeat('d1', 32), 'hex'), 'standard', 2048,
  array['audio/wav']::text[], clock_timestamp() + interval '14 minutes',
  decode(repeat('d2', 32), 'hex'), decode(repeat('d3', 32), 'hex'),
  '00000000-0000-0000-0000-00000000d404'::uuid,
  '00000000-0000-0000-0000-00000000d405'::uuid,
  '00000000-0000-0000-0000-00000000d406'::uuid
);
select is((select intent_id from target_upload_first),
  '00000000-0000-0000-0000-00000000d405'::uuid,
  'target-aware admission returns the canonical intent');
select is((select target_type from target_upload_first), 'release',
  'target-aware admission returns the normalized target type');
select is((select target_id from target_upload_first),
  '00000000-0000-0000-0000-00000000d403'::uuid,
  'target-aware admission returns the target identity');
select is((select target_version from target_upload_first), 7::bigint,
  'target-aware admission returns the expected target version');
select ok(
  (select target_type = 'release'
      and target_id = '00000000-0000-0000-0000-00000000d403'::uuid
      and target_version = 7
      and actor_id = '00000000-0000-0000-0000-00000000d401'::uuid
      and acting_party_id = '00000000-0000-0000-0000-00000000d402'::uuid
   from platform_private.upload_intent_authority
   where intent_id = '00000000-0000-0000-0000-00000000d405'::uuid),
  'target authority binds actor, party, target, and expected version atomically');

create temporary table target_upload_replay on commit drop as
select * from platform_private.create_upload_intent_authorized(
  '00000000-0000-0000-0000-00000000d401'::uuid,
  '00000000-0000-0000-0000-00000000d402'::uuid,
  'release', '00000000-0000-0000-0000-00000000d403'::uuid, 7,
  'private-media',
  'objects/00000000-0000-0000-0000-00000000d404/source.wav',
  'source-audio', 'audio/wav', 1024,
  decode(repeat('d1', 32), 'hex'), 'standard', 2048,
  array['audio/wav']::text[], clock_timestamp() + interval '14 minutes',
  decode(repeat('d2', 32), 'hex'), decode(repeat('d3', 32), 'hex'),
  '00000000-0000-0000-0000-00000000d4f4'::uuid,
  '00000000-0000-0000-0000-00000000d4f5'::uuid,
  '00000000-0000-0000-0000-00000000d4f6'::uuid
);
select is((select replayed from target_upload_replay), true,
  'identical target-aware admission replays the original intent');
select throws_ok($$
  select * from platform_private.create_upload_intent_authorized(
    '00000000-0000-0000-0000-00000000d401'::uuid,
    '00000000-0000-0000-0000-00000000d402'::uuid,
    'track', '00000000-0000-0000-0000-00000000d403'::uuid, 7,
    'private-media',
    'objects/00000000-0000-0000-0000-00000000d404/source.wav',
    'source-audio', 'audio/wav', 1024,
    decode(repeat('d1', 32), 'hex'), 'standard', 2048,
    array['audio/wav']::text[], clock_timestamp() + interval '14 minutes',
    decode(repeat('d2', 32), 'hex'), decode(repeat('d3', 32), 'hex'),
    '00000000-0000-0000-0000-00000000d4f7'::uuid,
    '00000000-0000-0000-0000-00000000d4f8'::uuid,
    '00000000-0000-0000-0000-00000000d4f9'::uuid
  )
$$, 'P0001', null,
  'same idempotency binding cannot change its authoritative target');

select throws_ok($$
  select * from platform_private.complete_upload_intent_authorized(
    '00000000-0000-0000-0000-00000000d401'::uuid,
    '00000000-0000-0000-0000-00000000d402'::uuid,
    '00000000-0000-0000-0000-00000000d405'::uuid, 1,
    'track', '00000000-0000-0000-0000-00000000d403'::uuid, 7,
    1024, 'audio/wav', decode(repeat('d1', 32), 'hex'), 'local',
    decode(repeat('d7', 32), 'hex'), decode(repeat('d8', 32), 'hex'),
    '00000000-0000-0000-0000-00000000d409'::uuid,
    '00000000-0000-0000-0000-00000000d40a'::uuid,
    '00000000-0000-0000-0000-00000000d40b'::uuid
  )
$$, 'P0001', null,
  'completion revalidates target type before changing object state');
select is((select state from platform_private.object_records
           where id = '00000000-0000-0000-0000-00000000d404'::uuid),
  'pending_upload'::platform_private.object_state,
  'failed target revalidation leaves the object pending');

create temporary table target_upload_complete on commit drop as
select * from platform_private.complete_upload_intent_authorized(
  '00000000-0000-0000-0000-00000000d401'::uuid,
  '00000000-0000-0000-0000-00000000d402'::uuid,
  '00000000-0000-0000-0000-00000000d405'::uuid, 1,
  'release', '00000000-0000-0000-0000-00000000d403'::uuid, 7,
  1024, 'audio/wav', decode(repeat('d1', 32), 'hex'), 'local',
  decode(repeat('d7', 32), 'hex'), decode(repeat('d8', 32), 'hex'),
  '00000000-0000-0000-0000-00000000d409'::uuid,
  '00000000-0000-0000-0000-00000000d40a'::uuid,
  '00000000-0000-0000-0000-00000000d40b'::uuid
);
select is((select replayed from target_upload_complete), false,
  'first target-aware completion is not replayed');
select is((select object_id from target_upload_complete),
  '00000000-0000-0000-0000-00000000d404'::uuid,
  'target-aware completion returns the governed object');
select is((select state from platform_private.object_records
           where id = '00000000-0000-0000-0000-00000000d404'::uuid),
  'uploaded'::platform_private.object_state,
  'target-aware completion advances the object only after target CAS');

-- S06: effect payload and normalized webhook evidence live in separate,
-- immutable private records. Canonical operations/receipts remain minimal.
select has_table('platform_private', 'provider_operation_intents',
  'provider operation intent evidence exists');
select has_table('platform_private', 'webhook_event_records',
  'normalized webhook event evidence exists');
select ok(
  (select bool_and(relrowsecurity and relforcerowsecurity)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private'
     and c.relname in ('provider_operation_intents', 'webhook_event_records')),
  'provider and webhook evidence tables are forced RLS');
select ok(
  not has_table_privilege('anon', 'platform_private.provider_operation_intents', 'select')
  and not has_table_privilege('authenticated', 'platform_private.webhook_event_records', 'select')
  and not has_table_privilege('service_role', 'platform_private.provider_operation_intents', 'select'),
  'provider and webhook evidence have no direct table reads');
select ok(
  to_regprocedure('platform_private.create_provider_operation_authorized(text,text,uuid,uuid,bytea,bytea,jsonb,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_private.read_provider_operation_authorized(uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_private.apply_provider_operation_outcome_authorized(uuid,uuid,uuid,bigint,platform_private.provider_operation_state,text,text,boolean,timestamptz,timestamptz)') is not null
  and to_regprocedure('platform_private.record_webhook_receipt_authorized(text,text,bytea,text,integer,jsonb,timestamptz,uuid,uuid,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_private.apply_webhook_receipt_outcome_authorized(uuid,platform_private.webhook_receipt_state,platform_private.webhook_receipt_state,uuid,text,uuid,uuid)') is not null,
  'authority-revalidating provider and webhook RPCs exist');

create temporary table governed_operation on commit drop as
select * from platform_private.create_provider_operation_authorized(
  'local', 'message.send',
  '00000000-0000-0000-0000-00000000d411'::uuid,
  '00000000-0000-0000-0000-00000000d412'::uuid,
  decode(repeat('d9', 32), 'hex'), decode(repeat('da', 32), 'hex'),
  '{"releaseId":"00000000-0000-0000-0000-00000000d403","attempt":1}'::jsonb,
  '00000000-0000-0000-0000-00000000d413'::uuid,
  null,
  '00000000-0000-0000-0000-00000000d414'::uuid
);
select ok(
  exists (select 1 from platform_private.provider_operation_intents
          where operation_id = '00000000-0000-0000-0000-00000000d414'::uuid
            and acting_party_id = '00000000-0000-0000-0000-00000000d412'::uuid
            and governed_payload = '{"releaseId":"00000000-0000-0000-0000-00000000d403","attempt":1}'::jsonb),
  'provider planning persists bounded governed payload evidence');
select is(
  (select governed_payload from platform_private.read_provider_operation_authorized(
    '00000000-0000-0000-0000-00000000d414'::uuid,
    '00000000-0000-0000-0000-00000000d411'::uuid,
    '00000000-0000-0000-0000-00000000d412'::uuid)),
  '{"releaseId":"00000000-0000-0000-0000-00000000d403","attempt":1}'::jsonb,
  'authorized provider read returns the governed payload only to its actor and party');
select throws_ok($$
  select * from platform_private.read_provider_operation_authorized(
    '00000000-0000-0000-0000-00000000d414'::uuid,
    '00000000-0000-0000-0000-00000000d415'::uuid,
    '00000000-0000-0000-0000-00000000d412'::uuid)
$$, 'P0001', null,
  'provider read rejects a valid but wrong actor');
select throws_ok($$
  select * from platform_private.create_provider_operation_authorized(
    'local', 'message.send',
    '00000000-0000-0000-0000-00000000d416'::uuid,
    '00000000-0000-0000-0000-00000000d417'::uuid,
    decode(repeat('db', 32), 'hex'), decode(repeat('dc', 32), 'hex'),
    '{"rawBody":"must-not-persist"}'::jsonb,
    '00000000-0000-0000-0000-00000000d418'::uuid,
    null,
    '00000000-0000-0000-0000-00000000d419'::uuid)
$$, '22023', null,
  'governed provider payload rejects raw-body fields');
select throws_ok($$
  select platform_private.apply_provider_operation_outcome_authorized(
    '00000000-0000-0000-0000-00000000d414'::uuid,
    '00000000-0000-0000-0000-00000000d415'::uuid,
    '00000000-0000-0000-0000-00000000d412'::uuid, 1,
    'pending'::platform_private.provider_operation_state,
    null, null, true, clock_timestamp(), clock_timestamp())
$$, 'P0001', null,
  'provider outcome rejects a wrong actor before state mutation');
select ok(
  platform_private.apply_provider_operation_outcome_authorized(
    '00000000-0000-0000-0000-00000000d414'::uuid,
    '00000000-0000-0000-0000-00000000d411'::uuid,
    '00000000-0000-0000-0000-00000000d412'::uuid, 1,
    'pending'::platform_private.provider_operation_state,
    null, null, true, clock_timestamp(), clock_timestamp()),
  'authorized provider outcome revalidates actor and acting party');
select throws_ok($$
  update platform_private.provider_operation_intents
     set governed_payload = '{}'::jsonb
   where operation_id = '00000000-0000-0000-0000-00000000d414'::uuid
$$, 'P0001', null,
  'provider intent payload evidence cannot be rewritten');

create temporary table governed_receipt on commit drop as
select * from platform_private.record_webhook_receipt_authorized(
  'local', 'evt-contract-1', decode(repeat('dd', 32), 'hex'),
  'operation.confirmed', 1,
  '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb,
  clock_timestamp(),
  '00000000-0000-0000-0000-00000000d414'::uuid,
  '00000000-0000-0000-0000-00000000d421'::uuid,
  '00000000-0000-0000-0000-00000000d422'::uuid,
  null,
  '00000000-0000-0000-0000-000000000001'::uuid
);
select is((select accepted from governed_receipt), true,
  'schema-validated webhook is accepted');
select is((select event_type from governed_receipt), 'operation.confirmed',
  'accepted webhook returns its strict event type');
select is((select schema_version from governed_receipt), 1,
  'accepted webhook returns its schema version');
select throws_ok($$
  select * from platform_private.record_webhook_receipt_authorized(
    'local', 'evt-unauthorized-party', decode(repeat('de', 32), 'hex'),
    'operation.confirmed', 1,
    '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb,
    clock_timestamp(), null,
    '00000000-0000-0000-0000-00000000d427'::uuid,
    '00000000-0000-0000-0000-00000000d428'::uuid,
    null,
    '00000000-0000-0000-0000-00000000d412'::uuid)
$$, '22023', null,
  'webhook admission rejects a non-system acting party claim');
select ok(
  exists (select 1 from platform_private.webhook_event_records
          where receipt_id = '00000000-0000-0000-0000-00000000d421'::uuid
            and event_type = 'operation.confirmed'
            and schema_version = 1
            and normalized_event = '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb),
  'normalized webhook event is persisted keyed by receipt identity');
select ok(
  not exists (select 1 from pg_attribute a
             join pg_class c on c.oid = a.attrelid
             join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'platform_private'
               and c.relname = 'webhook_event_records'
               and a.attnum > 0 and not a.attisdropped
               and a.attname in ('raw_body', 'body', 'secret', 'credential')),
  'normalized webhook evidence has no raw body or credential column');
create temporary table governed_receipt_duplicate on commit drop as
select * from platform_private.record_webhook_receipt_authorized(
  'local', 'evt-contract-1', decode(repeat('dd', 32), 'hex'),
  'operation.confirmed', 1,
  '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb,
  clock_timestamp(),
  '00000000-0000-0000-0000-00000000d414'::uuid,
  '00000000-0000-0000-0000-00000000d423'::uuid,
  '00000000-0000-0000-0000-00000000d424'::uuid,
  null,
  '00000000-0000-0000-0000-000000000001'::uuid
);
select is((select duplicate from governed_receipt_duplicate), true,
  'identical provider event digest replays without a second effect');
select is((select count(*) from platform_private.webhook_receipts
           where provider = 'local' and external_event_id = 'evt-contract-1'), 1::bigint,
  'identical webhook replay keeps one receipt identity');
create temporary table governed_receipt_conflict on commit drop as
select * from platform_private.record_webhook_receipt_authorized(
    'local', 'evt-contract-1', decode(repeat('de', 32), 'hex'),
    'operation.confirmed', 1,
    '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb,
    clock_timestamp(),
    '00000000-0000-0000-0000-00000000d414'::uuid,
    '00000000-0000-0000-0000-00000000d425'::uuid,
    '00000000-0000-0000-0000-00000000d426'::uuid,
    null,
    '00000000-0000-0000-0000-000000000001'::uuid
);
select is((select conflict from governed_receipt_conflict), true,
  'conflicting provider digest requires manual review rather than a second effect');
select is((select state from governed_receipt_conflict),
  'manual_review'::platform_private.webhook_receipt_state,
  'conflicting provider digest reports manual review');
select is((select count(*) from platform_private.webhook_receipts
           where provider = 'local' and external_event_id = 'evt-contract-1'), 1::bigint,
  'conflicting webhook delivery keeps one receipt identity');
select throws_ok($$
  update platform_private.webhook_receipts
     set state = 'accepted'
   where id = '00000000-0000-0000-0000-00000000d421'::uuid
$$, 'P0001', null,
  'manual-review webhook receipts cannot be reopened');

create temporary table processed_receipt on commit drop as
select * from platform_private.record_webhook_receipt_authorized(
  'local', 'evt-contract-processed', decode(repeat('df', 32), 'hex'),
  'operation.confirmed', 1,
  '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb,
  clock_timestamp(), null,
  '00000000-0000-0000-0000-00000000d431'::uuid,
  '00000000-0000-0000-0000-00000000d432'::uuid,
  null,
  '00000000-0000-0000-0000-000000000001'::uuid
);
select ok(
  platform_private.apply_webhook_receipt_outcome_authorized(
    (select receipt_id from processed_receipt),
    'accepted'::platform_private.webhook_receipt_state,
    'processed'::platform_private.webhook_receipt_state,
    null, null),
  'accepted webhook can be processed once with normalized evidence');
select throws_ok($$
  select platform_private.apply_webhook_receipt_outcome_authorized(
    '00000000-0000-0000-0000-00000000d431'::uuid,
    'processed'::platform_private.webhook_receipt_state,
    'processed'::platform_private.webhook_receipt_state,
    null, null, null,
    '00000000-0000-0000-0000-00000000d429'::uuid)
$$, '22023', null,
  'webhook outcome rejects a non-system acting party claim');
select throws_ok($$
  update platform_private.webhook_receipts
     set state = 'accepted'
   where id = '00000000-0000-0000-0000-00000000d431'::uuid
$$, 'P0001', null,
  'processed webhook receipts are terminal and cannot reopen');
select throws_ok($$
  update platform_private.webhook_event_records
     set event_type = 'operation.failed'
   where receipt_id = '00000000-0000-0000-0000-00000000d431'::uuid
$$, 'P0001', null,
  'normalized webhook evidence cannot be rewritten');

create temporary table failed_receipt on commit drop as
select * from platform_private.record_webhook_receipt_authorized(
  'local', 'evt-contract-failed', decode(repeat('e0', 32), 'hex'),
  'operation.failed', 1,
  '{"operationId":"00000000-0000-0000-0000-00000000d414"}'::jsonb,
  clock_timestamp(), null,
  '00000000-0000-0000-0000-00000000d433'::uuid,
  '00000000-0000-0000-0000-00000000d434'::uuid,
  null,
  '00000000-0000-0000-0000-000000000001'::uuid
);
select ok(
  platform_private.apply_webhook_receipt_outcome_authorized(
    (select receipt_id from failed_receipt),
    'accepted'::platform_private.webhook_receipt_state,
    'failed'::platform_private.webhook_receipt_state,
    null, 'DELIVERY_FAILED'),
  'accepted webhook can become failed with bounded evidence');
select throws_ok($$
  select platform_private.apply_webhook_receipt_outcome_authorized(
    (select receipt_id from failed_receipt),
    'failed'::platform_private.webhook_receipt_state,
    'processed'::platform_private.webhook_receipt_state,
    null, null)
$$, 'P0001', null,
  'failed webhook receipts cannot be replayed as processed work');

-- S07: a boolean verification claim is diagnostic only. Protected writes need
-- immutable promotion provenance bound to the artifact, source revision, and
-- production environment; the free-tier baseline therefore remains closed.
select has_table('platform_private', 'recovery_verification_promotions',
  'recovery verification promotion bindings exist');
select ok(
  (select relrowsecurity and relforcerowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private'
     and c.relname = 'recovery_verification_promotions'),
  'recovery promotion bindings are forced-RLS private state');
select ok(
  not has_table_privilege('anon', 'platform_private.recovery_verification_promotions', 'select')
  and not has_table_privilege('authenticated', 'platform_private.recovery_verification_promotions', 'select')
  and not has_table_privilege('service_role', 'platform_private.recovery_verification_promotions', 'select')
  and not has_table_privilege('service_role', 'platform_private.recovery_verification_promotions', 'insert')
  and not has_table_privilege('service_role', 'platform_private.recovery_verification_promotions', 'update')
  and not has_table_privilege('service_role', 'platform_private.recovery_verification_promotions', 'delete'),
  'recovery promotion bindings have no direct browser reads or service-role writes');
select ok(
  (select count(*) = 6
   from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private'
     and c.relname = 'recovery_verification_evidence'
     and a.attnum > 0 and not a.attisdropped
     and a.attname in ('provenance_kind', 'promotion_id', 'artifact_id',
                       'artifact_digest', 'source_revision', 'environment')),
  'recovery evidence stores explicit promotion provenance fields');
select ok(
  to_regprocedure('platform_private.read_recovery_provenance()') is not null
  and to_regprocedure('platform_api.read_recovery_provenance()') is not null
  and to_regprocedure('platform_private.record_promoted_recovery_verification(bigint,boolean,bigint,bigint,bigint,boolean,boolean,boolean,boolean,boolean,boolean,boolean,uuid,uuid,bytea,text,text,timestamptz,timestamptz,uuid,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_api.record_promoted_recovery_verification(bigint,boolean,bigint,bigint,bigint,boolean,boolean,boolean,boolean,boolean,boolean,boolean,uuid,uuid,bytea,text,text,timestamptz,timestamptz,uuid,uuid,uuid,uuid)') is not null,
  'recovery provenance read and promoted verification RPCs exist');
select ok(
  has_function_privilege('service_role', 'platform_api.read_recovery_provenance()', 'execute')
  and has_function_privilege('service_role', 'platform_api.record_promoted_recovery_verification(bigint,boolean,bigint,bigint,bigint,boolean,boolean,boolean,boolean,boolean,boolean,boolean,uuid,uuid,bytea,text,text,timestamptz,timestamptz,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_api.record_promoted_recovery_verification(bigint,boolean,bigint,bigint,bigint,boolean,boolean,boolean,boolean,boolean,boolean,boolean,uuid,uuid,bytea,text,text,timestamptz,timestamptz,uuid,uuid,uuid,uuid)', 'execute'),
  'recovery provenance RPCs are service-role-only');
select ok(
  (select provenance_kind = 'unavailable'
      and promotion_id is null
      and artifact_id is null
      and artifact_digest is null
      and source_revision is null
      and environment is null
      and not provenance_valid
   from platform_private.read_recovery_provenance()),
  'free-tier baseline reports unavailable provenance without artifact claims');
select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     1, true, 604800, 120, 14400,
     true, true, true, true, true, true, true,
     clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour',
     '00000000-0000-0000-0000-00000000d501'::uuid,
     '00000000-0000-0000-0000-00000000d502'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'service-role boolean verification claims cannot open protected writes');
select ok(
  (select provenance_kind = 'unavailable'
      and promotion_id is null
      and artifact_id is null
      and artifact_digest is null
      and source_revision is null
      and environment is null
   from platform_private.recovery_verification_evidence
   where id = '00000000-0000-0000-0000-00000000d501'::uuid),
  'self-attested evidence persists only as an unavailable provenance claim');
select ok(
  (select not pitr_available
      and not protected_writes_allowed
      and reason_code = 'RECOVERY_PROVENANCE_UNVERIFIED'
   from platform_private.read_recovery_verification()),
  'fully measured self-attested evidence remains unavailable and closed');
insert into platform_private.recovery_verification_promotions (
  id, artifact_id, artifact_digest, source_revision, environment,
  promoted_at, expires_at
) values (
  '00000000-0000-0000-0000-00000000d503'::uuid,
  '00000000-0000-0000-0000-00000000d504'::uuid,
  decode(repeat('e1', 32), 'hex'), 'build-s07', 'production',
  clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour'
);
select throws_ok($$
  update platform_private.recovery_verification_promotions
     set source_revision = 'rewritten'
   where id = '00000000-0000-0000-0000-00000000d503'::uuid
$$, 'P0001', null,
  'recovery promotion bindings cannot be rewritten');
select throws_ok($$
  delete from platform_private.recovery_verification_promotions
   where id = '00000000-0000-0000-0000-00000000d503'::uuid
$$, 'P0001', null,
  'recovery promotion bindings cannot be deleted');
select throws_ok($$
  select * from platform_private.record_promoted_recovery_verification(
    1, true, 604800, 120, 14400,
    true, true, true, true, true, true, true,
    '00000000-0000-0000-0000-00000000d503'::uuid,
    '00000000-0000-0000-0000-00000000d504'::uuid,
    decode(repeat('e1', 32), 'hex'), 'build-s07', 'production',
    clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour',
    '00000000-0000-0000-0000-00000000d505'::uuid,
    '00000000-0000-0000-0000-00000000d506'::uuid,
    null,
    '00000000-0000-0000-0000-000000000001'::uuid
  )
$$, 'P0001', null,
  'promoted verification writer rejects arbitrary claims without an external promotion binding');
select * from finish();
rollback;
