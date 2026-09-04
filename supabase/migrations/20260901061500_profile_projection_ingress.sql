begin;

-- Apply one bounded, version-addressed observation.  The inbox is written
-- before the derived projection, so retries have a durable deduplication point.
-- Equal and stale source versions acknowledge without overwriting or emitting
-- a second invalidation; only a newer projection wins.
create or replace function profile_private.profile_apply_observation(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  fact jsonb;
  payload jsonb;
  role_values jsonb;
  role_codes text[] := '{}'::text[];
  message_id uuid;
  party_id uuid;
  source_id uuid;
  source_type text;
  producer text;
  source_version bigint;
  evidence_count integer;
  payload_schema_version integer;
  observed_at timestamptz;
  occurred_on date;
  payload_hash bytea;
  calculated_hash bytea;
  supplied_hash text;
  trusted_producer text;
  actor_id uuid;
  acting_party_id uuid;
  correlation_id uuid;
  key_hash bytea;
  request_hash bytea;
  reservation platform_private.idempotency_records;
  inbox_row profiles.profile_projection_inbox%rowtype;
  current_projection profiles.profile_fact_projections%rowtype;
  response jsonb;
  inserted boolean := false;
  has_projection boolean := false;
  role_value text;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['messageId','producer','partyId','fact','sourceType','sourceId',
      'provenanceState','evidenceClass','evidenceCount','visibility',
      'listingState','disputeState','partyLifecycle','occurredOn','roleCodes',
      'payload','payloadSchemaVersion','observedAt','sourceVersion',
      'payloadHash','requestId','idempotencyKey']::text[]
  );
  if p_request ? 'fact' and pg_catalog.jsonb_typeof(p_request->'fact') <> 'object' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  fact := case when pg_catalog.jsonb_typeof(p_request->'fact') = 'object'
    then p_request->'fact' else '{}'::jsonb end;
  message_id := profile_private.profile_require_uuid(p_request->>'messageId', 'messageId');
  party_id := profile_private.profile_require_uuid(p_request->>'partyId', 'partyId');
  source_type := coalesce(nullif(p_request->>'sourceType', ''), fact->>'sourceType');
  source_id := profile_private.profile_require_uuid(
    coalesce(nullif(p_request->>'sourceId', ''), fact->>'sourceId'), 'sourceId');
  producer := p_request->>'producer';
  if producer not in ('shard01','shard04','shard07','shard17','shard20') then
    raise exception 'UNREGISTERED_PRODUCER' using errcode = 'P0001';
  end if;
  trusted_producer := nullif(pg_catalog.current_setting('app.profile_producer', true), '');
  if trusted_producer is null or trusted_producer <> producer then
    raise exception 'UNTRUSTED_PRODUCER' using errcode = 'P0001';
  end if;
  if source_type is null or source_type !~ '^[a-z][a-z0-9_.-]{1,63}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  source_version := profile_private.profile_require_version(
    coalesce(nullif(p_request->>'sourceVersion', ''), fact->>'sourceVersion'),
    'sourceVersion');
  evidence_count := coalesce(nullif(p_request->>'evidenceCount', '')::integer,
                             nullif(fact->>'evidenceCount', '')::integer);
  if evidence_count is null or evidence_count < 0 or evidence_count > 10000 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  payload_schema_version := coalesce(
    nullif(p_request->>'payloadSchemaVersion', '')::integer,
    nullif(fact->>'payloadSchemaVersion', '')::integer, 1);
  if payload_schema_version < 1 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  payload := coalesce(p_request->'payload', fact->'payload');
  if payload is null or pg_catalog.jsonb_typeof(payload) <> 'object' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  calculated_hash := extensions.digest(
    pg_catalog.convert_to(payload::text, 'utf8'), 'sha256');
  supplied_hash := nullif(p_request->>'payloadHash', '');
  if supplied_hash is not null then
    if supplied_hash !~ '^[0-9a-f]{64}$'
       or decode(supplied_hash, 'hex') <> calculated_hash then
      raise exception 'PAYLOAD_HASH_MISMATCH' using errcode = 'P0001';
    end if;
  end if;
  payload_hash := calculated_hash;
  role_values := coalesce(p_request->'roleCodes', fact->'roleCodes', '[]'::jsonb);
  if pg_catalog.jsonb_typeof(role_values) <> 'array'
     or pg_catalog.jsonb_array_length(role_values) > 32 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  for role_value in select jsonb_array_elements_text(role_values) loop
    if role_value !~ '^[a-z][a-z0-9_.-]{0,31}$' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    role_codes := array_append(role_codes, role_value);
  end loop;
  begin
    occurred_on := nullif(coalesce(p_request->>'occurredOn', fact->>'occurredOn'), '')::date;
    observed_at := coalesce(
      nullif(coalesce(p_request->>'observedAt', fact->>'observedAt'), '')::timestamptz,
      pg_catalog.clock_timestamp());
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  actor_id := nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid;
  if actor_id is null then actor_id := party_id; end if;
  acting_party_id := nullif(pg_catalog.current_setting('app.acting_party_id', true), '')::uuid;
  if acting_party_id is null then acting_party_id := party_id; end if;
  correlation_id := profile_private.profile_correlation_id();
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash(
    'profile.observation.apply', p_request);
  reservation := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.observation.apply', key_hash, request_hash);
  if reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(reservation.response_ref->'responseBody', reservation.response_ref);
  end if;
  if not platform_private.external_effects_allowed() then
    raise exception 'RECOVERY_FENCE_ACTIVE' using errcode = 'P0001';
  end if;

  insert into profiles.profile_projection_inbox(
    message_id, producer, source_type, source_id, source_version,
    payload, payload_hash, received_at
  ) values (
    message_id, producer, source_type, source_id, source_version,
    payload, payload_hash, pg_catalog.clock_timestamp()
  ) on conflict do nothing returning * into inbox_row;
  inserted := found;
  if not inserted then
    select i.* into inbox_row
      from profiles.profile_projection_inbox i
     where i.message_id = message_id
     for update;
    if not found then
      select i.* into inbox_row
        from profiles.profile_projection_inbox i
       where i.producer = producer
         and i.source_type = source_type
         and i.source_id = source_id
         and i.source_version = source_version
       for update;
    end if;
    if not found or inbox_row.payload_hash <> payload_hash then
      raise exception 'IDEMPOTENCY_MISMATCH' using errcode = 'P0001';
    end if;
    response := pg_catalog.jsonb_build_object(
      'status', 202, 'accepted', true, 'dedupeState', 'duplicate',
      'messageId', inbox_row.message_id, 'sourceVersion', source_version);
    update platform_private.idempotency_records
       set state = 'completed'::platform_private.idempotency_state,
           response_ref = pg_catalog.jsonb_build_object(
             'status', 202, 'resourceRef', response->>'messageId',
             'responseBody', response)
     where id = reservation.id;
    return response;
  end if;

  select p.* into current_projection
    from profiles.profile_fact_projections p
   where p.party_id = party_id
     and p.source_type = source_type
     and p.source_id = source_id
   for update;
  has_projection := found;
  if has_projection and current_projection.source_version >= source_version then
    update profiles.profile_projection_inbox
       set processed_at = pg_catalog.clock_timestamp(), failure_code = null
     where message_id = inbox_row.message_id;
    response := pg_catalog.jsonb_build_object(
      'status', 202, 'accepted', true, 'dedupeState', 'stale',
      'messageId', message_id, 'projectionVersion', current_projection.source_version,
      'sourceVersion', source_version);
    update platform_private.idempotency_records
       set state = 'completed'::platform_private.idempotency_state,
           response_ref = pg_catalog.jsonb_build_object(
             'status', 202, 'resourceRef', response->>'messageId',
             'responseBody', response)
     where id = reservation.id;
    return response;
  end if;

  perform pg_catalog.set_config('app.profile_projection_writer', 'true', true);
  if has_projection then
    update profiles.profile_fact_projections
       set source_version = source_version,
           producer = producer,
           provenance_state = coalesce(p_request->>'provenanceState', fact->>'provenanceState'),
           evidence_class = coalesce(p_request->>'evidenceClass', fact->>'evidenceClass'),
           evidence_count = evidence_count,
           visibility = coalesce(p_request->>'visibility', fact->>'visibility'),
           embargo_until = nullif(coalesce(p_request->>'embargoUntil', fact->>'embargoUntil'), '')::timestamptz,
           listing_state = coalesce(p_request->>'listingState', fact->>'listingState'),
           dispute_state = coalesce(p_request->>'disputeState', fact->>'disputeState'),
           party_lifecycle = coalesce(p_request->>'partyLifecycle', fact->>'partyLifecycle'),
           occurred_on = occurred_on,
           role_codes = role_codes,
           projection_payload = payload,
           payload_schema_version = payload_schema_version,
           observed_at = observed_at,
           applied_at = pg_catalog.clock_timestamp()
     where party_id = current_projection.party_id
       and source_type = current_projection.source_type
       and source_id = current_projection.source_id;
  else
    insert into profiles.profile_fact_projections(
      party_id, source_type, source_id, source_version, producer,
      provenance_state, evidence_class, evidence_count, visibility,
      embargo_until, listing_state, dispute_state, party_lifecycle,
      occurred_on, role_codes, projection_payload, payload_schema_version,
      observed_at, applied_at
    ) values (
      party_id, source_type, source_id, source_version, producer,
      coalesce(p_request->>'provenanceState', fact->>'provenanceState'),
      coalesce(p_request->>'evidenceClass', fact->>'evidenceClass'), evidence_count,
      coalesce(p_request->>'visibility', fact->>'visibility'),
      nullif(coalesce(p_request->>'embargoUntil', fact->>'embargoUntil'), '')::timestamptz,
      coalesce(p_request->>'listingState', fact->>'listingState'),
      coalesce(p_request->>'disputeState', fact->>'disputeState'),
      coalesce(p_request->>'partyLifecycle', fact->>'partyLifecycle'),
      occurred_on, role_codes, payload, payload_schema_version,
      observed_at, pg_catalog.clock_timestamp()
    );
  end if;
  perform pg_catalog.set_config('app.profile_projection_writer', 'false', true);
  update profiles.profile_projection_inbox
     set processed_at = pg_catalog.clock_timestamp(), failure_code = null
   where message_id = inbox_row.message_id;
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'profile.observation.apply', actor_id, acting_party_id, 'profile_fact_projection',
    source_id, 'allowed'::platform_private.audit_decision,
    'PROFILE_PROJECTION_APPLIED', correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload
  ) values (
    'profile.projection.invalidated.v1', 1, 'profile', party_id,
    source_version, correlation_id,
    pg_catalog.jsonb_build_object(
      'partyId', party_id, 'sourceType', source_type, 'sourceId', source_id,
      'sourceVersion', source_version, 'reason', 'source_changed')
  );
  response := pg_catalog.jsonb_build_object(
    'status', 202, 'accepted', true, 'dedupeState', 'applied',
    'messageId', message_id, 'projectionVersion', source_version,
    'sourceVersion', source_version);
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', 202, 'resourceRef', response->>'messageId',
           'responseBody', response)
   where id = reservation.id;
  return response;
end;
$body$;

commit;
