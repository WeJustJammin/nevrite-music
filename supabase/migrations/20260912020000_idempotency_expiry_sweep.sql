-- BE00 receipts remain immutable until their audited TTL cleanup.  Custom
-- transaction-local GUCs are caller-settable, so the marker is not an auth
-- boundary: direct DELETE remains revoked from every API role and PUBLIC.
-- Keep that ACL invariant covered by phase_02_slice_03_idempotency_expiry.sql.
revoke delete on table platform_private.idempotency_records
from public, anon, authenticated, service_role;

create or replace function platform_private.guard_idempotency()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  sweep_marker text := nullif(
    pg_catalog.current_setting('platform_private.idempotency_expiry_sweep', true), ''
  );
  sweep_at_text text := nullif(
    pg_catalog.current_setting('platform_private.idempotency_expiry_sweep_at', true), ''
  );
  captured_now timestamptz;
begin
  if tg_op = 'DELETE' then
    if sweep_marker is null
       or sweep_marker !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or sweep_at_text is null then
      raise exception 'idempotency records cannot be deleted' using errcode = 'P0001';
    end if;
    begin
      captured_now := sweep_at_text::timestamptz;
    exception when others then
      raise exception 'idempotency records cannot be deleted' using errcode = 'P0001';
    end;
    if old.expires_at > captured_now
       or (old.claim_lease_until is not null and old.claim_lease_until > captured_now) then
      raise exception 'idempotency records cannot be deleted' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if new.id is distinct from old.id or new.actor_id is distinct from old.actor_id
     or new.operation is distinct from old.operation or new.key_hash is distinct from old.key_hash
     or new.request_hash is distinct from old.request_hash or new.created_at is distinct from old.created_at
     or new.expires_at is distinct from old.expires_at then
    raise exception 'idempotency identity and request are immutable' using errcode = 'P0001';
  end if;
  if old.state = 'completed'::platform_private.idempotency_state and
     (new.state is distinct from old.state or new.response_ref is distinct from old.response_ref) then
    raise exception 'completed idempotency result is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'reserved'::platform_private.idempotency_state and new.state not in ('reserved'::platform_private.idempotency_state, 'completed'::platform_private.idempotency_state, 'failed_retryable'::platform_private.idempotency_state)
     or old.state = 'failed_retryable'::platform_private.idempotency_state and new.state not in ('reserved'::platform_private.idempotency_state, 'failed_retryable'::platform_private.idempotency_state) then
    raise exception 'invalid idempotency state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$fn$;

revoke all on function platform_private.guard_idempotency()
from public, anon, authenticated, service_role;
comment on function platform_private.guard_idempotency() is
  'The expiry marker GUC is not an authorization boundary; API-role DELETE remains revoked and tested.';

create or replace function platform_api.idempotency_expiry_sweep(
  p_limit integer,
  p_correlation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  now_at timestamptz := pg_catalog.clock_timestamp();
  expired_row platform_private.idempotency_records%rowtype;
  deleted_row platform_private.idempotency_records%rowtype;
  eligible_id uuid;
  deleted_count integer := 0;
  has_more boolean := false;
  sweep_marker text := extensions.gen_random_uuid()::text;
begin
  if p_limit is null or p_limit not between 1 and 100
     or p_correlation_id is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  perform pg_catalog.set_config(
    'platform_private.idempotency_expiry_sweep', sweep_marker, true
  );
  perform pg_catalog.set_config(
    'platform_private.idempotency_expiry_sweep_at', now_at::text, true
  );

  for expired_row in
    select record_row.*
      from platform_private.idempotency_records record_row
     where record_row.expires_at <= now_at
       and (record_row.claim_lease_until is null
         or record_row.claim_lease_until <= now_at)
     order by record_row.expires_at, record_row.id
     limit p_limit
     for update skip locked
  loop
    delete from platform_private.idempotency_records record_row
     where record_row.id = expired_row.id
       and record_row.expires_at <= now_at
       and (record_row.claim_lease_until is null
         or record_row.claim_lease_until <= now_at)
    returning record_row.* into deleted_row;

    if found then
      insert into audit_private.audit_events(
        action, actor_id, acting_party_id, target_type, target_id,
        decision, reason_code, correlation_id
      ) values (
        'idempotency.expired', null,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'idempotency_record', deleted_row.id,
        'completed'::platform_private.audit_decision, 'TTL_EXPIRED',
        p_correlation_id
      );
      deleted_count := deleted_count + 1;
    end if;
  end loop;

  perform pg_catalog.set_config('platform_private.idempotency_expiry_sweep', '', true);
  perform pg_catalog.set_config('platform_private.idempotency_expiry_sweep_at', '', true);

  select record_row.id into eligible_id
    from platform_private.idempotency_records record_row
   where record_row.expires_at <= now_at
     and (record_row.claim_lease_until is null
       or record_row.claim_lease_until <= now_at)
   order by record_row.expires_at, record_row.id
   limit 1
   for update skip locked;
  has_more := eligible_id is not null;

  return pg_catalog.jsonb_build_object(
    'deletedCount', deleted_count,
    'hasMore', has_more
  );
end;
$fn$;

revoke all on function platform_api.idempotency_expiry_sweep(integer, uuid)
from public, anon, authenticated, service_role;
grant execute on function platform_api.idempotency_expiry_sweep(integer, uuid)
to service_role;
