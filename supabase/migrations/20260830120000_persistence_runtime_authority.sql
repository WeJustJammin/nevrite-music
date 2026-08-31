begin;

-- Runtime registries and counters are canonical private state.  The registry is
-- intentionally closed until a reviewed migration adds another job type.
create table platform_private.job_type_registry (
  job_type text primary key check (
    job_type = btrim(job_type)
    and length(job_type) between 1 and 64
    and job_type ~ '^[a-z][a-z0-9_.-]{0,63}$'
  ),
  registered_at timestamptz not null default clock_timestamp()
);
insert into platform_private.job_type_registry (job_type)
values ('object.verify'), ('platform.job.execute');

alter table platform_private.jobs add column lease_token uuid;
alter table platform_private.jobs add constraint jobs_lease_token_consistency check (
  (state = 'running' and lease_until is not null and lease_token is not null)
  or (state <> 'running' and lease_until is null and lease_token is null)
);
alter table platform_private.jobs add constraint jobs_progress_size_check check (
  progress is null or pg_catalog.pg_column_size(progress) <= 8192
);
alter table platform_private.jobs add constraint jobs_result_ref_size_check check (
  result_ref is null or pg_catalog.pg_column_size(result_ref) <= 65536
);

create table platform_private.job_read_rate_limits (
  scope text not null check (scope in ('user', 'party')),
  scope_id uuid not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count between 0 and 1000000),
  primary key (scope, scope_id, window_started_at)
);

create table platform_private.processed_events (
  event_id uuid primary key,
  event_type text not null,
  schema_version integer not null,
  aggregate_id uuid not null,
  processed_at timestamptz not null default clock_timestamp(),
  pending_manual_review boolean not null default false check (not pending_manual_review),
  unique (event_id, event_type, schema_version),
  check ((event_type, schema_version) in (
    ('job.requested', 1),
    ('object.uploaded', 1),
    ('provider.operation.requested', 1),
    ('webhook.accepted', 1)
  ))
);

alter table platform_private.job_type_registry enable row level security;
alter table platform_private.job_type_registry force row level security;
alter table platform_private.job_read_rate_limits enable row level security;
alter table platform_private.job_read_rate_limits force row level security;
alter table platform_private.processed_events enable row level security;
alter table platform_private.processed_events force row level security;

revoke all on table platform_private.job_type_registry,
  platform_private.job_read_rate_limits, platform_private.processed_events
  from public, anon, authenticated, service_role;

create index jobs_running_lease_token_idx
  on platform_private.jobs (lease_token, id)
  where state = 'running';
create index job_read_rate_limits_expiry_idx
  on platform_private.job_read_rate_limits (window_started_at);
create index processed_events_aggregate_idx
  on platform_private.processed_events (aggregate_id, processed_at desc);

create or replace function platform_private.guard_jobs() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'jobs are append-only at the row boundary' using errcode = 'P0001';
  end if;
  if new.version < old.version then
    raise exception 'job version cannot decrease' using errcode = 'P0001';
  end if;
  if old.state in ('succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     and (new.state is distinct from old.state
       or new.result_ref is distinct from old.result_ref
       or new.error_code is distinct from old.error_code
       or new.lease_token is distinct from old.lease_token) then
    raise exception 'terminal job state and result are immutable' using errcode = 'P0001';
  end if;
  if old.state = 'queued'::platform_private.job_state
     and new.state not in ('queued'::platform_private.job_state, 'running'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or old.state = 'running'::platform_private.job_state
     and new.state not in ('running'::platform_private.job_state, 'queued'::platform_private.job_state, 'succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or old.state in ('succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     and new.state is distinct from old.state then
    raise exception 'invalid job state transition' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function platform_private.accept_job_with_outbox(
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
  if p_actor_id is null or p_acting_party_id is null or p_correlation_id is null
     or p_job_id is null or p_event_id is null
     or octet_length(p_idempotency_key_hash) <> 32
     or octet_length(p_request_hash) <> 32
     or p_expires_at <= now_at
     or btrim(p_job_type) <> p_job_type
     or not exists (
       select 1 from platform_private.job_type_registry r
       where r.job_type = p_job_type
     ) then
    raise exception 'invalid or unregistered job acceptance request' using errcode = '22023';
  end if;
  insert into platform_private.idempotency_records (
    actor_id, operation, key_hash, request_hash, state, created_at, expires_at
  )
  values (
    p_actor_id, p_job_type, p_idempotency_key_hash, p_request_hash,
    'reserved', now_at, p_expires_at
  )
  on conflict (actor_id, operation, key_hash) do nothing;
  select * into record
  from platform_private.idempotency_records
  where actor_id = p_actor_id and operation = p_job_type and key_hash = p_idempotency_key_hash
  for update;
  if record.request_hash <> p_request_hash then
    raise exception 'idempotency request hash mismatch' using errcode = 'P0001';
  end if;
  if record.state = 'completed'::platform_private.idempotency_state then
    job_id := (record.response_ref->>'jobRef')::uuid;
    select id into existing_event
    from platform_private.outbox_events
    where aggregate_type = 'job' and aggregate_id = job_id
      and event_type = 'job.requested' and schema_version = 1
    order by occurred_at desc, id desc limit 1;
    if existing_event is null then
      raise exception 'completed idempotency result has no outbox event' using errcode = 'P0001';
    end if;
    event_id := existing_event;
    select j.version into version from platform_private.jobs j where j.id = job_id;
    replayed := true;
    return next;
    return;
  end if;
  if record.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
    set state = 'reserved', response_ref = null where id = record.id;
  end if;
  insert into platform_private.jobs (
    id, job_type, actor_id, acting_party_id, state, created_at, updated_at,
    version, correlation_id, originating_event_id
  )
  values (
    p_job_id, p_job_type, p_actor_id, p_acting_party_id, 'queued', now_at, now_at,
    1, p_correlation_id, p_event_id
  );
  insert into platform_private.outbox_events (
    id, event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload, occurred_at
  )
  values (
    p_event_id, 'job.requested', 1, 'job', p_job_id, 1, p_correlation_id,
    jsonb_build_object('jobType', p_job_type, 'jobId', p_job_id), now_at
  );
  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id, occurred_at
  )
  values (
    'job.accepted', p_actor_id, p_acting_party_id, 'job', p_job_id,
    'allowed', 'JOB_ACCEPTED', p_correlation_id, now_at
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = jsonb_build_object(
    'status', 202,
    'jobRef', p_job_id::text,
    'resourceRef', format('/api/v1/jobs/%s', p_job_id)
  )
  where id = record.id;
  job_id := p_job_id;
  event_id := p_event_id;
  version := 1;
  replayed := false;
  return next;
end;
$$;

create or replace function platform_private.claim_job(
  p_job_id uuid, p_expected_version bigint, p_lease_token uuid, p_lease_seconds integer
)
returns table (job_id uuid, version bigint, state platform_private.job_state, lease_until timestamptz, attempt_count integer)
language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1
     or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid job lease request' using errcode = '22023';
  end if;
  if not platform_private.external_effects_allowed() then return; end if;
  return query
  update platform_private.jobs job
  set state = 'running', lease_until = now_at + pg_catalog.make_interval(secs => p_lease_seconds),
      lease_token = p_lease_token, attempt_count = job.attempt_count + 1,
      error_code = null, updated_at = now_at, version = job.version + 1,
      attempts = job.attempts || jsonb_build_array(jsonb_build_object(
        'attempt', job.attempt_count + 1, 'startedAt', now_at, 'endedAt', null,
        'outcome', 'running', 'errorCode', null, 'retryable', false))
  where job.id = p_job_id and job.version = p_expected_version
    and pg_catalog.jsonb_array_length(job.attempts) < 32
    and (job.state = 'queued' or (job.state = 'running' and (job.lease_until is null or job.lease_until <= now_at)))
  returning job.id, job.version, job.state, job.lease_until, job.attempt_count;
end;
$$;

create or replace function platform_private.apply_job_outcome(
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
  if p_job_id is null or p_expected_version is null or p_expected_version < 1 then
    raise exception 'invalid job outcome request' using errcode = '22023';
  end if;
  if p_next_state not in ('queued'::platform_private.job_state, 'succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or (p_next_state = 'queued'::platform_private.job_state and not p_retryable)
     or (p_next_state = 'succeeded'::platform_private.job_state and (p_result_ref is null or pg_catalog.jsonb_typeof(p_result_ref) = 'null' or p_error_code is not null))
     or (p_next_state in ('failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
       and (p_error_code is null or p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' or p_result_ref is not null)) then
    raise exception 'invalid job outcome' using errcode = '22023';
  end if;
  if p_next_state = 'failed'::platform_private.job_state and p_retryable then
    target := 'queued';
  end if;
  if not platform_private.external_effects_allowed() then return false; end if;
  update platform_private.jobs job
  set state = target,
      result_ref = case when target = 'succeeded'::platform_private.job_state then p_result_ref else null end,
      error_code = case when target = 'succeeded'::platform_private.job_state then null else p_error_code end,
      lease_until = null, lease_token = null, updated_at = now_at, version = job.version + 1,
      attempts = platform_private.record_attempt_outcome(
        job.attempts,
        case when target = 'queued'::platform_private.job_state then 'retryable' else target::text end,
        p_error_code, p_retryable, now_at
      )
  where job.id = p_job_id and job.version = p_expected_version
    and job.state = 'running' and (job.lease_until is null or job.lease_until > now_at);
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function platform_private.apply_job_outcome(
  p_job_id uuid, p_expected_version bigint, p_lease_token uuid,
  p_next_state platform_private.job_state, p_result_ref jsonb,
  p_error_code text, p_retryable boolean
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  target platform_private.job_state := p_next_state;
  affected integer;
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1
     or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_next_state is null or p_retryable is null
     or (p_result_ref is not null and pg_catalog.pg_column_size(p_result_ref) > 65536)
     or p_error_code is not null and p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
    raise exception 'invalid lease-token-aware job outcome request' using errcode = '22023';
  end if;
  if p_next_state not in ('queued'::platform_private.job_state, 'succeeded'::platform_private.job_state, 'failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
     or (p_next_state = 'queued'::platform_private.job_state and not p_retryable)
     or (p_next_state = 'succeeded'::platform_private.job_state and (p_result_ref is null or pg_catalog.jsonb_typeof(p_result_ref) = 'null' or p_error_code is not null))
     or (p_next_state in ('failed'::platform_private.job_state, 'cancelled'::platform_private.job_state)
       and (p_error_code is null or p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' or p_result_ref is not null)) then
    raise exception 'invalid lease-token-aware job outcome' using errcode = '22023';
  end if;
  if p_next_state = 'failed'::platform_private.job_state and p_retryable then
    target := 'queued';
  end if;
  if not platform_private.external_effects_allowed() then return false; end if;
  update platform_private.jobs job
  set state = target,
      result_ref = case when target = 'succeeded'::platform_private.job_state then p_result_ref else null end,
      error_code = case when target = 'succeeded'::platform_private.job_state then null else p_error_code end,
      lease_until = null, lease_token = null, updated_at = now_at, version = job.version + 1,
      attempts = platform_private.record_attempt_outcome(
        job.attempts,
        case when target = 'queued'::platform_private.job_state then 'retryable' else target::text end,
        p_error_code, p_retryable, now_at
      )
  where job.id = p_job_id and job.version = p_expected_version
    and job.state = 'running' and job.lease_token = p_lease_token
    and job.lease_until > now_at;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function platform_private.read_authorized_job(
  p_job_id uuid, p_actor_id uuid, p_acting_party_id uuid,
  p_capability text default null, p_step_up_verified boolean default false,
  p_reason text default null
)
returns table (
  job_id uuid, actor_id uuid, acting_party_id uuid, job_type text,
  state platform_private.job_state, progress jsonb, result_ref jsonb,
  error_code text, created_at timestamptz, updated_at timestamptz,
  version bigint, lease_until timestamptz
)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null or p_actor_id is null
     or (p_capability is not null and p_capability not in ('jobs.read', 'jobs.read:any'))
     or p_step_up_verified is null
     or p_reason is not null and (p_reason <> btrim(p_reason) or length(p_reason) not between 3 and 240) then
    raise exception 'invalid authorized job read request' using errcode = '22023';
  end if;
  return query
  select j.id, j.actor_id, j.acting_party_id, j.job_type, j.state,
    j.progress, j.result_ref, j.error_code, j.created_at, j.updated_at,
    j.version, j.lease_until
  from platform_private.jobs j
  where j.id = p_job_id
    and (
      j.actor_id = p_actor_id
      or (p_capability = 'jobs.read' and p_acting_party_id is not null and j.acting_party_id = p_acting_party_id)
      or (p_capability = 'jobs.read:any' and p_step_up_verified
        and p_reason is not null and p_reason = btrim(p_reason)
        and length(p_reason) between 3 and 240)
    )
  limit 1;
end;
$$;

-- Internal runtimes need a canonical job snapshot after a queue claim.  This
-- projection deliberately omits progress, result, error, and all other
-- mutable/private fields; callers must use the authorized projection for
-- user-facing reads.
create or replace function platform_private.read_canonical_job(p_job_id uuid)
returns table (
  id uuid, type text, state platform_private.job_state,
  version bigint, lease_until timestamptz
)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null then
    raise exception 'invalid canonical job read request' using errcode = '22023';
  end if;
  return query
  select j.id, j.job_type, j.state, j.version, j.lease_until
  from platform_private.jobs j
  where j.id = p_job_id
  limit 1;
end;
$$;

create or replace function platform_private.consume_job_read_rate_limit(
  p_user_id uuid, p_acting_party_id uuid,
  p_now_at timestamptz default clock_timestamp(),
  p_user_limit integer default 300, p_party_limit integer default 600
)
returns table (allowed boolean, limit_value integer, remaining integer, reset_at timestamptz, scope text)
language plpgsql security definer set search_path = ''
as $$
declare
  window_start timestamptz;
  reset_time timestamptz;
  user_count integer;
  party_count integer;
  selected_scope text;
  selected_limit integer;
begin
  if p_user_id is null or p_user_id = '00000000-0000-0000-0000-000000000000'::uuid
     or p_acting_party_id = '00000000-0000-0000-0000-000000000000'::uuid
     or p_now_at is null or p_user_limit <> 300 or p_party_limit <> 600 then
    raise exception 'invalid job read rate-limit request' using errcode = '22023';
  end if;
  window_start := date_trunc('minute', p_now_at);
  reset_time := window_start + interval '1 minute';
  insert into platform_private.job_read_rate_limits (scope, scope_id, window_started_at)
  values ('user', p_user_id, window_start)
  on conflict on constraint job_read_rate_limits_pkey do nothing;
  select r.request_count into user_count
  from platform_private.job_read_rate_limits r
  where r.scope = 'user' and r.scope_id = p_user_id and r.window_started_at = window_start
  for update;
  if p_acting_party_id is not null then
    insert into platform_private.job_read_rate_limits (scope, scope_id, window_started_at)
    values ('party', p_acting_party_id, window_start)
    on conflict on constraint job_read_rate_limits_pkey do nothing;
    select r.request_count into party_count
    from platform_private.job_read_rate_limits r
    where r.scope = 'party' and r.scope_id = p_acting_party_id and r.window_started_at = window_start
    for update;
  end if;
  if user_count < p_user_limit and (p_acting_party_id is null or party_count < p_party_limit) then
    update platform_private.job_read_rate_limits as r
    set request_count = r.request_count + 1
    where r.scope = 'user' and r.scope_id = p_user_id and r.window_started_at = window_start;
    if p_acting_party_id is null then
      return query select true, p_user_limit, p_user_limit - user_count - 1, reset_time, 'user'::text;
    end if;
    update platform_private.job_read_rate_limits as r
    set request_count = r.request_count + 1
    where r.scope = 'party' and r.scope_id = p_acting_party_id and r.window_started_at = window_start;
    return query select true, p_party_limit, p_party_limit - party_count - 1, reset_time, 'party'::text;
    return;
  end if;
  if p_acting_party_id is not null and party_count >= p_party_limit then
    selected_scope := 'party';
    selected_limit := p_party_limit;
  else
    selected_scope := 'user';
    selected_limit := p_user_limit;
  end if;
  return query select false, selected_limit, 0, reset_time, selected_scope;
end;
$$;

create or replace function platform_private.claim_outbox_batch(
  p_lease_token uuid, p_lease_seconds integer, p_batch_size integer
)
returns table (
  event_id uuid, event_type text, schema_version integer, aggregate_type text,
  aggregate_id uuid, aggregate_version bigint, correlation_id uuid,
  causation_id uuid, lease_token uuid, dispatch_attempt_count integer
)
language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
begin
  if p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds not between 1 and 840 or p_batch_size not between 1 and 100 then
    raise exception 'invalid outbox batch lease request' using errcode = '22023';
  end if;
  if not platform_private.external_effects_allowed() then return; end if;
  return query
  with candidates as (
    select e.id
    from platform_private.outbox_events e
    where e.dispatched_at is null and e.dead_lettered_at is null
      and e.event_type = 'job.requested'
      and e.schema_version = 1
      and e.aggregate_type = 'job'
      and (e.dispatch_lease_until is null or e.dispatch_lease_until <= now_at)
    order by e.occurred_at, e.id
    for update skip locked
    limit p_batch_size
  ), claimed as (
    update platform_private.outbox_events e
    set dispatch_lease_token = p_lease_token,
        dispatch_lease_until = now_at + pg_catalog.make_interval(secs => p_lease_seconds),
        dispatch_attempt_count = e.dispatch_attempt_count + 1
    from candidates c
    where e.id = c.id
    returning e.id, e.event_type, e.schema_version, e.aggregate_type,
      e.aggregate_id, e.aggregate_version, e.correlation_id, e.causation_id,
      e.dispatch_lease_token, e.dispatch_attempt_count
  )
  select c.id, c.event_type, c.schema_version, c.aggregate_type,
    c.aggregate_id, c.aggregate_version, c.correlation_id, c.causation_id,
    c.dispatch_lease_token, c.dispatch_attempt_count
  from claimed c;
end;
$$;

create or replace function platform_private.heartbeat_job_lease(
  p_job_id uuid, p_expected_version bigint, p_lease_token uuid, p_lease_seconds integer
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  affected integer;
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1
     or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid job heartbeat request' using errcode = '22023';
  end if;
  if not platform_private.external_effects_allowed() then return false; end if;
  update platform_private.jobs j
  set lease_until = now_at + pg_catalog.make_interval(secs => p_lease_seconds),
      updated_at = now_at, version = j.version + 1
  where j.id = p_job_id and j.version = p_expected_version
    and j.state = 'running' and j.lease_token = p_lease_token
    and j.lease_until > now_at;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function platform_private.record_processed_event(
  p_event_id uuid, p_event_type text, p_schema_version integer,
  p_aggregate_id uuid, p_pending_manual_review boolean
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  affected integer;
  existing platform_private.processed_events;
begin
  if p_event_id is null or p_event_type is null or p_schema_version is null
     or p_aggregate_id is null or p_pending_manual_review is distinct from false
     or (p_event_type, p_schema_version) not in (
       ('job.requested', 1), ('object.uploaded', 1),
       ('provider.operation.requested', 1), ('webhook.accepted', 1)
     ) then
    raise exception 'invalid processed event request' using errcode = '22023';
  end if;
  insert into platform_private.processed_events (
    event_id, event_type, schema_version, aggregate_id, pending_manual_review
  )
  values (p_event_id, p_event_type, p_schema_version, p_aggregate_id, false)
  on conflict (event_id) do nothing;
  get diagnostics affected = row_count;
  if affected = 1 then return 'recorded'; end if;
  select * into existing
  from platform_private.processed_events e where e.event_id = p_event_id;
  if existing.event_type <> p_event_type
     or existing.schema_version <> p_schema_version
     or existing.aggregate_id <> p_aggregate_id then
    raise exception 'processed event identity conflict' using errcode = 'P0001';
  end if;
  return 'duplicate';
end;
$$;

-- These API functions expose only bounded projections/mutations.  No private
-- table, payload, or private helper is granted to any Data API role.
create or replace function platform_api.read_canonical_job(p_job_id uuid)
returns table (
  id uuid, type text, state platform_private.job_state,
  version bigint, lease_until timestamptz
)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null then
    raise exception 'invalid canonical job read adapter input' using errcode = '22023';
  end if;
  return query select * from platform_private.read_canonical_job(p_job_id) limit 1;
end;
$$;

create or replace function platform_api.apply_job_outcome(
  p_job_id uuid, p_expected_version bigint, p_lease_token uuid,
  p_next_state platform_private.job_state, p_result_ref jsonb,
  p_error_code text, p_retryable boolean
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1
     or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_next_state is null or p_retryable is null
     or (p_result_ref is not null and pg_catalog.pg_column_size(p_result_ref) > 65536)
     or p_error_code is not null and p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
    raise exception 'invalid lease-token-aware job outcome adapter input' using errcode = '22023';
  end if;
  return platform_private.apply_job_outcome(
    p_job_id, p_expected_version, p_lease_token, p_next_state,
    p_result_ref, p_error_code, p_retryable
  );
end;
$$;

create or replace function platform_api.read_authorized_job(
  p_job_id uuid, p_actor_id uuid, p_acting_party_id uuid,
  p_capability text default null, p_step_up_verified boolean default false,
  p_reason text default null
)
returns table (
  job_id uuid, actor_id uuid, acting_party_id uuid, job_type text,
  state platform_private.job_state, progress jsonb, result_ref jsonb,
  error_code text, created_at timestamptz, updated_at timestamptz,
  version bigint, lease_until timestamptz
)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null or p_actor_id is null then
    raise exception 'invalid authorized job read adapter input' using errcode = '22023';
  end if;
  return query
  select * from platform_private.read_authorized_job(
    p_job_id, p_actor_id, p_acting_party_id, p_capability, p_step_up_verified, p_reason
  ) limit 1;
end;
$$;

create or replace function platform_api.consume_job_read_rate_limit(
  p_user_id uuid, p_acting_party_id uuid
)
returns table (allowed boolean, limit_value integer, remaining integer, reset_at timestamptz, scope text)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_user_id is null or p_user_id = '00000000-0000-0000-0000-000000000000'::uuid
     or p_acting_party_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'invalid job read rate-limit adapter input' using errcode = '22023';
  end if;
  return query select * from platform_private.consume_job_read_rate_limit(
    p_user_id, p_acting_party_id
  ) limit 1;
end;
$$;

create or replace function platform_api.claim_outbox_batch(
  p_lease_token uuid, p_lease_seconds integer, p_batch_size integer
)
returns table (
  event_id uuid, event_type text, schema_version integer, aggregate_type text,
  aggregate_id uuid, aggregate_version bigint, correlation_id uuid,
  causation_id uuid, lease_token uuid, dispatch_attempt_count integer
)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds not between 1 and 840 or p_batch_size not between 1 and 100 then
    raise exception 'invalid outbox batch adapter input' using errcode = '22023';
  end if;
  return query select * from platform_private.claim_outbox_batch(
    p_lease_token, p_lease_seconds, p_batch_size
  ) limit 100;
end;
$$;

create or replace function platform_api.complete_outbox_event(p_event_id uuid, p_lease_token uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if p_event_id is null or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'invalid outbox completion adapter input' using errcode = '22023';
  end if;
  return platform_private.complete_outbox_event(p_event_id, p_lease_token);
end;
$$;

create or replace function platform_api.heartbeat_job_lease(
  p_job_id uuid, p_expected_version bigint, p_lease_token uuid, p_lease_seconds integer
)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1
     or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid job heartbeat adapter input' using errcode = '22023';
  end if;
  return platform_private.heartbeat_job_lease(
    p_job_id, p_expected_version, p_lease_token, p_lease_seconds
  );
end;
$$;

create or replace function platform_api.record_processed_event(
  p_event_id uuid, p_event_type text, p_schema_version integer,
  p_aggregate_id uuid, p_pending_manual_review boolean
)
returns text language plpgsql security definer set search_path = ''
as $$
begin
  if p_event_id is null or p_event_type is null or p_schema_version is null
     or p_aggregate_id is null or p_pending_manual_review is distinct from false
     or (p_event_type, p_schema_version) not in (
       ('job.requested', 1), ('object.uploaded', 1),
       ('provider.operation.requested', 1), ('webhook.accepted', 1)
     ) then
    raise exception 'invalid processed event adapter input' using errcode = '22023';
  end if;
  return platform_private.record_processed_event(
    p_event_id, p_event_type, p_schema_version, p_aggregate_id, p_pending_manual_review
  );
end;
$$;

revoke all on function platform_private.read_canonical_job(uuid) from public, anon, authenticated, service_role;
revoke all on function platform_private.read_authorized_job(uuid, uuid, uuid, text, boolean, text) from public, anon, authenticated, service_role;
revoke all on function platform_private.consume_job_read_rate_limit(uuid, uuid, timestamptz, integer, integer) from public, anon, authenticated, service_role;
revoke all on function platform_private.claim_outbox_batch(uuid, integer, integer) from public, anon, authenticated, service_role;
revoke all on function platform_private.heartbeat_job_lease(uuid, bigint, uuid, integer) from public, anon, authenticated, service_role;
revoke all on function platform_private.record_processed_event(uuid, text, integer, uuid, boolean) from public, anon, authenticated, service_role;
revoke all on function platform_private.apply_job_outcome(uuid, bigint, platform_private.job_state, jsonb, text, boolean) from public, anon, authenticated, service_role;
revoke all on function platform_private.apply_job_outcome(uuid, bigint, uuid, platform_private.job_state, jsonb, text, boolean) from public, anon, authenticated, service_role;

revoke all on function platform_api.read_canonical_job(uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_job_outcome(uuid, bigint, platform_private.job_state, jsonb, text, boolean) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_job_outcome(uuid, bigint, uuid, platform_private.job_state, jsonb, text, boolean) from public, anon, authenticated, service_role;
revoke all on function platform_api.read_authorized_job(uuid, uuid, uuid, text, boolean, text) from public, anon, authenticated, service_role;
revoke all on function platform_api.consume_job_read_rate_limit(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.claim_outbox_batch(uuid, integer, integer) from public, anon, authenticated, service_role;
revoke all on function platform_api.complete_outbox_event(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.heartbeat_job_lease(uuid, bigint, uuid, integer) from public, anon, authenticated, service_role;
revoke all on function platform_api.record_processed_event(uuid, text, integer, uuid, boolean) from public, anon, authenticated, service_role;

grant execute on function platform_private.apply_job_outcome(uuid, bigint, uuid, platform_private.job_state, jsonb, text, boolean) to service_role;
grant execute on function platform_api.read_canonical_job(uuid) to service_role;
grant execute on function platform_api.apply_job_outcome(uuid, bigint, uuid, platform_private.job_state, jsonb, text, boolean) to service_role;
grant execute on function platform_api.read_authorized_job(uuid, uuid, uuid, text, boolean, text) to service_role;
grant execute on function platform_api.consume_job_read_rate_limit(uuid, uuid) to service_role;
grant execute on function platform_api.claim_outbox_batch(uuid, integer, integer) to service_role;
grant execute on function platform_api.complete_outbox_event(uuid, uuid) to service_role;
grant execute on function platform_api.heartbeat_job_lease(uuid, bigint, uuid, integer) to service_role;
grant execute on function platform_api.record_processed_event(uuid, text, integer, uuid, boolean) to service_role;

commit;

-- Rollback policy: forward-only compensating migration. Runtime records and
-- audit evidence are never removed by an automated rollback.
