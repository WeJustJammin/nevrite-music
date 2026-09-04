begin;

-- The runtime job gate is closed by default; this reviewed merge executor is
-- the sole asynchronous consumer introduced by the account-control slice.
insert into platform_private.job_type_registry(job_type)
values ('identity.account.merge')
on conflict (job_type) do nothing;

-- Login identities and merge cases are application authorization records.  The
-- Supabase Auth tables remain the credential and provider-identity authority;
-- these tables contain only bounded projections, keyed digests, and workflow
-- state needed by the protected RPC boundary.
create type identity.login_identity_state as enum
  ('link_pending', 'linked', 'reconciling', 'unlinked', 'failed');
create type identity.merge_state as enum
  ('awaiting_duplicate_proof', 'analyzing', 'awaiting_confirmation', 'queued',
   'running', 'completed', 'manual_review', 'expired');

create table identity.login_identity_registry (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null check (provider in ('email', 'google', 'apple', 'facebook', 'soundcloud')),
  provider_subject_digest bytea not null check (octet_length(provider_subject_digest) = 32),
  state identity.login_identity_state not null default 'link_pending',
  label text not null check (char_length(label) between 1 and 80),
  verified_at timestamptz,
  linked_at timestamptz,
  last_used_at timestamptz,
  unlinked_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state <> 'linked' or linked_at is not null),
  check (state <> 'unlinked' or unlinked_at is not null)
);

create unique index login_identity_subject_active_uq
  on identity.login_identity_registry(provider, provider_subject_digest)
  where state in ('link_pending', 'linked', 'reconciling');
create index login_identity_user_state_idx
  on identity.login_identity_registry(auth_user_id, state, created_at desc);
create index login_identity_state_updated_idx
  on identity.login_identity_registry(state, updated_at desc);

create table identity.account_merge_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  survivor_auth_user_id uuid not null references auth.users(id) on delete restrict,
  duplicate_auth_user_id uuid references auth.users(id) on delete restrict,
  survivor_person_id uuid not null references platform_private.party(id) on delete restrict,
  duplicate_person_id uuid references platform_private.party(id) on delete restrict,
  state identity.merge_state not null default 'awaiting_duplicate_proof',
  proof_at timestamptz,
  conflict_plan_version bigint check (conflict_plan_version is null or conflict_plan_version > 0),
  expires_at timestamptz not null,
  job_id uuid references platform_private.jobs(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at <= created_at + interval '30 minutes'),
  check ((duplicate_auth_user_id is null) = (duplicate_person_id is null)),
  check (state not in ('analyzing', 'awaiting_confirmation', 'queued', 'running', 'completed', 'manual_review')
    or (duplicate_auth_user_id is not null and duplicate_person_id is not null)),
  check (state <> 'completed' or job_id is not null)
);

create unique index account_merge_active_survivor_uq
  on identity.account_merge_cases(survivor_auth_user_id)
  where state not in ('completed', 'expired');
create index account_merge_state_expiry_idx
  on identity.account_merge_cases(state, expires_at, updated_at desc);
create index account_merge_survivor_idx
  on identity.account_merge_cases(survivor_auth_user_id, created_at desc);

create table identity.account_merge_conflicts (
  id uuid primary key default extensions.gen_random_uuid(),
  merge_id uuid not null references identity.account_merge_cases(id) on delete restrict,
  domain text not null check (domain = btrim(domain) and char_length(domain) between 1 and 80),
  code text not null check (code = btrim(code) and code ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  safe_summary text not null check (char_length(safe_summary) between 1 and 500),
  state text not null default 'open' check (state in ('open', 'resolved', 'blocked')),
  resolution_ref uuid,
  resolved_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'resolved') = (resolved_at is not null)),
  unique (merge_id, domain, code)
);

create index account_merge_conflicts_state_idx
  on identity.account_merge_conflicts(merge_id, state, id);

create table identity.account_redirects (
  id uuid primary key default extensions.gen_random_uuid(),
  retired_auth_user_id uuid not null references auth.users(id) on delete restrict,
  survivor_auth_user_id uuid not null references auth.users(id) on delete restrict,
  retired_person_id uuid not null references platform_private.party(id) on delete restrict,
  survivor_person_id uuid not null references platform_private.party(id) on delete restrict,
  merge_id uuid not null references identity.account_merge_cases(id) on delete restrict,
  audit_id uuid not null references audit_private.audit_events(id) on delete restrict,
  permanent boolean not null default true check (permanent),
  created_at timestamptz not null default now(),
  check (retired_auth_user_id <> survivor_auth_user_id)
);

create unique index account_redirect_retired_user_uq
  on identity.account_redirects(retired_auth_user_id);
create unique index account_redirect_retired_person_uq
  on identity.account_redirects(retired_person_id);
create index account_redirect_survivor_user_idx
  on identity.account_redirects(survivor_auth_user_id, created_at desc);
create index account_redirect_merge_idx
  on identity.account_redirects(merge_id, created_at desc);

alter table identity.auth_intents
  add constraint auth_intents_merge_fk
  foreign key (merge_id) references identity.account_merge_cases(id) on delete restrict;

alter table identity.login_identity_registry enable row level security;
alter table identity.login_identity_registry force row level security;
alter table identity.account_merge_cases enable row level security;
alter table identity.account_merge_cases force row level security;
alter table identity.account_merge_conflicts enable row level security;
alter table identity.account_merge_conflicts force row level security;
alter table identity.account_redirects enable row level security;
alter table identity.account_redirects force row level security;

revoke all on table
  identity.login_identity_registry,
  identity.account_merge_cases,
  identity.account_merge_conflicts,
  identity.account_redirects
from public, anon, authenticated, service_role;

-- Fixed-schema security-definer helper.  It is intentionally not executable
-- by any client role; only the named platform_api wrappers below are granted.
create function platform_private.auth_require_active_session(
  p_auth_user_id uuid,
  p_session_id uuid
)
returns table(binding_id uuid, person_id uuid, binding_version bigint)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_auth_user_id is null or p_session_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  return query
    select binding.id, binding.person_id, binding.version
    from identity.auth_session_index session_row
    join identity.auth_user_bindings binding
      on binding.auth_user_id = session_row.auth_user_id
    where session_row.session_id = p_session_id
      and session_row.auth_user_id = p_auth_user_id
      and session_row.state = 'active'
      and binding.state = 'active';
  if not found then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
end;
$$;

create function platform_private.auth_reserve_idempotency(
  p_actor_id uuid,
  p_operation text,
  p_key_hash bytea,
  p_request_hash bytea,
  p_expires_at timestamptz
)
returns platform_private.idempotency_records
language plpgsql security definer set search_path = ''
as $$
declare
  record platform_private.idempotency_records;
begin
  if p_actor_id is null or p_operation is null or p_operation !~ '^AUTH-API-(0[1-9]|1[0-5])$'
     or p_key_hash is null or octet_length(p_key_hash) <> 32
     or p_request_hash is null or octet_length(p_request_hash) <> 32
     or p_expires_at is null or p_expires_at <= clock_timestamp() then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  insert into platform_private.idempotency_records(
    actor_id, operation, key_hash, request_hash, expires_at
  ) values (
    p_actor_id, p_operation, p_key_hash, p_request_hash, p_expires_at
  ) on conflict (actor_id, operation, key_hash) do nothing;
  select * into record
  from platform_private.idempotency_records
  where actor_id = p_actor_id and operation = p_operation and key_hash = p_key_hash
  for update;
  if record.request_hash <> p_request_hash then
    raise exception 'IDEMPOTENCY_MISMATCH' using errcode = 'P0001';
  end if;
  if record.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
    set state = 'reserved', response_ref = null
    where id = record.id;
    select * into record from platform_private.idempotency_records where id = record.id;
  end if;
  return record;
end;
$$;

create function platform_private.auth_iso_time(p_value timestamptz)
returns text
language sql immutable
set search_path = ''
as $$
  select case
    when p_value is null then null
    else pg_catalog.to_char(
      p_value at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    )
  end
$$;

create function platform_private.auth_login_methods_projection(p_auth_user_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'methods', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', method.id,
          'provider', method.provider,
          'label', method.label,
          'verifiedAt', platform_private.auth_iso_time(method.verified_at),
          'lastUsedAt', platform_private.auth_iso_time(method.last_used_at),
          -- The final verified identity is the recovery floor and cannot be
          -- removed.  Compute this from the same projection set so a stale
          -- client cannot make the decision by supplying a count.
          'removable', (
            select count(*) > 1
            from identity.login_identity_registry remaining
            where remaining.auth_user_id = p_auth_user_id
              and remaining.state in ('linked', 'reconciling')
              and remaining.verified_at is not null
          )
        ) order by method.provider, method.created_at, method.id
      )
      from identity.login_identity_registry method
      where method.auth_user_id = p_auth_user_id
        and method.state in ('linked', 'reconciling')
        and method.verified_at is not null
    ), '[]'::jsonb),
    'recoveryBaselinePresent', exists (
      select 1 from identity.login_identity_registry recovery
      where recovery.auth_user_id = p_auth_user_id
        and recovery.provider = 'email'
        and recovery.state in ('linked', 'reconciling')
        and recovery.verified_at is not null
    ),
    'version', coalesce((
      select binding.version::text
      from identity.auth_user_bindings binding
      where binding.auth_user_id = p_auth_user_id
    ), '1')
  )
$$;

create function platform_private.auth_merge_projection(p_merge_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'mergeId', merge_case.id,
    'state', merge_case.state::text,
    'expiresAt', platform_private.auth_iso_time(merge_case.expires_at),
    'conflictPlanVersion', merge_case.conflict_plan_version,
    'jobId', merge_case.job_id,
    'version', merge_case.version::text
  )
  from identity.account_merge_cases merge_case
  where merge_case.id = p_merge_id
$$;

create function platform_api.auth_login_methods_read(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
begin
  if p_request_id is null or p_correlation_id is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  return platform_private.auth_login_methods_projection(p_auth_user_id);
end;
$$;

create function platform_api.auth_login_method_link_intent_create(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_provider text,
  p_return_path text,
  p_state_digest bytea,
  p_nonce_digest bytea,
  p_pkce_verifier_digest bytea,
  p_expires_at timestamptz,
  p_expected_version bigint,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
  idempotency platform_private.idempotency_records;
  replay_intent identity.auth_intents%rowtype;
  created_at timestamptz := clock_timestamp();
  expires_at timestamptz := least(p_expires_at, created_at + interval '10 minutes');
  intent_id uuid := extensions.gen_random_uuid();
  registry identity.auth_provider_registry%rowtype;
begin
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  if p_request_id is null or p_correlation_id is null or p_expected_version is null
     or p_expected_version < 1
     or p_state_digest is null or octet_length(p_state_digest) <> 32
     or p_nonce_digest is null or octet_length(p_nonce_digest) <> 32
     or p_pkce_verifier_digest is null or octet_length(p_pkce_verifier_digest) <> 32
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '10 minutes'
     or p_return_path is null or char_length(p_return_path) not between 1 and 512
     or p_return_path !~ '^/(|account|app|auth|settings|system)(/|\?|#|$)'
     or p_return_path ~ '[[:cntrl:]]' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  idempotency := platform_private.auth_reserve_idempotency(
    p_auth_user_id, 'AUTH-API-10', p_key_hash, p_request_hash,
    clock_timestamp() + interval '30 days'
  );
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into replay_intent
    from identity.auth_intents intent
    where intent.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if not found then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    return pg_catalog.jsonb_build_object(
      'intentId', idempotency.response_ref->>'resourceRef',
      'expiresAt', platform_private.auth_iso_time(replay_intent.expires_at),
      'replayed', true
    );
  end if;
  if session_record.binding_version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  select * into registry
  from identity.auth_provider_registry
  where code = p_provider and available_in_catalog and setup_verified
    and launch_state in ('enabled', 'conditional');
  if not found then
    raise exception 'PROVIDER_NOT_AVAILABLE' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from identity.login_identity_registry linked
    where linked.auth_user_id = p_auth_user_id
      and linked.provider = p_provider
      and linked.state in ('link_pending', 'linked', 'reconciling')
  ) then
    raise exception 'PROVIDER_ALREADY_LINKED' using errcode = 'P0001';
  end if;
  insert into identity.auth_intents(
    id, state_digest, intent, provider, auth_user_id, session_id,
    return_path, nonce_digest, pkce_verifier_digest, expires_at,
    state, consumed_at, failed_at, version, created_at, updated_at
  ) values (
    intent_id, p_state_digest, 'link', p_provider, p_auth_user_id, p_session_id,
    p_return_path, p_nonce_digest, p_pkce_verifier_digest, expires_at,
    'pending', null, null, 1, created_at, created_at
  );
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome,
    reason_code, request_id, correlation_id
  ) values (
    'identity.login-method.link-intent', p_auth_user_id, p_session_id, p_provider,
    'pending', 'LOGIN_METHOD_LINK_PENDING', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.login-method.intent.created.v1', 1, 'auth_intent', intent_id, 1,
    p_correlation_id, pg_catalog.jsonb_build_object('intentId', intent_id, 'authBindingId', session_record.binding_id)
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
    'status', 201, 'resourceRef', intent_id::text
  ) where id = idempotency.id;
  return pg_catalog.jsonb_build_object(
    'intentId', intent_id,
    'expiresAt', platform_private.auth_iso_time(expires_at)
  );
end;
$$;

create function platform_api.auth_login_method_unlink(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_identity_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
  identity_record identity.login_identity_registry%rowtype;
  idempotency platform_private.idempotency_records;
  active_count integer;
begin
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  if p_request_id is null or p_correlation_id is null or p_identity_id is null
     or p_expected_version is null or p_expected_version < 1
     or p_reason not in ('user_request', 'provider_compromise') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  idempotency := platform_private.auth_reserve_idempotency(
    p_auth_user_id, 'AUTH-API-11', p_key_hash, p_request_hash,
    clock_timestamp() + interval '30 days'
  );
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return platform_private.auth_login_methods_projection(p_auth_user_id);
  end if;
  if session_record.binding_version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  select * into identity_record
  from identity.login_identity_registry candidate
  where candidate.id = p_identity_id
    and candidate.auth_user_id = p_auth_user_id
    and candidate.state in ('linked', 'reconciling')
    and candidate.verified_at is not null
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if identity_record.state = 'reconciling' then
    raise exception 'LOGIN_METHOD_RECONCILING' using errcode = 'P0001';
  end if;
  select count(*) into active_count
  from identity.login_identity_registry candidate
  where candidate.auth_user_id = p_auth_user_id
    and candidate.state = 'linked'
    and candidate.verified_at is not null;
  if active_count <= 1 then
    raise exception 'FINAL_LOGIN_METHOD' using errcode = 'P0001';
  end if;
  update identity.login_identity_registry
  set state = 'reconciling', unlinked_at = null, version = version + 1,
      updated_at = clock_timestamp()
  where id = identity_record.id;
  update identity.auth_user_bindings
  set version = version + 1, updated_at = clock_timestamp()
  where id = session_record.binding_id and version = p_expected_version;
  if not found then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  perform platform_private.create_provider_operation(
    identity_record.provider,
    'identity_unlink',
    p_auth_user_id,
    p_request_hash,
    p_key_hash,
    p_correlation_id,
    session_record.person_id,
    p_request_id,
    extensions.gen_random_uuid()
  );
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'identity.login-method.unlink', p_auth_user_id, session_record.person_id,
    'login_identity', identity_record.id, 'allowed', 'LOGIN_METHOD_UNLINK_PENDING', p_correlation_id
  );
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome,
    reason_code, request_id, correlation_id
  ) values (
    'identity.login-method.unlink', p_auth_user_id, p_session_id, identity_record.provider,
    'pending', 'LOGIN_METHOD_UNLINK_PENDING', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.login-method.changed.v1', 1, 'login_identity', identity_record.id,
    identity_record.version + 1, p_correlation_id,
    pg_catalog.jsonb_build_object('loginIdentityId', identity_record.id, 'authBindingId', session_record.binding_id)
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
    'status', 200, 'resourceRef', identity_record.id::text
  ) where id = idempotency.id;
  return platform_private.auth_login_methods_projection(p_auth_user_id);
end;
$$;

create function platform_api.auth_callback_fail(
  p_state_digest bytea,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  intent_record identity.auth_intents%rowtype;
  failure_time timestamptz := clock_timestamp();
begin
  if p_state_digest is null or octet_length(p_state_digest) <> 32
     or p_reason not in ('PROVIDER_ERROR', 'PROVIDER_EXCHANGE_FAILED', 'TOKEN_INVALID')
     or p_request_id is null or p_correlation_id is null then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  update identity.auth_intents intent
  set state = case
        when intent.expires_at <= failure_time then 'expired'::identity.auth_intent_state
        else 'failed'::identity.auth_intent_state
      end,
      failed_at = failure_time, version = intent.version + 1, updated_at = failure_time
  where intent.state_digest = p_state_digest and intent.state = 'pending'
  returning intent.* into intent_record;
  if not found then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome,
    reason_code, request_id, correlation_id
  ) values (
    'identity.auth.callback-failed', intent_record.auth_user_id,
    intent_record.session_id, intent_record.provider, 'failed', p_reason,
    p_request_id, p_correlation_id
  );
  return pg_catalog.jsonb_build_object('failed', true);
end;
$$;

create function platform_api.auth_login_method_link_callback_complete(
  p_state_digest bytea,
  p_provider text,
  p_callback_auth_user_id uuid,
  p_provider_subject_digest bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  intent_record identity.auth_intents%rowtype;
  session_record record;
  identity_record identity.login_identity_registry%rowtype;
  identity_exists boolean;
  login_identity_id uuid := extensions.gen_random_uuid();
  changed_at timestamptz := clock_timestamp();
begin
  if p_state_digest is null or octet_length(p_state_digest) <> 32
     or p_provider is null or p_callback_auth_user_id is null
     or p_provider_subject_digest is null or octet_length(p_provider_subject_digest) <> 32
     or p_request_id is null or p_correlation_id is null then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  select * into intent_record
  from identity.auth_intents intent
  where intent.state_digest = p_state_digest
  for update;
  if not found or intent_record.state <> 'pending'
     or intent_record.expires_at <= changed_at
     or intent_record.intent <> 'link'
     or intent_record.provider <> p_provider
     or intent_record.auth_user_id is null
     or intent_record.session_id is null
     or intent_record.auth_user_id <> p_callback_auth_user_id then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  select * into session_record from platform_private.auth_require_active_session(
    intent_record.auth_user_id, intent_record.session_id
  );
  select * into identity_record
  from identity.login_identity_registry candidate
  where candidate.provider = p_provider
    and candidate.provider_subject_digest = p_provider_subject_digest
    and candidate.state in ('link_pending', 'linked', 'reconciling')
  for update;
  identity_exists := found;
  if identity_exists and identity_record.auth_user_id <> intent_record.auth_user_id then
    raise exception 'LOGIN_IDENTITY_CONFLICT' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from identity.login_identity_registry candidate
    where candidate.auth_user_id = intent_record.auth_user_id
      and candidate.provider = p_provider
      and candidate.state in ('link_pending', 'linked', 'reconciling')
      and (not identity_exists or candidate.id <> identity_record.id)
  ) then
    raise exception 'PROVIDER_ALREADY_LINKED' using errcode = 'P0001';
  end if;
  if identity_exists then
    login_identity_id := identity_record.id;
    update identity.login_identity_registry
    set state = 'linked', verified_at = coalesce(verified_at, changed_at),
        linked_at = coalesce(linked_at, changed_at), unlinked_at = null,
        version = version + 1, updated_at = changed_at
    where id = login_identity_id;
  else
    insert into identity.login_identity_registry(
      id, auth_user_id, provider, provider_subject_digest, state, label,
      verified_at, linked_at, created_at, updated_at
    ) values (
      login_identity_id, intent_record.auth_user_id, p_provider,
      p_provider_subject_digest, 'linked', pg_catalog.initcap(p_provider),
      changed_at, changed_at, changed_at, changed_at
    );
  end if;
  update identity.auth_user_bindings
  set version = version + 1, updated_at = changed_at
  where id = session_record.binding_id;
  update identity.auth_intents
  set state = 'consumed', consumed_at = changed_at, version = version + 1,
      updated_at = changed_at
  where id = intent_record.id and state = 'pending';
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome,
    reason_code, request_id, correlation_id
  ) values (
    'identity.login-method.link-callback', intent_record.auth_user_id,
    intent_record.session_id, p_provider, 'completed', 'LOGIN_METHOD_LINKED',
    p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.login-method.changed.v1', 1, 'login_identity', login_identity_id,
    coalesce(identity_record.version, 0) + 1, p_correlation_id,
    pg_catalog.jsonb_build_object(
      'loginIdentityId', login_identity_id,
      'authBindingId', session_record.binding_id
    )
  );
  return pg_catalog.jsonb_build_object('returnPath', intent_record.return_path);
end;
$$;

create function platform_api.auth_account_merge_proof_callback_complete(
  p_state_digest bytea,
  p_provider text,
  p_callback_auth_user_id uuid,
  p_provider_subject_digest bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  intent_record identity.auth_intents%rowtype;
  merge_record identity.account_merge_cases%rowtype;
  session_record record;
  duplicate_binding record;
  identity_record identity.login_identity_registry%rowtype;
  identity_exists boolean;
  changed_at timestamptz := clock_timestamp();
begin
  if p_state_digest is null or octet_length(p_state_digest) <> 32
     or p_provider is null or p_callback_auth_user_id is null
     or p_provider_subject_digest is null or octet_length(p_provider_subject_digest) <> 32
     or p_request_id is null or p_correlation_id is null then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  select * into intent_record
  from identity.auth_intents intent
  where intent.state_digest = p_state_digest
  for update;
  if not found or intent_record.state <> 'pending'
     or intent_record.expires_at <= changed_at
     or intent_record.intent <> 'prove_merge'
     or intent_record.provider <> p_provider
     or intent_record.auth_user_id is null
     or intent_record.session_id is null
     or intent_record.merge_id is null then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  if intent_record.auth_user_id = p_callback_auth_user_id then
    raise exception 'SAME_ACCOUNT' using errcode = 'P0001';
  end if;
  select * into session_record from platform_private.auth_require_active_session(
    intent_record.auth_user_id, intent_record.session_id
  );
  select * into merge_record
  from identity.account_merge_cases merge_case
  where merge_case.id = intent_record.merge_id
    and merge_case.survivor_auth_user_id = intent_record.auth_user_id
  for update;
  if not found or merge_record.state <> 'awaiting_duplicate_proof'
     or merge_record.expires_at <= changed_at then
    raise exception 'MERGE_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  select * into identity_record
  from identity.login_identity_registry candidate
  where candidate.provider = p_provider
    and candidate.provider_subject_digest = p_provider_subject_digest
    and candidate.state in ('link_pending', 'linked', 'reconciling')
  for update;
  identity_exists := found;
  if identity_exists and identity_record.auth_user_id <> p_callback_auth_user_id then
    raise exception 'LOGIN_IDENTITY_CONFLICT' using errcode = 'P0001';
  end if;
  if identity_exists and identity_record.auth_user_id = intent_record.auth_user_id then
    raise exception 'LOGIN_IDENTITY_CONFLICT' using errcode = 'P0001';
  end if;
  select * into duplicate_binding
  from platform_private.bootstrap_auth_user(
    p_callback_auth_user_id, p_request_id, p_correlation_id
  );
  if not identity_exists then
    insert into identity.login_identity_registry(
      auth_user_id, provider, provider_subject_digest, state, label,
      verified_at, linked_at, created_at, updated_at
    ) values (
      p_callback_auth_user_id, p_provider, p_provider_subject_digest, 'linked',
      pg_catalog.initcap(p_provider), changed_at, changed_at, changed_at, changed_at
    );
  end if;
  update identity.account_merge_cases
  set duplicate_auth_user_id = p_callback_auth_user_id,
      duplicate_person_id = duplicate_binding.person_id,
      state = 'analyzing', proof_at = changed_at,
      version = version + 1, updated_at = changed_at
  where id = merge_record.id and version = merge_record.version;
  if not found then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  update identity.auth_intents
  set state = 'consumed', consumed_at = changed_at, version = version + 1,
      updated_at = changed_at
  where id = intent_record.id and state = 'pending';
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome,
    reason_code, request_id, correlation_id
  ) values (
    'identity.account-merge.proof-callback', intent_record.auth_user_id,
    intent_record.session_id, p_provider, 'completed', 'MERGE_DUPLICATE_PROVED',
    p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.account-merge.changed.v1', 1, 'account_merge', merge_record.id,
    merge_record.version + 1, p_correlation_id,
    pg_catalog.jsonb_build_object(
      'mergeId', merge_record.id,
      'survivorPersonId', merge_record.survivor_person_id,
      'duplicatePersonId', duplicate_binding.person_id
    )
  );
  return pg_catalog.jsonb_build_object('returnPath', intent_record.return_path);
end;
$$;

create function platform_api.auth_account_merge_create(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_return_path text,
  p_expected_version bigint,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
  idempotency platform_private.idempotency_records;
  merge_id uuid := extensions.gen_random_uuid();
  created_time timestamptz := clock_timestamp();
  expires_at timestamptz := created_time + interval '30 minutes';
begin
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  if p_request_id is null or p_correlation_id is null or p_expected_version is null
     or p_expected_version < 1
     or p_return_path is null or char_length(p_return_path) not between 1 and 512
     or p_return_path !~ '^/(|account|app|auth|settings|system)(/|\?|#|$)'
     or p_return_path ~ '[[:cntrl:]]' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  idempotency := platform_private.auth_reserve_idempotency(
    p_auth_user_id, 'AUTH-API-12', p_key_hash, p_request_hash,
    clock_timestamp() + interval '30 days'
  );
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return platform_private.auth_merge_projection((idempotency.response_ref->>'resourceRef')::uuid);
  end if;
  if session_record.binding_version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  update identity.account_merge_cases existing
  set state = 'expired', version = existing.version + 1, updated_at = created_time
  where existing.survivor_auth_user_id = p_auth_user_id
    and existing.state not in ('completed', 'expired')
    and existing.expires_at <= created_at;
  if exists (
    select 1 from identity.account_merge_cases existing
    where existing.survivor_auth_user_id = p_auth_user_id
      and existing.state not in ('completed', 'expired')
  ) then
    raise exception 'MERGE_ALREADY_ACTIVE' using errcode = 'P0001';
  end if;
  insert into identity.account_merge_cases(
    id, survivor_auth_user_id, survivor_person_id, state, expires_at,
    created_at, updated_at
  ) values (
    merge_id, p_auth_user_id, session_record.person_id, 'awaiting_duplicate_proof',
    expires_at, created_time, created_time
  );
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'identity.account-merge.create', p_auth_user_id, session_record.person_id,
    'account_merge', merge_id, 'allowed', 'MERGE_CASE_CREATED', p_correlation_id
  );
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, safe_outcome, reason_code,
    request_id, correlation_id
  ) values (
    'identity.account-merge.create', p_auth_user_id, p_session_id, 'pending',
    'MERGE_CASE_CREATED', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.account-merge.changed.v1', 1, 'account_merge', merge_id, 1,
    p_correlation_id, pg_catalog.jsonb_build_object(
      'mergeId', merge_id, 'survivorPersonId', session_record.person_id,
      'duplicatePersonId', null
    )
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
    'status', 201, 'resourceRef', merge_id::text
  ) where id = idempotency.id;
  return platform_private.auth_merge_projection(merge_id);
end;
$$;

create function platform_api.auth_account_merge_read(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_merge_id uuid,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
begin
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  if p_request_id is null or p_correlation_id is null or p_merge_id is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from identity.account_merge_cases merge_case
    where merge_case.id = p_merge_id and merge_case.survivor_auth_user_id = p_auth_user_id
  ) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  update identity.account_merge_cases merge_case
  set state = 'expired', version = merge_case.version + 1,
      updated_at = clock_timestamp()
  where merge_case.id = p_merge_id
    and merge_case.survivor_auth_user_id = p_auth_user_id
    and merge_case.state not in ('completed', 'expired')
    and merge_case.expires_at <= clock_timestamp();
  return platform_private.auth_merge_projection(p_merge_id);
end;
$$;

create function platform_api.auth_account_merge_proof_create(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_merge_id uuid,
  p_provider text,
  p_return_path text,
  p_state_digest bytea,
  p_nonce_digest bytea,
  p_pkce_verifier_digest bytea,
  p_expires_at timestamptz,
  p_expected_version bigint,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
  merge_record identity.account_merge_cases%rowtype;
  idempotency platform_private.idempotency_records;
  replay_intent identity.auth_intents%rowtype;
  created_at timestamptz := clock_timestamp();
  expires_at timestamptz := least(p_expires_at, created_at + interval '10 minutes');
  intent_id uuid := extensions.gen_random_uuid();
  registry identity.auth_provider_registry%rowtype;
begin
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  if p_request_id is null or p_correlation_id is null or p_merge_id is null
     or p_expected_version is null or p_expected_version < 1 or p_provider is null
     or p_return_path is null or char_length(p_return_path) not between 1 and 512
     or p_return_path !~ '^/(|account|app|auth|settings|system)(/|\?|#|$)'
     or p_return_path ~ '[[:cntrl:]]'
     or p_state_digest is null or octet_length(p_state_digest) <> 32
     or p_nonce_digest is null or octet_length(p_nonce_digest) <> 32
     or p_pkce_verifier_digest is null or octet_length(p_pkce_verifier_digest) <> 32
     or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '10 minutes' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  idempotency := platform_private.auth_reserve_idempotency(
    p_auth_user_id, 'AUTH-API-14', p_key_hash, p_request_hash,
    clock_timestamp() + interval '30 days'
  );
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into replay_intent
    from identity.auth_intents intent
    where intent.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if not found then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    return pg_catalog.jsonb_build_object(
      'intentId', idempotency.response_ref->>'resourceRef',
      'expiresAt', platform_private.auth_iso_time(replay_intent.expires_at),
      'replayed', true
    );
  end if;
  select * into merge_record
  from identity.account_merge_cases candidate
  where candidate.id = p_merge_id and candidate.survivor_auth_user_id = p_auth_user_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if merge_record.expires_at <= created_at then
    raise exception 'MERGE_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  if merge_record.version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if merge_record.state <> 'awaiting_duplicate_proof' then
    raise exception 'MERGE_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  select * into registry
  from identity.auth_provider_registry
  where code = p_provider and available_in_catalog and setup_verified
    and launch_state in ('enabled', 'conditional');
  if not found then
    raise exception 'PROVIDER_NOT_AVAILABLE' using errcode = 'P0001';
  end if;
  insert into identity.auth_intents(
    id, state_digest, intent, provider, auth_user_id, session_id, merge_id,
    return_path, nonce_digest, pkce_verifier_digest, expires_at,
    state, consumed_at, failed_at, version, created_at, updated_at
  ) values (
    intent_id, p_state_digest, 'prove_merge', p_provider, p_auth_user_id, p_session_id,
    p_merge_id, p_return_path, p_nonce_digest, p_pkce_verifier_digest, expires_at,
    'pending', null, null, 1, created_at, created_at
  );
  update identity.account_merge_cases
  set version = version + 1, updated_at = clock_timestamp()
  where id = p_merge_id and version = p_expected_version;
  if not found then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome, reason_code,
    request_id, correlation_id
  ) values (
    'identity.account-merge.proof-intent', p_auth_user_id, p_session_id, p_provider,
    'pending', 'MERGE_PROOF_PENDING', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.account-merge.proof-requested.v1', 1, 'account_merge', p_merge_id,
    merge_record.version + 1, p_correlation_id,
    pg_catalog.jsonb_build_object('mergeId', p_merge_id, 'authBindingId', session_record.binding_id)
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
    'status', 201, 'resourceRef', intent_id::text
  ) where id = idempotency.id;
  return pg_catalog.jsonb_build_object(
    'intentId', intent_id,
    'expiresAt', platform_private.auth_iso_time(expires_at)
  );
end;
$$;

create function platform_api.auth_account_merge_confirm(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_merge_id uuid,
  p_conflict_plan_version bigint,
  p_acknowledgements jsonb,
  p_expected_version bigint,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  session_record record;
  merge_record identity.account_merge_cases%rowtype;
  idempotency platform_private.idempotency_records;
  accepted record;
  acknowledgement text;
  job_row platform_private.jobs%rowtype;
  job_id uuid := extensions.gen_random_uuid();
  event_id uuid := extensions.gen_random_uuid();
  checked_at timestamptz := clock_timestamp();
begin
  select * into session_record
  from platform_private.auth_require_active_session(p_auth_user_id, p_session_id);
  if p_request_id is null or p_correlation_id is null or p_merge_id is null
     or p_expected_version is null or p_expected_version < 1
     or p_conflict_plan_version is null or p_conflict_plan_version < 1
     or p_acknowledgements is null or pg_catalog.jsonb_typeof(p_acknowledgements) <> 'array'
     or pg_catalog.jsonb_array_length(p_acknowledgements) not between 1 and 50 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  idempotency := platform_private.auth_reserve_idempotency(
    p_auth_user_id, 'AUTH-API-15', p_key_hash, p_request_hash,
    clock_timestamp() + interval '30 days'
  );
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into job_row from platform_private.jobs
    where id = (idempotency.response_ref->>'jobRef')::uuid;
    return pg_catalog.jsonb_build_object(
      'id', job_row.id, 'type', job_row.job_type, 'state', job_row.state::text,
      'progress', job_row.progress, 'resultRef', job_row.result_ref,
      'error', case when job_row.error_code is null then null else
        pg_catalog.jsonb_build_object('code', job_row.error_code, 'retryable', false) end,
      'createdAt', platform_private.auth_iso_time(job_row.created_at),
      'updatedAt', platform_private.auth_iso_time(job_row.updated_at)
    );
  end if;
  select * into merge_record
  from identity.account_merge_cases candidate
  where candidate.id = p_merge_id and candidate.survivor_auth_user_id = p_auth_user_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if merge_record.expires_at <= checked_at then
    raise exception 'MERGE_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  if merge_record.version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if merge_record.state <> 'awaiting_confirmation' then
    raise exception 'MERGE_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  if merge_record.conflict_plan_version is null
     or merge_record.conflict_plan_version <> p_conflict_plan_version then
    raise exception 'MERGE_PLAN_STALE' using errcode = 'P0001';
  end if;
  for acknowledgement in
    select element.value
    from pg_catalog.jsonb_array_elements_text(p_acknowledgements) as element(value)
  loop
    if char_length(acknowledgement) not between 1 and 64
       or not exists (
         select 1 from identity.account_merge_conflicts conflict
         where conflict.merge_id = p_merge_id and conflict.code = acknowledgement
       ) then
      raise exception 'ACKNOWLEDGEMENT_UNKNOWN' using errcode = 'P0001';
    end if;
  end loop;
  if exists (
    select 1 from identity.account_merge_conflicts conflict
    where conflict.merge_id = p_merge_id and conflict.state in ('open', 'blocked')
  ) then
    raise exception 'MERGE_CONFLICTS_UNRESOLVED' using errcode = 'P0001';
  end if;
  select * into accepted
  from platform_private.accept_job_with_outbox(
    p_auth_user_id, session_record.person_id, 'identity.account.merge', p_correlation_id,
    p_key_hash, p_request_hash, clock_timestamp() + interval '30 days', job_id, event_id
  );
  update identity.account_merge_cases
  set state = 'queued', job_id = accepted.job_id, version = version + 1,
      updated_at = clock_timestamp()
  where id = p_merge_id and version = p_expected_version;
  if not found then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'identity.account-merge.confirm', p_auth_user_id, session_record.person_id,
    'account_merge', p_merge_id, 'completed', 'MERGE_QUEUED', p_correlation_id
  );
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, safe_outcome, reason_code,
    request_id, correlation_id
  ) values (
    'identity.account-merge.confirm', p_auth_user_id, p_session_id, 'completed',
    'MERGE_QUEUED', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.account-merge.changed.v1', 1, 'account_merge', p_merge_id,
    merge_record.version + 1, p_correlation_id,
    pg_catalog.jsonb_build_object(
      'mergeId', p_merge_id, 'survivorPersonId', merge_record.survivor_person_id,
      'duplicatePersonId', merge_record.duplicate_person_id
    )
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
    'status', 202, 'jobRef', accepted.job_id, 'resourceRef', format('/api/v1/jobs/%s', accepted.job_id)
  ) where id = idempotency.id;
  select * into job_row from platform_private.jobs where id = accepted.job_id;
  return pg_catalog.jsonb_build_object(
    'id', job_row.id, 'type', job_row.job_type, 'state', job_row.state::text,
    'progress', job_row.progress, 'resultRef', job_row.result_ref,
    'error', null,
    'createdAt', platform_private.auth_iso_time(job_row.created_at),
    'updatedAt', platform_private.auth_iso_time(job_row.updated_at)
  );
end;
$$;

revoke all on function
  platform_private.auth_require_active_session(uuid, uuid),
  platform_private.auth_reserve_idempotency(uuid, text, bytea, bytea, timestamptz),
  platform_private.auth_iso_time(timestamptz),
  platform_private.auth_login_methods_projection(uuid),
  platform_private.auth_merge_projection(uuid)
from public, anon, authenticated, service_role;

revoke all on function
  platform_api.auth_login_methods_read(uuid, uuid, uuid, uuid),
  platform_api.auth_callback_fail(bytea, text, uuid, uuid),
  platform_api.auth_login_method_link_intent_create(uuid, uuid, text, text, bytea, bytea, bytea, timestamptz, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_login_method_link_callback_complete(bytea, text, uuid, bytea, uuid, uuid),
  platform_api.auth_login_method_unlink(uuid, uuid, uuid, text, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_account_merge_create(uuid, uuid, text, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_account_merge_read(uuid, uuid, uuid, uuid, uuid),
  platform_api.auth_account_merge_proof_create(uuid, uuid, uuid, text, text, bytea, bytea, bytea, timestamptz, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_account_merge_proof_callback_complete(bytea, text, uuid, bytea, uuid, uuid),
  platform_api.auth_account_merge_confirm(uuid, uuid, uuid, bigint, jsonb, bigint, bytea, bytea, uuid, uuid)
from public, anon, authenticated, service_role;

grant execute on function
  platform_api.auth_login_methods_read(uuid, uuid, uuid, uuid),
  platform_api.auth_callback_fail(bytea, text, uuid, uuid),
  platform_api.auth_login_method_link_intent_create(uuid, uuid, text, text, bytea, bytea, bytea, timestamptz, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_login_method_link_callback_complete(bytea, text, uuid, bytea, uuid, uuid),
  platform_api.auth_login_method_unlink(uuid, uuid, uuid, text, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_account_merge_create(uuid, uuid, text, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_account_merge_read(uuid, uuid, uuid, uuid, uuid),
  platform_api.auth_account_merge_proof_create(uuid, uuid, uuid, text, text, bytea, bytea, bytea, timestamptz, bigint, bytea, bytea, uuid, uuid),
  platform_api.auth_account_merge_proof_callback_complete(bytea, text, uuid, bytea, uuid, uuid),
  platform_api.auth_account_merge_confirm(uuid, uuid, uuid, bigint, jsonb, bigint, bytea, bytea, uuid, uuid)
to service_role;

commit;

-- Rollback policy: forward-only compensating migration.  Account merge
-- provenance and identity state are retained for reconciliation and audit.
