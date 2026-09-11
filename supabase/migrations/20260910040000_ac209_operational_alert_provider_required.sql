-- AC209 post-expand contract tighten. The provider-aware Worker is deployed,
-- so completion now requires the provider-owned message identifier. Keep the
-- previously deployed expand migration's nullable digest column: historical
-- legacy rows remain valid evidence records without a provider digest.
--
-- This is intentionally forward-only. Do not replay the expand migration or
-- make provider_message_hash NOT NULL; an emergency rollback must restore the
-- prior application binary while leaving this additive function replacement in
-- place until the deployment is corrected.
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
      'alertCode', 'claimId', 'claimToken', 'deliveredAt',
      'providerMessageId', 'receiptId'
    ]::text[])
    or pg_catalog.jsonb_typeof(p_request->'alertCode') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'claimId') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'claimToken') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'deliveredAt') <> 'string'
    or pg_catalog.jsonb_typeof(p_request->'providerMessageId') <> 'string'
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

  -- Provider message IDs are opaque values returned by Email Sending, not
  -- caller-authored RFC Message-ID headers. Validate every completion request
  -- as visible ASCII and bound both its bytes and characters.
  if v_provider_message_id is null
    or pg_catalog.octet_length(v_provider_message_id) not between 1 and 512
    or pg_catalog.octet_length(v_provider_message_id) <> pg_catalog.char_length(v_provider_message_id)
    or v_provider_message_id !~ '^[!-~]+$'
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
         provider_message_hash = extensions.digest(
           pg_catalog.convert_to(v_provider_message_id, 'utf8'), 'sha256'
         )
   where delivery.id = v_claim_id
     and delivery.alert_code = v_alert_code
     and delivery.state = 'claimed'
     and delivery.claim_token_hash = extensions.digest(
       pg_catalog.convert_to(v_claim_token, 'utf8'), 'sha256'
     );
  return found;
end;
$$;

revoke all on function platform_api.cms_complete_operational_alert(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.cms_complete_operational_alert(jsonb)
  to service_role;
