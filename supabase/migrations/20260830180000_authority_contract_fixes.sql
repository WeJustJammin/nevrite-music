begin;

-- Forward-only contract repair for Phase 1 S04/S06.  The canonical records
-- stay deliberately small; these private evidence tables bind the claims
-- which must be revalidated by every privileged adapter RPC.

create table platform_private.upload_intent_authority (
  intent_id uuid primary key references platform_private.upload_intents(id),
  target_type text not null check (
    target_type = pg_catalog.lower(pg_catalog.btrim(target_type))
    and target_type ~ '^[a-z][a-z0-9._-]{0,63}$'
  ),
  target_id uuid not null,
  target_version bigint check (target_version is null or target_version > 0),
  actor_id uuid not null,
  acting_party_id uuid not null,
  created_at timestamptz not null default now()
);

comment on table platform_private.upload_intent_authority is
  'Immutable server-derived target/actor/party/version binding for an upload intent; it is authority evidence, not a client-writable target record.';

alter table platform_private.upload_intent_authority enable row level security;
alter table platform_private.upload_intent_authority force row level security;
revoke all on table platform_private.upload_intent_authority
  from public, anon, authenticated, service_role;

create index upload_intent_authority_target_idx
  on platform_private.upload_intent_authority (target_type, target_id, target_version);
create index upload_intent_authority_party_idx
  on platform_private.upload_intent_authority (acting_party_id, created_at desc);

create function platform_private.guard_upload_intent_authority() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'upload target authority evidence is append-only' using errcode = 'P0001';
  end if;
  if new.intent_id is distinct from old.intent_id
     or new.target_type is distinct from old.target_type
     or new.target_id is distinct from old.target_id
     or new.target_version is distinct from old.target_version
     or new.actor_id is distinct from old.actor_id
     or new.acting_party_id is distinct from old.acting_party_id
     or new.created_at is distinct from old.created_at then
    raise exception 'upload target authority evidence is immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger upload_intent_authority_guard
before update or delete on platform_private.upload_intent_authority
for each row execute function platform_private.guard_upload_intent_authority();

-- A processed receipt is terminal. Failed delivery may be escalated to manual
-- review, but it may not be silently replayed as trusted work.
create or replace function platform_private.guard_webhook_receipts() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'webhook receipts are append-only at the row boundary' using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.provider is distinct from old.provider
     or new.external_event_id is distinct from old.external_event_id
     or new.payload_digest is distinct from old.payload_digest
     or new.received_at is distinct from old.received_at then
    raise exception 'webhook receipt identity and digest are immutable' using errcode = 'P0001';
  end if;
  if old.signature_verified_at is not null and new.signature_verified_at is distinct from old.signature_verified_at then
    raise exception 'webhook signature evidence is immutable once recorded' using errcode = 'P0001';
  end if;
  if old.operation_id is not null and new.operation_id is distinct from old.operation_id then
    raise exception 'webhook operation evidence is immutable once attached' using errcode = 'P0001';
  end if;
  if old.state in (
       'duplicate'::platform_private.webhook_receipt_state,
       'rejected'::platform_private.webhook_receipt_state,
       'processed'::platform_private.webhook_receipt_state,
       'manual_review'::platform_private.webhook_receipt_state
     ) and new.state is distinct from old.state then
    raise exception 'terminal webhook receipt state is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'received'::platform_private.webhook_receipt_state
       and new.state not in (
         'received'::platform_private.webhook_receipt_state,
         'accepted'::platform_private.webhook_receipt_state,
         'duplicate'::platform_private.webhook_receipt_state,
         'rejected'::platform_private.webhook_receipt_state,
         'manual_review'::platform_private.webhook_receipt_state
       )
     or old.state = 'accepted'::platform_private.webhook_receipt_state
       and new.state not in (
         'accepted'::platform_private.webhook_receipt_state,
         'processed'::platform_private.webhook_receipt_state,
         'failed'::platform_private.webhook_receipt_state,
         'manual_review'::platform_private.webhook_receipt_state
       )
     or old.state = 'failed'::platform_private.webhook_receipt_state
       and new.state not in (
         'failed'::platform_private.webhook_receipt_state,
         'manual_review'::platform_private.webhook_receipt_state
       )
     or old.state in (
         'duplicate'::platform_private.webhook_receipt_state,
         'rejected'::platform_private.webhook_receipt_state,
         'processed'::platform_private.webhook_receipt_state,
         'manual_review'::platform_private.webhook_receipt_state
       ) and new.state is distinct from old.state then
    raise exception 'invalid webhook receipt state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Provider effect payloads are bounded, allowlisted-by-shape evidence.  Raw
-- request bodies, credentials, headers, and signature material are excluded.
create function platform_private.valid_governed_provider_payload_node(value jsonb, depth integer)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  key text;
  child jsonb;
  object_count integer;
begin
  if value is null or depth > 4 then
    return false;
  end if;
  if pg_catalog.jsonb_typeof(value) = 'object' then
    object_count := 0;
    for key, child in
      select members.key, members.value
      from pg_catalog.jsonb_each(value) as members(key, value)
    loop
      object_count := object_count + 1;
      if object_count > 32 then
        return false;
      end if;
      if key !~ '^[A-Za-z][A-Za-z0-9_]{0,63}$'
         or pg_catalog.lower(key) in (
           'raw', 'rawbody', 'raw_body', 'body', 'secret', 'token',
           'credential', 'credentials', 'password', 'authorization',
           'signature', 'headers', 'header', 'cookie', 'cookies'
         )
         or not platform_private.valid_governed_provider_payload_node(child, depth + 1) then
        return false;
      end if;
    end loop;
  elsif pg_catalog.jsonb_typeof(value) = 'array' then
    if pg_catalog.jsonb_array_length(value) > 100 then
      return false;
    end if;
    for child in select elements.value from pg_catalog.jsonb_array_elements(value) as elements(value) loop
      if not platform_private.valid_governed_provider_payload_node(child, depth + 1) then
        return false;
      end if;
    end loop;
  end if;
  return true;
end;
$$;

create function platform_private.valid_governed_provider_payload(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
    and pg_catalog.jsonb_typeof(value) = 'object'
    and pg_catalog.octet_length(value::text) <= 32768
    and platform_private.valid_governed_provider_payload_node(value, 0);
$$;

create table platform_private.provider_operation_intents (
  operation_id uuid primary key references platform_private.provider_operations(id),
  provider text not null check (
    provider = pg_catalog.lower(pg_catalog.btrim(provider))
    and pg_catalog.length(provider) between 1 and 64
    and provider ~ '^[a-z][a-z0-9._-]*$'
  ),
  operation_type text not null check (
    operation_type = pg_catalog.lower(pg_catalog.btrim(operation_type))
    and pg_catalog.length(operation_type) between 1 and 128
    and operation_type ~ '^[a-z][a-z0-9._-]*$'
  ),
  actor_id uuid not null,
  acting_party_id uuid not null,
  intent_hash bytea not null check (pg_catalog.octet_length(intent_hash) = 32),
  provider_idempotency_key_hash bytea not null check (pg_catalog.octet_length(provider_idempotency_key_hash) = 32),
  governed_payload jsonb not null check (platform_private.valid_governed_provider_payload(governed_payload)),
  created_at timestamptz not null default now()
);

comment on table platform_private.provider_operation_intents is
  'Immutable bounded provider intent payload evidence. It contains no provider credentials or raw request body.';

create table platform_private.webhook_event_records (
  receipt_id uuid primary key references platform_private.webhook_receipts(id),
  provider text not null check (
    provider = pg_catalog.lower(pg_catalog.btrim(provider))
    and pg_catalog.length(provider) between 1 and 64
    and provider ~ '^[a-z][a-z0-9._-]*$'
  ),
  external_event_id text not null check (
    external_event_id = pg_catalog.btrim(external_event_id)
    and pg_catalog.length(external_event_id) between 1 and 256
    and external_event_id !~ '[[:cntrl:]]'
  ),
  event_type text not null check (
    event_type = pg_catalog.lower(pg_catalog.btrim(event_type))
    and event_type ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  schema_version integer not null check (schema_version > 0 and schema_version <= 1000),
  payload_digest bytea not null check (pg_catalog.octet_length(payload_digest) = 32),
  normalized_event jsonb not null check (platform_private.valid_governed_provider_payload(normalized_event)),
  created_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

comment on table platform_private.webhook_event_records is
  'Strict normalized provider event evidence keyed by webhook receipt. Raw webhook bytes are never persisted.';

alter table platform_private.provider_operation_intents enable row level security;
alter table platform_private.provider_operation_intents force row level security;
alter table platform_private.webhook_event_records enable row level security;
alter table platform_private.webhook_event_records force row level security;
revoke all on table platform_private.provider_operation_intents, platform_private.webhook_event_records
  from public, anon, authenticated, service_role;

create index provider_operation_intents_actor_idx
  on platform_private.provider_operation_intents (actor_id, acting_party_id, created_at desc);
create index webhook_event_records_provider_event_idx
  on platform_private.webhook_event_records (provider, external_event_id);
create index webhook_event_records_type_created_idx
  on platform_private.webhook_event_records (event_type, created_at desc);

create function platform_private.guard_provider_operation_intents() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'provider operation intent evidence is append-only' using errcode = 'P0001';
  end if;
  if new.operation_id is distinct from old.operation_id
     or new.provider is distinct from old.provider
     or new.operation_type is distinct from old.operation_type
     or new.actor_id is distinct from old.actor_id
     or new.acting_party_id is distinct from old.acting_party_id
     or new.intent_hash is distinct from old.intent_hash
     or new.provider_idempotency_key_hash is distinct from old.provider_idempotency_key_hash
     or new.governed_payload is distinct from old.governed_payload
     or new.created_at is distinct from old.created_at then
    raise exception 'provider operation intent evidence is immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function platform_private.guard_webhook_event_records() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'normalized webhook event evidence is append-only' using errcode = 'P0001';
  end if;
  if new.receipt_id is distinct from old.receipt_id
     or new.provider is distinct from old.provider
     or new.external_event_id is distinct from old.external_event_id
     or new.event_type is distinct from old.event_type
     or new.schema_version is distinct from old.schema_version
     or new.payload_digest is distinct from old.payload_digest
     or new.normalized_event is distinct from old.normalized_event
     or new.created_at is distinct from old.created_at then
    raise exception 'normalized webhook event evidence is immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger provider_operation_intents_guard
before update or delete on platform_private.provider_operation_intents
for each row execute function platform_private.guard_provider_operation_intents();
create trigger webhook_event_records_guard
before update or delete on platform_private.webhook_event_records
for each row execute function platform_private.guard_webhook_event_records();

create function platform_private.create_upload_intent_authorized(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_target_version bigint,
  p_bucket text,
  p_object_key text,
  p_purpose text,
  p_media_type text,
  p_byte_size bigint,
  p_checksum bytea,
  p_retention_class text,
  p_max_bytes bigint,
  p_allowed_media_types text[],
  p_expires_at timestamptz,
  p_idempotency_key_hash bytea,
  p_request_hash bytea,
  p_object_id uuid,
  p_intent_id uuid,
  p_correlation_id uuid
)
returns table (
  intent_id uuid,
  object_id uuid,
  version bigint,
  expires_at timestamptz,
  replayed boolean,
  target_type text,
  target_id uuid,
  target_version bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  creation record;
  binding platform_private.upload_intent_authority;
  normalized_target_type text := pg_catalog.lower(pg_catalog.btrim(p_target_type));
  now_at timestamptz := clock_timestamp();
begin
  if p_actor_id is null
     or p_acting_party_id is null
     or p_target_type is null
     or p_target_type <> normalized_target_type
     or normalized_target_type !~ '^[a-z][a-z0-9._-]{0,63}$'
     or p_target_id is null
     or p_target_version is not null and p_target_version < 1 then
    raise exception 'invalid upload target authority' using errcode = '22023';
  end if;

  select * into creation
  from platform_private.create_upload_intent(
    p_actor_id,
    p_acting_party_id,
    p_bucket,
    p_object_key,
    p_purpose,
    p_media_type,
    p_byte_size,
    p_checksum,
    p_retention_class,
    p_max_bytes,
    p_allowed_media_types,
    p_expires_at,
    p_idempotency_key_hash,
    p_request_hash,
    p_object_id,
    p_intent_id,
    p_correlation_id
  );

  if creation.replayed then
    select * into binding
    from platform_private.upload_intent_authority as authority
    where authority.intent_id = creation.intent_id
    for update;
    if not found then
      raise exception 'legacy upload intent has no target authority binding' using errcode = 'P0001';
    end if;
    if binding.actor_id <> p_actor_id
       or binding.acting_party_id <> p_acting_party_id
       or binding.target_type <> normalized_target_type
       or binding.target_id <> p_target_id
       or binding.target_version is distinct from p_target_version then
      raise exception 'upload target authority replay conflict' using errcode = 'P0001';
    end if;
  else
    insert into platform_private.upload_intent_authority (
      intent_id, target_type, target_id, target_version, actor_id,
      acting_party_id, created_at
    ) values (
      creation.intent_id, normalized_target_type, p_target_id, p_target_version,
      p_actor_id, p_acting_party_id, now_at
    );
    insert into audit_private.audit_events (
      action, actor_id, acting_party_id, target_type, target_id, decision,
      reason_code, correlation_id, occurred_at
    ) values (
      'upload.intent.authority.bound', p_actor_id, p_acting_party_id,
      'upload_intent', creation.intent_id, 'allowed',
      'UPLOAD_TARGET_AUTHORITY_BOUND', p_correlation_id, now_at
    );
  end if;

  intent_id := creation.intent_id;
  object_id := creation.object_id;
  version := creation.version;
  expires_at := creation.expires_at;
  replayed := creation.replayed;
  target_type := normalized_target_type;
  target_id := p_target_id;
  target_version := p_target_version;
  return next;
end;
$$;

create function platform_private.complete_upload_intent_authorized(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_upload_intent_id uuid,
  p_expected_object_version bigint,
  p_target_type text,
  p_target_id uuid,
  p_target_version bigint,
  p_observed_byte_size bigint,
  p_observed_media_type text,
  p_observed_checksum bytea,
  p_storage_adapter text,
  p_idempotency_key_hash bytea,
  p_request_hash bytea,
  p_correlation_id uuid,
  p_job_id uuid,
  p_event_id uuid
)
returns table (
  job_id uuid,
  event_id uuid,
  object_id uuid,
  object_version bigint,
  replayed boolean,
  target_type text,
  target_id uuid,
  target_version bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  binding platform_private.upload_intent_authority;
  completion record;
  normalized_target_type text := pg_catalog.lower(pg_catalog.btrim(p_target_type));
  now_at timestamptz := clock_timestamp();
begin
  if p_actor_id is null
     or p_acting_party_id is null
     or p_upload_intent_id is null
     or p_expected_object_version is null
     or p_expected_object_version < 1
     or p_target_type is null
     or p_target_type <> normalized_target_type
     or normalized_target_type !~ '^[a-z][a-z0-9._-]{0,63}$'
     or p_target_id is null
     or p_target_version is not null and p_target_version < 1
     or p_job_id is null
     or p_event_id is null then
    raise exception 'invalid upload completion authority' using errcode = '22023';
  end if;

  select * into binding
  from platform_private.upload_intent_authority as authority
  where authority.intent_id = p_upload_intent_id
  for update;
  if not found then
    raise exception 'upload intent has no target authority binding' using errcode = 'P0001';
  end if;
  if binding.actor_id <> p_actor_id
     or binding.acting_party_id <> p_acting_party_id
     or binding.target_type <> normalized_target_type
     or binding.target_id <> p_target_id
     or binding.target_version is distinct from p_target_version then
    raise exception 'upload target authority completion conflict' using errcode = 'P0001';
  end if;

  select * into completion
  from platform_private.complete_upload_intent(
    p_actor_id,
    p_acting_party_id,
    p_upload_intent_id,
    p_expected_object_version,
    p_observed_byte_size,
    p_observed_media_type,
    p_observed_checksum,
    p_storage_adapter,
    p_idempotency_key_hash,
    p_request_hash,
    p_correlation_id,
    p_job_id,
    p_event_id
  );

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'upload.completion.target.revalidated', p_actor_id, p_acting_party_id,
    normalized_target_type, p_target_id, 'allowed',
    'UPLOAD_TARGET_AUTHORITY_REVALIDATED', p_correlation_id, now_at
  );

  job_id := completion.job_id;
  event_id := completion.event_id;
  object_id := completion.object_id;
  object_version := completion.object_version;
  replayed := completion.replayed;
  target_type := normalized_target_type;
  target_id := p_target_id;
  target_version := p_target_version;
  return next;
end;
$$;

create function platform_private.create_provider_operation_authorized(
  p_provider text,
  p_operation_type text,
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_intent_hash bytea,
  p_provider_idempotency_key_hash bytea,
  p_governed_payload jsonb,
  p_correlation_id uuid,
  p_causation_id uuid,
  p_operation_id uuid
)
returns table (operation_id uuid, version bigint, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  creation record;
  binding platform_private.provider_operation_intents;
  normalized_provider text := pg_catalog.lower(pg_catalog.btrim(p_provider));
  normalized_operation_type text := pg_catalog.lower(pg_catalog.btrim(p_operation_type));
  now_at timestamptz := clock_timestamp();
begin
  if p_provider is null
     or p_provider <> normalized_provider
     or normalized_provider !~ '^[a-z][a-z0-9._-]*$'
     or pg_catalog.length(normalized_provider) > 64
     or p_operation_type is null
     or p_operation_type <> normalized_operation_type
     or normalized_operation_type !~ '^[a-z][a-z0-9._-]*$'
     or pg_catalog.length(normalized_operation_type) > 128
     or p_actor_id is null
     or p_acting_party_id is null
     or p_intent_hash is null
     or pg_catalog.octet_length(p_intent_hash) <> 32
     or p_provider_idempotency_key_hash is null
     or pg_catalog.octet_length(p_provider_idempotency_key_hash) <> 32
     or not platform_private.valid_governed_provider_payload(p_governed_payload)
     or p_correlation_id is null
     or p_operation_id is null then
    raise exception 'invalid governed provider operation request' using errcode = '22023';
  end if;

  select * into creation
  from platform_private.create_provider_operation(
    normalized_provider,
    normalized_operation_type,
    p_actor_id,
    p_intent_hash,
    p_provider_idempotency_key_hash,
    p_correlation_id,
    p_acting_party_id,
    p_causation_id,
    p_operation_id
  );

  if creation.replayed then
    select * into binding
    from platform_private.provider_operation_intents as intent
    where intent.operation_id = creation.operation_id
    for update;
    if not found then
      raise exception 'legacy provider operation has no governed intent evidence' using errcode = 'P0001';
    end if;
    if binding.provider <> normalized_provider
       or binding.operation_type <> normalized_operation_type
       or binding.actor_id <> p_actor_id
       or binding.acting_party_id <> p_acting_party_id
       or binding.intent_hash <> p_intent_hash
       or binding.provider_idempotency_key_hash <> p_provider_idempotency_key_hash
       or binding.governed_payload is distinct from p_governed_payload then
      raise exception 'provider operation authority replay conflict' using errcode = 'P0001';
    end if;
  else
    insert into platform_private.provider_operation_intents (
      operation_id, provider, operation_type, actor_id, acting_party_id,
      intent_hash, provider_idempotency_key_hash, governed_payload, created_at
    ) values (
      creation.operation_id, normalized_provider, normalized_operation_type,
      p_actor_id, p_acting_party_id, p_intent_hash,
      p_provider_idempotency_key_hash, p_governed_payload, now_at
    );
  end if;

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'provider.operation.authority.revalidated', p_actor_id, p_acting_party_id,
    'provider_operation', creation.operation_id, 'allowed',
    'PROVIDER_OPERATION_AUTHORITY_REVALIDATED', p_correlation_id, now_at
  );

  operation_id := creation.operation_id;
  version := creation.version;
  replayed := creation.replayed;
  return next;
end;
$$;

create function platform_private.read_provider_operation_authorized(
  p_operation_id uuid,
  p_actor_id uuid,
  p_acting_party_id uuid
)
returns table (
  operation_id uuid,
  provider text,
  operation_type text,
  actor_id uuid,
  acting_party_id uuid,
  state platform_private.provider_operation_state,
  intent_hash bytea,
  provider_ref text,
  last_attempt_at timestamptz,
  reconciliation_at timestamptz,
  version bigint,
  correlation_id uuid,
  causation_id uuid,
  provider_idempotency_key_hash bytea,
  attempts jsonb,
  governed_payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  operation_row platform_private.provider_operations;
begin
  if p_operation_id is null or p_actor_id is null or p_acting_party_id is null then
    raise exception 'invalid provider operation read authority' using errcode = '22023';
  end if;
  select o.* into operation_row
  from platform_private.provider_operations o
  join platform_private.provider_operation_intents i on i.operation_id = o.id
  where o.id = p_operation_id
    and o.actor_id = p_actor_id
    and i.actor_id = p_actor_id
    and i.acting_party_id = p_acting_party_id
  for update;
  if not found then
    raise exception 'provider operation authority mismatch' using errcode = 'P0001';
  end if;

  operation_id := operation_row.id;
  provider := operation_row.provider;
  operation_type := operation_row.operation_type;
  actor_id := operation_row.actor_id;
  acting_party_id := p_acting_party_id;
  state := operation_row.state;
  intent_hash := operation_row.intent_hash;
  provider_ref := operation_row.provider_ref;
  last_attempt_at := operation_row.last_attempt_at;
  reconciliation_at := operation_row.reconciliation_at;
  version := operation_row.version;
  correlation_id := operation_row.correlation_id;
  causation_id := operation_row.causation_id;
  provider_idempotency_key_hash := operation_row.provider_idempotency_key_hash;
  attempts := operation_row.attempts;
  select i.governed_payload into governed_payload
  from platform_private.provider_operation_intents i
  where i.operation_id = operation_row.id;
  return next;
end;
$$;

create function platform_private.apply_provider_operation_outcome_authorized(
  p_operation_id uuid,
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_expected_version bigint,
  p_next_state platform_private.provider_operation_state,
  p_provider_ref text default null,
  p_error_code text default null,
  p_retryable boolean default false,
  p_attempt_started_at timestamptz default null,
  p_attempt_ended_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  intent_row platform_private.provider_operation_intents;
  applied boolean;
  now_at timestamptz := clock_timestamp();
begin
  if p_operation_id is null or p_actor_id is null or p_acting_party_id is null then
    raise exception 'invalid provider outcome authority' using errcode = '22023';
  end if;
  select i.* into intent_row
  from platform_private.provider_operation_intents i
  join platform_private.provider_operations o on o.id = i.operation_id
  where i.operation_id = p_operation_id
    and o.actor_id = p_actor_id
    and i.actor_id = p_actor_id
    and i.acting_party_id = p_acting_party_id
  for update;
  if not found or intent_row.operation_id is null then
    raise exception 'provider operation outcome authority mismatch' using errcode = 'P0001';
  end if;

  applied := platform_private.apply_provider_operation_outcome(
    p_operation_id,
    p_expected_version,
    p_next_state,
    p_provider_ref,
    p_error_code,
    p_retryable,
    p_attempt_started_at,
    p_attempt_ended_at
  );
  if applied then
    insert into audit_private.audit_events (
      action, actor_id, acting_party_id, target_type, target_id, decision,
      reason_code, correlation_id, occurred_at
    ) values (
      'provider.operation.outcome.authority.revalidated', p_actor_id,
      p_acting_party_id, 'provider_operation', p_operation_id, 'allowed',
      'PROVIDER_OPERATION_OUTCOME_AUTHORITY_REVALIDATED',
      (select o.correlation_id from platform_private.provider_operations o where o.id = p_operation_id),
      now_at
    );
  end if;
  return applied;
end;
$$;

create function platform_private.record_webhook_receipt_authorized(
  p_provider text,
  p_external_event_id text,
  p_payload_digest bytea,
  p_event_type text,
  p_schema_version integer,
  p_normalized_event jsonb,
  p_signature_verified_at timestamptz,
  p_operation_id uuid,
  p_receipt_id uuid,
  p_correlation_id uuid,
  p_actor_id uuid,
  p_acting_party_id uuid
)
returns table (
  receipt_id uuid,
  accepted boolean,
  duplicate boolean,
  conflict boolean,
  state platform_private.webhook_receipt_state,
  operation_id uuid,
  event_type text,
  schema_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  normalized_provider text := pg_catalog.lower(pg_catalog.btrim(p_provider));
  normalized_event_type text := pg_catalog.lower(pg_catalog.btrim(p_event_type));
  existing_receipt platform_private.webhook_receipts;
  existing_event platform_private.webhook_event_records;
  operation_provider text;
  inserted_id uuid;
  event_found boolean;
  same_event boolean;
  resulting_state platform_private.webhook_receipt_state;
begin
  if p_provider is null
     or p_provider <> normalized_provider
     or normalized_provider !~ '^[a-z][a-z0-9._-]*$'
     or pg_catalog.length(normalized_provider) > 64
     or p_external_event_id is null
     or p_external_event_id <> pg_catalog.btrim(p_external_event_id)
     or pg_catalog.length(p_external_event_id) not between 1 and 256
     or p_external_event_id ~ '[[:cntrl:]]'
     or p_payload_digest is null
     or pg_catalog.octet_length(p_payload_digest) <> 32
     or p_event_type is null
     or p_event_type <> normalized_event_type
     or normalized_event_type !~ '^[a-z][a-z0-9._-]{0,127}$'
     or p_schema_version is null
     or p_schema_version < 1
     or p_schema_version > 1000
     or not platform_private.valid_governed_provider_payload(p_normalized_event)
     or p_signature_verified_at is null
     or p_signature_verified_at > now_at + interval '5 minutes'
     or p_receipt_id is null
     or p_correlation_id is null
     or p_actor_id is not null
     or p_acting_party_id <> '00000000-0000-0000-0000-000000000001'::uuid
     or p_acting_party_id is null then
    raise exception 'invalid schema-validated webhook receipt request' using errcode = '22023';
  end if;

  if p_operation_id is not null then
    select provider into operation_provider
    from platform_private.provider_operations
    where id = p_operation_id;
    if operation_provider is null or operation_provider <> normalized_provider then
      raise exception 'invalid schema-validated webhook operation' using errcode = '22023';
    end if;
  end if;

  insert into platform_private.webhook_receipts (
    id, provider, external_event_id, payload_digest, signature_verified_at,
    received_at, state, operation_id
  ) values (
    p_receipt_id, normalized_provider, p_external_event_id, p_payload_digest,
    p_signature_verified_at, now_at, 'accepted', p_operation_id
  ) on conflict (provider, external_event_id) do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    insert into platform_private.webhook_event_records (
      receipt_id, provider, external_event_id, event_type, schema_version,
      payload_digest, normalized_event, created_at
    ) values (
      p_receipt_id, normalized_provider, p_external_event_id, normalized_event_type,
      p_schema_version, p_payload_digest, p_normalized_event, now_at
    );
    insert into platform_private.outbox_events (
      event_type, schema_version, aggregate_type, aggregate_id,
      aggregate_version, correlation_id, causation_id, payload, occurred_at
    ) values (
      'webhook.accepted', 1, 'webhook_receipt', p_receipt_id, 1,
      p_correlation_id, p_operation_id,
      pg_catalog.jsonb_build_object('receiptId', p_receipt_id), now_at
    );
    insert into audit_private.audit_events (
      action, actor_id, acting_party_id, target_type, target_id, decision,
      reason_code, correlation_id, occurred_at
    ) values (
      'webhook.receipt.accepted', p_actor_id, p_acting_party_id,
      'webhook_receipt', p_receipt_id, 'allowed',
      'WEBHOOK_RECEIPT_SCHEMA_ACCEPTED', p_correlation_id, now_at
    );
    receipt_id := p_receipt_id;
    accepted := true;
    duplicate := false;
    conflict := false;
    state := 'accepted'::platform_private.webhook_receipt_state;
    operation_id := p_operation_id;
    event_type := normalized_event_type;
    schema_version := p_schema_version;
    return next;
    return;
  end if;

  select * into existing_receipt
  from platform_private.webhook_receipts as receipt
  where receipt.provider = normalized_provider
    and receipt.external_event_id = p_external_event_id
  for update;
  if not found then
    raise exception 'webhook receipt disappeared during deduplication' using errcode = 'P0001';
  end if;
  select * into existing_event
  from platform_private.webhook_event_records as event
  where event.receipt_id = existing_receipt.id;
  event_found := found;
  same_event := event_found
    and existing_event.provider = normalized_provider
    and existing_event.external_event_id = p_external_event_id
    and existing_event.event_type = normalized_event_type
    and existing_event.schema_version = p_schema_version
    and existing_event.payload_digest = p_payload_digest
    and existing_event.normalized_event is not distinct from p_normalized_event
    and existing_receipt.operation_id is not distinct from p_operation_id;

  if same_event then
    receipt_id := existing_receipt.id;
    accepted := false;
    duplicate := true;
    conflict := false;
    state := existing_receipt.state;
    operation_id := existing_receipt.operation_id;
    event_type := existing_event.event_type;
    schema_version := existing_event.schema_version;
    return next;
    return;
  end if;

  resulting_state := existing_receipt.state;
  if existing_receipt.state in (
       'received'::platform_private.webhook_receipt_state,
       'accepted'::platform_private.webhook_receipt_state,
       'failed'::platform_private.webhook_receipt_state
     ) then
    update platform_private.webhook_receipts
    set state = 'manual_review'::platform_private.webhook_receipt_state
    where id = existing_receipt.id
      and platform_private.webhook_receipts.state = existing_receipt.state;
    resulting_state := 'manual_review'::platform_private.webhook_receipt_state;
  end if;
  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'webhook.receipt.conflict', p_actor_id, p_acting_party_id,
    'webhook_receipt', existing_receipt.id, 'failed',
    case when existing_event.receipt_id is null
         then 'WEBHOOK_EVENT_EVIDENCE_CONFLICT'
         else 'WEBHOOK_DIGEST_OR_SCHEMA_CONFLICT' end,
    p_correlation_id, now_at
  );
  receipt_id := existing_receipt.id;
  accepted := false;
  duplicate := false;
  conflict := true;
  state := resulting_state;
  operation_id := existing_receipt.operation_id;
  event_type := case when event_found then existing_event.event_type else null end;
  schema_version := case when event_found then existing_event.schema_version else null end;
  return next;
end;
$$;

create function platform_private.apply_webhook_receipt_outcome_authorized(
  p_receipt_id uuid,
  p_expected_state platform_private.webhook_receipt_state,
  p_next_state platform_private.webhook_receipt_state,
  p_operation_id uuid,
  p_error_code text,
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt_row platform_private.webhook_receipts;
  event_row platform_private.webhook_event_records;
  applied boolean;
  event_found boolean;
begin
  if p_receipt_id is null
     or p_expected_state is null
     or p_next_state is null
     or p_actor_id is not null
     or p_acting_party_id is null
     or p_acting_party_id <> '00000000-0000-0000-0000-000000000001'::uuid then
    raise exception 'invalid webhook outcome authority' using errcode = '22023';
  end if;
  select r.* into receipt_row
  from platform_private.webhook_receipts r
  where r.id = p_receipt_id
  for update;
  if not found then
    raise exception 'webhook receipt was not found' using errcode = 'P0001';
  end if;
  select e.* into event_row
  from platform_private.webhook_event_records e
  where e.receipt_id = p_receipt_id
  for update;
  event_found := found;
  if p_next_state in (
       'accepted'::platform_private.webhook_receipt_state,
       'processed'::platform_private.webhook_receipt_state,
       'failed'::platform_private.webhook_receipt_state
     ) and (not event_found or event_row.receipt_id is null) then
    raise exception 'trusted webhook outcome requires normalized event evidence' using errcode = 'P0001';
  end if;
  if p_operation_id is not null and receipt_row.operation_id is not distinct from p_operation_id then
    null;
  elsif p_operation_id is not null then
    raise exception 'webhook outcome operation authority mismatch' using errcode = 'P0001';
  end if;
  applied := platform_private.apply_webhook_receipt_outcome(
    p_receipt_id, p_expected_state, p_next_state, p_operation_id, p_error_code
  );
  return applied;
end;
$$;

create function platform_api.create_upload_intent_authorized(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_target_version bigint,
  p_bucket text,
  p_object_key text,
  p_purpose text,
  p_media_type text,
  p_byte_size bigint,
  p_checksum bytea,
  p_retention_class text,
  p_max_bytes bigint,
  p_allowed_media_types text[],
  p_expires_at timestamptz,
  p_idempotency_key_hash bytea,
  p_request_hash bytea,
  p_object_id uuid,
  p_intent_id uuid,
  p_correlation_id uuid
)
returns table (
  intent_id uuid,
  object_id uuid,
  version bigint,
  expires_at timestamptz,
  replayed boolean,
  target_type text,
  target_id uuid,
  target_version bigint
)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.create_upload_intent_authorized(
    p_actor_id, p_acting_party_id, p_target_type, p_target_id, p_target_version,
    p_bucket, p_object_key, p_purpose, p_media_type, p_byte_size, p_checksum,
    p_retention_class, p_max_bytes, p_allowed_media_types, p_expires_at,
    p_idempotency_key_hash, p_request_hash, p_object_id, p_intent_id,
    p_correlation_id
  );
$$;

create function platform_api.complete_upload_intent_authorized(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_upload_intent_id uuid,
  p_expected_object_version bigint,
  p_target_type text,
  p_target_id uuid,
  p_target_version bigint,
  p_observed_byte_size bigint,
  p_observed_media_type text,
  p_observed_checksum bytea,
  p_storage_adapter text,
  p_idempotency_key_hash bytea,
  p_request_hash bytea,
  p_correlation_id uuid,
  p_job_id uuid,
  p_event_id uuid
)
returns table (
  job_id uuid,
  event_id uuid,
  object_id uuid,
  object_version bigint,
  replayed boolean,
  target_type text,
  target_id uuid,
  target_version bigint
)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.complete_upload_intent_authorized(
    p_actor_id, p_acting_party_id, p_upload_intent_id, p_expected_object_version,
    p_target_type, p_target_id, p_target_version, p_observed_byte_size,
    p_observed_media_type, p_observed_checksum, p_storage_adapter,
    p_idempotency_key_hash, p_request_hash, p_correlation_id, p_job_id, p_event_id
  );
$$;

create function platform_api.create_provider_operation_authorized(
  p_provider text,
  p_operation_type text,
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_intent_hash bytea,
  p_provider_idempotency_key_hash bytea,
  p_governed_payload jsonb,
  p_correlation_id uuid,
  p_causation_id uuid,
  p_operation_id uuid
)
returns table (operation_id uuid, version bigint, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.create_provider_operation_authorized(
    p_provider, p_operation_type, p_actor_id, p_acting_party_id, p_intent_hash,
    p_provider_idempotency_key_hash, p_governed_payload, p_correlation_id,
    p_causation_id, p_operation_id
  );
$$;

create function platform_api.read_provider_operation_authorized(
  p_operation_id uuid,
  p_actor_id uuid,
  p_acting_party_id uuid
)
returns table (
  operation_id uuid,
  provider text,
  operation_type text,
  actor_id uuid,
  acting_party_id uuid,
  state platform_private.provider_operation_state,
  intent_hash bytea,
  provider_ref text,
  last_attempt_at timestamptz,
  reconciliation_at timestamptz,
  version bigint,
  correlation_id uuid,
  causation_id uuid,
  provider_idempotency_key_hash bytea,
  attempts jsonb,
  governed_payload jsonb
)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.read_provider_operation_authorized(
    p_operation_id, p_actor_id, p_acting_party_id
  );
$$;

create function platform_api.apply_provider_operation_outcome_authorized(
  p_operation_id uuid,
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_expected_version bigint,
  p_next_state platform_private.provider_operation_state,
  p_provider_ref text default null,
  p_error_code text default null,
  p_retryable boolean default false,
  p_attempt_started_at timestamptz default null,
  p_attempt_ended_at timestamptz default null
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select platform_private.apply_provider_operation_outcome_authorized(
    p_operation_id, p_actor_id, p_acting_party_id, p_expected_version,
    p_next_state, p_provider_ref, p_error_code, p_retryable,
    p_attempt_started_at, p_attempt_ended_at
  );
$$;

create function platform_api.record_webhook_receipt_authorized(
  p_provider text,
  p_external_event_id text,
  p_payload_digest bytea,
  p_event_type text,
  p_schema_version integer,
  p_normalized_event jsonb,
  p_signature_verified_at timestamptz,
  p_operation_id uuid,
  p_receipt_id uuid,
  p_correlation_id uuid,
  p_actor_id uuid,
  p_acting_party_id uuid
)
returns table (
  receipt_id uuid,
  accepted boolean,
  duplicate boolean,
  conflict boolean,
  state platform_private.webhook_receipt_state,
  operation_id uuid,
  event_type text,
  schema_version integer
)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.record_webhook_receipt_authorized(
    p_provider, p_external_event_id, p_payload_digest, p_event_type,
    p_schema_version, p_normalized_event, p_signature_verified_at, p_operation_id,
    p_receipt_id, p_correlation_id, p_actor_id, p_acting_party_id
  );
$$;

create function platform_api.apply_webhook_receipt_outcome_authorized(
  p_receipt_id uuid,
  p_expected_state platform_private.webhook_receipt_state,
  p_next_state platform_private.webhook_receipt_state,
  p_operation_id uuid,
  p_error_code text,
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select platform_private.apply_webhook_receipt_outcome_authorized(
    p_receipt_id, p_expected_state, p_next_state, p_operation_id, p_error_code,
    p_actor_id, p_acting_party_id
  );
$$;

revoke all on function platform_private.guard_upload_intent_authority() from public, anon, authenticated, service_role;
revoke all on function platform_private.guard_webhook_receipts() from public, anon, authenticated, service_role;
revoke all on function platform_private.valid_governed_provider_payload_node(jsonb, integer) from public, anon, authenticated, service_role;
revoke all on function platform_private.valid_governed_provider_payload(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_private.guard_provider_operation_intents() from public, anon, authenticated, service_role;
revoke all on function platform_private.guard_webhook_event_records() from public, anon, authenticated, service_role;

revoke all on function platform_private.create_upload_intent_authorized(uuid, uuid, text, uuid, bigint, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.complete_upload_intent_authorized(uuid, uuid, uuid, bigint, text, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.create_provider_operation_authorized(text, text, uuid, uuid, bytea, bytea, jsonb, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.read_provider_operation_authorized(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.apply_provider_operation_outcome_authorized(uuid, uuid, uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function platform_private.record_webhook_receipt_authorized(text, text, bytea, text, integer, jsonb, timestamptz, uuid, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function platform_private.apply_webhook_receipt_outcome_authorized(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text, uuid, uuid)
  from public, anon, authenticated;

grant execute on function platform_private.create_upload_intent_authorized(uuid, uuid, text, uuid, bigint, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.complete_upload_intent_authorized(uuid, uuid, uuid, bigint, text, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.create_provider_operation_authorized(text, text, uuid, uuid, bytea, bytea, jsonb, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.read_provider_operation_authorized(uuid, uuid, uuid) to service_role;
grant execute on function platform_private.apply_provider_operation_outcome_authorized(uuid, uuid, uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) to service_role;
grant execute on function platform_private.record_webhook_receipt_authorized(text, text, bytea, text, integer, jsonb, timestamptz, uuid, uuid, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.apply_webhook_receipt_outcome_authorized(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text, uuid, uuid) to service_role;

revoke all on function platform_api.create_upload_intent_authorized(uuid, uuid, text, uuid, bigint, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.complete_upload_intent_authorized(uuid, uuid, uuid, bigint, text, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.create_provider_operation_authorized(text, text, uuid, uuid, bytea, bytea, jsonb, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.read_provider_operation_authorized(uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_provider_operation_outcome_authorized(uuid, uuid, uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) from public, anon, authenticated, service_role;
revoke all on function platform_api.record_webhook_receipt_authorized(text, text, bytea, text, integer, jsonb, timestamptz, uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_webhook_receipt_outcome_authorized(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text, uuid, uuid) from public, anon, authenticated, service_role;

grant execute on function platform_api.create_upload_intent_authorized(uuid, uuid, text, uuid, bigint, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.complete_upload_intent_authorized(uuid, uuid, uuid, bigint, text, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.create_provider_operation_authorized(text, text, uuid, uuid, bytea, bytea, jsonb, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.read_provider_operation_authorized(uuid, uuid, uuid) to service_role;
grant execute on function platform_api.apply_provider_operation_outcome_authorized(uuid, uuid, uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) to service_role;
grant execute on function platform_api.record_webhook_receipt_authorized(text, text, bytea, text, integer, jsonb, timestamptz, uuid, uuid, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.apply_webhook_receipt_outcome_authorized(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text, uuid, uuid) to service_role;

-- S07 correction: a self-attested boolean matrix is diagnostic evidence only.
-- Opening protected writes additionally requires an immutable, externally
-- promoted artifact binding for the exact source revision and environment.
create table platform_private.recovery_verification_promotions (
  id uuid primary key,
  artifact_id uuid not null,
  artifact_digest bytea not null check (pg_catalog.octet_length(artifact_digest) = 32),
  source_revision text not null check (
    source_revision = pg_catalog.btrim(source_revision)
    and pg_catalog.length(source_revision) between 1 and 128
    and source_revision ~ '^[A-Za-z0-9._:/-]+$'
  ),
  environment text not null check (
    environment = pg_catalog.lower(pg_catalog.btrim(environment))
    and environment ~ '^[a-z][a-z0-9._-]{0,63}$'
  ),
  promoted_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  check (expires_at > promoted_at),
  unique (artifact_id, artifact_digest, source_revision, environment)
);

comment on table platform_private.recovery_verification_promotions is
  'Immutable deployment-controlled promotion evidence. Rows are provisioned by a reviewed promotion process; service-role verification RPCs cannot create or rewrite them.';
comment on column platform_private.recovery_verification_promotions.source_revision is
  'Exact source/build revision that produced the promoted recovery artifact.';
comment on column platform_private.recovery_verification_promotions.environment is
  'Deployment environment bound to the promoted artifact; protected writes require production.';

alter table platform_private.recovery_verification_promotions enable row level security;
alter table platform_private.recovery_verification_promotions force row level security;
revoke all on table platform_private.recovery_verification_promotions
  from public, anon, authenticated, service_role;
create index recovery_promotions_artifact_idx
  on platform_private.recovery_verification_promotions (artifact_id, source_revision, environment);

create function platform_private.guard_recovery_verification_promotions() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'recovery verification promotions are append-only' using errcode = 'P0001';
end;
$$;

create trigger recovery_verification_promotions_append_only
before update or delete on platform_private.recovery_verification_promotions
for each row execute function platform_private.guard_recovery_verification_promotions();

alter table platform_private.recovery_verification_evidence
  add column provenance_kind text not null default 'unavailable',
  add column promotion_id uuid references platform_private.recovery_verification_promotions(id),
  add column artifact_id uuid,
  add column artifact_digest bytea,
  add column source_revision text,
  add column environment text;

alter table platform_private.recovery_verification_evidence
  add constraint recovery_verification_provenance_kind_check check (
    provenance_kind in ('unavailable', 'promoted_artifact')
  ),
  add constraint recovery_verification_provenance_shape_check check (
    (provenance_kind = 'unavailable'
      and promotion_id is null
      and artifact_id is null
      and artifact_digest is null
      and source_revision is null
      and environment is null)
    or (provenance_kind = 'promoted_artifact'
      and promotion_id is not null
      and artifact_id is not null
      and pg_catalog.octet_length(artifact_digest) = 32
      and source_revision is not null
      and source_revision = pg_catalog.btrim(source_revision)
      and pg_catalog.length(source_revision) between 1 and 128
      and source_revision ~ '^[A-Za-z0-9._:/-]+$'
      and environment is not null
      and environment = pg_catalog.lower(pg_catalog.btrim(environment))
      and environment ~ '^[a-z][a-z0-9._-]{0,63}$')
  );

create index recovery_verification_provenance_idx
  on platform_private.recovery_verification_evidence (provenance_kind, promotion_id, verified_at desc);

create or replace function platform_private.protected_writes_allowed()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_restore_epoch bigint;
  consumer_restore_epoch bigint;
  fence_integrity_verified boolean;
  fence_reconciliation_complete boolean;
  evidence_row platform_private.recovery_verification_evidence;
  now_at timestamptz := clock_timestamp();
begin
  if not platform_private.external_effects_allowed() then
    return false;
  end if;

  select expected_epoch, consumer_epoch, integrity_verified, reconciliation_complete
    into current_restore_epoch, consumer_restore_epoch,
         fence_integrity_verified, fence_reconciliation_complete
  from platform_private.read_restore_fence();
  if current_restore_epoch is null
     or consumer_restore_epoch is distinct from current_restore_epoch
     or not coalesce(fence_integrity_verified, false)
     or not coalesce(fence_reconciliation_complete, false) then
    return false;
  end if;

  select * into evidence_row
  from platform_private.recovery_verification_evidence as evidence
  order by evidence.verified_at desc, evidence.created_at desc, evidence.id desc
  limit 1;
  if not found then
    return false;
  end if;

  -- The promotion row is deliberately not writable by service_role. Every
  -- bound value must match, remain fresh, and be production-promoted.
  perform 1
  from platform_private.recovery_verification_promotions as promotion
  where promotion.id = evidence_row.promotion_id
    and promotion.artifact_id = evidence_row.artifact_id
    and promotion.artifact_digest = evidence_row.artifact_digest
    and promotion.source_revision = evidence_row.source_revision
    and promotion.environment = evidence_row.environment
    and promotion.environment = 'production'
    and promotion.promoted_at <= evidence_row.verified_at
    and promotion.expires_at >= evidence_row.expires_at
    and promotion.expires_at > now_at
  for share;
  if not found
     or evidence_row.provenance_kind <> 'promoted_artifact'
     or evidence_row.restore_epoch <> current_restore_epoch
     or not evidence_row.pitr_supported
     or evidence_row.pitr_window_seconds is null
     or evidence_row.pitr_window_seconds < 604800
     or evidence_row.measured_rpo_seconds is null
     or evidence_row.measured_rpo_seconds > 120
     or evidence_row.measured_rto_seconds is null
     or evidence_row.measured_rto_seconds > 14400
     or evidence_row.verified_at > now_at
     or evidence_row.expires_at <= now_at
     or not evidence_row.integrity_verified
     or not evidence_row.rls_verified
     or not evidence_row.rpc_verified
     or not evidence_row.idempotency_outbox_job_verified
     or not evidence_row.object_verified
     or not evidence_row.provider_webhook_verified
     or not evidence_row.public_projection_verified then
    return false;
  end if;
  return true;
end;
$$;

create or replace function platform_private.read_recovery_verification()
returns table (
  evidence_present boolean,
  evidence_id uuid,
  current_restore_epoch bigint,
  consumer_restore_epoch bigint,
  restore_epoch bigint,
  pitr_supported boolean,
  pitr_window_seconds bigint,
  measured_rpo_seconds bigint,
  measured_rto_seconds bigint,
  verified_at timestamptz,
  expires_at timestamptz,
  integrity_verified boolean,
  rls_verified boolean,
  rpc_verified boolean,
  idempotency_outbox_job_verified boolean,
  object_verified boolean,
  provider_webhook_verified boolean,
  public_projection_verified boolean,
  pitr_status text,
  pitr_available boolean,
  protected_writes_allowed boolean,
  reason_code text
)
language sql
security definer
set search_path = ''
as $$
  with fence as (
    select expected_epoch, consumer_epoch, integrity_verified, reconciliation_complete
    from platform_private.read_restore_fence()
  ),
  latest as (
    select evidence.*,
      (
        evidence.provenance_kind = 'promoted_artifact'
        and promotion.id is not null
        and promotion.environment = 'production'
        and promotion.promoted_at <= evidence.verified_at
        and promotion.expires_at >= evidence.expires_at
        and promotion.expires_at > clock_timestamp()
      ) as provenance_valid
    from platform_private.recovery_verification_evidence as evidence
    left join platform_private.recovery_verification_promotions as promotion
      on promotion.id = evidence.promotion_id
     and promotion.artifact_id = evidence.artifact_id
     and promotion.artifact_digest = evidence.artifact_digest
     and promotion.source_revision = evidence.source_revision
     and promotion.environment = evidence.environment
    order by evidence.verified_at desc, evidence.created_at desc, evidence.id desc
    limit 1
  ),
  gate as (
    select platform_private.protected_writes_allowed() as allowed
  )
  select
    latest.id is not null,
    latest.id,
    fence.expected_epoch,
    fence.consumer_epoch,
    latest.restore_epoch,
    latest.pitr_supported,
    latest.pitr_window_seconds,
    latest.measured_rpo_seconds,
    latest.measured_rto_seconds,
    latest.verified_at,
    latest.expires_at,
    latest.integrity_verified,
    latest.rls_verified,
    latest.rpc_verified,
    latest.idempotency_outbox_job_verified,
    latest.object_verified,
    latest.provider_webhook_verified,
    latest.public_projection_verified,
    case when latest.pitr_supported
       and latest.pitr_window_seconds >= 604800
       and coalesce(latest.provenance_valid, false)
       then 'available' else 'unavailable' end,
    latest.pitr_supported
      and latest.pitr_window_seconds >= 604800
      and coalesce(latest.provenance_valid, false),
    gate.allowed,
    case
      when latest.id is null then 'RECOVERY_EVIDENCE_MISSING'
      when not latest.pitr_supported
        or latest.pitr_window_seconds is null
        or latest.pitr_window_seconds < 604800 then 'PITR_UNAVAILABLE'
      when latest.measured_rpo_seconds is null
        or latest.measured_rto_seconds is null
        or latest.measured_rpo_seconds > 120
        or latest.measured_rto_seconds > 14400 then 'RECOVERY_METRICS_UNVERIFIED'
      when latest.verified_at > clock_timestamp()
        or latest.expires_at <= clock_timestamp() then 'RECOVERY_EVIDENCE_STALE'
      when latest.restore_epoch is distinct from fence.expected_epoch
        or fence.consumer_epoch is distinct from fence.expected_epoch then 'RESTORE_EPOCH_MISMATCH'
      when not coalesce(fence.integrity_verified, false)
        or not coalesce(fence.reconciliation_complete, false) then 'RESTORE_RECONCILIATION_INCOMPLETE'
      when not latest.integrity_verified then 'INTEGRITY_CHECK_FAILED'
      when not latest.rls_verified then 'RLS_CHECK_FAILED'
      when not latest.rpc_verified then 'RPC_CHECK_FAILED'
      when not latest.idempotency_outbox_job_verified then 'PERSISTENCE_CHECK_FAILED'
      when not latest.object_verified then 'OBJECT_CHECK_FAILED'
      when not latest.provider_webhook_verified then 'PROVIDER_WEBHOOK_CHECK_FAILED'
      when not latest.public_projection_verified then 'PUBLIC_PROJECTION_CHECK_FAILED'
      when not coalesce(latest.provenance_valid, false) then 'RECOVERY_PROVENANCE_UNVERIFIED'
      else 'RECOVERY_VERIFIED'
    end
  from fence
  cross join gate
  left join latest on true;
$$;

create function platform_private.read_recovery_provenance()
returns table (
  evidence_id uuid,
  provenance_kind text,
  promotion_id uuid,
  artifact_id uuid,
  artifact_digest bytea,
  source_revision text,
  environment text,
  promoted_at timestamptz,
  promotion_expires_at timestamptz,
  provenance_valid boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    evidence.id,
    evidence.provenance_kind,
    evidence.promotion_id,
    evidence.artifact_id,
    evidence.artifact_digest,
    evidence.source_revision,
    evidence.environment,
    promotion.promoted_at,
    promotion.expires_at,
    evidence.provenance_kind = 'promoted_artifact'
      and promotion.id is not null
      and promotion.environment = 'production'
      and promotion.promoted_at <= evidence.verified_at
      and promotion.expires_at >= evidence.expires_at
      and promotion.expires_at > clock_timestamp()
  from platform_private.recovery_verification_evidence as evidence
  left join platform_private.recovery_verification_promotions as promotion
    on promotion.id = evidence.promotion_id
   and promotion.artifact_id = evidence.artifact_id
   and promotion.artifact_digest = evidence.artifact_digest
   and promotion.source_revision = evidence.source_revision
   and promotion.environment = evidence.environment
  order by evidence.verified_at desc, evidence.created_at desc, evidence.id desc
  limit 1;
$$;

create or replace function platform_private.record_recovery_verification(
  p_restore_epoch bigint,
  p_pitr_supported boolean,
  p_pitr_window_seconds bigint,
  p_measured_rpo_seconds bigint,
  p_measured_rto_seconds bigint,
  p_integrity_verified boolean,
  p_rls_verified boolean,
  p_rpc_verified boolean,
  p_idempotency_outbox_job_verified boolean,
  p_object_verified boolean,
  p_provider_webhook_verified boolean,
  p_public_projection_verified boolean,
  p_verified_at timestamptz default clock_timestamp(),
  p_expires_at timestamptz default (clock_timestamp() + interval '24 hours'),
  p_evidence_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns table (evidence_id uuid, protected_writes_allowed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  evidence_decision platform_private.audit_decision;
  evidence_reason text;
begin
  if p_restore_epoch is null
     or p_restore_epoch < 1
     or p_pitr_supported is null
     or (not p_pitr_supported and (
       p_pitr_window_seconds is not null
       or p_measured_rpo_seconds is not null
       or p_measured_rto_seconds is not null
     ))
     or (p_pitr_window_seconds is not null and p_pitr_window_seconds < 0)
     or (p_measured_rpo_seconds is not null and p_measured_rpo_seconds < 0)
     or (p_measured_rto_seconds is not null and p_measured_rto_seconds < 0)
     or p_integrity_verified is null
     or p_rls_verified is null
     or p_rpc_verified is null
     or p_idempotency_outbox_job_verified is null
     or p_object_verified is null
     or p_provider_webhook_verified is null
     or p_public_projection_verified is null
     or p_verified_at is null
     or p_expires_at is null
     or p_verified_at > now_at
     or p_expires_at <= p_verified_at
     or p_evidence_id is null
     or p_correlation_id is null
     or p_acting_party_id is null then
    raise exception 'invalid recovery verification evidence' using errcode = '22023';
  end if;
  if p_pitr_supported
     and (p_pitr_window_seconds is null
       or p_measured_rpo_seconds is null
       or p_measured_rto_seconds is null) then
    raise exception 'supported PITR evidence requires RPO and RTO measurements' using errcode = '22023';
  end if;

  -- This legacy-shaped writer records a claim for diagnostics only. It has no
  -- promotion binding, so the protected-write gate can never use this row.
  insert into platform_private.recovery_verification_evidence (
    id, restore_epoch, pitr_supported, pitr_window_seconds,
    measured_rpo_seconds, measured_rto_seconds, verified_at, expires_at,
    integrity_verified, rls_verified, rpc_verified,
    idempotency_outbox_job_verified, object_verified,
    provider_webhook_verified, public_projection_verified,
    provenance_kind, promotion_id, artifact_id, artifact_digest,
    source_revision, environment, created_at
  ) values (
    p_evidence_id, p_restore_epoch, p_pitr_supported, p_pitr_window_seconds,
    p_measured_rpo_seconds, p_measured_rto_seconds, p_verified_at, p_expires_at,
    p_integrity_verified, p_rls_verified, p_rpc_verified,
    p_idempotency_outbox_job_verified, p_object_verified,
    p_provider_webhook_verified, p_public_projection_verified,
    'unavailable', null, null, null, null, null, now_at
  );

  if not p_pitr_supported then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'PITR_UNAVAILABLE';
  elsif p_pitr_window_seconds is null
     or p_pitr_window_seconds < 604800
     or p_measured_rpo_seconds is null
     or p_measured_rto_seconds is null
     or p_measured_rpo_seconds > 120
     or p_measured_rto_seconds > 14400 then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_METRICS_UNVERIFIED';
  elsif not p_integrity_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'INTEGRITY_CHECK_FAILED';
  elsif not p_rls_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RLS_CHECK_FAILED';
  elsif not p_rpc_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RPC_CHECK_FAILED';
  elsif not p_idempotency_outbox_job_verified
     or not p_object_verified
     or not p_provider_webhook_verified
     or not p_public_projection_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_VERIFICATION_FAILED';
  else
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_PROVENANCE_UNVERIFIED';
  end if;
  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'recovery.verification.recorded', p_actor_id, p_acting_party_id,
    'recovery_verification', p_evidence_id, evidence_decision,
    evidence_reason, p_correlation_id, now_at
  );

  evidence_id := p_evidence_id;
  protected_writes_allowed := false;
  return next;
end;
$$;

create function platform_private.record_promoted_recovery_verification(
  p_restore_epoch bigint,
  p_pitr_supported boolean,
  p_pitr_window_seconds bigint,
  p_measured_rpo_seconds bigint,
  p_measured_rto_seconds bigint,
  p_integrity_verified boolean,
  p_rls_verified boolean,
  p_rpc_verified boolean,
  p_idempotency_outbox_job_verified boolean,
  p_object_verified boolean,
  p_provider_webhook_verified boolean,
  p_public_projection_verified boolean,
  p_promotion_id uuid,
  p_artifact_id uuid,
  p_artifact_digest bytea,
  p_source_revision text,
  p_environment text,
  p_verified_at timestamptz default clock_timestamp(),
  p_expires_at timestamptz default (clock_timestamp() + interval '24 hours'),
  p_evidence_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns table (evidence_id uuid, protected_writes_allowed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  normalized_environment text := pg_catalog.lower(pg_catalog.btrim(p_environment));
  promotion_row platform_private.recovery_verification_promotions;
  evidence_decision platform_private.audit_decision;
  evidence_reason text;
  gate boolean;
begin
  if p_restore_epoch is null
     or p_restore_epoch < 1
     or p_pitr_supported is null
     or (not p_pitr_supported and (
       p_pitr_window_seconds is not null
       or p_measured_rpo_seconds is not null
       or p_measured_rto_seconds is not null
     ))
     or (p_pitr_window_seconds is not null and p_pitr_window_seconds < 0)
     or (p_measured_rpo_seconds is not null and p_measured_rpo_seconds < 0)
     or (p_measured_rto_seconds is not null and p_measured_rto_seconds < 0)
     or p_pitr_supported and (
       p_pitr_window_seconds is null
       or p_measured_rpo_seconds is null
       or p_measured_rto_seconds is null
     )
     or p_integrity_verified is null
     or p_rls_verified is null
     or p_rpc_verified is null
     or p_idempotency_outbox_job_verified is null
     or p_object_verified is null
     or p_provider_webhook_verified is null
     or p_public_projection_verified is null
     or p_promotion_id is null
     or p_artifact_id is null
     or p_artifact_digest is null
     or pg_catalog.octet_length(p_artifact_digest) <> 32
     or p_source_revision is null
     or p_source_revision <> pg_catalog.btrim(p_source_revision)
     or pg_catalog.length(p_source_revision) not between 1 and 128
     or p_source_revision !~ '^[A-Za-z0-9._:/-]+$'
     or p_environment is null
     or p_environment <> normalized_environment
     or normalized_environment <> 'production'
     or p_verified_at is null
     or p_expires_at is null
     or p_verified_at > now_at
     or p_expires_at <= p_verified_at
     or p_evidence_id is null
     or p_correlation_id is null
     or p_actor_id is not null
     or p_acting_party_id is null
     or p_acting_party_id <> '00000000-0000-0000-0000-000000000001'::uuid then
    raise exception 'invalid promoted recovery verification evidence' using errcode = '22023';
  end if;

  select * into promotion_row
  from platform_private.recovery_verification_promotions as promotion
  where promotion.id = p_promotion_id
    and promotion.artifact_id = p_artifact_id
    and promotion.artifact_digest = p_artifact_digest
    and promotion.source_revision = p_source_revision
    and promotion.environment = normalized_environment
    and promotion.promoted_at <= p_verified_at
    and promotion.expires_at >= p_expires_at
    and promotion.expires_at > now_at
  for share;
  if not found or promotion_row.id is null then
    raise exception 'recovery verification requires an externally promoted artifact binding' using errcode = 'P0001';
  end if;

  insert into platform_private.recovery_verification_evidence (
    id, restore_epoch, pitr_supported, pitr_window_seconds,
    measured_rpo_seconds, measured_rto_seconds, verified_at, expires_at,
    integrity_verified, rls_verified, rpc_verified,
    idempotency_outbox_job_verified, object_verified,
    provider_webhook_verified, public_projection_verified,
    provenance_kind, promotion_id, artifact_id, artifact_digest,
    source_revision, environment, created_at
  ) values (
    p_evidence_id, p_restore_epoch, p_pitr_supported, p_pitr_window_seconds,
    p_measured_rpo_seconds, p_measured_rto_seconds, p_verified_at, p_expires_at,
    p_integrity_verified, p_rls_verified, p_rpc_verified,
    p_idempotency_outbox_job_verified, p_object_verified,
    p_provider_webhook_verified, p_public_projection_verified,
    'promoted_artifact', p_promotion_id, p_artifact_id, p_artifact_digest,
    p_source_revision, normalized_environment, now_at
  );

  if not p_pitr_supported then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'PITR_UNAVAILABLE';
  elsif p_pitr_window_seconds < 604800
     or p_measured_rpo_seconds > 120
     or p_measured_rto_seconds > 14400 then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_METRICS_UNVERIFIED';
  elsif not p_integrity_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'INTEGRITY_CHECK_FAILED';
  elsif not p_rls_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RLS_CHECK_FAILED';
  elsif not p_rpc_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RPC_CHECK_FAILED';
  elsif not p_idempotency_outbox_job_verified
     or not p_object_verified
     or not p_provider_webhook_verified
     or not p_public_projection_verified then
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_VERIFICATION_FAILED';
  else
    evidence_decision := 'completed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_VERIFICATION_RECORDED';
  end if;
  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'recovery.verification.recorded', p_actor_id, p_acting_party_id,
    'recovery_verification', p_evidence_id, evidence_decision,
    evidence_reason, p_correlation_id, now_at
  );

  gate := platform_private.protected_writes_allowed();
  evidence_id := p_evidence_id;
  protected_writes_allowed := gate;
  return next;
end;
$$;

create function platform_api.read_recovery_provenance()
returns table (
  evidence_id uuid,
  provenance_kind text,
  promotion_id uuid,
  artifact_id uuid,
  artifact_digest bytea,
  source_revision text,
  environment text,
  promoted_at timestamptz,
  promotion_expires_at timestamptz,
  provenance_valid boolean
)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.read_recovery_provenance();
$$;

create function platform_api.record_promoted_recovery_verification(
  p_restore_epoch bigint,
  p_pitr_supported boolean,
  p_pitr_window_seconds bigint,
  p_measured_rpo_seconds bigint,
  p_measured_rto_seconds bigint,
  p_integrity_verified boolean,
  p_rls_verified boolean,
  p_rpc_verified boolean,
  p_idempotency_outbox_job_verified boolean,
  p_object_verified boolean,
  p_provider_webhook_verified boolean,
  p_public_projection_verified boolean,
  p_promotion_id uuid,
  p_artifact_id uuid,
  p_artifact_digest bytea,
  p_source_revision text,
  p_environment text,
  p_verified_at timestamptz default clock_timestamp(),
  p_expires_at timestamptz default (clock_timestamp() + interval '24 hours'),
  p_evidence_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns table (evidence_id uuid, protected_writes_allowed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.record_promoted_recovery_verification(
    p_restore_epoch, p_pitr_supported, p_pitr_window_seconds,
    p_measured_rpo_seconds, p_measured_rto_seconds, p_integrity_verified,
    p_rls_verified, p_rpc_verified, p_idempotency_outbox_job_verified,
    p_object_verified, p_provider_webhook_verified, p_public_projection_verified,
    p_promotion_id, p_artifact_id, p_artifact_digest, p_source_revision,
    p_environment, p_verified_at, p_expires_at, p_evidence_id,
    p_correlation_id, p_actor_id, p_acting_party_id
  );
$$;

revoke all on function platform_private.guard_recovery_verification_promotions()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.read_recovery_provenance()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.record_promoted_recovery_verification(
  bigint, boolean, bigint, bigint, bigint, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, uuid, uuid, bytea, text, text,
  timestamptz, timestamptz, uuid, uuid, uuid, uuid
)
  from public, anon, authenticated;
grant execute on function platform_private.read_recovery_provenance() to service_role;
grant execute on function platform_private.record_promoted_recovery_verification(
  bigint, boolean, bigint, bigint, bigint, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, uuid, uuid, bytea, text, text,
  timestamptz, timestamptz, uuid, uuid, uuid, uuid
) to service_role;

revoke all on function platform_api.read_recovery_provenance()
  from public, anon, authenticated, service_role;
revoke all on function platform_api.record_promoted_recovery_verification(
  bigint, boolean, bigint, bigint, bigint, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, uuid, uuid, bytea, text, text,
  timestamptz, timestamptz, uuid, uuid, uuid, uuid
)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.read_recovery_provenance() to service_role;
grant execute on function platform_api.record_promoted_recovery_verification(
  bigint, boolean, bigint, bigint, bigint, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, uuid, uuid, bytea, text, text,
  timestamptz, timestamptz, uuid, uuid, uuid, uuid
) to service_role;


commit;

-- Rollback policy: forward-only compensating migration. Authority and provider
-- evidence are immutable and are retained for audit and replay review.
