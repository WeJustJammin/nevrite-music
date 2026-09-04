-- Phase 02 / Slice 04: organizations, organization types, and membership
-- tenure.  Canonical rows live behind forced RLS and named security-definer
-- RPCs; browser and service roles receive no direct table or function grants.

create schema if not exists identity_private;
revoke all on schema identity_private from public, anon, authenticated, service_role;

create extension if not exists btree_gist with schema extensions;

-- Extend the platform event allow-list with identifier-only identity events.
-- Existing event contracts remain unchanged; unknown event types stay
-- forward-compatible as before.
create or replace function platform_private.valid_base_event_payload(
  event_type text,
  schema_version integer,
  payload jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  identifier text;
begin
  if event_type = 'identity.organization.changed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ? 'organizationId'
      and payload - array['organizationId']::text[] = '{}'::jsonb
      and (payload->>'organizationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.relationship.changed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['relationshipType', 'relationshipId']::text[]
      and payload - array['relationshipType', 'relationshipId']::text[] = '{}'::jsonb
      and pg_catalog.jsonb_typeof(payload->'relationshipType') = 'string'
      and (payload->>'relationshipId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.acting-context.revoked.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['personId', 'partyId', 'relationshipId']::text[]
      and payload - array['personId', 'partyId', 'relationshipId']::text[] = '{}'::jsonb
      and (payload->>'personId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'partyId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'relationshipId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.governance.activated.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['organizationId', 'termsVersionId']::text[]
      and payload - array['organizationId', 'termsVersionId']::text[] = '{}'::jsonb
      and (payload->>'organizationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'termsVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  end if;

  if event_type not in ('job.requested', 'object.uploaded', 'provider.operation.requested', 'webhook.accepted')
     or schema_version <> 1 then
    return true;
  end if;
  if pg_catalog.jsonb_typeof(payload) <> 'object' then
    return false;
  end if;
  if event_type = 'job.requested' then
    if not (payload ?& array['jobType', 'jobId']::text[])
       or payload - array['jobType', 'jobId']::text[] <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(payload->'jobType') <> 'string'
       or payload->>'jobType' !~ '^[a-z0-9][a-z0-9._-]{0,127}$' then
      return false;
    end if;
    identifier := payload->>'jobId';
  elsif event_type = 'object.uploaded' then
    if payload - array['objectId']::text[] <> '{}'::jsonb or not (payload ? 'objectId') then
      return false;
    end if;
    identifier := payload->>'objectId';
  elsif event_type = 'provider.operation.requested' then
    if payload - array['operationId']::text[] <> '{}'::jsonb or not (payload ? 'operationId') then
      return false;
    end if;
    identifier := payload->>'operationId';
  else
    if payload - array['receiptId']::text[] <> '{}'::jsonb or not (payload ? 'receiptId') then
      return false;
    end if;
    identifier := payload->>'receiptId';
  end if;
  return pg_catalog.jsonb_typeof(payload->(
      case when event_type = 'job.requested' then 'jobId'
           when event_type = 'object.uploaded' then 'objectId'
           when event_type = 'provider.operation.requested' then 'operationId'
           else 'receiptId' end
    )) = 'string'
    and identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
end;
$body$;

-- Slice 04 mutations replay the exact validated success resource.  The shared
-- idempotency table deliberately stores only a bounded response reference by
-- default; this extension keeps the replay body private while retaining the
-- BE00 reference fields used by older operations.
create or replace function platform_private.valid_response_ref(value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  status text;
  key text;
begin
  if value is null then return true; end if;
  if pg_catalog.jsonb_typeof(value) <> 'object' or not (value ? 'status') then
    return false;
  end if;
  if pg_catalog.jsonb_typeof(value->'status') <> 'number' then return false; end if;
  status := value->>'status';
  if status !~ '^[1-5][0-9]{2}$' then return false; end if;
  for key in select jsonb_object_keys(value) loop
    if key not in ('status', 'resourceRef', 'jobRef', 'safeHeaders', 'responseBody') then
      return false;
    end if;
  end loop;
  if value ? 'safeHeaders'
     and pg_catalog.jsonb_typeof(value->'safeHeaders') <> 'object' then
    return false;
  end if;
  if value ? 'responseBody'
     and pg_catalog.jsonb_typeof(value->'responseBody') <> 'object' then
    return false;
  end if;
  if value ? 'resourceRef' and value->'resourceRef' <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(value->'resourceRef') <> 'string'
       or btrim(value->>'resourceRef') = '') then
    return false;
  end if;
  if value ? 'jobRef' and value->'jobRef' <> 'null'::jsonb
     and (pg_catalog.jsonb_typeof(value->'jobRef') <> 'string'
       or btrim(value->>'jobRef') = '') then
    return false;
  end if;
  return true;
end;
$body$;

-- A request-context value is useful only after it has been reconciled against
-- the server-owned binding.  The helper accepts no caller-supplied party or
-- capability and therefore remains safe when a middleware bridge sets the
-- transaction-local app.* setting.
create function identity_private.trusted_acting_party(p_person_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  configured_party text := nullif(pg_catalog.current_setting('app.acting_party_id', true), '');
  configured_context text := nullif(pg_catalog.current_setting('app.acting_context_id', true), '');
  candidate platform_private.acting_context_binding%rowtype;
  now_at timestamptz := pg_catalog.clock_timestamp();
begin
  if p_person_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if configured_context is not null then
    if configured_context !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
    end if;
    select * into candidate
      from platform_private.acting_context_binding b
     where b.id = configured_context::uuid and b.person_id = p_person_id
     for update;
  elsif configured_party is not null then
    if configured_party !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
    end if;
    select * into candidate
      from platform_private.acting_context_binding b
     where b.acting_party_id = configured_party::uuid
       and b.person_id = p_person_id
     order by b.updated_at desc, b.id desc
     limit 1
     for update;
  else
    return p_person_id;
  end if;
  if not found then
    raise exception 'CONTEXT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if candidate.state = 'revoked' then
    raise exception 'CONTEXT_REVOKED' using errcode = 'P0001';
  end if;
  if candidate.state = 'expired'
     or candidate.expires_at <= now_at
     or candidate.last_seen_at <= now_at - interval '12 hours' then
    update platform_private.acting_context_binding
       set state = 'expired', version = version + 1, updated_at = now_at
     where id = candidate.id and state = 'active';
    raise exception 'CONTEXT_RECONFIRM_REQUIRED' using errcode = 'P0001';
  end if;
  update platform_private.acting_context_binding
     set last_seen_at = now_at, updated_at = now_at
   where id = candidate.id;
  return candidate.acting_party_id;
end;
$body$;

create table identity_private.organization_party (
  party_id uuid primary key references platform_private.party(id) on delete restrict,
  ownership_state text not null default 'unclaimed'
    check (ownership_state in ('unclaimed', 'owned', 'ownerless')),
  governance_mode text not null default 'ungoverned'
    check (governance_mode in ('governed', 'ungoverned')),
  lifecycle text not null default 'active'
    check (lifecycle in ('active', 'dormant', 'closing', 'closed', 'dissolving', 'dissolved')),
  inferred_quiet_at timestamptz,
  closing_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table identity_private.governance_terms_version (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references identity_private.organization_party(party_id) on delete restrict,
  version_no bigint not null check (version_no > 0),
  terms_schema_version bigint not null check (terms_schema_version > 0),
  terms_json jsonb not null check (pg_catalog.jsonb_typeof(terms_json) = 'object'),
  document_hash bytea not null check (pg_catalog.octet_length(document_hash) = 32),
  governance_mode text not null default 'governed'
    check (governance_mode = 'governed'),
  state text not null default 'proposed'
    check (state in ('draft', 'proposed', 'active', 'superseded', 'withdrawn', 'rejected')),
  proposed_at timestamptz not null default pg_catalog.clock_timestamp(),
  effective_at timestamptz,
  supersedes_terms_id uuid references identity_private.governance_terms_version(id) on delete restrict,
  required_member_set_hash bytea not null check (pg_catalog.octet_length(required_member_set_hash) = 32),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (organization_id, version_no)
);

create unique index governance_terms_one_active
  on identity_private.governance_terms_version(organization_id)
  where state = 'active';
create index governance_terms_lookup
  on identity_private.governance_terms_version(organization_id, state, proposed_at desc);

create table identity_private.organization_actor_grant (
  organization_id uuid not null references identity_private.organization_party(party_id) on delete restrict,
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  capability_code text not null check (
    capability_code = btrim(capability_code)
    and capability_code ~ '^[a-z][a-z0-9_.-]{0,127}$'
  ),
  valid_from date not null default current_date,
  valid_through date,
  active boolean not null default true,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (organization_id, person_id, capability_code),
  check (valid_through is null or valid_through >= valid_from)
);

create index organization_actor_grant_person
  on identity_private.organization_actor_grant(person_id, organization_id, active);

create table identity_private.membership_evidence (
  id uuid primary key,
  organization_id uuid not null references identity_private.organization_party(party_id) on delete restrict,
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  evidence_kind text not null check (evidence_kind = 'historical_membership'),
  trusted boolean not null default false,
  created_at timestamptz not null default pg_catalog.clock_timestamp()
);

create table identity_private.organization_creation_quota (
  actor_id uuid primary key references platform_private.person_party(party_id) on delete restrict,
  window_started_at timestamptz not null default pg_catalog.clock_timestamp(),
  window_count integer not null default 0 check (window_count >= 0),
  lifetime_count integer not null default 0 check (lifetime_count >= 0),
  permanent_denial boolean not null default false,
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create table identity_private.organization_type_registry (
  type_code text primary key
    check (type_code = pg_catalog.lower(type_code)
      and type_code ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  registry_version bigint not null check (registry_version > 0),
  display_policy jsonb not null default '{}'::jsonb
    check (pg_catalog.jsonb_typeof(display_policy) = 'object'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registry_version, type_code)
);

create table identity_private.organization_type_assignment (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references identity_private.organization_party(party_id) on delete restrict,
  type_code text not null references identity_private.organization_type_registry(type_code) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  actor_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table identity_private.membership_tenure (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references identity_private.organization_party(party_id) on delete restrict,
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  state text not null default 'invited'
    check (state in ('invited', 'asserted', 'confirmed', 'ended', 'disputed', 'rejected', 'expired')),
  provenance text not null
    check (provenance in ('invitation', 'historical_assertion')),
  governance_mode text not null default 'ungoverned'
    check (governance_mode in ('governed', 'ungoverned')),
  starts_on date not null,
  ends_on date,
  accepted_at timestamptz,
  revoked_at timestamptz,
  accepted_terms_version_id uuid references identity_private.governance_terms_version(id) on delete restrict,
  terms_hash bytea,
  invite_expires_at timestamptz,
  evidence_ref uuid,
  actor_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on > starts_on),
  check ((provenance = 'invitation' and evidence_ref is null)
      or (provenance = 'historical_assertion' and evidence_ref is not null)),
  check ((governance_mode = 'governed' and accepted_terms_version_id is not null
           and terms_hash is not null and pg_catalog.octet_length(terms_hash) = 32)
      or (governance_mode = 'ungoverned' and accepted_terms_version_id is null
           and terms_hash is null)),
  check (state <> 'invited' or invite_expires_at is not null),
  check (state <> 'confirmed' or accepted_at is not null),
  check (state not in ('ended', 'disputed', 'rejected', 'expired') or revoked_at is not null)
);

create table identity_private.membership_counterpart_confirmation (
  id uuid primary key default extensions.gen_random_uuid(),
  tenure_id uuid not null references identity_private.membership_tenure(id) on delete restrict,
  confirmer_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  ends_on date not null,
  state text not null default 'confirmed' check (state in ('confirmed', 'withdrawn')),
  provenance text not null default 'counterparty_confirmation'
    check (provenance = 'counterparty_confirmation'),
  created_at timestamptz not null default pg_catalog.clock_timestamp()
);
create index membership_counterpart_confirmation_tenure
  on identity_private.membership_counterpart_confirmation(tenure_id, state, ends_on);

create table identity_private.membership_capacity_period (
  id uuid primary key default extensions.gen_random_uuid(),
  tenure_id uuid not null references identity_private.membership_tenure(id) on delete restrict,
  capacity text not null
    check (capacity in ('permanent', 'touring', 'staff', 'honorary')),
  starts_on date not null,
  ends_on date,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on > starts_on)
);

create table identity_private.organization_duplicate_review (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references identity_private.organization_party(party_id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'clear', 'possible_duplicate', 'review_required', 'resolved')),
  detector_version bigint not null check (detector_version > 0),
  normalized_input_hash bytea not null check (octet_length(normalized_input_hash) = 32),
  job_id uuid,
  result_ref uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, detector_version, normalized_input_hash)
);

create index organization_party_lifecycle_ownership
  on identity_private.organization_party(lifecycle, ownership_state);
create index organization_party_closing
  on identity_private.organization_party(closing_at)
  where lifecycle in ('closing', 'dissolving');
create index organization_type_registry_active
  on identity_private.organization_type_registry(active, type_code);
create unique index organization_type_assignment_active
  on identity_private.organization_type_assignment(organization_id, type_code)
  where ends_at is null;
create index organization_type_assignment_history
  on identity_private.organization_type_assignment(organization_id, starts_at desc);
create index organization_type_assignment_expiry
  on identity_private.organization_type_assignment(type_code, ends_at);
create index membership_tenure_roster
  on identity_private.membership_tenure(organization_id, state, starts_on);
create index membership_tenure_person
  on identity_private.membership_tenure(person_id, state, starts_on);
create index membership_tenure_terms
  on identity_private.membership_tenure(accepted_terms_version_id);
create index membership_tenure_confirmed_current
  on identity_private.membership_tenure(organization_id, person_id, starts_on)
  where state = 'confirmed' and ends_on is null;
create index membership_capacity_period_lookup
  on identity_private.membership_capacity_period(tenure_id, starts_on);
alter table identity_private.membership_capacity_period
  add constraint membership_capacity_periods_do_not_overlap
  exclude using gist (
    tenure_id with =,
    daterange(starts_on, coalesce(ends_on, 'infinity'::date), '[)') with &&
  );
create index organization_duplicate_review_status
  on identity_private.organization_duplicate_review(status, created_at);
create index organization_duplicate_review_job
  on identity_private.organization_duplicate_review(job_id);

alter table identity_private.organization_party enable row level security;
alter table identity_private.organization_party force row level security;
alter table identity_private.governance_terms_version enable row level security;
alter table identity_private.governance_terms_version force row level security;
alter table identity_private.organization_actor_grant enable row level security;
alter table identity_private.organization_actor_grant force row level security;
alter table identity_private.membership_evidence enable row level security;
alter table identity_private.membership_evidence force row level security;
alter table identity_private.organization_creation_quota enable row level security;
alter table identity_private.organization_creation_quota force row level security;
alter table identity_private.organization_type_registry enable row level security;
alter table identity_private.organization_type_registry force row level security;
alter table identity_private.organization_type_assignment enable row level security;
alter table identity_private.organization_type_assignment force row level security;
alter table identity_private.membership_tenure enable row level security;
alter table identity_private.membership_tenure force row level security;
alter table identity_private.membership_counterpart_confirmation enable row level security;
alter table identity_private.membership_counterpart_confirmation force row level security;
alter table identity_private.membership_capacity_period enable row level security;
alter table identity_private.membership_capacity_period force row level security;
alter table identity_private.organization_duplicate_review enable row level security;
alter table identity_private.organization_duplicate_review force row level security;

revoke all on table
  identity_private.organization_party,
  identity_private.governance_terms_version,
  identity_private.organization_actor_grant,
  identity_private.membership_evidence,
  identity_private.organization_creation_quota,
  identity_private.organization_type_registry,
  identity_private.organization_type_assignment,
  identity_private.membership_tenure,
  identity_private.membership_counterpart_confirmation,
  identity_private.membership_capacity_period,
  identity_private.organization_duplicate_review
from public, anon, authenticated, service_role;

insert into identity_private.organization_type_registry
  (type_code, registry_version, display_policy, active)
values
  ('band', 1, '{"publicLabel":"Band"}'::jsonb, true),
  ('collective', 1, '{"publicLabel":"Collective"}'::jsonb, true),
  ('studio', 1, '{"publicLabel":"Studio"}'::jsonb, true),
  ('venue', 1, '{"publicLabel":"Venue"}'::jsonb, true),
  ('label', 1, '{"publicLabel":"Label"}'::jsonb, true),
  ('agency', 1, '{"publicLabel":"Agency"}'::jsonb, true),
  ('shop', 1, '{"publicLabel":"Shop"}'::jsonb, true);

create function identity_private.organization_resource(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  organization_row identity_private.organization_party%rowtype;
  type_codes text[];
begin
  select * into organization_row
    from identity_private.organization_party
   where party_id = p_organization_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select pg_catalog.array_agg(a.type_code order by a.type_code)
    into type_codes
    from identity_private.organization_type_assignment a
   where a.organization_id = p_organization_id and a.ends_at is null;
  return pg_catalog.jsonb_build_object(
    'organizationId', organization_row.party_id,
    'ownershipState', organization_row.ownership_state,
    'lifecycle', organization_row.lifecycle,
    'typeCodes', pg_catalog.to_jsonb(coalesce(type_codes, '{}'::text[])),
    'version', organization_row.version,
    'etag', pg_catalog.concat('"', organization_row.version, '"'),
    'createdAt', platform_private.auth_iso_time(organization_row.created_at),
    'updatedAt', platform_private.auth_iso_time(organization_row.updated_at)
  );
end;
$body$;

create function identity_private.organization_public_resource(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  organization_row identity_private.organization_party%rowtype;
  type_display jsonb;
begin
  select * into organization_row
    from identity_private.organization_party
   where party_id = p_organization_id
     and lifecycle in ('active', 'dormant');
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select coalesce(pg_catalog.jsonb_agg(
    coalesce(nullif(r.display_policy->>'publicLabel', ''), initcap(r.type_code))
    order by r.type_code
  ), '[]'::jsonb)
    into type_display
    from identity_private.organization_type_assignment a
    join identity_private.organization_type_registry r on r.type_code = a.type_code
   where a.organization_id = p_organization_id and a.ends_at is null;
  return pg_catalog.jsonb_build_object(
    'organizationId', organization_row.party_id,
    'typeDisplay', type_display,
    'lifecycleLabel', initcap(organization_row.lifecycle),
    'version', organization_row.version
  );
end;
$body$;

create function identity_private.organization_type_assignment_resource(p_assignment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  assignment_row identity_private.organization_type_assignment%rowtype;
begin
  select * into assignment_row
    from identity_private.organization_type_assignment
   where id = p_assignment_id;
  if not found then raise exception 'TYPE_ASSIGNMENT_NOT_FOUND' using errcode = 'P0001'; end if;
  return pg_catalog.jsonb_build_object(
    'assignmentId', assignment_row.id,
    'organizationId', assignment_row.organization_id,
    'typeCode', assignment_row.type_code,
    'startsAt', platform_private.auth_iso_time(assignment_row.starts_at),
    'endsAt', platform_private.auth_iso_time(assignment_row.ends_at),
    'state', case when assignment_row.ends_at is null then 'active' else 'ended' end,
    'version', assignment_row.version,
    'etag', pg_catalog.concat('"', assignment_row.version, '"')
  );
end;
$body$;

create function identity_private.membership_tenure_resource(p_tenure_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  tenure_row identity_private.membership_tenure%rowtype;
begin
  select * into tenure_row
    from identity_private.membership_tenure
   where id = p_tenure_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  return pg_catalog.jsonb_build_object(
    'tenureId', tenure_row.id,
    'organizationId', tenure_row.organization_id,
    'personId', tenure_row.person_id,
    'state', tenure_row.state,
    'provenance', tenure_row.provenance,
    'startsOn', tenure_row.starts_on,
    'endsOn', tenure_row.ends_on,
    'acceptedAt', platform_private.auth_iso_time(tenure_row.accepted_at),
    'revokedAt', platform_private.auth_iso_time(tenure_row.revoked_at),
    'version', tenure_row.version,
    'etag', pg_catalog.concat('"', tenure_row.version, '"')
  );
end;
$body$;

create function identity_private.membership_capacity_resource(p_period_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  period_row identity_private.membership_capacity_period%rowtype;
begin
  select * into period_row
    from identity_private.membership_capacity_period
   where id = p_period_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  return pg_catalog.jsonb_build_object(
    'periodId', period_row.id,
    'tenureId', period_row.tenure_id,
    'capacity', period_row.capacity,
    'startsOn', period_row.starts_on,
    'endsOn', period_row.ends_on,
    'version', period_row.version,
    'etag', pg_catalog.concat('"', period_row.version, '"')
  );
end;
$body$;

create function identity_private.require_organization_actor(
  p_organization_id uuid,
  p_actor_id uuid,
  p_capability text default 'organization.admin'
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  acting_party_id uuid;
begin
  if p_organization_id is null or p_actor_id is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  acting_party_id := identity_private.trusted_acting_party(p_actor_id);
  if acting_party_id not in (p_actor_id, p_organization_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from identity_private.membership_tenure t
     where t.organization_id = p_organization_id
       and t.person_id = p_actor_id
       and t.state = 'confirmed'
       and (t.ends_on is null or t.ends_on >= current_date)
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_capability is null or p_capability = '' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from identity_private.organization_actor_grant g
     where g.organization_id = p_organization_id
       and g.person_id = p_actor_id
       and g.active
       and g.valid_from <= current_date
       and (g.valid_through is null or g.valid_through >= current_date)
       and (
         g.capability_code = p_capability
         or (p_capability = 'organization.admin'
             and g.capability_code in ('organization.owner', 'organization.admin'))
         or (p_capability = 'organization.type.manage'
             and g.capability_code in ('organization.owner', 'organization.admin', 'organization.type.manage'))
         or (p_capability = 'organization.membership.invite'
             and g.capability_code in ('organization.owner', 'organization.admin', 'organization.membership.invite'))
         or (p_capability = 'organization.membership.assert'
             and g.capability_code in ('organization.owner', 'organization.admin', 'organization.membership.assert'))
         or (p_capability = 'organization.membership.end'
             and g.capability_code in ('organization.owner', 'organization.admin', 'organization.membership.end'))
         or (p_capability = 'organization.membership.capacity'
             and g.capability_code in ('organization.owner', 'organization.admin', 'organization.membership.capacity'))
       )
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$body$;

create function identity_private.rpc_create_organization(
  p_mode text,
  p_type_codes text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  idempotency_row platform_private.idempotency_records;
  organization_id uuid;
  tenure_id uuid;
  normalized_input_hash bytea;
  organization_version bigint := 1;
  type_code text;
  type_codes text[] := coalesce(p_type_codes, '{}'::text[]);
  ownership_state text;
  quota_row identity_private.organization_creation_quota%rowtype;
  friction_review boolean := false;
  response jsonb;
begin
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  idempotency_row := platform_private.identity_idempotency_reserve(
    auth_id, 'ORG-01', key_hash, request_hash
  );
  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    return coalesce(
      idempotency_row.response_ref->'responseBody',
      identity_private.organization_resource(
        (idempotency_row.response_ref->>'resourceRef')::uuid
      )
    );
  end if;

  if p_mode is null or p_mode not in ('self_member', 'shadow_custodial', 'external_reference') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if pg_catalog.cardinality(type_codes) > 7 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if pg_catalog.cardinality(type_codes) > 0
     and exists (
       select 1 from pg_catalog.unnest(type_codes) as requested(code)
       where requested.code is null
          or requested.code <> pg_catalog.lower(requested.code)
          or not exists (
            select 1
              from identity_private.organization_type_registry r
             where r.type_code = requested.code
               and r.active
          )
     ) then
    raise exception 'ORGANIZATION_TYPE_UNKNOWN' using errcode = 'P0001';
  end if;
  if pg_catalog.cardinality(type_codes) > 0
     and exists (
       select 1
         from pg_catalog.unnest(type_codes) as requested(code)
        group by requested.code
       having count(*) > 1
     ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  insert into identity_private.organization_creation_quota(actor_id)
  values (actor_id)
  on conflict on constraint organization_creation_quota_pkey do nothing;
  select * into quota_row
    from identity_private.organization_creation_quota q
   where q.actor_id = actor_id
   for update;
  if quota_row.window_started_at <= pg_catalog.clock_timestamp() - interval '24 hours' then
    update identity_private.organization_creation_quota
       set window_started_at = pg_catalog.clock_timestamp(), window_count = 0,
           updated_at = pg_catalog.clock_timestamp()
     where organization_creation_quota.actor_id = actor_id;
    quota_row.window_count := 0;
  end if;
  friction_review := quota_row.window_count >= 3 or quota_row.lifetime_count >= 10;
  update identity_private.organization_creation_quota
     set window_count = window_count + 1,
         lifetime_count = lifetime_count + 1,
         updated_at = pg_catalog.clock_timestamp()
   where organization_creation_quota.actor_id = actor_id;

  organization_id := extensions.gen_random_uuid();
  ownership_state := case when p_mode = 'self_member' then 'owned' else 'unclaimed' end;
  insert into platform_private.party(id, kind)
  values (organization_id, 'organization');
  insert into identity_private.organization_party(
    party_id, ownership_state, governance_mode, lifecycle, version
  ) values (
    organization_id, ownership_state, 'ungoverned', 'active', organization_version
  );

  foreach type_code in array type_codes loop
    insert into identity_private.organization_type_assignment(
      organization_id, type_code, starts_at, actor_id, version
    ) values (
      organization_id, type_code, pg_catalog.clock_timestamp(), actor_id, 1
    );
  end loop;

  normalized_input_hash := extensions.digest(
    pg_catalog.convert_to(
      pg_catalog.lower(p_mode || ':' || pg_catalog.array_to_string(type_codes, ',')),
      'utf8'
    ),
    'sha256'
  );
  insert into identity_private.organization_duplicate_review(
    organization_id, status, detector_version, normalized_input_hash
  ) values (
    organization_id, case when friction_review then 'review_required' else 'pending' end,
    1, normalized_input_hash
  );

  if p_mode = 'self_member' then
    tenure_id := extensions.gen_random_uuid();
    insert into identity_private.membership_tenure(
      id, organization_id, person_id, state, provenance, starts_on,
      governance_mode, accepted_at, actor_id, version
    ) values (
      tenure_id, organization_id, actor_id, 'confirmed', 'invitation',
      current_date, 'ungoverned', pg_catalog.clock_timestamp(), actor_id, 1
    );
    insert into identity_private.membership_capacity_period(
      tenure_id, capacity, starts_on, version
    ) values (tenure_id, 'permanent', current_date, 1);
    insert into identity_private.organization_actor_grant(
      organization_id, person_id, capability_code
    )
    select organization_id, actor_id, capabilities.code
      from (values
        ('organization.owner'::text), ('organization.admin'::text),
        ('organization.type.manage'::text),
        ('organization.membership.invite'::text),
        ('organization.membership.assert'::text),
        ('organization.membership.end'::text),
        ('organization.membership.capacity'::text)
      ) capabilities(code);
  end if;

  perform platform_private.identity_record_effects(
    'identity.organization.create', auth_id, acting_party_id,
    'organization', organization_id, 'ORGANIZATION_CREATED',
    'identity.organization.changed.v1', 'organization', organization_id,
    organization_version,
    pg_catalog.jsonb_build_object('organizationId', organization_id),
    correlation_id
  );
  if tenure_id is not null then
    perform platform_private.identity_record_effects(
      'identity.membership.create', auth_id, acting_party_id,
      'membership', tenure_id, 'MEMBERSHIP_CREATED',
      'identity.relationship.changed.v1', 'membership', tenure_id, 1,
      pg_catalog.jsonb_build_object(
        'relationshipType', 'membership', 'relationshipId', tenure_id
      ),
      correlation_id
    );
  end if;

  response := identity_private.organization_resource(organization_id);
  update platform_private.idempotency_records
     set state = 'completed',
         response_ref = pg_catalog.jsonb_build_object(
           'status', 201, 'resourceRef', organization_id::text,
           'responseBody', response
         )
   where id = idempotency_row.id;
  return response;
end;
$body$;

create function identity_private.rpc_change_organization_type(
  p_organization_id uuid,
  p_type_code text,
  p_action text,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  operation_id text;
  idempotency_row platform_private.idempotency_records;
  organization_row identity_private.organization_party%rowtype;
  assignment_row identity_private.organization_type_assignment%rowtype;
  new_version bigint;
  type_codes text[];
  response jsonb;
begin
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  if p_action not in ('add', 'remove') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  operation_id := case when p_action = 'add' then 'TYPE-01' else 'TYPE-02' end;
  idempotency_row := platform_private.identity_idempotency_reserve(
    auth_id, operation_id, key_hash, request_hash
  );
  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    return coalesce(
      idempotency_row.response_ref->'responseBody',
      identity_private.organization_resource(
        (idempotency_row.response_ref->>'resourceRef')::uuid
      )
    );
  end if;
  if p_organization_id is null or p_type_code is null
     or p_expected_version is null or p_expected_version <= 0 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_action = 'add' and p_type_code <> pg_catalog.lower(p_type_code) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  select * into organization_row
    from identity_private.organization_party
   where party_id = p_organization_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  perform identity_private.require_organization_actor(
    p_organization_id, actor_id, 'organization.type.manage'
  );
  if organization_row.version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;

  if p_action = 'add' then
    if not exists (
      select 1 from identity_private.organization_type_registry
       where type_code = p_type_code and active
    ) then
      raise exception 'ORGANIZATION_TYPE_UNKNOWN' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from identity_private.organization_type_assignment
       where organization_id = p_organization_id
         and type_code = p_type_code and ends_at is null
    ) then
      raise exception 'TYPE_ASSIGNMENT_EXISTS' using errcode = 'P0001';
    end if;
    insert into identity_private.organization_type_assignment(
      organization_id, type_code, starts_at, actor_id, version
    ) values (
      p_organization_id, p_type_code, pg_catalog.clock_timestamp(), actor_id, 1
    ) returning * into assignment_row;
  else
    if p_type_code !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'TYPE_ASSIGNMENT_NOT_FOUND' using errcode = 'P0001';
    end if;
    select * into assignment_row
      from identity_private.organization_type_assignment
     where id = p_type_code::uuid
       and organization_id = p_organization_id
       and ends_at is null
     for update;
    if not found then
      raise exception 'TYPE_ASSIGNMENT_NOT_FOUND' using errcode = 'P0001';
    end if;
    update identity_private.organization_type_assignment
       set ends_at = pg_catalog.clock_timestamp(),
           version = assignment_row.version + 1,
           updated_at = pg_catalog.clock_timestamp()
     where id = assignment_row.id;
  end if;

  new_version := organization_row.version + 1;
  update identity_private.organization_party
     set version = new_version, updated_at = pg_catalog.clock_timestamp()
   where party_id = p_organization_id;
  perform platform_private.identity_record_effects(
    case when p_action = 'add'
         then 'identity.organization.type.add'
         else 'identity.organization.type.remove' end,
    auth_id, acting_party_id, 'organization', p_organization_id,
    case when p_action = 'add' then 'ORGANIZATION_TYPE_ADDED'
         else 'ORGANIZATION_TYPE_REMOVED' end,
    'identity.organization.changed.v1', 'organization', p_organization_id,
    new_version,
    pg_catalog.jsonb_build_object('organizationId', p_organization_id),
    correlation_id
  );
  select pg_catalog.array_agg(a.type_code order by a.type_code)
    into type_codes
    from identity_private.organization_type_assignment a
   where a.organization_id = p_organization_id and a.ends_at is null;
  response := case when p_action = 'add'
    then identity_private.organization_type_assignment_resource(assignment_row.id)
    else identity_private.organization_resource(p_organization_id)
  end;
  update platform_private.idempotency_records
     set state = 'completed',
         response_ref = pg_catalog.jsonb_build_object(
           'status', case when p_action = 'add' then 201 else 200 end,
           'resourceRef', case when p_action = 'add'
             then assignment_row.id::text else p_organization_id::text end,
           'responseBody', response
         )
   where id = idempotency_row.id;
  return response;
end;
$body$;

create function identity_private.rpc_invite_membership(
  p_organization_id uuid,
  p_person_id uuid,
  p_starts_on date,
  p_terms_version_id uuid,
  p_capacity text,
  p_invite_expires_at timestamptz,
  p_governance_mode text default null,
  p_expected_version bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  idempotency_row platform_private.idempotency_records;
  organization_row identity_private.organization_party%rowtype;
  terms_row identity_private.governance_terms_version%rowtype;
  tenure_id uuid := extensions.gen_random_uuid();
  organization_version bigint;
  expected_version bigint;
  requested_governance_mode text;
  response jsonb;
begin
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  expected_version := coalesce(
    p_expected_version,
    nullif(pg_catalog.current_setting('app.expected_version', true), '')::bigint
  );
  requested_governance_mode := coalesce(
    p_governance_mode,
    case when p_terms_version_id is null then 'ungoverned' else 'governed' end
  );
  idempotency_row := platform_private.identity_idempotency_reserve(
    auth_id, 'MEM-01', key_hash, request_hash
  );
  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    return coalesce(
      idempotency_row.response_ref->'responseBody',
      identity_private.membership_tenure_resource(
        (idempotency_row.response_ref->>'resourceRef')::uuid
      )
    );
  end if;
  if p_organization_id is null or p_person_id is null or p_starts_on is null
     or p_capacity not in ('permanent', 'touring', 'staff', 'honorary')
     or p_invite_expires_at is null
     or p_invite_expires_at <= pg_catalog.clock_timestamp()
     or expected_version is null or expected_version <= 0
     or requested_governance_mode not in ('governed', 'ungoverned') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if (requested_governance_mode = 'governed') <> (p_terms_version_id is not null) then
    raise exception 'GOVERNANCE_TERMS_INCOMPLETE' using errcode = 'P0001';
  end if;
  select * into organization_row
    from identity_private.organization_party
   where party_id = p_organization_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if organization_row.lifecycle not in ('active', 'dormant') then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if organization_row.governance_mode = 'governed'
     and requested_governance_mode = 'ungoverned' then
    raise exception 'GOVERNANCE_MODE_MISMATCH' using errcode = 'P0001';
  end if;
  perform identity_private.require_organization_actor(
    p_organization_id, actor_id, 'organization.membership.invite'
  );
  if organization_row.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if p_terms_version_id is not null then
    select * into terms_row
      from identity_private.governance_terms_version
     where id = p_terms_version_id
       and organization_id = p_organization_id
       and state in ('proposed', 'active')
     for update;
    if not found then
      raise exception 'GOVERNANCE_TERMS_INCOMPLETE' using errcode = 'P0001';
    end if;
  end if;
  if not exists (
    select 1
      from platform_private.person_party p
     where p.party_id = p_person_id
       and p.account_state::text not in ('erasure_processing', 'retired')
  ) then
    raise exception 'PERSON_NOT_FOUND' using errcode = 'P0001';
  end if;
  if exists (
    select 1
      from identity_private.membership_tenure t
     where t.organization_id = p_organization_id
       and t.person_id = p_person_id
       and t.state in ('invited', 'confirmed')
       and (t.ends_on is null or t.ends_on >= p_starts_on)
  ) then
    raise exception 'MEMBERSHIP_EXISTS' using errcode = 'P0001';
  end if;

  insert into identity_private.membership_tenure(
    id, organization_id, person_id, state, provenance, starts_on,
    governance_mode, accepted_terms_version_id, terms_hash,
    invite_expires_at, actor_id, version
  ) values (
    tenure_id, p_organization_id, p_person_id, 'invited', 'invitation',
    p_starts_on, requested_governance_mode, p_terms_version_id,
    terms_row.document_hash, p_invite_expires_at, actor_id, 1
  );
  insert into identity_private.membership_capacity_period(
    tenure_id, capacity, starts_on, version
  ) values (
    tenure_id, p_capacity, p_starts_on, 1
  );
  organization_version := organization_row.version + 1;
  update identity_private.organization_party
     set governance_mode = requested_governance_mode,
         version = organization_version, updated_at = pg_catalog.clock_timestamp()
   where party_id = p_organization_id;
  perform platform_private.identity_record_effects(
    'identity.membership.invite', auth_id, acting_party_id,
    'membership', tenure_id, 'MEMBERSHIP_INVITED',
    'identity.relationship.changed.v1', 'membership', tenure_id, 1,
    pg_catalog.jsonb_build_object(
      'relationshipType', 'membership', 'relationshipId', tenure_id
    ),
    correlation_id
  );
  response := identity_private.membership_tenure_resource(tenure_id);
  update platform_private.idempotency_records
     set state = 'completed',
         response_ref = pg_catalog.jsonb_build_object(
           'status', 201, 'resourceRef', tenure_id::text,
           'responseBody', response
         )
   where id = idempotency_row.id;
  return response;
end;
$body$;

create function identity_private.rpc_assert_membership(
  p_organization_id uuid,
  p_person_id uuid,
  p_starts_on date,
  p_ends_on date,
  p_evidence_ref uuid,
  p_expected_version bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  idempotency_row platform_private.idempotency_records;
  organization_row identity_private.organization_party%rowtype;
  tenure_id uuid := extensions.gen_random_uuid();
  organization_version bigint;
  expected_version bigint;
  response jsonb;
begin
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  expected_version := coalesce(
    p_expected_version,
    nullif(pg_catalog.current_setting('app.expected_version', true), '')::bigint
  );
  idempotency_row := platform_private.identity_idempotency_reserve(
    auth_id, 'MEM-02', key_hash, request_hash
  );
  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    return coalesce(
      idempotency_row.response_ref->'responseBody',
      identity_private.membership_tenure_resource(
        (idempotency_row.response_ref->>'resourceRef')::uuid
      )
    );
  end if;
  if p_organization_id is null or p_person_id is null or p_starts_on is null
     or p_evidence_ref is null
     or expected_version is null or expected_version <= 0
     or (p_ends_on is not null and p_ends_on <= p_starts_on) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into organization_row
    from identity_private.organization_party
   where party_id = p_organization_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from identity_private.membership_evidence e
     where e.id = p_evidence_ref
       and e.organization_id = p_organization_id
       and e.person_id = p_person_id
       and e.evidence_kind = 'historical_membership'
       and e.trusted
  ) then
    raise exception 'EVIDENCE_REFERENCE_INVALID' using errcode = 'P0001';
  end if;
  if organization_row.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if actor_id <> p_person_id then
    perform identity_private.require_organization_actor(
      p_organization_id, actor_id, 'organization.membership.assert'
    );
  elsif acting_party_id <> actor_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from platform_private.person_party p
     where p.party_id = p_person_id
       and p.account_state::text not in ('erasure_processing', 'retired')
  ) then
    raise exception 'PERSON_NOT_FOUND' using errcode = 'P0001';
  end if;
  if exists (
    select 1
      from identity_private.membership_tenure t
     where t.organization_id = p_organization_id
       and t.person_id = p_person_id
       and t.state in ('invited', 'asserted', 'confirmed')
       and (t.ends_on is null or t.ends_on >= p_starts_on)
  ) then
    raise exception 'MEMBERSHIP_EXISTS' using errcode = 'P0001';
  end if;

  insert into identity_private.membership_tenure(
    id, organization_id, person_id, state, provenance, starts_on,
    ends_on, evidence_ref, actor_id, version
  ) values (
    tenure_id, p_organization_id, p_person_id, 'asserted',
    'historical_assertion', p_starts_on, p_ends_on, p_evidence_ref,
    actor_id, 1
  );
  organization_version := organization_row.version + 1;
  update identity_private.organization_party
     set version = organization_version, updated_at = pg_catalog.clock_timestamp()
   where party_id = p_organization_id;
  perform platform_private.identity_record_effects(
    'identity.membership.assert', auth_id, acting_party_id,
    'membership', tenure_id, 'MEMBERSHIP_ASSERTED',
    'identity.relationship.changed.v1', 'membership', tenure_id, 1,
    pg_catalog.jsonb_build_object(
      'relationshipType', 'membership', 'relationshipId', tenure_id
    ),
    correlation_id
  );
  response := identity_private.membership_tenure_resource(tenure_id);
  update platform_private.idempotency_records
     set state = 'completed',
         response_ref = pg_catalog.jsonb_build_object(
           'status', 201, 'resourceRef', tenure_id::text,
           'responseBody', response
         )
   where id = idempotency_row.id;
  return response;
end;
$body$;

create function identity_private.rpc_accept_or_end_membership(
  p_tenure_id uuid,
  p_action text,
  p_expected_version bigint,
  p_terms_version_id uuid,
  p_ends_on date,
  p_counterpart_confirmation_id uuid,
  p_reason_code text,
  p_terms_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  idempotency_row platform_private.idempotency_records;
  tenure_row identity_private.membership_tenure%rowtype;
  organization_row identity_private.organization_party%rowtype;
  terms_row identity_private.governance_terms_version%rowtype;
  context_row platform_private.acting_context_binding%rowtype;
  organization_version bigint;
  new_version bigint;
  effective_end date;
  terms_hash_text text;
  response jsonb;
begin
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  terms_hash_text := coalesce(
    p_terms_hash,
    nullif(pg_catalog.current_setting('app.terms_hash', true), '')
  );
  if p_action not in ('accept', 'end') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  idempotency_row := platform_private.identity_idempotency_reserve(
    auth_id, case when p_action = 'accept' then 'MEM-03' else 'MEM-04' end,
    key_hash, request_hash
  );
  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    return coalesce(
      idempotency_row.response_ref->'responseBody',
      identity_private.membership_tenure_resource(
        (idempotency_row.response_ref->>'resourceRef')::uuid
      )
    );
  end if;
  if p_tenure_id is null or p_expected_version is null or p_expected_version <= 0 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  -- Read the relationship key without a lock, then acquire contexts before
  -- the tenure row.  This is the writer-side prefix of the shared
  -- graph -> context -> tenure -> grants -> review -> approval order; taking
  -- tenure first here would invert activation's context/tenure edge.
  select * into tenure_row
    from identity_private.membership_tenure
   where id = p_tenure_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_action = 'end' then
    for context_row in
      select *
        from platform_private.acting_context_binding b
       where b.person_id = tenure_row.person_id
         and b.state = 'active'
         and (b.acting_party_id = tenure_row.organization_id
           or b.source_relationship_id = p_tenure_id)
       order by b.id
       for update
    loop
      null;
    end loop;
  end if;
  select * into tenure_row
    from identity_private.membership_tenure
   where id = p_tenure_id
   order by id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into organization_row
    from identity_private.organization_party
   where party_id = tenure_row.organization_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if tenure_row.version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;

  if p_action = 'accept' then
    if actor_id <> tenure_row.person_id or acting_party_id <> actor_id then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    if tenure_row.state <> 'invited'
       or tenure_row.invite_expires_at <= pg_catalog.clock_timestamp() then
      raise exception 'MEMBERSHIP_NOT_INVITABLE' using errcode = 'P0001';
    end if;
    if tenure_row.governance_mode <> 'governed'
       or p_terms_version_id is distinct from tenure_row.accepted_terms_version_id
       or terms_hash_text is null
       or terms_hash_text !~ '^[a-f0-9]{64}$' then
      raise exception 'TERMS_VERSION_MISMATCH' using errcode = 'P0001';
    end if;
    select * into terms_row
      from identity_private.governance_terms_version
     where id = p_terms_version_id
       and organization_id = tenure_row.organization_id
       and state in ('proposed', 'active')
     for update;
    if not found
       or terms_row.document_hash <> decode(terms_hash_text, 'hex')
       or tenure_row.terms_hash <> terms_row.document_hash then
      raise exception 'TERMS_VERSION_MISMATCH' using errcode = 'P0001';
    end if;
    new_version := tenure_row.version + 1;
    update identity_private.membership_tenure
       set state = 'confirmed',
           accepted_at = pg_catalog.clock_timestamp(),
           version = new_version,
           updated_at = pg_catalog.clock_timestamp()
     where id = p_tenure_id;
  else
    if p_reason_code is null
       or p_reason_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$'
       or p_terms_version_id is not null
       or terms_hash_text is not null then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    if tenure_row.state <> 'confirmed' then
      raise exception 'MEMBERSHIP_NOT_CONFIRMED' using errcode = 'P0001';
    end if;
    if actor_id <> tenure_row.person_id or acting_party_id <> actor_id then
      perform identity_private.require_organization_actor(
        tenure_row.organization_id, actor_id, 'organization.membership.end'
      );
    end if;
    effective_end := coalesce(p_ends_on, current_date);
    if effective_end <= tenure_row.starts_on then
      raise exception 'PERIOD_INVALID' using errcode = 'P0001';
    end if;
    if p_ends_on is null and p_counterpart_confirmation_id is not null then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    if effective_end < current_date then
      if p_counterpart_confirmation_id is null then
        raise exception 'COUNTERPART_CONFIRMATION_REQUIRED' using errcode = 'P0001';
      end if;
      if not exists (
        select 1
          from identity_private.membership_counterpart_confirmation c
         where c.id = p_counterpart_confirmation_id
           and c.tenure_id = p_tenure_id
           and c.state = 'confirmed'
           and c.ends_on = effective_end
           and c.confirmer_person_id <> actor_id
      ) then
        raise exception 'COUNTERPART_CONFIRMATION_INVALID' using errcode = 'P0001';
      end if;
    elsif p_counterpart_confirmation_id is not null then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    new_version := tenure_row.version + 1;
    update identity_private.membership_tenure
       set state = 'ended',
           ends_on = effective_end,
           revoked_at = pg_catalog.clock_timestamp(),
           updated_at = pg_catalog.clock_timestamp(),
           version = new_version
     where id = p_tenure_id;
  end if;

  organization_version := organization_row.version + 1;
  update identity_private.organization_party
     set version = organization_version, updated_at = pg_catalog.clock_timestamp()
   where party_id = tenure_row.organization_id;
  perform platform_private.identity_record_effects(
    case when p_action = 'accept'
         then 'identity.membership.accept'
         else 'identity.membership.end' end,
    auth_id, acting_party_id, 'membership', p_tenure_id,
    case when p_action = 'accept' then 'MEMBERSHIP_ACCEPTED'
         else coalesce(p_reason_code, 'MEMBERSHIP_ENDED') end,
    'identity.relationship.changed.v1', 'membership', p_tenure_id,
    new_version,
    pg_catalog.jsonb_build_object(
      'relationshipType', 'membership', 'relationshipId', p_tenure_id
    ),
    correlation_id
  );
  if p_action = 'end' then
    -- Contexts were locked before tenure above; repeat the deterministic read
    -- after the tenure CAS and revoke the same rows without changing order.
    for context_row in
      select *
        from platform_private.acting_context_binding b
       where b.person_id = tenure_row.person_id
         and b.state = 'active'
         and (b.acting_party_id = tenure_row.organization_id
           or b.source_relationship_id = p_tenure_id)
       order by b.id
    loop
      update platform_private.acting_context_binding
         set state = 'revoked', version = context_row.version + 1,
             updated_at = pg_catalog.clock_timestamp()
       where id = context_row.id;
      perform platform_private.identity_record_effects(
        'identity.acting-context.revoke', auth_id, context_row.acting_party_id,
        'context', context_row.id, 'MEMBERSHIP_ENDED',
        'identity.acting-context.revoked.v1', 'membership', p_tenure_id,
        new_version,
        pg_catalog.jsonb_build_object(
          'personId', tenure_row.person_id,
          'partyId', context_row.acting_party_id,
          'relationshipId', p_tenure_id
        ), correlation_id
      );
    end loop;
  end if;
  response := identity_private.membership_tenure_resource(p_tenure_id);
  update platform_private.idempotency_records
     set state = 'completed',
         response_ref = pg_catalog.jsonb_build_object(
           'status', 200, 'resourceRef', p_tenure_id::text,
           'responseBody', response
         )
   where id = idempotency_row.id;
  return response;
end;
$body$;

create function identity_private.rpc_add_capacity_period(
  p_tenure_id uuid,
  p_capacity text,
  p_starts_on date,
  p_ends_on date,
  p_expected_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  key_hash bytea := platform_private.identity_hash_setting('app.idempotency_key_hash');
  request_hash bytea := platform_private.identity_hash_setting('app.request_hash');
  correlation_id uuid := platform_private.identity_uuid_setting('app.correlation_id');
  idempotency_row platform_private.idempotency_records;
  tenure_row identity_private.membership_tenure%rowtype;
  organization_row identity_private.organization_party%rowtype;
  period_id uuid := extensions.gen_random_uuid();
  new_version bigint;
  response jsonb;
begin
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  idempotency_row := platform_private.identity_idempotency_reserve(
    auth_id, 'MEM-05', key_hash, request_hash
  );
  if idempotency_row.state = 'completed'::platform_private.idempotency_state then
    return coalesce(
      idempotency_row.response_ref->'responseBody',
      identity_private.membership_capacity_resource(
        (idempotency_row.response_ref->>'resourceRef')::uuid
      )
    );
  end if;
  if p_tenure_id is null or p_capacity not in ('permanent', 'touring', 'staff', 'honorary')
     or p_starts_on is null or p_expected_version is null or p_expected_version <= 0
     or (p_ends_on is not null and p_ends_on <= p_starts_on) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into tenure_row
    from identity_private.membership_tenure
   where id = p_tenure_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into organization_row
    from identity_private.organization_party
   where party_id = tenure_row.organization_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if tenure_row.version <> p_expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if tenure_row.state <> 'confirmed'
     or p_starts_on < tenure_row.starts_on
     or (tenure_row.ends_on is not null
       and coalesce(p_ends_on, 'infinity'::date) > tenure_row.ends_on) then
    raise exception 'PERIOD_INVALID' using errcode = 'P0001';
  end if;
  if actor_id <> tenure_row.person_id or acting_party_id <> actor_id then
    perform identity_private.require_organization_actor(
      tenure_row.organization_id, actor_id, 'organization.membership.capacity'
    );
  end if;

  insert into identity_private.membership_capacity_period(
    id, tenure_id, capacity, starts_on, ends_on, version
  ) values (
    period_id, p_tenure_id, p_capacity, p_starts_on, p_ends_on, 1
  );
  new_version := tenure_row.version + 1;
  update identity_private.membership_tenure
     set version = new_version, updated_at = pg_catalog.clock_timestamp()
   where id = p_tenure_id;
  update identity_private.organization_party
     set version = organization_row.version + 1,
         updated_at = pg_catalog.clock_timestamp()
   where party_id = tenure_row.organization_id;
  perform platform_private.identity_record_effects(
    'identity.membership.capacity.add', auth_id, acting_party_id,
    'membership', p_tenure_id, 'CAPACITY_PERIOD_ADDED',
    'identity.relationship.changed.v1', 'membership', p_tenure_id,
    new_version,
    pg_catalog.jsonb_build_object(
      'relationshipType', 'membership', 'relationshipId', p_tenure_id
    ),
    correlation_id
  );
  response := identity_private.membership_capacity_resource(period_id);
  update platform_private.idempotency_records
     set state = 'completed',
         response_ref = pg_catalog.jsonb_build_object(
           'status', 201, 'resourceRef', period_id::text,
           'responseBody', response
         )
   where id = idempotency_row.id;
  return response;
end;
$body$;

create function identity_private.identity_organization_read(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_setting text := nullif(pg_catalog.current_setting('app.auth_user_id', true), '');
  request_claim text := nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), '');
  auth_id uuid;
  actor_id uuid;
  acting_party_id uuid;
begin
  if p_organization_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if auth_setting is null and request_claim is null then
    return identity_private.organization_public_resource(p_organization_id);
  end if;
  auth_id := platform_private.identity_auth_user();
  actor_id := platform_private.identity_actor_person(auth_id);
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  if acting_party_id in (actor_id, p_organization_id)
     and (
       exists (
         select 1
           from identity_private.membership_tenure t
          where t.organization_id = p_organization_id
            and t.person_id = actor_id
            and t.state = 'confirmed'
            and (t.ends_on is null or t.ends_on >= current_date)
       )
       or exists (
         select 1
           from identity_private.organization_actor_grant g
          where g.organization_id = p_organization_id
            and g.person_id = actor_id
            and g.active
            and g.valid_from <= current_date
            and (g.valid_through is null or g.valid_through >= current_date)
       )
     ) then
    return identity_private.organization_resource(p_organization_id);
  end if;
  return identity_private.organization_public_resource(p_organization_id);
end;
$body$;

create function identity_private.identity_memberships_read(
  p_organization_id uuid,
  p_cursor text default null,
  p_limit integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
#variable_conflict use_variable
declare
  auth_id uuid := platform_private.identity_auth_user();
  actor_id uuid := platform_private.identity_actor_person(auth_id);
  acting_party_id uuid;
  items jsonb;
  has_more boolean;
  requested_limit integer := coalesce(p_limit, 25);
begin
  if p_organization_id is null or requested_limit < 1 or requested_limit > 50 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_cursor is not null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  acting_party_id := identity_private.trusted_acting_party(actor_id);
  if acting_party_id not in (actor_id, p_organization_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from identity_private.membership_tenure t
     where t.organization_id = p_organization_id
       and t.person_id = actor_id
       and t.state = 'confirmed'
       and (t.ends_on is null or t.ends_on >= current_date)
  ) and not exists (
    select 1
      from identity_private.organization_actor_grant g
     where g.organization_id = p_organization_id
       and g.person_id = actor_id
       and g.active
       and g.valid_from <= current_date
       and (g.valid_through is null or g.valid_through >= current_date)
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  select coalesce(
    pg_catalog.jsonb_agg(identity_private.membership_tenure_resource(page.id)
      order by page.created_at desc, page.id desc), '[]'::jsonb),
    (select count(*) > requested_limit
       from identity_private.membership_tenure look
      where look.organization_id = p_organization_id
        and look.state in ('invited', 'asserted', 'confirmed'))
    into items, has_more
    from (
      select t.id, t.created_at
        from identity_private.membership_tenure t
       where t.organization_id = p_organization_id
         and t.state in ('invited', 'asserted', 'confirmed')
       order by t.created_at desc, t.id desc
       limit requested_limit
    ) page;
  return pg_catalog.jsonb_build_object(
    'items', items, 'nextCursor', null, 'hasMore', coalesce(has_more, false)
  );
end;
$body$;

-- Keep the Data API surface as a narrow allow-list.  These wrappers do not
-- accept actor, role or capability claims; the private RPC derives them from
-- the verified session and trusted context binding.
create schema if not exists api_identity;
revoke all on schema api_identity from public, anon, authenticated, service_role;
create view api_identity.organization_control_snapshot_v1
  with (security_invoker = true) as
  select o.party_id as organization_id, o.version as organization_version,
         o.governance_mode, a.type_code
    from identity_private.organization_party o
    left join identity_private.organization_type_assignment a
      on a.organization_id = o.party_id and a.ends_at is null;
create view api_identity.authority_snapshot_v1
  with (security_invoker = true) as
  select g.organization_id, g.person_id as human_id,
         g.capability_code, g.updated_at
    from identity_private.organization_actor_grant g
   where g.active;
create view api_identity.acting_context_event_projection_v1
  with (security_invoker = true) as
  select b.person_id, b.acting_party_id, b.source_relationship_id,
         b.state, b.projection_version, b.version
    from platform_private.acting_context_binding b;
revoke all on table
  api_identity.organization_control_snapshot_v1,
  api_identity.authority_snapshot_v1,
  api_identity.acting_context_event_projection_v1
from public, anon, authenticated, service_role;

create function platform_api.rpc_create_organization(
  p_mode text, p_type_codes text[]
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.rpc_create_organization(p_mode, p_type_codes); end;
$body$;
create function platform_api.rpc_change_organization_type(
  p_organization_id uuid, p_type_code text, p_action text, p_expected_version bigint
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.rpc_change_organization_type(
  p_organization_id, p_type_code, p_action, p_expected_version
); end;
$body$;
create function platform_api.rpc_invite_membership(
  p_organization_id uuid, p_person_id uuid, p_starts_on date,
  p_terms_version_id uuid, p_capacity text, p_invite_expires_at timestamptz,
  p_governance_mode text default null, p_expected_version bigint default null
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.rpc_invite_membership(
  p_organization_id, p_person_id, p_starts_on, p_terms_version_id,
  p_capacity, p_invite_expires_at, p_governance_mode, p_expected_version
); end;
$body$;
create function platform_api.rpc_assert_membership(
  p_organization_id uuid, p_person_id uuid, p_starts_on date,
  p_ends_on date, p_evidence_ref uuid, p_expected_version bigint default null
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.rpc_assert_membership(
  p_organization_id, p_person_id, p_starts_on, p_ends_on,
  p_evidence_ref, p_expected_version
); end;
$body$;
create function platform_api.rpc_accept_or_end_membership(
  p_tenure_id uuid, p_action text, p_expected_version bigint,
  p_terms_version_id uuid, p_ends_on date, p_counterpart_confirmation_id uuid,
  p_reason_code text, p_terms_hash text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.rpc_accept_or_end_membership(
  p_tenure_id, p_action, p_expected_version, p_terms_version_id, p_ends_on,
  p_counterpart_confirmation_id, p_reason_code, p_terms_hash
); end;
$body$;
create function platform_api.rpc_add_capacity_period(
  p_tenure_id uuid, p_capacity text, p_starts_on date, p_ends_on date,
  p_expected_version bigint
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.rpc_add_capacity_period(
  p_tenure_id, p_capacity, p_starts_on, p_ends_on, p_expected_version
); end;
$body$;
create function platform_api.identity_organization_read(p_organization_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.identity_organization_read(p_organization_id); end;
$body$;
create function platform_api.identity_memberships_read(
  p_organization_id uuid, p_cursor text default null, p_limit integer default 25
)
returns jsonb language plpgsql security definer set search_path = '' as $body$
begin return identity_private.identity_memberships_read(p_organization_id, p_cursor, p_limit); end;
$body$;

revoke all on function platform_api.rpc_create_organization(text, text[]),
  platform_api.rpc_change_organization_type(uuid, text, text, bigint),
  platform_api.rpc_invite_membership(uuid, uuid, date, uuid, text, timestamptz, text, bigint),
  platform_api.rpc_assert_membership(uuid, uuid, date, date, uuid, bigint),
  platform_api.rpc_accept_or_end_membership(uuid, text, bigint, uuid, date, uuid, text, text),
  platform_api.rpc_add_capacity_period(uuid, text, date, date, bigint),
  platform_api.identity_organization_read(uuid),
  platform_api.identity_memberships_read(uuid, text, integer)
from public, anon, authenticated, service_role;
grant execute on function platform_api.rpc_create_organization(text, text[]),
  platform_api.rpc_change_organization_type(uuid, text, text, bigint),
  platform_api.rpc_invite_membership(uuid, uuid, date, uuid, text, timestamptz, text, bigint),
  platform_api.rpc_assert_membership(uuid, uuid, date, date, uuid, bigint),
  platform_api.rpc_accept_or_end_membership(uuid, text, bigint, uuid, date, uuid, text, text),
  platform_api.rpc_add_capacity_period(uuid, text, date, date, bigint),
  platform_api.identity_memberships_read(uuid, text, integer)
to authenticated;
grant execute on function platform_api.identity_organization_read(uuid)
to anon, authenticated;

revoke all on function identity_private.require_organization_actor(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function identity_private.rpc_create_organization(text, text[])
  from public, anon, authenticated, service_role;
revoke all on function identity_private.rpc_change_organization_type(uuid, text, text, bigint)
  from public, anon, authenticated, service_role;
revoke all on function identity_private.rpc_invite_membership(uuid, uuid, date, uuid, text, timestamptz, text, bigint)
  from public, anon, authenticated, service_role;
revoke all on function identity_private.rpc_assert_membership(uuid, uuid, date, date, uuid, bigint)
  from public, anon, authenticated, service_role;
revoke all on function identity_private.rpc_accept_or_end_membership(uuid, text, bigint, uuid, date, uuid, text, text)
  from public, anon, authenticated, service_role;
revoke all on function identity_private.rpc_add_capacity_period(uuid, text, date, date, bigint)
  from public, anon, authenticated, service_role;
