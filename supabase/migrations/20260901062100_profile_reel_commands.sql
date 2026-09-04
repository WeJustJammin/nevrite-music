begin;
-- Reel create, update, and takedown command.  A verifier may advance a rights
-- observation version before activation; owner removal is a retained takedown,
-- never a physical delete.
create or replace function profile_private.profile_reel_mutate(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_action text;
  v_party_id uuid;
  v_actor_id uuid;
  v_acting_party_id uuid;
  v_item_id uuid;
  v_credit_id uuid;
  v_media_id uuid;
  v_rights_id uuid;
  v_credit_source_type text;
  v_media_source_type text;
  v_role_code text;
  v_rights_basis text;
  v_rights_source_type text;
  v_credit_version bigint;
  v_media_version bigint;
  v_rights_version bigint;
  v_display_order integer;
  v_state text;
  v_state_reason text;
  v_expected_version bigint;
  v_new_version bigint;
  v_correlation_id uuid;
  v_key_hash bytea;
  v_request_hash bytea;
  v_reservation platform_private.idempotency_records;
  v_item profiles.reel_items%rowtype;
  v_response jsonb;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['action','id','partyId','creditSourceType','creditId','creditVersion',
      'mediaSourceType','mediaId','mediaVersion','roleCode','rightsBasis',
      'rightsSourceType','rightsId','rightsVersion','displayOrder','state',
      'stateReason','expectedVersion','idempotencyKey']::text[]
  );
  v_action := coalesce(nullif(p_request->>'action', ''), 'create');
  if v_action not in ('create','patch','takedown') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  v_party_id := profile_private.profile_require_uuid(p_request->>'partyId', 'partyId');
  v_actor_id := profile_private.profile_actor();
  v_acting_party_id := profile_private.profile_acting_party(v_actor_id);
  if v_acting_party_id is distinct from v_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  v_expected_version := profile_private.profile_expected_version(p_request);
  v_key_hash := profile_private.profile_key_hash(p_request);
  v_request_hash := profile_private.profile_request_hash('profile.reel.' || v_action, p_request);
  v_reservation := platform_private.identity_idempotency_reserve(
    v_actor_id, 'profile.reel.' || v_action, v_key_hash, v_request_hash);
  if v_reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(v_reservation.response_ref->'responseBody', v_reservation.response_ref);
  end if;
  v_correlation_id := profile_private.profile_correlation_id();
  if not platform_private.external_effects_allowed() then
    raise exception 'RECOVERY_FENCE_ACTIVE' using errcode = 'P0001';
  end if;

  if v_action = 'create' then
    v_item_id := case when p_request ? 'id'
      then profile_private.profile_require_uuid(p_request->>'id', 'id')
      else extensions.gen_random_uuid() end;
    v_credit_source_type := coalesce(p_request->>'creditSourceType', 'credit');
    v_media_source_type := coalesce(p_request->>'mediaSourceType', 'media');
    v_credit_id := profile_private.profile_require_uuid(p_request->>'creditId', 'creditId');
    v_media_id := profile_private.profile_require_uuid(p_request->>'mediaId', 'mediaId');
    v_rights_id := profile_private.profile_require_uuid(p_request->>'rightsId', 'rightsId');
    v_credit_version := profile_private.profile_require_version(p_request->>'creditVersion', 'creditVersion');
    v_media_version := profile_private.profile_require_version(p_request->>'mediaVersion', 'mediaVersion');
    v_rights_version := profile_private.profile_require_version(p_request->>'rightsVersion', 'rightsVersion');
    v_role_code := p_request->>'roleCode';
    v_rights_basis := p_request->>'rightsBasis';
    v_rights_source_type := p_request->>'rightsSourceType';
    v_display_order := coalesce(nullif(p_request->>'displayOrder', '')::integer, 0);
    v_state := coalesce(nullif(p_request->>'state', ''), 'verifying_rights');
    v_state_reason := p_request->>'stateReason';
    if v_expected_version <> 1
       or v_credit_source_type <> 'credit' or v_media_source_type <> 'media'
       or v_role_code is null or v_role_code !~ '^[a-z][a-z0-9_.-]{0,63}$'
       or v_rights_basis not in ('ownership','licence','provider_publication')
       or v_rights_source_type not in ('media','consent')
       or v_display_order not between 0 and 999
       or v_state not in ('draft','verifying_rights','rejected','takedown') then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    insert into profiles.reel_items(
      id, party_id, credit_source_type, credit_id, credit_version,
      media_source_type, media_id, media_version, role_code, rights_basis,
      rights_source_type, rights_id, rights_version, display_order, state,
      state_reason, actor_person_id, acting_party_id, version
    ) values (
      v_item_id, v_party_id, v_credit_source_type, v_credit_id, v_credit_version,
      v_media_source_type, v_media_id, v_media_version, v_role_code, v_rights_basis,
      v_rights_source_type, v_rights_id, v_rights_version, v_display_order, v_state,
      v_state_reason, v_actor_id, v_acting_party_id, 1
    ) returning * into v_item;
    v_new_version := 1;
  else
    v_item_id := profile_private.profile_require_uuid(p_request->>'id', 'id');
    select r.* into v_item from profiles.reel_items r where r.id = v_item_id for update;
    if not found or v_item.party_id is distinct from v_party_id
       or v_item.version <> v_expected_version then
      raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
    end if;
    v_credit_source_type := coalesce(p_request->>'creditSourceType', v_item.credit_source_type);
    v_media_source_type := coalesce(p_request->>'mediaSourceType', v_item.media_source_type);
    v_credit_id := coalesce(nullif(p_request->>'creditId', '')::uuid, v_item.credit_id);
    v_media_id := coalesce(nullif(p_request->>'mediaId', '')::uuid, v_item.media_id);
    v_rights_id := coalesce(nullif(p_request->>'rightsId', '')::uuid, v_item.rights_id);
    v_credit_version := coalesce(nullif(p_request->>'creditVersion', '')::bigint, v_item.credit_version);
    v_media_version := coalesce(nullif(p_request->>'mediaVersion', '')::bigint, v_item.media_version);
    v_rights_version := coalesce(nullif(p_request->>'rightsVersion', '')::bigint, v_item.rights_version);
    v_role_code := coalesce(nullif(p_request->>'roleCode', ''), v_item.role_code);
    v_rights_basis := coalesce(nullif(p_request->>'rightsBasis', ''), v_item.rights_basis);
    v_rights_source_type := coalesce(nullif(p_request->>'rightsSourceType', ''), v_item.rights_source_type);
    v_display_order := coalesce(nullif(p_request->>'displayOrder', '')::integer, v_item.display_order);
    v_state := case when v_action = 'takedown' then 'takedown'
      else coalesce(nullif(p_request->>'state', ''), v_item.state) end;
    v_state_reason := case when v_action = 'takedown' then coalesce(nullif(p_request->>'stateReason', ''), 'OWNER_TAKEDOWN')
      else coalesce(p_request->>'stateReason', v_item.state_reason) end;
    if v_credit_source_type <> 'credit' or v_media_source_type <> 'media'
       or v_role_code !~ '^[a-z][a-z0-9_.-]{0,63}$'
       or v_rights_basis not in ('ownership','licence','provider_publication')
       or v_rights_source_type not in ('media','consent')
       or v_credit_version < 1 or v_media_version < 1 or v_rights_version < 1
       or v_display_order not between 0 and 999 then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    v_new_version := v_item.version + 1;
    if v_item.version = 9223372036854775807 then
      raise exception 'VERSION_EXHAUSTED' using errcode = 'P0001';
    end if;
    perform pg_catalog.set_config('app.reel_writer', 'true', true);
    update profiles.reel_items
       set credit_source_type = v_credit_source_type,
           credit_id = v_credit_id,
           credit_version = v_credit_version,
           media_source_type = v_media_source_type,
           media_id = v_media_id,
           media_version = v_media_version,
           role_code = v_role_code,
           rights_basis = v_rights_basis,
           rights_source_type = v_rights_source_type,
           rights_id = v_rights_id,
           rights_version = v_rights_version,
           display_order = v_display_order,
           state = v_state,
           state_reason = v_state_reason,
           actor_person_id = v_actor_id,
           acting_party_id = v_acting_party_id,
           version = v_new_version,
           updated_at = pg_catalog.clock_timestamp()
     where id = v_item_id;
    if not found then
      raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
    end if;
    perform pg_catalog.set_config('app.reel_writer', 'false', true);
  end if;

  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'profile.reel.' || v_action, v_actor_id, v_acting_party_id,
    'reel_item', v_item_id,
    'allowed'::platform_private.audit_decision,
    case when v_state = 'takedown' then 'PROFILE_REEL_TAKEDOWN'
         when v_action = 'create' then 'PROFILE_REEL_CREATED'
         else 'PROFILE_REEL_COMMITTED' end,
    v_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload
  ) values (
    'profile.projection.invalidated.v1', 1, 'profile', v_party_id,
    v_new_version, v_correlation_id,
    pg_catalog.jsonb_build_object(
      'partyId', v_party_id, 'sourceType', 'reel',
      'sourceId', v_item_id, 'sourceVersion', v_new_version,
      'reason', 'reel_changed')
  );
  v_response := pg_catalog.jsonb_build_object(
    'status', 200, 'partyId', v_party_id, 'reelItemId', v_item_id,
    'state', v_state, 'version', v_new_version);
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', 200, 'resourceRef', v_response->>'reelItemId',
           'responseBody', v_response)
   where id = v_reservation.id;
  return v_response;
end;
$body$;

-- Private implementations are callable only by the definer-owned wrappers.
revoke all on function profile_private.profile_reel_mutate(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function profile_private.profile_apply_observation(jsonb)
  from public, anon, authenticated, service_role;
commit;
