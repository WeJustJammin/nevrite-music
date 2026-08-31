begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('platform_private', 'provider_operations', 'provider operations table exists in the private schema');
select has_table('platform_private', 'webhook_receipts', 'webhook receipts table exists in the private schema');
select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'provider_operations'),
  'provider operations enables RLS'
);
select ok(
  (select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'provider_operations'),
  'provider operations forces RLS'
);
select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'webhook_receipts'),
  'webhook receipts enables RLS'
);
select ok(
  (select relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private' and c.relname = 'webhook_receipts'),
  'webhook receipts forces RLS'
);
select ok(
  (select bool_and(not has_table_privilege(role_name, table_name, 'select'))
   from (values
     ('anon'::name, 'platform_private.provider_operations'::text),
     ('authenticated'::name, 'platform_private.provider_operations'::text),
     ('service_role'::name, 'platform_private.provider_operations'::text),
     ('anon'::name, 'platform_private.webhook_receipts'::text),
     ('authenticated'::name, 'platform_private.webhook_receipts'::text),
     ('service_role'::name, 'platform_private.webhook_receipts'::text)
   ) privileges(role_name, table_name)),
  'browser and service roles cannot select private provider tables directly'
);
select ok(
  not exists (
    select 1 from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'platform_private'
      and c.relname in ('provider_operations', 'webhook_receipts')
      and a.attnum > 0
      and not a.attisdropped
      and a.attname in ('payload', 'raw_body', 'body', 'secret', 'credential')
  ),
  'provider tables contain no raw webhook body or credential columns'
);

select ok(
  to_regprocedure('platform_private.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_private.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_private.apply_provider_operation_outcome(uuid,bigint,platform_private.provider_operation_state,text,text,boolean,timestamptz,timestamptz)') is not null
  and to_regprocedure('platform_private.apply_webhook_receipt_outcome(uuid,platform_private.webhook_receipt_state,platform_private.webhook_receipt_state,uuid,text)') is not null,
  'provider and webhook authority RPCs exist'
);
select ok(
  to_regprocedure('platform_api.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)') is not null
  and to_regprocedure('platform_api.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)') is not null,
  'provider and webhook API adapters exist'
);
select ok(
  not has_function_privilege('service_role', 'platform_private.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('service_role', 'platform_private.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_private.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_private.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)', 'execute'),
  'legacy provider authority RPCs are denied to caller roles'
);
select ok(
  not has_function_privilege('service_role', 'platform_api.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('service_role', 'platform_api.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'platform_api.create_provider_operation(text,text,uuid,bytea,bytea,uuid,uuid,uuid,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'platform_api.record_webhook_receipt(text,text,bytea,timestamptz,uuid,uuid,uuid,uuid,uuid)', 'execute'),
  'legacy provider API adapters are denied to caller roles'
);

create temporary table operation_first on commit drop as
select * from platform_private.create_provider_operation(
  'local',
  'message.send',
  '00000000-0000-0000-0000-00000000b401'::uuid,
  decode(repeat('b1', 32), 'hex'),
  decode(repeat('b2', 32), 'hex'),
  '00000000-0000-0000-0000-00000000b403'::uuid,
  '00000000-0000-0000-0000-00000000b402'::uuid,
  null,
  '00000000-0000-0000-0000-00000000b404'::uuid
);
select is((select operation_id from operation_first), '00000000-0000-0000-0000-00000000b404'::uuid, 'provider planning returns canonical operation ID');
select is((select version from operation_first), 1::bigint, 'planned provider operation starts at version one');
select is((select replayed from operation_first), false, 'first provider planning is not replayed');
select ok(
  (select state = 'planned'::platform_private.provider_operation_state
          and intent_hash = decode(repeat('b1', 32), 'hex')
          and provider_idempotency_key_hash = decode(repeat('b2', 32), 'hex')
          and provider_ref is null
          and jsonb_array_length(attempts) = 0
   from platform_private.provider_operations
   where id = '00000000-0000-0000-0000-00000000b404'::uuid),
  'provider operation persists immutable intent and idempotency hashes before any effect'
);
select ok(
  (select event_type = 'provider.operation.requested'
          and schema_version = 1
          and payload = jsonb_build_object('operationId', '00000000-0000-0000-0000-00000000b404'::uuid)
   from platform_private.outbox_events
   where aggregate_id = '00000000-0000-0000-0000-00000000b404'::uuid),
  'provider planning writes a minimal durable outbox intent without provider payload'
);
select ok(
  exists (
    select 1 from audit_private.audit_events
    where target_id = '00000000-0000-0000-0000-00000000b404'::uuid
      and action = 'provider.operation.planned'
      and reason_code = 'PROVIDER_OPERATION_PLANNED'
  ),
  'provider planning writes immutable audit evidence'
);

select ok(
  platform_private.apply_provider_operation_outcome(
    '00000000-0000-0000-0000-00000000b404'::uuid, 1,
    'pending'::platform_private.provider_operation_state, null, null, true,
    clock_timestamp(), clock_timestamp()
  ),
  'planned operation can enter pending before an outbound attempt result is known'
);
select ok(
  (select state = 'pending'::platform_private.provider_operation_state
          and version = 2
          and provider_ref is null
          and jsonb_array_length(attempts) = 1
   from platform_private.provider_operations
   where id = '00000000-0000-0000-0000-00000000b404'::uuid),
  'ambiguous provider outcome remains pending with bounded attempt evidence'
);
select is(
  platform_private.apply_provider_operation_outcome(
    '00000000-0000-0000-0000-00000000b404'::uuid, 1,
    'confirmed'::platform_private.provider_operation_state, 'provider-ref', null, false,
    clock_timestamp(), clock_timestamp()
  ),
  false,
  'stale provider operation version cannot overwrite canonical state'
);
select throws_ok($$
  select platform_private.apply_provider_operation_outcome(
    '00000000-0000-0000-0000-00000000b404'::uuid, 2,
    'confirmed'::platform_private.provider_operation_state, null, null, false,
    clock_timestamp(), clock_timestamp()
  )
$$, '22023', null, 'confirmation requires provider evidence');
select ok(
  platform_private.apply_provider_operation_outcome(
    '00000000-0000-0000-0000-00000000b404'::uuid, 2,
    'confirmed'::platform_private.provider_operation_state, 'provider-ref-1', null, false,
    clock_timestamp(), clock_timestamp()
  ),
  'provider operation confirms only with provider reference evidence'
);
select ok(
  (select state = 'confirmed'::platform_private.provider_operation_state
          and version = 3
          and provider_ref = 'provider-ref-1'
   from platform_private.provider_operations
   where id = '00000000-0000-0000-0000-00000000b404'::uuid),
  'confirmed provider operation stores evidence and advances version once'
);
select throws_ok($$update platform_private.provider_operations set provider = 'other' where id = '00000000-0000-0000-0000-00000000b404'::uuid$$, 'P0001', null, 'provider operation identity is immutable');
select throws_ok($$update platform_private.provider_operations set state = 'pending' where id = '00000000-0000-0000-0000-00000000b404'::uuid$$, 'P0001', null, 'terminal provider operation cannot regress');

create temporary table operation_replay on commit drop as
select * from platform_private.create_provider_operation(
  'local', 'message.send', '00000000-0000-0000-0000-00000000b401'::uuid,
  decode(repeat('b1', 32), 'hex'), decode(repeat('b2', 32), 'hex'),
  '00000000-0000-0000-0000-00000000b403'::uuid,
  '00000000-0000-0000-0000-00000000b402'::uuid, null,
  '00000000-0000-0000-0000-00000000b40f'::uuid
);
select is((select operation_id from operation_replay), '00000000-0000-0000-0000-00000000b404'::uuid, 'same provider idempotency binding replays original operation');
select is((select replayed from operation_replay), true, 'provider idempotency replay is marked replayed');
select is((select count(*) from platform_private.provider_operations where actor_id = '00000000-0000-0000-0000-00000000b401'::uuid), 1::bigint, 'provider replay creates no second operation');
select throws_ok($$
  select * from platform_private.create_provider_operation(
    'local', 'message.send', '00000000-0000-0000-0000-00000000b401'::uuid,
    decode(repeat('ff', 32), 'hex'), decode(repeat('b2', 32), 'hex'),
    '00000000-0000-0000-0000-00000000b403'::uuid,
    '00000000-0000-0000-0000-00000000b402'::uuid, null,
    '00000000-0000-0000-0000-00000000b410'::uuid
  )
$$, 'P0001', null, 'same provider key with different intent hash is rejected');

create temporary table receipt_first on commit drop as
select * from platform_private.record_webhook_receipt(
  'local',
  'evt-1001',
  decode(repeat('c1', 32), 'hex'),
  clock_timestamp(),
  '00000000-0000-0000-0000-00000000b404'::uuid,
  '00000000-0000-0000-0000-00000000b411'::uuid,
  '00000000-0000-0000-0000-00000000b412'::uuid,
  null,
  '00000000-0000-0000-0000-00000000b402'::uuid
);
select is((select receipt_id from receipt_first), '00000000-0000-0000-0000-00000000b411'::uuid, 'verified webhook admission returns canonical receipt ID');
select is((select accepted from receipt_first), true, 'verified first webhook receipt is accepted');
select is((select duplicate from receipt_first), false, 'first webhook receipt is not duplicate');
select is((select conflict from receipt_first), false, 'first webhook receipt has no digest conflict');
select is((select state from receipt_first), 'accepted'::platform_private.webhook_receipt_state, 'first webhook receipt is durably accepted');
select ok(
  (select payload_digest = decode(repeat('c1', 32), 'hex')
          and signature_verified_at is not null
          and operation_id = '00000000-0000-0000-0000-00000000b404'::uuid
   from platform_private.webhook_receipts
   where id = '00000000-0000-0000-0000-00000000b411'::uuid),
  'receipt persists digest/signature evidence and only a canonical operation reference'
);
select ok(
  (select event_type = 'webhook.accepted'
          and schema_version = 1
          and payload = jsonb_build_object('receiptId', '00000000-0000-0000-0000-00000000b411'::uuid)
   from platform_private.outbox_events
   where aggregate_id = '00000000-0000-0000-0000-00000000b411'::uuid),
  'accepted webhook writes a minimal durable processing intent'
);

create temporary table receipt_duplicate on commit drop as
select * from platform_private.record_webhook_receipt(
  'local', 'evt-1001', decode(repeat('c1', 32), 'hex'), clock_timestamp(),
  '00000000-0000-0000-0000-00000000b404'::uuid,
  '00000000-0000-0000-0000-00000000b413'::uuid,
  '00000000-0000-0000-0000-00000000b414'::uuid,
  null, '00000000-0000-0000-0000-00000000b402'::uuid
);
select is((select receipt_id from receipt_duplicate), '00000000-0000-0000-0000-00000000b411'::uuid, 'same provider event/digest returns original receipt');
select is((select accepted from receipt_duplicate), true, 'verified duplicate is safely acknowledged');
select is((select duplicate from receipt_duplicate), true, 'same provider event/digest is marked duplicate');
select is((select conflict from receipt_duplicate), false, 'same provider event/digest is not a conflict');
select is((select count(*) from platform_private.webhook_receipts where provider = 'local' and external_event_id = 'evt-1001'), 1::bigint, 'verified duplicate creates no second receipt');
select is((select count(*) from platform_private.outbox_events where event_type = 'webhook.accepted' and aggregate_id = '00000000-0000-0000-0000-00000000b411'::uuid), 1::bigint, 'verified duplicate creates no second work item');

create temporary table receipt_conflict on commit drop as
select * from platform_private.record_webhook_receipt(
  'local', 'evt-1001', decode(repeat('cf', 32), 'hex'), clock_timestamp(),
  null, '00000000-0000-0000-0000-00000000b415'::uuid,
  '00000000-0000-0000-0000-00000000b416'::uuid,
  null, '00000000-0000-0000-0000-00000000b402'::uuid
);
select is((select receipt_id from receipt_conflict), '00000000-0000-0000-0000-00000000b411'::uuid, 'digest conflict references the original receipt');
select is((select accepted from receipt_conflict), false, 'conflicting digest is not accepted as work');
select is((select duplicate from receipt_conflict), false, 'conflicting digest is not a verified duplicate');
select is((select conflict from receipt_conflict), true, 'conflicting digest is surfaced as a security conflict');
select is((select state from receipt_conflict), 'manual_review'::platform_private.webhook_receipt_state, 'conflicting digest enters manual review');
select ok(
  exists (
    select 1 from audit_private.audit_events
    where target_id = '00000000-0000-0000-0000-00000000b411'::uuid
      and action = 'webhook.receipt.digest_conflict'
      and reason_code = 'WEBHOOK_DIGEST_CONFLICT'
      and decision = 'failed'::platform_private.audit_decision
  ),
  'conflicting digest writes sanitized immutable security evidence'
);
select throws_ok($$select * from platform_private.record_webhook_receipt('local', 'evt-invalid', decode(repeat('c2', 31), 'hex'), null)$$, '22023', null, 'unverified or malformed webhook evidence is rejected');

select ok(
  platform_private.apply_webhook_receipt_outcome(
    '00000000-0000-0000-0000-00000000b411'::uuid,
    'manual_review'::platform_private.webhook_receipt_state,
    'manual_review'::platform_private.webhook_receipt_state,
    null,
    'WEBHOOK_DIGEST_CONFLICT'
  ),
  'manual-review receipt remains idempotently terminal'
);
select throws_ok($$update platform_private.webhook_receipts set payload_digest = decode(repeat('c3', 32), 'hex') where id = '00000000-0000-0000-0000-00000000b411'::uuid$$, 'P0001', null, 'webhook digest identity is immutable');
select throws_ok($$update platform_private.webhook_receipts set state = 'accepted' where id = '00000000-0000-0000-0000-00000000b411'::uuid$$, 'P0001', null, 'manual-review receipt cannot be reopened');

select * from finish();
rollback;
