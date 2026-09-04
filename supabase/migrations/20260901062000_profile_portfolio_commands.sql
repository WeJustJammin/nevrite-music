begin;

-- Section content command.  The head lock, immutable revision insert, optional
-- lifecycle archive, idempotency reservation, audit row, and invalidation event
-- all commit as one transaction.
create or replace function profile_private.profile_section_mutate(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_party_id uuid;
  v_actor_id uuid;
  v_acting_party_id uuid;
  v_section_code text;
  v_state text;
  v_blocks jsonb;
  v_client_reason text;
  v_expected_version bigint;
  v_new_version bigint;
  v_revision_id uuid := extensions.gen_random_uuid();
  v_correlation_id uuid;
  v_key_hash bytea;
  v_request_hash bytea;
  v_reservation platform_private.idempotency_records;
  v_head profiles.profile_section_heads%rowtype;
  v_response jsonb;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['partyId','sectionCode','blocks','state','clientReason',
      'expectedVersion','idempotencyKey']::text[]
  );
  v_party_id := profile_private.profile_require_uuid(p_request->>'partyId', 'partyId');
  v_section_code := p_request->>'sectionCode';
  v_blocks := p_request->'blocks';
  v_state := coalesce(nullif(p_request->>'state', ''), 'draft');
  v_client_reason := p_request->>'clientReason';
  if v_section_code not in ('now','biography','services','availability')
     or v_blocks is null or pg_catalog.jsonb_typeof(v_blocks) <> 'array'
     or pg_catalog.jsonb_array_length(v_blocks) > 128
     or v_state not in ('draft','active')
     or v_client_reason is null or pg_catalog.length(pg_catalog.btrim(v_client_reason)) not between 1 and 240 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  v_actor_id := profile_private.profile_actor();
  v_acting_party_id := profile_private.profile_acting_party(v_actor_id);
  if v_acting_party_id is distinct from v_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  v_expected_version := profile_private.profile_expected_version(p_request);
  v_key_hash := profile_private.profile_key_hash(p_request);
  v_request_hash := profile_private.profile_request_hash('profile.section.put', p_request);
  v_reservation := platform_private.identity_idempotency_reserve(
    v_actor_id, 'profile.section.put', v_key_hash, v_request_hash);
  if v_reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(v_reservation.response_ref->'responseBody', v_reservation.response_ref);
  end if;
  v_correlation_id := profile_private.profile_correlation_id();
  if not platform_private.external_effects_allowed() then
    raise exception 'RECOVERY_FENCE_ACTIVE' using errcode = 'P0001';
  end if;

  select h.* into v_head
    from profiles.profile_section_heads h
   where h.party_id = v_party_id and h.section_code = v_section_code
   for update;
  if not found then
    if v_expected_version <> 1 then
      raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
    end if;
    insert into profiles.profile_section_heads(
      party_id, section_code, active_revision_id, latest_revision_id, version
    ) values (v_party_id, v_section_code, null, null, 1)
    on conflict (party_id, section_code) do nothing;
    select h.* into v_head
      from profiles.profile_section_heads h
     where h.party_id = v_party_id and h.section_code = v_section_code
     for update;
  end if;
  if v_head.version <> v_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  if v_head.version = 9223372036854775807 then
    raise exception 'VERSION_EXHAUSTED' using errcode = 'P0001';
  end if;
  v_new_version := v_head.version + 1;
  perform pg_catalog.set_config('app.profile_revision_writer', 'true', true);
  if v_state = 'active' and v_head.active_revision_id is not null then
    update profiles.profile_section_revisions
       set state = 'archived', archived_at = pg_catalog.clock_timestamp()
     where id = v_head.active_revision_id;
    if not found then
      raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
    end if;
  end if;
  insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at, activated_at, archived_at
  ) values (
    v_revision_id, v_party_id, v_section_code, v_blocks, v_actor_id,
    v_acting_party_id, v_state, v_new_version, v_client_reason,
    pg_catalog.clock_timestamp(),
    case when v_state = 'active' then pg_catalog.clock_timestamp() end,
    null
  );
  perform pg_catalog.set_config('app.profile_head_writer', 'true', true);
  update profiles.profile_section_heads
     set active_revision_id = case when v_state = 'active'
                              then v_revision_id else active_revision_id end,
         latest_revision_id = v_revision_id,
         version = v_new_version,
         updated_at = pg_catalog.clock_timestamp()
   where party_id = v_party_id and section_code = v_section_code;
  if not found then
    raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
  end if;
  perform pg_catalog.set_config('app.profile_revision_writer', 'false', true);
  perform pg_catalog.set_config('app.profile_head_writer', 'false', true);

  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'profile.section.put', v_actor_id, v_acting_party_id,
    'profile_section_revision', v_revision_id,
    'allowed'::platform_private.audit_decision,
    'PROFILE_SECTION_COMMITTED', v_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload
  ) values (
    'profile.projection.invalidated.v1', 1, 'profile', v_party_id,
    v_new_version, v_correlation_id,
    pg_catalog.jsonb_build_object(
      'partyId', v_party_id, 'sourceType', 'section',
      'sourceId', v_revision_id, 'sourceVersion', v_new_version,
      'reason', 'section_changed')
  );
  v_response := pg_catalog.jsonb_build_object(
    'status', 200, 'partyId', v_party_id, 'sectionCode', v_section_code,
    'revisionId', v_revision_id, 'state', v_state, 'version', v_new_version);
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', 200, 'resourceRef', v_response->>'revisionId',
           'responseBody', v_response)
   where id = v_reservation.id;
  return v_response;
end;
$body$;

-- Cosmetic portfolio emphasis command.  It initializes a row at version one,
-- then requires a positive expected version for every write and advances it by
-- exactly one under the row lock.
create or replace function profile_private.profile_emphasis_mutate(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  v_party_id uuid;
  v_actor_id uuid;
  v_acting_party_id uuid;
  v_surface text;
  v_default_filter jsonb;
  v_ordered_refs jsonb;
  v_expected_version bigint;
  v_new_version bigint;
  v_correlation_id uuid;
  v_key_hash bytea;
  v_request_hash bytea;
  v_reservation platform_private.idempotency_records;
  v_emphasis profiles.profile_emphases%rowtype;
  v_response jsonb;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['partyId','surface','defaultFilter','orderedRefs','expectedVersion',
      'idempotencyKey']::text[]
  );
  v_party_id := profile_private.profile_require_uuid(p_request->>'partyId', 'partyId');
  v_surface := coalesce(nullif(p_request->>'surface', ''), 'public');
  v_default_filter := coalesce(p_request->'defaultFilter', '{}'::jsonb);
  v_ordered_refs := coalesce(p_request->'orderedRefs', '[]'::jsonb);
  if v_surface <> 'public'
     or pg_catalog.jsonb_typeof(v_default_filter) <> 'object'
     or pg_catalog.jsonb_typeof(v_ordered_refs) <> 'array'
     or pg_catalog.jsonb_array_length(v_ordered_refs) > 128 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  v_actor_id := profile_private.profile_actor();
  v_acting_party_id := profile_private.profile_acting_party(v_actor_id);
  if v_acting_party_id is distinct from v_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  v_expected_version := profile_private.profile_expected_version(p_request);
  v_key_hash := profile_private.profile_key_hash(p_request);
  v_request_hash := profile_private.profile_request_hash('profile.emphasis.put', p_request);
  v_reservation := platform_private.identity_idempotency_reserve(
    v_actor_id, 'profile.emphasis.put', v_key_hash, v_request_hash);
  if v_reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(v_reservation.response_ref->'responseBody', v_reservation.response_ref);
  end if;
  v_correlation_id := profile_private.profile_correlation_id();
  if not platform_private.external_effects_allowed() then
    raise exception 'RECOVERY_FENCE_ACTIVE' using errcode = 'P0001';
  end if;
  insert into profiles.profile_emphases(
    party_id, surface, default_filter, ordered_refs,
    actor_person_id, acting_party_id, version
  ) values (
    v_party_id, v_surface, '{}'::jsonb, '[]'::jsonb,
    v_actor_id, v_acting_party_id, 1
  ) on conflict (party_id, surface) do nothing;
  select e.* into v_emphasis
    from profiles.profile_emphases e
   where e.party_id = v_party_id and e.surface = v_surface
   for update;
  if not found or v_emphasis.version <> v_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  if v_emphasis.version = 9223372036854775807 then
    raise exception 'VERSION_EXHAUSTED' using errcode = 'P0001';
  end if;
  v_new_version := v_emphasis.version + 1;
  perform pg_catalog.set_config('app.profile_emphasis_writer', 'true', true);
  update profiles.profile_emphases
     set default_filter = v_default_filter,
         ordered_refs = v_ordered_refs,
         actor_person_id = v_actor_id,
         acting_party_id = v_acting_party_id,
         version = v_new_version,
         updated_at = pg_catalog.clock_timestamp()
   where party_id = v_party_id and surface = v_surface;
  if not found then
    raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
  end if;
  perform pg_catalog.set_config('app.profile_emphasis_writer', 'false', true);
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'profile.emphasis.put', v_actor_id, v_acting_party_id,
    'profile_emphasis', v_party_id,
    'allowed'::platform_private.audit_decision,
    'PROFILE_EMPHASIS_COMMITTED', v_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload
  ) values (
    'profile.projection.invalidated.v1', 1, 'profile', v_party_id,
    v_new_version, v_correlation_id,
    pg_catalog.jsonb_build_object(
      'partyId', v_party_id, 'sourceType', 'emphasis',
      'sourceId', v_party_id, 'sourceVersion', v_new_version,
      'reason', 'emphasis_changed')
  );
  v_response := pg_catalog.jsonb_build_object(
    'status', 200, 'partyId', v_party_id, 'surface', v_surface,
    'version', v_new_version);
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', 200, 'resourceRef', v_response->>'partyId',
           'responseBody', v_response)
   where id = v_reservation.id;
  return v_response;
end;
$body$;

-- Private implementations are callable only by the definer-owned wrappers.
revoke all on function profile_private.profile_section_mutate(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function profile_private.profile_emphasis_mutate(jsonb)
  from public, anon, authenticated, service_role;
commit;
