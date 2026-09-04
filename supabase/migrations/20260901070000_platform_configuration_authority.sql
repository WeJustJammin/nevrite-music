begin;

-- Slice 07 canonical configuration authority.  Definitions and values are
-- private, versioned records.  The Worker reaches them only through the
-- named RPCs added by the command and wrapper migrations.

create schema if not exists platform_private;

create or replace function platform_private.cfg_json_depth(p_value jsonb)
returns integer
language plpgsql
immutable
set search_path = ''
as $body$
declare
  child jsonb;
  deepest integer := 0;
begin
  if p_value is null then return 0; end if;
  if pg_catalog.jsonb_typeof(p_value) = 'object' then
    for child in select value from pg_catalog.jsonb_each(p_value) loop
      deepest := greatest(deepest, platform_private.cfg_json_depth(child));
    end loop;
    return deepest + 1;
  elsif pg_catalog.jsonb_typeof(p_value) = 'array' then
    for child in select value from pg_catalog.jsonb_array_elements(p_value) loop
      deepest := greatest(deepest, platform_private.cfg_json_depth(child));
    end loop;
    return deepest + 1;
  end if;
  return 0;
end;
$body$;

create or replace function platform_private.cfg_json_bounded(
  p_value jsonb, p_max_depth integer default 4, p_max_bytes integer default 65536
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  child jsonb;
begin
  if p_value is null
     or p_max_depth < 0
     or p_max_bytes < 1
     or pg_catalog.octet_length(p_value::text) > p_max_bytes
     or platform_private.cfg_json_depth(p_value) > p_max_depth then
    return false;
  end if;
  if pg_catalog.jsonb_typeof(p_value) = 'object' then
    if (select count(*) from pg_catalog.jsonb_object_keys(p_value)) > 64 then
      return false;
    end if;
    for child in select value from pg_catalog.jsonb_each(p_value) loop
      if not platform_private.cfg_json_bounded(child, p_max_depth - 1, p_max_bytes) then
        return false;
      end if;
    end loop;
  elsif pg_catalog.jsonb_typeof(p_value) = 'array' then
    if pg_catalog.jsonb_array_length(p_value) > 64 then return false; end if;
    for child in select value from pg_catalog.jsonb_array_elements(p_value) loop
      if not platform_private.cfg_json_bounded(child, p_max_depth - 1, p_max_bytes) then
        return false;
      end if;
    end loop;
  end if;
  return true;
end;
$body$;

create or replace function platform_private.cfg_require_keys(
  p_value jsonb, p_allowed text[], p_required text[] default '{}'
)
returns void
language plpgsql
immutable
set search_path = ''
as $body$
declare
  key_name text;
begin
  if p_value is null or pg_catalog.jsonb_typeof(p_value) <> 'object'
     or p_allowed is null or p_required is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  for key_name in select pg_catalog.jsonb_object_keys(p_value) loop
    if not key_name = any(p_allowed) then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
  end loop;
  foreach key_name in array p_required loop
    if not (p_value ? key_name) then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
  end loop;
end;
$body$;

create or replace function platform_private.cfg_array_distinct(p_values text[])
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_values is not null
     and cardinality(p_values) = (select count(distinct value) from unnest(p_values) value);
$body$;

create or replace function platform_private.cfg_hash_json(p_value jsonb)
returns text
language sql
immutable
set search_path = ''
as $body$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(coalesce(p_value::text, 'null'), 'utf8'),
      'sha256'
    ),
    'hex'
  );
$body$;

create or replace function platform_private.cfg_hash_text(p_value text)
returns bytea
language sql
immutable
set search_path = ''
as $body$
  select extensions.digest(
    pg_catalog.convert_to(coalesce(p_value, ''), 'utf8'),
    'sha256'
  );
$body$;

create or replace function platform_private.cfg_valid_uuid(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_value is not null
     and p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
$body$;

create or replace function platform_private.cfg_valid_key(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_value is not null
     and pg_catalog.length(p_value) <= 128
     and p_value ~ '^[a-z][a-z0-9]*([._-][a-z0-9]+){0,15}$';
$body$;

create or replace function platform_private.cfg_protected_key(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select coalesce(p_value, '') ~* '(secret|token|password|credential|private[._-]?key|api[._-]?key|access[._-]?key|auth[._-]?header)';
$body$;

create or replace function platform_private.cfg_key_array_valid(p_values text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  value text;
begin
  if p_values is null or not platform_private.cfg_array_distinct(p_values) then
    return false;
  end if;
  foreach value in array p_values loop
    if not platform_private.cfg_valid_key(value) then return false; end if;
  end loop;
  return true;
end;
$body$;

create or replace function platform_private.cfg_experiment_dimensions_allowed(
  p_dimensions text[]
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  dimension text;
begin
  if not platform_private.cfg_key_array_valid(p_dimensions) then return false; end if;
  foreach dimension in array p_dimensions loop
    if dimension ~* '(protected|private|special[._-]?category|inferred[._-]?vulnerability|vulnerab|race|ethnic|religion|health|disabil|sexual|biometric|genetic)' then
      return false;
    end if;
  end loop;
  return true;
end;
$body$;

create or replace function platform_private.cfg_experiment_allocation_valid(
  p_variants jsonb,
  p_allocation jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  allocation_entry record;
  allocation_total numeric := 0;
begin
  if p_variants is null or p_allocation is null
     or pg_catalog.jsonb_typeof(p_variants) <> 'object'
     or pg_catalog.jsonb_typeof(p_allocation) <> 'object'
     or p_variants = '{}'::jsonb or p_allocation = '{}'::jsonb
     or (select array_agg(key order by key) from pg_catalog.jsonb_each(p_variants))
        is distinct from
        (select array_agg(key order by key) from pg_catalog.jsonb_each(p_allocation)) then
    return false;
  end if;
  for allocation_entry in select key, value from pg_catalog.jsonb_each(p_allocation) loop
    if pg_catalog.jsonb_typeof(allocation_entry.value) <> 'number'
       or (allocation_entry.value::text)::numeric < 0
       or (allocation_entry.value::text)::numeric > 100 then
      return false;
    end if;
    allocation_total := allocation_total + (allocation_entry.value::text)::numeric;
  end loop;
  return allocation_total = 100;
end;
$body$;

create or replace function platform_private.cfg_kill_scopes_valid(p_scopes jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  scope_record jsonb;
  scope_type text;
begin
  if p_scopes is null or pg_catalog.jsonb_typeof(p_scopes) <> 'array'
     or pg_catalog.jsonb_array_length(p_scopes) not between 1 and 64 then
    return false;
  end if;
  for scope_record in select value from pg_catalog.jsonb_array_elements(p_scopes) loop
    if pg_catalog.jsonb_typeof(scope_record) <> 'object'
       or not (scope_record ? 'scopeType')
       or scope_record - array['scopeType','scopeId']::text[] <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(scope_record->'scopeType') <> 'string' then
      return false;
    end if;
    scope_type := scope_record->>'scopeType';
    if scope_type not in ('platform','environment','party','site','route','feature','user') then
      return false;
    end if;
    if scope_type = 'platform' then
      if scope_record ? 'scopeId' and scope_record->'scopeId' <> 'null'::jsonb then
        return false;
      end if;
    elsif not (scope_record ? 'scopeId')
       or pg_catalog.jsonb_typeof(scope_record->'scopeId') <> 'string'
       or not platform_private.cfg_valid_uuid(scope_record->>'scopeId') then
      return false;
    end if;
  end loop;
  return pg_catalog.jsonb_array_length(p_scopes) =
    (select count(distinct value) from pg_catalog.jsonb_array_elements(p_scopes));
end;
$body$;

create or replace function platform_private.cfg_kill_scope_declared(
  p_scopes jsonb,
  p_scope_type text,
  p_scope_id uuid
)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select platform_private.cfg_kill_scopes_valid(p_scopes)
     and exists (
       select 1
         from pg_catalog.jsonb_array_elements(p_scopes) scope_record
        where scope_record->>'scopeType' = p_scope_type
          and (
            (p_scope_type = 'platform' and p_scope_id is null)
            or (p_scope_type <> 'platform' and scope_record->>'scopeId' = p_scope_id::text)
          )
     );
$body$;

create or replace function platform_private.cfg_validate_value(
  p_kind text, p_schema jsonb, p_value jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  schema_type text := nullif(p_schema->>'type', '');
  value_type text := pg_catalog.jsonb_typeof(p_value);
begin
  if not platform_private.cfg_json_bounded(p_value, 8, 65536)
     or p_value is null then return false; end if;
  if schema_type is not null then
    if schema_type = 'integer' and value_type <> 'number' then return false; end if;
    if schema_type = 'number' and value_type <> 'number' then return false; end if;
    if schema_type = 'boolean' and value_type <> 'boolean' then return false; end if;
    if schema_type = 'string' and value_type <> 'string' then return false; end if;
    if schema_type = 'object' and value_type <> 'object' then return false; end if;
    if schema_type = 'array' and value_type <> 'array' then return false; end if;
  end if;
  if p_kind = 'boolean' then return value_type = 'boolean'; end if;
  if p_kind = 'integer' then
    return value_type = 'number' and (p_value::text)::numeric = trunc((p_value::text)::numeric);
  end if;
  if p_kind in ('decimal', 'percentage') then
    if value_type <> 'number' then return false; end if;
    if p_kind = 'percentage' and ((p_value::text)::numeric < 0 or (p_value::text)::numeric > 100) then return false; end if;
    return true;
  end if;
  if p_kind in ('short_text', 'enum', 'duration', 'timestamp') then
    return value_type in ('string', 'number');
  end if;
  if p_kind = 'json_object' then return value_type = 'object'; end if;
  if p_kind = 'string_list' then
    return value_type = 'array' and not exists (
      select 1 from pg_catalog.jsonb_array_elements(p_value) item
      where pg_catalog.jsonb_typeof(item) <> 'string'
    );
  end if;
  return false;
end;
$body$;

create or replace function platform_private.cfg_context_value(
  p_request jsonb, p_name text
)
returns text
language sql
stable
set search_path = ''
as $body$
  select nullif(p_request->'context'->>p_name, '');
$body$;

create or replace function platform_private.cfg_actor(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  value text;
  context_auth_user_id text := platform_private.cfg_context_value(p_request, 'authUserId');
  context_actor_person_id text := platform_private.cfg_context_value(p_request, 'actorPersonId');
  jwt_subject text := nullif(pg_catalog.current_setting('request.jwt.claim.sub', true), '');
  jwt_role text := nullif(pg_catalog.current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role = 'authenticated' then
    if not platform_private.cfg_valid_uuid(jwt_subject)
       or (context_auth_user_id is not null and context_auth_user_id <> jwt_subject)
       or (context_actor_person_id is not null and context_actor_person_id <> jwt_subject) then
      raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
    end if;
    value := jwt_subject;
  else
    -- Only the service-role Worker and migration/test owners can reach the
    -- private command surface.  Their context has already been verified at
    -- the Worker boundary; direct authenticated Data API callers are denied
    -- by the wrapper grants below.
    value := context_auth_user_id;
    if value is null then
      value := nullif(pg_catalog.current_setting('app.actor_auth_user_id', true), '');
    end if;
    if value is null then
      value := nullif(pg_catalog.current_setting('app.auth_user_id', true), '');
    end if;
  end if;
  if not platform_private.cfg_valid_uuid(value) then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from auth.users where id = value::uuid) then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  return value::uuid;
end;
$body$;

create or replace function platform_private.cfg_acting_party(
  p_request jsonb, p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  value text := platform_private.cfg_context_value(p_request, 'actingPartyId');
begin
  if value is null then value := nullif(pg_catalog.current_setting('app.acting_party_id', true), ''); end if;
  if value is null then return p_actor_id; end if;
  if not platform_private.cfg_valid_uuid(value) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  return value::uuid;
end;
$body$;

create or replace function platform_private.cfg_require_capability(
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_capability text
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  person_party_id uuid;
begin
  if p_actor_id is null
     or p_acting_party_id is null
     or p_capability is null
     or p_capability !~ '^[a-z][a-z0-9_.-]{1,127}$' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  person_party_id := platform_private.identity_actor_person(p_actor_id);
  if person_party_id is null then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from identity_private.membership_tenure tenure
      join identity_private.organization_actor_grant actor_grant
        on actor_grant.organization_id = tenure.organization_id
       and actor_grant.person_id = tenure.person_id
     where tenure.organization_id = p_acting_party_id
       and tenure.person_id = person_party_id
       and tenure.state = 'confirmed'
       and (tenure.ends_on is null or tenure.ends_on >= current_date)
       and actor_grant.capability_code = p_capability
       and actor_grant.active
       and actor_grant.valid_from <= current_date
       and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$body$;

create or replace function platform_private.cfg_require_fresh_step_up(
  p_request jsonb,
  p_max_age interval default interval '10 minutes'
)
returns void
language plpgsql
set search_path = ''
as $body$
declare
  verified_at timestamptz;
begin
  if platform_private.cfg_context_value(p_request, 'stepUpVerified') <> 'true'
     or platform_private.cfg_context_value(p_request, 'stepUpAt') is null then
    raise exception 'STEP_UP_REQUIRED' using errcode = 'P0001';
  end if;
  begin
    verified_at := platform_private.cfg_context_value(p_request, 'stepUpAt')::timestamptz;
  exception when others then
    raise exception 'STEP_UP_REQUIRED' using errcode = 'P0001';
  end;
  if verified_at > pg_catalog.clock_timestamp()
     or verified_at < pg_catalog.clock_timestamp() - p_max_age then
    raise exception 'STEP_UP_REQUIRED' using errcode = 'P0001';
  end if;
end;
$body$;

create or replace function platform_private.cfg_correlation(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  value text := platform_private.cfg_context_value(p_request, 'correlationId');
begin
  if value is null then value := nullif(pg_catalog.current_setting('app.correlation_id', true), ''); end if;
  if platform_private.cfg_valid_uuid(value) then return value::uuid; end if;
  return extensions.gen_random_uuid();
end;
$body$;

create table if not exists platform_private.cfg_release_principals (
  principal_id uuid primary key references auth.users(id),
  key_id text not null unique,
  scope text not null default 'registry-release',
  active boolean not null default true,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint cfg_release_key_check check (key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint cfg_release_scope_check check (scope = 'registry-release')
);

create or replace function platform_private.cfg_release_actor(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  requested_key_id text := platform_private.cfg_context_value(p_request, 'releasePrincipalId');
  actor uuid;
begin
  if requested_key_id is null then requested_key_id := nullif(pg_catalog.current_setting('app.release_principal_id', true), ''); end if;
  select principal.principal_id into actor
    from platform_private.cfg_release_principals principal
   where principal.key_id = requested_key_id and principal.active;
  if actor is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  return actor;
end;
$body$;

create table if not exists platform_private.cfg_setting_definition_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  definition_id uuid not null,
  key text not null,
  version_no bigint not null,
  value_kind text not null,
  schema jsonb not null,
  owner_capability text not null,
  allowed_scopes text[] not null,
  precedence text[] not null,
  merge_mode text not null,
  default_source text not null,
  default_value jsonb,
  risk_class text not null,
  approver_policy jsonb not null,
  consumer_keys text[] not null default '{}',
  sensitivity text not null,
  contract_release text not null,
  lifecycle text not null default 'active',
  hash text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  deprecated_at timestamptz,
  constraint cfg_definition_key_check check (platform_private.cfg_valid_key(key)),
  constraint cfg_definition_version_check check (version_no > 0),
  constraint cfg_definition_kind_check check (value_kind in ('boolean','integer','decimal','short_text','enum','duration','timestamp','json_object','string_list','percentage')),
  constraint cfg_definition_scopes_check check (cardinality(allowed_scopes) between 1 and 7 and platform_private.cfg_array_distinct(allowed_scopes)),
  constraint cfg_definition_precedence_check check (cardinality(precedence) between 1 and 7 and platform_private.cfg_array_distinct(precedence) and precedence <@ allowed_scopes),
  constraint cfg_definition_merge_check check (merge_mode in ('replace','append_unique','object_merge_allowlist')),
  constraint cfg_definition_default_source_check check (default_source in ('contract','literal','required')),
  constraint cfg_definition_default_check check ((default_source = 'literal' and default_value is not null) or (default_source in ('contract','required') and default_value is null)),
  constraint cfg_definition_risk_check check (risk_class in ('low','medium','high','emergency')),
  constraint cfg_definition_sensitivity_check check (sensitivity in ('public','internal','restricted')),
  constraint cfg_definition_lifecycle_check check (lifecycle in ('draft','active','deprecated','retired')),
  constraint cfg_definition_schema_check check (pg_catalog.jsonb_typeof(schema) = 'object' and platform_private.cfg_json_bounded(schema, 4, 65536)),
  constraint cfg_definition_policy_check check (platform_private.cfg_json_bounded(approver_policy, 4, 65536)),
  constraint cfg_definition_hash_check check (hash ~ '^[0-9a-f]{64}$'),
  constraint cfg_definition_release_check check (pg_catalog.length(contract_release) between 1 and 128),
  constraint cfg_definition_consumers_check check (cardinality(consumer_keys) between 0 and 64)
);

create unique index if not exists cfg_definition_version_unique
  on platform_private.cfg_setting_definition_versions(definition_id, version_no);
create index if not exists cfg_definition_key_version
  on platform_private.cfg_setting_definition_versions(key, version_no desc);
create index if not exists cfg_definition_lifecycle_risk
  on platform_private.cfg_setting_definition_versions(lifecycle, risk_class);
create index if not exists cfg_definition_owner
  on platform_private.cfg_setting_definition_versions(owner_capability);

create table if not exists platform_private.cfg_setting_value_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  definition_id uuid not null,
  definition_version_id uuid not null references platform_private.cfg_setting_definition_versions(id),
  scope_type text not null,
  scope_id uuid,
  environment text,
  typed_value jsonb not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  state text not null,
  author_person_id uuid not null references auth.users(id),
  acting_party_id uuid references platform_private.party(id),
  supersedes_id uuid references platform_private.cfg_setting_value_versions(id),
  value_hash text not null,
  version_no bigint not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint cfg_value_scope_check check (scope_type in ('platform','environment','party','site','route','feature','user')),
  constraint cfg_value_scope_shape check ((scope_type = 'platform' and scope_id is null and environment is null) or (scope_type <> 'platform')),
  constraint cfg_value_environment_check check (environment is null or pg_catalog.length(environment) between 1 and 64),
  constraint cfg_value_data_check check (platform_private.cfg_json_bounded(typed_value, 8, 65536)),
  constraint cfg_value_interval_check check (effective_to is null or effective_to > effective_from),
  constraint cfg_value_state_check check (state in ('draft','review','approved','scheduled','active','superseded','rolled_back')),
  constraint cfg_value_version_check check (version_no > 0),
  constraint cfg_value_hash_check check (value_hash ~ '^[0-9a-f]{64}$'),
  constraint cfg_value_dimension_unique unique (definition_id, scope_type, scope_id, environment, version_no)
);

create unique index if not exists cfg_value_one_active
  on platform_private.cfg_setting_value_versions(definition_id, scope_type, scope_id, environment)
  where state = 'active';
create index if not exists cfg_value_scope_lookup
  on platform_private.cfg_setting_value_versions(scope_type, scope_id, environment, effective_from);
create index if not exists cfg_value_hash_lookup
  on platform_private.cfg_setting_value_versions(value_hash);
create index if not exists cfg_value_state_time
  on platform_private.cfg_setting_value_versions(state, effective_from);

create table if not exists platform_private.cfg_config_change_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  candidate_type text not null,
  candidate_id uuid not null,
  candidate_version bigint not null,
  frozen_hash text not null,
  impact_manifest jsonb not null,
  impact_manifest_hash text not null,
  effective_context_hash text,
  rollback_value jsonb,
  rollback_hash text,
  risk_class text not null,
  required_approvals integer not null,
  state text not null,
  submitted_by uuid not null references auth.users(id),
  submitted_at timestamptz not null default pg_catalog.clock_timestamp(),
  version_no bigint not null default 1,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint cfg_review_candidate_type_check check (candidate_type in ('setting_value','feature_flag','experiment','kill_switch')),
  constraint cfg_review_candidate_version_check check (candidate_version > 0),
  constraint cfg_review_hash_check check (frozen_hash ~ '^[0-9a-f]{64}$' and impact_manifest_hash ~ '^[0-9a-f]{64}$'),
  constraint cfg_review_manifest_check check (platform_private.cfg_json_bounded(impact_manifest, 4, 65536)),
  constraint cfg_review_rollback_pair_check check (
    (rollback_value is null and rollback_hash is null)
    or (
      rollback_value is not null
      and rollback_hash ~ '^[0-9a-f]{64}$'
      and rollback_hash = platform_private.cfg_hash_json(rollback_value)
      and platform_private.cfg_json_bounded(rollback_value, 8, 65536)
    )
  ),
  constraint cfg_review_risk_check check (risk_class in ('low','medium','high','emergency')),
  constraint cfg_review_required_check check (required_approvals between 1 and 5),
  constraint cfg_review_state_check check (state in ('draft','review','approved','scheduled','active','superseded','rolled_back')),
  constraint cfg_review_version_check check (version_no > 0),
  constraint cfg_review_candidate_unique unique (candidate_id, candidate_version)
);

create index if not exists cfg_review_state_risk
  on platform_private.cfg_config_change_reviews(state, risk_class);
create index if not exists cfg_review_submitter_time
  on platform_private.cfg_config_change_reviews(submitted_by, submitted_at desc);
create index if not exists cfg_review_frozen_hash
  on platform_private.cfg_config_change_reviews(frozen_hash);

create table if not exists platform_private.cfg_config_approvals (
  review_id uuid not null references platform_private.cfg_config_change_reviews(id),
  reviewer_person_id uuid not null references auth.users(id),
  acting_party_id uuid references platform_private.party(id),
  capability text not null,
  decision text not null,
  reason text not null,
  reviewed_hash text not null,
  decided_at timestamptz not null default pg_catalog.clock_timestamp(),
  review_version bigint not null,
  primary key (review_id, reviewer_person_id),
  constraint cfg_approval_decision_check check (decision in ('approve','reject')),
  constraint cfg_approval_reason_check check (pg_catalog.length(pg_catalog.btrim(reason)) between 1 and 512),
  constraint cfg_approval_hash_check check (reviewed_hash ~ '^[0-9a-f]{64}$'),
  constraint cfg_approval_version_check check (review_version > 0)
);

create index if not exists cfg_approval_review_time
  on platform_private.cfg_config_approvals(review_id, decided_at);
create index if not exists cfg_approval_reviewer_time
  on platform_private.cfg_config_approvals(reviewer_person_id, decided_at);

create table if not exists platform_private.cfg_feature_flag_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null,
  owner_person_id uuid not null references auth.users(id),
  purpose text not null,
  environments text[] not null,
  eligibility_rule_key text not null,
  eligibility_rule_version bigint not null,
  allocation jsonb not null,
  fallback jsonb not null,
  dependencies text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  state text not null,
  version_no bigint not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint cfg_flag_key_check check (platform_private.cfg_valid_key(key)),
  constraint cfg_flag_purpose_check check (purpose = 'release_availability'),
  constraint cfg_flag_environment_check check (cardinality(environments) between 1 and 16 and platform_private.cfg_array_distinct(environments)),
  constraint cfg_flag_rule_version_check check (eligibility_rule_version > 0),
  constraint cfg_flag_rule_key_check check (platform_private.cfg_valid_key(eligibility_rule_key)),
  constraint cfg_flag_json_check check (platform_private.cfg_json_bounded(allocation, 4, 65536) and platform_private.cfg_json_bounded(fallback, 4, 65536)),
  constraint cfg_flag_payload_check check (pg_catalog.jsonb_typeof(allocation) = 'object' and allocation <> '{}'::jsonb and pg_catalog.jsonb_typeof(fallback) <> 'null'),
  constraint cfg_flag_dependencies_check check (platform_private.cfg_key_array_valid(dependencies) and not (key = any(dependencies))),
  constraint cfg_flag_interval_check check (ends_at > starts_at and expires_at >= ends_at),
  constraint cfg_flag_state_check check (state in ('draft','active','paused','expired','retired')),
  constraint cfg_flag_version_check check (version_no > 0),
  constraint cfg_flag_key_version_unique unique (key, version_no)
);
create index if not exists cfg_flag_key_state on platform_private.cfg_feature_flag_versions(key, state);
create index if not exists cfg_flag_owner_expiry on platform_private.cfg_feature_flag_versions(owner_person_id, expires_at);
create index if not exists cfg_flag_environments on platform_private.cfg_feature_flag_versions using gin(environments);

create table if not exists platform_private.cfg_experiment_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null,
  owner_person_id uuid not null references auth.users(id),
  hypothesis text not null,
  eligibility_dimensions text[] not null,
  variants jsonb not null,
  allocation jsonb not null,
  metrics text[] not null,
  consent_ref text,
  stop_rule jsonb not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  state text not null,
  version_no bigint not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint cfg_experiment_key_check check (platform_private.cfg_valid_key(key)),
  constraint cfg_experiment_hypothesis_check check (pg_catalog.length(pg_catalog.btrim(hypothesis)) between 1 and 1024),
  constraint cfg_experiment_dimensions_check check (cardinality(eligibility_dimensions) between 1 and 16 and platform_private.cfg_experiment_dimensions_allowed(eligibility_dimensions)),
  constraint cfg_experiment_metrics_check check (cardinality(metrics) between 1 and 16 and platform_private.cfg_key_array_valid(metrics)),
  constraint cfg_experiment_json_check check (platform_private.cfg_json_bounded(variants, 4, 65536) and platform_private.cfg_json_bounded(allocation, 4, 65536) and platform_private.cfg_json_bounded(stop_rule, 4, 65536)),
  constraint cfg_experiment_allocation_check check (platform_private.cfg_experiment_allocation_valid(variants, allocation)),
  constraint cfg_experiment_stop_rule_check check (pg_catalog.jsonb_typeof(stop_rule) = 'object' and stop_rule <> '{}'::jsonb),
  constraint cfg_experiment_consent_check check (state = 'draft' or (consent_ref is not null and platform_private.cfg_valid_key(consent_ref))),
  constraint cfg_experiment_interval_check check (ends_at > starts_at),
  constraint cfg_experiment_state_check check (state in ('draft','approved','running','paused','stopped','completed')),
  constraint cfg_experiment_version_check check (version_no > 0),
  constraint cfg_experiment_key_version_unique unique (key, version_no)
);
create index if not exists cfg_experiment_key_state on platform_private.cfg_experiment_versions(key, state);
create index if not exists cfg_experiment_owner_start on platform_private.cfg_experiment_versions(owner_person_id, starts_at);
create index if not exists cfg_experiment_dimensions on platform_private.cfg_experiment_versions using gin(eligibility_dimensions);

create table if not exists platform_private.cfg_kill_switch_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null,
  owner_person_id uuid not null references auth.users(id),
  allowed_scopes jsonb not null,
  fallback_mode text not null,
  runtime_contract_version bigint not null,
  state text not null,
  version_no bigint not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint cfg_switch_key_check check (platform_private.cfg_valid_key(key)),
  constraint cfg_switch_scopes_check check (platform_private.cfg_json_bounded(allowed_scopes, 4, 65536) and platform_private.cfg_kill_scopes_valid(allowed_scopes)),
  constraint cfg_switch_fallback_check check (pg_catalog.length(pg_catalog.btrim(fallback_mode)) between 1 and 128 and platform_private.cfg_valid_key(fallback_mode)),
  constraint cfg_switch_runtime_version_check check (runtime_contract_version > 0),
  constraint cfg_switch_state_check check (state in ('draft','active','retired')),
  constraint cfg_switch_version_check check (version_no > 0),
  constraint cfg_switch_key_version_unique unique (key, version_no)
);
create index if not exists cfg_switch_key_state on platform_private.cfg_kill_switch_versions(key, state);
create index if not exists cfg_switch_owner on platform_private.cfg_kill_switch_versions(owner_person_id);
create unique index if not exists cfg_switch_one_active
  on platform_private.cfg_kill_switch_versions(key) where state = 'active';

create table if not exists platform_private.cfg_kill_switch_activations (
  id uuid primary key default extensions.gen_random_uuid(),
  switch_id uuid not null references platform_private.cfg_kill_switch_versions(id),
  switch_version_id uuid not null references platform_private.cfg_kill_switch_versions(id),
  scope_type text not null,
  scope_id uuid,
  actor_person_id uuid not null references auth.users(id),
  acting_party_id uuid references platform_private.party(id),
  reason text not null,
  started_at timestamptz not null,
  ends_at timestamptz,
  canonical_state text not null,
  runtime_snapshot_hash text not null,
  incident_ref text not null,
  version_no bigint not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  resolved_at timestamptz,
  constraint cfg_switch_activation_scope_check check (scope_type in ('platform','environment','party','site','route','feature','user')),
  constraint cfg_switch_activation_reason_check check (pg_catalog.length(pg_catalog.btrim(reason)) between 1 and 512),
  constraint cfg_switch_activation_ends_check check (ends_at is null or ends_at > started_at),
  constraint cfg_switch_activation_state_check check (canonical_state in ('requested','active','resolving','ended')),
  constraint cfg_switch_activation_hash_check check (runtime_snapshot_hash ~ '^[0-9a-f]{64}$'),
  constraint cfg_switch_activation_incident_check check (pg_catalog.length(pg_catalog.btrim(incident_ref)) between 1 and 128),
  constraint cfg_switch_activation_version_check check (version_no > 0)
);
create index if not exists cfg_switch_activation_state
  on platform_private.cfg_kill_switch_activations(switch_id, canonical_state, started_at desc);
create index if not exists cfg_switch_activation_incident
  on platform_private.cfg_kill_switch_activations(incident_ref);
create index if not exists cfg_switch_activation_snapshot
  on platform_private.cfg_kill_switch_activations(runtime_snapshot_hash);
create unique index if not exists cfg_switch_activation_one_live
  on platform_private.cfg_kill_switch_activations(switch_id, scope_type, scope_id)
  where canonical_state in ('active','resolving');

create table if not exists platform_private.cfg_snapshot_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  review_id uuid references platform_private.cfg_config_change_reviews(id),
  value_version_id uuid references platform_private.cfg_setting_value_versions(id),
  requested_by uuid not null references auth.users(id),
  config_hash text not null,
  state text not null default 'pending',
  requested_at timestamptz not null default pg_catalog.clock_timestamp(),
  completed_at timestamptz,
  constraint cfg_snapshot_hash_check check (config_hash ~ '^[0-9a-f]{64}$'),
  constraint cfg_snapshot_state_check check (state in ('pending','built','failed','superseded'))
);
create index if not exists cfg_snapshot_state_time
  on platform_private.cfg_snapshot_intents(state, requested_at);

create or replace function platform_private.cfg_immutable_definition()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
end;
$body$;

drop trigger if exists cfg_definition_immutable on platform_private.cfg_setting_definition_versions;
create trigger cfg_definition_immutable
before update or delete on platform_private.cfg_setting_definition_versions
for each row execute function platform_private.cfg_immutable_definition();

create or replace function platform_private.cfg_append_only_approval()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  raise exception 'APPEND_ONLY_RECORD' using errcode = 'P0001';
end;
$body$;

drop trigger if exists cfg_approval_append_only on platform_private.cfg_config_approvals;
create trigger cfg_approval_append_only
before update or delete on platform_private.cfg_config_approvals
for each row execute function platform_private.cfg_append_only_approval();

create or replace function platform_private.cfg_append_only_control_version()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  raise exception 'APPEND_ONLY_RECORD' using errcode = 'P0001';
end;
$body$;

drop trigger if exists cfg_flag_version_append_only on platform_private.cfg_feature_flag_versions;
create trigger cfg_flag_version_append_only
before update or delete on platform_private.cfg_feature_flag_versions
for each row execute function platform_private.cfg_append_only_control_version();

drop trigger if exists cfg_experiment_version_append_only on platform_private.cfg_experiment_versions;
create trigger cfg_experiment_version_append_only
before update or delete on platform_private.cfg_experiment_versions
for each row execute function platform_private.cfg_append_only_control_version();

drop trigger if exists cfg_switch_version_append_only on platform_private.cfg_kill_switch_versions;
create trigger cfg_switch_version_append_only
before update or delete on platform_private.cfg_kill_switch_versions
for each row execute function platform_private.cfg_append_only_control_version();

create or replace function platform_private.cfg_guard_kill_activation()
returns trigger
language plpgsql
set search_path = ''
as $body$
declare
  declared_scopes jsonb;
begin
  if tg_op = 'DELETE' then
    raise exception 'APPEND_ONLY_RECORD' using errcode = 'P0001';
  end if;

  select switch_version.allowed_scopes
    into declared_scopes
    from platform_private.cfg_kill_switch_versions switch_version
    join platform_private.cfg_kill_switch_versions switch_family
      on switch_family.id = new.switch_id
     and switch_family.key = switch_version.key
   where switch_version.id = new.switch_version_id;
  if not found then raise exception 'SWITCH_NOT_FOUND' using errcode = 'P0001'; end if;
  if not platform_private.cfg_kill_scope_declared(
    declared_scopes, new.scope_type, new.scope_id
  ) then
    raise exception 'UNDECLARED_SWITCH_SCOPE' using errcode = 'P0001';
  end if;

  if tg_op = 'INSERT' then
    if new.canonical_state <> 'requested' or new.version_no <> 1
       or new.resolved_at is not null then
      raise exception 'INVALID_SWITCH_TRANSITION' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if row(
    new.switch_id, new.switch_version_id, new.scope_type, new.scope_id,
    new.actor_person_id, new.acting_party_id, new.reason, new.started_at,
    new.runtime_snapshot_hash, new.incident_ref, new.created_at
  ) is distinct from row(
    old.switch_id, old.switch_version_id, old.scope_type, old.scope_id,
    old.actor_person_id, old.acting_party_id, old.reason, old.started_at,
    old.runtime_snapshot_hash, old.incident_ref, old.created_at
  ) then
    raise exception 'IMMUTABLE_SWITCH_EVIDENCE' using errcode = 'P0001';
  end if;
  if new.version_no <> old.version_no + 1
     or not (
       (old.canonical_state = 'requested' and new.canonical_state = 'active')
       or (old.canonical_state = 'active' and new.canonical_state = 'resolving')
       or (old.canonical_state = 'resolving' and new.canonical_state = 'ended')
     ) then
    raise exception 'INVALID_SWITCH_TRANSITION' using errcode = 'P0001';
  end if;
  if new.canonical_state = 'ended' then
    if new.ends_at is null or new.resolved_at is null then
      raise exception 'INVALID_SWITCH_TRANSITION' using errcode = 'P0001';
    end if;
  elsif new.resolved_at is not null then
    raise exception 'INVALID_SWITCH_TRANSITION' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

drop trigger if exists cfg_kill_activation_guard on platform_private.cfg_kill_switch_activations;
create trigger cfg_kill_activation_guard
before insert or update or delete on platform_private.cfg_kill_switch_activations
for each row execute function platform_private.cfg_guard_kill_activation();

-- All configuration authority tables are forced RLS boundaries.  RPCs run with
-- a trusted transaction marker; direct table access remains unavailable.
do $body$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cfg_release_principals',
    'cfg_setting_definition_versions',
    'cfg_setting_value_versions',
    'cfg_config_change_reviews',
    'cfg_config_approvals',
    'cfg_feature_flag_versions',
    'cfg_experiment_versions',
    'cfg_kill_switch_versions',
    'cfg_kill_switch_activations',
    'cfg_snapshot_intents'
  ] loop
    execute format('alter table platform_private.%I enable row level security', table_name);
    execute format('alter table platform_private.%I force row level security', table_name);
    execute format('drop policy if exists %I on platform_private.%I', table_name || '_worker_policy', table_name);
    execute format(
      'create policy %I on platform_private.%I for all to service_role using (current_setting(''app.cfg_rpc'', true) = ''true'') with check (current_setting(''app.cfg_rpc'', true) = ''true'')',
      table_name || '_worker_policy', table_name
    );
    execute format('revoke all on table platform_private.%I from public, anon, authenticated, service_role', table_name);
  end loop;
end;
$body$;

-- Extend the BE00 outbox payload allow-list with identifier-only configuration
-- events while retaining all earlier identity, profile and operational rules.
create or replace function platform_private.valid_base_event_payload(
  event_type text, schema_version integer, payload jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  identifier text;
begin
  if event_type = 'config.definition.registered.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['definitionId','definitionVersionId','version']::text[]
      and payload - array['definitionId','definitionVersionId','version']::text[] = '{}'::jsonb
      and (payload->>'definitionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'definitionVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'version') ~ '^[1-9][0-9]{0,18}$';
  elsif event_type = 'config.value.resolved.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['definitionId','definitionVersionId','valueVersionId']::text[]
      and payload - array['definitionId','definitionVersionId','valueVersionId']::text[] = '{}'::jsonb
      and (payload->>'definitionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'definitionVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and ((payload->>'valueVersionId') is null
        or (payload->>'valueVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  elsif event_type = 'config.change.proposed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['reviewId','candidateId','candidateVersion']::text[]
      and payload - array['reviewId','candidateId','candidateVersion']::text[] = '{}'::jsonb
      and (payload->>'reviewId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'candidateId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'candidateVersion') ~ '^[1-9][0-9]{0,18}$';
  elsif event_type = 'config.change.transitioned.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['reviewId','resultingValueVersionId','snapshotIntentId']::text[]
      and payload - array['reviewId','resultingValueVersionId','snapshotIntentId']::text[] = '{}'::jsonb
      and (payload->>'reviewId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and ((payload->>'resultingValueVersionId') is null
        or (payload->>'resultingValueVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
      and ((payload->>'snapshotIntentId') is null
        or (payload->>'snapshotIntentId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  elsif event_type = 'config.setting.activated.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['definitionId','valueVersionId','scopeType','scopeId']::text[]
      and payload - array['definitionId','valueVersionId','scopeType','scopeId']::text[] = '{}'::jsonb
      and (payload->>'definitionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'valueVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'scopeType') in ('platform','environment','party','site','route','feature','user')
      and ((payload->>'scopeId') is null or (payload->>'scopeId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  elsif event_type = 'config.flag.changed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['flagId','flagVersionId']::text[]
      and payload - array['flagId','flagVersionId']::text[] = '{}'::jsonb
      and (payload->>'flagId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'flagVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'config.kill-switch.changed.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['switchId','switchVersionId','activationId']::text[]
      and payload - array['switchId','switchVersionId','activationId']::text[] = '{}'::jsonb
      and (payload->>'switchId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'switchVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'activationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'profile.projection.invalidated.v1' then
    return schema_version = 1
      and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['partyId','sourceType','sourceId','sourceVersion','reason']::text[]
      and payload - array['partyId','sourceType','sourceId','sourceVersion','reason']::text[] = '{}'::jsonb
      and (payload->>'partyId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'sourceId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'sourceType') ~ '^[a-z][a-z0-9_.-]{1,63}$'
      and pg_catalog.jsonb_typeof(payload->'sourceVersion') = 'number'
      and (payload->>'sourceVersion') ~ '^[1-9][0-9]{0,18}$'
      and (payload->>'reason') in ('source_changed','section_changed','emphasis_changed','reel_changed','party_lifecycle_changed');
  elsif event_type = 'identity.organization.changed.v1' then
    return schema_version = 1 and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ? 'organizationId' and payload - array['organizationId']::text[] = '{}'::jsonb
      and (payload->>'organizationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.relationship.changed.v1' then
    return schema_version = 1 and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['relationshipType','relationshipId']::text[]
      and payload - array['relationshipType','relationshipId']::text[] = '{}'::jsonb
      and pg_catalog.jsonb_typeof(payload->'relationshipType') = 'string'
      and (payload->>'relationshipId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.acting-context.revoked.v1' then
    return schema_version = 1 and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['personId','partyId','relationshipId']::text[]
      and payload - array['personId','partyId','relationshipId']::text[] = '{}'::jsonb
      and (payload->>'personId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'partyId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'relationshipId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  elsif event_type = 'identity.governance.activated.v1' then
    return schema_version = 1 and pg_catalog.jsonb_typeof(payload) = 'object'
      and payload ?& array['organizationId','termsVersionId']::text[]
      and payload - array['organizationId','termsVersionId']::text[] = '{}'::jsonb
      and (payload->>'organizationId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (payload->>'termsVersionId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  end if;

  if event_type not in ('job.requested','object.uploaded','provider.operation.requested','webhook.accepted')
     or schema_version <> 1 then return true; end if;
  if pg_catalog.jsonb_typeof(payload) <> 'object' then return false; end if;
  if event_type = 'job.requested' then
    if not (payload ?& array['jobType','jobId']::text[]) or payload - array['jobType','jobId']::text[] <> '{}'::jsonb
       or pg_catalog.jsonb_typeof(payload->'jobType') <> 'string'
       or payload->>'jobType' !~ '^[a-z0-9][a-z0-9._-]{0,127}$' then return false; end if;
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
  return pg_catalog.jsonb_typeof(payload->(
      case when event_type = 'job.requested' then 'jobId'
           when event_type = 'object.uploaded' then 'objectId'
           when event_type = 'provider.operation.requested' then 'operationId'
           else 'receiptId' end
    )) = 'string'
    and identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
end;
$body$;

commit;
