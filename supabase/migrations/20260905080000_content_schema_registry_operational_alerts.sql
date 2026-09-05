create table platform_private.cms_operational_alert_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  alert_code text not null check (
    alert_code in (
      'activation_blocked', 'migration_retry_exceeded', 'nonce_rejection_spike',
      'dlq_nonempty', 'outbox_age_exceeded', 'conflict_rate_exceeded',
      'unknown_event_version', 'command_p95_exceeded',
      'protected_rpc_p95_exceeded', 'acceptance_p99_exceeded',
      'queue_first_attempt_p95_exceeded', 'daily_dlq_rate_exceeded'
    )
  ),
  release text not null check (release ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$'),
  state text not null default 'claimed' check (state in ('claimed', 'delivered')),
  claim_token_hash bytea not null check (octet_length(claim_token_hash) = 32),
  claimed_at timestamptz not null default now(),
  delivered_at timestamptz,
  receipt_hash bytea check (receipt_hash is null or octet_length(receipt_hash) = 32),
  check (
    (state = 'claimed' and delivered_at is null and receipt_hash is null)
    or (state = 'delivered' and delivered_at is not null and receipt_hash is not null)
  )
);

alter table platform_private.cms_operational_alert_deliveries enable row level security;
revoke all on table platform_private.cms_operational_alert_deliveries from public, anon, authenticated, service_role;

create index cms_operational_alert_deliveries_recent_idx
  on platform_private.cms_operational_alert_deliveries(alert_code, claimed_at desc);

create or replace function platform_api.cms_get_operational_state_snapshot(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  observed_at timestamptz;
  activation_blocked_ms numeric;
  outbox_age_ms numeric;
begin
  if p_request is null
    or pg_catalog.jsonb_typeof(p_request) <> 'object'
    or p_request - array['observedAt']::text[] <> '{}'::jsonb
    or not (p_request ? 'observedAt')
  then
    raise exception using errcode = '22023', message = 'invalid operational snapshot request';
  end if;
  begin
    observed_at := (p_request->>'observedAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'invalid operational snapshot request';
  end;
  if observed_at < now() - interval '2 days' or observed_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'invalid operational snapshot time';
  end if;

  select max(greatest(0, extract(epoch from (observed_at - plan.updated_at)) * 1000))
    into activation_blocked_ms
    from platform_private.cms_schema_migration_plans plan
   where plan.state = 'blocked'
     and plan.updated_at <= observed_at;

  select max(greatest(0, extract(epoch from (observed_at - event.occurred_at)) * 1000))
    into outbox_age_ms
    from platform_private.outbox_events event
   where event.dispatched_at is null
     and event.dead_lettered_at is null
     and event.occurred_at <= observed_at;

  return pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
    'activationBlockedMs', activation_blocked_ms,
    'outboxAgeMs', outbox_age_ms
  ));
end;
$$;

create or replace function platform_api.cms_claim_operational_alert(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alert_code text;
  v_claim_token text;
  v_release text;
  v_scheduled_at timestamptz;
  v_claim_id uuid;
begin
  if p_request is null
    or pg_catalog.jsonb_typeof(p_request) <> 'object'
    or p_request - array['alertCode', 'claimToken', 'release', 'scheduledAt']::text[] <> '{}'::jsonb
  then
    raise exception using errcode = '22023', message = 'invalid operational alert claim';
  end if;
  v_alert_code := p_request->>'alertCode';
  v_claim_token := p_request->>'claimToken';
  v_release := p_request->>'release';
  begin
    v_scheduled_at := (p_request->>'scheduledAt')::timestamptz;
    perform v_claim_token::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'invalid operational alert claim';
  end;
  if v_alert_code not in (
      'activation_blocked', 'migration_retry_exceeded', 'nonce_rejection_spike',
      'dlq_nonempty', 'outbox_age_exceeded', 'conflict_rate_exceeded',
      'unknown_event_version', 'command_p95_exceeded',
      'protected_rpc_p95_exceeded', 'acceptance_p99_exceeded',
      'queue_first_attempt_p95_exceeded', 'daily_dlq_rate_exceeded'
    )
    or v_release !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$'
    or v_scheduled_at < now() - interval '10 minutes'
    or v_scheduled_at > now() + interval '5 minutes'
  then
    raise exception using errcode = '22023', message = 'invalid operational alert claim';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_alert_code, 0));
  if exists (
    select 1
      from platform_private.cms_operational_alert_deliveries delivery
     where delivery.alert_code = v_alert_code
       and (
         (delivery.state = 'claimed' and delivery.claimed_at >= now() - interval '5 minutes')
         or (delivery.state = 'delivered' and delivery.delivered_at >= now() - interval '15 minutes')
       )
  ) then
    return pg_catalog.jsonb_build_object('claimed', false);
  end if;

  insert into platform_private.cms_operational_alert_deliveries(
    alert_code, release, claim_token_hash
  ) values (
    v_alert_code,
    v_release,
    extensions.digest(pg_catalog.convert_to(v_claim_token, 'utf8'), 'sha256')
  ) returning id into v_claim_id;
  return pg_catalog.jsonb_build_object('claimed', true, 'claimId', v_claim_id);
end;
$$;

create or replace function platform_api.cms_complete_operational_alert(p_request jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alert_code text;
  v_claim_id uuid;
  v_claim_token text;
  v_delivered_at timestamptz;
  v_receipt_id text;
begin
  if p_request is null
    or pg_catalog.jsonb_typeof(p_request) <> 'object'
    or p_request - array['alertCode', 'claimId', 'claimToken', 'deliveredAt', 'receiptId']::text[] <> '{}'::jsonb
  then
    raise exception using errcode = '22023', message = 'invalid operational alert completion';
  end if;
  v_alert_code := p_request->>'alertCode';
  v_claim_token := p_request->>'claimToken';
  v_receipt_id := p_request->>'receiptId';
  begin
    v_claim_id := (p_request->>'claimId')::uuid;
    perform v_claim_token::uuid;
    perform v_receipt_id::uuid;
    v_delivered_at := (p_request->>'deliveredAt')::timestamptz;
  exception when others then
    raise exception using errcode = '22023', message = 'invalid operational alert completion';
  end;
  if v_delivered_at < now() - interval '10 minutes' or v_delivered_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'invalid operational alert completion time';
  end if;

  update platform_private.cms_operational_alert_deliveries delivery
     set state = 'delivered',
         delivered_at = v_delivered_at,
         receipt_hash = extensions.digest(pg_catalog.convert_to(v_receipt_id, 'utf8'), 'sha256')
   where delivery.id = v_claim_id
     and delivery.alert_code = v_alert_code
     and delivery.state = 'claimed'
     and delivery.claim_token_hash = extensions.digest(pg_catalog.convert_to(v_claim_token, 'utf8'), 'sha256');
  return found;
end;
$$;

revoke all on function platform_api.cms_get_operational_state_snapshot(jsonb) from public, anon, authenticated;
revoke all on function platform_api.cms_claim_operational_alert(jsonb) from public, anon, authenticated;
revoke all on function platform_api.cms_complete_operational_alert(jsonb) from public, anon, authenticated;
grant execute on function platform_api.cms_get_operational_state_snapshot(jsonb) to service_role;
grant execute on function platform_api.cms_claim_operational_alert(jsonb) to service_role;
grant execute on function platform_api.cms_complete_operational_alert(jsonb) to service_role;
