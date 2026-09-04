create schema if not exists identity;
revoke all on schema identity from public, anon, authenticated, service_role;

create type identity.account_state as enum
  ('claimed', 'active', 'suspended', 'memorialised', 'erasure_processing', 'retired');
create type identity.session_state as enum ('active', 'revoked', 'expired');
create type identity.auth_intent_state as enum ('pending', 'consumed', 'failed', 'expired');

create table platform_private.party (
  id uuid primary key default extensions.gen_random_uuid(),
  kind text not null check (kind in ('person', 'alias', 'organization')),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table platform_private.person_party (
  party_id uuid primary key references platform_private.party(id) on delete restrict,
  auth_user_id uuid unique references auth.users(id) on delete restrict,
  account_state text not null default 'claimed' check (
    account_state in ('shadow', 'claimed', 'active', 'suspended', 'memorialised', 'erasure_processing')
  ),
  public_profile_id uuid,
  legal_identity_id uuid,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((account_state = 'shadow' and auth_user_id is null) or account_state <> 'shadow'),
  check (account_state <> 'active' or auth_user_id is not null)
);

create table platform_private.acting_context_binding (
  id uuid primary key default extensions.gen_random_uuid(),
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  acting_party_id uuid not null references platform_private.party(id) on delete restrict,
  context_kind text not null check (context_kind in ('person', 'alias', 'organization', 'representation')),
  source_relationship_id uuid,
  client_binding_id text not null check (char_length(client_binding_id) between 1 and 128),
  state text not null default 'active' check (state in ('active', 'revoked', 'expired')),
  selected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  projection_version bigint not null default 1 check (projection_version > 0),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > selected_at)
);

create unique index one_active_context_binding_per_client
  on platform_private.acting_context_binding(person_id, client_binding_id)
  where state = 'active';
create index context_binding_person
  on platform_private.acting_context_binding(person_id, state, last_seen_at desc);

create table identity.auth_provider_registry (
  code text primary key check (code in ('email', 'google', 'apple', 'facebook', 'soundcloud', 'tiktok', 'bandlab')),
  label text not null check (char_length(label) between 1 and 80),
  adapter text not null check (adapter in ('supabase_passwordless', 'supabase_oidc', 'supabase_oauth2_custom', 'none')),
  launch_state text not null check (launch_state in ('enabled', 'setup_required', 'conditional', 'disabled', 'unsupported')),
  available_in_catalog boolean not null,
  setup_verified boolean not null default false,
  setup_version bigint not null default 1 check (setup_version > 0),
  updated_at timestamptz not null default now(),
  check (available_in_catalog = (code in ('email', 'google', 'apple', 'facebook', 'soundcloud'))),
  check ((launch_state in ('disabled', 'unsupported')) = (adapter = 'none'))
);

insert into identity.auth_provider_registry
  (code, label, adapter, launch_state, available_in_catalog, setup_verified)
values
  ('email', 'Email', 'supabase_passwordless', 'enabled', true, true),
  ('google', 'Google', 'supabase_oidc', 'setup_required', true, false),
  ('apple', 'Apple', 'supabase_oidc', 'setup_required', true, false),
  ('facebook', 'Facebook', 'supabase_oidc', 'setup_required', true, false),
  ('soundcloud', 'SoundCloud', 'supabase_oauth2_custom', 'conditional', true, false),
  ('tiktok', 'TikTok', 'none', 'disabled', false, false),
  ('bandlab', 'BandLab', 'none', 'unsupported', false, false);

create table identity.auth_user_bindings (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  person_id uuid not null unique references platform_private.person_party(party_id) on delete restrict,
  state identity.account_state not null default 'active',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index auth_user_bindings_state_updated
  on identity.auth_user_bindings(state, updated_at desc);

create table identity.auth_session_index (
  session_id uuid primary key,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  binding_id uuid references identity.auth_user_bindings(id) on delete restrict,
  state identity.session_state not null default 'active',
  issued_at timestamptz not null,
  last_seen_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text check (revocation_reason is null or char_length(revocation_reason) <= 160),
  version bigint not null default 1 check (version > 0),
  check ((state = 'active' and revoked_at is null) or state <> 'active')
);

create index auth_session_user_state
  on identity.auth_session_index(auth_user_id, state);
create index auth_session_state_seen
  on identity.auth_session_index(state, last_seen_at desc);

create table identity.auth_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  state_digest bytea not null unique check (octet_length(state_digest) = 32),
  intent text not null check (intent in ('sign_in', 'recovery', 'link', 'prove_merge')),
  provider text references identity.auth_provider_registry(code) on delete restrict,
  auth_user_id uuid references auth.users(id) on delete restrict,
  session_id uuid references identity.auth_session_index(session_id) on delete restrict,
  merge_id uuid,
  return_path text not null check (
    char_length(return_path) between 1 and 512 and
    return_path ~ '^/(|account|app|auth|settings|system)(/|\?|#|$)' and
    return_path !~ '[\\[:cntrl:]]'
  ),
  nonce_digest bytea not null check (octet_length(nonce_digest) = 32),
  pkce_verifier_digest bytea check (pkce_verifier_digest is null or octet_length(pkce_verifier_digest) = 32),
  expires_at timestamptz not null,
  state identity.auth_intent_state not null default 'pending',
  consumed_at timestamptz,
  failed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at <= created_at + interval '10 minutes'),
  check ((state = 'consumed') = (consumed_at is not null)),
  check ((state = 'failed') = (failed_at is not null))
);

create index auth_intents_state_expiry on identity.auth_intents(state, expires_at);
create index auth_intents_user_created on identity.auth_intents(auth_user_id, created_at desc);
create index auth_intents_merge on identity.auth_intents(merge_id) where merge_id is not null;

create table identity.auth_rate_limits (
  operation_id text not null check (operation_id ~ '^AUTH-API-(0[1-9]|1[0-5])$'),
  bucket_digest bytea not null check (octet_length(bucket_digest) = 32),
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count between 0 and 1000000),
  primary key (operation_id, bucket_digest, window_started_at)
);

create table identity.security_events (
  id uuid primary key default extensions.gen_random_uuid(),
  action text not null check (char_length(action) between 1 and 96),
  actor_auth_user_id uuid references auth.users(id) on delete restrict,
  session_id uuid references identity.auth_session_index(session_id) on delete restrict,
  provider text,
  safe_outcome text not null check (safe_outcome in ('allowed', 'denied', 'completed', 'failed', 'pending')),
  reason_code text not null check (reason_code ~ '^[A-Z][A-Z0-9_.-]{0,63}$'),
  request_id uuid not null,
  correlation_id uuid not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index security_events_actor_time
  on identity.security_events(actor_auth_user_id, occurred_at desc);
create index security_events_session_time
  on identity.security_events(session_id, occurred_at desc);
create index security_events_correlation on identity.security_events(correlation_id);

alter table platform_private.party enable row level security;
alter table platform_private.party force row level security;
alter table platform_private.person_party enable row level security;
alter table platform_private.person_party force row level security;
alter table platform_private.acting_context_binding enable row level security;
alter table platform_private.acting_context_binding force row level security;
alter table identity.auth_provider_registry enable row level security;
alter table identity.auth_provider_registry force row level security;
alter table identity.auth_user_bindings enable row level security;
alter table identity.auth_user_bindings force row level security;
alter table identity.auth_session_index enable row level security;
alter table identity.auth_session_index force row level security;
alter table identity.auth_intents enable row level security;
alter table identity.auth_intents force row level security;
alter table identity.auth_rate_limits enable row level security;
alter table identity.auth_rate_limits force row level security;
alter table identity.security_events enable row level security;
alter table identity.security_events force row level security;

revoke all on table
  platform_private.party,
  platform_private.person_party,
  platform_private.acting_context_binding,
  identity.auth_provider_registry,
  identity.auth_user_bindings,
  identity.auth_session_index,
  identity.auth_intents,
  identity.auth_rate_limits,
  identity.security_events
from public, anon, authenticated, service_role;

create function platform_api.auth_provider_catalog()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'providers', coalesce(pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'code', registry.code,
        'label', registry.label,
        'state', case when registry.setup_verified then 'enabled' else 'temporarily_unavailable' end
      ) order by registry.code
    ) filter (where registry.code <> 'email'), '[]'::jsonb),
    'emailRecoveryEnabled', true,
    'version', pg_catalog.max(registry.setup_version)::text
  )
  from identity.auth_provider_registry registry
  where registry.available_in_catalog
$$;

create function platform_api.auth_rate_limit(
  p_operation_id text,
  p_bucket_digest text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  window_at timestamptz;
  next_count integer;
begin
  if p_operation_id !~ '^AUTH-API-(0[1-9]|1[0-5])$'
     or p_bucket_digest !~ '^[0-9a-f]{64}$'
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  window_at := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from now_at) / p_window_seconds) * p_window_seconds
  );
  insert into identity.auth_rate_limits(operation_id, bucket_digest, window_started_at, request_count)
  values (p_operation_id, pg_catalog.decode(p_bucket_digest, 'hex'), window_at, 1)
  on conflict (operation_id, bucket_digest, window_started_at)
  do update set request_count = identity.auth_rate_limits.request_count + 1
  returning request_count into next_count;
  return pg_catalog.jsonb_build_object(
    'allowed', next_count <= p_limit,
    'limit', p_limit,
    'remaining', greatest(0, p_limit - next_count),
    'resetAt', extract(epoch from window_at + pg_catalog.make_interval(secs => p_window_seconds))::bigint
  );
end;
$$;

create function platform_api.auth_intent_create(
  p_state_digest bytea,
  p_intent text,
  p_provider text,
  p_auth_user_id uuid,
  p_session_id uuid,
  p_merge_id uuid,
  p_return_path text,
  p_nonce_digest bytea,
  p_pkce_verifier_digest bytea,
  p_expires_at timestamptz,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  intent_id uuid := extensions.gen_random_uuid();
begin
  insert into identity.auth_intents(
    id, state_digest, intent, provider, auth_user_id, session_id, merge_id,
    return_path, nonce_digest, pkce_verifier_digest, expires_at
  ) values (
    intent_id, p_state_digest, p_intent, p_provider, p_auth_user_id, p_session_id,
    p_merge_id, p_return_path, p_nonce_digest, p_pkce_verifier_digest, p_expires_at
  );
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, provider, safe_outcome,
    reason_code, request_id, correlation_id
  ) values (
    'identity.auth.intent.created', p_auth_user_id, p_session_id, p_provider,
    'pending', 'INTENT_CREATED', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.auth.intent.created.v1', 1, 'auth_intent', intent_id, 1,
    p_correlation_id, pg_catalog.jsonb_build_object('intentId', intent_id)
  );
  return pg_catalog.jsonb_build_object('intentId', intent_id, 'expiresAt', p_expires_at);
end;
$$;

create function platform_private.bootstrap_auth_user(
  p_auth_user_id uuid,
  p_request_id uuid,
  p_correlation_id uuid
)
returns table(person_id uuid, acting_party_id uuid, account_state text, binding_version bigint, created boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  binding identity.auth_user_bindings%rowtype;
  party_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_auth_user_id::text, 0));
  select * into binding from identity.auth_user_bindings where auth_user_id = p_auth_user_id for update;
  if found then
    if binding.state not in ('claimed', 'active') then
      raise exception 'ACCOUNT_NOT_ELIGIBLE' using errcode = 'P0001';
    end if;
    return query select binding.person_id, binding.person_id, binding.state::text, binding.version, false;
    return;
  end if;
  party_id := extensions.gen_random_uuid();
  insert into platform_private.party(id, kind) values (party_id, 'person');
  insert into platform_private.person_party(party_id, auth_user_id, account_state)
  values (party_id, p_auth_user_id, 'active');
  insert into platform_private.acting_context_binding(
    person_id, acting_party_id, context_kind, client_binding_id, expires_at
  ) values (party_id, party_id, 'person', 'self', 'infinity'::timestamptz);
  insert into identity.auth_user_bindings(auth_user_id, person_id, state)
  values (p_auth_user_id, party_id, 'active') returning * into binding;
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    'identity.person.bootstrap', p_auth_user_id, party_id, 'person', party_id,
    'allowed', 'BOOTSTRAP_COMPLETED', p_correlation_id
  );
  insert into identity.security_events(
    action, actor_auth_user_id, safe_outcome, reason_code, request_id, correlation_id
  ) values (
    'identity.person.bootstrap', p_auth_user_id, 'completed',
    'BOOTSTRAP_COMPLETED', p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version,
    correlation_id, payload
  ) values (
    'identity.person.bootstrap.completed.v1', 1, 'person', party_id, binding.version,
    p_correlation_id, pg_catalog.jsonb_build_object('personId', party_id)
  );
  return query select party_id, party_id, binding.state::text, binding.version, true;
end;
$$;

create function platform_api.auth_session_register(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_issued_at timestamptz,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  binding_id uuid;
begin
  select id into binding_id from identity.auth_user_bindings where auth_user_id = p_auth_user_id;
  insert into identity.auth_session_index(
    session_id, auth_user_id, binding_id, state, issued_at, last_seen_at
  ) values (p_session_id, p_auth_user_id, binding_id, 'active', p_issued_at, clock_timestamp())
  on conflict (session_id) do update
    set last_seen_at = excluded.last_seen_at,
        binding_id = excluded.binding_id,
        version = identity.auth_session_index.version + 1
    where identity.auth_session_index.auth_user_id = excluded.auth_user_id
      and identity.auth_session_index.state = 'active';
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, safe_outcome, reason_code,
    request_id, correlation_id
  ) values (
    'identity.auth.session.registered', p_auth_user_id, p_session_id, 'completed',
    'SESSION_REGISTERED', p_request_id, p_correlation_id
  );
  return pg_catalog.jsonb_build_object('registered', true);
end;
$$;

create function platform_api.auth_callback_complete(
  p_state_digest bytea,
  p_auth_user_id uuid,
  p_session_id uuid,
  p_session_expires_at timestamptz,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  return_path text;
  boot record;
begin
  update identity.auth_intents
  set state = 'consumed', consumed_at = clock_timestamp(), version = version + 1, updated_at = clock_timestamp()
  where state_digest = p_state_digest
    and intent in ('sign_in', 'recovery')
    and state = 'pending'
    and expires_at > clock_timestamp()
  returning identity.auth_intents.return_path into return_path;
  if return_path is null then
    raise exception 'AUTH_CALLBACK_INVALID' using errcode = 'P0001';
  end if;
  select * into boot from platform_private.bootstrap_auth_user(p_auth_user_id, p_request_id, p_correlation_id);
  perform platform_api.auth_session_register(
    p_auth_user_id, p_session_id,
    p_session_expires_at - interval '1 hour', p_request_id, p_correlation_id
  );
  return pg_catalog.jsonb_build_object(
    'returnPath', return_path,
    'personId', boot.person_id,
    'actingPartyId', boot.acting_party_id,
    'accountState', boot.account_state,
    'bindingVersion', boot.binding_version,
    'created', boot.created
  );
end;
$$;

create function platform_api.auth_session_read(p_auth_user_id uuid, p_session_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  session_row identity.auth_session_index%rowtype;
  binding identity.auth_user_bindings%rowtype;
begin
  select * into session_row from identity.auth_session_index
  where session_id = p_session_id and auth_user_id = p_auth_user_id and state = 'active'
  for update;
  if not found then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  update identity.auth_session_index set last_seen_at = clock_timestamp()
  where session_id = p_session_id;
  select * into binding from identity.auth_user_bindings where id = session_row.binding_id;
  return pg_catalog.jsonb_build_object(
    'accountState', case when binding.id is null then null else binding.state::text end,
    'bootstrapState', case when binding.id is null then 'required' else 'complete' end,
    'personId', binding.person_id,
    'actingPartyId', binding.person_id
  );
end;
$$;

create function platform_api.auth_bootstrap(
  p_auth_user_id uuid,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  existing platform_private.idempotency_records%rowtype;
  boot record;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_auth_user_id::text || pg_catalog.encode(p_key_hash, 'hex'), 0));
  select * into existing from platform_private.idempotency_records
  where actor_id = p_auth_user_id and operation = 'AUTH-API-07' and key_hash = p_key_hash for update;
  if found and existing.request_hash <> p_request_hash then
    raise exception 'IDEMPOTENCY_MISMATCH' using errcode = 'P0001';
  end if;
  if found and existing.state = 'completed' then
    select * into boot from platform_private.bootstrap_auth_user(p_auth_user_id, p_request_id, p_correlation_id);
    return pg_catalog.jsonb_build_object(
      'created', false, 'personId', boot.person_id, 'actingPartyId', boot.acting_party_id,
      'contextKind', 'self', 'accountState', boot.account_state, 'bindingVersion', boot.binding_version
    );
  end if;
  if not found then
    insert into platform_private.idempotency_records(
      actor_id, operation, key_hash, request_hash, expires_at
    ) values (p_auth_user_id, 'AUTH-API-07', p_key_hash, p_request_hash, clock_timestamp() + interval '30 days');
  end if;
  select * into boot from platform_private.bootstrap_auth_user(p_auth_user_id, p_request_id, p_correlation_id);
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object(
    'status', case when boot.created then 201 else 200 end,
    'resourceRef', boot.person_id::text
  )
  where actor_id = p_auth_user_id and operation = 'AUTH-API-07' and key_hash = p_key_hash;
  return pg_catalog.jsonb_build_object(
    'created', boot.created, 'personId', boot.person_id, 'actingPartyId', boot.acting_party_id,
    'contextKind', 'self', 'accountState', boot.account_state, 'bindingVersion', boot.binding_version
  );
end;
$$;

create function platform_api.auth_logout(
  p_auth_user_id uuid,
  p_session_id uuid,
  p_scope text,
  p_key_hash bytea,
  p_request_hash bytea,
  p_request_id uuid,
  p_correlation_id uuid
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  existing platform_private.idempotency_records%rowtype;
  revoked_count integer;
  acting_party uuid;
  provider_operation_id uuid := extensions.gen_random_uuid();
begin
  if p_scope not in ('current', 'all') then
    raise exception 'SCOPE_INVALID' using errcode = 'P0001';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_auth_user_id::text || pg_catalog.encode(p_key_hash, 'hex'), 0));
  select * into existing from platform_private.idempotency_records
  where actor_id = p_auth_user_id and operation = 'AUTH-API-08' and key_hash = p_key_hash for update;
  if found and existing.request_hash <> p_request_hash then
    raise exception 'IDEMPOTENCY_MISMATCH' using errcode = 'P0001';
  end if;
  if found and existing.state = 'completed' then return pg_catalog.jsonb_build_object('revoked', 0, 'replayed', true); end if;
  if not found then
    insert into platform_private.idempotency_records(actor_id, operation, key_hash, request_hash, expires_at)
    values (p_auth_user_id, 'AUTH-API-08', p_key_hash, p_request_hash, clock_timestamp() + interval '30 days');
  end if;
  if p_scope = 'current' then
    update identity.auth_session_index
    set state = 'revoked', revoked_at = clock_timestamp(), revocation_reason = 'user_logout', version = version + 1
    where session_id = p_session_id and auth_user_id = p_auth_user_id and state = 'active';
  else
    update identity.auth_session_index
    set state = 'revoked', revoked_at = clock_timestamp(), revocation_reason = 'global_logout', version = version + 1
    where auth_user_id = p_auth_user_id and state = 'active';
  end if;
  get diagnostics revoked_count = row_count;
  if p_scope = 'current' and revoked_count <> 1 then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  select person_id into acting_party from identity.auth_user_bindings where auth_user_id = p_auth_user_id;
  if acting_party is not null then
    insert into audit_private.audit_events(
      action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id
    ) values (
      'identity.auth.logout', p_auth_user_id, acting_party, 'auth_session', p_session_id,
      'allowed', case when p_scope = 'all' then 'GLOBAL_LOGOUT' else 'CURRENT_LOGOUT' end, p_correlation_id
    );
  end if;
  insert into identity.security_events(
    action, actor_auth_user_id, session_id, safe_outcome, reason_code, request_id, correlation_id
  ) values (
    'identity.auth.logout', p_auth_user_id, p_session_id, 'completed',
    case when p_scope = 'all' then 'GLOBAL_LOGOUT' else 'CURRENT_LOGOUT' end,
    p_request_id, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id, aggregate_version, correlation_id, payload
  ) values (
    'identity.auth.logout.requested.v1', 1, 'auth_logout_operation', provider_operation_id, 1,
    p_correlation_id, pg_catalog.jsonb_build_object('operationId', provider_operation_id, 'scope', p_scope)
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 204)
  where actor_id = p_auth_user_id and operation = 'AUTH-API-08' and key_hash = p_key_hash;
  return pg_catalog.jsonb_build_object('revoked', revoked_count, 'replayed', false);
end;
$$;

revoke all on function
  platform_api.auth_provider_catalog(),
  platform_api.auth_rate_limit(text, text, integer, integer),
  platform_api.auth_intent_create(bytea, text, text, uuid, uuid, uuid, text, bytea, bytea, timestamptz, uuid, uuid),
  platform_api.auth_callback_complete(bytea, uuid, uuid, timestamptz, uuid, uuid),
  platform_api.auth_session_register(uuid, uuid, timestamptz, uuid, uuid),
  platform_api.auth_session_read(uuid, uuid),
  platform_api.auth_bootstrap(uuid, bytea, bytea, uuid, uuid),
  platform_api.auth_logout(uuid, uuid, text, bytea, bytea, uuid, uuid)
from public, anon, authenticated;

grant execute on function
  platform_api.auth_provider_catalog(),
  platform_api.auth_rate_limit(text, text, integer, integer),
  platform_api.auth_intent_create(bytea, text, text, uuid, uuid, uuid, text, bytea, bytea, timestamptz, uuid, uuid),
  platform_api.auth_callback_complete(bytea, uuid, uuid, timestamptz, uuid, uuid),
  platform_api.auth_session_register(uuid, uuid, timestamptz, uuid, uuid),
  platform_api.auth_session_read(uuid, uuid),
  platform_api.auth_bootstrap(uuid, bytea, bytea, uuid, uuid),
  platform_api.auth_logout(uuid, uuid, text, bytea, bytea, uuid, uuid)
to service_role;

revoke all on function platform_private.bootstrap_auth_user(uuid, uuid, uuid)
from public, anon, authenticated, service_role;
