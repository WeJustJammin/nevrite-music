-- Context IDs are canonical party IDs; acting-context binding IDs remain
-- opaque, POST-created selectors scoped to one person and client tab.

create or replace function platform_private.identity_context_candidate(
  p_person_id uuid,
  p_party_id uuid,
  p_lock_sources boolean default false
)
returns table (
  acting_party_id uuid,
  context_kind text,
  source_relationship_id uuid,
  projection_version bigint,
  display_label text,
  sort_rank integer
)
language plpgsql volatile security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  candidate record;
  now_at timestamptz := pg_catalog.clock_timestamp();
begin
  if p_person_id is null or p_party_id is null then
    return;
  end if;

  if p_party_id = p_person_id then
    if p_lock_sources then
      select party_row.id as party_id, party_row.version as party_version,
             person_row.version as entity_version
        into candidate
        from platform_private.party party_row
        join platform_private.person_party person_row
          on person_row.party_id = party_row.id
       where party_row.id = p_party_id
         and party_row.kind = 'person'
         and person_row.account_state in ('claimed', 'active')
       for share of party_row, person_row;
    else
      select party_row.id as party_id, party_row.version as party_version,
             person_row.version as entity_version
        into candidate
        from platform_private.party party_row
        join platform_private.person_party person_row
          on person_row.party_id = party_row.id
       where party_row.id = p_party_id
         and party_row.kind = 'person'
         and person_row.account_state in ('claimed', 'active');
    end if;
    if found then
      return query select candidate.party_id, 'person'::text, null::uuid,
        greatest(candidate.party_version, candidate.entity_version),
        'Your profile'::text, 0;
      return;
    end if;
  end if;

  if p_lock_sources then
    select party_row.id as party_id, party_row.version as party_version,
           alias_row.version as entity_version, ownership.id as relationship_id,
           alias_row.display_name as candidate_label
      into candidate
      from platform_private.party party_row
      join platform_private.alias_party alias_row
        on alias_row.party_id = party_row.id
      join platform_private.alias_ownership_period ownership
        on ownership.alias_id = alias_row.party_id
       and ownership.owner_person_id = p_person_id
       and ownership.starts_at <= now_at
       and ownership.ends_at is null
     where party_row.id = p_party_id
       and party_row.kind = 'alias'
       and alias_row.lifecycle = 'active'
     order by ownership.starts_at desc, ownership.id desc
     limit 1
     for share of party_row, alias_row, ownership;
  else
    select party_row.id as party_id, party_row.version as party_version,
           alias_row.version as entity_version, ownership.id as relationship_id,
           alias_row.display_name as candidate_label
      into candidate
      from platform_private.party party_row
      join platform_private.alias_party alias_row
        on alias_row.party_id = party_row.id
      join platform_private.alias_ownership_period ownership
        on ownership.alias_id = alias_row.party_id
       and ownership.owner_person_id = p_person_id
       and ownership.starts_at <= now_at
       and ownership.ends_at is null
     where party_row.id = p_party_id
       and party_row.kind = 'alias'
       and alias_row.lifecycle = 'active'
     order by ownership.starts_at desc, ownership.id desc
     limit 1;
  end if;
  if found then
    return query select candidate.party_id, 'alias'::text,
      candidate.relationship_id,
      greatest(candidate.party_version, candidate.entity_version),
      candidate.candidate_label, 1;
    return;
  end if;

  if p_lock_sources then
    select party_row.id as party_id, party_row.version as party_version,
           organization_row.version as organization_version,
           tenure.version as tenure_version, tenure.id as relationship_id
      into candidate
      from platform_private.party party_row
      join identity_private.organization_party organization_row
        on organization_row.party_id = party_row.id
      join identity_private.membership_tenure tenure
        on tenure.organization_id = organization_row.party_id
       and tenure.person_id = p_person_id
       and tenure.state = 'confirmed'
       and tenure.accepted_at is not null
       and tenure.accepted_at <= now_at
       and tenure.revoked_at is null
       and tenure.starts_on <= current_date
       and (tenure.ends_on is null or tenure.ends_on > current_date)
     where party_row.id = p_party_id
       and party_row.kind = 'organization'
       and organization_row.lifecycle = 'active'
     order by tenure.starts_on desc, tenure.accepted_at desc, tenure.id desc
     limit 1
     for share of party_row, organization_row, tenure;
  else
    select party_row.id as party_id, party_row.version as party_version,
           organization_row.version as organization_version,
           tenure.version as tenure_version, tenure.id as relationship_id
      into candidate
      from platform_private.party party_row
      join identity_private.organization_party organization_row
        on organization_row.party_id = party_row.id
      join identity_private.membership_tenure tenure
        on tenure.organization_id = organization_row.party_id
       and tenure.person_id = p_person_id
       and tenure.state = 'confirmed'
       and tenure.accepted_at is not null
       and tenure.accepted_at <= now_at
       and tenure.revoked_at is null
       and tenure.starts_on <= current_date
       and (tenure.ends_on is null or tenure.ends_on > current_date)
     where party_row.id = p_party_id
       and party_row.kind = 'organization'
       and organization_row.lifecycle = 'active'
     order by tenure.starts_on desc, tenure.accepted_at desc, tenure.id desc
     limit 1;
  end if;
  if found then
    return query select candidate.party_id, 'organization'::text,
      candidate.relationship_id,
      greatest(candidate.party_version,
        candidate.organization_version, candidate.tenure_version),
      'Organization'::text, 2;
    return;
  end if;

  return;
end;
$fn$;

revoke all on function platform_private.identity_context_candidate(uuid, uuid, boolean)
from public, anon, authenticated, service_role;

-- Keep idempotency receipts bounded while allowing this RPC to persist its
-- original strict response for safe replay after a later tab switch.
create or replace function platform_private.valid_response_ref(value jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $fn$
declare
  status text;
  key text;
  receipt jsonb;
  receipt_key text;
begin
  if value is null then return true; end if;
  if pg_catalog.jsonb_typeof(value) <> 'object' or not (value ? 'status') then return false; end if;
  if pg_catalog.jsonb_typeof(value->'status') <> 'number' then return false; end if;
  status := value->>'status';
  if status !~ '^[1-5][0-9]{2}$' then return false; end if;
  for key in select pg_catalog.jsonb_object_keys(value) loop
    if key not in ('status', 'resourceRef', 'jobRef', 'safeHeaders', 'responseBody', 'receipt') then return false; end if;
  end loop;
  if value ? 'safeHeaders' and pg_catalog.jsonb_typeof(value->'safeHeaders') <> 'object' then return false; end if;
  if value ? 'responseBody' and pg_catalog.jsonb_typeof(value->'responseBody') <> 'object' then return false; end if;
  if value ? 'resourceRef' and value->'resourceRef' <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(value->'resourceRef') <> 'string' or pg_catalog.btrim(value->>'resourceRef') = '') then return false; end if;
  if value ? 'jobRef' and value->'jobRef' <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(value->'jobRef') <> 'string' or pg_catalog.btrim(value->>'jobRef') = '') then return false; end if;
  if value ? 'receipt' then
    receipt := value->'receipt';
    if pg_catalog.jsonb_typeof(receipt) <> 'object' then
      return false;
    end if;
    if not (receipt ?& array['bindingId', 'selectedPartyId', 'expiresAt', 'projectionVersion', 'version']) then
      return false;
    end if;
    for receipt_key in select pg_catalog.jsonb_object_keys(receipt) loop
      if receipt_key not in ('bindingId', 'selectedPartyId', 'expiresAt', 'projectionVersion', 'version') then
        return false;
      end if;
      if pg_catalog.jsonb_typeof(receipt->receipt_key) <> 'string' then return false; end if;
    end loop;
    if receipt->>'bindingId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or receipt->>'selectedPartyId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or receipt->>'expiresAt' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then
      return false;
    end if;
    begin
      if (receipt->>'projectionVersion') !~ '^[1-9][0-9]{0,18}$'
         or (receipt->>'version') !~ '^[1-9][0-9]{0,18}$'
         or (receipt->>'projectionVersion')::numeric > 9223372036854775807
         or (receipt->>'version')::numeric > 9223372036854775807 then
        return false;
      end if;
      perform (receipt->>'expiresAt')::timestamptz;
    exception when others then
      return false;
    end;
  end if;
  return true;
end;
$fn$;

create or replace function platform_api.identity_contexts_read(p_cursor text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  now_at timestamptz := pg_catalog.clock_timestamp();
  cursor_payload text;
  cursor_rank integer;
  cursor_party_id uuid;
  items jsonb;
  projection_version bigint;
  has_more boolean := false;
  next_cursor text;
begin
  if p_cursor is not null then
    begin
      if pg_catalog.char_length(p_cursor) <> 51
         or p_cursor !~ '^[A-Za-z0-9_-]{51}$' then
        raise exception 'INVALID_CURSOR';
      end if;
      cursor_payload := pg_catalog.convert_from(
        pg_catalog.decode(
          pg_catalog.translate(p_cursor, '-_', '+/') || '=',
          'base64'
        ),
        'UTF8'
      );
      if cursor_payload !~ '^[0-2]\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'INVALID_CURSOR';
      end if;
      cursor_rank := pg_catalog.split_part(cursor_payload, '|', 1)::integer;
      cursor_party_id := pg_catalog.split_part(cursor_payload, '|', 2)::uuid;
    exception when others then
      raise exception 'INVALID_CURSOR' using errcode = 'P0001';
    end;
  end if;

  update platform_private.acting_context_binding binding_row
     set state = 'expired', version = binding_row.version + 1,
         updated_at = now_at
   where binding_row.person_id = person_id
     and binding_row.state = 'active'
     and binding_row.client_binding_id <> 'self'
     and (binding_row.expires_at <= now_at
       or binding_row.last_seen_at <= now_at - interval '12 hours');

  with candidate_party_ids as materialized (
    select person_id as party_id
    union
    select ownership.alias_id
      from platform_private.alias_party alias_row
      join platform_private.alias_ownership_period ownership
        on ownership.alias_id = alias_row.party_id
     where ownership.owner_person_id = person_id
       and ownership.starts_at <= now_at
       and ownership.ends_at is null
       and alias_row.lifecycle = 'active'
    union
    select tenure.organization_id
      from identity_private.membership_tenure tenure
      join identity_private.organization_party organization_row
        on organization_row.party_id = tenure.organization_id
     where tenure.person_id = person_id
       and tenure.state = 'confirmed'
       and tenure.accepted_at is not null
       and tenure.accepted_at <= now_at
       and tenure.revoked_at is null
       and tenure.starts_on <= current_date
       and (tenure.ends_on is null or tenure.ends_on > current_date)
       and organization_row.lifecycle = 'active'
  ),
  candidate_rows as materialized (
    select candidate.acting_party_id, candidate.context_kind,
           candidate.projection_version, candidate.display_label,
           candidate.sort_rank
      from candidate_party_ids candidate_ids
      cross join lateral platform_private.identity_context_candidate(
        person_id, candidate_ids.party_id, false
      ) candidate
  ),
  ordered_rows as materialized (
    select candidate_rows.*,
           pg_catalog.row_number() over (
             order by candidate_rows.sort_rank, candidate_rows.acting_party_id
           ) as row_number
      from candidate_rows
     where cursor_rank is null
        or (candidate_rows.sort_rank, candidate_rows.acting_party_id)
             > (cursor_rank, cursor_party_id)
  ),
  page_rows as materialized (
    select * from ordered_rows where row_number <= 50
  )
  select
    coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'contextId', page_rows.acting_party_id::text,
        'partyId', page_rows.acting_party_id::text,
        'kind', page_rows.context_kind,
        'label', page_rows.display_label,
        'avatarRef', null,
        'selectable', true,
        'authorityFreshUntil', platform_private.auth_iso_time(now_at + interval '12 hours')
      ) order by page_rows.sort_rank, page_rows.acting_party_id)
      from page_rows
    ), '[]'::jsonb),
    exists (select 1 from ordered_rows where row_number = 51),
    case when exists (select 1 from ordered_rows where row_number = 51) then (
      select pg_catalog.translate(
        pg_catalog.rtrim(pg_catalog.encode(pg_catalog.convert_to(
          page_rows.sort_rank::text || '|' || page_rows.acting_party_id::text,
          'UTF8'
        ), 'base64'), '='),
        '+/', '-_'
      )
        from page_rows
       order by page_rows.sort_rank desc, page_rows.acting_party_id desc
       limit 1
    ) else null end,
    coalesce((select pg_catalog.max(candidate_rows.projection_version)
                from candidate_rows), 1)
    into items, has_more, next_cursor, projection_version;

  return pg_catalog.jsonb_build_object(
    'projectionVersion', projection_version::text,
    'items', items,
    'nextCursor', next_cursor,
    'hasMore', has_more
  );
end;
$fn$;

create or replace function platform_api.identity_context_bind(
  p_context_id uuid,
  p_deliberate_confirmation boolean,
  p_client_binding_id text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  headers jsonb := '{}'::jsonb;
  header_text text;
  setting_value text;
  idempotency_key text;
  key_hash bytea;
  request_hash bytea;
  request_payload jsonb;
  request_id uuid;
  correlation_id uuid;
  uses_legacy_gucs boolean := false;
  idempotency platform_private.idempotency_records;
  candidate record;
  legacy_binding platform_private.acting_context_binding%rowtype;
  existing platform_private.acting_context_binding%rowtype;
  binding platform_private.acting_context_binding%rowtype;
  replay_binding platform_private.acting_context_binding%rowtype;
  now_at timestamptz := pg_catalog.clock_timestamp();
  operation text;
  operation_prefix constant text := 'identity.context.bind.';
  operation_limit constant integer := 128;
  resource_ref text;
  receipt jsonb;
begin
  if p_deliberate_confirmation is distinct from true then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_context_id is null
     or p_client_binding_id is null
     or pg_catalog.char_length(p_client_binding_id) not between 1 and 128
     or p_client_binding_id !~ '^[A-Za-z0-9._:-]+$'
     or p_client_binding_id = 'self' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  begin
    header_text := nullif(pg_catalog.current_setting('request.headers', true), '');
    if header_text is not null then
      headers := header_text::jsonb;
    end if;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  if pg_catalog.jsonb_typeof(headers) <> 'object' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if headers ? 'x-client-binding-id' then
    if pg_catalog.jsonb_typeof(headers->'x-client-binding-id') is distinct from 'string'
       or headers->>'x-client-binding-id' is distinct from p_client_binding_id then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
  end if;

  setting_value := nullif(pg_catalog.current_setting('app.idempotency_key_hash', true), '');
  uses_legacy_gucs := setting_value is not null;
  if uses_legacy_gucs then
    key_hash := platform_private.identity_hash_setting('app.idempotency_key_hash');
  else
    if not (headers ? 'idempotency-key')
       or pg_catalog.jsonb_typeof(headers->'idempotency-key') <> 'string' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    idempotency_key := headers->>'idempotency-key';
    if pg_catalog.char_length(idempotency_key) not between 8 and 128
       or idempotency_key !~ '^[ -~]+$'
       or pg_catalog.btrim(idempotency_key) <> idempotency_key then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    key_hash := extensions.digest(pg_catalog.convert_to(idempotency_key, 'UTF8'), 'sha256');
  end if;

  setting_value := nullif(pg_catalog.current_setting('app.request_hash', true), '');
  if setting_value is not null then
    request_hash := platform_private.identity_hash_setting('app.request_hash');
  else
    request_payload := pg_catalog.jsonb_build_object(
      'contextId', p_context_id::text,
      'deliberateConfirmation', p_deliberate_confirmation,
      'clientBindingId', p_client_binding_id
    );
    request_hash := extensions.digest(
      pg_catalog.convert_to(request_payload::text, 'UTF8'), 'sha256'
    );
  end if;

  setting_value := nullif(pg_catalog.current_setting('app.request_id', true), '');
  if setting_value is not null then
    if setting_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    request_id := setting_value::uuid;
  elsif headers ? 'x-request-id' then
    if pg_catalog.jsonb_typeof(headers->'x-request-id') <> 'string'
       or headers->>'x-request-id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    request_id := (headers->>'x-request-id')::uuid;
  else
    request_id := extensions.gen_random_uuid();
  end if;

  setting_value := nullif(pg_catalog.current_setting('app.correlation_id', true), '');
  if setting_value is not null then
    if setting_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    correlation_id := setting_value::uuid;
  elsif headers ? 'x-correlation-id' then
    if pg_catalog.jsonb_typeof(headers->'x-correlation-id') <> 'string'
       or headers->>'x-correlation-id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    correlation_id := (headers->>'x-correlation-id')::uuid;
  else
    correlation_id := request_id;
  end if;

  operation := case
    when pg_catalog.char_length(p_client_binding_id)
      <= operation_limit - pg_catalog.char_length(operation_prefix)
      then operation_prefix || p_client_binding_id
    else operation_prefix || pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(p_client_binding_id, 'UTF8'), 'sha256'),
      'hex'
    )
  end;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('identity-context-bind:' || person_id::text, 0)
  );

  -- Preserve direct GUC-based pgTAP callers: stale legacy selectors still
  -- fail before an old completed key is replayed. PostgREST requests use
  -- validated headers and replay their original receipt before authority
  -- revalidation; this never reactivates the referenced binding.
  if uses_legacy_gucs then
    select * into candidate
      from platform_private.identity_context_candidate(person_id, p_context_id, true);
    if not found then
      select * into legacy_binding
        from platform_private.acting_context_binding binding_row
       where binding_row.id = p_context_id
         and binding_row.person_id = person_id
       for update;
      if not found then
        raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
      end if;
      if legacy_binding.state = 'revoked' then
        raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
      end if;
      if legacy_binding.state = 'expired'
         or (legacy_binding.client_binding_id <> 'self'
           and (legacy_binding.expires_at <= now_at
             or legacy_binding.last_seen_at <= now_at - interval '12 hours')) then
        raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001';
      end if;
      select * into candidate
        from platform_private.identity_context_candidate(
          person_id, legacy_binding.acting_party_id, true
        );
      if not found then
        raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
      end if;
    end if;
  end if;

  idempotency := platform_private.identity_idempotency_reserve(
    auth_id, operation, key_hash, request_hash
  );
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    if pg_catalog.jsonb_typeof(idempotency.response_ref->'receipt') = 'object' then
      return idempotency.response_ref->'receipt';
    end if;
    resource_ref := idempotency.response_ref->>'resourceRef';
    if resource_ref is null
       or resource_ref !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
    end if;
    select * into replay_binding
      from platform_private.acting_context_binding binding_row
     where binding_row.id = resource_ref::uuid
       and binding_row.person_id = person_id;
    if not found then
      raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
    end if;
    return pg_catalog.jsonb_build_object(
      'bindingId', replay_binding.id::text,
      'selectedPartyId', replay_binding.acting_party_id::text,
      'expiresAt', platform_private.auth_iso_time(case
        when pg_catalog.isfinite(replay_binding.expires_at) then replay_binding.expires_at
        else '9999-12-31 23:59:59.999+00'::timestamptz end),
      'projectionVersion', replay_binding.projection_version::text,
      'version', replay_binding.version::text
    );
  end if;

  select * into existing
    from platform_private.acting_context_binding binding_row
   where binding_row.person_id = person_id
     and binding_row.client_binding_id = p_client_binding_id
     and binding_row.state = 'active'
   for update;

  if not uses_legacy_gucs then
    select * into candidate
      from platform_private.identity_context_candidate(person_id, p_context_id, true);
    if not found then
      select * into legacy_binding
        from platform_private.acting_context_binding binding_row
       where binding_row.id = p_context_id
         and binding_row.person_id = person_id
       for update;
      if not found then
        raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
      end if;
      if legacy_binding.state = 'revoked' then
        raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
      end if;
      if legacy_binding.state = 'expired'
         or (legacy_binding.client_binding_id <> 'self'
           and (legacy_binding.expires_at <= now_at
             or legacy_binding.last_seen_at <= now_at - interval '12 hours')) then
        raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001';
      end if;
      select * into candidate
        from platform_private.identity_context_candidate(
          person_id, legacy_binding.acting_party_id, true
        );
      if not found then
        raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
      end if;
    end if;
  end if;

  if found and existing.id is not null then
    if existing.acting_party_id = candidate.acting_party_id
       and existing.context_kind = candidate.context_kind
       and (existing.client_binding_id = 'self'
         or (existing.expires_at > now_at
           and existing.last_seen_at > now_at - interval '12 hours')) then
      update platform_private.acting_context_binding binding_row
         set last_seen_at = now_at, updated_at = now_at
       where binding_row.id = existing.id;
      receipt := pg_catalog.jsonb_build_object(
        'bindingId', existing.id::text,
        'selectedPartyId', existing.acting_party_id::text,
        'expiresAt', platform_private.auth_iso_time(case
          when pg_catalog.isfinite(existing.expires_at) then existing.expires_at
          else '9999-12-31 23:59:59.999+00'::timestamptz end),
        'projectionVersion', existing.projection_version::text,
        'version', existing.version::text
      );
      update platform_private.idempotency_records
         set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
           'status', 201, 'resourceRef', existing.id::text, 'receipt', receipt
         )
       where id = idempotency.id;
      return receipt;
    end if;

    update platform_private.acting_context_binding binding_row
       set state = case
             when existing.acting_party_id = candidate.acting_party_id
               and existing.context_kind = candidate.context_kind
               then 'expired'
             else 'revoked'
           end::platform_private.context_binding_state,
           version = binding_row.version + 1,
           updated_at = now_at
     where binding_row.id = existing.id
       and binding_row.state = 'active';
  end if;

  insert into platform_private.acting_context_binding(
    person_id, acting_party_id, context_kind, source_relationship_id,
    client_binding_id, state, selected_at, last_seen_at, expires_at,
    projection_version, version
  ) values (
    person_id, candidate.acting_party_id, candidate.context_kind,
    candidate.source_relationship_id, p_client_binding_id, 'active',
    now_at, now_at,
    case when candidate.context_kind = 'person'
      then '9999-12-31 23:59:59.999+00'::timestamptz
      else now_at + interval '12 hours' end,
    candidate.projection_version, 1
  ) returning * into binding;

  perform platform_private.identity_record_effects(
    'identity.context.bind', auth_id, person_id, 'context', person_id,
    'CONTEXT_BOUND', 'identity.context.bound.v1', 'context', person_id,
    binding.version,
    pg_catalog.jsonb_build_object(
      'bindingId', binding.id,
      'selectedPartyId', binding.acting_party_id,
      'version', binding.version
    ),
    correlation_id
  );
  insert into identity.security_events(
    action, actor_auth_user_id, safe_outcome, reason_code, request_id, correlation_id
  ) values (
    'identity.context.bind', auth_id, 'completed', 'CONTEXT_BOUND',
    request_id, correlation_id
  );
  receipt := pg_catalog.jsonb_build_object(
    'bindingId', binding.id::text,
    'selectedPartyId', binding.acting_party_id::text,
    'expiresAt', platform_private.auth_iso_time(binding.expires_at),
    'projectionVersion', binding.projection_version::text,
    'version', binding.version::text
  );
  update platform_private.idempotency_records
     set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
       'status', 201, 'resourceRef', binding.id::text, 'receipt', receipt
     )
   where id = idempotency.id;

  return receipt;
end;
$fn$;

create or replace function platform_api.auth_session_read(
  p_auth_user_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  session_row identity.auth_session_index%rowtype;
  auth_binding identity.auth_user_bindings%rowtype;
  context_binding platform_private.acting_context_binding%rowtype;
  candidate record;
  headers jsonb := '{}'::jsonb;
  header_text text;
  client_binding_id text;
  now_at timestamptz := pg_catalog.clock_timestamp();
  acting_party_id uuid;
begin
  select * into session_row
    from identity.auth_session_index session_index
   where session_index.session_id = p_session_id
     and session_index.auth_user_id = p_auth_user_id
     and session_index.state = 'active'
   for update;
  if not found then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  select * into auth_binding
    from identity.auth_user_bindings user_binding
   where user_binding.id = session_row.binding_id;
  acting_party_id := auth_binding.person_id;

  begin
    header_text := nullif(pg_catalog.current_setting('request.headers', true), '');
    if header_text is not null then
      headers := header_text::jsonb;
    end if;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  if pg_catalog.jsonb_typeof(headers) <> 'object' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  if headers ? 'x-client-binding-id' then
    if pg_catalog.jsonb_typeof(headers->'x-client-binding-id') <> 'string' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    client_binding_id := headers->>'x-client-binding-id';
    if client_binding_id is null
       or pg_catalog.char_length(client_binding_id) not between 1 and 128
       or client_binding_id !~ '^[A-Za-z0-9._:-]+$' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;

    if acting_party_id is null then
      raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
    end if;
    select * into context_binding
      from platform_private.acting_context_binding binding_row
     where binding_row.person_id = acting_party_id
       and binding_row.client_binding_id = client_binding_id
     order by (binding_row.state = 'active') desc,
              binding_row.created_at desc, binding_row.id desc
     limit 1
     for update;
    if found then
      if context_binding.state = 'revoked' then
        raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
      elsif context_binding.state = 'expired' then
        raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001';
      elsif context_binding.state <> 'active' then
        raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
      end if;

      if context_binding.client_binding_id <> 'self'
         and (context_binding.expires_at <= now_at
           or context_binding.last_seen_at <= now_at - interval '12 hours') then
        raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001';
      end if;
      select * into candidate
        from platform_private.identity_context_candidate(
          acting_party_id, context_binding.acting_party_id, true
        );
      if not found
         or candidate.context_kind <> context_binding.context_kind then
        raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
      end if;
      update platform_private.acting_context_binding binding_row
         set last_seen_at = now_at, updated_at = now_at
       where binding_row.id = context_binding.id
         and binding_row.state = 'active';
      acting_party_id := candidate.acting_party_id;
    elsif exists (
      select 1 from platform_private.acting_context_binding binding_row
       where binding_row.client_binding_id = client_binding_id
         and binding_row.person_id <> acting_party_id
    ) then
      raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
    end if;
    -- A globally unseen sessionStorage UUID is an unbound tab, not an
    -- authority selector. Keep the safe self context until deliberate POST.
  end if;

  update identity.auth_session_index session_index
     set last_seen_at = now_at
   where session_index.session_id = p_session_id;

  return pg_catalog.jsonb_build_object(
    'accountState', case when auth_binding.id is null then null else auth_binding.state::text end,
    'bootstrapState', case when auth_binding.id is null then 'required' else 'complete' end,
    'personId', auth_binding.person_id,
    'actingPartyId', acting_party_id
  );
end;
$fn$;

revoke all on function platform_api.identity_contexts_read(text),
  platform_api.identity_context_bind(uuid, boolean, text)
from public, anon, service_role;
grant execute on function platform_api.identity_contexts_read(text),
  platform_api.identity_context_bind(uuid, boolean, text)
to authenticated;

revoke all on function platform_api.auth_session_read(uuid, uuid)
from public, anon, authenticated;
grant execute on function platform_api.auth_session_read(uuid, uuid)
to service_role;
