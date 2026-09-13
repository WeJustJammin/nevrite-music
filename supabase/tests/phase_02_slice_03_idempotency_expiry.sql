begin;

select plan(21);

-- BE00 audited TTL cleanup is the only supported path that can delete an
-- expired idempotency receipt. Each test owns its transactional fixtures.
select set_config('platform_private.idempotency_expiry_sweep', '', true);
select set_config('platform_private.idempotency_expiry_sweep_at', '', true);

create temporary table idempotency_expiry_clock as
select clock_timestamp() as captured_at;

create temporary table idempotency_expiry_fixtures (
  label text primary key,
  id uuid unique not null,
  actor_id uuid not null,
  operation text not null,
  key_hash bytea not null,
  request_hash bytea not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  claim_token_hash bytea,
  claim_lease_until timestamptz
);

insert into idempotency_expiry_fixtures
select fixture.label, fixture.id, 'd3111111-1111-4111-8111-111111111110',
       fixture.operation,
       extensions.digest(convert_to('expiry-key:' || fixture.label, 'UTF8'), 'sha256'),
       extensions.digest(convert_to(
         case when fixture.label = 'recycle' then 'old-recycle-request'
              else 'expiry-request:' || fixture.label end, 'UTF8'), 'sha256'),
       clock.captured_at + case when fixture.label = 'fresh'
         then interval '-1 day' else interval '-40 days' end,
       clock.captured_at + fixture.expiry_offset,
       case when fixture.lease_offset is null then null
         else extensions.digest(convert_to('expiry-lease:' || fixture.label, 'UTF8'), 'sha256') end,
       case when fixture.lease_offset is null then null
         else clock.captured_at + fixture.lease_offset end
  from (values
    ('recycle', 'e3111111-1111-4111-8111-111111111101'::uuid,
      'identity.context.bind.expiry-recycle', interval '-8 days', null::interval),
    ('backlog-a', 'e3111111-1111-4111-8111-111111111102'::uuid,
      'test.idempotency.backlog-a', interval '-7 days', null::interval),
    ('backlog-b', 'e3111111-1111-4111-8111-111111111103'::uuid,
      'test.idempotency.backlog-b', interval '-7 days', null::interval),
    ('expired-lease', 'e3111111-1111-4111-8111-111111111104'::uuid,
      'cms.schema.event.claim', interval '-5 days', interval '-1 day'),
    ('fresh', 'e3111111-1111-4111-8111-111111111105'::uuid,
      'test.idempotency.fresh', interval '1 day', null::interval),
    ('active-lease', 'e3111111-1111-4111-8111-111111111106'::uuid,
      'cms.schema.event.claim', interval '-4 days', interval '1 day')
  ) as fixture(label, id, operation, expiry_offset, lease_offset)
 cross join idempotency_expiry_clock clock;

insert into platform_private.idempotency_records(
  id, actor_id, operation, key_hash, request_hash, state, response_ref,
  created_at, expires_at, claim_token_hash, claim_lease_until
)
select fixture.id, fixture.actor_id, fixture.operation,
       fixture.key_hash, fixture.request_hash,
       case when fixture.label = 'recycle'
         then 'completed'::platform_private.idempotency_state
         else 'reserved'::platform_private.idempotency_state end,
       case when fixture.label = 'recycle'
         then '{"status":200,"resourceRef":"old-receipt"}'::jsonb
         else null end,
       fixture.created_at, fixture.expires_at,
       fixture.claim_token_hash, fixture.claim_lease_until
  from idempotency_expiry_fixtures fixture;

create temporary table idempotency_expiry_sweep_results (
  label text primary key,
  result jsonb not null
);
create function pg_temp.try_idempotency_expiry_sweep(
  p_limit integer, p_correlation_id uuid
)
returns jsonb language plpgsql as $fn$
declare result jsonb; error_state text;
begin
  execute 'select platform_api.idempotency_expiry_sweep($1, $2)'
    into result using p_limit, p_correlation_id;
  return result;
exception when others then
  get stacked diagnostics error_state = returned_sqlstate;
  return pg_catalog.jsonb_build_object('sqlstate', error_state, 'error', sqlerrm);
end;
$fn$;

select ok(
  coalesce(has_function_privilege('service_role',
    to_regprocedure('platform_api.idempotency_expiry_sweep(integer,uuid)'), 'EXECUTE'), false)
  and coalesce(not has_function_privilege('anon',
    to_regprocedure('platform_api.idempotency_expiry_sweep(integer,uuid)'), 'EXECUTE'), false)
  and coalesce(not has_function_privilege('authenticated',
    to_regprocedure('platform_api.idempotency_expiry_sweep(integer,uuid)'), 'EXECUTE'), false)
  and not exists (
    select 1
      from pg_proc procedure
      cross join lateral aclexplode(coalesce(
        procedure.proacl, acldefault('f', procedure.proowner)
      )) privilege
     where procedure.oid = to_regprocedure('platform_api.idempotency_expiry_sweep(integer,uuid)')
       and privilege.grantee = 0
       and privilege.privilege_type = 'EXECUTE'
  ),
  'audited expiry sweep is executable only by service_role'
);
select ok(
  coalesce((
    select procedure.prosecdef
       and 'search_path=""' = any(procedure.proconfig)
      from pg_proc procedure
     where procedure.oid = to_regprocedure('platform_api.idempotency_expiry_sweep(integer,uuid)')
  ), false),
  'expiry sweep is SECURITY DEFINER with an empty fixed search_path'
);
select ok(
  coalesce(not has_function_privilege('anon',
    to_regprocedure('platform_private.guard_idempotency()'), 'EXECUTE'), false)
  and coalesce(not has_function_privilege('authenticated',
    to_regprocedure('platform_private.guard_idempotency()'), 'EXECUTE'), false)
  and coalesce(not has_function_privilege('service_role',
    to_regprocedure('platform_private.guard_idempotency()'), 'EXECUTE'), false)
  and not exists (
    select 1
      from pg_proc procedure
      cross join lateral aclexplode(coalesce(
        procedure.proacl, acldefault('f', procedure.proowner)
      )) privilege
     where procedure.oid = to_regprocedure('platform_private.guard_idempotency()')
       and privilege.grantee = 0
       and privilege.privilege_type = 'EXECUTE'
  ),
  'trigger guard helper has no direct public or API-role execute grant'
);
select ok(
  coalesce((
    select (pg_catalog.length(pg_catalog.lower(pg_get_functiondef(procedure.oid)))
      - pg_catalog.length(pg_catalog.replace(pg_catalog.lower(pg_get_functiondef(procedure.oid)),
        'for update skip locked', '')))
      / pg_catalog.length('for update skip locked') = 2
      from pg_proc procedure
     where procedure.oid = to_regprocedure('platform_api.idempotency_expiry_sweep(integer,uuid)')
  ), false),
  'expired-row selection and hasMore probe both skip rows locked by a concurrent sweep'
);
select ok(
  (select relrowsecurity and relforcerowsecurity
     from pg_class where oid = 'platform_private.idempotency_records'::regclass)
  and not has_table_privilege('anon', 'platform_private.idempotency_records', 'DELETE')
  and not has_table_privilege('authenticated', 'platform_private.idempotency_records', 'DELETE')
  and not has_table_privilege('service_role', 'platform_private.idempotency_records', 'DELETE')
  and not exists (
    select 1
      from pg_class relation
      cross join lateral aclexplode(coalesce(
        relation.relacl, acldefault('r', relation.relowner)
      )) privilege
     where relation.oid = 'platform_private.idempotency_records'::regclass
       and privilege.grantee = 0
       and privilege.privilege_type = 'DELETE'
  ),
  'FORCE RLS and the table ACL preserve the transaction-local marker trust boundary'
);

select throws_ok($$select platform_api.idempotency_expiry_sweep(
  0, 'f3111111-1111-4111-8111-111111111101')$$,
  'P0001', 'INVALID_REQUEST', 'zero-row sweep limit is rejected');
select throws_ok($$select platform_api.idempotency_expiry_sweep(
  101, 'f3111111-1111-4111-8111-111111111101')$$,
  'P0001', 'INVALID_REQUEST', 'sweep limit above 100 is rejected');
select throws_ok($$select platform_api.idempotency_expiry_sweep(1, null::uuid)$$,
  'P0001', 'INVALID_REQUEST', 'null audit correlation ID is rejected');

select throws_ok(
  format('delete from platform_private.idempotency_records where id = %L::uuid',
    (select id::text from idempotency_expiry_fixtures where label = 'fresh')),
  'P0001', 'idempotency records cannot be deleted',
  'fresh idempotency rows cannot be directly deleted'
);
select throws_ok(
  format('delete from platform_private.idempotency_records where id = %L::uuid',
    (select id::text from idempotency_expiry_fixtures where label = 'recycle')),
  'P0001', 'idempotency records cannot be deleted',
  'expired idempotency rows still require the audited internal sweep marker'
);

create temporary table idempotency_expiry_reserve_before as
select platform_private.identity_idempotency_reserve(
  fixture.actor_id, fixture.operation, fixture.key_hash, fixture.request_hash
) as reservation
  from idempotency_expiry_fixtures fixture
 where fixture.label = 'recycle';
select ok(
  (select (reservation).id = (select id from idempotency_expiry_fixtures where label = 'recycle')
       and (reservation).state = 'completed'::platform_private.idempotency_state
       and (reservation).expires_at < clock_timestamp()
       and (reservation).response_ref->>'resourceRef' = 'old-receipt'
     from idempotency_expiry_reserve_before),
  'expired key is not recycled before the audited sweep and retains its prior receipt'
);
select throws_ok($$select platform_private.identity_idempotency_reserve(
  'd3111111-1111-4111-8111-111111111110', 'test.idempotency.fresh',
  (select key_hash from idempotency_expiry_fixtures where label = 'fresh'),
  extensions.digest(convert_to('changed-fresh-request', 'UTF8'), 'sha256'))$$,
  'P0001', 'IDEMPOTENCY_MISMATCH',
  'unexpired key still rejects a mismatched request hash');
select ok(
  exists (
    select 1 from platform_private.idempotency_records record
    join idempotency_expiry_fixtures fixture on fixture.id = record.id
    where fixture.label = 'fresh'
      and record.request_hash = fixture.request_hash
      and record.state = 'reserved'::platform_private.idempotency_state
      and record.response_ref is null
  ),
  'mismatched replay leaves the original unexpired reservation unchanged'
);

insert into idempotency_expiry_sweep_results
values ('first', pg_temp.try_idempotency_expiry_sweep(
  2, 'f3111111-1111-4111-8111-111111111101'));
select is(
  (select result from idempotency_expiry_sweep_results where label = 'first'),
  '{"deletedCount":2,"hasMore":true}'::jsonb,
  'first bounded sweep returns only the exact count and backlog fields'
);
select ok(
  not exists (
    select 1 from platform_private.idempotency_records
     where id in (select id from idempotency_expiry_fixtures where label in ('recycle', 'backlog-a'))
  )
  and exists (
    select 1 from platform_private.idempotency_records
     where id = (select id from idempotency_expiry_fixtures where label = 'backlog-b')
  ),
  'bounded sweep deletes the oldest eligible rows in expires_at/id order and reports backlog'
);

create temporary table idempotency_expiry_reserve_after as
select platform_private.identity_idempotency_reserve(
  fixture.actor_id, fixture.operation, fixture.key_hash, fixture.request_hash
) as reservation
  from idempotency_expiry_fixtures fixture
 where fixture.label = 'recycle';
select ok(
  (select (reservation).id <> (select id from idempotency_expiry_fixtures where label = 'recycle')
       and (reservation).state = 'reserved'::platform_private.idempotency_state
       and (reservation).response_ref is null
       and (reservation).expires_at > clock_timestamp() + interval '29 days'
     from idempotency_expiry_reserve_after)
  and (select count(*) = 1 from platform_private.idempotency_records record
        join idempotency_expiry_fixtures fixture
          on fixture.actor_id = record.actor_id
         and fixture.operation = record.operation
         and fixture.key_hash = record.key_hash
       where fixture.label = 'recycle'),
  'exact expired key receives a fresh 30-day reservation only after audited deletion'
);

insert into idempotency_expiry_sweep_results
values ('second', pg_temp.try_idempotency_expiry_sweep(
  2, 'f3111111-1111-4111-8111-111111111102'));
select is(
  (select result from idempotency_expiry_sweep_results where label = 'second'),
  '{"deletedCount":2,"hasMore":false}'::jsonb,
  'second bounded sweep consumes the remaining eligible backlog'
);
select ok(
  not exists (
    select 1 from platform_private.idempotency_records
     where id = (select id from idempotency_expiry_fixtures where label = 'expired-lease')
  )
  and exists (
    select 1 from platform_private.idempotency_records
     where id = (select id from idempotency_expiry_fixtures where label = 'active-lease')
       and claim_lease_until > clock_timestamp()
  )
  and exists (
    select 1 from platform_private.idempotency_records
     where id = (select id from idempotency_expiry_fixtures where label = 'fresh')
       and expires_at > clock_timestamp()
  ),
  'expired claim leases become eligible while live leases and fresh rows are preserved'
);
select ok(
  (select count(*) = 4
       and bool_and(action = 'idempotency.expired'
         and actor_id is null
         and acting_party_id = '00000000-0000-0000-0000-000000000001'
         and target_type = 'idempotency_record'
         and reason_code = 'TTL_EXPIRED'
         and decision = 'completed'
         and (target_id in (select id from idempotency_expiry_fixtures where label in ('recycle', 'backlog-a'))
           and correlation_id = 'f3111111-1111-4111-8111-111111111101'
           or target_id in (select id from idempotency_expiry_fixtures where label in ('backlog-b', 'expired-lease'))
           and correlation_id = 'f3111111-1111-4111-8111-111111111102'))
      from audit_private.audit_events
     where target_id in (select id from idempotency_expiry_fixtures
                          where label in ('recycle', 'backlog-a', 'backlog-b', 'expired-lease'))),
  'each deleted row has one correlated TTL_EXPIRED audit event for the system principal'
);
select is(
  pg_temp.try_idempotency_expiry_sweep(1, 'f3111111-1111-4111-8111-111111111103'),
  '{"deletedCount":0,"hasMore":false}'::jsonb,
  'empty sweep reports no deletions and no eligible backlog'
);

insert into platform_private.idempotency_records(
  id, actor_id, operation, key_hash, request_hash, created_at, expires_at
) values (
  'e3111111-1111-4111-8111-111111111107',
  'd3111111-1111-4111-8111-111111111110',
  'test.idempotency.captured-edge',
  extensions.digest(convert_to('expiry-key:captured-edge', 'UTF8'), 'sha256'),
  extensions.digest(convert_to('expiry-request:captured-edge', 'UTF8'), 'sha256'),
  clock_timestamp() - interval '2 days',
  clock_timestamp() - interval '3 seconds'
);
select set_config(
  'platform_private.idempotency_expiry_sweep',
  '11111111-1111-4111-8111-111111111111', true
);
select set_config(
  'platform_private.idempotency_expiry_sweep_at',
  (select (expires_at - interval '1 second')::text
     from platform_private.idempotency_records
    where id = 'e3111111-1111-4111-8111-111111111107'), true
);
select throws_ok(
  $$delete from platform_private.idempotency_records
      where id = 'e3111111-1111-4111-8111-111111111107'$$,
  'P0001', 'idempotency records cannot be deleted',
  'expiry after the captured sweep time cannot pass the internal delete guard'
);
select set_config('platform_private.idempotency_expiry_sweep', '', true);
select set_config('platform_private.idempotency_expiry_sweep_at', '', true);

select * from finish();
rollback;
