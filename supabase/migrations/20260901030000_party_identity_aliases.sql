begin;

-- Slice 03 extends the canonical party spine created by Slice 01.  The
-- person_party and acting_context_binding tables are deliberately altered in
-- place below; they are not recreated here.
create extension if not exists btree_gist with schema extensions;

create type platform_private.person_account_state as enum
  ('shadow', 'claimed', 'active', 'suspended', 'memorialised', 'erasure_processing');
create type platform_private.facet_state as enum ('active', 'removed');
create type platform_private.facet_source as enum ('self_asserted', 'curation_approved');
create type platform_private.alias_lifecycle as enum
  ('active', 'transfer_pending', 'transferred', 'retired');
create type platform_private.public_link_state as enum ('private', 'public');
create type platform_private.handle_state as enum ('active', 'redirect', 'retired');
create type platform_private.transfer_offer_state as enum
  ('pending', 'accepted', 'declined', 'expired', 'cancelled');
create type platform_private.context_binding_state as enum
  ('active', 'revoked', 'expired');
create type platform_private.legal_identity_state as enum
  ('active', 'superseded', 'withdrawn');

-- Normalize the two Slice 01 columns to the closed Slice 03 enums in place.
-- Their rows and foreign keys remain intact; this is a type reconciliation,
-- not a second person or binding table.
alter table platform_private.person_party
  drop constraint person_party_account_state_check,
  drop constraint person_party_check,
  drop constraint person_party_check1;
alter table platform_private.person_party
  alter column account_state drop default;
alter table platform_private.person_party
  alter column account_state type platform_private.person_account_state
  using account_state::platform_private.person_account_state;
alter table platform_private.person_party
  alter column account_state set default 'claimed'::platform_private.person_account_state;
alter table platform_private.person_party
  add constraint person_party_account_state_check check (
    account_state in ('shadow', 'claimed', 'active', 'suspended', 'memorialised', 'erasure_processing')
  ),
  add constraint person_party_check check (
    (account_state = 'shadow' and auth_user_id is null) or account_state <> 'shadow'
  ),
  add constraint person_party_check1 check (account_state <> 'active' or auth_user_id is not null);
drop index if exists platform_private.one_active_context_binding_per_client;
alter table platform_private.acting_context_binding
  drop constraint acting_context_binding_state_check;
alter table platform_private.acting_context_binding
  alter column state drop default;
alter table platform_private.acting_context_binding
  alter column state type platform_private.context_binding_state
  using state::platform_private.context_binding_state;
alter table platform_private.acting_context_binding
  alter column state set default 'active'::platform_private.context_binding_state;
alter table platform_private.acting_context_binding
  add constraint acting_context_binding_state_check check (state in ('active', 'revoked', 'expired'));
create unique index one_active_context_binding_per_client
  on platform_private.acting_context_binding(person_id, client_binding_id)
  where state = 'active';

create unique index person_one_live_auth_user
  on platform_private.person_party(auth_user_id)
  where auth_user_id is not null
    and account_state not in ('erasure_processing');

create table platform_private.role_facet_assertion (
  id uuid primary key default extensions.gen_random_uuid(),
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  facet_code text not null,
  state platform_private.facet_state not null,
  source platform_private.facet_source not null,
  asserted_at timestamptz not null,
  removed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (facet_code = lower(facet_code) and facet_code ~ '^[a-z][a-z0-9_]{0,31}$'),
  check ((state = 'active' and removed_at is null)
      or (state = 'removed' and removed_at is not null)),
  check (removed_at is null or removed_at >= asserted_at)
);

create unique index facet_one_active_per_person
  on platform_private.role_facet_assertion(person_id, facet_code)
  where state = 'active';
create index facet_person_history
  on platform_private.role_facet_assertion(person_id, asserted_at desc, id desc);

create table platform_private.handle_reservation (
  id uuid primary key default extensions.gen_random_uuid(),
  normalized_handle text not null,
  display_handle text not null,
  party_id uuid not null references platform_private.party(id) on delete restrict,
  state platform_private.handle_state not null default 'active',
  successor_handle_id uuid references platform_private.handle_reservation(id) on delete restrict,
  first_used_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  retired_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_handle),
  check (normalized_handle = lower(normalized_handle)),
  check (char_length(normalized_handle) between 3 and 40),
  check (normalized_handle !~ '[[:space:][:cntrl:]]'),
  check ((state = 'active' and retired_at is null)
      or (state in ('redirect', 'retired') and retired_at is not null))
);
create index handle_party_state on platform_private.handle_reservation(party_id, state);
create index handle_successor on platform_private.handle_reservation(successor_handle_id)
  where successor_handle_id is not null;

create table platform_private.alias_party (
  party_id uuid primary key references platform_private.party(id) on delete restrict,
  display_name text not null,
  current_handle_id uuid not null references platform_private.handle_reservation(id) on delete restrict,
  lifecycle platform_private.alias_lifecycle not null default 'active',
  public_link_state platform_private.public_link_state not null default 'private',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(display_name) between 1 and 120)
);
create index alias_public_lookup
  on platform_private.alias_party(current_handle_id, lifecycle, public_link_state);

create table platform_private.alias_transfer_offer (
  id uuid primary key default extensions.gen_random_uuid(),
  alias_id uuid not null references platform_private.alias_party(party_id) on delete restrict,
  offering_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  recipient_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  state platform_private.transfer_offer_state not null default 'pending',
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  closed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offering_person_id <> recipient_person_id),
  check (expires_at > offered_at),
  check ((state = 'pending' and accepted_at is null and declined_at is null and closed_at is null)
      or (state = 'accepted' and accepted_at is not null and closed_at is not null)
      or (state in ('declined', 'expired', 'cancelled') and closed_at is not null))
);
create unique index one_pending_alias_transfer
  on platform_private.alias_transfer_offer(alias_id)
  where state = 'pending';
create index transfer_recipient_pending
  on platform_private.alias_transfer_offer(recipient_person_id, expires_at)
  where state = 'pending';

create table platform_private.alias_ownership_period (
  id uuid primary key default extensions.gen_random_uuid(),
  alias_id uuid not null references platform_private.alias_party(party_id) on delete restrict,
  owner_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz,
  transfer_id uuid references platform_private.alias_transfer_offer(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
alter table platform_private.alias_ownership_period
  add constraint alias_periods_do_not_overlap
  exclude using gist (
    alias_id with =,
    tstzrange(starts_at, coalesce(ends_at, 'infinity'::timestamptz), '[)') with &&
  );
create unique index alias_one_current_owner
  on platform_private.alias_ownership_period(alias_id)
  where ends_at is null;
create index alias_owner_history
  on platform_private.alias_ownership_period(owner_person_id, starts_at desc, id desc);

create table platform_private.legal_identity_record (
  id uuid primary key default extensions.gen_random_uuid(),
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  state platform_private.legal_identity_state not null default 'active',
  effective_from date not null,
  effective_to date,
  protected_field_refs jsonb not null,
  verification_ref uuid,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from),
  check (jsonb_typeof(protected_field_refs) = 'object'),
  check (protected_field_refs ? 'legalNameRef'),
  check (protected_field_refs ? 'addressRef')
);
alter table platform_private.person_party
  add constraint person_legal_identity_fk
  foreign key (legal_identity_id)
  references platform_private.legal_identity_record(id)
  on delete restrict;
alter table platform_private.legal_identity_record
  add constraint legal_periods_do_not_overlap
  exclude using gist (
    person_id with =,
    daterange(effective_from, coalesce(effective_to, 'infinity'::date), '[)') with &&
  );
create index legal_identity_current
  on platform_private.legal_identity_record(person_id, effective_from desc)
  where state = 'active';

create table platform_private.legal_disclosure_event (
  id uuid primary key default extensions.gen_random_uuid(),
  legal_identity_id uuid not null references platform_private.legal_identity_record(id) on delete restrict,
  legal_identity_version bigint not null check (legal_identity_version > 0),
  transaction_id uuid not null,
  recipient_party_id uuid not null references platform_private.party(id) on delete restrict,
  purpose_code text not null,
  field_codes text[] not null,
  actor_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  acting_party_id uuid not null references platform_private.party(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  check (purpose_code ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  check (cardinality(field_codes) between 1 and 8),
  check (field_codes <@ array['legal_name','address','tax_id','kyc_status']::text[]),
  check (acting_party_id = actor_person_id)
);
create index disclosure_recipient_time
  on platform_private.legal_disclosure_event(recipient_party_id, occurred_at desc, id desc);
create index disclosure_subject_time
  on platform_private.legal_disclosure_event(actor_person_id, occurred_at desc, id desc);

-- The columns already exist on acting_context_binding from Slice 01.  Keep its
-- text state for compatibility with AUTH-API-07 and add the Slice 03 policy
-- surface rather than changing the shared table's type in place.

create view platform_private.identity_self_projection
  with (security_invoker = true) as
  select p.party_id as person_id, p.account_state, p.version,
         p.public_profile_id, p.legal_identity_id
  from platform_private.person_party p;
create view platform_private.identity_public_projection
  with (security_invoker = true) as
  select a.party_id, 'alias'::text as kind, a.display_name,
         h.display_handle as handle, a.public_link_state,
         a.lifecycle, a.version
  from platform_private.alias_party a
  join platform_private.handle_reservation h
    on h.id = a.current_handle_id
   and h.state = 'active'
  where a.public_link_state = 'public'
    and a.lifecycle in ('active', 'transferred');
create view platform_private.identity_public_person_projection
  with (security_invoker = true) as
  select p.party_id, 'person'::text as kind,
         p.public_profile_id, p.account_state, p.version
  from platform_private.person_party p
  where p.account_state in ('claimed', 'active');

create function platform_private.normalize_identity_handle(p_handle text)
returns text
language sql immutable strict
set search_path = ''
as $body$
  select pg_catalog.lower(pg_catalog.translate(
    pg_catalog.btrim(p_handle),
    $fullwidth$！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ［＼］＾＿｀ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ｛｜｝～$fullwidth$,
    $ascii$!"#$%&'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~$ascii$
  ));
$body$;

create function platform_private.identity_auth_user()
returns uuid
language plpgsql security definer
set search_path = ''
as $body$
declare
  configured text := nullif(pg_catalog.current_setting('app.auth_user_id', true), '');
  claimed text := nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), '');
  result uuid;
begin
  if configured is null then configured := claimed; end if;
  if configured is null or configured !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if claimed is not null and claimed !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if claimed is not null and configured::uuid <> claimed::uuid then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  result := configured::uuid;
  if not exists (select 1 from auth.users u where u.id = result) then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  return result;
end;
$body$;

create function platform_private.identity_actor_person(p_auth_user_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $body$
declare
  result uuid;
begin
  select p.party_id into result
  from platform_private.person_party p
  where p.auth_user_id = p_auth_user_id
    and p.account_state in ('claimed', 'active');
  if result is null then
    raise exception 'PERSON_NOT_FOUND' using errcode = 'P0001';
  end if;
  return result;
end;
$body$;

create function platform_private.identity_uuid_setting(p_name text)
returns uuid
language plpgsql security definer
set search_path = ''
as $body$
declare
  value text := nullif(pg_catalog.current_setting(p_name, true), '');
begin
  if value is null or value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return extensions.gen_random_uuid();
  end if;
  return value::uuid;
end;
$body$;

create function platform_private.identity_hash_setting(p_name text)
returns bytea
language plpgsql security definer
set search_path = ''
as $body$
declare
  value text := nullif(pg_catalog.current_setting(p_name, true), '');
begin
  if value is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return extensions.digest(pg_catalog.convert_to(value, 'utf8'), 'sha256');
end;
$body$;

create function platform_private.identity_idempotency_reserve(
  p_actor_id uuid,
  p_operation text,
  p_key_hash bytea,
  p_request_hash bytea
)
returns platform_private.idempotency_records
language plpgsql security definer
set search_path = ''
as $body$
declare
  record platform_private.idempotency_records;
begin
  if p_actor_id is null or p_operation is null or pg_catalog.length(p_operation) > 128
     or p_key_hash is null or pg_catalog.octet_length(p_key_hash) <> 32
     or p_request_hash is null or pg_catalog.octet_length(p_request_hash) <> 32 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  insert into platform_private.idempotency_records(
    actor_id, operation, key_hash, request_hash, expires_at
  ) values (
    p_actor_id, p_operation, p_key_hash, p_request_hash,
    pg_catalog.clock_timestamp() + interval '30 days'
  ) on conflict (actor_id, operation, key_hash) do nothing;
  select * into record
  from platform_private.idempotency_records
  where actor_id = p_actor_id and operation = p_operation and key_hash = p_key_hash
  for update;
  if record.request_hash <> p_request_hash then
    raise exception 'IDEMPOTENCY_MISMATCH' using errcode = 'P0001';
  end if;
  return record;
end;
$body$;

create function platform_private.identity_current_owner(p_alias_id uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $body$
  select p.owner_person_id
  from platform_private.alias_ownership_period p
  where p.alias_id = p_alias_id and p.ends_at is null
  order by p.starts_at desc, p.id desc
  limit 1
$body$;

create function platform_private.identity_record_effects(
  p_action text,
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_reason_code text,
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_aggregate_version bigint,
  p_payload jsonb,
  p_correlation_id uuid
)
returns void
language plpgsql security definer
set search_path = ''
as $body$
begin
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    p_action, p_actor_id, p_acting_party_id, p_target_type, p_target_id,
    'allowed', p_reason_code, p_correlation_id
  );
  insert into platform_private.outbox_events(
    event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload
  ) values (
    p_event_type, 1, p_aggregate_type, p_aggregate_id,
    p_aggregate_version, p_correlation_id, p_payload
  );
end;
$body$;

create function platform_private.guard_handle_reservation() returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'handle reservations are append-only' using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.normalized_handle is distinct from old.normalized_handle
     or new.display_handle is distinct from old.display_handle
     or new.party_id is distinct from old.party_id
     or new.first_used_at is distinct from old.first_used_at
     or new.created_at is distinct from old.created_at then
    raise exception 'handle reservation identity is immutable' using errcode = 'P0001';
  end if;
  if old.state in ('redirect'::platform_private.handle_state, 'retired'::platform_private.handle_state)
     and (new.state is distinct from old.state or new.successor_handle_id is distinct from old.successor_handle_id
       or new.retired_at is distinct from old.retired_at) then
    raise exception 'closed handle reservation is immutable' using errcode = 'P0001';
  end if;
  if old.state = 'active'::platform_private.handle_state
     and new.state = 'active'::platform_private.handle_state
     and new.successor_handle_id is not null then
    raise exception 'active handle cannot have a successor' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create function platform_private.guard_alias_ownership_period() returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if tg_op = 'DELETE' then
    raise exception 'ownership periods are append-only' using errcode = 'P0001';
  end if;
  if new.id is distinct from old.id
     or new.alias_id is distinct from old.alias_id
     or new.owner_person_id is distinct from old.owner_person_id
     or new.starts_at is distinct from old.starts_at
     or new.transfer_id is distinct from old.transfer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'ownership period identity is immutable' using errcode = 'P0001';
  end if;
  if old.ends_at is not null and new.ends_at is distinct from old.ends_at then
    raise exception 'closed ownership period is immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create trigger handle_reservation_immutable
before update or delete on platform_private.handle_reservation
for each row execute function platform_private.guard_handle_reservation();
create trigger alias_ownership_period_immutable
before update or delete on platform_private.alias_ownership_period
for each row execute function platform_private.guard_alias_ownership_period();

alter table platform_private.person_party enable row level security;
alter table platform_private.person_party force row level security;
alter table platform_private.role_facet_assertion enable row level security;
alter table platform_private.role_facet_assertion force row level security;
alter table platform_private.handle_reservation enable row level security;
alter table platform_private.handle_reservation force row level security;
alter table platform_private.alias_party enable row level security;
alter table platform_private.alias_party force row level security;
alter table platform_private.alias_transfer_offer enable row level security;
alter table platform_private.alias_transfer_offer force row level security;
alter table platform_private.alias_ownership_period enable row level security;
alter table platform_private.alias_ownership_period force row level security;
alter table platform_private.legal_identity_record enable row level security;
alter table platform_private.legal_identity_record force row level security;
alter table platform_private.legal_disclosure_event enable row level security;
alter table platform_private.legal_disclosure_event force row level security;
alter table platform_private.acting_context_binding enable row level security;
alter table platform_private.acting_context_binding force row level security;

revoke all on table
  platform_private.person_party,
  platform_private.role_facet_assertion,
  platform_private.handle_reservation,
  platform_private.alias_party,
  platform_private.alias_transfer_offer,
  platform_private.alias_ownership_period,
  platform_private.legal_identity_record,
  platform_private.legal_disclosure_event,
  platform_private.acting_context_binding
from public, anon, authenticated, service_role;

create policy person_self_row on platform_private.person_party
  for select to authenticated
  using (party_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);
create policy facet_self_rows on platform_private.role_facet_assertion
  for select to authenticated
  using (person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);
create policy alias_owner_rows on platform_private.alias_party
  for select to authenticated
  using (exists (
    select 1 from platform_private.alias_ownership_period p
    where p.alias_id = party_id
      and p.owner_person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid
      and p.ends_at is null
  ));
create policy transfer_participant_rows on platform_private.alias_transfer_offer
  for select to authenticated
  using (offering_person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid
      or recipient_person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);
create policy alias_period_owner_rows on platform_private.alias_ownership_period
  for select to authenticated
  using (owner_person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);
create policy legal_subject_rows on platform_private.legal_identity_record
  for select to authenticated
  using (person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);
create policy disclosure_participant_rows on platform_private.legal_disclosure_event
  for select to authenticated
  using (actor_person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid
      or recipient_party_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);
create policy context_owner_rows on platform_private.acting_context_binding
  for select to authenticated
  using (person_id = nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid);

-- Identity creation (BE01b-01) and self projection (BE01b-02).
create function platform_api.identity_create()
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid;
  idempotency platform_private.idempotency_records;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  request_id uuid := platform_private.identity_uuid_setting('app.request_id');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  party_id uuid;
  binding identity.auth_user_bindings%rowtype;
  response jsonb;
begin
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.person.create', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    actor_id := (idempotency.response_ref->>'resourceRef')::uuid;
    return pg_catalog.jsonb_build_object(
      'created', false, 'personId', actor_id, 'actingPartyId', actor_id,
      'contextKind', 'self', 'accountState', 'active', 'bindingVersion', 1
    );
  end if;
  if exists (select 1 from platform_private.person_party p where p.auth_user_id = auth_id) then
    raise exception 'PERSON_ALREADY_EXISTS' using errcode = 'P0001';
  end if;
  party_id := extensions.gen_random_uuid();
  insert into platform_private.party(id, kind) values (party_id, 'person');
  insert into platform_private.person_party(party_id, auth_user_id, account_state)
  values (party_id, auth_id, 'active');
  insert into platform_private.acting_context_binding(
    person_id, acting_party_id, context_kind, client_binding_id, expires_at
  ) values (party_id, party_id, 'person', 'self', 'infinity'::timestamptz);
  insert into identity.auth_user_bindings(auth_user_id, person_id, state)
  values (auth_id, party_id, 'active') returning * into binding;
  perform platform_private.identity_record_effects(
    'identity.person.create', auth_id, party_id, 'person', party_id,
    'PERSON_CREATED', 'identity.person.created.v1', 'person', party_id,
    binding.version, pg_catalog.jsonb_build_object('personId', party_id), correlation_id
  );
  response := pg_catalog.jsonb_build_object(
    'created', true, 'personId', party_id, 'actingPartyId', party_id,
    'contextKind', 'self', 'accountState', 'active', 'bindingVersion', binding.version
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 201, 'resourceRef', party_id::text)
  where id = idempotency.id;
  return response;
end;
$body$;

create function platform_api.identity_person_read()
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  row_value record;
begin
  select p.party_id, p.account_state, p.version into row_value
  from platform_private.person_party p where p.party_id = person_id;
  return pg_catalog.jsonb_build_object(
    'personId', row_value.party_id, 'partyKind', 'person',
    'accountState', row_value.account_state, 'version', row_value.version,
    'facets', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('facetCode', f.facet_code, 'state', f.state::text) order by f.facet_code)
      from platform_private.role_facet_assertion f where f.person_id = person_id and f.state = 'active'), '[]'::jsonb),
    'aliases', '[]'::jsonb
  );
end;
$body$;

-- BE01b-03/04 role facet commands.
create function platform_api.identity_facet_add(p_facet_code text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  person_version bigint;
  facet_row platform_private.role_facet_assertion%rowtype;
  response jsonb;
begin
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.facet.add', key_hash, request_hash);
  if p_facet_code is null or p_facet_code not in ('performer','writer','producer','engineer','teacher','seller','tech') then
    raise exception 'FACET_UNKNOWN' using errcode = 'P0001';
  end if;
  if nullif(pg_catalog.current_setting('app.acting_party_id', true), '') is not null
     and nullif(pg_catalog.current_setting('app.acting_party_id', true), '')::uuid <> person_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if exists (select 1 from platform_private.role_facet_assertion f where f.person_id = person_id and f.facet_code = p_facet_code and f.state = 'active') then
    raise exception 'FACET_EXISTS' using errcode = 'P0001';
  end if;
  select p.version into person_version from platform_private.person_party p where p.party_id = person_id for update;
  insert into platform_private.role_facet_assertion(person_id, facet_code, state, source, asserted_at)
  values (person_id, p_facet_code, 'active', 'self_asserted', pg_catalog.clock_timestamp()) returning * into facet_row;
  update platform_private.person_party set version = version + 1, updated_at = pg_catalog.clock_timestamp() where party_id = person_id;
  perform platform_private.identity_record_effects(
    'identity.facet.add', auth_id, person_id, 'person', person_id,
    'FACET_ADDED', 'identity.facet.changed.v1', 'person', person_id,
    person_version + 1, pg_catalog.jsonb_build_object('personId', person_id, 'facetCode', p_facet_code, 'version', person_version + 1, 'state', 'active'), correlation_id
  );
  response := pg_catalog.jsonb_build_object('personId', person_id, 'facetCode', p_facet_code, 'state', 'active', 'version', person_version + 1);
  if idempotency.state <> 'completed'::platform_private.idempotency_state then
    update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', facet_row.id::text) where id = idempotency.id;
  end if;
  return response;
end;
$body$;

create function platform_api.identity_facet_remove(p_facet_code text, p_expected_version bigint)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  current_version bigint;
  changed integer;
begin
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.facet.remove', key_hash, request_hash);
  if nullif(pg_catalog.current_setting('app.acting_party_id', true), '') is not null
     and nullif(pg_catalog.current_setting('app.acting_party_id', true), '')::uuid <> person_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  select p.version into current_version from platform_private.person_party p where p.party_id = person_id for update;
  if p_expected_version is null or p_expected_version <> current_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  update platform_private.role_facet_assertion f
  set state = 'removed', removed_at = pg_catalog.clock_timestamp(), version = f.version + 1, updated_at = pg_catalog.clock_timestamp()
  where f.person_id = person_id and f.facet_code = p_facet_code and f.state = 'active';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FACET_NOT_FOUND' using errcode = 'P0001'; end if;
  update platform_private.person_party set version = version + 1, updated_at = pg_catalog.clock_timestamp() where party_id = person_id;
  perform platform_private.identity_record_effects(
    'identity.facet.remove', auth_id, person_id, 'person', person_id,
    'FACET_REMOVED', 'identity.facet.changed.v1', 'person', person_id,
    current_version + 1, pg_catalog.jsonb_build_object('personId', person_id, 'facetCode', p_facet_code, 'version', current_version + 1, 'state', 'removed'), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', person_id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object('personId', person_id, 'facetCode', p_facet_code, 'state', 'removed', 'version', current_version + 1);
end;
$body$;

create function platform_private.identity_validate_display_name(p_display_name text)
returns void
language plpgsql security definer
set search_path = ''
as $body$
begin
  if p_display_name is null
     or pg_catalog.btrim(p_display_name) <> p_display_name
     or pg_catalog.char_length(p_display_name) not between 1 and 120
     or p_display_name ~ '[[:cntrl:]]' then
    raise exception 'DISPLAY_NAME_INVALID' using errcode = 'P0001';
  end if;
end;
$body$;

create function platform_private.identity_normalized_handle(p_handle text)
returns text
language plpgsql security definer
set search_path = ''
as $body$
declare
  normalized text;
begin
  if p_handle is null or pg_catalog.btrim(p_handle) <> p_handle then
    raise exception 'HANDLE_INVALID' using errcode = 'P0001';
  end if;
  normalized := platform_private.normalize_identity_handle(p_handle);
  if pg_catalog.char_length(normalized) not between 3 and 40
     or normalized !~ '^[[:alnum:]_.-]+$'
     or normalized ~ '[[:space:][:cntrl:]]' then
    raise exception 'HANDLE_INVALID' using errcode = 'P0001';
  end if;
  return normalized;
end;
$body$;

-- BE01b-05: create an alias, reserve its first handle forever, and open its
-- first ownership period in the same transaction as audit/outbox effects.
create function platform_api.identity_alias_create(
  p_display_name text,
  p_handle text,
  p_public_link_state text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  owner_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  normalized text;
  party_id uuid;
  handle_id uuid;
  alias_version bigint := 1;
  response jsonb;
  recent_creations integer;
begin
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.alias.create', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    party_id := (idempotency.response_ref->>'resourceRef')::uuid;
    select pg_catalog.jsonb_build_object(
      'aliasId', a.party_id,
      'displayName', a.display_name,
      'handle', h.display_handle,
      'lifecycle', a.lifecycle::text,
      'publicLinkState', a.public_link_state::text,
      'version', a.version
    ) into response
    from platform_private.alias_party a
    join platform_private.handle_reservation h on h.id = a.current_handle_id
    where a.party_id = party_id;
    if response is null then raise exception 'ALIAS_NOT_FOUND' using errcode = 'P0001'; end if;
    return response;
  end if;
  perform platform_private.identity_validate_display_name(p_display_name);
  if p_public_link_state is null or p_public_link_state not in ('private', 'public') then
    raise exception 'PUBLIC_LINK_STATE_INVALID' using errcode = 'P0001';
  end if;
  normalized := platform_private.identity_normalized_handle(p_handle);
  if exists (select 1 from platform_private.handle_reservation h where h.normalized_handle = normalized) then
    raise exception 'HANDLE_TAKEN' using errcode = 'P0001';
  end if;
  select count(*)::integer into recent_creations
  from platform_private.alias_party a
  join platform_private.alias_ownership_period owner_period
    on owner_period.alias_id = a.party_id and owner_period.owner_person_id = owner_id and owner_period.ends_at is null
  where a.created_at >= pg_catalog.clock_timestamp() - interval '30 days';
  if recent_creations >= 5 then
    raise exception 'ALIAS_QUOTA_EXCEEDED' using errcode = 'P0001';
  end if;
  party_id := extensions.gen_random_uuid();
  handle_id := extensions.gen_random_uuid();
  insert into platform_private.party(id, kind) values (party_id, 'alias');
  insert into platform_private.handle_reservation(
    id, normalized_handle, display_handle, party_id, state, first_used_at, last_used_at
  ) values (
    handle_id, normalized, p_handle, party_id, 'active', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );
  insert into platform_private.alias_party(
    party_id, display_name, current_handle_id, lifecycle, public_link_state, version
  ) values (party_id, p_display_name, handle_id, 'active', p_public_link_state::platform_private.public_link_state, alias_version);
  insert into platform_private.alias_ownership_period(alias_id, owner_person_id, starts_at)
  values (party_id, owner_id, pg_catalog.clock_timestamp());
  perform platform_private.identity_record_effects(
    'identity.alias.create', auth_id, owner_id, 'alias', party_id,
    'ALIAS_CREATED', 'identity.alias.changed.v1', 'alias', party_id,
    alias_version, pg_catalog.jsonb_build_object('aliasId', party_id, 'handleId', handle_id, 'version', alias_version, 'lifecycle', 'active', 'publicLinkState', p_public_link_state), correlation_id
  );
  response := pg_catalog.jsonb_build_object(
    'aliasId', party_id, 'displayName', p_display_name, 'handle', p_handle,
    'lifecycle', 'active', 'publicLinkState', p_public_link_state, 'version', alias_version
  );
  update platform_private.idempotency_records
  set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 201, 'resourceRef', party_id::text)
  where id = idempotency.id;
  return response;
end;
$body$;

-- BE01b-06: display/public patch under owner and aggregate-version CAS.
create function platform_api.identity_alias_patch(
  p_alias_id uuid,
  p_display_name text,
  p_public_link_state text,
  p_expected_version bigint
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  owner_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  alias_row platform_private.alias_party%rowtype;
  current_owner uuid;
  next_state platform_private.public_link_state;
  response jsonb;
begin
  select * into alias_row from platform_private.alias_party where party_id = p_alias_id for update;
  if not found then raise exception 'ALIAS_NOT_FOUND' using errcode = 'P0001'; end if;
  current_owner := platform_private.identity_current_owner(p_alias_id);
  if current_owner is null or current_owner <> owner_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_expected_version is null or p_expected_version <> alias_row.version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  perform platform_private.identity_validate_display_name(p_display_name);
  if p_public_link_state is null or p_public_link_state not in ('private', 'public') then
    raise exception 'PUBLIC_LINK_STATE_INVALID' using errcode = 'P0001';
  end if;
  next_state := p_public_link_state::platform_private.public_link_state;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.alias.patch', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'displayName', p_display_name, 'publicLinkState', next_state::text, 'version', alias_row.version);
  end if;
  update platform_private.alias_party a
  set display_name = p_display_name, public_link_state = next_state,
      version = a.version + 1, updated_at = pg_catalog.clock_timestamp()
  where a.party_id = p_alias_id and a.version = p_expected_version;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  perform platform_private.identity_record_effects(
    'identity.alias.patch', auth_id, owner_id, 'alias', p_alias_id,
    'ALIAS_PATCHED', 'identity.alias.changed.v1', 'alias', p_alias_id,
    alias_row.version + 1, pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'version', alias_row.version + 1, 'lifecycle', alias_row.lifecycle::text, 'publicLinkState', next_state::text), correlation_id
  );
  response := pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'displayName', p_display_name, 'publicLinkState', next_state::text, 'lifecycle', alias_row.lifecycle::text, 'version', alias_row.version + 1);
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', p_alias_id::text) where id = idempotency.id;
  return response;
end;
$body$;

-- BE01b-07: a handle change appends a new reservation and closes the prior
-- reservation with a permanent redirect.  The normalized value is never
-- accepted from the client.
create function platform_api.identity_handle_change(
  p_alias_id uuid,
  p_handle text,
  p_expected_version bigint
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  owner_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  alias_row platform_private.alias_party%rowtype;
  current_owner uuid;
  old_handle platform_private.handle_reservation%rowtype;
  normalized text;
  new_handle_id uuid;
  changes integer;
begin
  select * into alias_row from platform_private.alias_party where party_id = p_alias_id for update;
  if not found then raise exception 'ALIAS_NOT_FOUND' using errcode = 'P0001'; end if;
  current_owner := platform_private.identity_current_owner(p_alias_id);
  if current_owner is null or current_owner <> owner_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_expected_version is null or p_expected_version <> alias_row.version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if alias_row.lifecycle in ('retired', 'transfer_pending') then
    raise exception 'TRANSFER_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  normalized := platform_private.identity_normalized_handle(p_handle);
  select * into old_handle from platform_private.handle_reservation where id = alias_row.current_handle_id for update;
  if old_handle.normalized_handle = normalized then
    raise exception 'HANDLE_TAKEN' using errcode = 'P0001';
  end if;
  if exists (select 1 from platform_private.handle_reservation h where h.normalized_handle = normalized) then
    raise exception 'HANDLE_TAKEN' using errcode = 'P0001';
  end if;
  select count(*)::integer into changes
  from audit_private.audit_events e
  where e.actor_id = auth_id
    and e.action = 'identity.handle.change'
    and e.occurred_at >= pg_catalog.clock_timestamp() - interval '12 months';
  if changes >= 2 then
    raise exception 'HANDLE_QUOTA_EXCEEDED' using errcode = 'P0001';
  end if;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.handle.change', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'handle', p_handle, 'version', alias_row.version);
  end if;
  new_handle_id := extensions.gen_random_uuid();
  insert into platform_private.handle_reservation(
    id, normalized_handle, display_handle, party_id, state, first_used_at, last_used_at
  ) values (
    new_handle_id, normalized, p_handle, p_alias_id, 'active', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );
  update platform_private.handle_reservation h
  set state = 'redirect', successor_handle_id = new_handle_id,
      retired_at = pg_catalog.clock_timestamp(), last_used_at = pg_catalog.clock_timestamp(),
      version = h.version + 1, updated_at = pg_catalog.clock_timestamp()
  where h.id = old_handle.id;
  update platform_private.alias_party a
  set current_handle_id = new_handle_id, version = a.version + 1, updated_at = pg_catalog.clock_timestamp()
  where a.party_id = p_alias_id and a.version = p_expected_version;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  perform platform_private.identity_record_effects(
    'identity.handle.change', auth_id, owner_id, 'alias', p_alias_id,
    'HANDLE_CHANGED', 'identity.alias.changed.v1', 'alias', p_alias_id,
    alias_row.version + 1, pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'handleId', new_handle_id, 'version', alias_row.version + 1), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', p_alias_id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'handle', p_handle, 'previousHandleId', old_handle.id, 'version', alias_row.version + 1);
end;
$body$;

-- BE01b-08: retirement is terminal and also closes the current ownership
-- period.  The old handle remains as a retired historical reservation.
create function platform_api.identity_alias_retire(p_alias_id uuid, p_expected_version bigint)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  owner_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  alias_row platform_private.alias_party%rowtype;
  current_owner uuid;
  closed_at timestamptz := pg_catalog.clock_timestamp();
begin
  select * into alias_row from platform_private.alias_party where party_id = p_alias_id for update;
  if not found then raise exception 'ALIAS_NOT_FOUND' using errcode = 'P0001'; end if;
  current_owner := platform_private.identity_current_owner(p_alias_id);
  if current_owner is null or current_owner <> owner_id then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_expected_version is null or p_expected_version <> alias_row.version then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  if alias_row.lifecycle = 'retired' then raise exception 'ALIAS_NOT_FOUND' using errcode = 'P0001'; end if;
  if exists (select 1 from platform_private.alias_transfer_offer o where o.alias_id = p_alias_id and o.state = 'pending') then
    raise exception 'OPEN_OBLIGATION' using errcode = 'P0001';
  end if;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.alias.retire', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'lifecycle', 'retired', 'publicLinkState', 'private', 'version', alias_row.version);
  end if;
  update platform_private.alias_party a
  set lifecycle = 'retired', public_link_state = 'private', version = a.version + 1, updated_at = closed_at
  where a.party_id = p_alias_id and a.version = p_expected_version;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  update platform_private.handle_reservation h
  set state = 'retired', retired_at = closed_at, last_used_at = closed_at,
      version = h.version + 1, updated_at = closed_at
  where h.id = alias_row.current_handle_id;
  update platform_private.alias_ownership_period p
  set ends_at = closed_at, version = p.version + 1, updated_at = closed_at
  where p.alias_id = p_alias_id and p.ends_at is null;
  perform platform_private.identity_record_effects(
    'identity.alias.retire', auth_id, owner_id, 'alias', p_alias_id,
    'ALIAS_RETIRED', 'identity.alias.changed.v1', 'alias', p_alias_id,
    alias_row.version + 1, pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'version', alias_row.version + 1, 'lifecycle', 'retired', 'publicLinkState', 'private'), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', p_alias_id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'lifecycle', 'retired', 'publicLinkState', 'private', 'version', alias_row.version + 1);
end;
$body$;

-- BE01b-09: create one seven-day transfer offer for the current owner.
create function platform_api.identity_transfer_offer_create(p_alias_id uuid, p_recipient_person_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  owner_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  alias_row platform_private.alias_party%rowtype;
  offer_id uuid := extensions.gen_random_uuid();
  offered_at timestamptz := pg_catalog.clock_timestamp();
  expires_at timestamptz := offered_at + interval '7 days';
  current_owner uuid;
begin
  select * into alias_row from platform_private.alias_party where party_id = p_alias_id for update;
  if not found then raise exception 'ALIAS_NOT_FOUND' using errcode = 'P0001'; end if;
  current_owner := platform_private.identity_current_owner(p_alias_id);
  if current_owner is null or current_owner <> owner_id then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_recipient_person_id is null or p_recipient_person_id = owner_id
     or not exists (select 1 from platform_private.person_party p where p.party_id = p_recipient_person_id and p.account_state in ('claimed','active')) then
    raise exception 'RECIPIENT_PERSON_INVALID' using errcode = 'P0001';
  end if;
  if alias_row.lifecycle in ('retired', 'transfer_pending') then raise exception 'TRANSFER_NOT_ALLOWED' using errcode = 'P0001'; end if;
  if exists (select 1 from platform_private.alias_transfer_offer o where o.alias_id = p_alias_id and o.state = 'pending') then
    raise exception 'TRANSFER_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.transfer.offer', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object('offerId', (idempotency.response_ref->>'resourceRef')::uuid, 'aliasId', p_alias_id, 'state', 'pending', 'expiresAt', platform_private.auth_iso_time(expires_at), 'version', 1);
  end if;
  insert into platform_private.alias_transfer_offer(
    id, alias_id, offering_person_id, recipient_person_id, state, offered_at, expires_at
  ) values (
    offer_id, p_alias_id, owner_id, p_recipient_person_id, 'pending', offered_at, expires_at
  );
  update platform_private.alias_party a
  set lifecycle = 'transfer_pending', version = a.version + 1, updated_at = offered_at
  where a.party_id = p_alias_id and a.version = alias_row.version;
  perform platform_private.identity_record_effects(
    'identity.transfer.offer', auth_id, owner_id, 'alias_transfer_offer', offer_id,
    'TRANSFER_OFFER_CREATED', 'identity.alias.changed.v1', 'alias', p_alias_id,
    alias_row.version + 1, pg_catalog.jsonb_build_object('aliasId', p_alias_id, 'offerId', offer_id, 'version', alias_row.version + 1, 'state', 'pending'), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 201, 'resourceRef', offer_id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object('offerId', offer_id, 'aliasId', p_alias_id, 'state', 'pending', 'expiresAt', platform_private.auth_iso_time(expires_at), 'version', 1);
end;
$body$;

-- BE01b-10: only the named recipient may accept, and acceptance moves the
-- ownership range under a row lock so two acceptors cannot both win.
create function platform_api.identity_transfer_accept(p_offer_id uuid, p_expected_version bigint)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  recipient_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  offer platform_private.alias_transfer_offer%rowtype;
  alias_row platform_private.alias_party%rowtype;
  current_owner uuid;
  accepted_at timestamptz := pg_catalog.clock_timestamp();
  old_period_id uuid;
begin
  select * into offer from platform_private.alias_transfer_offer where id = p_offer_id for update;
  if not found then raise exception 'TRANSFER_NOT_FOUND' using errcode = 'P0001'; end if;
  if offer.state <> 'pending' then raise exception 'TRANSFER_NOT_FOUND' using errcode = 'P0001'; end if;
  if p_expected_version is null or p_expected_version <> offer.version then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  if offer.recipient_person_id <> recipient_id then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if offer.expires_at <= accepted_at then
    update platform_private.alias_transfer_offer o
    set state = 'expired', closed_at = accepted_at, version = o.version + 1, updated_at = accepted_at
    where o.id = offer.id and o.state = 'pending';
    raise exception 'TRANSFER_EXPIRED' using errcode = 'P0001';
  end if;
  select * into alias_row from platform_private.alias_party where party_id = offer.alias_id for update;
  if not found then raise exception 'TRANSFER_NOT_FOUND' using errcode = 'P0001'; end if;
  current_owner := platform_private.identity_current_owner(offer.alias_id);
  if current_owner is null or current_owner <> offer.offering_person_id then raise exception 'TRANSFER_NOT_ALLOWED' using errcode = 'P0001'; end if;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.transfer.accept', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object('aliasId', offer.alias_id, 'lifecycle', 'transferred', 'version', alias_row.version);
  end if;
  select p.id into old_period_id
  from platform_private.alias_ownership_period p
  where p.alias_id = offer.alias_id and p.ends_at is null
  order by p.starts_at desc, p.id desc
  limit 1
  for update;
  update platform_private.alias_ownership_period p
  set ends_at = accepted_at, version = p.version + 1, updated_at = accepted_at
  where p.id = old_period_id and p.ends_at is null;
  insert into platform_private.alias_ownership_period(
    alias_id, owner_person_id, starts_at, transfer_id
  ) values (offer.alias_id, recipient_id, accepted_at, offer.id);
  update platform_private.alias_party a
  set lifecycle = 'transferred', version = a.version + 1, updated_at = accepted_at
  where a.party_id = offer.alias_id;
  update platform_private.alias_transfer_offer o
  set state = 'accepted', accepted_at = accepted_at, closed_at = accepted_at,
      version = o.version + 1, updated_at = accepted_at
  where o.id = offer.id and o.state = 'pending' and o.version = p_expected_version;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  perform platform_private.identity_record_effects(
    'identity.transfer.accept', auth_id, recipient_id, 'alias_transfer_offer', offer.id,
    'TRANSFER_ACCEPTED', 'identity.alias.changed.v1', 'alias', offer.alias_id,
    alias_row.version + 1, pg_catalog.jsonb_build_object('aliasId', offer.alias_id, 'offerId', offer.id, 'version', alias_row.version + 1, 'state', 'transferred'), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', offer.alias_id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object('aliasId', offer.alias_id, 'lifecycle', 'transferred', 'version', alias_row.version + 1);
end;
$body$;

-- BE01b-11: either named participant may decline before acceptance; no owner
-- period is created by this command.
create function platform_api.identity_transfer_decline(p_offer_id uuid, p_expected_version bigint)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  offer platform_private.alias_transfer_offer%rowtype;
  alias_row platform_private.alias_party%rowtype;
  declined_at timestamptz := pg_catalog.clock_timestamp();
begin
  select * into offer from platform_private.alias_transfer_offer where id = p_offer_id for update;
  if not found then raise exception 'TRANSFER_NOT_FOUND' using errcode = 'P0001'; end if;
  if offer.state <> 'pending' then raise exception 'TRANSFER_NOT_FOUND' using errcode = 'P0001'; end if;
  if p_expected_version is null or p_expected_version <> offer.version then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  if actor_id <> offer.offering_person_id and actor_id <> offer.recipient_person_id then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if offer.expires_at <= declined_at then
    update platform_private.alias_transfer_offer o
    set state = 'expired', closed_at = declined_at, version = o.version + 1, updated_at = declined_at
    where o.id = offer.id and o.state = 'pending';
    raise exception 'TRANSFER_EXPIRED' using errcode = 'P0001';
  end if;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, 'identity.transfer.decline', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object('offerId', offer.id, 'aliasId', offer.alias_id, 'state', 'declined', 'version', offer.version);
  end if;
  update platform_private.alias_transfer_offer o
  set state = 'declined', declined_at = declined_at, closed_at = declined_at,
      version = o.version + 1, updated_at = declined_at
  where o.id = offer.id and o.state = 'pending' and o.version = p_expected_version;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  select * into alias_row from platform_private.alias_party where party_id = offer.alias_id for update;
  if alias_row.lifecycle = 'transfer_pending' then
    update platform_private.alias_party a
    set lifecycle = 'active', version = a.version + 1, updated_at = declined_at
    where a.party_id = offer.alias_id;
  end if;
  perform platform_private.identity_record_effects(
    'identity.transfer.decline', auth_id, actor_id, 'alias_transfer_offer', offer.id,
    'TRANSFER_DECLINED', 'identity.alias.changed.v1', 'alias', offer.alias_id,
    alias_row.version + case when alias_row.lifecycle = 'transfer_pending' then 1 else 0 end,
    pg_catalog.jsonb_build_object('aliasId', offer.alias_id, 'offerId', offer.id, 'version', offer.version + 1, 'state', 'declined'), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', offer.id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object('offerId', offer.id, 'aliasId', offer.alias_id, 'state', 'declined', 'version', offer.version + 1);
end;
$body$;

-- BE01b-12: candidates are derived from canonical records.  Idle bindings are
-- expired before projection so a stale browser cannot retain authority.
create function platform_api.identity_contexts_read(p_cursor text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  now_at timestamptz := pg_catalog.clock_timestamp();
  items jsonb;
  projection_version bigint;
begin
  update platform_private.acting_context_binding b
  set state = 'expired', version = b.version + 1, updated_at = now_at
  where b.person_id = person_id and b.state = 'active'
    and b.client_binding_id <> 'self'
    and (b.expires_at <= now_at or b.last_seen_at <= now_at - interval '12 hours');
  select coalesce(pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'contextId', b.id,
      'partyId', b.acting_party_id,
      'kind', b.context_kind,
      'label', case when b.context_kind = 'person' then 'Your profile' else 'Selected context' end,
      'avatarRef', null,
      'selectable', true,
      'authorityFreshUntil', platform_private.auth_iso_time(b.expires_at)
    ) order by case when b.context_kind = 'person' then 0 else 1 end, b.created_at, b.id
  ), '[]'::jsonb), coalesce(max(b.projection_version), 1)
  into items, projection_version
  from platform_private.acting_context_binding b
  where b.person_id = person_id and b.state = 'active'
    and (b.context_kind = 'person'
      or exists (select 1 from platform_private.alias_ownership_period p
        where p.alias_id = b.acting_party_id and p.owner_person_id = person_id and p.ends_at is null));
  return pg_catalog.jsonb_build_object(
    'projectionVersion', projection_version,
    'items', items,
    'nextCursor', null,
    'hasMore', false
  );
end;
$body$;

-- BE01b-13: deliberate, per-tab binding.  The source context must be a
-- currently-derived candidate and expired/revoked sources fail closed.
create function platform_api.identity_context_bind(
  p_context_id uuid,
  p_deliberate_confirmation boolean,
  p_client_binding_id text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  person_id uuid := platform_private.identity_actor_person(auth_id);
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  idempotency platform_private.idempotency_records;
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  candidate platform_private.acting_context_binding%rowtype;
  existing platform_private.acting_context_binding%rowtype;
  binding platform_private.acting_context_binding%rowtype;
  now_at timestamptz := pg_catalog.clock_timestamp();
  operation text;
begin
  select * into candidate from platform_private.acting_context_binding b
  where b.id = p_context_id and b.person_id = person_id for update;
  if not found then
    -- The API contract carries an opaque context identifier.  During the
    -- transition from the Slice 01 party spine, older clients may still send
    -- the selected party id; resolve that only to an already-owned binding so
    -- a revoked binding still fails with CONTEXT_REVOKED rather than widening
    -- the candidate set.
    select * into candidate from platform_private.acting_context_binding b
    where b.acting_party_id = p_context_id and b.person_id = person_id
    order by b.created_at desc, b.id desc
    limit 1
    for update;
  end if;
  if not found then raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001'; end if;
  if candidate.state = 'revoked' then raise exception 'CONTEXT_REVOKED' using errcode = 'P0001'; end if;
  if candidate.state = 'expired' then raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001'; end if;
  if candidate.expires_at <= now_at or candidate.last_seen_at <= now_at - interval '12 hours' then
    update platform_private.acting_context_binding b
    set state = 'expired', version = b.version + 1, updated_at = now_at
    where b.id = candidate.id and b.state = 'active';
    raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001';
  end if;
  if p_deliberate_confirmation is distinct from true then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end if;
  if p_client_binding_id is null or pg_catalog.char_length(p_client_binding_id) not between 1 and 128
     or p_client_binding_id !~ '^[A-Za-z0-9._:-]+$' then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end if;
  if candidate.context_kind = 'alias'
     and platform_private.identity_current_owner(candidate.acting_party_id) <> person_id then
    raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
  end if;
  operation := 'identity.context.bind.' || p_client_binding_id;
  idempotency := platform_private.identity_idempotency_reserve(auth_id, operation, key_hash, request_hash);
  select * into existing from platform_private.acting_context_binding b
  where b.person_id = person_id and b.client_binding_id = p_client_binding_id and b.state = 'active'
  for update;
  if found then
    update platform_private.acting_context_binding b
    set last_seen_at = now_at, updated_at = now_at
    where b.id = existing.id;
    return pg_catalog.jsonb_build_object(
      'bindingId', existing.id, 'selectedPartyId', existing.acting_party_id,
      'expiresAt', platform_private.auth_iso_time(existing.expires_at),
      'projectionVersion', existing.projection_version, 'version', existing.version
    );
  end if;
  insert into platform_private.acting_context_binding(
    person_id, acting_party_id, context_kind, source_relationship_id,
    client_binding_id, state, selected_at, last_seen_at, expires_at,
    projection_version, version
  ) values (
    person_id, candidate.acting_party_id, candidate.context_kind,
    candidate.source_relationship_id, p_client_binding_id, 'active',
    now_at, now_at,
    case when candidate.context_kind = 'person' then 'infinity'::timestamptz else now_at + interval '12 hours' end,
    candidate.projection_version, 1
  ) returning * into binding;
  perform platform_private.identity_record_effects(
    'identity.context.bind', auth_id, person_id, 'context', person_id,
    'CONTEXT_BOUND', 'identity.context.bound.v1', 'context', person_id,
    binding.version, pg_catalog.jsonb_build_object('bindingId', binding.id, 'selectedPartyId', binding.acting_party_id, 'version', binding.version), correlation_id
  );
  update platform_private.idempotency_records set state = 'completed', response_ref = pg_catalog.jsonb_build_object('status', 200, 'resourceRef', binding.id::text) where id = idempotency.id;
  return pg_catalog.jsonb_build_object(
    'bindingId', binding.id, 'selectedPartyId', binding.acting_party_id,
    'expiresAt', platform_private.auth_iso_time(binding.expires_at),
    'projectionVersion', binding.projection_version, 'version', binding.version
  );
end;
$body$;

-- BE01b-18: one narrowly-defined security-definer projection.  Every branch
-- returns the same redacted field set and unpublished targets are concealed.
create function platform_api.get_public_party_projection(p_party_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $body$
-- set search_path = ''
declare
  response jsonb;
begin
  select pg_catalog.jsonb_build_object(
    'partyId', a.party_id,
    'kind', 'alias',
    'displayName', a.display_name,
    'handle', h.display_handle,
    'profileRef', null,
    'publicLinkState', a.public_link_state::text,
    'lifecycle', a.lifecycle::text,
    'version', a.version,
    'facetLabels', '[]'::jsonb
  ) into response
  from platform_private.alias_party a
  join platform_private.handle_reservation h on h.id = a.current_handle_id and h.state = 'active'
  where a.party_id = p_party_id
    and a.public_link_state = 'public'
    and a.lifecycle in ('active', 'transferred');
  if response is not null then return response; end if;
  select pg_catalog.jsonb_build_object(
    'partyId', p.party_id,
    'kind', 'person',
    'displayName', null,
    'handle', null,
    'profileRef', p.public_profile_id,
    'publicLinkState', null,
    'lifecycle', null,
    'version', p.version,
    'facetLabels', '[]'::jsonb
  ) into response
  from platform_private.person_party p
  where p.party_id = p_party_id and p.account_state in ('claimed', 'active');
  if response is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  return response;
end;
$body$;

-- API schema is an allowlist.  In particular, service_role is not an
-- authorization shortcut for these human-facing identity mutations.
revoke all on function
  platform_api.identity_create(),
  platform_api.identity_person_read(),
  platform_api.identity_facet_add(text),
  platform_api.identity_facet_remove(text, bigint),
  platform_api.identity_alias_create(text, text, text),
  platform_api.identity_alias_patch(uuid, text, text, bigint),
  platform_api.identity_handle_change(uuid, text, bigint),
  platform_api.identity_alias_retire(uuid, bigint),
  platform_api.identity_transfer_offer_create(uuid, uuid),
  platform_api.identity_transfer_accept(uuid, bigint),
  platform_api.identity_transfer_decline(uuid, bigint),
  platform_api.identity_contexts_read(text),
  platform_api.identity_context_bind(uuid, boolean, text),
  platform_api.get_public_party_projection(uuid)
from public, anon, authenticated, service_role;

grant execute on function
  platform_api.identity_create(),
  platform_api.identity_person_read(),
  platform_api.identity_facet_add(text),
  platform_api.identity_facet_remove(text, bigint),
  platform_api.identity_alias_create(text, text, text),
  platform_api.identity_alias_patch(uuid, text, text, bigint),
  platform_api.identity_handle_change(uuid, text, bigint),
  platform_api.identity_alias_retire(uuid, bigint),
  platform_api.identity_transfer_offer_create(uuid, uuid),
  platform_api.identity_transfer_accept(uuid, bigint),
  platform_api.identity_transfer_decline(uuid, bigint),
  platform_api.identity_contexts_read(text),
  platform_api.identity_context_bind(uuid, boolean, text)
to authenticated;

grant execute on function platform_api.get_public_party_projection(uuid)
to anon, authenticated;

revoke all on function
  platform_private.normalize_identity_handle(text),
  platform_private.identity_auth_user(),
  platform_private.identity_actor_person(uuid),
  platform_private.identity_uuid_setting(text),
  platform_private.identity_hash_setting(text),
  platform_private.identity_idempotency_reserve(uuid, text, bytea, bytea),
  platform_private.identity_current_owner(uuid),
  platform_private.identity_record_effects(text, uuid, uuid, text, uuid, text, text, text, uuid, bigint, jsonb, uuid),
  platform_private.guard_handle_reservation(),
  platform_private.guard_alias_ownership_period(),
  platform_private.identity_validate_display_name(text),
  platform_private.identity_normalized_handle(text)
from public, anon, authenticated, service_role;

commit;

-- Rollback policy: this identity state is governed by forward-only
-- compensating migrations; audit and outbox history is never rewritten.
