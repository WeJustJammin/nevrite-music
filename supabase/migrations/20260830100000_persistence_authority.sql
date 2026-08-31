begin;

create type platform_private.job_state as enum
  ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type platform_private.idempotency_state as enum
  ('reserved', 'completed', 'failed_retryable');
create type platform_private.audit_decision as enum
  ('allowed', 'denied', 'completed', 'failed');
create type platform_private.restore_fence_state as enum
  ('reconciling', 'released');

create function platform_private.valid_job_progress(value jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  completed bigint;
  total bigint;
  unit text;
begin
  if value is null then return true; end if;
  if pg_catalog.jsonb_typeof(value) <> 'object'
     or not (value ?& array['completed', 'total', 'unit']::text[])
     or value - array['completed', 'total', 'unit']::text[] <> '{}'::jsonb
     or pg_catalog.jsonb_typeof(value->'completed') <> 'number'
     or pg_catalog.jsonb_typeof(value->'total') <> 'number'
     or pg_catalog.jsonb_typeof(value->'unit') <> 'string' then
    return false;
  end if;
  begin
    completed := (value->>'completed')::bigint;
    total := (value->>'total')::bigint;
  exception when others then return false;
  end;
  unit := btrim(value->>'unit');
  return completed >= 0 and total > 0 and completed <= total
    and length(unit) between 1 and 128;
end;
$$;

create function platform_private.valid_attempts(value jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  entry jsonb;
  number integer;
begin
  if value is null or pg_catalog.jsonb_typeof(value) <> 'array'
     or pg_catalog.jsonb_array_length(value) > 32 then return false; end if;
  for entry in select elements.item from pg_catalog.jsonb_array_elements(value) as elements(item) loop
    if pg_catalog.jsonb_typeof(entry) <> 'object'
       or not (entry ?& array['attempt', 'startedAt', 'endedAt', 'outcome', 'errorCode', 'retryable']::text[])
       or entry - array['attempt', 'startedAt', 'endedAt', 'outcome', 'errorCode', 'retryable']::text[] <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(entry->'attempt') <> 'number'
       or pg_catalog.jsonb_typeof(entry->'startedAt') <> 'string'
       or btrim(entry->>'startedAt') = ''
       or pg_catalog.jsonb_typeof(entry->'outcome') <> 'string'
       or entry->>'outcome' not in ('running', 'succeeded', 'failed', 'cancelled', 'retryable')
       or pg_catalog.jsonb_typeof(entry->'retryable') <> 'boolean' then
      return false;
    end if;
    if entry->'endedAt' <> 'null'::jsonb
       and (pg_catalog.jsonb_typeof(entry->'endedAt') <> 'string' or btrim(entry->>'endedAt') = '') then
      return false;
    end if;
    if entry->'errorCode' <> 'null'::jsonb
       and (pg_catalog.jsonb_typeof(entry->'errorCode') <> 'string'
         or entry->>'errorCode' !~ '^[A-Z][A-Z0-9_.-]{0,63}$') then
      return false;
    end if;
    begin number := (entry->>'attempt')::integer; exception when others then return false; end;
    if number < 1 then return false; end if;
  end loop;
  return true;
end;
$$;

create function platform_private.valid_response_ref(value jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  status text;
  key text;
begin
  if value is null then return true; end if;
  if pg_catalog.jsonb_typeof(value) <> 'object' or not (value ? 'status') then return false; end if;
  if pg_catalog.jsonb_typeof(value->'status') <> 'number' then return false; end if;
  status := value->>'status';
  if status !~ '^[1-5][0-9]{2}$' then return false; end if;
  for key in select jsonb_object_keys(value) loop
    if key not in ('status', 'resourceRef', 'jobRef', 'safeHeaders') then return false; end if;
  end loop;
  if value ? 'safeHeaders' and pg_catalog.jsonb_typeof(value->'safeHeaders') <> 'object' then return false; end if;
  if value ? 'resourceRef' and value->'resourceRef' <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(value->'resourceRef') <> 'string' or btrim(value->>'resourceRef') = '') then return false; end if;
  if value ? 'jobRef' and value->'jobRef' <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(value->'jobRef') <> 'string' or btrim(value->>'jobRef') = '') then return false; end if;
  return true;
end;
$$;

create function platform_private.record_attempt_outcome(
  attempts jsonb, outcome text, error_code text, retryable boolean, ended_at timestamptz
)
returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  index_text text;
  value jsonb;
begin
  if attempts is null or pg_catalog.jsonb_array_length(attempts) = 0 then return coalesce(attempts, '[]'::jsonb); end if;
  index_text := (pg_catalog.jsonb_array_length(attempts) - 1)::text;
  value := pg_catalog.jsonb_set(attempts, array[index_text, 'endedAt'], pg_catalog.to_jsonb(ended_at), true);
  value := pg_catalog.jsonb_set(value, array[index_text, 'outcome'], pg_catalog.to_jsonb(outcome), true);
  value := pg_catalog.jsonb_set(value, array[index_text, 'errorCode'], coalesce(pg_catalog.to_jsonb(error_code), 'null'::jsonb), true);
  return pg_catalog.jsonb_set(value, array[index_text, 'retryable'], pg_catalog.to_jsonb(retryable), true);
end;
$$;

create function platform_private.valid_base_event_payload(event_type text, schema_version integer, payload jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  identifier text;
begin
  if event_type not in ('job.requested', 'object.uploaded', 'provider.operation.requested', 'webhook.accepted')
     or schema_version <> 1 then return true; end if;
  if pg_catalog.jsonb_typeof(payload) <> 'object' then return false; end if;
  if event_type = 'job.requested' then
    if not (payload ?& array['jobType', 'jobId']::text[]) or payload - array['jobType', 'jobId']::text[] <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(payload->'jobType') <> 'string' or payload->>'jobType' !~ '^[a-z0-9][a-z0-9._-]{0,127}$' then return false; end if;
    identifier := payload->>'jobId';
  elsif event_type = 'object.uploaded' then
    if payload - array['objectId']::text[] <> '{}'::jsonb or not (payload ? 'objectId') then return false; end if;
    identifier := payload->>'objectId';
  elsif event_type = 'provider.operation.requested' then
    if payload - array['operationId']::text[] <> '{}'::jsonb or not (payload ? 'operationId') then return false; end if;
    identifier := payload->>'operationId';
  else
    if payload - array['receiptId']::text[] <> '{}'::jsonb or not (payload ? 'receiptId') then return false; end if;
    identifier := payload->>'receiptId';
  end if;
  return pg_catalog.jsonb_typeof(payload->(case when event_type = 'job.requested' then 'jobId' when event_type = 'object.uploaded' then 'objectId' when event_type = 'provider.operation.requested' then 'operationId' else 'receiptId' end)) = 'string'
    and identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
end;
$$;

create table platform_private.jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  job_type text not null check (job_type = btrim(job_type) and length(job_type) between 1 and 128 and job_type ~ '^[a-z0-9][a-z0-9._-]*$'),
  actor_id uuid not null,
  acting_party_id uuid not null,
  state platform_private.job_state not null default 'queued',
  progress jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_until timestamptz,
  result_ref jsonb,
  error_code text check (error_code is null or error_code ~ '^[A-Z][A-Z0-9_.-]{0,63}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  correlation_id uuid not null,
  causation_id uuid,
  originating_event_id uuid not null,
  attempts jsonb not null default '[]'::jsonb,
  check (platform_private.valid_job_progress(progress)),
  check (platform_private.valid_attempts(attempts)),
  check (state <> 'succeeded' or (result_ref is not null and pg_catalog.jsonb_typeof(result_ref) <> 'null' and error_code is null)),
  check (state not in ('failed', 'cancelled') or (error_code is not null and result_ref is null)),
  check ((state = 'running' and lease_until is not null) or (state <> 'running' and lease_until is null))
);

create table platform_private.outbox_events (
  id uuid primary key default extensions.gen_random_uuid(),
  event_type text not null check (event_type = btrim(event_type) and length(event_type) between 1 and 160 and event_type ~ '^[a-z0-9][a-z0-9._-]*$'),
  schema_version integer not null check (schema_version > 0),
  aggregate_type text not null check (aggregate_type = btrim(aggregate_type) and length(aggregate_type) between 1 and 80),
  aggregate_id uuid not null,
  aggregate_version bigint not null check (aggregate_version > 0),
  correlation_id uuid not null,
  causation_id uuid,
  payload jsonb not null check (pg_catalog.jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null default now(),
  dispatched_at timestamptz,
  dispatch_attempt_count integer not null default 0 check (dispatch_attempt_count >= 0),
  dispatch_lease_token uuid,
  dispatch_lease_until timestamptz,
  last_dispatch_error_code text check (last_dispatch_error_code is null or last_dispatch_error_code ~ '^[A-Z][A-Z0-9_.-]{0,63}$'),
  dead_lettered_at timestamptz,
  dead_letter_reason text,
  check ((dispatch_lease_token is null) = (dispatch_lease_until is null)),
  check (dispatched_at is null or (dispatch_lease_token is null and dispatch_lease_until is null)),
  check (dead_lettered_at is null or (dispatched_at is not null and dead_letter_reason is not null and length(btrim(dead_letter_reason)) between 1 and 160)),
  check (platform_private.valid_base_event_payload(event_type, schema_version, payload))
);

create table platform_private.idempotency_records (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid not null,
  operation text not null check (operation = btrim(operation) and length(operation) between 1 and 128),
  key_hash bytea not null check (octet_length(key_hash) = 32),
  request_hash bytea not null check (octet_length(request_hash) = 32),
  state platform_private.idempotency_state not null default 'reserved',
  response_ref jsonb check (platform_private.valid_response_ref(response_ref)),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (actor_id, operation, key_hash),
  check (expires_at > created_at),
  check (state = 'reserved' or response_ref is not null)
);

create table platform_private.restore_fences (
  id uuid primary key default extensions.gen_random_uuid(),
  restore_epoch bigint not null unique check (restore_epoch > 0),
  state platform_private.restore_fence_state not null default 'reconciling',
  reason text not null check (length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  check ((state = 'reconciling' and released_at is null) or (state = 'released' and released_at is not null))
);

create table audit_private.audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  action text not null check (action = btrim(action) and length(action) between 1 and 160),
  actor_id uuid,
  acting_party_id uuid not null,
  target_type text not null check (target_type = btrim(target_type) and length(target_type) between 1 and 80),
  target_id uuid not null,
  decision platform_private.audit_decision not null,
  reason_code text not null check (reason_code = btrim(reason_code) and reason_code ~ '^[A-Z][A-Z0-9_.-]{0,63}$'),
  correlation_id uuid not null,
  occurred_at timestamptz not null default now()
);

alter table platform_private.jobs enable row level security;
alter table platform_private.jobs force row level security;
alter table platform_private.outbox_events enable row level security;
alter table platform_private.outbox_events force row level security;
alter table platform_private.idempotency_records enable row level security;
alter table platform_private.idempotency_records force row level security;
alter table platform_private.restore_fences enable row level security;
alter table platform_private.restore_fences force row level security;
alter table audit_private.audit_events enable row level security;
alter table audit_private.audit_events force row level security;

revoke all on table platform_private.jobs, platform_private.outbox_events,
  platform_private.idempotency_records, platform_private.restore_fences,
  audit_private.audit_events from public, anon, authenticated, service_role;
grant usage on schema platform_private to service_role;

create index jobs_actor_created_idx on platform_private.jobs (actor_id, created_at desc, id);
create index jobs_party_created_idx on platform_private.jobs (acting_party_id, created_at desc, id);
create index jobs_running_lease_idx on platform_private.jobs (lease_until, id) where state = 'running';
create index jobs_type_state_created_idx on platform_private.jobs (job_type, state, created_at);
create index outbox_dispatch_idx on platform_private.outbox_events (dispatch_lease_until, occurred_at, id) where dispatched_at is null;
create index outbox_aggregate_idx on platform_private.outbox_events (aggregate_type, aggregate_id, aggregate_version);
create index outbox_correlation_idx on platform_private.outbox_events (correlation_id);
create index idempotency_expiry_idx on platform_private.idempotency_records (expires_at);
create index idempotency_open_idx on platform_private.idempotency_records (state, expires_at) where state <> 'completed';
create unique index restore_active_idx on platform_private.restore_fences (state) where state = 'reconciling';
create index audit_target_idx on audit_private.audit_events (target_type, target_id, occurred_at desc, id);
create index audit_actor_idx on audit_private.audit_events (actor_id, occurred_at desc, id);
create index audit_party_idx on audit_private.audit_events (acting_party_id, occurred_at desc, id);
create index audit_correlation_idx on audit_private.audit_events (correlation_id);

create function platform_private.guard_jobs() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'jobs are append-only at the row boundary' using errcode = 'P0001'; end if;
  if new.version < old.version then raise exception 'job version cannot decrease' using errcode = 'P0001'; end if;
  if old.state in ('succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     and (new.state is distinct from old.state or new.result_ref is distinct from old.result_ref or new.error_code is distinct from old.error_code) then
    raise exception 'terminal job state and result are immutable' using errcode = 'P0001';
  end if;
  if old.state = 'queued'::platform_private.job_state and new.state not in ('queued'::platform_private.job_state, 'running'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or old.state = 'running'::platform_private.job_state and new.state not in ('running'::platform_private.job_state, 'queued'::platform_private.job_state, 'succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or old.state in ('succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state) and new.state is distinct from old.state then
    raise exception 'invalid job state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function platform_private.guard_outbox() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'outbox events are append-only' using errcode = 'P0001'; end if;
  if new.id is distinct from old.id or new.event_type is distinct from old.event_type
     or new.schema_version is distinct from old.schema_version or new.aggregate_type is distinct from old.aggregate_type
     or new.aggregate_id is distinct from old.aggregate_id or new.aggregate_version is distinct from old.aggregate_version
     or new.correlation_id is distinct from old.correlation_id or new.causation_id is distinct from old.causation_id
     or new.payload is distinct from old.payload or new.occurred_at is distinct from old.occurred_at then
    raise exception 'outbox identity and payload are immutable' using errcode = 'P0001';
  end if;
  if old.dispatched_at is not null and new.dispatched_at is distinct from old.dispatched_at then
    raise exception 'dispatched outbox events cannot be reopened' using errcode = 'P0001';
  end if;
  if new.dispatch_attempt_count < old.dispatch_attempt_count then
    raise exception 'outbox attempt count cannot decrease' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function platform_private.guard_idempotency() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'idempotency records cannot be deleted' using errcode = 'P0001'; end if;
  if new.id is distinct from old.id or new.actor_id is distinct from old.actor_id
     or new.operation is distinct from old.operation or new.key_hash is distinct from old.key_hash
     or new.request_hash is distinct from old.request_hash or new.created_at is distinct from old.created_at
     or new.expires_at is distinct from old.expires_at then
    raise exception 'idempotency identity and request are immutable' using errcode = 'P0001';
  end if;
  if old.state = 'completed'::platform_private.idempotency_state and
     (new.state is distinct from old.state or new.response_ref is distinct from old.response_ref) then
    raise exception 'completed idempotency result is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'reserved'::platform_private.idempotency_state and new.state not in ('reserved'::platform_private.idempotency_state, 'completed'::platform_private.idempotency_state, 'failed_retryable'::platform_private.idempotency_state)
     or old.state = 'failed_retryable'::platform_private.idempotency_state and new.state not in ('reserved'::platform_private.idempotency_state, 'failed_retryable'::platform_private.idempotency_state) then
    raise exception 'invalid idempotency state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function platform_private.guard_restore_fence() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'restore fences cannot be deleted' using errcode = 'P0001'; end if;
  if new.id is distinct from old.id or new.restore_epoch is distinct from old.restore_epoch
     or new.reason is distinct from old.reason or new.created_at is distinct from old.created_at then
    raise exception 'restore fence identity is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'released'::platform_private.restore_fence_state
     and new.released_at is distinct from old.released_at then
    raise exception 'released restore fence timestamp is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'released'::platform_private.restore_fence_state
     or new.state not in ('reconciling'::platform_private.restore_fence_state, 'released'::platform_private.restore_fence_state)
     or old.state = 'reconciling'::platform_private.restore_fence_state and new.state <> old.state and new.state <> 'released'::platform_private.restore_fence_state then
    raise exception 'restore fence cannot reopen' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create function audit_private.guard_audit_events() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit events are append-only' using errcode = 'P0001';
end;
$$;

create trigger jobs_guard before update or delete on platform_private.jobs
for each row execute function platform_private.guard_jobs();
create trigger outbox_guard before update or delete on platform_private.outbox_events
for each row execute function platform_private.guard_outbox();
create trigger idempotency_guard before update or delete on platform_private.idempotency_records
for each row execute function platform_private.guard_idempotency();
create trigger restore_fence_guard before update or delete on platform_private.restore_fences
for each row execute function platform_private.guard_restore_fence();
create trigger audit_append_only before update or delete on audit_private.audit_events
for each row execute function audit_private.guard_audit_events();

create function platform_private.external_effects_allowed()
returns boolean language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1 from platform_private.restore_fences
    where state = 'reconciling'::platform_private.restore_fence_state
  );
$$;

create function platform_private.accept_job_with_outbox(
  p_actor_id uuid, p_acting_party_id uuid, p_job_type text, p_correlation_id uuid,
  p_idempotency_key_hash bytea, p_request_hash bytea, p_expires_at timestamptz,
  p_job_id uuid default extensions.gen_random_uuid(), p_event_id uuid default extensions.gen_random_uuid()
)
returns table (job_id uuid, event_id uuid, version bigint, replayed boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  record platform_private.idempotency_records;
  existing_event uuid;
begin
  if not platform_private.external_effects_allowed() then raise exception 'restore reconciliation fence is active' using errcode = 'P0001'; end if;
  if p_actor_id is null or p_acting_party_id is null or p_correlation_id is null or p_job_id is null or p_event_id is null
     or octet_length(p_idempotency_key_hash) <> 32 or octet_length(p_request_hash) <> 32
     or p_expires_at <= now_at or btrim(p_job_type) <> p_job_type
     or p_job_type !~ '^[a-z0-9][a-z0-9._-]*$' or length(p_job_type) > 128 then
    raise exception 'invalid job acceptance request' using errcode = '22023';
  end if;
  insert into platform_private.idempotency_records (actor_id, operation, key_hash, request_hash, state, created_at, expires_at)
  values (p_actor_id, 'platform.job.execute', p_idempotency_key_hash, p_request_hash, 'reserved', now_at, p_expires_at)
  on conflict (actor_id, operation, key_hash) do nothing;
  select * into record from platform_private.idempotency_records
  where actor_id = p_actor_id and operation = 'platform.job.execute' and key_hash = p_idempotency_key_hash
  for update;
  if record.request_hash <> p_request_hash then raise exception 'idempotency request hash mismatch' using errcode = 'P0001'; end if;
  if record.state = 'completed'::platform_private.idempotency_state then
    job_id := (record.response_ref->>'jobRef')::uuid;
    select id into existing_event from platform_private.outbox_events
    where aggregate_type = 'job' and aggregate_id = job_id and event_type = 'job.requested' and schema_version = 1
    order by occurred_at desc, id desc limit 1;
    if existing_event is null then raise exception 'completed idempotency result has no outbox event' using errcode = 'P0001'; end if;
    event_id := existing_event;
    select j.version into version from platform_private.jobs j where j.id = job_id;
    replayed := true;
    return next;
    return;
  end if;
  if record.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records set state = 'reserved', response_ref = null where id = record.id;
  end if;
  insert into platform_private.jobs (id, job_type, actor_id, acting_party_id, state, created_at, updated_at, version, correlation_id, originating_event_id)
  values (p_job_id, p_job_type, p_actor_id, p_acting_party_id, 'queued', now_at, now_at, 1, p_correlation_id, p_event_id);
  insert into platform_private.outbox_events (id, event_type, schema_version, aggregate_type, aggregate_id, aggregate_version, correlation_id, payload, occurred_at)
  values (p_event_id, 'job.requested', 1, 'job', p_job_id, 1, p_correlation_id,
    jsonb_build_object('jobType', p_job_type, 'jobId', p_job_id), now_at);
  update platform_private.idempotency_records
  set state = 'completed', response_ref = jsonb_build_object('status', 202, 'jobRef', p_job_id::text, 'resourceRef', format('/api/v1/jobs/%s', p_job_id))
  where id = record.id;
  job_id := p_job_id; event_id := p_event_id; version := 1; replayed := false;
  return next;
end;
$$;

create function platform_private.claim_outbox_event(p_event_id uuid, p_lease_token uuid, p_lease_seconds integer)
returns table (event_id uuid, aggregate_id uuid, aggregate_version bigint, lease_token uuid, dispatch_attempt_count integer)
language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
begin
  if p_event_id is null or p_lease_token is null or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid outbox lease request' using errcode = '22023';
  end if;
  if not platform_private.external_effects_allowed() then return; end if;
  return query
  update platform_private.outbox_events event
  set dispatch_lease_token = p_lease_token,
      dispatch_lease_until = now_at + pg_catalog.make_interval(secs => p_lease_seconds),
      dispatch_attempt_count = event.dispatch_attempt_count + 1
  where event.id = p_event_id and event.dispatched_at is null and event.dead_lettered_at is null
    and (event.dispatch_lease_until is null or event.dispatch_lease_until <= now_at)
  returning event.id, event.aggregate_id, event.aggregate_version, event.dispatch_lease_token, event.dispatch_attempt_count;
end;
$$;

create function platform_private.complete_outbox_event(p_event_id uuid, p_lease_token uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  update platform_private.outbox_events
  set dispatched_at = clock_timestamp(), dispatch_lease_token = null, dispatch_lease_until = null
  where id = p_event_id and dispatched_at is null and dead_lettered_at is null and dispatch_lease_token = p_lease_token
    and dispatch_lease_until > clock_timestamp();
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create function platform_private.dead_letter_unknown_outbox_event(p_event_id uuid, p_lease_token uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  update platform_private.outbox_events
  set dispatched_at = clock_timestamp(), dead_lettered_at = clock_timestamp(), dead_letter_reason = 'UNKNOWN_SCHEMA_VERSION',
      last_dispatch_error_code = 'UNKNOWN_SCHEMA_VERSION', dispatch_lease_token = null, dispatch_lease_until = null
  where id = p_event_id and dispatched_at is null and dead_lettered_at is null and dispatch_lease_token = p_lease_token
    and dispatch_lease_until > clock_timestamp()
    and not ((event_type, schema_version) in (('job.requested', 1), ('object.uploaded', 1), ('provider.operation.requested', 1), ('webhook.accepted', 1)));
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create function platform_private.claim_job(p_job_id uuid, p_expected_version bigint, p_lease_token uuid, p_lease_seconds integer)
returns table (job_id uuid, version bigint, state platform_private.job_state, lease_until timestamptz, attempt_count integer)
language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1 or p_lease_token is null or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid job lease request' using errcode = '22023';
  end if;
  if not platform_private.external_effects_allowed() then return; end if;
  return query
  update platform_private.jobs job
  set state = 'running', lease_until = now_at + pg_catalog.make_interval(secs => p_lease_seconds),
      attempt_count = job.attempt_count + 1, error_code = null, updated_at = now_at, version = job.version + 1,
      attempts = job.attempts || jsonb_build_array(jsonb_build_object(
        'attempt', job.attempt_count + 1, 'startedAt', now_at, 'endedAt', null,
        'outcome', 'running', 'errorCode', null, 'retryable', false))
  where job.id = p_job_id and job.version = p_expected_version and pg_catalog.jsonb_array_length(job.attempts) < 32
    and (job.state = 'queued' or (job.state = 'running' and (job.lease_until is null or job.lease_until <= now_at)))
  returning job.id, job.version, job.state, job.lease_until, job.attempt_count;
end;
$$;

create function platform_private.apply_job_outcome(
  p_job_id uuid, p_expected_version bigint, p_next_state platform_private.job_state,
  p_result_ref jsonb, p_error_code text, p_retryable boolean
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  target platform_private.job_state := p_next_state;
  affected integer;
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1 then raise exception 'invalid job outcome request' using errcode = '22023'; end if;
  if p_next_state not in ('queued'::platform_private.job_state, 'succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or (p_next_state = 'queued'::platform_private.job_state and not p_retryable)
     or (p_next_state = 'succeeded'::platform_private.job_state and (p_result_ref is null or pg_catalog.jsonb_typeof(p_result_ref) = 'null' or p_error_code is not null))
     or (p_next_state in ('failed'::platform_private.job_state, 'cancelled'::platform_private.job_state) and (p_error_code is null or p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' or p_result_ref is not null)) then
    raise exception 'invalid job outcome' using errcode = '22023';
  end if;
  if p_next_state = 'failed'::platform_private.job_state and p_retryable then target := 'queued'; end if;
  if not platform_private.external_effects_allowed() then return false; end if;
  update platform_private.jobs job
  set state = target,
      result_ref = case when target = 'succeeded'::platform_private.job_state then p_result_ref else null end,
      error_code = case when target = 'succeeded'::platform_private.job_state then null else p_error_code end,
      lease_until = null, updated_at = now_at, version = job.version + 1,
      attempts = platform_private.record_attempt_outcome(job.attempts, case when target = 'queued'::platform_private.job_state then 'retryable' else target::text end, p_error_code, p_retryable, now_at)
  where job.id = p_job_id and job.version = p_expected_version and job.state = 'running'
    and (job.lease_until is null or job.lease_until > now_at);
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create function platform_private.begin_restore_fence(p_restore_epoch bigint, p_reason text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare current_state platform_private.restore_fence_state;
begin
  if p_restore_epoch is null or p_restore_epoch < 1 or p_reason is null or length(btrim(p_reason)) not between 1 and 500 then raise exception 'invalid restore fence' using errcode = '22023'; end if;
  insert into platform_private.restore_fences (restore_epoch, reason) values (p_restore_epoch, btrim(p_reason)) on conflict (restore_epoch) do nothing;
  select state into current_state from platform_private.restore_fences where restore_epoch = p_restore_epoch;
  return current_state = 'reconciling'::platform_private.restore_fence_state;
end;
$$;

create function platform_private.complete_restore_fence(p_restore_epoch bigint)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare affected integer;
begin
  update platform_private.restore_fences set state = 'released', released_at = clock_timestamp()
  where restore_epoch = p_restore_epoch and state = 'reconciling';
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function platform_private.external_effects_allowed() from public, anon, authenticated;
revoke all on function platform_private.accept_job_with_outbox(uuid, uuid, text, uuid, bytea, bytea, timestamptz, uuid, uuid) from public, anon, authenticated;
revoke all on function platform_private.claim_outbox_event(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function platform_private.complete_outbox_event(uuid, uuid) from public, anon, authenticated;
revoke all on function platform_private.dead_letter_unknown_outbox_event(uuid, uuid) from public, anon, authenticated;
revoke all on function platform_private.claim_job(uuid, bigint, uuid, integer) from public, anon, authenticated;
revoke all on function platform_private.apply_job_outcome(uuid, bigint, platform_private.job_state, jsonb, text, boolean) from public, anon, authenticated;
revoke all on function platform_private.begin_restore_fence(bigint, text) from public, anon, authenticated;
revoke all on function platform_private.complete_restore_fence(bigint) from public, anon, authenticated;
grant execute on function platform_private.external_effects_allowed() to service_role;
grant execute on function platform_private.accept_job_with_outbox(uuid, uuid, text, uuid, bytea, bytea, timestamptz, uuid, uuid) to service_role;
grant execute on function platform_private.claim_outbox_event(uuid, uuid, integer) to service_role;
grant execute on function platform_private.complete_outbox_event(uuid, uuid) to service_role;
grant execute on function platform_private.dead_letter_unknown_outbox_event(uuid, uuid) to service_role;
grant execute on function platform_private.claim_job(uuid, bigint, uuid, integer) to service_role;
grant execute on function platform_private.apply_job_outcome(uuid, bigint, platform_private.job_state, jsonb, text, boolean) to service_role;
grant execute on function platform_private.begin_restore_fence(bigint, text) to service_role;
grant execute on function platform_private.complete_restore_fence(bigint) to service_role;

commit;

-- Rollback policy: forward-only compensating migration. Persistence and audit
-- records are never dropped or rewritten by an automated rollback.
