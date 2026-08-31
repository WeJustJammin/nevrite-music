begin;

create type platform_private.object_state as enum
  ('pending_upload', 'uploaded', 'verifying', 'ready', 'rejected', 'quarantined');

create type platform_private.upload_intent_state as enum
  ('issued', 'consumed', 'expired', 'cancelled');

create function platform_private.valid_object_key(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
    and value = pg_catalog.btrim(value)
    and pg_catalog.length(value) between 1 and 1024
    and value !~ '[[:cntrl:]]'
    and value !~ '(^|/)\.\.(/|$)'
    and value !~ '(^/|//)';
$$;

create function platform_private.valid_media_type_list(value text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item text;
begin
  if value is null or pg_catalog.cardinality(value) < 1 then
    return false;
  end if;
  foreach item in array value loop
    if item is null
       or item <> pg_catalog.lower(pg_catalog.btrim(item))
       or item !~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$' then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create table platform_private.object_records (
  id uuid primary key default extensions.gen_random_uuid(),
  bucket text not null check (bucket = pg_catalog.btrim(bucket) and pg_catalog.length(bucket) between 1 and 63 and bucket !~ '[[:cntrl:]]'),
  object_key text not null check (platform_private.valid_object_key(object_key)),
  owner_party_id uuid not null,
  purpose text not null check (purpose = pg_catalog.btrim(purpose) and purpose ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  media_type text not null check (media_type = pg_catalog.lower(pg_catalog.btrim(media_type)) and media_type ~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$'),
  byte_size bigint not null check (byte_size >= 0),
  checksum bytea not null check (pg_catalog.octet_length(checksum) = 32),
  state platform_private.object_state not null default 'pending_upload',
  retention_class text not null check (retention_class = pg_catalog.btrim(retention_class) and retention_class ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  unique (bucket, object_key)
);

create table platform_private.upload_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  object_id uuid not null references platform_private.object_records(id),
  actor_id uuid not null,
  max_bytes bigint not null check (max_bytes > 0),
  allowed_media_types text[] not null check (platform_private.valid_media_type_list(allowed_media_types)),
  expires_at timestamptz not null,
  state platform_private.upload_intent_state not null default 'issued',
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (expires_at <= created_at + interval '15 minutes')
);

comment on table platform_private.object_records is
  'Canonical object metadata. Storage bytes are unusable unless a governing row reaches ready.';
comment on table platform_private.upload_intents is
  'Actor-bound, short-lived upload authorization. Signed transfer URLs are returned once and never persisted.';
comment on column platform_private.object_records.object_key is
  'One server-generated normalized Storage key; clients cannot choose traversal or control characters.';

alter table platform_private.object_records enable row level security;
alter table platform_private.object_records force row level security;
alter table platform_private.upload_intents enable row level security;
alter table platform_private.upload_intents force row level security;

revoke all on table platform_private.object_records, platform_private.upload_intents
from public, anon, authenticated, service_role;
grant usage on schema platform_private to service_role;

create unique index object_records_bucket_key_idx
  on platform_private.object_records (bucket, object_key);
create index object_records_owner_purpose_state_idx
  on platform_private.object_records (owner_party_id, purpose, state);
create index object_records_retention_state_idx
  on platform_private.object_records (retention_class, state);
create index object_records_checksum_idx
  on platform_private.object_records (checksum)
  where state in ('uploaded', 'verifying', 'ready');
create unique index upload_intents_live_object_idx
  on platform_private.upload_intents (object_id)
  where state = 'issued';
create index upload_intents_actor_expiry_idx
  on platform_private.upload_intents (actor_id, expires_at);
create index upload_intents_expiry_idx
  on platform_private.upload_intents (expires_at)
  where state = 'issued';

create function platform_private.guard_object_records() returns trigger
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

create function platform_private.guard_upload_intents() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'upload intents are append-only at the row boundary' using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.object_id is distinct from old.object_id
     or new.actor_id is distinct from old.actor_id
     or new.max_bytes is distinct from old.max_bytes
     or new.allowed_media_types is distinct from old.allowed_media_types
     or new.expires_at is distinct from old.expires_at
     or new.created_at is distinct from old.created_at then
    raise exception 'upload intent identity and constraints are immutable' using errcode = 'P0001';
  end if;
  if old.state <> 'issued'::platform_private.upload_intent_state
     and new.state is distinct from old.state then
    raise exception 'terminal upload intent state is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'issued'::platform_private.upload_intent_state
     and new.state not in ('issued'::platform_private.upload_intent_state, 'consumed'::platform_private.upload_intent_state, 'expired'::platform_private.upload_intent_state, 'cancelled'::platform_private.upload_intent_state) then
    raise exception 'invalid upload intent state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger object_records_guard before update or delete on platform_private.object_records
for each row execute function platform_private.guard_object_records();
create trigger upload_intents_guard before update or delete on platform_private.upload_intents
for each row execute function platform_private.guard_upload_intents();

create function platform_private.create_upload_intent(
  p_actor_id uuid,
  p_owner_party_id uuid,
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
  p_object_id uuid default extensions.gen_random_uuid(),
  p_intent_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid()
)
returns table (intent_id uuid, object_id uuid, version bigint, expires_at timestamptz, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  normalized_media_type text := pg_catalog.lower(pg_catalog.btrim(p_media_type));
  idempotency_row platform_private.idempotency_records;
  existing_intent platform_private.upload_intents;
begin
  if p_actor_id is null
     or p_owner_party_id is null
     or p_object_id is null
     or p_intent_id is null
     or p_correlation_id is null
     or p_bucket is null
     or p_bucket <> pg_catalog.btrim(p_bucket)
     or pg_catalog.length(p_bucket) not between 1 and 63
     or p_object_key is null
     or not platform_private.valid_object_key(p_object_key)
     or p_purpose is null
     or p_purpose <> pg_catalog.btrim(p_purpose)
     or p_purpose !~ '^[a-z0-9][a-z0-9._-]{0,63}$'
     or normalized_media_type !~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$'
     or p_byte_size is null
     or p_byte_size < 1
     or p_max_bytes is null
     or p_max_bytes < p_byte_size
     or p_checksum is null
     or pg_catalog.octet_length(p_checksum) <> 32
     or p_retention_class is null
     or p_retention_class <> pg_catalog.btrim(p_retention_class)
     or p_retention_class !~ '^[a-z0-9][a-z0-9._-]{0,63}$'
     or not platform_private.valid_media_type_list(p_allowed_media_types)
     or not (normalized_media_type = any (p_allowed_media_types))
     or p_expires_at is null
     or p_expires_at <= now_at
     or p_expires_at > now_at + interval '15 minutes'
     or p_idempotency_key_hash is null
     or pg_catalog.octet_length(p_idempotency_key_hash) <> 32
     or p_request_hash is null
     or pg_catalog.octet_length(p_request_hash) <> 32 then
    raise exception 'invalid upload intent request' using errcode = '22023';
  end if;

  insert into platform_private.idempotency_records (
    actor_id, operation, key_hash, request_hash, state, created_at, expires_at
  ) values (
    p_actor_id, 'platform.upload-intent.create', p_idempotency_key_hash, p_request_hash,
    'reserved', now_at, now_at + interval '30 days'
  ) on conflict (actor_id, operation, key_hash) do nothing;

  select * into idempotency_row
  from platform_private.idempotency_records
  where actor_id = p_actor_id
    and operation = 'platform.upload-intent.create'
    and key_hash = p_idempotency_key_hash
  for update;

  if idempotency_row.request_hash <> p_request_hash then
    raise exception 'idempotency request hash mismatch' using errcode = 'P0001';
  end if;

  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    select * into existing_intent
    from platform_private.upload_intents
    where id = pg_catalog.regexp_replace(idempotency_row.response_ref->>'resourceRef', '^.*/', '')::uuid;
    if not found then
      raise exception 'completed upload idempotency result has no intent' using errcode = 'P0001';
    end if;
    intent_id := existing_intent.id;
    object_id := existing_intent.object_id;
    select object_records.version into version
    from platform_private.object_records
    where object_records.id = existing_intent.object_id;
    expires_at := existing_intent.expires_at;
    replayed := true;
    return next;
    return;
  end if;

  if idempotency_row.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
    set state = 'reserved', response_ref = null
    where id = idempotency_row.id;
  end if;

  insert into platform_private.object_records (
    id, bucket, object_key, owner_party_id, purpose, media_type, byte_size,
    checksum, state, retention_class, version, created_at
  ) values (
    p_object_id, p_bucket, p_object_key, p_owner_party_id, p_purpose, normalized_media_type,
    p_byte_size, p_checksum, 'pending_upload', p_retention_class, 1, now_at
  );

  insert into platform_private.upload_intents (
    id, object_id, actor_id, max_bytes, allowed_media_types, expires_at, state, created_at
  ) values (
    p_intent_id, p_object_id, p_actor_id, p_max_bytes, p_allowed_media_types,
    p_expires_at, 'issued', now_at
  );

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at
  ) values (
    'upload.intent.issued', p_actor_id, p_owner_party_id, 'upload_intent', p_intent_id,
    'allowed', 'UPLOAD_INTENT_ISSUED', p_correlation_id, now_at
  );

  update platform_private.idempotency_records
  set state = 'completed',
      response_ref = jsonb_build_object(
        'status', 201,
        'resourceRef', format('/api/v1/upload-intents/%s', p_intent_id)
      )
  where id = idempotency_row.id;

  intent_id := p_intent_id;
  object_id := p_object_id;
  version := 1;
  expires_at := p_expires_at;
  replayed := false;
  return next;
end;
$$;

create or replace function platform_api.create_upload_intent(
  p_actor_id uuid,
  p_owner_party_id uuid,
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
  p_object_id uuid default extensions.gen_random_uuid(),
  p_intent_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid()
)
returns table (intent_id uuid, object_id uuid, version bigint, expires_at timestamptz, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.create_upload_intent(
    p_actor_id, p_owner_party_id, p_bucket, p_object_key, p_purpose, p_media_type,
    p_byte_size, p_checksum, p_retention_class, p_max_bytes, p_allowed_media_types,
    p_expires_at, p_idempotency_key_hash, p_request_hash, p_object_id, p_intent_id,
    p_correlation_id
  );
$$;

revoke all on function platform_private.valid_object_key(text) from public, anon, authenticated, service_role;
revoke all on function platform_private.valid_media_type_list(text[]) from public, anon, authenticated, service_role;
revoke all on function platform_private.create_upload_intent(uuid, uuid, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function platform_api.create_upload_intent(uuid, uuid, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function platform_private.create_upload_intent(uuid, uuid, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.create_upload_intent(uuid, uuid, text, text, text, text, bigint, bytea, text, bigint, text[], timestamptz, bytea, bytea, uuid, uuid, uuid) to service_role;

commit;

-- Rollback policy: forward-only compensating migration. Object metadata and audit
-- evidence are never dropped or rewritten by an automated rollback.
