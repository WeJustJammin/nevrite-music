begin;

create type platform_private.provider_operation_state as enum
  ('planned', 'pending', 'confirmed', 'failed', 'manual_review');

create type platform_private.webhook_receipt_state as enum
  ('received', 'accepted', 'duplicate', 'rejected', 'processed', 'failed', 'manual_review');

create table platform_private.provider_operations (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null check (provider = pg_catalog.lower(pg_catalog.btrim(provider)) and pg_catalog.length(provider) between 1 and 64 and provider ~ '^[a-z][a-z0-9._-]*$'),
  operation_type text not null check (operation_type = pg_catalog.lower(pg_catalog.btrim(operation_type)) and pg_catalog.length(operation_type) between 1 and 128 and operation_type ~ '^[a-z][a-z0-9._-]*$'),
  actor_id uuid not null,
  state platform_private.provider_operation_state not null default 'planned',
  intent_hash bytea not null check (pg_catalog.octet_length(intent_hash) = 32),
  provider_ref text check (provider_ref is null or (provider_ref = pg_catalog.btrim(provider_ref) and pg_catalog.length(provider_ref) between 1 and 256 and provider_ref !~ '[[:cntrl:]]')),
  last_attempt_at timestamptz,
  reconciliation_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  correlation_id uuid not null,
  causation_id uuid,
  provider_idempotency_key_hash bytea not null check (pg_catalog.octet_length(provider_idempotency_key_hash) = 32),
  attempts jsonb not null default '[]'::jsonb check (platform_private.valid_attempts(attempts)),
  unique (provider, provider_idempotency_key_hash)
);

create table platform_private.webhook_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null check (provider = pg_catalog.lower(pg_catalog.btrim(provider)) and pg_catalog.length(provider) between 1 and 64 and provider ~ '^[a-z][a-z0-9._-]*$'),
  external_event_id text not null check (external_event_id = pg_catalog.btrim(external_event_id) and pg_catalog.length(external_event_id) between 1 and 256 and external_event_id !~ '[[:cntrl:]]'),
  payload_digest bytea not null check (pg_catalog.octet_length(payload_digest) = 32),
  signature_verified_at timestamptz,
  received_at timestamptz not null default now(),
  state platform_private.webhook_receipt_state not null default 'received',
  operation_id uuid references platform_private.provider_operations(id),
  attempts jsonb not null default '[]'::jsonb check (platform_private.valid_attempts(attempts)),
  unique (provider, external_event_id),
  check (state not in ('accepted', 'processed', 'failed') or signature_verified_at is not null)
);

comment on table platform_private.provider_operations is
  'Canonical provider intent and reconciliation evidence. Provider payloads and credentials never persist here.';
comment on table platform_private.webhook_receipts is
  'Verified webhook identity/digest evidence only. Raw request bytes are discarded after verification and normalization.';
comment on column platform_private.provider_operations.intent_hash is
  'SHA-256 hash of the allowlisted provider intent; immutable before and after the provider call.';
comment on column platform_private.webhook_receipts.payload_digest is
  'SHA-256 digest used for provider/event deduplication and conflicting-delivery detection.';

alter table platform_private.provider_operations enable row level security;
alter table platform_private.provider_operations force row level security;
alter table platform_private.webhook_receipts enable row level security;
alter table platform_private.webhook_receipts force row level security;

revoke all on table platform_private.provider_operations, platform_private.webhook_receipts
from public, anon, authenticated, service_role;
grant usage on schema platform_private to service_role;

create unique index provider_operations_provider_ref_idx
  on platform_private.provider_operations (provider, operation_type, provider_ref)
  where provider_ref is not null;
create index provider_operations_state_attempt_idx
  on platform_private.provider_operations (state, last_attempt_at);
create index provider_operations_actor_created_idx
  on platform_private.provider_operations (actor_id, created_at desc);
create index webhook_receipts_operation_received_idx
  on platform_private.webhook_receipts (operation_id, received_at);
create index webhook_receipts_provider_state_received_idx
  on platform_private.webhook_receipts (provider, state, received_at);

create function platform_private.guard_provider_operations() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'provider operations are append-only at the row boundary' using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.provider is distinct from old.provider
     or new.operation_type is distinct from old.operation_type
     or new.actor_id is distinct from old.actor_id
     or new.intent_hash is distinct from old.intent_hash
     or new.provider_idempotency_key_hash is distinct from old.provider_idempotency_key_hash
     or new.created_at is distinct from old.created_at
     or new.correlation_id is distinct from old.correlation_id
     or new.causation_id is distinct from old.causation_id then
    raise exception 'provider operation identity and intent are immutable' using errcode = 'P0001';
  end if;
  if old.provider_ref is not null and new.provider_ref is distinct from old.provider_ref then
    raise exception 'provider reference evidence is immutable once recorded' using errcode = 'P0001';
  end if;
  if new.version < old.version then
    raise exception 'provider operation version cannot decrease' using errcode = 'P0001';
  end if;
  if old.state in ('confirmed'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     and new.state is distinct from old.state then
    raise exception 'terminal provider operation state is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'planned'::platform_private.provider_operation_state
       and new.state not in ('planned'::platform_private.provider_operation_state, 'pending'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     or old.state = 'pending'::platform_private.provider_operation_state
       and new.state not in ('pending'::platform_private.provider_operation_state, 'confirmed'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     or old.state in ('confirmed'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
       and new.state is distinct from old.state then
    raise exception 'invalid provider operation state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function platform_private.guard_webhook_receipts() returns trigger
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
  if old.state in ('duplicate'::platform_private.webhook_receipt_state, 'rejected'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
     and new.state is distinct from old.state then
    raise exception 'terminal webhook receipt state is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'received'::platform_private.webhook_receipt_state
       and new.state not in ('received'::platform_private.webhook_receipt_state, 'accepted'::platform_private.webhook_receipt_state, 'duplicate'::platform_private.webhook_receipt_state, 'rejected'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
     or old.state = 'accepted'::platform_private.webhook_receipt_state
       and new.state not in ('accepted'::platform_private.webhook_receipt_state, 'processed'::platform_private.webhook_receipt_state, 'failed'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
     or old.state = 'failed'::platform_private.webhook_receipt_state
       and new.state not in ('failed'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state, 'processed'::platform_private.webhook_receipt_state)
     or old.state in ('duplicate'::platform_private.webhook_receipt_state, 'rejected'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
       and new.state is distinct from old.state then
    raise exception 'invalid webhook receipt state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger provider_operations_guard before update or delete on platform_private.provider_operations
for each row execute function platform_private.guard_provider_operations();
create trigger webhook_receipts_guard before update or delete on platform_private.webhook_receipts
for each row execute function platform_private.guard_webhook_receipts();

create function platform_private.create_provider_operation(
  p_provider text,
  p_operation_type text,
  p_actor_id uuid,
  p_intent_hash bytea,
  p_provider_idempotency_key_hash bytea,
  p_correlation_id uuid,
  p_acting_party_id uuid default null,
  p_causation_id uuid default null,
  p_operation_id uuid default extensions.gen_random_uuid()
)
returns table (operation_id uuid, version bigint, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  normalized_provider text := pg_catalog.lower(pg_catalog.btrim(p_provider));
  normalized_operation_type text := pg_catalog.lower(pg_catalog.btrim(p_operation_type));
  idempotency_operation text;
  idempotency_row platform_private.idempotency_records;
  existing_operation platform_private.provider_operations;
  acting_party uuid := coalesce(p_acting_party_id, p_actor_id);
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
     or acting_party is null
     or p_correlation_id is null
     or p_operation_id is null
     or p_intent_hash is null
     or pg_catalog.octet_length(p_intent_hash) <> 32
     or p_provider_idempotency_key_hash is null
     or pg_catalog.octet_length(p_provider_idempotency_key_hash) <> 32 then
    raise exception 'invalid provider operation request' using errcode = '22023';
  end if;

  idempotency_operation := 'provider.' || normalized_provider || '.' || normalized_operation_type;
  if pg_catalog.length(idempotency_operation) > 128 then
    raise exception 'invalid provider operation request' using errcode = '22023';
  end if;

  insert into platform_private.idempotency_records (
    actor_id, operation, key_hash, request_hash, state, created_at, expires_at
  ) values (
    p_actor_id, idempotency_operation, p_provider_idempotency_key_hash, p_intent_hash,
    'reserved', now_at, now_at + interval '30 days'
  ) on conflict (actor_id, operation, key_hash) do nothing;

  select * into idempotency_row
  from platform_private.idempotency_records
  where actor_id = p_actor_id
    and operation = idempotency_operation
    and key_hash = p_provider_idempotency_key_hash
  for update;

  if idempotency_row.request_hash <> p_intent_hash then
    raise exception 'provider idempotency intent hash mismatch' using errcode = 'P0001';
  end if;

  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    select * into existing_operation
    from platform_private.provider_operations
    where id = pg_catalog.regexp_replace(idempotency_row.response_ref->>'resourceRef', '^.*/', '')::uuid;
    if not found then
      raise exception 'completed provider idempotency result has no operation' using errcode = 'P0001';
    end if;
    operation_id := existing_operation.id;
    version := existing_operation.version;
    replayed := true;
    return next;
    return;
  end if;

  if idempotency_row.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
    set state = 'reserved', response_ref = null
    where id = idempotency_row.id;
  end if;

  insert into platform_private.provider_operations (
    id, provider, operation_type, actor_id, state, intent_hash, version, created_at,
    correlation_id, causation_id, provider_idempotency_key_hash
  ) values (
    p_operation_id, normalized_provider, normalized_operation_type, p_actor_id, 'planned',
    p_intent_hash, 1, now_at, p_correlation_id, p_causation_id, p_provider_idempotency_key_hash
  );

  insert into platform_private.outbox_events (
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, causation_id, payload, occurred_at
  ) values (
    'provider.operation.requested', 1, 'provider_operation', p_operation_id, 1,
    p_correlation_id, p_causation_id,
    jsonb_build_object('operationId', p_operation_id), now_at
  );

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at
  ) values (
    'provider.operation.planned', p_actor_id, acting_party, 'provider_operation', p_operation_id,
    'allowed', 'PROVIDER_OPERATION_PLANNED', p_correlation_id, now_at
  );

  update platform_private.idempotency_records
  set state = 'completed',
      response_ref = jsonb_build_object(
        'status', 202,
        'resourceRef', format('/api/v1/provider-operations/%s', p_operation_id)
      )
  where id = idempotency_row.id;

  operation_id := p_operation_id;
  version := 1;
  replayed := false;
  return next;
end;
$$;

create function platform_private.record_webhook_receipt(
  p_provider text,
  p_external_event_id text,
  p_payload_digest bytea,
  p_signature_verified_at timestamptz,
  p_operation_id uuid default null,
  p_receipt_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns table (receipt_id uuid, accepted boolean, duplicate boolean, conflict boolean, state platform_private.webhook_receipt_state, operation_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  normalized_provider text := pg_catalog.lower(pg_catalog.btrim(p_provider));
  existing_receipt platform_private.webhook_receipts;
  inserted_id uuid;
  operation_provider text;
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
     or p_signature_verified_at is null
     or p_signature_verified_at > now_at + interval '5 minutes'
     or p_receipt_id is null
     or p_correlation_id is null
     or p_acting_party_id is null then
    raise exception 'invalid verified webhook receipt request' using errcode = '22023';
  end if;

  if p_operation_id is not null then
    select provider into operation_provider
    from platform_private.provider_operations
    where id = p_operation_id;
    if operation_provider is null or operation_provider <> normalized_provider then
      raise exception 'invalid verified webhook receipt operation' using errcode = '22023';
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
    insert into platform_private.outbox_events (
      event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
      correlation_id, payload, occurred_at
    ) values (
      'webhook.accepted', 1, 'webhook_receipt', p_receipt_id, 1,
      p_correlation_id, jsonb_build_object('receiptId', p_receipt_id), now_at
    );
    insert into audit_private.audit_events (
      action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at
    ) values (
      'webhook.receipt.accepted', p_actor_id, p_acting_party_id, 'webhook_receipt', p_receipt_id,
      'allowed', 'WEBHOOK_RECEIPT_ACCEPTED', p_correlation_id, now_at
    );
    receipt_id := p_receipt_id;
    accepted := true;
    duplicate := false;
    conflict := false;
    state := 'accepted'::platform_private.webhook_receipt_state;
    operation_id := p_operation_id;
    return next;
    return;
  end if;

  select * into existing_receipt
  from platform_private.webhook_receipts
  where provider = normalized_provider and external_event_id = p_external_event_id
  for update;

  if existing_receipt.payload_digest = p_payload_digest then
    receipt_id := existing_receipt.id;
    accepted := existing_receipt.state in ('accepted'::platform_private.webhook_receipt_state, 'processed'::platform_private.webhook_receipt_state, 'failed'::platform_private.webhook_receipt_state);
    duplicate := true;
    conflict := false;
    state := existing_receipt.state;
    operation_id := existing_receipt.operation_id;
    return next;
    return;
  end if;

  update platform_private.webhook_receipts receipt
  set state = 'manual_review'
  where receipt.id = existing_receipt.id
    and receipt.state <> 'manual_review'::platform_private.webhook_receipt_state;

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at
  ) values (
    'webhook.receipt.digest_conflict', p_actor_id, p_acting_party_id, 'webhook_receipt', existing_receipt.id,
    'failed', 'WEBHOOK_DIGEST_CONFLICT', p_correlation_id, now_at
  );
  receipt_id := existing_receipt.id;
  accepted := false;
  duplicate := false;
  conflict := true;
  state := 'manual_review'::platform_private.webhook_receipt_state;
  operation_id := existing_receipt.operation_id;
  return next;
end;
$$;

create function platform_private.apply_provider_operation_outcome(
  p_operation_id uuid,
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
  now_at timestamptz := clock_timestamp();
  started_at timestamptz := coalesce(p_attempt_started_at, now_at);
  ended_at timestamptz := coalesce(p_attempt_ended_at, now_at);
  current_operation platform_private.provider_operations;
  target_state platform_private.provider_operation_state := p_next_state;
  outcome text;
  reason_code text;
  decision platform_private.audit_decision;
  affected integer;
begin
  if p_operation_id is null
     or p_expected_version is null
     or p_expected_version < 1
     or p_next_state is null
     or p_retryable is null
     or p_provider_ref is not null and (p_provider_ref <> pg_catalog.btrim(p_provider_ref) or pg_catalog.length(p_provider_ref) not between 1 and 256 or p_provider_ref ~ '[[:cntrl:]]')
     or p_error_code is not null and p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$'
     or started_at > ended_at then
    raise exception 'invalid provider operation outcome request' using errcode = '22023';
  end if;

  select * into current_operation
  from platform_private.provider_operations
  where id = p_operation_id
  for update;
  if not found or current_operation.version <> p_expected_version then
    return false;
  end if;

  if p_next_state = 'failed'::platform_private.provider_operation_state and p_retryable then
    target_state := 'pending'::platform_private.provider_operation_state;
  end if;
  if target_state = 'confirmed'::platform_private.provider_operation_state and p_provider_ref is null then
    raise exception 'confirmed provider operation requires provider evidence' using errcode = '22023';
  end if;
  if target_state <> 'confirmed'::platform_private.provider_operation_state and p_provider_ref is not null then
    raise exception 'provider reference is accepted only with confirmed evidence' using errcode = '22023';
  end if;
  if current_operation.provider_ref is not null
     and p_provider_ref is not null
     and current_operation.provider_ref <> p_provider_ref then
    raise exception 'provider reference evidence conflict' using errcode = 'P0001';
  end if;
  if target_state in ('failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     and p_error_code is null then
    raise exception 'terminal provider operation outcome requires an error code' using errcode = '22023';
  end if;
  if current_operation.state = 'planned'::platform_private.provider_operation_state
     and target_state not in ('pending'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     or current_operation.state = 'pending'::platform_private.provider_operation_state
     and target_state not in ('pending'::platform_private.provider_operation_state, 'confirmed'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     or current_operation.state in ('confirmed'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state)
     and target_state <> current_operation.state then
    raise exception 'invalid provider operation outcome transition' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(current_operation.attempts) >= 32 then
    raise exception 'provider operation attempt evidence limit reached' using errcode = '22023';
  end if;

  outcome := case
    when target_state = 'pending'::platform_private.provider_operation_state then 'retryable'
    when target_state = 'confirmed'::platform_private.provider_operation_state then 'succeeded'
    else 'failed'
  end;
  reason_code := coalesce(p_error_code, 'PROVIDER_OPERATION_' || pg_catalog.upper(target_state::text));
  decision := case
    when target_state = 'confirmed'::platform_private.provider_operation_state then 'completed'::platform_private.audit_decision
    when target_state = 'pending'::platform_private.provider_operation_state then 'allowed'::platform_private.audit_decision
    else 'failed'::platform_private.audit_decision
  end;

  update platform_private.provider_operations
  set state = target_state,
      provider_ref = coalesce(p_provider_ref, provider_ref),
      last_attempt_at = case when target_state in ('pending'::platform_private.provider_operation_state, 'failed'::platform_private.provider_operation_state) then ended_at else last_attempt_at end,
      reconciliation_at = case when target_state in ('confirmed'::platform_private.provider_operation_state, 'manual_review'::platform_private.provider_operation_state) then ended_at else reconciliation_at end,
      version = version + 1,
      attempts = attempts || jsonb_build_array(jsonb_build_object(
        'attempt', pg_catalog.jsonb_array_length(attempts) + 1,
        'startedAt', started_at,
        'endedAt', ended_at,
        'outcome', outcome,
        'errorCode', p_error_code,
        'retryable', p_retryable
      ))
  where id = current_operation.id and version = current_operation.version;
  get diagnostics affected = row_count;
  if affected <> 1 then
    return false;
  end if;

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at
  ) values (
    'provider.operation.' || outcome, current_operation.actor_id, current_operation.actor_id,
    'provider_operation', current_operation.id, decision, reason_code, current_operation.correlation_id, ended_at
  );
  return true;
end;
$$;

create function platform_private.apply_webhook_receipt_outcome(
  p_receipt_id uuid,
  p_expected_state platform_private.webhook_receipt_state,
  p_next_state platform_private.webhook_receipt_state,
  p_operation_id uuid default null,
  p_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  current_receipt platform_private.webhook_receipts;
  operation_provider text;
  affected integer;
begin
  if p_receipt_id is null
     or p_expected_state is null
     or p_next_state is null
     or p_error_code is not null and p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
    raise exception 'invalid webhook receipt outcome request' using errcode = '22023';
  end if;
  select * into current_receipt
  from platform_private.webhook_receipts
  where id = p_receipt_id
  for update;
  if not found or current_receipt.state <> p_expected_state then
    return false;
  end if;
  if p_operation_id is not null then
    select provider into operation_provider
    from platform_private.provider_operations
    where id = p_operation_id;
    if operation_provider is null or operation_provider <> current_receipt.provider then
      raise exception 'invalid webhook receipt operation' using errcode = '22023';
    end if;
  end if;
  if p_next_state in ('accepted'::platform_private.webhook_receipt_state, 'processed'::platform_private.webhook_receipt_state, 'failed'::platform_private.webhook_receipt_state)
     and current_receipt.signature_verified_at is null then
    raise exception 'unverified webhook receipt cannot become trusted work' using errcode = '22023';
  end if;
  if current_receipt.state = 'received'::platform_private.webhook_receipt_state
       and p_next_state not in ('received'::platform_private.webhook_receipt_state, 'accepted'::platform_private.webhook_receipt_state, 'duplicate'::platform_private.webhook_receipt_state, 'rejected'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
     or current_receipt.state = 'accepted'::platform_private.webhook_receipt_state
       and p_next_state not in ('accepted'::platform_private.webhook_receipt_state, 'processed'::platform_private.webhook_receipt_state, 'failed'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
     or current_receipt.state = 'failed'::platform_private.webhook_receipt_state
       and p_next_state not in ('failed'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state, 'processed'::platform_private.webhook_receipt_state)
     or current_receipt.state in ('duplicate'::platform_private.webhook_receipt_state, 'rejected'::platform_private.webhook_receipt_state, 'manual_review'::platform_private.webhook_receipt_state)
       and p_next_state <> current_receipt.state then
    raise exception 'invalid webhook receipt outcome transition' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(current_receipt.attempts) >= 32 then
    raise exception 'webhook receipt attempt evidence limit reached' using errcode = '22023';
  end if;

  update platform_private.webhook_receipts
  set state = p_next_state,
      operation_id = coalesce(p_operation_id, operation_id),
      attempts = attempts || jsonb_build_array(jsonb_build_object(
        'attempt', pg_catalog.jsonb_array_length(attempts) + 1,
        'startedAt', now_at,
        'endedAt', now_at,
        'outcome', case
          when p_next_state = 'accepted'::platform_private.webhook_receipt_state then 'running'
          when p_next_state = 'processed'::platform_private.webhook_receipt_state then 'succeeded'
          else 'failed'
        end,
        'errorCode', p_error_code,
        'retryable', false
      ))
  where id = current_receipt.id and state = p_expected_state;
  get diagnostics affected = row_count;
  if affected <> 1 then
    return false;
  end if;
  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at
  ) values (
    'webhook.receipt.' || p_next_state::text, null, '00000000-0000-0000-0000-000000000001'::uuid,
    'webhook_receipt', current_receipt.id,
    case when p_next_state = 'processed'::platform_private.webhook_receipt_state then 'completed'::platform_private.audit_decision else 'failed'::platform_private.audit_decision end,
    coalesce(p_error_code, 'WEBHOOK_RECEIPT_' || pg_catalog.upper(p_next_state::text)),
    coalesce(current_receipt.operation_id, current_receipt.id),
    now_at
  );
  return true;
end;
$$;

create or replace function platform_api.create_provider_operation(
  p_provider text,
  p_operation_type text,
  p_actor_id uuid,
  p_intent_hash bytea,
  p_provider_idempotency_key_hash bytea,
  p_correlation_id uuid,
  p_acting_party_id uuid default null,
  p_causation_id uuid default null,
  p_operation_id uuid default extensions.gen_random_uuid()
)
returns table (operation_id uuid, version bigint, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.create_provider_operation(
    p_provider, p_operation_type, p_actor_id, p_intent_hash, p_provider_idempotency_key_hash,
    p_correlation_id, p_acting_party_id, p_causation_id, p_operation_id
  );
$$;

create or replace function platform_api.record_webhook_receipt(
  p_provider text,
  p_external_event_id text,
  p_payload_digest bytea,
  p_signature_verified_at timestamptz,
  p_operation_id uuid default null,
  p_receipt_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns table (receipt_id uuid, accepted boolean, duplicate boolean, conflict boolean, state platform_private.webhook_receipt_state, operation_id uuid)
language sql
security invoker
set search_path = ''
as $$
  select * from platform_private.record_webhook_receipt(
    p_provider, p_external_event_id, p_payload_digest, p_signature_verified_at,
    p_operation_id, p_receipt_id, p_correlation_id, p_actor_id, p_acting_party_id
  );
$$;

create or replace function platform_api.apply_provider_operation_outcome(
  p_operation_id uuid,
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
  select platform_private.apply_provider_operation_outcome(
    p_operation_id, p_expected_version, p_next_state, p_provider_ref, p_error_code,
    p_retryable, p_attempt_started_at, p_attempt_ended_at
  );
$$;

create or replace function platform_api.apply_webhook_receipt_outcome(
  p_receipt_id uuid,
  p_expected_state platform_private.webhook_receipt_state,
  p_next_state platform_private.webhook_receipt_state,
  p_operation_id uuid default null,
  p_error_code text default null
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select platform_private.apply_webhook_receipt_outcome(
    p_receipt_id, p_expected_state, p_next_state, p_operation_id, p_error_code
  );
$$;

revoke all on function platform_private.guard_provider_operations() from public, anon, authenticated, service_role;
revoke all on function platform_private.guard_webhook_receipts() from public, anon, authenticated, service_role;
revoke all on function platform_private.create_provider_operation(text, text, uuid, bytea, bytea, uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function platform_private.record_webhook_receipt(text, text, bytea, timestamptz, uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function platform_private.apply_provider_operation_outcome(uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function platform_private.apply_webhook_receipt_outcome(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text) from public, anon, authenticated;
grant execute on function platform_private.create_provider_operation(text, text, uuid, bytea, bytea, uuid, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.record_webhook_receipt(text, text, bytea, timestamptz, uuid, uuid, uuid, uuid, uuid) to service_role;
grant execute on function platform_private.apply_provider_operation_outcome(uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) to service_role;
grant execute on function platform_private.apply_webhook_receipt_outcome(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text) to service_role;

revoke all on function platform_api.create_provider_operation(text, text, uuid, bytea, bytea, uuid, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.record_webhook_receipt(text, text, bytea, timestamptz, uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_provider_operation_outcome(uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_webhook_receipt_outcome(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text) from public, anon, authenticated, service_role;
grant execute on function platform_api.create_provider_operation(text, text, uuid, bytea, bytea, uuid, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.record_webhook_receipt(text, text, bytea, timestamptz, uuid, uuid, uuid, uuid, uuid) to service_role;
grant execute on function platform_api.apply_provider_operation_outcome(uuid, bigint, platform_private.provider_operation_state, text, text, boolean, timestamptz, timestamptz) to service_role;
grant execute on function platform_api.apply_webhook_receipt_outcome(uuid, platform_private.webhook_receipt_state, platform_private.webhook_receipt_state, uuid, text) to service_role;

commit;

-- Rollback policy: forward-only compensating migration. Provider intent and
-- webhook evidence are never dropped or rewritten by an automated rollback.
