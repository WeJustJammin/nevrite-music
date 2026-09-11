-- AC209 production evidence verification boundaries.  These functions are
-- deliberately read-only: the production exercise owns queue injection and
-- cleanup, while PostgreSQL owns the receipt digest and exact delivery match.

-- The UUID receipt remains an internal database correlation. Email Sending
-- owns the provider message identifier, so retain only its fixed-length digest for the
-- provider-to-database verification join.
alter table platform_private.cms_operational_alert_deliveries
  add column if not exists provider_message_hash bytea
  check (
    provider_message_hash is null
    or octet_length(provider_message_hash) = 32
  );

create index if not exists cms_operational_alert_deliveries_provider_idx
  on platform_private.cms_operational_alert_deliveries(
    alert_code, release, provider_message_hash
  )
  where provider_message_hash is not null;

create or replace function platform_api.cms_verify_operational_alert_delivery(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alert_code text;
  v_not_before timestamptz;
  v_release text;
  v_provider_message_id text;
  v_provider_message_hash bytea;
  v_match_count integer;
  v_claimed_at timestamptz;
  v_delivered_at timestamptz;
begin
  if p_request is null
    or pg_catalog.jsonb_typeof(p_request) <> 'object'
    or p_request - array['alertCode', 'notBefore', 'release', 'providerMessageId']::text[] <> '{}'::jsonb
    or not (p_request ?& array['alertCode', 'notBefore', 'release', 'providerMessageId']::text[])
    or pg_catalog.jsonb_typeof(p_request->'alertCode') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'notBefore') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'release') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'providerMessageId') <> 'string'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert delivery verification';
  end if;

  v_alert_code := p_request->>'alertCode';
  v_release := p_request->>'release';
  v_provider_message_id := p_request->>'providerMessageId';
  begin
    v_not_before := (p_request->>'notBefore')::timestamptz;
  exception when others then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert delivery verification';
  end;

  if v_alert_code <> 'dlq_nonempty'
    or v_release !~ '^[0-9a-f]{40}$'
    or not pg_catalog.isfinite(v_not_before)
    or v_not_before < pg_catalog.clock_timestamp() - interval '65 minutes'
    or v_not_before > pg_catalog.clock_timestamp() + interval '5 minutes'
    or pg_catalog.octet_length(v_provider_message_id) not between 1 and 512
    or pg_catalog.octet_length(v_provider_message_id) <> pg_catalog.char_length(v_provider_message_id)
    or v_provider_message_id !~ '^[!-~]+$'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert delivery verification';
  end if;

  -- Hash exactly the provider message identifier. The completion RPC uses the
  -- same representation, so alternate spellings cannot be mistaken for a
  -- match and the raw provider identifier never leaves this boundary.
  v_provider_message_hash := extensions.digest(
    pg_catalog.convert_to(v_provider_message_id, 'utf8'),
    'sha256'
  );

  select count(*)::integer
    into v_match_count
    from platform_private.cms_operational_alert_deliveries delivery
   where delivery.alert_code = v_alert_code
     and delivery.release = v_release
     and delivery.state = 'delivered'
     and delivery.claimed_at >= v_not_before
     and delivery.delivered_at is not null
     and delivery.delivered_at >= v_not_before
     and delivery.provider_message_hash = v_provider_message_hash;

  -- A missing or ambiguous receipt is not evidence.  Return only a bounded
  -- negative result so callers can poll without learning private row data.
  if v_match_count <> 1 then
    return pg_catalog.jsonb_build_object(
      'schemaVersion', 'ac209-delivery-verification-v1',
      'verified', false
    );
  end if;

  select delivery.claimed_at, delivery.delivered_at
    into v_claimed_at, v_delivered_at
    from platform_private.cms_operational_alert_deliveries delivery
   where delivery.alert_code = v_alert_code
     and delivery.release = v_release
     and delivery.state = 'delivered'
     and delivery.claimed_at >= v_not_before
     and delivery.delivered_at is not null
     and delivery.delivered_at >= v_not_before
     and delivery.provider_message_hash = v_provider_message_hash;

  return pg_catalog.jsonb_build_object(
    'schemaVersion', 'ac209-delivery-verification-v1',
    'verified', true,
    'alertCode', v_alert_code,
    'release', v_release,
    'state', 'delivered',
    'claimedAt', v_claimed_at,
    'deliveredAt', v_delivered_at,
    'providerMessageIdMatched', true
  );
end;
$$;

create or replace function platform_api.cms_get_operational_alert_exercise_eligibility(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alert_code text;
  v_checked_at timestamptz;
  v_blocked_until timestamptz;
begin
  if p_request is null
    or pg_catalog.jsonb_typeof(p_request) <> 'object'
    or p_request - array['alertCode', 'checkedAt']::text[] <> '{}'::jsonb
    or not (p_request ?& array['alertCode', 'checkedAt']::text[])
    or pg_catalog.jsonb_typeof(p_request->'alertCode') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'checkedAt') <> 'string'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert exercise eligibility';
  end if;

  v_alert_code := p_request->>'alertCode';
  begin
    v_checked_at := (p_request->>'checkedAt')::timestamptz;
  exception when others then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert exercise eligibility';
  end;

  if v_alert_code <> 'dlq_nonempty'
    or v_checked_at < pg_catalog.clock_timestamp() - interval '5 minutes'
    or v_checked_at > pg_catalog.clock_timestamp() + interval '5 minutes'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert exercise eligibility';
  end if;

  -- Mirror the alert-claim cooldowns without exposing any delivery identity.
  -- A recent claim blocks for five minutes; a delivered claim blocks for
  -- fifteen.  The maximum deadline is returned when both are present.
  select max(cooldown.blocked_until)
    into v_blocked_until
    from (
      select delivery.claimed_at + interval '5 minutes' as blocked_until
        from platform_private.cms_operational_alert_deliveries delivery
       where delivery.alert_code = v_alert_code
         and delivery.claimed_at >= v_checked_at - interval '5 minutes'
      union all
      select delivery.delivered_at + interval '15 minutes' as blocked_until
        from platform_private.cms_operational_alert_deliveries delivery
       where delivery.alert_code = v_alert_code
         and delivery.delivered_at is not null
         and delivery.delivered_at >= v_checked_at - interval '15 minutes'
    ) cooldown;

  return pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
    'schemaVersion', 'ac209-exercise-eligibility-v1',
    'eligible', v_blocked_until is null,
    'checkedAt', v_checked_at,
    'blockedUntil', v_blocked_until
  ));
end;
$$;

-- Expand the original completion boundary so provider-owned correlation is
-- persisted atomically with the internal UUID receipt. The five-field body
-- remains valid while the previously deployed Worker can run between this
-- migration and the new Worker deployment; new callers add providerMessageId.
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
  v_provider_message_id text;
begin
  if p_request is null
    or pg_catalog.jsonb_typeof(p_request) <> 'object'
    or p_request - array[
      'alertCode', 'claimId', 'claimToken', 'deliveredAt',
      'providerMessageId', 'receiptId'
    ]::text[] <> '{}'::jsonb
    or not (p_request ?& array[
      'alertCode', 'claimId', 'claimToken', 'deliveredAt', 'receiptId'
    ]::text[])
    or pg_catalog.jsonb_typeof(p_request->'alertCode') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'claimId') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'claimToken') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'deliveredAt') <> 'string'
    or (
      p_request ? 'providerMessageId'
      and pg_catalog.jsonb_typeof(p_request->'providerMessageId') <> 'string'
    )
    or pg_catalog.jsonb_typeof(p_request->'receiptId') <> 'string'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert completion';
  end if;

  v_alert_code := p_request->>'alertCode';
  v_claim_token := p_request->>'claimToken';
  v_receipt_id := p_request->>'receiptId';
  v_provider_message_id := p_request->>'providerMessageId';
  begin
    v_claim_id := (p_request->>'claimId')::uuid;
    perform v_claim_token::uuid;
    perform v_receipt_id::uuid;
    v_delivered_at := (p_request->>'deliveredAt')::timestamptz;
  exception when others then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert completion';
  end;
  if v_delivered_at < now() - interval '10 minutes'
    or v_delivered_at > now() + interval '5 minutes'
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert completion time';
  end if;
  if v_provider_message_id is not null
    and (
      pg_catalog.octet_length(v_provider_message_id) not between 1 and 512
      or pg_catalog.octet_length(v_provider_message_id) <> pg_catalog.char_length(v_provider_message_id)
      or v_provider_message_id !~ '^[!-~]+$'
    )
  then
    raise exception using
      errcode = '22023',
      message = 'invalid operational alert completion';
  end if;

  update platform_private.cms_operational_alert_deliveries delivery
     set state = 'delivered',
         delivered_at = v_delivered_at,
         receipt_hash = extensions.digest(
           pg_catalog.convert_to(v_receipt_id, 'utf8'), 'sha256'
         ),
         provider_message_hash = case
           when v_provider_message_id is null then null
           else extensions.digest(
             pg_catalog.convert_to(v_provider_message_id, 'utf8'), 'sha256'
           )
         end
   where delivery.id = v_claim_id
     and delivery.alert_code = v_alert_code
     and delivery.state = 'claimed'
     and delivery.claim_token_hash = extensions.digest(
       pg_catalog.convert_to(v_claim_token, 'utf8'), 'sha256'
     );
  return found;
end;
$$;

revoke all on function platform_api.cms_verify_operational_alert_delivery(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function platform_api.cms_get_operational_alert_exercise_eligibility(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.cms_verify_operational_alert_delivery(jsonb)
  to service_role;
grant execute on function platform_api.cms_get_operational_alert_exercise_eligibility(jsonb)
  to service_role;
