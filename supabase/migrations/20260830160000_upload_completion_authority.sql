begin;

-- The provider observation is safe, bounded metadata.  Storage bytes and signed
-- URLs remain outside PostgreSQL; the observation is evidence used by the
-- completion and verification state machines.
alter table platform_private.object_records
  add column observed_byte_size bigint,
  add column observed_media_type text,
  add column observed_checksum bytea;

alter table platform_private.object_records
  add constraint object_records_observed_metadata_check check (
    (observed_byte_size is null and observed_media_type is null and observed_checksum is null)
    or (
      observed_byte_size >= 0
      and observed_media_type = pg_catalog.lower(pg_catalog.btrim(observed_media_type))
      and observed_media_type ~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$'
      and pg_catalog.octet_length(observed_checksum) = 32
    )
  );

comment on column platform_private.object_records.observed_byte_size is
  'Provider-observed byte count captured at completion; never a client declaration.';
comment on column platform_private.object_records.observed_media_type is
  'Provider-observed normalized media type captured at completion.';
comment on column platform_private.object_records.observed_checksum is
  'Provider-observed SHA-256 bytes captured at completion; never a signed URL or payload.';

create index object_records_observed_checksum_idx
  on platform_private.object_records (observed_checksum)
  where state in ('uploaded', 'verifying', 'ready');

-- Runtime registry migration seeds the legacy short name used by generic job
-- tests.  The locked upload contract uses the fully qualified consumer name.
insert into platform_private.job_type_registry (job_type)
values ('platform.object.verify')
on conflict (job_type) do nothing;

-- S04 owns creation immutability.  S05 adds one narrowly permitted mutation:
-- an issued pending object may atomically capture the first provider
-- observation while moving to uploaded.  Declared metadata and observations
-- cannot be rewritten after that boundary.
create or replace function platform_private.guard_object_records() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'object records are append-only at the row boundary' using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.bucket is distinct from old.bucket
     or new.object_key is distinct from old.object_key
     or new.owner_party_id is distinct from old.owner_party_id
     or new.purpose is distinct from old.purpose
     or new.media_type is distinct from old.media_type
     or new.byte_size is distinct from old.byte_size
     or new.checksum is distinct from old.checksum
     or new.retention_class is distinct from old.retention_class
     or new.created_at is distinct from old.created_at then
    raise exception 'object identity and declared metadata are immutable' using errcode = 'P0001';
  end if;
  if new.observed_byte_size is distinct from old.observed_byte_size
     or new.observed_media_type is distinct from old.observed_media_type
     or new.observed_checksum is distinct from old.observed_checksum then
    if old.state <> 'pending_upload'::platform_private.object_state
       or new.state <> 'uploaded'::platform_private.object_state
       or old.observed_byte_size is not null
       or old.observed_media_type is not null
       or old.observed_checksum is not null then
      raise exception 'provider-observed object metadata is immutable' using errcode = 'P0001';
    end if;
  end if;
  if new.version < old.version then
    raise exception 'object version cannot decrease' using errcode = 'P0001';
  end if;
  if old.state in ('ready'::platform_private.object_state, 'rejected'::platform_private.object_state, 'quarantined'::platform_private.object_state)
     and new.state is distinct from old.state then
    raise exception 'terminal object state is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'pending_upload'::platform_private.object_state
       and new.state not in ('pending_upload'::platform_private.object_state, 'uploaded'::platform_private.object_state, 'rejected'::platform_private.object_state, 'quarantined'::platform_private.object_state)
     or old.state = 'uploaded'::platform_private.object_state
       and new.state not in ('uploaded'::platform_private.object_state, 'verifying'::platform_private.object_state, 'rejected'::platform_private.object_state, 'quarantined'::platform_private.object_state)
     or old.state = 'verifying'::platform_private.object_state
       and new.state not in ('verifying'::platform_private.object_state, 'ready'::platform_private.object_state, 'rejected'::platform_private.object_state, 'quarantined'::platform_private.object_state)
     or old.state in ('ready'::platform_private.object_state, 'rejected'::platform_private.object_state, 'quarantined'::platform_private.object_state)
       and new.state is distinct from old.state then
    raise exception 'invalid object state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function platform_private.complete_upload_intent(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_upload_intent_id uuid,
  p_expected_version bigint,
  p_observed_byte_size bigint,
  p_observed_media_type text,
  p_observed_checksum bytea,
  p_storage_adapter text,
  p_idempotency_key_hash bytea,
  p_request_hash bytea,
  p_correlation_id uuid,
  p_job_id uuid default extensions.gen_random_uuid(),
  p_event_id uuid default extensions.gen_random_uuid()
)
returns table (
  job_id uuid,
  event_id uuid,
  object_id uuid,
  object_version bigint,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  normalized_media_type text := pg_catalog.lower(pg_catalog.btrim(p_observed_media_type));
  intent_row platform_private.upload_intents;
  object_row platform_private.object_records;
  idempotency_row platform_private.idempotency_records;
  existing_event_id uuid;
begin
  if not platform_private.external_effects_allowed() then
    raise exception 'restore reconciliation fence is active' using errcode = 'P0001';
  end if;
  if p_actor_id is null
     or p_acting_party_id is null
     or p_upload_intent_id is null
     or p_expected_version is null
     or p_expected_version < 1
     or p_observed_byte_size is null
     or p_observed_byte_size < 1
     or p_observed_media_type is null
     or p_observed_media_type <> normalized_media_type
     or normalized_media_type !~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$'
     or p_observed_checksum is null
     or pg_catalog.octet_length(p_observed_checksum) <> 32
     or p_storage_adapter is null
     or p_storage_adapter <> pg_catalog.lower(pg_catalog.btrim(p_storage_adapter))
     or p_storage_adapter not in ('fake', 'local')
     or p_idempotency_key_hash is null
     or pg_catalog.octet_length(p_idempotency_key_hash) <> 32
     or p_request_hash is null
     or pg_catalog.octet_length(p_request_hash) <> 32
     or p_correlation_id is null
     or p_job_id is null
     or p_event_id is null then
    raise exception 'invalid upload completion request' using errcode = '22023';
  end if;

  select * into intent_row
  from platform_private.upload_intents
  where id = p_upload_intent_id
  for update;
  if not found then
    raise exception 'upload intent was not found' using errcode = 'P0001';
  end if;

  select * into object_row
  from platform_private.object_records
  where id = intent_row.object_id
  for update;
  if not found then
    raise exception 'governing upload object was not found' using errcode = 'P0001';
  end if;
  if intent_row.actor_id <> p_actor_id
     or object_row.owner_party_id <> p_acting_party_id then
    raise exception 'upload intent authority mismatch' using errcode = 'P0001';
  end if;

  insert into platform_private.idempotency_records (
    actor_id, operation, key_hash, request_hash, state, created_at, expires_at
  ) values (
    p_actor_id, 'platform.upload-intent.complete', p_idempotency_key_hash,
    p_request_hash, 'reserved', now_at, now_at + interval '30 days'
  )
  on conflict (actor_id, operation, key_hash) do nothing;

  select * into idempotency_row
  from platform_private.idempotency_records
  where actor_id = p_actor_id
    and operation = 'platform.upload-intent.complete'
    and key_hash = p_idempotency_key_hash
  for update;

  if idempotency_row.request_hash <> p_request_hash then
    raise exception 'idempotency request hash mismatch' using errcode = 'P0001';
  end if;

  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    if idempotency_row.response_ref->>'jobRef' is null then
      raise exception 'completed upload idempotency result has no job reference' using errcode = 'P0001';
    end if;
    job_id := (idempotency_row.response_ref->>'jobRef')::uuid;
    select id into existing_event_id
    from platform_private.outbox_events
    where event_type = 'object.uploaded'
      and schema_version = 1
      and aggregate_type = 'object_record'
      and aggregate_id = object_row.id
    order by occurred_at desc, id desc
    limit 1;
    if existing_event_id is null then
      raise exception 'completed upload idempotency result has no upload event' using errcode = 'P0001';
    end if;
    select version into object_version
    from platform_private.object_records
    where id = object_row.id;
    event_id := existing_event_id;
    object_id := object_row.id;
    replayed := true;
    return next;
    return;
  end if;

  if idempotency_row.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
    set state = 'reserved', response_ref = null
    where id = idempotency_row.id;
  end if;

  if intent_row.state <> 'issued'::platform_private.upload_intent_state
     or intent_row.expires_at <= now_at then
    raise exception 'upload intent is no longer admissible' using errcode = 'P0001';
  end if;
  if object_row.state <> 'pending_upload'::platform_private.object_state
     or object_row.version <> p_expected_version then
    raise exception 'upload object version or state conflict' using errcode = 'P0001';
  end if;
  if p_observed_byte_size > intent_row.max_bytes then
    raise exception 'provider-observed object exceeds intent maximum' using errcode = 'P0001';
  end if;
  if not (normalized_media_type = any (intent_row.allowed_media_types)) then
    raise exception 'provider-observed media type is not allowlisted' using errcode = 'P0001';
  end if;

  update platform_private.object_records
  set observed_byte_size = p_observed_byte_size,
      observed_media_type = normalized_media_type,
      observed_checksum = p_observed_checksum,
      state = 'uploaded'::platform_private.object_state,
      version = version + 1
  where id = object_row.id
    and state = 'pending_upload'::platform_private.object_state
    and version = p_expected_version;
  if not found then
    raise exception 'upload object version or state conflict' using errcode = 'P0001';
  end if;

  select version into object_version
  from platform_private.object_records
  where id = object_row.id;

  update platform_private.upload_intents
  set state = 'consumed'::platform_private.upload_intent_state
  where id = intent_row.id
    and state = 'issued'::platform_private.upload_intent_state;
  if not found then
    raise exception 'upload intent was consumed concurrently' using errcode = 'P0001';
  end if;

  insert into platform_private.jobs (
    id, job_type, actor_id, acting_party_id, state, progress, attempt_count,
    lease_until, result_ref, error_code, created_at, updated_at, version,
    correlation_id, causation_id, originating_event_id, attempts
  ) values (
    p_job_id, 'platform.object.verify', p_actor_id, p_acting_party_id,
    'queued'::platform_private.job_state, null, 0, null, null, null,
    now_at, now_at, 1, p_correlation_id, null, p_event_id, '[]'::jsonb
  );

  insert into platform_private.outbox_events (
    id, event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, causation_id, payload, occurred_at
  ) values (
    p_event_id, 'object.uploaded', 1, 'object_record', object_row.id,
    object_version, p_correlation_id, null,
    pg_catalog.jsonb_build_object('objectId', object_row.id), now_at
  );

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'upload.completion.accepted', p_actor_id, p_acting_party_id,
    'object_record', object_row.id, 'allowed', 'UPLOAD_COMPLETION_ACCEPTED',
    p_correlation_id, now_at
  );

  update platform_private.idempotency_records
  set state = 'completed'::platform_private.idempotency_state,
      response_ref = pg_catalog.jsonb_build_object(
        'status', 202,
        'resourceRef', pg_catalog.format('/api/v1/objects/%s', object_row.id),
        'jobRef', p_job_id
      )
  where id = idempotency_row.id;

  job_id := p_job_id;
  event_id := p_event_id;
  object_id := object_row.id;
  replayed := false;
  return next;
end;
$$;

create function platform_private.apply_object_verification(
  p_object_id uuid,
  p_expected_version bigint,
  p_next_state platform_private.object_state,
  p_error_code text default null,
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_job_id uuid default null
)
returns table (
  object_id uuid,
  version bigint,
  state platform_private.object_state,
  job_id uuid,
  applied boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  object_row platform_private.object_records;
  job_row platform_private.jobs;
  resolved_job_id uuid := p_job_id;
  terminal_error text;
begin
  if not platform_private.external_effects_allowed() then
    raise exception 'restore reconciliation fence is active' using errcode = 'P0001';
  end if;
  if p_object_id is null
     or p_expected_version is null
     or p_expected_version < 1
     or p_next_state not in (
       'verifying'::platform_private.object_state,
       'ready'::platform_private.object_state,
       'rejected'::platform_private.object_state,
       'quarantined'::platform_private.object_state
     )
     or p_correlation_id is null then
    raise exception 'invalid object verification request' using errcode = '22023';
  end if;

  select * into object_row
  from platform_private.object_records
  where id = p_object_id
  for update;
  if not found then
    raise exception 'verification object was not found' using errcode = 'P0001';
  end if;

  if object_row.state in (
       'ready'::platform_private.object_state,
       'rejected'::platform_private.object_state,
       'quarantined'::platform_private.object_state
     ) then
    object_id := object_row.id;
    version := object_row.version;
    state := object_row.state;
    job_id := p_job_id;
    applied := false;
    return next;
    return;
  end if;
  if object_row.version <> p_expected_version then
    raise exception 'verification object version conflict' using errcode = 'P0001';
  end if;

  if resolved_job_id is null then
    select j.id into resolved_job_id
    from platform_private.jobs j
    join platform_private.outbox_events e on e.id = j.originating_event_id
    where j.job_type = 'platform.object.verify'
      and e.event_type = 'object.uploaded'
      and e.schema_version = 1
      and e.aggregate_id = object_row.id
    order by j.created_at desc, j.id desc
    limit 1;
  end if;
  if resolved_job_id is null then
    raise exception 'verification job was not found' using errcode = 'P0001';
  end if;
  select * into job_row
  from platform_private.jobs
  where id = resolved_job_id
  for update;
  if not found or job_row.job_type <> 'platform.object.verify' then
    raise exception 'verification job was not found' using errcode = 'P0001';
  end if;

  if p_next_state = 'verifying'::platform_private.object_state then
    if object_row.state <> 'uploaded'::platform_private.object_state
       or job_row.state not in ('queued'::platform_private.job_state, 'running'::platform_private.job_state) then
      raise exception 'verification start state conflict' using errcode = 'P0001';
    end if;
    update platform_private.object_records as o
    set state = 'verifying'::platform_private.object_state,
        version = o.version + 1
    where o.id = object_row.id
      and o.state = 'uploaded'::platform_private.object_state
      and o.version = p_expected_version;
    if not found then
      raise exception 'verification start CAS conflict' using errcode = 'P0001';
    end if;
    if job_row.state = 'queued'::platform_private.job_state then
      update platform_private.jobs as j
      set state = 'running'::platform_private.job_state,
          attempt_count = j.attempt_count + 1,
          lease_until = now_at + interval '2 minutes',
          lease_token = extensions.gen_random_uuid(),
          updated_at = now_at,
          version = j.version + 1
      where j.id = job_row.id and j.state = 'queued'::platform_private.job_state;
      if not found then
        raise exception 'verification job start CAS conflict' using errcode = 'P0001';
      end if;
    end if;
    insert into audit_private.audit_events (
      action, actor_id, acting_party_id, target_type, target_id, decision,
      reason_code, correlation_id, occurred_at
    ) values (
      'object.verification.started', job_row.actor_id, job_row.acting_party_id,
      'object_record', object_row.id, 'allowed', 'OBJECT_VERIFICATION_STARTED',
      p_correlation_id, now_at
    );
    select o.version, o.state into version, state
    from platform_private.object_records as o where o.id = object_row.id;
    object_id := object_row.id;
    job_id := job_row.id;
    applied := true;
    return next;
    return;
  end if;

  if object_row.state <> 'verifying'::platform_private.object_state
     or job_row.state <> 'running'::platform_private.job_state then
    raise exception 'verification terminal state conflict' using errcode = 'P0001';
  end if;
  if p_next_state = 'ready'::platform_private.object_state then
    if p_error_code is not null
       or object_row.observed_byte_size is null
       or object_row.observed_media_type is null
       or object_row.observed_checksum is null
       or object_row.observed_byte_size <> object_row.byte_size
       or object_row.observed_media_type <> object_row.media_type
       or object_row.observed_checksum <> object_row.checksum then
      raise exception 'provider-observed metadata failed verification' using errcode = 'P0001';
    end if;
  else
    terminal_error := coalesce(
      p_error_code,
      case when p_next_state = 'quarantined'::platform_private.object_state
           then 'OBJECT_QUARANTINED' else 'OBJECT_VERIFICATION_FAILED' end
    );
    if terminal_error !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
      raise exception 'invalid verification error code' using errcode = '22023';
    end if;
  end if;

  update platform_private.object_records as o
  set state = p_next_state,
      version = o.version + 1
  where o.id = object_row.id
    and o.state = 'verifying'::platform_private.object_state
    and o.version = p_expected_version;
  if not found then
    raise exception 'verification terminal CAS conflict' using errcode = 'P0001';
  end if;

  if p_next_state = 'ready'::platform_private.object_state then
    update platform_private.jobs as j
    set state = 'succeeded'::platform_private.job_state,
        result_ref = pg_catalog.jsonb_build_object('type', 'object_record', 'id', object_row.id),
        error_code = null,
        lease_until = null,
        lease_token = null,
        updated_at = now_at,
        version = j.version + 1
    where j.id = job_row.id and j.state = 'running'::platform_private.job_state;
  else
    update platform_private.jobs as j
    set state = 'failed'::platform_private.job_state,
        result_ref = null,
        error_code = terminal_error,
        lease_until = null,
        lease_token = null,
        updated_at = now_at,
        version = j.version + 1
    where j.id = job_row.id and j.state = 'running'::platform_private.job_state;
  end if;
  if not found then
    raise exception 'verification job terminal CAS conflict' using errcode = 'P0001';
  end if;

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    case when p_next_state = 'ready'::platform_private.object_state
         then 'object.verification.completed'
         when p_next_state = 'quarantined'::platform_private.object_state
         then 'object.verification.quarantined'
         else 'object.verification.rejected' end,
    job_row.actor_id, job_row.acting_party_id, 'object_record', object_row.id,
    case when p_next_state = 'ready'::platform_private.object_state
         then 'completed'::platform_private.audit_decision
         else 'failed'::platform_private.audit_decision end,
    case when p_next_state = 'ready'::platform_private.object_state
         then 'OBJECT_READY' else terminal_error end,
    p_correlation_id, now_at
  );

  select o.version, o.state into version, state
  from platform_private.object_records as o where o.id = object_row.id;
  object_id := object_row.id;
  job_id := job_row.id;
  applied := true;
  return next;
end;
$$;

create function platform_private.read_consumable_object(p_object_id uuid)
returns table (
  id uuid,
  bucket text,
  object_key text,
  media_type text,
  byte_size bigint,
  checksum bytea,
  version bigint
)
language sql
security definer
set search_path = ''
as $$
  select o.id, o.bucket, o.object_key, o.media_type, o.byte_size, o.checksum, o.version
  from platform_private.object_records o
  where o.id = p_object_id
    and o.state = 'ready'::platform_private.object_state;
$$;

create function platform_api.complete_upload_intent(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_upload_intent_id uuid,
  p_expected_version bigint,
  p_observed_byte_size bigint,
  p_observed_media_type text,
  p_observed_checksum bytea,
  p_storage_adapter text,
  p_idempotency_key_hash bytea,
  p_request_hash bytea,
  p_correlation_id uuid,
  p_job_id uuid default extensions.gen_random_uuid(),
  p_event_id uuid default extensions.gen_random_uuid()
)
returns table (job_id uuid, event_id uuid, object_id uuid, object_version bigint, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.complete_upload_intent(
    p_actor_id, p_acting_party_id, p_upload_intent_id, p_expected_version,
    p_observed_byte_size, p_observed_media_type, p_observed_checksum,
    p_storage_adapter, p_idempotency_key_hash, p_request_hash, p_correlation_id,
    p_job_id, p_event_id
  );
$$;

create function platform_api.apply_object_verification(
  p_object_id uuid,
  p_expected_version bigint,
  p_next_state platform_private.object_state,
  p_error_code text default null,
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_job_id uuid default null
)
returns table (object_id uuid, version bigint, state platform_private.object_state, job_id uuid, applied boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.apply_object_verification(
    p_object_id, p_expected_version, p_next_state, p_error_code,
    p_correlation_id, p_job_id
  );
$$;

create function platform_api.read_consumable_object(p_object_id uuid)
returns table (id uuid, bucket text, object_key text, media_type text, byte_size bigint, checksum bytea, version bigint)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.read_consumable_object(p_object_id);
$$;

revoke all on function platform_private.complete_upload_intent(uuid, uuid, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.apply_object_verification(uuid, bigint, platform_private.object_state, text, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.read_consumable_object(uuid)
  from public, anon, authenticated;
grant execute on function platform_private.complete_upload_intent(uuid, uuid, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.apply_object_verification(uuid, bigint, platform_private.object_state, text, uuid, uuid) to service_role;
grant execute on function platform_private.read_consumable_object(uuid) to service_role;

revoke all on function platform_api.complete_upload_intent(uuid, uuid, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_object_verification(uuid, bigint, platform_private.object_state, text, uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function platform_api.read_consumable_object(uuid)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.complete_upload_intent(uuid, uuid, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.apply_object_verification(uuid, bigint, platform_private.object_state, text, uuid, uuid) to service_role;
grant execute on function platform_api.read_consumable_object(uuid) to service_role;

commit;

-- Rollback policy: forward-only compensating migration.  Observed metadata,
-- state transitions, jobs, outbox events, and audit evidence are retained.
